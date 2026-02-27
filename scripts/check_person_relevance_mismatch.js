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

function containsTerm(line, term) {
  const l = normalize(line);
  const t = normalize(term);
  if (!l || !t) return false;
  if (t.includes(" ")) return l.includes(t);
  return l.includes(` ${t} `) || l.startsWith(`${t} `) || l.endsWith(` ${t}`) || l === t;
}

function teamKeywords(team, role) {
  const text = normalize(`${team} ${role}`);
  if (text.includes("it")) return ["it", "integration", "system", "access", "azure", "cyber", "architecture"];
  if (text.includes("fp&a") || text.includes("fpa")) return ["forecast", "budget", "cost center", "reporting", "data", "adaptive"];
  if (text.includes("p2p")) return ["vendor", "invoice", "payment", "approval", "trustpair", "procure", "purchase"];
  if (text.includes("finance") || text.includes("account")) return ["close", "ifrs", "gaap", "sec", "reconciliation", "cash", "fx"];
  return [];
}

function actionLike(line) {
  const l = String(line || "").trim().toLowerCase();
  return (
    /\?$/.test(l) ||
    /^(run|follow up|follow-up|need|confirm|ask|track|route|use|set|add|prepare|check|review)\b/.test(l)
  );
}

function broadProgramLine(line) {
  const l = normalize(line);
  const patterns = [
    "mike is now positioned as central intake",
    "who owns weekly budget tracking",
    "what is the escalation path",
    "use this meeting to lock role map",
    "unclear attendee ownership",
    "board communication",
    "march 19",
  ];
  return patterns.some((p) => l.includes(p));
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const outPath = path.join(root, "temp", "person-relevance-mismatch-report.json");
  fs.mkdirSync(path.join(root, "temp"), { recursive: true });

  const entities = readJson(path.join(dataDir, "entities.json"), { entities: [] }).entities || [];
  const profiles = readJson(path.join(dataDir, "entity_profiles.json"), { profiles: [] }).profiles || [];
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
    const kws = teamKeywords(team, role);
    const selfAnchors = [e.name, ...(e.aliases || []), role, team].filter(Boolean);

    const actionLines = lines.filter(actionLike);
    const selfFactLines = lines.filter((line) => selfAnchors.some((a) => containsTerm(line, a)));
    const roleRelevantLines = kws.length ? lines.filter((line) => kws.some((kw) => containsTerm(line, kw))) : [];
    const broadLines = lines.filter(broadProgramLine);

    const total = lines.length;
    const actionRatio = total ? actionLines.length / total : 0;
    const broadRatio = total ? broadLines.length / total : 0;
    const selfFactRatio = total ? selfFactLines.length / total : 0;

    let mismatchScore = 0;
    if (total >= 4 && actionRatio >= 0.4) mismatchScore += 25;
    if (total >= 4 && broadRatio >= 0.25) mismatchScore += 25;
    if (total >= 4 && selfFactRatio < 0.2) mismatchScore += 25;
    if (total >= 4 && kws.length > 0 && roleRelevantLines.length < 2) mismatchScore += 20;
    if (total < 4) mismatchScore += 10; // weak page can still be a relevance problem
    mismatchScore = Math.min(100, mismatchScore);

    const row = {
      entityId: e.id,
      name: e.name,
      team,
      role,
      totalLines: total,
      actionLikeLines: actionLines.length,
      broadProgramLines: broadLines.length,
      selfFactLines: selfFactLines.length,
      roleRelevantLines: roleRelevantLines.length,
      mismatchScore,
      examples: [...broadLines, ...actionLines].slice(0, 3),
    };
    rows.push(row);

    if (mismatchScore >= 50) {
      issues.push({
        id: e.id,
        severity: mismatchScore >= 70 ? "high" : "medium",
        issue: "Person page reads more like project task prompts than person-specific context",
        why: `actionRatio=${Math.round(actionRatio * 100)}% broadRatio=${Math.round(broadRatio * 100)}% selfFactRatio=${Math.round(selfFactRatio * 100)}%`,
      });
    }
  }

  rows.sort((a, b) => b.mismatchScore - a.mismatchScore || a.name.localeCompare(b.name));
  writeJson(outPath, {
    generatedAt: new Date().toISOString(),
    scannedPeople: rows.length,
    flaggedCount: issues.length,
    topMismatches: rows.filter((r) => r.mismatchScore >= 40).slice(0, 8),
    issues,
    rows,
  });

  console.log(`person relevance mismatch: scanned=${rows.length} flagged=${issues.length}`);
}

try {
  main();
} catch (err) {
  console.error(`check_person_relevance_mismatch failed: ${err?.message || String(err)}`);
  process.exit(1);
}

