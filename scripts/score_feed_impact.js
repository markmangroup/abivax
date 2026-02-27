/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalize(v) {
  return String(v || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function main() {
  const root = path.resolve(__dirname, "..");
  const tempDir = path.join(root, "temp");
  const dataDir = path.join(root, "data", "abivax");
  const quality = readJson(path.join(tempDir, "person-content-quality-report.json"), { rows: [], issues: [] });
  const redundancy = readJson(path.join(tempDir, "person-profile-redundancy-report.json"), { flaggedPairs: [] });
  const entities = readJson(path.join(dataDir, "entities.json"), { entities: [] }).entities || [];
  const outPath = path.join(tempDir, "feed-impact-report.json");
  fs.mkdirSync(tempDir, { recursive: true });

  const weakPeople = (quality.rows || []).filter((r) => (r.qualityScore || 0) < 75);
  const teamCounts = {};
  for (const p of weakPeople) {
    const key = normalize(p.team || "unknown") || "unknown";
    teamCounts[key] = (teamCounts[key] || 0) + 1;
  }
  const redundancyPairs = redundancy.flaggedPairs || [];

  const systemNames = new Set(
    entities.filter((e) => e.type === "system").map((e) => normalize(e.name))
  );

  const candidates = [
    {
      id: "sharepoint-docs",
      feed: "SharePoint documents/slides",
      currentState: "manual access only",
      likelyImproves: ["Program", "Presentations", "IT people pages (Christophe/Jade/Benjamin)", "Controls/process pages"],
      rationale: [
        "High-value ERP/IT evidence currently lives in decks/docs and is not automatically parsed.",
        "Would improve person specificity by adding role-specific facts from process/roadmap documentation.",
      ],
      effort: "medium",
      impactScore: 0,
    },
    {
      id: "agicap-export",
      feed: "Agicap treasury exports / walkthrough notes",
      currentState: "access granted, no ingestion",
      likelyImproves: ["Treasury/payment flow context", "Program controls view", "Audit deck evidence"],
      rationale: [
        "Would add concrete treasury process detail and reduce generic finance language.",
      ],
      effort: "medium",
      impactScore: 0,
    },
    {
      id: "trustpair-flow",
      feed: "Trustpair process data / evidence",
      currentState: "pending/unclear access",
      likelyImproves: ["P2P controls narrative", "Audit committee controls deck", "System/process specificity"],
      rationale: [
        "Known control/process relevance but currently under-documented in the app.",
      ],
      effort: "medium",
      impactScore: 0,
    },
    {
      id: "teams-graph",
      feed: "Microsoft Graph / Teams org sync",
      currentState: "Outlook GAL already covers most org needs",
      likelyImproves: ["Org canonical accuracy", "Title/department consistency"],
      rationale: [
        "Incremental benefit vs Outlook GAL is lower right now because GAL sync is already working.",
      ],
      effort: "medium-high",
      impactScore: 0,
    },
    {
      id: "market-x-news",
      feed: "IR/news/X market chatter",
      currentState: "manual/Grok summaries",
      likelyImproves: ["Company Intel page", "M&A/market context freshness"],
      rationale: [
        "Useful for company macro context but lower impact on ERP execution pages/person specificity.",
      ],
      effort: "medium",
      impactScore: 0,
    },
  ];

  const weakIT = (teamCounts["it"] || 0);
  const weakFinance = (teamCounts["finance"] || 0) + (teamCounts["fp&a"] || 0) + (teamCounts["p2p"] || 0);
  const crossTeamRedundancy = redundancyPairs.filter((p) => normalize(p.aTeam) !== normalize(p.bTeam)).length;
  const hasTrustpairSystem = systemNames.has("trustpair");
  const hasAgicapSystem = systemNames.has("agicap");

  for (const c of candidates) {
    let score = 0;
    if (c.id === "sharepoint-docs") {
      score += 50 + weakIT * 7 + crossTeamRedundancy * 4;
      score += 10; // immediate board/audit leverage
    }
    if (c.id === "agicap-export") {
      score += (hasAgicapSystem ? 20 : 10) + Math.min(weakFinance * 3, 20);
    }
    if (c.id === "trustpair-flow") {
      score += (hasTrustpairSystem ? 22 : 12) + Math.min(weakFinance * 3, 18);
      score += 8; // controls relevance
    }
    if (c.id === "teams-graph") {
      score += 12; // low incremental value right now
      score -= 6; // Outlook GAL already functioning
    }
    if (c.id === "market-x-news") {
      score += 14; // useful for company intel only
    }
    c.impactScore = score;
  }

  candidates.sort((a, b) => b.impactScore - a.impactScore);
  const recommendations = candidates.map((c, idx) => ({
    rank: idx + 1,
    ...c,
    recommendation:
      idx === 0
        ? "Implement next"
        : idx === 1
          ? "Prototype manually first"
          : "Backlog / revisit after top feeds",
  }));

  writeJson(outPath, {
    generatedAt: new Date().toISOString(),
    inputs: {
      weakPeopleCount: weakPeople.length,
      teamWeaknessCounts: teamCounts,
      redundancyFlaggedPairs: redundancyPairs.length,
      crossTeamRedundancyPairs: crossTeamRedundancy,
    },
    recommendations,
  });

  console.log(`feed impact: candidates=${recommendations.length} top=${recommendations[0]?.id || "none"}`);
}

try {
  main();
} catch (err) {
  console.error(`score_feed_impact failed: ${err?.message || String(err)}`);
  process.exit(1);
}

