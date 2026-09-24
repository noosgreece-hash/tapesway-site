import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateLeadStatus } from "@/app/actions";
import { LeadStatusBadge, SampleBadge } from "@/components/Badges";
import { Notice } from "@/components/Notice";
import { SubmitButton } from "@/components/SubmitButton";
import { getDb } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { t } from "@/lib/strings";
import { LEAD_STATUSES } from "@/lib/types";

export const metadata: Metadata = { title: t.leads.title };

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const db = getDb();
  const lead = await db.getLead(id);
  if (!lead) notFound();
  const client = lead.client_id ? await db.getClient(lead.client_id) : null;

  return (
    <>
      <Link className="crumb" href="/leads">
        ← {t.leads.title}
      </Link>
      <div className="page-head">
        <div>
          <h1>{lead.name}</h1>
          <p>
            {lead.business || t.none} · {dateTime(lead.created_at)}
          </p>
        </div>
        <div className="actions">
          <a className="btn btn--ghost" href={`mailto:${lead.email}`}>
            {t.leads.reply}
          </a>
          {client ? null : (
            <Link className="btn" href={`/clients/new?fromLead=${lead.id}`}>
              {t.leads.convert}
            </Link>
          )}
        </div>
      </div>
      <Notice notice={sp.notice} error={sp.error} />
      {client ? (
        <div className="notice notice--ok">
          <span>
            {t.leads.convertedTo} <Link href={`/clients/${client.id}`}>{client.business_name}</Link>
          </span>
        </div>
      ) : null}

      <div className="grid-2">
        <section className="card card-pad">
          <dl className="dl">
            <dt>{t.leads.status}</dt>
            <dd>
              <LeadStatusBadge status={lead.status} /> <SampleBadge show={lead.sample} />
            </dd>
            <dt>{t.leads.email}</dt>
            <dd>
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
            </dd>
            <dt>{t.leads.colBusiness}</dt>
            <dd>{lead.business || t.none}</dd>
            <dt>{t.leads.colIsland}</dt>
            <dd>{lead.island || t.none}</dd>
            <dt>{t.leads.colType}</dt>
            <dd>{lead.business_type || t.none}</dd>
            <dt>{t.leads.source}</dt>
            <dd>{lead.source}</dd>
          </dl>
          <form action={updateLeadStatus} className="btn-row" style={{ marginTop: 20 }}>
            <input type="hidden" name="id" value={lead.id} />
            <label className="sr-only" htmlFor="status">
              {t.leads.status}
            </label>
            <select className="select" id="status" name="status" defaultValue={lead.status} style={{ width: "auto", minWidth: 160 }}>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.leads.statuses[s]}
                </option>
              ))}
            </select>
            <SubmitButton className="btn btn--ghost">{t.leads.updateStatus}</SubmitButton>
          </form>
        </section>
        <section className="card card-pad">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>{t.leads.message}</h2>
          <p className="pre">{lead.message}</p>
        </section>
      </div>
    </>
  );
}
