# Today Page — Post-Meeting Layout Critique

**Queue item:** `claude-design-today-layout-1`
**Date:** 2026-02-26
**Targets:** Today page top area · Your Day lane · Our Work Queue / Change Trace

---

## 1. What is wrong (specific)

### A. The two columns carry overlapping content

In `post_meeting` mode:
- **Left column ("Your Day")** shows `likelyTopicsItems` = `changeTrace.map(c => sourceLabel | status)` — a summary of changes
- **Right column ("Our Work Queue")** shows the same `changeTrace` items in full card form

The same data appears twice at different fidelity levels. Mike's eye has to decide which version to trust.

### B. Change Trace is buried under count tiles

Before reaching Change Trace (the highest-value post-meeting content), the right column forces Mike to scan:
- 3 review queue count tiles (Today Content Review, Wiki Review, Company Intel Review)
- 1 agent backlog tile
- 4 waterfall stat chips (Emails scanned, High-signal, Review now, Tuning)

None of these answer "what changed" or "what do I do next." They are system health metrics that belong below the fold, not above Change Trace.

### C. "Your Day" in post-meeting mode still leads with the meeting card

After the meeting ends, the top slot in the left column shows:
- Meeting title
- Time + mode
- Primary meeting reason (system-generated string like "Most recent started meeting selected")
- Phase summary

The meeting is over. The primary meeting reason line ("Most recent started meeting selected") is a system label that should never surface to the user. The phase summary duplicates what the header already says.

### D. Section headers don't adapt to phase

"Morning Brief" is hardcoded regardless of time or phase. At 4pm post-meeting, this is wrong. "Your Day" and "Our Work Queue" give no quick-scan differentiation of purpose — both are blue-on-dark, similarly weighted.

### E. Change Trace cards have noisy prefix labels

Each card shows:
```
Impacted: entity1 | entity2 | entity3
Review: wiki_review_queue
```

"Impacted:" and "Review:" are unnecessary prefixes — the context is obvious. The review destination ("wiki_review_queue") is a system identifier, not plain language. Mike can't act on it without translation.

### F. "Operator lane" / "Codex + Mike" sublabels don't do enough work

These two small labels below the section headers are the only thing distinguishing Mike's lane from the system lane. They're easy to miss. The columns feel visually parallel when they serve different purposes.

---

## 2. Before vs. after (conceptual)

### Current top-two-screen layout (post_meeting):

```
┌─────────────────────────────────────────────────────────┐
│ Morning Brief                 Meetings: N | Updated: T  │
└─────────────────────────────────────────────────────────┘
┌────────────────────────┐  ┌────────────────────────────┐
│ YOUR DAY               │  │ OUR WORK QUEUE             │
│ Operator lane          │  │ Codex + Mike               │
│                        │  │                            │
│ ┌──────────────────┐   │  │ Today Content: N  Wiki: N  │
│ │ Priority Meeting  │   │  │ Intel: N          Agents:N │ ← noise
│ │ [title]          │   │  │                            │
│ │ [time | mode]    │   │  │ Change Trace (Since Last…) │
│ │ [reason text]    │   │  │ [4 stat chips]             │ ← noise
│ │ [phase summary]  │   │  │ [change card 1]            │
│ └──────────────────┘   │  │ [change card 2]            │
│                        │  │ ...                        │
│ ┌──────────┐┌─────────┐│  │                            │
│ │What Chgd ││Next Mvs ││  │ [Codex review items]       │
│ │[trace    ││[moves]  ││  │ ...                        │ ← low priority
│ │dupe data]│└─────────┘│  │                            │
│ └──────────┘           │  │                            │
└────────────────────────┘  └────────────────────────────┘
```

### Proposed post-meeting layout:

```
┌─────────────────────────────────────────────────────────┐
│ Post-Meeting Summary          [last session name + time]│
│ [phaseSummary — 1 sentence]                             │
└─────────────────────────────────────────────────────────┘
┌────────────────────────┐  ┌────────────────────────────┐
│ NEXT MOVES             │  │ WHAT CHANGED               │
│ Your actions           │  │ System trace               │
│                        │  │                            │
│ • [action 1]           │  │ [change 1 — plain title]   │
│ • [action 2]           │  │  → [entity] · [where]      │
│ • [action 3]           │  │                            │
│                        │  │ [change 2 — plain title]   │
│ ─────────────────────  │  │  → [entity] · [where]      │
│ Upcoming               │  │                            │
│ [next meeting if any]  │  │ [change 3]                 │
│                        │  │  → ...                     │
│                        │  │                            │
│                        │  │ ─ Review queue ───────────│
│                        │  │ Content: N  Wiki: N  ↓     │
└────────────────────────┘  └────────────────────────────┘
```

Key differences:
- Left column leads with actions (Mike's work), not the expired meeting card
- Right column leads with Change Trace, not queue count tiles
- Queue counts demoted below the fold or collapsed to a single summary line
- Section headers changed to describe what Mike does with each column

---

## 3. Three layout options with tradeoffs

### Option A: Priority Bands (recommended)

Replace the two-column grid with three full-width horizontal bands:

```
Band 1 [full width] — Phase header + 1-line summary (30px tall, dark bg)
Band 2 [2-col]      — Left: "Next Moves" (3 bullets) | Right: "What Changed" (top 3 changes)
Band 3 [collapsed]  — System state: queue counts, waterfall stats, Codex backlog
```

**How Band 3 shows:** A single collapsed row showing "3 items in review queue · 2 agent tasks open" that expands on click.

**Tradeoff:** Band 3 requires a toggle. Mike needs to decide once if he wants that layer visible; after that it's muscle memory. Highest ROI for reducing first-load noise.

---

### Option B: Flip hierarchy within existing 2-col structure (lowest-friction change)

Keep the 2-column grid. Change what leads each column:

- **Left column:** Remove meeting card entirely in post_meeting. Lead with "Next Moves" as the primary element (3 bullets, prominent). Keep "What Changed Today" sub-card below it, but rename to "Key Changes" and limit to 3 items.
- **Right column:** Move Change Trace to the top, above the count tiles. Push count tiles to the bottom. Remove the 4 waterfall stat chips entirely.

**Tradeoff:** The left column's "What Changed" still duplicates the right column's Change Trace. This is less clean than Option A but requires only reordering existing elements — no structural changes.

---

### Option C: Single column, ranked list

Convert the post-meeting view to a single ranked vertical list:

```
1. [Phase header]
2. [Top 3 next actions — large text, clear bullets]
3. [Change trace — each change as a compact 2-line entry]
4. [Upcoming / next meeting]
5. [Queue summary — collapsed]
```

**Tradeoff:** Wastes desktop horizontal space. Simpler to implement and scan. Best if Mike typically reads this on a narrow window or tablet. Loses the parallel-lane metaphor entirely.

---

## 4. Wording / title improvements

| Current | Post-meeting replacement | Rationale |
|---|---|---|
| `Morning Brief` | `Post-Meeting Summary` | Reflects actual time/phase |
| `Your Day` | `Next Moves` | Describes what Mike does with it |
| `Operator lane` | *(remove)* | The section title carries this |
| `Our Work Queue` | `What Changed` | Describes the primary content in post-meeting mode |
| `Codex + Mike` | *(remove)* | Unclear what action this implies |
| `Change Trace (Since Last Review)` | `What changed` | Simpler; the date stamp does the "since" work |
| `Impacted: X \| Y \| Z` | `→ X, Y` | Arrow implies "affected"; remove the label |
| `Review: wiki_review_queue` | `→ wiki review` | Plain destination language |
| `Most recent started meeting selected` | *(remove)* | System artifact; never show |
| `Capture / Decide` | `Before you go in` (pre) or *(remove in post)* | Contextual; in post-meeting this slot should be "Next Moves" |
| `Emails scanned: N` / `High-signal: N` / `Review now: N` / `Tuning: N` | *(remove)* | Codex health metrics; Mike doesn't act on these |

**Phase-adaptive header text:**

| Phase | Header label | Subline |
|---|---|---|
| `pre_meeting` | `Today's Brief` | `[N meetings today · Next: meeting name at time]` |
| `in_meeting` | `Live: [meeting name]` | `[mode · started X min ago]` |
| `post_meeting` | `Post-Meeting Summary` | `[last session name · ended approx time]` |
| `idle` | `Program Update` | `[snapshot label]` |

---

## 5. What Codex should implement (highest ROI first)

All changes are in `TodayBriefClient.tsx`. No data changes needed.

**Step 1 — Phase-adaptive header (5 min, highest impact)**
Replace hardcoded `"Morning Brief"` with a phase-adaptive label. Use `brief.todaySummary.dayPhase` to switch between `"Today's Brief"`, `"Post-Meeting Summary"`, and `"Program Update"`.

**Step 2 — Remove meeting card in post_meeting (10 min)**
When `dayPhase === "post_meeting"`, skip the priority meeting card entirely in the left column. Replace the slot with "Next Moves" as the primary (full-height) sub-section. The meeting is over; the card adds no value.

**Step 3 — Move Change Trace above count tiles (10 min)**
In the right column, move the `waterfallUpdate` block (Change Trace) to render before the `grid gap-2 sm:grid-cols-3` count tiles. The count tiles should be last in that column, not first.

**Step 4 — Strip waterfall stat chips (5 min)**
Remove the 4 pill badges: `Emails scanned`, `High-signal`, `Review now`, `Tuning`. These are Codex health metrics; Mike doesn't act on them.

**Step 5 — Fix Change Trace card labels (10 min)**
In each Change Trace `<li>`:
- Remove `Impacted:` prefix — replace with `→ {c.impacted.join(", ")}`
- Replace `Review: {c.reviewWhere}` with a plain-language destination: map `wiki_review_queue` → `wiki review`, `company_intel_review_queue` → `company intel review`, etc. Or just render the value with underscores replaced by spaces.
- Remove `primary meeting reason` line from the meeting card entirely

**Step 6 — Rename section headers conditionally (5 min)**
- Left column: `"Your Day"` → `"Next Moves"` when `dayPhase === "post_meeting" || dayPhase === "idle"`
- Right column: `"Our Work Queue"` → `"What Changed"` when `dayPhase === "post_meeting" || dayPhase === "idle"`
- Remove the `"Operator lane"` and `"Codex + Mike"` sublabels — replace with a single, plainer description if needed (e.g., `"Your actions"` vs. `"System trace"`)

Steps 1–4 can ship together and will visually transform the post-meeting experience without any structural changes to the grid.
