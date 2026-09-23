"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { generateWeekAction } from "@/app/actions";
import { ClientStatusBadge, SampleBadge, WeekStateBadge } from "@/components/Badges";
import type { WeekState } from "@/lib/status";
import { fmt, t } from "@/lib/strings";
import type { ClientStatus, Lang } from "@/lib/types";

export type ClientRow = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  island: string;
  business_type: string;
  languages: Lang[];
  plan: string;
  status: ClientStatus;
  sample: boolean;
  state: WeekState;
};

export function ClientsTable({ rows, weeks }: { rows: ClientRow[]; weeks: string[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | ClientStatus>("");
  const [island, setIsland] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [week, setWeek] = useState(weeks[0]);
  const [regenerate, setRegenerate] = useState(false);
  const [pending, startTransition] = useTransition();
  const allRef = useRef<HTMLInputElement>(null);

  const islands = useMemo(() => Array.from(new Set(rows.map((r) => r.island).filter(Boolean))).sort(), [rows]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!status || r.status === status) &&
        (!island || r.island === island) &&
        (!q || [r.business_name, r.contact_name, r.email, r.island, r.business_type].some((v) => v.toLowerCase().includes(q))),
    );
  }, [rows, query, status, island]);

  const shownSelected = shown.filter((r) => selected.has(r.id)).length;
  const allShownSelected = shown.length > 0 && shownSelected === shown.length;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = shownSelected > 0 && !allShownSelected;
  }, [shownSelected, allShownSelected]);

  // Forget selections of clients that no longer exist.
  useEffect(() => {
    setSelected((prev) => new Set([...prev].filter((id) => rows.some((r) => r.id === id))));
  }, [rows]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) shown.forEach((r) => next.delete(r.id));
      else shown.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function generate() {
    const ids = [...selected];
    startTransition(async () => {
      await generateWeekAction(ids, week, regenerate);
    });
  }

  const weekLabel = (w: string, i: number) => `${w} (${i === 0 ? t.thisWeek : t.nextWeek})`;

  return (
    <>
      <section className="card">
        <div className="toolbar">
          <label className="sr-only" htmlFor="client-search">
            {t.search}
          </label>
          <input
            id="client-search"
            className="input input--search grow"
            type="search"
            placeholder={t.clients.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="btn-row">
            <label className="sr-only" htmlFor="client-status">
              {t.clients.filterStatus}
            </label>
            <select id="client-status" className="select" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value as "" | ClientStatus)}>
              <option value="">
                {t.clients.filterStatus}: {t.all}
              </option>
              <option value="active">{t.clients.statuses.active}</option>
              <option value="paused">{t.clients.statuses.paused}</option>
            </select>
            <label className="sr-only" htmlFor="client-island">
              {t.clients.filterIsland}
            </label>
            <select id="client-island" className="select" style={{ width: "auto" }} value={island} onChange={(e) => setIsland(e.target.value)}>
              <option value="">{t.clients.anyIsland}</option>
              {islands.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="empty">{t.clients.empty}</p>
        ) : shown.length === 0 ? (
          <p className="empty">{t.clients.noMatch}</p>
        ) : (
          <div className="table-wrap">
            <table className="table table--stack">
              <thead>
                <tr>
                  <th className="check">
                    <label>
                      <input ref={allRef} type="checkbox" checked={allShownSelected} onChange={toggleAll} aria-label={t.clients.selectAll} />
                    </label>
                  </th>
                  <th>{t.clients.colClient}</th>
                  <th>{t.clients.colIsland}</th>
                  <th>{t.clients.colType}</th>
                  <th>{t.clients.colLanguages}</th>
                  <th>{t.clients.colStatus}</th>
                  <th>{t.clients.colWeek}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className={selected.has(r.id) ? "is-selected" : undefined}>
                    <td className="check">
                      <label>
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={fmt(t.clients.selectRow, { name: r.business_name })} />
                      </label>
                    </td>
                    <td className="stack-main">
                      <Link className="cell-main" href={`/clients/${r.id}`}>
                        {r.business_name}
                      </Link>{" "}
                      <SampleBadge show={r.sample} />
                      <span className="cell-sub">{[r.contact_name, r.email].filter(Boolean).join(" · ") || t.none}</span>
                    </td>
                    <td data-label={t.clients.colIsland}>{r.island || t.none}</td>
                    <td data-label={t.clients.colType}>{r.business_type || t.none}</td>
                    <td data-label={t.clients.colLanguages}>
                      <span className="chips">
                        {r.languages.map((l) => (
                          <span className="chip" key={l} title={t.clients.langs[l]}>
                            {l}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td data-label={t.clients.colStatus}>
                      <ClientStatusBadge status={r.status} />
                    </td>
                    <td data-label={t.clients.colWeek}>
                      <WeekStateBadge state={r.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected.size > 0 ? (
        <div className="bulkbar" role="region" aria-label={fmt(t.clients.selected, { n: selected.size })}>
          <span className="count">{fmt(t.clients.selected, { n: selected.size })}</span>
          <button type="button" className="btn btn--text btn--sm" onClick={() => setSelected(new Set())}>
            {t.clients.clear}
          </button>
          <span className="spacer" />
          <label>
            <span className="sr-only">{t.clients.weekLabel}</span>
            <select className="select" value={week} onChange={(e) => setWeek(e.target.value)}>
              {weeks.map((w, i) => (
                <option key={w} value={w}>
                  {weekLabel(w, i)}
                </option>
              ))}
            </select>
          </label>
          <label title={t.clients.regenerateHint}>
            <input type="checkbox" checked={regenerate} onChange={(e) => setRegenerate(e.target.checked)} />
            {t.clients.regenerate}
          </label>
          <button type="button" className="btn btn--light" onClick={generate} disabled={pending}>
            {pending ? t.clients.generating : week === weeks[0] ? t.clients.generate : fmt(t.clients.generateWeek, { week })}
          </button>
        </div>
      ) : null}
    </>
  );
}
