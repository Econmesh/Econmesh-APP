import type { SupportMessage } from "@/types/api";
import type { SupportStreamEvent } from "@/services/support/support.service";

export function normalizeStreamMessage(raw: Record<string, unknown>): SupportMessage {
  return {
    id: String(raw.id),
    ticket_id: String(raw.ticket_id),
    author_id: String(raw.author_id),
    author_role: raw.author_role as SupportMessage["author_role"],
    author_name: (raw.author_name as string | null) ?? null,
    message_type: raw.message_type as SupportMessage["message_type"],
    body: String(raw.body),
    read_at: (raw.read_at as string | null) ?? null,
    created_at: String(raw.created_at),
  };
}

export function applySupportStreamEvent(
  event: SupportStreamEvent,
  messages: SupportMessage[],
): SupportMessage[] | null {
  if (event.type === "message_created" && event.data?.message) {
    const msg = normalizeStreamMessage(event.data.message as Record<string, unknown>);
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

export function normalizeTicketId(id: string): string {
  return id.trim().toLowerCase();
}

export function ticketIdFromEvent(event: SupportStreamEvent): string | undefined {
  const id = event.data?.ticket_id;
  return id != null ? normalizeTicketId(String(id)) : undefined;
}

type TicketStreamHandlerContext = {
  messagesRef: { current: SupportMessage[] };
  setMessages: (messages: SupportMessage[]) => void;
  fetchMessages: () => Promise<SupportMessage[]>;
  fetchTicket?: () => Promise<void>;
  onIncomingAdminReply?: () => void;
};

/** Apply a realtime event to the thread, fetching from API when the payload is incomplete. */
export function handleTicketStreamEvent(
  event: SupportStreamEvent,
  ctx: TicketStreamHandlerContext,
): void {
  if (event.type === "ping") return;

  if (event.type === "message_created" || event.type === "messages_read") {
    const next = applySupportStreamEvent(event, ctx.messagesRef.current);
    if (next) {
      ctx.setMessages(next);
      if (
        event.type === "message_created" &&
        event.data?.message_type === "admin_reply" &&
        ctx.onIncomingAdminReply
      ) {
        void ctx.onIncomingAdminReply();
      }
      return;
    }
    void ctx.fetchMessages().then(ctx.setMessages);
    return;
  }

  if (event.type === "ticket_closed" || event.type === "ticket_reopened") {
    void ctx.fetchTicket?.();
    void ctx.fetchMessages().then(ctx.setMessages);
  }
}

export function messagesFingerprint(messages: SupportMessage[]): string {
  if (messages.length === 0) return "0";
  const last = messages[messages.length - 1];
  return `${messages.length}:${last?.id ?? ""}:${last?.read_at ?? ""}`;
}
