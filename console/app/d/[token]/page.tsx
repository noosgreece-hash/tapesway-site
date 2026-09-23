/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { CopyButton } from "@/components/CopyButton";
import { OpenBeacon } from "@/components/OpenBeacon";
import { isOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { client as ct, fmt } from "@/lib/strings";
import { LANGS } from "@/lib/types";
import { weekRange } from "@/lib/week";

// Public, no login: the private link in the client's weekly email. The token is the key.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: `${ct.pageTitle} · tapesway` }, robots: { index: false, follow: false } };

function NotFound() {
  return (
    <div className="pack" lang="el">
      <header className="pack-head">
        <div className="pack-bar">
          <img src="/brand/logo-mark-white.svg" alt="" width={24} height={27} />
          <span className="brand-word">tapesway</span>
        </div>
      </header>
      <main className="pack-main">
        <h1>{ct.notFoundTitle}</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          {ct.notFoundText}
        </p>
      </main>
    </div>
  );
}

export default async function DeliveryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const delivery = token.length >= 32 ? await db.getDeliveryByToken(token) : null;
  if (!delivery || !delivery.sent_at) return <NotFound />;
  const [client, items, owner] = await Promise.all([db.getClient(delivery.client_id), db.listItems({ clientId: delivery.client_id, week: delivery.week }), isOwner()]);
  if (!client) return <NotFound />;
  const approved = items.filter((i) => i.review_status === "approved").sort((a, b) => a.slot - b.slot);
  const media = await Promise.all(approved.map((i) => (i.media_url ? db.resolveMediaUrl(i.media_url) : Promise.resolve(null))));

  return (
    <div className="pack" lang="el">
      {owner ? null : <OpenBeacon token={token} />}
      <header className="pack-head">
        <div className="pack-bar">
          <img src="/brand/logo-mark-white.svg" alt="" width={24} height={27} />
          <span className="brand-word">tapesway</span>
        </div>
        <div className="pack-hero">
          <p className="pack-eyebrow">{fmt(ct.week, { range: weekRange(delivery.week, "el") })}</p>
          <h1>{ct.pageTitle}</h1>
          <p className="pack-intro">{fmt(ct.intro, { business: client.business_name })}</p>
        </div>
      </header>
      <main className="pack-main">
        {owner ? <p className="notice">{ct.preview}</p> : null}
        <ol className="pack-list">
          {approved.map((item, idx) => (
            <li className="pack-item" key={item.id}>
              <div className="pack-media">
                {media[idx] ? (
                  <video src={media[idx] as string} controls preload="metadata" playsInline />
                ) : (
                  <div className="media" role="img" aria-label={ct.noVideo}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" />
                    </svg>
                    <span>{ct.noVideo}</span>
                  </div>
                )}
              </div>
              <div className="pack-body">
                <p className="pack-num">{fmt(ct.video, { n: idx + 1 })}</p>
                <h2>{item.title}</h2>
                <div className="pack-captions">
                  {LANGS.filter((l) => item.captions[l]).map((l) => (
                    <div className="pack-caption" key={l}>
                      <div className="pack-caption-head">
                        <span className="label">
                          {ct.caption} · {ct.langs[l]}
                        </span>
                        <CopyButton text={item.captions[l] as string} label={ct.copy} done={ct.copied} />
                      </div>
                      <p>{item.captions[l]}</p>
                    </div>
                  ))}
                  <div className="pack-caption">
                    <div className="pack-caption-head">
                      <span className="label">{ct.hashtags}</span>
                      <CopyButton text={item.hashtags.join(" ")} label={ct.copy} done={ct.copied} />
                    </div>
                    <p className="tags">{item.hashtags.join(" ")}</p>
                  </div>
                </div>
                <div className="btn-row" style={{ marginTop: 18 }}>
                  <a className="btn" href={`/d/${token}/download/${item.id}`} download>
                    {item.media_url ? ct.download : ct.downloadText}
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="pack-foot">{ct.footer}</p>
      </main>
    </div>
  );
}
