"use client";

import { useParams } from "next/navigation";

import { MinutaDetailView } from "@/modules/minutas/components/minuta-detail-view";

export default function MinutaDetailPage() {
  const params = useParams<{ id: string }>();
  return <MinutaDetailView proposalId={params.id} />;
}
