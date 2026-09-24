"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/strings";

export type NavCounts = { leads: number; review: number; showOutbox: boolean };

export function NavLinks({ counts }: { counts: NavCounts }) {
  const path = usePathname();
  const items = [
    { href: "/", label: t.nav.overview },
    { href: "/leads", label: t.nav.leads, count: counts.leads },
    { href: "/clients", label: t.nav.clients },
    { href: "/jobs", label: t.nav.jobs },
    { href: "/review", label: t.nav.review, count: counts.review },
    { href: "/deliveries", label: t.nav.deliveries },
    ...(counts.showOutbox ? [{ href: "/outbox", label: t.nav.outbox }] : []),
  ];
  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <nav className="nav" aria-label={t.menu}>
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={isActive(i.href) ? "page" : undefined}>
          <span>{i.label}</span>
          {i.count ? <span className="count">{i.count}</span> : null}
        </Link>
      ))}
      <div className="nav-label">{t.nav.later}</div>
      {[
        { label: t.nav.payments, hint: t.soonPage.payments },
        { label: t.nav.trends, hint: t.soonPage.trends },
        { label: t.nav.analytics, hint: t.soonPage.analytics },
      ].map((s) => (
        <span key={s.label} className="soon-item" aria-disabled="true" title={s.hint}>
          <span>{s.label}</span>
          <span className="soon-pill">{t.soon}</span>
        </span>
      ))}
    </nav>
  );
}
