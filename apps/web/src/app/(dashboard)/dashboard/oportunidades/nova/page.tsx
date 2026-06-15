"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { OpportunityForm } from "@/modules/opportunities/components/opportunity-form";
import { opportunitiesService } from "@/services/opportunities/opportunities.service";

export default function NovaOportunidadePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/oportunidades" className="hover:underline">
            Oportunidades
          </Link>
          {" / "}Nova oportunidade
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Publicar oportunidade</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre uma oferta, demanda ou compartilhamento de ativos para a economia circular.
        </p>
      </div>

      <OpportunityForm
        mode="create"
        submitLabel="Publicar oportunidade"
        onSubmit={async (payload) => {
          const opportunity = await opportunitiesService.create(payload);
          toast.success("Oportunidade publicada com sucesso.");
          router.push(`/dashboard/oportunidades/${opportunity.id}` as Route);
        }}
      />
    </div>
  );
}
