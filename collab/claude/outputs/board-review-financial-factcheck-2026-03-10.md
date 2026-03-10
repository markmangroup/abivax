# Board Review Financial Factcheck - 2026-03-10

Purpose: correct the financials in `/abivax/spine/board-review` and align slides 2-3 to a single source basis.

## Problem

The current `public/board-erp-readout-review.html` mixes two different financial baselines:

1. KPMG finalist comparison workbook basis
2. Later Oracle / NetSuite commercial package basis used in the Audit Committee deck

That creates internal math errors and apples-to-oranges comparisons.

## Current errors in board-review

### Slide 2

Current file:
- `public/board-erp-readout-review.html:915`
- `public/board-erp-readout-review.html:916`

Current statement:
- NetSuite `Year 1 total = EUR 650K`
- SAP `Year 1 total = EUR 1.24M`

Issue:
- SAP `EUR 1.24M` is using the KPMG finalist comparison workbook basis
- NetSuite `EUR 650K` is using the later Oracle package basis
- This is not a like-for-like comparison

### Slide 3

Current file:
- `public/board-erp-readout-review.html:1016`
- `public/board-erp-readout-review.html:1024`
- `public/board-erp-readout-review.html:1031`
- `public/board-erp-readout-review.html:1072`
- `public/board-erp-readout-review.html:1208`

Current statements:
- NetSuite platform `EUR 650K`
- sub-breakout `EUR 452K build + EUR 151K run`
- Year 1 subtotal `~EUR 1M`
- slide footer `Year 1: ~EUR 1M (NetSuite + KPMG PMO)`

Issues:
- `EUR 452K + EUR 151K = EUR 603K`, not `EUR 650K`
- `~EUR 1M` is mixing a EUR platform figure with a USD PMO figure without an FX conversion basis
- the `134 internal man-days vs. 480 for SAP` claim is not validated by the source workbook used for the SAP/NetSuite cost comparison
- `372 days` for Oracle / NetSuite also conflicts with the `392 man-days` number used elsewhere in repo materials

## Correct source sets

There are two valid source sets. Pick one per slide and stay consistent.

### Option A: KPMG finalist comparison workbook

Use this if the slide is a direct `NetSuite vs SAP` finalist comparison.

Source file:
- `data/abivax/vendor-assets/erp-selection/Abivax - Final Financial comparaison Offer.xlsx`

Base-case values from `Financial analysis conso`:

NetSuite:
- Build: `EUR 451,520.00`
- Annual run: `EUR 151,017.00`
- 3-year total: `EUR 904,571.00`
- 5-year total: `EUR 1,206,605.00`
- 10-year total: `EUR 1,961,690.00`

SAP:
- Build: `EUR 1,066,193.30`
- Annual run: `EUR 172,583.00`
- 3-year total: `EUR 1,583,942.30`
- 5-year total: `EUR 1,929,108.30`
- 10-year total: `EUR 2,792,023.30`

Loaded cash-planning values from `Cash forecast analysis`:

NetSuite:
- Year 1 loaded cash: `EUR 864,288.60`
- 3-year loaded total: `EUR 1,238,305.80`
- 5-year loaded total: `EUR 1,646,657.78`

SAP:
- Year 1 loaded cash: `EUR 1,316,042.45`
- 3-year loaded total: `EUR 2,172,714.95`
- 5-year loaded total: `EUR 2,649,482.18`

### Option B: later Oracle / NetSuite commercial package

Use this if the slide is about the current selected-program budget, not the finalist comparison.

Source references:
- `data/abivax/presentations.json` under `audit-committee-erp-overview-20260306`
- `data/abivax/inbox_assets/2026-03-02-camille-philippe/abivax - audit committee 020326.pptx`

Confirmed values:
- Year 1: `EUR 650,129`
- Build: `EUR 463,120`
- Run: `EUR 187,009`
- 3-year total: `EUR 1,023,264`
- 5-year total: `EUR 1,398,163`
- `142 users`
- `392 man-days at EUR 1,135.51/day`

## Recommended fix

### Slide 2 recommendation

Slide 2 is a finalist-selection slide. Use the KPMG finalist workbook basis only.

Recommended correction:
- NetSuite Year 1: `EUR 603K` shown as `EUR 452K build + EUR 151K annual run`
- SAP Year 1: `EUR 1.24M` shown as `EUR 1.07M build + EUR 173K annual run`

If you want to keep a simpler headline:
- `NetSuite Year 1 base-case: ~EUR 0.60M`
- `SAP Year 1 base-case: ~EUR 1.24M`

### Slide 3 recommendation

Slide 3 is a current-program budget / mobilization slide. Use the later Oracle package basis, plus KPMG PMO, and state currencies honestly.

Recommended correction:
- NetSuite platform Year 1: `EUR 650,129`
- KPMG PMO: `$350K` flat fee proposal
- Do not write `~EUR 1M` unless you explicitly convert USD to EUR and state the FX basis
- Safer wording:
  - `NetSuite Year 1 platform budget: EUR 650K`
  - `KPMG PMO proposal: USD 350K`

If a combined single-number subtotal is required:
- add an FX assumption explicitly
- otherwise keep the two figures separate

### Man-days recommendation

Do not use:
- `372 days`
- `134 internal man-days`

unless you can cite the exact source artifact for those numbers.

For now, use:
- `392 man-days` only if you are intentionally using the later Oracle package basis

## Specific files to update

- `public/board-erp-readout-review.html`
- any matching deck/export built from this page

## One-sentence instruction for Claude

Update `/abivax/spine/board-review` so Slide 2 uses only the KPMG finalist comparison workbook basis, Slide 3 uses only the later Oracle selected-program budget basis, remove mixed-basis comparisons, and eliminate any subtotal that mixes EUR and USD without an explicit FX assumption.
