# Context Window Protocol

Last updated: 2026-03-23

## Core rule

Only one AI context window should be treated as active at a time.

Practical meaning:

- When Mike is working with Codex, Codex is the active execution window.
- When Mike switches to Claude, Claude becomes the active execution window.
- Do not bounce back and forth casually.
- A switch should happen only when there is a defined handoff artifact or a new external trigger.

## Why this exists

Without an explicit switch rule, Mike has to remember:

- what each AI has already seen
- whether Outlook/Desktop changes were promoted into the repo
- whether the other AI is operating on stale context

That creates exactly the friction and paranoia Mike is trying to eliminate.

## Active window states

### Codex-active

Use when work depends on:

- Outlook inbox / sent access
- local desktop files
- attachment capture / archival
- repo edits
- canonical data updates
- verification of what is actually current

### Claude-active

Use when work primarily depends on:

- synthesis
- drafting
- strategy wording
- decision memo language
- working from already-promoted repo context

## Required condition before switching from Codex to Claude

Codex should not hand off to Claude until all of the following are true:

1. Outlook/Desktop refresh work needed for the current task is done.
2. Important new files are either:
   - promoted into the repo, or
   - explicitly marked as staged-only in `data/abivax/document_intake_queue.json`.
3. `data/abivax/current_context.json` reflects the current source snapshot boundary.
4. A Claude prompt exists that names the exact files and context window to use.
5. Codex has written down any unresolved risks or gaps that Claude must know before starting.
6. If Mike may not return to the current Codex window, Codex should prefer a full repo sync to remote rather than a narrow partial push.

If those conditions are not met, the switch is premature.

## Rule after switching to Claude

Once Mike switches to Claude, do not return to Codex unless one of these happens:

1. **New external trigger**
   - A new email arrives
   - A new attachment appears
   - A new desktop/source-system file appears
   - Mike learns new facts outside the repo

2. **Claude blocker**
   - Claude determines that required context is missing from the repo
   - Claude needs Outlook/Desktop/local-file access
   - Claude needs a repo/code/data change before continuing

3. **Explicit user redirection**
   - Mike decides to abandon the current Claude path and reopen Codex as the active window

## Re-entry protocol: Claude -> Codex

If Claude is active and a new source-system event happens:

1. Claude finishes the current thought/unit of work cleanly.
2. Claude writes a short Codex handoff note containing:
   - what Claude was doing
   - what new trigger occurred
   - what Codex must refresh or ingest
   - what files Claude was relying on
3. Mike syncs Claude's repo state on Claude's machine.
4. Mike returns to Codex and says, in substance:
   - `Read the latest Claude handoff, refresh source-system context, and continue from there.`
5. Codex becomes the active window again.

## Re-entry protocol: Codex -> Claude

After Codex ingests the new source-system event:

1. Codex updates:
   - `data/abivax/current_context.json`
   - relevant archived files / canonical summaries
   - the new Claude prompt or handoff artifact
2. Codex tells Mike the switch point is clean again.
3. Mike returns to Claude with the new prompt.

## Minimal handoff package

At every intentional switch, the receiving AI should be able to rely on this package:

- `collab/shared/CURRENT_OPERATING_BRIEF.md`
- `collab/shared/SOURCE_SYSTEM_FLOW.md`
- `collab/shared/CONTEXT_WINDOW_PROTOCOL.md`
- `data/abivax/current_context.json`
- `data/abivax/document_intake_queue.json`
- `data/abivax/thread_registry.json`
- one task-specific prompt for the receiving AI

If that package is not sufficient, the handoff is not clean yet.

## Remote sync rule

For ordinary small iterations, a selective commit may be acceptable.

For a true context-window handoff, especially when Mike may not return to the current window:

- prefer syncing the full repo state to remote
- do not assume Mike will remember which local-only changes were intentionally left behind
- optimize for the next AI window seeing the same repo state Mike just left

The burden should be on Codex to make the handoff state explicit and complete, not on Mike to clarify that later.

## Mike rule of thumb

Ask one question before switching:

- `If I stop talking to the current AI right now, can the next AI do useful work for hours without me reconstructing context from memory?`

If the answer is no, the switch should not happen yet.
