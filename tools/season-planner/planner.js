/* Greyrock free product: sales season planner.
   Season dates are computed every year in the browser (Islamic dates via the built-in Umm al-Qura calendar),
   so nothing ever needs updating. No AI, no paid APIs. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  const tk = (n) => `৳${fmt.format(Math.max(0, Math.round(n)))}`;
  const T = window.GTOOLS || { track() {}, openLead() {}, setLeadExtra() {} };
  const DAY = 864e5;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const diffDays = (a, b) => Math.round((b - a) / DAY);
  const dfmt = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const dshort = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  /* ---------- self-updating season dates ---------- */
  let hijriFmt = null;
  try { hijriFmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" }); } catch { /* very old browser */ }
  const hijriCache = {};
  function hijriDates(year, hm, hd) {   // all Gregorian dates in `year` that fall on Hijri month/day
    const key = `${year}-${hm}-${hd}`;
    if (hijriCache[key]) return hijriCache[key];
    const out = [];
    if (hijriFmt) {
      for (let t = new Date(year, 0, 1); t.getFullYear() === year; t.setDate(t.getDate() + 1)) {
        const p = {}; hijriFmt.formatToParts(t).forEach((x) => (p[x.type] = x.value));
        if (+p.month === hm && +p.day === hd) out.push(new Date(t));
      }
    }
    return (hijriCache[key] = out);
  }
  const nthWeekday = (y, m, wd, n) => { const d = new Date(y, m, 1); const add = (wd - d.getDay() + 7) % 7; return new Date(y, m, 1 + add + (n - 1) * 7); };

  // lead = days of ads before the day · test = test-phase days · out/in = courier cut-off (days before) for outside/inside Dhaka
  // saleDay = the sale happens ON the day (orders on the day itself)
  const SEASONS = [
    { id: "eid-fitr", name: "Eid-ul-Fitr", bn: "ঈদুল ফিতর", hijri: [10, 1], lead: 30, test: 6, out: 5, inn: 3, tip: "The biggest shopping season of the year. Demand peaks in the last 10 days of Ramadan." },
    { id: "eid-adha", name: "Eid-ul-Adha", bn: "ঈদুল আযহা", hijri: [12, 10], lead: 21, test: 5, out: 5, inn: 3, tip: "Fashion and home items sell early. Many people travel home, so close outside-Dhaka orders early." },
    { id: "boishakh", name: "Pohela Boishakh", bn: "পহেলা বৈশাখ", date: (y) => new Date(y, 3, 14), lead: 21, test: 5, out: 4, inn: 2, tip: "Red-and-white fashion, sweets and gifts. Sales peak in the week before." },
    { id: "valentine", name: "Valentine's Day", bn: "ভালোবাসা দিবস", date: (y) => new Date(y, 1, 14), lead: 12, test: 3, out: 3, inn: 1, tip: "Gifts, jewellery, flowers and couple items. Most people order in the last 5 days." },
    { id: "mothers", name: "Mother's Day", bn: "মা দিবস", date: (y) => nthWeekday(y, 4, 0, 2), lead: 12, test: 3, out: 3, inn: 1, tip: "Gifts, saris, skincare and cakes. Remind people a week ahead." },
    { id: "1111", name: "11.11 sale", bn: "১১.১১ সেল", date: (y) => new Date(y, 10, 11), lead: 10, test: 3, out: 0, inn: 0, saleDay: true, tip: "Build a waitlist with teaser ads; most orders land on the day itself." },
    { id: "blackfriday", name: "Black Friday", bn: "ব্ল্যাক ফ্রাইডে", date: (y) => addDays(nthWeekday(y, 10, 4, 4), 1), lead: 10, test: 3, out: 0, inn: 0, saleDay: true, tip: "Electronics and fashion deals. Tease early, sell hard on the day." },
    { id: "victory", name: "Victory Day", bn: "বিজয় দিবস", date: (y) => new Date(y, 11, 16), lead: 10, test: 3, out: 2, inn: 1, tip: "Red-green fashion and patriotic themes. A short, sharp season." },
    { id: "yearend", name: "Year-end sale", bn: "বছর শেষের সেল", date: (y) => new Date(y, 11, 31), lead: 14, test: 3, out: 3, inn: 1, tip: "Winter wear, gifts and clearance. People shop around salary day too." },
    { id: "custom", name: "Custom date", bn: "নিজের তারিখ", custom: true, lead: 21, test: 5, out: 4, inn: 2, tip: "Durga Puja, your anniversary sale, a product launch: plan any date." },
  ];
  function nextDate(s) {
    if (s.custom) return customDate;
    for (let y = today.getFullYear(); y <= today.getFullYear() + 2; y++) {
      const ds = s.hijri ? hijriDates(y, s.hijri[0], s.hijri[1]) : [s.date(y)];
      const d = ds.find((x) => x >= today);
      if (d) return d;
    }
    return null;
  }

  /* ---------- state ---------- */
  const DEF = { goal: 500000, aov: 1500, roas: 4, ret: 15, items: 1 };
  let st = { ...DEF };
  let seasonId = "";
  let customName = "", customDate = null;
  let imported = false;
  const qs = new URLSearchParams(location.search);
  try {
    const calc = JSON.parse(localStorage.getItem("gr-profit-calc") || "null");   // numbers from the profit calculator
    if (calc && calc.price && calc.orders && calc.ads) {
      st.aov = Math.round(calc.price);
      st.ret = Math.round(calc.retPct || 0);
      st.roas = Math.max(0.5, +((calc.orders * calc.price) / calc.ads).toFixed(1));
      imported = true;
    }
    const saved = JSON.parse(localStorage.getItem("gr-season-plan") || "null");
    if (saved && !qs.has("goal")) { Object.keys(DEF).forEach((k) => { if (k in saved.st) st[k] = saved.st[k]; }); seasonId = saved.season || ""; customName = saved.cname || ""; customDate = saved.cdate ? new Date(saved.cdate + "T00:00") : null; }
  } catch { /* storage blocked */ }
  Object.keys(DEF).forEach((k) => { if (qs.has(k)) st[k] = Math.max(0, Number(qs.get(k)) || DEF[k]); });
  if (qs.has("season")) seasonId = qs.get("season");
  if (qs.has("cname")) customName = qs.get("cname").slice(0, 40);
  if (qs.has("cdate")) { const d = new Date(qs.get("cdate") + "T00:00"); if (!isNaN(d)) customDate = d; }
  if (customDate && customDate < today) customDate = null;

  const upcoming = () => SEASONS.map((s) => ({ s, d: nextDate(s) })).filter((x) => x.s.custom || x.d).sort((a, b) => (a.s.custom ? 1 : b.s.custom ? -1 : a.d - b.d));
  if (!SEASONS.find((s) => s.id === seasonId)) {
    const firstUseful = upcoming().find((x) => !x.s.custom && diffDays(today, x.d) >= 5);
    seasonId = firstUseful ? firstUseful.s.id : "eid-fitr";
  }

  /* ---------- season picker ---------- */
  function paintSeasons() {
    $("#seasons").innerHTML = upcoming().map(({ s, d }) => {
      const days = d ? diffDays(today, d) : null;
      return `<button class="season${s.id === seasonId ? " on" : ""}" role="radio" aria-checked="${s.id === seasonId}" data-season="${s.id}">
        <b>${s.name}</b><span lang="bn">${s.bn}</span>
        <small>${s.custom ? (d ? dshort(d) : "Pick any date") : dshort(d)}</small>
        <em>${days == null ? "Your date" : days === 0 ? "Today" : `in ${days} day${days === 1 ? "" : "s"}`}</em></button>`;
    }).join("");
  }
  $("#seasons").addEventListener("click", (e) => {
    const b = e.target.closest("[data-season]");
    if (!b) return;
    seasonId = b.dataset.season;
    paintSeasons(); render(); save();
    T.track("planner_season", { tool: "season-planner", season: seasonId }, { section: "planner" });
    touched();
  });
  $("#cs-name").addEventListener("input", (e) => { customName = e.target.value.slice(0, 40); render(); save(); });
  $("#cs-date").addEventListener("change", (e) => { const d = new Date(e.target.value + "T00:00"); customDate = isNaN(d) || d < today ? null : d; paintSeasons(); render(); save(); touched(); });
  $("#cs-date").min = iso(today);

  /* ---------- inputs ---------- */
  const inputs = $$("[data-k]");
  inputs.forEach((el) => (el.value = st[el.dataset.k]));
  let used = false, tTimer = 0, lastField = "";
  $("#plan-form").addEventListener("input", (e) => {
    const k = e.target.dataset && e.target.dataset.k;
    if (!k) return;
    st[k] = Math.max(0, Number(e.target.value) || 0);
    lastField = k;
    render(); save(); touched();
  });
  function touched() {
    clearTimeout(tTimer);
    tTimer = setTimeout(() => {
      if (!used) { used = true; T.track("planner_used", { tool: "season-planner" }, { section: "planner", metaParams: { content_name: "Season planner" } }); }
      if (lastField) T.track("planner_change", { tool: "season-planner", field: lastField }, { section: "planner" });
      lastField = "";
    }, 1000);
  }
  function save() { try { localStorage.setItem("gr-season-plan", JSON.stringify({ st, season: seasonId, cname: customName, cdate: customDate ? iso(customDate) : "" })); } catch { /* blocked */ } }
  if (imported) {
    const n = $("#import-note");
    n.hidden = false;
    n.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg><span>Using your numbers from the <a href="/tools/profit-calculator/">profit calculator</a>: order value, return rate and ROAS. Change them below anytime.</span>`;
  }

  /* ---------- the plan ---------- */
  function plan() {
    const s = SEASONS.find((x) => x.id === seasonId) || SEASONS[0];
    const D = s.custom ? customDate : nextDate(s);
    const name = s.custom ? (customName.trim() || "Your season") : s.name;
    if (!D) return { s, name, D: null };
    const r = Math.min(st.ret, 80) / 100;
    const roas = Math.max(st.roas, 0.1), aov = Math.max(st.aov, 1);
    const placedRevenue = st.goal / (1 - r);
    const budget = placedRevenue / roas;
    const orders = placedRevenue / aov;
    const stock = Math.ceil(orders * Math.max(st.items, 1) * 1.15);
    const ideal = addDays(D, -s.lead);
    const start = ideal < today ? new Date(today) : ideal;
    const late = ideal < today;
    const outCut = addDays(D, -s.out), inCut = addDays(D, -s.inn);
    const lastAdDay = s.saleDay ? D : inCut;               // ads run until the last day orders still arrive in time
    const totalDays = Math.max(1, diffDays(start, lastAdDay) + 1);
    // phases
    const testDays = Math.max(1, Math.min(s.test, Math.round(totalDays * 0.3)));
    const peakDays = s.saleDay ? Math.min(3, totalDays) : Math.max(2, Math.min(Math.round(s.lead * 0.35), totalDays - testDays));
    const days = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(start, i);
      let phase, w;
      const fromEnd = diffDays(d, s.saleDay ? D : outCut);
      if (!s.saleDay && d > outCut) { phase = "final"; w = 1; }
      else if (i < testDays) { phase = "test"; w = 1; }
      else if (fromEnd < peakDays) { phase = "peak"; w = s.saleDay && fromEnd === 0 ? 4 : 2.6; }
      else { const scaleLen = Math.max(1, totalDays - testDays - peakDays); const k = (i - testDays) / scaleLen; phase = s.saleDay ? "teaser" : "scale"; w = s.saleDay ? 1.2 : 1.3 + 0.9 * k; }
      days.push({ d, phase, w });
    }
    const wSum = days.reduce((a, x) => a + x.w, 0) || 1;
    days.forEach((x) => (x.spend = (x.w / wSum) * budget));
    const scaleDays = days.filter((x) => x.phase === "scale" || x.phase === "peak" || x.phase === "teaser").length;
    const creatives = Math.max(6, 8 + Math.ceil(scaleDays / 3) * 2);
    const peakDaily = Math.max(...days.map((x) => x.spend));
    const firstOf = (p) => (days.find((x) => x.phase === p) || {}).d;
    // checklist (dated)
    const steps = [];
    const add = (d, title, text, key) => steps.push({ d, title, text, key });
    add(addDays(start, -14), "Lock your stock", `Order or reserve about ${fmt.format(stock)} items from suppliers so you don't sell out at the peak.`, "stock");
    add(addDays(start, -10), `Make ${creatives} ad creatives`, "Photos, short videos and offer graphics. Test different angles: offer, problem, social proof.", "creatives");
    add(addDays(start, -3), "Check tracking and offer", "Make sure your Meta Pixel and Conversions API fire on orders. Set the offer, delivery charges and the order form or landing page.", "tracking");
    add(start, `Start test ads · ${tk(days[0].spend)}/day`, `Run ${Math.min(5, Math.ceil(creatives / 2))}–6 creatives against 2–3 audiences. Don't judge anything in the first 48 hours.`, "start");
    const scaleStart = firstOf("scale") || firstOf("teaser");
    if (scaleStart) add(scaleStart, s.saleDay ? "Build hype: teasers and waitlist" : "Scale the winners", s.saleDay ? "Push countdown ads and collect messages or sign-ups for the sale day." : "Turn off ads with high cost per order, move budget to the 2–3 best. Add fresh creatives every 3 days.", "scale");
    const peakStart = firstOf("peak");
    if (peakStart) add(peakStart, `Peak days · up to ${tk(peakDaily)}/day`, "Highest budgets. Retarget everyone who visited, messaged or added to cart. Reply to the inbox fast.", "peak");
    if (!s.saleDay && s.out > 0) {
      add(addDays(outCut, -2), "Announce your last order dates", `Post and pin: "Outside Dhaka: order by ${dshort(outCut)}. Inside Dhaka: order by ${dshort(inCut)}."`, "announce");
      add(outCut, "Last day: outside-Dhaka orders", "After today, target inside Dhaka only, or offer delivery after the holiday.", "outcut");
      if (s.inn < s.out) add(inCut, "Last day: inside-Dhaka orders", "Stop sales ads. Switch to thank-you and brand posts.", "incut");
    }
    add(D, name, s.saleDay ? "Sale day: highest budget, fastest replies, stock and couriers ready." : "Enjoy it. Thank customers in a post.", "day");
    add(addDays(D, 3), "Collect reviews and retarget", "Ask happy customers for reviews and photos. Retarget buyers with a post-season offer.", "after");
    steps.sort((a, b) => a.d - b.d);
    return { s, name, D, late, start, ideal, outCut, inCut, budget, orders, deliveredOrders: orders * (1 - r), stock, creatives, totalDays, days, peakDaily, steps, placedRevenue };
  }

  /* ---------- render ---------- */
  const PHASES = { test: "Test", teaser: "Teasers", scale: "Scale", peak: "Peak", final: "Inside Dhaka only" };
  function render() {
    const p = plan();
    const s = p.s;
    $("#custom-box").hidden = !s.custom;
    if (s.custom) { $("#cs-name").value = customName; $("#cs-date").value = customDate ? iso(customDate) : ""; }
    const mn = $("#moon-note");
    mn.hidden = !(s.hijri && p.D);
    if (s.hijri && p.D) mn.textContent = `${s.name} is expected on ${dfmt(p.D)}, or a day later in Bangladesh depending on the moon. The plan uses the earlier date, to be safe.`;
    if (!p.D) {
      $("#r-budget").textContent = "Pick a date";
      ["#r-count", "#r-sub", "#k-start", "#k-start-s", "#k-orders", "#k-orders-s", "#k-stock", "#k-creatives", "#k-creatives-s", "#k-daily", "#k-daily-s", "#k-cut", "#k-cut-s", "#tl-sub"].forEach((id) => ($(id).textContent = ""));
      $("#timeline").innerHTML = ""; $("#tl-axis").innerHTML = ""; $("#checklist").innerHTML = ""; $("#p-insights").innerHTML = ""; $("#phase-legend").innerHTML = "";
      return;
    }
    const days = diffDays(today, p.D);
    $("#r-budget").textContent = tk(p.budget);
    $("#r-count").textContent = days === 0 ? `${p.name} is today` : `${p.name} in ${days} days`;
    $("#r-sub").textContent = `For ${tk(st.goal)} in delivered sales from ${p.name} (${dfmt(p.D)}), at ${st.roas}x ROAS and ${st.ret}% returns.`;
    $("#k-start").textContent = p.late ? "Today" : dshort(p.start);
    $("#k-start-s").textContent = p.late ? `You're starting late: ideal was ${dshort(p.ideal)}` : `${diffDays(today, p.start)} days from now`;
    $("#k-orders").textContent = fmt.format(Math.ceil(p.orders));
    $("#k-orders-s").textContent = `≈ ${fmt.format(Math.round(p.deliveredOrders))} delivered after returns`;
    $("#k-stock").textContent = `${fmt.format(p.stock)} items`;
    $("#k-creatives").textContent = p.creatives;
    $("#k-creatives-s").textContent = "8 to test + 2 fresh every 3 days";
    $("#k-daily").textContent = tk(p.budget / p.totalDays);
    $("#k-daily-s").textContent = `over ${p.totalDays} days · peak ${tk(p.peakDaily)}/day`;
    if (s.saleDay || s.out === 0) { $("#k-cut").textContent = "Sale day"; $("#k-cut-s").textContent = "Orders ship after the sale"; }
    else { $("#k-cut").textContent = dshort(p.outCut); $("#k-cut-s").textContent = `Inside Dhaka: ${dshort(p.inCut)}`; }

    const tips = [[s.tip]];
    if (p.late) tips.push([`You're <b>${diffDays(p.ideal, today)} days behind</b> the ideal start. The test phase is shorter, so start with your best-performing past ads.`]);
    if (p.budget / p.totalDays > 0 && st.goal > 0) tips.push([`Plan for prices to rise: ad costs usually go up in the final week as more brands compete. Keep 10–15% extra budget aside.`]);
    $("#p-insights").innerHTML = tips.slice(0, 3).map(([t]) => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/></svg><span>${t}</span></li>`).join("");

    // timeline
    const max = Math.max(...p.days.map((x) => x.spend)) || 1;
    $("#tl-sub").textContent = `${dshort(p.start)} → ${dshort(p.days[p.days.length - 1].d)} · ${p.totalDays} days of ads`;
    $("#timeline").innerHTML = p.days.map((x) => `<i class="ph-${x.phase}${diffDays(x.d, p.D) === 0 ? " day" : ""}" style="--h:${(x.spend / max) * 100}%" title="${dfmt(x.d)}: ${tk(x.spend)} (${PHASES[x.phase]})"></i>`).join("");
    $("#timeline").setAttribute("aria-label", `Daily budget from ${dshort(p.start)} to ${dshort(p.days[p.days.length - 1].d)}, rising from ${tk(p.days[0].spend)} to a peak of ${tk(p.peakDaily)} per day.`);
    const marks = [0, Math.floor((p.days.length - 1) / 2), p.days.length - 1].filter((v, i, a) => a.indexOf(v) === i);
    $("#tl-axis").innerHTML = marks.map((i) => `<span style="left:${(i / Math.max(1, p.days.length - 1)) * 100}%">${dshort(p.days[i].d)}</span>`).join("");
    const phasesUsed = [...new Set(p.days.map((x) => x.phase))];
    $("#phase-legend").innerHTML = phasesUsed.map((ph) => { const ds = p.days.filter((x) => x.phase === ph); return `<li><i class="ph-${ph}"></i>${PHASES[ph]} <b>${tk(ds.reduce((a, x) => a + x.spend, 0))}</b></li>`; }).join("");

    // checklist
    $("#checklist").innerHTML = p.steps.map((x) => {
      const dd = diffDays(today, x.d);
      const state = dd < 0 ? "past" : dd === 0 ? "now" : "";
      const when = dd < 0 ? (x.key === "day" || x.key === "after" ? "" : "Do it now (date passed)") : dd === 0 ? "Today" : `in ${dd} day${dd === 1 ? "" : "s"}`;
      return `<li class="${state}${x.key === "day" ? " big" : ""}"><time datetime="${iso(x.d)}"><b>${dshort(x.d)}</b><small>${when}</small></time><div><h3>${x.title}</h3><p>${x.text}</p></div></li>`;
    }).join("");
    $("#pcta-text").textContent = `Agencies get booked weeks before ${p.name}. Send us this plan and we'll tell you, free, how we'd run it, and if we have a slot.`;
  }

  /* ---------- calendar file (.ics): every step lands in the phone calendar ---------- */
  $("#dl-ics").addEventListener("click", () => {
    const p = plan(); if (!p.D) return;
    const esc = (t) => String(t).replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const ymd = (d) => iso(d).replace(/-/g, "");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Greyrock Digital//Season Planner//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    p.steps.filter((x) => x.d >= today).forEach((x, i) => {
      lines.push("BEGIN:VEVENT", `UID:${ymd(x.d)}-${x.key}-${i}@greyrock-season-planner`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(x.d)}`, `DTEND;VALUE=DATE:${ymd(addDays(x.d, 1))}`,
        `SUMMARY:${esc(`${p.name}: ${x.title}`)}`, `DESCRIPTION:${esc(`${x.text}\n\nPlanned with the free Greyrock season planner: ${location.origin}/tools/season-planner/`)}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(x.title)}`, "TRIGGER:-PT15H", "END:VALARM", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    saveFile(`${p.name.replace(/[^\w-]+/g, "-").toLowerCase()}-plan.ics`, new Blob([lines.join("\r\n")], { type: "text/calendar" }));
    T.track("ics_download", { tool: "season-planner", season: p.s.id }, { section: "planner" });
  });
  function saveFile(name, blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ---------- share link ---------- */
  $("#copy-link").addEventListener("click", async () => {
    const u = new URL(location.origin + location.pathname);
    u.searchParams.set("season", seasonId);
    Object.keys(DEF).forEach((k) => u.searchParams.set(k, st[k]));
    if (seasonId === "custom") { if (customName) u.searchParams.set("cname", customName); if (customDate) u.searchParams.set("cdate", iso(customDate)); }
    const label = $("#copy-link span");
    try { await navigator.clipboard.writeText(u.toString()); label.textContent = "Link copied ✓"; } catch { label.textContent = "Couldn't copy"; }
    setTimeout(() => (label.textContent = "Copy link"), 2200);
    T.track("share_link", { tool: "season-planner" }, { section: "planner" });
  });

  /* ---------- plan image (1080×1350) ---------- */
  $("#dl-plan").addEventListener("click", async () => {
    const p = plan(); if (!p.D) return;
    const css = getComputedStyle(document.documentElement);
    const c = (n) => css.getPropertyValue(n).trim() || "#888";
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    try { await document.fonts.ready; } catch { /* ignore */ }
    const font = (w, s) => `${w} ${s}px "Bricolage Grotesque", "Noto Sans Bengali", system-ui, sans-serif`;
    g.fillStyle = c("--bg-elev"); g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W * 0.85, 100, 20, W * 0.85, 100, 640); glow.addColorStop(0, c("--glow-1")); glow.addColorStop(1, "transparent");
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    const grad = g.createLinearGradient(80, 0, W - 80, 0); grad.addColorStop(0, c("--a1")); grad.addColorStop(1, c("--a2"));
    await new Promise((res) => { const img = new Image(); img.onload = () => { const w = 230, h = (img.height / img.width) * w, off = document.createElement("canvas"); off.width = w; off.height = h; const o = off.getContext("2d"); o.drawImage(img, 0, 0, w, h); o.globalCompositeOperation = "source-in"; o.fillStyle = c("--text"); o.fillRect(0, 0, w, h); g.drawImage(off, 80, 84); res(); }; img.onerror = res; img.src = "/assets/img/wm-greyrock.png"; });
    g.textAlign = "right"; g.fillStyle = c("--text-muted"); g.font = font(600, 26); g.fillText("SEASON PLAN", W - 80, 120); g.textAlign = "left";
    g.fillStyle = c("--text"); g.font = font(800, 76); g.fillText(p.name, 76, 260);
    g.fillStyle = grad; g.font = font(700, 32); g.fillText(`${dfmt(p.D)} · in ${diffDays(today, p.D)} days`, 80, 315);
    const tiles = [["Ad budget", tk(p.budget)], ["Sales goal (delivered)", tk(st.goal)], ["Orders to aim for", fmt.format(Math.ceil(p.orders))], ["Stock ready", `${fmt.format(p.stock)} items`], ["Start ads", p.late ? "Today" : dshort(p.start)], ["Creatives to make", String(p.creatives)]];
    tiles.forEach(([l, v], i) => { const tx = 80 + (i % 2) * 470, ty = 370 + Math.floor(i / 2) * 140; g.fillStyle = c("--surface-2"); rr(g, tx, ty, 450, 120, 20); g.fill(); g.fillStyle = c("--text-muted"); g.font = font(500, 24); g.fillText(l, tx + 26, ty + 44); g.fillStyle = c("--text"); g.font = font(750, 40); g.fillText(v, tx + 26, ty + 96); });
    // budget bars
    const by = 830, bh = 150, bw = (W - 160) / p.days.length, mx = Math.max(...p.days.map((x) => x.spend)) || 1;
    const col = { test: c("--a3"), teaser: c("--a3"), scale: c("--a2"), peak: c("--a1"), final: c("--text-dim") };
    g.fillStyle = c("--text-muted"); g.font = font(500, 24); g.fillText("Daily ad budget", 80, by - 18);
    p.days.forEach((x, i) => { const h = Math.max(4, (x.spend / mx) * bh); g.fillStyle = col[x.phase]; rr(g, 80 + i * bw + 1, by + bh - h, Math.max(2, bw - 3), h, Math.min(6, bw / 3)); g.fill(); });
    // key dates
    g.fillStyle = c("--text-muted"); g.font = font(500, 24); g.fillText("Key dates", 80, 1060);
    p.steps.filter((x) => x.d >= today).slice(0, 5).forEach((x, i) => { const y = 1100 + i * 40; g.fillStyle = c("--text"); g.font = font(700, 25); g.fillText(dshort(x.d), 80, y); g.fillStyle = c("--text-muted"); g.font = font(500, 25); g.fillText(x.title.slice(0, 52), 230, y); });
    g.fillStyle = c("--text-dim"); g.font = font(500, 23); g.fillText(`Free season planner by Greyrock Digital · ${location.host}/tools/season-planner`, 80, H - 50);
    cv.toBlob((b) => b && saveFile(`${p.name.replace(/[^\w-]+/g, "-").toLowerCase()}-plan.png`, b), "image/png");
    T.track("report_download", { tool: "season-planner", season: p.s.id }, { section: "planner" });
  });
  function rr(g, x0, y0, w, h, r) { g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, r); g.arcTo(x0 + w, y0 + h, x0, y0 + h, r); g.arcTo(x0, y0 + h, x0, y0, r); g.arcTo(x0, y0, x0 + w, y0, r); g.closePath(); }

  /* ---------- lead with the plan attached ---------- */
  T.setLeadExtra(() => {
    const p = plan();
    return { plan: { tool: "season-planner", season: p.name, date: p.D ? iso(p.D) : "", goal: st.goal, budget: Math.round(p.budget || 0), orders: Math.ceil(p.orders || 0), stock: p.stock || 0, start: p.start ? iso(p.start) : "", aov: st.aov, roas: st.roas, ret: st.ret, late: !!p.late } };
  });
  $("#plan-cta").addEventListener("click", () => T.openLead("tool:season-planner", {}));

  paintSeasons();
  render();
})();
