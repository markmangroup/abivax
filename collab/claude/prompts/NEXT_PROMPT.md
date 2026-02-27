# Claude Next Prompt

Work only on queue item: `claude-design-today-layout-1`

## Context Files (read first)
- `CLAUDE.md`
- `collab/claude/WORKFLOW.md`
- `collab/claude/MIKE_DESIGN_PREFERENCES.md`
- `data/abivax/claude_lane_queue.json`

## Focus Files (read only if needed)
- `src/app/abivax/spine/today/TodayBriefClient.tsx`
- `src/app/abivax/spine/today/page.tsx`
- `data/abivax/today_content_review_queue.json`

## Targets
- Today page top area
- Two-column post-meeting layout (`Next Moves`, `What Changed`)
- Queue visibility (`Do now` vs `Watchlist`)
- stale calendar warning treatment and prominence

## Task
Today page post-meeting execution mode readability critique and redesign plan.

## Why this matters
Mike reports the page still reads like a wall of text. Important signals (for example `Do now` vs `Watchlist`) are hard to notice, and the stale calendar warning creates uncertainty about whether waterfall/handoff continuity is working.

## Specific ask
Produce a concrete, implementation-oriented critique for the top 1-2 screens of `/abivax/spine/today` that:
1. Improves scannability and visual hierarchy for Mike.
2. Makes `Do now` unmistakably primary and `Watchlist` clearly secondary.
3. Clarifies stale-calendar messaging so it does not imply total system failure.
4. Preserves current architecture and avoids adding new workflow mechanics.

## Constraints
- Do **not** modify production code or canonical data files.
- Do **not** create agent/pipeline changes.
- Focus on writing/design critique/planning only.
- Be concrete and implementation-oriented for Codex, but do not write production code.

## Output
Save your response to:
- `collab/claude/outputs/2026-02-27_today-layout-critique-mike-friendly-v2.md`

Use the format defined in `collab/claude/WORKFLOW.md`.
