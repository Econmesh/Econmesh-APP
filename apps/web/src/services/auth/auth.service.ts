import type { LoginResponse, MeUser, MessageResponse, RegisterResponse } from "@/types/api";
import { api } from "@/services/api/client";

export type RegisterCompanyPayload = {
  legal_name: string;
  trade_name?: string | null;
  tax_id: string;
  email: string;
  phone: string;
  address: {
    postal_code?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
  };
};

export const authService = {
  register(body: {
    full_name: string;
    email: string;
    password: string;
    password_confirm: string;
    phone?: string | null;
    company: RegisterCompanyPayload;
    operating_license: File;
    mtr?: File | null;
  }) {
    const formData = new FormData();
    formData.append(
      "payload",
      JSON.stringify({
        full_name: body.full_name,
        email: body.email,
        password: body.password,
        password_confirm: body.password_confirm,
        phone: body.phone ?? null,
        company: body.company,
      }),
    );
    formData.append("operating_license", body.operating_license);
    if (body.mtr) {
      formData.append("mtr", body.mtr);
    }
    return api.upload<RegisterResponse>("/auth/register", formData);
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
