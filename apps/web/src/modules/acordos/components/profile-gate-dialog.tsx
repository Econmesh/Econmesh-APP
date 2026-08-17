"use client";

import { Button } from "@econmesh-app/ui/components/button";
import type { Route } from "next";
import Link from "next/link";

import { MISSING_FIELD_LABELS } from "@/modules/acordos/constants";

const SIGNATURE_AUTHORIZATION_FIELD = "company.signature_authorization";

type ProfileGateDialogProps = {
	missing: string[];
	companyId?: string | null;
	onClose?: () => void;
};

export function ProfileGateDialog({
	missing,
	companyId,
	onClose,
}: ProfileGateDialogProps) {
	const hasAuthorization = missing.includes(SIGNATURE_AUTHORIZATION_FIELD);
	const hasOtherCompany = missing.some(
		(field) => field.startsWith("company.") && field !== SIGNATURE_AUTHORIZATION_FIELD,
	);
	const companyHref =
		hasOtherCompany && companyId
			? (`/dashboard/empresas/${companyId}/editar` as Route)
			: null;
	const profileHref = "/profile" as Route;
	const primaryHref = companyHref ?? profileHref;
	const primaryLabel = companyHref ? "Completar empresa" : "Completar perfil";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-lg">
				<div>
					<h2 className="text-lg font-semibold">Perfil incompleto</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Complete os dados abaixo para criar, enviar ou assinar acordos.
						{hasAuthorization
							? " O documento de autorização de assinatura precisa ser enviado e aprovado."
							: ""}
					</p>
				</div>
				<ul className="list-disc space-y-1 pl-5 text-sm">
					{missing.map((field) => (
						<li key={field}>
							{MISSING_FIELD_LABELS[field] ?? field}
						</li>
					))}
				</ul>
				<div className="flex justify-end gap-2">
					{onClose ? (
						<Button type="button" variant="outline" onClick={onClose}>
							Fechar
						</Button>
					) : null}
					{companyHref && hasAuthorization ? (
						<Link href={profileHref}>
							<Button type="button" variant="outline">
								Enviar documento
							</Button>
						</Link>
					) : null}
					<Link href={primaryHref}>
						<Button type="button">{primaryLabel}</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
