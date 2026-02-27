# Mike Design Preferences (Working Memory)

Purpose: lightweight running context for Codex + Claude on what improves or hurts readability/comprehension for Mike.

This is not a style guide yet. It is a practical "what is working vs not working" log.

## What Resonates More (Observed)

- Layout improvements often matter more than wording tweaks.
- Clear `Next Moves` style blocks are high-value when they are visually prominent and concise.
- Post-meeting mode is better than morning-style static meeting prep when meetings are already done.
- Operator-facing summaries should answer:
  - what changed
  - where it landed
  - what Mike should do next
- Backend queue/review architecture is useful when UI stays compact and readable.
- Claude is valuable for:
  - layout/design critique
  - visual hierarchy
  - wording/style critique

## What Consistently Hurts

- Stacked-card fatigue (too many similar cards in one vertical scroll).
- Dense bullet-heavy sections with repeated information.
- Machine/internal language in the UI (e.g., queue IDs, taxonomy labels, unresolved internal classifications).
- Metrics without actionability (counts/pills that do not say what changed or what to do).
- Duplicate signals appearing in multiple places ("which version should I trust?" problem).
- Front-end features that require manual orchestration when Codex/agents should handle the interconnectivity.

## Content/Wording Preferences

- Prefer fact-based, operator-style language over interpretive/fluffy language.
- Avoid ranking language like "most important", "pivotal", "critical" unless absolutely necessary and grounded.
- For stakeholder pages, emphasize:
  - role / reporting line / scope
  - what we need from them
  - what is pending
  - what artifacts/evidence are relevant
- De-emphasize generic narrative and machine-generated sounding prose.

## UI/UX Preferences (Current Direction)

- Fewer default sections; more content behind `Advanced`.
- Better use of horizontal desktop space (avoid narrow high-priority columns).
- Visual distinction between:
  - actions (`Next Moves`)
  - trace/history (`What Changed`)
  - backlog/system work
- Highlight meaningful status changes with color/contrast, not uniform pills.
- Keep page structure stable across the day; avoid mode-driven layout flips.
- Prefer one canonical action section over split action lists in different columns/views.
- Make ownership explicit in labels:
  - `Mike Actions` (human/operator)
  - `System queue — Codex` (agent/system)
- Add visible accomplishment tracking for end-of-day confidence:
  - mark done/un-done
  - timestamped completion
  - copyable EOD summary/audit trail

## Patterns That Worked Best (Observed 2026-02-27)

- Unified section model beat mode toggles:
  - `Header -> Meetings -> Mike Actions (+ Accomplishments) -> What Changed -> System queue`
- Action cards with explicit `type + done-when` increased clarity more than generic bullet lists.
- `What Changed` is useful as context but should not dominate; keep concise and tied to actions.
- Deduped/merged action sources (operator actions + trace follow-ups) reduce "which list do I trust?" friction.

## Claude vs Codex (Practical Difference)

- Claude tends to deliver stronger first-pass visual hierarchy and section-level composition.
- Codex tends to optimize data wiring, guardrails, and pipeline correctness.
- Best observed split for Mike:
  - Claude: UI composition and readability-first structure
  - Codex: verification, data-trace correctness, regression protection, and final stabilization

## Open Questions / To Keep Testing

- Best representation for person pages may be a "Stakeholder Brief" rather than a "Wiki".
- `What Changed` still risks becoming a wall of text; likely needs content compression and stronger visual hierarchy.
- Program page status pills/colors need stronger semantic differentiation (received / waiting / blocked / active).

## Update Rule

When Mike gives strong UX/readability feedback, append concise bullets here and use it to shape future Claude critique prompts and Codex UI passes.
