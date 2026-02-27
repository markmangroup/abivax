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

  const irWeb = readJson(path.join(tempDir, "company-intel-ir-feed-status.json"), {});
  const irEmail = readJson(path.join(tempDir, "company-intel-ir-email-feed-status.json"), {});
  const irEmailFeed = readJson(path.join(dataDir, "company_intel_ir_email_feed.json"), { items: [] });
  const secStatusFile = readJson(path.join(tempDir, "company-intel-sec-feed-status.json"), {});
  const queue = readJson(path.join(dataDir, "company_intel_review_queue.json"), { summary: {}, items: [] });
  const digest = readJson(path.join(dataDir, "company_intel_daily_digest.json"), { sourceStatus: [] });

  const todos = [];

  const irWebStatus = String(irWeb.status || "");
  const secOk = String(secStatusFile.status || "") === "ok";
  const irEmailOk = String(irEmail.status || "") === "ok" && Number(irEmail.itemCount || 0) > 0;
  const irWebDegradedButCovered = irWebStatus === "degraded-sec-derived" && secOk && irEmailOk;

  if (irWebStatus !== "ok" && !irWebDegradedButCovered) {
    todos.push({
      id: "ci-agent-ir-web-reliability",
      priority: "high",
      title: "Stabilize direct Abivax IR website detector",
      why: String(irWeb.error || "Direct IR feed not producing items"),
      nextStep: "Retry with alternate endpoint set/proxy-friendly fetch strategy and retain last successful cache.",
      owner: "Codex",
    });
  } else if (irWebDegradedButCovered) {
    todos.push({
      id: "ci-agent-ir-web-reliability",
      priority: "low",
      title: "Stabilize direct Abivax IR website detector (degraded fallback acceptable)",
      why: "IR website sync is timing out, but SEC-derived fallback plus IR email alerts are active and covering daily signal needs.",
      nextStep: "Treat as reliability improvement (not urgent) while fallback remains healthy.",
      owner: "Codex",
    });
  }

  if (String(irEmail.status || "") === "ok" && Number(irEmail.itemCount || 0) > 0) {
    const items = Array.isArray(irEmailFeed.items) ? irEmailFeed.items : [];
    const isLowValueAlert = (item) => /^(New Form\b|Weekly Summary Alert\b)/i.test(String(item.title || ""));
    const reviewRelevantItems = items.filter((i) => !isLowValueAlert(i));
    const wrappedLinkCount = reviewRelevantItems.filter((i) => /notification\.gcs-web\.com/i.test(String(i.url || ""))).length;
    const weakSummaryCount = items.filter((i) => {
      if (isLowValueAlert(i)) return false;
      const s = String(i.summary || "");
      const title = String(i.title || "");
      const titleIsSpecific = title.length >= 80 && /abivax\s+(presents|announces|provides|reports)/i.test(title);
      return !s || /^</.test(s) || (s.length < 60 && !titleIsSpecific);
    }).length;
    const needsFurtherEnrichment = wrappedLinkCount > 0 || weakSummaryCount > 0;
    if (needsFurtherEnrichment) {
    todos.push({
      id: "ci-agent-ir-email-enrich",
      priority: "medium",
      title: "Enrich IR email detector output",
      why: `Email alerts are active, but ${wrappedLinkCount} item(s) still use wrapped tracking links and ${weakSummaryCount} item(s) have weak/noisy summaries.`,
      nextStep: "Prefer canonical IR/SEC links when resolvable and strip tracking/markup-heavy snippets for cleaner review queue items.",
      owner: "Codex",
    });
    }
  }

  if (Number(queue?.summary?.highPriorityPending || 0) > 0) {
    todos.push({
      id: "ci-queue-high-priority-review",
      priority: "high",
      title: "Review high-priority company intel queue items",
      why: `${queue.summary.highPriorityPending} high-priority item(s) pending Codex review.`,
      nextStep: "User can prompt: 'review the company intel queue' to integrate material items into company_intel.json and decks.",
      owner: "Mike + Codex",
    });
  }

  const secStatus = (digest.sourceStatus || []).find((s) => s.id === "sec-filings");
  if (!secStatus || String(secStatus.status) === "planned") {
    todos.push({
      id: "ci-agent-sec-detector",
      priority: "high",
      title: "Add SEC filings detector (6-K / filings)",
      why: "Official filings are a high-signal source and are still not connected.",
      nextStep: "Implement detection-first SEC feed queue agent before broader news/social feeds.",
      owner: "Codex",
    });
  } else if (String(secStatus.status) === "sync-failed") {
    todos.push({
      id: "ci-agent-sec-reliability",
      priority: "high",
      title: "Stabilize SEC filings detector",
      why: String(secStatus.notes || secStatusFile.error || "SEC detector is configured but failing"),
      nextStep: "Adjust SEC fetch strategy/headers and cache CIK mapping to reduce external dependency failures.",
      owner: "Codex",
    });
  } else if (String(secStatusFile.status || "") !== "ok") {
    todos.push({
      id: "ci-agent-sec-reliability",
      priority: "high",
      title: "Stabilize SEC detector reliability",
      why: String(secStatusFile.error || "SEC detector status file not returning ok despite feed marked active"),
      nextStep: "Review SEC fetch headers/rate behavior and cache last successful results.",
      owner: "Codex",
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      openTodos: todos.length,
      highPriority: todos.filter((t) => t.priority === "high").length,
      mediumPriority: todos.filter((t) => t.priority === "medium").length,
    },
    todos,
  };

  writeJson(path.join(dataDir, "company_intel_agent_backlog.json"), payload);
  writeJson(path.join(tempDir, "company-intel-agent-backlog-report.json"), payload);
  console.log(path.join(tempDir, "company-intel-agent-backlog-report.json"));
}

main();
