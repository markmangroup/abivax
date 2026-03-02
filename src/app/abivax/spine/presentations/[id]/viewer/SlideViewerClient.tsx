"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

export default function SlideViewerClient({
  deckTitle,
  deckId,
  slideCount,
  openGapCount,
  meetingDate,
  audience,
}: {
  deckTitle: string;
  deckId: string;
  slideCount: number;
  openGapCount: number;
  meetingDate: string;
  audience: string;
}) {
  const [index, setIndex] = useState(1); // 1-based to match filenames
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [fullscreen, setFullscreen] = useState(false);

  const prev = useCallback(() => setIndex((v) => Math.max(1, v - 1)), []);
  const next = useCallback(
    () => setIndex((v) => Math.min(slideCount, v + 1)),
    [slideCount]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "f" || e.key === "F") setFullscreen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  function slideUrl(n: number) {
    return `/api/abivax/presentations/${deckId}/slides/${n}`;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/abivax/spine/presentations"
            className="text-sm text-slate-500 hover:text-slate-300"
          >
            ← Presentations
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-100">
            {deckTitle}
          </h1>
          <p className="text-sm text-slate-400">
            {audience} · Meeting: {meetingDate}
            {openGapCount > 0 ? (
              <span className="ml-3 rounded-full border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 text-xs text-amber-300">
                {openGapCount} open data gap{openGapCount !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="ml-3 rounded-full border border-emerald-700/40 bg-emerald-900/20 px-2 py-0.5 text-xs text-emerald-300">
                No data gaps
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFullscreen((v) => !v)}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            title="Toggle fullscreen (F)"
          >
            {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
          <a
            href={`/api/abivax/presentations/${deckId}/pptx`}
            className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            Download PPTX
          </a>
        </div>
      </header>

      {/* Main viewer */}
      <div
        className={
          fullscreen
            ? "fixed inset-0 z-50 flex flex-col bg-slate-950 p-4"
            : "rounded-xl border border-slate-700/50 bg-slate-950 p-4"
        }
      >
        {/* Nav bar */}
        <div className="mb-3 flex items-center justify-between">
          {fullscreen ? (
            <>
              <p className="text-sm font-medium text-slate-100">{deckTitle}</p>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-400">
                  {index} / {slideCount}
                </p>
                <button
                  onClick={() => setFullscreen(false)}
                  className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Esc
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                Slide {index} of {slideCount} · ← → to navigate · F for fullscreen
              </p>
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  disabled={index === 1}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800"
                >
                  ← Prev
                </button>
                <button
                  onClick={next}
                  disabled={index === slideCount}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Slide image */}
        <div
          className={
            fullscreen
              ? "relative flex flex-1 items-center justify-center overflow-hidden"
              : "relative overflow-hidden rounded-lg border border-slate-700/30 bg-slate-900"
          }
        >
          {/* Preload adjacent slides */}
          {[index - 1, index + 1].map((n) =>
            n >= 1 && n <= slideCount ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`preload-${n}`}
                src={slideUrl(n)}
                alt=""
                className="hidden"
                aria-hidden
              />
            ) : null
          )}
          {/* Current slide */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`slide-${index}`}
            src={slideUrl(index)}
            alt={`Slide ${index} of ${deckTitle}`}
            className={
              fullscreen
                ? "max-h-full max-w-full object-contain"
                : "w-full object-contain"
            }
            style={fullscreen ? {} : { aspectRatio: "16/9" }}
            onLoad={() => setLoaded((v) => ({ ...v, [index]: true }))}
          />
          {!loaded[index] ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : null}
        </div>

        {/* Thumbnail strip */}
        {!fullscreen ? (
          <div className="mt-3 overflow-x-auto">
            <div className="flex min-w-max gap-2 pb-1">
              {Array.from({ length: slideCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setIndex(n)}
                  className={`relative shrink-0 overflow-hidden rounded border transition-all ${
                    n === index
                      ? "border-amber-500 ring-1 ring-amber-500/40"
                      : "border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                  style={{ width: 120, height: 67.5 }}
                  title={`Slide ${n}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slideUrl(n)}
                    alt={`Slide ${n}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-medium text-white drop-shadow">
                    {n}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
