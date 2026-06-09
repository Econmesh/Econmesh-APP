"use client";

import { useSyncExternalStore } from "react";

import { useAuthContext } from "@/contexts/auth-context";
import { authStore } from "@/stores/auth-store";

export function useAuth() {
  const context = useAuthContext();
  const snapshot = useSyncExternalStore(
    authStore.subscribe,
    authStore.getState,
    authStore.getState,
  );

  return {
    ...context,
    status: snapshot.status,
    user: snapshot.user,
    isAuthenticated: snapshot.status === "authenticated",
    isLoading: snapshot.status === "loading" || snapshot.status === "idle",
  };
}
