# Prompt: Email Ingest → Repo Staging for Claude Analysis
**ID:** `email-ingest`
**Lane:** Codex execution
**Output consumed by:** Claude session (analysis + synthesis pass)

---

## Task

Pull all sent and received emails since the last successful email ingest run. Write them into the repo in a structured format that Claude can read and analyze in a subsequent session.

---

## Step 1: Determine the ingest window

Check for an existing ingest watermark. Look in this priority order:

1. `data/abivax/email_ingest_state.json` — if it exists, read the `lastPulledAt` timestamp and use that as the start of the pull window.
2. If that file doesn't exist, default to pulling emails from the last 14 days.

The end of the pull window is now (current timestamp at time of run).

---

## Step 2: Pull emails from Outlook

Pull from both:
- **Inbox** (received)
- **Sent Items** (sent)

For each email, capture:
```json
{
  "id": "<unique message id>",
  "direction": "received" | "sent",
  "date": "<ISO 8601 timestamp>",
  "subject": "<subject line>",
  "from": "<sender name and email>",
  "to": ["<recipient name and email>"],
  "cc": ["<cc recipients>"],
  "bodyText": "<plain text body — truncate at 4000 chars if very long, preserving the beginning>",
  "hasAttachments": true | false,
  "attachmentNames": ["<filename>"],
  "threadId": "<conversation/thread id if available>",
  "folder": "inbox" | "sent"
}
```

Do not include calendar items, meeting acceptances, automated delivery receipts, or out-of-office auto-replies unless the body contains substantive content from a human.

---

## Step 3: Write to repo

Write output to: `data/abivax/emails_staging/`

Create two files:

**File 1: `data/abivax/emails_staging/emails_<YYYY-MM-DD>.json`**
An array of all email objects pulled in this run, in reverse chronological order (newest first).

**File 2: `data/abivax/emails_staging/ingest_index.json`**
```json
{
  "lastRunAt": "<ISO timestamp>",
  "windowStart": "<ISO timestamp>",
  "windowEnd": "<ISO timestamp>",
  "totalEmails": 0,
  "receivedCount": 0,
  "sentCount": 0,
  "files": ["emails_<YYYY-MM-DD>.json"]
}
```

---

## Step 4: Update ingest watermark

After a successful write, update (or create) `data/abivax/email_ingest_state.json`:
```json
{
  "lastPulledAt": "<ISO timestamp of this run's windowEnd>",
  "lastRunFile": "emails_<YYYY-MM-DD>.json"
}
```

---

## Step 5: Do not analyze or modify anything else

Do not touch `pillar_synthesis.json`, `erp_pillar_baselines.json`, page components, or any other data files. Do not attempt to categorize or tag emails. The staged files will be handed off to a Claude session for analysis.

Log any errors (auth failures, partial pulls, malformed messages) to `data/abivax/emails_staging/ingest_errors.json` rather than failing silently.

---

## Done

When complete, confirm:
- How many emails were pulled (received / sent breakdown)
- The ingest window used
- File paths written
- Any errors encountered
