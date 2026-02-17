import Link from "next/link";
import { searchEntities, loadEntities, type Entity, type EntityType } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

const typeLabels: Record<EntityType, string> = {
  person: "Person",
  system: "System",
  meeting: "Meeting",
  decision: "Decision",
  concept: "Concept",
  milestone: "Milestone",
  organization: "Organization",
};

const typeColors: Record<EntityType, string> = {
  person: "bg-blue-900/50 text-blue-300",
  system: "bg-purple-900/50 text-purple-300",
  meeting: "bg-green-900/50 text-green-300",
  decision: "bg-amber-900/50 text-amber-300",
  concept: "bg-cyan-900/50 text-cyan-300",
  milestone: "bg-red-900/50 text-red-300",
  organization: "bg-slate-700/50 text-slate-300",
};

function EntityBadge({ type }: { type: EntityType }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[type]}`}
    >
      {typeLabels[type]}
    </span>
  );
}

function SearchResult({ entity }: { entity: Entity }) {
  return (
    <Link
      href={`/abivax/spine/entity/${entity.id}`}
      className="block rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-100">{entity.name}</h3>
            <EntityBadge type={entity.type} />
          </div>
          {entity.description && (
            <p className="mt-1 text-sm text-slate-400 line-clamp-2">
              {entity.description}
            </p>
          )}
          {entity.aliases.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Also known as: {entity.aliases.join(", ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const query = q || "";
  const filterType = type as EntityType | undefined;

  let results: Entity[] = [];
  let allEntities: Entity[] = [];

  if (query) {
    results = searchEntities(query);
    if (filterType) {
      results = results.filter((e) => e.type === filterType);
    }
  } else {
    // Show all entities grouped by type when no query
    const { entities } = loadEntities();
    allEntities = entities;
    if (filterType) {
      allEntities = allEntities.filter((e) => e.type === filterType);
    }
  }

  const entityTypes: EntityType[] = [
    "person",
    "system",
    "organization",
    "meeting",
    "milestone",
    "concept",
    "decision",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Search</h1>
        <p className="mt-1 text-sm text-slate-400">
          Find anything in your knowledge base
        </p>
      </div>

      {/* Search Form */}
      <form method="GET" className="space-y-3">
        <div className="relative">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search entities..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500"
          >
            Search
          </button>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/abivax/spine/search${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !filterType
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            All
          </Link>
          {entityTypes.map((t) => (
            <Link
              key={t}
              href={`/abivax/spine/search?${query ? `q=${encodeURIComponent(query)}&` : ""}type=${t}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterType === t
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {typeLabels[t]}s
            </Link>
          ))}
        </div>
      </form>

      {/* Results */}
      {query ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
          </p>
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((entity) => (
                <SearchResult key={entity.id} entity={entity} />
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No entities found matching your search.</p>
          )}
        </div>
      ) : (
        // Browse all entities
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Browse all {allEntities.length} entities
          </p>
          {filterType ? (
            <div className="space-y-2">
              {allEntities
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((entity) => (
                  <SearchResult key={entity.id} entity={entity} />
                ))}
            </div>
          ) : (
            entityTypes.map((t) => {
              const typeEntities = allEntities.filter((e) => e.type === t);
              if (typeEntities.length === 0) return null;
              return (
                <div key={t}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                    {typeLabels[t]}s ({typeEntities.length})
                  </h2>
                  <div className="space-y-2">
                    {typeEntities
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((entity) => (
                        <SearchResult key={entity.id} entity={entity} />
                      ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
