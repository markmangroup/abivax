"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";

const navItems = [
  { href: "/abivax/spine", label: "Overview", exact: true },
  { href: "/abivax/spine/search", label: "Wiki", exact: false },
  { href: "/abivax/spine/people", label: "People", exact: false },
  { href: "/abivax/spine/timeline", label: "Timeline", exact: false },
  { href: "/abivax/spine/budget", label: "Budget", exact: false },
  { href: "/abivax/spine/meetings", label: "Meetings", exact: false },
  { href: "/abivax/spine/notes", label: "Notes", exact: false },
];

export function SpineNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/abivax/spine/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, router]
  );

  return (
    <nav className="sticky top-8 space-y-4">
      {/* Search Box */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        />
      </form>

      <div className="space-y-0.5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Compendium
        </p>
        {navItems.map(({ href, label, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href) && (exact || href !== "/abivax/spine");
          const isEntityPage = pathname.startsWith("/abivax/spine/entity");
          const isWikiActive = href === "/abivax/spine/search" && (pathname.startsWith("/abivax/spine/search") || isEntityPage);

          return (
            <Link
              key={href}
              href={href}
              data-active={isActive || (href === "/abivax/spine/search" && isWikiActive)}
              className="block rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 data-[active=true]:bg-slate-800/80 data-[active=true]:font-medium data-[active=true]:text-slate-100"
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-800 pt-4">
        <Link
          href="/abivax/spine/plan"
          className="block rounded-md px-3 py-2 text-xs text-slate-500 hover:text-slate-400"
        >
          Plan
        </Link>
      </div>
    </nav>
  );
}
