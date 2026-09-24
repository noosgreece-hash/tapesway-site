import { after } from "next/server";
import { isOwner } from "@/lib/auth";
import { enqueueWeek, processQueue } from "@/lib/jobs";
import { currentWeek, isWeek } from "@/lib/week";

// Owner only. Queues week generation for a list of clients:
//   POST { "clientIds": ["..."], "week": "2026-W39", "regenerate": false }
// Same rules as the Generate button (no duplicates unless regenerate). Useful for scripts
// and, later, a weekly schedule.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await isOwner())) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { clientIds?: unknown; week?: unknown; regenerate?: unknown } | null;
  const ids = Array.isArray(body?.clientIds) ? body.clientIds.filter((x): x is string => typeof x === "string") : [];
  const week = body?.week === undefined ? currentWeek() : body.week;
  if (!ids.length || !isWeek(week)) return Response.json({ ok: false, error: "invalid" }, { status: 422 });
  const result = await enqueueWeek(ids, week, body?.regenerate === true);
  if (result.created.length) after(() => processQueue(25000).catch((err) => console.error("[jobs]", err)));
  return Response.json({ ok: true, week, batchId: result.batchId, created: result.created.length, skipped: result.skipped });
}
