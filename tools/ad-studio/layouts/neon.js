/* Neon night: a dark brick wall at night lit by neon tubes.
   - Two neon colours come from the brand: tube A = the brand colour made vivid, tube B = the accent.
     A near-black / grey / washed-out brand falls back to hot pink, a dull accent to cyan.
   - The headline is a neon sign (wide coloured glow, coloured rim, bright core; *highlight* in tube B).
   - With a cut-out the product stands in a neon ring with a coloured rim light and a floor glow;
     a seller photo sits inside a neon frame with corner tubes.
   - A small sign hangs on wires and reads the first badge (or "Open 24/7" when there are none).
   - Price in glowing digits, badges as neon outline pills, the CTA as a lit neon pill, the % off
     as a lit disc. Everything is drawn: no images, no emoji. */
(() => {
"use strict";
const BRICKS = {};   // brick texture per ad size (colour-independent, deterministic)
GRS.register({
  id: "neon", name: "Neon night", group: "bold", photos: 1, cutout: "best",
  desc: "Glowing neon signs on a dark brick wall",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const bn = t.lang === "bn";
    const up = (s) => (bn ? String(s) : String(s).toUpperCase());
    const TS = d.scale || 1;
    const TAU = Math.PI * 2;
    // canvas shadowBlur ignores the transform: scale every glow by the render scale so the small live
    // preview and the style thumbnails glow exactly like the full-size download (not a blurry smear)
    const Z = (g.getTransform ? g.getTransform().a : 1) || 1, ub = u * Z;

    /* ---------------- colour: two neon tubes from the brand ---------------- */
    const PINK = "#FF3EA5", CYAN = "#22E3FF";
    const hueOf = (h) => d.toHsl(h)[0];
    const hd = (a, b) => { const x = Math.abs(a - b) % 360; return Math.min(x, 360 - x); };
    const dull = (h) => { const [, s, l] = d.toHsl(h); return s < 0.28 || l < 0.14 || l > 0.97; };
    // a lit tube is bright: blues and violets get lifted until they read as light, not as a dark line
    const vivid = (h) => {
      const [hh, s0, l0] = d.toHsl(h), s = Math.max(s0, 0.88);
      let l = Math.min(0.68, Math.max(0.58, l0)), out = d.fromHsl(hh, s, l);
      while (d.lum(out) < 0.2 && l < 0.76) { l += 0.02; out = d.fromHsl(hh, s, l); }
      return out;
    };
    const A = dull(c.primary) ? PINK : vivid(c.primary);
    let B = dull(c.accent) ? CYAN : vivid(c.accent);
    if (hd(hueOf(A), hueOf(B)) < 40) B = hd(hueOf(A), hueOf(CYAN)) >= 60 ? CYAN : PINK;
    const coreA = d.mix(A, "#FFFFFF", 0.62), coreB = d.mix(B, "#FFFFFF", 0.55);
    // very bright tubes (yellow, lime) light the wall less, or the night turns olive and muddy
    const bright = d.lum(A) > 0.45, HZ = bright ? 0.62 : 1;
    const BG = d.mix(A, "#07060B", bright ? 0.955 : 0.93), INK = "#0B0910";
    const cut = d.hasCutout(0);

    /* ---------------- neon primitives ---------------- */
    // a glass tube: wide soft glow, the coloured tube, a bright core
    function tube(path, col, lw, blur) {
      const bl = (blur ?? 2.6 * u) * Z;
      g.save(); g.lineCap = "round"; g.lineJoin = "round";
      path();
      g.shadowColor = col; g.shadowBlur = bl; g.strokeStyle = d.rgba(col, 0.32); g.lineWidth = lw * 2.6; g.stroke();
      g.shadowBlur = 0; g.strokeStyle = col; g.lineWidth = lw; g.stroke();
      g.shadowBlur = 0; g.strokeStyle = d.mix(col, "#FFFFFF", 0.75); g.lineWidth = Math.max(1, lw * 0.36); g.stroke();
      g.restore();
    }
    function twinkle(x, y, r, col) {
      tube(() => { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); }, col, Math.max(1.5, 0.32 * u), 1.6 * u);
    }

    /* ---------------- the wall: dark bricks, coloured haze, vignette ---------------- */
    function wall(hx, hy, hr, sx, sy) {
      g.fillStyle = BG; g.fillRect(0, 0, W, H);
      // the brick texture is the same for every colour: drawn once per size, then reused
      const key = `${W}x${H}`;
      let tex = BRICKS[key];
      if (!tex) {
        tex = BRICKS[key] = document.createElement("canvas"); tex.width = W; tex.height = H;
        const x2 = tex.getContext("2d"), bw = 10 * u, bh = 4.4 * u, R = d.rnd(17);
        for (let row = 0, y = 0; y < H; row++, y += bh) {
          const off = row % 2 ? -bw / 2 : 0;
          for (let x = off; x < W; x += bw) {
            const v = R();
            if (v > 0.45) { x2.fillStyle = `rgba(255,255,255,${(0.008 + (v - 0.45) * 0.045).toFixed(3)})`; x2.fillRect(x, y, bw, bh); }
          }
        }
        x2.beginPath();
        for (let row = 0, y = 0; y < H + bh; row++, y += bh) {
          x2.moveTo(0, y); x2.lineTo(W, y);
          const off = row % 2 ? -bw / 2 : 0;
          for (let x = off; x < W; x += bw) { x2.moveTo(x, y); x2.lineTo(x, y + bh); }
        }
        x2.strokeStyle = "rgba(0,0,0,.55)"; x2.lineWidth = Math.max(1.5, 0.5 * u); x2.stroke();
      }
      g.drawImage(tex, 0, 0, W, H);
      // the neon lights the wall
      g.save(); g.globalCompositeOperation = "screen";
      let gr = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
      gr.addColorStop(0, d.rgba(A, 0.42 * HZ)); gr.addColorStop(0.42, d.rgba(A, 0.13 * HZ)); gr.addColorStop(1, d.rgba(A, 0));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (sx != null) {
        gr = g.createRadialGradient(sx, sy, 0, sx, sy, hr * 0.62);
        gr.addColorStop(0, d.rgba(B, 0.26)); gr.addColorStop(1, d.rgba(B, 0));
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      }
      g.restore();
      gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.hypot(W, H) * 0.62);
      gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.62)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }

    /* ---------------- product: neon ring + rim-lit cut-out, or a neon-framed photo ---------------- */
    // open: the ring is a horseshoe open at the bottom (the price sits in the opening on 9:16)
    function ring(cx, cy, R, open) {
      const gr = g.createRadialGradient(cx, cy, R * 0.15, cx, cy, R);
      gr.addColorStop(0, d.rgba(A, 0.18)); gr.addColorStop(1, d.rgba(A, 0.05));
      g.fillStyle = gr; d.circle(cx, cy, R); g.fill();
      const lw = Math.max(3, 0.95 * u), gh = 1.05;
      const segs = open ? [[Math.PI / 2 + gh, TAU - 2.1], [TAU - 1.95, TAU + Math.PI / 2 - gh]] : [[-1.95, 1.0], [1.16, TAU - 2.1]];
      tube(() => { g.beginPath(); segs.forEach(([a, b]) => { g.moveTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); g.arc(cx, cy, R, a, b); }); }, A, lw);
      // dark electrode caps where the tube breaks
      g.fillStyle = "#16131C";
      segs.flat().forEach((a) => { d.circle(cx + R * Math.cos(a), cy + R * Math.sin(a), lw * 0.62); g.fill(); });
      // a thinner second tube in the other colour (double-ring sign)
      const R2 = R + 2.4 * u, arcs = open ? [[-0.3, 0.3], [2.85, 3.45]] : [[-0.12, 0.7], [1.95, 2.6]];
      arcs.forEach(([a, b]) => tube(() => { g.beginPath(); g.arc(cx, cy, R2, a, b); }, B, lw * 0.55, 2 * u));
    }
    function hero(S) {
      if (cut) {
        ring(S.cx, S.cy, S.R, S.open);
        const P = S.open ? { x: S.cx - S.R * 0.95, y: S.cy - S.R * 1.28, w: S.R * 1.9, h: S.R * 1.9 } : { x: S.cx - S.R * 0.95, y: S.cy - S.R * 1.28, w: S.R * 1.9, h: S.R * 2.12 };
        const fxp = P.x + P.w / 2 + (0.5 - (d.st.fx ?? 0.5)) * P.w * 0.6;
        g.save(); g.translate(fxp, P.y + P.h); g.scale(1, 0.16);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, S.R);
        gr.addColorStop(0, d.rgba(coreA, 0.6)); gr.addColorStop(0.4, d.rgba(A, 0.32)); gr.addColorStop(1, d.rgba(A, 0));
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, S.R, 0, TAU); g.fill(); g.restore();
        g.save(); g.shadowColor = d.rgba(A, 0.95); g.shadowBlur = 4 * ub;
        const r = d.product(P.x, P.y, P.w, P.h, { shadow: false });
        g.restore();
        return r;
      }
      const fw = S.fw, fh = S.fh, fx = S.cx - fw / 2, fy = S.cy - fh / 2, r = 2.4 * u, gp = 1.7 * u, lw = Math.max(3, 0.95 * u);
      g.save(); g.shadowColor = d.rgba(A, 0.85); g.shadowBlur = 6 * ub; g.fillStyle = INK; d.rr(fx, fy, fw, fh, r); g.fill(); g.restore();
      d.photo(fx, fy, fw, fh, { clip: () => d.rr(fx, fy, fw, fh, r) });
      // night grade on the photo: a neon wash on top, darker at the bottom
      g.save(); d.rr(fx, fy, fw, fh, r); g.clip();
      const gr = g.createLinearGradient(0, fy, 0, fy + fh);
      gr.addColorStop(0, d.rgba(A, 0.14)); gr.addColorStop(0.55, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.32)");
      g.fillStyle = gr; g.fillRect(fx, fy, fw, fh); g.restore();
      tube(() => d.rr(fx - gp, fy - gp, fw + gp * 2, fh + gp * 2, r + gp), A, lw);
      // corner tubes in the other colour
      const o = gp + 2.3 * u, cr = r + o;
      tube(() => { g.beginPath(); g.moveTo(fx - o, fy + fh * 0.3); g.lineTo(fx - o, fy - o + cr); g.arcTo(fx - o, fy - o, fx - o + cr, fy - o, cr); g.lineTo(fx + fw * 0.32, fy - o); }, B, lw * 0.55, 2 * u);
      tube(() => { g.beginPath(); g.moveTo(fx + fw + o, fy + fh * 0.7); g.lineTo(fx + fw + o, fy + fh + o - cr); g.arcTo(fx + fw + o, fy + fh + o, fx + fw + o - cr, fy + fh + o, cr); g.lineTo(fx + fw * 0.68, fy + fh + o); }, B, lw * 0.55, 2 * u);
      return { x: fx, y: fy, w: fw, h: fh };
    }
    // the % off / chosen sticker as a lit disc with a tube around it
    function sticker(cx, cy, R) {
      if (!t.stickerText) return false;
      const gr = g.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2);
      gr.addColorStop(0, d.rgba(B, 0.45)); gr.addColorStop(1, d.rgba(B, 0));
      g.fillStyle = gr; g.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
      d.sticker(cx, cy, R, { shape: "circle", fill: B, fg: d.onColor(B), rot: -0.16, shadow: false });
      tube(() => { g.beginPath(); g.arc(cx, cy, R + 1.1 * u, 0, TAU); }, B, Math.max(2, 0.4 * u), 1.8 * u);
      return true;
    }

    /* ---------------- the hanging sign: first badge, else "Open 24/7" ---------------- */
    function signGeo(s, maxW, fallback) {
      const fixed = bn ? "২৪/৭ খোলা" : "Open 24/7";
      const txt = (!fallback && t.badges[0]) || fixed;
      const padX = s * 0.78, padY = s * 0.4;
      const o = { size: s, min: Math.round(s * 0.72), kind: "hand", weight: 700, maxW: maxW - padX * 2, lines: 2, lh: 1.04, align: "center" };
      const m = d.text(txt, 0, 0, { ...o, measure: true });
      // a badge too long for the little sign stays a chip; the sign then says "Open 24/7"
      if (m.lines.join(" ").split(/\s+/).length < txt.split(/\s+/).length) return fallback || txt === fixed ? null : signGeo(s, maxW, true);
      const w = m.w + padX * 2, h = m.h + padY * 2, rad = s * 0.45;
      return { w, h, used: txt !== fixed, draw(x, y, wireTop) {
        g.save(); g.strokeStyle = "rgba(255,255,255,.24)"; g.lineWidth = Math.max(1.2, 0.2 * u);
        g.beginPath(); [0.18, 0.82].forEach((p) => { g.moveTo(x + w * p, wireTop); g.lineTo(x + w * p, y + 0.6 * u); }); g.stroke();
        g.fillStyle = "rgba(255,255,255,.3)"; [0.18, 0.82].forEach((p) => { d.circle(x + w * p, y + 0.6 * u, Math.max(2, 0.45 * u)); g.fill(); });
        g.restore();
        g.fillStyle = "rgba(8,6,12,.8)"; d.rr(x, y, w, h, rad); g.fill();
        tube(() => d.rr(x, y, w, h, rad), B, Math.max(2.5, 0.5 * u), 2.2 * u);
        d.text(txt, x + padX - 1, y + padY, { ...o, size: m.size, min: m.size, maxW: m.w + 2, color: coreB, shadow: B, shadowBlur: 2 * ub, stroke: B, strokeWidth: m.size * 0.07 });
      } };
    }

    /* ---------------- brand (logo on a plate, or the name in a soft neon) ---------------- */
    function brand(x, y, maxW, h) {
      if (maxW < 8 * u) return;
      if (d.hasLogo) { d.logo(x, y, maxW, h, { align: "left", plate: "#FFFFFF" }); return; }
      if (!t.brand) return;
      const s = h * 0.52, dot = s * 0.36, tx = x + dot * 2 + s * 0.45;
      const m = d.text(up(t.brand), 0, 0, { measure: true, size: s, min: s * 0.7, kind: "body", weight: 800, maxW: (maxW - (tx - x)) * 0.88, lines: 1 });
      const cy = y + h / 2;
      g.save(); g.shadowColor = A; g.shadowBlur = 1.4 * ub; d.circle(x + dot, cy, dot, coreA); g.restore();
      d.text(up(t.brand), tx, cy - m.size * 0.56, { size: m.size, min: m.size, kind: "body", weight: 800, maxW: m.w + 2, lines: 1, color: "rgba(255,255,255,.88)", letter: 0.1 });
    }

    /* ---------------- text pieces (measure → {w, h, draw}) ---------------- */
    const LH = bn ? 1.2 : 1.06;
    const headWords = GRS.tokens(t.headline).length;
    // neon lettering: a wide coloured halo, a lit tube rim with a tight glow, then the white-hot core
    // (the rim is lighter than the tube colour so letters glow instead of looking outlined)
    function glyphs(txt, x, y, col, core, s) {
      const hc = d.lum(col) > 0.45 ? d.rgba(col, 0.7) : col;   // bright tubes need less halo to glow
      g.shadowColor = hc; g.shadowBlur = 5.5 * ub; g.fillStyle = col; g.fillText(txt, x, y);
      g.shadowBlur = 2.2 * ub; g.fillText(txt, x, y);
      g.shadowColor = col; g.shadowBlur = 1 * ub; g.lineWidth = Math.max(2, s * 0.06); g.strokeStyle = d.mix(col, "#FFFFFF", 0.22); g.strokeText(txt, x, y);
      g.shadowBlur = 0; g.fillStyle = core; g.fillText(txt, x, y);
    }
    const headFit = (s, maxW, lines) => d.headline(0, 0, { measure: true, size: s, min: s, lines, maxW, lh: LH });
    function neonHead(x, y, maxW, s, lines, al) {
      const m = headFit(s, maxW, lines);
      g.save(); g.font = d.font("display", s); g.textBaseline = "top"; g.textAlign = "left"; g.lineJoin = "round";
      const sp = g.measureText(" ").width;
      d.tag("neonhead");
      m.lines.forEach((ln, li) => {
        const lw = ln.reduce((a, tk, i) => a + tk.ww + (i ? sp : 0), 0), yy = y + li * s * LH;
        let xx = al === "center" ? x + (maxW - lw) / 2 : al === "right" ? x + maxW - lw : x;
        d.mark(xx, yy, lw, s * LH);
        ln.forEach((tk) => {
          glyphs(tk.w, xx, yy, tk.hi ? B : A, tk.hi ? coreB : coreA, s);
          xx += tk.ww + sp;
        });
      });
      d.tag(""); g.restore();
    }
    // stacked: prefix + old price on a small line above the big price (narrower, for side-by-side rows)
    function priceGeo(s, maxW, stacked) {
      if (!t.price) return null;
      const st2 = stacked && !!(t.old || t.prefix);
      const meas = (S) => {
        g.font = d.font("display", S); const pw = g.measureText(t.price).width;
        const os = S * 0.42; g.font = d.font("display", os, 600); const ow = t.old ? g.measureText(t.old).width : 0;
        const prs = S * 0.3; g.font = d.font("body", prs, 800); const prw = t.prefix ? g.measureText(t.prefix).width : 0;
        const gap = S * 0.22;
        if (st2) { const top = prw + (prw && ow ? gap : 0) + ow; return { S, os, prs, pw, ow, prw, gap, top: os * 1.15, w: Math.max(pw, top), h: os * 1.15 + S * 1.04 }; }
        return { S, os, prs, pw, ow, prw, gap, top: 0, w: prw + (prw ? gap * 0.7 : 0) + pw + (ow ? gap + ow : 0), h: S * 1.04 };
      };
      let M = meas(s);
      if (M.w > maxW) M = meas(s * (maxW / M.w) * 0.98);
      const oldAt = (ox, base) => {
        g.font = d.font("display", M.os, 600); g.fillStyle = "rgba(255,255,255,.55)"; g.shadowBlur = 0; g.fillText(t.old, ox, base);
        g.save(); g.strokeStyle = A; g.lineWidth = Math.max(2.5, M.os * 0.09); g.shadowColor = A; g.shadowBlur = 1 * ub; g.lineCap = "round";
        g.beginPath(); g.moveTo(ox - 3, base - M.os * 0.3); g.lineTo(ox + M.ow + 3, base - M.os * 0.36); g.stroke(); g.restore();
      };
      return { w: M.w, h: M.h, draw(x, y) {
        const base = y + M.top + M.S * 0.86; let xx = x;
        g.save(); g.textBaseline = "alphabetic"; g.textAlign = "left"; g.lineJoin = "round";
        if (st2) {
          const b1 = y + M.os * 0.9; let tx = x;
          if (t.prefix) { g.font = d.font("body", M.prs, 800); g.fillStyle = coreB; g.fillText(t.prefix, tx, b1); tx += M.prw + M.gap; }
          if (t.old) oldAt(tx, b1);
        } else if (t.prefix) { g.font = d.font("body", M.prs, 800); g.fillStyle = coreB; g.shadowColor = B; g.shadowBlur = 1.2 * ub; g.fillText(t.prefix, xx, base - M.S * 0.06); xx += M.prw + M.gap * 0.7; }
        g.font = d.font("display", M.S);
        glyphs(t.price, xx, base, B, coreB, M.S);
        if (t.old && !st2) oldAt(xx + M.pw + M.gap, base);
        g.restore();
        d.tag("neonprice"); d.mark(x, y, M.w, M.h); d.tag("");
      } };
    }
    function ctaGeo(s, maxW) {
      if (!t.cta) return null;
      const label = up(t.cta), padX = s * 1.15, ic = s * 0.95, gi = s * 0.55, h = s * 2.4, fg = d.onColor(A);
      const m = d.text(label, 0, 0, { measure: true, size: s, min: s * 0.75, kind: "body", weight: 800, maxW: maxW - padX * 2 - ic - gi, lines: 1 });
      const w = padX * 2 + m.w + gi + ic;
      return { w, h, draw(x, y) {
        g.save();
        g.shadowColor = A; g.shadowBlur = 4 * ub; g.fillStyle = A; d.rr(x, y, w, h, h / 2); g.fill();
        g.shadowBlur = 0; g.strokeStyle = d.mix(A, "#FFFFFF", 0.6); g.lineWidth = Math.max(2, s * 0.09); d.rr(x + s * 0.2, y + s * 0.2, w - s * 0.4, h - s * 0.4, (h - s * 0.4) / 2); g.stroke();
        const ax = x + padX + m.w + gi, ay = y + h / 2;
        g.strokeStyle = fg; g.lineWidth = Math.max(2, s * 0.15); g.lineCap = "round"; g.lineJoin = "round";
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + ic, ay); g.moveTo(ax + ic * 0.55, ay - ic * 0.42); g.lineTo(ax + ic, ay); g.lineTo(ax + ic * 0.55, ay + ic * 0.42); g.stroke();
        g.restore();
        d.text(label, x + padX, y + (h - m.size * 1.12) / 2 + m.size * 0.05, { size: m.size, min: m.size, kind: "body", weight: 800, color: fg, maxW: m.w + 2, lines: 1 });
      } };
    }
    function chipsGeo(list, s, maxW) {
      if (!list.length) return null;
      const padX = s * 0.85, padY = s * 0.5, gap = s * 0.6, ch = s + padY * 2;
      g.font = d.font("body", s, 700);
      const rows = [[]]; let rw = 0;
      list.forEach((b) => {
        const w = Math.min(maxW, g.measureText(b).width + padX * 2);
        if (rows[rows.length - 1].length && rw + gap + w > maxW) { rows.push([]); rw = 0; }
        rows[rows.length - 1].push({ b, w }); rw += (rw ? gap : 0) + w;
      });
      // a lone chip wrapped under a full row looks like a leftover: leave it out
      if (rows.length > 1 && rows[rows.length - 1].length === 1 && rows[rows.length - 2].length >= 2) rows.pop();
      const h = rows.length * ch + (rows.length - 1) * gap;
      const rowW = (r) => r.reduce((a, cc) => a + cc.w, 0) + gap * (r.length - 1);
      const w = Math.max(...rows.map(rowW));
      const stroke = d.mix(A, "#FFFFFF", 0.25);
      return { w, h, draw(x, y, al) {
        rows.forEach((row, i) => {
          const tw = rowW(row);
          let cx = al === "center" ? x + (maxW - tw) / 2 : al === "right" ? x + maxW - tw : x;
          const cy = y + i * (ch + gap);
          row.forEach((cc) => {
            g.fillStyle = "rgba(8,6,12,.55)"; d.rr(cx, cy, cc.w, ch, ch / 2); g.fill();
            tube(() => d.rr(cx, cy, cc.w, ch, ch / 2), stroke, Math.max(1.5, s * 0.09), 1.3 * u);
            d.text(cc.b, cx + padX, cy + padY + s * 0.02, { size: s, min: s * 0.7, kind: "body", weight: 700, color: "rgba(255,255,255,.94)", maxW: cc.w - padX * 2 + 1, lines: 1 });
            cx += cc.w + gap;
          });
        });
      } };
    }

    /* ---------------- stack composer: shrink a little, then drop optional parts ---------------- */
    const ax = (x, maxW, w, al) => (al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x);
    let chipList = t.badges;
    function item(key, f, maxW, cfg, chipMax, force) {
      if (key === "head") {
        if (!t.headline) return null;
        // a long headline shrinks on its own (down to a legible floor), then may take one more line;
        // it never makes the stack drop other parts by itself
        let lines = cfg.headLines || 2;
        const s0 = Math.round(cfg.head * f), floor = Math.min(s0, Math.max(14, Math.round(Math.max(cfg.head * 0.62, 4.6 * u))));
        const ok = (mm) => mm.lines.reduce((a, l) => a + l.length, 0) === headWords && mm.w <= maxW + 1;
        let s = s0, m = headFit(s, maxW, lines);
        while (!ok(m) && s - 2 >= floor) { s -= 2; m = headFit(s, maxW, lines); }
        if (!ok(m)) {
          lines += 1;
          for (s = Math.max(floor, s0 - 4); s >= floor; s -= 2) { m = headFit(s, maxW, lines); if (ok(m)) break; }
          if (!ok(m)) { s = floor; m = headFit(s, maxW, lines); }
        }
        // one very long word: shrink below the floor rather than overflow the canvas
        for (let i = 0; i < 6 && m.w > maxW + 1 && s > 10; i++) { s = Math.max(10, Math.floor((s * maxW) / m.w) - 1); m = headFit(s, maxW, lines); }
        const S = s, Ln = lines;
        return { h: m.h, draw: (x, y, al) => neonHead(x, y, maxW, S, Ln, al) };
      }
      if (key === "sub") {
        if (!t.sub) return null;
        const s = cfg.sub * f, o = { size: s, min: s * 0.85, kind: "body", weight: 500, maxW, lines: 2, lh: 1.25 };
        const m = d.text(t.sub, 0, 0, { ...o, measure: true });
        if (m.lines.join(" ").split(/\s+/).length < t.sub.split(/\s+/).length) return null;
        return { h: m.h, draw: (x, y, al) => d.text(t.sub, x, y, { ...o, align: al, color: "rgba(255,255,255,.8)" }) };
      }
      if (key === "price") {
        const P = priceGeo(cfg.price * f, maxW); if (!P) return null;
        return { h: P.h, draw: (x, y, al) => P.draw(ax(x, maxW, P.w, al), y) };
      }
      if (key === "cta") {
        const C = ctaGeo(cfg.cta * f, maxW); if (!C) return null;
        return { h: C.h, gapK: 1.3, draw: (x, y, al) => C.draw(ax(x, maxW, C.w, al), y) };
      }
      if (key === "pricecta") {
        let P = priceGeo(cfg.price * f, maxW);
        const C = ctaGeo(cfg.cta * f, maxW), gp = cfg.gap * f * 1.8;
        if (!P && !C) return null;
        if (P && C && P.w + gp + C.w > maxW) { const P2 = priceGeo(cfg.price * f, maxW, true); if (P2.w + gp + C.w <= maxW) P = P2; }
        if (P && C && P.w + gp + C.w <= maxW) {
          const h = Math.max(P.h, C.h);
          return { h, draw: (x, y, al) => {
            const x0 = al === "center" ? x + (maxW - P.w - gp - C.w) / 2 : al === "right" ? x + maxW - P.w - gp - C.w : x;
            P.draw(x0, y + (h - P.h) / 2); C.draw(x0 + P.w + gp, y + (h - C.h) / 2);
          } };
        }
        const list = [P, C].filter(Boolean), gg = cfg.gap * f * 1.2;
        const h = list.reduce((a, it, i) => a + it.h + (i ? gg : 0), 0);
        return { h, draw: (x, y, al) => { let yy = y; list.forEach((it) => { it.draw(ax(x, maxW, it.w, al), yy); yy += it.h + gg; }); } };
      }
      if (key === "chips") {
        if (!chipMax) return null;
        const C = chipsGeo(chipList.slice(0, chipMax), cfg.chip * f, maxW); if (!C) return null;
        return { h: C.h, draw: (x, y, al) => C.draw(x, y, al) };
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
          if (t.rating) { g.save(); g.shadowColor = B; g.shadowBlur = 1.2 * ub; d.stars(xx, y + s * 0.08, s * 1.05, { color: coreB, empty: "rgba(255,255,255,.18)" }); g.restore(); xx += sw + gp; }
          d.text(txt, xx, y + s * 0.06, { ...o, color: "rgba(255,255,255,.88)", maxW: m.w + 2 });
        } };
      }
      if (key === "ends") {
        if (!t.endsText) return null;
        const s = cfg.ends * f, ic = s * 1.1, gp = s * 0.45;
        const o = { size: s, min: s * 0.85, kind: "body", weight: 700, maxW: maxW - ic - gp, lines: 1 };
        const m = d.text(t.endsText, 0, 0, { ...o, measure: true });
        if (m.lines[0] !== t.endsText) return null;
        const w = ic + gp + m.w;
        return { h: s * 1.3, draw: (x, y, al) => {
          const xx = ax(x, maxW, w, al), cy = y + s * 0.62, r = ic / 2;
          tube(() => { g.beginPath(); g.arc(xx + r, cy, r * 0.85, 0, TAU); g.moveTo(xx + r, cy - r * 0.45); g.lineTo(xx + r, cy); g.lineTo(xx + r + r * 0.38, cy + r * 0.22); }, B, Math.max(1.5, s * 0.11), 1.2 * u);
          d.text(t.endsText, xx + ic + gp, y + s * 0.05, { ...o, color: coreB, maxW: m.w + 2 });
        } };
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
      const minF = Math.min(0.8, TS * 0.8), softF = Math.max(minF, TS * 0.9);
      let ks = keys.slice(), chipMax = cfg.chipMax ?? 3;
      const steps = drops.slice();
      for (;;) {
        const lo = steps.length ? softF : minF;
        for (let f = TS; f >= lo - 1e-6; f -= 0.04) { const b = build(ks, f, maxW, cfg, chipMax); if (b && b.h <= avail) return b; }
        if (!steps.length) break;
        const s = steps.shift();
        if (s === "chips-") chipMax = chipMax > 2 ? 2 : 1;
        else if (s === "chips") chipMax = 0;
        else ks = ks.filter((x) => x !== s);
      }
      for (let f = minF; f >= 0.55; f -= 0.04) { const b = build(ks, f, maxW, cfg, chipMax, true); if (b && b.h <= avail) return b; }
      return build(ks, 0.55, maxW, cfg, chipMax, true);
    }
    const SF = Math.max(0.85, Math.min(1.2, TS));   // the style's own small parts follow the text size a little

    /* ================================ compositions ================================ */
    if (k.landscape) {
      const sg = signGeo(5.2 * u * SF, 46 * u);
      if (sg && sg.used) chipList = t.badges.slice(1);
      const sx = W - k.side - (sg ? sg.w : 0), sy = k.top - 1 * u;
      const S = { cx: 46 * u, cy: 52 * u, R: 35 * u, fw: 60 * u, fh: H - k.top * 2 };
      if (!cut) S.cy = H / 2;
      wall(S.cx, S.cy, 85 * u, sg ? sx + sg.w / 2 : null, sy + 6 * u);
      if (sg) sg.draw(sx, sy, 0);
      hero(S);
      if (cut) sticker(S.cx + 0.84 * S.R, S.cy - 0.7 * S.R, 7.5 * u);
      else sticker(S.cx + S.fw / 2 - 1 * u, S.cy - S.fh / 2 + 8 * u, 7.5 * u);
      if (cut) twinkle(S.cx - 0.98 * S.R, S.cy - 0.78 * S.R, 2.6 * u, B);
      else twinkle(S.cx - S.fw / 2 - 5 * u, S.cy + S.fh * 0.18, 2.6 * u, B);
      const x = 90 * u, colW = W - k.side - x;
      const bh = d.hasLogo ? 8 * u : 6 * u;
      brand(x, k.top, (sg ? sx - 3 * u : W - k.side) - x, bh);
      const top = Math.max(k.top + bh + 3 * u, sg ? sy + sg.h + 3 * u : 0), avail = H - k.bottom - top;
      const b = compose(["head", "sub", "pricecta", "chips", "proof", "ends"], ["ends", "proof", "sub", "chips-", "chips"], colW, avail,
        { head: 9.6 * u, headLines: 2, sub: 3 * u, price: 9.4 * u, cta: 3.4 * u, chip: 2.8 * u, chipMax: 3, proof: 2.7 * u, ends: 2.7 * u, gap: 2.6 * u });
      b.draw(x, top + Math.max(0, (avail - b.h) / 2), d.align("left"));
      return;
    }

    if (k.square) {
      const sg = signGeo(4.6 * u * SF, 36 * u);
      if (sg && sg.used) chipList = t.badges.slice(1);
      const sx = W - k.side - (sg ? sg.w : 0), sy = 6.5 * u;
      const S = { cx: 72 * u, cy: 59 * u, R: 20 * u, fw: 37 * u, fh: 48 * u };
      wall(S.cx, S.cy, 62 * u, sg ? sx + sg.w / 2 : null, sy + 6 * u);
      if (sg) sg.draw(sx, sy, 0);
      hero(S);
      if (cut) sticker(S.cx + 0.86 * S.R, S.cy - 0.72 * S.R, 6.5 * u);
      else sticker(S.cx + S.fw / 2 - 1 * u, S.cy - S.fh / 2 + 6.5 * u, 6.5 * u);
      twinkle(S.cx + 1.15 * S.R, S.cy + 0.62 * S.R, 2.4 * u, B);
      const bh = d.hasLogo ? 7 * u : 5 * u;
      brand(k.side, k.top, (sg ? sx - 3 * u : W - k.side) - k.side, bh);
      const top = k.top + bh + 4 * u, colW = 42 * u, avail = H - k.bottom - top;
      const b = compose(["head", "sub", "price", "chips", "proof", "ends", "cta"], ["ends", "proof", "sub", "chips-", "chips"], colW, avail,
        { head: 7.4 * u, headLines: 3, sub: 2.7 * u, price: 8.4 * u, chip: 2.5 * u, chipMax: 2, proof: 2.4 * u, ends: 2.4 * u, cta: 3.1 * u, gap: 2.3 * u });
      b.draw(k.side, top + Math.max(0, (avail - b.h) / 2), d.align("left"));
      return;
    }

    // portrait + story: brand and hanging sign on top, neon headline, the ring, the offer below
    const story = k.story;
    const sg = signGeo((story ? 5.2 : 4.6) * u * SF, story ? 40 * u : 36 * u);
    if (sg && sg.used) chipList = t.badges.slice(1);
    const rowY = story ? H * 0.14 + 1.5 * u : 6.5 * u;
    const sx = W - k.side - (sg ? sg.w : 0), sy = rowY;
    const al = d.align("center");
    const bx = al === "center" ? (W - k.maxW) / 2 : k.side;
    const bh = d.hasLogo ? (story ? 7.5 : 7) * u : (story ? 5.6 : 5) * u;
    const headTop = Math.max(rowY + bh + 3 * u, sg ? sy + sg.h + (story ? 3 : 2.5) * u : 0);
    const A1 = compose(["head", "sub"], ["sub"], k.maxW, story ? 30 * u : 26 * u, { head: (story ? 9.6 : 9.2) * u, headLines: story ? 3 : 2, sub: (story ? 3.3 : 2.9) * u, gap: 2 * u });
    const bot = story ? H * 0.79 : H - k.bottom;
    const B1 = compose(["pricecta", "chips", "proof", "ends"], ["ends", "proof", "chips-", "chips"], k.maxW, story ? 34 * u : 30 * u,
      { price: (story ? 9.4 : 8.4) * u, cta: (story ? 3.5 : 3.3) * u, chip: (story ? 2.9 : 2.6) * u, chipMax: story ? 2 : 3, proof: (story ? 2.7 : 2.4) * u, ends: (story ? 2.7 : 2.4) * u, gap: 2.2 * u });
    const bTop = bot - B1.h;
    const rTop = headTop + A1.h + (story ? 4.5 : 3.5) * u, rBot = bTop - (story ? 4.5 : 3.5) * u, hA = Math.max(20 * u, rBot - rTop);
    const S = { cx: W / 2, cy: 0, R: 0, fw: 0, fh: 0, open: story && cut };
    if (S.open) {
      // 9:16: a horseshoe ring whose open bottom holds the offer, so the product can be bigger
      const top0 = headTop + A1.h + 3 * u, av = bTop - 1 * u - top0;
      S.R = Math.min(av / 1.94, 33 * u); S.cy = top0 + 1.28 * S.R + (av - 1.94 * S.R) / 2;
    } else if (cut) { S.R = Math.min(hA / 2.32, story ? 33 * u : 27 * u); S.cy = rTop + (hA - 2.28 * S.R) / 2 + 1.28 * S.R; }
    // 9:16 has height to spare only after the text: the photo window goes wider instead (a lit shop window),
    // capped so the sticker on its corner stays clear of the Reels buttons
    else { S.fh = Math.min(hA, story ? 78 * u : 62 * u); S.fw = story ? Math.min(S.fh * 1.15, 60 * u) : Math.min(S.fh * 0.8, 64 * u); S.cy = rTop + hA / 2; }
    wall(S.cx, S.cy, (story ? 80 : 66) * u, sg ? sx + sg.w / 2 : null, sy + 6 * u);
    if (story) {
      // pure decoration in the caption zone: a neon floor line and its reflection
      const fy = H * 0.865;
      tube(() => { g.beginPath(); g.moveTo(-2 * u, fy); g.lineTo(W * 0.42, fy); g.moveTo(W * 0.47, fy); g.lineTo(W + 2 * u, fy); }, A, Math.max(3, 0.8 * u));
      const gr = g.createLinearGradient(0, fy, 0, H);
      gr.addColorStop(0, d.rgba(A, 0.16)); gr.addColorStop(1, d.rgba(A, 0));
      g.fillStyle = gr; g.fillRect(0, fy, W, H - fy);
      tube(() => { g.beginPath(); g.moveTo(W * 0.24, H * 0.905); g.lineTo(W * 0.62, H * 0.905); g.moveTo(W * 0.67, H * 0.905); g.lineTo(W * 0.76, H * 0.905); }, B, Math.max(2, 0.4 * u), 1.8 * u);
    }
    if (sg) sg.draw(sx, sy, 0);
    hero(S);
    const sR = (story ? 7.5 : 7) * u;
    if (cut) sticker(S.cx + 0.86 * S.R, S.cy - 0.72 * S.R, sR);
    else sticker(S.cx + S.fw / 2 - 1 * u, S.cy - S.fh / 2 + sR, sR);
    if (cut) twinkle(S.cx - 1.12 * S.R, S.cy + (S.open ? -0.62 : 0.55) * S.R, 2.6 * u, B);
    else twinkle(S.cx - S.fw / 2 - 4.5 * u, S.cy + S.fh * 0.12, 2.4 * u, B);
    brand(k.side, rowY, (sg ? sx - 3 * u : W - k.side) - k.side, bh);
    A1.draw(bx, headTop, al);
    B1.draw(bx, bTop, al);
  },
});
})();
