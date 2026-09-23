import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/ClientForm";
import { getDb } from "@/lib/db";
import { fmt, t } from "@/lib/strings";

export const metadata: Metadata = { title: t.edit };

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getDb().getClient(id);
  if (!client) notFound();
  return (
    <>
      <Link className="crumb" href={`/clients/${client.id}`}>
        ← {client.business_name}
      </Link>
      <div className="page-head">
        <div>
          <h1>{fmt(t.clients.editTitle, { name: client.business_name })}</h1>
        </div>
      </div>
      <ClientForm id={client.id} initial={{ ...client, links: client.links.join("\n") }} cancelHref={`/clients/${client.id}`} />
    </>
  );
}
