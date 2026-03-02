# Audit Committee ERP Controls Deck — Copy Review
**Deck:** `outputs/Audit_Committee_ERP_Controls_Mar2026.pptx`
**Reviewed:** 2026-03-02 | **Meeting target:** 2026-03-06 (4 days)
**Queue item:** Review pass against 3 open data gaps + narrative integrity

---

## Verdict: Narrative Holds. Four Issues Need Resolution Before Delivery.

The deck's arc is sound — posture → gaps → target model → governance → ask. The four audit committee asks on slide 6 are specific, owned, and appropriately assertive. You can walk into the March 6 meeting with the current narrative if the four items below are addressed.

---

## What's Solid (Don't Change)

- **Slide 2 posture numbers:** 143, 45, 9 are all consistent with pillar_synthesis.json. ✓
- **Slide 3 gap columns:** The key gaps listed for each pillar accurately reflect the pillar_synthesis control environment narratives. ✓
- **Slide 4 target principles:** All four design requirements are grounded in the control environment and defensible to an audit committee. ✓
- **Slide 5 governance framework:** Single Deficiency Register + weekly cadence + milestone checkpoints + escalation protocol — all appropriate. ✓
- **Slide 6 asks:** Clear, owner-attributed, and connected to the governance framework on slide 5. ✓
- **Slide 5 open data gaps callout:** Already flagged in the deck. No need to hide this — the committee will appreciate the transparency.

---

## Four Issues to Resolve

### Issue 1 — Terminology conflict: "in scope" vs. "out of scope" (Slide 3)
**What the deck says:** Each pillar card labels its control count as "controls in scope" — 20/39/84.
**The problem:** 20+39+84 = 143, which is the *total* CFTI register, including the 45 out-of-scope controls called out on slide 2. An audit committee member will catch this and ask whether the pillar counts are pre- or post-exclusion.
**Fix:** Relabel the pillar counts from "controls in scope" → "CFTI controls reviewed" or "controls assessed." One-word change per pillar card. No data changes needed.

---

### Issue 2 — "60 Ongoing or Design-Phase" figure needs verification (Slide 2)
**What the deck says:** One of the four headline stats is "60 / Ongoing or Design-Phase."
**The problem:** This number doesn't reconcile with pillar_synthesis.json data. Summing ongoing + design-to-complete across all three pillars yields: P2P (9 ongoing + 0 design) + Reporting (18 ongoing + 11 design) + Controls (25 ongoing + 27 design) = 90. If "ongoing only" it's 52. Neither produces 60. The source of this figure is unclear.
**Fix:** Verify the 60 against the CFTI tracker before the meeting. If it can't be confirmed with a source, replace the stat or relabel it as "active remediation tracking" with the correct number. Don't present an unverifiable headline number to an audit committee.
**Who to check with:** Adrian or CFTI (Walid/Youness).

---

### Issue 3 — "9 ERP-Addressable Signals" may undercount on cross-pillar inspection (Slide 2 vs Slide 3)
**What the deck says:** Slide 2 headline: "9 ERP-Addressable Signals" (program total). Pillar_synthesis data: P2P has 5 ERP-signal controls identified, Reporting has 2, Controls/Audit has 9 noted as the program span.
**The problem:** If a committee member adds up ERP-signal controls by pillar from the deck's own gap slide, they'll get a different number than the headline 9. The pillar_synthesis note clarifies that "9 ERP-signal controls span P2P and FSCP" (meaning the 9 is the cross-pillar program-level count, not additive) — but that logic isn't explained in the deck.
**Fix (low-effort):** Add a single parenthetical to the slide 2 stat: "9 ERP-Addressable Signals (across P2P and FSCP pillars)." Removes the ambiguity without restructuring anything.

---

### Issue 4 — Meeting date still showing as TBD on slide 6 footer (Urgent)
**What the deck says:** Slide 6 footer: "Meeting: March 2026 (date TBD with Camille)"
**The problem:** It's March 2. If the meeting is March 6, that's 4 days out. If slides need to be distributed to committee members in advance (typical: 48-72 hrs), they need to go out by end of March 4 at the latest.
**Fix:** Confirm date and time with Camille today. Update footer on slide 6. Ask her whether she needs the deck distributed to committee members in advance and in what format (email attachment vs. portal upload).

---

## Three Open Data Gaps — Status and Recommended Handling

### Gap 1: Audit Committee Meeting Date (Camille Girard)
**Status:** Unfilled. Slide 5 and slide 6 both reference TBD.
**Recommended ask to Camille (today):**
> "Can you confirm the March Audit Committee date and time? Also — do you need the deck sent to committee members in advance, and if so, by when and in what format?"
**If confirmed before March 4:** Update slide 6 footer and remove gap from slide 5 callout box.
**If not confirmed by March 4:** Leave the gap callout on slide 5 as-is. It's honest and appropriate.

---

### Gap 2: Commercial / Timeline Package (NetSuite)
**Status:** Unfilled. Slide 5 references an "updated SAP vs. NetSuite financial comparison and timeline elements requested by Camille."
**Reframing note:** At this point the SAP comparison is backward-looking. What the committee actually wants is the *implementation timeline* — April mobilization → blueprint → build → go-live Jan 1, 2027. If the commercial package isn't available, a one-line placeholder on slide 5 is better than silence:
> "Implementation timeline pending commercial terms confirmation (target: April 2026 mobilization)."
**Recommended ask (by March 4):** Contact NetSuite (Hema owns this) for at minimum the high-level implementation milestone map, even if commercial terms are still in negotiation. A rough timeline is more useful to the committee than nothing.
**If not available:** Replace "commercial/timeline package" gap reference on slide 5 with an explicit note: "Implementation timeline to be presented at March 19 Board meeting as commercial terms are confirmed."

---

### Gap 3: Adrian's 3-Slide Controls Pack
**Status:** Unfilled. Slide 5 references an "overview/timeline/financials pack" requested by Adrian.
**Recommended ask to Adrian (by March 3):**
> "I need three slides from you for the March 6 Audit Committee deck. Specifically: (1) current deficiency summary — what we know now, (2) the 9 ERP-signal controls mapped to named owners and dated commitments, (3) recommended escalation language if any items are at risk. One slide each. Simple format. I can provide a template if useful — just let me know."
**If not received by March 5:** The deck's existing gap callout on slide 5 handles this well. Don't force his content in at the last minute without review.

---

## Summary: What to Do Today

| Action | Owner | Deadline |
|--------|-------|----------|
| Confirm meeting date/time + distribution instructions | Mike → Camille | Today, March 2 |
| Verify "60 ongoing/design-phase" stat against CFTI tracker | Mike → Adrian or CFTI | March 3 |
| Brief Adrian on his 3-slide pack requirements | Mike → Adrian | March 3 |
| Confirm if NetSuite can provide implementation milestone map | Mike → Hema → NetSuite | March 3 |
| Fix slide 3 "in scope" → "CFTI controls reviewed" label | Mike or Codex | After Camille confirms |
| Add parenthetical to slide 2 "9 ERP-Addressable Signals" stat | Mike or Codex | After Camille confirms |
| Update slide 6 footer with confirmed meeting date | Mike or Codex | After Camille confirms |

---

## Bottom Line

Four days is enough time to close these items if the Camille and Adrian asks go out today. The core narrative doesn't need restructuring — slides 1-4 and 6 are ready. Slide 5 is already honestly labeled as a gap holding area. The biggest delivery risk is not the content — it's the distribution timeline. Confirm with Camille today.
