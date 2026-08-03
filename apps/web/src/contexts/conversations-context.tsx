"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import {
  conversationIdFromEvent,
  normalizeConversationId,
} from "@/modules/conversations/conversation-realtime";
import {
  conversationsService,
  type ConversationStreamEvent,
} from "@/services/conversations/conversations.service";

const STREAM_RETRY_MS = 3_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type ConversationAlert = {
  id: string;
  conversationId: string;
  title: string;
  body: string;
  createdAt: string;
};

type ConversationListener = (event: ConversationStreamEvent) => void;

type ConversationsContextValue = {
  alerts: ConversationAlert[];
  unreadCount: number;
  dismissAlert: (id: string) => void;
  dismissAlertsForConversation: (conversationId: string) => void;
  dismissAllAlerts: () => void;
  subscribeConversation: (
    conversationId: string,
    listener: ConversationListener,
  ) => () => void;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

function isViewingConversation(pathname: string | null, conversationId: string) {
  if (!pathname) return false;
  const normalized = normalizeConversationId(conversationId);
  return pathname.toLowerCase() === `/dashboard/conversas/${normalized}`;
}

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, getIdToken } = useAuth();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [alerts, setAlerts] = useState<ConversationAlert[]>([]);
  const listenersRef = useRef<Map<string, Set<ConversationListener>>>(new Map());

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const dismissAlertsForConversation = useCallback((conversationId: string) => {
    const key = normalizeConversationId(conversationId);
    setAlerts((prev) =>
      prev.filter((a) => normalizeConversationId(a.conversationId) !== key),
    );
  }, []);

  const dismissAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const subscribeConversation = useCallback(
    (conversationId: string, listener: ConversationListener) => {
      const key = normalizeConversationId(conversationId);
      const map = listenersRef.current;
      if (!map.has(key)) {
        map.set(key, new Set());
      }
      map.get(key)!.add(listener);
      return () => {
        map.get(key)?.delete(listener);
      };
    },
    [],
  );

  const notifyListeners = useCallback(
    (conversationId: string, event: ConversationStreamEvent) => {
      listenersRef.current
        .get(normalizeConversationId(conversationId))
        ?.forEach((listener) => listener(event));
    },
    [],
  );

  const handleEventRef = useRef<(event: ConversationStreamEvent) => void>(() => {});

  handleEventRef.current = (event: ConversationStreamEvent) => {
    const conversationId = conversationIdFromEvent(event);

    if (conversationId) {
      notifyListeners(conversationId, event);
    }

    if (event.type === "ping") return;
    if (!conversationId || !user) return;

    if (event.type === "message_created") {
      const message = event.data?.message as Record<string, unknown> | undefined;
      if (!message) return;
      if (String(message.author_id) === user.id) return;
      if (message.message_type === "internal_note") return;

      const viewing = isViewingConversation(pathnameRef.current, conversationId);
      if (viewing) return;

      const title =
        (event.data?.opportunity_title as string | undefined) ?? "Nova mensagem";
      const body = String(message.body ?? "").slice(0, 120);
      const alertId = `${event.type}-${conversationId}-${Date.now()}`;

      setAlerts((prev) => [
        {
          id: alertId,
          conversationId,
          title,
          body,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.info(title, { description: body });
    }

    if (event.type === "conversation_created") {
      const viewing = isViewingConversation(pathnameRef.current, conversationId);
      if (viewing) return;
      const title =
        (event.data?.opportunity_title as string | undefined) ?? "Nova conversa";
      toast.info("Nova conversa", { description: title });
    }
  };

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) return;

    const controller = new AbortController();
    let retryDelay = STREAM_RETRY_MS;

    async function connectStream() {
      while (!controller.signal.aborted) {
        try {
          for await (const event of conversationsService.stream(
            () => getIdToken(),
            controller.signal,
          )) {
            retryDelay = STREAM_RETRY_MS;
            handleEventRef.current(event);
          }
        } catch {
          if (controller.signal.aborted) break;
        }

        if (controller.signal.aborted) break;
        await sleep(retryDelay);
        retryDelay = Math.min(retryDelay * 1.5, 30_000);
      }
    }

    void connectStream();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, isLoading, user, getIdToken]);

  const value = useMemo(
    () => ({
      alerts,
      unreadCount: alerts.length,
      dismissAlert,
      dismissAlertsForConversation,
      dismissAllAlerts,
      subscribeConversation,
    }),
    [
      alerts,
      dismissAlert,
      dismissAlertsForConversation,
      dismissAllAlerts,
      subscribeConversation,
    ],
  );

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error("useConversations must be used within ConversationsProvider");
  }
  return context;
}
