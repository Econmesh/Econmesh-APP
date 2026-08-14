"use client";

import { cn } from "@econmesh-app/ui/lib/utils";
import { useEffect, useRef } from "react";

import { formatSystemEventBody } from "@/modules/conversations/conversation-realtime";
import type { ConversationMessage } from "@/types/api";

type ConversationMessageThreadProps = {
  messages: ConversationMessage[];
  currentUserId?: string;
  autoScroll?: boolean;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationMessageThread({
  messages,
  currentUserId,
  autoScroll,
}: ConversationMessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    if (!autoScroll) return;
    if (messages.length >= prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages, autoScroll]);

  if (messages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma mensagem ainda. Envie a primeira para iniciar o diálogo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((msg) => {
        if (msg.message_type === "system_event") {
          const body =
            currentUserId && msg.event_kind
              ? formatSystemEventBody(msg, currentUserId)
              : msg.body;
          return (
            <div key={msg.id} className="flex justify-center px-2">
              <div className="max-w-[90%] rounded-lg bg-muted/70 px-3 py-2 text-center text-xs text-muted-foreground">
                <p className="whitespace-pre-wrap break-words">{body}</p>
                <p className="mt-1 text-[10px] opacity-70">{formatTime(msg.created_at)}</p>
              </div>
            </div>
          );
        }

        const isMine = msg.author_id === currentUserId;

        return (
          <div
            key={msg.id}
            className={cn("flex", isMine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                isMine
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted",
              )}
            >
              {!isMine && msg.author_name && (
                <p className="mb-1 text-xs font-semibold opacity-80">{msg.author_name}</p>
              )}
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              <p
                className={cn(
                  "mt-1 text-[10px] opacity-70",
                  isMine ? "text-right" : "text-left",
                )}
              >
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
