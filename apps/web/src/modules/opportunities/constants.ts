import type {
	MatchPotential,
	OfferDemand,
	OpportunityPeriodicity,
	OpportunitySort,
	OpportunityType,
} from "@/types/api";

export const OPPORTUNITY_TYPES: {
	value: OpportunityType;
	label: string;
	description: string;
}[] = [
	{
		value: "comercializacao",
		label: "Comercialização",
		description:
			"Compra ou venda pontual de resíduos, matérias-primas ou subprodutos.",
	},
	{
		value: "simbiose_industrial",
		label: "Simbiose Industrial",
		description:
			"Conexão contínua entre empresas para troca permanente de materiais ou recursos.",
	},
	{
		value: "compartilhamento",
		label: "Compartilhamento",
		description:
			"Compartilhamento ou aluguel de ativos físicos (máquinas, equipamentos, espaços).",
	},
];

export const OFFER_DEMAND_OPTIONS: { value: OfferDemand; label: string }[] = [
	{ value: "gerador", label: "Gerador (Oferta)" },
	{ value: "receptor", label: "Receptor (Demanda)" },
];

export const OPPORTUNITY_CATEGORIES = [
	"Plástico",
	"Metal",
	"Vidro",
	"Biomassa",
	"Papel",
	"Borracha",
	"Madeira",
	"Têxtil",
	"Químico",
	"Eletrônico",
	"Construção",
	"Alimentos",
	"Outros",
] as const;

export const PHYSICAL_STATES = [
	"Fardos prensados",
	"Triturado (Flakes)",
	"Granulado",
	"A granel",
	"Líquido",
	"Pó",
	"Big Bag",
	"Sacaria",
	"Peças",
	"Equipamento",
	"Espaço",
] as const;

export const PERIODICITY_OPTIONS: {
	value: OpportunityPeriodicity;
	label: string;
}[] = [
	{ value: "continua", label: "Contínua" },
	{ value: "esporadica", label: "Esporádica" },
];

export const UNIT_OPTIONS = [
	"kg",
	"tonelada",
	"litro",
	"m³",
	"unidade",
	"saco",
	"fardo",
	"hora",
	"mês",
] as const;

export const TECHNICAL_DETAIL_SUGGESTIONS = [
	"PET",
	"PEAD",
	"PP",
	"PVC",
	"PS",
	"Aço Inox 304",
	"Aço Carbono",
	"Alumínio 6061",
	"Cobre",
	"Vidro temperado",
	"Papelão ondulado",
	"Biomassa lignocelulósica",
	"Borracha SBR",
	"Poliéster reciclado",
] as const;

export const BRAZILIAN_STATES = [
	"AC",
	"AL",
	"AP",
	"AM",
	"BA",
	"CE",
	"DF",
	"ES",
	"GO",
	"MA",
	"MT",
	"MS",
	"MG",
	"PA",
	"PB",
	"PR",
	"PE",
	"PI",
	"RJ",
	"RN",
	"RS",
	"RO",
	"RR",
	"SC",
	"SP",
	"SE",
	"TO",
] as const;

export const SORT_OPTIONS: { value: OpportunitySort; label: string }[] = [
	{ value: "newest", label: "Mais recentes" },
	{ value: "oldest", label: "Mais antigos" },
	{ value: "price_asc", label: "Menor preço" },
	{ value: "price_desc", label: "Maior preço" },
	{ value: "quantity_desc", label: "Maior quantidade" },
];

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
	comercializacao: "Comercialização",
	simbiose_industrial: "Simbiose Industrial",
	compartilhamento: "Compartilhamento",
};

export const OFFER_DEMAND_LABELS: Record<OfferDemand, string> = {
	gerador: "Oferta",
	receptor: "Demanda",
};

export const PERIODICITY_LABELS: Record<OpportunityPeriodicity, string> = {
	continua: "Contínua",
	esporadica: "Esporádica",
};

export const MAX_OPPORTUNITY_IMAGES = 5;

export const OPPORTUNITY_LIST_PAGE_SIZE = 12;

export const MATCH_POTENTIAL_LABELS: Record<MatchPotential, string> = {
	HIGH: "Alto Potencial",
	MEDIUM: "Médio Potencial",
	LOW: "Baixo Potencial",
};

export const MATCH_POTENTIAL_BADGE_CLASSES: Record<MatchPotential, string> = {
	HIGH: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
	MEDIUM: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
	LOW: "border-transparent bg-red-500/15 text-red-700 dark:text-red-400",
};

export const MATCH_POTENTIAL_CARD_CLASSES: Record<MatchPotential, string> = {
	HIGH: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	MEDIUM: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
	LOW: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const MATCH_CRITERIA_LABELS = {
	category: "Categoria",
	technical_detail: "Detalhe Técnico",
	purity: "Pureza",
	physical_state: "Estado Físico",
	location: "Localização",
	quantity: "Quantidade",
	price: "Preço",
} as const;

export const MATCH_CRITERIA_ORDER = [
	"category",
	"technical_detail",
	"purity",
	"physical_state",
	"location",
	"quantity",
	"price",
] as const satisfies ReadonlyArray<keyof typeof MATCH_CRITERIA_LABELS>;
