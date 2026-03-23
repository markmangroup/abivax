# Claude Prompt - Vendor Follow-ups and May 21 Backward Plan

Read these first:

- `collab/claude/prompts/2026-03-23_CLAUDE_HANDOFF_PACKET.md`
- `data/abivax/current_context.json`
- `data/abivax/document_intake_queue.json`
- `data/abivax/thread_registry.json`
- `collab/shared/CURRENT_OPERATING_BRIEF.md`
- `collab/shared/SOURCE_SYSTEM_FLOW.md`
- `collab/claude/prompts/2026-03-23_mike-monday-brief.md`
- `data/abivax/consultant_reviews.json`
- `data/abivax/vendor-assets/netsuite-commercial/README.md`
- `data/abivax/vendor-assets/netsuite-support-team-2026-03-20/README.md`
- `data/abivax/vendor-assets/cfgi-implementation/README.md`
- `data/abivax/vendor-assets/cfgi-pmo-change/README.md`
- `data/abivax/vendor-assets/cfgi-advisory-combined-2026-03-19/README.md`
- `collab/claude/outputs/vendor-diligence-responses-2026-03-18.md`

Context:

- Mike needs to decide today whether to reply to Oracle / NetSuite and CFGI immediately to keep momentum high.
- Board and Didier gave oral support on 2026-03-19 for the Oracle / NetSuite + CFGI path as presented in the final board review presentation.
- The next key milestone is the board meeting on 2026-05-21.
- Use `data/abivax/current_context.json` as the declared source snapshot boundary for this session.
- Treat Claude as the active window once Mike switches. Do not assume Codex re-entry unless the protocol requires it.

Your tasks:

1. Draft one concise reply email to Oracle / NetSuite and one concise reply email to CFGI.
2. Each draft should push the outside party toward a real next-step deliverable, not just keep the conversation warm.
3. For Oracle / NetSuite, assume the current posture is:
   - Abivax wants to keep moving with NetSuite
   - Abivax still needs tighter phase-1 scope, clearer accountability, and commercial alignment to the actual Jan 1, 2027 requirement
   - the March 20 customer-side support / legal package is useful but does not close the scope/commercial questions
4. For CFGI, assume the current posture is:
   - Abivax wants the revised integrated support model back in writing fast
   - the March 19 revised combined package is the current CFGI proposal to respond to
   - the board-supported path is NetSuite as SI with CFGI in a targeted oversight / local support / controls-by-design role
   - Mike wants one practical combined path, not overlapping proposals
5. Build a short "work backward from May 21" note:
   - no more than 8 bullets
   - focused on real-world milestones, outside-party dependencies, and evidence Mike needs by the board meeting
   - distinguish what must happen in March / April / early May

Output:

Write to `collab/claude/outputs/2026-03-23_vendor-followups-and-may21.md`

Required structure:

1. `Oracle / NetSuite reply draft`
2. `CFGI reply draft`
3. `May 21 backward plan`
4. `What Codex should do next`

Constraints:

- Do not rewrite the strategy from scratch.
- Do not propose front-end work.
- Keep the tone operator-level, direct, and commercially useful.
- Optimize for emails Mike could plausibly send today with light editing.
