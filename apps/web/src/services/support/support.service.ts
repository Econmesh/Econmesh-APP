import { env } from "@econmesh-app/env/web";

import { API_V1_PREFIX } from "@/lib/constants";
import type {
  MessageResponse,
  SupportMessage,
  SupportMessageListResponse,
  SupportTicket,
  SupportTicketListResponse,
  SupportTicketStatus,
} from "@/types/api";
import { api, type TokenProvider } from "@/services/api/client";

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export type SupportStreamEventType =
  | "ticket_created"
  | "message_created"
  | "ticket_closed"
  | "ticket_reopened"
  | "ticket_assigned"
  | "messages_read"
  | "presence_changed"
  | "ping";

export type SupportStreamEvent = {
  type: SupportStreamEventType;
  data?: Record<string, unknown>;
};

async function* parseSseStream(
  response: Response,
): AsyncGenerator<{ eventType: string; data: Record<string, unknown> }> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split("\n");
        let eventType = "message";
        let dataLine = "";
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLine = line.slice(5).trim();
          }
        }
        if (!dataLine) {
          yield { eventType, data: {} };
          continue;
        }
        try {
          yield { eventType, data: JSON.parse(dataLine) as Record<string, unknown> };
        } catch {
          yield { eventType, data: {} };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* openSupportStream(
  path: string,
  getToken: TokenProvider,
  signal?: AbortSignal,
): AsyncGenerator<SupportStreamEvent> {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const token = await getToken();
  if (!token) {
    throw new Error("missing_auth_token");
  }

  const response = await fetch(`${base}${API_V1_PREFIX}${path}`, {
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    },
    signal,
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    throw new Error(`stream_failed_${response.status}`);
  }

  for await (const { eventType, data } of parseSseStream(response)) {
    if (eventType === "ping") {
      yield { type: "ping" };
      continue;
    }
    yield {
      type: eventType as SupportStreamEventType,
      data,
    };
  }
}

export const supportService = {
  list(params: { page?: number; page_size?: number; status?: SupportTicketStatus } = {}) {
    return api.get<SupportTicketListResponse>(`/support/tickets${buildQuery(params)}`, {
      auth: true,
    });
  },

  get(ticketId: string) {
    return api.get<SupportTicket>(`/support/tickets/${ticketId}`, { auth: true });
  },

  create(payload: { subject: string; message: string }) {
    return api.post<SupportTicket>("/support/tickets", payload, { auth: true });
  },

  listMessages(ticketId: string) {
    return api.get<SupportMessageListResponse>(
      `/support/tickets/${ticketId}/messages`,
      { auth: true },
    );
  },

  sendMessage(ticketId: string, body: string) {
    return api.post<SupportMessage>(
      `/support/tickets/${ticketId}/messages`,
      { body },
      { auth: true },
    );
  },

  heartbeat() {
    return api.post<MessageResponse>("/support/presence/heartbeat", undefined, {
      auth: true,
    });
  },

  goOffline() {
    return api.post<MessageResponse>("/support/presence/offline", undefined, {
      auth: true,
    });
  },

  markMessagesRead(ticketId: string) {
    return api.post<SupportMessageListResponse>(
      `/support/tickets/${ticketId}/messages/read`,
      undefined,
      { auth: true },
    );
  },

  async *stream(
    getToken: TokenProvider,
    signal?: AbortSignal,
  ): AsyncGenerator<SupportStreamEvent> {
    yield* openSupportStream("/support/stream", getToken, signal);
  },

  async *ticketStream(
    ticketId: string,
    getToken: TokenProvider,
    signal?: AbortSignal,
  ): AsyncGenerator<SupportStreamEvent> {
    yield* openSupportStream(`/support/tickets/${ticketId}/stream`, getToken, signal);
  },
};

export function formatTicketNumber(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}
