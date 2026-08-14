import { api } from "@/services/api/client";
import type {
	ApproveProposalResponse,
	ContractProposal,
	ContractProposalCreatePayload,
	ContractProposalListResponse,
	ContractProposalUpdatePayload,
	ContractSectionTemplateListResponse,
	ContractType,
} from "@/types/api";

function buildQuery(params: Record<string, string | number | undefined>) {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== "") {
			search.set(key, String(value));
		}
	}
	const qs = search.toString();
	return qs ? `?${qs}` : "";
}

export const contractProposalsService = {
	list(params: { conversation_id?: string; page?: number; page_size?: number } = {}) {
		return api.get<ContractProposalListResponse>(
			`/contract-proposals${buildQuery(params)}`,
			{ auth: true },
		);
	},

	get(id: string) {
		return api.get<ContractProposal>(`/contract-proposals/${id}`, { auth: true });
	},

	create(body: ContractProposalCreatePayload) {
		return api.post<ContractProposal>("/contract-proposals", body, { auth: true });
	},

	update(id: string, body: ContractProposalUpdatePayload) {
		return api.patch<ContractProposal>(`/contract-proposals/${id}`, body, {
			auth: true,
		});
	},

	generatePdf(id: string) {
		return api.post<ContractProposal>(
			`/contract-proposals/${id}/generate-pdf`,
			{},
			{ auth: true },
		);
	},

	approve(id: string) {
		return api.post<ApproveProposalResponse>(
			`/contract-proposals/${id}/approve`,
			{},
			{ auth: true },
		);
	},

	requestChanges(id: string, message: string) {
		return api.post<ContractProposal>(
			`/contract-proposals/${id}/request-changes`,
			{ message },
			{ auth: true },
		);
	},

	reject(id: string, reason: string) {
		return api.post<ContractProposal>(
			`/contract-proposals/${id}/reject`,
			{ reason },
			{ auth: true },
		);
	},
};

export const contractSectionTemplatesService = {
	listActive(contract_type: ContractType = "servico") {
		return api.get<ContractSectionTemplateListResponse>(
			`/contract-section-templates${buildQuery({ contract_type })}`,
			{ auth: true },
		);
	},
};
