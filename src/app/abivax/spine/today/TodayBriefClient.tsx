"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  classifyErpPillars,
  pillarTone,
  type ErpPillarId,
} from "@/lib/erpPillars";

type AttendeeRole = {
  name: string;
  role: string;
  entityId?: string;
};

type EntityRef = {
  id: string;
  name: string;
  aliases: string[];
};

type BriefViewModel = {
  title: string;
  start: string;
  teamsLink: string;
  dialIn: string;
  tldr: string;
  why: string[];
  whoMatters: AttendeeRole[];
  risks: string[];
  opening: string;
  asks: string[];
  preActions: string[];
  contextGaps: string[];
  decisionRadar: Array<{
    decision: string;
    owner: string;
    due: string;
    blocker: string;
  }>;
  unresolvedQuestions: string[];
  peopleToPing: Array<{
    name: string;
    why: string;
    prompt: string;
    entityId?: string;
  }>;
  deadlineLadder: Array<{
    label: string;
    date: string;
    daysUntil: number;
    entityId?: string;
  }>;
  todaySummary: {
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
  meetingsToday?: Array<{
    title: string;
    start: string;
    end?: string;
    meetingMode?: string;
  }>;
  focusPrompts?: Array<{
    priority: string;
    prompt: string;
    why: string;
    source: string;
  }>;
  companyIntelAlert?: {
    count: number;
    digestAsOf: string;
    items: Array<{
      id: string;
      title: string;
      date: string;
      confidence: string;
      category: string;
    }>;
  };
  workQueue?: {
    todayContentReview: {
      pending: number;
      highPriorityPending: number;
      topItems: Array<{
        title: string;
        why?: string;
        priority?: string;
        source?: string;
        category?: string;
      }>;
    };
    wikiReview: {
      pending: number;
      highPriorityPending: number;
      topItems: Array<{
        title: string;
        why?: string;
        priority?: string;
        source?: string;
        category?: string;
      }>;
    };
    companyIntelReview: {
      pending: number;
      highPriorityPending: number;
      topItems: Array<{
        title: string;
        why?: string;
        priority?: string;
        source?: string;
        category?: string;
      }>;
    };
    agentBacklog: {
      openTodos: number;
      highPriority: number;
      topItems: Array<{
        title: string;
        why?: string;
        priority?: string;
      }>;
    };
  };
  waterfallUpdate?: {
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
  afterAction?: {
    prepNoteId: string;
    outcomeNoteId: string;
    matchedExpectations: string[];
    missedExpectations: string[];
    assumptionsDisproven: string[];
    newSignals: string[];
    attendeeDelta: string[];
    smootherNextTime: string[];
  };
  itLandscape?: {
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
  rawBody: string;
  entityRefs: EntityRef[];
};

type AccomplishmentRecord = {
  done: boolean;
  doneAt?: string;
};

type MergedAction = {
  id: string;
  task: string;
  type: "Email" | "Review" | "Schedule" | "Decide";
  doneWhen: string;
  source: string;
  priority: number;
  autoSuggestDone: boolean;
};

type SystemAction = {
  id: string;
  task: string;
  doneWhen: string;
  source: string;
  priority: number;
  autoDone: boolean;
};

type CaptureState = {
  outcome: "captured" | "unknown" | "owner_missing" | "follow_up_required" | "blocked";
  owner: string;
  confidence: "high" | "medium" | "low";
  note: string;
};

function minutesUntil(start: string): number | null {
  const ts = Date.parse(start);
  if (Number.isNaN(ts)) return null;
  return Math.round((ts - Date.now()) / 60000);
}

function isBoundary(ch: string | undefined) {
  return !ch || !/[a-z0-9]/i.test(ch);
}

function phaseHeaderLabel(
  phase: BriefViewModel["todaySummary"]["dayPhase"],
  hasMeetings: boolean
): string {
  if (phase === "in_meeting") return "Live Session";
  if (phase === "post_meeting") return "Post-Meeting Summary";
  if (phase === "pre_meeting") return "Today's Brief";
  return hasMeetings ? "Today's Brief" : "Program Update";
}

function formatReviewDestinationLabel(value: string) {
  if (!value) return "review";
  return value.replace(/_/g, " ");
}

function inferActionType(action: string): "Email" | "Review" | "Schedule" | "Decide" {
  const lower = String(action || "").toLowerCase();
  if (/reply|send|draft|email|outreach/.test(lower)) return "Email";
  if (/meeting|schedule|align monday|follow-up/.test(lower)) return "Schedule";
  if (/decide|lock|confirm/.test(lower)) return "Decide";
  return "Review";
}

function doneWhenHint(action: string): string {
  const t = inferActionType(action);
  if (t === "Email") return "Done when email is sent and recipients are confirmed.";
  if (t === "Schedule") return "Done when meeting/invite is on calendar with owner + agenda.";
  if (t === "Decide") return "Done when the decision is explicit and communicated.";
  return "Done when you record keep/change/escalate in Program.";
}

const PILLAR_LABEL: Record<ErpPillarId, string> = {
  p2p: "P2P",
  "reporting-data": "Reporting",
  "controls-audit": "Controls",
  enablement: "Enablement",
};

export default function TodayBriefClient({ brief }: { brief: BriefViewModel }) {
  const captureStorageKey = useMemo(
    () => `today-capture:${brief.title}:${brief.start}`,
    [brief.title, brief.start]
  );
  const [countdown, setCountdown] = useState<number | null>(() => minutesUntil(brief.start));
  const [copyLabel, setCopyLabel] = useState("Copy opening");
  const [capture, setCapture] = useState<Record<string, CaptureState>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(captureStorageKey);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, CaptureState>;
    } catch {
      return {};
    }
  });
  const [copyCaptureLabel, setCopyCaptureLabel] = useState("Copy capture note");
  const [copyDraftLabel, setCopyDraftLabel] = useState("Promote to note draft");
  const [quickPad, setQuickPad] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const topFocusPrompts = (brief.focusPrompts || []).slice(0, 3);
  const extraFocusPrompts = (brief.focusPrompts || []).slice(3);
  const topDecisionRadar = brief.decisionRadar.slice(0, 2);
  const extraDecisionRadar = brief.decisionRadar.slice(2);
  const pillarFocus = useMemo(() => {
    const coverage: Record<ErpPillarId, number> = {
      p2p: 0,
      "reporting-data": 0,
      "controls-audit": 0,
      enablement: 0,
    };
    const samples: Record<ErpPillarId, string[]> = {
      p2p: [],
      "reporting-data": [],
      "controls-audit": [],
      enablement: [],
    };
    const sources = [
      ...brief.preActions.slice(0, 4),
      ...brief.asks.slice(0, 5),
      ...brief.risks.slice(0, 4),
      ...(brief.focusPrompts || []).slice(0, 6).map((p) => `${p.prompt} ${p.why}`),
      brief.tldr,
      brief.opening,
      ...brief.contextGaps.slice(0, 4),
    ].filter(Boolean);

    for (const src of sources) {
      const hits = classifyErpPillars(src, { includeEnablement: true });
      for (const hit of hits) {
        coverage[hit] += 1;
        if (samples[hit].length < 2) samples[hit].push(src);
      }
    }

    const ranked = (Object.keys(coverage) as ErpPillarId[])
      .filter((id) => coverage[id] > 0)
      .sort((a, b) => coverage[b] - coverage[a]);

    const promptGroups = (brief.focusPrompts || []).reduce<Record<ErpPillarId, typeof brief.focusPrompts>>(
      (acc, p) => {
        const pid = classifyErpPillars(`${p.prompt} ${p.why}`, { includeEnablement: true })[0] || "enablement";
        acc[pid] = [...(acc[pid] || []), p];
        return acc;
      },
      { p2p: [], "reporting-data": [], "controls-audit": [], enablement: [] }
    );

    return { coverage, samples, ranked, promptGroups };
  }, [brief]);

  useEffect(() => {
    const id = setInterval(() => setCountdown(minutesUntil(brief.start)), 30000);
    return () => clearInterval(id);
  }, [brief.start]);

  const startLabel = useMemo(() => {
    const ts = Date.parse(brief.start);
    if (Number.isNaN(ts)) return "Time not set";
    return new Date(ts).toLocaleString();
  }, [brief.start]);

  const nextMeetingLabel = useMemo(() => {
    const ts = Date.parse(brief.todaySummary.nextMeetingStart);
    if (Number.isNaN(ts)) return "No upcoming meeting time";
    return new Date(ts).toLocaleString();
  }, [brief.todaySummary.nextMeetingStart]);
  const hasRealUpcomingMeeting = useMemo(() => {
    const ts = Date.parse(brief.todaySummary.nextMeetingStart);
    if (Number.isNaN(ts)) return false;
    return ts > Date.now() + 5 * 60000;
  }, [brief.todaySummary.nextMeetingStart]);
  const priorityMeetingLabel = useMemo(() => {
    if (/Most recent started meeting selected/i.test(brief.todaySummary.primaryMeetingReason || "")) {
      return "Latest Completed Session";
    }
    return brief.todaySummary.hasConflictNow ? "Priority Meeting (Conflict)" : "Priority Meeting";
  }, [brief.todaySummary.hasConflictNow, brief.todaySummary.primaryMeetingReason]);

  const waterfallReviewedLabel = useMemo(() => {
    const ts = Date.parse(brief.waterfallUpdate?.lastReviewedAt || "");
    if (Number.isNaN(ts)) return "No recent waterfall review";
    return new Date(ts).toLocaleString();
  }, [brief.waterfallUpdate?.lastReviewedAt]);

  const ownerOptions = useMemo(() => {
    const fromAttendees = brief.whoMatters.map((w) => w.name).filter(Boolean);
    return Array.from(new Set([...fromAttendees, "Frederick", "Hema Kesh", "Didier Blondel", "Unassigned"]));
  }, [brief.whoMatters]);

  const quickChips = useMemo(() => {
    const base: string[] = [];
    for (const s of brief.itLandscape?.systems || []) base.push(s.name);
    for (const i of brief.itLandscape?.integrations || []) base.push(i.feedType);
    return Array.from(new Set(base.filter(Boolean))).slice(0, 16);
  }, [brief.itLandscape]);

  const captureItems = useMemo(() => {
    const base = brief.contextGaps.slice(0, 5).map((line, i) => ({
      id: `gap-${i}`,
      label: line,
    }));

    if (brief.todaySummary.meetingMode === "Finance Intro") {
      base.unshift(
        { id: "q-budget-owner", label: "Budget cadence owner clarified?" },
        { id: "q-escalation-path", label: "Escalation path agreed?" },
        { id: "q-next-checkpoint", label: "Next checkpoint date set?" }
      );
    }

    if (brief.todaySummary.meetingMode === "IT Landscape Session") {
      base.unshift(
        { id: "it-system-owners", label: "System owner/admin owner mapped for top systems?" },
        { id: "it-integration-map", label: "Integration map captured (file/API, freq, owner, fail handling)?" },
        { id: "it-access-path", label: "Access path defined for required on-prem and SaaS systems?" },
        { id: "it-capacity-commit", label: "IT capacity commitment by month captured?" }
      );
    }

    const carryForward = (brief.afterAction?.smootherNextTime || []).slice(0, 2);
    for (let i = carryForward.length - 1; i >= 0; i -= 1) {
      base.unshift({
        id: `carry-${i}`,
        label: `Carry forward: ${carryForward[i]}`,
      });
    }
    return base;
  }, [brief.afterAction?.smootherNextTime, brief.contextGaps, brief.todaySummary.meetingMode]);

  useEffect(() => {
    try {
      localStorage.setItem(captureStorageKey, JSON.stringify(capture));
    } catch {
      // Ignore storage write errors.
    }
  }, [captureStorageKey, capture]);

  const updateCapture = (id: string, patch: Partial<CaptureState>) => {
    setCapture((prev) => ({
      ...prev,
      [id]: {
        outcome: prev[id]?.outcome || "unknown",
        owner: prev[id]?.owner || "Unassigned",
        confidence: prev[id]?.confidence || "medium",
        note: prev[id]?.note || "",
        ...patch,
      },
    }));
  };

  const captureConflicts = useMemo(() => {
    const warnings: string[] = [];
    const entries = captureItems.map((item) => ({ item, value: capture[item.id] }));

    for (const { item, value } of entries) {
      if (!value) continue;
      if ((value.outcome === "captured" || value.outcome === "owner_missing") && value.owner === "Unassigned") {
        warnings.push(`"${item.label}" is captured but owner is still unassigned.`);
      }
      if (value.outcome === "captured" && value.confidence === "low") {
        warnings.push(`"${item.label}" is captured with low confidence; validate before closing.`);
      }
    }

    const budget = capture["q-budget-owner"];
    const checkpoint = capture["q-next-checkpoint"];
    if (
      budget &&
      checkpoint &&
      budget.outcome !== "captured" &&
      checkpoint.outcome === "captured"
    ) {
      warnings.push("Checkpoint is marked captured, but budget owner is not captured.");
    }

    return warnings.slice(0, 5);
  }, [capture, captureItems]);

  const onCopyCapture = async () => {
    const lines: string[] = [];
    lines.push(`Meeting capture: ${brief.title}`);
    lines.push(`Mode: ${brief.todaySummary.meetingMode}`);
    lines.push(`Start: ${startLabel}`);
    lines.push("");
    lines.push("Updates:");

    for (const item of captureItems) {
      const value = capture[item.id];
      const outcome = value?.outcome || "unknown";
      const owner = value?.owner || "Unassigned";
      const confidence = value?.confidence || "medium";
      const note = value?.note?.trim();
      lines.push(`- ${item.label}`);
      lines.push(`  outcome=${outcome}; owner=${owner}; confidence=${confidence}${note ? `; note=${note}` : ""}`);
    }

    if (captureConflicts.length > 0) {
      lines.push("");
      lines.push("Conflicts to resolve:");
      for (const warning of captureConflicts) lines.push(`- ${warning}`);
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyCaptureLabel("Copied");
      setTimeout(() => setCopyCaptureLabel("Copy capture note"), 1200);
    } catch {
      setCopyCaptureLabel("Copy failed");
      setTimeout(() => setCopyCaptureLabel("Copy capture note"), 1200);
    }
  };

  const onPromoteDraft = async () => {
    const lines: string[] = [];
    lines.push(`Title: ${brief.title} - live capture draft`);
    lines.push(`Start: ${startLabel}`);
    lines.push(`Mode: ${brief.todaySummary.meetingMode}`);
    lines.push("");
    lines.push("Captured outcomes:");
    for (const item of captureItems) {
      const value = capture[item.id];
      const outcome = value?.outcome || "unknown";
      const owner = value?.owner || "Unassigned";
      const note = value?.note?.trim() || "";
      if (outcome === "unknown" && !note) continue;
      lines.push(`- ${item.label} | outcome=${outcome} | owner=${owner}${note ? ` | note=${note}` : ""}`);
    }
    lines.push("");
    lines.push("Suggested next actions:");
    for (const q of brief.afterAction?.smootherNextTime || []) {
      lines.push(`- ${q}`);
    }
    if (brief.todaySummary.meetingMode === "IT Landscape Session" && brief.itLandscape) {
      lines.push("");
      lines.push("IT systems snapshot:");
      for (const s of brief.itLandscape.systems.slice(0, 6)) {
        lines.push(`- ${s.name} (${s.category}) | business=${s.businessOwner} | system=${s.systemOwner}`);
      }
    }
    if (quickPad.trim()) {
      lines.push("");
      lines.push("Quick capture scratchpad:");
      lines.push(quickPad.trim());
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyDraftLabel("Draft copied");
      setTimeout(() => setCopyDraftLabel("Promote to note draft"), 1200);
    } catch {
      setCopyDraftLabel("Copy failed");
      setTimeout(() => setCopyDraftLabel("Promote to note draft"), 1200);
    }
  };

  const countdownLabel =
    countdown === null
      ? "Unknown"
      : countdown >= 0
        ? `${countdown} min`
      : `${Math.abs(countdown)} min ago`;
  const liveCaptureOpen = false;
  const myTopTodos = useMemo(() => {
    const out: string[] = [];
    if (brief.todaySummary.hasConflictNow) {
      out.push("Resolve the concurrent meeting conflict explicitly and stay anchored on the ERP decision call.");
    }
    if ((brief.itLandscape?.accessRequests || []).some((a) => /pending|requested/i.test(a.status))) {
      out.push("Use today's meetings to unblock access and integration ownership where possible.");
    }
    if ((brief.companyIntelAlert?.count || 0) > 0) {
      out.push("Note whether any company-intel changes affect ERP messaging or timing assumptions.");
    }
    for (const item of brief.preActions.slice(0, 2)) out.push(item);
    return Array.from(new Set(out)).slice(0, 4);
  }, [brief.companyIntelAlert?.count, brief.itLandscape?.accessRequests, brief.preActions, brief.todaySummary.meetingsTodayCount]);

  const mergedActions = useMemo((): MergedAction[] => {
    const items: MergedAction[] = [];
    const normalizeKey = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    const seen = new Set<string>();
    const isDupe = (key: string): boolean => {
      for (const k of seen) {
        if (k.includes(key.slice(0, 40)) || key.includes(k.slice(0, 40))) return true;
      }
      return false;
    };
    const typePriority = (t: "Email" | "Review" | "Schedule" | "Decide"): number => {
      if (t === "Email") return 3;
      if (t === "Decide") return 2;
      if (t === "Schedule") return 1;
      return 0;
    };
    // Source A: operatorActions (+1 priority bonus)
    for (const op of brief.waterfallUpdate?.operatorActions || []) {
      if (!op.action) continue;
      const key = normalizeKey(op.action);
      if (isDupe(key)) continue;
      seen.add(key);
      const type = inferActionType(op.action);
      items.push({
        id: `op-${key.slice(0, 30)}`,
        task: op.action,
        type,
        doneWhen: doneWhenHint(op.action),
        source: op.sourceLabel || "",
        priority: typePriority(type) + 1,
        autoSuggestDone: /^Sent:/i.test(String(op.sourceLabel || "")) && type === "Email",
      });
    }
    // Source B: changeTrace.nextMove
    for (const trace of brief.waterfallUpdate?.changeTrace || []) {
      if (!trace.nextMove) continue;
      const key = normalizeKey(trace.nextMove);
      if (isDupe(key)) continue;
      seen.add(key);
      const type = inferActionType(trace.nextMove);
      items.push({
        id: `trace-${key.slice(0, 30)}`,
        task: trace.nextMove,
        type,
        doneWhen: doneWhenHint(trace.nextMove),
        source: trace.sourceLabel || "",
        priority: typePriority(type),
        autoSuggestDone: false,
      });
    }
    // Fallback: preActions + asks
    if (items.length === 0) {
      for (const action of [...(brief.preActions || []), ...(brief.asks || []).slice(0, 2)].slice(0, 5)) {
        const key = normalizeKey(action);
        if (isDupe(key)) continue;
        seen.add(key);
        const type = inferActionType(action);
        items.push({
          id: `fb-${key.slice(0, 30)}`,
          task: action,
          type,
          doneWhen: doneWhenHint(action),
          source: "",
          priority: typePriority(type),
          autoSuggestDone: false,
        });
      }
    }
    return items.sort((a, b) => b.priority - a.priority);
  }, [brief.waterfallUpdate?.operatorActions, brief.waterfallUpdate?.changeTrace, brief.preActions, brief.asks]);

  const codexWorkQueue = useMemo(() => {
    const watchlist: Array<{ area: string; title: string; why?: string; priority?: string; category?: string }> = [];
    const toBucket = (item: { area: string; title: string; why?: string; priority?: string; category?: string }) => {
      const priority = String(item.priority || "medium").toLowerCase();
      const category = String(item.category || "").toLowerCase();
      if (priority === "low" || category === "pillar-waiting-overload" || category.includes("waiting")) {
        watchlist.push(item);
      }
    };
    for (const i of brief.workQueue?.todayContentReview.topItems || [])
      toBucket({ area: "Today content review", title: i.title, why: i.why, priority: i.priority, category: i.category });
    for (const i of brief.workQueue?.wikiReview.topItems || [])
      toBucket({ area: "Wiki review", title: i.title, why: i.why, priority: i.priority, category: i.category });
    for (const i of brief.workQueue?.companyIntelReview.topItems || [])
      toBucket({ area: "Company intel review", title: i.title, why: i.why, priority: i.priority, category: i.category });
    for (const i of brief.workQueue?.agentBacklog.topItems || [])
      toBucket({ area: "Agent backlog", title: i.title, why: i.why, priority: i.priority });
    return { watchlist: watchlist.slice(0, 6) };
  }, [brief.workQueue]);

  const systemActions = useMemo((): SystemAction[] => {
    const q = brief.workQueue;
    if (!q) return [];
    const rows: SystemAction[] = [
      {
        id: "sys-company-high-priority",
        task: "Triage high-priority company-intel queue items",
        doneWhen: `Done when high-priority company-intel pending is 0 (currently ${q.companyIntelReview.highPriorityPending}).`,
        source: "Company intel review queue",
        priority: 6,
        autoDone: q.companyIntelReview.highPriorityPending === 0,
      },
      {
        id: "sys-company-pending-clear",
        task: "Clear remaining company-intel pending review items",
        doneWhen: `Done when company-intel pending is 0 (currently ${q.companyIntelReview.pending}).`,
        source: "Company intel review queue",
        priority: 5,
        autoDone: q.companyIntelReview.pending === 0,
      },
      {
        id: "sys-today-content-high-priority",
        task: "Triage high-priority today-content review items",
        doneWhen: `Done when high-priority today-content pending is 0 (currently ${q.todayContentReview.highPriorityPending}).`,
        source: "Today content review queue",
        priority: 4,
        autoDone: q.todayContentReview.highPriorityPending === 0,
      },
      {
        id: "sys-wiki-high-priority",
        task: "Triage high-priority wiki review items",
        doneWhen: `Done when high-priority wiki pending is 0 (currently ${q.wikiReview.highPriorityPending}).`,
        source: "Wiki review queue",
        priority: 3,
        autoDone: q.wikiReview.highPriorityPending === 0,
      },
      {
        id: "sys-agent-backlog-high-priority",
        task: "Close high-priority agent backlog items",
        doneWhen: `Done when high-priority agent backlog is 0 (currently ${q.agentBacklog.highPriority}).`,
        source: "Agent backlog",
        priority: 4,
        autoDone: q.agentBacklog.highPriority === 0,
      },
    ];
    return rows.sort((a, b) => b.priority - a.priority);
  }, [brief.workQueue]);

  const topChangeTraceItems = (brief.waterfallUpdate?.changeTrace || []).slice(0, 2);
  const extraChangeTraceItems = (brief.waterfallUpdate?.changeTrace || []).slice(2);

  // Accomplishments - persisted per calendar day
  const todayDate = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);
  const accomplishmentStorageKey = `today-accomplishments:${todayDate}`;
  const [accomplishments, setAccomplishments] = useState<Record<string, AccomplishmentRecord>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(`today-accomplishments:${new Date().toISOString().slice(0, 10)}`);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, AccomplishmentRecord>;
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(accomplishmentStorageKey, JSON.stringify(accomplishments)); }
    catch { /* ignore */ }
  }, [accomplishmentStorageKey, accomplishments]);
  // Auto-suggest done on mount for actions sourced from "Sent:" emails
  useEffect(() => {
    const updates: Record<string, AccomplishmentRecord> = {};
    let changed = false;
    for (const item of mergedActions) {
      if (item.autoSuggestDone && !accomplishments[item.id]) {
        updates[item.id] = { done: true, doneAt: new Date().toISOString() };
        changed = true;
      }
    }
    if (changed) setAccomplishments((prev) => ({ ...prev, ...updates }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount
  const toggleDone = (id: string) => {
    setAccomplishments((prev) => {
      if (prev[id]?.done) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { done: true, doneAt: new Date().toISOString() } };
    });
  };
  const [copyEodLabel, setCopyEodLabel] = useState("Copy EOD summary");
  const onCopyEod = async () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
    const done = mergedActions.filter((a) => accomplishments[a.id]?.done);
    const open = mergedActions.filter((a) => !accomplishments[a.id]?.done);
    const lines: string[] = [];
    lines.push(`## EOD Summary - ${dateStr}`);
    lines.push("");
    lines.push(`### Completed (${done.length}/${mergedActions.length})`);
    if (done.length === 0) lines.push("- No actions marked complete.");
    for (const item of done) {
      const doneAt = accomplishments[item.id]?.doneAt;
      const timeStr = doneAt ? new Date(doneAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
      lines.push(`- ${timeStr ? `[${timeStr}] ` : ""}${item.task}`);
    }
    if (open.length > 0) {
      lines.push("");
      lines.push("### Open");
      for (const item of open) lines.push(`- [${item.type}] ${item.task}`);
    }
    lines.push("");
    lines.push(`_Abivax Operator Spine | ${dateStr}_`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyEodLabel("Copied");
      setTimeout(() => setCopyEodLabel("Copy EOD summary"), 1500);
    } catch {
      setCopyEodLabel("Copy failed");
      setTimeout(() => setCopyEodLabel("Copy EOD summary"), 1500);
    }
  };
  const systemAccomplishmentStorageKey = `today-system-accomplishments:${todayDate}`;
  const [systemAccomplishments, setSystemAccomplishments] = useState<Record<string, AccomplishmentRecord>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(`today-system-accomplishments:${new Date().toISOString().slice(0, 10)}`);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, AccomplishmentRecord>;
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(systemAccomplishmentStorageKey, JSON.stringify(systemAccomplishments));
    } catch {
      // Ignore storage write errors.
    }
  }, [systemAccomplishmentStorageKey, systemAccomplishments]);
  useEffect(() => {
    let changed = false;
    const updates: Record<string, AccomplishmentRecord> = {};
    for (const item of systemActions) {
      if (item.autoDone && !systemAccomplishments[item.id]) {
        updates[item.id] = { done: true, doneAt: new Date().toISOString() };
        changed = true;
      }
    }
    if (changed) setSystemAccomplishments((prev) => ({ ...prev, ...updates }));
  }, [systemActions, systemAccomplishments]);
  const toggleSystemDone = (id: string) => {
    setSystemAccomplishments((prev) => {
      if (prev[id]?.done) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { done: true, doneAt: new Date().toISOString() } };
    });
  };
  const [copySystemEodLabel, setCopySystemEodLabel] = useState("Copy system summary");
  const onCopySystemEod = async () => {
    const done = systemActions.filter((a) => systemAccomplishments[a.id]?.done);
    const open = systemActions.filter((a) => !systemAccomplishments[a.id]?.done);
    const lines: string[] = [];
    lines.push("System actions summary (Codex/Claude)");
    lines.push("");
    lines.push(`Completed (${done.length}/${systemActions.length})`);
    if (done.length === 0) lines.push("- No system actions marked complete.");
    for (const item of done) lines.push(`- ${item.task}`);
    if (open.length > 0) {
      lines.push("");
      lines.push("Open");
      for (const item of open) lines.push(`- ${item.task}`);
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopySystemEodLabel("Copied");
      setTimeout(() => setCopySystemEodLabel("Copy system summary"), 1500);
    } catch {
      setCopySystemEodLabel("Copy failed");
      setTimeout(() => setCopySystemEodLabel("Copy system summary"), 1500);
    }
  };

  const builtProgramHandoff = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Program handoff from Today`);
    lines.push(`Meeting: ${brief.title}`);
    lines.push(`Mode: ${brief.todaySummary.meetingMode}`);
    lines.push(`Start: ${startLabel}`);
    lines.push("");
    lines.push("Why this matters:");
    lines.push(`- ${brief.tldr}`);
    lines.push("");
    lines.push("Top actions to carry into Program:");
    for (const item of brief.preActions.slice(0, 3)) lines.push(`- ${item}`);
    for (const item of brief.decisionRadar.slice(0, 3)) {
      lines.push(`- Decision: ${item.decision} | owner=${item.owner} | due=${item.due} | blocker=${item.blocker}`);
    }
    if (quickPad.trim()) {
      lines.push("");
      lines.push("Quick capture notes:");
      lines.push(quickPad.trim());
    }
    return lines.join("\n");
  }, [brief, startLabel, quickPad]);

  const builtDeckHandoff = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Deck data-request handoff from Today`);
    lines.push(`Meeting: ${brief.title}`);
    lines.push(`Mode: ${brief.todaySummary.meetingMode}`);
    lines.push(`Start: ${startLabel}`);
    lines.push("");
    lines.push("Potential deck-ready points:");
    for (const item of brief.asks.slice(0, 4)) lines.push(`- Ask/point: ${item}`);
    for (const item of brief.risks.slice(0, 3)) lines.push(`- Risk: ${item}`);
    for (const item of brief.contextGaps.slice(0, 5)) lines.push(`- Data gap: ${item}`);
    const captured = captureItems
      .map((c) => ({ c, v: capture[c.id] }))
      .filter(({ v }) => v && (v.outcome !== "unknown" || (v.note || "").trim()));
    if (captured.length > 0) {
      lines.push("");
      lines.push("Live capture highlights:");
      for (const { c, v } of captured.slice(0, 8)) {
        const note = v?.note?.trim() ? ` | note=${v.note.trim()}` : "";
        lines.push(`- ${c.label} | outcome=${v?.outcome} | owner=${v?.owner}${note}`);
      }
    }
    if (quickPad.trim()) {
      lines.push("");
      lines.push("Scratchpad:");
      lines.push(quickPad.trim());
    }
    return lines.join("\n");
  }, [brief, startLabel, captureItems, capture, quickPad]);

  const programHandoffHref = useMemo(
    () =>
      `/abivax/spine/program?source=${encodeURIComponent(
        `Today: ${brief.todaySummary.meetingMode}`
      )}&handoff=${encodeURIComponent(builtProgramHandoff)}`,
    [brief.todaySummary.meetingMode, builtProgramHandoff]
  );

  const deckHandoffHref = useMemo(
    () =>
      `/abivax/spine/presentations?source=${encodeURIComponent(
        `Today: ${brief.todaySummary.meetingMode}`
      )}&handoff=${encodeURIComponent(builtDeckHandoff)}`,
    [brief.todaySummary.meetingMode, builtDeckHandoff]
  );

  const onCopyOpening = async () => {
    try {
      await navigator.clipboard.writeText(brief.opening);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy opening"), 1200);
    } catch {
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy opening"), 1200);
    }
  };

  const onReadAloud = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(`${brief.tldr}. ${brief.opening}`);
    utterance.rate = 1.0;
    synth.speak(utterance);
  };

  const entityPatterns = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ id: string; lower: string }> = [];

    for (const ref of brief.entityRefs || []) {
      const labels = [ref.name, ...(ref.aliases || [])].map((v) => v.trim()).filter(Boolean);
      for (const label of labels) {
        const lower = label.toLowerCase();
        if (lower.length < 3 || seen.has(`${ref.id}:${lower}`)) continue;
        seen.add(`${ref.id}:${lower}`);
        out.push({ id: ref.id, lower });
      }
    }

    return out.sort((a, b) => b.lower.length - a.lower.length);
  }, [brief.entityRefs]);

  const renderLinkedText = (text: string) => {
    const lower = text.toLowerCase();
    const pieces: ReactNode[] = [];
    let cursor = 0;
    let key = 0;

    while (cursor < text.length) {
      let best: { idx: number; len: number; id: string } | null = null;

      for (const p of entityPatterns) {
        let idx = lower.indexOf(p.lower, cursor);
        while (idx !== -1) {
          const before = idx > 0 ? lower[idx - 1] : undefined;
          const after = idx + p.lower.length < lower.length ? lower[idx + p.lower.length] : undefined;
          if (isBoundary(before) && isBoundary(after)) {
            if (!best || idx < best.idx || (idx === best.idx && p.lower.length > best.len)) {
              best = { idx, len: p.lower.length, id: p.id };
            }
            break;
          }
          idx = lower.indexOf(p.lower, idx + 1);
        }
      }

      if (!best) {
        pieces.push(text.slice(cursor));
        break;
      }

      if (best.idx > cursor) {
        pieces.push(text.slice(cursor, best.idx));
      }

      const matched = text.slice(best.idx, best.idx + best.len);
      pieces.push(
        <Link
          key={`m-${key++}`}
          href={`/abivax/spine/entity/${best.id}`}
          className="underline decoration-slate-500/70 underline-offset-2 hover:text-amber-300 hover:decoration-amber-400"
        >
          {matched}
        </Link>
      );

      cursor = best.idx + best.len;
    }

    return pieces;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-900/30 p-5 text-sm text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-100">{brief.todaySummary.dayLabel}</p>
            <p className="mt-0.5 text-xs text-slate-400">{brief.todaySummary.phaseSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-slate-700/60 bg-slate-900/40 px-2 py-1 text-slate-300">
              {brief.todaySummary.meetingsTodayCount} meeting{brief.todaySummary.meetingsTodayCount !== 1 ? "s" : ""}
            </span>
            <span className="rounded-full border border-slate-700/60 bg-slate-900/40 px-2 py-1 text-slate-300">
              Updated: {brief.todaySummary.snapshotLabel.replace(/^Calendar snapshot:\s*/, "")}
            </span>
          </div>
        </div>
        {brief.todaySummary.hasConflictNow && brief.todaySummary.currentMeetingTitles.length > 1 && (
          <p className="mt-2 rounded-md border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
            Concurrent meetings now: {brief.todaySummary.currentMeetingTitles.join(" | ")}
          </p>
        )}
        {brief.todaySummary.snapshotStale && (
          <p className="mt-2 rounded-md border border-slate-600/40 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-400">
            Calendar last updated {brief.todaySummary.snapshotLabel.replace(/^Calendar snapshot:\s*/i, "")} - meetings shown may not reflect recent changes. Waterfall data is unaffected.
          </p>
        )}
      </section>

      {/* Meetings */}
      {(brief.meetingsToday || []).length > 0 && (
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/20 p-4 text-sm text-slate-200">
          <h2 className="text-xs font-semibold text-slate-400">Meetings today</h2>
          <ul className="mt-2 space-y-1.5">
            {(brief.meetingsToday || []).map((m) => {
              const startTs = Date.parse(m.start);
              const endTs = m.end && !Number.isNaN(Date.parse(m.end)) ? Date.parse(m.end) : startTs + 90 * 60 * 1000;
              const nowTs = Date.now();
              const status: "live" | "done" | "upcoming" =
                nowTs >= startTs && nowTs <= endTs ? "live" : nowTs > endTs ? "done" : "upcoming";
              const timeLabel = Number.isNaN(startTs)
                ? ""
                : new Date(startTs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              return (
                <li key={`${m.start}-${m.title}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      status === "live"
                        ? "border-emerald-700/40 bg-emerald-950/30 text-emerald-300"
                        : status === "done"
                          ? "border-slate-700/30 bg-slate-900/20 text-slate-500"
                          : "border-cyan-700/30 bg-cyan-950/20 text-cyan-300"
                    }`}
                  >
                    {status}
                  </span>
                  <span className={`text-sm ${status === "done" ? "text-slate-500" : "text-slate-100"}`}>
                    {m.title}
                  </span>
                  {timeLabel && (
                    <span className="text-[11px] text-slate-500">
                      {timeLabel}{m.meetingMode ? ` | ${m.meetingMode}` : ""}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Mike Actions + Accomplishments */}
      <div className="grid gap-4 xl:grid-cols-[5fr_3fr]">
        <section className="rounded-xl border border-emerald-600/30 bg-emerald-950/25 p-5 text-sm text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-emerald-400">Mike Actions</h2>
            <span className="text-[11px] text-emerald-300/60">
              {mergedActions.filter((a) => accomplishments[a.id]?.done).length} of {mergedActions.length} done
            </span>
          </div>
          <ul className="mt-3 space-y-3">
            {mergedActions.map((item) => {
              const isDone = accomplishments[item.id]?.done ?? false;
              const typeColors: Record<string, string> = {
                Email: "border-sky-700/40 bg-sky-900/20 text-sky-300",
                Review: "border-amber-700/40 bg-amber-900/20 text-amber-300",
                Schedule: "border-violet-700/40 bg-violet-900/20 text-violet-300",
                Decide: "border-emerald-700/40 bg-emerald-900/20 text-emerald-300",
              };
              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 border-l-2 pl-2.5 py-0.5 transition-opacity ${
                    isDone ? "border-slate-600/40 opacity-50" : "border-emerald-600/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDone(item.id)}
                    aria-label={isDone ? "Mark incomplete" : "Mark done"}
                    className={`mt-1 h-4 w-4 shrink-0 rounded border transition-colors ${
                      isDone
                        ? "border-emerald-600/60 bg-emerald-800/40"
                        : "border-slate-600/60 bg-slate-900/40 hover:border-emerald-600/50"
                    }`}
                  >
                    {isDone && (
                      <svg viewBox="0 0 12 12" className="h-full w-full p-0.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${isDone ? "text-slate-500 line-through decoration-slate-600" : "text-slate-100"}`}>
                      <span className={`mr-1.5 inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${typeColors[item.type] ?? typeColors.Review}`}>
                        {item.type}
                      </span>
                      {renderLinkedText(item.task)}
                    </p>
                    {!isDone && (
                      <p className="mt-0.5 text-[11px] text-slate-500">{item.doneWhen}</p>
                    )}
                    {item.source && (
                      <p className="mt-0.5 text-[10px] text-slate-600">From: {item.source}</p>
                    )}
                  </div>
                </li>
              );
            })}
            {mergedActions.length === 0 && (
              <li className="border-l-2 border-slate-700/40 pl-2.5 py-1 text-xs text-slate-500">
                No actions derived from today&apos;s signals yet.
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-700/50 bg-slate-900/20 p-5 text-sm text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-300">
              Accomplishments
              <span className="ml-2 text-xs font-normal text-slate-500">
                {mergedActions.filter((a) => accomplishments[a.id]?.done).length}/{mergedActions.length}
              </span>
            </h2>
            <button
              type="button"
              onClick={onCopyEod}
              className="rounded border border-slate-700/50 bg-slate-900/40 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
            >
              {copyEodLabel}
            </button>
          </div>
          {mergedActions.filter((a) => accomplishments[a.id]?.done).length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">Check off actions to build your EOD summary.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {mergedActions
                .filter((a) => accomplishments[a.id]?.done)
                .map((item) => {
                  const doneAt = accomplishments[item.id]?.doneAt;
                  const timeStr = doneAt
                    ? new Date(doneAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                    : "";
                  return (
                    <li key={item.id} className="flex items-start gap-2">
                      <svg viewBox="0 0 12 12" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300 line-through decoration-slate-600/60">{item.task}</p>
                        {timeStr && <p className="text-[10px] text-slate-600">{timeStr}</p>}
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </section>
      </div>

      {/* What Changed */}
      {brief.waterfallUpdate && (
        <section className="rounded-xl border border-cyan-700/30 bg-slate-900/50 p-5 text-sm text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-cyan-400">What Changed</h2>
            <span className="text-[11px] text-slate-500">{waterfallReviewedLabel}</span>
          </div>
          <ul className="mt-3 space-y-2">
            {topChangeTraceItems.length > 0 ? (
              topChangeTraceItems.map((c) => (
                <li
                  key={c.sourceLabel}
                  className={`rounded border p-2 ${c.nextMove ? "border-l-2 border-amber-600/40 border-slate-700/40 bg-slate-900/30" : "border-slate-700/30 bg-slate-900/20"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{c.sourceLabel}</p>
                    <span className="text-xs text-cyan-300">{c.status}</span>
                  </div>
                  {c.nextMove && <p className="mt-1 text-sm text-slate-200">{c.nextMove}</p>}
                  {c.impacted.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-300">{"->"} {c.impacted.join(", ")}</p>
                  )}
                  {c.reviewWhere && (
                    <p className="mt-1 text-[11px] text-slate-500">{"->"} {formatReviewDestinationLabel(c.reviewWhere)}</p>
                  )}
                </li>
              ))
            ) : (
              <li className="rounded border border-slate-700/40 bg-slate-900/30 p-2 text-[11px] text-slate-400">
                No high-signal changes traced since the last review.
              </li>
            )}
          </ul>
          {extraChangeTraceItems.length > 0 && (
            <details className="mt-2 rounded border border-slate-700/40 bg-slate-900/20 p-2">
              <summary className="cursor-pointer text-[11px] text-cyan-200">
                Show {extraChangeTraceItems.length} more change{extraChangeTraceItems.length === 1 ? "" : "s"}
              </summary>
              <ul className="mt-2 space-y-2">
                {extraChangeTraceItems.map((c) => (
                  <li
                    key={c.sourceLabel}
                    className={`rounded border p-2 ${c.nextMove ? "border-l-2 border-amber-600/40 border-slate-700/40 bg-slate-900/30" : "border-slate-700/30 bg-slate-900/20"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{c.sourceLabel}</p>
                      <span className="text-xs text-cyan-300">{c.status}</span>
                    </div>
                    {c.nextMove && <p className="mt-1 text-sm text-slate-200">{c.nextMove}</p>}
                    {c.impacted.length > 0 && (
                      <p className="mt-1 text-[11px] text-slate-300">{"->"} {c.impacted.join(", ")}</p>
                    )}
                    {c.reviewWhere && (
                      <p className="mt-1 text-[11px] text-slate-500">{"->"} {formatReviewDestinationLabel(c.reviewWhere)}</p>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {brief.waterfallUpdate.pushedThrough.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              Refreshed: {brief.waterfallUpdate.pushedThrough.slice(0, 3).join(" | ")}
            </p>
          )}
        </section>
      )}

      {/* System Queue */}
      <section className="rounded-xl border border-slate-700/40 bg-slate-900/20 p-5 text-sm text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-slate-400">System queue - Codex/Claude</h2>
          <p className="text-[11px] text-slate-500">
            {brief.workQueue?.todayContentReview.pending || 0} content | {brief.workQueue?.wikiReview.pending || 0} wiki | {brief.workQueue?.companyIntelReview.pending || 0} intel | {brief.workQueue?.agentBacklog.openTodos || 0} agent tasks
            {((brief.workQueue?.todayContentReview.highPriorityPending || 0) +
              (brief.workQueue?.wikiReview.highPriorityPending || 0) +
              (brief.workQueue?.companyIntelReview.highPriorityPending || 0) +
              (brief.workQueue?.agentBacklog.highPriority || 0)) > 0 && (
              <span className="text-amber-400">
                {" "}({(brief.workQueue?.todayContentReview.highPriorityPending || 0) +
                  (brief.workQueue?.wikiReview.highPriorityPending || 0) +
                  (brief.workQueue?.companyIntelReview.highPriorityPending || 0) +
                  (brief.workQueue?.agentBacklog.highPriority || 0)} high)
              </span>
            )}
          </p>
        </div>
        <div className="mt-3 grid gap-4 xl:grid-cols-[5fr_3fr]">
          <div>
            <h3 className="text-xs font-semibold text-amber-400">System Actions</h3>
            <ul className="mt-2 space-y-2">
              {systemActions.map((item) => {
                const isDone = systemAccomplishments[item.id]?.done ?? false;
                return (
                  <li
                    key={item.id}
                    className={`flex items-start gap-3 border-l-2 pl-2.5 py-0.5 transition-opacity ${
                      isDone ? "border-slate-600/40 opacity-50" : "border-amber-600/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSystemDone(item.id)}
                      aria-label={isDone ? "Mark incomplete" : "Mark done"}
                      className={`mt-1 h-4 w-4 shrink-0 rounded border transition-colors ${
                        isDone
                          ? "border-emerald-600/60 bg-emerald-800/40"
                          : "border-slate-600/60 bg-slate-900/40 hover:border-amber-600/50"
                      }`}
                    >
                      {isDone && (
                        <svg viewBox="0 0 12 12" className="h-full w-full p-0.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${isDone ? "text-slate-500 line-through decoration-slate-600" : "text-slate-100"}`}>
                        {item.task}
                      </p>
                      {!isDone && <p className="mt-0.5 text-[11px] text-slate-500">{item.doneWhen}</p>}
                      <p className="mt-0.5 text-[10px] text-slate-600">From: {item.source}</p>
                    </div>
                  </li>
                );
              })}
              {systemActions.length === 0 && (
                <li className="border-l-2 border-slate-700/40 pl-2.5 py-1 text-xs text-slate-500">
                  No derived system actions from current queue state.
                </li>
              )}
            </ul>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-300">
                System Accomplishments
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {systemActions.filter((a) => systemAccomplishments[a.id]?.done).length}/{systemActions.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={onCopySystemEod}
                className="rounded border border-slate-700/50 bg-slate-900/40 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                {copySystemEodLabel}
              </button>
            </div>
            {systemActions.filter((a) => systemAccomplishments[a.id]?.done).length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">System completions will land here automatically when queue state reaches done.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {systemActions
                  .filter((a) => systemAccomplishments[a.id]?.done)
                  .map((item) => {
                    const doneAt = systemAccomplishments[item.id]?.doneAt;
                    const timeStr = doneAt
                      ? new Date(doneAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      : "";
                    return (
                      <li key={item.id} className="flex items-start gap-2">
                        <svg viewBox="0 0 12 12" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                          <p className="text-xs text-slate-300 line-through decoration-slate-600/60">{item.task}</p>
                          {timeStr && <p className="text-[10px] text-slate-600">{timeStr}</p>}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
        {codexWorkQueue.watchlist.length > 0 ? (
          <div className="mt-3 border-t border-slate-700/40 pt-3">
            <details className="rounded-md border border-slate-700/30 bg-slate-900/20 p-2">
              <summary className="cursor-pointer text-[11px] text-slate-500">
                On radar ({codexWorkQueue.watchlist.length})
              </summary>
              <ul className="mt-2 space-y-1.5">
                {codexWorkQueue.watchlist.map((item, idx) => (
                  <li key={`watch-${item.area}-${item.title}-${idx}`} className="pl-1">
                    <p className="text-xs text-slate-400">{item.title}</p>
                    {item.why && <p className="mt-0.5 text-[11px] text-slate-500">{item.why}</p>}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-slate-500">No pending items in Codex review queues.</p>
        )}
      </section>

      {showAdvanced && brief.companyIntelAlert && brief.companyIntelAlert.items.length > 0 && (
        <section className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-4 text-sm text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-300">Company Intel Alert</h2>
            <span className="text-[11px] text-amber-200">
              {brief.companyIntelAlert.count} new item(s) in digest ({brief.companyIntelAlert.digestAsOf || "today"})
            </span>
          </div>
          <ul className="mt-2 space-y-2">
            {brief.companyIntelAlert.items.map((item) => {
              const pid = classifyErpPillars(`${item.title} ${item.category}`, { includeEnablement: true })[0] || "enablement";
              return (
                <li key={item.id} className="rounded-md border border-amber-700/30 bg-slate-900/40 p-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs text-slate-100">{item.title}</p>
                    <time className="text-[11px] text-slate-500">{item.date}</time>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${pillarTone(pid)}`}>
                      {PILLAR_LABEL[pid]}
                    </span>
                    <span className="rounded-full border border-slate-700/40 bg-slate-900/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
                      {item.confidence}
                    </span>
                    <span className="rounded-full border border-slate-700/40 bg-slate-900/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-2">
            <Link
              href="/abivax/spine/company"
              className="text-xs text-amber-200 underline underline-offset-2 hover:text-amber-100"
            >
              Open Company Intel
            </Link>
          </div>
        </section>
      )}

      {showAdvanced && <section className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-5 text-sm text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Today At A Glance</h2>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="rounded border border-emerald-700/40 bg-emerald-900/20 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-900/30"
          >
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </button>
        </div>
        <p className="mt-2 text-slate-100">{brief.todaySummary.dayLabel}</p>
        <p className="mt-1 text-xs text-slate-300">{brief.todaySummary.snapshotLabel}</p>
        <p className="mt-2">
          <span className="rounded-full border border-emerald-600/40 bg-emerald-900/40 px-2.5 py-1 text-xs text-emerald-200">
            Mode: {brief.todaySummary.meetingMode}
          </span>
        </p>
        <ul className="mt-3 space-y-1 text-slate-200">
          <li>- Meetings today: {brief.todaySummary.meetingsTodayCount}</li>
          <li>- Next meeting: {renderLinkedText(brief.todaySummary.nextMeetingTitle)} ({nextMeetingLabel})</li>
          {brief.todaySummary.docket.map((item) => (
            <li key={item}>- {renderLinkedText(item)}</li>
          ))}
        </ul>
        {brief.todaySummary.snapshotStale && (
          <p className="mt-3 rounded-md border border-amber-700/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
            {brief.todaySummary.snapshotStaleHint}
          </p>
        )}
      </section>}

      {showAdvanced && <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 text-sm text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Immediate Prep</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyOpening}
              className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600"
            >
              {copyLabel}
            </button>
            <a
              href={brief.teamsLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${brief.teamsLink ? "bg-emerald-700 text-white hover:bg-emerald-600" : "pointer-events-none bg-slate-800 text-slate-500"}`}
            >
              Open Teams
            </a>
          </div>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">TL;DR</p>
            <p className="mt-2 text-sm text-slate-100">{renderLinkedText(brief.tldr)}</p>
          </div>
          <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">Opening</p>
            <p className="mt-2 text-sm text-slate-100">{renderLinkedText(brief.opening)}</p>
          </div>
          <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">Top Actions</p>
            <ul className="mt-2 space-y-1 text-slate-300">
              {brief.preActions.slice(0, 2).map((item) => (
                <li key={item}>- {renderLinkedText(item)}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-400">Top Asks</p>
            <ul className="mt-2 space-y-1 text-slate-300">
              {brief.asks.slice(0, 3).map((item) => (
                <li key={item}>- {renderLinkedText(item)}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3 rounded-md border border-slate-700/50 bg-slate-900/30 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wider text-slate-400">Cross-Page Handoff</p>
            <p className="text-[11px] text-slate-500">Use these to push context into working pages</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={programHandoffHref}
              className="rounded-md border border-cyan-700/40 bg-cyan-950/20 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-900/30"
            >
              Promote to Program issue
            </Link>
            <Link
              href={deckHandoffHref}
              className="rounded-md border border-amber-700/40 bg-amber-950/20 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-900/30"
            >
              Promote to Deck data request
            </Link>
          </div>
        </div>
      </section>}

      {showAdvanced && <section className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-5 text-sm text-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">ERP Pillar Focus</h2>
          <p className="text-[11px] text-slate-500">Keeps prep and follow-ups aligned to the 3 core ERP outcomes</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(pillarFocus.ranked.length > 0 ? pillarFocus.ranked : (["enablement"] as ErpPillarId[])).map((id) => (
            <span
              key={id}
              className={`rounded-full border px-2.5 py-1 text-xs ${pillarTone(id)}`}
              title={`Detected from prep/actions/prompts (${pillarFocus.coverage[id]} signals)`}
            >
              {PILLAR_LABEL[id]}{pillarFocus.coverage[id] ? ` (${pillarFocus.coverage[id]})` : ""}
            </span>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {(["p2p", "reporting-data", "controls-audit"] as ErpPillarId[]).map((id) => (
            <div key={id} className="rounded-md border border-slate-700/50 bg-slate-900/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wider text-slate-400">{PILLAR_LABEL[id]}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(id)}`}>
                  {pillarFocus.coverage[id]}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {(pillarFocus.promptGroups[id] || []).length > 0
                  ? `${(pillarFocus.promptGroups[id] || []).length} Mike prompt(s) mapped`
                  : "No explicit prompts yet"}
              </p>
              {pillarFocus.samples[id][0] && (
                <p className="mt-2 line-clamp-2 text-xs text-slate-300">{renderLinkedText(pillarFocus.samples[id][0])}</p>
              )}
            </div>
          ))}
        </div>
      </section>}

      {showAdvanced && brief.focusPrompts && brief.focusPrompts.length > 0 && (
        <section className="rounded-xl border border-cyan-700/40 bg-cyan-950/20 p-5 text-sm text-slate-200">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Questions For Mike</h2>
            <span className="text-xs text-cyan-200">{brief.focusPrompts.length} prompts</span>
          </div>
          <ul className="mt-3 space-y-2">
            {topFocusPrompts.map((p) => (
              <li key={`${p.priority}-${p.prompt}`} className="rounded-md border border-cyan-800/30 bg-slate-900/40 px-3 py-2">
                {(() => {
                  const pid = classifyErpPillars(`${p.prompt} ${p.why}`, { includeEnablement: true })[0] || "enablement";
                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-slate-100">{p.prompt}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid)}`}>
                          {PILLAR_LABEL[pid]}
                        </span>
                      </div>
                    </>
                  );
                })()}
                <p className="mt-1 text-xs text-slate-400">{p.why}</p>
              </li>
            ))}
          </ul>
          {extraFocusPrompts.length > 0 && (
            <details className="mt-3 rounded-md border border-cyan-800/30 bg-slate-900/30 p-3">
              <summary className="cursor-pointer text-xs text-cyan-200">
                Show {extraFocusPrompts.length} more prompts
              </summary>
              <ul className="mt-3 space-y-2">
                {extraFocusPrompts.map((p) => (
                  <li key={`${p.priority}-${p.prompt}`} className="rounded-md border border-cyan-800/30 bg-slate-900/40 px-3 py-2">
                    {(() => {
                      const pid = classifyErpPillars(`${p.prompt} ${p.why}`, { includeEnablement: true })[0] || "enablement";
                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-slate-100">{p.prompt}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillarTone(pid)}`}>
                            {PILLAR_LABEL[pid]}
                          </span>
                        </div>
                      );
                    })()}
                    <p className="mt-1 text-xs text-slate-400">{p.why}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {showAdvanced && brief.afterAction && (
        <details className="rounded-xl border border-violet-700/40 bg-violet-950/20 p-5 text-sm text-slate-200">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-violet-300">
            Last Meeting Learnings
          </summary>
          <p className="mt-2 text-xs text-slate-300">
            Auto-compare from `{brief.afterAction.prepNoteId}` vs `{brief.afterAction.outcomeNoteId}`.
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border border-violet-800/40 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wider text-violet-300">Matched</p>
              <ul className="mt-2 space-y-1 text-slate-200">
                {brief.afterAction.matchedExpectations.length === 0 ? (
                  <li>- No direct prep-to-outcome matches detected.</li>
                ) : (
                  brief.afterAction.matchedExpectations.map((x) => <li key={x}>- {renderLinkedText(x)}</li>)
                )}
              </ul>
            </div>
            <div className="rounded-md border border-violet-800/40 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wider text-violet-300">Missed Captures</p>
              <ul className="mt-2 space-y-1 text-slate-200">
                {brief.afterAction.missedExpectations.length === 0 ? (
                  <li>- None. Prep expectations mostly covered.</li>
                ) : (
                  brief.afterAction.missedExpectations.map((x) => <li key={x}>- {renderLinkedText(x)}</li>)
                )}
              </ul>
            </div>
            <div className="rounded-md border border-violet-800/40 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wider text-violet-300">Assumptions Disproven</p>
              <ul className="mt-2 space-y-1 text-slate-200">
                {brief.afterAction.assumptionsDisproven.length === 0 ? (
                  <li>- No clear disproven assumption detected.</li>
                ) : (
                  brief.afterAction.assumptionsDisproven.map((x) => <li key={x}>- {renderLinkedText(x)}</li>)
                )}
              </ul>
            </div>
            <div className="rounded-md border border-violet-800/40 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wider text-violet-300">What Changed In-Room</p>
              <ul className="mt-2 space-y-1 text-slate-200">
                {brief.afterAction.newSignals.length === 0 ? (
                  <li>- No major new signal beyond prep assumptions.</li>
                ) : (
                  brief.afterAction.newSignals.map((x) => <li key={x}>- {renderLinkedText(x)}</li>)
                )}
                {brief.afterAction.attendeeDelta.map((x) => (
                  <li key={x}>- {renderLinkedText(x)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-violet-800/40 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wider text-violet-300">Tomorrow Smoother</p>
              <ul className="mt-2 space-y-1 text-slate-200">
                {brief.afterAction.smootherNextTime.length === 0 ? (
                  <li>- No carry-forward improvements detected yet.</li>
                ) : (
                  brief.afterAction.smootherNextTime.map((x) => <li key={x}>- {renderLinkedText(x)}</li>)
                )}
              </ul>
            </div>
          </div>
        </details>
      )}

      {showAdvanced && brief.todaySummary.meetingMode === "IT Landscape Session" && brief.itLandscape && (
        <details className="rounded-xl border border-sky-700/40 bg-sky-950/20 p-5 text-sm text-slate-200">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-sky-300">
            IT Landscape Snapshot
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="rounded-md border border-sky-800/40 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wider text-sky-300">Systems</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-200">
                {brief.itLandscape.systems.slice(0, 7).map((s) => (
                  <li key={s.id}>- {s.name}: {s.systemOwner}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-sky-800/40 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wider text-sky-300">Integrations</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-200">
                {brief.itLandscape.integrations.slice(0, 7).map((i) => (
                  <li key={i.id}>- {i.sourceSystem} -&gt; {i.targetSystem} ({i.feedType})</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-sky-800/40 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wider text-sky-300">Access Requests</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-200">
                {brief.itLandscape.accessRequests.slice(0, 7).map((r) => (
                  <li key={r.id}>- {r.system}: {r.status}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      )}

      {showAdvanced && (
      <details open={liveCaptureOpen} className="rounded-xl border border-cyan-700/40 bg-cyan-950/20 p-5 text-sm text-slate-200">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-cyan-300">
          Live Meeting Capture
        </summary>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyCapture}
              className="rounded-md bg-cyan-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-600"
            >
              {copyCaptureLabel}
            </button>
            <button
              type="button"
              onClick={onPromoteDraft}
              className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
            >
              {copyDraftLabel}
            </button>
            <Link
              href={programHandoffHref}
              className="rounded-md border border-cyan-700/40 bg-cyan-950/20 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-900/30"
            >
              To Program
            </Link>
            <Link
              href={deckHandoffHref}
              className="rounded-md border border-amber-700/40 bg-amber-950/20 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-900/30"
            >
              To Decks
            </Link>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-300">
          Click outcomes as you go. Conflicts are flagged below so you can close gaps live.
        </p>
        {quickChips.length > 0 && (
          <div className="mt-3 rounded-md border border-cyan-800/40 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wider text-cyan-300">Quick Chips</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setQuickPad((prev) => `${prev}${prev ? "\n" : ""}${chip}: `)}
                  className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
                >
                  {chip}
                </button>
              ))}
            </div>
            <textarea
              value={quickPad}
              onChange={(e) => setQuickPad(e.target.value)}
              placeholder="Scratchpad for fast in-call capture..."
              className="mt-2 h-20 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 placeholder-slate-500"
            />
          </div>
        )}

        <div className="mt-3 space-y-3">
          {captureItems.map((item) => {
            const value = capture[item.id] || {
              outcome: "unknown",
              owner: "Unassigned",
              confidence: "medium",
              note: "",
            };
            return (
              <div key={item.id} className="rounded-md border border-cyan-800/40 bg-slate-900/40 p-3">
                <p className="text-slate-100">{renderLinkedText(item.label)}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <select
                    value={value.outcome}
                    onChange={(e) => updateCapture(item.id, { outcome: e.target.value as CaptureState["outcome"] })}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                  >
                    <option value="captured">Captured</option>
                    <option value="unknown">Unknown</option>
                    <option value="owner_missing">Owner Missing</option>
                    <option value="follow_up_required">Follow-up Required</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <select
                    value={value.owner}
                    onChange={(e) => updateCapture(item.id, { owner: e.target.value })}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                  >
                    {ownerOptions.map((o) => (
                      <option key={`${item.id}-${o}`} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <select
                    value={value.confidence}
                    onChange={(e) => updateCapture(item.id, { confidence: e.target.value as CaptureState["confidence"] })}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                  >
                    <option value="high">Confidence: High</option>
                    <option value="medium">Confidence: Medium</option>
                    <option value="low">Confidence: Low</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={value.note}
                  onChange={(e) => updateCapture(item.id, { note: e.target.value })}
                  placeholder="Optional note..."
                  className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 placeholder-slate-500"
                />
              </div>
            );
          })}
        </div>

        {captureConflicts.length > 0 && (
          <div className="mt-3 rounded-md border border-amber-700/40 bg-amber-950/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Conflicts To Resolve</p>
            <ul className="mt-2 space-y-1 text-xs text-amber-100">
              {captureConflicts.map((w) => (
                <li key={w}>- {w}</li>
              ))}
            </ul>
          </div>
        )}
      </details>
      )}

      {showAdvanced && (
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Next Meeting Brief</h1>
        <p className="mt-1 text-sm text-slate-400">{renderLinkedText(brief.title)}</p>
      </header>
      )}

      {showAdvanced && (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopyOpening}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600"
        >
          {copyLabel}
        </button>
        <a
          href={brief.teamsLink || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${brief.teamsLink ? "bg-emerald-700 text-white hover:bg-emerald-600" : "pointer-events-none bg-slate-800 text-slate-500"}`}
        >
          Open Teams
        </a>
        <button
          type="button"
          onClick={onReadAloud}
          className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
        >
          Read aloud
        </button>
      </div>
      )}

      {showAdvanced && (
      <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">TL;DR</h2>
        <p className="mt-2 text-sm text-slate-100">{renderLinkedText(brief.tldr)}</p>
      </section>
      )}

      {showAdvanced && (
      <section className="rounded-xl border border-rose-700/40 bg-rose-950/20 p-5 text-sm text-slate-200">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-rose-300">Decision Radar</h2>
          <span className="text-xs text-rose-200">{brief.decisionRadar.length} items</span>
        </div>
        <ul className="mt-3 space-y-2">
          {topDecisionRadar.map((item) => (
            <li key={`${item.decision}-${item.owner}`} className="rounded-md border border-rose-800/40 bg-slate-900/50 p-3">
              <p className="text-slate-100">{renderLinkedText(item.decision)}</p>
              <p className="mt-1 text-xs text-slate-300">Owner: {renderLinkedText(item.owner)} | Due: {item.due}</p>
              <p className="mt-1 text-xs text-rose-200">Blocker: {renderLinkedText(item.blocker)}</p>
            </li>
          ))}
        </ul>
        {extraDecisionRadar.length > 0 && (
          <details className="mt-3 rounded-md border border-rose-800/30 bg-slate-900/30 p-3">
            <summary className="cursor-pointer text-xs text-rose-200">
              Show {extraDecisionRadar.length} more decision items
            </summary>
            <ul className="mt-3 space-y-2">
              {extraDecisionRadar.map((item) => (
                <li key={`${item.decision}-${item.owner}`} className="rounded-md border border-rose-800/40 bg-slate-900/50 p-3">
                  <p className="text-slate-100">{renderLinkedText(item.decision)}</p>
                  <p className="mt-1 text-xs text-slate-300">Owner: {renderLinkedText(item.owner)} | Due: {item.due}</p>
                  <p className="mt-1 text-xs text-rose-200">Blocker: {renderLinkedText(item.blocker)}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
      )}

      {showAdvanced && (
      <section className="space-y-4 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 text-sm text-slate-200">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Why this meeting exists</h2>
            <ul className="mt-2 space-y-1">
              {brief.why.slice(0, 3).map((item) => (
                <li key={item}>- {renderLinkedText(item)}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top 3 risks</h2>
            <ul className="mt-2 space-y-1">
              {brief.risks.slice(0, 3).map((item) => (
                <li key={item}>- {renderLinkedText(item)}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Who matters</h2>
            <ul className="mt-2 space-y-1">
              {brief.whoMatters.slice(0, 5).map((person) => (
                <li key={`${person.name}-${person.role}`}>
                  - {person.name}: {renderLinkedText(person.role)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top 2 pre-meeting actions</h2>
            <ul className="mt-2 space-y-1">
              {brief.preActions.slice(0, 2).map((item) => (
                <li key={item}>- {renderLinkedText(item)}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommended posture / opening</h2>
          <p className="mt-2 rounded-md bg-slate-900/60 px-3 py-2 text-slate-100">{renderLinkedText(brief.opening)}</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Suggested asks</h2>
          <ul className="mt-2 space-y-1">
            {brief.asks.slice(0, 4).map((item) => (
              <li key={item}>- {renderLinkedText(item)}</li>
            ))}
          </ul>
        </div>

        <details className="rounded-md border border-slate-700/60 bg-slate-900/30 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-400">
            Deep Prep Details
          </summary>
          <div className="mt-4 space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Why this meeting exists</h2>
          <ul className="mt-2 space-y-1">
            {brief.why.map((item) => (
              <li key={item}>- {renderLinkedText(item)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Who matters</h2>
          <ul className="mt-2 space-y-1">
            {brief.whoMatters.map((person) => (
              <li key={`${person.name}-${person.role}`}>
                -{" "}
                {person.entityId ? (
                  <Link
                    href={`/abivax/spine/entity/${person.entityId}`}
                    className="underline decoration-slate-500/70 underline-offset-2 hover:text-amber-300 hover:decoration-amber-400"
                  >
                    {person.name}
                  </Link>
                ) : (
                  <Link
                    href={`/abivax/spine/search?q=${encodeURIComponent(person.name)}`}
                    className="underline decoration-slate-500/70 underline-offset-2 hover:text-amber-300 hover:decoration-amber-400"
                  >
                    {person.name}
                  </Link>
                )}
                : {renderLinkedText(person.role)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top 3 risks</h2>
          <ul className="mt-2 space-y-1">
            {brief.risks.map((item) => (
              <li key={item}>- {renderLinkedText(item)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommended posture / opening</h2>
          <p className="mt-2 rounded-md bg-slate-900/60 px-3 py-2 text-slate-100">{renderLinkedText(brief.opening)}</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Suggested asks</h2>
          <ul className="mt-2 space-y-1">
            {brief.asks.map((item) => (
              <li key={item}>- {renderLinkedText(item)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick links & countdown</h2>
          <ul className="mt-2 space-y-1 text-slate-300">
            <li>- Start: {startLabel}</li>
            <li>- Minutes until start: {countdownLabel}</li>
            <li>- Teams link: {brief.teamsLink ? "Available" : "Missing"}</li>
            <li>- Dial-in: {brief.dialIn || "Not found"}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top 2 pre-meeting actions</h2>
          <ul className="mt-2 space-y-1">
            {brief.preActions.map((item) => (
              <li key={item}>- {renderLinkedText(item)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Context To Capture In Meeting</h2>
          <ul className="mt-2 space-y-1">
            {brief.contextGaps.length === 0 ? (
              <li>- No major context gaps detected.</li>
            ) : (
              brief.contextGaps.map((item) => (
                <li key={item}>- {renderLinkedText(item)}</li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unresolved Questions</h2>
          <ul className="mt-2 space-y-1">
            {brief.unresolvedQuestions.length === 0 ? (
              <li>- None. Current open items are mapped to decisions.</li>
            ) : (
              brief.unresolvedQuestions.map((item) => <li key={item}>- {renderLinkedText(item)}</li>)
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">People To Ping Today</h2>
          <ul className="mt-2 space-y-2">
            {brief.peopleToPing.length === 0 ? (
              <li>- No explicit owner gaps detected.</li>
            ) : (
              brief.peopleToPing.map((p) => (
                <li key={`${p.name}-${p.why}`} className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3">
                  <p>
                    -{" "}
                    {p.entityId ? (
                      <Link
                        href={`/abivax/spine/entity/${p.entityId}`}
                        className="underline decoration-slate-500/70 underline-offset-2 hover:text-amber-300 hover:decoration-amber-400"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      renderLinkedText(p.name)
                    )}: {renderLinkedText(p.why)}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">Suggested ping: &quot;{renderLinkedText(p.prompt)}&quot;</p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline Ladder</h2>
          <ul className="mt-2 space-y-1 text-slate-300">
            {brief.deadlineLadder.length === 0 ? (
              <li>- No upcoming milestones with dates found.</li>
            ) : (
              brief.deadlineLadder.map((d) => (
                <li key={`${d.label}-${d.date}`}>
                  -{" "}
                  {d.entityId ? (
                    <Link
                      href={`/abivax/spine/entity/${d.entityId}`}
                      className="underline decoration-slate-500/70 underline-offset-2 hover:text-amber-300 hover:decoration-amber-400"
                    >
                      {d.label}
                    </Link>
                  ) : (
                    renderLinkedText(d.label)
                  )}{" "}
                  ({d.date}, {d.daysUntil >= 0 ? `${d.daysUntil}d` : `${Math.abs(d.daysUntil)}d ago`})
                </li>
              ))
            )}
          </ul>
        </div>
          </div>
        </details>
      </section>
      )}

      {showAdvanced && (
      <details className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
        <summary className="cursor-pointer text-sm text-slate-300">Show raw</summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
          {brief.rawBody || "No raw body captured."}
        </pre>
      </details>
      )}
    </div>
  );
}
