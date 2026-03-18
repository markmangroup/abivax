# ERP Program Encyclopedia — Roadmap & Cross-Session Reference

**Last updated:** 2026-03-18
**Owner:** Mike Markman
**For use by:** Claude, Cursor, Codex across any session

---

## What is the Encyclopedia?

The program encyclopedia is the single canonical reference for the Abivax ERP program. It is data-driven, not hand-edited. Two output formats are maintained from the same JSON sources:

| File | How to generate | Where to access |
|------|----------------|-----------------|
| `outputs/ERP_Program_Encyclopedia.docx` | `node scripts/generate_encyclopedia.js` | Open in Word / download |
| `outputs/ERP_Program_Encyclopedia.html` | `node scripts/generate_encyclopedia_html.js` | Browser via `localhost:3000/encyclopedia` |

**Rule:** Never hand-edit the output files. Fix the underlying JSON, then regenerate.

---

## Canonical JSON Sources

These files feed the encyclopedia generators. When data changes, update the JSON, then regenerate.

| JSON file | What it owns | Key fields to keep current |
|-----------|--------------|---------------------------|
| `data/abivax/pillar_synthesis.json` | Program state, risks, key people, deadlines, go-live date | `programState.goLive`, `topProgramRisks`, `keyPeople`, `nextHardDeadlines` |
| `data/abivax/people.json` | All named individuals, roles, orgs | `role`, `org`, `relevance`, `isActive` |
| `data/abivax/timeline.json` | Phases, milestones, dates | `phases[].milestones`, `go_live_date` |
| `data/abivax/implementation_options.json` | NetSuite/vendor selection rationale | `selected`, `commercials`, `scope` |
| `data/abivax/claude_lane_queue.json` | Active Claude task queue | `items[].status`, `items[].priority` |
| `data/abivax/budget.json` | Budget line items | Budget totals, reserve, by-vendor breakdown |
| `data/abivax/systems.json` | Current tech stack | System states, integration points |
| `data/abivax/cfti_control_register.json` | 143 CFTI controls | Control status, scope flags |

---

## Section Inventory (14 sections)

| # | Section | Primary JSON source | Refresh trigger |
|---|---------|--------------------|-----------------|
| 1 | Program Overview | `pillar_synthesis.json` programState | Any major decision |
| 2 | Key Decisions Log | `pillar_synthesis.json` changeLog | Each steering committee |
| 3 | System Selection | `implementation_options.json` | Post-selection (stable) |
| 4 | Delivery Model | `pillar_synthesis.json` keyPeople + people.json | Team/vendor changes |
| 5 | SOX / Controls Framework | `cfti_control_register.json` | Controls scope changes |
| 6 | Budget | `budget.json` + hardcoded SOW figures | Contract execution |
| 7 | Timeline & Milestones | `timeline.json` | Each phase transition |
| 8 | Risk Register | `pillar_synthesis.json` topProgramRisks | Weekly — risks shift fast |
| 9 | Vendor Profiles | `implementation_options.json` | Vendor onboarding changes |
| 10 | ERP Pillars | `pillar_synthesis.json` pillars | After blueprint deliverables |
| 11 | Governance | `pillar_synthesis.json` keyPeople | Team structure changes |
| 12 | Open Items | `claude_lane_queue.json` | Continuously |
| 13 | Outputs Registry | `document_registry.json` | Each new output added |
| 14 | Change Log | `pillar_synthesis.json` changeLog | Each session |

---

## Known Data Quality Issues (as of 2026-03-18)

Track these until resolved. Remove items when fixed and verified.

### Fixed ✅
- [x] `pillar_synthesis.json` → `goLive` was `2026-01-01`, corrected to `2027-01-01` (2026-03-18)
- [x] `topProgramRisks` — 7 outdated risks replaced with 6 current risks reflecting March 18 decisions (2026-03-18)
- [x] `keyPeople` — removed `kpmgReporting` (Robin Lapous), fixed sponsor labeling (Didier=executiveSponsor, Hema=financeLead), added CFGI leads (2026-03-18)
- [x] `nextHardDeadlines` — removed stale March 6 Audit Committee date; updated to Board Mar 19, SOW Mar 31, Mobilization Apr 1 (2026-03-18)

### Open ⚠️
- [ ] `budget.json` — verify alignment with NetSuite V3 SOW fixed bid (€388,700 confirmed); CFGI figures still estimates (€175-225K target)
- [ ] `timeline.json` — check Phase 1 go-live milestone date (should be 2027-01-01, not 2026)
- [ ] `people.json` — Adrian Holbrook listed as controls contact but is a junior team member; verify `relevance` field is set to reflect this (not elevated as audience target)
- [ ] `implementation_options.json` — confirm O2C/Inventory scope boundary: included in base SOW but not activated Phase 1 — this should be explicit in the data
- [ ] `pillar_synthesis.json` → `pillars` — several pillar entries still reference KPMG; should reference CFGI post-March 18 decision
- [ ] `claude_lane_queue.json` — several items may be stale from pre-NetSuite-selection era; needs review pass

---

## Cleanup Backlog (Codebase)

These files/pages are candidates for retirement now that the encyclopedia-first architecture is adopted. Do not delete without confirming Mike no longer needs them.

### Likely retired (front-end pages)
- `src/app/erp-team-roles/` — static team page, superseded by encyclopedia Section 4
- `src/app/board-erp-readout-review/` — static board deck review page, retired
- `src/app/p2p-brief/` — P2P intelligence brief, superseded by encyclopedia Section 10
- `src/app/today/` — Today page, shelved per March 18 architecture decision
- Any `public/*.html` static files that duplicate encyclopedia content

### Scripts to review
- `scripts/build_daily_close_summary.js` — Today-page related; confirm no longer needed
- `scripts/build_wiki_review_queue.js` — wiki model replaced by encyclopedia; verify
- `scripts/analyze_today_content_quality.js` — Today page dependency; confirm retired
- `scripts/generate_operator_focus_prompts.js` — may overlap with encyclopedia; review

### Keep (active)
- All `ingest/normalize/enrich` scripts — Codex pipeline, active
- `scripts/generate_encyclopedia.js` — primary output, keep
- `scripts/generate_encyclopedia_html.js` — primary output, keep
- `scripts/validate_encyclopedia.js` — consistency checker (to be built)
- `scripts/build_claude_lane_queue.js` — Claude task queue, active
- `scripts/create_audit_committee_doc.js` — Audit deck generator, active

---

## Encyclopedia Quality Standards

When regenerating or editing sections, apply these standards:

**Specificity rule:** Every risk, decision, and open item must name an owner and a date. No generic statements.

**People references:** Always use full name + role on first mention per section. Abbreviate after.

**Currency:** Any date field older than 30 days without a `lastVerified` note should be flagged by the validator.

**Confidence model (for intel/risk sections):**
- `confirmed` — official source (contract, press release, formal decision)
- `reported` — credible second-hand; not yet in primary source
- `assumption` — working assumption; must be explicitly confirmed before go-live

**Budget rule:** Never hardcode budget figures in generators without a comment pointing to the source JSON field or document. Avoids drift.

---

## Consistency Checks to Build (validate_encyclopedia.js)

These are the checks the validator script should run. See `scripts/validate_encyclopedia.js` for implementation.

| Check | What it does | Severity |
|-------|-------------|----------|
| `goLive_year` | Confirms go-live year is 2027 in all JSON files | ERROR |
| `kpmg_references` | Flags any `kpmg` string in data files (should be CFGI post March 18) | WARN |
| `stale_deadlines` | Finds `nextHardDeadlines` entries where date is in the past | WARN |
| `sponsor_naming` | Confirms Didier=executiveSponsor, Hema=financeLead in keyPeople | ERROR |
| `risk_count` | Warns if topProgramRisks < 3 or > 10 | WARN |
| `open_items_staleness` | Flags claude_lane_queue items with no `updatedAt` in 14+ days | WARN |
| `budget_sum` | Confirms NetSuite + CFGI + Reserve = ~€1M in budget.json | WARN |
| `phase1_scope` | Checks implementation_options for O2C/Inventory Phase 1 flag | WARN |
| `people_active` | Warns if keyPeople names don't match an active record in people.json | ERROR |
| `output_freshness` | Warns if encyclopedia HTML/docx is older than most-recently-modified JSON | INFO |

---

## Regeneration Protocol

Run this after any significant data update:

```bash
# 1. Validate data quality first
node scripts/validate_encyclopedia.js

# 2. Regenerate HTML (browser view)
node scripts/generate_encyclopedia_html.js

# 3. Regenerate Word doc (formal reference)
node scripts/generate_encyclopedia.js

# 4. Open browser to verify
# localhost:3000/encyclopedia  (requires npm run dev on Mac)
```

After regenerating, verify these sections visually:
- **Section 1 (Program Overview):** Correct go-live year, current focus statement
- **Section 8 (Risk Register):** Current risks, no stale Audit Committee / KPMG references
- **Section 11 (Governance):** Correct sponsor (Didier), finance lead (Hema), CFGI team names

---

## Session Handoff Notes

When starting a new session (Claude, Cursor, or Codex), read these files in order:

1. `CLAUDE.md` — architecture decisions, Claude role, Mike preferences
2. `ENCYCLOPEDIA_ROADMAP.md` — this file; known issues, cleanup status
3. `data/abivax/PLAN.md` — near-term roadmap
4. `data/abivax/pillar_synthesis.json` → `programState` — live program state
5. `data/abivax/claude_lane_queue.json` — active task queue

Do not modify encyclopedia output files directly. Fix JSON, regenerate.

---

## Update Log

| Date | Change | By |
|------|--------|----|
| 2026-03-18 | Created; documented architecture, section inventory, data quality issues found and fixed, cleanup backlog, consistency check design | Claude |
