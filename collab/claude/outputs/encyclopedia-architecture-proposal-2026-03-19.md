# Encyclopedia Architecture Proposal

Date: 2026-03-19
Owner: Codex
Status: Proposed architecture reset for review before UI refactor

## Purpose

Define a cleaner operating model for `/encyclopedia` so it becomes the single front-end entry point for the ERP program without recreating page sprawl or forcing everything into one long, document-shaped scroll.

This proposal assumes:

- the encyclopedia remains the canonical front-end entry point
- canonical JSON remains the source of truth
- new views are generated from the same model rather than hand-built as disconnected pages

## Problem Statement

The current encyclopedia is directionally useful but structurally misaligned with how the Program Director actually uses it.

Observed issues:

- The current navigation mixes three different hierarchies:
  - document order
  - process hierarchy
  - entity drill-down
- The main pillar section is overloaded:
  - `P2P` currently behaves as a mega-section with multiple embedded concepts
  - `R2R` and `Reporting & Planning` are structured differently
- Section rendering is inconsistent:
  - some sections read like reference material
  - some read like process deep dives
  - some read like action dashboards
- The current experience is optimized for browsing a document, not for jumping into one workstream before a meeting.

## Core Design Principle

One canonical model, multiple views.

Do not choose between:

- a page-sprawl application
- or a single giant encyclopedia document

Instead:

- keep one canonical information model
- keep one canonical entry point at `/encyclopedia`
- render multiple focused views from that same model

## Operator Use Model

The Program Director should only need to remember one URL:

- `/encyclopedia`

Typical use cases:

1. Daily program management
- Open `/encyclopedia`
- Review overall status, risks, decisions, milestone posture, immediate actions

2. Meeting preparation
- Open `/encyclopedia`
- Jump directly to the relevant pillar
- Then jump to the relevant substream
- Example: `P2P -> Payments`

3. Executive or Audit update
- Open `/encyclopedia`
- Use an executive or controls lens derived from the same model

4. Scope validation
- Open `/encyclopedia`
- Use scope and controls views to understand:
  - what Phase 1 includes
  - what is deferred
  - what is explicitly covered commercially
  - what is still pending blueprint decisions

## Recommended Product Structure

`/encyclopedia` becomes a hub with four primary modes:

1. `Overview`
2. `Pillars`
3. `Scope & Controls`
4. `Reference`

### 1. Overview

Purpose:
- run the program
- understand what matters now

Contents:
- overall program status
- top risks
- open decisions
- immediate actions by owner
- milestone strip
- budget / vendor snapshot
- recent updates

This should be concise and operational.

### 2. Pillars

Purpose:
- prepare for pillar or substream meetings
- understand one workstream quickly

Primary pillars:
- `P2P`
- `R2R`
- `Reporting & Planning`

Each pillar should expose:
- summary
- target state
- phase 1 scope
- substreams
- top risks
- top open decisions
- owners
- related controls
- related integrations
- recent updates

### 3. Scope & Controls

Purpose:
- answer what we are building
- answer how the design closes the SOX gaps

Subviews:
- `Phase 1 Build Scope`
- `Commercial Coverage`
- `Controls Coverage`
- `Open Blueprint Decisions`

This is where commercial commitment, desired target state, and unresolved design choices must be clearly separated.

### 4. Reference

Purpose:
- keep useful but non-primary material available without polluting the operating surface

Contents:
- budget and contracts
- vendor profiles
- timeline
- outputs registry
- change log
- source library

## Canonical Hierarchy

The canonical process hierarchy should be:

- `Program`
- `Pillar`
- `Substream`
- `Item`

Where:

- `Program` = global status, governance, risks, decisions, milestones
- `Pillar` = a major finance/process domain
- `Substream` = a repeatable work area you would actually prep for before a meeting
- `Item` = capability, fact, requirement, decision, risk, dependency, or action

## Recommended Pillar Taxonomy

### P2P

Recommended substreams:
- Vendor Setup
- PO / Requisition Workflow
- Approval Routing
- Invoice Processing
- Matching & Tolerances
- Payments
- Expenses

### R2R

Recommended substreams:
- Chart of Accounts
- Journal Entries
- Close Management
- Bank Reconciliation
- Intercompany
- Fixed Assets
- Multi-GAAP / Multi-book
- Consolidation Support

### Reporting & Planning

Recommended substreams:
- Management Reporting
- Statutory Reporting
- SEC / External Reporting Support
- FP&A Data Model
- Budget / Forecast
- Dimensional Reporting

## Overlays

These should attach to pillars and substreams rather than compete with them as the primary hierarchy:

- Controls
- Integrations
- Data Migration
- Roles / Security / SoD
- Change Management
- Evidence / Source Documents

Example:
- `P2P -> Payments` is the process node
- controls, integrations, and risks are overlays attached to that node

## Standard Page Templates

### Overview Template

Required blocks:
- overall status
- milestone posture
- top risks
- top open decisions
- immediate actions
- commercial snapshot
- recent updates

### Pillar Template

Required blocks:
- what this pillar covers
- why it matters
- current state summary
- target state at go-live
- phase 1 scope
- substreams
- top open decisions
- top risks
- owners
- related controls
- related integrations
- recent updates

### Substream Template

Required blocks:
- what this substream covers
- current state
- target state on 1/1/27
- what Phase 1 must deliver
- what is explicitly covered vs assumed
- open decisions
- risks / blockers
- owners
- controls touched
- systems / integrations
- evidence / source facts

### Scope & Controls Template

Required blocks:
- build scope
- non-scope / deferred
- commercial coverage
- blueprint decisions pending
- control gaps addressed
- control gaps still requiring process or governance solutions

### Reference Template

Required blocks:
- contracts and budgets
- vendor context
- timelines
- outputs registry
- change log
- source inventory

## Canonical Data Model

Do not overload `pillar_synthesis.json` with every concern.

Introduce a new orchestration layer:

- `data/abivax/encyclopedia_model.json`

Purpose:
- define the structural hierarchy used by the front-end
- map source data into stable sections and views
- avoid baking hierarchy directly into the generator code

### Proposed Shape

```json
{
  "program": {
    "status": {},
    "risks": [],
    "decisions": [],
    "milestones": [],
    "actions": []
  },
  "pillars": [
    {
      "id": "p2p",
      "label": "P2P",
      "summary": "",
      "target_state": "",
      "phase1_scope": [],
      "substream_ids": []
    }
  ],
  "substreams": [
    {
      "id": "p2p-payments",
      "pillar_id": "p2p",
      "label": "Payments",
      "summary": "",
      "why_it_matters": "",
      "current_state": "",
      "target_state_010127": "",
      "phase1_scope": [],
      "explicit_vendor_coverage": [],
      "assumptions": [],
      "open_decisions": [],
      "risks_blockers": [],
      "owners": [],
      "entity_notes": [],
      "control_ids": [],
      "integration_ids": [],
      "evidence_ids": [],
      "last_updated": ""
    }
  ],
  "views": {
    "overview": {},
    "scope": {},
    "controls": {},
    "reference": {}
  }
}
```

## Source Inputs To Reuse

Keep current source files as inputs:

- `data/abivax/pillar_synthesis.json`
- `data/abivax/cfti_control_register.json`
- `data/abivax/integrations.json`
- `data/abivax/facts/*.json`
- `data/abivax/timeline.json`
- `data/abivax/budget.json`
- `data/abivax/people.json`
- `data/abivax/consultant_reviews.json`

The new model should not replace these immediately. It should normalize them for rendering.

## Current Encyclopedia Problems To Fix

### 1. Mixed hierarchy in nav

Current nav mixes:
- top-level document sections
- pillar sections
- entity nodes
- deep sub-anchors

Fix:
- top-level nav should reflect product modes, not document order
- entity split should be local to the relevant pillar or substream

### 2. Inconsistent pillar handling

Current state:
- `P2P` is embedded inside a mega-section
- `R2R` and `Reporting & Planning` are separate later sections

Fix:
- all pillars should render from the same structural template

### 3. Process hierarchy versus audience hierarchy

Current state:
- some sections are process-driven
- some are audience-driven
- some are reference-driven

Fix:
- core tree should remain process-driven
- audience-specific consumption should be implemented as views

## Migration Matrix

### Keep

- Program Overview
- Key Decisions
- Risk Register
- Governance
- Outputs Registry
- Change Log
- Budget / contracts content
- Timeline content

### Split

- `ERP Pillars and Process Scope`
  - split into pillar and substream structures
- `Integrations & Data Migration`
  - split into overlays attached to pillars and a reference summary
- `SOX and Controls`
  - split into a controls lens and linked control overlays by pillar/substream

### Merge

- immediate actions, open items, and active decisions should likely converge into one program action layer
- budget, vendor, and contract materials should converge under reference

### Retire Or De-Emphasize

- document-order-first navigation
- deep nested sidebar logic that exposes implementation details instead of operator tasks
- any app-era pages that duplicate encyclopedia content once equivalent views exist

## Front-End Recommendation

Do not return to a large page-per-topic application.

Recommended front-end strategy:

- keep `/encyclopedia` as the master entry point
- add structured internal views
- initially, these can still be generated into one route
- later, if needed, pillar and substream views can become route states or sub-routes

This preserves:
- one front door
- one canonical source of truth
- less duplication
- faster meeting preparation

## Implementation Sequence

1. Finalize pillar and substream taxonomy
2. Create `encyclopedia_model.json`
3. Map existing source inputs into the new model
4. Refactor generator navigation around the four top-level modes
5. Standardize rendering templates
6. Move entity splits into local pillar/substream layouts
7. Polish visuals only after the structure is clean

## Decisions Needed Before Coding

1. Confirm the top-level product modes:
- Overview
- Pillars
- Scope & Controls
- Reference

2. Confirm the three primary pillars:
- P2P
- R2R
- Reporting & Planning

3. Confirm whether the recommended substream taxonomy is acceptable as initial scaffolding

4. Confirm whether `/encyclopedia` should remain one route with internal mode switching or eventually become:
- `/encyclopedia`
- `/encyclopedia/p2p`
- `/encyclopedia/r2r`
- etc.

Recommendation:
- start with one route and internal mode switching
- keep the architecture compatible with route-level split later

## Recommended Next Step

Do not change the live UI yet.

Next step should be:
- create the scaffolding model
- map the current encyclopedia sections into the new structure
- then review the revised IA before generator refactor begins

## Summary

The encyclopedia should remain the master front-end surface, but it should stop behaving like a long report and start behaving like a structured program hub.

The right answer is:

- one canonical model
- one canonical entry point
- multiple focused views
- process-first hierarchy
- audience- and purpose-specific lenses generated from the same data
