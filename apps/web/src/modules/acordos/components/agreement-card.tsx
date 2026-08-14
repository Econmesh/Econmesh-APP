"use client";

import { CheckCircle2, Clock3 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import {
	AGREEMENT_STATUS_CLASSES,
	AGREEMENT_STATUS_LABELS,
	formatAgreementDate,
} from "@/modules/acordos/constants";
import type { AgreementListItem } from "@/types/api";

type AgreementCardProps = {
	agreement: AgreementListItem;
};

export function AgreementCard({ agreement }: AgreementCardProps) {
	return (
		<Link
			href={`/dashboard/acordos/${agreement.id}` as Route}
			className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card/80 transition-all hover:border-primary/40 hover:shadow-md"
		>
			<div className="space-y-2 p-4">
				<h3 className="line-clamp-2 text-sm font-semibold uppercase tracking-wide">
					{agreement.title}
				</h3>
				<p className="text-xs text-muted-foreground">
					{formatAgreementDate(agreement.created_at)}
				</p>
				<p className="text-xs text-muted-foreground">
					Empresa: {agreement.company_name}
				</p>
			</div>

			<div
				className={`px-4 py-2 text-center text-xs font-bold uppercase tracking-wide ${AGREEMENT_STATUS_CLASSES[agreement.status]}`}
			>
				{AGREEMENT_STATUS_LABELS[agreement.status]}
				{agreement.total_participants > 0
					? ` (${agreement.signed_count} de ${agreement.total_participants})`
					: null}
			</div>

			<div className="space-y-2 p-4">
				<div className="h-1.5 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${agreement.progress_percent}%` }}
					/>
				</div>
				<p className="text-xs text-muted-foreground">
					Progresso: {agreement.progress_percent}% · Atualizado{" "}
					{formatAgreementDate(agreement.updated_at)}
				</p>
				<ul className="space-y-1">
					{agreement.participants.slice(0, 4).map((p) => (
						<li
							key={p.id}
							className="flex items-center gap-2 text-xs text-foreground"
						>
							{p.status === "completed" ? (
								<CheckCircle2 className="size-3.5 shrink-0 text-primary" />
							) : (
								<Clock3 className="size-3.5 shrink-0 text-muted-foreground" />
							)}
							<span className="truncate">{p.name || p.email}</span>
						</li>
					))}
					{agreement.participants.length > 4 ? (
						<li className="text-xs text-muted-foreground">
							+{agreement.participants.length - 4} participantes
						</li>
					) : null}
				</ul>
			</div>
		</Link>
	);
}
