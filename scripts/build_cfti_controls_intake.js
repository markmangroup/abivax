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
  let score = 0;
  if (t.includes("control id")) score += 5;
  if (t.includes("control title")) score += 4;
  if (t.includes("control description") || t.includes("control summary")) score += 4;
  if (t.includes("sub-process") || t.includes("sub process")) score += 3;
  if (t.includes("overall status")) score += 3;
  if (t.includes("remediation")) score += 2;
  if (t.includes("validation date")) score += 2;
  if (t.includes("process")) score += 1;
  return score;
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
    const score = rowScore(rows[i] || []);
    if (score > best) {
      best = score;
      headerRowIndex = i;
    }
  }
  if (headerRowIndex < 0) {
    return { headerRowIndex: -1, headers: [], records: [], preview: rows.slice(0, 5) };
  }
  const headers = makeUniqueHeaders(rows[headerRowIndex]);
  const records = [];
  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    if (!row.some((c) => norm(c))) continue;
    const rec = {};
    headers.forEach((h, j) => {
      if (norm(row[j])) rec[h] = norm(row[j]);
    });
    if (Object.keys(rec).length === 0) continue;
    records.push(rec);
  }
  return { headerRowIndex, headers, records, preview: rows.slice(0, 6) };
}

function latestCftiAttachmentFolder(root) {
  const base = path.join(root, "temp", "recent-email-attachments");
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const full = path.join(base, d.name);
      return { name: d.name, full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return (
    dirs.find((d) => /sox_findings_and_reporting_process_documentation/i.test(d.name)) ||
    dirs.find((d) => /scope_alignment/i.test(d.name)) ||
    dirs[0] ||
    null
  );
}

function countBy(records, field) {
  const out = {};
  for (const r of records) {
    const v = norm(r[field] || "");
    if (!v) continue;
    out[v] = (out[v] || 0) + 1;
  }
  return Object.entries(out)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }));
}

function topN(list, n = 8) {
  return list.slice(0, n);
}

function pickWorkbook(files, pattern) {
  return files.find((f) => pattern.test(path.basename(f)));
}

function loadWorkbook(filePath) {
  const wb = xlsx.readFile(filePath, { raw: false, cellDates: false });
  const sheets = {};
  for (const sheetName of wb.SheetNames) {
    sheets[sheetName] = sheetToRecords(wb.Sheets[sheetName]);
  }
  return { filePath, fileName: path.basename(filePath), sheets };
}

function summarizeTrackerMicro(records) {
  const filtered = records.filter((r) => lower(r["Control ID"] || r["Control Id"]).length > 0);
  return {
    rowCount: filtered.length,
    byProcess: topN(countBy(filtered, "Process"), 12),
    byGap: topN(countBy(filtered, "GAP"), 12),
    byStatus: topN(countBy(filtered, "Overall Status"), 12),
    sampleRows: filtered.slice(0, 5).map((r) => ({
      process: r["Process"] || "",
      subProcess: r["Sub-process"] || "",
      controlId: r["Control ID"] || "",
      controlTitle: r["Control Title"] || "",
      gap: r["GAP"] || "",
      overallStatus: r["Overall Status"] || "",
      expectedValidationDate: r["Expected Validation Date"] || "",
    })),
  };
}

function summarizeRcm(records, kind) {
  const controlRows = records.filter((r) => lower(r["Control ID"]).length > 0 && !/remediation effort/i.test(lower(r["Control ID"])));
  const gapRows = controlRows.filter((r) => {
    const cid = lower(r["Control ID"]);
    const summary = lower(r["Control Summary"] || "");
    const remediation = lower(r["Control Gap Remediation Plan"] || "");
    return cid.endsWith("g") || summary.startsWith("gap-") || remediation === "gap" || remediation.includes("to be implemented");
  });
  const erpMentionRows = controlRows.filter((r) => /erp/.test(lower(r["Control Gap Remediation Plan"] || "")) || /erp/.test(lower(r["Control Summary"] || "")));
  return {
    kind,
    rowCount: controlRows.length,
    gapControlCount: gapRows.length,
    erpMentionControlCount: erpMentionRows.length,
    bySubProcess: topN(countBy(controlRows, "Sub-process"), 10),
    bySystem: topN(countBy(controlRows, "System"), 10),
    byAutomationType: topN(
      countBy(controlRows, "Automated/Manual / IT-Dependent Manual").concat(countBy(controlRows, "Automated/Manual")),
      10
    ),
    byFrequency: topN(countBy(controlRows, "Frequency"), 10),
    sampleGapControls: gapRows.slice(0, 5).map((r) => ({
      controlId: r["Control ID"] || "",
      subProcess: r["Sub-process"] || "",
      controlTitle: r["Control Title"] || "",
      system: r["System"] || "",
      automationType: r["Automated/Manual / IT-Dependent Manual"] || r["Automated/Manual"] || "",
      remediationPlan: norm(r["Control Gap Remediation Plan"] || "").slice(0, 400),
    })),
  };
}

function main() {
  const root = path.join(__dirname, "..");
  const outPath = path.join(root, "data", "abivax", "cfti_controls_intake.json");
  const tempReport = path.join(root, "temp", "cfti-controls-intake-report.json");
  const folder = latestCftiAttachmentFolder(root);

  if (!folder) {
    const payload = {
      generatedAt: new Date().toISOString(),
      status: "no-source-folder",
      sourceFolder: null,
      summary: { workbookCount: 0 },
      tracker: null,
      p2pRcm: null,
      fscpRcm: null,
    };
    writeJson(outPath, payload);
    writeJson(tempReport, payload);
    console.log(tempReport);
    return;
  }

  const xlsxFiles = fs
    .readdirSync(folder.full)
    .filter((f) => /\.xlsx$/i.test(f))
    .map((f) => path.join(folder.full, f));

  const trackerFile = pickWorkbook(xlsxFiles, /project plan/i);
  const p2pFile = pickWorkbook(xlsxFiles, /ptp/i);
  const fscpFile = pickWorkbook(xlsxFiles, /fscp/i);

  const tracker = trackerFile ? loadWorkbook(trackerFile) : null;
  const p2p = p2pFile ? loadWorkbook(p2pFile) : null;
  const fscp = fscpFile ? loadWorkbook(fscpFile) : null;

  const trackerMicroSheet = tracker ? tracker.sheets["02. Micro View"] || null : null;
  const p2pSheet = p2p ? p2p.sheets["RCM_Procurement to Pay FINAL"] || p2p.sheets["RCM_Procurement to Pay FINA (2)"] || null : null;
  const fscpSheet = fscp ? fscp.sheets["FSCP RCM_FINAL"] || fscp.sheets["FSCP RCM_FINAL (2)"] || null : null;

  const payload = {
    generatedAt: new Date().toISOString(),
    status: "ok",
    sourceFolder: folder.full,
    summary: {
      workbookCount: xlsxFiles.length,
      hasTracker: !!trackerMicroSheet,
      hasP2pRcm: !!p2pSheet,
      hasFscpRcm: !!fscpSheet,
    },
    tracker: trackerMicroSheet
      ? {
          fileName: tracker.fileName,
          sheetName: "02. Micro View",
          headerRowIndex: trackerMicroSheet.headerRowIndex,
          headers: trackerMicroSheet.headers,
          summary: summarizeTrackerMicro(trackerMicroSheet.records),
        }
      : null,
    p2pRcm: p2pSheet
      ? {
          fileName: p2p.fileName,
          sheetName: p2pSheet === p2p.sheets["RCM_Procurement to Pay FINAL"] ? "RCM_Procurement to Pay FINAL" : "RCM_Procurement to Pay FINA (2)",
          headerRowIndex: p2pSheet.headerRowIndex,
          headers: p2pSheet.headers,
          summary: summarizeRcm(p2pSheet.records, "p2p"),
        }
      : null,
    fscpRcm: fscpSheet
      ? {
          fileName: fscp.fileName,
          sheetName: fscpSheet === fscp.sheets["FSCP RCM_FINAL"] ? "FSCP RCM_FINAL" : "FSCP RCM_FINAL (2)",
          headerRowIndex: fscpSheet.headerRowIndex,
          headers: fscpSheet.headers,
          summary: summarizeRcm(fscpSheet.records, "fscp"),
        }
      : null,
  };

  writeJson(outPath, payload);
  writeJson(tempReport, {
    generatedAt: payload.generatedAt,
    status: payload.status,
    sourceFolder: payload.sourceFolder,
    trackerRows: payload.tracker?.summary?.rowCount || 0,
    p2pControls: payload.p2pRcm?.summary?.rowCount || 0,
    p2pGapControls: payload.p2pRcm?.summary?.gapControlCount || 0,
    fscpControls: payload.fscpRcm?.summary?.rowCount || 0,
    fscpGapControls: payload.fscpRcm?.summary?.gapControlCount || 0,
  });
  console.log(tempReport);
}

main();
