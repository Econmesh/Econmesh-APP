import type {
	AgreementFieldType,
	AgreementFilter,
	AgreementSort,
	AgreementStatus,
	ParticipantRole,
} from "@/types/api";

export const AGREEMENT_LIST_PAGE_SIZE = 20;

export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
	draft: "Rascunho",
	awaiting_send: "Aguardando envio",
	awaiting_signatures: "Aguardando assinaturas",
	partially_signed: "Parcialmente assinado",
	signed: "Assinado",
	rejected: "Rejeitado",
	cancelled: "Cancelado",
	expired: "Expirado",
};

export const AGREEMENT_STATUS_CLASSES: Record<AgreementStatus, string> = {
	draft: "bg-muted text-muted-foreground",
	awaiting_send: "bg-secondary/40 text-secondary-foreground",
	awaiting_signatures: "bg-primary/10 text-primary",
	partially_signed: "bg-primary/15 text-primary",
	signed: "bg-primary/20 text-primary font-semibold",
	rejected: "bg-destructive/10 text-destructive",
	cancelled: "bg-muted text-muted-foreground",
	expired: "bg-destructive/10 text-destructive",
};

export const AGREEMENT_FILTER_OPTIONS: {
	value: AgreementFilter;
	label: string;
}[] = [
	{ value: "all", label: "Todos" },
	{ value: "signed", label: "Assinados" },
	{ value: "pending", label: "Pendentes" },
	{ value: "mine", label: "Meus acordos" },
	{ value: "organization", label: "Organização" },
	{ value: "company", label: "Empresa" },
	{ value: "rejected", label: "Rejeitados" },
	{ value: "expired", label: "Expirados" },
];

export const AGREEMENT_SORT_OPTIONS: { value: AgreementSort; label: string }[] =
	[
		{ value: "newest", label: "Mais recentes" },
		{ value: "oldest", label: "Mais antigos" },
		{ value: "updated", label: "Última atualização" },
		{ value: "title", label: "Título" },
	];

export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
	sign: "Assinar",
	approve: "Aprovar",
	witness: "Testemunhar",
	acknowledge: "Reconhecer",
	receipt: "Acusar recebimento",
};

export const PARTICIPANT_ROLE_COLORS: Record<ParticipantRole, string> = {
	sign: "bg-primary/15 text-primary border-primary/30",
	approve: "bg-accent/40 text-accent-foreground border-accent",
	witness: "bg-secondary/50 text-secondary-foreground border-secondary",
	acknowledge: "bg-muted text-foreground border-border",
	receipt: "bg-card text-muted-foreground border-border",
};

export const FIELD_TYPE_LABELS: Record<AgreementFieldType, string> = {
	signature: "Assinatura",
	date: "Data",
	name: "Nome",
	cpf: "CPF",
	job_title: "Cargo",
	company: "Empresa",
	initials: "Rubrica",
	text: "Texto",
	checkbox: "Caixa de seleção",
};

export const MISSING_FIELD_LABELS: Record<string, string> = {
	name: "Nome",
	email: "E-mail",
	phone: "Telefone",
	email_verified: "E-mail validado",
	cpf: "CPF",
	address: "Endereço",
	"address.postal_code": "CEP",
	"address.street": "Rua",
	"address.number": "Número",
	"address.city": "Cidade",
	"address.state": "Estado",
	"company.legal_name": "Razão social",
	"company.trade_name": "Nome fantasia",
	"company.tax_id": "CNPJ",
	"company.email": "E-mail da empresa",
	"company.phone": "Telefone da empresa",
	"company.legal_representative": "Responsável legal",
	"company.address": "Endereço da empresa",
	"company.address.postal_code": "CEP da empresa",
	"company.address.street": "Rua da empresa",
	"company.address.number": "Número da empresa",
	"company.address.city": "Cidade da empresa",
	"company.address.state": "Estado da empresa",
};

export function formatAgreementDate(value: string): string {
	return new Date(value).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
