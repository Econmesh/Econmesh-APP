"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Building2, MapPin, Package } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { OpportunityTypeBadge } from "@/modules/opportunities/components/opportunity-type-badge";
import {
	MATCH_POTENTIAL_CARD_CLASSES,
	MATCH_POTENTIAL_LABELS,
	OFFER_DEMAND_LABELS,
} from "@/modules/opportunities/constants";
import {
	formatPriceDisplay,
	formatQuantity,
} from "@/modules/opportunities/schemas";
import { getPrimaryImage } from "@/modules/opportunities/utils";
import type { Opportunity, OpportunityPreview } from "@/types/api";

type OpportunityCardProps = {
	opportunity: Opportunity | OpportunityPreview;
	locked?: boolean;
	hasDemands?: boolean;
	onMatchClick?: (opportunity: Opportunity) => void;
};

function isFullOpportunity(
	opportunity: Opportunity | OpportunityPreview,
): opportunity is Opportunity {
	return "company_name" in opportunity && "city" in opportunity;
}

export function OpportunityCard({
	opportunity,
	locked = false,
	hasDemands = false,
	onMatchClick,
}: OpportunityCardProps) {
	const imageUrl = getPrimaryImage(opportunity);
	const matching = isFullOpportunity(opportunity) ? opportunity.matching : undefined;
	const showMatchTag = !locked && hasDemands && matching != null;

	return (
		<div className="group relative flex flex-col">
			{showMatchTag && matching ? (
				<button
					type="button"
					className={`absolute top-2 right-2 z-10 flex flex-col items-end gap-0.5 rounded-lg border px-2.5 py-1.5 text-left shadow-md transition-transform hover:scale-105 ${MATCH_POTENTIAL_CARD_CLASSES[matching.potential]}`}
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						if (isFullOpportunity(opportunity)) {
							onMatchClick?.(opportunity);
						}
					}}
				>
					<span className="font-bold text-xs leading-none">
						🔥 Match {matching.score}%
					</span>
					<span className="text-[10px] leading-none opacity-90">
						{MATCH_POTENTIAL_LABELS[matching.potential]}
					</span>
				</button>
			) : null}

			<Link
				href={`/dashboard/oportunidades/${opportunity.id}` as Route}
				className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-card/80 transition-all hover:border-primary/40 hover:shadow-md"
			>
				<div className="relative aspect-[4/3] overflow-hidden bg-muted">
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={opportunity.title}
							fill
							className="object-cover transition-transform duration-300 group-hover:scale-105"
							unoptimized
						/>
					) : (
						<div className="flex size-full items-center justify-center">
							<Package className="size-12 text-muted-foreground/50" aria-hidden />
						</div>
					)}
					<div className="absolute top-2 left-2 flex flex-wrap gap-1">
						<OpportunityTypeBadge type={opportunity.opportunity_type} />
						<Badge
							variant={
								opportunity.offer_demand === "gerador" ? "success" : "warning"
							}
						>
							{OFFER_DEMAND_LABELS[opportunity.offer_demand]}
						</Badge>
					</div>
				</div>

				<div className="flex flex-1 flex-col gap-2 p-4">
					<div>
						<h3 className="line-clamp-2 font-semibold text-sm leading-snug group-hover:text-primary">
							{opportunity.title}
						</h3>
						<p className="mt-0.5 text-muted-foreground text-xs">
							{opportunity.category}
						</p>
					</div>

					{!locked && isFullOpportunity(opportunity) ? (
						<>
							<div className="flex items-center gap-1 text-muted-foreground text-xs">
								<MapPin className="size-3 shrink-0" aria-hidden />
								<span className="truncate">
									{opportunity.city}, {opportunity.state}
								</span>
							</div>

							<div className="flex items-center gap-1 text-muted-foreground text-xs">
								<Building2 className="size-3 shrink-0" aria-hidden />
								<span className="truncate">{opportunity.company_name}</span>
							</div>

							<div className="mt-auto flex items-end justify-between gap-2 pt-2">
								<div>
									<p className="text-muted-foreground text-xs">Quantidade</p>
									<p className="font-medium text-sm">
										{formatQuantity(opportunity.quantity, opportunity.unit)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-muted-foreground text-xs">Valor</p>
									<p className="font-semibold text-primary text-sm">
										{formatPriceDisplay(
											opportunity.price,
											opportunity.price_negotiable,
										)}
									</p>
								</div>
							</div>
						</>
					) : null}
				</div>
			</Link>
		</div>
	);
}
