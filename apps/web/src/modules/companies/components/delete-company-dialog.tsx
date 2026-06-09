"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { companiesService } from "@/services/companies/companies.service";
import type { Company } from "@/types/api";
import { ApiError } from "@/utils/errors";

type DeleteCompanyDialogProps = {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function DeleteCompanyDialog({
  company,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCompanyDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await companiesService.delete(company.id);
      toast.success("Empresa excluída com sucesso.");
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível excluir a empresa.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-company-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 id="delete-company-title" className="text-lg font-semibold">
          Excluir empresa
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tem certeza que deseja excluir <strong>{company.legal_name}</strong>? Esta
          ação não pode ser desfeita.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void handleConfirm()}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Excluindo…
              </>
            ) : (
              "Excluir"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
