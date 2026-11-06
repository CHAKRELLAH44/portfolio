// Home page: key figures, skills, hero, timeline, skill bubbles, testimonials.
// Needs core.js.

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

  // The hint only shows when the frame really has more of the name to swipe to.
  const skillFrame = skillGrid.closest(".skill-frame");
  const swipeHint = document.querySelector(".skill-swipe-hint");
  if (skillFrame && swipeHint) {
    const updateHint = () => (swipeHint.hidden = skillFrame.scrollWidth <= skillFrame.clientWidth + 1);
    new ResizeObserver(updateHint).observe(skillFrame);
    updateHint();
  }

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
// Hero: typed roles under the tagline + glitch on the outlined name
// -------------------------------
const heroRoles = document.querySelector(".hero-roles-text");
if (heroRoles) {
  const roles = {
    en: ["Salesforce Developer", "Software Engineer", "DevOps & Cloud enthusiast", "Full-stack Developer", "Professional bug hunter"],
    fr: ["Développeuse Salesforce", "Ingénieure logicielle", "Passionnée DevOps & Cloud", "Développeuse full-stack", "Chasseuse de bugs pro"],
  };
  // Screen readers get the full list once; the typing effect is hidden from them.
  const rolesForScreenReaders = document.querySelector(".hero-roles-sr");
  const describeRoles = () => {
    if (rolesForScreenReaders) rolesForScreenReaders.textContent = (isFrench() ? roles.fr : roles.en).join(", ");
  };
  describeRoles();
  document.addEventListener("portfolio:languagechange", describeRoles);
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

// Pause the hero's looping animations while it is off screen.
const heroSection = document.querySelector(".hero");
if (heroSection && "IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => heroSection.classList.toggle("is-offscreen", !entry.isIntersecting)).observe(heroSection);
}

// The name: IMANE glitches on hover, on a tap, and every 7 s while the hero is on screen (css/hero.css, hero-glitch).
const heroName = document.querySelector(".hero-name .row-2");
if (heroName && !prefersReducedMotion) {
  const glitch = () => {
    heroName.classList.remove("is-glitching");
    void heroName.offsetWidth; // restart the animation
    heroName.classList.add("is-glitching");
  };
  heroName.addEventListener("pointerenter", glitch);
  heroName.addEventListener("click", glitch);
  heroName.addEventListener("animationend", (event) => {
    if (event.animationName === "hero-glitch") heroName.classList.remove("is-glitching");
  });
  setInterval(() => {
    if (!document.hidden && window.scrollY < window.innerHeight) glitch();
  }, 7000);
}

// Light mode bloom: each hero element glows for a moment when the light reaches it, in order along a diagonal from the
// top right to the bottom left (css/hero.css, hero-bloom). Here every element gets its place on that diagonal, 0 to 1.
if (heroSection && !prefersReducedMotion) {
  const shineTargets = [...heroSection.querySelectorAll(".hero-name .im, .row-3, .hero-roles, .left-side, .right-side, .arrow svg")];
  const placeShine = () => {
    const hero = heroSection.getBoundingClientRect();
    const qMin = -hero.width / Math.SQRT2;
    const qMax = hero.height / Math.SQRT2;
    shineTargets.forEach((el) => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2 - hero.left;
      const y = r.top + r.height / 2 - hero.top;
      const t = ((-x + y) / Math.SQRT2 - qMin) / (qMax - qMin);
      el.style.setProperty("--shine-t", Math.min(1, Math.max(0, t)).toFixed(3));
    });
  };
  // after the intro, when the letters and the fading texts are in their places
  setTimeout(() => {
    placeShine();
    heroSection.classList.add("is-lit");
  }, 3800);
  let shineTimer;
  const placeShineLater = () => {
    clearTimeout(shineTimer);
    shineTimer = setTimeout(placeShine, 150);
  };
  window.addEventListener("resize", placeShineLater);
  document.addEventListener("portfolio:languagechange", placeShineLater);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeShineLater);
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
// Long press on a skill logo: bubble with its domain and the projects that use it
// -------------------------------
if (skillGrid) {
  const PROJECT_TITLES = {
    cicd: "CI/CD Pipeline Automation",
    ansible: "Automated Package Deployment",
    dmz: "DMZ Virtual Network Architecture",
    twitter: "Twitter Automation Agent",
    coffee: "Coffee Shop",
    health: "Healthcare AI – Predicting Patient Survival",
    reco: "Recommendation System – E-commerce",
    bank: "Bank Management System",
    ecom: "E-commerce Microservices Platform",
    echstore: "Ech Store – JEE Website",
    movie: "Movie Management System",
    taxi: "Online Taxi Reservation System",
    faith: "FAITH Quran – Quran Reading PWA",
    ora: "BlaBlaGym – AI Language Coach",
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
    "MySQL": ["bank", "hotelJava"], "PostgreSQL": ["faith", "ora"], "Firebase": ["exams", "carRental"], "H2 Database": ["ecom"],
    "GitHub": ["cicd"], "C++": ["hotelCpp"], ".NET": ["movie"], "C#": ["movie"],
    "Python": ["twitter", "health", "reco"], "Java": ["ecom", "echstore", "hotelJava", "exams"],
    "Salesforce / Apex": ["p2p"], "Spring Boot": ["bank", "ecom"], "Django": ["taxi"], "REST / Swagger": ["bank", "ecom"],
    "Grafana": ["cicd"], "Prometheus": ["cicd"], "Ansible": ["ansible"], "Docker": ["cicd"], "AWS": ["coffee"],
    "Kubernetes": ["cicd"], "Jenkins / CI/CD": ["cicd"], "Argo CD": ["cicd"], "Proxmox": ["dmz"], "pfSense": ["dmz"],
    // Data & AI
    "TensorFlow": ["health"], "scikit-learn": ["health"], "Streamlit": ["health"], "Power BI": ["health"],
    "Apache Spark": ["reco"], "Elasticsearch": ["reco"], "Apache Kafka": ["reco"], "Hugging Face": ["twitter"],
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

  // Under the frame: the projects of the logo being pointed at, or of the one picked with a tap. The old content
  // fades out, then the new one comes in, so that moving across the logos stays smooth.
  const detail = document.querySelector(".skill-detail");
  const detailInner = detail?.querySelector(".skill-detail-inner");
  if (detail) {
    let shown; // the box on display: undefined until the first render, null for the invitation
    let swapTimer = 0;
    const render = (box) => {
      detailInner.textContent = "";
      const title = document.createElement("p");
      title.className = "skill-detail-title";
      if (!box) {
        title.classList.add("is-invite");
        title.textContent = coarsePointer
          ? tr("skills.detailTap", "Tap a logo to see the projects where I used it")
          : tr("skills.detailHover", "Point at a logo to see the projects where I used it");
        detailInner.append(title);
        return;
      }
      const projects = SKILL_PROJECTS[box.dataset.name] || [];
      title.textContent = box.dataset.name;
      const label = document.createElement("span");
      label.textContent = projects.length ? tr("skills.usedIn", "Used in") : tr("skills.everyday", "Part of my everyday toolbox.");
      title.append(" ", label);
      detailInner.append(title);
      if (!projects.length) return;
      const list = document.createElement("ul");
      list.className = "skill-detail-list";
      projects.forEach((key, index) => {
        const item = document.createElement("li");
        item.style.setProperty("--i", index);
        item.textContent = tr(`proj.${key}.title`, PROJECT_TITLES[key]);
        list.append(item);
      });
      detailInner.append(list);
    };
    const show = (box) => {
      const target = box || skillGrid.querySelector(".skill-box.is-picked");
      if (target === shown) return;
      shown = target;
      clearTimeout(swapTimer);
      detail.classList.add("is-changing");
      swapTimer = setTimeout(() => {
        render(shown);
        detail.classList.remove("is-changing");
      }, prefersReducedMotion ? 0 : 130);
    };
    skillGrid.addEventListener("pointerover", (event) => {
      if (event.pointerType !== "mouse") return;
      const box = event.target.closest(".skill-box");
      if (box) show(box);
    });
    skillGrid.closest(".skill-frame").addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") show(null);
    });
    skillGrid.addEventListener("focusin", (event) => {
      const box = event.target.closest(".skill-box");
      if (box) show(box);
    });
    skillGrid.addEventListener("focusout", () => show(null));
    // A tap toggles the picked logo first (listener on the box itself), then this reads the result.
    skillGrid.addEventListener("click", (event) => {
      const box = event.target.closest(".skill-box");
      if (box) show(box.classList.contains("is-picked") ? box : null);
    });
    render(null);
    shown = null;
    document.addEventListener("portfolio:languagechange", () => render(shown));
  }

  document.addEventListener("pointerdown", (event) => {
    if (!bubble.hidden && !bubble.contains(event.target) && event.target.closest(".skill-box") !== bubbleBox) closeBubble();
  });
  window.addEventListener("scroll", closeBubble, { passive: true });
  skillGrid.closest(".skill-frame")?.addEventListener("scroll", closeBubble, { passive: true });
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
// Email alert for a new testimonial (EmailJS, same inbox as the contact form)
// -------------------------------
function notifyNewNote(note) {
  const config = window.EMAILJS_CONFIG;
  if (!window.emailjs || !config?.publicKey || !config.serviceId || !config.templateId) {
    console.warn("Testimonial was saved, but its email notification could not be sent: EmailJS is unavailable or not configured.");
    return;
  }
  const relation = tr(`testi.rel.${note.relation}`, note.relation);
  window.emailjs.send(config.serviceId, config.templateId, {
    from_name: note.name,
    reply_to: "",
    topic: `Testimonial · ${relation}`,
    subject: `New portfolio note from ${note.name}`,
    message: `${note.message}\n\nRole: ${note.role || "-"}\nWorked together as: ${relation}\nModerate: ${new URL("perso.html", location.href).href}`,
  }, { publicKey: config.publicKey }).catch((error) => {
    console.warn("Testimonial was saved, but its email notification could not be sent.", error);
  });
}

// -------------------------------
// Header: mark the About link while the About section is on screen
// -------------------------------
const aboutSection = document.querySelector("#about");
const aboutLink = document.querySelector('#primary-nav a[href$="#about"]');
if (aboutSection && aboutLink && "IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) aboutLink.setAttribute("aria-current", "location");
    else aboutLink.removeAttribute("aria-current");
  }, { rootMargin: "-40% 0px -40% 0px" }).observe(aboutSection);
}
