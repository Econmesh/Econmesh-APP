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
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { notificationsService } from "@/services/notifications/notifications.service";
import type { UserNotification } from "@/types/api";

const UNREAD_FETCH_SIZE = 200;
const READ_FETCH_SIZE = 200;
const POLL_INTERVAL_MS = 20_000;
const STREAM_RETRY_MS = 3_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function normalizeNotification(raw: UserNotification): UserNotification {
  return {
    ...raw,
    id: String(raw.id),
    campaign_id: raw.campaign_id ? String(raw.campaign_id) : null,
  };
}

type NotificationContextValue = {
  unreadNotifications: UserNotification[];
  readNotifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  loadingRead: boolean;
  hasMoreRead: boolean;
  refresh: () => Promise<void>;
  loadReadNotifications: (options?: { all?: boolean }) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, getIdToken } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState<UserNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingRead, setLoadingRead] = useState(false);
  const [hasMoreRead, setHasMoreRead] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastKnownCountRef = useRef(0);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!isAuthenticated) return;
    if (!options?.silent) setLoading(true);
    try {
      const [unreadList, count] = await Promise.all([
        notificationsService.list({
          page: 1,
          page_size: UNREAD_FETCH_SIZE,
          unread_only: true,
        }),
        notificationsService.unreadCount(),
      ]);
      setUnreadNotifications(unreadList.items.map(normalizeNotification));
      setUnreadCount(count.count);
      lastKnownCountRef.current = count.count;
      setReadNotifications([]);
      setHasMoreRead(false);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [isAuthenticated]);

  const pollForUpdates = useCallback(async () => {
    if (!isAuthenticated || document.visibilityState !== "visible") return;
    try {
      const count = await notificationsService.unreadCount();
      if (count.count !== lastKnownCountRef.current) {
        await refresh({ silent: true });
      }
    } catch {
      /* next poll or stream will retry */
    }
  }, [isAuthenticated, refresh]);

  const loadReadNotifications = useCallback(
    async (options?: { all?: boolean }) => {
      if (!isAuthenticated) return;
      setLoadingRead(true);
      try {
        const list = await notificationsService.list({
          page: 1,
          page_size: READ_FETCH_SIZE,
          unread_only: false,
        });
        const read = list.items.filter((n) => n.read_at).map(normalizeNotification);
        if (options?.all) {
          setReadNotifications(read);
          setHasMoreRead(false);
        } else {
          setReadNotifications(read.slice(0, 5));
          setHasMoreRead(read.length > 5);
        }
      } finally {
        setLoadingRead(false);
      }
    },
    [isAuthenticated],
  );

  const markRead = useCallback(async (id: string) => {
    const updated = normalizeNotification(await notificationsService.markRead(id));
    setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
    setReadNotifications((prev) => {
      if (prev.some((n) => n.id === id)) {
        return prev.map((n) => (n.id === id ? updated : n));
      }
      return [updated, ...prev];
    });
    setUnreadCount((prev) => {
      const next = Math.max(0, prev - 1);
      lastKnownCountRef.current = next;
      return next;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsService.markAllRead();
    const now = new Date().toISOString();
    setUnreadNotifications((prev) => {
      const marked = prev.map((n) => ({ ...n, read_at: n.read_at ?? now }));
      setReadNotifications(marked);
      setHasMoreRead(marked.length > 5);
      return [];
    });
    setUnreadCount(0);
    lastKnownCountRef.current = 0;
  }, []);

  // Initial load when authenticated
  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) return;
    void refresh();
  }, [isAuthenticated, isLoading, user, refresh]);

  // SSE real-time stream
  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) {
      abortRef.current?.abort();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let retryDelay = STREAM_RETRY_MS;

    async function connectStream() {
      while (!controller.signal.aborted) {
        const token = await getIdToken();
        if (!token) {
          await sleep(1000);
          continue;
        }

        try {
          for await (const event of notificationsService.stream(
            () => getIdToken(),
            controller.signal,
          )) {
            retryDelay = STREAM_RETRY_MS;
            if (event.type === "notification" && event.data) {
              const notification = normalizeNotification(event.data);
              setUnreadNotifications((prev) => {
                if (prev.some((n) => n.id === notification.id)) return prev;
                setUnreadCount((count) => {
                  const next = count + 1;
                  lastKnownCountRef.current = next;
                  return next;
                });
                toast.info(notification.title, { description: notification.body });
                return [notification, ...prev];
              });
            }
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

  // Polling fallback + refresh when tab becomes visible
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = window.setInterval(() => {
      void pollForUpdates();
    }, POLL_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void pollForUpdates();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated, user, pollForUpdates]);

  const value = useMemo(
    () => ({
      unreadNotifications,
      readNotifications,
      unreadCount,
      loading,
      loadingRead,
      hasMoreRead,
      refresh,
      loadReadNotifications,
      markRead,
      markAllRead,
    }),
    [
      unreadNotifications,
      readNotifications,
      unreadCount,
      loading,
      loadingRead,
      hasMoreRead,
      refresh,
      loadReadNotifications,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
