# IMANSKA · Portfolio

> *Building tech, adding fun.*

**👉 [chakrellah44.github.io/portfolio](https://chakrellah44.github.io/portfolio/)**

The README won't tell you who I am. That's what the site is for.

---

## What's inside

| | |
|---|---|
| 🏠 **Home** | An animated intro, my journey, a filterable wall of *superpowers*, and kind words from people I've worked with. |
| 🗂️ **Projects** | Every project sorted by domain, with screenshots, stacks and details, plus the courses and certifications behind them. |
| 🕵️ **Hidden Me** | The person behind the code. Five chapters, two mini-games, and a few cards worth turning over. |
| ✉️ **Contact** | Send me bugs (or love notes). |
| 🚧 **404** | Getting lost is part of the experience. Try typing something. |

A few things you might notice along the way:

- 🇫🇷 / 🇬🇧 fully bilingual, 🌗 dark and light themes
- 📱 designed for phones first: swipe, tap, long press, and a little haptic feedback
- 🖱️ small interactions everywhere: tilting cards, a glowing cursor, typed text, confetti when it's earned
- 🥚 easter eggs. I won't say where.

## Under the hood

- **Front end:** hand-written HTML, CSS and vanilla JavaScript. No framework, no build step.
- **Back end:** [Supabase](https://supabase.com/) (Postgres + REST + Auth) with row-level security. Visitors can only add, never read or change.
- **Testimonials:** submitted on the site, moderated before they appear, with an email alert for each new one.
- **Analytics:** a small home-made tracker. No cookies, no IP addresses, no persistent visitor ID, and *Do Not Track* is respected.
- **Hosting:** GitHub Pages, plus a scheduled GitHub Action that keeps the free database awake.
- **Libraries:** [AOS](https://michalsnik.github.io/aos/) for scroll animations, [Boxicons](https://boxicons.com/) for icons, IBM Plex fonts.

```
├── index.html · projects.html · contact.html · hidden-me.html · 404.html
├── style.css            # all styles
├── script.js            # interactions, mini-games, testimonials
├── i18n.js              # English in the HTML, French dictionary here
├── analytics.js         # anonymous visit tracking
├── supabase-config.js   # public project URL + publishable key
├── supabase/            # SQL: tables and security policies
└── assets/              # images (WebP), icons, CV
```

## Run it locally

No install needed. Clone the repo and open `index.html`, or serve the folder:

```bash
git clone https://github.com/CHAKRELLAH44/portfolio.git
cd portfolio
npx serve .
```

Visits from `localhost` and `file://` are never counted.

<details>
<summary><b>Using this as a template?</b></summary>

1. Create a free Supabase project.
2. Run `supabase/testimonials.sql`, then `supabase/admin.sql`, then `supabase/analytics.sql` in the SQL Editor.
3. Put your project URL and publishable key in `supabase-config.js` and `.github/workflows/supabase-keepalive.yml`.
4. Replace the content, the images and the CV with your own. Please don't ship mine 🙂

</details>

## Let's talk

[LinkedIn](https://www.linkedin.com/in/chakrellah) · [GitHub](https://github.com/CHAKRELLAH44) · or just leave a note on the site.

---

<sub>© Imanska · Designed and built by Imane, one bug at a time.</sub>
