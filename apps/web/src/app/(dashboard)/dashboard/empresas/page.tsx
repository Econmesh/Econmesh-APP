"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CompanyList } from "@/modules/companies/components/company-list";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as empresas vinculadas à sua conta.
          </p>
        </div>
        <Link href="/dashboard/empresas/nova" className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Adicionar empresa
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <CompanyList companies={companies} onDeleted={loadCompanies} />
      )}
    </div>
  );
}
