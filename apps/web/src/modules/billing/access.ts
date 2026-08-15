const LOCKED_PREFIXES = [
  "/dashboard/conversas",
  "/dashboard/acordos",
  "/dashboard/minutas",
] as const;

export function isSubscriptionLockedPath(pathname: string): boolean {
  if (LOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  if (pathname === "/dashboard/oportunidades/nova") {
    return true;
  }

  return /^\/dashboard\/oportunidades\/[^/]+/.test(pathname);
}
