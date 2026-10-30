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

// Compact, keyboard-accessible course carousel on the projects page.
const certificationCarousel = document.querySelector(".certification-carousel");
if (certificationCarousel) {
  const courseLinks = [...document.querySelectorAll(".certification-data a")];
  const slidesContainer = certificationCarousel.querySelector(".certification-slides");
  const dots = certificationCarousel.querySelector(".certification-dots");
  const pageLabel = certificationCarousel.querySelector(".certification-page");
  const pageSize = 4;
  let currentSlide = 0;

  courseLinks.sort((a, b) => {
    const priority = (course) => course.dataset.provider === "Salesforce" ? 0 : course.dataset.provider === "Oracle" ? 1 : 2;
    return priority(a) - priority(b);
  });

  const slideCount = Math.ceil(courseLinks.length / pageSize);
  slidesContainer.innerHTML = "";
  for (let index = 0; index < slideCount; index += 1) {
    const slide = document.createElement("div");
    slide.className = "certification-slide";
    slide.dataset.slide = String(index);
    slide.hidden = index !== 0; // hidden slides are display:none: no focus, not read by screen readers
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slidesContainer.append(slide);
  }
  const slides = [...slidesContainer.querySelectorAll(".certification-slide")];
  dots.innerHTML = "";
  const slideLabel = (index) => `${tr("certs.slide", "Slide")} ${index + 1} ${tr("certs.of", "of")} ${slides.length}`;
  const newTabHint = () => ` (${tr("certs.newTab", "opens in a new tab")})`;

  courseLinks.forEach((course, index) => {
    const card = document.createElement("article");
    card.className = "certification-card";
    const provider = document.createElement("span");
    provider.className = "certification-provider";
    provider.textContent = course.dataset.provider;
    const title = document.createElement("a");
    title.className = "certification-name";
    title.href = course.href;
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    if (course.dataset.status) title.dataset.status = course.dataset.status;
    title.textContent = course.textContent;
    const hint = document.createElement("span");
    hint.className = "sr-only";
    hint.textContent = newTabHint();
    title.append(hint);
    const status = document.createElement("span");
    status.className = "certification-status";
    status.textContent = course.dataset.status === "credential"
      ? tr("certs.credential", "Credential")
      : tr("certs.status", "100% complete");
    card.append(provider, title, status);
    slides[Math.floor(index / pageSize)].append(card);
  });

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "certification-dot";
    dot.setAttribute("aria-label", slideLabel(index));
    dot.addEventListener("click", () => showCertificationSlide(index));
    dots.append(dot);
  });

  function showCertificationSlide(index) {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === currentSlide;
      slide.hidden = !active;
      slide.classList.toggle("is-active", active);
    });
    [...dots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentSlide);
      if (dotIndex === currentSlide) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    pageLabel.textContent = `${currentSlide + 1} / ${slides.length}`;
  }
  slides.forEach((slide, index) => slide.setAttribute("aria-label", slideLabel(index)));

  certificationCarousel.addEventListener("click", (event) => {
    if (event.target.closest("[data-cert-prev]")) {
      event.preventDefault();
      showCertificationSlide(currentSlide - 1);
    } else if (event.target.closest("[data-cert-next]")) {
      event.preventDefault();
      showCertificationSlide(currentSlide + 1);
    }
  });
  certificationCarousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showCertificationSlide(currentSlide - 1);
    if (event.key === "ArrowRight") showCertificationSlide(currentSlide + 1);
  });
  document.addEventListener("portfolio:languagechange", () => {
    certificationCarousel.querySelectorAll(".certification-status").forEach((status) => {
      const isCredential = status.closest(".certification-card")?.querySelector(".certification-name")?.dataset.status === "credential";
      status.textContent = isCredential ? tr("certs.credential", "Credential") : tr("certs.status", "100% complete");
    });
    [...dots.children].forEach((dot, index) => dot.setAttribute("aria-label", slideLabel(index)));
    slides.forEach((slide, index) => slide.setAttribute("aria-label", slideLabel(index)));
    certificationCarousel.querySelectorAll(".certification-name > .sr-only").forEach((hint) => { hint.textContent = newTabHint(); });
  });
  showCertificationSlide(0);
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
