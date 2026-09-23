import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOwner } from "@/lib/auth";
import { env, supabaseEnabled } from "@/lib/env";
import { t } from "@/lib/strings";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: t.login.title };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  if (await isOwner()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
  return <LoginForm next={next} withEmail={supabaseEnabled()} devHint={env.usingDevPassword && !supabaseEnabled()} />;
}
