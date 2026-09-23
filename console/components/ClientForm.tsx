"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveClient, type ClientFormState } from "@/app/actions";
import { t } from "@/lib/strings";
import { LANGS, type Client } from "@/lib/types";

export type ClientFormValues = Partial<Omit<Client, "links">> & { links?: string };

export function ClientForm({ initial, id, cancelHref }: { initial: ClientFormValues; id?: string; cancelHref: string }) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(saveClient, null);
  const f = t.clients.form;
  const errors = state?.errors || {};
  // After a failed save, show what was typed rather than the original values.
  const v = (key: string): string => {
    const typed = state?.values?.[key];
    if (typeof typed === "string") return typed;
    const orig = (initial as Record<string, unknown>)[key];
    return typeof orig === "string" ? orig : "";
  };
  const langs: string[] = (state?.values?.languages as string[] | undefined) ?? (state ? [] : initial.languages || ["EN"]);

  const text = (name: string, label: string, opts: { required?: boolean; type?: string; hint?: string; placeholder?: string; full?: boolean; auto?: string } = {}) => (
    <div className={`field${opts.full ? " full" : ""}`}>
      <label htmlFor={`c-${name}`}>
        {label}
        {opts.required ? (
          <span className="req" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <input
        className="input"
        id={`c-${name}`}
        name={name}
        type={opts.type || "text"}
        defaultValue={v(name)}
        key={`${name}-${v(name)}`}
        required={opts.required}
        placeholder={opts.placeholder}
        autoComplete={opts.auto || "off"}
        aria-invalid={errors[name] ? "true" : undefined}
        aria-describedby={errors[name] ? `c-${name}-err` : opts.hint ? `c-${name}-hint` : undefined}
      />
      {errors[name] ? (
        <span className="err" id={`c-${name}-err`}>
          {errors[name]}
        </span>
      ) : opts.hint ? (
        <span className="hint" id={`c-${name}-hint`}>
          {opts.hint}
        </span>
      ) : null}
    </div>
  );

  const area = (name: string, label: string, opts: { hint?: string; placeholder?: string; rows?: number } = {}) => (
    <div className="field full">
      <label htmlFor={`c-${name}`}>{label}</label>
      <textarea
        className="textarea"
        id={`c-${name}`}
        name={name}
        rows={opts.rows || 3}
        defaultValue={v(name)}
        key={`${name}-${v(name)}`}
        placeholder={opts.placeholder}
        aria-describedby={opts.hint ? `c-${name}-hint` : undefined}
      />
      {opts.hint ? (
        <span className="hint" id={`c-${name}-hint`}>
          {opts.hint}
        </span>
      ) : null}
    </div>
  );

  return (
    <form action={action} className="card" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {initial.created_from_lead ? <input type="hidden" name="created_from_lead" value={initial.created_from_lead} /> : null}
      {Object.keys(errors).length ? (
        <div className="notice notice--bad" role="alert" style={{ margin: "18px 22px 0" }}>
          {errors.form || f.fixErrors}
        </div>
      ) : null}

      <div className="form-section">
        <h2>{f.sectionBusiness}</h2>
        <div className="form-grid">
          {text("business_name", f.business_name, { required: true, auto: "organization" })}
          {text("business_type", f.business_type, { hint: f.businessTypeHint })}
          {text("island", f.island)}
          {text("plan", f.plan)}
          <div className="field">
            <label htmlFor="c-status">{f.status}</label>
            <select className="select" id="c-status" name="status" defaultValue={v("status") || "active"} key={`status-${v("status")}`}>
              <option value="active">{t.clients.statuses.active}</option>
              <option value="paused">{t.clients.statuses.paused}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>{f.sectionContact}</h2>
        <div className="form-grid">
          {text("contact_name", f.contact_name, { auto: "name" })}
          {text("email", f.email, { required: true, type: "email", hint: f.emailHint, auto: "email" })}
          {text("phone", f.phone, { type: "tel", auto: "tel" })}
        </div>
      </div>

      <div className="form-section">
        <h2>{f.sectionBrief}</h2>
        <div className="form-grid">
          <fieldset className="field full" aria-describedby={errors.languages ? "c-lang-err" : "c-lang-hint"}>
            <legend>
              {f.languages}
              <span className="req" aria-hidden="true">
                *
              </span>
            </legend>
            <div className="checks" key={`langs-${langs.join(",")}`}>
              {LANGS.map((l) => (
                <label key={l}>
                  <input type="checkbox" name="languages" value={l} defaultChecked={langs.includes(l)} />
                  {t.clients.langs[l]} <span className="chip">{l}</span>
                </label>
              ))}
            </div>
            {errors.languages ? (
              <span className="err" id="c-lang-err">
                {errors.languages}
              </span>
            ) : (
              <span className="hint" id="c-lang-hint">
                {f.languagesHint}
              </span>
            )}
          </fieldset>
          {text("tone_of_voice", f.tone_of_voice, { placeholder: f.tonePlaceholder })}
          {text("audience", f.audience, { placeholder: f.audiencePlaceholder })}
          {area("dos", f.dos)}
          {area("donts", f.donts)}
          {area("links", f.links, { hint: f.linksHint, rows: 3 })}
        </div>
      </div>

      <div className="form-section">
        <h2>{f.sectionAccount}</h2>
        <div className="form-grid">{area("notes", f.notes, { rows: 3 })}</div>
      </div>

      <div className="form-foot">
        <Link className="btn btn--ghost" href={cancelHref}>
          {t.cancel}
        </Link>
        <button className="btn" type="submit" disabled={pending}>
          {id ? f.submitEdit : f.submitNew}
        </button>
      </div>
    </form>
  );
}
