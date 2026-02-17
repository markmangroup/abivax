import { readFileSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const filePath = path.join(
    process.cwd(),
    "data",
    "abivax",
    "PLAN.md"
  );
  const content = readFileSync(filePath, "utf-8");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">
          Compendium Roadmap
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Short- and long-term plan. Collapse branches that don&apos;t add
          value.
        </p>
      </header>
      <pre className="whitespace-pre-wrap rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 text-sm leading-relaxed text-slate-300">
        {content}
      </pre>
    </div>
  );
}
