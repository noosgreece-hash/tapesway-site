// Starts the built console (next start) in demo mode on a free port with its own data folder.
// Run `npm run build` first.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSessionValue } from "../lib/auth/session.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PASSWORD = "test-password-123";
export const SECRET = "test-secret-0123456789abcdef0123456789abcdef";

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

export async function startServer(extraEnv = {}) {
  if (!existsSync(path.join(root, ".next", "BUILD_ID"))) throw new Error("Build first: npm run build");
  const port = await freePort();
  const dataDir = mkdtempSync(path.join(tmpdir(), "tw-console-test-"));
  const child = spawn(path.join(root, "node_modules", ".bin", "next"), ["start", "-p", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      CONSOLE_PASSWORD: PASSWORD,
      SESSION_SECRET: SECRET,
      DATA_DIR: dataDir,
      DEMO_GENERATOR_DELAY_MS: "20",
      SUPABASE_URL: "",
      RESEND_API_KEY: "",
      PUBLIC_BASE_URL: "",
      ALLOWED_ORIGINS: "https://tapesway.com,http://localhost:*",
      ...extraEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base + "/api/health");
      if (r.ok) break;
    } catch {}
    if (child.exitCode !== null) throw new Error("Server exited:\n" + log);
    await new Promise((r) => setTimeout(r, 150));
  }
  const cookie = `tw_session=${await createSessionValue(SECRET, PASSWORD)}`;
  // The demo store (and its sample data) is created on first use.
  await fetch(base + "/", { headers: { cookie } });
  return {
    base,
    dataDir,
    cookie,
    log: () => log,
    store: () => JSON.parse(readFileSync(path.join(dataDir, "store.json"), "utf8")),
    async stop() {
      child.kill("SIGTERM");
      await new Promise((r) => (child.exitCode !== null ? r() : child.once("exit", r)));
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

/** Works through the generation queue until nothing is active. */
export async function drainQueue(srv) {
  for (let i = 0; i < 60; i++) {
    const r = await fetch(srv.base + "/api/jobs/tick", { method: "POST", headers: { cookie: srv.cookie } });
    const body = await r.json();
    if (body.active === 0) return;
  }
  throw new Error("queue did not drain");
}
