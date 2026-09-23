import type { Metadata } from "next";
import Link from "next/link";
import { retryJob } from "@/app/actions";
import { JobStatusBadge, SampleBadge } from "@/components/Badges";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { getDb } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { getGenerator } from "@/lib/generator";
import { fmt, t } from "@/lib/strings";
import type { GenerationJob } from "@/lib/types";

export const metadata: Metadata = { title: t.jobs.title };

const num = (v: unknown) => (typeof v === "string" && /^\d+$/.test(v) ? Number(v) : 0);

function kindLabel(j: GenerationJob) {
  if (j.kind === "item") return t.jobs.kindItem;
  return j.regenerate ? t.jobs.kindWeekRegen : t.jobs.kindWeek;
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const db = getDb();
  const [jobs, clients] = await Promise.all([db.listJobs({ limit: 200 }), db.listClients()]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const batchId = typeof sp.batch === "string" ? sp.batch : "";
  const batch = batchId ? jobs.filter((j) => j.batch_id === batchId) : [];
  const active = jobs.filter((j) => j.status === "queued" || j.status === "generating");
  // Progress: the batch just queued, or otherwise whatever is running now.
  const tracked = batch.length ? batch : active;
  const done = tracked.filter((j) => j.status === "ready" || j.status === "failed").length;
  const queuedN = num(sp.queued);
  const skipped = [
    { n: num(sp.s_generated), text: t.jobs.skippedGenerated },
    { n: num(sp.s_progress), text: t.jobs.skippedProgress },
    { n: num(sp.s_paused), text: t.jobs.skippedPaused },
  ].filter((s) => s.n > 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.jobs.title}</h1>
          <p>{t.jobs.lead}</p>
        </div>
        <div className="actions">
          <LiveRefresh active={active.length > 0} />
          <Link className="btn btn--ghost" href="/clients">
            {t.nav.clients}
          </Link>
        </div>
      </div>
      <Notice notice={sp.notice} error={sp.error} />

      {batchId ? (
        <div className={`notice ${queuedN ? "notice--ok" : "notice--warn"}`} role="status" style={{ display: "grid", gap: 2 }}>
          {queuedN ? <span>{fmt(t.jobs.queuedSummary, { n: queuedN })}</span> : null}
          {skipped.map((s) => (
            <span key={s.text}>{fmt(s.text, { n: s.n })}</span>
          ))}
        </div>
      ) : null}

      {tracked.length ? (
        <section className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="progress-head">
            <strong>{fmt(t.jobs.progress, { done, total: tracked.length })}</strong>
            {done === tracked.length ? (
              <Link className="btn btn--sm" href="/review">
                {t.jobs.toReview}
              </Link>
            ) : null}
          </div>
          <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={tracked.length} aria-valuenow={done}>
            <span style={{ width: `${Math.round((done / tracked.length) * 100)}%` }} />
          </div>
        </section>
      ) : null}

      <section className="card">
        {jobs.length ? (
          <div className="table-wrap">
            <table className="table table--stack">
              <thead>
                <tr>
                  <th>{t.jobs.colClient}</th>
                  <th>{t.jobs.colWeek}</th>
                  <th>{t.jobs.colKind}</th>
                  <th>{t.jobs.colStatus}</th>
                  <th className="right">{t.jobs.colTime}</th>
                </tr>
              </thead>
              <tbody>
                {(batch.length ? [...batch, ...jobs.filter((j) => j.batch_id !== batchId)] : jobs).map((j) => {
                  const c = byId.get(j.client_id);
                  return (
                    <tr key={j.id} className={batchId && j.batch_id === batchId ? "is-selected" : undefined}>
                      <td className="stack-main">
                        {c ? (
                          <Link className="cell-main" href={`/clients/${c.id}`}>
                            {c.business_name}
                          </Link>
                        ) : (
                          t.none
                        )}{" "}
                        <SampleBadge show={Boolean(c?.sample)} />
                        {j.error ? <span className="cell-sub" style={{ color: "var(--bad)" }}>{j.error}</span> : null}
                      </td>
                      <td data-label={t.jobs.colWeek} className="nowrap">
                        {j.week}
                      </td>
                      <td data-label={t.jobs.colKind}>{kindLabel(j)}</td>
                      <td data-label={t.jobs.colStatus}>
                        <span className="btn-row">
                          <JobStatusBadge status={j.status} />
                          {j.status === "failed" ? (
                            <form action={retryJob}>
                              <input type="hidden" name="id" value={j.id} />
                              <SubmitButton className="btn btn--ghost btn--sm">{t.jobs.retry}</SubmitButton>
                            </form>
                          ) : null}
                        </span>
                      </td>
                      <td data-label={t.jobs.colTime} className="right nowrap">
                        {timeAgo(j.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">{t.jobs.empty}</p>
        )}
      </section>
      {getGenerator().name === "demo" ? <p className="small muted" style={{ marginTop: 12 }}>{t.jobs.generatorNote}</p> : null}
    </>
  );
}
