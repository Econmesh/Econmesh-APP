"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Filter, Plus, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AgreementFilters } from "@/modules/acordos/components/agreement-filters";
import { AgreementList } from "@/modules/acordos/components/agreement-list";
import { useAgreements } from "@/modules/acordos/hooks/use-agreements";
import { useDebouncedValue } from "@/modules/acordos/hooks/use-debounced-value";
import type { AgreementListParams } from "@/types/api";
import { Input } from "@econmesh-app/ui/components/input";

const DEFAULT_FILTERS: AgreementListParams = {
	filter: "all",
	sort: "newest",
};

export default function AcordosPage() {
	const [filters, setFilters] = useState<AgreementListParams>(DEFAULT_FILTERS);
	const [search, setSearch] = useState("");
	const [showMobileFilters, setShowMobileFilters] = useState(false);
	const debouncedSearch = useDebouncedValue(search, 300);

	const queryParams = useMemo(
		() => ({ ...filters, q: debouncedSearch || undefined }),
		[filters, debouncedSearch],
	);

	const { agreements, loading, loadingMore, hasMore, total, loadMore, error } =
		useAgreements(queryParams);

	useEffect(() => {
		if (error) toast.error(error);
	}, [error]);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Acordos</h1>
					<p className="text-sm text-muted-foreground">
						Gerencie documentos eletrônicos e assinaturas da sua organização.
						{total > 0 ? ` · ${total} acordo(s)` : null}
					</p>
				</div>
				<Link href={"/dashboard/acordos/novo" as Route} className="inline-flex">
					<Button>
						<Plus className="size-4" aria-hidden />
						Novo Acordo
					</Button>
				</Link>
			</div>

			<div className="relative">
				<Search
					className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden
				/>
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Pesquisar acordos…"
					className="pl-9"
					aria-label="Pesquisar acordos"
				/>
			</div>

			<div className="flex gap-6">
				<AgreementFilters
					filters={filters}
					onChange={setFilters}
					onClear={() => {
						setFilters(DEFAULT_FILTERS);
						setSearch("");
					}}
				/>

				<div className="min-w-0 flex-1 space-y-4">
					<div className="flex items-center justify-between lg:hidden">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setShowMobileFilters(true)}
						>
							<Filter className="size-4" aria-hidden />
							Filtros
						</Button>
					</div>

					<AgreementList
						agreements={agreements}
						loading={loading}
						loadingMore={loadingMore}
						hasMore={hasMore}
						onLoadMore={loadMore}
					/>
				</div>
			</div>

			{showMobileFilters ? (
				<div className="fixed inset-0 z-50 bg-background p-4 lg:hidden">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold">Filtros</h2>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setShowMobileFilters(false)}
						>
							Fechar
						</Button>
					</div>
					<AgreementFilters
						filters={filters}
						onChange={setFilters}
						onClear={() => setFilters(DEFAULT_FILTERS)}
						mobile
						onClose={() => setShowMobileFilters(false)}
					/>
				</div>
			) : null}
		</div>
	);
}
