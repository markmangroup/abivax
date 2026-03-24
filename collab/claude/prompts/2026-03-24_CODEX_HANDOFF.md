# Codex Handoff - 2026-03-24

**Read `collab/shared/CODEX_DAILY_ROUTINE.md` first. That file is the standing instruction set.**

This file adds today's specific context on top of the routine.

---

## What Codex refreshed today

- Pulled latest GitHub state before running the daily sync
- Refreshed local Outlook inbox and sent exports on this machine
- Rebuilt `data/abivax/current_context.json`, `data/abivax/document_intake_queue.json`, and `data/abivax/thread_registry.json`
- Kept the March 19 CFGI combined package and March 20 NetSuite package as the latest canonical vendor packages
- Expanded the operating-context layer so broader-role, career, and leadership-relevant emails are surfaced alongside ERP threads

---

## What to specifically use as current truth

### Oracle / NetSuite thread

- Last inbound: 2026-03-20 (Jamal - SOW v3, estimates, CVs, Oracle Feedback File)
- Last outbound: none yet in repo memory
- SOW validity expires March 30, 2026
- Codex did not find a newer Oracle / NetSuite reply in the March 24 local refresh

### CFGI thread

- Last inbound: 2026-03-19 (Jean-Arnold - combined advisory proposal)
- Last outbound: none yet in repo memory
- Codex did not find a newer CFGI reply in the March 24 local refresh

### Reference call thread

- Last inbound: 2026-03-23 09:27 ET (Laure - `Re: Prise de reference - NetSuite`)
- Codex did not find a newer follow-up in the March 24 local refresh

### Broader-role / leadership signals surfaced in the refresh

- `New Equity Program Approved by the Board`
- `Abivax - Phase 2 | Workshop Best of Breed Treasury`
- `Corporate card`
- `Abivax 2026 Initiatives`
- `Hedge accounting`

Use `data/abivax/current_context.json` for the full candidate list and timestamps.

---

## Claude's task after this sync

- Review any new Oracle, CFGI, or reference-call content only if it appears in the synced repo state
- Update the vendor email drafts if today's refreshed context changes what Mike should send
- Keep the May 21 backward plan current
- Review broader-role and career-relevant inbox signals and recommend where they should be consumed in the app or output system
- Operate from the declared freshness boundary in `data/abivax/current_context.json` instead of reopening older assumptions

The existing vendor draft output remains:

- `collab/claude/outputs/2026-03-23_vendor-followups-and-may21.md`

---

## Files Claude should read

- `collab/shared/CODEX_DAILY_ROUTINE.md`
- `collab/shared/CURRENT_OPERATING_BRIEF.md`
- `collab/shared/SOURCE_SYSTEM_FLOW.md`
- `collab/shared/CONTEXT_WINDOW_PROTOCOL.md`
- `data/abivax/current_context.json`
- `data/abivax/document_intake_queue.json`
- `data/abivax/thread_registry.json`
- `collab/claude/prompts/2026-03-23_CLAUDE_HANDOFF_PACKET.md`
- this file: `collab/claude/prompts/2026-03-24_CODEX_HANDOFF.md`

---

## Declared freshness boundary

- Local Outlook inbox snapshot is current through `2026-03-24T14:20:40.352Z`
- Local Outlook sent snapshot was refreshed on March 24, 2026
- Treat `data/abivax/current_context.json` as the canonical boundary for this handoff
