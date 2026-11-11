/* Nakshi kantha: unbleached cotton quilted with rows of running stitch, concentric stitched borders in madder red,
   indigo and the brand's own threads, corner rosettes and hand-stitched lotus, fish, vine, boat and sun motifs.
   The product is sewn on as a tilted cloth patch and the price is an embroidered cloth tag.
   Made for sarees, kurtis, handicraft and home décor. */
(() => {
  "use strict";

  /* Pen: records a path as polylines (curves sampled every ~4px) so it can be sewn as running stitches.
     Origin (cx, cy), scale sx / sy (negative = mirrored), rotation rot. Motifs are drawn in a unit box. */
  function Pen(cx = 0, cy = 0, sx = 1, sy = sx, rot = 0) {
    const cs = Math.cos(rot), sn = Math.sin(rot), polys = [];
    let cur = null, lx = 0, ly = 0;
    const T = (x, y) => [cx + x * sx * cs - y * sy * sn, cy + x * sx * sn + y * sy * cs];
    const put = (x, y) => {
      const [X, Y] = T(x, y), n = cur.length;
      if (!n || Math.abs(cur[n - 2] - X) > 0.05 || Math.abs(cur[n - 1] - Y) > 0.05) cur.push(X, Y);
      lx = x; ly = y;
    };
    const sc = Math.max(Math.abs(sx), Math.abs(sy));
    const steps = (len) => Math.max(4, Math.min(90, Math.ceil((len * sc) / 4)));
    const p = {
      polys, T,
      M(x, y) { cur = []; polys.push(cur); put(x, y); return p; },
      L(x, y) { put(x, y); return p; },
      Q(qx, qy, x, y) {
        const x0 = lx, y0 = ly, n = steps(Math.hypot(qx - x0, qy - y0) + Math.hypot(x - qx, y - qy));
        for (let i = 1; i <= n; i++) { const t = i / n, m = 1 - t; put(m * m * x0 + 2 * m * t * qx + t * t * x, m * m * y0 + 2 * m * t * qy + t * t * y); }
        return p;
      },
      C(ax, ay, bx, by, x, y) {
        const x0 = lx, y0 = ly, n = steps(Math.hypot(ax - x0, ay - y0) + Math.hypot(bx - ax, by - ay) + Math.hypot(x - bx, y - by));
        for (let i = 1; i <= n; i++) {
          const t = i / n, m = 1 - t;
          put(m * m * m * x0 + 3 * m * m * t * ax + 3 * m * t * t * bx + t * t * t * x, m * m * m * y0 + 3 * m * m * t * ay + 3 * m * t * t * by + t * t * t * y);
        }
        return p;
      },
      A(ax, ay, r, a0, a1) {
        if (!cur) { cur = []; polys.push(cur); }
        const n = steps(Math.abs(a1 - a0) * r);
        for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; put(ax + Math.cos(a) * r, ay + Math.sin(a) * r); }
        return p;
      },
      O(x, y, r) { cur = []; polys.push(cur); return p.A(x, y, r, 0, Math.PI * 2); },
      Z() { if (cur && cur.length > 2) cur.push(cur[0], cur[1]); return p; },
    };
    return p;
  }

  GRS.register({
    id: "nakshi", name: "Nakshi kantha", group: "festive", photos: 1, cutout: "optional",
    desc: "Hand-stitched kantha borders, motifs and patch",
    draw(d) {
      const { g, W, H, k, t, c, u, f } = d;
      const bn = t.lang === "bn";
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

      /* ---------- palette: unbleached cotton, deep ink and four threads ---------- */
      const CLOTH = d.mix("#F2E6D0", c.primary, 0.035);
      const INK = d.mix("#2A1910", c.dark, 0.22);
      const darken = (hex, bg, min) => { let x = hex; for (let i = 0; i < 14 && d.contrast(x, bg) < min; i++) x = d.mix(x, "#2A1608", 0.15); return x; };
      const TP = darken(c.primary, CLOTH, 2.6), TA = darken(c.accent, CLOTH, 2.4);
      const RED = "#AC2430", IND = "#2B3C7C", GRN = "#4D7A36", SAF = "#C3841A";
      const hueGap = (a, b) => { const x = Math.abs(d.toHsl(a)[0] - d.toHsl(b)[0]) % 360; return Math.min(x, 360 - x); };
      const reddish = d.toHsl(c.primary)[1] > 0.3 && hueGap(c.primary, RED) < 26;
      const HI = d.contrast(TP, CLOTH) >= 3.2 && d.lum(TP) > 0.03 ? TP : RED;
      // the patch: a brand-dyed cotton frame (charcoal for near-black brands) around a pale window
      const PATCH = d.lum(c.primary) < 0.04 ? d.mix(c.primary, CLOTH, 0.32) : d.mix(c.primary, CLOTH, 0.6);
      const WIN = d.mix(c.primary, "#FFFFFF", 0.86);
      const TPP = d.contrast(PATCH, "#FFFFFF") > 3.2 ? "#F4E7CD" : darken(c.primary, PATCH, 2.6);
      const TAG = c.primary, TFG = c.onPrimary, PALE = d.contrast(c.primary, CLOTH) < 1.5;
      const STK = reddish ? IND : RED;
      const SUB = d.rgba(INK, 0.8), SOFT = d.rgba(INK, 0.72);
      const CHIP = d.mix(CLOTH, "#FFFFFF", 0.6);
      const SH = "rgba(72,42,16,.26)";
      const THREADS = [TP, RED, IND, TA];

      /* ---------- thread primitives ---------- */
      const sew = (path, o) => {
        const lw = o.lw || 0.3 * u;
        g.save(); g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = lw;
        if (o.alpha != null) g.globalAlpha = o.alpha;
        if (o.shadow !== false) { g.save(); g.translate(lw * 0.18, lw * 0.34); g.strokeStyle = SH; g.stroke(path); g.restore(); }
        g.strokeStyle = o.color; g.stroke(path);
        if (o.sheen !== false && lw >= 0.2 * u) { g.translate(-lw * 0.1, -lw * 0.14); g.lineWidth = lw * 0.32; g.strokeStyle = "rgba(255,255,255,.26)"; g.stroke(path); }
        g.restore();
      };
      const track = (P, closed) => {
        const n = P.length / 2, cum = new Float32Array(n);
        for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(P[2 * i] - P[2 * i - 2], P[2 * i + 1] - P[2 * i - 1]);
        const total = cum[n - 1];
        const at = (s) => {
          s = closed ? ((s % total) + total) % total : Math.max(0, Math.min(total, s));
          let lo = 0, hi = n - 1;
          while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
          const dx = P[2 * hi] - P[2 * lo], dy = P[2 * hi + 1] - P[2 * lo + 1], L = Math.hypot(dx, dy) || 1, tt = clamp((s - cum[lo]) / L, 0, 1);
          return [P[2 * lo] + dx * tt, P[2 * lo + 1] + dy * tt, dx / L, dy / L];
        };
        return { total, at };
      };
      const isClosed = (P) => Math.hypot(P[0] - P[P.length - 2], P[1] - P[P.length - 1]) < 0.5;
      /* running stitch along polylines: o = { color, lw, len, gap, seed, jit, phase, alpha, shadow, sheen } */
      const stitch = (polys, o) => {
        const len = o.len || 0.9 * u, gap = o.gap ?? len * 0.62, per = len + gap, R = d.rnd(o.seed || 7), j = o.jit ?? Math.min(0.1 * u, len * 0.1);
        const path = new Path2D();
        polys.forEach((P) => {
          if (P.length < 4) return;
          const closed = isClosed(P), T = track(P, closed);
          if (T.total < len * 0.6) return;
          let n, step, sl;
          if (closed) { n = Math.max(3, Math.round(T.total / per)); step = T.total / n; sl = (step * len) / per; }
          else { n = Math.max(1, Math.round((T.total + gap) / per)); sl = Math.min(len, T.total); step = n > 1 ? (T.total - sl) / (n - 1) : 0; }
          const ph = closed ? (o.phase || 0) * step : 0;
          for (let i = 0; i < n; i++) {
            const s0 = ph + i * step, L = sl * (0.88 + R() * 0.22);
            const a = T.at(s0), b = T.at(closed ? s0 + L : Math.min(T.total, s0 + L));
            const ox = (R() - 0.5) * j, oy = (R() - 0.5) * j;
            path.moveTo(a[0] + ox, a[1] + oy); path.lineTo(b[0] + ox + (R() - 0.5) * j, b[1] + oy + (R() - 0.5) * j);
          }
        });
        sew(path, o);
      };
      /* a continuous thread (a string, not stitches) */
      const thread = (polys, o) => {
        const path = new Path2D();
        polys.forEach((P) => { path.moveTo(P[0], P[1]); for (let i = 2; i < P.length; i += 2) path.lineTo(P[i], P[i + 1]); });
        sew(path, o);
      };
      /* zig-zag "teeth" stitch along closed polylines */
      const zigzag = (polys, amp, step, o) => {
        const path = new Path2D(), R = d.rnd(o.seed || 9), j = 0.07 * u;
        polys.forEach((P) => {
          const T = track(P, true), n = Math.max(4, Math.round(T.total / step / 2) * 2), st = T.total / n, pts = [];
          for (let i = 0; i < n; i++) { const a = T.at(i * st), sg = i % 2 ? 1 : -1; pts.push([a[0] - a[3] * amp * sg, a[1] + a[2] * amp * sg]); }
          for (let i = 0; i < n; i++) {
            const a = pts[i], b = pts[(i + 1) % n], e = 0.13;
            path.moveTo(a[0] + (b[0] - a[0]) * e + (R() - 0.5) * j, a[1] + (b[1] - a[1]) * e + (R() - 0.5) * j);
            path.lineTo(b[0] - (b[0] - a[0]) * e + (R() - 0.5) * j, b[1] - (b[1] - a[1]) * e + (R() - 0.5) * j);
          }
        });
        sew(path, o);
      };
      const crossAt = (x, y, r, col, lw) => {
        const p = new Path2D(); p.moveTo(x - r, y - r); p.lineTo(x + r, y + r); p.moveTo(x + r, y - r); p.lineTo(x - r, y + r);
        sew(p, { color: col, lw: lw || Math.max(1.5, r * 0.55) });
      };
      /* a French knot */
      const knot = (x, y, r, col) => {
        g.save();
        g.fillStyle = SH; g.beginPath(); g.arc(x + r * 0.2, y + r * 0.35, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.38, 0, Math.PI * 2); g.fill();
        g.restore();
      };
      const pathOf = (polys) => {
        const p = new Path2D();
        polys.forEach((P) => { p.moveTo(P[0], P[1]); for (let i = 2; i < P.length; i += 2) p.lineTo(P[i], P[i + 1]); p.closePath(); });
        return p;
      };
      /* kantha filling: rows of running stitch clipped to a closed shape */
      const fillRows = (polys, col, sp, ang, lw) => {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        polys.forEach((P) => { for (let i = 0; i < P.length; i += 2) { x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); y0 = Math.min(y0, P[i + 1]); y1 = Math.max(y1, P[i + 1]); } });
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rad = Math.hypot(x1 - x0, y1 - y0) / 2 + sp;
        const dx = Math.cos(ang || 0), dy = Math.sin(ang || 0), nx = -dy, ny = dx, dl = sp * 1.1, dg = sp * 0.75;
        const rows = new Path2D(); let r = 0;
        for (let o = -rad; o <= rad; o += sp, r++) {
          const sh = (r % 2) * (dl + dg) * 0.5;
          rows.moveTo(cx + nx * o - dx * (rad + sh), cy + ny * o - dy * (rad + sh)); rows.lineTo(cx + nx * o + dx * rad, cy + ny * o + dy * rad);
        }
        g.save(); g.clip(pathOf(polys)); g.setLineDash([dl, dg]); g.lineCap = "round"; g.lineWidth = lw || 0.2 * u; g.strokeStyle = col; g.stroke(rows); g.restore();
      };
      const rrPoly = (x, y, w, h, r) => {
        r = Math.min(r, w / 2, h / 2);
        return Pen().M(x + r, y).L(x + w - r, y).A(x + w - r, y + r, r, -Math.PI / 2, 0).L(x + w, y + h - r).A(x + w - r, y + h - r, r, 0, Math.PI / 2)
          .L(x + r, y + h).A(x + r, y + h - r, r, Math.PI / 2, Math.PI).L(x, y + r).A(x + r, y + r, r, Math.PI, Math.PI * 1.5).Z().polys;
      };
      const tagPoly = (x, y, w, h, n, r) => Pen().M(x + n, y).L(x + w - r, y).A(x + w - r, y + r, r, -Math.PI / 2, 0).L(x + w, y + h - r)
        .A(x + w - r, y + h - r, r, 0, Math.PI / 2).L(x + n, y + h).L(x, y + h - n).L(x, y + n).Z().polys;

      /* ---------- motifs (all hand-stitched) ---------- */
      const sz = (s, k1, a, b) => clamp(s * k1, a * u, b * u);
      const lotus = (cx, cy, s) => {
        const len = sz(s, 0.085, 0.45, 1), lw = sz(s, 0.03, 0.2, 0.34), op = { len, gap: len * 0.6, lw };
        const P = () => Pen(cx, cy, s);
        const outer = P().M(-0.05, 0).C(-0.5, 0.02, -0.86, -0.24, -0.95, -0.6).C(-0.62, -0.6, -0.28, -0.42, -0.05, 0)
          .M(0.05, 0).C(0.5, 0.02, 0.86, -0.24, 0.95, -0.6).C(0.62, -0.6, 0.28, -0.42, 0.05, 0);
        const inner = P().M(-0.04, -0.03).C(-0.36, -0.14, -0.54, -0.52, -0.47, -0.9).C(-0.25, -0.72, -0.08, -0.44, -0.04, -0.03)
          .M(0.04, -0.03).C(0.36, -0.14, 0.54, -0.52, 0.47, -0.9).C(0.25, -0.72, 0.08, -0.44, 0.04, -0.03);
        const mid = P().M(0, -1.08).C(0.21, -0.8, 0.23, -0.32, 0, -0.05).C(-0.23, -0.32, -0.21, -0.8, 0, -1.08);
        const cup = P().M(-0.64, 0.04).Q(0, 0.36, 0.64, 0.04);
        const cup2 = P().M(-0.4, 0.22).Q(0, 0.42, 0.4, 0.22);
        fillRows(outer.polys, d.rgba(TP, 0.4), len * 0.8, -0.55, lw * 0.75);
        fillRows(mid.polys, TA, len * 0.72, Math.PI / 2, lw * 0.8);
        stitch(outer.polys, { ...op, color: TP, seed: 31 });
        stitch(inner.polys, { ...op, color: RED, seed: 32 });
        stitch(mid.polys, { ...op, color: RED, seed: 33 });
        stitch(cup.polys, { ...op, color: IND, seed: 34 });
        stitch(cup2.polys, { ...op, color: IND, seed: 35 });
        [[-0.32, -1.1], [0, -1.3], [0.32, -1.1]].forEach(([x, y]) => knot(cx + x * s, cy + y * s, lw * 1.05, SAF));
      };
      const fish = (cx, cy, s, dir = 1, rot = 0) => {
        const len = sz(s, 0.09, 0.42, 0.95), lw = sz(s, 0.032, 0.2, 0.32), op = { len, gap: len * 0.6, lw };
        const P = (k2 = 1) => Pen(cx, cy, s * dir * k2, s * k2, rot);
        const body = (k2) => P(k2).M(-0.78, 0).C(-0.45, -0.54, 0.42, -0.52, 0.84, 0).C(0.42, 0.52, -0.45, 0.54, -0.78, 0);
        const tail = P().M(-0.74, 0).L(-1.12, -0.4).Q(-0.97, 0, -1.12, 0.4).L(-0.74, 0);
        const fin = P().M(-0.16, -0.4).Q(0.02, -0.72, 0.26, -0.42);
        const fin2 = P().M(-0.12, 0.41).Q(0.0, 0.62, 0.18, 0.43);
        const gill = P().M(0.38, -0.3).Q(0.25, 0, 0.38, 0.3);
        const B = body(1);
        fillRows(tail.polys, d.rgba(RED, 0.8), len * 0.75, Math.PI / 2 + rot, lw * 0.8);
        stitch(B.polys, { ...op, color: IND, seed: 41 });
        stitch(body(0.66).polys, { ...op, color: TA, seed: 42 });
        stitch(body(0.36).polys, { ...op, color: TP, seed: 43 });
        stitch(tail.polys, { ...op, color: RED, seed: 44 });
        stitch(fin.polys, { ...op, color: RED, seed: 45 });
        stitch(fin2.polys, { ...op, color: RED, seed: 46 });
        stitch(gill.polys, { ...op, color: IND, seed: 47 });
        const [ex, ey] = P().T(0.58, -0.1); knot(ex, ey, lw * 1.1, INK);
      };
      const vine = (x0, y0, x1, y1, o = {}) => {
        const L = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
        const amp = o.amp || 1.1 * u, leaf = o.leaf || 3 * u, n = Math.max(1, Math.round(L / (o.wl || 11 * u))), hw = L / (n * 2);
        const lw = o.lw || 0.26 * u, len = o.len || 0.7 * u, op = { len, gap: len * 0.6, lw };
        const stem = Pen(x0, y0, 1, 1, ang).M(0, 0);
        const leaves = Pen(), veins = Pen(), knots = [];
        for (let i = 0; i < n * 2; i++) {
          const sg = i % 2 ? 1 : -1;
          stem.Q(hw * (i + 0.5), sg * amp * 2, hw * (i + 1), 0);
          const [bx, by] = stem.T(hw * (i + 0.5), sg * amp), la = ang + sg * 0.95;
          const lp = Pen(bx, by, leaf, leaf, la);
          lp.M(0, 0).Q(0.5, -0.36, 1, 0).Q(0.5, 0.36, 0, 0);
          lp.polys.forEach((q) => leaves.polys.push(q));
          Pen(bx, by, leaf, leaf, la).M(0.14, 0).L(0.74, 0).polys.forEach((q) => veins.polys.push(q));
          if (i % 2 === 0 && o.flowers !== false) knots.push(stem.T(hw * (i + 1), 0));
        }
        fillRows(leaves.polys, d.rgba(GRN, 0.45), len * 0.75, ang + 0.6, lw * 0.75);
        stitch(stem.polys, { ...op, color: GRN, seed: 71 });
        stitch(leaves.polys, { ...op, color: GRN, seed: 72 });
        stitch(veins.polys, { ...op, color: TA, seed: 73, len: len * 0.8 });
        knots.forEach(([x, y], i) => { const r = lw * 0.95; [0, 1, 2, 3, 4].forEach((q) => { const a = (q / 5) * Math.PI * 2 + i; knot(x + Math.cos(a) * r * 2.2, y + Math.sin(a) * r * 2.2, r, RED); }); knot(x, y, r, SAF); });
      };
      const boat = (cx, cy, s, dir = 1) => {
        const len = sz(s, 0.08, 0.45, 1), lw = sz(s, 0.026, 0.22, 0.34), op = { len, gap: len * 0.6, lw };
        const P = () => Pen(cx, cy, s * dir, s);
        const hull = P().M(-1.06, -0.34).C(-0.8, 0.26, 0.8, 0.26, 1.06, -0.34).C(0.62, -0.06, -0.62, -0.06, -1.06, -0.34);
        const roof = P().M(-0.5, -0.13).C(-0.52, -0.62, 0.3, -0.64, 0.3, -0.13).Z();
        const mast = P().M(0.5, -0.12).L(0.5, -1.3);
        const sail = P().M(0.54, -1.24).Q(1.04, -0.92, 0.98, -0.36).L(0.55, -0.32).Z();
        fillRows(hull.polys, d.rgba(RED, 0.85), len * 0.7, 0, lw * 0.8);
        fillRows(roof.polys, d.rgba(TA, 0.8), len * 0.7, Math.PI / 2, lw * 0.8);
        fillRows(sail.polys, d.rgba(TP, 0.45), len * 0.8, -0.8, lw * 0.75);
        stitch(hull.polys, { ...op, color: RED, seed: 81 });
        stitch(roof.polys, { ...op, color: IND, seed: 82 });
        stitch(mast.polys, { ...op, color: INK, seed: 83 });
        stitch(sail.polys, { ...op, color: TP, seed: 84 });
      };
      const waves = (x0, x1, y, amp, wl, col, seed, lw) => {
        const p = Pen().M(x0, y), n = Math.max(1, Math.round((x1 - x0) / wl)), hw = (x1 - x0) / (n * 2);
        for (let i = 0; i < n * 2; i++) p.Q(x0 + hw * (i + 0.5), y + (i % 2 ? amp : -amp) * 2, x0 + hw * (i + 1), y);
        stitch(p.polys, { color: col, lw: lw || 0.28 * u, len: 0.95 * u, gap: 0.6 * u, seed });
      };
      const sun = (cx, cy, r) => {
        const lw = sz(r, 0.06, 0.22, 0.34), len = sz(r, 0.16, 0.45, 0.9), op = { len, gap: len * 0.6, lw };
        const rays = new Path2D();
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r0 = r * 1.24, r1 = r * (i % 2 ? 1.5 : 1.78);
          rays.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); rays.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        }
        sew(rays, { color: SAF, lw: lw * 1.05 });
        const spiral = Pen(cx, cy, r).M(0.06, 0);
        for (let a = 0; a <= Math.PI * 6; a += 0.25) { const rr = 0.06 + (a / (Math.PI * 6)) * 0.5; spiral.L(Math.cos(a) * rr, Math.sin(a) * rr); }
        fillRows(Pen(cx, cy, r).O(0, 0, 1).polys, d.rgba(RED, 0.18), len * 0.8, 0.3, lw * 0.7);
        stitch(Pen(cx, cy, r).O(0, 0, 1).polys, { ...op, color: RED, seed: 91 });
        stitch(Pen(cx, cy, r).O(0, 0, 0.7).polys, { ...op, color: TP, seed: 92 });
        stitch(spiral.polys, { ...op, color: TA, seed: 93, len: len * 0.8 });
      };
      const rosette = (cx, cy, r, i0) => {
        const lw = sz(r, 0.06, 0.2, 0.32), len = sz(r, 0.14, 0.32, 0.75), op = { len, gap: len * 0.55, lw };
        const pa = Pen(), pb = Pen();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          Pen(cx, cy, r, r, a).M(0.3, 0).Q(0.64, -0.32, 1, 0).Q(0.64, 0.32, 0.3, 0).polys.forEach((q) => (i % 2 ? pb : pa).polys.push(q));
        }
        fillRows(pa.polys, d.rgba(RED, 0.5), len * 0.75, 0.4, lw * 0.75);
        stitch(pa.polys, { ...op, color: RED, seed: 101 + i0 });
        stitch(pb.polys, { ...op, color: TP, seed: 111 + i0 });
        stitch(Pen(cx, cy, r).O(0, 0, 0.22).polys, { ...op, color: IND, seed: 121 + i0 });
        knot(cx, cy, lw * 1.2, TA);
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; knot(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82, lw * 0.8, SAF); }
      };
      const heart = (cx, cy, r, col) => {
        const p = Pen(cx, cy, r).M(0, 0.9).C(-1.35, -0.1, -0.9, -1.3, 0, -0.5).C(0.9, -1.3, 1.35, -0.1, 0, 0.9);
        g.save(); g.fillStyle = col; g.fill(pathOf(p.polys)); g.restore();
        stitch(Pen(cx, cy, r * 0.62).M(0, 0.9).C(-1.35, -0.1, -0.9, -1.3, 0, -0.5).C(0.9, -1.3, 1.35, -0.1, 0, 0.9).polys, { color: "rgba(255,240,220,.85)", lw: Math.max(1.2, r * 0.12), len: r * 0.32, gap: r * 0.22, shadow: false, sheen: false });
      };
      const clock = (cx, cy, r, col) => {
        const p = new Path2D(); p.arc(cx, cy, r, 0, Math.PI * 2); p.moveTo(cx, cy - r * 0.55); p.lineTo(cx, cy); p.lineTo(cx + r * 0.42, cy + r * 0.26);
        g.save(); g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = Math.max(1.5, r * 0.2); g.strokeStyle = col; g.stroke(p); g.restore();
      };

      /* ---------- the cloth ---------- */
      const cloth = () => {
        g.fillStyle = CLOTH; g.fillRect(0, 0, W, H);
        g.save();
        // weave: fine crossing warp and weft
        const ws = Math.max(3, 0.5 * u);
        let p = new Path2D();
        for (let x = ws / 2; x < W; x += ws) { p.moveTo(x, 0); p.lineTo(x, H); }
        g.lineWidth = Math.max(1, 0.1 * u); g.strokeStyle = "rgba(118,84,42,.05)"; g.stroke(p);
        p = new Path2D();
        for (let y = ws / 2; y < H; y += ws) { p.moveTo(0, y); p.lineTo(W, y); }
        g.strokeStyle = "rgba(118,84,42,.04)"; g.stroke(p);
        // slubs: the odd thicker thread in hand-woven cotton
        const R = d.rnd(17), pd = new Path2D(), pl = new Path2D(), n = Math.round((W * H) / 9000);
        for (let i = 0; i < n; i++) { const x = R() * W, y = R() * H, w = (1.5 + R() * 6) * u; (i % 2 ? pd : pl).rect(x, y, w, Math.max(1, 0.14 * u)); }
        g.fillStyle = "rgba(118,84,42,.05)"; g.fill(pd); g.fillStyle = "rgba(255,255,255,.22)"; g.fill(pl);
        // kantha quilting: rows of running stitch in self-coloured thread, gently rippled
        const rs = 1.75 * u, amp = 0.2 * u, wl = 26 * u, rowsA = new Path2D(), rowsB = new Path2D();
        let i = 0;
        for (let y = rs * 0.6; y < H; y += rs, i++) {
          const q = i % 2 ? rowsB : rowsA, ph = (i % 3) * wl * 0.17;
          q.moveTo(-wl + ph, y);
          for (let x = -wl + ph, s2 = 1; x < W + wl; x += wl / 2, s2 = -s2) q.quadraticCurveTo(x + wl / 4, y + amp * 2 * s2, x + wl / 2, y);
        }
        g.lineCap = "round"; g.lineWidth = Math.max(1, 0.17 * u); g.setLineDash([0.95 * u, 0.72 * u]);
        g.strokeStyle = "rgba(255,255,255,.42)";
        g.lineDashOffset = 0; g.stroke(rowsA); g.lineDashOffset = 0.8 * u; g.stroke(rowsB);
        g.translate(0.05 * u, 0.12 * u); g.strokeStyle = "rgba(110,76,36,.10)";
        g.lineDashOffset = 0; g.stroke(rowsA); g.lineDashOffset = 0.8 * u; g.stroke(rowsB);
        g.restore();
        // warm vignette, like old cotton
        const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.62);
        vg.addColorStop(0, "rgba(255,250,240,0)"); vg.addColorStop(1, "rgba(140,96,44,.16)");
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
      };

      /* concentric stitched borders + corner rosettes */
      const FI = [2.0 * u, 3.2 * u, 4.5 * u, 5.9 * u], RZ = 4.2 * u;
      const frame = () => {
        const cr = FI[2], corners = [[cr, cr], [W - cr, cr], [cr, H - cr], [W - cr, H - cr]];
        g.save();
        const clip = new Path2D(); clip.rect(0, 0, W, H);
        corners.forEach(([x, y]) => { clip.moveTo(x + RZ * 1.12, y); clip.arc(x, y, RZ * 1.12, 0, Math.PI * 2); });
        g.clip(clip, "evenodd");
        const rr = (i, r) => rrPoly(FI[i], FI[i], W - 2 * FI[i], H - 2 * FI[i], r);
        stitch(rr(0, 3 * u), { color: RED, lw: 0.4 * u, len: 1.45 * u, gap: 0.8 * u, seed: 11 });
        stitch(rr(1, 2.4 * u), { color: IND, lw: 0.3 * u, len: 0.8 * u, gap: 0.6 * u, seed: 12 });
        zigzag(rr(2, 1.8 * u), 0.6 * u, 1.25 * u, { color: TA, lw: 0.28 * u, seed: 13 });
        stitch(rr(3, 1.4 * u), { color: TP, lw: 0.34 * u, len: 1.15 * u, gap: 0.7 * u, seed: 14 });
        g.restore();
        corners.forEach(([x, y], i) => rosette(x, y, RZ, i));
      };

      /* ---------- type ---------- */
      const HK = f.key === "modern" ? "serif" : "display";
      const HW = HK === "serif" ? 700 : undefined;
      const LH = bn ? 1.2 : 1.06;
      const headN = GRS.tokens(t.headline).length;
      const tagline = t.festiveOr("Handmade with love", "ভালোবাসায় হাতে তৈরি");
      const memo = new Map();
      const mm = (key, fn) => { if (!memo.has(key)) memo.set(key, fn()); return memo.get(key); };

      const brandFit = (s0, maxW, al) => {
        const txt = bn ? t.brand : t.brand.toUpperCase(), ls = bn ? 0 : 0.16, sides = al === "center" ? 2 : 1;
        let s = s0, w = 0;
        const meas = () => { g.save(); g.font = d.font("body", s, 700); if ("letterSpacing" in g) g.letterSpacing = `${ls * s}px`; w = g.measureText(txt).width; g.restore(); return w + sides * s * 1.45; };
        while (meas() > maxW && s > s0 * 0.6) s -= 1;
        return { txt, s, ls, w: Math.min(w, maxW - sides * s * 1.45), h: s0 * 1.35 };
      };
      const brandDraw = (B, x, y, al, maxW) => {
        const r = B.s * 0.3, sp = B.s * 0.85, unit = 2 * r + sp, total = B.w + (al === "center" ? 2 : 1) * unit;
        const x0 = al === "center" ? x + (maxW - total) / 2 : al === "right" ? x + maxW - total : x, cy = y + B.h / 2;
        const tx = al === "right" ? x0 : x0 + unit;
        if (al !== "right") crossAt(x0 + r, cy, r, RED);
        if (al !== "left") crossAt(tx + B.w + sp + r, cy, r, RED);
        d.tag("brand");
        g.save(); g.font = d.font("body", B.s, 700); g.fillStyle = SOFT; g.textBaseline = "middle"; g.textAlign = "left";
        if ("letterSpacing" in g) g.letterSpacing = `${B.ls * B.s}px`;
        g.fillText(B.txt, tx, cy + B.s * 0.06, B.w + 1); g.restore();
        d.mark(tx, y, B.w, B.h); d.tag("");
      };
      const rule = (x, y, w, al) => {
        const lw = 0.26 * u, op = { color: RED, lw, len: 0.7 * u, gap: 0.45 * u, seed: 131 }, fr = 0.62 * u;
        const flower = (fx) => { [0, 1, 2, 3].forEach((q) => { const a = (q / 4) * Math.PI * 2 + Math.PI / 4; knot(fx + Math.cos(a) * fr, y + Math.sin(a) * fr, lw * 1.05, q % 2 ? IND : RED); }); knot(fx, y, lw * 1.1, SAF); };
        if (al === "center") {
          const mx = x + w / 2;
          stitch(Pen().M(x, y).L(mx - 2.2 * u, y).M(mx + 2.2 * u, y).L(x + w, y).polys, op); flower(mx);
        } else if (al === "right") { stitch(Pen().M(x, y).L(x + w - 3.4 * u, y).polys, op); flower(x + w - 1.2 * u); }
        else { stitch(Pen().M(x + 3.4 * u, y).L(x + w, y).polys, op); flower(x + 1.2 * u); }
      };
      const chipFit = (s, maxW, maxN, rows) => {
        g.save(); g.font = d.font("body", s, 700);
        const padX = s * 0.75, ic = s * 1.05, ch = s * 2.1, gap = s * 0.5;
        let list = t.badges.map((b) => ({ b, w: g.measureText(b).width + padX * 2 + ic })).filter((x) => x.w <= maxW).slice(0, maxN);
        g.restore();
        const lay = (L) => { const rs = [[]]; let rw = 0; L.forEach((it) => { if (rs[rs.length - 1].length && rw + gap + it.w > maxW) { rs.push([]); rw = 0; } rs[rs.length - 1].push(it); rw += (rw ? gap : 0) + it.w; }); return rs; };
        let R = lay(list);
        while (list.length > 1 && R.length > rows) { list = list.slice(0, -1); R = lay(list); }
        if (!list.length) return null;
        return { s, padX, ic, ch, gap, rows: R, h: R.length * ch + (R.length - 1) * gap };
      };
      const chipDraw = (L, x, y, al, maxW) => {
        let idx = 0;
        L.rows.forEach((row, ri) => {
          const tw = row.reduce((a, it) => a + it.w, 0) + L.gap * (row.length - 1);
          let cx = al === "center" ? x + (maxW - tw) / 2 : al === "right" ? x + maxW - tw : x;
          const cy = y + ri * (L.ch + L.gap);
          row.forEach((it) => {
            const col = THREADS[idx % 4], e = Math.max(0.4 * u, L.s * 0.2);
            g.save(); g.fillStyle = "rgba(72,42,16,.12)"; d.rr(cx + 0.12 * u, cy + 0.22 * u, it.w, L.ch, 0.7 * u); g.fill();
            g.fillStyle = CHIP; d.rr(cx, cy, it.w, L.ch, 0.7 * u); g.fill(); g.restore();
            stitch(rrPoly(cx + e, cy + e, it.w - 2 * e, L.ch - 2 * e, 0.4 * u), { color: col, lw: Math.max(1.4, 0.19 * u), len: 0.55 * u, gap: 0.36 * u, seed: 140 + idx, sheen: false });
            crossAt(cx + L.padX + L.s * 0.3, cy + L.ch / 2, L.s * 0.24, col, Math.max(1.4, 0.2 * u));
            d.tag("chips");
            g.save(); g.font = d.font("body", L.s, 700); g.fillStyle = INK; g.textBaseline = "middle"; g.textAlign = "left";
            g.fillText(it.b, cx + L.padX + L.ic, cy + L.ch / 2 + L.s * 0.06); g.restore();
            d.mark(cx, cy, it.w, L.ch); d.tag("");
            cx += it.w + L.gap; idx++;
          });
        });
      };

      /* the button: a brand-coloured cloth strip with a stitched edge and a drawn arrow; a long label wraps to two lines before it shrinks */
      const ctaFit = (s0, maxW, sq) => {
        const label = t.cta, minS = Math.min(s0, sq ? 1.7 * u : 2.2 * u);
        const geo = (s, lines) => {
          g.save(); g.font = d.font("body", s, 700); const ws = lines.map((l) => g.measureText(l).width); g.restore();
          const padX = s * 0.95, aw = s * 1.16, lh = s * 1.24;
          return { s, lines, ws, padX, aw, lh, w: Math.max(...ws) + aw + padX * 2, h: lines.length === 1 ? s * 2.2 : lh * lines.length + s * 1.05 };
        };
        const sizes = []; for (let s = s0; s > minS + 0.01; s *= 0.95) sizes.push(s); sizes.push(minS);
        for (const s of sizes) { if (s < s0 * 0.82 - 0.01) break; const G1 = geo(s, [label]); if (G1.w <= maxW) return G1; }
        for (const s of sizes) {
          g.save(); g.font = d.font("body", s, 700); const lines = d.wrap(label, maxW - s * (1.16 + 1.9)); g.restore();
          if (lines.length === 2) { const G2 = geo(s, lines); if (G2.w <= maxW) return G2; }
        }
        for (const s of sizes) { const G1 = geo(s, [label]); if (G1.w <= maxW) return G1; }
        return null;
      };
      const arrow = (x, y, L, col) => {
        const p = new Path2D(); p.moveTo(x, y); p.lineTo(x + L, y); p.moveTo(x + L * 0.6, y - L * 0.38); p.lineTo(x + L, y); p.lineTo(x + L * 0.6, y + L * 0.38);
        g.save(); g.strokeStyle = col; g.lineWidth = Math.max(2, L * 0.17); g.lineCap = "round"; g.lineJoin = "round"; g.stroke(p); g.restore();
      };
      const ctaDraw = (C, bx, y) => {
        const { s, w, h } = C, r = Math.min(s * 0.34, h / 2);
        g.save(); g.fillStyle = "rgba(72,42,16,.24)"; d.rr(bx + 0.2 * u, y + 0.45 * u, w, h, r); g.fill();
        g.fillStyle = TAG; d.rr(bx, y, w, h, r); g.fill();
        if (PALE) { g.strokeStyle = d.rgba(TP, 0.9); g.lineWidth = Math.max(1.5, 0.2 * u); g.stroke(); }
        g.restore();
        const e = Math.max(0.42 * u, s * 0.2);
        stitch(rrPoly(bx + e, y + e, w - 2 * e, h - 2 * e, Math.max(1, r - e * 0.6)), { color: d.rgba(TFG, 0.62), lw: Math.max(1.4, 0.2 * u), len: 0.62 * u, gap: 0.4 * u, seed: 151, shadow: false, sheen: false });
        const tw = Math.max(...C.ws), x0 = bx + C.padX, ty0 = y + h / 2 - ((C.lines.length - 1) * C.lh) / 2;
        d.tag("cta");
        g.save(); g.font = d.font("body", s, 700); g.fillStyle = TFG; g.textBaseline = "middle"; g.textAlign = "left";
        C.lines.forEach((l, i) => g.fillText(l, x0 + (tw - C.ws[i]) / 2, ty0 + i * C.lh + s * 0.06));
        g.restore();
        arrow(x0 + tw + s * 0.4, y + h / 2, s * 0.76, TFG);
        d.mark(bx, y, w, h); d.tag("");
      };

      /* ---------- the text stack: measures, shrinks a little, drops optional parts, then shrinks to a floor ---------- */
      const FAIL = { ok: false, h: Infinity };
      /* o.squeeze (last resort only): a word too long for the column shrinks the headline, a long button label shrinks the button */
      const build = (o, F) => {
        const al = o.align, maxW = o.maxW, items = [], sq = !!o.squeeze;
        const ax = (x, w) => (al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x);
        const G = 2.3 * u * F, key = `${F.toFixed(2)}|${Math.round(maxW)}|${al}`;
        for (const p of o.parts) {
          if (p === "flex") items.push({ flex: true, h: 0, gap: 0 });
          else if (p === "brand") {
            if (d.hasLogo) { const lh = o.logoH * F; items.push({ h: lh, gap: 0, draw: (x, y) => d.logo(x, y, maxW, lh, { align: al, color: INK }) }); }
            else if (t.brand) { const B = mm(`brand|${key}|${o.brand}`, () => brandFit(Math.max(o.brand * F, 2.1 * u), maxW, al)); items.push({ h: B.h, gap: 0, draw: (x, y) => brandDraw(B, x, y, al, maxW) }); }
          } else if (p === "tagline" && tagline) {
            const s = o.tagline * F;
            const T2 = mm(`tl|${key}|${o.tagline}`, () => { g.save(); g.font = d.font("hand", s, bn ? 400 : 700); const tw = g.measureText(tagline).width; g.restore(); return { tw, w: tw + s * 1.05 }; });
            if (T2.w <= maxW) items.push({ h: s * (bn ? 1.45 : 1.15), gap: G * 0.45, draw: (x, y) => {
              const xx = ax(x, T2.w);
              d.text(tagline, xx, y + (bn ? s * 0.04 : 0), { size: s, min: s * 0.9, kind: "hand", weight: bn ? 400 : 700, color: RED, lines: 1, maxW: T2.tw + 6 });
              heart(xx + T2.tw + s * 0.62, y + s * (bn ? 0.68 : 0.6), s * 0.28, RED);
            } });
          } else if (p === "head" && t.headline) {
            let hs = o.head * F;
            if (sq) {
              const wmax = mm(`hw|${hs.toFixed(1)}`, () => { g.save(); g.font = d.font(HK, hs, HW); const w = Math.max(...GRS.tokens(t.headline).map((tk) => g.measureText(tk.w).width)); g.restore(); return w; });
              if (wmax > maxW) hs = Math.max(8, (hs * maxW) / wmax - 1);
            }
            const ho = { size: hs, min: Math.round(hs) - 1, lines: o.headLines || 3, maxW, kind: HK, weight: HW, lh: LH };
            const m = mm(`head|${key}|${hs.toFixed(1)}|${ho.lines}`, () => d.headline(0, 0, { ...ho, measure: true }));
            if ((!o.trunc && m.lines.reduce((a, l) => a + l.length, 0) < headN) || m.w > maxW + 1) return FAIL;
            items.push({ h: m.h, gap: G * 0.5, draw: (x, y) => d.headline(x, y, { ...ho, align: al, color: INK, hi: HI }) });
          } else if (p === "sub" && t.sub) {
            const s = o.sub * F, so = { size: s, min: Math.round(s) - 1, kind: "body", weight: 500, lines: 2, lh: 1.3, maxW };
            const m = mm(`sub|${key}|${o.sub}`, () => d.text(t.sub, 0, 0, { ...so, measure: true }));
            if (m.lines.join(" ").length < t.sub.replace(/\s+/g, " ").length) return FAIL;
            items.push({ h: m.h, gap: G * 0.6, draw: (x, y) => d.text(t.sub, x, y, { ...so, align: al, color: SUB }) });
          } else if (p === "rule") {
            const w = Math.min(maxW, 20 * u * F);
            items.push({ h: 1.6 * u, gap: G * 0.85, draw: (x, y) => rule(ax(x, w), y + 0.8 * u, w, al) });
          } else if (p === "chips" && t.badges.length && o.maxChips > 0) {
            const cs = Math.max(o.chip * F, 2.2 * u);
            const L = mm(`chips|${key}|${o.chip}|${o.maxChips}|${o.chipRows || 2}`, () => chipFit(cs, maxW, o.maxChips, o.chipRows || 2));
            if (L) items.push({ h: L.h, gap: G, draw: (x, y) => chipDraw(L, x, y, al, maxW) });
          } else if (p === "proof" && (t.proof || t.rating)) {
            const s = o.proof * F, label = t.proof ? (t.ratingText ? `${t.ratingText} · ${t.proof}` : t.proof) : t.ratingText;
            const ss = s * 1.05, sw = t.rating ? 5 * ss + 4 * ss * 0.18 : 0, sg = sw ? s * 0.55 : 0;
            const tm = mm(`proof|${key}|${o.proof}`, () => d.text(label, 0, 0, { measure: true, size: s, min: Math.round(s) - 1, kind: "body", weight: 600, lines: 1, maxW: Math.max(10, maxW - sw - sg) }));
            if (tm.lines.join(" ").length < label.length) return FAIL;
            const w = sw + sg + tm.w;
            items.push({ h: s * 1.35, gap: G * 0.75, draw: (x, y) => {
              let xx = ax(x, w);
              if (sw) { d.stars(xx, y + s * 0.12, ss, { color: SAF, empty: d.rgba(SAF, 0.25) }); xx += sw + sg; }
              d.text(label, xx, y + s * 0.1, { size: tm.size, min: tm.size, kind: "body", weight: 600, lines: 1, maxW: tm.w + 4, color: SOFT });
            } });
          } else if (p === "ends" && t.endsText) {
            const s = o.ends * F, ir = s * 0.44, ig = s * 0.5;
            const tm = mm(`ends|${key}|${o.ends}`, () => d.text(t.endsText, 0, 0, { measure: true, size: s, min: Math.round(s) - 1, kind: "body", weight: 700, lines: 1, maxW: maxW - ir * 2 - ig }));
            if (tm.lines.join(" ").length < t.endsText.length) return FAIL;
            const w = ir * 2 + ig + tm.w;
            items.push({ h: s * 1.3, gap: G * 0.7, draw: (x, y) => {
              const xx = ax(x, w); clock(xx + ir, y + s * 0.66, ir, RED);
              d.text(t.endsText, xx + ir * 2 + ig, y + s * 0.1, { size: tm.size, min: tm.size, kind: "body", weight: 700, lines: 1, maxW: tm.w + 4, color: RED });
            } });
          } else if (p === "cta" && t.cta) {
            const C = mm(`cta|${key}|${o.cta}|${sq}`, () => ctaFit(o.cta * F, maxW, sq));
            if (!C) return FAIL;
            items.push({ h: C.h, gap: G * 1.2, draw: (x, y) => ctaDraw(C, ax(x, C.w), y) });
          }
        }
        const h = items.reduce((a, it, i) => a + it.h + (i ? it.gap : 0), 0);
        return {
          ok: true, h, F,
          draw: (x, y, availH) => {
            const nf = items.filter((it) => it.flex).length, extra = nf && availH ? Math.max(0, availH - h) / nf : 0, flex = [];
            let yy = y;
            items.forEach((it, i) => {
              if (i) yy += it.gap;
              if (it.flex) { flex.push({ y: yy, h: extra }); yy += extra; return; }
              it.draw(x, yy); yy += it.h;
            });
            return flex;
          },
        };
      };
      const START = k.boost * (d.st.textScale || 1), FLOOR = Math.max(0.74, START * 0.7), FS = [];
      for (let F = START; F > FLOOR + 0.01; F *= 0.95) FS.push(F);
      FS.push(FLOOR);
      const COST = { tagline: 0.6, rule: 0.4, c3: 0.8, ends: 1.6, proof: 1.6, c2: 1.4, sub: 2.2, c1: 2.2, c0: 3 };
      const variants = (parts) => {
        const out = []; let cur = parts.slice(), cost = 0, mc = Math.min(4, t.badges.length);
        const push = () => out.push({ parts: cur, maxChips: mc, cost });
        const drop = (p, present) => { if (present && cur.includes(p)) { cur = cur.filter((x) => x !== p); cost += COST[p]; push(); } };
        const chips = (n, key) => { if (cur.includes("chips") && mc > n) { mc = n; cost += COST[key]; push(); } };
        push();
        drop("tagline", !!tagline); drop("rule", true); chips(3, "c3"); drop("ends", !!t.endsText); drop("proof", !!(t.proof || t.rating));
        chips(2, "c2"); drop("sub", !!t.sub); chips(1, "c1");
        if (cur.includes("chips") && t.badges.length) { cur = cur.filter((x) => x !== "chips"); cost += COST.c0; push(); }
        return out;
      };
      // cheapest (fewest dropped parts, least shrinking) stack that fits; { b, cost } or null
      const search = (avail, o, maxCost = Infinity) => {
        // quick exit: a headline that cannot fit its lines even at the floor size rules out every candidate
        if (o.parts.includes("head") && t.headline && !build({ ...o, parts: ["head"] }, FLOOR).ok) return null;
        const vs = variants(o.parts), cand = [];
        // sizes step down ~5% at a time; each step costs about as much as dropping a minor part, and more below 86%
        vs.forEach((v) => FS.forEach((F, i) => cand.push({ v, F, cost: v.cost + i * 1.1 + Math.max(0, (START * 0.86 - F) / (START * 0.05)) * 1.3 })));
        cand.sort((a, b) => a.cost - b.cost || b.F - a.F);
        for (const cd of cand) { if (cd.cost > maxCost) break; const b = build({ ...o, ...cd.v }, cd.F); if (b.ok && b.h <= avail) return { b, cost: cd.cost }; }
        return null;
      };
      // with room to spare (nothing dropped, nothing shrunk) the headline grows, still leaving `keep` for a motif
      const grow = (avail, o, keep, steps = [1.34, 1.22, 1.1]) => {
        for (const hm of steps) { const r = search(avail - keep, { ...o, head: o.head * hm }, 0); if (r) return r.b; }
        return null;
      };
      const fitStack = (avail, o) => {
        const hl = o.headLines || 3;
        const r = search(avail, o) || (o.parts.includes("head") ? search(avail, { ...o, headLines: hl + 1 }) : null);
        if (r) return r.b;
        const vs = variants(o.parts), v = vs[vs.length - 1];
        for (let F = FLOOR; F >= 0.5; F *= 0.93) { const b = build({ ...o, ...v, headLines: hl + 1, squeeze: true }, F); if (b.ok && b.h <= avail) return b; }
        // absurdly long copy: keep what fits (the headline loses its last words, an endless button label goes)
        const last = build({ ...o, ...v, headLines: hl + 1, squeeze: true, trunc: true }, 0.5);
        return last.ok ? last : build({ ...o, ...v, parts: v.parts.filter((p) => p !== "cta"), headLines: hl + 1, squeeze: true, trunc: true }, 0.5);
      };
      const flexDeco = (fl, x, w, al) => {
        fl.forEach(({ y, h }) => {
          if (h >= 12 * u && w >= 16 * u) {
            const s = Math.min((h - 2.4 * u) / 1.8, w * 0.27, 10.5 * u);
            const cx = al === "center" ? x + w / 2 : al === "right" ? x + w - s * 1.05 : x + s * 1.0;
            lotus(cx, y + (h - 1.75 * s) / 2 + 1.33 * s, s);
          } else if (h >= 6 * u && w >= 16 * u) {
            const L = Math.min(w, 30 * u), lx = al === "center" ? x + (w - L) / 2 : al === "right" ? x + w - L : x;
            vine(lx, y + h / 2, lx + L, y + h / 2, { amp: 0.8 * u, leaf: 2.3 * u, wl: 9 * u, lw: 0.22 * u, len: 0.6 * u });
          }
        });
      };

      /* ---------- the price tag, the patch, the sticker ---------- */
      const tagFit = (ps0, maxW) => {
        if (!t.price) return null;
        let L = null;
        for (let s = ps0; s >= ps0 * 0.45; s *= 0.95) {
          const os = s * 0.46, prs = s * 0.36;
          g.save();
          g.font = d.font(HK, s, HW); const pw = g.measureText(t.price).width;
          g.font = d.font(HK, os, 700); const ow = t.old ? g.measureText(t.old).width : 0;
          g.font = d.font("body", prs, 700); const prw = t.prefix ? g.measureText(t.prefix).width : 0;
          g.restore();
          const two = !!(ow || prw), l1 = prw + (prw && ow ? s * 0.24 : 0) + ow, padY = s * 0.4;
          const h = padY * 2 + (two ? os * 1.25 : 0) + s * 0.92;
          const n = h * 0.3, hr = Math.max(0.55 * u, s * 0.1), hx = n * 0.62 + hr, padL = hx + hr + s * 0.42, padR = s * 0.5;
          L = { s, os, prs, pw, ow, prw, two, l1, h, n, hr, hx, padL, padR, padY, w: padL + Math.max(pw, l1) + padR };
          if (L.w <= maxW) break;
        }
        return L;
      };
      const tagDraw = (L, x, y, ang) => {
        const { w, h, s } = L, cx = x + w / 2, cy = y + h / 2, r = Math.min(1.2 * u, h * 0.12);
        g.save(); g.translate(cx, cy); g.rotate(ang); g.translate(-w / 2, -h / 2);
        const shape = pathOf(tagPoly(0, 0, w, h, L.n, r));
        g.save(); g.shadowColor = "rgba(60,34,12,.34)"; g.shadowBlur = 1.8 * u; g.shadowOffsetY = 0.7 * u; g.fillStyle = TAG; g.fill(shape); g.restore();
        if (PALE) { g.save(); g.strokeStyle = d.rgba(TP, 0.9); g.lineWidth = Math.max(1.5, 0.2 * u); g.stroke(shape); g.restore(); }
        g.save(); g.clip(shape);
        d.pattern("diagonal", 0, 0, w, h, d.rgba(TFG, 0.07), { size: 0.6 * u, line: Math.max(1, 0.08 * u) });
        const gl = g.createLinearGradient(0, 0, 0, h); gl.addColorStop(0, "rgba(255,255,255,.14)"); gl.addColorStop(1, "rgba(0,0,0,.08)");
        g.fillStyle = gl; g.fillRect(0, 0, w, h); g.restore();
        const e = Math.max(0.7 * u, h * 0.07);
        stitch(tagPoly(e, e, w - 2 * e, h - 2 * e, Math.max(0.5 * u, L.n - e * 0.45), Math.max(0.3 * u, r - e * 0.5)), { color: d.rgba(TFG, 0.72), lw: Math.max(1.4, 0.24 * u), len: 0.72 * u, gap: 0.46 * u, seed: 161, shadow: false });
        // eyelet + a thread loop
        g.save();
        g.fillStyle = d.mix(TAG, "#FFFFFF", 0.55); g.beginPath(); g.arc(L.hx, h / 2, L.hr * 1.45, 0, Math.PI * 2); g.fill();
        g.fillStyle = d.mix(TAG, "#000000", 0.55); g.beginPath(); g.arc(L.hx, h / 2, L.hr * 0.85, 0, Math.PI * 2); g.fill();
        g.restore();
        thread(Pen(L.hx, h / 2, 1).M(0, 0).C(-1.4 * u, -2.6 * u, -4.6 * u, -3.4 * u, -6.2 * u, -1.8 * u).M(0, 0).C(-1.8 * u, -0.8 * u, -3.8 * u, 0.6 * u, -5.6 * u, -0.6 * u).polys, { color: RED, lw: 0.3 * u });
        knot(L.hx - 6.2 * u, h / 2 - 1.8 * u, 0.42 * u, RED); knot(L.hx - 5.6 * u, h / 2 - 0.6 * u, 0.42 * u, RED);
        // the price
        g.save(); g.textBaseline = "alphabetic"; g.textAlign = "left";
        let tx = L.padL;
        if (L.two) {
          const b1 = L.padY + L.os * 0.9;
          if (L.prw) { g.font = d.font("body", L.prs, 700); g.fillStyle = d.rgba(TFG, 0.88); g.fillText(t.prefix, tx, b1); tx += L.prw + s * 0.24; }
          if (L.ow) {
            g.font = d.font(HK, L.os, 700); g.fillStyle = d.rgba(TFG, 0.66); g.fillText(t.old, tx, b1);
            g.strokeStyle = d.rgba(TFG, 0.8); g.lineWidth = Math.max(2, L.os * 0.08); g.beginPath(); g.moveTo(tx - 2, b1 - L.os * 0.32); g.lineTo(tx + L.ow + 2, b1 - L.os * 0.32); g.stroke();
          }
        }
        const b2 = L.padY + (L.two ? L.os * 1.25 : 0) + s * 0.8;
        g.font = d.font(HK, s, HW); g.fillStyle = TFG; g.fillText(t.price, L.padL, b2);
        g.restore();
        g.restore();
        // mark the text area (rotated → its bounding box)
        const pts = [[L.padL, L.padY * 0.6], [w - L.padR * 0.6, L.padY * 0.6], [L.padL, h - L.padY * 0.6], [w - L.padR * 0.6, h - L.padY * 0.6]].map(([px, py]) => {
          const qx = px - w / 2, qy = py - h / 2; return [cx + qx * Math.cos(ang) - qy * Math.sin(ang), cy + qx * Math.sin(ang) + qy * Math.cos(ang)];
        });
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        d.tag("pricetag"); d.mark(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)); d.tag("");
      };
      /* patch-local (from centre, rotated by ang) → canvas */
      const mapper = (cx, cy, ang) => { const ca = Math.cos(ang), sa = Math.sin(ang); return (lx, ly) => [cx + lx * ca - ly * sa, cy + lx * sa + ly * ca]; };
      /* the product sewn onto the quilt as a tilted patch. (cx, cy) centre, w × h outer size.
         avoid: the price tag's canvas rect; a cut-out product is fitted beside or above it so the tag never hides the product. */
      const patch = (cx, cy, w, h, ang, avoid) => {
        const b = clamp(Math.min(w, h) * 0.05, 1.3 * u, 2.3 * u), x = -w / 2, y = -h / 2, ix = x + b, iy = y + b, iw = w - 2 * b, ih = h - 2 * b;
        g.save(); g.translate(cx, cy); g.rotate(ang);
        stitch(rrPoly(x - 1.5 * u, y - 1.5 * u, w + 3 * u, h + 3 * u, 1.4 * u), { color: IND, lw: 0.26 * u, len: 0.85 * u, gap: 0.62 * u, seed: 51 });
        g.save(); g.shadowColor = "rgba(66,38,14,.32)"; g.shadowBlur = 2.4 * u; g.shadowOffsetY = 0.9 * u; g.fillStyle = PATCH; g.fillRect(x, y, w, h); g.restore();
        d.pattern("diagonal", x, y, w, h, d.lum(PATCH) < 0.2 ? "rgba(255,255,255,.08)" : d.rgba(INK, 0.07), { size: 0.7 * u, line: Math.max(1, 0.09 * u) });
        if (d.hasCutout()) {
          // a pale cotton window quilted in rings around the product, the way kantha fills a medallion
          const gr = g.createRadialGradient(0, ih * 0.08, 0, 0, 0, Math.max(iw, ih) * 0.7);
          gr.addColorStop(0, d.mix(WIN, "#FFFFFF", 0.5)); gr.addColorStop(1, d.mix(WIN, CLOTH, 0.45));
          g.fillStyle = gr; g.fillRect(ix, iy, iw, ih);
          g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
          const rc = new Path2D(), ccy = ih * 0.08;
          for (let r = 4 * u; r < Math.hypot(iw, ih) * 0.62; r += 2.2 * u) { rc.moveTo(r, ccy); rc.arc(0, ccy, r, 0, Math.PI * 2); }
          g.setLineDash([0.9 * u, 0.72 * u]); g.lineCap = "round"; g.lineWidth = Math.max(1, 0.17 * u); g.strokeStyle = d.rgba(darken(c.primary, WIN, 3), 0.17); g.stroke(rc);
          g.restore();
          let px = ix + iw * 0.07, py = iy + ih * 0.06, pW = iw * 0.86, pH = ih * 0.88;
          if (avoid) {
            // the tag's top-left corner in patch-local space (the thread loop reaches ~3u left of the tag)
            const ca = Math.cos(ang), sa = Math.sin(ang);
            const loc = [[avoid.x, avoid.y], [avoid.x + avoid.w, avoid.y], [avoid.x, avoid.y + avoid.h]].map(([X, Y]) => { const dx = X - cx, dy = Y - cy; return [dx * ca + dy * sa, -dx * sa + dy * ca]; });
            const tx = Math.min(...loc.map((p) => p[0])) - 3.2 * u, ty = Math.min(...loc.map((p) => p[1]));
            if (tx < px + pW && ty < py + pH) {
              const img = d.source(0, true), fit = (a, b) => (a > 0 && b > 0 ? Math.min(a / img.width, b / img.height) : 0);
              const hA = ty + 2.4 * u - py, wB = tx - px;   // above the tag (its notched top-left corner is empty) | beside it
              const sA = fit(pW, hA), sB = fit(wB, pH);
              if (sA >= sB && sA > 0) pH = hA; else if (sB > 0) pW = wB;
            }
          }
          d.product(px, py, pW, pH, { shadowColor: "rgba(66,38,14,.3)" });
        } else {
          d.photo(ix, iy, iw, ih);
        }
        g.strokeStyle = "rgba(40,24,10,.25)"; g.lineWidth = Math.max(1, 0.12 * u); g.strokeRect(ix, iy, iw, ih);
        stitch(rrPoly(x + b * 0.5, y + b * 0.5, w - b, h - b, 0.4 * u), { color: TPP, lw: 0.28 * u, len: 0.85 * u, gap: 0.55 * u, seed: 52 });
        [[x + b * 0.5, y + b * 0.5], [-x - b * 0.5, y + b * 0.5], [x + b * 0.5, -y - b * 0.5], [-x - b * 0.5, -y - b * 0.5]].forEach(([px, py]) => crossAt(px, py, 0.85 * u, RED, 0.32 * u));
        g.restore();
        return mapper(cx, cy, ang);
      };
      const sticker = (cx, cy, R) => {
        if (!t.stickerText) return false;
        g.save(); g.shadowColor = "rgba(60,34,12,.3)"; g.shadowBlur = 1.6 * u; g.shadowOffsetY = 0.6 * u; g.fillStyle = STK; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill(); g.restore();
        fillRows(Pen(cx, cy, R).O(0, 0, 1).polys, "rgba(255,255,255,.07)", 0.9 * u, 0.6, 0.2 * u);
        stitch(Pen(cx, cy, R).O(0, 0, 0.87).polys, { color: "#F6E7CC", lw: 0.24 * u, len: 0.66 * u, gap: 0.42 * u, seed: 171, alpha: 0.9 });
        d.sticker(cx, cy, R * 0.97, { shape: "circle", fill: "rgba(0,0,0,0)", fg: "#FBF2E2", rot: -0.12, kind: HK, shadow: false });
        return true;
      };

      /* ================================ compose ================================ */
      cloth();
      frame();
      const M = 9 * u;

      if (k.square) {
        const x0 = M, x1 = W - M, y0 = M, y1 = H - M, al = d.align("left"), GUT = 5.5 * u;
        const so = { parts: ["brand", "tagline", "head", "sub", "rule", "flex", "chips", "proof", "ends", "cta"], align: al, brand: 2.3 * u, logoH: 5.6 * u, tagline: 3.9 * u, head: 7.4 * u, sub: 2.8 * u, chip: 2.4 * u, chipRows: 2, proof: 2.4 * u, ends: 2.4 * u, cta: 3 * u, headLines: 3 };
        let best = null;
        for (const [a, hl, pen] of [[44, 3, 0], [40, 3, 0.8], [36, 3, 1.6], [40, 4, 1.4], [34, 4, 2.6]].sort((p, q) => p[2] - q[2])) {
          if (best && best.cost <= pen) break;
          const r = search(y1 - y0, { ...so, maxW: x1 - a * u - GUT - x0, headLines: hl });
          if (r && (!best || r.cost + pen < best.cost)) best = { b: r.b, cost: r.cost + pen, pw: a * u };
        }
        if (!best) best = { pw: 34 * u, b: fitStack(y1 - y0, { ...so, maxW: x1 - 34 * u - GUT - x0, headLines: 4 }) };
        if (best.cost === 0) { const gb = grow(y1 - y0, { ...so, maxW: x1 - best.pw - GUT - x0 }, 15 * u); if (gb) best.b = gb; }
        const pw = best.pw, colW = x1 - pw - GUT - x0, colR = x0 + colW;
        const TL = tagFit(6.6 * u * START, pw + 1.5 * u), hang = TL ? TL.h * 0.45 : 0;
        const ph = Math.min(pw * 1.42, y1 - y0 - 1.5 * u - hang), ang = -0.04;
        const pcx = x1 - pw / 2 - 0.6 * u, pcy = y0 + 1.5 * u + ph / 2;
        const at0 = mapper(pcx, pcy, ang);
        let tb = null;
        if (TL) { const [bx, by] = at0(pw / 2, ph / 2); tb = { x: Math.max(colR + 1.5 * u, bx + 1.6 * u - TL.w), y: by - TL.h * 0.55, w: TL.w, h: TL.h }; }
        const at = patch(pcx, pcy, pw, ph, ang, tb);
        const below = y1 - (pcy + ph / 2 + hang);
        if (below >= 9 * u) { const s = Math.min(below * 0.55, pw * 0.26, 7 * u); fish(pcx - pw * 0.08, pcy + ph / 2 + hang + below / 2 + 0.3 * u, s, -1, 0.06); }
        if (tb) tagDraw(TL, tb.x, tb.y, 0.05);
        const R = 7.2 * u, [sx, sy] = at(-pw / 2 + R * 0.42, -ph / 2 + R * 0.42);
        sticker(Math.max(sx, colR + 1.2 * u + R), Math.max(sy, FI[3] + 1.8 * u + R), R);
        const fl = best.b.draw(x0, y0, y1 - y0);
        flexDeco(fl, x0, colW, al);
        return;
      }

      if (k.portrait || k.story) {
        const story = k.story, al = d.align("center");
        const x0 = story ? 12 * u : M, x1 = story ? 88 * u : W - M, maxW = x1 - x0;
        const y0 = story ? H * 0.14 + 1 * u : M, y1 = story ? H * 0.8 - 1 * u : H - M;
        // the top stack sits above the Reels button band (45–80%), so in story it may use the full width between the borders
        const tx0 = story ? 9 * u : x0, tW = story ? W - 18 * u : maxW;
        const TO = { parts: ["brand", "tagline", "head", "sub"], maxW: tW, align: al, brand: 2.4 * u, logoH: 5.6 * u, tagline: 4 * u, head: 7.6 * u, sub: 2.9 * u, headLines: story ? 3 : 2 };
        const BO = { parts: ["chips", "proof", "ends", "cta"], maxW, align: al, chip: 2.5 * u, chipRows: 2, proof: 2.5 * u, ends: 2.5 * u, cta: 3.1 * u };
        // the patch is the hero: the text gets what is left after a minimum patch height
        const TL = tagFit(6.8 * u * START * (story ? 0.88 : 1), 40 * u), hang = TL ? TL.h * 0.45 : 0;
        // a long headline may take a few u from the story patch rather than shrink to one tiny line
        const GT = 5 * u, GB = 4.5 * u, minPH = 50 * u, room = y1 - y0 - GT - GB - hang - minPH;
        let bot = fitStack(story ? 28 * u : 21 * u, BO);
        let top = fitStack(Math.max(story ? 21 * u : 16 * u, Math.min(story ? 40 * u : 31 * u, room - bot.h)), TO);
        if (top.h + bot.h > room) bot = fitStack(Math.max(11 * u, room - top.h), BO);
        // a short headline with everything intact grows a little, giving up at most ~5u of patch
        else if (search(top.h + 0.5, TO, 0)) {
          const cap = Math.min(top.h + 5.5 * u, room - bot.h);
          for (const hm of [1.24, 1.12]) { const r = search(cap, { ...TO, head: TO.head * hm }, 0); if (r) { top = r.b; break; } }
        }
        const pTop = y0 + top.h + GT, pBot = y1 - bot.h - GB - hang;
        const ph = pBot - pTop, pw = Math.min(story ? 64 * u : 62 * u, Math.max(ph * (story ? 1 : 0.92), 44 * u)), pcx = (x0 + x1) / 2, pcy = (pTop + pBot) / 2, ang = -0.03;
        // the tag hangs off the bottom-right corner, pushed out to the column edge so it leaves the product clear
        let tb = null;
        if (TL) { const [bx, by] = mapper(pcx, pcy, ang)(pw / 2, ph / 2); tb = { x: Math.max(bx + 3 * u, x1 + (story ? -0.8 * u : 1.4 * u)) - TL.w, y: by - TL.h * 0.55, w: TL.w, h: TL.h }; }
        // vines climbing either side of the patch when there is room (the right one stops above the tag)
        const side = (pcx - pw / 2) - (story ? 3 * u : FI[3] + 1.5 * u);
        if (side >= 7 * u) {
          const vx = (story ? 3 * u : FI[3] + 1.5 * u) + side / 2 - 0.5 * u, vo = { amp: 0.9 * u, leaf: 2.6 * u, wl: 10 * u };
          vine(vx, pBot - 2 * u, vx, pTop + 4 * u, vo);
          const rb = tb && tb.x + tb.w > W - vx - 3.5 * u ? Math.min(pBot - 2 * u, tb.y - 2 * u) : pBot - 2 * u;
          if (rb - (pTop + 4 * u) >= 12 * u) vine(W - vx, rb, W - vx, pTop + 4 * u, vo);
        }
        const at = patch(pcx, pcy, pw, ph, ang, tb);
        if (tb) tagDraw(TL, tb.x, tb.y, 0.045);
        const R = 7.6 * u, [sx, sy] = at(-pw / 2 + R * 0.25, -ph / 2 + ph * 0.3);
        sticker(Math.max(sx, x0 + R - 1 * u), sy, R);
        top.draw(tx0, y0); bot.draw(x0, y1 - bot.h);
        if (story) {
          // the top band (profile zone): a stitched sun with vines; the bottom (caption zone): a river, a boat and a fish
          const sy2 = H * 0.07;
          sun(W / 2, sy2, 4.6 * u);
          vine(W / 2 - 11 * u, sy2, 13 * u, sy2, { amp: 0.8 * u, leaf: 2.4 * u, wl: 9 * u });
          vine(W / 2 + 11 * u, sy2, W - 13 * u, sy2, { amp: 0.8 * u, leaf: 2.4 * u, wl: 9 * u });
          const ry = H * 0.88;
          waves(9 * u, W - 9 * u, ry + 0.6 * u, 0.55 * u, 9 * u, IND, 191);
          waves(13 * u, W - 13 * u, ry + 13.2 * u, 0.5 * u, 8 * u, d.mix(IND, CLOTH, 0.3), 192, 0.24 * u);
          boat(W * 0.23, ry - 0.2 * u, 9.5 * u, 1);
          fish(W * 0.62, ry + 6.8 * u, 4.4 * u, -1, 0.05);
          fish(W * 0.82, ry + 7.6 * u, 3.2 * u, -1, -0.08);
          lotus(W * 0.8, ry - 1.6 * u, 5 * u);
        }
        return;
      }

      // landscape: the patch on the left, the offer on the right
      {
        const y0 = 8.6 * u, y1 = H - 8.6 * u, al = d.align("left");
        const TL = tagFit(7.4 * u * START, 44 * u), hang = TL ? TL.h * 0.45 : 0;
        const ph = y1 - y0 - 1 * u - hang, pw = Math.min(ph * 0.84, 60 * u), pcx = M + 1 * u + pw / 2, pcy = y0 + 0.5 * u + ph / 2, ang = -0.035;
        const x0 = pcx + pw / 2 + 10 * u, x1 = W - M, maxW = x1 - x0;
        let tb = null;
        if (TL) { const [bx, by] = mapper(pcx, pcy, ang)(pw / 2, ph / 2); tb = { x: Math.max(bx + 3 * u, x0 - 4 * u) - TL.w, y: by - TL.h * 0.55, w: TL.w, h: TL.h }; }
        const at = patch(pcx, pcy, pw, ph, ang, tb);
        if (tb) tagDraw(TL, tb.x, tb.y, 0.05);
        // the sticker sits on the patch corner, kept clear of the stitched borders and corner rosettes
        const R = 8.5 * u, [sx, sy] = at(-pw / 2 + R * 0.4, -ph / 2 + R * 0.4), sm = FI[3] + 2 * u + R;
        sticker(Math.max(sx, sm), Math.max(sy, sm), R);
        const LO = { parts: ["brand", "tagline", "head", "sub", "rule", "flex", "chips", "proof", "ends", "cta"], maxW, align: al, brand: 2.7 * u, logoH: 6.8 * u, tagline: 4.6 * u, head: 9 * u, sub: 3.3 * u, chip: 2.9 * u, chipRows: 2, proof: 2.9 * u, ends: 2.9 * u, cta: 3.6 * u, headLines: 2 };
        // short copy: the headline takes the spare height of the wide text column (up to 2×) instead of leaving it empty
        const b = grow(y1 - y0, LO, 13 * u, [2, 1.8, 1.6, 1.47, 1.34, 1.22, 1.1]) || fitStack(y1 - y0, LO);
        const fl = b.draw(x0, y0, y1 - y0);
        flexDeco(fl, x0, maxW, al);
      }
    },
  });
})();
