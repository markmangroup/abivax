# Codex Handoff: Finance Shared Drive Phase 2 Done

Date: 2026-03-19

This pass executed Claude's phase-2 brief after syncing latest `main` and focused on the priority shared-drive clusters that Codex could access outside the sandbox.

## Structured Outputs Added

- `data/abivax/facts/facts_integration_flows.json`
- `data/abivax/facts/facts_connexion_sage_agicap_sg.json`
- `data/abivax/facts/facts_agicap_sox.json`
- `data/abivax/facts/facts_connexion_adp.json`
- `data/abivax/facts/facts_trustpair_full.json`
- `data/abivax/facts/facts_us_llc_coa.json`
- `data/abivax/facts/facts_sox_rcm.json`

## Completed Clusters

### 1. `Flows/`

Files used:
- `O:\Commun\Support\Finance projects- IT\Flows\Flux Sage x Turstpair x Agicap.pdf`
- `O:\Commun\Support\Finance projects- IT\Flows\Sage - Agicap - flux.pdf`

Outcome:
- The `Flux Sage x Turstpair x Agicap.pdf` file was parseable and produced the key architecture facts.
- `Sage - Agicap - flux.pdf` produced almost no machine-readable text and was not used as a source of record.

Key facts captured:
- Sage 100 is upstream of Trustpair and Agicap.
- SFTP is used for payment files, vendor-base exchanges, and Trustpair analysis returns.

### 2. `CONNEXION SAGE-AGICAP-SG/`

Files used:
- `Connexion SAGE - Agicap - SG.xlsx`
- `Formation Agicap 14.03.2025.docx`
- `Formation 2\Formation Agicap 2.docx`
- `RE Sécurisation du dossier AgicapExports - IT confirmation Trinidad.msg`

Outcome:
- Captured the current payment-file handoff from Sage to Agicap.
- Captured export-folder access/security details and nightly audit-trail behavior.
- Captured an apparent contradiction:
  - some materials say files become non-modifiable in Agicap once imported to `A signer`
  - training notes describe a cancellation/rework path that can reintroduce modification risk

Key facts captured:
- Sage payment files are imported into Agicap `A signer`.
- AgicapExports folder is on the Sage remote desktop and auto-exports via SFTP.
- Juliette and Fatma have write access to the export folder.
- Nightly CSV audit trail exists.
- Payment thresholds of 5m / 10m EUR appear in training materials.

### 3. `TMS AGICAP\Point SOX et parametrage moyens de paiement/`

Files used:
- `Agicap - SOX control - CFGI.msg`
- `RE Abivax x CFGI - Retour sur Agicap- SOX.msg`

Outcome:
- Captured the most important Agicap control-design constraints.

Key facts captured:
- Agicap is the live TMS.
- No SOC report today; SOC 2 only on roadmap.
- No co-administration currently.
- Administrator can create/modify vendor/profile.
- Vendor master remains in Sage.
- CFGI states Agicap cannot be relied on alone as the SOX signing tool.

### 4. `CONNEXION ADP/`

Files used:
- `ADP Agicap en SFTP.msg`
- `RE GO for EBICS T contrat signature with SG.msg`
- `RE Contrat EBICS T - ADP  SG - Points sur les contrats OK SG.msg`

Outcome:
- Captured the distinction between API-based invoice synchronization and SFTP/EBICS-based payroll payment transmission.

Key facts captured:
- Sage to Agicap invoice connection uses API twice daily.
- Payroll payment upload remains SFTP / SEPA based.
- EBICS T setup with Societe Generale was a dependency and then moved to activated status.

### 5. `TRUSTPAIR\FRANCE/`

Files used:
- `Atelier processus _ Recommandations Trustpair - pgo.xlsx`
- `supplier control process.xlsx`
- `Trustpair x Abivax __ Suite à notre réunion du 20_01_2026.msg`
- `Abivax x Trustpair  Outils et connecteurs TMS.msg`

Outcome:
- Captured Trustpair exception-handling playbooks, control ownership, and future-state integration signals.

Key facts captured:
- Detailed remediation logic exists for invalid, closed, blacklisted, or missing supplier bank/account information.
- France vendor-change handling includes manual escalation to Trinidad.
- Juliette is SA preparer; Matt Epley is LLC preparer.
- Trustpair indicates API compatibility with NetSuite but no confirmed native NetSuite connector in the source set.
- US SFTP rollout remains dependent on IP whitelisting.

### 6. `US LLC COA`

Files used:
- `Abivax LLC plans comptables COA.xlsx`
- `Abivax LLC plan comptable COA après upgrade.xlsx`

Outcome:
- Captured a basic structural fact pass only.

Key facts captured:
- Before and after workbooks both show 128 rows on the `Plan comptable` sheet.
- A fuller category-by-category COA analysis was not attempted in this pass.

### 7. `SOX/`

Files used:
- `SOX\Dernière RCM envoyée par KPMG\Abivax_RCM_combined.xlsx`

Outcome:
- Captured workbook-structure facts only.

Key facts captured:
- 25 sheets.
- Approximate parsed row count around 291.
- Visible tabs include FR_PTP, FR_Treasury & Debt, FR_FSCP, IT, and US control domains.

## Deliberate Non-Work

- Did not update `pillar_synthesis.json`.
- Did not touch any UI or encyclopedia files.
- Did not rewrite Claude's extracted P2P source-doc work from the separate `Documentation process P2P` folder.

## Extraction Caveats

- Some PDFs and DOCX files are only partially machine-readable.
- The RCM facts are intentionally structural, not control-by-control.
- `Sage - Agicap - flux.pdf` was not useful in text extraction.
- Any `no O2C sheet found` signal from the RCM should be treated as low confidence until a deeper parse is done.

## Suggested Next Pass

1. Deep-parse the RCM workbooks into control rows rather than workbook metadata.
2. Compare Agicap control claims against actual operational docs to resolve the "non-modifiable file" versus "cancel and modify" conflict.
3. Normalize all extracted facts into a single searchable fact index once Claude confirms the schema is stable.
4. Use the fact files to inform a future build-scope register, but keep that as a separate modeling step.
