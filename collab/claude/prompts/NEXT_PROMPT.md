# Claude Next Prompt

Work only on queue item: `claude-synthesis-refresh-controls-1`

## Context Files (read first)
- `CLAUDE.md`
- `collab/claude/WORKFLOW.md`
- `data/abivax/claude_lane_queue.json`
- `collab/shared/CURRENT_OPERATING_BRIEF.md`
- `collab/shared/SOURCE_SYSTEM_FLOW.md`
- `data/abivax/current_context.json`
- `collab/claude/prompts/2026-03-23_mike-monday-brief.md`

## Additional Context
- Architecture pivot on `2026-03-18`: front-end/UI work is shelved unless Mike explicitly revives it.
- Use the current operating brief to align to the live board-to-May-21 objective before acting on the queue item.

## Focus Files (read only if needed)
- `data/abivax/pillar_synthesis.json`
- `data/abivax/erp_pillar_baselines.json`
- `data/abivax/cfti_control_register.json`


## Task
Refresh Controls/Audit pillar synthesis when new context arrives

## Why this matters
Controls is blocked on ITGC RCM, Hema SOX findings, Jade IT gaps, and Adrian's 3-slide pack. The 9 ERP-signal controls need named owners before April mobilization.

## Specific ask
Read the controls-audit entry in pillar_synthesis.json. Read the new context. Update currentStateKnown, currentStateUnknown. Map any new deficiencies into ERP-addressable / non-ERP / management-decision buckets. Update nextMoves. Add a changeLog entry. Also flag whether the Audit Committee deck open data gaps should be marked closed.

## Constraints
- Do **not** modify production code or canonical data files.
- Do **not** create agent/pipeline changes.
- Focus on writing/design critique/planning only.
- Be concrete and implementation-oriented (for Codex), but do not write production code.
- Ignore retired queue items and historical front-end critiques unless the current brief explicitly calls for them.

## Output
Save your response to:
- `collab/claude/outputs/2026-03-23_refresh-controls-audit-pillar-synthesis-when-new-context-arr.md`

Use the format defined in `collab/claude/WORKFLOW.md`.
