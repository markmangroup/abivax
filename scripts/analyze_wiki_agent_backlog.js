const fs = require("fs");
const path = require("path");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function main() {
  const root = path.join(__dirname, "..");
  const tempDir = path.join(root, "temp");
  const dataDir = path.join(root, "data", "abivax");

  const wikiQueue = readJson(path.join(dataDir, "wiki_review_queue.json"), { summary: {}, items: [] });
  const wikiSpecificity = readJson(path.join(tempDir, "wiki-specificity-report.json"), { issues: [] });
  const personRelevance = readJson(path.join(tempDir, "person-relevance-mismatch-report.json"), { issues: [] });
  const agentRoleAudit = readJson(path.join(tempDir, "agent-role-audit.json"), { rows: [], summary: {} });

  const todos = [];

  if ((wikiQueue.summary?.highPriorityPending || 0) > 0) {
    todos.push({
      id: "wiki-queue-high-priority-review",
      priority: "high",
      title: "Review high-priority wiki quality queue items",
      why: `${wikiQueue.summary.highPriorityPending} high-priority wiki item(s) pending Codex review.`,
      nextStep: "User can prompt: 'review the wiki queue' to apply pipeline/page fixes or mark no-action.",
      owner: "Mike + Codex",
    });
  }

  const mediumSpecificity = (wikiSpecificity.issues || []).filter((i) => i.severity === "medium").length;
  if (mediumSpecificity > 0) {
    todos.push({
      id: "wiki-person-structured-enrichment-gap",
      priority: "medium",
      title: "Improve person structured enrichment coverage",
      why: `${mediumSpecificity} person wiki pages still flagged for low specificity after profile filtering.`,
      nextStep: "Add more structured person signals (systems touched, meetings, pillar relevance, ownership) before note-derived context.",
      owner: "Codex",
    });
  }

  if ((personRelevance.issues || []).length > 0) {
    todos.push({
      id: "wiki-person-relevance-filter-tuning",
      priority: "medium",
      title: "Tune person relevance filters for broad program prompts",
      why: `${personRelevance.issues.length} person pages still look like project prompts.`,
      nextStep: "Expand prompt-pattern suppression and exact-anchor gating in entity profile generation for person entities.",
      owner: "Codex",
    });
  }

  const wikiReviewScope = (agentRoleAudit.rows || []).filter((r) => r.touchesWiki && r.mode === "review-scope");
  if (wikiReviewScope.length > 0) {
    todos.push({
      id: "wiki-agent-role-classification-review",
      priority: "medium",
      title: "Review wiki-touching agents marked review-scope",
      why: `${wikiReviewScope.length} wiki-touching agents are not clearly classified as deterministic vs detector.`,
      nextStep: "Manually classify and narrow agent responsibilities; avoid autonomous semantic rewrites without queue/review.",
      owner: "Codex",
    });
  }

  if ((wikiQueue.summary?.pendingReview || 0) === 0 && mediumSpecificity === 0 && (personRelevance.issues || []).length === 0) {
    todos.push({
      id: "wiki-quality-steady-state",
      priority: "low",
      title: "Wiki quality loop in steady state",
      why: "No pending wiki queue items and no active specificity/relevance issues.",
      nextStep: "Monitor new entities from meetings and continue structured-first enrichment by entity type.",
      owner: "Codex",
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      openTodos: todos.length,
      highPriority: todos.filter((t) => t.priority === "high").length,
      mediumPriority: todos.filter((t) => t.priority === "medium").length,
      lowPriority: todos.filter((t) => t.priority === "low").length,
    },
    todos,
  };

  writeJson(path.join(dataDir, "wiki_agent_backlog.json"), payload);
  writeJson(path.join(tempDir, "wiki-agent-backlog-report.json"), payload);
  console.log(path.join(tempDir, "wiki-agent-backlog-report.json"));
}

main();

