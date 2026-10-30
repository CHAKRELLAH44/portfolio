      (() => {
        const fr = typeof getLanguage === "function" && getLanguage() === "fr";
        const T = fr ? {
          resolving: "Résolution de la route", notFound: "route introuvable", errLine: "ERREUR 404 : cette page est partie en pause café",
          didYouMean: "Tu voulais dire", hint: "Tape une commande ou touche un bouton. Essaie", hint2: "pour la liste.",
          unknown: "commande introuvable", tryHelp: "Tape « help » pour voir les commandes.", redirect: "Redirection vers",
          whoami: "Toi : un·e visiteur·se curieux·se\nImane : ingénieure logiciel · Salesforce · DevOps & Cloud · full-stack, basée à Rabat.",
          sudo: "Bien essayé. Cet incident sera signalé à Imane.", matrixOn: "Mode Matrix activé. Suis le lapin blanc.", matrixOff: "Retour à la réalité.",
          cv: "Ouverture du CV…", help: "Commandes disponibles :", noHistory: "Historique vide.",
        } : {
          resolving: "Resolving route", notFound: "route not found", errLine: "ERROR 404: this page went on a coffee break",
          didYouMean: "Did you mean", hint: "Type a command or tap a button. Try", hint2: "to list them.",
          unknown: "command not found", tryHelp: "Type 'help' to see what you can do.", redirect: "Redirecting to",
          whoami: "You: a curious visitor\nImane: software engineer · Salesforce · DevOps & Cloud · full-stack, based in Rabat.",
          sudo: "Nice try. This incident will be reported to Imane.", matrixOn: "Matrix mode on. Follow the white rabbit.", matrixOff: "Back to reality.",
          cv: "Opening the CV…", help: "Available commands:", noHistory: "History is empty.",
        };
        const PAGES = { home: "index.html", projects: "projects.html", contact: "contact.html", "hidden-me": "hidden-me.html" };
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const out = document.getElementById("out");
        const screenEl = document.getElementById("screen");
        const prompt = document.getElementById("prompt");
        const input = document.getElementById("cmd");
        const caret = document.getElementById("caret");
        const ghost = document.getElementById("ghost");
        const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
        const path = decodeURIComponent(location.pathname);
        const asked = path.replace(/^\/portfolio\/?/, "").replace(/\/$/, "") || "/";

        // Closest real page to the broken URL (edit distance), for "did you mean".
        const distance = (a, b) => {
          const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
          for (let j = 1; j <= b.length; j++) d[0][j] = j;
          for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
          return d[a.length][b.length];
        };
        const slug = asked.toLowerCase().split("/").pop().replace(/\.html?$/, "");
        const guess = Object.entries(PAGES)
          .map(([name, file]) => [name, file, Math.min(distance(slug, name), distance(slug, file.replace(".html", "")))])
          .sort((a, b) => a[2] - b[2])[0];
        const suggestion = slug && guess[2] <= Math.max(2, Math.floor(slug.length / 3)) ? guess : null;

        const scroll = () => { screenEl.scrollTop = screenEl.scrollHeight; };
        // A line made of [text, className] parts; links are { text, cmd }.
        const print = (...parts) => {
          const p = document.createElement("p");
          p.className = "line";
          parts.forEach((part) => {
            if (typeof part === "string") return p.append(part);
            const span = document.createElement("span");
            span.textContent = part.text;
            if (part.cls) span.className = part.cls;
            if (part.cmd) {
              span.classList.add("link");
              span.tabIndex = 0;
              span.addEventListener("click", () => typeAndRun(part.cmd));
              span.addEventListener("keydown", (e) => e.key === "Enter" && typeAndRun(part.cmd));
            }
            p.append(span);
          });
          out.append(p);
          scroll();
          return p;
        };
        const typeLine = async (text, cls, speed = 14) => {
          const p = print({ text: "", cls });
          const span = p.firstChild;
          for (const ch of text) {
            span.textContent += ch;
            if (!reduce) await wait(speed);
          }
          scroll();
        };

        const ASCII = [
          " ██╗  ██╗  ██████╗  ██╗  ██╗",
          " ██║  ██║ ██╔═████╗ ██║  ██║",
          " ███████║ ██║██╔██║ ███████║",
          " ╚════██║ ████╔╝██║ ╚════██║",
          "      ██║ ╚██████╔╝      ██║",
          "      ╚═╝  ╚═════╝       ╚═╝",
        ].join("\n");

        async function boot() {
          await typeLine(`visitor@imanska:~$ curl -I https://chakrellah44.github.io${path}`, "", 10);
          await wait(250);
          for (const [label, status, cls] of [["DNS lookup", "ok", "ok"], ["TLS handshake", "ok", "ok"], [T.resolving, "...", "warn"]]) {
            const p = print({ text: `  [${status === "ok" ? " OK " : "...."}] `, cls }, { text: label, cls: "dim" });
            await wait(260);
            if (status !== "ok") { p.firstChild.textContent = "  [FAIL] "; p.firstChild.className = "err"; }
          }
          await wait(200);
          print({ text: `HTTP/2 404 · ${T.notFound}: `, cls: "err b" }, { text: `/${asked === "/" ? "" : asked}`, cls: "warn" });
          const art = document.createElement("pre");
          art.className = "ascii";
          art.setAttribute("aria-label", "404");
          art.textContent = ASCII;
          out.append(art);
          await typeLine(T.errLine, "err", 18);
          if (suggestion) {
            print("");
            print({ text: `hint: ${T.didYouMean} `, cls: "dim" }, { text: suggestion[1], cmd: `cd ${suggestion[0]}` }, { text: " ?", cls: "dim" });
          }
          print("");
          print({ text: `${T.hint} `, cls: "dim" }, { text: "help", cmd: "help" }, { text: ` ${T.hint2}`, cls: "dim" });
          prompt.hidden = false;
          scroll();
          if (matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
          updateCaret();
        }

        // ----- Commands -----
        const history = [];
        let historyIndex = 0;
        const go = async (file) => {
          print({ text: `${T.redirect} `, cls: "dim" }, { text: file, cls: "acc" }, { text: " …", cls: "dim" });
          await wait(500);
          location.href = file;
        };
        const COMMANDS = {
          help: () => {
            print({ text: T.help, cls: "acc b" });
            [
              ["ls", fr ? "lister les pages" : "list pages"], ["cd <page>", fr ? "aller sur une page (ex. cd projects)" : "open a page (e.g. cd projects)"],
              ["home", fr ? "retour à l'accueil" : "back to the home page"], ["whoami", fr ? "qui est qui" : "who is who"],
              ["cv", fr ? "ouvrir le CV" : "open the CV"], ["matrix", fr ? "activer / couper la pluie de code" : "toggle the code rain"],
              ["history", fr ? "commandes déjà tapées" : "commands you typed"], ["date", fr ? "date et heure" : "date and time"],
              ["clear", fr ? "effacer l'écran" : "clear the screen"],
            ].forEach(([cmd, desc]) => print("  ", { text: cmd, cmd: cmd.split(" ")[0] === "cd" ? "ls" : cmd }, " ".repeat(Math.max(1, 12 - cmd.length)), { text: desc, cls: "dim" }));
          },
          ls: () => {
            print({ text: "drwxr-xr-x  ", cls: "dim" }, { text: "assets/", cls: "acc" });
            Object.entries(PAGES).forEach(([name, file]) => print({ text: "-rw-r--r--  ", cls: "dim" }, { text: file, cmd: `cd ${name}` }));
          },
          cd: (arg = "") => {
            const key = arg.replace(/\.html?$/, "").replace(/^\.?\//, "").toLowerCase();
            if (!key || key === "~" || key === "index") return go(PAGES.home);
            const match = Object.keys(PAGES).find((name) => name === key || name.startsWith(key));
            if (match) return go(PAGES[match]);
            print({ text: `cd: ${arg}: No such file or directory`, cls: "err" });
          },
          open: (arg) => COMMANDS.cd(arg),
          home: () => go(PAGES.home), exit: () => go(PAGES.home),
          projects: () => go(PAGES.projects), contact: () => go(PAGES.contact),
          whoami: () => T.whoami.split("\n").forEach((l, i) => print({ text: l, cls: i ? "acc" : "" })),
          cv: () => { print({ text: T.cv, cls: "dim" }); window.portfolioTrack?.("cv", "404"); window.open("assets/docs/cv.pdf", "_blank", "noopener"); },
          cat: (arg) => (/cv/i.test(arg || "") ? COMMANDS.cv() : print({ text: `cat: ${arg || ""}: No such file`, cls: "err" })),
          date: () => print(new Date().toLocaleString(fr ? "fr-FR" : "en-GB", { dateStyle: "full", timeStyle: "medium" })),
          echo: (...words) => print(words.join(" ")),
          history: () => (history.length ? history.forEach((h, i) => print({ text: String(i + 1).padStart(3) + "  ", cls: "dim" }, h)) : print({ text: T.noHistory, cls: "dim" })),
          clear: () => { out.replaceChildren(); },
          matrix: () => { const on = document.body.classList.toggle("matrix"); on ? startRain() : stopRain(); print({ text: on ? T.matrixOn : T.matrixOff, cls: "ok" }); },
          sudo: () => print({ text: T.sudo, cls: "warn" }),
          rm: () => print({ text: "rm: permission denied (and please don't)", cls: "err" }),
        };
        const run = (line) => {
          const raw = line.trim();
          print({ text: "visitor@imanska", cls: "ok" }, { text: ":", cls: "dim" }, { text: "~", cls: "acc" }, { text: "$ ", cls: "dim" }, raw);
          if (!raw) return;
          history.push(raw);
          historyIndex = history.length;
          const [name, ...args] = raw.split(/\s+/);
          const fn = COMMANDS[name.toLowerCase()];
          if (fn) fn(...args);
          else if (PAGES[name.toLowerCase()]) go(PAGES[name.toLowerCase()]);
          else print({ text: `zsh: ${T.unknown}: ${name}. `, cls: "err" }, { text: T.tryHelp, cls: "dim" });
          scroll();
        };
        let typing = false;
        async function typeAndRun(cmd) {
          if (typing || prompt.hidden) return;
          typing = true;
          input.value = "";
          for (const ch of cmd) { input.value += ch; updateCaret(); await wait(45); }
          await wait(120);
          input.value = "";
          updateCaret();
          run(cmd);
          typing = false;
        }

        // ----- Prompt: caret, ghost completion, history -----
        const measure = document.createElement("span");
        measure.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font:inherit";
        document.body.append(measure);
        const completion = () => {
          const v = input.value.toLowerCase();
          if (!v) return "";
          const all = [...Object.keys(COMMANDS), ...Object.keys(PAGES).map((p) => `cd ${p}`)];
          const hit = all.find((c) => c.startsWith(v) && c !== v);
          return hit ? hit.slice(v.length) : "";
        };
        function updateCaret() {
          measure.style.font = getComputedStyle(input).font;
          measure.textContent = input.value.slice(0, input.selectionStart ?? input.value.length);
          caret.style.left = `${measure.offsetWidth}px`;
          // Grey completion hint after what is typed: an invisible copy of the text, then the rest.
          const typed = document.createElement("span");
          typed.style.visibility = "hidden";
          typed.textContent = input.value;
          ghost.replaceChildren(typed, completion());
        }
        input.addEventListener("input", updateCaret);
        input.addEventListener("keyup", updateCaret);
        input.addEventListener("click", updateCaret);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); const v = input.value; input.value = ""; updateCaret(); run(v); }
          else if (e.key === "Tab") { e.preventDefault(); input.value += completion(); updateCaret(); }
          else if (e.key === "ArrowUp" && history.length) { e.preventDefault(); historyIndex = Math.max(0, historyIndex - 1); input.value = history[historyIndex]; updateCaret(); }
          else if (e.key === "ArrowDown" && history.length) { e.preventDefault(); historyIndex = Math.min(history.length, historyIndex + 1); input.value = history[historyIndex] || ""; updateCaret(); }
          else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); COMMANDS.clear(); }
        });
        screenEl.addEventListener("click", (e) => { if (!e.target.closest(".link") && !getSelection().toString()) input.focus({ preventScroll: true }); });

        // ----- Quick command chips -----
        const chips = document.getElementById("chips");
        [["cd", "home", "home"], ["cd", "projects", "projects"], ["cd", "contact", "contact"], ["", "whoami", "whoami"], ["", "matrix", "matrix"], ["", "help", "help"]]
          .forEach(([prefix, label, name]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.innerHTML = prefix ? `<span>${prefix} </span>${label}` : label;
            button.addEventListener("click", () => typeAndRun(prefix ? `${prefix} ${name}` : name));
            chips.append(button);
          });

        // ----- Matrix rain -----
        const canvas = document.getElementById("rain");
        const ctx = canvas.getContext("2d");
        let drops = [], rainFrame = 0, last = 0;
        const glyphs = "アカサタナハマヤラワ0123456789IMANSKA{}<>/$#";
        const size = () => {
          canvas.width = innerWidth; canvas.height = innerHeight;
          drops = Array.from({ length: Math.ceil(innerWidth / 16) }, () => Math.random() * -50);
        };
        const drawRain = (now) => {
          rainFrame = requestAnimationFrame(drawRain);
          if (now - last < 50) return;
          last = now;
          ctx.fillStyle = "rgba(5, 6, 7, 0.12)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = "15px 'IBM Plex Mono', monospace";
          drops.forEach((y, i) => {
            ctx.fillStyle = Math.random() > 0.96 ? "#e8fffb" : "#00ffdd";
            ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * 16, y * 16);
            drops[i] = y * 16 > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
          });
        };
        function startRain() { if (reduce) return; size(); cancelAnimationFrame(rainFrame); rainFrame = requestAnimationFrame(drawRain); }
        function stopRain() { cancelAnimationFrame(rainFrame); setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 800); }
        addEventListener("resize", () => document.body.classList.contains("matrix") && size());

        boot();
      })();
