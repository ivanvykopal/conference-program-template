/* Conference program — renders window.WORKSHOPS (filled by workshops/*.js) and
   window.SITE (workshops/index.js, the only file to edit per conference). No dependencies. */
(function () {
  "use strict";

  const SITE = window.SITE || {};
  const DAYS = SITE.DAYS || {};
  const DAY_KEYS = Object.keys(DAYS);
  const TYPES = ["keynote", "tutorial", "talk", "poster", "panel", "session", "break", "other"];
  const STATUS_LABEL = {
    published: "Program published",
    partial: "Partial info",
    not_announced: "Program not announced"
  };

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- normalize data ---------- */

  function parseTime(t) {
    const m = /(\d{1,2}):(\d{2})(?:\s*[–-]\s*(\d{1,2}):(\d{2}))?/.exec(t || "");
    if (!m) return null;
    return { start: +m[1] * 60 + +m[2], end: m[3] ? +m[3] * 60 + +m[4] : null };
  }
  const fmt = (min) => String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");

  function hue(name) {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }

  const workshops = (window.WORKSHOPS || []).map((w) => {
    const speakers = (w.speakers || []).filter((s) => s && s.name);
    const wsDays = [].concat(w.day || []).filter((d) => DAYS[d]);
    const byName = new Map(speakers.map((s) => [s.name, s]));
    const events = (w.schedule || []).map((e) => {
      const type = TYPES.includes(e.type) ? e.type : "other";
      if (e.type && type !== e.type) console.error(w.name + ": unknown type '" + e.type + "'");
      const sp = e.speaker ? byName.get(e.speaker) : null;
      if (e.speaker && !sp) console.error(w.name + ": speaker '" + e.speaker + "' not in speakers[]");
      const day = e.day || (wsDays.length === 1 ? wsDays[0] : null);
      if (!day) console.error(w.name + ": multi-day entry needs `day`");
      return {
        ws: null, day, type, time: parseTime(e.time), rawTime: e.time || "",
        title: e.title || "", details: e.details || null,
        speaker: sp || (e.speaker ? { name: e.speaker } : null)
      };
    });
    const hasTimed = events.some((e) => e.time);
    const status = w.status || (hasTimed ? "published" : events.length || speakers.length ? "partial" : "not_announced");
    const ws = {
      ...w, speakers, events, status, hue: hue(w.name),
      days: wsDays,
      scheduled: new Set(events.map((e) => e.speaker && e.speaker.name).filter(Boolean))
    };
    events.forEach((e) => { e.ws = ws; });
    const text = [w.name, w.full_name, w.description, w.notes, w.room]
      .concat(speakers.flatMap((s) => [s.name, s.affiliation, s.title]))
      .concat(events.flatMap((e) => [e.title, e.details]));
    ws.haystack = text.filter(Boolean).join("\n").toLowerCase();
    events.forEach((e) => {
      e.haystack = [w.name, e.title, e.details, e.speaker && e.speaker.name, e.speaker && e.speaker.affiliation, e.speaker && e.speaker.title]
        .filter(Boolean).join("\n").toLowerCase();
    });
    return ws;
  }).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0) || a.name.localeCompare(b.name));

  /* ---------- state ---------- */

  const state = { view: "schedule", day: "all", ws: "", keynotes: false, hideBreaks: false, q: [] };

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    state.view = p.get("view") === "workshops" ? "workshops" : "schedule";
    state.day = DAYS[p.get("day")] ? p.get("day") : "all";
    state.ws = p.get("ws") || "";
    state.keynotes = p.get("keynotes") === "1";
    state.hideBreaks = p.get("breaks") === "0";
    const q = p.get("q") || "";
    $("search").value = q;
    state.q = q.toLowerCase().split(/\s+/).filter(Boolean);
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (state.view !== "schedule") p.set("view", state.view);
    if (state.day !== "all") p.set("day", state.day);
    if (state.ws) p.set("ws", state.ws);
    if (state.keynotes) p.set("keynotes", "1");
    if (state.hideBreaks) p.set("breaks", "0");
    if ($("search").value.trim()) p.set("q", $("search").value.trim());
    history.replaceState(null, "", p.toString() ? "#" + p : location.pathname + location.search);
  }

  const matchesQuery = (hay) => state.q.every((t) => hay.includes(t));
  const wsVisible = (w) => (!state.ws || w.name === state.ws) && (state.day === "all" || w.days.includes(state.day));

  /* ---------- shared bits ---------- */

  function wsChip(w) {
    const n = el(w.url ? "a" : "span", "ws-chip", w.name);
    n.style.setProperty("--h", w.hue);
    n.title = w.full_name || w.name;
    if (w.url) { n.href = w.url; n.target = "_blank"; n.rel = "noopener"; }
    return n;
  }
  const pill = (type) => el("span", "pill pill--" + type, type);

  function speakerLine(s, cls) {
    const box = el("div", cls || "speaker");
    box.append(el("span", "sp-name", s.name));
    if (s.affiliation) box.append(el("span", "sp-aff", s.affiliation));
    box.append(s.title ? el("span", "sp-title", "“" + s.title + "”") : el("span", "sp-title sp-title--tba", "Title TBA"));
    return box;
  }

  /* ---------- past / now ---------- */

  /* Current wall-clock time at the venue, as { date: "YYYY-MM-DD", min }. Handles DST via Intl. */
  function venueNow() {
    const parts = {};
    new Intl.DateTimeFormat("en-CA", {
      timeZone: SITE.TZ || undefined, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date()).forEach((p) => { parts[p.type] = p.value; });
    return { date: parts.year + "-" + parts.month + "-" + parts.day, min: +parts.hour * 60 + +parts.minute };
  }
  let now = venueNow();

  /* "past" | "now" | "upcoming" — untimed or undated events are always upcoming. */
  function phase(e) {
    const date = e.day && DAYS[e.day] && DAYS[e.day].date;
    if (!date || !e.time) return "upcoming";
    if (date !== now.date) return date < now.date ? "past" : "upcoming";
    const end = e.time.end != null ? e.time.end : e.time.start;
    if (now.min >= end) return "past";
    return now.min >= e.time.start ? "now" : "upcoming";
  }

  /* ---------- schedule view ---------- */

  function eventRow(e) {
    const ph = phase(e);
    const row = el("div", "ev ev--" + e.type + " is-" + ph);
    row.style.setProperty("--h", e.ws.hue);
    const head = el("div", "ev-head");
    head.append(wsChip(e.ws), pill(e.type));
    if (ph === "now") head.append(el("span", "now-badge", "Now"));
    if (e.time) head.append(el("span", "ev-time", e.rawTime.replace(/-/g, "–")));
    row.append(head, el("div", "ev-title", e.title));
    if (e.speaker) row.append(speakerLine(e.speaker));
    if (e.details) row.append(el("div", "ev-details", e.details));
    return row;
  }

  function breakRow(list) {
    const phases = list.map(phase);
    const row = el("div", "ev ev--break ev--merged is-" + (phases.includes("now") ? "now" : phases.every((p) => p === "past") ? "past" : "upcoming"));
    const labels = [...new Set(list.map((e) => e.title))];
    row.append(el("span", "brk-label", labels.length === 1 ? labels[0] : "Breaks"));
    const chips = el("span", "brk-ws");
    list.forEach((e) => chips.append(wsChip(e.ws)));
    row.append(chips);
    return row;
  }

  function renderSchedule() {
    const root = $("scheduleView");
    root.replaceChildren();
    let shown = 0;
    const shownWs = new Set();
    const days = state.day === "all" ? DAY_KEYS : [state.day];

    days.forEach((day) => {
      const evs = workshops.filter(wsVisible).flatMap((w) => w.events)
        .filter((e) => e.day === day && e.time)
        .filter((e) => !state.keynotes || e.type === "keynote")
        .filter((e) => !state.hideBreaks || e.type !== "break")
        .filter((e) => matchesQuery(e.haystack));

      const sec = el("section", "day");
      sec.append(el("h2", "day-title", DAYS[day].long));
      if (evs.length) {
        const slots = new Map();
        evs.forEach((e) => {
          if (!slots.has(e.time.start)) slots.set(e.time.start, []);
          slots.get(e.time.start).push(e);
        });
        [...slots.keys()].sort((a, b) => a - b).forEach((start) => {
          const list = slots.get(start).sort((a, b) => a.ws.name.localeCompare(b.ws.name));
          const slot = el("div", "slot" + (list.every((e) => phase(e) === "past") ? " is-past" : ""));
          slot.append(el("div", "slot-time", fmt(start)));
          const body = el("div", "slot-body");
          const breaks = list.filter((e) => e.type === "break");
          list.filter((e) => e.type !== "break").forEach((e) => body.append(eventRow(e)));
          if (breaks.length > 1) body.append(breakRow(breaks));
          else breaks.forEach((e) => body.append(eventRow(e)));
          slot.append(body);
          sec.append(slot);
          list.forEach((e) => shownWs.add(e.ws.name));
          shown += list.length;
        });
      } else {
        sec.append(el("p", "empty", "No timed events match on this day."));
      }
      sec.append(pendingBlock(day));
      root.append(sec);
    });

    const untimed = workshops.filter(wsVisible).flatMap((w) => w.events)
      .filter((e) => !e.time && (!state.keynotes || e.type === "keynote") && matchesQuery(e.haystack));
    if (untimed.length) {
      const sec = el("section", "day");
      sec.append(el("h2", "day-title", "Tentative, not yet timed"));
      const body = el("div", "slot-body slot-body--flat");
      untimed.forEach((e) => body.append(eventRow(e)));
      sec.append(body);
      root.append(sec);
      shown += untimed.length;
    }

    $("stats").textContent = shown + " items from " + shownWs.size + " events · " +
      workshops.filter((w) => w.status !== "published").length + " of " + workshops.length +
      " events have not published a full timed program yet";
  }

  /* Workshops on this day without a timed program: list known keynotes so titles are never lost. */
  function pendingBlock(day) {
    const pending = workshops.filter((w) => wsVisible(w) && w.days.includes(day) && !w.events.some((e) => e.time && e.day === day));
    const box = el("details", "pending");
    const rows = [];
    pending.forEach((w) => {
      const sp = w.speakers.filter((s) => !w.scheduled.has(s.name))
        .filter((s) => matchesQuery([w.name, s.name, s.affiliation, s.title].join("\n").toLowerCase()));
      if (!sp.length && (state.keynotes || state.q.length)) return;
      const r = el("div", "pending-ws");
      const head = el("div", "ev-head");
      head.append(wsChip(w), el("span", "status status--" + w.status, STATUS_LABEL[w.status]));
      r.append(head);
      sp.forEach((s) => r.append(speakerLine(s)));
      rows.push(r);
    });
    if (!rows.length) return document.createTextNode("");
    box.open = state.keynotes || state.q.length > 0;
    box.append(el("summary", null, rows.length + " workshop" + (rows.length === 1 ? "" : "s") + " without a timed program yet (announced speakers)"));
    rows.forEach((r) => box.append(r));
    return box;
  }

  /* ---------- workshops view ---------- */

  function renderWorkshops() {
    const root = $("workshopsView");
    root.replaceChildren();
    const list = workshops.filter((w) => wsVisible(w) && matchesQuery(w.haystack))
      .filter((w) => !state.keynotes || w.speakers.length);
    list.forEach((w) => {
      const card = el("article", "card");
      card.style.setProperty("--h", w.hue);
      const head = el("div", "card-head");
      const h = el("h2", "card-title");
      h.append(wsChip(w));
      h.append(el("span", "card-full", w.full_name || ""));
      head.append(h);
      const meta = el("div", "card-meta");
      meta.append(el("span", "badge", (w.days.length > 2 ? DAYS[w.days[0]].label + " – " + DAYS[w.days[w.days.length - 1]].label : w.days.map((d) => DAYS[d].label).join(" + ")) + (w.room ? " · " + w.room : "")));
      meta.append(el("span", "status status--" + w.status, STATUS_LABEL[w.status]));
      if (!w.url) meta.append(el("span", "badge badge--warn", "No website yet"));
      head.append(meta);
      card.append(head);
      if (w.description) card.append(el("p", "card-desc", w.description));
      if (w.speakers.length) {
        const sec = el("div", "card-speakers");
        sec.append(el("h3", null, "Invited speakers"));
        w.speakers.forEach((s) => sec.append(speakerLine(s)));
        card.append(sec);
      }
      if (w.events.length) {
        const d = el("details", "card-sched");
        d.append(el("summary", null, "Schedule · " + w.events.length + " items"));
        const t = el("table");
        w.events.forEach((e) => {
          const tr = el("tr", "row--" + e.type + " is-" + phase(e));
          tr.append(el("td", "col-time", (e.day && w.days.length > 1 ? DAYS[e.day].label.split(",")[0] + " " : "") + (e.rawTime || "—")));
          const td = el("td");
          td.append(pill(e.type), document.createTextNode(" " + e.title));
          if (e.speaker) td.append(speakerLine(e.speaker, "speaker speaker--inline"));
          if (e.details) td.append(el("div", "ev-details", e.details));
          tr.append(td);
          t.append(tr);
        });
        d.append(t);
        card.append(d);
      }
      if (w.notes) card.append(el("p", "card-notes", w.notes));
      root.append(card);
    });
    if (!list.length) root.append(el("p", "empty", "No events match your filters."));
    $("stats").textContent = "Showing " + list.length + " of " + workshops.length + " events";
  }

  /* ---------- wiring ---------- */

  function syncControls() {
    document.querySelectorAll("#viewSwitch button").forEach((b) => b.classList.toggle("is-active", b.dataset.view === state.view));
    document.querySelectorAll("#dayFilter button").forEach((b) => b.classList.toggle("is-active", b.dataset.day === state.day));
    $("workshopFilter").value = state.ws;
    $("keynotesOnly").checked = state.keynotes;
    $("hideBreaks").checked = state.hideBreaks;
    $("hideBreaks").parentNode.hidden = state.view !== "schedule";
  }

  function render() {
    syncControls();
    $("scheduleView").hidden = state.view !== "schedule";
    $("workshopsView").hidden = state.view !== "workshops";
    if (state.view === "schedule") renderSchedule(); else renderWorkshops();
  }
  const update = () => { writeHash(); render(); };

  DAY_KEYS.forEach((d) => {
    const b = el("button", null, DAYS[d].short || DAYS[d].label);
    b.dataset.day = d;
    $("dayFilter").append(b);
  });
  workshops.forEach((w) => $("workshopFilter").append(new Option(w.name + (w.status === "published" ? "" : " (no timed program)"), w.name)));
  $("viewSwitch").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) { state.view = b.dataset.view; update(); } });
  $("dayFilter").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) { state.day = b.dataset.day; update(); } });
  $("workshopFilter").addEventListener("change", (ev) => { state.ws = ev.target.value; update(); });
  $("keynotesOnly").addEventListener("change", (ev) => { state.keynotes = ev.target.checked; update(); });
  $("hideBreaks").addEventListener("change", (ev) => { state.hideBreaks = ev.target.checked; update(); });
  $("search").addEventListener("input", (ev) => { state.q = ev.target.value.toLowerCase().split(/\s+/).filter(Boolean); update(); });
  window.addEventListener("hashchange", () => { readHash(); render(); });

  /* Header, subtitle, <title>/meta and footer attribution come from SITE,
     so adapting the page to a new conference only edits workshops/index.js. */
  function fillSiteMeta() {
    const title = SITE.TITLE || "Conference Program";
    const h1 = $("siteTitle");
    h1.replaceChildren(title + " ");
    h1.append(el("span", "accent", "Program"));
    document.title = title + " Program — Conference & Workshop Schedule";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", title + " program" +
      (SITE.DATES || SITE.LOCATION ? " (" + [SITE.DATES, SITE.LOCATION].filter(Boolean).join(", ") + ")" : "") +
      ": main conference, tutorials, and workshops in one schedule, including keynote speakers and talk titles.");
    const sub = $("siteSubtitle");
    sub.replaceChildren();
    const bits = [];
    if (SITE.DATES) bits.push(el("strong", null, SITE.DATES));
    [SITE.LOCATION, SITE.TAGLINE].filter(Boolean).forEach((t) => bits.push(document.createTextNode(t)));
    bits.forEach((n, i) => { if (i) sub.append(" · "); sub.append(n); });
    const src = $("sourcesLine");
    if (SITE.OFFICIAL_URL) {
      const a = el("a", null, SITE.OFFICIAL_LABEL || SITE.OFFICIAL_URL);
      a.href = SITE.OFFICIAL_URL;
      a.target = "_blank";
      a.rel = "noopener";
      src.append("Unofficial aggregation of the ", a, " and the events' own sites — always confirm on the official pages.");
    } else {
      src.textContent = "Unofficial community aggregation; not affiliated with the conference — always confirm on the official pages.";
    }
  }

  fillSiteMeta();
  $("lastUpdated").textContent = SITE.LAST_UPDATED || "—";
  $("tz").textContent = SITE.TIMEZONE || "local time";
  readHash();
  render();

  /* Re-render only when some event changes phase, so open panels/scroll aren't disturbed needlessly. */
  const allEvents = workshops.flatMap((w) => w.events);
  const phaseKey = () => allEvents.map(phase).join("");
  let lastKey = phaseKey();
  setInterval(() => {
    now = venueNow();
    const k = phaseKey();
    if (k !== lastKey) { lastKey = k; render(); }
  }, 30000);
})();
