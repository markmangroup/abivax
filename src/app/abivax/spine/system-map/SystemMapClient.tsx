"use client";

import { useMemo, useState } from "react";

type NodeKind = "external" | "job" | "data" | "agent" | "page" | "output" | "planned";

type SystemNode = {
  id: string;
  label: string;
  kind: NodeKind;
  x: number;
  y: number;
  cadence?: string;
  sourceFile?: string;
  status?: "ok" | "warn" | "stale" | "planned";
  note?: string;
};

type SystemEdge = {
  from: string;
  to: string;
  relation: "reads" | "writes" | "feeds" | "triggers" | "depends";
};

type AgentStep = {
  id: string;
  label: string;
  status: string;
  startedAt: string;
  finishedAt: string;
  outputPreview: string;
};

type FreshnessMeta = {
  swarmAgeMinutes: number | null;
  orgAgeMinutes: number | null;
};

function expectedFreshness(nodeId: string): { label: string; maxAgeMinutes: number | null; source: "swarm" | "org" } {
  if (nodeId === "today-page") return { label: "Today should reflect recent swarm updates", maxAgeMinutes: 60, source: "swarm" };
  if (nodeId === "agents-page") return { label: "Agent status should be reasonably current", maxAgeMinutes: 120, source: "swarm" };
  if (["outlook-gal", "sync-org", "org-json"].includes(nodeId)) {
    return { label: "Org directory refresh target", maxAgeMinutes: 240, source: "org" };
  }
  if (["outlook-cal", "sync-cal", "meetings-json"].includes(nodeId)) {
    return { label: "Calendar freshness target", maxAgeMinutes: 15, source: "swarm" };
  }
  if (["outlook-mail", "sync-mail", "notes-json"].includes(nodeId)) {
    return { label: "Email context freshness target", maxAgeMinutes: 30, source: "swarm" };
  }
  if (["sharepoint", "sync-sharepoint-graph", "sharepoint-remote-index-json", "sync-sharepoint", "sharepoint-json", "sync-sharepoint-content", "sharepoint-content-json"].includes(nodeId)) {
    return { label: "SharePoint sync/parse freshness target", maxAgeMinutes: 240, source: "swarm" };
  }
  return { label: "No explicit freshness SLA yet", maxAgeMinutes: null, source: "swarm" };
}

function routeForNode(nodeId: string): string | null {
  const routes: Record<string, string> = {
    "today-page": "/abivax/spine/today",
    "agents-page": "/abivax/spine/agents",
    "program-page": "/abivax/spine/program",
    "wiki-page": "/abivax/spine/search",
    "present-page": "/abivax/spine/presentations",
    "pptx": "/abivax/spine/presentations",
    "meetings-json": "/abivax/spine/today",
    "prompts-json": "/abivax/spine/agents",
    "entities-json": "/abivax/spine/search",
    "profiles-json": "/abivax/spine/search",
    "sharepoint-json": "/abivax/spine/program",
    "sharepoint-remote-index-json": "/abivax/spine/system-map",
    "sharepoint-content-json": "/abivax/spine/program",
    "sync-sharepoint-graph": "/abivax/spine/system-map",
    "sync-sharepoint": "/abivax/spine/program",
    "sync-sharepoint-content": "/abivax/spine/program",
    "sharepoint": "/abivax/spine/program",
  };
  return routes[nodeId] || null;
}

function audienceForNode(node: SystemNode): "mike" | "shared" | "codex" {
  if (node.kind === "page" || node.kind === "output") return "mike";
  if (node.kind === "external" || node.kind === "planned") return "shared";
  if (node.kind === "job" || node.kind === "agent") return "shared";
  if (node.kind === "data") return "codex";
  return "shared";
}

function audienceLabel(a: "mike" | "shared" | "codex") {
  if (a === "mike") return "Mike-facing";
  if (a === "codex") return "Codex/internal";
  return "Shared";
}

function audiencePill(a: "mike" | "shared" | "codex") {
  if (a === "mike") return "border-blue-700/40 bg-blue-900/20 text-blue-200";
  if (a === "codex") return "border-slate-600 bg-slate-800/70 text-slate-300";
  return "border-cyan-700/40 bg-cyan-900/20 text-cyan-200";
}

function impactForNode(nodeId: string): string {
  if (["today-page", "meetings-json", "sync-cal", "outlook-cal", "prompts-json", "focus-agent"].includes(nodeId)) {
    return "Affects what you see and trust on Today.";
  }
  if (["outlook-gal", "sync-org", "org-json", "org-merge", "people-dedupe", "people-canonical", "entities-json"].includes(nodeId)) {
    return "Affects org accuracy, reporting lines, and wiki/person trust.";
  }
  if (["present-page", "pptx"].includes(nodeId)) {
    return "Affects board/audit output readiness.";
  }
  if (["notes-json", "sync-mail", "outlook-mail"].includes(nodeId)) {
    return "Affects context capture and how much manual re-explaining is needed.";
  }
  if (["sharepoint", "sync-sharepoint-graph", "sharepoint-remote-index-json", "sync-sharepoint", "sharepoint-json", "sync-sharepoint-content", "sharepoint-content-json"].includes(nodeId)) {
    return "Affects document evidence quality for Program and deck/source traceability.";
  }
  if (["agicap", "trustpair"].includes(nodeId)) {
    return "Future connectivity opportunity; not yet driving the app automatically.";
  }
  return "Supports system quality and downstream reliability.";
}

function impactTagForNode(nodeId: string): { label: string; className: string } {
  if (["today-page", "meetings-json", "sync-cal", "outlook-cal", "prompts-json", "focus-agent"].includes(nodeId)) {
    return { label: "Breaks Today", className: "border-amber-700/40 bg-amber-900/20 text-amber-200" };
  }
  if (["outlook-gal", "sync-org", "org-json", "org-merge", "people-dedupe", "people-canonical", "entities-json"].includes(nodeId)) {
    return { label: "Breaks Org Accuracy", className: "border-cyan-700/40 bg-cyan-900/20 text-cyan-200" };
  }
  if (["present-page", "pptx"].includes(nodeId)) {
    return { label: "Breaks Deck Output", className: "border-rose-700/40 bg-rose-900/20 text-rose-200" };
  }
  if (["notes-json", "sync-mail", "outlook-mail"].includes(nodeId)) {
    return { label: "Loses Context", className: "border-violet-700/40 bg-violet-900/20 text-violet-200" };
  }
  if (["sharepoint", "sync-sharepoint-graph", "sharepoint-remote-index-json", "sync-sharepoint", "sharepoint-json", "sync-sharepoint-content", "sharepoint-content-json"].includes(nodeId)) {
    return { label: "Improves Program Context", className: "border-cyan-700/40 bg-cyan-900/20 text-cyan-200" };
  }
  if (["agicap", "trustpair"].includes(nodeId)) {
    return { label: "Improvement Opportunity", className: "border-slate-600 bg-slate-800/70 text-slate-300" };
  }
  return { label: "Supporting Node", className: "border-slate-700 bg-slate-900 text-slate-300" };
}

function nodeClasses(kind: NodeKind, active: boolean): string {
  const base =
    kind === "external"
      ? "fill-cyan-950/60 stroke-cyan-500/40"
      : kind === "job"
        ? "fill-amber-950/50 stroke-amber-500/40"
        : kind === "data"
          ? "fill-emerald-950/50 stroke-emerald-500/40"
          : kind === "agent"
            ? "fill-violet-950/50 stroke-violet-500/40"
            : kind === "page"
              ? "fill-blue-950/50 stroke-blue-500/40"
              : kind === "output"
                ? "fill-rose-950/40 stroke-rose-500/40"
                : "fill-slate-900/70 stroke-slate-600/60";
  return active ? `${base} drop-shadow-[0_0_10px_rgba(250,204,21,0.25)]` : base;
}

function lineClass(edge: SystemEdge, active: boolean): string {
  const base =
    edge.relation === "writes"
      ? "stroke-emerald-500/50"
      : edge.relation === "reads"
        ? "stroke-cyan-500/50"
        : edge.relation === "feeds"
          ? "stroke-blue-500/50"
          : edge.relation === "triggers"
            ? "stroke-amber-500/50"
            : "stroke-slate-500/50";
  return active ? base.replace("/50", "/90") : base;
}

function statusPill(status?: string): string {
  const s = String(status || "unknown");
  if (s.includes("ok")) return "border-emerald-700/40 bg-emerald-900/20 text-emerald-200";
  if (s.includes("warn") || s.includes("stale")) return "border-amber-700/40 bg-amber-900/20 text-amber-200";
  if (s.includes("planned")) return "border-slate-600 bg-slate-800/70 text-slate-300";
  return "border-rose-700/40 bg-rose-900/20 text-rose-200";
}

export function SystemMapClient({
  nodes,
  edges,
  agentResults,
  freshness,
}: {
  nodes: SystemNode[];
  edges: SystemEdge[];
  agentResults: AgentStep[];
  freshness: FreshnessMeta;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    nodes.find((n) => n.id === "today-page")?.id || nodes[0]?.id || ""
  );
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;

  const incident = useMemo(() => {
    if (!selectedNode) return { incoming: [] as SystemEdge[], outgoing: [] as SystemEdge[] };
    return {
      incoming: edges.filter((e) => e.to === selectedNode.id),
      outgoing: edges.filter((e) => e.from === selectedNode.id),
    };
  }, [edges, selectedNode]);

  const relatedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const set = new Set<string>([selectedNode.id]);
    for (const e of [...incident.incoming, ...incident.outgoing]) {
      set.add(e.from);
      set.add(e.to);
    }
    return set;
  }, [incident, selectedNode]);

  const activeEdges = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set(
      [...incident.incoming, ...incident.outgoing].map((e) => `${e.from}|${e.relation}|${e.to}`)
    );
  }, [incident, selectedNode]);

  const agentStep = useMemo(() => {
    if (!selectedNode || selectedNode.kind !== "agent" && selectedNode.kind !== "job") return null;
    const label = selectedNode.label.toLowerCase();
    return (
      agentResults.find((a) => a.label.toLowerCase() === label) ||
      agentResults.find((a) => label.includes(a.id.replace(/_/g, " ")))
    );
  }, [agentResults, selectedNode]);

  const freshnessInfo = useMemo(() => {
    if (!selectedNode) return null;
    const cfg = expectedFreshness(selectedNode.id);
    const ageMinutes = cfg.source === "org" ? freshness.orgAgeMinutes : freshness.swarmAgeMinutes;
    const isStale = cfg.maxAgeMinutes !== null && ageMinutes !== null && ageMinutes > cfg.maxAgeMinutes;
    return { ...cfg, ageMinutes, isStale };
  }, [selectedNode, freshness]);

  const routeHref = selectedNode ? routeForNode(selectedNode.id) : null;
  const selectedAudience = selectedNode ? audienceForNode(selectedNode) : "shared";
  const impactTag = selectedNode ? impactTagForNode(selectedNode.id) : null;

  const grid = { left: 20, top: 20, w: 1230, h: 560 };
  const xScale = (x: number) => grid.left + x;
  const yScale = (y: number) => grid.top + y;
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <section className="rounded-xl border border-cyan-700/20 bg-cyan-950/10 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-cyan-200">Interactive Inspector</h2>
          <p className="text-xs text-slate-400">
            Click any node to inspect what it reads, writes, and what depends on it.
          </p>
        </div>
        {selectedNode && (
          <span className={`rounded-full border px-2 py-0.5 text-xs ${statusPill(selectedNode.status)}`}>
            {selectedNode.kind} | {selectedNode.status || "unknown"}
          </span>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950/40 p-2">
          <svg viewBox={`0 0 ${grid.w + 40} ${grid.h + 40}`} className="h-[34rem] min-w-[76rem] w-full">
            <defs>
              <marker id="arrow-v2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L8,4 L0,8 z" className="fill-slate-400/70" />
              </marker>
            </defs>
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={`v2-v-${i}`}
                x1={grid.left + i * 220}
                y1={grid.top}
                x2={grid.left + i * 220}
                y2={grid.top + grid.h}
                className="stroke-slate-800/40"
                strokeDasharray="4 6"
              />
            ))}
            {edges.map((e, i) => {
              const a = nodeById.get(e.from);
              const b = nodeById.get(e.to);
              if (!a || !b) return null;
              const x1 = xScale(a.x) + 165;
              const y1 = yScale(a.y) + 22;
              const x2 = xScale(b.x);
              const y2 = yScale(b.y) + 22;
              const isActive = activeEdges.has(`${e.from}|${e.relation}|${e.to}`);
              return (
                <g key={`v2-${e.from}-${e.to}-${i}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={lineClass(e, isActive)}
                    strokeWidth={isActive ? "2.2" : "1.4"}
                    markerEnd="url(#arrow-v2)"
                  />
                </g>
              );
            })}
            {nodes.map((n) => {
              const active = relatedNodeIds.has(n.id);
              const selected = selectedNode?.id === n.id;
              return (
                <g
                  key={`node-${n.id}`}
                  transform={`translate(${xScale(n.x)}, ${yScale(n.y)})`}
                  onClick={() => setSelectedNodeId(n.id)}
                  className="cursor-pointer"
                >
                  <rect
                    x={0}
                    y={0}
                    rx={8}
                    ry={8}
                    width={165}
                    height={44}
                    className={`${nodeClasses(n.kind, active)} stroke ${selected ? "stroke-amber-300" : ""}`}
                    strokeWidth={selected ? "1.8" : "1.2"}
                  />
                  <text x={10} y={17} className={`text-[11px] ${selected ? "fill-white" : "fill-slate-100"} font-medium`}>
                    {n.label}
                  </text>
                  <text x={10} y={32} className="fill-slate-400 text-[9px]">
                    {n.kind}
                    {n.cadence ? ` | ${n.cadence}` : ""}
                  </text>
                  <circle
                    cx={153}
                    cy={12}
                    r={4}
                    className={
                      n.status === "ok"
                        ? "fill-emerald-400"
                        : n.status === "planned"
                          ? "fill-slate-500"
                          : n.status === "stale"
                            ? "fill-amber-400"
                            : "fill-rose-400"
                    }
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3">
          {!selectedNode ? null : (
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{selectedNode.label}</p>
                  <p className="text-xs text-slate-400">{selectedNode.id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusPill(selectedNode.status)}`}>
                    {selectedNode.status || "unknown"}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${audiencePill(selectedAudience)}`}>
                    {audienceLabel(selectedAudience)}
                  </span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-300">
                <p><span className="text-slate-500">Kind:</span> {selectedNode.kind}</p>
                <p><span className="text-slate-500">Cadence:</span> {selectedNode.cadence || "-"}</p>
                <p><span className="text-slate-500">Source:</span> {selectedNode.sourceFile || "-"}</p>
                {selectedNode.note ? <p><span className="text-slate-500">Note:</span> {selectedNode.note}</p> : null}
              </div>
              <div className="mt-3 rounded border border-blue-800/20 bg-blue-950/10 p-2">
                <p className="text-[11px] uppercase tracking-wider text-blue-300">Why You Care</p>
                <p className="mt-1 text-xs text-slate-300">{impactForNode(selectedNode.id)}</p>
              </div>
              <div className="mt-3 rounded border border-slate-700/40 bg-slate-950/30 p-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Freshness</p>
                <p className="mt-1 text-xs text-slate-300">{freshnessInfo?.label}</p>
                <p className={`mt-1 text-[11px] ${freshnessInfo?.isStale ? "text-amber-300" : "text-slate-400"}`}>
                  {freshnessInfo?.ageMinutes === null
                    ? "Age unknown"
                    : freshnessInfo?.ageMinutes !== undefined
                      ? `${freshnessInfo.ageMinutes} min since refresh`
                      : "Age unknown"}
                  {freshnessInfo?.maxAgeMinutes !== null && freshnessInfo?.maxAgeMinutes !== undefined
                    ? ` (target <= ${freshnessInfo.maxAgeMinutes}m)`
                    : ""}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {impactTag ? (
                  <span className={`rounded-full border px-2 py-1 text-[11px] ${impactTag.className}`}>
                    {impactTag.label}
                  </span>
                ) : null}
                {routeHref ? (
                  <a
                    href={routeHref}
                    className="rounded border border-cyan-700/40 bg-cyan-950/20 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-900/30"
                  >
                    Open Related Page
                  </a>
                ) : null}
                {selectedNode.sourceFile ? (
                  <code className="rounded border border-slate-700/50 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-300">
                    {selectedNode.sourceFile}
                  </code>
                ) : null}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Incoming ({incident.incoming.length})</p>
            <div className="mt-2 space-y-2">
              {incident.incoming.length === 0 ? (
                <p className="text-xs text-slate-500">No incoming dependencies.</p>
              ) : (
                incident.incoming.map((e, i) => {
                  const fromNode = nodeById.get(e.from);
                  return (
                    <button
                      key={`in-${i}-${e.from}-${e.to}`}
                      type="button"
                      onClick={() => setSelectedNodeId(e.from)}
                      className="w-full rounded border border-slate-700/50 bg-slate-950/30 px-2 py-2 text-left hover:border-slate-600"
                    >
                      <p className="text-xs text-slate-100">{fromNode?.label || e.from}</p>
                      <p className="text-[11px] text-slate-400">
                        {e.relation} {"->"} {selectedNode?.label}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outgoing ({incident.outgoing.length})</p>
            <div className="mt-2 space-y-2">
              {incident.outgoing.length === 0 ? (
                <p className="text-xs text-slate-500">No downstream dependencies.</p>
              ) : (
                incident.outgoing.map((e, i) => {
                  const toNode = nodeById.get(e.to);
                  return (
                    <button
                      key={`out-${i}-${e.from}-${e.to}`}
                      type="button"
                      onClick={() => setSelectedNodeId(e.to)}
                      className="w-full rounded border border-slate-700/50 bg-slate-950/30 px-2 py-2 text-left hover:border-slate-600"
                    >
                      <p className="text-xs text-slate-100">{toNode?.label || e.to}</p>
                      <p className="text-[11px] text-slate-400">
                        {selectedNode?.label} {"->"} {e.relation}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {agentStep ? (
            <div className="rounded-lg border border-violet-700/30 bg-violet-950/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Last Agent Run</p>
              <p className="mt-2 text-xs text-slate-200">{agentStep.label}</p>
              <p className="mt-1 text-[11px] text-slate-400">{agentStep.outputPreview}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                {new Date(agentStep.startedAt).toLocaleTimeString()} - {new Date(agentStep.finishedAt).toLocaleTimeString()}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
