"use client";

import { useEffect, useRef } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { AgreementCard } from "@/modules/acordos/components/agreement-card";
import type { AgreementListItem } from "@/types/api";
import { Handshake } from "lucide-react";

type AgreementListProps = {
	agreements: AgreementListItem[];
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
};

export function AgreementList({
	agreements,
	loading,
	loadingMore,
	hasMore,
	onLoadMore,
}: AgreementListProps) {
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const node = sentinelRef.current;
		if (!node || !hasMore) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) onLoadMore();
			},
			{ rootMargin: "200px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [hasMore, onLoadMore]);

	if (loading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="h-56 animate-pulse rounded-xl border bg-muted/40"
					/>
				))}
			</div>
		);
	}

	if (agreements.length === 0) {
		return (
			<EmptyState
				icon={Handshake}
				title="Nenhum acordo encontrado"
				description="Crie um novo acordo ou ajuste os filtros de busca."
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{agreements.map((agreement) => (
					<AgreementCard key={agreement.id} agreement={agreement} />
				))}
			</div>
			<div ref={sentinelRef} className="h-8" />
			{loadingMore ? (
				<p className="text-center text-sm text-muted-foreground">
					Carregando mais…
				</p>
			) : null}
		</div>
	);
}
