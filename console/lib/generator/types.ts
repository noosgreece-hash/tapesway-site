import type { Client, ContentItem, Lang } from "../types";

/** One draft video as a generator returns it. */
export interface Draft {
  title: string;
  script: string;
  captions: Partial<Record<Lang, string>>;
  hashtags: string[];
  /** URL or storage path of the finished video; null when there is no file yet. */
  media_url: string | null;
}

/**
 * Makes a client's weekly content. v1 ships the demo generator (text drafts only).
 * A real video provider (for example Higgsfield) implements the same interface and
 * is selected in lib/generator/index.ts.
 */
export interface Generator {
  readonly name: string;
  /** Drafts the whole week for one client. */
  generateWeek(input: { client: Client; week: string }): Promise<Draft[]>;
  /** Redoes one item, applying the owner's review notes. */
  reviseItem(input: { client: Client; week: string; item: ContentItem; notes: string }): Promise<Draft>;
}
