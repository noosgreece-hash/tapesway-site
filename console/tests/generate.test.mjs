import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { drainQueue, startServer } from "./helpers.mjs";

describe("bulk generation", () => {
  let srv;
  const week = "2026-W40";
  const generate = async (clientIds, regenerate = false) => {
    const r = await fetch(srv.base + "/api/generate", {
      method: "POST",
      headers: { cookie: srv.cookie, "content-type": "application/json" },
      body: JSON.stringify({ clientIds, week, regenerate }),
    });
    assert.equal(r.status, 200);
    return r.json();
  };
  const itemsFor = (clientId) => srv.store().items.filter((i) => i.client_id === clientId && i.week === week);

  before(async () => {
    srv = await startServer();
  });
  after(async () => srv?.stop());

  it("queues one job per active client, skips paused ones, and makes 3 drafts each", async () => {
    const clients = srv.store().clients;
    const active = clients.filter((c) => c.status === "active");
    const paused = clients.filter((c) => c.status === "paused");
    assert.ok(active.length >= 5 && paused.length >= 1, "sample data has active and paused clients");
    const res = await generate(clients.map((c) => c.id));
    assert.equal(res.created, active.length);
    assert.equal(res.skipped.filter((s) => s.reason === "paused").length, paused.length);
    await drainQueue(srv);
    for (const c of active) {
      const items = itemsFor(c.id);
      assert.equal(items.length, 3, c.business_name);
      assert.ok(items.every((i) => i.review_status === "pending" && i.media_url === null && i.version === 1));
      for (const lang of c.languages) assert.ok(items[0].captions[lang], `${c.business_name} caption in ${lang}`);
      assert.ok(items[0].hashtags.length > 0);
    }
    assert.ok(srv.store().jobs.every((j) => j.status === "ready"));
  });

  it("does not duplicate when the same clients are generated again", async () => {
    const active = srv.store().clients.filter((c) => c.status === "active");
    const before = srv.store().items.length;
    const res = await generate(active.map((c) => c.id));
    assert.equal(res.created, 0);
    assert.ok(res.skipped.every((s) => s.reason === "already_generated"));
    await drainQueue(srv);
    assert.equal(srv.store().items.length, before);
  });

  it("does not queue twice while a job is in progress (double click)", async () => {
    const c = srv.store().clients.find((x) => x.status === "active");
    const [a, b] = await Promise.all([generate([c.id], true), generate([c.id], true)]);
    assert.equal(a.created + b.created, 1);
    assert.deepEqual([...a.skipped, ...b.skipped].map((s) => s.reason), ["in_progress"]);
    await drainQueue(srv);
    const items = itemsFor(c.id);
    assert.equal(items.length, 3);
    assert.ok(items.every((i) => i.version === 2), "regenerate replaces the drafts with version 2");
  });
});
