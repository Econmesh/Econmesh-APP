"use client";

import { useBillingContext } from "@/contexts/billing-context";

export function useBilling() {
  return useBillingContext();
}
