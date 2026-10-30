// Projects page: project dialog, domain filters, course carousel, card tilt.
// Needs core.js (tr, finePointer, prefersReducedMotion).

// The GitHub mark comes from the page sprite (projects.html), see tools/build_icons.py.
const GITHUB_ICON = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-github"/></svg>';

// -------------------------------
// Accessible names for the buttons on each card (each one names its project)
// -------------------------------
function labelProjectButtons() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const title = card.querySelector(".desc h3")?.textContent.trim() || "";
    card.querySelector(".expand-btn")?.setAttribute("aria-label", `${tr("proj.open", "Open project details")}: ${title}`);
    const link = card.querySelector(".github-link");
    if (link && link.dataset.linkType !== "doc") {
      link.setAttribute("aria-label", `${tr("proj.github", "View on GitHub")}: ${title}`);
    }
  });
}

// -------------------------------
// Project detail dialog
// -------------------------------
function initProjectModal() {
  const modal = document.createElement("div");
  modal.className = "project-modal";
  modal.innerHTML = `
    <div class="backdrop"></div>
    <div class="panel" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" tabindex="-1">
      <div class="github-top-right"></div>
      <button type="button" class="close-btn">×</button>
      <div class="left">
        <h2 class="title" id="project-modal-title"></h2>
        <div class="carousel">
          <div class="slides"></div>
          <div class="nav prev"><button type="button">‹</button></div>
          <div class="nav next"><button type="button">›</button></div>
          <p class="slide-status sr-only" aria-live="polite"></p>
        </div>
      </div>
      <div class="right">
        <div class="meta">
          <div class="description"></div>
          <div class="tools"></div>
          <div class="github-link-area"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const backdrop = modal.querySelector(".backdrop");
  const panel = modal.querySelector(".panel");
  const closeBtn = modal.querySelector(".close-btn");
  const titleEl = modal.querySelector(".title");
  const slidesEl = modal.querySelector(".slides");
  const statusEl = modal.querySelector(".slide-status");
  const prevBtn = modal.querySelector(".nav.prev button");
  const nextBtn = modal.querySelector(".nav.next button");
  const descEl = modal.querySelector(".description");
  const toolsEl = modal.querySelector(".tools");
  const githubTopRight = modal.querySelector(".github-top-right");

  let currentCard = null;
  let opener = null;
  let currentSlides = [];
  let currentIndex = 0;
  let currentConfidential = false;
  const isOpen = () => modal.classList.contains("open");

  // Everything outside the dialog is inert while it is open (no Tab, no screen reader browsing).
  const pageSiblings = () => [...document.body.children].filter((el) => el !== modal && !el.matches("script, style, link, noscript"));

  function setStaticLabels() {
    closeBtn.setAttribute("aria-label", tr("modal.close", "Close"));
    closeBtn.title = tr("modal.close", "Close");
    prevBtn.setAttribute("aria-label", tr("modal.prev", "Previous image"));
    nextBtn.setAttribute("aria-label", tr("modal.next", "Next image"));
  }

  function fillText(card) {
    const title = card.querySelector(".desc h3")?.textContent.trim() || "";
    titleEl.textContent = title;

    // Long description comes from data-long-desc (translated by i18n.js); fall back to the card's tools line.
    const long = (card.dataset.longDesc || "").trim() || card.querySelector(".desc p")?.textContent.trim() || "";
    descEl.replaceChildren();
    const heading = document.createElement("h3");
    heading.className = "desc-heading";
    heading.textContent = tr("modal.description", "Description");
    const text = document.createElement("div");
    text.className = "desc-text";
    long.split("\n").forEach((part, i) => {
      if (i) text.append(document.createElement("br"), document.createElement("br"));
      text.append(part);
    });
    descEl.append(heading, text);

    toolsEl.replaceChildren();
    card.querySelectorAll(".desc .tool").forEach((tool) => {
      const span = document.createElement("span");
      span.className = "tool";
      span.textContent = tool.textContent.trim();
      toolsEl.appendChild(span);
    });

    // One compact icon top right: GitHub, or a document icon for a report.
    githubTopRight.replaceChildren();
    const anchor = card.querySelector(".github-link");
    if (anchor) {
      const isDoc = anchor.dataset.linkType === "doc";
      const link = document.createElement("a");
      link.href = anchor.getAttribute("href");
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "download-button";
      const label = isDoc ? tr("proj.reportTitle", "Read the project report") : tr("modal.openGithub", "Open GitHub in a new tab");
      link.setAttribute("aria-label", label);
      link.title = label;
      link.style.display = "inline-flex";
      link.innerHTML = isDoc ? bxIcon("file") : GITHUB_ICON;
      githubTopRight.appendChild(link);
    }
  }

  function readSlides(card) {
    const list = [];
    if (card.dataset.video) list.push({ type: "video", url: card.dataset.video });
    const urls = (card.dataset.screenshots || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!urls.length && !list.length) {
      const img = card.querySelector(".project-image");
      if (img && img.getAttribute("src")) urls.push(img.getAttribute("src"));
    }
    const alts = (card.dataset.screenshotAlts || "").split("|").map((s) => s.trim());
    urls.forEach((url, i) => list.push({ type: "image", url, alt: alts[i] || "" }));
    return list;
  }

  function renderSlides() {
    slidesEl.replaceChildren();
    const multiple = currentSlides.length > 1;
    modal.querySelectorAll(".carousel .nav").forEach((nav) => { nav.hidden = !multiple; });
    statusEl.textContent = "";
    if (currentConfidential) {
      const notice = document.createElement("div");
      notice.className = "confidential-visual";
      notice.innerHTML = bxIcon("lock-alt") + "<span></span>";
      notice.querySelector("span").textContent = tr("proj.confidential", "Screenshots are confidential to the client company.");
      slidesEl.appendChild(notice);
      return;
    }
    const slide = currentSlides[currentIndex];
    if (!slide) return;
    if (multiple) statusEl.textContent = `${currentIndex + 1} / ${currentSlides.length}`;

    if (slide.type === "video") {
      const video = document.createElement("video");
      video.className = "modal-slide";
      video.src = slide.url;
      video.controls = true;
      video.controlsList = "nodownload";
      video.playsInline = true;
      video.autoplay = true;
      video.muted = true;
      slidesEl.appendChild(video);
      return;
    }

    const img = document.createElement("img");
    img.className = "modal-slide";
    img.src = slide.url;
    const decorative = slide.url.includes("/tiles/");
    const title = titleEl.textContent;
    img.alt = decorative ? "" : slide.alt || `${title} – ${tr("modal.screenshot", "screenshot")} ${currentIndex + 1} / ${currentSlides.length}`;
    img.style.cursor = "zoom-in";
    const syncZoom = () => {
      const zoomed = modal.classList.contains("image-expanded");
      img.style.cursor = zoomed ? "zoom-out" : "zoom-in";
      if (!decorative) img.setAttribute("aria-pressed", String(zoomed));
    };
    const toggleZoom = (e) => {
      e.stopPropagation();
      modal.classList.toggle("image-expanded");
      syncZoom();
    };
    img.addEventListener("click", toggleZoom);
    if (!decorative) {
      // Real screenshots can be enlarged from the keyboard too.
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", `${img.alt}. ${tr("modal.enlarge", "Enlarge image")}`);
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleZoom(e);
        }
      });
      syncZoom();
    }
    slidesEl.appendChild(img);
  }

  function showSlide(index) {
    if (currentSlides.length < 2) return;
    currentIndex = (index + currentSlides.length) % currentSlides.length;
    renderSlides();
  }

  function populate(card, keepIndex) {
    currentConfidential = card.hasAttribute("data-confidential");
    currentSlides = currentConfidential ? [] : readSlides(card);
    if (!keepIndex) currentIndex = 0;
    setStaticLabels();
    fillText(card);
    renderSlides();
  }

  function focusables() {
    return [...panel.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1']), video[controls]")]
      .filter((el) => el.getClientRects().length > 0);
  }

  function openProjectModal(card, trigger) {
    currentCard = card;
    opener = trigger || document.activeElement;
    populate(card, false);
    pageSiblings().forEach((el) => { el.inert = true; });
    document.documentElement.classList.add("modal-open");
    modal.classList.add("open");
    closeBtn.focus();
  }

  function closeModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isOpen()) return;
    slidesEl.querySelector("video")?.pause();
    modal.classList.remove("image-expanded", "open");
    slidesEl.replaceChildren();
    pageSiblings().forEach((el) => { el.inert = false; });
    document.documentElement.classList.remove("modal-open");
    currentCard = null;
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  }

  document.querySelectorAll(".expand-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".project-card");
      if (card) openProjectModal(card, btn);
    });
  });

  prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showSlide(currentIndex - 1); });
  nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showSlide(currentIndex + 1); });
  backdrop.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Tab") {
      // Keep Tab / Shift+Tab inside the dialog.
      const items = focusables();
      if (!items.length) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active) || active === panel) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === "ArrowRight" && !e.target.matches("video")) {
      showSlide(currentIndex + 1);
    } else if (e.key === "ArrowLeft" && !e.target.matches("video")) {
      showSlide(currentIndex - 1);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeModal();
  });

  // Re-translate an open dialog when the language changes.
  document.addEventListener("portfolio:languagechange", () => {
    if (currentCard) populate(currentCard, true);
  });
}

// Initialize immediately if DOM is already ready, otherwise wait for DOMContentLoaded
function initProjectCards() {
  labelProjectButtons();
  initProjectModal();
  document.addEventListener("portfolio:languagechange", labelProjectButtons);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectCards);
} else {
  initProjectCards();
}

// Refresh labels set from JavaScript when the language changes.
document.addEventListener("portfolio:languagechange", () => {
  updateThemeControl();
  if (navToggle) {
    const isOpen = header.classList.contains("nav-open");
    navToggle.setAttribute("aria-label", isOpen ? tr("ui.menuClose", "Close navigation menu") : tr("ui.menuOpen", "Open navigation menu"));
  }
});

// -------------------------------
// Projects page: filter categories by domain
// -------------------------------
const filterButtons = document.querySelectorAll(".project-filters .filter-btn");
if (filterButtons.length) {
  const sections = document.querySelectorAll(".all-projects details.category-section[data-category]");
  const sectionOrder = ["salesforce", "web", "mobile", "devops", "data"];
  const sectionParent = sections[0]?.parentElement;
  if (sectionParent) {
    const sectionAnchor = sectionParent.querySelector(".certifications") || null;
    [...sections]
      .sort((a, b) => sectionOrder.indexOf(a.dataset.category) - sectionOrder.indexOf(b.dataset.category))
      .forEach((section) => sectionParent.insertBefore(section, sectionAnchor));
  }
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      filterButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      sections.forEach((section) => {
        const show = filter === "all" || section.dataset.category === filter;
        section.hidden = !show;
        if (show && filter !== "all") section.open = true;
      });
      if (window.AOS) AOS.refresh();
    });
  });
}

// Certifications & courses: credentials as cards, courses as a filterable list.
// The hidden-from-view list `.certification-data` is the data source and the no-JavaScript fallback.
const certSection = document.querySelector(".certifications");
if (certSection && certSection.querySelector(".certs-app")) {
  const COURSE_PREVIEW = 8;
  const GROUP_ORDER = ["michigan", "epfl", "meta", "jhu", "ibm", "google", "aws", "other"];
  const PROVIDER_GROUP = {
    "University of Michigan": "michigan",
    "École Polytechnique Fédérale de Lausanne": "epfl",
    "Meta": "meta",
    "Johns Hopkins University": "jhu",
    "IBM": "ibm",
    "Google": "google",
    "Amazon Web Services": "aws"
  };
  const PROVIDER_SHORT = {
    "University of Michigan": "Michigan",
    "École Polytechnique Fédérale de Lausanne": "EPFL",
    "Johns Hopkins University": "Johns Hopkins",
    "Amazon Web Services": "AWS",
    "University of Colorado Boulder": "CU Boulder",
    "The Hong Kong University of Science and Technology": "HKUST"
  };
  const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m7.8 12.3 2.75 2.75 5.65-5.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const items = [...certSection.querySelectorAll(".certification-data a")].map((a, index) => {
    const provider = a.dataset.provider || "";
    const credential = a.dataset.status === "credential";
    let title = a.textContent.trim();
    let meta = PROVIDER_SHORT[provider] || provider;
    const suffix = title.match(/^(.*?) – (Salesforce) (\d{4})$/);
    if (suffix) { title = suffix[1]; meta = `${suffix[2]} ${suffix[3]}`; }
    return { index, href: a.href, title, meta, credential, group: PROVIDER_GROUP[provider] || "other" };
  });
  const credentials = items.filter((item) => item.credential);
  const courses = items.filter((item) => !item.credential)
    .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.index - b.index);

  const credentialList = certSection.querySelector("#cert-credentials");
  const courseList = certSection.querySelector("#cert-course-list");
  const statusLine = certSection.querySelector(".cert-status");
  const toggle = certSection.querySelector(".cert-toggle");
  const chips = [...certSection.querySelectorAll("[data-cert-filter]")];
  let activeGroup = "all";
  let expanded = false;

  const newTabHint = () => ` (${tr("certs.newTab", "opens in a new tab")})`;
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key]);

  function makeLink(item, className) {
    const link = document.createElement("a");
    link.className = className;
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.title;
    const hint = document.createElement("span");
    hint.className = "sr-only";
    hint.textContent = newTabHint();
    link.append(hint);
    return link;
  }

  function renderCredentials() {
    credentialList.textContent = "";
    credentials.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cert-credential";
      const meta = document.createElement("span");
      meta.className = "cert-meta";
      meta.textContent = item.meta;
      const badge = document.createElement("span");
      badge.className = "cert-badge";
      badge.innerHTML = bxIcon("certificate");
      badge.append(tr("certs.credential", "Credential"));
      li.append(meta, makeLink(item, "cert-title"), badge);
      credentialList.append(li);
    });
  }

  function renderCourses() {
    courseList.textContent = "";
    courses.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cert-course";
      li.dataset.group = item.group;
      const text = document.createElement("div");
      text.className = "cert-course-text";
      const meta = document.createElement("span");
      meta.className = "cert-meta";
      meta.textContent = item.meta;
      text.append(meta, makeLink(item, "cert-course-link"));
      const done = document.createElement("span");
      done.className = "cert-done";
      done.innerHTML = CHECK_SVG;
      const label = document.createElement("span");
      label.className = "sr-only";
      label.textContent = tr("certs.done", "Completed");
      done.append(label);
      li.append(text, done);
      courseList.append(li);
    });
  }

  function update() {
    const matching = courses.filter((item) => activeGroup === "all" || item.group === activeGroup);
    const limited = matching.length > COURSE_PREVIEW;
    let shown = 0;
    [...courseList.children].forEach((li) => {
      const match = activeGroup === "all" || li.dataset.group === activeGroup;
      const visible = match && (expanded || !limited || shown < COURSE_PREVIEW);
      if (visible) shown += 1;
      li.hidden = !visible;
    });
    toggle.hidden = !limited;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded
      ? tr("certs.showFewer", "Show fewer")
      : fill(tr("certs.showAll", "Show all {n} courses"), { n: matching.length });
    statusLine.textContent = fill(tr("certs.shown", "Showing {n} of {total} courses"), { n: shown, total: matching.length });
    chips.forEach((chip) => {
      const active = chip.dataset.certFilter === activeGroup;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
  }

  chips.forEach((chip) => {
    const group = chip.dataset.certFilter;
    chip.querySelector(".cert-chip-n").textContent = String(group === "all" ? courses.length : courses.filter((c) => c.group === group).length);
    chip.addEventListener("click", () => {
      activeGroup = group;
      update();
    });
  });
  toggle.addEventListener("click", () => {
    expanded = !expanded;
    update();
    if (!expanded) courseList.closest(".cert-block").scrollIntoView({ block: "nearest" });
  });
  document.addEventListener("portfolio:languagechange", () => {
    renderCredentials();
    renderCourses();
    update();
  });

  renderCredentials();
  renderCourses();
  update();
  certSection.classList.add("is-enhanced");
}

// -------------------------------
// Projects page: 3D tilt + spotlight on the cards
// -------------------------------
if (finePointer && !prefersReducedMotion) {
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      card.classList.add("is-tilting");
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      card.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
      card.style.setProperty("--ry", `${(px - 0.5) * 10}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}
