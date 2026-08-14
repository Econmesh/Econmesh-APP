"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@econmesh-app/ui/components/button";

import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";
import {
  AuthForm,
  FormField,
  FormInput,
  useFormErrors,
} from "@/modules/auth/components/auth-form";
import { useCepLookup } from "@/modules/companies/hooks/use-cep-lookup";
import {
  BRAZILIAN_STATES,
  COMPLIANCE_ACCEPT,
  MAX_COMPLIANCE_BYTES,
  formatCep,
  formatCnpj,
  formatPhone,
  isAllowedComplianceFile,
} from "@/modules/companies/schemas";
import { ApiError, getValidationFieldErrors } from "@/utils/errors";
import {
  registerCompanySchema,
  registerUserSchema,
  type RegisterCompanyValues,
  type RegisterUserValues,
} from "@/utils/validation";

type FieldKey = string;

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

const emptyCompany: RegisterCompanyValues = {
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
};

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const { errors, setErrors, clear } = useFormErrors<FieldKey>();
  const [company, setCompany] = useState<RegisterCompanyValues>(emptyCompany);
  const [user, setUser] = useState<RegisterUserValues>({
    full_name: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [operatingLicense, setOperatingLicense] = useState<File | null>(null);
  const [mtr, setMtr] = useState<File | null>(null);
  const { lookup: lookupCep, loading: cepLoading } = useCepLookup();

  function applyIssues(issues: { path: (string | number)[]; message: string }[]) {
    const fieldErrors: Partial<Record<FieldKey, string>> = {};
    for (const issue of issues) {
      const key = issue.path.join(".");
      if (key) fieldErrors[key] = issue.message;
    }
    setErrors(fieldErrors);
  }

  function updateCompany<K extends keyof RegisterCompanyValues>(
    key: K,
    value: RegisterCompanyValues[K],
  ) {
    setCompany((prev) => ({ ...prev, [key]: value }));
  }

  function updateAddress(key: keyof NonNullable<RegisterCompanyValues["address"]>, value: string) {
    setCompany((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  }

  async function handleCepBlur() {
    const result = await lookupCep(company.address.postal_code);
    if (!result) return;
    setCompany((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        street: result.street || prev.address.street,
        neighborhood: result.neighborhood || prev.address.neighborhood,
        city: result.city || prev.address.city,
        state: result.state || prev.address.state,
      },
    }));
  }

  function handleCompanyContinue() {
    clear();
    const parsed = registerCompanySchema.safeParse(company);
    if (!parsed.success) {
      applyIssues(parsed.error.issues);
      return;
    }
    setCompany(parsed.data);
    setStep(2);
  }

  function validateFile(file: File | null, field: "operating_license" | "mtr"): string | null {
    if (!file) {
      return field === "operating_license"
        ? "Envie a licença de operação."
        : "Envie o comprovante do MTR.";
    }
    if (!isAllowedComplianceFile(file)) return "Use PDF, JPEG ou PNG.";
    if (file.size > MAX_COMPLIANCE_BYTES) return "Arquivo deve ter no máximo 10 MB.";
    return null;
  }

  function handleDocumentsContinue() {
    clear();
    const licenseError = validateFile(operatingLicense, "operating_license");
    const mtrError = validateFile(mtr, "mtr");
    if (licenseError || mtrError) {
      setErrors({
        ...(licenseError ? { operating_license: licenseError } : {}),
        ...(mtrError ? { mtr: mtrError } : {}),
      });
      return;
    }
    setStep(3);
  }

  async function handleUserSubmit() {
    clear();
    const parsedUser = registerUserSchema.safeParse(user);
    if (!parsedUser.success) {
      applyIssues(parsedUser.error.issues);
      return;
    }
    const parsedCompany = registerCompanySchema.safeParse(company);
    if (!parsedCompany.success) {
      applyIssues(parsedCompany.error.issues);
      setStep(1);
      return;
    }
    const licenseError = validateFile(operatingLicense, "operating_license");
    const mtrError = validateFile(mtr, "mtr");
    if (licenseError || mtrError || !operatingLicense || !mtr) {
      setErrors({
        ...(licenseError ? { operating_license: licenseError } : {}),
        ...(mtrError ? { mtr: mtrError } : {}),
      });
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const response = await signUp({
        ...parsedUser.data,
        company: {
          legal_name: parsedCompany.data.legal_name,
          trade_name: parsedCompany.data.trade_name || null,
          tax_id: stripNonDigits(parsedCompany.data.tax_id),
          email: parsedCompany.data.email,
          phone: stripNonDigits(parsedCompany.data.phone),
          address: {
            postal_code: stripNonDigits(parsedCompany.data.address.postal_code),
            street: parsedCompany.data.address.street,
            number: parsedCompany.data.address.number,
            complement: parsedCompany.data.address.complement || null,
            neighborhood: parsedCompany.data.address.neighborhood || null,
            city: parsedCompany.data.address.city,
            state: parsedCompany.data.address.state,
          },
        },
        operating_license: operatingLicense,
        mtr,
      });
      toast.success(response.message);
      router.push(
        `/verify-email?email=${encodeURIComponent(parsedUser.data.email)}`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "validation_error") {
          setErrors(getValidationFieldErrors(error.details));
        }
        if (error.code === "tax_id_exists" || error.code === "file_too_large") {
          setStep(error.code === "tax_id_exists" ? 1 : 2);
        }
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Falha no cadastro.");
      }
    } finally {
      setLoading(false);
    }
  }

  const stepLabel =
    step === 1 ? "Empresa" : step === 2 ? "Documentos" : "Responsável";

  return (
    <AuthShell
      wide
      title="Criar conta"
      subtitle="Cadastre sua empresa, os documentos obrigatórios e o responsável pela conta."
    >
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Passo {step} de 3 — {stepLabel}
      </p>
      {step === 1 ? (
        <AuthForm onSubmit={handleCompanyContinue} submitLabel="Continuar">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="legal_name" label="Razão social" error={errors.legal_name}>
              <FormInput
                id="legal_name"
                required
                value={company.legal_name}
                onChange={(e) => updateCompany("legal_name", e.target.value)}
                aria-invalid={!!errors.legal_name}
              />
            </FormField>
            <FormField id="trade_name" label="Nome fantasia" error={errors.trade_name}>
              <FormInput
                id="trade_name"
                value={company.trade_name ?? ""}
                onChange={(e) => updateCompany("trade_name", e.target.value)}
                aria-invalid={!!errors.trade_name}
              />
            </FormField>
            <FormField id="tax_id" label="CNPJ" error={errors.tax_id}>
              <FormInput
                id="tax_id"
                inputMode="numeric"
                required
                value={formatCnpj(company.tax_id)}
                onChange={(e) => updateCompany("tax_id", e.target.value)}
                aria-invalid={!!errors.tax_id}
              />
            </FormField>
            <FormField id="email" label="E-mail da empresa" error={errors.email}>
              <FormInput
                id="email"
                type="email"
                required
                value={company.email}
                onChange={(e) => updateCompany("email", e.target.value)}
                aria-invalid={!!errors.email}
              />
            </FormField>
            <FormField id="phone" label="Telefone" error={errors.phone}>
              <FormInput
                id="phone"
                inputMode="tel"
                required
                value={formatPhone(company.phone)}
                onChange={(e) => updateCompany("phone", e.target.value)}
                aria-invalid={!!errors.phone}
              />
            </FormField>
          </div>
          <p className="pt-2 text-sm font-medium">Endereço</p>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="postal_code" label="CEP" error={errors["address.postal_code"]}>
              <FormInput
                id="postal_code"
                inputMode="numeric"
                required
                value={formatCep(company.address.postal_code)}
                onChange={(e) => updateAddress("postal_code", e.target.value)}
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
                required
                value={company.address.street}
                onChange={(e) => updateAddress("street", e.target.value)}
                aria-invalid={!!errors["address.street"]}
              />
            </FormField>
            <FormField id="number" label="Número" error={errors["address.number"]}>
              <FormInput
                id="number"
                required
                value={company.address.number}
                onChange={(e) => updateAddress("number", e.target.value)}
                aria-invalid={!!errors["address.number"]}
              />
            </FormField>
            <FormField id="complement" label="Complemento" error={errors["address.complement"]}>
              <FormInput
                id="complement"
                value={company.address.complement ?? ""}
                onChange={(e) => updateAddress("complement", e.target.value)}
              />
            </FormField>
            <FormField id="neighborhood" label="Bairro" error={errors["address.neighborhood"]}>
              <FormInput
                id="neighborhood"
                value={company.address.neighborhood ?? ""}
                onChange={(e) => updateAddress("neighborhood", e.target.value)}
              />
            </FormField>
            <FormField id="city" label="Cidade" error={errors["address.city"]}>
              <FormInput
                id="city"
                required
                value={company.address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                aria-invalid={!!errors["address.city"]}
              />
            </FormField>
            <FormField id="state" label="Estado" error={errors["address.state"]}>
              <select
                id="state"
                required
                value={company.address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
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
          </div>
        </AuthForm>
      ) : null}
      {step === 2 ? (
        <AuthForm
          onSubmit={handleDocumentsContinue}
          submitLabel="Continuar"
          footer={
            <Button type="button" variant="ghost" className="w-full" onClick={() => { clear(); setStep(1); }}>
              Voltar
            </Button>
          }
        >
          <FormField
            id="operating_license"
            label="Licença de operação"
            error={errors.operating_license}
          >
            <input
              id="operating_license"
              type="file"
              accept={COMPLIANCE_ACCEPT}
              required
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5"
              onChange={(e) => setOperatingLicense(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              PDF, JPEG ou PNG até 10 MB. Documento ambiental vigente.
            </p>
            {operatingLicense ? (
              <p className="text-xs text-foreground">{operatingLicense.name}</p>
            ) : null}
          </FormField>
          <FormField id="mtr" label="MTR (Manifesto de Transporte de Resíduos)" error={errors.mtr}>
            <input
              id="mtr"
              type="file"
              accept={COMPLIANCE_ACCEPT}
              required
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5"
              onChange={(e) => setMtr(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Comprovante de cadastro no MTR Nacional – SINIR.{" "}
              <a
                href="https://sinir.gov.br/sistemas/mtr/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Acessar o sistema
              </a>
            </p>
            {mtr ? <p className="text-xs text-foreground">{mtr.name}</p> : null}
          </FormField>
        </AuthForm>
      ) : null}
      {step === 3 ? (
        <AuthForm
          onSubmit={handleUserSubmit}
          submitLabel="Cadastrar"
          loading={loading}
          footer={
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={loading}
              onClick={() => {
                clear();
                setStep(2);
              }}
            >
              Voltar
            </Button>
          }
        >
          <FormField id="full_name" label="Nome completo" error={errors.full_name}>
            <FormInput
              id="full_name"
              autoComplete="name"
              required
              value={user.full_name}
              onChange={(e) => setUser((prev) => ({ ...prev, full_name: e.target.value }))}
              aria-invalid={!!errors.full_name}
            />
          </FormField>
          <FormField id="email" label="E-mail" error={errors.email}>
            <FormInput
              id="email"
              type="email"
              autoComplete="email"
              required
              value={user.email}
              onChange={(e) => setUser((prev) => ({ ...prev, email: e.target.value }))}
              aria-invalid={!!errors.email}
            />
          </FormField>
          <FormField id="password" label="Senha" error={errors.password}>
            <FormInput
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={user.password}
              onChange={(e) => setUser((prev) => ({ ...prev, password: e.target.value }))}
              aria-invalid={!!errors.password}
            />
          </FormField>
          <FormField id="password_confirm" label="Confirmar senha" error={errors.password_confirm}>
            <FormInput
              id="password_confirm"
              type="password"
              autoComplete="new-password"
              required
              value={user.password_confirm}
              onChange={(e) =>
                setUser((prev) => ({ ...prev, password_confirm: e.target.value }))
              }
              aria-invalid={!!errors.password_confirm}
            />
          </FormField>
        </AuthForm>
      ) : null}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
