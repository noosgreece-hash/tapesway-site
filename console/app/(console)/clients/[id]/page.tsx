import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generateForClient, sendPack } from "@/app/actions";
import { ClientStatusBadge, SampleBadge, WeekStateBadge } from "@/components/Badges";
import { CopyButton } from "@/components/CopyButton";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { getDb } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { groupBy, weekState } from "@/lib/status";
import { fmt, t } from "@/lib/strings";
import { baseUrl } from "@/lib/url";
import { currentWeek, weekRange } from "@/lib/week";

export const metadata: Metadata = { title: t.clients.title };

const reviewTone = { pending: "badge--warn", approved: "badge--ok", changes_requested: "badge--info" } as const;
const reviewLabel = { pending: t.review.filterPending, approved: t.review.approved, changes_requested: t.review.filterChanges };

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const db = getDb();
  const client = await db.getClient(id);
  if (!client) notFound();
  const [items, jobs, deliveries] = await Promise.all([db.listItems({ clientId: id }), db.listJobs({ clientId: id }), db.listDeliveries({ clientId: id })]);
  const lead = client.created_from_lead ? await db.getLead(client.created_from_lead) : null;
  const week = currentWeek();
  const itemsBy = groupBy(items, (i) => i.week);
  const jobsBy = groupBy(jobs, (j) => j.week);
  const weeks = Array.from(new Set([week, ...itemsBy.keys(), ...jobsBy.keys(), ...deliveries.map((d) => d.week)])).sort().reverse();
  const anyActive = jobs.some((j) => j.status === "queued" || j.status === "generating");
  const origin = await baseUrl();
  const d = t.clients.detail;

  return (
    <>
      <Link className="crumb" href="/clients">
        ← {t.clients.title}
      </Link>
      <div className="page-head">
        <div>
          <h1>
            {client.business_name} <SampleBadge show={client.sample} />
          </h1>
          <p>
            {[client.business_type, client.island].filter(Boolean).join(" · ") || t.none} · <ClientStatusBadge status={client.status} />
          </p>
        </div>
        <div className="actions">
          <LiveRefresh active={anyActive} />
          <Link className="btn btn--ghost" href={`/clients/${client.id}/edit`}>
            {t.edit}
          </Link>
        </div>
      </div>
      <Notice notice={sp.notice} error={sp.error} />

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <section className="card card-pad">
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>{d.contact}</h2>
          <dl className="dl">
            <dt>{t.clients.form.contact_name}</dt>
            <dd>{client.contact_name || t.none}</dd>
            <dt>{t.clients.form.email}</dt>
            <dd>{client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : t.none}</dd>
            <dt>{t.clients.form.phone}</dt>
            <dd>{client.phone || t.none}</dd>
            <dt>{t.clients.form.plan}</dt>
            <dd>{client.plan || t.none}</dd>
            <dt>{t.clients.form.languages}</dt>
            <dd>{client.languages.map((l) => t.clients.langs[l]).join(", ")}</dd>
            <dt>{t.clients.form.links}</dt>
            <dd>
              {client.links.length
                ? client.links.map((l) => (
                    <div key={l}>
                      {/^https?:\/\//.test(l) ? (
                        <a href={l} target="_blank" rel="noreferrer noopener">
                          {l}
                        </a>
                      ) : (
                        l
                      )}
                    </div>
                  ))
                : t.none}
            </dd>
            {lead ? (
              <>
                <dt>{d.fromLead}</dt>
                <dd>
                  <Link href={`/leads/${lead.id}`}>{lead.name}</Link>
                </dd>
              </>
            ) : null}
          </dl>
        </section>
        <section className="card card-pad">
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>{d.brief}</h2>
          <dl className="dl">
            <dt>{t.clients.form.tone_of_voice}</dt>
            <dd>{client.tone_of_voice || t.none}</dd>
            <dt>{t.clients.form.audience}</dt>
            <dd>{client.audience || t.none}</dd>
            <dt>{t.clients.form.dos}</dt>
            <dd className="pre">{client.dos || t.none}</dd>
            <dt>{t.clients.form.donts}</dt>
            <dd className="pre">{client.donts || t.none}</dd>
            <dt>{d.notes}</dt>
            <dd className="pre">{client.notes || t.none}</dd>
          </dl>
        </section>
      </div>

      <h2 style={{ margin: "28px 0 12px" }}>{d.weeks}</h2>
      <div className="stack">
        {weeks.map((w) => {
          const wItems = itemsBy.get(w) || [];
          const wJobs = jobsBy.get(w) || [];
          const delivery = deliveries.find((x) => x.week === w);
          const state = weekState(wItems, wJobs, delivery);
          const failed = wJobs.find((j) => j.status === "failed");
          return (
            <section className="card" key={w}>
              <div className="card-head" style={{ flexWrap: "wrap" }}>
                <h3>
                  {w} <span className="muted small">· {weekRange(w)}</span>
                </h3>
                <WeekStateBadge state={state} />
              </div>
              <div className="card-pad stack">
                {wItems.length ? (
                  <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
                    {wItems.map((i) => (
                      <li key={i.id}>
                        <span style={{ fontWeight: 600 }}>{i.title}</span> <span className="muted small">{fmt(t.review.version, { n: i.version })}</span>{" "}
                        <span className={`badge ${reviewTone[i.review_status]}`}>{reviewLabel[i.review_status]}</span>
                      </li>
                    ))}
                  </ol>
                ) : state.kind === "generating" ? null : (
                  <p className="muted">{d.noWeeks}</p>
                )}
                {failed && state.kind !== "review" && state.kind !== "approved" && state.kind !== "sent" ? (
                  <p className="notice notice--bad" style={{ margin: 0 }}>
                    {failed.error}
                  </p>
                ) : null}
                {delivery?.sent_at ? (
                  <p className="small muted">
                    {fmt(t.deliveries.sent, { when: dateTime(delivery.sent_at) })} ·{" "}
                    {delivery.opened_at ? fmt(t.deliveries.opened, { when: dateTime(delivery.opened_at) }) : t.deliveries.notOpened} ·{" "}
                    {fmt(t.deliveries.downloads, { n: delivery.downloads.length })}
                  </p>
                ) : null}
                <div className="btn-row">
                  {state.kind === "none" || state.kind === "failed" ? (
                    <form action={generateForClient}>
                      <input type="hidden" name="client_id" value={client.id} />
                      <input type="hidden" name="week" value={w} />
                      <SubmitButton className="btn btn--sm">{fmt(d.generateThis, { week: w })}</SubmitButton>
                    </form>
                  ) : null}
                  {state.kind === "review" ? (
                    <Link className="btn btn--sm" href={`/review?client=${client.id}`}>
                      {d.review}
                    </Link>
                  ) : null}
                  {state.kind === "approved" || state.kind === "sent" ? (
                    <form action={sendPack}>
                      <input type="hidden" name="client_id" value={client.id} />
                      <input type="hidden" name="week" value={w} />
                      <input type="hidden" name="back" value="client" />
                      <SubmitButton className="btn btn--sm" pending={t.deliveries.sending}>
                        {state.kind === "sent" ? t.deliveries.resend : t.deliveries.send}
                      </SubmitButton>
                    </form>
                  ) : null}
                  {delivery?.sent_at ? (
                    <>
                      <a className="btn btn--ghost btn--sm" href={`/d/${delivery.token}`} target="_blank" rel="noreferrer">
                        {t.deliveries.preview}
                      </a>
                      <CopyButton text={`${origin}/d/${delivery.token}`} label={t.deliveries.copyLink} done={t.copied} />
                    </>
                  ) : null}
                  {wItems.length && state.kind !== "generating" ? (
                    <form action={generateForClient}>
                      <input type="hidden" name="client_id" value={client.id} />
                      <input type="hidden" name="week" value={w} />
                      <input type="hidden" name="regenerate" value="1" />
                      <SubmitButton className="btn btn--text btn--sm" confirm={d.regenerateConfirm}>
                        {d.regenerateWeek}
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
