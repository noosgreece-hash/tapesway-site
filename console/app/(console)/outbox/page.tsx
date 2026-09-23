import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { resendEnabled } from "@/lib/env";
import { dateTime } from "@/lib/format";
import { t } from "@/lib/strings";

export const metadata: Metadata = { title: t.outbox.title };

export default async function OutboxPage() {
  const emails = await getDb().listOutbox(200);
  const live = resendEnabled();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t.outbox.title}</h1>
          <p>{live ? t.outbox.liveNote : t.outbox.lead}</p>
        </div>
      </div>
      <section className="card">
        {emails.length ? (
          emails.map((e) => (
            <details className="mail" key={e.id}>
              <summary>
                <span className="mail-subject">{e.subject}</span>
                <span className="badge">{t.outbox.kinds[e.kind] || e.kind}</span>
                <span className="mail-meta">
                  {t.outbox.to}: {e.to} · {t.outbox.from}: {e.from}
                </span>
                <span className="mail-meta">{dateTime(e.created_at)}</span>
              </summary>
              <div className="mail-body">
                <div className="script" style={{ maxHeight: "none" }}>
                  {e.text}
                </div>
                {e.html ? (
                  <details>
                    <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>
                      {t.outbox.showHtml}
                    </summary>
                    <iframe title={e.subject} sandbox="" srcDoc={e.html} style={{ marginTop: 10 }} />
                  </details>
                ) : null}
              </div>
            </details>
          ))
        ) : (
          <p className="empty">{t.outbox.empty}</p>
        )}
      </section>
    </>
  );
}
