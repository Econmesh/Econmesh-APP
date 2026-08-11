"use client";

import { Button } from "@econmesh-app/ui/components/button";

type MinutaApprovedDialogProps = {
  onConfirm: () => void;
};

export function MinutaApprovedDialog({ onConfirm }: MinutaApprovedDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="minuta-approved-title"
        className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-lg"
      >
        <div>
          <h2 id="minuta-approved-title" className="text-lg font-semibold">
            Minuta aprovada!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A outra empresa aprovou a minuta e o processo de acordo foi iniciado.
            Você será direcionado para os Acordos para acompanhar o processo de
            assinatura.
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onConfirm}>
            Ir para Acordos
          </Button>
        </div>
      </div>
    </div>
  );
}
