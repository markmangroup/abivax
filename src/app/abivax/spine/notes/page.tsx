import Link from "next/link";
import type { ReactNode } from "react";
import { loadEntities, loadNotes, type Note } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function splitBullet(s: string) {
  return s.split(/[;,-]\s+/).map((p) => p.trim()).filter(Boolean);
}

type EntityRef = {
  id: string;
  lower: string;
};

function isBoundary(ch: string | undefined) {
  return !ch || !/[a-z0-9]/i.test(ch);
}

function linkifyText(text: string, refs: EntityRef[]) {
  const lower = text.toLowerCase();
  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    let best: { idx: number; len: number; id: string } | null = null;

    for (const ref of refs) {
      let idx = lower.indexOf(ref.lower, cursor);
      while (idx !== -1) {
        const before = idx > 0 ? lower[idx - 1] : undefined;
        const after = idx + ref.lower.length < lower.length ? lower[idx + ref.lower.length] : undefined;
        if (isBoundary(before) && isBoundary(after)) {
          if (!best || idx < best.idx || (idx === best.idx && ref.lower.length > best.len)) {
            best = { idx, len: ref.lower.length, id: ref.id };
          }
          break;
        }
        idx = lower.indexOf(ref.lower, idx + 1);
      }
    }

    if (!best) {
      out.push(text.slice(cursor));
      break;
    }

    if (best.idx > cursor) {
      out.push(text.slice(cursor, best.idx));
    }

    const matched = text.slice(best.idx, best.idx + best.len);
    out.push(
      <Link
        key={`lk-${key++}`}
        href={`/abivax/spine/entity/${best.id}`}
        className="underline decoration-slate-500/70 underline-offset-2 hover:text-amber-300 hover:decoration-amber-400"
      >
        {matched}
      </Link>
    );

    cursor = best.idx + best.len;
  }

  return out;
}

function renderSection(label: string, items: string[], entityRefs: EntityRef[]) {
  if (items.length === 0) return null;

  return (
    <div key={label}>
      <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</h4>
      <ul className="space-y-1 text-sm text-slate-300">
        {items.flatMap((item, i) => {
          const parts = item.length > 60 ? splitBullet(item) : [item];
          return parts.map((p, j) => (
            <li key={`${label}-${i}-${j}`} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
              {linkifyText(p, entityRefs)}
            </li>
          ));
        })}
      </ul>
    </div>
  );
}

function NoteCard({ note, entityRefs }: { note: Note; entityRefs: EntityRef[] }) {
  const s = note.summary ?? {};
  const truthsNow = s.truthsNow ?? [];
  const decisions = s.decisions ?? [];
  const risks = s.risks ?? [];
  const openQuestions = s.openQuestions ?? [];
  const nextConstraints = s.nextConstraints ?? [];
  const entityMentions = s.entityMentions ?? [];
  const entityUpdateQueue = s.entityUpdateQueue ?? [];

  const date = new Date(note.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article id={note.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 scroll-mt-24">
      <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-slate-700/50 pb-4">
        <h3 className="font-semibold text-slate-100">{note.title || note.id}</h3>
        <time className="shrink-0 text-xs text-slate-500" dateTime={note.createdAt}>
          {date}
        </time>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {renderSection("Truths now", truthsNow, entityRefs)}
        {renderSection("Decisions", decisions, entityRefs)}
        {renderSection("Risks", risks, entityRefs)}
        {renderSection("Open questions", openQuestions, entityRefs)}
        {renderSection("Next constraints", nextConstraints, entityRefs)}
        {renderSection("Entities mentioned", entityMentions, entityRefs)}
        {renderSection("Entity update queue", entityUpdateQueue, entityRefs)}
      </div>
      {note.rawText && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-400">Raw notes</summary>
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 text-xs leading-relaxed text-slate-400">
            {note.rawText}
          </pre>
        </details>
      )}
    </article>
  );
}

export default async function NotesPage() {
  const [{ notes: rawNotes }, { entities }] = await Promise.all([loadNotes(), loadEntities()]);

  const entityRefs: EntityRef[] = entities
    .flatMap((e) => [e.name, ...e.aliases].map((label) => ({ id: e.id, lower: label.toLowerCase().trim() })))
    .filter((x) => x.lower.length >= 3)
    .sort((a, b) => b.lower.length - a.lower.length);

  const notes = [...rawNotes].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">Notes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Meeting notes with digested summaries. Cursor updates <code className="text-slate-400">/data/abivax/notes.json</code> when you paste.
          Run <code className="text-slate-400">npm run note:sync -- --note-id NOTE_ID</code> to refresh entity links and update queue.
        </p>
      </header>

      <div className="space-y-6">
        {notes.length === 0 ? <p className="text-sm text-slate-500">No notes yet.</p> : notes.map((note) => <NoteCard key={note.id} note={note} entityRefs={entityRefs} />)}
      </div>

      <p className="text-xs text-slate-500">{notes.length} notes. Newest first.</p>
    </div>
  );
}
