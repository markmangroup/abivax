# Codex Handoff: Finance Projects-IT Share Inventory

Date: 2026-03-19

## What Was Done

Built a repeatable metadata inventory and first-pass triage for:
- `O:\Commun\Support\Finance projects- IT`

Script added:
- `scripts/inventory_finance_projects_it.ps1`

Generated artifacts:
- `data/abivax/source-docs/finance-projects-it-inventory-2026-03-19/files.json`
- `data/abivax/source-docs/finance-projects-it-inventory-2026-03-19/files.csv`
- `data/abivax/source-docs/finance-projects-it-inventory-2026-03-19/summary.json`
- `data/abivax/source-docs/finance-projects-it-inventory-2026-03-19/shortlist.json`
- `data/abivax/source-docs/finance-projects-it-inventory-2026-03-19/shortlist.md`
- `data/abivax/source-docs/finance-projects-it-inventory-2026-03-19/README.md`

## First-Pass Results

Total files indexed:
- `1,939`

Bucket breakdown:
- `core-source`: `5`
- `supporting-evidence`: `234`
- `archive-only`: `726`
- `ignore`: `974`

Extension mix:
- `.pdf`: `736`
- `.xlsx`: `585`
- `.msg`: `170`
- `.png`: `133`
- `.docx`: `81`

Pillar-tag signals:
- `p2p`: `1127`
- `integrations`: `494`
- `controls`: `354`
- `order-to-cash`: `320`
- `record-to-report`: `212`
- `treasury`: `189`

## Most Relevant Folder Clusters Found

High-value from a program perspective:
- `ERP\Documentation process P2P`
- `DOCUSHARE MAJ 2024`
- `TRUSTPAIR\FRANCE`
- `CONNEXION SAGE-AGICAP-SG`
- `CONNEXION ADP`
- `CONCUR T&E`
- `SOX`
- `ERP\Treasury`

Large but likely mixed-value / background-heavy:
- `SAGE\01-Sage upgrade\...`

## Important Read on the Heuristic

The first-pass scoring worked, but it has a visible bias:
- it overweights controls-heavy `SAGE upgrade` evidence because file names include terms like `controle`, `reconciliation`, `COA`, and dated reviewed workbooks
- that means some historical Sage-upgrade artifacts float very high even though they may be less important for the future-state ERP program than current operating-model and integration files

This is not a bug so much as a reminder that metadata triage is only the first pass.

## What I Recommend Next

### Pass 2: Tune the triage weights

Increase weight for:
- ERP process documentation
- approval matrices / signature authority
- DocuShare operating artifacts
- Trustpair / Agicap / Concur / ADP interface materials
- vendor / supplier master governance
- project governance docs that define execution roles

Decrease weight for:
- historical Sage upgrade evidence
- repetitive before/after control screenshots
- old migration control packs that do not define future-state process

### Pass 3: Work by folder cluster, not by file list

Recommended review order:
1. `ERP\Documentation process P2P`
2. `DOCUSHARE MAJ 2024`
3. `TRUSTPAIR\FRANCE`
4. `CONNEXION SAGE-AGICAP-SG`
5. `CONNEXION ADP`
6. `CONCUR T&E`
7. `SOX`
8. selected `SAGE` folders only where they illuminate controls, master data, or interface dependencies

### Pass 4: Extract structured facts, not summaries

For top-value files, extract rows like:
- `file`
- `pillar`
- `substream`
- `system`
- `fact_type`
- `fact`
- `country`
- `current_state_or_target_state`
- `control_relevance`
- `implementation_relevance`
- `confidence`

Fact types should include:
- process step
- approval rule
- evidence location
- system dependency
- integration touchpoint
- control gap
- master-data issue
- target-state requirement

### Pass 5: Promote only curated facts into the program model

Do not push raw documents directly into UI.

Instead, feed structured facts into:
- current-state process views
- target-state build scope
- controls coverage mapping
- integration dependency mapping

## Suggested Alignment Question For Claude

Please pressure-test whether this inventory / triage model aligns with the current direction of the codebase, especially:
- whether a canonical source-library / triage workflow should exist before more front-end expansion
- whether the `program` / future-state model should eventually reference curated source facts from this inventory
- how best to avoid duplicating work between current-state document triage and the target-state ERP build-scope model

## My View

This share really is a treasure trove, but it will only help if treated as a governed source pool. The right operating model is:
- inventory everything
- classify fast
- deep-read selectively
- extract structured facts
- then integrate only the useful signal into the ERP program artifacts

That is the cleanest way to avoid overwhelming the app, the repo, and the decision process.
