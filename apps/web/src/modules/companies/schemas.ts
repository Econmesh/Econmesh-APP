import { z } from "zod";

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCnpj(cnpj: string): boolean {
  const digits = stripNonDigits(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (slice: number) => {
    const nums = digits.slice(0, slice).split("").map(Number);
    const weights =
      slice === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = nums.reduce((acc, num, index) => acc + num * weights[index]!, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]);
}

const addressSchema = z.object({
  postal_code: z.string().max(12).optional().or(z.literal("")),
  street: z.string().max(200).optional().or(z.literal("")),
  number: z.string().max(20).optional().or(z.literal("")),
  complement: z.string().max(100).optional().or(z.literal("")),
  neighborhood: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
});

const baseCompanyFields = {
  legal_name: z.string().trim().min(2, "Informe o nome da empresa.").max(200),
  trade_name: z.string().trim().max(200).optional().or(z.literal("")),
  tax_id: z
    .string()
    .trim()
    .min(5, "Informe o CNPJ.")
    .max(20)
    .refine(isValidCnpj, "CNPJ inválido."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: addressSchema.optional(),
  country: z.string().length(2).default("BR"),
  website: z
    .string()
    .trim()
    .url("URL inválida.")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  sector: z.string().trim().max(100).optional().or(z.literal("")),
};

export const companyCreateSchema = z.object(baseCompanyFields);

export const companyUpdateSchema = z.object({
  legal_name: baseCompanyFields.legal_name.optional(),
  trade_name: baseCompanyFields.trade_name,
  email: baseCompanyFields.email,
  phone: baseCompanyFields.phone,
  address: addressSchema.optional(),
  website: baseCompanyFields.website,
  description: baseCompanyFields.description,
  sector: baseCompanyFields.sector,
});

export type CompanyFormValues = z.infer<typeof companyCreateSchema>;

export function formatCnpj(value: string): string {
  const digits = stripNonDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCep(value: string): string {
  const digits = stripNonDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatPhone(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function normalizeAddress(values: CompanyFormValues["address"]) {
  if (!values) return null;
  return {
    postal_code: values.postal_code || null,
    street: values.street || null,
    number: values.number || null,
    complement: values.complement || null,
    neighborhood: values.neighborhood || null,
    city: values.city || null,
    state: values.state || null,
  };
}

export function normalizeCompanyPayload(values: CompanyFormValues) {
  return {
    legal_name: values.legal_name,
    trade_name: values.trade_name || null,
    tax_id: stripNonDigits(values.tax_id),
    email: values.email || null,
    phone: values.phone || null,
    address: normalizeAddress(values.address),
    country: values.country ?? "BR",
    website: values.website || null,
    description: values.description || null,
    sector: values.sector || null,
  };
}

export function normalizeCompanyUpdatePayload(values: CompanyFormValues) {
  return {
    legal_name: values.legal_name,
    trade_name: values.trade_name || null,
    email: values.email || null,
    phone: values.phone || null,
    address: normalizeAddress(values.address),
    website: values.website || null,
    description: values.description || null,
    sector: values.sector || null,
  };
}
