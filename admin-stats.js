// Visit statistics tab of admin.html. Reads public.events (supabase/analytics.sql)
// through api() from admin.js and aggregates everything in the browser.
(() => {
  const $ = (id) => document.getElementById(id);
  const kpisEl = $("kpis");
  const chartEl = $("visits-chart");
  const tooltip = $("tooltip");
  const visitsBody = $("visits-body");
  const ignoreBox = $("ignore-me");
  let rangeDays = 7;
  let cache = { days: null, rows: null };

  const PAGE_NAMES = { index: "Accueil", projects: "Projets", contact: "Contact", "hidden-me": "Hidden Me", 404: "Page 404" };
  const DEVICE_NAMES = { mobile: "📱 Mobile", tablet: "📲 Tablette", desktop: "💻 Ordinateur" };
  const nf = new Intl.NumberFormat("fr-FR");
  const fmtDuration = (ms) => {
    if (!ms) return "–";
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")}`;
  };
  const place = (tz) => {
    if (!tz) return "Inconnu";
    const parts = tz.split("/");
    return parts.length > 1 ? `${parts[parts.length - 1].replace(/_/g, " ")} · ${parts[0]}` : tz;
  };
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  try { ignoreBox.checked = localStorage.getItem("portfolio-ignore-me") === "1"; } catch (err) {}
  ignoreBox.addEventListener("change", () => {
    try {
      if (ignoreBox.checked) localStorage.setItem("portfolio-ignore-me", "1");
      else localStorage.removeItem("portfolio-ignore-me");
    } catch (err) {}
  });

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => {
      rangeDays = Number(button.dataset.range);
      document.querySelectorAll("[data-range]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      showStats();
    });
  });

  // Supabase returns at most 1000 rows per request: page through with offset.
  async function fetchEvents(days) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const rows = [];
    for (let offset = 0; offset < 50000; offset += 1000) {
      const page = await api(`events?select=*&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=1000&offset=${offset}`);
      if (page === null) return null;
      rows.push(...page);
      if (page.length < 1000) break;
    }
    return rows;
  }

  // One entry per visit (browser tab session).
  function toVisits(rows) {
    const visits = new Map();
    [...rows].reverse().forEach((row) => {
      let visit = visits.get(row.session_id);
      if (!visit) {
        visit = { id: row.session_id, start: row.created_at, end: row.created_at, source: row.source, ref: row.ref, device: row.device, os: row.os, browser: row.browser, timezone: row.timezone, lang: row.lang, pages: [], durationMs: 0, scroll: 0, actions: [], pageTime: {} };
        visits.set(row.session_id, visit);
      }
      visit.end = row.created_at;
      if (row.type === "view") {
        if (visit.pages[visit.pages.length - 1] !== row.page) visit.pages.push(row.page);
      } else if (row.type === "leave") {
        visit.durationMs += row.duration_ms || 0;
        visit.pageTime[row.page] = (visit.pageTime[row.page] || 0) + (row.duration_ms || 0);
        visit.scroll = Math.max(visit.scroll, row.scroll_pct || 0);
      } else {
        visit.actions.push(row);
      }
    });
    return [...visits.values()].filter((visit) => visit.pages.length);
  }

  function renderKpis(rows, visits) {
    const views = rows.filter((row) => row.type === "view").length;
    const count = (type) => rows.filter((row) => row.type === type).length;
    const timed = visits.filter((visit) => visit.durationMs > 0);
    const avgTime = timed.length ? timed.reduce((sum, v) => sum + v.durationMs, 0) / timed.length : 0;
    const avgScroll = timed.length ? Math.round(timed.reduce((sum, v) => sum + v.scroll, 0) / timed.length) : 0;
    const now = Date.now();
    const live = visits.filter((visit) => now - new Date(visit.end).getTime() < 5 * 60000).length;
    const shared = visits.filter((visit) => visit.source === "Shared link").length;
    const tiles = [
      ["Visites", nf.format(visits.length), `${nf.format(views)} pages vues`],
      ["En ce moment", nf.format(live), "actives ces 5 dernières min", live > 0],
      ["Temps moyen", fmtDuration(avgTime), "par visite"],
      ["Lecture moyenne", avgScroll ? `${avgScroll} %` : "–", "de la page parcourue"],
      ["CV téléchargés", nf.format(count("cv")), ""],
      ["Contacts", nf.format(count("contact")), "formulaire envoyé ou clic email"],
      ["Partages", nf.format(count("share")), `${nf.format(shared)} visites via un lien partagé`],
      ["Remarques", nf.format(count("testimonial")), "laissées sur le site"],
    ];
    kpisEl.replaceChildren(...tiles.map(([label, value, sub, live]) => {
      const tile = el("div", `kpi${live ? " is-live" : ""}`);
      tile.append(el("p", "kpi-label", label), el("p", "kpi-value", value));
      if (sub) tile.append(el("p", "kpi-sub", sub));
      return tile;
    }));
  }

  // Column chart of visits per day (per hour for 24 h). Single series, accent colour.
  function renderChart(visits) {
    const hourly = rangeDays === 1;
    const buckets = [];
    const now = new Date();
    const count = hourly ? 24 : rangeDays;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      if (hourly) d.setHours(now.getHours() - i, 0, 0, 0);
      else { d.setDate(now.getDate() - i); d.setHours(0, 0, 0, 0); }
      buckets.push({ start: d, value: 0 });
    }
    visits.forEach((visit) => {
      const t = new Date(visit.start);
      const key = new Date(t);
      if (hourly) key.setMinutes(0, 0, 0); else key.setHours(0, 0, 0, 0);
      const bucket = buckets.find((b) => b.start.getTime() === key.getTime());
      if (bucket) bucket.value++;
    });
    $("chart-title").textContent = hourly ? "Visites par heure" : "Visites par jour";
    const total = buckets.reduce((sum, b) => sum + b.value, 0);
    const peak = buckets.reduce((best, b) => (b.value > best.value ? b : best), buckets[0]);
    const labelOf = (b) => hourly
      ? `${String(b.start.getHours()).padStart(2, "0")} h`
      : b.start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    $("chart-sub").textContent = total ? `${nf.format(total)} visites · pic : ${labelOf(peak)} (${peak.value})` : "Aucune visite sur la période";

    // Drawn at the real width so axis text stays at 11px on phones too.
    const W = Math.max(300, Math.round(chartEl.clientWidth || 720)), H = 220, padL = 32, padB = 26, padT = 10;
    const max = Math.max(1, ...buckets.map((b) => b.value));
    // Round step (1, 2, 5, 10, 20…) giving at most 4 intervals.
    const step = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((s) => max / s <= 4) || Math.ceil(max / 4);
    const niceMax = Math.ceil(max / step) * step;
    const slot = (W - padL) / buckets.length;
    const barW = Math.max(3, Math.min(28, slot - 2)); // 2px gap between bars
    const y = (v) => padT + (H - padT - padB) * (1 - v / niceMax);
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", $("chart-sub").textContent);
    const ticks = [];
    for (let v = 0; v <= niceMax; v += step) ticks.push(v);
    ticks.forEach((tick) => {
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", padL); line.setAttribute("x2", W);
      line.setAttribute("y1", y(tick)); line.setAttribute("y2", y(tick));
      line.setAttribute("class", tick === 0 ? "axis" : "grid");
      svg.append(line);
      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", padL - 8); label.setAttribute("y", y(tick) + 4);
      label.setAttribute("text-anchor", "end"); label.setAttribute("class", "tick");
      label.textContent = Number.isInteger(tick) ? tick : tick.toFixed(1);
      svg.append(label);
    });
    const every = Math.ceil(buckets.length / Math.max(3, Math.floor(W / 90)));
    buckets.forEach((bucket, i) => {
      const cx = padL + slot * i + slot / 2;
      if (bucket.value) {
        // Rounded top, square base: a path with 4px radius on the data end only.
        const top = y(bucket.value), base = y(0), r = Math.min(4, barW / 2, base - top);
        const x0 = cx - barW / 2, x1 = cx + barW / 2;
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", `M${x0} ${base} V${top + r} Q${x0} ${top} ${x0 + r} ${top} H${x1 - r} Q${x1} ${top} ${x1} ${top + r} V${base} Z`);
        path.setAttribute("class", "bar");
        svg.append(path);
      }
      // Every n-th label, plus the last one when it does not crowd the previous label.
      const isLast = i === buckets.length - 1;
      if (i % every === 0 || (isLast && i % every >= every / 2)) {
        const label = document.createElementNS(NS, "text");
        label.setAttribute("x", cx); label.setAttribute("y", H - 8);
        label.setAttribute("text-anchor", "middle"); label.setAttribute("class", "tick");
        label.textContent = hourly ? `${bucket.start.getHours()}h` : bucket.start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        svg.append(label);
      }
      // Full-height hit target, larger than the bar.
      const hit = document.createElementNS(NS, "rect");
      hit.setAttribute("x", padL + slot * i); hit.setAttribute("y", padT);
      hit.setAttribute("width", slot); hit.setAttribute("height", H - padT - padB);
      hit.setAttribute("class", "hit");
      hit.dataset.tip = `${labelOf(bucket)} : ${bucket.value} visite${bucket.value > 1 ? "s" : ""}`;
      svg.append(hit);
    });
    chartEl.replaceChildren(svg);
  }

  // Ranked horizontal bars with the number written next to each.
  function renderBars(listId, entries, { limit = 7, format } = {}) {
    const list = $(listId);
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, limit);
    const rest = sorted.slice(limit).reduce((sum, [, v]) => sum + v, 0);
    if (rest) top.push(["Autres", rest]);
    if (!top.length) return list.replaceChildren(el("li", "bars-empty", "Pas encore de données"));
    const max = Math.max(...top.map(([, v]) => v));
    const total = sorted.reduce((sum, [, v]) => sum + v, 0);
    list.replaceChildren(...top.map(([label, value, extra]) => {
      const item = el("li");
      const head = el("div", "bar-head");
      head.append(el("span", "bar-label", label), el("span", "bar-value", format ? format(value, extra) : `${nf.format(value)} · ${Math.round((value / total) * 100)} %`));
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = `${Math.max(2, (value / max) * 100)}%`;
      track.append(fill);
      item.append(head, track);
      item.dataset.tip = `${label} : ${format ? format(value, extra) : nf.format(value)}`;
      return item;
    }));
  }

  const tally = (items) => {
    const map = new Map();
    items.forEach((key) => map.set(key, (map.get(key) || 0) + 1));
    return [...map.entries()];
  };

  function renderLists(rows, visits) {
    const sourceName = (s) => (s === "Shared link" ? "🔗 Lien partagé" : s === "Direct" ? "Accès direct / favori" : s || "Inconnu");
    renderBars("bars-source", tally(visits.map((v) => sourceName(v.source))));
    const views = rows.filter((row) => row.type === "view");
    const pageTime = {};
    const pageTimed = {};
    visits.forEach((visit) => Object.entries(visit.pageTime).forEach(([page, ms]) => {
      pageTime[page] = (pageTime[page] || 0) + ms;
      pageTimed[page] = (pageTimed[page] || 0) + 1;
    }));
    renderBars("bars-page", tally(views.map((row) => row.page)).map(([page, n]) => [PAGE_NAMES[page] || page, n, pageTimed[page] ? pageTime[page] / pageTimed[page] : 0]),
      { format: (n, avg) => `${nf.format(n)} vues · ${fmtDuration(avg)}` });
    renderBars("bars-tz", tally(visits.map((v) => place(v.timezone))));
    renderBars("bars-device", [
      ...tally(visits.map((v) => DEVICE_NAMES[v.device] || v.device || "Inconnu")),
      ...tally(visits.map((v) => `${v.os || "?"} · ${v.browser || "?"}`)).map(([k, n]) => [`   ${k}`, n]),
    ], { limit: 9, format: (n) => nf.format(n) });
    renderBars("bars-outbound", tally(rows.filter((row) => row.type === "outbound").map((row) => row.detail || "?")), { format: (n) => `${nf.format(n)} clic${n > 1 ? "s" : ""}` });
    renderBars("bars-lang", [
      ...tally(visits.map((v) => `🌐 ${(v.lang || "?").toLowerCase()}`)),
      ...tally(visits.filter((v) => v.ref && v.ref !== "share").map((v) => `?ref=${v.ref}`)),
    ], { limit: 8, format: (n) => nf.format(n) });
  }

  function renderVisits(visits) {
    const rows = [...visits].sort((a, b) => new Date(b.start) - new Date(a.start)).slice(0, 40);
    if (!rows.length) {
      const tr = el("tr");
      const td = el("td", "bars-empty", "Aucune visite pour l'instant. Partage ton lien !");
      td.colSpan = 8;
      tr.append(td);
      return visitsBody.replaceChildren(tr);
    }
    const when = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
    const ACTION_ICONS = { cv: "📄 CV", contact: "✉️ Contact", share: "↗ Partage", testimonial: "💬 Remarque", outbound: "🔗", game: "🎮" };
    visitsBody.replaceChildren(...rows.map((visit) => {
      const tr = el("tr");
      const actions = visit.actions.map((a) => (a.type === "outbound" ? `🔗 ${a.detail}` : a.type === "game" ? `🎮 ${a.detail}` : ACTION_ICONS[a.type] || a.type));
      [
        when.format(new Date(visit.start)),
        visit.source === "Shared link" ? "🔗 Lien partagé" : visit.source || "–",
        visit.pages.map((p) => PAGE_NAMES[p] || p).join(" → "),
        fmtDuration(visit.durationMs),
        visit.scroll ? `${visit.scroll} %` : "–",
        `${DEVICE_NAMES[visit.device] || visit.device || "?"} · ${visit.browser || "?"}`,
        place(visit.timezone),
        [...new Set(actions)].join(", ") || "–",
      ].forEach((text) => tr.append(el("td", "", text)));
      return tr;
    }));
  }

  // Tooltip shared by the chart and the bar lists.
  const stats = $("stats");
  stats.addEventListener("pointermove", (event) => {
    const target = event.target.closest("[data-tip]");
    if (!target) return (tooltip.hidden = true);
    tooltip.textContent = target.dataset.tip;
    tooltip.hidden = false;
    const box = stats.getBoundingClientRect();
    const x = Math.min(event.clientX - box.left + 14, box.width - tooltip.offsetWidth - 4);
    tooltip.style.left = `${Math.max(4, x)}px`;
    tooltip.style.top = `${event.clientY - box.top - tooltip.offsetHeight - 12}px`;
  });
  stats.addEventListener("pointerleave", () => (tooltip.hidden = true));

  async function showStats(force) {
    setStatus(statusEl, "Chargement des statistiques…");
    try {
      // Fetch the largest range once and filter locally when switching ranges.
      if (force || !cache.rows || cache.days < rangeDays) {
        const rows = await fetchEvents(Math.max(rangeDays, 30));
        if (rows === null) return;
        cache = { days: Math.max(rangeDays, 30), rows };
      }
      const since = Date.now() - rangeDays * 86400000;
      const rows = cache.rows.filter((row) => new Date(row.created_at).getTime() >= since);
      const visits = toVisits(rows);
      renderKpis(rows, visits);
      renderChart(visits);
      renderLists(rows, visits);
      renderVisits(visits);
      setStatus(statusEl, "");
    } catch (err) {
      setStatus(statusEl, `Statistiques indisponibles (${err.message}). As-tu lancé supabase/analytics.sql ?`, "error");
    }
  }
  window.showStats = showStats;
})();
