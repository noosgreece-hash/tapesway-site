/* TapesWay — page rendering, scroll story and interactions.
   Content lives in content.js; this file only turns it into the page. */
(function () {
  "use strict";

  var C = window.TAPESWAY_CONTENT;
  var root = document.documentElement;
  // Must match the mobile media query in styles.css and the <source> in the poster.
  var MOBILE_MQ = "(max-width: 767px), (max-aspect-ratio: 4/5)";
  var mq = window.matchMedia(MOBILE_MQ);

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  var ARROW = '<span class="arrow" aria-hidden="true">→</span>';
  function btn(link, cls) {
    if (!link || !link.label) return "";
    var withArrow = /primary|light/.test(cls);
    return '<a class="btn ' + cls + '" href="' + esc(link.href) + '">' + esc(link.label) + (withArrow ? " " + ARROW : "") + "</a>";
  }
  // Desktop words plus an optional phone-specific version (see content.js).
  function variant(tag, cls, desk, mob) {
    if (mob === undefined || mob === desk) return desk ? "<" + tag + ' class="' + cls + '">' + esc(desk) + "</" + tag + ">" : "";
    var out = desk ? "<" + tag + ' class="' + cls + ' d-only">' + esc(desk) + "</" + tag + ">" : "";
    if (mob) out += "<" + tag + ' class="' + cls + ' m-only">' + esc(mob) + "</" + tag + ">";
    return out;
  }
  function picture(base, alt, sizes, eager) {
    if (/\.(webp|jpe?g|png|avif)$/i.test(base)) // a single file, used as-is
      return '<picture><img src="' + esc(base) + '" alt="' + esc(alt) + '"' + (eager ? "" : ' loading="lazy"') + ' decoding="async"></picture>';
    return '<picture><img src="' + esc(base) + '-1600.webp" srcset="' + esc(base) + "-800.webp 800w, " + esc(base) +
      '-1600.webp 1600w" sizes="' + sizes + '" width="1600" height="900" alt="' + esc(alt) + '"' +
      (eager ? "" : ' loading="lazy"') + ' decoding="async"></picture>';
  }
  function eyebrow(t) { return t ? '<span class="eyebrow">' + esc(t) + "</span>" : ""; }
  var ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h12"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';

  function brandLink(extra) {
    return '<a class="brand" href="#" ' + (extra || "") + '><img src="' + esc(C.brand.logo) + '" alt="" width="32" height="36"><span>' + esc(C.brand.name) + "</span></a>";
  }

  /* ---------- render ---------- */
  function renderHeader() {
    var links = C.nav.map(function (n) { return '<a href="' + esc(n.href) + '">' + esc(n.label) + "</a>"; }).join("");
    $('[data-render="header"]').innerHTML =
      brandLink('aria-label="' + esc(C.brand.name) + ', back to top"') +
      '<nav class="site-nav" aria-label="Main">' + links + btn(C.navCta, "btn--light") + "</nav>" +
      '<button class="menu-button" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Open menu">' + ICON_MENU + "</button>";

    var items = C.nav.map(function (n, i) {
      return '<li><a href="' + esc(n.href) + '">' + esc(n.label) + '<span class="num">0' + (i + 1) + "</span></a></li>";
    }).join("");
    var menu = $('[data-render="menu"]');
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "Menu");
    menu.innerHTML =
      '<div class="menu-top">' + brandLink('tabindex="-1" aria-hidden="true"') +
      '<button class="menu-close" type="button" aria-label="Close menu">' + ICON_CLOSE + "</button></div>" +
      "<nav aria-label=\"Menu\"><ul>" + items + "</ul></nav>" +
      btn(C.navCta, "btn--light") +
      '<p class="menu-foot">' + esc(C.contact.location) + "</p>";
  }

  function renderStory() {
    var S = C.story, M = C.media;
    var frames = S.frames.map(function (f, i) {
      return '<div class="story-copy copy-frame" data-copy="frame-' + i + '">' +
        '<span class="index">' + esc(f.index) + "</span>" +
        variant("h2", "", f.title, f.mobileTitle) +
        variant("p", "", f.text, f.mobileText) + "</div>";
    }).join("");

    var staticFrames = S.frames.map(function (f) {
      return '<div><span class="index">' + esc(f.index) + "</span><h3>" + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></div>";
    }).join("");

    $('[data-render="story"]').innerHTML =
      '<div class="story-track">' +
        '<div class="story-stage">' +
          '<picture class="story-poster">' +
            '<source media="' + MOBILE_MQ + '" srcset="media/mobile/poster.webp">' +
            '<img src="media/desktop/poster.webp" alt="' + esc(M.stills.hero.alt) + '" fetchpriority="high" decoding="async">' +
          "</picture>" +
          '<canvas class="story-canvas" aria-hidden="true"></canvas>' +
          '<div class="story-copy copy-hero" data-copy="hero">' +
            eyebrow(S.hero.eyebrow) +
            variant("h1", "", S.hero.title, S.hero.mobileTitle) +
            variant("p", "", S.hero.text, S.hero.mobileText) +
            '<div class="story-actions">' + btn(S.hero.primary, "btn--primary") + btn(S.hero.secondary, "btn--ghost") + "</div>" +
          "</div>" +
          '<div class="hero-wash" data-copy="hero-wash" aria-hidden="true"></div>' +
          '<div class="scroll-cue" data-copy="hero-cue" aria-hidden="true"><span>' + esc(S.hero.scrollCue) + "</span><i></i></div>" +
          frames +
          '<div class="story-copy copy-finale" data-copy="finale">' +
            eyebrow(S.finale.eyebrow) +
            variant("h2", "", S.finale.title, S.finale.mobileTitle) +
            variant("p", "", S.finale.text, S.finale.mobileText) +
            '<div class="story-actions">' + btn(S.finale.primary, "btn--primary") + btn(S.finale.secondary, "btn--ghost") + "</div>" +
          "</div>" +
          '<div class="story-hud" aria-hidden="true"><div class="story-counter"></div><div class="story-progress"><b></b></div></div>' +
          '<a class="story-skip" href="' + esc(S.skipHref) + '">' + esc(S.skipLabel) + ' <span aria-hidden="true">↓</span></a>' +
        "</div>" +
      "</div>" +
      // Composed, motion-free version of the same story.
      '<div class="story-static on-dark">' +
        '<div class="static-chapter">' + picture(M.stills.hero.src, M.stills.hero.alt, "100vw", true) +
          '<div class="static-copy">' + eyebrow(S.hero.eyebrow) + "<h1>" + esc(S.hero.title) + "</h1><p>" + esc(S.hero.text) + "</p>" +
          '<div class="story-actions">' + btn(S.hero.primary, "btn--light") + btn(S.hero.secondary, "btn--ghost") + "</div></div></div>" +
        '<div class="static-chapter">' + picture(M.stills.frame.src, M.stills.frame.alt, "100vw") +
          '<div class="static-copy"><div class="static-frames">' + staticFrames + "</div></div></div>" +
        '<div class="static-chapter">' + picture(M.stills.finale.src, M.stills.finale.alt, "100vw") +
          '<div class="static-copy">' + eyebrow(S.finale.eyebrow) + "<h2>" + esc(S.finale.title) + "</h2><p>" + esc(S.finale.text) + "</p>" +
          '<div class="story-actions">' + btn(S.finale.primary, "btn--light") + btn(S.finale.secondary, "btn--ghost") + "</div></div></div>" +
      "</div>";
  }

  function sectionHead(o) {
    return '<div class="section-head reveal"><div>' + eyebrow(o.eyebrow) + "<h2>" + esc(o.title) + "</h2></div>" +
      (o.intro ? "<p>" + esc(o.intro) + "</p>" : "<div></div>") + "</div>";
  }

  function renderSections() {
    var s = C.services;
    $('[data-render="services"]').innerHTML = '<div class="wrap">' + sectionHead(s) +
      '<div class="cards">' + s.items.map(function (it) {
        return '<article class="card reveal"><div class="film">' + picture(it.image, it.imageAlt, "(max-width: 899px) 92vw, 30vw") + "</div>" +
          "<h3>" + esc(it.title) + "</h3><p>" + esc(it.text) + "</p><ul>" +
          it.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></article>";
      }).join("") + "</div></div>";

    var cs = C.contactSheet, sheet = $('[data-render="contactSheet"]');
    sheet.classList.add("on-dark");
    sheet.innerHTML = '<div class="wrap">' + sectionHead(cs) + '<div class="sheet">' +
      cs.items.map(function (it, i) {
        return '<figure class="reveal"><div class="film">' + picture(it.image, it.alt, "(max-width: 899px) 46vw, 23vw") + "</div>" +
          "<figcaption><span>" + esc(it.caption) + "</span><b>" + String(i + 1).padStart(2, "0") + "A</b></figcaption></figure>";
      }).join("") + "</div></div>";

    var p = C.process;
    $('[data-render="process"]').innerHTML = '<div class="wrap">' + sectionHead(p) + '<ol class="steps" role="list">' +
      p.steps.map(function (st, i) {
        return '<li class="step reveal"><span class="num" aria-hidden="true">0' + (i + 1) + "</span><h3>" + esc(st.label) + "</h3><p>" + esc(st.text) + "</p></li>";
      }).join("") + "</ol>" + (p.note ? '<p class="process-note">' + esc(p.note) + "</p>" : "") + "</div>";

    var c = C.contact, f = c.fields;
    var mailto = !c.formEndpoint;
    function field(name, type, full, required, auto) {
      var id = "f-" + name;
      var input = type === "textarea"
        ? '<textarea id="' + id + '" name="' + name + '"' + (required ? " required" : "") + "></textarea>"
        : '<input id="' + id + '" name="' + name + '" type="' + type + '"' + (auto ? ' autocomplete="' + auto + '"' : "") + (required ? " required" : "") + ">";
      return '<div class="field' + (full ? " field--full" : "") + '"><label for="' + id + '">' + esc(f[name]) + (required ? "" : ' <span style="font-weight:400;color:var(--muted)">(optional)</span>') + "</label>" + input + "</div>";
    }
    $('[data-render="contact"]').innerHTML = '<div class="wrap contact-grid">' +
      '<div class="reveal">' + eyebrow(c.eyebrow) + "<h2>" + esc(c.title) + "</h2><p>" + esc(c.text) + "</p>" +
        '<div class="contact-details"><span>Email</span><a class="text-link" href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>" +
        "<span>Based in</span><div>" + esc(c.location) + "</div></div></div>" +
      '<form class="form reveal" novalidate>' +
        field("name", "text", false, true, "name") + field("venue", "text", false, false, "organization") +
        field("email", "email", false, true, "email") + field("island", "text", false, false) +
        field("when", "text", true, false) + field("message", "textarea", true, true) +
        '<div class="form-foot"><button class="btn btn--primary" type="submit">' + esc(mailto ? c.mailtoSubmitLabel : c.submitLabel) + " " + ARROW + "</button>" +
        (mailto ? '<p class="form-note">' + esc(c.mailtoNote) + "</p>" : "") + "</div>" +
        '<p class="form-status" role="status" aria-live="polite"></p>' +
      "</form></div>";

    var ft = C.footer;
    $('[data-render="footer"]').innerHTML =
      '<div class="footer-row">' + brandLink() + '<nav aria-label="Footer">' +
      C.nav.map(function (n) { return '<a href="' + esc(n.href) + '">' + esc(n.label) + "</a>"; }).join("") + "</nav></div>" +
      '<div class="footer-row"><span>' + esc(ft.copyright) + "</span><span>" + esc(ft.note) + "</span></div>";
  }

  /* ---------- mobile menu ---------- */
  function setupMenu() {
    var button = $(".menu-button"), menu = $("#site-menu"), close = $(".menu-close", menu);
    var lastFocus = null;
    function focusables() { return $$('a[href]:not([tabindex="-1"]), button', menu); }
    function open() {
      lastFocus = document.activeElement;
      menu.hidden = false;
      document.body.classList.add("menu-open");
      button.setAttribute("aria-expanded", "true");
      $("#main").setAttribute("inert", "");
      close.focus();
    }
    function shut(restoreFocus) {
      if (menu.hidden) return;
      menu.hidden = true;
      document.body.classList.remove("menu-open");
      button.setAttribute("aria-expanded", "false");
      $("#main").removeAttribute("inert");
      if (restoreFocus !== false) (lastFocus || button).focus();
    }
    button.addEventListener("click", open);
    close.addEventListener("click", function () { shut(); });
    menu.addEventListener("click", function (e) {
      var a = e.target.closest("a[href^='#']");
      if (a) shut(false); // let the browser follow the anchor once scrolling is unlocked
    });
    document.addEventListener("keydown", function (e) {
      if (menu.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); shut(); }
      if (e.key === "Tab") {
        var f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", function (e) { if (e.matches) shut(false); });
  }

  /* ---------- frame sequence loader ---------- */
  // Frames ship as small atlases (manifest.layout, e.g. 2x2 = four consecutive
  // frames per file; 1x1 = one frame per file). The loader fetches the atlases
  // around the frame the visitor needs, keeps a bounded pool of decoded
  // bitmaps, and can be torn down when the variant changes.
  function Sequence(manifest, base) {
    this.m = manifest;
    this.base = base;
    this.count = manifest.count;
    var L = manifest.layout || { cols: 1, rows: 1 };
    this.cols = L.cols; this.rows = L.rows; this.per = L.cols * L.rows;
    this.tiles = Math.ceil(this.count / this.per);
    this.blobs = new Array(this.tiles);
    this.state = new Uint8Array(this.tiles);   // 0 idle, 1 in flight, 2 waiting to retry, 3 failed
    this.attempts = new Uint8Array(this.tiles);
    this.inflight = 0;
    this.maxInflight = 4;
    this.bitmaps = new Map();                   // tile -> bitmap, insertion order = LRU
    this.decoding = new Map();                  // tile -> promise
    var bytes = manifest.width * manifest.height * this.per * 4;
    this.maxBitmaps = clamp(Math.floor(170e6 / bytes), 6, 40);
    this.frame = 0;
    this.target = 0;                            // tile
    this.active = true;
    this.dead = false;
    this.ctrl = window.AbortController ? new AbortController() : null;
    this.onframe = null;                        // called when a wanted tile arrives
    this.onfatal = null;
  }
  Sequence.prototype.tileOf = function (f) { return Math.floor(f / this.per); };
  Sequence.prototype.url = function (t) {
    var n = String(t + (this.m.start || 0));
    while (n.length < (this.m.digits || 4)) n = "0" + n;
    return this.base + this.m.pattern.replace("{n}", n);
  };
  // Source rectangle of frame f inside its (decoded) tile.
  Sequence.prototype.cell = function (bmp, f) {
    var c = clamp(f - this.tileOf(f) * this.per, 0, this.per - 1);
    var w = bmp.width / this.cols, h = bmp.height / this.rows;
    return { img: bmp, sx: (c % this.cols) * w, sy: Math.floor(c / this.cols) * h, sw: w, sh: h };
  };
  Sequence.prototype.want = function (f) { this.frame = f; this.target = this.tileOf(f); this.pump(); };
  Sequence.prototype.nextTile = function () {
    // 1) the needed tile and its neighbours, 2) a coarse pass over the whole
    // clip so fast jumps land near something, 3) everything else by distance.
    var t = this.target, n = this.tiles, i, d;
    for (d = 0; d <= 4; d++) {
      i = t + d; if (i < n && this.ok(i)) return i;
      i = t - d; if (i >= 0 && this.ok(i)) return i;
    }
    for (i = 0; i < n; i += 4) if (this.ok(i)) return i;
    for (d = 5; d < n; d++) {
      i = t + d; if (i < n && this.ok(i)) return i;
      i = t - d; if (i >= 0 && this.ok(i)) return i;
    }
    return -1;
  };
  Sequence.prototype.ok = function (t) { return !this.blobs[t] && this.state[t] === 0; };
  Sequence.prototype.pump = function () {
    if (this.dead || !this.active) return;
    while (this.inflight < this.maxInflight) {
      var t = this.nextTile();
      if (t < 0) return;
      this.fetchTile(t);
    }
  };
  Sequence.prototype.fetchTile = function (t) {
    var self = this;
    self.inflight++;
    self.state[t] = 1;
    var attempt = ++self.attempts[t];
    fetch(self.url(t), { signal: self.ctrl ? self.ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(function (b) {
        if (self.dead) return;
        self.blobs[t] = b;
        self.state[t] = 0;
        if (Math.abs(t - self.target) <= 1 && self.onframe) self.onframe(t);
      })
      .catch(function (err) {
        if (self.dead || (err && err.name === "AbortError")) return;
        if (attempt >= 3) {
          self.state[t] = 3;
          if (t === 0 && self.onfatal) self.onfatal();
        } else {
          self.state[t] = 2;
          setTimeout(function () { if (!self.dead) { self.state[t] = 0; self.pump(); } }, 400 * Math.pow(2, attempt));
        }
      })
      .then(function () { self.inflight--; self.pump(); });
  };
  Sequence.prototype.hasTile = function (t) { return !!this.blobs[t]; };
  Sequence.prototype.decodeTile = function (t) {
    var self = this;
    if (self.bitmaps.has(t)) return Promise.resolve(self.bitmaps.get(t));
    if (self.decoding.has(t)) return self.decoding.get(t);
    var blob = self.blobs[t];
    if (!blob) return Promise.resolve(null);
    var p = (window.createImageBitmap ? createImageBitmap(blob) : new Promise(function (res, rej) {
      var img = new Image(); var u = URL.createObjectURL(blob);
      img.onload = function () { URL.revokeObjectURL(u); res(img); };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error("decode")); };
      img.src = u;
    })).then(function (bmp) {
      self.decoding.delete(t);
      if (self.dead) { if (bmp.close) bmp.close(); return null; }
      self.bitmaps.set(t, bmp);
      var guard = self.bitmaps.size;
      while (self.bitmaps.size > self.maxBitmaps && guard-- > 0) {
        var oldest = self.bitmaps.keys().next().value, b = self.bitmaps.get(oldest);
        self.bitmaps.delete(oldest);
        if (Math.abs(oldest - self.target) <= 2) { self.bitmaps.set(oldest, b); continue; } // keep what is on and near screen
        if (b && b.close) b.close();
      }
      return bmp;
    }, function () { self.decoding.delete(t); return null; });
    self.decoding.set(t, p);
    return p;
  };
  Sequence.prototype.decode = function (f) {
    var self = this;
    return self.decodeTile(self.tileOf(f)).then(function (b) { return b ? self.cell(b, f) : null; });
  };
  Sequence.prototype.touch = function (f) {
    var t = this.tileOf(f), b = this.bitmaps.get(t);
    if (!b) return null;
    this.bitmaps.delete(t); this.bitmaps.set(t, b);
    return this.cell(b, f);
  };
  Sequence.prototype.nearestReady = function (f) {
    var t = this.tileOf(f);
    for (var d = 1; d < 16; d++) {
      if (this.bitmaps.has(t - d)) return this.cell(this.bitmaps.get(t - d), (t - d + 1) * this.per - 1);
      if (this.bitmaps.has(t + d)) return this.cell(this.bitmaps.get(t + d), (t + d) * this.per);
    }
    return null;
  };
  Sequence.prototype.destroy = function () {
    this.dead = true;
    if (this.ctrl) this.ctrl.abort();
    this.bitmaps.forEach(function (b) { if (b && b.close) b.close(); });
    this.bitmaps.clear();
    this.blobs = [];
  };

  /* ---------- scroll story ---------- */
  function setupStory() {
    var story = $("#story"), track = $(".story-track"), stage = $(".story-stage");
    var canvas = $(".story-canvas"), ctx = canvas.getContext("2d", { alpha: false });
    var counter = $(".story-counter"), bar = $(".story-progress b"), progress = $(".story-progress");
    var skip = $(".story-skip");
    var copies = $$("[data-copy]", stage);
    var seq = null, timeline = null, variantName = null, dir = 1;
    // Playback eases toward the scroll position (native scrolling is untouched),
    // so a wheel notch or a flick plays through every in-between frame instead of jumping.
    var misses = 0, TAU = 110, targetT = 0, shownT = -1, lastNow = 0, running = false, drawnKey = "";

    function motionOn() { return root.classList.contains("motion"); }
    function fallback() {
      // Loading failed or motion is not wanted: show the composed static story.
      if (seq) { seq.destroy(); seq = null; }
      root.classList.remove("motion");
      root.classList.add("no-motion");
    }

    function buildTimeline(pacing, fps, count) {
      var acc = 0, segs = pacing.map(function (p) {
        var s = { id: p.id, copy: p.copy, vh: p.vh, start: acc, end: acc + p.vh,
          f0: clamp(Math.round(p.from * fps), 0, count - 1), f1: clamp(Math.round(p.to * fps), 0, count - 1) };
        acc += p.vh; return s;
      });
      // Where each piece of copy is on screen, in the same units (viewport heights).
      var windows = {};
      segs.forEach(function (s) {
        if (!s.copy) return;
        var w = windows[s.copy] || (windows[s.copy] = { start: s.start, end: s.end });
        w.start = Math.min(w.start, s.start); w.end = Math.max(w.end, s.end);
      });
      return { segs: segs, total: acc, windows: windows };
    }
    function frameAt(t) {
      var segs = timeline.segs;
      for (var k = 0; k < segs.length; k++) {
        var s = segs[k];
        if (t < s.end || k === segs.length - 1) {
          var local = s.vh ? clamp((t - s.start) / s.vh, 0, 1) : 1;
          return s.f0 + (s.f1 - s.f0) * local; // fractional; show() rounds to a whole frame
        }
      }
      return 0;
    }
    function ramp(t, a, b) { return b === a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
    function copyOpacity(key, t) {
      var W = timeline.windows, total = timeline.total;
      if (key === "hero" || key === "hero-cue" || key === "hero-wash") {
        var h = W.hero; if (!h) return 0;
        return 1 - ramp(t, h.end, h.end + (key === "hero-cue" ? 0.15 : 0.35));
      }
      if (key === "finale") {
        var f = W.finale; if (!f) return 0;
        return ramp(t, f.start - 0.45, f.start - 0.05);
      }
      var w = W[key]; if (!w) return 0;
      return Math.min(ramp(t, w.start - 0.12, w.start + 0.22), 1 - ramp(t, w.end - 0.22, w.end + 0.1 > total ? total : w.end + 0.1));
    }

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; drawnKey = ""; }
    }
    function paint(c) {
      var cw = canvas.width, ch = canvas.height, iw = c.sw, ih = c.sh;
      var sc = Math.max(cw / iw, ch / ih), dw = iw * sc, dh = ih * sc;
      var fx = seq && seq.m.focalX != null ? seq.m.focalX : 0.5, fy = seq && seq.m.focalY != null ? seq.m.focalY : 0.5;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high"; // resizing the canvas resets this, so set it on every draw
      ctx.drawImage(c.img, c.sx, c.sy, c.sw, c.sh, (cw - dw) * fx, (ch - dh) * fy, dw, dh);
      story.classList.add("is-live");
    }
    // Draw whole frame f. Frames are never blended, so every picture on screen is a clean frame of the clip.
    function show(f) {
      if (!seq) return;
      var i = Math.round(f);
      seq.want(i);
      var c = seq.touch(i);
      if (!c) {
        misses++;
        if (!drawnKey) { var near = seq.nearestReady(i); if (near) paint(near); }
        seq.decode(i).then(function (c) { if (c) { drawnKey = ""; request(); } });
      } else {
        paint(c);
        drawnKey = String(i);
      }
      // Decode a few tiles ahead in the direction of travel, and one behind.
      var t0 = seq.tileOf(i);
      for (var k = 1; k <= 3; k++) {
        var n = t0 + dir * k;
        if (n >= 0 && n < seq.tiles && seq.hasTile(n)) seq.decodeTile(n);
      }
      if (t0 - dir >= 0 && t0 - dir < seq.tiles && seq.hasTile(t0 - dir)) seq.decodeTile(t0 - dir);
    }

    function readScroll() {
      var travel = track.offsetHeight - stage.offsetHeight;
      var scrolled = clamp(-track.getBoundingClientRect().top, 0, Math.max(travel, 0));
      return travel > 0 ? (scrolled / travel) * timeline.total : 0;
    }
    function render(t) {
      var f = frameAt(t);
      if (seq && String(Math.round(f)) !== drawnKey) show(f);
      counter.textContent = "TW · 24   ▸ " + String(Math.round(f)).padStart(4, "0");
      bar.style.transform = "scaleX(" + (t / timeline.total).toFixed(4) + ")";

      copies.forEach(function (el) {
        var o = copyOpacity(el.getAttribute("data-copy"), t);
        el.style.opacity = o.toFixed(3);
        if (el.classList.contains("story-copy")) el.style.transform = "translate3d(0," + ((1 - o) * 14).toFixed(1) + "px,0)";
        var hidden = o < 0.5;
        if (hidden !== el.classList.contains("is-hidden")) {
          el.classList.toggle("is-hidden", hidden);
          // Faded-out copy keeps its text for screen readers but drops out of the tab order.
          $$("a, button", el).forEach(function (a) { if (hidden) a.setAttribute("tabindex", "-1"); else a.removeAttribute("tabindex"); });
        }
      });
      var nearEnd = t > timeline.total - 0.35 || track.getBoundingClientRect().bottom < window.innerHeight * 0.5;
      skip.classList.toggle("is-hidden", nearEnd);
      if (nearEnd) skip.setAttribute("tabindex", "-1"); else skip.removeAttribute("tabindex");
    }
    function tick(now) {
      if (!timeline) { running = false; return; }
      targetT = readScroll();
      if (targetT !== shownT) dir = targetT > shownT ? 1 : -1;
      // Big jumps (anchor links, skip, first paint) cut straight to the new place.
      if (shownT < 0 || Math.abs(frameAt(targetT) - frameAt(shownT)) > 90) shownT = targetT;
      else {
        var dt = lastNow ? Math.min(now - lastNow, 64) : 16;
        shownT += (targetT - shownT) * (1 - Math.exp(-dt / TAU));
        if (Math.abs(targetT - shownT) < 0.0005) shownT = targetT;
      }
      lastNow = now;
      render(shownT);
      if (shownT !== targetT) requestAnimationFrame(tick);
      else { running = false; lastNow = 0; }
    }
    function request() { if (!running) { running = true; requestAnimationFrame(tick); } }
    function update() { request(); }

    function drawTicks() {
      $$("i", progress).forEach(function (n) { n.remove(); });
      Object.keys(timeline.windows).forEach(function (k) {
        var tick = document.createElement("i");
        tick.style.left = (timeline.windows[k].start / timeline.total * 100) + "%";
        progress.appendChild(tick);
      });
    }

    function load(name) {
      if (seq) { seq.destroy(); seq = null; }
      drawnKey = ""; shownT = -1;
      story.classList.remove("is-live");
      variantName = name;
      var pacing = C.pacing[name];
      var src = C.media[name].manifest;
      var base = src.slice(0, src.lastIndexOf("/") + 1);
      // Provisional timeline so the page has the right height before the manifest arrives.
      timeline = buildTimeline(pacing, 24, 289);
      track.style.setProperty("--travel", timeline.total);
      drawTicks();
      request();
      if (!motionOn()) return;
      fetch(src, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (m) {
          if (variantName !== name || !motionOn()) return;
          timeline = buildTimeline(pacing, m.fps, m.count);
          track.style.setProperty("--travel", timeline.total);
          drawTicks();
          seq = new Sequence(m, base);
          seq.onframe = function () { drawnKey = ""; request(); };
          seq.onfatal = fallback;
          seq.active = storyNear;
          sizeCanvas();
          update();
        })
        .catch(fallback);
    }

    // Only fetch frames while the story is on or near the screen.
    var storyNear = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        storyNear = entries[0].isIntersecting;
        if (seq) { seq.active = storyNear; seq.pump(); }
      }, { rootMargin: "100% 0px 100% 0px" }).observe(story);
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", function () { sizeCanvas(); request(); });
    if ("ResizeObserver" in window) new ResizeObserver(function () { sizeCanvas(); request(); }).observe(stage);
    // Crossing the breakpoint switches sequences: cancel requests, free bitmaps, load the other set.
    mq.addEventListener("change", function (e) { load(e.matches ? "mobile" : "desktop"); });
    window.addEventListener("pagehide", function () { if (seq) seq.destroy(); });

    sizeCanvas();
    load(mq.matches ? "mobile" : "desktop");

    // Debug hook for testing: exposes state without affecting behaviour.
    window.__tapesway = {
      get variant() { return variantName; },
      get frame() { return seq ? seq.frame : -1; },
      get settled() { return !running; },
      get misses() { return misses; },
      get total() { return timeline ? timeline.total : 0; },
      get loaded() { return seq ? seq.blobs.filter(Boolean).length : 0; },
      get tiles() { return seq ? seq.tiles : 0; },
      get decoded() { return seq ? seq.bitmaps.size : 0; }
    };
  }

  /* ---------- contact form ---------- */
  function setupForm() {
    var c = C.contact, form = $(".form"), status = $(".form-status", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.classList.remove("is-error");
      if (!form.checkValidity()) {
        form.reportValidity();
        status.textContent = "Please fill in your name, a valid email and a short message.";
        status.classList.add("is-error");
        return;
      }
      var data = new FormData(form);
      if (c.formEndpoint) {
        var button = $("button[type=submit]", form);
        button.disabled = true;
        status.textContent = "Sending…";
        fetch(c.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            status.textContent = "Thank you. Your request was sent and we'll reply by email.";
            form.reset();
          })
          .catch(function () {
            status.textContent = "Your request could not be sent. Please email " + c.email + " instead.";
            status.classList.add("is-error");
          })
          .then(function () { button.disabled = false; });
        return;
      }
      var lines = ["name", "venue", "email", "island", "when"].map(function (k) {
        return c.fields[k] + ": " + (data.get(k) || "–");
      });
      lines.push("", data.get("message") || "");
      var subject = "Shoot enquiry" + (data.get("venue") ? " – " + data.get("venue") : "");
      window.location.href = "mailto:" + c.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
      status.textContent = "Your email app should open with the message ready to send. If it didn't, write to " + c.email + ".";
    });
  }

  /* ---------- section reveals ---------- */
  function setupReveals() {
    var els = $$(".reveal");
    if (!root.classList.contains("motion") || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  renderHeader();
  renderStory();
  renderSections();
  setupMenu();
  setupStory();
  setupForm();
  setupReveals();
})();
