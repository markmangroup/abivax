/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

function normalize(v) {
  return (v || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortText(input, maxWords) {
  const words = String(input || "").split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return String(input || "");
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function dedupe(items, max) {
  return [...new Set(items.map((x) => String(x || "").trim()).filter(Boolean))].slice(0, max);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, v) {
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8");
}

function safeReadJson(p, fallback) {
  try {
    return readJson(p);
  } catch {
    return fallback;
  }
}

function noteBlob(note) {
  return normalize(
    [
      note.title || "",
      note.rawText || "",
      ...(note.summary?.truthsNow || []),
      ...(note.summary?.decisions || []),
      ...(note.summary?.risks || []),
      ...(note.summary?.openQuestions || []),
      ...(note.summary?.nextConstraints || []),
      ...(note.summary?.entityMentions || []),
    ].join("\n")
  );
}

function noteMentionsEntity(note, entity) {
  const blob = noteBlob(note);
  if (!blob) return false;
  const keys = [entity.name, entity.id, ...(entity.aliases || [])]
    .map(normalize)
    .filter((k) => k.length >= 3);
  return keys.some((k) => {
    return blob.includes(` ${k} `) || blob.startsWith(`${k} `) || blob.endsWith(` ${k}`) || blob === k;
  });
}

function tokensFromText(v) {
  return normalize(v)
    .split(" ")
    .filter((w) => w.length >= 4);
}

const genericTokens = new Set([
  "erp",
  "abivax",
  "project",
  "current",
  "global",
  "status",
  "target",
  "meeting",
  "decision",
  "timeline",
  "implementation",
]);

const broadMeetingPatterns = [
  /today'?s .*meeting/i,
  /attendee set includes/i,
  /primary outcome is/i,
  /use mike as primary coordination point/i,
  /set first .* follow-up checkpoint/i,
  /alignment meeting, not a decision gate/i,
  /executive sponsorship and resource commitment/i,
  /missing budget cadence clarity/i,
];

function containsTerm(n, term) {
  if (!term) return false;
  if (term.includes(" ")) return n.includes(term);
  return n.includes(` ${term} `) || n.startsWith(`${term} `) || n.endsWith(` ${term}`) || n === term;
}

function buildEntityAnchors(entity) {
  const base = [entity.name, ...(entity.aliases || [])];
  const role = typeof entity.properties?.role === "string" ? entity.properties.role : "";
  const category = typeof entity.properties?.category === "string" ? entity.properties.category : "";
  const focusHints = Array.isArray(entity.properties?.focusHints)
    ? entity.properties.focusHints.map((v) => String(v || "")).filter(Boolean)
    : [];
  const exact = dedupe(base.map(normalize).filter((x) => x.length >= 3), 12);
  const coreTokens = dedupe(
    [...base, role, category, ...focusHints]
      .flatMap(tokensFromText)
      .filter((t) => !genericTokens.has(t)),
    24
  );

  const semantic = [];
  const roleN = normalize(role);
  if (/ceo|executive|sponsor/.test(roleN)) semantic.push("board", "executive", "sign off", "signoff");
  if (/finance|fp a|fp&a|accounting|treasury/.test(roleN)) semantic.push("budget", "audit", "cost", "finance");
  if (/it|technical|integration/.test(roleN)) semantic.push("it", "integration", "technical", "resource");
  if (/accounting manager|consolidation/.test(roleN)) semantic.push("consolidation", "close", "reporting");
  if (/p2p|procure|ap/.test(roleN)) semantic.push("vendor", "invoice", "po", "approval");

  const focus = dedupe(
    focusHints
      .map(normalize)
      .filter((x) => x.length >= 3),
    12
  );

  return { exact, tokens: coreTokens, semantic: dedupe(semantic, 12), focus };
}

function scoreLine(line, anchors, entity) {
  const n = normalize(line);
  if (!n) return 0;
  let score = 0;

  for (const k of anchors.exact) {
    if (!k) continue;
    if (containsTerm(n, k)) {
      score += 4;
      break;
    }
  }

  for (const t of anchors.tokens) {
    if (!t) continue;
    if (containsTerm(n, t)) {
      score += 2;
      if (score >= 8) break;
    }
  }

  for (const s of anchors.semantic || []) {
    if (containsTerm(n, s)) {
      score += 2;
      break;
    }
  }

  for (const f of anchors.focus || []) {
    if (containsTerm(n, f)) {
      score += 4;
      break;
    }
  }

  if (entity.type === "person" && /(who|owner|assigned|contact|align|session|follow-up|ping)/.test(n)) {
    score += 1;
  }
  if (entity.type === "system" && /(integration|support|implementation|scope|module|automation|manual|workflow)/.test(n)) {
    score += 1;
  }
  if (entity.type === "milestone" && /(date|deadline|board|go-live|target|gate)/.test(n)) {
    score += 1;
  }

  if (entity.type === "person" && broadMeetingPatterns.some((re) => re.test(line))) {
    score -= 2;
  }

  return score;
}

function isBroadMeetingLine(line) {
  const raw = String(line || "");
  return broadMeetingPatterns.some((re) => re.test(raw));
}

function pickRelevantLines(related, extractLines, entity, anchors, opts) {
  const maxItems = opts.maxItems || 6;
  const maxWords = opts.maxWords || 16;
  const minScore = opts.minScore || 2;
  const allowFallback = opts.allowFallback !== false;
  const withScores = [];

  related.forEach((note, idx) => {
    const recency = Math.max(0, 50 - idx); // More recent notes rank higher.
    for (const raw of extractLines(note)) {
      const line = String(raw || "").trim();
      if (!line) continue;
      const score = scoreLine(line, anchors, entity);
      withScores.push({
        line: shortText(line, maxWords),
        score,
        recency,
        norm: normalize(line),
      });
    }
  });

  const seen = new Set();
  const ranked = withScores
    .filter((x) => x.score >= minScore)
    .filter((x) => !(entity.type === "person" && isBroadMeetingLine(x.line) && x.score < 6))
    .sort((a, b) => (b.score - a.score) || (b.recency - a.recency))
    .filter((x) => {
      if (!x.norm || seen.has(x.norm)) return false;
      seen.add(x.norm);
      return true;
    })
    .slice(0, maxItems)
    .map((x) => x.line);

  if (ranked.length > 0) return ranked;
  if (!allowFallback) return [];

  // Fallback keeps pages populated even with weak anchors.
  const fallback = [];
  const fallbackSeen = new Set();
  for (const x of withScores.sort((a, b) => (b.score - a.score) || (b.recency - a.recency))) {
    if (x.score <= 0) continue;
    if (entity.type === "person" && isBroadMeetingLine(x.line)) continue;
    if (!x.norm || fallbackSeen.has(x.norm)) continue;
    fallbackSeen.add(x.norm);
    fallback.push(x.line);
    if (fallback.length >= Math.min(2, maxItems)) break;
  }
  return fallback;
}

function mergePriorityLines(primary, secondary, max) {
  const seen = new Set();
  const out = [];
  for (const line of [...(primary || []), ...(secondary || [])]) {
    const v = String(line || "").trim();
    const n = normalize(v);
    if (!v || !n || seen.has(n)) continue;
    seen.add(n);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

function buildPersonStructuredContext(entity) {
  const role = typeof entity.properties?.role === "string" ? entity.properties.role : "";
  const team = typeof entity.properties?.team === "string" ? entity.properties.team : "";
  const reportsTo = typeof entity.properties?.reportsTo === "string" ? entity.properties.reportsTo : "";
  const org = typeof entity.properties?.entity === "string" ? entity.properties.entity : "";
  const links = Array.isArray(entity.links) ? entity.links.map((v) => String(v || "")).filter(Boolean) : [];
  const orgUsers = Array.isArray(arguments[1]?.orgGraph?.users) ? arguments[1].orgGraph.users : [];
  const entityMail = normalize(String(entity.properties?.mail || ""));
  const aliases = [entity.name, ...(entity.aliases || [])].map(normalize).filter(Boolean);
  const orgUser = orgUsers.find((u) => {
    const mail = normalize(String(u?.mail || ""));
    const display = normalize(String(u?.displayName || ""));
    if (entityMail && mail && entityMail === mail) return true;
    return aliases.some((a) => a && display && (a === display || display.includes(a) || a.includes(display)));
  }) || null;
  const graphRole = normalize(String(orgUser?.jobTitle || "")) ? String(orgUser?.jobTitle || "") : "";
  const graphTeam = normalize(String(orgUser?.department || "")) ? String(orgUser?.department || "") : "";
  const graphReportsTo = normalize(String(orgUser?.manager?.displayName || "")) ? String(orgUser?.manager?.displayName || "") : "";

  const effectiveRole = role || graphRole;
  const effectiveTeam = team || graphTeam;
  const effectiveReportsTo = reportsTo || graphReportsTo;
  const effectiveOrg = org || (graphTeam ? "Abivax" : "");

  const signalsNow = [];
  const decisions = [];
  const risks = [];
  const openLoops = [];

  if (effectiveRole || effectiveTeam || effectiveReportsTo || effectiveOrg) {
    const parts = [];
    if (effectiveRole) parts.push(`role: ${effectiveRole}`);
    if (effectiveTeam) parts.push(`team: ${effectiveTeam}`);
    if (effectiveReportsTo) parts.push(`reports to: ${effectiveReportsTo}`);
    if (effectiveOrg) parts.push(`org: ${effectiveOrg}`);
    signalsNow.push(`${entity.name} profile baseline -> ${parts.join("; ")}.`);
  }

  if (orgUser && (graphRole || graphTeam || graphReportsTo)) {
    const parts = [];
    if (graphRole) parts.push(`title ${graphRole}`);
    if (graphTeam) parts.push(`dept ${graphTeam}`);
    if (graphReportsTo) parts.push(`manager ${graphReportsTo}`);
    signalsNow.push(`Outlook GAL enrichment -> ${parts.join("; ")}.`);
  }

  const linkedSystems = links.filter((l) =>
    [
      "sage",
      "trustpair",
      "agicap",
      "workday",
      "adaptive",
      "docushare",
      "concur",
      "adp",
      "netsuite",
      "sap",
      "kpmg",
      "cfgi",
      "cfti",
    ].includes(normalize(l))
  );
  if (linkedSystems.length) {
    signalsNow.push(`${entity.name} is linked to workstreams/systems: ${linkedSystems.slice(0, 6).join(", ")}.`);
  }

  if (!effectiveReportsTo && entity.type === "person") {
    openLoops.push(`Confirm reporting line for ${entity.name}.`);
  }

  if (!effectiveRole) openLoops.push(`Confirm role/title for ${entity.name}.`);
  if (!effectiveTeam) openLoops.push(`Confirm team for ${entity.name}.`);

  return {
    signalsNow: dedupe(signalsNow, 5),
    decisions: dedupe(decisions, 3),
    risks: dedupe(risks, 3),
    openLoops: dedupe(openLoops, 4),
  };
}

function matchesSystemName(value, entity) {
  const n = normalize(value);
  if (!n) return false;
  const keys = dedupe([entity.name, entity.id, ...(entity.aliases || [])].map(normalize), 20);
  return keys.some((k) => k && (n === k || n.includes(k) || k.includes(n)));
}

function buildSystemStructuredContext(entity, refs) {
  const systems = Array.isArray(refs.systems?.systems) ? refs.systems.systems : [];
  const integrations = Array.isArray(refs.integrations?.integrations) ? refs.integrations.integrations : [];
  const accessRequests = Array.isArray(refs.accessRequests?.requests) ? refs.accessRequests.requests : [];
  const overlays = Array.isArray(refs.processOverlays?.overlays) ? refs.processOverlays.overlays : [];

  const systemRow = systems.find((s) => matchesSystemName(s.id || s.name, entity) || matchesSystemName(s.name, entity));
  const relatedIntegrations = integrations.filter(
    (i) => matchesSystemName(i.sourceSystem, entity) || matchesSystemName(i.targetSystem, entity)
  );
  const relatedAccess = accessRequests.filter((r) => matchesSystemName(r.system, entity));

  const flowMentions = [];
  for (const ov of overlays) {
    for (const step of ov.stepOverlays || []) {
      const matches = (step.sampleControls || []).filter((c) => matchesSystemName(c.system, entity));
      if (matches.length) {
        flowMentions.push({
          flowTitle: ov.flowTitle,
          stepLabel: step.stepLabel,
          count: matches.length,
          erp: (step.summary && step.summary.erpSignalCount) || 0,
        });
      }
    }
  }

  const signalsNow = [];
  const decisions = [];
  const risks = [];
  const openLoops = [];

  if (systemRow) {
    signalsNow.push(
      `${systemRow.name || entity.name}: ${systemRow.category || "System"} used for ${systemRow.usage || "operational workflow"}.`
    );
    signalsNow.push(
      `Owners (to confirm): business ${systemRow.businessOwner || "TBD"}; system ${systemRow.systemOwner || "TBD"}; admin ${systemRow.adminOwner || "TBD"}.`
    );
    if (systemRow.accessModel) signalsNow.push(`Access model noted: ${systemRow.accessModel}.`);
    if (systemRow.notes) risks.push(shortText(systemRow.notes, 16));
  }

  if (relatedIntegrations.length) {
    const parts = relatedIntegrations.slice(0, 4).map((i) => {
      const dir = `${i.sourceSystem} -> ${i.targetSystem}`;
      const freq = i.frequency ? ` (${i.frequency})` : "";
      return `${dir}${freq}`;
    });
    signalsNow.push(`Mapped integrations (${relatedIntegrations.length}): ${parts.join("; ")}.`);
    const activeCount = relatedIntegrations.filter((i) => normalize(i.status) === "active").length;
    decisions.push(`Treat ${entity.name} integration validation as part of ERP design and controls scope (${activeCount}/${relatedIntegrations.length} mapped as active).`);
    relatedIntegrations.forEach((i) => {
      if (i.failureProcess) risks.push(`${i.sourceSystem} -> ${i.targetSystem}: ${shortText(i.failureProcess, 12)}.`);
      if (i.owner && /confirm/i.test(String(i.owner))) openLoops.push(`Confirm integration owner for ${i.sourceSystem} -> ${i.targetSystem}.`);
    });
  }

  if (relatedAccess.length) {
    const latest = relatedAccess
      .slice()
      .sort((a, b) => String(b.requestedAt || "").localeCompare(String(a.requestedAt || "")))[0];
    signalsNow.push(`Access request status: ${latest.status || "unknown"} (${latest.requestedRole || "access review"}).`);
    if (latest.owner) openLoops.push(`Access owner: ${latest.owner}.`);
    if (latest.nextStep) openLoops.push(shortText(latest.nextStep, 20));
  }

  if (flowMentions.length) {
    const top = flowMentions.slice(0, 3).map((m) => `${m.flowTitle} / ${m.stepLabel} (${m.count} controls)`);
    signalsNow.push(`Process-flow control mapping references ${entity.name} in ${flowMentions.length} step(s): ${top.join("; ")}.`);
    if (flowMentions.some((m) => m.erp > 0)) decisions.push(`${entity.name} appears in ERP-signaled control areas and should stay in pillar-level design review.`);
  }

  return {
    signalsNow: dedupe(signalsNow, 6),
    decisions: dedupe(decisions, 5),
    risks: dedupe(risks, 6),
    openLoops: dedupe(openLoops, 6),
  };
}

function isActionLikePersonLine(line) {
  const n = normalize(line);
  if (!n) return false;
  if (/\?$/.test(String(line || "").trim())) return true;
  return [
    "follow up",
    "run separate",
    "who owns",
    "what budget",
    "use this meeting",
    "set first",
    "lock role map",
    "must be defined",
    "should we",
  ].some((p) => n.includes(p));
}

function personLineHasExactAnchor(line, anchors) {
  const n = normalize(line);
  if (!n) return false;
  return (anchors.exact || []).some((k) => k && containsTerm(n, k));
}

function isBroadProgramPersonLine(line) {
  const n = normalize(line);
  if (!n) return false;
  return [
    "who owns weekly budget tracking",
    "march 19",
    "use the cfti rcms",
    "use this meeting",
    "mike is now positioned as central intake filter",
    "unclear attendee ownership",
    "escalation path if staffing pressure increases",
    "board communication",
  ].some((p) => n.includes(p));
}

function main() {
  const root = path.resolve(__dirname, "..");
  const dataDir = path.join(root, "data", "abivax");
  const notesPath = path.join(dataDir, "notes.json");
  const entitiesPath = path.join(dataDir, "entities.json");
  const systemsPath = path.join(dataDir, "systems.json");
  const integrationsPath = path.join(dataDir, "integrations.json");
  const accessRequestsPath = path.join(dataDir, "access_requests.json");
  const processOverlaysPath = path.join(dataDir, "process_flow_control_overlays.json");
  const orgGraphPath = path.join(dataDir, "org_graph.json");
  const outPath = path.join(dataDir, "entity_profiles.json");

  const notesData = readJson(notesPath);
  const entitiesData = readJson(entitiesPath);
  const refs = {
    systems: safeReadJson(systemsPath, { systems: [] }),
    integrations: safeReadJson(integrationsPath, { integrations: [] }),
    accessRequests: safeReadJson(accessRequestsPath, { requests: [] }),
    processOverlays: safeReadJson(processOverlaysPath, { overlays: [] }),
    orgGraph: safeReadJson(orgGraphPath, { users: [] }),
  };
  const notes = Array.isArray(notesData.notes) ? notesData.notes : [];
  const entities = Array.isArray(entitiesData.entities) ? entitiesData.entities : [];
  const generatedAt = new Date().toISOString();
  const personLineOpts = {
    signalsNow: { maxItems: 5, maxWords: 18, minScore: 3, allowFallback: false },
    decisions: { maxItems: 5, maxWords: 16, minScore: 3, allowFallback: false },
    risks: { maxItems: 5, maxWords: 16, minScore: 3, allowFallback: false },
    openLoops: { maxItems: 6, maxWords: 16, minScore: 3, allowFallback: false },
  };
  const defaultLineOpts = {
    signalsNow: { maxItems: 5, maxWords: 18, minScore: 2, allowFallback: true },
    decisions: { maxItems: 5, maxWords: 16, minScore: 2, allowFallback: true },
    risks: { maxItems: 5, maxWords: 16, minScore: 2, allowFallback: true },
    openLoops: { maxItems: 6, maxWords: 16, minScore: 2, allowFallback: true },
  };

  const profiles = entities.map((entity) => {
    const anchors = buildEntityAnchors(entity);
    const related = notes
      .filter((n) => noteMentionsEntity(n, entity))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const noteIds = related.map((n) => n.id);
    const lastTouchedAt = related[0]?.createdAt || null;
    const lineOpts = entity.type === "person" ? personLineOpts : defaultLineOpts;

    let noteSignals = pickRelevantLines(
      related,
      (n) => n.summary?.truthsNow || [],
      entity,
      anchors,
      lineOpts.signalsNow
    );
    let noteDecisions = pickRelevantLines(
      related,
      (n) => n.summary?.decisions || [],
      entity,
      anchors,
      lineOpts.decisions
    );
    let noteRisks = pickRelevantLines(
      related,
      (n) => n.summary?.risks || [],
      entity,
      anchors,
      lineOpts.risks
    );
    let noteOpenLoops = pickRelevantLines(
      related,
      (n) => [...(n.summary?.openQuestions || []), ...(n.summary?.nextConstraints || [])],
      entity,
      anchors,
      lineOpts.openLoops
    );

    if (entity.type === "person") {
      noteSignals = noteSignals.filter((l) => !isActionLikePersonLine(l));
      noteDecisions = noteDecisions.filter((l) => !isActionLikePersonLine(l));
      noteRisks = noteRisks.filter((l) => !isActionLikePersonLine(l));
      noteSignals = noteSignals.filter((l) => personLineHasExactAnchor(l, anchors) || !isBroadProgramPersonLine(l));
      noteDecisions = noteDecisions.filter((l) => personLineHasExactAnchor(l, anchors) || !isBroadProgramPersonLine(l));
      noteRisks = noteRisks.filter((l) => personLineHasExactAnchor(l, anchors) || !isBroadProgramPersonLine(l));
      noteOpenLoops = noteOpenLoops.filter((l) => personLineHasExactAnchor(l, anchors) || !isBroadProgramPersonLine(l));
      // Open loops can legitimately contain questions, so keep them.
    }

    const structured =
      entity.type === "system"
        ? buildSystemStructuredContext(entity, refs)
        : entity.type === "person"
          ? buildPersonStructuredContext(entity, refs)
          : { signalsNow: [], decisions: [], risks: [], openLoops: [] };

    return {
      entityId: entity.id,
      generatedAt,
      focusHints: Array.isArray(entity.properties?.focusHints)
        ? entity.properties.focusHints.map((v) => String(v || "")).filter(Boolean).slice(0, 8)
        : [],
      noteIds: noteIds.slice(0, 25),
      signalsNow: mergePriorityLines(structured.signalsNow, noteSignals, lineOpts.signalsNow.maxItems || 5),
      decisions: mergePriorityLines(structured.decisions, noteDecisions, lineOpts.decisions.maxItems || 5),
      risks: mergePriorityLines(structured.risks, noteRisks, lineOpts.risks.maxItems || 5),
      openLoops: mergePriorityLines(structured.openLoops, noteOpenLoops, lineOpts.openLoops.maxItems || 6),
      lastTouchedAt,
    };
  });

  writeJson(outPath, { profiles });
  console.log(`Generated ${profiles.length} entity profiles -> data/abivax/entity_profiles.json`);
}

try {
  main();
} catch (err) {
  console.error(`build_entity_profiles failed: ${err?.message || String(err)}`);
  process.exit(1);
}
