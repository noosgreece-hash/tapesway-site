import { isOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { client as ct } from "@/lib/strings";
import { LANGS } from "@/lib/types";

// Public download link on the delivery page. Records the download (unless the owner is
// previewing), then sends the video, or in demo mode (no video yet) a text file with the
// captions and hashtags.

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ token: string; itemId: string }> }) {
  const { token, itemId } = await ctx.params;
  const db = getDb();
  const delivery = await db.getDeliveryByToken(token);
  if (!delivery || !delivery.sent_at) return new Response("Not found", { status: 404 });
  const item = await db.getItem(itemId);
  if (!item || item.client_id !== delivery.client_id || item.week !== delivery.week || item.review_status !== "approved") {
    return new Response("Not found", { status: 404 });
  }
  if (!(await isOwner())) await db.recordDownload(delivery.id, item.id);

  if (item.media_url) {
    const url = await db.resolveMediaUrl(item.media_url);
    if (url) return Response.redirect(url, 302);
  }
  const text = [
    item.title,
    "",
    ...LANGS.filter((l) => item.captions[l]).flatMap((l) => [`${ct.caption} (${ct.langs[l]}):`, item.captions[l] as string, ""]),
    `${ct.hashtags}:`,
    item.hashtags.join(" "),
    "",
    ct.noVideo,
  ].join("\n");
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="tapesway-${delivery.week}-${item.slot}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
