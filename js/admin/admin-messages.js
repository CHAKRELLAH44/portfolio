// "Messages" tab of perso.html: the contact conversations saved by the chat (table: supabase/messages.sql),
// including the ones the visitor never finished. Uses api() and setStatus() from admin.js.
(() => {
  const box = document.getElementById("messages");
  const STATUS = {
    draft: "Non envoyé",
    sent: "Envoyé par e-mail",
    unconfirmed: "Envoi à vérifier",
  };
  let rows = [];

  const updateCount = () => {
    document.querySelector('[data-count="messages"]').textContent = rows.filter((row) => !row.is_read).length;
  };

  function draw() {
    box.innerHTML = "";
    if (!rows.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Aucun message pour l'instant.";
      box.append(empty);
      return;
    }
    const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
    rows.forEach((row) => {
      // Visitor text is only ever set with textContent.
      const item = document.createElement("li");
      item.className = "note";
      item.classList.toggle("is-unread", !row.is_read);
      item.dataset.id = row.id;

      const head = document.createElement("div");
      head.className = "note-head";
      const name = document.createElement("p");
      name.className = "note-name";
      name.textContent = row.name || "Sans nom";
      const badge = document.createElement("span");
      badge.className = "note-badge";
      badge.dataset.status = row.status;
      badge.textContent = STATUS[row.status] || row.status;
      const meta = document.createElement("p");
      meta.className = "note-meta";
      meta.textContent = [row.email || "Pas d'e-mail", row.topic, dateFormat.format(new Date(row.updated_at))].filter(Boolean).join(" · ");
      head.append(name, badge, meta);

      const quote = document.createElement("blockquote");
      quote.textContent = row.message || "(Pas encore de message)";

      const actions = document.createElement("div");
      actions.className = "note-actions";
      if (row.email) {
        const reply = document.createElement("a");
        reply.className = "admin-btn is-primary";
        reply.href = `mailto:${encodeURIComponent(row.email)}`;
        reply.textContent = "Répondre";
        actions.append(reply);
      }
      const read = document.createElement("button");
      read.type = "button";
      read.className = "admin-btn";
      read.dataset.message = "read";
      read.textContent = row.is_read ? "Marquer non lu" : "Marquer comme lu";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "admin-btn is-danger";
      remove.dataset.message = "delete";
      remove.textContent = "Supprimer";
      actions.append(read, remove);

      item.append(head, quote, actions);
      box.append(item);
    });
  }

  async function load() {
    try {
      const data = await api("contact_messages?select=id,name,topic,message,email,status,is_read,updated_at&order=updated_at.desc&limit=500");
      if (data === null) return false;
      rows = data;
      updateCount();
      return true;
    } catch (err) {
      rows = [];
      updateCount();
      box.innerHTML = "";
      setStatus(statusEl, `Messages indisponibles (${err.message}). As-tu lancé supabase/messages.sql ?`, "error");
      return false;
    }
  }

  window.refreshMessages = load;
  window.showMessages = async (reload) => {
    if (reload || !rows.length) {
      setStatus(statusEl, "Chargement…");
      if (!(await load())) return;
      setStatus(statusEl, "");
    }
    draw();
  };

  box.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-message]");
    if (!button) return;
    const item = button.closest(".note");
    const row = rows.find((entry) => entry.id === item.dataset.id);
    const action = button.dataset.message;
    if (action === "delete" && !confirm(`Supprimer définitivement le message de ${row.name || "ce visiteur"} ?`)) return;
    item.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      const path = `contact_messages?id=eq.${encodeURIComponent(row.id)}`;
      const result = action === "delete"
        ? await api(path, { method: "DELETE", headers: { Prefer: "return=minimal" } })
        : await api(path, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ is_read: !row.is_read }) });
      if (result === null && !session) return;
      if (action === "delete") rows = rows.filter((entry) => entry !== row);
      else row.is_read = !row.is_read;
      updateCount();
      draw();
      setStatus(statusEl, action === "delete" ? "Message supprimé." : "", action === "delete" ? "ok" : "");
    } catch (err) {
      item.querySelectorAll("button").forEach((b) => (b.disabled = false));
      setStatus(statusEl, `Action impossible (${err.message}).`, "error");
    }
  });

  // admin.js may already be signed in by the time this file loads.
  if (session?.access_token && !panel.hidden) load();
})();
