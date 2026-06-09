"use client";

import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CompanyForm } from "@/modules/companies/components/company-form";
import { companiesService } from "@/services/companies/companies.service";
import type { Company } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EditarEmpresaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCompany = useCallback(async () => {
    setLoading(true);
    try {
      const data = await companiesService.get(params.id);
      setCompany(data);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar a empresa.",
      );
      router.push("/dashboard/empresas");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/empresas" className="hover:underline">
            Empresas
          </Link>
          {" / "}
          <Link href={`/dashboard/empresas/${company.id}`} className="hover:underline">
            {company.legal_name}
          </Link>
          {" / "}Editar
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Editar empresa</h1>
        <p className="text-sm text-muted-foreground">
          Atualize os dados da empresa.
        </p>
      </div>

      <CompanyForm
        mode="edit"
        initialData={company}
        submitLabel="Salvar alterações"
        onSubmit={async (payload) => {
          await companiesService.update(company.id, payload);
          toast.success("Empresa atualizada com sucesso.");
          router.push(`/dashboard/empresas/${company.id}`);
        }}
      />
    </div>
  );
}
