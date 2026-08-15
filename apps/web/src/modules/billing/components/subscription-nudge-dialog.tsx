"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { CreditCard, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type SubscriptionNudgeDialogProps = {
  onClose: () => void;
};

export function SubscriptionNudgeDialog({ onClose }: SubscriptionNudgeDialogProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 top-14 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-nudge-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-destructive/40 bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-destructive" aria-hidden />
        <button
          type="button"
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>
        <div className="space-y-4 p-6 pt-5">
          <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <CreditCard className="size-6" aria-hidden />
          </div>
          <div className="space-y-2 pr-6">
            <h2 id="subscription-nudge-title" className="text-lg font-semibold">
              Ative sua assinatura
            </h2>
            <p className="text-sm text-muted-foreground">
              Sem um plano ativo você só vê uma prévia das oportunidades. Assine para
              desbloquear detalhes, publicação, conversas e acordos.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Link href={"/dashboard/assinatura" as Route}>
              <Button type="button" variant="destructive">
                Assinar agora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
