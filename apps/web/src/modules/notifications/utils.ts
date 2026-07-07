import type { UserNotification } from "@/types/api";

export function getNotificationHref(notification: UserNotification): string | null {
  if (notification.kind === "support") {
    const ticketId = notification.metadata?.ticket_id;
    return ticketId ? `/dashboard/suporte/${ticketId}` : "/dashboard/suporte";
  }
  return null;
}
