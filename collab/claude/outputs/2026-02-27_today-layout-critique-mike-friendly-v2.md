# Today Page — Post-Meeting Layout Critique (v2)

**Queue item:** `claude-design-today-layout-1`
**Date:** 2026-02-27
**Scope:** v2 pass — focused on three remaining problems after v1 changes were applied:
1. Stale calendar warning messaging
2. Do Now vs Watchlist visual distinction
3. Right column overload (change trace + actions in same column)

---

## Context: What v1 Already Addressed

The v1 outputs (2026-02-26) proposed structural and styling changes that appear to be implemented in the current code:
- Phase-adaptive column titles ("Next Moves" / "What Changed") ✓
- Next Moves items with `border-l-2 border-emerald-600/50 pl-2.5` left accent ✓
- Change Trace cards with `border-l-2 border-amber-600/40` when `nextMove` present ✓
- `xl:grid-cols-[5fr_4fr]` column proportions ✓
- Collapse of count tiles to a single `text-[11px]` review queue stat line ✓
- Section h2 at `text-sm font-semibold` with color accent ✓

**Mike reports the page still reads like a wall of text.** Three specific problems remain unresolved.

---

## 1. What Is Wrong (Specific)

### A. Do Now does not look different from informational content

Current state in the right column (`What Changed`):

```
[Change Trace] ← amber-accented, white sourceLabel — visually prominent
[review queue stat line] ← text-[11px] text-slate-500
[Do now] ← text-xs uppercase tracking-wider text-slate-400 ← same as any sub-label
  [item 1] ← border-cyan-800/20, text-xs text-slate-100, + two pill badges
  [item 2]
[Watchlist (not urgent): N] ← details/summary, text-[11px] text-slate-400
```

The "Do now" label (`text-xs uppercase text-slate-400`) is visually identical to every other sub-label in the column. It carries no more weight than "What changed" or the waterfall timestamp.

Each Do Now item has two pill badges (`area` + `priority`) at `text-[10px]` — machine metadata that Mike does not act on. The badges take up more visual space than the item title and make the list look like a system log.

The item border (`border-cyan-800/20`) is near-invisible. There is no left-stripe accent equivalent to what Change Trace cards and Next Moves items use. Do Now items look like annotations, not actions.

Result: the eye skips Do Now because nothing signals "stop and act."

---

### B. Watchlist is too close to Do Now in visual weight

Current "Watchlist" treatment:

```html
<details>
  <summary class="text-[11px] text-slate-400">
    Watchlist (not urgent): N
  </summary>
  ...
</details>
```

`text-[11px] text-slate-400` is only slightly dimmer than the "Do now" label (`text-xs text-slate-400`). The `(not urgent)` qualifier is in parentheses — easily missed. The structural hierarchy (open vs collapsed) is correct but the visual weight difference is too small. After 3+ items, the two sections blur.

---

### C. Stale calendar warning suppresses the phase summary and reads like system failure

Current behavior when `snapshotStale === true`:
- Amber warning block renders with raw `snapshotStaleHint` text
- `phaseSummary` is **not shown** (gated by `!brief.todaySummary.snapshotStale`)
- Both `snapshotStale` and `hasConflictNow` use identical amber styling: `border-amber-700/40 bg-amber-950/30 text-amber-200`

Three problems with this:

**1. Loss of context.** When the calendar is stale, Mike sees no phase summary and no day context — just an amber warning. The page offers no "here's what we know even without fresh calendar data" baseline. He can't tell if the rest of the page is trustworthy.

**2. Equivalent visual weight to a conflict.** A concurrent meeting conflict is an operational emergency (requires an in-the-moment decision). A stale calendar snapshot is a data freshness notice (Outlook sync ran more than N hours ago). They look identical. This creates false urgency.

**3. Raw backend text.** `snapshotStaleHint` is a system-generated string (e.g., "Calendar snapshot is older than 8 hours. Refresh may be needed."). It reads as a system alarm. Mike can't tell if the whole waterfall is broken or if Outlook just hasn't synced yet.

---

### D. Right column is two different things with no visual break

The right column ("What Changed") contains in order:
1. Change Trace (waterfall trace — informational/retrospective)
2. Review queue stat line (system count — informational)
3. "Do now" label + items (actions — requires Mike's decision)
4. Watchlist (collapsed backlog — future reference)

Items 1–2 are trace/history. Items 3–4 are decisions/actions. There is no visual separator between them. Mike has to scroll through the trace to reach Do Now. On a dense data day, the change trace cards push Do Now below the fold.

---

## 2. Proposed Rewrite/Structure

### Fix A: Do Now visual emphasis

**Goal:** Do Now items should look as prominent as Next Moves items. Both are actions.

Replace the current Do Now item styling:
```
border-cyan-800/20 bg-slate-900/30 text-xs text-slate-100 + two pill badges
```

With:
```
border-l-2 border-amber-500/60 pl-2.5 py-1 text-sm text-slate-100
```

Remove the `area` and `priority` pill badges entirely from Do Now items. Keep only the `why` line if present (`text-[11px] text-slate-400 mt-0.5`).

Upgrade the "Do now" label from `text-xs uppercase text-slate-400` to `text-xs font-semibold text-amber-400` — giving it the same visual hierarchy as the "Next Moves" label (emerald) and "What Changed" (cyan). One color per column per purpose:
- Emerald = Mike's day actions
- Amber = items needing Mike's decision now
- Cyan = system trace

---

### Fix B: Watchlist separator and de-emphasis

Increase the visual gap between Do Now and Watchlist:
1. Add `mt-4 pt-3 border-t border-slate-700/40` before the `<details>` element
2. Dim the Watchlist summary further: `text-[11px] text-slate-500` (currently `text-slate-400`)
3. Rephrase summary: `"On radar (N)"` instead of `"Watchlist (not urgent): N"` — shorter, and the word "radar" signals monitoring without implying urgency

Watchlist item text should be `text-xs text-slate-400` (currently `text-slate-200`). Watchlist is background information, not decisions.

---

### Fix C: Stale calendar warning — decouple from phase summary and reword

**Part 1: Always show phaseSummary**

Remove the `!brief.todaySummary.snapshotStale` gate. Show `phaseSummary` regardless of staleness. The phase summary is valid even with stale calendar data.

**Part 2: Move stale warning below phaseSummary, style differently from conflict**

Current rendering order:
```
dayLabel
conflict warning (amber, if present)
stale warning (amber, if present)  ← same style as conflict
phaseSummary (hidden if stale)
```

Proposed rendering order:
```
dayLabel
conflict warning (amber, if present) ← keep same, it's genuinely urgent
phaseSummary (always shown)
stale warning (muted, if present)  ← demoted to footnote-style
```

**Part 3: Replace raw snapshotStaleHint with a fixed, plain-language message**

Do not render the raw `snapshotStaleHint` string. Replace with a fixed template:

```
Calendar last updated [formatted time from snapshotLabel].
Meetings shown may not reflect recent changes.
Waterfall data is unaffected.
```

The third sentence ("Waterfall data is unaffected") directly answers the question Mike is asking: "is the rest of the page broken?" It is not — only the calendar cache is stale.

**Part 4: Visually differentiate stale from conflict**

| Warning type | Proposed styling |
|---|---|
| Conflict now | `border-amber-700/40 bg-amber-950/30 text-amber-200` (keep current) |
| Calendar stale | `border-slate-600/40 bg-slate-900/40 text-slate-400 text-[11px]` — muted, footnote-weight |

The stale warning should look like a metadata footnote, not an operational alert.

---

### Fix D: Separate trace from actions within right column

Add a visible divider between the change trace and Do Now. Two options:

**Option 1 (minimal):** Add `mt-4 pt-3 border-t border-slate-700/40` before the "Do now" label. This creates a visual chapter break within the column without restructuring anything.

**Option 2 (stronger):** Move Do Now out of the change trace area and treat it as its own card within the right column — same pattern as the `waterfallUpdate` block:

```html
<!-- existing waterfallUpdate block -->
<div class="mt-3 rounded-md border border-cyan-800/30 bg-slate-900/30 p-3">
  [Change Trace]
</div>

<!-- new separator card for Do Now -->
<div class="mt-3 rounded-md border border-amber-800/30 bg-slate-900/30 p-3">
  <div class="flex items-center justify-between">
    <p class="text-xs font-semibold text-amber-400">Do now</p>
    <!-- queue stat inline, right-aligned, text-[11px] text-slate-500 -->
  </div>
  [Do Now items]
  [Watchlist details]
</div>
```

Option 2 gives Do Now its own bordered card with amber accent, creating a clear visual chapter. The review queue stat line moves inside this card header — where it belongs as context for the Do Now list.

---

## 3. Why This Is Better

**Do Now with amber left-stripe accent + amber label:** Mike's eye already understands the three-color system from Next Moves (emerald = my work) and Change Trace (amber = system signal). Making Do Now items amber left-stripe + amber label brings them into the same system and removes the need to learn a new affordance.

**phaseSummary always visible:** This is the one sentence that contextualizes the whole page. Hiding it when the calendar is stale removes the most useful orientation signal precisely when Mike is most uncertain.

**Fixed stale message text:** "Waterfall data is unaffected" is the answer to the implicit question Mike has every time he sees a stale warning. Putting it in the message eliminates the need to investigate.

**Muted stale styling vs amber conflict:** Once the stale warning reads like a footnote visually, Mike can process it in 0.5 seconds and move on. At current amber weight, it competes for attention with the conflict warning and the column headers.

**Separator or card for Do Now:** The review queue stat line currently appears between trace and action — orphaned. Moving it into the Do Now card header gives it meaning: "here's the queue, here's what to do about it."

---

## 4. What Codex Should Implement (Highest ROI First)

All changes are in `TodayBriefClient.tsx`. No data or agent changes needed.

---

**Step 1 — Decouple phaseSummary from stale gate (5 min, highest impact)**

At line 823–825, remove the `!brief.todaySummary.snapshotStale` condition. Always render `phaseSummary`. The stale warning renders after it, not instead of it.

```tsx
// Before (line 823-825):
{!brief.todaySummary.snapshotStale && (
  <p className="mt-2 text-sm text-slate-300">{brief.todaySummary.phaseSummary}</p>
)}

// After:
<p className="mt-2 text-sm text-slate-300">{brief.todaySummary.phaseSummary}</p>
```

---

**Step 2 — Replace stale warning wording and styling (10 min)**

At line 818–821, replace:
```tsx
{brief.todaySummary.snapshotStale && (
  <p className="mt-2 rounded-md border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
    {brief.todaySummary.snapshotStaleHint}
  </p>
)}
```

With:
```tsx
{brief.todaySummary.snapshotStale && (
  <p className="mt-2 rounded-md border border-slate-600/40 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-400">
    Calendar last updated {brief.todaySummary.snapshotLabel.replace(/^Calendar snapshot:\s*/i, "")} —
    meetings shown may not reflect recent changes. Waterfall data is unaffected.
  </p>
)}
```

Move this block to render **after** `phaseSummary`, not before it. The order becomes: dayLabel → conflict (if any) → phaseSummary → stale notice (if any).

---

**Step 3 — Upgrade "Do now" label color and Do Now item styling (15 min)**

At line 971, change label:
```tsx
// Before:
<p className="mt-3 text-xs uppercase tracking-wider text-slate-400">Do now</p>

// After:
<p className="mt-3 text-xs font-semibold text-amber-400">Do now</p>
```

At line 975, change each Do Now `<li>`:
```tsx
// Before:
<li className="rounded-md border border-cyan-800/20 bg-slate-900/30 px-3 py-2">

// After:
<li className="border-l-2 border-amber-500/60 pl-2.5 py-1">
```

Remove the inner `flex justify-between` pill row (`area` + `priority` badges) entirely. Keep only:
- `<p className="text-sm text-slate-100">{item.title}</p>`
- `{item.why && <p className="mt-0.5 text-[11px] text-slate-400">{item.why}</p>}`

---

**Step 4 — Add visual break before Watchlist and dim its text (5 min)**

At line 999, before the `<details>` element, add a wrapper:
```tsx
<div className="mt-4 border-t border-slate-700/40 pt-3">
  <details className="rounded-md border border-slate-700/30 bg-slate-900/20 p-2">
    <summary className="cursor-pointer text-[11px] text-slate-500">
      On radar ({codexWorkQueue.watchlist.length})
    </summary>
    ...watchlist items with text-xs text-slate-400 (down from text-slate-200)...
  </details>
</div>
```

---

**Step 5 — Move review queue stat line inside Do Now area (5 min)**

Move the review queue stat line (currently at line 955–970, between change trace and Do Now) to render between the "Do now" label and the Do Now `<ul>`. This makes the stat a header for the section rather than an orphaned footnote.

```
[Do now]                          Review queue: N content · N wiki (amber if high)
  [item 1]
  [item 2]
  ...
[On radar (N)]                    ← separator + dim details
```

---

## Summary: Change Surface

| File | Lines touched | What changes |
|---|---|---|
| `TodayBriefClient.tsx` | ~818–825 | phaseSummary always rendered; stale warning after phaseSummary |
| `TodayBriefClient.tsx` | ~818–821 | Stale warning: new text template + muted styling |
| `TodayBriefClient.tsx` | ~955–970 | Move review queue stat line to inside Do Now area |
| `TodayBriefClient.tsx` | ~971 | "Do now" label: `text-amber-400 font-semibold` |
| `TodayBriefClient.tsx` | ~975–996 | Do Now items: amber left-stripe, remove pill badges |
| `TodayBriefClient.tsx` | ~999–1016 | Watchlist: separator + dimmer text + rename to "On radar" |

No data files, no agents, no new state, no new components.
