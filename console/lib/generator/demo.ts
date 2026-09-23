import { env } from "../env";
import type { Client, Lang } from "../types";
import { weekNumber } from "../week";
import type { Draft, Generator } from "./types";

// Demo generator: builds text drafts (title, script, captions, hashtags) from the
// client's details. It makes no video; media_url stays empty.

type Angle = {
  key: string;
  tag: string;
  title: string;
  hook: string;
  shots: string[];
  onScreen: Record<Lang, string>;
  close: string;
  caption: Record<Lang, string>;
};

const ANGLES: Angle[] = [
  {
    key: "morning",
    tag: "morningvibes",
    title: "First light at {name}",
    hook: "Open on the sea at first light, then turn to {subject}.",
    shots: ["Wide: the view as the sun comes up", "Close: coffee being poured, breakfast set out", "Slow pan across {subject}"],
    onScreen: { EN: "Mornings on {island}", DE: "Morgens auf {island}", FR: "Le matin à {island}", EL: "{island}, πρωί" },
    close: "Hold on the view for two seconds, logo small in a corner.",
    caption: {
      EN: "The day starts slowly at {name}. Coffee, sea light and nowhere to be. {island}, first thing in the morning.",
      DE: "Bei {name} beginnt der Tag ganz langsam. Kaffee, Licht über dem Meer und keine Eile. {island} am frühen Morgen.",
      FR: "Chez {name}, la journée commence en douceur. Un café, la lumière sur la mer et rien qui presse. {island}, au petit matin.",
      EL: "Η μέρα ξεκινά αργά. Καφές, φως πάνω στη θάλασσα και καμία βιασύνη. {name} · {island}, νωρίς το πρωί.",
    },
  },
  {
    key: "behind",
    tag: "behindthescenes",
    title: "Behind the scenes at {name}",
    hook: "Hands at work, close up, before anyone arrives.",
    shots: ["Close: the team preparing {subject}", "Detail: linen, flowers, glasses, the small touches", "Wide: {subject} ready, first guests walking in"],
    onScreen: { EN: "Before you arrive", DE: "Bevor Sie ankommen", FR: "Avant votre arrivée", EL: "Πριν φτάσετε" },
    close: "End on a smile from the team.",
    caption: {
      EN: "What you don't see before guests arrive: the care that goes into every detail at {name}.",
      DE: "Was Gäste nicht sehen: die Sorgfalt, die bei {name} in jedes Detail fließt.",
      FR: "Ce que l'on ne voit pas avant l'arrivée des clients : le soin apporté à chaque détail chez {name}.",
      EL: "Αυτό που δεν βλέπετε πριν έρθουν οι επισκέπτες: η φροντίδα σε κάθε λεπτομέρεια. {name} · {island}.",
    },
  },
  {
    key: "tip",
    tag: "localtips",
    title: "A local tip from {island}",
    hook: "Start walking: “The place we tell every guest about…”",
    shots: ["Walk from {subject} towards the spot", "The spot itself: beach, lane or viewpoint", "Back at {subject}, relaxed"],
    onScreen: { EN: "Our local tip", DE: "Unser Geheimtipp", FR: "Notre bon plan", EL: "Η δική μας πρόταση" },
    close: "Text: “Save this for your trip.”",
    caption: {
      EN: "Our favourite corner of {island}, the one we tell every guest about. Save this for your trip.",
      DE: "Unser Lieblingsort auf {island} – den verraten wir jedem Gast. Speichern Sie ihn für Ihre Reise.",
      FR: "Notre coin préféré de {island}, celui dont nous parlons à tous nos clients. Enregistrez-le pour votre voyage.",
      EL: "Η αγαπημένη μας γωνιά του νησιού, αυτή που προτείνουμε σε κάθε επισκέπτη. Αποθηκεύστε τη για το ταξίδι σας. {island}.",
    },
  },
  {
    key: "detail",
    tag: "details",
    title: "The detail guests remember",
    hook: "Macro shot of one signature detail, no context yet.",
    shots: ["Macro: the detail", "Pull back to reveal where it sits in {subject}", "A guest noticing it"],
    onScreen: { EN: "The little things", DE: "Die kleinen Dinge", FR: "Les petits détails", EL: "Οι μικρές λεπτομέρειες" },
    close: "Freeze on the detail, soft fade.",
    caption: {
      EN: "It's the small things guests talk about after they leave. This is one of ours at {name}.",
      DE: "Es sind die kleinen Dinge, von denen Gäste noch lange erzählen. Das ist eines davon bei {name}.",
      FR: "Ce sont les petites choses dont les clients parlent après leur départ. En voici une chez {name}.",
      EL: "Οι μικρές λεπτομέρειες είναι αυτές που θυμούνται οι επισκέπτες. Αυτή είναι μία από τις δικές μας. {name} · {island}.",
    },
  },
  {
    key: "golden",
    tag: "goldenhour",
    title: "Golden hour on {island}",
    hook: "Sun low over the water, silhouettes.",
    shots: ["Wide: sunset over the sea", "Medium: {subject} in warm light", "Close: a glass raised against the sun"],
    onScreen: { EN: "Golden hour", DE: "Goldene Stunde", FR: "L'heure dorée", EL: "Χρυσή ώρα" },
    close: "Let the sun touch the horizon, then cut.",
    caption: {
      EN: "When the light turns gold on {island}, everything slows down. Evenings at {name}.",
      DE: "Wenn das Licht auf {island} golden wird, wird alles ruhiger. Abende bei {name}.",
      FR: "Quand la lumière devient dorée sur {island}, tout ralentit. Les soirées chez {name}.",
      EL: "Όταν το φως γίνεται χρυσό, όλα κυλούν πιο αργά. Βράδια στο νησί. {name} · {island}.",
    },
  },
  {
    key: "day",
    tag: "dayinthelife",
    title: "A day at {name} in 20 seconds",
    hook: "Fast cut: sunrise to night in the first second.",
    shots: ["Morning at {subject}", "Midday: sea, pool or lunch", "Evening: lights on at {subject}"],
    onScreen: { EN: "One day, 20 seconds", DE: "Ein Tag, 20 Sekunden", FR: "Une journée, 20 secondes", EL: "Μία μέρα, 20 δευτερόλεπτα" },
    close: "End on the night shot, slow.",
    caption: {
      EN: "From the first coffee to the last light: a whole day at {name}, in twenty seconds.",
      DE: "Vom ersten Kaffee bis zum letzten Licht: ein ganzer Tag bei {name} in zwanzig Sekunden.",
      FR: "Du premier café à la dernière lueur : une journée entière chez {name}, en vingt secondes.",
      EL: "Από τον πρώτο καφέ μέχρι το τελευταίο φως: μια ολόκληρη μέρα σε είκοσι δευτερόλεπτα. {name} · {island}.",
    },
  },
];

const GREEK_ISLANDS: Record<string, string> = {
  mykonos: "Μύκονος", santorini: "Σαντορίνη", paros: "Πάρος", antiparos: "Αντίπαρος", naxos: "Νάξος", crete: "Κρήτη",
  rhodes: "Ρόδος", corfu: "Κέρκυρα", milos: "Μήλος", ios: "Ίος", sifnos: "Σίφνος", folegandros: "Φολέγανδρος",
  zakynthos: "Ζάκυνθος", kefalonia: "Κεφαλονιά", skiathos: "Σκιάθος", hydra: "Ύδρα", syros: "Σύρος", tinos: "Τήνος",
  kos: "Κως", lefkada: "Λευκάδα", amorgos: "Αμοργός", serifos: "Σέριφος", spetses: "Σπέτσες", patmos: "Πάτμος",
};

type Kind = { match: RegExp; subject: string; tags: string[] };
const KINDS: Kind[] = [
  { match: /villa/i, subject: "the villa", tags: ["villa", "luxuryvilla"] },
  { match: /hotel|suite|resort|rooms/i, subject: "the hotel", tags: ["boutiquehotel", "hotel"] },
  { match: /restaurant|taverna|tavern|kitchen|food/i, subject: "the dining room", tags: ["greekfood", "foodie"] },
  { match: /beach/i, subject: "the beach club", tags: ["beachclub", "beachlife"] },
  { match: /bar|cafe|café|cocktail/i, subject: "the bar", tags: ["cocktails", "sunsetbar"] },
  { match: /boat|cruise|sail|yacht|tour/i, subject: "the boat", tags: ["boattrip", "sailing"] },
];

function kindOf(client: Client): Kind {
  return KINDS.find((k) => k.match.test(client.business_type)) || { match: /./, subject: "the place", tags: ["greeksummer"] };
}

function slug(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
}

function languagesOf(client: Client): Lang[] {
  return client.languages.length ? client.languages : ["EN"];
}

function buildDraft(client: Client, angle: Angle, revision?: { version: number; notes: string }): Draft {
  const kind = kindOf(client);
  const island = client.island || "the islands";
  const islandEl = GREEK_ISLANDS[slug(client.island)] || client.island || "Ελλάδα";
  const vars = { name: client.business_name, island, subject: kind.subject };
  const langs = languagesOf(client);

  const captions: Partial<Record<Lang, string>> = {};
  for (const lang of langs) captions[lang] = fill(angle.caption[lang], lang === "EL" ? { ...vars, island: islandEl } : vars);

  const lines: string[] = [];
  if (revision) {
    lines.push(`Revision ${revision.version}. Owner notes: “${revision.notes}”`);
    lines.push("(Demo generator: the notes are recorded and the angle changed; a real generator will apply them to the video.)", "");
  }
  lines.push(`Hook (0–2 s): ${fill(angle.hook, vars)}`, "Shots:");
  angle.shots.forEach((s, i) => lines.push(`${i + 1}. ${fill(s, vars)}`));
  lines.push("On-screen text:");
  for (const lang of langs) lines.push(`${lang}: ${fill(angle.onScreen[lang], lang === "EL" ? { ...vars, island: islandEl } : vars)}`);
  lines.push(`Close: ${angle.close}`, "Format: vertical 9:16, 15–25 s.");
  lines.push(`Tone: ${client.tone_of_voice || "warm, calm, unhurried"}.`);
  if (client.audience) lines.push(`Audience: ${client.audience}.`);
  if (client.dos) lines.push(`Do: ${client.dos}`);
  if (client.donts) lines.push(`Avoid: ${client.donts}`);

  const islandSlug = slug(client.island);
  const hashtags = Array.from(
    new Set([islandSlug && `#${islandSlug}`, islandSlug && `#${islandSlug}greece`, "#greekislands", "#greece", ...kind.tags.map((t) => `#${t}`), `#${angle.tag}`].filter(Boolean) as string[]),
  );

  return { title: fill(angle.title, vars), script: lines.join("\n"), captions, hashtags, media_url: null };
}

/** The angles a client gets in a given week: three in a row, rotating week by week. */
export function anglesFor(client: Client, week: string): Angle[] {
  const start = (weekNumber(week) * 3 + hash(client.id)) % ANGLES.length;
  return [0, 1, 2].map((i) => ANGLES[(start + i) % ANGLES.length]);
}

/** Synchronous core, also used to seed sample data. */
export function draftWeek(client: Client, week: string): Draft[] {
  return anglesFor(client, week).map((a) => buildDraft(client, a));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const demoGenerator: Generator = {
  name: "demo",
  async generateWeek({ client, week }) {
    await sleep(env.demoGeneratorDelayMs);
    return draftWeek(client, week);
  },
  async reviseItem({ client, week, item, notes }) {
    await sleep(env.demoGeneratorDelayMs);
    // Use an angle that isn't in this week's set, so the redo reads differently.
    const used = anglesFor(client, week);
    const spare = ANGLES.filter((a) => !used.includes(a));
    const angle = spare[(item.slot - 1 + item.version - 1) % spare.length];
    return buildDraft(client, angle, { version: item.version + 1, notes });
  },
};
