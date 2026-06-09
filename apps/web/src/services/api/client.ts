import { env } from "@econmesh-app/env/web";

import { API_V1_PREFIX } from "@/lib/constants";
import type { ApiErrorBody } from "@/types/api";
import { ApiError } from "@/utils/errors";

export type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export function setApiUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

function buildUrl(path: string): string {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  skipAuthRedirect?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = false, skipAuthRedirect = false, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth && tokenProvider) {
    const token = await tokenProvider();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    const errorBody: ApiErrorBody =
      payload && typeof payload === "object" && "code" in payload
        ? (payload as ApiErrorBody)
        : {
            code: "unknown_error",
            message: response.statusText || "Request failed",
          };

    if (
      !skipAuthRedirect &&
      response.status === 401 &&
      onUnauthorized &&
      ["missing_token", "token_expired", "token_revoked", "token_invalid"].includes(
        errorBody.code,
      )
    ) {
      onUnauthorized();
    }

    throw new ApiError(response.status, errorBody);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(`${API_V1_PREFIX}${path}`, { ...options, method: "GET" }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => apiRequest<T>(`${API_V1_PREFIX}${path}`, { ...options, method: "POST", body }),
};
