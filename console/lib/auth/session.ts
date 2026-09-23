// Signed session cookie for password mode (no Supabase). Web Crypto only, so it runs
// in the proxy and in server code alike.

export const SESSION_COOKIE = "tw_session";
export const SESSION_DAYS = 14;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): string {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Short fingerprint of the password: changing CONSOLE_PASSWORD signs everyone out. */
async function passwordTag(password: string): Promise<string> {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode("tw:" + password))).slice(0, 12);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionValue(secret: string, password: string, now = Date.now()): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ sub: "owner", exp: now + SESSION_DAYS * 86400000, pw: await passwordTag(password) })));
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifySessionValue(value: string | undefined, secret: string, password: string, now = Date.now()): Promise<boolean> {
  if (!value || !secret || !password) return false;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(sig, await hmac(secret, payload))) return false;
  try {
    const data = JSON.parse(fromB64url(payload)) as { sub?: string; exp?: number; pw?: string };
    return data.sub === "owner" && typeof data.exp === "number" && data.exp > now && data.pw === (await passwordTag(password));
  } catch {
    return false;
  }
}

/** Constant-time password comparison (hashes first so lengths don't leak). */
export async function passwordMatches(given: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  const digest = async (v: string) => b64url(await crypto.subtle.digest("SHA-256", enc.encode(v)));
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  return safeEqual(a, b);
}
