import type { LoginResponse, MeUser, MessageResponse, RegisterResponse } from "@/types/api";
import { api } from "@/services/api/client";

export const authService = {
  register(body: {
    full_name: string;
    email: string;
    password: string;
    password_confirm: string;
    phone?: string | null;
  }) {
    return api.post<RegisterResponse>("/auth/register", body);
  },

  verify(token: string) {
    return api.post<MessageResponse>("/auth/verify", { token });
  },

  resendVerification(email: string) {
    return api.post<MessageResponse>("/auth/resend-verification", { email });
  },

  login(idToken: string) {
    return api.post<LoginResponse>("/auth/login", { id_token: idToken }, {
      skipAuthRedirect: true,
    });
  },

  me() {
    return api.get<MeUser>("/auth/me", { auth: true });
  },

  logout() {
    return api.post<MessageResponse>("/auth/logout", undefined, { auth: true });
  },

  revokeAll() {
    return api.post<MessageResponse>("/auth/revoke-all", undefined, { auth: true });
  },
};
