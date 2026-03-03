# Claude Pickup Note - NetSuite Commercial Review (2026-03-03)

## Source
- Operator meeting notes from Mike (NetSuite call this morning) with screenshots of offer slides.
- Slide references appear to be commercial section around deck pages 64-70.

## What Codex Did
- Captured and normalized all meeting notes into structured findings below.
- Converted raw reactions into concrete negotiation/legal follow-ups.
- Prepared implementation instructions so Claude can merge into pillar and queue artifacts.

## Key Findings (Commercial)
1. License model appears materially over-scoped for current operating reality.
- Slide 64: 42 general access users, 17 procurement self-service users (in 5-packs), and 2 approval/specialized users were presented.
- Concern: PO/procurement licensing appears close to "license almost everyone," which is likely misaligned with actual process roles and current volume.
- Negotiation implication: require role-based user matrix and license-to-person mapping before accepting counts.

2. Add-on stack includes tools that require technical and commercial validation.
- Slide 65: NetSuite Analytics Warehouse (NSAW) and NSIP (Oracle Integration Cloud / NetSuite integration path).
- Concern: NSIP positioning was described as dedicated real-time middleware; needs architecture proof and necessity check vs simpler options.
- Negotiation implication: require use-case-based justification and integration topology with scope boundaries.

3. Additional success/support package may duplicate delivery coverage.
- Slide 66: "Customer Success Support" (outside Ali's delivery team), described as de-risking support (~36 hours/quarter).
- Concern: potential overlap with implementation partner responsibilities and high cost for low advisory hours.
- Negotiation implication: challenge value, overlap, and success criteria; either cut or tie to measurable outcomes.

4. E-invoicing add-on is lower priority for immediate phase.
- Slide 67: e-invoicing module pricing presented.
- Current state note: Abivax has no/limited revenue-side urgency; may not be phase-1 critical.
- Negotiation implication: defer or make optional pending phase scope confirmation.

5. OCR and bank reconciliation rely on Zone apps (third-party).
- Slides 69-70: ZoneCapture (OCR) and ZoneReconcile (bank reconciliation).
- Concern: presented as native/prebuilt for NetSuite but provided by separate company.
- Legal/compliance implication: confirm vendor-of-record, terms, data processing, and jurisdiction (US vs France applicability).

## Commitments from Oracle / NetSuite
- Jamal to resend/share detailed licensing breakdown.
- Oracle to send:
  - licensing breakdown,
  - statement of work (SOW),
  - legal agreements.

## Required Follow-Ups
1. Commercial negotiation pack
- Build a role-based license challenge table: named role, required capability, proposed SKU, qty rationale, keep/remove/defer.
- Separate mandatory core from optional add-ons (NSAW, NSIP, ACS, OCR, bank reconciliation, e-invoicing).

2. Technical validation
- Request architecture note for NSIP and add-ons: data flows, latency assumptions, ownership, support boundaries.
- Confirm if NSIP is actually required for phase-1 scope.

3. Legal review
- Route ZoneCapture/ZoneReconcile vendor status to legal team when documents arrive.
- Validate jurisdictional coverage and contractual model (NetSuite reseller vs direct third-party agreement).

4. Planning alignment
- Mark e-invoicing as candidate defer item unless board/finance confirms near-term need.

## Claude Implementation Instructions
- Update `data/abivax/pillar_synthesis.json` in relevant pillars:
  - Add current-state known items about commercial overscope risk and third-party add-on dependency.
  - Add/refresh `nextMoves` for license rationalization, NSIP validation, and legal review of Zone vendors.
  - Add `waitingOn` entries for Jamal/Oracle docs (license breakdown, SOW, legal agreements).
- Update any queue files feeding `/today` so Mike sees explicit decision/action items tied to these findings.
- Preserve uncertainty labels where evidence is pending until documents are received.
