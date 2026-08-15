"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { cn } from "@econmesh-app/ui/lib/utils";

import { OPPORTUNITY_TYPE_ICONS } from "@/modules/opportunities/components/opportunity-type-icons";
import {
	OPPORTUNITY_TYPE_LABELS,
	OPPORTUNITY_TYPE_VISUAL,
} from "@/modules/opportunities/constants";
import type { OpportunityType } from "@/types/api";

type OpportunityTypeBadgeProps = {
	type: OpportunityType;
	className?: string;
};

export function OpportunityTypeBadge({
	type,
	className,
}: OpportunityTypeBadgeProps) {
	const visual = OPPORTUNITY_TYPE_VISUAL[type];
	const Icon = OPPORTUNITY_TYPE_ICONS[type];

	return (
		<Badge variant="outline" className={cn(visual.badgeClass, className)}>
			<Icon className="size-3" aria-hidden />
			{OPPORTUNITY_TYPE_LABELS[type]}
		</Badge>
	);
}
