"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Checkbox } from "@econmesh-app/ui/components/checkbox";
import { Input } from "@econmesh-app/ui/components/input";
import { Select } from "@econmesh-app/ui/components/select";
import { Textarea } from "@econmesh-app/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { FormField, useFormErrors } from "@/modules/auth/components/auth-form";
import { FormFieldWithTooltip } from "@/modules/opportunities/components/form-field-tooltip";
import { OpportunityImageUpload } from "@/modules/opportunities/components/opportunity-image-upload";
import { TechnicalDetailInput } from "@/modules/opportunities/components/technical-detail-input";
import {
	BRAZILIAN_STATES,
	OFFER_DEMAND_OPTIONS,
	OPPORTUNITY_CATEGORIES,
	OPPORTUNITY_TYPES,
	PERIODICITY_OPTIONS,
	PHYSICAL_STATES,
	UNIT_OPTIONS,
} from "@/modules/opportunities/constants";
import {
	formatCurrencyInput,
	normalizeOpportunityPayload,
	type OpportunityFormValues,
	opportunityCreateSchema,
	opportunityUpdateSchema,
} from "@/modules/opportunities/schemas";
import { companiesService } from "@/services/companies/companies.service";
import type {
	Company,
	Opportunity,
	OpportunityCreatePayload,
	OpportunityImage,
	OpportunityUpdatePayload,
} from "@/types/api";
import { ApiError, getValidationFieldErrors } from "@/utils/errors";

type OpportunityFormProps =
	| {
			mode: "create";
			initialData?: never;
			onSubmit: (payload: OpportunityCreatePayload) => Promise<void>;
			submitLabel: string;
	  }
	| {
			mode: "edit";
			initialData: Opportunity;
			onSubmit: (payload: OpportunityUpdatePayload) => Promise<void>;
			submitLabel: string;
	  };

const defaultValues: OpportunityFormValues = {
	company_id: "",
	title: "",
	description: "",
	opportunity_type: "comercializacao",
	offer_demand: "gerador",
	category: "",
	technical_detail: "",
	purity_percent: "",
	physical_state: "",
	periodicity: "continua",
	quantity: "",
	unit: "",
	price: "",
	price_negotiable: false,
	city: "",
	state: "",
};

function opportunityToFormValues(
	opportunity: Opportunity,
): OpportunityFormValues {
	return {
		company_id: opportunity.company_id,
		title: opportunity.title,
		description: opportunity.description,
		opportunity_type: opportunity.opportunity_type,
		offer_demand: opportunity.offer_demand,
		category: opportunity.category,
		technical_detail: opportunity.technical_detail,
		purity_percent: opportunity.purity_percent?.toString() ?? "",
		physical_state: opportunity.physical_state,
		periodicity: opportunity.periodicity,
		quantity: opportunity.quantity.toString(),
		unit: opportunity.unit,
		price:
			opportunity.price !== null
				? opportunity.price.toLocaleString("pt-BR", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})
				: "",
		price_negotiable: opportunity.price_negotiable,
		city: opportunity.city,
		state: opportunity.state,
	};
}

export function OpportunityForm({
	mode,
	initialData,
	onSubmit,
	submitLabel,
}: OpportunityFormProps) {
	const { errors, setErrors, clear } = useFormErrors<string>();
	const [loading, setLoading] = useState(false);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loadingCompanies, setLoadingCompanies] = useState(true);
	const [images, setImages] = useState<OpportunityImage[]>(
		initialData?.images ?? [],
	);
	const [formValues, setFormValues] = useState<OpportunityFormValues>(
		initialData ? opportunityToFormValues(initialData) : defaultValues,
	);

	useEffect(() => {
		async function loadCompanies() {
			try {
				const data = await companiesService.list();
				setCompanies(data);
          if (mode === "create" && data[0]) {
            const firstCompany = data[0];
            setFormValues((prev) =>
              prev.company_id ? prev : { ...prev, company_id: firstCompany.id },
            );
          }
			} catch {
				toast.error("Não foi possível carregar as empresas.");
			} finally {
				setLoadingCompanies(false);
			}
		}
		void loadCompanies();
	}, [mode]);

	useEffect(() => {
		if (initialData) {
			setFormValues(opportunityToFormValues(initialData));
			setImages(initialData.images);
		}
	}, [initialData]);

	function updateField<K extends keyof OpportunityFormValues>(
		key: K,
		value: OpportunityFormValues[K],
	) {
		setFormValues((prev) => ({ ...prev, [key]: value }));
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		clear();

		clear();

		if (mode === "create") {
			const parsedCreate = opportunityCreateSchema.safeParse(formValues);
			if (!parsedCreate.success) {
				const fieldErrors: Record<string, string> = {};
				for (const issue of parsedCreate.error.issues) {
					const key = issue.path.join(".");
					if (key) fieldErrors[key] = issue.message;
				}
				setErrors(fieldErrors);
				return;
			}
		} else {
			const parsedUpdate = opportunityUpdateSchema.safeParse(formValues);
			if (!parsedUpdate.success) {
				const fieldErrors: Record<string, string> = {};
				for (const issue of parsedUpdate.error.issues) {
					const key = issue.path.join(".");
					if (key) fieldErrors[key] = issue.message;
				}
				setErrors(fieldErrors);
				return;
			}
		}

		setLoading(true);
		try {
			if (mode === "create") {
				const parsedCreate = opportunityCreateSchema.parse(formValues);
				const payload = normalizeOpportunityPayload(parsedCreate, images);
				await onSubmit(payload);
			} else {
				const parsedUpdate = opportunityUpdateSchema.parse(formValues);
				const { company_id: _companyId, ...rest } = parsedUpdate;
				const payload = normalizeOpportunityPayload(
					{ ...rest, company_id: initialData.company_id },
					images,
				);
				const { company_id: __, ...updatePayload } = payload;
				await onSubmit(updatePayload);
			}
		} catch (error) {
			if (error instanceof ApiError) {
				if (error.code === "validation_error") {
					setErrors(getValidationFieldErrors(error.details));
				}
				toast.error(error.message);
			} else {
				toast.error(
					error instanceof Error
						? error.message
						: "Não foi possível salvar a oportunidade.",
				);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<form
			onSubmit={(e) => void handleSubmit(e)}
			className="space-y-8 rounded-xl border border-border/80 bg-card/80 p-6"
			noValidate
		>
			<section className="space-y-4">
				<h2 className="font-semibold text-lg">Informações gerais</h2>

				<FormField
					id="company_id"
					label="Empresa responsável"
					error={errors.company_id}
				>
					<Select
						id="company_id"
						value={formValues.company_id}
						onChange={(e) => updateField("company_id", e.target.value)}
						disabled={loadingCompanies || mode === "edit"}
						aria-invalid={!!errors.company_id}
					>
						<option value="">Selecione a empresa</option>
						{companies.map((company) => (
							<option key={company.id} value={company.id}>
								{company.trade_name || company.legal_name}
							</option>
						))}
					</Select>
				</FormField>

				<FormField id="title" label="Título" error={errors.title}>
					<Input
						id="title"
						value={formValues.title}
						onChange={(e) => updateField("title", e.target.value)}
						placeholder="Ex.: Venda de PET Triturado"
						aria-invalid={!!errors.title}
					/>
				</FormField>

				<FormField
					id="description"
					label="Descrição"
					error={errors.description}
				>
					<Textarea
						id="description"
						value={formValues.description}
						onChange={(e) => updateField("description", e.target.value)}
						placeholder="Descreva origem, aplicação, observações e informações relevantes."
						rows={5}
						aria-invalid={!!errors.description}
					/>
				</FormField>

				<div className="grid gap-4 sm:grid-cols-2">
					<FormField
						id="opportunity_type"
						label="Tipo da oportunidade"
						error={errors.opportunity_type}
					>
						<Select
							id="opportunity_type"
							value={formValues.opportunity_type}
							onChange={(e) =>
								updateField(
									"opportunity_type",
									e.target.value as OpportunityFormValues["opportunity_type"],
								)
							}
							aria-invalid={!!errors.opportunity_type}
						>
							{OPPORTUNITY_TYPES.map((type) => (
								<option key={type.value} value={type.value}>
									{type.label}
								</option>
							))}
						</Select>
						<p className="text-muted-foreground text-xs">
							{
								OPPORTUNITY_TYPES.find(
									(t) => t.value === formValues.opportunity_type,
								)?.description
							}
						</p>
					</FormField>

					<FormField
						id="offer_demand"
						label="Oferta ou demanda"
						error={errors.offer_demand}
					>
						<Select
							id="offer_demand"
							value={formValues.offer_demand}
							onChange={(e) =>
								updateField(
									"offer_demand",
									e.target.value as OpportunityFormValues["offer_demand"],
								)
							}
							aria-invalid={!!errors.offer_demand}
						>
							{OFFER_DEMAND_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</FormField>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="font-semibold text-lg">Classificação técnica</h2>

				<div className="grid gap-4 sm:grid-cols-2">
					<FormFieldWithTooltip
						id="category"
						label="Categoria"
						tooltip="Classificação macro que define o setor industrial. Ex.: Plástico, Metal, Vidro."
						error={errors.category}
					>
						<Select
							id="category"
							value={formValues.category}
							onChange={(e) => updateField("category", e.target.value)}
							aria-invalid={!!errors.category}
						>
							<option value="">Selecione</option>
							{OPPORTUNITY_CATEGORIES.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</Select>
					</FormFieldWithTooltip>

					<FormFieldWithTooltip
						id="technical_detail"
						label="Detalhe técnico"
						tooltip="Classificação química ou técnica exata do material, utilizada para definir compatibilidade entre empresas."
						error={errors.technical_detail}
					>
						<TechnicalDetailInput
							id="technical_detail"
							value={formValues.technical_detail}
							onChange={(value) => updateField("technical_detail", value)}
							error={errors.technical_detail}
						/>
					</FormFieldWithTooltip>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<FormFieldWithTooltip
						id="purity_percent"
						label="Pureza (%)"
						tooltip="Percentual do material principal em relação aos contaminantes. Influencia diretamente no valor comercial."
						error={errors.purity_percent}
					>
						<Input
							id="purity_percent"
							type="number"
							min={0}
							max={100}
							step={0.1}
							value={formValues.purity_percent}
							onChange={(e) => updateField("purity_percent", e.target.value)}
							placeholder="Ex.: 99"
							aria-invalid={!!errors.purity_percent}
						/>
					</FormFieldWithTooltip>

					<FormFieldWithTooltip
						id="physical_state"
						label="Estado físico"
						tooltip="Define o acondicionamento volumétrico do material, impactando diretamente o custo logístico."
						error={errors.physical_state}
					>
						<Select
							id="physical_state"
							value={formValues.physical_state}
							onChange={(e) => updateField("physical_state", e.target.value)}
							aria-invalid={!!errors.physical_state}
						>
							<option value="">Selecione</option>
							{PHYSICAL_STATES.map((state) => (
								<option key={state} value={state}>
									{state}
								</option>
							))}
						</Select>
					</FormFieldWithTooltip>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="font-semibold text-lg">Quantidade e valor</h2>

				<div className="grid gap-4 sm:grid-cols-3">
					<FormField
						id="periodicity"
						label="Periodicidade"
						error={errors.periodicity}
					>
						<Select
							id="periodicity"
							value={formValues.periodicity}
							onChange={(e) =>
								updateField(
									"periodicity",
									e.target.value as OpportunityFormValues["periodicity"],
								)
							}
							aria-invalid={!!errors.periodicity}
						>
							{PERIODICITY_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</FormField>

					<FormField id="quantity" label="Quantidade" error={errors.quantity}>
						<Input
							id="quantity"
							type="number"
							min={0}
							step="any"
							value={formValues.quantity}
							onChange={(e) => updateField("quantity", e.target.value)}
							placeholder="Ex.: 10"
							aria-invalid={!!errors.quantity}
						/>
					</FormField>

					<FormField id="unit" label="Unidade de medida" error={errors.unit}>
						<Select
							id="unit"
							value={formValues.unit}
							onChange={(e) => updateField("unit", e.target.value)}
							aria-invalid={!!errors.unit}
						>
							<option value="">Selecione</option>
							{UNIT_OPTIONS.map((unit) => (
								<option key={unit} value={unit}>
									{unit}
								</option>
							))}
						</Select>
					</FormField>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<FormField id="price" label="Valor (R$)" error={errors.price}>
						<Input
							id="price"
							value={formValues.price}
							onChange={(e) =>
								updateField("price", formatCurrencyInput(e.target.value))
							}
							placeholder="0,00"
							disabled={formValues.price_negotiable}
							aria-invalid={!!errors.price}
						/>
					</FormField>

          <div className="flex items-end pb-1">
            <label htmlFor="price_negotiable" className="flex cursor-pointer items-center gap-2">
              <Checkbox
                id="price_negotiable"
                checked={formValues.price_negotiable}
                onCheckedChange={(checked) =>
                  updateField("price_negotiable", checked === true)
                }
              />
              <span className="text-sm">Preço a combinar</span>
            </label>
          </div>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="font-semibold text-lg">Localização</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					<FormField id="city" label="Cidade" error={errors.city}>
						<Input
							id="city"
							value={formValues.city}
							onChange={(e) => updateField("city", e.target.value)}
							placeholder="Ex.: São Paulo"
							aria-invalid={!!errors.city}
						/>
					</FormField>

					<FormField id="state" label="Estado" error={errors.state}>
						<Select
							id="state"
							value={formValues.state}
							onChange={(e) => updateField("state", e.target.value)}
							aria-invalid={!!errors.state}
						>
							<option value="">Selecione</option>
							{BRAZILIAN_STATES.map((state) => (
								<option key={state} value={state}>
									{state}
								</option>
							))}
						</Select>
					</FormField>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="font-semibold text-lg">Imagens</h2>
				<OpportunityImageUpload
					images={images}
					onChange={setImages}
					disabled={loading}
				/>
			</section>

			<div className="flex justify-end">
				<Button type="submit" disabled={loading}>
					{loading ? (
						<>
							<Loader2 className="size-4 animate-spin" aria-hidden />
							Salvando…
						</>
					) : (
						submitLabel
					)}
				</Button>
			</div>
		</form>
	);
}
