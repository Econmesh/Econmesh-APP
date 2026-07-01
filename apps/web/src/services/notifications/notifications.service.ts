import { env } from "@econmesh-app/env/web";

import { API_V1_PREFIX } from "@/lib/constants";
import type {
  MessageResponse,
  UnreadCountResponse,
  UserNotification,
  UserNotificationListResponse,
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

export type NotificationStreamEvent = {
  type: "notification" | "ping";
  data?: UserNotification;
};

export const notificationsService = {
  list(params: { page?: number; page_size?: number; unread_only?: boolean } = {}) {
    return api.get<UserNotificationListResponse>(
      `/notifications${buildQuery(params)}`,
      { auth: true },
    );
  },

  unreadCount() {
    return api.get<UnreadCountResponse>("/notifications/unread-count", { auth: true });
  },

  markRead(id: string) {
    return api.patch<UserNotification>(`/notifications/${id}/read`, undefined, { auth: true });
  },

  markAllRead() {
    return api.patch<MessageResponse>("/notifications/read-all", undefined, { auth: true });
  },

  async *stream(
    getToken: TokenProvider,
    signal?: AbortSignal,
  ): AsyncGenerator<NotificationStreamEvent> {
    const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    const token = await getToken();
    if (!token) {
      throw new Error("missing_auth_token");
    }

    const response = await fetch(`${base}${API_V1_PREFIX}/notifications/stream`, {
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

          if (eventType === "ping") {
            yield { type: "ping" };
            continue;
          }

          if (eventType === "notification" && dataLine) {
            try {
              const data = JSON.parse(dataLine) as UserNotification;
              yield { type: "notification", data };
            } catch {
              // ignore malformed events
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
