const fs = require("fs");
const path = require("path");
const https = require("https");
const KNOWN_CIK_BY_TICKER = {
  ABVX: "1956827",
};

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function fetchJson(url, timeoutMs = 15000, allowInsecure = false) {
  return new Promise((resolve, reject) => {
    const ua = process.env.SEC_USER_AGENT || "abivax-spine/1.0 (local company-intel detector)";
    const req = https.get(
      url,
      {
        agent: allowInsecure ? new https.Agent({ rejectUnauthorized: false }) : undefined,
        headers: {
          "user-agent": ua,
          accept: "application/json,text/plain,*/*",
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Invalid JSON from ${url}: ${e.message}`));
          }
        });
      }
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout fetching ${url}`)));
    req.on("error", reject);
  });
}

function findCikForTicker(mapJson, ticker) {
  const target = String(ticker || "").toUpperCase();
  const values = Array.isArray(mapJson) ? mapJson : Object.values(mapJson || {});
  for (const row of values) {
    if (String(row.ticker || "").toUpperCase() === target) {
      const cik = String(row.cik_str || row.cik || "").replace(/\D/g, "");
      if (cik) return cik.padStart(10, "0");
    }
  }
  return null;
}

function buildItemsFromSubmissions(subs) {
  const recent = subs?.filings?.recent || {};
  const forms = Array.isArray(recent.form) ? recent.form : [];
  const filingDates = Array.isArray(recent.filingDate) ? recent.filingDate : [];
  const accessionNumbers = Array.isArray(recent.accessionNumber) ? recent.accessionNumber : [];
  const primaryDocs = Array.isArray(recent.primaryDocument) ? recent.primaryDocument : [];
  const items = [];

  for (let i = 0; i < forms.length; i += 1) {
    const form = String(forms[i] || "");
    if (!/^(6-K|20-F|8-K|10-K|10-Q)$/i.test(form)) continue;
    const filingDate = String(filingDates[i] || "");
    const accession = String(accessionNumbers[i] || "");
    const primaryDoc = String(primaryDocs[i] || "");
    const cikNoPad = String(subs.cik || "").replace(/\D/g, "");
    const accessionNoDashes = accession.replace(/-/g, "");
    const filingUrl =
      cikNoPad && accessionNoDashes && primaryDoc
        ? `https://www.sec.gov/Archives/edgar/data/${Number(cikNoPad)}/${accessionNoDashes}/${primaryDoc}`
        : "";

    items.push({
      id: `sec-${form}-${filingDate}-${accessionNoDashes}`.replace(/[^a-zA-Z0-9-]/g, ""),
      form,
      title: `${subs.name || "Abivax"} filed ${form} (${filingDate || "date unknown"})`,
      date: filingDate,
      publishedAt: filingDate ? `${filingDate}T00:00:00Z` : null,
      url: filingUrl,
      accessionNumber: accession,
      source: "sec-edgar",
    });
  }

  return items
    .sort((a, b) => (Date.parse(b.publishedAt || b.date || "") || 0) - (Date.parse(a.publishedAt || a.date || "") || 0))
    .slice(0, 20);
}

async function main() {
  const root = path.join(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const tempDir = path.join(root, "temp");
  const outPath = path.join(dataDir, "company_intel_sec_feed.json");
  const statusPath = path.join(tempDir, "company-intel-sec-feed-status.json");

  const now = new Date().toISOString();
  const ticker = process.env.ABIVAX_SEC_TICKER || "ABVX";
  const cikEnv = (process.env.ABIVAX_SEC_CIK || "").replace(/\D/g, "");
  let cik = cikEnv
    ? cikEnv.padStart(10, "0")
    : (KNOWN_CIK_BY_TICKER[String(ticker).toUpperCase()] || null);
  if (cik) cik = String(cik).replace(/\D/g, "").padStart(10, "0");
  let insecureTlsUsed = false;

  try {
    if (!cik) {
      let tickerMap;
      try {
        tickerMap = await fetchJson("https://www.sec.gov/files/company_tickers.json");
      } catch (err) {
        if (String(err && err.message || err).includes("local issuer certificate")) {
          tickerMap = await fetchJson("https://www.sec.gov/files/company_tickers.json", 15000, true);
          insecureTlsUsed = true;
        } else {
          throw err;
        }
      }
      cik = findCikForTicker(tickerMap, ticker);
      if (!cik) throw new Error(`Unable to resolve CIK for ticker ${ticker}`);
    }

    let submissions;
    try {
      submissions = await fetchJson(`https://data.sec.gov/submissions/CIK${cik}.json`);
    } catch (err) {
      if (String(err && err.message || err).includes("local issuer certificate")) {
        submissions = await fetchJson(`https://data.sec.gov/submissions/CIK${cik}.json`, 15000, true);
        insecureTlsUsed = true;
      } else {
        throw err;
      }
    }
    const items = buildItemsFromSubmissions(submissions);
    const payload = {
      generatedAt: now,
      status: "ok",
      source: "sec-edgar",
      ticker,
      cik,
      companyName: submissions.name || "",
      itemCount: items.length,
      insecureTlsUsed,
      items,
    };
    writeJson(outPath, payload);
    writeJson(statusPath, {
      generatedAt: now,
      status: "ok",
      ticker,
      cik,
      itemCount: items.length,
      insecureTlsUsed,
    });
    console.log(statusPath);
  } catch (err) {
    const payload = {
      generatedAt: now,
      status: "unavailable",
      source: "sec-edgar",
      ticker,
      cik: cik || "",
      itemCount: 0,
      items: [],
      insecureTlsUsed,
      error: String(err && err.message ? err.message : err),
    };
    writeJson(outPath, payload);
    writeJson(statusPath, payload);
    console.log(statusPath);
  }
}

main();
