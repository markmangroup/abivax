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

function norm(v) {
  return String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function makeKey(item) {
  return `${item.queueType}|${item.entityId || ""}|${norm(item.title)}|${item.category || ""}`;
}

function severityToPriority(sev) {
  const s = String(sev || "").toLowerCase();
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  return "low";
}

function buildItems(sources) {
  const items = [];
  const now = new Date().toISOString();

  for (const issue of sources.wikiSpecificity.issues || []) {
    items.push({
      queueType: "wiki-quality-review",
      source: "wiki-specificity",
      category: "specificity",
      entityId: issue.id,
      title: `Wiki specificity review: ${issue.id}`,
      why: issue.why || issue.issue || "Low specificity signal",
      priority: severityToPriority(issue.severity),
      status: "pending-review",
      detectedAt: sources.wikiSpecificity.generatedAt || now,
      reviewHint: "Check entity profile structured-vs-note balance and page rendering priority.",
    });
  }

  for (const issue of sources.personRelevance.issues || []) {
    items.push({
      queueType: "wiki-quality-review",
      source: "person-relevance",
      category: "person-relevance",
      entityId: issue.id,
      title: `Person relevance review: ${issue.id}`,
      why: issue.why || issue.issue || "Person page reads like program prompts",
      priority: severityToPriority(issue.severity),
      status: "pending-review",
      detectedAt: sources.personRelevance.generatedAt || now,
      reviewHint: "Reduce broad program prompts and inject role/workstream-specific context first.",
    });
  }

  for (const pair of sources.personRedundancy.flaggedPairs || []) {
    const similarity = Number(pair.similarity ?? pair.similarityScore ?? pair.score ?? 0);
    if (similarity < 0.33) continue;
    items.push({
      queueType: "wiki-quality-review",
      source: "person-redundancy",
      category: "redundancy",
      entityId: pair.aId || pair.a || "",
      relatedEntityId: pair.bId || pair.b || "",
      title: `Person redundancy review: ${(pair.aId || pair.a)} vs ${(pair.bId || pair.b)}`,
      why: `Similarity ${similarity.toFixed(3)} suggests overlapping page context.`,
      priority: similarity >= 0.5 ? "high" : "medium",
      status: "pending-review",
      detectedAt: sources.personRedundancy.generatedAt || now,
      reviewHint: "Split shared program context from person-specific facts; move common content to Program/Process Flows.",
    });
  }

  return items;
}

function main() {
  const root = path.join(__dirname, "..");
  const tempDir = path.join(root, "temp");
  const dataDir = path.join(root, "data", "abivax");

  const sources = {
    wikiSpecificity: readJson(path.join(tempDir, "wiki-specificity-report.json"), { issues: [] }),
    personRelevance: readJson(path.join(tempDir, "person-relevance-mismatch-report.json"), { issues: [] }),
    personRedundancy: readJson(path.join(tempDir, "person-profile-redundancy-report.json"), { flaggedPairs: [] }),
  };

  const existing = readJson(path.join(dataDir, "wiki_review_queue.json"), { items: [] });
  const existingByKey = new Map((existing.items || []).map((x) => [makeKey(x), x]));

  const detections = buildItems(sources);
  const seen = new Set();
  const items = [];
  for (const det of detections) {
    const key = makeKey(det);
    if (seen.has(key)) continue;
    seen.add(key);
    const prev = existingByKey.get(key);
    items.push({
      ...det,
      status: prev?.status || det.status,
      reviewedAt: prev?.reviewedAt || null,
      reviewOutcome: prev?.reviewOutcome || "",
      notes: prev?.notes || "",
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      pendingReview: items.filter((i) => i.status === "pending-review").length,
      reviewed: items.filter((i) => i.status === "reviewed").length,
      highPriorityPending: items.filter((i) => i.status === "pending-review" && i.priority === "high").length,
      byCategory: items.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {}),
    },
    items: items.sort((a, b) => {
      const p = { high: 3, medium: 2, low: 1 };
      const pri = (p[b.priority] || 0) - (p[a.priority] || 0);
      if (pri) return pri;
      return (Date.parse(b.detectedAt || "") || 0) - (Date.parse(a.detectedAt || "") || 0);
    }).slice(0, 30),
  };

  writeJson(path.join(dataDir, "wiki_review_queue.json"), payload);
  writeJson(path.join(tempDir, "wiki-review-queue-report.json"), payload.summary);
  console.log(path.join(tempDir, "wiki-review-queue-report.json"));
}

main();
