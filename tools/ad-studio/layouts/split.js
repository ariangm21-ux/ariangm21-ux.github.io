/* Split: photo on top, a solid brand-colour panel with the offer below. */
GRS.register({
  id: "split", name: "Split", group: "everyday", photos: 1, cutout: "no",
  desc: "Photo above, offer on a solid colour panel",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const fg = c.onPrimary;
    const C = { brand: d.rgba(fg, 0.72), head: fg, hi: fg === "#FFFFFF" ? c.sale : c.deep, sub: d.rgba(fg, 0.8), price: fg, old: d.rgba(fg, 0.6), chipBg: d.rgba(fg, 0.12), chipFg: fg, ctaBg: fg, ctaFg: c.primary, proof: d.rgba(fg, 0.85), logoPlate: "#FFFFFF", stars: fg === "#FFFFFF" ? "#FFC83D" : c.ink, starsEmpty: d.rgba(fg, 0.25) };
    const parts = ["logo", "head", "sub", "price", "chips", "proof", "ends", "cta"];

    if (k.landscape) {
      const pw = W * 0.46;
      d.photo(0, 0, pw + 6 * u, H);
      g.fillStyle = c.primary; d.rr(pw, 0, W - pw + 10 * u, H, 8 * u); g.fill();
      d.sticker(pw - 3 * u, H - k.bottom - 9 * u, 9 * u);
      const x = pw + 7 * u, colW = W - x - k.side;
      const b = d.fitBlock(H - k.top - k.bottom, { parts, maxW: colW, align: d.align("left"), head: 8 * u, headLines: 2, price: 7.5 * u, chip: 2.8 * u, cta: 3.4 * u, logoH: 4.4 * u, c: C });
      b.draw(x, k.top + Math.max(0, (H - k.top - k.bottom - b.h) / 2));
      return;
    }

    const ph = k.story ? H * 0.42 : k.square ? H * 0.55 : H * 0.58;
    d.photo(0, 0, W, ph + 6 * u);
    g.fillStyle = c.primary; d.rr(0, ph, W, H - ph + 8 * u, 5.2 * u); g.fill();
    // on 9:16 keep the sticker above the Reels buttons (right side, 45–80% height)
    d.sticker(W - k.side - 10 * u, k.story ? Math.min(ph - 2 * u, H * 0.45 - 11 * u) : ph - 2 * u, 10 * u);
    const top = ph + 6.5 * u, al = d.align("left");
    const b = d.fitBlock(H - k.bottom - top, { parts, maxW: k.maxW, align: al, head: 8 * u, headLines: 2, price: 7.5 * u, chip: 2.8 * u, cta: 3.4 * u, logoH: 4.4 * u, c: C });
    b.draw(al === "center" ? (W - k.maxW) / 2 : k.side, k.story ? top + Math.max(0, (H - k.bottom - top - b.h) / 2) : top);
  },
});
