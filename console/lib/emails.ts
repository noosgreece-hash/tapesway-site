import type { Email } from "./mailer";
import { client as ct, fmt, t } from "./strings";
import type { Client, Lead } from "./types";
import { weekRange } from "./week";

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function layout(inner: string, lang: "en" | "el"): string {
  return `<!doctype html><html lang="${lang}"><body style="margin:0;background:#F7F8FA;padding:24px 12px;font-family:'Inter Tight',Helvetica,Arial,sans-serif;color:#111318">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(17,19,24,.12)">
<tr><td style="background:#111318;padding:18px 24px;font-family:Georgia,serif;font-size:20px;color:#ECEEF2">tapesway</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.55">${inner}</td></tr>
</table></td></tr></table></body></html>`;
}

export function leadAlertEmail(lead: Lead, to: string, consoleUrl: string): Email {
  const f = t.emails.fields;
  const rows: [string, string][] = [
    [f.name, lead.name],
    [f.business, lead.business],
    [f.email, lead.email],
    [f.island, lead.island],
    [f.type, lead.business_type],
  ];
  const link = `${consoleUrl}/leads/${lead.id}`;
  const text = [
    t.emails.leadIntro,
    "",
    ...rows.map(([k, v]) => `${k}: ${v || "–"}`),
    "",
    `${f.message}:`,
    lead.message,
    "",
    `${t.emails.leadOpen}: ${link}`,
  ].join("\n");
  const html = layout(
    `<p style="margin:0 0 16px">${esc(t.emails.leadIntro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;margin-bottom:16px">${rows
      .map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#5A6170">${esc(k)}</td><td style="padding:3px 0">${esc(v || "–")}</td></tr>`)
      .join("")}</table>
<p style="margin:0 0 6px;color:#5A6170">${esc(f.message)}</p>
<p style="margin:0 0 20px;white-space:pre-wrap">${esc(lead.message)}</p>
<p style="margin:0"><a href="${esc(link)}" style="display:inline-block;background:#1C2B4A;color:#ECEEF2;padding:11px 18px;text-decoration:none;font-weight:600">${esc(t.emails.leadOpen)}</a></p>`,
    "en",
  );
  return {
    to,
    subject: fmt(t.emails.leadSubject, { name: lead.name, business: lead.business ? ` (${lead.business})` : "" }),
    text,
    html,
    kind: "lead_alert",
    // Pressing Reply in the alert answers the person who wrote.
    ...(lead.email ? { replyTo: lead.email } : {}),
  };
}

export function weeklyPackEmail(c: Client, week: string, link: string): Email {
  const e = ct.email;
  const range = weekRange(week, "el");
  const greeting = fmt(e.greeting, { name: c.contact_name ? " " + c.contact_name : "" });
  const body = fmt(e.body, { range });
  const text = [greeting, "", body, link, "", e.after, "", e.signoff].join("\n");
  const html = layout(
    `<p style="margin:0 0 14px">${esc(greeting)}</p>
<p style="margin:0 0 20px">${esc(body)}</p>
<p style="margin:0 0 20px"><a href="${esc(link)}" style="display:inline-block;background:#1C2B4A;color:#ECEEF2;padding:12px 20px;text-decoration:none;font-weight:600">${esc(e.button)}</a></p>
<p style="margin:0 0 14px">${esc(e.after)}</p>
<p style="margin:0">${esc(e.signoff)}</p>`,
    "el",
  );
  return { to: c.email, subject: fmt(e.subject, { business: c.business_name }), text, html, kind: "weekly_pack" };
}
