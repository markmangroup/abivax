const fs = require("fs");
const path = require("path");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

function normalize(text) {
  return String(text || "").toLowerCase();
}

function topPersonTargets(entities, baselines) {
  const requestCounts = new Map();
  for (const b of baselines || []) {
    for (const r of b.evidenceRequests || []) {
      const sentTo = normalize(r.sentTo);
      for (const e of entities.filter((x) => x.type === "person")) {
        const names = [e.name, ...(e.aliases || [])].map(normalize);
        if (names.some((n) => n && sentTo.includes(n))) {
          const current = requestCounts.get(e.id) || 0;
          requestCounts.set(e.id, current + (String(r.status || "").toLowerCase() === "received" ? 2 : 1));
        }
      }
    }
  }

  return entities
    .filter((e) => e.type === "person")
    .map((e) => ({
      id: e.id,
      name: e.name,
      score: requestCounts.get(e.id) || 0,
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function buildQueue() {
  const root = process.cwd();
  const entities = readJson(path.join(root, "data", "abivax", "entities.json"), { entities: [] }).entities || [];
  const baselines = readJson(path.join(root, "data", "abivax", "erp_pillar_baselines.json"), { baselines: [] }).baselines || [];
  const readabilityQueue = readJson(path.join(root, "data", "abivax", "page_readability_review_queue.json"), { items: [], summary: {} });
  const todayQueue = readJson(path.join(root, "data", "abivax", "today_content_review_queue.json"), { items: [], summary: {} });
  const waterfallReview = readJson(path.join(root, "temp", "swarm-waterfall-review.json"), { summary: {}, tuningTargets: [] });

  const personTargets = topPersonTargets(entities, baselines);

  const items = [];

  items.push({
    id: "claude-writing-stakeholder-briefs-1",
    lane: "writing",
    priority: "high",
    title: "Stakeholder Brief wording/style pass (fact-based operator language)",
    why: "Person pages are improving structurally but still sound machine-like and repetitive to Mike.",
    targets: personTargets.map((p) => p.name),
    files: ["src/app/abivax/spine/entity/[slug]/page.tsx", "data/abivax/erp_pillar_baselines.json", "data/abivax/entities.json"],
    promptHint:
      "Rewrite top-of-page stakeholder brief copy style guidelines and example paragraphs for Mike, Trinidad, Hema using factual operator brief language (no ranking/fluff).",
  });

  items.push({
    id: "claude-design-today-layout-1",
    lane: "design-critique",
    priority: "high",
    title: "Today page post-meeting execution mode readability critique",
    why: "Today is more useful now but still needs better visual clarity and lower cognitive load.",
    targets: ["Today page top area", "Your Day lane", "Our Work Queue / Change Trace"],
    files: ["src/app/abivax/spine/today/TodayBriefClient.tsx", "src/app/abivax/spine/today/page.tsx"],
    promptHint:
      "Critique the top 1-2 screens for post-meeting mode and propose a tighter visual hierarchy without adding new workflow mechanics.",
  });

  items.push({
    id: "claude-design-program-layout-1",
    lane: "design-critique",
    priority: "high",
    title: "Program page visual hierarchy critique (status emphasis and pillar readability)",
    why: "Program is strategically important, but status pills and dense blocks make it hard for Mike to quickly see what changed (for example, received evidence from Trinidad).",
    targets: ["Program page top area", "Pillar workboard", "status pill semantics", "evidence/request visibility"],
    files: [
      "src/app/abivax/spine/program/page.tsx",
      "data/abivax/erp_pillar_baselines.json",
      "collab/claude/MIKE_DESIGN_PREFERENCES.md"
    ],
    promptHint:
      "Critique Program page visual hierarchy and status styling so received/pending/blocked signals are obvious at a glance without adding new workflow mechanics.",
  });

  const readabilitySignals = (readabilityQueue.items || [])
    .filter((i) => String(i.status || "").toLowerCase() === "pending-review")
    .slice(0, 3)
    .map((i) => i.title || "Readability issue");
  items.push({
    id: "claude-design-page-patterns-1",
    lane: "design-critique",
    priority: "medium",
    title: "Cross-page readability pattern proposals (default-view budget + card reduction)",
    why: "Mike consistently flags stacked-card layouts and text-heavy scanning across pages.",
    targets: readabilitySignals,
    files: ["data/abivax/page_section_lifecycle.json", "collab/claude/MIKE_DESIGN_PREFERENCES.md", "src/app/abivax/spine/today/TodayBriefClient.tsx", "src/app/abivax/spine/program/page.tsx", "src/app/abivax/spine/presentations/page.tsx"],
    promptHint:
      "Propose a reusable visual pattern system (not implementation code) for low-noise default views and advanced detail collapses.",
  });

  items.push({
    id: "claude-writing-post-selection-comms-1",
    lane: "writing",
    priority: "medium",
    title: "Post-selection communication templates (Camille/Hema/NetSuite path)",
    why: "NetSuite was selected; next phase needs clear communication and timing language.",
    targets: ["Camille/Aymen follow-up", "internal status summary", "negotiation path alignment"],
    files: ["data/abivax/timeline.json", "data/abivax/erp_pillar_baselines.json", "data/abivax/presentations.json"],
    promptHint:
      "Draft concise, factual post-selection comms templates aligned to early April mobilization target and explicit ownership boundaries.",
  });

  const output = {
    generatedAt: nowIso(),
    purpose: "Claude sidecar queue for writing/design critique lane (non-production pipeline)",
    summary: {
      itemCount: items.length,
      byLane: items.reduce((acc, i) => {
        acc[i.lane] = (acc[i.lane] || 0) + 1;
        return acc;
      }, {}),
      waterfallState: {
        reviewNowCount: Number(waterfallReview.summary?.reviewNowCount || 0),
        tuningTargetCount: Number(waterfallReview.summary?.tuningTargetCount || 0),
      },
    },
    items,
  };

  const outFile = path.join(root, "data", "abivax", "claude_lane_queue.json");
  writeJson(outFile, output);
  const reportFile = path.join(root, "temp", "claude-lane-queue-report.json");
  writeJson(reportFile, { generatedAt: output.generatedAt, itemCount: items.length, outFile });
  console.log(outFile);
}

buildQueue();
