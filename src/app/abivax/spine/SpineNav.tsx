"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";

type NavItem = { href: string; label: string; exact: boolean };

const operateItems: NavItem[] = [
  { href: "/abivax/spine/today", label: "Today", exact: false },
  { href: "/abivax/spine/program-overview", label: "Program Overview", exact: false },
  { href: "/abivax/spine/board-review", label: "Board Review", exact: false },
  { href: "/abivax/spine/team", label: "ERP Team", exact: false },
  { href: "/abivax/spine/delivery-models", label: "Delivery Models", exact: false },
  { href: "/abivax/spine/p2p", label: "P2P Intelligence", exact: false },
  { href: "/abivax/spine/p2p-review", label: "P2P Review", exact: false },
  { href: "/abivax/spine/p2p-analytics", label: "P2P Analytics", exact: false },
  { href: "/abivax/spine/r2r", label: "R2R Brief", exact: false },
  { href: "/abivax/spine/treasury", label: "Treasury", exact: false },
  // { href: "/abivax/spine/reporting", label: "Reporting Brief", exact: false }, // coming
  { href: "/abivax/spine/presentations", label: "Presentations", exact: false },
];

const controlRoomItems: NavItem[] = [
  { href: "/abivax/spine/search", label: "Wiki", exact: false },
  { href: "/abivax/spine/documents", label: "Documents", exact: false },
  { href: "/abivax/spine/process-flows", label: "Process Flows", exact: false },
  { href: "/abivax/spine/program", label: "Program Ops", exact: false },
  { href: "/abivax/spine/notes", label: "Notes", exact: false },
  { href: "/abivax/spine/timeline", label: "Timeline", exact: false },
  { href: "/abivax/spine/people", label: "People", exact: false },
  { href: "/abivax/spine/company", label: "Company Intel", exact: false },
  { href: "/abivax/spine/system-map", label: "System Map", exact: false },
  { href: "/abivax/spine/budget", label: "Commercial", exact: false },
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

  const renderNavItems = (items: NavItem[]) =>
    items.map(({ href, label, exact }) => {
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
    });

  return (
    <nav className="sticky top-8 space-y-4">
      {/* Search Box */}
      <form onSubmit={handleSearch}>
        <input
          list="spine-search-suggestions"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search wiki (people / systems / meetings)..."
          className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        />
        <datalist id="spine-search-suggestions">
          <option value="Hema Keshava" />
          <option value="Didier Blondel" />
          <option value="Adrian Holbrook" />
          <option value="Jade Nguyen" />
          <option value="Camille Girard" />
          <option value="Sage" />
          <option value="Trustpair" />
          <option value="Agicap" />
          <option value="NetSuite" />
          <option value="SAP" />
        </datalist>
      </form>

      <div className="space-y-3">
        <details open className="rounded-md border border-slate-800/80 bg-slate-900/30 p-2">
          <summary className="cursor-pointer px-1 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Operate
          </summary>
          <div className="mt-2 space-y-0.5">{renderNavItems(operateItems)}</div>
        </details>

        <details className="rounded-md border border-slate-800/80 bg-slate-900/20 p-2">
          <summary className="cursor-pointer px-1 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Control Room
          </summary>
          <div className="mt-2 space-y-0.5">{renderNavItems(controlRoomItems)}</div>
          <div className="mt-2 border-t border-slate-800 pt-2">
            <Link
              href="/abivax/spine/plan"
              className="block rounded-md px-3 py-2 text-xs text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
            >
              Plan
            </Link>
          </div>
        </details>
      </div>

      <div className="rounded-md border border-slate-800/80 bg-slate-900/20 p-3">
        <p className="text-[11px] uppercase tracking-widest text-slate-500">Intent</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Operator pages first. Control-room pages are for detail, QA, and agent context.
        </p>
      </div>
    </nav>
  );
}
