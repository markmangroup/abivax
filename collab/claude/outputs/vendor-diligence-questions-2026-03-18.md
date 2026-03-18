# Vendor Diligence — Open Questions for Codex
**Prepared by Claude | 2026-03-18**
**Purpose:** Mike has three calls today (NetSuite/Jamal, KPMG partner, CFGI/Ken). This file gives Codex specific search instructions and structured questions to fill in from Mike's emails, documents, and any files on the work computer. Claude will use the responses to build the final vendor decision document.

---

## Instructions for Codex

Search the following sources in order of priority:
1. **Outlook inbox and sent items** — search by sender and subject keywords listed per section
2. **`data/abivax/vendor-assets/`** — the actual PDFs and XLSX files already in the repo
3. **SharePoint** — if accessible, for any shared negotiation or team documents
4. **`data/abivax/emails_staging/`** — existing parsed email JSON in the repo

**Response format:** Create a new file at `collab/claude/outputs/vendor-diligence-responses-2026-03-18.md`. For each question:
- Answer with the exact source (file path, email subject, sender, date)
- If the answer is a number, quote it exactly
- If the information is not found anywhere, write `NOT FOUND` — do not guess or infer
- If the information is partially found but incomplete, write `PARTIAL:` and explain what is and isn't known

**Confidence flag:** After each answer, add one of: `[CONFIRMED]`, `[PARTIAL]`, or `[NOT FOUND]`

---

## Section 1 — NetSuite Scope and Pricing (Jamal Azil / Oracle)

**Search targets:**
- Outlook: sender `jamal.azil` OR subject containing `ABIVAX` + `NetSuite` — all emails from March 10 onward
- File: `data/abivax/vendor-assets/netsuite-commercial/NetSuite Offer Summary V2.xlsx` — open and read all tabs
- File: `data/abivax/vendor-assets/netsuite-commercial/SuiteSuccess Financials Premium SOW UK - ABIVAX draft V3 17032026.pdf` — full text extraction
- File: `data/abivax/vendor-assets/netsuite-commercial/Netsuite RACI standard Suite Success ABIVAX V1.xlsx` — read all tabs
- File: `data/abivax/vendor-assets/netsuite-commercial/ABIVAX TEAM V1.pptx` — read all slides

**Questions:**

**NS-1.** Has Order to Cash (O2C) and Design to Build / Inventory been formally removed from the Phase 1 SOW scope? The repo's current V3 SOW (March 17) still includes both. Is there a V4 SOW, a revised offer summary, or an email from Jamal confirming this removal and a revised price? Exact revised implementation fee if changed.

**NS-2.** What is the exact current Phase 1 implementation price after any scope changes? Break out: fixed implementation fee, recurring license, training, travel cap. Do not use V2 numbers if there is a later revision.

**NS-3.** From the ABIVAX TEAM V1.pptx — who are the named people on the NetSuite delivery team? List each person's name, role, and any stated background or credentials. Is there a named Project Manager or Delivery Lead? Is anyone France-based or French-speaking?

**NS-4.** From the RACI workbook — what specific activities does NetSuite own vs. what does Abivax own? Specifically: who owns data extraction, data cleansing, data validation, UAT test case creation, and cutover coordination?

**NS-5.** Is there any email from Jamal or the NetSuite team after March 17 that discusses scope changes, pricing revisions, reference clients, or delivery team details? Quote the relevant sections.

**NS-6.** Are Electronic Invoicing / e-invoicing and French VAT declaration explicitly covered in the current SOW scope? Is there any mention of DRC (French government platform) or Avalara? Quote the exact language if present.

**NS-7.** What reference clients does NetSuite propose for Abivax to contact? Are any references listed in emails or documents — company names, contact names, industry, company size? Jade Nguyen was coordinating references — are there any emails from Jade or to Jade on this topic?

---

## Section 2 — CFGI Implementation Proposal (Kenneth Schatz)

**Search targets:**
- Outlook: sender `ken.schatz` OR `kenneth.schatz` OR `@cfgi.com` — all emails
- File: `data/abivax/vendor-assets/cfgi-implementation/CFGI_Abivax_NS_Proposal_03.10.26.pdf` — full text extraction
- Any CFGI attachments in email (team bios, case studies, credentials, reference lists)

**Questions:**

**CFGI-1.** From the implementation proposal PDF — who are the named CFGI delivery team members for the Abivax engagement? List each person's name, role/title, and any stated experience or credentials. Are NetSuite certifications mentioned for any of them?

**CFGI-2.** Does the proposal or any CFGI email include implementation references — clients where CFGI delivered a NetSuite implementation? List any company names, industries, sizes, or contact names mentioned. Flag if none are provided.

**CFGI-3.** The CFGI SOW explicitly excludes "French on-site project manager support" as separate scope. Is there any email or document where Ken or anyone at CFGI clarifies how they intend to cover France-side delivery — is the expectation that Walid's local PMO proposal (from Walid Bouassida) fills this gap?

**CFGI-4.** The CFGI SOW also excludes "SOX-related SDLC activities." Given CFGI is Abivax's existing SOX advisor, is there any email or document that discusses how they would handle the separation between the implementation team and the SOX advisory team — or whether this is an issue at all?

**CFGI-5.** Is there any email from Ken or CFGI after March 10 (after their implementation proposal was sent) that revises pricing, adjusts scope, or responds to any pushback from Mike or the Abivax team?

**CFGI-6.** What exactly is CFGI's Phase 1 scope? The repo says: OneWorld multi-entity, IFRS/GAAP multi-book, R2R, P2P, 5 integrations, NSAW, change management, data migration (list records, opening balances, historical trial balances). Confirm this from the actual PDF. Is e-invoicing / French regulatory compliance covered or excluded?

**CFGI-7.** What are the travel and expense terms in the CFGI proposal? Is there a cap or estimate? How do they bill for Europe-based work from a US team?

**CFGI-8.** Does CFGI mention April 2026 as their kickoff assumption? If a decision were made this week (March 18-19), does their timeline still work?

---

## Section 3 — CFGI Local PMO / Change Proposal (Walid Bouassida)

**Search targets:**
- Outlook: sender `walid.bouassida` OR `@cfgi.com` — all emails
- File: `data/abivax/vendor-assets/cfgi-pmo-change/Abivax_CFGI_PMO&Change proposal.pdf` — full text extraction
- Any attachments from Walid (team bios, background materials)

**Questions:**

**WALID-1.** From the PDF — list every person named in the CFGI local PMO/change proposal. For each: name, role, stated allocation percentage (if given), and any background details. Specifically: what is Walid Bouassida's stated background and experience?

**WALID-2.** The proposal is T&M. Does it state hourly or daily rates anywhere, or reference "discounted SOX rates"? What are the actual rates if stated?

**WALID-3.** Is there any language in the proposal about how the local PMO team coordinates with the CFGI US-based implementation team? Or is the proposal written as if it stands alone beside an external SI (e.g., NetSuite)?

**WALID-4.** Is Jean-Arnold Coutareau's role described anywhere — what is his background and why is he listed at "low allocation"?

**WALID-5.** Are there any emails from Walid after March 17 that revise, clarify, or follow up on the proposal?

---

## Section 4 — KPMG AMOA Proposal (Camille Girard / Toufik Madjoubi)

**Search targets:**
- Outlook: sender `camille.girard` OR `@kpmg.com` — all emails March 1 onward
- File: `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.pdf` — full text extraction
- File: `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.text.json` — if this parsed version exists, read it

**Questions:**

**KPMG-1.** From the PDF CVs section (pages 28–35) — what is Olivia Berry's stated background, experience, and any ERP or controls-specific credentials? Has she worked on NetSuite implementations or ERP controls reviews specifically?

**KPMG-2.** From the same CVs section — what is Toufik Madjoubi's stated background? Is there a specific mention of AMOA, PMO, or ERP implementation experience at comparable scale?

**KPMG-3.** Is there any email from Camille or KPMG after March 10 that discusses scope flexibility, willingness to narrow to a controls-only engagement, or revised pricing? Has Mike or anyone at Abivax communicated to KPMG that the full AMOA scope may be more than needed?

**KPMG-4.** The proposal names both Camille Girard and Toufik Madjoubi as PMO leads. Is there any email clarifying which one would be the primary day-to-day contact? Camille sent the proposal — is she confirmed as available for this engagement?

**KPMG-5.** From the proposal — does KPMG have any independence conflict if CFGI is the SI? The KPMG team would be doing functional assurance / controls review on a CFGI-delivered implementation. Is there any language about independence requirements or conflict checks in the proposal?

**KPMG-6.** Is there any mention in emails or the proposal of KPMG's prior work with Abivax beyond the ERP selection (RFP analysis)? Camille was involved in prior consolidation work per meeting notes — is there a description of what that was?

---

## Section 5 — Reference Diligence (Jade Nguyen coordination)

**Search targets:**
- Outlook: sender or recipient `jade.nguyen` OR `jade` — emails about "references" or "NetSuite references"
- Any email thread about reference calls or reference clients

**Questions:**

**REF-1.** Has Jade sent or received any emails arranging NetSuite reference calls? If yes: who are the reference companies, what dates/times are scheduled, and has Mike confirmed participation?

**REF-2.** Have any reference calls already happened? If yes: are there any notes, summaries, or email follow-ups capturing what was learned? Specifically: did the references address delivery lead continuity, multi-GAAP complexity, France-side coverage, or UAT/cutover discipline?

**REF-3.** Has anyone at Abivax (Mike, Jade, Hema) asked CFGI for implementation references? If yes, has CFGI responded with any names or materials?

---

## Section 6 — Scope / Regulatory (French requirements)

**Search targets:**
- Outlook: search subject containing "e-invoicing" OR "DRC" OR "Chorus Pro" OR "e-facture" OR "Avalara" OR "French VAT"
- Any email from Jade or IT team about French regulatory requirements

**Questions:**

**FR-1.** Is there any email or document that specifically addresses French mandatory e-invoicing requirements (DRC platform / Chorus Pro / e-facture reform)? What is the stated timeline for compliance and is it in any vendor's scope?

**FR-2.** Is there any email discussing French GAAP vs. IFRS vs. US GAAP as a specific implementation requirement? Has any vendor confirmed their approach to multi-book / multi-GAAP in a documented way?

**FR-3.** Is the ZoneCapture OCR gap (raised in early NetSuite demo notes — not native to NetSuite) still an open item? Has any vendor addressed it in subsequent emails or documents?

---

## Section 7 — Budget and Authorization

**Search targets:**
- Outlook: sender `hema.keshava` OR `didier.blondel` — emails about budget or ERP spend approval
- `data/abivax/budget.json` — already in repo

**Questions:**

**BUD-1.** Is there an email from Hema or Didier confirming the approved budget envelope for ERP implementation + support? The working assumption in notes was ~$1M. Is that confirmed and is it EUR or USD?

**BUD-2.** Is there any email discussing budget approval process — does the board need to approve the specific vendor contracts, or does Hema/Didier have authority to sign?

**BUD-3.** Is there any communication about whether the implementation support budget (KPMG AMOA / CFGI PMO) is a separate line from the NetSuite/CFGI implementation contract, or are they expected to come from the same envelope?

---

## Priority Flags for Today's Calls

Codex: in addition to the email/document searches above, please note these are the questions Mike most needs answers to BEFORE or DURING today's calls. Flag these as `[HIGH PRIORITY]` in the response file.

- **NS-1, NS-2, NS-3** — scope and team before the Jamal call
- **CFGI-1, CFGI-2, CFGI-4** — team bios and references before the Ken call
- **KPMG-1, KPMG-3** — Olivia Berry's background and scope flexibility before the KPMG partner call
- **BUD-1, BUD-2** — authorization clarity so Mike knows what he can commit to this week

---

## What Claude Will Do With the Responses

Once Codex files the response document at `collab/claude/outputs/vendor-diligence-responses-2026-03-18.md`, Claude will:
1. Reconcile the responses with the current state of comparison documents
2. Update the economics table with confirmed numbers
3. Build the final vendor decision document — clean, forward-looking, no version history — that Mike can use to get to a signed contract
4. Flag any remaining open items that need to be raised on the calls or followed up afterward

The working hypothesis going into this is **Full CFGI (SI + Walid PMO)** as the primary path, with a narrowed KPMG controls scope as an optional add-on. The responses will either confirm that path or surface a reason to reconsider.
