# P2P Current-State Meeting Notes
**Date:** March 2, 2026
**Attendees:** Mike Markman, Trinidad Mesa (France Finance Director), Philippe Goncalves
**Focus:** France P2P current-state fact-finding
**Source:** Live call notes captured by Mike

---

## Volumes

| Metric | Figure | Notes |
|--------|--------|-------|
| Invoices/year (France) | ~4,000 | France SA only |
| New POs raised (2025) | 650 | DocuShare-based, no systematic capture of amounts |
| Total contract commitments | $200M+ | Contracts only — contractors not included |
| Active vendors | <500 | Cleaned in 2025; second cleanup scheduled March 2026 |
| Payment runs/month | 2 | 10th and 25th of each month |

---

## System Landscape (Confirmed)

| System | Role | Integration |
|--------|------|------------|
| Sage 100 | GL, vendor master, invoicing | No feeds to/from other systems |
| DocuShare | Document storage (POs, contracts) | No feeds — manual handoff |
| Trustpair | Vendor bank validation + audit (per wire) | No feeds — manual trigger |
| Concur | Employee expenses | No feeds — separate from P2P |

**Key finding: Zero system-to-system feeds.** Every handoff across these four systems is performed manually by Juliette and/or Fatma.

---

## Staffing

- **Juliette** — primary manual processor; handles the bulk of the invoice and PO workflow
- **Fatma** — manual processing support
- **Philippe Goncalves** — oversight; monitors shared invoice inbox alongside Juliette and Fatma
- **Shared inbox:** invoice.central@[abivax] — all incoming invoices route here

---

## Key Gaps Identified

### 1. No Delegation of Authority (DoA) — Pre-ERP Requirement
- No org chart showing who should approve invoices
- P2P team (Juliette/Fatma/Philippe) receives invoices with no way to know: who authorized it, who the consultant is, who the budget owner is
- **This is a governance gap, not an ERP gap.** NetSuite can enforce a DoA perfectly — but the DoA matrix has to be built first, by Finance/management, as a parallel workstream before blueprint starts.
- **Owner needed:** Hema to assign; pre-requisite before NetSuite approval workflow configuration

### 2. No PO Requirement for Contractors
- Contractors = high volume; historically Abivax has not required POs for them
- Trinidad acknowledges this is industry-typical in biotech/CRO
- Creates gap in commitment tracking (these commitments are not in the $200M+ figure)
- **ERP implication:** Policy decision needed on whether to enforce POs for contractors in NetSuite. If yes, change management required.

### 3. Some CRO Contracts Without POs
- Subset of CRO contracts flow without a PO
- Trinidad views PO coverage for all CRO contracts as critical
- **ERP implication:** NetSuite should enforce PO requirement for CRO contracts. Define threshold and exceptions during blueprint.

### 4. $200M+ in Commitments Not Systematically Tracked
- Contract commitments exceed $200M but are not in a system-maintained commitment register
- They live in the contracts themselves (DocuShare)
- **SOX signal:** FR-PTP-14G (unrecorded liabilities) — this is a direct match
- **ERP implication:** NetSuite PO module creates a commitment register by design. This closes on go-live if PO coverage is enforced.

### 5. PO Process Has No Systematic Amount Capture
- PO process flows through DocuShare with no system that captures amounts
- Juliette handles this manually
- **ERP implication:** NetSuite replaces DocuShare as the PO system of record; amount capture is native

### 6. Sage 100 Cannot Verify Vendor Banking
- Vendor bank validation cannot be done in Sage — it's structurally incapable
- Trustpair handles this and goes beyond banking: does a full vendor audit per wire transfer
- Cost: <$15K/year — cheap and load-bearing
- **ERP implication:** Trustpair integration with NetSuite is a must-have, not optional. Integration model (standard app vs. custom build vs. paid app) not yet confirmed with NetSuite.

### 7. No Vendor Onboarding/Selection Process
- No formal process for whether a vendor should exist at all
- Trustpair validates banking at the point of wire, but doesn't gate vendor creation
- **SOX signal:** FR-PTP-02G (new vendor setup)
- **ERP implication:** NetSuite vendor setup workflow + Trustpair at onboarding (not just at payment) is the target state

### 8. Cost Coding Is Broken
- All costs for a multi-component project may be booked to one item number
- Pass-throughs are particularly difficult to track
- **ERP implication:** COA/dimension design decision needed before blueprint. Trinidad should be involved in defining CRO pass-through and project segment structure. This is a later-stage design input — not blocking Phase 1 go-live but must be designed correctly.

---

## Vendor Master

- Cleaned in 2025 → <500 active suppliers
- Second cleanup scheduled for March 2026
- **Philippe will send:** Sage vendor master report (XLS format) + Trustpair report (may have less detail than Sage)
- **Action:** When Philippe's reports arrive, use them as the NetSuite vendor master migration baseline + Trustpair validation gap analysis

---

## Strategic Framing (Trinidad's Closing Point)

> **SOX gaps should drive the ERP development decisions. Making lives easier via automation is a later-stage goal — post January 1, 2027.**

This is the correct sequencing and aligns with the Audit Committee narrative:
- **Phase 1 (now → Jan 1, 2027):** SOX control remediation by design. Approval workflows, commitment tracking, vendor validation, evidence retention.
- **Phase 2+ (post go-live):** Automation, efficiency improvements, pass-through tracking, contractor PO workflows, cost coding optimization.

---

## Reports Expected from Philippe

| Report | Format | Purpose |
|--------|--------|---------|
| Sage vendor master extract | XLS | Migration baseline; vendor count/quality assessment |
| Trustpair vendor audit report | XLS/PDF | Validation gap analysis; FR-PTP-02G evidence |
| (Potentially) March cleanup output | XLS | Clean migration starting point if timed right |

---

## SOX Control Mapping — What This Call Confirmed

| Control ID | Description | Gap Confirmed | ERP Fix |
|------------|-------------|---------------|---------|
| FR-PTP-02G | New vendor setup | No onboarding process; Trustpair only at wire | NetSuite vendor setup workflow + Trustpair at onboarding |
| FR-PTP-04G | PO approval | No DoA; P2P team can't identify approvers | NetSuite approval workflow — requires DoA matrix first |
| FR-PTP-05G | Review open orders | No systematic commitment register | NetSuite PO module native |
| FR-PTP-06G | Two-way match | Not confirmed in call — still unknown | NetSuite two-way/three-way match |
| FR-PTP-14G | Unrecorded liabilities | $200M+ in commitments not in any system | NetSuite PO commitment register on go-live |

---

## Next Steps

- [ ] **Await Philippe's reports** (Sage XLS + Trustpair report) — use as migration baseline
- [ ] **DoA matrix** — flag to Hema as a pre-blueprint governance deliverable (not an ERP task)
- [ ] **Trustpair integration model** — get from NetSuite: standard app vs. custom build vs. paid app (affects cost and blueprint scope)
- [ ] **PO policy for contractors** — policy decision needed before NetSuite configuration; Mike to raise with Hema
- [ ] **Schedule follow-up with Trinidad** on cost coding / CRO pass-through structure (later stage, pre-blueprint)
- [ ] **US P2P** — still pending from Matt Epley/Kimberly Gordon; separate thread

---

**Meeting notes captured by:** Claude (from Mike's live call notes)
**Feed to:** pillar_synthesis.json P2P pillar, erp_pillar_baselines.json, Audit Committee deck
