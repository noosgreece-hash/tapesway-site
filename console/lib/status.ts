import type { ContentItem, Delivery, GenerationJob } from "./types";

export type WeekState =
  | { kind: "none" }
  | { kind: "generating" }
  | { kind: "failed" }
  | { kind: "review"; approved: number; total: number }
  | { kind: "approved"; total: number }
  | { kind: "sent"; total: number; delivery: Delivery };

/** Where one client's week stands, from its items, jobs and delivery. */
export function weekState(items: ContentItem[], jobs: GenerationJob[], delivery?: Delivery | null): WeekState {
  const active = jobs.some((j) => j.status === "queued" || j.status === "generating");
  if (active && (items.length === 0 || jobs.some((j) => j.kind === "week" && (j.status === "queued" || j.status === "generating")))) {
    return { kind: "generating" };
  }
  if (items.length === 0) {
    const latest = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return latest?.status === "failed" ? { kind: "failed" } : { kind: "none" };
  }
  const approved = items.filter((i) => i.review_status === "approved").length;
  if (approved < items.length || active) return { kind: "review", approved, total: items.length };
  // Sent, unless something was re-approved after the pack went out.
  const lastApproved = items.reduce((m, i) => (i.approved_at && i.approved_at > m ? i.approved_at : m), "");
  if (delivery?.sent_at && delivery.sent_at >= lastApproved) return { kind: "sent", total: items.length, delivery };
  return { kind: "approved", total: items.length };
}

export function groupBy<T, K extends string>(list: T[], key: (x: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const x of list) {
    const k = key(x);
    const arr = map.get(k);
    if (arr) arr.push(x);
    else map.set(k, [x]);
  }
  return map;
}
