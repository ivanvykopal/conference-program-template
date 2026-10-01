// Checks workshops/*.js against workshops/index.js. Usage: node tools/validate.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "workshops");
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(dir, "index.js"), "utf8"), ctx);
const { SITE, WORKSHOP_FILES: ids } = ctx.window;
const days = Object.keys(SITE.DAYS);
const TYPES = ["keynote", "tutorial", "talk", "poster", "panel", "session", "break", "other"];
const TIME = /^\d{1,2}:\d{2}(\s*[–-]\s*(\d{1,2}:\d{2}|[a-z ]+))?$/;
const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);

const files = readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "index.js" && !f.startsWith("_")).map((f) => f.slice(0, -3));
for (const f of files) if (!ids.includes(f)) err(f, "file exists but is not listed in WORKSHOP_FILES");
if (new Set(ids).size !== ids.length) err("index.js", "duplicate ids in WORKSHOP_FILES");

const names = new Set();
for (const id of ids) {
  const found = [];
  try {
    vm.runInNewContext(readFileSync(join(dir, id + ".js"), "utf8"), { addWorkshop: (w) => found.push(w) });
  } catch (e) { err(id, "cannot load: " + e.message); continue; }
  if (found.length !== 1) { err(id, `expected one addWorkshop() call, got ${found.length}`); continue; }
  const w = found[0];
  if (!w.name) err(id, "missing name");
  if (names.has(w.name)) err(id, `duplicate name ${w.name}`);
  names.add(w.name);
  const wdays = [].concat(w.day || []);
  if (!wdays.length || !wdays.every((d) => days.includes(d))) err(id, `day must be one of ${days.join("/")} or an array of them`);
  if (w.status && !["published", "partial", "not_announced"].includes(w.status)) err(id, `bad status ${w.status}`);
  const speakers = new Set((w.speakers || []).map((s) => s.name));
  (w.schedule || []).forEach((e, i) => {
    const at = `schedule[${i}]`;
    if (!e.title) err(id, `${at} missing title`);
    if (!TYPES.includes(e.type)) err(id, `${at} type must be one of ${TYPES.join("/")}`);
    if (e.time && !TIME.test(e.time)) err(id, `${at} time "${e.time}" is not HH:MM–HH:MM`);
    if (wdays.length > 1 ? !wdays.includes(e.day) : e.day && e.day !== wdays[0]) err(id, `${at} bad or missing day`);
    if (e.speaker && !speakers.has(e.speaker)) err(id, `${at} speaker "${e.speaker}" not in speakers[]`);
  });
}

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OK: ${ids.length} workshops`);
