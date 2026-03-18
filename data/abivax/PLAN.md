# Abivax ERP Program — Roadmap

**Mission:** ERP go-live January 1, 2027. Program Director: Mike Markman.

**Architecture (as of 2026-03-18):** Encyclopedia-first. The front-end app and Today page are shelved. Codex pipeline maintains canonical JSON data. Claude generates the program encyclopedia and output documents from that data. No front-end investment until post-go-live.

---

## Architecture Decision (2026-03-18)

- **Front-end app:** Shelved. Static HTML pages (erp-team-roles, board-erp-readout-review, P2P brief, etc.) are retired. No new front-end pages.
- **Today page:** Shelved. Not used in practice. May revisit post-go-live.
- **Program encyclopedia:** `outputs/ERP_Program_Encyclopedia.docx` — canonical reference, regenerated via `scripts/generate_encyclopedia.js`. This is the single source of truth.
- **Codex role:** Ingest, normalize, enrich canonical JSON data. Feed the encyclopedia. No page rendering.
- **Claude role:** Generate documents (encyclopedia, audit committee briefs, board decks, vendor communications) from canonical JSON. Writing refinement. Design critique (document-level only).

---

## Short-term (now to April 2026 mobilization)

| Area | What | Why |
|------|------|-----|
| **Contract execution** | NetSuite V3 SOW signed by March 31; CFGI combined engagement letter | Nothing starts without signed contracts |
| **Encyclopedia quality** | Keep `generate_encyclopedia.js` current as decisions land | Single source of truth must stay accurate |
| **Canonical JSON hygiene** | Fix stale data (goLive date in pillar_synthesis.json, keyPeople sponsor naming) | Encyclopedia accuracy depends on data quality |
| **Board deck** | Update Board_ERP_Readout_Mar19_2026 to reflect CFGI model (not KPMG) | Board meeting March 19 — story must be consistent |
| **Budget authorization** | Get written sign-off from Hema and Didier on EUR 1M program budget | BUD-1/BUD-2 still open |

**Collapse if:** Any item is not driving a near-term decision or contract.

---

## Medium-term (April — September 2026)

| Area | What | Why |
|------|------|-----|
| **Blueprint deliverables** | CFGI controls-by-design doc; integration architecture confirmed | Required before build starts |
| **Weekly flash reporting** | Walid / CFGI weekly report feeding Mike | Operational heartbeat |
| **Encyclopedia updates** | Refresh after each steering committee; update risk register and open items | Keep the record current |
| **Data migration planning** | Abivax BPOs own cleansing; track progress against cutover plan | RACI confirmed — Abivax responsibility |

---

## Medium-term (1 to 3 months)

| Area | What | Why |
|------|------|-----|
| **Decision ledger** | Unified decision table with owner/date/status/source note | Avoid lost commitments. |
| **Open-loop tracker** | First-class queue for unresolved questions and blockers | Preserve momentum between meetings. |
| **Entity cards by type** | Person cards: ask/owner/risk. System cards: state/gap/dependency. | Avoid one-size-fits-all wiki structure. |
| **Readability critic** | Agent/script that scores pages for specificity, repetition, actionability | Prevent noisy wiki drift as data grows. |
| **Signal confidence** | Confidence flags on each generated insight | Quickly spot weak assumptions. |
| **Presentations workspace** | Structured deck tracker by audience (board/audit/exec), slide readiness, data gaps, and source library | Turn prep into repeatable operating system, not ad hoc slides. |

**Collapse if:** Any generated section repeatedly adds noise and no decision value.

---

## Long-term (evolving)

| Area | What | Why |
|------|------|-----|
| **Workflow automations** | Push follow-ups to email/calendar/task systems | Reduce manual execution load. |
| **Board packet mode** | Auto-build concise board/audit updates from current graph | Fast executive readiness. |
| **Adaptive prioritization** | Learn from accepted/rejected recommendations | Personalize for Mike's decision style. |

---

## Update cadence

- **After each major note ingestion:** run `note:pipeline` to sync mentions, build profiles, verify connectivity.
- **Weekly:** review top 5 wiki pages by usage; prune repeated/low-value bullets.
- **Every 4 to 6 weeks:** update this plan to reflect what is driving decisions versus what is just interesting context.

---

## Company Intel Operating Model (Detailed)

**Goal:** Build a high-signal company intelligence layer that upgrades Mike from ERP operator to company-level decision partner.

### What this page is for

- Track external company reality that changes ERP risk and timing: clinical data, financing posture, investor narrative, leadership focus, and M&A signals.
- Separate **facts** from **reported signals** from **rumors**.
- Turn raw market noise into explicit actions (what Mike should ask, escalate, or prepare).

### What this page is not for

- Not a duplicate of internal people/wiki pages.
- Not a rumor feed without source discipline.
- Not a long article archive.

### Core sections (must stay concise)

| Section | Purpose | Output |
|------|------|-----|
| **Executive context** | Leadership priorities, travel, events, sponsor bandwidth | "What leadership is focused on now" |
| **Clinical/program context** | Pipeline milestones and data readouts | "What could change company trajectory next" |
| **Market and M&A intel** | Stock narrative, peer/partner chatter, buyer rumors | "What is signal vs speculation" |
| **Operator expert track** | Learning path for Mike | "What to read this week and why" |
| **Source backlog** | Missing references to validate claims | "What must be verified next" |

### Confidence model

- **confirmed**: official source (company filings, press release, conference abstract, official deck).
- **reported**: credible second-hand but not yet confirmed in primary source.
- **rumor**: market/social speculation; never used as planning fact.
- **action**: internal work item for Mike.

### Evidence policy

- Every non-action intel item must have:
- source status
- date of last touch
- explicit owner for next verification step
- If an item remains unverified for 14+ days, downgrade prominence or archive.

### UI behavior (target state)

- Collapsible section drawers by topic.
- Item-level drawers to hide detail until needed.
- Top counters for reported / rumor / action.
- Quick highlight lane: "What changed this week."
- One-click copy blocks for "questions to ask leadership" and "board-risk implications."

### Weekly operating rhythm for Mike

1. Monday: review "what changed this week" and set 3 priority questions.
2. Mid-week: verify at least 2 reported/rumor items against primary sources.
3. Pre-exec meeting: export a one-page brief (facts, risks, asks, dependencies).
4. Friday: archive stale noise and promote validated items into stable context.

### Data ingestion workflow

1. Capture notes/signals from meetings, calls, decks, and external monitoring.
2. Normalize into structured intel item format with confidence + source status.
3. Validate against primary sources where possible.
4. Push validated implications into Today/Decision views when ERP-relevant.

---

## Presentation Ops (New)

**Operator goal:** Build board/audit decks as a reusable system with traceable sources and explicit missing-data ownership.

### Required components

| Component | What it stores | Why |
|------|------|-----|
| **Deck registry** | Audience, date, owner, objective, status | Single source of truth for what is being prepared. |
| **Slide plan** | Slide-by-slide status, owner, evidence state | Prevent hidden blockers. |
| **Data request queue** | Open asks, owner, due date, priority | Convert vague follow-ups into tracked execution. |
| **Source library** | Email/deck/workbook links and notes | Keep every claim anchored to a reference. |
| **Audit trail** | Timestamped actions/changes | Show rigor for board/audit governance. |

### Weekly cadence (until March board/audit week)

1. Refresh open data gaps and assign owners.
2. Promote resolved gaps into slide readiness.
3. Re-check narrative against latest meeting signals.
4. Export concise board and audit versions with explicit asks.

### Personal growth outcomes (explicit)

- Mike can speak to Abivax strategy, not only ERP mechanics.
- Mike can identify when external company events require ERP plan adjustments.
- Mike can brief executives with source-backed confidence levels and clear asks.
- Mike can distinguish noise from actionable signal quickly under pressure.
