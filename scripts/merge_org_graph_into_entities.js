/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalize(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugFromName(name) {
  return normalize(name).replace(/\s+/g, "-");
}

function sourceLabel(source) {
  if (source === "outlook-gal") return "Outlook GAL";
  if (source === "microsoft-graph") return "Microsoft Graph";
  if (source === "import") return "Org Import";
  return "Org Sync";
}

function looksLikePersonRecord(user) {
  const displayName = String(user.displayName || "").trim();
  const hasSpaceInName = /\s/.test(displayName);
  const jobTitle = String(user.jobTitle || "").trim();
  const department = String(user.department || "").trim();
  const managerName = String(user.manager?.displayName || "").trim();
  const directReports = Array.isArray(user.directReports) ? user.directReports : [];
  return Boolean(
    hasSpaceInName && (jobTitle || department || managerName || directReports.length > 0)
  );
}

function indexEntityPersonMatches(entities) {
  const byKey = new Map();
  for (const e of entities) {
    if (e.type !== "person") continue;
    const keys = new Set([
      normalize(e.name),
      normalize(e.id),
      ...(Array.isArray(e.aliases) ? e.aliases.map(normalize) : []),
    ]);
    const props = e.properties || {};
    for (const k of ["email", "mail", "userPrincipalName"]) {
      if (typeof props[k] === "string") keys.add(normalize(props[k]));
    }
    for (const k of keys) {
      if (!k) continue;
      if (!byKey.has(k)) byKey.set(k, e);
    }
  }
  return byKey;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const orgPath = path.join(dataDir, "org_graph.json");
  const entitiesPath = path.join(dataDir, "entities.json");
  const reportPath = path.join(root, "temp", "org-graph-merge-report.json");
  fs.mkdirSync(path.join(root, "temp"), { recursive: true });

  const orgData = readJson(orgPath);
  const entitiesData = readJson(entitiesPath);
  const entities = Array.isArray(entitiesData.entities) ? entitiesData.entities : [];
  const byId = new Map(
    entities.filter((e) => e && e.type === "person" && e.id).map((e) => [String(e.id), e])
  );
  const users = Array.isArray(orgData.users) ? orgData.users : [];
  const orgSourceLabel = sourceLabel(orgData.source);
  const allowCreate = /^(1|true|yes)$/i.test(String(process.env.ABIVAX_ORG_MERGE_CREATE || ""));

  const byKey = indexEntityPersonMatches(entities);
  let matched = 0;
  let updated = 0;
  let created = 0;
  const unmatched = [];
  const changes = [];
  const now = new Date().toISOString();

  for (const user of users) {
    const displayName = String(user.displayName || "").trim();
    if (!displayName) continue;

    const keys = [
      normalize(user.mail),
      normalize(user.userPrincipalName),
      normalize(displayName),
      slugFromName(displayName),
    ].filter(Boolean);

    const preferredId = slugFromName(displayName);
    let entity = byId.get(preferredId) || keys.map((k) => byKey.get(k)).find(Boolean);
    if (!entity) {
      if (!allowCreate) {
        unmatched.push({
          displayName,
          mail: String(user.mail || user.userPrincipalName || ""),
          reason: "No matching entity (creation disabled)",
        });
        continue;
      }
      // Create only for clear internal users (abivax domains).
      const mail = String(user.mail || user.userPrincipalName || "");
      if (!/@abivax\.com$/i.test(mail) || !looksLikePersonRecord(user)) {
        unmatched.push({
          displayName,
          mail,
          reason: "No matching entity and record not confidently a person",
        });
        continue;
      }

      entity = {
        id: slugFromName(displayName),
        name: displayName,
        type: "person",
        aliases: [],
        description: `Synced from ${orgSourceLabel} org data.`,
        properties: {},
        links: ["abivax"],
        notes: "Created by Org Graph merge agent.",
        mentions: [],
        createdAt: now,
        updatedAt: now,
      };
      entities.push(entity);
      created += 1;
      byId.set(entity.id, entity);
      byKey.set(normalize(entity.id), entity);
      byKey.set(normalize(entity.name), entity);
      if (mail) byKey.set(normalize(mail), entity);
    } else {
      matched += 1;
    }

    if (!entity.properties || typeof entity.properties !== "object") entity.properties = {};
    const props = entity.properties;

    const before = JSON.stringify({
      graphId: props.graphId || "",
      mail: props.mail || "",
      userPrincipalName: props.userPrincipalName || "",
      graphJobTitle: props.graphJobTitle || "",
      graphDepartment: props.graphDepartment || "",
      reportsTo: props.reportsTo || "",
      graphReportsTo: props.graphReportsTo || "",
      reportsToSource: props.reportsToSource || "",
    });

    const mail = String(user.mail || "").trim();
    const upn = String(user.userPrincipalName || "").trim();
    const jobTitle = String(user.jobTitle || "").trim();
    const department = String(user.department || "").trim();
    const managerName = String(user.manager?.displayName || "").trim();

    if (user.id) props.graphId = String(user.id);
    if (mail) props.mail = mail;
    if (upn) props.userPrincipalName = upn;
    if (jobTitle) props.graphJobTitle = jobTitle;
    if (department) props.graphDepartment = department;
    if (managerName) {
      props.graphReportsTo = managerName;
      // Promote org-sync manager as canonical reporting line.
      props.reportsTo = managerName;
      props.reportsToSource = orgSourceLabel;
    }

    entity.updatedAt = now;

    const after = JSON.stringify({
      graphId: props.graphId || "",
      mail: props.mail || "",
      userPrincipalName: props.userPrincipalName || "",
      graphJobTitle: props.graphJobTitle || "",
      graphDepartment: props.graphDepartment || "",
      reportsTo: props.reportsTo || "",
      graphReportsTo: props.graphReportsTo || "",
      reportsToSource: props.reportsToSource || "",
    });

    if (before !== after) {
      updated += 1;
      changes.push({
        entityId: entity.id,
        name: entity.name,
        reportsTo: props.reportsTo || "",
        graphJobTitle: props.graphJobTitle || "",
        graphDepartment: props.graphDepartment || "",
      });
    }
  }

  writeJson(entitiesPath, { entities });
  writeJson(reportPath, {
    generatedAt: now,
    orgStatus: orgData.status || "unknown",
    orgSource: orgData.source || "unknown",
    inputUsers: users.length,
    matched,
    created,
    updated,
    unmatched: unmatched.slice(0, 50),
    changes: changes.slice(0, 200),
  });

  console.log(
    `org graph merge: inputUsers=${users.length} matched=${matched} created=${created} updated=${updated}`
  );
}

try {
  main();
} catch (err) {
  console.error(`merge_org_graph_into_entities failed: ${err?.message || String(err)}`);
  process.exit(1);
}
