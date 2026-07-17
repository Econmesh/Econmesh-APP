import type { Route } from "next";

import type { UserNotification } from "@/types/api";

export function getNotificationHref(notification: UserNotification): Route | null {
  if (notification.kind === "support") {
    const ticketId = notification.metadata?.ticket_id;
    return ticketId ? (`/dashboard/suporte/${ticketId}` as Route) : "/dashboard/suporte";
  }
  return null;
}
