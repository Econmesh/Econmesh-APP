"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/hooks/use-auth";
import type { SupportStreamEvent } from "@/services/support/support.service";
import { supportService } from "@/services/support/support.service";

const STREAM_RETRY_MS = 2_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Dedicated SSE connection for a single ticket thread (real-time messages). */
export function useSupportTicketStream(
  ticketId: string,
  onEvent: (event: SupportStreamEvent) => void,
) {
  const { isAuthenticated, isLoading, getIdToken } = useAuth();
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!isAuthenticated || isLoading || !ticketId) return;

    const controller = new AbortController();
    let retryDelay = STREAM_RETRY_MS;

    async function connect() {
      while (!controller.signal.aborted) {
        const token = await getIdToken();
        if (!token) {
          await sleep(1000);
          continue;
        }

        try {
          for await (const event of supportService.ticketStream(
            ticketId,
            () => getIdToken(),
            controller.signal,
          )) {
            retryDelay = STREAM_RETRY_MS;
            handlerRef.current(event);
          }
        } catch {
          if (controller.signal.aborted) break;
        }
        if (controller.signal.aborted) break;
        await sleep(retryDelay);
        retryDelay = Math.min(retryDelay * 1.5, 15_000);
      }
    }

    void connect();
    return () => controller.abort();
  }, [isAuthenticated, isLoading, ticketId, getIdToken]);
}
