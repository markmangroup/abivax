# Codex Prompt Index

This folder contains execution prompts for Codex. Each prompt is self-contained — read it and execute.

## How to use

Tell Codex: **"Read `collab/codex/prompts/<name>.md` and execute it."**

---

## Available Prompts

| ID | File | What it does | Output location |
|----|------|-------------|----------------|
| `email-ingest` | `prompts/email-ingest.md` | Pulls sent/received Outlook emails since last ingest and stages them for Claude analysis | `data/abivax/emails_staging/` |
| `email-triage` | `prompts/email-triage.md` | Reads staged emails and produces a structured triage manifest for Claude — classifies type, extracts key facts, flags urgency, links to program entities and data gaps | `data/abivax/emails_staging/triage_<date>.json` |

---

## Email pipeline (full flow)

Run these in order. Each step depends on the previous.

**Step 1 — Ingest** (Codex, needs Outlook access)
```
Read collab/codex/prompts/email-ingest.md and execute it.
```
Pulls new emails into `data/abivax/emails_staging/emails_<date>.json`.

**Step 2 — Triage** (Codex, reads staged files)
```
Read collab/codex/prompts/email-triage.md and execute it.
```
Classifies each email, extracts facts, produces `data/abivax/emails_staging/triage_<date>.json`.

**Step 3 — Analysis** (Claude session)
Tell Claude:
```
Run email analysis
```
Claude reads `EMAIL_ANALYSIS_PROTOCOL.md` automatically, processes the triage manifest,
drafts replies, queues data updates, opens/closes todos, and writes an action manifest
to `collab/claude/outputs/email-analysis-<date>.md`.

---

## Handoff pattern

Codex runs → writes structured output to `data/abivax/` → Claude reads and acts.

Never skip Step 2. Claude cannot access Outlook and relies entirely on the triage
manifest to understand what emails exist and what they contain.
