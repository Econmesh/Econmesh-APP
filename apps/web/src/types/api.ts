export type Role = "admin" | "operator" | "analyst" | "viewer" | "service";

export interface ApiErrorBody {
  code: string;
  message: string;
  request_id?: string | null;
  details?: Record<string, unknown> | null;
}

export interface MeUser {
  id: string;
  firebase_uid: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  picture: string | null;
  email_verified: boolean;
  is_verified: boolean;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface RegisterResponse {
  user: MeUser;
  message: string;
  verification_token?: string | null;
}

export interface LoginResponse {
  user: MeUser;
  token: {
    uid: string;
    issuer: string | null;
    audience: string | null;
    expires_at: number | null;
    issued_at: number | null;
    email_verified: boolean;
  };
}

export interface MessageResponse {
  message: string;
  data?: Record<string, unknown> | null;
}
