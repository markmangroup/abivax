# Search Results: "Camille" and "Adrian" References

## Search Parameters
- Directory: `/sessions/intelligent-wizardly-ritchie/mnt/abivax-1`
- Pattern: "Camille" or "Adrian" (case-sensitive)
- File types: `.md`, `.json`, `.txt`, `.html`, `.tsx`, `.ts`, `.js`
- Excluded: `node_modules`, `.git`, `.next` directories
- Total matches found: **623 lines across 40+ files**

---

## Files by Frequency

### Highest Frequency (Primary Relevance)

1. **./collab/claude/outputs/emails_2026-03-02_complete.md** (189 lines)
   - Complete email thread export for audit/ERP decisions
   - Contains extensive Camille Girard (KPMG) and Adrian Holbrook correspondence

2. **./data/abivax/emails_staging/emails_2026-03-02.json** (100 lines)
   - Email metadata and staging data

3. **./collab/claude/outputs/emails_2026-03-02_extracted.json** (100 lines)
   - Extracted email data in JSON format

4. **./collab/claude/outputs/email-analysis-2026-03-02.md** (38 lines)
   - Analysis summary of email threads

5. **./data/abivax/notes.json** (26 lines)
   - System notes referencing Camille and Adrian

6. **./data/abivax/pillar_synthesis.json** (19 lines)
   - ERP pillar synthesis with action items for both individuals

---

## Key Files by Content Type

### Actionable Items / Queue Files

**./collab/claude/prompts/NEXT_PROMPT.md** (3 matches)
- Context: Current sprint next actions
- Key lines:
  - Line 22: "Deck due March 6. Still needs: Audit Cmte date (Camille) and Adrian's 3-slide controls pack."
  - Line 32: "Awaiting: (a) Camille confirms meeting date, (b) Adrian sends 3-slide controls pack. Deck otherwise complete."
  - Line 56: "Audit Committee: March 6 deck due (date TBD with Camille)"

**./data/abivax/claude_lane_queue.json** (7 matches)
- Queue items with Camille/Adrian dependencies

### HTML Pages (User-Facing)

**./public/program-command-center.html** (6 matches)
- Controls/audit pillar summary
- Line 296: "Adrian Holbrook owns controls pack (3 slides pending)...Audit Committee readout is Mar 6"
- Line 305: "Receive Adrian's 3-slide controls pack" (move item)
- Line 310-311: Waiting items for both Adrian and Camille
- Lines 384-391: Person cards for Adrian Holbrook (Controls Lead) and Camille Girard (Audit Cmte Liaison)

**./public/p2p-intelligence-brief.html** (1 match)
- Line 411: "AP / Camille" (responsibility assignment)

### Canonical Data Files

**./data/abivax/pillar_synthesis.json** (19 matches)
- Governance pillar synthesis with current status
- Includes waitingOn/action items for Adrian and Camille

**./data/abivax/entity_profiles.json** (14 matches)
- Profile data for both individuals

**./data/abivax/meetings.json** (5 matches)
- Meeting records (e.g., Feb 17 meeting organized by Camille)

**./data/abivax/org_graph.json** (4 matches)
- Organization relationships

**./data/abivax/presentations.json** (6 matches)
- Presentation metadata

---

## Email Intelligence

### Camille Girard (KPMG Senior Manager, Audit Committee Liaison)

**Role:** ERP selection facilitator, Audit Committee representative

**Key Interactions (Feb 26-27, 2026):**
- Sent intro/endorsement to Oracle contacts (Jamal Azil, Venceslas, Vincent, Laurent)
- Involved in initial NetSuite contact facilitation
- Primary point of contact for Audit Committee meeting coordination

**Current Status:**
- **WAITING:** Audit Committee meeting date confirmation (needed for Audit deck Slide 3 finalization)
- Last interaction: Feb 27 email threads discussing vendor handoff from KPMG to Hema/Mike

**Contact:** camillegirard@kpmg.fr

---

### Adrian Holbrook (Abivax Sr. Financial Analyst, Controls Lead)

**Role:** CFTI controls owner, controls pack preparation

**Key Actions:**
- Owns controls/audit pillar for ERP program (84 controls in scope)
- Responsible for 3-slide controls pack for Audit Committee deck

**Current Status:**
- **WAITING:** Must deliver 3-slide controls pack (needed by March 6 for Audit deck)
- No deficiency inventory yet
- Email timestamp: Feb 27, 2026 (March Madness sign-up context)

---

## Decision/Action Items Requiring These Individuals

### Camille Girard
1. **Confirm Audit Committee meeting date** (deadline: before March 6)
   - Impacts: Audit Committee deck finalization, Slide 3 scheduling

### Adrian Holbrook
1. **Deliver 3-slide controls pack** (deadline: before March 6)
   - Impacts: Audit Committee deck Slides 5-7 (estimated)
   - Content: Controls summary, deficiency review, remediation timeline

---

## Cross-References

### Related Files Mentioning Both
- `./collab/claude/outputs/audit-cmte-deck-copy-review-2026-03-02.md` (16 matches)
- `./outputs/board/email-context-*.md` (multiple context files, 3-8 matches each)
- `./src/app/abivax/spine/today/page.tsx` (7 matches - Today page action items)

### Email Thread Context
- Governance handoff discussion: Mike Markman to KPMG (Camille/Aymen), with Oracle introduction
- Legal review coordination: Jade Nguyen to Camille on external counsel requirements
- KPMG commercials: Confirmed €650,129 Year 1 / €1,023,264 3-year (Camille sourced)

---

## Summary Statistics

- **Total matching files:** 40+
- **Total matching lines:** 623
- **Primary concern files:** 6 (queue/prompt/synthesis/HTML briefing)
- **Email volume (Camille):** ~14 emails in recent export
- **Open dependencies:** 2 critical (Camille date + Adrian pack)
- **Target deadline:** March 6, 2026 (Audit Committee deck)

