const fs = require("fs");
const path = require("path");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function readSecFeed(root) {
  return readJson(path.join(root, "data", "abivax", "company_intel_sec_feed.json"), { items: [] });
}

function looksLikeAbivaxIrEmail(msg) {
  const sender = String(msg.senderEmail || "").toLowerCase();
  const senderName = String(msg.senderName || "").toLowerCase();
  const subject = String(msg.subject || "").toLowerCase();
  if (sender.includes("notification.gcs-web.com") && subject.includes("abivax")) return true;
  if (senderName === "abivax" && /(presents|announces|reports|provides)/.test(subject)) return true;
  return false;
}

function pickBestLink(msg) {
  const links = Array.isArray(msg.links) ? msg.links.map((x) => String(x || "").trim()).filter(Boolean) : [];
  const preferred =
    links.find((u) => /ir\.abivax\.com/i.test(u) && /news|release/i.test(u)) ||
    links.find((u) => /abivax/i.test(u)) ||
    links[0] ||
    "";
  return preferred;
}

function cleanSummary(bodyPreview, subject) {
  let s = String(bodyPreview || "").trim();
  if (!s) return "";
  s = s.replace(/<https?:\/\/[^>]+>/gi, " ");
  s = s.replace(/\bhttps?:\/\/\S+/gi, " ");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^abivax\b[:\-\s]*/i, "");
  // Remove repeated subject prefix if present
  if (subject) {
    const esc = String(subject).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`^${esc}\\s*`, "i"), "").trim();
  }
  // Remove noisy timestamps often present in email headers/snippets
  s = s.replace(/^\b(?:[A-Z][a-z]{2,9}\s+\d{1,2},\s+\d{4})(?:\s+\d{1,2}:\d{2}\s*(?:AM|PM)\s*EST)?\b\s*/i, "").trim();
  s = s.replace(/[<>\s]+$/g, "").trim();
  if (/^A Form\s+[A-Za-z0-9\-]+\b/i.test(s)) {
    return s;
  }
  if (s.length > 320) s = s.slice(0, 320).trim();
  return s;
}

function pickCanonicalSecLink(subject, receivedIso, secFeed) {
  const subj = String(subject || "");
  const formAlert = subj.match(/New Form\s+([A-Za-z0-9\-]+)\s+for\s+Abivax/i);
  const isIrStylePressRelease = /abivax\s+(presents|announces|provides|reports)\b/i.test(subj);
  const form = formAlert ? String(formAlert[1] || "").toUpperCase() : (isIrStylePressRelease ? "6-K" : "");
  if (!form) return "";
  const items = Array.isArray(secFeed?.items) ? secFeed.items : [];
  const receivedTs = Date.parse(String(receivedIso || ""));
  let candidates = items.filter((i) => String(i.form || "").toUpperCase() === form);
  if (!Number.isNaN(receivedTs)) {
    candidates = candidates
      .map((i) => {
        const ts = Date.parse(String(i.publishedAt || i.date || ""));
        return { i, dt: Number.isNaN(ts) ? Number.MAX_SAFE_INTEGER : Math.abs(ts - receivedTs) };
      })
      .filter((x) => x.dt <= (isIrStylePressRelease ? 3 : 7) * 24 * 60 * 60 * 1000)
      .sort((a, b) => a.dt - b.dt)
      .map((x) => x.i);
  }
  const best = candidates[0];
  return best && best.url ? String(best.url) : "";
}

function main() {
  const root = path.join(__dirname, "..");
  const tempDir = path.join(root, "temp");
  const dataDir = path.join(root, "data", "abivax");
  const recentEmails = readJson(path.join(tempDir, "recent-emails.json"), { emails: [] });
  const secFeed = readSecFeed(root);
  const messages = Array.isArray(recentEmails.emails)
    ? recentEmails.emails
    : (Array.isArray(recentEmails.messages) ? recentEmails.messages : []);

  const items = messages
    .filter(looksLikeAbivaxIrEmail)
    .map((m, idx) => {
      const subject = String(m.subject || "").trim();
      const received = String(m.received || "");
      const ts = Date.parse(received);
      const attachments = Array.isArray(m.attachments) ? m.attachments : [];
      const rawBodyPreview = String(m.bodyPreview || "").trim();
      const secCanonicalLink = pickCanonicalSecLink(subject, received, secFeed);
      const bestLink = secCanonicalLink || pickBestLink(m);
      const cleanedSummary = cleanSummary(rawBodyPreview, subject);
      const fallbackSummary = /^Weekly Summary Alert/i.test(subject)
        ? "Weekly summary alert (digest-style). Review only if no SEC/IR item already captured."
        : /^New Form\s+/i.test(subject)
          ? subject.replace(/^New Form\s+/i, "SEC filing alert: ")
          : "";
      return {
        id: `ir-email-${idx}-${Buffer.from(subject).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 14)}`,
        title: subject || "Abivax IR Email Alert",
        date: Number.isNaN(ts) ? "" : new Date(ts).toISOString().slice(0, 10),
        publishedAt: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
        summary: cleanedSummary
          ? cleanedSummary
          : (fallbackSummary || (attachments.length > 0 ? `Attachments: ${attachments.join(", ")}` : "")),
        url: bestLink,
        source: "abivax-ir-email",
        senderEmail: String(m.senderEmail || ""),
        senderName: String(m.senderName || ""),
        attachments,
      };
    })
    .sort((a, b) => (Date.parse(b.publishedAt || b.date || "") || 0) - (Date.parse(a.publishedAt || a.date || "") || 0))
    .slice(0, 50);

  const payload = {
    generatedAt: new Date().toISOString(),
    status: items.length > 0 ? "ok" : "empty",
    source: "abivax-ir-email",
    itemCount: items.length,
    items,
  };

  writeJson(path.join(dataDir, "company_intel_ir_email_feed.json"), payload);
  writeJson(path.join(tempDir, "company-intel-ir-email-feed-status.json"), payload);
  console.log(path.join(tempDir, "company-intel-ir-email-feed-status.json"));
}

main();
