# Program Page — Visual Hierarchy Critique: Status Emphasis and Pillar Readability

**Queue item:** `claude-design-program-layout-1`
**Date:** 2026-02-26
**Targets:** Program page top area · Pillar Workboard · status pill semantics · evidence/request visibility

---

## 1. What is wrong (specific)

### A. Every evidence request status uses the same amber pill — received looks identical to waiting

The Evidence Requests section shows five possible statuses: `received`, `partial`, `awaiting-response`, `active-fact-finding`, `active-support`. Every status renders as the same amber pill:

```
border-amber-700/40 bg-amber-900/20 text-amber-200 text-[10px] uppercase tracking-wider
```

"Received" (done — Mike has the data) looks the same as "awaiting-response" (blocked — Mike is waiting on someone). This is the primary readability failure on this page. A scan of the Evidence Requests section gives no color signal about what is resolved vs. what is stuck.

### B. The Pillar Workboard appears after four full sections of content

Current page order:
1. Status bar ✓
2. Pillar Evidence Requests (full section)
3. Process Flow Scaffolds (full section)
4. CFTI Controls Intake (full section — stats tiles + detail)
5. CFTI Control Register (full section — stats tiles + detail)
6. **Pillar Workboard** ← the main program command surface

Mike has to scroll past four full sections before reaching the workboard. The workboard should be second after the status bar. The other sections are deep-dive layers that should appear below or behind a toggle.

### C. Within Pillar Workboard cards, the most actionable lines are the smallest and dimmest

Each pillar card shows (in order):
```
[pillar pill] [N active signals]
[executivePrompt — text-xs text-slate-400]
Evidence / Owners / ERP mapping [text-[11px] text-slate-300]
Open: [first open item — text-[11px] text-slate-400]   ← ACTIONABLE
Waiting: [first waiting-on text — text-[11px] text-slate-400]  ← ACTIONABLE
[Queue N | Gaps N | Access N | Waiting evidence N]
[Top work items — list of flat cards]
[Open deck gaps — list of flat cards]
```

"Open:" and "Waiting:" are the lines Mike needs to act on — but they render at `text-[11px] text-slate-400`, the same visual weight as the evidence metadata labels two lines above them.

### D. The 4-cell mini-grid (Queue/Gaps/Access/Waiting evidence) adds noise without signal

Each pillar card contains a 4-cell mini count grid: Queue, Gaps, Access, Waiting evidence. These are bare numbers in identically styled small boxes. They don't indicate what's notable (is 3 "waiting evidence" good or bad for this pillar?), they add vertical height, and they duplicate data that's already in the Evidence Requests section above.

### E. Evidence requests are not sorted by urgency

Within each pillar's evidence card list, requests appear in their canonical order — not sorted by status. A `received` item can appear before an `awaiting-response` item. Mike should see what is blocking him first; what is done should recede.

### F. Section title says "Awaiting Responses" but shows all requests including received

"Pillar Evidence Requests (Awaiting Responses)" — but received items appear in this section. The title-content mismatch creates a trust problem: is this showing only what's pending, or everything?

### G. Status pill at `text-[10px]` is illegible

Same problem as Today page. At 10px uppercase with letter-spacing, words like "AWAITING-RESPONSE" and "ACTIVE-FACT-FINDING" are not readable at normal display scaling.

### H. Pillar workboard top work item cards have no urgency differentiation

All work item `<li>` cards render identically: `rounded border border-slate-700/40 bg-slate-950/30 px-2 py-1 text-xs text-slate-300`. Milestone items with a due date within 7 days look the same as deck gap items with no due date.

---

## 2. Status pill color system (evidence requests)

Replace the uniform amber pill with a semantically differentiated color set. No new Tailwind classes needed — all colors are already in use elsewhere in the app.

| Status | Semantic meaning | Proposed pill style |
|---|---|---|
| `received` | Done — Mike has the data | `border-emerald-700/40 bg-emerald-900/20 text-emerald-300` |
| `partial` | In progress — some data in hand | `border-cyan-700/40 bg-cyan-900/20 text-cyan-300` |
| `awaiting-response` | Blocked — Mike is waiting on someone | `border-rose-700/40 bg-rose-900/20 text-rose-300` |
| `active-fact-finding` | In motion — Codex/Mike working it | `border-slate-600/40 bg-slate-900/40 text-slate-300` |
| `active-support` | In motion — vendor/external support active | `border-slate-600/40 bg-slate-900/40 text-slate-300` |

Reading convention established:
- **Rose** = waiting on someone (read: blocked)
- **Emerald** = received/done (read: resolved)
- **Cyan** = partial (read: in progress)
- **Slate** = in motion (read: system handling)

This is the same color logic used in the rest of the app (emerald = good, amber/rose = attention, cyan = neutral-active). No new conventions.

Additionally: all status pills should be `text-xs` minimum (up from `text-[10px]`).

---

## 3. Section ordering recommendation

**Proposed page order:**

```
1. Header (stays)
2. Status bar / 4-tile (stays — see note on 4th tile below)
3. Pillar Workboard  ← move UP from position 6
4. Evidence Requests ← stays, but filtered by default (see below)
5. Process Flow Scaffolds (stays)
6. CFTI Controls Intake + Register ← keep collapsed by default
7. Operational Detail (stays collapsed)
```

This requires only moving the `<section>` blocks in the JSX. No data or logic changes.

**4th status bar tile:** The current tile is "Open Access (material): N" — a count. The first three tiles are dates. Consider replacing the 4th tile with "Evidence: N received · N waiting" — a cross-pillar evidence snapshot that matches the program's current focus. Or replace with "Kickoff Target: Apr 2026" since that's the active milestone now that selection is done.

---

## 4. Pillar Workboard card improvements

### The "Open / Waiting" lines should be the most prominent body text

**Current:** `text-[11px] text-slate-400` — same as sub-labels
**Proposed:** `text-sm text-slate-200` for the `Open:` text, `text-sm text-amber-200` for `Waiting:` text (amber signals something blocked)

Remove the `Open:` and `Waiting:` prefix labels — they add two characters of noise. Replace with visual markers:
- For open items: `→ {openItems[0]}`
- For waiting items: render with amber color, no prefix needed (color communicates "waiting")

### Replace the 4-cell count mini-grid with a single status summary line

Current:
```
[Queue N] [Gaps N] [Access N]
[Waiting evidence N]           (col-span-3)
```

Proposed — one `text-[11px]` line:
```
"Queue N · Gaps N · Access N · Evidence: N received, N waiting"
```

With the "N waiting" portion in `text-rose-300` if waiting > 0. Frees 24px+ of vertical height per card, and the single-line format scans faster than a 4-cell grid.

### Sort evidence requests within each pillar card

Order: `awaiting-response` → `partial` → `active-*` → `received`

Received items should appear last (or be collapsed/dimmed). The requesting-person label ("Sent to: Trinidad") should be visually prominent since it tells Mike who owes him a response.

**"Sent to:" line improvement:**
Current: `text-[11px] text-slate-400`
Proposed: `text-[11px] text-slate-200` — this is a name, not metadata. It should be legible.

### Add urgency accent to workboard action items within 7–14 days

Current: all `<li>` cards are `border-slate-700/40 bg-slate-950/30 text-slate-300`.

For items with `due` within 14 days: add `border-l-2 border-amber-600/50` left accent (same convention as Today page's amber accent for "needs attention"). Items with no due date or far-out dates: no accent.

This requires passing the parsed due date through to the workboard item — the data is already there in `actionQueue[].due`.

---

## 5. Evidence Requests section improvements

### Fix the section title

**Current:** "Pillar Evidence Requests (Awaiting Responses)"
**Proposed:** "Evidence Requests by Pillar" — the status pills carry the actual state; the title doesn't need to pre-filter

### Sort requests within each pillar article

Within each pillar's `<ul>`, sort requests: `awaiting-response` first, `partial` second, `active-*` third, `received` last. Consider collapsing received items behind a `<details>` toggle (e.g., "1 received — show") so the default view only shows open/blocked items.

### Show the requesting-person (sentTo) more prominently

**Current:** `Sent to: {r.sentTo}` at `text-[11px] text-slate-400`
**Proposed:** `{r.sentTo}` in `text-[11px] text-slate-200 font-medium` — the person name is the most actionable piece (Mike needs to know who he's waiting on). The "Sent to:" prefix can be dropped or kept as very dim text before the name.

### Add "received" visual treatment to completed request cards

When `r.status === "received"`: dim the card with `opacity-60` or use a lighter `bg-slate-950/10` background. This visually separates done items from open ones without hiding them.

---

## 6. What Codex should implement (highest ROI first)

**Step 1 — Status pill color map (15 min, highest impact)**

In `program/page.tsx`, replace the hardcoded amber pill in the evidence request `<li>` block with a function:

```
statusPillTone(status: string): string
  "received"           → "border-emerald-700/40 bg-emerald-900/20 text-emerald-300"
  "partial"            → "border-cyan-700/40 bg-cyan-900/20 text-cyan-300"
  "awaiting-response"  → "border-rose-700/40 bg-rose-900/20 text-rose-300"
  default              → "border-slate-600/40 bg-slate-900/40 text-slate-300"
```

Also: change `text-[10px]` → `text-xs` on all status pills in this page.

**Step 2 — Move Pillar Workboard above Evidence Requests (5 min)**

In the JSX return, move the `<section>` block containing "Pillar Workboard (This Week)" (currently after CFTI Register) to appear immediately after the 4-tile status bar section. No logic changes — just reorder the JSX blocks.

**Step 3 — Promote "Open:" and "Waiting:" lines in pillar cards (10 min)**

In the pillar Workboard card's baseline block:
- `baseline.openItems[0]` text: `text-[11px] text-slate-400` → `text-sm text-slate-200`
- `baseline.waitingOn[0]` text: `text-[11px] text-slate-400` → `text-sm text-amber-200` (amber = blocked/waiting)
- Drop the `Open:` prefix, replace with `→ ` prefix (less noise)

**Step 4 — Replace 4-cell count grid with one summary line (10 min)**

In each pillar Workboard card, replace the `grid grid-cols-3 gap-1` block with a single `<p className="mt-2 text-[11px] text-slate-500">` line:

```
"Queue {actionCount} · Gaps {deckGapCount} · Access {accessCount}"
```

With `evidenceSummaryByPillar.get(pid).waiting > 0` appended as `· {waiting} evidence waiting` in `text-rose-300`.

**Step 5 — Sort evidence requests by status within each pillar (10 min)**

In the Evidence Requests section, before mapping `requests`, sort by status priority:
```
priority: awaiting-response=0, partial=1, active-*=2, received=3
```

Also: dim received cards with `opacity-60` or a reduced background opacity.

Steps 1 and 2 are independent and can ship first. Together they address the two most-reported issues: color blindness to "received vs. waiting" and the workboard being buried.
