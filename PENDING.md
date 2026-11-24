# PENDING.md — open work and open decisions (operacions)

Single entry point for a cold-start agent: everything still to build and every decision still owed by David,
as of **2026-11-23** (after agent A's deliveries 18–22 and the FS detail, merged by ZIP on 21–22/11). Each item points to the document that holds the detail;
where this file and a state document disagree, the state document wins (it records later decisions).
Update this file in the same commit as any change that closes, adds or reorders an item.

Working rules that apply to every item (from `CLAUDE.md` and David's standing preferences): speak Catalan to
David; agent-facing MD in English; step by step, human in the loop; for ≥ 5 decision points use a review
artifact with autosave; ask (question dialog) before opening and before merging each PR; never put
«[skip ci]», «[ci skip]» or «[cf-pages-skip]» in a commit message; run the repo tests before delivering.
UX priority devices: touch Chromebook (1366×768), Lenovo laptop, Android tablet, iPad (1024×768, 820×1180);
the phone comes last.

## 1. Roadmap deliveries not started (`docs/activitats/STATE.md`, «Pending items»)

Order is David's; he may reorder («Item order: free to change»). Each new page follows «How an activity is
built» in `docs/activitats/STATE.md` (theme class, CSS chain, index entry, `js/exercise-codes.js`, sitemap,
`tests/run-all.js`, README/CONTRIBUTING/PROJECTS-TECHNICAL-REFERENCE/STATE). Batxillerat pages: no code.

| # | Item | David's words | What it is |
|---|---|---|---|
| ~~18~~ | ~~Integrals, wave 2~~ | — | **DONE 2026-11-21** (agent A): `integrals.html?tipus=quasi`, `js/integrals/quasi-bank.js`; see `docs/activitats/STATE.md`. Waves 1, 3, 4 only if David asks. |
| ~~19~~ | ~~Estudi d'una funció~~ | — | **DONE 2026-11-21** (agent A): `estudi-funcio.html` (`?funcions=polinomiques`, `racionals` or `pau`), shared widgets `js/passos/taula-signes.js` (sign table, field type `taula`) and `js/passos/esbos-funcio.js` (sketch, ported from `step-quiz/pau`); #22 can reuse the sign table. See `docs/activitats/STATE.md`. |
| ~~20~~ | ~~Binomial~~ | — | **DONE 2026-11-21** (agent A): `binomial.html` (`?tipus=exacte`, `directe` or `contrari`), `js/binomial/`; `pas.tolerancia` for decimal fields in `js/passos/correccio.js`. No mean/σ (David, 21/11). See `docs/activitats/STATE.md`. |
| ~~21~~ | ~~Complexos~~ | — | **DONE 2026-11-21** (agent A): the «Potència» tab became two tabs, «Forma polar» and «Potències i arrels» (`complexos.html?pestanya=polar` or `potencies`), `js/complexos/polar*.js`, `pla-complex.js`. See `docs/activitats/STATE.md`. |
| ~~22~~ | ~~Logaritmes i equacions no lineals~~ | — | **DONE 2026-11-21/22** (agent A): 22a `logaritmes.html` block 1 logarithms (Batx, no code, `LG` reserved); 22b block 2 equations (`?tipus=equacions|basiques|mitjanes|irracionals`); 22c quadratic and rational inequalities as new types of `inequacions.html` (`?tipus=no-lineals|segon-grau|racionals|especials`, code IQ; the code's D field tells the type and level, see `js/exercise-codes.js` `ETIQUETES_DIFICULTAT`). See `docs/activitats/STATE.md`. |

**Decisions owed before each of them:** levels, step design, errors, UI. Ask with a review artifact (as for
#16 and #17), not by guessing.

## 2. Leftovers of finished deliveries

| From | Item | Status / decision owed |
|---|---|---|
| ~~#16 Fórmules STEAM~~ | ~~Board stage 2: «Vull més detall»~~ | **DONE 2026-11-22** (decision 22, `docs/pissarra/STATE.md`). |
| #16 Fórmules STEAM | **P2**: the board's flying animation inside the activity (instead of only colouring what moves) | David: «més endavant». Needs an exception to decision 14 (activity and board are independent); ask first. |
| #16 Fórmules STEAM | **E1**: real student errors to add to the error taxonomy | Waiting for David to send cases from class. |
| ~~#17 Inequacions~~ | ~~**U2**: the «Resolució pas a pas» board for first-degree inequalities~~ | **DONE 2026-11-23** (`resolucio.html?activitat=inequacions`, `js/inequacions/resolucio.js`; `docs/pissarra/STATE.md` «Scenario B for `inequacions`»). Waiting for David to try it. |
| #17 Inequacions | U4 listed «llegir 5 > x com x > 5»: the flip is automatic (P4), so the student never types it | Nothing to do unless David wants that step back. |

## 2b. «Cilindres amb un full» (David, 2026-11-23) — ACTIVITY BUILT 2026-11-23; BOARD BUILT 2026-11-24

David's statement: take a 21 cm × 30 cm rectangle (an A4 sheet) and roll it into a cylinder in the two possible
ways; compare the volumes V₁ and V₂. **Decided 2026-11-23 (question dialog):**
- **Model: the side becomes the circumference of the base** (rolling the sheet), not the diameter:
  2πr = 21 → r = 21/(2π), V₁ = π r² h = 21²·30/(4π) ≈ 1 052,8 cm³; V₂ = 30²·21/(4π) ≈ 1 504,0 cm³
  (V₂/V₁ = 30/21: the wider cylinder always holds more). David first wrote «diàmetre»; the agent pointed out
  that rolling makes the side the circumference and he chose that model.
- **Both an activity (scenario A) and a «Resolució pas a pas» board (scenario B)**, like Fórmules STEAM.
- **Sizes:** the first exercise is the A4 sheet (since 2026-11-24 the real DIN A4, 21 × 29,7: with 21 × 30 the litres were 1,0515 and 1,50108, too many 5s, David); the following ones, other rectangles.
- **What is asked at the end:** which cylinder has more volume; both volumes with decimals; and the volumes as
  capacities in **mL**. David's words: «atenció, el Volum es mesura en cm³; la Capacitat es mesura en mL»
  (1 cm³ = 1 mL: the step must say «volum … cm³» and «capacitat … mL», never mix them).
- **Review artifact 2026-11-23** (https://claude.ai/artifact/9cJCDdLY4Xzm86tMfCFz5h, all 11 points answered): per
  cylinder the folding (4 options: circumference, diameter, radius, height; sometimes asked about the height
  side), radius, base area, volume, all written with 2 decimals; then which has more volume and the capacity of
  each in mL. Two levels only (A4; other rectangles). David's error: 2πr² for the circle area. 2n ESO, page
  «Cilindres amb un full», `cilindres.html`, code CF, ESO menu after Àrees i volums. Error propagation studied:
  rounding r and A to 2 decimals → volume off by ≤ 0.32 %, π ≈ 3.14 → ≤ 0.36 %, truncating → ≤ 1.04 %; so each
  step is checked against the student's previous answer (follow-through, `refaPassos`), never a % tolerance on
  the final volume.
- **Board DONE 2026-11-24** (`resolucio.html?activitat=cilindres`, `js/cilindres/resolucio.js`; `docs/pissarra/STATE.md`
  «Scenario B for `cilindres`»): the sheet's sides fly to 2πr and h; «Vull més detall» on the radius. Waiting for
  David to try it.

## 3. «Resolució pas a pas» engine plan (`docs/pissarra/STATE.md`)

| Stage / wave | Content | Status |
|---|---|---|
| Stage 4 | 1r–2n ESO boards: P8 `mcd-mcm`, X1 factor tree, P2 `enters`, P1 `potencies` | PENDING |
| Stage 6 | 3r–4t ESO and Batxillerat: N1, P3, P4, N3, P5, P6, P7, N2, N4, N5, N6, X2, X3, P9, C2, C3 | PENDING |
| Waves 4–7 | `potencies`/`enters`; `sistemes-equacions`/`radicals`; Batx `esglaonar-matriu` → `ruffini` → `complexos`; optional `mcd-mcm`, `inversa-matriu`, `derivades`/`integrals` | PENDING (overlap with the stages above; the stages are the current plan) |
| Known limits | rotated/skewed SVG travellers; wrapping keyed phrases cross-fade; `fraccions` step heights differ | Documented, no fix planned |

## 4. Fading mode («Esvaïment», `docs/esvaiment/STATE.md`)

| Item | Status |
|---|---|
| Pilot 2 `equacions`: adapter | PENDING (pure engine and characterisation test done) |
| Pilot 3 `fraccions` (addition/subtraction): adapter | PENDING |
| Line in `a/UPSTREAM.md` (another repository) | PENDING |

## 5. Decisions owed by David (summary)

1. Roadmap 18–22: all done (2026-11-22); new deliveries only if David proposes them.
2. Try the Inequacions board (§2, built 2026-11-23) and the «Cilindres amb un full» activity and board (§2b, 2026-11-23/24).
3. Whether to make the exception for P2 (animation inside Fórmules STEAM).
4. Real student error cases for Fórmules STEAM (E1).
5. When to resume the «Resolució pas a pas» stages 4 and 6 and the fading pilots (§3, §4).
