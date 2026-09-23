"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ownerEmailAllowed, supabaseAuthClient } from "@/lib/auth";
import { createSessionValue, passwordMatches, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth/session";
import { env, supabaseEnabled } from "@/lib/env";
import { rateLimited } from "@/lib/leads";
import { t } from "@/lib/strings";

export type LoginState = { error: string } | null;

function safeNext(value: unknown): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (rateLimited("login:" + ip, 10, 15 * 60)) return { error: t.login.tooMany };

  const password = String(fd.get("password") || "");
  const next = safeNext(fd.get("next"));

  if (supabaseEnabled()) {
    const email = String(fd.get("email") || "").trim().toLowerCase();
    if (!ownerEmailAllowed(email)) return { error: t.login.wrong };
    const sb = await supabaseAuthClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: t.login.wrong };
    if (!ownerEmailAllowed(data.user.email)) {
      await sb.auth.signOut();
      return { error: t.login.notOwner };
    }
    redirect(next);
  }

  if (!(await passwordMatches(password, env.consolePassword))) return { error: t.login.wrong };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionValue(env.sessionSecret, env.consolePassword), {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  redirect(next);
}

export async function logout() {
  if (supabaseEnabled()) {
    const sb = await supabaseAuthClient();
    await sb.auth.signOut();
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
