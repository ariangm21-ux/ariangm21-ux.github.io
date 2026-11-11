/* Greyrock Digital: landing page sections (below the hero) */
(() => {
  "use strict";

  /* ---------------------------------------------------------
     CONTENT comes from the admin panel (defaults.js + published data).
     Items with placeholder:true show a "Sample" tag until replaced with real data.
     --------------------------------------------------------- */
  const CFG = window.GR_CFG || window.GR_MERGE();
  const CONTENT = CFG.content;
  const SETTINGS = CFG.settings;
  const INDUSTRY_LABELS = Object.fromEntries((CONTENT.industries || []).map((i) => [i.id, i.label]));

  /* ---------------------------------------------------------
     helpers
     --------------------------------------------------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const isMobile = () => matchMedia("(max-width: 760px)").matches;
  const GR = window.GR || {};
  const taka = (s) => String(s).replace(/৳/g, '<span class="tk">৳</span>');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* blocked */ } },
  };
  const sess = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* blocked */ } },
  };
  const ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    dash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    ticks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m2 13 4 4L15 8M9 15l2 2 9-9"/></svg>',
  };
  const SAMPLE = '<span class="sample" title="Placeholder content: replace before launch">Sample</span>';

  function tween(el, to, { dur = 900, format = (v) => fmt.format(Math.round(v)) } = {}) {
    const from = parseFloat(el.dataset.v || 0);
    el.dataset.v = to;
    if (reduceMotion) { el.textContent = format(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = format(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // shared gradients for section SVGs
  document.body.insertAdjacentHTML("afterbegin", `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gr-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--a1)"/><stop offset="1" style="stop-color:var(--a2)"/></linearGradient>
        <linearGradient id="gr-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--a2);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--a2);stop-opacity:0"/></linearGradient>
      </defs>
    </svg>`);

  /* ---------------------------------------------------------
     Scroll reveal + spotlight cards
     --------------------------------------------------------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); } });
  }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
  const observeReveal = (root = document) => $$(".sr:not(.in)", root).forEach((el) => revealIO.observe(el));

  if (finePointer) {
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".spot");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--sx", `${e.clientX - r.left}px`);
      card.style.setProperty("--sy", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  // seamless channels marquee: the track needs two copies to loop without a gap
  const mTrack = $(".marquee-track");
  if (mTrack && !mTrack.dataset.cloned) { mTrack.innerHTML += mTrack.innerHTML; mTrack.dataset.cloned = "1"; }

  // run a callback while an element is on screen
  function whileVisible(el, onChange, threshold = .2) {
    new IntersectionObserver((entries) => onChange(entries[0].isIntersecting), { threshold }).observe(el);
  }

  /* ---------------------------------------------------------
     1. Money-leak funnel
     --------------------------------------------------------- */
  const FUNNEL = {
    boost: {
      stages: [["People reached", 400000], ["Engaged / messaged", 6000], ["Real conversations", 900], ["Orders placed", 120], ["Orders delivered", 78]],
      why: ["scroll straight past", "ghost \"price?\" messages", "never hear back in time", "COD parcels returned"],
      aov: 1600,
    },
    greyrock: {
      stages: [["People reached", 320000], ["Clicked to buy", 9600], ["Product page / chat", 3800], ["Orders placed", 360], ["Orders delivered", 313]],
      why: ["filtered by buyer targeting", "retargeted, not lost", "auto follow-ups on WhatsApp", "verified orders, fewer returns"],
      aov: 1600,
    },
  };
  const funnel = $("#funnel");
  const leakRev = $("#leak-rev");
  const leakRoas = $("#leak-roas");
  const segBtns = $$(".seg button");
  const SPEND = 100000;
  const width = (v) => clamp(100 * (Math.log10(v) - 1) / (Math.log10(400000) - 1), 4, 100);

  funnel.innerHTML = FUNNEL.boost.stages.map((_, i) => `
    <li class="fstage"><span class="fname"></span><span class="fbar"><i></i></span><span class="fval">0</span></li>
    ${i < 4 ? `<li class="fstage fleak-row"><span class="fleak">${ICON.down}<span></span></span></li>` : ""}`).join("");

  function setFunnel(mode) {
    const data = FUNNEL[mode];
    funnel.dataset.mode = mode;
    segBtns.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
    const rows = $$(".fstage:not(.fleak-row)", funnel);
    const leaks = $$(".fleak span", funnel);
    data.stages.forEach(([name, v], i) => {
      $(".fname", rows[i]).textContent = name;
      $(".fbar i", rows[i]).style.setProperty("--w", `${width(v)}%`);
      tween($(".fval", rows[i]), v);
      if (i < 4) {
        const next = data.stages[i + 1][1];
        leaks[i].textContent = `−${Math.round((1 - next / v) * 100)}% ${data.why[i]}`;
      }
    });
    const revenue = data.stages[4][1] * data.aov;
    tween(leakRev, revenue);
    leakRoas.textContent = `${(revenue / SPEND).toFixed(1)}x ROAS`;
    leakRoas.classList.toggle("good", mode === "greyrock");
  }
  let funnelTouched = false;
  segBtns.forEach((b) => b.addEventListener("click", () => { funnelTouched = true; setFunnel(b.dataset.mode); }));
  // arrow keys between the two tabs
  $(".seg").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = segBtns.find((b) => b.getAttribute("aria-selected") !== "true");
    next.focus(); next.click();
  });

  new IntersectionObserver((entries, io) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    setFunnel("boost");
    // after a beat, show the fix, unless the visitor already took over
    setTimeout(() => { if (!funnelTouched) setFunnel("greyrock"); }, 3200);
  }, { threshold: .45 }).observe(funnel);

  /* ---------------------------------------------------------
     2. Services: typed search, event log
     --------------------------------------------------------- */
  const typed = $(".typed");
  if (typed) {
    const phrases = typed.dataset.phrases.split("|");
    if (reduceMotion) typed.textContent = phrases[0];
    else {
      let p = 0, i = 0, del = false, timer = 0, running = false;
      const tick = () => {
        const word = phrases[p];
        i += del ? -1 : 1;
        typed.textContent = word.slice(0, i);
        let wait = del ? 28 : 55 + Math.random() * 40;
        if (!del && i === word.length) { del = true; wait = 1700; }
        else if (del && i === 0) { del = false; p = (p + 1) % phrases.length; wait = 400; }
        timer = setTimeout(tick, wait);
      };
      whileVisible(typed, (v) => {
        if (v && !running) { running = true; tick(); }
        else if (!v && running) { running = false; clearTimeout(timer); }
      });
    }
  }

  const log = $("#event-log");
  const EVENTS = [["Purchase", "৳2,450", 1], ["AddToCart", "৳1,850", 0], ["InitiateCheckout", "৳3,200", 1], ["Purchase", "৳980", 1], ["Lead", "", 1], ["ViewContent", "", 0], ["Purchase", "৳4,600", 1]];
  let evI = 0;
  const evLine = (enter) => {
    const [name, val, srv] = EVENTS[evI++ % EVENTS.length];
    const li = document.createElement("li");
    if (enter && !reduceMotion) li.className = "enter";
    li.innerHTML = `${ICON.check}<b>${name}</b><span>${taka(val)}</span><em class="${srv ? "srv" : ""}">${srv ? "server" : "browser"}</em>`;
    return li;
  };
  for (let k = 0; k < 6; k++) log.appendChild(evLine(false));
  let evTimer = 0;
  whileVisible(log, (v) => {
    clearInterval(evTimer);
    if (v && !reduceMotion) evTimer = setInterval(() => { log.prepend(evLine(true)); if (log.children.length > 7) log.lastElementChild.remove(); }, 1700);
  });

  /* ---------------------------------------------------------
     3. Case studies
     --------------------------------------------------------- */
  const caseFilter = $("#case-filter");
  const casesEl = $("#cases");
  const usedInd = [...new Set(CONTENT.cases.map((c) => c.ind))];
  caseFilter.innerHTML = [["all", "All"], ...usedInd.map((k) => [k, esc(INDUSTRY_LABELS[k] || k)])]
    .map(([k, l], i) => `<button class="fchip" data-f="${k}" aria-pressed="${i === 0}">${l}</button>`).join("");

  const nums = (a) => (Array.isArray(a) ? a : []).map(Number).filter((n) => !isNaN(n));
  const spark = (s) => {
    const max = Math.max(...s), min = Math.min(...s);
    const pts = s.map((v, i) => [(i / (s.length - 1)) * 200, 52 - ((v - min) / (max - min || 1)) * 46]);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    return `<svg class="case-spark" viewBox="0 0 200 56" preserveAspectRatio="none" aria-hidden="true"><path class="fill" d="${d} L200,56 L0,56 Z"/><path d="${d}"/></svg>`;
  };

  function renderCases(filter = "all") {
    const list = CONTENT.cases.filter((c) => filter === "all" || c.ind === filter);
    casesEl.innerHTML = list.map((c, i) => `
      <article class="case card spot enter" style="--d:${i * 70}ms">
        <div class="case-top"><span class="tile-tag">${esc(INDUSTRY_LABELS[c.ind] || c.ind || "")}</span>${c.placeholder ? SAMPLE : `<span class="case-time">${c.days} days</span>`}</div>
        <h3>${esc(c.brand)}</h3>
        <div class="case-big"><b class="grad-text">${esc(c.big)}</b><span>${esc(c.bigLabel)}</span></div>
        ${spark(nums(c.series).length > 1 ? nums(c.series) : [1, 2])}
        <div class="case-rows">${(c.rows || []).map((r) => `<div><span>${esc(r.label)}</span><b>${taka(esc(r.before))} <i>→</i> ${taka(esc(r.after))}</b></div>`).join("")}</div>
        ${c.placeholder ? `<span class="case-time">${c.days} days</span>` : ""}
      </article>`).join("");
    // phone: the cards become a swipe row; dots show where you are (hidden on desktop by CSS)
    let dots = $("#case-dots");
    if (!dots) { dots = document.createElement("div"); dots.id = "case-dots"; dots.className = "swipe-dots"; dots.setAttribute("aria-hidden", "true"); casesEl.after(dots); }
    dots.innerHTML = list.length > 1 ? list.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("") : "";
    casesEl.scrollLeft = 0;
  }
  casesEl.addEventListener("scroll", () => {
    const cards = casesEl.children; if (!cards.length) return;
    const step = cards[0].getBoundingClientRect().width + 12;
    const i = Math.round(casesEl.scrollLeft / Math.max(1, step));
    $$("#case-dots i").forEach((d, k) => d.classList.toggle("on", k === Math.min(i, cards.length - 1)));
  }, { passive: true });
  caseFilter.addEventListener("click", (e) => {
    const b = e.target.closest(".fchip");
    if (!b) return;
    $$(".fchip", caseFilter).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderCases(b.dataset.f);
  });
  renderCases();

  /* ---------------------------------------------------------
     4. Process: nodes sit on the curve, curve draws with scroll
     --------------------------------------------------------- */
  const processEl = $("#process-track");
  const curveSvg = $(".process-curve", processEl);
  const curveFg = $(".curve-fg", processEl);
  const steps = $$(".step", processEl);
  curveFg.setAttribute("pathLength", "1");
  curveFg.style.strokeDasharray = "1";
  curveFg.style.strokeDashoffset = "1";
  let stepFracs = [];

  function yOnCurve(xv) {
    // binary search along the path for the point with this x (path is monotonic in x)
    const len = curveFg.getTotalLength();
    let lo = 0, hi = len;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      if (curveFg.getPointAtLength(mid).x < xv) lo = mid; else hi = mid;
    }
    return curveFg.getPointAtLength(lo).y;
  }
  function layoutProcess() {
    if (getComputedStyle(curveSvg).display === "none") { steps.forEach((s) => s.style.removeProperty("--nt")); stepFracs = steps.map((_, i) => (i + .5) / steps.length); return; }
    const pr = processEl.getBoundingClientRect();
    const sw = curveSvg.getBoundingClientRect();
    stepFracs = steps.map((s) => {
      const sr = s.getBoundingClientRect();
      const xpx = sr.left - sw.left + 31;               // node sits at the card's dotted line
      const yv = yOnCurve((xpx / sw.width) * 1200);
      const ypx = (yv / 300) * sw.height + (sw.top - pr.top);
      s.style.setProperty("--nt", `${ypx - (sr.top - pr.top)}px`);
      return xpx / sw.width;
    });
  }
  function progressProcess() {
    const r = processEl.getBoundingClientRect();
    const p = clamp((innerHeight * .8 - r.top) / (r.height * .85), 0, 1);
    curveFg.style.strokeDashoffset = String(1 - p);
    steps.forEach((s, i) => s.classList.toggle("lit", p >= (stepFracs[i] ?? 1) - .02));
  }
  layoutProcess();
  progressProcess();
  addEventListener("resize", () => { layoutProcess(); progressProcess(); });
  addEventListener("scroll", progressProcess, { passive: true });
  if (document.fonts) document.fonts.ready.then(() => { layoutProcess(); progressProcess(); });

  /* ---------------------------------------------------------
     5. Ad account grader
     --------------------------------------------------------- */
  const QUIZ = [
    { q: "How do you mostly run your ads?", o: [["The \"Boost post\" button", 0], ["Ads Manager campaigns", 10], ["Ads Manager with structured A/B tests", 17]],
      fix: ["Stop boosting.", "Run sales or conversion campaigns in Ads Manager so Meta optimises for buyers, not likes."] },
    { q: "Are your Meta Pixel and Conversions API set up?", o: [["No / not sure", 0], ["Pixel only", 8], ["Pixel + Conversions API", 17]],
      fix: ["Set up Pixel + Conversions API.", "Server-side tracking lets Meta learn from real purchases, even with iPhone tracking limits."] },
    { q: "How often do you launch new ad creatives?", o: [["Rarely, same ads for months", 0], ["About once a month", 8], ["Every week", 17]],
      fix: ["Ship new creatives weekly.", "Fresh hooks are now your biggest targeting lever; tired ads get pricier every week."] },
    { q: "Do you track delivered orders and COD returns against ad spend?", o: [["No", 0], ["Roughly, in a spreadsheet", 8], ["Yes, per campaign", 17]],
      fix: ["Measure ROAS on delivered orders.", "Placed orders lie. Track returns per campaign and cut the ads that bring fake or flaky buyers."] },
    { q: "Where do people go after clicking your ad?", o: [["Only to the page inbox", 5], ["A website or landing page", 12], ["Both, depending on the product", 16]],
      fix: ["Give high-intent buyers a fast checkout.", "A simple landing page with clear price and COD info converts far better than \"inbox for price\"."] },
    { q: "Do you know your break-even cost per order?", o: [["No", 0], ["Rough idea", 8], ["Yes, exactly", 16]],
      fix: ["Work out your break-even cost per order.", "Without it you can't tell a winning ad from a losing one, or how far you can scale."] },
  ];
  const MAX_PTS = QUIZ.reduce((s, x) => s + Math.max(...x.o.map((o) => o[1])), 0);
  const quizBody = $("#quiz-body");
  const quizStep = $("#quiz-step");
  const quizBar = $("#quiz-bar");
  const answers = [];
  let qi = 0, quizStarted = false;

  function swapQuiz(html) {
    quizBody.classList.remove("swap");
    void quizBody.offsetWidth;
    quizBody.innerHTML = html;
    quizBody.classList.add("swap");
  }
  function renderQ(focus) {
    const item = QUIZ[qi];
    quizStep.textContent = `Question ${qi + 1} of ${QUIZ.length}`;
    quizBar.style.setProperty("--p", `${(qi / QUIZ.length) * 100}%`);
    swapQuiz(`
      <h3 class="quiz-q" tabindex="-1">${item.q}</h3>
      <div class="opts">${item.o.map(([label], k) => `<button class="opt${answers[qi] === k ? " picked" : ""}" data-k="${k}"><kbd>${"ABC"[k]}</kbd>${label}</button>`).join("")}</div>
      ${qi > 0 ? `<button class="quiz-back" data-back>← Back</button>` : ""}`);
    if (focus) $(".quiz-q", quizBody).focus({ preventScroll: true });
  }
  function renderResult() {
    const pts = answers.reduce((s, k, i) => s + QUIZ[i].o[k][1], 0);
    const score = Math.round((pts / MAX_PTS) * 100);
    const grade = score < 40 ? ["bad", "Leaking money"] : score < 70 ? ["mid", "Room to grow"] : ["good", "Ready to scale"];
    const headline = score < 40 ? "Your ads are probably costing more than they make." : score < 70 ? "Good base, but money is slipping through." : "Strong setup. Time to pour fuel on it.";
    const fixes = QUIZ.map((x, i) => ({ gap: Math.max(...x.o.map((o) => o[1])) - x.o[answers[i]][1], fix: x.fix }))
      .filter((f) => f.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3);
    quizStep.textContent = "Your result";
    quizBar.style.setProperty("--p", "100%");
    swapQuiz(`
      <div class="result">
        <div class="ring" role="img" aria-label="Score ${score} out of 100">
          <svg viewBox="0 0 120 120"><circle class="r-bg" cx="60" cy="60" r="52"/><circle class="r-fg" cx="60" cy="60" r="52" pathLength="1"/></svg>
          <div class="ring-num"><b id="score-num">0</b><span>out of 100</span></div>
        </div>
        <div>
          <span class="grade ${grade[0]}">${grade[1]}</span>
          <h3 class="quiz-q" tabindex="-1" style="margin:10px 0 0">${headline}</h3>
        </div>
      </div>
      ${fixes.length ? `<ol class="fixes">${fixes.map((f) => `<li><span><b>${f.fix[0]}</b> ${f.fix[1]}</span></li>`).join("")}</ol>`
        : `<ol class="fixes"><li><span><b>You're doing the fundamentals right.</b> The next lever is creative volume and scaling structure. Let's talk.</span></li></ol>`}
      <button class="btn btn-primary btn-block" data-quiz-cta>Send me the full report on WhatsApp
        <svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      <button class="retake" data-retake>Retake the quiz</button>`);
    requestAnimationFrame(() => requestAnimationFrame(() => { $(".r-fg", quizBody).style.strokeDashoffset = String(1 - score / 100); }));
    tween($("#score-num"), score, { dur: 1600 });
    $(".quiz-q", quizBody).focus({ preventScroll: true });
    quizBody.dataset.score = score;
    GR.grader = { score, answers: QUIZ.map((x, i) => ({ q: x.q, a: x.o[answers[i]][0] })) };
    if (GR.track) GR.track("grader_complete", { score, grade: grade[1] }, { section: "grader", metaParams: { content_name: "Ad account grader", score } });
  }
  quizBody.addEventListener("click", (e) => {
    const opt = e.target.closest(".opt");
    if (opt) {
      answers[qi] = +opt.dataset.k;
      if (GR.track) {
        if (!quizStarted) { quizStarted = true; GR.track("grader_start", {}, { section: "grader" }); }
        GR.track("grader_answer", { q: qi + 1, answer: QUIZ[qi].o[answers[qi]][0], points: QUIZ[qi].o[answers[qi]][1] }, { section: "grader" });
      }
      opt.classList.add("picked");
      setTimeout(() => { qi++; qi < QUIZ.length ? renderQ(true) : renderResult(); }, 260);
      return;
    }
    if (e.target.closest("[data-back]")) { qi = Math.max(0, qi - 1); renderQ(true); return; }
    if (e.target.closest("[data-retake]")) { answers.length = 0; qi = 0; quizStarted = false; renderQ(true); return; }
    if (e.target.closest("[data-quiz-cta]") && GR.openLead) GR.openLead(`grader (score ${quizBody.dataset.score}/100)`);
  });
  // A / B / C keyboard shortcuts while the quiz is in view
  let quizInView = false;
  whileVisible($("#quiz"), (v) => (quizInView = v), .5);
  document.addEventListener("keydown", (e) => {
    if (!quizInView || e.metaKey || e.ctrlKey || e.altKey || /input|select|textarea/i.test(document.activeElement.tagName) || (GR.modal && GR.modal.open)) return;
    const k = "abc".indexOf(e.key.toLowerCase());
    const opt = k > -1 && $$(".opt", quizBody)[k];
    if (opt) opt.click();
  });
  renderQ(false);

  /* ---------------------------------------------------------
     6. Comparison table
     --------------------------------------------------------- */
  const cellIcon = { yes: ICON.check, no: ICON.x, meh: ICON.dash };
  $("#compare-body").innerHTML = CONTENT.compare.map((r) => {
    const cols = [[r.diy, r.diyS], [r.agency, r.agencyS], [r.us, r.usS]];
    return `<tr><th scope="row">${esc(r.label)}</th>${cols.map(([t, s], i) => `<td${i === 2 ? ' class="us"' : ""}><span class="cell ${cellIcon[s] ? s : "meh"}">${cellIcon[s] || cellIcon.meh}${esc(t || "")}</span></td>`).join("")}</tr>`;
  }).join("");

  /* ---------------------------------------------------------
     7. WhatsApp testimonials
     --------------------------------------------------------- */
  const chatCard = (c) => `
    <article class="chat card">
      <div class="chat-head"><span class="chat-av" aria-hidden="true">${esc((c.name || "?")[0])}</span><div><b>${esc(c.name)}</b><span>${esc(c.role)}</span></div>${c.placeholder ? SAMPLE : ""}</div>
      <div class="chat-body">${(c.msgs || []).map((m, i) => `<p class="msg${m.us ? " me" : ""}">${esc(m.text)}<small>${["10:42", "10:43", "10:45"][i] || "10:46"} pm${m.us ? ICON.ticks : ""}</small></p>`).join("")}</div>
    </article>`;
  const half = Math.ceil(CONTENT.chats.length / 2);
  const rows = [CONTENT.chats.slice(0, half), CONTENT.chats.slice(half)];
  // second copy of each row is decorative (for the seamless loop) and hidden from screen readers
  $("#chats").innerHTML = rows.map((r, i) => `
    <div class="chat-row${i ? " rev" : ""}">${r.map(chatCard).join("")}<div style="display:contents" aria-hidden="true">${r.map(chatCard).join("")}</div></div>`).join("");

  /* ---------------------------------------------------------
     8. Pricing
     --------------------------------------------------------- */
  const SPOTS = window.GR_SLOTS(SETTINGS, CONTENT.plans);   // one source of truth for every "spots left" number
  $("#plans").innerHTML = CONTENT.plans.map((p, i) => { const sp = SPOTS.plans[i] || { left: 0, total: 0, hidden: true }; return `
    <article class="plan card sr${p.popular ? " pop" : ""}" style="--d:${i * 90}ms">
      ${p.popular ? '<span class="pop-badge">Most popular</span>' : ""}
      <h3 class="plan-name">${esc(p.name)}${p.placeholder ? SAMPLE : ""}</h3>
      <p class="plan-for">${esc(p.for)}</p>
      <p class="plan-price"><b>${taka(esc(p.price))}</b><span>${esc(p.per || "")}</span></p>
      <p class="plan-note">${taka(esc(p.note || ""))}</p>
      ${!sp.hidden && sp.total > 0 ? `<p class="plan-slots"><span class="dots-row" aria-hidden="true">${Array.from({ length: Math.min(sp.total, 12) }, (_, k) => `<i class="${k < sp.left ? "free" : ""}"></i>`).join("")}</span><span>${sp.left ? `<b>${sp.left} of ${sp.total}</b> slot${sp.total === 1 ? "" : "s"} open this month` : "<b>Full this month</b>: join the waitlist"}</span></p>` : ""}
      <ul>${(p.features || []).map((f, k) => `<li${k >= 4 ? ' class="feat-extra"' : ""}>${ICON.check}<span>${taka(esc(f))}</span></li>`).join("")}</ul>
      ${(p.features || []).length > 4 ? `<button type="button" class="feat-more" aria-expanded="false">See all ${(p.features || []).length} features</button>` : ""}
      <button class="btn ${p.popular ? "btn-primary" : "btn-ghost"} btn-block js-open-lead" data-source="pricing-${esc(String(p.name).toLowerCase())}">${esc(p.cta || "Get started")}
        <svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
    </article>`; }).join("");
  // phone: one plan at a time behind tabs (opens on the most popular); desktop ignores all of this via CSS
  (() => {
    const plansEl = $("#plans"), cards = $$(".plan", plansEl);
    if (cards.length < 2) return;
    const start = Math.max(0, CONTENT.plans.findIndex((p) => p.popular));
    const tabs = document.createElement("div");
    tabs.className = "plan-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Choose a plan");
    tabs.innerHTML = CONTENT.plans.map((p, i) => `<button type="button" role="tab" aria-selected="${i === start}" data-plan-tab="${i}">${esc(p.name)}</button>`).join("");
    plansEl.before(tabs);
    const show = (i) => {
      cards.forEach((c, k) => c.classList.toggle("tab-on", k === i));
      $$("[data-plan-tab]", tabs).forEach((b) => b.setAttribute("aria-selected", String(+b.dataset.planTab === i)));
    };
    show(start);
    tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-plan-tab]"); if (b) { show(+b.dataset.planTab); if (GR.track) GR.track("plan_tab", { plan: CONTENT.plans[+b.dataset.planTab].name }, { section: "pricing" }); } });
    plansEl.addEventListener("click", (e) => {
      const m = e.target.closest(".feat-more"); if (!m) return;
      const plan = m.closest(".plan"), open = !plan.classList.contains("feats-open");
      plan.classList.toggle("feats-open", open); m.setAttribute("aria-expanded", String(open));
      m.textContent = open ? "Show fewer" : `See all ${$$("li", plan).length} features`;
    });
  })();

  /* ---------------------------------------------------------
     9. FAQ (+ structured data for Google)
     --------------------------------------------------------- */
  $("#faq-list").innerHTML = CONTENT.faqs.map((f, i) => `
    <details class="qa"${i === 0 ? " open" : ""}>
      <summary>${esc(f.q)}<span class="qa-ic" aria-hidden="true"></span></summary>
      <div class="qa-a"><p>${taka(esc(f.a))}</p></div>
    </details>`).join("");
  // phone: show the first 5 questions, the rest behind a button (all stay in the page for Google)
  if (CONTENT.faqs.length > 5) {
    const more = document.createElement("button");
    more.type = "button"; more.className = "faq-more btn btn-ghost btn-block";
    more.textContent = `More questions (${CONTENT.faqs.length - 5})`;
    $("#faq-list").after(more);
    more.addEventListener("click", () => { $("#faq-list").classList.add("faq-all"); more.remove(); });
  }
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: CONTENT.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  });
  document.head.appendChild(ld);

  /* ---------------------------------------------------------
     10. Final CTA slots + footer
     --------------------------------------------------------- */
  const SLOTS = { left: SPOTS.left, total: Math.min(30, SPOTS.total) };   // the sum of the plans: matches the pricing cards
  const month = new Date().toLocaleString("en-US", { month: "long" });
  $("#slots-line").textContent = SLOTS.left ? `${SLOTS.left} onboarding slot${SLOTS.left === 1 ? "" : "s"} left for ${month}` : `Fully booked for ${month}: join the waitlist`;
  $("#slots").innerHTML = Array.from({ length: SLOTS.total }, (_, k) =>
    `<i class="${k >= SLOTS.total - SLOTS.left ? "free" : ""}" style="--k:${k}"></i>`).join("");
  const heroSlots = $('[data-content="slots"]');
  if (heroSlots) heroSlots.textContent = `${SLOTS.left} new brand${SLOTS.left === 1 ? "" : "s"}`;
  $("#year").textContent = new Date().getFullYear();

  // contact details from the admin
  const biz = SETTINGS.business || {};
  const mail = $('[data-content="email"]');
  if (mail && biz.email) { mail.href = `mailto:${biz.email}`; mail.textContent = biz.email; }
  const addr = $(".foot-cols > div:last-child > span");
  if (addr && biz.address) addr.textContent = biz.address;
  const socialMap = { Facebook: biz.facebook, Instagram: biz.instagram, LinkedIn: biz.linkedin, TikTok: biz.tiktok };
  $$(".socials a").forEach((a) => {
    const url = socialMap[a.getAttribute("aria-label")];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
  });

  $("#news-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#news-email"), msg = $("#news-msg");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
      msg.classList.remove("ok"); msg.textContent = "Enter a valid email address."; input.focus(); return;
    }
    // TODO: connect to newsletter provider (Mailchimp / Brevo / ConvertKit)
    if (window.GRT) { window.GRT.identify({ email: input.value.trim() }).then(() => GR.track && GR.track("newsletter_signup", {}, { section: "footer", metaParams: { content_name: "Weekly ad teardown" } })); }
    input.value = "";
  });

  /* ---------------------------------------------------------
     Smart nudge (slide-in)
     Rules: not before 6s, max once per visit, 7-day snooze after dismiss,
     never after a lead is submitted, never over the open form.
     --------------------------------------------------------- */
  const nudge = $("#nudge");
  const nTitle = $("#nudge-title"), nSub = $("#nudge-sub");
  const pageStart = Date.now();
  let nudgeTrigger = "";
  const NUDGE = SETTINGS.nudge || {};
  const nudgeAllowed = () =>
    NUDGE.enabled !== false && !GR.PREVIEW &&
    Date.now() - pageStart > 6000 &&
    !store.get("gr-lead-done") &&
    +(store.get("gr-nudge-snooze") || 0) < Date.now() &&
    !sess.get("gr-nudge-shown") &&
    !(GR.modal && GR.modal.open);

  function showNudge(trigger, title, sub) {
    if (!nudgeAllowed()) return;
    nudgeTrigger = trigger;
    if (title) nTitle.innerHTML = title;
    if (sub) nSub.textContent = sub;
    sess.set("gr-nudge-shown", "1");
    nudge.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => nudge.classList.add("show")));
    if (GR.track) GR.track("nudge_show", { trigger }, { section: "nudge" });
  }
  function hideNudge() {
    nudge.classList.remove("show");
    setTimeout(() => (nudge.hidden = true), 400);
  }
  nudge.addEventListener("click", (e) => {
    if (e.target.closest("[data-nudge-close]")) { store.set("gr-nudge-snooze", String(Date.now() + 7 * 864e5)); hideNudge(); if (GR.track) GR.track("nudge_dismiss", { trigger: nudgeTrigger }, { section: "nudge" }); }
    if (e.target.closest("[data-nudge-cta]")) { hideNudge(); if (GR.track) GR.track("nudge_click", { trigger: nudgeTrigger }, { section: "nudge" }); GR.openLead && GR.openLead(`nudge:${nudgeTrigger}`); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nudge.classList.contains("show")) hideNudge(); });

  // a: exit intent (desktop)
  nSub.textContent = NUDGE.sub || nSub.textContent;
  if (finePointer && NUDGE.exit !== false) {
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget && e.clientY <= 0) showNudge("exit", esc(NUDGE.exitTitle || nTitle.textContent)); });
  }
  // b: scroll depth
  if (NUDGE.scroll !== false) {
    const depthAt = clamp(+NUDGE.scrollDepth || 55, 10, 95) / 100;
    addEventListener("scroll", () => {
      const depth = (scrollY + innerHeight) / document.documentElement.scrollHeight;
      if (depth > depthAt) showNudge("scroll", esc(NUDGE.scrollTitle || ""));
    }, { passive: true });
  }
  // c: time on page
  if (NUDGE.time !== false) setTimeout(() => showNudge("time", esc(NUDGE.timeTitle || "")), clamp(+NUDGE.timeSeconds || 45, 10, 600) * 1000);
  // d: played with the simulator but didn't ask for the plan
  const budget = $("#budget");
  let simTimer = 0;
  const onSim = () => {
    clearTimeout(simTimer);
    simTimer = setTimeout(() => {
      const rev = $("#k-revenue") ? $("#k-revenue").textContent : "";
      showNudge("simulator", `Want a real plan to hit <span class="tk">৳</span>${rev}/month?`, "We'll audit your current ads and map out the plan, free, on WhatsApp.");
    }, 9000);
  };
  if (budget && NUDGE.simulator !== false) { budget.addEventListener("input", onSim); $("#industry").addEventListener("change", onSim); }
  document.addEventListener("click", (e) => { if (e.target.closest('[data-source="simulator"]')) clearTimeout(simTimer); });

  /* ---------------------------------------------------------
     Sticky mobile CTA bar: after the hero form, hidden at the final CTA
     --------------------------------------------------------- */
  const mbar = $("#mbar");
  const capture = $("#capture-form");
  const finalCard = $(".final-card");
  let finalVisible = false;
  whileVisible(finalCard, (v) => { finalVisible = v; updateBar(); }, .1);
  function updateBar() {
    const past = capture.getBoundingClientRect().bottom < 0;
    const on = isMobile() && past && !finalVisible;
    mbar.classList.toggle("show", on);
    document.body.classList.toggle("mbar-on", on);
    mbar.setAttribute("aria-hidden", String(!on));
    $$("a, button", mbar).forEach((el) => (on ? el.removeAttribute("tabindex") : el.setAttribute("tabindex", "-1")));
  }
  addEventListener("scroll", updateBar, { passive: true });
  addEventListener("resize", updateBar);

  /* boot */
  observeReveal();
  // in-page links to sections rendered by JS still need their reveal applied
  if (location.hash) requestAnimationFrame(() => { const t = $(location.hash); t && t.scrollIntoView(); });
})();
