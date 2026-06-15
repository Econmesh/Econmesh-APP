"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { OPPORTUNITY_LIST_PAGE_SIZE } from "@/modules/opportunities/constants";
import { opportunitiesService } from "@/services/opportunities/opportunities.service";
import type { Opportunity, OpportunityListParams } from "@/types/api";
import { ApiError } from "@/utils/errors";

type UseOpportunitiesResult = {
	opportunities: Opportunity[];
	loading: boolean;
	loadingMore: boolean;
	error: string | null;
	hasMore: boolean;
	total: number;
	loadMore: () => void;
	refresh: () => void;
};

export function useOpportunities(
	params: OpportunityListParams,
): UseOpportunitiesResult {
	const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const paramsRef = useRef(params);

	const fetchPage = useCallback(
		async (pageToLoad: number, append: boolean) => {
			if (append) {
				setLoadingMore(true);
			} else {
				setLoading(true);
			}
			setError(null);

			try {
				const response = await opportunitiesService.list({
					...params,
					page: pageToLoad,
					page_size: OPPORTUNITY_LIST_PAGE_SIZE,
				});

				setOpportunities((prev) =>
					append ? [...prev, ...response.items] : response.items,
				);
				setHasMore(response.has_more);
				setTotal(response.total);
				setPage(pageToLoad);
			} catch (err) {
				setError(
					err instanceof ApiError
						? err.message
						: err instanceof Error
							? err.message
							: "Não foi possível carregar as oportunidades.",
				);
				if (!append) setOpportunities([]);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[params],
	);

	useEffect(() => {
		const paramsChanged =
			JSON.stringify(paramsRef.current) !== JSON.stringify(params);
		paramsRef.current = params;
		void fetchPage(1, false);
		if (paramsChanged) {
			setPage(1);
		}
	}, [fetchPage, params]);

	const loadMore = useCallback(() => {
		if (loadingMore || !hasMore) return;
		void fetchPage(page + 1, true);
	}, [fetchPage, hasMore, loadingMore, page]);

	const refresh = useCallback(() => {
		void fetchPage(1, false);
	}, [fetchPage]);

	return {
		opportunities,
		loading,
		loadingMore,
		error,
		hasMore,
		total,
		loadMore,
		refresh,
	};
}
