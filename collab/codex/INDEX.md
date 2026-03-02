# Codex Prompt Index

This folder contains execution prompts for Codex. Each prompt is self-contained — read it and execute.

## How to use

Tell Codex: **"Read `collab/codex/prompts/<name>.md` and execute it."**

---

## Available Prompts

| ID | File | What it does | Output location |
|----|------|-------------|----------------|
| `email-ingest` | `prompts/email-ingest.md` | Pulls sent/received Outlook emails since last ingest and stages them for Claude analysis | `data/abivax/emails_staging/` |

---

## Handoff pattern

Codex runs a prompt → writes structured output to `data/abivax/` → Claude session reads and analyzes.

For email analysis specifically: after Codex runs `email-ingest`, open a Claude session and say:
**"Run the email analysis pass on `data/abivax/emails_staging/`."**
