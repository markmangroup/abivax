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

function containsTerm(line, term) {
  const l = normalize(line);
  const t = normalize(term);
  if (!l || !t) return false;
  if (t.includes(" ")) return l.includes(t);
  return l.includes(` ${t} `) || l.startsWith(`${t} `) || l.endsWith(` ${t}`) || l === t;
}

function getProfileLines(profile) {
  return [
    ...(profile.signalsNow || []),
    ...(profile.decisions || []),
    ...(profile.risks || []),
    ...(profile.openLoops || []),
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

function genericLineScore(line) {
  const l = normalize(line);
  let score = 0;
  const genericPhrases = [
    "board",
    "budget cadence",
    "executive sponsorship",
    "march 19",
    "selection",
    "decision gate",
    "staffing",
    "resource",
    "timeline",
    "go live",
    "board communication",
    "audit committee",
  ];
  for (const p of genericPhrases) if (l.includes(p)) score += 1;
  return score;
}

function teamKeywords(team, role) {
  const text = normalize(`${team} ${role}`);
  if (text.includes("it")) return ["it", "integration", "cyber", "infrastructure", "system", "azure", "sox", "controls"];
  if (text.includes("fp&a") || text.includes("fpa")) return ["budget", "forecast", "cost center", "reporting", "adaptive", "planning"];
  if (text.includes("p2p")) return ["vendor", "invoice", "po", "approval", "payment", "trustpair", "procure"];
  if (text.includes("finance") || text.includes("account")) return ["close", "consolidation", "ifrs", "gaap", "reporting", "cash", "fx"];
  return [];
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const entities = readJson(path.join(dataDir, "entities.json"), { entities: [] }).entities || [];
  const profiles = readJson(path.join(dataDir, "entity_profiles.json"), { profiles: [] }).profiles || [];
  const outPath = path.join(root, "temp", "person-content-quality-report.json");
  fs.mkdirSync(path.join(root, "temp"), { recursive: true });

  const profileById = new Map(profiles.map((p) => [p.entityId, p]));
  const rows = [];
  const issues = [];

  for (const e of entities) {
    if (e.type !== "person") continue;
    if (shouldSuppressFromPrompts(e)) continue;
    const needLevel = String(e.properties?.needLevel || "").toLowerCase();
    if (!["critical", "engage"].includes(needLevel)) continue;

    const p = profileById.get(e.id);
    const lines = p ? getProfileLines(p) : [];
    const role = String(e.properties?.role || "");
    const team = String(e.properties?.team || "");
    const reportsTo = String(e.properties?.reportsTo || "");
    const anchors = [e.name, role, team, reportsTo].filter(Boolean);
    const anchorHits = lines.filter((line) => anchors.some((a) => containsTerm(line, a))).length;
    const genHeavy = lines.filter((line) => genericLineScore(line) >= 2);
    const kws = teamKeywords(team, role);
    const roleRelevantHits = kws.length
      ? lines.filter((line) => kws.some((kw) => containsTerm(line, kw))).length
      : 0;
    const sourceDiversity = Array.isArray(p?.noteIds) ? new Set(p.noteIds).size : 0;
    const totalLines = lines.length;

    let score = 100;
    if (!p) score -= 50;
    if (totalLines < 4) score -= 20;
    if (anchorHits < 2) score -= 25;
    if (anchorHits === 0) score -= 10;
    if (genHeavy.length >= Math.max(2, Math.ceil(totalLines * 0.4))) score -= 20;
    if (kws.length > 0 && roleRelevantHits < 2) score -= 15;
    if (sourceDiversity < 2) score -= 10;
    score = Math.max(0, Math.min(100, score));

    const row = {
      entityId: e.id,
      name: e.name,
      team,
      role,
      needLevel,
      totalLines,
      sourceDiversity,
      anchorHits,
      roleRelevantHits,
      genericHeavyLines: genHeavy.length,
      qualityScore: score,
      topGenericExamples: genHeavy.slice(0, 3),
    };
    rows.push(row);

    if (!p) {
      issues.push({ id: e.id, severity: "high", issue: "Missing profile", why: "No entity profile exists." });
      continue;
    }
    if (score < 55) {
      issues.push({
        id: e.id,
        severity: "high",
        issue: "Low person-page semantic quality",
        why: "Content appears too generic or weakly role-specific.",
      });
    } else if (score < 75) {
      issues.push({
        id: e.id,
        severity: "medium",
        issue: "Person-page quality could be more role-specific",
        why: "Profile has usable content but limited person-specific anchors.",
      });
    }
  }

  rows.sort((a, b) => a.qualityScore - b.qualityScore || a.name.localeCompare(b.name));
  writeJson(outPath, {
    generatedAt: new Date().toISOString(),
    scannedPeople: rows.length,
    averageQualityScore:
      rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.qualityScore, 0) / rows.length) : 0,
    weakestPeople: rows.slice(0, 8),
    issues,
    rows,
  });

  console.log(
    `person content quality: scanned=${rows.length} avg=${rows.length ? Math.round(rows.reduce((s, r) => s + r.qualityScore, 0) / rows.length) : 0} issues=${issues.length}`
  );
}

try {
  main();
} catch (err) {
  console.error(`analyze_person_content_quality failed: ${err?.message || String(err)}`);
  process.exit(1);
}

