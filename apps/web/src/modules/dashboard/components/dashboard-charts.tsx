"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { FunnelStage, NamedCount, TimeSeriesPoint } from "@/types/dashboard";
import {
  CHART_COLORS,
  formatCompactNumber,
  formatShortDate,
} from "@/modules/dashboard/utils/format";

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0",
  color: "var(--card-foreground)",
  fontSize: 12,
};

export function FunnelChartCard({ data }: { data: FunnelStage[] }) {
  const chartData = data.map((item) => ({
    name: item.label,
    value: item.count,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Seu funil</CardTitle>
        <CardDescription>
          Oportunidade → conversa → minuta → acordo
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.every((d) => d.value === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [formatCompactNumber(Number(v)), "Total"]}
              />
              <Bar dataKey="value" radius={0} fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function StatusPieCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: NamedCount[];
}) {
  const chartData = data.map((item) => ({
    name: item.label ?? item.key,
    value: item.count,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length === 0 || chartData.every((d) => d.value === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={84}
                paddingAngle={2}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={chartData[index]?.name ?? index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => formatCompactNumber(Number(v))}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function NamedBarCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: NamedCount[];
}) {
  const chartData = data.map((item) => ({
    name: item.label ?? item.key,
    value: item.count,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length === 0 || chartData.every((d) => d.value === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 0, right: 8, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => formatCompactNumber(Number(v))}
              />
              <Bar dataKey="value" radius={0}>
                {chartData.map((_, index) => (
                  <Cell
                    key={chartData[index]?.name ?? index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityLineCard({
  data,
  days,
}: {
  data: TimeSeriesPoint[];
  days: number;
}) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
        <CardDescription>Últimos {days} dias</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.every(
          (d) =>
            d.opportunities === 0 &&
            d.conversations === 0 &&
            d.proposals === 0 &&
            d.agreements_signed === 0,
        ) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="opportunities"
                name="Oportunidades"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="conversations"
                name="Conversas"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="proposals"
                name="Minutas"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="agreements_signed"
                name="Assinados"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Sem dados no período
    </div>
  );
}
