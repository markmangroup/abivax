import fs from "fs";
import path from "path";
import {
  loadAccessRequests,
  loadCompanyIntelAgentBacklog,
  loadCompanyIntelDigest,
  loadCompanyIntelReviewQueue,
  loadEntities,
  loadIntegrations,
  loadMeetings as loadMeetingCatalog,
  loadNotes,
  loadPeople,
  loadSystems,
  type Meeting as CatalogMeeting,
} from "@/lib/abivaxData";
import TodayBriefClient from "./TodayBriefClient";

export const dynamic = "force-dynamic";

type Meeting = {
  title?: string;
  organizer?: string;
  start?: string;
  end?: string;
  location?: string;
  attendees?: string[];
  summary?: string[];
  actions?: string[];
  body?: string;
  rawBody?: string;
  teamsLink?: string;
  dialIn?: string;
  generatedAt?: string;
};

type Who = {
  name: string;
  role: string;
  entityId?: string;
};

type EntityRef = {
  id: string;
  name: string;
  aliases: string[];
};

type DecisionRadarItem = {
  decision: string;
  owner: string;
  due: string;
  blocker: string;
};

type PingItem = {
  name: string;
  why: string;
  prompt: string;
  entityId?: string;
};

type DeadlineItem = {
  label: string;
  date: string;
  daysUntil: number;
  entityId?: string;
};

type OperatorSummary = {
  programPhase: string;
  synthesizedAt: string;
  nextHardDeadlines: Array<{
    date: string;
    event: string;
    owner: string;
    daysUntil: number;
  }>;
  topDecisions: Array<{
    decision: string;
    owner: string;
    pillar: string;
    impact: string;
  }>;
  topNextMoves: Array<{
    move: string;
    pillar: string;
  }>;
  topWaitingOn: Array<{
    item: string;
    pillar: string;
  }>;
};

type TodaySummary = {
  dayLabel: string;
  snapshotLabel: string;
  meetingsTodayCount: number;
  nextMeetingTitle: string;
  nextMeetingStart: string;
  meetingMode: string;
  docket: string[];
  snapshotStale: boolean;
  snapshotStaleHint: string;
  currentMeetingTitles: string[];
  hasConflictNow: boolean;
  primaryMeetingReason: string;
  dayPhase: "pre_meeting" | "in_meeting" | "post_meeting" | "idle";
  phaseSummary: string;
};

type AfterActionReview = {
  prepNoteId: string;
  outcomeNoteId: string;
  matchedExpectations: string[];
  missedExpectations: string[];
  assumptionsDisproven: string[];
  newSignals: string[];
  attendeeDelta: string[];
  smootherNextTime: string[];
};

type ItLandscapeSnapshot = {
  systems: Array<{
    id: string;
    name: string;
    category: string;
    businessOwner: string;
    systemOwner: string;
    adminOwner: string;
    accessModel: string;
  }>;
  integrations: Array<{
    id: string;
    sourceSystem: string;
    targetSystem: string;
    feedType: string;
    frequency: string;
    owner: string;
    status: string;
  }>;
  accessRequests: Array<{
    id: string;
    person: string;
    system: string;
    status: string;
    owner: string;
    nextStep: string;
  }>;
};

type QueueSummaryItem = {
  title: string;
  why?: string;
  priority?: string;
  source?: string;
  category?: string;
};

type TodayWorkQueueSummary = {
  todayContentReview: {
    pending: number;
    highPriorityPending: number;
    topItems: QueueSummaryItem[];
  };
  wikiReview: {
    pending: number;
    highPriorityPending: number;
    topItems: QueueSummaryItem[];
  };
  companyIntelReview: {
    pending: number;
    highPriorityPending: number;
    topItems: QueueSummaryItem[];
  };
  agentBacklog: {
    openTodos: number;
    highPriority: number;
    topItems: QueueSummaryItem[];
  };
};

type WaterfallUpdateSummary = {
  lastReviewedAt: string;
  inbound: {
    recentCount: number;
    highSignalCount: number;
    topSubjects: Array<{ subject: string; sender: string; received: string }>;
  };
  reviewState: {
    reviewNowCount: number;
    tuningTargetCount: number;
    pendingQueues: Array<{ label: string; pending: number; high: number }>;
  };
  pushedThrough: string[];
  nextMoves: string[];
  operatorActions: Array<{
    action: string;
    sourceLabel: string;
    owner: string;
  }>;
  changeTrace: Array<{
    sourceLabel: string;
    status: string;
    impacted: string[];
    reviewWhere: string;
    nextMove: string;
  }>;
};

type FocusPrompt = {
  priority: string;
  prompt: string;
  why: string;
  source: string;
};

function tokenizeText(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((w) => w.length >= 4);
}

function buildMeetingContext(meeting: Meeting): {
  tokens: Set<string>;
  isFinanceIntro: boolean;
  isItMeeting: boolean;
  isDecisionGate: boolean;
  attendeeNames: Set<string>;
} {
  const base = [
    meeting.title || "",
    meeting.organizer || "",
    ...(meeting.attendees || []),
    ...(meeting.summary || []),
    ...(meeting.actions || []),
  ];
  const tokens = new Set<string>();
  for (const part of base) {
    for (const t of tokenizeText(part)) tokens.add(t);
  }
  const attendeeNames = new Set<string>();
  for (const attendee of meeting.attendees || []) {
    const n = normalize(attendee);
    if (n) attendeeNames.add(n);
  }

  const title = (meeting.title || "").toLowerCase();
  const isFinance = /(finance|fp&a|fp a|accounting|budget|treasury|p2p|consolidation)/i.test(
    [meeting.title || "", ...(meeting.attendees || []), ...(meeting.summary || [])].join(" ")
  );
  const isItMeeting = /(it|landscape|integration|technical|cyber)/i.test(
    [meeting.title || "", meeting.organizer || "", ...(meeting.attendees || []), ...(meeting.summary || [])].join(" ")
  );
  const isDecisionGate = /(decision|board|signoff|sign off|approve|approval|vendor selection|go\/no-go|go no go)/i.test(
    [meeting.title || "", ...(meeting.summary || []), ...(meeting.actions || [])].join(" ")
  );
  const isIntro = /(intro|introduction|welcome)/.test(title);

  if (isFinance) {
    ["finance", "budget", "accounting", "fp", "treasury", "p2p", "consolidation"].forEach((t) =>
      tokens.add(t)
    );
  }

  return { tokens, isFinanceIntro: isFinance && isIntro, isItMeeting, isDecisionGate, attendeeNames };
}

function determineMeetingMode(meeting: Meeting): string {
  const ctx = buildMeetingContext(meeting);
  if (ctx.isFinanceIntro) return "Finance Intro";
  if (ctx.isItMeeting) {
    if (/(landscape|overview|architecture|infra|infrastructure)/i.test(meeting.title || "")) {
      return "IT Landscape Session";
    }
    return "IT Context Session";
  }
  if (ctx.isDecisionGate) return "Decision Gate";
  if (/(intro|introduction|welcome)/i.test(meeting.title || "")) return "Stakeholder Intro";
  return "Working Session";
}

function buildContextGaps(title: string, whoMatters: Who[]): string[] {
  const gaps: string[] = [];
  const isIntroMeeting = /(intro|introduction|welcome)/i.test(title);

  const unresolvedPeople = whoMatters.filter((w) => !w.entityId || /unknown/i.test(w.role));
  for (const person of unresolvedPeople) {
    gaps.push(`Clarify ${person.name}'s exact role and ERP ownership boundary.`);
  }

  if (isIntroMeeting) {
    gaps.push("Confirm who owns budget tracking cadence for finance and ERP.");
    gaps.push("Confirm escalation path when scope or staffing conflicts appear.");
    gaps.push("Capture required follow-up sessions and owners with dates.");
  }

  return Array.from(new Set(gaps)).slice(0, 5);
}

function hasSignalOverlap(a: string, b: string): boolean {
  const aw = tokenizeText(a);
  const bw = new Set(tokenizeText(b));
  let overlap = 0;
  for (const w of aw) {
    if (bw.has(w)) overlap += 1;
  }
  return overlap >= 2;
}

function extractMentionedPeople(text: string, entities: ReturnType<typeof loadEntities>["entities"]): Set<string> {
  const pool = entities
    .filter((e) => e.type === "person")
    .map((e) => ({
      canonical: e.name,
      labels: [e.name, ...(e.aliases || [])]
        .map((x) => x.trim())
        .filter((x) => x.length >= 4),
    }));

  const normalized = normalize(text || "");
  const out = new Set<string>();
  for (const p of pool) {
    for (const label of p.labels) {
      const token = normalize(label);
      if (!token) continue;
      if (normalized.includes(token)) {
        out.add(p.canonical);
        break;
      }
    }
  }
  return out;
}

function buildAfterActionReview(
  notes: ReturnType<typeof loadNotes>["notes"],
  entities: ReturnType<typeof loadEntities>["entities"]
): AfterActionReview | null {
  const ordered = notes
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const prep =
    ordered.find((n) => /finance-intro-prep/i.test(n.id)) ||
    ordered.find((n) => /prep/i.test(n.id) || /prep/i.test(n.title || ""));
  const outcome =
    ordered.find((n) => /live-outcomes/i.test(n.id)) ||
    ordered.find((n) => /outcomes/i.test(n.id) || /live outcomes/i.test(n.title || ""));

  if (!prep || !outcome) return null;

  const expected = [
    ...(prep.summary?.openQuestions || []),
    ...(prep.summary?.nextConstraints || []),
  ].map((x) => x.trim()).filter(Boolean);
  const actual = [
    ...(outcome.summary?.truthsNow || []),
    ...(outcome.summary?.decisions || []),
  ].map((x) => x.trim()).filter(Boolean);

  const matchedExpectations = expected
    .filter((e) => actual.some((a) => hasSignalOverlap(e, a)))
    .slice(0, 4)
    .map((x) => shortText(x, 14));
  const missedExpectations = expected
    .filter((e) => !actual.some((a) => hasSignalOverlap(e, a)))
    .slice(0, 4)
    .map((x) => shortText(x, 14));
  const assumptionsDisproven = missedExpectations
    .filter((x) => /(expected|must|should|key|participants?|ownership|owner|clarify)/i.test(x))
    .slice(0, 3);
  const newSignals = actual
    .filter((a) => !expected.some((e) => hasSignalOverlap(e, a)))
    .slice(0, 4)
    .map((x) => shortText(x, 14));

  const prepPeople = extractMentionedPeople(
    `${prep.rawText}\n${(prep.summary?.entityMentions || []).join("\n")}`,
    entities
  );
  const outcomePeople = extractMentionedPeople(
    `${outcome.rawText}\n${(outcome.summary?.entityMentions || []).join("\n")}`,
    entities
  );

  const newAttendees = [...outcomePeople].filter((name) => !prepPeople.has(name)).slice(0, 4);
  const missingExpected = [...prepPeople].filter((name) => !outcomePeople.has(name)).slice(0, 4);
  const attendeeDelta: string[] = [];
  if (newAttendees.length > 0) attendeeDelta.push(`New in-room signals: ${newAttendees.join(", ")}.`);
  if (missingExpected.length > 0) attendeeDelta.push(`Expected but not confirmed present: ${missingExpected.join(", ")}.`);

  const smootherNextTime = [
    ...(outcome.summary?.openQuestions || []),
    ...(outcome.summary?.nextConstraints || []),
  ]
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((x) => shortText(x, 14));

  return {
    prepNoteId: prep.id,
    outcomeNoteId: outcome.id,
    matchedExpectations,
    missedExpectations,
    assumptionsDisproven,
    newSignals,
    attendeeDelta,
    smootherNextTime,
  };
}

function readMeetings(dir: string): Meeting[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const meetings: Meeting[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      meetings.push(JSON.parse(raw) as Meeting);
    } catch {
      // Keep rendering resilient.
    }
  }

  return meetings;
}

function readTempTodayMeetings(): Meeting[] {
  try {
    const p = path.join(process.cwd(), "temp", "todays-meetings.json");
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as {
      meetings?: Array<{
        title?: string;
        date?: string;
        time?: string;
        start?: string;
        end?: string;
        timeZone?: string;
        location?: string;
        organizer?: string;
        attendees?: string;
        purpose?: string;
        prep?: string[];
        link?: string;
        sourceUpdatedAt?: string;
      }>;
    };
    const rows = Array.isArray(parsed.meetings) ? parsed.meetings : [];
    return rows.map((m) => ({
      title: m.title || "",
      organizer: m.organizer || "",
      start: m.start || parseCatalogStart(m.date || "", m.time || ""),
      end: m.end || "",
      location: m.location || "",
      attendees: typeof m.attendees === "string"
        ? m.attendees.split(/[;,]/).map((x) => x.trim()).filter(Boolean)
        : [],
      summary: [m.purpose || "", ...((m.prep || []).filter(Boolean))].filter(Boolean),
      actions: (m.prep || []).slice(0, 3),
      teamsLink: m.link || "",
      generatedAt: m.sourceUpdatedAt || (m.date ? `${m.date}T00:00:00-05:00` : ""),
    }));
  } catch {
    return [];
  }
}

function loadFocusPromptsFromTemp(): FocusPrompt[] {
  try {
    const p = path.join(process.cwd(), "temp", "operator-focus-prompts.json");
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, "utf-8");
    const parsed = JSON.parse(raw) as { prompts?: FocusPrompt[] };
    return Array.isArray(parsed.prompts) ? parsed.prompts.slice(0, 4) : [];
  } catch {
    return [];
  }
}

function normalize(v: string): string {
  return (v || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitWords(v: string): string[] {
  return normalize(v).split(" ").filter(Boolean);
}

function pickNextMeeting(meetings: Meeting[]): Meeting | null {
  const now = Date.now();
  const upcoming = meetings
    .filter((m) => m.start && !Number.isNaN(Date.parse(m.start)))
    .sort((a, b) => Date.parse(a.start as string) - Date.parse(b.start as string))
    .find((m) => Date.parse(m.start as string) >= now);

  if (upcoming) return upcoming;

  const latest = meetings
    .filter((m) => m.generatedAt && !Number.isNaN(Date.parse(m.generatedAt)))
    .sort(
      (a, b) =>
        Date.parse(b.generatedAt as string) - Date.parse(a.generatedAt as string)
    )[0];

  return latest ?? null;
}

function dedupeMeetings(meetings: Meeting[]): Meeting[] {
  const byKey = new Map<string, Meeting>();
  for (const m of meetings) {
    const key = `${normalize(m.title || "")}|${(m.start || "").trim()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, m);
      continue;
    }

    const currentTs = Date.parse(m.generatedAt || "");
    const existingTs = Date.parse(existing.generatedAt || "");
    if (!Number.isNaN(currentTs) && (Number.isNaN(existingTs) || currentTs > existingTs)) {
      byKey.set(key, m);
    }
  }
  return [...byKey.values()];
}

function parseCatalogStart(date: string, time: string): string {
  if (!date) return "";
  const m = (time || "").trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (!m) return `${date}T09:00:00-05:00`;
  let hour = Number.parseInt(m[1], 10);
  const minute = Number.parseInt(m[2], 10);
  const meridiem = m[3] || "am";
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-05:00`;
}

function mapCatalogMeetings(meetings: CatalogMeeting[]): Meeting[] {
  return meetings.map((m) => ({
    title: m.title,
    organizer: m.organizer,
    start: parseCatalogStart(m.date, m.time),
    location: m.location,
    attendees: typeof m.attendees === "string"
      ? m.attendees.split(/[;,]/).map((x) => x.trim()).filter(Boolean)
      : [],
    summary: [m.purpose, ...(m.prep || [])].filter(Boolean),
    actions: (m.prep || []).slice(0, 3),
    teamsLink: m.link || "",
    generatedAt: `${m.date}T00:00:00-05:00`,
  }));
}

function shortText(input: string, maxWords: number): string {
  const words = input.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return input;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function wordCount(lines: string[]): number {
  return lines
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildAttendeeRoles(attendees: string[]): Who[] {
  const { entities } = loadEntities();
  const { people } = loadPeople();

  const personEntities = entities.filter((e) => e.type === "person");

  const peopleLookup = people.map((p) => ({
    keys: [normalize(p.name), normalize(p.id)],
    role: p.role,
    name: p.name,
    id: p.entity,
  }));

  const entityLookup = personEntities.map((e) => {
    const role = typeof e.properties.role === "string" ? e.properties.role : "";
    return {
      keys: [normalize(e.name), normalize(e.id), ...e.aliases.map(normalize)],
      role,
      name: e.name,
      id: e.id,
    };
  });

  const out: Who[] = [];
  const seen = new Set<string>();

  for (const raw of attendees) {
    const cleanedName = raw.replace(/<[^>]+>/g, " ").trim();
    const key = normalize(cleanedName);
    if (!key || seen.has(key)) continue;

    const words = splitWords(cleanedName);
    let role = "role unknown";

    const candidate = [...entityLookup, ...peopleLookup].find((item) => {
      return item.keys.some((k) => {
        if (!k) return false;
        if (k === key || key.includes(k) || k.includes(key)) return true;
        return words.some((w) => w.length > 3 && k.includes(w));
      });
    });

    if (candidate && candidate.role) {
      role = candidate.role;
    }

    out.push({ name: cleanedName, role, entityId: candidate?.id });
    seen.add(key);
  }

  return out;
}

function buildAttendeeTokens(attendees: string[]): string[] {
  const tokens = new Set<string>();

  for (const raw of attendees) {
    const cleaned = raw.replace(/<[^>]+>/g, " ").trim();
    const normalized = normalize(cleaned);
    if (normalized) tokens.add(normalized);
    for (const word of splitWords(cleaned)) {
      if (word.length >= 4) tokens.add(word);
    }
  }

  return [...tokens];
}

function buildTargetedFollowUps(meeting: Meeting, notes: ReturnType<typeof loadNotes>["notes"]): string[] {
  const tokens = buildAttendeeTokens(meeting.attendees || []);
  if (tokens.length === 0) return [];

  const candidates = notes
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .flatMap((n) => [
      ...(n.summary?.openQuestions || []),
      ...(n.summary?.nextConstraints || []),
    ])
    .filter(Boolean)
    .map((line) => line.trim())
    .filter((line) => {
      const n = normalize(line);
      if (!n) return false;
      if (!tokens.some((t) => n.includes(t))) return false;
      return /(confirm|budget|approve|owner|role|scope|deadline|decision|negotiat|readiness)/i.test(line);
    })
    .map((line) => shortText(line, 12));

  return Array.from(new Set(candidates)).slice(0, 2);
}

function guessOwner(
  text: string,
  ctx: ReturnType<typeof buildMeetingContext>
): string {
  const line = text.toLowerCase();

  if (/(hema|keshava)/.test(line)) return "Hema Kesh";
  if (/(didier|blondel)/.test(line)) return "Didier Blondel";
  if (/(fred|frederick|golly)/.test(line)) return "Frederick";
  if (/(trinidad|mesa)/.test(line)) return "Trinidad";
  if (/(juliette|courtot)/.test(line)) return "Juliette";
  if (/(kimberly|gordon)/.test(line)) return "Kimberly Gordon";
  if (/(jade|nguyen|christophe|kristoph|hennequin)/.test(line)) {
    if (ctx.isFinanceIntro) return "Mike (park for IT follow-up)";
    return "Jade Nguyen";
  }

  if (ctx.isFinanceIntro) {
    if (/(budget|fp&a|fred|frederick|audit)/.test(line)) return "Frederick";
    if (/(board|didier|executive)/.test(line)) return "Didier Blondel";
    if (/(finance|scope|timeline|go-live|go live|owner|staff|resource|p2p|accounting|treasury)/.test(line)) return "Hema Kesh";
    if (/(it|integrat|technical|cyber)/.test(line)) return "Mike (park for IT follow-up)";
    return "Mike (assign owner)";
  }

  if (ctx.isItMeeting) {
    if (/(jade|it|integrat|technical|cyber)/.test(line)) return "Jade Nguyen";
    if (/(budget|fp&a|fred|frederick|audit)/.test(line)) return "Frederick";
  }

  if (/(jade|it|integrat|technical)/.test(line)) return "Jade Nguyen";
  if (/(budget|fp&a|fred|frederick|audit)/.test(line)) return "Frederick";
  if (/(board|didier|executive)/.test(line)) return "Didier Blondel";
  if (/(finance|scope|timeline|go-live|go live)/.test(line)) return "Hema Kesh";
  return "Mike (assign owner)";
}

function guessDue(text: string): string {
  const line = text.toLowerCase();
  if (/(march 19|board|audit committee|budget)/.test(line)) return "Before Mar 19, 2026";
  if (/(go-live|go live|1\/1\/27|jan 1, 2027)/.test(line)) return "By Q2 2026";
  return "This week";
}

function findBlocker(text: string, risks: string[]): string {
  const line = text.toLowerCase();
  const match = risks.find((r) => {
    const risk = r.toLowerCase();
    if (line.includes("budget") && risk.includes("budget")) return true;
    if ((line.includes("it") || line.includes("role") || line.includes("resource")) && /(it|role|resource|staff)/.test(risk)) return true;
    if ((line.includes("timeline") || line.includes("go-live") || line.includes("go live")) && /(timeline|go-live|go live|staff)/.test(risk)) return true;
    return false;
  });

  return match ? shortText(match, 10) : "Owner and date not locked.";
}

function buildDecisionRadar(notes: ReturnType<typeof loadNotes>["notes"], meeting: Meeting): DecisionRadarItem[] {
  const ctx = buildMeetingContext(meeting);
  const recent = notes
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const risks = recent.flatMap((n) => n.summary?.risks || []);
  const allCandidates = recent
    .flatMap((n, idx) =>
      [...(n.summary?.openQuestions || []), ...(n.summary?.nextConstraints || [])].map((line) => ({
        line: line.trim(),
        recency: Math.max(1, 10 - idx),
      }))
    )
    .filter((x) => x.line)
    .filter((x) =>
      /(what|when|who|confirm|define|budget|decision|owner|role|staff|resource|timeline|go-live|go live)/i.test(
        x.line
      )
    )
    .filter((x) => {
      if (!ctx.isFinanceIntro) return true;
      const isItOnly = /(jade|it\b|integration|technical|cybersecurity|christophe|kristoph|hennequin)/i.test(x.line);
      const isFinance = /(finance|budget|accounting|fp&a|fp a|treasury|p2p|consolidation|didier|hema|frederick|trinidad|juliette|kimberly)/i.test(x.line);
      return !isItOnly || isFinance;
    });

  const scored = allCandidates
    .map((c) => {
      const words = tokenizeText(c.line);
      const overlap = words.filter((w) => ctx.tokens.has(w)).length;
      const financeBoost = /(finance|budget|fp&a|fp a|accounting|treasury|p2p|consolidation)/i.test(c.line) ? 2 : 0;
      const itPenalty =
        ctx.isFinanceIntro && /(jade|it\b|integration|technical|cybersecurity|christophe|kristoph)/i.test(c.line)
          ? -2
          : 0;
      return { ...c, score: overlap * 3 + financeBoost + c.recency + itPenalty };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || b.recency - a.recency);

  const out: DecisionRadarItem[] = [];
  const seen = new Set<string>();
  for (const candidate of scored) {
    const line = candidate.line;
    const key = normalize(line);
    if (!key || seen.has(key)) continue;
    out.push({
      decision: shortText(line, 14),
      owner: guessOwner(line, ctx),
      due: guessDue(line),
      blocker: findBlocker(line, risks),
    });
    seen.add(key);
    if (out.length >= 4) break;
  }

  if (out.length === 0) {
    return [
      {
        decision: "Define explicit IT involvement model for ERP.",
        owner: "Jade Nguyen",
        due: "This week",
        blocker: "Role boundaries still implicit.",
      },
    ];
  }

  return out;
}

function buildUnresolvedQuestions(notes: ReturnType<typeof loadNotes>["notes"], meeting: Meeting): string[] {
  const ctx = buildMeetingContext(meeting);
  const recent = notes
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const decisionsText = recent
    .flatMap((n) => n.summary?.decisions || [])
    .join(" ")
    .toLowerCase();

  const questions = recent
    .flatMap((n) => n.summary?.openQuestions || [])
    .map((q) => q.trim())
    .filter(Boolean)
    .filter((q) => {
      const words = splitWords(q).filter((w) => w.length > 4);
      if (words.some((w) => decisionsText.includes(w))) return false;
      const overlap = words.filter((w) => ctx.tokens.has(w)).length;
      if (overlap > 0) return true;
      if (ctx.isFinanceIntro && /(finance|budget|accounting|fp&a|treasury|p2p|consolidation)/i.test(q)) return true;
      return false;
    })
    .filter((q) => {
      if (!ctx.isFinanceIntro) return true;
      return !/(jade|it\b|integration|technical|cybersecurity|christophe|kristoph)/i.test(q);
    });

  return Array.from(new Set(questions)).slice(0, 6).map((q) => shortText(q, 16));
}

function buildPeopleToPing(
  decisions: DecisionRadarItem[],
  entities: ReturnType<typeof loadEntities>["entities"],
  meeting: Meeting
): PingItem[] {
  const ctx = buildMeetingContext(meeting);
  const personEntities = entities.filter((e) => e.type === "person");
  const nameToEntity = new Map(
    personEntities.map((e) => [normalize(e.name), e.id] as const)
  );

  const out: PingItem[] = [];
  const seen = new Set<string>();
  for (const item of decisions) {
    const owner = item.owner;
    if (!owner || owner.includes("assign owner") || owner.includes("park for IT follow-up")) continue;
    if (ctx.isFinanceIntro && /(jade|it\b|integration|technical)/i.test(owner)) continue;
    if (ctx.attendeeNames.has(normalize(owner))) continue; // already in the meeting; no separate ping needed.
    const key = normalize(owner);
    if (!key || seen.has(key)) continue;
    out.push({
      name: owner,
      why: shortText(item.decision, 11),
      prompt: `Can we lock owner/date on "${shortText(item.decision, 9)}" by ${item.due}?`,
      entityId: nameToEntity.get(key),
    });
    seen.add(key);
    if (out.length >= 4) break;
  }
  return out;
}

function buildDeadlineLadder(entities: ReturnType<typeof loadEntities>["entities"]): DeadlineItem[] {
  const now = new Date();
  const milestones = entities
    .filter((e) => e.type === "milestone")
    .map((e) => {
      const rawDate = typeof e.properties.date === "string" ? e.properties.date : "";
      if (!rawDate) return null;
      const ts = Date.parse(rawDate);
      if (Number.isNaN(ts)) return null;
      const daysUntil = Math.ceil((ts - now.getTime()) / (24 * 60 * 60 * 1000));
      return {
        label: e.name,
        date: rawDate,
        daysUntil,
        entityId: e.id,
      };
    })
    .flatMap((v) => (v ? [v] : []))
    .filter((v) => v.daysUntil >= -3)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6);

  return milestones;
}

function loadPillarSynthesis(): OperatorSummary | null {
  try {
    const filePath = path.join(process.cwd(), "data", "abivax", "pillar_synthesis.json");
    if (!fs.existsSync(filePath)) return null;
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const now = Date.now();

    const nextHardDeadlines = ((raw.programState?.nextHardDeadlines || []) as Array<{ date: string; event: string; owner: string }>)
      .map((d) => {
        const ts = Date.parse(d.date);
        const daysUntil = Number.isNaN(ts) ? 999 : Math.ceil((ts - now) / (24 * 60 * 60 * 1000));
        return { date: d.date, event: d.event, owner: d.owner, daysUntil };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const pillars: Array<{
      id: string;
      shortLabel: string;
      keyDecisionsPending?: Array<{ decision: string; owner: string; impact: string; entity?: string }>;
      nextMoves?: Array<string | { fact: string; entity?: string }>;
      waitingOn?: Array<string | { fact: string; entity?: string }>;
    }> = raw.pillars || [];

    // Helper: pillar_synthesis stores nextMoves/waitingOn as either plain strings or {fact, entity} objects
    const extractText = (item: string | { fact: string; entity?: string }): string =>
      typeof item === "string" ? item : item.fact ?? "";

    const topDecisions: OperatorSummary["topDecisions"] = [];
    for (const pillar of pillars) {
      const decisions = pillar.keyDecisionsPending || [];
      if (decisions.length > 0) {
        topDecisions.push({
          decision: decisions[0].decision,
          owner: decisions[0].owner,
          pillar: pillar.shortLabel || pillar.id,
          impact: decisions[0].impact,
        });
      }
      if (topDecisions.length >= 5) break;
    }

    const topNextMoves: OperatorSummary["topNextMoves"] = [];
    for (const pillar of pillars) {
      const moves = pillar.nextMoves || [];
      if (moves.length > 0) {
        topNextMoves.push({ move: extractText(moves[0]), pillar: pillar.shortLabel || pillar.id });
      }
      if (topNextMoves.length >= 5) break;
    }

    const topWaitingOn: OperatorSummary["topWaitingOn"] = [];
    for (const pillar of pillars) {
      const waiting = pillar.waitingOn || [];
      if (waiting.length > 0) {
        topWaitingOn.push({ item: extractText(waiting[0]), pillar: pillar.shortLabel || pillar.id });
      }
    }

    return {
      programPhase: (raw.programState?.phase as string) || "",
      synthesizedAt: (raw._meta?.synthesizedAt as string) || "",
      nextHardDeadlines,
      topDecisions,
      topNextMoves,
      topWaitingOn,
    };
  } catch {
    return null;
  }
}

function buildItLandscapeSnapshot(): ItLandscapeSnapshot {
  const { systems } = loadSystems();
  const { integrations } = loadIntegrations();
  const { requests } = loadAccessRequests();

  return {
    systems: systems.slice(0, 10).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      businessOwner: s.businessOwner,
      systemOwner: s.systemOwner,
      adminOwner: s.adminOwner,
      accessModel: s.accessModel,
    })),
    integrations: integrations.slice(0, 12).map((i) => ({
      id: i.id,
      sourceSystem: i.sourceSystem,
      targetSystem: i.targetSystem,
      feedType: i.feedType,
      frequency: i.frequency,
      owner: i.owner,
      status: i.status,
    })),
    accessRequests: requests
      .filter((r) => normalize(r.person).includes("michael markman") || normalize(r.person).includes("mike"))
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        person: r.person,
        system: r.system,
        status: r.status,
        owner: r.owner,
        nextStep: r.nextStep,
      })),
  };
}

function readJsonSafe<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildTodayWorkQueueSummary(): TodayWorkQueueSummary {
  const wikiQueue = readJsonSafe<{
    summary?: { pendingReview?: number; highPriorityPending?: number };
    items?: Array<{
      title?: string;
      why?: string;
      priority?: string;
      source?: string;
      category?: string;
      status?: string;
    }>;
  }>(path.join(process.cwd(), "data", "abivax", "wiki_review_queue.json"), {});

  const wikiBacklog = readJsonSafe<{
    summary?: { openTodos?: number; highPriority?: number };
    todos?: Array<{ title?: string; why?: string; priority?: string }>;
  }>(path.join(process.cwd(), "data", "abivax", "wiki_agent_backlog.json"), {});

  const todayContentQueue = readJsonSafe<{
    summary?: { pendingReview?: number; highPriorityPending?: number };
    items?: Array<{
      title?: string;
      why?: string;
      priority?: string;
      source?: string;
      category?: string;
      status?: string;
    }>;
  }>(path.join(process.cwd(), "data", "abivax", "today_content_review_queue.json"), {});
  const todayContentBacklog = readJsonSafe<{
    summary?: { openTodos?: number; highPriority?: number };
    todos?: Array<{ title?: string; why?: string; priority?: string }>;
  }>(path.join(process.cwd(), "data", "abivax", "today_content_agent_backlog.json"), {});

  const companyReview = loadCompanyIntelReviewQueue();
  const companyBacklog = loadCompanyIntelAgentBacklog();

  const todayContentPendingItems = (todayContentQueue.items || [])
    .filter((i) => String(i.status || "").toLowerCase() === "pending-review")
    .slice(0, 3)
    .map((i) => ({
      title: i.title || "Today content review item",
      why: i.why || "",
      priority: i.priority || "medium",
      source: i.source || "",
      category: i.category || "",
    }));

  const wikiPendingItems = (wikiQueue.items || [])
    .filter((i) => String(i.status || "").toLowerCase() === "pending-review")
    .slice(0, 3)
    .map((i) => ({
      title: i.title || "Wiki review item",
      why: i.why || "",
      priority: i.priority || "medium",
      source: i.source || "",
      category: i.category || "",
    }));

  const companyPendingItems = (companyReview.items || [])
    .filter((i) => String(i.status || "").toLowerCase() === "pending-review")
    .slice(0, 3)
    .map((i) => ({
      title: i.title || "Company intel review item",
      why: "",
      priority: i.priority || "medium",
      source: i.source || "",
      category: i.categoryHint || "",
    }));

  const backlogItems = [
    ...(todayContentBacklog.todos || []),
    ...(companyBacklog.todos || []),
    ...(wikiBacklog.todos || []),
  ]
    .sort((a, b) => {
      const rank = (p?: string) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
      return rank(a.priority) - rank(b.priority);
    })
    .slice(0, 4)
    .map((t) => ({
      title: t.title || "Agent backlog item",
      why: t.why || "",
      priority: t.priority || "medium",
    }));

  return {
    todayContentReview: {
      pending: Number(todayContentQueue.summary?.pendingReview || 0),
      highPriorityPending: Number(todayContentQueue.summary?.highPriorityPending || 0),
      topItems: todayContentPendingItems,
    },
    wikiReview: {
      pending: Number(wikiQueue.summary?.pendingReview || 0),
      highPriorityPending: Number(wikiQueue.summary?.highPriorityPending || 0),
      topItems: wikiPendingItems,
    },
    companyIntelReview: {
      pending: Number(companyReview.summary?.pendingReview || 0),
      highPriorityPending: Number(companyReview.summary?.highPriorityPending || 0),
      topItems: companyPendingItems,
    },
    agentBacklog: {
      openTodos: Number(
        (todayContentBacklog.summary?.openTodos || 0) +
        (companyBacklog.summary?.openTodos || 0) +
        (wikiBacklog.summary?.openTodos || 0)
      ),
      highPriority: Number(
        (todayContentBacklog.summary?.highPriority || 0) +
        (companyBacklog.summary?.highPriority || 0) +
        (wikiBacklog.summary?.highPriority || 0)
      ),
      topItems: backlogItems,
    },
  };
}

function buildWaterfallUpdateSummary(workQueue: TodayWorkQueueSummary): WaterfallUpdateSummary {
  const review = readJsonSafe<{
    generatedAt?: string;
    summary?: { reviewNowCount?: number; tuningTargetCount?: number };
  }>(path.join(process.cwd(), "temp", "swarm-waterfall-review.json"), {});

  const recentInbox = readJsonSafe<{ emails?: Array<{
    received?: string;
    senderName?: string;
    subject?: string;
    hasAttachments?: boolean;
  }> }>(path.join(process.cwd(), "temp", "recent-emails.json"), {});
  const recentSent = readJsonSafe<{ emails?: Array<{
    sent?: string;
    subject?: string;
    to?: string;
    cc?: string;
  }> }>(path.join(process.cwd(), "temp", "recent-sent-emails.json"), {});

  const now = Date.now();
  const recentWindowMs = 36 * 60 * 60 * 1000;
  const highSignalPattern =
    /(trinidad|hema|jade|youness|walid|kpmg|camille|aymen|frederick|kimberly|matt|sox|p2p|erp|reporting|sharepoint|tracker|rcm)/i;
  const lowSignalSubject =
    /^(re:\s*)?announcement: ddw abstract acceptances|weekly summary|new form 6-k/i;

  const inboxItems = (recentInbox.emails || [])
    .filter((e) => e.received && !Number.isNaN(Date.parse(String(e.received))))
    .filter((e) => now - Date.parse(String(e.received)) <= recentWindowMs)
    .sort((a, b) => Date.parse(String(b.received)) - Date.parse(String(a.received)));
  const sentItems = (recentSent.emails || [])
    .filter((e) => e.sent && !Number.isNaN(Date.parse(String(e.sent))))
    .filter((e) => now - Date.parse(String(e.sent)) <= recentWindowMs)
    .sort((a, b) => Date.parse(String(b.sent)) - Date.parse(String(a.sent)));

  const highSignalInbox = inboxItems.filter((e) => {
    const blob = `${e.senderName || ""} ${e.subject || ""}`;
    if (lowSignalSubject.test(String(e.subject || ""))) return false;
    return highSignalPattern.test(blob);
  });

  const pendingQueues = [
    {
      label: "Today content review",
      pending: workQueue.todayContentReview.pending,
      high: workQueue.todayContentReview.highPriorityPending,
    },
    {
      label: "Company intel review",
      pending: workQueue.companyIntelReview.pending,
      high: workQueue.companyIntelReview.highPriorityPending,
    },
    {
      label: "Wiki review",
      pending: workQueue.wikiReview.pending,
      high: workQueue.wikiReview.highPriorityPending,
    },
  ];

  const latestMtimes = (paths: Array<[string, string]>) =>
    paths
      .map(([label, p]) => {
        try {
          const s = fs.statSync(p);
          return { label, t: s.mtimeMs };
        } catch {
          return null;
        }
      })
      .filter(Boolean as unknown as <T>(x: T | null) => x is T)
      .sort((a, b) => b.t - a.t);

  const derivedUpdates = latestMtimes([
    ["Company Intel digest", path.join(process.cwd(), "data", "abivax", "company_intel_daily_digest.json")],
    ["Stakeholder/entity profiles", path.join(process.cwd(), "data", "abivax", "entity_profiles.json")],
    ["Process flow diagram payloads", path.join(process.cwd(), "data", "abivax", "process_flow_diagram_payloads.json")],
    ["Pillar baselines", path.join(process.cwd(), "data", "abivax", "erp_pillar_baselines.json")],
  ]);

  const pushedThrough = derivedUpdates.slice(0, 3).map((d) => {
    const ageMin = Math.max(0, Math.round((now - d.t) / 60000));
    return `${d.label} refreshed (${ageMin}m ago)`;
  });

  const nextMoves: string[] = [];
  const topInbound = highSignalInbox.slice(0, 3);
  if (topInbound.some((e) => /jade/i.test(`${e.senderName} ${e.subject}`))) {
    nextMoves.push("Review Jade SharePoint tracker link and map integration/feed details into Program/IT systems.");
  }
  if (topInbound.some((e) => /trinidad/i.test(`${e.senderName} ${e.subject}`))) {
    nextMoves.push("Review Trinidad P2P attachments and update France P2P process flow from source documents.");
  }
  if (topInbound.some((e) => /hema/i.test(`${e.senderName} ${e.subject}`) && /kpmg contacts|reporting\/process/i.test(`${e.subject}`))) {
    nextMoves.push("Add Hema/KPMG reporting contact response into Reporting pillar baseline and stakeholder briefs.");
  }
  if (nextMoves.length === 0 && (review.summary?.reviewNowCount || 0) === 0) {
    nextMoves.push("No urgent review queues. Use this slot for source-backed process-flow refinement or stakeholder brief cleanup.");
  }

  const changeTrace: WaterfallUpdateSummary["changeTrace"] = [];
  const operatorActions: WaterfallUpdateSummary["operatorActions"] = [];
  const erpDecisionSent = sentItems.find((e) => /erp decision follow-up/i.test(String(e.subject || "")));
  const erpDecisionTransitionSent = sentItems.find((e) =>
    /abivax\s*-\s*erp decision presentation/i.test(String(e.subject || ""))
  );
  const camilleDecisionReply = inboxItems.find((e) => {
    const sender = String(e.senderName || "").toLowerCase();
    const subject = String(e.subject || "").toLowerCase();
    return sender.includes("camille") && subject.includes("erp decision follow-up");
  });
  if (erpDecisionSent || erpDecisionTransitionSent) {
    const sourceLabel = erpDecisionTransitionSent
      ? "Sent: ERP decision presentation transition thread (Camille/Aymen)"
      : "Sent: ERP decision follow-up (Camille/Aymen)";
    changeTrace.push({
      sourceLabel,
      status: "Tracked; decision transition applied",
      impacted: ["Timeline", "Program / pillar baselines", "Presentations"],
      reviewWhere: "Program + Presentations",
      nextMove:
        "Align Monday follow-up with Camille/Aymen; Hema + Mike own the commercial negotiation path, with immediate focus on vendor notification and early-April mobilization timing.",
    });
    operatorActions.push({
      action: "Reply to Camille/Aymen to confirm Monday follow-up objective, attendees, and expected decisions.",
      sourceLabel,
      owner: "Mike",
    });
    operatorActions.push({
      action: "Decide whether to send the NetSuite next-step/vendor-notification email now; if yes, draft and send it today.",
      sourceLabel,
      owner: "Mike",
    });
    operatorActions.push({
      action: "If no intro thread arrives from Camille/Aymen by end of day, send a short nudge to unblock NetSuite kickoff contact.",
      sourceLabel,
      owner: "Mike",
    });
  }
  if (camilleDecisionReply) {
    operatorActions.push({
      action: "Review Camille's ERP decision reply and lock the Monday meeting agenda into 2-3 explicit decisions to close.",
      sourceLabel: "Inbound: Camille ERP decision reply",
      owner: "Mike",
    });
  }
  const trinidadInbox = inboxItems.find((e) => /trinidad/i.test(`${e.senderName || ""}`) && /france p2p/i.test(`${e.subject || ""}`));
  if (trinidadInbox) {
    changeTrace.push({
      sourceLabel: "Inbound: Trinidad P2P docs email",
      status: "Ingested; attachments detected",
      impacted: ["P2P pillar baseline", "France P2P process flow (pending review)", "Trinidad brief"],
      reviewWhere: "Process Flows + Trinidad page",
      nextMove: "Review attached France P2P docs and map steps/approvals/evidence into source-backed flow updates.",
    });
    operatorActions.push({
      action: "Review the France P2P updates in Process Flows and confirm the top 1-2 follow-up asks needed from Trinidad.",
      sourceLabel: "Inbound: Trinidad P2P docs email",
      owner: "Mike",
    });
  }
  const jadeInbox = inboxItems.find((e) => /jade/i.test(`${e.senderName || ""}`) && /it landscape follow-up/i.test(`${e.subject || ""}`));
  if (jadeInbox) {
    changeTrace.push({
      sourceLabel: "Inbound: Jade tracker link email",
      status: "Ingested; SharePoint tracker link captured",
      impacted: ["Program (IT/integration evidence)", "Systems/Integrations records (pending review)"],
      reviewWhere: "Program / Systems",
      nextMove: "Review Jade tracker feed details and map owners/frequency/failure handling into integration records.",
    });
    operatorActions.push({
      action: "Review Program/System outputs from Jade tracker ingestion and decide if a follow-up clarification email is needed before Monday.",
      sourceLabel: "Inbound: Jade tracker link email",
      owner: "Mike",
    });
  }
  const hemaKpmgReply = inboxItems.find((e) => {
    const sender = String(e.senderName || "").toLowerCase();
    const subject = String(e.subject || "").toLowerCase();
    return sender.includes("hema") && subject.includes("kpmg contacts for reporting/process");
  });
  if (hemaKpmgReply && changeTrace.length < 3) {
    changeTrace.push({
      sourceLabel: "Inbound: Hema KPMG reporting contact reply",
      status: "Integrated",
      impacted: ["Reporting pillar baseline", "Today next-moves"],
      reviewWhere: "Program (Reporting/Data pillar)",
      nextMove: "Contact Robin Lapous (KPMG) for current consolidation / IFRS adjustment process fact-finding.",
    });
    operatorActions.push({
      action: "Send outreach to Robin Lapous (KPMG) to schedule consolidation/IFRS process fact-finding.",
      sourceLabel: "Inbound: Hema KPMG reporting contact reply",
      owner: "Mike",
    });
  }
  const dedupedOperatorActions = operatorActions.filter((item, idx, arr) => {
    const k = `${item.sourceLabel}::${item.action}`.toLowerCase();
    return idx === arr.findIndex((x) => `${x.sourceLabel}::${x.action}`.toLowerCase() === k);
  });

  return {
    lastReviewedAt: String(review.generatedAt || ""),
    inbound: {
      recentCount: inboxItems.length,
      highSignalCount: highSignalInbox.length,
      topSubjects: topInbound.map((e) => ({
        subject: String(e.subject || "Email"),
        sender: String(e.senderName || "Unknown"),
        received: String(e.received || ""),
      })),
    },
    reviewState: {
      reviewNowCount: Number(review.summary?.reviewNowCount || 0),
      tuningTargetCount: Number(review.summary?.tuningTargetCount || 0),
      pendingQueues,
    },
    pushedThrough,
    nextMoves: nextMoves.slice(0, 3),
    operatorActions: dedupedOperatorActions.slice(0, 4),
    changeTrace: changeTrace.slice(0, 3),
  };
}

function buildTodaySummary(meetings: Meeting[], decisionRadar: DecisionRadarItem[], peopleToPing: PingItem[]): TodaySummary {
  const now = new Date();
  const dayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const meetingsWithStart = meetings.filter((m) => m.start && !Number.isNaN(Date.parse(m.start)));
  const todayMeetings = meetingsWithStart.filter((m) => {
    const ts = Date.parse(m.start as string);
    const d = new Date(ts);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });

  const sortedToday = todayMeetings
    .slice()
    .sort((a, b) => Date.parse(a.start as string) - Date.parse(b.start as string));

  const nextUpcoming = meetingsWithStart
    .slice()
    .sort((a, b) => Date.parse(a.start as string) - Date.parse(b.start as string))
    .find((m) => Date.parse(m.start as string) >= now.getTime());

  const currentWindowMeetings = sortedToday.filter((m) => {
    const startTs = Date.parse(m.start as string);
    const endTs =
      m.end && !Number.isNaN(Date.parse(m.end))
        ? Date.parse(m.end)
        : startTs + 90 * 60 * 1000; // default 90m meeting window if end missing
    return startTs <= now.getTime() && endTs >= now.getTime();
  });

  const sameStartConflict = currentWindowMeetings.length > 1;
  const upcomingToday = sortedToday.find((m) => Date.parse(m.start as string) > now.getTime());

  const scoreMeeting = (m: Meeting): number => {
    const blob = `${m.title || ""} ${m.organizer || ""} ${(m.attendees || []).join(" ")} ${(m.summary || []).join(" ")}`.toLowerCase();
    let score = 0;
    if (/\berp\b|vendor|netsuite|sap|kpmg|decision/.test(blob)) score += 8;
    if (/hema|trinidad|camille|aymen|jade/.test(blob)) score += 3;
    if (/manager forum|forum/.test(blob)) score -= 4;
    return score;
  };

  const primaryCurrent = currentWindowMeetings
    .slice()
    .sort((a, b) => scoreMeeting(b) - scoreMeeting(a) || Date.parse(a.start as string) - Date.parse(b.start as string))[0];

  const latestStartedToday = sortedToday
    .slice()
    .filter((m) => Date.parse(m.start as string) <= now.getTime())
    .sort((a, b) => Date.parse(b.start as string) - Date.parse(a.start as string))[0];

  const primary = primaryCurrent || nextUpcoming || latestStartedToday || sortedToday[0] || meetingsWithStart[0];
  const mode = determineMeetingMode(primary || {});

  const snapshotTs = meetings
    .map((m) => Date.parse(m.generatedAt || ""))
    .filter((v) => !Number.isNaN(v))
    .sort((a, b) => b - a)[0];

  const snapshotLabel = Number.isNaN(snapshotTs)
    ? "No calendar snapshot timestamp available"
    : `Calendar snapshot: ${new Date(snapshotTs).toLocaleString()}`;

  const latestMeetingTs = meetingsWithStart
    .map((m) => Date.parse(m.start as string))
    .filter((v) => !Number.isNaN(v))
    .sort((a, b) => b - a)[0];
  const isSnapshotStale = Number.isNaN(latestMeetingTs)
    ? true
    : new Date(latestMeetingTs) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const staleHint = isSnapshotStale
    ? "Calendar data appears stale. Run `npm run calendar:sync-today` to refresh today's meetings."
    : "";

  const docket: string[] = [];
  if (todayMeetings.length === 0) {
    docket.push(`No meetings found for ${dayLabel} in current snapshot.`);
  } else {
    docket.push(`${todayMeetings.length} meeting${todayMeetings.length === 1 ? "" : "s"} on calendar today.`);
  }
  if (sameStartConflict) {
    const titles = currentWindowMeetings.map((m) => m.title || "Untitled meeting");
    const hasErp = titles.some((t) => /\berp\b|decision/i.test(t));
    const hasManagers = titles.some((t) => /manager/i.test(t));
    if (hasErp && hasManagers) {
      docket.push("Concurrent meetings are scheduled now; ERP decision call is the working priority.");
    } else {
      docket.push(`Concurrent meetings scheduled: ${titles.join(" | ")}.`);
    }
  }
  if (primary?.title) {
    docket.push(`Priority session: ${shortText(primary.title, 12)}.`);
  }
  const primarySummary = (primary?.summary || [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => shortText(s, 12));
  for (const s of primarySummary) docket.push(s);
  if (primarySummary.length === 0 && (primary?.attendees || []).length > 0) {
    docket.push(
      `Attendees in focus: ${(primary?.attendees || []).slice(0, 4).join(", ")}${(primary?.attendees || []).length > 4 ? ", ..." : ""}.`
    );
  }

  const primaryMeetingReason = sameStartConflict
    ? "Concurrent meetings detected. Prioritized ERP/vendor/decision context."
    : primaryCurrent
      ? "Current in-progress meeting selected."
      : nextUpcoming
        ? "Next upcoming meeting selected."
        : latestStartedToday
          ? "Most recent started meeting selected (no future meeting in snapshot)."
          : "No active meeting found in snapshot.";

  const dayPhase: TodaySummary["dayPhase"] =
    currentWindowMeetings.length > 0
      ? "in_meeting"
      : upcomingToday
        ? "pre_meeting"
        : sortedToday.length > 0
          ? "post_meeting"
          : "idle";
  const phaseSummary =
    dayPhase === "in_meeting"
      ? "Use Today for live capture and immediate decision logging."
      : dayPhase === "pre_meeting"
        ? "Use Today for prep and clarifying what must be captured in the next meeting."
        : dayPhase === "post_meeting"
          ? "Meeting block is over. Use Today to review changes, confirm decisions, and drive next actions."
          : "No meetings left in the current snapshot. Use Today as an execution and review workspace.";

  return {
    dayLabel,
    snapshotLabel,
    meetingsTodayCount: todayMeetings.length,
    nextMeetingTitle: primary?.title || "No meeting selected from snapshot",
    nextMeetingStart: primary?.start || "",
    meetingMode: mode,
    docket: docket.slice(0, 4),
    snapshotStale: isSnapshotStale,
    snapshotStaleHint: staleHint,
    currentMeetingTitles: currentWindowMeetings.map((m) => m.title || "Untitled meeting"),
    hasConflictNow: sameStartConflict,
    primaryMeetingReason,
    dayPhase,
    phaseSummary,
  };
}

function buildBrief(meeting: Meeting) {
  const { notes } = loadNotes();

  const title = meeting.title || "Untitled meeting";
  const summaryLines = (meeting.summary || []).map((s) => s.trim()).filter(Boolean);
  const lowerTitle = title.toLowerCase();
  const isIntroMeeting = /(intro|introduction|welcome)/.test(lowerTitle);

  let tldr =
    summaryLines[0] ||
    (isIntroMeeting
      ? "Use this meeting to align role boundaries, stakeholders, and follow-up owners."
      : "Use this meeting to force one ERP decision and one dated next step.");

  const why: string[] = [];
  if (summaryLines[1]) why.push(summaryLines[1]);

  if (isIntroMeeting) {
    why.push("Establish operating expectations with the team.");
    why.push("Clarify current responsibilities and escalation paths.");
  }
  if (/(sap|netsuite|oracle|rfp|vendor|camille)/.test(lowerTitle)) {
    why.push("Land vendor tradeoffs: cost, timeline, ownership.");
  }
  if (/(p2p|invoice|procure|ap)/.test(lowerTitle)) {
    why.push("Clarify P2P controls and escalation path.");
  }
  why.push(
    isIntroMeeting
      ? "Leave with clear owners and next follow-up session."
      : "Leave with owner, date, and decision log entry."
  );

  const dedupWhy = Array.from(new Set(why)).slice(0, 3);

  const risks = notes
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .flatMap((n) => n.summary?.risks || [])
    .map((r) => shortText(r, 10))
    .filter(Boolean)
    .slice(0, 3);

  if (risks.length === 0) {
    risks.push(
      "Scope drift can break Jan 1, 2027 readiness.",
      "Unowned actions delay implementation kickoff.",
      "Cost comparisons may stay non-equivalent."
    );
  }

  const opening = isIntroMeeting
    ? "Opening: Today is alignment-first. We need clear roles, interfaces, and next owners before we leave."
    : "Opening: We need one decision, one owner, and one date before we leave.";

  const asks = isIntroMeeting
    ? [
        "What is each attendee's role in ERP from now to go-live?",
        "Where does this team own decisions vs support execution?",
        "What follow-up session and owner do we lock today?",
      ]
    : /(it|landscape|architecture|integration|technical|cyber)/.test(lowerTitle)
      ? [
          "What does IT own versus vendor own in ERP delivery?",
          "Which interfaces are file-based vs API and who monitors failures?",
          "What IT capacity is committed by month through go-live?",
        ]
    : /(sap|netsuite|oracle|rfp|vendor|camille)/.test(lowerTitle)
      ? [
          "What single criterion decides vendor fit now?",
          "What implementation assumption is still unproven?",
          "Who signs off and by what date?",
        ]
      : [
          "Which blocker threatens timeline most right now?",
          "What can be decided in this meeting, not later?",
          "Who owns the next milestone and deadline?",
        ];

  const targetedFollowUps = buildTargetedFollowUps(meeting, notes);

  const basePreActions =
    (meeting.actions || []).map((a) => shortText(a, 10)).slice(0, 2).length > 0
      ? (meeting.actions || []).map((a) => shortText(a, 10)).slice(0, 2)
      : isIntroMeeting
        ? [
            "Prep a 30-second role intro and your mandate.",
            "List 3 ownership clarifications you need answered.",
          ]
        : [
          "Review last decision delta and unresolved risks.",
          "Prepare one clear recommendation with tradeoffs.",
        ];

  const preActions = [...targetedFollowUps, ...basePreActions].slice(0, 2);

  const whoMatters = buildAttendeeRoles(meeting.attendees || []).slice(0, 8);
  const contextGaps = buildContextGaps(title, whoMatters);

  // Keep generated brief content compact.
  tldr = shortText(tldr, 18);
  const compactWhy = dedupWhy.map((b) => shortText(b, 10)).slice(0, 3);
  const compactRisks = risks.map((b) => shortText(b, 10)).slice(0, 3);
  const compactAsks = asks.map((b) => shortText(b, 9)).slice(0, 3);
  const compactActions = preActions.map((b) => shortText(b, 9)).slice(0, 2);

  const budgetLines = [
    tldr,
    ...compactWhy,
    ...compactRisks,
    opening,
    ...compactAsks,
    ...compactActions,
    ...whoMatters.map((w) => `${w.name} ${w.role}`),
  ];

  if (wordCount(budgetLines) > 200) {
    return {
      tldr: shortText(tldr, 14),
      why: compactWhy.slice(0, 2).map((x) => shortText(x, 8)),
      whoMatters: whoMatters.slice(0, 5),
      risks: compactRisks.slice(0, 2).map((x) => shortText(x, 8)),
      opening: shortText(opening, 14),
      asks: compactAsks.slice(0, 2).map((x) => shortText(x, 8)),
      preActions: compactActions.slice(0, 1).map((x) => shortText(x, 8)),
      contextGaps: contextGaps.slice(0, 3).map((x) => shortText(x, 12)),
    };
  }

  return {
    tldr,
    why: compactWhy,
    whoMatters,
    risks: compactRisks,
    opening,
    asks: compactAsks,
    preActions: compactActions,
    contextGaps,
  };
}

export default async function TodayPage() {
  const meetingsDir = path.join(process.cwd(), "memory", "meetings");
  const memoryMeetings = readMeetings(meetingsDir);
  const tempTodayMeetings = readTempTodayMeetings();
  const { meetings: catalogMeetings } = loadMeetingCatalog();
  const allMeetings = dedupeMeetings([
    ...tempTodayMeetings,
    ...memoryMeetings,
    ...mapCatalogMeetings(catalogMeetings),
  ]);
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const meetingsToday = allMeetings.filter((m) => {
    if (!m.start || Number.isNaN(Date.parse(m.start))) return false;
    const d = new Date(Date.parse(m.start));
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const fallbackCatalogToday = mapCatalogMeetings(catalogMeetings.filter((m) => m.date === todayIso));
  const effectiveMeetings =
    meetingsToday.length > 0 ? allMeetings : dedupeMeetings([...allMeetings, ...fallbackCatalogToday]);
  const effectiveMeetingsToday = effectiveMeetings.filter((m) => {
    if (!m.start || Number.isNaN(Date.parse(m.start))) return false;
    const d = new Date(Date.parse(m.start));
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const meeting = pickNextMeeting(effectiveMeetings) || effectiveMeetingsToday[0] || null;
  const { entities } = loadEntities();
  const { notes } = loadNotes();

  const sections = buildBrief(meeting || {});
  const decisionRadar = buildDecisionRadar(notes, meeting || {});
  const unresolvedQuestions = buildUnresolvedQuestions(notes, meeting || {});
  const peopleToPing = buildPeopleToPing(decisionRadar, entities, meeting || {});
  const deadlineLadder = buildDeadlineLadder(entities);
  const todaySummary = buildTodaySummary(effectiveMeetings, decisionRadar, peopleToPing);
  const afterAction = buildAfterActionReview(notes, entities);
  const itLandscape = buildItLandscapeSnapshot();
  const companyIntelDigest = loadCompanyIntelDigest();
  const workQueue = buildTodayWorkQueueSummary();
  const waterfallUpdate = buildWaterfallUpdateSummary(workQueue);
  const operatorSummary = loadPillarSynthesis();
  const highPriorityTodayContentActions = (workQueue.todayContentReview.topItems || [])
    .filter((i) => String(i.priority || "").toLowerCase() === "high")
    .slice(0, 2)
    .map((i) => shortText(i.title || "Review new evidence", 14));
  const highPriorityTodayContentAsks = (workQueue.todayContentReview.topItems || [])
    .filter((i) => String(i.priority || "").toLowerCase() === "high")
    .slice(0, 2)
    .map((i) => shortText(i.why || i.title || "Review new evidence", 16));
  const mergedPreActions = Array.from(new Set([...highPriorityTodayContentActions, ...sections.preActions])).slice(0, 3);
  const mergedAsks = Array.from(new Set([...highPriorityTodayContentAsks, ...sections.asks])).slice(0, 4);
  const materialCompanyIntel = (companyIntelDigest.headlines || [])
    .filter((h) => h.status === "new")
    .filter((h) => ["confirmed", "reported", "rumor"].includes(String(h.confidence || "").toLowerCase()))
    .slice(0, 2);
  const entityRefs: EntityRef[] = entities.map((e) => ({
    id: e.id,
    name: e.name,
    aliases: e.aliases || [],
  }));
  const focusPrompts = loadFocusPromptsFromTemp();

  return (
    <TodayBriefClient
      brief={{
        title: meeting?.title || "No upcoming meeting selected",
        start: meeting?.start || "",
        teamsLink: meeting?.teamsLink || "",
        dialIn: meeting?.dialIn || "",
        tldr: sections.tldr,
        why: sections.why,
        whoMatters: sections.whoMatters,
        risks: sections.risks,
        opening: sections.opening,
        asks: mergedAsks,
        preActions: mergedPreActions,
        contextGaps: sections.contextGaps,
        decisionRadar,
        unresolvedQuestions,
        peopleToPing,
        deadlineLadder,
        todaySummary,
        meetingsToday: effectiveMeetingsToday
          .slice()
          .sort((a, b) => Date.parse(a.start || "") - Date.parse(b.start || ""))
          .map((m) => ({
            title: m.title || "",
            start: m.start || "",
            end: m.end || undefined,
            meetingMode: determineMeetingMode(m),
          })),
        focusPrompts,
        itLandscape,
        afterAction: afterAction || undefined,
        companyIntelAlert:
          materialCompanyIntel.length > 0
            ? {
                count: materialCompanyIntel.length,
                items: materialCompanyIntel.map((h) => ({
                  id: h.id,
                  title: h.title,
                  date: h.date,
                  confidence: h.confidence,
                  category: h.category,
                })),
                digestAsOf: companyIntelDigest.asOf || "",
              }
            : undefined,
        workQueue,
        waterfallUpdate,
        rawBody: meeting?.rawBody || meeting?.body || "",
        entityRefs,
        operatorSummary: operatorSummary ?? undefined,
      }}
    />
  );
}
