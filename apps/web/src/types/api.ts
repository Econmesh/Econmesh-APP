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
  legal_representative?: string | null;
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
  legal_representative?: string | null;
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
  legal_representative?: string | null;
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
  matching?: OpportunityMatch | null;
}

export type MatchPotential = "HIGH" | "MEDIUM" | "LOW";

export interface MatchDetails {
  category: number;
  technical_detail: number;
  purity: number;
  physical_state: number;
  location: number;
  quantity: number;
  price: number;
}

export interface OpportunityMatch {
  score: number;
  potential: MatchPotential;
  details: MatchDetails;
  matched_demand: Opportunity;
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
  has_demands: boolean;
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

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  campaign_id?: string | null;
  kind?: "general" | "support" | "agreement";
  metadata?: Record<string, string>;
}

export type SupportTicketStatus = "open" | "in_progress" | "closed";

export type SupportMessageType = "user_message" | "admin_reply" | "internal_note";

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: number;
  subject: string;
  status: SupportTicketStatus;
  assigned_admin_id?: string | null;
  assigned_admin_name?: string | null;
  closed_by?: string | null;
  closed_at?: string | null;
  last_message_at?: string | null;
  last_responder_admin_id?: string | null;
  last_responder_admin_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  user_name?: string | null;
  user_email?: string | null;
  user_online?: boolean;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  author_role: "user" | "admin";
  author_name?: string | null;
  message_type: SupportMessageType;
  body: string;
  read_at?: string | null;
  created_at: string;
}

export interface SupportTicketListResponse {
  items: SupportTicket[];
  total: number;
  page: number;
  page_size: number;
}

export interface SupportMessageListResponse {
  items: SupportMessage[];
  total: number;
}

export interface UserNotificationListResponse {
  items: UserNotification[];
  total: number;
  page: number;
  page_size: number;
}

export interface UnreadCountResponse {
  count: number;
}

export type AgreementStatus =
  | "draft"
  | "awaiting_send"
  | "awaiting_signatures"
  | "partially_signed"
  | "signed"
  | "rejected"
  | "cancelled"
  | "expired";

export type SigningMode = "unordered" | "ordered";
export type ParticipantKind = "company" | "external";
export type ParticipantRole =
  | "sign"
  | "approve"
  | "witness"
  | "acknowledge"
  | "receipt";
export type ParticipantStatus = "pending" | "viewed" | "completed" | "rejected";
export type AgreementFieldType =
  | "signature"
  | "date"
  | "name"
  | "cpf"
  | "job_title"
  | "company"
  | "initials"
  | "text"
  | "checkbox";
export type AgreementFilter =
  | "all"
  | "signed"
  | "pending"
  | "mine"
  | "organization"
  | "company"
  | "rejected"
  | "expired";
export type AgreementSort = "newest" | "oldest" | "updated" | "title";

export interface AgreementFile {
  storage_key: string;
  url: string;
  sha256: string;
  filename: string;
  page_count: number;
  size_bytes?: number | null;
}

export interface AgreementParticipant {
  id: string;
  kind: ParticipantKind;
  user_id?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  name: string;
  email: string;
  cpf?: string | null;
  job_title?: string | null;
  role: ParticipantRole;
  order_index: number;
  status: ParticipantStatus;
  completed_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
}

export interface AgreementField {
  id: string;
  participant_id: string;
  field_type: AgreementFieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string | null;
}

export interface AgreementListItem {
  id: string;
  title: string;
  status: AgreementStatus;
  company_id: string;
  company_name: string;
  owner_user_id: string;
  signing_mode: SigningMode;
  deadline?: string | null;
  participants: AgreementParticipant[];
  signed_count: number;
  total_participants: number;
  progress_percent: number;
  verification_code: string;
  created_at: string;
  updated_at: string;
}

export interface Agreement extends AgreementListItem {
  description?: string | null;
  original_file?: AgreementFile | null;
  signed_file?: AgreementFile | null;
  audit_report_file?: AgreementFile | null;
  certificate_file?: AgreementFile | null;
  fields: AgreementField[];
}

export interface AgreementListResponse {
  items: AgreementListItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface AgreementListParams {
  q?: string;
  filter?: AgreementFilter;
  sort?: AgreementSort;
  company_id?: string;
  page?: number;
  page_size?: number;
}

export interface AgreementCreatePayload {
  title: string;
  description?: string | null;
  deadline?: string | null;
  company_id: string;
  signing_mode?: SigningMode;
}

export interface AgreementUpdatePayload {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  signing_mode?: SigningMode;
}

export interface ParticipantInput {
  kind: ParticipantKind;
  company_id?: string | null;
  company_name?: string | null;
  name: string;
  email: string;
  cpf?: string | null;
  job_title?: string | null;
  role: ParticipantRole;
  order_index: number;
}

export interface FieldInput {
  id?: string;
  participant_id: string;
  field_type: AgreementFieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string | null;
}

export interface TimelineEvent {
  id: string;
  agreement_id: string;
  event_type: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  actor_company_id?: string | null;
  actor_company_name?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  metadata: Record<string, string>;
  created_at: string;
}

export interface AgreementProgress {
  total_participants: number;
  completed: number;
  pending: number;
  rejected: number;
  viewed: number;
  progress_percent: number;
  pending_participants: AgreementParticipant[];
  rejected_participants: AgreementParticipant[];
  viewed_participants: AgreementParticipant[];
  completed_participants: AgreementParticipant[];
}

export interface CompanySearchItem {
  id: string;
  legal_name: string;
  trade_name?: string | null;
  tax_id: string;
  email?: string | null;
  phone?: string | null;
  legal_representative?: string | null;
  owner_user_id: string;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_cpf?: string | null;
  owner_job_title?: string | null;
}

export interface EligibilityResponse {
  eligible: boolean;
  missing: string[];
}

export interface DownloadUrlResponse {
  url: string;
  artifact: string;
}
