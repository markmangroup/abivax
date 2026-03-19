# Codex Brief — Phase 3: RCM Deep-Read + US LLC COA Structure
**Date:** 2026-03-19  
**From:** Claude  
**To:** Codex  
**Priority:** High  
**Depends on:** Phase 2 delivery (complete ✅)

---

## Context

Phase 2 delivered 46 structured facts. Two clusters need a deeper pass before Claude can populate the Controls section of the encyclopedia and complete the R2R US LLC sub-section.

---

## Task 1: KPMG RCM Workbook — Control-Level Facts

**Source file (confirmed by Phase 2):**
```
O:\Commun\Support\Finance projects- IT\SOX\
```
Phase 2 identified the workbook as 25 sheets, ~291 rows, with sheet names including:
`FR_PTP`, `FR_Treasury & Debt`, `FR_FSCP`, `IT`, `ELC`, `US_Treasury & Debt`, `US_PTP`, `US_FSCP`

**What Claude needs (one row per control):**

```json
{
  "source_file": "...",
  "process_area": "FR_PTP | FR_Treasury | US_PTP | ...",
  "control_id": "as-is ID from workbook if present",
  "control_description": "verbatim or close paraphrase",
  "control_type": "preventive | detective | manual | automated | ITGC",
  "frequency": "daily | weekly | monthly | quarterly | event-driven",
  "owner": "person or role from workbook",
  "entity": "SA | LLC | both",
  "erp_signal": true/false,
  "claude_action": "note for Claude (e.g. 'maps to CFTI control X', 'no NetSuite analog', 'automate candidate')"
}
```

**Priority sheets:** `FR_PTP`, `FR_Treasury & Debt`, `US_PTP` first. Then `IT`, `ELC`.

**Output file:** `data/abivax/facts/facts_rcm_controls.json`

**Flag any:** controls with no named owner, controls that reference Agicap or Sage explicitly (these are migration-design dependencies), and any ELC / ITGC entries that mention Sage access or segregation of duties.

---

## Task 2: US LLC COA — Account Structure

**Source files (confirmed by Phase 2):**
```
O:\...\SAGE\01-Sage upgrade\Upgrade Sage v12\4 - Contrôles Finance\
  Etats avant upgrade (before upgrade)\2025\ABIVAX LLC\Abivax LLC plans comptables COA.xlsx
  Etats apres upgrade (after upgrade)\2025\ABIVAX LLC\Abivax LLC plan comptable COA après upgrade.xlsx
```

Phase 2 confirmed: 128 accounts, French-convention naming.

**What Claude needs:**

```json
{
  "account_code": "119000",
  "account_name": "Carry Forward",
  "account_type": "asset | liability | equity | revenue | expense",
  "functional_area": "G&A | R&D | Clinical | N/A",
  "notes": "any structural observation"
}
```

**Output file:** `data/abivax/facts/facts_us_llc_coa_detail.json`

**Key questions to answer from the data:**
- Do account ranges follow French GAAP convention (1xx assets, 2xx fixed assets, etc.)?
- Are there any US-specific accounts not present in France SA COA?
- Any clinical trial cost accounts (ADM/RAD equivalent)?

---

## Task 3 (Optional / Lower Priority): Trustpair Remediation Detail

Phase 2 delivered 10 Trustpair facts but at summary level. If you have time, extract the specific remediation action matrix (what happens for each alert type: blacklisted, missing ID, invalid account, etc.) into a structured table in `facts_trustpair_remediation.json`.

---

## Output Summary

| File | Status |
|------|--------|
| `facts_rcm_controls.json` | **Needed** — blocked on this for Controls section |
| `facts_us_llc_coa_detail.json` | **Needed** — blocked on this for R2R US LLC |
| `facts_trustpair_remediation.json` | Optional |

Sync to repo when done. Claude will integrate on next context window.
