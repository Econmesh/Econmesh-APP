"use client";

import { cn } from "@econmesh-app/ui/lib/utils";

import { OPPORTUNITY_TYPE_ICONS } from "@/modules/opportunities/components/opportunity-type-icons";
import {
	OPPORTUNITY_TYPES,
	OPPORTUNITY_TYPE_VISUAL,
} from "@/modules/opportunities/constants";
import type { OpportunityType } from "@/types/api";

type OpportunityTypePickerProps = {
	selected?: OpportunityType | null;
	onSelect: (type: OpportunityType) => void;
};

export function OpportunityTypePicker({
	selected,
	onSelect,
}: OpportunityTypePickerProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-3">
			{OPPORTUNITY_TYPES.map((type) => {
				const isSelected = selected === type.value;
				const visual = OPPORTUNITY_TYPE_VISUAL[type.value];
				const Icon = OPPORTUNITY_TYPE_ICONS[type.value];

				return (
					<button
						key={type.value}
						type="button"
						onClick={() => onSelect(type.value)}
						className={cn(
							"flex flex-col items-center gap-3 rounded-xl border px-4 py-6 text-center transition-colors",
							isSelected
								? visual.cardSelected
								: "border-border bg-card hover:border-muted-foreground/30",
						)}
					>
						<span
							className={cn(
								"flex size-14 items-center justify-center rounded-full",
								isSelected ? visual.iconWrapSelected : "bg-muted",
							)}
						>
							<Icon
								className={cn(
									"size-7",
									isSelected ? "text-white" : visual.iconClass,
								)}
								aria-hidden
							/>
						</span>
						<span>
							<span className="block font-semibold text-sm">{type.label}</span>
							<span className="mt-1 block text-muted-foreground text-xs">
								{type.description}
							</span>
						</span>
					</button>
				);
			})}
		</div>
	);
}
