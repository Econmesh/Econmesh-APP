"use client";

import type { UserNotification } from "@/types/api";

export function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return date.toLocaleDateString("pt-BR");
}

type NotificationItemProps = {
  notification: UserNotification;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
};

export function NotificationItem({
  notification,
  onMarkRead,
  compact = false,
}: NotificationItemProps) {
  const isUnread = !notification.read_at;

  return (
    <button
      type="button"
      className={`w-full text-left transition-colors ${
        compact ? "px-2 py-2" : "p-4"
      } ${isUnread ? "bg-red-50/60 dark:bg-red-950/20" : "bg-card"}`}
      onClick={() => {
        if (isUnread && onMarkRead) {
          onMarkRead(notification.id);
        }
      }}
    >
      <div className="flex items-start gap-2">
        {isUnread ? (
          <span
            className="mt-1.5 size-2 shrink-0 rounded-full bg-red-600"
            aria-hidden
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={`leading-tight ${isUnread ? "font-semibold" : "font-medium"}`}>
            {notification.title}
          </p>
          <p
            className={`mt-1 text-muted-foreground whitespace-pre-wrap ${
              compact ? "line-clamp-2 text-xs" : "text-sm"
            }`}
          >
            {notification.body}
          </p>
          <p className={`mt-1 text-muted-foreground ${compact ? "text-[10px]" : "text-xs"}`}>
            {compact
              ? formatRelativeTime(notification.created_at)
              : new Date(notification.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>
    </button>
  );
}
