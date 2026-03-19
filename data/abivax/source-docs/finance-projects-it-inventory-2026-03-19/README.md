# Finance Projects-IT Inventory

Generated from:
- `O:\Commun\Support\Finance projects- IT`

Generated on:
- `2026-03-19`

Artifacts:
- `files.json`
- `files.csv`
- `summary.json`
- `shortlist.json`
- `shortlist.md`

Purpose:
- First-pass metadata inventory and triage of the Finance Projects-IT shared drive.
- Designed to identify what is worth integrating into the ERP program without trying to read all files manually.

Important caveat:
- This is a metadata / filename / folder-based heuristic pass only.
- It is useful for narrowing scope, but it is not yet a content-level judgment.
- Current scoring slightly overweights controls-heavy Sage upgrade evidence because those files have strong naming signals.

Recommended next pass:
1. Tune weights to prioritize:
   - ERP process documentation
   - approval structures
   - DocuShare current-state evidence
   - Trustpair / Agicap / Concur / ADP integration artifacts
   - master-data governance
2. De-prioritize:
   - historical Sage upgrade evidence that is useful for background but not central to the 1/1/27 target-state design
3. Extract structured facts only from the top folders / files after triage
