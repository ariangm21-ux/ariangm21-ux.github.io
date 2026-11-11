/* Customer review: social proof that sells.
   A white review card leads (a big drawn serif quote mark, five stars, the customer's words in a serif
   face, a verified reviewer with an initial avatar). The product sits beside it as a tilted customer
   photo, or as a floating cut-out, and the seller's headline, price and CTA follow as the second read. */
GRS.register({
  id: "review", name: "Customer review", group: "trust", photos: 1, cutout: "optional",
  desc: "5-star customer quote beside your product",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const F = d.f;
    const bn = t.lang === "bn";
    const VERIFIED = bn ? "ভেরিফায়েড ক্রেতা" : "Verified buyer";
    const f0 = d.scale || 1;

    /* ---------- colour ---------- */
    const P = c.primary, hsl = d.toHsl(P), grey = hsl[1] < 0.12;
    const ownAccent = /^#[\da-f]{6}$/i.test(d.st.accent || "");
    // the auto complement of greens/teals is a hot magenta that fights the calm, trustworthy card: use warm sale-yellow instead
    const accH = d.toHsl(c.accent)[0], harsh = !ownAccent && accH > 265 && accH < 345;
    const ACC = grey && !ownAccent ? c.gold : harsh ? c.sale : c.accent;
    const onBg = c.onPrimary, darkBg = onBg === "#FFFFFF";
    const INK = c.ink, CARD = "#FFFFFF";
    // the brand colour as it reads on the white card (very light brand colours get a deeper shade; yellows lean amber, not olive)
    const STRONG = d.contrast(P, CARD) >= 3 ? P : d.fromHsl(hsl[0] > 40 && hsl[0] < 80 ? hsl[0] - 14 : hsl[0], Math.max(hsl[1], 0.6), 0.34);
    const STAR = "#FFB020", GREEN = c.green;
    const HI = darkBg ? (grey ? c.gold : c.sale) : d.contrast(STRONG, P) >= 2.5 ? STRONG : c.deep;
    const ctaOk = d.contrast(ACC, P) >= 1.45;
    const CTA = ctaOk ? { bg: ACC, fg: d.onColor(ACC) } : { bg: darkBg ? CARD : INK, fg: darkBg ? STRONG : CARD };
    const STK = darkBg ? c.sale : ctaOk ? ACC : INK;

    /* quote face: serif for most pairings, the seller's own face when it is handwritten or friendly */
    const QK = F.key === "hand" || F.key === "friendly" ? "display" : "serif";
    const QW = QK === "serif" ? 700 : undefined;
    const QM = F.key === "hand" ? 1.22 : 1;
    const QLH = bn ? 1.42 : F.key === "hand" ? 1.08 : 1.26;

    /* ---------- drawn pieces ---------- */
    // serif opening quote ("66"): two teardrops, ball low, tail curling up to the right. Width = 1.58 × h.
    function quoteMark(x, y, h, color, flip) {
      g.save();
      if (flip) { const cx = x + 0.79 * h, cy = y + 0.5 * h; g.translate(cx, cy); g.rotate(Math.PI); g.translate(-cx, -cy); }
      g.beginPath();
      [0, 0.86].forEach((o) => {
        const X = (v) => x + (o + v) * h, Y = (v) => y + v * h;
        g.moveTo(X(0.06), Y(0.7));
        g.bezierCurveTo(X(0.04), Y(0.33), X(0.28), Y(0.07), X(0.68), Y(0));
        g.lineTo(X(0.715), Y(0.075));
        g.bezierCurveTo(X(0.47), Y(0.14), X(0.36), Y(0.27), X(0.41), Y(0.41));
        g.lineTo(X(0.36), Y(0.7)); g.closePath();
        g.moveTo(X(0.66), Y(0.7)); g.arc(X(0.36), Y(0.7), 0.3 * h, 0, Math.PI * 2);
      });
      g.fillStyle = color; g.fill(); g.restore();
    }
    // verified rosette with a tick
    function seal(cx, cy, r, fill) {
      g.save(); g.beginPath();
      const n = 12;
      for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.84 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      g.closePath(); g.fillStyle = fill; g.fill();
      g.strokeStyle = "#FFFFFF"; g.lineWidth = r * 0.24; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(cx - r * 0.4, cy + r * 0.02); g.lineTo(cx - r * 0.1, cy + r * 0.32); g.lineTo(cx + r * 0.42, cy - r * 0.3); g.stroke();
      g.restore();
    }
    function clock(cx, cy, r, color) {
      g.save(); g.strokeStyle = color; g.lineWidth = r * 0.22; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.arc(cx, cy, r * 0.86, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(cx, cy - r * 0.48); g.lineTo(cx, cy); g.lineTo(cx + r * 0.36, cy + r * 0.22); g.stroke();
      g.restore();
    }
    // the reviewer's initial (first letter; Latin uppercased)
    const initial = (() => { const m = /[\p{L}\p{N}]/u.exec(t.reviewer || ""); return m ? m[0].toUpperCase() : ""; })();
    function avatar(cx, cy, r) {
      g.save();
      const gr = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r); gr.addColorStop(0, STRONG); gr.addColorStop(1, ACC);
      g.lineWidth = r * 0.11; g.strokeStyle = gr; g.beginPath(); g.arc(cx, cy, r * 0.94, 0, Math.PI * 2); g.stroke();
      d.circle(cx, cy, r * 0.76, STRONG);
      if (initial) {
        g.fillStyle = d.onColor(STRONG); g.font = d.font("display", r * 0.78); g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(initial, cx, cy + r * 0.05);
      } else { // a simple person
        d.circle(cx, cy - r * 0.2, r * 0.22, d.onColor(STRONG));
        g.beginPath(); g.ellipse(cx, cy + r * 0.38, r * 0.4, r * 0.24, 0, Math.PI, 0); g.fill();
      }
      g.restore();
      d.tag("avatar"); d.mark(cx - r * 0.5, cy - r * 0.5, r, r); d.tag("");
    }
    function card(x, y, w, h, r) {
      g.save();
      g.shadowColor = darkBg ? "rgba(0,0,0,.32)" : d.rgba(d.mix(P, "#000000", 0.7), 0.24);
      g.shadowBlur = 6 * u; g.shadowOffsetY = 2.2 * u;
      g.fillStyle = CARD; d.rr(x, y, w, h, r); g.fill();
      g.restore();
    }
    // logo image, or the brand name set in small caps
    function brandMark(x, y, maxW, h, al, color, plate) {
      if (d.hasLogo) return d.logo(x, y, maxW, h, { align: al, plate });
      if (!t.brand) return { w: 0, h: 0 };
      const s = h * 0.46;
      return d.text(t.brand, x, y + (h - s * 1.12) / 2, { size: s, min: s * 0.72, kind: "body", weight: 800, color, maxW, align: al, lines: 1, upper: true });
    }

    /* text lines that shrink to fit, then end with "…" rather than spill */
    function fitLines(str, maxW, maxLines, size, minSize, kind, weight) {
      let s = Math.round(size), lines;
      for (; s >= minSize; s -= 2) {
        g.font = d.font(kind, s, weight); lines = d.wrap(str, maxW);
        if (lines.length <= maxLines && lines.every((l) => g.measureText(l).width <= maxW)) return { lines, size: s };
      }
      s = Math.max(1, Math.round(minSize)); g.font = d.font(kind, s, weight); lines = d.wrap(str, maxW);
      const cut = lines.length > maxLines;
      lines = lines.slice(0, maxLines).map((l, i, arr) => {
        const last = i === arr.length - 1;
        if (g.measureText(l).width <= maxW && !(last && cut)) return l;
        let words = l.split(" ");
        while (words.length > 1 && g.measureText(`${words.join(" ")}…`).width > maxW) words.pop();
        let out = words.join(" ");
        while (out.length > 1 && g.measureText(`${out}…`).width > maxW) out = out.slice(0, -1);
        return `${out.replace(/[\s,.;:!?।]+$/, "")}…`;
      });
      return { lines, size: s };
    }

    /* ---------- the review card's contents ---------- */
    const RATING = t.rating > 0 ? t.rating : 5;
    function review(w, fct, o) {
      const center = o.al === "center";
      const Gh = o.glyph * fct, S = o.star * fct, PS = o.proof * fct, N = o.name * fct, A = o.avatar * fct, gap = o.gap * fct;
      const glyphW = Gh * 1.58, rateS = S * 0.84;
      g.font = d.font("body", rateS, 800);
      const rateW = t.rating > 0 ? g.measureText(t.ratingText).width + S * 0.4 : 0;
      const starsW = 5 * S + 4 * S * 0.18 + rateW;
      let proofW = 0;
      if (t.proof) { g.font = d.font("body", PS, 600); proofW = g.measureText(t.proof).width; }
      let headH, logoBox = null, proofM = null, colX = 0, colW = w, stackH;
      if (!center) {
        colX = glyphW + gap * 1.3; colW = w - colX;
        if (o.logo && (d.hasLogo || t.brand)) {
          const slot = colW - Math.max(starsW, Math.min(proofW, colW)) - gap * 2;
          const lw = Math.min(o.logoW * fct, slot);
          if (lw >= 11 * u) logoBox = { w: lw, h: o.logoH * fct };
        }
        const pMax = colW - (logoBox ? logoBox.w + gap * 2 : 0);
        if (t.proof) proofM = d.text(t.proof, 0, 0, { measure: true, size: PS, min: PS * 0.8, kind: "body", weight: 600, maxW: pMax, lines: 2, lh: 1.2 });
        stackH = S + (proofM ? S * 0.4 + proofM.h : 0);
        headH = Math.max(Gh, stackH, logoBox ? logoBox.h : 0);
      } else {
        if (t.proof) proofM = d.text(t.proof, 0, 0, { measure: true, size: PS, min: PS * 0.8, kind: "body", weight: 600, maxW: w, lines: 2, lh: 1.2, align: "center" });
        stackH = S + (proofM ? S * 0.4 + proofM.h : 0);
        headH = Gh + gap * 0.8 + stackH;
      }
      const Q = o.quote * fct * QM;
      const qf = fitLines(t.quote, w, o.qLines, Q, Q * 0.8, QK, QW);
      const qH = qf.lines.length * qf.size * QLH;
      const rowW = center ? w : Math.min(w, o.rowMaxW || w);
      const rv = reviewer(0, 0, rowW, A, N, center ? "center" : "left", true);
      const g1 = gap * 1.25, g2 = gap * 1.2;
      const total = headH + g1 + qH + g2 * 2 + rv.h;
      return {
        h: total, logo: !!logoBox, fct,
        draw(x, y) {
          if (!center) {
            quoteMark(x, y + (headH - Gh) / 2, Gh, STRONG);
            const sy = y + (headH - stackH) / 2;
            d.stars(x + colX, sy, S, { rating: RATING, color: STAR, empty: d.rgba(INK, 0.14) });
            if (rateW) d.text(t.ratingText, x + colX + starsW - rateW + S * 0.4, sy + (S - rateS * 1.12) / 2 + S * 0.04, { size: rateS, kind: "body", weight: 800, color: INK, lines: 1, maxW: rateW + 4 });
            if (proofM) d.text(t.proof, x + colX, sy + S * 1.4, { size: proofM.size, min: proofM.size, kind: "body", weight: 600, color: d.rgba(INK, 0.62), maxW: colW - (logoBox ? logoBox.w + gap * 2 : 0), lines: 2, lh: 1.2 });
            if (logoBox) brandMark(x + w - logoBox.w, y + (headH - logoBox.h) / 2, logoBox.w, logoBox.h, "right", d.rgba(INK, 0.7));
          } else {
            quoteMark(x + (w - glyphW) / 2, y, Gh, STRONG);
            const sy = y + Gh + gap * 0.8;
            d.stars(x + (w - starsW) / 2, sy, S, { rating: RATING, color: STAR, empty: d.rgba(INK, 0.14) });
            if (rateW) d.text(t.ratingText, x + (w + starsW) / 2 - rateW + S * 0.4, sy + (S - rateS * 1.12) / 2 + S * 0.04, { size: rateS, kind: "body", weight: 800, color: INK, lines: 1, maxW: rateW + 4 });
            if (proofM) d.text(t.proof, x, sy + S * 1.4, { size: proofM.size, min: proofM.size, kind: "body", weight: 600, color: d.rgba(INK, 0.62), maxW: w, lines: 2, lh: 1.2, align: "center" });
          }
          // the quote
          let yy = y + headH + g1;
          g.save(); g.font = d.font(QK, qf.size, QW); g.fillStyle = INK; g.textBaseline = "top"; g.textAlign = "left";
          d.tag("quote");
          qf.lines.forEach((l) => {
            const lw = g.measureText(l).width, lx = center ? x + (w - lw) / 2 : x;
            g.fillText(l, lx, yy); d.mark(lx, yy, lw, qf.size * QLH); yy += qf.size * QLH;
          });
          d.tag(""); g.restore();
          // divider
          yy += g2;
          g.fillStyle = d.rgba(INK, 0.1);
          if (center) g.fillRect(x + w / 2 - 6 * u * fct, yy - 0.1 * u, 12 * u * fct, Math.max(1, 0.2 * u));
          else g.fillRect(x, yy - 0.1 * u, w, Math.max(1, 0.18 * u));
          yy += g2;
          reviewer(x, yy, rowW, A, N, center ? "center" : "left");
        },
      };
    }
    // avatar + name + verified line
    function reviewer(x, y, maxW, A, N, al, measure) {
      const V = N * 0.84, gapA = A * 0.3, tw = Math.max(10, maxW - A - gapA), ic = V * 0.62;
      g.font = d.font("body", N, 700); const nw = Math.min(tw, g.measureText(t.reviewer).width);
      g.font = d.font("body", V, 600); const vw = Math.min(tw, g.measureText(VERIFIED).width + ic * 2 + V * 0.4);
      const textH = N * 1.22 + V * 1.25, h = Math.max(A, textH), rowW = A + gapA + Math.max(nw, vw);
      if (measure) return { w: rowW, h };
      const sx = al === "center" ? x + (maxW - rowW) / 2 : x;
      avatar(sx + A / 2, y + h / 2, A / 2);
      const tx = sx + A + gapA, ty = y + (h - textH) / 2;
      d.text(t.reviewer, tx, ty, { size: N, min: N * 0.75, kind: "body", weight: 700, color: INK, maxW: tw, lines: 1 });
      const vy = ty + N * 1.22;
      seal(tx + ic, vy + V * 0.6, ic, GREEN);
      d.text(VERIFIED, tx + ic * 2 + V * 0.4, vy, { size: V, min: V * 0.75, kind: "body", weight: 600, color: GREEN, maxW: tw - ic * 2 - V * 0.4, lines: 1 });
      return { w: rowW, h };
    }
    /* shrink the card's contents until they fit maxH, but never below a legible floor
       (a long quote is capped by qLines and ends with "…", so the card height stays bounded) */
    function fitReview(w, maxH, o) {
      const minF = Math.min(f0, Math.max(0.7, (2.4 * u) / o.name, (4 * u) / o.quote));
      let r = null;
      for (let fct = f0; fct >= minF - 1e-6; fct -= 0.04) { r = review(w, fct, o); if (r.h <= maxH) return r; }
      return r;
    }

    /* ---------- the offer (secondary): headline, price, CTA, then optional chips / sub / ends ---------- */
    function offer(w, fct, o) {
      const al = o.al || "left", gap = (o.gap || 2.2 * u) * fct, parts = [];
      let ok = true;
      if (o.logo && (d.hasLogo || t.brand)) {
        const lh = 4.4 * u * fct;
        parts.push({ h: lh, draw: (x, y) => brandMark(x, y, Math.min(w, 30 * u), lh, al === "center" ? "center" : "left", d.rgba(onBg, 0.8), darkBg ? "#FFFFFF" : undefined) });
      }
      if (t.headline) {
        const hs = o.head * fct, hmin = o.floor ? Math.min(hs, Math.max(hs * 0.72, o.floor)) : hs * 0.8;
        const m = d.headline(0, 0, { measure: true, size: hs, min: hmin, lines: o.headLines, maxW: w });
        const all = d.headline(0, 0, { measure: true, size: m.size, min: m.size, lines: 40, maxW: w });
        if (all.lines.length > o.headLines || m.w > w + 1) ok = false;
        parts.push({ h: m.h, draw: (x, y) => d.headline(x, y, { size: m.size, min: m.size, lines: o.headLines, maxW: w, align: al, color: onBg, hi: HI }) });
      }
      if (o.sub && t.sub) {
        const s = o.sub * fct, m = d.text(t.sub, 0, 0, { measure: true, size: s, min: s * 0.85, kind: "body", weight: 500, maxW: w, lines: 2, lh: 1.25 });
        parts.push({ h: m.h, draw: (x, y) => d.text(t.sub, x, y, { size: m.size, min: m.size, kind: "body", weight: 500, color: d.rgba(onBg, 0.82), maxW: w, lines: 2, lh: 1.25, align: al }) });
      }
      const ps = o.price * fct, cs = o.cta * fct;
      const pm = t.price ? d.price(0, 0, { measure: true, size: ps }) : { w: 0, h: 0 };
      const cm = t.cta ? d.cta(0, 0, { measure: true, size: cs }) : { w: 0, h: 0 };
      if (pm.w > w || cm.w > w) ok = false;
      const PC = { size: ps, color: onBg, oldColor: d.rgba(onBg, 0.6), prefixColor: d.rgba(onBg, 0.8) };
      const chipsPart = () => {
        if (!o.maxChips || !t.badges.length) return;
        const s = o.chip * fct, m = d.chips(0, 0, w, { measure: true, size: s, max: o.maxChips });
        if (o.chipRows && m.h > s * 1.92 * o.chipRows + s * 0.45 * (o.chipRows - 1) + 1) { ok = false; }
        parts.push({ h: m.h, draw: (x, y) => d.chips(x, y, w, { size: s, max: o.maxChips, bg: d.rgba(onBg, 0.12), fg: onBg, stroke: d.rgba(onBg, 0.26), align: al }) });
      };
      const endsPart = () => {
        if (!o.ends || !t.endsText) return;
        const s = 2.5 * u * fct;
        parts.push({ h: s * 1.25, draw: (x, y) => {
          g.font = d.font("body", s, 700);
          const ic = s * 1.05, tw = Math.min(w - ic - s * 0.5, g.measureText(t.endsText).width), ww = ic + s * 0.5 + tw;
          const sx = al === "center" ? x + (w - ww) / 2 : x, col = d.rgba(onBg, 0.88);
          clock(sx + ic / 2, y + s * 0.6, ic / 2, col);
          d.text(t.endsText, sx + ic + s * 0.5, y, { size: s, min: s * 0.8, kind: "body", weight: 700, color: col, maxW: tw + 2, lines: 1 });
        } });
      };
      const inline = o.inline && pm.w && cm.w && pm.w + 3 * u * fct + cm.w <= w;
      if (inline) {
        chipsPart(); endsPart();
        const rh = Math.max(pm.h, cm.h);
        parts.push({ h: rh, extra: gap * 0.3, draw: (x, y) => {
          if (al === "center") {
            const tot = pm.w + 3 * u * fct + cm.w, sx = x + (w - tot) / 2;
            d.price(sx, y + (rh - pm.h) / 2, PC);
            d.cta(sx + pm.w + 3 * u * fct, y + (rh - cm.h) / 2, { size: cs, bg: CTA.bg, fg: CTA.fg });
          } else {
            d.price(x, y + (rh - pm.h) / 2, PC);
            d.cta(x + w - cm.w, y + (rh - cm.h) / 2, { size: cs, bg: CTA.bg, fg: CTA.fg });
          }
        } });
      } else {
        if (pm.w) parts.push({ h: pm.h, draw: (x, y) => d.price(x, y, { ...PC, align: al, maxW: w }) });
        chipsPart(); endsPart();
        if (cm.w) parts.push({ h: cm.h, extra: gap * 0.3, draw: (x, y) => d.cta(x, y, { size: cs, bg: CTA.bg, fg: CTA.fg, align: al, maxW: w }) });
      }
      const h = parts.reduce((a, p, i) => a + p.h + (i ? gap + (p.extra || 0) : 0), 0);
      return { h, ok, draw: (x, y) => { let yy = y; parts.forEach((p, i) => { if (i) yy += gap + (p.extra || 0); p.draw(x, yy); yy += p.h; }); } };
    }
    /* drop optional parts (ends → extra chips → chips → sub) before any text goes below its legible floor:
       headline ≥ 5u, chips and button ≥ 2.2u */
    function fitOffer(w, maxH, o) {
      const floor = 5 * u;
      const drops = [o, { ...o, ends: false }, { ...o, ends: false, maxChips: Math.min(o.maxChips || 0, 2), chipRows: 1 }, { ...o, ends: false, maxChips: 0 }, { ...o, ends: false, maxChips: 0, sub: 0 }];
      for (const oo of drops) {
        const minF = Math.max(0.5, floor / oo.head, (2.2 * u) / oo.cta, oo.maxChips && t.badges.length ? (2.2 * u) / oo.chip : 0);
        for (let fct = f0; fct >= minF - 1e-6; fct -= 0.04) { const b = offer(w, fct, { ...oo, floor }); if (b.ok && b.h <= maxH) return b; }
      }
      const last = drops[drops.length - 1];
      for (let fct = Math.min(f0, 0.9); fct >= 0.5; fct -= 0.04) { const b = offer(w, fct, last); if (b.ok && b.h <= maxH) return b; }
      return offer(w, 0.5, last);
    }

    /* ---------- product: tilted customer photo, or a floating cut-out on a soft disc ---------- */
    function product(x, y, w, h, rot) {
      if (d.hasCutout(0)) {
        const R = Math.min(w * 0.5, h * 0.46);
        g.save(); g.fillStyle = darkBg ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.42)";
        d.circle(x + w / 2, y + h - R * 1.08, R); g.fill(); g.restore();
        d.product(x + w * 0.04, y, w * 0.92, h, { shadowColor: "rgba(0,0,0,.3)" });
        return { x, y, w, h, cut: true };
      }
      const b = 1.5 * u, R = 2.6 * u;
      g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot);
      g.shadowColor = "rgba(0,0,0,.32)"; g.shadowBlur = 5 * u; g.shadowOffsetY = 2 * u;
      g.fillStyle = "#FFFFFF"; d.rr(-w / 2, -h / 2, w, h, R); g.fill();
      g.shadowColor = "rgba(0,0,0,0)"; g.shadowBlur = 0;
      d.photo(-w / 2 + b, -h / 2 + b, w - 2 * b, h - 2 * b, { clip: () => d.rr(-w / 2 + b, -h / 2 + b, w - 2 * b, h - 2 * b, R * 0.62) });
      g.restore();
      return { x, y, w, h, cut: false };
    }

    function background(q) {
      const gr = g.createLinearGradient(0, 0, W * 0.35, H);
      gr.addColorStop(0, d.mix(P, "#FFFFFF", darkBg ? 0.1 : 0.22));
      gr.addColorStop(1, d.mix(P, "#000000", darkBg ? 0.2 : 0.05));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (q && q.h) { g.save(); g.globalAlpha = darkBg ? 0.08 : 0.1; quoteMark(q.x, q.y, q.h, onBg, true); g.restore(); }
      if (q && q.dots) d.pattern("dots", q.dots.x, q.dots.y, q.dots.w, q.dots.h, d.rgba(onBg, darkBg ? 0.22 : 0.28), { size: 3.2 * u, r: 0.42 * u });
    }

    /* =========================== compositions =========================== */
    const al = d.align("left");

    if (k.landscape) {
      const pH = H - k.top - k.bottom + 4 * u, pW = Math.round(pH * 0.8), pX = k.side, pY = (H - pH) / 2;
      const x0 = pX + pW + 6.5 * u, colW = W - k.side - x0, pad = 4.4 * u, avail = H - k.top - k.bottom;
      const rv = fitReview(colW - 2 * pad, avail * 0.66 - 2 * pad, { al, glyph: 7 * u, star: 3.2 * u, proof: 2.4 * u, quote: 5 * u, qLines: 3, name: 2.7 * u, avatar: 6.2 * u, gap: 2.2 * u, logo: true, logoW: 24 * u, logoH: 4.6 * u });
      const cardH = rv.h + 2 * pad, cg = 4.4 * u;
      const of = fitOffer(colW, avail - cardH - cg, { al, head: 6.2 * u, headLines: 2, price: 7 * u, cta: 3.3 * u, chip: 2.4 * u, maxChips: 2, chipRows: 1, inline: true, logo: !rv.logo });
      const top = k.top + Math.max(0, (avail - cardH - cg - of.h) / 2);
      background({ dots:{ x: pX + pW * 0.55, y: pY + pH * 0.6, w: pW * 0.75, h: pH * 0.6 } });
      const art = product(pX, pY, pW, pH, -0.035);
      d.sticker(art.x + art.w - 4 * u, k.top + 8 * u, 8.5 * u, { shape: "badge", fill: STK, fg: d.onColor(STK), rot: 0.12 });
      card(x0, top, colW, cardH, 3.6 * u);
      rv.draw(x0 + pad, top + pad);
      of.draw(x0, top + cardH + cg);
      return;
    }

    if (k.story) {
      // product up top (it may sit under the profile bar: it is a picture, not text), the review card in the
      // middle of the safe area, the offer under it. Text stays left of the Reels buttons (x ≤ 88% of the width).
      // The card + offer stack is measured first and settles toward the bottom of the safe area; whatever
      // height is left above it goes to the product, so short copy gives a big hero and long copy a smaller one.
      const colX = 9 * u, colW = W - 2 * colX, pad = 5 * u, cg = 5.5 * u, sR = 9 * u;
      const safeBot = H - k.bottom, ow = W * 0.88 - colX - u;
      // the sticker sits in the hero, below the profile bar and above the card
      const minCardY = Math.max(H * 0.2, t.stickerText ? k.top + 2 * sR + 2 * u : 0);
      const rv = fitReview(colW - 2 * pad, H * 0.31 - 2 * pad, { al, glyph: 9 * u, star: 4 * u, proof: 2.8 * u, quote: 5.9 * u, qLines: 5, name: 3.2 * u, avatar: 7.8 * u, gap: 2.6 * u, logo: true, logoW: 24 * u, logoH: 5 * u });
      const cardH = rv.h + 2 * pad;
      const of = fitOffer(ow, safeBot - (minCardY + cardH + cg), { al, head: 7.6 * u, headLines: 2, sub: 3 * u, price: 8.8 * u, cta: 3.8 * u, chip: 2.7 * u, maxChips: 3, chipRows: 1, ends: true, inline: true, logo: !rv.logo });
      const slack = Math.max(0, safeBot - minCardY - cardH - cg - of.h);
      const cardY = minCardY + slack * 0.72, oy = cardY + cardH + cg;
      background({ x: W - 36 * u, y: H - 34 * u, h: 26 * u, dots: { x: W * 0.6, y: H * 0.03, w: W * 0.42, h: Math.max(H * 0.2, cardY - H * 0.03) } });
      const heroTop = H * 0.035, heroBot = cardY + 2.6 * u;
      let art;
      if (d.hasCutout(0)) {
        // a soft disc, the card, then the product standing on the card's top edge
        const hh = heroBot - heroTop, R = Math.min(hh * 0.47, 36 * u), pw = Math.min(66 * u, hh * 0.78);
        g.save(); g.fillStyle = darkBg ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.42)"; d.circle(W / 2, heroBot - R - 3 * u, R); g.fill(); g.restore();
        card(colX, cardY, colW, cardH, 4.4 * u);
        const pr = d.product(W / 2 - pw / 2, heroTop, pw, hh, { shadowColor: "rgba(0,0,0,.3)" });
        art = { x: pr.x, y: pr.y, w: pr.w, h: pr.h };
      } else {
        const ph = cardY + 7 * u - heroTop, pw = Math.min(66 * u, Math.max(52 * u, ph * 0.86));
        art = product((W - pw) / 2, heroTop, pw, ph, -0.03);
        card(colX, cardY, colW, cardH, 4.4 * u);
      }
      d.sticker(Math.min(W - k.side - sR, art.x + art.w + sR * 0.4), Math.min(cardY - sR - u, k.top + sR + 6 * u), sR, { shape: "badge", fill: STK, fg: d.onColor(STK), rot: 0.12 });
      rv.draw(colX + pad, cardY + pad);
      of.draw(colX, oy);
      return;
    }

    // square + portrait: review card on top, the product tucked under its bottom-right corner, the offer beside it
    const sq = k.square, pad = 4.8 * u;
    const cx = k.side, cy = k.top, cw = W - 2 * k.side;
    const pw = (sq ? 35 : 37) * u, px = W - k.side - pw;
    const overlap = al === "center" ? -2 * u : 5 * u;
    const rv = fitReview(cw - 2 * pad, (sq ? 0.5 : 0.46) * H - 2 * pad, { al, glyph: 8.6 * u, star: 3.7 * u, proof: 2.6 * u, quote: sq ? 5.2 * u : 5.8 * u, qLines: sq ? 4 : 5, name: 2.9 * u, avatar: 7 * u, gap: 2.4 * u, logo: true, logoW: 26 * u, logoH: 4.8 * u, rowMaxW: px - 3 * u - (cx + pad) });
    const ch = rv.h + 2 * pad;
    const py = cy + ch - overlap, ph = H - k.bottom + 1.5 * u - py;
    const oy = cy + ch + 4.6 * u, ow = px - 3.5 * u - k.side, oh = H - k.bottom - oy;
    const of = fitOffer(ow, oh, { al, head: sq ? 6.4 * u : 7 * u, headLines: sq ? 3 : 4, sub: sq ? 0 : 2.8 * u, price: sq ? 7 * u : 7.6 * u, cta: 3.3 * u, chip: 2.5 * u, maxChips: sq ? 1 : 3, chipRows: sq ? 1 : 0, ends: !sq, logo: !rv.logo });
    background({ dots:{ x: px + pw * 0.4, y: py + 10 * u, w: pw, h: ph } });
    card(cx, cy, cw, ch, 4 * u);
    rv.draw(cx + pad, cy + pad);
    const art = product(px, py, pw, ph, 0.045);
    // the seal sits on the product's lower-right corner, kept inside the side margin so it never clips
    d.sticker(Math.min(art.x + art.w - 2 * u, W - k.side - 8.5 * u * 0.95), art.y + art.h - 10 * u, 8.5 * u, { shape: "badge", fill: STK, fg: d.onColor(STK), rot: 0.12 });
    of.draw(k.side, oy + Math.max(0, (oh - of.h) / 2));
  },
});
