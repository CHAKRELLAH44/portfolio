// CV page (cv.html): shows assets/docs/cv.pdf with PDF.js (self-hosted in js/vendor/pdfjs), because many phone browsers
// cannot show a PDF inside a page. 100% means "as wide as the frame". The clicks on the CV links of the other pages
// lead here with ?downloaded=1 (js/core.js), which brings up the notification.
(() => {
  const stage = document.querySelector(".cv-stage");
  const pagesBox = stage.querySelector(".cv-pages");
  const statusLine = stage.querySelector(".cv-status");
  const errorLine = stage.querySelector(".cv-error");
  const level = document.querySelector(".cv-level");
  const zoomOut = document.querySelector('[data-zoom="out"]');
  const zoomIn = document.querySelector('[data-zoom="in"]');
  const MIN = 0.5;
  const MAX = 4;
  const STEP = 1.25;
  const PDF_URL = "assets/docs/cv.pdf";
  const pages = []; // { page, canvas, base (unscaled size), task }
  let zoom = 1;
  let renderTimer = 0;

  // ----- Notification -----
  const notice = document.querySelector(".cv-notice");
  let noticeTimer = 0;
  const hideNotice = () => {
    clearTimeout(noticeTimer);
    if (notice.hidden) return;
    notice.classList.add("is-leaving");
    setTimeout(() => {
      notice.hidden = true;
      notice.classList.remove("is-leaving");
    }, prefersReducedMotion ? 0 : 250);
  };
  const showNotice = () => {
    clearTimeout(noticeTimer);
    notice.classList.remove("is-leaving");
    notice.hidden = false;
    noticeTimer = setTimeout(hideNotice, 9000);
    buzz([15, 40, 15]);
  };
  notice.querySelector(".cv-notice-close").addEventListener("click", hideNotice);
  // On this page every CV link only downloads: there is nowhere else to go.
  document.addEventListener("click", (event) => {
    if (event.target.closest('a[href$="cv.pdf"][download]')) showNotice();
  });
  const params = new URLSearchParams(location.search);
  if (params.has("downloaded")) {
    showNotice();
    // A reload or a shared link should not announce a download again.
    history.replaceState(null, "", location.pathname + location.hash);
  }

  // ----- Rendering -----
  const fitWidth = () => {
    const widest = Math.max(...pages.map((entry) => entry.base.width));
    const padding = Number.parseFloat(getComputedStyle(pagesBox).paddingLeft) * 2;
    return (stage.clientWidth - padding) / widest;
  };
  const sizePages = () => {
    const scale = fitWidth() * zoom;
    pages.forEach((entry) => {
      entry.canvas.style.width = `${entry.base.width * scale}px`;
      entry.canvas.style.height = `${entry.base.height * scale}px`;
    });
    level.textContent = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= MIN + 0.001;
    zoomIn.disabled = zoom >= MAX - 0.001;
    return scale;
  };
  const drawPages = async () => {
    const scale = fitWidth() * zoom;
    const ratio = window.devicePixelRatio || 1;
    await Promise.all(pages.map(async (entry) => {
      entry.task?.cancel();
      // Sharp text without asking a phone for a giant image.
      const pixels = Math.min(scale * ratio, Math.sqrt(16000000 / (entry.base.width * entry.base.height)));
      const viewport = entry.page.getViewport({ scale: pixels });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      entry.task = entry.page.render({ canvasContext: canvas.getContext("2d"), viewport });
      try {
        await entry.task.promise;
      } catch (err) {
        return; // replaced by a newer zoom
      }
      // Only the finished image replaces the old one, so the page never flashes white while zooming.
      canvas.style.cssText = entry.canvas.style.cssText;
      canvas.setAttribute("aria-hidden", "true");
      entry.canvas.replaceWith(canvas);
      entry.canvas = canvas;
    }));
  };
  const askDraw = () => {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(drawPages, 140);
  };
  // Keeps the same point of the CV under the given spot of the frame while zooming.
  const setZoom = (next, focusX = stage.clientWidth / 2, focusY = stage.clientHeight / 2) => {
    const target = Math.min(MAX, Math.max(MIN, next));
    if (!pages.length || target === zoom) return;
    const rangeX = (stage.scrollLeft + focusX) / stage.scrollWidth;
    const rangeY = (stage.scrollTop + focusY) / stage.scrollHeight;
    zoom = target;
    sizePages();
    stage.scrollLeft = rangeX * stage.scrollWidth - focusX;
    stage.scrollTop = rangeY * stage.scrollHeight - focusY;
    askDraw();
  };

  document.querySelector(".cv-toolbar").addEventListener("click", (event) => {
    const action = event.target.closest("[data-zoom]")?.dataset.zoom;
    if (action === "in") setZoom(zoom * STEP);
    if (action === "out") setZoom(zoom / STEP);
    if (action === "fit") setZoom(1);
  });

  // Ctrl + scroll, or a trackpad pinch, which browsers report the same way.
  stage.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const box = stage.getBoundingClientRect();
    setZoom(zoom * Math.exp(-event.deltaY * 0.0025), event.clientX - box.left, event.clientY - box.top);
  }, { passive: false });

  stage.addEventListener("keydown", (event) => {
    if (event.key === "+" || event.key === "=") setZoom(zoom * STEP);
    else if (event.key === "-") setZoom(zoom / STEP);
    else if (event.key === "0") setZoom(1);
    else return;
    event.preventDefault();
  });

  // Two fingers.
  let pinch = null;
  const spread = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  stage.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) pinch = { distance: spread(event.touches), zoom };
  }, { passive: true });
  stage.addEventListener("touchmove", (event) => {
    if (!pinch || event.touches.length !== 2) return;
    event.preventDefault();
    const box = stage.getBoundingClientRect();
    const x = (event.touches[0].clientX + event.touches[1].clientX) / 2 - box.left;
    const y = (event.touches[0].clientY + event.touches[1].clientY) / 2 - box.top;
    setZoom(pinch.zoom * (spread(event.touches) / pinch.distance), x, y);
  }, { passive: false });
  stage.addEventListener("touchend", (event) => {
    if (event.touches.length < 2) pinch = null;
  });

  // Drag with the mouse to move around a zoomed CV.
  let drag = null;
  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag) return;
    stage.scrollLeft = drag.left - (event.clientX - drag.x);
    stage.scrollTop = drag.top - (event.clientY - drag.y);
  });
  const endDrag = () => {
    drag = null;
    stage.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  let lastWidth = 0;
  new ResizeObserver(() => {
    if (!pages.length || stage.clientWidth === lastWidth) return;
    lastWidth = stage.clientWidth;
    sizePages();
    askDraw();
  }).observe(stage);

  // ----- Loading -----
  (async () => {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "js/vendor/pdfjs/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument({ url: PDF_URL, isEvalSupported: false }).promise;
      for (let number = 1; number <= pdf.numPages; number += 1) {
        const page = await pdf.getPage(number);
        const canvas = document.createElement("canvas");
        canvas.setAttribute("aria-hidden", "true");
        pagesBox.append(canvas);
        pages.push({ page, canvas, base: page.getViewport({ scale: 1 }), task: null });
      }
      lastWidth = stage.clientWidth;
      sizePages();
      await drawPages();
      statusLine.hidden = true;
    } catch (err) {
      statusLine.hidden = true;
      errorLine.hidden = false;
    }
  })();
})();
