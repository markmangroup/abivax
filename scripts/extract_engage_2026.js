/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = process.cwd();
const SOURCE_FILE = path.join(ROOT, "data", "abivax", "p2p", "ENGAGE_2026.xlsx");
const OUT_DIR = path.join(ROOT, "data", "abivax", "p2p");
const PUBLIC_JSON = path.join(ROOT, "public", "engage-france-analytics.json");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readWorkbook(filePath) {
  return XLSX.readFile(filePath, { cellDates: false });
}

function rowsForSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanUpper(value) {
  return cleanText(value).toUpperCase();
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = cleanText(value);
  if (!raw || raw === "-" || raw === "—") return null;
  const normalized = raw
    .replace(/€/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, "");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

const MONTHS = {
  jan: 1,
  january: 1,
  janvier: 1,
  feb: 2,
  february: 2,
  fevrier: 2,
  février: 2,
  mar: 3,
  march: 3,
  mars: 3,
  apr: 4,
  april: 4,
  avr: 4,
  avril: 4,
  may: 5,
  mai: 5,
  jun: 6,
  june: 6,
  juin: 6,
  jul: 7,
  july: 7,
  juillet: 7,
  aug: 8,
  august: 8,
  aout: 8,
  août: 8,
  sep: 9,
  sept: 9,
  september: 9,
  septembre: 9,
  oct: 10,
  october: 10,
  octobre: 10,
  nov: 11,
  november: 11,
  novembre: 11,
  dec: 12,
  december: 12,
  decembre: 12,
  décembre: 12,
};

function isoDate(year, month, day) {
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(dt.getTime())) return null;
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return dt.toISOString().slice(0, 10);
}

function parseDateToken(token) {
  const raw = cleanText(token)
    .replace(/\?/g, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ");
  if (!raw) return null;

  let m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let year = Number(m[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    const first = Number(m[1]);
    const second = Number(m[2]);
    if (first > 12 && second <= 12) return isoDate(year, second, first);
    if (second > 12 && first <= 12) return isoDate(year, first, second);
    return isoDate(year, second, first) || isoDate(year, first, second);
  }

  m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));

  m = raw.match(/^([A-Za-zÀ-ÿ]+)\s+(\d{4})$/);
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    if (month) return isoDate(Number(m[2]), month, 1);
  }

  m = raw.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month) return isoDate(Number(m[3]), month, Number(m[1]));
  }

  return null;
}

function parseDateList(value) {
  const raw = cleanText(value);
  if (!raw) return [];
  const tokens = raw
    .split(/\+|;|,/)
    .map((part) => cleanText(part))
    .filter(Boolean);
  return tokens.map(parseDateToken).filter(Boolean);
}

function daysBetween(asOf, iso) {
  if (!iso) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.floor((a - b) / 86400000);
}

function mapRow(headers, row) {
  const record = {};
  headers.forEach((header, i) => {
    record[header] = row[i] ?? "";
  });
  return {
    removeFlag: cleanUpper(record["a retirer"]),
    state: cleanText(record["Etat"]),
    project: cleanText(record["projet"] || record["Projet"]),
    ref: cleanText(record["Ref."]),
    department: cleanText(record["Departement"]),
    poRequestor: cleanText(record["PO requestor"]),
    supplier: cleanText(record["Fournisseur"]),
    quote: cleanText(record["Devis"]),
    po: cleanText(record["PO"]),
    milestone: cleanText(record["Milestones"]),
    milestoneDateRaw: cleanText(record["Date Milestones"]),
    invoiceNumber: cleanText(record["N° de facture"]),
    invoiceDateRaw: cleanText(record["Date facture"]),
    milestoneAmount: parseNumber(record["Montant Milestones"]),
    currency: cleanUpper(record["Currency"]),
    status: cleanText(record["Statut"]),
    toBeExpected: parseNumber(record["To be expected"]),
    alreadyBooked: parseNumber(record["Already Booked"]),
    comment: cleanText(record["COMMENTAIRE"]),
  };
}

function normalizeRows(rows) {
  const headerRow = rows[1] || [];
  const headers = headerRow.map((cell) => cleanText(cell));
  return rows.slice(2).map((row) => mapRow(headers, row));
}

function latestDate(dates) {
  return dates.length ? dates.slice().sort().at(-1) : null;
}

function effectiveDateForRow(row) {
  const invoiceDates = parseDateList(row.invoiceDateRaw);
  const milestoneDates = parseDateList(row.milestoneDateRaw);
  const invoiceDate = latestDate(invoiceDates);
  const milestoneDate = latestDate(milestoneDates);
  return {
    invoiceDates,
    milestoneDates,
    effectiveDate: invoiceDate || milestoneDate || null,
    effectiveDateSource: invoiceDate ? "invoice" : milestoneDate ? "milestone" : "none",
  };
}

function isProbablyRemoved(row) {
  return ["X", "XX"].includes(row.removeFlag);
}

function isProbablyOut(row) {
  const state = cleanUpper(row.state);
  return state.includes("OUT");
}

function isClosedState(row) {
  const state = cleanUpper(row.state);
  return state.includes("CLOTUR") || state.includes("CLÔTUR");
}

function withExposure(row, asOfDate) {
  const dates = effectiveDateForRow(row);
  const daysOpen = daysBetween(asOfDate, dates.effectiveDate);
  return {
    ...row,
    invoiceDates: dates.invoiceDates,
    milestoneDates: dates.milestoneDates,
    effectiveDate: dates.effectiveDate,
    effectiveDateSource: dates.effectiveDateSource,
    daysOpen,
    missingPo: !row.po,
    missingInvoice: !row.invoiceNumber,
    missingDate: !dates.effectiveDate,
    likelyExcluded: isProbablyRemoved(row) || isProbablyOut(row) || isClosedState(row),
  };
}

function sumBy(items, key, valueKey) {
  const map = new Map();
  for (const item of items) {
    const keyValue = cleanText(item[key] || "Unspecified") || "Unspecified";
    const current = map.get(keyValue) || 0;
    map.set(keyValue, current + (item[valueKey] || 0));
  }
  return [...map.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function countBy(items, key) {
  const map = new Map();
  for (const item of items) {
    const keyValue = cleanText(item[key] || "Unspecified") || "Unspecified";
    map.set(keyValue, (map.get(keyValue) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function round(value) {
  return Math.round((value || 0) * 100) / 100;
}

function buildAgingBuckets(rows) {
  const buckets = [
    { label: "Future-dated", min: Number.MIN_SAFE_INTEGER, max: -1, amount: 0, lines: 0 },
    { label: "No date", min: null, max: null, amount: 0, lines: 0 },
    { label: "0-30 days", min: 0, max: 30, amount: 0, lines: 0 },
    { label: "31-60 days", min: 31, max: 60, amount: 0, lines: 0 },
    { label: "61-90 days", min: 61, max: 90, amount: 0, lines: 0 },
    { label: "91-180 days", min: 91, max: 180, amount: 0, lines: 0 },
    { label: "181-365 days", min: 181, max: 365, amount: 0, lines: 0 },
    { label: "365+ days", min: 366, max: Number.MAX_SAFE_INTEGER, amount: 0, lines: 0 },
  ];

  for (const row of rows) {
    let bucket = buckets[1];
    if (typeof row.daysOpen === "number") {
      bucket = buckets.find((candidate) => candidate.min !== null && row.daysOpen >= candidate.min && row.daysOpen <= candidate.max) || buckets[1];
    }
    bucket.amount += row.toBeExpected || 0;
    bucket.lines += 1;
  }

  return buckets.map((bucket) => ({ ...bucket, amount: round(bucket.amount) }));
}

function buildTopItems(rows, limit = 12) {
  return rows
    .slice()
    .sort((a, b) => (b.toBeExpected || 0) - (a.toBeExpected || 0))
    .slice(0, limit)
    .map((row) => ({
      supplier: row.supplier,
      department: row.department || "Unspecified",
      project: row.project || "Unspecified",
      po: row.po || "",
      invoiceNumber: row.invoiceNumber || "",
      effectiveDate: row.effectiveDate,
      effectiveDateSource: row.effectiveDateSource,
      daysOpen: row.daysOpen,
      toBeExpected: round(row.toBeExpected || 0),
      alreadyBooked: round(row.alreadyBooked || 0),
      comment: row.comment || "",
    }));
}

function buildCurrencyMix(rows) {
  return sumBy(rows, "currency", "toBeExpected").map((item) => ({
    currency: item.label,
    toBeExpected: round(item.amount),
  }));
}

function summarizePivot(rows) {
  const out = [];
  for (const row of rows.slice(2)) {
    const currency = cleanUpper(row[3]);
    const gross = parseNumber(row[4]);
    const eur = parseNumber(row[5]);
    const rate = parseNumber(row[6]);
    if (!currency || !Number.isFinite(gross)) continue;
    out.push({
      currency,
      originalAmount: round(gross),
      eurAmount: round(eur || 0),
      rate,
    });
  }
  return out.filter((item) => item.currency !== "TOTAL GÉNÉRAL" && item.currency !== "TOTAL GENERAL");
}

function approxEqual(a, b, tolerance = 1) {
  return Math.abs((a || 0) - (b || 0)) <= tolerance;
}

function statusFor(ok, warn = false) {
  if (ok) return "pass";
  if (warn) return "warn";
  return "fail";
}

function main() {
  ensureDir(OUT_DIR);
  ensureDir(path.dirname(PUBLIC_JSON));

  const wb = readWorkbook(SOURCE_FILE);
  const baseRowsRaw = rowsForSheet(wb, "BASE");
  const closedRowsRaw = rowsForSheet(wb, "Presta clôturées");
  const recapRows = rowsForSheet(wb, "Recap ENGAGE EUROS");
  const asOfDate = "2026-03-17";

  const baseRows = normalizeRows(baseRowsRaw).map((row) => withExposure(row, asOfDate));
  const closedRows = normalizeRows(closedRowsRaw).map((row) => withExposure(row, asOfDate));

  const eurBase = baseRows.filter((row) => row.currency === "EUROS");
  const eurOpenGross = eurBase.filter((row) => (row.toBeExpected || 0) > 0);
  const eurOpenActive = eurOpenGross.filter((row) => !row.likelyExcluded);
  const eurClosed = closedRows.filter((row) => row.currency === "EUROS");

  const grossExpected = eurOpenGross.reduce((sum, row) => sum + (row.toBeExpected || 0), 0);
  const activeExpected = eurOpenActive.reduce((sum, row) => sum + (row.toBeExpected || 0), 0);
  const activeBooked = eurOpenActive.reduce((sum, row) => sum + (row.alreadyBooked || 0), 0);
  const activeMilestones = eurOpenActive.reduce((sum, row) => sum + (row.milestoneAmount || 0), 0);
  const datedLines = eurOpenActive.filter((row) => typeof row.daysOpen === "number" && row.daysOpen >= 0);
  const weightedDays = datedLines.reduce((sum, row) => sum + (row.daysOpen || 0) * (row.toBeExpected || 0), 0);
  const weightedAgeDays = activeExpected > 0 ? weightedDays / activeExpected : null;

  const exclusions = {
    removedFlagAmount: round(eurOpenGross.filter(isProbablyRemoved).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
    outStateAmount: round(eurOpenGross.filter(isProbablyOut).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
    closedStateAmount: round(eurOpenGross.filter(isClosedState).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
  };
  const uniqueExcludedAmount = round(eurOpenGross.filter((row) => row.likelyExcluded).reduce((sum, row) => sum + (row.toBeExpected || 0), 0));
  const totalExclusions = round(exclusions.removedFlagAmount + exclusions.outStateAmount + exclusions.closedStateAmount);
  const exclusionOverlapAmount = round(totalExclusions - uniqueExcludedAmount);
  const agingBuckets = buildAgingBuckets(eurOpenActive);
  const agingTotal = round(agingBuckets.reduce((sum, row) => sum + (row.amount || 0), 0));
  const departmentTotals = sumBy(eurOpenActive, "department", "toBeExpected");
  const supplierTotals = sumBy(eurOpenActive, "supplier", "toBeExpected");
  const projectTotals = sumBy(eurOpenActive, "project", "toBeExpected");
  const departmentTotal = round(departmentTotals.reduce((sum, row) => sum + (row.amount || 0), 0));
  const supplierTotal = round(supplierTotals.reduce((sum, row) => sum + (row.amount || 0), 0));
  const projectTotal = round(projectTotals.reduce((sum, row) => sum + (row.amount || 0), 0));
  const stateBreakdown = countBy(eurOpenGross, "state");
  const currencyMix = buildCurrencyMix(baseRows);
  const recapEurPivot = summarizePivot(recapRows);
  const recapEuroTotal = round((recapEurPivot.find((row) => row.currency === "EUROS") || {}).eurAmount || 0);
  const missingDateShare = activeExpected
    ? round((eurOpenActive.filter((row) => row.missingDate).reduce((sum, row) => sum + (row.toBeExpected || 0), 0) / activeExpected) * 100)
    : 0;
  const validations = [
    {
      id: "gross-minus-exclusions-equals-active",
      label: "Gross EUR less exclusions equals likely active EUR",
      status: statusFor(approxEqual(round(grossExpected - uniqueExcludedAmount), round(activeExpected))),
      actual: round(grossExpected - uniqueExcludedAmount),
      expected: round(activeExpected),
      delta: round(round(grossExpected - uniqueExcludedAmount) - round(activeExpected)),
      note: "Bridge from gross open EUR exposure to active EUR exposure using unique excluded rows."
    },
    {
      id: "aging-buckets-tie-to-active",
      label: "Aging buckets total ties to likely active EUR",
      status: statusFor(approxEqual(agingTotal, round(activeExpected))),
      actual: agingTotal,
      expected: round(activeExpected),
      delta: round(agingTotal - round(activeExpected)),
      note: "Every active EUR row should land in exactly one bucket."
    },
    {
      id: "department-total-ties",
      label: "Department aggregation ties to likely active EUR",
      status: statusFor(approxEqual(departmentTotal, round(activeExpected))),
      actual: departmentTotal,
      expected: round(activeExpected),
      delta: round(departmentTotal - round(activeExpected)),
      note: "Checks that department grouping is not dropping rows."
    },
    {
      id: "supplier-total-ties",
      label: "Supplier aggregation ties to likely active EUR",
      status: statusFor(approxEqual(supplierTotal, round(activeExpected))),
      actual: supplierTotal,
      expected: round(activeExpected),
      delta: round(supplierTotal - round(activeExpected)),
      note: "Checks that supplier grouping is not dropping rows."
    },
    {
      id: "project-total-ties",
      label: "Project aggregation ties to likely active EUR",
      status: statusFor(approxEqual(projectTotal, round(activeExpected))),
      actual: projectTotal,
      expected: round(activeExpected),
      delta: round(projectTotal - round(activeExpected)),
      note: "Checks that project grouping is not dropping rows."
    },
    {
      id: "recap-vs-base-euros",
      label: "Recap EUR pivot is directionally close to BASE EUR gross exposure",
      status: statusFor(approxEqual(recapEuroTotal, round(grossExpected), 500000), true),
      actual: recapEuroTotal,
      expected: round(grossExpected),
      delta: round(recapEuroTotal - round(grossExpected)),
      note: "Warn-level comparison because the recap sheet is pivot-like, not a strict ledger tie-out."
    },
    {
      id: "missing-date-share",
      label: "Missing-date share is below 25% of likely active EUR",
      status: statusFor(missingDateShare < 25, true),
      actual: missingDateShare,
      expected: 25,
      delta: round(missingDateShare - 25),
      note: "Data-quality threshold, not a hard numeric tie-out."
    }
  ];

  const analytics = {
    generatedAt: new Date().toISOString(),
    asOfDate,
    sourceFile: "data/abivax/p2p/ENGAGE_2026.xlsx",
    workbook: {
      sheets: wb.SheetNames,
      baseRowCount: baseRows.length,
      closedRowCount: closedRows.length,
      recapRowCount: recapRows.length,
    },
    methodology: {
      focus: "EUROS only by default for aging and exposure visuals",
      agingBasis: "Latest parseable invoice date in `Date facture`; if missing, fallback to `Date Milestones`; if none, bucket as `No date`.",
      openExposureDefinition: "Rows in BASE with `Currency = EUROS` and `To be expected > 0`.",
      likelyActiveDefinition: "Open EUR rows excluding explicit remove flags (`x`/`xx`) and states containing `OUT` or `Clôturé`.",
      caution: "This is a Juliette-maintained operational tracker, not the AP ledger. Use it as an operational exposure and process-quality view, not a statutory payable balance."
    },
    kpis: {
      eurOpenGrossExpected: round(grossExpected),
      eurOpenLikelyActiveExpected: round(activeExpected),
      eurOpenLikelyActiveBooked: round(activeBooked),
      eurOpenLikelyActiveMilestoneAmount: round(activeMilestones),
      eurOpenLikelyActiveLineCount: eurOpenActive.length,
      eurOpenLikelyActiveSupplierCount: new Set(eurOpenActive.map((row) => row.supplier).filter(Boolean)).size,
      eurOpenLikelyActiveProjectCount: new Set(eurOpenActive.map((row) => row.project).filter(Boolean)).size,
      weightedAverageAgeDays: weightedAgeDays === null ? null : round(weightedAgeDays),
      futureDatedExposure: round(eurOpenActive.filter((row) => typeof row.daysOpen === "number" && row.daysOpen < 0).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
      noDateExposure: round(eurOpenActive.filter((row) => row.missingDate).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
    },
    exclusions: { ...exclusions, totalExclusions, uniqueExcludedAmount, exclusionOverlapAmount },
    validations,
    dataQuality: {
      missingPoLines: eurOpenActive.filter((row) => row.missingPo).length,
      missingPoExposure: round(eurOpenActive.filter((row) => row.missingPo).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
      missingInvoiceLines: eurOpenActive.filter((row) => row.missingInvoice).length,
      missingInvoiceExposure: round(eurOpenActive.filter((row) => row.missingInvoice).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
      missingDateLines: eurOpenActive.filter((row) => row.missingDate).length,
      missingDateExposure: round(eurOpenActive.filter((row) => row.missingDate).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
      futureDatedLines: eurOpenActive.filter((row) => typeof row.daysOpen === "number" && row.daysOpen < 0).length,
      futureDatedExposure: round(eurOpenActive.filter((row) => typeof row.daysOpen === "number" && row.daysOpen < 0).reduce((sum, row) => sum + (row.toBeExpected || 0), 0)),
    },
    agingBuckets,
    departmentExposure: departmentTotals.slice(0, 10).map((row) => ({ department: row.label, amount: round(row.amount) })),
    supplierExposure: supplierTotals.slice(0, 12).map((row) => ({ supplier: row.label, amount: round(row.amount) })),
    projectExposure: projectTotals.slice(0, 12).map((row) => ({ project: row.label, amount: round(row.amount) })),
    stateBreakdown,
    currencyMix,
    recapEurPivot,
    topAgedItems: buildTopItems(
      eurOpenActive
        .filter((row) => typeof row.daysOpen === "number" && row.daysOpen >= 0)
        .slice()
        .sort((a, b) => (b.daysOpen || 0) - (a.daysOpen || 0)),
      15
    ),
    topFutureItems: buildTopItems(
      eurOpenActive
        .filter((row) => typeof row.daysOpen === "number" && row.daysOpen < 0)
        .slice()
        .sort((a, b) => (b.toBeExpected || 0) - (a.toBeExpected || 0)),
      15
    ),
    topExposureItems: buildTopItems(eurOpenActive, 15),
    closedBaseline: {
      eurClosedLineCount: eurClosed.length,
      eurClosedBookedAmount: round(eurClosed.reduce((sum, row) => sum + (row.alreadyBooked || 0), 0)),
      eurClosedMilestoneAmount: round(eurClosed.reduce((sum, row) => sum + (row.milestoneAmount || 0), 0)),
    },
  };

  const outFile = path.join(OUT_DIR, "engage_2026_analytics.json");
  fs.writeFileSync(outFile, JSON.stringify(analytics, null, 2) + "\n", "utf8");
  fs.writeFileSync(PUBLIC_JSON, JSON.stringify(analytics, null, 2) + "\n", "utf8");
  console.log(`Wrote ${path.relative(ROOT, outFile)}`);
  console.log(`Wrote ${path.relative(ROOT, PUBLIC_JSON)}`);
}

main();
