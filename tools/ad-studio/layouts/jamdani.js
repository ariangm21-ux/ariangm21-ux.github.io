/* Jamdani luxe: the brand colour woven very dark, a fine gold Jamdani lattice, a saree-paar border on one edge,
   a thin gold double frame and the product in a tall pointed-arch window. Ivory serif headline, gold price,
   gold-outlined chips and CTA, a gold seal. Made for sarees, jewellery and premium fashion. */
(() => {
  "use strict";

  /* Jamdani motifs are woven on a grid, so they are stepped: "#" = one woven point */
  const PIX = {
    buti: ["..#..", ".#.#.", "#.#.#", ".#.#.", "..#.."],
    seed: ["..#..", ".###.", "##.##", ".###.", "..#.."],
    cross: [".#.", "#.#", ".#."],
    flower: [
      "....#....",
      "...#.#...",
      "..#.#.#..",
      ".#.###.#.",
      "#.##.##.#",
      ".#.###.#.",
      "..#.#.#..",
      "...#.#...",
      "....#....",
    ],
  };
  const OFF = {};
  Object.keys(PIX).forEach((key) => {
    const rows = PIX[key], n = rows.length, m = rows[0].length, list = [];
    rows.forEach((row, i) => [...row].forEach((ch, j) => { if (ch === "#") list.push([j - m / 2, i - n / 2]); }));
    OFF[key] = list;
  });

  GRS.register({
    id: "jamdani", name: "Jamdani luxe", group: "premium", photos: 1, cutout: "optional",
    desc: "Gold Jamdani weave, saree border, arch window",
    draw(d) {
      const { g, W, H, k, t, c, u } = d;
      const bn = t.lang === "bn";
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

      /* ---------- palette: the brand colour pushed very dark, gold thread, ivory type ---------- */
      const [ph, ps] = d.toHsl(c.primary);
      const neutral = ps < 0.14;
      // yellow and lime turn to mud when darkened: yellows become deep tobacco brown, limes a forest green
      let hue = ph, sat = clamp(ps * 0.85, 0.42, 0.7), lt = 0.15;
      if (!neutral && ph >= 38 && ph < 70) { hue = 26 + (ph - 38) * 0.25; sat = clamp(ps * 0.62, 0.4, 0.55); lt = 0.135; }
      else if (!neutral && ph >= 70 && ph < 100) hue = 110 + (ph - 70) * 0.5;
      const ground = neutral ? "#18110D" : d.fromHsl(hue, sat, lt);
      const userAcc = /^#[\da-f]{6}$/i.test(d.st.accent || "");
      const [accH, accS] = d.toHsl(c.accent);
      const paar = neutral && !userAcc ? "#5E1622" : accS < 0.12 ? d.mix(ground, "#000000", 0.45) : d.fromHsl(accH, clamp(accS, 0.4, 0.62), 0.21);
      const GOLD = c.gold, IV = "#F6EFDF", INK = d.mix(ground, "#000000", 0.4);
      const LH = bn ? 1.22 : 1.08;
      const headN = GRS.tokens(t.headline).length;
      // a short headline ("New arrival") is set larger, so a sparse ad still has a strong focal line
      const HB = headN <= 2 ? 1.28 : headN <= 3 ? 1.14 : 1;

      /* ---------- weaving helpers ---------- */
      const pix = (key, cx, cy, p) => { const s = p * 1.06; OFF[key].forEach(([a, b]) => g.rect(cx + a * p, cy + b * p, s, s)); };
      const diamond = (cx, cy, r) => { g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); };

      // the jaal: a stitched diagonal net, a buti in every diamond, a tiny cross where the threads meet
      const field = (x, y, w, h, s, a) => {
        g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
        const ox = x + w / 2, oy = y + h / 2;
        g.strokeStyle = d.rgba(GOLD, a * 0.6); g.lineWidth = Math.max(1, 0.1 * u); g.setLineDash([0.5 * u, 0.7 * u]);
        g.beginPath();
        const n = Math.ceil((w + h) / s) + 2;
        for (let i = -n; i <= n; i++) {
          const bx = ox + i * s;
          g.moveTo(bx - (oy - y), y); g.lineTo(bx + (y + h - oy), y + h);
          g.moveTo(bx + (oy - y), y); g.lineTo(bx - (y + h - oy), y + h);
        }
        g.stroke(); g.setLineDash([]);
        const p = s * 0.06, r0 = -Math.ceil((oy - y) / (s / 2)) - 1, r1 = Math.ceil((y + h - oy) / (s / 2)) + 1;
        const rowsOf = (key, size, centres) => {
          g.beginPath();
          for (let r = r0; r <= r1; r++) {
            const yy = oy + (r * s) / 2, off = (Math.abs(r) % 2 ? 0 : s / 2) + (centres ? 0 : s / 2);
            for (let xx = ox + off - Math.ceil((ox + off - x) / s + 1) * s; xx < x + w + s; xx += s) pix(key, xx, yy, size);
          }
          g.fill();
        };
        g.fillStyle = d.rgba(GOLD, a); rowsOf("buti", p, true);
        g.fillStyle = d.rgba(GOLD, a * 0.85); rowsOf("cross", p * 0.8, false);
        g.restore();
      };

      // a woven border band in local space: x ∈ [0, bwid] across the band, y ∈ [0, L] along it, inner edge at x = bwid
      const weave = (L, bwid) => {
        g.fillStyle = paar; g.fillRect(0, 0, bwid, L);
        const sh = g.createLinearGradient(0, 0, bwid, 0);
        sh.addColorStop(0, "rgba(0,0,0,.32)"); sh.addColorStop(0.5, "rgba(255,255,255,.06)"); sh.addColorStop(1, "rgba(0,0,0,.32)");
        g.fillStyle = sh; g.fillRect(0, 0, bwid, L);
        g.fillStyle = "rgba(0,0,0,.13)"; g.beginPath();
        for (let yy = 0; yy < L; yy += 0.55 * u) g.rect(0, yy, bwid, 0.2 * u);
        g.fill();
        g.fillStyle = GOLD;
        const rail = (off, ww, a) => { g.globalAlpha = a; g.fillRect(off - ww / 2, 0, ww, L); };
        rail(0.9 * u, 0.2 * u, 0.6); rail(bwid - 1.5 * u, 0.12 * u, 0.55); rail(bwid - 0.9 * u, 0.32 * u, 0.95);
        g.globalAlpha = 1;
        const cx = (0.9 * u + bwid - 1.5 * u) / 2, p = (bwid - 3.6 * u) / 9, step = 9 * p * 1.8;
        const y0 = L / 2 - Math.ceil(L / 2 / step + 1) * step;
        g.fillStyle = d.rgba(GOLD, 0.92); g.beginPath();
        for (let yy = y0; yy < L + step; yy += step) pix("flower", cx, yy, p);
        g.fill();
        g.fillStyle = d.rgba(GOLD, 0.6); g.beginPath();
        for (let yy = y0; yy < L + step; yy += step) pix("seed", cx, yy + step / 2, p * 0.72);
        g.fill();
        // dant: little teeth on the inner edge, pointing into the body of the saree
        const tw = 1.1 * u;
        g.fillStyle = d.rgba(GOLD, 0.8); g.beginPath();
        for (let yy = 0; yy < L; yy += tw * 1.18) { g.moveTo(bwid, yy); g.lineTo(bwid + tw, yy + tw / 2); g.lineTo(bwid, yy + tw); g.closePath(); }
        g.fill();
      };
      // the paar: the band down one edge
      const bw = 8.4 * u;
      const band = (sd) => { g.save(); if (sd === "right") { g.translate(W, 0); g.scale(-1, 1); } weave(H, bw); g.restore(); };
      // the anchal: the same weave across the foot (story only, where the caption zone leaves room for pure decoration)
      const anchal = (h) => { g.save(); g.translate(0, H); g.rotate(-Math.PI / 2); weave(W, h); g.restore(); };

      const frame = (L, T, R, B) => {
        g.save(); g.strokeStyle = GOLD;
        g.globalAlpha = 0.9; g.lineWidth = Math.max(1.5, 0.26 * u); g.strokeRect(L, T, R - L, B - T);
        const i = 1.1 * u; g.globalAlpha = 0.45; g.lineWidth = Math.max(1, 0.11 * u); g.strokeRect(L + i, T + i, R - L - 2 * i, B - T - 2 * i);
        g.globalAlpha = 1;
        [[L, T], [R, T], [L, B], [R, B]].forEach(([x, y]) => {
          g.fillStyle = d.mix(ground, "#000000", 0.3); g.beginPath(); diamond(x, y, 1.9 * u); g.fill();
          g.fillStyle = GOLD; g.beginPath(); diamond(x, y, 1.25 * u); g.fill();
          g.fillStyle = d.mix(ground, "#000000", 0.3); g.beginPath(); diamond(x, y, 0.5 * u); g.fill();
        });
        g.restore();
      };

      /* ---------- the arched window ---------- */
      const arch = (x, y, w, h) => {
        const sh = Math.min(w * 0.62, h * 0.45);
        g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + sh);
        g.bezierCurveTo(x, y + sh * 0.42, x + w * 0.33, y + sh * 0.24, x + w / 2, y);
        g.bezierCurveTo(x + w * 0.67, y + sh * 0.24, x + w, y + sh * 0.42, x + w, y + sh);
        g.lineTo(x + w, y + h); g.closePath();
      };
      const win = (x, y, w, h, crown) => {
        const o = 1.2 * u;
        g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 5 * u; g.shadowOffsetY = 1.6 * u; g.fillStyle = INK; arch(x, y, w, h); g.fill(); g.restore();
        if (d.hasCutout()) {
          g.save(); arch(x, y, w, h); g.clip();
          const gg = g.createRadialGradient(x + w / 2, y + h * 0.66, 0, x + w / 2, y + h * 0.66, h * 0.72);
          gg.addColorStop(0, d.mix(ground, GOLD, 0.34)); gg.addColorStop(0.5, d.mix(ground, GOLD, 0.12)); gg.addColorStop(1, d.mix(ground, "#000000", 0.3));
          g.fillStyle = gg; g.fillRect(x, y, w, h);
          field(x, y, w, h, 6.4 * u, 0.2);
          g.restore();
          // the product stands on a gold plinth line; the box runs almost the full window width (the arch is full width
          // below its shoulder, and a contain-fit product only reaches the curve when it is tall and narrow)
          const sh = Math.min(w * 0.62, h * 0.45), fy = y + h - Math.max(3.4 * u, h * 0.07), top = y + sh * 0.42;
          g.save(); g.strokeStyle = d.rgba(GOLD, 0.7); g.lineWidth = Math.max(1, 0.16 * u); g.beginPath(); g.moveTo(x + w * 0.12, fy); g.lineTo(x + w * 0.88, fy); g.stroke(); g.restore();
          g.save(); arch(x, y, w, h); g.clip();
          d.product(x + w * 0.03, top, w * 0.94, fy - top, { shadowColor: "rgba(0,0,0,.55)" });
          g.restore();
        } else {
          d.photo(x, y, w, h, { clip: () => arch(x, y, w, h) });
          g.save(); arch(x, y, w, h); g.clip();
          const vg = g.createLinearGradient(0, y + h * 0.65, 0, y + h); vg.addColorStop(0, d.rgba(INK, 0)); vg.addColorStop(1, d.rgba(INK, 0.35));
          g.fillStyle = vg; g.fillRect(x, y, w, h); g.restore();
        }
        g.save(); g.strokeStyle = GOLD;
        g.lineWidth = Math.max(1.5, 0.3 * u); arch(x, y, w, h); g.stroke();
        g.globalAlpha = 0.6; g.lineWidth = Math.max(1, 0.12 * u); arch(x - o, y - o * 1.7, w + o * 2, h + o * 2.7); g.stroke();
        const sy = y + h + o + 0.9 * u, sx0 = x - o - 2.4 * u, sx1 = x + w + o + 2.4 * u;
        g.globalAlpha = 0.85; g.lineWidth = Math.max(1, 0.2 * u); g.beginPath(); g.moveTo(sx0, sy); g.lineTo(sx1, sy); g.stroke();
        g.globalAlpha = 1; g.fillStyle = GOLD; g.beginPath(); diamond(sx0, sy, 0.55 * u); diamond(sx1, sy, 0.55 * u); g.fill();
        if (!crown) { g.beginPath(); pix("seed", x + w / 2, y - o * 1.7 - 1.7 * u, 0.34 * u); g.fill(); }
        g.restore();
      };

      /* the sticker as a gold seal */
      const seal = (cx, cy, R) => {
        const fill = g.createRadialGradient(-R * 0.35, -R * 0.45, R * 0.05, 0, 0, R * 1.05);
        fill.addColorStop(0, "#FFF0C4"); fill.addColorStop(0.5, GOLD); fill.addColorStop(1, "#A8782E");
        const ok = d.sticker(cx, cy, R, { shape: "badge", fill, fg: INK, rot: 0, kind: "serif", stroke: d.rgba("#5C3D12", 0.5) });
        if (ok) { g.save(); g.strokeStyle = d.rgba(INK, 0.5); g.lineWidth = Math.max(1, 0.1 * u); g.beginPath(); g.arc(cx, cy, R * 0.84, 0, Math.PI * 2); g.stroke(); g.restore(); }
        return ok;
      };

      /* ---------- type helpers ---------- */
      const orn = (x, y, al, maxW, f) => {
        const r = 0.7 * u * f, L = Math.min(maxW, 16 * u * f);
        const x0 = al === "center" ? x + (maxW - L) / 2 : al === "right" ? x + maxW - L : x;
        g.save(); g.strokeStyle = d.rgba(GOLD, 0.7); g.fillStyle = GOLD; g.lineWidth = Math.max(1, 0.15 * u);
        g.beginPath();
        if (al === "center") {
          const cx = x0 + L / 2;
          g.moveTo(x0, y); g.lineTo(cx - r * 3.2, y); g.moveTo(cx + r * 3.2, y); g.lineTo(x0 + L, y); g.stroke();
          g.beginPath(); diamond(cx, y, r); diamond(cx - r * 2.1, y, r * 0.45); diamond(cx + r * 2.1, y, r * 0.45); g.fill();
        } else {
          const dir = al === "right" ? -1 : 1, sx = al === "right" ? x0 + L : x0;
          g.moveTo(sx + dir * r * 3.4, y); g.lineTo(sx + dir * L, y); g.stroke();
          g.beginPath(); diamond(sx + dir * r, y, r); diamond(sx + dir * r * 2.6, y, r * 0.45); g.fill();
        }
        g.restore();
      };
      const clock = (cx, cy, r, col) => {
        g.save(); g.strokeStyle = col; g.lineWidth = Math.max(1.5, r * 0.18); g.lineCap = "round"; g.lineJoin = "round";
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.moveTo(cx, cy - r * 0.55); g.lineTo(cx, cy); g.lineTo(cx + r * 0.42, cy + r * 0.25); g.stroke(); g.restore();
      };
      const withBadges = (list, fn) => { const keep = t.badges; t.badges = list; try { return fn(); } finally { t.badges = keep; } };

      const brandFit = (s0, maxW) => {
        const txt = bn ? t.brand : t.brand.toUpperCase(), n = Math.max(0, [...txt].length - 1);
        let ls = bn ? 0.04 : 0.3, s = s0;
        const meas = () => { g.font = d.font("body", s, 600); return g.measureText(txt).width + ls * s * n; };
        let w = meas();
        while (w > maxW && s > s0 * 0.62) { s -= 1; w = meas(); }
        while (w > maxW && ls > 0) { ls = Math.max(0, ls - 0.05); w = meas(); }
        return { txt, s, ls, w: Math.min(w, maxW) };
      };
      const brandDraw = (B, x, y, maxW) => {
        d.tag("brand"); g.save();
        g.font = d.font("body", B.s, 600); g.fillStyle = GOLD; g.textBaseline = "top"; g.textAlign = "left";
        if ("letterSpacing" in g) g.letterSpacing = `${B.ls * B.s}px`;
        g.fillText(B.txt, x, y + B.s * 0.12, maxW);
        g.restore(); d.mark(x, y, B.w, B.s * 1.3); d.tag("");
      };

      let pseq = 0;
      const priceFit = (ps0, maxW) => {
        for (let ps = ps0; ps >= ps0 * 0.7; ps *= 0.95) {
          const os = ps * 0.46, prs = ps * 0.34, pre = t.prefix, gap = ps * 0.26;
          g.font = d.font("serif", ps, 700); const pw = g.measureText(t.price).width;
          g.font = d.font("serif", os, 700); const ow = t.old ? g.measureText(t.old).width : 0;
          g.font = d.font("body", prs, 600); const prw = pre ? g.measureText(pre).width : 0;
          const lead = prw ? prw + gap * 0.6 : 0, inl = lead + pw + (ow ? gap + ow : 0);
          if (inl <= maxW) return { ps, os, prs, pre, pw, ow, prw, gap, stacked: false, w: inl, h: ps * 1.1 };
          const tw = lead + ow;
          if (pw <= maxW && tw <= maxW && (ow || prw)) return { ps, os, prs, pre, pw, ow, prw, gap, stacked: true, tw, w: Math.max(pw, tw), h: os * 1.35 + ps * 1.1 };
        }
        return null;
      };
      const priceDraw = (P, x, y, al, maxW) => {
        const ax = (w) => (al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x);
        d.tag(`jprice${++pseq}`);
        g.save(); g.textBaseline = "alphabetic"; g.textAlign = "left";
        const old = (xx, base) => {
          g.font = d.font("serif", P.os, 700); g.fillStyle = d.rgba(IV, 0.55); g.fillText(t.old, xx, base);
          g.strokeStyle = d.rgba(IV, 0.75); g.lineWidth = Math.max(2, P.os * 0.07); g.beginPath(); g.moveTo(xx - 2, base - P.os * 0.32); g.lineTo(xx + P.ow + 2, base - P.os * 0.32); g.stroke();
        };
        const pre = (xx, base) => { g.font = d.font("body", P.prs, 600); g.fillStyle = d.rgba(IV, 0.8); g.fillText(P.pre, xx, base); };
        if (!P.stacked) {
          const bx = ax(P.w), base = y + P.ps * 0.86; let xx = bx;
          if (P.prw) { pre(xx, base - P.ps * 0.03); xx += P.prw + P.gap * 0.6; }
          g.font = d.font("serif", P.ps, 700); g.fillStyle = GOLD; g.fillText(t.price, xx, base); xx += P.pw + P.gap;
          if (P.ow) old(xx, base);
          d.mark(bx, y, P.w, P.h);
        } else {
          const tx = ax(P.tw), b1 = y + P.os * 0.98; let xx = tx;
          if (P.prw) { pre(xx, b1); xx += P.prw + P.gap * 0.6; }
          if (P.ow) old(xx, b1);
          const px = ax(P.pw);
          g.font = d.font("serif", P.ps, 700); g.fillStyle = GOLD; g.fillText(t.price, px, y + P.os * 1.35 + P.ps * 0.86);
          d.mark(Math.min(tx, px), y, Math.max(P.tw, P.pw), P.h);
        }
        g.restore(); d.tag("");
      };

      /* ---------- the text stack: measures every part, shrinks, then drops optional parts ---------- */
      const build = (o, f) => {
        const al = o.align, maxW = o.maxW, items = []; let ok = true;
        const ax = (x, w) => (al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x);
        const G = 2.3 * u * f;
        o.parts.forEach((p) => {
          if (p === "brand") {
            if (d.hasLogo) { const lh = o.logoH * f; items.push({ h: lh, gap: G, draw: (x, y) => d.logo(x, y, maxW, lh, { align: al, plate: IV }) }); }
            else if (t.brand) { const B = brandFit(o.brand * f, maxW); items.push({ h: B.s * 1.3, gap: G, draw: (x, y) => brandDraw(B, ax(x, B.w), y, maxW) }); }
          } else if (p === "orn") {
            items.push({ h: 1.6 * u * f, gap: G * 1.05, draw: (x, y) => orn(x, y + 0.8 * u * f, al, maxW, f) });
          } else if (p === "head" && t.headline) {
            const hs = o.head * HB * f, ho = { size: hs, min: Math.min(Math.round(hs), Math.max(hs * 0.74, 4.8 * u)), lines: o.headLines || 3, maxW, kind: "serif", weight: 700, lh: LH };
            const m = d.headline(0, 0, { ...ho, measure: true });
            if (m.lines.reduce((a, l) => a + l.length, 0) < headN || m.w > maxW + 1) ok = false;
            items.push({ h: m.h, gap: G * 0.9, draw: (x, y) => d.headline(x, y, { ...ho, align: al, color: IV, hi: GOLD }) });
          } else if (p === "sub" && t.sub) {
            const s = o.sub * f, so = { size: s, min: s * 0.86, kind: "body", weight: 500, lines: 2, lh: 1.32, maxW };
            const m = d.text(t.sub, 0, 0, { ...so, measure: true });
            if (m.lines.join(" ").length < t.sub.replace(/\s+/g, " ").length) ok = false;
            items.push({ h: m.h, gap: G * 0.6, draw: (x, y) => d.text(t.sub, x, y, { ...so, align: al, color: d.rgba(IV, 0.78) }) });
          } else if (p === "price" && t.price) {
            const P = priceFit(o.price * f, maxW);
            if (!P) ok = false;
            else items.push({ h: P.h, gap: G, draw: (x, y) => priceDraw(P, x, y, al, maxW) });
          } else if (p === "chips" && t.badges.length && o.maxChips > 0) {
            const cs = Math.max(o.chip * f, 2.3 * u), ch = cs * 1.92, cg = cs * 0.45;
            g.font = d.font("body", cs, 700);
            let list = t.badges.filter((b) => g.measureText(b).width + cs * 1.44 <= maxW).slice(0, o.maxChips);
            const co = { size: cs, bg: d.rgba(GOLD, 0.07), fg: GOLD, stroke: d.rgba(GOLD, 0.6), align: al, radius: 0.5 * u };
            const meas = () => withBadges(list, () => d.chips(0, 0, maxW, { ...co, max: list.length, measure: true }));
            let m = list.length ? meas() : { h: 0 };
            while (list.length > 1 && m.h > ch * (o.chipRows || 2) + cg * ((o.chipRows || 2) - 1) + 1) { list = list.slice(0, -1); m = meas(); }
            if (list.length) items.push({ h: m.h, gap: G, draw: (x, y) => withBadges(list, () => d.chips(x, y, maxW, { ...co, max: list.length })) });
          } else if (p === "proof" && (t.proof || t.rating)) {
            const s = o.proof * f, label = t.proof ? (t.ratingText ? `${t.ratingText} · ${t.proof}` : t.proof) : t.ratingText;
            const ss = s * 1.05, sw = t.rating ? 5 * ss + 4 * ss * 0.18 : 0, sg = sw ? s * 0.6 : 0;
            const tm = d.text(label, 0, 0, { measure: true, size: s, min: s * 0.75, kind: "body", weight: 600, lines: 1, maxW: Math.max(10, maxW - sw - sg) });
            if (tm.lines.join(" ").length < label.length) ok = false;
            const w = sw + sg + tm.w;
            items.push({ h: s * 1.35, gap: G * 0.8, draw: (x, y) => {
              let xx = ax(x, w);
              if (sw) { d.stars(xx, y + s * 0.1, ss, { color: GOLD, empty: d.rgba(GOLD, 0.25) }); xx += sw + sg; }
              d.text(label, xx, y + s * 0.08, { size: tm.size, min: tm.size, kind: "body", weight: 600, lines: 1, maxW: tm.w + 4, color: d.rgba(IV, 0.86) });
            } });
          } else if (p === "ends" && t.endsText) {
            const s = o.ends * f, ir = s * 0.42, ig = s * 0.5;
            const tm = d.text(t.endsText, 0, 0, { measure: true, size: s, min: s * 0.8, kind: "body", weight: 600, lines: 1, maxW: maxW - ir * 2 - ig });
            if (tm.lines.join(" ").length < t.endsText.length) ok = false;
            const w = ir * 2 + ig + tm.w;
            items.push({ h: s * 1.3, gap: G * 0.8, draw: (x, y) => {
              const xx = ax(x, w); clock(xx + ir, y + s * 0.64, ir, GOLD);
              d.text(t.endsText, xx + ir * 2 + ig, y + s * 0.08, { size: tm.size, min: tm.size, kind: "body", weight: 600, lines: 1, maxW: tm.w + 4, color: d.rgba(IV, 0.86) });
            } });
          } else if (p === "cta" && t.cta) {
            let s = o.cta * f, m = d.cta(0, 0, { measure: true, size: s, style: "outline" });
            while (m.w > maxW && s > 2.3 * u) { s -= 1; m = d.cta(0, 0, { measure: true, size: s, style: "outline" }); }
            if (m.w > maxW) ok = false;
            items.push({ h: m.h, gap: G * 1.35, draw: (x, y) => {
              const bx = ax(x, m.w); g.save(); g.fillStyle = d.rgba(GOLD, 0.12); d.rr(bx, y, m.w, m.h, m.h / 2); g.fill(); g.restore();
              d.cta(x, y, { size: s, style: "outline", bg: GOLD, fg: GOLD, align: al, maxW });
            } });
          }
        });
        const h = items.reduce((a, it, i) => a + it.h + (i ? it.gap : 0), 0);
        return { ok, h, draw: (x, y) => { let yy = y; items.forEach((it, i) => { if (i) yy += it.gap; it.draw(x, yy); yy += it.h; }); } };
      };
      const START = k.boost * (d.st.textScale || 1), FLOOR = Math.max(0.8, START * 0.72);
      const variants = (parts) => {
        const out = []; let cur = parts.slice();
        const nb = t.badges.length;
        if (!cur.includes("chips") || !nb) return [{ parts: cur, maxChips: 0 }, ...(cur.includes("orn") ? [{ parts: cur.filter((p) => p !== "orn"), maxChips: 0 }] : [])];
        for (let mc = Math.min(4, nb); mc >= Math.min(2, nb); mc--) out.push({ parts: cur, maxChips: mc });
        const mc2 = Math.min(2, nb);
        [["ends", !!t.endsText], ["proof", !!(t.proof || t.rating)], ["sub", !!t.sub]].forEach(([p, present]) => {
          if (present && cur.includes(p)) { cur = cur.filter((x) => x !== p); out.push({ parts: cur, maxChips: mc2 }); }
        });
        if (mc2 > 1) out.push({ parts: cur, maxChips: 1 });
        cur = cur.filter((x) => x !== "chips"); out.push({ parts: cur, maxChips: 0 });
        if (cur.includes("orn")) out.push({ parts: cur.filter((x) => x !== "orn"), maxChips: 0 });
        return out;
      };
      // drop optional parts before shrinking below 90%, never below FLOOR; null when nothing fits at a legible size
      const tryStack = (avail, o) => {
        // quick exit: if the headline cannot fit its lines even at the smallest allowed size, no variant will
        if (o.parts.includes("head") && t.headline) {
          const hs = o.head * HB * FLOOR, mn = Math.min(Math.round(hs), Math.max(hs * 0.74, 4.8 * u));
          const m = d.headline(0, 0, { measure: true, size: mn, min: Math.round(mn) - 1, lines: o.headLines || 3, maxW: o.maxW, kind: "serif", weight: 700, lh: LH });
          if (m.lines.reduce((a, l) => a + l.length, 0) < headN || m.w > o.maxW + 1) return null;
        }
        const vs = variants(o.parts);
        const tiers = [[START, START * 0.9], [START * 0.9 - 0.04, FLOOR]];
        for (const [hi, lo] of tiers) for (const v of vs) for (let f = hi; f >= lo - 1e-6; f -= 0.04) { const b = build({ ...o, ...v }, f); if (b.ok && b.h <= avail) return b; }
        return null;
      };
      // then allow one more headline line, and only then go smaller
      const fitStack = (avail, o) => {
        const hl = o.headLines || 3;
        const b = tryStack(avail, o) || (o.parts.includes("head") ? tryStack(avail, { ...o, headLines: hl + 1 }) : null);
        if (b) return b;
        const last = variants(o.parts).slice(-1)[0];
        for (let f = FLOOR - 0.04; f >= 0.5; f -= 0.04) { const s = build({ ...o, ...last, headLines: hl + 1 }, f); if (s.ok && s.h <= avail) return s; }
        return build({ ...o, ...last, headLines: hl + 2 }, 0.5);
      };

      /* ---------- the cloth ---------- */
      const ALL = ["brand", "head", "sub", "orn", "price", "chips", "proof", "ends", "cta"];
      const fo = 2.6 * u, sideB = k.landscape ? "right" : "left", anH = k.story ? 10.5 * u : 0;
      const fL = sideB === "left" ? bw + 2.2 * u : fo, fR = sideB === "right" ? W - bw - 2.2 * u : W - fo, fT = fo, fB = anH ? H - anH - 3.2 * u : H - fo;
      const hasSeal = !!t.stickerText;

      const bg = g.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, Math.hypot(W, H) * 0.6);
      bg.addColorStop(0, d.mix(ground, "#FFFFFF", 0.07)); bg.addColorStop(0.55, ground); bg.addColorStop(1, d.mix(ground, "#000000", 0.4));
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      field(0, 0, W, H, 8.6 * u, 0.12);
      const base = (wx, wy, ww, wh) => {
        const gl = g.createRadialGradient(wx + ww / 2, wy + wh * 0.5, 0, wx + ww / 2, wy + wh * 0.5, Math.max(ww, wh) * 0.8);
        gl.addColorStop(0, d.rgba(GOLD, 0.14)); gl.addColorStop(1, d.rgba(GOLD, 0));
        g.fillStyle = gl; g.fillRect(0, 0, W, H);
        band(sideB); if (anH) anchal(anH); frame(fL, fT, fR, fB);
      };

      if (k.square) {
        // a long headline narrows the window (and may take a 4th line) before any text goes small
        const x0 = fL + 5 * u, top = 9 * u, avail = H - 9 * u - top, colFor = (w) => fR - 5.2 * u - w - 6 * u - x0;
        const so = { parts: ALL, align: d.align("left"), brand: 2.4 * u, logoH: 6 * u, head: 7.2 * u, sub: 2.8 * u, price: 6.8 * u, chip: 2.6 * u, proof: 2.5 * u, ends: 2.5 * u, cta: 3 * u };
        let aw = 26 * u, b = null;
        for (const [a, hl] of [[34, 3], [30, 3], [30, 4], [26, 4]]) { b = tryStack(avail, { ...so, maxW: colFor(a * u), headLines: hl }); if (b) { aw = a * u; break; } }
        if (!b) b = fitStack(avail, { ...so, maxW: colFor(aw), headLines: 4 });
        const ax = fR - 5.2 * u - aw, ay = (hasSeal ? 13.5 : 11) * u, ah = H - ay - 9 * u;
        base(ax, ay, aw, ah); win(ax, ay, aw, ah, hasSeal);
        b.draw(x0, top + (avail - b.h) / 2);
        seal(ax + aw / 2, ay + 0.6 * u, 7 * u);
        return;
      }

      if (k.portrait) {
        const al = d.align("center"), x0 = fL + 5 * u, maxW = fR - 5 * u - x0, axc = (fL + fR) / 2, top = 7.5 * u;
        const hb = fitStack(9 * u, { parts: ["brand"], maxW, align: al, brand: 2.5 * u, logoH: 6.4 * u });
        const b = fitStack(H * 0.36, { parts: ALL.filter((p) => p !== "brand"), maxW, align: al, head: 6.8 * u, sub: 2.8 * u, price: 6.6 * u, chip: 2.6 * u, proof: 2.5 * u, ends: 2.5 * u, cta: 3 * u, headLines: 2 });
        const ty = H - 7.5 * u - b.h;
        const ay = (hb.h ? top + hb.h + 3.5 * u : top) + (hasSeal ? 6.2 * u : 2.6 * u), ah = ty - 4.5 * u - ay, aw = Math.min(maxW * 0.72, ah * 0.74), ax = axc - aw / 2;
        base(ax, ay, aw, ah); win(ax, ay, aw, ah, hasSeal);
        hb.draw(x0, top); b.draw(x0, ty);
        seal(axc, ay + 0.6 * u, 7 * u);
        return;
      }

      if (k.story) {
        const al = d.align("center"), x0 = fL + 3.5 * u, x1 = W * 0.88 - 0.6 * u, maxW = x1 - x0, axc = (x0 + x1) / 2;
        const bot = H * 0.8 - 1.2 * u;
        const b = fitStack(H * 0.38, { parts: ALL, maxW, align: al, brand: 2.4 * u, logoH: 5.4 * u, head: 6.6 * u, sub: 2.7 * u, price: 6.4 * u, chip: 2.5 * u, proof: 2.4 * u, ends: 2.4 * u, cta: 2.9 * u, headLines: 3 });
        const ty = Math.max(k.top + 0.5 * u, bot - b.h);
        const ay = 9 * u, ah = ty - 5 * u - ay, aw = Math.min(maxW * 0.84, ah * 0.7), ax = axc - aw / 2;
        base(ax, ay, aw, ah); win(ax, ay, aw, ah, false);
        b.draw(x0, ty);
        const R = 7.5 * u;
        seal(ax + aw - 1 * u, k.top + R + 1 * u, R);
        return;
      }

      // landscape: window on the left, the offer on the right, the paar down the right edge
      const ay = 8.5 * u, ah = H - ay - 8.5 * u, aw = Math.min(ah * 0.7, W * 0.31), ax = fL + 5.5 * u;
      base(ax, ay, aw, ah); win(ax, ay, aw, ah, false);
      const x0 = ax + aw + 9 * u, maxW = fR - 5.5 * u - x0, avail = H - k.top - k.bottom;
      // a link ad is seen small: fewer, larger parts (one chip row) rather than everything at a squint
      const b = fitStack(avail, { parts: ALL, maxW, align: d.align("left"), brand: 3.2 * u, logoH: 7 * u, head: 10 * u, sub: 3.8 * u, price: 9 * u, chip: 3.6 * u, chipRows: 1, proof: 3.5 * u, ends: 3.5 * u, cta: 4.2 * u, headLines: 2 });
      b.draw(x0, k.top + (avail - b.h) / 2);
      seal(ax + aw, ay + Math.min(aw * 0.62, ah * 0.45), 7.5 * u);
    },
  });
})();
