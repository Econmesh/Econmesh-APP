"use client";

import { useCallback, useEffect, useState } from "react";

import { AGREEMENT_LIST_PAGE_SIZE } from "@/modules/acordos/constants";
import { agreementsService } from "@/services/acordos/acordos.service";
import { ApiError } from "@/utils/errors";
import type { AgreementListItem, AgreementListParams } from "@/types/api";

export function useAgreements(params: AgreementListParams) {
	const [items, setItems] = useState<AgreementListItem[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const queryKey = JSON.stringify({
		q: params.q,
		filter: params.filter,
		sort: params.sort,
		company_id: params.company_id,
	});

	const fetchPage = useCallback(
		async (nextPage: number, append: boolean) => {
			try {
				if (append) setLoadingMore(true);
				else setLoading(true);
				setError(null);
				const response = await agreementsService.list({
					...params,
					page: nextPage,
					page_size: AGREEMENT_LIST_PAGE_SIZE,
				});
				setItems((prev) =>
					append ? [...prev, ...response.items] : response.items,
				);
				setHasMore(response.has_more);
				setTotal(response.total);
				setPage(nextPage);
			} catch (err) {
				const message =
					err instanceof ApiError
						? err.message
						: "Não foi possível carregar os acordos.";
				setError(message);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[queryKey],
	);

	useEffect(() => {
		void fetchPage(1, false);
	}, [fetchPage]);

	const loadMore = useCallback(() => {
		if (!hasMore || loadingMore) return;
		void fetchPage(page + 1, true);
	}, [fetchPage, hasMore, loadingMore, page]);

	return {
		agreements: items,
		loading,
		loadingMore,
		hasMore,
		total,
		loadMore,
		error,
		reload: () => fetchPage(1, false),
	};
}
