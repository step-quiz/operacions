# PENDING.md — open work and open decisions (operacions)

Single entry point for a cold-start agent: everything still to build and every decision still owed by David,
as of **2026-11-18** (after PR #31: «Inequacions»). Each item points to the document that holds the detail;
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
| 20 | **Binomial** (1r–2n Batx), new page | «només vull la Binomial. No vull la Normal.» | n and p from a context; P(X = k), P(X ≤ k), ≥, complement; mean np, σ = √(npq). No normal, no approximation. |
| 21 | **Complexos** (1r Batx), completes `complexos.html` | «sí que entren a 1r de Batxillerat. fes-ho» | Fill the «Potència» tab (now «en construcció»): binomial ↔ polar (quadrant!), product/quotient in polar, De Moivre, n-th roots drawn on the plane. |
| 22 | **Logaritmes i equacions no lineals** (4t ESO–1r Batx), new page | «comença pel que tu vulguis» | Logarithms (definition, properties); exponential, logarithmic and radical equations with **mandatory checking**; quadratic and rational inequalities with the sign table (reuse #19's widget and the number line `js/passos/recta-intervals.js` from #17). |

**Decisions owed before each of them:** levels, step design, errors, UI. Ask with a review artifact (as for
#16 and #17), not by guessing.

## 2. Leftovers of finished deliveries

| From | Item | Status / decision owed |
|---|---|---|
| #16 Fórmules STEAM | Board stage 2: **«Vull més detall»** on `resolucio.html?activitat=formules-steam` (e.g. «80 · Δt = (240/Δt) · Δt» before simplifying) | Agreed in principle; build after David tries stage 1 in class. Design: `docs/pissarra/STATE.md` decision 21. |
| #16 Fórmules STEAM | **P2**: the board's flying animation inside the activity (instead of only colouring what moves) | David: «més endavant». Needs an exception to decision 14 (activity and board are independent); ask first. |
| #16 Fórmules STEAM | **E1**: real student errors to add to the error taxonomy | Waiting for David to send cases from class. |
| #17 Inequacions | **U2**: the «Resolució pas a pas» board for inequalities (with the number line drawn at the end) | Agreed: after David tries the activity. |
| #17 Inequacions | U4 listed «llegir 5 > x com x > 5»: the flip is automatic (P4), so the student never types it | Nothing to do unless David wants that step back. |

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

1. Order of deliveries 18–22 (default: as listed).
2. Design of each delivery 18–22 (review artifact each time).
3. After trying them in class: go for the Fórmules STEAM board detail (§2) and the Inequacions board (§2).
4. Whether to make the exception for P2 (animation inside Fórmules STEAM).
5. Real student error cases for Fórmules STEAM (E1).
6. When to resume the «Resolució pas a pas» stages 4 and 6 and the fading pilots (§3, §4).
