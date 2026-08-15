import type { BillingType, InvoiceStatus, SubscriptionStatus } from "@/types/api";

export function formatMoneyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCycle(cycle: "MONTHLY" | "YEARLY"): string {
  return cycle === "YEARLY" ? "ano" : "mês";
}

export const BILLING_TYPE_LABEL: Record<BillingType, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de crédito",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending: "Pendente",
  trialing: "Período de teste",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  cancelled: "Cancelada",
  expired: "Expirada",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  received: "Paga",
  overdue: "Vencida",
  refunded: "Estornada",
  deleted: "Removida",
  other: "Outro",
};
