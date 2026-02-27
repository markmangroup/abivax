/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function saveJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalize(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(v) {
  return normalize(v).replace(/\s+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

function inferOrgFromEmail(email) {
  const e = String(email || "").toLowerCase();
  if (/@kpmg\./.test(e)) return "KPMG";
  if (/@oracle\.com$/.test(e)) return "Oracle";
  if (/@abivax\.com$/.test(e)) return "Abivax";
  return "";
}

function inferRole(org, subject) {
  const s = String(subject || "").toLowerCase();
  if (org === "KPMG") return "Consultant (exact title to confirm)";
  if (org === "Oracle" || /netsuite/.test(s)) return "Oracle/NetSuite contact (exact title to confirm)";
  return "Role to confirm";
}

function main() {
  const root = path.resolve(__dirname, "..");
  const emailsPath = path.join(root, "temp", "recent-emails.json");
  const entitiesPath = path.join(root, "data", "abivax", "entities.json");
  const reportPath = path.join(root, "outputs", "board", `email-context-${new Date().toISOString().slice(0, 10)}.md`);
  const writeEntities = process.argv.includes("--write-entities");

  const emailsData = loadJson(emailsPath) || { emails: [] };
  const entitiesData = loadJson(entitiesPath) || { entities: [] };
  const emails = Array.isArray(emailsData.emails) ? emailsData.emails : [];
  const entities = Array.isArray(entitiesData.entities) ? entitiesData.entities : [];

  const people = entities.filter((e) => e.type === "person");
  const byName = new Map();
  for (const p of people) {
    byName.set(normalize(p.name), p);
    for (const a of p.aliases || []) byName.set(normalize(a), p);
  }

  const rows = [];
  const updates = [];
  const creates = [];

  for (const email of emails) {
    const senderName = String(email.senderName || "").trim();
    const senderEmail = String(email.senderEmail || "").trim().toLowerCase();
    const subject = String(email.subject || "");
    if (!senderName || !senderEmail) continue;

    const org = inferOrgFromEmail(senderEmail);
    if (!org) continue;

    const existing = byName.get(normalize(senderName));
    const inferredRole = inferRole(org, subject);
    if (!existing) {
      creates.push({ senderName, senderEmail, org, inferredRole, subject });
      continue;
    }

    const currentOrg = String(existing.properties?.entity || "");
    if (currentOrg && currentOrg !== org) {
      updates.push({
        entityId: existing.id,
        name: existing.name,
        currentOrg,
        inferredOrg: org,
        senderEmail,
      });
    }
    rows.push({ senderName, senderEmail, subject, entityId: existing.id, org });
  }

  if (writeEntities) {
    const now = new Date().toISOString();
    for (const u of updates) {
      const e = entities.find((x) => x.id === u.entityId);
      if (!e) continue;
      e.properties = e.properties || {};
      e.properties.entity = u.inferredOrg;
      if (!e.properties.role) e.properties.role = inferRole(u.inferredOrg, "");
      e.notes = `${e.notes || ""} Observed sender domain: ${u.senderEmail}.`.trim();
      e.updatedAt = now;
    }

    for (const c of creates) {
      const id = slugify(c.senderName);
      if (!id || entities.some((e) => e.id === id)) continue;
      entities.push({
        id,
        name: c.senderName,
        type: "person",
        aliases: [],
        description: `${c.org} email participant from recent inbox context.`,
        properties: {
          role: c.inferredRole,
          entity: c.org,
          needLevel: "engage",
          focusHints: ["email context validation", "role clarification"],
        },
        links: [c.org === "KPMG" ? "kpmg" : c.org === "Oracle" ? "oracle" : "abivax"],
        notes: `Observed sender domain: ${c.senderEmail}.`,
        mentions: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    saveJson(entitiesPath, { entities });
  }

  const lines = [];
  lines.push(`# Email Context Report (${new Date().toISOString().slice(0, 10)})`);
  lines.push("");
  lines.push(`- Emails scanned: ${emails.length}`);
  lines.push(`- Mismatch updates suggested: ${updates.length}`);
  lines.push(`- New people suggested: ${creates.length}`);
  lines.push(`- Write mode: ${writeEntities ? "ON" : "OFF"}`);
  lines.push("");

  if (updates.length) {
    lines.push("## Org Mismatch Updates");
    for (const u of updates) {
      lines.push(`- ${u.name} (${u.entityId}): ${u.currentOrg} -> ${u.inferredOrg} via ${u.senderEmail}`);
    }
    lines.push("");
  }

  if (creates.length) {
    lines.push("## New Person Candidates");
    for (const c of creates) {
      lines.push(`- ${c.senderName} (${c.org}) from ${c.senderEmail} | Subject: ${c.subject}`);
    }
    lines.push("");
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n") + "\n", "utf8");
  console.log(reportPath);
  console.log(`updates=${updates.length} creates=${creates.length}`);
}

try {
  main();
} catch (err) {
  console.error(`analyze_email_context failed: ${err?.message || String(err)}`);
  process.exit(1);
}

