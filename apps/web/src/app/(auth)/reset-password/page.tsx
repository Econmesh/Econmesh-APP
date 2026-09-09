"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

import { PageSkeleton } from "@/components/feedback/page-skeleton";

import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  AuthForm,
  FormField,
  FormInput,
  useFormErrors,
} from "@/modules/auth/components/auth-form";
import { resetPasswordSchema } from "@/utils/validation";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const [loading, setLoading] = useState(false);
  const { errors, setErrors, clear } = useFormErrors<"password" | "password_confirm">();

  const invalidMode = !!mode && mode !== "resetPassword";

  useEffect(() => {
    if (!oobCode || invalidMode) {
      return;
    }
    void signOut(getFirebaseAuth());
    void fetch("/api/auth/session", { method: "DELETE" });
  }, [oobCode, invalidMode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    clear();
    if (!oobCode) {
      toast.error("Link inválido. Solicite uma nova recuperação de senha.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const values = {
      password: String(form.get("password") ?? ""),
      password_confirm: String(form.get("password_confirm") ?? ""),
    };

    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<"password" | "password_confirm", string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "password" | "password_confirm";
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(oobCode, parsed.data.password);
      toast.success("Senha redefinida. Entre com a nova senha.");
      window.location.assign("/login");
      return;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  if (invalidMode || !oobCode) {
    return (
      <AuthShell title="Link inválido" subtitle="Solicite um novo e-mail de recuperação">
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Recuperar senha
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nova senha"
      subtitle="Defina uma senha forte para sua conta"
    >
      <AuthForm onSubmit={handleSubmit} submitLabel="Salvar senha" loading={loading}>
        <FormField id="password" label="Nova senha" error={errors.password}>
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
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
