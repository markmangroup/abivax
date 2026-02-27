const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataPath = path.join(root, "data", "abivax", "erp_pillar_baselines.json");
const inboxPath = path.join(root, "temp", "recent-emails.json");
const sentPath = path.join(root, "temp", "recent-sent-emails.json");
const reportPath = path.join(root, "temp", "pillar-email-sync-report.json");

function readJson(p, fallback) {
  try {
    const raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function norm(v) {
  return String(v || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function stripReplyPrefix(subject) {
  return String(subject || "")
    .replace(/^\s*((re|fw|fwd)\s*:\s*)+/i, "")
    .trim();
}

function tokens(v) {
  return norm(v)
    .replace(/[^a-z0-9& ]+/g, " ")
    .split(" ")
    .filter((x) => x.length >= 3);
}

function parseList(v) {
  return String(v || "")
    .replace(/\([^)]*\)/g, " ")
    .split(/[;,/]/)
    .map((s) => s.replace(/^'+|'+$/g, "").trim())
    .filter(Boolean);
}

function requestKeywords(req) {
  const base = [
    ...tokens(req.topic),
    ...tokens(req.why || ""),
    ...tokens(req.notes || ""),
  ];
  const custom = [];
  const topic = norm(req.topic);
  if (topic.includes("p2p")) custom.push("p2p");
  if (topic.includes("sox")) custom.push("sox");
  if (topic.includes("audit")) custom.push("audit");
  if (topic.includes("report")) custom.push("reporting");
  if (topic.includes("ifrs")) custom.push("ifrs");
  if (topic.includes("control")) custom.push("control");
  if (topic.includes("jade")) custom.push("it");
  return Array.from(new Set([...base, ...custom])).filter((x) => x.length >= 3);
}

function personHints(req) {
  return parseList(req.sentTo)
    .map((s) => norm(s))
    .map((s) => s.split(" ").slice(0, 2).join(" "))
    .filter(Boolean);
}

function matchSentForRequest(req, sentEmails) {
  const sentDate = req.sentDate ? Date.parse(req.sentDate) : NaN;
  const recipientHints = personHints(req);
  const keys = requestKeywords(req);
  const candidates = sentEmails
    .map((e) => {
    const sentOn = Date.parse(e.sent || "");
    if (!Number.isNaN(sentDate) && !Number.isNaN(sentOn)) {
      if (sentOn < sentDate - 24 * 60 * 60 * 1000) return null;
    }
    const tocc = norm(`${e.to || ""} ${e.cc || ""}`);
    const subj = norm(stripReplyPrefix(e.subject || ""));
    const recipientMatch =
      recipientHints.length === 0 || recipientHints.some((h) => tocc.includes(h));
    const keywordHits = keys.filter((k) => subj.includes(k)).length;
    if (!recipientMatch || keywordHits < 1) return null;
    // Prefer highly specific subject matches over recency-only recipient matches.
    const bonus =
      (subj.includes("p2p") ? 2 : 0) +
      (subj.includes("sox") ? 2 : 0) +
      (subj.includes("audit") ? 1 : 0) +
      (subj.includes("report") ? 1 : 0);
    return { e, score: keywordHits + bonus, sentOn: Number.isNaN(sentOn) ? 0 : sentOn };
  })
    .filter(Boolean);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (b.score - a.score) || (b.sentOn - a.sentOn));
  return candidates[0].e;
}

function matchReplies(req, inboxEmails, sentMatch) {
  const keys = requestKeywords(req);
  const recipients = personHints(req);
  const sentSubjectCore = sentMatch ? norm(stripReplyPrefix(sentMatch.subject || "")) : "";
  const sentOn = sentMatch ? Date.parse(sentMatch.sent || "") : NaN;
  return inboxEmails.filter((e) => {
    const recv = Date.parse(e.received || "");
    if (!Number.isNaN(sentOn) && !Number.isNaN(recv) && recv < sentOn) return false;
    const sender = norm(`${e.senderName || ""} ${e.senderEmail || ""}`);
    const subj = norm(stripReplyPrefix(e.subject || ""));
    const senderMatch = recipients.length === 0 || recipients.some((h) => sender.includes(h));
    const threadMatch = sentSubjectCore && subj && (subj.includes(sentSubjectCore) || sentSubjectCore.includes(subj));
    const keywordHits = keys.filter((k) => subj.includes(k)).length;
    return senderMatch && (threadMatch || keywordHits >= 2);
  });
}

function inferStatus(existing, replies) {
  if (!replies || replies.length === 0) return existing || "awaiting-response";
  // We only have metadata, not bodies. Treat reply presence as partial until content parsing is added.
  return existing === "received" ? "received" : "partial";
}

function main() {
  const baselines = readJson(dataPath, { version: 1, updatedAt: null, baselines: [] });
  const inbox = readJson(inboxPath, { emails: [] });
  const sent = readJson(sentPath, { emails: [] });
  const inboxEmails = Array.isArray(inbox.emails) ? inbox.emails : [];
  const sentEmails = Array.isArray(sent.emails) ? sent.emails : [];

  const report = {
    generatedAt: new Date().toISOString(),
    inboxEmails: inboxEmails.length,
    sentEmails: sentEmails.length,
    requestsChecked: 0,
    statusChanges: [],
    requests: [],
  };

  for (const baseline of baselines.baselines || []) {
    for (const req of baseline.evidenceRequests || []) {
      report.requestsChecked += 1;
      const sentMatch = matchSentForRequest(req, sentEmails);
      const replies = matchReplies(req, inboxEmails, sentMatch);
      const prev = req.status || "awaiting-response";
      const next = inferStatus(prev, replies);
      if (next !== prev) {
        req.status = next;
        report.statusChanges.push({
          pillarId: baseline.pillarId,
          requestId: req.id,
          from: prev,
          to: next,
          reason: replies.length ? `${replies.length} potential reply email(s) detected` : "none",
        });
      }
      if (sentMatch && !req.sentDate) {
        req.sentDate = String(sentMatch.sent || "").slice(0, 10);
      }
      report.requests.push({
        pillarId: baseline.pillarId,
        requestId: req.id,
        status: req.status,
        sentMatched: !!sentMatch,
        sentSubject: sentMatch ? sentMatch.subject : "",
        replyCount: replies.length,
        replySubjects: replies.slice(0, 5).map((r) => r.subject),
      });
    }
  }

  baselines.updatedAt = new Date().toISOString().slice(0, 10);
  writeJson(dataPath, baselines);
  writeJson(reportPath, report);
  console.log(reportPath);
}

main();
