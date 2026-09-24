import type {
  Activity,
  Client,
  ClientInput,
  ContentItem,
  Delivery,
  EnqueueResult,
  GenerationJob,
  Lead,
  LeadStatus,
  OutboxEmail,
} from "../types";

export type NewLead = Omit<Lead, "id" | "created_at" | "updated_at" | "status" | "client_id" | "sample">;
export type NewItem = Omit<ContentItem, "id" | "created_at" | "updated_at" | "approved_at" | "sample">;
export type JobRequest = { client_id: string; week: string; regenerate: boolean };

/**
 * The console's data layer. Two adapters implement it:
 * - demo: a JSON file in DATA_DIR (default console/.data), used when Supabase is not configured
 * - supabase: Postgres tables from supabase/migrations, used when the SUPABASE_* variables are set
 */
export interface Db {
  readonly kind: "demo" | "supabase";

  // Leads (website form inbox)
  listLeads(filter?: { status?: LeadStatus }): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | null>;
  createLead(input: NewLead): Promise<Lead>;
  updateLead(id: string, patch: Partial<Pick<Lead, "status" | "client_id">>): Promise<Lead | null>;

  // Clients
  listClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  createClient(input: ClientInput): Promise<Client>;
  updateClient(id: string, patch: Partial<ClientInput>): Promise<Client | null>;

  // Generation jobs
  listJobs(filter?: { clientId?: string; week?: string; batchId?: string; active?: boolean; limit?: number }): Promise<GenerationJob[]>;
  /**
   * Queues one "week" job per request, atomically skipping clients that already
   * have drafts for that week (unless regenerate) or a job in progress.
   */
  enqueueWeekJobs(requests: JobRequest[], batchId: string): Promise<EnqueueResult>;
  /** Queues an "item" job that redoes one item with the owner's notes. Returns null if one is already queued. */
  enqueueItemJob(item: ContentItem, notes: string): Promise<GenerationJob | null>;
  /** Atomically moves the oldest queued job (or a stale generating one) to "generating" and returns it. */
  claimNextJob(): Promise<GenerationJob | null>;
  updateJob(id: string, patch: Partial<Pick<GenerationJob, "status" | "error" | "finished_at">>): Promise<void>;
  requeueJob(id: string): Promise<void>;

  // Content items
  listItems(filter?: { clientId?: string; week?: string; reviewStatus?: ContentItem["review_status"] }): Promise<ContentItem[]>;
  getItem(id: string): Promise<ContentItem | null>;
  /** Replaces all items of a client's week with the given drafts. */
  replaceWeekItems(clientId: string, week: string, items: NewItem[]): Promise<ContentItem[]>;
  updateItem(id: string, patch: Partial<Omit<ContentItem, "id" | "client_id" | "week" | "created_at">>): Promise<ContentItem | null>;

  // Deliveries
  listDeliveries(filter?: { clientId?: string; week?: string }): Promise<Delivery[]>;
  getDeliveryByToken(token: string): Promise<Delivery | null>;
  getOrCreateDelivery(clientId: string, week: string): Promise<Delivery>;
  updateDelivery(id: string, patch: Partial<Pick<Delivery, "sent_at" | "sent_to">>): Promise<void>;
  recordOpen(id: string): Promise<void>;
  recordDownload(id: string, itemId: string): Promise<void>;

  // Email outbox (demo email) and activity log
  addOutbox(email: Omit<OutboxEmail, "id" | "created_at">): Promise<OutboxEmail>;
  listOutbox(limit?: number): Promise<OutboxEmail[]>;
  logActivity(entry: Omit<Activity, "id" | "created_at">): Promise<void>;
  listActivity(limit?: number): Promise<Activity[]>;

  /** Removes every record marked as sample data. */
  removeSampleData(): Promise<void>;

  /** Turns a stored media reference into a URL a client can download (e.g. a signed storage URL). */
  resolveMediaUrl(mediaUrl: string): Promise<string | null>;
}
