import Link from "next/link";
import { loadCftiControlRegister, loadCftiControlsIntake, loadErpPillars, loadProcessFlowControlOverlays, loadProcessFlowDiagramPayloads, loadProcessFlows } from "@/lib/abivaxData";
import { pillarTone, type ErpPillarId } from "@/lib/erpPillars";
import { RenderedSwimlaneDiagram } from "./RenderedSwimlaneDiagram";

export const dynamic = "force-dynamic";

function pillarMetaMap() {
  const m = loadErpPillars();
  return new Map([...m.pillars, ...m.crossCutting].map((p) => [p.id, p]));
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("scaffold")) return "border-slate-700 bg-slate-900/50 text-slate-300";
  if (s.includes("fact")) return "border-amber-700/40 bg-amber-900/20 text-amber-200";
  if (s.includes("draft")) return "border-cyan-700/40 bg-cyan-900/20 text-cyan-200";
  if (s.includes("ready")) return "border-emerald-700/40 bg-emerald-900/20 text-emerald-200";
  return "border-slate-700 bg-slate-900/50 text-slate-300";
}

export default async function ProcessFlowsPage() {
  const data = loadProcessFlows();
  const cftiIntake = loadCftiControlsIntake();
  const cftiRegister = loadCftiControlRegister();
  const flowOverlays = loadProcessFlowControlOverlays();
  const diagramPayloads = loadProcessFlowDiagramPayloads();
  const pillars = pillarMetaMap();
  const groups = (["p2p", "reporting-data", "controls-audit"] as ErpPillarId[]).map((pid) => ({
    pid,
    meta: pillars.get(pid),
    flows: data.flows.filter((f) => f.pillarId === pid),
    cftiRecords:
      cftiRegister.status === "ok"
        ? cftiRegister.records.filter((r) => r.primaryPillar === pid)
        : [],
  }));
  const stepOverlaysByFlow = new Map(
    (flowOverlays.status === "ok" ? flowOverlays.overlays : []).map((o) => [
      o.flowId,
      new Map(o.stepOverlays.map((s) => [s.stepId, s])),
    ])
  );
  const trackerSummary = cftiIntake.tracker?.summary;
  const trackerRowCount = trackerSummary?.rowCount ?? 0;
  const trackerGapCounts = trackerSummary && "byGap" in trackerSummary ? trackerSummary.byGap : [];
  const p2pRowCount = cftiIntake.p2pRcm?.summary.rowCount ?? 0;
  const fscpRowCount = cftiIntake.fscpRcm?.summary.rowCount ?? 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-100">Process Flows</h1>
        <p className="text-sm text-slate-400">
          Current-state vs future-state process flow scaffolds. These become reusable visuals for Program and Presentations once fact-finding fills in the steps and control points.
        </p>
        <p className="text-xs text-slate-500">Updated: {data.updatedAt}</p>
      </header>

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Total Flows</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{data.flows.length}</p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">P2P</p>
            <p className="mt-1 text-sm font-semibold text-cyan-200">{data.flows.filter((f) => f.pillarId === "p2p").length}</p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Reporting</p>
            <p className="mt-1 text-sm font-semibold text-amber-200">{data.flows.filter((f) => f.pillarId === "reporting-data").length}</p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Controls</p>
            <p className="mt-1 text-sm font-semibold text-emerald-200">{data.flows.filter((f) => f.pillarId === "controls-audit").length}</p>
          </div>
        </div>
      </section>

      {cftiIntake.status === "ok" ? (
        <section className="rounded-xl border border-emerald-700/30 bg-emerald-950/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-emerald-200">CFTI Source Intake (RCMs + Tracker)</h2>
              <p className="text-xs text-slate-400">
                Source-backed controls/process baseline from Youness attachments. Use this to replace note-based assumptions as process-flow detail is filled in.
              </p>
            </div>
            <span className="text-xs text-slate-400">{cftiIntake.generatedAt || "n/a"}</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Tracker Rows</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {trackerRowCount}
              </p>
            </div>
            <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">P2P Controls</p>
              <p className="mt-1 text-sm font-semibold text-cyan-200">
                {p2pRowCount}
              </p>
            </div>
            <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">FSCP Controls</p>
              <p className="mt-1 text-sm font-semibold text-amber-200">
                {fscpRowCount}
              </p>
            </div>
            <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Tracker ERP Gaps</p>
              <p className="mt-1 text-sm font-semibold text-emerald-200">
                {trackerGapCounts.find((x) => x.key === "ERP")?.count ?? 0}
              </p>
            </div>
          </div>
          <details className="mt-3 rounded-lg border border-emerald-700/20 bg-emerald-950/5">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Header Fields Confirmed (for flow mapping)
            </summary>
            <div className="grid gap-3 border-t border-emerald-700/20 p-3 lg:grid-cols-3">
              <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Tracker Micro View</p>
                <p className="mt-1 text-xs text-slate-300">
                  {(cftiIntake.tracker?.headers || []).slice(0, 10).join(", ")}
                </p>
              </div>
              <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">P2P RCM</p>
                <p className="mt-1 text-xs text-slate-300">
                  {(cftiIntake.p2pRcm?.headers || []).slice(0, 10).join(", ")}
                </p>
              </div>
              <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">FSCP RCM</p>
                <p className="mt-1 text-xs text-slate-300">
                  {(cftiIntake.fscpRcm?.headers || []).slice(0, 10).join(", ")}
                </p>
              </div>
            </div>
          </details>
        </section>
      ) : null}

      {diagramPayloads.status === "ok" ? (
        <section className="rounded-xl border border-cyan-700/20 bg-cyan-950/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-cyan-200">Diagram Payloads (v1)</h2>
              <p className="text-xs text-slate-400">
                Diagram-ready nodes/edges generated from process scaffolds + CFTI control overlays (foundation for future process/swimlane visuals).
              </p>
            </div>
            <span className="text-xs text-slate-400">{diagramPayloads.payloads.length} payload(s)</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {diagramPayloads.payloads.map((p) => (
              <div key={p.flowId} className="rounded border border-slate-700/30 bg-slate-950/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-100">{p.title}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${pillarTone(p.pillarId as ErpPillarId)}`}>
                    {p.pillarId}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-[11px]">
                  <div className="rounded border border-slate-700/20 bg-slate-900/30 px-2 py-1">
                    <p className="text-slate-500">Nodes</p>
                    <p className="font-semibold text-slate-100">{p.nodes.length}</p>
                  </div>
                  <div className="rounded border border-slate-700/20 bg-slate-900/30 px-2 py-1">
                    <p className="text-slate-500">Edges</p>
                    <p className="font-semibold text-slate-100">{p.edges.length}</p>
                  </div>
                  <div className="rounded border border-slate-700/20 bg-slate-900/30 px-2 py-1">
                    <p className="text-slate-500">Steps</p>
                    <p className="font-semibold text-slate-100">{p.nodes.filter((n) => n.type === "step").length}</p>
                  </div>
                  <div className="rounded border border-slate-700/20 bg-slate-900/30 px-2 py-1">
                    <p className="text-slate-500">Ctrl Clusters</p>
                    <p className="font-semibold text-slate-100">{p.nodes.filter((n) => n.type === "control-cluster").length}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Lanes: {p.lanes.map((l) => l.label).join(" • ")}
                </p>
                <details className="mt-2 rounded border border-slate-700/20 bg-slate-900/20">
                  <summary className="cursor-pointer px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    Swimlane Preview (v1)
                  </summary>
                  <div className="border-t border-slate-700/20 p-2">
                    <RenderedSwimlaneDiagram payload={p} />
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {groups.map((g) => (
        <section key={g.pid} className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(g.pid)}`}>
                {g.meta?.shortLabel || g.pid}
              </span>
              <h2 className="text-sm font-semibold text-slate-100">{g.meta?.label || g.pid}</h2>
            </div>
            <span className="text-xs text-slate-400">{g.flows.length} flow scaffold(s)</span>
          </div>

          {cftiRegister.status === "ok" ? (
            <>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div className="rounded border border-slate-700/30 bg-slate-950/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Mapped Controls</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{g.cftiRecords.length}</p>
                </div>
                <div className="rounded border border-slate-700/30 bg-slate-950/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">ERP Signals</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-200">{g.cftiRecords.filter((r) => r.erpSignal).length}</p>
                </div>
                <div className="rounded border border-slate-700/30 bg-slate-950/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Tracker GAP=Design</p>
                  <p className="mt-1 text-sm font-semibold text-amber-200">{g.cftiRecords.filter((r) => r.trackerGap === "Design").length}</p>
                </div>
                <div className="rounded border border-slate-700/30 bg-slate-950/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Out-of-Scope</p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">{g.cftiRecords.filter((r) => r.trackerOutOfScope).length}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                These counts come from CFTI tracker/RCM categories and flags, not a standalone material-weakness classifier.
              </p>
            </>
          ) : null}

          <div className="mt-3 space-y-3">
            {g.flows.map((flow) => (
              <details key={flow.id} className="rounded-lg border border-slate-700/40 bg-slate-900/40">
                <summary className="cursor-pointer p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{flow.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{flow.scope}</p>
                      <p className="mt-1 text-xs text-slate-300">{flow.currentState.summary}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${statusTone(flow.status)}`}>
                        {flow.status}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">Updated {flow.lastUpdated}</p>
                    </div>
                  </div>
                </summary>

                <div className="grid gap-4 border-t border-slate-700/40 p-3 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Current State Steps</p>
                      <ul className="mt-2 space-y-2">
                        {flow.currentState.steps.map((s) => (
                          <li key={s.id} className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                            <p className="text-xs font-medium text-slate-100">{s.label}</p>
                            <p className="mt-1 text-[11px] text-slate-400">Owner: {s.owner || "TBD"}</p>
                            {s.systems.length > 0 ? (
                              <p className="mt-1 text-[11px] text-slate-400">Systems: {s.systems.join(", ")}</p>
                            ) : null}
                            {s.painPoints[0] ? <p className="mt-1 text-[11px] text-slate-300">Pain: {s.painPoints[0]}</p> : null}
                            {s.controlNotes[0] ? <p className="mt-1 text-[11px] text-slate-400">Control: {s.controlNotes[0]}</p> : null}
                            {cftiRegister.status === "ok" ? (
                              (() => {
                                const stepOverlay = stepOverlaysByFlow.get(flow.id)?.get(s.id);
                                const sampleControls = stepOverlay?.sampleControls || [];
                                const mappedCount = stepOverlay?.summary.mappedControlCount || 0;
                                if (mappedCount === 0) {
                                  return (
                                    <p className="mt-2 text-[11px] text-slate-500">
                                      No direct CFTI control rows mapped to this step yet (expected for some US/entity-specific steps until internal process docs arrive).
                                    </p>
                                  );
                                }
                                return (
                                  <div className="mt-2 rounded border border-cyan-900/30 bg-cyan-950/10 p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-[11px] font-medium uppercase tracking-wider text-cyan-300">
                                        Source-backed step signals
                                      </p>
                                      <p className="text-[11px] text-slate-400">
                                        {mappedCount} mapped control{mappedCount === 1 ? "" : "s"}
                                      </p>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {(stepOverlay?.summary.erpSignalCount || 0) > 0 ? (
                                        <span className="rounded-full border border-cyan-700/40 bg-cyan-900/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan-200">
                                          ERP signal present
                                        </span>
                                      ) : null}
                                      {(stepOverlay?.summary.trackerDesignCount || 0) > 0 ? (
                                        <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-200">
                                          Tracker GAP=Design present
                                        </span>
                                      ) : null}
                                      {(stepOverlay?.summary.outOfScopeCount || 0) > 0 ? (
                                        <span className="rounded-full border border-slate-700/40 bg-slate-900/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
                                          Includes Out-of-Scope tracker items
                                        </span>
                                      ) : null}
                                    </div>
                                    <ul className="mt-2 space-y-1">
                                      {sampleControls.slice(0, 3).map((r) => (
                                        <li key={`${s.id}-${r.id}`} className="rounded border border-slate-700/20 bg-slate-950/30 px-2 py-1">
                                          <p className="text-[11px] text-slate-200">
                                            <span className="font-medium">{r.controlId}</span>: {r.controlTitle}
                                          </p>
                                          <p className="mt-0.5 text-[10px] text-slate-400">
                                            {(r.subProcess || r.process || "Process TBD")}
                                            {r.trackerStatus ? ` â€¢ ${r.trackerStatus}` : ""}
                                            {r.trackerGap ? ` â€¢ GAP=${r.trackerGap}` : ""}
                                          </p>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })()
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {cftiRegister.status === "ok" ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Source-Backed Control Signals ({g.meta?.shortLabel || g.pid})</p>
                        <ul className="mt-2 space-y-2">
                          {g.cftiRecords
                            .filter((r) => r.erpSignal || r.trackerGap === "Design")
                            .slice(0, 5)
                            .map((r) => (
                              <li key={`${flow.id}-${r.id}`} className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-slate-100">{r.controlId}: {r.controlTitle}</p>
                                  <span className="text-[11px] text-slate-400">{r.trackerStatus || "No tracker status"}</span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {r.subProcess ? `${r.subProcess} â€¢ ` : ""}{r.system || "System TBD"} â€¢ {r.automationType || "Type TBD"}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {r.trackerGap ? (
                                    <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-200">
                                      GAP: {r.trackerGap}
                                    </span>
                                  ) : null}
                                  {r.erpSignal ? (
                                    <span className="rounded-full border border-cyan-700/40 bg-cyan-900/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan-200">
                                      ERP signal
                                    </span>
                                  ) : null}
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Evidence Needed</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-300">
                        {flow.evidenceNeeded.map((x) => <li key={x}>- {x}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Future State Target</p>
                      <p className="mt-2 text-xs text-slate-300">{flow.futureState.summary}</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-300">
                        {flow.futureState.targetChanges.slice(0, 4).map((x) => <li key={x}>- {x}</li>)}
                      </ul>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">ERP-Addressable</p>
                        <ul className="mt-1 space-y-1 text-xs text-slate-300">
                          {flow.futureState.erpAddressableChanges.slice(0, 4).map((x) => <li key={x}>- {x}</li>)}
                        </ul>
                      </div>
                      <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Non-ERP Changes</p>
                        <ul className="mt-1 space-y-1 text-xs text-slate-300">
                          {flow.futureState.nonErpChanges.slice(0, 4).map((x) => <li key={x}>- {x}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Deck Use Cases</p>
                      <ul className="mt-1 space-y-1 text-xs text-slate-300">
                        {flow.deckUseCases.map((x) => <li key={x}>- {x}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/20 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">How To Use</p>
        <p className="mt-2 text-sm text-slate-300">
          Keep these scaffolds updated as fact-finding comes in. Then convert them into visuals for the living executive deck and board/audit presentations.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/abivax/spine/program" className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800/40">
            Back to Program
          </Link>
          <Link href="/abivax/spine/presentations" className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800/40">
            Open Presentations
          </Link>
        </div>
      </section>
    </div>
  );
}

