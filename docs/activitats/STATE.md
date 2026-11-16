# New activities roadmap: living state

Agent-facing memory between sessions. English. Update it in the same commit as any change to these activities.
Owner: the single agent working on this repo. Until 2026-11-16 two Claude agents worked in parallel: agent A built
the new activities and agent B «Resolució pas a pas» (`docs/pissarra/STATE.md`). On 2026-11-16 agent A stopped
(out of tokens) and David asked B to merge A's work and take over its roadmap. The only source left for A's
decisions is this file (A's review artifact «Activitats noves per a Step Quiz»,
https://claude.ai/artifact/TpqHeTWA7N9HrBMpeNCx6s, holds David's answers of 14/11/2026; it may not be readable).

## Status

| # | Delivery | Page / code | Status |
|---|----------|-------------|--------|
| 1 | Link generator: per-activity options (`OPCIONS_ACTIVITAT`), `arbre.html` in the ESO menu, Batxillerat without codes | `index.html`, `js/config.js` (`SENSE_CODI`) | DONE |
| 2 | Equacions de 2n grau | `equacions-segon-grau.html`, `SG` | DONE |
| 3 | Expressions algebraiques + **shared step player** | `expressions-algebraiques.html`, `EA`; `js/passos/joc-passos.js`, `correccio.js`, `textos.js`; `js/algebra/polinomis.js` | DONE |
| 4 | Identitats notables | `identitats-notables.html`, `IN`; `js/algebra/racionals.js` | DONE |
| 5 | Fracció, decimal i percentatge (`?modalitat=a\|b`) | `fraccio-decimal-percentatge.html`, `FD`; `js/passos/figura-fraccio.js` | DONE |
| 6 | Percentatges | `percentatges.html`, `PE` | DONE |
| 7 | Shared cartesian grid + La recta | `recta.html`, `RC`; `js/passos/quadricula.js` (field type `punts`) | DONE |
| 8 | La paràbola | `parabola.html`, `PA` | DONE |
| 9 | «Mira-ho a la gràfica» in Sistemes d'equacions | `js/sistemes-equacions/grafica.js` (+2 lines in the controller, +1 `<link>`) | DONE |
| 10 | Shared statistics chart + Gràfics estadístics | `grafics-estadistics.html`, `GE`; `js/passos/grafic-estadistic.js`, `css/grafic-estadistic.css` | DONE |
| 11 | Shared context graph + Gràfiques en context | `grafiques-context.html`, `GX`; `js/passos/grafica-context.js` | DONE |
| 12 | Canvi d'unitats (E13) + shared unit ladder | `canvi-unitats.html`, `CU`; `js/passos/escala-unitats.js`, `css/escala-unitats.css` | DONE (2026-11-16) |
| 13 | Àrees i volums (E14) + shared measurement figures | `arees-volums.html`, `AV`; `js/passos/figures-mesura.js`, `css/figures-mesura.css` | DONE (2026-11-16) |
| 14 | Operacions combinades amb enters (E2), inside `prioritat` | `prioritat.html?nombres=enters`; `js/prioritat/` (engine, strings, renderer, board), `resolucio.html` levels 6–8 | DONE (2026-11-16) |
| 15–22 | See «Pending items» | — | PENDING |

Deliveries 1–11 reached `main` on 2026-11-16 through B's 3-way merge: base `7f79b4b` (the snapshot A worked on),
A's delivery ZIP committed on top of it as `555ff07`, merged with B's work up to stage 5 of «Resolució pas a pas».
Conflicts were only textual (`tests/run-all.js`, `CONTRIBUTING.md`, the changelog), resolved keeping both sides.

## How an activity is built (follow the same pattern; X2 = DRY, reuse engines and widgets)

- **Pure engine** `js/<act>/math-engine.js`: each question is data `{ text, clau, enunciat?, svg?, passos: [pas] }`;
  each step carries `dades.distractors` = `{ field: [[value, ERROR_TYPE]] }` for the typical mistakes. Plus
  `errors.js` (`ERRORS_XX` + `diagnostica…` via `errorPerDistractors`), `strings.js`, and a thin controller calling
  `iniciaJocPassos({ element, generaPregunta, diagnostica, enEncertar?, textResposta?, teclat? })`.
- **Field types** (`js/passos/correccio.js`): `enter`, `coeficient`, `exponent`, `racional`, `coeficientRacional`,
  `decimal` (comma; optional period), `pintat`, `fitxa`, `punts` (grid), `tria`. `tria` options may be
  `[valor, text, svg]` (graph cards). Warnings (`NO_ENTER`, `NO_DECIMAL`, …) cost no attempt.
- **Shared drawing modules** in `js/passos/`: `quadricula.js` (cartesian grid, points field), `grafic-estadistic.js`
  (bars, pie, histogram, pictogram), `grafica-context.js` (magnitude over time, curved trams), `figura-fraccio.js`,
  `escala-unitats.js` (unit ladder), `figures-mesura.js` (plane, composite and solid figures with lettered segments,
  dashed heights and right-angle marks; labels carry `data-segment` and `data-mesura` so tests re-read the drawing).
- **Shared widgets still missing** (accepted in X2 with the grid and the statistics chart): a **number line with
  intervals** (E12, B10) and a **sign table** (B3, B10). Build each once, pure and tested, in `js/passos/`.
  Built since: `escala-unitats.js` (the unit ladder) and `figures-mesura.js` (E14).
- **Long answers:** a `decimal` field of the step player holds 6 characters unless its template piece says
  `llarg: n` (Canvi d'unitats uses 11, Àrees i volums 8).
- **Option text case:** the player shows the first letter of a `tria` option in upper case; a step with
  `literal: true` shows its options as written (segment letters «b = 6 cm», units «cm²»; Àrees i volums).
- **Per-activity options** (teacher's choices): add them to `OPCIONS_ACTIVITAT` in `index.html` and read them with
  `urlParams.get(...)`; `tests/check-repo.js` suite 13 checks both. Never declare the generic parameters
  (`totalsessions`, `totaloperations`, `maxintents`, `maxenllocmitjana`, `nivell`, `fixed`, `esvaiment`, `inici`,
  `pissarra`).
- **Codes and menus:** ESO pages give a verification code (add it to `js/exercise-codes.js`); Batxillerat pages
  carry `senseCodi: true` in `window.APP_CONFIG` (X3; exception decided by David on 15/11: `asimptotes` keeps `AS`);
  every activity appears in exactly one menu (X1, suite 13).
- **Tests:** `tests/<act>.test.js` loads the modules with `tests/harness.js` (`loadModule([...], { seed })`),
  generates thousands of questions per option/level and **recomputes each solution independently** (ideally by
  re-reading the SVG, as `tests/grafics-estadistics.test.js` and `tests/grafiques-context.test.js` do); every
  distractor ≠ solution and round-trips through the diagnosis; the error types exist; there is variety. Do a
  mutation check (break the engine once, see the test fail).
- **Registering a page:** theme class on `<html>`; CSS chain `tokens, temes, shared, teclat, passos[, quadricula |
  grafic-estadistic], chromebook, seguent, codi`; `index.html` entry (and options); exercise code;
  `tests/run-all.js`; `sitemap.xml`; README row and paragraph, CONTRIBUTING tree and tests-table row, a changelog
  row in `PROJECTS-TECHNICAL-REFERENCE.md`.
- **Fixed sessions:** every question is generated inside `buildLevel()`, called as `window.buildLevel()`.

## Contracts the step player relies on

- `js/game-core.js` exports: `state`, `acabaPregunta`, `puntsDeLaPregunta`, `recordResult`, `recordAnswerToHistory`,
  `injectSharedHTML`, `startGame`, `validateConfig`, `initCustomKeyboard`, `showCustomKeyboard`, `hideCustomKeyboard`,
  `getKbActiveInput`, `kbMarkForOverwrite`, `isTouchDevice`. `acabaPregunta(punts, { encert })` adds the points,
  hides the keyboard, sets `state.isTransitioning`, shows the strip and, on «Següent», increments
  `currentOperation` and calls `window.buildLevel()`. The player calls `recordResult(min(errors + 1, 3))` or
  `recordResult(4)`, then `acabaPregunta(puntsDeLaPregunta())` or `acabaPregunta(0, { encert: false })`.
- `js/config.js`: `MAX_INTENTS`, `TOTAL_OPERATIONS`, `TOTAL_SESSIONS`, `urlParams`, `SENSE_CODI`.
- `js/estadistica/question-bank.js` (read-only import of `grafics-estadistics`): `QuestionBank.generators[id]()` for
  `germans`, `nota`, `son`, `calcat` (discrete) and `minuts`, `alcada`, `pes`, `pulsacions` (grouped), each returning
  `{ data, label, unit, intervalOptions? }`; grouped values must lie inside their `limits`.
- `js/teclat.js`: on touch devices the active input becomes `readonly` with `inputmode="none"`; a capture-phase
  `pointerdown` routes taps to the keyboard; «→» calls `window.checkCurrentCell()`.
- Themes: `tema-algebra` (SG, EA, IN), `tema-nombres` (FD, PE), `tema-funcions` (RC, PA, GX), `tema-estadistica` (GE),
  `tema-geometria` (CU, AV);
  the CSS uses theme variables and tokens only (no hard-coded state colours).

## Pending items (in the order David accepted; his quotes are binding)

| # | Item | David's decision | Spec (trimmed to the decision) |
|---|------|------------------|--------------------------------|
| 12 | **E13 Canvi d'unitats** (1r–3r ESO), new page — **DONE 2026-11-16** | «només l'escala»; 16/11 (dialog): no time or compound units; the ladder as stairs (km top-left, mm bottom-right) with source and target marked; three steps (jumps and direction, operation, result); 3 levels + option `magnitud` | Built as specified: `js/canvi-unitats/` (`math-engine.js`, `errors.js` with 6 types: SENTIT, COMPTA_UNITATS, SALTS, DEU_PER_GRAO, COMA, EQUIVALENCIA; `strings.js`; controller), level 1 ×10 magnitudes, 2 area and volume, 3 volume ↔ capacity (equivalence step first) and everything; results with at most 6 decimals and below 10⁹; factors and results grouped in threes (1 000 000). |
| 13 | **E14 Àrees i volums** (1r–3r ESO), new page — **DONE 2026-11-16** | «fes-ho tot. amb un paràmetre per poder escollir si volem 2D, 3D, o tot»; 16/11 (dialog): base and height are marked by choosing the letter of a segment of the drawing (the slanted side is the trap); π ≈ 3,14 (exact decimals, no calculator); solids: total area (base, lateral, total) and volume, step by step; 3 levels (1 plane, 2 harder plane and composite, 3 solids) + option `dim` (2 or 3 keeps one block) | Built as specified: `js/arees-volums/` (`math-engine.js`, `errors.js` with 24 types, `strings.js`, controller) on the new shared `js/passos/figures-mesura.js` (+ `css/figures-mesura.css`). Plane (triangle, parallelogram, rhombus, right trapezium, circle): formula (tria), base/height letters (or diagonals / bases as a pair), radius from the diameter, area (decimal), unit (u, u², u³). Composite (house, rectangle with a hole, door, L): add or subtract, each part, total, unit. Solids (cuboid, cylinder, square pyramid, cone, sphere): height letter (pyramid, cone), base, lateral, total area (unit written), volume, volume unit; sphere: area, volume formula, volume, unit. Integer lengths; slanted sides from Pythagorean triples (one leg is a multiple of 3, so pyramid/cone volumes are exact); sphere radius 6, 9 or 12. Levels: `dim=''` 1 triangle/parallelogram/rhombus, 2 trapezium/circle/composite, 3 solids; `dim=2` 3 = composite; `dim=3` 1 cuboid/cylinder, 2 pyramid/cone, 3 all + sphere. Distractor values with a repeating decimal are dropped (the field cannot hold them). `tests/arees-volums.test.js` re-reads each drawing and recomputes every step with exact fractions. |
| 14 | **E2 Operacions combinades** (1r–3r ESO) — **DONE 2026-11-16** | «parlem»: «fes només operacions combinades amb enters, no facis operacions combinades amb fraccions» | Integers only, with parentheses and powers with a negative base. Proposed as a new block in the «Pas a pas» mode of `prioritat` (the student picks the operation that comes first and solves it; the result stays centred below), but `prioritat` works with naturals (results ≤ 200, never negative). **Decided 16/11 (dialog): inside `prioritat`**, as a new index option «Nombres: naturals / enters» (`?nombres=enters`); content: adding and subtracting with parentheses (5 − (−3), −(4 − 7)), the sign rule for · and :, and powers with a negative base ((−2)³, (−2)² vs −2²); 3 levels (1 additions and subtractions with parentheses; 2 with products and quotients; 3 with negative-base powers and everything); «Resolució pas a pas» (the animated board) also with integers. The natural-number path must stay identical (fixed sessions fingerprint). Reuse `prioritat`'s `blockers()` errors. Note that `prioritat` also has scenario B («Resolució pas a pas», `js/prioritat/resolucio.js`).  Built: `math-engine.js` integer tokens (negative `num`, `neg` = «−(…)», negative-base `pow`, `pow.opp` = «−2²»), `evaluate(…, { enters })`, six sign misconceptions (`signesuma`, `restaneg`, `signeprod`, `powsigne`, `powopp`, `negpar`; the diagnosis marks the operation where the sign goes wrong and the message quotes it), `LEVELS_ENTERS` (6 internal levels) and `generateExerciseEnters`; removing «−(−3)» is its own step (motive `neg`); step distractors offer the sign-flipped result with a sign hint. `strings.js`/`renderer.js` write negatives with U+2212 and in parentheses after a sign. Board levels 6–8 (`js/resolucio/activitats.js` gains an optional `enllac(nivell)`). Natural path unchanged (fixed-session fingerprint `12e8978e` still passes). Tests: `tests/prioritat-enters.test.js`, extended `tests/prioritat.test.js`. |
| 15 | **E4 Potències** (2n–4t ESO), extends `potencies` | «només aquests: A potencies: exponent zero i negatiu (2⁻³ = 1/8, a³ : a⁵ = a⁻²) i operar en notació científica» | Two new challenges in `potencies` only (**no radicals**): (a) zero and negative exponents, including the quotient of powers giving a negative exponent; (b) operating in scientific notation (×, ÷ and maybe ± with exponent adjustment). Errors: 2⁻³ = −8 or −6. |
| 16 | **E11 Aïllar una lletra** (3r–4t ESO), new page | «busca en el currículum català del departament d'ensenyament de la generalitat de catalunya, busca les matèries "Física" i "Tecnologia"» | Real formulas from the Catalan curriculum of Física and Tecnologia (search it; e.g. v = e/t, d = m/V, V = I·R, P = F/S, A = b·h/2, E = ½mv², F = 9/5·C + 32). Isolate the requested letter, deciding at each step which operation to undo. Levels: one step; two steps; letter in a denominator; squares and roots. Errors: subtracting instead of dividing; v = e/t → t = v/e or t = e·v; root of only one part. The step player fits (a `tria` for the operation + the rewritten formula). |
| 17 | **E12 Inequacions** (4t ESO), new page | «no facis intersecció d'intervals» | Solve a first-degree inequality and give the solution three ways: inequality, ray on the number line (build the shared **number line with intervals**), and interval. No intersections or systems. Errors: not flipping the sign when dividing by a negative; open vs closed dot; bracket vs parenthesis. |
| 18 | **B1 Integrals, wave 2** (2n Batx), extends `integrals` | «comença per la 2» | Quasi-immediate integrals (the chain rule backwards): f′·fⁿ, f′/f, f′·e^f, f′·cos f (and sin), generated by inverting the generators of `derivades`. Errors: forgetting to divide by the inner derivative; 1/x with the power rule; sign of the integral of sin. Batx → no code. Waves 1, 3 and 4 only if David asks. |
| 19 | **B3 Estudi d'una funció** (1r–2n Batx), new page | «també racionals» | Compute f′, its zeros, fill an **interactive sign table** (a test point per interval; build the shared widget), write the increasing/decreasing intervals and classify the extrema; the same with f″ for concavity; the graph appears at the end and must agree with the table. Include **rational functions** (points where f is undefined split the table too). Errors: forgetting points outside the domain; extremum just because f′ = 0; sign of f instead of f′. Batx → no code. |
| 20 | **B16 Binomial** (1r–2n Batx), new page | «només vull la Binomial. No vull la Normal.» | Identify n and p in a context; P(X = k), P(X ≤ k) (and ≥, complement); mean np and standard deviation √(npq). No normal distribution, no approximation. Batx → no code. |
| 21 | **B11 Complexos** (1r Batx), completes `complexos.html` | «sí que entren a 1r de Batxillerat. fes-ho» | Fill the «Potència» tab (today «Aquesta activitat està en construcció»): binomial ↔ polar (modulus and argument in the right quadrant), product and quotient in polar, De Moivre, n-th roots drawn on the plane (the shared grid can help). Errors: argument from arctan alone (wrong quadrant); raising the modulus but not multiplying the argument. Batx → no code. |
| 22 | **B10 Logaritmes i equacions no lineals** (4t ESO–1r Batx), new page | «comença pel que tu vulguis» | Three blocks: logarithms (definition, log₂ 8 = 3 because 2³ = 8; properties); exponential, logarithmic and radical equations with **checking the solutions as a mandatory step**; quadratic and rational inequalities with the sign table (reuse B3's widget). The first block is free to choose. Errors: log(a + b) = log a + log b; keeping false solutions; x² > 4 → x > 2. |

## Open points for David (ask with the question dialog when you reach them)

- Item order: free to change if David wants.

## Notes

- Agent A's own Playwright scripts (one per delivery: index options, SG/EA/IN, FD, PE, RC, PA, E26, GE, GX and the
  strip/points/«Codi» icon) are not in the repo; the copies David handed over were run green against the merge.
  The La recta script picks a random line and swaps the coordinates of two of its points expecting a diagnosis;
  with a line of slope −1 the swapped points are on the line too, so it times out now and then (a flaw of the
  script, not of the page).
- A's suggestions still open: assert behaviour instead of matching the literal text of `js/game-core.js` in
  `tests/check-repo.js` (two regexes were relaxed to accept `SENSE_CODI`); on a 390 px phone a title that wraps to
  two lines can push the subtitle under the fixed «Codi» icon.
- `index.html` lower bounds in `tests/check-repo.js` (pages with the strip, with a code, with the keyboard, number of
  activities) only grow with new pages; never lower them.
