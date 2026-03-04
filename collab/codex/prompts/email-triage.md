# Prompt: Email Triage → Structured Manifest for Claude Analysis
**ID:** `email-triage`
**Lane:** Codex execution → Claude analysis
**Depends on:** `email-ingest` having run first (staged emails present in `data/abivax/emails_staging/`)
**Output consumed by:** Claude session running `EMAIL_ANALYSIS_PROTOCOL.md`

---

## Purpose

Codex has Outlook access. Claude does not. Codex can read and classify emails;
Claude can interpret meaning, draft responses, and decide on actions.

This prompt bridges the two: Codex reads the staged emails and produces a
structured triage manifest that Claude can fully act on without needing Outlook.

Do NOT attempt to interpret tone, draft responses, or decide what Mike should do.
That is Claude's job. Your job is accurate classification, extraction, and linkage.

---

## Step 1: Locate the latest staged email file

Read `data/abivax/emails_staging/ingest_index.json`.
Find the most recent file listed under `files`.
Load that file (array of email objects).

If no staged file exists, stop and report: "No staged email file found. Run email-ingest first."

---

## Step 2: For each email, classify it

Apply the following classification rules. Each email gets exactly ONE primary type
and optionally one or more secondary flags.

### Primary types

| Type | When to use |
|------|-------------|
| `action-required` | Email clearly requires Mike to do something: reply, decide, approve, send something, attend |
| `external-request` | An external party (vendor, advisor, counterparty) is asking for something specific |
| `internal-update` | An internal team member is sharing status, a document, or information with no explicit ask |
| `deliverable-received` | Someone sent Mike a document, deck, data file, or attachment that may update program data |
| `thread-reply` | A reply in an ongoing thread — no new ask, but may contain new facts |
| `scheduling` | Meeting invite, reschedule, cancellation, or availability request (substantive ones only) |
| `noise` | Automated, marketing, legal boilerplate, system alerts with no program relevance |

### Secondary flags (apply any that fit)

| Flag | When to use |
|------|-------------|
| `deadline` | Email mentions a specific date as a deadline or hard cutoff |
| `financial` | Contains a number, quote, invoice, budget figure, or commercial term |
| `decision` | A decision has been made or is being requested |
| `new-contact` | An unfamiliar person appears who may be relevant to track |
| `data-gap-fill` | Content appears to answer a known open data gap in the program |
| `risk` | Raises a potential problem, blocker, or concern |
| `urgent` | Sender marks urgent, or content implies time pressure within 48 hours |

---

## Step 3: Extract structured facts per email

For each email, extract:

```json
{
  "emailId": "<message id from staged file>",
  "date": "<ISO timestamp>",
  "direction": "received | sent",
  "subject": "<subject>",
  "from": "<name>",
  "to": ["<names>"],
  "primaryType": "<type from Step 2>",
  "flags": ["<flags from Step 2>"],
  "oneSentenceSummary": "<what this email is about in plain English — max 20 words>",
  "keyFacts": [
    "<extract any specific dates, amounts, names, decisions, or commitments — one item per entry>"
  ],
  "linkedPillars": ["<governance|p2p|reporting|finance-close|controls — only if clearly relevant>"],
  "linkedEntities": ["<entity IDs from entities.json if a known person/system is mentioned>"],
  "attachments": ["<filenames if hasAttachments is true>"],
  "suggestedAction": "<one of: draft-reply | forward-to-team | update-data | create-todo | close-todo | file-only | no-action>"
}
```

Rules for `suggestedAction`:
- `draft-reply` — email requires a response from Mike
- `forward-to-team` — email is directed at Mike but should go to someone else
- `update-data` — email contains facts that should update a JSON data file
- `create-todo` — email implies a new task that isn't tracked
- `close-todo` — email indicates a previously open item is now resolved
- `file-only` — useful to have on record but no action needed
- `no-action` — noise/automated, safe to ignore

---

## Step 4: Produce the triage manifest

Write one file:

**`data/abivax/emails_staging/triage_<YYYY-MM-DD>.json`**

```json
{
  "generatedAt": "<ISO timestamp>",
  "sourceFile": "<emails_YYYY-MM-DD.json>",
  "totalEmails": 0,
  "byType": {
    "action-required": 0,
    "external-request": 0,
    "internal-update": 0,
    "deliverable-received": 0,
    "thread-reply": 0,
    "scheduling": 0,
    "noise": 0
  },
  "flagCounts": {
    "deadline": 0,
    "financial": 0,
    "decision": 0,
    "data-gap-fill": 0,
    "risk": 0,
    "urgent": 0
  },
  "emails": [
    /* one entry per email per Step 3 schema above */
  ]
}
```

Exclude `noise`-typed emails from the `emails` array — they do not need Claude's attention.
Include a `noiseCount` field at the top level with the count of excluded emails.

---

## Step 5: Check against known open data gaps

Read `data/abivax/pillar_synthesis.json`. Find any entries where `dataGap: true` or
`confidence` is below 0.7.

For each such gap, scan the triage manifest emails and check if any `keyFacts` appear
to fill it. If so, set `"data-gap-fill"` in that email's flags and note which gap in
`keyFacts` (e.g., `"Fills gap: KPMG Year 1 commercial figure"`).

---

## Step 6: Do not do anything else

Do not:
- Draft responses
- Modify any JSON data files
- Update `pillar_synthesis.json` or `erp_pillar_baselines.json`
- Create todos
- Send or forward any emails

All of the above are Claude's job in the next session.

Log any classification errors or ambiguous emails to a `triageErrors` array at the
top of the manifest.

---

## Done

Report:
- Total emails triaged (breakdown by type)
- How many flagged as `action-required` or `external-request`
- How many potential `data-gap-fill` matches found
- File path written
- Tell Mike: "Run Claude email analysis: read `collab/claude/prompts/EMAIL_ANALYSIS_PROTOCOL.md` and execute against `data/abivax/emails_staging/triage_<date>.json`"
