# Conference Program Template

Static site showing a conference's **entire program in one page**: the main
conference, tutorials, and workshops, including invited speakers and keynote
titles. No build step, no dependencies, no tracking.

## Use it for your conference (2 files)

1. **`workshops/index.js`** — the only required edit. Fill in `SITE`:
   `TITLE`, `TAGLINE`, `DATES`, `LOCATION`, `OFFICIAL_URL`, `LAST_UPDATED`,
   `TIMEZONE`/`TZ`, and the `DAYS` table (one key per conference day, with its
   calendar `date`). Header, footer, `<title>`, day buttons, and the
   "Now"/grayed-out-past logic all come from this.
2. **`workshops/*.js`** — one file per event. `workshops/main-conference.js`
   is a working example; replace it, and copy `workshops/_template.js` for each
   additional event. List every file's id in `WORKSHOP_FILES` in
   `workshops/index.js`.

Run `node tools/validate.mjs` to check the data, then open `index.html`.

## Populate it with an agent (skill included)

The folder `.claude/skills/scraping-conference-programs/` contains a skill that
teaches a coding agent to scrape the data files for you. Give the agent three
links — the conference's **main program page**, the **tutorials page**, and the
**workshop-list page** — e.g.:

> Populate this template from: https://2026.emnlp.org/program/ /
> https://2026.emnlp.org/program/tutorials/ /
> https://2026.emnlp.org/program/workshops/

The skill walks the agent through: filling `SITE`, skeleton files for every
listed workshop, the tutorials file, the main-conference file, then upgrading
skeletons from each workshop's own site, with fidelity rules (verbatim data,
no invention, conflicts → `notes`) and `validate.mjs` iteration. Agents in
Claude Code pick up `.claude/skills/` automatically; for other runtimes, point
the agent at the `SKILL.md` file explicitly.

## Features

- **Schedule view** (default): every timed event from every workshop, grouped by
  day and start time. Keynotes show the speaker, affiliation, and talk title
  (or "Title TBA"). Parallel breaks are merged into one row.
- Events without a timed program are listed under each day with their announced
  speakers, so known keynotes always show up.
- **Events view**: one card per event with status, speakers, full program, notes.
- Filters: day, event, keynotes only, hide breaks, full-text search. Filters
  are stored in the URL hash (`#day=wed&keynotes=1`) for sharing.
- Past events are grayed out and live events get a **Now** badge, based on the
  current time at the venue (`SITE.TZ` and each day's `date`). Updates live.
- Light/dark theme toggle; static: works from GitHub Pages or `file://`.

## Layout

```text
index.html               page + loader (loads the files listed in workshops/index.js)
workshops/index.js       SITE config (title, dates, days, last-updated) + WORKSHOP_FILES list
workshops/_template.js   annotated template for new events
workshops/<id>.js        one file per event: addWorkshop({...})
assets/app.js            rendering and filters (vanilla JS, reads window.SITE)
assets/style.css         styles (light/dark)
tools/validate.mjs       data checker (run before pushing)
.claude/skills/          agent skill for scraping conference programs (see above)
```

## Event schema, in short

- `name` and `day` are required; everything else is optional.
- `day`: a key from `SITE.DAYS` (e.g. `"wed"`), or an array for multi-day
  events (e.g. `["wed", "thu"]`). In multi-day files, each schedule entry gets
  its own `day`.
- `main: true` (main conference only) lists the entry first.
- `speakers[]`: `{ name, affiliation, title }`, where `title` is the keynote
  title (`null` until announced).
- `schedule[]`: `{ time: "09:00–10:00", type, title, speaker?, details? }`, with
  `type` one of `keynote | tutorial | talk | poster | panel | session | break | other`.
  Use `time: ""` for tentative items with no time yet.
  On keynotes, set `speaker` to a name from `speakers[]`; the title and
  affiliation are filled in from there, so a newly announced title is entered once.
- `status` is derived automatically: a timed schedule → published; speakers or
  untimed items → partial; otherwise not announced. Set it explicitly only to
  override this.

## Local preview

No build step. Either open `index.html` directly (`file://` works, there is no
`fetch()`), or serve the folder:

```bash
python -m http.server 8000   # http://localhost:8000
```

## Deploy (GitHub Pages)

Push the folder to a repo and enable **Settings → Pages → Deploy from a branch**
(`main`, `/ (root)`). The included `.nojekyll` turns off Jekyll. Every push is
live within a minute or two. Run `node tools/validate.mjs` before pushing.
