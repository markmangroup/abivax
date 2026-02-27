# Stakeholder Brief — Wording/Style Pass: Fact-Based Operator Language

**Queue item:** `claude-writing-stakeholder-briefs-1`
**Date:** 2026-02-26
**Targets:** Hema Kesh, Trinidad, Frederick, Kimberly Gordon, Matt Epley, Jade Nguyen

---

## 1. What is wrong (specific)

The current `buildPersonBriefNarrative` produces text like:

> *"Hema Kesh is tracked as Finance lead (FP&A, treasury, tax, accounting) in Finance and reports to Didier Blondel (Abivax Global). Current ERP workstream tags: budget approval path, finance scope lock, p2p + reporting priority. No tracked evidence or request exchange is currently linked."*

Problems:
- **"is tracked as"** — database language; reads like a record label, not a role description
- **"Current ERP workstream tags:"** — metadata surface; not informative about what the person is actually doing
- **"Tracked evidence\request state: X open requests pending"** — ticket-system phrasing; Mike doesn't need to know how many request items exist, he needs to know what's live
- **"No tracked evidence or request exchange is currently linked."** — worst offender; empty state shown as a sentence produces noise with no meaning
- Sentence 1 always has the same structure for every person — it becomes wallpaper; the eye skips it after the first read

Result: Every person page opens with three sentences that could have been written by querying a join table. They convey no operational signal.

---

## 2. Style guidelines — operator brief language

**Principles:**

1. **Lead with function, not metadata label.** Say what the person owns and does — not how they are categorized in the system.
2. **State the live situation.** One sentence on what is active, unresolved, or in motion — not tags.
3. **End with the open action.** One concrete thing Mike needs to do with or about this person.
4. **No filler empty states.** If nothing is live, omit that field rather than printing "nothing tracked."
5. **Title/role from org source, not internal label.** Use `graphJobTitle` + `graphReportsTo` when available — these are accurate; the `role` field in `properties` is often a working note.
6. **2–3 sentences max.** The brief is a header, not a profile. Details live in the signals/decisions/loops sections below.

**Banned phrases:**
- "is tracked as"
- "ERP workstream tags:"
- "Tracked evidence/request state:"
- "No tracked evidence or request exchange is currently linked."
- "is linked to workstreams/systems:"
- "profile baseline ->"

---

## 3. Proposed rewrite — example paragraphs

### Hema Kesh
**Current:**
> Hema Kesh is tracked as Finance lead (FP&A, treasury, tax, accounting) in Finance and reports to Didier Blondel (Abivax Global). Current ERP workstream tags: budget approval path, finance scope lock, p2p + reporting priority. No tracked evidence or request exchange is currently linked.

**Rewrite:**
> SVP Finance, reporting to Didier Blondel. Owns ERP scope decisions across P2P, financial reporting, consolidation, treasury, and multi-GAAP requirements. Budget baseline with Didier not yet confirmed; ERP negotiation ownership not yet assigned.

---

### Trinidad Mesa
**Current:**
> Trinidad is tracked as Accounting manager, drives consolidation in Finance and reports to Hema Kesh (Abivax France). Current ERP workstream tags: consolidation ownership, monthly close coordination, finance handoff dependencies. Trinidad capacity risk could affect timeline and readiness.

**Rewrite:**
> Finance & Accounting Director (France), reporting to Hema Kesh. Drives monthly close and consolidation; primary execution voice for French finance. Capacity constraints flagged — close coordination required during ERP design phase.

---

### Frederick Golly
**Current:**
> Frederick is tracked as FP&A lead in FP&A and reports to Hema Kesh (Abivax France). Current ERP workstream tags: budget tracking cadence, fp&a baseline, audit committee inputs.

**Rewrite:**
> Director FP&A (France), reporting to Hema Kesh. Owns budget tracking and Adaptive planning baseline. Route detailed ERP budget scope discussions through Frederick; audit committee inputs depend on his cadence.

---

### Kimberly Gordon
**Current:**
> Kimberly Gordon is tracked as P2P contractor in P2P and reports to Matt Epley (Abivax US). Current ERP workstream tags: us p2p execution, invoice process handoff, us vendor controls.

**Rewrite:**
> P2P contractor (US), reporting to Matt Epley. Handles US invoice processing and vendor controls. Critical dependency for P2P scope coverage on the US side.

---

### Matt Epley
**Current:**
> Matt Epley is tracked as Boots-on-ground accountant in Finance and reports to Hema Kesh (Abivax US). Current ERP workstream tags: sec reporting dependencies, accounting close impacts, equity integration constraints.

**Rewrite:**
> Finance Manager (US), reporting to Hema Kesh. Handles SEC reporting, financial press releases, equity tracking (Activa/Certent), and SOX-impacted close processes. Open: clarify FPI-driven reporting calendar milestones and ERP system dependencies.

---

### Jade Nguyen (pronunciation: Jahd)
**Current:**
> Jade Nguyen is tracked as IT lead/contact for ERP integration coordination in IT and reports to Christophe Hennequin (Abivax France). Current ERP workstream tags: it resourcing model, integration ownership, sage support boundary, it involvement session.

**Rewrite:**
> IT Consultant (France), reporting to Christophe Hennequin. Primary IT coordination point for ERP integration and access. Confirmed limited Sage support capacity; integration ownership model still needs scoping with Christophe.

---

## 4. Why this is better

- **Reads like a chief-of-staff brief** — one glance gives Mike role, current situation, and next action
- **Signals the gap, not the tag** — "budget baseline not confirmed" is more useful than "budget approval path" as a tag
- **Respects empty states** — no sentence is printed just to say nothing is happening
- **Scales well** — same 2–3 sentence structure works for all person types without sounding repetitive because each sentence carries different operational content
- **No interpretation/ranking** — no "critical stakeholder," no "high-priority contact"; just what they do and what's open

---

## 5. What Codex should implement

**File:** `src/app/abivax/spine/entity/[slug]/page.tsx`
**Function:** `buildPersonBriefNarrative` (lines ~295–328)

Minimal changes:

1. **Drop sentence 1 template** — replace `${name} is tracked as ${roleText} in ${team} and reports to ${reportsTo}` with `${graphJobTitle || role}${team ? `, ${team}` : ""}${orgEntity ? ` (${orgEntity})` : ""}${reportsTo ? `, reporting to ${reportsTo}` : ""}.`

2. **Replace workstream tags sentence** — instead of printing `Current ERP workstream tags: X, Y, Z`, use the `focusHints` as prose:
   - If hints exist: `Active on: ${pillarHints.slice(0, 2).join("; ")}.`
   - If hints are empty: omit the sentence entirely

3. **Replace request-state sentence** — if `waitingCount > 0`, output: `${waitingCount} open request${waitingCount === 1 ? "" : "s"} pending.` — otherwise omit entirely (no "nothing tracked" sentence)

4. **Add `graphJobTitle` to the function input signature** — it is more accurate than the `role` field for the title portion of sentence 1

The function signature change is small. No data pipeline changes needed — `graphJobTitle` is already present in `entity.properties` for all six targets.
