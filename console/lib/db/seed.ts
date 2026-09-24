import { randomBytes, randomUUID } from "node:crypto";
import { draftWeek } from "../generator/demo";
import type { Activity, Client, ContentItem, Delivery, Lang, Lead } from "../types";
import { currentWeek, shiftWeek } from "../week";
import type { Store } from "./demo";

// Obviously fake sample data for demo mode only. Every record has sample: true and
// the console labels it "Sample". Remove it from the Overview page.

type SampleClient = [name: string, island: string, type: string, langs: Lang[], tone: string, audience: string, status?: "paused"];

const CLIENTS: SampleClient[] = [
  ["Sample Villa Aegean", "Mykonos", "Villa", ["EN", "DE"], "Calm, understated luxury", "Couples and families, 35–60, from Germany and the UK"],
  ["Sample Caldera Suites", "Santorini", "Boutique hotel", ["EN", "FR", "EL"], "Romantic, light", "Honeymooners"],
  ["Sample Taverna Thalassa", "Paros", "Restaurant", ["EN", "EL"], "Warm, family, generous", "Island visitors and locals"],
  ["Sample Sunset Beach Bar", "Ios", "Beach bar", ["EN"], "Playful, sunny", "Travellers in their 20s and 30s"],
  ["Sample Blue Sail Cruises", "Milos", "Boat tours", ["EN", "DE", "FR"], "Adventurous, friendly", "Active travellers"],
  ["Sample Olive Grove Hotel", "Crete", "Hotel", ["EN", "DE", "EL"], "Authentic, rooted", "Families"],
  ["Sample Windmill Café", "Naxos", "Café", ["EN", "EL"], "Relaxed", "Day visitors"],
  ["Sample Stone House Villas", "Sifnos", "Villa", ["EN", "FR"], "Quiet, crafted", "Slow travellers", "paused"],
];

export function sampleStore(): Store {
  const now = new Date();
  const iso = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60000).toISOString();
  const lastWeek = shiftWeek(currentWeek(now), -1);

  const clients: Client[] = CLIENTS.map(([name, island, type, langs, tone, audience, status], i) => ({
    id: randomUUID(),
    business_name: name,
    contact_name: `Sample contact ${i + 1}`,
    email: `sample${i + 1}@example.com`,
    phone: "",
    island,
    business_type: type,
    languages: langs,
    tone_of_voice: tone,
    audience,
    dos: "Show real guests' moments, natural light.",
    donts: "No stock footage, no prices on screen.",
    links: ["https://example.com"],
    plan: "Sample plan",
    status: status || "active",
    notes: "Sample record for the demo. Remove sample data on the Overview page.",
    created_from_lead: null,
    sample: true,
    created_at: iso(60 * 24 * (30 - i)),
    updated_at: iso(60 * 24 * (30 - i)),
  }));

  const leads: Lead[] = [
    ["Sample lead: Anna", "Sample Pool Villas", "Mykonos", "Villa", "new", 90],
    ["Sample lead: Nikos", "Sample Harbour Taverna", "Syros", "Restaurant", "contacted", 60 * 26],
    ["Sample lead: Sophie", "Sample Cliff Suites", "Folegandros", "Hotel", "proposal", 60 * 24 * 4],
  ].map(([name, business, island, type, status, ago], i) => ({
    id: randomUUID(),
    name: name as string,
    business: business as string,
    email: `sample-lead${i + 1}@example.com`,
    island: island as string,
    business_type: type as string,
    message: "Sample message for the demo: we would like weekly videos for next season.",
    source: "sample",
    status: status as Lead["status"],
    client_id: null,
    sample: true,
    created_at: iso(ago as number),
    updated_at: iso(ago as number),
  }));

  // Last week, two sample clients were generated, approved and sent; one opened the pack.
  const items: ContentItem[] = [];
  const deliveries: Delivery[] = [];
  const activity: Activity[] = [];
  clients.slice(0, 2).forEach((client, ci) => {
    draftWeek(client, lastWeek).forEach((d, i) => {
      items.push({
        ...d,
        id: randomUUID(),
        client_id: client.id,
        week: lastWeek,
        job_id: null,
        kind: "video",
        slot: i + 1,
        review_status: "approved",
        review_notes: null,
        ai_verdict: null,
        ai_notes: null,
        version: 1,
        sample: true,
        created_at: iso(60 * 24 * 6),
        updated_at: iso(60 * 24 * 5),
        approved_at: iso(60 * 24 * 5),
      });
    });
    deliveries.push({
      id: randomUUID(),
      client_id: client.id,
      week: lastWeek,
      token: randomBytes(24).toString("base64url"),
      sent_at: iso(60 * 24 * 5 - 30),
      sent_to: client.email,
      opened_at: ci === 0 ? iso(60 * 24 * 4) : null,
      last_opened_at: ci === 0 ? iso(60 * 24 * 4) : null,
      open_count: ci === 0 ? 1 : 0,
      downloads: [],
      sample: true,
      created_at: iso(60 * 24 * 5 - 30),
    });
    activity.push({
      id: randomUUID(),
      kind: "sample",
      message: `Sample: week's pack sent to ${client.business_name}`,
      client_id: client.id,
      lead_id: null,
      created_at: iso(60 * 24 * 5 - 30),
    });
  });

  return { version: 1, leads, clients, jobs: [], items, deliveries, outbox: [], activity };
}
