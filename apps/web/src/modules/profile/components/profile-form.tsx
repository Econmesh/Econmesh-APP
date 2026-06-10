"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Loader2, Upload, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField, FormInput, useFormErrors } from "@/modules/auth/components/auth-form";
import { useCepLookup } from "@/modules/companies/hooks/use-cep-lookup";
import {
  formatBirthDateForInput,
  formatCep,
  formatCpf,
  formatPhone,
  normalizeProfilePayload,
  profileUpdateSchema,
  type ProfileFormValues,
} from "@/modules/profile/schemas";
import { profileService } from "@/services/profile/profile.service";
import type { UserProfile } from "@/types/api";
import { ApiError, getValidationFieldErrors } from "@/utils/errors";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

type ProfileFormProps = {
  initialData: UserProfile;
  onSubmit: (payload: ReturnType<typeof normalizeProfilePayload> & {
    picture_storage_key?: string | null;
    picture_url?: string | null;
  }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

function profileToFormValues(profile: UserProfile): ProfileFormValues {
  return {
    name: profile.name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    cpf: profile.cpf ?? "",
    birth_date: formatBirthDateForInput(profile.birth_date),
    job_title: profile.job_title ?? "",
    address: {
      postal_code: profile.address?.postal_code ?? "",
      street: profile.address?.street ?? "",
      number: profile.address?.number ?? "",
      complement: profile.address?.complement ?? "",
      neighborhood: profile.address?.neighborhood ?? "",
      city: profile.address?.city ?? "",
      state: profile.address?.state ?? "",
    },
    country: profile.country ?? "BR",
  };
}

export function ProfileForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Salvar alterações",
}: ProfileFormProps) {
  const { errors, setErrors, clear } = useFormErrors<string>();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData.picture);
  const [photoStorageKey, setPhotoStorageKey] = useState<string | null>(
    initialData.picture_storage_key,
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData.picture);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { lookup: lookupCep, loading: cepLoading } = useCepLookup();

  const [formValues, setFormValues] = useState<ProfileFormValues>(
    profileToFormValues(initialData),
  );

  useEffect(() => {
    setFormValues(profileToFormValues(initialData));
    setPhotoPreview(initialData.picture);
    setPhotoStorageKey(initialData.picture_storage_key);
    setPhotoUrl(initialData.picture);
  }, [initialData]);

  function updateField<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateAddressField(key: keyof ProfileFormValues["address"], value: string) {
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

  async function handlePhotoChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5 MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const uploaded = await profileService.uploadAvatar(file);
      setPhotoStorageKey(uploaded.storage_key);
      setPhotoUrl(uploaded.public_url);
      setPhotoPreview(URL.createObjectURL(file));
      toast.success("Foto enviada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar foto.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clear();

    const parsed = profileUpdateSchema.safeParse(formValues);
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
      await onSubmit({
        ...normalizeProfilePayload(parsed.data),
        picture_storage_key: photoStorageKey,
        picture_url: photoUrl,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = getValidationFieldErrors(error.details);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          return;
        }
        toast.error(error.message);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6" noValidate>
      <section className="space-y-4 rounded-xl border border-border/80 bg-card/80 p-6">
        <div>
          <h2 className="text-base font-semibold">Dados pessoais</h2>
          <p className="text-sm text-muted-foreground">Informações básicas da sua conta.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative size-20 overflow-hidden rounded-full border border-border bg-muted">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Pré-visualização da foto"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <User className="size-8 text-muted-foreground" aria-hidden />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handlePhotoChange(event.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingPhoto ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Enviando…
                </>
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  Alterar foto
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP ou GIF — até 5 MB.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="name" label="Nome" error={errors.name}>
            <FormInput
              id="name"
              value={formValues.name}
              onChange={(e) => updateField("name", e.target.value)}
              aria-invalid={!!errors.name}
            />
          </FormField>

          <FormField id="email" label="E-mail" error={errors.email}>
            <FormInput
              id="email"
              type="email"
              value={formValues.email}
              onChange={(e) => updateField("email", e.target.value)}
              aria-invalid={!!errors.email}
            />
          </FormField>

          <FormField id="cpf" label="CPF" error={errors.cpf}>
            <FormInput
              id="cpf"
              value={formatCpf(formValues.cpf)}
              onChange={(e) => updateField("cpf", e.target.value)}
              aria-invalid={!!errors.cpf}
            />
          </FormField>

          <FormField id="birth_date" label="Data de nascimento" error={errors.birth_date}>
            <FormInput
              id="birth_date"
              type="date"
              value={formValues.birth_date}
              onChange={(e) => updateField("birth_date", e.target.value)}
              aria-invalid={!!errors.birth_date}
            />
          </FormField>

          <FormField id="phone" label="Telefone" error={errors.phone}>
            <FormInput
              id="phone"
              value={formatPhone(formValues.phone)}
              onChange={(e) => updateField("phone", e.target.value)}
              aria-invalid={!!errors.phone}
            />
          </FormField>

          <FormField id="job_title" label="Cargo" error={errors.job_title}>
            <FormInput
              id="job_title"
              value={formValues.job_title}
              onChange={(e) => updateField("job_title", e.target.value)}
              aria-invalid={!!errors.job_title}
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/80 bg-card/80 p-6">
        <div>
          <h2 className="text-base font-semibold">Endereço</h2>
          <p className="text-sm text-muted-foreground">Localização cadastrada.</p>
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

          <FormField id="street" label="Rua" error={errors["address.street"]}>
            <FormInput
              id="street"
              value={formValues.address?.street ?? ""}
              onChange={(e) => updateAddressField("street", e.target.value)}
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

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading || uploadingPhoto}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Salvando…
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
