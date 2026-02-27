import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEntityBySlug,
  getLinkedEntities,
  getBacklinks,
  loadEntityProfiles,
  loadNotes,
  loadSystems,
  loadIntegrations,
  loadAccessRequests,
  loadProcessFlowControlOverlays,
  loadErpPillarBaselines,
  type Entity,
  type EntityType,
  type Note,
} from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

const typeLabels: Record<EntityType, string> = {
  person: "Person",
  system: "System",
  meeting: "Meeting",
  decision: "Decision",
  concept: "Concept",
  milestone: "Milestone",
  organization: "Organization",
};

const typeColors: Record<EntityType, string> = {
  person: "bg-blue-900/50 text-blue-300",
  system: "bg-purple-900/50 text-purple-300",
  meeting: "bg-green-900/50 text-green-300",
  decision: "bg-amber-900/50 text-amber-300",
  concept: "bg-cyan-900/50 text-cyan-300",
  milestone: "bg-red-900/50 text-red-300",
  organization: "bg-slate-700/50 text-slate-300",
};

const contextLabels: Record<
  EntityType,
  { truths: string; decisions: string; risks: string; loops: string }
> = {
  person: {
    truths: "What changed around this person",
    decisions: "Pending asks and decisions",
    risks: "Execution and stakeholder risks",
    loops: "What to clarify next",
  },
  system: {
    truths: "Current system state",
    decisions: "Scope and implementation decisions",
    risks: "Delivery and control risks",
    loops: "Open technical and process loops",
  },
  meeting: {
    truths: "Meeting takeaways",
    decisions: "Decisions from this meeting",
    risks: "Unresolved risks",
    loops: "Follow-ups to close",
  },
  decision: {
    truths: "Decision context",
    decisions: "Decision status",
    risks: "Tradeoff and execution risks",
    loops: "Open dependencies",
  },
  concept: {
    truths: "Current understanding",
    decisions: "Policy/scope decisions",
    risks: "Operational risks",
    loops: "Questions to resolve",
  },
  milestone: {
    truths: "Milestone context",
    decisions: "Decisions required before date",
    risks: "Timeline risks",
    loops: "Open blockers",
  },
  organization: {
    truths: "Org-level signals",
    decisions: "Org decisions",
    risks: "Org risks",
    loops: "Cross-team open loops",
  },
};

function EntityBadge({ type }: { type: EntityType }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[type]}`}
    >
      {typeLabels[type]}
    </span>
  );
}

function EntityLink({ entity }: { entity: Entity }) {
  return (
    <Link
      href={`/abivax/spine/entity/${entity.id}`}
      className="group flex items-center gap-2 rounded-md border border-slate-700/50 bg-slate-800/30 px-3 py-2 transition-colors hover:border-slate-600 hover:bg-slate-800/60"
    >
      <EntityBadge type={entity.type} />
      <span className="text-sm text-slate-200 group-hover:text-white">
        {entity.name}
      </span>
    </Link>
  );
}

function normalize(v: string): string {
  return (v || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupe(items: string[], max: number): string[] {
  return Array.from(new Set(items.map((x) => x.trim()).filter(Boolean))).slice(0, max);
}

function shortText(input: string, maxWords: number): string {
  const words = input.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return input;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function titleCaseStatus(value: string): string {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function pillarLabel(pillarId: string): string {
  if (pillarId === "p2p") return "P2P";
  if (pillarId === "reporting-data") return "Reporting";
  if (pillarId === "controls-audit") return "Controls";
  if (pillarId === "enablement") return "Enablement";
  return pillarId;
}

function textBlob(note: Note): string {
  return normalize(
    [
      note.title || "",
      note.rawText || "",
      ...(note.summary?.truthsNow || []),
      ...(note.summary?.decisions || []),
      ...(note.summary?.risks || []),
      ...(note.summary?.openQuestions || []),
      ...(note.summary?.nextConstraints || []),
      ...(note.summary?.entityMentions || []),
    ].join("\n")
  );
}

function noteMentionsEntity(note: Note, entity: Entity): boolean {
  const blob = textBlob(note);
  if (!blob) return false;

  const keys = [entity.name, entity.id, ...(entity.aliases || [])]
    .map(normalize)
    .filter((k) => k.length >= 3);

  return keys.some((k) => {
    return blob.includes(` ${k} `) || blob.startsWith(`${k} `) || blob.endsWith(` ${k}`) || blob === k;
  });
}

function buildEntityContext(entity: Entity, notes: Note[]) {
  const related = notes
    .filter((n) => noteMentionsEntity(n, entity))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const truths = dedupe(
    related.flatMap((n) => n.summary?.truthsNow || []).map((s) => shortText(s, 18)),
    4
  );
  const decisions = dedupe(
    related.flatMap((n) => n.summary?.decisions || []).map((s) => shortText(s, 16)),
    4
  );
  const risks = dedupe(
    related.flatMap((n) => n.summary?.risks || []).map((s) => shortText(s, 16)),
    4
  );
  const openLoops = dedupe(
    related
      .flatMap((n) => [...(n.summary?.openQuestions || []), ...(n.summary?.nextConstraints || [])])
      .map((s) => shortText(s, 16)),
    5
  );

  return { related, truths, decisions, risks, openLoops };
}

function loadProjectedContext(entity: Entity) {
  try {
    const { profiles } = loadEntityProfiles();
    const p = profiles.find((x) => x.entityId === entity.id);
    if (!p) return null;
    return {
      focusHints: p.focusHints || [],
      truths: p.signalsNow || [],
      decisions: p.decisions || [],
      risks: p.risks || [],
      openLoops: p.openLoops || [],
    };
  } catch {
    return null;
  }
}

function isSystemMatch(value: string, entity: Entity): boolean {
  const n = normalize(value || "");
  if (!n) return false;
  const keys = [entity.name, entity.id, ...(entity.aliases || [])]
    .map((v) => normalize(v))
    .filter((v) => v.length >= 3);
  return keys.some((k) => n === k || n.includes(k) || k.includes(n));
}

function loadSystemInterconnectivity(entity: Entity) {
  try {
    const { systems } = loadSystems();
    const { integrations } = loadIntegrations();
    const { requests } = loadAccessRequests();
    const { overlays } = loadProcessFlowControlOverlays();

    const systemRow = systems.find((s) => isSystemMatch(s.id, entity) || isSystemMatch(s.name, entity));
    const relatedIntegrations = integrations.filter(
      (i) => isSystemMatch(i.sourceSystem, entity) || isSystemMatch(i.targetSystem, entity)
    );
    const access = requests.filter((r) => isSystemMatch(r.system, entity));
    const flowRefs = overlays.flatMap((ov) =>
      (ov.stepOverlays || [])
        .filter((step) =>
          (step.sampleControls || []).some((c) => isSystemMatch(String(c.system || ""), entity))
        )
        .map((step) => ({
          flowId: ov.flowId,
          flowTitle: ov.flowTitle,
          pillarId: ov.pillarId,
          stepId: step.stepId,
          stepLabel: step.stepLabel,
          mappedControlCount: step.summary?.mappedControlCount || 0,
          erpSignalCount: step.summary?.erpSignalCount || 0,
        }))
    );

    return { systemRow, relatedIntegrations, access, flowRefs };
  } catch {
    return { systemRow: null, relatedIntegrations: [], access: [], flowRefs: [] };
  }
}

function requestMentionsEntity(sentTo: string, entity: Entity): boolean {
  const hay = normalize(sentTo || "");
  if (!hay) return false;
  const keys = [entity.name, entity.id, ...(entity.aliases || [])]
    .flatMap((v) => [String(v || ""), ...String(v || "").split(/\s+/)])
    .map(normalize)
    .filter((v) => v.length >= 3);
  return keys.some((k) => hay.includes(k));
}

function loadPersonEvidenceRequests(entity: Entity) {
  if (entity.type !== "person") return [];
  try {
    const { baselines } = loadErpPillarBaselines();
    return baselines
      .flatMap((b) =>
        (b.evidenceRequests || [])
          .filter((r) => requestMentionsEntity(String(r.sentTo || ""), entity))
          .map((r) => ({
            pillarId: b.pillarId,
            topic: r.topic,
            status: r.status,
            sentDate: r.sentDate,
            sentTo: r.sentTo,
            nextMove: r.nextMove,
            why: r.why,
          }))
      )
      .sort((a, b) => String(b.sentDate || "").localeCompare(String(a.sentDate || "")));
  } catch {
    return [];
  }
}

function buildPersonBriefNarrative(input: {
  name: string;
  role: string;
  graphJobTitle: string;
  team: string;
  reportsTo: string;
  orgEntity: string;
  pillarHints: string[];
  waitingCount: number;
  receivedCount: number;
}): string {
  const {
    name,
    role,
    graphJobTitle,
    team,
    reportsTo,
    orgEntity,
    pillarHints,
    waitingCount,
    receivedCount,
  } = input;
  const titleText = graphJobTitle || role || "Stakeholder";
  const parts: string[] = [];
  parts.push(
    `${name} - ${titleText}${team ? `, ${team}` : ""}${reportsTo ? `, reporting to ${reportsTo}` : ""}${orgEntity ? ` (${orgEntity})` : ""}.`
  );
  if (pillarHints.length > 0) {
    parts.push(`Active ERP topics: ${pillarHints.slice(0, 3).join("; ")}.`);
  }
  if (waitingCount > 0) {
    parts.push(`${waitingCount} open request${waitingCount === 1 ? "" : "s"} pending.`);
  } else if (receivedCount > 0) {
    parts.push(`${receivedCount} received item${receivedCount === 1 ? "" : "s"} on file.`);
  }
  return parts.join(" ");
}

function PropertyValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-slate-500">-</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "number") return <span>{value.toLocaleString()}</span>;
  if (typeof value === "string") return <span>{value}</span>;
  if (Array.isArray(value)) {
    return (
      <ul className="list-inside list-disc space-y-0.5">
        {value.map((item, i) => (
          <li key={i} className="text-slate-300">
            <PropertyValue value={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="space-y-1 border-l border-slate-700 pl-2">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <span className="text-slate-500">{k}:</span>{" "}
            <PropertyValue value={v} />
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

export default async function EntityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);

  if (!entity) {
    notFound();
  }

  const linkedEntities = getLinkedEntities(entity.id);
  const backlinks = getBacklinks(entity.id);
  const { notes } = loadNotes();
  const computedContext = buildEntityContext(entity, notes);
  const projectedContext = loadProjectedContext(entity);
  const context = projectedContext
    ? {
        ...computedContext,
        focusHints: projectedContext.focusHints,
        truths: projectedContext.truths,
        decisions: projectedContext.decisions,
        risks: projectedContext.risks,
        openLoops: projectedContext.openLoops,
      }
    : { ...computedContext, focusHints: [] as string[] };
  const noteById = new Map(notes.map((n) => [n.id, n]));
  const systemInterconnectivity =
    entity.type === "system" ? loadSystemInterconnectivity(entity) : null;
  const personEvidenceRequests = entity.type === "person" ? loadPersonEvidenceRequests(entity) : [];

  const linkedByType = linkedEntities.reduce(
    (acc, e) => {
      if (!acc[e.type]) acc[e.type] = [];
      acc[e.type].push(e);
      return acc;
    },
    {} as Record<EntityType, Entity[]>
  );

  const backlinksByType = backlinks.reduce(
    (acc, e) => {
      if (!acc[e.type]) acc[e.type] = [];
      acc[e.type].push(e);
      return acc;
    },
    {} as Record<EntityType, Entity[]>
  );

  const hasProperties = Object.keys(entity.properties).length > 0;
  const hasLinked = linkedEntities.length > 0;
  const hasBacklinks = backlinks.length > 0;
  const hasMentions = entity.mentions.length > 0;
  const labels = contextLabels[entity.type];
  const graphJobTitle =
    typeof entity.properties.graphJobTitle === "string" ? entity.properties.graphJobTitle : "";
  const graphDepartment =
    typeof entity.properties.graphDepartment === "string" ? entity.properties.graphDepartment : "";
  const graphReportsTo =
    typeof entity.properties.graphReportsTo === "string" ? entity.properties.graphReportsTo : "";
  const role =
    typeof entity.properties.role === "string" && entity.properties.role
      ? entity.properties.role
      : graphJobTitle;
  const team =
    typeof entity.properties.team === "string" && entity.properties.team
      ? entity.properties.team
      : graphDepartment;
  const reportsTo =
    typeof entity.properties.reportsTo === "string" && entity.properties.reportsTo
      ? entity.properties.reportsTo
      : graphReportsTo;
  const orgEntity = typeof entity.properties.entity === "string" ? entity.properties.entity : "";
  const linkedCounts = Object.entries(linkedByType)
    .map(([type, items]) => ({ type: type as EntityType, count: items.length }))
    .sort((a, b) => b.count - a.count);
  const personSystems = linkedEntities.filter((e) => e.type === "system");
  const personOrganizations = linkedEntities.filter((e) => e.type === "organization");
  const personConcepts = linkedEntities.filter((e) => e.type === "concept");
  const personMeetings = linkedEntities.filter((e) => e.type === "meeting");
  const personPillarHints = dedupe(
    [
      ...personConcepts.map((e) => e.name),
      ...personSystems.map((e) => e.name),
      ...context.focusHints,
      ...context.truths,
    ]
      .map((v) => String(v || ""))
      .filter((v) => /(p2p|report|fp&a|fpa|sox|control|audit|treasury|integration)/i.test(v))
      .map((v) => {
        if (/p2p|procure|invoice|vendor/i.test(v)) return "P2P";
        if (/report|fp&a|fpa|ifrs|gaap|consolidation/i.test(v)) return "Reporting";
        if (/sox|control|audit/i.test(v)) return "Controls";
        if (/treasury|integration/i.test(v)) return "Enablement";
        return v;
      }),
    4
  );
  const personKeySignals = context.truths.slice(0, 3);
  const personKeyDecisions = context.decisions.slice(0, 2);
  const personWaitingRequests = personEvidenceRequests.filter((r) => /awaiting|partial/i.test(r.status));
  const personReceivedRequests = personEvidenceRequests.filter((r) => /received/i.test(r.status));
  const personKeyOpenLoops = dedupe(
    [
      ...personWaitingRequests.map((r) => `${r.topic} (${r.status.replace(/-/g, " ")})`),
      ...context.openLoops,
    ],
    4
  );
  const personKeyRisks = context.risks.slice(0, 2);
  const personNeedItems = dedupe(
    [
      ...personWaitingRequests.map((r) => r.topic),
      ...context.openLoops,
    ],
    4
  );
  const personNearTermActions = dedupe(
    [
      ...personWaitingRequests.map((r) => r.nextMove),
      ...context.decisions,
    ],
    3
  );
  const latestMentionDate = entity.mentions[0]?.date || null;
  const latestRelatedNote = context.related[0] || null;
  const backlinkCounts = Object.entries(backlinksByType)
    .map(([type, items]) => ({ type: type as EntityType, count: items.length }))
    .sort((a, b) => b.count - a.count);
  const personBriefNarrative =
    entity.type === "person"
      ? buildPersonBriefNarrative({
          name: entity.name,
          role,
          graphJobTitle,
          team,
          reportsTo,
          orgEntity,
          pillarHints: personPillarHints,
          waitingCount: personWaitingRequests.length,
          receivedCount: personReceivedRequests.length,
        })
      : "";
  const personRecentSignalCards = personKeySignals.slice(0, 2);
  const personRelevantArtifacts = dedupe(
    [
      ...personWaitingRequests.map((r) => `Request: ${r.topic}`),
      ...personReceivedRequests.map((r) => `Received: ${r.topic}`),
      ...personSystems.slice(0, 3).map((s) => `System: ${s.name}`),
      ...(latestRelatedNote ? [`Note: ${latestRelatedNote.title}`] : []),
    ],
    6
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <EntityBadge type={entity.type} />
          {entity.aliases.length > 0 && (
            <span className="text-sm text-slate-500">
              aka {entity.aliases.join(", ")}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-slate-100">{entity.name}</h1>
        {entity.description && (
          <p className="text-lg text-slate-400">{entity.description}</p>
        )}
      </div>

      {entity.type === "person" && (role || team || reportsTo || orgEntity) && (
        <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Snapshot
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {role && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Role</p>
                <p className="mt-1 text-sm text-slate-200">{role}</p>
              </div>
            )}
            {team && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Team</p>
                <p className="mt-1 text-sm text-slate-200">{team}</p>
              </div>
            )}
            {reportsTo && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Reports To</p>
                <p className="mt-1 text-sm text-slate-200">{reportsTo}</p>
              </div>
            )}
            {orgEntity && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Org</p>
                <p className="mt-1 text-sm text-slate-200">{orgEntity}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {entity.type === "person" && (
        <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Chief of Staff Brief
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
              <p className="text-sm leading-6 text-slate-200">{personBriefNarrative}</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">What We Need Next</p>
                    {personNeedItems.length > 0 ? (
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                        {personNeedItems.slice(0, 3).map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">No immediate ask tracked.</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">What&apos;s Pending</p>
                    {personWaitingRequests.length > 0 ? (
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                        {personWaitingRequests.slice(0, 3).map((r) => (
                          <li key={`${r.pillarId}-${r.topic}`}>
                            <span className="text-slate-200">{r.topic}</span>
                            <div className="text-xs text-slate-500">
                              {pillarLabel(r.pillarId)} | {titleCaseStatus(r.status)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">No pending evidence requests tracked.</p>
                    )}
                  </div>
                </div>
                {personRecentSignalCards.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">Recent Signals</p>
                    <div className="mt-2 grid gap-2">
                      {personRecentSignalCards.map((item) => (
                        <div key={item} className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3 text-sm text-slate-300">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(personNearTermActions.length > 0 || personKeyRisks.length > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {personNearTermActions.length > 0 && (
                      <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Next Moves</p>
                        <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                          {personNearTermActions.map((item) => (
                            <li key={item}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {personKeyRisks.length > 0 && (
                      <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Execution Risks</p>
                        <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                          {personKeyRisks.map((item) => (
                            <li key={item}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Relationship Status</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Latest Mention</p>
                      <p className="mt-1 text-sm text-slate-200">{latestMentionDate || "None"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Recent Note</p>
                      <p className="mt-1 text-sm text-slate-200">{latestRelatedNote ? latestRelatedNote.title : "None"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Open Requests</p>
                      <p className="mt-1 text-sm text-slate-200">{personWaitingRequests.length}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Received Evidence</p>
                      <p className="mt-1 text-sm text-slate-200">{personReceivedRequests.length}</p>
                    </div>
                  </div>
                </div>
                {personPillarHints.length > 0 && (
                  <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Current Relevance</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {personPillarHints.map((hint) => (
                        <span
                          key={hint}
                          className="rounded-full border border-cyan-700/40 bg-cyan-950/40 px-2 py-0.5 text-xs text-cyan-200"
                        >
                          {hint}
                        </span>
                      ))}
                    </div>
                    {context.focusHints.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {context.focusHints.slice(0, 3).map((hint) => (
                          <span
                            key={hint}
                            className="rounded-full border border-amber-600/40 bg-amber-950/40 px-2 py-0.5 text-xs text-amber-200"
                          >
                            {hint}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {personRelevantArtifacts.length > 0 && (
                  <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Relevant Evidence</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                      {personRelevantArtifacts.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {entity.type === "person" && (personSystems.length > 0 || personOrganizations.length > 0 || personConcepts.length > 0 || context.related.length > 0) && (
        <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workstream Interconnectivity (detail)
          </summary>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {personPillarHints.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Likely Pillar Relevance</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {personPillarHints.map((hint) => (
                      <span key={hint} className="rounded-full border border-cyan-700/40 bg-cyan-950/40 px-2 py-0.5 text-xs text-cyan-200">
                        {hint}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {personSystems.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Linked Systems</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {personSystems.slice(0, 6).map((e) => (
                      <Link
                        key={e.id}
                        href={`/abivax/spine/entity/${e.id}`}
                        className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:border-slate-500"
                      >
                        {e.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {personConcepts.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Linked Concepts</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {personConcepts.slice(0, 6).map((e) => (
                      <Link
                        key={e.id}
                        href={`/abivax/spine/entity/${e.id}`}
                        className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:border-slate-500"
                      >
                        {e.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {personOrganizations.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Organizations</p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-300">
                    {personOrganizations.slice(0, 4).map((e) => (
                      <li key={e.id}>
                        <Link href={`/abivax/spine/entity/${e.id}`} className="hover:text-white">
                          {e.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(personMeetings.length > 0 || context.related.length > 0) && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Recent Interaction Context</p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-300">
                    {personMeetings.slice(0, 2).map((e) => (
                      <li key={e.id}>
                        Meeting link:{" "}
                        <Link href={`/abivax/spine/entity/${e.id}`} className="hover:text-white">
                          {e.name}
                        </Link>
                      </li>
                    ))}
                    {context.related.slice(0, 3).map((n) => (
                      <li key={`note-${n.id}`}>
                        Note: <span className="text-slate-400">{n.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </details>
      )}

      {entity.type === "person" ? (
      <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-500">
          System Context (connectivity/detail)
        </summary>
        <div className="mt-3">
      <section className="rounded-lg border border-slate-800/60 bg-slate-950/20 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Connectivity Snapshot
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Linked Entities</p>
            <p className="mt-1 text-sm text-slate-200">{linkedEntities.length}</p>
            {linkedCounts.length > 0 ? (
              <p className="text-xs text-slate-500">
                {linkedCounts
                  .slice(0, 3)
                  .map((x) => `${typeLabels[x.type]} ${x.count}`)
                  .join(" | ")}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Referenced By</p>
            <p className="mt-1 text-sm text-slate-200">{backlinks.length}</p>
            {backlinkCounts.length > 0 ? (
              <p className="text-xs text-slate-500">
                {backlinkCounts
                  .slice(0, 3)
                  .map((x) => `${typeLabels[x.type]} ${x.count}`)
                  .join(" | ")}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Source Mentions</p>
            <p className="mt-1 text-sm text-slate-200">{entity.mentions.length}</p>
            {entity.mentions[0] ? (
              <p className="text-xs text-slate-500">Latest: {entity.mentions[0].date}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Related Notes (profile)</p>
            <p className="mt-1 text-sm text-slate-200">{context.related.length}</p>
            {context.related[0] ? (
              <p className="text-xs text-slate-500">{context.related[0].title}</p>
            ) : (
              <p className="text-xs text-slate-500">No note linkage yet</p>
            )}
          </div>
        </div>
      </section>
        </div>
      </details>
      ) : (
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Connectivity Snapshot
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Linked Entities</p>
            <p className="mt-1 text-sm text-slate-200">{linkedEntities.length}</p>
            {linkedCounts.length > 0 ? (
              <p className="text-xs text-slate-500">
                {linkedCounts
                  .slice(0, 3)
                  .map((x) => `${typeLabels[x.type]} ${x.count}`)
                  .join(" | ")}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Referenced By</p>
            <p className="mt-1 text-sm text-slate-200">{backlinks.length}</p>
            {backlinkCounts.length > 0 ? (
              <p className="text-xs text-slate-500">
                {backlinkCounts
                  .slice(0, 3)
                  .map((x) => `${typeLabels[x.type]} ${x.count}`)
                  .join(" | ")}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Source Mentions</p>
            <p className="mt-1 text-sm text-slate-200">{entity.mentions.length}</p>
            {entity.mentions[0] ? (
              <p className="text-xs text-slate-500">Latest: {entity.mentions[0].date}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Related Notes (profile)</p>
            <p className="mt-1 text-sm text-slate-200">{context.related.length}</p>
            {context.related[0] ? (
              <p className="text-xs text-slate-500">{context.related[0].title}</p>
            ) : (
              <p className="text-xs text-slate-500">No note linkage yet</p>
            )}
          </div>
        </div>
      </section>
      )}

      {entity.type === "system" && systemInterconnectivity && (
        <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            System Interconnectivity
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {systemInterconnectivity.systemRow ? (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">Category</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {systemInterconnectivity.systemRow.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">Usage</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {systemInterconnectivity.systemRow.usage}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Business Owner</p>
                      <p className="mt-1 text-sm text-slate-300">{systemInterconnectivity.systemRow.businessOwner}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">System Owner</p>
                      <p className="mt-1 text-sm text-slate-300">{systemInterconnectivity.systemRow.systemOwner}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Admin Owner</p>
                      <p className="mt-1 text-sm text-slate-300">{systemInterconnectivity.systemRow.adminOwner}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Access Model</p>
                      <p className="mt-1 text-sm text-slate-300">{systemInterconnectivity.systemRow.accessModel}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">No structured system row mapped yet.</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Integrations ({systemInterconnectivity.relatedIntegrations.length})
                </p>
                {systemInterconnectivity.relatedIntegrations.length ? (
                  <ul className="mt-1 space-y-1 text-sm text-slate-300">
                    {systemInterconnectivity.relatedIntegrations.slice(0, 5).map((i) => (
                      <li key={i.id}>
                        {i.sourceSystem} {"->"} {i.targetSystem}{" "}
                        <span className="text-slate-500">({i.feedType}, {i.frequency})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">No mapped integrations yet.</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Access Requests ({systemInterconnectivity.access.length})
                </p>
                {systemInterconnectivity.access.length ? (
                  <ul className="mt-1 space-y-1 text-sm text-slate-300">
                    {systemInterconnectivity.access.slice(0, 3).map((r) => (
                      <li key={r.id}>
                        {r.person}: {r.status}
                        {r.nextStep ? (
                          <div className="text-xs text-slate-500">{r.nextStep}</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">No access requests tracked.</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Process / Control Touchpoints ({systemInterconnectivity.flowRefs.length})
                </p>
                {systemInterconnectivity.flowRefs.length ? (
                  <ul className="mt-1 space-y-1 text-sm text-slate-300">
                    {systemInterconnectivity.flowRefs.slice(0, 4).map((f) => (
                      <li key={`${f.flowId}-${f.stepId}`}>
                        {f.flowTitle} {"->"} {f.stepLabel}
                        <span className="text-slate-500">
                          {" "}
                          ({f.mappedControlCount} controls{f.erpSignalCount ? `, ERP ${f.erpSignalCount}` : ""})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">No flow touchpoints mapped yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {entity.type !== "person" && context.focusHints.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Operator Focus
          </h2>
          <div className="flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            {context.focusHints.map((hint) => (
              <span
                key={hint}
                className="rounded-full border border-amber-600/40 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-200"
              >
                {hint}
              </span>
            ))}
          </div>
        </section>
      )}

      {(context.truths.length > 0 ||
        context.decisions.length > 0 ||
        context.risks.length > 0 ||
        context.openLoops.length > 0) && (
        entity.type === "person" ? (
        <details className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-slate-500">
            Current Context (detail)
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {context.truths.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{labels.truths}</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {context.truths.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {context.decisions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{labels.decisions}</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {context.decisions.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {context.risks.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{labels.risks}</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {context.risks.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {context.openLoops.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{labels.loops}</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {context.openLoops.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
        ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Current Context
          </h2>
          <div className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2">
            {context.truths.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{labels.truths}</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {context.truths.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {context.decisions.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{labels.decisions}</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {context.decisions.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {context.risks.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{labels.risks}</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {context.risks.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {context.openLoops.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{labels.loops}</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {context.openLoops.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
        )
      )}

      {hasProperties && (
        entity.type === "person" ? (
        <details className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-slate-500">
            Details (raw properties)
          </summary>
          <div className="mt-3">
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(entity.properties).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-300">
                    <PropertyValue value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
        ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Details
          </h2>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(entity.properties).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-300">
                    <PropertyValue value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        )
      )}

      {entity.notes && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Notes
          </h2>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {entity.notes}
            </p>
          </div>
        </section>
      )}

      {hasLinked && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Related
          </h2>
          <div className="space-y-4">
            {(Object.keys(linkedByType) as EntityType[]).map((type) => (
              <div key={type}>
                <h3 className="mb-2 text-xs font-medium text-slate-400">
                  {typeLabels[type]}s
                </h3>
                <div className="flex flex-wrap gap-2">
                  {linkedByType[type].map((e) => (
                    <EntityLink key={e.id} entity={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasBacklinks && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Referenced By
          </h2>
          <div className="space-y-4">
            {(Object.keys(backlinksByType) as EntityType[]).map((type) => (
              <div key={type}>
                <h3 className="mb-2 text-xs font-medium text-slate-400">
                  {typeLabels[type]}s
                </h3>
                <div className="flex flex-wrap gap-2">
                  {backlinksByType[type].map((e) => (
                    <EntityLink key={e.id} entity={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasMentions && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Mentioned In
          </h2>
          <div className="space-y-2">
            {entity.mentions.map((mention, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm"
              >
                <span className="text-slate-500">
                  {new Date(mention.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <Link
                  href={`/abivax/spine/notes#${mention.noteId}`}
                  className="text-slate-300 hover:text-white"
                >
                  Note: {noteById.get(mention.noteId)?.title || mention.noteId}
                </Link>
                {mention.context && (
                  <span className="text-slate-500">- {mention.context}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-slate-800 pt-4 text-xs text-slate-600">
        <p>
          Created: {new Date(entity.createdAt).toLocaleDateString()} | Updated:{" "}
          {new Date(entity.updatedAt).toLocaleDateString()}
        </p>
      </footer>
    </div>
  );
}


