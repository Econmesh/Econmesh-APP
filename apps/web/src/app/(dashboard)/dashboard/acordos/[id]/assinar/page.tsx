"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Label } from "@econmesh-app/ui/components/label";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ProfileGateDialog } from "@/modules/acordos/components/profile-gate-dialog";
import {
	FIELD_TYPE_LABELS,
	formatAgreementDate,
} from "@/modules/acordos/constants";
import { useAuth } from "@/hooks/use-auth";
import { agreementsService } from "@/services/acordos/acordos.service";
import { ApiError } from "@/utils/errors";
import type { Agreement, AgreementField } from "@/types/api";

export default function AssinarAcordoPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const [agreement, setAgreement] = useState<Agreement | null>(null);
	const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
	const [signatureData, setSignatureData] = useState("");
	const [rejectReason, setRejectReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [missing, setMissing] = useState<string[] | null>(null);

	useEffect(() => {
		void agreementsService.get(params.id).then((doc) => {
			setAgreement(doc);
			void agreementsService.view(params.id);
		});
		void agreementsService.eligibility().then((res) => {
			if (!res.eligible) setMissing(res.missing);
		});
	}, [params.id]);

	const myFields = useMemo(() => {
		if (!agreement || !user?.email) return [] as AgreementField[];
		const me = agreement.participants.find(
			(p) => p.email.toLowerCase() === user.email!.toLowerCase(),
		);
		if (!me) return [];
		return agreement.fields.filter((f) => f.participant_id === me.id);
	}, [agreement, user?.email]);

	async function sign() {
		setSubmitting(true);
		try {
			await agreementsService.sign(params.id, {
				field_values: fieldValues,
				signature_data: signatureData || undefined,
			});
			toast.success("Assinatura registrada.");
			router.push(`/dashboard/acordos/${params.id}` as Route);
		} catch (err) {
			if (err instanceof ApiError && err.code === "profile_incomplete") {
				const details = err.details as { missing?: string[] } | null;
				setMissing(details?.missing ?? []);
			} else {
				toast.error(
					err instanceof ApiError ? err.message : "Falha ao assinar.",
				);
			}
		} finally {
			setSubmitting(false);
		}
	}

	async function reject() {
		if (rejectReason.trim().length < 2) {
			toast.error("Informe o motivo da rejeição.");
			return;
		}
		setSubmitting(true);
		try {
			await agreementsService.reject(params.id, rejectReason.trim());
			toast.success("Acordo rejeitado.");
			router.push(`/dashboard/acordos/${params.id}` as Route);
		} catch (err) {
			toast.error(
				err instanceof ApiError ? err.message : "Falha ao rejeitar.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	if (!agreement) {
		return <p className="text-sm text-muted-foreground">Carregando…</p>;
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<Link
					href={`/dashboard/acordos/${params.id}` as Route}
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Voltar
				</Link>
				<h1 className="mt-2 text-2xl font-semibold">Assinar acordo</h1>
				<p className="text-sm text-muted-foreground">{agreement.title}</p>
				{agreement.deadline ? (
					<p className="text-xs text-muted-foreground">
						Prazo: {formatAgreementDate(agreement.deadline)}
					</p>
				) : null}
			</div>

			{agreement.original_file || agreement.signed_file ? (
				<iframe
					title="Documento"
					src={(agreement.signed_file || agreement.original_file)!.url}
					className="h-[480px] w-full rounded-xl border"
				/>
			) : null}

			<section className="space-y-4 rounded-xl border bg-card/80 p-5">
				<h2 className="font-semibold">Seus campos</h2>
				{myFields.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nenhum campo atribuído a você. Você ainda pode concluir sua etapa.
					</p>
				) : (
					myFields.map((field) => (
						<div key={field.id} className="space-y-1">
							<Label>
								{FIELD_TYPE_LABELS[field.field_type]} (pág. {field.page})
							</Label>
							{field.field_type === "checkbox" ? (
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={fieldValues[field.id] === "true"}
										onChange={(e) =>
											setFieldValues((prev) => ({
												...prev,
												[field.id]: e.target.checked ? "true" : "false",
											}))
										}
									/>
									Confirmar
								</label>
							) : field.field_type === "signature" ? (
								<Input
									placeholder="Digite seu nome completo como assinatura"
									value={signatureData}
									onChange={(e) => setSignatureData(e.target.value)}
								/>
							) : (
								<Input
									value={fieldValues[field.id] ?? ""}
									onChange={(e) =>
										setFieldValues((prev) => ({
											...prev,
											[field.id]: e.target.value,
										}))
									}
								/>
							)}
						</div>
					))
				)}

				<div className="flex flex-wrap gap-2 pt-2">
					<Button type="button" disabled={submitting} onClick={() => void sign()}>
						{submitting ? "Processando…" : "Concluir assinatura"}
					</Button>
				</div>
			</section>

			<section className="space-y-3 rounded-xl border border-destructive/30 bg-card/80 p-5">
				<h2 className="font-semibold text-destructive">Rejeitar acordo</h2>
				<Input
					placeholder="Motivo da rejeição"
					value={rejectReason}
					onChange={(e) => setRejectReason(e.target.value)}
				/>
				<Button
					type="button"
					variant="outline"
					disabled={submitting}
					onClick={() => void reject()}
				>
					Rejeitar
				</Button>
			</section>

			{missing && missing.length > 0 ? (
				<ProfileGateDialog
					missing={missing}
					onClose={() => setMissing(null)}
				/>
			) : null}
		</div>
	);
}
