"use client";

import { Button, buttonVariants } from "@econmesh-app/ui/components/button";
import { cn } from "@econmesh-app/ui/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@econmesh-app/ui/components/card";
import { MailCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/utils/errors";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyAccount, resendVerification } = useAuth();
  const email =
    searchParams.get("email") ??
    (typeof window !== "undefined"
      ? sessionStorage.getItem("econmesh_pending_email")
      : null) ??
    "";
  const tokenParam = searchParams.get("token");
  const [verifying, setVerifying] = useState(!!tokenParam);
  const [resending, setResending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const runVerify = useCallback(
    async (token: string) => {
      setVerifying(true);
      try {
        await verifyAccount(token);
        setConfirmed(true);
        toast.success("Conta confirmada! Redirecionando para o login…");
        window.setTimeout(() => router.replace("/login"), 2500);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Falha na confirmação.");
      } finally {
        setVerifying(false);
      }
    },
    [verifyAccount, router],
  );

  useEffect(() => {
    if (tokenParam) {
      void runVerify(tokenParam);
      return;
    }

    const devToken = sessionStorage.getItem("econmesh_dev_verification_token");
    if (devToken && process.env.NODE_ENV === "development") {
      void runVerify(devToken);
    }
  }, [tokenParam, runVerify]);

  async function handleResend() {
    if (!email) {
      toast.error("Informe o e-mail usado no cadastro.");
      return;
    }
    setResending(true);
    try {
      await resendVerification(email);
      toast.success("Se o e-mail existir, enviamos um novo link de confirmação.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível reenviar.");
    } finally {
      setResending(false);
    }
  }

  if (verifying && !confirmed) {
    return (
      <AuthShell title="Confirmando conta" subtitle="Aguarde enquanto validamos seu link">
        <PageSkeleton />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={confirmed ? "Conta confirmada" : "Confirme seu e-mail"}
      subtitle={
        confirmed
          ? "Você já pode fazer login."
          : email
            ? `Enviamos um link para ${email}`
            : "Verifique sua caixa de entrada"
      }
    >
      <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="size-6 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-lg">
            {confirmed ? "Tudo certo!" : "E-mail de confirmação"}
          </CardTitle>
          <CardDescription>
            {confirmed
              ? "Redirecionando para a página de login."
              : "Abra o link no e-mail ou use o botão abaixo para reenviar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!confirmed ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resending || !email}
              onClick={() => void handleResend()}
            >
              <RefreshCw
                className={`size-4 ${resending ? "animate-spin" : ""}`}
                aria-hidden
              />
              Reenviar e-mail
            </Button>
          ) : null}
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: confirmed ? "default" : "ghost" }),
              "inline-flex w-full justify-center",
            )}
          >
            Ir para login
          </Link>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
