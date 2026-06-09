"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Label } from "@econmesh-app/ui/components/label";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField, FormInput, useFormErrors } from "@/modules/auth/components/auth-form";
import { useCepLookup } from "@/modules/companies/hooks/use-cep-lookup";
import {
  companyCreateSchema,
  companyUpdateSchema,
  formatCep,
  formatCnpj,
  formatPhone,
  normalizeCompanyPayload,
  normalizeCompanyUpdatePayload,
  type CompanyFormValues,
} from "@/modules/companies/schemas";
import { companiesService } from "@/services/companies/companies.service";
import type { Company } from "@/types/api";
import { ApiError, getValidationFieldErrors } from "@/utils/errors";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

type CompanyFormProps = {
  mode: "create" | "edit";
  initialData?: Company;
  onSubmit: (payload: Record<string, unknown> & {
    logo_storage_key?: string | null;
    logo_url?: string | null;
  }) => Promise<void>;
  submitLabel: string;
};

function companyToFormValues(company: Company): CompanyFormValues {
  return {
    legal_name: company.legal_name,
    trade_name: company.trade_name ?? "",
    tax_id: company.tax_id,
    email: company.email ?? "",
    phone: company.phone ?? "",
    address: {
      postal_code: company.address?.postal_code ?? "",
      street: company.address?.street ?? "",
      number: company.address?.number ?? "",
      complement: company.address?.complement ?? "",
      neighborhood: company.address?.neighborhood ?? "",
      city: company.address?.city ?? "",
      state: company.address?.state ?? "",
    },
    country: company.country,
    website: company.website ?? "",
    description: company.description ?? "",
    sector: company.sector ?? "",
  };
}

export function CompanyForm({ mode, initialData, onSubmit, submitLabel }: CompanyFormProps) {
  const { errors, setErrors, clear } = useFormErrors<string>();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url ?? null);
  const [logoStorageKey, setLogoStorageKey] = useState<string | null>(
    initialData?.logo_storage_key ?? null,
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { lookup: lookupCep, loading: cepLoading } = useCepLookup();

  const [formValues, setFormValues] = useState<CompanyFormValues>(
    initialData ? companyToFormValues(initialData) : {
      legal_name: "",
      trade_name: "",
      tax_id: "",
      email: "",
      phone: "",
      address: {
        postal_code: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
      country: "BR",
      website: "",
      description: "",
      sector: "",
    },
  );

  useEffect(() => {
    if (initialData) {
      setFormValues(companyToFormValues(initialData));
      setLogoPreview(initialData.logo_url ?? null);
      setLogoStorageKey(initialData.logo_storage_key ?? null);
      setLogoUrl(initialData.logo_url ?? null);
    }
  }, [initialData]);

  function updateField<K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateAddressField(key: keyof NonNullable<CompanyFormValues["address"]>, value: string) {
    setFormValues((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  }

  async function handleCepBlur() {
    const cep = formValues.address?.postal_code ?? "";
    const result = await lookupCep(cep);
    if (!result) return;

    setFormValues((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        street: result.street || prev.address?.street || "",
        neighborhood: result.neighborhood || prev.address?.neighborhood || "",
        city: result.city || prev.address?.city || "",
        state: result.state || prev.address?.state || "",
      },
    }));
  }

  async function handleLogoChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O logotipo deve ter no máximo 5 MB.");
      return;
    }

    setUploadingLogo(true);
    try {
      const uploaded = await companiesService.uploadLogo(file);
      setLogoStorageKey(uploaded.storage_key);
      setLogoUrl(uploaded.public_url);
      setLogoPreview(URL.createObjectURL(file));
      toast.success("Logotipo enviado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar logotipo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clear();

    const schema = mode === "create" ? companyCreateSchema : companyUpdateSchema;
    const parsed = schema.safeParse(formValues);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const payload =
        mode === "create"
          ? normalizeCompanyPayload(formValues)
          : normalizeCompanyUpdatePayload(formValues);
      await onSubmit({
        ...payload,
        logo_storage_key: logoStorageKey,
        logo_url: logoUrl,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "validation_error") {
          setErrors(getValidationFieldErrors(error.details));
        }
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar a empresa.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="space-y-4 rounded-xl border border-border/80 bg-card/80 p-6">
        <div>
          <h2 className="text-base font-semibold">Dados básicos</h2>
          <p className="text-sm text-muted-foreground">Informações principais da empresa.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="legal_name" label="Nome da empresa" error={errors.legal_name}>
            <FormInput
              id="legal_name"
              value={formValues.legal_name}
              onChange={(e) => updateField("legal_name", e.target.value)}
              required
              aria-invalid={!!errors.legal_name}
            />
          </FormField>

          <FormField id="trade_name" label="Nome fantasia" error={errors.trade_name}>
            <FormInput
              id="trade_name"
              value={formValues.trade_name ?? ""}
              onChange={(e) => updateField("trade_name", e.target.value)}
              aria-invalid={!!errors.trade_name}
            />
          </FormField>

          <FormField id="tax_id" label="CNPJ" error={errors.tax_id}>
            <FormInput
              id="tax_id"
              value={formatCnpj(formValues.tax_id)}
              onChange={(e) => updateField("tax_id", e.target.value)}
              required
              disabled={mode === "edit"}
              aria-invalid={!!errors.tax_id}
            />
          </FormField>

          <FormField id="email" label="E-mail" error={errors.email}>
            <FormInput
              id="email"
              type="email"
              value={formValues.email ?? ""}
              onChange={(e) => updateField("email", e.target.value)}
              aria-invalid={!!errors.email}
            />
          </FormField>

          <FormField id="phone" label="Telefone" error={errors.phone}>
            <FormInput
              id="phone"
              value={formatPhone(formValues.phone ?? "")}
              onChange={(e) => updateField("phone", e.target.value)}
              aria-invalid={!!errors.phone}
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/80 bg-card/80 p-6">
        <div>
          <h2 className="text-base font-semibold">Endereço</h2>
          <p className="text-sm text-muted-foreground">Localização da sede da empresa.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField id="postal_code" label="CEP" error={errors["address.postal_code"]}>
            <FormInput
              id="postal_code"
              value={formatCep(formValues.address?.postal_code ?? "")}
              onChange={(e) => updateAddressField("postal_code", e.target.value)}
              onBlur={() => void handleCepBlur()}
              aria-invalid={!!errors["address.postal_code"]}
            />
            {cepLoading ? (
              <p className="text-xs text-muted-foreground">Buscando endereço…</p>
            ) : null}
          </FormField>

          <FormField id="street" label="Rua" error={errors["address.street"]} >
            <FormInput
              id="street"
              value={formValues.address?.street ?? ""}
              onChange={(e) => updateAddressField("street", e.target.value)}
              className="md:col-span-2"
              aria-invalid={!!errors["address.street"]}
            />
          </FormField>

          <FormField id="number" label="Número" error={errors["address.number"]}>
            <FormInput
              id="number"
              value={formValues.address?.number ?? ""}
              onChange={(e) => updateAddressField("number", e.target.value)}
              aria-invalid={!!errors["address.number"]}
            />
          </FormField>

          <FormField id="complement" label="Complemento" error={errors["address.complement"]}>
            <FormInput
              id="complement"
              value={formValues.address?.complement ?? ""}
              onChange={(e) => updateAddressField("complement", e.target.value)}
              aria-invalid={!!errors["address.complement"]}
            />
          </FormField>

          <FormField id="neighborhood" label="Bairro" error={errors["address.neighborhood"]}>
            <FormInput
              id="neighborhood"
              value={formValues.address?.neighborhood ?? ""}
              onChange={(e) => updateAddressField("neighborhood", e.target.value)}
              aria-invalid={!!errors["address.neighborhood"]}
            />
          </FormField>

          <FormField id="city" label="Cidade" error={errors["address.city"]}>
            <FormInput
              id="city"
              value={formValues.address?.city ?? ""}
              onChange={(e) => updateAddressField("city", e.target.value)}
              aria-invalid={!!errors["address.city"]}
            />
          </FormField>

          <FormField id="state" label="Estado" error={errors["address.state"]}>
            <select
              id="state"
              value={formValues.address?.state ?? ""}
              onChange={(e) => updateAddressField("state", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-invalid={!!errors["address.state"]}
            >
              <option value="">Selecione</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="country" label="País" error={errors.country}>
            <FormInput id="country" value="BR" disabled />
          </FormField>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/80 bg-card/80 p-6">
        <div>
          <h2 className="text-base font-semibold">Informações adicionais</h2>
          <p className="text-sm text-muted-foreground">Site, descrição e logotipo da empresa.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="website" label="Site" error={errors.website}>
            <FormInput
              id="website"
              type="url"
              placeholder="https://"
              value={formValues.website ?? ""}
              onChange={(e) => updateField("website", e.target.value)}
              aria-invalid={!!errors.website}
            />
          </FormField>

          <FormField id="sector" label="Setor" error={errors.sector}>
            <FormInput
              id="sector"
              value={formValues.sector ?? ""}
              onChange={(e) => updateField("sector", e.target.value)}
              aria-invalid={!!errors.sector}
            />
          </FormField>
        </div>

        <FormField id="description" label="Descrição" error={errors.description}>
          <textarea
            id="description"
            rows={4}
            value={formValues.description ?? ""}
            onChange={(e) => updateField("description", e.target.value)}
            className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-invalid={!!errors.description}
          />
        </FormField>

        <div className="space-y-3">
          <Label>Logotipo</Label>
          <div className="flex flex-wrap items-center gap-4">
            {logoPreview ? (
              <div className="relative size-20 overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={logoPreview}
                  alt="Pré-visualização do logotipo"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex size-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                Sem logo
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleLogoChange(e.target.files?.[0] ?? null)}
            />

            <Button
              type="button"
              variant="outline"
              disabled={uploadingLogo}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingLogo ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Enviando…
                </>
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  Enviar logotipo
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || uploadingLogo}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Aguarde…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
