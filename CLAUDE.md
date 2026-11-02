# Notes for Claude (read this first)

This repository is the portfolio of **Imane Chakrellah**, brand name **IMANSKA**. She owns it. When she works with you
here, she is the person you answer to. These notes tell you what the project is, how she likes to work, what has been
done, and what is still open. Keep them up to date when something important changes.

## The project in one minute

- Hand-written HTML, CSS and vanilla JavaScript. No framework, no build step. Hosted on GitHub Pages (the live site is
  `chakrellah44.github.io/portfolio`, built from the `main` branch).
- Pages: `index.html` (home), `projects.html`, `hidden-me.html`, `contact.html`, `404.html`, `perso.html` (private
  moderation page for testimonials).
- Two languages: English is written in the HTML, French lives in `js/i18n.js` (`data-i18n` attributes). Two themes: dark
  (default) and light (`body[data-theme="light"]`).
- Backend: Supabase for testimonials and anonymous visit stats (SQL in `supabase/`). The contact form posts to FormSubmit.
- `README.md` describes the folders; `tools/` holds small scripts that generate parts of the site.

## How to work with Imane

- **She decides.** Explain what you changed in plain words (what, where, why). Reply in the language she writes in,
  English or French. Avoid jargon; if you need a technical word, say what it means.
- **Keep her touch.** The look is dark navy with an aqua accent (orange in the light theme), italic capitals in Archivo,
  outlined pills and soft glows. Improve and fix elements; do not redesign the site or swap its personality.
- **Show before big visual changes.** For anything that changes how the site looks or moves, offer a preview
  (screenshots or a short clip) before you apply it, and apply it only when she agrees.
- **Test in proportion.** Check what you touched (a phone change means phone sizes, a theme change means both themes).
  Do not run huge test matrices she did not ask for. Always run `python tools/check.py` before committing; it should
  print 0 errors and 0 warnings.
- **Do not publish without being asked.** Never push, merge into `main`, change the GitHub remote, force push, or touch
  Supabase, analytics, the contact form address or her CV unless she clearly asks. Work on a branch and commit there.
- **French is written for a woman** ("disponible", feminine forms for her job titles). Keep English and French in step
  whenever you change text.
- **Only real facts.** Her projects, dates, certifications and links come from her CV and her own words. If you are not
  sure, ask her; never invent anything.
- **Motion must be kind.** Respect `prefers-reduced-motion`, keep text readable (contrast of 4.5:1 for small text), and
  keep the site fast on a phone.

## State of the code

- `main` is the old version that is live today.
- The new version is on GitHub as the branch `rocmine-version`, which was pushed from the local branch `polish` (built on
  `makeover`, which is built on `fixes`). It has not been merged into `main`, so the live site is still the old one.
  Start from `rocmine-version` when she asks to continue the redesign; check with `git branch -a`.
- What the new version has: new fonts (Archivo, Instrument Sans, IBM Plex Mono, all self-hosted), brand and skill icons as
  an inline SVG sprite, a floating pill navbar, a logo that turns dark in the light theme, a fullscreen phone menu, a soft
  accent glow behind every page, an About card with the word IMANSKA (it shows her real photo when one is added), a new
  contact section, "Find me on" cards, a certifications panel, Hidden Me cards that flip cleanly, and the hero described
  below.
- To publish the new version, open a pull request from `rocmine-version` into `main` (or merge it), then push `main`. GitHub Pages
  rebuilds on its own. Do this only when she says so. If she is not the owner of the repository on the account in use,
  she cannot push to it: use a fork and a pull request, or ask the owner to add her as a collaborator.
- To look at the site, run `python -m http.server 8000` in this folder and open `http://localhost:8000`. Opening the
  files directly does not work for every feature.

## Where things live (the non-obvious parts)

- Colours and sizes are tokens in `css/base.css`: `--primary` (accent), `--primary-text` (accent that is readable as
  text), `--black` and `--white` (they swap in the light theme, so `--black` is "the page background"), `--accent-rgb`,
  `--font-display`, `--font-body`, `--font-mono`, and the type scale `--step--1` to `--step-5`.
- One CSS file per element or page (`css/header.css`, `css/hero.css`, `css/about.css`, ...). Scripts: `js/core.js` on every
  page, then one script per page.
- Images that differ per theme use `data-light-src` (handled in `js/core.js`).
- Icons: each page holds an inline SVG sprite between `icons:start` and `icons:end` comments. Never edit it by hand: change
  `tools/icons/` and run `python tools/build_icons.py`. An icon needs the `.ico` class to get its size.
- Fonts: `python tools/fetch_fonts.py` writes the font files and `css/fonts.css`.
- The light logo comes from `python tools/make_logo_light.py`. The outlines of the hero letters (for the running line) come
  from `python tools/make_name_paths.py`, which writes `js/hero-outlines.js`; run it again if the hero font or its weight
  changes.
- Scroll reveal is built in (`data-aos` attributes, `css/reveal.css`, `js/core.js`); there is no animation library.
- The About photo has a dark and a light version: `assets/profile/ai-profile-dark.webp` and
  `ai-profile-light.webp`, swapped with the theme through `data-light-src`.

## The hero name (decided, please keep)

- Hovering the name only fills the letters with the accent. When the pointer leaves (or a tap ends), each letter scrolls
  through other letters and lands on itself, from I to E.
- A short aqua line (orange in the light theme) runs around the outline of every letter, forever, and it travels with the
  letters while they scroll. The intro is a class that `js/home.js` removes after it has played, so nothing can replay it.
  Do not bring back an effect that restarts the intro on hover.
- In the light theme there is no band of light across the hero. Instead the hero elements glow in turn along a diagonal,
  one pass of 6 seconds every 24 seconds (positions are set in `js/home.js`, keyframes in `css/hero.css`). The dark theme
  keeps its faint white sweep.

## Mistakes already made (do not repeat them)

- An absolutely positioned element paints above normal text. Give decorative layers a negative `z-index` inside a parent
  with `isolation: isolate`.
- Whole-section backgrounds must stay transparent, or the page glow (`body::before` in `css/base.css`) is hidden. Cards,
  buttons and bars can keep their own fill.
- `text-shadow` is clipped by an element with `overflow: hidden`; use `filter: drop-shadow` for glows there.
- A `position: fixed` child is trapped inside an ancestor that has `backdrop-filter`, a transform, or a running animation
  with a held end state. The phone menu depends on this: the header bar's blur is on `::before` for that reason.
- A CSS `animation` shorthand can silently beat the pause and reduced-motion rules because of specificity. Test both.
- Animate `transform` and `opacity`, not `top` or `right`, under heavy blur.
- When converting screen recordings to video, go through RGB to BT.709; a direct conversion makes the blacks too dark.

## Open questions for Imane (ask her, do not decide for her)

- The hero availability text now says "Available for work". Is that what she wants?
- Three project cards lost their GitHub button. Which ones should have it back?
- One slide of the taxi project diagram carries an "UNREGISTERED" watermark.
- The Salesforce and Oracle certification links go to general pages, and her MuleSoft certification (2026) is not on the
  site yet.
- The About section still shows the IMANSKA card because there is no photo yet.
- Not tested yet: Safari, Firefox, real phones, screen readers, the 404 page on a custom domain, the contact form focus
  ring and a real message sent through FormSubmit.

## Commands

```
python tools/check.py           # static checks, run before every commit
python -m http.server 8000      # look at the site
python tools/build_icons.py     # rebuild the icon sprites
python tools/make_name_paths.py # rebuild the hero letter outlines
```
