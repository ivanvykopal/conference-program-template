/* TEMPLATE — copy to workshops/<id>.js, fill in, and add "<id>" to
 * WORKSHOP_FILES in workshops/index.js. Delete fields you don't know yet;
 * only `name` and `day` are required. Run `node tools/validate.mjs` to check.
 */
addWorkshop({
  name: "SHORTNAME",                    // shown on chips, e.g. "BlackboxNLP"
  full_name: "Full Workshop Title",
  url: "https://example.org/",          // null if no site yet
  day: "wed",                           // "wed" | "thu" | ["wed", "thu"] for multi-day (keys from workshops/index.js)
  room: "Room X1",                      // optional
  // status: "partial",                 // optional override; normally derived:
  //   timed schedule → published, speakers/untimed items → partial, else not announced
  description: "One or two sentences.",

  // Invited speakers. `title` = keynote title (null until announced).
  speakers: [
    { name: "Jane Doe", affiliation: "Some University", title: "Talk title or null" }
  ],

  // Program. `time` is "HH:MM–HH:MM" (hyphen also fine) or "" if untimed.
  // `type`: keynote | tutorial | talk | poster | panel | session | break | other
  // For keynotes, set `speaker` to a name from `speakers` — its title and
  // affiliation are shown automatically in the common schedule.
  // Multi-day (`day: ["wed", "thu"]`): add `day: "wed"` / `day: "thu"` to each entry.
  schedule: [
    { time: "09:00–09:15", type: "session", title: "Opening remarks" },
    { time: "09:15–10:00", type: "keynote", title: "Keynote 1", speaker: "Jane Doe" },
    { time: "10:30–11:00", type: "break", title: "Coffee break" },
    { time: "11:00–12:30", type: "poster", title: "Poster session", details: "Optional extra line" }
  ],

  notes: "Optional caveats (e.g. provisional schedule)."
});
