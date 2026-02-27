# Today Page — Visual Polish Critique (Post-Meeting Mode)

**Queue item:** `claude-design-today-layout-1` (visual polish pass)
**Date:** 2026-02-26
**Scope:** Styling only — no structural changes. Working from the current post-structural-pass layout.

---

## 1. What is wrong (specific)

The structural changes are in place. The problems now are visual weight, contrast, and readability — not organization.

### A. Next Moves items carry no visual weight

List items are `text-xs text-slate-300 space-y-1`. This is the same size and color used for sub-labels, metadata, and change card descriptions. Nothing visually signals "you need to do this." The `- ` text prefix reinforces the flat look — it's a rendered dash, not a list marker, and gives no visual affordance.

### B. Section h2 headings are smaller than body text

`text-xs font-semibold uppercase tracking-wider` makes section titles visually lighter than the body text they govern. A heading in all-caps at 12px with heavy letter-spacing creates a visual label, not an anchor. The eye skips it in scanning.

### C. Change Trace: `nextMove` is the most actionable line, but reads last and looks weakest

Order in each change card:
1. `sourceLabel` — `text-xs text-slate-100` (most prominent)
2. `status` badge — `text-[10px] text-cyan-300` (10px is near-illegible)
3. `→ impacted` — `text-[11px] text-slate-400`
4. `→ reviewWhere` — `text-[11px] text-slate-500`
5. `nextMove` — `text-[11px] text-slate-300` ← **the thing Mike should do is last and lightest**

The visual hierarchy is inverted. The source event title is the least actionable element yet reads most prominently.

### D. Nested border-on-border creates visual noise

The inner cards inside each column section use `rounded-md border border-slate-700/50 bg-slate-900/30` inside a section already bordered with `border-emerald-700/40`. This creates three stacked border layers in some views (outer section → inner card → change card). The borders don't add hierarchy — they add clutter.

### E. The count tile grid is visually heavy for low-value content

The 3+1 review queue tiles (`rounded-md border border-cyan-800/30 bg-slate-900/30 p-2`) use the same card styling as Change Trace items. At a glance, "Wiki review: 4 open" looks as important as "Email: NetSuite offer — next move: review contract terms." They should look much lighter.

### F. Column color accents are too similar in depth

`bg-emerald-950/15` (left) and `bg-cyan-950/15` (right) are both nearly black at 15% opacity. The color comes through only in the h2 and border. In peripheral vision, the two columns look like the same thing. More contrast in the background tint would let the purpose distinction register faster.

### G. `status` badge at `text-[10px]` is unreliable

10px uppercase + tracking is illegible at common display scaling. "ENRICHED", "NORMALIZED" etc. carry signal — they need to be readable at a glance.

---

## 2. Visual hierarchy recommendation

The desired reading order for post-meeting mode (top to bottom, left to right):

```
1. Phase label + day summary (what kind of moment is this)
2. Next Moves — the 2-3 things Mike must do (left, prominent)
3. What Changed — the 2-3 most actionable system changes (right, prominent)
4. Entity context on demand (linked names within items)
5. Upcoming meeting (left, subdued — reference only)
6. Review queue counts (right, very subdued — maintenance)
```

Current order puts queue counts and change card titles at parity. Proposed order makes actions and actionable changes the primary visual layer, everything else secondary.

---

## 3. Styling changes by section

### Phase header

| Element | Current | Proposed |
|---|---|---|
| `h2` phase label | `text-xs font-semibold uppercase tracking-wider text-slate-300` | `text-[11px] uppercase tracking-wider text-slate-500` — demote to sublabel |
| `dayLabel` | `text-sm text-slate-100` | `text-base font-medium text-white` — make this the primary read |
| `phaseSummary` | `text-xs text-slate-400` | `text-sm text-slate-300` — promote; this is the first real sentence |
| Metric badges (2 pills) | Two `rounded-full border ... px-2 py-1 text-[11px]` | Collapse to a single `text-[11px] text-slate-500` inline text: `"N meetings · updated T"` — no pills needed |

Outcome: The day summary and phase sentence become the visual entry point. The label line recedes.

---

### Left column — Next Moves

| Element | Current | Proposed |
|---|---|---|
| `h2` "Next Moves" | `text-xs font-semibold uppercase tracking-wider text-emerald-300` | `text-sm font-semibold text-emerald-400` — remove all-caps, make it larger |
| Sublabel "Your actions" | `text-[11px] text-emerald-200` | Keep, reduce to `text-[11px] text-emerald-300/60` |
| Inner card | `rounded-md border border-slate-700/50 bg-slate-900/30 p-3` | Remove card wrapper — replace with `border-t border-slate-700/40 pt-3 mt-3` |
| Card label "Next Moves" | `text-xs uppercase tracking-wider text-slate-400` | Remove entirely — the section h2 already says this |
| List `<ul>` | `space-y-1` | `space-y-2.5` |
| Each `<li>` | `text-xs text-slate-300` with `- ` prefix | `text-sm text-slate-100 border-l-2 border-emerald-600/50 pl-2.5` — remove `- ` prefix |

**Left border accent convention:** `border-l-2 border-emerald-600/50` = "this is a Mike action item." Visual shorthand: green left stripe = operator work.

---

### Right column — Change Trace cards

| Element | Current | Proposed |
|---|---|---|
| `h2` "What Changed" | `text-xs font-semibold uppercase tracking-wider text-cyan-300` | `text-sm font-semibold text-cyan-400` — same treatment as left h2 |
| Inner "What changed" sub-label | `text-xs uppercase tracking-wider text-slate-400` | Remove — column h2 already says this |
| `waterfallReviewedLabel` timestamp | `text-[11px] text-slate-500` | Keep — good, correctly subdued |
| Change card `sourceLabel` | `text-xs text-slate-100` | `text-sm font-medium text-white` |
| Change card `nextMove` line | `text-[11px] text-slate-300` — last line | Move to second line (after title). Change to `text-sm text-slate-200` |
| Change card `status` badge | `text-[10px] uppercase tracking-wider text-cyan-300` | `text-xs text-cyan-300` — minimum 12px |
| Change card `→ impacted` | `text-[11px] text-slate-400` | `text-[11px] text-slate-300` — slightly brighter; these are entity refs |
| Change card `→ reviewWhere` | `text-[11px] text-slate-500` | Keep — last, correctly dim |
| Change card border (with nextMove) | `border-slate-700/40 bg-slate-900/30` | Add `border-l-2 border-amber-600/40` — amber left stripe = "system flagged, needs attention" |
| Change card (no nextMove / informational) | Same as above | Use `border-slate-700/30 bg-slate-900/20` only — lighter, no accent |

**Left border accent convention:** `border-l-2 border-amber-600/40` = "system recorded a signal that needs Mike's attention." Amber stripe = system work. Visually distinct from the green stripe on the left column.

**New Change Trace card reading order:**
```
[sourceLabel — white, medium weight]            [status — xs cyan]
[nextMove — slate-200, prominent]
→ [impacted entities — slate-300, small]
→ [reviewWhere destination — slate-500, smallest]
```

---

### Right column — Review queue counts

| Element | Current | Proposed |
|---|---|---|
| 3+1 tile grid | Four `rounded-md border border-cyan-800/30 bg-slate-900/30 p-2 text-xs` cards | Replace entirely with one `text-[11px] text-slate-500 mt-3` line: `"Review queue: N content · N wiki · N intel · N agent tasks"` |
| High-priority count | `text-amber-300` inline | Append `(N high)` in `text-amber-400` if highPriorityPending > 0 |

One line instead of four cards. Saves significant vertical space for Change Trace breathing room.

---

### Column backgrounds

| | Current | Proposed |
|---|---|---|
| Left (emerald) | `bg-emerald-950/15 border-emerald-700/40` | `bg-emerald-950/25 border-emerald-600/30` |
| Right (cyan) | `bg-cyan-950/15 border-cyan-700/40` | `bg-slate-900/50 border-cyan-700/30` |

Slightly more contrast on the left column background, and shift the right column to a neutral dark — the cyan tint on a section full of amber-accented cards creates a color mixing problem. A neutral dark bg lets the amber card accents do the work.

---

### Column proportions

| | Current | Proposed |
|---|---|---|
| Grid | `xl:grid-cols-2` (equal) | `xl:grid-cols-[5fr_4fr]` |

The operator actions lane deserves slightly more width. 5:4 is subtle — doesn't look lopsided, but gives actions more breathing room on wide displays.

---

## 4. Pending vs. resolved / actionable vs. informational visual system

Use left border accents as the consistent signal. No new icons or badges needed — just two colors in the existing Tailwind palette:

| State | Visual treatment |
|---|---|
| **Mike action item** (Next Moves) | `border-l-2 border-emerald-600/50 pl-2.5` on `<li>` |
| **System signal, needs review** (Change Trace with nextMove) | `border-l-2 border-amber-600/40` on change card |
| **Informational only** (change trace with no nextMove) | No accent border, `opacity-80` or lighter bg |
| **Resolved/done** (if Codex marks complete) | `line-through text-slate-500` + no accent border |
| **High-priority** (queue or agent items flagged high) | Inline `text-amber-400` count only — not a badge |

This system is:
- Three states max (actionable, signal, done)
- Color-coded but accessible without color (position in column implies purpose)
- Uses existing Tailwind classes — no new design tokens

---

## 5. What Codex should implement (highest ROI first)

All changes are in `TodayBriefClient.tsx` class strings only — no logic changes.

**Step 1 — Next Moves list items (10 min, biggest readability gain)**
- `<li>`: change `text-xs text-slate-300` → `text-sm text-slate-100 border-l-2 border-emerald-600/50 pl-2.5`
- `<ul>`: `space-y-1` → `space-y-2.5`
- Remove `- ` prefix from each `<li>` render string (i.e., `- {renderLinkedText(item)}` → `{renderLinkedText(item)}`)
- Remove the inner card wrapper (`rounded-md border border-slate-700/50`) from the Next Moves block — keep just `mt-3`
- Remove the "Next Moves" sub-label inside the card (section h2 is sufficient)

**Step 2 — Change Trace card: swap nextMove to second position, resize text (15 min)**
- Move `nextMove` render block to immediately after `sourceLabel` div
- `nextMove`: `text-[11px] text-slate-300` → `text-sm text-slate-200`
- `sourceLabel`: `text-xs text-slate-100` → `text-sm font-medium text-white`
- `status` badge: `text-[10px]` → `text-xs`
- For cards where `c.nextMove` exists: add `border-l-2 border-amber-600/40` to the `<li>` className

**Step 3 — Collapse count tiles to one line (5 min)**
Replace the `grid gap-2 sm:grid-cols-3` div (the 3+1 tile block) with a single `<p>` line of queue summary text. Format: `"Review queue: N content · N wiki · N intel · N agent tasks"` in `text-[11px] text-slate-500 mt-3`. Append `(N high)` in `text-amber-400` if any queue has `highPriorityPending > 0`.

**Step 4 — Section h2 sizing (5 min)**
- Both column `h2` elements: add `text-sm` and remove `uppercase tracking-wider` OR keep uppercase but step up to `text-xs font-semibold` minimum (current `text-xs` with tracking is visually too small)
- Bump `dayLabel` in the header to `text-base font-medium text-white`
- Bump `phaseSummary` to `text-sm text-slate-300`

**Step 5 — Column widths (2 min)**
`xl:grid-cols-2` → `xl:grid-cols-[5fr_4fr]`

Steps 1–3 are independent and can ship in any order. Together they address the three most visible problems: flat action items, inverted change card hierarchy, and oversized queue tile blocks.
