"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import Link from "next/link";

import { formatTicketNumber } from "@/services/support/support.service";
import { SUPPORT_STATUS_LABELS } from "@/modules/support/schemas";
import type { SupportTicket } from "@/types/api";

type TicketListProps = {
  tickets: SupportTicket[];
};

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Você ainda não abriu nenhum chamado de suporte.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/dashboard/suporte/${ticket.id}`}
          className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {formatTicketNumber(ticket.ticket_number)}
              </p>
              <p className="font-medium">{ticket.subject}</p>
            </div>
            <Badge variant={ticket.status === "closed" ? "secondary" : "default"}>
              {SUPPORT_STATUS_LABELS[ticket.status] ?? ticket.status}
            </Badge>
          </div>
          {ticket.last_responder_admin_name && (
            <p className="mt-2 text-xs text-muted-foreground">
              Atendido por {ticket.last_responder_admin_name}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
