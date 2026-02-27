/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { TextDecoder } = require("util");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function fail(msg) {
  console.error(`verify_connectivity failed: ${msg}`);
  process.exit(1);
}

function containsTerm(n, term) {
  if (!term) return false;
  if (term.includes(" ")) return n.includes(term);
  return n.includes(` ${term} `) || n.startsWith(`${term} `) || n.endsWith(` ${term}`) || n === term;
}

function assertUtf8(filePath) {
  const bytes = fs.readFileSync(filePath);
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`invalid UTF-8 detected in ${filePath}`);
  }
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");

  const notes = readJson(path.join(dataDir, "notes.json")).notes || [];
  const entities = readJson(path.join(dataDir, "entities.json")).entities || [];
  const profiles = readJson(path.join(dataDir, "entity_profiles.json")).profiles || [];

  const entityIds = new Set(entities.map((e) => e.id));
  const noteIds = new Set(notes.map((n) => n.id));
  const profileByEntity = new Map(profiles.map((p) => [p.entityId, p]));

  for (const e of entities) {
    if (!profileByEntity.has(e.id)) {
      fail(`missing profile for entity ${e.id}`);
    }
  }

  for (const p of profiles) {
    if (!entityIds.has(p.entityId)) {
      fail(`orphan profile entityId ${p.entityId}`);
    }
    for (const noteId of p.noteIds || []) {
      if (!noteIds.has(noteId)) {
        fail(`profile ${p.entityId} references unknown noteId ${noteId}`);
      }
    }
  }

  // Readability guard: profile should not be mostly generic/repeated.
  const entitiesById = new Map(entities.map((e) => [e.id, e]));
  const specificityWarnings = [];
  for (const p of profiles) {
    const e = entitiesById.get(p.entityId);
    if (!e) continue;
    const needLevel = String(e.properties?.needLevel || "").toLowerCase();
    if (needLevel === "context") continue;
    const focusHints = Array.isArray(e.properties?.focusHints) ? e.properties.focusHints : [];
    if ((e.type === "person" || e.type === "system") && (needLevel === "critical" || needLevel === "engage") && focusHints.length === 0) {
      specificityWarnings.push(`warning: ${e.id} is missing focusHints`);
    }
    const anchors = [e.name, e.id, ...(e.aliases || [])]
      .map((v) => String(v || "").toLowerCase())
      .filter((v) => v.length >= 3);
    const role = typeof e.properties?.role === "string" ? e.properties.role.toLowerCase() : "";
    const roleTokens = role.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
    const focusTokens = focusHints
      .map((v) => String(v || "").toLowerCase())
      .flatMap((v) => v.split(/[^a-z0-9]+/))
      .filter((w) => w.length >= 4);
    const checks = [...(p.signalsNow || []), ...(p.decisions || []), ...(p.risks || []), ...(p.openLoops || [])]
      .slice(0, 12)
      .map((x) => String(x || "").toLowerCase());
    if (checks.length === 0) continue;
    const matched = checks.filter((line) => {
      if (anchors.some((a) => containsTerm(line, a))) return true;
      if (roleTokens.some((t) => containsTerm(line, t))) return true;
      if (focusTokens.some((t) => containsTerm(line, t))) return true;
      return false;
    }).length;
    if (matched === 0) {
      const enoughEvidence = Array.isArray(p.noteIds) && p.noteIds.length >= 2;
      if (needLevel === "critical" && enoughEvidence) {
        fail(`profile ${p.entityId} has no entity-specific lines in top items`);
      }
      specificityWarnings.push(`warning: ${p.entityId} has weak specificity`);
    }
  }

  // Readability guard: avoid same leading signals across many profiles.
  const leadFreq = new Map();
  for (const p of profiles) {
    const key = (p.signalsNow || []).slice(0, 2).join(" | ").trim();
    if (!key) continue;
    leadFreq.set(key, (leadFreq.get(key) || 0) + 1);
  }
  const maxLeadDup = Math.max(0, ...Array.from(leadFreq.values()));
  if (maxLeadDup > Math.max(4, Math.floor(profiles.length * 0.2))) {
    fail(`profiles are too repetitive: top lead pair reused ${maxLeadDup} times`);
  }

  if (specificityWarnings.length) {
    for (const w of specificityWarnings) console.warn(w);
  }

  for (const e of entities) {
    for (const m of e.mentions || []) {
      if (!noteIds.has(m.noteId)) {
        fail(`entity ${e.id} mentions missing noteId ${m.noteId}`);
      }
    }
  }

  const notesPage = fs.readFileSync(
    path.join(root, "src", "app", "abivax", "spine", "notes", "page.tsx"),
    "utf8"
  );
  assertUtf8(path.join(root, "src", "app", "abivax", "spine", "notes", "page.tsx"));
  assertUtf8(path.join(root, "src", "app", "abivax", "spine", "entity", "[slug]", "page.tsx"));
  assertUtf8(path.join(root, "src", "app", "abivax", "spine", "today", "TodayBriefClient.tsx"));

  if (!notesPage.includes("id={note.id}")) {
    fail("notes page is missing note anchor ids for deep links");
  }

  const entityPage = fs.readFileSync(
    path.join(root, "src", "app", "abivax", "spine", "entity", "[slug]", "page.tsx"),
    "utf8"
  );
  if (!entityPage.includes("/abivax/spine/notes#")) {
    fail("entity page is missing deep links into notes");
  }

  const nav = fs.readFileSync(
    path.join(root, "src", "app", "abivax", "spine", "SpineNav.tsx"),
    "utf8"
  );
  if (nav.includes('{ href: "/today", label: "Today"')) {
    fail("SpineNav Today link should point to /abivax/spine/today");
  }

  console.log("Connectivity checks passed.");
}

try {
  main();
} catch (err) {
  fail(err?.message || String(err));
}
