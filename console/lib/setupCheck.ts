import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, resendEnabled, supabaseEnabled } from "./env";

// Setup check behind /api/health?check=1. It says which login setting is missing or
// doesn't match, using counts and yes/no only: no emails, keys or other values.

type Check = { ok: boolean; detail: string };

async function anonKeyWorks(): Promise<Check> {
  try {
    const res = await fetch(`${env.supabase.url}/auth/v1/settings`, { headers: { apikey: env.supabase.anonKey }, cache: "no-store" });
    return res.ok ? { ok: true, detail: "accepted" } : { ok: false, detail: `rejected (${res.status})` };
  } catch (err) {
    return { ok: false, detail: "Supabase not reachable: " + (err as Error).message };
  }
}

export async function setupCheck() {
  const ownerCount = env.ownerEmails.length;
  const out: Record<string, unknown> = {
    mode: supabaseEnabled() ? "supabase" : "demo (Supabase settings missing)",
    OWNER_EMAILS: ownerCount ? `${ownerCount} set` : "EMPTY",
    RESEND_API_KEY: resendEnabled() ? "set" : "EMPTY",
  };
  if (!supabaseEnabled()) return out;

  let host = "";
  try {
    host = new URL(env.supabase.url).host;
  } catch {
    host = "not a valid URL";
  }
  const raw = (process.env.SUPABASE_URL || "").trim();
  out.SUPABASE_URL = raw.replace(/\/+$/, "") === env.supabase.url ? host : `${host} (extra path in the setting ignored)`;
  out.SUPABASE_ANON_KEY = await anonKeyWorks();

  const admin = createClient(env.supabase.url, env.supabase.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Login users: is each OWNER_EMAILS address a Supabase user, and is it confirmed?
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const users = data.users.map((u) => ({ email: (u.email || "").toLowerCase(), confirmed: Boolean(u.email_confirmed_at) }));
    const found = env.ownerEmails.map((e) => users.find((u) => u.email === e));
    out.SUPABASE_SERVICE_ROLE_KEY = { ok: true, detail: "accepted" };
    out.loginUser = {
      usersInSupabase: users.length,
      ownerEmailsFoundAsUsers: `${found.filter(Boolean).length} of ${ownerCount}`,
      ownerEmailsConfirmed: `${found.filter((u) => u?.confirmed).length} of ${ownerCount}`,
    };
  } catch (err) {
    out.SUPABASE_SERVICE_ROLE_KEY = { ok: false, detail: (err as Error).message };
  }

  // The SQL setup: does console_owners exist, and does it hold the OWNER_EMAILS addresses?
  try {
    const { data, error } = await admin.from("console_owners").select("email");
    if (error) throw error;
    const rows = (data || []).map((r: { email: string }) => r.email.toLowerCase());
    out.consoleOwnersTable = {
      rows: rows.length,
      ownerEmailsInTable: `${env.ownerEmails.filter((e) => rows.includes(e)).length} of ${ownerCount}`,
    };
  } catch (err) {
    out.consoleOwnersTable = { ok: false, detail: (err as Error).message };
  }
  return out;
}
