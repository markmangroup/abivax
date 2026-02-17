import { loadMeetings, type Meeting } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function formatDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MeetingCard({ m }: { m: Meeting }) {
  return (
    <article className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-700/50 pb-4">
        <div>
          <h2 className="font-semibold text-slate-100">{m.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(m.date)} • {m.time}
          </p>
        </div>
        {m.link && (
          <a
            href={m.link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100"
          >
            Join
          </a>
        )}
      </header>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Location</dt>
          <dd className="text-slate-300">{m.location}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Organizer</dt>
          <dd className="text-slate-300">{m.organizer}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Attendees</dt>
          <dd className="text-slate-300">{m.attendees}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Purpose</dt>
          <dd className="text-slate-300">{m.purpose}</dd>
        </div>
      </dl>
      {m.prep && m.prep.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-400/90">
            Prep
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-300">
            {m.prep.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-500">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default async function MeetingsPage() {
  const { meetings } = await loadMeetings();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const upcoming = meetings.filter((m) => m.date >= today);
  const past = meetings.filter((m) => m.date < today);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">Meetings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Prep, purpose, links. Cursor updates{" "}
          <code className="text-slate-400">/data/abivax/meetings.json</code>.
        </p>
      </header>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Upcoming
          </h2>
          <div className="space-y-4">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Past
          </h2>
          <div className="space-y-4">
            {past.map((m) => (
              <MeetingCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {meetings.length === 0 && (
        <p className="text-sm text-slate-500">No meetings yet.</p>
      )}
    </div>
  );
}
