import { loadTimeline, type Milestone } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function formatDate(d: string | null) {
  if (!d) return "TBD";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysFromNow(d: string | null): number | null {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  const target = new Date(y, m - 1, day).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}

function dotClasses(status: string): string {
  switch (status) {
    case "completed": return "bg-slate-600 border-slate-500";
    case "next":      return "bg-amber-400 border-amber-300";
    case "deadline":  return "bg-rose-500 border-rose-400";
    case "target":    return "bg-emerald-500 border-emerald-400";
    default:          return "bg-slate-700 border-slate-600";
  }
}

function pillClasses(status: string): string {
  switch (status) {
    case "completed": return "border-slate-700/40 text-slate-500";
    case "next":      return "border-amber-700/40 bg-amber-950/30 text-amber-300";
    case "deadline":  return "border-rose-700/40 bg-rose-950/20 text-rose-300";
    case "target":    return "border-emerald-700/40 bg-emerald-950/20 text-emerald-300";
    default:          return "border-slate-700/40 text-slate-500";
  }
}

function DaysChip({ days, isPastItem }: { days: number | null; isPastItem?: boolean }) {
  if (days === null) return <span className="text-[11px] text-slate-600">no date set</span>;
  if (isPastItem || days < 0)
    return <span className="text-[11px] text-slate-500">{Math.abs(days)}d ago</span>;
  if (days === 0)
    return <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400">Today</span>;
  if (days === 1)
    return <span className="rounded bg-amber-900/30 px-1.5 py-0.5 text-[11px] text-amber-300">Tomorrow</span>;
  if (days <= 7)
    return <span className="rounded bg-amber-900/20 px-1.5 py-0.5 text-[11px] text-amber-300">{days}d</span>;
  if (days <= 60)
    return <span className="rounded bg-slate-800/50 px-1.5 py-0.5 text-[11px] text-slate-300">{days}d</span>;
  const months = Math.round(days / 30.4);
  return <span className="rounded bg-slate-800/30 px-1.5 py-0.5 text-[11px] text-slate-400">~{months} mo</span>;
}

type PhaseConfig = {
  id: string;
  label: string;
  sublabel: string;
  ids: string[];
  borderClass: string;
  bgClass: string;
  headingClass: string;
  labelClass: string;
  railClass: string;
};

// Program phases — reflects the known Abivax ERP program arc
const PHASES: PhaseConfig[] = [
  {
    id: "post-selection",
    label: "Post-Selection",
    sublabel: "Decision made. Notify NetSuite, open commercial negotiation, align stakeholders.",
    ids: ["selection-decision-forum", "netsuite-notify-negotiate"],
    borderClass: "border-amber-700/30",
    bgClass: "bg-amber-950/10",
    headingClass: "text-amber-200",
    labelClass: "text-amber-600",
    railClass: "bg-amber-700/25",
  },
  {
    id: "q1-gates",
    label: "Q1 Gates",
    sublabel: "Audit Committee deck, Board decision communication, SAP offer expiry.",
    ids: ["audit-committee-erp-slides-due", "board-meeting", "sap-offer-expiry"],
    borderClass: "border-rose-700/30",
    bgClass: "bg-rose-950/10",
    headingClass: "text-rose-200",
    labelClass: "text-rose-600",
    railClass: "bg-rose-700/20",
  },
  {
    id: "mobilization",
    label: "Mobilization",
    sublabel: "Implementation work begins in earnest. Target: early April 2026.",
    ids: ["implementation-kickoff-target-apr"],
    borderClass: "border-violet-700/30",
    bgClass: "bg-violet-950/10",
    headingClass: "text-violet-200",
    labelClass: "text-violet-600",
    railClass: "bg-violet-700/20",
  },
  {
    id: "go-live",
    label: "Go-Live & Beyond",
    sublabel: "ERP live for P2P + Financial Reporting. US public launch supported.",
    ids: ["go-live", "us-launch"],
    borderClass: "border-emerald-700/30",
    bgClass: "bg-emerald-950/10",
    headingClass: "text-emerald-200",
    labelClass: "text-emerald-600",
    railClass: "bg-emerald-700/20",
  },
];

const ALL_PHASE_IDS: string[] = PHASES.flatMap((p) => p.ids);

function MilestoneRow({
  m,
  isFirst,
  dimmed,
}: {
  m: Milestone;
  isFirst: boolean;
  dimmed?: boolean;
}) {
  const days = daysFromNow(m.date);
  const isPastItem = dimmed || m.status === "completed" || (days !== null && days < 0);

  return (
    <div className={`relative flex gap-4 py-3.5 ${isPastItem ? "opacity-40" : ""}`}>
      {/* Dot on the rail */}
      <div className="relative z-10 mt-[4px] shrink-0">
        <div
          className={`h-3 w-3 rounded-full border-2 ${
            isPastItem ? "border-slate-600 bg-slate-700" : dotClasses(m.status)
          }`}
          style={isFirst && !isPastItem ? { boxShadow: "0 0 7px rgba(251,191,36,0.4)" } : undefined}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-slate-400">{formatDate(m.date)}</span>
          <DaysChip days={days} isPastItem={isPastItem} />
        </div>
        <p
          className={`mt-0.5 font-medium leading-snug ${
            isPastItem
              ? "text-sm text-slate-500"
              : isFirst
                ? "text-[15px] text-white"
                : "text-sm text-slate-100"
          }`}
        >
          {m.label}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] ${
              isPastItem ? "border-slate-700/40 text-slate-600" : pillClasses(m.status)
            }`}
          >
            {m.status}
          </span>
          <span className="text-[11px] text-slate-500">{m.scope}</span>
        </div>
        {m.notes && (
          <p className={`mt-1.5 max-w-prose text-xs leading-relaxed ${isPastItem ? "text-slate-600" : "text-slate-400"}`}>
            {m.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function PhaseCard({
  phase,
  items,
  nowMs,
}: {
  phase: PhaseConfig;
  items: Milestone[];
  nowMs: number;
}) {
  const firstUpcoming = items.find((m) => {
    if (m.status === "completed") return false;
    if (!m.date) return true;
    const [y, mo, d] = m.date.split("-").map(Number);
    return new Date(y, mo - 1, d).setHours(0, 0, 0, 0) >= nowMs;
  });
  const phaseFirstDays = firstUpcoming ? daysFromNow(firstUpcoming.date) : null;
  const allDone = items.every((m) => m.status === "completed");

  return (
    <div className={`rounded-xl border ${phase.borderClass} ${phase.bgClass} overflow-hidden`}>
      {/* Phase header */}
      <div className={`border-b ${phase.borderClass} px-4 py-3`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${phase.labelClass}`}>
              {phase.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{phase.sublabel}</p>
          </div>
          <span className="text-[11px] text-slate-500 shrink-0">
            {allDone
              ? "Completed"
              : phaseFirstDays === null
                ? ""
                : phaseFirstDays === 0
                  ? "Active now"
                  : phaseFirstDays === 1
                    ? "Starts tomorrow"
                    : phaseFirstDays > 0
                      ? `Starts in ${phaseFirstDays}d`
                      : ""}
          </span>
        </div>
      </div>

      {/* Milestone rows */}
      <div className="relative px-4 py-1">
        <div className={`absolute left-[19px] top-2 bottom-2 w-px ${phase.railClass}`} />
        {items.map((m, idx) => (
          <MilestoneRow
            key={m.id}
            m={m}
            isFirst={m === firstUpcoming}
            dimmed={m.status === "completed" || (!!m.date && idx < items.indexOf(firstUpcoming ?? items[0]))}
          />
        ))}
      </div>
    </div>
  );
}

export default async function TimelinePage() {
  const { milestones } = await loadTimeline();
  const nowMs = new Date().setHours(0, 0, 0, 0);

  function sortByDate(list: Milestone[]): Milestone[] {
    return [...list].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return Date.parse(a.date) - Date.parse(b.date);
    });
  }

  const phaseMap = new Map<string, Milestone[]>(
    PHASES.map((p) => [
      p.id,
      sortByDate(milestones.filter((m) => p.ids.includes(m.id))),
    ])
  );

  // Overflow: milestones not assigned to any phase
  const unclassified = sortByDate(
    milestones.filter((m) => !ALL_PHASE_IDS.includes(m.id) && !!m.date)
  );
  const pendingDate = sortByDate(
    milestones.filter((m) => !ALL_PHASE_IDS.includes(m.id) && !m.date)
  );

  // Summary bar data
  const goLive = milestones.find((m) => m.id === "go-live");
  const goLiveDays = daysFromNow(goLive?.date ?? null);

  const kickoff = milestones.find((m) => m.id === "implementation-kickoff-target-apr");
  const kickoffDays = daysFromNow(kickoff?.date ?? null);

  const implGapMonths =
    kickoffDays !== null && goLiveDays !== null && goLiveDays > kickoffDays
      ? Math.round((goLiveDays - kickoffDays) / 30.4)
      : null;

  const allUpcoming = sortByDate(
    milestones.filter((m) => {
      if (m.status === "completed") return false;
      if (!m.date) return false;
      const [y, mo, d] = m.date.split("-").map(Number);
      return new Date(y, mo - 1, d).setHours(0, 0, 0, 0) >= nowMs;
    })
  );
  const nextUp = allUpcoming[0];
  const nextDeadline = allUpcoming.find((m) => m.status === "deadline");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">Timeline</h1>
        <p className="mt-1 text-sm text-slate-500">
          ERP program arc. North star: Go-Live Jan 1, 2027.
        </p>
      </header>

      {/* Summary bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-700/30 bg-emerald-950/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-emerald-600">Go-Live Target</p>
          <p className="mt-1 text-base font-semibold text-emerald-300">Jan 1, 2027</p>
          {goLiveDays !== null && (
            <p className="mt-0.5 text-[11px] text-emerald-600/80">
              ~{Math.round(goLiveDays / 30)} months away
            </p>
          )}
        </div>
        <div className="rounded-lg border border-amber-700/30 bg-amber-950/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-amber-600">Next Up</p>
          <p className="mt-1 text-sm font-semibold text-amber-200 line-clamp-1">
            {nextUp?.label ?? "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-amber-600/80">
            {nextUp?.date ? formatDate(nextUp.date) : "TBD"}
          </p>
        </div>
        <div className="rounded-lg border border-rose-700/30 bg-rose-950/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-rose-600">Next Deadline</p>
          <p className="mt-1 text-sm font-semibold text-rose-200 line-clamp-1">
            {nextDeadline?.label ?? "None"}
          </p>
          <p className="mt-0.5 text-[11px] text-rose-600/80">
            {nextDeadline?.date ? formatDate(nextDeadline.date) : "—"}
          </p>
        </div>
      </div>

      {/* Phase-based timeline */}
      <div className="space-y-3">
        {PHASES.map((phase) => {
          const items = phaseMap.get(phase.id) ?? [];
          if (items.length === 0) return null;

          const showGapAfter =
            phase.id === "mobilization" &&
            implGapMonths !== null &&
            implGapMonths > 1;

          return (
            <div key={phase.id} className="space-y-3">
              <PhaseCard phase={phase} items={items} nowMs={nowMs} />

              {/* Implementation gap bridge — shown after mobilization, before go-live */}
              {showGapAfter && (
                <div className="flex items-center gap-3 px-1">
                  <div className="h-px flex-1 bg-slate-700/30" />
                  <div className="flex items-center gap-2 rounded border border-slate-700/30 bg-slate-900/40 px-3 py-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-1 w-1 rounded-full bg-slate-600" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      ~{implGapMonths}-month implementation period
                    </span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-1 w-1 rounded-full bg-slate-600" />
                      ))}
                    </div>
                  </div>
                  <div className="h-px flex-1 bg-slate-700/30" />
                </div>
              )}
            </div>
          );
        })}

        {/* Unclassified future milestones */}
        {unclassified.length > 0 && (
          <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 overflow-hidden">
            <div className="border-b border-slate-700/40 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Other Milestones</p>
            </div>
            <div className="relative px-4 py-1">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-700/30" />
              {unclassified.map((m, idx) => (
                <MilestoneRow key={m.id} m={m} isFirst={idx === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Pending date / TBD */}
        {pendingDate.length > 0 && (
          <div className="rounded-xl border border-slate-700/30 bg-slate-900/20 overflow-hidden">
            <div className="border-b border-slate-700/30 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Pending Date</p>
            </div>
            <div className="relative px-4 py-1 opacity-50">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-700/20" />
              {pendingDate.map((m, idx) => (
                <MilestoneRow key={m.id} m={m} isFirst={idx === 0} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-5 text-[11px] text-slate-500">
        {[
          { cls: "border-emerald-400 bg-emerald-500", label: "target" },
          { cls: "border-rose-400 bg-rose-500", label: "deadline" },
          { cls: "border-amber-300 bg-amber-400", label: "next" },
          { cls: "border-slate-600 bg-slate-700", label: "tbd / completed" },
        ].map(({ cls, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border ${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
