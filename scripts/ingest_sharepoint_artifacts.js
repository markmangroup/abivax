/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function extractSharePointUrls(text) {
  const urls = [];
  const re = /https:\/\/abivaxfr\.sharepoint\.com\/[^\s<>"')]+/gi;
  for (const m of String(text || "").matchAll(re)) {
    urls.push(m[0]);
  }
  return urls;
}

function normalizeUrl(raw) {
  let s = String(raw || "").trim();
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/\*([0-9a-fA-F]{2})/g, "%$1");
  s = s.replace(/__;.*$/g, "");
  s = s.replace(/%3E$/i, "");
  s = s.replace(/[).,;]+$/g, "");
  return s;
}

function canonicalizeSharePointUrl(raw) {
  const cleaned = normalizeUrl(raw);
  try {
    const u = new URL(cleaned);
    if (!/sharepoint\.com$/i.test(u.hostname)) return "";
    const keep = [];
    for (const key of ["d"]) {
      const v = u.searchParams.get(key);
      if (v) keep.push(`${key}=${v}`);
    }
    const search = keep.length ? `?${keep.join("&")}` : "";
    return `${u.origin}${u.pathname}${search}`;
  } catch {
    return cleaned;
  }
}

function parseArtifactMeta(url) {
  const cleaned = normalizeUrl(url);
  const meta = {
    host: "",
    site: "",
    itemType: "unknown",
    fileName: "",
    extension: "",
    folderPath: "",
    phase: "",
  };
  try {
    const u = new URL(cleaned);
    meta.host = u.host;
    const parts = u.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const siteIdx = parts.findIndex((p) => p === "sites");
    if (siteIdx >= 0 && parts[siteIdx + 1]) meta.site = parts[siteIdx + 1];
    const kindMatch = u.pathname.match(/\/:(\w):\//i);
    if (kindMatch) {
      const code = kindMatch[1].toLowerCase();
      meta.itemType =
        code === "x" ? "excel" :
        code === "b" ? "pdf-or-binary" :
        code === "p" ? "powerpoint" :
        code === "f" ? "folder" : code;
    }
    const rIdx = parts.findIndex((p) => p === "r");
    if (rIdx >= 0) {
      const trailing = parts.slice(rIdx + 1);
      const sharedDocsIdx = trailing.findIndex((p) => p === "Shared Documents");
      if (sharedDocsIdx >= 0) {
        const docPath = trailing.slice(sharedDocsIdx + 1);
        if (docPath.length) {
          const last = docPath[docPath.length - 1];
          if (/\.[a-z0-9]{2,5}$/i.test(last)) {
            meta.fileName = last;
            meta.folderPath = docPath.slice(0, -1).join(" / ");
            const extMatch = last.match(/\.([a-z0-9]{2,5})$/i);
            meta.extension = extMatch ? extMatch[1].toLowerCase() : "";
          } else {
            meta.fileName = last;
            meta.folderPath = docPath.slice(0, -1).join(" / ");
          }
          const phase = docPath.find((p) => /^Phase\s+\d+/i.test(p));
          if (phase) meta.phase = phase;
        }
      }
    }
  } catch {
    return meta;
  }
  return meta;
}

function artifactId(canonicalUrl) {
  return `sp-${crypto.createHash("sha1").update(canonicalUrl).digest("hex").slice(0, 12)}`;
}

function rel(root, abs) {
  return path.relative(root, abs).replace(/\\/g, "/");
}

function main() {
  const root = path.resolve(__dirname, "..");
  const tempDir = path.join(root, "temp");
  const dataDir = path.join(root, "data", "abivax");
  fs.mkdirSync(tempDir, { recursive: true });
  const outPath = path.join(dataDir, "sharepoint_artifacts.json");
  const reportPath = path.join(tempDir, "sharepoint-ingest-report.json");

  const targeted = readJson(path.join(tempDir, "email-review", "targeted-email-review.json"), { emails: [] });
  const targetedEmails = Array.isArray(targeted.emails) ? targeted.emails : [];
  const existingProjectUpdate = readJson(path.join(tempDir, "abivax-erp-project-update.json"), null);
  const attachmentRoot = path.join(tempDir, "email-review", "attachments");

  const attachmentFiles = walkFiles(attachmentRoot, []);
  const bodyFiles = attachmentFiles.filter((f) => path.basename(f).toLowerCase() === "body.txt");
  const localArtifacts = walkFiles(tempDir, []).filter((f) => /\.(pptx|pdf|xlsx|xlsb|docx)$/i.test(f));

  const records = new Map();
  const sourceEmailsScanned = targetedEmails.length + (existingProjectUpdate ? 1 : 0);

  function upsert(url, ctx = {}) {
    const normalizedUrl = normalizeUrl(url);
    const canonicalUrl = canonicalizeSharePointUrl(normalizedUrl);
    if (!canonicalUrl) return;
    const id = artifactId(canonicalUrl);
    const meta = parseArtifactMeta(normalizedUrl);
    const current = records.get(id) || {
      id,
      canonicalUrl,
      rawUrls: [],
      title: meta.fileName || "",
      host: meta.host,
      site: meta.site,
      itemType: meta.itemType,
      extension: meta.extension,
      fileName: meta.fileName,
      folderPath: meta.folderPath,
      phase: meta.phase,
      sourceEmails: [],
      localPaths: [],
      tags: [],
      firstSeenAt: ctx.received || null,
      lastSeenAt: ctx.received || null,
      status: "link-only",
    };

    current.rawUrls = Array.from(new Set([...current.rawUrls, normalizedUrl]));
    if (!current.title && meta.fileName) current.title = meta.fileName;
    for (const k of ["host", "site", "itemType", "extension", "fileName", "folderPath", "phase"]) {
      if (!current[k] && meta[k]) current[k] = meta[k];
    }
    if (ctx.emailSubject || ctx.senderName) {
      const sourceEmail = {
        received: ctx.received || null,
        subject: ctx.emailSubject || "",
        sender: ctx.senderName || "",
        bodyPath: ctx.bodyPath || "",
      };
      const key = JSON.stringify(sourceEmail);
      const keys = new Set(current.sourceEmails.map((x) => JSON.stringify(x)));
      if (!keys.has(key)) current.sourceEmails.push(sourceEmail);
    }
    if (ctx.tag) current.tags = Array.from(new Set([...(current.tags || []), ctx.tag]));
    if (ctx.received) {
      current.firstSeenAt = !current.firstSeenAt || ctx.received < current.firstSeenAt ? ctx.received : current.firstSeenAt;
      current.lastSeenAt = !current.lastSeenAt || ctx.received > current.lastSeenAt ? ctx.received : current.lastSeenAt;
    }
    records.set(id, current);
  }

  for (const e of targetedEmails) {
    const body = e.bodyPreview || (e.bodyFullPath ? safeRead(path.join(root, e.bodyFullPath)) : "");
    const urls = extractSharePointUrls(body);
    for (const url of urls) {
      upsert(url, {
        received: e.received || null,
        emailSubject: e.subject,
        senderName: e.senderName,
        bodyPath: e.bodyFullPath || "",
        tag: "email-review",
      });
    }
  }

  if (existingProjectUpdate) {
    const body = existingProjectUpdate.bodyFull || existingProjectUpdate.bodyPreview || "";
    const urls = [
      ...(Array.isArray(existingProjectUpdate.links) ? existingProjectUpdate.links : []),
      ...extractSharePointUrls(body),
    ];
    for (const url of urls) {
      upsert(url, {
        received: existingProjectUpdate.received || null,
        emailSubject: existingProjectUpdate.subject || "ABIVAX ERP - Project update",
        senderName: existingProjectUpdate.senderName || "Aymen Ben Alaya",
        bodyPath: "",
        tag: "kpmg-project-update",
      });
    }
  }

  for (const bodyPath of bodyFiles) {
    const body = safeRead(bodyPath);
    for (const url of extractSharePointUrls(body)) {
      upsert(url, {
        emailSubject: path.basename(path.dirname(bodyPath)),
        senderName: "",
        bodyPath: rel(root, bodyPath),
        tag: "attachment-body",
      });
    }
  }

  const byFileName = new Map();
  for (const rec of records.values()) {
    if (!rec.fileName) continue;
    byFileName.set(rec.fileName.toLowerCase(), rec.id);
  }
  let localAttachmentMatches = 0;
  for (const filePath of localArtifacts) {
    const base = path.basename(filePath).toLowerCase();
    const id = byFileName.get(base);
    if (!id) continue;
    const rec = records.get(id);
    if (!rec) continue;
    const localRel = rel(root, filePath);
    if (!rec.localPaths.includes(localRel)) {
      rec.localPaths.push(localRel);
      localAttachmentMatches += 1;
    }
    rec.status = "local-attachment-available";
  }

  const artifacts = Array.from(records.values())
    .filter((a) => /sharepoint\.com/i.test(a.canonicalUrl))
    .map((r) => ({
      ...r,
      title: r.title || r.fileName || r.canonicalUrl,
      localPaths: (r.localPaths || []).sort(),
      sourceEmails: (r.sourceEmails || []).sort((a, b) => String(b.received || "").localeCompare(String(a.received || ""))),
      rawUrls: (r.rawUrls || []).slice(0, 5),
      tags: Array.from(new Set(r.tags || [])),
    }))
    .sort((a, b) => {
      const pa = a.phase || "";
      const pb = b.phase || "";
      if (pa !== pb) return pa.localeCompare(pb);
      const ta = a.title || "";
      const tb = b.title || "";
      return ta.localeCompare(tb);
    });

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      artifactCount: artifacts.length,
      localAttachmentMatches,
      sourceEmailsScanned,
      attachmentBodiesScanned: bodyFiles.length,
    },
    artifacts,
  };

  writeJson(outPath, payload);
  writeJson(reportPath, {
    generatedAt: payload.generatedAt,
    ...payload.summary,
    topArtifacts: artifacts.slice(0, 10).map((a) => ({
      id: a.id,
      title: a.title,
      phase: a.phase,
      itemType: a.itemType,
      status: a.status,
      localPaths: a.localPaths,
    })),
  });

  console.log(
    `sharepoint ingest: artifacts=${payload.summary.artifactCount} localMatches=${payload.summary.localAttachmentMatches} sources=${payload.summary.sourceEmailsScanned}`
  );
}

try {
  main();
} catch (err) {
  console.error(`ingest_sharepoint_artifacts failed: ${err?.message || String(err)}`);
  process.exit(1);
}
