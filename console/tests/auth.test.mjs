import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { startServer } from "./helpers.mjs";

describe("auth protection", () => {
  let srv;
  before(async () => {
    srv = await startServer();
  });
  after(async () => srv?.stop());

  const PRIVATE_PAGES = ["/", "/leads", "/clients", "/clients/new", "/jobs", "/review", "/deliveries", "/outbox"];

  for (const p of PRIVATE_PAGES) {
    it(`redirects ${p} to the login page without a session`, async () => {
      const r = await fetch(srv.base + p, { redirect: "manual" });
      assert.equal(r.status, 307);
      assert.match(r.headers.get("location"), /\/login/);
    });
  }

  it("refuses private APIs without a session", async () => {
    for (const p of ["/api/jobs/tick", "/api/generate"]) {
      const r = await fetch(srv.base + p, { method: "POST", redirect: "manual" });
      assert.equal(r.status, 401, p);
    }
  });

  it("refuses a tampered or foreign session cookie", async () => {
    const bad = srv.cookie.slice(0, -3) + "abc";
    let r = await fetch(srv.base + "/", { headers: { cookie: bad }, redirect: "manual" });
    assert.equal(r.status, 307);
    r = await fetch(srv.base + "/", { headers: { cookie: "tw_session=eyJzdWIiOiJvd25lciJ9.x" }, redirect: "manual" });
    assert.equal(r.status, 307);
  });

  it("lets the signed-in owner in", async () => {
    for (const p of PRIVATE_PAGES) {
      const r = await fetch(srv.base + p, { headers: { cookie: srv.cookie }, redirect: "manual" });
      assert.equal(r.status, 200, p);
    }
    const r = await fetch(srv.base + "/api/jobs/tick", { method: "POST", headers: { cookie: srv.cookie } });
    assert.equal(r.status, 200);
  });

  it("keeps the public exceptions public", async () => {
    let r = await fetch(srv.base + "/login", { redirect: "manual" });
    assert.equal(r.status, 200);
    r = await fetch(srv.base + "/api/leads", {
      method: "POST",
      body: new URLSearchParams({ name: "Public", email: "p@example.com", message: "x" }),
      redirect: "manual",
    });
    assert.equal(r.status, 200);
    r = await fetch(srv.base + "/d/" + "x".repeat(40), { redirect: "manual" });
    assert.equal(r.status, 200); // public route; shows "link not found" for an unknown token
    assert.match(await r.text(), /Ο σύνδεσμος δεν βρέθηκε/);
  });

  it("does not leak private data on the login page", async () => {
    const html = await (await fetch(srv.base + "/login")).text();
    assert.doesNotMatch(html, /Sample Villa Aegean/);
  });
});
