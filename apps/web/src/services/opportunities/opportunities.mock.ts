import {
	applyOpportunityFilters,
	paginateOpportunities,
	sortOpportunities,
} from "@/modules/opportunities/utils";
import type {
	Opportunity,
	OpportunityCreatePayload,
	OpportunityImage,
	OpportunityImagePresignResponse,
	OpportunityListParams,
	OpportunityListResponse,
	OpportunityUpdatePayload,
} from "@/types/api";

const STORAGE_KEY = "econmesh_opportunities_mock";

const SEED_OPPORTUNITIES: Opportunity[] = [
	{
		id: "opp-1",
		company_id: "company-1",
		company_name: "ReciclaPlast Indústria",
		owner_user_id: "user-1",
		title: "Venda de PET Triturado",
		description:
			"Oferecemos PET triturado (flakes) proveniente de aparas industriais limpas. Material com baixa umidade, ideal para extrusão e fabricação de novos produtos. Origem: linha de corte de garrafas. Aplicação: extrusão de filamentos e embalagens.",
		opportunity_type: "comercializacao",
		offer_demand: "gerador",
		category: "Plástico",
		technical_detail: "PET",
		purity_percent: 99,
		physical_state: "Triturado (Flakes)",
		periodicity: "continua",
		quantity: 10,
		unit: "tonelada",
		price: 3200,
		price_negotiable: false,
		city: "São Paulo",
		state: "SP",
		images: [
			{
				storage_key: "mock/pet-1.jpg",
				url: "https://media.istockphoto.com/id/1078849280/pt/foto/woman-hand-holding-bottle-flake-pet-bottle-flake-plastic-bottle-crushed-small-pieces-of-cut.jpg?s=2048x2048&w=is&k=20&c=xR_araqQBEhr7nWGyQ1m9lN_fQcgG0Us5o2tlX48aFM=",
				is_primary: true,
				sort_order: 0,
			},
		],
		created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "opp-2",
		company_id: "company-2",
		company_name: "MetalCircular S.A.",
		owner_user_id: "user-2",
		title: "Demanda por Aço Inox 304",
		description:
			"Buscamos fornecedor contínuo de aparas de aço inox 304 para nosso processo de fundição. Aceitamos pequenas impurezas. Observações: preferência por fornecedores na região Sudeste.",
		opportunity_type: "simbiose_industrial",
		offer_demand: "receptor",
		category: "Metal",
		technical_detail: "Aço Inox 304",
		purity_percent: 85,
		physical_state: "A granel",
		periodicity: "continua",
		quantity: 5000,
		unit: "kg",
		price: null,
		price_negotiable: true,
		city: "Joinville",
		state: "SC",
		images: [
			{
				storage_key: "mock/steel-1.jpg",
				url: "https://static.wixstatic.com/media/479e89_8fab8d8242cc4a6cbba8f9987786a2f4~mv2.jpg",
				is_primary: true,
				sort_order: 0,
			},
		],
		created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "opp-3",
		company_id: "company-3",
		company_name: "LogiShare Espaços",
		owner_user_id: "user-3",
		title: "Aluguel de Galpão Industrial 2.000 m²",
		description:
			"Galpão industrial disponível para compartilhamento ou locação parcial. Estrutura com pé-direito alto, docas e área de manobra. Ideal para armazenagem temporária ou operação logística compartilhada.",
		opportunity_type: "compartilhamento",
		offer_demand: "gerador",
		category: "Construção",
		technical_detail: "Espaço industrial",
		purity_percent: null,
		physical_state: "Espaço",
		periodicity: "continua",
		quantity: 2000,
		unit: "m²",
		price: 15000,
		price_negotiable: true,
		city: "Curitiba",
		state: "PR",
		images: [
			{
				storage_key: "mock/warehouse-1.jpg",
				url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
				is_primary: true,
				sort_order: 0,
			},

		],
		created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "opp-5",
		company_id: "company-5",
		company_name: "Têxtil Circular Ltda.",
		owner_user_id: "user-5",
		title: "Compartilhamento de Máquina de Corte",
		description:
			"Máquina de corte têxtil disponível para compartilhamento em horários ociosos. Equipamento revisado, ideal para PMEs do setor.",
		opportunity_type: "compartilhamento",
		offer_demand: "gerador",
		category: "Têxtil",
		technical_detail: "Máquina de corte",
		purity_percent: null,
		physical_state: "Equipamento",
		periodicity: "esporadica",
		quantity: 40,
		unit: "hora",
		price: 250,
		price_negotiable: false,
		city: "Blumenau",
		state: "SC",
		images: [
			{
				storage_key: "mock/textile-1.jpg",
				url: "https://walterporteiro.com.br/wp-content/uploads/2015/02/AC-S-C.png",
				is_primary: true,
				sort_order: 0,
			},
		],
		created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: "opp-6",
		company_id: "company-6",
		company_name: "VidroSul Reciclagem",
		owner_user_id: "user-6",
		title: "Vidro Cullet Misto",
		description:
			"Cullet de vidro misto proveniente de coleta seletiva. Material para fundição com tratamento prévio. Quantidade mensal estável.",
		opportunity_type: "simbiose_industrial",
		offer_demand: "gerador",
		category: "Vidro",
		technical_detail: "Vidro temperado",
		purity_percent: 75,
		physical_state: "A granel",
		periodicity: "continua",
		quantity: 8,
		unit: "tonelada",
		price: 450,
		price_negotiable: false,
		city: "Porto Alegre",
		state: "RS",
		images: [
			{
				storage_key: "mock/glass-1.jpg",
				url: "https://portalsustentabilidade.com/wp-content/uploads/2026/01/design-destaque-32-1-2048x1152.jpg",
				is_primary: true,
				sort_order: 0,
			},
		],
		created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
	},
];

function readStore(): Opportunity[] {
	if (typeof window === "undefined") return SEED_OPPORTUNITIES;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_OPPORTUNITIES));
			return SEED_OPPORTUNITIES;
		}
		return JSON.parse(raw) as Opportunity[];
	} catch {
		return SEED_OPPORTUNITIES;
	}
}

function writeStore(opportunities: Opportunity[]) {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
}

function generateId(): string {
	return `opp-${crypto.randomUUID()}`;
}

function delay(ms = 300): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const opportunitiesMockService = {
	async list(
		params: OpportunityListParams = {},
	): Promise<OpportunityListResponse> {
		await delay();
		const page = params.page ?? 1;
		const pageSize = params.page_size ?? 12;
		const filtered = applyOpportunityFilters(readStore(), params);
		const sorted = sortOpportunities(filtered, params.sort ?? "newest");
		const { items, total, hasMore } = paginateOpportunities(
			sorted,
			page,
			pageSize,
		);

		return {
			items,
			total,
			page,
			page_size: pageSize,
			has_more: hasMore,
			has_demands: false,
		};
	},

	async get(id: string): Promise<Opportunity> {
		await delay();
		const opportunity = readStore().find((item) => item.id === id);
		if (!opportunity) throw new Error("Oportunidade não encontrada.");
		return opportunity;
	},

	async create(body: OpportunityCreatePayload): Promise<Opportunity> {
		await delay();
		const now = new Date().toISOString();
		const opportunity: Opportunity = {
			id: generateId(),
			company_id: body.company_id,
			company_name: "Minha Empresa",
			owner_user_id: "current-user",
			title: body.title,
			description: body.description,
			opportunity_type: body.opportunity_type,
			offer_demand: body.offer_demand,
			category: body.category,
			technical_detail: body.technical_detail,
			purity_percent: body.purity_percent ?? null,
			physical_state: body.physical_state,
			periodicity: body.periodicity,
			quantity: body.quantity,
			unit: body.unit,
			price: body.price ?? null,
			price_negotiable: body.price_negotiable,
			city: body.city,
			state: body.state,
			latitude: body.latitude ?? null,
			longitude: body.longitude ?? null,
			images: body.images,
			created_at: now,
			updated_at: now,
		};

		const store = readStore();
		store.unshift(opportunity);
		writeStore(store);
		return opportunity;
	},

	async update(
		id: string,
		body: OpportunityUpdatePayload,
	): Promise<Opportunity> {
		await delay();
		const store = readStore();
		const index = store.findIndex((item) => item.id === id);
		if (index === -1) throw new Error("Oportunidade não encontrada.");

    const existing = store[index];
    if (!existing) throw new Error("Oportunidade não encontrada.");

    const updated: Opportunity = {
      ...existing,
			...body,
			updated_at: new Date().toISOString(),
		};
		store[index] = updated;
		writeStore(store);
		return updated;
	},

	async delete(id: string): Promise<void> {
		await delay();
		const store = readStore().filter((item) => item.id !== id);
		writeStore(store);
	},

	async presignImage(
		filename: string,
	): Promise<OpportunityImagePresignResponse> {
		await delay(100);
		const storageKey = `mock/${crypto.randomUUID()}-${filename}`;
		return {
			upload_url: "mock://upload",
			storage_key: storageKey,
			public_url: URL.createObjectURL(new Blob()),
			expires_at: new Date(Date.now() + 3600_000).toISOString(),
		};
	},

	async uploadImage(file: File): Promise<OpportunityImage> {
		const presign = await this.presignImage(file.name);
		const publicUrl = URL.createObjectURL(file);
		return {
			storage_key: presign.storage_key,
			url: publicUrl,
			is_primary: false,
			sort_order: 0,
		};
	},
};
