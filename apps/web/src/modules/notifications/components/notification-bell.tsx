"use client";

import { Button } from "@econmesh-app/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@econmesh-app/ui/components/dropdown-menu";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useNotifications } from "@/contexts/notification-context";
import { NotificationItem } from "@/modules/notifications/components/notification-item";

export function NotificationBell() {
  const {
    unreadNotifications,
    readNotifications,
    unreadCount,
    loadReadNotifications,
    loadingRead,
    hasMoreRead,
    markRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [showAllRead, setShowAllRead] = useState(false);

  const hasUnread = unreadNotifications.length > 0;

  useEffect(() => {
    if (!open) {
      setShowAllRead(false);
      return;
    }
    if (!hasUnread && readNotifications.length === 0) {
      void loadReadNotifications();
    }
  }, [open, hasUnread, readNotifications.length, loadReadNotifications]);

  const visibleRead = showAllRead
    ? readNotifications
    : hasUnread
      ? []
      : readNotifications.slice(0, 5);

  const canShowMoreRead = !showAllRead && (hasUnread || hasMoreRead);

  async function handleShowMoreRead() {
    await loadReadNotifications({ all: true });
    setShowAllRead(true);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ""}`}
            aria-expanded={open}
          />
        }
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-background"
            aria-hidden
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0">
        <DropdownMenuGroup className="px-2 pt-2">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificações</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {hasUnread ? (
          <div className="max-h-72 overflow-y-auto">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
              Não lidas
            </p>
            {unreadNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer rounded-none p-0 focus:bg-transparent"
                onClick={() => void markRead(notification.id)}
              >
                <NotificationItem
                  notification={notification}
                  compact
                  onMarkRead={(id) => void markRead(id)}
                />
              </DropdownMenuItem>
            ))}
          </div>
        ) : readNotifications.length === 0 && !loadingRead ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </p>
        ) : null}

        {visibleRead.length > 0 ? (
          <div className={hasUnread ? "max-h-48 overflow-y-auto border-t border-border" : ""}>
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Lidas
            </p>
            {visibleRead.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-default rounded-none p-0 opacity-80 focus:bg-transparent"
              >
                <NotificationItem notification={notification} compact />
              </DropdownMenuItem>
            ))}
          </div>
        ) : null}

        {canShowMoreRead ? (
          <div className="border-t border-border px-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              disabled={loadingRead}
              onClick={() => void handleShowMoreRead()}
            >
              {loadingRead ? "Carregando…" : "Ver mais"}
            </Button>
          </div>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/notificacoes" />} className="mx-1 mb-1">
          Ver todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
