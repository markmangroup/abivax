# Vendor Follow-ups and May 21 Backward Plan

Date: 2026-03-23
Author: Claude
Source documents read directly: SOW UK-246384 v3 (17-03-2026), Estimate 1782085 (license/PS V2), Estimates 1786449 (NSAW), 1786499 (NSIP), 1786458 (ACS Monitor 36), CFGI_Abivax_NS_Advisory_Proposal_03.19.26vF.pdf, ABIVAX Oracle Feedback File.docx, thread_registry.json, consultant_reviews.json, CURRENT_OPERATING_BRIEF.md

---

## Pre-draft flag (verified from source, not Codex summary)

**SOW valid through March 30, 2026. All subscription estimates valid through March 31, 2026.**

This is one week from today. You are not obligated to sign this week, but if you do not, Oracle will need to reissue the documents. The Oracle Feedback File (sent March 20) is a blank formal contract-comment template — currently no Abivax comments entered. It is the official vehicle for any commercial or legal feedback on the SSA and estimate terms.

Decision you need to make before sending the Oracle email:
- Sign as-is and get to kickoff (fastest path)
- Ask for a short extension while you finalize CFGI alignment and scope confirmations
- Use the Feedback File to raise specific commercial questions before signing

The draft below assumes you want to acknowledge the deadline, keep momentum, and ask for one focused conversation this week before committing — without being evasive about your intent to move forward.

---

## 1. Oracle / NetSuite reply draft

**To:** jamal.azil@oracle.com
**CC:** Laurent Bailly, Venceslas dEchallens, Vincent Gehanno
**Subject:** RE: ABIVAX NetSuite Implementation | Customer Side support Team

Jamal,

Thank you for the March 20 package. We have reviewed the SOW, estimates, and team CVs.

We want to move forward. Given the March 30 SOW validity date, can you send me the correct signing sequence for the full commercial package this week — the SOW plus the four estimates — so we execute in the right order before anything lapses?

One thing I also need confirmed before we sign: who is the named implementation lead accountable for this engagement through UAT and go-live?

Happy to do a quick call this week if that is easier.

Best,
Mike

---

## 2. CFGI reply draft

**To:** jacoutareau@cfgi.com
**CC:** kschatz@cfgi.com, adepoy@cfgi.com, hema.keshava@abivax.com
**Subject:** RE: CFGI Support Proposal for Abivax NetSuite Program

Jean-Arnold,

The March 19 proposal is the right model and I want to move forward with it.

To confirm: NetSuite owns delivery as SI. CFGI is the independent advisory layer — Walid and Youness on Paris PMO and coordination, Ken and Brad on US technical oversight, Angela and Ashley on controls-by-design. One combined engagement reporting to me and Hema.

Two things I need to close this week: what is the contract path to formalize this engagement, and when can Walid and Youness be active in-program if we sign in the next two weeks?

Best,
Mike

---

## 3. May 21 backward plan

Working backward from the May 21, 2026 board meeting. The board already gave oral support for the path. The job between now and May 21 is to convert that oral support into visible execution evidence.

- **By March 30:** Resolve Oracle commercial questions and confirm signing sequence. Either execute or formally request an extension with a commitment date. Unresolved by March 30 = documents lapse and timeline slips.
- **By April 4:** NetSuite SOW and license orders signed. CFGI engagement letter executed or in final review.
- **By April 11:** NetSuite kickoff completed. CFGI Stage Gate 1 (project initiation, Week 3) scheduled. Named delivery lead confirmed in writing.
- **By April 30:** Design/personalization sessions underway (NetSuite onsite, Paris). CFGI Gate 2 milestone date set. Walid and Youness active in-program. At least one governance report produced.
- **By May 7:** CFGI Gate 1 memo delivered. First status report from NetSuite project manager issued. Data migration templates in Abivax's hands and cleansing started.
- **By May 14:** At minimum: proof that design is tracking to phase-1 scope (finance-first, Jan 1, 2027). CFGI independent assessment of early-design health available or in draft. At least one reference call completed and documented (Laure Tchervenkov / Efeso replied this morning — follow up).
- **By May 21 (board meeting):** Board-ready update showing: signed contracts, kickoff completed, design phase underway, independent advisory active, no scope creep in phase 1, CFGI stage-gate discipline in place, data migration started. This is not a strategy deck — it is an execution credibility deck.

**Key outside-party dependencies that could block May 21 evidence:**
1. Oracle — commercial sign-off and named lead confirmation (this week)
2. CFGI — engagement letter execution (this week / next)
3. NetSuite delivery team — showing up with the right people and starting design on schedule (April)
4. Hema — needs to be aligned on both contracts before execution, and should be the license admin of record (her email is already on the Oracle provisioning order)
5. Reference calls (Efeso / Laure) — a real reference response, documented and positive, is useful board evidence

---

## 4. What Codex should do next

No immediate Codex handoff required unless one of the following triggers occurs:

1. Mike sends or receives emails that need to be ingested into the thread registry (new Oracle or CFGI replies, reference call summary, etc.). If that happens, run a targeted local Outlook refresh and update thread_registry and current_context.
2. The Oracle estimates are signed — the license estimate (1782085) and SOW need to be added to document_registry with status `executed` and their commercial figures promoted into budget.json.
3. CFGI engagement letter is received — archive and canonicalize the same way the March 19 CFGI package was handled.

One legitimate open data gap surfaced from reading the source directly: the license estimate V2 has a total subtotal of **€544,935.50/year** for subscriptions (pages 1–3 of Estimate 1782085). This number has not been explicitly verified in budget.json or pillar_synthesis.json. Codex should confirm whether that figure is currently represented correctly in the canonical financial data.
