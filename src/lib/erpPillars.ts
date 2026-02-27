import type { Presentation, PresentationGap, PresentationSlide } from "@/lib/abivaxData";

export type ErpPillarId = "p2p" | "reporting-data" | "controls-audit" | "enablement";

const KEYWORDS: Record<ErpPillarId, string[]> = {
  p2p: [
    "p2p",
    "procure",
    "purchase order",
    "po ",
    "invoice",
    "vendor",
    "trustpair",
    "payment",
    "approval",
    "expense",
    "concur",
    "1099",
  ],
  "reporting-data": [
    "reporting",
    "ifrs",
    "gaap",
    "french gaap",
    "sec",
    "close",
    "consolidation",
    "bridge",
    "coa",
    "chart of accounts",
    "cost center",
    "fp&a",
    "fpa",
    "adaptive",
    "extract",
    "data model",
    "currency",
    "fx",
    "multi-gaap",
  ],
  "controls-audit": [
    "sox",
    "control",
    "audit",
    "auditability",
    "deficiency",
    "remediation",
    "evidence",
    "segregation",
    "sod",
    "traceability",
    "approval workflow",
  ],
  enablement: [
    "integration",
    "interface",
    "it",
    "architecture",
    "resourcing",
    "capacity",
    "access",
    "timeline",
    "go-live",
    "go live",
    "governance",
    "change management",
    "vendor coordination",
    "implementation",
  ],
};

function norm(s: string): string {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function classifyErpPillars(text: string, { includeEnablement = true } = {}): ErpPillarId[] {
  const n = norm(text);
  if (!n) return [];
  const hits: Array<{ id: ErpPillarId; score: number }> = [];
  (Object.keys(KEYWORDS) as ErpPillarId[]).forEach((id) => {
    if (!includeEnablement && id === "enablement") return;
    let score = 0;
    for (const kw of KEYWORDS[id]) {
      if (n.includes(kw)) score += 1;
    }
    if (score > 0) hits.push({ id, score });
  });
  hits.sort((a, b) => b.score - a.score);
  return hits.map((h) => h.id);
}

export function primaryErpPillar(text: string): ErpPillarId | null {
  return classifyErpPillars(text, { includeEnablement: true })[0] || null;
}

export function pillarTone(id: ErpPillarId): string {
  if (id === "p2p") return "border-cyan-700/40 bg-cyan-900/20 text-cyan-200";
  if (id === "reporting-data") return "border-amber-700/40 bg-amber-900/20 text-amber-200";
  if (id === "controls-audit") return "border-emerald-700/40 bg-emerald-900/20 text-emerald-200";
  return "border-violet-700/40 bg-violet-900/20 text-violet-200";
}

export function collectDeckPillarCoverage(deck: Presentation): Record<ErpPillarId, number> {
  const coverage: Record<ErpPillarId, number> = {
    p2p: 0,
    "reporting-data": 0,
    "controls-audit": 0,
    enablement: 0,
  };
  const blobs: string[] = [
    deck.objective,
    ...deck.narrative,
    ...deck.keyMessages,
    ...deck.slidePlan.map((s) => `${s.section} ${s.title} ${s.notes} ${(s.content || []).join(" ")}`),
    ...deck.dataRequests.map((g) => `${g.topic} ${g.ask}`),
    ...deck.artifacts.map((a) => `${a.title} ${a.notes} ${a.type}`),
  ];
  for (const blob of blobs) {
    for (const id of classifyErpPillars(blob, { includeEnablement: true })) {
      coverage[id] += 1;
    }
  }
  return coverage;
}

export function classifyGapPillars(gap: PresentationGap): ErpPillarId[] {
  return classifyErpPillars(`${gap.topic} ${gap.ask}`, { includeEnablement: true });
}

export function classifySlidePillars(slide: PresentationSlide): ErpPillarId[] {
  return classifyErpPillars(`${slide.section} ${slide.title} ${slide.notes} ${(slide.content || []).join(" ")}`, {
    includeEnablement: true,
  });
}

export function sortedTopPillars(coverage: Record<ErpPillarId, number>): ErpPillarId[] {
  return (Object.keys(coverage) as ErpPillarId[])
    .filter((id) => coverage[id] > 0)
    .sort((a, b) => coverage[b] - coverage[a]);
}

