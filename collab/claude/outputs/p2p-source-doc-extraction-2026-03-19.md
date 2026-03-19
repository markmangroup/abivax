# P2P Source Doc Extraction — 2026-03-19

## What Was Done

Extracted facts from the Codex-added P2P source documents (p2p-sharedrive-2026-03-19) into canonical data and encyclopedia HTML.

### pillar_synthesis.json — P2P pillar updated

- `lastRefreshedAt` updated to 2026-03-19
- 10 new entries added to `currentStateKnown`:
  - Formal 4-step process (Receipt → Entry → DocuShare Validation → Payment) per SOP0084_V01
  - SOP0084_V01 sign-off chain: Hema Keshava (author), Ana Sharma (QA), Didier Blondel (CFO), Marc de Garidel (CEO)
  - SVP Finance pre-approval requirement for Abivax LLC contracts
  - Trustpair mandatory hard gate (48-hour cutoff before each campaign)
  - PO Approval Matrix thresholds (fully extracted — ≤€50K through >€1M)
  - Invoice Approval Matrix — WITHOUT PO track
  - Invoice Approval Matrix — WITH PO track
  - Contract signature authority (separate from operational approval)
  - Analytical allocation structure (ADM/RAD 20/80, project codes, cost centers)
  - DocuShare confirmed as formally controlled SOP tool (not tribal knowledge)
- Removed: incorrect "No DoA matrix exists" entry — approval matrices ARE the DoA
- Updated `erpDesignRequirements[0]` to reflect matrices exist and need threshold review, not creation from scratch

### generate_encyclopedia_html.js — s10 P2P section updated

- Mermaid diagram updated from 3-step → 4-step (RECEIPT → ENTRY → VALIDATION → PAYMENT)
  - Color-coded: blue (Receipt/Entry), amber (DocuShare Validation), green (Payment)
  - Added payment cadence labels (10th & 25th), Trustpair hard-stop notation
- Added "Approval Authority Matrices" sub-section:
  - Side-by-side PO Matrix and Invoice Matrix tables
  - Invoice matrix shows both tracks (with/without PO) in same table for comparison
  - Control insight callout: PO track has lower approver thresholds at every tier

## Confirmed Facts (now source-backed)

| Fact | Source |
|------|--------|
| 4-step process | ABIVAX_Purchase process ENG version.pdf |
| SOP0084_V01 approval chain | SOP - Purchase Order and Contract Process.pdf |
| PO approval thresholds | Approval PO matrix.pdf |
| Invoice approval thresholds (with/without PO) | Approval Invoices Authorization Matrix.pdf |
| Trustpair hard gate | ABIVAX_Purchase process ENG version.pdf |
| Payment cadence 10th/25th | ABIVAX_Purchase process ENG version.pdf |
| ADM/RAD 20/80 split | ABIVAX_Purchase process ENG version.pdf |

## Remaining Open Source Docs (not yet extracted)

- `REC0234-V03_DocuShare User Guide.pdf` — detailed DocuShare workflow (low priority; SOP covers the key facts)
- `Saisie en devise English version.pdf` — foreign-currency entry guide (low priority for Phase 1 P2P)
- `Moyen de paiement - virements bancaires.xlsx` — payment workbook (may contain Sage prep step detail)
- SOP0084_V01 pages 4-12 — deeper PO/contract workflow steps (covered by purchase process PDF for Phase 1)

## Remaining P2P Open Items

Still open per ENCYCLOPEDIA_ROADMAP.md:
- US LLC P2P current-state docs (Kimberly/Matt overdue)
- Trustpair/NetSuite integration model (standard app vs. custom vs. paid)
- Invoice-over-PO tolerance policy (percent/amount threshold, hard-stop behavior)
- Contractor PO policy decision (yes/no pre-config)
- France vs. US P2P single design vs. separate
