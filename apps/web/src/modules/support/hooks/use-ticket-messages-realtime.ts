"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import { useSupport } from "@/contexts/support-context";
import { useSupportTicketStream } from "@/modules/support/hooks/use-support-ticket-stream";
import {
  handleTicketStreamEvent,
  messagesFingerprint,
} from "@/modules/support/support-realtime";
import type { SupportStreamEvent } from "@/services/support/support.service";
import type { SupportMessage } from "@/types/api";

const POLL_MS = 4_000;

type Options = {
  ticketId: string;
  messagesRef: MutableRefObject<SupportMessage[]>;
  setMessages: Dispatch<SetStateAction<SupportMessage[]>>;
  fetchMessages: () => Promise<SupportMessage[]>;
  fetchTicket?: () => Promise<unknown>;
  onIncomingAdminReply?: () => void;
};

/** Keeps the ticket thread in sync via SSE (dedicated + global) and lightweight polling. */
export function useTicketMessagesRealtime({
  ticketId,
  messagesRef,
  setMessages,
  fetchMessages,
  fetchTicket,
  onIncomingAdminReply,
}: Options) {
  const { subscribeTicket } = useSupport();
  const fingerprintRef = useRef("");

  const handleEvent = useCallback(
    (event: SupportStreamEvent) => {
      handleTicketStreamEvent(event, {
        messagesRef,
        setMessages: (items) => {
          fingerprintRef.current = messagesFingerprint(items);
          setMessages(items);
        },
        fetchMessages,
        fetchTicket,
        onIncomingAdminReply,
      });
    },
    [messagesRef, setMessages, fetchMessages, fetchTicket, onIncomingAdminReply],
  );

  useSupportTicketStream(ticketId, handleEvent);

  useEffect(() => {
    return subscribeTicket(ticketId, handleEvent);
  }, [ticketId, subscribeTicket, handleEvent]);

  useEffect(() => {
    if (!ticketId) return;

    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const items = await fetchMessages();
        const fingerprint = messagesFingerprint(items);
        if (fingerprint !== fingerprintRef.current) {
          fingerprintRef.current = fingerprint;
          setMessages(items);
        }
      } catch {
        /* next poll or stream will retry */
      }
    };

    const onVisible = () => void sync();
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(() => void sync(), POLL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [ticketId, fetchMessages, setMessages]);
}
