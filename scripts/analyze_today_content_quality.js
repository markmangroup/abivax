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

function normalize(s) {
  return String(s || "").toLowerCase();
}

function priorityRank(p) {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}

function parseDate(value) {
  const ts = Date.parse(String(value || ""));
  return Number.isNaN(ts) ? null : new Date(ts);
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function main() {
  const root = path.join(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const tempDir = path.join(root, "temp");
  const now = new Date();

  const todayMeetings = readJson(path.join(tempDir, "todays-meetings.json"), { meetings: [] });
  const emails = readJson(path.join(tempDir, "recent-emails.json"), { emails: [] });
  const focusPrompts = readJson(path.join(tempDir, "operator-focus-prompts.json"), { prompts: [] });
  const timeline = readJson(path.join(dataDir, "timeline.json"), { milestones: [] });
  const pillars = readJson(path.join(dataDir, "erp_pillar_baselines.json"), { baselines: [] });
  const todayClientSource = (() => {
    try {
      return fs.readFileSync(
        path.join(root, "src", "app", "abivax", "spine", "today", "TodayBriefClient.tsx"),
        "utf8"
      );
    } catch {
      return "";
    }
  })();
  const todayPageServerSource = (() => {
    try {
      return fs.readFileSync(
        path.join(root, "src", "app", "abivax", "spine", "today", "page.tsx"),
        "utf8"
      );
    } catch {
      return "";
    }
  })();

  const meetings = Array.isArray(todayMeetings.meetings) ? todayMeetings.meetings : [];
  const todayMeetingRows = meetings.filter((m) => {
    const d = parseDate(m.start || m.date);
    return d && sameDay(d, now);
  });

  const byStart = new Map();
  for (const m of todayMeetingRows) {
    const key = String(m.start || "").slice(0, 16);
    if (!byStart.has(key)) byStart.set(key, []);
    byStart.get(key).push(m);
  }
  const overlappingGroups = [...byStart.values()].filter((g) => g.length > 1);
  const overlappingTitles = overlappingGroups.flatMap((g) => g.map((m) => String(m.title || "")));
  const hasErpOverlap = overlappingTitles.some((t) => /\berp\b|decision/i.test(t));
  const hasManagersOverlap = overlappingTitles.some((t) => /manager/i.test(t));

  const recentEmails = (Array.isArray(emails.emails) ? emails.emails : []).slice(0, 80);
  const jadeTrackerEmail = recentEmails.find(
    (e) =>
      /jade/i.test(e.senderName || "") &&
      /it landscape follow-up/i.test(e.subject || "") &&
      Array.isArray(e.links) &&
      e.links.some((l) => /sharepoint\.com/.test(String(l)))
  );
  const hemaCoverageEmail = recentEmails.find(
    (e) =>
      /hema/i.test(e.senderName || "") &&
      /sophie|manager/i.test(`${e.subject || ""} ${e.bodyPreview || ""}`) &&
      /erp/i.test(`${e.subject || ""} ${e.bodyPreview || ""}`)
  );
  const trinidadDocsEmail = recentEmails.find(
    (e) =>
      /trinidad/i.test(e.senderName || "") &&
      /france p2p/i.test(e.subject || "") &&
      Number(e.attachments?.length || 0) >= 3
  );

  const boardMilestone = (timeline.milestones || []).find((m) =>
    /board/i.test(String(m.id || "")) || /board/i.test(String(m.label || ""))
  );
  const boardDateKnown = Boolean(boardMilestone && boardMilestone.date);

  const promptRows = Array.isArray(focusPrompts.prompts) ? focusPrompts.prompts : [];
  const stalePromptSignals = [];
  for (const p of promptRows) {
    const txt = `${p.prompt || ""} ${p.why || ""}`.toLowerCase();
    if (boardDateKnown && /board/.test(txt) && /(date|when)/.test(txt)) {
      stalePromptSignals.push({
        title: "Today prompts may be asking about already-known board timing",
        why: "Board milestone date is already tracked in timeline (Mar 19) but prompt text references board timing uncertainty.",
        priority: "medium",
        category: "resolved-fact-still-prompted",
      });
    }
    if (/negotiation/.test(txt) && /owner/.test(txt)) {
      stalePromptSignals.push({
        title: "Today prompts may still ask for negotiation ownership",
        why: "Negotiation ownership has been clarified in recent working context (you + Hema).",
        priority: "medium",
        category: "resolved-fact-still-prompted",
      });
    }
  }

  const items = [];
  if (hasErpOverlap && hasManagersOverlap) {
    items.push({
      queueType: "today-content-review",
      source: "today-content-quality-detector",
      category: "conflict-priority-context",
      title: "Concurrent meeting overlap needs explicit resolved framing",
      why: "ERP decision presentation and Managers Forum overlap today; Today page should show ERP priority and suppress unresolved-conflict wording.",
      priority: "high",
      status: "pending-review",
      detectedAt: new Date().toISOString(),
      reviewHint: "Prefer resolved operator guidance (ERP priority) over generic conflict language.",
    });
  }
  if (hemaCoverageEmail && hasErpOverlap && hasManagersOverlap) {
    items.push({
      queueType: "today-content-review",
      source: "today-content-quality-detector",
      category: "email-context-not-applied",
      title: "Today top content should reflect coverage email for missed Managers Forum",
      why: `Recent email from ${hemaCoverageEmail.senderName} suggests Managers Forum coverage/catch-up context exists, so conflict stress should be reduced in operator copy.`,
      priority: "medium",
      status: "pending-review",
      detectedAt: new Date().toISOString(),
      reviewHint: "Use recent email context to downgrade already-covered meeting conflict prompts.",
    });
  }
  const todayTopContentUsesReviewQueue =
    todayPageServerSource.includes("highPriorityTodayContentActions") &&
    todayPageServerSource.includes("mergedPreActions") &&
    todayPageServerSource.includes("mergedAsks");

  if (jadeTrackerEmail && !todayTopContentUsesReviewQueue) {
    items.push({
      queueType: "today-content-review",
      source: "today-content-quality-detector",
      category: "new-evidence-priority",
      title: "Jade sent SharePoint tracker link that should appear in top work queue context",
      why: "This is new integration/feed evidence and is more material than backlog cleanup items for today's system work queue.",
      priority: "high",
      status: "pending-review",
      detectedAt: new Date().toISOString(),
      reviewHint: "Promote new evidence/replies above cleanup queues in Today 'Our Work Queue'.",
    });
  }
  if (trinidadDocsEmail && !todayTopContentUsesReviewQueue) {
    items.push({
      queueType: "today-content-review",
      source: "today-content-quality-detector",
      category: "new-evidence-priority",
      title: "Trinidad P2P documentation arrival should shape Today capture/review priorities",
      why: `Trinidad sent ${Number(trinidadDocsEmail.attachments?.length || 0)} attachment(s) for France P2P fact-finding.`,
      priority: "high",
      status: "pending-review",
      detectedAt: new Date().toISOString(),
      reviewHint: "Prioritize source review and process-flow updates over generic prompts for P2P work.",
    });
  }

  const navOnlyPrompts = promptRows.filter((p) => /nav_governance/i.test(p.source || ""));
  if (navOnlyPrompts.length > 0 && todayMeetingRows.length > 0) {
    items.push({
      queueType: "today-content-review",
      source: "today-content-quality-detector",
      category: "prompt-priority-mismatch",
      title: "Nav-governance prompts may be crowding out operational prompts on active meeting day",
      why: `${navOnlyPrompts.length} nav-governance prompt(s) detected while ${todayMeetingRows.length} meeting(s) are on today's calendar.`,
      priority: "medium",
      status: "pending-review",
      detectedAt: new Date().toISOString(),
      reviewHint: "Prioritize meeting/evidence/reply-driven prompts over navigation prompts during active workdays.",
    });
  }

  for (const s of stalePromptSignals) {
    items.push({
      queueType: "today-content-review",
      source: "today-content-quality-detector",
      category: s.category,
      title: s.title,
      why: s.why,
      priority: s.priority,
      status: "pending-review",
      detectedAt: new Date().toISOString(),
      reviewHint: "Add suppression rule or resolved-fact check to Today prompt generation.",
    });
  }

  // Pillar evidence freshness signal (not a UI issue, but affects Today relevance)
  const baselines = Array.isArray(pillars.baselines) ? pillars.baselines : [];
  const waitingCounts = baselines.map((b) => ({
    pillarId: b.pillarId,
    waiting: Array.isArray(b.waitingOn) ? b.waitingOn.length : 0,
  }));
  const maxWaiting = waitingCounts.sort((a, b) => b.waiting - a.waiting)[0];
  if (maxWaiting && maxWaiting.waiting >= 4) {
    items.push({
      queueType: "today-content-review",
      source: "today-content-quality-detector",
      category: "pillar-waiting-overload",
      title: `Today may need clearer queue separation for waiting-heavy pillar (${maxWaiting.pillarId})`,
      why: `${maxWaiting.waiting} waiting item(s) are tracked on the pillar baseline; top Today content should emphasize new evidence arrivals and next decisions, not all waiting items.`,
      priority: "low",
      status: "pending-review",
      detectedAt: new Date().toISOString(),
      reviewHint: "Keep waiting-state detail in Program; Today should surface only newly changed or urgent waiting items.",
    });
  }

  items.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  const queue = {
    generatedAt: new Date().toISOString(),
    summary: {
      pendingReview: items.length,
      reviewed: 0,
      highPriorityPending: items.filter((i) => i.priority === "high").length,
      byCategory: items.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {}),
    },
    items,
  };

  const backlogTodos = [];
  const todayQueueLooksIntegrated =
    /todayContentReview/.test(todayClientSource) &&
    /Today Content Review/.test(todayClientSource) &&
    todayClientSource.includes("for (const i of brief.workQueue?.todayContentReview.topItems");
  if (queue.summary.highPriorityPending > 0) {
    backlogTodos.push({
      id: "today-content-high-priority-review",
      priority: "high",
      title: "Review high-priority Today content items",
      why: `${queue.summary.highPriorityPending} high-priority Today content issue(s) detected.`,
      nextStep: "Review Today content queue and patch top-of-page source ranking/suppression rules.",
      owner: "Codex",
    });
  }
  if (queue.summary.byCategory["new-evidence-priority"] && !todayQueueLooksIntegrated) {
    backlogTodos.push({
      id: "today-content-new-evidence-ranking",
      priority: "medium",
      title: "Prioritize new evidence/replies over cleanup in Today work queue",
      why: `${queue.summary.byCategory["new-evidence-priority"]} new-evidence priority signal(s) detected.`,
      nextStep: "Add work-queue ranking weights: replies/docs > company-intel review > agent backlog > cleanup.",
      owner: "Codex",
    });
  }
  if (queue.summary.byCategory["resolved-fact-still-prompted"]) {
    backlogTodos.push({
      id: "today-content-resolved-fact-suppression",
      priority: "medium",
      title: "Add resolved-fact suppression rules for Today prompts",
      why: `${queue.summary.byCategory["resolved-fact-still-prompted"]} resolved-fact prompt signal(s) detected.`,
      nextStep: "Check timeline/pillar baselines before surfacing prompt bullets in Today top blocks.",
      owner: "Codex",
    });
  }

  const backlog = {
    generatedAt: new Date().toISOString(),
    detectorState: {
      todayQueueLooksIntegrated,
      todayTopContentUsesReviewQueue,
    },
    summary: {
      openTodos: backlogTodos.length,
      highPriority: backlogTodos.filter((t) => t.priority === "high").length,
      mediumPriority: backlogTodos.filter((t) => t.priority === "medium").length,
      lowPriority: backlogTodos.filter((t) => t.priority === "low").length,
    },
    todos: backlogTodos,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    inputs: {
      todayMeetings: todayMeetingRows.length,
      recentEmailsScanned: recentEmails.length,
      focusPrompts: promptRows.length,
      boardDateKnown: boardDateKnown ? boardMilestone.date : null,
      todayQueueLooksIntegrated,
      todayTopContentUsesReviewQueue,
    },
    detections: queue.summary,
  };

  writeJson(path.join(dataDir, "today_content_review_queue.json"), queue);
  writeJson(path.join(dataDir, "today_content_agent_backlog.json"), backlog);
  writeJson(path.join(tempDir, "today-content-quality-report.json"), report);
  console.log(path.join(tempDir, "today-content-quality-report.json"));
}

main();




