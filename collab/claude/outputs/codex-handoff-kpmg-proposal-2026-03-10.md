Claude handoff: KPMG proposal source ingest and board-deck implications

What Codex did
- Located the actual KPMG proposal email in Outlook from `2026-03-10 12:46 PM ET`
- Subject: `KPMG proposal`
- Sender: `Camille Girard`
- Directly exported the attachment from Outlook because the normal email export had indexed the PDF name but did not persist the file to `temp`
- Copied the source PDF into the repo
- Extracted page text for review
- Wrote a durable source summary

Source files now in repo
- `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.pdf`
- `data/abivax/vendor-assets/kpmg-pmo/032026_Proposal_AMOA_ABIVAX_v1.text.json`
- `data/abivax/vendor-assets/kpmg-pmo/README.md`

Most important finding
- The source KPMG document is not a narrow PMO-only pitch.
- It is an `AMOA support proposal` across three workstreams:
  - `Functional assistance`
  - `Change management`
  - `Project management`

Source pricing from page 27
- `Functional assistance: EUR 231,200`
- `Change management: EUR 110,400`
- `Project management: EUR 28,500`
- `Total: EUR 370,100`
- plus `20% VAT`
- plus expenses billed separately
- `302 man-days`

Board-deck implication
- Do not present the source KPMG proposal as only `PMO = $350K flat fee` unless you have a later negotiated, narrower commercial version documented elsewhere.
- The actual source proposal is broader and should be described accordingly if referenced.

Recommended board interpretation
- Use KPMG as an independent control/governance layer around the chosen system integrator, not as a second builder.
- The real value they are pitching is:
  - governance cadence
  - risk / RAID / escalation
  - functional assurance and design challenge
  - controls / SoD / SOX support
  - FR/US coordination
  - change and training support

Best concise board-ready language
- `KPMG submitted a March 2026 implementation-support proposal to provide governance, functional assurance, controls oversight, and change management around the NetSuite implementation.`
- `The source proposal totals EUR 370.1K excluding VAT and expenses across 302 man-days over a 9-month implementation window.`
- `Management’s intended role for KPMG is as an execution-control layer around the selected integrator rather than as a second implementer.`

What not to overdo in the slides
- Do not dump the full proposal structure into the main board deck.
- Do not spend slide space on toolkit details like sponsor videos, e-learning, or generic KPMG Powered marketing.
- Keep only the parts that matter for governance, controls, execution risk, and FR/US coordination.

Suggested uses in the deck
1. On the delivery model / organization slide:
- Position KPMG as `independent governance and execution support`

2. On the economics slide:
- If using source proposal basis, use `EUR 370.1K excl. VAT/expenses`
- If using a later narrowed PMO basis instead, explicitly label it as management’s targeted scope, not the full KPMG proposal

3. On the risks / mitigation slide:
- KPMG support can be tied to mitigation of:
  - weak governance
  - FR/US coordination risk
  - user adoption risk
  - controls-by-design risk

Supporting detail
- Page-by-page breakdown is already in:
  - `data/abivax/vendor-assets/kpmg-pmo/README.md`

No slide files were changed by Codex in this pass.
