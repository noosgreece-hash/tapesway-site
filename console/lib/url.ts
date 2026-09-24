import "server-only";
import { headers } from "next/headers";
import { env } from "./env";

/** The console's public address, for links in emails. PUBLIC_BASE_URL wins; otherwise the request's host. */
export async function baseUrl(): Promise<string> {
  if (env.publicBaseUrl) return env.publicBaseUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
