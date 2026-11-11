/* Magazine cover: a fashion / lifestyle cover for the product.
   - The masthead is the brand name fitted to the full width (a long Latin name keeps its first
     word big and sets the rest as a small spaced line above it, like ELLE DECORATION).
   - With a cut-out: studio backdrop → masthead → the product standing in front of it (the classic
     cover trick). With a seller photo: the photo full-bleed under brand-tinted gradients.
   - Cover lines: the headline is the main line, the sub sits under it, badges / offer end / rating
     are small stacked lines with a coloured rule. An issue line under the masthead, a price circle
     and a printed barcode finish it. Everything is drawn: no images, no emoji. */
(() => {
  "use strict";
  const BN = /[ঀ-৿]/;
  const LCODE = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
  const RCODE = LCODE.map((s) => s.replace(/[01]/g, (b) => (b === "1" ? "0" : "1")));

  GRS.register({
    id: "magazine", name: "Magazine cover", group: "premium", photos: 1, cutout: "best",
    desc: "Fashion cover: masthead, cover lines, barcode",
    draw(d) {
      const { g, W, H, k, t, c, u } = d;
      const bn = t.lang === "bn";
      const cut = d.hasCutout(0);
      const ov = d.overlay;
      const INK = c.ink, P = c.primary, Lp = d.lum(P), sat = d.toHsl(P)[1];
      const neutral = sat < 0.14;
      const al = d.align("left");
      const FX = (k.story ? 1.2 : 1) * Math.max(0.85, Math.min(1.2, d.scale || 1));   // size factor for the style's own small copy
      /* push a colour away from the background until it reaches the contrast ratio */
      const ensure = (col, bg, min) => {
        const to = d.lum(bg) > 0.3 ? "#000000" : "#FFFFFF"; let x = col;
        for (let i = 1; i <= 10 && d.contrast(x, bg) < min; i++) x = d.mix(col, to, i * 0.1);
        return x;
      };
      const auto = window.GRS && GRS.autoAccent ? GRS.autoAccent(P) : "";
      const ownAccent = !!auto && String(c.accent).toLowerCase() !== auto.toLowerCase();

      /* ---------- palette ---------- */
      let pal;
      if (cut && Lp > 0.42) {
        // light brand colour: the cover IS the brand colour, set in ink
        const hi = ensure(c.accent, P, 3.6);
        pal = { bgTop: d.mix(P, "#FFFFFF", 0.22), bgBot: d.mix(P, "#000000", 0.07), glow: "rgba(255,255,255,.6)", mast: INK, text: INK, text2: d.rgba(INK, 0.78), muted: d.rgba(INK, 0.74), hi, rule: hi,
          circle: INK, circleFg: P, ctaBg: INK, ctaFg: d.contrast(P, INK) > 7 ? P : "#FFFFFF", stick: c.red, stickFg: "#FFFFFF", stars: INK, starsEmpty: d.rgba(INK, 0.2), plate: null, tsh: null };
      } else if (cut && neutral && Lp < 0.12) {
        // near-black brand: black & white cover with one editorial red (or the seller's own accent)
        const bg = "#F3EEE6", hi = ownAccent ? ensure(c.accent, bg, 3.6) : c.red;
        pal = { bgTop: "#F7F3EC", bgBot: "#E1D9CC", glow: "rgba(255,255,255,.75)", mast: P, text: INK, text2: d.rgba(INK, 0.78), muted: d.rgba(INK, 0.72), hi, rule: hi,
          circle: hi, circleFg: d.onColor(hi), ctaBg: INK, ctaFg: "#FFFFFF", stick: INK, stickFg: "#FFFFFF", stars: INK, starsEmpty: d.rgba(INK, 0.2), plate: null, tsh: null };
      } else if (cut) {
        // pastel studio backdrop in the brand hue, masthead in the brand colour
        const bgTop = d.mix(P, "#FFFFFF", 0.86), bgBot = d.mix(P, "#FFFFFF", 0.68);
        const hi = ensure(P, bgTop, 3.4);
        pal = { bgTop, bgBot, glow: "rgba(255,255,255,.7)", mast: ensure(P, bgTop, 2.4), text: INK, text2: d.rgba(INK, 0.78), muted: d.rgba(INK, 0.74), hi, rule: hi,
          circle: P, circleFg: c.onPrimary, ctaBg: INK, ctaFg: "#FFFFFF", stick: c.sale, stickFg: INK, stars: INK, starsEmpty: d.rgba(INK, 0.2), plate: null, tsh: null };
      } else {
        // seller photo full-bleed: white type on brand-tinted shade
        const shade = neutral ? "#0E0D0C" : c.dark;
        const hi = neutral ? c.gold : ensure(P, shade, 4.2);
        const circle = neutral ? "#FFFFFF" : P;
        pal = { shade, mast: "#FFFFFF", text: "#FFFFFF", text2: "rgba(255,255,255,.9)", muted: "rgba(255,255,255,.86)", hi, rule: hi,
          circle, circleFg: d.onColor(circle), ctaBg: "#FFFFFF", ctaFg: INK, stick: d.contrast(circle, c.sale) < 1.6 ? c.red : c.sale, stickFg: d.contrast(circle, c.sale) < 1.6 ? "#FFFFFF" : INK,
          stars: "#FFC83D", starsEmpty: "rgba(255,255,255,.3)", plate: "#FFFFFF", tsh: "rgba(0,0,0,.35)" };
      }

      /* ---------- copy ---------- */
      const year = (() => {
        const src = [d.st.ends, d.st.headline, d.st.sub, d.st.festive].map((v) => String(v || "")).join(" ").replace(/[০-৯]/g, (x) => String("০১২৩৪৫৬৭৮৯".indexOf(x)));
        const m = src.match(/(?:^|\D)(20[2-9]\d)(?!\d)/);
        return m ? m[1] : "";
      })();
      const issueText = t.festiveOr("The Eid issue", "ঈদ সংখ্যা") + (year ? ` · ${t.loc(year)}` : "");
      const mastText = t.brand || (d.hasLogo ? "" : bn ? "দ্য এডিট" : "The Edit");
      const mastKind = d.f.key === "bold" || d.f.key === "classic" ? "display" : "serif";
      const mastWt = mastKind === "display" ? d.f.dW : 700;

      /* ---------- small helpers ---------- */
      let tagN = 0;
      // one line of text with real letter-spacing, shrink-then-ellipsis to fit maxW. Marks its own box.
      const line = (str, x, y, o) => {
        let s = String(str || ""); if (!s) return { w: 0, h: 0, size: 0 };
        const bnS = BN.test(s);
        if (o.upper && !bnS) s = s.toUpperCase();
        const ls = bnS ? 0 : o.letter || 0, kind = o.kind || "body", wt = o.weight || 700, maxW = o.maxW || W, hasLS = "letterSpacing" in g;
        let size = o.size; const min = o.min || size * 0.78;
        g.save();
        const setF = (sz) => { g.font = d.font(kind, sz, wt); if (hasLS) g.letterSpacing = ls ? `${ls * sz}px` : "0px"; };
        const mw = (txt, sz) => g.measureText(txt).width - (hasLS ? ls * sz : 0);
        setF(size); let w = mw(s, size);
        while (w > maxW && size > min) { size = Math.max(min, size - 1); setF(size); w = mw(s, size); }
        if (w > maxW) { let cc = s; while (cc.length > 1 && w > maxW) { cc = cc.slice(0, -1).trimEnd(); w = mw(`${cc}…`, size); } s = `${cc}…`; }
        const h = size * (o.lh || 1.22);
        if (o.measure) { g.restore(); return { w, h, size }; }
        const lx = o.align === "center" ? x + (maxW - w) / 2 : o.align === "right" ? x + maxW - w : x;
        g.textAlign = "left"; g.textBaseline = "top"; g.fillStyle = o.color || "#FFFFFF";
        if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = 1.4 * u; }
        g.fillText(s, lx, y + (h - size) / 2);
        g.restore();
        d.tag(`mz-line${++tagN}`); d.mark(lx, y, w, h); d.tag("");
        return { w, h, size, x: lx };
      };
      const clock = (x, y, s, col) => {
        g.save(); g.strokeStyle = col; g.lineWidth = Math.max(1.5, s * 0.12); g.lineCap = "round"; g.lineJoin = "round";
        g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.42, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(x + s / 2, y + s * 0.25); g.lineTo(x + s / 2, y + s / 2); g.lineTo(x + s * 0.69, y + s * 0.62); g.stroke();
        g.restore();
      };

      /* ---------- masthead ---------- */
      const mastSpec = (w, maxH) => {
        if (!mastText) return null;
        const latin = !BN.test(mastText);
        const meas = (s) => {
          g.save(); g.font = d.font(mastKind, 100, mastWt); if ("letterSpacing" in g) g.letterSpacing = "0px";
          const m = g.measureText(s); g.restore();
          return { w: Math.max(1, m.width), a: Math.max(1, m.actualBoundingBoxAscent), ds: Math.max(0, m.actualBoundingBoxDescent) };
        };
        const fitOf = (s) => { const m = meas(s); let size = (100 * w) / m.w; const hh = (m.a + m.ds) / 100; if (size * hh > maxH) size = maxH / hh; return { s, m, size }; };
        let main = latin ? mastText.toUpperCase() : mastText, rest = "";
        let F = fitOf(main);
        const words = main.split(/\s+/).filter(Boolean);
        if (latin && words.length > 1 && (F.size * F.m.a) / 100 < maxH * 0.62) {
          const n = words[0].length >= 4 ? 1 : words.length > 2 && (words[0] + words[1]).length >= 5 ? 2 : 0;
          if (n) {
            const F2 = fitOf(words.slice(0, n).join(" "));
            if (F2.size * F2.m.a > F.size * F.m.a * 1.3) { F = F2; main = F2.s; rest = words.slice(n).join(" "); }
          }
        }
        const size = F.size, natW = (F.m.w * size) / 100, chars = [...main].length;
        let ls = 0;
        if (latin && chars > 1 && "letterSpacing" in g && natW < w) ls = Math.min((w - natW) / (chars - 1), size * 0.2);
        return { main, rest, size, ls, w: natW + ls * (chars - 1), asc: (F.m.a * size) / 100, h: ((F.m.a + F.m.ds) * size) / 100 };
      };
      const drawMast = (M, x, y, w) => {
        g.save(); g.font = d.font(mastKind, M.size, mastWt);
        if ("letterSpacing" in g) g.letterSpacing = `${M.ls}px`;
        g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = pal.mast;
        if (pal.tsh) { g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = 3 * u; g.shadowOffsetY = 0.4 * u; }
        const x0 = x + (w - M.w) / 2;
        g.fillText(M.main, x0, y + M.asc);
        g.restore();
        d.tag("mz-masthead"); d.mark(x0, y, M.w, M.h); d.tag("");
      };
      const restLine = (M, x, y, w, s) => line(M.rest, x, y, { size: s, letter: 0.42, upper: true, weight: 700, maxW: w, align: "center", color: pal.mast, shadow: pal.tsh });

      /* ---------- backgrounds ---------- */
      const backdrop = (gx, gy, gr0) => {
        let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, pal.bgTop); gr.addColorStop(1, pal.bgBot);
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        gr = g.createRadialGradient(gx, gy, 0, gx, gy, gr0); gr.addColorStop(0, pal.glow); gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      };
      const photoBg = (topH, botY, leftW) => {
        d.photo(0, 0, W, H);
        const sh = pal.shade;
        let gr = g.createLinearGradient(0, 0, 0, topH); gr.addColorStop(0, d.rgba(sh, 0.72 * ov)); gr.addColorStop(0.55, d.rgba(sh, 0.38 * ov)); gr.addColorStop(1, d.rgba(sh, 0));
        g.fillStyle = gr; g.fillRect(0, 0, W, topH);
        gr = g.createLinearGradient(0, botY, 0, H); gr.addColorStop(0, d.rgba(sh, 0)); gr.addColorStop(0.4, d.rgba(sh, 0.7 * ov)); gr.addColorStop(1, d.rgba(sh, 0.94 * ov));
        g.fillStyle = gr; g.fillRect(0, botY, W, H - botY);
        if (leftW) { gr = g.createLinearGradient(0, 0, leftW, 0); gr.addColorStop(0, d.rgba(sh, 0.6 * ov)); gr.addColorStop(1, d.rgba(sh, 0)); g.fillStyle = gr; g.fillRect(0, 0, leftW, H); }
      };

      /* ---------- headline + sub (main cover line) ---------- */
      const fitHead = (avail, maxW, o) => {
        const start = k.boost * Math.max(0.6, d.scale || 1), minF = Math.min(start, Math.max(0.5, (5 * u) / o.head));
        const C = { head: pal.text, hi: pal.hi, sub: pal.muted, headShadow: pal.tsh };
        const mk = (f, sub) => d.block({ parts: sub ? ["head", "sub"] : ["head"], f, maxW, align: al, head: o.head, headLines: o.headLines, sub: o.sub, gap: 1.5 * u, c: C });
        if (t.sub) for (let f = start; f >= Math.max(minF, start * 0.72) - 1e-6; f -= 0.04) { const b = mk(f, true); if (b.h <= avail) return b; }
        for (let f = start; f >= minF - 1e-6; f -= 0.04) { const b = mk(f, false); if (b.h <= avail) return b; }
        return mk(minF, false);
      };

      /* ---------- stacked cover lines (badges, offer end, rating) ---------- */
      const coverList = () => {
        const list = t.badges.map((b) => ({ kind: "badge", text: b }));
        if (t.endsText) list.splice(Math.min(1, list.length), 0, { kind: "ends" });
        if (t.proof || t.rating) list.splice(Math.min(2, list.length), 0, { kind: "proof" });
        return list;
      };
      const coverItem = (it, x, y, w, s, draw) => {
        const rh = Math.max(2, 0.5 * u), rg = s * 0.5;
        if (draw) { g.fillStyle = pal.rule; g.fillRect(x, y, Math.min(w * 0.4, s * 2.2), rh); }
        let h = rh + rg; const ty = y + h, minS = Math.max(2.2 * u, s * 0.8);
        if (it.kind === "badge") {
          const o = { size: s, min: minS, kind: "display", lines: 2, lh: 1.1, maxW: w, upper: true, color: pal.text, shadow: pal.tsh, shadowBlur: 1.2 * u };
          h += d.text(it.text, x, ty, draw ? o : { ...o, measure: true }).h;
        } else if (it.kind === "ends") {
          const cs = s * 1.02, lh = s * 1.22;
          if (draw) clock(x, ty + (lh - cs) / 2, cs, pal.hi);
          h += line(t.endsText, x + cs + s * 0.4, ty, { size: s, min: minS, weight: 800, upper: true, letter: 0.04, maxW: w - cs - s * 0.4, color: pal.hi, measure: !draw, shadow: pal.tsh }).h;
        } else {
          let ph = 0;
          if (t.rating) {
            const m = line(t.ratingText, x, ty, { size: s * 1.7, kind: "display", weight: d.f.dW, maxW: w * 0.42, lh: 1.08, color: pal.text, measure: !draw, shadow: pal.tsh });
            const ss = Math.min(s * 0.95, (w - m.w - s * 0.5) / 5.8);
            if (draw) d.stars(x + m.w + s * 0.45, ty + (m.h - ss) / 2, ss, { color: pal.stars, empty: pal.starsEmpty });
            ph += m.h;
          }
          if (t.proof) {
            const o = { size: s * 0.9, min: Math.min(s * 0.9, minS), kind: "body", weight: 700, lines: 2, lh: 1.16, maxW: w, upper: true, color: pal.muted, shadow: pal.tsh, shadowBlur: 1.2 * u };
            const py = ty + ph + (ph ? s * 0.3 : 0);
            ph += (ph ? s * 0.3 : 0) + d.text(t.proof, x, py, draw ? o : { ...o, measure: true }).h;
          }
          h += ph;
        }
        return h;
      };
      const column = (list, x, y, w, hMax, s, maxN) => {
        let yy = y, n = 0; const gap = s * 1.05;
        for (const it of list) {
          if (n >= maxN) break;
          const h = coverItem(it, x, yy, w, s, false);
          if (yy + h > y + hMax) break;
          coverItem(it, x, yy, w, s, true); yy += h + gap; n++;
        }
        return n;
      };

      /* ---------- price circle, barcode ---------- */
      const priceCircle = (cx, cy, R) => {
        if (!t.price) return false;
        g.save(); g.shadowColor = "rgba(0,0,0,.25)"; g.shadowBlur = 2.6 * u; g.shadowOffsetY = 0.8 * u; d.circle(cx, cy, R, pal.circle); g.restore();
        g.save(); g.strokeStyle = d.rgba(pal.circleFg, 0.45); g.lineWidth = Math.max(1.5, R * 0.016); g.beginPath(); g.arc(cx, cy, R * 0.87, 0, Math.PI * 2); g.stroke(); g.restore();
        const top = t.prefix || t.only, topS = R * 0.15, oldS = R * 0.17;
        const pOpt = { size: R * 0.5, min: R * 0.22, kind: "display", maxW: R * 1.5, lines: 1, lh: 1.04, align: "center", color: pal.circleFg };
        const pm = d.text(t.price, 0, 0, { ...pOpt, measure: true });
        const topM = top ? line(top, 0, 0, { size: topS, letter: 0.2, upper: true, weight: 800, maxW: R * 1.2, measure: true }) : { h: 0 };
        const oldH = t.old ? oldS * 1.2 : 0, gap = R * 0.03;
        const total = topM.h + pm.h + oldH + (top ? gap : 0) + (t.old ? gap : 0);
        let yy = cy - total / 2;
        if (top) { line(top, cx - R * 0.6, yy, { size: topS, letter: 0.2, upper: true, weight: 800, maxW: R * 1.2, align: "center", color: pal.circleFg }); yy += topM.h + gap; }
        d.text(t.price, cx - R * 0.75, yy, pOpt); yy += pm.h + gap;
        if (t.old) {
          const oc = d.rgba(pal.circleFg, 0.72);
          const om = d.text(t.old, cx - R * 0.6, yy, { size: oldS, kind: "body", weight: 600, maxW: R * 1.2, lines: 1, lh: 1.2, align: "center", color: oc });
          g.save(); g.strokeStyle = oc; g.lineWidth = Math.max(2, oldS * 0.09); g.beginPath(); g.moveTo(cx - om.w / 2 - 3, yy + oldS * 0.64); g.lineTo(cx + om.w / 2 + 3, yy + oldS * 0.64); g.stroke(); g.restore();
        }
        return true;
      };
      const barcode = (x, y, w, h) => {
        const R = d.rnd([...(t.brand || "greyrock")].reduce((a, ch) => a + ch.charCodeAt(0), 11));
        const dg = [9, 4, 1]; while (dg.length < 12) dg.push(Math.floor(R() * 10));
        dg.push((10 - (dg.reduce((a, v, i) => a + v * (i % 2 ? 3 : 1), 0) % 10)) % 10);
        const bits = `101${dg.slice(1, 7).map((v) => LCODE[v]).join("")}01010${dg.slice(7).map((v) => RCODE[v]).join("")}101`;
        g.save();
        g.fillStyle = "#FFFFFF"; g.fillRect(x, y, w, h);
        const padX = w * 0.1, padT = h * 0.1, numH = h * 0.2, mod = (w - padX * 2) / 95, barH = h - padT - numH - h * 0.06;
        g.fillStyle = INK;
        for (let i = 0; i < bits.length; i++) {
          if (bits[i] !== "1") continue;
          const guard = i < 3 || (i >= 45 && i < 50) || i >= 92;
          g.fillRect(x + padX + i * mod, y + padT, mod + 0.35, barH + (guard ? numH * 0.5 : 0));
        }
        g.font = d.font("body", numH * 0.82, 600); g.textBaseline = "alphabetic"; g.textAlign = "center";
        const by = y + h - h * 0.06;
        g.fillText(String(dg[0]), x + padX * 0.5, by);
        g.fillText(dg.slice(1, 7).join(""), x + padX + 24 * mod, by);
        g.fillText(dg.slice(7).join(""), x + padX + 71 * mod, by);
        g.restore();
        d.tag("mz-barcode"); d.mark(x, y, w, h); d.tag("");
      };

      /* ================= landscape: masthead across, product right, cover lines left ================= */
      if (k.landscape) {
        const X = k.side, CW = W - 2 * X, LW = W * 0.5 - X;
        const M = mastSpec(CW, 12 * u);
        const restS = 2.3 * u;
        let y = k.top;
        const restY = y; if (M && M.rest) y += restS * 1.3 + 0.5 * u;
        const mastY = y, mastH = M ? M.h : 9 * u;
        const ruleY = mastY + mastH + 1.6 * u, ruleH = Math.max(1.5, 0.25 * u);
        const issS = 2.4 * u, issY = ruleY + ruleH + 1.3 * u, issBot = issY + issS * 1.22;
        const colTop = issBot + 3.6 * u, colBot = H - k.bottom;
        const ctaS = 3.2 * u * Math.max(0.85, Math.min(1.15, d.scale || 1));
        const ctaM = t.cta ? d.cta(0, 0, { measure: true, size: ctaS, style: "block" }) : { w: 0, h: 0 };
        const items = coverList();
        let n = Math.min(3, items.length);
        const itemS = 2.4 * u, gapX = 3 * u;
        const itemW = (nn) => (LW - (nn - 1) * gapX) / nn;
        const rowItemsH = (nn) => (nn ? Math.max(...items.slice(0, nn).map((it) => coverItem(it, 0, 0, itemW(nn), itemS, false))) : 0);
        const gapY = 3 * u;
        let ih = rowItemsH(n);
        const headAvail = (nn, hh) => colBot - colTop - (ctaM.h ? ctaM.h + gapY : 0) - (nn ? hh + gapY : 0);
        let HB = fitHead(headAvail(n, ih), LW, { head: 7.4 * u, headLines: 3, sub: 2.8 * u });
        while (n > 0 && HB.h > headAvail(n, ih)) { n--; ih = rowItemsH(n); HB = fitHead(headAvail(n, ih), LW, { head: 7.4 * u, headLines: 3, sub: 2.8 * u }); }
        const group = HB.h + (n ? gapY + ih : 0) + (ctaM.h ? gapY + ctaM.h : 0);
        const gy = colTop + Math.max(0, (colBot - colTop - group) / 2);
        const bx0 = X + LW + 3 * u, bx1 = W - X * 0.3, by0 = mastY + mastH * (M ? 0.5 : 0.3), by1 = H - k.bottom * 0.35;

        if (cut) backdrop((bx0 + bx1) / 2, (by0 + by1) / 2, (bx1 - bx0) * 0.75);
        else photoBg(mastY + mastH + 14 * u, H * 0.35, W * 0.66);
        if (!cut) { const gr = g.createLinearGradient(0, 0, W * 0.62, 0); gr.addColorStop(0, d.rgba(pal.shade, 0.55 * ov)); gr.addColorStop(1, d.rgba(pal.shade, 0)); g.fillStyle = gr; g.fillRect(0, 0, W * 0.62, H); }
        if (M) { if (M.rest) restLine(M, X, restY, CW, restS); drawMast(M, X, mastY, CW); }
        else if (d.hasLogo) d.logo(X, mastY, CW, mastH, { align: "center", tint: pal.mast });
        g.fillStyle = d.rgba(pal.mast, 0.75); g.fillRect(X, ruleY, CW, ruleH);
        let pr = null;
        if (cut) pr = d.product(bx0, by0, bx1 - bx0, by1 - by0, { shadowColor: d.rgba(INK, 0.3) });
        const showLogo = d.hasLogo && !!mastText;
        // issue line, then the seller's logo right after it on the same row
        const iss = line(issueText, X, issY, { size: issS, letter: 0.2, upper: true, weight: 700, maxW: LW * (showLogo ? 0.62 : 1), color: pal.text2, shadow: pal.tsh });
        if (showLogo) { const lh = issS * 1.9; d.logo(X + iss.w + 3 * u, issY + (issS * 1.22 - lh) / 2, LW - iss.w - 3 * u, lh, { align: "left", plate: pal.plate, color: pal.text }); }
        HB.draw(al === "center" ? X : X, gy);
        let yy = gy + HB.h;
        if (n) { yy += gapY; const iw = itemW(n); items.slice(0, n).forEach((it, i) => coverItem(it, X + i * (iw + gapX), yy, iw, itemS, true)); yy += ih; }
        if (ctaM.h) d.cta(X, yy + gapY, { size: ctaS, style: "block", bg: pal.ctaBg, fg: pal.ctaFg, align: al, maxW: LW });
        const R = 11 * u;
        const bcW = 13 * u, bcH = 7.8 * u;
        barcode(W - X - bcW, H - k.bottom - bcH, bcW, bcH);
        let pcx = X + LW + R + 4 * u, pcy = H - k.bottom - R;
        if (pr) pcx = Math.max(pcx, Math.min(pr.x + R * 0.2, W - X - bcW - R - 3 * u));
        priceCircle(pcx, pcy, R);
        const Rs = 7.5 * u;
        d.sticker(W - X - Rs, issBot + Rs + 1.5 * u, Rs, { shape: "badge", fill: pal.stick, fg: pal.stickFg, rot: 0.14 });
        return;
      }

      /* ================= square / portrait / story ================= */
      const X = k.side, CW = W - 2 * X, TW = k.maxW;
      const S = k.story
        ? { mast: 15 * u, colW: 0.36 * W, head: 7.5 * u, headLines: 3, sub: 2.8 * u, block: 0.25 * H, R: 12 * u, Rs: 8 * u, item: 2.6 * u, items: 5, bc: [13 * u, 7.6 * u], cta: 3.3 * u }
        : k.square
          ? { mast: 11.5 * u, colW: 0.33 * W, head: 7.6 * u, headLines: 3, sub: 2.8 * u, block: 0.34 * H, R: 10.5 * u, Rs: 7.2 * u, item: 2.5 * u, items: 3, bc: [12 * u, 7 * u], cta: 3.1 * u }
          : { mast: 14 * u, colW: 0.33 * W, head: 8.6 * u, headLines: 3, sub: 3 * u, block: 0.33 * H, R: 11.5 * u, Rs: 8 * u, item: 2.6 * u, items: 4, bc: [12.5 * u, 7.4 * u], cta: 3.2 * u };
      const M = mastSpec(CW, S.mast);
      const restS = 2.1 * u * FX;
      let y = k.top;
      const restY = y; if (M && M.rest) y += restS * 1.3 + 0.6 * u;
      const mastY = y, mastH = M ? M.h : S.mast * 0.8;
      const ruleY = mastY + mastH + 1.7 * u, ruleH = Math.max(1.5, 0.2 * u);
      const issS = 2.1 * u * FX, issY = ruleY + ruleH + 1.2 * u, issBot = issY + issS * 1.22;
      const ctaS = S.cta * FX;
      const ctaM = t.cta ? d.cta(0, 0, { measure: true, size: ctaS, style: "block" }) : { w: 0, h: 0 };
      const bcW = S.bc[0] * (k.story ? 1.15 : 1), bcH = S.bc[1] * (k.story ? 1.15 : 1);
      // story: the Reels UI covers the bottom 20%; sit the CTA row just above it instead of the engine's roomier 25%
      const botM = k.story ? H * 0.2 + 3 * u : k.bottom;
      const rowH = Math.max(ctaM.h, bcH), rowY = H - botM - rowH, rowGap = 2.8 * u;
      const HB = fitHead(S.block - rowH - rowGap, TW, S);
      const blockTop = rowY - rowGap - HB.h;
      const items = coverList();
      const showLogo = d.hasLogo && !!mastText;
      const hasCol = items.length > 0 || showLogo;
      const colW = S.colW;
      const bx0 = hasCol ? X + colW + 2 * u : X + CW * 0.12, bx1 = hasCol ? W - X * 0.35 : X + CW * 0.88;
      // with a price circle or sticker, the product leans left so they sit beside it, not over its label
      const leanL = !!(t.price || t.stickerText);
      // the product starts inside the masthead so it overlaps the lower part of the letters (the cover trick)
      const by0 = mastY + mastH * (M ? (M.rest ? 0.3 : 0.28) : 0.3), by1 = blockTop - 2.4 * u;

      if (cut) backdrop((bx0 + bx1) / 2, by0 + (by1 - by0) * 0.55, Math.max(bx1 - bx0, by1 - by0) * 0.7);
      else photoBg(mastY + mastH + 16 * u, blockTop - 22 * u, hasCol ? W * 0.62 : 0);
      if (M) { if (M.rest) restLine(M, X, restY, CW, restS); drawMast(M, X, mastY, CW); }
      else if (d.hasLogo) d.logo(X, mastY, CW, mastH, { align: "center", tint: pal.mast });
      g.fillStyle = d.rgba(pal.mast, 0.75); g.fillRect(X, ruleY, CW, ruleH);
      let pr = null;
      if (cut) {
        // size the cut-out so its top always reaches into the masthead; a wide product may spill toward the price circle
        const img = d.source(0, true), ar = Math.max(0.2, Math.min(5, img.width / Math.max(1, img.height)));
        const bh = by1 - by0, ph = Math.min(bh, (bx1 - bx0) / ar), pw = ph * ar;
        const px = leanL ? bx0 + (hasCol ? 0 : (bx1 - bx0 - pw) * 0.2) : (bx0 + bx1 - pw) / 2;
        pr = d.product(px, by0, pw, ph, { shadowColor: d.rgba(INK, 0.3) });
      }

      line(issueText, X, issY, { size: issS, letter: 0.22, upper: true, weight: 700, maxW: cut && hasCol ? colW : CW * 0.62, color: pal.text2, shadow: pal.tsh });
      let cy = issBot + 3.6 * u;
      if (showLogo) { const lg = d.logo(X, cy, colW * 0.8, 5.4 * u * FX, { align: "left", plate: pal.plate, color: pal.text }); cy += lg.h + 3.2 * u; }
      const nCol = column(items, X, cy, colW, blockTop - 3.4 * u - cy, S.item * FX, S.items);

      HB.draw(al === "center" ? (W - TW) / 2 : X, blockTop);
      if (t.cta) d.cta(al === "center" ? (W - TW) / 2 : X, rowY + rowH - ctaM.h, { size: ctaS, style: "block", bg: pal.ctaBg, fg: pal.ctaFg, align: al, maxW: TW });
      const bxR = al === "center" ? (W + TW) / 2 : X + TW;
      if (al !== "center" || (TW - ctaM.w) / 2 > bcW + 2 * u) barcode(bxR - bcW, rowY + rowH - bcH, bcW, bcH);

      /* price circle beside the product's base (not over its label), sticker top right; keep them apart */
      let R = S.R * Math.min(1.12, FX), Rs = S.Rs * Math.min(1.12, FX);
      const gapC = 1.6 * u;
      if (t.stickerText && t.price) {
        // both must stack down the right edge: shrink them a little when the product area is short (long copy)
        const avail = blockTop - 2.2 * u - (ruleY + ruleH + 1.4 * u), need = 2 * (R + Rs) + gapC;
        if (avail < need) { const f = Math.max(0.8, avail / need); R *= f; Rs *= f; }
      }
      const reelsX = W * 0.88 - 1.5 * u;                       // story: right edge of the safe area below 45% height
      const maxX = (cy0, r) => (k.story && cy0 + r > H * 0.45 ? reelsX - r : X + CW - r);
      const colR = nCol || showLogo ? X + colW + 1.5 * u : X;   // keep circles clear of the cover-line column
      const yMax = blockTop - 2.2 * u;
      let pcy = yMax - R, pcx = maxX(pcy, R);
      if (pr) {
        pcy = Math.min(pr.y + pr.h - R * 0.7, yMax - R);
        pcx = Math.min(pr.x + pr.w + R * (pr.cutout ? 0.32 : -0.1), maxX(pcy, R));
      }
      pcx = Math.max(pcx, colR + R);
      // the issue line only runs on the left, so the sticker can tuck right under the masthead rule
      let scy = ruleY + ruleH + 1.4 * u + Rs, scx = X + CW - Rs;
      if (t.stickerText && t.price) {
        const need = R + Rs + gapC;
        let dy = pcy - scy;
        if (dy < need) {
          // first lower the circle (down to the headline), then slide the sticker sideways
          pcy = Math.min(yMax - R, scy + need); pcx = Math.max(colR + R, Math.min(pcx, maxX(pcy, R))); dy = pcy - scy;
        }
        if (dy < need) {
          // slide the sticker left until it clears the circle; if there is no room, shrink the circle and lower it
          const dx = Math.sqrt(Math.max(0, need * need - dy * dy));
          const want = pcx - dx;
          if (want - Rs >= colR) scx = Math.min(scx, want);
          else {
            R = Math.max(R * 0.78, Math.min(R, (yMax - scy - Rs - gapC) / 2));
            pcy = Math.max(pcy, Math.min(yMax - R, scy + Rs + gapC + R)); pcx = Math.max(colR + R, Math.min(pcx, maxX(pcy, R)));
            dy = pcy - scy;
            if (dy < R + Rs + gapC) scx = Math.max(colR + Rs, pcx - Math.sqrt(Math.max(0, (R + Rs + gapC) ** 2 - dy * dy)));
          }
        }
      }
      priceCircle(pcx, pcy, R);
      d.sticker(scx, scy, Rs, { shape: "badge", fill: pal.stick, fg: pal.stickFg, rot: 0.14 });
    },
  });
})();
