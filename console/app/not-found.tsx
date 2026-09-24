import Link from "next/link";
import { t } from "@/lib/strings";

export default function NotFound() {
  return (
    <main className="login">
      <div className="login-card">
        <h1>{t.errors.notFound}</h1>
        <p style={{ marginTop: 16 }}>
          <Link href="/">{t.nav.overview}</Link>
        </p>
      </div>
    </main>
  );
}
