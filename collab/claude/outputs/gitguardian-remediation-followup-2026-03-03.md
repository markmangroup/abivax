# GitGuardian Remediation Follow-up (2026-03-03)

## What was completed

- `HEAD` was sanitized and pushed in commit `76892a5`.
- A reusable sanitizer was added:
  - `scripts/sanitize_email_ingest_artifacts.js`
  - `npm run email:sanitize-ingest`
- Email ingest prompt now requires sanitization and literal checks:
  - `collab/codex/prompts/email-ingest.md`

## Remaining risk

Sensitive literals still exist in historical commits and can trigger scanners:

- `3040bf0` (`data/abivax/emails_staging/emails_2026-03-02.json`)
- `61cf3d9` (same JSON + generated Claude output exports)

## Recommended next step (history rewrite, coordinated)

Do this only with team coordination because it rewrites `main` history:

1. Rewrite history to remove/redact literals from all reachable commits.
2. Force-push rewritten refs.
3. Instruct all collaborators to re-clone or hard-reset to new `origin/main`.
4. Rotate any credentials that were exposed in historical commits.

## Minimal verification commands

```powershell
git log --all --oneline -S"HelloFebruary2267!"
git log --all --oneline -S"W882cx{PE!"
git log --all --oneline -S"H2s&f/Hc!*"
git log --all --oneline -S"csi\\mmarkman"
```

If rewrite is successful, these should return no legacy commits containing the literals.
