# Abivax Operator Spine - Claude Collaboration Context

This repository is Mike Markman's personal ERP program operating system for Abivax.

Use this file as the startup context for Claude Code sessions. Keep this file concise and factual.

## Claude's Role (Current)

Claude is **not** part of the production agent pipeline yet.

Claude should be used for:
- Writing refinement (stakeholder briefs, executive summaries, email drafts)
- Design critique (page readability, layout hierarchy, cognitive load)
- Planning/critique (alternative page structures, workflow improvements)
- Front-end UI/layout implementation when Mike explicitly requests Claude to code the change

Claude should **not** directly modify:
- Canonical program data (`data/abivax/*.json`) unless Mike explicitly requests it
- Agent orchestration / waterfall logic
- Production ingestion/normalization scripts

Codex remains the implementation/orchestration engine for:
- Agents, pipelines, waterfall stages
- Canonical data updates
- Front-end integration
- Review queue processing

For UI/layout work where Claude codes directly, Codex is the required gatekeeper for:
- Diff/code review
- Build + smoke verification
- Final stabilization patches before acceptance

Observed split (2026-02-27):
- Claude generally produces stronger first-pass UI hierarchy/composition for Mike.
- Codex should focus on verification, data-trace correctness, regression checks, and stabilization.

## Current Architecture (High-Level)

Backend-first staged waterfall:
1. `ingest` - Outlook calendar/email/sent, org sync, SharePoint link/content intake, attachments
2. `normalize` - canonical JSON datasets, CFTI control intake/register, email-to-pillar reconciliation
3. `enrich` - entity profiles, process overlays, diagram payloads, pillar baselines
4. `detect` - quality/drift detectors (wiki, company intel, today content, readability)
5. `outputs` - presentations, verification, derived summaries

Codex review layer:
- Reviews queues/backlogs
- Patches agents/data/page logic
- Reruns affected stages

## Current Product Direction

Priority surfaces:
- `Today` (operator-first; now shifting to time-adaptive / post-meeting mode)
- `Program` (pillar command center)
- `Presentations` (exec/board/audit outputs)

Person pages are moving away from a generic "wiki" model toward a `Stakeholder Brief / Chief-of-Staff Brief` model.

## Collaboration Protocol (Claude + Codex)

Claude should read:
- `collab/claude/WORKFLOW.md`
- `data/abivax/claude_lane_queue.json`

Claude should write outputs to:
- `collab/claude/outputs/*.md`

Claude outputs should be:
- short
- actionable
- traceable to a queue item ID
- focused on wording/layout/structure recommendations (not broad system rewrites)

## Current Facts (Keep Updated)

- ERP selection decision made on `2026-02-26`: Abivax aligned to proceed with `NetSuite`
- Program now moves into post-selection communication / negotiation / mobilization planning
- Target for work to begin in earnest: `early April 2026`
- Board meeting checkpoint: `2026-03-19`
- Audit committee ERP slides target: `2026-03-06`

## Mike Preferences (Important)

- Front-end should be read-only and low-noise
- Avoid UI workflow bloat (export/copy/promote helpers unless clearly necessary)
- Prefer backend queues + Codex review + targeted reruns
- Fact-based writing over interpretive/fluffy language
- Wants "what changed / where it landed / what to do next" visibility

## Last Updated

- `2026-02-26` (Codex) - rewritten for current architecture and Claude sidecar role
