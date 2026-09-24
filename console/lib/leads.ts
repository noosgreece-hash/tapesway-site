import type { NewLead } from "./db/types";

// Validation for the website form endpoint (POST /api/leads). Field names match the
// website's form: name, business, email, island, type, message, plus the _gotcha honeypot.

export const LIMITS = { name: 120, business: 160, email: 200, island: 80, type: 120, message: 5000 } as const;

export type LeadParse =
  | { ok: true; lead: NewLead }
  | { ok: true; spam: true }
  | { ok: false; errors: Record<string, string> };

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

function clean(v: unknown, max: number, multiline = false): string {
  let s = typeof v === "string" ? v : v == null ? "" : String(v);
  s = s.replace(/\r\n?/g, "\n");
  // Drop control characters; keep newlines only where allowed.
  s = s.replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, multiline ? "" : " ");
  s = s.trim();
  return s.length > max ? s.slice(0, max) : s;
}

export function parseLead(input: Record<string, unknown>, source = "website"): LeadParse {
  if (typeof input._gotcha === "string" && input._gotcha.trim() !== "") return { ok: true, spam: true };

  const errors: Record<string, string> = {};
  const rawName = typeof input.name === "string" ? input.name.trim() : "";
  const rawEmail = typeof input.email === "string" ? input.email.trim() : "";
  const rawMessage = typeof input.message === "string" ? input.message.trim() : "";
  if (!rawName) errors.name = "required";
  else if (rawName.length > LIMITS.name) errors.name = "too_long";
  if (!rawEmail) errors.email = "required";
  else if (rawEmail.length > LIMITS.email || !EMAIL.test(rawEmail)) errors.email = "invalid";
  if (!rawMessage) errors.message = "required";
  else if (rawMessage.length > LIMITS.message) errors.message = "too_long";
  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    lead: {
      name: clean(rawName, LIMITS.name),
      business: clean(input.business, LIMITS.business),
      email: clean(rawEmail, LIMITS.email).toLowerCase(),
      island: clean(input.island, LIMITS.island),
      business_type: clean(input.type, LIMITS.type),
      message: clean(rawMessage, LIMITS.message, true),
      source,
    },
  };
}

/** Reads a request body sent as multipart/form-data, x-www-form-urlencoded or JSON. */
export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = (request.headers.get("content-type") || "").toLowerCase();
  try {
    if (type.includes("application/json")) {
      const data = (await request.json()) as unknown;
      return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
    }
    if (type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      const out: Record<string, unknown> = {};
      form.forEach((value, key) => {
        if (typeof value === "string") out[key] = value;
      });
      return out;
    }
  } catch {
    return null;
  }
  return null;
}

// Simple per-IP limit, kept in memory. On serverless hosts each instance counts on its
// own, which still stops a single burst; put a WAF rule in front for more.
const g = globalThis as unknown as { __twRate?: Map<string, number[]> };

export function rateLimited(key: string, limit: number, windowSeconds: number, now = Date.now()): boolean {
  if (limit <= 0) return false;
  const map = (g.__twRate ||= new Map<string, number[]>());
  const since = now - windowSeconds * 1000;
  const hits = (map.get(key) || []).filter((t) => t > since);
  const limited = hits.length >= limit;
  if (!limited) hits.push(now);
  map.set(key, hits);
  if (map.size > 5000) for (const [k, v] of map) if (!v.some((t) => t > since)) map.delete(k);
  return limited;
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
