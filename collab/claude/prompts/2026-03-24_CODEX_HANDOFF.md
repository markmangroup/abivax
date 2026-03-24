# Codex Handoff — 2026-03-24

**Read `collab/shared/CODEX_DAILY_ROUTINE.md` first. That file is the standing instruction set.**

This file adds today's specific context on top of the routine.

---

## What Claude did yesterday / this morning (2026-03-23 → 2026-03-24)

- Read and verified all source documents directly (NetSuite SOW v3, CFGI combined proposal, estimates, Oracle feedback file)
- Fixed three bugs in the app (people.json missing fields, spine redirect, Today page React crash)
- Wrote vendor email drafts and May 21 backward plan: `collab/claude/outputs/2026-03-23_vendor-followups-and-may21.md`
- Committed all changes (commit `40c76c7`) — **not yet pushed to GitHub (VM network restriction)**

**Mike needs to push from his machine before Codex pulls:**
```
git push origin main
```

---

## What to specifically check today

### Oracle / NetSuite thread
- Last inbound: 2026-03-20 (Jamal — SOW v3 + estimates + CVs + Oracle Feedback File)
- Last outbound: none yet
- **SOW validity expires March 30, 2026 — one week from yesterday**
- Check for any new reply from Jamal or Oracle team since March 20

### CFGI thread
- Last inbound: 2026-03-19 (Jean-Arnold — combined advisory proposal)
- Last outbound: none yet
- Check for any new reply from CFGI since March 19

### Reference call thread (Efeso / Laure Tchervenkov)
- Last inbound: 2026-03-23 09:27 (Laure replied — "Re: Prise de référence - NetSuite")
- Check if any follow-up came in since then
- This is a NetSuite reference check — document any substantive content

### Any other new inbound relevant to the program

---

## What to tell Claude after sync

Once pushed, Claude's task is:
- Review any new Oracle, CFGI, or reference call content
- Update the vendor email drafts if new information changes what Mike should say
- Keep working on the May 21 backward plan if needed
- The two email drafts in `collab/claude/outputs/2026-03-23_vendor-followups-and-may21.md` are ready for Mike to send — flag if anything from the new emails changes that

---

## Files Claude should read at start of next session

- `collab/shared/CODEX_DAILY_ROUTINE.md`
- `collab/shared/CURRENT_OPERATING_BRIEF.md`
- `data/abivax/current_context.json`
- `data/abivax/thread_registry.json`
- This file (`collab/claude/prompts/2026-03-24_CODEX_HANDOFF.md`)
- Whatever Codex writes as the Claude handoff after today's sync
