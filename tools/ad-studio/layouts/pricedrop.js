/* Price drop: photo card on a brand gradient, the price as the hero. */
GRS.register({
  id: "pricedrop", name: "Price drop", group: "sale", photos: 1, cutout: "no",
  desc: "Huge price, photo card, sale sticker",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, c.primary); gr.addColorStop(1, c.deep);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,.07)";
    d.circle(W * 0.9, H * 0.12, Math.max(W, H) * 0.4); g.fill();
    d.circle(W * 0.05, H * 0.82, Math.max(W, H) * 0.34); g.fill();
    const C = { logoPlate: "#FFFFFF", brand: "rgba(255,255,255,.75)", head: "rgba(255,255,255,.94)", hi: c.sale, sub: "rgba(255,255,255,.8)", price: "#FFFFFF", old: "rgba(255,255,255,.65)", chipBg: "rgba(255,255,255,.14)", chipFg: "#FFFFFF", chipStroke: "rgba(255,255,255,.25)", ctaBg: c.sale, ctaFg: c.ink, proof: "rgba(255,255,255,.88)" };
    const parts = ["head", "sub", "price", "chips", "proof", "ends", "cta"];
    const card = (x, y, w, h) => {
      g.save(); g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 4 * u; g.shadowOffsetY = 1.6 * u; g.fillStyle = "#fff"; d.rr(x, y, w, h, 3.4 * u); g.fill(); g.restore();
      d.photo(x, y, w, h, { clip: () => d.rr(x, y, w, h, 3.4 * u) });
    };

    if (k.landscape) {
      const cs = H - k.top - k.bottom, cx = k.side, cy = k.top;
      card(cx, cy, cs, cs);
      d.sticker(cx + cs - 2 * u, cy + cs - 4 * u, 12 * u, { rot: -0.18 });
      const x = cx + cs + 7 * u, colW = W - x - k.side;
      const b = d.fitBlock(H - k.top - k.bottom, { parts: ["logo", ...parts], maxW: colW, align: d.align("center"), head: 6.4 * u, headLines: 2, price: 14 * u, chip: 2.8 * u, cta: 3.4 * u, logoH: 4 * u, c: C });
      b.draw(x, k.top + Math.max(0, (H - k.top - k.bottom - b.h) / 2));
      return;
    }

    const ch = k.story ? H * 0.38 : k.square ? H * 0.44 : H * 0.47;
    const cx = k.side, cy = k.top, cw = W - k.side * 2;
    card(cx, cy, cw, ch);
    d.logo(cx + 3 * u, cy + 3 * u, cw * 0.5, 5 * u, { color: "#FFFFFF", fallbackText: false, plate: "#FFFFFF" });
    // sticker sits inside the card's corner so it never collides with the headline below (top corner on 9:16, clear of the Reels buttons)
    d.sticker(cx + cw - 9 * u, k.story ? cy + 12 * u : cy + ch - 12 * u, 12 * u, { rot: -0.18 });
    const top = cy + ch + 6 * u;
    const b = d.fitBlock(H - k.bottom - top, { parts, maxW: k.maxW, align: d.align("center"), head: 6.2 * u, headLines: 2, price: 15 * u, chip: 2.8 * u, cta: 3.4 * u, c: C });
    b.draw((W - k.maxW) / 2, k.story ? top + Math.max(0, (H - k.bottom - top - b.h) / 2) : top);
  },
});
