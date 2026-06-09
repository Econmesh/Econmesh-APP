"use client";

import { Button } from "@econmesh-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import { Building2, Eye, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { DeleteCompanyDialog } from "@/modules/companies/components/delete-company-dialog";
import { formatCnpj } from "@/modules/companies/schemas";
import type { Company } from "@/types/api";

type CompanyListProps = {
  companies: Company[];
  onDeleted: () => void;
};

export function CompanyList({ companies, onDeleted }: CompanyListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Nenhuma empresa cadastrada"
        description="Cadastre sua primeira empresa para começar a gerenciar seus dados."
        action={
          <Link href="/dashboard/empresas/nova" className="inline-flex">
            <Button>Adicionar empresa</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="rounded-xl">
            <CardHeader className="flex-row items-start gap-4">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
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
                    <Building2 className="size-5 text-muted-foreground" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">{company.legal_name}</CardTitle>
                <CardDescription className="truncate">
                  {company.trade_name || "Sem nome fantasia"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">CNPJ</dt>
                  <dd>{formatCnpj(company.tax_id)}</dd>
                </div>
                {company.email ? (
                  <div>
                    <dt className="text-xs text-muted-foreground">E-mail</dt>
                    <dd className="truncate">{company.email}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/empresas/${company.id}`} className="inline-flex">
                  <Button size="sm" variant="outline">
                    <Eye className="size-4" aria-hidden />
                    Ver
                  </Button>
                </Link>
                <Link href={`/dashboard/empresas/${company.id}/editar`} className="inline-flex">
                  <Button size="sm" variant="outline">
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteTarget(company)}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deleteTarget ? (
        <DeleteCompanyDialog
          company={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={onDeleted}
        />
      ) : null}
    </>
  );
}
