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
// Icons: inline SVG glyphs (Boxicons, MIT). Static pages inline them in the HTML; scripts call bxIcon().
// -------------------------------
const BX_ICONS = {"github": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z\"/>", "twitter": "<path d=\"M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z\"/>", "linkedin-square": "<path d=\"M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8.339 18.337H5.667v-8.59h2.672v8.59zM7.003 8.574a1.548 1.548 0 1 1 0-3.096 1.548 1.548 0 0 1 0 3.096zm11.335 9.763h-2.669V14.16c0-.996-.018-2.277-1.388-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248h-2.667v-8.59h2.56v1.174h.037c.355-.675 1.227-1.387 2.524-1.387 2.704 0 3.203 1.778 3.203 4.092v4.71z\"/>", "discord": "<path d=\"M9.593 10.971c-.542 0-.969.475-.969 1.055 0 .578.437 1.055.969 1.055.541 0 .968-.477.968-1.055.011-.581-.427-1.055-.968-1.055zm3.468 0c-.542 0-.969.475-.969 1.055 0 .578.437 1.055.969 1.055.541 0 .968-.477.968-1.055-.001-.581-.427-1.055-.968-1.055z\"/><path d=\"M17.678 3H4.947A1.952 1.952 0 0 0 3 4.957v12.844c0 1.083.874 1.957 1.947 1.957H15.72l-.505-1.759 1.217 1.131 1.149 1.064L19.625 22V4.957A1.952 1.952 0 0 0 17.678 3zM14.01 15.407s-.342-.408-.626-.771c1.244-.352 1.719-1.13 1.719-1.13-.39.256-.76.438-1.093.562a6.679 6.679 0 0 1-3.838.398 7.944 7.944 0 0 1-1.396-.41 5.402 5.402 0 0 1-.693-.321c-.029-.021-.057-.029-.085-.048a.117.117 0 0 1-.039-.03c-.171-.094-.266-.16-.266-.16s.456.76 1.663 1.121c-.285.36-.637.789-.637.789-2.099-.067-2.896-1.444-2.896-1.444 0-3.059 1.368-5.538 1.368-5.538 1.368-1.027 2.669-.998 2.669-.998l.095.114c-1.71.495-2.499 1.245-2.499 1.245s.21-.114.561-.275c1.016-.446 1.823-.57 2.156-.599.057-.009.105-.019.162-.019a7.756 7.756 0 0 1 4.778.893s-.751-.712-2.366-1.206l.133-.152s1.302-.029 2.669.998c0 0 1.368 2.479 1.368 5.538 0-.001-.807 1.376-2.907 1.443z\"/>", "spotify": "<path d=\"M12.01 2.019c-5.495 0-9.991 4.496-9.991 9.991 0 5.494 4.496 9.99 9.991 9.99 5.494 0 9.99-4.496 9.99-9.99 0-5.495-4.446-9.991-9.99-9.991zm4.595 14.436c-.199.299-.549.4-.85.201-2.349-1.45-5.296-1.75-8.793-.951-.348.102-.648-.148-.748-.449-.101-.35.149-.648.45-.749 3.795-.85 7.093-.499 9.69 1.1.35.149.4.548.251.848zm1.2-2.747c-.251.349-.7.499-1.051.249-2.697-1.646-6.792-2.148-9.939-1.148-.398.101-.85-.1-.949-.498-.101-.402.1-.852.499-.952 3.646-1.098 8.143-.548 11.239 1.351.3.149.45.648.201.998zm.099-2.799c-3.197-1.897-8.542-2.097-11.59-1.146a.938.938 0 0 1-1.148-.6.937.937 0 0 1 .599-1.151c3.547-1.049 9.392-.85 13.089 1.351.449.249.599.849.349 1.298-.25.35-.849.498-1.299.248z\"/>", "file": "<path d=\"M18 22a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12zM13 4l5 5h-5V4zM7 8h3v2H7V8zm0 4h10v2H7v-2zm0 4h10v2H7v-2z\"/>", "download": "<path d=\"m12 16 4-5h-3V4h-2v7H8z\"/><path d=\"M20 18H4v-7H2v7c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-7h-2v7z\"/>", "lock-alt": "<path d=\"M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm6 10 .002 8H6v-8h12zm-9-2V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z\"/>", "home": "<path d=\"M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13zm7 7v-5h4v5h-4zm2-15.586 6 6V15l.001 5H16v-5c0-1.103-.897-2-2-2h-4c-1.103 0-2 .897-2 2v5H6v-9.586l6-6z\"/>", "arrow-back": "<path d=\"M21 11H6.414l5.293-5.293-1.414-1.414L2.586 12l7.707 7.707 1.414-1.414L6.414 13H21z\"/>", "certificate": "<path d=\"M5 8.999c0 1.902.765 3.627 2 4.89V21a.998.998 0 0 0 1.447.895L12 20.118l3.553 1.776a.992.992 0 0 0 .972-.043c.295-.183.475-.504.475-.851v-7.11a6.976 6.976 0 0 0 2-4.891C19 5.14 15.86 2 12 2S5 5.14 5 8.999zm7.447 9.106a1 1 0 0 0-.895 0L9 19.382v-4.067c.911.434 1.926.685 3 .685s2.089-.25 3-.685v4.066l-2.553-1.276zM12 4c2.756 0 5 2.242 5 4.999A5.006 5.006 0 0 1 12 14c-2.757 0-5-2.243-5-5.001A5.005 5.005 0 0 1 12 4z\"/>"};
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
// Swipe left/right in the project modal and the certification carousel
// -------------------------------
let swipeStart = null;
document.addEventListener("touchstart", (event) => {
  const area = event.target.closest(".project-modal .carousel, .certification-carousel");
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
  const button = area.matches(".certification-carousel")
    ? area.querySelector(next ? "[data-cert-next]" : "[data-cert-prev]")
    : area.querySelector(next ? ".nav.next button" : ".nav.prev button");
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
