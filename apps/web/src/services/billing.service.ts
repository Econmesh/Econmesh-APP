import { api } from "@/services/api/client";
import type {
  BillingInvoiceListResponse,
  BillingMe,
  BillingPlanListResponse,
  BillingSubscription,
  BillingType,
  CouponValidateResponse,
  SubscribeResponse,
} from "@/types/api";

export const billingService = {
  me() {
    return api.get<BillingMe>("/billing/me", { auth: true });
  },

  listPlans() {
    return api.get<BillingPlanListResponse>("/billing/plans?page=1&page_size=50", {
      auth: true,
    });
  },

  validateCoupon(code: string, planId: string) {
    return api.post<CouponValidateResponse>(
      "/billing/coupons/validate",
      { code, plan_id: planId },
      { auth: true },
    );
  },

  subscribe(body: { plan_id: string; billing_type: BillingType; coupon_code?: string }) {
    return api.post<SubscribeResponse>("/billing/subscribe", body, { auth: true });
  },

  getSubscription() {
    return api.get<BillingSubscription>("/billing/subscription", { auth: true });
  },

  cancelSubscription() {
    return api.post<BillingSubscription>("/billing/subscription/cancel", {}, { auth: true });
  },

  listInvoices(params?: { page?: number; page_size?: number }) {
    const page = params?.page ?? 1;
    const pageSize = params?.page_size ?? 50;
    return api.get<BillingInvoiceListResponse>(
      `/billing/invoices?page=${page}&page_size=${pageSize}`,
      { auth: true },
    );
  },
};
