"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Button } from "@econmesh-app/ui/components/button";
import { Textarea } from "@econmesh-app/ui/components/textarea";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useConversations } from "@/contexts/conversations-context";
import { useAuth } from "@/hooks/use-auth";
import { ConversationMessageThread } from "@/modules/conversations/components/conversation-message-thread";
import { useConversationMessagesRealtime } from "@/modules/conversations/hooks/use-conversation-messages-realtime";
import { messagesFingerprint } from "@/modules/conversations/conversation-realtime";
import { conversationsService } from "@/services/conversations/conversations.service";
import type { Conversation, ConversationMessage } from "@/types/api";
import { ApiError } from "@/utils/errors";

type ConversationDetailViewProps = {
  conversationId: string;
};

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  closed: "Encerrada",
};

export function ConversationDetailView({ conversationId }: ConversationDetailViewProps) {
  const { user } = useAuth();
  const { dismissAlertsForConversation } = useConversations();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(messages);
  const fingerprintRef = useRef("");
  messagesRef.current = messages;

  const fetchMessages = useCallback(async () => {
    const data = await conversationsService.listMessages(conversationId);
    return data.items;
  }, [conversationId]);

  const loadConversation = useCallback(async () => {
    const data = await conversationsService.get(conversationId);
    setConversation(data);
    return data;
  }, [conversationId]);

  const loadMessages = useCallback(
    async (markRead = false) => {
      if (markRead) {
        const data = await conversationsService.markMessagesRead(conversationId);
        fingerprintRef.current = messagesFingerprint(data.items);
        setMessages(data.items);
        return;
      }
      const data = await conversationsService.listMessages(conversationId);
      fingerprintRef.current = messagesFingerprint(data.items);
      setMessages(data.items);
    },
    [conversationId],
  );

  const load = useCallback(async () => {
    try {
      await loadConversation();
      await loadMessages(true);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar a conversa.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadConversation, loadMessages]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    dismissAlertsForConversation(conversationId);
  }, [conversationId, dismissAlertsForConversation]);

  const markCounterpartRead = useCallback(async () => {
    const data = await conversationsService.markMessagesRead(conversationId);
    fingerprintRef.current = messagesFingerprint(data.items);
    setMessages(data.items);
  }, [conversationId]);

  useConversationMessagesRealtime({
    conversationId,
    messagesRef,
    setMessages,
    fetchMessages,
    fetchConversation: loadConversation,
    onIncomingMessage: markCounterpartRead,
    currentUserId: user?.id,
  });

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || conversation?.status === "closed") return;

    setSending(true);
    try {
      const sent = await conversationsService.sendMessage(conversationId, body.trim());
      setBody("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        const next = [...prev, sent];
        fingerprintRef.current = messagesFingerprint(next);
        return next;
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível enviar a mensagem.",
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando conversa...</p>;
  }

  if (!conversation) {
    return (
      <p className="text-sm text-muted-foreground">
        Conversa não encontrada.{" "}
        <Link href="/dashboard/conversas" className="text-primary underline">
          Voltar
        </Link>
      </p>
    );
  }

  const isClosed = conversation.status === "closed";
  const counterpart =
    conversation.counterpart_company_name ??
    (conversation.my_role === "offerer"
      ? conversation.interested_company_name
      : conversation.offerer_company_name);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/conversas"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar às conversas
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {conversation.opportunity_title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Com {counterpart}
          </p>
          <Link
            href={`/dashboard/oportunidades/${conversation.opportunity_id}`}
            className="mt-1 inline-block text-xs text-primary hover:underline"
          >
            Ver oportunidade
          </Link>
        </div>
        <Badge variant={isClosed ? "secondary" : "default"}>
          {STATUS_LABELS[conversation.status] ?? conversation.status}
        </Badge>
      </div>

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-1 overflow-y-auto">
          <ConversationMessageThread
            messages={messages}
            currentUserId={user?.id}
            autoScroll
          />
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
            Esta conversa foi encerrada.
          </p>
        )}
      </div>
    </div>
  );
}
