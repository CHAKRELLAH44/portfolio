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
