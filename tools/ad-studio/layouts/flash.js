/* Flash sale: near-black stage tinted with the brand colour, yellow hazard tape, a giant
   "25% OFF" lockup, a countdown chip and the product bursting out of speed lines.
   For 11.11, Black Friday-style and daily deals. */
GRS.register({
  id: "flash", name: "Flash sale", group: "sale", photos: 1, cutout: "best",
  desc: "Hazard tape, giant % off, countdown chip",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const bn = t.lang === "bn";
    const up = (s) => (bn ? String(s) : String(s).toUpperCase());
    const TS = d.scale || 1;

    /* ---------------- colour ---------------- */
    const vivid = (hex) => { const [h, s, l] = d.toHsl(hex); return d.fromHsl(h, Math.max(s, 0.62), Math.min(0.64, Math.max(0.5, l))); };
    const [hue, sat, lig] = d.toHsl(c.primary);
    const grey = sat < 0.16;                                   // black / grey / white brands get a red "energy" colour
    const userAccent = /^#[\da-f]{6}$/i.test(d.st.accent || "") && d.toHsl(d.st.accent)[1] > 0.2;
    const hot = grey ? (userAccent ? vivid(c.accent) : c.red) : vivid(c.primary);
    const SALE = c.sale, INK = "#141216";
    const yellowish = !grey && hue > 36 && hue < 74 && lig > 0.4;   // brand already sale-yellow: keep the accents apart
    // yellow/olive brands turn muddy when darkened: tint the stage with the (complementary) accent instead
    const stageTint = yellowish ? vivid(c.accent) : hot;
    const base = grey ? d.mix(c.primary, "#0A0A0C", 0.72) : d.mix(stageTint, "#06060B", yellowish ? 0.84 : 0.86);
    const hotDeep = d.mix(yellowish ? stageTint : hot, "#000000", 0.52);
    const boltFill = yellowish ? "#FFFFFF" : SALE;
    const tagBg = yellowish ? "#FFFFFF" : hot, tagFg = d.onColor(tagBg);
    const heroMode = t.pct ? "pct" : t.price ? "price" : "";
    const headWords = GRS.tokens(t.headline).length;

    /* ---------------- drawn icons ---------------- */
    const BOLT = [[0.54, 0], [0.06, 0.58], [0.43, 0.58], [0.27, 1], [0.95, 0.38], [0.58, 0.38], [0.82, 0]];
    const boltPath = (x, y, w, h) => { g.beginPath(); BOLT.forEach(([px, py], i) => (i ? g.lineTo(x + px * w, y + py * h) : g.moveTo(x + px * w, y + py * h))); g.closePath(); };
    function clockIcon(cx, cy, r, color) {
      g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = r * 0.26; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
      g.fillRect(cx - r * 0.24, cy - r * 1.55, r * 0.48, r * 0.34);
      g.beginPath(); g.moveTo(cx, cy - r * 0.55); g.lineTo(cx, cy); g.lineTo(cx + r * 0.4, cy + r * 0.3); g.stroke();
      g.restore();
    }

    /* ---------------- stage: tinted near-black, glow, speed lines ---------------- */
    function stage(B) {
      g.fillStyle = base; g.fillRect(0, 0, W, H);
      let gr = g.createRadialGradient(B.x, B.y, 0, B.x, B.y, Math.max(W, H) * 0.95);
      gr.addColorStop(0, d.rgba(hot, 0.5)); gr.addColorStop(0.35, d.rgba(hot, 0.14)); gr.addColorStop(1, d.rgba(hot, 0));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const R = d.rnd(11), n = 60, far = Math.hypot(W, H);
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + R() * 0.05, wd = 0.006 + R() * 0.02, r0 = B.r * (0.7 + R() * 0.6);
        g.moveTo(B.x + Math.cos(a) * r0, B.y + Math.sin(a) * r0);
        g.lineTo(B.x + Math.cos(a - wd) * far, B.y + Math.sin(a - wd) * far);
        g.lineTo(B.x + Math.cos(a + wd) * far, B.y + Math.sin(a + wd) * far);
        g.closePath();
      }
      const lc = d.mix(hot, "#FFFFFF", 0.4);
      gr = g.createRadialGradient(B.x, B.y, B.r * 0.6, B.x, B.y, far * 0.8);
      gr.addColorStop(0, d.rgba(lc, 0)); gr.addColorStop(0.06, d.rgba(lc, 0.34)); gr.addColorStop(0.42, d.rgba(lc, 0.07)); gr.addColorStop(1, d.rgba(lc, 0));
      g.fillStyle = gr; g.fill();
      d.pattern("diagonal", 0, 0, W, H, "rgba(255,255,255,.022)", { size: 2.4 * u, line: 0.5 * u });
    }

    /* ---------------- hazard tape: tilted band, striped edges, repeating label ---------------- */
    function tape(cy, ang, hh, style, phase) {
      const L = Math.hypot(W, H) + 40 * u;
      const bg = style === "ink" ? INK : SALE, fg = style === "ink" ? SALE : INK;
      g.save(); g.translate(W / 2, cy); g.rotate(ang);
      g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 2.4 * u; g.shadowOffsetY = 0.7 * u;
      g.fillStyle = bg; g.fillRect(-L / 2, -hh / 2, L, hh); g.restore();
      if (style === "plain") {
        // classic black/yellow hazard stripes, no words: pure decoration (used inside story danger zones)
        const s2 = hh * 0.9;
        g.save(); g.beginPath(); g.rect(-L / 2, -hh / 2, L, hh); g.clip(); g.beginPath();
        for (let x = -L / 2 - hh; x < L / 2 + hh; x += s2 * 2) { g.moveTo(x, hh / 2); g.lineTo(x + s2, hh / 2); g.lineTo(x + s2 + hh, -hh / 2); g.lineTo(x + hh, -hh / 2); g.closePath(); }
        g.fillStyle = INK; g.fill(); g.restore(); g.restore();
        return;
      }
      const e = hh * 0.15, s = e * 1.3;
      g.fillStyle = fg;
      [-hh / 2, hh / 2 - e].forEach((ey) => {
        g.save(); g.beginPath(); g.rect(-L / 2, ey, L, e); g.clip(); g.beginPath();
        for (let x = -L / 2 - 2 * s; x < L / 2 + 2 * s; x += s * 2) { g.moveTo(x, ey + e); g.lineTo(x + s, ey + e); g.lineTo(x + s + e, ey); g.lineTo(x + e, ey); g.closePath(); }
        g.fill(); g.restore();
      });
      const fs = (hh - e * 2) * 0.62;
      g.font = d.font("display", fs);
      const label = up(t.flash), m = g.measureText(label);
      const by = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      const bw = fs * 0.52, bH = fs * 0.86, sp = fs * 0.55, seg = m.width + sp * 2 + bw;
      g.textBaseline = "alphabetic"; g.textAlign = "left";
      for (let x = -L / 2 - seg + (phase || 0) * seg; x < L / 2; x += seg) {
        g.fillText(label, x, by);
        boltPath(x + m.width + sp, -bH / 2, bw, bH); g.fill();
      }
      g.restore();
    }

    /* ---------------- product: glowing burst + bolt + cut-out (or a framed card) ---------------- */
    const cut = d.hasCutout(0);
    // where the product will land (same maths as d.product / the card below), so the burst sits behind it
    function prodRect(P, valign) {
      if (!cut) { const cw = Math.min(P.w, P.h * (k.story ? 1.02 : 0.8)), ch = Math.min(P.h * 0.94, cw * 1.25); return { x: P.x + (P.w - cw) / 2, y: P.y + (P.h - ch) / 2, w: cw, h: ch }; }
      const img = d.source(0, true), z = d.st.zoom || 1;
      const s = Math.min(P.w / img.width, P.h / img.height) * z, w = img.width * s, h = img.height * s;
      return { x: P.x + (P.w - w) / 2 + (0.5 - (d.st.fx ?? 0.5)) * P.w * 0.6, y: valign === "center" ? P.y + (P.h - h) / 2 : P.y + P.h - h, w, h };
    }
    function burstFor(P, valign, maxR) {
      const r = prodRect(P, valign);
      return { x: r.x + r.w / 2, y: r.y + r.h * (cut ? 0.52 : 0.5), r: Math.min(maxR, Math.max(r.w, r.h) * (cut ? 0.56 : 0.62)), rect: r };
    }
    function burst(B) {
      g.save();
      const gr = g.createRadialGradient(B.x, B.y, 0, B.x, B.y, B.r);
      gr.addColorStop(0, d.mix(hot, "#FFFFFF", 0.55)); gr.addColorStop(0.6, hot); gr.addColorStop(1, d.mix(hot, "#000000", 0.2));
      g.shadowColor = d.rgba(hot, 0.85); g.shadowBlur = 7 * u;
      d.star(B.x, B.y, B.r, null, 22, 0.84); g.fillStyle = gr; g.fill();
      g.restore();
    }
    function productHero(P, B, valign) {
      const R0 = B.rect;
      const bolt = (bx, by, bh, rot) => {
        const bw = bh * 0.62;
        bx = Math.min(bx, W - bw * 0.62 - 1.5 * u);              // never cut by the canvas edge
        g.save(); g.translate(bx, by); g.rotate(rot);
        g.shadowColor = d.rgba(boltFill, 0.55); g.shadowBlur = 3 * u;
        boltPath(-bw / 2, -bh / 2, bw, bh); g.fillStyle = boltFill; g.fill();
        g.shadowBlur = 0; g.lineJoin = "round"; g.lineWidth = 0.6 * u; g.strokeStyle = INK; g.stroke();
        g.restore();
      };
      if (cut) {
        // the lightning bolt strikes from behind the cut-out's top-right
        const bh = Math.min(B.r * 1.25, R0.h * 0.75);
        bolt(R0.x + R0.w * 0.78, R0.y + bh * 0.42, bh, 0.22);
        return d.product(P.x, P.y, P.w, P.h, { valign, shadowColor: "rgba(0,0,0,.5)" });
      }
      // no cut-out: the photo on a tilted card with a sale-yellow frame
      const { w: cw, h: ch } = R0, fr = 1.1 * u;
      g.save(); g.translate(P.x + P.w / 2, P.y + P.h / 2); g.rotate(-0.05);
      g.save(); g.shadowColor = "rgba(0,0,0,.55)"; g.shadowBlur = 4 * u; g.shadowOffsetY = 1.6 * u;
      g.fillStyle = SALE; d.rr(-cw / 2, -ch / 2, cw, ch, 2.4 * u); g.fill(); g.restore();
      d.photo(-cw / 2 + fr, -ch / 2 + fr, cw - fr * 2, ch - fr * 2, { clip: () => d.rr(-cw / 2 + fr, -ch / 2 + fr, cw - fr * 2, ch - fr * 2, 1.6 * u) });
      g.restore();
      // card mode: a smaller bolt pinned over the card's bottom-right corner (stays clear of the text column and logo)
      const bh = Math.min(R0.h * 0.34, 22 * u);
      bolt(R0.x + R0.w - bh * 0.08, R0.y + R0.h - bh * 0.22, bh, 0.24);
      return R0;
    }
    function stickerAt(cx, cy, R) {
      if (t.pct && d.st.sticker === "auto") return;           // the % is already the hero
      d.sticker(cx, cy, R, { shape: "badge", fill: "#FFFFFF", fg: INK, rot: 0.16 });
    }

    /* ---------------- text pieces (each: measure → {w, h, draw(x, y)}) ---------------- */
    function lockGeo(S) {
      if (heroMode === "pct") {
        const num = t.loc(t.pct), off = bn ? "ছাড়" : "OFF";
        g.font = d.font("display", S); const mN = g.measureText(num);
        const asc = mN.actualBoundingBoxAscent, nw = mN.width;
        const s1 = S * 0.5, s2 = S * 0.25;
        g.font = d.font("display", s1); const mP = g.measureText("%");
        g.font = d.font("body", s2, 800); const mO = g.measureText(off);
        const pA = mP.actualBoundingBoxAscent, oA = mO.actualBoundingBoxAscent, oD = mO.actualBoundingBoxDescent;
        const px0 = s2 * 0.34, py0 = s2 * 0.22, tagH0 = oA + oD + py0 * 2, tagW0 = mO.width + px0 * 2, gap0 = S * 0.06;
        const q = asc / (pA + gap0 + tagH0);
        const colW = Math.max(mP.width, tagW0) * q, gx = S * 0.05, sh = S * 0.045;
        const w = nw + gx + colW + sh, h = asc + sh;
        return { S, w, h, draw(x, y) {
          g.save(); g.textBaseline = "alphabetic"; g.textAlign = "left";
          g.shadowColor = hotDeep; g.shadowOffsetX = sh; g.shadowOffsetY = sh; g.shadowBlur = 0;
          g.font = d.font("display", S); g.fillStyle = "#FFFFFF"; g.fillText(num, x, y + asc);
          const cx = x + nw + gx;
          g.font = d.font("display", s1 * q); g.fillStyle = SALE; g.fillText("%", cx, y + pA * q);
          const tH = tagH0 * q, tW = tagW0 * q, ty = y + asc - tH;
          g.fillStyle = tagBg; d.rr(cx, ty, tW, tH, tH * 0.2); g.fill();
          g.shadowColor = "transparent";
          g.font = d.font("body", s2 * q, 800); g.fillStyle = tagFg; g.fillText(off, cx + px0 * q, ty + (py0 + oA) * q);
          g.restore();
          d.tag("lockup"); d.mark(x, y, w, h); d.tag("");
        } };
      }
      if (heroMode === "price") {
        const lab = up(t.prefix || t.only);
        g.font = d.font("display", S); const mN = g.measureText(t.price);
        const asc = mN.actualBoundingBoxAscent, des = mN.actualBoundingBoxDescent;
        const ls = S * 0.2; g.font = d.font("body", ls, 800); const mL = g.measureText(lab);
        const ib = ls * 0.62, lw = ib + ls * 0.35 + mL.width, lh = ls * 1.2, gap = S * 0.1, sh = S * 0.045;
        const w = Math.max(mN.width + sh, lw), h = lh + gap + asc + Math.max(des, sh);
        return { S, w, h, draw(x, y) {
          g.save(); g.textBaseline = "alphabetic"; g.textAlign = "left";
          g.fillStyle = SALE; boltPath(x, y + lh * 0.08, ib, lh * 0.84); g.fill();
          g.font = d.font("body", ls, 800); g.fillText(lab, x + ib + ls * 0.35, y + ls * 0.98);
          g.shadowColor = hotDeep; g.shadowOffsetX = sh; g.shadowOffsetY = sh; g.shadowBlur = 0;
          g.font = d.font("display", S); g.fillStyle = "#FFFFFF"; g.fillText(t.price, x, y + lh + gap + asc);
          g.restore();
          d.tag("lockup"); d.mark(x, y, w, h); d.tag("");
        } };
      }
      return null;
    }
    function lockFit(S, maxW, maxH) {
      let L = lockGeo(S); if (!L) return null;
      if (L.w > maxW) L = lockGeo(L.S * (maxW / L.w) * 0.99);
      if (maxH && L.h > maxH) L = lockGeo(L.S * (maxH / L.h) * 0.99);
      return L;
    }
    function timerGeo(s, maxW) {
      const label = t.endsText ? up(t.endsText) : bn ? "শুধু আজ" : "TODAY ONLY";
      const r = s * 0.62, padX = s * 0.78, gi = s * 0.6, h = s * 2.2;
      const m = d.text(label, 0, 0, { measure: true, size: s, kind: "body", weight: 800, maxW: maxW - padX * 2 - r * 2 - gi, lines: 1, min: s * 0.75 });
      const w = padX * 2 + r * 2 + gi + m.w;
      return { w, h, draw(x, y) {
        g.save(); g.fillStyle = "rgba(0,0,0,.38)"; d.rr(x, y, w, h, h / 2); g.fill();
        g.strokeStyle = SALE; g.lineWidth = Math.max(2, s * 0.11); g.stroke(); g.restore();
        clockIcon(x + padX + r, y + h / 2 + r * 0.12, r * 0.8, SALE);
        d.text(label, x + padX + r * 2 + gi, y + (h - m.size * 1.12) / 2 + m.size * 0.05, { size: m.size, min: m.size, kind: "body", weight: 800, color: "#FFFFFF", maxW: m.w + 2, lines: 1 });
      } };
    }
    function ctaGeo(s, maxW) {
      if (!t.cta) return null;
      const label = up(t.cta), ic = s * 0.95, padX = s * 1.05, gi = s * 0.5, ph = s * 2.4, sh = s * 0.24;
      const m = d.text(label, 0, 0, { measure: true, size: s, kind: "body", weight: 800, maxW: maxW - padX * 2 - ic - gi, lines: 1, min: s * 0.72 });
      const w = padX * 2 + ic + gi + m.w;
      return { w, h: ph + sh, draw(x, y) {
        g.save();
        g.fillStyle = d.mix(SALE, "#000000", 0.5); d.rr(x, y + sh, w, ph, ph / 2); g.fill();
        g.fillStyle = SALE; d.rr(x, y, w, ph, ph / 2); g.fill();
        g.fillStyle = INK; boltPath(x + padX, y + (ph - ic * 1.25) / 2, ic * 0.78, ic * 1.25); g.fill();
        g.restore();
        d.text(label, x + padX + ic + gi, y + (ph - m.size * 1.12) / 2 + m.size * 0.06, { size: m.size, min: m.size, kind: "body", weight: 800, color: INK, maxW: m.w + 2, lines: 1 });
      } };
    }
    function priceGeo(s, maxW) {
      if (!t.price) return null;
      let m = d.price(0, 0, { measure: true, size: s });
      if (m.w > maxW) { s = s * (maxW / m.w) * 0.98; m = d.price(0, 0, { measure: true, size: s }); }
      return { w: m.w, h: m.h, draw(x, y) { d.price(x, y, { size: s, color: "#FFFFFF", oldColor: "rgba(255,255,255,.6)", prefixColor: SALE }); } };
    }
    function brandMark(x, y, maxW, h, al) {
      if (d.hasLogo) return d.logo(x, y, maxW, h, { align: al, plate: "#FFFFFF", color: "#FFFFFF" });
      if (!t.brand) return { w: 0, h: 0 };
      const s = h * 0.56;
      const m = d.text(up(t.brand), 0, 0, { measure: true, size: s, kind: "body", weight: 800, maxW, lines: 1, min: s * 0.7 });
      const yy = y + (h - m.size * 1.12) / 2;
      d.text(up(t.brand), x, yy, { size: s, min: s * 0.7, kind: "body", weight: 800, color: "#FFFFFF", maxW, lines: 1, align: al });
      return { w: m.w, h };
    }
    function topRow(x, y, w, h, ts) {
      const T = timerGeo(ts, w * 0.62);
      T.draw(x + w - T.w, y + (h - T.h) / 2);
      brandMark(x, y, Math.max(0, w - T.w - 3 * u), h, "left");
    }

    /* ---------------- stack composer: shrink a little, then drop optional parts ---------------- */
    const ax = (x, maxW, w, al) => (al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x);
    function item(key, f, maxW, cfg, chipMax, force) {
      if (key === "lock") {
        const L = lockFit(cfg.lock * f, maxW, cfg.lockH ? cfg.lockH * f : 0); if (!L) return null;
        return { h: L.h, draw: (x, y, al) => L.draw(ax(x, maxW, L.w, al), y) };
      }
      if (key === "head") {
        if (!t.headline) return null;
        const s0 = cfg.head * f, lines = cfg.headLines || 2, lh = bn ? 1.14 : 1.04;
        for (let s = Math.round(s0); s >= Math.round(s0 * 0.84); s -= 2) {
          const m = d.headline(0, 0, { measure: true, size: s, min: s, lines, maxW, upper: !bn, lh });
          if (m.lines.reduce((a, l) => a + l.length, 0) === headWords && m.w <= maxW + 1) {
            return { h: m.h, draw: (x, y, al) => d.headline(x, y, { size: s, min: s, lines, maxW, align: al, color: "#FFFFFF", hi: SALE, upper: !bn, lh }) };
          }
        }
        if (!force) return false;
        const s = Math.round(s0 * 0.78), m = d.headline(0, 0, { measure: true, size: s, min: s * 0.7, lines, maxW, upper: !bn, lh });
        return { h: m.h, draw: (x, y, al) => d.headline(x, y, { size: s, min: s * 0.7, lines, maxW, align: al, color: "#FFFFFF", hi: SALE, upper: !bn, lh }) };
      }
      if (key === "sub") {
        if (!t.sub) return null;
        const s = cfg.sub * f, o = { size: s, min: s * 0.85, kind: "body", weight: 500, maxW, lines: 2, lh: 1.25 };
        const m = d.text(t.sub, 0, 0, { ...o, measure: true });
        if (m.lines.join(" ").split(/\s+/).length < t.sub.split(/\s+/).length) return null;
        return { h: m.h, draw: (x, y, al) => d.text(t.sub, x, y, { ...o, align: al, color: "rgba(255,255,255,.8)" }) };
      }
      if (key === "price") {
        if (heroMode !== "pct") return null;
        const P = priceGeo(cfg.price * f, maxW); if (!P) return null;
        return { h: P.h, draw: (x, y, al) => P.draw(ax(x, maxW, P.w, al), y) };
      }
      if (key === "chips") {
        if (!t.badges.length || !chipMax) return null;
        const s = cfg.chip * f, o = { size: s, max: chipMax, bg: "rgba(255,255,255,.08)", fg: "#FFFFFF", stroke: "rgba(255,255,255,.22)", dot: SALE };
        const m = d.chips(0, 0, maxW, { ...o, measure: true });
        return { h: m.h, draw: (x, y, al) => d.chips(x, y, maxW, { ...o, align: al }) };
      }
      if (key === "proof") {
        if (!t.proof && !t.rating) return null;
        const s = cfg.proof * f, txt = [t.ratingText, t.proof].filter(Boolean).join(" · ");
        const sw = t.rating ? 5 * s * 1.05 + 4 * s * 1.05 * 0.18 : 0, gp = s * 0.6;
        const o = { size: s, min: s * 0.8, kind: "body", weight: 600, maxW: maxW - sw - gp, lines: 1 };
        const m = d.text(txt, 0, 0, { ...o, measure: true });
        if (m.lines[0] !== txt) return null;
        const w = sw + (sw ? gp : 0) + m.w;
        return { h: s * 1.3, draw: (x, y, al) => {
          let xx = ax(x, maxW, w, al);
          if (t.rating) { d.stars(xx, y + s * 0.08, s * 1.05, { color: SALE, empty: "rgba(255,255,255,.22)" }); xx += sw + gp; }
          d.text(txt, xx, y + s * 0.06, { ...o, color: "rgba(255,255,255,.88)", maxW: m.w + 2 });
        } };
      }
      if (key === "cta") {
        const C = ctaGeo(cfg.cta * f, maxW); if (!C) return null;
        return { h: C.h, gapK: 1.35, draw: (x, y, al) => C.draw(ax(x, maxW, C.w, al), y) };
      }
      if (key === "pricecta") {
        const P = heroMode === "pct" ? priceGeo(cfg.price * f, maxW) : null, C = ctaGeo(cfg.cta * f, maxW), gp = cfg.gap * f * 1.6;
        if (!P && !C) return null;
        if (P && C && P.w + gp + C.w <= maxW) {
          const h = Math.max(P.h, C.h);
          return { h, gapK: 1.2, draw: (x, y, al) => {
            if (al === "center") { const x0 = x + (maxW - P.w - gp - C.w) / 2; P.draw(x0, y + (h - P.h) / 2); C.draw(x0 + P.w + gp, y + (h - C.h) / 2); }
            else { P.draw(x, y + (h - P.h) / 2); C.draw(x + maxW - C.w, y + (h - C.h) / 2); }
          } };
        }
        const list = [P, C].filter(Boolean), gg = cfg.gap * f;
        const h = list.reduce((a, it, i) => a + it.h + (i ? gg : 0), 0);
        return { h, gapK: 1.2, draw: (x, y, al) => { let yy = y; list.forEach((it) => { it.draw(ax(x, maxW, it.w, al), yy); yy += it.h + gg; }); } };
      }
      return null;
    }
    function build(keys, f, maxW, cfg, chipMax, force) {
      const out = [];
      for (const key of keys) {
        const it = item(key, f, maxW, cfg, chipMax, force);
        if (it === false) return null;
        if (it && it.h > 0) { it.gap = (it.gapK || 1) * cfg.gap * f; out.push(it); }
      }
      const h = out.reduce((a, it, i) => a + it.h + (i ? it.gap : 0), 0);
      return { h, f, draw(x, y, al) { let yy = y; out.forEach((it, i) => { if (i) yy += it.gap; it.draw(x, yy, al); yy += it.h; }); } };
    }
    function compose(keys, drops, maxW, avail, cfg) {
      const minF = Math.min(0.8, TS * 0.8);
      let ks = keys.slice(), chipMax = cfg.chipMax ?? 3;
      const steps = drops.slice();
      // drop optional parts (proof, sub, extra chips) before shrinking the headline toward its legibility floor
      const softF = Math.max(minF, TS * 0.9);
      for (;;) {
        const lo = steps.length ? softF : minF;
        for (let f = TS; f >= lo - 1e-6; f -= 0.04) { const b = build(ks, f, maxW, cfg, chipMax); if (b && b.h <= avail) return b; }
        if (!steps.length) break;
        const s = steps.shift();
        if (s === "chips-") chipMax = chipMax > 2 ? 2 : 1; else ks = ks.filter((x) => x !== s);
      }
      for (let f = minF; f >= 0.55; f -= 0.04) { const b = build(ks, f, maxW, cfg, chipMax, true); if (b && b.h <= avail) return b; }
      return build(ks, 0.55, maxW, cfg, chipMax, true);
    }

    /* ================================ compositions ================================ */
    if (k.landscape) {
      const P = { x: 8 * u, y: 15 * u, w: 56 * u, h: H - 22 * u }, B = burstFor(P, "center", 30 * u);
      stage(B);
      tape(4.4 * u, -0.03, 7.4 * u, "sale", 0.35);
      burst(B);
      productHero(P, B, "center");
      stickerAt(P.x + P.w - 6 * u, P.y + 8 * u, 9 * u);
      const x = 72 * u, colW = W - k.side - x;
      topRow(x, 14 * u, colW, 5.2 * u, 2.5 * u);
      const top = 23 * u, avail = H - k.bottom - top;
      const b = compose(["lock", "head", "pricecta", "chips"], ["chips-", "chips"], colW, avail, { lock: 30 * u, lockH: 24 * u, head: 6.2 * u, headLines: 2, price: 6.6 * u, chip: 2.8 * u, chipMax: 3, cta: 3.2 * u, gap: 2.6 * u });
      b.draw(x, top + Math.max(0, (avail - b.h) / 2), d.align("left"));
      return;
    }

    if (k.story) {
      const lockTop = 34 * u;
      const L = lockFit(32 * u * TS, k.maxW, 23 * u * TS);
      const lockH = L ? L.h : 0;
      // the bottom stack is composed first and hugs the safe line (80%); the product takes whatever is left
      const bot = H * 0.79, stackMax = 38 * u;
      const b = compose(["head", "pricecta", "chips"], ["chips-", "chips"], k.maxW, stackMax, { head: 7.4 * u, headLines: 2, price: 8 * u, chip: 3.1 * u, chipMax: 3, cta: 3.9 * u, gap: 2.8 * u });
      const botTop = Math.min(118 * u, bot - b.h - 2 * u);
      const pTop = lockTop + lockH + 2 * u;
      const P = { x: 12 * u, y: pTop, w: W - 24 * u, h: botTop - 7 * u - pTop }, B = burstFor(P, "bottom", 32 * u);
      stage(B);
      tape(11.5 * u, -0.05, 9.5 * u, "sale", 0.2);
      burst(B);
      tape(botTop - 6 * u, 0.045, 8.5 * u, "ink", 0.6);
      tape(H - 13 * u, -0.06, 5 * u, "plain");                 // wordless hazard stripe, bottom danger zone
      productHero(P, B, "bottom");
      stickerAt(Math.min(W * 0.88 - 8 * u, B.x + B.r * 0.95), P.y + 7 * u, 8 * u);
      topRow(k.side, 26 * u, W - k.side * 2, 6 * u, 2.9 * u);
      const al = d.align("center");
      if (L) L.draw(al === "center" ? (W - L.w) / 2 : k.side, lockTop);
      b.draw(al === "center" ? (W - k.maxW) / 2 : k.side, botTop + Math.max(0, (bot - botTop - b.h) / 2), al);
      return;
    }

    if (k.portrait) {
      const tbY = 87 * u;
      const P = { x: 53 * u, y: 24 * u, w: 41 * u, h: tbY + 2 * u - 24 * u }, B = burstFor(P, "bottom", 27 * u);
      stage(B);
      tape(6.4 * u, -0.055, 8.6 * u, "sale", 0.3);
      burst(B);
      tape(tbY, 0.045, 8 * u, "ink", 0.6);
      productHero(P, B, "bottom");
      stickerAt(P.x + P.w - 4 * u, P.y + 6 * u, 7.5 * u);
      topRow(k.side, 16.5 * u, W - k.side * 2, 5 * u, 2.4 * u);
      const al = d.align("left");
      const colY = 25 * u, colW = 45 * u, colH = tbY - 50 * 0.045 * u - 4 * u - 3 * u - colY;
      const a = compose(["lock", "head", "sub", "proof"], ["proof", "sub"], colW, colH, { lock: 25 * u, head: 6.2 * u, headLines: 3, sub: 2.8 * u, proof: 2.5 * u, gap: 2.3 * u });
      a.draw(k.side, colY + Math.max(0, (colH - a.h) / 2), al);
      const bTop = tbY + 50 * 0.045 * u + 4 * u + 3.5 * u, bH = H - k.bottom - bTop;
      const b = compose(["pricecta", "chips"], ["chips-", "chips"], k.maxW, bH, { price: 6.8 * u, chip: 2.7 * u, chipMax: 4, cta: 3.2 * u, gap: 2.3 * u });
      b.draw(k.side, bTop + Math.max(0, (bH - b.h) / 2), al);
      return;
    }

    // square
    const P = { x: 56 * u, y: 25 * u, w: 38 * u, h: H - k.bottom - 27 * u }, B = burstFor(P, "center", 26 * u);
    stage(B);
    tape(6.4 * u, -0.055, 8.6 * u, "sale", 0.3);
    burst(B);
    productHero(P, B, "center");
    stickerAt(P.x + P.w - 4 * u, P.y + 6 * u, 7.5 * u);
    topRow(k.side, 16.5 * u, W - k.side * 2, 5 * u, 2.3 * u);
    const colY = 25 * u, colW = 48 * u, colH = H - k.bottom - colY;
    const b = compose(["lock", "head", "sub", "price", "chips", "proof", "cta"], ["proof", "sub", "chips-", "chips"], colW, colH, { lock: 25 * u, head: 6.2 * u, headLines: 3, sub: 2.8 * u, price: 6.4 * u, chip: 2.7 * u, chipMax: 2, proof: 2.5 * u, cta: 3.1 * u, gap: 2.3 * u });
    b.draw(k.side, colY + Math.max(0, (colH - b.h) / 2), d.align("left"));
  },
});
