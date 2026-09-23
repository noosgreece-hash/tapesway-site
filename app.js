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
  var UI = C.ui;
  function navLinks() {
    return C.nav.map(function (n) { return '<a href="' + esc(n.href) + '">' + esc(n.label) + "</a>"; }).join("");
  }
  function renderHeader() {
    // Tab title and search description also come from content.js.
    if (C.meta) {
      if (C.meta.title) document.title = C.meta.title;
      var md = $('meta[name="description"]');
      if (md && C.meta.description) md.setAttribute("content", C.meta.description);
    }
    var story = $("#story");
    if (story && UI.storyLabel) story.setAttribute("aria-label", UI.storyLabel);
    var skip = $(".skip-link");
    if (skip && UI.skipToContent) skip.textContent = UI.skipToContent;
    $('[data-render="header"]').innerHTML =
      brandLink('aria-label="' + esc(UI.homeLabel) + '"') +
      '<nav class="site-nav" aria-label="' + esc(UI.mainNav) + '">' + navLinks() + btn(C.navCta, "btn--light") + "</nav>" +
      '<button class="menu-button" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="' + esc(UI.openMenu) + '">' + ICON_MENU + "</button>";

    var items = C.nav.map(function (n, i) {
      return '<li><a href="' + esc(n.href) + '">' + esc(n.label) + '<span class="num" aria-hidden="true">' + pad(i + 1) + "</span></a></li>";
    }).join("");
    var menu = $('[data-render="menu"]');
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", UI.menu);
    menu.innerHTML =
      '<div class="menu-top">' + brandLink('tabindex="-1" aria-hidden="true"') +
      '<button class="menu-close" type="button" aria-label="' + esc(UI.closeMenu) + '">' + ICON_CLOSE + "</button></div>" +
      '<nav aria-label="' + esc(UI.mainNav) + '"><ul>' + items + "</ul></nav>" +
      btn(C.navCta, "btn--light") +
      '<p class="menu-foot"><a href="mailto:' + esc(C.contact.email) + '">' + esc(C.contact.email) + "</a><span>" + esc(C.contact.location) + "</span></p>";
  }

  function renderStory() {
    var S = C.story, st = C.media.stills;
    $('[data-render="story"]').innerHTML =
      '<div class="story-track">' +
        '<div class="story-stage">' +
          '<picture class="story-poster">' +
            '<source media="' + MOBILE_MQ + '" srcset="media/mobile/poster.webp">' +
            '<img src="media/desktop/poster.webp" alt="' + esc(st.hero.alt) + '" fetchpriority="high" decoding="async">' +
          "</picture>" +
          '<canvas class="story-canvas" aria-hidden="true"></canvas>' +
          tableTitle(S.tableTitle) +
          '<div class="scroll-cue" data-copy="cue" aria-hidden="true"><i></i></div>' +
          '<div class="story-hud" aria-hidden="true"><div class="story-progress"><b></b></div></div>' +
          '<a class="story-skip" href="' + esc(S.skipHref) + '">' + esc(S.skipLabel) + ' <span aria-hidden="true">↓</span></a>' +
        "</div>" +
      "</div>" +
      // Motion-free version: the same story as three stills.
      '<div class="story-static">' +
        ["hero", "frame", "finale"].map(function (k, i) {
          return '<div class="static-chapter">' + picture(st[k].src, st[k].alt, "100vw", i === 0) + "</div>";
        }).join("") +
      "</div>";
  }

  // Big capitals that lie on the table in the final frame. Drawn as SVG text
  // fitted to a fixed box, then projected onto the table by setupStory().
  function tableTitle(tt) {
    if (!tt || !tt.text) return "";
    return '<div class="table-title" aria-hidden="true"><div class="table-title-plane">' +
      '<svg viewBox="0 0 1000 90" preserveAspectRatio="none"><text x="0" y="87" textLength="1000" lengthAdjust="spacing">' +
      esc(tt.text) + "</text></svg></div></div>";
  }

  /* ---------- page sections ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  // Escape, then allow **bold** and "\n" line breaks written in content.js.
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
  }
  function paras(list) {
    return (list || []).map(function (p) { return "<p>" + inline(p) + "</p>"; }).join("");
  }
  function listItems(list) {
    return (list || []).map(function (t) { return "<li>" + inline(t) + "</li>"; }).join("");
  }
  // A title can be one line or a list of lines; each line starts on its own.
  function titleLines(t) {
    return (Array.isArray(t) ? t : [t]).map(function (l) { return '<span class="line">' + inline(l) + "</span>"; }).join(" ");
  }
  function head(o, id, tag) {
    tag = tag || "h2";
    return '<div class="head reveal">' + eyebrow(o.eyebrow) + "<" + tag + ' id="' + id + '-title">' + titleLines(o.title) + "</" + tag + "></div>";
  }
  function prose(list, extra) {
    return list && list.length ? '<div class="prose reveal' + (extra ? " " + extra : "") + '">' + paras(list) + "</div>" : "";
  }
  function kicker(number, label) {
    return '<div class="kicker"><span class="num" aria-hidden="true">' + esc(number) + '</span><span class="tag">' + esc(label) + "</span></div>";
  }
  function closing(lines, extra) {
    return lines ? '<p class="closing reveal' + (extra ? " " + extra : "") + '">' + titleLines(lines) + "</p>" : "";
  }
  function fill(name, html) {
    var el = $('[data-render="' + name + '"]');
    if (el) el.innerHTML = html;
  }

  function renderSections() {
    var h = C.hero;
    fill("intro", '<div class="wrap">' + head(h, "intro", "h1").replace('class="head', 'class="head head--hero') +
      '<div class="intro-body">' + prose(h.text) +
        '<div class="intro-aside reveal">' + (h.highlight ? '<p class="highlight">' + inline(h.highlight) + "</p>" : "") +
          '<div class="actions">' + h.actions.map(function (a) { return btn(a, "btn--" + (a.style || "primary")); }).join("") + "</div>" +
        "</div>" +
      "</div></div>");

    var o = C.offer;
    fill("offer", '<div class="wrap">' + head(o, "offer") + prose(o.text, "prose--offset") +
      '<ol class="pillars" role="list">' + o.items.map(function (it) {
        return '<li class="pillar reveal">' + kicker(it.number, it.label) + "<h3>" + inline(it.title) + "</h3>" + paras(it.text) + "</li>";
      }).join("") + "</ol></div>");

    var a = C.approach;
    fill("approach", '<div class="wrap">' + head(a, "approach") +
      '<div class="approach-grid"><div class="approach-copy">' +
        '<ul class="statements reveal" role="list">' + listItems(a.statements) + "</ul>" +
        prose(a.text) +
        '<ul class="questions reveal" role="list">' + listItems(a.questions) + "</ul>" +
        closing(a.closing) +
      "</div>" +
      (a.image ? '<figure class="approach-image reveal"><div class="film">' + picture(a.image, a.imageAlt, "(max-width: 899px) 92vw, 40vw") + "</div></figure>" : "") +
      "</div></div>");

    var l = C.languages;
    fill("languages", '<div class="wrap lang-grid"><div>' + head(l, "languages") + prose(l.text) + closing(l.closing) + "</div>" +
      '<p class="codes reveal" aria-hidden="true">' + (l.codes || []).map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("") + "</p></div>");

    var w = C.work;
    fill("work", '<div class="wrap">' + head(w, "work") + prose(w.text, "prose--offset") +
      '<ul class="showcase" role="list">' + w.items.map(function (it) {
        return '<li class="reveal"><div class="film">' + picture(it.image, it.alt, "(max-width: 1023px) 46vw, 30vw") + "</div></li>";
      }).join("") + "</ul>" + closing(w.closing, "closing--center") + "</div>");

    var p = C.process;
    fill("process", '<div class="wrap">' + head(p, "process") + prose(p.text, "prose--offset") +
      '<ol class="steps" role="list">' + p.steps.map(function (s) {
        return '<li class="step reveal">' + kicker(s.number, s.label) + "<h3>" + inline(s.title) + "</h3>" + paras(s.text) + "</li>";
      }).join("") + "</ol></div>");

    var t = C.time;
    fill("time", '<div class="wrap">' + head(t, "time") + prose(t.text, "prose--offset") +
      '<ul class="tasks reveal" role="list">' + listItems(t.tasks) + "</ul>" +
      (t.tasksAfter ? '<p class="tasks-after reveal">' + inline(t.tasksAfter) + "</p>" : "") +
      '<div class="time-highlight reveal"><p class="highlight">' + inline(t.highlight) + "</p><p>" + inline(t.highlightText) + "</p></div>" +
      '<ol class="benefits" role="list">' + t.items.map(function (it, i) {
        return '<li class="benefit reveal"><span class="num" aria-hidden="true">' + pad(i + 1) + "</span><h3>" + inline(it.title) + "</h3><div>" + paras(it.text) + "</div></li>";
      }).join("") + "</ol>" +
      (t.result ? '<div class="result reveal"><p class="result-kicker">' + inline(t.result.kicker) + '</p><ul role="list">' + listItems(t.result.lines) + "</ul></div>" : "") +
      closing(t.closing, "closing--center") + "</div>");

    var v = C.value;
    fill("value", '<div class="wrap">' + head(v, "value") + prose(v.text, "prose--offset") +
      '<ul class="values" role="list">' + v.items.map(function (it) {
        return '<li class="reveal"><h3>' + inline(it.title) + "</h3><p>" + inline(it.text) + "</p></li>";
      }).join("") + "</ul></div>");

    var c = C.contact, f = c.fields;
    var mailto = !c.formEndpoint;
    function field(name, type, full, required, extra) {
      var id = "f-" + name;
      var input = type === "textarea"
        ? '<textarea id="' + id + '" name="' + name + '" rows="5"' + (extra || "") + (required ? " required" : "") + "></textarea>"
        : '<input id="' + id + '" name="' + name + '" type="' + type + '"' + (extra || "") + (required ? " required" : "") + ">";
      return '<div class="field' + (full ? " field--full" : "") + '"><label for="' + id + '">' + esc(f[name]) +
        (required ? "" : ' <span class="optional">' + esc(UI.optional) + "</span>") + "</label>" + input + "</div>";
    }
    fill("contact", '<div class="wrap contact-grid"><div class="contact-intro">' + head(c, "contact") + prose(c.text) +
        '<dl class="contact-details reveal">' +
          "<div><dt>" + esc(UI.emailLabel) + '</dt><dd><a class="text-link" href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></dd></div>" +
          "<div><dt>" + esc(UI.basedInLabel) + "</dt><dd>" + esc(c.location) + "</dd></div>" +
        "</dl></div>" +
      '<form class="form reveal" novalidate aria-labelledby="contact-title">' +
        field("name", "text", false, true, ' autocomplete="name"') +
        field("business", "text", false, false, ' autocomplete="organization"') +
        field("email", "email", false, true, ' autocomplete="email" inputmode="email"') +
        field("island", "text", false, false) +
        field("type", "text", true, false) +
        field("message", "textarea", true, true, c.messagePlaceholder ? ' placeholder="' + esc(c.messagePlaceholder) + '"' : "") +
        '<div class="form-foot"><button class="btn btn--primary" type="submit">' + esc(c.submitLabel) + " " + ARROW + "</button>" +
          '<p class="form-note">' + esc(c.note) + (mailto && UI.mailtoNote ? " " + esc(UI.mailtoNote) : "") + "</p></div>" +
        '<p class="form-status" role="status" aria-live="polite"></p>' +
      "</form></div>");

    var ft = C.footer;
    fill("footer",
      '<div class="footer-row"><div class="footer-brand">' + brandLink('aria-label="' + esc(UI.homeLabel) + '"') +
        (ft.tagline ? '<p class="footer-tagline">' + esc(ft.tagline) + "</p>" : "") + "</div>" +
        '<nav aria-label="' + esc(UI.footerNav) + '">' + navLinks() + "</nav></div>" +
      '<div class="footer-row"><span>' + esc(ft.copyright) + "</span>" +
        '<a class="to-top" href="#">' + esc(UI.backToTop) + ' <span aria-hidden="true">↑</span></a></div>');
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
    window.matchMedia("(min-width: 1080px)").addEventListener("change", function (e) { if (e.matches) shut(false); });
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
    this.maxInflight = 6;
    this.loaded = 0;
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
    this.onprogress = null;                     // called with (loaded, total) as tiles arrive
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
    // The needed tile and its neighbours first, then straight on in playback
    // order, so the whole clip streams in the order it will be watched.
    var t = this.target, n = this.tiles, i;
    for (i = Math.max(t - 1, 0); i <= Math.min(t + 2, n - 1); i++) if (this.ok(i)) return i;
    for (i = t + 3; i < n; i++) if (this.ok(i)) return i;
    for (i = t - 2; i >= 0; i--) if (this.ok(i)) return i;
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
        self.loaded++;
        if (self.onprogress) self.onprogress(self.loaded, self.tiles);
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
    var bar = $(".story-progress b");
    var skip = $(".story-skip");
    var copies = $$("[data-copy]", stage);
    var seq = null, timeline = null, variantName = null, dir = 1, tableTrack = null;
    // Playback follows the scroll position on a critically damped spring (native
    // scrolling is untouched): it speeds up and slows down gradually, so when the
    // visitor stops scrolling the film glides to rest instead of halting.
    // Lower OMEGA = longer, softer glide (settles in about 6.6 / OMEGA seconds).
    var OMEGA = 6.5, JUMP = 1.0; // JUMP: target moves further than this (viewport heights) in one frame = cut, not glide
    var misses = 0, targetT = 0, shownT = -1, velT = 0, prevTarget = -1, lastNow = 0, running = false, drawnKey = "";

    function motionOn() { return root.classList.contains("motion"); }

    // Preloader: the logo and a progress line cover the page while the film
    // downloads, so playback is smooth from the first scroll. It lifts when every
    // frame is in and the opening frames are decoded, or after PRELOAD_MAX ms.
    var PRELOAD_MAX = 12000;
    var pre = $(".preloader"), preBar = pre ? $("b", pre) : null;
    var preDone = !pre || !motionOn();
    function preloadDone() {
      if (pre) pre.classList.add("is-done");
      root.classList.remove("is-preloading");
      if (preDone) return;
      preDone = true;
      request();
    }
    if (preDone) preloadDone();
    else { root.classList.add("is-preloading"); setTimeout(preloadDone, PRELOAD_MAX); }
    function preloadProgress(loaded, total) {
      if (preDone) return;
      if (preBar) preBar.style.transform = "scaleX(" + (loaded / total).toFixed(3) + ")";
      if (loaded < total) return;
      var s = seq, first = [];
      for (var t = 0; t < Math.min(4, s.tiles); t++) first.push(s.decodeTile(t));
      Promise.all(first).then(function () { if (s === seq) preloadDone(); });
    }

    function fallback() {
      // Loading failed or motion is not wanted: show the composed static story.
      preloadDone();
      if (seq) { seq.destroy(); seq = null; }
      root.classList.remove("motion");
      root.classList.add("no-motion");
    }

    function buildTimeline(pacing, fps, count) {
      var acc = 0, segs = pacing.map(function (p) {
        var s = { id: p.id, vh: p.vh, start: acc, end: acc + p.vh,
          f0: clamp(Math.round(p.from * fps), 0, count - 1), f1: clamp(Math.round(p.to * fps), 0, count - 1) };
        acc += p.vh; return s;
      });
      return { segs: segs, total: acc };
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
    // The scroll cue fades out as soon as the story starts moving.
    function copyOpacity(key, t) { return 1 - ramp(t, 0.02, 0.25); }

    // Table lettering: map the text box onto the four table corners with a
    // projective (matrix3d) transform, inside a layer that follows the canvas's cover crop.
    var tt = $(".table-title", stage), ttPlane = tt ? $(".table-title-plane", tt) : null;
    function quadMatrix(w, h, q) {
      var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
      var dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
      var den = dx1 * dy2 - dx2 * dy1, g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
      var a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
      return "matrix3d(" + [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1].join(",") + ")";
    }
    function placeTitle() {
      if (!tt) return;
      tt.hidden = !(seq && tableTrack && C.story.tableTitle && C.story.tableTitle[variantName]);
      if (tt.hidden) return;
      var W = stage.clientWidth, H = stage.clientHeight, iw = seq.m.width, ih = seq.m.height;
      var sc = Math.max(W / iw, H / ih), fx = seq.m.focalX != null ? seq.m.focalX : 0.5, fy = seq.m.focalY != null ? seq.m.focalY : 0.5;
      tt.style.width = iw + "px"; tt.style.height = ih + "px";
      tt.style.transform = "translate(" + ((W - iw * sc) * fx).toFixed(2) + "px," + ((H - ih * sc) * fy).toFixed(2) + "px) scale(" + sc.toFixed(5) + ")";
    }
    // Carry the lettering onto frame i with the tracked table movement (hidden where the table is out of view).
    var ttFrame = -2;
    function setTitleFrame(i) {
      if (!tt || i === ttFrame) return;
      ttFrame = i;
      var tr = tableTrack && tableTrack[i], quads = C.story.tableTitle && C.story.tableTitle[variantName];
      var quad = tr && quads && (tr[0] === 0 ? quads.opening : quads.ending);
      tt.style.opacity = quad ? 1 : 0;
      if (quad) ttPlane.style.transform = "matrix(" + tr[1] + ",0,0," + tr[1] + "," + tr[2] + "," + tr[3] + ") " + quadMatrix(1000, 90, quad);
    }

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; drawnKey = ""; }
      placeTitle();
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
        if (!drawnKey) { var near = seq.nearestReady(i); if (near) { paint(near); setTitleFrame(-1); } }
        seq.decode(i).then(function (c) { if (c) { drawnKey = ""; request(); } });
      } else {
        paint(c);
        setTitleFrame(i);
        drawnKey = String(i);
      }
      // Decode tiles ahead in the direction of travel, and one behind.
      var t0 = seq.tileOf(i), ahead = Math.min(6, seq.maxBitmaps - 4);
      for (var k = 1; k <= ahead; k++) {
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
      bar.style.transform = "scaleX(" + (t / timeline.total).toFixed(4) + ")";

      copies.forEach(function (el) { el.style.opacity = copyOpacity(el.getAttribute("data-copy"), t).toFixed(3); });
      var nearEnd = t > timeline.total - 0.35 || track.getBoundingClientRect().bottom < window.innerHeight * 0.5;
      skip.classList.toggle("is-hidden", nearEnd);
      if (nearEnd) skip.setAttribute("tabindex", "-1"); else skip.removeAttribute("tabindex");
    }
    function tick(now) {
      if (!timeline) { running = false; return; }
      targetT = readScroll();
      // Big jumps (anchor links, skip, first paint, the End key) cut straight to the new place.
      if (shownT < 0 || prevTarget < 0 || Math.abs(targetT - prevTarget) > JUMP) { shownT = targetT; velT = 0; }
      else {
        var dt = (lastNow ? Math.min(now - lastNow, 64) : 16) / 1000;
        // Exact step of a critically damped spring towards the target.
        var x = shownT - targetT, e = Math.exp(-OMEGA * dt), k = velT + OMEGA * x;
        var nx = (x + k * dt) * e, nv = (velT - OMEGA * k * dt) * e;
        if (x !== 0 && nx * x < 0) { nx = 0; nv = 0; } // never overshoot and play backwards
        shownT = targetT + nx; velT = nv;
        if (Math.abs(nx) < 0.0004 && Math.abs(nv) < 0.002) { shownT = targetT; velT = 0; }
      }
      if (velT) dir = velT > 0 ? 1 : -1; else if (targetT !== shownT) dir = targetT > shownT ? 1 : -1;
      prevTarget = targetT;
      lastNow = now;
      render(shownT);
      if (shownT !== targetT) requestAnimationFrame(tick);
      else { running = false; lastNow = 0; velT = 0; }
    }
    function request() { if (!running) { running = true; requestAnimationFrame(tick); } }
    function update() { request(); }

    function load(name) {
      if (seq) { seq.destroy(); seq = null; }
      drawnKey = ""; shownT = -1; prevTarget = -1; velT = 0; tableTrack = null; ttFrame = -2;
      story.classList.remove("is-live");
      variantName = name;
      var pacing = C.pacing[name];
      var src = C.media[name].manifest;
      var base = src.slice(0, src.lastIndexOf("/") + 1);
      // Provisional timeline so the page has the right height before the manifest arrives.
      timeline = buildTimeline(pacing, 24, 289);
      track.style.setProperty("--travel", timeline.total);
      request();
      if (!motionOn()) return;
      fetch(src, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (m) {
          if (variantName !== name || !motionOn()) return;
          timeline = buildTimeline(pacing, m.fps, m.count);
          track.style.setProperty("--travel", timeline.total);
              seq = new Sequence(m, base);
          seq.onframe = function () { drawnKey = ""; request(); };
          seq.onfatal = fallback;
          seq.onprogress = preloadProgress;
          seq.active = storyNear;
          sizeCanvas();
          // Table movement for the lettering; without it the lettering simply stays hidden.
          fetch(base + "table.json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (d) { if (variantName !== name) return; tableTrack = d.frames; ttFrame = -2; placeTitle(); drawnKey = ""; request(); })
            .catch(function () {});
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
    // Start at the very top; the browser may still restore a position as late as "load",
    // so reset again then unless the visitor has already begun to scroll.
    var touched = false;
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
      window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true });
    });
    window.scrollTo(0, 0);
    window.addEventListener("load", function () { if (!touched) window.scrollTo(0, 0); });
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
      get decoded() { return seq ? seq.bitmaps.size : 0; },
      get preloaded() { return preDone; }
    };
  }

  /* ---------- contact form ---------- */
  function setupForm() {
    var c = C.contact, form = $(".form");
    if (!form) return;
    var status = $(".form-status", form), button = $("button[type=submit]", form);
    function say(text, isError) {
      status.textContent = text.replace("{email}", c.email);
      status.classList.toggle("is-error", !!isError);
    }
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") && e.target.checkValidity()) e.target.removeAttribute("aria-invalid");
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = $$("input, textarea", form), bad = fields.filter(function (el) { return !el.checkValidity(); });
      fields.forEach(function (el) { if (bad.indexOf(el) < 0) el.removeAttribute("aria-invalid"); else el.setAttribute("aria-invalid", "true"); });
      if (bad.length) {
        say(UI.formInvalid, true);
        bad[0].focus();
        return;
      }
      var data = new FormData(form);
      if (c.formEndpoint) {
        button.disabled = true;
        say(UI.formSending);
        fetch(c.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            say(UI.formSent);
            form.reset();
          })
          .catch(function () { say(UI.formError, true); })
          .then(function () { button.disabled = false; });
        return;
      }
      // No form service yet: hand the message to the visitor's own email app.
      // Nothing has been sent at this point, so the status says exactly that.
      var lines = ["name", "business", "email", "island", "type"].map(function (k) {
        return c.fields[k] + ": " + (String(data.get(k) || "").trim() || "–");
      });
      lines.push("", c.fields.message + ":", data.get("message") || "");
      var business = String(data.get("business") || "").trim();
      var subject = UI.mailSubject + (business ? " – " + business : "");
      window.location.href = "mailto:" + c.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
      say(UI.mailtoOpened);
    });
  }

  /* ---------- in-page links ---------- */
  // Menu, buttons and footer links jump to their section below the fixed header.
  // Between sections the page glides; to or from the film it cuts straight
  // there, since gliding through the story would replay the whole film.
  function setupAnchors() {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      var target = id ? document.getElementById(id) : null;
      if (id && !target) return;
      e.preventDefault();
      var story = $("#story");
      var afterStory = story ? story.offsetTop + story.offsetHeight - window.innerHeight - 2 : 0;
      var glide = root.classList.contains("motion") && window.scrollY >= afterStory &&
        (!target || target === story ? false : target.getBoundingClientRect().top + window.scrollY >= afterStory);
      var behavior = glide ? "smooth" : "auto";
      if (!target) {
        window.scrollTo({ top: 0, behavior: behavior });
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        return;
      }
      target.scrollIntoView({ behavior: behavior, block: "start" });
      // Move keyboard focus with the view, without a second jump.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); }
    });
  }

  /* ---------- current section in the menu ---------- */
  function setupActiveNav() {
    if (!("IntersectionObserver" in window)) return;
    var links = $$('.site-nav a:not(.btn), .menu nav a, .site-footer nav a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute("href") === "#" + en.target.id) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-40% 0px -59% 0px" });
    $$("main > section[id]").forEach(function (s) { io.observe(s); });
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
  setupAnchors();
  setupActiveNav();
  setupReveals();
})();
