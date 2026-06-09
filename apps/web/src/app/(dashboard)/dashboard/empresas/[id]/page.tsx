"use client";

import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CompanyDetailView } from "@/modules/companies/components/company-detail-view";
import { companiesService } from "@/services/companies/companies.service";
import type { Company } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EmpresaDetalhePage() {
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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard/empresas" className="hover:underline">
          Empresas
        </Link>
        {" / "}
        {company.legal_name}
      </p>

      <CompanyDetailView
        company={company}
        onDeleted={() => router.push("/dashboard/empresas")}
      />
    </div>
  );
}
