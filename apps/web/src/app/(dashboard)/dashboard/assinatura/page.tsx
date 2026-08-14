"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Button } from "@econmesh-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PlansCheckout } from "@/modules/billing/components/plans-checkout";
import {
  BILLING_TYPE_LABEL,
  INVOICE_STATUS_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  formatCycle,
  formatMoneyBRL,
} from "@/modules/billing/utils";
import { billingService } from "@/services/billing.service";
import type { BillingInvoice, BillingMe, BillingPlan } from "@/types/api";
import { ApiError } from "@/utils/errors";

function AssinaturaContent() {
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get("checkout");
  const [billing, setBilling] = useState<BillingMe | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, planList, invoiceList] = await Promise.all([
        billingService.me(),
        billingService.listPlans().catch(() => ({ items: [] as BillingPlan[] })),
        billingService.listInvoices().catch(() => ({ items: [] as BillingInvoice[] })),
      ]);
      setBilling(me);
      setPlans(planList.items);
      setInvoices(invoiceList.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível carregar a assinatura.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel() {
    if (!window.confirm("Deseja cancelar a assinatura? O acesso será encerrado.")) {
      return;
    }
    setCancelling(true);
    try {
      await billingService.cancelSubscription();
      toast.success("Assinatura cancelada.");
      await load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível cancelar a assinatura.",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading || !billing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const subscription = billing.subscription;
  const hasAccess = billing.has_access;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assinatura</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu plano, faturas e cancelamento.
        </p>
      </div>

      {checkoutState === "cancel" ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          O checkout foi cancelado. Você pode tentar novamente abaixo.
        </p>
      ) : null}

      {hasAccess && subscription ? (
        <Card>
          <CardHeader>
            <CardTitle>{subscription.plan_name ?? "Plano atual"}</CardTitle>
            <CardDescription>
              {formatMoneyBRL(subscription.price)}/{formatCycle(subscription.cycle)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{SUBSCRIPTION_STATUS_LABEL[subscription.status]}</Badge>
              <Badge variant="secondary">
                {BILLING_TYPE_LABEL[subscription.billing_type]}
              </Badge>
            </div>
            {subscription.trial_ends_at ? (
              <p className="text-sm text-muted-foreground">
                Trial até {new Date(subscription.trial_ends_at).toLocaleDateString("pt-BR")}
              </p>
            ) : null}
            {subscription.current_period_end ? (
              <p className="text-sm text-muted-foreground">
                Próximo vencimento:{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
              </p>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={cancelling}
            >
              Cancelar assinatura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <PlansCheckout billing={billing} plans={plans} onRefresh={load} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Faturas</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma fatura encontrada.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium">{formatMoneyBRL(invoice.value)}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.due_date
                      ? `Vencimento ${new Date(invoice.due_date).toLocaleDateString("pt-BR")}`
                      : "Sem vencimento"}
                    {" · "}
                    {INVOICE_STATUS_LABEL[invoice.status]}
                  </p>
                </div>
                <div className="flex gap-2">
                  {invoice.invoice_url ? (
                    <a href={invoice.invoice_url} target="_blank" rel="noreferrer">
                      <Button type="button" variant="outline" size="sm">
                        Pagar / ver fatura
                      </Button>
                    </a>
                  ) : null}
                  {invoice.bank_slip_url ? (
                    <a href={invoice.bank_slip_url} target="_blank" rel="noreferrer">
                      <Button type="button" variant="outline" size="sm">
                        Boleto
                      </Button>
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssinaturaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
      <AssinaturaContent />
    </Suspense>
  );
}
