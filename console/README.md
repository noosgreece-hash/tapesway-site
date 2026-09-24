# tapesway console

The private admin console: website leads, clients, weekly generation, review and
delivery emails. A Next.js app in this folder, deployed as its own Vercel project
(separate from the website at the repository root).

## Run it locally

```sh
cd console
npm install
npm run dev        # http://localhost:3000, password "demo"
npm test
```

With no settings it runs in demo mode: data in `.data/store.json`, sample leads and
clients, and emails shown on the Outbox page instead of being sent.

## Put it online (console.tapesway.com)

1. **Supabase.** Open the SQL editor, paste `supabase/migrations/20260923000000_console_init.sql`
   and run it. Then run, with the owner's email in lowercase:
   `insert into public.console_owners (email) values ('owner@example.com');`
   Under Authentication > Users, add the same email with a password (tick auto-confirm).
   Under Authentication > Sign In / Providers, turn off "Allow new users to sign up".
2. **Vercel.** Add a new project from this repository and set **Root Directory** to
   `console`. Vercel detects Next.js.
3. **Environment variables** (Vercel > the console project > Settings > Environment Variables),
   all described in `.env.example`:
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_EMAILS`,
   `RESEND_API_KEY`, `EMAIL_FROM`, `PUBLIC_BASE_URL=https://console.tapesway.com`.
   Redeploy after adding them.
4. **Domain.** In the console project > Settings > Domains, add `console.tapesway.com`
   and create the CNAME record Vercel shows at the domain registrar.
5. **Website form.** In the website's `content.js`, set
   `formEndpoint: "https://console.tapesway.com/api/leads"`. The console accepts posts from
   the addresses in `ALLOWED_ORIGINS` (tapesway.com and www.tapesway.com by default).

`/api/health` answers `{ ok: true }` with the mode (demo or Supabase) once the console is up.

## Not built yet

Real video generation (`lib/generator/`), the AI reviewer (`lib/reviewer/`), payments,
trends and analytics.
