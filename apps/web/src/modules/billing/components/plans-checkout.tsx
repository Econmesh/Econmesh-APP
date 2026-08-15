"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  BILLING_TYPE_LABEL,
  formatCycle,
  formatMoneyBRL,
} from "@/modules/billing/utils";
import { billingService } from "@/services/billing.service";
import type { BillingMe, BillingPlan, BillingType } from "@/types/api";
import { ApiError } from "@/utils/errors";

type PlansCheckoutProps = {
  billing: BillingMe;
  plans: BillingPlan[];
  processing?: boolean;
  onRefresh?: () => Promise<void>;
};

export function PlansCheckout({
  billing,
  plans,
  processing = false,
  onRefresh,
}: PlansCheckoutProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? "");
  const [billingType, setBillingType] = useState<BillingType>(
    billing.allowed_billing_types[0] ?? "PIX",
  );
  const [coupon, setCoupon] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0],
    [plans, selectedPlanId],
  );

  const trialDays = selectedPlan?.trial_days ?? billing.trial_days;
  const showTrial = billing.trial_enabled && trialDays > 0;
  const price = discountedPrice ?? selectedPlan?.price ?? 0;

  async function applyCoupon() {
    if (!selectedPlan || !coupon.trim()) return;
    setValidating(true);
    try {
      const result = await billingService.validateCoupon(coupon.trim(), selectedPlan.id);
      setDiscountedPrice(result.discounted_price);
      toast.success("Cupom aplicado.");
    } catch (error) {
      setDiscountedPrice(null);
      toast.error(error instanceof ApiError ? error.message : "Cupom inválido.");
    } finally {
      setValidating(false);
    }
  }

  async function handleSubscribe() {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const result = await billingService.subscribe({
        plan_id: selectedPlan.id,
        billing_type: billingType,
        coupon_code: coupon.trim() || undefined,
      });
      const url = result.checkout_url || result.invoice_url;
      if (url) {
        window.location.href = url;
        return;
      }
      toast.success("Assinatura iniciada.");
      await onRefresh?.();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível iniciar a assinatura.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const payUrl =
    billing.subscription?.checkout_url || billing.subscription?.invoice_url || null;
  const awaitingPayment =
    billing.status === "pending" && Boolean(payUrl) && !billing.has_access;

  if (processing || awaitingPayment) {
    return (
      <div className="space-y-4 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <h2 className="text-lg font-semibold">Pagamento pendente</h2>
        <p className="text-sm text-muted-foreground">
          {processing
            ? "Estamos aguardando a confirmação do pagamento. Isso pode levar alguns segundos."
            : "Conclua o pagamento no Asaas. Quando for confirmado, o acesso é liberado automaticamente."}
        </p>
        {payUrl ? (
          <a href={payUrl} target="_blank" rel="noreferrer">
            <Button type="button">Abrir fatura / boleto</Button>
          </a>
        ) : null}
        <Button type="button" variant="outline" onClick={() => void onRefresh?.()}>
          Já paguei — atualizar
        </Button>
      </div>
    );
  }

  if (!billing.company_id) {
    return (
      <div className="space-y-3 text-center">
        <h2 className="text-lg font-semibold">Cadastre sua empresa</h2>
        <p className="text-sm text-muted-foreground">
          É necessário ter uma empresa cadastrada para assinar um plano.
        </p>
        <Link href="/dashboard/empresas">
          <Button type="button">Ir para empresa</Button>
        </Link>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Nenhum plano disponível no momento. Tente novamente mais tarde.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Pendente</p>
        <h2 className="mt-1 text-xl font-semibold">Escolha um plano para continuar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {showTrial
            ? `Inclui ${trialDays} dia${trialDays === 1 ? "" : "s"} de teste. Informe o meio de pagamento agora; a primeira cobrança vence no fim do trial.`
            : "Selecione o plano e o meio de pagamento para liberar a plataforma."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => {
          const selected = plan.id === selectedPlan?.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => {
                setSelectedPlanId(plan.id);
                setDiscountedPrice(null);
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-semibold">{plan.name}</p>
              <p className="mt-1 text-lg font-bold">
                {formatMoneyBRL(plan.price)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{formatCycle(plan.cycle)}
                </span>
              </p>
              {plan.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              ) : null}
              {plan.features.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Meio de pagamento</p>
        <div className="flex flex-wrap gap-2">
          {billing.allowed_billing_types.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={billingType === type ? "default" : "outline"}
              onClick={() => setBillingType(type)}
            >
              {BILLING_TYPE_LABEL[type]}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={coupon}
          onChange={(event) => {
            setCoupon(event.target.value.toUpperCase());
            setDiscountedPrice(null);
          }}
          placeholder="Cupom de desconto"
          aria-label="Cupom de desconto"
        />
        <Button type="button" variant="outline" onClick={() => void applyCoupon()} disabled={validating}>
          {validating ? <Loader2 className="size-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm">
          Total: <span className="font-semibold">{formatMoneyBRL(price)}</span>
        </p>
        <Button type="button" onClick={() => void handleSubscribe()} disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {showTrial ? "Iniciar período de teste" : "Assinar agora"}
        </Button>
      </div>
    </div>
  );
}
