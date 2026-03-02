# Codex Prompt: Pull NetSuite XLSX Attachments from Email

## Task
Retrieve three XLSX files sent by Jamal Azil (NetSuite) in his email dated **February 23, 2026** and push them to the repository so they can be synced and reviewed.

## Files to Retrieve

| Filename | Purpose |
|----------|---------|
| `ABIVAX - Draft-Implementation Timeline V2.xlsx` | NetSuite proposed implementation timeline — potentially closes Audit Committee deck Open Data Gap #2 (commercial/timeline package) |
| `ABIVAX - Interface Tracker V2.xlsx` | System integration/interface log — scope input for ERP design |
| `ABIVAX_NetSuite Demo Feedback_v3.xlsx` | Demo scoring summary from the selection process |

## Source
**From:** Jamal Azil (NetSuite)
**Date:** February 23, 2026
**Email subject:** Likely related to NetSuite demo feedback or implementation planning (search Outlook for attachments from jamal.azil@netsuite.com or @oracle.com on Feb 23)

## Target Location in Repo
Save to: `data/abivax/vendor-assets/netsuite/`

Create the folder if it doesn't exist.

## Steps
1. Pull the three XLSX files from the Feb 23 Jamal Azil email via Outlook/Graph API or email staging pipeline
2. Save to `data/abivax/vendor-assets/netsuite/`
3. Commit with message: `feat: add NetSuite vendor XLSX assets from Jamal Azil Feb 23 email`
4. Push to GitHub so the files are accessible on main branch

## Why This Matters
The `ABIVAX - Draft-Implementation Timeline V2.xlsx` may close **Audit Committee deck Open Data Gap #2** (the "commercial/timeline package from NetSuite" listed as missing). This file should be reviewed before the March 4–5 deck finalization window for the March 6 Audit Committee meeting.

## After Completion
- Update `data/abivax/pillar_synthesis.json` → `programState.topProgramRisks` to remove the note about Gap #2 being open, if the timeline file confirms April mobilization → Jan 1, 2027 coverage
- Flag to Mike in chat: "NetSuite XLSX files pulled. Implementation timeline available at `data/abivax/vendor-assets/netsuite/`. Review Gap #2 status."
