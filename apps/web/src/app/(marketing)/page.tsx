"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@econmesh-app/ui/components/card";
import { env } from "@econmesh-app/env/web";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    fetch(`${base}/health`)
      .then((r) => (r.ok ? setApiStatus("ok") : setApiStatus("error")))
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-12 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2 text-primary">
            
            <span className="text-sm font-semibold uppercase tracking-widest">
              Infraestrutura &amp; Cibersegurança
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Econmesh</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Plataforma para gestão de oportunidades, acordos e operações com autenticação
            integrada Firebase + API.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="inline-flex">
            <Button>Criar conta</Button>
          </Link>
          <Link href="/login" className="inline-flex">
            <Button variant="outline">Entrar</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Status</CardTitle>
          <CardDescription>{env.NEXT_PUBLIC_API_URL}</CardDescription>
        </CardHeader>
        <CardContent>
          {apiStatus === "loading" ? (
            <p className="text-sm text-muted-foreground">Verificando…</p>
          ) : apiStatus === "ok" ? (
            <p className="text-sm text-primary">API online</p>
          ) : (
            <p className="text-sm text-destructive">API indisponível</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
