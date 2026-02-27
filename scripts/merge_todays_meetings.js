/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function saveJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function slugify(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function meetingId(title, date) {
  return `${slugify(title)}-${String(date || "").replace(/[^0-9]/g, "")}`;
}

function normalize(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function main() {
  const root = path.resolve(__dirname, "..");
  const tempPath = path.join(root, "temp", "todays-meetings.json");
  const meetingsPath = path.join(root, "data", "abivax", "meetings.json");

  const synced = loadJson(tempPath) || { meetings: [] };
  const current = loadJson(meetingsPath) || { meetings: [] };
  const syncedMeetings = Array.isArray(synced.meetings) ? synced.meetings : [];
  const currentMeetings = Array.isArray(current.meetings) ? current.meetings : [];

  const byId = new Map(currentMeetings.map((m) => [m.id, m]));
  const byKey = new Map(
    currentMeetings.map((m) => [`${normalize(m.title)}|${m.date || ""}|${normalize(m.time || "")}`, m.id])
  );
  let upserts = 0;

  for (const m of syncedMeetings) {
    const normalizedKey = `${normalize(m.title)}|${m.date || ""}|${normalize(m.time || "")}`;
    const existingIdForKey = byKey.get(normalizedKey);
    const id = existingIdForKey || m.id || meetingId(m.title, m.date);
    if (!m.title || !m.date) continue;
    const merged = {
      ...byId.get(id),
      ...m,
      id,
      prep: Array.isArray(m.prep) ? m.prep : (byId.get(id)?.prep || []),
    };
    byId.set(id, merged);
    byKey.set(normalizedKey, id);
    upserts += 1;
  }

  const next = {
    meetings: [...byId.values()].sort((a, b) => {
      const ak = `${a.date || ""} ${a.time || ""}`.trim();
      const bk = `${b.date || ""} ${b.time || ""}`.trim();
      return ak.localeCompare(bk);
    }),
  };

  // Collapse duplicates by normalized title/date/time after merge.
  const compacted = new Map();
  for (const m of next.meetings) {
    const key = `${normalize(m.title)}|${m.date || ""}|${normalize(m.time || "")}`;
    const prev = compacted.get(key);
    if (!prev) {
      compacted.set(key, m);
      continue;
    }
    const prevScore =
      (prev.source === "outlook-sync" ? 3 : 0) +
      (prev.link ? 2 : 0) +
      ((prev.attendees || "").length > 0 ? 1 : 0) +
      ((prev.prep || []).length > 0 ? 1 : 0);
    const nextScore =
      (m.source === "outlook-sync" ? 3 : 0) +
      (m.link ? 2 : 0) +
      ((m.attendees || "").length > 0 ? 1 : 0) +
      ((m.prep || []).length > 0 ? 1 : 0);
    compacted.set(key, nextScore >= prevScore ? m : prev);
  }
  next.meetings = [...compacted.values()].sort((a, b) => {
    const ak = `${a.date || ""} ${a.time || ""}`.trim();
    const bk = `${b.date || ""} ${b.time || ""}`.trim();
    return ak.localeCompare(bk);
  });

  saveJson(meetingsPath, next);
  console.log(`Merged ${upserts} meeting(s) from todays sync into data/abivax/meetings.json`);
}

try {
  main();
} catch (err) {
  console.error(`merge_todays_meetings failed: ${err?.message || String(err)}`);
  process.exit(1);
}
