import Link from "next/link";
import { existsSync, readdirSync } from "fs";
import path from "path";
import { HandoffDraftPanel } from "@/app/abivax/spine/HandoffDraftPanel";
import {
  loadErpPillars,
  loadPresentations,
  loadProcessFlowDiagramPayloads,
  type Presentation,
} from "@/lib/abivaxData";
import { RenderedSwimlaneDiagram } from "@/app/abivax/spine/process-flows/RenderedSwimlaneDiagram";
import { pillarTone, type ErpPillarId } from "@/lib/erpPillars";

export const dynamic = "force-dynamic";

function getSlideCount(deckId: string): number {
  const dir = path.join(
    process.cwd(),
    "outputs",
    "presentations",
    "thumbnails",
    deckId
  );
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith(".jpg")).length;
}

function badgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("draft")) return "border-slate-600 bg-slate-800 text-slate-200";
  if (s.includes("active")) return "border-cyan-700/40 bg-cyan-900/30 text-cyan-200";
  if (s.includes("review")) return "border-amber-700/40 bg-amber-900/30 text-amber-200";
  if (s.includes("ready")) return "border-emerald-700/40 bg-emerald-900/30 text-emerald-200";
  if (s.includes("blocked")) return "border-rose-700/40 bg-rose-900/30 text-rose-200";
  return "border-slate-700 bg-slate-900 text-slate-300";
}

function fmtDate(v: string): string {
  const ts = Date.parse(v);
  if (Number.isNaN(ts)) return v;
  return new Date(ts).toLocaleDateString(undefined, { dateStyle: "medium" });
}

// Which swimlane flows are relevant for each deck
const DECK_SWIMLANES: Record<string, string[]> = {
  "audit-committee-erp-controls-202603week": [
    "p2p-france-current-to-future",
    "reporting-fpa-bridge-current-to-future",
    "controls-remediation-current-to-future",
  ],
  "exec-erp-program-backbone-living": [
    "p2p-france-current-to-future",
    "reporting-fpa-bridge-current-to-future",
    "controls-remediation-current-to-future",
  ],
};

function DeckCard({
  deck,
  slideCount,
  pillarLabels,
  swimlanePayloads,
}: {
  deck: Presentation;
  slideCount: number;
  pillarLabels: Map<string, { shortLabel: string; label: string }>;
  swimlanePayloads: ReturnType<
    typeof loadProcessFlowDiagramPayloads
  >["payloads"];
}) {
  const openGaps = deck.dataRequests.filter(
    (d) => !d.status.toLowerCase().includes("closed")
  );
  const relevantFlowIds = DECK_SWIMLANES[deck.id] ?? [];
  const relevantPayloads = swimlanePayloads.filter((p) =>
    relevantFlowIds.includes(p.flowId)
  );

  return (
    <article className="rounded-xl border border-slate-700/50 bg-slate-900/30">
      {/* Deck header — always visible */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100">
              {deck.title}
            </h2>
            <span
              className={`inline-block rounded-full border px-2 py-0.5 text-xs uppercase tracking-wider ${badgeClass(deck.status)}`}
            >
              {deck.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-400">
            {deck.audience} · Meeting: {deck.meetingDate} · Owner:{" "}
            {deck.owner}
          </p>
          <p className="mt-1 text-sm text-slate-300">{deck.objective}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>
              <span className="text-slate-200">{slideCount}</span> slides
              generated
            </span>
            {openGaps.length > 0 ? (
              <span>
                <span className="text-amber-300">{openGaps.length}</span> open
                data gap{openGaps.length !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-emerald-400">No open data gaps</span>
            )}
            <span>Updated: {fmtDate(deck.lastUpdated)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {slideCount > 0 ? (
            <Link
              href={`/abivax/spine/presentations/${deck.id}/viewer`}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              View Slides
            </Link>
          ) : null}
          <a
            href={`/api/abivax/presentations/${deck.id}/pptx`}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500"
          >
            Download PPTX
          </a>
        </div>
      </div>

      {/* Open data gaps — shown if any */}
      {openGaps.length > 0 ? (
        <div className="border-t border-slate-700/50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Open Data Gaps
          </p>
          <div className="space-y-2">
            {openGaps.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-amber-700/20 bg-amber-900/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">
                    {d.topic}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Owner: {d.owner} · Due: {d.due} · Priority: {d.priority}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">{d.ask}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Expandable: slide plan */}
      <details className="border-t border-slate-700/50">
        <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300">
          Slide Plan ({deck.slidePlan.length} slides)
        </summary>
        <div className="space-y-2 px-4 pb-4 pt-2">
          {deck.slidePlan.map((s) => (
            <article
              key={s.id}
              className="rounded border border-slate-700/40 bg-slate-900/40 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-100">
                  {s.section}: {s.title}
                </p>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${badgeClass(s.status)}`}
                >
                  {s.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Owner: {s.owner} · Evidence: {s.evidenceStatus}
              </p>
              <p className="mt-1 text-sm text-slate-300">{s.notes}</p>
            </article>
          ))}
        </div>
      </details>

      {/* Swimlane visuals — only for relevant decks */}
      {relevantPayloads.length > 0 ? (
        <details className="border-t border-slate-700/50">
          <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300">
            Process Visuals ({relevantPayloads.length})
          </summary>
          <div className="space-y-4 px-4 pb-4 pt-2">
            {relevantPayloads.map((p) => (
              <div key={p.flowId}>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-100">
                    {p.title}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(p.pillarId as ErpPillarId)}`}
                  >
                    {pillarLabels.get(p.pillarId)?.shortLabel || p.pillarId}
                  </span>
                </div>
                <RenderedSwimlaneDiagram
                  payload={p}
                  variant="slide"
                  showLegend={false}
                />
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {/* Expandable: sources */}
      {deck.artifacts.length > 0 ? (
        <details className="border-t border-slate-700/50">
          <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300">
            Sources ({deck.artifacts.length})
          </summary>
          <div className="space-y-2 px-4 pb-4 pt-2">
            {deck.artifacts.map((a) => (
              <article
                key={a.id}
                className="rounded border border-slate-700/40 bg-slate-900/40 p-3"
              >
                <p className="text-sm font-medium text-slate-100">{a.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {a.type} · {a.source} · {a.owner}
                </p>
                <p className="mt-1 text-sm text-slate-300">{a.notes}</p>
                {a.link ? (
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-sky-300 underline underline-offset-2"
                  >
                    Open reference
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </article>
  );
}

export default async function PresentationsPage({
  searchParams,
}: {
  searchParams: Promise<{ handoff?: string; source?: string }>;
}) {
  const params = await searchParams;
  const handoff = (params.handoff || "").trim();
  const handoffSource = (params.source || "Today").trim();

  const { presentations } = loadPresentations();
  const diagramPayloads = loadProcessFlowDiagramPayloads();
  const pillarModel = loadErpPillars();
  const pillarLabels = new Map(
    [...pillarModel.pillars, ...pillarModel.crossCutting].map((p) => [
      p.id,
      { shortLabel: p.shortLabel, label: p.label },
    ])
  );

  const swimlanePayloads =
    diagramPayloads.status === "ok" ? diagramPayloads.payloads : [];

  const totalGaps = presentations
    .flatMap((d) => d.dataRequests)
    .filter((r) => !r.status.toLowerCase().includes("closed")).length;

  const totalSlides = presentations.reduce(
    (sum, d) => sum + getSlideCount(d.id),
    0
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            Presentations Workspace
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {presentations.length} decks · {totalSlides} slides generated ·{" "}
            {totalGaps > 0 ? (
              <span className="text-amber-300">{totalGaps} open data gaps</span>
            ) : (
              <span className="text-emerald-400">all gaps closed</span>
            )}
          </p>
        </div>
      </header>

      {handoff ? (
        <HandoffDraftPanel
          title="Inbound Deck Handoff Draft"
          sourceLabel={handoffSource}
          body={handoff}
        />
      ) : null}

      <div className="space-y-5">
        {presentations.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            slideCount={getSlideCount(deck.id)}
            pillarLabels={pillarLabels}
            swimlanePayloads={swimlanePayloads}
          />
        ))}
      </div>
    </div>
  );
}
