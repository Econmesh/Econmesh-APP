import { OPPORTUNITY_LIST_PAGE_SIZE } from "@/modules/opportunities/constants";
import { api } from "@/services/api/client";
import type {
	Opportunity,
	OpportunityCreatePayload,
	OpportunityImage,
	OpportunityImagePresignResponse,
	OpportunityListParams,
	OpportunityListResponse,
	OpportunityUpdatePayload,
	StorageUploadResponse,
} from "@/types/api";

function buildQueryString(params: OpportunityListParams): string {
	const search = new URLSearchParams();
	const page = params.page ?? 1;
	const pageSize = params.page_size ?? OPPORTUNITY_LIST_PAGE_SIZE;

	search.set("page", String(page));
	search.set("page_size", String(pageSize));

	if (params.q) search.set("q", params.q);
	if (params.opportunity_type)
		search.set("opportunity_type", params.opportunity_type);
	if (params.offer_demand) search.set("offer_demand", params.offer_demand);
	if (params.category) search.set("category", params.category);
	if (params.state) search.set("state", params.state);
	if (params.city) search.set("city", params.city);
	if (params.periodicity) search.set("periodicity", params.periodicity);
	if (params.price_min !== undefined)
		search.set("price_min", String(params.price_min));
	if (params.price_max !== undefined)
		search.set("price_max", String(params.price_max));
	if (params.quantity_min !== undefined)
		search.set("quantity_min", String(params.quantity_min));
	if (params.quantity_max !== undefined)
		search.set("quantity_max", String(params.quantity_max));
	if (params.sort) search.set("sort", params.sort);

	return search.toString();
}

export const opportunitiesService = {
	list(params?: OpportunityListParams) {
		const query = buildQueryString(params ?? {});
		return api.get<OpportunityListResponse>(`/opportunities?${query}`, {
			auth: true,
		});
	},

	get(id: string) {
		return api.get<Opportunity>(`/opportunities/${id}`, { auth: true });
	},

	create(body: OpportunityCreatePayload) {
		return api.post<Opportunity>("/opportunities", body, { auth: true });
	},

	update(id: string, body: OpportunityUpdatePayload) {
		return api.patch<Opportunity>(`/opportunities/${id}`, body, { auth: true });
	},

	delete(id: string) {
		return api.delete<void>(`/opportunities/${id}`, { auth: true });
	},

	presignImage(filename: string, contentType: string) {
		return api.post<OpportunityImagePresignResponse>(
			"/opportunities/images/presign",
			{ filename, content_type: contentType },
			{ auth: true },
		);
	},

	async uploadImage(file: File): Promise<OpportunityImage> {
		const formData = new FormData();
		formData.append("file", file);

		const result = await api.upload<StorageUploadResponse>(
			"/opportunities/images/upload",
			formData,
			{ auth: true },
		);

		return {
			storage_key: result.storage_key,
			url: result.public_url,
			is_primary: false,
			sort_order: 0,
		};
	},
};
