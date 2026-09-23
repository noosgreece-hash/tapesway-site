import { demoGenerator } from "./demo";
import type { Generator } from "./types";

export type { Draft, Generator } from "./types";

/**
 * Picks the content generator. v1 only has the demo generator (text drafts, no video file).
 * To add a real provider (for example Higgsfield): implement Generator in a new file,
 * upload finished videos to storage and return their path in media_url, then select it
 * here, e.g. `if (process.env.HIGGSFIELD_API_KEY) return higgsfieldGenerator;`.
 */
export function getGenerator(): Generator {
  return demoGenerator;
}
