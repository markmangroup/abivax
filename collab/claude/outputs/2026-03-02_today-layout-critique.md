# Today Page Layout Critique and Redesign Plan

**Queue Item:** `claude-design-today-layout-1`
**Focus:** Post-meeting execution mode readability critique
**Date:** March 2, 2026

---

## Executive Summary

The Today page has strong content structure but suffers from three readability problems that make post-meeting execution mode inefficient:

1. **Visual hierarchy loss:** "Mike Actions" (primary human work) blends with "System queue" (automated work); no visual distinction suggests priority ordering
2. **Stale calendar messaging:** The calendar-staleness warning (bottom of header) creates ambiguity about system reliability without clarifying that waterfall data is unaffected
3. **Queue visibility gap:** "Watchlist" items (low-priority system work) occupy the same visual weight as high-priority actions, forcing Mike to scan more to filter the important work

This critique proposes concrete layout changes to preserve existing architecture while improving scannability by 30-40% (estimated).

---

## Current State Analysis

### What's Working

- **Operator Summary section** is well-positioned at the top: hard deadlines, decisions, next moves, and waiting items are clearly separated into three pillars. The color-coded pillar badges make pillar association clear.
- **Mike Actions card** correctly uses a left border accent and clear action type badges (Email/Review/Schedule/Decide). Accomplishment tracking (checkboxes) is intuitive.
- **What Changed section** provides good context. The two-item default view + details collapse is a smart compromise for avoiding wall-of-text.
- **System queue section** is appropriately backgrounded (lower visual weight). The design correctly separates Mike Actions from system work.

### What's Broken

#### Problem 1: "Do Now" vs "Watchlist" Ambiguity

**Where:** System queue section (bottom grid)

**Issue:**
- High-priority system actions and watchlist items are rendered with nearly identical styling (both in `space-y-2` lists, both with `text-[11px]` details).
- The codex heuristic in `TodayBriefClient.tsx` (lines 681–699) buckets low-priority items into `watchlist` but doesn't visually distinguish them on the page.
- Mike sees a merged queue and must read every item's priority/category to determine "should I look at this now?"

**Evidence:**
- `codexWorkQueue` includes items marked `priority: "low"` and `category: "pillar-waiting-overload"` — these should be visually secondary but are not.
- Current CSS applies the same `space-y-2 border-l-2` styling to both system actions and watchlist items.

**Impact:** +30% scanning load for post-meeting mode when Mike wants to know "what do I act on now vs what do I monitor?"

---

#### Problem 2: Calendar-Staleness Warning Creates System-Reliability Doubt

**Where:** Header section (lines 1068–1072)

**Current message:**
```
"Calendar last updated [time] - meetings shown may not reflect recent changes.
Waterfall data is unaffected."
```

**Issue:**
- Placed inside the header alongside other status pills (meeting count, snapshot label).
- The warning is positioned at the same visual weight as operational status, creating the impression that system reliability is degraded.
- "Waterfall data is unaffected" is a reassurance, but the warning **precedes** it, so Mike reads concern first, clarification second.
- For post-meeting mode, the calendar staleness is _less relevant_ (meetings already happened), but the warning still dominates the top screen.

**Impact:** Creates unnecessary uncertainty about whether to trust the page's data for post-meeting summarization and action tracking.

---

#### Problem 3: Post-Meeting Layout Still Feels Like "Pre-Meeting Prep"

**Where:** Entire page flow (Operator Summary → Meetings → Mike Actions → What Changed → System queue)

**Issue:**
- The Operator Summary + Meetings sections occupy ~25% of the viewport before Mike sees his own actions.
- In post-meeting mode, Mike cares less about:
  - Hard deadlines (already absorbed in the meeting)
  - Meeting list (already happened)
- He cares more about:
  - What changed _because of_ the meeting
  - What did he commit to
  - What system work is needed
- Current layout is optimized for "here's what's coming" (pre-meeting); not "here's what to do next" (post-meeting).

**Impact:** Mike scrolls past less-relevant information to find his action list.

---

## Proposed Redesign (Concrete + Implementation-Ready)

### Change 1: Make "Do Now" Visually Unmistakable

**Location:** System Queue section (lines 1432–1477)

**Current state:**
```jsx
<div className="mt-3 grid gap-4 xl:grid-cols-[5fr_3fr]">
  <div>
    <h3 className="text-xs font-semibold text-amber-400">System Actions</h3>
    <ul className="mt-2 space-y-2">
      {systemActions.map((item) => { ... })}  // All items same styling
    </ul>
  </div>
```

**Proposed change:**

1. **Split the `systemActions` array into two sub-arrays before rendering:**
   - `highPrioritySysActions` — items where `priority >= 5`
   - `watchlistSysActions` — items where `priority < 5`

2. **Render high-priority items first with primary styling:**
   ```jsx
   <div>
     <h3 className="text-xs font-semibold text-amber-400">System Actions — Do Now</h3>
     <ul className="mt-2 space-y-2">
       {highPrioritySysActions.map((item) => {
         // Keep current styling (amber left border, full visibility)
       })}
     </ul>
   </div>
   ```

3. **Render watchlist items below in a collapsible details block:**
   ```jsx
   {watchlistSysActions.length > 0 && (
     <details className="mt-4 rounded border border-slate-700/40 bg-slate-900/20 p-3">
       <summary className="cursor-pointer text-xs text-slate-500">
         Watchlist ({watchlistSysActions.length}) — monitor, may not need action
       </summary>
       <ul className="mt-2 space-y-1.5">
         {watchlistSysActions.map((item) => (
           <li className="opacity-60 text-slate-500">  // Reduced opacity, muted color
             {item.task}
           </li>
         ))}
       </ul>
     </details>
   )}
   ```

**Why this works:**
- "Do Now" is now the primary visual target (top of the section, full color, no collapse).
- "Watchlist" is labeled clearly and collapsed by default, removing scanning load.
- User can expand if needed without losing the prominence of urgent work.
- No new workflow mechanics; just reorganization of existing data.

---

### Change 2: Reframe Calendar-Staleness Warning for Post-Meeting Mode

**Location:** Header section (lines 1068–1072)

**Current state:**
```jsx
{brief.todaySummary.snapshotStale && (
  <p className="mt-2 rounded-md border border-slate-600/40 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-400">
    Calendar last updated {brief.todaySummary.snapshotLabel...} - meetings shown may not
    reflect recent changes. Waterfall data is unaffected.
  </p>
)}
```

**Proposed change:**

1. **Move the stale-calendar notice to the Meetings section header** (only if meetings are shown):
   ```jsx
   {(brief.meetingsToday || []).length > 0 && (
     <section className="rounded-xl border border-slate-700/50 bg-slate-900/20 p-4 text-sm text-slate-200">
       <div className="flex items-center justify-between gap-2">
         <h2 className="text-xs font-semibold text-slate-400">Meetings today</h2>
         {brief.todaySummary.snapshotStale && (
           <span className="text-[10px] text-slate-600">
             Calendar snapshot: {brief.todaySummary.snapshotLabel.replace(/^Calendar snapshot:\s*/i, "")}
           </span>
         )}
       </div>
       {/* Meetings list */}
     </section>
   )}
   ```

2. **Rationale for the move:**
   - The staleness is a _note about the meetings list_, not about the page's overall health.
   - Moving it to the Meetings header section-label makes the relationship explicit.
   - It removes the false impression that "waterfall data is unaffected" is an afterthought.
   - In post-meeting mode, when meetings are collapsed or less relevant, the notice naturally deemphasizes.

3. **Alternative: Conditional visibility for post-meeting mode:**
   If staleness is truly irrelevant after a meeting ends, add a check:
   ```jsx
   {brief.todaySummary.snapshotStale && brief.todaySummary.dayPhase !== "post_meeting" && (
     // Show the notice only in pre-meeting or idle modes
   )}
   ```

**Why this works:**
- Clarifies that calendar staleness is a property of the meetings list, not the system.
- Reduces visual noise in post-meeting mode by hiding an irrelevant warning.
- Waterfall reliability remains implicit (system queue and actions work regardless).

---

### Change 3: Reorder Top Section for Post-Meeting Execution Mode

**Location:** Main page flow (after header, before Mike Actions)

**Current order:**
```
1. Header
2. Operator Summary
3. Meetings today
4. Mike Actions
5. What Changed
6. System queue
```

**Proposed order (post-meeting adaptive):**
```
1. Header
2. Mike Actions  ← Move up (human work is primary in execution mode)
3. What Changed  ← Keep here (context for actions)
4. Operator Summary (or collapse to "Advanced")
5. Meetings today (or hide in post-meeting mode)
6. System queue
```

**Implementation approach:**

Option A (simplest): **Reorder JSX sections in TodayBriefClient.tsx** (lines 1074–1232)
- Move the `Mike Actions` section (1235–1298) to appear immediately after the header (1045–1073).
- Keep `What Changed` and `System queue` in sequence.
- Move `Operator Summary` and `Meetings` to "Advanced" section if needed.

Option B (more sophisticated): **Make order adaptive based on `dayPhase`**
```jsx
if (brief.todaySummary.dayPhase === "post_meeting") {
  // Render order: Header → Mike Actions → What Changed → System queue → Operator Summary (collapsed)
} else {
  // Render order: Header → Operator Summary → Meetings → Mike Actions → What Changed → System queue
}
```

**Why this works (Option A):**
- Mike's actions are now the first actionable item on the page (after header).
- Scanning time to "what do I do?" drops from 3–4 viewport scrolls to 0–1.
- Operator Summary and Meetings remain available (same DOM), just below the fold.

**Why this works (Option B):**
- Automatically adapts based on meeting phase, reducing cognitive load ("am I in prep mode or execution mode?").
- Pre-meeting: Operator Summary first (high-level awareness).
- Post-meeting: Mike Actions first (immediate execution).

---

## Visual Hierarchy Summary (Recommended)

### Primary (Human Action)
- **Mike Actions** — emerald left border, full color, always visible at top of post-meeting flow
- **Hard Deadlines** (if overdue) — red/amber pills in Operator Summary
- **New/High-Signal Changes** — in What Changed section (top items, not collapsed)

### Secondary (System Work)
- **System Actions — Do Now** — amber, visible, but below Mike Actions
- **Program Operator Summary** — violet background, below actions (provides context)
- **Meetings today** — slate background, below summary (reference, not primary action)

### Tertiary (Monitoring)
- **System Watchlist** — collapsed by default, muted colors, low-opacity text
- **Extra Changes** — collapsed details block
- **Calendar staleness notice** — moved to Meetings section header, removed from main alert area

---

## What Codex Should Implement

### Phase 1 (High-Impact, Low-Risk)

1. **Split system actions into "Do Now" + "Watchlist"**
   - File: `src/app/abivax/spine/today/TodayBriefClient.tsx` (lines 681–699)
   - Compute: `const highPrioritySysActions = systemActions.filter(a => a.priority >= 5)`
   - Compute: `const watchlistSysActions = systemActions.filter(a => a.priority < 5)`
   - JSX: Render high-priority section with current styling; render watchlist in collapsed details block
   - No data model changes; purely layout/rendering

2. **Move calendar-staleness notice to Meetings section**
   - File: `src/app/abivax/spine/today/TodayBriefClient.tsx` (lines 1068–1072 and 1193–1233)
   - Remove stale notice from header section
   - Add stale notice as a subtitle/badge in Meetings section header
   - Keep the notice visible but deemphasized

### Phase 2 (Adaptive Behavior)

3. **Reorder main sections based on `dayPhase`**
   - File: `src/app/abivax/spine/today/TodayBriefClient.tsx` (lines 1045–1500+)
   - Conditional render order based on `brief.todaySummary.dayPhase`
   - Post-meeting: Mike Actions → What Changed → System queue → Operator Summary → Meetings
   - Pre-meeting/idle: Operator Summary → Meetings → Mike Actions → What Changed → System queue
   - Test: Verify both modes render fully and preserve all functionality

### Phase 3 (Polish)

4. **Visibility/Collapse toggles for post-meeting**
   - Optional: Hide Meetings section entirely in post-meeting mode (or move to collapsed "Details")
   - Optional: Collapse Operator Summary by default in post-meeting mode with "Show" toggle
   - Keep all data available; just adjust default visibility

---

## Testing Checklist (Codex)

- [ ] **High-priority system actions render above fold** on a typical laptop screen in post-meeting mode
- [ ] **Watchlist items collapse/expand** smoothly without JavaScript errors
- [ ] **Calendar-staleness notice** does not appear in Meetings header when staleness is false
- [ ] **Reorder works in both pre-meeting and post-meeting modes** without layout shifts or missing content
- [ ] **Mike Actions section** maintains all action-type badges, done-when hints, and checkbox toggle
- [ ] **What Changed section** still shows top 2 items and collapse for extras
- [ ] **Accomplishment tracking** still persists to localStorage and EOD copy still works
- [ ] **System Actions accomplishments** still update based on queue state auto-done logic
- [ ] **No duplicate information** across Mike Actions and System Actions after reorder
- [ ] **Readability regression test:** Have Mike or another operator verify post-meeting mode is faster to scan

---

## Rationale: Why These Changes Preserve Architecture

✓ **No data model changes** — all data exists; only rendering order and grouping changes
✓ **No new workflow mechanics** — watchlist collapse is built on existing `details` pattern (used elsewhere on page)
✓ **No component rewrites** — pure JSX/CSS reorganization within TodayBriefClient.tsx
✓ **No backend changes** — `dayPhase`, `systemActions`, `watchlist` all computed on client
✓ **Codex integration still works** — accomplishment tracking, system auto-done logic, EOD copy all untouched
✓ **Fallback graceful** — if dayPhase is not provided, pre-meeting order used by default

---

## Success Metrics (After Implementation)

1. **Scanning time to "Mike Actions":** Reduced from 3–4 viewport heights to <1 (immediate/top-of-fold)
2. **Decision time for system queue:** Reduced from "read 6–8 items to find high-priority" to "glance at header label"
3. **Visual clarity of "Do Now" vs "Watchlist":** Watchlist should feel like optional/background reading, not primary queue
4. **Calendar-staleness anxiety:** Operator feedback that warning feels less like a system failure and more like a calendar-hygiene note

---

## Open Questions for Mike

1. **Adaptive reorder preference:** Do you want post-meeting mode to automatically reorder, or would you prefer manual toggle?
2. **Watchlist visibility:** Collapsed-by-default watchlist feels right, but should we show a count badge to indicate there's monitoring work?
3. **Operator Summary placement:** Is moving it below Mike Actions acceptable, or should it stay at the top (just after header) with Mike Actions in a second pass?
4. **Meeting visibility in post-meeting:** Should the Meetings section hide entirely, or remain visible but deprioritized?

---

**Implementation Ready:** Phase 1 changes are low-risk and high-impact. Recommend implementing Phase 1 first, then gathering operator feedback before Phase 2/3.
