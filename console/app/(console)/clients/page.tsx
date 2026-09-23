import type { Metadata } from "next";
import Link from "next/link";
import { ClientsTable, type ClientRow } from "@/components/ClientsTable";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Notice } from "@/components/Notice";
import { getDb } from "@/lib/db";
import { groupBy, weekState } from "@/lib/status";
import { t } from "@/lib/strings";
import { currentWeek, shiftWeek } from "@/lib/week";

export const metadata: Metadata = { title: t.clients.title };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const db = getDb();
  const week = currentWeek();
  const [clients, items, jobs, deliveries] = await Promise.all([db.listClients(), db.listItems({ week }), db.listJobs({ week }), db.listDeliveries({ week })]);
  const itemsBy = groupBy(items, (i) => i.client_id);
  const jobsBy = groupBy(jobs, (j) => j.client_id);
  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    business_name: c.business_name,
    contact_name: c.contact_name,
    email: c.email,
    island: c.island,
    business_type: c.business_type,
    languages: c.languages,
    plan: c.plan,
    status: c.status,
    sample: c.sample,
    state: weekState(itemsBy.get(c.id) || [], jobsBy.get(c.id) || [], deliveries.find((d) => d.client_id === c.id)),
  }));
  const anyActive = jobs.some((j) => j.status === "queued" || j.status === "generating");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.clients.title}</h1>
          <p>{t.clients.lead}</p>
        </div>
        <div className="actions">
          <LiveRefresh active={anyActive} />
          <Link className="btn" href="/clients/new">
            {t.clients.add}
          </Link>
        </div>
      </div>
      <Notice notice={sp.notice} error={sp.error} />
      <ClientsTable rows={rows} weeks={[week, shiftWeek(week, 1)]} />
    </>
  );
}
