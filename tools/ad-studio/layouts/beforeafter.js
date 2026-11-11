/* Before / After: a clinical comparison slider. Photo 1 = before, photo 2 = after.
   With fewer than 2 uploads (or the samples) the same shot is shown dulled on the left and
   brightened on the right, exactly like a before/after slider. The offer sits on a clean
   graph-paper band below (beside on landscape). */
(() => {
  "use strict";
  const FX_BEFORE = "grayscale(.65) brightness(.85) contrast(.9)";
  const FX_AFTER = "saturate(1.3) brightness(1.06) contrast(1.05)";
  const KICKER = { en: "See the difference", bn: "পার্থক্যটা নিজেই দেখুন" };
  const STAR = "#F5A524";
  // optional parts are dropped in this order before text shrinks; "late" levels (losing the
  // offer-end date or every badge) are only used once the text has shrunk to its legible floor
  const LEVELS = [
    { kicker: 1, sub: 1, proof: 1, ends: 1, chips: 4 },
    { kicker: 0, sub: 1, proof: 1, ends: 1, chips: 4 },
    { kicker: 0, sub: 1, proof: 1, ends: 1, chips: 3 },
    { kicker: 0, sub: 0, proof: 1, ends: 1, chips: 3 },
    { kicker: 0, sub: 0, proof: 0, ends: 1, chips: 3 },
    { kicker: 0, sub: 0, proof: 0, ends: 1, chips: 2 },
    { kicker: 0, sub: 0, proof: 0, ends: 0, chips: 2, late: 1 },
    { kicker: 0, sub: 0, proof: 0, ends: 0, chips: 0, late: 1 },
  ];
  // base text sizes in u (story is multiplied by k.boost)
  const CFG = {
    square:    { head: 6.6, headLines: 2, sub: 2.9, chk: 2.7, chkRows: 1, price: 6.6, cta: 3.1, proof: 2.6, kicker: 2.2, gap: 2.0 },
    portrait:  { head: 7.2, headLines: 2, sub: 3.0, chk: 2.8, chkRows: 2, price: 7.2, cta: 3.3, proof: 2.7, kicker: 2.3, gap: 2.3 },
    story:     { head: 6.8, headLines: 2, sub: 2.6, chk: 2.5, chkRows: 2, price: 6.6, cta: 2.9, proof: 2.4, kicker: 2.0, gap: 1.9 },
    landscape: { head: 7.0, headLines: 3, sub: 3.0, chk: 2.9, chkRows: 2, price: 7.4, cta: 3.3, proof: 2.8, kicker: 2.5, gap: 2.3 },
  };

  GRS.register({
    id: "beforeafter", name: "Before / After", group: "trust", photos: 2, cutout: "no",
    desc: "Before vs after slider for visible results",
    draw(d) {
      const { g, W, H, k, t, c, u } = d;
      const bn = t.lang === "bn";
      const real = d.photoCount >= 2;
      const cfg = CFG[d.size] || CFG.square;
      const al = d.align("left");
      const tokN = GRS.tokens(t.headline).length;

      /* ---------- palette ---------- */
      const P = c.primary, pl = d.lum(P);
      const deepen = (col, against, target) => { let x = col; for (let i = 0; i < 18 && d.contrast(x, against) < target; i++) x = d.mix(x, "#000000", 0.12); return x; };
      const bg = d.mix(P, "#FFFFFF", pl > 0.55 ? 0.8 : 0.91);
      const ink = c.ink, subC = d.rgba(ink, 0.72);
      // a brand colour that can carry text on the pale band (most) vs a very light one (#F7E36B):
      // light brands keep their colour for fills (ticks, seal, AFTER pill) and use ink for text
      const brandOK = d.contrast(P, bg) >= 2.6;
      const brandInk = brandOK ? deepen(P, bg, 4.5) : ink;            // price, kicker on the band
      const sealInk = brandOK ? deepen(P, "#FFFFFF", 4.5) : ink;      // text on white (seal, knob arrows)
      const tickBg = brandOK ? brandInk : P, tickFg = brandOK ? "#FFFFFF" : ink;
      const sealFill = brandOK ? "#FFFFFF" : P;
      const lightP = pl > 0.45;
      const ctaBg = lightP ? ink : P, ctaFg = lightP ? P : c.onPrimary;
      // *highlighted* headline words: brand colour, or the accent when the brand is too light or as dark as the ink
      const hiC = brandOK && d.contrast(brandInk, ink) >= 1.8 ? brandInk : deepen(c.accent, bg, 3.5);
      const endsC = deepen(c.red, bg, 4.5);
      const gridC = d.rgba(brandInk, 0.075);

      /* ---------- small helpers ---------- */
      let seq = 0;
      // one line of text, vertically centred on cy; returns its width
      const label = (txt, x, cy, s, o = {}) => {
        g.save(); g.font = d.font(o.kind || "body", s, o.weight || 700);
        const L = o.letter || 0;
        const w = g.measureText(txt).width + (L ? [...txt].length * L * s : 0);
        if (!o.measure) {
          if (L && "letterSpacing" in g) g.letterSpacing = `${L * s}px`;
          g.fillStyle = o.color || ink; g.textBaseline = "middle"; g.textAlign = "left";
          g.fillText(txt, x, cy + s * 0.04);
        }
        g.restore();
        if (!o.measure) { d.tag(`ba-${o.tag || "lbl"}-${++seq}`); d.mark(x, cy - s * 0.62, w, s * 1.24); d.tag(""); }
        return w;
      };
      const tick = (cx, cy, s, col, lw) => {
        g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
        g.beginPath(); g.moveTo(cx - s * 0.36, cy + s * 0.02); g.lineTo(cx - s * 0.1, cy + s * 0.27); g.lineTo(cx + s * 0.38, cy - s * 0.26); g.stroke(); g.restore();
      };
      const clock = (cx, cy, r, col) => {
        g.save(); g.strokeStyle = col; g.lineWidth = r * 0.24; g.lineCap = "round"; g.lineJoin = "round";
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(cx, cy - r * 0.55); g.lineTo(cx, cy); g.lineTo(cx + r * 0.42, cy + r * 0.24); g.stroke(); g.restore();
      };

      /* checklist of badges: brand tick-circles + text (wraps onto rows) */
      function checklist(x, y, maxW, s, max, measure) {
        const ic = s * 1.2, ig = s * 0.45, gapX = s * 1.3, rowH = s * 1.5, rowGap = s * 0.5;
        g.font = d.font("body", s, 600);
        const items = t.badges.slice(0, max).map((b) => ({ b, w: ic + ig + g.measureText(b).width })).filter((it) => it.w <= maxW);
        if (!items.length) return { h: 0, rows: 0, fits: false };
        const rows = [[]]; let rw = 0;
        items.forEach((it) => { if (rows[rows.length - 1].length && rw + gapX + it.w > maxW) { rows.push([]); rw = 0; } rows[rows.length - 1].push(it); rw += (rw ? gapX : 0) + it.w; });
        const h = rows.length * rowH + (rows.length - 1) * rowGap;
        if (measure) return { h, rows: rows.length, fits: true };
        rows.forEach((row, i) => {
          const tw = row.reduce((a, it) => a + it.w, 0) + gapX * (row.length - 1);
          let cx = al === "center" ? x + (maxW - tw) / 2 : x;
          const cy = y + i * (rowH + rowGap) + rowH / 2;
          row.forEach((it) => {
            d.circle(cx + ic / 2, cy, ic / 2, tickBg);
            tick(cx + ic / 2, cy, ic * 0.62, tickFg, Math.max(1.5, ic * 0.12));
            label(it.b, cx + ic + ig, cy, s, { weight: 600, color: ink, tag: "chk" });
            cx += it.w + gapX;
          });
        });
        return { h, rows: rows.length, fits: true };
      }

      /* stars + rating + social proof on one line */
      function proofRow(x, y, s, maxW, measure) {
        const ss = s * 1.05, sw = t.rating ? 5 * ss + 4 * ss * 0.18 : 0, gp = s * 0.55;
        let txt = t.proof ? (t.ratingText ? `${t.ratingText} · ${t.proof}` : t.proof) : t.ratingText;
        let tw = txt ? label(txt, 0, 0, s, { measure: true, weight: 600 }) : 0;
        if (txt && (sw ? sw + gp : 0) + tw > maxW) { txt = t.ratingText; tw = txt ? label(txt, 0, 0, s, { measure: true, weight: 600 }) : 0; }
        const w = sw + (tw ? (sw ? gp : 0) + tw : 0);
        if (measure) return { w };
        let xx = al === "center" ? x + (maxW - w) / 2 : x;
        const cy = y + s * 0.7;
        if (sw) { d.stars(xx, cy - ss / 2, ss, { color: STAR, empty: d.rgba(ink, 0.15) }); xx += sw + gp; }
        if (tw) label(txt, xx, cy, s, { weight: 600, color: subC, tag: "proof" });
        return { w };
      }

      /* ---------- the offer band, built at text scale f with a level of optional parts ---------- */
      function band(f, lv, maxW) {
        const parts = []; let ok = true;
        const gap = cfg.gap * u * f;
        const ax = (x, w) => (al === "center" ? x + (maxW - w) / 2 : x);
        if (lv.kicker) {
          const s = cfg.kicker * u * f, txt = bn ? KICKER.bn : KICKER.en.toUpperCase(), L = bn ? 0 : 0.16;
          const tw = label(txt, 0, 0, s, { measure: true, letter: L }), rw = s * 2, w = rw + s * 0.7 + tw;
          if (w <= maxW) parts.push({ h: s * 1.3, draw: (x, y) => { const xx = ax(x, w); g.fillStyle = brandInk; g.fillRect(xx, y + s * 0.65 - s * 0.09, rw, s * 0.18); label(txt, xx + rw + s * 0.7, y + s * 0.65, s, { color: brandInk, letter: L, tag: "kick" }); } });
        }
        if (t.headline) {
          // min must not exceed Math.round(size): d.headline's fitting loop starts at the rounded size
          // and would never run (and crash) for e.g. size 30.3 / min 30.3
          let size = cfg.head * u * f;
          // a single word wider than the column (e.g. a 40-letter product name) is shrunk until it fits,
          // instead of running off the canvas
          g.font = d.font("display", size);
          const longest = Math.max(0, ...GRS.tokens(t.headline).map((tk) => g.measureText(tk.w).width));
          if (longest > maxW) size = Math.max(2 * u, (size * maxW) / longest * 0.97);
          const min = Math.min(Math.round(size), Math.max(size * 0.8, 4.8 * u));
          let hm = null, L = cfg.headLines, n = 0;
          for (; L <= cfg.headLines + 1; L++) {
            hm = d.headline(0, 0, { measure: true, size, min, lines: L, maxW, lh: 1.04 });
            n = hm.lines.reduce((a, l) => a + l.length, 0);
            if (n >= tokN && hm.w <= maxW + 1) break;
          }
          L = Math.min(L, cfg.headLines + 1);
          if (n < tokN || hm.w > maxW + 1) ok = false;
          const HL = L;
          parts.push({ h: hm.h, draw: (x, y) => d.headline(x, y, { size, min, lines: HL, maxW, lh: 1.04, align: al, color: ink, hi: hiC }) });
        }
        if (lv.sub && t.sub) {
          const s = cfg.sub * u * f, o = { size: s, min: s * 0.9, kind: "body", weight: 500, maxW, lines: 2, lh: 1.25 };
          const m = d.text(t.sub, 0, 0, { ...o, measure: true });
          if (m.lines.join(" ").length >= t.sub.replace(/\s+/g, " ").length) parts.push({ h: m.h, draw: (x, y) => d.text(t.sub, x, y, { ...o, color: subC, align: al }) });
        }
        if (lv.chips && t.badges.length) {
          const s = cfg.chk * u * f;
          for (let n = Math.min(lv.chips, t.badges.length); n >= 1; n--) {
            const m = checklist(0, 0, maxW, s, n, true);
            if (m.fits && m.rows <= cfg.chkRows) { const N = n; parts.push({ h: m.h, draw: (x, y) => checklist(x, y, maxW, s, N, false) }); break; }
          }
        }
        if (lv.proof && (t.proof || t.rating)) {
          const s = cfg.proof * u * f, m = proofRow(0, 0, s, maxW, true);
          if (m.w && m.w <= maxW) parts.push({ h: s * 1.4, draw: (x, y) => proofRow(x, y, s, maxW, false) });
        }
        if (lv.ends && t.endsText) {
          const s = cfg.proof * u * f, tw = label(t.endsText, 0, 0, s, { measure: true }), w = s * 1.6 + tw;
          if (w <= maxW) parts.push({ h: s * 1.4, draw: (x, y) => { const xx = ax(x, w); clock(xx + s * 0.55, y + s * 0.7, s * 0.5, endsC); label(t.endsText, xx + s * 1.6, y + s * 0.7, s, { color: endsC, tag: "ends" }); } });
        }
        if (t.price || t.cta) {
          const ps = cfg.price * u * f, cs = cfg.cta * u * f, gx = 3 * u * f;
          const pOpt = { size: ps, color: brandInk, oldColor: d.rgba(ink, 0.45), prefixColor: subC };
          const cOpt = { size: cs, bg: ctaBg, fg: ctaFg };
          const pm = t.price ? d.price(0, 0, { ...pOpt, measure: true }) : { w: 0, h: 0 };
          const sm = t.price ? d.price(0, 0, { ...pOpt, measure: true, stacked: true }) : { w: 0, h: 0 };
          const cm = t.cta ? d.cta(0, 0, { ...cOpt, measure: true }) : { w: 0, h: 0 };
          const both = pm.w && cm.w ? gx : 0;
          let row;
          if (pm.w + both + cm.w <= maxW) row = { inline: true, stacked: false, pw: pm.w, ph: pm.h, h: Math.max(pm.h, cm.h) };
          else if (sm.w + both + cm.w <= maxW) row = { inline: true, stacked: true, pw: sm.w, ph: sm.h, h: Math.max(sm.h, cm.h) };
          else {
            const stk = pm.w > maxW, pw = stk ? sm.w : pm.w, ph = stk ? sm.h : pm.h;
            if (pw > maxW || cm.w > maxW) ok = false;
            row = { inline: false, stacked: stk, pw, ph, h: ph + (t.cta ? gap + cm.h : 0) };
          }
          parts.push({ h: row.h, rule: true, draw: (x, y) => {
            if (row.inline) {
              const gw = row.pw + both + cm.w, x0 = al === "center" ? x + (maxW - gw) / 2 : x;
              if (t.price) d.price(x0, y + (row.h - row.ph) / 2, { ...pOpt, stacked: row.stacked });
              if (t.cta) d.cta(al === "center" ? x0 + row.pw + both : x + maxW - cm.w, y + (row.h - cm.h) / 2, cOpt);
            } else {
              if (t.price) d.price(ax(x, row.pw), y, { ...pOpt, stacked: row.stacked });
              if (t.cta) d.cta(ax(x, cm.w), y + (t.price ? row.ph + gap : 0), cOpt);
            }
          } });
        }
        const extra = gap * 0.9;
        const total = parts.reduce((a, p, i) => a + p.h + (i ? gap + (p.rule ? extra : 0) : 0), 0);
        return { h: total, ok, draw: (x, y) => {
          let yy = y;
          parts.forEach((p, i) => {
            if (i) {
              yy += gap + (p.rule ? extra : 0);
              if (p.rule) { g.fillStyle = d.rgba(ink, 0.13); g.fillRect(x, yy - (gap + extra) / 2, maxW, Math.max(1, 0.12 * u)); }
            }
            p.draw(x, yy); yy += p.h;
          });
        } };
      }
      function fitBand(avail, maxW, strict) {
        const start = k.boost * (d.scale || 1);
        const fMin = Math.min(start, Math.max(5 / cfg.head, 2.2 / cfg.chk, 2.2 / cfg.cta));
        const mid = Math.max(fMin, start * 0.88);
        const range = (lv, hi, lo) => { for (let f = hi; f >= lo - 1e-6; f -= 0.04) { const B = band(f, lv, maxW); if (B.ok && B.h <= avail) return B; } return null; };
        // strict: only accept the band with (nearly) everything in it at (nearly) full size, else null
        if (strict) { for (const lv of LEVELS.slice(0, 3)) { const B = range(lv, start, mid); if (B) return B; } return null; }
        for (const lv of LEVELS) { if (lv.late) continue; const B = range(lv, start, mid); if (B) return B; }
        // then shrink step by step, at each size preferring to drop optional parts over shrinking further
        for (let f = mid; f >= fMin - 1e-6; f -= 0.04) for (const lv of LEVELS) { if (lv.late) continue; const B = band(f, lv, maxW); if (B.ok && B.h <= avail) return B; }
        for (const lv of LEVELS) { if (!lv.late) continue; const B = range(lv, start, fMin); if (B) return B; }
        const last = LEVELS[LEVELS.length - 1];
        return range(last, fMin, 0.5) || band(0.5, last, maxW);
      }

      /* ---------- the comparison: two halves, a slanted seam, a slider knob ---------- */
      function compare(x, y, w, h, o = {}) {
        const tilt = h * 0.045, sx = x + w * 0.5, xt = sx + tilt, xb = sx - tilt;
        const left = () => { g.beginPath(); g.moveTo(x - 2, y - 2); g.lineTo(xt, y - 2); g.lineTo(xb, y + h + 2); g.lineTo(x - 2, y + h + 2); g.closePath(); };
        const right = () => { g.beginPath(); g.moveTo(xt, y - 2); g.lineTo(x + w + 2, y - 2); g.lineTo(x + w + 2, y + h + 2); g.lineTo(xb, y + h + 2); g.closePath(); };
        g.save();
        if (o.outer) { o.outer(); g.clip(); }
        g.fillStyle = "#D9D9D9"; g.fillRect(x, y, w, h);
        if (real) {
          d.photo(x, y, Math.max(xt, xb) - x, h, { i: 0, clip: left });
          d.photo(Math.min(xt, xb), y, x + w - Math.min(xt, xb), h, { i: 1, clip: right });
        } else {
          d.photo(x, y, w, h, { i: 0, clip: left, filter: FX_BEFORE });
          d.photo(x, y, w, h, { i: 0, clip: right, filter: FX_AFTER });
          const ax0 = sx, aw = x + w - sx, S = o.spark || u;
          // a flat veil on the before side (strength follows the seller's "shade over photo" slider),
          // a soft glow on the after side (reads even on grey photos)
          const veil = 0.12 * Math.max(0.3, Math.min(1.3, d.overlay ?? 1));
          g.save(); left(); g.clip(); g.fillStyle = `rgba(96,98,108,${veil.toFixed(3)})`; g.fillRect(x, y, w, h); g.restore();
          g.save(); right(); g.clip();
          const gl = g.createRadialGradient(ax0 + aw * 0.42, y + h * 0.38, 0, ax0 + aw * 0.42, y + h * 0.38, Math.max(aw, h) * 0.75);
          // a grey sample (near-black / white brand) can't get more vivid, so the AFTER side gets a warm glow instead
          const warm = !d.photoCount && d.toHsl(P)[1] < 0.2;
          gl.addColorStop(0, warm ? "rgba(255,214,150,.42)" : "rgba(255,255,255,.22)"); gl.addColorStop(1, warm ? "rgba(255,214,150,0)" : "rgba(255,255,255,0)");
          g.fillStyle = gl; g.fillRect(x, y, w, h); g.restore();
          // a little sparkle on the after side
          g.save(); g.shadowColor = "rgba(255,255,255,.95)"; g.shadowBlur = 1.6 * S;
          [[0.3, 0.34, 2.3], [0.44, 0.24, 1.3], [0.2, 0.46, 1]].forEach(([fx, fy, r]) => d.star(ax0 + aw * fx, y + h * fy, r * S, "rgba(255,255,255,.95)", 4, 0.2));
          g.restore();
        }
        // divider
        g.save(); g.strokeStyle = "#FFFFFF"; g.lineWidth = Math.max(2, (o.line || 0.55 * u)); g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 1.4 * u;
        g.beginPath(); g.moveTo(xt, y - 2); g.lineTo(xb, y + h + 2); g.stroke(); g.restore();
        g.restore();
        // knob
        const ky = o.knobY ?? y + h / 2, kx = xt + (xb - xt) * ((ky - y) / h), R = o.knobR || 4.6 * u;
        g.save(); g.shadowColor = "rgba(0,0,0,.32)"; g.shadowBlur = R * 0.5; g.shadowOffsetY = R * 0.1; d.circle(kx, ky, R, "#FFFFFF"); g.restore();
        g.save(); g.strokeStyle = P; g.lineWidth = R * 0.12; d.circle(kx, ky, R * 0.84); g.stroke();
        g.fillStyle = sealInk; g.strokeStyle = sealInk; g.lineJoin = "round"; g.lineWidth = R * 0.08;
        const a = R * 0.3, gp = R * 0.12;
        [-1, 1].forEach((dir) => { g.beginPath(); g.moveTo(kx + dir * gp, ky - a); g.lineTo(kx + dir * (gp + a * 0.95), ky); g.lineTo(kx + dir * gp, ky + a); g.closePath(); g.fill(); g.stroke(); });
        g.restore();
        return { xt, xb };
      }

      /* label pill on the photo */
      function pill(x, y, h, txt0, o) {
        const s = h * 0.4, L = bn ? 0 : 0.12, padX = h * 0.46;
        const txt = bn ? txt0 : txt0.toUpperCase();
        const tw = label(txt, 0, 0, s, { measure: true, letter: L, weight: 700 });
        const icW = o.icon ? s * 1.15 + s * 0.4 : 0, w = padX * 2 + icW + tw;
        const px = o.align === "right" ? x - w : x;
        g.save(); g.fillStyle = o.bg; g.shadowColor = "rgba(0,0,0,.22)"; g.shadowBlur = h * 0.3; g.shadowOffsetY = h * 0.05; d.rr(px, y, w, h, h / 2); g.fill(); g.restore();
        let tx = px + padX;
        if (o.icon) { tick(tx + s * 0.55, y + h / 2, s * 1.1, o.fg, Math.max(1.5, s * 0.17)); tx += icW; }
        label(txt, tx, y + h / 2, s, { color: o.fg, letter: L, tag: o.tag });
        return { x: px, w };
      }

      /* the seller's logo on a white plate, or the brand name on a white pill */
      function brandTag(x, y, maxW, h) {
        if (maxW < h * 1.5) return;
        if (d.hasLogo) { d.logo(x, y, maxW, h, { plate: "#FFFFFF", color: ink }); return; }
        if (!t.brand) return;
        const s = h * 0.38, padX = h * 0.42;
        const txt = bn ? t.brand : t.brand.toUpperCase();
        let L = bn ? 0 : 0.1, sz = s, tw = label(txt, 0, 0, sz, { measure: true, letter: L });
        while (tw + padX * 2 > maxW && sz > s * 0.72) { sz -= 1; tw = label(txt, 0, 0, sz, { measure: true, letter: L }); }
        if (tw + padX * 2 > maxW) return;
        g.save(); g.fillStyle = "rgba(255,255,255,.95)"; g.shadowColor = "rgba(0,0,0,.18)"; g.shadowBlur = h * 0.28; g.shadowOffsetY = h * 0.06; d.rr(x, y, tw + padX * 2, h, h / 2); g.fill(); g.restore();
        label(txt, x + padX, y + h / 2, sz, { color: ink, letter: L, tag: "brand" });
      }

      /* seal sticker (-25% / chosen sticker) */
      function seal(cx, cy, R) {
        if (!d.sticker(cx, cy, R, { shape: "badge", fill: sealFill, fg: sealInk, rot: -0.16 })) return false;
        g.save(); g.strokeStyle = d.rgba(sealInk, 0.35); g.lineWidth = Math.max(1.5, R * 0.035); d.circle(cx, cy, R * 0.85); g.stroke(); g.restore();
        return true;
      }

      /* card-framed comparison with its overlays (square / portrait / landscape) */
      function card(x, y, w, h, o) {
        const r = 3.2 * u, fr = 0.9 * u;
        g.save(); g.shadowColor = d.rgba(c.dark, 0.2); g.shadowBlur = 5 * u; g.shadowOffsetY = 1.8 * u; g.fillStyle = "#FFFFFF"; d.rr(x, y, w, h, r); g.fill(); g.restore();
        const ix = x + fr, iy = y + fr, iw = w - fr * 2, ih = h - fr * 2, ir = r - fr * 0.6;
        const sm = compare(ix, iy, iw, ih, { outer: () => d.rr(ix, iy, iw, ih, ir), knobR: o.knobR, spark: o.spark });
        const ins = o.ins, ph = o.pillH, R = o.R;
        const scx = ix + iw - ins - R * 0.92, scy = iy + ins + R * 0.92;
        seal(scx, scy, R);
        brandTag(ix + ins, iy + ins, Math.min(iw * 0.42, sm.xt - (ix + ins) - 2 * u), ph);
        const py = iy + ih - ins - ph;
        pill(ix + ins, py, ph, t.before, { align: "left", bg: "rgba(255,255,255,.93)", fg: ink, tag: "before" });
        pill(ix + iw - ins, py, ph, t.after, { align: "right", bg: P, fg: c.onPrimary, icon: true, tag: "after" });
      }

      /* ---------- background ---------- */
      g.fillStyle = bg; g.fillRect(0, 0, W, H);

      if (k.landscape) {
        d.pattern("grid", 0, 0, W, H, gridC, { size: 3.6 * u, line: Math.max(1, 0.12 * u) });
        const PW = Math.round(W * 0.53), x0 = k.side * 0.8, y0 = k.top * 0.8, PH = H - y0 * 2;
        card(x0, y0, PW, PH, { ins: 2.6 * u, pillH: 5.8 * u, R: 9.5 * u, knobR: 5.4 * u, spark: 1.1 * u });
        const tx = x0 + PW + 6 * u, colW = W - k.side - tx, availH = H - k.top - k.bottom;
        const B = fitBand(availH, colW);
        B.draw(tx, k.top + Math.max(0, (availH - B.h) / 2));
        return;
      }

      if (k.story) {
        // offer sheet on TOP (the profile bar sits over its empty head-room), comparison full-bleed
        // below it: the photo fills the bottom of the frame, so nothing is dead under the Reels caption
        const pad = 4.6 * u, ph = 6.4 * u, R = 9.6 * u;
        const hasBrand = d.hasLogo || !!t.brand;
        const textTop = k.top + (hasBrand ? ph + 3.4 * u : 0);
        // text that ends above 45% height can use the full width (the Reels buttons start at 45%);
        // a longer stack keeps the narrower safe column
        const wideW = W - k.side * 2;
        const wide = fitBand(H * 0.45 - textTop, wideW, true);
        const colW = wide ? wideW : k.maxW;
        const B = wide || fitBand(H * 0.5 - pad - textTop, k.maxW);
        const sheetB = Math.max(H * 0.36, textTop + B.h + pad);
        const visBot = H - H * 0.2;
        compare(0, sheetB - 8 * u, W, H - sheetB + 8 * u, { knobY: (sheetB + visBot) / 2, knobR: 6 * u, line: 0.7 * u, spark: 1.4 * u });
        // top sheet with a rounded lower edge
        g.save(); g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = 4 * u; g.shadowOffsetY = 0.8 * u; g.fillStyle = bg; d.rr(0, -10 * u, W, sheetB + 10 * u, 5 * u); g.fill(); g.restore();
        g.save(); d.rr(0, -10 * u, W, sheetB + 10 * u, 5 * u); g.clip();
        d.pattern("grid", 0, 0, W, sheetB, gridC, { size: 3.6 * u, line: Math.max(1, 0.12 * u) });
        // a soft brand glow in the head-room so the top of the frame isn't flat
        const gl = g.createRadialGradient(W * 0.86, 0, 0, W * 0.86, 0, W * 0.75);
        gl.addColorStop(0, d.rgba(P, lightP ? 0.38 : 0.2)); gl.addColorStop(1, d.rgba(P, 0));
        g.fillStyle = gl; g.fillRect(0, 0, W, sheetB);
        g.restore();
        if (hasBrand) brandTag(k.side, k.top, W * 0.55, ph);
        const tx = al === "center" ? (W - colW) / 2 : k.side;
        B.draw(tx, textTop + Math.max(0, (sheetB - pad - textTop - B.h) / 2));
        // labels just under the sheet (left of the Reels buttons), seal low on the AFTER side, above the caption zone
        const pin = W * 0.12 + 1.5 * u, py = sheetB + 3 * u;
        pill(pin, py, ph, t.before, { align: "left", bg: "rgba(255,255,255,.93)", fg: ink, tag: "before" });
        pill(W - pin, py, ph, t.after, { align: "right", bg: P, fg: c.onPrimary, icon: true, tag: "after" });
        seal(W * 0.88 - R - 2.5 * u, visBot - R - 3 * u, R);
        return;
      }

      // square + portrait: framed comparison card on top, offer band below
      d.pattern("grid", 0, 0, W, H, gridC, { size: 3.6 * u, line: Math.max(1, 0.12 * u) });
      const x0 = k.side, cw = W - k.side * 2, gapPB = 4.4 * u;
      const minPanel = (k.square ? 0.49 : 0.52) * H;
      const B = fitBand(H - k.top - k.bottom - minPanel - gapPB, cw);
      const PH = H - k.top - k.bottom - gapPB - B.h;
      card(x0, k.top, cw, PH, k.square
        ? { ins: 2.4 * u, pillH: 5.2 * u, R: 8 * u, knobR: 4.6 * u, spark: u }
        : { ins: 2.6 * u, pillH: 5.4 * u, R: 8.6 * u, knobR: 4.9 * u, spark: 1.1 * u });
      B.draw(x0, k.top + PH + gapPB);
    },
  });
})();
