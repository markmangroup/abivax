# Email Analysis — 2026-03-04
Generated: 2026-03-04T16:00:00Z
Source: triage_2026-03-04.json (22 emails, 2 noise excluded)

## Urgent / Needs attention now

1. **GitGuardian: Generic Password exposed on GitHub** — `markmangroup/abivax` repo. Pushed Mar 3 17:30 UTC. This needs immediate remediation: rotate the credential and remove from git history.
2. **CFGI Thursday call prep** — Angela DePoy set up a 30-min call Thursday (Mar 6) with Shine Thomas (Partner, ERP practice), Ken Schatz (MD, NetSuite), and Guy Morissette (Director, NetSuite). Angela also asked for the RFP/NetSuite response (redacted). Walid separately offered to discuss operational support resourcing.
3. **Adrian's controls slides delivered** — Adrian sent back "Q4 2025 Financial Results ERP - Mike.pptx" as a first draft aligned to Abivax PPT template. This closes the open data gap for Adrian's 3-slide controls pack.

## Draft replies ready

- **Angela DePoy (CFGI)** — Re: RFP request + Thursday call agenda
  → `collab/claude/outputs/drafts/2026-03-04_reply-depoy.md`
- **Juliette Courtot** — Re: PTP Process + Paris trip scheduling
  → `collab/claude/outputs/drafts/2026-03-04_reply-courtot.md`

## Data updates for Codex

```
DATA UPDATE NEEDED
File: data/abivax/pillar_synthesis.json
Field: controls.openDataGaps
Change: Mark "Adrian's 3-slide controls pack" as RECEIVED (Mar 3, 2026)
Source: Adrian Holbrook email "Re: Audit committee slides" with attachment "Q4 2025 Financial Results ERP - Mike.pptx"
Confidence: high
Tell Codex: update pillar_synthesis.json — Adrian controls pack gap is closed
```

```
DATA UPDATE NEEDED
File: data/abivax/pillar_synthesis.json
Field: governance.negotiationGuidance
Change: Add Camille's negotiation points: (1) e-invoicing perimeter needs clarification, (2) daily rate 960€ already low — don't over-negotiate, (3) license discount currently 29% on 3-year — explore longer duration for better rate, (4) watch fixed-fee exit conditions
Source: Camille Girard email "Discussion with Netsuite" Mar 3
Confidence: high
Tell Codex: update pillar_synthesis.json governance section with Camille negotiation guidance
```

```
DATA UPDATE NEEDED
File: data/abivax/entities.json
Field: New contacts to track
Change: Add the following new contacts from CFGI NetSuite team:
  - Shine Thomas (Partner, CFGI ERP practice, ex-KPMG 18yr, Life Sciences)
  - Ken Schatz (Managing Director, CFGI, NetSuite specialist, 20yr financial systems)
  - Guy Morissette (Director, CFGI, NetSuite practitioner, 20yr biotech)
  - CFGI IT SOX Manager (unnamed, ex-EY Paris, French, Boston-based, under Angela's team)
Source: Angela DePoy introduction email Mar 3
Confidence: high
Tell Codex: add CFGI NetSuite team members to entities.json
```

```
DATA UPDATE NEEDED
File: data/abivax/pillar_synthesis.json
Field: p2p.contacts
Change: Note Juliette Courtot proactively reached out about PTP process documentation and Paris meeting. She teleworks Mon/Thu. Available week of Mar 16.
Source: Juliette Courtot email "PTP Process + your trip in Paris" Mar 3
Confidence: high
Tell Codex: update P2P pillar with Juliette availability and upcoming Paris meeting
```

```
DATA UPDATE NEEDED
File: CLAUDE.md
Field: Current Facts — open data gaps
Change: Remove "Adrian's 3-slide controls pack" from the three open Audit deck data gaps. Remaining gaps: (1) Audit Cmte meeting date confirmation with Camille, (2) Commercial/timeline package from NetSuite.
Source: Adrian Holbrook email with attachment Mar 3
Tell Codex: update CLAUDE.md open data gaps
```

## Todos

### Open new

```
NEW TODO
Title: Remediate GitGuardian password exposure in markmangroup/abivax
Owner: Mike (requires repo admin access)
Source: GitGuardian alert email, Mar 3
Deadline: ASAP
Context: Generic password committed to repo. Needs credential rotation and history cleanup.
Suggested queue: Mike action
```

```
NEW TODO
Title: Prep for CFGI Thursday call (Mar 6) — gather RFP/NetSuite response docs
Owner: Mike
Source: Angela DePoy email thread, Mar 3
Deadline: Mar 5 (day before call)
Context: Angela asked for redacted RFP/response. Also prep discussion points for PMO model, SOD/SDLC workstream, French-speaking IT SOX Manager.
Suggested queue: Mike action
```

```
NEW TODO
Title: Review Adrian's controls draft deck and provide feedback
Owner: Mike + Claude
Source: Adrian Holbrook email "Re: Audit committee slides" with "Q4 2025 Financial Results ERP - Mike.pptx"
Deadline: Mar 5 (ahead of Mar 6 Audit Committee)
Context: Adrian recreated slides to align with Abivax PPT template. Needs review against our v2 Audit Committee deck.
Suggested queue: claude_lane_queue
```

```
NEW TODO
Title: Schedule reference calls with EFESO (NetSuite) and H2Air/Cerba (SAP)
Owner: Mike
Source: Aymen Ben Alaya email "Reference contact & template" Mar 4
Deadline: Before contract signing
Context: EFESO contact: Laure Tchervenkov. SAP refs: H2Air CFO, Cerba COO. Second NetSuite ref pending from NetSuite. KPMG provided reference call template on SharePoint.
Suggested queue: Mike action
```

```
NEW TODO
Title: Reply to Juliette Courtot — request PTP documentation + schedule Paris meeting
Owner: Mike
Source: Juliette Courtot email "PTP Process + your trip in Paris" Mar 3
Deadline: Before Mar 16 Paris trip
Context: Juliette proactively offered to share P2P process docs and meet in person. She teleworks Mon/Thu, so Tue Mar 17 or Wed Mar 18 best.
Suggested queue: Mike action (draft ready)
```

```
NEW TODO
Title: Log into Concur and submit Paris flight expense
Owner: Mike
Source: Kimberly Gordon email "RE: Concur Access for Reimbursements" Mar 3
Deadline: Before Mar 10 batch close
Context: Kimberly sent direct login URL. Need to set up banking info in profile for reimbursement.
Suggested queue: Mike personal
```

### Close

```
CLOSE TODO
Queue item ID: claude-synthesis-open-threads-1 (partial)
Thread: "NetSuite vendor references (Camille requesting)"
Reason: Aymen Ben Alaya sent reference contacts (EFESO for NetSuite, H2Air and Cerba for SAP). One NetSuite reference still pending from NetSuite side.
Status: Partially resolved — first NetSuite ref provided, second pending.
```

## Attachments to ingest

```
ATTACHMENT TO INGEST
File: Q4 2025 Financial Results ERP - Mike.pptx
From: Adrian Holbrook
Likely content: Adrian's first-pass controls/ERP slides for Audit Committee, aligned to Abivax PPT template. This is the 3-slide pack that was a known open data gap.
Tell Codex: ingest attachment from inbox_assets/2026-03-03-holbrook/
Priority: HIGH — needed for Audit Committee Mar 6
```

```
ATTACHMENT TO INGEST
File: Reference call template.pptx (SharePoint link)
From: Aymen Ben Alaya (KPMG)
Likely content: Template for vendor reference calls — structured format to capture findings
Tell Codex: download from SharePoint link and ingest to data/abivax/
```

## Scheduling

```
SCHEDULING
Subject: CFGI NetSuite Implementation Discussion
Date/time: Thursday Mar 6 (time TBD, likely 11am EST based on Mike's availability note)
Conflict check: CONFLICT — Mar 6 is also Audit Committee day
Suggested action: Confirm time doesn't overlap with Audit Committee session. If it does, propose Friday Mar 7.
```

```
SCHEDULING
Subject: Juliette Courtot P2P meeting in Paris
Date/time: Week of Mar 16, preferably Tue Mar 17 or Wed Mar 18 (Juliette teleworks Mon/Thu)
Conflict check: Clear — Paris trip is already planned for that week
Suggested action: Accept. Send invite once Paris schedule is confirmed.
```

## Filed (no action)

3 items:

- QMS Documents weekly update (Malinda Micho) — company-wide, not ERP-relevant
- Smartsheet Access notice (Jim Huebner) — company-wide IT, not ERP-relevant
- Outlook Reaction Digest — automated notification (noise)

## What Mike needs to do

1. **GitGuardian alert: rotate the exposed credential and clean git history.** This is a security issue in the markmangroup/abivax repo.
2. **Prep for Thursday CFGI call:** gather the RFP/NetSuite response docs (redacted) for Angela. Review the draft reply at `collab/claude/outputs/drafts/2026-03-04_reply-depoy.md` and send.
3. **Review Adrian's controls deck** ("Q4 2025 Financial Results ERP - Mike.pptx") — compare against our v2 Audit deck and decide which version/merge to present Mar 6.
4. **Reply to Juliette Courtot** about PTP docs and Paris scheduling. Draft ready at `collab/claude/outputs/drafts/2026-03-04_reply-courtot.md`.
5. **Schedule NetSuite reference call** with EFESO contact (Laure Tchervenkov) using KPMG's template. SAP refs available too if useful for comparison notes.
6. **Log into Concur** via Kim's direct URL and submit Paris flight expense before Mar 10 batch close.
7. **KPMG Friday meeting** — scope the PMO engagement, ask about Camille's maternity timeline, confirm Aymen's capability and availability as France-based PMO lead.
