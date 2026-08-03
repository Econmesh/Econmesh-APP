import type { ConversationMessage } from "@/types/api";
import type { ConversationStreamEvent } from "@/services/conversations/conversations.service";

export function normalizeStreamMessage(
  raw: Record<string, unknown>,
): ConversationMessage {
  return {
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
  };
}

export function applyConversationStreamEvent(
  event: ConversationStreamEvent,
  messages: ConversationMessage[],
): ConversationMessage[] | null {
  if (event.type === "message_created" && event.data?.message) {
    const msg = normalizeStreamMessage(event.data.message as Record<string, unknown>);
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
    const next = applyConversationStreamEvent(event, ctx.messagesRef.current);
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

  if (event.type === "conversation_created") {
    void ctx.fetchConversation?.();
  }
}

export function messagesFingerprint(messages: ConversationMessage[]): string {
  if (messages.length === 0) return "0";
  const last = messages[messages.length - 1];
  return `${messages.length}:${last?.id ?? ""}:${last?.read_at ?? ""}`;
}
