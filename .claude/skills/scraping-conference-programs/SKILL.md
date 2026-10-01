---
name: scraping-conference-programs
description: Use when populating this template's workshops/*.js data files from a conference's public program — given a main-program link, a tutorials link, and a workshop-list link — or when updating event schedules/speakers after new program announcements.
---

# Scraping Conference Programs

## Overview

Fill this template's `workshops/*.js` from three user-supplied links: the main
program page, the tutorials page, and the workshop-list page. Core principle:
**copy data verbatim from sources; never invent anything; degrading to "not
announced" is always correct.** The app derives status automatically, so an
empty-but-accurate file is worth more than a full-but-guessed one.

## Workflow

1. **Read the docs first**: `workshops/_template.js`, the schema section of
   `README.md`, and `tools/validate.mjs`. The validator shows exactly what is
   enforced (day keys, time format, speaker linkage) — cheapest way to avoid
   schema errors on the first write.
2. **SITE config** (`workshops/index.js`): take `TITLE`, `DATES`, `LOCATION`,
   `OFFICIAL_URL` from the main-program page and the conference homepage (do
   not guess venue or dates from memory). Set `TZ` to the venue's IANA zone.
   Build one `DAYS` key per conference day with the real calendar `date`; label
   format `"Saturday, October 24 — Registration & welcome"`. Verify weekday
   names actually match the dates. `LAST_UPDATED` = collection date (today).
3. **Skeleton every workshop**: fetch the workshop-list page and immediately
   write one file per listed workshop — `name` (short/acronym), `full_name`,
   `url` (null if the list links nowhere), `day` key(s) mapped from the list's
   date headings, paraphrased 1–2-sentence `description`, empty `speakers` and
   `schedule`. List all ids in `WORKSHOP_FILES`. This gives full coverage
   before deep scraping; status degrades to "not announced" on its own.
4. **Tutorials** → one `tutorials.js`: one `type: "tutorial"` entry per
   tutorial (title verbatim, organizers in `details`), `day` = tutorials day.
5. **Main conference** → `main-conference.js` with `main: true`. Also fetch the
   conference's keynotes page if one is linked — speaker affiliations and talk
   titles live there, and belong in `speakers[]`, not in schedule titles.
6. **Upgrade skeletons**: for each workshop, visit its own site and hunt the
   Program / Schedule page and the Invited Speakers section. Workshop sites
   are often JS-heavy: if a fetch returns suspiciously little text, retry the
   raw HTML (e.g. `read <url>:raw`) or a real browser. Cap ~3 fetches per
   workshop; if nothing timed turns up, leave the skeleton and move on.
   Default scope is every workshop; if the request limits upgrades to a
   subset, skeleton coverage still applies to all — only the upgrades stop.
7. **Iterate**: run `node tools/validate.mjs` after every batch, fix, repeat.
   Then open the page and spot-check one day against the source.

## Mapping conventions

| Page item | `type` | Notes |
|---|---|---|
| Coffee / lunch break | `break` | title verbatim |
| Registration, reception, social event | `other` | |
| Poster block, "Orals/Posters …" | `poster` | tracks/extra info → `details` |
| Opening/closing, business meeting, award | `session` | |
| Invited talk / keynote, speaker named | `keynote` + `speaker:` | schedule `title` stays generic ("Invited talk 1") |
| Panel | `panel`; tutorial block → `tutorial` | |
| Lightning / boaster / featured paper | `talk` | authors → `details` |
| Anything unclassifiable | `other` | |

## Hard rules — fidelity

- **Verbatim or nothing.** Titles, times, names as published; 24h `"HH:MM–HH:MM"`
  with en-dash; convert AM/PM. Paraphrase only `description`.
- **Never invent.** Unknown keynote title → speakers[] `title: null` (renders
  "Title TBA"). Unknown room → omit `room`. Dead site → keep `url` from the
  list, say so in `notes`. Keep any real fact scouting actually surfaced
  (invited speakers named on the list page or on a workshop's site belong in
  `speakers[]` even without a timed program) — the ban is on guessing, not on
  using published facts.
- **Keep oddities, note them.** Overlapping events, sources disagreeing (list
  vs. workshop site on edition numbers, rooms, times), open-ended times
  (`"18:00–open end"` → `time: "18:00"`, `details: "open end, …"`): keep as
  published, explain in `notes`. Never silently resolve a conflict.
- **Speaker linkage.** A keynote's `speaker` must exactly match a `speakers[]`
  `name` (validator enforces); the talk title lives only in `speakers[].title`
  — single source of truth, never duplicated into the schedule row.
- **Day keys.** Every schedule entry's `day` must exist in `SITE.DAYS`;
  multi-day events carry `day` per entry.
- Multi-day workshops: merge both days into one file with per-day entries; do
  not create a file per day.

## Common mistakes

- Skipping workshops without visible programs — write skeletons for ALL listed
  workshops first.
- Guessing venue/dates/timezone instead of reading the conference homepage.
- Only fetching each workshop's landing page and giving up — the program is
  usually a subpage; JS-heavy sites may need a raw-HTML fetch.
- Editing `index.html`/`assets/` — everything conference-specific lives in
  `workshops/`.
- Forgetting `WORKSHOP_FILES`, per-entry `day` on multi-day files, or bumping
  `LAST_UPDATED`.
