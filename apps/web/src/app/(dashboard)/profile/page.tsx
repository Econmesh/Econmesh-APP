"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-app/ui/components/card";

import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Meu perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Nome: </span>
            {user.name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">E-mail: </span>
            {user.email ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Telefone: </span>
            {user.phone ?? "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
