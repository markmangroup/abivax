# Codex Brief: Finance Share Deep-Read — Phase 2
**Written by Claude · Date: 2026-03-19**

---

## Context

Codex inventoried `O:\Commun\Support\Finance projects- IT` and produced a triage shortlist (1,939 files, 150 in shortlist). Claude has reviewed the shortlist and summary. This brief directs Codex on what to deep-read, what specific questions to answer, and the exact output format I need so I can integrate facts into the canonical JSON and encyclopedia without duplication.

---

## Division of Labor

**Codex owns:** File access, reading raw documents, extracting structured facts, writing facts JSON to `data/abivax/facts/`.

**Claude owns:** Integrating extracted facts into `pillar_synthesis.json`, `integrations_registry.json` (see below), and `generate_encyclopedia_html.js`. Claude will not re-read raw source files — it works from Codex's structured output.

**Rule:** Do not push raw document text into any encyclopedia or UI. Extract facts → write JSON → Claude integrates.

---

## Output Format Required

For each deep-read folder, Codex should produce a `facts_<cluster>.json` file in `data/abivax/facts/`. If that directory doesn't exist, create it.

Each file should be a JSON array of fact rows:

```json
[
  {
    "source_file": "relative path from share root",
    "pillar": "p2p | r2r | integrations | controls | o2c | treasury",
    "substream": "e.g. vendor-master | invoice-approval | payment-execution | coa | concur-invoice | agicap | adp | trustpair",
    "system": "e.g. Sage | Agicap | Trustpair | ADP | Concur | DocuShare | NetSuite",
    "fact_type": "process-step | approval-rule | integration-spec | control-gap | master-data | system-dependency | open-question | conflict-flag",
    "fact": "single, specific, declarative sentence. No summaries. Cite source evidence where possible.",
    "entity": "France SA | US LLC | both | unknown",
    "current_or_target": "current | target | both | unknown",
    "confidence": "confirmed | inferred | unclear",
    "claude_action": "add-to-currentStateKnown | add-to-erpDesignRequirements | add-to-integrations | flag-for-review | no-action"
  }
]
```

---

## Priority 1: Read These Folders First (Highest Value)

### 1A. `Flows/` — Integration Architecture

**Files to read:**
- `Flux Sage x Turstpair x Agicap.pdf` (exists in both `Flows/` and `TRUSTPAIR\FRANCE\Administratif\Prep envoi Change control request\`)
- `Sage - Agicap - flux.pdf`

**Questions to answer:**
- What does the current Sage → Trustpair → Agicap data flow look like step by step?
- What triggers each system handoff?
- What data fields pass between systems?
- Are there manual steps in the integration today?
- Is there an EBICS / SFTP component described?

**Output file:** `data/abivax/facts/facts_integration_flows.json`

---

### 1B. `CONCUR INVOICE/` — SKIP (Project Scrapped)

Confirmed scrapped by Mike. Skip entire `CONCUR INVOICE/` folder. No conflict with NetSuite P2P design.

---

### 1C. `CONNEXION SAGE-AGICAP-SG/` — Current Integration Specs

**Files to read:**
- `Connexion SAGE - Agicap - SG.xlsx`
- `RE Sécurisation du dossier AgicapExports - IT confirmation Trinidad.msg`
- `Formation Agicap 14.03.2025.docx` and `Formation Agicap 2.docx`
- Any `.msg` emails describing the integration setup or open questions

**Questions to answer:**
- How does the Sage → Agicap → SocGen connection work technically? (file format, schedule, field mapping)
- What is the `AgicapExports` folder? Who owns it? What IT confirmed?
- What was trained in the March 2025 Agicap training — what does it reveal about current operational gaps?
- Are there known issues / workarounds mentioned?

**Output file:** `data/abivax/facts/facts_connexion_sage_agicap_sg.json`

---

### 1D. `TMS AGICAP\Point SOX et parametrage moyens de paiement/`

**Files to read:**
- `RE Abivax x CFGI - Retour sur Agicap- SOX.msg`
- `Agicap - SOX control - CFGI.msg`

**Questions to answer:**
- What was CFGI's assessment of Agicap's SOX control status?
- Are there open control gaps CFGI identified in Agicap?
- What configuration changes were discussed?
- Any action items assigned?

**Output file:** `data/abivax/facts/facts_agicap_sox.json`

---

## Priority 2: Read These Folders Second

### 2A. `SOX/`

**Files to read:**
- `Abivax_RCM_combined.xlsx` (the main combined RCM)
- `SOX\Dernière RCM envoyée par KPMG\Abivax_RCM_combined.xlsx` (the KPMG-sent version — may differ)
- `SOX\Centralisation info controle - a retrier\` — any files here

**Questions to answer:**
- How many total controls in the combined RCM?
- Are there controls beyond P2P that are marked as ERP-dependent?
- Does the KPMG version differ from the Abivax version? If yes, how?
- Are there O2C controls in this RCM? (We have limited O2C data)

**Output file:** `data/abivax/facts/facts_sox_rcm.json`

---

### 2B. `CONNEXION ADP/` — Payroll Integration

**Files to read:**
- `RE GO for EBICS T contrat signature with SG.msg`
- `ADP Agicap en SFTP.msg`
- `RE Contrat EBICS T - ADP SG - Points sur les contrats OK SG.msg`
- `20250120- SG-CR ADP-SG ou ADP-Agicap.docx`

**Questions to answer:**
- Is ADP connected to Agicap today? Via SFTP or EBICS T?
- What data flows — payroll figures only, or full journal entries?
- What does the EBICS T contract cover — SG bank only, or also ADP?
- Is this France SA, US LLC, or both?
- Does this integration need to be replicated or replaced in NetSuite?

**Output file:** `data/abivax/facts/facts_connexion_adp.json`

---

### 2C. `SAGE\01-Sage upgrade\...\ABIVAX LLC\` — US LLC COA

**Files to read:**
- `Abivax LLC plan comptable COA après upgrade.xlsx`
- `Abivax LLC plan comptable COA.pdf`
- `Abivax LLC plans comptables COA.xlsx` (before-upgrade version)

**Questions to answer:**
- What is the US LLC chart of accounts structure? How many accounts?
- Key account groupings — asset/liability/equity/revenue/expense?
- How does it differ from France SA COA (if France version is visible)?
- Are there accounts that suggest R2R complexity (consolidation, intercompany, multi-GAAP)?

**Output file:** `data/abivax/facts/facts_us_llc_coa.json`

---

### 2D. `TRUSTPAIR\FRANCE/` — Full Trustpair Picture

**Files to read:**
- `Atelier processus _ Recommandations Trustpair - pgo.xlsx` (Trustpair's own process recommendations)
- `supplier control process.xlsx`
- `Abivax x Trustpair Outils et connecteurs TMS.msg` (TMS connector discussion)
- `Trustpair x Abivax Suite à notre réunion du 20012026.msg` (Jan 2026 meeting follow-up)
- `TRUSTPAIR\E-U\Supplier database cleaning\Supplier DATABASE cleaning review.xlsx` (US entity)

**Questions to answer:**
- What does Trustpair recommend for the NetSuite integration — which connector?
- Is there a TMS connector specifically for NetSuite mentioned?
- What is the US LLC Trustpair setup? Is it the same as France SA or different?
- Any open issues or recommendations from the Jan 2026 meeting?

**Output file:** `data/abivax/facts/facts_trustpair_full.json`

---

## Priority 3: Skip or Defer

**Skip entirely:**
- `SAGE\01-Sage upgrade\...\Etats avant upgrade (before upgrade)\` — historical, pre-upgrade state, not relevant
- `SAGE\01-Sage upgrade\...\Etats apres upgrade (after upgrade)\` — upgrade validation screenshots, not relevant
- Most `.png` files (control screenshots) unless they contain a diagram or matrix not captured elsewhere
- Supplier communication templates in `TRUSTPAIR\FRANCE\communication frs - définitif\` — not program-relevant

**Defer:**
- `CONCUR T&E\` training materials and SOP documents — low priority until T&E scope is confirmed for Phase 1

---

## Conflict Flags to Watch For

Flag these immediately (use `fact_type: "conflict-flag"` and `claude_action: "flag-for-review"`):
2. Any ADP integration that creates a Sage dependency that can't be replicated in NetSuite
3. Any indication that Agicap is expected to remain the primary payment execution layer post-go-live (vs. NetSuite-native payments)
4. Any COA accounts in the US LLC that suggest a materially different structure than France SA

---

## What NOT to Do

- Do not push facts directly into `pillar_synthesis.json` — that's Claude's job
- Do not update `generate_encyclopedia_html.js` or any HTML files
- Do not create summaries in place of structured facts — Claude needs rows, not prose
- Do not re-run the full 1,939-file inventory again unless Mike asks
- Do not read the Sage upgrade "Etats avant/après upgrade" folders — they are low-value for program design

---

## When Done

For each cluster completed, add a line to `collab/claude/outputs/codex-handoff-finance-sharedrive-phase2-DONE.md` with:
- Cluster name
- Files read
- Fact count
- Any conflict flags found
- Suggested next action for Claude

Claude will check that file before the next session to pick up where you left off.

