import type { Metadata } from "next";
import Link from "next/link";
import { ClientForm, type ClientFormValues } from "@/components/ClientForm";
import { getDb } from "@/lib/db";
import { fmt, t } from "@/lib/strings";

export const metadata: Metadata = { title: t.clients.newTitle };

export default async function NewClientPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const lead = typeof sp.fromLead === "string" ? await getDb().getLead(sp.fromLead) : null;
  const initial: ClientFormValues = lead
    ? {
        business_name: lead.business || lead.name,
        contact_name: lead.name,
        email: lead.email,
        island: lead.island,
        business_type: lead.business_type,
        notes: lead.message,
        languages: ["EN", "EL"],
        status: "active",
        created_from_lead: lead.id,
      }
    : { languages: ["EN"], status: "active" };

  return (
    <>
      <Link className="crumb" href={lead ? `/leads/${lead.id}` : "/clients"}>
        ← {lead ? lead.name : t.clients.title}
      </Link>
      <div className="page-head">
        <div>
          <h1>{t.clients.newTitle}</h1>
          {lead ? <p>{fmt(t.clients.fromLead, { name: lead.name })}</p> : null}
        </div>
      </div>
      <ClientForm initial={initial} cancelHref={lead ? `/leads/${lead.id}` : "/clients"} />
    </>
  );
}
