# Abivax Operator Spine — Context for Claude

> This file is automatically loaded at the start of every Claude Code session.

## Instructions for Claude

**IMPORTANT**: Update this file as part of any significant change — not at the end of the session. When you:
- Add/modify entities → update "Current Entity Count" and "Recent Changes"
- Build new features → update "Key Pages" and "Recent Changes"
- Make architectural changes → update "Data Model"
- Learn new preferences from Mike → update "Mike's Preferences"
- Start new work threads → update "Open Threads"

Do this inline with the work itself. Don't wait to be asked. Mike may close the session at any time.

---

## What This Is

A personal command center for Mike to manage the Abivax ERP implementation project (SAP go-live target: Jan 1, 2027). **Mike is the only user.** The front-end is read-only — all data entry happens by pasting raw notes to Claude, who parses, structures, and commits changes.

## How We Work

1. **Mike pastes raw meeting notes** → Claude extracts entities, relationships, corrections
2. **Claude updates data files** → `entities.json`, `notes.json`, etc.
3. **Mike views results** on the front-end wiki at `/abivax/spine/search`
4. **No front-end forms or complexity** — Claude is the write layer, the app is the read layer

## Tech Stack

- Next.js 16 (App Router, TypeScript, Tailwind)
- Data stored in JSON files under `/data/abivax/`
- Zod for schema validation
- No database — file-based for simplicity

## Data Model

**Unified Entity System** (`/data/abivax/entities.json`):
- All knowledge is stored as interconnected entities
- Entity types: `person`, `system`, `meeting`, `decision`, `concept`, `milestone`, `organization`
- Each entity has: `id`, `name`, `type`, `description`, `properties`, `links` (to other entities), `notes`, `mentions`
- Bidirectional relationships via `links` array + `getBacklinks()` function

**Current Entity Count**: ~44 entities
- 14 people (Hema, Matt Epley, Didier, Camille Girard, Venceslas d'Echallens, etc.)
- 8 systems (Sage, SAP S/4HANA, NetSuite, Ariba, Docushare, Certent, Activa, Adaptive)
- 8 organizations (Abivax, Abivax France, Abivax US, PWC, KPMG, SAP, Oracle)
- 4 milestones (ERP Go-Live 2027-01-01, US Public Launch, SAP Offer Expiry, Sage Sunset)
- 5 concepts (P2P, SOX Compliance, IFRS, GAAP, Consolidation, Financial Reporting)
- 2 decisions (No Manufacturing Module, External CMO Model)
- 2 meetings (Hema/Matt Intro 2026-02-10, NetSuite Demo 2026-02-12)

**Other Data Files**:
- `spine_state.json` — Mike's strategic positioning/identity
- `notes.json` — Raw meeting notes with parsed summaries
- `people.json`, `timeline.json`, `budget.json`, `meetings.json` — Legacy format (being migrated to entities)

## Key Pages

| Route | Purpose |
|-------|---------|
| `/abivax/spine` | Overview dashboard |
| `/abivax/spine/search` | Wiki — search & browse all entities |
| `/abivax/spine/entity/[slug]` | Wikipedia-style entity page |
| `/abivax/spine/people` | People table (legacy) |
| `/abivax/spine/timeline` | Milestones (legacy) |
| `/abivax/spine/budget` | SAP offer details (legacy) |
| `/abivax/spine/meetings` | Meeting prep (legacy) |
| `/abivax/spine/notes` | Meeting notes with summaries |

## Key Business Context

- **Abivax**: French biotech, preparing for US public launch end of 2027
- **ERP Project**: Replace Sage with SAP S/4HANA (or NetSuite — evaluating)
- **Critical Scope**: P2P (procure-to-pay) + Financial Reporting; NO manufacturing
- **Go-Live**: Jan 1, 2027 (non-negotiable)
- **SAP Offer**: 554k EUR / 5yr, valid until end Q1 2026
- **Key Stakeholders**: Hema (Finance Lead, drives scope), Matt Epley (US accountant), Trinidad (consolidation), Juliette + Kimberly (P2P)

## Mike's Preferences

- No unnecessary front-end complexity — Claude handles data entry
- Wikipedia-style interconnected knowledge, not isolated cards
- Search-first navigation
- Clean data over time via Claude corrections
- Hyper-focused, no scope sprawl

## Data Freshness / Branch Status

Track what's been updated vs. needs work:

| Branch | Status | Source | Last Updated | Notes |
|--------|--------|--------|--------------|-------|
| **Entities (Wiki)** | Active | NetSuite demo | 2026-02-12 | 44 entities, includes NetSuite pricing, Venceslas, Camille correction |
| **People** | Migrated | Hema/Matt intro call | 2026-02-10 | Now in entities.json; legacy people.json still exists |
| **Timeline/Milestones** | Migrated | Hema/Matt intro call | 2026-02-10 | Now in entities.json |
| **Budget/SAP Offer** | One-shot | SAP/KPMG call screenshot | 2026-02-10 | Single slide; needs expansion if more details emerge |
| **Meetings** | Sparse | Manual | 2026-02-12 | Only NetSuite demo scheduled; add meetings as they come |
| **Notes** | Active | NetSuite demo | 2026-02-12 | 2 notes (Hema/Matt intro, NetSuite demo) |
| **Spine State** | One-shot | Initial setup | 2026-02-10 | Mike's positioning; update if strategy shifts |

**Legend:**
- **Active** = regularly updated as new info comes in
- **Migrated** = moved to entities, legacy file may still exist
- **One-shot** = captured once, needs revisiting if more data emerges
- **Sparse** = minimal data, will grow naturally

## Recent Changes

- **2026-02-12**: Processed NetSuite demo — added meeting notes, updated NetSuite entity with full pricing (1.12M EUR 5yr), added Venceslas d'Echallens
- **2026-02-12**: Corrected Camille Girard — she's the KPMG RFP lead, not Ariba/Tungsten specialist
- **2026-02-12**: Fixed meeting date to 2026-02-10 (was incorrectly 2026-01-12)
- **2026-02-12**: Added branch status tracking to CLAUDE.md
- **2026-02-12**: Built unified entity system with 42 migrated entities
- **2026-02-12**: Created Wikipedia-style entity pages at `/abivax/spine/entity/[slug]`
- **2026-02-12**: Added search/browse page at `/abivax/spine/search`
- **2026-02-12**: Added search box to sidebar navigation

## Open Threads

**Immediate (Friday 2/14 call with Camille):**
- Get SAP/KPMG implementation cost for apples-to-apples comparison
- Discuss Sage sunset timing
- Get her read on SAP vs NetSuite recommendation

**ERP Decision:**
- SAP: 554k EUR licenses + KPMG implementation (TBD) — Ariba has native OCR
- NetSuite: ~1.12M EUR total (449k impl + 670k licenses) — OCR is add-on
- Decision needed soon for April kickoff to hit 1/1/27

**Technical:**
- Legacy pages (people, timeline, budget, meetings) still use old JSON format — could migrate fully to entities
- Could add: decisions log, risk register, full-text search improvements

---

*Last updated: 2026-02-12*
