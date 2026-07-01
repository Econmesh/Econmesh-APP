"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { useNotifications } from "@/contexts/notification-context";
import { NotificationItem } from "@/modules/notifications/components/notification-item";

export function NotificationList() {
  const {
    unreadNotifications,
    readNotifications,
    loadReadNotifications,
    loadingRead,
    hasMoreRead,
    markRead,
    markAllRead,
  } = useNotifications();
  const [showAllRead, setShowAllRead] = useState(false);

  const hasUnread = unreadNotifications.length > 0;

  useEffect(() => {
    if (!hasUnread && readNotifications.length === 0) {
      void loadReadNotifications();
    }
  }, [hasUnread, readNotifications.length, loadReadNotifications]);

  const visibleRead = showAllRead
    ? readNotifications
    : hasUnread
      ? []
      : readNotifications.slice(0, 5);

  const isEmpty = !hasUnread && readNotifications.length === 0 && !loadingRead;

  const canShowMoreRead = !showAllRead && (hasUnread || hasMoreRead);

  async function handleShowMoreRead() {
    await loadReadNotifications({ all: true });
    setShowAllRead(true);
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={Bell}
        title="Nenhuma notificação"
        description="Quando houver novidades, elas aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-6">
      {hasUnread ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-red-600">
              Não lidas ({unreadNotifications.length})
            </h2>
            <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
              Marcar todas como lidas
            </Button>
          </div>
          <ul className="max-h-[min(70vh,32rem)] divide-y divide-border overflow-y-auto rounded-xl border border-red-200/80 dark:border-red-900/50">
            {unreadNotifications.map((notification) => (
              <li key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onMarkRead={(id) => void markRead(id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {visibleRead.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Lidas</h2>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {visibleRead.map((notification) => (
              <li key={notification.id}>
                <NotificationItem notification={notification} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canShowMoreRead ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingRead}
            onClick={() => void handleShowMoreRead()}
          >
            {loadingRead ? "Carregando…" : "Ver mais"}
          </Button>
        </div>
      ) : null}

      {!hasUnread && readNotifications.length === 0 && loadingRead ? (
        <p className="text-center text-sm text-muted-foreground">Carregando…</p>
      ) : null}
    </div>
  );
}
