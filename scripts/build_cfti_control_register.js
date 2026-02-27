const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}
function norm(v) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}
function lower(v) {
  return norm(v).toLowerCase();
}
function rowScore(row) {
  const t = row.map(norm).join(" | ").toLowerCase();
  let s = 0;
  if (t.includes("control id")) s += 5;
  if (t.includes("control title")) s += 4;
  if (t.includes("control summary") || t.includes("control description")) s += 4;
  if (t.includes("sub-process")) s += 3;
  if (t.includes("overall status")) s += 3;
  if (t.includes("remediation")) s += 2;
  if (t.includes("validation date")) s += 2;
  return s;
}
function makeUniqueHeaders(headers) {
  const seen = new Map();
  return headers.map((h, idx) => {
    const base = norm(h) || `Column ${idx + 1}`;
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
}
function sheetToRecords(sheet) {
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }).map((r) => r.map(norm));
  let headerRowIndex = -1;
  let best = 0;
  for (let i = 0; i < Math.min(rows.length, 30); i += 1) {
    const sc = rowScore(rows[i] || []);
    if (sc > best) {
      best = sc;
      headerRowIndex = i;
    }
  }
  if (headerRowIndex < 0) return { headerRowIndex: -1, headers: [], records: [] };
  const headers = makeUniqueHeaders(rows[headerRowIndex]);
  const records = [];
  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    if (!row.some((c) => norm(c))) continue;
    const rec = {};
    headers.forEach((h, j) => {
      const v = norm(row[j]);
      if (v) rec[h] = v;
    });
    if (Object.keys(rec).length) records.push(rec);
  }
  return { headerRowIndex, headers, records };
}
function latestCftiAttachmentFolder(root) {
  const base = path.join(root, "temp", "recent-email-attachments");
  if (!fs.existsSync(base)) return null;
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ full: path.join(base, d.name), name: d.name }))
    .sort((a, b) => fs.statSync(b.full).mtimeMs - fs.statSync(a.full).mtimeMs)
    .find((d) => /sox_findings_and_reporting_process_documentation/i.test(d.name)) || null;
}
function parseWorkbook(filePath) {
  const wb = xlsx.readFile(filePath, { raw: false, cellDates: false });
  const out = {};
  for (const n of wb.SheetNames) out[n] = sheetToRecords(wb.Sheets[n]);
  return out;
}
function pickFile(dir, pattern) {
  return fs.readdirSync(dir).find((f) => /\.xlsx$/i.test(f) && pattern.test(f));
}
function inferPrimaryPillar(controlId, trackerProcess, domainHint) {
  const cid = lower(controlId);
  const p = lower(trackerProcess);
  if (cid.includes("-ptp-") || p === "ptp" || domainHint === "p2p") return "p2p";
  if (cid.includes("-fscp-") || p === "fr-fscp" || domainHint === "fscp") return "reporting-data";
  return "controls-audit";
}
function classifyGapType(trackerGap, remediation, summary, controlId) {
  const g = lower(trackerGap);
  const r = lower(remediation);
  const s = lower(summary);
  const cid = lower(controlId);
  if (g === "erp" || r.includes("erp") || cid.endsWith("g") && (r === "gap" || s.startsWith("gap-"))) return "erp-or-gap";
  if (g === "design") return "design";
  if (g) return g;
  return "";
}
function yesNo(v) {
  const t = lower(v);
  if (!t) return false;
  return ["x", "yes", "y", "true"].includes(t);
}
function main() {
  const root = path.join(__dirname, "..");
  const outPath = path.join(root, "data", "abivax", "cfti_control_register.json");
  const reportPath = path.join(root, "temp", "cfti-control-register-report.json");
  const folder = latestCftiAttachmentFolder(root);
  if (!folder) {
    const payload = { generatedAt: new Date().toISOString(), status: "no-source", summary: { recordCount: 0 }, records: [] };
    writeJson(outPath, payload);
    writeJson(reportPath, payload);
    console.log(reportPath);
    return;
  }

  const trackerFile = pickFile(folder.full, /project plan/i);
  const p2pFile = pickFile(folder.full, /ptp/i);
  const fscpFile = pickFile(folder.full, /fscp/i);
  const trackerSheets = trackerFile ? parseWorkbook(path.join(folder.full, trackerFile)) : {};
  const p2pSheets = p2pFile ? parseWorkbook(path.join(folder.full, p2pFile)) : {};
  const fscpSheets = fscpFile ? parseWorkbook(path.join(folder.full, fscpFile)) : {};
  const trackerRows = (trackerSheets["02. Micro View"]?.records || []).filter((r) => norm(r["Control ID"]));
  const p2pRows = ((p2pSheets["RCM_Procurement to Pay FINAL"] || p2pSheets["RCM_Procurement to Pay FINA (2)"] || {}).records || []).filter((r) => norm(r["Control ID"]));
  const fscpRows = ((fscpSheets["FSCP RCM_FINAL"] || fscpSheets["FSCP RCM_FINAL (2)"] || {}).records || []).filter((r) => norm(r["Control ID"]));

  const trackerById = new Map();
  for (const r of trackerRows) trackerById.set(norm(r["Control ID"]), r);
  const rcmById = new Map();
  for (const r of p2pRows) rcmById.set(norm(r["Control ID"]), { ...r, _domain: "p2p" });
  for (const r of fscpRows) rcmById.set(norm(r["Control ID"]), { ...r, _domain: "fscp" });

  const ids = new Set([...trackerById.keys(), ...rcmById.keys()]);
  const records = [];
  for (const id of ids) {
    const t = trackerById.get(id) || {};
    const r = rcmById.get(id) || {};
    const domainHint = r._domain || "";
    const trackerProcess = norm(t["Process"]);
    const trackerGap = norm(t["GAP"]);
    const trackerStatus = norm(t["Overall Status"]);
    const remediation = norm(r["Control Gap Remediation Plan"]);
    const controlSummary = norm(r["Control Summary"] || t["Control Description"]);
    const controlId = id;
    const primaryPillar = inferPrimaryPillar(controlId, trackerProcess, domainHint);
    const gapType = classifyGapType(trackerGap, remediation, controlSummary, controlId);
    records.push({
      id: `cfti-${controlId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      controlId,
      primaryPillar,
      sourceDomains: [trackerById.has(id) ? "tracker" : null, rcmById.has(id) ? `${domainHint}-rcm` : null].filter(Boolean),
      process: trackerProcess,
      subProcess: norm(t["Sub-process"] || r["Sub-process"]),
      controlTitle: norm(t["Control Title"] || r["Control Title"]),
      controlSummary,
      risk: norm(r["Risk"]),
      frequency: norm(r["Frequency"] || t["Frequency"]),
      system: norm(r["System"]),
      automationType: norm(r["Automated/Manual / IT-Dependent Manual"] || r["Automated/Manual"]),
      preventativeDetective: norm(r["Preventative/Detective"]),
      preparer: norm(r["Title of Preparer"] || t["Preparer"]),
      reviewer: norm(r["Reviewer"] || t["Reviewer"]),
      keyNonKey: norm(r["Key/Non-Key"] || t["Key / Non-Key"]),
      trackerGap,
      trackerOutOfScope: yesNo(t["OUT OF SCOPE"]),
      trackerOutOfScopeRationale: norm(t["OUT OF SCOPE RATIONALE"]),
      trackerStatus,
      expectedValidationDate: norm(t["Expected Validation Date"]),
      effectiveValidationDate: norm(t["Effective Validation Date"]),
      remediationPlan: remediation,
      erpSignal: trackerGap === "ERP" || /erp/.test(lower(remediation)) || /erp/.test(lower(controlSummary)),
      gapType,
    });
  }

  const by = (arr, field) => {
    const m = new Map();
    for (const r of arr) {
      const k = norm(r[field]);
      if (!k) continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }));
  };
  const summary = {
    recordCount: records.length,
    trackerLinkedCount: records.filter((r) => r.sourceDomains.includes("tracker")).length,
    rcmLinkedCount: records.filter((r) => r.sourceDomains.some((d) => d.endsWith("-rcm"))).length,
    byPrimaryPillar: by(records, "primaryPillar"),
    byTrackerGap: by(records, "trackerGap"),
    byTrackerStatus: by(records, "trackerStatus"),
    erpSignalCount: records.filter((r) => r.erpSignal).length,
    outOfScopeCount: records.filter((r) => r.trackerOutOfScope).length,
    topSystems: by(records, "system").slice(0, 12),
    topAutomationTypes: by(records, "automationType").slice(0, 8),
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    status: "ok",
    sourceFolder: folder.full,
    summary,
    samples: {
      p2pErpSignals: records.filter((r) => r.primaryPillar === "p2p" && r.erpSignal).slice(0, 8),
      reportingGapSignals: records.filter((r) => r.primaryPillar === "reporting-data" && (r.gapType || r.erpSignal)).slice(0, 8),
    },
    records: records.sort((a, b) => a.controlId.localeCompare(b.controlId)),
  };

  writeJson(outPath, payload);
  writeJson(reportPath, {
    generatedAt: payload.generatedAt,
    status: payload.status,
    recordCount: summary.recordCount,
    erpSignalCount: summary.erpSignalCount,
    outOfScopeCount: summary.outOfScopeCount,
    byPrimaryPillar: summary.byPrimaryPillar,
    byTrackerGap: summary.byTrackerGap.slice(0, 8),
    byTrackerStatus: summary.byTrackerStatus.slice(0, 8),
  });
  console.log(reportPath);
}

main();

