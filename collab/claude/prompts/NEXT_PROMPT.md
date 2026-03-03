# Claude Next Prompt — Session Handoff

**Last updated:** 2026-03-03 (Claude, end of session)

---

## What happened this session (2026-03-03)

1. **Light palette transition** — All HTML pages converted to light palette (white/light gray, dark text). P2P Intelligence Brief, Program Command Center, NetSuite Vendor Brief all live on light palette. Design standard documented in `MIKE_DESIGN_PREFERENCES.md` and `CLAUDE.md`.

2. **NetSuite vendor brief page built** — New page at `/abivax/spine/netsuite` (`public/netsuite-vendor-brief.html`). Built pre-meeting with placeholders, then fully populated after Mar 3 call with:
   - Oracle contacts confirmed: Jamal Azil (licensing), Venceslas Dechallens (pre-sales/scope+budget), Ali Brahmi (lead delivery)
   - 2 docs in transit: License Agreement + SOW
   - 5 commercial findings under negotiation (license overscope, NSAW/NSIP validation, ACS overlap, e-invoicing deferral, Zone apps third-party flag)
   - Implementation model recommendation: NetSuite (Ali) + KPMG only — no 3rd-party implementer

3. **pillar_synthesis.json updated** — Governance pillar rebuilt with Mar 3 call findings, commercial risk flags, Oracle contact details, waitingOn items for Jamal/Oracle docs.

4. **Audit Committee deck Slide 4 Commercials updated** — `outputs/Audit_Committee_ERP_Controls_Mar2026.pptx`:
   - Replaced "~$1M Year 1 assumption" with confirmed KPMG figures: €650,129 Year 1 (€463,120 build + €187,009 run), €1,023,264 3-year total
   - Note field updated: "KPMG-confirmed (Mar 3)" + license/SOW in transit + commercial review ongoing

5. **Camille/Adrian characterizations corrected across codebase** — Fixed in CLAUDE.md, NEXT_PROMPT.md, pillar_synthesis.json, program-command-center.html:
   - Camille Girard = KPMG implementation advisory. Mike awaits her KPMG scope proposal. She has no role in Audit Cmte meeting logistics.
   - Adrian Holbrook = Sr. Financial Analyst / FP&A. Mike must SEND slides TO Adrian by Mar 6. Adrian emailed Feb 19 requesting them; Adrian presents, Mike authors.

6. **NEW: Audit Committee ERP Overview deck created** — `outputs/presentations/Audit Committee ERP Overview.pptx`. 5-slide high-level deck (light palette) built via python-pptx:
   - Slide 1: Title
   - Slide 2: ERP Program Overview (why/what/who)
   - Slide 3: Implementation Timeline (phase bar + 4 milestones)
   - Slide 4: Financial Overview (€650K Year 1 / €1.02M 3-year stat cards + build/run breakdown)
   - Slide 5: Audit Committee Ask (3 numbered asks)
   - Registered in `presentations.json` as `audit-committee-erp-overview-20260306` (status: ready)

7. **Controls deck repositioned** — `outputs/Audit_Committee_ERP_Controls_Mar2026.pptx` no longer for Mar 6. Renamed in `presentations.json` to "ERP Controls Posture & Remediation Roadmap." Status: draft. Meeting date: TBD (est. Q3 2026). Strategic rationale: first Audit Committee intro should be high-level; controls deep-dive deferred until post-blueprint phase.

8. **SpineNav updated** — NetSuite added to Operate section nav items.

---

## What's next (priority order)

1. **Mike action due Mar 6** — Send `outputs/presentations/Audit Committee ERP Overview.pptx` to Adrian Holbrook (Sr. Financial Analyst / FP&A). Deck is ready. Adrian presents at Audit Committee; Mike is author.

2. **Board deck first draft** — `outputs/Board_ERP_Readout_Mar19_2026.pptx`. Due to Didier by March 13. Board meeting March 19. Content is largely in system. Not yet started.

3. **Oracle/NetSuite docs** — Awaiting from Jamal: license breakdown, SOW, legal agreements. When received: route Zone apps (ZoneCapture/ZoneReconcile) to legal review, run license rationalization exercise.

4. **Today page HTML brief** — Next candidate for HTML-first approach. Existing React page reads like a wall of text. See `collab/claude/outputs/2026-02-27_today-layout-critique-mike-friendly-v2.md` for prior critique.

5. **Stakeholder Brief pages** — Person pages moving toward Chief-of-Staff Brief model. HTML-first approach applies.

---

## Active design rules (as of 2026-03-03)

- **Light palette** — white/light gray backgrounds (#F8F9FA, #FFFFFF), dark text (#111827), restrained color for status signals only
- No dark backgrounds on any new pages
- HTML-first for read-only briefing surfaces; React/Next.js only when interaction or data-binding needed
- See `collab/claude/MIKE_DESIGN_PREFERENCES.md` for full design compass

---

## Key facts to remember

- ERP go-live: Jan 1, 2027 (non-negotiable)
- Implementation: April 2026 mobilization
- Board meeting: March 19, 2026 (deck to Didier by March 13)
- Audit Committee: March 6. Mike must send **Audit Committee ERP Overview deck** to Adrian Holbrook by Mar 6. Deck is at `outputs/presentations/Audit Committee ERP Overview.pptx` — 5 slides, ready.
- Camille Girard (KPMG): awaiting her KPMG implementation scope proposal (ongoing KPMG role: change management / fit & functionality). She has no role in the Mar 6 Audit Cmte meeting.
- Oracle contacts: Jamal Azil (licensing), Venceslas Dechallens (pre-sales), Ali Brahmi (delivery)
- KPMG figures confirmed: €650K Year 1, €1.02M 3-year
- Implementation model: NetSuite (Ali) + KPMG only — no third-party implementer

---

## How to use this file

Paste the contents of this file as your first message when starting a new Claude session. Claude will orient immediately without re-reading all source files.
