"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { billingService } from "@/services/billing.service";
import type { BillingMe, BillingPlan } from "@/types/api";

type BillingContextValue = {
  billing: BillingMe | null;
  plans: BillingPlan[];
  loading: boolean;
  hasAccess: boolean;
  refresh: () => Promise<void>;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const [billing, setBilling] = useState<BillingMe | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
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
    void refresh();
  }, [refresh]);

  const hasAccess = Boolean(billing?.has_access || billing?.is_admin);
  const shouldPoll = !billing || !hasAccess;

  useEffect(() => {
    if (!shouldPoll) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [refresh, shouldPoll]);

  const value = useMemo(
    () => ({
      billing,
      plans,
      loading,
      hasAccess,
      refresh,
    }),
    [billing, hasAccess, loading, plans, refresh],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBillingContext(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error("useBillingContext must be used within BillingProvider");
  }
  return ctx;
}
