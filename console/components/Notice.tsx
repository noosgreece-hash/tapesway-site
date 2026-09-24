import { t } from "@/lib/strings";

// Flash messages come back from actions as ?notice=key or ?error=key. Only known keys
// are shown, so nothing from the URL is ever printed.

const NOTICES: Record<string, string> = {
  lead_status: t.leads.statusSaved,
  client_created: t.clients.created,
  client_saved: t.clients.saved,
  sent: t.deliveries.sentOk,
  sample_removed: t.overview.sampleRemoved,
};

const ERRORS: Record<string, string> = {
  nothing_selected: t.jobs.nothingSelected,
  no_email: t.deliveries.noEmail,
  not_all_approved: t.deliveries.notAllApproved,
  send_failed: t.deliveries.sendFailed,
  not_found: t.errors.notFound,
};

export function Notice({ notice, error }: { notice?: string | string[]; error?: string | string[] }) {
  const n = typeof notice === "string" ? NOTICES[notice] : undefined;
  const e = typeof error === "string" ? ERRORS[error] : undefined;
  if (!n && !e) return null;
  return (
    <div className={`notice ${e ? "notice--bad" : "notice--ok"}`} role={e ? "alert" : "status"}>
      {e || n}
    </div>
  );
}
