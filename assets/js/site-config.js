/* Applies the theme before first paint.
   Published settings come from the admin panel (window.GR_CFG, built by defaults.js). */
(function () {
  var s = (window.GR_CFG && window.GR_CFG.settings) || { theme: "graphite", themeVersion: 1, showThemeSwitcher: true };
  var themes = ["graphite", "electric", "sandstone"];
  window.GR_SITE = { theme: s.theme, themes: themes, showThemeSwitcher: s.showThemeSwitcher !== false, themeVersion: s.themeVersion || 1 };

  var theme = themes.indexOf(s.theme) > -1 ? s.theme : "graphite";
  try {
    // a visitor's own pick wins, but only while the switcher is on and only until the admin publishes a new theme
    var own = localStorage.getItem("gr-theme");
    var ownV = +(localStorage.getItem("gr-theme-v") || 0);
    if (window.GR_SITE.showThemeSwitcher && own && themes.indexOf(own) > -1 && ownV >= window.GR_SITE.themeVersion) theme = own;
  } catch (e) { /* storage blocked */ }
  var q = new URLSearchParams(location.search).get("theme");
  if (q && themes.indexOf(q) > -1) theme = q;
  document.documentElement.setAttribute("data-theme", theme);
})();
