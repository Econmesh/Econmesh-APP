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

export interface StorageUploadResponse {
  storage_key: string;
  public_url: string;
}

export interface ProfileAddress {
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  picture: string | null;
  picture_storage_key: string | null;
  cpf: string | null;
  birth_date: string | null;
  job_title: string | null;
  address: ProfileAddress | null;
  country: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdatePayload {
  name?: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  birth_date?: string | null;
  job_title?: string | null;
  address?: ProfileAddress | null;
  country?: string;
  picture_storage_key?: string | null;
  picture_url?: string | null;
}

export interface AvatarPresignResponse {
  upload_url: string;
  storage_key: string;
  public_url: string;
  expires_at: string;
}

export type OpportunityType = "comercializacao" | "simbiose_industrial" | "compartilhamento";

export type OfferDemand = "gerador" | "receptor";

export type OpportunityPeriodicity = "continua" | "esporadica";

export type OpportunitySort =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "quantity_desc";

export interface OpportunityImage {
  storage_key: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Opportunity {
  id: string;
  company_id: string;
  company_name: string;
  owner_user_id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  offer_demand: OfferDemand;
  category: string;
  technical_detail: string;
  purity_percent: number | null;
  physical_state: string;
  periodicity: OpportunityPeriodicity;
  quantity: number;
  unit: string;
  price: number | null;
  price_negotiable: boolean;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  images: OpportunityImage[];
  created_at: string;
  updated_at: string;
}

export interface OpportunityListParams {
  page?: number;
  page_size?: number;
  q?: string;
  opportunity_type?: OpportunityType;
  offer_demand?: OfferDemand;
  category?: string;
  state?: string;
  city?: string;
  periodicity?: OpportunityPeriodicity;
  price_min?: number;
  price_max?: number;
  quantity_min?: number;
  quantity_max?: number;
  sort?: OpportunitySort;
}

export interface OpportunityListResponse {
  items: Opportunity[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface OpportunityCreatePayload {
  company_id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  offer_demand: OfferDemand;
  category: string;
  technical_detail: string;
  purity_percent?: number | null;
  physical_state: string;
  periodicity: OpportunityPeriodicity;
  quantity: number;
  unit: string;
  price?: number | null;
  price_negotiable: boolean;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  images: OpportunityImage[];
}

export interface OpportunityUpdatePayload {
  title?: string;
  description?: string;
  opportunity_type?: OpportunityType;
  offer_demand?: OfferDemand;
  category?: string;
  technical_detail?: string;
  purity_percent?: number | null;
  physical_state?: string;
  periodicity?: OpportunityPeriodicity;
  quantity?: number;
  unit?: string;
  price?: number | null;
  price_negotiable?: boolean;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  images?: OpportunityImage[];
}

export interface OpportunityImagePresignResponse {
  upload_url: string;
  storage_key: string;
  public_url: string;
  expires_at: string;
}
