"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { formatCompactNumber } from "@/modules/dashboard/utils/format";

type KpiCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  hint?: string;
};

export function KpiCard({ title, value, icon: Icon, href, hint }: KpiCardProps) {
  const content = (
    <Card className={href ? "transition-colors hover:bg-muted/40" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{formatCompactNumber(value)}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href as never}>{content}</Link>;
  }
  return content;
}
