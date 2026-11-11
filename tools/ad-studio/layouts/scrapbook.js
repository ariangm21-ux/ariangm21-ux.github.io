/* Scrapbook: a kraft-paper moodboard. Polaroids held by washi tape (1-3 photos; the three samples when
   nothing is uploaded), the price on a sticky note with a hand-drawn arrow, torn-paper badge labels and
   little doodles. Playful and handmade, but the offer stays big and easy to read.
   1 photo  → one big polaroid + a brand colour swatch card (never the same photo twice)
   2 photos → two overlapping polaroids
   3 photos or none → three polaroids; photo 1 (the one the seller can reframe) is the front one */
GRS.register({
  id: "scrapbook", name: "Scrapbook", group: "everyday", photos: 3, cutout: "no",
  desc: "Taped polaroids, sticky-note price, doodles",
  draw(d) {
    const { g, W, H, k, t, c, u, st } = d;
    const PI = Math.PI, deg = (a) => (a * PI) / 180;
    const INK = c.ink, al = d.align("left");
    const marks = d.getMarks();
    const N = d.photoCount ? Math.min(3, d.photoCount) : 3;

    /* ---------------- colour ---------------- */
    const KRAFT = d.mix("#C9A57C", c.primary, 0.06);
    const [hue, sat, lig] = d.toHsl(c.primary);
    const yellowish = hue >= 36 && hue <= 74 && sat > 0.35 && lig > 0.42;
    const NOTE = yellowish ? "#FFB9CC" : "#FFE16B";                 // a yellow brand gets a pink note
    const PAPER = "#FCFAF4", SHADOW = "rgba(52,32,12,.36)";
    // the "pen" for doodles: the brand colour darkened until it reads on kraft (a pale brand borrows the accent instead of turning muddy)
    const deepen = (col) => [0, 0.2, 0.35, 0.5, 0.65, 0.8].map((m) => ({ m, x: d.mix(col, INK, m) })).find((o) => d.contrast(o.x, KRAFT) >= 2.6) || { m: 1, x: INK };
    const penP = deepen(c.primary), penA = deepen(c.accent);
    const PEN = penP.m <= 0.35 || penP.m <= penA.m ? penP.x : penA.x;
    const LABEL2 = d.mix(sat < 0.15 ? c.accent : c.primary, "#FFFFFF", 0.8);
    const RED = "#D13A2F";

    /* ---------------- helpers ---------------- */
    // draw rotated content around (cx, cy); its text boxes become page-space boxes (grouped) for the lint
    function rotated(cx, cy, ang, fn, tag) {
      const n0 = marks.length;
      g.save(); g.translate(cx, cy); g.rotate(ang);
      try { fn(); } finally { g.restore(); }
      const cs = Math.cos(ang), sn = Math.sin(ang);
      for (let i = n0; i < marks.length; i++) {
        const m = marks[i], xs = [], ys = [];
        [[m.x, m.y], [m.x + m.w, m.y], [m.x, m.y + m.h], [m.x + m.w, m.y + m.h]].forEach(([x, y]) => { xs.push(cx + x * cs - y * sn); ys.push(cy + x * sn + y * cs); });
        m.x = Math.min(...xs); m.y = Math.min(...ys); m.w = Math.max(...xs) - m.x; m.h = Math.max(...ys) - m.y;
        if (tag) m.tag = tag;
      }
    }
    const penSet = (col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; };
    const ax = (x, maxW, w) => (al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x);
    const whole = (m, str) => m.lines.join(" ").replace(/\s+/g, "").length >= String(str).replace(/\s+/g, "").length;

    /* ---------------- doodles (pure decoration: strokes only) ---------------- */
    function arrow(x1, y1, x2, y2, bend, col, lw) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
      const qx = (x1 + x2) / 2 - (dy / L) * bend, qy = (y1 + y2) / 2 + (dx / L) * bend;
      g.save(); penSet(col, lw);
      g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(qx, qy, x2, y2); g.stroke();
      const a = Math.atan2(y2 - qy, x2 - qx), hl = Math.max(1.8 * u, lw * 4);
      g.beginPath(); g.moveTo(x2 - Math.cos(a - 0.55) * hl, y2 - Math.sin(a - 0.55) * hl); g.lineTo(x2, y2); g.lineTo(x2 - Math.cos(a + 0.5) * hl * 0.9, y2 - Math.sin(a + 0.5) * hl * 0.9); g.stroke();
      g.restore();
    }
    function starD(cx, cy, r, col, lw, fill) { g.save(); d.star(cx, cy, r, fill || null, 5, 0.46); if (lw) { penSet(col, lw); g.stroke(); } g.restore(); }
    function heart(cx, cy, r, col, lw, fill) {
      g.save(); g.beginPath();
      g.moveTo(cx, cy + r * 0.9);
      g.bezierCurveTo(cx - r * 1.3, cy + r * 0.05, cx - r * 0.8, cy - r * 1.05, cx, cy - r * 0.32);
      g.bezierCurveTo(cx + r * 0.8, cy - r * 1.05, cx + r * 1.3, cy + r * 0.05, cx, cy + r * 0.9);
      g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); }
      if (lw) { penSet(col, lw); g.stroke(); }
      g.restore();
    }
    function sparkle(cx, cy, r, col, lw) {
      g.save(); penSet(col, lw); g.beginPath();
      g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.moveTo(cx, cy - r); g.lineTo(cx, cy + r);
      const q = r * 0.42; g.moveTo(cx - q, cy - q); g.lineTo(cx + q, cy + q); g.moveTo(cx - q, cy + q); g.lineTo(cx + q, cy - q);
      g.stroke(); g.restore();
    }
    function squiggle(x, y, w, amp, col, lw) {
      const n = Math.max(3, Math.round(w / (2.4 * u))), step = w / n;
      g.save(); penSet(col, lw); g.beginPath(); g.moveTo(x, y);
      for (let i = 0; i < n; i++) g.quadraticCurveTo(x + step * (i + 0.5), y + (i % 2 ? amp : -amp), x + step * (i + 1), y);
      g.stroke(); g.restore();
    }
    function clock(cx, cy, r, col) {
      g.save(); penSet(col, r * 0.24);
      g.beginPath(); g.arc(cx, cy, r, 0, PI * 2); g.stroke();
      g.beginPath(); g.moveTo(cx, cy - r * 0.55); g.lineTo(cx, cy); g.lineTo(cx + r * 0.42, cy + r * 0.22); g.stroke();
      g.restore();
    }

    /* ---------------- paper, tape, frames ---------------- */
    function paper() {
      const gr = g.createRadialGradient(W * 0.42, H * 0.36, 0, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.62);
      gr.addColorStop(0, d.mix(KRAFT, "#FFFFFF", 0.13)); gr.addColorStop(0.6, KRAFT); gr.addColorStop(1, d.mix(KRAFT, "#3B2410", 0.2));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const R = d.rnd(29);
      for (let i = 0; i < 7; i++) {        // soft mottling
        const x = R() * W, y = R() * H, r = (14 + R() * 26) * u, col = R() > 0.5 ? "#FFF3DC" : "#5B3A1C";
        const m = g.createRadialGradient(x, y, 0, x, y, r); m.addColorStop(0, d.rgba(col, 0.07)); m.addColorStop(1, d.rgba(col, 0));
        g.fillStyle = m; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      const dark = new Path2D(), light = new Path2D(), specks = new Path2D();
      const n = Math.round(((W * H) / (u * u)) * 0.07);
      for (let i = 0; i < n; i++) {         // short paper fibres
        const x = R() * W, y = R() * H, len = (0.5 + R() * 1.6) * u, a = R() * PI, p = R() < 0.55 ? dark : light;
        p.moveTo(x, y);
        p.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (R() - 0.5) * 0.5 * u, y + Math.sin(a) * len * 0.5 + (R() - 0.5) * 0.5 * u, x + Math.cos(a) * len, y + Math.sin(a) * len);
      }
      for (let i = 0; i < n * 0.45; i++) { const x = R() * W, y = R() * H, r = (0.08 + R() * 0.17) * u; specks.moveTo(x + r, y); specks.arc(x, y, r, 0, PI * 2); }
      g.save(); g.lineCap = "round"; g.lineWidth = Math.max(1, 0.13 * u);
      g.strokeStyle = "rgba(84,52,22,.2)"; g.stroke(dark);
      g.strokeStyle = "rgba(255,246,226,.26)"; g.stroke(light);
      g.fillStyle = "rgba(70,42,16,.22)"; g.fill(specks);
      g.restore();
    }

    // washi tape: translucent strip, torn zig-zag ends, tiny pattern
    function tape(cx, cy, len, th, ang, col, seed) {
      const R = d.rnd(seed), j = th * 0.16, n = 5;
      g.save(); g.translate(cx, cy); g.rotate(ang);
      const x0 = -len / 2, x1 = len / 2, y0 = -th / 2;
      const p = new Path2D(); p.moveTo(x0, y0); p.lineTo(x1, y0);
      for (let i = 1; i <= n; i++) p.lineTo(x1 - (i % 2 ? j * (0.6 + R()) : j * 0.2 * R()), y0 + (th * i) / n);
      p.lineTo(x0, y0 + th);
      for (let i = n - 1; i >= 0; i--) p.lineTo(x0 + (i % 2 ? j * (0.6 + R()) : j * 0.2 * R()), y0 + (th * i) / n);
      p.closePath();
      g.shadowColor = "rgba(40,25,10,.2)"; g.shadowBlur = 0.6 * u; g.shadowOffsetY = 0.2 * u;
      g.fillStyle = d.rgba(col, 0.84); g.fill(p);
      g.shadowColor = "transparent"; g.shadowBlur = 0;
      g.clip(p);
      const pc = d.lum(col) < 0.42 ? "rgba(255,255,255,.5)" : d.rgba(d.mix(col, "#000000", 0.45), 0.42);
      const kind = ["dots", "diagonal", "grid"][seed % 3];
      d.pattern(kind, x0, y0, len, th, pc, { size: th * (kind === "dots" ? 0.3 : 0.34), r: th * 0.05, line: Math.max(1, th * 0.06) });
      g.fillStyle = "rgba(255,255,255,.16)"; g.fillRect(x0, y0, len, th * 0.32);
      g.restore();
    }

    const PR = 0.255 + 0.89;                 // polaroid height / width (square photo)
    // a polaroid around photo i; returns its geometry + a local→page point mapper
    function polaroid(P) {
      const w = P.w, b = w * 0.055, pw = w - b * 2, ph = pw, bm = w * 0.2, h = b + ph + bm;
      const cs = Math.cos(P.ang), sn = Math.sin(P.ang);
      const pt = (lx, ly) => [P.cx + lx * cs - ly * sn, P.cy + lx * sn + ly * cs];
      rotated(P.cx, P.cy, P.ang, () => {
        const x0 = -w / 2, y0 = -h / 2;
        g.save(); g.shadowColor = SHADOW; g.shadowBlur = 2.4 * u; g.shadowOffsetX = 0.4 * u; g.shadowOffsetY = 1.2 * u;
        g.fillStyle = PAPER; d.rr(x0, y0, w, h, 0.35 * u); g.fill(); g.restore();
        const pg = g.createLinearGradient(0, y0, 0, y0 + h); pg.addColorStop(0, "rgba(255,255,255,0)"); pg.addColorStop(1, "rgba(120,96,64,.08)");
        g.fillStyle = pg; d.rr(x0, y0, w, h, 0.35 * u); g.fill();
        g.fillStyle = "#2A241C"; g.fillRect(x0 + b, y0 + b, pw, ph);
        d.photo(x0 + b, y0 + b, pw, ph, { i: P.i });
        const gl = g.createLinearGradient(x0 + b, y0 + b, x0 + b + pw, y0 + b + ph);
        gl.addColorStop(0, "rgba(255,255,255,.12)"); gl.addColorStop(0.45, "rgba(255,255,255,0)");
        g.fillStyle = gl; g.fillRect(x0 + b, y0 + b, pw, ph);
        g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = Math.max(1, 0.12 * u); g.strokeRect(x0 + b, y0 + b, pw, ph);
        if (P.caption) P.caption(x0 + b, y0 + b + ph, pw, bm);
      }, P.main ? "scrap-caption" : null);
      return { ...P, h, pt };
    }
    // handwritten brand under the main photo (or the seller's logo, printed on the white margin)
    function caption(x, y, w, h) {
      if (d.hasLogo) {
        const lh = h * 0.68, ly = y + (h - lh) / 2 - h * 0.02;
        if (st.logoStyle === "white") { g.fillStyle = INK; d.rr(x + w * 0.12, ly - h * 0.06, w * 0.76, lh + h * 0.12, h * 0.14); g.fill(); }
        d.logo(x + w * 0.14, ly, w * 0.72, lh, { align: "center", color: INK });
        return;
      }
      if (!t.brand) { heart(x + w / 2, y + h * 0.48, h * 0.2, PEN, 0.35 * u); return; }
      let s = h * 0.6, O = { kind: "hand", size: s, min: s * 0.55, maxW: w * 0.8, lines: 1, lh: 1 };
      let m = d.text(t.brand, 0, 0, { ...O, measure: true });
      if (!whole(m, t.brand)) { s = h * 0.4; O = { ...O, size: s, min: s * 0.6, lines: 2 }; m = d.text(t.brand, 0, 0, { ...O, measure: true }); }   // a long name: two smaller lines
      const hr = Math.min(s, h * 0.6) * 0.22, gx = x + (w - (m.w + hr * 3.2)) / 2;
      d.text(t.brand, gx, y + (h - m.h) / 2 - h * 0.04, { ...O, color: "#2B2620", maxW: m.w + 2, align: "center" });
      heart(gx + m.w + hr * 2, y + h * 0.5, hr, null, 0, RED);
    }
    // a brand colour swatch card: the "moodboard" companion of a single photo
    function swatchCard(S) {
      const w = S.w, h = w * 1.42, pad = w * 0.11;
      rotated(S.cx, S.cy, S.ang, () => {
        const x0 = -w / 2, y0 = -h / 2;
        g.save(); g.shadowColor = SHADOW; g.shadowBlur = 1.8 * u; g.shadowOffsetY = 0.9 * u; g.fillStyle = PAPER; g.fillRect(x0, y0, w, h); g.restore();
        const cols = [c.primary, c.accent, d.mix(c.primary, "#FFFFFF", 0.55)], sh = (h - pad * 2) / 3;
        cols.forEach((col, i) => {
          const yy = y0 + pad + i * sh;
          g.fillStyle = col; g.fillRect(x0 + pad, yy, w - pad * 2, sh * 0.6);
          g.fillStyle = "rgba(20,17,13,.24)"; g.fillRect(x0 + pad, yy + sh * 0.68, (w - pad * 2) * 0.62, Math.max(1, sh * 0.06));
          g.fillStyle = "rgba(20,17,13,.13)"; g.fillRect(x0 + pad, yy + sh * 0.8, (w - pad * 2) * 0.38, Math.max(1, sh * 0.05));
        });
      });
      const cs = Math.cos(S.ang), sn = Math.sin(S.ang), ty = -h / 2;
      tape(S.cx - ty * sn, S.cy + ty * cs, w * 0.7, Math.min(w * 0.2, 4.4 * u), S.ang + deg(6), c.accent, 4);
    }

    /* ---------------- the collage ---------------- */
    // polaroid specs (back → front) inside zone z; the front one shows photo 0
    function arrange(z, n) {
      const L = [], hMax = z.h * 0.94, S = (cx, cy, w, a, i) => L.push({ cx, cy, w, ang: deg(a), i, main: i === 0 });
      let swatch = null;
      if (z.w / z.h >= 1.35) {                // a row
        if (n >= 3) {
          const wc = Math.min(z.w / 2.2, hMax / PR), ws = wc * 0.84;
          S(z.x + ws * 0.62, z.y + z.h * 0.53, ws, -8, 1);
          S(z.x + z.w - ws * 0.62, z.y + z.h * 0.47, ws, 7, 2);
          S(z.x + z.w / 2, z.y + z.h * 0.5, wc, -2, 0);
        } else if (n === 2) {
          const w = Math.min(z.w / 1.95, hMax / PR);
          S(z.x + z.w / 2 + w * 0.46, z.y + z.h * 0.48, w * 0.94, 6, 1);
          S(z.x + z.w / 2 - w * 0.44, z.y + z.h * 0.5, w, -4, 0);
        } else {
          const w = Math.min(z.w * 0.56, hMax / PR), cx = z.x + z.w * 0.56;
          swatch = { cx: cx - w * 0.68, cy: z.y + z.h * 0.46, w: w * 0.36, ang: deg(-9) };
          S(cx, z.y + z.h * 0.5, w, 3, 0);
        }
      } else {                                // a cluster
        const Sz = Math.min(z.w, z.h * 0.98);
        // the back photos sit high and wide so the front one only covers their lower inner corners
        if (n >= 3) {
          S(z.x + z.w * 0.27, z.y + z.h * 0.29, Sz * 0.42, -8, 1);
          S(z.x + z.w * 0.74, z.y + z.h * 0.33, Sz * 0.4, 7, 2);
          S(z.x + z.w * 0.5, z.y + z.h * 0.67, Sz * 0.5, -2, 0);
        } else if (n === 2) {
          S(z.x + z.w * 0.72, z.y + z.h * 0.32, Sz * 0.44, 7, 1);
          S(z.x + z.w * 0.36, z.y + z.h * 0.62, Sz * 0.54, -4, 0);
        } else {
          const w = Math.min(z.w * 0.66, hMax / PR), cx = z.x + z.w * 0.56;
          swatch = { cx: cx - w * 0.64, cy: z.y + z.h * 0.42, w: w * 0.36, ang: deg(-9) };
          S(cx, z.y + z.h * 0.5, w, 3, 0);
        }
      }
      return { list: L, swatch };
    }
    // draws the collage; returns the main polaroid
    function collage(A) {
      if (A.swatch) swatchCard(A.swatch);
      let main = null;
      const mainSpec = A.list.find((p) => p.main);
      A.list.forEach((P, j) => {
        const p = polaroid({ ...P, caption: P.main ? caption : null });
        if (P.main) {
          main = p;
          const [tx, ty] = p.pt(0, -p.h / 2);
          tape(tx, ty, p.w * 0.4, Math.min(p.w * 0.1, 5.6 * u), P.ang + deg(-3), c.primary, 1);
        } else {
          const left = mainSpec ? P.cx < mainSpec.cx : j % 2 === 0;
          const [tx, ty] = p.pt((left ? -1 : 1) * (p.w / 2 - p.w * 0.07), -p.h / 2 + p.w * 0.05);
          tape(tx, ty, p.w * 0.36, Math.min(p.w * 0.1, 5 * u), P.ang + deg(left ? -42 : 42), j % 2 ? c.accent : d.mix(c.primary, "#FFFFFF", 0.4), 2 + j);
        }
      });
      return main;
    }
    // the seller's sticker, pinned near a corner of the main polaroid
    function stickerOn(p, corner, R) {
      if (!p) return;
      const lx = corner.includes("r") ? p.w / 2 - R * 0.35 : -p.w / 2 + R * 0.35;
      const ly = corner.includes("b") ? p.h / 2 - p.w * 0.2 - R * 0.2 : -p.h / 2 + R * 0.4;
      let [x, y] = p.pt(lx, ly);
      x = Math.max(R + 0.5 * u, Math.min(W - R - 0.5 * u, x));
      y = Math.max((k.story ? k.top : 0) + R + 0.8 * u, y);
      if (k.story && x + R > W * 0.88 && y + R > H * 0.45) x = W * 0.88 - R - u;
      d.sticker(x, y, R, { shape: "badge", fill: c.accent, fg: c.onAccent, rot: corner.includes("r") ? 0.2 : -0.2, stroke: "#FFFFFF" });
    }

    /* ---------------- the sticky note with the price ---------------- */
    function note(cx, cy, s, ang) {
      if (!t.price) return null;
      rotated(cx, cy, ang, () => {
        const x0 = -s / 2, y0 = -s / 2;
        const shape = () => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + s, y0); g.lineTo(x0 + s, y0 + s * 0.94); g.quadraticCurveTo(x0 + s * 0.6, y0 + s * 1.03, x0, y0 + s); g.closePath(); };
        g.save(); g.shadowColor = SHADOW; g.shadowBlur = 2 * u; g.shadowOffsetX = 0.5 * u; g.shadowOffsetY = 1.2 * u;
        const gr = g.createLinearGradient(0, y0, 0, y0 + s);
        gr.addColorStop(0, d.mix(NOTE, "#8A6A00", 0.08)); gr.addColorStop(0.16, NOTE); gr.addColorStop(1, d.mix(NOTE, "#FFFFFF", 0.22));
        g.fillStyle = gr; shape(); g.fill(); g.restore();
        // the glue strip + a lifted corner
        g.fillStyle = "rgba(0,0,0,.035)"; g.fillRect(x0, y0, s, s * 0.14);
        const cg = g.createLinearGradient(x0 + s, y0 + s, x0 + s * 0.8, y0 + s * 0.84); cg.addColorStop(0, "rgba(255,255,255,.55)"); cg.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = cg; g.beginPath(); g.moveTo(x0 + s, y0 + s * 0.78); g.lineTo(x0 + s, y0 + s * 0.94); g.quadraticCurveTo(x0 + s * 0.86, y0 + s * 0.98, x0 + s * 0.74, y0 + s); g.closePath(); g.fill();

        const pad = s * 0.1, iw = s - pad * 2, pre = t.prefix, old = t.old, top = !!(pre || old);
        // the line above the price: handwritten prefix + struck-out old price; a long prefix gets its own line
        let ts = s * 0.125, ts2 = ts;
        const wPre = (sz) => { g.font = d.font("hand", sz * 1.3, 700); return pre ? g.measureText(pre).width : 0; };
        const wOld = (sz) => { g.font = d.font("body", sz, 600); return old ? g.measureText(old).width : 0; };
        let A = wPre(ts), B = wOld(ts);
        const split = !!(pre && old) && A + B + ts * 0.5 > iw;
        if (split) { if (A > iw) { ts *= iw / A; A = wPre(ts); } if (B > iw) { ts2 *= iw / B; B = wOld(ts2); } }
        else if (A + B + (A && B ? ts * 0.5 : 0) > iw) { ts *= iw / (A + B + (A && B ? ts * 0.5 : 0)); ts2 = ts; A = wPre(ts); B = wOld(ts); }
        let ps = s * (split ? 0.26 : top ? 0.3 : 0.36);
        g.font = d.font("display", ps); const pw0 = g.measureText(t.price).width; if (pw0 > iw) ps *= iw / pw0;
        g.font = d.font("display", ps); const pw = g.measureText(t.price).width;
        const topH = split ? ts * 1.4 + ts2 * 1.35 : top ? Math.max(ts, ts2) * 1.45 : 0, g1 = top ? s * 0.03 : 0, priceH = ps * 1.12, g2 = s * 0.035, sq = s * 0.05;
        const tot = topH + g1 + priceH + g2 + sq, area0 = y0 + s * 0.15, area1 = y0 + s * 0.93;
        let y = area0 + Math.max(0, (area1 - area0 - tot) / 2);
        const oldAt = (xx, oy) => {
          d.text(old, xx, oy, { kind: "body", size: ts2, weight: 600, min: ts2 * 0.8, color: d.rgba(INK, 0.62), maxW: B + 2, lines: 1 });
          g.save(); penSet(RED, Math.max(1.5, ts2 * 0.13)); g.beginPath(); g.moveTo(xx - ts2 * 0.15, oy + ts2 * 0.72); g.lineTo(xx + B + ts2 * 0.15, oy + ts2 * 0.42); g.stroke(); g.restore();
        };
        if (split) {
          d.text(pre, x0 + (s - A) / 2, y, { kind: "hand", size: ts * 1.3, min: ts, color: INK, maxW: A + 2, lines: 1 });
          oldAt(x0 + (s - B) / 2, y + ts * 1.4);
          y += topH + g1;
        } else if (top) {
          let xx = x0 + (s - (A + B + (A && B ? ts * 0.5 : 0))) / 2;
          if (pre) { d.text(pre, xx, y, { kind: "hand", size: ts * 1.3, min: ts, color: INK, maxW: A + 2, lines: 1 }); xx += A + ts * 0.5; }
          if (old) oldAt(xx, y + ts * 0.3);
          y += topH + g1;
        }
        d.text(t.price, x0 + pad, y, { kind: "display", size: ps, min: ps * 0.6, color: INK, maxW: iw, align: "center", lines: 1 });
        y += priceH + g2;
        squiggle(x0 + (s - pw * 0.78) / 2, y + sq / 2, pw * 0.78, s * 0.018, RED, Math.max(1.5, s * 0.016));
      }, "scrap-note");
      return { cx, cy, s, x: cx - s / 2, y: cy - s / 2 };
    }

    /* ---------------- text parts: each { h, draw(x, y) } ---------------- */
    let ctaBox = null;
    // short headlines ("New arrival") start bigger; long ones shrink to fit
    const headLen = [...t.headline.replace(/\*/g, "")].length;
    const headBoost = headLen <= 12 ? 1.2 : headLen <= 18 ? 1.08 : 1;
    function mkHead(f, colW, base, maxLines) {
      if (!t.headline) return null;
      const size = base * f * headBoost, want = GRS.tokens(t.headline).length;
      const ok = (m) => m.lines.reduce((a, l) => a + l.length, 0) >= want && m.w <= colW + 1;
      const meas = () => d.headline(0, 0, { measure: true, size, min, lines: L, maxW: colW });
      let min = Math.min(size, Math.max(5 * u, size * 0.62)), L = maxLines, m = null;
      for (; L <= maxLines + 1; L++) { m = meas(); if (ok(m)) break; }
      if (!ok(m)) { min = Math.min(size, 3.6 * u); L = maxLines + 1; m = meas(); }
      // a single word wider than the column (a pasted link, a very long name): shrink until it fits
      for (let i = 0; i < 4 && !ok(m); i++) { min = Math.max(1.5 * u, Math.min(min, (m.size * colW) / Math.max(1, m.w)) - 2); m = meas(); }
      const ul = 2.2 * u * f;
      return { h: m.h + ul, draw(x, y) {
        const r = d.headline(x, y, { size, min, lines: L, maxW: colW, align: al, color: INK, hi: c.onPrimary, hiBg: c.primary });
        g.font = d.font("display", r.size); const sp = g.measureText(" ").width;
        const last = r.lines[r.lines.length - 1], lw = last.reduce((a, tk, i) => a + tk.ww + (i ? sp : 0), 0);
        const sw = Math.min(lw, colW * 0.5);
        squiggle(ax(x, colW, sw), y + r.h + ul * 0.42, sw, 0.45 * u * f, PEN, Math.max(2, 0.5 * u * f));
      } };
    }
    function mkSub(f, colW, base) {
      if (!t.sub) return null;
      const s = base * f, O = { size: s, min: s * 0.85, kind: "body", weight: 500, maxW: colW, lines: 2, lh: 1.25 };
      const m = d.text(t.sub, 0, 0, { ...O, measure: true });
      if (!whole(m, t.sub)) return null;
      return { h: m.h, draw: (x, y) => d.text(t.sub, x, y, { ...O, color: d.rgba(INK, 0.8), align: al }) };
    }
    // torn paper labels for the badges (at most two rows)
    function mkLabels(f, colW, max, base) {
      if (!max || !t.badges.length) return null;
      const s = base * f, padX = s * 0.8, padY = s * 0.48, gap = s * 0.55, ch = s + padY * 2;
      g.font = d.font("body", s, 700);
      const rows = [[]]; let rw = 0;
      for (const b of t.badges.slice(0, max)) {
        const w = g.measureText(b).width + padX * 2;
        if (w > colW) continue;
        if (rows[rows.length - 1].length && rw + gap + w > colW) { if (rows.length >= 2) break; rows.push([]); rw = 0; }
        rows[rows.length - 1].push({ b, w }); rw += (rw ? gap : 0) + w;
      }
      if (!rows[0].length) return null;
      const h = rows.length * ch + (rows.length - 1) * gap;
      return { h, draw(x, y) {
        let n = 0;
        rows.forEach((row, ri) => {
          const tw = row.reduce((a, e) => a + e.w, 0) + gap * (row.length - 1);
          let lx = ax(x, colW, tw);
          const ly = y + ri * (ch + gap);
          row.forEach((e) => {
            const seed = 31 + n * 7, fill = n % 2 ? LABEL2 : PAPER, ang = deg(n % 2 ? 1.3 : -1.1);
            rotated(lx + e.w / 2, ly + ch / 2, ang, () => {
              g.save(); g.shadowColor = "rgba(52,32,12,.3)"; g.shadowBlur = 0.8 * u; g.shadowOffsetY = 0.3 * u;
              g.fillStyle = fill; torn(-e.w / 2, -ch / 2, e.w, ch, seed); g.fill(); g.restore();
              g.font = d.font("body", s, 700); g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle";
              g.fillText(e.b, 0, s * 0.06);
              d.mark(-e.w / 2, -ch / 2, e.w, ch);
            }, "scrap-labels");
            lx += e.w + gap; n++;
          });
        });
      } };
    }
    function torn(x, y, w, h, seed) {
      const R = d.rnd(seed), n = Math.max(4, Math.round(h / (0.9 * u))), j = Math.min(w * 0.06, 0.7 * u);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y);
      for (let i = 1; i <= n; i++) g.lineTo(x + w - (i % 2 ? j * (0.5 + R() * 0.8) : j * 0.15 * R()), y + (h * i) / n);
      g.lineTo(x, y + h);
      for (let i = n - 1; i >= 0; i--) g.lineTo(x + (i % 2 ? j * (0.5 + R() * 0.8) : j * 0.15 * R()), y + (h * i) / n);
      g.closePath();
    }
    function mkProof(f, colW, base) {
      if (!(t.proof || t.rating)) return null;
      const s = base * f, ss = s * 1.05, sg = ss * 0.18, sw = t.rating ? ss * 5 + sg * 4 + s * 0.55 : 0;
      let text = t.proof ? (t.ratingText ? `${t.ratingText} · ${t.proof}` : t.proof) : t.ratingText;
      const O = { size: s, min: s * 0.85, kind: "body", weight: 600, lines: 1, maxW: Math.max(1, colW - sw) };
      let m = d.text(text, 0, 0, { ...O, measure: true });
      if (!whole(m, text)) { if (!t.rating) return null; text = t.ratingText; m = d.text(text, 0, 0, { ...O, measure: true }); }
      const w = sw + m.w;
      return { h: s * 1.3, draw(x, y) {
        let xx = ax(x, colW, w);
        if (t.rating) {
          for (let i = 0; i < 5; i++) {
            const cx = xx + ss / 2 + i * (ss + sg), cy = y + s * 0.62, fp = Math.max(0, Math.min(1, t.rating - i));
            d.star(cx, cy, ss / 2, d.rgba(INK, 0.16));
            if (fp > 0) { g.save(); g.beginPath(); g.rect(cx - ss / 2, cy - ss / 2, ss * fp, ss); g.clip(); d.star(cx, cy, ss / 2, "#FFC21A"); g.restore(); }
            g.save(); d.star(cx, cy, ss / 2); penSet(d.rgba(INK, 0.75), Math.max(1, ss * 0.06)); g.stroke(); g.restore();
          }
          xx += sw;
        }
        d.text(text, xx, y + s * 0.1, { ...O, color: d.rgba(INK, 0.86), maxW: m.w + 2 });
      } };
    }
    function mkEnds(f, colW, base) {
      if (!t.endsText) return null;
      const s = base * f, ic = s * 1.1, gi = s * 0.5;
      const O = { size: s, min: s * 0.85, kind: "body", weight: 700, lines: 1, maxW: Math.max(1, colW - ic - gi) };
      const m = d.text(t.endsText, 0, 0, { ...O, measure: true });
      if (!whole(m, t.endsText)) return null;
      const w = ic + gi + m.w;
      return { h: s * 1.3, draw(x, y) {
        const xx = ax(x, colW, w);
        clock(xx + ic / 2, y + s * 0.64, ic * 0.46, RED);
        d.text(t.endsText, xx + ic + gi, y + s * 0.1, { ...O, color: INK, maxW: m.w + 2 });
      } };
    }
    function mkCta(f, colW, base) {
      if (!t.cta) return null;
      let s = base * f, arrowOn = true, m = d.cta(0, 0, { measure: true, size: s });
      while (m.w > colW && s > 2.3 * u) { s *= 0.95; m = d.cta(0, 0, { measure: true, size: s }); }
      if (m.w > colW) { arrowOn = false; m = d.cta(0, 0, { measure: true, size: s, arrow: false }); }
      while (m.w > colW && s > 1.6 * u) { s *= 0.95; m = d.cta(0, 0, { measure: true, size: s, arrow: false }); }
      const off = 0.6 * u;
      return { h: m.h + off, extra: 0.6 * u, draw(x, y) {
        const bx = ax(x, colW, m.w);
        g.save(); g.fillStyle = INK; d.rr(bx + off, y + off, m.w, m.h, m.h / 2); g.fill(); g.restore();
        d.cta(bx, y, { size: s, bg: c.primary, fg: c.onPrimary, arrow: arrowOn });
        g.save(); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, 0.22 * u); d.rr(bx, y, m.w, m.h, m.h / 2); g.stroke(); g.restore();
        ctaBox = { x: bx, y, w: m.w, h: m.h };
      } };
    }

    // a vertical stack of the parts in `set`
    function build(f, set, colW, S) {
      const P = [];
      const add = (p) => { if (p) P.push(p); };
      if (set.head) add(mkHead(f, colW, S.head * u, S.lines));
      if (set.sub) add(mkSub(f, colW, S.sub * u));
      if (set.chips) add(mkLabels(f, colW, set.chips, S.chip * u));
      if (set.proof) add(mkProof(f, colW, S.proof * u));
      if (set.ends) add(mkEnds(f, colW, S.ends * u));
      if (set.cta) add(mkCta(f, colW, S.cta * u));
      const gap = S.gap * u * f;
      const h = P.reduce((a, p, i) => a + p.h + (i ? gap + (p.extra || 0) * f : 0), 0);
      return { h, draw(x, y) { let yy = y; P.forEach((p, i) => { if (i) yy += gap + (p.extra || 0) * f; p.draw(x, yy); yy += p.h; }); } };
    }
    // shrink a little, then give up optional parts (end date, chips, proof, sub) before shrinking more
    function fit(avail, compose, chips) {
      const start = k.boost * (st.textScale || 1);
      const set = { head: true, cta: true, sub: !!t.sub, proof: !!(t.proof || t.rating), ends: !!t.endsText, chips };
      const drops = [(s) => (s.ends = false), (s) => (s.chips = Math.min(s.chips, 3)), (s) => (s.proof = false), (s) => (s.sub = false), (s) => (s.chips = Math.min(s.chips, 2))];
      for (let stage = 0; ; stage++) {
        const last = stage >= drops.length, floor = start * (last ? 0.62 : 0.84);
        for (let f = start; f >= floor - 1e-6; f -= 0.03) { const b = compose(f, set); if (b.h <= avail) return b; }
        if (last) return compose(floor, set);
        drops[stage](set);
      }
    }
    // can the button sit beside the note (in `w`) at a legible size? if not, it goes full width above the note row
    const ctaFits = (f, w, base) => !t.cta || d.cta(0, 0, { measure: true, size: Math.max(2.4 * u, base * f * 0.78), arrow: false }).w <= w;
    // the hand-drawn arrow from the button to the sticky note; it never crosses a label or any other text:
    // it tries a few curves (deeper sag, lower landing point) and is left out when none is clear
    function arrowToNote(nt, minLen) {
      if (!ctaBox || !nt) return;
      const inside = (m, x, y, w, h) => { const mx = m.x + m.w / 2, my = m.y + m.h / 2; return mx > x && mx < x + w && my > y && my < y + h; };
      const obs = marks.filter((m) => !inside(m, ctaBox.x - u, ctaBox.y - u, ctaBox.w + 2 * u, ctaBox.h + 2 * u) && !inside(m, nt.x - 3 * u, nt.y - 3 * u, nt.s + 6 * u, nt.s + 6 * u));
      const pad = 1.1 * u;
      const clear = (x1, y1, x2, y2, bend) => {
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, qx = (x1 + x2) / 2 - (dy / L) * bend, qy = (y1 + y2) / 2 + (dx / L) * bend;
        for (let i = 1; i < 24; i++) {
          const s = i / 24, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, cc = s * s;
          const px = a * x1 + b * qx + cc * x2, py = a * y1 + b * qy + cc * y2;
          if (obs.some((m) => px > m.x - pad && px < m.x + m.w + pad && py > m.y - pad && py < m.y + m.h + pad)) return false;
        }
        return true;
      };
      const x1 = ctaBox.x + ctaBox.w + 2.4 * u, x2 = nt.x - 0.4 * u;
      if (x2 - x1 < minLen) return;
      const base = Math.min(4 * u, (x2 - x1) * 0.18);
      const ys1 = [ctaBox.y + ctaBox.h * 0.55, ctaBox.y + ctaBox.h * 0.85];
      for (const y1 of ys1) {
        const y2s = [Math.min(nt.y + nt.s * 0.82, Math.max(nt.y + nt.s * 0.3, y1 - 2 * u)), nt.y + nt.s * 0.86];
        for (const y2 of y2s) for (const mul of [1, 1.8, 2.6]) {
          if (clear(x1, y1, x2, y2, base * mul)) { arrow(x1, y1, x2, y2, base * mul, PEN, Math.max(2, 0.5 * u)); return; }
        }
      }
    }

    /* ================= square + portrait: collage on top, offer below with the note on the right ================= */
    if (k.square || k.portrait) {
      // one photo: the note sticks to the polaroid's side, so the text gets the full width
      const solo = N === 1 && !!t.price;
      const S = k.square ? { head: solo ? 9.4 : 8.4, lines: 2, sub: 2.9, chip: 2.6, proof: 2.6, ends: 2.5, cta: 3.3, gap: 2.2 }
        : { head: solo ? 9.6 : 8.8, lines: 3, sub: 3, chip: 2.7, proof: 2.8, ends: 2.7, cta: 3.5, gap: 2.4 };
      const zH = (k.square ? 51 : solo ? 73 : 66) * u;     // a single portrait photo gets more room: it is the hero
      const z = { x: 3 * u, y: 3 * u, w: W - 6 * u, h: zH };
      const top = z.y + zH + 2.4 * u, bottom = H - k.bottom;
      const noteS = t.price ? (k.square ? 25 : 27) * u : 0;
      let A, noteC, colW;
      if (solo) {
        const w = Math.min(z.w * (k.square ? 0.56 : 0.6), (z.h * 0.94) / PR), cx = z.x + z.w * 0.42;
        const sw = Math.min(w * 0.34, 19 * u);
        A = { list: [{ cx, cy: z.y + z.h / 2, w, ang: deg(-3), i: 0, main: true }], swatch: { cx: Math.max(z.x + sw * 0.5, cx - w * 0.7), cy: z.y + z.h * 0.4, w: sw, ang: deg(-9) } };
        // the note overlaps only the white frame, never the seller's product photo
        noteC = { cx: Math.min(cx + w / 2 + noteS / 2 - 2 * u, W - k.side - noteS / 2 + 1.6 * u), cy: z.y + z.h * 0.63, ang: deg(5) };
        colW = W - k.side * 2;
      } else {
        A = arrange(z, N);
        const noteX = W - k.side + 1.4 * u - noteS;
        noteC = { cx: noteX + noteS / 2, cy: top + noteS / 2 - 2.4 * u, ang: deg(4) };
        colW = (noteS ? noteX - 3.6 * u : W - k.side) - k.side;
      }
      const B = fit(bottom - top, (f, set) => build(f, set, colW, S), 4);
      const by = top + Math.max(0, (bottom - top - B.h) / 2);
      // a short offer (e.g. headline + button only) pulls the note down so the two read as one group
      if (!solo && noteS) noteC.cy = Math.max(noteC.cy, Math.min(by + B.h / 2 - 1.5 * u, bottom - noteS / 2 - 1.5 * u));

      paper();
      const main = collage(A);
      stickerOn(main, solo ? "tl" : "tr", (k.square ? 8.2 : 8.8) * u);
      const nt = noteS ? note(noteC.cx, noteC.cy, noteS, noteC.ang) : null;
      B.draw(k.side, by);
      if (solo && nt) {
        // an arrow dropping onto the note from the empty corner above it, with a few sparkles
        const x2 = nt.cx + noteS * 0.2, y2 = nt.y - 1.2 * u;
        arrow(Math.min(W - 3 * u, x2 + 9 * u), z.y + 1.5 * u, x2, y2, -3 * u, PEN, Math.max(2, 0.5 * u));
        sparkle(nt.x - 1.5 * u, nt.y + 2 * u, 1.6 * u, PEN, Math.max(1.5, 0.35 * u));
        if (ctaBox && ctaBox.x + ctaBox.w + 12 * u < W - k.side) {   // a little heart + sparkle beside the button
          const hx = ctaBox.x + ctaBox.w + 5 * u, hy = ctaBox.y + ctaBox.h / 2;
          heart(hx, hy + 0.4 * u, 1.8 * u, null, 0, RED);
          sparkle(hx + 4.6 * u, hy - 1.6 * u, 1.4 * u, PEN, Math.max(1.5, 0.32 * u));
        }
      } else {
        arrowToNote(nt, 7 * u);
        if (nt) {   // doodles in the corner under the note
          const dy = nt.y + noteS + 2.4 * u, room = bottom + k.bottom * 0.6 - dy;
          if (room > 4 * u) {
            heart(nt.cx + noteS * 0.28, dy + Math.min(room, 9 * u) * 0.45, 1.7 * u, null, 0, RED);
            sparkle(nt.cx + noteS * 0.04, dy + Math.min(room, 9 * u) * 0.3, 1.4 * u, PEN, Math.max(1.5, 0.32 * u));
          }
        }
      }
      return;
    }

    /* ================= landscape: collage on the left, offer on the right ================= */
    if (k.landscape) {
      const S = { head: 10.4, lines: 2, sub: 3.1, chip: 2.7, proof: 2.9, ends: 2.8, cta: 3.5, gap: 2.4 };
      const z = { x: 2 * u, y: 3 * u, w: 88 * u, h: H - 6 * u };
      const colX = z.x + z.w + 5 * u, colW = W - k.side - colX, avail = H - k.top - k.bottom;
      const noteS = t.price ? 26 * u : 0;
      const compose = (f, set) => {
        const rowW = noteS ? colW - noteS - 4 * u : colW, wide = !ctaFits(f, rowW, S.cta * u);
        const A = build(f, { head: true, sub: set.sub, proof: set.proof, cta: wide }, colW, S);
        const R = build(f, { chips: set.chips, ends: set.ends, cta: !wide }, rowW, S);
        const gap = A.h ? 3 * u * f : 0, rowH = Math.max(R.h, noteS * 1.02);
        return { h: A.h + gap + rowH, A, R, gap, rowH };
      };
      const L = fit(avail, compose, 4);
      paper();
      const main = collage(arrange(z, N));
      stickerOn(main, "tr", 9 * u);
      const y0 = k.top + Math.max(0, (avail - L.h) / 2), rowY = y0 + L.A.h + L.gap;
      L.A.draw(colX, y0);
      const nt = note(colX + colW - noteS / 2 + 0.8 * u, rowY + L.rowH / 2, noteS, deg(4));
      L.R.draw(colX, rowY + (L.rowH - L.R.h) / 2);
      arrowToNote(nt, 6 * u);
      sparkle(W - 4.6 * u, 5.2 * u, 1.7 * u, PEN, Math.max(1.5, 0.4 * u));
      starD(W - 9.4 * u, 3.8 * u, 1.1 * u, PEN, Math.max(1.2, 0.3 * u));
      return;
    }

    /* ================= story: the photo pile on top, the offer below, the Reels caption band left to doodles ================= */
    const S = { head: 8.4, lines: 3, sub: 2.9, chip: 2.5, proof: 2.6, ends: 2.5, cta: 3.3, gap: 2.3 };
    const colX = k.side, colW = k.maxW, limit = H - k.bottom;
    const noteS = t.price ? 28 * u : 0;
    const compose = (f, set) => {
      const rowW = noteS ? colW - noteS - 3.5 * u : colW, wide = !ctaFits(f, rowW, S.cta * u);
      const A = build(f, { head: true, sub: set.sub, proof: set.proof, cta: wide }, colW, S);
      const R = build(f, { chips: set.chips, ends: set.ends, cta: !wide }, rowW, S);
      const gap = A.h ? 3.2 * u * f : 0, rowH = Math.max(R.h, noteS * 1.04);
      return { h: A.h + gap + rowH, A, R, gap, rowH };
    };
    const L = fit(limit - 68 * u, compose, 4);          // keep ≥ ~64u for the main photo
    const y0 = limit - L.h, rowY = y0 + L.A.h + L.gap;
    paper();
    // the main polaroid on top (its caption below the profile band); the other photos peek up from the
    // bottom band, where the Reels caption sits; with one photo the bottom gets the swatch card + doodles
    const zt = 4 * u, zb = y0 - 3.2 * u;
    const mw = Math.min(((zb - zt) * 0.98) / PR, 66 * u), mh = mw * PR;
    const mcx = W * 0.5, mcy = zt + (zb - zt) / 2;
    const list = [];
    let swatch = null;
    const low = limit + 30 * u;
    if (N >= 3) {
      list.push({ cx: W * 0.25, cy: low, w: 46 * u, ang: deg(-8), i: 1 });
      list.push({ cx: W * 0.77, cy: low + 3 * u, w: 46 * u, ang: deg(7), i: 2 });
    } else if (N === 2) list.push({ cx: W * 0.62, cy: low + 1 * u, w: 50 * u, ang: deg(6), i: 1 });
    else swatch = { cx: W * 0.24, cy: limit + 22 * u, w: 20 * u, ang: deg(-9) };
    list.push({ cx: mcx, cy: mcy, w: mw, ang: deg(-2), i: 0, main: true });
    const main = collage({ list, swatch });
    stickerOn(main, "tr", 9.4 * u);
    // doodles on the bottom band
    const by = limit + (H - limit) * 0.5;
    if (N === 1) {
      heart(W * 0.62, by - 4 * u, 2.4 * u, null, 0, RED);
      sparkle(W * 0.74, by - 9 * u, 2 * u, PEN, Math.max(1.5, 0.42 * u));
      starD(W * 0.8, by + 2 * u, 1.8 * u, PEN, Math.max(1.5, 0.42 * u));
      tape(W * 0.93, H - 6 * u, 26 * u, 5.4 * u, deg(-30), c.primary, 8);
    } else if (N === 2) {
      heart(W * 0.18, by - 6 * u, 2.4 * u, null, 0, RED);
      sparkle(W * 0.1, by + 4 * u, 2 * u, PEN, Math.max(1.5, 0.42 * u));
    }
    L.A.draw(colX, y0);
    const nt = note(colX + colW - noteS / 2 + 1 * u, rowY + L.rowH / 2, noteS, deg(4));
    L.R.draw(colX, rowY + (L.rowH - L.R.h) / 2);
    arrowToNote(nt, 6 * u);
  },
});
