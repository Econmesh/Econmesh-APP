"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { TicketList } from "@/modules/support/components/ticket-list";
import { supportService } from "@/services/support/support.service";
import type { SupportTicket } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function SuportePage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supportService.list({ page: 1, page_size: 50 });
      setTickets(data.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível carregar os chamados.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Suporte</h1>
          <p className="text-sm text-muted-foreground">
            Abra chamados e acompanhe o atendimento da nossa equipe.
          </p>
        </div>
        <Link href="/dashboard/suporte/novo" className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Novo chamado
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <TicketList tickets={tickets} />
      )}
    </div>
  );
}
