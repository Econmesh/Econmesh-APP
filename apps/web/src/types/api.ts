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

export interface CompanyAddress {
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface Company {
  id: string;
  owner_user_id: string;
  legal_name: string;
  trade_name?: string | null;
  tax_id: string;
  email?: string | null;
  phone?: string | null;
  address?: CompanyAddress | null;
  country: string;
  website?: string | null;
  description?: string | null;
  logo_storage_key?: string | null;
  logo_url?: string | null;
  sector?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreatePayload {
  legal_name: string;
  trade_name?: string | null;
  tax_id: string;
  email?: string | null;
  phone?: string | null;
  address?: CompanyAddress | null;
  country?: string;
  website?: string | null;
  description?: string | null;
  logo_storage_key?: string | null;
  logo_url?: string | null;
  sector?: string | null;
}

export interface CompanyUpdatePayload {
  legal_name?: string;
  trade_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: CompanyAddress | null;
  website?: string | null;
  description?: string | null;
  logo_storage_key?: string | null;
  logo_url?: string | null;
  sector?: string | null;
}

export interface LogoPresignResponse {
  upload_url: string;
  storage_key: string;
  public_url: string;
  expires_at: string;
}
