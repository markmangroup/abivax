/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { shouldSuppressFromPrompts, normalize } = require("./agent_policy");

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function canonicalLine(line) {
  return normalize(line)
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, " date ")
    .replace(/\bq[1-4]\s*20\d{2}\b/g, " quarter ")
    .replace(/\b20\d{2}\b/g, " year ")
    .replace(/\b\d+\b/g, " n ")
    .replace(/\s+/g, " ")
    .trim();
}

function profileLines(profile) {
  return [
    ...(profile.signalsNow || []),
    ...(profile.decisions || []),
    ...(profile.risks || []),
    ...(profile.openLoops || []),
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const entities = readJson(path.join(dataDir, "entities.json"), { entities: [] }).entities || [];
  const profiles = readJson(path.join(dataDir, "entity_profiles.json"), { profiles: [] }).profiles || [];
  const outPath = path.join(root, "temp", "person-profile-redundancy-report.json");
  fs.mkdirSync(path.join(root, "temp"), { recursive: true });

  const entityById = new Map(entities.map((e) => [e.id, e]));
  const candidates = profiles
    .map((p) => ({ profile: p, entity: entityById.get(p.entityId) }))
    .filter(({ entity }) => entity && entity.type === "person")
    .filter(({ entity }) => !shouldSuppressFromPrompts(entity))
    .filter(({ entity }) => ["critical", "engage"].includes(String(entity.properties?.needLevel || "").toLowerCase()))
    .map(({ profile, entity }) => {
      const lines = profileLines(profile);
      return {
        entityId: entity.id,
        name: entity.name,
        team: String(entity.properties?.team || ""),
        role: String(entity.properties?.role || ""),
        lineSet: new Set(lines.map(canonicalLine).filter(Boolean)),
        rawLines: lines,
      };
    });

  const pairs = [];
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i];
      const b = candidates[j];
      const similarity = jaccard(a.lineSet, b.lineSet);
      if (similarity < 0.2) continue;
      const overlap = [...a.lineSet].filter((x) => b.lineSet.has(x)).slice(0, 6);
      const crossTeam = a.team && b.team && normalize(a.team) !== normalize(b.team);
      let severity = "low";
      if (similarity >= 0.45) severity = "high";
      else if (similarity >= 0.3) severity = "medium";
      if (crossTeam && similarity >= 0.28) severity = "high";
      pairs.push({
        aId: a.entityId,
        aName: a.name,
        aTeam: a.team,
        bId: b.entityId,
        bName: b.name,
        bTeam: b.team,
        similarity: Number(similarity.toFixed(3)),
        severity,
        overlapCount: overlap.length,
        overlapExamples: overlap,
      });
    }
  }

  pairs.sort((x, y) => y.similarity - x.similarity);
  const flagged = pairs.filter((p) => p.severity === "high" || p.severity === "medium");

  writeJson(outPath, {
    generatedAt: new Date().toISOString(),
    scannedPeople: candidates.length,
    pairCount: pairs.length,
    flaggedCount: flagged.length,
    topPairs: pairs.slice(0, 12),
    flaggedPairs: flagged.slice(0, 20),
  });

  console.log(`person profile redundancy: scanned=${candidates.length} flagged=${flagged.length}`);
}

try {
  main();
} catch (err) {
  console.error(`check_person_profile_redundancy failed: ${err?.message || String(err)}`);
  process.exit(1);
}

