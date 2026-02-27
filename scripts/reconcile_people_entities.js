/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonNoBom(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toNeedLevel(needThem) {
  const n = normalize(needThem);
  if (n.includes("critical") || n.includes("executive sponsor")) return "critical";
  if (n.includes("context")) return "context";
  if (n.includes("engage")) return "engage";
  return "engage";
}

function isTopExecRole(role) {
  const r = normalize(role);
  return /\bceo\b|\bcfo\b|board secretary|chief financial officer/.test(r);
}

function inferTeam(role, notes, entity) {
  const text = normalize([role, notes, entity].join(" "));
  if (/fp&a|fp a|fpa|planning/.test(text)) return "FP&A";
  if (/p2p|procure|ap\b|accounts payable/.test(text)) return "P2P";
  if (/it|cyber|infra|technical|integration/.test(text)) return "IT";
  if (/investor relations|\bir\b/.test(text)) return "Investor Relations";
  if (/accounting|consolidation|sec reporting|treasury|tax|finance/.test(text)) return "Finance";
  return "";
}

function inferReportsTo(role, notes) {
  const text = String([role, notes].join(" "));
  const m = text.match(/reports to ([A-Za-z][A-Za-z .'-]+)/i);
  if (!m) return "";
  return m[1].replace(/[).,;:]+$/, "").trim();
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const peoplePath = path.join(dataDir, "people.json");
  const entitiesPath = path.join(dataDir, "entities.json");
  const reportPath = path.join(root, "temp", "people-canonical-report.json");
  fs.mkdirSync(path.join(root, "temp"), { recursive: true });

  const peopleData = readJson(peoplePath);
  const entitiesData = readJson(entitiesPath);
  const people = Array.isArray(peopleData.people) ? peopleData.people : [];
  const entities = Array.isArray(entitiesData.entities) ? entitiesData.entities : [];

  const byId = new Map(entities.map((e) => [e.id, e]));
  let created = 0;
  let updated = 0;
  const unresolved = [];
  const overrides = {
    hema: { reportsTo: "Didier Blondel", team: "Finance" },
    trinidad: { reportsTo: "Hema Kesh", team: "Finance" },
    frederick: { reportsTo: "Hema Kesh", team: "FP&A" },
    "adrian-holbrook": { reportsTo: "Frederick", team: "FP&A" },
    "kimberly-gordon": { reportsTo: "Matt Epley", team: "P2P" },
    "matt-epley": { reportsTo: "Hema Kesh", team: "Finance" },
    jade: { reportsTo: "Christophe Hennequin", team: "IT" },
    "benjamin-talmant": { reportsTo: "Christophe Hennequin", team: "IT" },
    ewan: { reportsTo: "Christophe Hennequin", team: "IT" },
  };

  for (const p of people) {
    let entity = byId.get(p.id);
    if (!entity) {
      entity = {
        id: p.id,
        name: p.name,
        type: "person",
        aliases: [],
        description: p.notes || `${p.name} (${p.role})`,
        properties: {},
        links: ["abivax"],
        notes: p.notes || "",
        mentions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      entities.push(entity);
      byId.set(entity.id, entity);
      created += 1;
    }

    if (entity.type !== "person") continue;
    if (!entity.properties || typeof entity.properties !== "object") entity.properties = {};

    const nextRole = String(p.role || "").trim();
    const nextNeedLevel = toNeedLevel(p.needThem || "");
    const nextTeam = inferTeam(p.role || "", p.notes || "", p.entity || "");
    const nextReportsTo = inferReportsTo(p.role || "", p.notes || "");
    const nextOrg = String(p.entity || "").trim();
    const override = overrides[p.id] || {};

    const before = JSON.stringify({
      role: entity.properties.role || "",
      needLevel: entity.properties.needLevel || "",
      team: entity.properties.team || "",
      reportsTo: entity.properties.reportsTo || "",
      org: entity.properties.org || "",
    });

    if (nextRole) entity.properties.role = nextRole;
    entity.properties.needLevel = nextNeedLevel;
    if (override.team) entity.properties.team = override.team;
    else if (nextTeam) entity.properties.team = nextTeam;
    if (override.reportsTo) entity.properties.reportsTo = override.reportsTo;
    else if (nextReportsTo) entity.properties.reportsTo = nextReportsTo;
    if (nextOrg) entity.properties.org = nextOrg;
    entity.updatedAt = new Date().toISOString();

    const after = JSON.stringify({
      role: entity.properties.role || "",
      needLevel: entity.properties.needLevel || "",
      team: entity.properties.team || "",
      reportsTo: entity.properties.reportsTo || "",
      org: entity.properties.org || "",
    });
    if (before !== after) updated += 1;

    const roleForCheck = String(entity.properties.role || nextRole || "");
    const needsLineManagement = nextNeedLevel !== "context";
    const topExec = isTopExecRole(roleForCheck);
    if (needsLineManagement && !entity.properties.reportsTo) {
      if (!topExec) {
        unresolved.push({
          id: entity.id,
          name: entity.name,
          issue: "Missing reportsTo",
        });
      }
    }
    if (needsLineManagement && !entity.properties.team) {
      unresolved.push({
        id: entity.id,
        name: entity.name,
        issue: "Missing team",
      });
    }
  }

  writeJsonNoBom(entitiesPath, { entities });
  writeJsonNoBom(reportPath, {
    generatedAt: new Date().toISOString(),
    totalPeople: people.length,
    created,
    updated,
    unresolved,
  });

  console.log(`people canonical: created=${created} updated=${updated} unresolved=${unresolved.length}`);
}

try {
  main();
} catch (err) {
  console.error(`reconcile_people_entities failed: ${err?.message || String(err)}`);
  process.exit(1);
}
