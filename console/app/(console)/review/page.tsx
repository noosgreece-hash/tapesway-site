import type { Metadata } from "next";
import Link from "next/link";
import { approveAllForClient, approveItem, requestChanges } from "@/app/actions";
import { AiVerdictSlot, SampleBadge } from "@/components/Badges";
import { LiveRefresh } from "@/components/LiveRefresh";
import { SubmitButton } from "@/components/SubmitButton";
import { getDb } from "@/lib/db";
import { getReviewer } from "@/lib/reviewer";
import { groupBy, weekState } from "@/lib/status";
import { fmt, t } from "@/lib/strings";
import { LANGS, type ContentItem } from "@/lib/types";
import { weekRange } from "@/lib/week";

export const metadata: Metadata = { title: t.review.title };

type Filter = "pending" | "changes" | "approved";

function MediaBox({ url }: { url: string | null }) {
  if (url) return <video className="media" src={url} controls preload="metadata" playsInline />;
  return (
    <div className="media" role="img" aria-label={t.review.mediaPlaceholder}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" />
      </svg>
      <span>{t.review.mediaPlaceholder}</span>
    </div>
  );
}

export default async function ReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filter: Filter = sp.show === "changes" || sp.show === "approved" ? sp.show : "pending";
  const clientFilter = typeof sp.client === "string" ? sp.client : "";
  const db = getDb();
  const [allItems, clients, jobs, deliveries] = await Promise.all([db.listItems(), db.listClients(), db.listJobs({ limit: 500 }), db.listDeliveries()]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const reviewer = getReviewer();
  const items = clientFilter ? allItems.filter((i) => i.client_id === clientFilter) : allItems;

  const groups = groupBy(items, (i) => `${i.client_id}|${i.week}`);
  const want = (list: ContentItem[]) =>
    filter === "pending"
      ? list.some((i) => i.review_status === "pending")
      : filter === "changes"
        ? list.some((i) => i.review_status === "changes_requested")
        : list.every((i) => i.review_status === "approved");
  const shown = [...groups.entries()].filter(([, list]) => want(list)).sort(([a], [b]) => b.split("|")[1].localeCompare(a.split("|")[1]) || a.localeCompare(b));

  const counts = {
    pending: allItems.filter((i) => i.review_status === "pending").length,
    changes: allItems.filter((i) => i.review_status === "changes_requested").length,
  };
  const readyToSend = [...groupBy(allItems, (i) => `${i.client_id}|${i.week}`).entries()].filter(([key, list]) => {
    const [cid, week] = key.split("|");
    const s = weekState(list, jobs.filter((j) => j.client_id === cid && j.week === week), deliveries.find((d) => d.client_id === cid && d.week === week));
    return s.kind === "approved";
  }).length;
  const anyActive = jobs.some((j) => j.status === "queued" || j.status === "generating");
  const qs = (show: Filter) => `/review?${new URLSearchParams({ ...(show !== "pending" ? { show } : {}), ...(clientFilter ? { client: clientFilter } : {}) })}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.review.title}</h1>
          <p>{t.review.lead}</p>
        </div>
        <div className="actions">
          <LiveRefresh active={anyActive} />
        </div>
      </div>

      {readyToSend > 0 ? (
        <div className="notice notice--ok" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
          <span>
            {t.review.readyToSend} ({readyToSend})
          </span>
          <Link className="btn btn--sm btn--ok" href="/deliveries">
            {t.review.goDeliveries}
          </Link>
        </div>
      ) : null}

      <nav className="tabs" style={{ marginBottom: 16 }} aria-label={t.review.title}>
        <Link className="tab" href={qs("pending")} aria-current={filter === "pending" ? "page" : undefined}>
          {t.review.filterPending} <span className="n">{counts.pending}</span>
        </Link>
        <Link className="tab" href={qs("changes")} aria-current={filter === "changes" ? "page" : undefined}>
          {t.review.filterChanges} <span className="n">{counts.changes}</span>
        </Link>
        <Link className="tab" href={qs("approved")} aria-current={filter === "approved" ? "page" : undefined}>
          {t.review.filterApproved}
        </Link>
        {clientFilter && byId.get(clientFilter) ? (
          <Link className="tab is-active" href={filter === "pending" ? "/review" : `/review?show=${filter}`} title={t.clients.clear}>
            {byId.get(clientFilter)?.business_name} ✕
          </Link>
        ) : null}
      </nav>

      {shown.length === 0 ? <p className="card empty">{t.review.empty}</p> : null}

      {await Promise.all(
        shown.map(async ([key, list]) => {
          const [clientId, week] = key.split("|");
          const client = byId.get(clientId);
          const pending = list.filter((i) => i.review_status === "pending");
          const urls = await Promise.all(list.map((i) => (i.media_url ? db.resolveMediaUrl(i.media_url) : Promise.resolve(null))));
          return (
            <section className="card review-client" key={key} aria-label={client?.business_name}>
              <div className="card-head">
                <div>
                  <h2>
                    {client ? <Link href={`/clients/${clientId}`}>{client.business_name}</Link> : t.none} <SampleBadge show={Boolean(client?.sample)} />
                  </h2>
                  <p className="small muted">{fmt(t.review.weekOf, { week, range: weekRange(week) })}</p>
                </div>
                {pending.length > 1 ? (
                  <form action={approveAllForClient}>
                    <input type="hidden" name="client_id" value={clientId} />
                    <input type="hidden" name="week" value={week} />
                    <SubmitButton className="btn btn--ok btn--sm">{fmt(t.review.approveAll, { n: pending.length })}</SubmitButton>
                  </form>
                ) : null}
              </div>
              <div className="items">
                {list.map((item, idx) => (
                  <article className="item" key={item.id} aria-label={item.title}>
                    <MediaBox url={urls[idx]} />
                    <div className="item-body">
                      <div className="item-head">
                        <div className="item-top">
                          <h3>{item.title}</h3>
                          <span className="muted small">{fmt(t.review.version, { n: item.version })}</span>
                          {item.review_status === "approved" ? <span className="badge badge--ok">{t.review.approved}</span> : null}
                          {item.review_status === "changes_requested" ? <span className="badge badge--info">{t.review.filterChanges}</span> : null}
                        </div>
                        <AiVerdictSlot verdict={item.ai_verdict} notes={item.ai_notes} enabled={reviewer.enabled} />
                      </div>
                      <div className="item-rest">
                        {item.review_status === "changes_requested" ? (
                          <p className="redo-note item-sec">
                            <span className="spinner" aria-hidden="true" /> {t.review.redoing}
                            <br />
                            <strong>{t.review.lastNotes}:</strong> {item.review_notes}
                          </p>
                        ) : item.review_notes && item.version > 1 ? (
                          <p className="small muted item-sec">
                            <strong>{t.review.lastNotes}:</strong> {item.review_notes}
                          </p>
                        ) : null}
                        <div className="item-sec">
                          <span className="label">{t.review.captions}</span>
                          <div className="captions">
                            {LANGS.filter((l) => item.captions[l]).map((l) => (
                              <div className="caption" key={l}>
                                <span className="chip" title={t.clients.langs[l]}>
                                  {l}
                                </span>
                                <span>{item.captions[l]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="item-sec">
                          <span className="label">{t.review.hashtags}</span>
                          <p className="tags">{item.hashtags.join(" ")}</p>
                        </div>
                        <details className="item-sec">
                          <summary className="label" style={{ cursor: "pointer" }}>
                            {t.review.script}
                          </summary>
                          <div className="script">{item.script}</div>
                        </details>
                        {item.review_status === "pending" ? (
                          <div className="item-actions">
                            <form action={approveItem}>
                              <input type="hidden" name="id" value={item.id} />
                              <SubmitButton className="btn btn--ok btn--sm">{t.review.approve}</SubmitButton>
                            </form>
                            <details style={{ flex: "1 1 260px" }}>
                              <summary className="btn btn--ghost btn--sm" style={{ listStyle: "none" }}>
                                {t.review.requestChanges}
                              </summary>
                              <form action={requestChanges} className="changes">
                                <input type="hidden" name="id" value={item.id} />
                                <label className="small" htmlFor={`notes-${item.id}`} style={{ fontWeight: 600 }}>
                                  {t.review.notesLabel}
                                </label>
                                <textarea className="textarea" id={`notes-${item.id}`} name="notes" rows={3} required maxLength={2000} placeholder={t.review.notesPlaceholder} />
                                <div>
                                  <SubmitButton className="btn btn--sm">{t.review.sendBack}</SubmitButton>
                                </div>
                              </form>
                            </details>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        }),
      )}
    </>
  );
}
