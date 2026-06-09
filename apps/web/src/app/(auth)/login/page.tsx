"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import {
  AuthForm,
  FormField,
  FormInput,
  useFormErrors,
} from "@/modules/auth/components/auth-form";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, type LoginFormValues } from "@/utils/validation";

function LoginFormContent() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { errors, setErrors, clear } = useFormErrors<keyof LoginFormValues>();

  useEffect(() => {
    if (searchParams.get("reason") === "session_expired") {
      toast.warning("Sua sessão expirou. Entre novamente.");
    }
    const redirect = searchParams.get("redirect");
    if (redirect?.startsWith("/dashboard")) {
      /* middleware already handled */
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    clear();
    const form = new FormData(event.currentTarget);
    const values = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LoginFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LoginFormValues;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      const redirect = searchParams.get("redirect");
      if (redirect?.startsWith("/")) {
        router.replace(redirect as Route);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta Econmesh">
      <AuthForm onSubmit={handleSubmit} submitLabel="Entrar" loading={loading}>
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
            autoComplete="current-password"
            required
            aria-invalid={!!errors.password}
          />
        </FormField>
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </AuthForm>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LoginFormContent />
    </Suspense>
  );
}
