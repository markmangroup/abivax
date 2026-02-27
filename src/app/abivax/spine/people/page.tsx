import Link from "next/link";
import {
  loadEntities,
  loadEntityProfiles,
  loadMeetings,
  type Entity,
} from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

type PersonVM = {
  id: string;
  name: string;
  role: string;
  org: string;
  needLevel: string;
  lastTouchedAt: string | null;
  relevance: number;
  focusHints: string[];
};

type GroupDef = {
  id: string;
  label: string;
  matcher: (p: PersonVM) => boolean;
};

type ViewMode = "all" | "today";

const groups: GroupDef[] = [
  {
    id: "core",
    label: "Core Decision Makers",
    matcher: (p) =>
      p.needLevel === "critical" ||
      /(chief|ceo|cfo|vp|finance lead|sponsor)/i.test(p.role),
  },
  {
    id: "finance",
    label: "Finance Team",
    matcher: (p) =>
      /(finance|fp&a|fp a|treasury|accounting|consolidation|p2p|ap)/i.test(
        `${p.role} ${p.org}`
      ),
  },
  {
    id: "it",
    label: "IT and Technical",
    matcher: (p) => /(it|integration|technical|cyber)/i.test(`${p.role} ${p.org}`),
  },
  {
    id: "external",
    label: "External and Vendor",
    matcher: (p) => /(kpmg|oracle|netsuite|consultant|vendor)/i.test(`${p.role} ${p.org}`),
  },
];

function recencyBoost(isoDate: string | null): number {
  if (!isoDate) return 0;
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return 0;
  const days = (Date.now() - ts) / (24 * 60 * 60 * 1000);
  if (days <= 7) return 25;
  if (days <= 21) return 12;
  return 0;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function splitAttendees(raw: string): string[] {
  return raw
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function dateInEasternIso(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function isFinanceIntroMeeting(title: string): boolean {
  const normalized = normalize(title);
  return normalized.includes("introduction") && normalized.includes("finance");
}

function buildPersonVM(entities: Entity[]): PersonVM[] {
  const { profiles } = loadEntityProfiles();
  const profileByEntity = new Map(profiles.map((p) => [p.entityId, p]));

  return entities
    .filter((e) => e.type === "person")
    .map((e) => {
      const role = typeof e.properties.role === "string" ? e.properties.role : "Role to confirm";
      const org = typeof e.properties.entity === "string" ? e.properties.entity : "Org to confirm";
      const needLevelRaw = typeof e.properties.needLevel === "string" ? e.properties.needLevel : "engage";
      const needLevel = needLevelRaw.toLowerCase();
      const hints = Array.isArray(e.properties.focusHints)
        ? e.properties.focusHints.map((x) => String(x)).slice(0, 4)
        : [];
      const profile = profileByEntity.get(e.id);
      const lastTouchedAt = profile?.lastTouchedAt || (e.mentions[e.mentions.length - 1]?.date || null);
      const base =
        needLevel.includes("critical") ? 100 : needLevel.includes("engage") ? 65 : 35;
      const relevance = base + recencyBoost(lastTouchedAt) + (profile?.openLoops?.length || 0) * 2;

      return {
        id: e.id,
        name: e.name,
        role,
        org,
        needLevel,
        lastTouchedAt,
        relevance,
        focusHints: hints,
      };
    })
    .sort((a, b) => b.relevance - a.relevance || a.name.localeCompare(b.name));
}

function buildEntityNameTokens(entity: Entity): string[] {
  return [entity.name, ...(entity.aliases || [])]
    .map((s) => normalize(s))
    .filter(Boolean);
}

function buildTodayRelevantIds(entities: Entity[]): Set<string> {
  const { meetings } = loadMeetings();
  const today = dateInEasternIso();
  const todaysMeetings = meetings.filter((m) => m.date === today);
  if (todaysMeetings.length === 0) return new Set<string>();

  const participantTokens = new Set<string>();
  let financeIntro = false;
  for (const meeting of todaysMeetings) {
    financeIntro = financeIntro || isFinanceIntroMeeting(meeting.title || "");
    if (meeting.organizer) participantTokens.add(normalize(meeting.organizer));
    for (const attendee of splitAttendees(meeting.attendees || "")) {
      participantTokens.add(normalize(attendee));
    }
  }

  const ids = new Set<string>();
  for (const entity of entities) {
    if (entity.type !== "person") continue;
    const tokens = buildEntityNameTokens(entity);
    if (tokens.some((token) => participantTokens.has(token))) {
      ids.add(entity.id);
      continue;
    }
    if (
      financeIntro &&
      /(finance|fp&a|fp a|treasury|accounting|controller|consolidation)/i.test(
        String(entity.properties.role || "")
      )
    ) {
      ids.add(entity.id);
    }
  }

  return ids;
}

function PersonCard({ person }: { person: PersonVM }) {
  return (
    <article className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/abivax/spine/entity/${person.id}`}
          className="text-sm font-medium text-slate-100 underline decoration-slate-500/70 underline-offset-2 hover:text-amber-300 hover:decoration-amber-400"
        >
          {person.name}
        </Link>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            person.needLevel.includes("critical")
              ? "bg-amber-900/40 text-amber-300"
              : person.needLevel.includes("engage")
                ? "bg-emerald-900/40 text-emerald-300"
                : "bg-slate-700/50 text-slate-300"
          }`}
        >
          {person.needLevel}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-300">{person.role}</p>
      <p className="mt-1 text-xs text-slate-500">{person.org}</p>
      {person.focusHints.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {person.focusHints.map((hint) => (
            <span
              key={`${person.id}-${hint}`}
              className="rounded bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-300"
            >
              {hint}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const params = (await searchParams) || {};
  const view: ViewMode = params.view === "today" ? "today" : "all";

  const { entities } = loadEntities();
  const allPeople = buildPersonVM(entities);
  const relevantTodayIds = buildTodayRelevantIds(entities);
  const people =
    view === "today"
      ? allPeople.filter((p) => relevantTodayIds.has(p.id))
      : allPeople;

  const grouped: Record<string, PersonVM[]> = {};
  for (const g of groups) grouped[g.id] = [];
  grouped.other = [];

  for (const p of people) {
    const group = groups.find((g) => g.matcher(p));
    if (group) grouped[group.id].push(p);
    else grouped.other.push(p);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-100">People</h1>
        <p className="text-sm text-slate-400">
          Live people graph from <code className="text-slate-300">entities.json</code>, ranked by relevance and grouped for faster navigation.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/abivax/spine/people?view=today"
            className={`rounded-full border px-3 py-1 text-xs ${
              view === "today"
                ? "border-emerald-500/40 bg-emerald-900/30 text-emerald-200"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Relevant Today ({allPeople.filter((p) => relevantTodayIds.has(p.id)).length})
          </Link>
          <Link
            href="/abivax/spine/people?view=all"
            className={`rounded-full border px-3 py-1 text-xs ${
              view === "all"
                ? "border-amber-500/40 bg-amber-900/20 text-amber-200"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All People ({allPeople.length})
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Jump to Group</p>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
            >
              {g.label} ({grouped[g.id].length})
            </a>
          ))}
          <a
            href="#other"
            className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
          >
            Other ({grouped.other.length})
          </a>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.id} id={g.id} className="scroll-mt-24 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            {g.label} ({grouped[g.id].length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[g.id].map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </section>
      ))}

      <section id="other" className="scroll-mt-24 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Other ({grouped.other.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.other.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Showing {people.length} of {allPeople.length} people. Relevance updates automatically with new context.
      </p>
    </div>
  );
}
