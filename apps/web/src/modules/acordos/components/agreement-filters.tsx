"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Label } from "@econmesh-app/ui/components/label";

import {
	AGREEMENT_FILTER_OPTIONS,
	AGREEMENT_SORT_OPTIONS,
} from "@/modules/acordos/constants";
import type { AgreementListParams } from "@/types/api";

type AgreementFiltersProps = {
	filters: AgreementListParams;
	onChange: (next: AgreementListParams) => void;
	onClear: () => void;
	mobile?: boolean;
	onClose?: () => void;
};

export function AgreementFilters({
	filters,
	onChange,
	onClear,
	mobile = false,
	onClose,
}: AgreementFiltersProps) {
	return (
		<aside
			className={
				mobile
					? "space-y-4"
					: "hidden w-56 shrink-0 space-y-4 lg:block"
			}
		>
			<div>
				<p className="mb-2 text-sm font-medium">Filtrar por</p>
				<div className="space-y-1">
					{AGREEMENT_FILTER_OPTIONS.map((option) => {
						const active = (filters.filter ?? "all") === option.value;
						return (
							<button
								key={option.value}
								type="button"
								onClick={() =>
									onChange({ ...filters, filter: option.value })
								}
								className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
									active
										? "bg-primary/10 font-medium text-primary"
										: "text-muted-foreground hover:bg-muted"
								}`}
							>
								{option.label}
							</button>
						);
					})}
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="agreement-sort">Ordem</Label>
				<select
					id="agreement-sort"
					className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
					value={filters.sort ?? "newest"}
					onChange={(e) =>
						onChange({
							...filters,
							sort: e.target.value as AgreementListParams["sort"],
						})
					}
				>
					{AGREEMENT_SORT_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<div className="flex gap-2">
				<Button type="button" variant="outline" size="sm" onClick={onClear}>
					Limpar
				</Button>
				{mobile && onClose ? (
					<Button type="button" size="sm" onClick={onClose}>
						Aplicar
					</Button>
				) : null}
			</div>
		</aside>
	);
}
