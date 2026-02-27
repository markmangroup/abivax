import {
  loadCompanyIntel,
  loadCompanyIntelDigest,
  loadCompanyIntelReviewQueue,
  loadCompanyIntelAgentBacklog,
  type CompanyIntelItem,
} from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function confidenceBadge(confidence: string) {
  const c = confidence.toLowerCase();
  if (c === "confirmed") return "bg-emerald-900/40 text-emerald-300 border-emerald-700/40";
  if (c === "reported") return "bg-amber-900/40 text-amber-300 border-amber-700/40";
  if (c === "rumor") return "bg-rose-900/40 text-rose-300 border-rose-700/40";
  if (c === "action") return "bg-cyan-900/40 text-cyan-300 border-cyan-700/40";
  return "bg-slate-800 text-slate-300 border-slate-700";
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("primary")) return "bg-emerald-900/30 text-emerald-200 border-emerald-700/40";
  if (s.includes("secondary")) return "bg-amber-900/30 text-amber-200 border-amber-700/40";
  if (s.includes("unverified")) return "bg-rose-900/30 text-rose-200 border-rose-700/40";
  if (s.includes("internal")) return "bg-cyan-900/30 text-cyan-200 border-cyan-700/40";
  return "bg-slate-800 text-slate-300 border-slate-700";
}

function dateLabel(iso: string | null | undefined) {
  if (!iso) return "Date not specified";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  return new Date(ts).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function countByConfidence(items: CompanyIntelItem[], key: string) {
  return items.filter((item) => item.confidence.toLowerCase() === key.toLowerCase()).length;
}

function ItemRow({ item, index }: { item: CompanyIntelItem; index: number }) {
  return (
    <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-100">
          {index}. {item.summary}
        </p>
        <time className="shrink-0 text-xs text-slate-500">{dateLabel(item.date)}</time>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${confidenceBadge(item.confidence)}`}
        >
          {item.confidence}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${statusBadge(item.sourceStatus)}`}
        >
          {item.sourceStatus}
        </span>
        {item.tags.map((tag) => (
          <span key={`${item.id}-${tag}`} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
            {tag}
          </span>
        ))}
      </div>

      {item.implication && <p className="mt-3 text-sm text-slate-300">Implication: {item.implication}</p>}

      {(item.evidenceLine || item.sources.length > 0 || item.verificationAction) && (
        <details className="mt-3 rounded border border-slate-700/50 bg-slate-950/40">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Evidence and Verification
          </summary>
          <div className="space-y-3 border-t border-slate-700/50 p-3 text-sm text-slate-300">
            {item.evidenceLine && <p>{item.evidenceLine}</p>}
            {item.sources.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Sources</p>
                <ul className="space-y-1">
                  {item.sources.map((source) => (
                    <li key={`${item.id}-${source.url}`}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.verificationAction && (
              <p>
                <span className="text-slate-500">Verification action:</span> {item.verificationAction}
              </p>
            )}
          </div>
        </details>
      )}
    </article>
  );
}

export default async function CompanyIntelPage() {
  const intel = loadCompanyIntel();
  const digest = loadCompanyIntelDigest();
  const reviewQueue = loadCompanyIntelReviewQueue();
  const agentBacklog = loadCompanyIntelAgentBacklog();
  const pendingQueueItems = reviewQueue.items.filter((q) => q.status === "pending-review");
  const reviewedQueueItems = reviewQueue.items.filter((q) => q.status === "reviewed");
  const allItems = intel.sections.flatMap((section) => section.items);
  const confirmedCount = countByConfidence(allItems, "confirmed");
  const reportedCount = countByConfidence(allItems, "reported");
  const rumorCount = countByConfidence(allItems, "rumor");
  const actionCount = countByConfidence(allItems, "action");
  const newSinceYesterday = digest.headlines.filter((h) => h.status === "new");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-100">Company Intel Wiki</h1>
        <p className="text-sm text-slate-400">
          Company-level intelligence for operating judgment: catalysts, market context, rumor boundaries, and ERP trigger implications.
        </p>
        <p className="text-xs text-slate-500">Snapshot as of {intel.asOf}.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Confirmed</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">{confirmedCount}</p>
        </article>
        <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Reported</p>
          <p className="mt-1 text-lg font-semibold text-amber-300">{reportedCount}</p>
        </article>
        <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Rumors</p>
          <p className="mt-1 text-lg font-semibold text-rose-300">{rumorCount}</p>
        </article>
        <article className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">Actions</p>
          <p className="mt-1 text-lg font-semibold text-cyan-300">{actionCount}</p>
        </article>
      </section>

      <section className="rounded-xl border border-cyan-700/30 bg-cyan-950/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Daily Headline Digest (Pilot)</h2>
            <p className="text-xs text-slate-400">
              Compact daily intel layer. Today this is sourced from curated company intel plus feed-status tracking; live feed agents are not connected yet.
            </p>
          </div>
          <span className="text-xs text-slate-500">Digest updated {dateLabel(digest.generatedAt || digest.asOf)}</span>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Freshness</p>
            <p className={`mt-1 text-sm font-semibold ${digest.freshness.stale ? "text-amber-300" : "text-emerald-300"}`}>
              {digest.freshness.stale ? "Stale" : "Current"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{digest.freshness.daysSinceIntelSnapshot}d since curated snapshot</p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Digest Headlines</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{digest.headlines.length}</p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Active Feeds</p>
            <p className="mt-1 text-sm font-semibold text-cyan-200">{digest.summary.sourceFeedsActive}</p>
          </div>
          <div className="rounded border border-slate-700/40 bg-slate-900/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Planned Feeds</p>
            <p className="mt-1 text-sm font-semibold text-amber-200">{digest.summary.sourceFeedsPlanned}</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-cyan-700/30 bg-slate-900/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-wider text-cyan-300">New Since Yesterday</p>
            <span className="text-[11px] text-slate-500">{newSinceYesterday.length} new item(s)</span>
          </div>
          {newSinceYesterday.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {newSinceYesterday.slice(0, 4).map((h) => (
                <li key={h.id} className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-100">{h.title}</p>
                    <time className="text-[11px] text-slate-500">{dateLabel(h.date)}</time>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${confidenceBadge(h.confidence)}`}>
                      {h.confidence}
                    </span>
                    <span className="rounded-full border border-slate-700/40 bg-slate-900/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
                      {h.category}
                    </span>
                  </div>
                  {h.summary ? <p className="mt-1 text-[11px] text-slate-400">{h.summary}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              No net-new company-intel headlines in the current digest. Carry-forward items remain in the digest list below.
            </p>
          )}
        </div>

        {digest.freshness.staleReason ? (
          <p className={`mt-3 rounded-md border px-3 py-2 text-xs ${digest.freshness.stale ? "border-amber-700/40 bg-amber-950/30 text-amber-200" : "border-emerald-700/40 bg-emerald-950/30 text-emerald-200"}`}>
            {digest.freshness.staleReason}
          </p>
        ) : null}

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Top Headlines (Current Carry-Forward)</p>
              <span className="text-[11px] text-slate-500">Net-new appears first when detected sources are active</span>
            </div>
            <ul className="mt-2 space-y-2">
              {digest.headlines.slice(0, 5).map((h) => (
                <li key={h.id} className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-100">{h.title}</p>
                    <time className="text-[11px] text-slate-500">{dateLabel(h.date)}</time>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${confidenceBadge(h.confidence)}`}>
                      {h.confidence}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadge(h.sourceType)}`}>
                      {h.sourceType}
                    </span>
                  </div>
                  {h.impact ? <p className="mt-1 text-[11px] text-slate-400">{h.impact}</p> : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Review Queue (Codex)</p>
                <span className="text-[11px] text-slate-500">
                  {reviewQueue.summary.pendingReview} pending / {reviewQueue.summary.highPriorityPending} high
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {pendingQueueItems.slice(0, 3).map((q) => (
                  <div key={q.id} className="rounded border border-slate-700/30 bg-slate-950/30 px-2 py-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-200">{q.title}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${q.priority === "high" ? "border-rose-700/40 bg-rose-900/20 text-rose-200" : "border-amber-700/40 bg-amber-900/20 text-amber-200"}`}>
                        {q.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{q.source} • {q.categoryHint}</p>
                  </div>
                ))}
                {pendingQueueItems.length === 0 ? (
                  <p className="text-xs text-slate-500">No company-intel review items queued yet.</p>
                ) : null}
              </div>
              {reviewedQueueItems.length > 0 ? (
                <p className="mt-2 text-[11px] text-slate-500">Reviewed history retained: {reviewedQueueItems.length}</p>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Feed Status</p>
              <div className="mt-2 space-y-1">
                {digest.sourceStatus.map((s) => (
                  <div key={s.id} className="rounded border border-slate-700/30 bg-slate-950/30 px-2 py-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-200">{s.label}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{s.mode}</p>
                  </div>
                ))}
              </div>
            </div>

            <details className="rounded-lg border border-slate-700/40 bg-slate-900/30">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Agent Improvement Backlog ({agentBacklog.summary.openTodos})
              </summary>
              <div className="space-y-2 border-t border-slate-700/40 p-3">
                {agentBacklog.todos.slice(0, 5).map((t) => (
                  <div key={t.id} className="rounded border border-slate-700/30 bg-slate-950/30 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-100">{t.title}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${t.priority === "high" ? "border-rose-700/40 bg-rose-900/20 text-rose-200" : "border-amber-700/40 bg-amber-900/20 text-amber-200"}`}>
                        {t.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{t.why}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Next: {t.nextStep}</p>
                  </div>
                ))}
              </div>
            </details>

            <details className="rounded-lg border border-slate-700/40 bg-slate-900/30">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Digest To-Dos
              </summary>
              <ul className="space-y-1 border-t border-slate-700/40 p-3 text-xs text-slate-300">
                {digest.todo.map((t) => (
                  <li key={t}>- {t}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-300">To-Do / Automation Backlog</h2>
          <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 text-[11px] text-amber-200">
            Parked for later
          </span>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <article className="rounded-lg border border-amber-700/30 bg-slate-900/40 p-3">
            <p className="text-sm font-medium text-slate-100">Daily Headline Digest (minimum daily)</p>
            <p className="mt-1 text-xs text-slate-400">
              Add a daily update section with only net-new company headlines and signals Mike should know before meetings.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              <li>- Focus on signal over noise (IR, filings, credible biotech press, M&A chatter changes).</li>
              <li>- Mark each item as confirmed / reported / rumor and note impact to ERP/program messaging.</li>
              <li>- Highlight only changes since previous daily snapshot.</li>
            </ul>
          </article>
          <article className="rounded-lg border border-amber-700/30 bg-slate-900/40 p-3">
            <p className="text-sm font-medium text-slate-100">Autonomous Company Intel Agents (gap)</p>
            <p className="mt-1 text-xs text-slate-400">
              Current state: no dedicated autonomous company-intel news/feed agents are active yet; page relies on curated/manual updates.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              <li>- Evaluate sources and access method (IR site, SEC filings, news, X/Twitter watchlist).</li>
              <li>- Add daily intel ingest + change detector + digest summarizer agent chain.</li>
              <li>- Surface a compact &quot;New Since Yesterday&quot; block at top of this page.</li>
            </ul>
          </article>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 lg:sticky lg:top-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Wiki Map</p>
          <nav className="space-y-1 text-sm">
            {intel.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                {section.title}
              </a>
            ))}
            <a href="#erp-triggers" className="block rounded px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
              ERP Trigger Map
            </a>
            <a href="#leadership-questions" className="block rounded px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
              Leadership Questions
            </a>
            <a href="#verification-backlog" className="block rounded px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
              Verification Backlog
            </a>
            <a href="#source-backlog" className="block rounded px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
              Source Backlog
            </a>
          </nav>
        </aside>

        <main className="space-y-6">
          {intel.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-700/50 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{section.title}</h2>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{section.items.length} items</span>
              </div>
              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <ItemRow key={item.id} item={item} index={idx + 1} />
                ))}
              </div>
            </section>
          ))}

          <section id="erp-triggers" className="scroll-mt-24 space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
            <h2 className="border-b border-slate-700/50 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">ERP Trigger Map</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-auto text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-2 pr-3">Trigger</th>
                    <th className="pb-2 pr-3">Why It Matters</th>
                    <th className="pb-2 pr-3">Owner</th>
                    <th className="pb-2">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {intel.erpTriggers.map((t) => (
                    <tr key={`${t.triggerEvent}-${t.dueWindow}`} className="border-t border-slate-700/50 align-top text-slate-300">
                      <td className="py-2 pr-3 font-medium text-slate-100">{t.triggerEvent}</td>
                      <td className="py-2 pr-3">{t.whyItMattersToERP}</td>
                      <td className="py-2 pr-3">{t.owner}</td>
                      <td className="py-2 text-slate-400">{t.dueWindow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="leadership-questions" className="scroll-mt-24 space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
            <h2 className="border-b border-slate-700/50 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Leadership Questions</h2>
            <ol className="space-y-2 text-sm text-slate-300">
              {intel.leadershipQuestions.map((q, i) => (
                <li key={q} className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
                  {i + 1}. {q}
                </li>
              ))}
            </ol>
          </section>

          <section id="verification-backlog" className="scroll-mt-24 space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
            <h2 className="border-b border-slate-700/50 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Verification Backlog</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {intel.verificationBacklog.map((v) => (
                <li key={v} className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
                  {v}
                </li>
              ))}
            </ul>
          </section>

          <section id="source-backlog" className="scroll-mt-24 space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
            <h2 className="border-b border-slate-700/50 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Source Backlog</h2>
            <div className="space-y-2">
              {intel.sourceBacklog.map((source) => (
                <article key={source.id} className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-100">{source.name}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${statusBadge(source.status)}`}>
                      {source.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Owner: {source.owner}</p>
                  <p className="mt-2 text-sm text-slate-300">{source.nextStep}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
