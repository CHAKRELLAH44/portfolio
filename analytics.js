// Anonymous visit analytics, read in admin.html (table: supabase/analytics.sql).
// No cookies, no IP address, no persistent visitor id: the session id only lives
// in sessionStorage for the current tab. Respects Do Not Track / Global Privacy Control.
(() => {
  if (typeof SUPABASE_URL === "undefined" || !SUPABASE_URL) return;
  const ua = navigator.userAgent;
  const local = location.protocol === "file:" || /^(localhost|127\.|192\.168\.|\[::1\])/.test(location.hostname);
  let ignored = false;
  try { ignored = localStorage.getItem("portfolio-ignore-me") === "1"; } catch (err) {}
  if (local || ignored || navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;
  if (/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\//i.test(ua)) return;

  const store = (key, make) => {
    try {
      let value = sessionStorage.getItem(key);
      if (!value) {
        value = make();
        sessionStorage.setItem(key, value);
      }
      return value;
    } catch (err) {
      return make();
    }
  };
  const sessionId = store("portfolio-sid", () =>
    [...crypto.getRandomValues(new Uint8Array(10))].map((b) => b.toString(16).padStart(2, "0")).join(""));

  // Where the visit came from: ?ref= / utm_source first, then the referrer, then in-app browsers.
  const params = new URLSearchParams(location.search);
  const refParam = (params.get("ref") || params.get("utm_source") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null;
  let refHost = "";
  try { refHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch (err) {}
  const internal = refHost && refHost === location.hostname.replace(/^www\./, "");
  const SOURCES = [
    [/linkedin\.com$|lnkd\.in$/, "LinkedIn"], [/(^|\.)google\./, "Google"], [/bing\.com$/, "Bing"],
    [/duckduckgo\.com$/, "DuckDuckGo"], [/github\.com$|github\.io$/, "GitHub"], [/^t\.co$|(^|\.)x\.com$|twitter\.com$/, "X"],
    [/facebook\.com$|fb\.com$|^l\.facebook/, "Facebook"], [/instagram\.com$/, "Instagram"], [/whatsapp\.com$|wa\.me$/, "WhatsApp"],
    [/mail\.google|outlook\.|mail\./, "Email"],
  ];
  const fromReferrer = () => {
    if (!refHost || internal) return null;
    const hit = SOURCES.find(([pattern]) => pattern.test(refHost));
    return hit ? hit[1] : refHost.slice(0, 40);
  };
  const fromApp = /LinkedInApp/i.test(ua) ? "LinkedIn" : /Instagram/i.test(ua) ? "Instagram" : /FBAN|FBAV/i.test(ua) ? "Facebook" : null;
  const external = refParam === "share" ? "Shared link" : fromReferrer() || fromApp || (refParam ? `ref:${refParam}` : null);
  // Later pages of the same visit keep its first source unless a new one shows up.
  let source = external;
  try {
    source = external || sessionStorage.getItem("portfolio-source") || "Direct";
    sessionStorage.setItem("portfolio-source", source);
  } catch (err) {
    source = source || "Direct";
  }
  const ref = refParam || store("portfolio-ref", () => "") || null;
  if (refParam) try { sessionStorage.setItem("portfolio-ref", refParam); } catch (err) {}

  const device = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? "tablet" : /Mobi|iPhone|Android/i.test(ua) ? "mobile" : "desktop";
  const browser = /LinkedInApp/i.test(ua) ? "LinkedIn app" : /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera"
    : /SamsungBrowser/.test(ua) ? "Samsung" : /Firefox|FxiOS/.test(ua) ? "Firefox" : /Chrome|CriOS/.test(ua) ? "Chrome"
    : /Safari/.test(ua) ? "Safari" : "Other";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
  // 404.html sets PORTFOLIO_PAGE, since it is served at whatever broken URL was asked for.
  const page = window.PORTFOLIO_PAGE || (location.pathname.split("/").pop() || "index").replace(/\.html$/, "").slice(0, 80) || "index";
  const base = {
    session_id: sessionId,
    page,
    source,
    ref,
    device,
    browser,
    os,
    lang: (navigator.language || "").slice(0, 12),
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || "").slice(0, 60),
    screen: `${screen.width}x${screen.height}`.slice(0, 15),
  };

  const headers = { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" };
  if (SUPABASE_ANON_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  const send = (type, extra = {}) => {
    // keepalive lets the request finish even while the page is closing.
    fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: "POST",
      keepalive: true,
      headers,
      body: JSON.stringify({ ...base, ...extra, type }),
    }).catch(() => {});
  };
  window.portfolioTrack = (type, detail) => send(type, { detail: detail ? String(detail).slice(0, 120) : null });

  send("view", {
    referrer: document.referrer && !internal ? document.referrer.slice(0, 200) : null,
    detail: page === "404" ? location.pathname.slice(0, 120) : null,
  });

  // Time actually spent looking at the page, and how far down it was read.
  let visibleSince = document.visibilityState === "visible" ? performance.now() : null;
  let visibleMs = 0;
  let maxScroll = 0;
  const trackScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    maxScroll = Math.max(maxScroll, max > 0 ? Math.round((scrollY / max) * 100) : 100);
  };
  addEventListener("scroll", trackScroll, { passive: true });
  trackScroll();
  let left = false;
  const leave = () => {
    if (visibleSince !== null) visibleMs += performance.now() - visibleSince;
    visibleSince = null;
    if (left) return;
    left = true;
    send("leave", { duration_ms: Math.min(Math.round(visibleMs), 86400000), scroll_pct: Math.min(maxScroll, 100) });
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") leave();
    else {
      visibleSince = performance.now();
      left = false; // coming back to the tab starts a new reading period
    }
  });
  addEventListener("pagehide", leave);

  // CV downloads, contact attempts and clicks to other sites.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (/cv\.pdf$/i.test(href)) return send("cv", { detail: page });
    if (link.dataset.discord) return send("outbound", { detail: "discord" });
    if (/^mailto:/i.test(href)) return send("contact", { detail: "email" });
    try {
      const url = new URL(href, location.href);
      if (url.hostname !== location.hostname) send("outbound", { detail: url.hostname.replace(/^www\./, "").slice(0, 120) });
    } catch (err) {}
  }, true);
  document.querySelectorAll(".contact form").forEach((form) => {
    form.addEventListener("submit", () => send("contact", { detail: `form:${page}` }));
  });
})();
