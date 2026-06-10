"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import { User } from "lucide-react";
import Image from "next/image";

import { formatCep, formatCpf, formatPhone } from "@/modules/profile/schemas";
import type { UserProfile } from "@/types/api";

type ProfileViewProps = {
  profile: UserProfile;
};

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

function formatBirthDate(value: string | null): string | null {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const address = profile.address;

  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>Informações básicas da sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative size-20 overflow-hidden rounded-full border border-border bg-muted">
              {profile.picture ? (
                <Image
                  src={profile.picture}
                  alt={profile.name ? `Foto de ${profile.name}` : "Foto de perfil"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <User className="size-8 text-muted-foreground" aria-hidden />
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">{profile.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{profile.email ?? "—"}</p>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Nome" value={profile.name} />
            <DetailItem label="E-mail" value={profile.email} />
            <DetailItem
              label="CPF"
              value={profile.cpf ? formatCpf(profile.cpf) : null}
            />
            <DetailItem
              label="Data de nascimento"
              value={formatBirthDate(profile.birth_date)}
            />
            <DetailItem
              label="Telefone"
              value={profile.phone ? formatPhone(profile.phone) : null}
            />
            <DetailItem label="Cargo" value={profile.job_title} />
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
          <CardDescription>Localização cadastrada.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem
              label="CEP"
              value={address?.postal_code ? formatCep(address.postal_code) : null}
            />
            <DetailItem label="Rua" value={address?.street} />
            <DetailItem label="Número" value={address?.number} />
            <DetailItem label="Complemento" value={address?.complement} />
            <DetailItem label="Bairro" value={address?.neighborhood} />
            <DetailItem label="Cidade" value={address?.city} />
            <DetailItem label="Estado" value={address?.state} />
            <DetailItem label="País" value={profile.country} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
