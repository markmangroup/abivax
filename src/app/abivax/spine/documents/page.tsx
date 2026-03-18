import Link from "next/link";
import { loadDocumentRegistry, type DocumentRegistryEntry } from "@/lib/abivaxData";

export const dynamic = "force-dynamic";

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return value;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileName(sourcePath: string) {
  const parts = sourcePath.replaceAll("\\", "/").split("/");
  return parts[parts.length - 1] || sourcePath;
}

function sourceGroup(doc: DocumentRegistryEntry) {
  if (doc.relatedVendor === "NetSuite") return "Oracle NetSuite";
  if (doc.relatedVendor === "KPMG") return "KPMG";
  if (doc.relatedVendor === "CFGI") return "CFGI";
  return doc.organization || "Other";
}

function subArea(doc: DocumentRegistryEntry) {
  if (doc.relatedVendor === "NetSuite") {
    if (doc.documentType.includes("commercial") || doc.documentType.includes("statement-of-work")) {
      return "Commercial / contracting";
    }
    if (doc.documentType.includes("timeline")) return "Implementation plan";
    if (doc.documentType.includes("integration")) return "Technical / integrations";
    return "General";
  }

  if (doc.relatedVendor === "KPMG") {
    if ((doc.relatedWorkstream || "").toLowerCase().includes("selection")) return "Selection materials";
    if ((doc.relatedWorkstream || "").toLowerCase().includes("support")) return "Implementation support";
    return "General";
  }

  if (doc.relatedVendor === "CFGI") {
    return "Implementation alternative";
  }

  return "General";
}

function documentFocus(doc: DocumentRegistryEntry) {
  if (doc.status === "superseded") return "Historical";
  if (doc.status === "draft") return "Working";
  if (doc.documentType.includes("statement-of-work")) return "Core";
  if (doc.documentType.includes("commercial")) return "Core";
  if (doc.documentType.includes("proposal")) return "Core";
  if (doc.documentType.includes("timeline") || doc.documentType.includes("integration")) return "Working";
  return "Reference";
}

function focusTone(value: string) {
  if (value === "Core") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (value === "Working") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  if (value === "Historical") return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";
}

type SourceSection = {
  source: string;
  docs: DocumentRegistryEntry[];
};

function ActionLinks({ doc }: { doc: DocumentRegistryEntry }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/api/abivax/documents/${doc.id}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-500 hover:text-slate-950"
      >
        Open file
      </a>
      {doc.appLink ? (
        <Link
          href={doc.appLink}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-500 hover:text-slate-950"
        >
          Open in app
        </Link>
      ) : null}
    </div>
  );
}

function SourceTable({ docs }: { docs: DocumentRegistryEntry[] }) {
  const grouped = Object.entries(
    docs.reduce<Record<string, DocumentRegistryEntry[]>>((acc, doc) => {
      const key = subArea(doc);
      acc[key] = acc[key] || [];
      acc[key].push(doc);
      return acc;
    }, {})
  ).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-4">
      {grouped.map(([area, areaDocs]) => (
        <div key={area} className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-950">{area}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Focus</th>
                  <th className="px-4 py-3 font-medium">Sender</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {areaDocs.map((doc) => {
                  const focus = documentFocus(doc);
                  return (
                    <tr key={doc.id} className="border-b border-slate-100 align-top last:border-b-0">
                      <td className="px-4 py-3">
                        <details className="group">
                          <summary className="cursor-pointer list-none">
                            <p className="font-medium text-slate-950">{doc.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{fileName(doc.sourcePath)}</p>
                          </summary>
                          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-700">
                            <p>{doc.summary}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {doc.topicTags.slice(0, 4).map((tag) => (
                                <span key={tag} className="rounded-full bg-white px-2 py-0.5 uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </details>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${focusTone(focus)}`}>
                          {focus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{doc.sender || "Unknown sender"}</p>
                        <p className="mt-1 text-xs text-slate-500">{doc.organization || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(doc.dateReceived)}</td>
                      <td className="px-4 py-3">
                        <ActionLinks doc={doc} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceSectionCard({ section, defaultOpen = false }: { section: SourceSection; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="rounded-2xl border border-slate-200 bg-slate-50/80">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-base font-semibold text-slate-950">{section.source}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-950">{section.docs.length}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">documents</p>
        </div>
      </summary>
      <div className="border-t border-slate-200 p-3">
        <SourceTable docs={section.docs} />
      </div>
    </details>
  );
}

export default function DocumentsPage() {
  const registry = loadDocumentRegistry();
  const externalDocs = registry.documents.filter((doc) => doc.collection === "vendor-source-pack");

  const sections = Object.entries(
    externalDocs.reduce<Record<string, DocumentRegistryEntry[]>>((acc, doc) => {
      const key = sourceGroup(doc);
      acc[key] = acc[key] || [];
      acc[key].push(doc);
      return acc;
    }, {})
  )
    .map(([source, docs]) => ({ source, docs }))
    .sort((a, b) => a.source.localeCompare(b.source));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">Documents</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">External source registry</h1>
          <p className="mt-2 text-sm text-slate-600">
            External documents only. Grouped by sender/source first, then by sub-area so you can quickly find what each party has sent.
          </p>
        </div>

        <section className="mt-6 space-y-4">
          {sections.map((section, index) => (
            <SourceSectionCard key={section.source} section={section} defaultOpen={index === 0} />
          ))}
        </section>
      </div>
    </main>
  );
}
