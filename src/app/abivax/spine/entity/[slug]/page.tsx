import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEntityBySlug,
  getLinkedEntities,
  getBacklinks,
  type Entity,
  type EntityType,
} from "@/lib/abivaxData";

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
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[type]}`}
    >
      {typeLabels[type]}
    </span>
  );
}

function EntityLink({ entity }: { entity: Entity }) {
  return (
    <Link
      href={`/abivax/spine/entity/${entity.id}`}
      className="group flex items-center gap-2 rounded-md border border-slate-700/50 bg-slate-800/30 px-3 py-2 transition-colors hover:border-slate-600 hover:bg-slate-800/60"
    >
      <EntityBadge type={entity.type} />
      <span className="text-sm text-slate-200 group-hover:text-white">
        {entity.name}
      </span>
    </Link>
  );
}

function PropertyValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-slate-500">—</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "number") return <span>{value.toLocaleString()}</span>;
  if (typeof value === "string") return <span>{value}</span>;
  if (Array.isArray(value)) {
    return (
      <ul className="list-inside list-disc space-y-0.5">
        {value.map((item, i) => (
          <li key={i} className="text-slate-300">
            <PropertyValue value={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="space-y-1 pl-2 border-l border-slate-700">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <span className="text-slate-500">{k}:</span>{" "}
            <PropertyValue value={v} />
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

export default async function EntityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);

  if (!entity) {
    notFound();
  }

  const linkedEntities = getLinkedEntities(entity.id);
  const backlinks = getBacklinks(entity.id);

  // Group linked entities by type
  const linkedByType = linkedEntities.reduce(
    (acc, e) => {
      if (!acc[e.type]) acc[e.type] = [];
      acc[e.type].push(e);
      return acc;
    },
    {} as Record<EntityType, Entity[]>
  );

  // Group backlinks by type
  const backlinksByType = backlinks.reduce(
    (acc, e) => {
      if (!acc[e.type]) acc[e.type] = [];
      acc[e.type].push(e);
      return acc;
    },
    {} as Record<EntityType, Entity[]>
  );

  const hasProperties = Object.keys(entity.properties).length > 0;
  const hasLinked = linkedEntities.length > 0;
  const hasBacklinks = backlinks.length > 0;
  const hasMentions = entity.mentions.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <EntityBadge type={entity.type} />
          {entity.aliases.length > 0 && (
            <span className="text-sm text-slate-500">
              aka {entity.aliases.join(", ")}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-slate-100">{entity.name}</h1>
        {entity.description && (
          <p className="text-lg text-slate-400">{entity.description}</p>
        )}
      </div>

      {/* Properties */}
      {hasProperties && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Details
          </h2>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(entity.properties).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-300">
                    <PropertyValue value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Notes */}
      {entity.notes && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Notes
          </h2>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {entity.notes}
            </p>
          </div>
        </section>
      )}

      {/* Linked Entities */}
      {hasLinked && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Related
          </h2>
          <div className="space-y-4">
            {(Object.keys(linkedByType) as EntityType[]).map((type) => (
              <div key={type}>
                <h3 className="mb-2 text-xs font-medium text-slate-400">
                  {typeLabels[type]}s
                </h3>
                <div className="flex flex-wrap gap-2">
                  {linkedByType[type].map((e) => (
                    <EntityLink key={e.id} entity={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Backlinks */}
      {hasBacklinks && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Referenced By
          </h2>
          <div className="space-y-4">
            {(Object.keys(backlinksByType) as EntityType[]).map((type) => (
              <div key={type}>
                <h3 className="mb-2 text-xs font-medium text-slate-400">
                  {typeLabels[type]}s
                </h3>
                <div className="flex flex-wrap gap-2">
                  {backlinksByType[type].map((e) => (
                    <EntityLink key={e.id} entity={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mentions Timeline */}
      {hasMentions && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Mentioned In
          </h2>
          <div className="space-y-2">
            {entity.mentions.map((mention, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm"
              >
                <span className="text-slate-500">
                  {new Date(mention.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <Link
                  href="/abivax/spine/notes"
                  className="text-slate-300 hover:text-white"
                >
                  Note: {mention.noteId}
                </Link>
                {mention.context && (
                  <span className="text-slate-500">— {mention.context}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Metadata Footer */}
      <footer className="border-t border-slate-800 pt-4 text-xs text-slate-600">
        <p>
          Created: {new Date(entity.createdAt).toLocaleDateString()} · Updated:{" "}
          {new Date(entity.updatedAt).toLocaleDateString()}
        </p>
      </footer>
    </div>
  );
}
