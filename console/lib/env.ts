// Reads configuration from environment variables. Every variable is documented in .env.example.

const isProd = process.env.NODE_ENV === "production";

function list(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value || "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const DEV_PASSWORD = "demo";
const DEV_SECRET = "dev-only-session-secret-change-me-0123456789abcdef";

export const env = {
  isProd,
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  ownerEmails: list(process.env.OWNER_EMAILS).map((e) => e.toLowerCase()),
  ownerAlertEmail: process.env.OWNER_ALERT_EMAIL || list(process.env.OWNER_EMAILS)[0] || "",
  consolePassword: process.env.CONSOLE_PASSWORD || (isProd ? "" : DEV_PASSWORD),
  sessionSecret: process.env.SESSION_SECRET || (isProd ? "" : DEV_SECRET),
  usingDevPassword: !process.env.CONSOLE_PASSWORD && !isProd,
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "tapesway <hello@tapesway.com>",
  emailReplyTo: process.env.EMAIL_REPLY_TO || "",
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, ""),
  allowedOrigins: list(
    process.env.ALLOWED_ORIGINS ||
      "https://tapesway.com,https://www.tapesway.com,https://tapesway.gr,https://www.tapesway.gr,http://localhost:*,http://127.0.0.1:*",
  ),
  leadsRateLimit: int(process.env.LEADS_RATE_LIMIT, 5),
  leadsRateWindowSeconds: int(process.env.LEADS_RATE_WINDOW_SECONDS, 600),
  dataDir: process.env.DATA_DIR || ".data",
  demoSeed: process.env.DEMO_SEED !== "0",
  generationConcurrency: Math.max(1, int(process.env.GENERATION_CONCURRENCY, 2)),
  demoGeneratorDelayMs: int(process.env.DEMO_GENERATOR_DELAY_MS, 700),
};

/** Supabase is used when all three Supabase variables are set. */
export function supabaseEnabled(): boolean {
  return Boolean(env.supabase.url && env.supabase.anonKey && env.supabase.serviceRoleKey);
}

/** Demo mode = no Supabase: data in a local JSON file, password login. */
export function isDemoData(): boolean {
  return !supabaseEnabled();
}

export function resendEnabled(): boolean {
  return Boolean(env.resendApiKey);
}

/** Problems that must stop the console from serving in production. */
export function configProblems(): string[] {
  const problems: string[] = [];
  if (!env.isProd) return problems;
  if (supabaseEnabled()) {
    if (env.ownerEmails.length === 0) problems.push("OWNER_EMAILS must list the owner's email when Supabase is used.");
  } else {
    if (!process.env.CONSOLE_PASSWORD || process.env.CONSOLE_PASSWORD.length < 10)
      problems.push("CONSOLE_PASSWORD must be set (at least 10 characters) when Supabase is not used.");
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
      problems.push("SESSION_SECRET must be set (at least 32 random characters) when Supabase is not used.");
  }
  if (process.env.SUPABASE_URL && !supabaseEnabled())
    problems.push("SUPABASE_URL is set but SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is missing.");
  return problems;
}

/** Origin check for the website form endpoint. Supports "http://localhost:*" style port wildcards. */
export function originAllowed(origin: string): boolean {
  return env.allowedOrigins.some((rule) => {
    if (rule === origin) return true;
    if (rule.endsWith(":*")) {
      const base = rule.slice(0, -2);
      return origin === base || new RegExp("^" + base.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + ":\\d+$").test(origin);
    }
    return false;
  });
}
