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

function priorityRank(p) {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}

function main() {
  const root = path.join(__dirname, "..");
  const tempDir = path.join(root, "temp");
  const dataDir = path.join(root, "data", "abivax");

  const waterfall = readJson(path.join(tempDir, "swarm-waterfall-report.json"), {});
  const wikiQueue = readJson(path.join(dataDir, "wiki_review_queue.json"), { summary: {}, items: [] });
  const companyQueue = readJson(path.join(dataDir, "company_intel_review_queue.json"), { summary: {}, items: [] });
  const pageQueue = readJson(path.join(dataDir, "page_readability_review_queue.json"), { summary: {}, items: [] });
  const todayQueue = readJson(path.join(dataDir, "today_content_review_queue.json"), { summary: {}, items: [] });
  const wikiBacklog = readJson(path.join(dataDir, "wiki_agent_backlog.json"), { summary: {}, todos: [] });
  const companyBacklog = readJson(path.join(dataDir, "company_intel_agent_backlog.json"), { summary: {}, todos: [] });
  const pageBacklog = readJson(path.join(dataDir, "page_readability_agent_backlog.json"), { summary: {}, todos: [] });
  const todayBacklog = readJson(path.join(dataDir, "today_content_agent_backlog.json"), { summary: {}, todos: [] });

  const stageRows = Array.isArray(waterfall.stages) ? waterfall.stages : [];
  const stageById = new Map(stageRows.map((s) => [s.id, s]));

  const reviewNow = [];
  const tuningTargets = [];
  const rerunRecommendations = [];

  const failedStages = stageRows.filter((s) => String(s.status).includes("fail"));
  const failedSteps = stageRows.flatMap((s) => (s.steps || []).filter((x) => x.status === "failed").map((x) => ({
    stageId: s.id,
    stageLabel: s.label,
    stepId: x.id,
    stepLabel: x.label,
    outputPreview: x.outputPreview || "",
  })));

  for (const f of failedSteps) {
    reviewNow.push({
      priority: "high",
      type: "failed-step",
      title: `${f.stageLabel}: ${f.stepLabel} failed`,
      why: f.outputPreview || "Step failed with no output preview",
      suggestedAction: "Fix failure, then rerun this stage and downstream stages.",
      stage: f.stageId,
      step: f.stepId,
    });
  }

  const wikiHigh = Number(wikiQueue?.summary?.highPriorityPending || 0);
  if (wikiHigh > 0) {
    reviewNow.push({
      priority: "high",
      type: "queue-review",
      title: "Review high-priority wiki quality items",
      why: `${wikiHigh} high-priority wiki queue item(s) pending Codex review.`,
      suggestedAction: "Review wiki queue and patch entity profile/presentation rules before broad UI changes.",
      stage: "detect",
    });
  }

  const companyHigh = Number(companyQueue?.summary?.highPriorityPending || 0);
  if (companyHigh > 0) {
    reviewNow.push({
      priority: "high",
      type: "queue-review",
      title: "Review high-priority company intel items",
      why: `${companyHigh} high-priority company intel queue item(s) pending review.`,
      suggestedAction: "Review company intel queue and integrate material items into canonical intel/digest.",
      stage: "detect",
    });
  }

  const pageHigh = Number(pageQueue?.summary?.highPriorityPending || 0);
  if (pageHigh > 0) {
    reviewNow.push({
      priority: "high",
      type: "queue-review",
      title: "Review high-priority page readability items",
      why: `${pageHigh} high-priority page readability item(s) pending Codex review.`,
      suggestedAction: "Review page readability queue and prune default-view noise before visual polish work.",
      stage: "detect",
    });
  }

  const todayHigh = Number(todayQueue?.summary?.highPriorityPending || 0);
  if (todayHigh > 0) {
    reviewNow.push({
      priority: "high",
      type: "queue-review",
      title: "Review high-priority Today content-quality items",
      why: `${todayHigh} high-priority Today content-quality item(s) pending Codex review.`,
      suggestedAction: "Patch Today top-block ranking/suppression so operator lane reflects current evidence and resolved facts.",
      stage: "detect",
    });
  }

  const companyTodos = Array.isArray(companyBacklog.todos) ? companyBacklog.todos : [];
  const wikiTodos = Array.isArray(wikiBacklog.todos) ? wikiBacklog.todos : [];
  const pageTodos = Array.isArray(pageBacklog.todos) ? pageBacklog.todos : [];
  const todayTodos = Array.isArray(todayBacklog.todos) ? todayBacklog.todos : [];
  for (const t of [...companyTodos, ...wikiTodos, ...pageTodos, ...todayTodos].slice(0, 12)) {
    tuningTargets.push({
      priority: t.priority || "medium",
      title: t.title || "Agent improvement item",
      why: t.why || "",
      nextStep: t.nextStep || "",
      owner: t.owner || "Codex",
    });
  }

  const detectStage = stageById.get("detect");
  if (detectStage && Number(detectStage.durationMs || 0) > 60000) {
    tuningTargets.push({
      priority: "medium",
      title: "Detect stage runtime is heavy",
      why: `Detect stage took ${Math.round(Number(detectStage.durationMs || 0) / 1000)}s.`,
      nextStep: "Profile detector agents and split slow detectors into lower-frequency lanes if needed.",
      owner: "Codex",
    });
  }

  // Stage rerun guidance
  if (failedSteps.length > 0) {
    const order = ["ingest", "normalize", "enrich", "detect", "outputs"];
    const earliestFailedIdx = Math.min(...failedSteps.map((f) => order.indexOf(f.stageId)).filter((v) => v >= 0));
    if (earliestFailedIdx >= 0) {
      rerunRecommendations.push({
        reason: "Failure recovery",
        rerunStages: order.slice(earliestFailedIdx),
        notes: "Fix the failing step first, then rerun from the earliest failed stage downstream.",
      });
    }
  } else {
    if (wikiHigh > 0 || companyHigh > 0) {
      rerunRecommendations.push({
        reason: "Post-review refresh",
        rerunStages: ["enrich", "detect", "outputs"],
        notes: "After Codex queue review/patches, rerun downstream stages to refresh pages/decks.",
      });
    } else {
      rerunRecommendations.push({
        reason: "No immediate rerun needed",
        rerunStages: [],
        notes: "Waterfall run is healthy and no high-priority queues are pending.",
      });
    }
  }

  const topAnomalies = Array.isArray(waterfall?.summary?.topAnomalies)
    ? waterfall.summary.topAnomalies.filter(Boolean)
    : [];
  for (const anomaly of topAnomalies) {
    reviewNow.push({
      priority: "medium",
      type: "anomaly",
      title: "Waterfall anomaly",
      why: String(anomaly),
      suggestedAction: "Inspect related stage metrics and decide whether to tune agent or mark expected.",
    });
  }

  reviewNow.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  tuningTargets.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceReport: path.join(tempDir, "swarm-waterfall-report.json"),
    overallStatus: waterfall.overallStatus || "unknown",
    summary: {
      reviewNowCount: reviewNow.length,
      highPriorityReviewNow: reviewNow.filter((x) => x.priority === "high").length,
      tuningTargetCount: tuningTargets.length,
      highPriorityTuning: tuningTargets.filter((x) => x.priority === "high").length,
      recommendedReruns: rerunRecommendations.length,
    },
    reviewNow: reviewNow.slice(0, 12),
    tuningTargets: tuningTargets.slice(0, 12),
    rerunRecommendations,
    stageSnapshot: stageRows.map((s) => ({
      id: s.id,
      status: s.status,
      durationMs: Number(s.durationMs || 0),
      failedSteps: Number(s.failedSteps || 0),
      stepCount: Number(s.stepCount || 0),
    })),
  };

  writeJson(path.join(tempDir, "swarm-waterfall-review.json"), payload);
  console.log(path.join(tempDir, "swarm-waterfall-review.json"));
}

main();
