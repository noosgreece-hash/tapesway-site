import { getDb } from "@/lib/db";
import { leadAlertEmail } from "@/lib/emails";
import { env, originAllowed } from "@/lib/env";
import { clientIp, parseLead, rateLimited, readBody } from "@/lib/leads";
import { getMailer } from "@/lib/mailer";
import { baseUrl } from "@/lib/url";

// Public endpoint for the website's contact form. Stores the lead, then emails the owner.
// Answers {ok:true} with 200 only when the lead was stored.

export const dynamic = "force-dynamic";

function cors(origin: string | null): Record<string, string> {
  if (!origin || !originAllowed(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function reply(body: object, status: number, origin: string | null) {
  return Response.json(body, { status, headers: { ...cors(origin), "Cache-Control": "no-store" } });
}

export function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !originAllowed(origin)) return new Response(null, { status: 403, headers: { Vary: "Origin" } });
  return new Response(null, { status: 204, headers: cors(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !originAllowed(origin)) return reply({ ok: false, error: "origin_not_allowed" }, 403, origin);

  if (rateLimited("lead:" + clientIp(request), env.leadsRateLimit, env.leadsRateWindowSeconds)) {
    return reply({ ok: false, error: "rate_limited" }, 429, origin);
  }

  const body = await readBody(request);
  if (!body) return reply({ ok: false, error: "unsupported_body" }, 415, origin);

  const parsed = parseLead(body, origin ? `website (${new URL(origin).host})` : "website");
  if (!parsed.ok) return reply({ ok: false, error: "invalid", fields: parsed.errors }, 422, origin);
  // Honeypot filled: accept silently, store nothing.
  if ("spam" in parsed) return reply({ ok: true }, 200, origin);

  let lead;
  try {
    const db = getDb();
    lead = await db.createLead(parsed.lead);
    await db.logActivity({ kind: "lead", message: `New lead: ${lead.name}${lead.business ? ` (${lead.business})` : ""}`, client_id: null, lead_id: lead.id });
  } catch (err) {
    console.error("[leads] could not store lead", err);
    return reply({ ok: false, error: "not_stored" }, 500, origin);
  }

  // The lead is safe; a failed alert must not turn this into an error for the visitor.
  try {
    const to = env.ownerAlertEmail || (getMailer().kind === "outbox" ? "owner (OWNER_ALERT_EMAIL not set)" : "");
    if (to) await getMailer().send(leadAlertEmail(lead, to, await baseUrl()));
    else console.warn("[leads] OWNER_ALERT_EMAIL / OWNER_EMAILS not set: no alert sent");
  } catch (err) {
    console.error("[leads] alert email failed", err);
  }

  return reply({ ok: true }, 200, origin);
}
