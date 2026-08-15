"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { CreditCard } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export function SubscriptionNudgeBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-4 shadow-sm sm:px-5"
      role="status"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-destructive/15"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
            <CreditCard className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-destructive">Assinatura necessária</p>
            <p className="text-sm text-destructive/90">
              Assine um plano para ver detalhes das oportunidades, publicar ofertas e
              acessar conversas e acordos.
            </p>
          </div>
        </div>
        <Link href={"/dashboard/assinatura" as Route} >
          <Button type="button" variant="destructive">
            Assinar agora
          </Button>
        </Link>
      </div>
    </div>
  );
}
