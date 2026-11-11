/* Boishakh: Pohela Boishakh in lal-shada (festive red + white).
   A white rice-paste alpona mandala on festive red frames the product in a round window; the offer sits on a
   cream "shada" panel with a scalloped alpona edge and a red sari-border hem. The seller's brand colour drives the
   button, the chip dots, the highlighted words and one ring of petals, so the ad still follows the brand. */
GRS.register({
  id: "boishakh", name: "Boishakh", group: "festive", photos: 1, cutout: "optional",
  desc: "Lal-shada alpona mandala, Shubho Noboborsho",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const TAU = Math.PI * 2, UP = -Math.PI / 2;
    const RED = "#C8102E", RED_HI = "#DE2C43", RED_D = "#8E0B21", CREAM = "#FFF6E8", WHITE = "#FFFFFF", INK = "#2B0C12", GOLD = "#F4B740";
    const isBn = (s) => /[ঀ-৿]/.test(String(s || ""));

    /* ---------- the brand colour, adapted to lal-shada ---------- */
    const P = c.primary, sat = d.toHsl(P)[1];
    // on red (one petal ring, plate ring): the brand hue, lifted to a pastel when it would sink into the red
    let accR = sat < 0.15 ? GOLD : P;
    if (sat >= 0.15 && !(d.lum(P) > 0.3 && d.contrast(P, RED) >= 2)) for (let m = 0.3; m <= 0.95 && d.lum(accR) < 0.42; m += 0.08) accR = d.mix(P, WHITE, m);
    // on cream (chip dots, highlighted words, plate ring): the brand colour, deepened until it reads
    let accC = P;
    for (let m = 0.08; m <= 0.8 && d.contrast(accC, CREAM) < 3.2; m += 0.08) accC = d.mix(P, "#000000", m);
    const lightBrand = d.contrast(P, CREAM) < 1.8;
    const hiCol = lightBrand ? INK : d.contrast(accC, INK) < 1.6 ? RED : accC;   // near-black brands highlight in lal red
    const ctaBase = d.mix(P, "#000000", lightBrand ? 0.32 : 0.38);

    const festive = t.festiveOr("Shubho Noboborsho", "শুভ নববর্ষ");

    /* ---------- small drawing helpers ---------- */
    const petal = (cx, cy, a, r0, r1, hw) => {            // almond petal from radius r0 to r1 along angle a
      const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, mr = r0 + (r1 - r0) * 0.42;
      const mx = cx + ca * mr, my = cy + sa * mr;
      g.moveTo(cx + ca * r0, cy + sa * r0);
      g.quadraticCurveTo(mx + nx * hw * 2, my + ny * hw * 2, cx + ca * r1, cy + sa * r1);
      g.quadraticCurveTo(mx - nx * hw * 2, my - ny * hw * 2, cx + ca * r0, cy + sa * r0);
    };
    const dotRing = (cx, cy, r, n, dr, col, off = UP) => {
      g.fillStyle = col; g.beginPath();
      for (let i = 0; i < n; i++) { const a = off + (i / n) * TAU, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; g.moveTo(x + dr, y); g.arc(x, y, dr, 0, TAU); }
      g.fill();
    };
    const ring = (cx, cy, r, lw, col) => { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.lineWidth = lw; g.strokeStyle = col; g.stroke(); };
    const scallopCircle = (cx, cy, r, n) => {               // a circle with n round bumps (lotus plate)
      const br = r * Math.sin(Math.PI / n) * 1.02;
      g.beginPath();
      for (let i = 0; i < n; i++) { const a = UP + (i / n) * TAU; g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, br, a - Math.PI / 2, a + Math.PI / 2); }
      g.closePath();
    };

    /* the alpona mandala around the product window. Returns the window (photo) radius. */
    const mandala = (cx, cy, R, rays = true) => {
      const q = R / 30, n = 16;
      g.save();
      // dawn glow + sun-wheel rays (Boishakh starts at sunrise)
      const gl = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.5);
      gl.addColorStop(0, "rgba(255,255,255,0.17)"); gl.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, R * 1.5, 0, TAU); g.fill();
      if (rays) {
        g.strokeStyle = "rgba(255,255,255,.2)"; g.lineCap = "round"; g.lineWidth = 0.3 * q; g.beginPath();
        for (let i = 0; i < 64; i++) {
          const a = UP + (i / 64) * TAU + Math.PI / 64, l = i % 4 === 0 ? 1.36 : i % 2 ? 1.15 : 1.24;
          g.moveTo(cx + Math.cos(a) * R * 1.09, cy + Math.sin(a) * R * 1.09); g.lineTo(cx + Math.cos(a) * R * l, cy + Math.sin(a) * R * l);
        }
        g.stroke();
      }
      // seed dots beyond the petal tips and between them
      dotRing(cx, cy, R * 1.045, n, 0.6 * q, WHITE);
      dotRing(cx, cy, R * 0.955, n, 0.4 * q, WHITE, UP + Math.PI / n);
      // outer lotus (shapla) petals: white rice paste with a red heart and a white seed
      g.fillStyle = WHITE; g.beginPath(); for (let i = 0; i < n; i++) petal(cx, cy, UP + (i / n) * TAU, R * 0.74, R, R * 0.08); g.fill();
      g.fillStyle = RED; g.beginPath(); for (let i = 0; i < n; i++) petal(cx, cy, UP + (i / n) * TAU, R * 0.795, R * 0.93, R * 0.038); g.fill();
      dotRing(cx, cy, R * 0.872, n, 0.48 * q, WHITE);
      // brand-colour petals in between, each tipped with a seed
      g.fillStyle = accR; g.beginPath(); for (let i = 0; i < n; i++) petal(cx, cy, UP + ((i + 0.5) / n) * TAU, R * 0.765, R * 0.9, R * 0.034); g.fill();
      // bands: a solid line and a string of rice-paste dots
      ring(cx, cy, R * 0.745, 0.95 * q, WHITE);
      dotRing(cx, cy, R * 0.712, 56, 0.36 * q, WHITE);
      g.restore();
      return R * 0.6;
    };

    /* the product inside the mandala window (a cut-out breaks out of the top of the window) */
    const windowPhoto = (cx, cy, r) => {
      // lotus plate with a scalloped rim (a seller photo gets a slightly larger window: it carries the whole message)
      const cut = d.hasCutout(), pl = cut ? 1.04 : 1.1;
      g.save(); g.shadowColor = "rgba(60,0,10,.35)"; g.shadowBlur = r * 0.12; g.shadowOffsetY = r * 0.03;
      g.fillStyle = WHITE; scallopCircle(cx, cy, r * pl, cut ? 36 : 44); g.fill(); g.restore();
      ring(cx, cy, r * pl, Math.max(1.5, r * 0.012), d.rgba(RED, 0.25));
      const ri = cut ? r : r * 1.065;
      if (cut) {
        const gr = g.createRadialGradient(cx, cy - ri * 0.2, ri * 0.1, cx, cy, ri);
        gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(1, "#F8E9D6");
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, ri, 0, TAU); g.fill();
        // a faint alpona inside the window
        g.save(); g.beginPath(); g.arc(cx, cy, ri, 0, TAU); g.clip();
        g.fillStyle = d.rgba(RED, 0.07); g.beginPath(); for (let i = 0; i < 12; i++) petal(cx, cy, UP + (i / 12) * TAU, ri * 0.55, ri * 0.98, ri * 0.09); g.fill();
        ring(cx, cy, ri * 0.52, ri * 0.012, d.rgba(RED, 0.12));
        g.restore();
        ring(cx, cy, ri, Math.max(2, r * 0.016), accC);
        const bw = r * 1.62, bh = r * 2.12;
        d.product(cx - bw / 2, cy + r * 0.78 - bh, bw, bh, { shadowColor: "rgba(70,10,15,.32)" });
      } else {
        d.photo(cx - ri, cy - ri, ri * 2, ri * 2, { clip: () => { g.beginPath(); g.arc(cx, cy, ri, 0, TAU); } });
        ring(cx, cy, ri, Math.max(2, r * 0.016), WHITE);
        ring(cx, cy, ri - Math.max(2, r * 0.016), Math.max(1.5, r * 0.01), d.rgba(RED, 0.35));
      }
    };

    /* red field with a soft radial light and a faint woven texture */
    const redField = (x, y, w, h, gx, gy, gr) => {
      const rg = g.createRadialGradient(gx, gy, gr * 0.12, gx, gy, gr);
      rg.addColorStop(0, RED_HI); rg.addColorStop(0.55, RED); rg.addColorStop(1, RED_D);
      g.fillStyle = rg; g.fillRect(x, y, w, h);
      d.pattern("lattice", x, y, w, h, "rgba(255,255,255,.045)", { size: 3.4 * u, line: Math.max(1, 0.12 * u) });
    };

    /* cream panel whose top edge (local y = 0) is a row of scallops bulging up, with a rice-paste outline.
       Drawn in a local frame: x from 0 to len along the edge, panel extends to local y = depth. */
    const scallopPanel = (len, depth, r) => {
      const n = Math.max(4, Math.round(len / (2 * r))), sw = len / n, rr = sw / 2;
      g.fillStyle = CREAM; g.beginPath(); g.moveTo(0, depth); g.lineTo(0, 0);
      for (let i = 0; i < n; i++) g.arc(sw * (i + 0.5), 0, rr, Math.PI, 0);
      g.lineTo(len, depth); g.closePath(); g.fill();
      const gap = 0.85 * u, rho = rr + gap, th = Math.acos(rr / rho), cuspY = -Math.sqrt(rho * rho - rr * rr);
      g.strokeStyle = WHITE; g.lineWidth = Math.max(1.5, 0.3 * u); g.beginPath();
      for (let i = 0; i < n; i++) { const mx = sw * (i + 0.5); g.moveTo(mx + Math.cos(Math.PI + th) * rho, Math.sin(Math.PI + th) * rho); g.arc(mx, 0, rho, Math.PI + th, TAU - th); }
      g.stroke();
      g.fillStyle = WHITE; g.beginPath();
      for (let i = 0; i <= n; i++) { const x = sw * i, y = cuspY - 0.95 * u; g.moveTo(x + 0.42 * u, y); g.arc(x, y, 0.42 * u, 0, TAU); }
      g.fill();
      g.fillStyle = d.rgba(RED, 0.85); g.beginPath();
      for (let i = 0; i < n; i++) { const x = sw * (i + 0.5), y = -rr * 0.38; g.moveTo(x + 0.3 * u, y); g.arc(x, y, 0.3 * u, 0, TAU); }
      g.fill();
    };

    /* sari-border hem: a red band with temple teeth, from y down to the bottom edge */
    const hem = (y, x0, x1) => {
      const len = x1 - x0, n = Math.max(6, Math.round(len / (2.2 * u))), st = len / n, th = 1.25 * u;
      g.fillStyle = RED; g.fillRect(x0, y, len, H - y + 1);
      g.beginPath();
      for (let i = 0; i < n; i++) { const xx = x0 + i * st; g.moveTo(xx, y + 0.5); g.lineTo(xx + st / 2, y - th); g.lineTo(xx + st, y + 0.5); }
      g.fill();
      g.fillRect(x0, y - th - 0.95 * u, len, Math.max(1.5, 0.26 * u));
      g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath();
      const by = y + Math.min((H - y) / 2, 1.2 * u);
      for (let i = 0; i < n; i++) { const xx = x0 + (i + 0.5) * st; g.moveTo(xx + 0.26 * u, by); g.arc(xx, by, 0.26 * u, 0, TAU); }
      g.fill();
    };

    /* paisley (kolka) drawn in rice-paste white */
    const paisleyPath = () => {
      g.beginPath();
      g.moveTo(0, 0.55);
      g.bezierCurveTo(-0.62, 0.55, -0.72, -0.25, -0.2, -0.5);
      g.bezierCurveTo(0.14, -0.66, 0.3, -0.92, 0.16, -1.22);
      g.bezierCurveTo(0.7, -1.0, 0.76, -0.2, 0.5, 0.15);
      g.bezierCurveTo(0.38, 0.42, 0.2, 0.55, 0, 0.55);
      g.closePath();
    };
    const paisley = (x, y, s, rot, flip, col) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(flip ? -s : s, s);
      g.lineJoin = "round";
      paisleyPath(); g.lineWidth = 0.05; g.strokeStyle = col; g.stroke();
      g.save(); g.translate(0.05, 0.02); g.scale(0.7, 0.7); paisleyPath(); g.restore(); g.lineWidth = 0.035; g.stroke();
      g.fillStyle = col; g.beginPath(); g.arc(0.03, 0.05, 0.13, 0, TAU); g.fill();
      for (let i = 0; i < 7; i++) { const a = -0.3 + i * 0.5, rx = Math.cos(a) * 0.74, ry = Math.sin(a) * 0.62; g.beginPath(); g.arc(rx * 0.95 + 0.02, ry * 0.95 + 0.0, 0.035, 0, TAU); g.fill(); }
      g.restore();
    };

    /* a short alpona flourish: diamond, line, seed (dir = -1 to the left, 1 to the right) */
    const flourish = (x, y, w, dir, col) => {
      const s = 0.62 * u;
      g.save(); g.fillStyle = col; g.strokeStyle = col; g.lineCap = "round"; g.lineWidth = Math.max(1.5, 0.24 * u);
      g.beginPath(); g.moveTo(x + dir * 0.2 * s, y); g.lineTo(x + dir * 1.2 * s, y - 0.75 * s); g.lineTo(x + dir * 2.2 * s, y); g.lineTo(x + dir * 1.2 * s, y + 0.75 * s); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x + dir * 3 * s, y); g.lineTo(x + dir * (w - 1.2 * s), y); g.stroke();
      g.beginPath(); g.arc(x + dir * w, y, 0.42 * s, 0, TAU); g.fill();
      g.beginPath(); g.arc(x + dir * (w * 0.62), y - 0.9 * s, 0.26 * s, 0, TAU); g.arc(x + dir * (w * 0.62), y + 0.9 * s, 0.26 * s, 0, TAU); g.fill();
      g.restore();
    };

    /* clock icon for the offer-end date */
    const clock = (x, y, s, col) => {
      g.save(); g.strokeStyle = col; g.lineWidth = Math.max(1.5, s * 0.12); g.lineCap = "round";
      g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.42, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(x + s / 2, y + s * 0.26); g.lineTo(x + s / 2, y + s / 2); g.lineTo(x + s * 0.68, y + s * 0.6); g.stroke();
      g.restore();
    };

    /* brand: the logo (on a white plate over red) or the brand name as a letter-spaced wordmark */
    const brandMark = (x, y, maxW, maxH, al, onRed) => {
      if (d.hasLogo) return d.logo(x, y, maxW, maxH, { align: al, plate: onRed ? WHITE : undefined });
      if (!t.brand) return { w: 0, h: 0 };
      // never cut the name: size it so the whole (letter-spaced) wordmark fits on one line
      const bn = isBn(t.brand), letter = bn ? 0 : 0.14, txt = bn ? t.brand : t.brand.toUpperCase();
      g.font = d.font("body", 100, 800);
      const per100 = g.measureText(txt).width + letter * 100 * txt.length;
      const s = Math.max(maxH * 0.3, Math.min(maxH * 0.6, (maxW / per100) * 100 * 0.98));
      return d.text(t.brand, x, y + (maxH - s * 1.15) / 2, { kind: "body", weight: 800, size: s, min: s * 0.7, maxW, align: al, upper: true, letter, color: onRed ? WHITE : RED_D, lines: 1, lh: 1.15 });
    };

    /* ---------- the text stack (shrinks, then drops optional parts, to fit) ---------- */
    const words = (s) => String(s || "").replace(/\*/g, " ").split(/\s+/).filter(Boolean).length;
    const build = (f, o, drop) => {
      const mW = o.maxW, al = o.align, items = [];
      const on = (p) => o.parts.includes(p) && !drop.includes(p);
      const ax = (x, w) => (al === "center" ? x + (mW - w) / 2 : al === "right" ? x + mW - w : x);
      let bad = false;
      if (on("brand") && (d.hasLogo || t.brand)) {
        const bh = o.brandH * f;
        items.push({ h: bh, gap: 0, draw: (x, y) => brandMark(x, y, mW, bh, al, false) });
      }
      if (on("festive") && festive) {
        const s = o.festive * f, orn = al === "center" ? 7 * u * f : 0;
        const opt = { kind: "hand", size: s, min: s * 0.72, maxW: mW - orn * 2, lines: 2, lh: 1.08, align: al, color: RED };
        const m = d.text(festive, 0, 0, { ...opt, measure: true });
        items.push({ h: m.h, gap: 1.2 * u * f, draw: (x, y) => {
          const r = d.text(festive, x + orn, y, opt);
          if (orn && r.lines.length === 1 && orn > 3 * u * f) {
            const cy = y + r.size * 0.62, half = r.w / 2, mid = x + mW / 2, fw = Math.min(orn - 1.2 * u * f, 7 * u);
            flourish(mid - half - 1.4 * u * f, cy, fw, -1, d.rgba(RED, 0.85)); flourish(mid + half + 1.4 * u * f, cy, fw, 1, d.rgba(RED, 0.85));
          }
        } });
      }
      if (on("head") && t.headline) {
        const s = o.head * f;
        const opt = { size: s, min: s * 0.86, lines: o.headLines, maxW: mW, align: al, color: INK, hi: hiCol, hiBg: lightBrand ? P : null, lh: 1.04 };
        const m = d.headline(0, 0, { ...opt, measure: true });
        if (m.lines.reduce((a, l) => a + l.length, 0) < words(t.headline)) bad = true;
        items.push({ h: m.h, gap: 1.4 * u * f, draw: (x, y) => d.headline(x, y, opt) });
      }
      if (on("sub") && t.sub) {
        const s = o.sub * f, opt = { kind: "body", weight: 500, size: s, min: s * 0.9, maxW: mW, lines: 2, lh: 1.24, align: al, color: d.rgba(INK, 0.72) };
        const m = d.text(t.sub, 0, 0, { ...opt, measure: true });
        if (m.lines.join(" ").length >= t.sub.replace(/\s+/g, " ").length - 1) items.push({ h: m.h, gap: 1.2 * u * f, draw: (x, y) => d.text(t.sub, x, y, opt) });
      }
      const maxChips = drop.includes("chips1") ? 1 : drop.includes("chips2") ? 2 : o.maxChips;
      if (on("chips") && t.badges.length && maxChips > 0) {
        const s = o.chip * f, opt = { size: s, max: maxChips, bg: WHITE, fg: INK, stroke: d.rgba(RED, 0.3), dot: accC, align: al };
        const m = d.chips(0, 0, mW, { ...opt, measure: true });
        items.push({ h: m.h, gap: 2.2 * u * f, draw: (x, y) => d.chips(x, y, mW, opt) });
      }
      if (on("proof") && (t.proof || t.rating)) {
        const s = o.small * f, txt = (t.ratingText ? `${t.ratingText} · ` : "") + t.proof;
        items.push({ h: s * 1.3, gap: 1.6 * u * f, draw: (x, y) => {
          g.font = d.font("body", s, 600);
          const sw = t.rating ? 5 * s * 1.1 + 4 * s * 0.2 : 0, pw = t.proof ? Math.min(g.measureText(txt).width, mW - sw - s) : 0, w = sw + (pw ? (sw ? s * 0.6 : 0) + pw : 0);
          let xx = ax(x, w);
          if (t.rating) { d.stars(xx, y + s * 0.08, s * 1.1, { color: "#E9A21B", empty: d.rgba(INK, 0.15) }); xx += sw + s * 0.6; }
          if (pw) d.text(t.rating ? txt : t.proof, xx, y + s * 0.1, { kind: "body", weight: 600, size: s, min: s * 0.8, color: d.rgba(INK, 0.8), maxW: pw + 2, lines: 1 });
        } });
      }
      if (on("ends") && t.endsText) {
        const s = o.small * f;
        items.push({ h: s * 1.3, gap: 1.4 * u * f, draw: (x, y) => {
          g.font = d.font("body", s, 700);
          const tw = Math.min(g.measureText(t.endsText).width, mW - s * 1.5), w = s * 1.5 + tw, xx = ax(x, w);
          clock(xx, y + s * 0.12, s * 1.1, RED_D);
          d.text(t.endsText, xx + s * 1.5, y + s * 0.08, { kind: "body", weight: 700, size: s, min: s * 0.8, color: RED_D, maxW: tw + 2, lines: 1 });
        } });
      }
      // price + button share a row when they fit, else stack
      if ((on("price") && t.price) || (on("cta") && t.cta)) {
        const ps = o.price * f, cs = o.cta * f, depth = 0.5 * u * f, gp = 3 * u * f;
        const pm = on("price") && t.price ? d.price(0, 0, { measure: true, size: ps }) : { w: 0, h: 0 };
        const cm = on("cta") && t.cta ? d.cta(0, 0, { measure: true, size: cs }) : { w: 0, h: 0 };
        const inline = pm.w && cm.w && pm.w + gp + cm.w <= mW;
        const h = inline ? Math.max(pm.h, cm.h + depth) : pm.h + (pm.h && cm.h ? 1.8 * u * f : 0) + (cm.h ? cm.h + depth : 0);
        const button = (bx, by) => {
          g.fillStyle = ctaBase; d.rr(bx, by + depth, cm.w, cm.h, cm.h / 2); g.fill();
          d.cta(bx, by, { size: cs, bg: P, fg: c.onPrimary });
        };
        const priceOpt = { size: ps, color: RED, oldColor: d.rgba(INK, 0.45), prefixColor: d.rgba(INK, 0.7) };
        items.push({ h, gap: 2.4 * u * f, draw: (x, y) => {
          if (inline) {
            const x0 = ax(x, pm.w + gp + cm.w);
            d.price(x0, y + (h - pm.h) / 2, priceOpt);
            button(x0 + pm.w + gp, y + (h - cm.h - depth) / 2);
          } else {
            if (pm.w) d.price(ax(x, pm.w), y, priceOpt);
            if (cm.w) button(ax(x, cm.w), y + (pm.h ? pm.h + 1.8 * u * f : 0));
          }
        } });
      }
      const total = items.reduce((a, it, i) => a + it.h + (i ? it.gap : 0), 0);
      return { h: bad ? Infinity : total, draw: (x, y) => { let yy = y; items.forEach((it, i) => { if (i) yy += it.gap; it.draw(x, yy); yy += it.h; }); } };
    };
    const stack = (avail, o) => {
      const start = (o.boost ?? k.boost) * (d.scale || 1), floor = start * 0.8;
      const drops = [[], ["sub"], ["sub", "proof"], ["sub", "proof", "ends"], ["sub", "proof", "ends", "chips2"], ["sub", "proof", "ends", "chips1"], ["sub", "proof", "ends", "chips1", "festive"]];
      for (const drop of drops) for (let f = start; f >= floor - 1e-6; f -= 0.04) { const b = build(f, o, drop); if (b.h <= avail) return b; }
      const last = drops[drops.length - 1];
      for (let f = floor; f >= 0.45; f -= 0.04) { const b = build(f, o, last); if (b.h <= avail) return b; }
      const b = build(0.45, o, last); b.h = Math.min(b.h, avail); return b;
    };
    const ALL = ["brand", "festive", "head", "sub", "chips", "proof", "ends", "price", "cta"];

    /* =============================== landscape =============================== */
    if (k.landscape) {
      const pw = W * 0.43, R = Math.min(H * 0.43, pw * 0.43), cx = pw * 0.5 - 0.5 * u, cy = H / 2;
      g.fillStyle = CREAM; g.fillRect(0, 0, W, H);
      g.save(); g.beginPath(); g.rect(0, 0, pw + 3 * u, H); g.clip();
      redField(0, 0, pw + 3 * u, H, cx, cy, Math.max(pw, H) * 0.85);
      const pr = mandala(cx, cy, R);
      g.restore();
      g.save(); g.translate(pw, H); g.rotate(UP); scallopPanel(H, W - pw + 2, 2.6 * u); g.restore();
      // hem along the bottom of the cream side
      hem(H - 1.8 * u, pw + 1.5 * u, W);
      windowPhoto(cx, cy, pr);
      d.sticker(cx + R * 0.74, cy - R * 0.7, 8.5 * u, { shape: "badge", fill: GOLD, fg: INK, stroke: WHITE, rot: -0.16 });
      const x = pw + 8 * u, colW = W - x - k.side, top = k.top, avail = H - k.top - k.bottom - 1 * u;
      const b = stack(avail, { parts: ALL, maxW: colW, align: d.align("center"), brandH: 5.8 * u, festive: 7.4 * u, head: 8.2 * u, headLines: 3, sub: 3.3 * u, chip: 3 * u, small: 3 * u, price: 8.6 * u, cta: 3.7 * u, maxChips: 3 });
      b.draw(x, top + Math.max(0, (avail - b.h) / 2));
      return;
    }

    /* ============================ square / portrait / story ============================ */
    const cx = W / 2, al = d.align("center");

    if (k.story) {
      // 9:16: the mandala rises into the (decorative) profile zone, the greeting sits on the red under it,
      // the offer on the cream panel inside the safe area, and the red returns at the bottom like the sari's other border.
      // the mandala hangs from the top edge (decoration may sit in the profile zone); the window clears it enough
      // that the sticker on its lower right stays below 14%
      const R = 30 * u, cy = R + 4.5 * u;
      const colX = W * 0.12, colW = W * 0.76;
      const fs = 5.8 * u * k.boost * (d.scale || 1);
      const fOpt = { kind: "hand", size: fs, min: fs * 0.6, maxW: colW - 12 * u, lines: 2, lh: 1.08, align: "center", color: WHITE };
      const fm = festive ? d.text(festive, 0, 0, { ...fOpt, measure: true }) : { h: 0 };
      const fy = cy + R * 1.08 + 1.5 * u;
      const edgeY = festive ? fy + fm.h + 2.6 * u : cy + R * 1.1 + 2 * u;
      const lowY = H * 0.805;
      redField(0, 0, W, edgeY + 2 * u, cx, cy, H * 0.55);
      const pr = mandala(cx, cy, R);
      g.save(); g.translate(0, edgeY); scallopPanel(W, H - edgeY + 2, 2.5 * u); g.restore();
      // lower border: red with a hanging scallop edge, a half rosette and paisleys (under the caption area: decoration only)
      redField(0, lowY, W, H - lowY, cx, H, W * 0.8);
      g.save(); g.beginPath(); g.rect(0, lowY, W, H - lowY); g.clip(); mandala(cx, H + 6 * u, 24 * u, false); g.restore();
      g.save(); g.translate(W, lowY); g.rotate(Math.PI); scallopPanel(W, 2, 2.5 * u); g.restore();
      paisley(13 * u, lowY + 14 * u, 8 * u, 2.75, true, "rgba(255,255,255,.75)");
      paisley(W - 13 * u, lowY + 14 * u, 8 * u, -2.75, false, "rgba(255,255,255,.75)");
      windowPhoto(cx, cy, pr);
      // sticker on the ring, lower right: below the profile bar and above the Reels buttons
      d.sticker(cx + Math.cos(0.5) * R * 0.86, cy + Math.sin(0.5) * R * 0.86, 9.5 * u, { shape: "badge", fill: GOLD, fg: INK, stroke: WHITE, rot: -0.16 });
      if (festive) {
        const r = d.text(festive, colX + 6 * u, fy, fOpt);
        if (r.lines.length === 1) { const mid = W / 2, half = r.w / 2, fw = Math.min(8 * u, (colW - r.w) / 2 - 2 * u); if (fw > 3 * u) { flourish(mid - half - 2 * u, fy + r.size * 0.62, fw, -1, WHITE); flourish(mid + half + 2 * u, fy + r.size * 0.62, fw, 1, WHITE); } }
      }
      // the offer may use the cream panel down to the 80% caption line (the lab's Reels zone), clear of the lower border
      const top = edgeY + 3.4 * u, avail = Math.min(H * 0.8, lowY) - 2.6 * u - top;
      const b = stack(avail, { parts: ALL.filter((p) => p !== "festive"), maxW: colW, align: al, brandH: 3.4 * u, head: 6.8 * u, headLines: 3, sub: 2.8 * u, chip: 2.5 * u, small: 2.6 * u, price: 7 * u, cta: 3 * u, maxChips: 3 });
      b.draw(colX, top + Math.max(0, (avail - b.h) / 2));
      return;
    }

    // square + portrait: red field with the mandala, cream panel with the offer, red hem at the bottom
    const sq = k.square;
    const R = sq ? 25 * u : 31 * u, cy = sq ? 32 * u : 39.5 * u, edgeY = sq ? 60 * u : 74 * u, hemY = H - 2 * u;
    redField(0, 0, W, edgeY + 2 * u, cx, cy, Math.max(W, edgeY) * 0.9);
    const pr = mandala(cx, cy, R);
    g.save(); g.translate(0, edgeY); scallopPanel(W, H - edgeY + 2, 2.5 * u); g.restore();
    hem(hemY, 0, W);
    // paisleys flanking the mandala
    const py = edgeY - (sq ? 8.5 * u : 10 * u), ps = sq ? 7.5 * u : 9 * u;
    paisley(k.side + ps * 0.4, py, ps, 0.35, false, "rgba(255,255,255,.8)");
    paisley(W - k.side - ps * 0.4, py, ps, -0.35, true, "rgba(255,255,255,.8)");
    windowPhoto(cx, cy, pr);
    brandMark(k.side * 0.8, k.side * 0.7, d.hasLogo ? 24 * u : 29 * u, 6.2 * u, "left", true);
    d.sticker(cx + Math.cos(-0.72) * R * 0.86, cy + Math.sin(-0.72) * R * 0.86, 8.5 * u, { shape: "badge", fill: GOLD, fg: INK, stroke: WHITE, rot: -0.16 });

    const top = edgeY + 2.6 * u, avail = hemY - 4.2 * u - top;
    const b = stack(avail, {
      parts: ALL.filter((p) => p !== "brand"), maxW: W - k.side * 2, align: al,
      festive: sq ? 6.2 * u : 7 * u, head: sq ? 6.6 * u : 7.4 * u, headLines: sq ? 2 : 3, sub: 3 * u,
      chip: sq ? 2.6 * u : 2.7 * u, small: 2.7 * u, price: sq ? 6.8 * u : 7.6 * u, cta: sq ? 3.1 * u : 3.3 * u, maxChips: sq ? 3 : 4,
    });
    b.draw(k.side, top + Math.max(0, (avail - b.h) / 2));
  },
});
