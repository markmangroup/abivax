import type { ProcessFlowDiagramPayloadsData } from "@/lib/abivaxData";

type DiagramPayload = ProcessFlowDiagramPayloadsData["payloads"][number];

type NodeType = DiagramPayload["nodes"][number];
type EdgeType = DiagramPayload["edges"][number];
type RenderVariant = "default" | "presentation" | "slide";

function truncate(text: string, max = 26) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function laneColor(laneId: string) {
  switch (laneId) {
    case "owners":
      return { bg: "#0f172a", stroke: "#334155", chip: "#1e293b", text: "#cbd5e1" };
    case "process":
      return { bg: "#082f49", stroke: "#155e75", chip: "#0c4a6e", text: "#cffafe" };
    case "systems":
      return { bg: "#111827", stroke: "#374151", chip: "#1f2937", text: "#d1d5db" };
    case "controls":
      return { bg: "#052e16", stroke: "#166534", chip: "#14532d", text: "#dcfce7" };
    case "future":
      return { bg: "#172554", stroke: "#4338ca", chip: "#312e81", text: "#e0e7ff" };
    default:
      return { bg: "#0f172a", stroke: "#334155", chip: "#1e293b", text: "#e2e8f0" };
  }
}

function laneColorForVariant(laneId: string, variant: RenderVariant) {
  if (variant === "presentation" || variant === "slide") {
    switch (laneId) {
      case "owners":
        return { bg: "#ffffff", stroke: "#cbd5e1", chip: "#f8fafc", text: "#0f172a" };
      case "process":
        return { bg: "#ecfeff", stroke: "#67e8f9", chip: "#cffafe", text: "#083344" };
      case "systems":
        return { bg: "#f8fafc", stroke: "#cbd5e1", chip: "#e2e8f0", text: "#0f172a" };
      case "controls":
        return { bg: "#f0fdf4", stroke: "#86efac", chip: "#dcfce7", text: "#14532d" };
      case "future":
        return { bg: "#eef2ff", stroke: "#a5b4fc", chip: "#e0e7ff", text: "#312e81" };
      default:
        return { bg: "#ffffff", stroke: "#cbd5e1", chip: "#f8fafc", text: "#0f172a" };
    }
  }
  return laneColor(laneId);
}

function nodeFill(node: NodeType) {
  if (node.type === "step") return "#0c4a6e";
  if (node.type === "control-cluster") return "#14532d";
  if (node.type === "future-target") return "#312e81";
  if (node.type === "owner") return "#1e293b";
  return "#1f2937";
}

function nodeStroke(node: NodeType) {
  if (node.type === "step") return "#22d3ee";
  if (node.type === "control-cluster") return "#4ade80";
  if (node.type === "future-target") return "#818cf8";
  return "#64748b";
}

function relatedStepId(node: NodeType, edges: EdgeType[]) {
  if (node.type === "step") return node.id;
  if (node.type === "future-target") return null;
  if (node.type === "control-cluster") {
    const e = edges.find((x) => x.type === "control-overlay" && x.from === node.id && x.to.startsWith("step:"));
    return e?.to ?? null;
  }
  if (node.type === "owner") {
    const e = edges.find((x) => x.type === "ownership" && x.from === node.id && x.to.startsWith("step:"));
    return e?.to ?? null;
  }
  if (node.type === "system") {
    const e = edges.find((x) => x.type === "uses-system" && x.to === node.id && x.from.startsWith("step:"));
    return e?.from ?? null;
  }
  return null;
}

export function RenderedSwimlaneDiagram({
  payload,
  variant = "default",
  showLegend = true,
}: {
  payload: DiagramPayload;
  variant?: RenderVariant;
  showLegend?: boolean;
}) {
  const lanes = payload.lanes;
  const compactText = variant === "slide";
  const lightVariant = variant !== "default";
  const processNodes = payload.nodes
    .filter((n) => n.type === "step")
    .sort((a, b) => (a.stepIndex || 0) - (b.stepIndex || 0));
  const futureNode = payload.nodes.find((n) => n.type === "future-target") || null;

  const labelColW = 110;
  const colW = 210;
  const laneH = compactText ? 92 : 104;
  const gap = 10;
  const margin = 12;
  const cols = processNodes.length + (futureNode ? 1 : 0);
  const width = labelColW + cols * colW + margin * 2;
  const height = lanes.length * laneH + (lanes.length - 1) * gap + margin * 2;
  const legendH = showLegend ? 26 : 0;

  const rowY = new Map<string, number>();
  lanes.forEach((l, i) => rowY.set(l.id, margin + i * (laneH + gap)));

  const stepColById = new Map<string, number>();
  processNodes.forEach((n, i) => stepColById.set(n.id, i));

  function colX(colIndex: number) {
    return margin + labelColW + colIndex * colW;
  }

  function boxRect(laneId: string, colIndex: number, variant: "major" | "chip" = "chip", stackIndex = 0) {
    const y = rowY.get(laneId) ?? margin;
    const x = colX(colIndex) + 8;
    if (variant === "major") {
      return { x, y: y + 12, w: colW - 16, h: laneH - 24 };
    }
    const chipH = 17;
    const chipGap = 4;
    return { x, y: y + 10 + stackIndex * (chipH + chipGap), w: colW - 16, h: chipH };
  }

  const grouped = new Map<string, NodeType[]>();
  for (const node of payload.nodes) {
    if (node.type === "step" || node.type === "future-target") continue;
    const stepId = relatedStepId(node, payload.edges);
    if (!stepId) continue;
    const col = stepColById.get(stepId);
    if (col == null) continue;
    const key = `${node.lane}|${col}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(node);
  }

  return (
    <div
      className={
        lightVariant
          ? "overflow-x-auto rounded border border-slate-300 bg-white p-2"
          : "overflow-x-auto rounded border border-slate-700/30 bg-slate-950/20 p-2"
      }
    >
      <svg
        viewBox={`0 0 ${width} ${height + legendH}`}
        width={width}
        height={height + legendH}
        className="h-auto min-w-full"
        role="img"
        aria-label={`${payload.title} swimlane preview`}
      >
        <defs>
          <marker id={`arrow-${payload.flowId}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>

        {lanes.map((lane) => {
          const y = rowY.get(lane.id) ?? margin;
          const c = laneColorForVariant(lane.id, variant);
          return (
            <g key={lane.id}>
              <rect x={margin} y={y} width={width - margin * 2} height={laneH} rx={8} fill={c.bg} stroke={c.stroke} />
              <rect
                x={margin}
                y={y}
                width={labelColW - 8}
                height={laneH}
                rx={8}
                fill={lightVariant ? "#f8fafc" : "#020617"}
                stroke={c.stroke}
              />
              <text x={margin + 10} y={y + 20} fill={lightVariant ? "#0f172a" : "#cbd5e1"} fontSize="11" fontWeight="600">
                {lane.label}
              </text>
            </g>
          );
        })}

        {processNodes.map((node) => {
          const col = stepColById.get(node.id) ?? 0;
          const r = boxRect("process", col, "major");
          return (
            <g key={node.id}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} fill={nodeFill(node)} stroke={nodeStroke(node)} strokeWidth={1.5} />
              <title>{node.label}{node.subtitle ? ` - ${node.subtitle}` : ""}</title>
              <text x={r.x + 8} y={r.y + 16} fill="#ecfeff" fontSize="11" fontWeight="600">
                {truncate(node.label, 30)}
              </text>
              {node.subtitle ? (
                <text x={r.x + 8} y={r.y + 31} fill={lightVariant ? "#e2e8f0" : "#cbd5e1"} fontSize="10">
                  {truncate(node.subtitle, compactText ? 28 : 34)}
                </text>
              ) : null}
              {node.painPoints?.[0] && !compactText ? (
                <text x={r.x + 8} y={r.y + 46} fill={lightVariant ? "#cbd5e1" : "#94a3b8"} fontSize="9">
                  Pain: {truncate(node.painPoints[0], 38)}
                </text>
              ) : null}
            </g>
          );
        })}

        {futureNode ? (() => {
          const r = boxRect("future", processNodes.length, "major");
          return (
            <g key={futureNode.id}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} fill={nodeFill(futureNode)} stroke={nodeStroke(futureNode)} strokeWidth={1.5} />
              <title>{futureNode.subtitle || futureNode.label}</title>
              <text x={r.x + 8} y={r.y + 16} fill="#e0e7ff" fontSize="11" fontWeight="600">
                {truncate(futureNode.label, 30)}
              </text>
              {futureNode.targetChanges?.slice(0, compactText ? 1 : 2).map((t, i) => (
                <text key={t} x={r.x + 8} y={r.y + 31 + i * 13} fill="#c7d2fe" fontSize="9">
                  - {truncate(t, compactText ? 34 : 38)}
                </text>
              ))}
            </g>
          );
        })() : null}

        {[...grouped.entries()].map(([key, nodes]) => {
          const [laneId, colText] = key.split("|");
          const col = Number(colText);
          const visible = nodes.slice(0, compactText ? 3 : 4);
          const hidden = Math.max(0, nodes.length - visible.length);
          return (
            <g key={key}>
              {visible.map((node, idx) => {
                const r = boxRect(laneId, col, "chip", idx);
                return (
                  <g key={node.id}>
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={4} fill={nodeFill(node)} stroke={nodeStroke(node)} strokeWidth={1} />
                    <title>{node.label}{node.subtitle ? ` - ${node.subtitle}` : ""}</title>
                    <text x={r.x + 6} y={r.y + 12} fill={lightVariant ? "#0f172a" : "#e2e8f0"} fontSize="9.5">
                      {truncate(node.label, 36)}
                    </text>
                  </g>
                );
              })}
              {hidden > 0 ? (() => {
                const r = boxRect(laneId, col, "chip", Math.min(compactText ? 3 : 4, visible.length));
                return (
                  <g>
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={4} fill={lightVariant ? "#f8fafc" : "#0f172a"} stroke="#475569" strokeWidth={1} />
                    <text x={r.x + 6} y={r.y + 12} fill={lightVariant ? "#334155" : "#cbd5e1"} fontSize="9.5">
                      +{hidden} more
                    </text>
                  </g>
                );
              })() : null}
            </g>
          );
        })}

        {payload.edges
          .filter((e) => e.type === "sequence")
          .map((e) => {
            const from = processNodes.find((n) => n.id === e.from);
            const to = processNodes.find((n) => n.id === e.to);
            if (!from || !to) return null;
            const fromCol = stepColById.get(from.id) ?? 0;
            const toCol = stepColById.get(to.id) ?? 0;
            const rf = boxRect("process", fromCol, "major");
            const rt = boxRect("process", toCol, "major");
            const y = rf.y + rf.h / 2;
            return (
              <line
                key={e.id}
                x1={rf.x + rf.w}
                y1={y}
                x2={rt.x}
                y2={y}
                stroke="#64748b"
                strokeWidth={1.2}
                markerEnd={`url(#arrow-${payload.flowId})`}
              />
            );
          })}

        {payload.edges
          .filter((e) => e.type === "control-overlay")
          .map((e) => {
            const step = processNodes.find((n) => n.id === e.to);
            const controlNode = payload.nodes.find((n) => n.id === e.from);
            if (!step || !controlNode) return null;
            const col = stepColById.get(step.id) ?? 0;
            const rs = boxRect("process", col, "major");
            const rc = boxRect("controls", col, "chip", 0);
            return (
              <line
                key={e.id}
                x1={rs.x + rs.w / 2}
                y1={rs.y + rs.h}
                x2={rc.x + rc.w / 2}
                y2={rc.y}
                stroke="#22c55e"
                strokeOpacity={0.5}
                strokeDasharray="3 3"
              />
            );
          })}

        {futureNode && processNodes.length > 0 ? (() => {
          const last = processNodes[processNodes.length - 1];
          const rs = boxRect("process", stepColById.get(last.id) ?? 0, "major");
          const rf = boxRect("future", processNodes.length, "major");
          return (
            <path
              d={`M ${rs.x + rs.w / 2} ${rs.y + rs.h} C ${rs.x + rs.w / 2} ${rs.y + rs.h + 22}, ${rf.x + rf.w / 2} ${rf.y - 22}, ${rf.x + rf.w / 2} ${rf.y}`}
              stroke="#818cf8"
              strokeWidth={1.4}
              fill="none"
              strokeDasharray="4 3"
            />
          );
        })() : null}

        {showLegend ? (
        <g transform={`translate(${margin}, ${height + 8})`}>
          <text x={0} y={10} fill="#94a3b8" fontSize="10" fontWeight="600">
            Legend
          </text>
          <g transform="translate(46,0)">
            <rect x={0} y={0} width={12} height={12} rx={2} fill="#0c4a6e" stroke="#22d3ee" strokeWidth={1} />
            <text x={18} y={10} fill="#cbd5e1" fontSize="9.5">Process step</text>
          </g>
          <g transform="translate(160,0)">
            <rect x={0} y={0} width={12} height={12} rx={2} fill="#14532d" stroke="#4ade80" strokeWidth={1} />
            <text x={18} y={10} fill="#cbd5e1" fontSize="9.5">Control cluster</text>
          </g>
          <g transform="translate(290,0)">
            <rect x={0} y={0} width={12} height={12} rx={2} fill="#312e81" stroke="#818cf8" strokeWidth={1} />
            <text x={18} y={10} fill="#cbd5e1" fontSize="9.5">Future target</text>
          </g>
          <g transform="translate(400,0)">
            <line x1={0} y1={6} x2={24} y2={6} stroke="#22c55e" strokeOpacity={0.7} strokeDasharray="3 3" />
            <text x={30} y={10} fill="#cbd5e1" fontSize="9.5">Control overlay</text>
          </g>
          <g transform="translate(520,0)">
            <line x1={0} y1={6} x2={24} y2={6} stroke="#818cf8" strokeWidth={1.4} strokeDasharray="4 3" />
            <text x={30} y={10} fill="#cbd5e1" fontSize="9.5">Future transition</text>
          </g>
        </g>
        ) : null}
      </svg>
    </div>
  );
}


