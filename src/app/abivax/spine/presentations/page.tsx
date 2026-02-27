import Link from "next/link";
import { HandoffDraftPanel } from "@/app/abivax/spine/HandoffDraftPanel";
import { loadErpPillars, loadPresentations, loadProcessFlowDiagramPayloads, type Presentation } from "@/lib/abivaxData";
import { RenderedSwimlaneDiagram } from "@/app/abivax/spine/process-flows/RenderedSwimlaneDiagram";
import {
  classifyGapPillars,
  classifySlidePillars,
  collectDeckPillarCoverage,
  pillarTone,
  sortedTopPillars,
  type ErpPillarId,
} from "@/lib/erpPillars";

export const dynamic = "force-dynamic";

function badgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("draft")) return "border-slate-600 bg-slate-800 text-slate-200";
  if (s.includes("active")) return "border-cyan-700/40 bg-cyan-900/30 text-cyan-200";
  if (s.includes("review")) return "border-amber-700/40 bg-amber-900/30 text-amber-200";
  if (s.includes("ready")) return "border-emerald-700/40 bg-emerald-900/30 text-emerald-200";
  if (s.includes("blocked")) return "border-rose-700/40 bg-rose-900/30 text-rose-200";
  return "border-slate-700 bg-slate-900 text-slate-300";
}

function normalize(v: string): string {
  return v.toLowerCase().trim();
}

function includesQuery(p: Presentation, q: string): boolean {
  if (!q) return true;
  const hay = [
    p.title,
    p.audience,
    p.objective,
    ...p.narrative,
    ...p.keyMessages,
    ...p.tags,
    ...p.slidePlan.map((s) => `${s.section} ${s.title} ${s.notes}`),
    ...p.dataRequests.map((d) => `${d.topic} ${d.ask} ${d.owner}`),
    ...p.artifacts.map((a) => `${a.title} ${a.type} ${a.owner} ${a.notes}`),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

function fmtDate(v: string): string {
  const ts = Date.parse(v);
  if (Number.isNaN(ts)) return v;
  return new Date(ts).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function processVisualCaption(flowId: string) {
  if (flowId === "p2p-france-current-to-future") {
    return {
      title: "Slide use (executive)",
      lines: [
        "Current France P2P flow remains fragmented across Sage, Trustpair, Agicap, and manual handoffs.",
        "CFTI control mapping shows ERP-relevant control gaps concentrated in vendor setup, approvals, and payment execution stages.",
        "Future-state ERP design should focus on workflow enforcement, cleaner handoffs, and traceable evidence retention.",
      ],
    };
  }
  if (flowId === "reporting-fpa-bridge-current-to-future") {
    return {
      title: "Slide use (executive)",
      lines: [
        "Current reporting/FP&A flow is quarterly-first and heavily dependent on manual bridge and KPMG-supported steps.",
        "Design priority is a stronger reporting data model (dimensions/tags) and clearer internal vs KPMG ownership by step.",
        "Future-state objective is better quarterly quality now with scalable foundations for later monthly/commercial complexity.",
      ],
    };
  }
  if (flowId === "controls-remediation-current-to-future") {
    return {
      title: "Slide use (executive)",
      lines: [
        "Controls remediation should be managed as a dated operating program, not a side output of ERP configuration.",
        "CFTI tracker/RCM signals show where gaps are ERP-addressable versus design/process ownership issues.",
        "Use this visual to anchor accountability: findings, remediation tracking, and ERP control-by-design checkpoints.",
      ],
    };
  }
  return {
    title: "Slide use (executive)",
    lines: [
      "Use this visual to show current-state process complexity, control signal concentration, and future-state target direction.",
    ],
  };
}

function DeckCard({
  deck,
  pillarLabels,
}: {
  deck: Presentation;
  pillarLabels: Map<string, { shortLabel: string; label: string }>;
}) {
  const readySlides = deck.slidePlan.filter((s) => normalize(s.status).includes("ready")).length;
  const blockedSlides = deck.slidePlan.filter((s) => normalize(s.status).includes("blocked")).length;
  const openGaps = deck.dataRequests.filter((d) => !normalize(d.status).includes("closed")).length;
  const openGapItems = deck.dataRequests.filter((d) => !normalize(d.status).includes("closed"));
  const coverage = collectDeckPillarCoverage(deck);
  const topPillars = sortedTopPillars(coverage).slice(0, 4);

  return (
    <article id={deck.id} className="scroll-mt-24 rounded-xl border border-slate-700/50 bg-slate-900/30">
      <details>
        <summary className="cursor-pointer list-none p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">{deck.title}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {deck.audience} | Meeting: {deck.meetingDate} | Owner: {deck.owner}
              </p>
              <p className="mt-1 text-sm text-slate-300">{deck.objective}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topPillars.length > 0 ? topPillars.map((pid) => (
                  <span key={`${deck.id}-${pid}`} className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid as ErpPillarId)}`}>
                    {pillarLabels.get(pid)?.shortLabel || pid} ({coverage[pid]})
                  </span>
                )) : (
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400">
                    Pillar tagging pending
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block rounded-full border px-2 py-0.5 text-xs uppercase tracking-wider ${badgeClass(deck.status)}`}>
                {deck.status}
              </span>
              <p className="mt-2 text-xs text-slate-500">Updated: {fmtDate(deck.lastUpdated)}</p>
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <Link
                  href={`/abivax/spine/presentations/${deck.id}/viewer`}
                  className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                >
                  Open Live Viewer
                </Link>
                <a
                  href={`/api/abivax/presentations/${deck.id}/pptx`}
                  className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500"
                >
                  Download PPTX
                </a>
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Slides Ready</p>
              <p className="mt-1 text-sm text-slate-200">{readySlides}/{deck.slidePlan.length}</p>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Blocked</p>
              <p className="mt-1 text-sm text-rose-300">{blockedSlides}</p>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Open Data Gaps</p>
              <p className="mt-1 text-sm text-amber-300">{openGaps}</p>
            </div>
          </div>
        </summary>

        <div className="space-y-3 border-t border-slate-700/50 p-4">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top Narrative</h3>
            <ul className="space-y-1 text-sm text-slate-300">
              {deck.narrative.slice(0, 3).map((n) => (
                <li key={`${deck.id}-${n}`} className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
                  {n}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Immediate Data Gaps</h3>
            <div className="space-y-2">
              {openGapItems.slice(0, 4).map((d) => (
                <article key={d.id} className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-100">{d.topic}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${badgeClass(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Priority: {d.priority} | Owner: {d.owner} | Due: {d.due}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(classifyGapPillars(d).length ? classifyGapPillars(d) : ["enablement"]).slice(0, 2).map((pid) => (
                      <span key={`${d.id}-${pid}`} className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid as ErpPillarId)}`}>
                        {pillarLabels.get(pid)?.shortLabel || pid}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{d.ask}</p>
                </article>
              ))}
              {openGapItems.length === 0 ? (
                <p className="text-sm text-slate-400">No open data gaps.</p>
              ) : null}
            </div>
          </section>

          <details className="rounded-lg border border-slate-700/50 bg-slate-900/30">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Slide Plan
            </summary>
            <div className="space-y-2 border-t border-slate-700/50 p-3">
              {deck.slidePlan.map((s) => (
                <article key={s.id} className="rounded border border-slate-700/40 bg-slate-900/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-100">{s.section}: {s.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${badgeClass(s.status)}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Owner: {s.owner} | Evidence: {s.evidenceStatus}
                    {s.visual ? ` | Visual: ${s.visual}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(classifySlidePillars(s).length ? classifySlidePillars(s) : ["enablement"]).slice(0, 2).map((pid) => (
                      <span key={`${s.id}-${pid}`} className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid as ErpPillarId)}`}>
                        {pillarLabels.get(pid)?.shortLabel || pid}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{s.notes}</p>
                  {s.content && s.content.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {s.content.slice(0, 3).map((line) => (
                        <li key={`${s.id}-${line}`} className="rounded bg-slate-950/40 px-2 py-1">
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </details>

          <details className="rounded-lg border border-slate-700/50 bg-slate-900/30">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sources and Audit Trail
            </summary>
            <div className="space-y-2 border-t border-slate-700/50 p-3">
              <div className="space-y-2">
                {deck.artifacts.map((a) => (
                  <article key={a.id} className="rounded border border-slate-700/40 bg-slate-900/40 p-3">
                    <p className="text-sm font-medium text-slate-100">{a.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {a.type} | {a.source} | {a.owner}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{a.notes}</p>
                    {a.link ? (
                      <a href={a.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-sky-300 underline underline-offset-2">
                        Open reference
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
              <div className="space-y-1">
                {deck.actionLog.map((l) => (
                  <p key={`${deck.id}-${l.date}-${l.action}`} className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-sm text-slate-300">
                    <span className="text-slate-500">{l.date}</span> | {l.author} | {l.action}
                  </p>
                ))}
              </div>
            </div>
          </details>
        </div>
      </details>
    </article>
  );
}

export default async function PresentationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; audience?: string; status?: string; handoff?: string; source?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const audience = (params.audience || "").trim();
  const status = (params.status || "").trim();
  const handoff = (params.handoff || "").trim();
  const handoffSource = (params.source || "Today").trim();

  const { presentations } = loadPresentations();
  const diagramPayloads = loadProcessFlowDiagramPayloads();
  const pillarModel = loadErpPillars();
  const pillarLabels = new Map(
    [...pillarModel.pillars, ...pillarModel.crossCutting].map((p) => [p.id, { shortLabel: p.shortLabel, label: p.label }])
  );
  const audienceValues = [...new Set(presentations.map((p) => p.audience))];
  const statusValues = [...new Set(presentations.map((p) => p.status))];

  const filtered = presentations.filter((p) => {
    if (audience && normalize(p.audience) !== normalize(audience)) return false;
    if (status && normalize(p.status) !== normalize(status)) return false;
    if (!includesQuery(p, q)) return false;
    return true;
  });
  const aggregateCoverage = filtered.reduce<Record<string, number>>((acc, deck) => {
    const c = collectDeckPillarCoverage(deck);
    for (const [k, v] of Object.entries(c)) acc[k] = (acc[k] || 0) + v;
    return acc;
  }, {});
  const aggregateTop = Object.entries(aggregateCoverage)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-100">Presentations Workspace</h1>
        <p className="text-sm text-slate-400">
          Compact deck workspace for board/audit prep. Start with summaries, then expand only the deck you are actively working.
        </p>
      </header>

      {handoff ? (
        <HandoffDraftPanel
          title="Inbound Deck Handoff Draft"
          sourceLabel={handoffSource}
          body={handoff}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-4">
        <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Decks</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">{presentations.length}</p>
        </article>
        <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">In Scope</p>
          <p className="mt-1 text-lg font-semibold text-cyan-300">{filtered.length}</p>
        </article>
        <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Open Data Gaps</p>
          <p className="mt-1 text-lg font-semibold text-amber-300">
            {filtered
              .flatMap((d) => d.dataRequests)
              .filter((r) => !normalize(r.status).includes("closed")).length}
          </p>
        </article>
        <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Blocked Slides</p>
          <p className="mt-1 text-lg font-semibold text-rose-300">
            {filtered.flatMap((d) => d.slidePlan).filter((s) => normalize(s.status).includes("blocked")).length}
          </p>
        </article>
      </section>

      {diagramPayloads.status === "ok" ? (
        <section className="rounded-xl border border-cyan-700/20 bg-cyan-950/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-cyan-200">Process Visual Assets (Reusable)</h2>
              <p className="text-xs text-slate-400">
                Canonical process/swimlane previews generated from process scaffolds + CFTI controls. Reuse these in the living executive deck and board/audit derivatives.
              </p>
            </div>
            <span className="text-xs text-slate-400">{diagramPayloads.payloads.length} payload(s)</span>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {diagramPayloads.payloads.map((p) => (
              <details key={`deck-visual-${p.flowId}`} className="rounded-lg border border-slate-700/40 bg-slate-900/30">
                <summary className="cursor-pointer px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{p.title}</p>
                      <p className="text-xs text-slate-400">
                        {p.nodes.filter((n) => n.type === "step").length} steps | {p.nodes.filter((n) => n.type === "control-cluster").length} control clusters
                      </p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(p.pillarId as ErpPillarId)}`}>
                      {pillarLabels.get(p.pillarId)?.shortLabel || p.pillarId}
                    </span>
                  </div>
                </summary>
                <div className="border-t border-slate-700/40 p-3">
                  <RenderedSwimlaneDiagram payload={p} variant="slide" showLegend={false} />
                  <div className="mt-3 rounded-md border border-slate-700/40 bg-slate-950/20 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {processVisualCaption(p.flowId).title}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-300">
                      {processVisualCaption(p.flowId).lines.map((line) => (
                        <li key={`${p.flowId}-${line}`} className="rounded bg-slate-900/40 px-2 py-1">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">ERP Pillar Coverage (Decks in Scope)</h2>
            <p className="text-xs text-slate-400">Keeps board/audit storytelling balanced across P2P, Reporting, and Controls.</p>
          </div>
          <span className="text-xs text-slate-500">Model updated: {pillarModel.updatedAt}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {aggregateTop.length > 0 ? aggregateTop.map(([pid, count]) => (
            <span key={`agg-${pid}`} className={`rounded-full border px-2 py-1 text-xs ${pillarTone(pid as ErpPillarId)}`}>
              {(pillarLabels.get(pid)?.shortLabel || pid)} ({count})
            </span>
          )) : (
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400">
              No pillar coverage detected yet
            </span>
          )}
        </div>
      </section>

      <form method="GET" className="grid gap-3 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 md:grid-cols-[1fr_220px_220px_auto]">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search topic, slide, source, or owner..."
          className="rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        />
        <select
          name="audience"
          defaultValue={audience}
          className="rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        >
          <option value="">All audiences</option>
          {audienceValues.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        >
          <option value="">All statuses</option>
          {statusValues.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500">
            Apply
          </button>
          <Link href="/abivax/spine/presentations" className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            Reset
          </Link>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 lg:sticky lg:top-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Deck Index</p>
          <nav className="space-y-1 text-sm">
            {filtered.map((p) => (
              <a key={p.id} href={`#${p.id}`} className="block rounded px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
                {p.title}
              </a>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400">No presentations match your current filters.</p>
          ) : (
            filtered.map((deck) => <DeckCard key={deck.id} deck={deck} pillarLabels={pillarLabels} />)
          )}
        </main>
      </div>
    </div>
  );
}
