# Prompt: Validate Camille Audit Deck Data (Execute End-to-End)

Use this prompt to run a strict fact-check pass against the source deck from Camille.

## Primary source deck (source of truth)
- `data/abivax/inbox_assets/2026-03-02-camille-philippe/abivax - audit committee 020326.pptx`

## Context inputs
- `collab/claude/outputs/netsuite-commercial-review-notes-2026-03-03.md`
- `data/abivax/pillar_synthesis.json`
- Any current generated audit deck artifacts under `outputs/` and/or `outputs/presentations/`

## Objective
Confirm that generated deck content is factually accurate against the Camille source deck and latest documented repo evidence, then correct mismatches.

## Required steps
1. Identify target generated deck(s) currently intended for audit committee use.
2. Compare source vs generated content across:
   - commercial numbers
   - license/user counts
   - scope in/out
   - timeline milestones
   - partner/support assumptions
   - legal/contract assumptions
3. Build a mismatch table with columns:
   - `slide_or_topic`
   - `source_value`
   - `generated_value`
   - `delta`
   - `severity` (`high`, `medium`, `low`)
   - `action_taken`
4. Correct factual mismatches in generated outputs.
5. Preserve uncertainty markers for anything waiting on vendor docs (licensing breakdown, SOW, legal agreements).
6. Write a short changelog note in `collab/claude/outputs/` summarizing exactly what was corrected.

## Decision rules
- Treat Camille deck as baseline source-of-truth unless a newer repo source is clearly dated and materially supersedes it.
- Do not do style-only rewrites unless needed for comprehension.
- If two repo sources conflict, keep both facts visible and mark as unresolved for Mike decision.

## Deliverables
1. Updated generated audit deck artifact(s).
2. Fact-check note in `collab/claude/outputs/` containing:
   - mismatch table
   - corrections made
   - unresolved decisions/questions for Mike
3. Updated any queue/task artifacts feeding `/today` only if this fact-check changes operator decisions.

## Final response format
At completion, return:
- `FILES_CHANGED:` list
- `MISMATCHES_FOUND:` count
- `HIGH_SEVERITY_ITEMS:` bullet list
- `UNRESOLVED_FOR_MIKE:` bullet list (or `none`)
- `READY_FOR_CODEX_REVIEW`
