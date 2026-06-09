import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Mínimo de 8 caracteres.")
  .max(128, "Máximo de 128 caracteres.")
  .regex(/[a-z]/, "Inclua ao menos uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua ao menos um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua ao menos um caractere especial.");

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Nome deve ter pelo menos 2 caracteres.")
      .max(120, "Nome muito longo."),
    email: z.string().email("E-mail inválido."),
    password: passwordSchema,
    password_confirm: z.string().min(1, "Confirme a senha."),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "As senhas não coincidem.",
    path: ["password_confirm"],
  });

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    password_confirm: z.string().min(1, "Confirme a senha."),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "As senhas não coincidem.",
    path: ["password_confirm"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
