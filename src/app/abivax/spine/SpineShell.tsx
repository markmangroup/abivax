"use client";

import { useEffect, useMemo, useState } from "react";

export default function SpineShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("spine-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
      const sb = window.localStorage.getItem("spine-sidebar");
      if (sb === "false") setSidebarOpen(false);
    } catch {
      // ignore
    }
  }, []);

  const nextThemeLabel = useMemo(() => (theme === "dark" ? "Light" : "Dark"), [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("spine-theme", next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try { window.localStorage.setItem("spine-sidebar", String(next)); } catch {}
      return next;
    });
  };

  return (
    <div data-spine-theme={theme} data-sidebar={sidebarOpen ? "open" : "closed"} className="min-h-screen">
      <div className="mx-auto flex max-w-[1500px] gap-8 px-6 py-8">
        {children}
      </div>

      <div className="fixed bottom-5 right-5 z-50 flex gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-full border border-slate-700/70 bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? "Hide Nav" : "Show Nav"}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-full border border-slate-700/70 bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800"
          title={`Switch to ${nextThemeLabel.toLowerCase()} theme`}
        >
          {nextThemeLabel} Theme
        </button>
      </div>

      <style jsx global>{`
        [data-sidebar='closed'] aside {
          display: none;
        }
        [data-spine-theme='light'] {
          background: #f4f6fb;
          color: #0f172a !important;
        }
        [data-spine-theme='light'] * {
          scrollbar-color: #cbd5e1 #f8fafc;
        }
        [data-spine-theme='light'] h1,
        [data-spine-theme='light'] h2,
        [data-spine-theme='light'] h3,
        [data-spine-theme='light'] h4,
        [data-spine-theme='light'] h5,
        [data-spine-theme='light'] h6,
        [data-spine-theme='light'] p,
        [data-spine-theme='light'] li,
        [data-spine-theme='light'] span,
        [data-spine-theme='light'] summary,
        [data-spine-theme='light'] label,
        [data-spine-theme='light'] td,
        [data-spine-theme='light'] th,
        [data-spine-theme='light'] code,
        [data-spine-theme='light'] pre {
          color: #0f172a !important;
        }
        [data-spine-theme='light'] nav a {
          color: #334155 !important;
        }
        [data-spine-theme='light'] nav a[data-active='true'] {
          color: #0f172a !important;
          background-color: #e8edf5 !important;
        }
        [data-spine-theme='light'] nav p,
        [data-spine-theme='light'] nav summary {
          color: #64748b !important;
        }
        [data-spine-theme='light'] .bg-slate-950 { background: #f4f6fb !important; }
        [data-spine-theme='light'] .bg-slate-900,
        [data-spine-theme='light'] .bg-slate-900\\/20,
        [data-spine-theme='light'] .bg-slate-900\\/30,
        [data-spine-theme='light'] .bg-slate-900\\/40,
        [data-spine-theme='light'] .bg-slate-900\\/50 {
          background-color: rgba(255, 255, 255, 0.9) !important;
        }
        [data-spine-theme='light'] .bg-slate-800,
        [data-spine-theme='light'] .bg-slate-800\\/20,
        [data-spine-theme='light'] .bg-slate-800\\/30,
        [data-spine-theme='light'] .bg-slate-800\\/40,
        [data-spine-theme='light'] .bg-slate-800\\/50 {
          background-color: rgba(248, 250, 252, 0.9) !important;
        }
        [data-spine-theme='light'] .bg-slate-950\\/40 { background-color: rgba(255,255,255,0.95) !important; }
        [data-spine-theme='light'] [class*='bg-slate-9'] { background-color: rgba(255,255,255,0.94) !important; }
        [data-spine-theme='light'] [class*='bg-slate-8'] { background-color: rgba(248, 250, 252, 0.96) !important; }
        [data-spine-theme='light'] [class*='bg-slate-7'] { background-color: rgba(241,245,249,0.96) !important; }
        [data-spine-theme='light'] [class*='border-slate-7'],
        [data-spine-theme='light'] [class*='border-slate-8'] { border-color: #dbe2ea !important; }
        [data-spine-theme='light'] .border-slate-700,
        [data-spine-theme='light'] .border-slate-700\\/30,
        [data-spine-theme='light'] .border-slate-700\\/40,
        [data-spine-theme='light'] .border-slate-700\\/50,
        [data-spine-theme='light'] .border-slate-700\\/60,
        [data-spine-theme='light'] .border-slate-800,
        [data-spine-theme='light'] .border-slate-800\\/30,
        [data-spine-theme='light'] .border-slate-800\\/40,
        [data-spine-theme='light'] .border-slate-800\\/80,
        [data-spine-theme='light'] .border-t {
          border-color: #dbe2ea !important;
        }
        [data-spine-theme='light'] [class*='text-slate-'] { color: #334155 !important; }
        [data-spine-theme='light'] .text-slate-100,
        [data-spine-theme='light'] .text-slate-200,
        [data-spine-theme='light'] [class*='text-slate-100'],
        [data-spine-theme='light'] [class*='text-slate-200'] { color: #0f172a !important; }
        [data-spine-theme='light'] .text-slate-300,
        [data-spine-theme='light'] [class*='text-slate-300'] { color: #1f2937 !important; }
        [data-spine-theme='light'] .text-slate-400,
        [data-spine-theme='light'] [class*='text-slate-400'] { color: #334155 !important; }
        [data-spine-theme='light'] .text-slate-500,
        [data-spine-theme='light'] [class*='text-slate-500'] { color: #475569 !important; }
        [data-spine-theme='light'] .text-slate-600,
        [data-spine-theme='light'] [class*='text-slate-600'] { color: #64748b !important; }
        [data-spine-theme='light'] .hover\\:bg-slate-800:hover,
        [data-spine-theme='light'] .hover\\:bg-slate-800\\/50:hover,
        [data-spine-theme='light'] .hover\\:bg-slate-900\\/60:hover {
          background-color: #eef2f7 !important;
        }
        [data-spine-theme='light'] button:not([class*='bg-emerald-']):not([class*='bg-amber-']):not([class*='bg-cyan-']):not([class*='bg-sky-']) {
          color: #0f172a !important;
        }
        [data-spine-theme='light'] input,
        [data-spine-theme='light'] select,
        [data-spine-theme='light'] textarea {
          color: #0f172a !important;
          background: #ffffff !important;
          border-color: #dbe2ea !important;
        }
        [data-spine-theme='light'] input::placeholder,
        [data-spine-theme='light'] textarea::placeholder {
          color: #94a3b8 !important;
        }
        [data-spine-theme='light'] a {
          color: #0f172a !important;
        }
        [data-spine-theme='light'] [class*='underline'] {
          text-decoration-color: #94a3b8 !important;
        }
        [data-spine-theme='light'] [class*='text-cyan-'] { color: #0e7490 !important; }
        [data-spine-theme='light'] [class*='text-emerald-'] { color: #047857 !important; }
        [data-spine-theme='light'] [class*='text-amber-'] { color: #b45309 !important; }
        [data-spine-theme='light'] [class*='text-rose-'] { color: #be123c !important; }
        [data-spine-theme='light'] [class*='text-violet-'] { color: #6d28d9 !important; }
        [data-spine-theme='light'] [class*='text-sky-'] { color: #0369a1 !important; }
        [data-spine-theme='light'] .text-white { color: #ffffff !important; }
        [data-spine-theme='light'] .bg-emerald-700,
        [data-spine-theme='light'] .bg-amber-700,
        [data-spine-theme='light'] .bg-amber-600,
        [data-spine-theme='light'] .bg-cyan-700,
        [data-spine-theme='light'] .bg-sky-700 {
          color: #fff !important;
        }
        [data-spine-theme='light'] .bg-emerald-900\\/40,
        [data-spine-theme='light'] .bg-cyan-950\\/20,
        [data-spine-theme='light'] .bg-emerald-950\\/20,
        [data-spine-theme='light'] .bg-violet-950\\/20,
        [data-spine-theme='light'] .bg-sky-950\\/20,
        [data-spine-theme='light'] .bg-rose-950\\/20,
        [data-spine-theme='light'] .bg-amber-950\\/20 {
          border-color: #dbe2ea !important;
        }
        [data-spine-theme='light'] .bg-amber-950\\/20 { background-color: rgba(255, 251, 235, 0.85) !important; }
        [data-spine-theme='light'] .bg-cyan-950\\/20 { background-color: rgba(236, 254, 255, 0.85) !important; }
        [data-spine-theme='light'] .bg-emerald-950\\/20 { background-color: rgba(236, 253, 245, 0.85) !important; }
        [data-spine-theme='light'] .bg-violet-950\\/20 { background-color: rgba(245, 243, 255, 0.85) !important; }
        [data-spine-theme='light'] .bg-sky-950\\/20 { background-color: rgba(240, 249, 255, 0.9) !important; }
        [data-spine-theme='light'] .bg-rose-950\\/20 { background-color: rgba(255, 241, 242, 0.9) !important; }
        [data-spine-theme='light'] .shadow-xl {
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06) !important;
        }
      `}</style>
    </div>
  );
}
