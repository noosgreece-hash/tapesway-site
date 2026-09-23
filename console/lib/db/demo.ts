import { randomBytes, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../env";
import type {
  Activity,
  Client,
  ClientInput,
  ContentItem,
  Delivery,
  EnqueueResult,
  GenerationJob,
  Lead,
  OutboxEmail,
} from "../types";
import type { Db, JobRequest, NewItem, NewLead } from "./types";
import { sampleStore } from "./seed";

/** Everything the demo adapter keeps, in one JSON file. */
export interface Store {
  version: 1;
  leads: Lead[];
  clients: Client[];
  jobs: GenerationJob[];
  items: ContentItem[];
  deliveries: Delivery[];
  outbox: OutboxEmail[];
  activity: Activity[];
}

export const STALE_JOB_MS = 10 * 60 * 1000;

function emptyStore(): Store {
  return { version: 1, leads: [], clients: [], jobs: [], items: [], deliveries: [], outbox: [], activity: [] };
}

const now = () => new Date().toISOString();
const byNewest = <T extends { created_at: string }>(a: T, b: T) => b.created_at.localeCompare(a.created_at);

// One lock per process, shared by every bundle that imports this module.
const g = globalThis as unknown as { __twDemoLock?: Promise<unknown> };

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = g.__twDemoLock || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  g.__twDemoLock = prev.then(() => next);
  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
  }
}

export function createDemoDb(dir = env.dataDir): Db {
  const file = path.resolve(dir, "store.json");

  async function load(): Promise<Store> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as Store;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      const store = env.demoSeed ? sampleStore() : emptyStore();
      await save(store);
      return store;
    }
  }

  async function save(store: Store) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 1));
    await fs.rename(tmp, file);
  }

  /** Read-only access. */
  const read = <T>(fn: (s: Store) => T) => withLock(async () => fn(await load()));
  /** Read-modify-write under the lock. */
  const write = <T>(fn: (s: Store) => T) =>
    withLock(async () => {
      const store = await load();
      const result = fn(store);
      await save(store);
      return result;
    });

  const clone = <T>(v: T): T => (v == null ? v : structuredClone(v));

  function anyActiveJob(s: Store, clientId: string, week: string) {
    return s.jobs.find((j) => j.client_id === clientId && j.week === week && (j.status === "queued" || j.status === "generating"));
  }

  const db: Db = {
    kind: "demo",

    listLeads: (filter) =>
      read((s) => clone(s.leads.filter((l) => !filter?.status || l.status === filter.status).sort(byNewest))),
    getLead: (id) => read((s) => clone(s.leads.find((l) => l.id === id) || null)),
    createLead: (input: NewLead) =>
      write((s) => {
        const lead: Lead = { ...input, id: randomUUID(), status: "new", client_id: null, sample: false, created_at: now(), updated_at: now() };
        s.leads.push(lead);
        return clone(lead);
      }),
    updateLead: (id, patch) =>
      write((s) => {
        const lead = s.leads.find((l) => l.id === id);
        if (!lead) return null;
        Object.assign(lead, patch, { updated_at: now() });
        return clone(lead);
      }),

    listClients: () => read((s) => clone([...s.clients].sort((a, b) => a.business_name.localeCompare(b.business_name)))),
    getClient: (id) => read((s) => clone(s.clients.find((c) => c.id === id) || null)),
    createClient: (input: ClientInput) =>
      write((s) => {
        const client: Client = { sample: false, ...input, id: randomUUID(), created_at: now(), updated_at: now() };
        s.clients.push(client);
        return clone(client);
      }),
    updateClient: (id, patch) =>
      write((s) => {
        const client = s.clients.find((c) => c.id === id);
        if (!client) return null;
        Object.assign(client, patch, { updated_at: now() });
        return clone(client);
      }),

    listJobs: (filter) =>
      read((s) => {
        let jobs = s.jobs.filter(
          (j) =>
            (!filter?.clientId || j.client_id === filter.clientId) &&
            (!filter?.week || j.week === filter.week) &&
            (!filter?.batchId || j.batch_id === filter.batchId) &&
            (!filter?.active || j.status === "queued" || j.status === "generating"),
        );
        jobs = jobs.sort(byNewest);
        return clone(filter?.limit ? jobs.slice(0, filter.limit) : jobs);
      }),

    enqueueWeekJobs: (requests: JobRequest[], batchId: string) =>
      write((s) => {
        const result: EnqueueResult = { created: [], skipped: [] };
        for (const r of requests) {
          const client = s.clients.find((c) => c.id === r.client_id);
          if (!client) {
            result.skipped.push({ client_id: r.client_id, reason: "missing" });
            continue;
          }
          if (anyActiveJob(s, r.client_id, r.week)) {
            result.skipped.push({ client_id: r.client_id, reason: "in_progress" });
            continue;
          }
          if (!r.regenerate && s.items.some((i) => i.client_id === r.client_id && i.week === r.week)) {
            result.skipped.push({ client_id: r.client_id, reason: "already_generated" });
            continue;
          }
          const job: GenerationJob = {
            id: randomUUID(),
            client_id: r.client_id,
            week: r.week,
            kind: "week",
            item_id: null,
            notes: null,
            regenerate: r.regenerate,
            batch_id: batchId,
            status: "queued",
            error: null,
            created_at: now(),
            started_at: null,
            finished_at: null,
          };
          s.jobs.push(job);
          result.created.push(clone(job));
        }
        return result;
      }),

    enqueueItemJob: (item, notes) =>
      write((s) => {
        const busy = s.jobs.some(
          (j) =>
            j.client_id === item.client_id &&
            j.week === item.week &&
            (j.status === "queued" || j.status === "generating") &&
            (j.kind === "week" || j.item_id === item.id),
        );
        if (busy) return null;
        const job: GenerationJob = {
          id: randomUUID(),
          client_id: item.client_id,
          week: item.week,
          kind: "item",
          item_id: item.id,
          notes,
          regenerate: true,
          batch_id: null,
          status: "queued",
          error: null,
          created_at: now(),
          started_at: null,
          finished_at: null,
        };
        s.jobs.push(job);
        return clone(job);
      }),

    claimNextJob: () =>
      write((s) => {
        const staleBefore = Date.now() - STALE_JOB_MS;
        const job = s.jobs
          .filter(
            (j) =>
              j.status === "queued" ||
              (j.status === "generating" && j.started_at && new Date(j.started_at).getTime() < staleBefore),
          )
          .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
        if (!job) return null;
        job.status = "generating";
        job.started_at = now();
        return clone(job);
      }),
    updateJob: (id, patch) =>
      write((s) => {
        const job = s.jobs.find((j) => j.id === id);
        if (job) Object.assign(job, patch);
      }),
    requeueJob: (id) =>
      write((s) => {
        const job = s.jobs.find((j) => j.id === id);
        if (job && job.status === "failed" && !anyActiveJob(s, job.client_id, job.week)) {
          Object.assign(job, { status: "queued", error: null, started_at: null, finished_at: null, created_at: now() });
        }
      }),

    listItems: (filter) =>
      read((s) =>
        clone(
          s.items
            .filter(
              (i) =>
                (!filter?.clientId || i.client_id === filter.clientId) &&
                (!filter?.week || i.week === filter.week) &&
                (!filter?.reviewStatus || i.review_status === filter.reviewStatus),
            )
            .sort((a, b) => b.week.localeCompare(a.week) || a.slot - b.slot),
        ),
      ),
    getItem: (id) => read((s) => clone(s.items.find((i) => i.id === id) || null)),
    replaceWeekItems: (clientId, week, drafts: NewItem[]) =>
      write((s) => {
        const sample = s.clients.find((c) => c.id === clientId)?.sample || false;
        s.items = s.items.filter((i) => !(i.client_id === clientId && i.week === week));
        const created = drafts.map<ContentItem>((d) => ({ ...d, id: randomUUID(), sample, created_at: now(), updated_at: now(), approved_at: null }));
        s.items.push(...created);
        return clone(created);
      }),
    updateItem: (id, patch) =>
      write((s) => {
        const item = s.items.find((i) => i.id === id);
        if (!item) return null;
        Object.assign(item, patch, { updated_at: now() });
        if (patch.review_status === "approved") item.approved_at = now();
        else if (patch.review_status) item.approved_at = null;
        return clone(item);
      }),

    listDeliveries: (filter) =>
      read((s) =>
        clone(
          s.deliveries
            .filter((d) => (!filter?.clientId || d.client_id === filter.clientId) && (!filter?.week || d.week === filter.week))
            .sort(byNewest),
        ),
      ),
    getDeliveryByToken: (token) => read((s) => clone(s.deliveries.find((d) => d.token === token) || null)),
    getOrCreateDelivery: (clientId, week) =>
      write((s) => {
        let d = s.deliveries.find((x) => x.client_id === clientId && x.week === week);
        if (!d) {
          d = {
            id: randomUUID(),
            client_id: clientId,
            week,
            token: randomBytes(24).toString("base64url"),
            sent_at: null,
            sent_to: null,
            opened_at: null,
            last_opened_at: null,
            open_count: 0,
            downloads: [],
            sample: s.clients.find((c) => c.id === clientId)?.sample || false,
            created_at: now(),
          };
          s.deliveries.push(d);
        }
        return clone(d);
      }),
    updateDelivery: (id, patch) =>
      write((s) => {
        const d = s.deliveries.find((x) => x.id === id);
        if (d) Object.assign(d, patch);
      }),
    recordOpen: (id) =>
      write((s) => {
        const d = s.deliveries.find((x) => x.id === id);
        if (!d) return;
        d.opened_at = d.opened_at || now();
        d.last_opened_at = now();
        d.open_count += 1;
      }),
    recordDownload: (id, itemId) =>
      write((s) => {
        const d = s.deliveries.find((x) => x.id === id);
        if (d) d.downloads.push({ item_id: itemId, at: now() });
      }),

    addOutbox: (email) =>
      write((s) => {
        const e: OutboxEmail = { ...email, id: randomUUID(), created_at: now() };
        s.outbox.push(e);
        return clone(e);
      }),
    listOutbox: (limit = 100) => read((s) => clone([...s.outbox].sort(byNewest).slice(0, limit))),
    logActivity: (entry) =>
      write((s) => {
        s.activity.push({ ...entry, id: randomUUID(), created_at: now() });
        if (s.activity.length > 500) s.activity = s.activity.slice(-500);
      }),
    listActivity: (limit = 20) => read((s) => clone([...s.activity].sort(byNewest).slice(0, limit))),

    removeSampleData: () =>
      write((s) => {
        const sampleClients = new Set(s.clients.filter((c) => c.sample).map((c) => c.id));
        const sampleLeads = new Set(s.leads.filter((l) => l.sample).map((l) => l.id));
        s.leads = s.leads.filter((l) => !l.sample);
        s.clients = s.clients.filter((c) => !c.sample);
        s.jobs = s.jobs.filter((j) => !sampleClients.has(j.client_id));
        s.items = s.items.filter((i) => !sampleClients.has(i.client_id));
        s.deliveries = s.deliveries.filter((d) => !sampleClients.has(d.client_id));
        s.activity = s.activity.filter(
          (a) => !(a.client_id && sampleClients.has(a.client_id)) && !(a.lead_id && sampleLeads.has(a.lead_id)) && a.kind !== "sample",
        );
      }),

    resolveMediaUrl: async (mediaUrl) => (/^https?:\/\//.test(mediaUrl) ? mediaUrl : null),
  };
  return db;
}
