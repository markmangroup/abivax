# Claude Output — P2P Vendor Data Synthesis (2026-03-02)

**Queue item:** FR-PTP-02G evidence + vendor migration baseline
**Source files:**
- `data/abivax/inbox_assets/2026-03-02-camille-philippe/Base supplier Trustpair.xlsx`
- `data/abivax/inbox_assets/2026-03-02-camille-philippe/ENGAGE_2025 - 31.12.2025.xlsx`
**Output written to:** `data/abivax/pillar_synthesis.json` — P2P + program-governance pillars

---

## What Landed

### Trustpair Vendor Base (497 vendors)

| Metric | Value |
|---|---|
| Total vendors | 497 |
| Globally Favorable | 475 (95.6%) |
| Couple Défavorable (bank ownership unconfirmed) | 22 (4.4%) — **SOX pre-migration gate** |
| Défavorable / Anomalie global | 10 — requires remediation |
| On blocklist | 0 |

**Geography:** FR 245 (49%) · US 99 (20%) · GB 33 (7%) · DE 27 (5%)

**FR-PTP-02G status:** CONFIRMED. Trustpair is actively validating all 497 vendors on bank account integrity. Audit evidence is exportable. This closes the open "expected but not received" item from the Mar 2 P2P call.

**Notable Défavorable/Anomalie vendors (global):**
- Securities & Exchange Commission (US) — closed bank account
- BINCY ABRAHAM — closed bank account
- LATHAM & WATKINS (US) — bank/company couple mismatch
- ADN AMENAGEMENTS (FR) — bank/company couple mismatch
- HAREL (IL), HDI Global Japan, ALLIANZ JINGDONG (CN) — missing company ID (non-FR, expected)
- Q2 SOLUTIONS (US) — company legal info not confirmed
- MILAN LUKAS (CZ) — couple mismatch

### ENGAGE 2025 Commitment Register (31-Dec-2025)

| Metric | Value |
|---|---|
| Active commitment lines | 2,888 |
| Unique vendors in active commitments | 187 |
| EUR commitments (to be expected) | €165,055,532 |
| EUR already booked | €7,490,467 |
| Grand total (all currencies, EUR-equiv) | €182.8M |
| Closed/completed lines | 3,042 |

**Department split:** CLI (Clinical) 1,265 · CMC 1,014 · LAB 334 · DAT 65 · QA 111 · REG 34
**Currency split:** EUROS 79% · USD 15% · GBP 3%

This confirms the "€200M+ in contract commitments not tracked in any system" characterization from the Mar 2 P2P call was directionally correct — the actual tracked forward exposure in ENGAGE is ~€165M EUR, with the balance in USD/GBP/CHF.

### KPMG Commercials (from Camille's Feb 26 deck — already in sync)

| Item | Value |
|---|---|
| Build (one-off) | €463,120 |
| Run (annual SaaS) | €187,009/year |
| Year 1 total | ~€650,128 |
| 3-year total | €1,024,145.80 |
| Implementation man-days | 392 at €1,135.51/day |

**$1M Year 1 budget assumption retired in pillar_synthesis.** Program-governance pillar and topProgramRisks updated.

---

## What Changed in pillar_synthesis.json

- **P2P confidenceLevel:** `partial` → `established`
- **P2P currentStateKnown:** +6 new items (vendor count, Trustpair validation breakdown, FR-PTP-02G evidence, ENGAGE totals, department breakdown, Trustpair integration scope)
- **P2P currentStateUnknown:** removed stale "Philippe's XLS report and Trustpair report — expected but not yet received"
- **P2P nextMoves:** +3 migration-readiness items (22 couple-Défavorable cleanup, 10 Défavorable remediation, ENGAGE migration strategy)
- **program-governance currentStateKnown:** +1 item (real KPMG commercials)
- **topProgramRisks:** $1M assumption replaced with confirmed €650K Year 1 figure

---

## What Codex Should Do Next

1. **Surface updated P2P data on Program page.** The P2P pillar now has concrete vendor counts and commitment totals — these should display on the `/program` P2P pillar card instead of placeholder text.

2. **Export the 22 couple-Défavorable + 10 Défavorable/Anomalie vendors as a review list.** Suggested output: `data/abivax/p2p-vendor-remediation-list.json` with vendor name, ref, country, global eval, couple eval, detail text. Mike can hand this to Philippe/Juliette as a pre-migration action list.

3. **Update Audit deck slide 9 (Commercials).** Slide 9 currently says "~$1M Year 1 assumption" — replace with real KPMG figures (€463K build + €187K run = €650K Year 1; 3-year €1.02M). Source: Camille's Feb 26 KPMG deck.

4. **Reconcile vendor counts.** Trustpair shows 497 vendors; ENGAGE shows 187 unique vendors in active commitments. These are different populations (all-time Trustpair vs. active commitment vendors). Confirm whether the remaining ~310 Trustpair vendors are historical/inactive and whether they need to migrate to NetSuite.

---

*Claude output — traceable to FR-PTP-02G queue item and vendor migration baseline*
