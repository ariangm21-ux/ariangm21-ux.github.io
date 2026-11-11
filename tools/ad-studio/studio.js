/* Greyrock free product: ad creative studio (the page controller).
   Drawing lives in engine.js + one file per style in /layouts/. This file wires the controls,
   photos (incl. the background remover), brand kit, previews, mock-ups, ad check, exports
   (PNG/JPG, clipboard, ZIP test packs), undo/redo, remix links and tracking.
   Everything runs in the visitor's browser. Photos are never saved or sent anywhere. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const T = window.GTOOLS || { track() {}, openLead() {}, setLeadExtra() {} };
  const G = window.GRS;
  if (!G) return;
  const KEY = "gr-ad-studio-v2", OLD_KEY = "gr-ad-studio", KIT_KEY = "gr-ad-studio-logo";
  const SIZES = ["square", "portrait", "story", "landscape"];
  const FILE_TAG = { square: "1x1", portrait: "4x5", story: "9x16", landscape: "1.91x1" };
  const SIZE_LABEL = { square: "Square 1:1", portrait: "Portrait 4:5", story: "Story 9:16", landscape: "Link 1.91:1" };
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }, del(k) { try { localStorage.removeItem(k); } catch { /* blocked */ } } };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ============================== state ============================== */
  const BASE = clone(G.DEFAULTS);
  const sanitize = (s) => {
    const out = clone(BASE);
    if (!s || typeof s !== "object") return out;
    Object.keys(BASE).forEach((k) => {
      if (!(k in s)) return;
      if (k === "badges" || k === "adjust") { Object.keys(BASE[k]).forEach((b) => { if (b in (s[k] || {})) out[k][b] = typeof BASE[k][b] === "number" ? Number(s[k][b]) || 0 : !!s[k][b]; }); return; }
      out[k] = typeof BASE[k] === "number" ? Number(s[k]) || 0 : String(s[k] ?? "").slice(0, 160);
    });
    if (!/^#[\da-f]{6}$/i.test(out.color)) out.color = BASE.color;
    if (out.accent && !/^#[\da-f]{6}$/i.test(out.accent)) out.accent = "";
    if (!(out.font in G.FONTS)) out.font = "modern";
    out.lang = out.lang === "bn" ? "bn" : "en";
    out.zoom = clamp(out.zoom || 1, 1, 3); out.fx = clamp(out.fx, 0, 1); out.fy = clamp(out.fy, 0, 1);
    out.textScale = clamp(out.textScale || 1, 0.8, 1.25); out.overlay = clamp(out.overlay || 1, 0.3, 1.3);
    out.rating = clamp(out.rating || 0, 0, 5);
    return out;
  };
  let st = clone(BASE);
  (() => {
    const saved = store.get(KEY);
    if (saved) { try { st = sanitize(JSON.parse(saved)); return; } catch { /* corrupt */ } }
    const v1 = store.get(OLD_KEY);                       // carry over the first version's settings
    if (v1) {
      try {
        const o = JSON.parse(v1);
        st = sanitize({ ...o, badges: { cod: !!o.cod, free: !!o.free, stock: !!o.stock } });
      } catch { /* ignore */ }
    }
  })();
  // a remix link (#s=…) wins over saved settings
  let fromLink = false;
  (() => {
    const m = /[#&]s=([\w-]+)/.exec(location.hash || "");
    if (!m) return;
    try {
      const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
      st = sanitize({ ...st, ...JSON.parse(json) });
      fromLink = true;
    } catch { /* bad link */ }
    history.replaceState(null, "", location.pathname + location.search);
  })();

  const photos = [null, null, null];   // { img, cutout, name, w, h, cutState }
  let logo = null;                     // HTMLImageElement
  let packMode = false;
  const pack = new Set();
  const packSizes = new Set(["square", "portrait", "story", "landscape"]);
  let groupFilter = "all";
  const assets = () => ({ photos: photos.filter(Boolean).map((p) => ({ img: p.img, cutout: p.cutout })), logo });

  /* ============================== copy & presets ============================== */
  const IDEAS = {
    en: ["Eid Collection 2027", "New arrival, limited stock", "The *bestseller* is back", "Order today, get it tomorrow", "Buy 2, get 1 *free*", "Premium quality, honest price", "Last chance before *Eid*", "A gift they'll actually love", "100% original, guaranteed", "*Flash sale*: today only", "Glow up this wedding season", "Made for Dhaka summers", "Restocked by popular demand", "Your skin will *thank you*", "Comfort you can feel", "Free delivery all over Dhaka"],
    bn: ["ঈদ কালেকশন ২০২৭", "নতুন এসেছে, স্টক সীমিত", "*বেস্টসেলার* আবার স্টকে", "আজ অর্ডার, কাল ডেলিভারি", "২টা কিনলে ১টা *ফ্রি*", "প্রিমিয়াম কোয়ালিটি, ন্যায্য দাম", "*ঈদের* আগে শেষ সুযোগ", "প্রিয়জনের জন্য সেরা উপহার", "১০০% অরিজিনাল, গ্যারান্টি", "*ফ্ল্যাশ সেল*: শুধু আজ", "বিয়ের সিজনে নিজেকে সাজান", "গরমে আরামের সঙ্গী", "সবার চাহিদায় আবার এসেছে", "ত্বকের যত্নে *সেরা* বাছাই", "আরামে অনন্য", "সারা ঢাকায় ফ্রি ডেলিভারি"],
  };
  const PRESETS = [
    ["Royal blue", "#2E5BFF", ""], ["Eid emerald", "#0F7B4F", "#E9C46A"], ["Boishakh red", "#C8102E", "#F4C430"], ["Blush", "#E86A92", "#2B2D42"],
    ["Mustard", "#E0A526", "#1F3A5F"], ["Plum", "#6B2D5C", "#F2A65A"], ["Teal", "#0E8C8C", "#FF7A59"], ["Charcoal", "#23262B", "#FFC83D"],
    ["Terracotta", "#C8553D", "#2F4858"], ["Lavender", "#8E7CC3", "#FFD166"],
  ];
  const STICKER_LABEL = { auto: "Auto % off", none: "None", new: "New", hot: "Hot", best: "Best seller", eid: "Eid special", limited: "Limited", today: "Today only" };
  const LOGO_STYLES = [["auto", "Auto"], ["original", "Original"], ["white", "White"], ["dark", "Dark"], ["plate", "On white"]];
  // fields whose untouched default text swaps when the language changes
  const SWAP = ["brand", "headline", "cta", "festive"];

  /* ============================== helpers ============================== */
  const toast = (() => {
    const el = $("#toast"); let tm = 0;
    return (html, ms = 3200) => { el.innerHTML = html; el.hidden = false; requestAnimationFrame(() => el.classList.add("on")); clearTimeout(tm); tm = setTimeout(() => { el.classList.remove("on"); setTimeout(() => (el.hidden = true), 300); }, ms); };
  })();
  const slug = () => (String(st.brand || "ad").toLowerCase().replace(/[^\wঀ-৿]+/g, "-").replace(/^-|-$/g, "") || "ad");
  const toBlob = (c, type, q) => new Promise((res) => c.toBlob((b) => res(b), type, q));
  function saveBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 6000);
  }
  const setRangeFill = (el) => { const min = +el.min || 0, max = +el.max || 1; el.style.setProperty("--p", `${((+el.value - min) / (max - min)) * 100}%`); };
  const pct = (v) => `${Math.round(v * 100)}%`;
  // saturation × usable brightness of a hex colour (0 = grey/white/black, 1 = pure vivid)
  const vivid = (hex) => {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx ? ((mx - mn) / mx) * (mx > 40 ? 1 : 0) : 0;
  };

  /* ============================== tracking ============================== */
  let used = false;
  const touch = (field) => {
    if (!used) { used = true; T.track("studio_used", { tool: "ad-studio" }, { section: "studio", metaParams: { content_name: "Ad creative studio" } }); }
    if (field) T.track("studio_change", { tool: "ad-studio", field }, { section: "studio" });
  };
  const ev = (name, params = {}) => T.track(name, { tool: "ad-studio", template: st.template, lang: st.lang, ...params }, { section: "studio" });

  /* ============================== history (undo / redo) ============================== */
  const hist = { past: [], future: [] };
  let snap = JSON.stringify(st), commitT = 0;
  function commit(now) {
    clearTimeout(commitT);
    const run = () => {
      const s = JSON.stringify(st);
      if (s === snap) return;
      hist.past.push(snap); if (hist.past.length > 80) hist.past.shift();
      hist.future = []; snap = s; paintHistory();
    };
    if (now) run(); else commitT = setTimeout(run, 450);
  }
  function travel(dir) {
    commit(true);
    const from = dir < 0 ? hist.past : hist.future, to = dir < 0 ? hist.future : hist.past;
    if (!from.length) return;
    to.push(snap); snap = from.pop(); st = sanitize(JSON.parse(snap));
    paintControls(); render(); save(); paintHistory();
    ev(dir < 0 ? "studio_undo" : "studio_redo");
  }
  function paintHistory() { $("#undo").disabled = !hist.past.length; $("#redo").disabled = !hist.future.length; }
  let saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => store.set(KEY, JSON.stringify(st)), 250); };
  // apply a change: repaint, render, persist, remember for undo
  function changed(field, opts = {}) {
    if (opts.paint !== false) paintControls();
    render(); save(); commit(!!opts.now);
    if (field) { clearTimeout(changed.t); changed.t = setTimeout(() => touch(field), 900); }
  }

  /* ============================== rendering ============================== */
  const pv = {};
  $$(".pv").forEach((f) => (pv[f.dataset.size] = { fig: f, canvas: $("canvas", f) }));
  const scaleFor = (size) => {
    const c = pv[size].canvas, w = c.parentElement.clientWidth || 320;
    return clamp((w * Math.min(2, window.devicePixelRatio || 1)) / G.SIZES[size].w, 0.2, 1);
  };
  let raf = 0, version = 0;
  const lastStats = {};
  function render() {
    version++;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const a = assets();
      SIZES.forEach((s) => { const r = G.render(pv[s].canvas, s, st, a, { scale: scaleFor(s) }); lastStats[s] = r; });
      afterRender();
    });
  }
  function afterRender() {
    paintCheck();
    if (!$("#mockups").hidden) paintMockups();
    paintMini();
    scheduleThumbs();
  }

  /* ---------- style strip with live thumbnails of every style, using the seller's own content ---------- */
  const thumbs = {};
  function buildStrip() {
    const strip = $("#style-strip");
    strip.innerHTML = G.order.map((id) => {
      const L = G.layouts[id];
      const tags = [L.photos > 1 ? `${L.photos} photos` : "", L.cutout === "best" ? "cut-out" : ""].filter(Boolean);
      return `<button type="button" class="style-card" role="radio" data-tpl="${id}" data-group="${L.group}" aria-checked="false">
        <span class="sc-frame"><canvas width="10" height="10" aria-hidden="true"></canvas><i class="sc-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg></i></span>
        <b>${L.name}</b>${tags.length ? `<small>${tags.join(" · ")}</small>` : ""}</button>`;
    }).join("");
    $$(".style-card", strip).forEach((b) => (thumbs[b.dataset.tpl] = { btn: b, canvas: $("canvas", b), v: -1 }));
    $("#style-count").textContent = `· ${G.order.length}`;
    const groups = ["all", ...Object.keys(G.GROUPS).filter((g) => G.order.some((id) => G.layouts[id].group === g))];
    $("#group-filter").innerHTML = groups.map((g) => `<button type="button" class="fchip" data-group="${g}" aria-pressed="${g === groupFilter}">${g === "all" ? "All" : G.GROUPS[g]}</button>`).join("");
  }
  let thumbT = 0, thumbQ = [];
  function scheduleThumbs() {
    clearTimeout(thumbT);
    thumbT = setTimeout(() => {
      thumbQ = G.order.filter((id) => thumbs[id] && thumbs[id].v !== version && !thumbs[id].btn.hidden);
      // the visible ones first
      const strip = $("#style-strip"), sr = strip.getBoundingClientRect();
      thumbQ.sort((a, b) => Math.abs(thumbs[a].btn.getBoundingClientRect().left - sr.left) - Math.abs(thumbs[b].btn.getBoundingClientRect().left - sr.left));
      pumpThumbs();
    }, 260);
  }
  function pumpThumbs() {
    const t0 = performance.now(), a = assets();
    while (thumbQ.length && performance.now() - t0 < 12) {
      const id = thumbQ.shift(), th = thumbs[id];
      const w = th.canvas.parentElement.clientWidth || 120;
      G.render(th.canvas, "square", { ...st, template: id }, a, { scale: (w * Math.min(2, window.devicePixelRatio || 1)) / 1080 });
      th.v = version;
    }
    if (thumbQ.length) requestAnimationFrame(pumpThumbs);
  }
  function paintStrip() {
    $$(".style-card").forEach((b) => {
      const id = b.dataset.tpl, on = id === st.template;
      b.setAttribute("aria-checked", String(on)); b.classList.toggle("on", on);
      b.classList.toggle("picked", packMode && pack.has(id));
      b.hidden = groupFilter !== "all" && b.dataset.group !== groupFilter;
    });
    $$("#group-filter .fchip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.group === groupFilter)));
    const L = G.layouts[st.template];
    if (L) {
      const hasPhoto = photos.some(Boolean);
      let hint = "";
      if (L.cutout === "best" && hasPhoto && !st.cutout) hint = `<button type="button" class="link-btn" data-act="cut-on">Looks best with the background removed: turn it on</button>`;
      else if (L.photos > 1 && photos.filter(Boolean).length < L.photos && hasPhoto) hint = `<span>Add ${L.photos === 2 ? "a second photo" : "up to 3 photos"} for this style.</span>`;
      $("#style-info").innerHTML = `<b>${L.name}</b><span>${L.desc || ""}</span>${hint}`;
    }
  }
  function scrollToActive() {
    const b = thumbs[st.template] && thumbs[st.template].btn, strip = $("#style-strip");
    if (!b || b.hidden) return;
    const l = b.offsetLeft - strip.clientWidth / 2 + b.clientWidth / 2;
    strip.scrollTo({ left: l, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function setTemplate(id, how) {
    if (!G.layouts[id] || id === st.template) return;
    st.template = id;
    paintStrip(); changed(null, { paint: false, now: true });
    scrollToActive();
    ev("studio_template", { via: how || "click" });
    touch();
  }

  /* ============================== controls ============================== */
  function buildControls() {
    $("#badge-toggles").innerHTML = G.BADGES.map((b) => `<label class="switch"><input type="checkbox" data-badge="${b}" /><span class="sw" aria-hidden="true"></span><span data-badge-label="${b}"></span></label>`).join("");
    $("#sticker-row").innerHTML = G.STICKERS.map((s) => `<button type="button" class="fchip sm" role="radio" data-sticker="${s}" aria-checked="false">${STICKER_LABEL[s]}</button>`).join("");
    $("#presets").innerHTML = PRESETS.map(([n, c, a]) => `<button type="button" class="swatch" data-preset="${c}|${a}" title="${n}" aria-label="${n} palette" style="--c:${c};--a:${a || G.autoAccent(c)}"></button>`).join("");
    const q = (s) => s.replace(/"/g, "'");
    $("#font-row").innerHTML = Object.entries(G.FONTS).map(([k, F]) => `<button type="button" class="font-chip" role="radio" data-font="${k}" aria-checked="false"><span style="font-family:${q(F.display)},${q(F.bn)},sans-serif;font-weight:${F.dW}">Aa <span lang="bn">অআ</span></span><small>${F.label}</small></button>`).join("");
    $("#logo-style").innerHTML = LOGO_STYLES.map(([k, l]) => `<button type="button" data-logo-style="${k}" aria-pressed="false">${l}</button>`).join("");
    $("#pack-sizes").innerHTML = SIZES.map((s) => `<button type="button" class="fchip sm" data-pack-size="${s}" aria-pressed="true">${SIZE_LABEL[s]}</button>`).join("");
  }
  function paintControls() {
    $$("[data-k]").forEach((el) => { if (document.activeElement !== el) el.value = st[el.dataset.k] ?? ""; if (el.type === "range") setRangeFill(el); });
    $("#o-zoom").textContent = `${Number(st.zoom).toFixed(2)}x`;
    $("#o-color").textContent = st.color.toUpperCase();
    const auto = !st.accent;
    $("#accent-auto").checked = auto;
    if (document.activeElement !== $("#s-accent")) $("#s-accent").value = st.accent || G.autoAccent(st.color);
    $("#s-accent").disabled = auto;
    $("#o-accent").textContent = auto ? "Auto" : st.accent.toUpperCase();
    $("#o-scale").textContent = pct(st.textScale);
    $("#o-overlay").textContent = pct(st.overlay);
    $$("[data-badge]").forEach((el) => (el.checked = !!st.badges[el.dataset.badge]));
    $$("[data-badge-label]").forEach((el) => { el.textContent = G.TEXT[st.lang][el.dataset.badgeLabel]; el.lang = st.lang; });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === st.lang)));
    $$("[data-sticker]").forEach((b) => { const on = b.dataset.sticker === st.sticker; b.setAttribute("aria-checked", String(on)); b.setAttribute("aria-pressed", String(on)); });
    $$("[data-font]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.font === st.font)));
    $$("[data-align]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.align === st.align)));
    $$("[data-logo-style]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.logoStyle === st.logoStyle)));
    $$("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset.split("|")[0].toLowerCase() === st.color.toLowerCase())));
    $$("[data-adj]").forEach((el) => {
      const k = el.dataset.adj; if (document.activeElement !== el) el.value = st.adjust[k]; setRangeFill(el);
      const v = st.adjust[k]; $(`#o-${k}`).textContent = k === "warmth" ? (v > 0 ? `+${Math.round(v * 100)}` : `${Math.round(v * 100)}`) : pct(v);
    });
    $("#cut-toggle").checked = !!st.cutout;
    $("#cut-strength-field").hidden = !st.cutout;
    $("#s-quote").placeholder = G.TEXT[st.lang].quote; $("#s-reviewer").placeholder = G.TEXT[st.lang].reviewer;
    $("#s-prefix").placeholder = st.lang === "bn" ? "যেমন মাত্র" : "e.g. Only";
    $("#s-proof").placeholder = st.lang === "bn" ? "যেমন ২,০০০+ সন্তুষ্ট গ্রাহক" : "e.g. 2,000+ happy customers";
    paintStrip();
  }

  // text, number, select, range, date
  $("#studio-form").addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.k) {
      const k = el.dataset.k;
      st[k] = typeof BASE[k] === "number" ? Number(el.value) || 0 : el.value;
      if (k === "zoom") st.zoom = clamp(st.zoom, 1, 3);
      if (el.type === "range") setRangeFill(el);
      if (k === "color" && st.accent && st.accent.toLowerCase() === st.color.toLowerCase()) st.accent = "";
      changed(k);
      return;
    }
    if (el.dataset.adj) { st.adjust[el.dataset.adj] = Number(el.value); setRangeFill(el); changed(`adjust:${el.dataset.adj}`); return; }
    if (el.dataset.badge) { st.badges[el.dataset.badge] = el.checked; changed(`badge:${el.dataset.badge}`, { now: true }); return; }
    if (el.id === "s-accent") { st.accent = el.value; changed("accent"); return; }
    if (el.id === "cut-strength") { setRangeFill(el); $("#o-cut").textContent = pct(+el.value); clearTimeout(cutT); cutT = setTimeout(() => runCutouts(true), 260); }
  });
  $("#studio-form").addEventListener("change", (e) => {
    const el = e.target;
    if (el.id === "accent-auto") { st.accent = el.checked ? "" : G.autoAccent(st.color); changed("accent-auto", { now: true }); }
    if (el.id === "cut-toggle") { st.cutout = el.checked; paintControls(); if (st.cutout) runCutouts(); else { render(); paintCutStatus(); paintSlots(); } save(); commit(true); ev("studio_bg_remove", { on: st.cutout }); }
  });
  $("#studio-form").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.lang && t.dataset.lang !== st.lang) {
      const from = G.TEXT[st.lang], to = G.TEXT[t.dataset.lang];
      SWAP.forEach((k) => { if (!st[k] || st[k] === from[k]) st[k] = to[k]; });
      if (IDEAS[st.lang].includes(st.headline)) st.headline = IDEAS[t.dataset.lang][IDEAS[st.lang].indexOf(st.headline)] || st.headline;
      st.lang = t.dataset.lang; changed(`lang:${st.lang}`, { now: true }); return;
    }
    if (t.dataset.sticker) { st.sticker = t.dataset.sticker; changed(`sticker:${st.sticker}`, { now: true }); return; }
    if (t.dataset.font) { st.font = t.dataset.font; G.ensureFonts(st.font).then(render); changed(`font:${st.font}`, { now: true }); return; }
    if (t.dataset.align) { st.align = t.dataset.align; changed(`align:${st.align}`, { now: true }); return; }
    if (t.dataset.logoStyle) { st.logoStyle = t.dataset.logoStyle; changed(`logo-style:${st.logoStyle}`, { now: true }); return; }
    if (t.dataset.preset) { const [c, a] = t.dataset.preset.split("|"); st.color = c; st.accent = a || ""; changed("palette", { now: true }); return; }
    if (t.dataset.swatch) { st.color = t.dataset.swatch; if (st.accent.toLowerCase() === st.color.toLowerCase()) st.accent = ""; changed("photo-colour", { now: true }); return; }
    if (t.dataset.remove != null) { removePhoto(+t.dataset.remove); return; }
    if (t.dataset.move != null) { movePhoto(+t.dataset.move); return; }
  });
  $("#ideas").addEventListener("click", () => {
    const list = IDEAS[st.lang]; const i = (list.indexOf(st.headline) + 1) % list.length;
    st.headline = list[i]; changed(null, { now: true }); ev("studio_idea", { idea: i });
  });
  $("#reframe").addEventListener("click", () => { st.zoom = 1; st.fx = 0.5; st.fy = 0.5; changed("reframe", { now: true }); });
  $("#adj-reset").addEventListener("click", () => { st.adjust = clone(BASE.adjust); changed("adjust-reset", { now: true }); });
  $("#undo").addEventListener("click", () => travel(-1));
  $("#redo").addEventListener("click", () => travel(1));
  let resetArm = 0;
  $("#reset").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (!resetArm) { resetArm = setTimeout(() => { resetArm = 0; $("span", b).textContent = "Reset"; b.classList.remove("armed"); }, 3000); $("span", b).textContent = "Tap again"; b.classList.add("armed"); return; }
    clearTimeout(resetArm); resetArm = 0; $("span", b).textContent = "Reset"; b.classList.remove("armed");
    const keep = { brand: st.brand, color: st.color, accent: st.accent, font: st.font, logoStyle: st.logoStyle, lang: st.lang };
    st = sanitize({ ...BASE, ...keep, headline: G.TEXT[keep.lang].headline, cta: G.TEXT[keep.lang].cta, festive: G.TEXT[keep.lang].festive });
    changed(null, { now: true }); toast("Started over. Your brand name, colours and font were kept.");
    ev("studio_reset");
  });
  $("#share-link").addEventListener("click", async () => {
    const json = JSON.stringify(st), bytes = new TextEncoder().encode(json);
    let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b)));
    const url = `${location.origin}${location.pathname}#s=${btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch { /* not allowed */ }
    toast(ok ? "Link copied. It saves your words, colours and style (not your photos), so you or your team can remix this ad later." : `Copy this link: <input class="toast-input" value="${url}" readonly onclick="this.select()">`, ok ? 4200 : 9000);
    ev("studio_share");
  });

  /* ============================== photos ============================== */
  function paintSlots() {
    $("#slots").innerHTML = [0, 1, 2].map((i) => {
      const p = photos[i];
      if (!p) return `<label class="slot empty" for="photo-input" data-slot="${i}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>${i === 0 ? "Main photo" : `Photo ${i + 1}`}</span></label>`;
      return `<div class="slot" data-slot="${i}"><canvas width="96" height="96" aria-label="${i === 0 ? "Main photo" : `Photo ${i + 1}`}: ${p.name}"></canvas>
        ${p.cutout && st.cutout ? '<i class="slot-cut" title="Background removed">cut-out</i>' : ""}
        <span class="slot-actions">${i > 0 ? `<button type="button" class="slot-btn" data-move="${i}" aria-label="Make photo ${i + 1} the main photo" title="Make main"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg></button>` : ""}<button type="button" class="slot-btn" data-remove="${i}" aria-label="Remove photo ${i + 1}" title="Remove"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span></div>`;
    }).join("");
    $$("#slots .slot canvas").forEach((c) => {
      const p = photos[+c.parentElement.dataset.slot], src = st.cutout && p.cutout ? p.cutout : p.img, x = c.getContext("2d");
      x.clearRect(0, 0, 96, 96);
      if (st.cutout && p.cutout) { x.fillStyle = "#eee"; for (let i = 0; i < 96; i += 12) for (let j = 0; j < 96; j += 12) if ((i + j) / 12 % 2) x.fillRect(i, j, 12, 12); }
      const s = st.cutout && p.cutout ? Math.min(96 / src.width, 96 / src.height) : Math.max(96 / src.width, 96 / src.height);
      x.drawImage(src, (96 - src.width * s) / 2, (96 - src.height * s) / 2, src.width * s, src.height * s);
    });
    const n = photos.filter(Boolean).length, main = photos[0];
    $("#photo-note").textContent = !n ? "Combo, Before / After and Scrapbook can use 2–3 photos." :
      main && main.w < 800 ? `Main photo is ${main.w}×${main.h}: it may look blurry. Use one at least 1080 px wide.` : `${n} photo${n > 1 ? "s" : ""} added. Drag the photo in a preview to reframe it.`;
    $("#photo-note").classList.toggle("warn", !!(main && main.w < 800));
    $("#dropzone").classList.toggle("compact", n > 0);
  }
  function addFiles(files) {
    const list = [...files].filter((f) => /^image\//.test(f.type));
    if (!list.length) return;
    // reserve slots up front (images load asynchronously): fill empty slots in order; if all are full, replace from the main photo on
    const free = [0, 1, 2].filter((i) => !photos[i]);
    const targets = free.length ? free : [0, 1, 2];
    if (list.length > targets.length) toast(`Only ${targets.length} more photo${targets.length === 1 ? "" : "s"} fit. Up to 3 photos per ad.`);
    list.slice(0, targets.length).forEach((file, n) => {
      const slot = targets[n];
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const first = !photos.some(Boolean);
        photos[slot] = { img, name: file.name, w: img.naturalWidth, h: img.naturalHeight, cutout: null, cutKey: "" };
        if (slot === 0) { st.zoom = 1; st.fx = 0.5; st.fy = 0.5; }
        if (first) {
          // brand colour = the most vivid colour in the photo (backdrops are usually white/grey, so skip dull colours)
          const pal = G.palette(img, 8);
          const pick = pal.find((c) => vivid(c) >= 0.35) || pal.find((c) => vivid(c) >= 0.18);
          if (pick) { st.color = pick; st.accent = ""; }
        }
        paintSlots(); paintPalette(); paintControls();
        if (st.cutout) runCutouts(); else render();
        save(); commit(true);
        T.track("photo_upload", { tool: "ad-studio", slot: slot + 1, size: img.naturalWidth >= 1080 ? "1080+" : img.naturalWidth >= 800 ? "800-1079" : "under 800" }, { section: "studio" });
        touch();
      };
      img.onerror = () => toast("That file couldn't be opened as an image. Try a JPG or PNG.");
      img.src = url;
    });
  }
  function removePhoto(i) {
    photos[i] = null;
    for (let k = i; k < 2; k++) { photos[k] = photos[k + 1]; photos[k + 1] = null; }   // keep the list compact
    if (i === 0) { st.zoom = 1; st.fx = 0.5; st.fy = 0.5; }
    paintSlots(); paintPalette(); paintCutStatus(); render(); save();
    ev("photo_remove", { slot: i + 1 });
  }
  function movePhoto(i) {
    const p = photos[i]; photos[i] = photos[0]; photos[0] = p;
    st.zoom = 1; st.fx = 0.5; st.fy = 0.5;
    paintSlots(); render(); save(); ev("photo_make_main", { slot: i + 1 });
  }
  $("#photo-input").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  const dz = $("#dropzone");
  ["dragenter", "dragover"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
  dz.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
  document.addEventListener("paste", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    const files = [...((e.clipboardData || {}).items || [])].filter((i) => i.type.startsWith("image/")).map((i) => i.getAsFile());
    if (files.length) { addFiles(files); toast("Photo pasted."); }
  });

  /* palette suggestions from the main photo */
  function paintPalette() {
    const p = photos[0], f = $("#photo-palette-field");
    if (!p) { f.hidden = true; return; }
    // vivid colours first, but keep neutrals too (they suit premium styles)
    const pal = G.palette(p.img, 8).sort((a, b) => vivid(b) - vivid(a)).slice(0, 6);
    f.hidden = !pal.length;
    $("#photo-palette").innerHTML = pal.map((c) => `<button type="button" class="swatch" data-swatch="${c}" title="${c.toUpperCase()}" aria-label="Use ${c} from your photo" style="--c:${c};--a:${c}"></button>`).join("");
  }

  /* ---------- background remover: classic image processing, no AI ----------
     1. find the background colour from the photo's border  2. flood-fill from the edges
     3. also clear large enclosed patches of that colour  4. feather + de-fringe the edge  5. trim */
  let cutT = 0;
  function cutout(img, strength) {
    const max = 1400, s = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const w = Math.max(2, Math.round((img.naturalWidth || img.width) * s)), h = Math.max(2, Math.round((img.naturalHeight || img.height) * s));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
    const id = x.getImageData(0, 0, w, h), p = id.data, N = w * h;
    const border = [];
    for (let i = 0; i < w; i++) border.push(i, (h - 1) * w + i);
    for (let j = 1; j < h - 1; j++) border.push(j * w, j * w + w - 1);
    // already transparent (a PNG cut-out)?
    const clear = border.filter((i) => p[i * 4 + 3] < 24).length;
    if (clear / border.length > 0.5) return { canvas: trim(c, x, w, h), state: "transparent" };
    // background colour = the most common border colour
    const key = (i) => ((p[i * 4] >> 4) << 8) | ((p[i * 4 + 1] >> 4) << 4) | (p[i * 4 + 2] >> 4);
    const bins = new Map(); border.forEach((i) => { const k = key(i); bins.set(k, (bins.get(k) || 0) + 1); });
    let bk = 0, bn = 0; bins.forEach((n, k) => { if (n > bn) { bn = n; bk = k; } });
    // neighbouring bins count too (gradients, shadows on the backdrop)
    let share = 0; bins.forEach((n, k) => { const dr = Math.abs((k >> 8) - (bk >> 8)), dg = Math.abs(((k >> 4) & 15) - ((bk >> 4) & 15)), db = Math.abs((k & 15) - (bk & 15)); if (dr <= 1 && dg <= 1 && db <= 1) share += n; });
    share /= border.length;
    let r = 0, g = 0, b = 0, n = 0;
    border.forEach((i) => { if (key(i) === bk) { r += p[i * 4]; g += p[i * 4 + 1]; b += p[i * 4 + 2]; n++; } });
    r /= n; g /= n; b /= n;
    if (share < 0.45) return { canvas: null, state: "busy" };
    const tol = 22 + strength * 70, tol2 = tol * tol;
    const dist2 = (i) => { const o = i * 4, dr = p[o] - r, dg = p[o + 1] - g, db = p[o + 2] - b; return dr * dr * 0.8 + dg * dg + db * db * 0.7; };
    const bg = new Uint8Array(N), q = new Int32Array(N);
    let qt = 0;
    const flood = (seeds, limit) => {
      let qh = qt; const start = qt;
      seeds.forEach((i) => { if (!bg[i] && dist2(i) <= limit) { bg[i] = 1; q[qt++] = i; } });
      while (qh < qt) {
        const i = q[qh++], xx = i % w;
        if (xx > 0 && !bg[i - 1] && dist2(i - 1) <= limit) { bg[i - 1] = 1; q[qt++] = i - 1; }
        if (xx < w - 1 && !bg[i + 1] && dist2(i + 1) <= limit) { bg[i + 1] = 1; q[qt++] = i + 1; }
        if (i >= w && !bg[i - w] && dist2(i - w) <= limit) { bg[i - w] = 1; q[qt++] = i - w; }
        if (i < N - w && !bg[i + w] && dist2(i + w) <= limit) { bg[i + w] = 1; q[qt++] = i + w; }
      }
      return qt - start;
    };
    // only background connected to the edges is removed, so white labels or highlights inside the product stay intact
    flood(border, tol2);
    const removed = qt / N;
    if (removed < 0.05 || removed > 0.97) return { canvas: null, state: removed > 0.97 ? "empty" : "busy" };
    // soft alpha: 2 box-blur passes over the mask
    let A = new Float32Array(N), B = new Float32Array(N);
    for (let i = 0; i < N; i++) A[i] = bg[i] ? 0 : 1;
    const blur = (src, dst) => {
      for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
        let sum = 0, cnt = 0;
        for (let dy = -1; dy <= 1; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue; for (let dx = -1; dx <= 1; dx++) { const x2 = xx + dx; if (x2 < 0 || x2 >= w) continue; sum += src[yy * w + x2]; cnt++; } }
        dst[y * w + xx] = sum / cnt;
      }
    };
    blur(A, B); blur(B, A);
    for (let i = 0; i < N; i++) {
      const a = bg[i] ? 0 : A[i];       // feather only on the product side of the edge
      const o = i * 4;
      if (a > 0.02 && a < 0.98) {      // pull the old background colour out of edge pixels (no white halo)
        p[o] = clamp((p[o] - r * (1 - a)) / a, 0, 255); p[o + 1] = clamp((p[o + 1] - g * (1 - a)) / a, 0, 255); p[o + 2] = clamp((p[o + 2] - b * (1 - a)) / a, 0, 255);
      }
      p[o + 3] = Math.round(p[o + 3] * a);
    }
    x.putImageData(id, 0, 0);
    return { canvas: trim(c, x, w, h), state: "ok", removed };
  }
  function trim(c, x, w, h) {
    const d = x.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) if (d[(y * w + xx) * 4 + 3] > 16) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return c;
    const pad = Math.round(Math.max(w, h) * 0.015);
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
    o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    return o;
  }
  function runCutouts(force) {
    const strength = +$("#cut-strength").value;
    const todo = photos.map((p, i) => [p, i]).filter(([p]) => p && (force || p.cutKey !== String(strength)));
    if (!todo.length) { render(); paintCutStatus(); paintSlots(); return; }
    $("#cut-status").textContent = "Removing background…"; $("#cut-status").className = "cut-status busy";
    setTimeout(() => {
      const t0 = performance.now();
      todo.forEach(([p]) => { const r = cutout(p.img, strength); p.cutout = r.canvas; p.cutState = r.state; p.cutKey = String(strength); });
      paintCutStatus(); paintSlots(); render();
      ev("studio_bg_done", { photos: todo.length, ok: todo.filter(([p]) => p.cutout).length, ms: Math.round(performance.now() - t0) });
    }, 30);
  }
  function paintCutStatus() {
    const el = $("#cut-status"), list = photos.filter(Boolean);
    el.className = "cut-status";
    if (!st.cutout) { el.textContent = ""; return; }
    if (!list.length) { el.textContent = "On. Upload a product photo on a plain background to see it."; return; }
    const bad = list.filter((p) => !p.cutout);
    if (!bad.length) { el.textContent = `Background removed${list.length > 1 ? ` from ${list.length} photos` : ""}. Not perfect? Move the strength slider.`; el.classList.add("ok"); return; }
    el.classList.add("warn");
    el.textContent = bad.length === list.length ? "Couldn't find a plain background. This works best with a product shot on a white or single-colour background." : `Removed from ${list.length - bad.length} of ${list.length} photos; the others have busy backgrounds and stay as they are.`;
  }

  /* ---------- brand kit: logo (kept on this device only) ---------- */
  function setLogo(src, persist) {
    const img = new Image();
    img.onload = () => {
      logo = img;
      $("#logo-thumb").innerHTML = ""; $("#logo-thumb").appendChild(img.cloneNode());
      $("#logo-label").textContent = "Change logo"; $("#logo-remove").hidden = false; $("#logo-style-field").hidden = false;
      if (persist) {
        // store a small copy so the logo is there next time (on this device only)
        const s = Math.min(1, 480 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        if (!store.set(KIT_KEY, c.toDataURL("image/png"))) toast("Logo added. (Your browser blocked saving it for next time.)");
      }
      render(); paintMockHeads();
    };
    img.src = src;
  }
  $("#logo-input").addEventListener("change", (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f || !/^image\//.test(f.type)) return;
    setLogo(URL.createObjectURL(f), true);
    ev("studio_logo", { action: "add" }); touch();
  });
  $("#logo-remove").addEventListener("click", () => {
    logo = null; store.del(KIT_KEY);
    $("#logo-thumb").innerHTML = ""; $("#logo-label").textContent = "Add your logo"; $("#logo-remove").hidden = true; $("#logo-style-field").hidden = true;
    render(); paintMockHeads(); ev("studio_logo", { action: "remove" });
  });

  /* ============================== preview interactions ============================== */
  // drag the main photo inside any preview to reframe it; Ctrl/⌘ + wheel zooms
  Object.values(pv).forEach(({ canvas: cv }) => {
    let drag = null;
    cv.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.classList.add("dragging"); });
    cv.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const r = cv.getBoundingClientRect();
      st.fx = clamp(st.fx - (e.clientX - drag.x) / (r.width * st.zoom), 0, 1);
      st.fy = clamp(st.fy - (e.clientY - drag.y) / (r.height * st.zoom), 0, 1);
      drag = { x: e.clientX, y: e.clientY }; render();
    });
    const end = () => { if (drag) { drag = null; cv.classList.remove("dragging"); save(); commit(true); touch("reframe"); } };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    cv.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      st.zoom = clamp(st.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06), 1, 3);
      paintControls(); render(); save(); commit();
    }, { passive: false });
  });

  // style strip, filter, shuffle, test pack
  $("#style-strip").addEventListener("click", (e) => {
    const b = e.target.closest(".style-card"); if (!b) return;
    const id = b.dataset.tpl;
    if (packMode) { if (pack.has(id)) pack.delete(id); else pack.add(id); paintPack(); paintStrip(); if (!pack.has(id)) return; }
    setTemplate(id, packMode ? "pack" : "click");
  });
  $("#style-strip").addEventListener("scroll", () => scheduleThumbs(), { passive: true });
  $("#group-filter").addEventListener("click", (e) => {
    const b = e.target.closest("[data-group]"); if (!b) return;
    groupFilter = b.dataset.group; paintStrip(); scheduleThumbs();
    $("#style-strip").scrollTo({ left: 0 });
    ev("studio_filter", { group: groupFilter });
  });
  $("#shuffle").addEventListener("click", () => {
    const pool = G.order.filter((id) => id !== st.template && (groupFilter === "all" || G.layouts[id].group === groupFilter));
    const id = pool[Math.floor(Math.random() * pool.length)] || st.template;
    const [, c, a] = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    if (!photos.some(Boolean) || Math.random() < 0.5) { st.color = c; st.accent = a || ""; }
    st.template = id;
    paintControls(); changed(null, { now: true }); scrollToActive();
    ev("studio_shuffle");
  });
  $("#pack-toggle").addEventListener("click", (e) => {
    packMode = !packMode;
    e.currentTarget.setAttribute("aria-pressed", String(packMode));
    $("#pack-panel").hidden = !packMode;
    $("#style-strip").classList.toggle("pack", packMode);
    if (packMode && !pack.size) pack.add(st.template);
    paintPack(); paintStrip();
    if (packMode) ev("studio_pack_mode");
  });
  $("#pack-sizes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pack-size]"); if (!b) return;
    const s = b.dataset.packSize;
    if (packSizes.has(s)) { if (packSizes.size > 1) packSizes.delete(s); } else packSizes.add(s);
    paintPack();
  });
  function paintPack() {
    $$("[data-pack-size]").forEach((b) => b.setAttribute("aria-pressed", String(packSizes.has(b.dataset.packSize))));
    $("#pack-count").textContent = pack.size;
    const n = pack.size * packSizes.size;
    $("#pack-desc").textContent = `style${pack.size === 1 ? "" : "s"} selected · ${n} image${n === 1 ? "" : "s"}`;
    $("#pack-dl").disabled = !pack.size;
  }

  // view mode + safe zones
  $("#view-seg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]"); if (!b) return;
    const mock = b.dataset.view === "mock";
    $$("#view-seg [data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("#mockups").hidden = !mock; $("#previews").hidden = mock;
    if (mock) paintMockups();
    ev("studio_view", { view: b.dataset.view });
  });
  $("#safe-toggle").addEventListener("change", (e) => $("#previews").classList.toggle("no-safe", !e.target.checked));
  $("#style-info").addEventListener("click", (e) => {
    if (e.target.closest('[data-act="cut-on"]')) { st.cutout = true; paintControls(); runCutouts(); save(); commit(true); ev("studio_bg_remove", { on: true, via: "hint" }); }
  });

  // keyboard: ←/→ styles, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y
  document.addEventListener("keydown", (e) => {
    const typing = e.target.closest && e.target.closest("input, textarea, select, [contenteditable]");
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !typing && e.key.toLowerCase() === "z") { e.preventDefault(); travel(e.shiftKey ? 1 : -1); return; }
    if (mod && !typing && e.key.toLowerCase() === "y") { e.preventDefault(); travel(1); return; }
    if (typing || mod || e.altKey) return;
    if (e.target.closest && e.target.closest("dialog")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      if (!document.querySelector("#studio").contains(e.target) && e.target !== document.body) return;
      const vis = G.order.filter((id) => !thumbs[id] || !thumbs[id].btn.hidden);
      const i = vis.indexOf(st.template);
      const next = vis[(i + (e.key === "ArrowRight" ? 1 : -1) + vis.length) % vis.length];
      if (next) { e.preventDefault(); setTemplate(next, "keyboard"); }
    }
  });

  /* ============================== ad check (score out of 100) ============================== */
  function paintCheck() {
    const t = G.texts(st), items = [];
    const add = (ok, pts, good, bad, warn) => items.push({ ok, pts, good, bad, warn });
    const main = photos[0];
    const cover = Math.max((lastStats.square || {}).textPct || 0, (lastStats.portrait || {}).textPct || 0);
    add(!!main, 20, "Your own product photo", "Using a sample product. Add your own photo.");
    add(!!main && main.w >= 1000, 10, `Sharp photo (${main ? main.w : 0}px wide)`, main ? `Photo is only ${main.w}px wide; it may look blurry` : "Add your photo to check its sharpness", !main || main.w >= 700);
    add(cover <= 0.35, 15, `Text covers ${Math.round(cover * 100)}% of the ad`, `Text covers ${Math.round(cover * 100)}% of the ad. Text-heavy images often get less reach.`, cover <= 0.45);
    const words = t.headline.replace(/\*/g, "").split(/\s+/).filter(Boolean).length;
    add(words && words <= 7 && t.headline.length <= 44, 15, "Short, punchy headline", words ? `Headline has ${words} words. Under 7 gets read.` : "Add a headline", words <= 9);
    add(!!t.price, 10, "Price shown (fewer \"price?\" comments)", "Show the price. Ads without one get a flood of \"price?\" comments.");
    const trust = st.badges.cod || st.badges.free || st.badges.sameday || st.badges.returns || st.badges.original;
    add(!!trust, 10, "Trust badge (COD, delivery or returns)", "Add a trust badge: COD and delivery answer buyers' first questions.");
    const urgent = !!(t.old || t.endsText || st.badges.stock || ["today", "limited"].includes(st.sticker));
    add(urgent, 10, "A reason to buy now", "Add urgency: an old price, an end date or a limited-stock badge.");
    add(!!t.cta && t.cta.length <= 24, 10, "Clear call to action", "Add button text like \"Order now\".");
    const score = items.reduce((a, i) => a + (i.ok ? i.pts : i.warn ? Math.round(i.pts / 2) : 0), 0);
    const ring = $("#score");
    ring.style.setProperty("--s", score);
    ring.className = `score ${score >= 85 ? "good" : score >= 65 ? "mid" : "bad"}`;
    $("#score-num").textContent = score;
    $("#score-label").textContent = score >= 85 ? "Ready to run" : score >= 65 ? "Good, a few quick wins left" : "A few fixes will help a lot";
    $("#check-list").innerHTML = items.map((i) => `<li class="${i.ok ? "ok" : i.warn ? "mid" : "no"}"><svg viewBox="0 0 24 24" aria-hidden="true">${i.ok ? '<path d="m5 12 4.5 4.5L19 7"/>' : '<path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/>'}</svg><span>${i.ok ? i.good : i.bad}</span></li>`).join("") +
      (st.lang === "en" ? '<li class="tip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/></svg><span>Try a Bangla version too, and test both.</span></li>' : "");
  }

  /* ============================== mock-ups ============================== */
  function avatarHTML() {
    if (logo) return `<img src="${logo.src}" alt="" />`;
    const ch = (String(st.brand || "?").trim()[0] || "?").toUpperCase();
    return `<span style="background:${st.color};color:${G.onColor(st.color)}">${ch.replace(/[<>&"]/g, "")}</span>`;
  }
  function paintMockHeads() {
    ["#mf-av", "#ms-av"].forEach((s) => ($(s).innerHTML = avatarHTML()));
    $("#mf-name").textContent = $("#ms-name").textContent = st.brand || "Your Brand";
  }
  function paintMockups() {
    const t = G.texts(st);
    paintMockHeads();
    const head = t.headline.replace(/\*/g, "");
    $("#mf-text").textContent = [t.sub || head, t.badges.slice(0, 2).join(" · ")].filter(Boolean).join(" · ");
    $("#mf-headline").textContent = head;
    $("#mf-btn").textContent = $("#ms-btn").textContent = t.cta || "Order now";
    const a = assets(), dpr = Math.min(2, window.devicePixelRatio || 1);
    [["#mf-canvas", "portrait"], ["#ms-canvas", "story"]].forEach(([sel, size]) => {
      const c = $(sel), w = c.clientWidth || 360;
      G.render(c, size, st, a, { scale: clamp((w * dpr) / G.SIZES[size].w, 0.2, 1) });
    });
  }

  /* mobile: a mini live preview that jumps to the previews */
  const mini = $("#mini-pv");
  let previewsVisible = true;
  new IntersectionObserver((es) => es.forEach((e) => { previewsVisible = e.isIntersecting; paintMini(); }), { threshold: 0.05 }).observe($("#previews"));
  function paintMini() {
    const show = window.innerWidth <= 1180 && !previewsVisible && used;
    mini.hidden = !show;
    if (!show) return;
    const c = $("canvas", mini), src = pv.portrait.canvas;
    c.width = 120; c.height = 150; c.getContext("2d").drawImage(src, 0, 0, 120, 150);
  }
  mini.addEventListener("click", () => { $("#studio-previews").scrollIntoView({ behavior: "smooth", block: "start" }); ev("studio_mini_preview"); });

  /* ============================== export ============================== */
  async function renderBlob(size, template, fmt) {
    const S = G.SIZES[size], c = document.createElement("canvas");
    G.render(c, size, { ...st, template }, assets(), { scale: 1 });
    if (fmt === "jpg") {
      const j = document.createElement("canvas"); j.width = S.w; j.height = S.h;
      const x = j.getContext("2d"); x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, S.w, S.h); x.drawImage(c, 0, 0);
      return toBlob(j, "image/jpeg", 0.92);
    }
    return toBlob(c, "image/png");
  }
  const fileName = (size, template, fmt) => `${slug()}-${template}-${FILE_TAG[size]}${st.lang === "bn" ? "-bn" : ""}.${fmt}`;
  let nudged = false;
  function afterDownload() {
    if (nudged || store.get("gr-lead-done")) return;
    nudged = true;
    setTimeout(() => toast('Saved. Want these tested with a real budget? <button type="button" class="link-btn" data-act="lead">Get a free ad audit →</button>', 7000), 600);
  }
  $("#toast").addEventListener("click", (e) => { if (e.target.closest('[data-act="lead"]')) { T.openLead("tool:ad-studio", {}); ev("studio_nudge_click"); } });

  $$("[data-dl]").forEach((b) => b.addEventListener("click", async () => {
    const size = b.dataset.dl, fmt = $("#fmt").value;
    b.disabled = true;
    const blob = await renderBlob(size, st.template, fmt);
    if (blob) saveBlob(blob, fileName(size, st.template, fmt));
    b.disabled = false;
    T.track("studio_download", { tool: "ad-studio", size, template: st.template, lang: st.lang, format: fmt, count: 1 }, { section: "studio" });
    touch(); afterDownload();
  }));
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const size = b.dataset.copy;
    if (!(navigator.clipboard && window.ClipboardItem)) { toast("Your browser can't copy images. Use Download instead."); return; }
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": renderBlob(size, st.template, "png") })]);
      toast(`Copied the ${SIZE_LABEL[size].toLowerCase()} ad. Paste it into Messenger, WhatsApp or Ads Manager.`);
      ev("studio_copy", { size });
    } catch { toast("Couldn't copy here. Use Download instead."); }
  }));
  async function downloadZip(templates, sizes, label, btn) {
    const fmt = $("#fmt").value, files = [], total = templates.length * sizes.length;
    const bar = $("#pack-progress"), useBar = btn && btn.id === "pack-dl";
    btn.disabled = true; const lab = $("span", btn), was = lab.textContent;
    if (useBar) { bar.hidden = false; bar.style.setProperty("--p", "0%"); }
    let n = 0;
    for (const tpl of templates) for (const size of sizes) {
      const blob = await renderBlob(size, tpl, fmt);
      if (blob) files.push({ name: fileName(size, tpl, fmt), data: new Uint8Array(await blob.arrayBuffer()) });
      n++; lab.textContent = `Making ${n} of ${total}…`;
      if (useBar) bar.style.setProperty("--p", `${(n / total) * 100}%`);
      await new Promise((r) => setTimeout(r, 0));
    }
    saveBlob(zip(files), `${slug()}-${label}.zip`);
    lab.textContent = was; btn.disabled = false;
    if (useBar) setTimeout(() => (bar.hidden = true), 800);
    return files.length;
  }
  $("#dl-all").addEventListener("click", async (e) => {
    const n = await downloadZip([st.template], SIZES, `${st.template}-all-sizes`, e.currentTarget);
    T.track("studio_download", { tool: "ad-studio", size: "all", template: st.template, lang: st.lang, format: $("#fmt").value, count: n }, { section: "studio" });
    touch(); afterDownload();
  });
  $("#pack-dl").addEventListener("click", async (e) => {
    const tpls = G.order.filter((id) => pack.has(id)), sizes = SIZES.filter((s) => packSizes.has(s));
    if (!tpls.length) return;
    const n = await downloadZip(tpls, sizes, "test-pack", e.currentTarget);
    T.track("studio_pack", { tool: "ad-studio", styles: tpls.join(","), sizes: sizes.join(","), lang: st.lang, format: $("#fmt").value, count: n }, { section: "studio" });
    touch(); afterDownload();
    toast(`Downloaded ${n} ads. Put them in one ad set and let Meta find the winner.`, 5000);
  });

  /* tiny ZIP writer (stored, no compression: PNG/JPG are already compressed) */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = [];
    const now = new Date(), time = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF, date = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    let offset = 0;
    files.forEach((f) => {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, size, 4], [22, size, 4], [26, name.length, 2], [28, 0, 2]].forEach(([o, v, n]) => (n === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true)));
      parts.push(new Uint8Array(lh.buffer), name, f.data);
      const ch = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, size, 4], [24, size, 4], [28, name.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, offset, 4]].forEach(([o, v, n]) => (n === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true)));
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + size;
    });
    const cdSize = central.reduce((a, c) => a + c.length, 0), end = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2], [10, files.length, 2], [12, cdSize, 4], [16, offset, 4], [20, 0, 2]].forEach(([o, v, n]) => (n === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true)));
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
  }

  /* ============================== lead (creative brief, never the photos) ============================== */
  T.setLeadExtra(() => ({ creative: { tool: "ad-studio", template: st.template, headline: st.headline, price: st.price, old: st.old, lang: st.lang, badges: G.texts(st).badges, color: st.color, font: st.font, photoCount: photos.filter(Boolean).length, hasLogo: !!logo, packStyles: packMode ? [...pack] : [],
    state: clone(st) } }));   // full ad settings (words, colours, style; never photos) so the admin's audit can re-render this ad
  $("#studio-cta").addEventListener("click", () => T.openLead("tool:ad-studio", {}));

  /* ============================== start ============================== */
  buildControls();
  $("#o-cut").textContent = pct(+$("#cut-strength").value); setRangeFill($("#cut-strength"));
  paintSlots();
  const savedLogo = store.get(KIT_KEY);
  if (savedLogo && /^data:image\//.test(savedLogo)) setLogo(savedLogo, false);
  Promise.all([G.load("/tools/ad-studio/layouts/"), G.ensureFonts(st.font)]).then(() => {
    if (!G.layouts[st.template]) st.template = G.order[0];
    buildStrip(); paintControls(); paintPack(); paintHistory(); paintCutStatus();
    render(); scrollToActive();
    if (fromLink) { toast("Settings loaded from the shared link. Add your photos to finish the ad."); ev("studio_link_open"); }
    // the extra faces some styles use (serif, handwritten), then re-render once they arrive
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 600));
    idle(() => G.ensureAllFonts().then(() => { Object.values(thumbs).forEach((t) => (t.v = -1)); render(); }));
  });
  if (document.fonts) document.fonts.addEventListener("loadingdone", () => { Object.values(thumbs).forEach((t) => (t.v = -1)); render(); });
  let rz = 0;
  addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { Object.values(thumbs).forEach((t) => (t.v = -1)); render(); }, 200); });
})();
