/* Greyrock free product: f-commerce profit calculator.
   All maths runs in the browser. Numbers only leave the page if the visitor asks for a free plan. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  const tk = (n) => `${n < 0 ? "−" : ""}৳${fmt.format(Math.abs(Math.round(n)))}`;
  const pct = (n, d = 0) => `${(n * 100).toFixed(d)}%`;
  const x = (n) => (isFinite(n) && n > 0 ? `${n.toFixed(1)}x` : "—");
  const T = window.GTOOLS || { track() {}, openLead() {}, setLeadExtra() {} };
  const ICON = {
    tip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/></svg>',
    warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
  };

  /* typical Bangladeshi f-commerce defaults (editable by the visitor) */
  const DEF = { price: 1500, cost: 650, pack: 25, orders: 300, ads: 60000, dIn: 70, dOut: 130, outPct: 45, custPays: true, codFee: 1, retPct: 20, retFee: 50, dmgPct: 10, fixed: 0, margin: 20 };
  const PRESETS = {
    default: { ...DEF },
    fashion: { ...DEF, price: 1850, cost: 800, pack: 30, orders: 350, ads: 75000, retPct: 22, dmgPct: 8, industry: "fashion" },
    beauty: { ...DEF, price: 1400, cost: 520, pack: 20, orders: 400, ads: 70000, retPct: 15, dmgPct: 15, industry: "beauty" },
    gadgets: { ...DEF, price: 4500, cost: 3100, pack: 40, orders: 160, ads: 90000, retPct: 12, dmgPct: 20, outPct: 50, industry: "electronics" },
    food: { ...DEF, price: 650, cost: 280, pack: 35, orders: 600, ads: 45000, retPct: 6, dmgPct: 100, outPct: 5, dOut: 130, industry: "food" },
  };
  const KEYS = Object.keys(DEF);
  let industry = "";

  /* state: shared link > last visit (this browser) > defaults */
  let st = { ...DEF };
  const qs = new URLSearchParams(location.search);
  const fromUrl = KEYS.some((k) => qs.has(k));
  if (fromUrl) KEYS.forEach((k) => { if (qs.has(k)) st[k] = typeof DEF[k] === "boolean" ? qs.get(k) === "1" : Math.max(0, Number(qs.get(k)) || 0); });
  else { try { const saved = JSON.parse(localStorage.getItem("gr-profit-calc") || "null"); if (saved) KEYS.forEach((k) => { if (k in saved) st[k] = saved[k]; }); } catch { /* storage blocked */ } }

  /* ---------- the maths ---------- */
  function calc(s) {
    const placed = Math.max(0, s.orders);
    const r = Math.min(Math.max(s.retPct, 0), 100) / 100;
    const ret = placed * r, del = placed - ret;
    const out = Math.min(Math.max(s.outPct, 0), 100) / 100;
    const d = s.dIn * (1 - out) + s.dOut * out;                 // average courier charge per parcel
    const f = Math.max(0, s.codFee) / 100;
    const collected = s.custPays ? del * d : 0;                  // delivery charge paid by customers (delivered orders only)
    const revenue = del * s.price;
    const cogs = del * s.cost;
    const pack = placed * s.pack;
    const ship = placed * d;                                     // every parcel ships, returned ones too
    const retFees = ret * s.retFee;
    const dmg = ret * (Math.min(Math.max(s.dmgPct, 0), 100) / 100) * s.cost;
    const fees = f * (revenue + collected);
    const ads = Math.max(0, s.ads), fixed = Math.max(0, s.fixed);
    const profit = revenue + collected - cogs - pack - ship - retFees - dmg - fees - ads - fixed;
    const cpo = placed ? ads / placed : 0;
    const beCpo = placed ? (profit + ads) / placed : 0;          // most you can pay in ads per placed order and still break even
    const returnsCost = ret * (d + s.retFee + s.pack + cpo) + dmg;
    const A = del * (1 - f) - (s.margin / 100) * del;
    const B = cogs + pack + ship + retFees + dmg + ads + fixed - collected * (1 - f);
    const per = (v) => (del ? v / del : 0);
    return {
      placed, ret, del, d, revenue, profit, margin: revenue ? profit / revenue : 0, perOrder: per(profit),
      cpo, beCpo, realRoas: ads ? revenue / ads : 0, amRoas: ads ? (placed * s.price) / ads : 0, beRoas: beCpo > 0 ? s.price / beCpo : Infinity,
      returnsCost, sugPrice: A > 0 && del > 0 ? B / A : null,
      parts: [
        ["product", "Product cost", per(cogs)], ["pack", "Packaging", per(pack)], ["delivery", "Delivery (net)", Math.max(0, per(del * d - collected))],
        ["returns", "Returns", per(ret * d + retFees + dmg)], ["fees", "COD / payment fees", per(fees)], ["ads", "Ads", per(ads)], ["other", "Other costs", per(fixed)],
      ],
    };
  }

  /* ---------- inputs ---------- */
  const inputs = $$("[data-k]");
  function paintInputs() {
    inputs.forEach((el) => {
      const k = el.dataset.k;
      if (el.type === "checkbox") el.checked = !!st[k];
      else el.value = st[k];
      if (el.type === "range") el.style.setProperty("--p", `${(el.value / el.max) * 100}%`);
    });
  }
  let used = false, changeTimer = 0, lastField = "";
  $("#calc-form").addEventListener("input", (e) => {
    const el = e.target, k = el.dataset && el.dataset.k;
    if (!k) return;
    st[k] = el.type === "checkbox" ? el.checked : Math.max(0, Number(el.value) || 0);
    if (el.type === "range") el.style.setProperty("--p", `${(el.value / el.max) * 100}%`);
    lastField = k;
    if (k === "retPct") scTouched = false;
    render();
    clearTimeout(changeTimer);
    changeTimer = setTimeout(settled, 1000);
  });
  $("#calc-form").addEventListener("change", (e) => { if (e.target.type === "checkbox") $("#calc-form").dispatchEvent(new Event("input", { bubbles: true })); });

  function settled() {
    try { localStorage.setItem("gr-profit-calc", JSON.stringify(st)); } catch { /* blocked */ }
    const r = calc(st);
    // analytics: which field changed and the result band, never the raw business numbers
    if (!used) { used = true; T.track("calculator_used", { tool: "profit-calculator" }, { section: "calculator", metaParams: { content_name: "Profit calculator" } }); }
    T.track("calculator_change", { tool: "profit-calculator", field: lastField }, { section: "calculator" });
    T.track("calculator_result", { tool: "profit-calculator", verdict: verdictOf(r)[0], returns_band: st.retPct >= 25 ? "25%+" : st.retPct >= 15 ? "15-24%" : "under 15%", margin_band: r.margin < 0 ? "loss" : r.margin < 0.1 ? "under 10%" : r.margin < 0.25 ? "10-25%" : "25%+" }, { section: "calculator" });
  }

  $$("[data-preset]").forEach((b) => b.addEventListener("click", () => {
    const p = PRESETS[b.dataset.preset];
    industry = p.industry || "";
    KEYS.forEach((k) => (st[k] = p[k]));
    scTouched = false;
    paintInputs(); render(); clearTimeout(changeTimer); lastField = `preset:${b.dataset.preset}`; settled();
  }));

  /* ---------- results ---------- */
  const verdictOf = (r) => (r.profit < 0 ? ["bad", "Losing money"] : r.margin < 0.1 ? ["mid", "Thin margin"] : ["good", "Healthy margin"]);
  let scTouched = false;
  const sc = $("#sc-ret");

  function render() {
    const r = calc(st);
    const [vClass, vText] = verdictOf(r);
    $("#r-profit").textContent = tk(r.profit);
    $("#r-profit").classList.toggle("neg", r.profit < 0);
    const v = $("#r-verdict"); v.className = `verdict ${vClass}`; v.textContent = vText;
    $("#r-sub").textContent = `${fmt.format(Math.round(r.del))} of ${fmt.format(r.placed)} orders delivered · ${pct(r.margin, 1)} margin on delivered sales · ${tk(r.profit * 12)} a year`;

    $("#k-order").textContent = tk(r.perOrder);
    $("#k-order-s").textContent = `on a ${tk(st.price)} sale`;
    $("#rk-order").className = `rk${r.perOrder < 0 ? " bad" : ""}`;
    $("#k-roas").textContent = x(r.realRoas);
    $("#k-roas-s").textContent = r.amRoas ? `Ads Manager shows ${x(r.amRoas)}` : "No ad spend entered";
    $("#k-cpo").textContent = r.beCpo > 0 ? tk(r.beCpo) : "৳0";
    $("#k-cpo-s").textContent = `You pay ${tk(r.cpo)} now`;
    $("#rk-cpo").className = `rk${r.cpo > r.beCpo ? " bad" : r.cpo > r.beCpo * 0.8 ? " warn" : ""}`;
    $("#k-ret").textContent = `${tk(r.returnsCost)}/mo`;
    $("#k-ret-s").textContent = r.profit > 0 ? `${pct(r.returnsCost / (r.profit + r.returnsCost))} of what you'd earn without them` : "and they deepen the loss";
    $("#rk-ret").className = `rk${st.retPct >= 25 ? " bad" : st.retPct >= 15 ? " warn" : ""}`;
    if (r.sugPrice && isFinite(r.sugPrice)) {
      const p = Math.ceil(r.sugPrice / 10) * 10;
      $("#k-price").textContent = tk(p);
      $("#k-price-s").textContent = p <= st.price ? `You're already above ${st.margin}% at ${tk(st.price)}` : `+${tk(p - st.price)} vs today for a ${st.margin}% margin`;
    } else { $("#k-price").textContent = "Not possible"; $("#k-price-s").textContent = "Costs are too high for this margin. Cut costs or returns first"; }
    $("#k-beroas").textContent = isFinite(r.beRoas) ? x(r.beRoas) : "—";

    // breakdown bar (per delivered order)
    const costs = r.parts.filter((p) => p[2] > 0.5);
    const costSum = costs.reduce((s, p) => s + p[2], 0);
    const total = Math.max(st.price, costSum) || 1;
    const segs = [...costs, ...(r.perOrder > 0 ? [["profit", "Your profit", r.perOrder]] : [])];
    $("#bdbar").innerHTML = segs.map(([k, , v]) => `<i class="c-${k}" style="--w:${(v / total) * 100}%"></i>`).join("");
    $("#bdbar").setAttribute("aria-label", `Per delivered order: ${segs.map(([, l, v]) => `${l} ${tk(v)}`).join(", ")}`);
    $("#bdlegend").innerHTML = segs.map(([k, l, v]) => `<li><i class="c-${k}"></i>${l}<b>${tk(v)}</b></li>`).join("") +
      (r.perOrder < 0 ? `<li style="color:var(--negative)"><i class="c-returns"></i>Loss per order<b style="color:var(--negative)">${tk(r.perOrder)}</b></li>` : "");

    // insights
    const lower = calc({ ...st, retPct: Math.max(0, st.retPct - 1) });
    const perPoint = lower.profit - r.profit;
    const tips = [];
    if (st.retPct > 0) tips.push([ICON.warn, `Returns cost you <b>${tk(r.returnsCost)} a month</b>: courier both ways, packaging, stock you can't resell and the ad money spent on orders that came back. Every 1% fewer returns adds <b>${tk(perPoint)}/month</b>.`]);
    if (st.ads > 0 && r.cpo > r.beCpo) tips.push([ICON.warn, `You pay <b>${tk(r.cpo)}</b> in ads per order but can only afford <b>${tk(Math.max(0, r.beCpo))}</b>. Ads are costing more than they earn.`]);
    else if (st.ads > 0) tips.push([ICON.tip, `Keep Ads Manager ROAS above <b>${x(r.beRoas)}</b>. Below that, every sale loses money. Today you're at <b>${x(r.amRoas)}</b>${r.amRoas > r.beRoas * 1.5 ? ", room to scale" : ""}.`]);
    if (r.amRoas && r.realRoas && st.retPct >= 10) tips.push([ICON.tip, `Ads Manager says <b>${x(r.amRoas)}</b>, but after returns your real ROAS is <b>${x(r.realRoas)}</b>. Judge campaigns on delivered orders.`]);
    $("#insights").innerHTML = tips.slice(0, 3).map(([i, t]) => `<li>${i}<span>${t}</span></li>`).join("");

    // scenario
    if (!scTouched) sc.value = Math.min(st.retPct, Math.max(0, Math.round(st.retPct * 0.55)));
    paintScenario(r);
  }
  function paintScenario(r = calc(st)) {
    const target = +sc.value;
    sc.style.setProperty("--p", `${(sc.value / sc.max) * 100}%`);
    $("#o-sc").textContent = `${target}%`;
    $("#o-ret").textContent = `${st.retPct}%`;
    $("#o-out").textContent = `${st.outPct}%`;
    const better = calc({ ...st, retPct: target });
    const gain = better.profit - r.profit;
    $("#sc-gain").textContent = `${gain >= 0 ? "+" : ""}${tk(gain)} / month`;
    $("#sc-gain").style.color = gain >= 0 ? "" : "var(--negative)";
    $("#sc-text").textContent = target < st.retPct
      ? `Bringing returns from ${st.retPct}% to ${target}% means ${tk(gain * 12)} more profit a year, with the same ads and the same sales. This is exactly what we work on for clients.`
      : "Drag the slider below your current return rate to see what fewer returns would be worth.";
  }
  sc.addEventListener("input", () => { scTouched = true; paintScenario(); });
  sc.addEventListener("change", () => T.track("calculator_scenario", { tool: "profit-calculator", target: +sc.value }, { section: "calculator" }));

  /* ---------- share link ---------- */
  $("#copy-link").addEventListener("click", async () => {
    const u = new URL(location.origin + location.pathname);
    KEYS.forEach((k) => u.searchParams.set(k, typeof st[k] === "boolean" ? (st[k] ? "1" : "0") : st[k]));
    const label = $("#copy-link span");
    try { await navigator.clipboard.writeText(u.toString()); label.textContent = "Link copied ✓"; }
    catch { label.textContent = "Couldn't copy"; }
    setTimeout(() => (label.textContent = "Copy link"), 2200);
    T.track("share_link", { tool: "profit-calculator" }, { section: "calculator" });
  });

  /* ---------- downloadable report (PNG, 1080×1350, made in the browser) ---------- */
  $("#dl-report").addEventListener("click", async () => {
    const r = calc(st);
    const css = getComputedStyle(document.documentElement);
    const c = (n) => css.getPropertyValue(n).trim() || "#888";
    const W = 1080, H = 1350, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    try { await document.fonts.ready; } catch { /* ignore */ }
    const font = (w, s) => `${w} ${s}px "Bricolage Grotesque", "Noto Sans Bengali", system-ui, sans-serif`;
    g.fillStyle = c("--bg-elev"); g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W * 0.8, 120, 20, W * 0.8, 120, 620);
    glow.addColorStop(0, c("--glow-1")); glow.addColorStop(1, "transparent");
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    const grad = g.createLinearGradient(80, 0, W - 80, 0);
    grad.addColorStop(0, c("--a1")); grad.addColorStop(1, c("--a2"));
    // wordmark (white PNG tinted to the theme text colour)
    await new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const w = 230, h = (img.height / img.width) * w, off = document.createElement("canvas");
        off.width = w; off.height = h;
        const o = off.getContext("2d"); o.drawImage(img, 0, 0, w, h); o.globalCompositeOperation = "source-in"; o.fillStyle = c("--text"); o.fillRect(0, 0, w, h);
        g.drawImage(off, 80, 84); res();
      };
      img.onerror = res; img.src = "/assets/img/wm-greyrock.png";
    });
    g.fillStyle = c("--text-muted"); g.font = font(600, 26); g.textAlign = "right"; g.fillText("PROFIT REPORT", W - 80, 120); g.textAlign = "left";
    g.fillStyle = c("--text-muted"); g.font = font(500, 34); g.fillText("Real profit this month", 80, 270);
    g.fillStyle = r.profit < 0 ? c("--negative") : c("--text"); g.font = font(800, 130); g.fillText(tk(r.profit), 74, 410);
    const [, vText] = verdictOf(r);
    g.font = font(700, 30); g.fillStyle = grad; g.fillText(`${vText} · ${pct(r.margin, 1)} margin · ${tk(r.profit * 12)}/year`, 80, 470);
    const tiles = [["Profit per order", tk(r.perOrder)], ["Real ROAS", `${x(r.realRoas)}  (Ads Manager ${x(r.amRoas)})`], ["Max ad cost per order", tk(Math.max(0, r.beCpo))], ["Returns cost / month", tk(r.returnsCost)]];
    tiles.forEach(([l, v], i) => {
      const tx = 80 + (i % 2) * 470, ty = 540 + Math.floor(i / 2) * 170;
      g.fillStyle = c("--surface-2"); roundRect(g, tx, ty, 450, 145, 22); g.fill();
      g.fillStyle = c("--text-muted"); g.font = font(500, 25); g.fillText(l, tx + 28, ty + 50);
      g.fillStyle = c("--text"); g.font = font(750, i === 1 ? 34 : 46); g.fillText(v, tx + 28, ty + 112);
    });
    g.fillStyle = c("--text-muted"); g.font = font(500, 27); g.fillText(`Where each ${tk(st.price)} order goes`, 80, 940);
    const costs = r.parts.filter((p) => p[2] > 0.5), sum = costs.reduce((s, p) => s + p[2], 0), total = Math.max(st.price, sum) || 1;
    const segs = [...costs, ...(r.perOrder > 0 ? [["profit", "Your profit", r.perOrder]] : [])];
    const colorOf = { product: c("--text-dim"), pack: c("--border-strong"), delivery: c("--a2"), returns: c("--negative"), fees: c("--warn"), ads: c("--a3"), other: c("--border-strong"), profit: c("--positive") };
    let bx = 80;
    g.save(); roundRect(g, 80, 965, W - 160, 44, 12); g.clip();
    g.fillStyle = c("--surface-2"); g.fillRect(80, 965, W - 160, 44);
    segs.forEach(([k, , v]) => { const w = (v / total) * (W - 160); g.fillStyle = colorOf[k]; g.fillRect(bx, 965, w, 44); bx += w; });
    g.restore();
    segs.forEach(([k, l, v], i) => {
      const lx = 80 + (i % 2) * 470, ly = 1060 + Math.floor(i / 2) * 44;
      g.fillStyle = colorOf[k]; roundRect(g, lx, ly - 18, 18, 18, 4); g.fill();
      g.fillStyle = c("--text-muted"); g.font = font(500, 24); g.fillText(l, lx + 30, ly);
      g.fillStyle = c("--text"); g.font = font(700, 24); g.textAlign = "right"; g.fillText(tk(v), lx + 440, ly); g.textAlign = "left";
    });
    g.fillStyle = c("--text-dim"); g.font = font(500, 23);
    g.fillText(`Free profit calculator by Greyrock Digital · ${location.host}/tools/profit-calculator`, 80, H - 70);
    cv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "greyrock-profit-report.png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    }, "image/png");
    T.track("report_download", { tool: "profit-calculator" }, { section: "calculator" });
  });
  function roundRect(g, x0, y0, w, h, rad) {
    g.beginPath(); g.moveTo(x0 + rad, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, rad); g.arcTo(x0 + w, y0 + h, x0, y0 + h, rad);
    g.arcTo(x0, y0 + h, x0, y0, rad); g.arcTo(x0, y0, x0 + w, y0, rad); g.closePath();
  }

  /* ---------- lead with the numbers attached ---------- */
  T.setLeadExtra(() => {
    const r = calc(st);
    return { calc: { tool: "profit-calculator", inputs: { ...st }, profit: Math.round(r.profit), margin: +(r.margin * 100).toFixed(1), perOrder: Math.round(r.perOrder),
      returnsCost: Math.round(r.returnsCost), realRoas: +r.realRoas.toFixed(2), adsManagerRoas: +r.amRoas.toFixed(2), maxCpo: Math.round(r.beCpo), cpo: Math.round(r.cpo) } };
  });
  $("#calc-cta").addEventListener("click", () => T.openLead("tool:profit-calculator", { industry }));

  paintInputs();
  render();
})();
