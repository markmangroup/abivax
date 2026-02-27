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

function normalize(v) {
  return String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function makeKey(item) {
  return `${item.source}|${normalize(item.title)}|${String(item.sourceUrl || "").trim()}`;
}

function classifyQueueItem(item) {
  const t = normalize(item.title);
  if (/fibr|ecco|crohn|obefazimod|ulcerative|ibd/.test(t)) return "clinical-data";
  if (/lilly|acquisition|bid|m a|takeover/.test(t)) return "mna-rumor";
  if (/financial|results|cash|runway|index/.test(t)) return "market-financial";
  return "general-company-update";
}

function priorityFor(item) {
  const t = normalize(item.title);
  if (/filed 6 k \(2026|filed 20 f \(2026/.test(t)) return "high";
  if (/filed 6 k/.test(t)) return "medium";
  if (/lilly|takeover|bid|acquisition/.test(t)) return "high";
  if (/ecco|clinical|obefazimod|crohn|ulcerative/.test(t)) return "high";
  return "medium";
}

function recentEnoughForQueue(row, source) {
  const d = Date.parse(row?.date || row?.publishedAt || "");
  if (Number.isNaN(d)) return true;
  const ageDays = (Date.now() - d) / (24 * 60 * 60 * 1000);
  if (source === "sec-edgar") return ageDays <= 120;
  return ageDays <= 365;
}

function buildItems(irWeb, irEmail, secFeed) {
  const out = [];
  const now = new Date().toISOString();
  for (const src of [irWeb, irEmail, secFeed]) {
    const ok = src && src.status === "ok" && Array.isArray(src.items);
    if (!ok) continue;
    const sourceName = src.source || "unknown";
    const sourceRows = (src.items || [])
      .filter((row) => recentEnoughForQueue(row, sourceName))
      .slice(0, sourceName === "sec-edgar" ? 6 : 20);
    for (const row of sourceRows) {
      out.push({
        id: `queue-${Buffer.from(`${src.source}|${row.id || row.title || ""}|${row.url || row.date || ""}`)
          .toString("base64")
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 30)}`,
        source: sourceName,
        sourceUrl: row.url || "",
        title: row.title || "Company intel update",
        date: row.date || (row.publishedAt ? String(row.publishedAt).slice(0, 10) : ""),
        detectedAt: src.generatedAt || now,
        status: "pending-review",
        queueType: "company-intel-review",
        categoryHint: classifyQueueItem(row),
        priority: priorityFor(row),
        reviewHint: "Review significance and update company intel / digest if material.",
      });
    }
  }
  return out;
}

function main() {
  const root = path.join(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const tempDir = path.join(root, "temp");
  const irWeb = readJson(path.join(dataDir, "company_intel_ir_feed.json"), { status: "unavailable", items: [] });
  const irEmail = readJson(path.join(dataDir, "company_intel_ir_email_feed.json"), { status: "empty", items: [] });
  const secFeed = readJson(path.join(dataDir, "company_intel_sec_feed.json"), { status: "unavailable", items: [] });
  const existing = readJson(path.join(dataDir, "company_intel_review_queue.json"), { items: [] });

  const existingByKey = new Map();
  for (const item of Array.isArray(existing.items) ? existing.items : []) {
    existingByKey.set(makeKey(item), item);
  }

  const detections = buildItems(irWeb, irEmail, secFeed);
  const items = [];
  const seen = new Set();
  for (const det of detections) {
    const key = makeKey(det);
    if (seen.has(key)) continue;
    seen.add(key);
    const prev = existingByKey.get(key);
    if (prev) {
      items.push({
        ...det,
        status: prev.status || det.status,
        reviewedAt: prev.reviewedAt || null,
        reviewOutcome: prev.reviewOutcome || "",
        notes: prev.notes || "",
      });
    } else {
      items.push({
        ...det,
        reviewedAt: null,
        reviewOutcome: "",
        notes: "",
      });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      pendingReview: items.filter((i) => i.status === "pending-review").length,
      reviewed: items.filter((i) => i.status === "reviewed").length,
      highPriorityPending: items.filter((i) => i.status === "pending-review" && i.priority === "high").length,
    },
    items: items.sort((a, b) => (Date.parse(b.detectedAt || b.date || "") || 0) - (Date.parse(a.detectedAt || a.date || "") || 0)),
  };

  writeJson(path.join(dataDir, "company_intel_review_queue.json"), payload);
  writeJson(path.join(tempDir, "company-intel-review-queue-report.json"), {
    generatedAt: payload.generatedAt,
    pendingReview: payload.summary.pendingReview,
    reviewed: payload.summary.reviewed,
    highPriorityPending: payload.summary.highPriorityPending,
  });
  console.log(path.join(tempDir, "company-intel-review-queue-report.json"));
}

main();
