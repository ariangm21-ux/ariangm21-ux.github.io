/* Spotlight: full-bleed photo, text on a soft brand-coloured shade. */
GRS.register({
  id: "spotlight", name: "Spotlight", group: "everyday", photos: 1, cutout: "no",
  desc: "Full photo with bold text on a soft shade",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const ov = d.overlay;
    d.photo(0, 0, W, H);
    const C = { head: "#FFFFFF", hi: c.sale, sub: "rgba(255,255,255,.86)", price: "#FFFFFF", old: "rgba(255,255,255,.72)", chipBg: "rgba(255,255,255,.16)", chipFg: "#FFFFFF", chipStroke: "rgba(255,255,255,.28)", ctaBg: c.primary, ctaFg: c.onPrimary, proof: "rgba(255,255,255,.9)" };
    const parts = ["head", "sub", "price", "chips", "proof", "ends", "cta"];

    if (k.landscape) {
      const gr = g.createLinearGradient(0, 0, W * 0.78, 0);
      gr.addColorStop(0, d.rgba(c.dark, 0.95 * ov)); gr.addColorStop(0.55, d.rgba(c.dark, 0.74 * ov)); gr.addColorStop(1, d.rgba(c.dark, 0));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const lh = d.logo(k.side, k.top, W * 0.3, 5 * u, { color: "#FFFFFF", plate: "#FFFFFF" }).h;
      d.sticker(W - k.side - 12 * u, k.top + 12 * u, 12 * u);
      const top = k.top + (lh ? lh + 3 * u : 0), colW = W * 0.5;
      const b = d.fitBlock(H - k.bottom - top, { parts, maxW: colW, align: d.align("left"), head: 9 * u, headLines: 3, price: 8 * u, chip: 2.8 * u, cta: 3.4 * u, c: C });
      b.draw(k.side, top + Math.max(0, (H - k.bottom - top - b.h) / 2));
      return;
    }

    let gr = g.createLinearGradient(0, H * 0.3, 0, H);
    gr.addColorStop(0, d.rgba(c.dark, 0)); gr.addColorStop(0.5, d.rgba(c.dark, 0.74 * ov)); gr.addColorStop(1, d.rgba(c.dark, 0.95 * ov));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createLinearGradient(0, 0, 0, k.top + 13 * u); gr.addColorStop(0, d.rgba(c.dark, 0.55 * ov)); gr.addColorStop(1, d.rgba(c.dark, 0));
    g.fillStyle = gr; g.fillRect(0, 0, W, k.top + 13 * u);
    d.logo(k.side, k.top, W * 0.45, 5 * u, { color: "#FFFFFF", plate: "#FFFFFF" });
    d.sticker(W - k.side - 11 * u, k.top + 12 * u, 11 * u);
    const al = d.align("left");
    const b = d.fitBlock(H - k.bottom - H * 0.38, { parts, maxW: k.maxW, align: al, head: 9.2 * u, headLines: 3, price: 8.5 * u, chip: 3 * u, cta: 3.6 * u, c: C });
    b.draw(al === "center" ? (W - k.maxW) / 2 : k.side, H - k.bottom - b.h);
  },
});
