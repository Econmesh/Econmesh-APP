"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const { resetPassword } = useAuth();
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!oobCode);
  const [verifyError, setVerifyError] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const { errors, setErrors, clear } = useFormErrors<"password" | "password_confirm">();

  const invalidMode = !!mode && mode !== "resetPassword";

  useEffect(() => {
    if (!oobCode || invalidMode) {
      setVerifying(false);
      return;
    }

    void signOut(getFirebaseAuth());
    void fetch("/api/auth/session", { method: "DELETE" });

    let cancelled = false;
    void (async () => {
      try {
        const { verifyPasswordResetCode } = await import("firebase/auth");
        const email = await verifyPasswordResetCode(getFirebaseAuth(), oobCode);
        if (!cancelled) setAccountEmail(email);
      } catch {
        if (!cancelled) {
          setVerifyError(true);
          toast.error("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
      toast.success("Senha redefinida com sucesso!");
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  if (invalidMode || !oobCode || verifyError) {
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

  if (verifying) {
    return (
      <AuthShell title="Validando link" subtitle="Aguarde um momento">
        <PageSkeleton />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nova senha"
      subtitle={
        accountEmail
          ? `Defina uma nova senha para ${accountEmail}`
          : "Defina uma senha forte para sua conta"
      }
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
