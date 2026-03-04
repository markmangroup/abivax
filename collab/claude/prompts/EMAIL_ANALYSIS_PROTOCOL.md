# Claude Email Analysis Protocol
**Lane:** Claude analysis
**Triggered by:** Codex completing `email-triage.md`
**Input:** `data/abivax/emails_staging/triage_<YYYY-MM-DD>.json`
**Outputs:** Action manifest + individual deliverables as needed

---

## How to invoke

Tell Claude:
> "Run the email analysis protocol against `data/abivax/emails_staging/triage_<date>.json`"

Or more simply:
> "Run email analysis" — Claude will find the most recent triage file automatically.

---

## Step 0: Load context

Before reading any emails, load the following (in order):

1. `CLAUDE.md` — current sprint, key people, open data gaps
2. `collab/claude/MIKE_NORTH_STAR.md` — strategic lens
3. `data/abivax/claude_lane_queue.json` — currently open tasks
4. `data/abivax/emails_staging/triage_<date>.json` — the triage manifest

This ensures every email is interpreted against live program context, not in isolation.

---

## Step 1: Triage scan (30-second overview)

Before going email by email, do a fast scan and output a brief header summary:

```
EMAIL ANALYSIS — <date>
<N> emails to review  |  <N> action-required  |  <N> external-requests  |  <N> data-gap fills
Noise excluded: <N>
```

Then list any `urgent` or `deadline`-flagged emails first with a one-line note each.
This gives Mike the "do I need to stop what I'm doing" signal immediately.

---

## Step 2: Process each non-noise email

Work through emails in this priority order:
1. `urgent` flag first
2. `action-required` type
3. `external-request` type
4. `deliverable-received` type
5. `deadline` flag
6. Everything else

For each email, determine which of the following applies and execute accordingly:

---

### 2A — Draft reply needed

**Trigger:** `suggestedAction: draft-reply` OR email is `action-required` / `external-request`

**What to do:**
- Draft a reply in Mike's voice (fact-based, direct, no fluff — see MIKE_NORTH_STAR.md)
- Keep it short unless the situation requires detail
- Flag any facts you're uncertain about rather than inventing them
- Save draft to: `collab/claude/outputs/drafts/<date>_reply-<sender-last-name>.md`
- In the action manifest, mark as: `DRAFT READY — review collab/claude/outputs/drafts/...`

Do NOT write "I hope this email finds you well" or any filler. Mike hates that.

---

### 2B — Data update needed

**Trigger:** `suggestedAction: update-data` OR `data-gap-fill` flag present

**What to do:**
- Identify which JSON file(s) need updating (pillar_synthesis.json, entities.json, etc.)
- Do NOT modify them directly (unless Mike explicitly asked Claude to own data)
- Instead, write a clear instruction block in the action manifest:
  ```
  DATA UPDATE NEEDED
  File: data/abivax/pillar_synthesis.json
  Field: governance.kpmgYear1Cost
  Current value: "~$1M assumption (placeholder)"
  New value: "EUR 650,000 (sourced from Camille email <date>)"
  Confidence: high
  Tell Codex: update pillar_synthesis.json per above
  ```
- If the update is to `CLAUDE.md` facts (key people, open gaps), note it separately

---

### 2C — Todo action

**Trigger:** `suggestedAction: create-todo` or `close-todo`

**What to do:**

For **create-todo**: write a structured entry:
```
NEW TODO
Title: <concise action title>
Owner: Mike | Codex | Claude
Source: <email subject, sender, date>
Deadline: <if mentioned>
Context: <one sentence>
Suggested queue: claude_lane_queue | codex backlog
```

For **close-todo**: identify the matching open item in `claude_lane_queue.json` and note:
```
CLOSE TODO
Queue item ID: <id>
Reason: <email confirms completion — one sentence>
Tell Codex: close item <id> in claude_lane_queue.json
```

---

### 2D — Deliverable received (attachment or document)

**Trigger:** `suggestedAction: update-data` + `hasAttachments: true` OR `deliverable-received` type

**What to do:**
- Note the attachment and what it likely contains
- If it's a PPTX, PDF, or spreadsheet relevant to the program, flag for Codex ingestion:
  ```
  ATTACHMENT TO INGEST
  File: <filename>
  From: <sender>
  Likely content: <what it probably contains based on subject/context>
  Tell Codex: ingest attachment from inbox_assets/<date>-<sender>/
  ```
- If Claude can read it directly (the file exists in inbox_assets), read it and extract key facts inline

---

### 2E — Scheduling

**Trigger:** `scheduling` type

**What to do:**
- Confirm or flag based on calendar context from `data/abivax/meetings.json`
- Check for conflicts with known hard dates (Board Mar 19, Audit Cmte Mar 6, etc.)
- Note in action manifest as:
  ```
  SCHEDULING
  Subject: <meeting name>
  Date/time: <proposed>
  Conflict check: <clear | conflict with <event>>
  Suggested action: <accept | decline | propose alternative>
  ```

---

### 2F — File only

**Trigger:** `suggestedAction: file-only` OR `internal-update` with no action flags

Acknowledge with one line in the action manifest. No further work needed.

---

## Step 3: Write the action manifest

Save to: `collab/claude/outputs/email-analysis-<YYYY-MM-DD>.md`

Structure:

```markdown
# Email Analysis — <date>
Generated: <timestamp>
Source: triage_<date>.json (<N> emails)

## Urgent / Needs attention now
<list any urgent or deadline items with one-line summary each>

## Draft replies ready
<list with link to draft file for each>

## Data updates for Codex
<list of DATA UPDATE NEEDED blocks>

## Todos
### Open new
<list of NEW TODO blocks>
### Close
<list of CLOSE TODO blocks>

## Attachments to ingest
<list of ATTACHMENT TO INGEST blocks>

## Scheduling
<list of SCHEDULING blocks>

## Filed (no action)
<count + one-liner list>

## What Mike needs to do
<bulleted list of the actual things Mike needs to personally do — replies to send, decisions to make, etc. Keep this tight — this is the executive summary Mike reads first>
```

The last section ("What Mike needs to do") is the most important. It should be scannable in under 30 seconds. No more than 7 items. If there are more, prioritize by urgency and deadline.

---

## Step 4: Update NEXT_PROMPT.md

Append a brief session log entry to `collab/claude/prompts/NEXT_PROMPT.md`:

```markdown
## Email analysis — <date>
- Ran against triage_<date>.json
- <N> action items identified
- <N> draft replies saved
- <N> data updates queued for Codex
- Key items: <2-3 sentence summary of anything important Mike should know at next session start>
```

---

## Boundaries for this protocol

Claude should NOT:
- Send or forward emails
- Directly modify canonical JSON data files (flag for Codex instead)
- Make commitments on Mike's behalf in draft replies
- Invent facts to fill gaps in a draft — mark as `[CONFIRM: ...]` instead

Claude SHOULD:
- Be specific and direct — no vague "consider following up" notes
- Use existing program context (key people, open gaps, deadlines) to interpret email significance
- Surface things Mike would want to know even if they weren't the main point of an email
- Note when an email contradicts something in the existing program data

---

## Trigger phrase shortcut

Any of the following tells Claude to run this protocol:

- "Run email analysis"
- "Check the emails"
- "What came in?"
- "Email pass"

Claude will find the most recent `triage_<date>.json` file automatically.
