/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const pdfParseMod = require("pdf-parse");
const pdfParse =
  typeof pdfParseMod === "function"
    ? pdfParseMod
    : typeof pdfParseMod?.default === "function"
      ? pdfParseMod.default
      : typeof pdfParseMod?.pdfParse === "function"
        ? pdfParseMod.pdfParse
        : null;

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

async function parsePdf(filePath) {
  if (!pdfParse) {
    throw new Error("pdf-parse loader unavailable");
  }
  const buf = fs.readFileSync(filePath);
  const parsed = await pdfParse(buf);
  const text = normalizeText(parsed.text || "");
  return {
    parser: "pdf-parse",
    parsedText: text.slice(0, 1200),
    textChars: text.length,
    textStatus: text ? "ok" : "empty",
    extra: {
      pages: parsed.numpages || null,
      infoTitle: parsed.info?.Title || "",
      infoAuthor: parsed.info?.Author || "",
    },
  };
}

function stripXmlText(xml) {
  return normalizeText(String(xml || "").replace(/<a:br\s*\/>/g, " ").replace(/<\/a:p>/g, " "));
}

function parsePptx(filePath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "abivax-pptx-"));
  try {
    execFileSync("powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${filePath.replace(/'/g, "''")}', '${tempRoot.replace(/'/g, "''")}')`,
    ], { stdio: "ignore" });

    const slidesDir = path.join(tempRoot, "ppt", "slides");
    let slideFiles = [];
    if (fs.existsSync(slidesDir)) {
      slideFiles = fs
        .readdirSync(slidesDir)
        .filter((f) => /^slide\d+\.xml$/i.test(f))
        .sort((a, b) => {
          const na = Number((a.match(/\d+/) || [0])[0]);
          const nb = Number((b.match(/\d+/) || [0])[0]);
          return na - nb;
        });
    }
    const snippets = [];
    let totalChars = 0;
    for (const file of slideFiles.slice(0, 5)) {
      const xml = fs.readFileSync(path.join(slidesDir, file), "utf8");
      const text = stripXmlText(xml);
      if (!text) continue;
      totalChars += text.length;
      snippets.push(text.slice(0, 300));
    }
    const parsedText = snippets.join(" || ").slice(0, 1200);
    return {
      parser: "pptx-xml",
      parsedText,
      textChars: totalChars,
      textStatus: parsedText ? "ok" : "empty",
      extra: { slideCount: slideFiles.length || null },
    };
  } finally {
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    } catch {}
  }
}

function metadataOnly(filePath, ext) {
  return {
    parser: `metadata-only:${ext}`,
    parsedText: "",
    textChars: 0,
    textStatus: "not-parsed",
    extra: {},
  };
}

async function parseLocalFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return await parsePdf(filePath);
  if (ext === ".pptx") return parsePptx(filePath);
  if (ext === ".xlsx" || ext === ".xlsb" || ext === ".docx") return metadataOnly(filePath, ext.slice(1));
  return metadataOnly(filePath, ext.replace(/^\./, "") || "unknown");
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const tempDir = path.join(root, "temp");
  fs.mkdirSync(tempDir, { recursive: true });

  const artifactsData = readJson(path.join(dataDir, "sharepoint_artifacts.json"), { artifacts: [] });
  const artifacts = Array.isArray(artifactsData.artifacts) ? artifactsData.artifacts : [];
  const outPath = path.join(dataDir, "sharepoint_artifact_content.json");
  const reportPath = path.join(tempDir, "sharepoint-content-report.json");

  const items = [];
  let parseFailures = 0;
  let parsedTextCount = 0;
  let localCount = 0;

  for (const a of artifacts) {
    const localPaths = Array.isArray(a.localPaths) ? a.localPaths : [];
    if (!localPaths.length) continue;
    localCount += 1;

    const candidates = localPaths
      .map((p) => ({ relPath: p, absPath: path.join(root, p), exists: fs.existsSync(path.join(root, p)) }))
      .filter((p) => p.exists);

    const fileEntries = [];
    for (const c of candidates) {
      try {
        const st = fs.statSync(c.absPath);
        let parse = null;
        let parseError = "";
        try {
          parse = await parseLocalFile(c.absPath);
          if (parse?.textStatus === "ok" && parse?.parsedText) parsedTextCount += 1;
        } catch (err) {
          parseFailures += 1;
          parseError = err?.message || String(err);
          parse = {
            parser: "failed",
            parsedText: "",
            textChars: 0,
            textStatus: "error",
            extra: {},
          };
        }

        fileEntries.push({
          relPath: c.relPath,
          fileName: path.basename(c.absPath),
          extension: path.extname(c.absPath).replace(/^\./, "").toLowerCase(),
          sizeBytes: st.size,
          modifiedAt: st.mtime.toISOString(),
          parser: parse.parser,
          textStatus: parse.textStatus,
          textChars: parse.textChars,
          parsedTextPreview: parse.parsedText,
          parseError,
          extra: parse.extra || {},
        });
      } catch (err) {
        parseFailures += 1;
        fileEntries.push({
          relPath: c.relPath,
          fileName: path.basename(c.absPath),
          extension: path.extname(c.absPath).replace(/^\./, "").toLowerCase(),
          sizeBytes: null,
          modifiedAt: null,
          parser: "failed",
          textStatus: "error",
          textChars: 0,
          parsedTextPreview: "",
          parseError: err?.message || String(err),
          extra: {},
        });
      }
    }

    items.push({
      artifactId: a.id,
      title: a.title || a.fileName || a.canonicalUrl,
      canonicalUrl: a.canonicalUrl,
      phase: a.phase || "",
      itemType: a.itemType || "unknown",
      status: a.status || "link-only",
      fileEntries,
      bestPreview:
        fileEntries.find((f) => f.textStatus === "ok" && f.parsedTextPreview)?.parsedTextPreview ||
        "",
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      artifactsWithLocalFiles: localCount,
      artifactsWithParsedText: items.filter((i) => i.fileEntries.some((f) => f.textStatus === "ok")).length,
      parseFailures,
    },
    items,
  };

  writeJson(outPath, payload);
  writeJson(reportPath, {
    generatedAt: payload.generatedAt,
    ...payload.summary,
    sample: items.slice(0, 8).map((i) => ({
      artifactId: i.artifactId,
      title: i.title,
      phase: i.phase,
      parsers: i.fileEntries.map((f) => f.parser),
      textStatuses: i.fileEntries.map((f) => f.textStatus),
    })),
  });

  console.log(
    `sharepoint content import: localArtifacts=${payload.summary.artifactsWithLocalFiles} parsedText=${payload.summary.artifactsWithParsedText} failures=${payload.summary.parseFailures}`
  );
}

main().catch((err) => {
  console.error(`process_sharepoint_local_content failed: ${err?.message || String(err)}`);
  process.exit(1);
});
