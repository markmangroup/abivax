import Link from "next/link";
import { HandoffDraftPanel } from "@/app/abivax/spine/HandoffDraftPanel";
import {
  loadTimeline,
  loadBudget,
  loadAccessRequests,
  loadPresentations,
  loadSharePointArtifacts,
  loadSharePointArtifactContent,
  loadErpPillars,
  loadErpPillarBaselines,
  loadProcessFlows,
  loadCftiControlsIntake,
  loadCftiControlRegister,
  type Milestone,
} from "@/lib/abivaxData";
import {
  classifyErpPillars,
  pillarTone,
  type ErpPillarId,
} from "@/lib/erpPillars";

export const dynamic = "force-dynamic";

function formatDate(d: string | null) {
  if (!d) return "TBD";
  const ts = Date.parse(d);
  if (Number.isNaN(ts)) return d;
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatEur(n: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} EUR`;
}
function formatDateTime(d: string | null | undefined) {
  if (!d) return "n/a";
  const ts = Date.parse(d);
  if (Number.isNaN(ts)) return d;
  return new Date(ts).toLocaleString();
}
function uniqPillars(ids: ErpPillarId[]): ErpPillarId[] {
  return Array.from(new Set(ids));
}

function milestoneTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("deadline")) return "text-amber-300 border-amber-700/40 bg-amber-950/20";
  if (s.includes("target")) return "text-emerald-300 border-emerald-700/40 bg-emerald-950/20";
  return "text-slate-300 border-slate-700/40 bg-slate-900/30";
}

function sortMilestones(milestones: Milestone[]) {
  return [...milestones].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return Date.parse(a.date) - Date.parse(b.date);
  });
}

const CORE_PILLARS: ErpPillarId[] = ["p2p", "reporting-data", "controls-audit"];
const PILLAR_ORDER = [...CORE_PILLARS, "enablement"] as ErpPillarId[];

function pillarLabel(
  id: ErpPillarId,
  pillarModel: Awaited<ReturnType<typeof loadErpPillars>>
) {
  const all = [...pillarModel.pillars, ...pillarModel.crossCutting];
  return all.find((p) => p.id === id);
}

function evidenceRequestStatusPriority(status: string) {
  const s = status.toLowerCase();
  if (s === "awaiting-response") return 0;
  if (s === "partial") return 1;
  if (s.startsWith("active-")) return 2;
  if (s === "received") return 3;
  return 9;
}

function evidenceRequestStatusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "received") return "border-emerald-700/40 bg-emerald-900/20 text-emerald-300";
  if (s === "partial") return "border-cyan-700/40 bg-cyan-900/20 text-cyan-300";
  if (s === "awaiting-response") return "border-rose-700/40 bg-rose-900/20 text-rose-300";
  return "border-slate-600/40 bg-slate-900/40 text-slate-300";
}

export default async function ProgramPage({
  searchParams,
}: {
  searchParams?: Promise<{ handoff?: string; source?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const handoff = (params?.handoff || "").trim();
  const handoffSource = (params?.source || "Today").trim();
  const [timeline, budget, access, presentations, sharepoint, sharepointContent, pillarModel, pillarBaselines, processFlows, cftiIntake, cftiRegister] = await Promise.all([
    loadTimeline(),
    loadBudget(),
    loadAccessRequests(),
    loadPresentations(),
    loadSharePointArtifacts(),
    loadSharePointArtifactContent(),
    loadErpPillars(),
    loadErpPillarBaselines(),
    loadProcessFlows(),
    loadCftiControlsIntake(),
    loadCftiControlRegister(),
  ]);

  const milestones = sortMilestones(timeline.milestones);
  const upcoming = milestones.filter((m) => m.date).slice(0, 6);
  const unresolvedAccess = access.requests.filter((r) => !r.status.toLowerCase().includes("granted"));
  const materiallyOpenAccess = unresolvedAccess.filter(
    (r) => !r.status.toLowerCase().includes("to-confirm-scope")
  );
  const deckGaps = presentations.presentations.flatMap((p) =>
    p.dataRequests
      .filter((g) => !g.status.toLowerCase().includes("closed"))
      .map((g) => ({
        deckId: p.id,
        deckTitle: p.title,
        ...g,
        pillars: uniqPillars(classifyErpPillars(`${g.topic} ${g.ask} ${p.title}`)),
      }))
  );
  const urgentMilestones = upcoming.filter((m) => {
    if (!m.date) return false;
    const days = Math.ceil((Date.parse(m.date) - Date.now()) / (24 * 60 * 60 * 1000));
    return days <= 30;
  });
  const recentSharePoint = [...sharepoint.artifacts]
    .sort((a, b) => String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || "")))
    .slice(0, 8);
  const sharepointByPhase = Object.entries(
    sharepoint.artifacts.reduce<Record<string, number>>((acc, a) => {
      const k = a.phase || "Unclassified";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 6);
  const sharepointContentById = new Map(sharepointContent.items.map((i) => [i.artifactId, i]));

  const actionQueue = [
    ...urgentMilestones.map((m) => ({
      id: `m-${m.id}`,
      lane: "Milestone",
      item: m.label,
      owner: m.scope,
      due: formatDate(m.date),
      note: m.notes,
      pillars: uniqPillars(classifyErpPillars(`${m.label} ${m.notes} ${m.scope}`)),
    })),
    ...materiallyOpenAccess.slice(0, 4).map((r) => ({
      id: `a-${r.id}`,
      lane: "Access",
      item: r.system,
      owner: r.owner,
      due: r.requestedAt,
      note: r.nextStep,
      pillars: uniqPillars(classifyErpPillars(`${r.system} ${r.nextStep} ${r.owner}`)),
    })),
    ...deckGaps.slice(0, 4).map((g) => ({
      id: `d-${g.deckId}-${g.id}`,
      lane: "Deck Gap",
      item: `${g.deckTitle}: ${g.topic}`,
      owner: g.owner,
      due: g.due,
      note: g.ask,
      pillars: uniqPillars(classifyErpPillars(`${g.topic} ${g.ask} ${g.deckTitle}`)),
    })),
  ].slice(0, 10);
  const baselineByPillar = new Map(pillarBaselines.baselines.map((b) => [b.pillarId, b]));
  const pillarEvidenceRequests = pillarBaselines.baselines.flatMap((b) =>
    b.evidenceRequests.map((r) => ({ ...r, pillar: b.pillarId as ErpPillarId }))
  );
  const evidenceSummaryByPillar = new Map(
    PILLAR_ORDER.map((pid) => [
      pid,
      {
        waiting: pillarEvidenceRequests.filter((r) => r.pillar === pid && r.status === "awaiting-response").length,
        partial: pillarEvidenceRequests.filter((r) => r.pillar === pid && r.status === "partial").length,
        received: pillarEvidenceRequests.filter((r) => r.pillar === pid && r.status === "received").length,
      },
    ])
  );
  const pillarBuckets = PILLAR_ORDER.map((id) => {
    const model = pillarLabel(id, pillarModel);
    const baseline = baselineByPillar.get(id);
    const actions = actionQueue.filter((a) => a.pillars.includes(id)).slice(0, 3);
    const gaps = deckGaps.filter((g) => (g.pillars.length ? g.pillars : ["enablement"]).includes(id)).slice(0, 3);
    const accessSignals = materiallyOpenAccess
      .filter((r) => classifyErpPillars(`${r.system} ${r.nextStep} ${r.owner}`).includes(id))
      .slice(0, 2);
    return {
      id,
      label: model?.label || id,
      shortLabel: model?.shortLabel || id,
      description: model?.description || "",
      executivePrompt:
        model && "executivePrompt" in model && typeof model.executivePrompt === "string"
          ? model.executivePrompt
          : "",
      baseline,
      actions,
      gaps,
      accessSignals,
      signalCount: actions.length + gaps.length + accessSignals.length,
    };
  });
  const pillarSummary = PILLAR_ORDER.map((id) => {
    const meta = pillarLabel(id, pillarModel);
    const actionCount = actionQueue.filter((a) => a.pillars.includes(id)).length;
    const deckGapCount = deckGaps.filter((g) => (g.pillars.length ? g.pillars : ["enablement"]).includes(id)).length;
    const accessCount = materiallyOpenAccess.filter((r) =>
      classifyErpPillars(`${r.system} ${r.nextStep} ${r.owner}`).includes(id)
    ).length;
    return {
      id,
      shortLabel: meta?.shortLabel || id,
      label: meta?.label || id,
      description: meta?.description || "",
      actionCount,
      deckGapCount,
      accessCount,
      totalSignal: actionCount + deckGapCount + accessCount,
    };
  });
  const summaryById = new Map(pillarSummary.map((p) => [p.id, p]));
  const flowByPillar = new Map(
    PILLAR_ORDER.map((pid) => [pid, processFlows.flows.filter((f) => f.pillarId === pid)])
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-100">Program</h1>
        <p className="text-sm text-slate-400">
          ERP command center. Pillar-first view for what matters now; operational detail is available below when needed.
        </p>
      </header>

      {handoff ? (
        <HandoffDraftPanel
          title="Inbound Handoff Draft"
          sourceLabel={handoffSource}
          body={handoff}
        />
      ) : null}

      {/* ── Key Dates ── */}
      <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Go-Live</p>
            <p className="mt-1 text-sm font-semibold text-emerald-300">
              {formatDate(milestones.find((m) => m.id === "go-live")?.date ?? null)}
            </p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Selection Forum</p>
            <p className="mt-1 text-sm font-semibold text-amber-300">
              {formatDate(milestones.find((m) => m.id === "selection-decision-forum")?.date ?? null)}
            </p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Audit Deck Target</p>
            <p className="mt-1 text-sm font-semibold text-cyan-300">
              {formatDate(milestones.find((m) => m.id === "audit-committee-erp-slides-due")?.date ?? null)}
            </p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Open Access (material)</p>
            <p className="mt-1 text-sm font-semibold text-rose-300">{materiallyOpenAccess.length}</p>
          </div>
        </div>
      </section>

      {/* ── Pillar Workboard — primary view ── */}
      <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Pillar Workboard</h2>
            <p className="text-xs text-slate-400">
              Current program state by pillar — what is open, what is blocked, and what is next.
            </p>
          </div>
          <span className="text-[11px] text-slate-500">Model {pillarModel.updatedAt} · {actionQueue.length} queue items</span>
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          {CORE_PILLARS.map((pid) => {
            const bucket = pillarBuckets.find((b) => b.id === pid)!;
            const summary = summaryById.get(pid);
            const baseline = bucket.baseline;
            const evidenceWaiting = evidenceSummaryByPillar.get(pid)?.waiting ?? 0;
            const allSignals = [
              ...bucket.actions.map((a) => ({ key: a.id, lane: a.lane, text: a.item })),
              ...bucket.gaps.map((g) => ({ key: `${g.deckId}-${g.id}`, lane: "Deck Gap", text: g.topic })),
            ].slice(0, 4);
            return (
              <article key={pid} className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid)}`}>
                    {bucket.shortLabel}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    {evidenceWaiting > 0 && (
                      <span className="text-rose-300">{evidenceWaiting} evidence waiting</span>
                    )}
                    {summary && (summary.deckGapCount > 0 || summary.accessCount > 0) && (
                      <span className="text-slate-500">
                        {summary.deckGapCount > 0 ? `${summary.deckGapCount} gaps` : ""}
                        {summary.deckGapCount > 0 && summary.accessCount > 0 ? " · " : ""}
                        {summary.accessCount > 0 ? `${summary.accessCount} access` : ""}
                      </span>
                    )}
                  </div>
                </div>
                {bucket.executivePrompt ? (
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">{bucket.executivePrompt}</p>
                ) : null}
                {baseline?.openItems[0] ? (
                  <p className="mt-2 text-sm text-slate-200 leading-snug">{baseline.openItems[0]}</p>
                ) : null}
                {baseline?.waitingOn[0] ? (
                  <p className="mt-1.5 text-sm text-amber-300">{baseline.waitingOn[0]}</p>
                ) : null}
                {allSignals.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-slate-700/40 pt-2">
                    {allSignals.map((s) => (
                      <li key={s.key} className="text-xs">
                        <span className="text-slate-600">{s.lane}: </span>
                        <span className="text-slate-300">{s.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
        {(() => {
          const enablement = pillarBuckets.find((b) => b.id === "enablement");
          const es = summaryById.get("enablement");
          if (!enablement) return null;
          return (
            <details className="mt-3 rounded-lg border border-violet-700/30 bg-violet-950/10">
              <summary className="cursor-pointer px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone("enablement")}`}>
                      {enablement.shortLabel}
                    </span>
                    <span className="text-xs text-slate-300">Cross-cutting support layer</span>
                  </div>
                  <span className="text-xs text-slate-400">{es?.totalSignal ?? enablement.signalCount} active signals</span>
                </div>
              </summary>
              <div className="grid gap-3 border-t border-violet-700/20 p-3 lg:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Top work items</p>
                  {enablement.actions.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">No current queue items mapped.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {enablement.actions.map((a) => (
                        <li key={a.id} className="rounded border border-slate-700/40 bg-slate-950/30 px-2 py-1 text-xs text-slate-300">
                          <span className="text-slate-500">{a.lane}:</span> {a.item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Open deck gaps</p>
                  {enablement.gaps.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">No open deck gaps mapped.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {enablement.gaps.map((g) => (
                        <li key={`${g.deckId}-${g.id}`} className="rounded border border-slate-700/40 bg-slate-950/30 px-2 py-1 text-xs text-slate-300">
                          <span className="text-slate-500">{g.deckTitle}:</span> {g.topic}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Access / platform blockers</p>
                  {enablement.accessSignals.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">No mapped access blockers.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {enablement.accessSignals.map((r) => (
                        <li key={r.id} className="rounded border border-slate-700/40 bg-slate-950/30 px-2 py-1 text-xs text-slate-300">
                          <span className="text-slate-100">{r.system}</span>: {r.status}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </details>
          );
        })()}
        <details className="mt-3 rounded-lg border border-slate-700/40 bg-slate-900/20">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cross-Pillar Queue (detail)
          </summary>
          {actionQueue.length === 0 ? (
            <p className="px-3 pb-3 text-sm text-slate-400">No urgent items detected.</p>
          ) : (
            <div className="overflow-x-auto border-t border-slate-700/40">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-slate-900/40">
                  <tr className="border-b border-slate-700/40">
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Lane</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Item</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Owner</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Due</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Pillar</th>
                    <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {actionQueue.map((a) => (
                    <tr key={a.id} className="border-b border-slate-700/30 last:border-0 align-top">
                      <td className="px-3 py-2 text-xs text-slate-400">{a.lane}</td>
                      <td className="px-3 py-2 text-slate-100">{a.item}</td>
                      <td className="px-3 py-2 text-xs text-slate-300">{a.owner}</td>
                      <td className="px-3 py-2 text-xs text-slate-300">{a.due}</td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {(a.pillars.length ? a.pillars : ["enablement"]).slice(0, 2).map((pid) => {
                            const p = pillarLabel(pid as ErpPillarId, pillarModel);
                            return (
                              <span key={`${a.id}-${pid}`} className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid as ErpPillarId)}`}>
                                {p?.shortLabel || pid}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">{a.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </details>
      </section>

      {/* ── Evidence Requests — collapsed by default ── */}
      <details className="rounded-xl border border-amber-700/30 bg-amber-950/10 p-4">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-amber-200">Evidence Requests by Pillar</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracks what has been asked for by pillar — open requests, partial responses, received.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              {CORE_PILLARS.map((pid) => {
                const stats = evidenceSummaryByPillar.get(pid);
                const pMeta = pillarLabel(pid, pillarModel);
                return (
                  <span key={pid} className="flex items-center gap-1.5">
                    <span className={`rounded-full border px-1.5 py-0.5 ${pillarTone(pid)}`}>{pMeta?.shortLabel || pid}</span>
                    {(stats?.waiting ?? 0) > 0 && <span className="text-rose-300">{stats!.waiting} awaiting</span>}
                    {(stats?.partial ?? 0) > 0 && <span className="text-amber-300">{stats!.partial} partial</span>}
                    {(stats?.received ?? 0) > 0 && <span className="text-emerald-400">{stats!.received} done</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </summary>
        <div className="mt-3 grid gap-3 border-t border-amber-700/20 pt-3 xl:grid-cols-3">
          {CORE_PILLARS.map((pid) => {
            const pMeta = pillarLabel(pid, pillarModel);
            const requests = [...pillarEvidenceRequests.filter((r) => r.pillar === pid)].sort((a, b) => {
              const p = evidenceRequestStatusPriority(a.status) - evidenceRequestStatusPriority(b.status);
              if (p !== 0) return p;
              return String(a.topic).localeCompare(String(b.topic));
            });
            const stats = evidenceSummaryByPillar.get(pid);
            return (
              <article key={`evidence-${pid}`} className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid)}`}>
                    {pMeta?.shortLabel || pid}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {(stats?.waiting ?? 0) > 0 && <span className="text-rose-300">{stats!.waiting} awaiting · </span>}
                    {stats?.partial ?? 0} partial · {stats?.received ?? 0} done
                  </span>
                </div>
                {requests.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No explicit evidence requests logged yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {requests.map((r) => (
                      <li
                        key={r.id}
                        className={`rounded border border-slate-700/40 bg-slate-950/30 p-2 ${r.status === "received" ? "opacity-50" : ""}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="flex-1 text-xs font-medium text-slate-100">{r.topic}</p>
                          <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${evidenceRequestStatusTone(r.status)}`}>
                            {r.status === "awaiting-response" ? "awaiting" : r.status.replace("-", " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">{r.sentTo}</p>
                        {r.nextMove ? <p className="mt-1 text-[11px] text-amber-400/80">Next: {r.nextMove}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
        <details className="mt-3 rounded-lg border border-amber-700/20 bg-amber-950/5">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            Recommended next evidence pull (after replies)
          </summary>
          <div className="space-y-2 border-t border-amber-700/20 p-3 text-xs text-slate-300">
            <p>
              Reporting/Data will still need a direct finance-process baseline from <span className="text-slate-100">Matt / Frederick / Adrian</span> even if Hema sends summary docs.
            </p>
            <p>
              Controls will need mapping from documented findings to <span className="text-slate-100">ERP-addressable vs non-ERP</span> remediation items.
            </p>
            <p>
              P2P should convert vendor/demo feedback into a <span className="text-slate-100">must-have workflow/control list</span> for implementation scope and design checkpoints.
            </p>
          </div>
        </details>
      </details>

      {/* ── Process Flow Scaffolds — compact summary ── */}
      <section className="rounded-xl border border-violet-700/20 bg-violet-950/10 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-violet-200">Process Flow Scaffolds</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {processFlows.flows.length} flow{processFlows.flows.length !== 1 ? "s" : ""} in progress
              {CORE_PILLARS.filter((pid) => (flowByPillar.get(pid) || []).length > 0).length > 0 && (
                <> across {CORE_PILLARS.filter((pid) => (flowByPillar.get(pid) || []).length > 0).map((pid) => pillarLabel(pid, pillarModel)?.shortLabel || pid).join(", ")}</>
              )}.
              Current vs future-state visuals — bridge between notes and executive output.
            </p>
          </div>
          <Link
            href="/abivax/spine/process-flows"
            className="flex-shrink-0 rounded border border-violet-700/40 bg-violet-900/20 px-2 py-1 text-xs text-violet-200 hover:bg-violet-900/30"
          >
            Open Process Flows
          </Link>
        </div>
      </section>

      {/* ── Operational Detail — collapsed, contains CFTI + budget + milestones + access ── */}
      <details className="rounded-xl border border-slate-700/50 bg-slate-900/20">
        <summary className="cursor-pointer px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Operational Detail (collapsed)</h2>
              <p className="text-xs text-slate-400">
                Budget, milestones, access inventory, deck gaps, and controls baseline detail.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-cyan-700/40 bg-cyan-900/20 px-2 py-0.5 text-cyan-200">
                SharePoint {sharepoint.summary.artifactCount}
              </span>
              <span className="rounded-full border border-rose-700/40 bg-rose-900/20 px-2 py-0.5 text-rose-200">
                Access blockers {materiallyOpenAccess.length}
              </span>
              <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 text-amber-200">
                Deck gaps {deckGaps.length}
              </span>
            </div>
          </div>
        </summary>

        <div className="space-y-6 border-t border-slate-700/40 p-4">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-100">Commercial Snapshot</h2>
                <Link href="/abivax/spine/budget" className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200">
                  Budget
                </Link>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-700/40">
                <table className="w-full min-w-[420px] text-sm">
                  <tbody>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-3 py-2 text-slate-500">SAP 5Y Total</td>
                      <td className="px-3 py-2 font-medium text-slate-100">{formatEur(budget.sapOffer.total5yr)}</td>
                    </tr>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-3 py-2 text-slate-500">SAP AACV</td>
                      <td className="px-3 py-2 font-medium text-slate-100">{formatEur(budget.sapOffer.aacv)}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-slate-500">SAP Valid Until</td>
                      <td className="px-3 py-2 font-medium text-amber-300">{budget.sapOffer.validUntil}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <details className="mt-3 rounded border border-slate-700/50 bg-slate-900/20 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Terms and modules
                </summary>
                <div className="mt-3 grid gap-3">
                  <ul className="space-y-1 text-xs text-slate-300">
                    {budget.sapOffer.terms.map((t) => (
                      <li key={t}>- {t}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {budget.sapOffer.modules.map((m) => (
                      <span key={m} className="rounded border border-slate-700/40 bg-slate-900/40 px-2 py-1 text-[11px] text-slate-300">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </details>
            </section>

            <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-100">Upcoming Milestones</h2>
                <Link href="/abivax/spine/timeline" className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200">
                  Timeline
                </Link>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-700/40">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-900/40">
                    <tr className="border-b border-slate-700/40">
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Date</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Milestone</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Scope</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((m) => (
                      <tr key={m.id} className="border-b border-slate-700/30 last:border-0 align-top">
                        <td className="px-3 py-2 text-xs text-slate-300">{formatDate(m.date)}</td>
                        <td className="px-3 py-2 text-slate-100">{m.label}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{m.scope}</td>
                        <td className="px-3 py-2 text-xs text-slate-300">{m.status}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{m.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-100">Access + Deck Gaps</h2>
              <div className="flex gap-3 text-xs">
                <Link href="/abivax/spine/presentations" className="text-slate-400 underline underline-offset-2 hover:text-slate-200">
                  Presentations
                </Link>
                <Link href="/abivax/spine/notes" className="text-slate-400 underline underline-offset-2 hover:text-slate-200">
                  Notes
                </Link>
              </div>
            </div>
            <div className="mt-3 grid gap-4 xl:grid-cols-2">
              <div className="overflow-x-auto rounded-lg border border-slate-700/40">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-slate-900/40">
                    <tr className="border-b border-slate-700/40">
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">System</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Owner</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Next Step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {access.requests.slice(0, 8).map((r) => (
                      <tr key={r.id} className="border-b border-slate-700/30 last:border-0 align-top">
                        <td className="px-3 py-2 text-slate-100">{r.system}</td>
                        <td className="px-3 py-2 text-xs text-slate-300">{r.status}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{r.owner}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{r.nextStep}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-700/40">
                <table className="w-full min-w-[660px] text-sm">
                  <thead className="bg-slate-900/40">
                    <tr className="border-b border-slate-700/40">
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Deck / Gap</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Owner</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Due</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Pillar</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deckGaps.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-slate-400" colSpan={5}>No open presentation data requests.</td>
                      </tr>
                    ) : (
                      deckGaps.slice(0, 8).map((g) => (
                        <tr key={`${g.deckId}-${g.id}`} className="border-b border-slate-700/30 last:border-0 align-top">
                          <td className="px-3 py-2">
                            <p className="text-slate-100">{g.topic}</p>
                            <p className="mt-1 text-xs text-slate-400">{g.deckTitle}</p>
                            <p className="mt-1 text-xs text-slate-400">{g.ask}</p>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-300">{g.owner}</td>
                          <td className="px-3 py-2 text-xs text-amber-300">{g.due}</td>
                          <td className="px-3 py-2 text-xs">
                            <div className="flex flex-wrap gap-1">
                              {(classifyErpPillars(`${g.topic} ${g.ask}`).length ? classifyErpPillars(`${g.topic} ${g.ask}`) : ["enablement"]).slice(0, 2).map((pid) => {
                                const p = pillarModel.pillars.find((x) => x.id === pid) || pillarModel.crossCutting.find((x) => x.id === pid);
                                return (
                                  <span key={`${g.deckId}-${g.id}-${pid}`} className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid as ErpPillarId)}`}>
                                    {p?.shortLabel || pid}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-300">{g.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {cftiIntake.status === "ok" ? (
            <section className="rounded-xl border border-emerald-700/20 bg-emerald-950/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-emerald-200">CFTI Controls Intake (Source-Backed)</h2>
                  <p className="text-xs text-slate-400">
                    Parsed from Youness attachment package (tracker + P2P RCM + FSCP RCM). Use this as the control/process baseline source while we map rows into pillar issues and process visuals.
                  </p>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(cftiIntake.generatedAt)}</span>
              </div>
              <div className="mt-3 grid gap-3 xl:grid-cols-4">
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Tracker Rows</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{cftiIntake.tracker?.summary.rowCount ?? 0}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Micro view controls/status rows</p>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">P2P Controls</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-200">
                    {cftiIntake.p2pRcm && "rowCount" in cftiIntake.p2pRcm.summary ? cftiIntake.p2pRcm.summary.rowCount : 0}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Gap controls: {cftiIntake.p2pRcm && "gapControlCount" in cftiIntake.p2pRcm.summary ? cftiIntake.p2pRcm.summary.gapControlCount : 0}
                  </p>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">FSCP Controls</p>
                  <p className="mt-1 text-sm font-semibold text-amber-200">
                    {cftiIntake.fscpRcm && "rowCount" in cftiIntake.fscpRcm.summary ? cftiIntake.fscpRcm.summary.rowCount : 0}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Gap controls: {cftiIntake.fscpRcm && "gapControlCount" in cftiIntake.fscpRcm.summary ? cftiIntake.fscpRcm.summary.gapControlCount : 0}
                  </p>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">ERP Gap Signals (tracker)</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-200">
                    {cftiIntake.tracker && "byGap" in cftiIntake.tracker.summary
                      ? (cftiIntake.tracker.summary.byGap.find((x) => x.key === "ERP")?.count ?? 0)
                      : 0}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">From project tracker micro-view GAP column</p>
                </div>
              </div>
              <details className="mt-3 rounded-lg border border-emerald-700/20 bg-emerald-950/5">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  CFTI Intake Highlights
                </summary>
                <div className="grid gap-3 border-t border-emerald-700/20 p-3 lg:grid-cols-3">
                  <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Tracker Processes</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {(cftiIntake.tracker && "byProcess" in cftiIntake.tracker.summary ? cftiIntake.tracker.summary.byProcess : []).slice(0, 5).map((x) => (
                        <li key={`proc-${x.key}`}>- {x.key}: {x.count}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">P2P Sample Gap Controls</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {(cftiIntake.p2pRcm && "sampleGapControls" in cftiIntake.p2pRcm.summary ? cftiIntake.p2pRcm.summary.sampleGapControls : []).slice(0, 3).map((x) => (
                        <li key={`p2p-${x.controlId}`}>- {x.controlId}: {x.controlTitle}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">FSCP Sample Gap Controls</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {(cftiIntake.fscpRcm && "sampleGapControls" in cftiIntake.fscpRcm.summary ? cftiIntake.fscpRcm.summary.sampleGapControls : []).slice(0, 3).map((x) => (
                        <li key={`fscp-${x.controlId}`}>- {x.controlId}: {x.controlTitle}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            </section>
          ) : null}

          {cftiRegister.status === "ok" ? (
            <section className="rounded-xl border border-cyan-700/20 bg-cyan-950/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-cyan-200">CFTI Control Register (Mapped)</h2>
                  <p className="text-xs text-slate-400">
                    Normalized control register merged from CFTI tracker + P2P/FSCP RCMs by Control ID. This is the bridge to a real ERP controls issue register in the app.
                  </p>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(cftiRegister.generatedAt)}</span>
              </div>
              <div className="mt-3 grid gap-3 xl:grid-cols-4">
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Mapped Controls</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{cftiRegister.summary.recordCount}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Tracker + RCM merged records</p>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">ERP Signals</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-200">{cftiRegister.summary.erpSignalCount}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Tracker ERP tag or ERP remediation mention</p>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Out-of-Scope (tracker)</p>
                  <p className="mt-1 text-sm font-semibold text-amber-200">{cftiRegister.summary.outOfScopeCount}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Current validation tracker status context</p>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Primary Pillars</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-200">
                    {cftiRegister.summary.byPrimaryPillar.map((x) => `${x.key}:${x.count}`).slice(0, 3).join(" | ")}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Counts in this block are from CFTI tracker/RCM classifications (e.g., tracker <code>GAP</code>, tracker status, ERP mentions in remediation text). They are not a direct count of all weaknesses/material weaknesses.
              </p>
              <details className="mt-3 rounded-lg border border-cyan-700/20 bg-cyan-950/5">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Register Highlights (Top statuses / gap types)
                </summary>
                <div className="grid gap-3 border-t border-cyan-700/20 p-3 lg:grid-cols-3">
                  <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Tracker Status</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {cftiRegister.summary.byTrackerStatus.slice(0, 5).map((x) => (
                        <li key={`status-${x.key}`}>- {x.key}: {x.count}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Tracker GAP</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {cftiRegister.summary.byTrackerGap.slice(0, 5).map((x) => (
                        <li key={`gap-${x.key}`}>- {x.key}: {x.count}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">P2P ERP Signal Controls (sample)</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {cftiRegister.samples.p2pErpSignals.slice(0, 4).map((x) => (
                        <li key={x.id}>- {x.controlId}: {x.controlTitle}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
              <details className="mt-3 rounded-lg border border-cyan-700/20 bg-cyan-950/5">
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Pillar Slices (Mapped Controls)
                </summary>
                <div className="grid gap-3 border-t border-cyan-700/20 p-3 xl:grid-cols-3">
                  {CORE_PILLARS.map((pid) => {
                    const records = cftiRegister.records.filter((r) => r.primaryPillar === pid);
                    const erpSignals = records.filter((r) => r.erpSignal);
                    const designGaps = records.filter((r) => r.trackerGap === "Design");
                    const nextDated = records.filter((r) => r.expectedValidationDate).slice(0, 3);
                    return (
                      <div key={`slice-${pid}`} className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid)}`}>
                            {pillarLabel(pid, pillarModel)?.shortLabel || pid}
                          </span>
                          <span className="text-[11px] text-slate-400">{records.length} controls</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                          <div className="rounded border border-slate-700/30 bg-slate-900/30 px-2 py-1 text-slate-300">
                            ERP <span className="text-slate-100">{erpSignals.length}</span>
                          </div>
                          <div className="rounded border border-slate-700/30 bg-slate-900/30 px-2 py-1 text-slate-300">
                            GAP=Design <span className="text-slate-100">{designGaps.length}</span>
                          </div>
                          <div className="rounded border border-slate-700/30 bg-slate-900/30 px-2 py-1 text-slate-300">
                            OOS <span className="text-slate-100">{records.filter((r) => r.trackerOutOfScope).length}</span>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {(erpSignals.length > 0 ? erpSignals : designGaps.length > 0 ? designGaps : records).slice(0, 3).map((r) => (
                            <div key={`${pid}-${r.id}`} className="rounded border border-slate-700/20 bg-slate-900/20 px-2 py-1">
                              <p className="text-[11px] text-slate-200">{r.controlId}: {r.controlTitle}</p>
                              <p className="text-[10px] text-slate-500">
                                {r.trackerGap || "No GAP"} • {r.trackerStatus || "No status"}{r.expectedValidationDate ? ` • due ${r.expectedValidationDate}` : ""}
                              </p>
                            </div>
                          ))}
                          {nextDated.length > 0 ? (
                            <p className="text-[10px] text-slate-500">
                              Upcoming validation dates tracked for {nextDated.length} sample control(s).
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </section>
          ) : null}
        </div>
      </details>

      {/* ── SharePoint Intake — collapsed, debug/traceability only ── */}
      <details className="rounded-xl border border-cyan-700/20 bg-cyan-950/10 p-4">
        <summary className="cursor-pointer">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-cyan-200">SharePoint Intake (v1)</h2>
              <p className="text-xs text-slate-400">
                Evidence pipeline detail. Useful for traceability/debugging, but not required for daily program scanning.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-cyan-700/40 bg-cyan-900/20 px-2 py-0.5 text-cyan-200">
                artifacts {sharepoint.summary.artifactCount}
              </span>
              <span className="rounded-full border border-emerald-700/40 bg-emerald-900/20 px-2 py-0.5 text-emerald-200">
                local matches {sharepoint.summary.localAttachmentMatches}
              </span>
              <span className="rounded-full border border-violet-700/40 bg-violet-900/20 px-2 py-0.5 text-violet-200">
                parsed text {sharepointContent.summary.artifactsWithParsedText}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-slate-300">
                updated {formatDateTime(sharepoint.generatedAt)}
              </span>
            </div>
          </div>
        </summary>

        <div className="mt-3 grid gap-4 border-t border-cyan-700/20 pt-3 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <div className="rounded border border-slate-700/40 bg-slate-900/30 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Coverage Summary</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-2 py-2 text-xs text-slate-300">
                  Source emails scanned: <span className="text-slate-100">{sharepoint.summary.sourceEmailsScanned}</span>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-2 py-2 text-xs text-slate-300">
                  Attachment bodies scanned: <span className="text-slate-100">{sharepoint.summary.attachmentBodiesScanned}</span>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-2 py-2 text-xs text-slate-300">
                  Content import (local docs): <span className="text-slate-100">{sharepointContent.summary.artifactsWithLocalFiles}</span>
                </div>
                <div className="rounded border border-slate-700/40 bg-slate-900/40 px-2 py-2 text-xs text-slate-300">
                  Parse failures: <span className="text-slate-100">{sharepointContent.summary.parseFailures}</span>
                </div>
              </div>
            </div>
            <div className="rounded border border-slate-700/40 bg-slate-900/30 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Phase Coverage</p>
              <div className="mt-2 space-y-1">
                {sharepointByPhase.length === 0 ? (
                  <p className="text-xs text-slate-500">No SharePoint artifacts ingested yet.</p>
                ) : (
                  sharepointByPhase.map(([phase, count]) => (
                    <div key={phase} className="flex items-center justify-between rounded border border-slate-700/30 bg-slate-900/40 px-2 py-1 text-xs">
                      <span className="text-slate-300">{phase}</span>
                      <span className="text-slate-100">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-700/40">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-900/40">
                <tr className="border-b border-slate-700/40">
                  <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Artifact</th>
                  <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Phase</th>
                  <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-slate-500">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {recentSharePoint.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-3 text-slate-400">No SharePoint artifacts ingested yet.</td>
                  </tr>
                ) : (
                  recentSharePoint.map((a) => (
                    <tr key={a.id} className="border-b border-slate-700/30 last:border-0 align-top">
                      {(() => {
                        const content = sharepointContentById.get(a.id);
                        const best = content?.fileEntries?.find((f) => f.textStatus === "ok") || content?.fileEntries?.[0];
                        return (
                          <>
                            <td className="px-3 py-2">
                              <p className="text-slate-100">{a.title}</p>
                              <p className="mt-1 text-xs text-slate-400 truncate max-w-[22rem]">{a.folderPath || a.site || "n/a"}</p>
                              {a.url ? (
                                <a href={a.url} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-cyan-400 hover:underline">
                                  open link
                                </a>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-300">{a.phase || "Unclassified"}</td>
                            <td className="px-3 py-2 text-xs text-slate-300">{a.itemType}{a.extension ? ` (${a.extension})` : ""}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className={`rounded-full border px-2 py-0.5 ${a.status.includes("local") ? "border-emerald-700/40 bg-emerald-900/20 text-emerald-200" : "border-slate-700 bg-slate-900/60 text-slate-300"}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-400">
                              <div className="space-y-1">
                                <div>{a.localPaths.length > 0 ? a.localPaths[0] : (a.sourceEmails[0]?.subject || "email link")}</div>
                                {best ? (
                                  <div className="rounded border border-slate-700/30 bg-slate-900/40 px-2 py-1 text-[11px] text-slate-300">
                                    {best.parser} / {best.textStatus}{best.textChars ? ` / ${best.textChars} chars` : ""}
                                    {best.parsedTextPreview ? (
                                      <div className="mt-1 text-slate-400 line-clamp-2">{best.parsedTextPreview}</div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}

