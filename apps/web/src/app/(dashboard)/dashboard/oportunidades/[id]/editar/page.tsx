"use client";

import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { OpportunityForm } from "@/modules/opportunities/components/opportunity-form";
import { opportunitiesService } from "@/services/opportunities/opportunities.service";
import type { Opportunity } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EditarOportunidadePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOpportunity = useCallback(async () => {
    setLoading(true);
    try {
      const data = await opportunitiesService.get(params.id);
      setOpportunity(data);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar a oportunidade.",
      );
      router.push("/dashboard/oportunidades");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    void loadOpportunity();
  }, [loadOpportunity]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!opportunity) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/oportunidades" className="hover:underline">
            Oportunidades
          </Link>
          {" / "}
          <Link href={`/dashboard/oportunidades/${opportunity.id}` as Route} className="hover:underline">
            {opportunity.title}
          </Link>
          {" / "}Editar
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Editar oportunidade</h1>
        <p className="text-sm text-muted-foreground">
          Atualize as informações da sua publicação.
        </p>
      </div>

      <OpportunityForm
        mode="edit"
        initialData={opportunity}
        submitLabel="Salvar alterações"
        onSubmit={async (payload) => {
          await opportunitiesService.update(opportunity.id, payload);
          toast.success("Oportunidade atualizada com sucesso.");
          router.push(`/dashboard/oportunidades/${opportunity.id}` as Route);
        }}
      />
    </div>
  );
}
