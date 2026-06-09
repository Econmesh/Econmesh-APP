"use client";

import Link from "next/link";
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
import { forgotPasswordSchema } from "@/utils/validation";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { errors, setErrors, clear } = useFormErrors<"email">();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    clear();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors({ email: parsed.error.issues[0]?.message });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(parsed.data.email);
      setSent(true);
      toast.success("Se o e-mail existir, enviamos instruções de recuperação.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle={
        sent
          ? "Verifique sua caixa de entrada e o spam."
          : "Informe o e-mail da sua conta"
      }
    >
      {sent ? (
        <p className="rounded-xl border border-border bg-card/80 p-6 text-center text-sm text-muted-foreground">
          Link enviado via Firebase Auth. Siga as instruções no e-mail.
        </p>
      ) : (
        <AuthForm onSubmit={handleSubmit} submitLabel="Enviar link" loading={loading}>
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
        </AuthForm>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </AuthShell>
  );
}
