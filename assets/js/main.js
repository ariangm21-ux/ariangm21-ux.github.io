/* Greyrock Digital — hero interactions */
(() => {
  "use strict";

  /* ---------------------------------------------------------
     CONFIG: published from the admin panel (see defaults.js)
     --------------------------------------------------------- */
  const CFG = window.GR_CFG || window.GR_MERGE();
  const SETTINGS = CFG.settings;
  const PREVIEW = new URLSearchParams(location.search).has("preview"); // admin preview frames: no tracking, no popups
  const CONFIG = {
    whatsapp: String(SETTINGS.business.whatsapp || "").replace(/\D/g, ""),
    waMessage: SETTINGS.business.waMessage,
    leadEndpoint: "/api/leads",        // local server; falls back to browser storage if unreachable
  };
  const INDUSTRIES = CFG.content.industries;

  const AREAS = ["Dhanmondi, Dhaka", "Gulshan, Dhaka", "Uttara, Dhaka", "Mirpur, Dhaka", "Bashundhara, Dhaka", "Mohammadpur, Dhaka",
    "Agrabad, Chattogram", "Zindabazar, Sylhet", "Khulna", "Rajshahi", "Cumilla", "Narayanganj", "Gazipur", "Mymensingh", "Bogura", "Cox's Bazar"];
  const CHANNELS = ["Facebook ad", "Instagram ad", "Google search", "TikTok ad", "Messenger"];
  const PAYMENTS = ["COD", "bKash", "Nagad", "Card"];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }); // lakh grouping: 1,50,000
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
  };

  root.classList.add("js");

  /* ---------------------------------------------------------
     First-party analytics → local server (powers the admin dashboard)
     --------------------------------------------------------- */
  // all events go through the first-party tracker (tracker.js), which also bridges to Meta Pixel + CAPI
  const GRT = window.GRT || { track() { return null; }, identify() { return Promise.resolve(); }, ids() { return {}; }, newId() { return String(Date.now()); }, flush() {} };
  const track = (name, props, opts) => GRT.track(name, props, opts);

  /* ---------------------------------------------------------
     Hero copy from the admin (markup mirrors the original exactly)
     --------------------------------------------------------- */
  const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const takaH = (s) => escH(s).replace(/৳/g, '<span class="tk">৳</span>');
  (function applyHero(h) {
    if (!h) return;
    const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).map((w) => `<span class="w">${takaH(w)}</span>`).join(" ");
    $("#hero-title").innerHTML =
      `<span class="line">${words(h.line1)}</span>` +
      `<span class="line">${words(h.line2)}${h.line2Grad ? ` <span class="w grad-text">${takaH(h.line2Grad)}</span>` : ""}</span>`;
    $(".hero-sub").innerHTML = escH(h.sub || "").replace(/\*(.+?)\*/g, "<em>$1</em>");
    if (Array.isArray(h.stats) && h.stats.length) {
      $(".stats").innerHTML = h.stats.map((s) => `
        <div class="stat"><dt>${escH(s.label)}</dt><dd>${s.prefix ? `<span class="tk">${escH(s.prefix)}</span>` : ""}<span class="count" data-to="${+s.value || 0}" data-decimals="${+s.decimals || 0}" data-suffix="${escH(s.suffix || "")}">0</span></dd></div>`).join("");
    }
  })(CFG.content.hero);
  if (SETTINGS.seo) {
    if (SETTINGS.seo.title) document.title = SETTINGS.seo.title;
    if (SETTINGS.seo.description) $('meta[name="description"]').setAttribute("content", SETTINGS.seo.description);
  }

  /* ---------------------------------------------------------
     Theme direction switcher
     --------------------------------------------------------- */
  const themeColors = { graphite: "#0A0C0F", electric: "#06061A", sandstone: "#F4EFE6" };
  function setTheme(name, remember = true) {
    if (!themeColors[name]) return;
    root.dataset.theme = name;
    syncThemeUI(name);
    if (remember) { store.set("gr-theme", name); store.set("gr-theme-v", String(SETTINGS.themeVersion || 1)); }
  }
  // admin panel publishes → open tabs in this browser update instantly
  if ("BroadcastChannel" in window) {
    new BroadcastChannel("greyrock-admin").onmessage = (e) => {
      const msg = e.data || {};
      if (msg.type === "theme" && !new URLSearchParams(location.search).get("theme")) setTheme(msg.theme, false);
      if (msg.type === "reload") location.reload();
    };
  }
  // initial theme is already applied in <head> by site-config.js; just sync the UI to it
  const SITE = window.GR_SITE || { theme: "graphite", showThemeSwitcher: true };
  const syncThemeUI = (name) => {
    $('meta[name="theme-color"]').setAttribute("content", themeColors[name]);
    $$("[data-theme-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeBtn === name)));
  };
  syncThemeUI(root.dataset.theme);
  const switcher = $(".theme-switch");
  if (!SITE.showThemeSwitcher) switcher.remove();
  else $$("[data-theme-btn]").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.themeBtn)));

  /* ---------------------------------------------------------
     WhatsApp links
     --------------------------------------------------------- */
  const waHref = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.waMessage)}`;
  $$(".js-wa").forEach((a) => (a.href = waHref));

  /* ---------------------------------------------------------
     Nav
     --------------------------------------------------------- */
  const navWrap = $(".nav-wrap");
  const navToggle = $(".nav-toggle");
  const mobileMenu = $("#mobile-menu");
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    navToggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    mobileMenu.hidden = open;
  });
  mobileMenu.addEventListener("click", (e) => {
    if (e.target.closest("a")) { mobileMenu.hidden = true; navToggle.setAttribute("aria-expanded", "false"); }
  });

  /* ---------------------------------------------------------
     Intro choreography
     --------------------------------------------------------- */
  $$(".hero-title .w").forEach((w, i) => w.style.setProperty("--i", i));
  [[".eyebrow", 0], [".hero-sub", 550], [".capture", 700], [".assurances", 800], [".stats", 900], [".stage", 1000], [".channels", 1150]]
    .forEach(([sel, d]) => { const el = $(sel); el.classList.add("reveal"); el.style.setProperty("--d", d + "ms"); });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-ready")));

  /* ---------------------------------------------------------
     Count-up stats
     --------------------------------------------------------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.to);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const render = (v) => (el.textContent = v.toFixed(dec) + suffix);
    if (reduceMotion) return render(to);
    const dur = 1800, t0 = performance.now();
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1);
      render(to * (1 - Math.pow(2, -10 * p)));
      if (p < 1) requestAnimationFrame(step); else render(to);
    };
    requestAnimationFrame(step);
  }
  const statIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { setTimeout(() => countUp(e.target), 900); statIO.unobserve(e.target); } });
  }, { threshold: .6 });
  $$(".count").forEach((el) => statIO.observe(el));

  /* ---------------------------------------------------------
     Pointer spotlight + magnetic CTA
     --------------------------------------------------------- */
  const hero = $(".hero");
  if (finePointer && !reduceMotion) {
    let raf = 0;
    hero.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
        hero.style.setProperty("--my", `${e.clientY - r.top}px`);
        raf = 0;
      });
    });

    $$(".btn-magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * .12}px, ${dy * .25}px)`;
      });
      btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
    });
  }

  /* ---------------------------------------------------------
     Console tilt-to-flat on scroll
     --------------------------------------------------------- */
  const stage = $(".stage");
  const consoleEl = $("#console");
  function onScroll() {
    navWrap.classList.toggle("scrolled", scrollY > 10);
    if (reduceMotion || innerWidth <= 760) return;
    const r = stage.getBoundingClientRect();
    const p = clamp(1 - (r.top - innerHeight * .15) / (innerHeight * .65), 0, 1);
    consoleEl.style.setProperty("--tilt", `${(1 - p) * 14}deg`);
    consoleEl.style.setProperty("--scale", (.94 + .06 * p).toFixed(4));
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------------------------------------------------------
     Growth simulator
     --------------------------------------------------------- */
  const state = { industry: INDUSTRIES[0], budget: 50000 };
  const slider = $("#budget");
  const budgetOut = $("#budget-out");
  const chips = $("#industry");

  chips.insertAdjacentHTML("beforeend", INDUSTRIES.map((ind, i) => `
    <label class="chip"><input type="radio" name="industry" value="${ind.id}" ${i === 0 ? "checked" : ""} />${ind.label}</label>`).join(""));

  // Slider is logarithmic: 0..1000 → ৳10,000..৳10,00,000
  const toBudget = (v) => {
    const raw = 10000 * Math.pow(100, v / 1000);
    const step = raw < 100000 ? 1000 : 5000;
    return Math.round(raw / step) * step;
  };
  // Bigger budgets reach colder audiences, so ROAS eases off a little as spend scales.
  const effRoas = (ind, budget) => ind.roas * (1 - .06 * Math.log10(budget / 10000));

  const tweens = new Map();
  function tweenNumber(el, to, format = (v) => fmt.format(v)) {
    const from = parseFloat(el.dataset.v || to);
    el.dataset.v = to;
    if (reduceMotion || from === to) { el.textContent = format(to); return; }
    cancelAnimationFrame(tweens.get(el));
    const t0 = performance.now(), dur = 550;
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = format(from + (to - from) * e);
      if (p < 1) tweens.set(el, requestAnimationFrame(step));
    };
    tweens.set(el, requestAnimationFrame(step));
  }

  const kRevenue = $("#k-revenue"), kOrders = $("#k-orders"), kCpo = $("#k-cpo"), kRoas = $("#k-roas");
  let lastIndustry = null;

  function updateSim() {
    const { industry, budget } = state;
    const roas = effRoas(industry, budget);
    const revenue = budget * roas;
    const orders = revenue / industry.aov;
    const cpo = budget / orders;

    budgetOut.innerHTML = `<span class="tk">৳</span>${fmt.format(budget)}`;
    slider.setAttribute("aria-valuetext", `${fmt.format(budget)} taka per month`);
    slider.style.setProperty("--p", `${(slider.value / slider.max) * 100}%`);

    tweenNumber(kRevenue, Math.round(revenue / 1000) * 1000);
    tweenNumber(kOrders, Math.round(orders));
    tweenNumber(kCpo, Math.round(cpo));
    kRoas.textContent = `${roas.toFixed(1)}x ROAS`;

    if (lastIndustry !== industry) {
      kRevenue.closest(".kpi").classList.remove("bump");
      void kRevenue.offsetWidth;
      kRevenue.closest(".kpi").classList.add("bump");
      lastIndustry = industry;
    }
    drawChart();
  }

  // simulator analytics: first use goes to Meta (SimulatorUsed), every settled change goes to the admin
  let simUsed = false, simTimer = 0;
  const simChanged = () => {
    clearTimeout(simTimer);
    simTimer = setTimeout(() => {
      const props = { industry: state.industry.id, budget: state.budget, projected: Math.round(state.budget * effRoas(state.industry, state.budget)) };
      if (!simUsed) { simUsed = true; track("simulator_used", props, { section: "simulator", metaParams: { content_name: "Growth simulator", content_category: state.industry.id } }); }
      track("simulator_change", props, { section: "simulator" });
    }, 800);
  };
  slider.addEventListener("input", () => { state.budget = toBudget(+slider.value); updateSim(); simChanged(); });
  chips.addEventListener("change", simChanged);
  chips.addEventListener("change", (e) => {
    state.industry = INDUSTRIES.find((i) => i.id === e.target.value);
    updateSim();
    resetFeed();
  });

  /* ---------------------------------------------------------
     Chart: 12-week projection (test → learn → scale)
     --------------------------------------------------------- */
  const chart = $("#chart");
  const svg = $("svg", chart);
  const W = 600, H = 300, PAD_T = 16, PAD_B = 8;
  const gGrid = $(".gridlines", svg), pArea = $(".area", svg), pRev = $(".line-rev", svg), pSpend = $(".line-spend", svg);
  const cLine = $(".cursor-line", svg), cDot = $(".cursor-dot", svg), tip = $(".chart-tip", chart);
  let series = [];

  const yLabels = document.createElement("div");
  yLabels.className = "chart-y";
  yLabels.setAttribute("aria-hidden", "true");
  chart.appendChild(yLabels);

  function project() {
    const { industry, budget } = state;
    const target = effRoas(industry, budget);
    const weekly = budget / 4.33;
    return Array.from({ length: 12 }, (_, i) => {
      const w = i + 1;
      // spend: lean testing weeks, then steady, then scaling winners
      const spend = weekly * (w <= 4 ? .55 + w * .11 : 1 + Math.max(0, w - 5) * .07);
      // ROAS climbs out of the learning phase toward target, small lift once scaled
      const roas = target * (1 - .66 * Math.exp(-(w - 1) / 2.1)) * (w > 8 ? 1 + (w - 8) * .015 : 1);
      return { w, spend, revenue: spend * roas, roas };
    });
  }

  const niceCeil = (v) => {
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / mag;
    return (n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 3 ? 3 : n <= 5 ? 5 : n <= 7.5 ? 7.5 : 10) * mag;
  };
  const short = (v) => v >= 1e7 ? `${+(v / 1e7).toFixed(2)} Cr` : v >= 1e5 ? `${+(v / 1e5).toFixed(2)} L` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : `${Math.round(v)}`;

  function smoothPath(pts) {
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }

  let yMax = 1;
  const xAt = (i) => (i / 11) * W;
  const yAt = (v) => PAD_T + (1 - v / yMax) * (H - PAD_T - PAD_B);

  function drawChart() {
    series = project();
    yMax = niceCeil(Math.max(...series.map((s) => s.revenue)) * 1.08);

    const rev = series.map((s, i) => [xAt(i), yAt(s.revenue)]);
    const spend = series.map((s, i) => [xAt(i), yAt(s.spend)]);
    const revD = smoothPath(rev);
    pRev.setAttribute("d", revD);
    pArea.setAttribute("d", `${revD} L${W},${H} L0,${H} Z`);
    pSpend.setAttribute("d", smoothPath(spend));

    const ticks = [0, .25, .5, .75, 1];
    gGrid.innerHTML = ticks.map((t) => `<line x1="0" x2="${W}" y1="${yAt(yMax * t)}" y2="${yAt(yMax * t)}" />`).join("");
    yLabels.innerHTML = ticks.slice(1).map((t) =>
      `<span style="top:${(yAt(yMax * t) / H) * 100}%"><span class="tk">৳</span>${short(yMax * t)}</span>`).join("");
  }

  function showPoint(clientX) {
    const r = chart.getBoundingClientRect();
    const i = clamp(Math.round(((clientX - r.left) / r.width) * 11), 0, 11);
    const s = series[i], x = xAt(i), y = yAt(s.revenue);
    cLine.setAttribute("x1", x); cLine.setAttribute("x2", x);
    cDot.setAttribute("cx", x); cDot.setAttribute("cy", y);
    const left = clamp((x / W) * r.width, 80, r.width - 80);
    tip.style.left = `${left}px`;
    tip.style.top = `${(y / H) * r.height - 10}px`;
    tip.innerHTML = `<b>Week ${s.w}</b><br>Revenue <b><span class="tk">৳</span>${fmt.format(Math.round(s.revenue))}</b><br>Ad spend <span class="tk">৳</span>${fmt.format(Math.round(s.spend))}<br>ROAS <b>${s.roas.toFixed(1)}x</b>`;
    chart.classList.add("hovering");
  }
  chart.addEventListener("pointermove", (e) => showPoint(e.clientX));
  chart.addEventListener("pointerdown", (e) => showPoint(e.clientX));
  chart.addEventListener("pointerleave", () => chart.classList.remove("hovering"));

  // wipe the chart in when it first scrolls into view
  new IntersectionObserver((entries, io) => {
    if (entries[0].isIntersecting) { chart.classList.add("drawn"); io.disconnect(); }
  }, { threshold: .4 }).observe(chart);

  /* ---------------------------------------------------------
     Live orders feed (demo data, follows selected industry)
     --------------------------------------------------------- */
  const feed = $("#feed");
  const MAX_ORDERS = 6;
  const ago = ["just now", "12s ago", "40s ago", "1m ago", "2m ago", "3m ago"];

  function makeOrder() {
    const ind = state.industry;
    const area = pick(AREAS);
    const amt = Math.round((ind.aov * (.55 + Math.random() * 1.1)) / 10) * 10;
    const li = document.createElement("li");
    li.className = "order";
    li.innerHTML = `
      <span class="order-av" aria-hidden="true">${area[0]}</span>
      <span class="order-main">
        <span class="order-title" style="display:block">${pick(ind.products)}</span>
        <span class="order-meta" style="display:block">${area} · ${pick(PAYMENTS)} · via ${pick(CHANNELS)}</span>
      </span>
      <span class="order-amt"><span class="tk">৳</span>${fmt.format(amt)}</span>`;
    return li;
  }
  function resetFeed() {
    feed.innerHTML = "";
    for (let i = 0; i < MAX_ORDERS; i++) feed.appendChild(makeOrder());
  }
  function pushOrder() {
    const li = makeOrder();
    if (!reduceMotion) li.classList.add("enter");
    feed.prepend(li);
    while (feed.children.length > MAX_ORDERS) feed.lastElementChild.remove();
  }

  let feedTimer = 0, feedVisible = false;
  const scheduleFeed = () => {
    clearTimeout(feedTimer);
    if (!feedVisible || document.hidden) return;
    feedTimer = setTimeout(() => { pushOrder(); scheduleFeed(); }, 1800 + Math.random() * 1800);
  };
  new IntersectionObserver((entries) => { feedVisible = entries[0].isIntersecting; scheduleFeed(); }).observe(feed);
  document.addEventListener("visibilitychange", scheduleFeed);

  /* ---------------------------------------------------------
     Lead capture
     --------------------------------------------------------- */
  const modal = $("#lead-modal");
  const leadForm = $("#lead-form");
  const captureForm = $("#capture-form");
  const captureInput = $("#capture-url");
  const captureError = $("#capture-error");
  const fIndustry = $("#lf-industry");
  const fBudget = $("#lf-budget");

  fIndustry.innerHTML = INDUSTRIES.map((i) => `<option value="${i.id}">${i.label}</option>`).join("") + `<option value="other">Other</option>`;

  // first-touch UTM capture, so we know which of OUR ads produced the lead
  const utm = {};
  new URLSearchParams(location.search).forEach((v, k) => { if (k.startsWith("utm_") || k === "fbclid" || k === "gclid") utm[k] = v; });
  try {
    if (Object.keys(utm).length && !sessionStorage.getItem("gr-utm")) sessionStorage.setItem("gr-utm", JSON.stringify(utm));
  } catch { /* storage blocked */ }
  const getUtm = () => { try { return sessionStorage.getItem("gr-utm") || JSON.stringify(utm); } catch { return JSON.stringify(utm); } };

  let lastTrigger = null;
  function openLead(source, prefillUrl = "") {
    lastTrigger = document.activeElement;
    $('[data-step="form"]', modal).hidden = false;
    $('[data-step="success"]', modal).hidden = true;
    leadForm.source.value = source;
    leadForm.utm.value = getUtm();
    if (prefillUrl) leadForm.url.value = prefillUrl;
    fIndustry.value = state.industry.id;
    const b = state.budget;
    fBudget.selectedIndex = b < 25000 ? 0 : b < 75000 ? 1 : b < 200000 ? 2 : b < 500000 ? 3 : 4;
    modal.showModal();
    leadSucceeded = false;
    track("lead_form_open", { lead_source: source, industry: state.industry.id, budget: state.budget }, { section: "lead-modal", metaParams: { content_name: "Free audit form", content_category: source } });
    (prefillUrl ? $("#lf-name") : $("#lf-name")).focus();
  }

  // delegated, so CTAs rendered later by sections.js work too
  document.addEventListener("click", (e) => {
    const el = e.target.closest(".js-open-lead");
    if (!el) return;
    e.preventDefault();
    openLead(el.dataset.source || "cta");
  });
  window.GR = { openLead, state, INDUSTRIES, CONFIG, modal, track, CFG, PREVIEW, grader: null };

  captureForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = captureInput.value.trim();
    if (v.length < 3) {
      captureForm.classList.add("has-error");
      captureError.textContent = "Add your Facebook page or website so we know what to audit.";
      captureInput.setAttribute("aria-invalid", "true");
      captureInput.focus();
      return;
    }
    captureForm.classList.remove("has-error");
    captureError.textContent = "";
    captureInput.removeAttribute("aria-invalid");
    openLead("hero-capture", v);
  });
  captureInput.addEventListener("input", () => {
    if (captureForm.classList.contains("has-error")) { captureForm.classList.remove("has-error"); captureError.textContent = ""; captureInput.removeAttribute("aria-invalid"); }
  });

  modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) modal.close(); });
  let leadSucceeded = false;
  modal.addEventListener("close", () => {
    // closed without submitting → record how far they got (field names only, never values)
    if (!leadSucceeded) {
      const st = GRT.formState ? GRT.formState("lead-form") : { started: false, done: {} };
      track("form_abandon", { form: "lead-form", started: st.started, completed: Object.keys(st.done) }, { section: "lead-modal" });
    }
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  });

  // BD mobile: 01[3-9]XXXXXXXX, with or without 880 / leading 0
  const normalizePhone = (raw) => {
    const d = raw.replace(/\D/g, "").replace(/^880/, "").replace(/^0/, "");
    return /^1[3-9]\d{8}$/.test(d) ? `+880${d}` : null;
  };

  function setFieldError(name, msg) {
    const err = $(`.field-error[data-for="${name}"]`, leadForm);
    const input = leadForm[name];
    err.textContent = msg || "";
    input.closest(".field").classList.toggle("invalid", !!msg);
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", err.id || (err.id = `err-${name}`));
    if (msg) track("form_error", { form: "lead-form", field: name, error: msg.slice(0, 60) }, { section: "lead-modal" });
  }

  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = leadForm.name.value.trim();
    const phone = normalizePhone(leadForm.phone.value);
    setFieldError("name", name ? "" : "Tell us what to call you.");
    setFieldError("phone", phone ? "" : "Enter a valid Bangladeshi mobile number, e.g. 1712-345678.");
    if (!name) return leadForm.name.focus();
    if (!phone) return leadForm.phone.focus();

    const btn = $('button[type="submit"]', leadForm);
    btn.classList.add("loading");

    const lead = {
      name, phone,
      url: leadForm.url.value.trim(),
      industry: fIndustry.value,
      budget: fBudget.value,
      simulatedBudget: state.budget,
      source: leadForm.source.value,
      utm: JSON.parse(leadForm.utm.value || "{}"),
      theme: root.dataset.theme,
      page: location.href,
      at: new Date().toISOString(),
      grader: window.GR.grader || null,   // set by the ad account grader, if they took it
    };
    // tracking identifiers: journey + attribution in the admin, deduplicated Lead event for Meta
    const ids = GRT.ids();
    Object.assign(lead, {
      eventId: GRT.newId(),
      vid: ids.vid, sid: ids.sid, fbp: ids.fbp, fbc: ids.fbc,
      attribution: { first: ids.first || null, last: ids.last || null, channel: ids.channel || "direct" },
      device: ids.device || null, visit: ids.visit || 1, internal: !!ids.internal,
    });

    try {
      let sent = false;
      if (CONFIG.leadEndpoint && !PREVIEW) sent = await window.GR_SEND_LEAD(lead); // server, or Google Sheet when hosted statically
      if (!sent) {
        const all = JSON.parse(store.get("gr-leads") || "[]");
        all.push(lead);
        store.set("gr-leads", JSON.stringify(all));
        console.info("[Greyrock] Lead kept in this browser (no lead server reachable):", lead);
        await new Promise((r) => setTimeout(r, 600));
      }
      // identify first (hashed phone + name → advanced matching), then the Lead event.
      // The Pixel sends it with eventID = lead.eventId; the server sends the same ID via CAPI, so Meta deduplicates.
      await GRT.identify({ phone: lead.phone, name: lead.name });
      track("lead", { lead_source: lead.source, industry: lead.industry, budget: lead.budget, stored: sent || "browser" },
        { eventId: lead.eventId, section: "lead-modal", capi: false, metaParams: { content_name: "Free ad audit", content_category: lead.industry, lead_source: lead.source } });
      GRT.flush();
      leadSucceeded = true;

      store.set("gr-lead-done", "1");
      $('[data-step="form"]', modal).hidden = true;
      const ok = $('[data-step="success"]', modal);
      ok.hidden = false;
      $("h2", ok).focus();
      leadForm.reset();
    } catch (err) {
      setFieldError("phone", "Couldn't send right now. Please try again, or message us on WhatsApp.");
    } finally {
      btn.classList.remove("loading");
    }
  });

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  slider.value = 350;
  state.budget = toBudget(350);
  updateSim();
  resetFeed();
})();
