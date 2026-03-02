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

Person pages are moving toward a `Stakeholder Brief / Chief-of-Staff Brief` model (away from generic wiki display).

The key strategic gap is **synthesis**: the app excels at displaying data but lacks a canonical "what to do in the next 4 hours" layer. Decision Radar, unified action list, and Deadline Ladder are the missing operator-layer constructs.

See `ARCHITECTURE.md` for a full map of data files → pages → strategic status.

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

- ERP selection decision made `2026-02-26`: NetSuite selected. Program now in post-selection / mobilization planning.
- Implementation mobilization target: `April 2026`; go-live: `Jan 1, 2027` (non-negotiable; tied to US public launch Dec 2027)
- Board meeting ERP checkpoint: `2026-03-19` — deck at `outputs/Board_ERP_Readout_Mar19_2026.pptx`
- Audit Committee ERP controls readout: `2026-03-06` — deck at `outputs/Audit_Committee_ERP_Controls_Mar2026.pptx`
- Living Executive Deck (update weekly): `outputs/ERP_Program_Living_Executive_Deck.pptx`
- CFTI control register: 143 controls total — 84 Controls/Audit, 39 Reporting/Data, 20 P2P; 45 out-of-scope, 9 ERP-signal
- Three open data gaps in Audit deck: (1) Audit Cmte meeting date confirmation with Camille, (2) Commercial/timeline package from NetSuite, (3) Adrian's 3-slide controls pack
- Five open data gaps in Living Exec deck: P2P volume baseline, Reporting bridge detail, Controls deficiency inventory, Governance/resourcing model, Executive visuals
- Key people: Hema Keshava (CFO / internal ERP sponsor), Didier Blondel (CFO / sponsor), Adrian Holbrook (controls), Camille Girard (Audit Cmte liaison)

## Mike Preferences (Important)

- Front-end should be read-only and low-noise
- Avoid UI workflow bloat (export/copy/promote helpers unless clearly necessary)
- Prefer backend queues + Codex review + targeted reruns
- Fact-based writing over interpretive/fluffy language
- Wants "what changed / where it landed / what to do next" visibility

## Quick Orientation for New Context Windows

1. Read this file first (~2 min)
2. Read `ARCHITECTURE.md` for full data/page/strategic map (~5 min)
3. Read `data/abivax/PLAN.md` for near-term roadmap
4. Check `data/abivax/claude_lane_queue.json` for active Claude tasks
5. Check `collab/claude/MIKE_DESIGN_PREFERENCES.md` before writing or designing anything

With those five files, you have complete operating context without re-reading source code.

## Last Updated

- `2026-02-26` (Codex) - rewritten for current architecture and Claude sidecar role
- `2026-02-28` (Claude) - added synthesis gap, presentation status, open data gaps, key people, ARCHITECTURE.md reference, quick orientation guide
