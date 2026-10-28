// Moderation page for testimonials. Signs in with Supabase Auth: the passcode typed on
// the keypad is the password of the dedicated admin user below;
// row level security (supabase/admin.sql) only lets accounts listed in public.admins
// read pending notes, approve them or delete them.
// Email of the Supabase user created for moderation (Authentication > Users).
// Its password is the 6-digit passcode. Never write the passcode itself in this file.
const ADMIN_EMAIL = "admin@imanska.dev";
const PASSCODE_LENGTH = 6;
const SESSION_KEY = "portfolio-admin-session";
const LOCK_KEY = "portfolio-admin-lock";
const RELATIONS = { colleague: "Collègue", manager: "Manager", client: "Client·e", teammate: "Coéquipier·ère" };

const loginSection = document.getElementById("login");
const keypad = document.getElementById("keypad");
const dots = [...document.querySelectorAll("#lock-dots span")];
const dotsRow = document.getElementById("lock-dots");
const loginStatus = document.getElementById("login-status");
const panel = document.getElementById("panel");
const statusEl = document.getElementById("status");
const list = document.getElementById("notes");
const tabs = document.querySelectorAll("[data-tab]");
let session = null;
let notes = [];
let currentTab = "pending";

try { document.body.dataset.theme = localStorage.getItem("portfolio-theme") || "dark"; } catch (err) {}

const setStatus = (el, text, kind) => {
  el.textContent = text;
  el.dataset.kind = kind || "";
};

function saveSession(data) {
  session = data && {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    email: data.user?.email || session?.email || "",
  };
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {}
}

async function auth(grantType, body) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grantType}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.msg || data.error || `HTTP ${response.status}`);
  return data;
}

// Calls the REST API as the signed-in user, refreshing the token when it is about to expire.
async function api(path, options = {}) {
  if (session && session.expires_at - Date.now() < 60 * 1000) {
    try {
      saveSession(await auth("refresh_token", { refresh_token: session.refresh_token }));
    } catch (err) {
      return signOut("Session expirée, reconnecte-toi.");
    }
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (response.status === 401) return signOut("Session expirée, reconnecte-toi.");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

function showLogin(message) {
  panel.hidden = true;
  loginSection.hidden = false;
  setStatus(loginStatus, message || "", message ? "error" : "");
  clearCode();
  checkLock();
}

function signOut(message) {
  saveSession(null);
  notes = [];
  showLogin(message);
  return null;
}

async function showPanel() {
  loginSection.hidden = true;
  panel.hidden = false;
  document.getElementById("who").textContent = "Session admin active";
  const isAdmin = await api("rpc/is_admin", { method: "POST", body: "{}" }).catch(() => false);
  if (isAdmin === null) return;
  if (!isAdmin) {
    list.innerHTML = "";
    return setStatus(statusEl, "Ce compte n'est pas admin : lance la dernière ligne de supabase/admin.sql avec ton email.", "error");
  }
  loadNotes();
}

async function loadNotes() {
  setStatus(statusEl, "Chargement…");
  try {
    const rows = await api("testimonials?select=id,name,role,relation,message,approved,created_at&order=created_at.desc");
    if (rows === null) return;
    notes = rows;
    setStatus(statusEl, "");
    render();
  } catch (err) {
    setStatus(statusEl, `Chargement impossible (${err.message}).`, "error");
  }
}

function render() {
  const pending = notes.filter((note) => !note.approved);
  const approved = notes.filter((note) => note.approved);
  document.querySelector('[data-count="pending"]').textContent = pending.length;
  document.querySelector('[data-count="approved"]').textContent = approved.length;
  tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.tab === currentTab)));
  // The stats tab lives in admin-stats.js.
  const statsView = currentTab === "stats";
  list.hidden = statsView;
  document.getElementById("stats").hidden = !statsView;
  if (statsView) return window.showStats?.();

  const shown = currentTab === "pending" ? pending : approved;
  list.innerHTML = "";
  if (!shown.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = currentTab === "pending" ? "Aucune remarque en attente. 🎉" : "Aucune remarque publiée pour l'instant.";
    list.append(empty);
    return;
  }
  const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  shown.forEach((note) => {
    // Visitor text is only ever set with textContent.
    const item = document.createElement("li");
    item.className = "note";
    item.dataset.id = note.id;
    const head = document.createElement("div");
    head.className = "note-head";
    const name = document.createElement("p");
    name.className = "note-name";
    name.textContent = note.name;
    const badge = document.createElement("span");
    badge.className = "note-badge";
    badge.textContent = RELATIONS[note.relation] || note.relation;
    const meta = document.createElement("p");
    meta.className = "note-meta";
    meta.textContent = [note.role, dateFormat.format(new Date(note.created_at))].filter(Boolean).join(" · ");
    head.append(name, badge, meta);
    const quote = document.createElement("blockquote");
    quote.textContent = note.message;
    const actions = document.createElement("div");
    actions.className = "note-actions";
    actions.innerHTML = note.approved
      ? '<button type="button" class="admin-btn" data-action="hide">Retirer du site</button>'
      : '<button type="button" class="admin-btn is-primary" data-action="approve">✓ Valider</button>';
    actions.insertAdjacentHTML("beforeend", '<button type="button" class="admin-btn is-danger" data-action="delete">Supprimer</button>');
    // Publication date shown on the site (stored in created_at).
    const dateField = document.createElement("label");
    dateField.className = "note-date";
    dateField.textContent = "Date affichée";
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = toDateValue(note.created_at);
    dateInput.max = toDateValue(new Date().toISOString());
    dateField.append(dateInput);
    actions.append(dateField);
    item.append(head, quote, actions);
    list.append(item);
  });
}

// yyyy-mm-dd in local time, for <input type="date">.
function toDateValue(iso) {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

list.addEventListener("change", async (event) => {
  const input = event.target.closest('.note-date input[type="date"]');
  if (!input || !input.value) return;
  const item = input.closest(".note");
  const note = notes.find((entry) => entry.id === item.dataset.id);
  // Noon local time so the day never shifts across time zones.
  const createdAt = new Date(`${input.value}T12:00:00`).toISOString();
  input.disabled = true;
  try {
    const done = await api(`testimonials?id=eq.${encodeURIComponent(note.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ created_at: createdAt }),
    });
    if (done === null && !session) return;
    note.created_at = createdAt;
    notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setStatus(statusEl, `Date de la remarque de ${note.name} changée.`, "ok");
    render();
  } catch (err) {
    input.value = toDateValue(note.created_at);
    setStatus(statusEl, `Changement de date impossible (${err.message}).`, "error");
  } finally {
    input.disabled = false;
  }
});

list.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = button.closest(".note");
  const note = notes.find((entry) => entry.id === item.dataset.id);
  const action = button.dataset.action;
  if (action === "delete" && !confirm(`Supprimer définitivement la remarque de ${note.name} ?`)) return;

  item.querySelectorAll("button").forEach((b) => (b.disabled = true));
  try {
    const path = `testimonials?id=eq.${encodeURIComponent(note.id)}`;
    const result = action === "delete"
      ? await api(path, { method: "DELETE", headers: { Prefer: "return=minimal" } })
      : await api(path, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ approved: action === "approve" }) });
    if (result === null && !session) return;
    item.classList.add("is-leaving");
    setTimeout(() => {
      if (action === "delete") notes = notes.filter((entry) => entry !== note);
      else note.approved = action === "approve";
      render();
    }, 250);
    const messages = { approve: `Remarque de ${note.name} publiée sur le site.`, hide: `Remarque de ${note.name} retirée du site.`, delete: "Remarque supprimée." };
    setStatus(statusEl, messages[action], "ok");
  } catch (err) {
    item.querySelectorAll("button").forEach((b) => (b.disabled = false));
    setStatus(statusEl, `Action impossible (${err.message}).`, "error");
  }
});

tabs.forEach((tab) => tab.addEventListener("click", () => {
  currentTab = tab.dataset.tab;
  render();
}));
document.getElementById("refresh").addEventListener("click", () => (currentTab === "stats" ? window.showStats?.(true) : loadNotes()));
document.getElementById("logout").addEventListener("click", () => signOut());

// -------------------------------
// Passcode keypad
// -------------------------------
let code = "";
let checking = false;
let lockTimer = 0;

function renderDots() {
  dots.forEach((dot, index) => dot.classList.toggle("is-filled", index < code.length));
}
function clearCode() {
  code = "";
  renderDots();
}

// Like a phone: after 5 wrong codes, wait 30 s, then 1 min, then 5 min.
// Supabase also rate-limits sign-ins on its side.
function readLock() {
  try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { fails: 0, until: 0 }; } catch (err) { return { fails: 0, until: 0 }; }
}
function writeLock(lock) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(lock)); } catch (err) {}
}
function checkLock() {
  clearTimeout(lockTimer);
  const remaining = readLock().until - Date.now();
  keypad.classList.toggle("is-locked", remaining > 0);
  if (remaining <= 0) return false;
  setStatus(loginStatus, `Trop d'essais. Réessaie dans ${Math.ceil(remaining / 1000)} s.`, "error");
  lockTimer = setTimeout(() => {
    if (checkLock() === false) setStatus(loginStatus, "");
  }, 1000);
  return true;
}
function registerFail() {
  const lock = readLock();
  lock.fails += 1;
  if (lock.fails >= 5) lock.until = Date.now() + [30, 60, 300][Math.min(lock.fails - 5, 2)] * 1000;
  writeLock(lock);
}

async function submitCode() {
  checking = true;
  try {
    saveSession(await auth("password", { email: ADMIN_EMAIL, password: code }));
    writeLock({ fails: 0, until: 0 });
    showPanel();
  } catch (err) {
    const rateLimited = /rate|too many/i.test(err.message);
    if (!rateLimited) registerFail();
    dotsRow.classList.remove("is-wrong");
    void dotsRow.offsetWidth; // restart the shake
    dotsRow.classList.add("is-wrong");
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    setTimeout(() => {
      dotsRow.classList.remove("is-wrong");
      clearCode();
      if (!checkLock()) setStatus(loginStatus, rateLimited ? "Trop d'essais, patiente un moment." : "Code incorrect", "error");
    }, 450);
  } finally {
    checking = false;
  }
}

function pressKey(key) {
  if (checking || checkLock()) return;
  if (key === "delete") {
    code = code.slice(0, -1);
    return renderDots();
  }
  if (code.length >= PASSCODE_LENGTH) return;
  code += key;
  setStatus(loginStatus, "");
  renderDots();
  if (code.length === PASSCODE_LENGTH) setTimeout(submitCode, 120);
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-key]");
  if (button) pressKey(button.dataset.key);
});
// Physical keyboard: digits, Backspace.
document.addEventListener("keydown", (event) => {
  if (loginSection.hidden) return;
  const key = /^[0-9]$/.test(event.key) ? event.key : event.key === "Backspace" ? "delete" : null;
  if (!key) return;
  event.preventDefault();
  const button = keypad.querySelector(`[data-key="${key}"]`);
  button?.classList.add("is-pressed");
  setTimeout(() => button?.classList.remove("is-pressed"), 120);
  pressKey(key);
});

try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (err) {}
if (session?.access_token) showPanel();
else showLogin();
