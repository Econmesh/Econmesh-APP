import { env } from "@econmesh-app/env/web";

/** Canonical app origin for Firebase email action links (must match Authorized domains). */
export function getAppOrigin(): string {
  const configured = env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3001";
}

export function getPasswordResetActionUrl(): string {
  return `${getAppOrigin()}/reset-password`;
}
