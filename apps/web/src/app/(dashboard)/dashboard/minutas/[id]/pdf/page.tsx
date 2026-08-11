"use client";

import { Button } from "@econmesh-app/ui/components/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { contractProposalsService } from "@/services/contract-proposals/contract-proposals.service";
import type { ContractProposal } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function MinutaPdfPage() {
  const params = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<ContractProposal | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contractProposalsService.get(params.id);
      setProposal(data);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar o PDF.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando PDF...</p>;
  }

  if (!proposal?.pdf_file) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">PDF ainda não gerado.</p>
        <Link href={`/dashboard/minutas/${params.id}`}>
          <Button variant="outline">Voltar à minuta</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={`/dashboard/minutas/${params.id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar à minuta
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">PDF da minuta</h1>
        </div>
        <a
          href={proposal.pdf_file.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Abrir em nova aba
        </a>
      </div>
      <iframe
        title="PDF da minuta"
        src={proposal.pdf_file.url}
        className="h-[80vh] w-full rounded-xl border border-border"
      />
    </div>
  );
}
