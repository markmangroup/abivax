# Codex Daily Routine

**This file is permanent and lives at a fixed path. Read it at the start of every Codex session.**

When Mike says anything like:
- "do the daily sync"
- "run the emails"
- "scrape the emails"
- "do your thing and push"
- "go do the Codex work"

...this is what he means. Execute this routine, then push to GitHub and hand back to Claude.

---

## Step 1 — Pull latest from GitHub

```
git pull origin main
```

Get in sync with whatever Claude or the last session committed.

---

## Step 2 — Refresh local Outlook exports

Run the Outlook inbox and sent export scripts to capture anything new since the last refresh:

- `temp/recent-emails.json`
- `temp/recent-sent-emails.json`
- `temp/recent-email-attachments/` (new attachment folders)

Use whatever local Outlook/desktop scripts are current for this machine.

---

## Step 3 — Process new emails and attachments

For each new email thread or attachment since the last watermark in `data/abivax/email_ingest_state.json`:

1. Identify new packages (vendor emails, internal threads, attachments, broader-role/career-relevant emails)
2. Archive attachments into `data/abivax/vendor-assets/` or appropriate subfolder
3. Update `data/abivax/document_intake_queue.json` with new items
4. Update `data/abivax/thread_registry.json` with latest thread state
5. Update `data/abivax/current_context.json` to reflect the new freshness boundary

Priority threads to always check:
- Oracle / NetSuite (jamal.azil@oracle.com, Laurent Bailly, Venceslas dEchallens)
- CFGI (jacoutareau@cfgi.com, kschatz@cfgi.com, adepoy@cfgi.com, wbouassida@cfgi.com)
- KPMG (Camille Girard)
- Internal Abivax (Hema Keshava, Jade Nguyen, Didier Blondel)
- Reference calls (any NetSuite reference thread)
- Broader role / career / visibility threads that may matter to Mike beyond ERP execution

Do not limit the sync to ERP-only email. If something is relevant to Mike's broader Abivax role, leadership visibility, internal positioning, or future outputs, it should be surfaced too.

---

## Step 4 — Update canonical data if warranted

If new emails or attachments change something material (new commercial figures, new scope commitments, new people, signed contracts), update the relevant canonical JSON files:

- `data/abivax/pillar_synthesis.json`
- `data/abivax/people.json`
- `data/abivax/budget.json`
- `data/abivax/consultant_reviews.json`

Do not update canonical JSON for routine email traffic. Only update when a source document materially changes a known fact.

---

## Step 5 — Write Claude handoff

Write a dated handoff file at:

```
collab/claude/prompts/YYYY-MM-DD_CLAUDE_HANDOFF.md
```

Contents must include:
1. What Codex did in this session (what was refreshed, what was found)
2. New facts from emails — anything Claude needs to know before drafting or deciding
3. Which threads are now waiting on Mike (and need replies)
4. Explicit list of files Claude should read for this session
5. What Claude's task is today (if known from context)

Also include:
- any broader-role / career-relevant email signals surfaced in `data/abivax/current_context.json`
- whether Claude should decide where those signals belong in the app or output system

If no specific Claude task is known, default to:
- Review new thread activity
- Determine if vendor reply drafts need updating based on new emails
- Keep May 21 backward plan current

---

## Step 6 — Commit and push

Stage and commit everything:

```
git add -A
git commit -m "Codex daily sync YYYY-MM-DD: <one line summary of what changed>"
git push origin main
```

Then tell Mike: **"Done. Pushed to GitHub. Switch to Claude."**

---

## What Codex should NOT do in this routine

- Do not rewrite strategy or program direction
- Do not modify canonical JSON unless a source document explicitly changes a known fact
- Do not build or modify front-end pages
- Do not spend time on the encyclopedia or spine app unless Mike explicitly asks

---

## Reminder: freshness boundary rule

After every sync, `data/abivax/current_context.json` must reflect the actual latest email timestamp so Claude knows exactly how fresh the context is.
