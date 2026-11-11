/* Combo deal: up to three products on soft podiums (or framed photo tiles) joined by big "+" signs,
   then "=" and the combo price with a "Save ৳…" coupon. Light, clean, brand-tinted.
   1 photo  → one hero product (+ a "×3" / "৩টি" tag when the headline names a quantity)
   2 photos → two products, one "+"
   3 photos or none (samples) → three products, two "+"; the seller's main photo stands in the middle */
GRS.register({
  id: "combo", name: "Combo deal", group: "sale", photos: 3, cutout: "best",
  desc: "Products joined with + and = the combo price",
  draw(d) {
    const { g, W, H, k, t, c, u, st } = d;
    const bn = t.lang === "bn";
    const INK = c.ink;
    const PI2 = Math.PI * 2;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    /* ---------------- what we show ---------------- */
    const N = d.photoCount ? Math.min(3, d.photoCount) : 3;
    const idx = N === 3 ? [1, 0, 2] : N === 2 ? [0, 1] : [0];      // photo 0 = the hero, in the middle
    const heroJ = N === 3 ? 1 : 0;
    const WTS = N === 3 ? [0.86, 1.12, 0.86] : N === 2 ? [1, 1] : [1];
    const cutMode = idx.every((i) => d.hasCutout(i));              // all cut-outs → podiums, otherwise framed tiles

    /* ---------------- colour ---------------- */
    const sat = d.toHsl(c.primary)[1];
    const neutral = sat < 0.12;
    const lightBrand = d.lum(c.primary) > 0.42;
    // pale brands (butter yellow, blush) need a stronger wash or the ad reads as plain cream
    const bgA = neutral ? "#F8F5EF" : d.mix(c.primary, "#FFFFFF", lightBrand ? 0.8 : 0.94);
    const bgB = neutral ? "#ECE5D9" : d.mix(c.primary, "#FFFFFF", lightBrand ? 0.58 : 0.84);
    const deepen = (col, bg, target) => { for (let m = 0; m <= 1.0001; m += 0.05) { const x = d.mix(col, INK, m); if (d.contrast(x, bg) >= target) return x; } return INK; };
    const pc = lightBrand ? INK : deepen(c.primary, bgB, 3.6);                    // brand colour as text
    const symFill = lightBrand ? INK : c.primary, symFg = lightBrand ? c.primary : c.onPrimary;   // + and = discs
    const podBase = neutral ? "#B9AC98" : c.primary;
    const ctaBg = lightBrand ? INK : c.primary;
    const ctaFg = lightBrand ? (d.contrast(c.primary, INK) >= 4.5 ? c.primary : "#FFFFFF") : c.onPrimary;
    const hiCol = lightBrand ? INK : d.contrast(pc, INK) < 1.6 ? deepen(c.accent, bgB, 3.2) : pc;
    const hiBg = lightBrand ? c.primary : undefined;
    const mute = d.rgba(INK, 0.72);

    /* ---------------- fixed copy (EN + BN) ---------------- */
    const latin = (s) => String(s).replace(/[০-৯]/g, (ch) => "০১২৩৪৫৬৭৮৯".indexOf(ch));
    const said = latin(`${t.headline} ${t.sub}`).toLowerCase();
    const saysCombo = /combo|কম্বো|\d\s*-?\s*(in|ইন)\s*-?\s*1/.test(said);
    const eyebrow = saysCombo ? (bn ? "বান্ডেল অফার" : "BUNDLE OFFER")
      : N > 1 ? (bn ? `${t.loc(N)}-ইন-১ কম্বো` : `${N}-IN-1 COMBO`)
      : (bn ? "কম্বো অফার" : "COMBO DEAL");
    // one photo: a quantity tag when the headline names one ("3-in-1", "3 pcs", "৩টি", "pack of 3", "x3")
    let qty = 0, in1 = false;
    if (N === 1) {
      let m = /(\d)\s*-?\s*(?:in|ইন)\s*-?\s*1/.exec(said);
      if (m) { qty = +m[1]; in1 = true; }
      else if ((m = /(\d{1,2})\s*(?:টি|টা|পিস|pcs|pc|pieces|piece|items|x)(?![a-z])/.exec(said)) || (m = /pack\s+of\s+(\d{1,2})/.exec(said)) || (m = /(?:^|\s)[x×]\s*(\d{1,2})(?!\d)/.exec(said))) qty = +m[1];
      if (qty < 2 || qty > 12) qty = 0;
    }
    const qtyText = qty ? (bn ? `${t.loc(qty)}টি` : in1 ? `${qty}-IN-1` : `×${qty}`) : "";
    const saveAmt = t.old ? Math.round(st.old) - Math.round(st.price) : 0;
    const saveText = saveAmt > 0 ? (bn ? `৳${t.num(saveAmt)} সাশ্রয়` : `SAVE ৳${t.num(saveAmt)}`) : "";
    const pctLine = saveAmt > 0 && t.pct ? `${t.loc(t.pct)}% ${t.L.off}` : "";
    // the auto "-25%" sticker would repeat the coupon, so only a sticker the seller picked is drawn
    const stickerOn = st.sticker && st.sticker !== "auto" && st.sticker !== "none" && !!t.stickerText;

    /* ---------------- background ---------------- */
    const bgr = g.createLinearGradient(0, 0, 0, H);
    bgr.addColorStop(0, bgA); bgr.addColorStop(1, bgB);
    g.fillStyle = bgr; g.fillRect(0, 0, W, H);
    const decoCol = lightBrand ? d.mix(c.primary, INK, 0.35) : c.primary;
    const plusGlyph = (x, y, s, col, rot = 0) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col;
      const T = s * 0.32; d.rr(-s / 2, -T / 2, s, T, T / 2); g.fill(); d.rr(-T / 2, -s / 2, T, s, T / 2); g.fill(); g.restore();
    };
    { // faint "+" confetti, the style's motif (deterministic)
      const R = d.rnd(k.landscape ? 31 : k.story ? 17 : k.portrait ? 23 : 11), n = k.story ? 22 : k.landscape ? 14 : 16;
      for (let i = 0; i < n; i++) {
        const x = R() * W, y = R() * H, s = (1.1 + R() * 1.8) * u, a = 0.08 + R() * 0.12, r = R();
        if (r < 0.62) plusGlyph(x, y, s, d.rgba(decoCol, a), R() * 0.5);
        else { g.save(); g.strokeStyle = d.rgba(decoCol, a); g.lineWidth = s * 0.16; g.beginPath(); g.arc(x, y, s * 0.42, 0, PI2); g.stroke(); g.restore(); }
      }
    }

    /* ---------------- small drawing helpers ---------------- */
    const softShadow = (cx, cy, rx, ry, a) => {
      if (!(rx > 0 && ry > 0)) return;
      g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, `rgba(20,17,13,${a})`); gr.addColorStop(1, "rgba(20,17,13,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, PI2); g.fill(); g.restore();
    };
    // the round "+" / "=" disc that strings the combo together
    const sym = (cx, cy, R, kind) => {
      g.save();
      g.shadowColor = "rgba(20,17,13,.22)"; g.shadowBlur = 1.6 * u; g.shadowOffsetY = 0.5 * u;
      g.fillStyle = symFill; g.beginPath(); g.arc(cx, cy, R, 0, PI2); g.fill();
      g.shadowColor = "transparent";
      g.strokeStyle = "#FFFFFF"; g.lineWidth = Math.max(2, R * 0.11); g.stroke();
      g.fillStyle = symFg;
      const L = R * 0.94, T = R * 0.25;
      if (kind === "+") { d.rr(cx - L / 2, cy - T / 2, L, T, T / 2); g.fill(); d.rr(cx - T / 2, cy - L / 2, T, L, T / 2); g.fill(); }
      else { d.rr(cx - L / 2, cy - T * 1.3, L, T, T / 2); g.fill(); d.rr(cx - L / 2, cy + T * 0.3, L, T, T / 2); g.fill(); }
      g.restore();
    };
    const tick = (cx, cy, r) => {
      g.save(); g.fillStyle = symFill; g.beginPath(); g.arc(cx, cy, r, 0, PI2); g.fill();
      g.strokeStyle = symFg; g.lineWidth = r * 0.26; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(cx - r * 0.44, cy + r * 0.02); g.lineTo(cx - r * 0.12, cy + r * 0.34); g.lineTo(cx + r * 0.46, cy - r * 0.3); g.stroke(); g.restore();
    };
    const clock = (cx, cy, r) => {
      g.save(); g.strokeStyle = pc; g.lineWidth = r * 0.22; g.lineCap = "round";
      g.beginPath(); g.arc(cx, cy, r, 0, PI2); g.stroke();
      g.beginPath(); g.moveTo(cx, cy - r * 0.55); g.lineTo(cx, cy); g.lineTo(cx + r * 0.42, cy + r * 0.24); g.stroke(); g.restore();
    };

    /* ---------------- the products ---------------- */
    // sample cut-outs carry wide transparent margins: use their visible bounds so they stand on the podium at full size
    const SAMPLE_BOX = [[140, 40, 340, 730], [60, 220, 500, 540], [160, 140, 300, 670]];
    const cutSrc = (i) => {
      const img = d.source(i, true);
      if (d.photoCount || img.width !== 620 || img.height !== 860) return { img, sx: 0, sy: 0, sw: img.width, sh: img.height };
      const b = SAMPLE_BOX[i] || SAMPLE_BOX[0], p = 6;
      return { img, sx: b[0] - p, sy: b[1] - p, sw: b[2] + p * 2, sh: b[3] + p * 2 };
    };
    const slots = (x, w, gap) => {
      const sum = WTS.reduce((a, b) => a + b, 0), free = w - gap * (WTS.length - 1);
      let xx = x;
      return WTS.map((wt) => { const sw = (free * wt) / sum, s = { x: xx, w: sw, cx: xx + sw / 2 }; xx += sw + gap; return s; });
    };
    const GAP_CUT = 1.7, GAP_TILE = 1.3;   // gap between products, in disc radii
    const podDims = (sw, dw, hero) => { const rx = Math.min(sw * 0.5, Math.max(dw * 0.78, N === 1 ? 0 : sw * 0.36)); return { rx, ry: rx * 0.2, podH: sw * (hero ? 0.13 : 0.085) * (N === 1 ? 0.6 : 1) }; };
    const cutGeo = (x, y, w, h, R) => slots(x, w, R * GAP_CUT).map((s, j) => {
      const i = idx[j], cs = cutSrc(i), hero = N < 3 || j === heroJ, shrink = hero ? 1 : 0.8;
      const sw = N === 1 ? Math.min(s.w, h * 1.1) : s.w;
      const fit = (ry, podH) => { const topY = y + h - ry - podH; const sc = Math.max(0.01, Math.min((sw * 0.9) / cs.sw, ((topY - y) * shrink) / cs.sh)); return { topY, dw: cs.sw * sc, dh: cs.sh * sc }; };
      let f1 = fit(sw * 0.09, sw * 0.1);
      const pd = podDims(sw, f1.dw, hero);
      f1 = fit(pd.ry, pd.podH);
      return { i, j, cs, cx: s.cx, sw, s, hero, ...pd, ...f1 };
    });
    const cutNatural = (w, R) => Math.max(...slots(0, w, R * GAP_CUT).map((s, j) => {
      const cs = cutSrc(idx[j]), hero = N < 3 || j === heroJ, dw = s.w * 0.9, dh = (dw * cs.sh) / cs.sw, pd = podDims(s.w, dw, hero);
      return dh / (hero ? 1 : 0.8) + pd.ry + pd.podH;
    }));
    const tileGeo = (x, y, w, h, R, solo) => slots(x, w, R * GAP_TILE).map((s, j) => {
      const hero = N < 3 || j === heroJ;
      // portrait-ish tiles (up to 4:5) so a tall stage is filled instead of leaving a gap under square tiles
      let tw = Math.min(s.w, h * (hero ? 0.92 : 0.78)), th = Math.min(h * (hero ? 0.94 : 0.8), tw * (hero ? 1.36 : 1.28));
      if (N === 1) { tw = Math.min(w * (solo ? 0.9 : 0.82), h * (solo ? 0.84 : 0.8)); th = Math.min(h * 0.9, tw * 1.22); }
      const rot = N === 1 ? 0 : N === 2 ? (j ? 0.05 : -0.05) : (j - 1) * 0.065;
      return { i: idx[j], j, cx: s.cx, cy: y + h / 2 + (hero ? -h * 0.01 : h * 0.03), tw, th, rot, hero, s };
    });
    const tileNatural = (w, R) => { if (N === 1) return w * 1.2; const S = slots(0, w, R * GAP_TILE); return (S[heroJ].w * 1.36) / 0.94 + 2 * u; };
    const stageNatural = (w, R) => (cutMode ? cutNatural(w, R) : tileNatural(w, R));
    // visible width of a single product drawn in a w × h box (cut-out on its podium, or the photo tile)
    const soloW = (w, h, R) => {
      if (cutMode) { const p = cutGeo(0, 0, w, h, R)[0]; return Math.min(w, Math.max(p.rx * 2, p.dw)); }
      return tileGeo(0, 0, w, h, R, true)[0].tw * 1.1;   // + the fanned cards behind it
    };

    const podium = (cx, topY, rx, ry, ph) => {
      softShadow(cx, topY + ph + ry * 0.35, rx * 1.2, ry * 1.3, 0.16);
      const gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
      gr.addColorStop(0, d.mix(podBase, "#FFFFFF", 0.58)); gr.addColorStop(0.42, d.mix(podBase, "#FFFFFF", 0.86)); gr.addColorStop(1, d.mix(podBase, "#FFFFFF", 0.5));
      g.fillStyle = gr; g.beginPath();
      g.moveTo(cx - rx, topY); g.lineTo(cx - rx, topY + ph); g.ellipse(cx, topY + ph, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, topY); g.closePath(); g.fill();
      const tg = g.createLinearGradient(0, topY - ry, 0, topY + ry);
      tg.addColorStop(0, "#FFFFFF"); tg.addColorStop(1, d.mix(podBase, "#FFFFFF", 0.9));
      g.fillStyle = tg; g.beginPath(); g.ellipse(cx, topY, rx, ry, 0, 0, PI2); g.fill();
      g.strokeStyle = d.rgba(podBase, 0.2); g.lineWidth = Math.max(1, 0.18 * u); g.stroke();
    };
    const tile = (p) => {
      const { cx, cy, tw, th, rot, i } = p, pad = Math.max(0.8 * u, tw * 0.035), r = Math.min(tw, th) * 0.09;
      g.save(); g.translate(cx, cy);
      if (N === 1) {
        // one photo: two blank cards fanned behind it read as "a set" without repeating the photo
        [[-0.075, -0.04, 0.62], [0.06, 0.035, 0.82]].forEach(([a, ox, m]) => {
          g.save(); g.rotate(a); g.translate(tw * ox, 0);
          g.shadowColor = "rgba(20,17,13,.16)"; g.shadowBlur = 2.4 * u; g.shadowOffsetY = 0.8 * u;
          g.fillStyle = d.mix(podBase, "#FFFFFF", m); d.rr(-tw / 2, -th / 2, tw, th, r + pad * 0.6); g.fill();
          g.shadowColor = "transparent"; g.strokeStyle = "#FFFFFF"; g.lineWidth = Math.max(2, pad * 0.5); g.stroke();
          g.restore();
        });
      }
      g.rotate(rot);
      g.shadowColor = "rgba(20,17,13,.24)"; g.shadowBlur = 3.6 * u; g.shadowOffsetY = 1.4 * u;
      g.fillStyle = "#FFFFFF"; d.rr(-tw / 2, -th / 2, tw, th, r + pad * 0.6); g.fill();
      g.shadowColor = "transparent";
      const ix = -tw / 2 + pad, iy = -th / 2 + pad, iw = tw - pad * 2, ih = th - pad * 2;
      d.photo(ix, iy, iw, ih, { i, clip: () => d.rr(ix, iy, iw, ih, r) });
      g.restore();
    };

    /* draws the products in the box; o.plusY puts the "+" discs on that line. Returns the hero's rectangle. */
    function stage(x, y, w, h, R, o = {}) {
      // never wider than the products need: keeps the "+" snug when the height is short
      const nat = stageNatural(w, R);
      if (N > 1 && h < nat) { const nw = Math.max(w * 0.6, (w * h) / nat); x += (w - nw) / 2; w = nw; }
      // soft light behind the set
      const gcx = x + w / 2, gcy = y + h * 0.58, gr = Math.max(w * 0.55, h * 0.6);
      g.save(); g.translate(gcx, gcy); g.scale(1, clamp(h / w, 0.45, 1));
      const glow = g.createRadialGradient(0, 0, 0, 0, 0, gr);
      glow.addColorStop(0, "rgba(255,255,255,.9)"); glow.addColorStop(0.5, "rgba(255,255,255,.4)"); glow.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = glow; g.beginPath(); g.arc(0, 0, gr, 0, PI2); g.fill(); g.restore();

      let hero = null, last = null; const plus = [];
      if (cutMode) {
        const P = cutGeo(x, y, w, h, R);
        P.forEach((p) => {
          podium(p.cx, p.topY, p.rx, p.ry, p.podH);
          const base = p.topY + p.ry * 0.12, dx = p.cx - p.dw / 2, dy = base - p.dh;
          softShadow(p.cx, base, p.dw * 0.52, p.ry * 0.5, 0.34);
          g.save(); g.shadowColor = "rgba(20,17,13,.2)"; g.shadowBlur = 2.2 * u; g.shadowOffsetY = 0.9 * u;
          g.drawImage(p.cs.img, p.cs.sx, p.cs.sy, p.cs.sw, p.cs.sh, dx, dy, p.dw, p.dh);
          g.restore();
          p.rect = { x: dx, y: dy, w: p.dw, h: p.dh };
          if (p.j === heroJ) hero = p.rect;
        });
        last = P[P.length - 1].rect;
        for (let j = 0; j < P.length - 1; j++) {
          const a = P[j], b = P[j + 1], px = (a.cx + a.dw / 2 + b.cx - b.dw / 2) / 2;
          const lo = Math.max(a.rect.y, b.rect.y) + R, hi = Math.min(a.topY, b.topY) - R * 0.3;
          const py = o.plusY != null ? clamp(o.plusY, lo, hi) : clamp(Math.max(a.rect.y + a.dh * 0.5, b.rect.y + b.dh * 0.5), lo, hi);
          plus.push([clamp(px, a.cx + R * 0.6, b.cx - R * 0.6), py]);
        }
      } else {
        const P = tileGeo(x, y, w, h, R, o.solo);
        P.slice().sort((a, b) => (a.hero ? 1 : 0) - (b.hero ? 1 : 0)).forEach(tile);   // the hero tile on top
        P.forEach((p) => { p.rect = { x: p.cx - p.tw / 2, y: p.cy - p.th / 2, w: p.tw, h: p.th }; if (p.j === heroJ) hero = p.rect; });
        last = P[P.length - 1].rect;
        for (let j = 0; j < P.length - 1; j++) {
          const a = P[j], b = P[j + 1], px = (a.s.x + a.s.w + b.s.x) / 2;
          const lo = Math.max(a.cy - a.th / 2, b.cy - b.th / 2) + R, hi = Math.min(a.cy + a.th / 2, b.cy + b.th / 2) - R;
          plus.push([px, o.plusY != null ? clamp(o.plusY, lo, hi) : (a.cy + b.cy) / 2]);
        }
      }
      plus.forEach(([px, py]) => sym(px, py, R, "+"));
      // with two products the hero is on the left: its right corner would sit on the "+", so the sticker goes on the right product
      if (hero && last) hero.stickerOn = N === 2 ? last : hero;
      return hero;
    }

    /* the seller's sticker and the quantity tag, pinned to the hero product, kept inside `box` */
    function heroBadges(hero, box) {
      if (!hero) return;
      if (stickerOn) {
        const sr = hero.stickerOn || hero;
        const R = clamp(Math.min(sr.w, sr.h) * 0.24, 5.6 * u, 8.5 * u);
        let cx = clamp(sr.x + sr.w + R * 0.1, box.x + R, box.x + box.w - R), cy = clamp(sr.y + R * 0.6, box.y + R, box.y + box.h - R);
        if (k.story && cx + R > W * 0.88 && cy + R > H * 0.45) cx = W * 0.88 - R - u;
        d.sticker(cx, cy, R, { shape: "badge", fill: INK, fg: "#FFFFFF", rot: 0.12 });
      }
      if (qtyText) {
        const s = clamp(hero.h * 0.095, 3.4 * u, 5.4 * u);
        g.font = d.font("display", s, 800);
        const tw = g.measureText(qtyText).width, pw = tw + s * 1.2, ph = s * 1.75;
        const x = clamp(hero.x - pw * 0.2, box.x, box.x + box.w - pw), y = clamp(hero.y + ph * 0.3, box.y, box.y + box.h - ph);
        g.save(); g.shadowColor = "rgba(20,17,13,.22)"; g.shadowBlur = 1.4 * u; g.shadowOffsetY = 0.4 * u;
        g.fillStyle = symFill; d.rr(x, y, pw, ph, ph / 2); g.fill(); g.restore();
        d.text(qtyText, x, y + (ph - s * 1.12) / 2 + s * 0.04, { size: s, weight: 800, color: symFg, align: "center", maxW: pw, lines: 1 });
      }
    }

    /* ---------------- text parts: each returns { h, draw(x, y) } ---------------- */
    const ax = (x, maxW, w, al) => (al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x);
    // brand row: logo (or brand name) on the left, the "3-IN-1 COMBO" pill on the right
    function barPlan(h, maxW, al) {
      const es = h * 0.44, ls = bn ? 0 : es * 0.12;
      g.font = d.font("body", es, 800);
      const tw = g.measureText(eyebrow).width + ls * eyebrow.length;
      const ic = es * 0.95, pw = Math.min(tw + es * 1.6 + ic + es * 0.5, maxW), ph = es * 2.15;
      const hasL = d.hasLogo || !!t.brand, bh = Math.max(hasL ? h : 0, ph);
      const pill = (x, y) => {
        g.save();
        g.fillStyle = lightBrand ? d.rgba(c.primary, 0.55) : d.rgba(c.primary, 0.1); d.rr(x, y, pw, ph, ph / 2); g.fill();
        g.strokeStyle = d.rgba(pc, 0.55); g.lineWidth = Math.max(1.5, es * 0.09); g.stroke();
        plusGlyph(x + es * 0.8 + ic / 2, y + ph / 2, ic, pc);
        g.font = d.font("body", es, 800); g.fillStyle = pc; g.textBaseline = "middle"; g.textAlign = "left";
        if ("letterSpacing" in g) g.letterSpacing = `${ls}px`;
        const tx = x + es * 0.8 + ic + es * 0.5;
        g.fillText(eyebrow, tx, y + ph / 2 + es * 0.06, Math.max(1, pw - (tx - x) - es * 0.6));
        g.restore();
        d.tag("eyebrow"); d.mark(x, y, pw, ph); d.tag("");
      };
      return { h: bh, draw: (x, y) => {
        const py = y + (bh - ph) / 2;
        if (!hasL) { pill(ax(x, maxW, pw, al), py); return; }
        const lmax = Math.max(maxW - pw - 3 * u, maxW * 0.3);
        if (d.hasLogo) d.logo(x, y + (bh - h) / 2, lmax, h, { align: "left", color: INK });
        else {
          const s = h * 0.5, sp = 0.1 * s * t.brand.length;
          d.text(t.brand, x, y + (bh - s * 1.12) / 2, { size: s, min: s * 0.6, kind: "body", weight: 800, color: INK, upper: true, letter: 0.1, maxW: Math.max(s * 3, lmax - sp), lines: 1 });
        }
        pill(x + maxW - pw, py);
      } };
    }
    // short combo names ("New arrival", "৩টি একসাথে") get a bigger start size; long ones shrink to fit
    const headLen = [...t.headline.replace(/\*/g, "")].length;
    const headBoost = headLen <= 12 ? 1.22 : headLen <= 16 ? 1.1 : 1;
    function headPlan(size, lines, maxW, al) {
      if (!t.headline) return null;
      size *= headBoost;
      const O = { size, min: Math.max(5 * u, size * 0.62), lines, maxW, align: al, color: INK, hi: hiCol, hiBg };
      const m = d.headline(0, 0, { ...O, measure: true });
      return { h: m.h, draw: (x, y) => d.headline(x, y, O) };
    }
    function subPlan(s, maxW, al) {
      if (!t.sub) return null;
      const O = { size: s, kind: "body", weight: 500, color: mute, align: al, maxW, lines: 2, lh: 1.25 };
      const m = d.text(t.sub, 0, 0, { ...O, measure: true });
      return { h: m.h, draw: (x, y) => d.text(t.sub, x, y, O) };
    }
    function proofPlan(s, maxW, al) {
      if (!(t.proof || t.rating)) return null;
      const label = t.proof ? (t.ratingText ? `${t.ratingText} · ${t.proof}` : t.proof) : t.ratingText;
      const ss = s * 1.05, sw = t.rating ? 5 * ss + 4 * ss * 0.18 : 0, gap = sw ? s * 0.6 : 0;
      g.font = d.font("body", s, 600);
      const lw = Math.min(g.measureText(label).width, maxW - sw - gap), w = sw + gap + lw, h = s * 1.4;
      return { h, draw: (x, y) => {
        let xx = ax(x, maxW, w, al);
        if (t.rating) { d.stars(xx, y + (h - ss) / 2, ss, { color: "#F2A900", empty: d.rgba(INK, 0.14) }); xx += sw + gap; }
        d.text(label, xx, y + (h - s * 1.12) / 2, { size: s, kind: "body", weight: 600, color: mute, maxW: lw + 2, lines: 1 });
      } };
    }
    // coupon with notched sides: "SAVE ৳500 / 25% OFF"
    function couponPlan(s) {
      if (!saveText) return null;
      const s2 = s * 0.6;
      g.font = d.font("display", s, 800); const w1 = g.measureText(saveText).width;
      g.font = d.font("body", s2, 700); const w2 = pctLine ? g.measureText(pctLine).width : 0;
      const padX = s * 0.95, padY = s * 0.5;
      return { s, s2, padX, padY, w: Math.max(w1, w2) + padX * 2, h: s * 1.12 + (pctLine ? s2 * 1.3 : 0) + padY * 2 };
    }
    function couponDraw(m, x, y) {
      const { w, h, s, s2, padY } = m, n = h * 0.13, r = Math.min(h * 0.18, 1.6 * u);
      const path = () => {
        g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
        g.lineTo(x + w, y + h / 2 - n); g.arc(x + w, y + h / 2, n, -Math.PI / 2, Math.PI / 2, true);
        g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r); g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
        g.lineTo(x, y + h / 2 + n); g.arc(x, y + h / 2, n, Math.PI / 2, -Math.PI / 2, true);
        g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
      };
      g.save();
      g.translate(x + w / 2, y + h / 2); g.rotate(-0.04); g.translate(-(x + w / 2), -(y + h / 2));
      g.shadowColor = "rgba(20,17,13,.22)"; g.shadowBlur = 1.8 * u; g.shadowOffsetY = 0.6 * u;
      g.fillStyle = c.accent; path(); g.fill();
      g.shadowColor = "transparent";
      g.strokeStyle = d.rgba(c.onAccent, 0.4); g.lineWidth = Math.max(1, 0.16 * u);
      if (g.setLineDash) g.setLineDash([0.7 * u, 0.55 * u]);
      const ins = Math.max(0.6 * u, h * 0.07);
      d.rr(x + n + ins * 0.6, y + ins, w - 2 * n - ins * 1.2, h - ins * 2, r * 0.6); g.stroke();
      if (g.setLineDash) g.setLineDash([]);
      d.text(saveText, x, y + padY, { size: s, weight: 800, color: c.onAccent, align: "center", maxW: w, lines: 1 });
      if (pctLine) d.text(pctLine, x, y + padY + s * 1.12 + s2 * 0.12, { size: s2, kind: "body", weight: 700, color: d.rgba(c.onAccent, 0.86), align: "center", maxW: w, lines: 1 });
      g.restore();
    }
    // "= ৳1,499 [SAVE ৳500]": the = disc (optional), the stacked price, the coupon. Reports where the price line is.
    function pricePlan(ps, maxW, al, withEq) {
      if (!t.price) return null;
      const mk = (ps) => {
        const pm = d.price(0, 0, { measure: true, size: ps, stacked: true });
        const mid = (t.old || t.prefix ? ps * 0.55 : 0) + ps * 0.5;      // centre of the big digits
        const cp = couponPlan(ps * 0.36);
        const eqR = withEq ? ps * 0.42 : 0, g1 = ps * 0.24, g2 = ps * 0.26;
        const w = (eqR ? eqR * 2 + g1 : 0) + pm.w + (cp ? g2 + cp.w : 0);
        const top = Math.min(0, mid - eqR, cp ? mid - cp.h / 2 : 0), bot = Math.max(pm.h, mid + eqR, cp ? mid + cp.h / 2 : 0);
        return { ps, pm, mid, cp, eqR, g1, g2, w, off: -top, h: bot - top };
      };
      let m = mk(ps);
      if (m.w > maxW) m = mk((ps * maxW) / m.w);
      return { ...m, draw: (x, y) => {
        let xx = ax(x, maxW, m.w, al);
        const y0 = y + m.off, cy = y0 + m.mid;
        if (m.eqR) { sym(xx + m.eqR, cy, m.eqR, "="); xx += m.eqR * 2 + m.g1; }
        d.price(xx, y0, { size: m.ps, stacked: true, color: pc, oldColor: d.rgba(INK, 0.45), prefixColor: d.rgba(INK, 0.6) });
        if (m.cp) couponDraw(m.cp, xx + m.pm.w + m.g2, cy - m.cp.h / 2);
      } };
    }
    // the same offer as a column ("৳1,999 / ৳1,499 / [SAVE ৳500]") for the one-product equation row
    function priceColPlan(ps, maxW) {
      if (!t.price) return null;
      const mk = (ps) => {
        const pm = d.price(0, 0, { measure: true, size: ps, stacked: true });
        const cp = couponPlan(ps * 0.36), gap = ps * 0.34;
        return { ps, pm, cp, gap, w: Math.max(pm.w, cp ? cp.w + ps * 0.1 : 0), h: pm.h + (cp ? gap + cp.h : 0), mid: (t.old || t.prefix ? ps * 0.55 : 0) + ps * 0.5 };
      };
      let m = mk(ps);
      if (m.w > maxW) m = mk((ps * maxW) / m.w);
      return { ...m, draw: (x, y) => {
        d.price(x, y, { size: m.ps, stacked: true, color: pc, oldColor: d.rgba(INK, 0.45), prefixColor: d.rgba(INK, 0.6) });
        if (m.cp) couponDraw(m.cp, x + m.ps * 0.05, y + m.pm.h + m.gap);
      } };
    }
    // checklist items: the seller's badges with ticks; the offer-end date with a clock
    const listItems = (L, max) => {
      const out = t.badges.slice(0, L.chips).map((b) => ({ ic: "tick", text: b }));
      if (L.ends && t.endsText) out.splice(Math.min(1, out.length), 0, { ic: "clock", text: t.endsText });
      return out.slice(0, max);
    };
    const itemDraw = (it, x, y, s, rowH, tw) => {
      const ic = s * 1.08, gi = s * 0.45;
      if (it.ic === "tick") tick(x + ic / 2, y + rowH / 2, ic / 2); else clock(x + ic / 2, y + rowH / 2, ic * 0.44);
      d.text(it.text, x + ic + gi, y + (rowH - s * 1.12) / 2 + s * 0.03, { size: s, kind: "body", weight: it.ic === "tick" ? 600 : 700, color: d.rgba(INK, 0.8), maxW: tw + 2, lines: 1 });
    };
    // the CTA, with the checklist beside it when there is room (else below it, wrapping)
    function actionPlan(L, f, maxW, al, S, sideRows, inlineRows) {
      const s = S.cta * u * f, ls = S.trust * u * f;
      const cm = t.cta ? d.cta(0, 0, { measure: true, size: s }) : null;
      const ic = ls * 1.08, gi = ls * 0.45, rowH = ls * 1.6, gy = ls * 0.32;
      const meas = (it) => { g.font = d.font("body", ls, 700); return Math.min(g.measureText(it.text).width, maxW - ic - gi); };
      const drawCta = (bx, y) => {
        g.save(); g.shadowColor = d.rgba(ctaBg, 0.35); g.shadowBlur = 2.2 * u; g.shadowOffsetY = 0.9 * u; g.fillStyle = ctaBg; d.rr(bx, y, cm.w, cm.h, cm.h / 2); g.fill(); g.restore();
        d.cta(bx, y, { size: s, bg: ctaBg, fg: ctaFg });
      };
      if (cm && sideRows) {
        const items = listItems(L, sideRows);
        if (items.length) {
          const tws = items.map(meas), lw = ic + gi + Math.max(...tws), gx = 3.6 * u * f;
          const lh = items.length * rowH + (items.length - 1) * gy, w = cm.w + gx + lw, h = Math.max(cm.h, lh);
          if (w <= maxW) return [{ h, draw: (x, y) => {
            const x0 = ax(x, maxW, w, al);
            drawCta(x0, y + (h - cm.h) / 2);
            let yy = y + (h - lh) / 2;
            items.forEach((it, i) => { itemDraw(it, x0 + cm.w + gx, yy, ls, rowH, tws[i]); yy += rowH + gy; });
          } }];
        }
      }
      const rows = [];
      if (cm) rows.push({ h: cm.h, draw: (x, y) => drawCta(ax(x, maxW, cm.w, al), y) });
      const items = inlineRows ? listItems(L, 8) : [];
      if (items.length) {
        const gx = ls * 1.3, lines = [[]]; let rw = 0;
        for (const it of items) {
          const tw = meas(it), w = ic + gi + tw;
          if (lines[lines.length - 1].length && rw + gx + w > maxW) { if (lines.length >= inlineRows) break; lines.push([]); rw = 0; }
          lines[lines.length - 1].push({ it, tw, w }); rw += (rw ? gx : 0) + w;
        }
        const h = lines.length * rowH + (lines.length - 1) * gy;
        rows.push({ h, gap: rows.length ? 2 * u * f : 0, draw: (x, y) => lines.forEach((ln, li) => {
          const lwid = ln.reduce((a, e) => a + e.w, 0) + gx * (ln.length - 1);
          let xx = ax(x, maxW, lwid, al);
          ln.forEach((e) => { itemDraw(e.it, xx, y + li * (rowH + gy), ls, rowH, e.tw); xx += e.w + gx; });
        }) });
      }
      return rows;
    }

    // what to give up, in order, before shrinking the text further
    const LEVELS = [
      { sub: 1, proof: 1, ends: 1, chips: 3 },
      { sub: 1, proof: 1, ends: 0, chips: 3 },
      { sub: 1, proof: 0, ends: 0, chips: 3 },
      { sub: 0, proof: 0, ends: 0, chips: 3 },
      { sub: 0, proof: 0, ends: 0, chips: 2 },
      { sub: 0, proof: 0, ends: 0, chips: 0 },
    ];
    const f0 = k.boost * (d.scale || 1);
    function choose(build, ok) {
      for (const L of LEVELS) for (let f = f0; f >= f0 * 0.86 - 1e-6; f -= 0.035) { const p = build(L, f); if (ok(p)) return p; }
      const last = LEVELS[LEVELS.length - 1];
      for (let f = f0 * 0.83; f > 0.5; f -= 0.04) { const p = build(last, f); if (ok(p)) return p; }
      return build(last, 0.5);
    }
    const stackH = (rows) => rows.reduce((a, r, i) => a + r.h + (i ? r.gap ?? 0 : 0), 0);
    const stackDraw = (rows, x, y) => { let yy = y; rows.forEach((r, i) => { if (i) yy += r.gap ?? 0; r.draw(x, yy); r.y = yy; yy += r.h; }); };
    const add = (rows, p, gap) => { if (p) rows.push({ ...p, h: p.h, gap }); };

    /* ---------------- landscape: products in a row, "=" and the offer on the right ---------------- */
    if (k.landscape) {
      const al = d.align("left");
      const colW = W * 0.37, colX = W - k.side - colW, avail = H - k.top - k.bottom;
      const S = { bar: 4.8, head: 7.8, sub: 3.1, proof: 2.8, price: 11.6, cta: 3.6, trust: 2.8 };
      const build = (L, f) => {
        const rows = [];
        add(rows, barPlan(S.bar * u * f, colW, al), 0);
        add(rows, headPlan(S.head * u * f, 2, colW, al), 2.6 * u * f);
        if (L.sub) add(rows, subPlan(S.sub * u * f, colW, al), 1.4 * u * f);
        if (L.proof) add(rows, proofPlan(S.proof * u * f, colW, al), 1.6 * u * f);
        const pr = pricePlan(S.price * u * f, colW, al, false);
        if (pr) rows.push({ ...pr, gap: 3.2 * u * f, price: true });
        actionPlan(L, f, colW, al, S, 0, 1).forEach((r, i) => rows.push({ ...r, gap: i ? r.gap : 3 * u * f }));
        return { rows, h: stackH(rows), pr };
      };
      const plan = choose(build, (p) => p.h <= avail);
      const y0 = k.top + Math.max(0, (avail - plan.h) / 2);
      // where the price line lands, so the "+" and "=" discs share it
      let priceY = H / 2;
      { let yy = y0; plan.rows.forEach((r, i) => { if (i) yy += r.gap ?? 0; if (r.price) priceY = yy + r.off + r.mid; yy += r.h; }); }
      const R = clamp(plan.pr ? plan.pr.ps * 0.4 : 4.4 * u, 3.6 * u, 6 * u);
      const gut = R * 2 + 4.4 * u, sx = k.side * 0.8, sw = colX - gut - sx;
      const sTop = k.top * 0.6, sBot = H - k.bottom * 0.6;
      const sh = Math.min(sBot - sTop, stageNatural(sw, R));
      const stY = clamp(priceY - sh * 0.6, sTop, sBot - sh);
      const hero = stage(sx, stY, sw, sh, R, { plusY: priceY });
      sym(colX - gut / 2, priceY, R, plan.pr ? "=" : "+");
      stackDraw(plan.rows, colX, y0);
      heroBadges(hero, { x: sx, y: sTop, w: sw, h: sBot - sTop });
      return;
    }

    /* ---------------- square / portrait / story: header, the products, "= price", CTA ---------------- */
    const al = d.align("center");
    const maxW = k.maxW, x0 = al === "center" ? (W - maxW) / 2 : k.side;
    const S = k.story ? { bar: 4.2, head: 7, lines: 3, sub: 2.8, proof: 2.5, price: 9, cta: 3.2, trust: 2.5, side: 3, inline: 2, minStage: 0.28 * H }
      : k.portrait ? { bar: 4.4, head: 7.6, lines: 3, sub: 3, proof: 2.6, price: 10, cta: 3.4, trust: 2.6, side: 3, inline: 2, minStage: 0.33 * H }
      : { bar: 4.2, head: 7.2, lines: 2, sub: 2.9, proof: 2.6, price: 9.4, cta: 3.3, trust: 2.6, side: 2, inline: 1, minStage: 0.3 * H };
    const avail = H - k.top - k.bottom;
    // one product in the square: an equation row, [product] = [price column], so the photo can be big
    const eq = N === 1 && k.square && !!t.price;
    const rowW = W - k.side * 2;
    const build = (L, f) => {
      const top = [], bot = [];
      add(top, barPlan(S.bar * u * f, maxW, al), 0);
      add(top, headPlan(S.head * u * f, S.lines, maxW, al), 3 * u * f);
      if (L.sub) add(top, subPlan(S.sub * u * f, maxW, al), 1.5 * u * f);
      if (L.proof) add(top, proofPlan(S.proof * u * f, maxW, al), 1.8 * u * f);
      let pr = null, col = null;
      if (eq) col = priceColPlan(S.price * u * f, rowW * 0.44);
      else { pr = pricePlan(S.price * u * f, maxW, al, true); if (pr) bot.push({ ...pr, gap: 0 }); }
      actionPlan(L, f, maxW, al, S, S.side, S.inline).forEach((r, i) => bot.push({ ...r, gap: i ? r.gap : bot.length ? 3 * u * f : 0 }));
      const gS = 2.8 * u * f, topH = stackH(top), botH = stackH(bot);
      return { top, bot, topH, botH, gS, pr, col, stage: avail - topH - botH - gS * 2 };
    };
    const plan = choose(build, (p) => (p.col ? p.stage >= 0.42 * H && p.col.h <= p.stage : p.stage >= S.minStage));
    const sTop = k.top + plan.topH + plan.gS, sBot = H - k.bottom - plan.botH - plan.gS;
    if (plan.col) {
      const col = plan.col, R = clamp(col.ps * 0.42, 3.4 * u, 6 * u), gq = 2.4 * u, rowH = sBot - sTop;
      const pw = rowW - col.w - 2 * R - 2 * gq, vw = soloW(pw, rowH, R);
      const gw = vw + 2 * gq + 2 * R + col.w;
      const gx = al === "center" ? (W - gw) / 2 : al === "right" ? W - k.side - gw : k.side;
      const hero = stage(gx + vw / 2 - pw / 2, sTop, pw, rowH, R, { solo: true });
      const cy = hero ? hero.y + hero.h / 2 : sTop + rowH / 2;
      const colY = clamp(cy - col.mid, sTop, sBot - col.h);
      sym(gx + vw + gq + R, colY + col.mid, R, "=");
      col.draw(gx + vw + 2 * gq + 2 * R, colY);
      stackDraw(plan.top, x0, k.top);
      stackDraw(plan.bot, x0, H - k.bottom - plan.botH);
      heroBadges(hero, { x: Math.max(k.side * 0.5, gx - 2 * u), y: sTop - 1.5 * u, w: vw + 4 * u, h: rowH + 1.5 * u });
      return;
    }
    const R = clamp(plan.pr ? plan.pr.eqR : 4.4 * u, 3.4 * u, 6 * u);
    const sw = W - k.side * 2, sh = Math.max(10, Math.min(sBot - sTop, stageNatural(sw, R)));
    const hero = stage(k.side, sTop + (sBot - sTop - sh) / 2, sw, sh, R);
    stackDraw(plan.top, x0, k.top);
    stackDraw(plan.bot, x0, H - k.bottom - plan.botH);
    heroBadges(hero, { x: k.side, y: sTop, w: (k.story ? W * 0.88 : W - k.side) - k.side, h: sBot - sTop });
  },
});
