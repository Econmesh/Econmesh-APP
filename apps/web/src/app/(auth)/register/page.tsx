"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";
import {
  AuthForm,
  FormField,
  FormInput,
  useFormErrors,
} from "@/modules/auth/components/auth-form";
import { ApiError, getValidationFieldErrors } from "@/utils/errors";
import { registerSchema, type RegisterFormValues } from "@/utils/validation";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { errors, setErrors, clear } = useFormErrors<keyof RegisterFormValues>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    clear();
    const form = new FormData(event.currentTarget);
    const values = {
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      password_confirm: String(form.get("password_confirm") ?? ""),
    };

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof RegisterFormValues;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await signUp(parsed.data);
      toast.success(response.message);
      router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "validation_error") {
          setErrors(getValidationFieldErrors(error.details) as Partial<
            Record<keyof RegisterFormValues, string>
          >);
        }
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Falha no cadastro.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Criar conta" subtitle="Cadastro de usuário padrão (viewer)">
      <AuthForm onSubmit={handleSubmit} submitLabel="Cadastrar" loading={loading}>
        <FormField id="full_name" label="Nome completo" error={errors.full_name}>
          <FormInput
            id="full_name"
            name="full_name"
            autoComplete="name"
            required
            aria-invalid={!!errors.full_name}
          />
        </FormField>
        <FormField id="email" label="E-mail" error={errors.email}>
          <FormInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!errors.email}
          />
        </FormField>
        <FormField id="password" label="Senha" error={errors.password}>
          <FormInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={!!errors.password}
          />
        </FormField>
        <FormField
          id="password_confirm"
          label="Confirmar senha"
          error={errors.password_confirm}
        >
          <FormInput
            id="password_confirm"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={!!errors.password_confirm}
          />
        </FormField>
      </AuthForm>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
