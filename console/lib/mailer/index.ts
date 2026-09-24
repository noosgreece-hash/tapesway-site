import "server-only";
import { getDb } from "../db";
import { env, resendEnabled } from "../env";

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
  kind: "lead_alert" | "weekly_pack" | string;
  /** Where "Reply" goes; falls back to EMAIL_REPLY_TO. The lead alert uses the visitor's address. */
  replyTo?: string;
}

export interface Mailer {
  readonly kind: "resend" | "outbox";
  send(email: Email): Promise<{ id: string }>;
}

/** Demo email: nothing leaves the machine; the message is stored and shown under Outbox (demo). */
const outboxMailer: Mailer = {
  kind: "outbox",
  async send(email) {
    const saved = await getDb().addOutbox({ ...email, from: env.emailFrom });
    return { id: saved.id };
  },
};

/** Resend (https://resend.com) over its HTTP API; a copy is kept in the outbox table. */
const resendMailer: Mailer = {
  kind: "resend",
  async send(email) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.replyTo || env.emailReplyTo ? { reply_to: email.replyTo || env.emailReplyTo } : {}),
        tags: [{ name: "kind", value: email.kind.replace(/[^a-zA-Z0-9_-]/g, "_") }],
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(`Resend refused the email (${res.status}): ${body.message || "unknown error"}`);
    await getDb()
      .addOutbox({ ...email, from: env.emailFrom })
      .catch(() => undefined);
    return { id: body.id || "" };
  },
};

export function getMailer(): Mailer {
  return resendEnabled() ? resendMailer : outboxMailer;
}
