"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import {
  Building2,
  FileSignature,
  Handshake,
  Headphones,
  MessageCircle,
  ScrollText,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  ActivityLineCard,
  FunnelChartCard,
  NamedBarCard,
  StatusPieCard,
} from "@/modules/dashboard/components/dashboard-charts";
import { KpiCard } from "@/modules/dashboard/components/kpi-card";
import { formatCurrencyBRL } from "@/modules/dashboard/utils/format";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import type { UserDashboardResponse } from "@/types/dashboard";

const ACTION_KIND_LABEL: Record<string, string> = {
  proposal: "Minuta",
  agreement: "Acordo",
  conversation: "Conversa",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<UserDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await dashboardService.get(30);
        if (!cancelled) setData(response);
      } catch {
        if (!cancelled) setError("Não foi possível carregar o dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Olá, {user.name ?? user.email}. Acompanhe suas oportunidades, negociações e
          acordos.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Empresas"
              value={data.totals.companies}
              icon={Building2}
              href="/dashboard/empresas"
            />
            <KpiCard
              title="Oportunidades"
              value={data.totals.opportunities_active}
              icon={Target}
              href="/dashboard/oportunidades"
            />
            <KpiCard
              title="Conversas abertas"
              value={data.totals.conversations_open}
              icon={MessageCircle}
              href="/dashboard/conversas"
            />
            <KpiCard
              title="Minutas pendentes"
              value={data.totals.proposals_pending}
              icon={ScrollText}
              hint={`${data.totals.proposals} no total`}
            />
            <KpiCard
              title="Acordos em andamento"
              value={data.totals.agreements_pending}
              icon={Handshake}
              href="/dashboard/acordos"
              hint={`${data.totals.agreements_signed} assinados`}
            />
            <KpiCard
              title="Acordos assinados"
              value={data.totals.agreements_signed}
              icon={FileSignature}
              href="/dashboard/acordos"
            />
            <KpiCard
              title="Tickets abertos"
              value={data.totals.support_open}
              icon={Headphones}
              href="/dashboard/suporte"
            />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tracking-tight">
                  {formatCurrencyBRL(data.estimated_gmv)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nas suas oportunidades com preço
                </p>
              </CardContent>
            </Card>
          </div>

          {data.action_items.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Precisa de ação</CardTitle>
                <CardDescription>
                  Minutas, acordos e conversas que pedem sua atenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {data.action_items.map((item) => (
                    <li key={`${item.kind}-${item.href}`}>
                      <Link
                        href={item.href as never}
                        className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          {item.meta ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.meta}
                            </p>
                          ) : null}
                        </div>
                        <Badge variant="secondary">
                          {ACTION_KIND_LABEL[item.kind] ?? item.kind}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <FunnelChartCard data={data.funnel} />
            <ActivityLineCard data={data.timeseries} days={data.days} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <StatusPieCard
              title="Acordos por status"
              description="Seu pipeline de assinaturas"
              data={data.agreements_by_status}
            />
            <StatusPieCard
              title="Minutas por status"
              description="Ciclo de aprovação"
              data={data.proposals_by_status}
            />
            <NamedBarCard
              title="Tipo de oportunidade"
              description="Suas publicações ativas"
              data={data.opportunities_by_type}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <NamedBarCard
              title="Oferta × demanda"
              description="Geradores e receptores"
              data={data.opportunities_by_offer_demand}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
