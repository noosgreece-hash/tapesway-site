import { logout } from "@/app/login/actions";
import { Brand } from "@/components/Brand";
import { MobileMenu } from "@/components/MobileMenu";
import { NavLinks } from "@/components/NavLinks";
import { requireOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isDemoData, resendEnabled } from "@/lib/env";
import { t } from "@/lib/strings";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  const db = getDb();
  const [leads, pending] = await Promise.all([db.listLeads({ status: "new" }), db.listItems({ reviewStatus: "pending" })]);
  const counts = { leads: leads.length, review: pending.length, showOutbox: !resendEnabled() };
  const demo = isDemoData();

  const foot = (
    <div className="side-foot">
      {demo ? (
        <p className="demo-flag" title={t.demoBadgeHint}>
          <strong>{t.demoBadge}</strong>
          <span>{t.demoBadgeHint}</span>
        </p>
      ) : null}
      <form action={logout}>
        <button className="link-btn" type="submit">
          {t.signOut}
        </button>
      </form>
    </div>
  );

  return (
    <div className="shell">
      <aside className="side">
        <Brand />
        <NavLinks counts={counts} />
        {foot}
      </aside>
      <header className="topbar">
        <div className="topbar-row">
          <Brand sub={false} />
          <MobileMenu>
            <NavLinks counts={counts} />
            {foot}
          </MobileMenu>
        </div>
      </header>
      <main className="main" id="main">
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
