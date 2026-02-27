const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function listRecentAttachmentDirs(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const full = path.join(rootDir, d.name);
      let mtime = 0;
      try {
        mtime = fs.statSync(full).mtimeMs;
      } catch {}
      return { name: d.name, full, mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function normalizeRow(row) {
  return row.map((v) => String(v ?? "").replace(/\s+/g, " ").trim());
}

function rowScore(row) {
  const joined = row.join(" | ").toLowerCase();
  let score = 0;
  if (joined.includes("control id")) score += 5;
  if (joined.includes("control title")) score += 4;
  if (joined.includes("control description") || joined.includes("control summary")) score += 4;
  if (joined.includes("sub-process") || joined.includes("sub process")) score += 3;
  if (joined.includes("overall status")) score += 3;
  if (joined.includes("expected validation date")) score += 2;
  if (joined.includes("remediation")) score += 2;
  return score;
}

function extractSheetSummary(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  const range = xlsx.utils.decode_range(ws["!ref"] || "A1:A1");
  const rowsRaw = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
  const rows = rowsRaw.map(normalizeRow);

  let headerRowIndex = -1;
  let bestScore = 0;
  for (let i = 0; i < Math.min(rows.length, 25); i += 1) {
    const score = rowScore(rows[i]);
    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }

  const headers = headerRowIndex >= 0 ? rows[headerRowIndex].filter(Boolean) : [];
  const sampleRows = [];
  if (headerRowIndex >= 0) {
    for (let i = headerRowIndex + 1; i < rows.length && sampleRows.length < 3; i += 1) {
      const row = rows[i].filter(Boolean);
      if (row.length === 0) continue;
      sampleRows.push(row.slice(0, 12));
    }
  }

  return {
    sheetName,
    approxRows: range.e.r + 1,
    approxCols: range.e.c + 1,
    headerRowIndex,
    headers,
    previewTopRows: rows.slice(0, 5).filter((r) => r.some(Boolean)).map((r) => r.slice(0, 12)),
    sampleRows,
  };
}

function main() {
  const root = path.join(__dirname, "..");
  const attachmentRoot = path.join(root, "temp", "recent-email-attachments");
  const outPath = path.join(root, "temp", "cfti-workbook-intake.json");

  const dirs = listRecentAttachmentDirs(attachmentRoot);
  const targetDir =
    dirs.find((d) => /sox_findings_and_reporting_process_documentation/i.test(d.name)) || dirs[0] || null;

  if (!targetDir) {
    writeJson(outPath, {
      generatedAt: new Date().toISOString(),
      status: "no-attachment-dir",
      files: [],
    });
    console.log(outPath);
    return;
  }

  const files = fs
    .readdirSync(targetDir.full, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.xlsx$/i.test(d.name))
    .map((d) => path.join(targetDir.full, d.name));

  const workbookSummaries = [];
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    let wb;
    try {
      wb = xlsx.readFile(filePath, { cellDates: false });
      const sheets = wb.SheetNames.map((s) => extractSheetSummary(wb, s));
      workbookSummaries.push({
        fileName,
        filePath,
        sheetCount: wb.SheetNames.length,
        sheets,
      });
    } catch (err) {
      workbookSummaries.push({
        fileName,
        filePath,
        error: String(err && err.message ? err.message : err),
        sheets: [],
      });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    status: "ok",
    source: {
      type: "outlook-email-attachment-export",
      folder: targetDir.full,
      folderName: targetDir.name,
    },
    summary: {
      workbookCount: workbookSummaries.length,
      workbookNames: workbookSummaries.map((w) => w.fileName),
    },
    workbooks: workbookSummaries,
  };

  writeJson(outPath, payload);
  console.log(outPath);
}

main();

