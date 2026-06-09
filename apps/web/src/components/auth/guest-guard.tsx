"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { useAuth } from "@/hooks/use-auth";

export function GuestGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
}
