const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function toId(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function displayTrim(v, max = 46) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 3).trim()}...` : s;
}

function normalizeNodeLabel(v) {
  let s = String(v || "")
    .replace(/\s*\(to confirm[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const lower = s.toLowerCase();
  if (lower === "internal finance/fp&a") s = "Internal Finance / FP&A";
  if (lower === "finance teams") s = "Finance Teams";
  if (lower === "kpmg") s = "KPMG";
  return s;
}

function parseOwnerLanes(ownerText) {
  const raw = String(ownerText || "");
  if (!raw.trim()) return ["TBD"];
  const withoutParens = raw.replace(/\(.*?\)/g, "");
  return uniq(
    withoutParens
      .split(/\+|,| and /i)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/\s+/g, " "))
      .map((s) => displayTrim(s, 46))
  );
}

function nodeLane(roleOrSystem, type) {
  if (type === "step") return "process";
  if (type === "control-cluster") return "controls";
  if (type === "future-target") return "future";
  if (type === "owner") return "owners";
  if (type === "system") return "systems";
  return "process";
}

function controlClusterBaseLabel(flow, stepOverlay, summary) {
  if (flow.pillarId === "p2p") return `P2P controls (${summary.mappedControlCount || 0})`;
  if (flow.pillarId === "reporting-data") return `Reporting controls (${summary.mappedControlCount || 0})`;
  if (flow.pillarId === "controls-audit") {
    const sid = String(stepOverlay.stepId || "");
    if (sid === "ctrl-1") return `Findings signals (${summary.mappedControlCount || 0})`;
    if (sid === "ctrl-2") return `Remediation signals (${summary.mappedControlCount || 0})`;
    if (sid === "ctrl-3") return `ERP checkpoint signals (${summary.mappedControlCount || 0})`;
    return `Control signals (${summary.mappedControlCount || 0})`;
  }
  return `Control signals (${summary.mappedControlCount || 0})`;
}

function controlClusterSubtitle(flow, stepOverlay, summary, metricParts) {
  if (metricParts.length === 0) return stepOverlay.stepLabel;
  if (flow.pillarId !== "controls-audit") return metricParts.join(" | ");
  const sid = String(stepOverlay.stepId || "");
  if (sid === "ctrl-1") return `Finding coverage | ${metricParts.join(" | ")}`;
  if (sid === "ctrl-2") return `Active remediation | ${metricParts.join(" | ")}`;
  if (sid === "ctrl-3") return `ERP-linked controls | ${metricParts.join(" | ")}`;
  return metricParts.join(" | ");
}

function main() {
  const root = path.join(__dirname, "..");
  const flows = readJson(path.join(root, "data", "abivax", "process_flows.json"));
  const overlays = readJson(path.join(root, "data", "abivax", "process_flow_control_overlays.json"));
  const outPath = path.join(root, "data", "abivax", "process_flow_diagram_payloads.json");
  const reportPath = path.join(root, "temp", "process-flow-diagram-payloads-report.json");

  const targetFlowIds = new Set([
    "p2p-france-current-to-future",
    "reporting-fpa-bridge-current-to-future",
    "controls-remediation-current-to-future",
  ]);

  const overlayByFlow = new Map((overlays.overlays || []).map((o) => [o.flowId, o]));
  const payloads = [];

  for (const flow of (flows.flows || []).filter((f) => targetFlowIds.has(f.id))) {
    const overlay = overlayByFlow.get(flow.id);
    const nodes = [];
    const edges = [];

    // Step nodes + sequential edges
    (flow.currentState.steps || []).forEach((step, idx, all) => {
      const stepNodeId = `step:${step.id}`;
      nodes.push({
        id: stepNodeId,
        type: "step",
        lane: nodeLane("", "step"),
        label: step.label,
        subtitle: step.owner || "TBD",
        stepIndex: idx + 1,
        systems: step.systems || [],
        painPoints: (step.painPoints || []).slice(0, 2),
      });
      if (idx < all.length - 1) {
        edges.push({
          id: `edge:step:${step.id}->${all[idx + 1].id}`,
          from: stepNodeId,
          to: `step:${all[idx + 1].id}`,
          type: "sequence",
          label: "next",
        });
      }
    });

    // Owner + system nodes (de-duplicated)
    const ownerMap = new Map();
    const systemMap = new Map();
    for (const step of flow.currentState.steps || []) {
      const stepNodeId = `step:${step.id}`;
      for (const owner of parseOwnerLanes(step.owner)) {
        const ownerLabel = normalizeNodeLabel(owner) || owner;
        const oid = `owner:${toId(ownerLabel)}`;
        if (!ownerMap.has(oid)) {
          ownerMap.set(oid, {
            id: oid,
            type: "owner",
            lane: nodeLane(owner, "owner"),
            label: ownerLabel,
          });
        }
        edges.push({
          id: `edge:${oid}->${stepNodeId}`,
          from: oid,
          to: stepNodeId,
          type: "ownership",
          label: "owns/supports",
        });
      }
      for (const system of step.systems || []) {
        const systemLabel = normalizeNodeLabel(system) || system;
        const sid = `system:${toId(systemLabel)}`;
        if (!systemMap.has(sid)) {
          systemMap.set(sid, {
            id: sid,
            type: "system",
            lane: nodeLane(system, "system"),
            label: systemLabel,
          });
        }
        edges.push({
          id: `edge:${stepNodeId}->${sid}`,
          from: stepNodeId,
          to: sid,
          type: "uses-system",
          label: "uses",
        });
      }
    }
    nodes.push(...ownerMap.values(), ...systemMap.values());

    // Overlay-driven control cluster nodes per step
    for (const stepOverlay of overlay?.stepOverlays || []) {
      const stepNodeId = `step:${stepOverlay.stepId}`;
      if (!nodes.find((n) => n.id === stepNodeId)) continue;
      if ((stepOverlay.summary?.mappedControlCount || 0) === 0) continue;

      const clusterNodeId = `controls:${stepOverlay.stepId}`;
      const summary = stepOverlay.summary || {};
      const metricParts = [];
      if ((summary.erpSignalCount || 0) > 0) metricParts.push(`ERP ${summary.erpSignalCount}`);
      if ((summary.trackerDesignCount || 0) > 0) metricParts.push(`Design ${summary.trackerDesignCount}`);
      if ((summary.outOfScopeCount || 0) > 0) metricParts.push(`OOS ${summary.outOfScopeCount}`);
      nodes.push({
        id: clusterNodeId,
        type: "control-cluster",
        lane: nodeLane("", "control-cluster"),
        label: controlClusterBaseLabel(flow, stepOverlay, summary),
        subtitle: controlClusterSubtitle(flow, stepOverlay, summary, metricParts),
        metrics: {
          erpSignals: summary.erpSignalCount || 0,
          trackerDesign: summary.trackerDesignCount || 0,
          outOfScope: summary.outOfScopeCount || 0,
        },
        sampleControls: (stepOverlay.sampleControls || []).slice(0, 3).map((c) => ({
          controlId: c.controlId,
          title: c.controlTitle,
          trackerGap: c.trackerGap,
          trackerStatus: c.trackerStatus,
          erpSignal: !!c.erpSignal,
        })),
      });
      edges.push({
        id: `edge:${clusterNodeId}->${stepNodeId}`,
        from: clusterNodeId,
        to: stepNodeId,
        type: "control-overlay",
        label: "control signals",
      });
    }

    // Future target node
    const futureId = `future:${flow.id}`;
    nodes.push({
      id: futureId,
      type: "future-target",
      lane: nodeLane("", "future-target"),
      label: "Future State Target",
      subtitle: flow.futureState.summary,
      targetChanges: (flow.futureState.targetChanges || []).slice(0, 4),
      erpAddressableChanges: (flow.futureState.erpAddressableChanges || []).slice(0, 4),
      nonErpChanges: (flow.futureState.nonErpChanges || []).slice(0, 3),
    });
    if ((flow.currentState.steps || []).length > 0) {
      const lastStep = flow.currentState.steps[flow.currentState.steps.length - 1];
      edges.push({
        id: `edge:step:${lastStep.id}->${futureId}`,
        from: `step:${lastStep.id}`,
        to: futureId,
        type: "target-state",
        label: "future-state transition",
      });
    }

    payloads.push({
      flowId: flow.id,
      title: flow.title,
      pillarId: flow.pillarId,
      scope: flow.scope,
      status: flow.status,
      generatedAt: new Date().toISOString(),
      lanes: [
        { id: "owners", label: "Owners" },
        { id: "process", label: "Process Steps" },
        { id: "systems", label: "Systems" },
        { id: "controls", label: "Control Signals" },
        { id: "future", label: "Future State" },
      ],
      nodes,
      edges,
      source: {
        processFlowLastUpdated: flow.lastUpdated,
        overlayGeneratedAt: overlays.generatedAt || "",
      },
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: "ok",
    payloadCount: payloads.length,
    payloads: payloads.map((p) => ({
      flowId: p.flowId,
      nodes: p.nodes.length,
      edges: p.edges.length,
      stepNodes: p.nodes.filter((n) => n.type === "step").length,
      controlClusters: p.nodes.filter((n) => n.type === "control-cluster").length,
    })),
  };

  writeJson(outPath, {
    generatedAt: report.generatedAt,
    status: "ok",
    payloads,
  });
  writeJson(reportPath, report);
  console.log(reportPath);
}

main();


