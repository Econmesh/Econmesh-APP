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
import { ticketIdFromEvent, normalizeTicketId } from "@/modules/support/support-realtime";
import { supportService } from "@/services/support/support.service";
import type { SupportStreamEvent } from "@/services/support/support.service";

const STREAM_RETRY_MS = 3_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type SupportAlert = {
  id: string;
  ticketId: string;
  ticketNumber: number;
  title: string;
  body: string;
  createdAt: string;
};

type TicketListener = (event: SupportStreamEvent) => void;

type SupportContextValue = {
  alerts: SupportAlert[];
  unreadCount: number;
  dismissAlert: (id: string) => void;
  dismissAlertsForTicket: (ticketId: string) => void;
  dismissAllAlerts: () => void;
  subscribeTicket: (ticketId: string, listener: TicketListener) => () => void;
};

const SupportContext = createContext<SupportContextValue | null>(null);

function isViewingTicket(pathname: string | null, ticketId: string) {
  if (!pathname) return false;
  const normalized = normalizeTicketId(ticketId);
  return pathname.toLowerCase() === `/dashboard/suporte/${normalized}`;
}

export function SupportProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, getIdToken } = useAuth();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [alerts, setAlerts] = useState<SupportAlert[]>([]);
  const listenersRef = useRef<Map<string, Set<TicketListener>>>(new Map());

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const dismissAlertsForTicket = useCallback((ticketId: string) => {
    const key = normalizeTicketId(ticketId);
    setAlerts((prev) => prev.filter((a) => normalizeTicketId(a.ticketId) !== key));
  }, []);

  const dismissAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const subscribeTicket = useCallback((ticketId: string, listener: TicketListener) => {
    const key = normalizeTicketId(ticketId);
    const map = listenersRef.current;
    if (!map.has(key)) {
      map.set(key, new Set());
    }
    map.get(key)!.add(listener);
    return () => {
      map.get(key)?.delete(listener);
    };
  }, []);

  const notifyTicketListeners = useCallback((ticketId: string, event: SupportStreamEvent) => {
    listenersRef.current.get(normalizeTicketId(ticketId))?.forEach((listener) => listener(event));
  }, []);

  const handleSupportEventRef = useRef<(event: SupportStreamEvent) => void>(() => {});

  handleSupportEventRef.current = (event: SupportStreamEvent) => {
    const ticketId = ticketIdFromEvent(event);

    if (ticketId) {
      notifyTicketListeners(ticketId, event);
    }

    if (event.type === "ping") return;
    if (!ticketId) return;

    const messageType = event.data?.message_type as string | undefined;
    if (event.type === "ticket_created") return;
    if (event.type === "message_created" && messageType === "user_message") return;

    const viewing = isViewingTicket(pathnameRef.current, ticketId);
    if (viewing && (event.type === "message_created" || event.type === "messages_read")) {
      return;
    }

    if (event.type === "ticket_reopened") {
      const ticketNumber = Number(event.data?.ticket_number ?? 0);
      const alertId = `${event.type}-${ticketId}-${Date.now()}`;
      const title = `Chamado #${String(ticketNumber).padStart(4, "0")} reaberto`;
      const body = "Seu chamado de suporte foi reaberto.";

      if (!viewing) {
        setAlerts((prev) => [
          {
            id: alertId,
            ticketId,
            ticketNumber,
            title,
            body,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        toast.info(title, { description: body });
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) return;

    const controller = new AbortController();
    let retryDelay = STREAM_RETRY_MS;

    async function connectStream() {
      while (!controller.signal.aborted) {
        try {
          for await (const event of supportService.stream(
            () => getIdToken(),
            controller.signal,
          )) {
            retryDelay = STREAM_RETRY_MS;
            handleSupportEventRef.current(event);
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
    void supportService.heartbeat();

    const interval = window.setInterval(() => {
      void supportService.heartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      void supportService.goOffline();
    };
  }, [isAuthenticated, isLoading, user, getIdToken]);

  const value = useMemo(
    () => ({
      alerts,
      unreadCount: alerts.length,
      dismissAlert,
      dismissAlertsForTicket,
      dismissAllAlerts,
      subscribeTicket,
    }),
    [alerts, dismissAlert, dismissAlertsForTicket, dismissAllAlerts, subscribeTicket],
  );

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error("useSupport must be used within SupportProvider");
  }
  return context;
}
