import { configProblems, supabaseEnabled } from "./env";

export function checkConfigOnStart() {
  const problems = configProblems();
  if (problems.length) {
    console.error("\n[tapesway console] Refusing to start:\n- " + problems.join("\n- ") + "\nSee console/.env.example.\n");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && !supabaseEnabled()) {
    console.warn("[tapesway console] Supabase is not configured: data is kept in a local JSON file (demo mode).");
  }
}
