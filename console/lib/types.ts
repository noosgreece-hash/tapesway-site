// Shared data shapes. Column names match the SQL in supabase/migrations.

export const LEAD_STATUSES = ["new", "contacted", "proposal", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LANGS = ["EN", "DE", "FR", "EL"] as const;
export type Lang = (typeof LANGS)[number];

export const CLIENT_STATUSES = ["active", "paused"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export type JobStatus = "queued" | "generating" | "ready" | "failed";
export type JobKind = "week" | "item";

export type ReviewStatus = "pending" | "approved" | "changes_requested";
export type AiVerdict = "green" | "yellow" | "red";

export interface Lead {
  id: string;
  name: string;
  business: string;
  email: string;
  island: string;
  business_type: string;
  message: string;
  source: string;
  status: LeadStatus;
  client_id: string | null;
  sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  island: string;
  business_type: string;
  languages: Lang[];
  tone_of_voice: string;
  audience: string;
  dos: string;
  donts: string;
  links: string[];
  plan: string;
  status: ClientStatus;
  notes: string;
  created_from_lead: string | null;
  sample: boolean;
  created_at: string;
  updated_at: string;
}

export type ClientInput = Omit<Client, "id" | "created_at" | "updated_at" | "sample"> & { sample?: boolean };

export interface GenerationJob {
  id: string;
  client_id: string;
  week: string; // ISO week, e.g. "2026-W39"
  kind: JobKind; // "week": draft the whole week; "item": redo one item with the owner's notes
  item_id: string | null;
  notes: string | null;
  regenerate: boolean;
  batch_id: string | null;
  status: JobStatus;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface ContentItem {
  id: string;
  client_id: string;
  week: string;
  job_id: string | null;
  kind: "video";
  slot: number; // 1..n within the week
  title: string;
  script: string;
  captions: Partial<Record<Lang, string>>; // one caption per client language
  hashtags: string[];
  media_url: string | null; // null until a real video file exists
  review_status: ReviewStatus;
  review_notes: string | null;
  ai_verdict: AiVerdict | null; // phase 2: AI reviewer
  ai_notes: string | null;
  version: number;
  sample: boolean;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

export interface DownloadEvent {
  item_id: string;
  at: string;
}

export interface Delivery {
  id: string;
  client_id: string;
  week: string;
  token: string;
  sent_at: string | null;
  sent_to: string | null;
  opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  downloads: DownloadEvent[];
  sample: boolean;
  created_at: string;
}

export interface OutboxEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  kind: string;
  created_at: string;
}

export interface Activity {
  id: string;
  kind: string;
  message: string;
  client_id: string | null;
  lead_id: string | null;
  created_at: string;
}

export interface EnqueueResult {
  created: GenerationJob[];
  skipped: { client_id: string; reason: "already_generated" | "in_progress" | "paused" | "missing" }[];
}
