"use client";

import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { OpportunityDetailView } from "@/modules/opportunities/components/opportunity-detail-view";
import { useAuth } from "@/hooks/use-auth";
import { opportunitiesService } from "@/services/opportunities/opportunities.service";
import type { Opportunity } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function OportunidadeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
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
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!opportunity) return null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard/oportunidades" className="hover:underline">
          Oportunidades
        </Link>
        {" / "}
        <span className="text-foreground">{opportunity.title}</span>
      </p>

      <OpportunityDetailView
        opportunity={opportunity}
        isOwner={user?.id === opportunity.owner_user_id}
        onDeleted={() => router.push("/dashboard/oportunidades" as Route)}
      />
    </div>
  );
}
