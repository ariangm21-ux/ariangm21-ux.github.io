/* Eid: deep jewel background, gold stars, crescent and an arch-framed photo. */
GRS.register({
  id: "festive", name: "Eid", group: "festive", photos: 1, cutout: "no",
  desc: "Gold crescent, arch window, Eid Mubarak",
  draw(d) {
    const { g, W, H, k, t, c, u } = d;
    const GOLD = c.gold;
    const deep = d.mix(c.primary, "#04120D", 0.74);
    const gr = g.createRadialGradient(W / 2, H * 0.4, 5 * u, W / 2, H * 0.4, Math.max(W, H) * 0.8);
    gr.addColorStop(0, d.mix(deep, "#ffffff", 0.08)); gr.addColorStop(1, d.mix(deep, "#000000", 0.35));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const R = d.rnd(7);
    for (let i = 0; i < 46; i++) d.star(R() * W, R() * H, 0.2 * u + R() * 0.5 * u, d.rgba(GOLD, 0.25 + R() * 0.35));
    const in1 = 2.4 * u, in2 = 3.7 * u;
    g.strokeStyle = d.rgba(GOLD, 0.7); g.lineWidth = 0.3 * u; d.rr(in1, in1, W - in1 * 2, H - in1 * 2, 2.8 * u); g.stroke();
    g.strokeStyle = d.rgba(GOLD, 0.3); g.lineWidth = 0.14 * u; d.rr(in2, in2, W - in2 * 2, H - in2 * 2, 2 * u); g.stroke();
    const C = { brand: d.rgba(GOLD, 0.8), head: "#FFFFFF", hi: GOLD, sub: "rgba(255,255,255,.8)", price: GOLD, old: "rgba(255,255,255,.6)", chipBg: d.rgba(GOLD, 0.14), chipFg: GOLD, chipStroke: d.rgba(GOLD, 0.45), ctaBg: GOLD, ctaFg: c.ink, proof: "rgba(255,255,255,.85)", stars: GOLD };
    const parts = ["head", "sub", "price", "chips", "proof", "ends", "cta"];
    const festive = t.festive;

    // crescent + festive line, centred in a column
    const crest = (cx, y, colW) => {
      const cr = 3.5 * u;
      g.font = d.font("display", 5.2 * u);
      const fw = festive ? Math.min(g.measureText(festive).width, colW - cr * 3) : 0, groupW = cr * 2.4 + (festive ? 2 * u + fw : 0), gx = cx - groupW / 2;
      d.crescent(gx + cr, y + cr, cr, GOLD); d.star(gx + cr * 2.25, y + cr * 0.55, cr * 0.32, GOLD);
      if (festive) d.text(festive, gx + cr * 2.4 + 2 * u, y + cr - 2.9 * u, { size: 5.2 * u, color: GOLD, maxW: fw + 2, lines: 1 });
      return cr * 2;
    };
    const archPath = (x, y, w, h) => () => { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); };
    const arch = (x, y, w, h) => {
      const p = archPath(x, y, w, h);
      d.photo(x, y, w, h, { clip: p });
      p(); g.strokeStyle = GOLD; g.lineWidth = 0.6 * u; g.stroke();
    };

    if (k.landscape) {
      const ah = H - k.top - k.bottom, aw = Math.min(ah * 0.78, W * 0.36), ax = k.side + 2 * u;
      arch(ax, k.top, aw, ah);
      d.sticker(ax + aw - 1 * u, k.top + aw * 0.3, 9.5 * u, { fill: GOLD, rot: 0.18 });
      const x = ax + aw + 7 * u, colW = W - x - k.side - 2 * u;
      const ch = crest(x + colW / 2, k.top, colW) + 3 * u;
      const b = d.fitBlock(H - k.top - ch - k.bottom, { parts, maxW: colW, align: d.align("center"), head: 7 * u, headLines: 2, price: 8 * u, chip: 2.7 * u, cta: 3.3 * u, c: C });
      b.draw(x, k.top + ch + Math.max(0, (H - k.top - ch - k.bottom - b.h) / 2));
      return;
    }

    const fy = k.top + u;
    const crH = crest(W / 2, fy, k.maxW);
    const aw = W * 0.62, ay = fy + crH + 5 * u, ah = k.story ? H * 0.3 : k.square ? H * 0.43 : H * 0.47, axp = (W - aw) / 2;
    arch(axp, ay, aw, ah);
    d.sticker(axp + aw - u, ay + aw * 0.28, 9.5 * u, { fill: GOLD, rot: 0.18 });
    const top = ay + ah + 5 * u;
    const b = d.fitBlock(H - k.bottom - top, { parts, maxW: k.maxW, align: d.align("center"), head: 7 * u, headLines: 2, price: 8 * u, chip: 2.7 * u, cta: 3.3 * u, c: C });
    b.draw((W - k.maxW) / 2, k.story ? top + Math.max(0, (H - k.bottom - top - b.h) / 2) : top);
  },
});
