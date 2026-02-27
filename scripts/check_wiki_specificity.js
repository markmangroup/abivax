/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { shouldSuppressFromPrompts, isTopExecRole } = require("./agent_policy");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonNoBom(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsTerm(line, term) {
  const l = normalize(line);
  const t = normalize(term);
  if (!l || !t) return false;
  if (t.includes(" ")) return l.includes(t);
  return l.includes(` ${t} `) || l.startsWith(`${t} `) || l.endsWith(` ${t}`) || l === t;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const entities = readJson(path.join(dataDir, "entities.json")).entities || [];
  const profiles = readJson(path.join(dataDir, "entity_profiles.json")).profiles || [];
  const reportPath = path.join(root, "temp", "wiki-specificity-report.json");
  fs.mkdirSync(path.join(root, "temp"), { recursive: true });

  const byProfile = new Map(profiles.map((p) => [p.entityId, p]));
  const issues = [];

  for (const e of entities) {
    if (e.type !== "person") continue;
    if (shouldSuppressFromPrompts(e)) continue;
    const needLevel = String(e.properties?.needLevel || "").toLowerCase();
    if (!["critical", "engage"].includes(needLevel)) continue;
    const p = byProfile.get(e.id);
    if (!p) {
      issues.push({ id: e.id, severity: "high", issue: "Missing profile", why: "No profile exists for this person." });
      continue;
    }

    const lines = [
      ...(p.signalsNow || []),
      ...(p.decisions || []),
      ...(p.risks || []),
      ...(p.openLoops || []),
    ].slice(0, 14);

    const role = String(e.properties?.role || e.properties?.graphJobTitle || "");
    const team = String(e.properties?.team || e.properties?.graphDepartment || "");
    const reportsTo = String(e.properties?.reportsTo || e.properties?.graphReportsTo || "");
    const topExec = isTopExecRole(e);
    const anchors = [e.name, role, team, reportsTo].filter(Boolean);
    const lineHitCounts = lines.map((line) => anchors.filter((a) => containsTerm(line, a)).length);
    const score = lineHitCounts.filter((n) => n > 0).length;
    const totalAnchorHits = lineHitCounts.reduce((sum, n) => sum + n, 0);

    if (!team) {
      issues.push({ id: e.id, severity: "high", issue: "Missing team field", why: "Team is required for fast organizational clarity." });
    }
    if (!reportsTo && needLevel === "critical" && !topExec) {
      issues.push({ id: e.id, severity: "high", issue: "Missing reportsTo field", why: "Critical stakeholders need explicit reporting lines." });
    }
    if (score < 2 && totalAnchorHits < 3) {
      issues.push({
        id: e.id,
        severity: score === 0 ? "high" : "medium",
        issue: "Low person-specific profile content",
        why: "Top profile lines do not reference role/team/reporting enough (line coverage + anchor hit count).",
      });
    }
  }

  const bySeverity = {
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  };

  writeJsonNoBom(reportPath, {
    generatedAt: new Date().toISOString(),
    scannedPeople: entities.filter((e) => e.type === "person").length,
    bySeverity,
    issues,
  });

  console.log(`wiki specificity: high=${bySeverity.high} medium=${bySeverity.medium} total=${issues.length}`);
}

try {
  main();
} catch (err) {
  console.error(`check_wiki_specificity failed: ${err?.message || String(err)}`);
  process.exit(1);
}
