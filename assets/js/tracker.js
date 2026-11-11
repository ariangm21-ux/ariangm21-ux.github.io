/* Greyrock first-party tracker + Meta Pixel bridge.
   - every press (link, button, chip, tab, toggle, FAQ…) becomes an event
   - visitor ID (180 days), session ID (30 min idle), first + last touch attribution (90 days)
   - Meta: Pixel events carry an eventID that the server reuses for the Conversions API (deduplication),
     plus hashed identity (advanced matching) once the visitor has identified themselves
   Events go to the local server (/api/track) in small batches. No form values are ever captured. */
(function () {
  "use strict";

  var CFG = window.GR_CFG || { settings: {} };
  var T = (CFG.settings && CFG.settings.tracking) || {};
  var qs = new URLSearchParams(location.search);
  var UA = navigator.userAgent || "";
  var OFF = qs.has("preview") || qs.has("notrack") || navigator.webdriver ||
    /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit/i.test(UA);

  /* ---------- small utils ---------- */
  var now = function () { return Date.now(); };
  var iso = function () { return new Date().toISOString(); };
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); });
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* blocked */ } }
  function lsJSON(k) { try { return JSON.parse(lsGet(k) || "null"); } catch (e) { return null; } }
  function cookie(k) { var m = document.cookie.match(new RegExp("(?:^|; )" + k + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function setCookie(k, v, days) { try { document.cookie = k + "=" + encodeURIComponent(v) + "; max-age=" + Math.round(days * 86400) + "; path=/; SameSite=Lax"; } catch (e) { /* blocked */ } }
  function clean(s, n) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n || 80); }
  function sha(s) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.reject(new Error("no subtle crypto"));
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
    });
  }

  // admin previews, bots and ?notrack: no IDs, no cookies, no events
  if (OFF) {
    window.GRT = { track: function () { return null; }, identify: function () { return Promise.resolve(); }, ids: function () { return {}; }, newId: uuid, flush: function () {}, off: true };
    return;
  }

  /* ---------- identity: visitor + session ---------- */
  var vid = lsGet("gr_vid") || cookie("gr_vid") || uuid();
  lsSet("gr_vid", vid); setCookie("gr_vid", vid, 180);
  var sess = lsJSON("gr_sess");
  var newSession = !sess || sess.vid !== vid || now() - sess.last > 30 * 60 * 1000;
  var visits = +(lsGet("gr_visits") || 0);
  if (newSession) { sess = { id: uuid(), vid: vid, start: now(), landing: location.pathname + location.search }; visits += 1; lsSet("gr_visits", String(visits)); }
  sess.last = now();
  lsSet("gr_sess", JSON.stringify(sess));
  var internal = lsGet("gr_internal") === "1"; // set by the admin panel on your own browser

  /* ---------- attribution (first + last touch, 90 days) ---------- */
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "placement", "site_source_name", "fbclid", "gclid", "ttclid"];
  var touch = {};
  KEYS.forEach(function (k) { var v = qs.get(k); if (v) touch[k] = clean(v, 200); });
  var refHost = "";
  try { if (document.referrer) { var rh = new URL(document.referrer).hostname; if (rh && rh !== location.hostname) refHost = rh; } } catch (e) { /* bad referrer */ }
  if (refHost) touch.referrer = refHost;
  var TTL = 90 * 86400 * 1000;
  var first = lsJSON("gr_first"), last = lsJSON("gr_last");
  if (first && now() - Date.parse(first.at) > TTL) first = null;
  if (last && now() - Date.parse(last.at) > TTL) last = null;
  if (Object.keys(touch).length) {
    touch.at = iso(); touch.landing = location.pathname;
    if (!first) { first = touch; lsSet("gr_first", JSON.stringify(first)); }
    last = touch; lsSet("gr_last", JSON.stringify(last));
  }
  function channel(t) {
    if (!t) return "direct";
    var src = (t.utm_source || "").toLowerCase(), med = (t.utm_medium || "").toLowerCase(), ref = t.referrer || "";
    var paid = /paid|cpc|ppc|ads?$|cpm|social_paid/.test(med) || !!t.ad_id;
    if (/facebook|instagram|^fb$|^ig$|meta|messenger/.test(src) || t.fbclid || /facebook|instagram|fb\.|messenger/.test(ref)) return paid ? "Meta ads" : "Meta organic";
    if (t.gclid || (/google/.test(src) && paid)) return "Google ads";
    if (t.ttclid || /tiktok/.test(src)) return paid || t.ttclid ? "TikTok ads" : "TikTok organic";
    if (src) return src + (med ? " / " + med : "");
    if (/google|bing|yahoo|duckduckgo|yandex/.test(ref)) return "Organic search";
    if (ref) return "Referral: " + ref;
    return "direct";
  }

  /* ---------- Meta browser cookies (_fbc from ad clicks, _fbp browser id) ---------- */
  if (touch.fbclid) {
    var oldFbc = cookie("_fbc");
    if (!oldFbc || oldFbc.split(".").pop() !== touch.fbclid) setCookie("_fbc", "fb.1." + now() + "." + touch.fbclid, 90);
  }
  if (!cookie("_fbp")) setCookie("_fbp", "fb.1." + now() + "." + Math.floor(1e9 + Math.random() * 9e9), 90);

  /* ---------- device ---------- */
  var inApp = /FBAN|FBAV|FB_IAB|FBIOS/i.test(UA) ? "Facebook app" : /Instagram/i.test(UA) ? "Instagram app" : /Messenger/i.test(UA) ? "Messenger app" : "";
  var device = {
    device: /iPad|Tablet|PlayBook/i.test(UA) || (/Android/i.test(UA) && !/Mobile/i.test(UA)) ? "tablet" : /Mobi|iPhone|Android/i.test(UA) ? "mobile" : "desktop",
    os: /Android/i.test(UA) ? "Android" : /iPhone|iPad|iPod/i.test(UA) ? "iOS" : /Windows/i.test(UA) ? "Windows" : /Mac OS X/i.test(UA) ? "macOS" : /Linux/i.test(UA) ? "Linux" : "Other",
    browser: inApp || (/SamsungBrowser/i.test(UA) ? "Samsung Internet" : /Edg\//.test(UA) ? "Edge" : /OPR\/|Opera/.test(UA) ? "Opera" : /Chrome\//.test(UA) ? "Chrome" : /Firefox\//.test(UA) ? "Firefox" : /Safari\//.test(UA) ? "Safari" : "Other"),
  };

  /* ---------- hashed identity for advanced matching ---------- */
  var idn = lsJSON("gr_idn");

  /* ---------- Meta Pixel ---------- */
  var PIXEL = !OFF && /^\d{6,20}$/.test(T.metaPixelId || "") ? T.metaPixelId : null;
  var pixelReady = Promise.resolve();
  if (PIXEL) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("set", "autoConfig", false, PIXEL); // we send our own clean events; no automatic button guessing
    pixelReady = sha(vid).then(function (h) { return h; }, function () { return null; }).then(function (hv) {
      var am = {};
      if (idn) Object.keys(idn).forEach(function (k) { am[k] = idn[k]; });
      if (hv) am.external_id = hv;
      window.fbq("init", PIXEL, am);
    });
  }
  function firePixel(m, eventId, params) {
    if (!PIXEL || !m) return;
    pixelReady.then(function () { window.fbq(m[0], m[1], params || {}, { eventID: eventId }); });
  }
  var GA4 = !OFF && /^G-[A-Z0-9]{4,}$/i.test(T.ga4Id || "") ? T.ga4Id : null;
  if (GA4) {
    var gs = document.createElement("script"); gs.async = true; gs.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4;
    document.head.appendChild(gs);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date()); window.gtag("config", GA4);
  }

  // which first-party events also go to Meta: [pixel method, Meta event name]
  var META = {
    page_view: ["track", "PageView"],
    view_results: ["track", "ViewContent"],
    view_pricing: ["track", "ViewContent"],
    whatsapp_click: ["track", "Contact"],
    phone_click: ["track", "Contact"],
    email_click: ["track", "Contact"],
    lead_form_open: ["trackCustom", "LeadFormOpened"],
    simulator_used: ["trackCustom", "SimulatorUsed"],
    grader_complete: ["trackCustom", "GraderCompleted"],
    newsletter_signup: ["trackCustom", "NewsletterSignup"],
    calculator_used: ["trackCustom", "ProfitCalculatorUsed"],
    planner_used: ["trackCustom", "SeasonPlannerUsed"],
    studio_used: ["trackCustom", "AdStudioUsed"],
    lead: ["track", "Lead"],
  };

  /* ---------- queue + transport ---------- */
  var queue = [], seq = 0, timer = 0;
  function ctx() {
    return {
      vid: vid, sid: sess.id, origin: location.origin, landing: sess.landing, visit: visits, newSession: newSession,
      device: device.device, os: device.os, browser: device.browser,
      screen: (screen.width || 0) + "x" + (screen.height || 0), lang: navigator.language || "", tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || "",
      first: first || undefined, last: last || undefined, channel: channel(last || first),
      fbp: cookie("_fbp") || undefined, fbc: cookie("_fbc") || undefined,
      idn: idn || undefined, internal: internal || undefined,
    };
  }
  function flush(final) {
    clearTimeout(timer); timer = 0;
    if (!queue.length) return;
    if (window.GR_STATIC) { queue.length = 0; return; } // static hosting: no /api/track server (Pixel still fires)
    var body = JSON.stringify({ ctx: ctx(), events: queue.splice(0, 60) });
    var sent = false;
    try { sent = navigator.sendBeacon && navigator.sendBeacon("/api/track", new Blob([body], { type: "text/plain" })); } catch (e) { sent = false; }
    if (!sent) { try { fetch("/api/track", { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "text/plain" } }); } catch (e) { /* offline */ } }
    if (queue.length && !final) flush();
  }
  function track(name, props, opts) {
    if (OFF) return null;
    opts = opts || {};
    var id = opts.eventId || uuid();
    var e = { id: id, name: name, ts: iso(), seq: ++seq, path: location.pathname, section: opts.section || undefined, props: props || {} };
    var m = opts.meta === false ? null : (opts.meta || META[name]);
    if (m) {
      var params = opts.metaParams || {};
      e.meta = m[1];
      if (opts.capi !== false && T.capiEnabled) { e.capi = 1; e.metaData = params; }
      firePixel(m, id, params);
    }
    if (GA4 && window.gtag) window.gtag("event", name, props || {});
    (window.dataLayer = window.dataLayer || []).push({ event: "gr_" + name, gr: props || {} });
    queue.push(e);
    sess.last = now(); lsSet("gr_sess", JSON.stringify(sess));
    if (!timer) timer = setTimeout(flush, 2000);
    if (queue.length >= 40) flush();
    return id;
  }

  /* hashed identity → stronger matching on this and every later event from this browser */
  function identify(d) {
    d = d || {};
    var jobs = [], h = {};
    if (d.phone) {
      var p = String(d.phone).replace(/\D/g, "");
      if (/^01\d{9}$/.test(p)) p = "88" + p;
      if (/^1\d{9}$/.test(p)) p = "880" + p;
      jobs.push(sha(p).then(function (x) { h.ph = x; }));
      if (/^880/.test(p)) jobs.push(sha("bd").then(function (x) { h.country = x; }));
    }
    if (d.name) {
      var parts = String(d.name).trim().toLowerCase().replace(/[^\p{L}\s'-]/gu, "").split(/\s+/).filter(Boolean);
      if (parts[0]) jobs.push(sha(parts[0]).then(function (x) { h.fn = x; }));
      if (parts.length > 1) jobs.push(sha(parts[parts.length - 1]).then(function (x) { h.ln = x; }));
    }
    if (d.email) jobs.push(sha(String(d.email).trim().toLowerCase()).then(function (x) { h.em = x; }));
    return Promise.all(jobs).then(function () {
      idn = Object.assign({}, idn || {}, h);
      lsSet("gr_idn", JSON.stringify(idn));
      if (PIXEL) return pixelReady.then(function () { return sha(vid); }).then(function (hv) {
        var am = Object.assign({}, idn); am.external_id = hv; window.fbq("init", PIXEL, am);
      });
    }).catch(function () { /* hashing unavailable: the server still matches the lead */ });
  }

  function ids() {
    return { vid: vid, sid: sess.id, fbp: cookie("_fbp") || "", fbc: cookie("_fbc") || "", first: first, last: last, channel: channel(last || first), device: device, visit: visits, internal: internal };
  }

  window.GRT = { track: track, identify: identify, ids: ids, newId: uuid, flush: flush, off: OFF };
  if (OFF) return;

  /* =========================================================
     Automatic capture
     ========================================================= */
  function sectionOf(el) {
    var s = el.closest("#simulator, #capture-form, .theme-switch, dialog[id], aside[id], section[id], header, footer, nav");
    if (s && s.classList.contains("theme-switch")) return "theme-switcher";
    if (!s) return "page";
    if (s.id) return s.id;
    return s.tagName.toLowerCase();
  }
  function labelOf(el) {
    var lab = el.getAttribute("data-track") || el.getAttribute("aria-label");
    if (!lab && el.tagName === "INPUT") { var l = el.closest("label"); lab = l ? l.innerText : (el.name || el.id); }
    if (!lab) lab = el.innerText || el.value || el.title || el.id || el.className;
    return clean(lab, 80);
  }

  // page view
  track("page_view", { title: clean(document.title, 120), newSession: newSession, visit: visits, channel: channel(last || first), referrer: refHost || undefined });

  // every press
  var lastClick = { el: null, t: 0, n: 0 };
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest && ev.target.closest('a, button, [role="button"], [role="tab"], [role="radio"], summary, input[type="checkbox"], input[type="radio"], [data-track]');
    if (!el) return;
    var label = labelOf(el), section = sectionOf(el);
    var props = { label: label, el: el.tagName.toLowerCase() };
    if (el.id) props.id = el.id;
    if (el.dataset && el.dataset.source) props.source = el.dataset.source;
    var href = el.getAttribute && el.getAttribute("href");
    if (href) {
      var u = null; try { u = new URL(href, location.href); } catch (e) { /* ignore */ }
      if (u) {
        if (/(^|\.)wa\.me$|whatsapp\.com$/i.test(u.hostname)) track("whatsapp_click", { label: label }, { section: section, metaParams: { content_name: "WhatsApp", content_category: section } });
        else if (u.protocol === "tel:") track("phone_click", { label: label }, { section: section, metaParams: { content_name: "Phone" } });
        else if (u.protocol === "mailto:") track("email_click", { label: label }, { section: section, metaParams: { content_name: "Email" } });
        else if (u.hostname && u.hostname !== location.hostname) props.outbound = u.hostname;
        else if (href.charAt(0) === "#") props.anchor = href;
      }
    }
    // rage clicks: 3+ presses on the same thing within a second
    var t = now();
    if (lastClick.el === el && t - lastClick.t < 1000) { lastClick.n++; if (lastClick.n === 3) track("rage_click", { label: label }, { section: section }); }
    else lastClick = { el: el, t: t, n: 1 };
    lastClick.t = t;
    track("click", props, { section: section });
  }, true);

  // selects, sliders (values only for non-personal controls)
  document.addEventListener("change", function (ev) {
    var el = ev.target;
    if (!el || !el.tagName) return;
    if (el.tagName === "SELECT") track("select_change", { field: el.id || el.name, value: clean(el.value, 60) }, { section: sectionOf(el) });
    else if (el.type === "range") track("slider_change", { field: el.id || el.name, value: el.value }, { section: sectionOf(el) });
  }, true);

  // forms: start, each field completed (never the value), submit attempts
  var formState = {};
  function formKey(el) { var f = el.form || el.closest("form"); return f ? (f.id || f.className || "form") : null; }
  document.addEventListener("focusin", function (ev) {
    var el = ev.target;
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.type === "range" || el.type === "radio" || el.type === "checkbox") return;
    var f = formKey(el); if (!f) return;
    var st = formState[f] = formState[f] || { started: false, done: {} };
    if (!st.started) { st.started = true; track("form_start", { form: f, field: el.id || el.name }, { section: sectionOf(el) }); }
  }, true);
  document.addEventListener("focusout", function (ev) {
    var el = ev.target;
    if (!/^(INPUT|TEXTAREA)$/.test(el.tagName) || el.type === "range" || el.type === "radio" || el.type === "checkbox" || el.type === "hidden") return;
    var f = formKey(el); if (!f) return;
    var st = formState[f] = formState[f] || { started: true, done: {} };
    var key = el.id || el.name;
    if (el.value && el.value.trim() && !st.done[key]) { st.done[key] = 1; track("field_complete", { form: f, field: key }, { section: sectionOf(el) }); }
  }, true);
  document.addEventListener("submit", function (ev) {
    var f = ev.target; track("form_submit_attempt", { form: f.id || "form" }, { section: sectionOf(f) });
  }, true);
  window.GRT.formState = function (f) { return formState[f] || { started: false, done: {} }; };

  // scroll depth + sections seen + engaged time
  var depthMarks = [25, 50, 75, 90, 100], maxDepth = 0;
  addEventListener("scroll", function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    var pct = h > 0 ? Math.round((scrollY / h) * 100) : 100;
    if (pct > maxDepth) maxDepth = pct;
    while (depthMarks.length && pct >= depthMarks[0]) track("scroll_depth", { pct: depthMarks.shift() });
  }, { passive: true });

  var engagedMs = 0, visibleSince = document.hidden ? 0 : now(), engagedSent = false;
  function tickEngaged() {
    if (visibleSince) { engagedMs += now() - visibleSince; visibleSince = document.hidden ? 0 : now(); }
    if (!engagedSent && engagedMs >= 30000) { engagedSent = true; track("engaged", { seconds: 30 }); }
  }
  setInterval(tickEngaged, 5000);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { tickEngaged(); visibleSince = 0; track("page_hidden", { engaged_s: Math.round(engagedMs / 1000), max_scroll: maxDepth }); flush(true); }
    else visibleSince = now();
  });
  addEventListener("pagehide", function () { tickEngaged(); track("page_exit", { engaged_s: Math.round(engagedMs / 1000), max_scroll: maxDepth }); flush(true); });

  document.addEventListener("DOMContentLoaded", function () {
    if (!("IntersectionObserver" in window)) return;
    var special = { results: "view_results", pricing: "view_pricing" };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var id = en.target.id || en.target.tagName.toLowerCase();
        track("section_view", { section: id }, { section: id });
        if (special[id]) track(special[id], { section: id }, { section: id, metaParams: { content_name: id === "pricing" ? "Pricing" : "Case studies", content_type: "product_group" } });
      });
    }, { threshold: 0.35 });
    document.querySelectorAll("main section[id], footer").forEach(function (s) { io.observe(s); });
  });

  // JS errors (max 5 per page) so broken forms never go unnoticed
  var errs = 0;
  addEventListener("error", function (ev) { if (errs++ < 5) track("js_error", { msg: clean(ev.message, 160), src: clean((ev.filename || "").split("/").pop(), 60), line: ev.lineno }); });
})();
