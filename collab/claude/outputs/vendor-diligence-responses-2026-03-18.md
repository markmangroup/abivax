# Vendor Diligence Responses
Prepared by Codex | 2026-03-18

## Section 1 - NetSuite Scope and Pricing (Jamal Azil / Oracle)

**[HIGH PRIORITY] NS-1. Has Order to Cash (O2C) and Design to Build / Inventory been formally removed from the Phase 1 SOW scope? Is there a V4 SOW, a revised offer summary, or an email from Jamal confirming this removal and a revised price? Exact revised implementation fee if changed.**

Answer: NOT FOUND for any later V4 SOW, later revised offer summary, or email from Jamal confirming that `O2C` and `Design to Build / Inventory` were removed from Phase 1. The latest package found in Outlook and archived in the repo is the March 17, 2026 set:
- Email: `Re: [External] : RE: ABIVAX x NetSuite : Following up on our meeting`, sender `jamal.azil@oracle.com`, date `2026-03-17 16:57 CET`, source `temp/recent-emails.json`
- Files attached in that email:
  - `data/abivax/vendor-assets/netsuite-commercial/SuiteSuccess Financials Premium SOW UK - ABIVAX draft V3 17032026.pdf`
  - `data/abivax/vendor-assets/netsuite-commercial/NetSuite Offer Summary V2.xlsx`

The current repo summary for that package explicitly states that the revised SOW still includes `P2P`, `R2R`, `O2C`, and `Design to Build / Inventory`: `data/abivax/vendor-assets/netsuite-commercial/README.md`. The current fixed implementation fee in that March 17 package is `"EUR 388,700.00"` from `data/abivax/vendor-assets/netsuite-commercial/NetSuite Offer Summary V2.xlsx`. [NOT FOUND]

**[HIGH PRIORITY] NS-2. What is the exact current Phase 1 implementation price after any scope changes? Break out: fixed implementation fee, recurring license, training, travel cap. Do not use V2 numbers if there is a later revision.**

Answer: PARTIAL: no later revision than the March 17, 2026 package was found in Outlook or the repo, so the latest confirmed numbers are still the March 17 V2 workbook values.
- Source email: `Re: [External] : RE: ABIVAX x NetSuite : Following up on our meeting`, sender `jamal.azil@oracle.com`, date `2026-03-17 16:57 CET`, source `temp/recent-emails.json`
- Source workbook: `data/abivax/vendor-assets/netsuite-commercial/NetSuite Offer Summary V2.xlsx`

Latest confirmed pricing:
- Fixed implementation fee: `"EUR 388,700.00"`
- Recurring license subtotal after discount: `"EUR 148,588.80"`
- Tailored training after discount: `"EUR 7,646.70"`
- Travel cap: `"EUR 18,000.00"`

Because no later workbook or SOW was found after March 17, there is no confirmed lower price tied to a narrowed scope package. [PARTIAL]

**[HIGH PRIORITY] NS-3. From the ABIVAX TEAM V1.pptx - who are the named people on the NetSuite delivery team? List each person's name, role, and any stated background or credentials. Is there a named Project Manager or Delivery Lead? Is anyone France-based or French-speaking?**

Answer: CONFIRMED from slide text extracted directly from `data/abivax/vendor-assets/netsuite-commercial/ABIVAX TEAM V1.pptx`.

Named people on the slide titled `Core project team`:
- `Hafid Irbaiyne` - `Practice Manager France/MEA`; stated background: `"18 years exp., ex customer as CFO, Charted Public Accountant, 4y with Netsuite."`; location note: `"Paris - On site presence as sponsor for steering committees & milestones meetings"`
- `Mazdak Sayyedelar` - `Netsuite Project Mgr. Europe`; stated background: `"7 years exp. managing international IT projects, 6 years with Oracle"`; location note: `"Paris - On site presence capacity for milestones meetings"`
- `Ali Brahmi` - `Senior Functional consultant`; stated background: `"8 years ERP Financial exp., +4 years with Oracle Netsuite projects."`; location note: `"Paris - on site presence capacity"`
- `Johan Bonzinho` - `supporting Functional consultant`; stated background: `"2 years ERP Financial exp., +1 years with Oracle Netsuite projects."`; location note: `"Malaga - on site presence capacity"`
- `Sukeyna Ouled` - `Netsuite Tech / Dev lead`; stated background: `"+9 years IT dev experience 7 years on Oracle Netsuite."`; location note: `"Remote as per our model, could join on site on demand"`
- `To be confirmed` - `ACS Support lead`; note: `"Remote as per our model, support and continuity of the project from France to the US"`
- `Mathieu Lair` - `Trainer consultant`; stated background: `"10 years ERP exp."`; location note: `"Paris - on site presence capacity"`
- `Alexandre Beider` - `Senior Functional consultant`; stated background: `"25 years ERP Financial exp., +10 years with Oracle Netsuite projects"`; location note: `"Paris - on site presence capacity"` and `"For phase 2 (inventory)"`

Named PM / lead roles:
- Named Project Manager: `Mazdak Sayyedelar` (`Netsuite Project Mgr. Europe`)
- Named technical lead: `Sukeyna Ouled` (`Netsuite Tech / Dev lead`)
- Named France/MEA sponsor-style lead: `Hafid Irbaiyne`

France-based / likely French-speaking:
- Explicitly Paris-based: `Hafid Irbaiyne`, `Mazdak Sayyedelar`, `Ali Brahmi`, `Mathieu Lair`, `Alexandre Beider`
- Malaga-based: `Johan Bonzinho`
- The slide does not explicitly state language skills, so French-speaking is NOT FOUND as an explicit claim. [CONFIRMED]

**NS-4. From the RACI workbook - what specific activities does NetSuite own vs. what does Abivax own? Specifically: who owns data extraction, data cleansing, data validation, UAT test case creation, and cutover coordination?**

Answer: PARTIAL from `data/abivax/vendor-assets/netsuite-commercial/Netsuite RACI standard Suite Success ABIVAX V1.xlsx`, sheet `RACI`.

Relevant rows in the workbook:
- `Entity Data cleansing, preparation for legacy system extraction`
  - NetSuite / Project Team: `I`
  - Abivax Project Sponsor: `A`
  - Abivax Project Manager: `A`
  - Abivax Data Consultant: `R`
- `Review & Prepare Data Migration Plan`
  - NetSuite / Project Team: `A/I/R`
  - Abivax Project Sponsor: `A`
  - Abivax Project Manager: `A`
  - Abivax Data Consultant: `R`
- `Data Cleansing, Mapping, Readiness for Import`
  - NetSuite / Project Team: `I/C`
  - Abivax Project Manager: `A`
  - Abivax Business Process Owners: `C`
  - Abivax Data Consultant: `R`
- `Unit Testing (Prepare for Walkthroughs)`
  - NetSuite / Project Team: `A/I/R`
  - Abivax Project Sponsor: `I`
  - Abivax Project Manager: `I`
  - Abivax System Administrator: `I`
- `User Acceptance Testing`
  - NetSuite / Project Team: `A/C/I`
  - Abivax Project Sponsor: `A`
  - Abivax Project Manager: `A`
  - Abivax System Administrator: `R`
  - Abivax Business Process Owners: `R`
- `Production Final List (Master) Data Import`
  - NetSuite / Project Team: `A/I/R`
  - Abivax Project Sponsor: `I`
  - Abivax Project Manager: `I`
  - Abivax System Administrator: `I`
  - Abivax Data Consultant: `I`

Question-specific readout:
- Data extraction: Abivax Data Consultant `R`; NetSuite only `I`
- Data cleansing: Abivax Data Consultant `R`; NetSuite only `I/C`
- Data validation: PARTIAL - no row labeled exactly `data validation`, but `User Acceptance Testing` makes Abivax System Administrator and Business Process Owners `R`
- UAT test case creation: PARTIAL - no row explicitly titled `test case creation` found in the workbook extraction
- Cutover coordination: PARTIAL - the workbook excerpt shows `Final Data Migration Cutover`, but no role assignments were visible in the extracted row output

Overall direction is clear: Abivax owns meaningful data work; NetSuite owns or co-owns migration planning and import mechanics. [PARTIAL]

**NS-5. Is there any email from Jamal or the NetSuite team after March 17 that discusses scope changes, pricing revisions, reference clients, or delivery team details? Quote the relevant sections.**

Answer: NOT FOUND. The latest Jamal emails found are on `2026-03-17` in `temp/recent-emails.json`:
- `2026-03-17 16:57 CET` with the updated attachments and written responses
- `2026-03-17 17:16 CET` short scheduling confirmation

No later email after March 17 was found in the local Outlook export or repo staging that discusses additional scope changes, pricing revisions, reference clients, or delivery team details. [NOT FOUND]

**NS-6. Are Electronic Invoicing / e-invoicing and French VAT declaration explicitly covered in the current SOW scope? Is there any mention of DRC (French government platform) or Avalara? Quote the exact language if present.**

Answer: PARTIAL.

Confirmed:
- The latest offer summary includes a recurring line item named `NetSuite Electronic Invoices Mid-Market Cloud Service` in `data/abivax/vendor-assets/netsuite-commercial/NetSuite Offer Summary V2.xlsx`
- Exact included language from that workbook:
  - `"Supports generation and sending of e-documents across multiple countries"`
  - `"Generate XML documents representing sales transaction records"`
  - `"Generate and send e-documents individually or in batches"`
  - `"Track all generated and sent e-documents though an audit trail"`

Not found:
- No explicit mention of `French VAT declaration`
- No explicit mention of `DRC`
- No explicit mention of `Chorus Pro`
- No explicit mention of `Avalara`

Context from email:
- KPMG had previously flagged that it was `"Necessary to clarify the e-invoicing perimeter in order to be sure that it was not underestimated"` in email `Discussion with Netsuite`, sender `Camille Girard`, date `2026-03-03`, source `data/abivax/emails_staging/emails_2026-03-04.json`

So e-invoicing exists as a commercial line item, but French regulatory coverage is not explicitly documented in the current SOW / workbook evidence found here. [PARTIAL]

**NS-7. What reference clients does NetSuite propose for Abivax to contact? Are any references listed in emails or documents - company names, contact names, industry, company size? Jade Nguyen was coordinating references - are there any emails from Jade or to Jade on this topic?**

Answer: PARTIAL.

Confirmed reference contacts found in email `Reference contact & template`, sender `Aymen Ben Alaya`, date `2026-03-04`, source `data/abivax/emails_staging/emails_2026-03-06.json`:
- `EFESO: Laure Tchervenkov (laure.tchervenkov@efeso.com)`
- `Ennov: Sebastien Rossi-Ferrari (srossi-ferrari@ennov.com) - CFO`

Jade coordination evidence:
- Email from `Jade Nguyen`, date `2026-03-05`, source `data/abivax/emails_staging/emails_2026-03-06.json`:
  - `"Per our discussions, the plan was for Philippe and I to proceed with the reference taking."`
  - `"On our end, we’re ready to move forward and start contacting the shared references."`
- Additional follow-up from Jade appears in `temp/recent-emails.json`:
  - `"should we proceed with the reference taking?"`

Not found:
- No NetSuite email directly listing reference clients beyond the contacts above
- No industry, company size, or call notes beyond `Ennov` CFO and the company names above [PARTIAL]

## Section 2 - CFGI Implementation Proposal (Kenneth Schatz)

**[HIGH PRIORITY] CFGI-1. From the implementation proposal PDF - who are the named CFGI delivery team members for the Abivax engagement? List each person's name, role/title, and any stated experience or credentials. Are NetSuite certifications mentioned for any of them?**

Answer: PARTIAL.

From the implementation-side email intro `Abivax ERP - NetSuite Biotech Expert Implementors Introduction`, sender `Angela DePoy`, date `2026-03-03`, source `data/abivax/emails_staging/emails_2026-03-04.json`:
- `Shine Thomas (Partner)` - `"Leads our ERP practice with deep Life Sciences roots and 18+ years prior KPMG experience on transformations just like this one."`
- `Ken Schatz (Managing Director)` - `"Specializes in NetSuite and has 20 years experience in financial system implementations across a variety of industries"`
- `Guy Morissette (Director)` - `"One of our most experienced NetSuite practitioners, with 20+ years of hands-on delivery across biotech and other sectors."`

From the implementation proposal summary `data/abivax/vendor-assets/cfgi-implementation/README.md`:
- The proposal is a two-phase NetSuite implementation led from CFGI's technology transformation practice
- The README does not list a fuller dedicated delivery-team grid with bios

NetSuite certifications:
- NOT FOUND in the proposal summary or related emails reviewed here. [PARTIAL]

**[HIGH PRIORITY] CFGI-2. Does the proposal or any CFGI email include implementation references - clients where CFGI delivered a NetSuite implementation? List any company names, industries, sizes, or contact names mentioned. Flag if none are provided.**

Answer: NOT FOUND. I did not find any CFGI implementation references, client names, industries, sizes, or contact names in:
- `data/abivax/vendor-assets/cfgi-implementation/CFGI_Abivax_NS_Proposal_03.10.26.pdf`
- `data/abivax/vendor-assets/cfgi-implementation/README.md`
- related CFGI emails in `temp/recent-emails.json`
- related staged emails in `data/abivax/emails_staging` [NOT FOUND]

**CFGI-3. The CFGI SOW explicitly excludes "French on-site project manager support" as separate scope. Is there any email or document where Ken or anyone at CFGI clarifies how they intend to cover France-side delivery - is the expectation that Walid's local PMO proposal fills this gap?**

Answer: PARTIAL.

Confirmed exclusion:
- `data/abivax/vendor-assets/cfgi-implementation/README.md` states: `French on-site project manager support is separate scope.`

Evidence that Walid's local PMO proposal is the likely fill:
- `data/abivax/vendor-assets/cfgi-pmo-change/README.md` describes that proposal as a narrower support layer covering local PMO / functional support and change, with `Walid Bouassida` as the local lead
- Email from `Walid Bouassida`, date `2026-03-17`, source `temp/recent-emails.json`, says he sent `"our initial support proposal"`
- Email from `Walid Bouassida`, date `2026-03-18`, source `temp/recent-emails.json`, asks to `"clarify your expectations regarding the Finance PMO role as part of the Netsuite migration project"`

There is no single sentence from Ken explicitly saying `"Walid's proposal fills the French on-site PM gap"`, but the repo evidence points in that direction. [PARTIAL]

**[HIGH PRIORITY] CFGI-4. The CFGI SOW also excludes "SOX-related SDLC activities." Given CFGI is Abivax's existing SOX advisor, is there any email or document that discusses how they would handle the separation between the implementation team and the SOX advisory team - or whether this is an issue at all?**

Answer: PARTIAL.

Confirmed exclusion:
- `data/abivax/vendor-assets/cfgi-implementation/README.md` states: `SOX-related SDLC work is separate scope.`

Relevant email clarification:
- Email `Re: Abivax ERP - NetSuite Biotech Expert Implementors Introduction`, sender `Angela DePoy`, date `2026-03-03`, source `data/abivax/emails_staging/emails_2026-03-06.json`
  - `"As for SOX, our knowledge of the Company's existing processes and gaps would be incorporated into any system design"`
  - `"There will also be SOD considerations in roles/..."`

This shows CFGI told Abivax they would incorporate SOX/process-gap knowledge into design thinking, but I did not find a document that cleanly separates the implementation team from the SOX advisory team or addresses independence / conflict mechanics in detail. [PARTIAL]

**CFGI-5. Is there any email from Ken or CFGI after March 10 (after their implementation proposal was sent) that revises pricing, adjusts scope, or responds to any pushback from Mike or the Abivax team?**

Answer: PARTIAL.

Found:
- Email from `Kenneth Schatz`, subject `Re: ABIVAX <> CFGI - NetSuite Implementation Proposal`, date `2026-03-13`, source `temp/recent-emails.json`
  - body preview indicates Ken gave thoughts on the NetSuite scope and specifically argued that `O2C` and `Inventory` probably were not critical by January 1, 2027
- Email from `Kenneth Schatz`, date `2026-03-14`, source `temp/recent-emails.json`
  - travel / follow-up only, no pricing revision

Not found:
- No later revised CFGI implementation price
- No revised CFGI implementation SOW or attachment after March 10 in the repo [PARTIAL]

**CFGI-6. What exactly is CFGI's Phase 1 scope? Confirm from the actual PDF. Is e-invoicing / French regulatory compliance covered or excluded?**

Answer: PARTIAL.

Confirmed from `data/abivax/vendor-assets/cfgi-implementation/README.md`, which summarizes `data/abivax/vendor-assets/cfgi-implementation/CFGI_Abivax_NS_Proposal_03.10.26.pdf`:
- `OneWorld multi-entity`
- localization
- `multi-book IFRS/GAAP`
- `R2R`
- `P2P`
- `5 integrations`
- `NSAW`
- change management
- data migration
- priced at `"EUR 273,000"`
- target go-live `"January 1, 2027"`

The same README states that `Phase 2` covers `Order to Cash` and `Design to Build / Inventory`.

E-invoicing / French regulatory compliance:
- NOT FOUND as an explicit covered item in the implementation proposal summary reviewed here. [PARTIAL]

**CFGI-7. What are the travel and expense terms in the CFGI proposal? Is there a cap or estimate? How do they bill for Europe-based work from a US team?**

Answer: PARTIAL.

Confirmed from `data/abivax/vendor-assets/cfgi-implementation/README.md`:
- `"Travel and expenses are billed separately."`

Not found:
- No travel cap
- No travel estimate
- No detailed Europe-vs-US billing construct in the implementation proposal evidence reviewed here [PARTIAL]

**CFGI-8. Does CFGI mention April 2026 as their kickoff assumption? If a decision were made this week (March 18-19), does their timeline still work?**

Answer: PARTIAL.

Confirmed from `data/abivax/vendor-assets/cfgi-implementation/README.md`:
- `Phase 1` kickoff assumption: `April 2026`
- target go-live: `January 1, 2027`

Whether the timeline still works if the decision were made on March 18-19:
- NOT FOUND as an explicit written confirmation in email or proposal [PARTIAL]

## Section 3 - CFGI Local PMO / Change Proposal (Walid Bouassida)

**WALID-1. From the PDF - list every person named in the CFGI local PMO/change proposal. For each: name, role, stated allocation percentage (if given), and any background details. Specifically: what is Walid Bouassida's stated background and experience?**

Answer: CONFIRMED from `data/abivax/vendor-assets/cfgi-pmo-change/Abivax_CFGI_PMO&Change proposal.pdf` and `data/abivax/vendor-assets/cfgi-pmo-change/README.md`.

Named people:
- `Walid Bouassida` - `Director` - allocation: `"~2 days / week"`
  - Background from extracted proposal summary: `16 years of accounting and consulting experience`; provides financial and accounting advisory and process optimization in France; led complex projects in retail, construction, logistics, and services; holds French CPA diploma; working on Abivax SOX remediation since September 2025
- `Youness Tyamaz` - `Consultant` - allocation: `"~1 day / week"`
  - Background: experience in financial reporting and audit across international environments; expertise in `IFRS`, `French GAAP`, `US GAAP`, accounting integrations, and audit readiness; working on Abivax SOX remediation since December 2025
- `Jean-Arnold Coutareau` - `Partner` - allocation: `"(3%)"`
  - Background: managing partner for CFGI France; `30 years of accounting and finance experience`; business transformation, complex accounting, IFRS, capital markets, transaction advisory
- `Ken Schatz` - `Managing Director, Technology Transformation` - allocation: `"On demand"`
- `Shine Thomas` - `Partner, Technology Transformation` - allocation: `"On demand"`

The README also notes that NetSuite experts are positioned as `on demand` and billed separately. [CONFIRMED]

**WALID-2. The proposal is T&M. Does it state hourly or daily rates anywhere, or reference "discounted SOX rates"? What are the actual rates if stated?**

Answer: PARTIAL.

Confirmed from `data/abivax/vendor-assets/cfgi-pmo-change/Abivax_CFGI_PMO&Change proposal.pdf` and `data/abivax/vendor-assets/cfgi-pmo-change/README.md`:
- The proposal is `time and materials`
- It references rates `"aligned to discounted SOX rates"`

Not found:
- No actual hourly rates
- No actual daily rates [PARTIAL]

**WALID-3. Is there any language in the proposal about how the local PMO team coordinates with the CFGI US-based implementation team? Or is the proposal written as if it stands alone beside an external SI (e.g., NetSuite)?**

Answer: PARTIAL.

Confirmed from `data/abivax/vendor-assets/cfgi-pmo-change/README.md`:
- `Ken Schatz` and CFGI NetSuite experts are `on demand`
- NetSuite experts are explicitly `on demand` and billed separately
- The proposal is a narrower support proposal than CFGI's main March 10 implementation proposal

This shows some coordination concept with CFGI's US implementation experts, but the proposal also reads as a standalone local PMO / change layer that could sit beside a different implementation lead. [PARTIAL]

**WALID-4. Is Jean-Arnold Coutareau's role described anywhere - what is his background and why is he listed at "low allocation"?**

Answer: PARTIAL.

Background is confirmed from `data/abivax/vendor-assets/cfgi-pmo-change/Abivax_CFGI_PMO&Change proposal.pdf` / README:
- `Jean-Arnold Coutareau` is described as CFGI France's managing partner with `30 years of accounting and finance experience` in business transformation, complex accounting, IFRS, capital markets, and transaction advisory
- Allocation shown as `"(3%)"`

Why the allocation is low:
- PARTIAL: the proposal shows the low allocation, but does not explicitly explain it beyond his partner / oversight positioning. [PARTIAL]

**WALID-5. Are there any emails from Walid after March 17 that revise, clarify, or follow up on the proposal?**

Answer: PARTIAL.

Found in `temp/recent-emails.json`:
- `2026-03-17`: email `CFGI Proposal` from `Walid Bouassida` sending the proposal
- `2026-03-18`: follow-up email from `Walid Bouassida` asking:
  - `"Could we schedule a 30-minute discussion with Youness during this week to clarify your expectations regarding the Finance PMO role as part of the Netsuite migration project (scope of the role, start date, etc.)?"`

This is a clarification / follow-up, not a revised commercial document. [PARTIAL]

## Section 4 - KPMG AMOA Proposal (Camille Girard / Toufik Madjoubi)

**[HIGH PRIORITY] KPMG-1. From the PDF CVs section (pages 28-35) - what is Olivia Berry's stated background, experience, and any ERP or controls-specific credentials? Has she worked on NetSuite implementations or ERP controls reviews specifically?**

Answer: CONFIRMED from `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.text.json`.

Olivia Berry CV details:
- Role: `Assistant Manager - Risk & compliance`
- Practice: `Technology Risks`
- Education: `Masters in Financial & Control Management`, `Paris School of Business`
- Languages: `English/French (bilingual)`, `German B1`, `Spanish B1`
- Profile: `"Olivia joined KPMG after a first experience in consulting at RSM. She has 3 years of professional experience in IT consulting, particularly in SAP. She has worked on several advisory projects helping clients manage their technological risks, mainly in the context of internal control."`
- ERP / controls-specific experience:
  - worked on `SAP S/4 HANA Core Model` redesign
  - contributed to `a new risk and control framework`
  - worked on `"by design" controls for P2P, R2R, O2C and F2S processes`
  - contributed to SoD-compliant roles
  - supported internal audit methodology and reporting
  - created internal control playbook / training / RACI support
- Cross-functional IT skills listed: `SAP ECC6`, `SAP S/4 Hana`, `SOX compliance`

NetSuite-specific experience:
- NOT FOUND. The CV text reviewed here does not mention NetSuite specifically. [CONFIRMED]

**KPMG-2. From the same CVs section - what is Toufik Madjoubi's stated background? Is there a specific mention of AMOA, PMO, or ERP implementation experience at comparable scale?**

Answer: CONFIRMED from `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.text.json`.

Toufik Madjoubi CV details:
- Role: `Senior Manager | Finance Transformation`
- Profile: `"Toufik has over 14 years of experience in transforming financial and logistics services. As a Transformation Project Manager, he implements solutions and supports business analysis in complex and international environments."`
- Strengths listed:
  - process modeling and harmonization
  - financial and logistics risk control
  - end-to-end management of complex projects
  - consulting assignments related to `Microsoft & Oracle technologies`
  - advanced expertise in `Finance and Logistics`
- Relevant experience includes:
  - Europe-wide transformation program for a retail company
  - `Microsoft Dynamics 365 Finance & Operations` implementation for automotive / agri-food distribution
  - Oracle Cloud transformation for a technological research institute covering `HR, Finance, and Procurement`
  - procurement-process harmonization in Netherlands and France
- Expertise field explicitly includes: `Transformation & Business integration (AMOA)` and `Project Management`

This is explicit PMO / AMOA / ERP-transformation experience, though the CV text does not cite Abivax-scale biotech NetSuite specifically. [CONFIRMED]

**[HIGH PRIORITY] KPMG-3. Is there any email from Camille or KPMG after March 10 that discusses scope flexibility, willingness to narrow to a controls-only engagement, or revised pricing? Has Mike or anyone at Abivax communicated to KPMG that the full AMOA scope may be more than needed?**

Answer: PARTIAL.

Found after March 10:
- `temp/recent-emails.json` shows Camille follow-ups on references and legal feedback
- No email found that revises KPMG pricing
- No email found that explicitly offers a narrowed controls-only KPMG scope

Evidence of KPMG positioning on scope:
- Proposal content in `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.text.json` is broad AMOA / PMO / change / controls support

Communication from Abivax that full AMOA may be more than needed:
- NOT FOUND in the KPMG email evidence reviewed here. [PARTIAL]

**KPMG-4. The proposal names both Camille Girard and Toufik Madjoubi as PMO leads. Is there any email clarifying which one would be the primary day-to-day contact? Camille sent the proposal - is she confirmed as available for this engagement?**

Answer: PARTIAL.

Confirmed from `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.text.json`:
- `Camille GIRARD` is listed as `Project Lead PMO`
- `Toufik Madjoubi` is also listed as `Project Lead PMO`

Email evidence:
- Camille sent the proposal and multiple follow-ups, which makes her the practical external lead in the current email trail

Not found:
- No email explicitly stating which of Camille or Toufik would be the primary day-to-day lead on the live engagement
- No explicit availability confirmation beyond Camille actively participating in the proposal process [PARTIAL]

**KPMG-5. From the proposal - does KPMG have any independence conflict if CFGI is the SI? Is there any language about independence requirements or conflict checks in the proposal?**

Answer: PARTIAL.

The proposal footer language in `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.text.json` states:
- `"They are in all respects subject to satisfactory completion of KPMG's procedures to evaluate prospective clients and engagements, including independence and conflict checking procedures, and the negotiation, agreement, and signing of a specific engagement letter or contract."`

Not found:
- No specific analysis of a `CFGI as SI` conflict scenario
- No explicit statement saying the contemplated role is or is not permissible if CFGI is selected [PARTIAL]

**KPMG-6. Is there any mention in emails or the proposal of KPMG's prior work with Abivax beyond the ERP selection (RFP analysis)? Camille was involved in prior consolidation work per meeting notes - is there a description of what that was?**

Answer: PARTIAL.

Confirmed prior work from email `ABIVAX ERP - Project update`, sender `Aymen Ben Alaya`, date `2026-02-19`, source `temp/sent-review/sent-since-2026-02-19.json`:
- KPMG summarizes prior phases:
  - scope definition / initiation
  - diagnostics
  - RFP preparation
  - bidder proposal analysis
  - demonstration phase

Not found:
- No clear written description in the reviewed sources of prior KPMG consolidation work beyond the ERP selection / RFP support. [PARTIAL]

## Section 5 - Reference Diligence (Jade Nguyen coordination)

**REF-1. Has Jade sent or received any emails arranging NetSuite reference calls? If yes: who are the reference companies, what dates/times are scheduled, and has Mike confirmed participation?**

Answer: PARTIAL.

Confirmed:
- Jade sent and received emails on reference coordination in `data/abivax/emails_staging/emails_2026-03-06.json`
- Reference companies / contacts provided:
  - `EFESO: Laure Tchervenkov`
  - `Ennov: Sebastien Rossi-Ferrari - CFO`
- Jade wrote:
  - `"Per our discussions, the plan was for Philippe and I to proceed with the reference taking."`
  - `"On our end, we’re ready to move forward and start contacting the shared references."`

Not found:
- No scheduled dates / times for actual reference calls in the reviewed messages
- No email proving Mike formally confirmed participation in a scheduled reference call [PARTIAL]

**REF-2. Have any reference calls already happened? If yes: are there any notes, summaries, or email follow-ups capturing what was learned?**

Answer: NOT FOUND. I did not find notes, summaries, or follow-up emails proving that NetSuite reference calls already happened in the sources reviewed here. [NOT FOUND]

**REF-3. Has anyone at Abivax (Mike, Jade, Hema) asked CFGI for implementation references? If yes, has CFGI responded with any names or materials?**

Answer: NOT FOUND. No CFGI implementation reference request / response with named references was found in the reviewed emails or documents. [NOT FOUND]

## Section 6 - Scope / Regulatory (French requirements)

**FR-1. Is there any email or document that specifically addresses French mandatory e-invoicing requirements (DRC platform / Chorus Pro / e-facture reform)? What is the stated timeline for compliance and is it in any vendor's scope?**

Answer: PARTIAL.

Found:
- KPMG email `Discussion with Netsuite`, sender `Camille Girard`, date `2026-03-03`, source `data/abivax/emails_staging/emails_2026-03-04.json`, says:
  - `"Necessary to clarify the e-invoicing perimeter in order to be sure that it was not underestimated"`
- NetSuite offer summary includes `NetSuite Electronic Invoices Mid-Market Cloud Service` in `data/abivax/vendor-assets/netsuite-commercial/NetSuite Offer Summary V2.xlsx`

Not found:
- No explicit `DRC`, `Chorus Pro`, or `e-facture reform` wording
- No stated compliance timeline in the reviewed sources
- No vendor document explicitly saying French mandatory e-invoicing compliance is fully covered [PARTIAL]

**FR-2. Is there any email discussing French GAAP vs. IFRS vs. US GAAP as a specific implementation requirement? Has any vendor confirmed their approach to multi-book / multi-GAAP in a documented way?**

Answer: CONFIRMED.

CFGI:
- `data/abivax/vendor-assets/cfgi-implementation/README.md` states Phase 1 includes `multi-book IFRS/GAAP`
- Angela DePoy email, `Abivax ERP - NetSuite Biotech Expert Implementors Introduction`, date `2026-03-03`, source `data/abivax/emails_staging/emails_2026-03-04.json`, says CFGI understands `"the dual-reporting environment (GAAP + IFRS)"`

NetSuite:
- The March 17 NetSuite SOW in `data/abivax/vendor-assets/netsuite-commercial/SuiteSuccess Financials Premium SOW UK - ABIVAX draft V3 17032026.pdf` explicitly includes multi-book / finance design items under `Record to Report`

This confirms multi-GAAP / multi-book is a documented requirement and in-scope theme. [CONFIRMED]

**FR-3. Is the ZoneCapture OCR gap (raised in early NetSuite demo notes - not native to NetSuite) still an open item? Has any vendor addressed it in subsequent emails or documents?**

Answer: NOT FOUND in the sources reviewed for this response. I did not find later written evidence that closes or re-addresses the `ZoneCapture OCR` gap specifically. [NOT FOUND]

## Section 7 - Budget and Authorization

**[HIGH PRIORITY] BUD-1. Is there an email from Hema or Didier confirming the approved budget envelope for ERP implementation + support? The working assumption in notes was ~$1M. Is that confirmed and is it EUR or USD?**

Answer: NOT FOUND. I did not find an email from `Hema Keshava` or `Didier Blondel` in the reviewed repo/email sources explicitly confirming an approved ERP implementation + support budget envelope, nor one confirming whether the budget is `EUR` or `USD`. The repo has working commercial comparisons in `data/abivax/budget.json`, but that is not an approval email. [NOT FOUND]

**[HIGH PRIORITY] BUD-2. Is there any email discussing budget approval process - does the board need to approve the specific vendor contracts, or does Hema/Didier have authority to sign?**

Answer: NOT FOUND. I did not find an email in the reviewed sources explicitly defining whether the board must approve the vendor contracts or whether `Hema` / `Didier` have delegated authority to sign. [NOT FOUND]

**BUD-3. Is there any communication about whether the implementation support budget (KPMG AMOA / CFGI PMO) is a separate line from the NetSuite/CFGI implementation contract, or are they expected to come from the same envelope?**

Answer: NOT FOUND. The repo separates the economics in `data/abivax/budget.json`, but I did not find a governance email or approval note explicitly stating whether support spend is a separate budget line or the same approval envelope. [NOT FOUND]
