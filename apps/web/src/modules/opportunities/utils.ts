import type {
	Opportunity,
	OpportunityListParams,
	OpportunitySort,
} from "@/types/api";

export function getPrimaryImage(opportunity: Opportunity): string | null {
	const primary = opportunity.images.find((img) => img.is_primary);
	if (primary) return primary.url;
	return opportunity.images[0]?.url ?? null;
}

export function matchesSearch(
	opportunity: Opportunity,
	query: string,
): boolean {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return true;

	const haystack = [
		opportunity.title,
		opportunity.description,
		opportunity.category,
		opportunity.technical_detail,
		opportunity.company_name,
		opportunity.city,
	]
		.join(" ")
		.toLowerCase();

	return haystack.includes(normalized);
}

export function applyOpportunityFilters(
	opportunities: Opportunity[],
	params: OpportunityListParams,
): Opportunity[] {
	return opportunities.filter((item) => {
		if (params.q && !matchesSearch(item, params.q)) return false;
		if (
			params.opportunity_type &&
			item.opportunity_type !== params.opportunity_type
		)
			return false;
		if (params.offer_demand && item.offer_demand !== params.offer_demand)
			return false;
		if (params.category && item.category !== params.category) return false;
		if (params.state && item.state !== params.state) return false;
		if (params.city && item.city.toLowerCase() !== params.city.toLowerCase())
			return false;
		if (params.periodicity && item.periodicity !== params.periodicity)
			return false;

		if (params.price_min !== undefined) {
			if (
				item.price_negotiable ||
				item.price === null ||
				item.price < params.price_min
			) {
				return false;
			}
		}
		if (params.price_max !== undefined) {
			if (
				item.price_negotiable ||
				item.price === null ||
				item.price > params.price_max
			) {
				return false;
			}
		}
		if (
			params.quantity_min !== undefined &&
			item.quantity < params.quantity_min
		)
			return false;
		if (
			params.quantity_max !== undefined &&
			item.quantity > params.quantity_max
		)
			return false;

		return true;
	});
}

export function sortOpportunities(
	opportunities: Opportunity[],
	sort: OpportunitySort = "newest",
): Opportunity[] {
	const sorted = [...opportunities];

	switch (sort) {
		case "oldest":
			return sorted.sort(
				(a, b) =>
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
			);
		case "price_asc":
			return sorted.sort((a, b) => {
				if (a.price_negotiable && b.price_negotiable) return 0;
				if (a.price_negotiable) return 1;
				if (b.price_negotiable) return -1;
				return (a.price ?? 0) - (b.price ?? 0);
			});
		case "price_desc":
			return sorted.sort((a, b) => {
				if (a.price_negotiable && b.price_negotiable) return 0;
				if (a.price_negotiable) return 1;
				if (b.price_negotiable) return -1;
				return (b.price ?? 0) - (a.price ?? 0);
			});
    case "quantity_desc":
      return sorted.sort((a, b) => b.quantity - a.quantity);
    default:
			return sorted.sort(
				(a, b) =>
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
			);
	}
}

export function paginateOpportunities<T>(
	items: T[],
	page: number,
	pageSize: number,
): { items: T[]; total: number; hasMore: boolean } {
	const total = items.length;
	const start = (page - 1) * pageSize;
	const paginated = items.slice(start, start + pageSize);
	return {
		items: paginated,
		total,
		hasMore: start + pageSize < total,
	};
}
