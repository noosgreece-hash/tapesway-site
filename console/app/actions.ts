"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { weeklyPackEmail } from "@/lib/emails";
import { enqueueWeek, processQueue } from "@/lib/jobs";
import { getMailer } from "@/lib/mailer";
import { t } from "@/lib/strings";
import { CLIENT_STATUSES, LANGS, LEAD_STATUSES, type ClientInput, type Lang, type LeadStatus } from "@/lib/types";
import { baseUrl } from "@/lib/url";
import { isWeek } from "@/lib/week";

// Every action checks the owner first; the proxy has already checked too.

const str = (fd: FormData, key: string, max = 2000) => String(fd.get(key) ?? "").trim().slice(0, max);

function refreshAll() {
  revalidatePath("/", "layout");
}

function kickQueue() {
  after(async () => {
    try {
      await processQueue(25000);
    } catch (err) {
      console.error("[jobs] background processing failed", err);
    }
  });
}

// ---------- leads ----------

export async function updateLeadStatus(fd: FormData) {
  await requireOwner();
  const id = str(fd, "id");
  const status = str(fd, "status") as LeadStatus;
  if (!LEAD_STATUSES.includes(status)) return;
  const lead = await getDb().updateLead(id, { status });
  if (lead) {
    await getDb().logActivity({ kind: "lead_status", message: `Lead ${lead.name} marked ${t.leads.statuses[status].toLowerCase()}`, client_id: null, lead_id: id });
  }
  refreshAll();
  redirect(`/leads/${id}?notice=lead_status`);
}

// ---------- clients ----------

export type ClientFormState = { errors: Record<string, string>; values: Record<string, string | string[]> } | null;

export async function saveClient(_prev: ClientFormState, fd: FormData): Promise<ClientFormState> {
  await requireOwner();
  const db = getDb();
  const id = str(fd, "id");
  const languages = fd.getAll("languages").map(String).filter((l): l is Lang => (LANGS as readonly string[]).includes(l));
  const status = str(fd, "status") as ClientInput["status"];
  const input: ClientInput = {
    business_name: str(fd, "business_name", 160),
    contact_name: str(fd, "contact_name", 120),
    email: str(fd, "email", 200).toLowerCase(),
    phone: str(fd, "phone", 60),
    island: str(fd, "island", 80),
    business_type: str(fd, "business_type", 120),
    languages,
    tone_of_voice: str(fd, "tone_of_voice", 500),
    audience: str(fd, "audience", 500),
    dos: str(fd, "dos", 2000),
    donts: str(fd, "donts", 2000),
    links: str(fd, "links", 3000)
      .split(/\s*\n\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20),
    plan: str(fd, "plan", 120),
    status: CLIENT_STATUSES.includes(status) ? status : "active",
    notes: str(fd, "notes", 5000),
    created_from_lead: str(fd, "created_from_lead") || null,
  };

  const errors: Record<string, string> = {};
  if (!input.business_name) errors.business_name = t.clients.form.required;
  if (!input.email) errors.email = t.clients.form.required;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email)) errors.email = t.clients.form.invalidEmail;
  if (input.languages.length === 0) errors.languages = t.clients.form.needLanguage;
  if (Object.keys(errors).length) {
    const values: Record<string, string | string[]> = {};
    fd.forEach((v, k) => {
      if (typeof v !== "string" || k.startsWith("$")) return;
      if (k === "languages") values.languages = [...((values.languages as string[]) || []), v];
      else values[k] = v;
    });
    return { errors, values };
  }

  let clientId = id;
  if (id) {
    const { created_from_lead: _ignored, ...patch } = input;
    void _ignored;
    const updated = await db.updateClient(id, patch);
    if (!updated) return { errors: { form: t.errors.notFound }, values: {} };
    await db.logActivity({ kind: "client", message: `Client details updated: ${updated.business_name}`, client_id: id, lead_id: null });
  } else {
    const created = await db.createClient(input);
    clientId = created.id;
    if (input.created_from_lead) {
      await db.updateLead(input.created_from_lead, { status: "won", client_id: created.id });
    }
    await db.logActivity({
      kind: "client",
      message: `Client added: ${created.business_name}${input.created_from_lead ? " (from a lead)" : ""}`,
      client_id: created.id,
      lead_id: input.created_from_lead,
    });
  }
  refreshAll();
  redirect(`/clients/${clientId}?notice=${id ? "client_saved" : "client_created"}`);
}

// ---------- generation ----------

export async function generateWeekAction(clientIds: string[], week: string, regenerate: boolean) {
  await requireOwner();
  if (!isWeek(week)) throw new Error("Bad week");
  const ids = Array.isArray(clientIds) ? clientIds.filter((x) => typeof x === "string").slice(0, 1000) : [];
  if (ids.length === 0) redirect("/clients?error=nothing_selected");
  const result = await enqueueWeek(ids, week, Boolean(regenerate));
  if (result.created.length) kickQueue();
  refreshAll();
  const count = (r: string) => result.skipped.filter((s) => s.reason === r).length;
  const q = new URLSearchParams({
    batch: result.batchId,
    queued: String(result.created.length),
    s_generated: String(count("already_generated")),
    s_progress: String(count("in_progress")),
    s_paused: String(count("paused")),
  });
  redirect(`/jobs?${q}`);
}

export async function generateForClient(fd: FormData) {
  await generateWeekAction([str(fd, "client_id")], str(fd, "week"), str(fd, "regenerate") === "1");
}

export async function retryJob(fd: FormData) {
  await requireOwner();
  await getDb().requeueJob(str(fd, "id"));
  kickQueue();
  refreshAll();
}

// ---------- review ----------

export async function approveItem(fd: FormData) {
  await requireOwner();
  const db = getDb();
  const item = await db.getItem(str(fd, "id"));
  if (!item || item.review_status !== "pending") return;
  await db.updateItem(item.id, { review_status: "approved" });
  refreshAll();
}

export async function approveAllForClient(fd: FormData) {
  await requireOwner();
  const db = getDb();
  const clientId = str(fd, "client_id");
  const week = str(fd, "week");
  const items = await db.listItems({ clientId, week, reviewStatus: "pending" });
  for (const item of items) await db.updateItem(item.id, { review_status: "approved" });
  const client = await db.getClient(clientId);
  if (client && items.length) {
    await db.logActivity({ kind: "approved", message: `Approved ${items.length} item${items.length === 1 ? "" : "s"}: ${client.business_name} (${week})`, client_id: clientId, lead_id: null });
  }
  refreshAll();
}

export async function requestChanges(fd: FormData) {
  await requireOwner();
  const db = getDb();
  const notes = str(fd, "notes", 2000);
  const item = await db.getItem(str(fd, "id"));
  if (!item || !notes) return;
  await db.updateItem(item.id, { review_status: "changes_requested", review_notes: notes });
  await db.enqueueItemJob(item, notes);
  const client = await db.getClient(item.client_id);
  await db.logActivity({ kind: "changes", message: `Changes requested: “${item.title}”${client ? ` for ${client.business_name}` : ""}`, client_id: item.client_id, lead_id: null });
  kickQueue();
  refreshAll();
}

// ---------- delivery ----------

export async function sendPack(fd: FormData) {
  await requireOwner();
  const db = getDb();
  const clientId = str(fd, "client_id");
  const week = str(fd, "week");
  const back = str(fd, "back") === "client" ? `/clients/${clientId}` : "/deliveries";
  const sep = back.includes("?") ? "&" : "?";
  const client = await db.getClient(clientId);
  if (!client || !isWeek(week)) redirect(`${back}${sep}error=not_found`);
  if (!client.email) redirect(`${back}${sep}error=no_email`);
  const items = await db.listItems({ clientId, week });
  const active = await db.listJobs({ clientId, week, active: true });
  if (items.length === 0 || active.length || items.some((i) => i.review_status !== "approved")) redirect(`${back}${sep}error=not_all_approved`);

  const delivery = await db.getOrCreateDelivery(clientId, week);
  const link = `${await baseUrl()}/d/${delivery.token}`;
  try {
    await getMailer().send(weeklyPackEmail(client, week, link));
  } catch (err) {
    console.error("[delivery] send failed", err);
    redirect(`${back}${sep}error=send_failed`);
  }
  await db.updateDelivery(delivery.id, { sent_at: new Date().toISOString(), sent_to: client.email });
  await db.logActivity({ kind: "sent", message: `Week's pack sent: ${client.business_name} (${week})`, client_id: clientId, lead_id: null });
  refreshAll();
  redirect(`${back}${sep}notice=sent`);
}

// ---------- demo ----------

export async function removeSampleData() {
  await requireOwner();
  await getDb().removeSampleData();
  refreshAll();
  redirect("/?notice=sample_removed");
}
