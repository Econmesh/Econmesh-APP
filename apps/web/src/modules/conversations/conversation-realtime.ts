import type { ConversationMessage } from "@/types/api";
import type { ConversationStreamEvent } from "@/services/conversations/conversations.service";

export function normalizeStreamMessage(
  raw: Record<string, unknown>,
  currentUserId?: string,
): ConversationMessage {
  const msg: ConversationMessage = {
    id: String(raw.id),
    conversation_id: String(raw.conversation_id),
    author_id: String(raw.author_id),
    author_company_id:
      raw.author_company_id != null ? String(raw.author_company_id) : null,
    author_role: raw.author_role as ConversationMessage["author_role"],
    author_name: (raw.author_name as string | null) ?? null,
    message_type: raw.message_type as ConversationMessage["message_type"],
    body: String(raw.body),
    read_at: (raw.read_at as string | null) ?? null,
    created_at: String(raw.created_at),
    event_kind: (raw.event_kind as ConversationMessage["event_kind"]) ?? null,
    event_actor_user_id:
      raw.event_actor_user_id != null ? String(raw.event_actor_user_id) : null,
    event_actor_name: (raw.event_actor_name as string | null) ?? null,
    event_reason: (raw.event_reason as string | null) ?? null,
  };
  if (
    currentUserId &&
    msg.message_type === "system_event" &&
    msg.event_kind &&
    msg.event_actor_user_id
  ) {
    msg.body = formatSystemEventBody(msg, currentUserId);
  }
  return msg;
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatSystemEventBody(
  msg: ConversationMessage,
  currentUserId: string,
): string {
  const clock = formatClock(msg.created_at);
  const reason = msg.event_reason?.trim();
  const reasonSuffix = reason ? ` por: ${reason}` : "";
  const isActor = msg.event_actor_user_id === currentUserId;
  const name = msg.event_actor_name || msg.author_name || "Usuário";
  switch (msg.event_kind) {
    case "contact_closed":
      return isActor
        ? `Você encerrou o contato às ${clock}${reasonSuffix}.`
        : `${name} encerrou o contato às ${clock}${reasonSuffix}.`;
    case "reopen_requested":
      return isActor
        ? `Você solicitou a reabertura do contato às ${clock}${reasonSuffix}.`
        : `${name} solicitou a reabertura do contato às ${clock}${reasonSuffix}.`;
    case "reopen_rejected":
      return isActor
        ? `Você recusou a reabertura do contato às ${clock}${reasonSuffix}.`
        : `${name} recusou a reabertura do contato às ${clock}${reasonSuffix}.`;
    case "contact_reopened":
      return isActor
        ? `Você reabriu o contato às ${clock}${reasonSuffix}.`
        : `${name} reabriu o contato às ${clock}${reasonSuffix}.`;
    case "new_contact_requested":
      return isActor
        ? `Você solicitou um novo contato às ${clock}${reasonSuffix}.`
        : `${name} solicitou um novo contato às ${clock}${reasonSuffix}.`;
    case "new_contact_accepted":
      return isActor
        ? `Você aceitou o novo contato às ${clock}${reasonSuffix}.`
        : `${name} aceitou o novo contato às ${clock}${reasonSuffix}.`;
    case "new_contact_rejected":
      return isActor
        ? `Você recusou o novo contato às ${clock}${reasonSuffix}.`
        : `${name} recusou o novo contato às ${clock}${reasonSuffix}.`;
    case "agreement_proposed":
      return isActor
        ? `Você propôs um acordo às ${clock}.`
        : `${name} propôs um acordo às ${clock}.`;
    case "agreement_submitted":
      return isActor
        ? `Você enviou a minuta para aprovação às ${clock}.`
        : `${name} enviou a minuta para aprovação às ${clock}.`;
    case "agreement_changes_requested":
      return isActor
        ? `Você solicitou alterações na minuta às ${clock}${reasonSuffix}.`
        : `${name} solicitou alterações na minuta às ${clock}${reasonSuffix}.`;
    case "agreement_rejected":
      return isActor
        ? `Você rejeitou a proposta de acordo às ${clock}${reasonSuffix}.`
        : `${name} rejeitou a proposta de acordo às ${clock}${reasonSuffix}.`;
    case "agreement_approved":
      return isActor
        ? `Você aprovou a minuta às ${clock}.`
        : `${name} aprovou a minuta às ${clock}.`;
    default:
      return msg.body;
  }
}

export function applyConversationStreamEvent(
  event: ConversationStreamEvent,
  messages: ConversationMessage[],
  currentUserId?: string,
): ConversationMessage[] | null {
  if (event.type === "message_created" && event.data?.message) {
    const msg = normalizeStreamMessage(
      event.data.message as Record<string, unknown>,
      currentUserId,
    );
    if (msg.message_type === "internal_note") return null;
    if (messages.some((m) => m.id === msg.id)) return null;
    return [...messages, msg].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  if (event.type === "messages_read" && event.data?.message_ids) {
    const ids = new Set((event.data.message_ids as string[]).map(String));
    const readAt = new Date().toISOString();
    return messages.map((m) => (ids.has(m.id) ? { ...m, read_at: m.read_at ?? readAt } : m));
  }

  return null;
}

export function normalizeConversationId(id: string): string {
  return id.trim().toLowerCase();
}

export function conversationIdFromEvent(
  event: ConversationStreamEvent,
): string | undefined {
  const id = event.data?.conversation_id;
  return id != null ? normalizeConversationId(String(id)) : undefined;
}

type ConversationStreamHandlerContext = {
  messagesRef: { current: ConversationMessage[] };
  setMessages: (messages: ConversationMessage[]) => void;
  fetchMessages: () => Promise<ConversationMessage[]>;
  fetchConversation?: () => Promise<unknown>;
  onIncomingMessage?: () => void;
  currentUserId?: string;
};

export function handleConversationStreamEvent(
  event: ConversationStreamEvent,
  ctx: ConversationStreamHandlerContext,
): void {
  if (event.type === "ping") return;

  if (event.type === "message_created" || event.type === "messages_read") {
    const next = applyConversationStreamEvent(
      event,
      ctx.messagesRef.current,
      ctx.currentUserId,
    );
    if (next) {
      ctx.setMessages(next);
      if (
        event.type === "message_created" &&
        event.data?.message &&
        ctx.onIncomingMessage &&
        ctx.currentUserId
      ) {
        const msg = event.data.message as Record<string, unknown>;
        if (String(msg.author_id) !== ctx.currentUserId) {
          void ctx.onIncomingMessage();
        }
      }
      return;
    }
    void ctx.fetchMessages().then(ctx.setMessages);
    return;
  }

  if (event.type === "conversation_created" || event.type === "conversation_updated") {
    void ctx.fetchConversation?.();
  }
}

export function messagesFingerprint(messages: ConversationMessage[]): string {
  if (messages.length === 0) return "0";
  const last = messages[messages.length - 1];
  return `${messages.length}:${last?.id ?? ""}:${last?.read_at ?? ""}`;
}
