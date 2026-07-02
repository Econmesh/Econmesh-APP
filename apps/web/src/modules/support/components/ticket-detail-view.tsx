"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Button } from "@econmesh-app/ui/components/button";
import { Textarea } from "@econmesh-app/ui/components/textarea";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useSupport } from "@/contexts/support-context";
import { useAuth } from "@/hooks/use-auth";
import { MessageThread } from "@/modules/support/components/message-thread";
import { useTicketMessagesRealtime } from "@/modules/support/hooks/use-ticket-messages-realtime";
import { SUPPORT_STATUS_LABELS } from "@/modules/support/schemas";
import { messagesFingerprint } from "@/modules/support/support-realtime";
import { formatTicketNumber, supportService } from "@/services/support/support.service";
import type { SupportMessage, SupportTicket } from "@/types/api";
import { ApiError } from "@/utils/errors";

type TicketDetailViewProps = {
  ticketId: string;
};

export function TicketDetailView({ ticketId }: TicketDetailViewProps) {
  const { user } = useAuth();
  const { dismissAlertsForTicket } = useSupport();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(messages);
  const fingerprintRef = useRef("");
  messagesRef.current = messages;

  const fetchMessages = useCallback(async () => {
    const data = await supportService.listMessages(ticketId);
    return data.items;
  }, [ticketId]);

  const loadTicket = useCallback(async () => {
    const ticketData = await supportService.get(ticketId);
    setTicket(ticketData);
    return ticketData;
  }, [ticketId]);

  const loadMessages = useCallback(async (markRead = false) => {
    if (markRead) {
      const data = await supportService.markMessagesRead(ticketId);
      fingerprintRef.current = messagesFingerprint(data.items);
      setMessages(data.items);
      return;
    }
    const data = await supportService.listMessages(ticketId);
    fingerprintRef.current = messagesFingerprint(data.items);
    setMessages(data.items);
  }, [ticketId]);

  const load = useCallback(async () => {
    try {
      await loadTicket();
      await loadMessages(true);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível carregar o chamado.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadTicket, loadMessages]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    dismissAlertsForTicket(ticketId);
  }, [ticketId, dismissAlertsForTicket]);

  const markAdminRepliesRead = useCallback(async () => {
    const data = await supportService.markMessagesRead(ticketId);
    fingerprintRef.current = messagesFingerprint(data.items);
    setMessages(data.items);
  }, [ticketId]);

  useTicketMessagesRealtime({
    ticketId,
    messagesRef,
    setMessages,
    fetchMessages,
    fetchTicket: loadTicket,
    onIncomingAdminReply: markAdminRepliesRead,
  });

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || ticket?.status === "closed") return;

    setSending(true);
    try {
      const sent = await supportService.sendMessage(ticketId, body.trim());
      setBody("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        const next = [...prev, sent];
        fingerprintRef.current = messagesFingerprint(next);
        return next;
      });
      toast.success("Mensagem enviada.", {
        description: "Nossa equipe responderá em breve.",
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível enviar a mensagem.",
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando chamado...</p>;
  }

  if (!ticket) {
    return (
      <p className="text-sm text-muted-foreground">
        Chamado não encontrado.{" "}
        <Link href="/dashboard/suporte" className="text-primary underline">
          Voltar
        </Link>
      </p>
    );
  }

  const isClosed = ticket.status === "closed";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/suporte"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar aos chamados
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {formatTicketNumber(ticket.ticket_number)} — {ticket.subject}
          </h1>
        </div>
        <Badge variant={isClosed ? "secondary" : "default"}>
          {SUPPORT_STATUS_LABELS[ticket.status] ?? ticket.status}
        </Badge>
      </div>

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-1 overflow-y-auto">
          <MessageThread messages={messages} currentUserId={user?.id} autoScroll />
        </div>
        {!isClosed ? (
          <form
            onSubmit={handleSend}
            className="flex gap-2 border-t border-border bg-muted/30 p-3"
          >
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva sua mensagem..."
              rows={2}
              className="min-h-[60px] resize-none"
              maxLength={5000}
            />
            <Button type="submit" disabled={sending || !body.trim()} className="self-end">
              Enviar
            </Button>
          </form>
        ) : (
          <p className="border-t border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Este chamado foi encerrado. Você pode ler o histórico, mas não enviar novas mensagens.
          </p>
        )}
      </div>
    </div>
  );
}
