/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
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

function chooseCanonical(items, entitiesById) {
  const scored = items.map((p) => {
    const e = entitiesById.get(p.id);
    const entityName = String(e?.name || p.name || "");
    const exactSlug = slugFromName(entityName) === p.id ? 4 : 0;
    const hasHyphen = p.id.includes("-") ? 1 : 0;
    const roleLen = String(p.role || "").length > 8 ? 1 : 0;
    const noteLen = String(p.notes || "").length;
    const nameWords = entityName.trim().split(/\s+/).filter(Boolean).length;
    return {
      p,
      score: exactSlug * 100 + hasHyphen * 10 + roleLen * 5 + nameWords * 3 + Math.min(noteLen, 200) / 100,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].p;
}

function mergeText(a, b) {
  const x = String(a || "").trim();
  const y = String(b || "").trim();
  if (!x) return y;
  if (!y) return x;
  if (x === y) return x;
  if (x.includes(y)) return x;
  if (y.includes(x)) return y;
  return `${x} ${y}`.trim();
}

function unionStrings(arr) {
  return Array.from(new Set(arr.map((x) => String(x || "").trim()).filter(Boolean)));
}

function mergeMentions(a = [], b = []) {
  const out = [];
  const seen = new Set();
  for (const m of [...a, ...b]) {
    const key = [m?.noteId || "", m?.date || "", m?.context || ""].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

function preferValue(primary, secondary) {
  if (primary === undefined || primary === null || primary === "") return secondary;
  return primary;
}

function mergeEntityIntoCanonical(canonical, duplicate, canonicalId) {
  canonical.aliases = unionStrings([
    ...(canonical.aliases || []),
    ...(duplicate.aliases || []),
    duplicate.name,
    duplicate.id !== canonicalId ? duplicate.id : "",
  ]);
  canonical.description = mergeText(canonical.description, duplicate.description);
  canonical.notes = mergeText(canonical.notes, duplicate.notes);
  canonical.links = unionStrings([...(canonical.links || []), ...(duplicate.links || [])]).filter(
    (x) => x !== canonicalId && x !== duplicate.id
  );
  canonical.mentions = mergeMentions(canonical.mentions || [], duplicate.mentions || []);
  canonical.properties = canonical.properties || {};
  const dupProps = duplicate.properties || {};
  for (const [k, v] of Object.entries(dupProps)) {
    if (!(k in canonical.properties)) canonical.properties[k] = v;
    else canonical.properties[k] = preferValue(canonical.properties[k], v);
  }
  canonical.updatedAt = new Date().toISOString();
}

function rewriteLinks(entities, redirectMap) {
  for (const e of entities) {
    e.links = unionStrings(
      (e.links || []).map((id) => redirectMap.get(id) || id)
    ).filter((id) => id !== e.id);
  }
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const peoplePath = path.join(dataDir, "people.json");
  const entitiesPath = path.join(dataDir, "entities.json");
  const profilesPath = path.join(dataDir, "entity_profiles.json");
  const reportPath = path.join(root, "temp", "duplicate-people-report.json");
  fs.mkdirSync(path.join(root, "temp"), { recursive: true });

  const peopleData = readJson(peoplePath, { people: [] });
  const entitiesData = readJson(entitiesPath, { entities: [] });
  const profilesData = readJson(profilesPath, { profiles: [] });

  const people = Array.isArray(peopleData.people) ? peopleData.people : [];
  const entities = Array.isArray(entitiesData.entities) ? entitiesData.entities : [];
  const profiles = Array.isArray(profilesData.profiles) ? profilesData.profiles : [];

  const entitiesById = new Map(entities.map((e) => [e.id, e]));
  const peopleByEmail = new Map();

  for (const p of people) {
    const e = entitiesById.get(p.id);
    const mail = String(e?.properties?.mail || "").trim().toLowerCase();
    if (!mail) continue;
    if (!peopleByEmail.has(mail)) peopleByEmail.set(mail, []);
    peopleByEmail.get(mail).push(p);
  }

  const redirectMap = new Map();
  const merges = [];
  let peopleUpdated = 0;
  let entityMergedCount = 0;

  for (const [mail, group] of peopleByEmail.entries()) {
    if (group.length < 2) continue;
    const canonical = chooseCanonical(group, entitiesById);
    const duplicates = group.filter((p) => p.id !== canonical.id);
    if (duplicates.length === 0) continue;

    const canonEntity = entitiesById.get(canonical.id);
    for (const dup of duplicates) {
      redirectMap.set(dup.id, canonical.id);

      canonical.role =
        String(canonical.role || "").length >= String(dup.role || "").length ? canonical.role : dup.role;
      canonical.entity =
        String(canonical.entity || "").length >= String(dup.entity || "").length ? canonical.entity : dup.entity;
      canonical.needThem =
        String(canonical.needThem || "").length >= String(dup.needThem || "").length
          ? canonical.needThem
          : dup.needThem;
      canonical.notes = mergeText(canonical.notes, dup.notes);
      peopleUpdated += 1;

      const dupEntity = entitiesById.get(dup.id);
      if (canonEntity && dupEntity) {
        mergeEntityIntoCanonical(canonEntity, dupEntity, canonical.id);
        entityMergedCount += 1;
      }
    }

    merges.push({
      mail,
      canonicalId: canonical.id,
      duplicateIds: duplicates.map((d) => d.id),
    });
  }

  if (redirectMap.size > 0) {
    peopleData.people = people.filter((p) => !redirectMap.has(p.id));

    rewriteLinks(entities, redirectMap);
    entitiesData.entities = entities
      .filter((e) => !redirectMap.has(e.id))
      .map((e) => {
        if (redirectMap.has(e.id)) return e;
        return e;
      });

    if (profiles.length > 0) {
      const byProfileId = new Map();
      for (const p of profiles) {
        const nextId = redirectMap.get(p.entityId) || p.entityId;
        if (!byProfileId.has(nextId)) {
          byProfileId.set(nextId, { ...p, entityId: nextId });
          continue;
        }
        const existing = byProfileId.get(nextId);
        existing.focusHints = unionStrings([...(existing.focusHints || []), ...(p.focusHints || [])]).slice(0, 8);
        existing.noteIds = unionStrings([...(existing.noteIds || []), ...(p.noteIds || [])]).slice(0, 25);
        existing.signalsNow = unionStrings([...(existing.signalsNow || []), ...(p.signalsNow || [])]).slice(0, 5);
        existing.decisions = unionStrings([...(existing.decisions || []), ...(p.decisions || [])]).slice(0, 5);
        existing.risks = unionStrings([...(existing.risks || []), ...(p.risks || [])]).slice(0, 5);
        existing.openLoops = unionStrings([...(existing.openLoops || []), ...(p.openLoops || [])]).slice(0, 6);
        existing.lastTouchedAt = existing.lastTouchedAt || p.lastTouchedAt || null;
      }
      profilesData.profiles = Array.from(byProfileId.values());
    }

    writeJson(peoplePath, peopleData);
    writeJson(entitiesPath, entitiesData);
    writeJson(profilesPath, profilesData);
  }

  writeJson(reportPath, {
    generatedAt: new Date().toISOString(),
    duplicateGroups: merges.length,
    redirects: Object.fromEntries(redirectMap.entries()),
    peopleRowsRemoved: peopleUpdated,
    entityRowsMerged: entityMergedCount,
    merges,
  });

  console.log(
    `duplicate people: groups=${merges.length} redirects=${redirectMap.size} peopleRemoved=${peopleUpdated} entityMerged=${entityMergedCount}`
  );
}

try {
  main();
} catch (err) {
  console.error(`reconcile_duplicate_people failed: ${err?.message || String(err)}`);
  process.exit(1);
}

