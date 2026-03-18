# Codex Handoff - Vendor Comparison Refresh (2026-03-18)

## Why this note exists

Mike is using Claude to help build out a vendor comparison across:
- NetSuite direct package
- KPMG implementation support / AMOA package
- CFGI alternatives

This note captures the March 17-18 repo updates so Claude can pick up without re-discovering the source files.

## New source artifacts added

### 1. CFGI local PMO / change proposal from Walid

Source email:
- Date: `2026-03-17 19:28 CET`
- Sender: `Walid Bouassida`
- Subject: `CFGI Proposal`

Archived files:
- [Abivax_CFGI_PMO&Change proposal.pdf](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/cfgi-pmo-change/Abivax_CFGI_PMO&Change%20proposal.pdf)
- [README.md](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/cfgi-pmo-change/README.md)

Key read:
- Narrower than CFGI's March 10 implementation proposal.
- Positioned as Paris-side `local PMO and functional support` plus `change management`.
- Estimated fee range: `EUR 100K-125K` excluding VAT / expenses.
- Duration: `~35 weeks`.
- Commercial basis: `time and materials`.
- Better comparison point versus a narrowed local support lane than versus a full SI / implementation-owner package.

Structured repo updates:
- [consultant_reviews.json](/C:/Users/mmarkman/abivax/data/abivax/consultant_reviews.json)
  section: `cfgiLocalSupportProposal`
- [document_registry.json](/C:/Users/mmarkman/abivax/data/abivax/document_registry.json)
  entry id: `cfgi-local-pmo-change-proposal-20260317`
- [budget.json](/C:/Users/mmarkman/abivax/data/abivax/budget.json)
  added key number and commercial open decision

### 2. NetSuite revised package from Jamal

Source email:
- Date: `2026-03-17 16:57 CET`
- Sender: `Jamal Azil`
- Subject: `Re: [External] : RE: ABIVAX x NetSuite : Following up on our meeting`

Archived files:
- [NetSuite Offer Summary V2.xlsx](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/netsuite-commercial/NetSuite%20Offer%20Summary%20V2.xlsx)
- [SuiteSuccess Financials Premium SOW UK - ABIVAX draft V3 17032026.pdf](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/netsuite-commercial/SuiteSuccess%20Financials%20Premium%20SOW%20UK%20-%20ABIVAX%20draft%20V3%2017032026.pdf)
- [Netsuite RACI standard Suite Success ABIVAX V1.xlsx](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/netsuite-commercial/Netsuite%20RACI%20standard%20Suite%20Success%20ABIVAX%20V1.xlsx)
- [ABIVAX TEAM V1.pptx](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/netsuite-commercial/ABIVAX%20TEAM%20V1.pptx)

Existing retained baseline files:
- [NetSuite Offer Summary.xlsx](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/netsuite-commercial/NetSuite%20Offer%20Summary.xlsx)
- [SuiteSuccess Financials Premium SOW ABIVAX - DRAFT - 05032026.pdf](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/netsuite-commercial/SuiteSuccess%20Financials%20Premium%20SOW%20ABIVAX%20-%20DRAFT%20-%2005032026.pdf)
- [Estimates.zip](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/netsuite-commercial/Estimates.zip)

Important repo interpretation changes:
- March 17 package is now the `current` NetSuite source set.
- March 5 workbook and SOW are now treated as `superseded baseline` documents in the registry.
- The revised SOW still includes `P2P`, `R2R`, `O2C`, and `Design to Build / Inventory`.
- The revised SOW explicitly includes `bank account reconciliation, transfers and deposits` in `Record to Report`.
- The new RACI clarifies that Abivax still owns meaningful responsibilities:
  - sponsor decisions
  - PM participation
  - business process ownership
  - data cleansing / prep

Revised commercial read from `NetSuite Offer Summary V2.xlsx`:
- recurring base: `EUR 148,588.80`
- implementation + training: `EUR 396,346.70`
- travel cap: `EUR 18,000`
- optional recurring add-ons: `EUR 30,416.40`
- year 1 core: `~EUR 544,935.50`
- year 1 with travel + optional add-ons: `~EUR 593,351.90`

Structured repo updates:
- [consultant_reviews.json](/C:/Users/mmarkman/abivax/data/abivax/consultant_reviews.json)
  section: `netSuitePackage`
- [document_registry.json](/C:/Users/mmarkman/abivax/data/abivax/document_registry.json)
  new entry ids:
  - `netsuite-offer-summary-v2-20260317`
  - `netsuite-sow-draft-v3-20260317`
  - `netsuite-raci-v1-20260317`
  - `netsuite-team-v1-20260317`
- [budget.json](/C:/Users/mmarkman/abivax/data/abivax/budget.json)
  key numbers updated to March 17 V2 economics
- [README.md](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/netsuite-commercial/README.md)
  now distinguishes current package versus superseded baseline

## Comparison implications Claude should use

### NetSuite
- Latest docs still show broad phase-1 scope.
- Inventory and e-invoicing still remain in recurring baseline.
- Bank rec is explicitly covered at SOW functional-scope level.
- New RACI is important because it weakens any assumption that NetSuite is fully taking burden off Abivax.

### KPMG
- Still represented by:
  - [032026_Proposal_AMOA_ABIVAX_v1.pdf](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.pdf)
  - [README.md](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/kpmg-pmo/README.md)
- Repo read remains:
  - broad AMOA support
  - stronger on assurance / controls / UAT / challenge role
  - weaker if sold as full PMO owner

### CFGI
- There are now two distinct CFGI lanes in repo and they should not be blended:
  1. March 10 implementation proposal
     - broader two-phase implementation alternative
     - [CFGI_Abivax_NS_Proposal_03.10.26.pdf](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/cfgi-implementation/CFGI_Abivax_NS_Proposal_03.10.26.pdf)
  2. March 17 local PMO / change proposal
     - narrower support package around Mike and local teams
     - [Abivax_CFGI_PMO&Change proposal.pdf](/C:/Users/mmarkman/abivax/data/abivax/vendor-assets/cfgi-pmo-change/Abivax_CFGI_PMO&Change%20proposal.pdf)

## Suggested next Claude move

Build a vendor comparison around three separate questions:
1. Who should be the builder / SI?
2. What support / assurance layer should sit around the builder?
3. What is actually needed in phase 1 by `2027-01-01`?

Good comparison axes now available in repo:
- scope breadth
- phase discipline
- local support
- controls / SOX challenge
- UAT / cutover discipline
- change support
- economics
- burden retained by Abivax
- role clarity / RACI quality

## Files intentionally not committed

These remained local-only and should be ignored:
- `data/abivax/vendor-assets/netsuite-commercial/Estimates/__MACOSX/`
- `outputs/board/email-context-2026-03-18.md`
