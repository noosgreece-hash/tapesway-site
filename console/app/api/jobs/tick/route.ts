import { isOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { processQueue } from "@/lib/jobs";

// Owner only (the proxy also checks). Works through queued generation jobs for a few
// seconds and reports how many are still active. Pages showing progress call this.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  if (!(await isOwner())) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const processed = await processQueue(4000);
  const active = (await getDb().listJobs({ active: true })).length;
  return Response.json({ ok: true, processed, active }, { headers: { "Cache-Control": "no-store" } });
}
