# Source System Flow

Last updated: 2026-03-23

## Purpose

Make the operating context explicit across:

- Mike
- Codex on the work machine
- Claude on the personal machine

The goal is that every session can answer:

1. What source snapshot are we using?
2. What is still only in Outlook / temp?
3. What has been promoted into the repo?
4. What thread or party is waiting on Mike versus waiting on an outside party?

## Layers

### 1. Source systems

- Outlook inbox
- Outlook sent items
- Outlook calendar
- local desktop / downloaded files
- SharePoint / vendor materials

These are upstream systems of record. They are not the working memory layer.

### 2. Landing / staging layer

- `temp/recent-emails.json`
- `temp/recent-sent-emails.json`
- `temp/recent-email-attachments/`
- `data/abivax/emails_staging/*`

This layer is the raw or semi-raw pull from source systems.

### 3. Promotion / intake layer

- `data/abivax/document_intake_queue.json`
- `data/abivax/thread_registry.json`
- `data/abivax/document_registry.json`

This layer answers:

- what new document packages exist
- whether they are still staged only or already archived
- what email threads are active
- who is waiting on whom

### 4. Current operating context layer

- `data/abivax/current_context.json`
- `collab/shared/CURRENT_OPERATING_BRIEF.md`
- `collab/shared/SOURCE_SYSTEM_FLOW.md`

This is the explicit context window for a session.

### 5. Canonical working layer

- `data/abivax/vendor-assets/**`
- canonical JSON data files
- selected output documents and summaries

Only this layer should be treated as durable program memory.

## Session protocol

At session start:

1. Check `data/abivax/current_context.json`
2. Check `data/abivax/document_intake_queue.json`
3. Check `data/abivax/thread_registry.json`
4. Read `collab/shared/CURRENT_OPERATING_BRIEF.md`
5. Read `collab/shared/CONTEXT_WINDOW_PROTOCOL.md`

Then say explicitly:

- context window start / end
- latest inbox refresh status
- how many staged-only packages remain
- which external threads are waiting on Mike

## Practical rule

No important update should be summarized as current unless one of these is true:

- it is already archived in the repo, or
- it is explicitly called out as staged-only and not yet promoted

That is the guardrail that should prevent repeats of the March 23 Oracle / CFGI miss.

## Switching rule

This flow document works with `collab/shared/CONTEXT_WINDOW_PROTOCOL.md`.

The repo should be treated as a shared memory layer, but only one AI context window should be active at a time.
Do not treat "repo is synced" as permission for casual back-and-forth switching.
