"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Label } from "@econmesh-app/ui/components/label";
import { Select } from "@econmesh-app/ui/components/select";
import { Filter, X } from "lucide-react";
import type { ReactNode } from "react";
import {
	BRAZILIAN_STATES,
	OFFER_DEMAND_OPTIONS,
	OPPORTUNITY_CATEGORIES,
	OPPORTUNITY_TYPES,
	PERIODICITY_OPTIONS,
	SORT_OPTIONS,
} from "@/modules/opportunities/constants";
import type { OpportunityListParams } from "@/types/api";

type OpportunityFiltersProps = {
	filters: OpportunityListParams;
	onChange: (filters: OpportunityListParams) => void;
	onClear: () => void;
	showMobile?: boolean;
	onCloseMobile?: () => void;
};

function FilterSection({ children }: { children: ReactNode }) {
	return <div className="space-y-3">{children}</div>;
}

export function OpportunityFilters({
	filters,
	onChange,
	onClear,
	showMobile,
	onCloseMobile,
}: OpportunityFiltersProps) {
	function update<K extends keyof OpportunityListParams>(
		key: K,
		value: OpportunityListParams[K] | undefined,
	) {
		onChange({ ...filters, [key]: value || undefined });
	}

	const hasActiveFilters = Boolean(
		filters.opportunity_type ||
			filters.offer_demand ||
			filters.category ||
			filters.state ||
			filters.city ||
			filters.periodicity ||
			filters.price_min !== undefined ||
			filters.price_max !== undefined ||
			filters.quantity_min !== undefined ||
			filters.quantity_max !== undefined,
	);

	const content = (
		<div className="space-y-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Filter className="size-4" aria-hidden />
					<h2 className="font-semibold text-sm">Filtros</h2>
				</div>
				{hasActiveFilters ? (
					<Button type="button" variant="ghost" size="xs" onClick={onClear}>
						Limpar
					</Button>
				) : null}
			</div>

			<FilterSection>
				<Label htmlFor="filter-sort">Ordenar por</Label>
				<Select
					id="filter-sort"
					value={filters.sort ?? "newest"}
					onChange={(e) =>
						update("sort", e.target.value as OpportunityListParams["sort"])
					}
				>
					{SORT_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</Select>
			</FilterSection>

			<FilterSection>
				<Label htmlFor="filter-type">Tipo</Label>
				<Select
					id="filter-type"
					value={filters.opportunity_type ?? ""}
					onChange={(e) =>
						update(
							"opportunity_type",
							(e.target.value ||
								undefined) as OpportunityListParams["opportunity_type"],
						)
					}
				>
					<option value="">Todos</option>
					{OPPORTUNITY_TYPES.map((type) => (
						<option key={type.value} value={type.value}>
							{type.label}
						</option>
					))}
				</Select>
			</FilterSection>

			<FilterSection>
				<Label htmlFor="filter-offer-demand">Oferta / Demanda</Label>
				<Select
					id="filter-offer-demand"
					value={filters.offer_demand ?? ""}
					onChange={(e) =>
						update(
							"offer_demand",
							(e.target.value ||
								undefined) as OpportunityListParams["offer_demand"],
						)
					}
				>
					<option value="">Todos</option>
					{OFFER_DEMAND_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</Select>
			</FilterSection>

			<FilterSection>
				<Label htmlFor="filter-category">Categoria</Label>
				<Select
					id="filter-category"
					value={filters.category ?? ""}
					onChange={(e) => update("category", e.target.value || undefined)}
				>
					<option value="">Todas</option>
					{OPPORTUNITY_CATEGORIES.map((category) => (
						<option key={category} value={category}>
							{category}
						</option>
					))}
				</Select>
			</FilterSection>

			<FilterSection>
				<Label htmlFor="filter-state">Estado</Label>
				<Select
					id="filter-state"
					value={filters.state ?? ""}
					onChange={(e) => update("state", e.target.value || undefined)}
				>
					<option value="">Todos</option>
					{BRAZILIAN_STATES.map((state) => (
						<option key={state} value={state}>
							{state}
						</option>
					))}
				</Select>
			</FilterSection>

			<FilterSection>
				<Label htmlFor="filter-city">Cidade</Label>
				<Input
					id="filter-city"
					value={filters.city ?? ""}
					onChange={(e) => update("city", e.target.value || undefined)}
					placeholder="Filtrar por cidade"
				/>
			</FilterSection>

			<FilterSection>
				<Label htmlFor="filter-periodicity">Periodicidade</Label>
				<Select
					id="filter-periodicity"
					value={filters.periodicity ?? ""}
					onChange={(e) =>
						update(
							"periodicity",
							(e.target.value ||
								undefined) as OpportunityListParams["periodicity"],
						)
					}
				>
					<option value="">Todas</option>
					{PERIODICITY_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</Select>
			</FilterSection>

			<FilterSection>
				<Label>Faixa de preço (R$)</Label>
				<div className="grid grid-cols-2 gap-2">
					<Input
						type="number"
						min={0}
						placeholder="Mín."
						value={filters.price_min ?? ""}
						onChange={(e) =>
							update(
								"price_min",
								e.target.value ? Number(e.target.value) : undefined,
							)
						}
					/>
					<Input
						type="number"
						min={0}
						placeholder="Máx."
						value={filters.price_max ?? ""}
						onChange={(e) =>
							update(
								"price_max",
								e.target.value ? Number(e.target.value) : undefined,
							)
						}
					/>
				</div>
			</FilterSection>

			<FilterSection>
				<Label>Faixa de quantidade</Label>
				<div className="grid grid-cols-2 gap-2">
					<Input
						type="number"
						min={0}
						placeholder="Mín."
						value={filters.quantity_min ?? ""}
						onChange={(e) =>
							update(
								"quantity_min",
								e.target.value ? Number(e.target.value) : undefined,
							)
						}
					/>
					<Input
						type="number"
						min={0}
						placeholder="Máx."
						value={filters.quantity_max ?? ""}
						onChange={(e) =>
							update(
								"quantity_max",
								e.target.value ? Number(e.target.value) : undefined,
							)
						}
					/>
				</div>
			</FilterSection>
		</div>
	);

	if (showMobile) {
		return (
			<div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
				<div className="flex items-center justify-between border-border border-b p-4">
					<h2 className="font-semibold">Filtros</h2>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onCloseMobile}
					>
						<X className="size-4" aria-hidden />
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto p-4">{content}</div>
				<div className="border-border border-t p-4">
					<Button type="button" className="w-full" onClick={onCloseMobile}>
						Aplicar filtros
					</Button>
				</div>
			</div>
		);
	}

	return (
		<aside className="hidden w-64 shrink-0 rounded-xl border border-border/80 bg-card/80 p-4 lg:block">
			{content}
		</aside>
	);
}
