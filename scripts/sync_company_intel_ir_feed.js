const fs = require("fs");
const path = require("path");
const https = require("https");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function fetchText(url, timeoutMs = 15000, allowInsecure = false, redirectsLeft = 4) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        agent: allowInsecure ? new https.Agent({ rejectUnauthorized: false }) : undefined,
        headers: {
          "user-agent": "abivax-spine/1.0 (+local-company-intel-agent)",
          accept: "text/html,application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = res.headers && res.headers.location ? String(res.headers.location) : "";
        if (status >= 300 && status < 400 && location) {
          res.resume();
          if (redirectsLeft <= 0) return reject(new Error(`Too many redirects fetching ${url}`));
          const nextUrl = location.startsWith("http") ? location : new URL(location, url).toString();
          fetchText(nextUrl, timeoutMs, allowInsecure, redirectsLeft - 1).then(resolve).catch(reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (status >= 400) {
            return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          }
          resolve(body);
        });
      }
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout fetching ${url}`)));
    req.on("error", reject);
  });
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(text) {
  return decodeHtml(String(text || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseRssItems(xml) {
  const items = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/gi;
  const chunks = xml.match(itemRe) || [];
  for (const chunk of chunks) {
    const title = ((chunk.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
    const link = ((chunk.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "").trim();
    const pubDate = ((chunk.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "").trim();
    const description = ((chunk.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || "").trim();
    if (!title || !link) continue;
    const ts = Date.parse(pubDate);
    items.push({
      id: `ir-${Buffer.from(link).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`,
      title: stripTags(title),
      url: stripTags(link),
      date: Number.isNaN(ts) ? "" : new Date(ts).toISOString().slice(0, 10),
      publishedAt: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
      summary: stripTags(description),
      source: "abivax-ir-rss",
    });
  }
  return items;
}

function parseNewsReleaseHtml(html, baseUrl) {
  const items = [];
  const linkRe = /<a[^>]+href="([^"]*news-release-details[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set();
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = decodeHtml(m[1]);
    const title = stripTags(m[2]);
    if (!rawHref || !title) continue;
    const url = rawHref.startsWith("http") ? rawHref : new URL(rawHref, baseUrl).toString();
    if (seen.has(url)) continue;
    seen.add(url);
    const dateWindow = html.slice(Math.max(0, m.index - 300), Math.min(html.length, m.index + 300));
    const dateMatch =
      dateWindow.match(/\b([A-Z][a-z]{2,9}\.? \d{1,2}, \d{4})\b/) ||
      dateWindow.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
    const dateStr = dateMatch ? dateMatch[1] : "";
    const ts = Date.parse(dateStr);
    items.push({
      id: `ir-${Buffer.from(url).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`,
      title,
      url,
      date: Number.isNaN(ts) ? "" : new Date(ts).toISOString().slice(0, 10),
      publishedAt: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
      summary: "",
      source: "abivax-ir-html",
    });
  }
  return items;
}

function parseInvestorRelationsHtml(html, baseUrl) {
  const items = [];
  const seen = new Set();
  const blockRe = /([A-Z][a-z]{2,9} \d{1,2}, \d{4})[\s\S]{0,300}?<a[^>]+href="([^"]+)"[^>]*>\s*Read More\s*<\/a>/gi;
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    const dateStr = m[1];
    const rawHref = decodeHtml(m[2]);
    if (!rawHref) continue;
    const url = rawHref.startsWith("http") ? rawHref : new URL(rawHref, baseUrl).toString();
    if (seen.has(url)) continue;
    seen.add(url);
    const windowStart = Math.max(0, m.index - 600);
    const windowText = html.slice(windowStart, m.index + 250);
    const titleCandidates = [...windowText.matchAll(/<a[^>]+href="[^"]+"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map((x) => stripTags(x[1]))
      .filter(Boolean)
      .filter((t) => !/^read more$/i.test(t));
    const title = (titleCandidates[titleCandidates.length - 1] || "").trim();
    const ts = Date.parse(dateStr);
    if (!title) continue;
    items.push({
      id: `ir-${Buffer.from(url).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`,
      title,
      url,
      date: Number.isNaN(ts) ? "" : new Date(ts).toISOString().slice(0, 10),
      publishedAt: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
      summary: "",
      source: "abivax-ir-investor-relations-html",
    });
  }
  return items;
}

function deriveFromSecFeed(root) {
  const secPath = path.join(root, "data", "abivax", "company_intel_sec_feed.json");
  const secFeed = readJson(secPath, null);
  if (!secFeed || secFeed.status !== "ok" || !Array.isArray(secFeed.items)) return [];
  return secFeed.items
    .filter((i) => String(i.form || "").toUpperCase() === "6-K")
    .filter((i) => {
      const d = Date.parse(i.date || i.publishedAt || "");
      if (Number.isNaN(d)) return false;
      const ageDays = (Date.now() - d) / (24 * 60 * 60 * 1000);
      return ageDays <= 180;
    })
    .slice(0, 12)
    .map((i) => ({
      id: `irsec-${Buffer.from(`${i.accessionNumber || ""}|${i.date || ""}|${i.url || i.id || ""}`)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 40)}`,
      title: i.title || "Abivax SEC filing (6-K)",
      url: i.url || "",
      date: i.date || "",
      publishedAt: i.publishedAt || null,
      summary: "SEC-derived fallback item used while direct Abivax IR website sync is unavailable.",
      source: "abivax-ir-sec-derived",
    }));
}

function uniqueByUrl(items) {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  return out.sort((a, b) => {
    const ad = Date.parse(a.publishedAt || a.date || "") || 0;
    const bd = Date.parse(b.publishedAt || b.date || "") || 0;
    return bd - ad;
  });
}

async function main() {
  const root = path.join(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const tempDir = path.join(root, "temp");
  fs.mkdirSync(tempDir, { recursive: true });

  const outPath = path.join(dataDir, "company_intel_ir_feed.json");
  const statusPath = path.join(tempDir, "company-intel-ir-feed-status.json");
  const now = new Date().toISOString();
  const previous = readJson(outPath, null);

  const endpoints = [
    { url: "https://ir.abivax.com/rss.xml", parser: "rss", timeoutMs: 12000 },
    { url: "https://ir.abivax.com/news-releases", parser: "html", timeoutMs: 25000 },
    { url: "https://ir.abivax.com/news-releases?o=0", parser: "html", timeoutMs: 25000 },
    { url: "https://ir.abivax.com/investor-relations/", parser: "investor-relations-html", timeoutMs: 18000 },
  ];

  let lastError = null;
  let parsedItems = [];
  let endpointUsed = null;
  let insecureTlsUsed = false;

  for (const endpoint of endpoints) {
    try {
      let body;
      try {
        body = await fetchText(endpoint.url, endpoint.timeoutMs || 15000);
      } catch (err) {
        if (String(err && err.message || err).includes("local issuer certificate")) {
          body = await fetchText(endpoint.url, endpoint.timeoutMs || 15000, true);
          insecureTlsUsed = true;
        } else {
          throw err;
        }
      }
      const items =
        endpoint.parser === "rss"
          ? parseRssItems(body)
          : endpoint.parser === "investor-relations-html"
            ? parseInvestorRelationsHtml(body, endpoint.url)
            : parseNewsReleaseHtml(body, endpoint.url);
      if (items.length > 0) {
        parsedItems = items;
        endpointUsed = endpoint.url;
        break;
      }
      lastError = new Error(`No items parsed from ${endpoint.url}`);
    } catch (err) {
      lastError = err;
    }
  }

  if (!endpointUsed) {
    const secDerivedItems = uniqueByUrl(deriveFromSecFeed(root));
    if (secDerivedItems.length > 0) {
      const payload = {
        generatedAt: now,
        status: "degraded-sec-derived",
        source: "abivax-ir",
        endpointUsed: "sec-edgar-fallback",
        itemCount: secDerivedItems.length,
        items: secDerivedItems,
        error: lastError ? String(lastError.message || lastError) : "Direct IR fetch/parser failure",
        insecureTlsUsed,
        lastSuccessAt: previous && previous.status === "ok" ? previous.generatedAt || null : null,
      };
      writeJson(outPath, payload);
      writeJson(statusPath, {
        generatedAt: now,
        status: "degraded-sec-derived",
        endpointUsed: "sec-edgar-fallback",
        itemCount: secDerivedItems.length,
        error: payload.error,
        insecureTlsUsed,
      });
      console.log(statusPath);
      return;
    }
    if (previous && previous.status === "ok" && Array.isArray(previous.items) && previous.items.length > 0) {
      const cached = {
        ...previous,
        generatedAt: now,
        status: "degraded-cache",
        lastSuccessAt: previous.generatedAt || null,
        itemCount: previous.items.length,
        error: lastError ? String(lastError.message || lastError) : "Unknown fetch/parser failure",
        insecureTlsUsed,
      };
      writeJson(outPath, cached);
      writeJson(statusPath, {
        generatedAt: now,
        status: "degraded-cache",
        endpointUsed: previous.endpointUsed || null,
        itemCount: previous.items.length,
        lastSuccessAt: previous.generatedAt || null,
        error: cached.error,
        insecureTlsUsed,
      });
      console.log(statusPath);
      return;
    }
    const payload = {
      generatedAt: now,
      status: "unavailable",
      source: "abivax-ir",
      endpointUsed: null,
      itemCount: 0,
      items: [],
      error: lastError ? String(lastError.message || lastError) : "Unknown fetch/parser failure",
      insecureTlsUsed,
    };
    writeJson(outPath, payload);
    writeJson(statusPath, payload);
    console.log(statusPath);
    return;
  }

  const items = uniqueByUrl(parsedItems).slice(0, 50);
  const payload = {
    generatedAt: now,
    status: "ok",
    source: "abivax-ir",
    endpointUsed,
    itemCount: items.length,
    insecureTlsUsed,
    items,
  };
  writeJson(outPath, payload);
  writeJson(statusPath, {
    generatedAt: now,
    status: "ok",
    endpointUsed,
    itemCount: items.length,
    insecureTlsUsed,
  });
  console.log(statusPath);
}

main().catch((err) => {
  const root = path.join(__dirname, "..");
  const tempDir = path.join(root, "temp");
  fs.mkdirSync(tempDir, { recursive: true });
  const statusPath = path.join(tempDir, "company-intel-ir-feed-status.json");
  writeJson(statusPath, {
    generatedAt: new Date().toISOString(),
    status: "error",
    source: "abivax-ir",
    message: String(err && err.message ? err.message : err),
  });
  console.error(err);
  process.exit(1);
});
