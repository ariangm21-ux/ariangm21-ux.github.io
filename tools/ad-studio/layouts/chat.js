/* Inbox chat: Bangladeshi buyers order through the inbox, so the ad IS the inbox.
   An original, neutral chat screen (not Messenger / WhatsApp): a header with the seller's avatar, name and
   "Active now"; the buyer asks the price; the seller replies with the product photo, the price and the first
   delivery promise; the buyer orders (double read ticks); the CTA is the message box with a send button.
   The seller's headline sits above the chat on a brand-tinted background.
   Square / portrait: headline over a chat window. Story: the chat fills the safe area and runs off the bottom
   as a phone screen with a keyboard. Landscape: headline on the left, chat window on the right. */
GRS.register({
  id: "chat", name: "Inbox chat", group: "trust", photos: 1, cutout: "no",
  desc: "Buyer asks the price, you reply, they order",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const bn = t.lang === "bn", TS = d.scale || 1;
    const TX = {
      active: bn ? "এখন অ্যাক্টিভ" : "Active now",
      ask: bn ? "দাম কত?" : "Price?",
      order: bn ? "অর্ডার করতে চাই!" : "Ordering now!",
      today: bn ? "আজ, রাত ৯:৪১" : "Today, 9:41 PM",
      sent: bn ? "৯:৪২" : "9:42",
      hint: bn ? "মেসেজ লিখুন…" : "Message…",
      shop: bn ? "অনলাইন শপ" : "Online shop",
      kicker: bn ? "ইনবক্সেই অর্ডার" : "Order right in the inbox",
    };
    let headerRating = false;           // the rating moves into the chat header when the ad message has no room for it

    /* ---------- colour ---------- */
    const P = c.primary, HSL = d.toHsl(P), grey = HSL[1] < 0.12;
    const darkBg = c.onPrimary === "#FFFFFF", FG = c.onPrimary, INK = c.ink, SURF = "#FFFFFF";
    // the brand colour as it reads on white (light brand colours get a deeper shade; yellows lean amber, not olive)
    const deeper = grey ? d.fromHsl(0, 0, 0.26) : d.fromHsl(HSL[0] > 40 && HSL[0] < 80 ? HSL[0] - 14 : HSL[0], Math.max(HSL[1], 0.6), 0.36);
    const STRONG = d.contrast(P, SURF) >= 3 ? P : deeper;
    const lightP = d.lum(P) > 0.5;
    const CHATBG = lightP || grey ? "#F1F2F4" : d.mix(P, "#F2F3F5", 0.93);
    const OUT = d.contrast(P, CHATBG) >= 1.3 || HSL[1] >= 0.5 ? P : STRONG;      // the buyer's bubbles = the chat theme colour
    const onOUT = d.onColor(OUT);
    const OUTEDGE = d.contrast(OUT, CHATBG) < 1.5 ? d.mix(OUT, "#000000", 0.22) : "";
    const SEND = d.contrast(OUT, SURF) >= 1.6 ? OUT : STRONG, onSEND = d.onColor(SEND);
    const MUTED = d.rgba(INK, 0.56), HAIR = d.rgba(INK, 0.08);
    const ONLINE = "#22B35A", OKC = c.green, RED = c.red;
    const BG1 = d.mix(P, "#FFFFFF", darkBg ? (grey ? 0.12 : 0.1) : 0.24), BG2 = d.mix(P, "#000000", darkBg ? 0.34 : 0.1);
    const STK = grey ? c.gold : c.accent, onSTK = d.onColor(STK);
    const HI = darkBg ? (grey ? c.gold : c.sale) : (d.contrast(P, INK) >= 4 ? P : SURF);
    const HIBG = darkBg ? undefined : INK;
    const SHADOW = darkBg ? "rgba(0,0,0,.42)" : d.rgba(d.mix(P, "#000000", 0.62), 0.32);
    const STARC = darkBg ? "#FFC83D" : INK;

    /* ---------- sizes (in u) per format ---------- */
    const SZ = {
      square:    { head: 7.2, headMin: 5, headLines: 2, sub: 2.8, proof: 2.5, msgGap: 1.6, msgMax: 0.25, cardGap: 3.4, radius: 3.6, side: 2.6, header: 9, av: 5.4, name: 2.75, active: 2.1, txt: 3, price: 5.8, badge: 2.35, nb: 2, input: 9.4, cta: 3.1, gap: 1.3, pad: 2, inset: 0.9, avS: 3.8, minPhoto: 31, fMin: 0.94, mode: "h" },
      portrait:  { head: 7.6, headMin: 5, headLines: 3, sub: 3, proof: 2.6, msgGap: 1.8, msgMax: 0.3, cardGap: 4, radius: 3.8, side: 2.8, header: 9.8, av: 6, name: 2.95, active: 2.2, txt: 3.2, price: 6.4, badge: 2.45, nb: 3, input: 10, cta: 3.3, gap: 1.5, pad: 2.4, inset: 1, avS: 4.2, minPhoto: 34, fMin: 0.9, mode: "h" },
      story:     { head: 9.4, headMin: 6.6, headLines: 3, sub: 3.4, proof: 3, msgGap: 1.7, msgMax: 0.27, cardGap: 3.4, radius: 4.8, side: 3.2, header: 10.8, av: 6.8, name: 3.5, active: 2.6, txt: 3.75, price: 7.8, badge: 2.85, nb: 2, input: 11.4, cta: 3.8, gap: 1.6, pad: 2.3, inset: 1.2, avS: 4.8, minPhoto: 36, fMin: 0.9, mode: "v" },
      landscape: { head: 10.6, headMin: 6.2, headLines: 4, sub: 3.4, proof: 3, msgGap: 2.4, msgMax: 1, cardGap: 0, radius: 3.8, side: 2.9, header: 9.6, av: 5.8, name: 3, active: 2.3, txt: 3.3, price: 6.2, badge: 2.55, nb: 2, input: 9.8, cta: 3.3, gap: 1.4, pad: 2.1, inset: 1, avS: 4, minPhoto: 30, fMin: 0.88, mode: "h" },
    }[k.size];
    SZ.kick = k.landscape ? 2.9 : k.story ? 3 : 2.4;

    /* ---------- drawn bits ---------- */
    // rounded rect with its own radius per corner [tl, tr, br, bl]
    function rr4(x, y, w, h, r) {
      const m = Math.min(w, h) / 2, [a, b, e, f] = r.map((v) => Math.max(0, Math.min(v, m)));
      g.beginPath(); g.moveTo(x + a, y);
      g.arcTo(x + w, y, x + w, y + h, b); g.arcTo(x + w, y + h, x, y + h, e);
      g.arcTo(x, y + h, x, y, f); g.arcTo(x, y, x + w, y, a); g.closePath();
    }
    function check(x, y, s, color, lw) {
      g.beginPath(); g.moveTo(x + s * 0.1, y + s * 0.54); g.lineTo(x + s * 0.38, y + s * 0.8); g.lineTo(x + s * 0.92, y + s * 0.22);
      g.strokeStyle = color; g.lineWidth = lw || s * 0.16; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
    }
    // double read ticks, width = 1.4 s
    function readTicks(x, y, s, color) {
      g.save();
      check(x, y, s, color, s * 0.15);
      g.beginPath(); g.moveTo(x + s * 0.62, y + s * 0.74); g.lineTo(x + s * 1.32, y + s * 0.22);
      g.strokeStyle = color; g.lineWidth = s * 0.15; g.lineCap = "round"; g.stroke();
      g.restore();
    }
    function okDot(cx, cy, r) { d.circle(cx, cy, r, OKC); g.save(); check(cx - r * 0.56, cy - r * 0.56, r * 1.12, "#FFFFFF", r * 0.28); g.restore(); }
    function clock(cx, cy, r, color) {
      g.save(); g.strokeStyle = color; g.lineWidth = r * 0.2; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.arc(cx, cy, r * 0.86, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(cx, cy - r * 0.48); g.lineTo(cx, cy); g.lineTo(cx + r * 0.36, cy + r * 0.22); g.stroke();
      g.restore();
    }
    function chevron(cx, cy, s, color) {
      g.save(); g.strokeStyle = color; g.lineWidth = s * 0.2; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(cx + s * 0.22, cy - s * 0.48); g.lineTo(cx - s * 0.26, cy); g.lineTo(cx + s * 0.22, cy + s * 0.48); g.stroke(); g.restore();
    }
    // handset, own path in a 24 box (centre 13,11)
    const PHONE = "M7 3h3l1.5 4.5-2.2 1.6c1.2 2.5 3.1 4.4 5.6 5.6l1.6-2.2 4.5 1.5v3c0 1.1-.9 2-2 2C10.6 19 5 13.4 5 5c0-1.1.9-2 2-2z";
    function phone(cx, cy, s, color) { g.save(); const sc = s / 18; g.translate(cx - 13 * sc, cy - 11 * sc); g.scale(sc, sc); g.fillStyle = color; g.fill(new Path2D(PHONE)); g.restore(); }
    function info(cx, cy, s, color) {
      g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = s * 0.11;
      g.beginPath(); g.arc(cx, cy, s * 0.45, 0, Math.PI * 2); g.stroke();
      d.circle(cx, cy - s * 0.2, s * 0.065); g.fill();
      g.lineCap = "round"; g.lineWidth = s * 0.12; g.beginPath(); g.moveTo(cx, cy - s * 0.03); g.lineTo(cx, cy + s * 0.24); g.stroke();
      g.restore();
    }
    // paper plane (own shape), centred
    function plane(cx, cy, s, color) {
      g.save(); g.translate(cx, cy); g.rotate(-0.42);
      g.beginPath(); g.moveTo(-s * 0.5, -s * 0.42); g.lineTo(s * 0.55, 0); g.lineTo(-s * 0.5, s * 0.42); g.lineTo(-s * 0.3, 0); g.closePath();
      g.fillStyle = color; g.fill(); g.restore();
    }
    function heart(cx, cy, s, color) { // s = width
      g.save(); g.translate(cx, cy + s * 0.04); g.scale(s / 22, s / 22);
      g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-13, -1, -7, -12, 0, -5); g.bezierCurveTo(7, -12, 13, -1, 0, 8); g.closePath();
      g.fillStyle = color; g.fill(); g.restore();
    }
    // a reaction badge hanging off a bubble's corner
    function reaction(cx, cy, r) {
      g.save(); g.shadowColor = "rgba(20,17,13,.18)"; g.shadowBlur = r * 0.5; g.shadowOffsetY = r * 0.12;
      d.circle(cx, cy, r, SURF); g.restore();
      heart(cx, cy, r * 1.15, "#F0384F");
    }
    function plus(cx, cy, s, color) {
      g.save(); g.strokeStyle = color; g.lineWidth = s * 0.16; g.lineCap = "round";
      g.beginPath(); g.moveTo(cx - s * 0.36, cy); g.lineTo(cx + s * 0.36, cy); g.moveTo(cx, cy - s * 0.36); g.lineTo(cx, cy + s * 0.36); g.stroke(); g.restore();
    }
    function store(cx, cy, s, color) { // tiny storefront for an avatar with no brand name
      g.save(); g.fillStyle = color;
      d.rr(cx - s * 0.42, cy - s * 0.05, s * 0.84, s * 0.48, s * 0.06); g.fill();
      g.beginPath(); g.moveTo(cx - s * 0.5, cy - s * 0.1); g.lineTo(cx - s * 0.38, cy - s * 0.42); g.lineTo(cx + s * 0.38, cy - s * 0.42); g.lineTo(cx + s * 0.5, cy - s * 0.1); g.closePath(); g.fill();
      g.restore();
    }

    /* ---------- the seller's identity: logo shape decides where it goes ---------- */
    let logoAR = 0;
    if (d.hasLogo) {
      const M = d.getMarks(), n = M.length;
      g.save(); g.globalAlpha = 0; const m = d.logo(0, 0, 400, 100, {}); g.restore();
      M.length = n;                       // measuring only: forget the box it marked
      logoAR = m.h ? m.w / m.h : 1;
    }
    const TXT = (window.GRS && GRS.TEXT) || {};
    const placeholderBrand = !t.brand || t.brand === (TXT.en && TXT.en.brand) || t.brand === (TXT.bn && TXT.bn.brand);
    // a wide wordmark is the name in the header (a round avatar would shrink it to nothing); a square-ish logo is the avatar
    const logoAsName = d.hasLogo && logoAR > 1.7, logoAvatar = d.hasLogo && !logoAsName;
    const whiteLogo = d.st.logoStyle === "white";
    const initial = (() => { const m = placeholderBrand ? null : /[\p{L}\p{N}]/u.exec(t.brand); return m ? m[0].toUpperCase() : ""; })();
    function avatar(cx, cy, r, online) {
      g.save();
      if (logoAvatar) {
        d.circle(cx, cy, r, whiteLogo ? STRONG : SURF);
        g.strokeStyle = d.rgba(INK, 0.12); g.lineWidth = Math.max(1, r * 0.06); g.stroke();
        g.save(); d.circle(cx, cy, r * 0.97); g.clip();
        const bw = r * 1.44, lh = Math.min(r * 1.44, bw / (logoAR || 1));
        d.logo(cx - bw / 2, cy - lh / 2, bw, lh, { align: "center" });
        g.restore();
      } else {
        const gr = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        gr.addColorStop(0, d.mix(STRONG, "#FFFFFF", 0.12)); gr.addColorStop(1, d.mix(STRONG, "#000000", 0.22));
        d.circle(cx, cy, r); g.fillStyle = gr; g.fill();
        const on = d.onColor(STRONG);
        if (initial) {
          g.font = d.font("display", r * 1.04); g.fillStyle = on; g.textAlign = "center"; g.textBaseline = "middle";
          g.fillText(initial, cx, cy + r * 0.06);
          d.tag("avatar"); d.mark(cx - r * 0.5, cy - r * 0.5, r, r); d.tag("");
        } else store(cx, cy + r * 0.04, r * 1.05, on);
      }
      if (online) { d.circle(cx + r * 0.7, cy + r * 0.7, r * 0.3, SURF); d.circle(cx + r * 0.7, cy + r * 0.7, r * 0.2, ONLINE); }
      g.restore();
    }

    /* ---------- the product photo inside the seller's message ---------- */
    function photoBox(x, y, w, h, r) {
      const clip = () => d.rr(x, y, w, h, r);
      if (d.hasCutout(0)) {
        g.save(); clip(); g.clip();
        const gr = g.createLinearGradient(x, y, x + w * 0.4, y + h);
        gr.addColorStop(0, d.mix(P, "#FFFFFF", 0.88)); gr.addColorStop(1, d.mix(P, "#FFFFFF", 0.64));
        g.fillStyle = gr; g.fillRect(x, y, w, h);
        d.circle(x + w * 0.5, y + h * 0.47, Math.min(w, h) * 0.4, "rgba(255,255,255,.5)");
        const fl = g.createLinearGradient(0, y + h * 0.7, 0, y + h);
        fl.addColorStop(0, d.rgba(d.mix(P, "#000000", 0.5), 0)); fl.addColorStop(1, d.rgba(d.mix(P, "#000000", 0.5), 0.12));
        g.fillStyle = fl; g.fillRect(x, y + h * 0.7, w, h * 0.3);
        d.product(x + w * 0.1, y + h * 0.07, w * 0.8, h * 0.84, { shadowColor: "rgba(0,0,0,.24)" });
        g.restore();
      } else d.photo(x, y, w, h, { clip });
    }
    function stickerOn(px, py, pw, ph) {
      const R = Math.max(4.6 * u, Math.min(8 * u, Math.min(pw, ph) * 0.21));
      d.sticker(px + R * 0.42, py + R * 0.4, R, { shape: "badge", fill: STK, fg: onSTK, rot: -0.18 });
    }

    /* one line that fits maxW: shrink to min, then cut at a word (or a letter) and end with "…". Returns { text, size, w } */
    const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    function oneLine(str, maxW, size, min, kind, weight) {
      str = String(str || "");
      for (let s = Math.round(size); s >= Math.round(min); s -= 1) {
        g.font = d.font(kind, s, weight); const w = g.measureText(str).width;
        if (w <= maxW) return { text: str, size: s, w };
      }
      const s = Math.max(1, Math.round(min)); g.font = d.font(kind, s, weight);
      const fits = (x) => g.measureText(`${x}…`).width <= maxW;
      const words = str.split(/\s+/);
      while (words.length > 1 && !fits(words.join(" "))) words.pop();
      let out = words.join(" ");
      if (!fits(out)) {
        const gs = seg ? Array.from(seg.segment(out), (p) => p.segment) : Array.from(out);
        while (gs.length > 1 && !fits(gs.join(""))) gs.pop();
        out = gs.join("");
      }
      out = `${out.replace(/[\s,.;:!?।\-–]+$/, "")}…`;
      return { text: out, size: s, w: g.measureText(out).width };
    }

    /* ---------- chat pieces: each returns { w, h, draw(x, y) } ---------- */
    const Zs = (f) => (v) => v * u * f;
    const Ts = (f) => (v) => v * u * f * TS;

    function bubbleShape(x, y, w, h, side, s) {
      const R = Math.min(h / 2, s * 1.15), Rs = s * 0.28;
      g.save();
      if (side === "in") { g.shadowColor = "rgba(20,17,13,.10)"; g.shadowBlur = s * 0.5; g.shadowOffsetY = s * 0.1; }
      rr4(x, y, w, h, side === "out" ? [R, R, Rs, R] : [R, R, R, Rs]);
      g.fillStyle = side === "out" ? OUT : SURF; g.fill();
      g.restore();
      if (side === "out" && OUTEDGE) { rr4(x, y, w, h, [R, R, Rs, R]); g.strokeStyle = OUTEDGE; g.lineWidth = Math.max(1.5, s * 0.06); g.stroke(); }
    }
    function bubble(str, side, maxW, f, meta) {
      const T = Ts(f), s = T(SZ.txt), padX = s * 0.82, padY = s * 0.5, ms = s * 0.62, tk = ms * 1.25;
      let mw = 0;
      if (meta) { g.font = d.font("body", ms, 600); mw = g.measureText(TX.sent).width + ms * 0.4 + tk * 1.4; }
      const inner = maxW - padX * 2;
      const m = d.text(str, 0, 0, { measure: true, size: s, min: s * 0.82, kind: "body", weight: 600, maxW: inner, lines: 2, lh: 1.24 });
      const inline = meta && m.lines.length === 1 && m.w + s * 0.6 + mw <= inner;
      const w = padX * 2 + (meta ? (inline ? m.w + s * 0.6 + mw : Math.max(m.w, mw)) : m.w);
      const h = padY * 2 + m.h + (meta && !inline ? ms * 1.4 : 0);
      const rr = s * 0.62;
      return { w, h, after: meta ? rr * 0.75 : 0, draw(x, y) {
        bubbleShape(x, y, w, h, side, s);
        const fg = side === "out" ? onOUT : INK;
        d.text(str, x + padX, y + padY, { size: m.size, min: m.size, kind: "body", weight: 600, color: fg, maxW: inner, lines: 2, lh: 1.24 });
        if (meta) {
          const mx = x + w - padX - mw, my = inline ? y + padY + m.h - ms * 1.32 : y + padY + m.h + ms * 0.1;
          const col = d.rgba(fg, 0.78);
          const tw = mw - ms * 0.4 - tk * 1.4;
          d.text(TX.sent, mx, my, { size: ms, min: ms, kind: "body", weight: 600, color: col, maxW: tw + 2, lines: 1 });
          readTicks(mx + tw + ms * 0.4, my + ms * 0.56 - tk * 0.5, tk, d.rgba(fg, 0.95));
          reaction(x + rr * 0.55, y + h + rr * 0.2, rr);      // the seller hearted the order
        }
      } };
    }
    function typing(f) {
      const s = Ts(f)(SZ.txt), h = s * 2.24, w = s * 3.6;
      return { w, h, draw(x, y) {
        bubbleShape(x, y, w, h, "in", s);
        [0.32, 0.55, 0.85].forEach((a, i) => d.circle(x + w / 2 + (i - 1) * s * 0.78, y + h / 2, s * 0.21, d.rgba(INK, a)));
      } };
    }
    function pill(kind, maxW, f) {
      const s = Ts(f)(SZ.active) * 0.98, ends = kind === "ends";
      const txt = ends ? t.endsText : TX.today, ic = ends ? s * 1.15 : 0, icG = ends ? s * 0.45 : 0;
      const m = oneLine(txt, maxW - s * 2.4 - ic - icG, s, s * 0.85, "body", ends ? 700 : 600);
      const w = m.w + ic + icG + s * 2.2, h = s * 2;
      return { w, h, draw(x, y) {
        g.fillStyle = ends ? d.rgba(RED, 0.1) : d.rgba(INK, 0.06); d.rr(x, y, w, h, h / 2); g.fill();
        const col = ends ? RED : MUTED;
        if (ends) clock(x + s * 1.1 + ic / 2, y + h / 2, ic / 2, col);
        d.text(m.text, x + s * 1.1 + ic + icG, y + (h - m.size * 1.12) / 2, { size: m.size, min: m.size, kind: "body", weight: ends ? 700 : 600, color: col, maxW: m.w + 4, lines: 1 });
      } };
    }
    // tick-led delivery promises
    function badgeLines(list, colW, bs) {
      const ic = bs * 1.3, icG = bs * 0.55, tw = colW - ic - icG, gap = bs * 0.5;
      const ms = list.map((b) => d.text(b, 0, 0, { measure: true, size: bs, min: bs * 0.88, kind: "body", weight: 600, maxW: tw, lines: 3, lh: 1.22 }));
      const rowH = ms.map((m) => Math.max(m.h, ic));
      const h = rowH.reduce((a, v) => a + v, 0) + gap * Math.max(0, ms.length - 1);
      return { h, draw(x, y) {
        let yy = y;
        list.forEach((b, i) => {
          const m = ms[i], lh = rowH[i], first = Math.min(lh, m.size * 1.22);
          okDot(x + ic / 2, yy + (m.lines.length > 1 ? first / 2 : lh / 2), ic / 2);
          d.text(b, x + ic + icG, yy + (lh - m.h) / 2, { size: m.size, min: m.size, kind: "body", weight: 600, color: INK, maxW: tw, lines: 3, lh: 1.22 });
          yy += lh + gap;
        });
      } };
    }
    // a lone price reads like a real reply with "Only" in front of it ("মাত্র ৳১,৪৯৯")
    const PRE = t.prefix || (!t.old && !t.badges.length ? t.only : "");
    const PRICE = (ps, stacked, measure) => ({ size: ps, stacked, measure, prefix: PRE, color: STRONG, oldColor: d.rgba(INK, 0.45), prefixColor: d.rgba(INK, 0.62) });
    // seller reply, photo beside the price (square, portrait, landscape)
    function sellerH(maxW, maxH, f, nb) {
      const Z = Zs(f), T = Ts(f), s = T(SZ.txt);
      const ins = Z(SZ.inset), R = Z(3.2), padR = Z(2.4), cg = Z(2.2), padY = Z(2);
      const ps = T(SZ.price), bs = T(SZ.badge);
      const pm = t.price ? d.price(0, 0, PRICE(ps, true, true)) : { w: 0, h: 0 };
      const list = t.badges.slice(0, nb);
      g.font = d.font("body", bs, 600);
      const bNeed = list.length ? bs * 1.85 + Math.max(...list.map((b) => g.measureText(b).width)) + 2 : 0;
      const hasCol = !!(pm.h || list.length);          // no price and no badges: a plain photo message
      const colW = hasCol ? Math.min(maxW * 0.46, Math.max(pm.w + 2, bNeed, Z(17))) : 0;
      const bl = list.length ? badgeLines(list, colW, bs) : null;
      const colH = pm.h + (bl ? (pm.h ? Z(1.8) : 0) + bl.h : 0);
      let pw = hasCol ? maxW - ins - cg - colW - padR : Math.min(maxW - 2 * ins, maxW * 0.66), ph = pw / 0.9;
      const phMax = maxH - 2 * ins;
      if (ph > phMax) { ph = phMax; pw = ph * 0.9; }
      const h = Math.max(ph + 2 * ins, hasCol ? colH + 2 * padY : 0), w = hasCol ? ins + pw + cg + colW + padR : pw + 2 * ins;
      const ok = pw > 0 && pm.w <= colW + 2 && h <= maxH + 0.5;
      return { w, h, photo: Math.min(pw, ph), ok, draw(x, y) {
        bubbleShape(x, y, w, h, "in", s);
        const py = y + (h - ph) / 2;
        photoBox(x + ins, py, pw, ph, R - ins * 0.5);
        const tx = x + ins + pw + cg; let ty = y + (h - colH) / 2;
        if (pm.h) { d.price(tx, ty, PRICE(ps, true)); ty += pm.h + Z(1.8); }
        if (bl) bl.draw(tx, ty);
        stickerOn(x + ins, py, pw, ph);
      } };
    }
    // seller reply, photo on top (story)
    function sellerV(maxW, maxH, f, nb) {
      const Z = Zs(f), T = Ts(f), s = T(SZ.txt);
      const ins = Z(SZ.inset), R = Z(3.6), padX = Z(2.6), padY = Z(2.2);
      const ps = T(SZ.price), bs = T(SZ.badge), list = t.badges.slice(0, nb);
      // the text under the photo, measured for a bubble of width ww
      const textAt = (ww) => {
        const tw = ww - 2 * padX;
        let stacked = false, pm = t.price ? d.price(0, 0, PRICE(ps, false, true)) : { w: 0, h: 0 };
        if (pm.w > tw) { stacked = true; pm = d.price(0, 0, PRICE(ps, true, true)); }
        const bl = list.length ? badgeLines(list, tw, bs) : null;
        return { tw, stacked, pm, bl, h: pm.h + (bl ? (pm.h ? Z(1.8) : 0) + bl.h : 0) };
      };
      // a photo message is about 1.4 : 1, never a thin panorama: the photo's height sets the bubble width
      const wide = textAt(maxW), below0 = wide.h ? padY * 2 + wide.h : ins;
      let ph = Math.min(maxH - ins - below0, (maxW - 2 * ins) * 0.92);
      g.font = d.font("body", bs, 600);
      const need = Math.max(wide.pm.w, list.length ? bs * 1.85 + Math.max(...list.map((b) => g.measureText(b).width)) + 2 : 0) + 2 * padX;
      const w = Math.min(maxW, Math.max(need, ph * 1.42 + 2 * ins));
      const T2 = textAt(w), below = T2.h ? padY * 2 + T2.h : ins;
      ph = Math.min(ph, maxH - ins - below);
      const { tw, stacked, pm, bl } = T2;
      const pw = w - 2 * ins, h = ins + ph + below;
      const ok = ph > 0 && pm.w <= tw + 2;
      return { w, h, photo: ph, ok, draw(x, y) {
        bubbleShape(x, y, w, h, "in", s);
        photoBox(x + ins, y + ins, pw, ph, R - ins * 0.5);
        let ty = y + ins + ph + padY;
        if (pm.h) { d.price(x + padX, ty, PRICE(ps, stacked)); ty += pm.h + Z(1.8); }
        if (bl) bl.draw(x + padX, ty);
        stickerOn(x + ins, y + ins, pw, ph);
      } };
    }

    /* ---------- the message box = CTA ---------- */
    /* the CTA is typed into the message box; a long one wraps to a second line and the box grows, like a real one */
    function ctaLayout(f, c0, c1) {
      const Z = Zs(f), T = Ts(f), cs = T(SZ.cta), base = Math.max(cs * 2.15, Z(5.6));
      const pr = base * 0.4, sr = base * 0.52, fx0 = c0 + 2 * pr + Z(1.6), fw = c1 - 2 * sr - Z(2) - fx0;
      const maxT = fw - base * 0.9 - Z(1.2), label = t.cta || TX.hint, wt = t.cta ? 700 : 500;
      let lines = null, size = cs;
      for (let s = Math.round(cs); s >= Math.round(cs * 0.86); s -= 1) { g.font = d.font("body", s, wt); if (g.measureText(label).width <= maxT) { lines = [label]; size = s; break; } }
      if (!lines) {
        for (let s = Math.round(cs); s >= Math.round(cs * 0.8); s -= 1) {
          g.font = d.font("body", s, wt); const wr = d.wrap(label, maxT);
          if (wr.length <= 2 && wr.every((l) => g.measureText(l).width <= maxT)) { lines = wr; size = s; break; }
        }
      }
      if (!lines) { // absurdly long: two lines, the second ends with "…"
        size = Math.round(cs * 0.8); g.font = d.font("body", size, wt);
        const wr = d.wrap(label, maxT), l2 = oneLine(wr.slice(1).join(" "), maxT, size, size, "body", wt);
        lines = [oneLine(wr[0], maxT, size, size, "body", wt).text, l2.text];
      }
      const lh = size * 1.26, fh = lines.length > 1 ? lh * lines.length + base * 0.5 : base;
      g.font = d.font("body", size, wt);
      return { lines, size, lh, wt, base, pr, sr, fh, h: Math.max(Z(SZ.input), fh + Z(2.6)), lastW: g.measureText(lines[lines.length - 1]).width };
    }
    function inputBar(x, y, w, h, f, c0, c1, L) {
      const Z = Zs(f);
      g.fillStyle = HAIR; g.fillRect(x, y, w, Math.max(1, Z(0.12)));
      const cy = y + h / 2, fh = L.fh, fy = cy - fh / 2, by = fy + fh - L.base / 2;   // buttons sit level with the last line
      const pr = L.pr, pcx = x + c0 + pr;
      d.circle(pcx, by, pr, d.rgba(STRONG, 0.12)); plus(pcx, by, pr * 1.1, STRONG);
      const sr = L.sr, scx = x + c1 - sr;
      g.save(); g.fillStyle = d.rgba(SEND, 0.18); d.circle(scx, by, sr + Z(0.8)); g.fill(); g.restore();
      g.save(); g.shadowColor = d.rgba(SEND, 0.45); g.shadowBlur = Z(1.4); g.shadowOffsetY = Z(0.3); d.circle(scx, by, sr, SEND); g.restore();
      plane(scx + sr * 0.06, by, sr * 0.95, onSEND);
      const fx = pcx + pr + Z(1.6), fw = scx - sr - Z(2) - fx;
      g.fillStyle = CHATBG; d.rr(fx, fy, fw, fh, Math.min(fh / 2, L.base / 2)); g.fill();
      g.strokeStyle = d.rgba(STRONG, 0.55); g.lineWidth = Math.max(1.5, Z(0.22)); g.stroke();
      const tx = fx + L.base * 0.45, s = L.size, ty = cy - (L.lines.length * L.lh) / 2 + (L.lh - s * 1.16) / 2;
      d.tag("cta");
      L.lines.forEach((ln, i) => {
        g.font = d.font("body", s, L.wt);
        d.text(ln, tx, ty + i * L.lh, { size: s, min: s, kind: "body", weight: L.wt, color: t.cta ? INK : MUTED, maxW: g.measureText(ln).width + 4, lines: 1 });
      });
      d.mark(scx - sr, by - sr, sr * 2, sr * 2);
      d.tag("");
      if (t.cta) { const ly = ty + (L.lines.length - 1) * L.lh; g.fillStyle = STRONG; g.fillRect(tx + L.lastW + Z(0.5), ly - s * 0.02, Math.max(2, Z(0.26)), s * 1.2); }
    }
    function keyboard(x, y, w, h) {
      g.fillStyle = "#E6E7EB"; g.fillRect(x, y, w, h);
      const pad = 1.4 * u, kh = Math.min(7.4 * u, (h - pad * 5) / 4.4), gx = 0.9 * u;
      const rows = [10, 9, 9, 0];
      const kw = (w - pad * 2 - gx * 9) / 10;
      let yy = y + pad * 1.6;
      rows.forEach((n, ri) => {
        const keys = [];
        if (ri === 3) { keys.push([kw * 2.4, 1], [kw * 5.4 + gx * 2, 0], [kw * 2.4, 1]); }
        else if (ri === 2) { keys.push([kw * 1.45, 1]); for (let i = 0; i < 7; i++) keys.push([kw, 0]); keys.push([kw * 1.45, 1]); }
        else for (let i = 0; i < n; i++) keys.push([kw, 0]);
        const tot = keys.reduce((a, kk) => a + kk[0], 0) + gx * (keys.length - 1);
        let xx = x + (w - tot) / 2;
        keys.forEach(([kwid, dark]) => {
          g.fillStyle = "rgba(0,0,0,.14)"; d.rr(xx, yy + 0.25 * u, kwid, kh, 1 * u); g.fill();
          g.fillStyle = dark ? "#C9CBD2" : "#FFFFFF"; d.rr(xx, yy, kwid, kh, 1 * u); g.fill();
          xx += kwid + gx;
        });
        yy += kh + pad;
      });
    }

    /* ---------- the chat window ---------- */
    // cw × ch card; c1 = right edge of the content (relative), for the Reels buttons zone
    function cardPlan(cw, ch, f, o, c1max) {
      const Z = Zs(f);
      const hh = Z(SZ.header + (logoAsName ? 2 : 0)), sp = Z(SZ.side), gap = Z(SZ.gap), pad = Z(SZ.pad);
      const c0 = sp, c1 = Math.min(cw - sp, c1max ?? cw - sp);
      const CL = ctaLayout(f, c0, c1), ih = CL.h;
      const avS = Z(SZ.avS), avG = Z(1.3), inX = c0 + avS + avG;
      const outMax = (c1 - c0) * 0.74, inMax = c1 - inX - Z(SZ.mode === "v" ? 3 : 4);
      const items = [];
      const pk = t.endsText && o.pill ? "ends" : o.pill === 1 ? "time" : "";
      if (pk) items.push({ ...pill(pk, c1 - c0, f), kind: "pill" });
      items.push({ ...bubble(TX.ask, "out", outMax, f), kind: "out" });
      const si = items.length; items.push(null);
      items.push({ ...bubble(TX.order, "out", outMax, f, true), kind: "out" });
      if (o.typing) items.push({ ...typing(f), kind: "in" });
      const chatH = ch - hh - ih;
      const fixed = items.reduce((a, it) => a + (it ? it.h + (it.after || 0) : 0), 0) + gap * (items.length - 1) + 2 * pad;
      // story stacks the photo over the price; when height is short (long headline, many badges) the side-by-side
      // reply keeps a bigger photo, so use whichever shows the product larger
      let sel = (SZ.mode === "v" ? sellerV : sellerH)(inMax, chatH - fixed, f, o.nb);
      if (SZ.mode === "v" && !(sel.ok && sel.photo >= SZ.minPhoto * u)) {
        const alt = sellerH(inMax, chatH - fixed, f, o.nb);
        if (alt.ok && alt.photo > sel.photo * 1.12) sel = alt;
      }
      items[si] = { ...sel, kind: "in", seller: true };
      const fits = sel.ok && sel.photo >= 14 * u, ok = fits && sel.photo >= SZ.minPhoto * u;
      const used = fixed + sel.h, spare = Math.max(0, chatH - used);
      return { ok, fits, photo: sel.photo, spare, draw(X, Y, bleed) {
        // card + shadow
        g.save(); g.shadowColor = SHADOW; g.shadowBlur = 6 * u; g.shadowOffsetY = 2.4 * u;
        g.fillStyle = SURF; d.rr(X, Y, cw, bleed ? H - Y + 10 * u : ch, Z(SZ.radius)); g.fill(); g.restore();
        g.save(); d.rr(X, Y, cw, bleed ? H - Y + 10 * u : ch, Z(SZ.radius)); g.clip();
        g.fillStyle = CHATBG; g.fillRect(X, Y + hh, cw, chatH);
        if (bleed) keyboard(X, Y + ch, cw, H - Y - ch);
        g.restore();
        header(X, Y, cw, hh, f, c0, c1max != null ? Math.min(cw - sp, c1max + Z(4)) : cw - sp);
        // messages sit at the bottom of the chat, like a real inbox; a little air spreads into the gaps
        const extraGap = Math.min(spare * 0.5 / Math.max(1, items.length - 1), gap * 0.9);
        let yy = Y + hh + pad + spare - extraGap * (items.length - 1);
        items.forEach((it) => {
          const xx = it.kind === "pill" ? X + c0 + (c1 - c0 - it.w) / 2 : it.kind === "out" ? X + c1 - it.w : X + inX;
          it.draw(xx, yy);
          if (it.kind === "in") avatar(X + c0 + avS / 2, yy + it.h - avS / 2, avS / 2, false);
          yy += it.h + (it.after || 0) + gap + extraGap;
        });
        inputBar(X, Y + ch - ih, cw, ih, f, c0, c1, CL);
      } };
    }
    function header(x, y, w, h, f, c0, c1) {
      const Z = Zs(f), T = Ts(f);
      const cy = y + h / 2, r = Z(SZ.av) / 2;
      chevron(x + c0 + Z(0.8), cy, Z(2.6), STRONG);
      // a wide wordmark already carries its own mark: no second circle next to it
      const ax = x + c0 + Z(3.6) + r;
      if (!logoAsName) avatar(ax, cy, r, true);
      const tx = logoAsName ? x + c0 + Z(3.8) : ax + r + Z(2), iconsW = Z(11.5);
      const nameW = x + c1 - iconsW - tx;
      const ns = T(SZ.name), as = T(SZ.active);
      const nh = logoAsName ? ns * 2.5 : ns * 1.2;
      const blockH = nh + Z(0.4) + as * 1.2, ny = cy - blockH / 2;
      if (logoAsName) {
        const lw = Math.min(nameW, logoAR * nh), lh = lw / logoAR;
        if (whiteLogo) { g.fillStyle = STRONG; d.rr(tx - Z(0.6), ny + (nh - lh) / 2 - Z(0.3), lw + Z(1.2), lh + Z(0.6), Z(0.8)); g.fill(); }
        d.logo(tx, ny + (nh - lh) / 2, nameW, lh, { align: "left" });
      } else {
        const N1 = oneLine(t.brand || TX.shop, nameW, ns, ns * 0.74, "body", 700);
        d.text(N1.text, tx, ny + (ns - N1.size) * 0.6, { size: N1.size, min: N1.size, kind: "body", weight: 700, color: INK, maxW: N1.w + 4, lines: 1, lh: 1.2 });
      }
      const ay = ny + nh + Z(0.4);
      d.circle(tx + as * 0.36, ay + as * 0.62, as * 0.3, ONLINE);
      const A1 = oneLine(TX.active, nameW - as, as, as * 0.8, "body", 500);
      d.text(A1.text, tx + as * 1.0, ay, { size: A1.size, min: A1.size, kind: "body", weight: 500, color: MUTED, maxW: A1.w + 4, lines: 1, lh: 1.2 });
      // page rating after "Active now" (only when the ad message has no proof line): · ★ 4.8
      if (headerRating && t.rating) {
        let rx = tx + as * 1.0 + A1.w + as * 0.5;
        const rs = A1.size;
        g.font = d.font("body", rs, 700); const rw = g.measureText(t.ratingText).width;
        if (rx + rs * 0.9 + rs * 1.25 + rw <= tx + nameW) {
          d.circle(rx + rs * 0.12, ay + rs * 0.62, rs * 0.1, MUTED); rx += rs * 0.7;
          d.star(rx + rs * 0.55, ay + rs * 0.6, rs * 0.56, "#F5A524");
          d.text(t.ratingText, rx + rs * 1.25, ay, { size: rs, min: rs, kind: "body", weight: 700, color: d.rgba(INK, 0.78), maxW: rw + 4, lines: 1, lh: 1.2 });
        }
      }
      phone(x + c1 - Z(8.6), cy, Z(3.3), STRONG);
      info(x + c1 - Z(2), cy, Z(3.6), STRONG);
      g.fillStyle = HAIR; g.fillRect(x, y + h - Math.max(1, Z(0.12)), w, Math.max(1, Z(0.12)));
    }

    /* ---------- the ad message above the chat: headline (+ sub, proof) ---------- */
    // f scales the whole block (the seller's text-size setting is applied on top);
    // extra = lines allowed beyond SZ.headLines (last resort before a headline would lose words)
    function message(maxW, f, o, al, extra = 0) {
      const parts = [], gap = SZ.msgGap * u * f, HL = SZ.headLines + extra;
      let ok = true, proof = false;
      if (o.kicker) {
        // a small "order in the inbox" pill with a drawn chat bubble: names the idea before the headline
        const s = SZ.kick * u * f * TS, ic = s * 1.3, padX = s * 0.95, h = s * 2.2;
        const m = oneLine(TX.kicker, maxW - padX * 2 - ic - s * 0.5, s, s * 0.85, "body", 700);
        const w = padX * 2 + ic + s * 0.5 + m.w;
        parts.push({ h, extra: gap * 0.3, draw: (x, y) => {
          const bx = al === "center" ? x + (maxW - w) / 2 : x;
          g.fillStyle = d.rgba(FG, darkBg ? 0.14 : 0.1); d.rr(bx, y, w, h, h / 2); g.fill();
          g.strokeStyle = d.rgba(FG, darkBg ? 0.28 : 0.22); g.lineWidth = Math.max(1, s * 0.07); g.stroke();
          const icx = bx + padX, icy = y + h / 2 - ic * 0.42;
          g.fillStyle = FG; rr4(icx, icy, ic, ic * 0.74, [ic * 0.3, ic * 0.3, ic * 0.3, ic * 0.06]); g.fill();
          g.beginPath(); g.moveTo(icx, icy + ic * 0.6); g.lineTo(icx - ic * 0.02, icy + ic * 0.98); g.lineTo(icx + ic * 0.32, icy + ic * 0.72); g.closePath(); g.fill();
          [-1, 0, 1].forEach((i) => d.circle(icx + ic / 2 + i * ic * 0.22, icy + ic * 0.37, ic * 0.07, darkBg ? d.mix(P, "#000000", 0.2) : d.mix(P, "#FFFFFF", 0.3)));
          d.text(m.text, bx + padX + ic + s * 0.5, y + (h - m.size * 1.15) / 2, { size: m.size, min: m.size, kind: "body", weight: 700, color: FG, maxW: m.w + 4, lines: 1 });
        } });
      }
      if (t.headline) {
        const hs = Math.round(SZ.head * u * f * TS);   // integer: d.headline's size loop starts at round(size)
        const all = d.headline(0, 0, { measure: true, size: hs, min: hs, lines: 40, maxW });
        if (all.lines.length > HL || all.w > maxW + 1) ok = false;
        parts.push({ h: all.h, draw: (x, y) => d.headline(x, y, { size: hs, min: hs, lines: HL, maxW, align: al, color: FG, hi: HI, hiBg: HIBG }) });
      }
      if (o.sub && t.sub) {
        // a sub that needs more than 2 lines is left out rather than cut
        const s = SZ.sub * u * f * TS, m = d.text(t.sub, 0, 0, { measure: true, size: s, min: s * 0.9, kind: "body", weight: 500, maxW, lines: 2, lh: 1.25 });
        g.font = d.font("body", m.size, 500);
        if (d.wrap(t.sub, maxW).length <= 2) parts.push({ h: m.h, draw: (x, y) => d.text(t.sub, x, y, { size: m.size, min: m.size, kind: "body", weight: 500, color: d.rgba(FG, 0.84), maxW, lines: 2, lh: 1.25, align: al }) });
      }
      if (o.proof && (t.proof || t.rating)) {
        const s = SZ.proof * u * f * TS, sw = t.rating ? 5 * s * 1.1 + 4 * s * 1.1 * 0.18 : 0;
        const label = t.proof ? (t.ratingText ? `${t.ratingText} · ` : "") + t.proof : t.ratingText;
        const L1 = label ? oneLine(label, maxW - sw - (sw ? s * 0.6 : 0), s, s * 0.82, "body", 600) : null;
        proof = true;
        parts.push({ h: s * 1.35, draw: (x, y) => {
          const total = sw + (L1 ? (sw ? s * 0.6 : 0) + L1.w : 0);
          let xx = al === "center" ? x + (maxW - total) / 2 : x;
          if (t.rating) { d.stars(xx, y + s * 0.08, s * 1.1, { color: STARC, empty: d.rgba(FG, 0.25) }); xx += sw + s * 0.6; }
          if (L1) d.text(L1.text, xx, y + s * 0.1, { size: L1.size, min: L1.size, kind: "body", weight: 600, color: d.rgba(FG, 0.88), maxW: L1.w + 4, lines: 1 });
        } });
      }
      const h = parts.reduce((a, p, i) => a + p.h + (i ? gap + (parts[i - 1].extra || 0) : 0), 0);
      return { h, ok, proof, draw(x, y) { let yy = y; parts.forEach((p, i) => { if (i) yy += gap + (parts[i - 1].extra || 0); p.draw(x, yy); yy += p.h; }); } };
    }
    function fitMessage(maxW, maxH, o, al) {
      const floor = SZ.headMin / (SZ.head * TS);      // the headline may shrink to headMin whatever the text-size setting
      const fMin = Math.min(1, o.sub || o.proof ? Math.max(floor, k.landscape ? 0.74 : 0.86) : floor);
      for (let f = 1; f >= fMin - 1e-6; f -= 0.04) { const m = message(maxW, f, o, al); if (m.ok && m.h <= maxH) return m; }
      return null;
    }
    // last resort for a very long headline: one or two more lines at the floor size, never lost words
    function lastMessage(maxW, o, al) {
      const f = Math.min(1, SZ.headMin / (SZ.head * TS));
      for (let e = 0; e <= 3; e++) { const m = message(maxW, f, o, al, e); if (m.ok) return m; }
      return message(maxW, f, o, al, 3);
    }

    /* ---------- background ---------- */
    function ghost(x, y, w, h, flip, alpha) {
      g.save(); g.fillStyle = d.rgba(FG, alpha);
      d.rr(x, y, w, h, h * 0.46); g.fill();
      g.beginPath();
      const tx = flip ? x + w * 0.8 : x + w * 0.2;
      g.moveTo(tx - h * 0.18, y + h - 2); g.lineTo(tx + (flip ? h * 0.3 : -h * 0.3), y + h * 1.32); g.lineTo(tx + h * 0.18, y + h - 2); g.closePath(); g.fill();
      [-1, 0, 1].forEach((i) => d.circle(x + w / 2 + i * h * 0.3, y + h / 2, h * 0.09, d.rgba(FG, alpha * 1.6)));
      g.restore();
    }
    function background(focus) {
      const gr = g.createLinearGradient(0, 0, W * 0.45, H);
      gr.addColorStop(0, BG1); gr.addColorStop(1, BG2);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const R = Math.max(W, H) * 0.6, rg = g.createRadialGradient(focus.x, focus.y, 0, focus.x, focus.y, R);
      rg.addColorStop(0, d.rgba("#FFFFFF", darkBg ? 0.16 : 0.34)); rg.addColorStop(1, d.rgba("#FFFFFF", 0));
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
      d.pattern("dots", 0, 0, W, H, d.rgba(FG, darkBg ? 0.09 : 0.1), { size: 3.4 * u, r: 0.36 * u });
    }

    /* =========================== compositions =========================== */
    const al = d.align("left");
    const OPTS = [
      { sub: 1, proof: 1, pill: 1, typing: 1, nb: SZ.nb },
      { sub: 1, proof: 1, pill: 1, typing: 0, nb: SZ.nb },
      { sub: 1, proof: 1, pill: "ends", typing: 0, nb: SZ.nb },
      { sub: 1, proof: 1, pill: "ends", typing: 0, nb: Math.min(2, SZ.nb) },
      { sub: 0, proof: 1, pill: "ends", typing: 0, nb: Math.min(2, SZ.nb) },
      { sub: 0, proof: 0, pill: "ends", typing: 0, nb: Math.min(2, SZ.nb) },
      { sub: 0, proof: 0, pill: 0, typing: 0, nb: Math.min(2, SZ.nb) },
      { sub: 0, proof: 0, pill: 0, typing: 0, nb: 1 },
    ];

    const SCALES = [1, SZ.fMin];
    if (k.landscape) {
      const M = 5 * u, cw = 84 * u, ch = H - 2 * M, cx = W - M - cw, cy = M;
      let plan = null, best = null;
      for (const o of OPTS) {
        for (const f of SCALES) { const p = cardPlan(cw, ch, f, o); if (p.ok) { plan = p; break; } if (p.fits && (!best || p.photo > best.photo)) best = p; }
        if (plan) break;
      }
      plan = plan || best || cardPlan(cw, ch, SZ.fMin, OPTS[OPTS.length - 1]);
      const mx = k.side, mw = cx - mx - 7 * u, mh = H - k.top - k.bottom;
      const msg = [{ kicker: 1, sub: 1, proof: 1 }, { kicker: 1, sub: 0, proof: 1 }, { kicker: 0, sub: 0, proof: 1 }, { kicker: 0, sub: 0, proof: 0 }]
        .reduce((m, o) => m || fitMessage(mw, mh, o, al), null) || lastMessage(mw, {}, al);
      headerRating = !msg.proof;
      background({ x: cx + cw * 0.3, y: H * 0.2 });
      ghost(k.side - 2 * u, H - 22 * u, 34 * u, 15 * u, false, darkBg ? 0.07 : 0.1);
      ghost(cx - 26 * u, -5 * u, 30 * u, 13 * u, true, darkBg ? 0.06 : 0.09);
      msg.draw(mx, k.top + Math.max(0, (mh - msg.h) / 2));
      plan.draw(cx, cy, false);
      return;
    }

    // square, portrait, story
    const story = k.story;
    const M = story ? 0 : 6 * u;
    const cardX = story ? 4 * u : M, cardW = story ? W * 0.912 - 4 * u : W - 2 * M;
    const c1max = story ? W * 0.88 - 0.5 * u - cardX : undefined;
    const top = story ? H * 0.14 + 1.4 * u : M + 0.4 * u, bottom = story ? H * 0.8 - 0.6 * u : H - M;
    const msgX = story ? cardX + SZ.side * u : M, msgW = story ? cardW - 2 * SZ.side * u : W - 2 * M;
    // richest option first; drop decoration, then optional copy, before the photo gets small.
    // If nothing reaches the photo target, keep the attempt with the biggest photo (text never shrinks below fMin).
    let pick = null, best = null;
    // a long headline gives up some height (smaller type, fewer lines) before the chat loses its badges
    const LIMS = [SZ.msgMax, SZ.msgMax * 0.72];
    for (const o of OPTS) {
      for (const [lim, f] of LIMS.flatMap((l) => SCALES.map((s) => [l, s]))) {
        const msg = fitMessage(msgW, (bottom - top) * lim, o, al);
        if (!msg) continue;
        const cy = top + msg.h + (msg.h ? SZ.cardGap * u : 0);
        const plan = cardPlan(cardW, bottom - cy, f, o, c1max);
        if (plan.ok) { pick = { msg, plan, cy }; break; }
        if (plan.fits && (!best || plan.photo > best.plan.photo)) best = { msg, plan, cy };
      }
      if (pick) break;
    }
    if (!pick) pick = best;
    if (!pick) {
      const o = OPTS[OPTS.length - 1], msg = lastMessage(msgW, o, al);
      const cy = top + msg.h + (msg.h ? SZ.cardGap * u : 0);
      pick = { msg, plan: cardPlan(cardW, bottom - cy, SZ.fMin, o, c1max), cy };
    }
    headerRating = !pick.msg.proof;
    background({ x: W * 0.72, y: pick.cy });
    ghost(W - 34 * u, story ? H * 0.035 : -8 * u, 44 * u, 19 * u, true, darkBg ? 0.07 : 0.1);
    if (story) ghost(-6 * u, H * 0.05, 30 * u, 13 * u, false, darkBg ? 0.05 : 0.08);
    pick.msg.draw(msgX, top);
    pick.plan.draw(cardX, pick.cy, story);
  },
});
