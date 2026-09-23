import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import type { NewItem } from "./db";
import { env } from "./env";
import { getGenerator } from "./generator";
import { getReviewer } from "./reviewer";
import type { Client, EnqueueResult, GenerationJob } from "./types";

/**
 * Queues week jobs for the chosen clients. Paused clients are skipped; clients that already
 * have drafts for the week are skipped unless regenerate is set; a client with a job in
 * progress is never queued twice.
 */
export async function enqueueWeek(clientIds: string[], week: string, regenerate: boolean): Promise<EnqueueResult & { batchId: string }> {
  const db = getDb();
  const clients = new Map((await db.listClients()).map((c) => [c.id, c]));
  const unique = Array.from(new Set(clientIds));
  const paused = unique.filter((id) => clients.get(id)?.status === "paused");
  const requests = unique.filter((id) => !paused.includes(id)).map((client_id) => ({ client_id, week, regenerate }));
  const batchId = randomUUID();
  const result = requests.length ? await db.enqueueWeekJobs(requests, batchId) : { created: [], skipped: [] };
  result.skipped.push(...paused.map((client_id) => ({ client_id, reason: "paused" as const })));
  if (result.created.length) {
    await db.logActivity({
      kind: "generate",
      message: `Generation queued for ${result.created.length} client${result.created.length === 1 ? "" : "s"} (${week})${regenerate ? ", regenerate" : ""}`,
      client_id: result.created.length === 1 ? result.created[0].client_id : null,
      lead_id: null,
    });
  }
  return { ...result, batchId };
}

async function runJob(job: GenerationJob): Promise<void> {
  const db = getDb();
  const generator = getGenerator();
  const reviewer = getReviewer();
  const client = await db.getClient(job.client_id);
  if (!client) throw new Error("Client no longer exists.");

  if (job.kind === "week") {
    const existing = await db.listItems({ clientId: job.client_id, week: job.week });
    if (existing.length && !job.regenerate) return; // Already generated: never duplicate.
    const version = existing.reduce((v, i) => Math.max(v, i.version), 0) + 1;
    const drafts = await generator.generateWeek({ client, week: job.week });
    const items: NewItem[] = drafts.map((d, i) => ({
      ...d,
      client_id: client.id,
      week: job.week,
      job_id: job.id,
      kind: "video",
      slot: i + 1,
      review_status: "pending",
      review_notes: null,
      ai_verdict: null,
      ai_notes: null,
      version: existing.length ? version : 1,
    }));
    const created = await db.replaceWeekItems(client.id, job.week, items);
    if (reviewer.enabled) for (const item of created) await applyReview(client, item.id);
    await db.logActivity({
      kind: "generated",
      message: `${created.length} drafts ready for review: ${client.business_name} (${job.week})`,
      client_id: client.id,
      lead_id: null,
    });
    return;
  }

  // kind === "item": redo one item with the owner's notes.
  const item = job.item_id ? await db.getItem(job.item_id) : null;
  if (!item) throw new Error("The item to regenerate no longer exists.");
  const notes = job.notes || item.review_notes || "";
  const draft = await generator.reviseItem({ client, week: job.week, item, notes });
  await db.updateItem(item.id, {
    ...draft,
    job_id: job.id,
    version: item.version + 1,
    review_status: "pending",
    review_notes: notes, // kept so the reviewer sees what was asked for
    ai_verdict: null,
    ai_notes: null,
  });
  if (reviewer.enabled) await applyReview(client, item.id);
  await db.logActivity({
    kind: "regenerated",
    message: `Regenerated with notes: “${item.title}” for ${client.business_name}`,
    client_id: client.id,
    lead_id: null,
  });
}

/** Phase 2 hook: stores the AI reviewer's verdict on an item. */
async function applyReview(client: Client, itemId: string) {
  const db = getDb();
  const item = await db.getItem(itemId);
  if (!item) return;
  const verdict = await getReviewer().review({ client, item });
  if (verdict) await db.updateItem(itemId, { ai_verdict: verdict.verdict, ai_notes: verdict.notes });
}

async function runOne(): Promise<boolean> {
  const db = getDb();
  const job = await db.claimNextJob();
  if (!job) return false;
  try {
    await runJob(job);
    await db.updateJob(job.id, { status: "ready", error: null, finished_at: new Date().toISOString() });
  } catch (err) {
    await db.updateJob(job.id, { status: "failed", error: err instanceof Error ? err.message : String(err), finished_at: new Date().toISOString() });
  }
  return true;
}

/**
 * Works through queued jobs with small concurrency until the queue is empty or the time
 * budget is used up. Called after queuing (in the background) and by the pages that show
 * progress, so a queue always drains even on serverless hosts.
 */
export async function processQueue(budgetMs = 8000): Promise<number> {
  const deadline = Date.now() + budgetMs;
  let done = 0;
  const worker = async () => {
    while (Date.now() < deadline) {
      if (!(await runOne())) return;
      done++;
    }
  };
  await Promise.all(Array.from({ length: env.generationConcurrency }, worker));
  return done;
}
