import { createClient as createSupabase, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { env } from "../env";
import type { Activity, Client, ContentItem, Delivery, EnqueueResult, GenerationJob, Lead, OutboxEmail } from "../types";
import type { Db } from "./types";

// Supabase adapter. Runs on the server only, with the service role key; row-level
// security in supabase/migrations keeps the anon key and other users out.

type OutboxRow = { id: string; to_email: string; from_email: string; subject: string; text_body: string; html_body: string; kind: string; created_at: string };

const VIDEO_BUCKET = "videos";

export function createSupabaseDb(): Db {
  const sb: SupabaseClient = createSupabase(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  function check<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new Error("Database error: " + res.error.message);
    return res.data;
  }

  const db: Db = {
    kind: "supabase",

    async listLeads(filter) {
      let q = sb.from("leads").select("*").order("created_at", { ascending: false });
      if (filter?.status) q = q.eq("status", filter.status);
      return check(await q) as Lead[];
    },
    async getLead(id) {
      return check(await sb.from("leads").select("*").eq("id", id).maybeSingle()) as Lead | null;
    },
    async createLead(input) {
      return check(await sb.from("leads").insert(input).select().single()) as Lead;
    },
    async updateLead(id, patch) {
      return check(await sb.from("leads").update(patch).eq("id", id).select().maybeSingle()) as Lead | null;
    },

    async listClients() {
      return check(await sb.from("clients").select("*").order("business_name")) as Client[];
    },
    async getClient(id) {
      return check(await sb.from("clients").select("*").eq("id", id).maybeSingle()) as Client | null;
    },
    async createClient(input) {
      return check(await sb.from("clients").insert(input).select().single()) as Client;
    },
    async updateClient(id, patch) {
      return check(await sb.from("clients").update(patch).eq("id", id).select().maybeSingle()) as Client | null;
    },

    async listJobs(filter) {
      let q = sb.from("generation_jobs").select("*").order("created_at", { ascending: false });
      if (filter?.clientId) q = q.eq("client_id", filter.clientId);
      if (filter?.week) q = q.eq("week", filter.week);
      if (filter?.batchId) q = q.eq("batch_id", filter.batchId);
      if (filter?.active) q = q.in("status", ["queued", "generating"]);
      if (filter?.limit) q = q.limit(filter.limit);
      return check(await q) as GenerationJob[];
    },
    async enqueueWeekJobs(requests, batchId) {
      const res = check(await sb.rpc("enqueue_week_jobs", { p_requests: requests, p_batch: batchId }));
      return res as EnqueueResult;
    },
    async enqueueItemJob(item, notes) {
      return check(await sb.rpc("enqueue_item_job", { p_item: item.id, p_notes: notes })) as GenerationJob | null;
    },
    async claimNextJob() {
      return check(await sb.rpc("claim_next_job")) as GenerationJob | null;
    },
    async updateJob(id, patch) {
      check(await sb.from("generation_jobs").update(patch).eq("id", id));
    },
    async requeueJob(id) {
      check(
        await sb
          .from("generation_jobs")
          .update({ status: "queued", error: null, started_at: null, finished_at: null, created_at: new Date().toISOString() })
          .eq("id", id)
          .eq("status", "failed"),
      );
    },

    async listItems(filter) {
      let q = sb.from("content_items").select("*").order("week", { ascending: false }).order("slot");
      if (filter?.clientId) q = q.eq("client_id", filter.clientId);
      if (filter?.week) q = q.eq("week", filter.week);
      if (filter?.reviewStatus) q = q.eq("review_status", filter.reviewStatus);
      return check(await q) as ContentItem[];
    },
    async getItem(id) {
      return check(await sb.from("content_items").select("*").eq("id", id).maybeSingle()) as ContentItem | null;
    },
    async replaceWeekItems(clientId, week, drafts) {
      check(await sb.from("content_items").delete().eq("client_id", clientId).eq("week", week));
      if (drafts.length === 0) return [];
      return check(await sb.from("content_items").insert(drafts).select()) as ContentItem[];
    },
    async updateItem(id, patch) {
      const full: Record<string, unknown> = { ...patch };
      if (patch.review_status === "approved") full.approved_at = new Date().toISOString();
      else if (patch.review_status) full.approved_at = null;
      return check(await sb.from("content_items").update(full).eq("id", id).select().maybeSingle()) as ContentItem | null;
    },

    async listDeliveries(filter) {
      let q = sb.from("deliveries").select("*").order("created_at", { ascending: false });
      if (filter?.clientId) q = q.eq("client_id", filter.clientId);
      if (filter?.week) q = q.eq("week", filter.week);
      return check(await q) as Delivery[];
    },
    async getDeliveryByToken(token) {
      return check(await sb.from("deliveries").select("*").eq("token", token).maybeSingle()) as Delivery | null;
    },
    async getOrCreateDelivery(clientId, week) {
      const token = randomBytes(24).toString("base64url");
      // Insert if missing; on conflict keep the existing row (and its token).
      check(
        await sb
          .from("deliveries")
          .upsert({ client_id: clientId, week, token }, { onConflict: "client_id,week", ignoreDuplicates: true }),
      );
      return check(await sb.from("deliveries").select("*").eq("client_id", clientId).eq("week", week).single()) as Delivery;
    },
    async updateDelivery(id, patch) {
      check(await sb.from("deliveries").update(patch).eq("id", id));
    },
    async recordOpen(id) {
      check(await sb.rpc("delivery_record_open", { p_id: id }));
    },
    async recordDownload(id, itemId) {
      check(await sb.rpc("delivery_record_download", { p_id: id, p_item: itemId }));
    },

    async addOutbox(email) {
      const row = check(
        await sb
          .from("email_outbox")
          .insert({ to_email: email.to, from_email: email.from, subject: email.subject, text_body: email.text, html_body: email.html, kind: email.kind })
          .select()
          .single(),
      ) as OutboxRow;
      return toOutbox(row);
    },
    async listOutbox(limit = 100) {
      const rows = check(await sb.from("email_outbox").select("*").order("created_at", { ascending: false }).limit(limit)) as OutboxRow[];
      return rows.map(toOutbox);
    },
    async logActivity(entry) {
      check(await sb.from("activity").insert(entry));
    },
    async listActivity(limit = 20) {
      return (check(await sb.from("activity").select("*").order("created_at", { ascending: false }).limit(limit)) || []) as Activity[];
    },

    async removeSampleData() {
      // Deleting sample clients cascades to their jobs, items, deliveries and activity.
      check(await sb.from("clients").delete().eq("sample", true));
      check(await sb.from("leads").delete().eq("sample", true));
    },

    async resolveMediaUrl(mediaUrl) {
      if (/^https?:\/\//.test(mediaUrl)) return mediaUrl;
      const path = mediaUrl.replace(/^videos\//, "");
      const { data, error } = await sb.storage.from(VIDEO_BUCKET).createSignedUrl(path, 60 * 60, { download: true });
      return error ? null : data.signedUrl;
    },
  };
  return db;
}

function toOutbox(r: OutboxRow): OutboxEmail {
  return { id: r.id, to: r.to_email, from: r.from_email, subject: r.subject, text: r.text_body, html: r.html_body, kind: r.kind, created_at: r.created_at };
}
