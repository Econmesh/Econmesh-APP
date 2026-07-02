"use client";

import { cn } from "@econmesh-app/ui/lib/utils";
import { useEffect, useRef } from "react";
import type { SupportMessage } from "@/types/api";

type MessageThreadProps = {
  messages: SupportMessage[];
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

export function MessageThread({ messages, currentUserId, autoScroll }: MessageThreadProps) {
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
        Nenhuma mensagem ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((msg) => {
        const isUser = msg.author_role === "user" || msg.author_id === currentUserId;
        const isAdminReply = msg.message_type === "admin_reply";

        return (
          <div
            key={msg.id}
            className={cn("flex", isUser ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                isUser
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : isAdminReply
                    ? "rounded-bl-md bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50"
                    : "rounded-bl-md bg-muted",
              )}
            >
              {!isUser && msg.author_name && (
                <p className="mb-1 text-xs font-semibold opacity-80">{msg.author_name}</p>
              )}
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              <p
                className={cn(
                  "mt-1 text-[10px] opacity-70",
                  isUser ? "text-right" : "text-left",
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
