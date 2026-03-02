import { readFileSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function readBudget() {
  try {
    const p = path.join(process.cwd(), "data", "abivax", "budget.json");
    return JSON.parse(readFileSync(p, "utf-8")) as {
      selectionDecision?: {
        selectedVendor: string;
        decidedOn: string;
        eliminatedVendor: string;
        eliminationReason: string;
        selectionAdvisor: string;
      };
      commercialStatus?: {
        status: string;
        note: string;
        openDecisions: string[];
        mobilizationTarget: string;
        goLive: string;
      };
      sapOfferArchive?: {
        _note: string;
        total5yr: number;
        currency: string;
        aacv: number;
        validUntil: string;
      };
      keyNumbers?: Array<{ label: string; value: string }>;
    };
  } catch {
    return {};
  }
}

function formatEur(n: number) {
  return (
    new Intl.NumberFormat("en-EU", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(n) + " €"
  );
}

export default async function BudgetPage() {
  const data = readBudget();
  const sel = data.selectionDecision;
  const commercial = data.commercialStatus;
  const archive = data.sapOfferArchive;
  const keyNumbers = data.keyNumbers || [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">Commercial & Budget</h1>
        <p className="mt-1 text-sm text-slate-500">
          ERP vendor selection outcome and commercial status. Updates when NetSuite contract package arrives.
        </p>
      </header>

      {/* Selection Decision */}
      {sel && (
        <section className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Vendor Selection — Decided</h2>
            <span className="text-xs text-slate-500">{sel.decidedOn}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Selected</p>
              <p className="mt-0.5 text-lg font-semibold text-emerald-200">{sel.selectedVendor}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Eliminated</p>
              <p className="mt-0.5 text-base font-medium text-slate-400 line-through">{sel.eliminatedVendor}</p>
              <p className="mt-0.5 text-xs text-slate-500">{sel.eliminationReason}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Selection advisor: {sel.selectionAdvisor}</p>
        </section>
      )}

      {/* Commercial Status */}
      {commercial && (
        <section className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-300">
            Commercial Terms — {commercial.status === "pending" ? "Pending" : commercial.status}
          </h2>
          <p className="text-sm text-slate-300">{commercial.note}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Mobilization Target</p>
              <p className="mt-1 text-base font-medium text-amber-200">{commercial.mobilizationTarget}</p>
            </div>
            <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Go-Live</p>
              <p className="mt-1 text-base font-medium text-slate-200">{commercial.goLive}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Non-negotiable. Tied to US public launch Dec 2027.</p>
            </div>
          </div>

          {commercial.openDecisions.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Open Decisions</p>
              <ul className="space-y-1.5">
                {commercial.openDecisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Key Numbers */}
      {keyNumbers.length > 0 && (
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Key Program Numbers</h2>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {keyNumbers.map((kn, i) => (
              <div key={i} className="rounded-lg border border-slate-700/40 bg-slate-900/20 p-3">
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">{kn.label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-200">{kn.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* SAP Archive */}
      {archive && (
        <details className="rounded-xl border border-slate-800/60 bg-slate-900/20">
          <summary className="cursor-pointer px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-600 hover:text-slate-400">
            SAP Offer Archive (eliminated — reference only)
          </summary>
          <div className="border-t border-slate-800/60 px-5 py-4">
            <p className="mb-3 text-xs text-slate-600">{archive._note}</p>
            <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-500">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">5-year total</p>
                <p className="mt-0.5">{formatEur(archive.total5yr)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">AACV</p>
                <p className="mt-0.5">{formatEur(archive.aacv)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">Valid until</p>
                <p className="mt-0.5">{archive.validUntil}</p>
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
