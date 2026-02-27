/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { shouldSuppressFromPrompts } = require("./agent_policy");

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonNoBom(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function main() {
  const root = path.resolve(__dirname, "..");
  const tempDir = path.join(root, "temp");
  fs.mkdirSync(tempDir, { recursive: true });

  const peopleReport = readJson(path.join(tempDir, "people-canonical-report.json"), { unresolved: [] });
  const wikiReport = readJson(path.join(tempDir, "wiki-specificity-report.json"), { issues: [] });
  const navReport = readJson(path.join(tempDir, "nav-governance-report.json"), {
    navCount: 0,
    recommendations: [],
    groups: { daily: [] },
  });
  const entities = readJson(path.join(root, "data", "abivax", "entities.json"), { entities: [] }).entities || [];
  const entityById = new Map(entities.map((e) => [e.id, e]));

  const prompts = [];

  for (const item of peopleReport.unresolved || []) {
    const entity = entityById.get(item.id);
    if (entity && shouldSuppressFromPrompts(entity)) continue;
    const field = String(item.issue || "")
      .replace(/^Missing\s+/i, "")
      .replace(/reportsTo/i, "reporting line")
      .replace(/team/i, "team")
      .toLowerCase();
    prompts.push({
      priority: "high",
      prompt: `Confirm ${item.name}'s ${field}.`,
      why: "Leadership map is incomplete and may cause coordination mistakes.",
      source: "people_canonical",
    });
  }

  const highSpecificity = (wikiReport.issues || [])
    .filter((i) => i.severity === "high")
    .filter((i) => {
      const entity = entityById.get(i.id);
      return !(entity && shouldSuppressFromPrompts(entity));
    });
  for (const issue of highSpecificity) {
    prompts.push({
      priority: "high",
      prompt: `Tighten ${issue.id} wiki specificity this cycle.`,
      why: issue.why,
      source: "wiki_specificity",
    });
  }

  if ((navReport.navCount || 0) > 9) {
    prompts.push({
      priority: "medium",
      prompt: "Pick your top 3 daily pages and collapse the rest into reference mode.",
      why: "Current nav breadth can dilute focus and increase context-switching.",
      source: "nav_governance",
    });
  }

  const dailyLabels = (navReport.groups?.daily || []).map((d) => d.label).join(", ");
  if (dailyLabels) {
    prompts.push({
      priority: "medium",
      prompt: `Do today's workflows stay inside: ${dailyLabels}?`,
      why: "If not, nav group priorities may be wrong and should be rebalanced.",
      source: "nav_governance",
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const p of prompts) {
    const key = `${p.priority}|${p.prompt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(p);
  }

  const outPath = path.join(tempDir, "operator-focus-prompts.json");
  writeJsonNoBom(outPath, {
    generatedAt: new Date().toISOString(),
    promptCount: deduped.length,
    prompts: deduped.slice(0, 8),
  });

  console.log(`focus prompts: ${Math.min(deduped.length, 8)}`);
}

try {
  main();
} catch (err) {
  console.error(`generate_operator_focus_prompts failed: ${err?.message || String(err)}`);
  process.exit(1);
}
