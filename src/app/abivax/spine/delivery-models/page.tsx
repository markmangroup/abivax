import { readFileSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type ImplementationOptions = {
  updatedAt: string;
  decisionFrame: {
    selectedPlatform: string;
    selectedOn: string;
    goal: string;
    operatorBias: string;
  };
  knownFacts: string[];
  models: Array<{
    id: string;
    label: string;
    name: string;
    summary: string;
    teamShape: string;
    burdenOnMike: string;
    coordinationRisk: string;
    deliveryConfidence: string;
    operatorRead: string;
    upsides: string[];
    risks: string[];
    bestWhen: string;
  }>;
  antiPatterns: string[];
  evidenceStillNeeded: string[];
};

function readOptions(): ImplementationOptions | null {
  try {
    const filePath = path.join(process.cwd(), "data", "abivax", "implementation_options.json");
    return JSON.parse(readFileSync(filePath, "utf-8")) as ImplementationOptions;
  } catch {
    return null;
  }
}

function badgeTone(value: string) {
  const low = value.toLowerCase();
  if (low.includes("high") && !low.includes("unknown")) {
    return "border-rose-700/40 bg-rose-950/30 text-rose-200";
  }
  if (low.includes("low")) {
    return "border-emerald-700/40 bg-emerald-950/30 text-emerald-200";
  }
  if (low.includes("unknown")) {
    return "border-amber-700/40 bg-amber-950/30 text-amber-200";
  }
  return "border-amber-700/40 bg-amber-950/20 text-amber-100";
}

export default function DeliveryModelsPage() {
  const data = readOptions();

  if (!data) {
    return (
      <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-5 text-sm text-rose-200">
        Implementation setup data is unavailable.
      </div>
    );
  }

  const recommended = data.models.find((model) => model.id === "oracle-plus-kpmg-pmo") ?? data.models[0];

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cyan-800/40 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.95)_60%,rgba(30,41,59,0.95))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">Delivery Models</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Recommended setup: Oracle delivery, KPMG PMO control</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              NetSuite stays the platform and likely builder, while KPMG owns day-to-day PMO, cadence, and boots-on-the-ground coordination in France.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-700/30 bg-slate-950/35 px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Updated</p>
            <p className="mt-1 text-sm font-medium text-cyan-100">{data.updatedAt}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">Platform</p>
            <p className="mt-1 text-sm font-medium text-white">{data.decisionFrame.selectedPlatform}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/80">Picked</p>
          <h2 className="mt-2 text-xl font-semibold text-emerald-100">{recommended.name}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">{recommended.operatorRead}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Builder</p>
              <p className="mt-2 text-sm font-medium text-slate-100">Oracle / NetSuite</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Day-To-Day PMO</p>
              <p className="mt-2 text-sm font-medium text-slate-100">KPMG</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Why</p>
              <p className="mt-2 text-sm font-medium text-slate-100">Best hedge against weak Oracle execution</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-amber-300/80">Condensed Read</p>
          <ul className="mt-4 space-y-3">
            <li className="rounded-xl border border-amber-900/40 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
              Oracle alone is leaner, but puts too much trust in an execution path you already doubt.
            </li>
            <li className="rounded-xl border border-amber-900/40 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
              KPMG PMO adds control, local coordination, and less direct referee work for you.
            </li>
            <li className="rounded-xl border border-amber-900/40 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
              CFGI is still worth pressure-testing, but not enough is proven yet to switch the delivery lead.
            </li>
            <li className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
              Treasury is already ingested. No need to redo Roxandra work.
            </li>
          </ul>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/35">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">One-Page Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/70 text-left">
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Setup</th>
                <th className="px-4 py-3 font-medium">Who Runs Day To Day</th>
                <th className="px-4 py-3 font-medium">Burden On Mike</th>
                <th className="px-4 py-3 font-medium">Coordination Risk</th>
                <th className="px-4 py-3 font-medium">Delivery Confidence</th>
                <th className="px-4 py-3 font-medium">Bottom Line</th>
              </tr>
            </thead>
            <tbody>
              {data.models.map((model) => {
                const isRecommended = model.id === recommended.id;
                return (
                  <tr
                    key={model.id}
                    className={`border-b border-slate-800/80 align-top ${isRecommended ? "bg-cyan-950/20" : "bg-transparent"}`}
                  >
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-100">{model.label}</p>
                        <p className="text-sm text-white">{model.name}</p>
                        {isRecommended ? (
                          <span className="inline-flex rounded-full border border-cyan-700/40 bg-cyan-950/40 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                            Recommended
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{model.teamShape}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {model.id === "oracle-direct" && "Oracle / NetSuite"}
                      {model.id === "oracle-plus-kpmg-pmo" && "KPMG PMO, Oracle builds"}
                      {model.id === "cfgi-direct" && "CFGI"}
                      {model.id === "cfgi-plus-kpmg-pmo" && "KPMG PMO + CFGI delivery"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${badgeTone(model.burdenOnMike)}`}>
                        {model.burdenOnMike}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${badgeTone(model.coordinationRisk)}`}>
                        {model.coordinationRisk}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${badgeTone(model.deliveryConfidence)}`}>
                        {model.deliveryConfidence}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{model.summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">Responsibilities In The Recommended Model</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Oracle / NetSuite</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Build and configure the system</li>
                <li>Own solution delivery staffing</li>
                <li>Answer for scope execution and technical delivery</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">KPMG PMO</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Run cadence, RAID log, and escalation</li>
                <li>Keep pressure on issue closure</li>
                <li>Handle day-to-day coordination from France</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Mike / Abivax</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Make core design and scope decisions</li>
                <li>Escalate only real issues, not every daily friction</li>
                <li>Maintain executive ownership without acting as PMO</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-rose-800/40 bg-rose-950/20 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-200">Watchouts</h2>
            <ul className="mt-4 space-y-3">
              {data.antiPatterns.slice(0, 3).map((item) => (
                <li key={item} className="rounded-xl border border-rose-900/40 bg-slate-950/30 px-4 py-3 text-sm leading-6 text-slate-300">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">Still Need To Confirm</h2>
            <ul className="mt-4 space-y-3">
              {data.evidenceStillNeeded.slice(0, 4).map((item) => (
                <li key={item} className="rounded-xl border border-slate-800/80 bg-slate-900/30 px-4 py-3 text-sm leading-6 text-slate-300">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}
