/* Bold poster: a Swiss / brutalist drop poster for streetwear, sneakers, gadgets and new drops.
   - Two colours: the seller's brand colour as the field, ink or paper (whichever contrasts more) for
     everything printed on it. A pop colour is used only for the square stamp.
   - The headline is a justified stack: words are split into lines and each line is set so its ink
     fills the full content width (uppercase Latin; Bangla is fitted as-is). Lines that would get
     too big are capped and tracked out to the width instead. *Highlighted* words are hollow.
   - A cut-out product stands on the price band and rises into the lower lines of the headline; the
     letter outlines are drawn again on top of the product so the type still reads ("type behind").
     A seller photo without cut-out becomes a hard-edged block in the grid (offset shadow, FIG label).
   - Grid: thick top rule, a meta row (brand, NEW DROP, NO. 01, 2027), hairlines, a spec list
     column for the badges, crop marks. Sharp corners everywhere. All drawn: no images, no emoji. */
(() => {
  "use strict";
  const BN = /[ঀ-৿]/;
  // the built-in sample bottle's canvas has empty space below the product; its visible bottom sits at 770 / 860
  const SAMPLE_FOOT = 770 / 860;
  let OFF = null;                                            // reused offscreen canvas for the masked "type over product" strokes

  GRS.register({
    id: "poster", name: "Bold poster", group: "bold", photos: 1, cutout: "best",
    desc: "Swiss poster: giant type, grid, product on top",
    draw(d) {
      const { g, W, H, k, t, c, u } = d;
      const bn = t.lang === "bn";
      const cut = d.hasCutout(0);
      const hasLS = "letterSpacing" in g;
      const isLatin = (s) => !BN.test(String(s || ""));

      /* ---------- colour ---------- */
      const P = c.primary, bg = P;
      const fg = d.contrast(P, c.ink) >= d.contrast(P, c.paper) ? c.ink : c.paper;
      const ensure = (col, on, min) => {
        const to = d.lum(on) > 0.3 ? "#000000" : "#FFFFFF"; let x = col;
        for (let i = 1; i <= 10 && d.contrast(x, on) < min; i++) x = d.mix(col, to, i * 0.1);
        return x;
      };
      const onBand = ensure(P, fg, 3.2);                       // brand colour as type on the ink / paper band
      const auto = GRS.autoAccent ? GRS.autoAccent(P) : "";
      const ownAccent = !!auto && String(c.accent).toLowerCase() !== auto.toLowerCase();
      const pop = ownAccent && d.contrast(c.accent, bg) >= 1.7 ? c.accent : d.contrast(c.sale, bg) >= 1.7 ? c.sale : c.red;
      const popFg = d.onColor(pop);

      /* ---------- sizes / copy ---------- */
      const FX = Math.max(0.85, Math.min(1.2, d.scale || 1)) * (k.story ? 1.12 : 1);
      const small = (v) => Math.max(2.2 * u, v * FX);
      const al = d.align("left");
      const TX = bn ? { drop: "নতুন", no: "নং ০১", year: "২০২৭", fig: "চিত্র ০১" } : { drop: "NEW DROP", no: "NO. 01", year: "2027", fig: "FIG. 01" };

      /* ---------- one line of text: letter-spacing, shrink then ellipsis, marks its box ---------- */
      let tagN = 0;
      const line = (str, x, y, o) => {
        let s = String(str || ""); if (!s) return { w: 0, h: 0, size: 0 };
        const bnS = BN.test(s);
        if (o.upper && !bnS) s = s.toUpperCase();
        const ls = bnS ? 0 : o.letter || 0, kind = o.kind || "body", wt = o.weight || 700, maxW = o.maxW || W;
        let size = o.size; const min = Math.min(size, o.min || size * 0.8);
        g.save();
        const setF = (sz) => { g.font = d.font(kind, sz, wt); if (hasLS) g.letterSpacing = ls ? `${ls * sz}px` : "0px"; };
        const mw = (txt, sz) => g.measureText(txt).width - (hasLS ? ls * sz : 0);
        setF(size); let w = mw(s, size);
        while (w > maxW && size > min) { size = Math.max(min, size - 1); setF(size); w = mw(s, size); }
        if (w > maxW) { let cc = s; while (cc.length > 1 && w > maxW) { cc = cc.slice(0, -1).trimEnd(); w = mw(`${cc}…`, size); } s = `${cc}…`; }
        const h = size * (o.lh || 1.25);
        if (o.measure) { g.restore(); return { w, h, size }; }
        const lx = o.align === "center" ? x + (maxW - w) / 2 : o.align === "right" ? x + maxW - w : x;
        g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = o.color || fg;
        g.fillText(s, lx, y + h / 2 + size * 0.04);
        g.restore();
        if (!o.nomark) { d.tag(`po-line${++tagN}`); d.mark(lx, y, w, h); d.tag(""); }
        return { w, h, size, x: lx };
      };

      /* ---------- the justified headline stack ---------- */
      const TRACK = 0.09;                                      // max tracking (em) used to stretch a capped line to the width
      const planHead = (w, avail, o) => {
        const raw = t.headline; if (!raw || avail < 4 * u) return null;
        const latin = isLatin(raw);
        let toks = GRS.tokens(raw); if (!toks.length) return null;
        if (latin) toks = toks.map((tk) => ({ w: tk.w.toUpperCase(), hi: tk.hi }));
        const n = toks.length, lead = latin ? 0.1 : 0.16, maxCap = o.maxCap;
        g.save(); g.font = d.font("display", 100); if (hasLS) g.letterSpacing = "0px";
        const segs = {};
        const seg = (i, j) => {
          const key = i * 1000 + j; if (segs[key]) return segs[key];
          const str = toks.slice(i, j).map((x) => x.w).join(" "), m = g.measureText(str);
          const l = m.actualBoundingBoxLeft || 0, r = m.actualBoundingBoxRight || m.width;
          return (segs[key] = { i, j, str, inkW: Math.max(1, l + r), a: m.actualBoundingBoxAscent || 72, ds: Math.max(0, m.actualBoundingBoxDescent || 0), chars: [...str].length });
        };
        let best = null;
        const evalPlan = (lines) => {
          const s = lines.map((sg) => Math.min(maxCap, (100 * w) / sg.inkW)), hk = lines.map((sg) => (sg.a + sg.ds) / 100);
          const total = (cap) => { let tot = 0, prev = 0; s.forEach((v, i) => { const e = Math.min(v, cap); tot += hk[i] * e + (i ? lead * Math.min(e, prev) : 0); prev = e; }); return tot; };
          let cap = maxCap;
          if (total(cap) > avail) { let lo = 0, hi = maxCap; for (let it = 0; it < 22; it++) { const mid = (lo + hi) / 2; if (total(mid) <= avail) lo = mid; else hi = mid; } cap = lo; }
          const e = s.map((v) => Math.min(v, cap));
          const fill = lines.map((sg, i) => {
            if (e[i] >= s[i] - 0.5) return 1;
            const at = (sg.inkW * e[i]) / 100, track = latin && hasLS && sg.chars > 1 ? TRACK * e[i] * (sg.chars - 1) : 0;
            return Math.min(1, (at + track) / w);
          });
          const minE = Math.min(...e), avgE = e.reduce((a, v) => a + v, 0) / e.length, unf = fill.reduce((a, v) => a + (1 - v), 0) / e.length;
          let score = (minE + 0.3 * avgE) * (1 - 0.7 * unf) * (1 - 0.03 * (lines.length - 1));
          score *= 0.85 + 0.15 * Math.min(1, total(cap) / avail);   // a poster wants its type block to fill the space
          if (minE < 5 * u) score *= 0.6;
          if (!best || score > best.score) best = { score, lines, e };
        };
        const maxL = Math.min(o.maxLines, n);
        let combos = 0; for (let L = 1, cmb = 1; L <= maxL; L++) { combos += cmb; cmb = (cmb * (n - L)) / L; }
        if (combos <= 4000) {
          const go = (start, left, acc) => {
            if (left === 1) { evalPlan([...acc, seg(start, n)]); return; }
            for (let e = start + 1; e <= n - left + 1; e++) go(e, left - 1, [...acc, seg(start, e)]);
          };
          for (let L = 1; L <= maxL; L++) go(0, L, []);
        } else {
          // very long headline: balanced greedy splits only
          const lens = toks.map((tk) => [...tk.w].length + 1), totalC = lens.reduce((a, v) => a + v, 0);
          for (let L = 1; L <= maxL; L++) {
            const lines = []; let st = 0, acc = 0;
            for (let i = 0; i < n; i++) { acc += lens[i]; if (acc >= (totalC * (lines.length + 1)) / L && lines.length < L - 1 && i < n - 1) { lines.push(seg(st, i + 1)); st = i + 1; } }
            lines.push(seg(st, n)); evalPlan(lines);
          }
        }
        // final metrics at the real (integer) sizes
        const out = best.lines.map((sg, i) => {
          const e = Math.max(8, Math.floor(best.e[i]));
          g.font = d.font("display", e);
          const m = g.measureText(sg.str);
          const l = m.actualBoundingBoxLeft || 0, r = m.actualBoundingBoxRight || m.width, inkW = l + r;
          let ls = 0;
          if (latin && hasLS && sg.chars > 1 && inkW < w) ls = Math.min(TRACK * e, (w - inkW) / (sg.chars - 1));
          return { str: sg.str, toks: toks.slice(sg.i, sg.j), e, l, inkW, ls, lineW: Math.min(w, inkW + ls * (sg.chars - 1)), a: m.actualBoundingBoxAscent || e * 0.72, ds: Math.max(0, m.actualBoundingBoxDescent || 0) };
        });
        g.restore();
        let h = 0; out.forEach((ln, i) => { h += ln.a + ln.ds + (i ? lead * Math.min(ln.e, out[i - 1].e) : 0); });
        return { lines: out, h, w, lead };
      };
      const drawHead = (plan, x, y) => {
        if (!plan) return;
        let yy = y;
        g.save(); g.textAlign = "left"; g.textBaseline = "alphabetic"; g.lineJoin = "round";
        plan.lines.forEach((ln, i) => {
          if (i) yy += plan.lead * Math.min(ln.e, plan.lines[i - 1].e);
          const ax = al === "center" ? x + (plan.w - ln.lineW) / 2 : al === "right" ? x + plan.w - ln.lineW : x;
          g.font = d.font("display", ln.e); if (hasLS) g.letterSpacing = `${ln.ls}px`;
          const sp = g.measureText(" ").width, base = yy + ln.a;
          let pen = ax + ln.l;
          ln.pos = [];
          ln.toks.forEach((tk) => {
            if (tk.hi) { g.strokeStyle = fg; g.lineWidth = Math.max(2, ln.e * 0.035); g.strokeText(tk.w, pen, base); }
            else { g.fillStyle = fg; g.fillText(tk.w, pen, base); }
            ln.pos.push(pen);
            pen += g.measureText(tk.w).width + sp;
          });
          // a short line that could not fill the width: a solid bar runs on to the edge (keeps the block justified)
          const rest = plan.w - ln.lineW, bt = Math.max(0.8 * u, ln.e * 0.15), bgap = ln.e * 0.24;
          if (rest > bgap + Math.max(4 * u, ln.e * 0.45) && al !== "center") {
            const by = yy + ln.a * 0.5 - bt / 2;
            g.fillStyle = fg;
            if (al === "right") g.fillRect(x, by, rest - bgap, bt); else g.fillRect(ax + ln.lineW + bgap, by, rest - bgap, bt);
          }
          ln.base = base; ln.top = yy;
          d.tag("po-head"); d.mark(ax, yy, ln.lineW, ln.a + ln.ds); d.tag("");
          yy += ln.a + ln.ds;
        });
        g.restore();
      };
      /* letter outlines over the product, so the type reads while the product stands in front of it */
      /* The strokes are drawn on an offscreen canvas and masked by the product's own alpha, so they only appear
         ON the product (never as extra outlines around the solid letters beside it). Each outline is a dark/light
         pair (halo + line), so it reads on a white bottle, a dark cap or a colourful print alike. */
      const halo = d.lum(fg) > 0.5 ? "rgba(20,17,13,.62)" : "rgba(251,248,242,.7)";
      const overStroke = (plan, rect) => {
        if (!plan || !rect || !rect.cutout || !plan.lines[0].pos) return;
        const lines = plan.lines.filter((ln) => ln.base + ln.ds >= rect.y && ln.top <= rect.y + rect.h);
        if (!lines.length) return;
        const last = lines[lines.length - 1], pad = 2 * u;
        const x0 = Math.max(0, Math.floor(rect.x)), y0 = Math.max(0, Math.floor(rect.y));
        const x1 = Math.min(W, Math.ceil(rect.x + rect.w)), y1 = Math.min(H, Math.ceil(rect.y + rect.h), Math.ceil(last.base + last.ds + pad));
        const ow = x1 - x0, oh = y1 - y0; if (ow < 2 || oh < 2) return;
        if (!OFF) OFF = document.createElement("canvas");
        if (OFF.width < ow || OFF.height < oh) { OFF.width = Math.max(OFF.width, ow); OFF.height = Math.max(OFF.height, oh); }
        const o = OFF.getContext("2d");
        o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = "source-over"; o.clearRect(0, 0, OFF.width, OFF.height);
        o.setTransform(1, 0, 0, 1, -x0, -y0);
        o.textAlign = "left"; o.textBaseline = "alphabetic"; o.lineJoin = "round";
        lines.forEach((ln) => {
          o.font = d.font("display", ln.e); if ("letterSpacing" in o) o.letterSpacing = `${ln.ls}px`;
          const thin = Math.max(1.5, ln.e * 0.014);
          ln.toks.forEach((tk, i) => {
            const lw = tk.hi ? Math.max(2, ln.e * 0.035) : thin;
            o.strokeStyle = halo; o.lineWidth = lw + Math.max(3, ln.e * 0.03); o.strokeText(tk.w, ln.pos[i], ln.base);
            o.strokeStyle = fg; o.lineWidth = lw; o.strokeText(tk.w, ln.pos[i], ln.base);
          });
        });
        o.globalCompositeOperation = "destination-in";
        o.drawImage(d.source(0, true), rect.x, rect.y, rect.w, rect.h);
        o.globalCompositeOperation = "source-over"; o.setTransform(1, 0, 0, 1, 0, 0);
        g.drawImage(OFF, 0, 0, ow, oh, x0, y0, ow, oh);
      };
      /* the cut-out: stands flush on the price band with a hard, offset shadow (no soft glow: this is print) */
      const foot = d.hasPhoto(0) || d.source(0, true).height !== 860 ? 1 : SAMPLE_FOOT;   // samples are now trimmed by the engine
      const productSize = (bw, bh) => {
        const img = d.source(0, true), ar = Math.max(0.2, Math.min(5, img.width / Math.max(1, img.height)));
        const ph = Math.min(bh / foot, bw / ar); return { w: ph * ar, h: ph, vis: ph * foot };
      };
      const placeProduct = (px, ps, floorY) => {
        g.save(); g.beginPath(); g.rect(0, 0, W, floorY); g.clip();
        g.shadowColor = d.mix(bg, "#000000", d.lum(bg) < 0.05 ? 0.6 : 0.42); g.shadowBlur = 0;
        const sc = g.getTransform ? Math.abs(g.getTransform().a) || 1 : 1;   // shadow offsets ignore the transform
        g.shadowOffsetX = 1.5 * u * sc; g.shadowOffsetY = 1.1 * u * sc;
        const rect = d.product(px, floorY - ps.vis, ps.w, ps.h, { shadow: false });
        g.restore();
        return rect;
      };

      /* ---------- decoration ---------- */
      const cropMark = (x, y, s) => {
        g.save(); g.strokeStyle = d.rgba(fg, 0.6); g.lineWidth = Math.max(1.5, 0.18 * u);
        g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke();
        g.beginPath(); g.arc(x, y, s * 0.5, 0, Math.PI * 2); g.stroke(); g.restore();
      };
      const arrow = (x, y, A) => {
        const lw = A * 0.14, i = lw / 2;
        g.save(); g.strokeStyle = fg; g.lineWidth = lw; g.lineCap = "butt"; g.lineJoin = "miter";
        g.beginPath(); g.moveTo(x + i, y + i); g.lineTo(x + A - i * 1.6, y + A - i * 1.6); g.stroke();
        g.beginPath(); g.moveTo(x + A - i, y + A * 0.38); g.lineTo(x + A - i, y + A - i); g.lineTo(x + A * 0.38, y + A - i); g.stroke();
        g.restore();
      };
      const background = (X, CW, y0, y1) => {
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.save(); g.fillStyle = d.rgba(fg, 0.1);
        [0.25, 0.5, 0.75].forEach((f) => g.fillRect(Math.round(X + CW * f), y0, Math.max(1, 0.15 * u), y1 - y0));
        g.restore();
      };

      /* ---------- meta row: brand | NEW DROP | NO. 01 | 2027 ---------- */
      const meta = (X, CW, y, mh, ms) => {
        const ty = y + (mh - ms * 1.25) / 2, mo = { size: ms, min: ms * 0.85, weight: 800, letter: 0.14, upper: true, color: fg };
        if (d.hasLogo) {
          const autoStyle = !d.st.logoStyle || d.st.logoStyle === "auto";
          if (autoStyle && d.lum(bg) < 0.45) {
            // a sharp paper cell in the grid holds the logo (keeps its own colours readable)
            // measure first (clipped away; its text box removed again) so the cell hugs the logo
            const pd = mh * 0.14, maxW = Math.min(CW * 0.4, mh * 5.5) - pd * 2.6, M = d.getMarks(), n = M.length;
            g.save(); g.beginPath(); g.rect(0, 0, 0, 0); g.clip();
            const r = d.logo(X, y + pd, maxW, mh - pd * 2, { align: "left" });
            g.restore(); M.length = n;
            const cw = Math.max(mh * 1.5, r.w + pd * 2.6);
            g.fillStyle = "#FFFFFF"; g.fillRect(X, y, cw, mh);
            d.logo(X + (cw - r.w) / 2, y + pd, r.w + 0.5, mh - pd * 2, { align: "left" });
          } else d.logo(X, y, CW * 0.4, mh, { align: "left", tint: autoStyle ? null : undefined });
        } else if (t.brand) line(t.brand, X, ty, { ...mo, maxW: CW * 0.44 });
        line(TX.drop, X + CW * 0.5, ty, { ...mo, maxW: CW * 0.23 });
        line(TX.no, X + CW * 0.75, ty, { ...mo, maxW: CW * 0.12 });
        line(TX.year, X + CW * 0.88, ty, { ...mo, maxW: CW * 0.12, align: "right" });
      };

      /* ---------- the square stamp (sticker) ---------- */
      const ROT = -0.12;
      const stampExt = (R) => R * (Math.abs(Math.cos(ROT)) + Math.abs(Math.sin(ROT)));
      const stamp = (cx, cy, R) => {
        const txt = t.stickerText; if (!txt) return false;
        const s = isLatin(txt) ? txt.toUpperCase() : txt;
        g.save(); g.translate(cx, cy); g.rotate(ROT);
        g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(-R + 0.9 * u, -R + 0.9 * u, 2 * R, 2 * R);
        g.fillStyle = pop; g.fillRect(-R, -R, 2 * R, 2 * R);
        g.strokeStyle = d.rgba(popFg, 0.6); g.lineWidth = Math.max(1.5, R * 0.03); g.strokeRect(-R * 0.84, -R * 0.84, R * 1.68, R * 1.68);
        const F2 = d.fit(s, R * 1.44, 2, R * 0.6, R * 0.22, "display");
        g.fillStyle = popFg; g.textAlign = "center"; g.textBaseline = "middle";
        const lh = F2.size * 1.02, tot = F2.lines.length * lh;
        F2.lines.forEach((l, i) => g.fillText(l, 0, -tot / 2 + lh * (i + 0.5) + F2.size * 0.05));
        g.restore();
        const ext = stampExt(R);
        d.tag("po-stamp"); d.mark(cx - ext, cy - ext, ext * 2, ext * 2); d.tag("");
        return true;
      };
      /* keep a stamp out of the story's Reels button column */
      const clampStory = (cx, cy, ext) => (k.story && cy + ext > H * 0.45 && cy - ext < H * 0.8 ? Math.min(cx, W * 0.88 - 0.6 * u - ext) : cx);

      /* ---------- price band: [prefix ~~old~~ / ৳price] .......... [ORDER NOW →] ---------- */
      // the ৳ glyph's hook rises above the cap height: leave it room under the prefix / old-price row
      const rowH = (smallS, priceS) => smallS * 1.25 + 0.4 * u + priceS * 0.1;
      const bandH = (priceS, smallS, ctaS) => {
        const pd = 1.6 * u, hasSmall = !!(t.price && (t.prefix || t.old));
        const contentH = t.price ? (hasSmall ? rowH(smallS, priceS) : 0) + priceS * 1.06 : priceS * 0.8;
        return Math.max(contentH, ctaS * 2.6) + pd * 2;
      };
      const band = (bx0, bx1, x, xr, y, h, priceS, smallS, ctaS) => {
        const pd = 1.6 * u;
        g.fillStyle = fg; g.fillRect(bx0, y, bx1 - bx0, h);
        let ctaX = xr;
        if (t.cta) {
          const lbl = isLatin(t.cta) ? t.cta.toUpperCase() : t.cta;
          const aw = ctaS * 1.25, gap = ctaS * 0.6, padX = ctaS * 1.0;
          const maxTW = (xr - x) * 0.5 - aw - gap - padX * 2;
          const lo = { size: ctaS, min: 2.2 * u, weight: 800, letter: isLatin(t.cta) ? 0.06 : 0, maxW: maxTW, color: bg, nomark: true };
          const m = line(lbl, 0, 0, { ...lo, measure: true });
          const bw = padX * 2 + m.w + gap + aw, bh = h - pd * 2;
          ctaX = xr - bw;
          g.fillStyle = bg; g.fillRect(ctaX, y + pd, bw, bh);
          line(lbl, ctaX + padX, y + pd + (bh - m.h) / 2, { ...lo, color: fg });
          // drawn arrow
          const ax = ctaX + padX + m.w + gap, ay = y + pd + bh / 2, lw = Math.max(2.5, ctaS * 0.16);
          g.save(); g.strokeStyle = fg; g.fillStyle = fg; g.lineWidth = lw; g.lineCap = "butt";
          g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + aw - ctaS * 0.45, ay); g.stroke();
          g.beginPath(); g.moveTo(ax + aw, ay); g.lineTo(ax + aw - ctaS * 0.6, ay - ctaS * 0.42); g.lineTo(ax + aw - ctaS * 0.6, ay + ctaS * 0.42); g.closePath(); g.fill();
          g.restore();
          d.tag("po-cta"); d.mark(ctaX, y + pd, bw, bh); d.tag("");
        }
        const pw = ctaX - pd * 1.6 - x;
        if (t.price) {
          const hasSmall = !!(t.prefix || t.old);
          const pm = d.text(t.price, 0, 0, { measure: true, size: priceS, min: priceS * 0.55, kind: "display", lines: 1, maxW: pw, lh: 1.06 });
          const ch = (hasSmall ? rowH(smallS, priceS) : 0) + pm.h;
          let yy = y + (h - ch) / 2;
          if (hasSmall) {
            let xx = x;
            if (t.prefix) { const r = line(t.prefix, xx, yy, { size: smallS, min: 2.2 * u, weight: 800, letter: 0.12, upper: true, maxW: pw * 0.5, color: onBand }); xx += r.w + smallS * 0.7; }
            if (t.old) {
              const oc = d.rgba(onBand, 0.78), r = line(t.old, xx, yy, { size: smallS, min: 2.2 * u, weight: 600, maxW: Math.max(4 * u, x + pw - xx), color: oc });
              g.save(); g.strokeStyle = oc; g.lineWidth = Math.max(2, smallS * 0.1); g.beginPath(); g.moveTo(r.x - 2, yy + r.h * 0.52); g.lineTo(r.x + r.w + 2, yy + r.h * 0.52); g.stroke(); g.restore();
            }
            yy += rowH(smallS, priceS);
          }
          d.text(t.price, x, yy, { size: priceS, min: priceS * 0.55, kind: "display", lines: 1, maxW: pw, lh: 1.06, color: onBand });
        } else {
          const lb = line(TX.drop, x, 0, { size: priceS * 0.62, min: 2.6 * u, kind: "display", weight: d.f.dW, maxW: pw, measure: true });
          line(TX.drop, x, y + (h - lb.h) / 2, { size: priceS * 0.62, min: 2.6 * u, kind: "display", weight: d.f.dW, maxW: pw, color: onBand });
        }
      };

      /* ---------- spec column: sub, badge list, rating, offer end (drops what doesn't fit) ---------- */
      const column = (w, s, avail) => {
        const cand = [], gapG = 2.2 * u, rp = 0.9 * u, ruleT = Math.max(2, 0.22 * u);
        if (t.sub) {
          const o = { size: Math.max(2.2 * u, s * 1.08), min: 2.2 * u, kind: "body", weight: 500, lines: 3, lh: 1.25, maxW: w, color: d.rgba(fg, 0.92) };
          const m = d.text(t.sub, 0, 0, { ...o, measure: true });
          cand.push({ pri: 0, ord: 0, h: m.h, draw: (x, y) => d.text(t.sub, x, y, o) });
        }
        t.badges.forEach((b, i) => {
          const lbl = isLatin(b) ? b.toUpperCase() : b, bs = s * 0.55, gap = s * 0.65;
          const o = { size: s, min: 2.2 * u, kind: "body", weight: 700, lines: 2, lh: 1.18, maxW: w - bs - gap, color: fg };
          const m = d.text(lbl, 0, 0, { ...o, measure: true });
          cand.push({ pri: i < 2 ? 1 + i : 5 + i, ord: 10 + i, chip: true, h: m.h + rp * 2, draw: (x, y, first) => {
            g.fillStyle = fg; g.fillRect(x, y, w, first ? ruleT * 2.2 : ruleT);
            g.fillRect(x, y + rp + (m.size * 1.18 - bs) / 2, bs, bs);
            d.text(lbl, x + bs + gap, y + rp, o);
          } });
        });
        if (t.endsText) {
          const lo = { size: s, min: 2.2 * u, weight: 800, letter: 0.04, upper: true, color: fg };
          cand.push({ pri: 3, ord: 40, h: s * 1.3, draw: (x, y) => {
            const ic = s * 1.05, cx = x + ic / 2, cy = y + s * 0.65, r = ic * 0.44;
            g.save(); g.strokeStyle = fg; g.lineWidth = Math.max(2, s * 0.13); g.lineCap = "square";
            g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
            g.beginPath(); g.moveTo(cx, cy - r * 0.55); g.lineTo(cx, cy); g.lineTo(cx + r * 0.45, cy + r * 0.3); g.stroke(); g.restore();
            line(t.endsText, x + ic + s * 0.5, y, { ...lo, lh: 1.3, maxW: w - ic - s * 0.5 });
          } });
        }
        if (t.proof || t.rating) {
          const ss = s * 1.1, po = { size: s, min: 2.2 * u, kind: "body", weight: 600, lines: 2, lh: 1.2, maxW: w, color: d.rgba(fg, 0.9) };
          const pm = t.proof ? d.text(t.proof, 0, 0, { ...po, measure: true }) : { h: 0 };
          const h = (t.rating ? ss * 1.15 : 0) + (t.rating && t.proof ? 0.6 * u : 0) + pm.h;
          cand.push({ pri: 4, ord: 30, h, draw: (x, y) => {
            let yy = y;
            if (t.rating) {
              const sw = d.stars(x, yy + ss * 0.07, ss, { color: fg, empty: d.rgba(fg, 0.25), rating: t.rating });
              line(t.ratingText, x + sw + s * 0.6, yy, { size: s * 1.05, min: 2.2 * u, kind: "body", weight: 800, lh: 1.15 * ss / (s * 1.05), maxW: Math.max(3 * u, w - sw - s * 0.6), color: fg });
              yy += ss * 1.15 + (t.proof ? 0.6 * u : 0);
            }
            if (t.proof) d.text(t.proof, x, yy, po);
          } });
        }
        const total = (list) => list.reduce((a, it, i) => a + it.h + (i ? (it.chip && list[i - 1].chip ? 0 : gapG) : 0), 0) + (list.some((it) => it.chip) ? ruleT : 0);
        let chosen = [];
        cand.slice().sort((a, b) => a.pri - b.pri).forEach((it) => {
          const test = [...chosen, it].sort((a, b) => a.ord - b.ord);
          if (total(test) <= avail) chosen = test;
        });
        return { n: chosen.length, h: chosen.length ? total(chosen) : 0, draw: (x, y) => {
          let yy = y;
          chosen.forEach((it, i) => {
            const prev = chosen[i - 1];
            if (i) yy += it.chip && prev.chip ? 0 : gapG;
            it.draw(x, yy, it.chip && !(prev && prev.chip));
            yy += it.h;
            const next = chosen[i + 1];
            if (it.chip && !(next && next.chip)) { g.fillStyle = fg; g.fillRect(x, yy, w, ruleT); yy += ruleT; }
          });
        } };
      };

      /* ---------- seller photo as a hard-edged block ---------- */
      const photoBlock = (x, y, w, h, withFig) => {
        const off = 1.2 * u;
        g.fillStyle = fg; g.fillRect(x + off, y + off, w, h);
        d.photo(x, y, w, h);
        g.save(); g.strokeStyle = fg; g.lineWidth = 0.5 * u; g.strokeRect(x + 0.25 * u, y + 0.25 * u, w - 0.5 * u, h - 0.5 * u); g.restore();
        if (withFig) {
          const fs = 2.2 * u, m = line(TX.fig, 0, 0, { size: fs, weight: 800, letter: 0.14, measure: true });
          const pdx = 1.1 * u;
          g.fillStyle = fg; g.fillRect(x, y + h - m.h - 0.8 * u, m.w + pdx * 2, m.h + 0.8 * u);
          line(TX.fig, x + pdx, y + h - m.h - 0.4 * u, { size: fs, weight: 800, letter: 0.14, color: bg });
        }
      };


      /* ================= landscape: type + spec row left, product right, band across ================= */
      if (k.landscape) {
        const X = 5 * u, CW = W - 2 * X, top = 5 * u, LW = CW * 0.56;
        const ruleH = 1.2 * u, ms = small(2.3 * u);
        const mh = d.hasLogo ? Math.max(ms * 1.3, 6 * u) : ms * 1.3;
        const my = top + ruleH + 1.4 * u, hy = my + mh + 1.4 * u, hairH = Math.max(2, 0.3 * u);
        const y0 = hy + hairH + 3 * u;
        const priceS = 6.4 * u * FX, smallS = small(2.3 * u), ctaS = small(2.6 * u);
        const BH = bandH(priceS, smallS, ctaS), bandY = H - top - BH;
        const gut = 2.6 * u;
        // spec row: offer end + badges as sharp outlined tags, one row, dropping what doesn't fit
        const rs = small(2.3 * u), rowH = rs * 2.1;
        const rowItems = [];
        if (t.endsText) rowItems.push({ ends: true, text: t.endsText });
        t.badges.forEach((b) => rowItems.push({ text: b }));
        const subO = { size: small(2.7 * u), min: 2.2 * u, kind: "body", weight: 500, lines: 2, lh: 1.22, maxW: LW, color: d.rgba(fg, 0.92) };
        const subH = t.sub ? d.text(t.sub, 0, 0, { ...subO, measure: true }).h : 0;
        const zone = bandY - gut - y0;
        let headAvail = zone - (rowItems.length ? rowH + gut : 0) - (subH ? subH + 1.8 * u : 0);
        let useSub = !!subH;
        if (headAvail < 14 * u && useSub) { useSub = false; headAvail += subH + 1.8 * u; }
        const plan = planHead(LW, headAvail, { maxLines: 4, maxCap: Math.min(headAvail * 0.75, 24 * u) });
        const headBot = y0 + (plan ? plan.h : 0);

        background(X, CW, hy + hairH, bandY);
        cropMark(X / 2, top / 2 + ruleH / 2, 1.2 * u); cropMark(W - X / 2, top / 2 + ruleH / 2, 1.2 * u);
        g.fillStyle = fg; g.fillRect(X, top, CW, ruleH);
        meta(X, CW, my, mh, ms);
        g.fillRect(X, hy, CW, hairH);
        drawHead(plan, X, y0);
        band(X, X + CW, X + 1.6 * u, X + CW - 1.6 * u, bandY, BH, priceS, smallS, ctaS);

        let rect = null, stampR = 7.2 * u * Math.min(1.1, FX), sx, sy;
        const ext = stampExt(stampR);
        if (cut) {
          const by0 = hy + hairH + 1.2 * u, bh = bandY - by0, x0 = X + LW - 8 * u;
          const ps = productSize(X + CW - x0, bh);
          const px = Math.max(x0, Math.min(X + LW - ps.w * 0.24, X + CW - ps.w));
          rect = placeProduct(px, ps, bandY);
          overStroke(plan, rect);
          sx = X + CW - ext - 0.4 * u; sy = y0 + ext - 0.6 * u;
        } else {
          const bx = X + LW + gut, by = y0 - 0.6 * u, bw = X + CW - bx, bh = bandY - gut - by;
          photoBlock(bx, by, bw, bh, true);
          sx = bx + bw - ext - 1.4 * u; sy = by + ext + 1.4 * u;
        }
        if (useSub) d.text(t.sub, X, headBot + 1.8 * u, subO);
        // spec row
        if (rowItems.length) {
          let xx = X; const ry = bandY - gut - rowH, padX = rs * 0.8, lw = Math.max(2, 0.3 * u);
          for (const it of rowItems) {
            const lbl = isLatin(it.text) ? it.text.toUpperCase() : it.text;
            const ic = it.ends ? rs * 1.05 + rs * 0.45 : 0;
            const m = line(lbl, 0, 0, { size: rs, min: rs, weight: 800, letter: 0.04, maxW: LW, measure: true });
            const bw = m.w + padX * 2 + ic;
            if (xx + bw > X + LW + 0.5) break;
            g.save(); g.strokeStyle = fg; g.lineWidth = lw;
            if (it.ends) { g.fillStyle = fg; g.fillRect(xx, ry, bw, rowH); } else g.strokeRect(xx + lw / 2, ry + lw / 2, bw - lw, rowH - lw);
            g.restore();
            const tc = it.ends ? bg : fg;
            if (it.ends) {
              const cx = xx + padX + rs * 0.52, cy = ry + rowH / 2, r = rs * 0.46;
              g.save(); g.strokeStyle = tc; g.lineWidth = Math.max(2, rs * 0.13);
              g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
              g.beginPath(); g.moveTo(cx, cy - r * 0.55); g.lineTo(cx, cy); g.lineTo(cx + r * 0.45, cy + r * 0.3); g.stroke(); g.restore();
            }
            line(lbl, xx + padX + ic, ry + (rowH - m.h) / 2, { size: rs, min: rs, weight: 800, letter: 0.04, maxW: LW, color: tc });
            xx += bw + 1.2 * u;
          }
        }
        stamp(sx, sy, stampR);
        return;
      }

      /* ================= square / portrait / story ================= */
      const SZ = k.story ? { head: 0.5, ov: 0.36, price: 7.4 * u, R: 7.2 * u, lines: 5, col: 0.42 }
        : k.portrait ? { head: 0.5, ov: 0.36, price: 7.6 * u, R: 7 * u, lines: 5, col: 0.4 }
          : { head: 0.5, ov: 0.46, price: 7 * u, R: 6.4 * u, lines: 4, col: 0.4 };
      const m0 = 4.6 * u;
      const X = k.story ? k.side : m0, CW = W - 2 * X, top = k.story ? k.top : m0;
      const bottom = k.story ? H * 0.8 - 1.2 * u : H - m0;
      const ruleH = 1.3 * u, ms = small(2.2 * u);
      const mh = d.hasLogo ? Math.max(ms * 1.3, 5.6 * u) : ms * 1.3;
      const my = top + ruleH + 1.4 * u, hy = my + mh + 1.4 * u, hairH = Math.max(2, 0.3 * u);
      const y0 = hy + hairH + 3 * u;
      const priceS = SZ.price * FX, smallS = small(2.2 * u), ctaS = small(2.5 * u);
      const BH = bandH(priceS, smallS, ctaS), bandY = bottom - BH;
      const gut = 2.6 * u;
      let headAvail = (bandY - y0) * SZ.head * (cut ? 1 : 0.86);
      if (k.story) headAvail = Math.min(headAvail, H * 0.45 - y0 - u);
      const plan = planHead(CW, headAvail, { maxLines: SZ.lines, maxCap: Math.min(headAvail * 0.62, 30 * u) });
      const headH = plan ? plan.h : 0, headBot = y0 + headH;

      const stampR = SZ.R * Math.min(1.1, FX), ext = stampExt(stampR);
      const colW = CW * SZ.col, colTop = headBot + gut + 0.4 * u, colBot = bandY - gut;
      // story: the Reels buttons push a right-hand stamp onto the product, so the stamp gets reserved room in
      // the spec column (the list drops its lowest-priority items instead)
      const wantLeft = k.story && cut && !!t.stickerText, reserve = 2 * ext + 4.6 * u;
      const stampLeft = wantLeft && colBot - colTop >= reserve;
      const col = column(colW, small(2.3 * u), colBot - colTop - (stampLeft ? reserve : 0));
      const hasCol = col.n > 0;

      background(X, CW, hy + hairH, bandY);
      const cm = k.story ? 1.6 * u : 1.2 * u;
      if (k.story) {
        // the profile row (top 14%) and caption zone (bottom 20%) get graduated print bars: pure decoration
        g.save(); g.fillStyle = d.rgba(fg, 0.2);
        const step = 2.6 * u, bars = (y0b, y1b, grow) => {
          const n = Math.max(1, Math.floor((y1b - y0b) / step));
          for (let i = 0; i < n; i++) { const f = n > 1 ? i / (n - 1) : 1, th = (0.2 + 2.1 * (grow ? f : 1 - f)) * u; g.fillRect(0, y0b + i * step + (step - th) / 2, W, th); }
        };
        bars(0, top - 4 * u, false);
        bars(bottom + 3 * u, H, true);
        g.restore();
      } else {
        cropMark(X / 2, top / 2 + ruleH / 2, cm); cropMark(W - X / 2, top / 2 + ruleH / 2, cm);
        cropMark(X / 2, H - m0 / 2, cm); cropMark(W - X / 2, H - m0 / 2, cm);
      }
      g.fillStyle = fg; g.fillRect(X, top, CW, ruleH);
      meta(X, CW, my, mh, ms);
      g.fillStyle = fg; g.fillRect(X, hy, CW, hairH);
      drawHead(plan, X, y0);
      // story: the band bleeds to both edges; its content stays left of the Reels buttons
      const bx0 = k.story ? 0 : X, bx1 = k.story ? W : X + CW;
      const cx0 = k.story ? X : X + 1.6 * u, cxr = k.story ? Math.min(X + CW, W * 0.88 - 1.2 * u) : X + CW - 1.6 * u;
      band(bx0, bx1, cx0, cxr, bandY, BH, priceS, smallS, ctaS);

      let sx, sy;
      let colUsed = col.h;
      if (cut) {
        // the left column always belongs to the spec list / stamp / arrow, so the product owns the right side
        const x0 = X + colW + 2 * u, x1 = k.story ? W - X * 0.35 : X + CW;
        const py0 = plan ? headBot - headH * SZ.ov : y0;
        const ps = productSize(x1 - x0, bandY - py0);
        // with a stamp on the right, lean the product left so the stamp sits beside it (not over its label)
        const px = x0 + (x1 - x0 - ps.w) * (t.stickerText && !stampLeft ? 0.04 : 0.3);
        const rect = placeProduct(px, ps, bandY);
        overStroke(plan, rect);
        if (stampLeft) { sx = X + ext + 0.6 * u; sy = colTop + col.h + (hasCol ? 2.6 * u : 0.6 * u) + ext; colUsed = sy + ext - colTop; }
        else { sx = X + CW - ext - 0.2 * u; sy = headBot + 1.6 * u + ext; }
      } else {
        const bx = hasCol ? X + colW + gut : X, by = headBot + gut + 0.4 * u, bw = X + CW - bx, bh = bandY - gut - by;
        photoBlock(bx, by, bw, bh, bw > 30 * u);
        sx = bx + bw - ext - 1.4 * u; sy = by + ext + 1.4 * u;
      }
      if (hasCol) col.draw(X, colTop);
      if (hasCol || cut) {
        // spare room under the spec list (or an empty column): a heavy Swiss arrow pointing at the price
        const free = colBot - colTop - colUsed, A = Math.min(free - 2.5 * u, colW * 0.4, 20 * u);
        if (A >= 10 * u) arrow(X, colBot - A, A);
      }
      sx = clampStory(sx, sy, ext);
      stamp(sx, sy, stampR);
    },
  });
})();
