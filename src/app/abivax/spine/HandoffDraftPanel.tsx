"use client";

import { useState } from "react";

export function HandoffDraftPanel({
  title,
  sourceLabel,
  body,
}: {
  title: string;
  sourceLabel: string;
  body: string;
}) {
  const [copyLabel, setCopyLabel] = useState("Copy handoff");

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy handoff"), 1200);
    } catch {
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy handoff"), 1200);
    }
  };

  return (
    <section className="rounded-xl border border-cyan-700/30 bg-cyan-950/15 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-cyan-200">{title}</h2>
          <p className="text-xs text-slate-400">Source: {sourceLabel}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-cyan-700/40 bg-cyan-950/20 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-900/30"
        >
          {copyLabel}
        </button>
      </div>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded border border-slate-700/50 bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-200">
        {body}
      </pre>
    </section>
  );
}

