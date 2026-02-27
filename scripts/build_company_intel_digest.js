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
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function daysBetween(fromIso, to = new Date()) {
  const ts = Date.parse(fromIso || "");
  if (Number.isNaN(ts)) return null;
  return Math.floor((to.getTime() - ts) / (24 * 60 * 60 * 1000));
}

function topHeadlinesFromIntel(intel) {
  const items = (intel.sections || [])
    .flatMap((s) => (s.items || []).map((i) => ({ sectionId: s.id, sectionTitle: s.title, ...i })))
    .filter((i) => i && i.id)
    .sort((a, b) => {
      const ad = Date.parse(a.date || "") || 0;
      const bd = Date.parse(b.date || "") || 0;
      return bd - ad;
    });

  const selected = [];
  const used = new Set();
  for (const item of items) {
    if (selected.length >= 6) break;
    const key = `${item.sectionId}:${item.id}`;
    if (used.has(key)) continue;
    used.add(key);
    selected.push({
      id: `digest-${item.id}`,
      date: item.date || intel.asOf || new Date().toISOString().slice(0, 10),
      title: item.summary,
      summary: item.evidenceLine || item.implication || "",
      category: item.sectionId || "general",
      confidence: item.confidence || "reported",
      sourceType: item.sourceStatus || "internal-curated",
      sourceTitle: (item.sources && item.sources[0] && item.sources[0].title) || "",
      sourceUrl: (item.sources && item.sources[0] && item.sources[0].url) || "",
      impact: item.implication || "",
      status: "carry-forward",
    });
  }
  return selected;
}

function topHeadlinesFromIrFeed(irFeed) {
  const items = Array.isArray(irFeed?.items) ? irFeed.items : [];
  return items.slice(0, 8).map((i) => ({
    id: `ir-headline-${i.id || Buffer.from(i.url || i.title || "").toString("base64").slice(0, 16)}`,
    date: i.date || (i.publishedAt ? String(i.publishedAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
    title: i.title || "Abivax IR update",
    summary: i.summary || "",
    category: "ir-news-release",
    confidence: "confirmed",
    sourceType: "primary",
    sourceTitle: "Abivax IR",
    sourceUrl: i.url || "",
    impact: "",
    status: "new",
  }));
}

function topHeadlinesFromIrEmailFeed(irEmailFeed) {
  const items = Array.isArray(irEmailFeed?.items) ? irEmailFeed.items : [];
  return items.slice(0, 8).map((i) => ({
    id: `ir-email-headline-${i.id || Buffer.from(i.title || "").toString("base64").slice(0, 16)}`,
    date: i.date || (i.publishedAt ? String(i.publishedAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
    title: i.title || "Abivax IR email alert",
    summary: i.summary || "Abivax investor relations email alert received.",
    category: "ir-email-alert",
    confidence: "confirmed",
    sourceType: "primary",
    sourceTitle: "Abivax IR Email Alert",
    sourceUrl: "",
    impact: "",
    status: "new",
  }));
}

function mergeAndMarkHeadlines(existing, irHeadlines, curatedHeadlines) {
  const prev = Array.isArray(existing?.headlines) ? existing.headlines : [];
  const prevKeys = new Set(
    prev.map((h) => `${String(h.sourceUrl || "").trim()}|${String(h.title || "").trim().toLowerCase()}`)
  );

  const out = [];
  const seen = new Set();
  for (const h of [...irHeadlines, ...curatedHeadlines]) {
    const key = `${String(h.sourceUrl || "").trim()}|${String(h.title || "").trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...h,
      status: prevKeys.has(key) ? "carry-forward" : (h.status || "new"),
    });
    if (out.length >= 8) break;
  }
  return out;
}

function main() {
  const root = path.join(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const tempDir = path.join(root, "temp");
  fs.mkdirSync(tempDir, { recursive: true });

  const intel = readJson(path.join(dataDir, "company_intel.json"), {
    asOf: "",
    sections: [],
    sourceBacklog: [],
  });
  const existing = readJson(path.join(dataDir, "company_intel_daily_digest.json"), null);
  const irFeed = readJson(path.join(dataDir, "company_intel_ir_feed.json"), {
    status: "unavailable",
    items: [],
    generatedAt: null,
    endpointUsed: null,
    error: "",
  });
  const irEmailFeed = readJson(path.join(dataDir, "company_intel_ir_email_feed.json"), {
    status: "empty",
    items: [],
    generatedAt: null,
  });
  const secFeed = readJson(path.join(dataDir, "company_intel_sec_feed.json"), {
    status: "unavailable",
    items: [],
    generatedAt: null,
    error: "",
  });
  const now = new Date();
  const days = daysBetween(intel.asOf, now);
  const stale = days == null ? true : days >= 1;

  const irFeedUsable =
    irFeed &&
    ["ok", "degraded-cache", "degraded-sec-derived"].includes(String(irFeed.status || "")) &&
    Array.isArray(irFeed.items) &&
    irFeed.items.length > 0;
  const irFeedOk = irFeedUsable;
  const irEmailOk =
    irEmailFeed && irEmailFeed.status === "ok" && Array.isArray(irEmailFeed.items) && irEmailFeed.items.length > 0;
  const secFeedOk = secFeed && secFeed.status === "ok" && Array.isArray(secFeed.items);
  const irFeedFailed = !irFeedUsable && !!(irFeed && (irFeed.generatedAt || irFeed.error));
  const irFeedDegraded = String(irFeed?.status || "") === "degraded-cache";
  const irFeedSecDerived = String(irFeed?.status || "") === "degraded-sec-derived";
  const secFeedFailed = !secFeedOk && !!(secFeed && (secFeed.generatedAt || secFeed.error));
  const sourceStatus = [
    {
      id: "abivax-ir",
      label: "Abivax IR / Press Releases",
      status: irFeedOk ? ((irFeedDegraded || irFeedSecDerived) ? "degraded" : "active") : (irFeedFailed ? "sync-failed" : "planned"),
      mode: irFeedOk
        ? (irFeedDegraded
          ? "automated-http-cache"
          : irFeedSecDerived
            ? "automated-sec-derived-fallback"
            : "automated-http")
        : (irFeedFailed ? "configured-failing" : "not-configured"),
      lastCheckedAt: irFeed.generatedAt || null,
      notes: irFeedOk
        ? (irFeedDegraded
          ? `Using cached IR feed results (${irFeed.itemCount || irFeed.items.length} item(s)); latest fetch failed: ${irFeed.error || "unknown error"}.`
          : irFeedSecDerived
            ? `Direct IR sync failed; using SEC-derived fallback (${irFeed.itemCount || irFeed.items.length} item(s)) while detector is stabilized.`
            : `Automated IR feed sync active (${irFeed.itemCount || irFeed.items.length} item(s)).`)
        : `High-priority source for automated daily digest. ${irFeed.error ? `Latest sync failed: ${irFeed.error}` : "Not yet connected."}`,
    },
    {
      id: "abivax-ir-email",
      label: "Abivax IR Email Alerts",
      status: irEmailOk ? "active" : "planned",
      mode: irEmailOk ? "outlook-email-derived" : "not-detected",
      lastCheckedAt: irEmailFeed.generatedAt || null,
      notes: irEmailOk
        ? `Using inbox alerts as fallback/secondary IR source (${irEmailFeed.itemCount || irEmailFeed.items.length} item(s)).`
        : "No recent Abivax IR email alerts detected in exported inbox window.",
    },
    {
      id: "sec-filings",
      label: "SEC / 6-K / filings",
      status: secFeedOk ? "active" : (secFeedFailed ? "sync-failed" : "planned"),
      mode: secFeedOk ? "automated-sec-edgar" : (secFeedFailed ? "configured-failing" : "not-configured"),
      lastCheckedAt: secFeed.generatedAt || null,
      notes: secFeedOk
        ? `SEC detector active (${secFeed.itemCount || secFeed.items.length} recent filing item(s)).`
        : `Add for official updates and M&A/financing/regulatory disclosures.${secFeed.error ? ` Latest sync failed: ${secFeed.error}` : ""}`,
    },
    {
      id: "news-monitor",
      label: "Biotech News Monitor",
      status: "planned",
      mode: "not-configured",
      lastCheckedAt: null,
      notes: "Use filtered reputable sources only.",
    },
    {
      id: "x-watchlist",
      label: "X / social chatter watchlist",
      status: "planned",
      mode: "not-configured",
      lastCheckedAt: null,
      notes: "Use for rumor monitoring only; never primary confirmation.",
    },
    {
      id: "curated-manual",
      label: "Curated internal intel file",
      status: "active",
      mode: "manual-curated",
      lastCheckedAt: now.toISOString(),
      notes: "Current company_intel.json is the active source until feed agents are added.",
    },
  ];

  const curatedHeadlines = topHeadlinesFromIntel(intel);
  const irHeadlines =
    irFeedOk && !irFeedSecDerived
      ? topHeadlinesFromIrFeed(irFeed)
      : [];
  let irEmailHeadlines = irEmailOk ? topHeadlinesFromIrEmailFeed(irEmailFeed) : [];
  if (secFeedOk) {
    irEmailHeadlines = irEmailHeadlines.filter((h) => !/^new form 6-k for abivax$/i.test(String(h.title || "").trim()));
  }
  const headlines = mergeAndMarkHeadlines(existing, [...irHeadlines, ...irEmailHeadlines], curatedHeadlines);

  const payload = {
    generatedAt: now.toISOString(),
    asOf: now.toISOString().slice(0, 10),
    freshness: {
      intelAsOf: intel.asOf || "",
      daysSinceIntelSnapshot: days == null ? 999 : days,
      stale,
      staleReason:
        days == null
          ? "company_intel.json has no valid asOf date."
          : stale
            ? `Curated company intel snapshot is ${days} day(s) old. Live feeds may be partial while direct sources are still being connected/stabilized.`
            : "Curated company intel snapshot is current.",
    },
    summary: {
      newCount: headlines.filter((h) => h.status === "new").length,
      highPriorityCount: headlines.filter((h) => ["confirmed", "rumor"].includes(String(h.confidence || "").toLowerCase())).length,
      sourceFeedsActive: sourceStatus.filter((s) => s.status === "active").length,
      sourceFeedsPlanned: sourceStatus.filter((s) => s.status === "planned").length,
    },
    headlines,
    sourceStatus,
    todo: [
      irFeedOk
        ? "Tune Abivax IR feed parsing to improve summaries and impact classification."
        : "Stabilize direct Abivax IR website feed (timeouts/TLS); keep IR email alerts as fallback source.",
      secFeedOk
        ? "Tune SEC detector filtering/prioritization (forms and filing relevance)."
        : secFeedFailed
          ? "Stabilize SEC filings detector (headers/TLS/403 handling) and keep it in detection-only mode."
          : "Add SEC filing monitor (6-K and other relevant filings).",
      "Add filtered biotech news monitor and classify as reported vs rumor.",
      "Add 'new since yesterday' highlighting at top of Company Intel page.",
      "Add company-intel digest summary block to Today page when major change detected.",
    ],
  };

  // If feed is still unavailable and an existing digest has curated manual headline edits, preserve them.
  if (!irFeedOk && !irEmailOk && existing && Array.isArray(existing.headlines) && existing.headlines.length > 0) {
    payload.headlines = existing.headlines;
    payload.summary.newCount = existing.headlines.filter((h) => h.status === "new").length;
    payload.summary.highPriorityCount = existing.headlines.filter((h) =>
      ["confirmed", "rumor"].includes(String(h.confidence || "").toLowerCase())
    ).length;
  }

  writeJson(path.join(dataDir, "company_intel_daily_digest.json"), payload);
  writeJson(path.join(tempDir, "company-intel-digest-report.json"), {
    generatedAt: payload.generatedAt,
    stale: payload.freshness.stale,
    daysSinceIntelSnapshot: payload.freshness.daysSinceIntelSnapshot,
    headlineCount: payload.headlines.length,
    sourceFeedsActive: payload.summary.sourceFeedsActive,
    sourceFeedsPlanned: payload.summary.sourceFeedsPlanned,
  });
  console.log(path.join(tempDir, "company-intel-digest-report.json"));
}

main();
