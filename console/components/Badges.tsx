import { fmt, t } from "@/lib/strings";
import type { WeekState } from "@/lib/status";
import type { AiVerdict, ClientStatus, JobStatus, LeadStatus } from "@/lib/types";

const leadTone: Record<LeadStatus, string> = { new: "info", contacted: "", proposal: "warn", won: "ok", lost: "bad" };

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`badge badge--dot ${leadTone[status] ? "badge--" + leadTone[status] : ""}`}>{t.leads.statuses[status]}</span>;
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <span className={`badge ${status === "active" ? "badge--ok" : ""}`}>{t.clients.statuses[status]}</span>;
}

export function SampleBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="badge badge--sample" title={t.sampleHint}>
      {t.sample}
    </span>
  );
}

export function WeekStateBadge({ state }: { state: WeekState }) {
  const w = t.clients.weekState;
  switch (state.kind) {
    case "none":
      return <span className="badge">{w.none}</span>;
    case "generating":
      return (
        <span className="badge badge--info">
          <span className="spinner" aria-hidden="true" /> {w.generating}
        </span>
      );
    case "failed":
      return <span className="badge badge--bad">{w.failed}</span>;
    case "review":
      return <span className="badge badge--warn">{fmt(w.review, { a: state.approved, n: state.total })}</span>;
    case "approved":
      return <span className="badge badge--ok">{w.approved}</span>;
    case "sent":
      return <span className="badge badge--ok badge--dot">{w.sent}</span>;
  }
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const j = t.jobs;
  if (status === "generating")
    return (
      <span className="badge badge--info">
        <span className="spinner" aria-hidden="true" /> {j.generating}
      </span>
    );
  if (status === "ready") return <span className="badge badge--ok">{j.ready}</span>;
  if (status === "failed") return <span className="badge badge--bad">{j.failed}</span>;
  return <span className="badge">{j.queued}</span>;
}

export function AiVerdictSlot({ verdict, notes, enabled }: { verdict: AiVerdict | null; notes: string | null; enabled: boolean }) {
  if (!enabled || !verdict) return <span className="ai-slot">{t.review.aiNotSetUp}</span>;
  const tone = verdict === "green" ? "ok" : verdict === "yellow" ? "warn" : "bad";
  return (
    <span className={`badge badge--dot badge--${tone}`} title={notes || undefined}>
      {t.review.aiReview}: {t.review.ai[verdict]}
    </span>
  );
}
