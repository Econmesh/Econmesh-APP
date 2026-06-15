"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { opportunitiesService } from "@/services/opportunities/opportunities.service";
import type { Opportunity } from "@/types/api";
import { ApiError } from "@/utils/errors";

type DeleteOpportunityDialogProps = {
	opportunity: Opportunity;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => void;
};

export function DeleteOpportunityDialog({
	opportunity,
	open,
	onOpenChange,
	onDeleted,
}: DeleteOpportunityDialogProps) {
	const [loading, setLoading] = useState(false);

	if (!open) return null;

	async function handleConfirm() {
		setLoading(true);
		try {
			await opportunitiesService.delete(opportunity.id);
			toast.success("Oportunidade excluída com sucesso.");
			onOpenChange(false);
			onDeleted();
		} catch (error) {
			toast.error(
				error instanceof ApiError
					? error.message
					: "Não foi possível excluir a oportunidade.",
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
			aria-labelledby="delete-opportunity-title"
		>
			<div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
				<h2 id="delete-opportunity-title" className="font-semibold text-lg">
					Excluir oportunidade
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					Tem certeza que deseja excluir <strong>{opportunity.title}</strong>?
					Esta ação não pode ser desfeita.
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
