# Abivax Operator Spine - Claude Collaboration Context

This repository is Mike Markman's personal ERP program operating system for Abivax.

Use this file as the startup context for Claude Code sessions. Keep this file concise and factual.

## Architecture Decision (2026-03-18) — FRONT-END SHELVED

**The front-end app and Today page are shelved as of March 18, 2026.**

The program record now lives in a single Word document:
- `outputs/ERP_Program_Encyclopedia.docx` — the canonical program reference
- Regenerated via `scripts/generate_encyclopedia.js` (reads canonical JSON at runtime)
- All static HTML pages are retired (erp-team-roles, board-erp-readout-review, P2P brief, etc.)

**Do not build new front-end pages.** Do not invest in HTML/React surfaces for static program content.

## Claude's Role (Current)

Claude generates program documents from canonical JSON data:
- Program encyclopedia (`generate_encyclopedia.js`)
- Board and audit committee decks and briefs
- Vendor communications and engagement letters
- Writing refinement (stakeholder briefs, executive summaries, email drafts)
- Document-level design critique (Word/pptx layout and hierarchy)

Claude should **not** directly modify:
- Canonical program data (`data/abivax/*.json`) unless Mike explicitly requests it
- Agent orchestration / waterfall logic
- Production ingestion/normalization scripts

Codex role (updated):
- Ingest, normalize, enrich canonical JSON data (pipeline unchanged)
- Update JSON when new information arrives (emails, vendor docs, meetings)
- No front-end page work
- Trigger encyclopedia regeneration when data changes significantly

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

## Current Sprint (update each session)

Active work streams as of `2026-03-02`:

1. **Audit Committee deck** (`outputs/Audit_Committee_ERP_Controls_Mar2026.pptx`) — due Mar 6. Open gap: Slide 9 Commercials needs real KPMG figures (€650K Year 1, €1.02M 3-year) — still using placeholder "~$1M assumption".
2. **HTML briefing pages** — P2P Intelligence Brief and Program Command Center built and live. Light palette now the design standard. Today page and Stakeholder Briefs are next HTML candidates.
3. **pillar_synthesis.json** — Updated with Trustpair vendor data (P2P pillar) and KPMG commercials (Governance pillar). Five data gaps in Living Exec deck still open.

## Design Standard (as of 2026-03-02)

- **Light palette** — white/light gray backgrounds, dark text, high contrast accents
- No dark backgrounds on new pages
- HTML-first for read-only briefing surfaces; React/Next.js only when interaction or data-binding needed
- See `collab/claude/MIKE_DESIGN_PREFERENCES.md` for full design compass

## Last Updated

- `2026-02-26` (Codex) - rewritten for current architecture and Claude sidecar role
- `2026-02-28` (Claude) - added synthesis gap, presentation status, open data gaps, key people, ARCHITECTURE.md reference, quick orientation guide
- `2026-03-02` (Claude) - added Current Sprint block, light palette design standard
