"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import { useConversations } from "@/contexts/conversations-context";
import { useConversationStream } from "@/modules/conversations/hooks/use-conversation-stream";
import {
  handleConversationStreamEvent,
  messagesFingerprint,
} from "@/modules/conversations/conversation-realtime";
import type { ConversationStreamEvent } from "@/services/conversations/conversations.service";
import type { ConversationMessage } from "@/types/api";

const POLL_MS = 4_000;

type Options = {
  conversationId: string;
  messagesRef: MutableRefObject<ConversationMessage[]>;
  setMessages: Dispatch<SetStateAction<ConversationMessage[]>>;
  fetchMessages: () => Promise<ConversationMessage[]>;
  fetchConversation?: () => Promise<unknown>;
  onIncomingMessage?: () => void;
  currentUserId?: string;
};

export function useConversationMessagesRealtime({
  conversationId,
  messagesRef,
  setMessages,
  fetchMessages,
  fetchConversation,
  onIncomingMessage,
  currentUserId,
}: Options) {
  const { subscribeConversation } = useConversations();
  const fingerprintRef = useRef("");

  const handleEvent = useCallback(
    (event: ConversationStreamEvent) => {
      handleConversationStreamEvent(event, {
        messagesRef,
        setMessages: (items) => {
          fingerprintRef.current = messagesFingerprint(items);
          setMessages(items);
        },
        fetchMessages,
        fetchConversation,
        onIncomingMessage,
        currentUserId,
      });
    },
    [
      messagesRef,
      setMessages,
      fetchMessages,
      fetchConversation,
      onIncomingMessage,
      currentUserId,
    ],
  );

  useConversationStream(conversationId, handleEvent);

  useEffect(() => {
    return subscribeConversation(conversationId, handleEvent);
  }, [conversationId, subscribeConversation, handleEvent]);

  useEffect(() => {
    if (!conversationId) return;

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
  }, [conversationId, fetchMessages, setMessages]);
}
