import Link from "next/link";
import { removeSampleData } from "@/app/actions";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { getDb } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { groupBy, weekState } from "@/lib/status";
import { fmt, t } from "@/lib/strings";
import { currentWeek, weekRange } from "@/lib/week";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Overview({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const db = getDb();
  const week = currentWeek();
  const [leads, pending, clients, items, jobs, deliveries, activity] = await Promise.all([
    db.listLeads({ status: "new" }),
    db.listItems({ reviewStatus: "pending" }),
    db.listClients(),
    db.listItems({ week }),
    db.listJobs({ week }),
    db.listDeliveries({ week }),
    db.listActivity(14),
  ]);
  const active = clients.filter((c) => c.status === "active");
  const itemsBy = groupBy(items, (i) => i.client_id);
  const jobsBy = groupBy(jobs, (j) => j.client_id);
  let generated = 0;
  let approved = 0;
  let sent = 0;
  for (const c of active) {
    const s = weekState(itemsBy.get(c.id) || [], jobsBy.get(c.id) || [], deliveries.find((d) => d.client_id === c.id));
    if (s.kind === "review" || s.kind === "approved" || s.kind === "sent") generated++;
    if (s.kind === "approved" || s.kind === "sent") approved++;
    if (s.kind === "sent") sent++;
  }
  const total = active.length || 1;
  const hasSample = clients.some((c) => c.sample) || (await db.listLeads()).some((l) => l.sample);
  const anyActive = jobs.some((j) => j.status === "queued" || j.status === "generating");

  const bars = [
    { label: t.overview.generated, n: generated, cls: "" },
    { label: t.overview.approved, n: approved, cls: "meter--ok" },
    { label: t.overview.sent, n: sent, cls: "meter--brass" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.overview.title}</h1>
          <p>
            {t.week} {week} · {weekRange(week)}
          </p>
        </div>
        <LiveRefresh active={anyActive} />
      </div>
      <Notice notice={sp.notice} error={sp.error} />

      <div className="stats">
        <Link className="card stat" href="/leads?status=new">
          <div className="stat-label">{t.overview.newLeads}</div>
          <div className="stat-value">{leads.length}</div>
          <div className="stat-note">{t.overview.goLeads} →</div>
        </Link>
        <Link className="card stat" href="/review">
          <div className="stat-label">{t.overview.awaitingReview}</div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-note">{t.overview.goReview} →</div>
        </Link>
        <Link className="card stat" href="/clients">
          <div className="stat-label">{t.overview.activeClients}</div>
          <div className="stat-value">{active.length}</div>
          <div className="stat-note">{t.overview.goClients} →</div>
        </Link>
      </div>

      <div className="grid-2">
        <section className="card" aria-labelledby="week-h">
          <div className="card-head">
            <h2 id="week-h">
              {t.overview.thisWeek} <span className="muted small">({week})</span>
            </h2>
          </div>
          <div className="card-pad week-bars">
            {bars.map((b) => (
              <div className="week-bar" key={b.label}>
                <span>{b.label}</span>
                <div className={`meter ${b.cls}`} role="img" aria-label={`${b.label}: ${b.n} / ${active.length}`}>
                  <span style={{ width: `${Math.round((b.n / total) * 100)}%` }} />
                </div>
                <span className="right nowrap">
                  <strong>{b.n}</strong> <span className="muted">/ {active.length}</span>
                </span>
              </div>
            ))}
            <p className="small muted">{fmt(t.overview.ofClients, { n: active.length })}</p>
          </div>
        </section>

        <section className="card" aria-labelledby="act-h">
          <div className="card-head">
            <h2 id="act-h">{t.overview.recent}</h2>
          </div>
          {activity.length ? (
            <ul className="activity">
              {activity.map((a) => (
                <li key={a.id}>
                  <span>
                    {a.lead_id ? (
                      <Link href={`/leads/${a.lead_id}`}>{a.message}</Link>
                    ) : a.client_id ? (
                      <Link href={`/clients/${a.client_id}`}>{a.message}</Link>
                    ) : (
                      a.message
                    )}
                  </span>
                  <time dateTime={a.created_at}>{timeAgo(a.created_at)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">{t.overview.noActivity}</p>
          )}
        </section>
      </div>

      {hasSample && db.kind === "demo" ? (
        <section className="card card-pad" style={{ marginTop: 16 }}>
          <div className="btn-row" style={{ justifyContent: "space-between" }}>
            <p className="small muted" style={{ maxWidth: "70ch" }}>
              {t.overview.removeSampleHint}
            </p>
            <form action={removeSampleData}>
              <SubmitButton className="btn btn--ghost btn--sm" confirm={t.overview.removeSampleConfirm}>
                {t.overview.removeSample}
              </SubmitButton>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
