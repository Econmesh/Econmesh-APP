"use client";

import { useEffect } from "react";

import { NotificationList } from "@/modules/notifications/components/notification-list";
import { useNotifications } from "@/contexts/notification-context";

export default function NotificacoesPage() {
  const { refresh, loading } = useNotifications();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notificações</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe avisos e atualizações da plataforma.
        </p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <NotificationList />
      )}
    </div>
  );
}
