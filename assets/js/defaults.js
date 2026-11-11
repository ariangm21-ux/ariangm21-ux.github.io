/* Default settings + content for the site. Also the starting point for the admin panel.
   The local server serves published overrides in assets/js/site-data.js (window.GR_SETTINGS / GR_CONTENT);
   this file merges them over the defaults into window.GR_CFG. */
window.GR_DEFAULTS = {
  settings: {
    theme: "graphite",
    themeVersion: 1,
    showThemeSwitcher: true,
    business: {
      name: "Greyrock Digital",
      whatsapp: "8801XXXXXXXXX",
      waMessage: "Hi Greyrock! I'd like a free ad audit for my business.",
      email: "hello@truegreyrock.digital",
      address: "Dhaka, Bangladesh",
      facebook: "", instagram: "", linkedin: "", tiktok: "",
    },
    slots: { left: 4, total: 10 },
    nudge: {
      enabled: true,
      exit: true,
      scroll: true, scrollDepth: 55,
      time: true, timeSeconds: 45,
      simulator: true,
      exitTitle: "Before you go: want 3 quick wins for your ads?",
      scrollTitle: "Liking what you see? Get a free audit of your ads.",
      timeTitle: "Got 2 minutes? Get a free audit of your ads.",
      sub: "We'll review your page and send 3 fixes on WhatsApp within 24 hours.",
    },
    tracking: { metaPixelId: "", ga4Id: "", capiEnabled: false, apiVersion: "v23.0", sendPipelineEvents: true, siteUrl: "" },
    seo: {
      title: "Greyrock Digital: Performance Marketing for Bangladeshi Brands",
      description: "Greyrock Digital runs Facebook, Instagram, Google and TikTok ads for Bangladeshi brands, and we're measured on revenue, not reach. Get a free ad audit.",
    },
    team: [],
    waTemplates: [
      { name: "First reply", text: "Hi {name}! This is Greyrock Digital 👋 Thanks for requesting a free ad audit{forUrl}. We're reviewing it now and will send your 3 quick wins shortly." },
      { name: "Audit ready", text: "Hi {name}, your ad audit is ready! Found a few quick wins that could lift your sales. Do you have 15 minutes today or tomorrow for a quick call?" },
      { name: "Follow-up", text: "Hi {name}, just following up on your free ad audit from Greyrock Digital. Still keen to grow your {industry} sales this month?" },
    ],
  },

  content: {
    hero: {
      line1: "Turn every ৳1 in ads",
      line2: "into",
      line2Grad: "৳5 in sales.",
      sub: "Greyrock Digital runs Facebook, Instagram, Google & TikTok ads for Bangladeshi brands. We're measured on *revenue*, not reach.",
      stats: [
        { label: "Average ROAS", prefix: "", value: 5, decimals: 0, suffix: "x" },
        { label: "Revenue driven for clients", prefix: "৳", value: 12, decimals: 0, suffix: " Cr+" },
        { label: "Ad spend managed", prefix: "৳", value: 2.5, decimals: 1, suffix: " Cr+" },
        { label: "Brands scaled", prefix: "", value: 40, decimals: 0, suffix: "+" },
      ],
    },

    // simulator assumptions: roas = typical ROAS at ৳10K–50K/mo, aov = average order value
    industries: [
      { id: "fashion", label: "Fashion", roas: 5.2, aov: 1850, products: ["Cotton panjabi", "Jamdani saree", "Denim jacket", "3-piece kurti set", "Leather loafers"] },
      { id: "beauty", label: "Beauty", roas: 5.8, aov: 1400, products: ["Vitamin C serum", "Sunscreen SPF 50", "Lip tint duo", "Onion hair oil", "Skincare bundle"] },
      { id: "food", label: "Food & cafés", roas: 4.6, aov: 650, products: ["Kacchi platter", "Burger combo", "Family meal box", "2 lb chocolate cake", "Fuchka party pack"] },
      { id: "electronics", label: "Gadgets", roas: 4.2, aov: 4500, products: ["TWS earbuds", "Smart watch", "20000mAh power bank", "Bluetooth speaker", "Mechanical keyboard"] },
      { id: "education", label: "Courses", roas: 4.8, aov: 3200, products: ["IELTS course", "Excel masterclass", "Freelancing bootcamp", "Spoken English", "Graphic design course"] },
    ],

    cases: [
      { ind: "fashion", brand: "Dhaka menswear brand", days: 90, big: "5.8x", bigLabel: "ROAS on delivered orders",
        rows: [{ label: "ROAS", before: "1.6x", after: "5.8x" }, { label: "Monthly revenue", before: "৳4.2L", after: "৳21.5L" }], series: [1.6, 1.9, 2.4, 3.1, 3.8, 4.4, 5.1, 5.8], placeholder: true },
      { ind: "beauty", brand: "Skincare D2C brand", days: 75, big: "6.4x", bigLabel: "ROAS",
        rows: [{ label: "Return rate", before: "28%", after: "11%" }, { label: "Monthly revenue", before: "৳2.8L", after: "৳16.9L" }], series: [2.1, 2.3, 3.0, 3.9, 4.6, 5.5, 6.0, 6.4], placeholder: true },
      { ind: "food", brand: "Cloud kitchen, Chattogram", days: 60, big: "5.3x", bigLabel: "more daily orders",
        rows: [{ label: "Orders / day", before: "18", after: "96" }, { label: "Cost per order", before: "৳142", after: "৳58" }], series: [18, 22, 31, 44, 58, 70, 84, 96], placeholder: true },
      { ind: "electronics", brand: "Gadget shop, Elephant Road", days: 120, big: "4.1x", bigLabel: "ROAS",
        rows: [{ label: "ROAS", before: "1.3x", after: "4.1x" }, { label: "Monthly revenue", before: "৳6.5L", after: "৳28L" }], series: [1.3, 1.5, 1.9, 2.4, 2.9, 3.3, 3.8, 4.1], placeholder: true },
      { ind: "education", brand: "Online IELTS academy", days: 60, big: "−67%", bigLabel: "cost per enrolment",
        rows: [{ label: "Cost / enrolment", before: "৳2,400", after: "৳780" }, { label: "Enrolments / mo", before: "38", after: "164" }], series: [38, 45, 61, 80, 102, 125, 148, 164], placeholder: true },
      { ind: "fashion", brand: "Ethnic wear brand, Sylhet", days: 45, big: "7.1x", bigLabel: "ROAS during Eid",
        rows: [{ label: "ROAS", before: "2.4x", after: "7.1x" }, { label: "Eid orders", before: "410", after: "2,380" }], series: [2.4, 2.9, 3.6, 4.5, 5.4, 6.2, 6.8, 7.1], placeholder: true },
    ],

    compare: [
      { label: "Optimised for", diy: "Likes & reach", diyS: "no", agency: "Clicks & reach", agencyS: "meh", us: "Delivered orders & revenue", usS: "yes" },
      { label: "Tracking", diy: "None", diyS: "no", agency: "Pixel only", agencyS: "meh", us: "Pixel + Conversions API", usS: "yes" },
      { label: "COD return tracking", diy: "No", diyS: "no", agency: "Rarely", agencyS: "no", us: "Per campaign", usS: "yes" },
      { label: "New creatives", diy: "When you find time", diyS: "no", agency: "A few a month", agencyS: "meh", us: "10–20 tested every month", usS: "yes" },
      { label: "Reporting", diy: "Facebook Insights", diyS: "no", agency: "Monthly PDF", agencyS: "meh", us: "Weekly on WhatsApp + live dashboard", usS: "yes" },
      { label: "Contract", diy: "n/a", diyS: "meh", agency: "3–6 month lock-in", agencyS: "no", us: "Monthly, cancel anytime", usS: "yes" },
      { label: "Team", diy: "Just you", diyS: "meh", agency: "Often outsourced", agencyS: "meh", us: "Dhaka team, Bangla or English", usS: "yes" },
    ],

    chats: [
      { name: "Rafi", role: "Founder · Menswear · Dhaka", msgs: [{ text: "Bhai, Eid er 10 din e 1,400+ order 🔥", us: false }, { text: "Last year boost kore 300 o hoy nai", us: false }, { text: "Next target 2,000 😄", us: true }], placeholder: true },
      { name: "Nusrat", role: "Skincare brand · Dhaka", msgs: [{ text: "Return rate 28% theke 11% e namse. Ki magic korlen?", us: false }, { text: "No magic, delivered-order tracking + better targeting 🙂", us: true }], placeholder: true },
      { name: "Tanvir", role: "Gadget shop · Chattogram", msgs: [{ text: "এই মাসে সেলস ৩ গুণ! ধন্যবাদ টিম গ্রেরক 🙏", us: false }], placeholder: true },
      { name: "Mitu", role: "Cloud kitchen · Chattogram", msgs: [{ text: "Daily order 20 theke 90+", us: false }, { text: "Kitchen e lok barate hobe 😅", us: false }], placeholder: true },
      { name: "Arif", role: "IELTS academy · Dhaka", msgs: [{ text: "Cost per enrolment almost 3 gun kom. Next batch already full.", us: false }], placeholder: true },
      { name: "Sadia", role: "Ethnic wear · Sylhet", msgs: [{ text: "Weekly report ta khub clear.", us: false }, { text: "Finally bujhi taka kothay jacche 👌", us: false }], placeholder: true },
      { name: "Imran", role: "Furniture · Dhaka", msgs: [{ text: "Ekhon shudhu likes na, real buyer ashe.", us: false }, { text: "Showroom visit double hoye gese", us: false }], placeholder: true },
      { name: "Farhana", role: "Kids wear · Dhaka", msgs: [{ text: "Creatives gula on point!", us: false }, { text: "Hook C ta to viral 😍", us: false }, { text: "Scaling it this week 🚀", us: true }], placeholder: true },
    ],

    plans: [
      { name: "Launch", for: "For brands starting with real ads", price: "৳25,000", per: "/month", note: "+ ad spend, paid directly to Meta",
        slotsAuto: true, slotsLeft: 3, slotsTotal: 5, cta: "Start with Launch", popular: false,
        features: ["Facebook & Instagram ads", "Up to ৳1.5 lakh monthly ad spend", "8 new ad creatives / month", "Pixel + Conversions API setup", "Weekly WhatsApp report"], placeholder: true },
      { name: "Growth", for: "For brands ready to scale", price: "৳45,000", per: "/month", note: "+ ad spend, paid directly to Meta / Google / TikTok",
        slotsAuto: true, slotsLeft: 2, slotsTotal: 5, cta: "Get the Growth plan", popular: true,
        features: ["Everything in Launch", "Meta + Google or TikTok", "Up to ৳5 lakh monthly ad spend", "16 new creatives / month", "COD return & delivered-order tracking", "Landing page optimisation", "Bi-weekly strategy call"], placeholder: true },
      { name: "Scale", for: "For established brands", price: "Custom", per: "", note: "Base fee + % of revenue growth: we win when you win",
        slotsAuto: true, slotsLeft: 1, slotsTotal: 3, cta: "Talk to us", popular: false,
        features: ["Everything in Growth", "All channels, full funnel", "Unlimited creative testing", "Dedicated strategist + designer", "Daily monitoring & optimisation", "Monthly growth review with founders"], placeholder: true },
    ],

    faqs: [
      { q: "How is this different from boosting posts?", a: "Boosting optimises for likes and reach. We run conversion campaigns in Ads Manager, optimised for purchases, and measure success on delivered orders and revenue, not engagement." },
      { q: "What's the minimum ad budget?", a: "We recommend at least ৳30,000 a month in ad spend so the algorithm has enough data to learn. If you're below that, we'll tell you honestly whether ads make sense yet." },
      { q: "How fast will I see results?", a: "Weeks 1–4 are for testing, and most clients see a clear upward trend within that window. We don't promise overnight miracles; we promise a system that compounds." },
      { q: "I only sell through my Facebook page. Can you help?", a: "Yes. Most of our clients are f-commerce brands. We run message and conversion campaigns, set up automated replies, and build a simple landing page when it'll lift sales." },
      { q: "Do you lock me into a long contract?", a: "No. All plans are monthly. If we're not delivering, you can leave with 30 days' notice." },
      { q: "Who owns the ad account and the data?", a: "You do, always. We work inside your own Business Manager with partner access, so every campaign, audience and pixel stays yours." },
      { q: "How do you report results?", a: "A weekly report on WhatsApp with spend, orders, delivered revenue and ROAS, plus a live dashboard and a monthly strategy call." },
      { q: "Do you make the ad creatives too?", a: "Yes: static, video and UGC-style ads. Every plan includes a monthly creative quota, and we test new hooks constantly." },
      { q: "Which industries do you work with?", a: "Fashion, beauty, food, gadgets, education, home & lifestyle and more. If you sell online in Bangladesh, we can very likely help." },
    ],
  },
};

/* ONE source of truth for "spots left this month" (hero badge, pricing cards, final CTA, admin, audit).
   settings.slots = the monthly capacity { left, total }. Each plan either has its own numbers
   (slotsAuto === false → slotsLeft / slotsTotal; total 0 hides that plan's counter) or is "auto":
   whatever the manual plans don't use is split across the auto plans (cheaper plans get more).
   The website always shows the sum of the plans, so every number on the page agrees. */
window.GR_SLOTS = function (settings, plans) {
  var S = (settings && settings.slots) || {}, P = plans || [];
  var T = Math.max(1, Math.min(30, Math.round(+S.total || 10)));
  var L = Math.max(0, Math.min(T, Math.round(+S.left || 0)));
  var out = P.map(function (p) {
    var manual = p && p.slotsAuto === false;
    var t = manual ? Math.max(0, Math.round(+p.slotsTotal || 0)) : 0;
    return { auto: !manual, total: t, left: manual ? Math.max(0, Math.min(t, Math.round(+p.slotsLeft || 0))) : 0, hidden: manual && t === 0 };
  });
  var autos = out.filter(function (o) { return o.auto; });
  var mL = 0, mT = 0;
  out.forEach(function (o) { if (!o.auto) { mL += o.left; mT += o.total; } });
  // split n units over the auto plans by weight (largest remainder), each capped by cap[i]
  function split(n, caps) {
    var w = autos.map(function (_, j) { return autos.length - j; }), sumW = w.reduce(function (a, b) { return a + b; }, 0) || 1;
    var got = autos.map(function () { return 0; }), left = n;
    for (var guard = 0; left > 0 && guard < 50; guard++) {
      var open = autos.map(function (_, j) { return caps ? got[j] < caps[j] : true; });
      var openW = w.reduce(function (a, b, j) { return a + (open[j] ? b : 0); }, 0);
      if (!openW) break;
      var raw = w.map(function (x, j) { return open[j] ? (left * x) / openW : 0; });
      var add = raw.map(function (r, j) { return caps ? Math.min(Math.floor(r), caps[j] - got[j]) : Math.floor(r); });
      var given = add.reduce(function (a, b) { return a + b; }, 0);
      // hand out the remainder to the largest fractions
      var order = raw.map(function (r, j) { return [r - Math.floor(r), j]; }).sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; });
      for (var k = 0; k < order.length && given < left; k++) { var j2 = order[k][1]; if (open[j2] && (!caps || got[j2] + add[j2] < caps[j2])) { add[j2]++; given++; } }
      if (!given) break;
      add.forEach(function (a, j) { got[j] += a; }); left -= given;
    }
    return got;
  }
  if (autos.length) {
    var RL = Math.max(0, L - mL), RT = Math.max(RL, T - mT, autos.length);
    var totals = split(RT, null);
    // every auto plan shows at least 1 seat in its counter
    totals = totals.map(function (t) { return Math.max(1, t); });
    var lefts = split(RL, totals);
    autos.forEach(function (o, j) { o.total = totals[j]; o.left = lefts[j]; });
  }
  var sumL = out.reduce(function (a, o) { return a + o.left; }, 0), sumT = out.reduce(function (a, o) { return a + o.total; }, 0);
  var res = {
    left: P.length ? sumL : L, total: P.length ? Math.max(sumT, sumL, 1) : T,
    target: { left: L, total: T }, plans: out,
    overbooked: mL > L,                       // the manual plans promise more spots than the monthly "left" allows
    mismatch: P.length > 0 && sumL !== L,     // the website will show a different "left" than the monthly setting
  };
  return res;
};

/* merge published data over defaults → window.GR_CFG (shared by site + admin) */
window.GR_MERGE = function (settings, content) {
  var D = window.GR_DEFAULTS, S = settings || {}, C = content || {};
  var s = Object.assign({}, D.settings, S);
  ["business", "slots", "nudge", "tracking", "seo"].forEach(function (k) { s[k] = Object.assign({}, D.settings[k], S[k] || {}); });
  var c = Object.assign({}, D.content, C);
  c.hero = Object.assign({}, D.content.hero, C.hero || {});
  return { settings: s, content: c };
};
window.GR_CFG = window.GR_MERGE(window.GR_SETTINGS, window.GR_CONTENT);

/* Static hosting (GitHub Pages): the build script writes window.GR_STATIC = { leadWebhook } into site-data.js.
   Locally GR_STATIC is undefined and everything goes to the PowerShell server as before.
   GR_SEND_LEAD(lead) → "server" | "sheet" | false (false = caller keeps it in the browser). */
window.GR_SEND_LEAD = async function (lead) {
  var ST = window.GR_STATIC;
  if (ST) {
    if (!ST.leadWebhook) return false;
    // Google Apps Script web app: no CORS headers, so send a "simple" request and don't read the reply.
    try {
      await fetch(ST.leadWebhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(lead) });
      return "sheet";
    } catch (e) { return false; }
  }
  try {
    var r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
    return r.ok ? "server" : false;
  } catch (e) { return false; }
};
