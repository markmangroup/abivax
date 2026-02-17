import { loadPeople, type Person } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function PeopleTable({ people }: { people: Person[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Entity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Need them?
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr
              key={p.id}
              className="border-b border-slate-700/30 hover:bg-slate-800/30"
            >
              <td className="px-4 py-3 font-medium text-slate-100">{p.name}</td>
              <td className="px-4 py-3 text-slate-300">{p.role}</td>
              <td className="px-4 py-3 text-slate-400">{p.entity}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    p.needThem.toLowerCase().includes("critical")
                      ? "text-amber-400"
                      : p.needThem.toLowerCase().includes("engage")
                        ? "text-emerald-400"
                        : "text-slate-400"
                  }
                >
                  {p.needThem}
                </span>
              </td>
              <td className="max-w-xs px-4 py-3 text-slate-500">
                {p.notes ? (
                  <span className="line-clamp-2" title={p.notes}>
                    {p.notes}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PeoplePage() {
  const { people } = await loadPeople();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">People</h1>
        <p className="mt-1 text-sm text-slate-500">
          Who they are, role, do you need them. Cursor updates{" "}
          <code className="text-slate-400">/data/abivax/people.json</code>.
        </p>
      </header>

      <PeopleTable people={people} />

      <p className="text-xs text-slate-500">
        {people.length} people. Add or edit via repo.
      </p>
    </div>
  );
}
