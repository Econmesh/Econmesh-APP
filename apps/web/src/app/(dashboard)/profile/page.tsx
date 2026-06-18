"use client";

import { Button } from "@econmesh-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import { Loader2, Pencil, UserCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ProfileForm } from "@/modules/profile/components/profile-form";
import { ProfileView } from "@/modules/profile/components/profile-view";
import { profileService } from "@/services/profile/profile.service";
import type { UserProfile, UserProfileUpdatePayload } from "@/types/api";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await profileService.get();
      setProfile(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar o perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSave(payload: UserProfileUpdatePayload) {
    const updated = await profileService.update(payload);
    setProfile(updated);
    setEditing(false);
    await refreshProfile();
    toast.success("Perfil atualizado com sucesso.");
  }

  if (!user) return null;

  if (loading || !profile) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize e edite suas informações cadastradas.
          </p>
        </div>

        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden />
            Editar perfil
          </Button>
        ) : null}
      </div>

      {!profile.is_complete && !editing ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCircle className="size-5 text-primary" aria-hidden />
              <CardTitle className="text-base">Complete seu perfil</CardTitle>
            </div>
            <CardDescription>
              Algumas informações ainda não foram preenchidas. Complete seu cadastro para
              aproveitar todos os recursos da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" onClick={() => setEditing(true)}>
              Completar perfil
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {editing ? (
        <ProfileForm
          initialData={profile}
          onSubmit={handleSave}
          onPhotoUpdated={() => void loadProfile()}
          onCancel={() => setEditing(false)}
          submitLabel={profile.is_complete ? "Salvar alterações" : "Completar perfil"}
        />
      ) : (
        <ProfileView profile={profile} />
      )}
    </div>
  );
}
