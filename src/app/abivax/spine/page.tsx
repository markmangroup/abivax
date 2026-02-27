import Link from "next/link";
import { loadSpineState, loadNotes, type SpineState, type Note } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}

function splitBullet(s: string) {
  return s.split(/;\\s+/).map((p) => p.trim()).filter(Boolean);
}

function BulletList({
  items,
  emptyLabel = "-",
  splitLong = true,
}: {
  items: string[];
  emptyLabel?: string;
  splitLong?: boolean;
}) {
  return (
    <ul className="space-y-2">
      {items.length ? (
        items.flatMap((t, i) => {
          const parts = splitLong && t.length > 60 ? splitBullet(t) : [t];
          return parts.map((p, j) => (
            <li
              key={`${i}-${j}`}
              className="flex gap-2 text-sm leading-snug text-slate-300"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
              <span className="max-w-prose">{p}</span>
            </li>
          ));
        })
      ) : (
        <li className="text-sm text-slate-500">{emptyLabel}</li>
      )}
    </ul>
  );
}

function computeLatestDigest(notes: Note[]) {
  const last5 = notes.slice(0, 5);
  const truthsNow = dedupe(last5.flatMap((n) => n.summary?.truthsNow ?? [])).slice(0, 5);
  const nextConstraints = dedupe(last5.flatMap((n) => n.summary?.nextConstraints ?? [])).slice(0, 3);

  let changed: string[] = [];
  if (notes.length >= 2) {
    const latest = notes[0];
    const prev = notes[1];
    const latestSet = new Set([
      ...(latest.summary?.decisions ?? []),
      ...(latest.summary?.nextConstraints ?? []),
    ]);
    const prevSet = new Set([
      ...(prev.summary?.decisions ?? []),
      ...(prev.summary?.nextConstraints ?? []),
    ]);
    changed = dedupe([...latestSet].filter((x) => !prevSet.has(x))).slice(0, 3);
  }

  return { truthsNow, changed, nextConstraints };
}

function SpineStateCard({ state }: { state: SpineState }) {
  return (
    <section className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-xl backdrop-blur">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Spine State
      </h2>

      <div className="mb-8">
        <p className="text-lg leading-relaxed text-slate-100">{state.identity}</p>
        <p className="mt-3 text-slate-400">{state.campaign}</p>
      </div>

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Quarter Leverage
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {state.quarterLeverage.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-600">-&gt;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Personal Risks
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {state.personalRisks.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-500/70">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-700/50 pt-6">
        <p className="text-base font-medium italic text-slate-200">
          &ldquo;{state.oneLineStandard}&rdquo;
        </p>
      </div>
    </section>
  );
}

function LatestDigestSection({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Latest Digest
        </h2>
        <p className="text-sm text-slate-500">No notes yet.</p>
      </section>
    );
  }

  const { truthsNow, changed, nextConstraints } = computeLatestDigest(notes);

  return (
    <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-8">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Latest Digest
      </h2>
      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Truths Now
          </h3>
          <BulletList items={truthsNow} />
        </div>
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Changed
          </h3>
          <BulletList items={changed} />
        </div>
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Next Constraints
          </h3>
          <BulletList items={nextConstraints} />
        </div>
      </div>
    </section>
  );
}

function OperatorHomeSection() {
  return (
    <section className="rounded-xl border border-cyan-700/30 bg-cyan-950/20 p-6">
      <h2 className="text-sm font-semibold text-cyan-200">Operator Home (Use These First)</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/abivax/spine/today" className="rounded-lg border border-cyan-800/30 bg-slate-900/40 p-4 hover:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-100">Today</p>
          <p className="mt-1 text-xs text-slate-400">Calls, prompts, live capture, immediate follow-ups.</p>
        </Link>
        <Link href="/abivax/spine/presentations" className="rounded-lg border border-cyan-800/30 bg-slate-900/40 p-4 hover:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-100">Presentations</p>
          <p className="mt-1 text-xs text-slate-400">Board/audit outputs and data gaps tied to deadlines.</p>
        </Link>
        <Link href="/abivax/spine/program" className="rounded-lg border border-cyan-800/30 bg-slate-900/40 p-4 hover:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-100">Program</p>
          <p className="mt-1 text-xs text-slate-400">Timeline, budget, access blockers, and deck deadlines in one place.</p>
        </Link>
        <Link href="/abivax/spine/search" className="rounded-lg border border-cyan-800/30 bg-slate-900/40 p-4 hover:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-100">Wiki</p>
          <p className="mt-1 text-xs text-slate-400">Lookup people/systems when you need specifics.</p>
        </Link>
        <Link href="/abivax/spine/company" className="rounded-lg border border-cyan-800/30 bg-slate-900/40 p-4 hover:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-100">Company Intel</p>
          <p className="mt-1 text-xs text-slate-400">Macro context and catalysts (not day-to-day operations).</p>
        </Link>
        <Link href="/abivax/spine/agents" className="rounded-lg border border-cyan-800/30 bg-slate-900/40 p-4 hover:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-100">Agents (Control Room)</p>
          <p className="mt-1 text-xs text-slate-400">Use when prompts feel wrong/noisy or data looks stale.</p>
        </Link>
      </div>
    </section>
  );
}

function FeedbackCheckSection() {
  const checks = [
    "Did you find what you needed in 1-2 clicks?",
    "Was the default view compact enough (not a scroll wall)?",
    "Were the top prompts actually relevant to today's work?",
    "Did any page feel duplicated with another page?",
    "What page did you expect to use but didn't?",
  ];

  return (
    <section className="rounded-xl border border-amber-700/30 bg-amber-950/20 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-200">Mike Feedback Check (Fast)</h2>
        <span className="text-xs text-amber-300">Reply in chat with short bullets</span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-200">
        {checks.map((c, i) => (
          <li key={c} className="rounded-md border border-amber-800/30 bg-slate-900/40 px-3 py-2">
            {i + 1}. {c}
          </li>
        ))}
      </ul>
      <details className="mt-3 rounded-md border border-amber-800/20 bg-slate-900/20 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-amber-300">
          What Changed In This Pass
        </summary>
        <ul className="mt-3 space-y-1 text-xs text-slate-300">
          <li>- Nav split into Operate vs Control Room</li>
          <li>- New Program page merges timeline + budget + blockers + deck gaps</li>
          <li>- Heavy pages moved out of the main operator path</li>
        </ul>
      </details>
    </section>
  );
}

export default async function SpinePage() {
  const [spineState, notesData] = await Promise.all([loadSpineState(), loadNotes()]);

  const notes = [...notesData.notes].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Operator home. Start with Today / Presentations / Program. Use Control Room pages only when you need deeper context or QA.
        </p>
      </header>

      <OperatorHomeSection />
      <FeedbackCheckSection />

      <details className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-slate-400">
          System Layer Digest (Codex/Agents Context)
        </summary>
        <div className="mt-4 space-y-6">
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-2.5 text-xs text-amber-200/90">
            Paste new notes into Cursor -&gt; updates <code>/data/abivax/notes.json</code>
          </div>
          <SpineStateCard state={spineState} />
          <LatestDigestSection notes={notes} />
        </div>
      </details>
    </div>
  );
}
