import { isOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Public: the delivery page calls this from the browser once it has loaded, so link
// scanners in mail servers (which fetch but don't run scripts) don't count as opens.
// Visits by the signed-in owner are not counted.

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const db = getDb();
  const delivery = await db.getDeliveryByToken(token);
  if (!delivery || !delivery.sent_at) return Response.json({ ok: false }, { status: 404 });
  if (await isOwner()) return Response.json({ ok: true, counted: false });
  await db.recordOpen(delivery.id);
  return Response.json({ ok: true, counted: true });
}
