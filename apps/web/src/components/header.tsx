"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Shield } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { ModeToggle } from "./mode-toggle";
import { Logo } from "./brand/logo";

export default function Header() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header className="border-b border-border/80 bg-card/30 backdrop-blur-md">
      <div className="container mx-auto flex flex-row items-center justify-between px-4 py-3">
        
          <Logo />
       
        <nav className="flex items-center gap-3" aria-label="Principal">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Início
          </Link>
          {!isLoading && isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : !isLoading ? (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Entrar
              </Link>
              <Link href="/register">
                <Button size="sm">Cadastrar</Button>
              </Link>
            </>
          ) : null}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
