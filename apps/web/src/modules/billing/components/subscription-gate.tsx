"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { useBilling } from "@/hooks/use-billing";
import { isSubscriptionLockedPath } from "@/modules/billing/access";
import { PlansCheckout } from "@/modules/billing/components/plans-checkout";

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");
  const { billing, plans, loading, hasAccess, refresh } = useBilling();

  const lockedPath = isSubscriptionLockedPath(pathname);
  const blocked = Boolean(billing && !hasAccess && lockedPath);
  const isCheckoutReturn =
    pathname.startsWith("/dashboard/assinatura") &&
    (checkoutState === "success" || checkoutState === "cancel");
  const showProcessing = blocked && checkoutState === "success";
  const showOverlay = (blocked && !isCheckoutReturn) || showProcessing;

  if (loading || !billing) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-14 z-40 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-lg">
          Verificando sua assinatura…
        </div>
      </div>
    );
  }

  if (showOverlay) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 top-14 z-40 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-gate-title"
      >
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-card p-6 shadow-xl">
          <h1 id="subscription-gate-title" className="sr-only">
            Assinatura pendente
          </h1>
          {billing ? (
            <PlansCheckout
              billing={billing}
              plans={plans}
              processing={showProcessing}
              onRefresh={refresh}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return children;
}
