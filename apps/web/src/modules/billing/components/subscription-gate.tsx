"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { PlansCheckout } from "@/modules/billing/components/plans-checkout";
import { billingService } from "@/services/billing.service";
import type { BillingMe, BillingPlan } from "@/types/api";

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");
  const isCheckoutReturn =
    pathname.startsWith("/dashboard/assinatura") &&
    (checkoutState === "success" || checkoutState === "cancel");

  const [billing, setBilling] = useState<BillingMe | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [me, planList] = await Promise.all([
        billingService.me(),
        billingService.listPlans().catch(() => ({ items: [] as BillingPlan[] })),
      ]);
      setBilling(me);
      setPlans(planList.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const blocked = Boolean(billing && !billing.has_access && !billing.is_admin);

  useEffect(() => {
    if (!blocked) return;
    const timer = window.setInterval(() => {
      void load();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [blocked, load]);

  const showOverlay = blocked && !isCheckoutReturn;
  const showProcessing = blocked && checkoutState === "success";

  return (
    <>
      {children}
      {loading && !billing ? (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-lg">
            Verificando sua assinatura…
          </div>
        </div>
      ) : null}
      {showOverlay || showProcessing ? (
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
                onRefresh={load}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
