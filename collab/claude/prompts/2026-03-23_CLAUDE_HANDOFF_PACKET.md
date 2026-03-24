# Claude Handoff Packet - 2026-03-23

Use this packet when Mike switches from Codex to Claude for the rest of the day.

## Active window rule

Claude is the active context window once Mike switches.

Do not assume Mike will bounce back to Codex casually.
Only hand back to Codex if there is:

- a new external or source-system trigger, or
- a blocker requiring Outlook, Desktop, or repo-refresh work

If that happens, follow `collab/shared/CONTEXT_WINDOW_PROTOCOL.md`.

## Declared context package

Treat these files as the trusted package for this session:

- `collab/shared/CURRENT_OPERATING_BRIEF.md`
- `collab/shared/SOURCE_SYSTEM_FLOW.md`
- `collab/shared/CONTEXT_WINDOW_PROTOCOL.md`
- `data/abivax/current_context.json`
- `data/abivax/document_intake_queue.json`
- `data/abivax/thread_registry.json`
- `data/abivax/consultant_reviews.json`
- `data/abivax/document_registry.json`
- `collab/claude/prompts/2026-03-23_mike-monday-brief.md`
- `collab/claude/prompts/2026-03-23_vendor-followups-and-may21.md`

## Declared freshness boundary

Use `data/abivax/current_context.json` as the explicit context-window declaration.

Current intended read:

- local Outlook inbox and sent snapshot is current through the March 24, 2026 refresh performed by Codex
- the March 19 CFGI combined package is archived and canonicalized
- the March 20 NetSuite support and legal package is archived and canonicalized
- broader-role and leadership-relevant inbox signals are surfaced in `data/abivax/current_context.json` and are in scope for Claude

## What is already done by Codex

- Outlook local refresh performed
- new Oracle / NetSuite and CFGI packages archived into repo
- source-system flow documented
- single-active-window protocol documented
- operating context files generated
- canonical vendor review updated for the March 19 and March 20 packages
- broader-role / career signal detection added to the operating context layer

## What Claude should do

- Work only from repo context unless a real trigger requires handoff back to Codex
- Draft, synthesize, and plan against the current package
- Assume the board-to-May-21 objective is the governing frame
- Review broader-role and career-relevant inbox signals in `data/abivax/current_context.json`, not just ERP or vendor threads
- Help determine where those broader signals should be consumed in the app or output system

## What Claude should not do

- Do not ask Mike to reconstruct context from memory if it should already be in the repo
- Do not treat old UI or front-end work as active
- Do not reopen Codex unless the protocol actually requires it

## If Claude must hand back to Codex

Write one short note with:

1. what Claude was doing
2. what new trigger or blocker occurred
3. exactly what Codex must refresh or ingest
4. which prompt or file Claude should resume from after Codex finishes
