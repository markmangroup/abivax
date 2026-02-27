"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ViewerSlide = {
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  visual?: string;
};

export default function SlideViewerClient({
  deckTitle,
  deckId,
  slides,
}: {
  deckTitle: string;
  deckId: string;
  slides: ViewerSlide[];
}) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const current = useMemo(() => slides[index] ?? slides[0], [slides, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((v) => Math.min(v + 1, total - 1));
      if (e.key === "ArrowLeft") setIndex((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{deckTitle} - Live Viewer</h1>
          <p className="text-sm text-slate-400">Use left/right arrows or the buttons.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/abivax/spine/presentations"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Back to Workspace
          </Link>
          <a
            href={`/api/abivax/presentations/${deckId}/pptx`}
            className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            Download PPTX
          </a>
        </div>
      </header>

      <section className="rounded-xl border border-slate-700/50 bg-slate-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Slide {index + 1} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setIndex((v) => Math.max(v - 1, 0))}
              disabled={index === 0}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setIndex((v) => Math.min(v + 1, total - 1))}
              disabled={index === total - 1}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <article className="min-h-[58vh] rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8">
          <h2 className="text-3xl font-semibold text-slate-100">{current.title}</h2>
          <div className="mt-2 flex items-center gap-2">
            {current.subtitle ? <p className="text-base text-slate-400">{current.subtitle}</p> : null}
            {current.visual ? (
              <span className="rounded-full border border-cyan-700/40 bg-cyan-900/30 px-2 py-0.5 text-xs uppercase tracking-wider text-cyan-200">
                {current.visual}
              </span>
            ) : null}
          </div>
          <ul className="mt-8 space-y-3 text-lg text-slate-200">
            {current.bullets.map((b) => (
              <li key={`${current.id}-${b}`} className="rounded-md border border-slate-700/40 bg-slate-900/40 px-4 py-3">
                {b}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/30 p-3">
        <div className="flex min-w-max gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`w-44 rounded-md border p-2 text-left text-xs ${
                i === index
                  ? "border-amber-500/60 bg-amber-900/20 text-amber-200"
                  : "border-slate-700 bg-slate-900/50 text-slate-300"
              }`}
            >
              <p className="font-medium">#{i + 1}</p>
              <p className="mt-1 line-clamp-2">{s.title}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
