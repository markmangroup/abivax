import { loadBudget } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function formatEur(n: number) {
  return new Intl.NumberFormat("en-EU", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(n) + " €";
}

export default async function BudgetPage() {
  const { sapOffer, keyNumbers } = await loadBudget();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">Budget</h1>
        <p className="mt-1 text-sm text-slate-500">
          SAP commercial offer and key numbers. Cursor updates{" "}
          <code className="text-slate-400">/data/abivax/budget.json</code>.
        </p>
      </header>

      <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          SAP Offer (Lot 1: ERP Core)
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">5-year total</p>
            <p className="text-2xl font-semibold text-slate-100">
              {formatEur(sapOffer.total5yr)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">AACV</p>
            <p className="text-2xl font-semibold text-slate-100">
              {formatEur(sapOffer.aacv)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Valid until</p>
            <p className="text-lg font-medium text-amber-400">
              {sapOffer.validUntil}
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Terms
          </p>
          <ul className="space-y-1 text-sm text-slate-300">
            {sapOffer.terms.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Modules
          </p>
          <ul className="flex flex-wrap gap-2 text-sm text-slate-400">
            {sapOffer.modules.map((m, i) => (
              <li
                key={i}
                className="rounded-md bg-slate-800/50 px-2 py-1"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Key Numbers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[200px] text-sm">
            <tbody>
              {keyNumbers.map(({ label, value }) => (
                <tr
                  key={label}
                  className="border-b border-slate-700/30 last:border-0"
                >
                  <td className="px-4 py-2 text-slate-500">{label}</td>
                  <td className="px-4 py-2 font-medium text-slate-200">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
