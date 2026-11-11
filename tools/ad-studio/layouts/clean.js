/* Clean: warm off-white, centred headline, the product on a soft card. */
GRS.register({
  id: "clean", name: "Clean", group: "premium", photos: 1, cutout: "optional",
  desc: "Calm off-white, product front and centre",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const bg = d.lum(c.primary) > 0.6 ? "#F6F2EA" : d.mix(c.primary, "#FFFFFF", 0.9);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const ink = c.ink, accent = d.lum(c.primary) > 0.5 ? d.mix(c.primary, "#000000", 0.45) : c.primary;
    const CH = { brand: d.rgba(ink, 0.55), head: ink, hi: accent, sub: d.rgba(ink, 0.7) };
    const CB = { price: accent, old: d.rgba(ink, 0.45), prefix: d.rgba(ink, 0.6), chipBg: "#FFFFFF", chipFg: ink, chipStroke: d.rgba(ink, 0.12), ctaBg: c.primary, ctaFg: c.onPrimary, proof: d.rgba(ink, 0.75), starsEmpty: d.rgba(ink, 0.15), ends: d.rgba(ink, 0.7) };
    const card = (x, y, w, h) => {
      if (d.hasCutout()) {
        g.save(); g.fillStyle = d.mix(bg, "#FFFFFF", 0.6); d.circle(x + w / 2, y + h * 0.55, Math.min(w, h) * 0.46); g.fill(); g.restore();
        d.product(x, y + h * 0.04, w, h * 0.92, { shadowColor: "rgba(20,17,13,.2)" });
        return;
      }
      g.save(); g.shadowColor = "rgba(20,17,13,.18)"; g.shadowBlur = 5 * u; g.shadowOffsetY = 2 * u; g.fillStyle = "#fff"; d.rr(x, y, w, h, 4 * u); g.fill(); g.restore();
      d.photo(x, y, w, h, { clip: () => d.rr(x, y, w, h, 4 * u) });
    };

    if (k.landscape) {
      const pw = W * 0.42, px = W - k.side - pw, ph = H - k.top - k.bottom;
      card(px, k.top, pw, ph);
      d.sticker(px + pw - 2 * u, k.top + 5 * u, 8.5 * u, { fill: c.primary, fg: c.onPrimary });
      const colW = px - k.side - 6 * u;
      const b = d.fitBlock(ph, { parts: ["logo", "head", "sub", "price", "chips", "proof", "ends", "cta"], maxW: colW, align: d.align("left"), head: 7.5 * u, headLines: 2, price: 8 * u, chip: 2.7 * u, cta: 3.4 * u, logoH: 4 * u, c: { ...CH, ...CB, brand: ink } });
      b.draw(k.side, k.top + Math.max(0, (ph - b.h) / 2));
      return;
    }

    const al = d.align("center"), bx = al === "center" ? (W - k.maxW) / 2 : k.side;
    const head = d.fitBlock(k.story ? H * 0.15 : H * 0.22, { parts: ["logo", "head", "sub"], maxW: k.maxW, align: al, head: 7.5 * u, headLines: 2, logoH: 4.4 * u, c: { ...CH, brand: ink } });
    head.draw(bx, k.top);
    const bottom = d.fitBlock(k.story ? H * 0.22 : H * 0.3, { parts: ["price", "chips", "proof", "ends", "cta"], maxW: k.maxW, align: al, price: 8.5 * u, chip: 2.7 * u, cta: 3.4 * u, c: CB });
    const by = H - k.bottom - bottom.h;
    const py = k.top + head.h + 5 * u, ph = by - 5 * u - py, pw = Math.min(W - k.side * 2, ph * 1.1), px = (W - pw) / 2;
    card(px, py, pw, ph);
    d.sticker(px + pw - 3 * u, py + 5 * u, 8.5 * u, { fill: c.primary, fg: c.onPrimary });
    bottom.draw(bx, by);
  },
});
