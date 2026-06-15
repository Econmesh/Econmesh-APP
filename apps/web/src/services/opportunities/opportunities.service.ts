import { OPPORTUNITY_LIST_PAGE_SIZE } from "@/modules/opportunities/constants";
import { api } from "@/services/api/client";
import { opportunitiesMockService } from "@/services/opportunities/opportunities.mock";
import type {
	Opportunity,
	OpportunityCreatePayload,
	OpportunityImage,
	OpportunityImagePresignResponse,
	OpportunityListParams,
	OpportunityListResponse,
	OpportunityUpdatePayload,
} from "@/types/api";

const USE_MOCK = process.env.NEXT_PUBLIC_OPPORTUNITIES_MOCK !== "false";

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

const apiService = {
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
		const presign = await this.presignImage(
			file.name,
			file.type || "application/octet-stream",
		);

		const uploadResponse = await fetch(presign.upload_url, {
			method: "PUT",
			body: file,
			headers: { "Content-Type": file.type || "application/octet-stream" },
		});

		if (!uploadResponse.ok) {
			throw new Error("Falha ao enviar a imagem.");
		}

		return {
			storage_key: presign.storage_key,
			url: presign.public_url,
			is_primary: false,
			sort_order: 0,
		};
	},
};

export const opportunitiesService = USE_MOCK
	? opportunitiesMockService
	: apiService;
