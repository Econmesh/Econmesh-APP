"use client";

import { Button } from "@econmesh-app/ui/components/button";
import {
	CheckCircle2,
	Clock3,
	Download,
	FilePenLine,
	Send,
	XCircle,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
	AGREEMENT_STATUS_CLASSES,
	AGREEMENT_STATUS_LABELS,
	PARTICIPANT_ROLE_LABELS,
	formatAgreementDate,
} from "@/modules/acordos/constants";
import { useAuth } from "@/hooks/use-auth";
import { agreementsService } from "@/services/acordos/acordos.service";
import { ApiError } from "@/utils/errors";
import type { Agreement, AgreementProgress, TimelineEvent } from "@/types/api";

export default function AcordoDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const [agreement, setAgreement] = useState<Agreement | null>(null);
	const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
	const [progress, setProgress] = useState<AgreementProgress | null>(null);
	const [loading, setLoading] = useState(true);

	async function load() {
		setLoading(true);
		try {
			const [doc, tl, prog] = await Promise.all([
				agreementsService.get(params.id),
				agreementsService.timeline(params.id),
				agreementsService.progress(params.id),
			]);
			setAgreement(doc);
			setTimeline(tl.items);
			setProgress(prog);
			if (
				["awaiting_signatures", "partially_signed"].includes(doc.status)
			) {
				void agreementsService.view(params.id);
			}
		} catch (err) {
			toast.error(
				err instanceof ApiError ? err.message : "Acordo não encontrado.",
			);
			router.push("/dashboard/acordos" as Route);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params.id]);

	async function download(artifact: string) {
		try {
			const res = await agreementsService.download(params.id, artifact);
			window.open(res.url, "_blank", "noopener,noreferrer");
		} catch (err) {
			toast.error(
				err instanceof ApiError ? err.message : "Download indisponível.",
			);
		}
	}

	async function cancel() {
		try {
			await agreementsService.cancel(params.id);
			toast.success("Acordo cancelado.");
			await load();
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : "Falha ao cancelar.");
		}
	}

	async function send() {
		try {
			await agreementsService.send(params.id);
			toast.success("Acordo enviado.");
			await load();
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : "Falha ao enviar.");
		}
	}

	if (loading || !agreement) {
		return <p className="text-sm text-muted-foreground">Carregando acordo…</p>;
	}

	const isOwner = !!user && agreement.owner_user_id === user.id;
	const myParticipant = agreement.participants.find(
		(p) =>
			p.email.toLowerCase() === (user?.email || "").toLowerCase() ||
			user?.id === p.user_id,
	);
	const canSign =
		myParticipant &&
		["pending", "viewed"].includes(myParticipant.status) &&
		["awaiting_signatures", "partially_signed"].includes(agreement.status);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						href={"/dashboard/acordos" as Route}
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						← Acordos
					</Link>
					<h1 className="mt-2 text-2xl font-semibold">{agreement.title}</h1>
					<p className="text-sm text-muted-foreground">
						{agreement.company_name} · Código {agreement.verification_code}
					</p>
					<span
						className={`mt-2 inline-block rounded-md px-2 py-1 text-xs font-bold uppercase ${AGREEMENT_STATUS_CLASSES[agreement.status]}`}
					>
						{AGREEMENT_STATUS_LABELS[agreement.status]}
					</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{["draft", "awaiting_send"].includes(agreement.status) ? (
						<>
							<Link href={`/dashboard/acordos/${agreement.id}/campos` as Route}>
								<Button variant="outline">
									<FilePenLine className="size-4" />
									Campos
								</Button>
							</Link>
							<Button type="button" onClick={() => void send()}>
								<Send className="size-4" />
								Enviar
							</Button>
						</>
					) : null}
					{canSign ? (
						<Link href={`/dashboard/acordos/${agreement.id}/assinar` as Route}>
							<Button>Assinar</Button>
						</Link>
					) : null}
					{isOwner &&
					!["signed", "cancelled", "expired"].includes(agreement.status) ? (
						<Button type="button" variant="outline" onClick={() => void cancel()}>
							<XCircle className="size-4" />
							Cancelar
						</Button>
					) : null}
				</div>
			</div>

			{agreement.description ? (
				<p className="text-sm text-muted-foreground">{agreement.description}</p>
			) : null}

			<div className="grid gap-4 lg:grid-cols-3">
				<section className="space-y-3 rounded-xl border bg-card/80 p-4 lg:col-span-2">
					<h2 className="font-semibold">Participantes</h2>
					<ul className="space-y-2">
						{agreement.participants.map((p) => (
							<li
								key={p.id}
								className="flex items-center gap-3 rounded-lg border p-3 text-sm"
							>
								{p.status === "completed" ? (
									<CheckCircle2 className="size-4 text-primary" />
								) : (
									<Clock3 className="size-4 text-muted-foreground" />
								)}
								<div className="min-w-0 flex-1">
									<p className="font-medium">{p.name}</p>
									<p className="text-xs text-muted-foreground">
										{PARTICIPANT_ROLE_LABELS[p.role]} · {p.email}
										{p.company_name ? ` · ${p.company_name}` : ""}
									</p>
								</div>
								<span className="text-xs uppercase text-muted-foreground">
									{p.status}
								</span>
							</li>
						))}
					</ul>
				</section>

				<section className="space-y-3 rounded-xl border bg-card/80 p-4">
					<h2 className="font-semibold">Acompanhamento</h2>
					{progress ? (
						<>
							<div className="h-2 overflow-hidden rounded-full bg-muted">
								<div
									className="h-full bg-primary"
									style={{ width: `${progress.progress_percent}%` }}
								/>
							</div>
							<ul className="space-y-1 text-sm text-muted-foreground">
								<li>Total: {progress.total_participants}</li>
								<li>Concluídos: {progress.completed}</li>
								<li>Pendentes: {progress.pending}</li>
								<li>Visualizaram: {progress.viewed}</li>
								<li>Rejeitaram: {progress.rejected}</li>
								<li>Progresso: {progress.progress_percent}%</li>
							</ul>
						</>
					) : null}

					{agreement.status === "signed" ? (
						<div className="space-y-2 pt-2">
							<p className="text-sm font-medium">Downloads</p>
							{(
								[
									["signed", "PDF final"],
									["audit", "Relatório de auditoria"],
									["certificate", "Certificado"],
									["original", "Original"],
								] as const
							).map(([artifact, label]) => (
								<Button
									key={artifact}
									type="button"
									variant="outline"
									size="sm"
									className="w-full justify-start"
									onClick={() => void download(artifact)}
								>
									<Download className="size-4" />
									{label}
								</Button>
							))}
						</div>
					) : null}
				</section>
			</div>

			<section className="rounded-xl border bg-card/80 p-4">
				<h2 className="mb-3 font-semibold">Linha do tempo</h2>
				<ol className="space-y-3">
					{timeline.map((event) => (
						<li key={event.id} className="border-l-2 border-primary/30 pl-4">
							<p className="text-sm font-medium">{event.event_type}</p>
							<p className="text-xs text-muted-foreground">
								{formatAgreementDate(event.created_at)}
								{event.actor_name ? ` · ${event.actor_name}` : ""}
								{event.actor_company_name
									? ` · ${event.actor_company_name}`
									: ""}
							</p>
						</li>
					))}
					{timeline.length === 0 ? (
						<p className="text-sm text-muted-foreground">Sem eventos ainda.</p>
					) : null}
				</ol>
			</section>
		</div>
	);
}
