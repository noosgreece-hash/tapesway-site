#!/usr/bin/env node
/*
  Copies the rendered page text into index.html so search engines, link
  previews and visitors without JavaScript read the full page. app.js still
  renders everything from content.js on load, so the live page is always
  current; run this after editing content.js to keep index.html in step:

    node tools/prerender.js        (needs Playwright: npm i -g playwright)

  It fills every <!--prerender:NAME-->…<!--/prerender--> block in index.html
  with what app.js renders into the matching data-render="NAME" container,
  and copies meta.title / meta.description from content.js into the head.
*/
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const file = path.join(root, "index.html");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };

(async () => {
  let html = fs.readFileSync(file, "utf8");
  const names = [...html.matchAll(/<!--prerender:([\w-]+)-->/g)].map(m => m[1]);
  if (!names.length) throw new Error("no <!--prerender:NAME--> markers in index.html");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // Serve the site folder straight from disk.
  await page.route("http://prerender.local/**", route => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, "") || "index.html";
    const f = path.join(root, rel);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: "" });
    route.fulfill({ status: 200, body: fs.readFileSync(f), contentType: TYPES[path.extname(f)] || "application/octet-stream" });
  });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://prerender.local/index.html?prerender", { waitUntil: "load" });
  const out = await page.evaluate(names => {
    const r = {};
    names.forEach(n => { const el = document.querySelector('[data-render="' + n + '"]'); r[n] = el ? el.innerHTML : null; });
    return { parts: r, meta: window.TAPESWAY_CONTENT.meta || {} };
  }, names);
  await browser.close();
  if (errors.length) throw new Error("page errors: " + errors.join("; "));

  names.forEach(n => {
    if (out.parts[n] == null) throw new Error("nothing rendered for " + n);
    html = html.replace(new RegExp("<!--prerender:" + n + "-->[\\s\\S]*?<!--/prerender-->"),
      () => "<!--prerender:" + n + "-->" + out.parts[n] + "<!--/prerender-->");
  });
  const attr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  if (out.meta.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, () => "<title>" + attr(out.meta.title) + "</title>")
      .replace(/(<meta property="og:title" content=")[^"]*(")/, (m, a, b) => a + attr(out.meta.title) + b);
  }
  if (out.meta.description) {
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + attr(out.meta.description) + b)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, (m, a, b) => a + attr(out.meta.description) + b);
  }
  fs.writeFileSync(file, html);
  console.log("prerendered " + names.join(", "));
})().catch(e => { console.error(e.message || e); process.exit(1); });
