"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { CompanyDetailView } from "@/modules/companies/components/company-detail-view";
import { companiesService } from "@/services/companies/companies.service";
import type { Company } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await companiesService.list();
      setCompanies(data);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar as empresas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  const company = companies[0];
  if (!company) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Empresa</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os dados da empresa vinculada à sua conta.
          </p>
        </div>
        <EmptyState
          icon={Building2}
          title="Nenhuma empresa cadastrada"
          description="Cadastre sua empresa para começar a gerenciar seus dados."
          action={
            <Link href="/dashboard/empresas/nova" className="inline-flex">
              <Button>Cadastrar empresa</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <CompanyDetailView company={company} onUpdated={(updated) => setCompanies([updated])} />;
}
