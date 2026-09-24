import { clientIp, rateLimited } from "@/lib/leads";
import { setupCheck } from "@/lib/setupCheck";

export const dynamic = "force-dynamic";

// /api/health answers { ok: true }. /api/health?check=1 adds a setup check (counts and
// yes/no only) to find which login setting is missing.
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("check") !== "1") return Response.json({ ok: true });
  if (rateLimited("health:" + clientIp(request), 20, 600)) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  return Response.json({ ok: true, ...(await setupCheck()) }, { headers: { "Cache-Control": "no-store" } });
}
