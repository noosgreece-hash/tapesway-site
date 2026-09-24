import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { startServer } from "./helpers.mjs";

describe("POST /api/leads (website form endpoint)", () => {
  let srv;
  let ip = 0;
  // Each request gets its own IP so the rate limit only applies where a test wants it.
  const post = (body, headers = {}) =>
    fetch(srv.base + "/api/leads", { method: "POST", body, headers: { accept: "application/json", "x-forwarded-for": `10.0.0.${++ip}`, ...headers } });
  const form = (fields) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    return fd;
  };
  const leadNamed = (name) => srv.store().leads.find((l) => l.name === name);

  before(async () => {
    srv = await startServer({ DEMO_SEED: "0" });
  });
  after(async () => srv?.stop());

  it("stores a multipart submission with the website's field names and alerts the owner", async () => {
    const r = await post(
      form({ name: "Maria Test", business: "Villa Test", email: "Maria@Example.com", island: "Paros", type: "Villa", message: "Hello\nsecond line" }),
      { origin: "https://tapesway.com" },
    );
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
    assert.equal(r.headers.get("access-control-allow-origin"), "https://tapesway.com");
    const lead = leadNamed("Maria Test");
    assert.ok(lead, "lead stored");
    assert.equal(lead.email, "maria@example.com");
    assert.equal(lead.business_type, "Villa");
    assert.equal(lead.island, "Paros");
    assert.equal(lead.message, "Hello\nsecond line");
    assert.equal(lead.status, "new");
    const alert = srv.store().outbox.find((e) => e.kind === "lead_alert" && e.subject.includes("Maria Test"));
    assert.ok(alert, "owner alert in outbox");
    assert.match(alert.text, /\/leads\//);
  });

  it("accepts x-www-form-urlencoded and JSON", async () => {
    let r = await post(new URLSearchParams({ name: "Url Encoded", email: "u@example.com", message: "Hi" }));
    assert.equal(r.status, 200);
    r = await post(JSON.stringify({ name: "Json Body", email: "j@example.com", message: "Hi", type: "Hotel" }), { "content-type": "application/json" });
    assert.equal(r.status, 200);
    assert.ok(leadNamed("Url Encoded"));
    assert.equal(leadNamed("Json Body").business_type, "Hotel");
  });

  it("requires name, email and message and rejects a bad email", async () => {
    let r = await post(form({ name: "No Email", message: "x" }));
    assert.equal(r.status, 422);
    let body = await r.json();
    assert.equal(body.ok, false);
    assert.equal(body.fields.email, "required");
    r = await post(form({ name: "Bad Email", email: "not-an-email", message: "x" }));
    assert.equal(r.status, 422);
    body = await r.json();
    assert.equal(body.fields.email, "invalid");
    r = await post(form({ email: "a@example.com" }));
    body = await r.json();
    assert.deepEqual(Object.keys(body.fields).sort(), ["message", "name"]);
    assert.equal(leadNamed("No Email"), undefined);
    assert.equal(leadNamed("Bad Email"), undefined);
  });

  it("silently drops honeypot submissions", async () => {
    const r = await post(form({ name: "Spam Bot", email: "bot@example.com", message: "buy", _gotcha: "filled" }));
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
    assert.equal(leadNamed("Spam Bot"), undefined);
  });

  it("rejects other websites and unsupported bodies", async () => {
    let r = await post(form({ name: "Evil", email: "e@example.com", message: "x" }), { origin: "https://evil.example" });
    assert.equal(r.status, 403);
    assert.equal(r.headers.get("access-control-allow-origin"), null);
    assert.equal(leadNamed("Evil"), undefined);
    r = await post("plain text", { "content-type": "text/plain" });
    assert.equal(r.status, 415);
  });

  it("answers CORS preflight for allowed origins, including any localhost port", async () => {
    const r = await fetch(srv.base + "/api/leads", { method: "OPTIONS", headers: { origin: "http://localhost:8123", "access-control-request-method": "POST" } });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get("access-control-allow-origin"), "http://localhost:8123");
  });

  it("rate-limits one IP", async () => {
    const headers = { "x-forwarded-for": "203.0.113.9" };
    const statuses = [];
    for (let i = 0; i < 6; i++) {
      const r = await fetch(srv.base + "/api/leads", { method: "POST", body: form({ name: `Rate ${i}`, email: "r@example.com", message: "x" }), headers });
      statuses.push(r.status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
  });
});
