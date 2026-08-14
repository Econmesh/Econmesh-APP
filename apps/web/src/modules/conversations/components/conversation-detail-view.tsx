"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Button } from "@econmesh-app/ui/components/button";
import { Textarea } from "@econmesh-app/ui/components/textarea";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useConversations } from "@/contexts/conversations-context";
import { useAuth } from "@/hooks/use-auth";
import { ConversationMessageThread } from "@/modules/conversations/components/conversation-message-thread";
import { useConversationMessagesRealtime } from "@/modules/conversations/hooks/use-conversation-messages-realtime";
import { messagesFingerprint } from "@/modules/conversations/conversation-realtime";
import { conversationsService } from "@/services/conversations/conversations.service";
import { contractProposalsService } from "@/services/contract-proposals/contract-proposals.service";
import type {
  ContractProposalListItem,
  Conversation,
  ConversationMessage,
} from "@/types/api";
import { ApiError } from "@/utils/errors";

type ConversationDetailViewProps = {
  conversationId: string;
};

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  closed: "Encerrada",
};

type ModalKind =
  | "close"
  | "request_reopen"
  | "request_new_contact"
  | "respond_reopen"
  | "respond_new_contact"
  | null;

export function ConversationDetailView({ conversationId }: ConversationDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { dismissAlertsForConversation } = useConversations();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [proposal, setProposal] = useState<ContractProposalListItem | null>(null);
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [modalText, setModalText] = useState("");
  const [acting, setActing] = useState(false);
  const [showCloseRecommendation, setShowCloseRecommendation] = useState(false);
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
    if (data.replaced_by_conversation_id && data.id === conversationId) {
      // Keep viewing history; CTA will link to the new thread.
    }
    return data;
  }, [conversationId]);

  const loadProposal = useCallback(async () => {
    try {
      const data = await contractProposalsService.list({
        conversation_id: conversationId,
        page_size: 1,
      });
      setProposal(data.items[0] ?? null);
    } catch {
      setProposal(null);
    }
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
      await Promise.all([loadMessages(true), loadProposal()]);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar a conversa.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadConversation, loadMessages, loadProposal]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    dismissAlertsForConversation(conversationId);
  }, [conversationId, dismissAlertsForConversation]);

  useEffect(() => {
    if (searchParams.get("recommendClose") === "1") {
      setShowCloseRecommendation(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (proposal?.status === "rejected" && conversation?.status !== "closed") {
      setShowCloseRecommendation(true);
    }
  }, [proposal?.status, conversation?.status]);

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

  async function refreshAfterAction(updated: Conversation) {
    setConversation(updated);
    if (updated.id !== conversationId) {
      toast.success("Novo contato criado.");
      router.push(`/dashboard/conversas/${updated.id}`);
      return;
    }
    await loadMessages(false);
    if (
      updated.replaced_by_conversation_id &&
      updated.replaced_by_conversation_id !== conversationId
    ) {
      toast.success("Novo contato criado.");
      router.push(`/dashboard/conversas/${updated.replaced_by_conversation_id}`);
    }
  }

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

  async function handleProposeAgreement() {
    if (proposal) {
      router.push(`/dashboard/minutas/${proposal.id}`);
      return;
    }
    setCreatingProposal(true);
    try {
      const created = await contractProposalsService.create({
        conversation_id: conversationId,
        contract_type: "servico",
      });
      toast.success("Minuta criada.");
      router.push(`/dashboard/minutas/${created.id}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível criar a minuta.",
      );
    } finally {
      setCreatingProposal(false);
    }
  }

  async function handleModalConfirm(accept?: boolean) {
    if (!modal) return;
    setActing(true);
    try {
      let updated: Conversation;
      if (modal === "close") {
        updated = await conversationsService.close(
          conversationId,
          modalText.trim() || undefined,
        );
        toast.success("Contato encerrado.");
      } else if (modal === "request_reopen") {
        updated = await conversationsService.requestReopen(
          conversationId,
          modalText.trim() || undefined,
        );
        toast.success("Solicitação de reabertura enviada.");
      } else if (modal === "request_new_contact") {
        updated = await conversationsService.requestNewContact(
          conversationId,
          modalText.trim() || undefined,
        );
        toast.success("Solicitação de novo contato enviada.");
      } else if (modal === "respond_reopen") {
        updated = await conversationsService.respondReopen(
          conversationId,
          Boolean(accept),
          modalText.trim() || undefined,
        );
        toast.success(accept ? "Contato reaberto." : "Reabertura recusada.");
      } else {
        updated = await conversationsService.respondNewContact(
          conversationId,
          Boolean(accept),
          modalText.trim() || undefined,
        );
        toast.success(accept ? "Novo contato aceito." : "Novo contato recusado.");
      }
      setModal(null);
      setModalText("");
      await refreshAfterAction(updated);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível concluir.",
      );
    } finally {
      setActing(false);
    }
  }

  async function handleReopenDirect() {
    setActing(true);
    try {
      const updated = await conversationsService.reopen(conversationId);
      toast.success("Contato reaberto.");
      await refreshAfterAction(updated);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível reabrir.",
      );
    } finally {
      setActing(false);
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

  const showPropose =
    conversation.my_role === "offerer" && (!isClosed || Boolean(proposal));
  const showReview =
    conversation.my_role === "interested" &&
    proposal?.status === "pending_approval";

  const modalTitle =
    modal === "close"
      ? "Encerrar contato"
      : modal === "request_reopen"
        ? "Solicitar reabertura"
        : modal === "request_new_contact"
          ? "Solicitar novo contato"
          : modal === "respond_reopen"
            ? "Responder solicitação de reabertura"
            : modal === "respond_new_contact"
              ? "Responder solicitação de novo contato"
              : "";

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
        <div className="flex flex-wrap items-center gap-2">
          {!isClosed ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModal("close");
                setModalText("");
              }}
            >
              Encerrar contato
            </Button>
          ) : null}
          {showPropose ? (
            <Button
              type="button"
              variant={proposal ? "outline" : "default"}
              onClick={handleProposeAgreement}
              disabled={creatingProposal || (isClosed && !proposal)}
            >
              {creatingProposal
                ? "Criando..."
                : proposal
                  ? "Ver Minuta"
                  : "Propor Acordo"}
            </Button>
          ) : null}
          {showReview ? (
            <Button
              type="button"
              onClick={() => router.push(`/dashboard/minutas/${proposal.id}`)}
            >
              Revisar Minuta
            </Button>
          ) : null}
          {conversation.my_role === "interested" &&
          proposal &&
          proposal.status !== "pending_approval" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/minutas/${proposal.id}`)}
            >
              Ver Minuta
            </Button>
          ) : null}
          <Badge variant={isClosed ? "secondary" : "default"}>
            {STATUS_LABELS[conversation.status] ?? conversation.status}
          </Badge>
        </div>
      </div>

      {conversation.replaced_by_conversation_id ? (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          Este contato foi substituído por um novo.{" "}
          <Link
            href={`/dashboard/conversas/${conversation.replaced_by_conversation_id}`}
            className="text-primary underline"
          >
            Abrir novo contato
          </Link>
        </div>
      ) : null}

      {showCloseRecommendation && !isClosed ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <p className="font-medium">Recomendação: encerrar contato</p>
          <p className="mt-1 text-amber-900/80">
            Houve rejeição de proposta ou acordo. Avalie se deseja encerrar este
            contato. O encerramento só ocorre se você confirmar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setModal("close");
                setModalText("");
              }}
            >
              Encerrar contato
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowCloseRecommendation(false)}
            >
              Continuar conversa
            </Button>
          </div>
        </div>
      ) : null}

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
          <div className="space-y-3 border-t border-border bg-muted/30 p-4">
            <p className="text-center text-sm text-muted-foreground">
              Este contato foi encerrado. Não é possível enviar novas mensagens.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {conversation.can_reopen ? (
                <Button type="button" onClick={handleReopenDirect} disabled={acting}>
                  Reabrir contato
                </Button>
              ) : null}
              {conversation.can_respond_reopen ? (
                <Button
                  type="button"
                  onClick={() => {
                    setModal("respond_reopen");
                    setModalText("");
                  }}
                  disabled={acting}
                >
                  Responder reabertura
                </Button>
              ) : null}
              {conversation.can_respond_new_contact ? (
                <Button
                  type="button"
                  onClick={() => {
                    setModal("respond_new_contact");
                    setModalText("");
                  }}
                  disabled={acting}
                >
                  Responder novo contato
                </Button>
              ) : null}
              {conversation.can_request_reopen ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModal("request_reopen");
                    setModalText("");
                  }}
                  disabled={acting}
                >
                  Solicitar reabertura
                </Button>
              ) : null}
              {conversation.can_request_new_contact ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModal("request_new_contact");
                    setModalText("");
                  }}
                  disabled={acting}
                >
                  Solicitar novo contato
                </Button>
              ) : null}
            </div>
            {conversation.reopen_request_message ||
            conversation.new_contact_request_message ? (
              <p className="text-center text-xs text-muted-foreground">
                {conversation.reopen_request_message
                  ? `Pedido de reabertura: ${conversation.reopen_request_message}`
                  : null}
                {conversation.new_contact_request_message
                  ? `Pedido de novo contato: ${conversation.new_contact_request_message}`
                  : null}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-background p-5 shadow-lg">
            <h3 className="text-lg font-semibold">{modalTitle}</h3>
            <Textarea
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={
                modal === "close"
                  ? "Motivo ou mensagem (opcional)"
                  : "Mensagem opcional"
              }
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal(null)}
                disabled={acting}
              >
                Cancelar
              </Button>
              {modal === "respond_reopen" || modal === "respond_new_contact" ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleModalConfirm(false)}
                    disabled={acting}
                  >
                    Recusar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleModalConfirm(true)}
                    disabled={acting}
                  >
                    Aceitar
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => void handleModalConfirm()}
                  disabled={acting}
                >
                  Confirmar
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
