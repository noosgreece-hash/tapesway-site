import { fmt, t } from "./strings";

export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return t.none;
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return t.activityTime.justNow;
  if (mins < 60) return fmt(t.activityTime.minutes, { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 48) return fmt(t.activityTime.hours, { n: hours });
  return fmt(t.activityTime.days, { n: Math.round(hours / 24) });
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return t.none;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Athens",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
