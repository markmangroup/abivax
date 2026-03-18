import { readFileSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type ImplementationOptions = {
  updatedAt: string;
  recommendedModelId?: string;
  decisionFrame: {
    selectedPlatform: string;
    goal: string;
    operatorBias: string;
  };
  models: Array<{
    id: string;
    name: string;
    summary: string;
    burdenOnMike: string;
    coordinationRisk: string;
    deliveryConfidence: string;
    operatorRead: string;
  }>;
  minimumViableModel?: {
    summary: string;
    whyLeanEnough: string;
  };
  roleTitleRecommendation?: {
    recommended: string;
    keepHrTitle: string;
  };
  antiPatterns: string[];
  internalRedFlags?: string[];
  evidenceStillNeeded: string[];
};

type ConsultantReviews = {
  kennethReview?: {
    legitCounterpoints: Array<{ title: string; why: string }>;
    boardImpact: {
      supportsCurrentPlan: string[];
      notEnoughToChangeBoardNarrative: string[];
    };
  };
  cfgiProposal?: {
    review: {
      operatorRead: string;
      watchouts: string[];
    };
  };
  kpmgProposal?: {
    keepScope: string[];
    cutFirst: string[];
  };
  referenceDiligence?: {
    questions: string[];
    namedLeadGaps: string[];
    openTrackingItems: string[];
  };
};

function readJson<T>(filename: string): T | null {
  try {
    const filePath = path.join(process.cwd(), "data", "abivax", filename);
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function badgeTone(value: string) {
  const low = value.toLowerCase();
  if (low.includes("high") && !low.includes("unknown")) return "border-rose-700/40 bg-rose-950/30 text-rose-200";
  if (low.includes("low")) return "border-emerald-700/40 bg-emerald-950/30 text-emerald-200";
  if (low.includes("unknown")) return "border-amber-700/40 bg-amber-950/30 text-amber-200";
  return "border-amber-700/40 bg-amber-950/20 text-amber-100";
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-700/40 bg-cyan-950/30 text-sm font-semibold text-cyan-200">
          {number}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-xl border border-slate-800/80 bg-slate-900/30 px-4 py-3 text-sm leading-6 text-slate-300">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function DeliveryModelsPage() {
  const data = readJson<ImplementationOptions>("implementation_options.json");
  const reviews = readJson<ConsultantReviews>("consultant_reviews.json");

  if (!data) {
    return (
      <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-5 text-sm text-rose-200">
        Implementation setup data is unavailable.
      </div>
    );
  }

  const recommended =
    data.models.find((model) => model.id === data.recommendedModelId) ?? data.models[0];
  const kpmgKeep = reviews?.kpmgProposal?.keepScope ?? [];
  const kpmgCut = reviews?.kpmgProposal?.cutFirst ?? [];
  const diligenceQuestions = [
    ...(reviews?.referenceDiligence?.questions ?? []),
    ...(reviews?.referenceDiligence?.namedLeadGaps ?? []),
  ].slice(0, 8);
  const risks = [
    ...(data.internalRedFlags ?? []),
    ...data.antiPatterns,
    ...data.evidenceStillNeeded,
  ].slice(0, 6);
  const whyThisWins = [
    "One clear builder. NetSuite owns delivery accountability instead of hiding execution behind multiple firms.",
    reviews?.kennethReview?.legitCounterpoints[0]?.why ??
      "Phase 1 stays aligned to finance, reporting, close, and controls rather than commercial modules that are not needed now.",
    data.minimumViableModel?.whyLeanEnough ??
      "The structure keeps external support where finance bandwidth is weakest without creating a second command chain.",
    reviews?.cfgiProposal?.review.operatorRead ??
      "It preserves board-week stability while keeping a credible fallback path in reserve.",
  ];

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cyan-800/40 bg-[linear-gradient(135deg,rgba(8,47,73,0.92),rgba(15,23,42,0.96)_55%,rgba(30,41,59,0.96))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">Executive Delivery View</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Keep NetSuite as builder. Keep Mike in charge. Keep KPMG narrow.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{data.decisionFrame.goal}</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-100/90">{data.decisionFrame.operatorBias}</p>
          </div>
          <div className="min-w-[220px] rounded-2xl border border-cyan-700/30 bg-slate-950/35 p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Decision</p>
            <p className="mt-2 text-lg font-semibold text-emerald-100">{recommended.name}</p>
            <div className="mt-4 grid gap-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/35 px-3 py-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Burden On Mike</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${badgeTone(recommended.burdenOnMike)}`}>{recommended.burdenOnMike}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/35 px-3 py-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Coordination Risk</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${badgeTone(recommended.coordinationRisk)}`}>{recommended.coordinationRisk}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/35 px-3 py-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Delivery Confidence</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${badgeTone(recommended.deliveryConfidence)}`}>{recommended.deliveryConfidence}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">Updated {data.updatedAt} • Platform {data.decisionFrame.selectedPlatform}</p>
          </div>
        </div>
      </header>

      <Section number="1" title="Recommended Delivery Model">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">Recommendation</p>
            <p className="mt-3 text-lg font-semibold text-emerald-100">{recommended.name}</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">{recommended.operatorRead}</p>
          </div>
          <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300">Operating Principle</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {data.minimumViableModel?.summary ??
                "Use the smallest structure that still protects controls, readiness, and finance bandwidth."}
            </p>
          </div>
        </div>
      </Section>

      <Section number="2" title="Role Definitions">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Didier</p>
            <List items={["Executive sponsor", "Final escalation point", "Budget and board cover"]} />
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Mike</p>
            <List
              items={[
                `${data.roleTitleRecommendation?.recommended ?? "ERP Program Director"} and day-to-day decision owner`,
                "Own scope, priorities, vendor management, and escalation",
                `Keep ${data.roleTitleRecommendation?.keepHrTitle ?? "corporate title"} separate from vendor-role language`,
              ]}
            />
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">NetSuite</p>
            <List items={["System builder", "Own design/build staffing", "Own migration, UAT support, cutover, and delivery execution"]} />
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">KPMG</p>
            <List items={["Targeted challenge and support layer", "Help where finance bandwidth is thin", "Do not become PMO owner or second command structure"]} />
          </div>
        </div>
      </Section>

      <Section number="3" title="Why This Model Wins">
        <div className="grid gap-3 md:grid-cols-2">
          {whyThisWins.map((item) => (
            <div key={item} className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 text-sm leading-6 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </Section>

      <Section number="4" title="KPMG Scope To Keep">
        <List items={kpmgKeep} />
      </Section>

      <Section number="5" title="KPMG Scope To Cut">
        <List items={kpmgCut} />
      </Section>

      <Section number="6" title="Open Diligence Questions For NetSuite">
        <List items={diligenceQuestions} />
      </Section>

      <Section number="7" title="Risks To Monitor">
        <List items={risks} />
      </Section>
    </div>
  );
}
