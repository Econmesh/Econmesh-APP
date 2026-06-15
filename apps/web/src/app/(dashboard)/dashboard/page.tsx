"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@econmesh-app/ui/components/card";
import { CheckCircle2, XCircle } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Área autenticada, Módulo em construção.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sua conta(para uso exclusivo do desenvolvimento)</CardTitle>
          <CardDescription>Dados sincronizados com a API Econmesh</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Nome</dt>
              <dd className="mt-1 text-sm font-medium">{user.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">E-mail</dt>
              <dd className="mt-1 text-sm font-medium">{user.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">UID Firebase</dt>
              <dd className="mt-1 break-all font-mono text-xs">{user.firebase_uid}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Papel</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {user.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">E-mail verificado</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm">
                {user.email_verified ? (
                  <>
                    <CheckCircle2 className="size-4 text-primary" aria-hidden />
                    Sim
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-destructive" aria-hidden />
                    Não
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Conta confirmada</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm">
                {user.is_verified ? (
                  <>
                    <CheckCircle2 className="size-4 text-primary" aria-hidden />
                    Sim
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-destructive" aria-hidden />
                    Pendente
                  </>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">Criada em</dt>
              <dd className="mt-1 text-sm">{formatDate(user.created_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
