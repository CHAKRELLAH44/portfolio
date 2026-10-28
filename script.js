let lastScrollTop = 0;
const header = document.querySelector("header");
const timeText = document.querySelector(".time");

// i18n.js provides t(); keep English if it is missing.
const tr = (key, english) => (typeof t === "function" ? t(key, english) : english);
const isFrench = () => typeof getLanguage === "function" && getLanguage() === "fr";

function updateThemeControl() {
  const isLight = document.body.dataset.theme === "light";
  const themeIcon = document.querySelector("#theme-icon");
  const themeToggle = document.querySelector(".theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (themeIcon) {
    themeIcon.setAttribute("name", isLight ? "moon" : "sun");
    themeIcon.setAttribute("color", isLight ? "#38291f" : "#fff");
  }
  if (themeToggle) {
    const themeLabel = isLight ? tr("ui.themeToDark", "Switch to dark mode") : tr("ui.themeToLight", "Switch to light mode");
    themeToggle.setAttribute("aria-label", themeLabel);
    themeToggle.setAttribute("title", themeLabel);
  }
  if (themeColor) themeColor.setAttribute("content", isLight ? "#FFEEDE" : "#0f0f0f");
  updateThemeImages(isLight);
}

// Swap project thumbnails between assets/dark and assets/light (data-light-src).
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
  const closeNav = () => {
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", tr("ui.menuOpen", "Open navigation menu"));
  };

  navToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? tr("ui.menuClose", "Close navigation menu") : tr("ui.menuOpen", "Open navigation menu"));
  });

  primaryNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeNav();
  });
}

window.addEventListener("scroll", () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > lastScrollTop) {
    header.classList.add("hidden");
  } else {
    header.classList.remove("hidden");
  }

  lastScrollTop = scrollTop;
});

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
// Project detail modal + expand button
// -------------------------------
function initProjectModal() {
  // Bind expand buttons across both detailed projects page (.project-card)
  // and the homepage (.projects). This ensures + buttons added to either
  // markup will open the same project modal.
  document.querySelectorAll('.expand-btn').forEach(btn => {
    const handler = (e) => {
      e.stopPropagation();
      // diagnostic: log to console so user can see in DevTools
      try {
        console.log('expand-btn triggered', { target: btn });
      } catch (err) {}
      // Find the nearest project container (supports .project-card and .projects)
      const card = btn.closest('.project-card') || btn.closest('.projects');
      if (card) {
        // also log the project title if available
        const t = card.querySelector('.desc h1')?.innerText || '<no-title>';
        try { console.log('opening modal for', t); } catch (e) {}
        openProjectModal(card);
      } else {
        try { console.warn('Expand button clicked but parent project container not found', btn); } catch (e) {}
      }
    };

    // Use click so mouse, touch, and keyboard activation open the modal once.
    btn.addEventListener('click', handler);
  });

  // create modal element once
  const modal = document.createElement('div');
  modal.className = 'project-modal';
  modal.innerHTML = `
    <div class="backdrop"></div>
    <div class="panel" role="dialog" aria-modal="true">
      <div class="github-top-right"></div>
      <button type="button" class="close-btn" aria-label="Close" title="Close">×</button>
      <div class="left">
        <div class="title"></div>
        <div class="carousel">
          <div class="slides"></div>
          <div class="nav prev"><button aria-label="Previous">‹</button></div>
          <div class="nav next"><button aria-label="Next">›</button></div>
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
  modal.querySelectorAll('.carousel .nav button').forEach((button) => {
    button.type = 'button';
  });
  document.body.appendChild(modal);

  const backdrop = modal.querySelector('.backdrop');
  const panel = modal.querySelector('.panel');
  const closeBtn = modal.querySelector('.close-btn');
  const titleEl = modal.querySelector('.title');
  const slidesEl = modal.querySelector('.slides');
  const descEl = modal.querySelector('.description');
  const toolsEl = modal.querySelector('.tools');
  const githubArea = modal.querySelector('.github-link-area');
  const githubTopRight = modal.querySelector('.github-top-right');

  let currentSlides = [];
  let currentIndex = 0;
  let currentConfidential = false;

  function openProjectModal(card) {
    // read data from card
    const title = card.querySelector('.desc h1')?.innerText || '';
    const desc = card.querySelector('.desc p')?.innerText || '';
    const toolEls = card.querySelectorAll('.desc .tool');
    const tools = Array.from(toolEls).map(t => t.innerText.trim());
    const githubAnchor = card.querySelector('.github-link');
    const githubHref = githubAnchor ? githubAnchor.getAttribute('href') : null;
    // media: check for video first, then screenshots
    const img = card.querySelector('.project-image');
    const videoUrl = card.dataset.video;
    const screenshotsAttr = card.dataset.screenshots;
    let screenshots = [];
    
    if (videoUrl) {
      // if there's a video, it becomes the first slide
      screenshots = [{ type: 'video', url: videoUrl }];
      // add any screenshots after the video
      if (screenshotsAttr) {
        screenshots.push(...screenshotsAttr.split(',').map(s => ({ type: 'image', url: s.trim() })));
      }
    } else {
      // no video - use screenshots or fallback to main image
      if (screenshotsAttr) {
        screenshots = screenshotsAttr.split(',').map(s => ({ type: 'image', url: s.trim() }));
      } else if (img && img.src) {
        screenshots = [{ type: 'image', url: img.src }];
      }
    }

    titleEl.textContent = title;
    // Description: prefer long description from data attribute, otherwise use card desc or a longer placeholder
    const placeholderPool = [
      'A concise overview of the project, its goals, and the key features implemented. This demo highlights responsive design, accessibility considerations, and animations used to enhance user experience.',
      'This project explores modern web techniques to deliver an interactive and accessible UI. It includes state management, responsive breakpoints, and lightweight animations for a polished feel.',
      'A small demo showcasing responsive design, animations and integration with external APIs. The codebase is modular and written with maintainability in mind.'
    ];
    const longDescAttr = card.dataset.longDesc;
    const chosen = longDescAttr && longDescAttr.trim().length ? longDescAttr : (desc && desc.trim().length ? desc + '\n\n' + placeholderPool[Math.floor(Math.random() * placeholderPool.length)] : placeholderPool[Math.floor(Math.random() * placeholderPool.length)]);
    // render as heading + paragraph(s)
    descEl.innerHTML = `<h3 class="desc-heading">${tr("modal.description", "Description")}</h3><div class="desc-text">${chosen.replace(/\n/g, '<br><br>')}</div>`;
    toolsEl.innerHTML = '';
    tools.forEach(t => {
      const span = document.createElement('span');
      span.className = 'tool';
      span.textContent = t;
      toolsEl.appendChild(span);
    });

    // place only a compact GitHub icon in the top-right of the panel
    githubArea.innerHTML = '';
    githubTopRight.innerHTML = '';
    if (githubHref) {
      const topA = document.createElement('a');
      topA.href = githubHref;
      topA.target = '_blank';
      topA.rel = 'noopener noreferrer';
      topA.className = 'download-button';
      topA.setAttribute('aria-label', 'Open GitHub in a new tab');
      topA.style.display = 'inline-flex';
      topA.innerHTML = `<box-icon name='github' type='logo'></box-icon>`;
      githubTopRight.appendChild(topA);
    }

    // populate slides (confidential projects show a notice instead of screenshots)
    currentConfidential = card.hasAttribute('data-confidential');
    currentSlides = currentConfidential ? [] : screenshots;
    currentIndex = 0;
    renderSlides();

    modal.classList.add('open');
    // focus for accessibility
    closeBtn.focus();
  }

  function renderSlides() {
    slidesEl.innerHTML = '';
    modal.querySelectorAll('.carousel .nav').forEach((nav) => {
      nav.hidden = currentSlides.length < 2;
    });
    if (currentConfidential) {
      const notice = document.createElement('div');
      notice.className = 'confidential-visual';
      notice.innerHTML = `<box-icon name='lock-alt' aria-hidden="true"></box-icon><span>${tr('proj.confidential', 'Screenshots are confidential to the client company.')}</span>`;
      slidesEl.appendChild(notice);
      return;
    }
    if (!currentSlides.length) return;
    
    const slide = currentSlides[currentIndex];
    if (slide.type === 'video') {
      const video = document.createElement('video');
      video.className = 'modal-slide';
      video.src = slide.url;
      video.controls = true;
      video.controlsList = 'nodownload';
      video.playsInline = true;
      // optional: autoplay when shown
      video.autoplay = true;
      video.muted = true;
      slidesEl.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.className = 'modal-slide';
      img.src = slide.url;
      // allow clicking the image to toggle expansion
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        // toggle expanded state
        modal.classList.toggle('image-expanded');
        // update cursor
        if (modal.classList.contains('image-expanded')) img.style.cursor = 'zoom-out'; else img.style.cursor = 'zoom-in';
      });
      slidesEl.appendChild(img);
    }
  }

  // nav
  modal.querySelector('.nav.prev button').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentSlides.length) return;
    currentIndex = (currentIndex - 1 + currentSlides.length) % currentSlides.length;
    renderSlides();
  });

  modal.querySelector('.nav.next button').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!currentSlides.length) return;
    currentIndex = (currentIndex + 1) % currentSlides.length;
    renderSlides();
  });

  modal.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open') || currentSlides.length < 2) return;
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % currentSlides.length;
      renderSlides();
    } else if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + currentSlides.length) % currentSlides.length;
      renderSlides();
    }
  });

  function closeModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // ensure any videos are stopped
    const video = slidesEl.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    // remove expanded state if active
    modal.classList.remove('image-expanded');
    // close the modal
    modal.classList.remove('open');
    slidesEl.innerHTML = '';
  }

  // ensure all close triggers work
  backdrop.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') closeModal(e);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

// Add long descriptions to projects
document.querySelectorAll('.project-card').forEach(card => {
  const title = card.querySelector('.desc h1').innerText;
  switch(title) {
    case 'CI/CD Pipeline Automation':
      card.setAttribute('data-long-desc', 'Implemented a complete CI/CD pipeline to automate application deployment and scaling. The setup ensured fast delivery, containerized workloads, and full observability through monitoring dashboards. Kubernetes (Minikube) for orchestration and cluster environment, Jenkins for CI pipeline & automation, ArgoCD for GitOps CD & deployment sync, Docker for containerization, GitHub for version control, and Prometheus + Grafana for metrics collection & visualization.');
      break;
    case 'Automated Package Deployment':
      card.setAttribute('data-long-desc', 'Created an automated system to install and configure packages across multiple servers, eliminating manual work and ensuring consistent configuration. Built a reproducible multi-VM infrastructure for testing. Ansible for playbooks, inventory, and automation, SSH for secure remote execution, and VirtualBox/Vagrant for multi-machine development environment.');
      break;
    // ... autres projets
  }
});

// Initialize immediately if DOM is already ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectModal);
} else {
  initProjectModal();
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
    slide.hidden = index !== 0;
    slidesContainer.append(slide);
  }
  const slides = [...slidesContainer.querySelectorAll(".certification-slide")];
  dots.innerHTML = "";

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
    dot.setAttribute("aria-label", `${tr("certs.slide", "Slide")} ${index + 1}`);
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
      dot.setAttribute("aria-current", dotIndex === currentSlide ? "true" : "false");
    });
    pageLabel.textContent = `${currentSlide + 1} / ${slides.length}`;
  }

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
    [...dots.children].forEach((dot, index) => {
      dot.setAttribute("aria-label", `${tr("certs.slide", "Slide")} ${index + 1}`);
    });
  });
  showCertificationSlide(0);
}

// -------------------------------
// About: count up the key figures once they scroll into view
// -------------------------------
const statNumbers = document.querySelectorAll(".about-stats [data-count]");
if (statNumbers.length && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.textContent.replace(/[0-9]/g, "");
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  statNumbers.forEach((el) => observer.observe(el));
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
// Home page skills: domain filters, animated count, pointer tilt + spotlight
// -------------------------------
const skillGrid = document.querySelector(".skill .skills");
if (skillGrid) {
  const skillBoxes = [...skillGrid.querySelectorAll(".skill-box")];
  const skillFilterButtons = document.querySelectorAll("[data-skill-filter]");
  const skillCount = document.querySelector(".skill-count-num");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateCount(target) {
    if (!skillCount) return;
    const start = Number(skillCount.textContent) || 0;
    if (reduceMotion || start === target) {
      skillCount.textContent = target;
      return;
    }
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / 450, 1);
      skillCount.textContent = Math.round(start + (target - start) * progress);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  skillFilterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.skillFilter;
      skillFilterButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      skillGrid.classList.toggle("is-filtered", filter !== "all");
      let matches = 0;
      skillBoxes.forEach((box) => {
        const match = filter === "all" || box.dataset.cat === filter;
        // Stagger the lit boxes so the selection ripples through the grid.
        box.style.setProperty("--delay", match ? `${matches * 35}ms` : "0ms");
        box.classList.toggle("is-match", match && filter !== "all");
        box.classList.toggle("is-dim", !match);
        if (match) matches++;
      });
      animateCount(matches);
    });
  });

  // Touch screens have no hover: a tap shows the logo in color with its name.
  skillBoxes.forEach((box) => {
    box.addEventListener("click", () => {
      skillBoxes.forEach((other) => other !== box && other.classList.remove("is-picked"));
      box.classList.toggle("is-picked");
    });
  });

  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    skillBoxes.forEach((box) => {
      box.addEventListener("pointermove", (event) => {
        const rect = box.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        box.style.setProperty("--mx", `${x * 100}%`);
        box.style.setProperty("--my", `${y * 100}%`);
        box.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
        box.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
      });
      box.addEventListener("pointerleave", () => {
        box.style.setProperty("--rx", "0deg");
        box.style.setProperty("--ry", "0deg");
      });
    });
  }
}

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
// Hero: typed roles under the tagline + glitch on the outlined name
// -------------------------------
const heroRoles = document.querySelector(".hero-roles-text");
if (heroRoles) {
  const roles = {
    en: ["Salesforce Developer", "Software Engineer", "DevOps & Cloud enthusiast", "Full-stack Developer", "Professional bug hunter"],
    fr: ["Développeuse Salesforce", "Ingénieure logicielle", "Passionnée DevOps & Cloud", "Développeuse full-stack", "Chasseuse de bugs pro"],
  };
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;
  const tick = () => {
    const list = isFrench() ? roles.fr : roles.en;
    const word = list[roleIndex % list.length];
    if (prefersReducedMotion) {
      heroRoles.textContent = word;
      roleIndex++;
      return setTimeout(tick, 2500);
    }
    charIndex = Math.min(charIndex + (deleting ? -1 : 1), word.length);
    heroRoles.textContent = word.slice(0, charIndex);
    let delay = deleting ? 35 : 75;
    if (!deleting && charIndex === word.length) {
      deleting = true;
      delay = 1800;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex++;
      delay = 350;
    }
    setTimeout(tick, delay);
  };
  setTimeout(tick, 1200);
}

const heroName = document.querySelector(".hero .row-2");
if (heroName && !prefersReducedMotion) {
  const glitch = () => {
    heroName.classList.remove("is-glitching");
    void heroName.offsetWidth; // restart the animation
    heroName.classList.add("is-glitching");
  };
  heroName.addEventListener("pointerenter", glitch);
  heroName.addEventListener("click", glitch);
  heroName.addEventListener("animationend", () => heroName.classList.remove("is-glitching"));
  setInterval(() => {
    if (!document.hidden && window.scrollY < window.innerHeight) glitch();
  }, 7000);
}

// -------------------------------
// Experience: the timeline line fills as you scroll and dots light up
// -------------------------------
const timeline = document.querySelector(".timeline");
if (timeline) {
  const timelineItems = [...timeline.querySelectorAll(".timeline-item")];
  const updateTimeline = () => {
    const rect = timeline.getBoundingClientRect();
    const focus = window.innerHeight * 0.6;
    const progress = Math.min(Math.max((focus - rect.top) / rect.height, 0), 1);
    timeline.style.setProperty("--progress", progress.toFixed(3));
    timelineItems.forEach((item) => {
      const dot = item.querySelector(".timeline-dot");
      if (dot) item.classList.toggle("is-reached", dot.getBoundingClientRect().top < focus);
    });
  };
  timeline.classList.add("is-scroll-linked");

  // Each experience opens with its "+" button (or a tap on the card) to show the details.
  timeline.classList.add("is-collapsible");
  const setOpen = (item, open) => {
    const toggle = item.querySelector(".timeline-toggle");
    item.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? tr("exp.less", "Hide details") : tr("exp.more", "Show details"));
  };
  timelineItems.forEach((item) => {
    if (!item.querySelector(".timeline-toggle")) return;
    item.addEventListener("click", (event) => {
      if (event.target.closest("a") || String(getSelection())) return;
      setOpen(item, !item.classList.contains("is-open"));
      buzz(6);
      // The scroll-linked line depends on the new height.
      requestAnimationFrame(updateTimeline);
      setTimeout(updateTimeline, 450);
    });
  });
  document.addEventListener("portfolio:languagechange", () => {
    timelineItems.forEach((item) => item.querySelector(".timeline-toggle") && setOpen(item, item.classList.contains("is-open")));
  });
  window.addEventListener("scroll", updateTimeline, { passive: true });
  window.addEventListener("resize", updateTimeline);
  updateTimeline();
}

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
// Gyroscope parallax on the hero name and the profile photo
// -------------------------------
const tiltTargets = document.querySelectorAll(".hero .row-2, .profile-container .profile");
if (coarsePointer && !prefersReducedMotion && tiltTargets.length && "DeviceOrientationEvent" in window) {
  let base = null;
  let frame = 0;
  const onOrientation = (event) => {
    if (event.beta === null || event.gamma === null) return;
    // Measure tilt from however the phone was held when the page opened.
    if (!base) base = { beta: event.beta, gamma: event.gamma };
    const clamp = (value) => Math.max(-1, Math.min(1, value / 25));
    const tx = clamp(event.gamma - base.gamma);
    const ty = clamp(event.beta - base.beta);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      tiltTargets.forEach((el) => {
        el.style.setProperty("--gx", tx.toFixed(3));
        el.style.setProperty("--gy", ty.toFixed(3));
        el.classList.add("is-gyro");
      });
    });
  };
  const startGyro = () => window.addEventListener("deviceorientation", onOrientation);
  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    // iOS only allows motion access after a user gesture.
    const ask = () => {
      DeviceOrientationEvent.requestPermission()
        .then((state) => state === "granted" && startGyro())
        .catch(() => {});
    };
    document.addEventListener("touchend", ask, { once: true });
  } else {
    startGyro();
  }
}

// -------------------------------
// Long press on a skill logo: bubble with its domain and the projects that use it
// -------------------------------
if (skillGrid) {
  const PROJECT_TITLES = {
    cicd: "CI/CD Pipeline Automation",
    ansible: "Automated Package Deployment",
    dmz: "DMZ Virtual Network Architecture",
    twitter: "PROVIROLL – Twitter Automation Agent",
    coffee: "LUMINALINK – Coffee Shop",
    health: "Healthcare AI – Predicting Patient Survival",
    reco: "Recommendation System – E-commerce",
    bank: "Bank Management System",
    ecom: "E-commerce Microservices Platform",
    echstore: "Ech Store – JEE Website",
    movie: "Movie Management System",
    taxi: "Online Taxi Reservation System",
    faith: "FAITH Quran – Quran Reading PWA",
    ora: "Entraînement Oral – AI Language Coach",
    hotelJava: "Hotel Management System (Java)",
    hotelCpp: "Hotel Management System (C++)",
    exams: "Mobile Application – Online Exams App",
    carRental: "Car Rental Application",
    p2p: "Purchasing Information System – Procure-to-Pay",
  };
  // Keyed by each logo's data-name; taken from the tools listed on projects.html.
  const SKILL_PROJECTS = {
    "HTML5": ["taxi"], "CSS3": ["taxi"], "JavaScript": ["bank", "ecom", "movie"], "TypeScript": ["ora"],
    "React": ["bank", "ecom", "movie", "faith"], "Next.js": ["faith", "ora"], "Tailwind CSS": ["faith", "ora"],
    "MySQL": ["bank"], "PostgreSQL": ["faith", "ora"], "Firebase": ["exams", "carRental"], "H2 Database": ["ecom"],
    "GitHub": ["cicd"], "C++": ["hotelCpp"], ".NET": ["movie"], "C#": ["movie"],
    "Python": ["twitter", "health", "reco"], "Java": ["ecom", "echstore", "hotelJava", "exams"],
    "Salesforce / Apex": ["p2p"], "Spring Boot": ["bank", "ecom"], "Django": ["taxi"], "REST / Swagger": ["bank", "ecom"],
    "Grafana": ["cicd"], "Prometheus": ["cicd"], "Ansible": ["ansible"], "Docker": ["cicd"], "AWS": ["coffee"],
    "Kubernetes": ["cicd"], "Jenkins / CI/CD": ["cicd"], "Argo CD": ["cicd"], "Proxmox": ["dmz"], "pfSense": ["dmz"],
  };

  const bubble = document.createElement("div");
  bubble.className = "skill-bubble";
  bubble.setAttribute("role", "dialog");
  bubble.hidden = true;
  document.body.appendChild(bubble);
  let bubbleBox = null;

  const closeBubble = () => {
    if (bubble.hidden) return;
    bubble.classList.remove("is-open");
    bubble.hidden = true;
    bubbleBox = null;
  };

  const openBubble = (box) => {
    bubbleBox = box;
    const name = box.dataset.name;
    const domain = document.querySelector(`[data-skill-filter="${box.dataset.cat}"]`)?.textContent || "";
    const projects = SKILL_PROJECTS[name] || [];
    bubble.setAttribute("aria-label", name);
    bubble.innerHTML = `
      <button type="button" class="skill-bubble-close" aria-label="${tr("skills.close", "Close")}">×</button>
      <p class="skill-bubble-domain"></p>
      <h3 class="skill-bubble-name"></h3>
      <p class="skill-bubble-label"></p>
      <ul class="skill-bubble-list"></ul>
      <a class="skill-bubble-link" href="projects.html">${tr("skills.seeProjects", "See my projects →")}</a>`;
    bubble.querySelector(".skill-bubble-domain").textContent = domain;
    bubble.querySelector(".skill-bubble-name").textContent = name;
    bubble.querySelector(".skill-bubble-label").textContent = projects.length
      ? tr("skills.usedIn", "Used in")
      : tr("skills.everyday", "Part of my everyday toolbox.");
    const list = bubble.querySelector(".skill-bubble-list");
    projects.forEach((key) => {
      const item = document.createElement("li");
      item.textContent = tr(`proj.${key}.title`, PROJECT_TITLES[key]);
      list.append(item);
    });
    bubble.querySelector(".skill-bubble-close").addEventListener("click", closeBubble);

    bubble.hidden = false;
    // Place it above the logo, or below when there is no room, and keep it on screen.
    const rect = box.getBoundingClientRect();
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 12), window.innerWidth - width - 12);
    const above = rect.top - height - 12 > 8;
    bubble.style.left = `${left}px`;
    bubble.style.top = `${above ? rect.top - height - 12 : rect.bottom + 12}px`;
    bubble.style.setProperty("--arrow-x", `${rect.left + rect.width / 2 - left}px`);
    bubble.classList.toggle("is-below", !above);
    requestAnimationFrame(() => bubble.classList.add("is-open"));
  };

  let pressTimer = 0;
  let pressStart = null;
  let suppressClick = false;
  skillGrid.addEventListener("pointerdown", (event) => {
    const box = event.target.closest(".skill-box");
    if (!box || event.pointerType === "mouse") return;
    pressStart = { x: event.clientX, y: event.clientY };
    box.classList.add("is-pressing");
    pressTimer = setTimeout(() => {
      box.classList.remove("is-pressing");
      suppressClick = true;
      buzz(20);
      openBubble(box);
    }, 450);
  });
  const cancelPress = () => {
    clearTimeout(pressTimer);
    skillGrid.querySelectorAll(".is-pressing").forEach((box) => box.classList.remove("is-pressing"));
  };
  skillGrid.addEventListener("pointermove", (event) => {
    if (pressStart && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 10) cancelPress();
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((type) => skillGrid.addEventListener(type, cancelPress));
  // The browser's own long-press menu would cover the bubble.
  skillGrid.addEventListener("contextmenu", (event) => {
    if (event.target.closest(".skill-box") && coarsePointer) event.preventDefault();
  });
  // A long press ends with a click: don't let it also toggle the tapped state.
  skillGrid.addEventListener("click", (event) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener("pointerdown", (event) => {
    if (!bubble.hidden && !bubble.contains(event.target) && event.target.closest(".skill-box") !== bubbleBox) closeBubble();
  });
  window.addEventListener("scroll", closeBubble, { passive: true });
  document.addEventListener("keydown", (event) => event.key === "Escape" && closeBubble());
  document.addEventListener("portfolio:languagechange", closeBubble);
}

// -------------------------------
// Testimonials: approved notes from Supabase + a moderated submit form
// -------------------------------
// SUPABASE_URL and SUPABASE_ANON_KEY come from supabase-config.js.
const testiSection = document.querySelector(".testimonials");
if (testiSection && typeof SUPABASE_URL !== "undefined") {
  const track = testiSection.querySelector(".testi-track");
  const form = testiSection.querySelector(".testi-form");
  const openBtn = testiSection.querySelector(".testi-open");
  const statusEl = form.querySelector(".testi-status");
  const submitBtn = form.querySelector(".testi-submit");
  const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  const endpoint = `${SUPABASE_URL}/rest/v1/testimonials`;
  // Legacy anon keys are JWTs ("eyJ…") and also go in Authorization; new sb_publishable_ keys only go in apikey.
  const headers = SUPABASE_ANON_KEY.startsWith("eyJ")
    ? { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    : { apikey: SUPABASE_ANON_KEY };
  const LAST_SENT_KEY = "portfolio-testimonial-sent";
  let notes = [];
  let loadState = "loading";

  const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function renderNotes() {
    track.innerHTML = "";
    if (!notes.length) {
      const empty = document.createElement("li");
      empty.className = "testi-empty";
      empty.textContent = loadState === "error"
        ? tr("testi.error", "Couldn't load the notes right now.")
        : loadState === "loading"
          ? tr("testi.loading", "Loading notes…")
          : tr("testi.empty", "No notes yet… be the first to leave one!");
      track.append(empty);
      testiSection.classList.add("is-empty");
      return;
    }
    testiSection.classList.remove("is-empty");
    const dateFormat = new Intl.DateTimeFormat(isFrench() ? "fr-FR" : "en-GB", { month: "long", year: "numeric" });
    notes.forEach((note) => {
      // Built with textContent only: visitor text never becomes HTML.
      const card = document.createElement("li");
      card.className = "testi-card";
      const quote = document.createElement("blockquote");
      quote.textContent = note.message;
      const footer = document.createElement("div");
      footer.className = "testi-author";
      const avatar = document.createElement("span");
      avatar.className = "testi-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = initials(note.name);
      const who = document.createElement("div");
      const name = document.createElement("p");
      name.className = "testi-name";
      name.textContent = note.name;
      const meta = document.createElement("p");
      meta.className = "testi-meta";
      meta.textContent = [note.role, dateFormat.format(new Date(note.created_at))].filter(Boolean).join(" · ");
      who.append(name, meta);
      const badge = document.createElement("span");
      badge.className = "testi-badge";
      badge.textContent = tr(`testi.rel.${note.relation}`, note.relation.charAt(0).toUpperCase() + note.relation.slice(1));
      footer.append(avatar, who, badge);
      card.append(quote, footer);
      card.tabIndex = 0;
      track.append(card);
    });
    layoutPile();
  }

  async function loadNotes() {
    if (!configured) {
      loadState = "ready";
      return renderNotes();
    }
    try {
      const response = await fetch(`${endpoint}?select=name,role,relation,message,created_at&order=created_at.desc&limit=30`, { headers });
      if (!response.ok) throw new Error(response.status);
      notes = await response.json();
      loadState = "ready";
    } catch (err) {
      loadState = "error";
    }
    renderNotes();
  }

  // Messy pile: cards overlap at random-looking but stable angles and offsets.
  // Hover (or tap) zooms a card; clicking one brings it to the top of the pile.
  let topZ = 0;
  const jitter = (seed) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x); // 0..1, same for the same seed on every visit
  };
  function layoutPile() {
    const cards = [...track.querySelectorAll(".testi-card")];
    if (!cards.length) {
      track.style.height = "";
      return;
    }
    const width = track.clientWidth;
    const cardWidth = cards[0].offsetWidth;
    const cols = width < 600 ? 1 : Math.max(1, Math.floor((width - cardWidth) / (cardWidth * 0.62)) + 1);
    const stepX = cols > 1 ? (width - cardWidth) / (cols - 1) : 0;
    const rowHeights = [];
    let bottom = 0;
    cards.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const spread = cols > 1 ? 26 : 18;
      // One column on phones: zig-zag left/right so the pile still looks scattered.
      const baseX = cols > 1 ? col * stepX : (index % 2 ? 1 : 0) * Math.max(0, width - cardWidth);
      const x = Math.max(0, Math.min(width - cardWidth, baseX + (jitter(index + 1) - 0.5) * 2 * spread));
      const rowTop = rowHeights.slice(0, row).reduce((sum, h) => sum + h * (cols > 1 ? 0.62 : 0.7), 0);
      const y = rowTop + (jitter(index + 7) - 0.5) * 2 * 16 + (cols > 1 ? (col % 2) * 22 : 0);
      const angle = (jitter(index + 3) - 0.5) * 2 * (cols > 1 ? 7 : 4.5);
      card.style.left = `${x}px`;
      card.style.top = `${Math.max(0, y)}px`;
      card.style.setProperty("--angle", `${angle.toFixed(2)}deg`);
      card.style.zIndex = card.style.zIndex || String(index + 1);
      rowHeights[row] = Math.max(rowHeights[row] || 0, card.offsetHeight);
      bottom = Math.max(bottom, Math.max(0, y) + card.offsetHeight);
    });
    topZ = Math.max(topZ, cards.length);
    track.style.height = `${bottom + 30}px`;
  }
  track.addEventListener("click", (event) => {
    const card = event.target.closest(".testi-card");
    if (!card) return;
    card.style.zIndex = String(++topZ);
    track.querySelectorAll(".is-zoomed").forEach((other) => other !== card && other.classList.remove("is-zoomed"));
    if (coarsePointer) card.classList.toggle("is-zoomed");
    buzz(6);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".testi-card")) track.querySelectorAll(".is-zoomed").forEach((card) => card.classList.remove("is-zoomed"));
  });
  let pileFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(pileFrame);
    pileFrame = requestAnimationFrame(layoutPile);
  });

  openBtn.addEventListener("click", () => {
    const open = form.hidden;
    form.hidden = !open;
    openBtn.setAttribute("aria-expanded", String(open));
    testiSection.classList.toggle("form-open", open);
    if (open) form.querySelector('input[name="name"]').focus({ preventScroll: true });
    if (window.AOS) AOS.refresh();
  });

  const setStatus = (key, english, kind) => {
    statusEl.textContent = tr(key, english);
    statusEl.dataset.kind = kind || "";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (data.get("website")) return; // honeypot filled: silently drop bots
    const name = String(data.get("name") || "").trim();
    const role = String(data.get("role") || "").trim();
    const message = String(data.get("note") || "").trim();
    if (name.length < 2 || message.length < 20) return setStatus("testi.invalid", "Please add your name and a note of at least 20 characters.", "error");
    if (!configured) return setStatus("testi.notReady", "Notes aren't switched on yet.", "error");
    let lastSent = 0;
    try { lastSent = Number(localStorage.getItem(LAST_SENT_KEY)) || 0; } catch (err) {}
    if (Date.now() - lastSent < 10 * 60 * 1000) return setStatus("testi.tooSoon", "You just sent a note, thank you!", "ok");

    submitBtn.disabled = true;
    setStatus("testi.sending", "Sending…");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ name, role: role || null, relation: data.get("relation") || "colleague", message }),
      });
      if (!response.ok) throw new Error(response.status);
      try { localStorage.setItem(LAST_SENT_KEY, String(Date.now())); } catch (err) {}
      form.reset();
      form.querySelector("textarea").dispatchEvent(new Event("input"));
      setStatus("testi.thanks", "Thank you so much! Your note will show up once it's approved.", "ok");
      window.portfolioTrack?.("testimonial", data.get("relation"));
      notifyNewNote({ name, role, relation: data.get("relation"), message });
      buzz([15, 40, 15]);
      launchConfetti();
    } catch (err) {
      setStatus("testi.failed", "Sending failed. Please try again in a moment.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  document.addEventListener("portfolio:languagechange", renderNotes);
  loadNotes();
}

// -------------------------------
// Email alert for a new testimonial (FormSubmit, same inbox as the contact form)
// -------------------------------
function notifyNewNote(note) {
  const relation = tr(`testi.rel.${note.relation}`, note.relation);
  fetch("https://formsubmit.co/ajax/chakrellaah@gmail.com", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `New portfolio note from ${note.name}`,
      _template: "table",
      _captcha: "false",
      Name: note.name,
      Role: note.role || "-",
      "Worked together as": relation,
      Message: note.message,
      Moderate: new URL("admin.html", location.href).href,
    }),
  }).catch(() => {});
}

// -------------------------------
// Share button in the footer: native share sheet, or copy the link.
// Shared links carry ?ref=share so the admin dashboard can count visits from them.
// -------------------------------
// On some pages script.js runs before the footer is parsed: wait for the DOM.
function addShareButtons() {
  document.querySelectorAll("footer .social").forEach((social) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "share-btn";
    const label = () => tr("share.label", "Share my portfolio");
    button.innerHTML = '<span aria-hidden="true">↗</span> <span class="share-label"></span>';
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

// ===============================
// Hidden Me page
// ===============================
const hiddenPage = document.querySelector(".hidden-me");
if (hiddenPage) {
  // Each chapter tints its section, the side nav and a soft page glow.
  // Colours live in style.css (--chapter-rgb); Technology follows the theme accent.
  const chapters = [...hiddenPage.querySelectorAll("[data-chapter]")];
  const chapterLinks = hiddenPage.querySelectorAll("[data-chapter-link]");
  const chapterGlow = hiddenPage.querySelector(".chapter-glow");
  const colorOf = (name) => {
    const section = chapters.find((entry) => entry.dataset.chapter === name);
    return (section && getComputedStyle(section).getPropertyValue("--chapter-rgb").trim()) || getComputedStyle(document.body).getPropertyValue("--accent-rgb").trim();
  };

  const setChapter = (name) => {
    chapterLinks.forEach((link) => {
      const active = link.dataset.chapterLink === name;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    hiddenPage.style.setProperty("--active-rgb", colorOf(name));
    if (chapterGlow) chapterGlow.style.backgroundColor = `rgba(${colorOf(name)}, 0.16)`;
  };
  if ("IntersectionObserver" in window) {
    // A chapter counts as "being read" when it crosses the middle band of the screen.
    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && setChapter(entry.target.dataset.chapter));
    }, { rootMargin: "-45% 0px -45% 0px" });
    chapters.forEach((section) => chapterObserver.observe(section));
  }
  setChapter(chapters[0]?.dataset.chapter || "tech");
  chapterLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.getElementById(link.getAttribute("href").slice(1));
      target?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      buzz(6);
    });
  });

  // Photos flip over to show fun facts.
  hiddenPage.querySelectorAll(".flip-card").forEach((card) => {
    const flip = () => {
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", String(flipped));
      buzz(8);
    };
    card.addEventListener("click", flip);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        flip();
      }
    });
  });

  // -------------------------------
  // F1 "lights out" reaction game
  // -------------------------------
  const f1 = hiddenPage.querySelector(".f1-game");
  if (f1) {
    const board = f1.querySelector(".f1-board");
    const lights = [...f1.querySelectorAll(".f1-lights span")];
    const prompt = f1.querySelector(".f1-prompt");
    const result = f1.querySelector(".game-result");
    const bestEl = f1.querySelector(".f1-best");
    const BEST_KEY = "portfolio-f1-best";
    let timers = [];
    let goTime = 0;
    let best = null;
    try { best = Number(localStorage.getItem(BEST_KEY)) || null; } catch (err) {}
    const formatTime = (ms) => `${(ms / 1000).toFixed(3)} s`;
    const showBest = () => { bestEl.textContent = best ? formatTime(best) : "–"; };
    const setState = (state, key, english) => {
      f1.dataset.state = state;
      prompt.textContent = tr(key, english);
    };
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

    const start = () => {
      clearTimers();
      result.textContent = "";
      lights.forEach((light) => light.classList.remove("is-on"));
      setState("lights", "hidden.f1.wait", "Wait for the lights to go out…");
      lights.forEach((light, index) => {
        timers.push(setTimeout(() => { light.classList.add("is-on"); buzz(5); }, 700 + index * 800));
      });
      // Like a real start, the hold after the fifth light is unpredictable.
      const outAt = 700 + 4 * 800 + 600 + Math.random() * 2200;
      timers.push(setTimeout(() => {
        lights.forEach((light) => light.classList.remove("is-on"));
        goTime = performance.now();
        setState("go", "hidden.f1.go", "GO! Tap!");
      }, outAt));
    };

    const press = () => {
      const state = f1.dataset.state;
      if (state === "idle" || state === "done") return start();
      if (state === "lights") {
        clearTimers();
        lights.forEach((light) => light.classList.remove("is-on"));
        result.textContent = tr("hidden.f1.jump", "Jump start! Drive-through penalty 😅");
        result.dataset.kind = "error";
        buzz([30, 40, 30]);
        return setState("done", "hidden.f1.again", "Tap to play again");
      }
      if (state === "go") {
        const reaction = performance.now() - goTime;
        const verdict = reaction < 250
          ? tr("hidden.f1.great", "F1 driver level! 🏆")
          : reaction < 350
            ? tr("hidden.f1.good", "Not bad, almost ready for F2!")
            : tr("hidden.f1.slow", "A bit more simulator practice needed.");
        result.textContent = `${formatTime(reaction)} · ${verdict}`;
        window.portfolioTrack?.("game", `f1:${(reaction / 1000).toFixed(3)}`);
        result.dataset.kind = reaction < 250 ? "ok" : "";
        if (!best || reaction < best) {
          best = Math.round(reaction);
          try { localStorage.setItem(BEST_KEY, String(best)); } catch (err) {}
          showBest();
          if (reaction < 250) launchConfetti();
        }
        buzz(15);
        setState("done", "hidden.f1.again", "Tap to play again");
      }
    };
    // pointerdown instead of click: the reaction is measured from the very first touch.
    board.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      press();
    });
    board.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
        event.preventDefault();
        press();
      }
    });
    board.addEventListener("click", (event) => event.preventDefault());
    showBest();
  }

  // -------------------------------
  // Penalty Lab: aim, time the power gauge, and beat a simple keeper model.
  // Units are metres; the SVG draws 1 m as 100 units with the goal line at y = 0.
  // -------------------------------
  const penalty = hiddenPage.querySelector(".penalty-game");
  if (penalty) {
    const HALF_W = 3.66, GOAL_H = 2.44, BALL_R = 0.11, SPOT_DIST = 11, SHOTS = 5;
    const SPOT = { x: 0, y: 60, r: 20 }; // penalty spot in SVG units (in front of the goal line)
    const KEEPER = { start: { x: 0, y: 1.0 }, anticipation: 0.1, speed: 6.2, read: 0.65, reach: 0.95 };
    const svg = penalty.querySelector(".pen-svg");
    const stage = penalty.querySelector(".pen-stage");
    const aimEl = penalty.querySelector(".pen-aim");
    const aimLabel = penalty.querySelector(".pen-aim-label");
    const ballEl = penalty.querySelector(".pen-ball");
    const trailEl = penalty.querySelector(".pen-trail");
    const keeperEl = penalty.querySelector(".pen-keeper");
    const keeperBody = penalty.querySelector(".pen-keeper-body");
    const powerFill = penalty.querySelector(".pen-power-fill");
    const shotsLayer = penalty.querySelector(".pen-shots");
    const heatLayer = penalty.querySelector(".pen-heat");
    const heatToggle = penalty.querySelector(".pen-heat-toggle");
    const help = penalty.querySelector(".pen-help");
    const result = penalty.querySelector(".game-result");
    const tiles = {
      speed: penalty.querySelector(".pen-t-speed"),
      flight: penalty.querySelector(".pen-t-flight"),
      xg: penalty.querySelector(".pen-t-xg"),
      result: penalty.querySelector(".pen-t-result"),
    };
    const SVG_NS = "http://www.w3.org/2000/svg";

    // ----- Model -----
    const randn = () => {
      let u = 0, v = 0;
      while (!u) u = Math.random();
      while (!v) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const speedKmh = (power) => 70 + 50 * power;
    const flightTime = (power) => SPOT_DIST / (speedKmh(power) / 3.6);
    // Harder shots are faster but less accurate.
    const spread = (power) => 0.1 + power * power * 0.42;
    const keeperPlan = () => {
      const r = Math.random();
      const side = r < 0.4 ? -1 : r < 0.8 ? 1 : 0;
      return { reaction: Math.random() * KEEPER.anticipation, guess: { x: side * (1.2 + Math.random() * 2), y: 0.3 + Math.random() * 1.6 } };
    };
    // The keeper commits to a guess, then corrects toward the ball once it has read the shot.
    const keeperAt = (plan, target, t) => {
      const { start } = KEEPER;
      const moving = Math.max(0, t - plan.reaction);
      const read = Math.min(1, Math.max(0, (t - plan.reaction - 0.12) / 0.3)) * KEEPER.read;
      const ax = plan.guess.x + (target.x - plan.guess.x) * read;
      const ay = plan.guess.y + (target.y - plan.guess.y) * read;
      const dx = ax - start.x, dy = ay - start.y, dist = Math.hypot(dx, dy);
      const travel = Math.min(dist, moving * KEEPER.speed);
      return dist ? { x: start.x + (dx / dist) * travel, y: start.y + (dy / dist) * travel } : { ...start };
    };
    const reachAt = (y) => KEEPER.reach - 0.25 * Math.max(0, y - 1.9);
    const simulate = (aim, power) => {
      const plan = keeperPlan();
      const sigma = spread(power);
      const end = { x: aim.x + randn() * sigma, y: Math.max(BALL_R, aim.y + randn() * sigma * 0.8) };
      const t = flightTime(power);
      const keeper = keeperAt(plan, end, t);
      const nearPost = Math.abs(Math.abs(end.x) - HALF_W) < BALL_R && end.y < GOAL_H + BALL_R;
      const nearBar = Math.abs(end.y - GOAL_H) < BALL_R && Math.abs(end.x) < HALF_W + BALL_R;
      let outcome = "goal";
      if (nearPost || nearBar) outcome = "post";
      else if (Math.abs(end.x) > HALF_W || end.y > GOAL_H) outcome = "off";
      else if (Math.hypot(end.x - keeper.x, end.y - keeper.y) <= reachAt(end.y) + BALL_R) outcome = "saved";
      return { plan, end, t, keeper, outcome };
    };
    // Expected goals: share of goals over many simulated shots at this aim and power.
    const expectedGoals = (aim, power, runs = 400) => {
      let goals = 0;
      for (let i = 0; i < runs; i++) if (simulate(aim, power).outcome === "goal") goals++;
      return goals / runs;
    };

    // ----- Drawing helpers -----
    const toSvg = (point) => ({ x: point.x * 100, y: -point.y * 100 });
    const clampAim = (aim) => ({ x: Math.max(-HALF_W - 0.3, Math.min(HALF_W + 0.3, aim.x)), y: Math.max(0.12, Math.min(GOAL_H + 0.3, aim.y)) });
    const svgPoint = (event) => {
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const local = pt.matrixTransform(svg.getScreenCTM().inverse());
      return { x: local.x / 100, y: -local.y / 100 };
    };
    const fmt = (value, digits = 2) => value.toLocaleString(isFrench() ? "fr-FR" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    const outcomeLabel = (outcome) => ({
      goal: tr("hidden.pen.goal", "GOAL! Visca el Barça! 🔵🔴"),
      saved: tr("hidden.pen.saved", "Saved by the keeper… 🧤"),
      off: tr("hidden.pen.off", "Off target, over or wide."),
      post: tr("hidden.pen.post", "Off the woodwork! 🔔"),
    })[outcome];
    const outcomeShort = (outcome) => ({
      goal: tr("hidden.pen.r.goal", "Goal"),
      saved: tr("hidden.pen.r.saved", "Saved"),
      off: tr("hidden.pen.r.off", "Missed"),
      post: tr("hidden.pen.r.post", "Post"),
    })[outcome];

    const placeKeeper = (pos, lean = 0) => {
      const p = toSvg(pos);
      keeperEl.setAttribute("transform", `translate(${p.x} ${p.y})`);
      keeperBody.setAttribute("transform", `rotate(${lean})`);
    };
    const placeBall = (x, y, r) => {
      ballEl.setAttribute("transform", `translate(${x} ${y}) scale(${r / 20})`);
    };

    // ----- Heatmap (computed once, lazily) -----
    let heatBuilt = false;
    const buildHeat = () => {
      if (heatBuilt) return;
      heatBuilt = true;
      const cols = 12, rows = 4, w = (HALF_W * 2) / cols, h = GOAL_H / rows;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const aim = { x: -HALF_W + w * (c + 0.5), y: h * (r + 0.5) };
          const value = expectedGoals(aim, 0.65, 300);
          const cell = document.createElementNS(SVG_NS, "rect");
          cell.setAttribute("x", (-HALF_W + w * c) * 100);
          cell.setAttribute("y", -(h * (r + 1)) * 100);
          cell.setAttribute("width", w * 100);
          cell.setAttribute("height", h * 100);
          // Sequential scale: one hue, opacity follows the probability.
          cell.style.fillOpacity = (0.08 + value * 0.72).toFixed(2);
          heatLayer.append(cell);
          const label = document.createElementNS(SVG_NS, "text");
          label.setAttribute("x", aim.x * 100);
          label.setAttribute("y", -aim.y * 100 + 5);
          label.setAttribute("text-anchor", "middle");
          label.textContent = value.toFixed(2).replace(/^0/, "");
          heatLayer.append(label);
        }
      }
    };
    heatToggle.addEventListener("change", () => {
      if (heatToggle.checked) buildHeat();
      penalty.classList.toggle("show-heat", heatToggle.checked);
    });

    // ----- Game state -----
    let phase = "aim"; // aim -> power -> flight -> (aim | over)
    let aim = { x: 0, y: 1.22 };
    let power = 0;
    let powerStart = 0;
    let powerFrame = 0;
    let shots = [];
    let xgTotal = 0;

    const setHelp = (key, english) => { help.textContent = tr(key, english); };
    const setPhase = (next) => {
      phase = next;
      penalty.dataset.phase = next;
    };
    const updateAim = () => {
      const p = toSvg(aim);
      aimEl.setAttribute("transform", `translate(${p.x} ${p.y})`);
      aimLabel.textContent = `xG ${expectedGoals(aim, 0.65, 250).toFixed(2)}`;
      // Keep the label inside the frame near the right post.
      aimLabel.setAttribute("x", p.x > 250 ? -112 : 34);
    };
    const resetBall = () => {
      placeBall(SPOT.x, SPOT.y, SPOT.r);
      trailEl.setAttribute("points", "");
      placeKeeper(KEEPER.start);
      powerFill.setAttribute("y", 242);
      powerFill.setAttribute("height", 0);
    };
    const updateScore = () => {
      const goals = shots.filter((shot) => shot.outcome === "goal").length;
      penalty.querySelector(".pen-score").textContent = `${goals} / ${shots.length}`;
      penalty.querySelector(".pen-xg").textContent = fmt(xgTotal);
      const delta = penalty.querySelector(".pen-delta");
      if (!shots.length) return (delta.textContent = "");
      const diff = goals - xgTotal;
      delta.textContent = `(${diff >= 0 ? "+" : "−"}${fmt(Math.abs(diff), 1)} ${tr("hidden.pen.vsModel", "vs model")})`;
      delta.dataset.kind = diff >= 0 ? "ok" : "error";
    };
    const startAim = () => {
      setPhase("aim");
      resetBall();
      updateAim();
      setHelp(coarsePointer ? "hidden.pen.helpAimTouch" : "hidden.pen.helpAim", coarsePointer ? "Tap the goal to choose your target." : "Move to aim, then click to lock the target.");
    };

    // Power gauge oscillates; the shot fires when the player stops it.
    const startPower = () => {
      setPhase("power");
      setHelp("hidden.pen.helpPower", "Tap again to stop the power gauge. Too strong costs accuracy!");
      powerStart = performance.now();
      const tick = (now) => {
        power = 0.5 - 0.5 * Math.cos(((now - powerStart) / 1300) * Math.PI * 2);
        powerFill.setAttribute("height", (power * 240).toFixed(1));
        powerFill.setAttribute("y", (242 - power * 240).toFixed(1));
        powerFill.classList.toggle("is-hot", power > 0.8);
        if (phase === "power") powerFrame = requestAnimationFrame(tick);
      };
      powerFrame = requestAnimationFrame(tick);
    };

    const shoot = () => {
      cancelAnimationFrame(powerFrame);
      setPhase("flight");
      const xg = expectedGoals(aim, power, 600);
      const shot = { ...simulate(aim, power), xg, power };
      xgTotal += xg;
      shots.push(shot);
      tiles.speed.textContent = `${fmt(speedKmh(power), 0)} km/h`;
      tiles.flight.textContent = `${fmt(shot.t, 2)} s`;
      tiles.xg.textContent = fmt(xg);
      tiles.result.textContent = "…";
      setHelp("hidden.pen.helpFlight", "Shot in the air…");
      buzz(12);

      const end = toSvg(shot.end);
      const endR = 11;
      // A slight arc: the control point sits above the straight line.
      const ctrl = { x: end.x * 0.45, y: Math.min(SPOT.y, end.y) - 40 };
      const duration = prefersReducedMotion ? 0 : 950;
      const started = performance.now();
      const trail = [];
      const frame = (now) => {
        const u = duration ? Math.min((now - started) / duration, 1) : 1;
        const x = (1 - u) ** 2 * SPOT.x + 2 * (1 - u) * u * ctrl.x + u * u * end.x;
        const y = (1 - u) ** 2 * SPOT.y + 2 * (1 - u) * u * ctrl.y + u * u * end.y;
        placeBall(x, y, SPOT.r + (endR - SPOT.r) * u);
        trail.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        trailEl.setAttribute("points", trail.slice(-14).join(" "));
        // The keeper follows the same model as the outcome, in real proportions.
        const k = keeperAt(shot.plan, shot.end, u * shot.t);
        const lean = Math.max(-75, Math.min(75, (k.x - KEEPER.start.x) * 32));
        placeKeeper(k, lean);
        if (u < 1) return requestAnimationFrame(frame);
        finish(shot);
      };
      requestAnimationFrame(frame);
    };

    const finish = (shot) => {
      const point = toSvg(shot.end);
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", point.x);
      dot.setAttribute("cy", point.y);
      dot.setAttribute("r", 9 + shot.xg * 8);
      dot.setAttribute("class", `pen-dot is-${shot.outcome}`);
      shotsLayer.append(dot);
      if (shot.outcome === "goal") {
        const ripple = document.createElementNS(SVG_NS, "circle");
        ripple.setAttribute("cx", point.x);
        ripple.setAttribute("cy", point.y);
        ripple.setAttribute("r", 14);
        ripple.setAttribute("class", "pen-ripple");
        shotsLayer.append(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      }
      penalty.classList.remove("hit-goal", "hit-saved", "hit-post", "hit-off");
      void penalty.offsetWidth;
      penalty.classList.add(`hit-${shot.outcome}`);
      tiles.result.textContent = outcomeShort(shot.outcome);
      tiles.result.dataset.kind = shot.outcome === "goal" ? "ok" : "error";
      result.textContent = outcomeLabel(shot.outcome);
      result.dataset.kind = shot.outcome === "goal" ? "ok" : "error";
      buzz(shot.outcome === "goal" ? 25 : [20, 30, 20]);
      updateScore();
      if (shots.length >= SHOTS) {
        setPhase("over");
        const goals = shots.filter((entry) => entry.outcome === "goal").length;
        result.textContent += ` ${tr("hidden.pen.done", "Shootout over!")}`;
        setHelp("hidden.pen.helpOver", "Session over: check your shot map, then start a new shootout.");
        if (goals === SHOTS) launchConfetti();
        window.portfolioTrack?.("game", `penalty:${goals}/${SHOTS} xg:${xgTotal.toFixed(2)}`);
        return;
      }
      setTimeout(() => phase === "flight" && startAim(), 1300);
    };

    // ----- Input -----
    stage.addEventListener("pointermove", (event) => {
      if (phase !== "aim" || event.pointerType !== "mouse") return;
      aim = clampAim(svgPoint(event));
      updateAim();
    });
    // click (not pointerdown) so a finger scrolling past the goal never shoots.
    stage.addEventListener("click", (event) => {
      if (phase === "aim") {
        aim = clampAim(svgPoint(event));
        updateAim();
        startPower();
      } else if (phase === "power") {
        shoot();
      }
    });
    stage.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 0.5 : 0.2;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (phase === "aim" && moves[event.key]) {
        event.preventDefault();
        aim = clampAim({ x: aim.x + moves[event.key][0], y: aim.y + moves[event.key][1] });
        updateAim();
      } else if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
        event.preventDefault();
        if (phase === "aim") startPower();
        else if (phase === "power") shoot();
      }
    });

    const reset = () => {
      cancelAnimationFrame(powerFrame);
      shots = [];
      xgTotal = 0;
      shotsLayer.replaceChildren();
      Object.values(tiles).forEach((tile) => { tile.textContent = "–"; tile.dataset.kind = ""; });
      result.textContent = "";
      penalty.classList.remove("hit-goal", "hit-saved", "hit-post", "hit-off");
      updateScore();
      startAim();
    };
    penalty.querySelector(".pen-reset").addEventListener("click", reset);
    document.addEventListener("portfolio:languagechange", () => {
      updateScore();
      if (phase === "aim") startAim();
    });
    reset();
  }

  // -------------------------------
  // Spotify player: shown once a playlist link is set in data-spotify
  // -------------------------------
  hiddenPage.querySelectorAll(".spotify-embed[data-spotify]").forEach((slot) => {
    const match = slot.dataset.spotify.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist|show|episode)\/([A-Za-z0-9]+)/);
    if (!match) return slot.remove();
    const frame = document.createElement("iframe");
    frame.src = `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
    frame.title = "Spotify";
    frame.loading = "lazy";
    frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    slot.append(frame);
  });
}
