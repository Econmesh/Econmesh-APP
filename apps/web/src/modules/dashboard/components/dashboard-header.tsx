"use client";

import { Button } from "@econmesh-app/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@econmesh-app/ui/components/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";

function UserAvatar({
  name,
  email,
  picture,
}: {
  name: string | null;
  email: string | null;
  picture: string | null;
}) {
  if (picture) {
    return (
      <span className="relative block size-9 overflow-hidden rounded-full border border-border">
        <Image
          src={picture}
          alt={name ? `Foto de ${name}` : "Foto de perfil"}
          fill
          className="object-cover"
          unoptimized
        />
      </span>
    );
  }

  const initial = (name?.[0] ?? email?.[0] ?? "?").toUpperCase();
  return (
    <span
      className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
      aria-hidden
    >
      {initial}
    </span>
  );
}

export function DashboardHeader() {
  const { user, signOutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4 backdrop-blur-sm md:px-6">
      <div className="text-sm font-semibold md:hidden">Econmesh</div>
      <div className="flex-1" />
      <NotificationBell />
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-auto gap-3 px-2 py-1.5"
              aria-label="Menu da conta"
              aria-expanded={menuOpen}
            />
          }
        >
          <UserAvatar
            name={user?.name ?? null}
            email={user?.email ?? null}
            picture={user?.picture ?? null}
          />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none">{user?.name ?? "Usuário"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} withBackdrop className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/profile" />} onClick={() => setMenuOpen(false)}>
            <User className="size-4" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />} onClick={() => setMenuOpen(false)}>
            <Settings className="size-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setMenuOpen(false);
              void signOutUser();
            }}
          >
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
