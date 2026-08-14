import type { Route } from "next";

import type { UserNotification } from "@/types/api";

export function getNotificationHref(notification: UserNotification): Route | null {
  if (notification.kind === "support") {
    const ticketId = notification.metadata?.ticket_id;
    return ticketId ? (`/dashboard/suporte/${ticketId}` as Route) : "/dashboard/suporte";
  }
  if (notification.kind === "agreement") {
    const agreementId = notification.metadata?.agreement_id;
    if (!agreementId) return "/dashboard/acordos";
    if (notification.metadata?.event === "minuta_approved") {
      return `/dashboard/acordos/${agreementId}` as Route;
    }
    return `/dashboard/acordos/${agreementId}` as Route;
  }
  if (notification.kind === "compliance") {
    return "/dashboard/empresas";
  }
  return null;
}
