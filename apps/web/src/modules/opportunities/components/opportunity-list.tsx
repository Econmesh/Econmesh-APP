"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Loader2, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { MatchingModal } from "@/modules/opportunities/components/matching-modal";
import { OpportunityCard } from "@/modules/opportunities/components/opportunity-card";
import { OpportunityListSkeleton } from "@/modules/opportunities/components/opportunity-card-skeleton";
import type { Opportunity } from "@/types/api";

type OpportunityListProps = {
	opportunities: Opportunity[];
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	total: number;
	hasDemands?: boolean;
	onLoadMore: () => void;
};

export function OpportunityList({
	opportunities,
	loading,
	loadingMore,
	hasMore,
	total,
	hasDemands = false,
	onLoadMore,
}: OpportunityListProps) {
	const sentinelRef = useRef<HTMLDivElement>(null);
	const [selectedOpportunity, setSelectedOpportunity] =
		useState<Opportunity | null>(null);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasMore || loading || loadingMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) onLoadMore();
			},
			{ rootMargin: "200px" },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loading, loadingMore, onLoadMore]);

	if (loading) {
		return <OpportunityListSkeleton />;
	}

	if (opportunities.length === 0) {
		return (
			<EmptyState
				icon={Target}
				title="Nenhuma oportunidade encontrada"
				description="Tente ajustar os filtros ou a busca para encontrar outras oportunidades."
			/>
		);
	}

	const selectedMatching = selectedOpportunity?.matching ?? null;

	return (
		<div className="space-y-4">
			<p className="text-muted-foreground text-sm">
				{total}{" "}
				{total === 1 ? "oportunidade encontrada" : "oportunidades encontradas"}
			</p>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{opportunities.map((opportunity) => (
					<OpportunityCard
						key={opportunity.id}
						opportunity={opportunity}
						hasDemands={hasDemands}
						onMatchClick={setSelectedOpportunity}
					/>
				))}
			</div>

			<div ref={sentinelRef} className="flex justify-center py-4">
				{loadingMore ? (
					<Loader2
						className="size-6 animate-spin text-muted-foreground"
						aria-hidden
					/>
				) : hasMore ? (
					<Button type="button" variant="outline" onClick={onLoadMore}>
						Carregar mais
					</Button>
				) : opportunities.length > 0 ? (
					<p className="text-muted-foreground text-xs">
						Todas as oportunidades foram carregadas.
					</p>
				) : null}
			</div>

			{selectedOpportunity && selectedMatching && (
				<MatchingModal
					opportunity={selectedOpportunity}
					matching={selectedMatching}
					open
					onOpenChange={(open) => {
						if (!open) setSelectedOpportunity(null);
					}}
				/>
			)}
		</div>
	);
}
