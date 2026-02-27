const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function norm(v) {
  return String(v ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

const STEP_CONTROL_RULES = {
  "fr-p2p-1": {
    subProcessIncludes: ["vendor", "master data"],
    anyTextIncludes: ["vendor", "trustpair"],
  },
  "fr-p2p-2": {
    subProcessIncludes: ["purchase order", "delegation of authority", "open orders"],
    anyTextIncludes: ["invoice", "two-way match", "approval", "docushare"],
  },
  "fr-p2p-3": {
    subProcessIncludes: ["cash disbursements", "accruals", "prepaids", "search for unrecorded liabilities"],
    anyTextIncludes: ["payment", "disbursement", "trustpair", "agicap", "bank"],
  },
  "rep-1": {
    subProcessIncludes: ["journal entries", "chart of accounts", "close procedures", "foreign exchange rate"],
    anyTextIncludes: ["sage", "journal", "chart of accounts", "fx", "foreign exchange"],
  },
  "rep-2": {
    subProcessIncludes: ["financial statement preparation", "consolidation process", "related parties", "materiality memo", "going concern", "asu review"],
    anyTextIncludes: ["consolidation", "financial statement", "related parties", "ifrs", "sec"],
  },
  "rep-3": {
    subProcessIncludes: ["budgeting & forecasting", "significant, non-routine transaction approval", "cost classification"],
    anyTextIncludes: ["budget", "forecast", "actual", "variance", "department"],
  },
  "ctrl-1": {
    anyTextIncludes: ["gap", "material weakness", "sod review", "soc-1 review", "access to programs & data"],
  },
  "ctrl-2": {
    includeTrackerStatuses: ["Ongoing", "Design to complete", "Not started", "Ready"],
    excludeTrackerOutOfScope: true,
    anyTextIncludes: ["review", "reconciliation", "evidence", "sign-off", "tickmarks", "validation"],
  },
  "ctrl-3": {
    recordPool: "all",
    requireErpSignal: true,
  },
};

function matchesRule(record, rule) {
  if (!rule) return false;
  if (rule.requireErpSignal && !record.erpSignal) return false;
  if (rule.requireTrackerGap && norm(record.trackerGap) !== norm(rule.requireTrackerGap)) return false;
  if (rule.excludeTrackerOutOfScope && record.trackerOutOfScope) return false;
  if (
    rule.includeTrackerStatuses &&
    rule.includeTrackerStatuses.length > 0 &&
    !rule.includeTrackerStatuses.some((s) => norm(record.trackerStatus) === norm(s))
  ) {
    return false;
  }
  if (
    rule.excludeTrackerStatuses &&
    rule.excludeTrackerStatuses.length > 0 &&
    rule.excludeTrackerStatuses.some((s) => norm(record.trackerStatus) === norm(s))
  ) {
    return false;
  }

  const haystack = norm(
    [
      record.controlId,
      record.process,
      record.subProcess,
      record.controlTitle,
      record.controlSummary,
      record.system,
      record.remediationPlan,
    ].join(" ")
  );
  const processText = norm(record.process);
  const subProcessText = norm(record.subProcess);

  const anyTextOk =
    !rule.anyTextIncludes || rule.anyTextIncludes.some((k) => haystack.includes(norm(k)));
  const processOk =
    !rule.processIncludes || rule.processIncludes.some((k) => processText.includes(norm(k)));
  const subProcessOk =
    !rule.subProcessIncludes || rule.subProcessIncludes.some((k) => subProcessText.includes(norm(k)));

  return anyTextOk && processOk && subProcessOk;
}

function scoreRecord(r) {
  return (
    (r.erpSignal ? 20 : 0) +
    (r.trackerGap === "ERP" ? 10 : 0) +
    (r.trackerGap === "Design" ? 8 : 0) +
    (r.trackerStatus === "Out-Of-Scope" ? 4 : 0) +
    (r.trackerStatus === "Design to complete" ? 3 : 0) +
    (r.keyNonKey === "Key" ? 2 : 0)
  );
}

function summarize(records) {
  const by = (arr, keyFn) => {
    const m = new Map();
    for (const r of arr) {
      const k = (keyFn(r) || "").trim();
      if (!k) continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({ key, count }));
  };
  return {
    mappedControlCount: records.length,
    erpSignalCount: records.filter((r) => r.erpSignal).length,
    trackerDesignCount: records.filter((r) => r.trackerGap === "Design").length,
    outOfScopeCount: records.filter((r) => r.trackerOutOfScope).length,
    byTrackerStatus: by(records, (r) => r.trackerStatus),
    byTrackerGap: by(records, (r) => r.trackerGap),
    bySubProcess: by(records, (r) => r.subProcess || r.process),
  };
}

function main() {
  const root = path.join(__dirname, "..");
  const flowsPath = path.join(root, "data", "abivax", "process_flows.json");
  const registerPath = path.join(root, "data", "abivax", "cfti_control_register.json");
  const outPath = path.join(root, "data", "abivax", "process_flow_control_overlays.json");
  const reportPath = path.join(root, "temp", "process-flow-control-overlays-report.json");

  const flowsData = readJson(flowsPath);
  const registerData = fs.existsSync(registerPath) ? readJson(registerPath) : { status: "missing", records: [] };

  if (registerData.status !== "ok") {
    const payload = {
      generatedAt: new Date().toISOString(),
      status: "missing-cfti-register",
      overlays: [],
    };
    writeJson(outPath, payload);
    writeJson(reportPath, payload);
    console.log(reportPath);
    return;
  }

  const overlays = [];
  for (const flow of flowsData.flows || []) {
    const flowRecords = (registerData.records || []).filter((r) => r.primaryPillar === flow.pillarId);
    const stepOverlays = (flow.currentState?.steps || []).map((step) => {
      const rule = STEP_CONTROL_RULES[step.id];
      const candidateRecords = rule && rule.recordPool === "all" ? (registerData.records || []) : flowRecords;
      const matched = candidateRecords
        .filter((r) => matchesRule(r, rule))
        .sort((a, b) => scoreRecord(b) - scoreRecord(a) || String(a.controlId).localeCompare(String(b.controlId)));
      return {
        stepId: step.id,
        stepLabel: step.label,
        ruleApplied: STEP_CONTROL_RULES[step.id] ? "yes" : "no",
        summary: summarize(matched),
        sampleControlIds: matched.slice(0, 8).map((r) => r.controlId),
        sampleControls: matched.slice(0, 5).map((r) => ({
          id: r.id,
          controlId: r.controlId,
          controlTitle: r.controlTitle,
          process: r.process,
          subProcess: r.subProcess,
          system: r.system,
          trackerGap: r.trackerGap,
          trackerStatus: r.trackerStatus,
          erpSignal: !!r.erpSignal,
          trackerOutOfScope: !!r.trackerOutOfScope,
          expectedValidationDate: r.expectedValidationDate || "",
        })),
      };
    });

    overlays.push({
      flowId: flow.id,
      flowTitle: flow.title,
      pillarId: flow.pillarId,
      generatedFrom: "cfti_control_register",
      summary: {
        totalFlowPillarRecords: flowRecords.length,
        mappedAcrossSteps: stepOverlays.reduce((n, s) => n + s.summary.mappedControlCount, 0),
        uniqueMappedControls: [...new Set(stepOverlays.flatMap((s) => s.sampleControlIds))].length,
      },
      stepOverlays,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    status: "ok",
    source: {
      processFlowsUpdatedAt: flowsData.updatedAt || "",
      cftiControlRegisterGeneratedAt: registerData.generatedAt || "",
    },
    overlays,
  };
  writeJson(outPath, payload);
  writeJson(reportPath, {
    generatedAt: payload.generatedAt,
    status: payload.status,
    flowCount: overlays.length,
    overlays: overlays.map((o) => ({
      flowId: o.flowId,
      pillarId: o.pillarId,
      totalFlowPillarRecords: o.summary.totalFlowPillarRecords,
      mappedAcrossSteps: o.summary.mappedAcrossSteps,
      uniqueMappedControls: o.summary.uniqueMappedControls,
    })),
  });
  console.log(reportPath);
}

main();
