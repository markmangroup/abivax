/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const pdfParseMod = require("pdf-parse");

const pdfParse =
  typeof pdfParseMod === "function"
    ? pdfParseMod
    : typeof pdfParseMod?.default === "function"
      ? pdfParseMod.default
      : typeof pdfParseMod?.pdfParse === "function"
        ? pdfParseMod.pdfParse
        : null;

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function listDirs(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const full = path.join(rootDir, d.name);
      let mtimeMs = 0;
      try {
        mtimeMs = fs.statSync(full).mtimeMs;
      } catch {}
      return { name: d.name, full, mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function normalizeText(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function categoryForFile(name) {
  const n = name.toLowerCase();
  if (/approval.*po|po matrix/.test(n)) return "approval-matrix";
  if (/approval.*invoice/.test(n)) return "approval-matrix";
  if (/signature policy/.test(n)) return "signature-policy";
  if (/docushare/.test(n)) return "system-user-guide";
  if (/achat|purchase order|contract process|proc[eé]dure achat/.test(n)) return "p2p-sop";
  if (/saisie en devise|devise/.test(n)) return "currency-procedure";
  if (/supplier data/.test(n)) return "vendor-master";
  if (/moyen de paiement|virements/.test(n)) return "payment-methods";
  if (/image\d+\./.test(n)) return "inline-image";
  if (/\.xlsx$/i.test(n)) return "spreadsheet";
  if (/\.pdf$/i.test(n)) return "pdf";
  return "other";
}

function extractXlsxSheetSummary(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: false });
  const sheets = wb.SheetNames.map((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    const previewRows = rows
      .slice(0, 6)
      .map((r) => (Array.isArray(r) ? r.map((v) => String(v ?? "").trim()).filter(Boolean) : []))
      .filter((r) => r.length > 0)
      .map((r) => r.slice(0, 12));
    const headerCandidates = previewRows.map((r) => r.join(" | "));
    return {
      name: sheetName,
      approxRows: rows.length,
      previewRows,
      headerCandidates: headerCandidates.slice(0, 3),
    };
  });
  return {
    sheetCount: wb.SheetNames.length,
    sheets,
  };
}

function flattenWorkbookText(wb, maxRowsPerSheet = 250) {
  const chunks = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
    chunks.push(String(sheetName || ""));
    for (const row of rows.slice(0, maxRowsPerSheet)) {
      if (!Array.isArray(row)) continue;
      const line = row.map((v) => String(v ?? "").trim()).filter(Boolean).join(" | ");
      if (line) chunks.push(line);
    }
  }
  return normalizeText(chunks.join(" || "));
}

function deriveWorkbookSignals(filePath, fileName) {
  const wb = xlsx.readFile(filePath, { cellDates: false });
  const lowerName = fileName.toLowerCase();
  const allText = flattenWorkbookText(wb).toLowerCase();
  const sheetNames = wb.SheetNames.map((s) => String(s || ""));

  if (/moyen de paiement|virements/.test(lowerName)) {
    const manualMentions = (allText.match(/\bmanuel\b/g) || []).length;
    const trustpairMentions = (allText.match(/trustpair/g) || []).length;
    const agicapMentions = (allText.match(/agicap/g) || []).length;
    const sageMentions = (allText.match(/\bsage\b/g) || []).length;
    const ebicsMentions = (allText.match(/ebics/g) || []).length;
    const cadence10and25 = /10\s+et\s+le\s+25/.test(allText) || /10\s+and\s+25/.test(allText);
    const twoCampaignsPerMonth = /2\s+campagnes/.test(allText) || /2\s+campaign/.test(allText);
    const fourDayLeadTime = /4\s+jours/.test(allText) || /4\s+days/.test(allText);
    const preparersJulietteFatma = /juliette/.test(allText) && /fatma/.test(allText);

    const clues = [];
    if (twoCampaignsPerMonth || cadence10and25) clues.push("Vendor payment cadence appears documented as two campaigns per month (10th/25th).");
    if (preparersJulietteFatma) clues.push("Workbook references Juliette and Fatma as payment-file preparation roles.");
    if (fourDayLeadTime) clues.push("Workbook references a payment-file preparation lead time (~4 working days before value date).");
    if (trustpairMentions > 0) clues.push("Trustpair is explicitly referenced in payment process instructions/workflow points.");
    if (agicapMentions > 0) clues.push("Agicap is explicitly referenced, including a dedicated sheet and signer/validator steps.");
    if (ebicsMentions > 0) clues.push("EBICS key/signer workflow is referenced in Agicap-related payment steps.");
    if (sageMentions > 0) clues.push("Sage payment file / historical remittance handling appears documented in the workbook.");

    return {
      kind: "payment-workbook",
      sheetNames,
      manualMentions,
      trustpairMentions,
      agicapMentions,
      sageMentions,
      ebicsMentions,
      flags: {
        cadence10and25,
        twoCampaignsPerMonth,
        fourDayLeadTime,
        preparersJulietteFatma,
        agicapSheetPresent: sheetNames.some((s) => /agicap/i.test(s)),
      },
      clues,
    };
  }

  if (/supplier data base cleaning/.test(lowerName)) {
    const hasCountryField = /\bcountry\b/.test(allText);
    const hasBankField = /\bbank\b/.test(allText);
    const hasVatField = /\bvat\b/.test(allText);
    const hasSiretField = /\bsiret\b/.test(allText);
    const tabs = {
      supplierList: sheetNames.some((s) => /supplier list/i.test(s)),
      identification: sheetNames.some((s) => /identification/i.test(s)),
      banks: sheetNames.some((s) => /banks tab/i.test(s)),
      freeFields: sheetNames.some((s) => /free fields/i.test(s)),
    };
    const clues = [];
    if (tabs.supplierList && hasCountryField && hasBankField) clues.push("Vendor master workbook includes supplier list with country and bank fields.");
    if (tabs.identification) clues.push("Identification tab documents supplier setup field requirements.");
    if (tabs.banks) clues.push("Banks tab documents bank account/bank address completion expectations.");
    if (tabs.freeFields) clues.push("Free fields tab documents additional supplier metadata guidance.");
    return {
      kind: "vendor-master-workbook",
      sheetNames,
      fields: { hasCountryField, hasBankField, hasVatField, hasSiretField },
      tabs,
      clues,
    };
  }

  return null;
}

async function extractPdfSummary(filePath) {
  if (!pdfParse) {
    return { parser: "pdf-parse-unavailable", textStatus: "unavailable", pages: null, previewText: "" };
  }
  try {
    const buf = fs.readFileSync(filePath);
    const parsed = await pdfParse(buf);
    const text = normalizeText(parsed.text || "");
    return {
      parser: "pdf-parse",
      textStatus: text ? "ok" : "empty",
      pages: parsed.numpages || null,
      previewText: text.slice(0, 500),
      infoTitle: parsed.info?.Title || "",
      infoAuthor: parsed.info?.Author || "",
    };
  } catch (err) {
    return {
      parser: "pdf-parse",
      textStatus: "error",
      pages: null,
      previewText: "",
      parseError: err?.message || String(err),
    };
  }
}

function summarizeCategories(files) {
  const counts = {};
  for (const f of files) counts[f.category] = (counts[f.category] || 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([category, count]) => ({ category, count }));
}

async function main() {
  const root = path.join(__dirname, "..");
  const attachmentRoot = path.join(root, "temp", "recent-email-attachments");
  const outDataPath = path.join(root, "data", "abivax", "trinidad_p2p_bundle_intake.json");
  const outReportPath = path.join(root, "temp", "trinidad-p2p-bundle-report.json");

  const dirs = listDirs(attachmentRoot);
  const target =
    dirs.find((d) => /france_p2p_-_follow-up_for_erp_planning/i.test(d.name)) ||
    dirs.find((d) => /france p2p/i.test(d.name)) ||
    null;

  if (!target) {
    const payload = {
      generatedAt: new Date().toISOString(),
      status: "no-bundle-found",
      source: null,
      summary: { fileCount: 0, categories: [] },
      files: [],
    };
    writeJson(outDataPath, payload);
    writeJson(outReportPath, { generatedAt: payload.generatedAt, status: payload.status });
    console.log(outDataPath);
    return;
  }

  const dirEntries = fs.readdirSync(target.full, { withFileTypes: true }).filter((d) => d.isFile());
  const fileRecords = [];

  for (const entry of dirEntries) {
    const fullPath = path.join(target.full, entry.name);
    const ext = path.extname(entry.name).toLowerCase();
    const stat = fs.statSync(fullPath);
    const category = categoryForFile(entry.name);
    const rec = {
      fileName: entry.name,
      relPath: path.relative(root, fullPath).replace(/\\/g, "/"),
      ext: ext.replace(/^\./, "").toLowerCase(),
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      category,
    };

    if (ext === ".xlsx") {
      try {
        rec.xlsx = extractXlsxSheetSummary(fullPath);
        rec.derived = deriveWorkbookSignals(fullPath, entry.name);
      } catch (err) {
        rec.xlsx = { error: err?.message || String(err) };
      }
    } else if (ext === ".pdf") {
      rec.pdf = await extractPdfSummary(fullPath);
    }

    fileRecords.push(rec);
  }

  fileRecords.sort((a, b) => a.fileName.localeCompare(b.fileName));

  const payload = {
    generatedAt: new Date().toISOString(),
    status: "ok",
    source: {
      type: "outlook-email-attachment-export",
      folderName: target.name,
      folderPath: target.full,
      senderHint: "Trinidad Mesa",
      subjectHint: "France P2P - Follow-up for ERP planning",
    },
    summary: {
      fileCount: fileRecords.length,
      pdfCount: fileRecords.filter((f) => f.ext === "pdf").length,
      xlsxCount: fileRecords.filter((f) => f.ext === "xlsx").length,
      categories: summarizeCategories(fileRecords),
      categoryHighlights: {
        approvalMatrices: fileRecords.filter((f) => f.category === "approval-matrix").map((f) => f.fileName),
        proceduresAndSops: fileRecords.filter((f) => ["p2p-sop", "currency-procedure", "signature-policy"].includes(f.category)).map((f) => f.fileName),
        systemGuides: fileRecords.filter((f) => f.category === "system-user-guide").map((f) => f.fileName),
        spreadsheets: fileRecords.filter((f) => f.ext === "xlsx").map((f) => f.fileName),
      },
      derivedSignals: {
        paymentWorkbook:
          fileRecords.find((f) => f.category === "payment-methods" && f.derived?.kind === "payment-workbook")?.derived || null,
        vendorMasterWorkbook:
          fileRecords.find((f) => f.category === "vendor-master" && f.derived?.kind === "vendor-master-workbook")?.derived || null,
      },
    },
    files: fileRecords,
  };

  writeJson(outDataPath, payload);
  writeJson(outReportPath, {
    generatedAt: payload.generatedAt,
    status: payload.status,
    sourceFolder: payload.source.folderName,
    summary: payload.summary,
  });

  console.log(outDataPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
