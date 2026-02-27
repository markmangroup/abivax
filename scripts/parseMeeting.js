/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { z } = require("zod");

function parseField(content, name) {
  const re = new RegExp(`^${name}:\\s*(.*)$`, "mi");
  const match = content.match(re);
  return match ? match[1].trim() : "";
}

function splitAttendees(raw) {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(/[;\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function extractBody(content) {
  const marker = /^Body:\s*$/im;
  const match = marker.exec(content);
  if (!match) return "";
  return content.slice(match.index + match[0].length).trim();
}

function timestampSlug(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}-${hh}${mm}${ss}Z`;
}

function firstTwoNonEmptyLines(text) {
  return (text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => !/^(join:|https?:\/\/|rejoindre:|dial-in:|meeting id:|num[ée]ro de r[ée]union:)/i.test(l))
    .filter(Boolean)
    .slice(0, 2);
}

function extractActions(body) {
  const lines = (body || "").split(/\r?\n/).map((l) => l.trim());
  return lines
    .filter((line) => /^-\s+/.test(line) || /^Action:\s*/i.test(line))
    .map((line) => line.replace(/^-+\s*/, "").replace(/^Action:\s*/i, "").trim())
    .filter(Boolean);
}

function extractDecisions(body) {
  const lines = (body || "").split(/\r?\n/).map((l) => l.trim());
  return lines
    .filter((line) => /^Decision:\s*/i.test(line))
    .map((line) => line.replace(/^Decision:\s*/i, "").trim())
    .filter(Boolean);
}

function cleanUrl(value) {
  return value.replace(/[>),.;]+$/, "").trim();
}

function extractTeamsLink(text) {
  const re = /https?:\/\/teams\.microsoft\.com\/[^\s<)]+/i;
  const match = (text || "").match(re);
  return match ? cleanUrl(match[0]) : "";
}

function extractDialIn(text) {
  const telMatch = (text || "").match(/tel:\+?[0-9,#+]+/i);
  if (telMatch) return telMatch[0];

  const phoneMatch = (text || "").match(/\+[0-9][0-9\s]{7,}[0-9](?:,,[0-9]+#)?/);
  return phoneMatch ? phoneMatch[0].replace(/\s+/g, " ").trim() : "";
}

function shortenLine(line, maxWords = 16) {
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return line;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function cleanMeetingBody(rawBody) {
  const legalFooterPhrases = [
    /kpmg'?s opinion/i,
    /non-encrypted communication/i,
    /confidential information/i,
    /intended solely for the addressee/i,
    /opinion de kpmg/i,
    /communication non crypt/i,
    /informations confidentielles/i,
    /destinataire/i,
    /mentions l[ée]gales/i,
    /personal data protection statement/i,
  ];

  const teamsBoilerplatePhrases = [
    /r[ée]union microsoft teams/i,
    /microsoft teams meeting/i,
    /join the meeting/i,
    /rejoindre/i,
    /meeting id|num[ée]ro de r[ée]union/i,
    /passcode|code secret/i,
    /need help|besoin d['’]aide/i,
    /join with a video conferencing device/i,
    /participer par t[ée]l[ée]phone/i,
    /find a local number|trouver un num[ée]ro local/i,
    /conference id|num[ée]ro de conf[ée]rence/i,
    /for organizers|pour les organisateurs/i,
    /meeting options|options de r[ée]union/i,
    /pin d['’]appel|reset dial-in pin/i,
    /aka\.ms\/jointeamsmeeting/i,
    /dialin\.teams\.microsoft\.com/i,
    /^-{2,}\s*forwarded message/i,
    /^from:/i,
    /^to:/i,
    /^date:/i,
    /^subject:/i,
    /mailto:/i,
  ];

  const lines = (rawBody || "").split(/\r?\n/);
  const cleaned = [];
  let reachedLegalFooter = false;

  for (const original of lines) {
    if (reachedLegalFooter) break;

    let line = original.replace(/\u00A0/g, " ").trim();
    if (!line) {
      cleaned.push("");
      continue;
    }

    if (/^[_=*\-]{4,}$/.test(line)) continue;

    if (legalFooterPhrases.some((rx) => rx.test(line))) {
      reachedLegalFooter = true;
      continue;
    }

    if (teamsBoilerplatePhrases.some((rx) => rx.test(line))) {
      continue;
    }

    line = shortenLine(line, 22);
    cleaned.push(line);
  }

  const squashed = [];
  for (const line of cleaned) {
    const prev = squashed[squashed.length - 1];
    if (!line && !prev) continue;
    if (line && prev === line) continue;
    squashed.push(line);
  }

  return squashed.join("\n").trim();
}

function toMarkdownBrief(meeting) {
  return [
    `# Meeting Brief: ${meeting.title}`,
    "",
    `- Start: ${meeting.start || "Unknown"}`,
    `- Organizer: ${meeting.organizer || "Unknown"}`,
    `- Teams: ${meeting.teamsLink || "None"}`,
    `- Dial-in: ${meeting.dialIn || "None"}`,
    "",
    "## Summary",
    ...(meeting.summary.length
      ? meeting.summary.map((s) => `- ${s}`)
      : ["- No concise summary lines found"]),
    "",
    "## Actions",
    ...(meeting.actions.length
      ? meeting.actions.map((a) => `- ${a}`)
      : ["- None found"]),
    "",
    "## Decisions",
    ...(meeting.decisions.length
      ? meeting.decisions.map((d) => `- ${d}`)
      : ["- None found"]),
    "",
  ].join("\n");
}

const MeetingSchema = z.object({
  title: z.string().min(1),
  organizer: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  location: z.string().default(""),
  attendees: z.array(z.string()).default([]),
  body: z.string().default(""),
  rawBody: z.string().default(""),
  summary: z.array(z.string()).max(2).default([]),
  actions: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  teamsLink: z.string().default(""),
  dialIn: z.string().default(""),
  generatedAt: z.string(),
});

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  const root = path.resolve(__dirname, "..");
  const tempPath = path.join(root, "temp", "meeting.txt");

  if (!fs.existsSync(tempPath)) {
    throw new Error(`Missing input file: ${tempPath}`);
  }

  const raw = fs.readFileSync(tempPath, "utf8");
  if (raw.trim() === "NO_MEETING") {
    console.error("NO_MEETING");
    process.exit(1);
  }

  const title = parseField(raw, "Subject");
  const organizer = parseField(raw, "Organizer");
  const start = parseField(raw, "Start");
  const end = parseField(raw, "End");
  const location = parseField(raw, "Location");
  const attendeesRaw = parseField(raw, "Attendees");

  const rawBody = extractBody(raw);
  const cleanedBody = cleanMeetingBody(rawBody);
  const teamsLink = extractTeamsLink(rawBody);
  const dialIn = extractDialIn(rawBody);

  const summary = firstTwoNonEmptyLines(cleanedBody);
  const actions = extractActions(cleanedBody);
  const decisions = extractDecisions(cleanedBody);
  const generatedAt = new Date().toISOString();

  let parsed;
  try {
    parsed = MeetingSchema.parse({
      title,
      organizer,
      start,
      end,
      location,
      attendees: splitAttendees(attendeesRaw),
      body: cleanedBody,
      rawBody,
      summary,
      actions,
      decisions,
      teamsLink,
      dialIn,
      generatedAt,
    });
  } catch (e) {
    parsed = {
      title:
        title && title.length
          ? title
          : Array.isArray(summary) && summary.length
            ? summary[0]
            : "Untitled meeting",
      organizer: organizer || "",
      start: start || "",
      end: end || "",
      location: location || "",
      attendees: splitAttendees(attendeesRaw),
      body: cleanedBody || "",
      rawBody: rawBody || "",
      summary: Array.isArray(summary) ? summary : firstTwoNonEmptyLines(cleanedBody),
      actions: Array.isArray(actions) ? actions : [],
      decisions: Array.isArray(decisions) ? decisions : [],
      teamsLink: teamsLink || "",
      dialIn: dialIn || "",
      generatedAt: generatedAt || new Date().toISOString(),
    };
    console.warn(
      "Meeting validation failed; using fallback parsed object:",
      e && e.errors ? e.errors : String(e)
    );
  }

  const stamp = timestampSlug(new Date());
  const memoryDir = path.join(root, "memory", "meetings");
  const boardDir = path.join(root, "outputs", "board");
  ensureDir(memoryDir);
  ensureDir(boardDir);

  const jsonPath = path.join(memoryDir, `${stamp}.json`);
  const briefPath = path.join(boardDir, `brief-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  fs.writeFileSync(briefPath, toMarkdownBrief(parsed), "utf8");

  console.log(briefPath);
}

try {
  main();
} catch (err) {
  const msg = err && err.message ? err.message : String(err);
  console.error(`parseMeeting failed: ${msg}`);
  process.exit(1);
}



