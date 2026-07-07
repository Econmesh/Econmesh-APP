"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Button } from "@econmesh-app/ui/components/button";
import { Building2, MapPin, X } from "lucide-react";

import { MatchScoreBar } from "@/modules/opportunities/components/match-score-bar";
import {
	MATCH_CRITERIA_LABELS,
	MATCH_CRITERIA_ORDER,
	MATCH_POTENTIAL_BADGE_CLASSES,
	MATCH_POTENTIAL_CARD_CLASSES,
	MATCH_POTENTIAL_LABELS,
} from "@/modules/opportunities/constants";
import {
	formatPriceDisplay,
	formatQuantity,
} from "@/modules/opportunities/schemas";
import type { Opportunity, OpportunityMatch } from "@/types/api";

type MatchingModalProps = {
	opportunity: Opportunity;
	matching: OpportunityMatch;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type ComparisonFieldProps = {
	label: string;
	value: string;
};

function ComparisonField({ label, value }: ComparisonFieldProps) {
	return (
		<div className="space-y-0.5">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="text-sm">{value}</p>
		</div>
	);
}

function OpportunityComparison({
	title,
	opportunity,
}: {
	title: string;
	opportunity: Opportunity;
}) {
	return (
		<div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
			<h3 className="font-semibold text-sm">{title}</h3>
			<ComparisonField label="Empresa" value={opportunity.company_name} />
			<ComparisonField label="Produto" value={opportunity.title} />
			<ComparisonField label="Categoria" value={opportunity.category} />
			<ComparisonField
				label="Detalhe técnico"
				value={opportunity.technical_detail}
			/>
			<ComparisonField
				label="Pureza"
				value={
					opportunity.purity_percent != null
						? `${opportunity.purity_percent}%`
						: "—"
				}
			/>
			<ComparisonField
				label="Estado físico"
				value={opportunity.physical_state}
			/>
			<ComparisonField
				label="Quantidade"
				value={formatQuantity(opportunity.quantity, opportunity.unit)}
			/>
			<ComparisonField
				label="Preço"
				value={formatPriceDisplay(
					opportunity.price,
					opportunity.price_negotiable,
				)}
			/>
			<div className="flex items-center gap-1 text-sm">
				<MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
				<span>
					{opportunity.city}, {opportunity.state}
				</span>
			</div>
		</div>
	);
}

export function MatchingModal({
	opportunity,
	matching,
	open,
	onOpenChange,
}: MatchingModalProps) {
	if (!open) return null;

	const { score, potential, details, matched_demand: demand } = matching;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="matching-modal-title"
			onClick={() => onOpenChange(false)}
		>
			<div
				className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card p-6">
					<div className="space-y-2">
						<p className="text-muted-foreground text-sm">Score de compatibilidade</p>
						<div className="flex flex-wrap items-center gap-3">
							<h2 id="matching-modal-title" className="font-bold text-4xl tabular-nums">
								{score}%
							</h2>
							<Badge
								className={MATCH_POTENTIAL_BADGE_CLASSES[potential]}
							>
								{MATCH_POTENTIAL_LABELS[potential]}
							</Badge>
						</div>
					</div>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => onOpenChange(false)}
						aria-label="Fechar"
					>
						<X className="size-4" aria-hidden />
					</Button>
				</div>

				<div className="space-y-6 p-6">
					<div className="grid gap-4 md:grid-cols-2">
						<OpportunityComparison
							title="Oferta (Empresa Parceira)"
							opportunity={opportunity}
						/>
						<OpportunityComparison title="Minha Demanda" opportunity={demand} />
					</div>

					<div className="space-y-4 rounded-lg border border-border/80 p-4">
						<div className="flex items-center gap-2">
							<Building2 className="size-4 text-muted-foreground" aria-hidden />
							<h3 className="font-semibold text-sm">Detalhamento do score</h3>
						</div>
						{MATCH_CRITERIA_ORDER.map((key) => (
							<MatchScoreBar
								key={key}
								label={MATCH_CRITERIA_LABELS[key]}
								value={details[key]}
							/>
						))}
					</div>

					<div
						className={`rounded-lg border p-4 text-center text-sm font-medium ${MATCH_POTENTIAL_CARD_CLASSES[potential]}`}
					>
						{MATCH_POTENTIAL_LABELS[potential]}
					</div>

					<div className="flex justify-end">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Fechar
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
