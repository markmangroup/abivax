import fs from "fs";
import path from "path";
import { SystemMapClient } from "./SystemMapClient";

export const dynamic = "force-dynamic";

type AgentStep = { id: string; label: string; status: string; startedAt: string; finishedAt: string; outputPreview: string };
type AgentStatus = { generatedAt: string; overallStatus: string; results: AgentStep[] };
type OrgSyncStatus = { generatedAt: string; status: string; mode: string; userCount: number; message: string };
type SharePointArtifactsStatus = { generatedAt?: string | null; summary?: { artifactCount?: number; localAttachmentMatches?: number } };
type SharePointContentStatus = { generatedAt?: string | null; summary?: { artifactsWithLocalFiles?: number; artifactsWithParsedText?: number; parseFailures?: number } };
type SharePointGraphSyncStatus = { generatedAt?: string | null; status?: string; mode?: string; candidateSites?: number; resolvedSites?: number; message?: string };
type NodeKind = "external" | "job" | "data" | "agent" | "page" | "output" | "planned";
type SystemNode = { id: string; label: string; kind: NodeKind; x: number; y: number; cadence?: string; sourceFile?: string; status?: "ok" | "warn" | "stale" | "planned"; note?: string };
type SystemEdge = { from: string; to: string; relation: "reads" | "writes" | "feeds" | "triggers" | "depends" };

function readJson<T>(relPath: string): T | null {
  const p = path.join(process.cwd(), relPath);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")) as T; } catch { return null; }
}
function minutesSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((Date.now() - t) / 60000);
}
function statusBadgeClasses(status: string): string {
  if (status.includes("ok")) return "border-emerald-700/40 bg-emerald-900/20 text-emerald-200";
  if (status.includes("skip")) return "border-cyan-700/40 bg-cyan-900/20 text-cyan-200";
  if (status.includes("warn") || status.includes("stale")) return "border-amber-700/40 bg-amber-900/20 text-amber-200";
  if (status.includes("fail") || status.includes("error")) return "border-rose-700/40 bg-rose-900/20 text-rose-200";
  if (status.includes("planned")) return "border-slate-600 bg-slate-800/70 text-slate-300";
  return "border-slate-700 bg-slate-900 text-slate-300";
}
function nodeClasses(kind: NodeKind): string {
  if (kind === "external") return "fill-cyan-950/60 stroke-cyan-500/40";
  if (kind === "job") return "fill-amber-950/50 stroke-amber-500/40";
  if (kind === "data") return "fill-emerald-950/50 stroke-emerald-500/40";
  if (kind === "agent") return "fill-violet-950/50 stroke-violet-500/40";
  if (kind === "page") return "fill-blue-950/50 stroke-blue-500/40";
  if (kind === "output") return "fill-rose-950/40 stroke-rose-500/40";
  return "fill-slate-900/70 stroke-slate-600/60";
}
function lineColor(rel: SystemEdge["relation"]): string {
  if (rel === "writes") return "stroke-emerald-500/50";
  if (rel === "reads") return "stroke-cyan-500/50";
  if (rel === "triggers") return "stroke-amber-500/50";
  if (rel === "feeds") return "stroke-blue-500/50";
  return "stroke-slate-500/50";
}

function buildSystemMap(
  agentStatus: AgentStatus | null,
  orgSync: OrgSyncStatus | null,
  sharepointArtifacts: SharePointArtifactsStatus | null,
  sharepointContent: SharePointContentStatus | null,
  sharepointGraphSync: SharePointGraphSyncStatus | null
) {
  const agentById = new Map((agentStatus?.results || []).map((r) => [r.id, r]));
  const swarmAge = minutesSince(agentStatus?.generatedAt);
  const orgAge = minutesSince(orgSync?.generatedAt);
  const sharepointCount = Number(sharepointArtifacts?.summary?.artifactCount || 0);
  const sharepointLocal = Number(sharepointArtifacts?.summary?.localAttachmentMatches || 0);
  const sharepointParsed = Number(sharepointContent?.summary?.artifactsWithParsedText || 0);
  const sharepointResolvedSites = Number(sharepointGraphSync?.resolvedSites || 0);
  const sharepointGraphConfigured = String(sharepointGraphSync?.status || "") === "ok";
  const hasSharepointIngest = sharepointCount > 0;
  const nodes: SystemNode[] = [
    { id: "outlook-cal", label: "Outlook Calendar", kind: "external", x: 40, y: 50, cadence: "10-15m (workday)", status: "ok" },
    { id: "outlook-mail", label: "Outlook Email", kind: "external", x: 40, y: 125, cadence: "10-15m (workday)", status: "ok" },
    { id: "outlook-gal", label: "Outlook Org / GAL", kind: "external", x: 40, y: 200, cadence: "2-4h (cached)", status: orgSync?.status === "ok" || orgSync?.status === "skipped-fresh-cache" ? "ok" : "warn", note: orgSync ? `${orgSync.mode} | ${orgSync.userCount} users` : "No org sync status yet" },
    { id: "sync-cal", label: "Calendar Sync", kind: "job", x: 250, y: 50, cadence: "swarm", status: agentById.get("calendar_sync")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/sync_todays_calendar.ps1" },
    { id: "sync-mail", label: "Email Scan", kind: "job", x: 250, y: 125, cadence: "swarm", status: agentById.get("email_context")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/export_recent_emails.ps1" },
    { id: "sync-org", label: "Org Sync", kind: "job", x: 250, y: 200, cadence: "swarm (4h cache)", status: agentById.get("org_graph_sync")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/sync_org_graph.ps1" },
    { id: "sync-sharepoint-graph", label: "SharePoint Graph Sync", kind: "job", x: 250, y: 275, cadence: "swarm (direct)", status: agentById.get("sharepoint_graph_sync")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/sync_sharepoint_graph.ps1", note: sharepointGraphSync ? `${sharepointGraphSync.status} | ${sharepointResolvedSites} sites resolved` : "No graph sync status yet" },
    { id: "sync-sharepoint", label: "SharePoint Link Ingest", kind: "job", x: 250, y: 345, cadence: "swarm (email-driven fallback)", status: agentById.get("sharepoint_ingest")?.status === "ok" ? "ok" : (hasSharepointIngest ? "ok" : "warn"), sourceFile: "scripts/ingest_sharepoint_artifacts.js" },
    { id: "sync-sharepoint-content", label: "SharePoint Content Import", kind: "job", x: 250, y: 415, cadence: "swarm (local evidence cache)", status: agentById.get("sharepoint_content")?.status === "ok" ? "ok" : (sharepointParsed > 0 ? "ok" : "warn"), sourceFile: "scripts/process_sharepoint_local_content.js" },
    { id: "meetings-json", label: "meetings.json", kind: "data", x: 470, y: 50, status: "ok", sourceFile: "data/abivax/meetings.json" },
    { id: "notes-json", label: "notes.json", kind: "data", x: 470, y: 125, status: "ok", sourceFile: "data/abivax/notes.json" },
    { id: "org-json", label: "org_graph.json", kind: "data", x: 470, y: 200, status: orgSync?.status === "ok" || orgSync?.status === "skipped-fresh-cache" ? "ok" : "warn", sourceFile: "data/abivax/org_graph.json" },
    { id: "entities-json", label: "entities.json", kind: "data", x: 470, y: 275, status: "ok", sourceFile: "data/abivax/entities.json" },
    { id: "profiles-json", label: "entity_profiles.json", kind: "data", x: 470, y: 350, status: "ok", sourceFile: "data/abivax/entity_profiles.json" },
    { id: "sharepoint-remote-index-json", label: "sharepoint_remote_index.json", kind: "data", x: 470, y: 500, status: sharepointGraphConfigured ? "ok" : "warn", sourceFile: "data/abivax/sharepoint_remote_index.json", note: sharepointGraphSync ? `${sharepointGraphSync.status} | ${Number(sharepointGraphSync.candidateSites || 0)} candidate sites` : "No graph sync status yet" },
    { id: "sharepoint-content-json", label: "sharepoint_artifact_content.json", kind: "data", x: 470, y: 575, status: sharepointParsed > 0 ? "ok" : "warn", sourceFile: "data/abivax/sharepoint_artifact_content.json", note: `${sharepointParsed} parsed text | ${Number(sharepointContent?.summary?.parseFailures || 0)} parse failures` },
    { id: "sharepoint-json", label: "sharepoint_artifacts.json", kind: "data", x: 470, y: 650, status: hasSharepointIngest ? "ok" : "warn", sourceFile: "data/abivax/sharepoint_artifacts.json", note: hasSharepointIngest ? `${sharepointCount} artifacts | ${sharepointLocal} local matches` : "No SharePoint artifacts ingested yet" },
    { id: "prompts-json", label: "operator-focus-prompts.json", kind: "data", x: 470, y: 425, status: "ok", sourceFile: "temp/operator-focus-prompts.json" },
    { id: "org-merge", label: "Org Merge", kind: "agent", x: 700, y: 220, cadence: "swarm", status: agentById.get("org_graph_merge")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/merge_org_graph_into_entities.js" },
    { id: "people-dedupe", label: "People Dedupe", kind: "agent", x: 700, y: 285, cadence: "swarm", status: agentById.get("people_dedupe")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/reconcile_duplicate_people.js" },
    { id: "people-canonical", label: "People Canonical", kind: "agent", x: 700, y: 350, cadence: "swarm", status: agentById.get("people_canonical")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/reconcile_people_entities.js" },
    { id: "entity-build", label: "Entity Profiles Build", kind: "agent", x: 700, y: 415, cadence: "swarm", status: agentById.get("entity_profiles")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/build_entity_profiles.js" },
    { id: "focus-agent", label: "Focus Prompts", kind: "agent", x: 700, y: 480, cadence: "swarm", status: agentById.get("focus_prompts")?.status === "ok" ? "ok" : "warn", sourceFile: "scripts/generate_operator_focus_prompts.js" },
    { id: "today-page", label: "Today", kind: "page", x: 940, y: 90, status: swarmAge !== null && swarmAge > 120 ? "stale" : "ok" },
    { id: "agents-page", label: "Agents", kind: "page", x: 940, y: 165, status: "ok" },
    { id: "program-page", label: "Program", kind: "page", x: 940, y: 240, status: "ok" },
    { id: "wiki-page", label: "Wiki / Entity", kind: "page", x: 940, y: 315, status: "ok" },
    { id: "present-page", label: "Presentations", kind: "page", x: 940, y: 390, status: "ok" },
    { id: "pptx", label: "PPTX Decks", kind: "output", x: 1155, y: 390, status: agentById.get("presentations_build")?.status === "ok" ? "ok" : "warn" },
    { id: "sharepoint", label: hasSharepointIngest ? "SharePoint (email-driven active)" : "SharePoint (pending direct sync)", kind: hasSharepointIngest ? "external" : "planned", x: 40, y: 305, cadence: sharepointGraphConfigured ? "direct graph + fallback" : "email-driven fallback", status: hasSharepointIngest ? "ok" : "planned", note: sharepointGraphConfigured ? `Graph sync configured (${sharepointResolvedSites} sites resolved)` : (hasSharepointIngest ? `${sharepointCount} artifacts from email-linked evidence` : "Access granted; direct sync auth not configured yet") },
    { id: "agicap", label: "Agicap (planned)", kind: "planned", x: 40, y: 390, cadence: "api/exports pending access", status: "planned", note: "Access granted; walkthrough pending" },
    { id: "trustpair", label: "Trustpair (planned)", kind: "planned", x: 40, y: 475, cadence: "api/exports pending access", status: "planned" },
  ];
  const edges: SystemEdge[] = [
    { from: "outlook-cal", to: "sync-cal", relation: "feeds" }, { from: "outlook-mail", to: "sync-mail", relation: "feeds" }, { from: "outlook-gal", to: "sync-org", relation: "feeds" },
    { from: "sharepoint", to: "sync-sharepoint-graph", relation: "feeds" },
    { from: "sharepoint", to: "sync-sharepoint", relation: "feeds" },
    { from: "sync-cal", to: "meetings-json", relation: "writes" }, { from: "sync-mail", to: "notes-json", relation: "feeds" }, { from: "sync-org", to: "org-json", relation: "writes" },
    { from: "sync-sharepoint-graph", to: "sharepoint-remote-index-json", relation: "writes" },
    { from: "sync-sharepoint", to: "sharepoint-json", relation: "writes" },
    { from: "sharepoint-json", to: "sync-sharepoint-content", relation: "reads" },
    { from: "sync-sharepoint-content", to: "sharepoint-content-json", relation: "writes" },
    { from: "org-json", to: "org-merge", relation: "reads" }, { from: "entities-json", to: "org-merge", relation: "reads" }, { from: "org-merge", to: "entities-json", relation: "writes" },
    { from: "entities-json", to: "people-dedupe", relation: "reads" }, { from: "people-dedupe", to: "entities-json", relation: "writes" }, { from: "people-dedupe", to: "profiles-json", relation: "writes" },
    { from: "entities-json", to: "people-canonical", relation: "reads" }, { from: "people-canonical", to: "entities-json", relation: "writes" },
    { from: "notes-json", to: "entity-build", relation: "reads" }, { from: "entities-json", to: "entity-build", relation: "reads" }, { from: "entity-build", to: "profiles-json", relation: "writes" },
    { from: "entities-json", to: "focus-agent", relation: "reads" }, { from: "focus-agent", to: "prompts-json", relation: "writes" },
    { from: "meetings-json", to: "today-page", relation: "reads" }, { from: "prompts-json", to: "today-page", relation: "reads" }, { from: "entities-json", to: "today-page", relation: "reads" },
    { from: "prompts-json", to: "agents-page", relation: "reads" }, { from: "profiles-json", to: "wiki-page", relation: "reads" }, { from: "entities-json", to: "wiki-page", relation: "reads" },
    { from: "notes-json", to: "program-page", relation: "reads" }, { from: "meetings-json", to: "program-page", relation: "reads" }, { from: "sharepoint-json", to: "program-page", relation: "reads" }, { from: "sharepoint-content-json", to: "program-page", relation: "reads" }, { from: "present-page", to: "pptx", relation: "feeds" },
  ];
  return { nodes, edges, swarmAgeMinutes: swarmAge, orgAgeMinutes: orgAge, swarmStatus: agentStatus?.overallStatus || "unknown" };
}

export default function SystemMapPage() {
  const agentStatus = readJson<AgentStatus>("temp/agent-swarm-status.json");
  const orgSync = readJson<OrgSyncStatus>("temp/org-graph-sync-status.json");
  const sharepointArtifacts = readJson<SharePointArtifactsStatus>("data/abivax/sharepoint_artifacts.json");
  const sharepointContent = readJson<SharePointContentStatus>("data/abivax/sharepoint_artifact_content.json");
  const sharepointGraphSync = readJson<SharePointGraphSyncStatus>("temp/sharepoint-graph-sync-status.json");
  const focusPrompts = readJson<{ promptCount: number }>("temp/operator-focus-prompts.json");
  const peopleReport = readJson<{ unresolved: Array<{ id: string; name: string; issue: string }> }>("temp/people-canonical-report.json");
  const duplicateReport = readJson<{ duplicateGroups: number; redirects: Record<string, string> }>("temp/duplicate-people-report.json");
  const personQuality = readJson<{
    averageQualityScore: number;
    weakestPeople: Array<{ entityId: string; name: string; team: string; qualityScore: number; anchorHits: number; genericHeavyLines: number }>;
    issues: Array<{ id: string; severity: string; issue: string; why: string }>;
  }>("temp/person-content-quality-report.json");
  const personRedundancy = readJson<{
    flaggedCount: number;
    flaggedPairs: Array<{ aId: string; aName: string; aTeam: string; bId: string; bName: string; bTeam: string; similarity: number; severity: string; overlapExamples: string[] }>;
  }>("temp/person-profile-redundancy-report.json");
  const personRelevance = readJson<{
    flaggedCount: number;
    topMismatches: Array<{ entityId: string; name: string; team: string; role: string; mismatchScore: number; actionLikeLines: number; broadProgramLines: number; selfFactLines: number; examples: string[] }>;
  }>("temp/person-relevance-mismatch-report.json");
  const feedImpact = readJson<{
    recommendations: Array<{ rank: number; id: string; feed: string; currentState: string; impactScore: number; recommendation: string; likelyImproves: string[] }>;
  }>("temp/feed-impact-report.json");
  const map = buildSystemMap(agentStatus, orgSync, sharepointArtifacts, sharepointContent, sharepointGraphSync);
  const externalNodes = map.nodes.filter((n) => n.kind === "external" || n.kind === "planned");
  const automationNodes = map.nodes.filter((n) => n.kind === "job" || n.kind === "agent");
  const pageNodes = map.nodes.filter((n) => n.kind === "page" || n.kind === "output");
  const staleSignals = [
    map.swarmAgeMinutes !== null && map.swarmAgeMinutes > 120 ? `Swarm status is ${map.swarmAgeMinutes} min old.` : null,
    orgSync && orgSync.status !== "ok" && orgSync.status !== "skipped-fresh-cache" ? `Org sync status is ${orgSync.status}.` : null,
  ].filter(Boolean) as string[];
  const manualQueue = map.nodes
    .filter((n) => n.kind === "planned")
    .map((n) => ({
      id: n.id,
      label: n.label,
      note: n.note || "No implementation path defined yet.",
      nextAction:
        n.id === "sharepoint"
          ? "Configure Microsoft Graph token/scopes for direct SharePoint sync; keep email-driven fallback for continuity."
          : n.id === "agicap"
            ? "Capture treasury walkthrough outputs and normalize system/process notes."
            : n.id === "trustpair"
              ? "Confirm access, document control flow, then evaluate ingestion options."
              : "Define ingestion pattern and owner.",
      priority:
        n.id === "sharepoint" ? "high" : n.id === "trustpair" ? "medium" : "medium",
    }));
  const pageInterconnectivity = [
    {
      page: "Today",
      strengths: "Strong upstream from meetings + prompts; best operator page today.",
      gaps: "Still mostly one-way consumption; fewer direct handoffs into Program/Presentations.",
      next: "Add one-click 'Promote to Program issue' and 'Promote to Deck data request'.",
    },
    {
      page: "Program",
      strengths: "Good merged execution view (timeline/budget/blockers).",
      gaps: "Needs stronger links back to source notes/owners and more direct page handoffs.",
      next: "Add source links per row and route buttons to related entities/notes.",
    },
    {
      page: "Presentations",
      strengths: "Converts context to outputs and is already high-value.",
      gaps: "Could show stronger traceability links back to Today/Program open items.",
      next: "Add 'feeds from' references (notes, meetings, open loops) on deck/workspace cards.",
    },
    {
      page: "Agents",
      strengths: "Good system health and prompt visibility.",
      gaps: "Mostly diagnostic; can be more actionable for Mike.",
      next: "Add direct 'fix path' links from agent findings to relevant pages/files.",
    },
  ];
  const schedulerStatus = {
    currentMode: "Manual swarm command",
    currentCommand: "npm run agents:swarm",
    automationCoverage: "Semi-automated logic, manually triggered",
    nextMove: "Add timed workday runner with fast/medium/heavy tiers and visible last-run per tier.",
  };
  const topRedundancy = (personRedundancy?.flaggedPairs || []).slice(0, 5);
  const topFeedRecommendations = (feedImpact?.recommendations || []).slice(0, 4);
  const grid = { left: 20, top: 20, w: 1230, h: 560 };
  const xScale = (x: number) => grid.left + x;
  const yScale = (y: number) => grid.top + y;
  const nodeById = new Map(map.nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-6">
      <header className="space-y-2"><h1 className="text-xl font-semibold text-slate-100">System Map</h1><p className="text-sm text-slate-400">Source to sync job to canonical data to agent to page/output map. This is the operating-system map for the app.</p></header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Swarm Status</p><div className="mt-2 flex items-center justify-between gap-2"><span className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wider ${statusBadgeClasses(map.swarmStatus)}`}>{map.swarmStatus}</span><span className="text-xs text-slate-400">{map.swarmAgeMinutes === null ? "unknown age" : `${map.swarmAgeMinutes} min ago`}</span></div><p className="mt-2 text-xs text-slate-500">Last run: {agentStatus?.generatedAt ? new Date(agentStatus.generatedAt).toLocaleString() : "n/a"}</p></div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">External Feeds</p><p className="mt-2 text-2xl font-semibold text-slate-100">{externalNodes.length}</p><p className="mt-1 text-xs text-slate-400">{externalNodes.filter((n) => n.kind === "planned").length} planned / not automated</p></div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Automation Nodes</p><p className="mt-2 text-2xl font-semibold text-slate-100">{automationNodes.length}</p><p className="mt-1 text-xs text-slate-400">{automationNodes.filter((n) => n.status === "ok").length} healthy right now</p></div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Open Human Clarifications</p><p className="mt-2 text-2xl font-semibold text-slate-100">{focusPrompts?.promptCount ?? 0}</p><p className="mt-1 text-xs text-slate-400">People unresolved: {peopleReport?.unresolved?.length ?? 0}</p></div>
      </section>

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
        <div className="mb-3 flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold text-slate-100">Mike Mode Summary</h2><p className="text-xs text-slate-400">What updates the app, how often, and what is still manual.</p></div><span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadgeClasses(orgSync?.status || "unknown")}`}>Org Sync: {orgSync?.status || "unknown"}</span></div>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="rounded border border-slate-700/50 bg-slate-950/30 px-3 py-2">Today depends primarily on meetings, entities, and operator focus prompts.</li>
          <li className="rounded border border-slate-700/50 bg-slate-950/30 px-3 py-2">Outlook is currently the only automated external feed family (calendar, email, org/GAL).</li>
          <li className="rounded border border-slate-700/50 bg-slate-950/30 px-3 py-2">Org reporting lines are auto-maintained via Outlook GAL, then cleaned by People Dedupe plus People Canonical agents.</li>
          <li className="rounded border border-slate-700/50 bg-slate-950/30 px-3 py-2">SharePoint now has automated email-driven ingestion and content parsing; direct Graph sync is the next upgrade for full automation.</li>
          {staleSignals.map((s) => <li key={s} className="rounded border border-amber-700/30 bg-amber-950/20 px-3 py-2 text-amber-200">{s}</li>)}
        </ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Manual Work Queue (Highest Leverage)</h2>
            <p className="text-xs text-slate-400">
              These are manual/external inputs not yet connected. Converting them reduces repetitive prompting and improves page quality.
            </p>
          </div>
          <div className="space-y-2">
            {manualQueue.map((item) => (
              <div key={item.id} className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100">{item.label}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${item.priority === "high" ? "border-cyan-700/40 bg-cyan-900/20 text-cyan-200" : "border-slate-600 bg-slate-800/70 text-slate-300"}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{item.note}</p>
                <p className="mt-2 text-xs text-slate-300">
                  <span className="text-slate-500">Next automation step:</span> {item.nextAction}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Automation and Scheduler Status</h2>
            <p className="text-xs text-slate-400">What runs today, what is still manual, and the clean next step for automation.</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Current Mode</p>
              <p className="mt-1 font-medium text-slate-100">{schedulerStatus.currentMode}</p>
            </div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Run Command</p>
              <code className="mt-1 block text-xs text-slate-200">{schedulerStatus.currentCommand}</code>
            </div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Coverage</p>
              <p className="mt-1 text-xs text-slate-300">{schedulerStatus.automationCoverage}</p>
            </div>
            <div className="rounded border border-cyan-800/30 bg-cyan-950/15 p-3">
              <p className="text-xs uppercase tracking-wider text-cyan-300">Next Move</p>
              <p className="mt-1 text-xs text-slate-200">{schedulerStatus.nextMove}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-violet-700/20 bg-violet-950/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-violet-200">Semantic Quality Overlay</h2>
            <p className="text-xs text-slate-400">
              This is the layer that catches “content is connected but not useful enough” (generic/redundant person pages).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-violet-700/30 bg-violet-950/20 px-2 py-0.5 text-violet-200">
              Avg quality: {personQuality?.averageQualityScore ?? "n/a"}
            </span>
            <span className="rounded-full border border-violet-700/30 bg-violet-950/20 px-2 py-0.5 text-violet-200">
              Redundancy pairs: {personRedundancy?.flaggedCount ?? "n/a"}
            </span>
            <span className="rounded-full border border-violet-700/30 bg-violet-950/20 px-2 py-0.5 text-violet-200">
              Relevance mismatches: {personRelevance?.flaggedCount ?? "n/a"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Weak Person Pages (semantic)</p>
            <div className="mt-2 space-y-2">
              {(personQuality?.weakestPeople || []).slice(0, 5).map((p) => (
                <div key={p.entityId} className="rounded border border-slate-700/40 bg-slate-900/40 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-100">{p.name}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${p.qualityScore < 70 ? "border-amber-700/40 bg-amber-900/20 text-amber-200" : "border-slate-600 bg-slate-800/70 text-slate-300"}`}>
                      score {p.qualityScore}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    team={p.team || "unknown"} | anchorHits={p.anchorHits} | genericHeavyLines={p.genericHeavyLines}
                  </p>
                </div>
              ))}
              {(personQuality?.weakestPeople || []).length === 0 ? (
                <p className="text-xs text-slate-500">No weak person pages detected yet.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Redundancy Watchlist</p>
            <div className="mt-2 space-y-2">
              {topRedundancy.map((pair) => (
                <div key={`${pair.aId}-${pair.bId}`} className="rounded border border-slate-700/40 bg-slate-900/40 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-100">
                      {pair.aName} vs {pair.bName}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pair.severity === "high" ? "border-rose-700/40 bg-rose-900/20 text-rose-200" : "border-amber-700/40 bg-amber-900/20 text-amber-200"}`}>
                      sim {pair.similarity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {pair.aTeam || "unknown"} vs {pair.bTeam || "unknown"}
                  </p>
                  {pair.overlapExamples?.[0] ? (
                    <p className="mt-1 text-[11px] text-slate-300">
                      Example overlap: {pair.overlapExamples[0]}
                    </p>
                  ) : null}
                </div>
              ))}
              {topRedundancy.length === 0 ? (
                <p className="text-xs text-slate-500">No significant redundancy flagged.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Relevance Mismatch Watchlist</p>
            <div className="mt-2 space-y-2">
              {(personRelevance?.topMismatches || []).slice(0, 5).map((p) => (
                <div key={p.entityId} className="rounded border border-slate-700/40 bg-slate-900/40 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-100">{p.name}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${p.mismatchScore >= 70 ? "border-rose-700/40 bg-rose-900/20 text-rose-200" : "border-amber-700/40 bg-amber-900/20 text-amber-200"}`}>
                      mismatch {p.mismatchScore}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {p.team || "unknown"} | action={p.actionLikeLines} | broad={p.broadProgramLines} | selfFact={p.selfFactLines}
                  </p>
                  {p.examples?.[0] ? <p className="mt-1 text-[11px] text-slate-300">Example: {p.examples[0]}</p> : null}
                </div>
              ))}
              {(personRelevance?.topMismatches || []).length === 0 ? (
                <p className="text-xs text-slate-500">No relevance mismatches flagged yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <details className="group rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
        <summary className="mb-0 cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Flow Graph</h2>
              <p className="text-xs text-slate-400">Read left to right: external sources to ingestion to canonical data to agents to pages/outputs.</p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300 group-open:hidden">collapsed</span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300 hidden group-open:inline">expanded</span>
          </div>
        </summary>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950/40 p-2">
          <svg viewBox={`0 0 ${grid.w + 40} ${grid.h + 40}`} className="h-[38rem] min-w-[76rem] w-full">
            <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" className="fill-slate-500/60" /></marker></defs>
            {Array.from({ length: 6 }).map((_, i) => <line key={`v-${i}`} x1={grid.left + i * 220} y1={grid.top} x2={grid.left + i * 220} y2={grid.top + grid.h} className="stroke-slate-800/50" strokeDasharray="4 6" />)}
            {Array.from({ length: 7 }).map((_, i) => <line key={`h-${i}`} x1={grid.left} y1={grid.top + i * 80} x2={grid.left + grid.w} y2={grid.top + i * 80} className="stroke-slate-800/40" strokeDasharray="3 8" />)}
            {map.edges.map((e, i) => { const a=nodeById.get(e.from); const b=nodeById.get(e.to); if(!a||!b) return null; const x1=xScale(a.x)+165; const y1=yScale(a.y)+22; const x2=xScale(b.x); const y2=yScale(b.y)+22; return <g key={`${e.from}-${e.to}-${i}`}><line x1={x1} y1={y1} x2={x2} y2={y2} className={lineColor(e.relation)} strokeWidth="1.5" markerEnd="url(#arrow)" /><text x={(x1+x2)/2} y={(y1+y2)/2-4} textAnchor="middle" className="fill-slate-500 text-[9px]">{e.relation}</text></g>; })}
            {map.nodes.map((n) => <g key={n.id} transform={`translate(${xScale(n.x)}, ${yScale(n.y)})`}><rect x={0} y={0} rx={8} ry={8} width={165} height={44} className={`${nodeClasses(n.kind)} stroke`} strokeWidth="1.2" /><text x={10} y={17} className="fill-slate-100 text-[11px] font-medium">{n.label}</text><text x={10} y={32} className="fill-slate-400 text-[9px]">{n.kind}{n.cadence ? ` | ${n.cadence}` : ""}</text><circle cx={153} cy={12} r={4} className={n.status === "ok" ? "fill-emerald-400" : n.status === "planned" ? "fill-slate-500" : n.status === "stale" ? "fill-amber-400" : "fill-rose-400"} /></g>)}
          </svg>
        </div>
      </details>

      <section className="rounded-xl border border-cyan-700/20 bg-cyan-950/10 p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-cyan-200">Feed Impact Scoring (What improves page quality next)</h2>
          <p className="text-xs text-slate-400">
            Scores missing feeds by expected improvement to page specificity/relevance, not just connectivity.
          </p>
        </div>
        <div className="space-y-2">
          {topFeedRecommendations.map((f) => (
            <div key={f.id} className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-100">
                  #{f.rank} {f.feed}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-700/40 bg-cyan-900/20 px-2 py-0.5 text-[11px] text-cyan-200">
                    impact {f.impactScore}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${f.rank === 1 ? "border-emerald-700/40 bg-emerald-900/20 text-emerald-200" : "border-slate-600 bg-slate-800/70 text-slate-300"}`}>
                    {f.recommendation}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-400">Current state: {f.currentState}</p>
              <p className="mt-2 text-xs text-slate-300">
                Likely improves: {f.likelyImproves.join(", ")}
              </p>
            </div>
          ))}
          {topFeedRecommendations.length === 0 ? (
            <p className="text-sm text-slate-500">No feed impact recommendations available yet. Run the quality agents.</p>
          ) : null}
        </div>
      </section>

      <SystemMapClient
        nodes={map.nodes}
        edges={map.edges}
        agentResults={agentStatus?.results || []}
        freshness={{ swarmAgeMinutes: map.swarmAgeMinutes, orgAgeMinutes: map.orgAgeMinutes }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
          <h2 className="text-sm font-semibold text-slate-100">External Feeds and Cadence</h2>
          <div className="mt-3 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="pb-2 pr-3">Feed</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Cadence</th><th className="pb-2">Notes</th></tr></thead><tbody className="align-top text-slate-300">{externalNodes.map((n) => <tr key={n.id} className="border-t border-slate-800/80"><td className="py-2 pr-3 font-medium text-slate-100">{n.label}</td><td className="py-2 pr-3"><span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadgeClasses(n.status || "unknown")}`}>{n.status || "unknown"}</span></td><td className="py-2 pr-3 text-xs text-slate-400">{n.cadence || "-"}</td><td className="py-2 text-xs text-slate-400">{n.note || "-"}</td></tr>)}</tbody></table></div>
        </section>
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Automation Cadence (Current vs Suggested)</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3"><p className="font-medium text-slate-100">Fast (10-15 min workday)</p><p className="text-xs text-slate-400">Calendar sync, email scan, focus prompt rebuild.</p></div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3"><p className="font-medium text-slate-100">Medium (2-4h)</p><p className="text-xs text-slate-400">Org sync (cached), org merge, dedupe, people canonical, profile rebuild.</p></div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3"><p className="font-medium text-slate-100">Heavy (nightly / on demand)</p><p className="text-xs text-slate-400">Presentation builds, deep QA, document parsing batches.</p></div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3"><p className="font-medium text-slate-100">Manual/Event-driven</p><p className="text-xs text-slate-400">PDF/deck drops, pasted meeting notes, SharePoint/Agicap reviews, pre-board refresh.</p></div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Page Interconnectivity Review</h2>
            <p className="text-xs text-slate-400">
              Human-facing check on whether pages are feeding each other well, not just technically connected.
            </p>
          </div>
          <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-[11px] text-slate-300">
            {pageNodes.length} UI nodes tracked
          </span>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {pageInterconnectivity.map((row) => (
            <div key={row.page} className="rounded border border-slate-700/50 bg-slate-950/30 p-3">
              <p className="text-sm font-medium text-slate-100">{row.page}</p>
              <p className="mt-2 text-xs text-slate-300">
                <span className="text-slate-500">Working well:</span> {row.strengths}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                <span className="text-slate-500">Gap:</span> {row.gaps}
              </p>
              <p className="mt-2 text-xs text-cyan-200">
                <span className="text-cyan-400">Next improvement:</span> {row.next}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Page Dependencies (What feeds what)</h2>
          <div className="mt-3 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="pb-2 pr-3">Page / Output</th><th className="pb-2 pr-3">Primary Inputs</th><th className="pb-2">Why it matters</th></tr></thead><tbody className="align-top text-slate-300"><tr className="border-t border-slate-800/80"><td className="py-2 pr-3 font-medium text-slate-100">Today</td><td className="py-2 pr-3 text-xs text-slate-400">meetings.json, entities.json, operator-focus-prompts.json</td><td className="py-2 text-xs text-slate-400">Current call context and next actions.</td></tr><tr className="border-t border-slate-800/80"><td className="py-2 pr-3 font-medium text-slate-100">Agents</td><td className="py-2 pr-3 text-xs text-slate-400">agent-swarm-status.json, operator-focus-prompts.json</td><td className="py-2 text-xs text-slate-400">System health and automation asks.</td></tr><tr className="border-t border-slate-800/80"><td className="py-2 pr-3 font-medium text-slate-100">Wiki / Entity</td><td className="py-2 pr-3 text-xs text-slate-400">entities.json, entity_profiles.json, notes.json</td><td className="py-2 text-xs text-slate-400">Truth layer and context history.</td></tr><tr className="border-t border-slate-800/80"><td className="py-2 pr-3 font-medium text-slate-100">Program</td><td className="py-2 pr-3 text-xs text-slate-400">timeline, budget, blockers, access requests</td><td className="py-2 text-xs text-slate-400">Weekly ERP execution control plane.</td></tr><tr className="border-t border-slate-800/80"><td className="py-2 pr-3 font-medium text-slate-100">Presentations / PPTX</td><td className="py-2 pr-3 text-xs text-slate-400">presentations.json + context updates</td><td className="py-2 text-xs text-slate-400">Board/audit outputs.</td></tr></tbody></table></div>
        </section>
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Connectivity Improvement Backlog</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded border border-cyan-800/30 bg-cyan-950/15 p-3"><p className="font-medium text-cyan-200">1. SharePoint ingestion (high)</p><p className="mt-1 text-xs text-slate-300">Parse Jade/KPMG shared docs into notes/artifacts automatically.</p></div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3"><p className="font-medium text-slate-100">2. Agicap / treasury capture (medium)</p><p className="mt-1 text-xs text-slate-400">Start manual exports and normalized notes first; API later if available.</p></div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3"><p className="font-medium text-slate-100">3. Trustpair access + control-flow evidence map (medium)</p><p className="mt-1 text-xs text-slate-400">Important for audit/controls narrative and P2P design.</p></div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3"><p className="font-medium text-slate-100">4. Scheduling automation (medium)</p><p className="mt-1 text-xs text-slate-400">Move swarm from manual command to timed workday runner.</p></div>
            <div className="rounded border border-slate-700/50 bg-slate-950/30 p-3"><p className="font-medium text-slate-100">5. System map enhancements (optional)</p><p className="mt-1 text-xs text-slate-400">Deeper canvas controls, failure impact overlays, and workflow drill-downs.</p></div>
          </div>
          <div className="mt-4 rounded border border-slate-700/50 bg-slate-950/30 p-3 text-xs text-slate-400">Duplicate identity cleanup last run: {duplicateReport ? `${duplicateReport.duplicateGroups} groups` : "n/a"} {duplicateReport && Object.keys(duplicateReport.redirects || {}).length > 0 ? `(redirects: ${Object.entries(duplicateReport.redirects).map(([from, to]) => `${from} -> ${to}`).join(", ")})` : ""}</div>
        </section>
      </div>

      <details className="rounded-xl border border-slate-700/50 bg-slate-900/20 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-100">Codex Mode Details (node inventory)</summary><div className="mt-3 grid gap-3 xl:grid-cols-2"><div className="rounded border border-slate-800/80 bg-slate-950/30 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">Nodes</p><div className="mt-2 max-h-96 overflow-auto text-xs"><table className="min-w-full"><thead><tr className="text-left text-slate-500"><th className="pb-2 pr-3">Id</th><th className="pb-2 pr-3">Kind</th><th className="pb-2 pr-3">Cadence</th><th className="pb-2">Source</th></tr></thead><tbody className="text-slate-300">{map.nodes.map((n) => <tr key={n.id} className="border-t border-slate-800/80"><td className="py-1 pr-3">{n.id}</td><td className="py-1 pr-3">{n.kind}</td><td className="py-1 pr-3">{n.cadence || "-"}</td><td className="py-1">{n.sourceFile || "-"}</td></tr>)}</tbody></table></div></div><div className="rounded border border-slate-800/80 bg-slate-950/30 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">Edges</p><div className="mt-2 max-h-96 overflow-auto text-xs"><table className="min-w-full"><thead><tr className="text-left text-slate-500"><th className="pb-2 pr-3">From</th><th className="pb-2 pr-3">Relation</th><th className="pb-2">To</th></tr></thead><tbody className="text-slate-300">{map.edges.map((e, idx) => <tr key={`${e.from}-${e.to}-${idx}`} className="border-t border-slate-800/80"><td className="py-1 pr-3">{e.from}</td><td className="py-1 pr-3">{e.relation}</td><td className="py-1">{e.to}</td></tr>)}</tbody></table></div></div></div></details>
    </div>
  );
}
