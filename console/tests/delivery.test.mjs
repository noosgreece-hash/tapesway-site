import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { startServer } from "./helpers.mjs";

describe("delivery page /d/[token]", () => {
  let srv;
  let delivery;
  before(async () => {
    srv = await startServer();
    // Sample data includes last week's packs, already sent to two sample clients.
    delivery = srv.store().deliveries.find((d) => d.sent_at && !d.opened_at);
    assert.ok(delivery, "a sent, unopened sample delivery exists");
  });
  after(async () => srv?.stop());

  it("shows the week's approved items in Greek, without login", async () => {
    const r = await fetch(`${srv.base}/d/${delivery.token}`, { redirect: "manual" });
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.match(html, /lang="el"/);
    assert.match(html, /Το περιεχόμενο της εβδομάδας/);
    const items = srv.store().items.filter((i) => i.client_id === delivery.client_id && i.week === delivery.week);
    assert.equal(items.length, 3);
    for (const i of items) assert.ok(html.includes(i.hashtags[0]), "hashtags listed");
    assert.match(html, /Αντιγραφή/);
    assert.match(html, /noindex/);
  });

  it("records the first open and later opens", async () => {
    let r = await fetch(`${srv.base}/api/d/${delivery.token}/open`, { method: "POST" });
    assert.deepEqual(await r.json(), { ok: true, counted: true });
    let d = srv.store().deliveries.find((x) => x.id === delivery.id);
    assert.ok(d.opened_at);
    assert.equal(d.open_count, 1);
    const first = d.opened_at;
    await fetch(`${srv.base}/api/d/${delivery.token}/open`, { method: "POST" });
    d = srv.store().deliveries.find((x) => x.id === delivery.id);
    assert.equal(d.open_count, 2);
    assert.equal(d.opened_at, first);
  });

  it("does not count the owner's own preview", async () => {
    const r = await fetch(`${srv.base}/api/d/${delivery.token}/open`, { method: "POST", headers: { cookie: srv.cookie } });
    assert.deepEqual(await r.json(), { ok: true, counted: false });
    assert.equal(srv.store().deliveries.find((x) => x.id === delivery.id).open_count, 2);
  });

  it("records downloads", async () => {
    const item = srv.store().items.find((i) => i.client_id === delivery.client_id && i.week === delivery.week);
    const r = await fetch(`${srv.base}/d/${delivery.token}/download/${item.id}`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-disposition"), /attachment/);
    assert.match(await r.text(), new RegExp(item.hashtags[0]));
    const d = srv.store().deliveries.find((x) => x.id === delivery.id);
    assert.equal(d.downloads.length, 1);
    assert.equal(d.downloads[0].item_id, item.id);
  });

  it("refuses unknown tokens and items from another client", async () => {
    const other = srv.store().items.find((i) => i.client_id !== delivery.client_id);
    let r = await fetch(`${srv.base}/d/${delivery.token}/download/${other.id}`);
    assert.equal(r.status, 404);
    r = await fetch(`${srv.base}/api/d/${"y".repeat(40)}/open`, { method: "POST" });
    assert.equal(r.status, 404);
    const html = await (await fetch(`${srv.base}/d/${delivery.token.slice(0, -2)}zz`)).text();
    assert.match(html, /Ο σύνδεσμος δεν βρέθηκε/);
    assert.doesNotMatch(html, /Αντιγραφή/);
  });
});
