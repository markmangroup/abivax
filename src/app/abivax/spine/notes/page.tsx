import { loadNotes, type Note } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function splitBullet(s: string) {
  return s.split(/[;—] /).map((p) => p.trim()).filter(Boolean);
}

function NoteCard({ note }: { note: Note }) {
  const s = note.summary ?? {};
  const truthsNow = s.truthsNow ?? [];
  const decisions = s.decisions ?? [];
  const risks = s.risks ?? [];
  const openQuestions = s.openQuestions ?? [];
  const nextConstraints = s.nextConstraints ?? [];

  const date = new Date(note.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const Section = ({
    label,
    items,
  }: {
    label: string;
    items: string[];
  }) => {
    if (items.length === 0) return null;
    return (
      <div>
        <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </h4>
        <ul className="space-y-1 text-sm text-slate-300">
          {items.flatMap((item, i) => {
            const parts =
              item.length > 60 ? splitBullet(item) : [item];
            return parts.map((p, j) => (
              <li key={`${i}-${j}`} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                {p}
              </li>
            ));
          })}
        </ul>
      </div>
    );
  };

  return (
    <article className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
      <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-slate-700/50 pb-4">
        <h3 className="font-semibold text-slate-100">
          {note.title || note.id}
        </h3>
        <time
          className="shrink-0 text-xs text-slate-500"
          dateTime={note.createdAt}
        >
          {date}
        </time>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Section label="Truths now" items={truthsNow} />
        <Section label="Decisions" items={decisions} />
        <Section label="Risks" items={risks} />
        <Section label="Open questions" items={openQuestions} />
        <Section label="Next constraints" items={nextConstraints} />
      </div>
      {note.rawText && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-400">
            Raw notes
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 text-xs leading-relaxed text-slate-400">
            {note.rawText}
          </pre>
        </details>
      )}
    </article>
  );
}

export default async function NotesPage() {
  const { notes: rawNotes } = await loadNotes();
  const notes = [...rawNotes].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">Notes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Meeting notes with digested summaries. Cursor updates{" "}
          <code className="text-slate-400">/data/abivax/notes.json</code> when
          you paste.
        </p>
      </header>

      <div className="space-y-6">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">No notes yet.</p>
        ) : (
          notes.map((note) => <NoteCard key={note.id} note={note} />)
        )}
      </div>

      <p className="text-xs text-slate-500">
        {notes.length} notes. Newest first.
      </p>
    </div>
  );
}
