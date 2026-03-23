const fs = require("fs");
const path = require("path");

function loadJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function listFilesRecursive(rootDir) {
  const results = [];
  if (!fileExists(rootDir)) return results;
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function parseIso(value) {
  const t = Date.parse(value || "");
  return Number.isNaN(t) ? null : new Date(t);
}

function toIso(value) {
  const dt = value instanceof Date ? value : parseIso(value);
  return dt ? dt.toISOString() : null;
}

function cleanSubject(subject) {
  return String(subject || "")
    .replace(/^(re|fw|fwd)\s*:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function splitRecipients(raw) {
  return String(raw || "")
    .split(";")
    .map((item) => item.replace(/^'+|'+$/g, "").trim())
    .filter(Boolean);
}

function inferOrg(email, name, subject) {
  const senderEmail = String(email || "").toLowerCase();
  const senderName = String(name || "").toLowerCase();
  const subj = String(subject || "").toLowerCase();
  if (senderEmail.includes("@cfgi.com")) return "CFGI";
  if (senderEmail.includes("@kpmg.")) return "KPMG";
  if (senderEmail.includes("@abivax.com") || senderEmail.includes("/o=exchangelabs/")) return "Abivax";
  if (senderEmail.includes("@oracle.com")) return "Oracle/NetSuite";
  if (senderEmail.includes("@efeso.com")) return "Reference / EFESO";
  if (subj.includes("netsuite")) return "Oracle/NetSuite";
  if (senderName.includes("lucca")) return "Lucca";
  return "Other";
}

function isMeaningfulAttachment(name) {
  const value = String(name || "").trim();
  if (!value) return false;
  const lower = value.toLowerCase();
  if (lower === "image001.png") return false;
  if (lower.startsWith("image00")) return false;
  if (lower.startsWith("img-")) return false;
  if (lower.startsWith("outlook-photo")) return false;
  if (lower.startsWith("outlook-une image")) return false;
  if (lower.startsWith("._")) return false;
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif")) return false;
  if (lower === "__macosx") return false;
  return true;
}

function makeThreadStatus(latestInbound, latestOutbound) {
  if (latestInbound && latestOutbound) {
    if (parseIso(latestInbound.date) > parseIso(latestOutbound.date)) return "waiting_on_mike";
    if (parseIso(latestOutbound.date) > parseIso(latestInbound.date)) return "waiting_on_external";
  }
  if (latestInbound && !latestOutbound) return "inbound_only";
  if (!latestInbound && latestOutbound) return "outbound_only";
  return "unknown";
}

function relativePosix(root, fullPath) {
  return path.relative(root, fullPath).split(path.sep).join("/");
}

function buildArchiveIndex(root) {
  const vendorRoot = path.join(root, "data", "abivax", "vendor-assets");
  const files = listFilesRecursive(vendorRoot);
  const byBaseName = new Map();
  for (const file of files) {
    const baseName = path.basename(file);
    if (!isMeaningfulAttachment(baseName)) continue;
    if (!byBaseName.has(baseName)) byBaseName.set(baseName, []);
    byBaseName.get(baseName).push(relativePosix(root, file));
  }
  return byBaseName;
}

function summarizeRecentPackage(items, orgName) {
  const matches = items
    .filter((item) => item.organization === orgName && item.recentAttachments.length > 0)
    .sort((a, b) => String(b.latestInbound?.date || "").localeCompare(String(a.latestInbound?.date || "")));
  const top = matches[0];
  if (!top) return null;
  return {
    threadKey: top.threadKey,
    subject: top.subject,
    latestInboundAt: top.latestInbound?.date || null,
    latestOutboundAt: top.latestOutbound?.date || null,
    waitingStatus: top.waitingStatus,
    recentAttachments: top.recentAttachments.slice(0, 12),
  };
}

function main() {
  const root = process.cwd();
  const tempEmailsPath = path.join(root, "temp", "recent-emails.json");
  const tempSentPath = path.join(root, "temp", "recent-sent-emails.json");
  const attachmentRoot = path.join(root, "temp", "recent-email-attachments");
  const ingestStatePath = path.join(root, "data", "abivax", "email_ingest_state.json");
  const ingestIndexPath = path.join(root, "data", "abivax", "emails_staging", "ingest_index.json");
  const documentRegistryPath = path.join(root, "data", "abivax", "document_registry.json");
  const currentContextPath = path.join(root, "data", "abivax", "current_context.json");
  const intakeQueuePath = path.join(root, "data", "abivax", "document_intake_queue.json");
  const threadRegistryPath = path.join(root, "data", "abivax", "thread_registry.json");

  const recentInbox = loadJson(tempEmailsPath, { emails: [] });
  const recentSent = loadJson(tempSentPath, { emails: [] });
  const ingestState = loadJson(ingestStatePath, {});
  const ingestIndex = loadJson(ingestIndexPath, {});
  const documentRegistry = loadJson(documentRegistryPath, { documents: [] });
  const archiveIndex = buildArchiveIndex(root);

  const inboxEvents = (recentInbox.emails || []).map((email) => ({
    direction: "inbound",
    date: toIso(email.received),
    subject: String(email.subject || ""),
    threadKey: normalizeKey(cleanSubject(email.subject)),
    fromName: String(email.senderName || ""),
    fromEmail: String(email.senderEmail || ""),
    to: splitRecipients(email.to),
    cc: splitRecipients(email.cc),
    organization: inferOrg(email.senderEmail, email.senderName, email.subject),
    attachments: (email.attachments || []).filter(isMeaningfulAttachment),
    hasAttachments: Boolean(email.hasAttachments),
  }));

  const sentEvents = (recentSent.emails || []).map((email) => ({
    direction: "outbound",
    date: toIso(email.sent),
    subject: String(email.subject || ""),
    threadKey: normalizeKey(cleanSubject(email.subject)),
    fromName: String(email.senderName || "Michael Markman"),
    fromEmail: String(email.senderEmail || ""),
    to: splitRecipients(email.to),
    cc: splitRecipients(email.cc),
    organization: inferOrg("", "", email.subject),
    attachments: (email.attachments || []).filter(isMeaningfulAttachment),
    hasAttachments: Boolean(email.hasAttachments),
  }));

  const allEvents = [...inboxEvents, ...sentEvents].filter((event) => event.date && event.threadKey);

  const threadMap = new Map();
  for (const event of allEvents) {
    if (!threadMap.has(event.threadKey)) {
      threadMap.set(event.threadKey, {
        threadKey: event.threadKey,
        subject: cleanSubject(event.subject),
        organization: event.organization,
        participants: new Set(),
        recentAttachments: new Set(),
        inboundCount: 0,
        outboundCount: 0,
        latestInbound: null,
        latestOutbound: null,
      });
    }

    const thread = threadMap.get(event.threadKey);
    event.to.forEach((name) => thread.participants.add(name));
    event.cc.forEach((name) => thread.participants.add(name));
    if (event.fromName) thread.participants.add(event.fromName);
    event.attachments.forEach((name) => thread.recentAttachments.add(name));
    if (event.organization !== "Other" || thread.organization === "Other") thread.organization = event.organization;

    if (event.direction === "inbound") {
      thread.inboundCount += 1;
      if (!thread.latestInbound || parseIso(event.date) > parseIso(thread.latestInbound.date)) {
        thread.latestInbound = {
          date: event.date,
          fromName: event.fromName,
          fromEmail: event.fromEmail,
          attachments: event.attachments,
          subject: event.subject,
        };
      }
    } else {
      thread.outboundCount += 1;
      if (!thread.latestOutbound || parseIso(event.date) > parseIso(thread.latestOutbound.date)) {
        thread.latestOutbound = {
          date: event.date,
          to: event.to,
          cc: event.cc,
          attachments: event.attachments,
          subject: event.subject,
        };
      }
    }
  }

  const registryDocs = Array.isArray(documentRegistry.documents) ? documentRegistry.documents : [];
  const registryBySubject = new Map();
  for (const doc of registryDocs) {
    const key = normalizeKey(cleanSubject(doc.sourceEmailSubject || ""));
    if (!key) continue;
    if (!registryBySubject.has(key)) registryBySubject.set(key, []);
    registryBySubject.get(key).push(doc);
  }

  const threads = [...threadMap.values()]
    .map((thread) => {
      const canonicalDocs = registryBySubject.get(thread.threadKey) || [];
      return {
        threadKey: thread.threadKey,
        subject: thread.subject,
        organization: thread.organization,
        waitingStatus: makeThreadStatus(thread.latestInbound, thread.latestOutbound),
        inboundCount: thread.inboundCount,
        outboundCount: thread.outboundCount,
        latestInbound: thread.latestInbound,
        latestOutbound: thread.latestOutbound,
        participants: [...thread.participants].sort(),
        recentAttachments: [...thread.recentAttachments].sort(),
        canonicalDocuments: canonicalDocs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          status: doc.status,
          sourcePath: doc.sourcePath,
        })),
      };
    })
    .sort((a, b) => String(b.latestInbound?.date || b.latestOutbound?.date || "").localeCompare(String(a.latestInbound?.date || a.latestOutbound?.date || "")));

  const attachmentFolders = fileExists(attachmentRoot)
    ? fs
        .readdirSync(attachmentRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(attachmentRoot, entry.name))
    : [];

  const intakeItems = attachmentFolders
    .map((folderPath) => {
      const filePaths = listFilesRecursive(folderPath);
      const fileNames = filePaths.map((filePath) => path.basename(filePath)).filter(isMeaningfulAttachment);
      if (!fileNames.length) return null;

      const emailMatch = inboxEvents.find((event) => {
        if (!event.attachments.length) return false;
        return event.attachments.every((name) => fileNames.includes(name)) || fileNames.every((name) => event.attachments.includes(name));
      });

      const archiveMatches = fileNames.flatMap((name) => (archiveIndex.has(name) ? archiveIndex.get(name) : []));
      const promotedCount = fileNames.filter((name) => archiveIndex.has(name)).length;
      const registryMatches = registryDocs.filter((doc) => fileNames.some((name) => String(doc.sourcePath || "").includes(name)));

      return {
        id: normalizeKey(path.basename(folderPath)).replace(/[^a-z0-9]+/g, "-"),
        sourceFolder: relativePosix(root, folderPath),
        sourceEmail: emailMatch
          ? {
              date: emailMatch.date,
              subject: emailMatch.subject,
              fromName: emailMatch.fromName,
              fromEmail: emailMatch.fromEmail,
              organization: emailMatch.organization,
            }
          : null,
        attachmentNames: fileNames,
        archivedPaths: [...new Set(archiveMatches)].sort(),
        registryDocumentIds: registryMatches.map((doc) => doc.id),
        status:
          promotedCount === 0
            ? "staged_only"
            : promotedCount === fileNames.length
              ? "archived"
              : "partially_archived",
        needsPromotion: promotedCount !== fileNames.length,
        notes:
          promotedCount === fileNames.length
            ? "All meaningful attachments from this staged package appear to be archived under data/abivax/vendor-assets."
            : "Some or all attachments from this staged package are still only present in temp/recent-email-attachments.",
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.sourceEmail?.date || "").localeCompare(String(a.sourceEmail?.date || "")));

  const eventDates = allEvents.map((event) => parseIso(event.date)).filter(Boolean).sort((a, b) => a - b);
  const recentEmailsStat = fileExists(tempEmailsPath) ? fs.statSync(tempEmailsPath) : null;
  const recentSentStat = fileExists(tempSentPath) ? fs.statSync(tempSentPath) : null;

  const currentContext = {
    generatedAt: new Date().toISOString(),
    purpose: "Current machine-readable operating context across Outlook-derived inputs, staged document packages, and canonical repo promotion state.",
    sourceSystems: {
      outlookInboxLocalScan: {
        sourcePath: "temp/recent-emails.json",
        exists: fileExists(tempEmailsPath),
        fileModifiedAt: recentEmailsStat ? recentEmailsStat.mtime.toISOString() : null,
        earliestEmailAt: eventDates[0] ? eventDates[0].toISOString() : null,
        latestEmailAt: eventDates[eventDates.length - 1] ? eventDates[eventDates.length - 1].toISOString() : null,
        emailCount: inboxEvents.length,
      },
      outlookSentLocalScan: {
        sourcePath: "temp/recent-sent-emails.json",
        exists: fileExists(tempSentPath),
        fileModifiedAt: recentSentStat ? recentSentStat.mtime.toISOString() : null,
        emailCount: sentEvents.length,
      },
      stagedEmailIngest: {
        sourcePath: "data/abivax/emails_staging/ingest_index.json",
        lastRunAt: ingestIndex.lastRunAt || null,
        windowStart: ingestIndex.windowStart || null,
        windowEnd: ingestIndex.windowEnd || null,
        totalEmails: ingestIndex.totalEmails || 0,
      },
      stagedEmailWatermark: {
        sourcePath: "data/abivax/email_ingest_state.json",
        lastPulledAt: ingestState.lastPulledAt || null,
        lastRunFile: ingestState.lastRunFile || null,
      },
      stagedAttachmentFolders: {
        sourcePath: "temp/recent-email-attachments",
        folderCount: attachmentFolders.length,
        queueItemCount: intakeItems.length,
        stagedOnlyCount: intakeItems.filter((item) => item.status === "staged_only").length,
      },
      canonicalRegistry: {
        sourcePath: "data/abivax/document_registry.json",
        documentCount: registryDocs.length,
      },
    },
    activeContextWindow: {
      inboxEarliestAt: eventDates[0] ? eventDates[0].toISOString() : null,
      inboxLatestAt: eventDates[eventDates.length - 1] ? eventDates[eventDates.length - 1].toISOString() : null,
      note: "Use this window as the explicit freshness boundary for sessions relying on local Outlook exports.",
    },
    workQueues: {
      unpromotedDocumentPackages: intakeItems.filter((item) => item.needsPromotion).length,
      activeThreads: threads.length,
      waitingOnMikeThreads: threads.filter((thread) => thread.waitingStatus === "waiting_on_mike").length,
      waitingOnExternalThreads: threads.filter((thread) => thread.waitingStatus === "waiting_on_external").length,
    },
    latestPackagesByOrganization: {
      netSuite: summarizeRecentPackage(threads, "Oracle/NetSuite"),
      cfgi: summarizeRecentPackage(threads, "CFGI"),
      kpmg: summarizeRecentPackage(threads, "KPMG"),
      abivaxInternal: summarizeRecentPackage(threads, "Abivax"),
    },
    outputFiles: {
      currentContext: "data/abivax/current_context.json",
      documentIntakeQueue: "data/abivax/document_intake_queue.json",
      threadRegistry: "data/abivax/thread_registry.json",
    },
  };

  saveJson(intakeQueuePath, {
    generatedAt: currentContext.generatedAt,
    purpose: "Tracks staged email/desktop attachment packages and whether they have been promoted into durable repo storage and canonical summary layers.",
    items: intakeItems,
  });

  saveJson(threadRegistryPath, {
    generatedAt: currentContext.generatedAt,
    purpose: "Tracks recent email threads across inbox and sent exports so sessions know what context window they are operating on and who is waiting on whom.",
    threads,
  });

  saveJson(currentContextPath, currentContext);

  console.log(currentContextPath);
  console.log(threadRegistryPath);
  console.log(intakeQueuePath);
}

main();
