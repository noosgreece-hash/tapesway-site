import type { Metadata } from "next";
import Link from "next/link";
import { sendPack } from "@/app/actions";
import { SampleBadge, WeekStateBadge } from "@/components/Badges";
import { CopyButton } from "@/components/CopyButton";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { getDb } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { groupBy, weekState } from "@/lib/status";
import { fmt, t } from "@/lib/strings";
import { baseUrl } from "@/lib/url";
import { currentWeek } from "@/lib/week";

export const metadata: Metadata = { title: t.deliveries.title };

export default async function DeliveriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const all = sp.show === "all";
  const week = currentWeek();
  const db = getDb();
  const [items, jobs, deliveries, clients] = await Promise.all([
    db.listItems(all ? {} : { week }),
    db.listJobs(all ? { limit: 1000 } : { week }),
    db.listDeliveries(all ? {} : { week }),
    db.listClients(),
  ]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const origin = await baseUrl();
  const rows = [...groupBy(items, (i) => `${i.client_id}|${i.week}`).entries()]
    .map(([key, list]) => {
      const [clientId, w] = key.split("|");
      const delivery = deliveries.find((d) => d.client_id === clientId && d.week === w);
      const state = weekState(
        list,
        jobs.filter((j) => j.client_id === clientId && j.week === w),
        delivery,
      );
      return { key, clientId, week: w, client: byId.get(clientId), list, delivery, state };
    })
    .sort((a, b) => b.week.localeCompare(a.week) || (a.client?.business_name || "").localeCompare(b.client?.business_name || ""));
  const anyActive = jobs.some((j) => j.status === "queued" || j.status === "generating");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.deliveries.title}</h1>
          <p>{t.deliveries.lead}</p>
        </div>
        <LiveRefresh active={anyActive} />
      </div>
      <Notice notice={sp.notice} error={sp.error} />
      <section className="card">
        <div className="toolbar">
          <nav className="tabs" aria-label={t.week}>
            <Link className="tab" href="/deliveries" aria-current={!all ? "page" : undefined}>
              {t.deliveries.showThis} <span className="n">{week}</span>
            </Link>
            <Link className="tab" href="/deliveries?show=all" aria-current={all ? "page" : undefined}>
              {t.deliveries.showAll}
            </Link>
          </nav>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="table table--stack">
              <thead>
                <tr>
                  <th>{t.deliveries.colClient}</th>
                  <th>{t.deliveries.colWeek}</th>
                  <th>{t.deliveries.colItems}</th>
                  <th>{t.deliveries.colStatus}</th>
                  <th className="right">
                    <span className="sr-only">{t.deliveries.send}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const approved = r.list.filter((i) => i.review_status === "approved").length;
                  const ready = r.state.kind === "approved" || r.state.kind === "sent";
                  const d = r.delivery;
                  return (
                    <tr key={r.key}>
                      <td className="stack-main">
                        {r.client ? (
                          <Link className="cell-main" href={`/clients/${r.clientId}`}>
                            {r.client.business_name}
                          </Link>
                        ) : (
                          t.none
                        )}{" "}
                        <SampleBadge show={Boolean(r.client?.sample)} />
                        <span className="cell-sub">{r.client?.email || t.deliveries.noEmail}</span>
                      </td>
                      <td data-label={t.deliveries.colWeek} className="nowrap">
                        {r.week}
                      </td>
                      <td data-label={t.deliveries.colItems} className="nowrap">
                        {approved} / {r.list.length}
                      </td>
                      <td data-label={t.deliveries.colStatus}>
                        {r.state.kind === "approved" ? (
                          <span className="badge badge--ok badge--dot">{t.deliveries.ready}</span>
                        ) : r.state.kind === "sent" && d ? (
                          <span style={{ display: "grid", gap: 2 }}>
                            <span className="badge badge--ok badge--dot" style={{ justifySelf: "start" }}>
                              {fmt(t.deliveries.sent, { when: dateTime(d.sent_at) })}
                            </span>
                            <span className="small muted">
                              {d.opened_at ? fmt(t.deliveries.opened, { when: dateTime(d.opened_at) }) : t.deliveries.notOpened} ·{" "}
                              {fmt(t.deliveries.downloads, { n: d.downloads.length })}
                            </span>
                          </span>
                        ) : (
                          <WeekStateBadge state={r.state} />
                        )}
                      </td>
                      <td className="right">
                        <span className="btn-row" style={{ justifyContent: "flex-end" }}>
                          {d?.sent_at ? (
                            <>
                              <a className="btn btn--ghost btn--sm" href={`/d/${d.token}`} target="_blank" rel="noreferrer">
                                {t.deliveries.preview}
                              </a>
                              <CopyButton text={`${origin}/d/${d.token}`} label={t.deliveries.copyLink} done={t.copied} />
                            </>
                          ) : null}
                          {ready ? (
                            <form action={sendPack}>
                              <input type="hidden" name="client_id" value={r.clientId} />
                              <input type="hidden" name="week" value={r.week} />
                              <SubmitButton className={`btn btn--sm${r.state.kind === "sent" ? " btn--ghost" : ""}`} pending={t.deliveries.sending} disabled={!r.client?.email}>
                                {r.state.kind === "sent" ? t.deliveries.resend : t.deliveries.send}
                              </SubmitButton>
                            </form>
                          ) : (
                            <Link className="btn btn--ghost btn--sm" href={`/review?client=${r.clientId}`}>
                              {t.clients.detail.review}
                            </Link>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">{t.deliveries.empty}</p>
        )}
      </section>
    </>
  );
}
