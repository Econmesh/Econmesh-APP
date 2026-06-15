import { z } from "zod";

import type { OpportunityImage } from "@/types/api";

const opportunityBaseFields = {
	company_id: z.string().trim().min(1, "Selecione a empresa responsável."),
	title: z
		.string()
		.trim()
		.min(3, "Informe um título com pelo menos 3 caracteres.")
		.max(200),
	description: z
		.string()
		.trim()
		.min(20, "Descreva a oportunidade com pelo menos 20 caracteres.")
		.max(5000),
	opportunity_type: z.enum(
		["comercializacao", "simbiose_industrial", "compartilhamento"],
		{
			message: "Selecione o tipo da oportunidade.",
		},
	),
	offer_demand: z.enum(["gerador", "receptor"], {
		message: "Informe se é oferta ou demanda.",
	}),
	category: z.string().trim().min(1, "Selecione uma categoria."),
	technical_detail: z
		.string()
		.trim()
		.min(1, "Informe o detalhe técnico.")
		.max(200),
	purity_percent: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine(
			(value) => {
				if (!value) return true;
				const num = Number(value);
				return !Number.isNaN(num) && num >= 0 && num <= 100;
			},
			{ message: "A pureza deve estar entre 0 e 100." },
		),
	physical_state: z.string().trim().min(1, "Selecione o estado físico."),
	periodicity: z.enum(["continua", "esporadica"], {
		message: "Selecione a periodicidade.",
	}),
	quantity: z
		.string()
		.trim()
		.min(1, "Informe a quantidade.")
		.refine((value) => {
			const num = Number(value.replace(",", "."));
			return !Number.isNaN(num) && num > 0;
		}, "A quantidade deve ser maior que zero."),
	unit: z.string().trim().min(1, "Selecione a unidade de medida."),
	price: z.string().optional().or(z.literal("")),
	price_negotiable: z.boolean(),
	city: z.string().trim().min(2, "Informe a cidade.").max(100),
	state: z.string().trim().length(2, "Selecione o estado."),
};

export const opportunityCreateSchema = z
	.object(opportunityBaseFields)
	.superRefine((data, ctx) => {
		if (!data.price_negotiable) {
			const price = Number(data.price?.replace(",", ".") ?? "");
			if (!data.price || Number.isNaN(price) || price < 0) {
				ctx.addIssue({
					code: "custom",
					message: "Informe um valor válido ou marque 'Preço a combinar'.",
					path: ["price"],
				});
			}
		}
	});

export const opportunityUpdateSchema = z
	.object({
		...opportunityBaseFields,
		company_id: z.string().trim().min(1).optional(),
	})
	.superRefine((data, ctx) => {
		if (!data.price_negotiable) {
			const price = Number(data.price?.replace(",", ".") ?? "");
			if (!data.price || Number.isNaN(price) || price < 0) {
				ctx.addIssue({
					code: "custom",
					message: "Informe um valor válido ou marque 'Preço a combinar'.",
					path: ["price"],
				});
			}
		}
	});

export type OpportunityFormValues = z.infer<typeof opportunityCreateSchema>;

export function formatCurrency(value: number | null | undefined): string {
	if (value === null || value === undefined) return "—";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}

export function formatQuantity(quantity: number, unit: string): string {
	const formatted = new Intl.NumberFormat("pt-BR", {
		maximumFractionDigits: 2,
	}).format(quantity);
	return `${formatted} ${unit}`;
}

export function formatPriceDisplay(
	price: number | null,
	priceNegotiable: boolean,
): string {
	if (priceNegotiable) return "A combinar";
	if (price === null) return "—";
	return formatCurrency(price);
}

export function parseDecimalInput(value: string): number | null {
	const normalized = value.replace(/\./g, "").replace(",", ".").trim();
	if (!normalized) return null;
	const num = Number(normalized);
	return Number.isNaN(num) ? null : num;
}

export function formatCurrencyInput(value: string): string {
	const digits = value.replace(/\D/g, "");
	if (!digits) return "";
	const num = Number(digits) / 100;
	return num.toLocaleString("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export function normalizeOpportunityPayload(
	values: OpportunityFormValues,
	images: OpportunityImage[],
) {
	return {
		company_id: values.company_id,
		title: values.title,
		description: values.description,
		opportunity_type: values.opportunity_type,
		offer_demand: values.offer_demand,
		category: values.category,
		technical_detail: values.technical_detail,
		purity_percent: values.purity_percent
			? Number(values.purity_percent)
			: null,
		physical_state: values.physical_state,
		periodicity: values.periodicity,
		quantity: Number(values.quantity.replace(",", ".")),
		unit: values.unit,
		price: values.price_negotiable
			? null
			: parseDecimalInput(values.price ?? ""),
		price_negotiable: values.price_negotiable,
		city: values.city,
		state: values.state,
		images,
	};
}
