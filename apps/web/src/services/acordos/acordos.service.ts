import { api } from "@/services/api/client";
import type {
	Agreement,
	AgreementCreatePayload,
	AgreementListParams,
	AgreementListResponse,
	AgreementProgress,
	AgreementUpdatePayload,
	CompanySearchItem,
	DownloadUrlResponse,
	EligibilityResponse,
	FieldInput,
	ParticipantInput,
	SigningMode,
	TimelineEvent,
} from "@/types/api";

function buildQuery(params: AgreementListParams): string {
	const search = new URLSearchParams();
	search.set("page", String(params.page ?? 1));
	search.set("page_size", String(params.page_size ?? 20));
	if (params.q) search.set("q", params.q);
	if (params.filter) search.set("filter", params.filter);
	if (params.sort) search.set("sort", params.sort);
	if (params.company_id) search.set("company_id", params.company_id);
	return search.toString();
}

export const agreementsService = {
	list(params?: AgreementListParams) {
		const query = buildQuery(params ?? {});
		return api.get<AgreementListResponse>(`/agreements?${query}`, { auth: true });
	},

	get(id: string) {
		return api.get<Agreement>(`/agreements/${id}`, { auth: true });
	},

	create(body: AgreementCreatePayload) {
		return api.post<Agreement>("/agreements", body, { auth: true });
	},

	update(id: string, body: AgreementUpdatePayload) {
		return api.patch<Agreement>(`/agreements/${id}`, body, { auth: true });
	},

	cancel(id: string) {
		return api.delete<Agreement>(`/agreements/${id}`, { auth: true });
	},

	async uploadPdf(id: string, file: File): Promise<Agreement> {
		const formData = new FormData();
		formData.append("file", file);
		return api.upload<Agreement>(`/agreements/${id}/upload`, formData, {
			auth: true,
		});
	},

	updateParticipants(
		id: string,
		body: { signing_mode?: SigningMode; participants: ParticipantInput[] },
	) {
		return api.put<Agreement>(`/agreements/${id}/participants`, body, {
			auth: true,
		});
	},

	updateFields(id: string, fields: FieldInput[]) {
		return api.put<Agreement>(
			`/agreements/${id}/fields`,
			{ fields },
			{ auth: true },
		);
	},

	send(id: string) {
		return api.post<Agreement>(`/agreements/${id}/send`, {}, { auth: true });
	},

	view(id: string) {
		return api.post<Agreement>(`/agreements/${id}/view`, {}, { auth: true });
	},

	sign(
		id: string,
		body: { field_values?: Record<string, string>; signature_data?: string },
	) {
		return api.post<Agreement>(`/agreements/${id}/sign`, body, { auth: true });
	},

	reject(id: string, reason: string) {
		return api.post<Agreement>(
			`/agreements/${id}/reject`,
			{ reason },
			{ auth: true },
		);
	},

	timeline(id: string) {
		return api.get<{ items: TimelineEvent[] }>(`/agreements/${id}/timeline`, {
			auth: true,
		});
	},

	progress(id: string) {
		return api.get<AgreementProgress>(`/agreements/${id}/progress`, {
			auth: true,
		});
	},

	download(id: string, artifact: string) {
		return api.get<DownloadUrlResponse>(
			`/agreements/${id}/download/${artifact}`,
			{ auth: true },
		);
	},

	searchCompanies(q: string) {
		return api.get<{ items: CompanySearchItem[] }>(
			`/agreements/companies/search?q=${encodeURIComponent(q)}`,
			{ auth: true },
		);
	},

	eligibility(companyId?: string) {
		const q = companyId ? `?company_id=${companyId}` : "";
		return api.get<EligibilityResponse>(`/agreements/eligibility${q}`, {
			auth: true,
		});
	},
};
