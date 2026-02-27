const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "abivax");
const TEMP_DIR = path.join(ROOT, "temp");

function readJsonSafe(filePath, fallback) {
  try {
    let raw = fs.readFileSync(filePath, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function toIsoDateOnly(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function shortList(items, n = 5) {
  return (items || []).slice(0, n);
}

function main() {
  const now = new Date();
  const today = toIsoDateOnly(now.toISOString());

  const inbox = readJsonSafe(path.join(TEMP_DIR, "recent-emails.json"), { emails: [] });
  const sent = readJsonSafe(path.join(TEMP_DIR, "recent-sent-emails.json"), { emails: [] });
  const waterfallReview = readJsonSafe(path.join(TEMP_DIR, "swarm-waterfall-review.json"), {});
  const trinidadBundle = readJsonSafe(path.join(DATA_DIR, "trinidad_p2p_bundle_intake.json"), { status: "missing" });
  const timeline = readJsonSafe(path.join(DATA_DIR, "timeline.json"), { milestones: [] });
  const pillarBaselines = readJsonSafe(path.join(DATA_DIR, "erp_pillar_baselines.json"), { baselines: [] });

  const inboxToday = (inbox.emails || []).filter((e) => toIsoDateOnly(e.received) === today);
  const sentToday = (sent.emails || []).filter((e) => toIsoDateOnly(e.sent) === today);

  const highSignalInbound = inboxToday.filter((e) => {
    const s = `${e.senderName || ""} ${e.subject || ""}`.toLowerCase();
    return (
      s.includes("camille") ||
      s.includes("jade") ||
      s.includes("trinidad") ||
      s.includes("youness") ||
      s.includes("walid") ||
      s.includes("erp") ||
      s.includes("p2p")
    );
  });

  const selectionMilestone = (timeline.milestones || []).find((m) => m.id === "selection-decision-forum");
  const notifyNetSuite = (timeline.milestones || []).find((m) => m.id === "notify-netsuite-start-negotiation-path");
  const aprilTarget = (timeline.milestones || []).find((m) => m.id === "netsuite-implementation-work-start-target");

  const p2pBaseline = (pillarBaselines.baselines || []).find((b) => b.pillarId === "p2p");
  const reportingBaseline = (pillarBaselines.baselines || []).find((b) => b.pillarId === "reporting-data");
  const controlsBaseline = (pillarBaselines.baselines || []).find((b) => b.pillarId === "controls-audit");

  const summary = {
    generatedAt: now.toISOString(),
    date: today,
    status: "draft-review",
    accomplishments: [
      "NetSuite decision outcome captured in canonical timeline/program state.",
      "Today page moved to clearer post-meeting mode with Next Moves + What Changed prioritization.",
      "Trinidad France P2P document bundle ingested and parsed into canonical intake dataset.",
      "P2P pillar baseline and France P2P process flow updated with source-backed Trinidad bundle signals.",
      "Claude design critique loop used for Today and Program page readability improvements.",
    ],
    workday: {
      meetingsCompleted: selectionMilestone?.status === "completed" ? 1 : 0,
      keyDecision: selectionMilestone?.notes || "NetSuite selected (captured from user update).",
      nextMilestones: [notifyNetSuite, aprilTarget].filter(Boolean).map((m) => ({
        id: m.id,
        label: m.label,
        date: m.date,
        status: m.status,
      })),
    },
    emailActivity: {
      inboxTodayCount: inboxToday.length,
      sentTodayCount: sentToday.length,
      highSignalInboundCount: highSignalInbound.length,
      highSignalInbound: shortList(
        highSignalInbound.map((e) => ({
          received: e.received,
          sender: e.senderName,
          subject: e.subject,
          hasAttachments: !!e.hasAttachments,
        })),
        6
      ),
      sentToday: shortList(
        sentToday.map((e) => ({
          sent: e.sent,
          subject: e.subject,
          to: e.to,
        })),
        6
      ),
    },
    documentProcessing: {
      trinidadBundle: trinidadBundle.status === "ok"
        ? {
            status: "processed",
            fileCount: trinidadBundle.summary?.fileCount ?? 0,
            categories: trinidadBundle.summary?.categoryCounts ?? {},
            keySignals: trinidadBundle.workbookSignals?.paymentWorkbook?.keySignals || [],
          }
        : { status: "not-processed" },
    },
    programImpact: {
      p2p: {
        evidenceStrength: p2pBaseline?.evidenceStrength || null,
        openItemsTop: shortList(p2pBaseline?.openItems || [], 3),
        waitingOnTop: shortList(p2pBaseline?.waitingOn || [], 3),
        nextMovesTop: shortList(p2pBaseline?.nextMoves || [], 3),
      },
      reporting: {
        evidenceStrength: reportingBaseline?.evidenceStrength || null,
        waitingOnTop: shortList(reportingBaseline?.waitingOn || [], 2),
      },
      controls: {
        evidenceStrength: controlsBaseline?.evidenceStrength || null,
        waitingOnTop: shortList(controlsBaseline?.waitingOn || [], 2),
      },
    },
    systemHealth: {
      waterfallReviewSummary: waterfallReview.summary || null,
      reviewNow: shortList(waterfallReview.reviewNow || [], 5),
      tuningTargets: shortList(waterfallReview.tuningTargets || [], 5),
    },
    tomorrowFocus: [
      "Review Trinidad P2P bundle deltas in Program + Process Flows and deep-dive PDFs (approval matrices/SOPs/signature/currency docs).",
      "Decide whether to send Camille/Aymen post-selection Monday agenda email (draft exists).",
      "Review Program page status-color changes and confirm evidence visibility is improved.",
    ],
  };

  const md = [
    `# Daily Close Summary (${summary.date})`,
    "",
    "## Accomplished",
    ...summary.accomplishments.map((x) => `- ${x}`),
    "",
    "## Workday / Decisions",
    `- Key decision: ${summary.workday.keyDecision}`,
    ...summary.workday.nextMilestones.map((m) => `- Next milestone: ${m.label} (${m.date || "TBD"}) [${m.status}]`),
    "",
    "## Email Activity",
    `- Inbox today: ${summary.emailActivity.inboxTodayCount}`,
    `- Sent today: ${summary.emailActivity.sentTodayCount}`,
    `- High-signal inbound: ${summary.emailActivity.highSignalInboundCount}`,
    ...summary.emailActivity.highSignalInbound.map((e) => `- ${e.sender}: ${e.subject}${e.hasAttachments ? " (attachments)" : ""}`),
    "",
    "## Document Processing",
    summary.documentProcessing.trinidadBundle.status === "processed"
      ? `- Trinidad P2P bundle processed: ${summary.documentProcessing.trinidadBundle.fileCount} files`
      : "- Trinidad P2P bundle not processed",
    ...(summary.documentProcessing.trinidadBundle.keySignals || []).map((s) => `- ${s}`),
    "",
    "## What Changed In Program",
    `- P2P evidence strength: ${summary.programImpact.p2p.evidenceStrength || "n/a"}`,
    ...summary.programImpact.p2p.nextMovesTop.map((x) => `- P2P next: ${x}`),
    "",
    "## System Health (Waterfall)",
    summary.systemHealth.waterfallReviewSummary
      ? `- reviewNow=${summary.systemHealth.waterfallReviewSummary.reviewNowCount}, tuningTargets=${summary.systemHealth.waterfallReviewSummary.tuningTargetCount}`
      : "- Waterfall review summary unavailable",
    ...(summary.systemHealth.reviewNow || []).map((x) => `- Review now: ${x.title}`),
    "",
    "## Tomorrow Focus",
    ...summary.tomorrowFocus.map((x) => `- ${x}`),
    "",
  ].join("\n");

  writeJson(path.join(DATA_DIR, "daily_close_summary.json"), summary);
  writeJson(path.join(TEMP_DIR, "daily-close-report.json"), {
    generatedAt: summary.generatedAt,
    date: summary.date,
    status: summary.status,
    inboxTodayCount: summary.emailActivity.inboxTodayCount,
    sentTodayCount: summary.emailActivity.sentTodayCount,
    highSignalInboundCount: summary.emailActivity.highSignalInboundCount,
  });
  writeText(path.join(TEMP_DIR, "daily-close-summary.md"), md);

  console.log(JSON.stringify({
    status: "ok",
    date: summary.date,
    outputs: [
      "data/abivax/daily_close_summary.json",
      "temp/daily-close-report.json",
      "temp/daily-close-summary.md",
    ],
    inboxTodayCount: summary.emailActivity.inboxTodayCount,
    sentTodayCount: summary.emailActivity.sentTodayCount,
    highSignalInboundCount: summary.emailActivity.highSignalInboundCount,
  }, null, 2));
}

main();

