import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type AgentStep = {
  id: string;
  label: string;
  command: string;
  status: string;
  startedAt: string;
  finishedAt: string;
  outputPreview: string;
};

type AgentStatus = {
  generatedAt: string;
  overallStatus: string;
  results: AgentStep[];
};

type FocusPrompt = {
  priority: string;
  prompt: string;
  why: string;
  source: string;
};

type FocusPromptData = {
  generatedAt: string;
  promptCount: number;
  prompts: FocusPrompt[];
};

type NavGovernanceData = {
  generatedAt: string;
  navCount: number;
  recommendations: string[];
};

type WikiQueueItem = {
  title: string;
  why: string;
  priority: string;
  status: string;
  source: string;
  entityId?: string;
};

type WikiQueueData = {
  generatedAt: string;
  summary: {
    pendingReview: number;
    reviewed: number;
    highPriorityPending: number;
    byCategory?: Record<string, number>;
  };
  items: WikiQueueItem[];
};

type WikiBacklogTodo = {
  id: string;
  priority: string;
  title: string;
  why: string;
  nextStep: string;
  owner: string;
};

type WikiAgentBacklogData = {
  generatedAt: string;
  summary: {
    openTodos: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
  todos: WikiBacklogTodo[];
};

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("ok")) return "border-emerald-700/40 bg-emerald-900/20 text-emerald-200";
  if (s.includes("partial")) return "border-amber-700/40 bg-amber-900/20 text-amber-200";
  if (s.includes("fail")) return "border-rose-700/40 bg-rose-900/20 text-rose-200";
  return "border-slate-700 bg-slate-900 text-slate-300";
}

function loadAgentStatus(): AgentStatus | null {
  const p = path.join(process.cwd(), "temp", "agent-swarm-status.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as AgentStatus;
  } catch {
    return null;
  }
}

function loadFocusPrompts(): FocusPromptData | null {
  const p = path.join(process.cwd(), "temp", "operator-focus-prompts.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as FocusPromptData;
  } catch {
    return null;
  }
}

function loadNavGovernance(): NavGovernanceData | null {
  const p = path.join(process.cwd(), "temp", "nav-governance-report.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as NavGovernanceData;
  } catch {
    return null;
  }
}

function loadWikiQueue(): WikiQueueData | null {
  const p = path.join(process.cwd(), "data", "abivax", "wiki_review_queue.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as WikiQueueData;
  } catch {
    return null;
  }
}

function loadWikiAgentBacklog(): WikiAgentBacklogData | null {
  const p = path.join(process.cwd(), "data", "abivax", "wiki_agent_backlog.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as WikiAgentBacklogData;
  } catch {
    return null;
  }
}

export default function AgentsPage() {
  const status = loadAgentStatus();
  const focus = loadFocusPrompts();
  const nav = loadNavGovernance();
  const wikiQueue = loadWikiQueue();
  const wikiBacklog = loadWikiAgentBacklog();
  const topFocus = (focus?.prompts || []).slice(0, 3);
  const remainingFocus = (focus?.prompts || []).slice(3);
  const wikiPending = (wikiQueue?.items || []).filter((i) => i.status === "pending-review");
  const topWikiPending = wikiPending.slice(0, 3);
  const topWikiBacklog = (wikiBacklog?.todos || []).slice(0, 3);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-100">Agent Swarm</h1>
        <p className="text-sm text-slate-400">
          Autonomous refresh pipeline for calendar, email context, notes linking, entity profiles, connectivity QA, and presentation build.
        </p>
        <p className="text-xs text-slate-500">
          Run from terminal: <code>npm run agents:swarm</code>
        </p>
      </header>

      {!status ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 text-sm text-slate-300">
          No status file yet. Run <code>npm run agents:swarm</code> first.
        </div>
      ) : (
        <div className="space-y-4">
          {focus && focus.prompts.length > 0 && (
            <section className="rounded-xl border border-cyan-700/30 bg-cyan-950/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-cyan-200">Questions For Mike</h2>
                <span className="text-xs text-cyan-300">{focus.prompts.length} prompts</span>
              </div>
              <div className="space-y-2">
                {topFocus.map((p) => (
                  <article key={`${p.priority}-${p.prompt}`} className="rounded border border-cyan-800/40 bg-slate-950/40 p-3">
                    <p className="text-sm text-slate-100">{p.prompt}</p>
                    <p className="mt-1 text-xs text-slate-400">{p.why}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-cyan-300">{p.priority} | {p.source}</p>
                  </article>
                ))}
              </div>
              {remainingFocus.length > 0 && (
                <details className="mt-3 rounded border border-cyan-800/30 bg-slate-950/30 p-3">
                  <summary className="cursor-pointer text-xs font-medium text-cyan-200">
                    Show {remainingFocus.length} more prompts
                  </summary>
                  <div className="mt-3 space-y-2">
                    {remainingFocus.map((p) => (
                      <article key={`${p.priority}-${p.prompt}`} className="rounded border border-cyan-800/40 bg-slate-950/40 p-3">
                        <p className="text-sm text-slate-100">{p.prompt}</p>
                        <p className="mt-1 text-xs text-slate-400">{p.why}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-cyan-300">{p.priority} | {p.source}</p>
                      </article>
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}

          {wikiQueue && wikiPending.length > 0 && (
            <section className="rounded-xl border border-violet-700/30 bg-violet-950/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-violet-200">Wiki Review Queue (Codex)</h2>
                <span className="text-xs text-violet-300">
                  {wikiQueue.summary.pendingReview} pending · {wikiQueue.summary.highPriorityPending} high
                </span>
              </div>
              <div className="space-y-2">
                {topWikiPending.map((item) => (
                  <article key={`${item.source}-${item.title}`} className="rounded border border-violet-800/40 bg-slate-950/40 p-3">
                    <p className="text-sm text-slate-100">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.why}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-violet-300">
                      {item.priority} | {item.source}{item.entityId ? ` | ${item.entityId}` : ""}
                    </p>
                  </article>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Reviewed history retained in <code>data/abivax/wiki_review_queue.json</code>.
              </p>
            </section>
          )}

          {wikiBacklog && wikiBacklog.todos.length > 0 && (
            <details className="rounded-xl border border-fuchsia-700/30 bg-fuchsia-950/20 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-fuchsia-200">
                Wiki Agent Improvement Backlog ({wikiBacklog.summary.openTodos})
              </summary>
              <div className="mt-3 space-y-2">
                {topWikiBacklog.map((t) => (
                  <article key={t.id} className="rounded border border-fuchsia-800/30 bg-slate-950/40 p-3">
                    <p className="text-sm text-slate-100">{t.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{t.why}</p>
                    <p className="mt-1 text-xs text-slate-300">{t.nextStep}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-fuchsia-300">
                      {t.priority} | {t.owner}
                    </p>
                  </article>
                ))}
                {wikiBacklog.todos.length > topWikiBacklog.length && (
                  <p className="text-xs text-slate-500">
                    Showing {topWikiBacklog.length} of {wikiBacklog.todos.length} todo(s)
                  </p>
                )}
              </div>
            </details>
          )}

          {nav && nav.recommendations.length > 0 && (
            <details className="rounded-xl border border-amber-700/30 bg-amber-950/20 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-amber-200">
                Nav Governance Recommendations ({nav.recommendations.length})
              </summary>
              <ul className="mt-3 space-y-1 text-sm text-slate-300">
                {nav.recommendations.map((r) => (
                  <li key={r} className="rounded border border-amber-800/30 bg-slate-950/40 px-3 py-2">
                    {r}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <section className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-300">Last run: {new Date(status.generatedAt).toLocaleString()}</p>
              <span className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wider ${statusClass(status.overallStatus)}`}>
                {status.overallStatus}
              </span>
            </div>
          </section>

          <section className="space-y-2">
            {status.results.map((r) => (
              <details key={r.id} className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-100">{r.label}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wider ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{r.outputPreview}</p>
                </summary>
                <p className="mt-3 text-xs text-slate-500">{r.command}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(r.startedAt).toLocaleTimeString()} - {new Date(r.finishedAt).toLocaleTimeString()}
                </p>
              </details>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
