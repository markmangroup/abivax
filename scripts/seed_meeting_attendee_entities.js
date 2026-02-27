/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalize(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(v) {
  return normalize(v).replace(/\s+/g, "-");
}

function splitNames(raw) {
  return String(raw || "")
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/\bmeeting\b/i.test(s))
    .filter((s) => !/\ballabivax\b/i.test(s));
}

function isLikelyPersonName(name) {
  const n = String(name || "").trim();
  if (!n) return false;
  if (/\b(cancelled|annul|microsoft teams|réunion|room|salle)\b/i.test(n)) return false;
  if (/^all[a-z]/i.test(n)) return false;
  // Keep simple and broad: at least two tokens or known "First/Second" style titles can still pass through calendar attendees.
  return n.split(/\s+/).length >= 2;
}

function getTodayLocalYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(ymd, days) {
  const dt = new Date(`${ymd}T00:00:00`);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = `${dt.getMonth() + 1}`.padStart(2, "0");
  const d = `${dt.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pickOrgRecord(users, name) {
  const n = normalize(name);
  return users.find((u) => normalize(u.displayName) === n) || null;
}

function buildEntity(name, orgUser, nowIso) {
  const mail = String(orgUser?.mail || orgUser?.userPrincipalName || "").trim();
  const jobTitle = String(orgUser?.jobTitle || "").trim();
  const department = String(orgUser?.department || "").trim();
  const manager = String(orgUser?.manager?.displayName || "").trim();

  const aliases = [];
  const first = name.split(/\s+/)[0];
  if (first && first.length >= 3) aliases.push(first);
  if (mail) aliases.push(mail);

  const focusHints = [];
  if (department) focusHints.push(department);
  if (jobTitle) focusHints.push(jobTitle);
  focusHints.push("new meeting attendee");

  return {
    id: slugify(name),
    name,
    type: "person",
    aliases: Array.from(new Set(aliases)),
    description: jobTitle
      ? `${jobTitle}${department ? ` (${department})` : ""}. Auto-seeded from meeting attendee + org sync.`
      : "Auto-seeded from meeting attendee and pending role confirmation.",
    properties: {
      role: jobTitle || "Role pending confirmation",
      team: department || "Unknown",
      entity: "Abivax",
      needLevel: "engage",
      focusHints: Array.from(new Set(focusHints)),
      mail: mail || "",
      userPrincipalName: String(orgUser?.userPrincipalName || ""),
      reportsTo: manager || "",
      reportsToSource: manager ? "Outlook GAL" : "",
      seededFrom: "meeting-attendee-agent",
    },
    links: ["abivax"],
    notes: "Auto-created because person is an upcoming/today meeting attendee and no wiki entity existed yet.",
    mentions: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const tempDir = path.join(root, "temp");
  fs.mkdirSync(tempDir, { recursive: true });

  const meetings = readJson(path.join(dataDir, "meetings.json"), { meetings: [] }).meetings || [];
  const entitiesData = readJson(path.join(dataDir, "entities.json"), { entities: [] });
  const entities = Array.isArray(entitiesData.entities) ? entitiesData.entities : [];
  const org = readJson(path.join(dataDir, "org_graph.json"), { users: [] });
  const users = Array.isArray(org.users) ? org.users : [];
  const reportPath = path.join(tempDir, "meeting-attendee-entity-seed-report.json");

  const today = getTodayLocalYmd();
  const tomorrow = addDays(today, 1);
  const windowDates = new Set([today, tomorrow]);
  const nowIso = new Date().toISOString();

  const existingByNorm = new Map();
  for (const e of entities) {
    if (e.type !== "person") continue;
    existingByNorm.set(normalize(e.name), e);
    if (Array.isArray(e.aliases)) {
      for (const a of e.aliases) existingByNorm.set(normalize(a), e);
    }
    const props = e.properties || {};
    for (const k of ["mail", "userPrincipalName"]) {
      if (typeof props[k] === "string" && props[k]) existingByNorm.set(normalize(props[k]), e);
    }
  }

  const candidates = [];
  for (const m of meetings) {
    if (!windowDates.has(String(m.date || ""))) continue;
    for (const person of [...splitNames(m.organizer), ...splitNames(m.attendees)]) {
      if (!isLikelyPersonName(person)) continue;
      if (/^michael markman$/i.test(person)) continue;
      candidates.push({ name: person, meetingId: m.id || "", meetingTitle: m.title || "", date: m.date || "" });
    }
  }

  const seenNames = new Set();
  const created = [];
  const skipped = [];

  for (const c of candidates) {
    const normName = normalize(c.name);
    if (!normName || seenNames.has(normName)) continue;
    seenNames.add(normName);

    if (existingByNorm.has(normName)) {
      skipped.push({ name: c.name, reason: "already-exists", meetingTitle: c.meetingTitle });
      continue;
    }

    const orgUser = pickOrgRecord(users, c.name);
    const entity = buildEntity(c.name, orgUser, nowIso);
    entities.push(entity);
    existingByNorm.set(normName, entity);
    if (entity.properties?.mail) existingByNorm.set(normalize(entity.properties.mail), entity);
    created.push({
      id: entity.id,
      name: entity.name,
      role: entity.properties.role,
      team: entity.properties.team,
      reportsTo: entity.properties.reportsTo || "",
      fromMeeting: c.meetingTitle,
      orgMatched: Boolean(orgUser),
    });
  }

  if (created.length > 0) {
    writeJson(path.join(dataDir, "entities.json"), { entities });
  }

  writeJson(reportPath, {
    generatedAt: nowIso,
    windowDates: Array.from(windowDates),
    candidates: candidates.length,
    createdCount: created.length,
    skippedCount: skipped.length,
    created,
    skipped: skipped.slice(0, 50),
  });

  console.log(`meeting attendee entity seed: candidates=${candidates.length} created=${created.length} skipped=${skipped.length}`);
}

try {
  main();
} catch (err) {
  console.error(`seed_meeting_attendee_entities failed: ${err?.message || String(err)}`);
  process.exit(1);
}

