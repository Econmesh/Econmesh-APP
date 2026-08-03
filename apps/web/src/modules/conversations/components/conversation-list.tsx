"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import Link from "next/link";

import type { Conversation } from "@/types/api";

type ConversationListProps = {
  conversations: Conversation[];
};

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  closed: "Encerrada",
};

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Você ainda não tem conversas. Inicie uma pelo detalhe de uma oportunidade.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/dashboard/conversas/${conversation.id}`}
          className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{conversation.opportunity_title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {conversation.counterpart_company_name ??
                  `${conversation.offerer_company_name} × ${conversation.interested_company_name}`}
              </p>
            </div>
            <Badge variant={conversation.status === "closed" ? "secondary" : "default"}>
              {STATUS_LABELS[conversation.status] ?? conversation.status}
            </Badge>
          </div>
          {conversation.last_message_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              Última mensagem{" "}
              {new Date(conversation.last_message_at).toLocaleString("pt-BR")}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
