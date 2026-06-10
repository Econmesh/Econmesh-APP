import { z } from "zod";

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCpf(cpf: string): boolean {
  const digits = stripNonDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (slice: number) => {
    const nums = digits.slice(0, slice).split("").map(Number);
    const weights = Array.from({ length: slice }, (_, index) => slice + 1 - index);
    const sum = nums.reduce((acc, num, index) => acc + num * weights[index]!, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
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

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().email("E-mail inválido."),
  phone: z.string().trim().min(8, "Informe o telefone.").max(30),
  cpf: z
    .string()
    .trim()
    .min(11, "Informe o CPF.")
    .max(14)
    .refine(isValidCpf, "CPF inválido."),
  birth_date: z.string().trim().min(1, "Informe a data de nascimento."),
  job_title: z.string().trim().min(2, "Informe o cargo.").max(120),
  address: addressSchema,
  country: z.string().length(2).default("BR"),
});

export type ProfileFormValues = z.infer<typeof profileUpdateSchema>;

export function formatCpf(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatBirthDateForInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function normalizeProfilePayload(values: ProfileFormValues) {
  return {
    name: values.name,
    email: values.email,
    phone: stripNonDigits(values.phone) || null,
    cpf: stripNonDigits(values.cpf),
    birth_date: values.birth_date,
    job_title: values.job_title,
    country: values.country ?? "BR",
    address: {
      postal_code: values.address.postal_code || null,
      street: values.address.street || null,
      number: values.address.number || null,
      complement: values.address.complement || null,
      neighborhood: values.address.neighborhood || null,
      city: values.address.city || null,
      state: values.address.state || null,
    },
  };
}

export { formatCep, formatPhone } from "@/modules/companies/schemas";
