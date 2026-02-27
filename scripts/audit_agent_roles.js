/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function writeJson(p, v) {
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8");
}

function main() {
  const root = path.resolve(__dirname, "..");
  const swarmPath = path.join(root, "scripts", "run_agent_swarm.ps1");
  const pkgPath = path.join(root, "package.json");
  const outPath = path.join(root, "temp", "agent-role-audit.json");

  const swarmText = readText(swarmPath);
  const pkg = JSON.parse(readText(pkgPath));
  const scripts = pkg.scripts || {};

  const stepMatches = [...swarmText.matchAll(/@\{\s*id = "([^"]+)";\s*label = "([^"]+)";\s*cmd = "([^"]+)"/g)];
  const rows = stepMatches.map((m) => ({ id: m[1], label: m[2], command: m[3] }));

  const deterministicHints = [
    "sync",
    "merge",
    "dedupe",
    "reconcile",
    "link",
    "build_cfti",
    "process_flow",
    "verify",
    "seed",
    "export",
    "intake",
  ];
  const queueHints = ["company_intel_queue", "focus_prompts"];
  const detectorHints = ["specificity", "relevance", "redundancy", "quality", "feed_impact", "nav_governance", "agent_backlog"];
  const wikiSensitive = ["entity_profiles", "wiki_specificity", "person_quality", "person_redundancy", "person_relevance", "people_canonical", "notes_linking", "meeting_attendee_seed", "org_graph_merge", "org_graph_sync", "people_dedupe"];
  const deterministicOverrides = new Set([
    "people_canonical",
    "entity_profiles",
    "notes_linking",
    "org_graph_merge",
    "people_dedupe",
    "cfti_control_register",
    "sharepoint_ingest",
    "sharepoint_content",
    "email_context",
  ]);

  const audited = rows.map((r) => {
    const key = `${r.id} ${r.label} ${r.command}`.toLowerCase();
    let mode = "deterministic-autonomous";
    let rationale = "Deterministic sync/transform/check step.";

    if (deterministicOverrides.has(r.id)) {
      mode = "deterministic-autonomous";
      rationale = "Explicitly classified deterministic pipeline step (writes canonical/derived data with bounded transforms).";
    } else if (queueHints.some((h) => key.includes(h.replace(/_/g, " "))) || key.includes("company intel review queue")) {
      mode = "queue-first";
      rationale = "Should detect/queue; Codex should interpret significance.";
    } else if (detectorHints.some((h) => key.includes(h.replace(/_/g, " ")))) {
      mode = "detector-watchlist";
      rationale = "Produces monitoring/quality signals; should not auto-rewrite meaning.";
    } else if (!deterministicHints.some((h) => key.includes(h))) {
      mode = "review-scope";
      rationale = "Needs manual classification; command purpose not obviously deterministic.";
    }

    const touchesWiki = wikiSensitive.includes(r.id);
    const priority =
      touchesWiki ? "high" : mode === "review-scope" ? "medium" : mode === "queue-first" ? "medium" : "low";

    return {
      ...r,
      mode,
      priority,
      touchesWiki,
      rationale,
      suggestedAction:
        mode === "queue-first"
          ? "Keep queue-focused; rely on Codex review for integration."
          : mode === "detector-watchlist"
            ? "Keep as detector; do not let this script mutate canonical strategy objects."
            : mode === "review-scope"
              ? "Review and narrow script scope or reclassify."
              : "Keep autonomous.",
    };
  });

  const summary = {
    total: audited.length,
    byMode: audited.reduce((acc, r) => {
      acc[r.mode] = (acc[r.mode] || 0) + 1;
      return acc;
    }, {}),
    wikiTouching: audited.filter((r) => r.touchesWiki).length,
    highPriority: audited.filter((r) => r.priority === "high").length,
  };

  const recommendations = [
    "Keep entity profile generation autonomous but entity-type-specific (systems already improved; continue for people/orgs).",
    "Keep wiki specificity/relevance/redundancy agents as detectors/watchlists only.",
    "Use queue-first pattern for company intel and other ambiguous content ingestion where significance judgment matters.",
    "Review any future wiki-writing agents against this audit before allowing autonomous semantic rewrites.",
  ];

  writeJson(outPath, {
    generatedAt: new Date().toISOString(),
    summary,
    recommendations,
    rows: audited,
    packageScriptsCount: Object.keys(scripts).length,
  });
  console.log(`agent role audit: total=${summary.total} wikiTouching=${summary.wikiTouching} -> temp/agent-role-audit.json`);
}

try {
  main();
} catch (err) {
  console.error(`audit_agent_roles failed: ${err?.message || String(err)}`);
  process.exit(1);
}
