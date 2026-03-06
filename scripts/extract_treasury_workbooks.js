const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const sourceDir = path.join("data", "abivax", "inbox_assets", "2026-03-05-roxandra-treasury");
const outDir = path.join("data", "abivax", "treasury");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanNumber(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/\s+/g, "").replace(/[€$,]/g, "");
  if (!s || s === "-" || s === "—") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function sheetRows(workbook, name) {
  const ws = workbook.Sheets[name];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
}

function parseForecast(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const rows = sheetRows(wb, "Consolidated Forecast in €");
  const out = [];
  let months = [];
  let inConsolidatedSection = false;
  for (const row of rows) {
    const joined = row.map((x) => String(x).trim()).join("|");
    if (joined.includes("Abivax SA + LLC") && row.length > 5) {
      months = row
        .slice(4)
        .map((x) => String(x).trim())
        .filter((m) => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i.test(m));
      inConsolidatedSection = true;
      continue;
    }
    if (inConsolidatedSection && String(row[1] || "").trim() === "Abivax SA, EUR + USD") {
      // End of consolidated total block; avoid overwriting with sub-sections.
      break;
    }
    if (!inConsolidatedSection) continue;

    const label = String(row[1] || "").trim();
    if (label === "Balance SA + LLC -EUR+USD- begining of month") {
      const values = row.slice(4, 4 + months.length).map(cleanNumber);
      months.forEach((m, i) => out.push({ month: m, beginKEur: values[i] }));
    }
    if (label === "Balance SA +LLC  -EUR+USD- end of month") {
      const values = row.slice(4, 4 + months.length).map(cleanNumber);
      months.forEach((m, i) => {
        const hit = out.find((x) => x.month === m);
        if (hit) hit.endKEur = values[i];
      });
    }
    if (label === "Montly variance" || label === "Monthly variance") {
      const values = row.slice(4, 4 + months.length).map(cleanNumber);
      months.forEach((m, i) => {
        const hit = out.find((x) => x.month === m);
        if (hit) hit.varianceKEur = values[i];
      });
    }
  }
  return {
    source: path.basename(filePath),
    rowsParsed: out.length,
    forecast: out.filter((x) => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i.test(x.month)),
  };
}

function parseUsdInvestments(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const rows = sheetRows(wb, "Monthly Report 2026 $");
  const nca = [];
  for (const row of rows) {
    const month = String(row[3] || "").trim();
    const bank = String(row[4] || "").trim();
    const investment = String(row[5] || "").trim();
    const rate = String(row[8] || "").trim();
    const amount = cleanNumber(row[9]);
    if (month && bank === "SG" && investment === "NCA" && amount !== null) {
      nca.push({ month, rate, amountUSD: amount });
    }
  }

  const rows2026_1 = sheetRows(wb, "2026-1");
  let janSummary = null;
  for (const row of rows2026_1) {
    const ccy = String(row[0] || "").trim();
    if (ccy.startsWith("K")) {
      janSummary = janSummary || {};
      const key = ccy.includes("$") ? "K$" : "KEUR";
      janSummary[key] = {
        rate: String(row[1] || "").trim(),
        eomAmount: String(row[4] || "").trim(),
        interestDue: String(row[5] || "").trim(),
        interestPaid: String(row[6] || "").trim(),
      };
    }
  }

  return {
    source: path.basename(filePath),
    sgNca2026Usd: nca,
    jan2026InterestSummary: janSummary,
  };
}

function parsePlanning(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const targetSheets = ["janvier", "février", "mars", "dec", "dec (2)"];
  const movements = [];

  for (const sheet of wb.SheetNames) {
    if (!targetSheets.includes(sheet.toLowerCase())) continue;
    const rows = sheetRows(wb, sheet);
    for (const row of rows) {
      const desc = String(row[2] || "").trim();
      const eurMove = cleanNumber(row[4] || row[5] || "");
      const usdMove = cleanNumber(row[7] || "");
      if (!desc) continue;
      if (!/(change|nca|paie|dgfip|cat|cash out|cash in|virement|pge|kreos|claret)/i.test(desc)) continue;
      movements.push({
        sheet,
        day: String(row[0] || row[1] || "").trim(),
        description: desc,
        eurMove,
        usdMove,
      });
    }
  }

  return {
    source: path.basename(filePath),
    movementEventsParsed: movements.length,
    movementEventsSample: movements.slice(0, 30),
  };
}

function parsePlacementSnapshot(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const out = { source: path.basename(filePath), placementSnapshots: [] };

  for (const s of ["Placement EUR", "Placement USD"]) {
    if (!wb.SheetNames.includes(s)) continue;
    const rows = sheetRows(wb, s);
    for (const row of rows) {
      const label = String(row[0] || "").trim().toLowerCase();
      if (label !== "cash balance") continue;
      const date = String(row[1] || "").trim();
      const amount = cleanNumber(row[3] || row[4] || row[7] || "");
      out.placementSnapshots.push({
        sheet: s,
        date,
        amount,
        rawRow: row.slice(0, 8),
      });
    }
  }
  return out;
}

function collectDataQualityExceptions({ forecast, investments, planning, placements, sourceDir }) {
  const issues = [];

  // Check for invalid-looking placement dates
  for (const row of placements.placementSnapshots) {
    const d = String(row.date || "").trim();
    if (!d) continue;
    if (/\/00$/.test(d) || /23026/.test(d)) {
      issues.push({
        severity: "medium",
        area: "placements",
        issue: "Invalid or suspicious date format in placement snapshot row",
        value: d,
        sheet: row.sheet,
      });
    }
  }

  // Check if Exposition FX tab is empty
  try {
    const fxFile = path.join(sourceDir, "Management placements  et Exposition FX 20251112.xlsx");
    const wb = XLSX.readFile(fxFile, { cellDates: true });
    const fxRows = sheetRows(wb, "Exposition FX");
    const nonEmpty = fxRows.filter((r) => r.some((c) => String(c).trim() !== ""));
    if (nonEmpty.length === 0) {
      issues.push({
        severity: "high",
        area: "fx",
        issue: "Exposition FX tab is empty",
        value: "No data rows",
        sheet: "Exposition FX",
      });
    }
  } catch (e) {
    issues.push({
      severity: "medium",
      area: "fx",
      issue: "Could not read Exposition FX sheet",
      value: String(e.message || e),
      sheet: "Exposition FX",
    });
  }

  // Basic forecasting sanity check: end month should not exceed opening by unrealistic swing without note
  if (forecast.forecast && forecast.forecast.length > 0) {
    const jan = forecast.forecast.find((x) => x.month === "Jan");
    if (jan && jan.beginKEur !== null && jan.endKEur !== null && jan.endKEur > jan.beginKEur * 1.5) {
      issues.push({
        severity: "low",
        area: "forecast",
        issue: "Jan forecast end exceeds opening by >50%",
        value: `begin=${jan.beginKEur}, end=${jan.endKEur}`,
        sheet: "Consolidated Forecast in €",
      });
    }
  }

  return issues;
}

function buildInventory(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".xlsx"));
  const inventory = [];
  for (const f of files) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    const wb = XLSX.readFile(p, { cellDates: true });
    inventory.push({
      file: f,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      sheets: wb.SheetNames,
    });
  }
  return inventory;
}

function main() {
  ensureDir(outDir);
  const inventory = buildInventory(sourceDir);
  fs.writeFileSync(path.join(outDir, "workbook_inventory.json"), JSON.stringify({ generatedAt: new Date().toISOString(), sourceDir, inventory }, null, 2));

  const forecastFile = path.join(sourceDir, "Forecast12m 20260305.xlsx");
  const investmentFile = path.join(sourceDir, "2025-2026 Treasury Management Report v11.xlsx");
  const planningFile = path.join(sourceDir, "Cash Forecast Monthly Planning 2026.xlsx");
  const placementFile = path.join(sourceDir, "Management placements  et Exposition FX 20251112.xlsx");

  const forecast = parseForecast(forecastFile);
  const investments = parseUsdInvestments(investmentFile);
  const planning = parsePlanning(planningFile);
  const placements = parsePlacementSnapshot(placementFile);
  const qualityIssues = collectDataQualityExceptions({ forecast, investments, planning, placements, sourceDir });
  const latestPlacement = placements.placementSnapshots.length
    ? placements.placementSnapshots[placements.placementSnapshots.length - 1]
    : null;

  fs.writeFileSync(path.join(outDir, "forecast_snapshot.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ...forecast }, null, 2));
  fs.writeFileSync(path.join(outDir, "investment_snapshot.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ...investments }, null, 2));
  fs.writeFileSync(path.join(outDir, "planning_snapshot.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ...planning }, null, 2));
  fs.writeFileSync(path.join(outDir, "placement_snapshot.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ...placements }, null, 2));
  fs.writeFileSync(
    path.join(outDir, "data_quality_exceptions.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), issueCount: qualityIssues.length, issues: qualityIssues }, null, 2)
  );

  const first = forecast.forecast.find((x) => x.month === "Jan") || forecast.forecast[0] || null;
  const metrics = {
    generatedAt: new Date().toISOString(),
    filesIngested: inventory.length,
    forecastMonthsParsed: forecast.forecast.length,
    janOpeningKEur: first ? first.beginKEur : null,
    janEndingKEur: first ? first.endKEur : null,
    janVarianceKEur: first ? first.varianceKEur : null,
    usdNcaRowsParsed: investments.sgNca2026Usd.length,
    planningEventsParsed: planning.movementEventsParsed,
    placementRowsParsed: placements.placementSnapshots.length,
    latestPlacementDate: latestPlacement ? latestPlacement.date : null,
    latestPlacementAmount: latestPlacement ? latestPlacement.amount : null,
    dataQualityIssues: qualityIssues.length,
  };
  fs.writeFileSync(path.join(outDir, "treasury_metrics.json"), JSON.stringify(metrics, null, 2));

  console.log("Generated treasury datasets in", outDir);
}

main();
