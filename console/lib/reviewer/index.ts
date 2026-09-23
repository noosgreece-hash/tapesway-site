import type { AiVerdict, Client, ContentItem } from "../types";

export interface ReviewVerdict {
  verdict: AiVerdict; // green: pass · yellow: probably fine, owner gives the final OK · red: regenerate
  notes: string; // for red, these notes are fed into the retry
}

/**
 * Phase 2: an AI reviewer that scores each generated item before the owner sees it.
 * The jobs runner calls review() after every draft when `enabled` is true, stores the
 * verdict in content_items.ai_verdict / ai_notes, and (for red) can queue a retry with
 * the notes. v1 has no implementation: the Review page shows "AI review: not set up yet".
 */
export interface Reviewer {
  readonly name: string;
  readonly enabled: boolean;
  review(input: { client: Client; item: ContentItem }): Promise<ReviewVerdict | null>;
}

export const noReviewer: Reviewer = {
  name: "none",
  enabled: false,
  async review() {
    return null;
  },
};

export function getReviewer(): Reviewer {
  return noReviewer;
}
