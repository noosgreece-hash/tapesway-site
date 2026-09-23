"use client";

import { useActionState } from "react";
import { t } from "@/lib/strings";
import { login, type LoginState } from "./actions";

export function LoginForm({ next, withEmail, devHint }: { next: string; withEmail: boolean; devHint: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);
  return (
    <main className="login">
      <div className="login-card">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark-black.svg" alt="" width={27} height={30} />
          <span>
            <span className="brand-word">{t.brand}</span>
            <span className="brand-sub" style={{ color: "var(--muted)" }}>
              {t.consoleName}
            </span>
          </span>
        </div>
        <h1>{t.login.title}</h1>
        <p className="muted">{t.login.lead}</p>
        <form action={action}>
          <input type="hidden" name="next" value={next} />
          {withEmail ? (
            <div className="field">
              <label htmlFor="email">{t.login.email}</label>
              <input className="input" id="email" name="email" type="email" autoComplete="username" required />
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="password">{t.login.password}</label>
            <input className="input" id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
          </div>
          {state?.error ? (
            <p className="notice notice--bad" role="alert" style={{ margin: 0 }}>
              {state.error}
            </p>
          ) : null}
          <button className="btn" type="submit" disabled={pending}>
            {t.login.submit}
          </button>
          {devHint ? <p className="small muted">{t.login.devHint}</p> : null}
        </form>
      </div>
    </main>
  );
}
