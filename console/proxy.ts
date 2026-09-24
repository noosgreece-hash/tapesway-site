import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configProblems, env, supabaseEnabled } from "./lib/env";
import { SESSION_COOKIE, verifySessionValue } from "./lib/auth/session";

// Every route is private except the website form endpoint, the client delivery pages
// and the login page. Pages and server actions check the owner again themselves.

const PUBLIC = [/^\/login\/?$/, /^\/api\/leads\/?$/, /^\/d\/[^/]+(\/.*)?$/, /^\/api\/d\/[^/]+(\/.*)?$/, /^\/api\/health\/?$/];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const problems = configProblems();
  if (problems.length) {
    return new NextResponse("The console is not configured:\n- " + problems.join("\n- "), { status: 503 });
  }

  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();

  let response = NextResponse.next({ request });
  let ok = false;

  if (supabaseEnabled()) {
    const sb = createServerClient(env.supabase.url, env.supabase.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list, headers) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers || {}).forEach(([k, v]) => response.headers.set(k, String(v)));
        },
      },
    });
    const { data } = await sb.auth.getUser();
    ok = Boolean(data.user?.email) && env.ownerEmails.includes(String(data.user?.email).toLowerCase());
  } else {
    ok = await verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value, env.sessionSecret, env.consolePassword);
  }

  if (ok) {
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|fonts/|brand/|favicon.ico|robots.txt).*)"],
};
