/* EXAMPLE main-conference entry — replace with your own data.
 * workshops/_template.js has the fully annotated schema; copy it for each
 * additional event and list the new ids in workshops/index.js. */
addWorkshop({
  name: "Main",
  main: true,                              // main: true lists the entry first — main conference only
  full_name: "ExampleConf 2026 Main Conference",
  url: "https://example.org/program/",
  day: ["sun", "mon", "tue"],              // keys from SITE.DAYS in workshops/index.js
  description: "Main conference: plenary keynotes, oral and poster sessions.",

  // Invited speakers. `title` = keynote title (null until announced → "Title TBA").
  speakers: [
    { name: "Jane Doe", affiliation: "Some University", title: "Keynote Talk Title" },
    { name: "John Smith", affiliation: "Another Institute", title: null }
  ],

  // Multi-day event (day is an array): each schedule entry carries its own `day`.
  // `type`: keynote | tutorial | talk | poster | panel | session | break | other
  // Keynotes: set `speaker` to a name from `speakers` — title and affiliation
  // are shown automatically in the common schedule.
  schedule: [
    { day: "sun", time: "09:00–09:30", type: "session", title: "Opening session" },
    { day: "sun", time: "09:30–10:30", type: "keynote", title: "Keynote 1", speaker: "Jane Doe" },
    { day: "sun", time: "10:30–11:00", type: "break", title: "Coffee break" },
    { day: "sun", time: "11:00–12:30", type: "poster", title: "Poster session A", details: "Hall 1" },

    { day: "mon", time: "09:30–10:30", type: "keynote", title: "Keynote 2", speaker: "John Smith" },
    { day: "mon", time: "12:30–14:00", type: "break", title: "Lunch break", details: "Lunch provided" },

    { day: "tue", time: "16:00–17:00", type: "session", title: "Closing session" }
  ],

  notes: "Example data — replace with the real program."
});
