const fs = require("fs");
const path = require("path");

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  } catch {
    return "";
  }
}

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

function countMatches(text, re) {
  const m = text.match(re);
  return m ? m.length : 0;
}

function findLegacyLabels(text, labels) {
  return labels.filter((l) => text.includes(l));
}

function detectPageSignals(page, lifecycleLookup) {
  const text = readText(page.file);
  const sectionCount = countMatches(text, /<section\b/g);
  const detailsCount = countMatches(text, /<details\b/g);
  const advancedGates = countMatches(text, /showAdvanced\s*&&/g);
  const gridCount = countMatches(text, /\bgrid\b/g);
  const legacyLabels = findLegacyLabels(text, page.legacyLabels || []);
  const pageLifecycleEntry = lifecycleLookup.get(page.id) || { sections: new Map(), defaultViewBudget: null };
  const pageLifecycle = pageLifecycleEntry.sections || new Map();
  const defaultViewBudget = Number.isFinite(Number(pageLifecycleEntry.defaultViewBudget))
    ? Number(pageLifecycleEntry.defaultViewBudget)
    : null;
  const lifecycleSections = [...pageLifecycle.values()];
  const defaultLifecycleSections = lifecycleSections.filter((s) => String(s.placement || "") === "default");
  const legacyLifecycle = legacyLabels.map((label) => ({
    label,
    meta: pageLifecycle.get(label) || null,
  }));
  const legacyDefaultOrUnknown = legacyLifecycle.filter(
    (x) => !x.meta || x.meta.placement !== "advanced"
  );
  const legacyDeprecatedCandidates = legacyLifecycle.filter(
    (x) => x.meta && x.meta.status === "deprecated-candidate"
  );

  const signals = [];
  if (!text) {
    signals.push({
      category: "missing-source",
      priority: "high",
      title: `${page.label}: source file missing/unreadable`,
      why: `Could not read ${page.file}`,
      reviewHint: "Fix page path configuration in readability detector.",
    });
    return { text, sectionCount, detailsCount, advancedGates, gridCount, legacyLabels, signals };
  }

  const overRawSectionBudget = sectionCount > (page.maxSections || 10);
  const overDefaultViewBudget = defaultViewBudget !== null && defaultLifecycleSections.length > defaultViewBudget;

  if (overRawSectionBudget) {
    const rawDensityPriority = overDefaultViewBudget
      ? (sectionCount > (page.maxSections || 10) + 4 ? "high" : "medium")
      : "low";
    signals.push({
      category: "layout-density",
      priority: rawDensityPriority,
      title: `${page.label}: high section density`,
      why: `${sectionCount} <section> blocks detected (target <= ${page.maxSections || 10})${defaultViewBudget !== null ? `; default-view lifecycle sections=${defaultLifecycleSections.length} (budget ${defaultViewBudget})` : ""}.`,
      reviewHint: overDefaultViewBudget
        ? "Move low-signal blocks behind Advanced or merge duplicate summary sections."
        : "Raw source density is high, but default-view budget may already be controlled. Review only if readability still feels heavy.",
    });
  }

  if (overDefaultViewBudget) {
    signals.push({
      category: "default-view-budget",
      priority: "medium",
      title: `${page.label}: default-view lifecycle budget exceeded`,
      why: `${defaultLifecycleSections.length} lifecycle sections marked as default (budget ${defaultViewBudget}).`,
      reviewHint: "Demote one or more sections to Advanced or consolidate default sections.",
    });
  }

  if (legacyLabels.length > 0) {
    const allLegacyAdvanced = legacyDefaultOrUnknown.length === 0;
    const legacyPriorityBase = page.id === "today" ? "high" : "medium";
    const legacyPriority = allLegacyAdvanced ? "low" : legacyPriorityBase;
    signals.push({
      category: "legacy-blocks",
      priority: legacyPriority,
      title: allLegacyAdvanced
        ? `${page.label}: advanced-only legacy sections retained in source`
        : `${page.label}: legacy sections still present in source`,
      why: allLegacyAdvanced
        ? `Found advanced-only labels: ${legacyLabels.slice(0, 6).join(", ")}${legacyLabels.length > 6 ? ", ..." : ""}.`
        : `Found labels: ${legacyLabels.slice(0, 6).join(", ")}${legacyLabels.length > 6 ? ", ..." : ""}.`,
      reviewHint:
        legacyDeprecatedCandidates.length > 0
          ? "Some retained labels are deprecated-candidates; review for removal when queues/backlogs replace them."
          : "Confirm which legacy blocks are intentionally retained (Advanced) vs deprecated-candidate.",
    });
  }

  if (page.id === "today" && advancedGates < 3 && sectionCount > 6 && !overDefaultViewBudget) {
    signals.push({
      category: "default-view-budget",
      priority: "low",
      title: "Today: source still contains many sections despite lifecycle budget control",
      why: `${sectionCount} source sections detected with ${advancedGates} explicit showAdvanced gates; lifecycle metadata shows default budget is within target.`,
      reviewHint: "Keep as low-priority readability guardrail unless top-of-page feels cluttered.",
    });
  } else if (page.id === "today" && advancedGates < 3 && sectionCount > 6) {
    signals.push({
      category: "default-view-budget",
      priority: "high",
      title: "Today: weak advanced gating for section count",
      why: `${sectionCount} sections with only ${advancedGates} explicit showAdvanced gates detected.`,
      reviewHint: "Keep default view to operator lane + codex queue; push remaining blocks behind Advanced.",
    });
  }

  if (page.id === "today" && text.includes("Decision Gate")) {
    signals.push({
      category: "machine-language",
      priority: "medium",
      title: "Today: machine taxonomy language still present",
      why: 'Source still contains "Decision Gate" labeling logic.',
      reviewHint: "Replace machine taxonomy labels in default view with human meeting descriptions.",
    });
  }

  if (gridCount < 3 && sectionCount > 6) {
    signals.push({
      category: "visual-structure",
      priority: "low",
      title: `${page.label}: low explicit grid usage for section count`,
      why: `${sectionCount} sections and ${gridCount} grid markers detected.`,
      reviewHint: "Consider stronger visual grouping/layout only after content quality is stable.",
    });
  }

  return {
    text,
    sectionCount,
    detailsCount,
    advancedGates,
    gridCount,
    legacyLabels,
    legacyLifecycle,
    defaultViewBudget,
    defaultLifecycleSectionCount: defaultLifecycleSections.length,
    signals,
  };
}

function main() {
  const root = path.join(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const tempDir = path.join(root, "temp");
  const lifecycle = readJson(path.join(dataDir, "page_section_lifecycle.json"), { pages: [] });
  const lifecyclePages = Array.isArray(lifecycle.pages) ? lifecycle.pages : [];
  const lifecycleLookup = new Map(
    lifecyclePages.map((p) => [
      p.pageId,
      {
        defaultViewBudget: Number.isFinite(Number(p.defaultViewBudget)) ? Number(p.defaultViewBudget) : null,
        sections: new Map((Array.isArray(p.sections) ? p.sections : []).map((s) => [String(s.label || ""), s])),
      },
    ])
  );

  const pages = [
    {
      id: "today",
      label: "Today",
      route: "/abivax/spine/today",
      file: path.join(root, "src", "app", "abivax", "spine", "today", "TodayBriefClient.tsx"),
      maxSections: 8,
      legacyLabels: ["Today At A Glance", "Immediate Prep", "Cross-Page Handoff", "ERP Pillar Focus", "Questions For Mike"],
    },
    {
      id: "program",
      label: "Program",
      route: "/abivax/spine/program",
      file: path.join(root, "src", "app", "abivax", "spine", "program", "page.tsx"),
      maxSections: 12,
      legacyLabels: ["Cross-Pillar Queue", "Operational Detail", "SharePoint Intake"],
    },
    {
      id: "presentations",
      label: "Presentations",
      route: "/abivax/spine/presentations",
      file: path.join(root, "src", "app", "abivax", "spine", "presentations", "page.tsx"),
      maxSections: 12,
      legacyLabels: ["Slide Plan", "Sources and Audit Trail", "Process Visual Assets (Reusable)"],
    },
    {
      id: "company",
      label: "Company Intel",
      route: "/abivax/spine/company",
      file: path.join(root, "src", "app", "abivax", "spine", "company", "page.tsx"),
      maxSections: 12,
      legacyLabels: ["Daily Headline Digest (Pilot)", "Review Queue (Codex)", "Agent Improvement Backlog"],
    },
  ];

  const pageReports = pages.map((page) => {
    const result = detectPageSignals(page, lifecycleLookup);
    return {
      id: page.id,
      label: page.label,
      route: page.route,
      file: path.relative(root, page.file).replace(/\\/g, "/"),
      sectionCount: result.sectionCount,
      detailsCount: result.detailsCount,
      advancedGates: result.advancedGates,
      gridCount: result.gridCount,
      defaultViewBudget: result.defaultViewBudget,
      defaultLifecycleSectionCount: result.defaultLifecycleSectionCount,
      legacyLabelsFound: result.legacyLabels,
      legacyLifecycle: result.legacyLifecycle.map((x) => ({
        label: x.label,
        status: x.meta?.status || "unknown",
        placement: x.meta?.placement || "unknown",
      })),
      signals: result.signals,
    };
  });

  const items = pageReports
    .flatMap((p) =>
      p.signals.map((s, idx) => ({
        queueType: "page-readability-review",
        source: "page-readability-detector",
        category: s.category,
        pageId: p.id,
        route: p.route,
        title: s.title,
        why: s.why,
        priority: s.priority,
        status: "pending-review",
        detectedAt: new Date().toISOString(),
        reviewHint: s.reviewHint,
        reviewedAt: null,
        reviewOutcome: "",
        notes: "",
        _sort: idx,
      }))
    )
    .sort((a, b) => {
      const rank = (p) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
      return rank(a.priority) - rank(b.priority) || a.pageId.localeCompare(b.pageId);
    });

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
      byPage: items.reduce((acc, i) => {
        acc[i.pageId] = (acc[i.pageId] || 0) + 1;
        return acc;
      }, {}),
    },
    items: items.map(({ _sort, ...rest }) => rest),
  };

  const backlogTodos = [];
  const lifecycleConfigured = lifecyclePages.length > 0;
  const unknownLifecycleLabels = pageReports.reduce(
    (acc, p) => acc + (p.legacyLifecycle || []).filter((x) => x.status === "unknown" || x.placement === "unknown").length,
    0
  );
  if (queue.summary.highPriorityPending > 0) {
    backlogTodos.push({
      id: "page-readability-high-priority-review",
      priority: "high",
      title: "Review high-priority page readability items",
      why: `${queue.summary.highPriorityPending} high-priority page readability issue(s) detected.`,
      nextStep: "Review page readability queue and patch default-view section composition before UI polish.",
      owner: "Codex",
    });
  }
  const defaultBudgetSignals = queue.summary.byCategory["default-view-budget"] || 0;
  const mediumOrHigherDensitySignals = items.filter(
    (i) => i.category === "layout-density" && (i.priority === "high" || i.priority === "medium")
  ).length;
  if (defaultBudgetSignals > 0 || mediumOrHigherDensitySignals > 0) {
    backlogTodos.push({
      id: "page-readability-default-view-budget",
      priority: "medium",
      title: "Enforce default-view section budgets",
      why: `${defaultBudgetSignals} default-view budget signal(s) and ${mediumOrHigherDensitySignals} medium/high layout-density signal(s) detected.`,
      nextStep: "Adjust lifecycle placements/budgets or reduce top-level sections on pages that exceed default-view targets.",
      owner: "Codex",
    });
  }
  if ((queue.summary.byCategory["legacy-blocks"] || 0) > 0 && !lifecycleConfigured) {
    backlogTodos.push({
      id: "page-readability-lifecycle-tags",
      priority: "medium",
      title: "Add section lifecycle metadata (active/experimental/deprecated)",
      why: `${queue.summary.byCategory["legacy-blocks"]} legacy-block signal(s) detected in source.`,
      nextStep: "Annotate sections and let detector suppress intentional Advanced-only legacy blocks.",
      owner: "Codex",
    });
  }
  if (lifecycleConfigured && unknownLifecycleLabels > 0) {
    backlogTodos.push({
      id: "page-readability-lifecycle-coverage",
      priority: "low",
      title: "Expand section lifecycle coverage for unlabeled legacy blocks",
      why: `${unknownLifecycleLabels} legacy label(s) found without lifecycle metadata coverage.`,
      nextStep: "Add missing labels/placements/statuses to page_section_lifecycle.json so readability signals stay high-precision.",
      owner: "Codex",
    });
  }

  const backlog = {
    generatedAt: new Date().toISOString(),
    detectorState: {
      lifecycleConfigured,
      lifecyclePages: lifecyclePages.length,
      unknownLifecycleLabels,
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
    pages: pageReports,
    queueSummary: queue.summary,
    backlogSummary: backlog.summary,
  };

  writeJson(path.join(dataDir, "page_readability_review_queue.json"), queue);
  writeJson(path.join(dataDir, "page_readability_agent_backlog.json"), backlog);
  writeJson(path.join(tempDir, "page-readability-report.json"), report);
  console.log(path.join(tempDir, "page-readability-report.json"));
}

main();
