// Hidden Me page: chapters, flip cards, F1 reaction game, Penalty Lab, Spotify embed.
// Needs core.js.

// ===============================
// Hidden Me page
// ===============================
const hiddenPage = document.querySelector(".hidden-me");
if (hiddenPage) {
  // Photos flip over to show fun facts. This comes first so the cards keep working
  // even if a mini-game below fails to start.
  // The real control is the .flip-toggle button laid over the photo: it is focusable, Enter and
  // Space activate it natively, and aria-pressed tells screen readers whether the facts are showing.
  hiddenPage.querySelectorAll(".flip-card").forEach((card) => {
    const toggle = card.querySelector(".flip-toggle");
    card.addEventListener("click", () => {
      const flipped = card.classList.toggle("is-flipped");
      toggle?.setAttribute("aria-pressed", String(flipped));
      if (typeof buzz === "function") buzz(8);
    });
  });

  // Each chapter tints its section, the side nav and a soft page glow.
  // Colours live in css/hidden-me.css (--chapter-rgb); Technology follows the theme accent.
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

  // Mini-games stay folded behind a "Play" button until someone wants to play.
  const icon = (body) => `<svg class="ui-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const ICON_FLAG = icon('<path d="M4 22V4"/><path d="M4 4h15l-3 4.5 3 4.5H4"/><path d="M9 4v9M14 4v9M4 8.5h15"/>');
  const ICON_BALL = icon('<circle cx="12" cy="12" r="9"/><path d="m12 7.5 4 2.9-1.5 4.7h-5L8 10.4z"/><path d="M12 3v4.5M16 10.4l4.3-1.4M14.5 15.1l2.7 3.7M9.5 15.1l-2.7 3.7M8 10.4 3.7 9"/>');
  const ICON_PLAY = icon('<path d="M8 5v14l11-7z" fill="currentColor"/>');
  const ICON_CLOSE = icon('<path d="M6 6l12 12M18 6 6 18"/>');
  hiddenPage.querySelectorAll(".f1-game, .penalty-game").forEach((game) => {
    const isF1 = game.classList.contains("f1-game");
    const slot = document.createElement("div");
    slot.className = "game-slot";
    const launch = document.createElement("button");
    launch.type = "button";
    launch.className = "game-launch";
    launch.setAttribute("aria-expanded", "false");
    const bodyId = isF1 ? "game-f1" : "game-penalty";
    launch.setAttribute("aria-controls", bodyId);
    launch.innerHTML = `<span class="game-launch-icon" aria-hidden="true"></span><span class="game-launch-text"><strong></strong><small></small></span><span class="game-launch-emoji" aria-hidden="true">${isF1 ? ICON_FLAG : ICON_BALL}</span>`;
    const body = document.createElement("div");
    body.className = "game-body";
    body.id = bodyId;
    body.inert = true;
    game.before(slot);
    slot.append(launch, body);
    body.append(game);

    const label = () => {
      const open = slot.classList.contains("is-open");
      launch.querySelector(".game-launch-icon").innerHTML = open ? ICON_CLOSE : ICON_PLAY;
      launch.querySelector("strong").textContent = open ? tr("hidden.game.close", "Close the game") : tr("hidden.game.play", "Play");
      launch.querySelector("small").textContent = game.querySelector(".game-title").textContent;
    };
    launch.addEventListener("click", () => {
      const open = !slot.classList.contains("is-open");
      slot.classList.toggle("is-open", open);
      launch.setAttribute("aria-expanded", String(open));
      body.inert = !open;
      if (!open) game.dispatchEvent(new CustomEvent("gameclose"));
      else window.portfolioTrack?.("game", `open:${isF1 ? "f1" : "penalty"}`);
      label();
      buzz(8);
      if (open && !prefersReducedMotion) {
        setTimeout(() => body.scrollIntoView({ behavior: "smooth", block: "nearest" }), 380);
      }
    });
    document.addEventListener("portfolio:languagechange", label);
    label();
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
        result.textContent = tr("hidden.f1.jump", "Jump start! Drive-through penalty.");
        result.dataset.kind = "error";
        buzz([30, 40, 30]);
        return setState("done", "hidden.f1.again", "Tap to play again");
      }
      if (state === "go") {
        const reaction = performance.now() - goTime;
        const verdict = reaction < 250
          ? tr("hidden.f1.great", "F1 driver level!")
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
    // Closing the game mid-start switches the lights off.
    f1.addEventListener("gameclose", () => {
      clearTimers();
      lights.forEach((light) => light.classList.remove("is-on"));
      setState("idle", "hidden.f1.start", "Tap to start");
    });
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
      goal: tr("hidden.pen.goal", "GOAL! Visca el Barça!"),
      saved: tr("hidden.pen.saved", "Saved by the keeper…"),
      off: tr("hidden.pen.off", "Off target, over or wide."),
      post: tr("hidden.pen.post", "Off the woodwork!"),
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
    penalty.addEventListener("gameclose", () => {
      if (phase === "power") {
        cancelAnimationFrame(powerFrame);
        startAim();
      }
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
    slot.hidden = false;
  });
}
