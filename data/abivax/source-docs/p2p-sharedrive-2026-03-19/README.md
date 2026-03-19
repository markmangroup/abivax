# France P2P Shared-Drive Archive

Archived from:
- `O:\Commun\Support\Finance projects- IT\ERP\Documentation process P2P`

Archived on:
- `2026-03-19`

Purpose:
- Source documents from the France P2P process library used by Finance.
- Mix of English and French working documents.
- Useful for current-state validation, process mapping, and ERP design inputs.

## File Guide

- `ABIVAX_Purchase proecss - step 1 to 4 ENG version.pdf`
  - English process walkthrough for invoice receipt, entry, validation, and payment.
  - Best starting point if you want the operational flow in English.

- `ABIVAX_Procédure Achat - étapes 1 à 4 - MAJ 02.2026.pdf`
  - French version of the same purchase / invoice process.
  - Title in English: `Purchase Procedure - Steps 1 to 4`.

- `SOP - Purchase Order and Contract Process.pdf`
  - Formal SOP for PO and contract process.
  - Approved document with management sign-offs.
  - Likely the strongest policy-level source for how PO workflow is intended to work.

- `REC0234-V03_DocuShare User Guide.pdf`
  - DocuShare user manual.
  - Explains the current document-routing / approval tool that France AP still relies on.

- `Approval PO matrix.pdf`
  - PO approval authority matrix by amount.

- `Approval  Invoices Authorization Matrix.pdf`
  - Invoice approval authority matrix for invoices without purchase orders / signed contracts.

- `Signature policy.pdf`
  - Contract signature authority policy.
  - Confirms higher-level signatory thresholds.

- `Saisie en devise English version.pdf`
  - English guide for entering foreign-currency transactions.

- `Saisie en devise.pdf`
  - French version of the currency-entry guide.
  - Title in English: `Currency Entry`.

- `Moyen de paiement - virements bancaires.xlsx`
  - Bank-transfer / payment-workflow workbook.
  - Title in English: `Payment Method - Bank Transfers`.
  - Tabs suggest step-by-step Sage payment prep, cash-out file prep, manual payments, and Agicap linkage.

- `Supplier data base cleaning.xlsx`
  - Vendor master cleanup workbook.
  - Includes supplier list, identification fields, bank fields, and free fields.

## Best English-First Reading Order

1. `ABIVAX_Purchase proecss - step 1 to 4 ENG version.pdf`
2. `SOP - Purchase Order and Contract Process.pdf`
3. `Approval PO matrix.pdf`
4. `Approval  Invoices Authorization Matrix.pdf`
5. `REC0234-V03_DocuShare User Guide.pdf`
6. `Saisie en devise English version.pdf`

## Immediate Process Signals

- Current-state AP process is explicitly documented around invoice receipt, entry, validation, and payment.
- DocuShare is a real controlled part of the current process, not just tribal knowledge.
- PO and invoice approvals are threshold-driven today.
- Signature authority is a separate policy layer from operational approval.
- Payment execution still appears to rely on Sage-centered manual preparation, with bank-transfer workbooks and Agicap references.
- Vendor master cleanup is already a live data-quality topic, which supports the need for stronger future-state vendor governance in ERP.
