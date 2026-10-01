/* ★ SITE CONFIGURATION — the only file you must edit for a new conference ★
 *
 * 1. Fill in SITE below (title, dates, venue, days).
 * 2. For each event (main conference, tutorials, workshop):
 *    copy workshops/_template.js to workshops/<id>.js, fill it in,
 *    and add "<id>" to WORKSHOP_FILES (order does not matter).
 * 3. Bump LAST_UPDATED whenever any data changes.
 *
 * Everything conference-specific on the page comes from this file; index.html,
 * assets/app.js and assets/style.css never need to change.
 */
window.SITE = {
  TITLE: "ExampleConf 2026",           // conference name; header shows "… Program"
  TAGLINE: "main conference, tutorials & workshops in one schedule",
  DATES: "October 24–29, 2026",
  LOCATION: "Lisbon, Portugal",

  // Official program page, linked from the footer. Use null for a plain-text footer.
  OFFICIAL_URL: "https://example.org/program/",
  OFFICIAL_LABEL: "example.org/program",

  LAST_UPDATED: "September 30, 2026",
  TIMEZONE: "Lisbon local time",       // shown in the footer
  // IANA zone of the venue; used to gray out past events and highlight what's on now.
  TZ: "Europe/Lisbon",

  // Day keys referenced by `day` in event files. Multi-day events use an array,
  // e.g. ["wed", "thu"]. Add/remove keys to match your conference (they need not
  // be weekday names — "day1" works too, but keep `date` accurate).
  // `date` = calendar date (YYYY-MM-DD); `short` = day-filter button text.
  // Order here = display order.
  DAYS: {
    sat: { date: "2026-10-24", label: "Sat, Oct 24", short: "Sat 24", long: "Saturday, October 24 — Registration & welcome" },
    sun: { date: "2026-10-25", label: "Sun, Oct 25", short: "Sun 25", long: "Sunday, October 25 — Main conference" },
    mon: { date: "2026-10-26", label: "Mon, Oct 26", short: "Mon 26", long: "Monday, October 26 — Main conference" },
    tue: { date: "2026-10-27", label: "Tue, Oct 27", short: "Tue 27", long: "Tuesday, October 27 — Main conference" },
    wed: { date: "2026-10-28", label: "Wed, Oct 28", short: "Wed 28", long: "Wednesday, October 28 — Workshops & tutorials" },
    thu: { date: "2026-10-29", label: "Thu, Oct 29", short: "Thu 29", long: "Thursday, October 29 — Workshops" }
  }
};

window.WORKSHOP_FILES = [
  // One id per workshops/<id>.js file. Replace the example with your events;
  // see workshops/_template.js for the full annotated schema.
  "main-conference"
];
