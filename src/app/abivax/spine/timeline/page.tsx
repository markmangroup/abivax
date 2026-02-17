import { loadTimeline, type Milestone } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function formatDate(d: string | null) {
  if (!d) return "TBD";
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function TimelineTable({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Label
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Scope
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((m) => (
            <tr
              key={m.id}
              className="border-b border-slate-700/30 hover:bg-slate-800/30"
            >
              <td className="px-4 py-3 font-mono text-slate-300">
                {formatDate(m.date)}
              </td>
              <td className="px-4 py-3 font-medium text-slate-100">
                {m.label}
              </td>
              <td className="px-4 py-3 text-slate-400">{m.scope}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    m.status === "deadline"
                      ? "text-amber-400"
                      : m.status === "target"
                        ? "text-emerald-400"
                        : "text-slate-500"
                  }
                >
                  {m.status}
                </span>
              </td>
              <td className="max-w-xs px-4 py-3 text-slate-500">{m.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function TimelinePage() {
  const { milestones } = await loadTimeline();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">Timeline</h1>
        <p className="mt-1 text-sm text-slate-500">
          Key dates. Go-live 1/1/27 is the north star. Cursor updates{" "}
          <code className="text-slate-400">/data/abivax/timeline.json</code>.
        </p>
      </header>

      <TimelineTable milestones={milestones} />

      <p className="text-xs text-slate-500">
        {milestones.length} milestones. Add or edit via repo.
      </p>
    </div>
  );
}
