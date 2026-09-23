import type { Metadata } from "next";
import Link from "next/link";
import { LeadStatusBadge, SampleBadge } from "@/components/Badges";
import { getDb } from "@/lib/db";
import { dateTime, timeAgo } from "@/lib/format";
import { t } from "@/lib/strings";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export const metadata: Metadata = { title: t.leads.title };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = LEAD_STATUSES.includes(sp.status as LeadStatus) ? (sp.status as LeadStatus) : undefined;
  const all = await getDb().listLeads();
  const leads = status ? all.filter((l) => l.status === status) : all;
  const count = (s?: LeadStatus) => (s ? all.filter((l) => l.status === s).length : all.length);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.leads.title}</h1>
          <p>{t.leads.lead}</p>
        </div>
      </div>
      <section className="card">
        <div className="toolbar">
          <nav className="tabs" aria-label={t.leads.colStatus}>
            <Link className="tab" href="/leads" aria-current={!status ? "page" : undefined}>
              {t.all} <span className="n">{count()}</span>
            </Link>
            {LEAD_STATUSES.map((s) => (
              <Link key={s} className="tab" href={`/leads?status=${s}`} aria-current={status === s ? "page" : undefined}>
                {t.leads.statuses[s]} <span className="n">{count(s)}</span>
              </Link>
            ))}
          </nav>
        </div>
        {leads.length ? (
          <div className="table-wrap">
            <table className="table table--stack">
              <thead>
                <tr>
                  <th>{t.leads.colName}</th>
                  <th>{t.leads.colIsland}</th>
                  <th>{t.leads.colType}</th>
                  <th>{t.leads.colStatus}</th>
                  <th className="right">{t.leads.colReceived}</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className="stack-main">
                      <Link className="cell-main" href={`/leads/${l.id}`}>
                        {l.name}
                      </Link>{" "}
                      <SampleBadge show={l.sample} />
                      <span className="cell-sub">
                        {l.business || t.none} · {l.email}
                      </span>
                    </td>
                    <td data-label={t.leads.colIsland}>{l.island || t.none}</td>
                    <td data-label={t.leads.colType}>{l.business_type || t.none}</td>
                    <td data-label={t.leads.colStatus}>
                      <LeadStatusBadge status={l.status} />
                    </td>
                    <td data-label={t.leads.colReceived} className="right nowrap" title={dateTime(l.created_at)}>
                      {timeAgo(l.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">{t.leads.empty}</p>
        )}
      </section>
    </>
  );
}
