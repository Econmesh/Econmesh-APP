export const API_V1_PREFIX = "/api/v1";
export const AUTH_COOKIE_NAME = "econmesh_session";
export const PENDING_EMAIL_KEY = "econmesh_pending_email";

export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
] as const;

export const AUTH_ROUTES = [...PUBLIC_ROUTES] as const;
