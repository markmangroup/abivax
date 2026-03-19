# Codex Handoff: France P2P Shared-Drive Source Docs

Date: 2026-03-19

## What Was Added

Archived the shared-drive folder:
- `O:\Commun\Support\Finance projects- IT\ERP\Documentation process P2P`

Repo location:
- `data/abivax/source-docs/p2p-sharedrive-2026-03-19/`

English guide added:
- `data/abivax/source-docs/p2p-sharedrive-2026-03-19/README.md`

Key files now in repo:
- `ABIVAX_Purchase proecss - step 1 to 4 ENG version.pdf`
- `ABIVAX_Procédure Achat - étapes 1 à 4 - MAJ 02.2026.pdf`
- `SOP - Purchase Order and Contract Process.pdf`
- `REC0234-V03_DocuShare User Guide.pdf`
- `Approval PO matrix.pdf`
- `Approval  Invoices Authorization Matrix.pdf`
- `Signature policy.pdf`
- `Saisie en devise English version.pdf`
- `Saisie en devise.pdf`
- `Moyen de paiement - virements bancaires.xlsx`
- `Supplier data base cleaning.xlsx`

## Why This Matters

This is the best direct source set so far for the actual France P2P operating model. It is stronger than meeting notes alone because it shows the current documented flow, approval matrices, DocuShare usage, and payment / vendor-master supporting artifacts.

## Immediate Read

- France AP current state is formally documented around invoice receipt, entry, validation, and payment.
- DocuShare is not just tribal knowledge; it is a documented tool in the current process.
- PO and invoice approvals are threshold-based today.
- Signature authority is a separate policy layer above operational approval routing.
- Payment execution still appears heavily Sage-centered and manual, with workbook support and Agicap references.
- Vendor master quality / cleanup is already a live issue, which supports stronger future-state vendor governance requirements in ERP.

## Best Files To Use First

For English-first review:
1. `ABIVAX_Purchase proecss - step 1 to 4 ENG version.pdf`
2. `SOP - Purchase Order and Contract Process.pdf`
3. `Approval PO matrix.pdf`
4. `Approval  Invoices Authorization Matrix.pdf`
5. `REC0234-V03_DocuShare User Guide.pdf`
6. `Saisie en devise English version.pdf`

For supporting evidence / data structure:
7. `Moyen de paiement - virements bancaires.xlsx`
8. `Supplier data base cleaning.xlsx`

## Recommended Next Steps

1. Extract these source docs into structured France P2P facts.
   - Focus on: systems used, handoffs, approvals, evidence retention, payment prep, vendor setup, and exception paths.

2. Reconcile them against Juliette meeting notes.
   - Confirm where the formal docs match reality and where the actual process has drifted.
   - Key example: Excel tracker reliance may be more operationally critical than the formal SOP suggests.

3. Update the France P2P source-of-truth files.
   - `data/abivax/pillar_synthesis.json`
   - `data/abivax/erp_pillar_baselines.json`
   - Any France-specific process / requirements artifacts already feeding the front-end

4. Add source-backed detail to the front-end only after the extraction step.
   - Do not dump raw docs into UI.
   - Best use is to sharpen:
     - current-state flow
     - approval structure
     - DocuShare dependence
     - payment-process pain points
     - target-state ERP requirements

5. Consider building a compact “France P2P source pack” page or section later.
   - Not as a document repository
   - As an English operator summary with citations back to the archived files

## Cautions

- Some files are in French; use the English versions first where available.
- Formal SOPs may describe intended control, not actual day-to-day execution.
- The approval matrices are amount-based and should not be mistaken for the future-state approval model Mike wants in ERP.
