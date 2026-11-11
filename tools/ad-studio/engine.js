/* Greyrock Ad Studio: drawing engine + layout registry.
   ─────────────────────────────────────────────────────────────────────────────
   Every style ("layout") lives in its own file under /tools/ad-studio/layouts/ and calls
     GRS.register({ id, name, group, photos, cutout, draw(d) { ... } })
   `d` is the drawing kit described in LAYOUT CONTRACT below. Layouts never touch the DOM,
   never fetch anything, and only draw on d.g (a CanvasRenderingContext2D).
   Everything runs in the browser: no AI, no APIs, nothing that needs updating.
   ───────────────────────────────────────────────────────────────────────────── */
(() => {
  "use strict";

  /* ============================== constants ============================== */
  const SIZES = {
    square:    { w: 1080, h: 1080, label: "Feed square",     ratio: "1:1",    use: "Facebook & Instagram feed" },
    portrait:  { w: 1080, h: 1350, label: "Feed portrait",   ratio: "4:5",    use: "Feed (most screen space)" },
    story:     { w: 1080, h: 1920, label: "Reels & Stories", ratio: "9:16",   use: "Reels, Stories, WhatsApp status" },
    landscape: { w: 1200, h: 628,  label: "Link ad",         ratio: "1.91:1", use: "Link ads, right column, Messenger" },
  };

  // font pairings; every display face has a Bangla partner so বাংলা text always renders well
  const FONTS = {
    modern:   { label: "Modern",      display: '"Bricolage Grotesque"', bn: '"Noto Sans Bengali"', dW: 800 },
    elegant:  { label: "Elegant",     display: '"Playfair Display"',    bn: '"Noto Serif Bengali"', dW: 700 },
    bold:     { label: "Bold",        display: '"Anton"',               bn: '"Anek Bangla"',        dW: 400 },
    friendly: { label: "Friendly",    display: '"Baloo 2"',             bn: '"Baloo Da 2"',         dW: 800 },
    classic:  { label: "Classic",     display: '"Fraunces"',            bn: '"Tiro Bangla"',        dW: 700 },
    hand:     { label: "Handwritten", display: '"Caveat"',              bn: '"Galada"',             dW: 700 },
  };

  const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
  const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const BADGES = ["cod", "free", "sameday", "stock", "returns", "original", "madeinbd"];
  const STICKERS = ["auto", "none", "new", "hot", "best", "eid", "limited", "today"];

  const TEXT = {
    en: {
      brand: "Your Brand", headline: "Eid Collection 2027", sub: "Premium quality, delivered to your door", cta: "Order now", festive: "Eid Mubarak",
      prefix: "", proof: "2,000+ happy customers", quote: "Best quality I've bought online. Delivery was super fast!", reviewer: "Nusrat, Dhaka",
      off: "OFF", ends: "Offer ends", before: "Before", after: "After", reviews: "reviews", only: "Only", boishakh: "Shubho Noboborsho", flash: "Flash sale",
      cod: "Cash on delivery", free: "Free delivery in Dhaka", sameday: "Same-day delivery in Dhaka", stock: "Limited stock",
      returns: "Easy returns", original: "100% original", madeinbd: "Made in Bangladesh",
      stickers: { new: "NEW", hot: "HOT", best: "BEST SELLER", eid: "EID SPECIAL", limited: "LIMITED", today: "TODAY ONLY" },
    },
    bn: {
      brand: "আপনার ব্র্যান্ড", headline: "ঈদ কালেকশন ২০২৭", sub: "প্রিমিয়াম কোয়ালিটি, ঘরে বসেই ডেলিভারি", cta: "এখনই অর্ডার করুন", festive: "ঈদ মোবারক",
      prefix: "", proof: "২,০০০+ সন্তুষ্ট গ্রাহক", quote: "অনলাইনে কেনা সেরা প্রোডাক্ট। ডেলিভারিও খুব দ্রুত!", reviewer: "নুসরাত, ঢাকা",
      off: "ছাড়", ends: "অফার শেষ", before: "আগে", after: "পরে", reviews: "রিভিউ", only: "মাত্র", boishakh: "শুভ নববর্ষ", flash: "ফ্ল্যাশ সেল",
      cod: "ক্যাশ অন ডেলিভারি", free: "ঢাকায় ফ্রি ডেলিভারি", sameday: "ঢাকায় একই দিনে ডেলিভারি", stock: "সীমিত স্টক",
      returns: "সহজ রিটার্ন", original: "১০০% অরিজিনাল", madeinbd: "বাংলাদেশে তৈরি",
      stickers: { new: "নতুন", hot: "হট", best: "সেরা বিক্রি", eid: "ঈদ স্পেশাল", limited: "সীমিত", today: "শুধু আজ" },
    },
  };

  const DEFAULTS = {
    template: "spotlight", lang: "en",
    brand: "Your Brand", headline: "Eid Collection 2027", sub: "", prefix: "", price: 1499, old: 1999, cta: "Order now", festive: "Eid Mubarak",
    proof: "", rating: 0, ends: "", quote: "", reviewer: "",
    badges: { cod: true, free: true, sameday: false, stock: false, returns: false, original: false, madeinbd: false }, custom: "", sticker: "auto",
    color: "#2E5BFF", accent: "", font: "modern", textScale: 1, overlay: 1, align: "auto", logoStyle: "auto",
    zoom: 1, fx: 0.5, fy: 0.5, cutout: false,
    adjust: { brightness: 1, contrast: 1, saturation: 1, warmth: 0 },
  };

  /* ============================== colour ============================== */
  const hex2 = (h) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h || ""); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [46, 91, 255]; };
  const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const A = hex2(a), B = hex2(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const rgba = (h, a) => { const [r, g, b] = hex2(h); return `rgba(${r},${g},${b},${a})`; };
  const lum = (h) => { const [r, g, b] = hex2(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
  const onColor = (h) => (contrast(h, "#FFFFFF") >= contrast(h, "#14110D") ? "#FFFFFF" : "#14110D");
  function toHsl(h) {
    let [r, g, b] = hex2(h).map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let hh = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh /= 6; }
    return [hh * 360, s, l];
  }
  function fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    if (!s) return toHex(l * 255, l * 255, l * 255);
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return toHex(f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255);
  }
  const autoAccent = (h) => { const [hh, s] = toHsl(h); return fromHsl(hh + 155, Math.max(0.6, s), 0.56); };

  /* most saturated, mid-bright colours in an image → palette suggestions */
  function palette(img, n = 5) {
    try {
      const c = document.createElement("canvas"); c.width = 48; c.height = 48;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0, 48, 48);
      const d = x.getImageData(0, 0, 48, 48).data, bins = {};
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0, v = mx / 255;
        if (v < 0.12 || v > 0.98) continue;
        const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
        const bin = bins[key] = bins[key] || { r: 0, g: 0, b: 0, n: 0, s: 0 };
        bin.r += r; bin.g += g; bin.b += b; bin.n++; bin.s += sat;
      }
      const list = Object.values(bins).map((b) => ({ hex: toHex(b.r / b.n, b.g / b.n, b.b / b.n), score: b.n * (0.35 + b.s / b.n) }))
        .sort((a, b) => b.score - a.score);
      const out = [];
      list.forEach((p) => { if (out.length < n && out.every((q) => colorDist(q, p.hex) > 60)) out.push(p.hex); });
      return out;
    } catch { return []; }
  }
  const colorDist = (a, b) => { const A = hex2(a), B = hex2(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

  /* ============================== text utils ============================== */
  const toBn = (s) => String(s).replace(/\d/g, (d) => BN_DIGITS[d]);
  const nf = new Intl.NumberFormat("en-IN");

  function texts(st) {
    const lang = st.lang === "bn" ? "bn" : "en", L = TEXT[lang];
    const num = (n) => (lang === "bn" ? toBn(nf.format(n)) : nf.format(n));
    const loc = (s) => (lang === "bn" ? toBn(s) : String(s));
    const price = st.price > 0 ? `৳${num(Math.round(st.price))}` : "";
    const old = st.old > st.price && st.price > 0 ? `৳${num(Math.round(st.old))}` : "";
    const pct = old ? Math.round(((st.old - st.price) / st.old) * 100) : 0;
    const pctText = pct ? (lang === "bn" ? `${toBn(pct)}% ${L.off}` : `-${pct}%`) : "";
    let stickerText = "";
    if (st.sticker === "auto") stickerText = pctText;
    else if (st.sticker && st.sticker !== "none") stickerText = L.stickers[st.sticker] || "";
    const badges = BADGES.filter((b) => st.badges && st.badges[b]).map((b) => L[b]);
    if (String(st.custom || "").trim()) badges.push(String(st.custom).trim());
    let endsText = "";
    if (st.ends) {
      const d = new Date(`${st.ends}T00:00`);
      if (!isNaN(d)) endsText = lang === "bn" ? `${L.ends} ${toBn(d.getDate())} ${BN_MONTHS[d.getMonth()]}` : `${L.ends} ${d.getDate()} ${EN_MONTHS[d.getMonth()]}`;
    }
    const rating = Math.max(0, Math.min(5, +st.rating || 0));
    const isDefault = (v, key) => !v || v === TEXT.en[key] || v === TEXT.bn[key];
    return {
      lang, L, num, loc,
      brand: String(st.brand || "").trim(), headline: String(st.headline || "").trim(), sub: String(st.sub || "").trim(),
      prefix: String(st.prefix || "").trim(), cta: String(st.cta || "").trim(),
      festive: String(st.festive || "").trim(), proof: String(st.proof || "").trim(),
      quote: String(st.quote || "").trim() || L.quote, reviewer: String(st.reviewer || "").trim() || L.reviewer,
      price, old, pct, pctText, stickerText, badges, endsText,
      rating, ratingText: rating ? loc(rating.toFixed(1)) : "",
      before: L.before, after: L.after, flash: L.flash, only: L.only,
      /* a layout-specific festive line: the user's own text if they changed it, else the layout's default */
      festiveOr: (en, bn) => (isDefault(st.festive, "festive") ? (lang === "bn" ? bn : en) : String(st.festive).trim()),
    };
  }

  /* headline *highlight* syntax → tokens */
  function tokens(text) {
    const out = []; let hi = false;
    String(text || "").split(/(\*)/).forEach((part) => {
      if (part === "*") { hi = !hi; return; }
      part.split(/\s+/).filter(Boolean).forEach((w) => out.push({ w, hi }));
    });
    return out;
  }

  /* ============================== placeholders ============================== */
  // sample products so every style looks real before the seller uploads anything
  const phCache = {};
  function rrPath(x, ctx, X, Y, W, H, R) { R = Math.min(R, W / 2, H / 2); ctx.beginPath(); ctx.moveTo(X + R, Y); ctx.arcTo(X + W, Y, X + W, Y + H, R); ctx.arcTo(X + W, Y + H, X, Y + H, R); ctx.arcTo(X, Y + H, X, Y, R); ctx.arcTo(X, Y, X + W, Y, R); ctx.closePath(); }
  function placeholder(i, color, cut) {
    const key = `${i}|${color}|${cut ? 1 : 0}`;
    if (phCache[key]) return phCache[key];
    const c = document.createElement("canvas");
    const g = c.getContext("2d");
    const dark = mix(color, "#000000", 0.35);
    if (cut) { c.width = 620; c.height = 860; } else { c.width = 1200; c.height = 1200; }
    const ox = cut ? 310 : 600, oy = cut ? 0 : 230;
    if (!cut) {
      const gr = g.createLinearGradient(0, 0, 1200, 1200);
      gr.addColorStop(0, mix(color, "#ffffff", 0.82 - i * 0.06)); gr.addColorStop(1, mix(color, "#ffffff", 0.55 - i * 0.05));
      g.fillStyle = gr; g.fillRect(0, 0, 1200, 1200);
      g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(600, 560, 400, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(0,0,0,.12)"; g.beginPath(); g.ellipse(600, 1000, 230, 34, 0, 0, Math.PI * 2); g.fill();
    }
    const body = g.createLinearGradient(ox - 170, 0, ox + 170, 0); body.addColorStop(0, "#ffffff"); body.addColorStop(1, "#e7e5ee");
    g.fillStyle = body;
    if (i === 1) { // jar of cream
      rrPath(0, g, ox - 230, oy + 300, 460, 460, 70); g.fill();
      g.fillStyle = dark; rrPath(0, g, ox - 250, oy + 220, 500, 120, 30); g.fill();
      g.fillStyle = color; rrPath(0, g, ox - 170, oy + 430, 340, 200, 22); g.fill();
      g.fillStyle = onColor(color); g.font = '800 54px "Bricolage Grotesque", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CREAM", ox, oy + 515);
      g.font = '600 24px "Inter", sans-serif'; g.fillText("NIGHT · 50g", ox, oy + 575);
    } else if (i === 2) { // tube
      g.beginPath(); g.moveTo(ox - 150, oy + 140); g.lineTo(ox + 150, oy + 140); g.lineTo(ox + 115, oy + 690); g.lineTo(ox - 115, oy + 690); g.closePath(); g.fill();
      g.fillStyle = dark; rrPath(0, g, ox - 70, oy + 690, 140, 120, 18); g.fill();
      g.fillStyle = color; rrPath(0, g, ox - 115, oy + 300, 230, 250, 20); g.fill();
      g.fillStyle = onColor(color); g.font = '800 46px "Bricolage Grotesque", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("SPF 50", ox, oy + 400);
      g.font = '600 22px "Inter", sans-serif'; g.fillText("SUNSCREEN", ox, oy + 455);
    } else { // serum bottle
      rrPath(0, g, ox - 170, oy + 170, 340, 600, 90); g.fill();
      g.fillStyle = dark; rrPath(0, g, ox - 90, oy + 40, 180, 150, 26); g.fill();
      g.fillStyle = color; rrPath(0, g, ox - 130, oy + 350, 260, 250, 26); g.fill();
      g.fillStyle = onColor(color); g.font = '800 56px "Bricolage Grotesque", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("SERUM", ox, oy + 450);
      g.font = '600 26px "Inter", sans-serif'; g.fillText("VITAMIN C · 30ml", ox, oy + 515);
      g.fillStyle = "rgba(255,255,255,.55)"; rrPath(0, g, ox - 145, oy + 200, 40, 520, 20); g.fill();
    }
    if (cut) {
      // trim the cut-out to the product's own bounds so it stands flush on surfaces (no empty band underneath)
      const B = [[140, 40, 340, 730], [60, 220, 500, 540], [160, 140, 300, 670]][i] || [140, 40, 340, 730], p = 4;
      const t = document.createElement("canvas"); t.width = B[2] + p * 2; t.height = B[3] + p * 2;
      t.getContext("2d").drawImage(c, B[0] - p, B[1] - p, t.width, t.height, 0, 0, t.width, t.height);
      phCache[key] = t;
      return t;
    }
    phCache[key] = c;
    return c;
  }

  /* photo adjustments (brightness / contrast / saturation / warmth), cached per source */
  const adjCache = new WeakMap();
  function adjusted(src, a) {
    if (!a) return src;
    const b = a.brightness ?? 1, ct = a.contrast ?? 1, s = a.saturation ?? 1, w = a.warmth ?? 0;
    if (b === 1 && ct === 1 && s === 1 && !w) return src;
    const key = `${b}|${ct}|${s}|${w}`;
    const hit = adjCache.get(src);
    if (hit && hit.key === key) return hit.canvas;
    const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    const x = c.getContext("2d");
    x.filter = `brightness(${b}) contrast(${ct}) saturate(${s})`; x.drawImage(src, 0, 0); x.filter = "none";
    if (w) { x.globalCompositeOperation = "source-atop"; x.fillStyle = w > 0 ? `rgba(255,140,40,${w * 0.22})` : `rgba(60,120,255,${-w * 0.22})`; x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = "source-over"; }
    adjCache.set(src, { key, canvas: c });
    return c;
  }

  /* ============================== the drawing kit (d) ============================== */
  function makeKit(g, size, st, assets) {
    const S = SIZES[size], W = S.w, H = S.h;
    const story = size === "story", landscape = size === "landscape";
    const side = landscape ? W * 0.05 : W * 0.07;
    const top = story ? H * 0.14 : landscape ? H * 0.09 : W * 0.07;
    const bottom = story ? H * 0.25 : landscape ? H * 0.09 : W * 0.07;
    const u = landscape ? 6.6 : 10.8;                      // 1u ≈ 1% of the short design width; size everything in u
    const k = {
      size, story, landscape, square: size === "square", portrait: size === "portrait",
      side, top, bottom, boost: story ? 1.3 : 1,
      maxW: W - side * 2 - (story ? W * 0.1 : 0),
      safe: { x: side, y: top, w: W - side * 2 - (story ? W * 0.1 : 0), h: H - top - bottom },
    };
    const t = texts(st);
    const F = FONTS[st.font] || FONTS.modern;
    const f = {
      display: `${F.display}, ${F.bn}, "Noto Sans Bengali", sans-serif`,
      body: '"Inter", "Noto Sans Bengali", sans-serif',
      serif: '"Playfair Display", "Noto Serif Bengali", serif',
      hand: '"Caveat", "Galada", cursive',
      dW: F.dW, key: st.font in FONTS ? st.font : "modern",
    };
    const primary = /^#[\da-f]{6}$/i.test(st.color) ? st.color : DEFAULTS.color;
    const accent = /^#[\da-f]{6}$/i.test(st.accent || "") ? st.accent : autoAccent(primary);
    const c = {
      primary, accent, onPrimary: onColor(primary), onAccent: onColor(accent),
      dark: mix(primary, "#000000", 0.84), deep: mix(primary, "#000000", 0.55), soft: mix(primary, "#FFFFFF", 0.82), light: mix(primary, "#FFFFFF", 0.93),
      ink: "#14110D", paper: "#FBF8F2", white: "#FFFFFF", sale: "#FFD23F", gold: "#E9C46A", red: "#D7263D", green: "#0F7B4F",
    };
    const photos = (assets && assets.photos) || [];
    const userCount = photos.filter((p) => p && p.img).length;
    let textArea = 0;
    const marks = [];          // every text box drawn: feeds the text-coverage check and the lab's overlap / safe-zone lint
    let markTag = "", tagSeq = 0;
    const mark = (x, y, w, h) => { if (w > 0 && h > 0) { textArea += w * h; marks.push({ x, y, w, h, tag: markTag }); } };

    const d = {
      g, W, H, size, k, t, c, f, st, u,
      scale: st.textScale || 1, overlay: st.overlay ?? 1,
      align: (def) => (st.align === "left" || st.align === "center" ? st.align : def),
      photoCount: userCount, hasLogo: !!(assets && assets.logo),
      mix, rgba, lum, onColor, contrast, toHsl, fromHsl,
      /* seeded random for repeatable decorations */
      rnd(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => (s = (s * 9301 + 49297) % 233280) / 233280; },
      font(kind = "display", size = 40, weight) {
        const fam = kind === "body" ? f.body : kind === "serif" ? f.serif : kind === "hand" ? f.hand : f.display;
        const w = weight ?? (kind === "display" ? f.dW : kind === "hand" ? 700 : 700);
        return `${w} ${Math.max(1, Math.round(size))}px ${fam}`;
      },
      mark,

      /* ---------- shapes ---------- */
      rr(x, y, w, h, r) { rrPath(0, g, x, y, w, h, r); },
      circle(cx, cy, r, fill) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } },
      star(cx, cy, r, fill, points = 5, inner = 0.42) {
        g.beginPath();
        for (let i = 0; i < points * 2; i++) { const rad = i % 2 ? r * inner : r, a = -Math.PI / 2 + (i * Math.PI) / points; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
        g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); }
      },
      crescent(cx, cy, r, fill) {
        g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.arc(cx + r * 0.42, cy - r * 0.18, r * 0.86, 0, Math.PI * 2, true);
        g.fillStyle = fill; g.fill("evenodd"); g.restore();
      },
      blob(cx, cy, r, seed, fill, wobble = 0.18) {
        const R = d.rnd(seed), n = 9, pts = [];
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const rr = r * (1 - wobble + R() * wobble * 2); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
        g.beginPath();
        for (let i = 0; i <= n; i++) { const p = pts[i % n], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (!i) g.moveTo(mx, my); else g.quadraticCurveTo(p[0], p[1], mx, my); }
        g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); }
      },
      /* repeating patterns: dots | grid | diagonal | chevron | lattice | waves */
      pattern(type, x, y, w, h, color, o = {}) {
        const s = o.size || 6 * u, lw = o.line || Math.max(1, 0.25 * u);
        g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
        g.fillStyle = color; g.strokeStyle = color; g.lineWidth = lw;
        if (type === "dots") { for (let yy = y + s / 2; yy < y + h; yy += s) for (let xx = x + s / 2; xx < x + w; xx += s) { g.beginPath(); g.arc(xx, yy, o.r || s * 0.08, 0, Math.PI * 2); g.fill(); } }
        else if (type === "grid") { g.beginPath(); for (let xx = x; xx <= x + w; xx += s) { g.moveTo(xx, y); g.lineTo(xx, y + h); } for (let yy = y; yy <= y + h; yy += s) { g.moveTo(x, yy); g.lineTo(x + w, yy); } g.stroke(); }
        else if (type === "diagonal") { g.beginPath(); for (let i = -h; i < w + h; i += s) { g.moveTo(x + i, y + h); g.lineTo(x + i + h, y); } g.stroke(); }
        else if (type === "chevron") { g.beginPath(); for (let yy = y; yy < y + h + s; yy += s) { for (let xx = x; xx < x + w + s; xx += s) { g.moveTo(xx, yy); g.lineTo(xx + s / 2, yy - s / 3); g.lineTo(xx + s, yy); } } g.stroke(); }
        else if (type === "lattice") { g.beginPath(); for (let yy = y - s; yy < y + h + s; yy += s) for (let xx = x - s; xx < x + w + s; xx += s) { g.moveTo(xx + s / 2, yy); g.lineTo(xx + s, yy + s / 2); g.lineTo(xx + s / 2, yy + s); g.lineTo(xx, yy + s / 2); g.closePath(); } g.stroke(); }
        else if (type === "waves") { g.beginPath(); for (let yy = y; yy < y + h + s; yy += s / 1.6) { g.moveTo(x, yy); for (let xx = x; xx <= x + w + s; xx += s) g.quadraticCurveTo(xx + s / 4, yy - s / 4, xx + s / 2, yy), g.quadraticCurveTo(xx + (3 * s) / 4, yy + s / 4, xx + s, yy); } g.stroke(); }
        g.restore();
      },

      /* ---------- photos ---------- */
      hasPhoto: (i = 0) => !!(photos[i] && photos[i].img),
      /* true when a transparent product cut-out is available for photo i (samples always have one) */
      hasCutout(i = 0) { const p = photos[i] || (userCount ? photos[0] : null); return p && p.img ? !!(st.cutout && p.cutout) : true; },
      source(i = 0, wantCut = false) {
        let p = photos[i];
        if (!(p && p.img) && userCount) p = photos[0];     // fewer uploads than the style needs → reuse photo 1
        if (p && p.img) return adjusted(wantCut && st.cutout && p.cutout ? p.cutout : p.img, st.adjust);
        return placeholder(userCount ? 0 : i, primary, wantCut);
      },
      /* cover-fit photo i into a box (optionally clipped by a path function) */
      photo(x, y, w, h, o = {}) {
        const img = d.source(o.i || 0, !!o.cutout);
        const zoom = (o.i ? 1 : st.zoom || 1) * (o.zoom || 1);
        const fx = o.i ? 0.5 : st.fx ?? 0.5, fy = o.i ? 0.5 : st.fy ?? 0.5;
        const s = Math.max(w / img.width, h / img.height) * zoom, dw = img.width * s, dh = img.height * s;
        let dx = x + w / 2 - fx * dw, dy = y + h / 2 - fy * dh;
        dx = Math.min(x, Math.max(x + w - dw, dx)); dy = Math.min(y, Math.max(y + h - dh, dy));
        g.save();
        if (o.clip) o.clip(); else { g.beginPath(); g.rect(x, y, w, h); }
        g.clip();
        if (o.alpha != null) g.globalAlpha = o.alpha;
        if (o.filter) g.filter = o.filter;
        g.drawImage(img, dx, dy, dw, dh);
        g.restore();
        return { x, y, w, h };
      },
      /* product as a floating cut-out (contain-fit, ground shadow) when available,
         otherwise the photo inside a rounded card. Returns the drawn rectangle. */
      product(x, y, w, h, o = {}) {
        const i = o.i || 0;
        if (d.hasCutout(i) && o.fallback !== "force-card") {
          const img = d.source(i, true);
          const zoom = (i ? 1 : st.zoom || 1) * (o.zoom || 1);
          const s = Math.min(w / img.width, h / img.height) * zoom, dw = img.width * s, dh = img.height * s;
          const dx = x + (w - dw) / 2 + (i ? 0 : (0.5 - (st.fx ?? 0.5)) * w * 0.6), dy = o.valign === "center" ? y + (h - dh) / 2 : y + h - dh;
          if (o.shadow !== false) {
            g.save(); g.fillStyle = o.shadowColor || "rgba(0,0,0,.28)"; g.filter = `blur(${Math.round(2 * u)}px)`;
            g.beginPath(); g.ellipse(dx + dw / 2, dy + dh - dh * 0.01, dw * 0.42, Math.max(6, dh * 0.035), 0, 0, Math.PI * 2); g.fill(); g.restore();
            g.save(); g.shadowColor = "rgba(0,0,0,.22)"; g.shadowBlur = 3 * u; g.shadowOffsetY = 1.5 * u;
            if (o.filter) g.filter = o.filter;
            g.drawImage(img, dx, dy, dw, dh); g.restore();
          } else { g.save(); if (o.filter) g.filter = o.filter; g.drawImage(img, dx, dy, dw, dh); g.restore(); }
          return { x: dx, y: dy, w: dw, h: dh, cutout: true };
        }
        const r = o.radius ?? 3.6 * u;
        if (o.shadow !== false) { g.save(); g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = 4 * u; g.shadowOffsetY = 1.6 * u; g.fillStyle = "#fff"; rrPath(0, g, x, y, w, h, r); g.fill(); g.restore(); }
        d.photo(x, y, w, h, { i, clip: () => rrPath(0, g, x, y, w, h, r), filter: o.filter });
        return { x, y, w, h, cutout: false };
      },
      /* logo image (or the brand name as a wordmark) inside maxW × maxH */
      /* o: align, tint (recolour to one colour), plate (draw on a rounded plate of this colour), plateRadius (0 = sharp),
         color/size/kind for the text fallback, measure (return {w, h, x, aspect, image} without drawing or marking).
         The seller's "logo style" setting (st.logoStyle: original | white | dark | plate) overrides the layout's choice. */
      logo(x, y, maxW, maxH, o = {}) {
        const al = o.align || "left";
        if (assets && assets.logo) {
          const style = st.logoStyle && st.logoStyle !== "auto" ? st.logoStyle : "";
          const tint = style === "white" ? "#FFFFFF" : style === "dark" ? "#14110D" : style ? null : o.tint;
          const plate = style === "plate" ? "#FFFFFF" : style ? null : o.plate;
          const img = assets.logo, pad = plate ? maxH * 0.16 : 0;
          const s = Math.min((maxW - pad * 2.6) / img.width, (maxH - pad * 2) / img.height), w = img.width * s, h = img.height * s;
          const bw = w + pad * 2.6, bh = h + pad * 2;
          const lx = al === "center" ? x + (maxW - bw) / 2 : al === "right" ? x + maxW - bw : x;
          if (o.measure) return { w: bw, h: bh, x: lx, aspect: img.width / img.height, image: true };
          const pr = o.plateRadius ?? Math.min(bh / 2, 2.4 * u);
          if (plate) { g.save(); g.fillStyle = plate; g.shadowColor = "rgba(0,0,0,.18)"; g.shadowBlur = pr ? 1.4 * u : 0; g.shadowOffsetY = pr ? 0.4 * u : 0; rrPath(0, g, lx, y, bw, bh, pr); g.fill(); g.restore(); }
          if (tint) {
            const off = document.createElement("canvas"); off.width = Math.max(1, Math.round(w)); off.height = Math.max(1, Math.round(h));
            const ox = off.getContext("2d"); ox.drawImage(img, 0, 0, off.width, off.height); ox.globalCompositeOperation = "source-in"; ox.fillStyle = tint; ox.fillRect(0, 0, off.width, off.height);
            g.drawImage(off, lx + pad * 1.3, y + pad, w, h);
          } else g.drawImage(img, lx + pad * 1.3, y + pad, w, h);
          mark(lx, y, bw, bh);
          return { w: bw, h: bh, x: lx };
        }
        if (o.fallbackText === false || !t.brand) return { w: 0, h: 0, x };
        const size = Math.min(maxH * 0.8, o.size || 3 * u);
        g.font = d.font(o.kind || "body", size, o.weight || 700); g.fillStyle = o.color || "#fff"; g.textBaseline = "top"; g.textAlign = al;
        if ("letterSpacing" in g) g.letterSpacing = `${(o.letter ?? 0.12) * size}px`;
        const txt = o.upper === false ? t.brand : t.brand.toUpperCase();
        const ax = al === "center" ? x + maxW / 2 : al === "right" ? x + maxW : x;
        if (o.measure) { const mw = g.measureText(txt).width; if ("letterSpacing" in g) g.letterSpacing = "0px"; return { w: mw, h: size * 1.2, x: ax, aspect: mw / (size * 1.2), image: false }; }
        g.fillText(txt, ax, y + (maxH - size) / 2);
        const w = g.measureText(txt).width;
        if ("letterSpacing" in g) g.letterSpacing = "0px";
        mark(al === "center" ? ax - w / 2 : al === "right" ? ax - w : ax, y, w, size * 1.2);
        return { w, h: size * 1.2, x: ax };
      },

      /* ---------- text ---------- */
      wrap(text, maxW) {
        const words = String(text || "").trim().split(/\s+/).filter(Boolean), lines = []; let cur = "";
        words.forEach((w) => { const tt = cur ? `${cur} ${w}` : w; if (!cur || g.measureText(tt).width <= maxW) cur = tt; else { lines.push(cur); cur = w; } });
        if (cur) lines.push(cur); return lines;
      },
      /* largest size ≤ size that fits maxW in ≤ maxLines (min floor). Sets g.font.
         Returns { lines, size, clipped } — clipped = true when words had to be dropped even at the min size. */
      fit(text, maxW, maxLines, size, min, kind = "display", weight) {
        const start = Math.max(Math.round(size), Math.ceil(min));
        for (let s = start; s >= min; s -= 2) {
          g.font = d.font(kind, s, weight);
          const lines = d.wrap(text, maxW);
          if (lines.length <= maxLines && lines.every((l) => g.measureText(l).width <= maxW)) return { lines, size: s, clipped: false };
        }
        g.font = d.font(kind, min, weight);
        const all = d.wrap(text, maxW);
        return { lines: all.slice(0, maxLines), size: Math.round(min), clipped: all.length > maxLines };
      },
      /* fitted text block. o: size, min, lines, kind, weight, color, align, maxW, lh, upper, letter, shadow, stroke, measure */
      text(str, x, y, o = {}) {
        let s = String(str || ""); if (!s) return { h: 0, w: 0, size: 0, lines: [] };
        if (o.upper) s = s.toUpperCase();
        const size = (o.size || 4 * u), maxW = o.maxW || W, al = o.align || "left", lh = o.lh || 1.12;
        const F2 = d.fit(s, maxW, o.lines || 1, size, o.min || size * 0.5, o.kind || "display", o.weight);
        const hh = F2.lines.length * F2.size * lh;
        const widths = F2.lines.map((l) => g.measureText(l).width);
        const w = Math.max(0, ...widths);
        if (o.measure) return { h: hh, w, size: F2.size, lines: F2.lines, clipped: F2.clipped };
        g.save();
        g.font = d.font(o.kind || "display", F2.size, o.weight); g.textBaseline = "top"; g.textAlign = al;
        if (o.letter && "letterSpacing" in g) g.letterSpacing = `${o.letter * F2.size}px`;
        if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.shadowBlur ?? 2 * u; }
        const ax = al === "center" ? x + maxW / 2 : al === "right" ? x + maxW : x;
        F2.lines.forEach((l, i) => {
          const yy = y + i * F2.size * lh;
          if (o.stroke) { g.lineJoin = "round"; g.lineWidth = o.strokeWidth || F2.size * 0.06; g.strokeStyle = o.stroke; g.strokeText(l, ax, yy); }
          if (o.color !== "none") { g.fillStyle = o.color || "#fff"; g.fillText(l, ax, yy); }
          const lw = widths[i]; mark(al === "center" ? ax - lw / 2 : al === "right" ? ax - lw : ax, yy, lw, F2.size * lh);
        });
        g.restore();
        return { h: hh, w, size: F2.size, lines: F2.lines };
      },
      /* the headline with *highlighted* words. o: size, min, lines, color, hi, hiBg, align, maxW, lh, kind, weight, upper, measure */
      headline(x, y, o = {}) {
        let toks = tokens(o.text ?? t.headline);
        if (!toks.length) return { h: 0, w: 0, size: 0, lines: [] };
        if (o.upper) toks = toks.map((tk) => ({ ...tk, w: tk.w.toUpperCase() }));
        const maxW = o.maxW || k.maxW, size = o.size || 8 * u, min = o.min || size * 0.5, maxLines = o.lines || 3, lh = o.lh || 1.06, kind = o.kind || "display";
        let best = null;
        // start at least at ceil(min) so the loop always runs once (a fractional size equal to min used to crash)
        for (let s = Math.max(Math.round(size), Math.ceil(min)); s >= min || !best; s -= 2) {
          g.font = d.font(kind, s, o.weight);
          const sp = g.measureText(" ").width, lines = [[]]; let lw = 0, ok = true;
          toks.forEach((tk) => {
            const ww = g.measureText(tk.w).width; if (ww > maxW) ok = false;
            if (lines[lines.length - 1].length && lw + sp + ww > maxW) { lines.push([]); lw = 0; }
            lines[lines.length - 1].push({ ...tk, ww }); lw += (lw ? sp : 0) + ww;
          });
          best = { s, lines, sp };
          if (ok && lines.length <= maxLines) break;
        }
        const { s, lines, sp } = best;
        const useLines = lines.slice(0, Math.max(maxLines, 1)), clipped = lines.length > useLines.length;
        const lineW = (ln) => ln.reduce((a, tk, i) => a + tk.ww + (i ? sp : 0), 0);
        const hh = useLines.length * s * lh, w = Math.max(...useLines.map(lineW));
        if (o.measure) return { h: hh, w, size: s, lines: useLines, clipped };
        g.save(); g.font = d.font(kind, s, o.weight); g.textBaseline = "top"; g.textAlign = "left";
        if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.shadowBlur ?? 2 * u; }
        const al = o.align || "left";
        useLines.forEach((ln, li) => {
          const lwid = lineW(ln), yy = y + li * s * lh;
          let xx = al === "center" ? x + (maxW - lwid) / 2 : al === "right" ? x + maxW - lwid : x;
          mark(xx, yy, lwid, s * lh);
          ln.forEach((tk) => {
            if (tk.hi && o.hiBg) { g.save(); g.shadowBlur = 0; g.fillStyle = o.hiBg; rrPath(0, g, xx - s * 0.12, yy + s * 0.02, tk.ww + s * 0.24, s * 1.04, s * 0.18); g.fill(); g.restore(); }
            if (o.stroke) { g.lineJoin = "round"; g.lineWidth = o.strokeWidth || s * 0.06; g.strokeStyle = o.stroke; g.strokeText(tk.w, xx, yy); }
            g.fillStyle = tk.hi ? (o.hi || c.accent) : (o.color || "#fff");
            if (!(o.color === "none" && !tk.hi)) g.fillText(tk.w, xx, yy);
            xx += tk.ww + sp;
          });
        });
        g.restore();
        return { h: hh, w, size: s, lines: useLines };
      },
      /* price row: [prefix] ৳price ৳old(struck). o: size, color, oldColor, prefixColor, align, maxW, measure, stacked */
      price(x, y, o = {}) {
        if (!t.price) return { w: 0, h: 0 };
        const ps = o.size || 8 * u, os = ps * 0.5, pre = o.prefix ?? t.prefix, prs = ps * 0.36;
        g.font = d.font(o.kind || "display", ps, o.weight); const pw = g.measureText(t.price).width;
        g.font = d.font(o.kind || "display", os, 600); const ow = t.old ? g.measureText(t.old).width : 0;
        g.font = d.font("body", prs, 700); const prw = pre ? g.measureText(pre).width : 0;
        const gap = ps * 0.28;
        const stacked = !!o.stacked;
        const w = stacked ? Math.max(pw, ow + (prw ? prw + gap : 0)) : prw + (prw ? gap * 0.6 : 0) + pw + (ow ? gap + ow : 0);
        const h = stacked ? ps * 1.02 + (t.old || pre ? os * 1.1 : 0) : ps * 1.02;
        if (o.measure) return { w, h };
        const al = o.align || "left", maxW = o.maxW || w;
        let px = al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x;
        g.save(); g.textAlign = "left"; g.textBaseline = "alphabetic";
        if (stacked) {
          let topY = y;
          if (t.old || pre) {
            const base1 = y + os * 0.9; let xx = px;
            if (pre) { g.font = d.font("body", prs, 700); g.fillStyle = o.prefixColor || o.color || "#fff"; g.fillText(pre, xx, base1); xx += prw + gap; }
            if (t.old) { g.font = d.font(o.kind || "display", os, 600); g.fillStyle = o.oldColor || "rgba(255,255,255,.7)"; g.fillText(t.old, xx, base1); g.strokeStyle = g.fillStyle; g.lineWidth = Math.max(3, os * 0.09); g.beginPath(); g.moveTo(xx - 4, base1 - os * 0.33); g.lineTo(xx + ow + 4, base1 - os * 0.33); g.stroke(); }
            topY = y + os * 1.1;
          }
          g.font = d.font(o.kind || "display", ps, o.weight); g.fillStyle = o.color || "#fff"; g.fillText(t.price, px, topY + ps * 0.86);
        } else {
          const base = y + ps * 0.86;
          if (pre) { g.font = d.font("body", prs, 700); g.fillStyle = o.prefixColor || o.color || "#fff"; g.fillText(pre, px, base - ps * 0.06); px += prw + gap * 0.6; }
          g.font = d.font(o.kind || "display", ps, o.weight); g.fillStyle = o.color || "#fff"; g.fillText(t.price, px, base);
          if (t.old) {
            const ox = px + pw + gap; g.font = d.font(o.kind || "display", os, 600); g.fillStyle = o.oldColor || "rgba(255,255,255,.7)"; g.fillText(t.old, ox, base);
            g.strokeStyle = g.fillStyle; g.lineWidth = Math.max(3, os * 0.09); g.beginPath(); g.moveTo(ox - 4, base - os * 0.33); g.lineTo(ox + ow + 4, base - os * 0.33); g.stroke();
          }
        }
        g.restore();
        mark(al === "center" ? x + (maxW - w) / 2 : x, y, w, h);
        return { w, h };
      },
      /* badge chips (wrap onto rows). o: size, bg, fg, stroke, align, max, measure, radius, dot */
      chips(x, y, maxW, o = {}) {
        const list = t.badges.slice(0, o.max ?? 4);
        if (!list.length) return { h: 0, w: 0 };
        const s = o.size || 2.8 * u, padX = s * 0.72, padY = s * 0.46, gap = s * 0.45, ch = s + padY * 2;
        g.font = d.font("body", s, 700);
        const rows = [[]]; let rw = 0;
        list.forEach((b) => { const w = g.measureText(b).width + padX * 2 + (o.dot ? s * 0.9 : 0); if (rows[rows.length - 1].length && rw + gap + w > maxW) { rows.push([]); rw = 0; } rows[rows.length - 1].push({ b, w }); rw += (rw ? gap : 0) + w; });
        const h = rows.length * ch + (rows.length - 1) * gap;
        const w = Math.max(...rows.map((r) => r.reduce((a, cc) => a + cc.w, 0) + gap * (r.length - 1)));
        if (o.measure) return { h, w };
        rows.forEach((row, i) => {
          const tw = row.reduce((a, cc) => a + cc.w, 0) + gap * (row.length - 1);
          let cx = o.align === "center" ? x + (maxW - tw) / 2 : o.align === "right" ? x + maxW - tw : x;
          const cy = y + i * (ch + gap);
          row.forEach((cc) => {
            g.fillStyle = o.bg || "rgba(255,255,255,.16)"; rrPath(0, g, cx, cy, cc.w, ch, o.radius ?? ch / 2); g.fill();
            if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = Math.max(1.5, s * 0.07); g.stroke(); }
            let tx = cx + padX;
            if (o.dot) { g.fillStyle = o.dot; g.beginPath(); g.arc(tx + s * 0.25, cy + ch / 2, s * 0.22, 0, Math.PI * 2); g.fill(); tx += s * 0.9; }
            g.fillStyle = o.fg || "#fff"; g.font = d.font("body", s, 700); g.textBaseline = "middle"; g.textAlign = "left"; g.fillText(cc.b, tx, cy + ch / 2 + s * 0.05);
            mark(cx, cy, cc.w, ch);
            cx += cc.w + gap;
          });
        });
        return { h, w };
      },
      /* call-to-action button. o: size, bg, fg, align, maxW, style pill|block|outline|underline|sharp, radius (px, overrides
         the style's corner; 0 = sharp), arrow, upper, measure */
      cta(x, y, o = {}) {
        if (!t.cta) return { w: 0, h: 0 };
        const s = o.size || 3.4 * u, txt = o.upper ? t.cta.toUpperCase() : t.cta, label = o.arrow === false ? txt : `${txt}  →`;
        g.font = d.font("body", s, 700);
        const tw = g.measureText(label).width, w = o.style === "underline" ? tw : tw + s * 1.8, h = o.style === "underline" ? s * 1.5 : s * 2.2;
        if (o.measure) return { w, h };
        const al = o.align || "left", maxW = o.maxW || w;
        const bx = al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x;
        const r = o.radius ?? (o.style === "sharp" ? 0 : o.style === "block" ? s * 0.3 : h / 2);
        g.save();
        if (o.style === "outline") { g.strokeStyle = o.bg || "#fff"; g.lineWidth = Math.max(2, s * 0.08); rrPath(0, g, bx, y, w, h, r); g.stroke(); g.fillStyle = o.fg || o.bg || "#fff"; }
        else if (o.style === "underline") { g.fillStyle = o.fg || "#fff"; g.fillRect(bx, y + h - s * 0.12, w, s * 0.1); }
        else { g.fillStyle = o.bg || "#fff"; rrPath(0, g, bx, y, w, h, r); g.fill(); g.fillStyle = o.fg || "#14110D"; }
        g.font = d.font("body", s, 700); g.textBaseline = "middle"; g.textAlign = "center";
        g.fillText(label, bx + w / 2, y + (o.style === "underline" ? h * 0.42 : h / 2 + s * 0.05));
        g.restore();
        mark(bx, y, w, h);
        return { w, h, x: bx };
      },
      /* star rating. Returns width. */
      stars(x, y, size, o = {}) {
        const rating = o.rating ?? t.rating ?? 5, gap = size * 0.18;
        for (let i = 0; i < 5; i++) {
          const cx = x + size / 2 + i * (size + gap), cy = y + size / 2, fillPart = Math.max(0, Math.min(1, rating - i));
          d.star(cx, cy, size / 2, o.empty || "rgba(255,255,255,.25)");
          if (fillPart > 0) { g.save(); g.beginPath(); g.rect(cx - size / 2, y, size * fillPart, size); g.clip(); d.star(cx, cy, size / 2, o.color || "#FFC83D"); g.restore(); }
        }
        return 5 * size + 4 * gap;
      },
      /* corner sticker. shape: burst | circle | badge | tag | ribbon. Text defaults to the chosen sticker / auto % off. */
      sticker(cx, cy, R, o = {}) {
        const text = o.text ?? t.stickerText;
        if (!text) return false;
        g.save(); g.translate(cx, cy); g.rotate(o.rot ?? -0.22);
        g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = o.shadow === false ? 0 : 2.6 * u;
        g.fillStyle = o.fill || c.sale; g.beginPath();
        const shape = o.shape || "burst";
        if (shape === "circle") g.arc(0, 0, R, 0, Math.PI * 2);
        else if (shape === "badge") { for (let i = 0; i < 24; i++) { const r = i % 2 ? R * 0.93 : R, a = (i / 24) * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } }
        else if (shape === "tag") { g.moveTo(-R * 1.25, -R * 0.55); g.lineTo(R * 0.95, -R * 0.55); g.lineTo(R * 1.35, 0); g.lineTo(R * 0.95, R * 0.55); g.lineTo(-R * 1.25, R * 0.55); g.closePath(); }
        else if (shape === "ribbon") { g.moveTo(-R * 1.5, -R * 0.42); g.lineTo(R * 1.5, -R * 0.42); g.lineTo(R * 1.25, 0); g.lineTo(R * 1.5, R * 0.42); g.lineTo(-R * 1.5, R * 0.42); g.lineTo(-R * 1.25, 0); g.closePath(); }
        else { const n = 18; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * 0.86 : R, a = (i / (n * 2)) * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } }
        g.closePath(); g.fill(); g.shadowBlur = 0;
        if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = Math.max(2, R * 0.05); g.stroke(); }
        const boxW = shape === "tag" || shape === "ribbon" ? R * 2.2 : R * 1.45, boxH = shape === "tag" || shape === "ribbon" ? R * 0.7 : R * 1.2;
        const F2 = d.fit(text, boxW, 2, R * 0.52, R * 0.18, o.kind || "display", 800);
        g.fillStyle = o.fg || "#14110D"; g.textAlign = "center"; g.textBaseline = "top";
        const lh = F2.size * 1.02, total = F2.lines.length * lh;
        F2.lines.forEach((l, i) => g.fillText(l, 0, -Math.min(total, boxH) / 2 + i * lh + F2.size * 0.04));
        g.restore();
        mark(cx - R, cy - R, R * 2, R * 2);
        return true;
      },

      /* ---------- layout helper: stack of parts that shrinks to fit ---------- */
      /* o: parts[] of logo|brand|head|sub|price|chips|proof|ends|cta, maxW, align, sizes {head, sub, price, chip, cta, brand},
            headLines, colors c:{brand, head, hi, hiBg, sub, price, old, chipBg, chipFg, chipStroke, ctaBg, ctaFg, ctaStyle, ctaRadius, ctaUpper, logoPlate, logoPlateRadius, proof, stars}, gap */
      block(o) {
        const fct = o.f ?? 1, al = o.align || "left", parts = [], gap = (o.gap || 2.4 * u) * fct, cc = o.c || {}, maxW = o.maxW || k.maxW;
        const has = (p) => o.parts.includes(p);
        const ax = (x, w) => (al === "center" ? x + (maxW - w) / 2 : al === "right" ? x + maxW - w : x);
        if (has("logo") && (d.hasLogo || t.brand)) { const lh = (o.logoH || 5 * u) * fct; parts.push({ h: lh, draw: (x, y) => d.logo(x, y, maxW, lh, { align: al, color: cc.brand || "#fff", size: (o.brand || 2.8 * u) * fct, tint: cc.logoTint, plate: cc.logoPlate, plateRadius: cc.logoPlateRadius }) }); }
        if (has("brand") && t.brand) { const s = (o.brand || 2.8 * u) * fct; parts.push({ h: s * 1.25, draw: (x, y) => d.text(t.brand, x, y, { size: s, kind: "body", weight: 700, color: cc.brand || "rgba(255,255,255,.8)", align: al, maxW, upper: true, letter: 0.1, lines: 1 }) }); }
        if (has("head") && t.headline) {
          const m = d.headline(0, 0, { measure: true, size: (o.head || 8 * u) * fct, lines: o.headLines || 3, maxW, kind: o.headKind, weight: o.headWeight, upper: o.headUpper });
          parts.push({ h: m.h, draw: (x, y) => d.headline(x, y, { size: (o.head || 8 * u) * fct, lines: o.headLines || 3, maxW, align: al, color: cc.head || "#fff", hi: cc.hi, hiBg: cc.hiBg, kind: o.headKind, weight: o.headWeight, upper: o.headUpper, shadow: cc.headShadow }) });
        }
        if (has("sub") && t.sub) { const s = (o.sub || 3.2 * u) * fct; const m = d.text(t.sub, 0, 0, { measure: true, size: s, kind: "body", weight: 500, maxW, lines: 2, lh: 1.25 }); parts.push({ h: m.h, draw: (x, y) => d.text(t.sub, x, y, { size: s, kind: "body", weight: 500, color: cc.sub || "rgba(255,255,255,.8)", align: al, maxW, lines: 2, lh: 1.25 }) }); }
        if (has("price") && t.price) { const ps = (o.price || 7.5 * u) * fct; const m = d.price(0, 0, { measure: true, size: ps }); parts.push({ h: m.h, draw: (x, y) => d.price(x, y, { size: ps, color: cc.price || "#fff", oldColor: cc.old, prefixColor: cc.prefix, align: al, maxW }) }); }
        if (has("chips") && t.badges.length) { const cs = (o.chip || 2.8 * u) * fct; const m = d.chips(0, 0, maxW, { measure: true, size: cs, max: o.maxChips }); parts.push({ h: m.h, draw: (x, y) => d.chips(x, y, maxW, { size: cs, bg: cc.chipBg, fg: cc.chipFg, stroke: cc.chipStroke, align: al, max: o.maxChips }) }); }
        if (has("proof") && (t.proof || t.rating)) {
          const s = (o.proofSize || 2.8 * u) * fct;
          parts.push({ h: s * 1.3, draw: (x, y) => {
            let w = 0; g.font = d.font("body", s, 600); const pw = t.proof ? g.measureText((t.ratingText ? `${t.ratingText} · ` : "") + t.proof).width : 0;
            const sw = t.rating ? 5 * s * 1.1 + 4 * s * 0.2 : 0; w = sw + (pw ? s * 0.6 + pw : 0);
            let xx = ax(x, w);
            if (t.rating) { d.stars(xx, y + s * 0.1, s * 1.1, { color: cc.stars, empty: cc.starsEmpty }); xx += sw + s * 0.6; }
            if (pw) d.text((t.ratingText ? `${t.ratingText} · ` : "") + t.proof, xx, y + s * 0.12, { size: s, kind: "body", weight: 600, color: cc.proof || "rgba(255,255,255,.85)", lines: 1, maxW: pw + 4 });
          } });
        }
        if (has("ends") && t.endsText) {
          const s = (o.endsSize || 2.6 * u) * fct;
          parts.push({ h: s * 1.3, draw: (x, y) => {
            // drawn clock icon + text (no emoji: they render inconsistently on canvas)
            const col = cc.ends || cc.sub || "rgba(255,255,255,.85)", ic = s * 1.05, gap = s * 0.4;
            const m = d.text(t.endsText, 0, 0, { measure: true, size: s, kind: "body", weight: 700, maxW: maxW - ic - gap, lines: 1 });
            const w = ic + gap + m.w, sx = ax(x, w), cy = y + s * 0.62, r = ic / 2;
            g.save(); g.strokeStyle = col; g.lineWidth = Math.max(1.5, s * 0.12); g.lineCap = "round";
            g.beginPath(); g.arc(sx + r, cy, r * 0.88, 0, Math.PI * 2); g.stroke();
            g.beginPath(); g.moveTo(sx + r, cy - r * 0.5); g.lineTo(sx + r, cy); g.lineTo(sx + r + r * 0.4, cy + r * 0.25); g.stroke();
            g.restore();
            d.text(t.endsText, sx + ic + gap, y, { size: s, kind: "body", weight: 700, color: col, maxW: maxW - ic - gap, lines: 1 });
          } });
        }
        if (has("cta") && t.cta) { const s = (o.cta || 3.4 * u) * fct; const m = d.cta(0, 0, { measure: true, size: s, style: cc.ctaStyle, upper: cc.ctaUpper }); parts.push({ h: m.h, extra: gap * 0.5, draw: (x, y) => d.cta(x, y, { size: s, bg: cc.ctaBg, fg: cc.ctaFg, align: al, maxW, style: cc.ctaStyle, radius: cc.ctaRadius, upper: cc.ctaUpper }) }); }
        const total = parts.reduce((a, p, i) => a + p.h + (i ? gap + (p.extra || 0) : 0), 0);
        return { h: total, draw: (x, y) => { let yy = y; parts.forEach((p, i) => { if (i) yy += gap + (p.extra || 0); p.draw(x, yy); yy += p.h; }); } };
      },
      /* shrink the block (applying the size boost + the user's text scale) until it fits `avail` px of height */
      fitBlock(avail, o) {
        const start = (o.boost ?? k.boost) * (st.textScale || 1);
        for (let fct = start; fct >= 0.5; fct -= 0.04) { const b = d.block({ ...o, f: fct }); if (b.h <= avail) return b; }
        return d.block({ ...o, f: 0.5 });
      },
    };
    d.getTextArea = () => textArea;
    d.getMarks = () => marks;
    /* group text boxes so the overlap lint ignores boxes from the same element (e.g. lines of one headline) */
    d.tag = (name) => { markTag = name || ""; };
    // tag every helper's boxes automatically
    ["text", "headline", "price", "chips", "cta", "sticker", "logo"].forEach((fn) => {
      const orig = d[fn];
      d[fn] = function (...a) { const prev = markTag; markTag = `${fn}#${++tagSeq}`; try { return orig.apply(this, a); } finally { markTag = prev; } };
    });
    return d;
  }

  /* ============================== registry + render ============================== */
  const layouts = {};
  const order = [];
  const GROUPS = { everyday: "Everyday", sale: "Sale & urgency", festive: "Festive & Bangladeshi", premium: "Premium", trust: "Trust & proof", bold: "Bold & youth" };
  function register(def) {
    if (!def || !def.id || typeof def.draw !== "function") { console.warn("[ad studio] bad layout", def); return; }
    if (!layouts[def.id]) order.push(def.id);
    layouts[def.id] = { photos: 1, cutout: "optional", group: "everyday", ...def };
    document.dispatchEvent(new CustomEvent("grs:layout", { detail: def.id }));
  }
  const stats = {};
  /* draw `st` at `size` into `canvas`. assets = { photos: [{img, cutout}], logo }. Returns { textPct } */
  function render(canvas, size, st, assets, opts = {}) {
    const S = SIZES[size] || SIZES.square;
    const scale = opts.scale || 1;
    if (canvas.width !== Math.round(S.w * scale) || canvas.height !== Math.round(S.h * scale)) { canvas.width = Math.round(S.w * scale); canvas.height = Math.round(S.h * scale); }
    const g = canvas.getContext("2d");
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.clearRect(0, 0, S.w, S.h);
    const full = { ...DEFAULTS, ...st, badges: { ...DEFAULTS.badges, ...(st.badges || {}) }, adjust: { ...DEFAULTS.adjust, ...(st.adjust || {}) } };
    const L = layouts[full.template] || layouts[order[0]];
    const d = makeKit(g, size, full, assets || {});
    g.save();
    try { if (L) L.draw(d); }
    catch (e) {
      console.error(`[ad studio] layout "${L && L.id}" failed at ${size}`, e);
      g.restore(); g.save();
      g.fillStyle = "#2a0d10"; g.fillRect(0, 0, S.w, S.h); g.fillStyle = "#ff8f80"; g.font = '700 34px "Inter", sans-serif'; g.textBaseline = "top";
      g.fillText(`Style "${L && L.id}" hit an error at ${size}`, 40, 40); g.font = '500 24px "Inter", sans-serif'; g.fillText(String(e && e.message || e).slice(0, 80), 40, 90);
    }
    g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0);
    stats[size] = { textPct: d.getTextArea() / (S.w * S.h), marks: d.getMarks(), W: S.w, H: S.h };
    return stats[size];
  }

  /* load layout files listed in GRS.manifest, in order. A missing file is skipped, never fatal. */
  function load(base) {
    const list = (window.GRS && GRS.manifest) || [];
    return Promise.all(list.map((id) => new Promise((res) => {
      if (layouts[id]) return res(id);
      const s = document.createElement("script");
      s.src = `${base}${id}.js`; s.async = false;
      s.onload = () => res(id); s.onerror = () => { console.warn(`[ad studio] layout file missing: ${id}`); res(null); };
      document.head.appendChild(s);
    }))).then(() => {
      // keep the manifest order no matter which file registered first
      order.sort((a, b) => list.indexOf(a) - list.indexOf(b));
      return order.slice();
    });
  }

  /* load the fonts a pairing needs (so canvas text isn't drawn in a fallback face) */
  function ensureFonts(key) {
    if (!document.fonts) return Promise.resolve();
    const F = FONTS[key] || FONTS.modern;
    const loads = [
      document.fonts.load(`${F.dW} 60px ${F.display}`), document.fonts.load(`700 60px ${F.bn}`, "অআ৳০"),
      document.fonts.load('700 30px "Inter"'), document.fonts.load('700 30px "Noto Sans Bengali"', "অআ৳০"),
    ];
    return Promise.all(loads).catch(() => {});
  }
  function ensureAllFonts() {
    if (!document.fonts) return Promise.resolve();
    return Promise.all(Object.keys(FONTS).map(ensureFonts).concat([
      document.fonts.load('700 60px "Playfair Display"'), document.fonts.load('700 60px "Caveat"'), document.fonts.load('400 60px "Galada"', "অআ"),
      document.fonts.load('700 60px "Noto Serif Bengali"', "অআ"),
    ])).catch(() => {});
  }

  window.GRS = {
    SIZES, FONTS, TEXT, BADGES, STICKERS, GROUPS, DEFAULTS,
    register, layouts, order, render, stats, texts, tokens, ensureFonts, ensureAllFonts, load, manifest: [],
    palette, mix, rgba, lum, onColor, contrast, autoAccent, toBn, placeholder,
  };
})();
