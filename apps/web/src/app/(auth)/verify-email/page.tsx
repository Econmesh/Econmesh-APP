"use client";

import { Button, buttonVariants } from "@econmesh-app/ui/components/button";
import { cn } from "@econmesh-app/ui/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import { Input } from "@econmesh-app/ui/components/input";
import { CheckCircle2, MailCheck, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/utils/errors";

const REDIRECT_SECONDS = 5;
const VERIFIED_TOKEN_KEY_PREFIX = "econmesh_verified_token:";

/** Deduplicates verify requests across React Strict Mode remounts. */
const verificationPromises = new Map<string, Promise<void>>();
const verifiedTokens = new Set<string>();

function isTokenVerifiedInSession(token: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(`${VERIFIED_TOKEN_KEY_PREFIX}${token}`) === "1";
}

function isTokenVerified(token: string): boolean {
  return verifiedTokens.has(token) || isTokenVerifiedInSession(token);
}

function markTokenVerified(token: string): void {
  verifiedTokens.add(token);
  sessionStorage.setItem(`${VERIFIED_TOKEN_KEY_PREFIX}${token}`, "1");
}

function isBenignVerificationError(error: unknown, token: string): boolean {
  if (!(error instanceof ApiError)) return false;
  if (!["verification_token_used", "invalid_verification_token"].includes(error.code)) {
    return false;
  }
  return isTokenVerified(token);
}

async function verifyTokenOnce(
  token: string,
  verifyAccount: (token: string) => Promise<void>,
): Promise<void> {
  if (isTokenVerified(token)) return;

  if (!verificationPromises.has(token)) {
    const promise = (async () => {
      try {
        await verifyAccount(token);
        markTokenVerified(token);
      } catch (error) {
        if (error instanceof ApiError && error.code === "verification_token_used") {
          markTokenVerified(token);
          return;
        }
        if (isBenignVerificationError(error, token)) {
          return;
        }
        throw error;
      } finally {
        verificationPromises.delete(token);
      }
    })();

    verificationPromises.set(token, promise);
  }

  await verificationPromises.get(token)!;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyAccount, resendVerification } = useAuth();
  const emailFromQuery = searchParams.get("email") ?? "";
  const tokenParam = searchParams.get("token");

  const [email, setEmail] = useState(emailFromQuery);
  const tokenAlreadyVerified = !!tokenParam && isTokenVerified(tokenParam);
  const [verifying, setVerifying] = useState(
    !!tokenParam && !tokenAlreadyVerified,
  );
  const [resending, setResending] = useState(false);
  const [confirmed, setConfirmed] = useState(tokenAlreadyVerified);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const verifyEffectRanRef = useRef(false);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
      return;
    }
    const stored = sessionStorage.getItem("econmesh_pending_email");
    if (stored) setEmail(stored);
  }, [emailFromQuery]);

  const runVerify = useCallback(
    async (token: string) => {
      setVerifying(true);
      setVerifyError(null);

      try {
        await verifyTokenOnce(token, verifyAccount);
        setVerifyError(null);
        setConfirmed(true);
        setCountdown(REDIRECT_SECONDS);
      } catch (error) {
        if (isTokenVerified(token)) {
          setVerifyError(null);
          setConfirmed(true);
          setCountdown(REDIRECT_SECONDS);
          return;
        }
        setVerifyError(
          error instanceof ApiError
            ? error.message
            : "Não foi possível confirmar seu e-mail. Tente novamente.",
        );
      } finally {
        setVerifying(false);
      }
    },
    [verifyAccount],
  );

  useEffect(() => {
    if (!tokenParam) return;
    if (verifyEffectRanRef.current) return;
    verifyEffectRanRef.current = true;
    void runVerify(tokenParam);
  }, [tokenParam, runVerify]);

  useEffect(() => {
    if (!confirmed) return;

    if (countdown <= 0) {
      router.replace("/login");
      return;
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [confirmed, countdown, router]);

  async function handleResend() {
    const targetEmail = email.trim();
    if (!targetEmail) {
      toast.error("Informe o e-mail usado no cadastro.");
      return;
    }
    setResending(true);
    try {
      await resendVerification(targetEmail);
      toast.success("Se o e-mail existir, enviamos um novo link de confirmação.");
      setVerifyError(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível reenviar.");
    } finally {
      setResending(false);
    }
  }

  if (verifying && !confirmed && !verifyError) {
    return (
      <AuthShell title="Confirmando conta" subtitle="Aguarde enquanto validamos seu link">
        <PageSkeleton />
      </AuthShell>
    );
  }

  if (confirmed) {
    return (
      <AuthShell
        title="E-mail confirmado com sucesso!"
        subtitle="Sua conta foi ativada e já está pronta para uso."
      >
        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div
              className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-emerald-500/15 animate-in zoom-in-50 duration-500"
              aria-hidden
            >
              <CheckCircle2 className="size-9 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-lg">Conta ativada</CardTitle>
            <CardDescription className="text-balance">
              Você será redirecionado para a tela de login em{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {countdown}
              </span>{" "}
              {countdown === 1 ? "segundo" : "segundos"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full"
              onClick={() => router.replace("/login")}
            >
              Ir para Login agora
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  if (verifyError) {
    return (
      <AuthShell
        title="Não foi possível confirmar"
        subtitle="O link pode ter expirado ou já ter sido utilizado."
      >
        <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div
              className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10"
              aria-hidden
            >
              <XCircle className="size-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">Falha na confirmação</CardTitle>
            <CardDescription>{verifyError}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="space-y-2">
              <label htmlFor="resend-email" className="text-sm font-medium">
                E-mail da conta
              </label>
              <Input
                id="resend-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resending}
              onClick={() => void handleResend()}
            >
              <RefreshCw
                className={cn("size-4", resending && "animate-spin")}
                aria-hidden
              />
              Reenviar e-mail de confirmação
            </Button>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost" }),
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

  return (
    <AuthShell
      title="Confirme seu e-mail"
      subtitle={
        email
          ? `Enviamos um link para ${email}`
          : "Verifique sua caixa de entrada"
      }
    >
      <Card className="border-border/80 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="size-6 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-lg">E-mail de confirmação</CardTitle>
          <CardDescription>
            Abra o link no e-mail ou use o botão abaixo para reenviar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resending || !email}
            onClick={() => void handleResend()}
          >
            <RefreshCw
              className={cn("size-4", resending && "animate-spin")}
              aria-hidden
            />
            Reenviar e-mail
          </Button>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
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
