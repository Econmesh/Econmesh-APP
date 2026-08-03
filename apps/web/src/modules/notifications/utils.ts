import type { Route } from "next";

import type { UserNotification } from "@/types/api";

export function getNotificationHref(notification: UserNotification): Route | null {
  if (notification.kind === "support") {
    const ticketId = notification.metadata?.ticket_id;
    return ticketId ? (`/dashboard/suporte/${ticketId}` as Route) : "/dashboard/suporte";
  }
  if (notification.kind === "agreement") {
    return "/dashboard/acordos";
  }
  if (notification.kind === "agreement") {
    const agreementId = notification.metadata?.agreement_id;
    return agreementId ? `/dashboard/acordos/${agreementId}` : "/dashboard/acordos";
  }
  return null;
}
