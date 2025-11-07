let lastScrollTop = 0;
const header = document.querySelector("header");
const timeText = document.querySelector(".time");

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
  const now = new Date();
  const rabatTime = now.toLocaleString("en-US", { timeZone: "Africa/Casablanca" });
  const [date, time] = rabatTime.split(", ");
  timeText.textContent = `${time} GMT+1`;
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

    // Attach both pointerdown and click to be robust across browsers / overlays
    btn.addEventListener('pointerdown', handler);
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
    descEl.innerHTML = `<h3 class="desc-heading">Description</h3><div class="desc-text">${chosen.replace(/\n/g, '<br><br>')}</div>`;
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

  // populate slides
    currentSlides = screenshots;
    currentIndex = 0;
    renderSlides();

    modal.classList.add('open');
    // focus for accessibility
    closeBtn.focus();
  }

  function renderSlides() {
    slidesEl.innerHTML = '';
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

// Initialize immediately if DOM is already ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectModal);
} else {
  initProjectModal();
}

