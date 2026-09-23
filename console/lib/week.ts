// ISO weeks ("2026-W39", Monday to Sunday), counted in Greek time.

const TZ = "Europe/Athens";

function athensToday(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}

export function isoWeekOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function currentWeek(now = new Date()): string {
  return isoWeekOf(athensToday(now));
}

export function weekStart(week: string): Date {
  const m = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!m) throw new Error("Bad week: " + week);
  const year = Number(m[1]);
  const w = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (w - 1) * 7);
  return monday;
}

export function shiftWeek(week: string, by: number): string {
  const d = weekStart(week);
  d.setUTCDate(d.getUTCDate() + by * 7);
  return isoWeekOf(d);
}

export function isWeek(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(value);
}

export function weekNumber(week: string): number {
  return Number(week.slice(-2));
}

/** "22–28 Sep 2026" (en) or "22–28 Σεπτεμβρίου 2026" (el). */
export function weekRange(week: string, locale: "en" | "el" = "en"): string {
  const start = weekStart(week);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const loc = locale === "el" ? "el-GR" : "en-GB";
  const month = locale === "el" ? "long" : "short";
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: "UTC", ...opts }).format(d);
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()}–${fmt(end, { day: "numeric", month, year: "numeric" })}`;
  }
  return `${fmt(start, { day: "numeric", month })} – ${fmt(end, { day: "numeric", month, year: "numeric" })}`;
}
