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
import { FileText } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { DocumentStatusBadge } from "@/modules/companies/components/document-status-badge";
import {
  COMPLIANCE_ACCEPT,
  MAX_COMPLIANCE_BYTES,
  isAllowedComplianceFile,
} from "@/modules/companies/schemas";
import { companiesService } from "@/services/companies/companies.service";
import type { Company, CompanyComplianceFile } from "@/types/api";
import { ApiError } from "@/utils/errors";

type SignatureAuthorizationCardProps = {
  company: Company;
  required: boolean;
  onUpdated: (company: Company) => void;
};

export function SignatureAuthorizationCard({
  company,
  required,
  onUpdated,
}: SignatureAuthorizationCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const file = company.signature_authorization;
  const rejected = file?.status === "rejected";
  const approved = file?.status === "approved";

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
      const updated = await companiesService.uploadDocument(
        company.id,
        "signature_authorization",
        fileToUpload,
      );
      toast.success(
        isResend ? "Documento reenviado para análise." : "Documento enviado para análise.",
      );
      onUpdated(updated);
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" aria-hidden />
          <CardTitle className="text-base">
            Documento de Autorização de Assinatura (Procuração/Contrato Social)
            {required ? " *" : ""}
          </CardTitle>
        </div>
        <CardDescription>
          Envie um documento que comprove que você possui autorização legal para assinar em nome
          da sua empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {file ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
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
            {approved ? null : rejected ? null : (
              <p className="text-xs text-muted-foreground">
                O documento está em análise. Você será notificado após a validação.
              </p>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Não enviado</span>
              <Badge variant="warning">Pendente</Badge>
            </div>
            <FilePicker buttonLabel="Anexar documento" isResend={false} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function isSignatureAuthorizationApproved(
  file?: CompanyComplianceFile | null,
): boolean {
  return file?.status === "approved";
}
