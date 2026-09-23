import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, supabaseEnabled } from "../env";
import { SESSION_COOKIE, verifySessionValue } from "./session";

export function ownerEmailAllowed(email: string | undefined | null): boolean {
  return Boolean(email) && env.ownerEmails.includes(String(email).toLowerCase());
}

/** Supabase client bound to the request's auth cookies (server components, actions, route handlers). */
export async function supabaseAuthClient() {
  const jar = await cookies();
  return createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Server components can't set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** True when the current request comes from the signed-in owner. */
export async function isOwner(): Promise<boolean> {
  if (supabaseEnabled()) {
    const sb = await supabaseAuthClient();
    const { data } = await sb.auth.getUser();
    return ownerEmailAllowed(data.user?.email);
  }
  const jar = await cookies();
  return verifySessionValue(jar.get(SESSION_COOKIE)?.value, env.sessionSecret, env.consolePassword);
}

/** Use at the top of every private page and server action. */
export async function requireOwner(): Promise<void> {
  if (!(await isOwner())) redirect("/login");
}
