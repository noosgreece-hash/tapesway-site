import "server-only";
import { supabaseEnabled } from "../env";
import { createDemoDb } from "./demo";
import { createSupabaseDb } from "./supabase";
import type { Db } from "./types";

export type { Db, JobRequest, NewItem, NewLead } from "./types";

const g = globalThis as unknown as { __twDb?: Db };

/** The data layer: Supabase when configured, otherwise the demo JSON store. */
export function getDb(): Db {
  if (!g.__twDb) g.__twDb = supabaseEnabled() ? createSupabaseDb() : createDemoDb();
  return g.__twDb;
}
