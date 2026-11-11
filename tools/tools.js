/* Greyrock free products: shared page behaviour (nav, footer, WhatsApp, reveal, lead form).
   Each tool can add context to the lead with window.GTOOLS.setLeadExtra(() => ({ ... })). */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const CFG = window.GR_CFG || window.GR_MERGE();
  const S = CFG.settings;
  const GRT = window.GRT || { track() { return null; }, identify() { return Promise.resolve(); }, ids() { return {}; }, newId() { return String(Date.now()); }, flush() {} };
  const track = (n, p, o) => GRT.track(n, p, o);
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* blocked */ } } };
  document.documentElement.classList.add("js");

  /* nav */
  const navWrap = $(".nav-wrap"), toggle = $(".nav-toggle"), menu = $("#mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
  }
  addEventListener("scroll", () => navWrap && navWrap.classList.toggle("scrolled", scrollY > 10), { passive: true });

  /* WhatsApp + footer details from the admin */
  const wa = String(S.business.whatsapp || "").replace(/\D/g, "");
  const waHref = (msg) => `https://wa.me/${wa}?text=${encodeURIComponent(msg || S.business.waMessage || "")}`;
  $$(".js-wa").forEach((a) => (a.href = waHref(a.dataset.waMsg)));
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  const mail = $('[data-content="email"]');
  if (mail && S.business.email) { mail.href = `mailto:${S.business.email}`; mail.textContent = S.business.email; }
  const addr = $(".foot-cols > div:last-child > span");
  if (addr && S.business.address) addr.textContent = S.business.address;
  const soc = { Facebook: S.business.facebook, Instagram: S.business.instagram, LinkedIn: S.business.linkedin, TikTok: S.business.tiktok };
  $$(".socials a").forEach((a) => { const u = soc[a.getAttribute("aria-label")]; if (u) { a.href = u; a.target = "_blank"; a.rel = "noopener"; } });
  if (S.seo && S.seo.title && document.body.dataset.titleSuffix) document.title = `${document.body.dataset.titleSuffix} · Greyrock Digital`;

  /* scroll reveal */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  $$(".sr").forEach((el) => io.observe(el));

  /* ---------- lead form (same fields as the main site, so the admin funnel lines up) ---------- */
  const modal = $("#lead-modal"), form = $("#lead-form");
  let extra = () => ({}), lastTrigger = null, succeeded = false;
  const industries = (CFG.content.industries || []);
  const fInd = $("#lf-industry");
  if (fInd) fInd.innerHTML = industries.map((i) => `<option value="${i.id}">${i.label}</option>`).join("") + '<option value="other">Other</option>';

  function openLead(source, opts = {}) {
    if (!modal) return;
    lastTrigger = document.activeElement;
    succeeded = false;
    $('[data-step="form"]', modal).hidden = false;
    $('[data-step="success"]', modal).hidden = true;
    form.source.value = source;
    if (opts.title) $("#lead-title").textContent = opts.title;
    if (opts.sub) $(".modal-sub", modal).textContent = opts.sub;
    if (opts.industry && fInd) fInd.value = opts.industry;
    modal.showModal();
    track("lead_form_open", { lead_source: source }, { section: "lead-modal", metaParams: { content_name: "Free audit form", content_category: source } });
    $("#lf-name").focus();
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest(".js-open-lead");
    if (!el) return;
    e.preventDefault();
    openLead(el.dataset.source || "tools");
  });
  if (modal) {
    modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) modal.close(); });
    modal.addEventListener("close", () => {
      if (!succeeded) { const st = GRT.formState ? GRT.formState("lead-form") : { started: false, done: {} }; track("form_abandon", { form: "lead-form", started: st.started, completed: Object.keys(st.done) }, { section: "lead-modal" }); }
      if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    });
  }
  const normalizePhone = (raw) => { const d = raw.replace(/\D/g, "").replace(/^880/, "").replace(/^0/, ""); return /^1[3-9]\d{8}$/.test(d) ? `+880${d}` : null; };
  function fieldError(name, msg) {
    const err = $(`.field-error[data-for="${name}"]`, form), input = form[name];
    err.textContent = msg || "";
    input.closest(".field").classList.toggle("invalid", !!msg);
    if (msg) { input.setAttribute("aria-invalid", "true"); track("form_error", { form: "lead-form", field: name, error: msg.slice(0, 60) }, { section: "lead-modal" }); }
    else input.removeAttribute("aria-invalid");
  }
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.name.value.trim(), phone = normalizePhone(form.phone.value);
    fieldError("name", name ? "" : "Tell us what to call you.");
    fieldError("phone", phone ? "" : "Enter a valid Bangladeshi mobile number, e.g. 1712-345678.");
    if (!name) return form.name.focus();
    if (!phone) return form.phone.focus();
    const btn = $('button[type="submit"]', form);
    btn.classList.add("loading");
    const ids = GRT.ids();
    const lead = {
      name, phone, url: form.url.value.trim(), industry: fInd ? fInd.value : "", budget: "",
      source: form.source.value, theme: document.documentElement.dataset.theme, page: location.href, at: new Date().toISOString(),
      eventId: GRT.newId(), vid: ids.vid, sid: ids.sid, fbp: ids.fbp, fbc: ids.fbc,
      attribution: { first: ids.first || null, last: ids.last || null, channel: ids.channel || "direct" },
      device: ids.device || null, visit: ids.visit || 1, internal: !!ids.internal,
      ...extra(),
    };
    try {
      const sent = await window.GR_SEND_LEAD(lead); // server, or Google Sheet when hosted statically
      if (!sent) { const all = JSON.parse(store.get("gr-leads") || "[]"); all.push(lead); store.set("gr-leads", JSON.stringify(all)); }
      await GRT.identify({ phone: lead.phone, name: lead.name });
      track("lead", { lead_source: lead.source, industry: lead.industry, stored: sent || "browser" },
        { eventId: lead.eventId, section: "lead-modal", capi: false, metaParams: { content_name: "Free ad audit", content_category: lead.industry, lead_source: lead.source } });
      GRT.flush();
      succeeded = true;
      store.set("gr-lead-done", "1");
      $('[data-step="form"]', modal).hidden = true;
      const ok = $('[data-step="success"]', modal); ok.hidden = false; $("h2", ok).focus();
      form.reset();
    } catch { fieldError("phone", "Couldn't send right now. Please try again, or message us on WhatsApp."); }
    finally { btn.classList.remove("loading"); }
  });

  window.GTOOLS = { openLead, track, waHref, setLeadExtra: (fn) => { extra = fn; }, CFG };
})();
