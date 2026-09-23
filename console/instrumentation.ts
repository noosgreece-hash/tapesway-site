// Runs once when the server starts. In production the console refuses to start
// without its login settings (see lib/env.ts configProblems).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { checkConfigOnStart } = await import("./lib/startup");
    checkConfigOnStart();
  }
}
