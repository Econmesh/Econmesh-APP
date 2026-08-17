"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Button } from "@econmesh-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import { Building2, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { DocumentStatusBadge } from "@/modules/companies/components/document-status-badge";
import {
  COMPLIANCE_ACCEPT,
  MAX_COMPLIANCE_BYTES,
  formatCep,
  formatCnpj,
  formatPhone,
  isAllowedComplianceFile,
} from "@/modules/companies/schemas";
import { companiesService } from "@/services/companies/companies.service";
import type { Company, CompanyComplianceFile, CompanyDocumentKind } from "@/types/api";
import { ApiError } from "@/utils/errors";

type CompanyDetailViewProps = {
  company: Company;
  onUpdated?: (company: Company) => void;
};

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

function DocumentItem({
  companyId,
  kind,
  label,
  file,
  onUpdated,
}: {
  companyId: string;
  kind: CompanyDocumentKind;
  label: string;
  file?: CompanyComplianceFile | null;
  onUpdated?: (company: Company) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const rejected = file?.status === "rejected";

  async function handleFile(fileToUpload: File, isResend: boolean) {
    if (!isAllowedComplianceFile(fileToUpload)) {
      toast.error("Use PDF, JPEG ou PNG.");
      return;
    }
    if (fileToUpload.size > MAX_COMPLIANCE_BYTES) {
      toast.error("Arquivo deve ter no máximo 10 MB.");
      return;
    }
    setUploading(true);
    try {
      const updated = await companiesService.uploadDocument(companyId, kind, fileToUpload);
      toast.success(
        isResend ? "Documento reenviado para análise." : "Documento enviado para análise.",
      );
      onUpdated?.(updated);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : isResend
            ? "Não foi possível reenviar o documento."
            : "Não foi possível enviar o documento.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function FilePicker({ buttonLabel, isResend }: { buttonLabel: string; isResend: boolean }) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={COMPLIANCE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void handleFile(selected, isResend);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Enviando..." : buttonLabel}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 space-y-2 text-sm">
        {file ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={file.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {file.filename}
              </a>
              <DocumentStatusBadge file={file} />
            </div>
            {rejected && file.rejection_reason ? (
              <p className="text-xs text-destructive">Motivo: {file.rejection_reason}</p>
            ) : null}
            {rejected ? <FilePicker buttonLabel="Enviar novamente" isResend /> : null}
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Não enviado</span>
              <Badge variant="warning">Pendente</Badge>
            </div>
            <FilePicker buttonLabel="Anexar" isResend={false} />
          </div>
        )}
      </dd>
    </div>
  );
}

export function CompanyDetailView({ company, onUpdated }: CompanyDetailViewProps) {
  const address = company.address;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="relative size-16 overflow-hidden rounded-xl border border-border bg-muted">
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt={`Logo de ${company.legal_name}`}
                fill
                className="object-contain p-1"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Building2 className="size-6 text-muted-foreground" aria-hidden />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{company.legal_name}</h1>
            <p className="text-muted-foreground">
              {company.trade_name || "Sem nome fantasia"}
            </p>
          </div>
        </div>

        <Link href={`/dashboard/empresas/${company.id}/editar`} className="inline-flex">
          <Button variant="outline">
            <Pencil className="size-4" aria-hidden />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Dados básicos</CardTitle>
              <CardDescription>Informações principais da empresa.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="CNPJ" value={formatCnpj(company.tax_id)} />
                <DetailItem label="E-mail" value={company.email} />
                <DetailItem label="Telefone" value={company.phone ? formatPhone(company.phone) : null} />
                <DetailItem label="Setor" value={company.sector} />
                <DetailItem label="País" value={company.country} />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização da sede.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="CEP"
                  value={address?.postal_code ? formatCep(address.postal_code) : null}
                />
                <DetailItem label="Rua" value={address?.street} />
                <DetailItem label="Número" value={address?.number} />
                <DetailItem label="Complemento" value={address?.complement} />
                <DetailItem label="Bairro" value={address?.neighborhood} />
                <DetailItem label="Cidade" value={address?.city} />
                <DetailItem label="Estado" value={address?.state} />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-xl lg:col-span-2">
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                Licença de operação, comprovante MTR e autorização de assinatura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DocumentItem
                  companyId={company.id}
                  kind="operating_license"
                  label="Licença de operação"
                  file={company.operating_license}
                  onUpdated={onUpdated}
                />
                <DocumentItem
                  companyId={company.id}
                  kind="mtr"
                  label="MTR"
                  file={company.mtr_document}
                  onUpdated={onUpdated}
                />
                <DocumentItem
                  companyId={company.id}
                  kind="signature_authorization"
                  label="Autorização de assinatura"
                  file={company.signature_authorization}
                  onUpdated={onUpdated}
                />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-xl lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.website ? (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Site</dt>
                  <dd className="mt-1 text-sm">
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {company.website}
                    </a>
                  </dd>
                </div>
              ) : null}
              <DetailItem label="Descrição" value={company.description} />
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
