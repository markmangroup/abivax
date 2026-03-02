# Abivax Operator Spine — Architecture Reference

> For new context windows: read `CLAUDE.md` first, then this file.
> Last updated: `2026-02-28` (Claude)

---

## The Core Architecture Principle

**Claude sessions are the synthesis agents.** The coded pipeline (ingest scripts, normalization) handles only mechanical work — getting raw data into clean JSON. Everything requiring judgment — synthesis, prioritization, narrative framing, "what does this email mean for P2P" — is done by Claude sessions reading the queue and updating the synthesis files. This keeps the architecture flexible, avoids brittle automation, and means future Claude versions automatically improve the system without code changes.

**The breadcrumb trail:** `CLAUDE.md` + `ARCHITECTURE.md` + `claude_lane_queue.json` + `pillar_synthesis.json` gives any future Claude session full operating context in under 10 minutes. The session reads the queue, does the work, updates the relevant JSON files, logs what changed.

---

## What This App Is

A Next.js (App Router, TypeScript, Tailwind) personal operating system for Mike Markman to run the Abivax NetSuite ERP implementation program. All data lives in flat JSON files under `data/abivax/`. There is no database. The UI is read-only for the operator; writes happen via Claude sessions (synthesis, writing, design) and Codex (code, pipeline, data normalization).

**Not a SaaS product.** Not intended to scale to other users. Optimized for one operator's daily workflow.

---

## Data Layer — What Each File Contains

### Program Core

| File | Contents | Status |
|------|----------|--------|
| `entities.json` | Master entity graph: 54 people, 9 systems, 7 orgs, plus milestones, concepts, decisions. Central source of truth for all names/roles/relationships. | Live |
| `entity_profiles.json` | Per-entity enriched profiles: lastTouchedAt, openLoops, stakeholder context, brief sections. Powers the entity detail pages. | Live |
| `erp_pillars.json` | Four ERP program pillars: P2P, Reporting/Data Model, Controls/Audit, Enablement. Each has phases, owners, scope, and current status. | Live |
| `erp_pillar_baselines.json` | Baseline state per pillar before ERP (current systems, manual touchpoints, known gaps). Input for exec deck Baseline slide. | Live |
| `cfti_control_register.json` | 143 CFTI controls across 3 pillars. Fields: name, pillar, automation type, system, scope status (In-Scope/Out-of-Scope), remediation status. Core audit input. | Live |
| `cfti_controls_intake.json` | Raw CFTI intake before normalization into the register. | Pipeline artifact |
| `timeline.json` | Key milestones: Feb 26 (NetSuite selected), Mar 6 (Audit Cmte), Mar 19 (Board), Apr 2026 (mobilization), Jan 1, 2027 (go-live). | Live |
| `spine_state.json` | Current program phase, top risks, open decisions, last-updated metadata. Powers Today and Overview pages. | Live |

### Meetings and People

| File | Contents | Status |
|------|----------|--------|
| `meetings.json` | Calendar meetings: date, title, organizer, attendees, notes. Drives "Relevant Today" on People page and meeting-aware context on Today. | Live |
| `people.json` | Supplemental people data (separate from entities.json person entries). May contain contact details, org metadata. | Live |
| `org_graph.json` | Organizational hierarchy / reporting relationships. | Live |
| `notes.json` | Freeform notes tied to entities or program areas. Displayed on Notes page. | Live |

### Presentations

| File | Contents | Status |
|------|----------|--------|
| `presentations.json` | Three presentation objects: Board (Mar 19), Audit Committee (Mar 6), Living Exec. Each has: slide plan array, data requests, artifacts, action log, status. | Live |

### Company Intel

| File | Contents | Status |
|------|----------|--------|
| `company_intel.json` | Synthesized company intelligence entries. | Live |
| `company_intel_ir_feed.json` | IR/investor relations feed items. | Pipeline artifact |
| `company_intel_sec_feed.json` | SEC filing feed items. | Pipeline artifact |
| `company_intel_ir_email_feed.json` | IR email feed. | Pipeline artifact |
| `company_intel_daily_digest.json` | Daily digest output from company intel agents. | Pipeline artifact |
| `company_intel_review_queue.json` | Items pending Codex review before promotion to company_intel.json. | Queue |
| `company_intel_agent_backlog.json` | Agent work backlog for company intel enrichment. | Queue |

### Process Flows and Systems

| File | Contents | Status |
|------|----------|--------|
| `process_flows.json` | Named process flows (P2P, Reporting/FP&A swimlanes, etc.) with steps and owners. | Live |
| `process_flow_diagram_payloads.json` | Rendered diagram data for process flow visualizations. | Pipeline artifact |
| `process_flow_control_overlays.json` | CFTI control mappings overlaid on process flows. | Pipeline artifact |
| `systems.json` | System inventory: Sage 100, NetSuite, Trustpair, Agicap, DocuShare, SAP (reference), Oracle (reference). | Live |
| `integrations.json` | Integration requirements and status between systems. | Live |

### Budget

| File | Contents | Status |
|------|----------|--------|
| `budget.json` | Budget tracking. Also contains SAP offer reference data from vendor selection process. | Live |

### SharePoint Artifacts

| File | Contents | Status |
|------|----------|--------|
| `sharepoint_artifacts.json` | Index of SharePoint artifacts (RFPs, vendor docs, contracts, decks). | Live |
| `sharepoint_artifact_content.json` | Extracted content from SharePoint artifacts. | Pipeline artifact |
| `sharepoint_remote_index.json` | Remote SharePoint index (before local sync). | Pipeline artifact |

### Agent Queues and Backlogs

| File | Purpose |
|------|---------|
| `claude_lane_queue.json` | Active tasks for Claude (writing, design critique, layout work). **Read this at session start.** |
| `wiki_review_queue.json` / `wiki_agent_backlog.json` | Entity wiki enrichment queue |
| `today_content_review_queue.json` / `today_content_agent_backlog.json` | Today page content queue |
| `page_readability_review_queue.json` / `page_readability_agent_backlog.json` | Readability critique queue |
| `access_requests.json` | Pending access / permission requests |
| `daily_close_summary.json` | End-of-day summary artifact |
| `trinidad_p2p_bundle_intake.json` | P2P-specific data bundle intake |

---

## UI Layer — What Each Page Does

### Operate Section (Mike's primary daily surfaces)

| Page | Route | Data Sources | Status |
|------|-------|-------------|--------|
| **Today** | `/abivax/spine/today` | spine_state, meetings, entities, entity_profiles, timeline, notes, today_content_review_queue | Live but **synthesis-incomplete** — loads 10+ data types but lacks canonical action list / Decision Radar |
| **Program** | `/abivax/spine/program` | erp_pillars, erp_pillar_baselines, spine_state, cfti_control_register | Live — pillar command center; good status display |
| **Presentations** | `/abivax/spine/presentations` | presentations.json | Live — slide plan viewer; three decks with TBD callout panels. Actual PPTX files in `outputs/`. |
| **Company Intel** | `/abivax/spine/company` | company_intel, company_intel feeds | Live — news/IR feed display |
| **Overview** | `/abivax/spine` | spine_state, entities, timeline | Live — program snapshot |

### Control Room (detail, QA, and agent context)

| Page | Route | Data Sources | Status |
|------|-------|-------------|--------|
| **Wiki / Search** | `/abivax/spine/search` | entities, entity_profiles, all JSON | Live — full-text search across all data |
| **Entity Detail** | `/abivax/spine/entity/[id]` | entities, entity_profiles, meetings, notes, presentations | Live — individual entity page (moving toward Stakeholder Brief model) |
| **System Map** | `/abivax/spine/system-map` | systems, integrations, process_flow_diagram_payloads | Live |
| **Process Flows** | `/abivax/spine/process-flows` | process_flows, process_flow_control_overlays, process_flow_diagram_payloads | Live |
| **Agents** | `/abivax/spine/agents` | All review queues and backlogs | Live — agent status dashboard |
| **Notes** | `/abivax/spine/notes` | notes | Live |
| **Meetings** | `/abivax/spine/meetings` | meetings | Live |
| **People** | `/abivax/spine/people` | entities (person type), entity_profiles, meetings | Live — grouped by role type (Core Decision Makers, Finance, IT, External); "Relevant Today" filter |
| **Timeline** | `/abivax/spine/timeline` | timeline | Live |
| **Budget** | `/abivax/spine/budget` | budget | Live |
| **Plan** | `/abivax/spine/plan` | data/abivax/PLAN.md rendered | Live |

---

## Pipeline Architecture

```
ingest → normalize → enrich → detect → outputs
```

Each stage produces JSON artifacts that downstream stages consume. The UI reads from the final normalized/enriched state; it does not run pipeline logic.

| Stage | What It Does | Key Outputs |
|-------|-------------|-------------|
| **ingest** | Outlook calendar/email/sent, SharePoint content, org sync, attachment extraction | Raw feed files (*_feed.json, sharepoint_remote_index) |
| **normalize** | Canonical entity resolution, CFTI control normalization, email-to-pillar tagging | entities.json, cfti_control_register.json, meetings.json |
| **enrich** | Entity profile enrichment, process overlays, diagram rendering, pillar baselines | entity_profiles.json, process_flow_diagram_payloads.json, erp_pillar_baselines.json |
| **detect** | Quality detectors: wiki gaps, today content drift, readability scoring, company intel freshness | *_review_queue.json, *_agent_backlog.json |
| **outputs** | Presentation generation, verification, derived summaries | outputs/*.pptx, collab/claude/outputs/*.md |

**Codex** orchestrates all pipeline stages. Claude produces writing/design outputs that feed into the pipeline as sidecar artifacts.

---

## Outputs Directory

```
outputs/
  Board_ERP_Readout_Mar19_2026.pptx       ← Board meeting Mar 19, 2026
  Audit_Committee_ERP_Controls_Mar2026.pptx  ← Audit Cmte Mar 6, 2026
  ERP_Program_Living_Executive_Deck.pptx  ← Living deck, update weekly
```

All three generated `2026-02-28` using pptxgenjs with real app data (presentations.json, cfti_control_register.json, timeline.json, erp_pillars.json). Design system: Midnight Executive palette (navy/gold/white). See generator scripts at `/sessions/intelligent-wizardly-ritchie/gen_*_deck.js` — these should be migrated into the repo's `scripts/outputs/` directory.

---

## The Synthesis Layer (New — Feb 28)

The synthesis layer sits between raw data and the action surfaces (UI pages, presentations, Today page). It answers meeting questions in 30 seconds per pillar.

| File | Purpose | Maintained By |
|------|---------|---------------|
| `data/abivax/pillar_synthesis.json` | Briefing-quality state per pillar: current state summary, future state, ERP design requirements, open decisions, next moves, waiting on. **The primary source of truth for any pillar discussion.** | Claude sessions |
| `data/abivax/erp_pillar_baselines.json` | Operational detail: whatDone, openItems, waitingOn, nextMoves, evidenceRequests per pillar. More granular than synthesis. | Claude sessions |
| `data/abivax/claude_lane_queue.json` | Task queue for Claude. Synthesis refresh tasks triggered by new context (emails, docs, meeting notes). Read this at every session start. | Claude sessions + Mike |

**How synthesis refresh works:**
1. New context arrives (email, deck, meeting notes ingested by Codex)
2. Claude session reads the relevant queue item + new context + current `pillar_synthesis.json`
3. Updates only the fields that changed (don't rewrite everything)
4. Adds a `changeLog` entry
5. If a presentation data gap is now closed, flags it in `presentations.json`

**Why not code this?** Code breaks when data formats shift. Code can't judge whether a new email changes the P2P `currentStateSummary` or just adds a detail to `currentStateKnown`. Claude sessions make that call correctly and improve automatically as model versions improve.

---

## What's Real vs. Scaffolding

| Area | Status | Notes |
|------|--------|-------|
| Entity graph + profiles | **Real, live** | 54 people, actively enriched |
| CFTI control register | **Real, live** | 143 controls, sourced from KPMG RFP process |
| Timeline / milestones | **Real, live** | Key dates confirmed |
| Meetings | **Real, live** | Calendar-synced |
| ERP pillars | **Real, live** | Scopes, owners, status defined |
| Process flows | **Real, live** | P2P and Reporting swimlanes documented |
| Company intel feeds | **Live (thin)** | Infrastructure in place; content freshness varies |
| Presentations | **Real content, generated** | Slide plans live in presentations.json; PPTX files generated |
| SharePoint artifacts | **Partially live** | Index exists; content extraction varies |
| Budget | **Partially live** | SAP reference data present; current NetSuite budget TBD |
| Today synthesis | **Scaffolding** | Displays data but missing Decision Radar, canonical action list |
| Stakeholder briefs | **Scaffolding** | Entity pages show data but pre-meeting brief format not complete |

---

## Strategic Gaps (Priority Order)

1. **Synthesis layer on Today page** — The app has excellent data infrastructure but no canonical "what to do next" layer. Missing: Decision Radar (unresolved decisions sorted by deadline), unified action list, Deadline Ladder view. This is the highest-leverage upgrade.

2. **Stakeholder brief format** — Entity pages should transform into pre-meeting briefs: relationship status, open loops, what to say, what to ask, context summary. Currently just a data display.

3. **Presentation live sync** — PPTX files are currently one-shot generated. The pipeline should detect when source data changes (new CFTI status, new timeline events) and flag the relevant deck slide for update.

4. **Decision ledger** — No single place to see all open decisions, their owners, and their deadlines. This data exists fragmented across spine_state.json, entity notes, and presentations.

5. **Board prep loop** — No mechanism to track that a presentation deck has been reviewed, what questions came from the meeting, and what follow-ups were committed. The Presentations page should close this loop.

---

## Collaboration Files (Read Before Working)

| File | Read When |
|------|-----------|
| `CLAUDE.md` | Every session start |
| `ARCHITECTURE.md` | This file — every new context window |
| `data/abivax/PLAN.md` | When planning feature work |
| `collab/claude/MIKE_DESIGN_PREFERENCES.md` | Before writing or designing anything |
| `collab/claude/WORKFLOW.md` | Before submitting Claude outputs |
| `data/abivax/claude_lane_queue.json` | For active Claude task assignments |

Claude outputs go to: `collab/claude/outputs/*.md`
