// Shared by every page: theme, navigation, toast, scroll progress, cursor, contact form, touch helpers, share button.
// Must load before the page-specific file (home.js, projects.js, hidden-me.js).

// -------------------------------
// Scroll reveal: [data-aos] elements fade in once when they reach the lower part of the screen (styles in css/reveal.css)
// -------------------------------
document.documentElement.classList.add("reveal-ready");
(function () {
  let pending = [...document.querySelectorAll("[data-aos]")];
  if (!pending.length) return;
  pending.forEach((el) => {
    if (el.dataset.aosDelay) el.style.setProperty("--aos-delay", el.dataset.aosDelay + "ms");
    if (el.dataset.aosDuration) el.style.setProperty("--aos-duration", el.dataset.aosDuration + "ms");
  });

  // Where the element sits in the layout, ignoring the transform it starts with (an element shifted off
  // screen would never count as visible if we asked the browser where it is drawn).
  const layoutTop = (el) => {
    let top = 0;
    for (let node = el; node; node = node.offsetParent) top += node.offsetTop;
    return top;
  };

  const check = () => {
    const bottom = window.scrollY + window.innerHeight;
    pending = pending.filter((el) => {
      const offset = Number(el.dataset.aosOffset ?? 120);
      // Hidden or fixed elements have no offsetParent: show them straight away.
      if (el.offsetParent !== null && layoutTop(el) > bottom - offset) return true;
      el.classList.add("is-in");
      return false;
    });
    if (!pending.length) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  };
  let frame = 0;
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; check(); });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", onScroll);
  check();
})();

// -------------------------------
// Icons: generic UI glyphs (Boxicons, MIT) are inlined as <svg class="bx">; scripts call bxIcon().
// Brand icons are <symbol>s in each page's sprite (tools/build_icons.py): <svg class="ico"><use href="#i-github"/></svg>.
// -------------------------------
const BX_ICONS = {"file": "<path d=\"M18 22a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12zM13 4l5 5h-5V4zM7 8h3v2H7V8zm0 4h10v2H7v-2zm0 4h10v2H7v-2z\"/>", "download": "<path d=\"m12 16 4-5h-3V4h-2v7H8z\"/><path d=\"M20 18H4v-7H2v7c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-7h-2v7z\"/>", "lock-alt": "<path d=\"M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm6 10 .002 8H6v-8h12zm-9-2V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z\"/>", "home": "<path d=\"M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13zm7 7v-5h4v5h-4zm2-15.586 6 6V15l.001 5H16v-5c0-1.103-.897-2-2-2h-4c-1.103 0-2 .897-2 2v5H6v-9.586l6-6z\"/>", "arrow-back": "<path d=\"M21 11H6.414l5.293-5.293-1.414-1.414L2.586 12l7.707 7.707 1.414-1.414L6.414 13H21z\"/>", "certificate": "<path d=\"M5 8.999c0 1.902.765 3.627 2 4.89V21a.998.998 0 0 0 1.447.895L12 20.118l3.553 1.776a.992.992 0 0 0 .972-.043c.295-.183.475-.504.475-.851v-7.11a6.976 6.976 0 0 0 2-4.891C19 5.14 15.86 2 12 2S5 5.14 5 8.999zm7.447 9.106a1 1 0 0 0-.895 0L9 19.382v-4.067c.911.434 1.926.685 3 .685s2.089-.25 3-.685v4.066l-2.553-1.276zM12 4c2.756 0 5 2.242 5 4.999A5.006 5.006 0 0 1 12 14c-2.757 0-5-2.243-5-5.001A5.005 5.005 0 0 1 12 4z\"/>"};
function bxIcon(name, extraClass = "") {
  return '<svg class="bx' + (extraClass ? " " + extraClass : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (BX_ICONS[name] || "") + "</svg>";
}

let lastScrollTop = 0;
const header = document.querySelector(".site-header");
const timeText = document.querySelector(".time");

// i18n.js provides t(); keep English if it is missing.
const tr = (key, english) => (typeof t === "function" ? t(key, english) : english);
const isFrench = () => typeof getLanguage === "function" && getLanguage() === "fr";

function updateThemeControl() {
  const isLight = document.body.dataset.theme === "light";
  const themeToggle = document.querySelector(".theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (themeToggle) {
    const themeLabel = isLight ? tr("ui.themeToDark", "Switch to dark mode") : tr("ui.themeToLight", "Switch to light mode");
    themeToggle.setAttribute("aria-label", themeLabel);
    themeToggle.setAttribute("title", themeLabel);
  }
  if (themeColor) themeColor.setAttribute("content", isLight ? "#FFEEDE" : "#0f0f0f");
  updateThemeImages(isLight);
}

// Swap project thumbnails between their dark and light versions (data-light-src).
function updateThemeImages(isLight) {
  document.querySelectorAll("img[data-light-src]").forEach((img) => {
    if (!img.dataset.darkSrc) img.dataset.darkSrc = img.getAttribute("src");
    const next = isLight ? img.dataset.lightSrc : img.dataset.darkSrc;
    if (img.getAttribute("src") !== next) img.setAttribute("src", next);
  });
}

function toggleTheme() {
  document.body.dataset.theme = document.body.dataset.theme === "light" ? "dark" : "light";
  localStorage.setItem("portfolio-theme", document.body.dataset.theme);
  updateThemeControl();
}

const savedTheme = localStorage.getItem("portfolio-theme");
document.body.dataset.theme = savedTheme === "light" ? "light" : "dark";
updateThemeControl();

const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.querySelector("#primary-nav");

if (navToggle && primaryNav) {
  const setNav = (open, { restoreFocus = false } = {}) => {
    header.classList.toggle("nav-open", open);
    document.documentElement.classList.toggle("nav-lock", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? tr("ui.menuClose", "Close navigation menu") : tr("ui.menuOpen", "Open navigation menu"));
    if (open) header.classList.remove("hidden");
    if (!open && restoreFocus) navToggle.focus();
  };

  navToggle.addEventListener("click", () => {
    const open = !header.classList.contains("nav-open");
    setNav(open);
    if (open) primaryNav.querySelector("a")?.focus();
  });

  primaryNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("nav-open")) setNav(false, { restoreFocus: true });
  });

  // Tap or click outside the header closes the menu.
  document.addEventListener("click", (event) => {
    if (header.classList.contains("nav-open") && !header.contains(event.target)) setNav(false);
  });

  // Tabbing out of the open menu closes it.
  header.addEventListener("focusout", () => {
    setTimeout(() => {
      const active = document.activeElement;
      if (header.classList.contains("nav-open") && active && active !== document.body && !header.contains(active)) setNav(false);
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && header.classList.contains("nav-open")) setNav(false);
  });
}

// The highlight in the navigation pill slides under the current page link (aria-current), and follows hover and focus.
(function () {
  const pill = document.querySelector("#primary-nav.nav-pill");
  const indicator = pill && pill.querySelector(".nav-indicator");
  if (!indicator) return;
  const links = [...pill.querySelectorAll("a:not(.nav-cv)")];

  const moveTo = (link) => {
    if (!link || window.innerWidth <= 768) {
      pill.classList.remove("has-indicator");
      return;
    }
    indicator.style.setProperty("--x", link.offsetLeft + "px");
    indicator.style.setProperty("--w", link.offsetWidth + "px");
    pill.classList.add("has-indicator");
  };
  const rest = () => moveTo(pill.querySelector("a[aria-current]"));

  links.forEach((link) => {
    link.addEventListener("pointerenter", () => moveTo(link));
    link.addEventListener("focus", () => moveTo(link));
  });
  pill.addEventListener("pointerleave", rest);
  pill.addEventListener("focusout", (event) => {
    if (!pill.contains(event.relatedTarget)) rest();
  });
  // The current link changes with the home page scroll-spy; the widths change with the language and the fonts.
  new MutationObserver(rest).observe(pill, { attributes: true, attributeFilter: ["aria-current"], subtree: true });
  window.addEventListener("resize", rest);
  document.addEventListener("portfolio:languagechange", () => requestAnimationFrame(rest));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rest);
  rest();
})();

// The header turns into a solid bar once the page moves, hides while reading down and returns on the way up.
function updateHeader() {
  const scrollTop = Math.max(0, window.pageYOffset || document.documentElement.scrollTop);
  const keepOpen = header.classList.contains("nav-open") || header.contains(document.activeElement);

  header.classList.toggle("is-stuck", scrollTop > 8);
  header.classList.toggle("hidden", scrollTop > lastScrollTop && scrollTop > 80 && !keepOpen);
  lastScrollTop = scrollTop;
}

if (header) {
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

// Update local time display only if the target element exists on the page
if (timeText) {
  const updateLocalTime = () => {
    // Browsers label Morocco's zone inconsistently (GMT+0 vs GMT+1), so show the city instead.
    const time = new Date().toLocaleTimeString(isFrench() ? "fr-FR" : "en-US", {
      timeZone: "Africa/Casablanca",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    timeText.textContent = `${time} · Rabat`;
  };

  updateLocalTime();
  setInterval(updateLocalTime, 1000);
}

// Contact form redirects back with ?sent=1: show the confirmation message.
const formSent = document.querySelector(".form-sent");
if (formSent && new URLSearchParams(window.location.search).has("sent")) {
  formSent.hidden = false;
}

const yearText = document.getElementById("year");
const year = new Date().getFullYear();
// Only set year text if the element exists (script may run before footer in some pages)
if (yearText) {
  yearText.textContent = year;
}

// -------------------------------
// Discord has no public profile URL by username: copy it and show a toast instead
// -------------------------------
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 3500);
}

document.querySelectorAll("[data-discord]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const username = link.dataset.discord;
    // Show the username right away; upgrade the message once the copy succeeds.
    showToast(`Discord: ${username}`);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(username)
        .then(() => showToast(`${tr("ui.discordCopied", "Discord username copied:")} ${username}`))
        .catch(() => {});
    }
  });
});

// -------------------------------
// Reading progress bar along the top edge (all pages)
// -------------------------------
const scrollProgress = document.createElement("div");
scrollProgress.className = "scroll-progress";
scrollProgress.setAttribute("aria-hidden", "true");
document.body.appendChild(scrollProgress);
function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
}
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// -------------------------------
// Desktop: glowing cursor that grows over anything clickable
// -------------------------------
if (finePointer && !prefersReducedMotion) {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);
  let targetX = -100, targetY = -100, x = -100, y = -100;
  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    glow.classList.add("is-visible");
    const interactive = event.target.closest("a, button, input, textarea, select, summary, [tabindex], .project-card, .skill-box");
    glow.classList.toggle("is-active", Boolean(interactive));
  }, { passive: true });
  document.addEventListener("pointerleave", () => glow.classList.remove("is-visible"));
  window.addEventListener("pointerdown", () => glow.classList.add("is-pressed"));
  window.addEventListener("pointerup", () => glow.classList.remove("is-pressed"));
  const follow = () => {
    // Ease toward the pointer so the ring trails slightly behind it.
    x += (targetX - x) * 0.22;
    y += (targetY - y) * 0.22;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

// -------------------------------
// Contact: live character counter + confetti after a successful send
// -------------------------------
document.querySelectorAll('form textarea[name="message"], .testi-form textarea[name="note"]').forEach((textarea) => {
  if (!textarea.maxLength || textarea.maxLength < 0) textarea.maxLength = 1000;
  const counter = document.createElement("p");
  counter.className = "char-counter";
  counter.setAttribute("aria-live", "polite");
  textarea.insertAdjacentElement("afterend", counter);
  const update = () => {
    const used = textarea.value.length;
    counter.textContent = `${used} / ${textarea.maxLength} ${tr("form.chars", "characters")}`;
    counter.classList.toggle("is-near-limit", used > textarea.maxLength * 0.9);
  };
  textarea.addEventListener("input", update);
  document.addEventListener("portfolio:languagechange", update);
  update();
});

function launchConfetti() {
  if (prefersReducedMotion) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  ctx.scale(ratio, ratio);
  const accent = getComputedStyle(document.body).getPropertyValue("--primary").trim() || "#00ffdd";
  const colors = [accent, accent, "#ffffff", "#7a7a7a"];
  const pieces = Array.from({ length: 140 }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.55,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 6,
    size: Math.random() * 7 + 4,
    angle: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const draw = (now) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalAlpha = Math.max(1 - elapsed / 3200, 0);
    pieces.forEach((p) => {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    if (elapsed < 3200) requestAnimationFrame(draw);
    else canvas.remove();
  };
  requestAnimationFrame(draw);
}

if (formSent && !formSent.hidden) setTimeout(launchConfetti, 300);

// ===============================
// Touch screens
// ===============================
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const buzz = (pattern) => {
  if (coarsePointer && navigator.vibrate) navigator.vibrate(pattern);
};

// -------------------------------
// Swipe left/right in the project modal
// -------------------------------
let swipeStart = null;
document.addEventListener("touchstart", (event) => {
  const area = event.target.closest(".project-modal .carousel");
  if (!area || event.touches.length > 1) return;
  swipeStart = { area, x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
document.addEventListener("touchend", (event) => {
  if (!swipeStart) return;
  const { area, x, y } = swipeStart;
  swipeStart = null;
  const dx = event.changedTouches[0].clientX - x;
  const dy = event.changedTouches[0].clientY - y;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
  const next = dx < 0;
  const button = area.querySelector(next ? ".nav.next button" : ".nav.prev button");
  if (!button) return;
  button.click();
  buzz(8);
  area.classList.remove("swiped-next", "swiped-prev");
  void area.offsetWidth; // restart the nudge animation
  area.classList.add(next ? "swiped-next" : "swiped-prev");
}, { passive: true });

// -------------------------------
// Ripple from the finger on buttons, chips, logos and cards
// -------------------------------
if (coarsePointer && !prefersReducedMotion) {
  const rippleTargets = "button, .filter-btn, .skill-box, .project-card, .about-actions a, .social-link, header nav a, .contact form button";
  document.addEventListener("pointerdown", (event) => {
    const el = event.target.closest(rippleTargets);
    if (!el || el.closest(".skill-bubble")) return;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const host = document.createElement("span");
    host.className = "touch-ripple";
    const wave = document.createElement("span");
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${event.clientX - rect.left - size / 2}px`;
    wave.style.top = `${event.clientY - rect.top - size / 2}px`;
    host.append(wave);
    el.append(host);
    wave.addEventListener("animationend", () => host.remove());
  }, { passive: true });
}

// -------------------------------
// Light vibrations on filters, logos and form submit (Android)
// -------------------------------
document.addEventListener("click", (event) => {
  if (event.target.closest(".filter-btn")) buzz(10);
  else if (event.target.closest(".skill-box")) buzz(6);
});
document.querySelectorAll(".contact form").forEach((form) => {
  form.addEventListener("submit", () => buzz([15, 40, 15]));
});

// -------------------------------
// Share button in the footer: native share sheet, or copy the link.
// Shared links carry ?ref=share so the admin dashboard can count visits from them.
// -------------------------------
// On some pages this script runs before the footer is parsed: wait for the DOM.
function addShareButtons() {
  document.querySelectorAll("footer .social").forEach((social) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "share-btn";
    const label = () => tr("share.label", "Share my portfolio");
    button.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg> <span class="share-label"></span>';
    button.querySelector(".share-label").textContent = label();
    document.addEventListener("portfolio:languagechange", () => {
      button.querySelector(".share-label").textContent = label();
    });
    button.addEventListener("click", async () => {
      const url = new URL("index.html", location.href);
      url.searchParams.set("ref", "share");
      const data = { title: "Imanska · Portfolio", text: tr("share.text", "Check out Imane's portfolio: software engineer, Salesforce & DevOps."), url: url.href };
      try {
        if (navigator.share) {
          await navigator.share(data);
          window.portfolioTrack?.("share", "native");
        } else {
          await navigator.clipboard.writeText(url.href);
          showToast(tr("share.copied", "Link copied, thanks for sharing!"));
          window.portfolioTrack?.("share", "copy");
        }
      } catch (err) {
        // The share sheet was closed without sharing.
      }
    });
    social.insertAdjacentElement("afterend", button);
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addShareButtons);
else addShareButtons();
