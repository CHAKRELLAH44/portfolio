// Projects page: project modal, domain filters, course carousel, card tilt.
// Needs core.js.

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
        const t = card.querySelector('.desc h3')?.innerText || '<no-title>';
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
    const title = card.querySelector('.desc h3')?.innerText || '';
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

    // place only a compact icon in the top-right of the panel: GitHub, or a document for a report
    githubArea.innerHTML = '';
    githubTopRight.innerHTML = '';
    if (githubHref) {
      const isDoc = githubAnchor.dataset.linkType === 'doc';
      const topA = document.createElement('a');
      topA.href = githubHref;
      topA.target = '_blank';
      topA.rel = 'noopener noreferrer';
      topA.className = 'download-button';
      const label = isDoc ? tr("proj.reportTitle", "Read the project report") : 'Open GitHub in a new tab';
      topA.setAttribute('aria-label', label);
      topA.title = label;
      topA.style.display = 'inline-flex';
      topA.innerHTML = isDoc ? `<box-icon name='file' type='solid'></box-icon>` : `<box-icon name='github' type='logo'></box-icon>`;
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
  const title = card.querySelector('.desc h3').innerText;
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
