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
| 15 | Potències: reptes 4 i 5 (E4) | `potencies.html` (menu cards 4 and 5); `js/potencies/reptes-nous.js` | DONE (2026-11-17) |
| 16 | Fórmules STEAM (E11) | `formules-steam.html` (no code); `js/formules-steam/`; board `js/formules-steam/resolucio.js` | DONE (2026-11-17): activity, UI review and board stage 1 (no detail on demand yet) |
| 17 | Inequacions (E12) | `inequacions.html`, `IQ`; `js/inequacions/`; shared number line `js/passos/recta-intervals.js` (step-player field `recta`); board `js/inequacions/resolucio.js` | DONE (2026-11-17); board (first degree) DONE 2026-11-23 |
| 18 | Integrals, wave 2: quasi-immediates (B1), inside `integrals` | `integrals.html?tipus=quasi&constant=exacta` (or `ajust`); `js/integrals/quasi-bank.js` | DONE (2026-11-21) |
| 19 | Estudi d'una funció (B3), new page | `estudi-funcio.html` (`?funcions=`), `EF` reserved (no code); `js/estudi-funcio/`; shared `js/passos/taula-signes.js` (field type `taula`) and `js/passos/esbos-funcio.js` | DONE (2026-11-21) |
| 20 | Distribució binomial (B16), new page | `binomial.html` (`?tipus=`), `BI` reserved (no code); `js/binomial/`; decimal tolerance `pas.tolerancia` in `js/passos/correccio.js` | DONE (2026-11-21) |
| 21 | Complexos (B11): «Forma polar» and «Potències i arrels» tabs, inside `complexos.html` | `complexos.html?pestanya=polar` (or `potencies`); `js/complexos/polar.js`, `polar-engine.js`, `pla-complex.js`, `strings-polar.js`; `css/complexos-polar.css` | DONE (2026-11-21) |
| 22a | Logaritmes i equacions (B10), block 1: logarithms, new page | `logaritmes.html` (`?tipus=`), `LG` reserved (no code, Batx menu); `js/logaritmes/` | DONE (2026-11-21) |
| 22b | Logaritmes i equacions (B10), block 2: exponential, logarithmic and radical equations | `logaritmes.html` (`?tipus=equacions\|basiques\|mitjanes\|irracionals`); `js/logaritmes/equacions.js` | DONE (2026-11-21) |
| 22c | Logaritmes i equacions (B10), block 3: quadratic/rational inequalities (in `inequacions.html`, code IQ) | `inequacions.html` (`?tipus=no-lineals\|segon-grau\|racionals\|especials`); `js/inequacions/no-lineals.js`; number line with segments in `js/passos/recta-intervals.js` | DONE (2026-11-22) |
| 23 | Cilindres amb un full (David's request of 2026-11-23), new page | `cilindres.html`, `CF`; `js/cilindres/` (follow-through correction `refaPassos` through the player's `enEncertar`) | ACTIVITY DONE on the branch (2026-11-23); board after David tries it |

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
- `js/passos/joc-passos.js` opt-in features (added for Fórmules STEAM on 2026-11-17; every other activity is
  unchanged because none sets them): question `problema {context, pregunta}` (card, `**…**` bold) and `formula
  {nom, tex, llegenda}` (card with a three-column legend), `enllac {href, text}`, `opcional {desDe, pregunta, si,
  no, resum, inici}` (steps from `desDe` are optional: the student chooses; yes folds the done lines into a
  clearly unfoldable strip and writes `inici`; no ends the question with the points so far); step `formules`
  (instruction with `$…$` KaTeX), option 4th element (button text with `$…$` KaTeX; the 2nd stays plain for
  history and screen readers), `liniaMarcada` / `marcaAnterior` (colour what moves to the other member, only on
  the last two lines), group `literal` (title not upper-cased: units); config `desplacament` (after each correct
  answer the last two lines and the step are in view) and `plegaAntigues` (on screens ≤ 860 px tall a phase with
  more than 4 lines folds the middle ones).
- `js/estadistica/question-bank.js` (read-only import of `grafics-estadistics`): `QuestionBank.generators[id]()` for
  `germans`, `nota`, `son`, `calcat` (discrete) and `minuts`, `alcada`, `pes`, `pulsacions` (grouped), each returning
  `{ data, label, unit, intervalOptions? }`; grouped values must lie inside their `limits`.
- `js/teclat.js`: on touch devices the active input becomes `readonly` with `inputmode="none"`; a capture-phase
  `pointerdown` routes taps to the keyboard; «→» calls `window.checkCurrentCell()`.
- Themes: `tema-algebra` (SG, EA, IN, IQ), `tema-nombres` (FD, PE), `tema-funcions` (RC, PA, GX), `tema-estadistica` (GE),
  `tema-geometria` (CU, AV, CF);
  the CSS uses theme variables and tokens only (no hard-coded state colours).

## Pending items (in the order David accepted; his quotes are binding)

| # | Item | David's decision | Spec (trimmed to the decision) |
|---|------|------------------|--------------------------------|
| 12 | **E13 Canvi d'unitats** (1r–3r ESO), new page — **DONE 2026-11-16** | «només l'escala»; 16/11 (dialog): no time or compound units; the ladder as stairs (km top-left, mm bottom-right) with source and target marked; three steps (jumps and direction, operation, result); 3 levels + option `magnitud` | Built as specified: `js/canvi-unitats/` (`math-engine.js`, `errors.js` with 6 types: SENTIT, COMPTA_UNITATS, SALTS, DEU_PER_GRAO, COMA, EQUIVALENCIA; `strings.js`; controller), level 1 ×10 magnitudes, 2 area and volume, 3 volume ↔ capacity (equivalence step first) and everything; results with at most 6 decimals and below 10⁹; factors and results grouped in threes (1 000 000). |
| 13 | **E14 Àrees i volums** (1r–3r ESO), new page — **DONE 2026-11-16** | «fes-ho tot. amb un paràmetre per poder escollir si volem 2D, 3D, o tot»; 16/11 (dialog): base and height are marked by choosing the letter of a segment of the drawing (the slanted side is the trap); π ≈ 3,14 (exact decimals, no calculator); solids: total area (base, lateral, total) and volume, step by step; 3 levels (1 plane, 2 harder plane and composite, 3 solids) + option `dim` (2 or 3 keeps one block) | Built as specified: `js/arees-volums/` (`math-engine.js`, `errors.js` with 24 types, `strings.js`, controller) on the new shared `js/passos/figures-mesura.js` (+ `css/figures-mesura.css`). Plane (triangle, parallelogram, rhombus, right trapezium, circle): formula (tria), base/height letters (or diagonals / bases as a pair), radius from the diameter, area (decimal), unit (u, u², u³). Composite (house, rectangle with a hole, door, L): add or subtract, each part, total, unit. Solids (cuboid, cylinder, square pyramid, cone, sphere): height letter (pyramid, cone), base, lateral, total area (unit written), volume, volume unit; sphere: area, volume formula, volume, unit. Integer lengths; slanted sides from Pythagorean triples (one leg is a multiple of 3, so pyramid/cone volumes are exact); sphere radius 6, 9 or 12. Levels: `dim=''` 1 triangle/parallelogram/rhombus, 2 trapezium/circle/composite, 3 solids; `dim=2` 3 = composite; `dim=3` 1 cuboid/cylinder, 2 pyramid/cone, 3 all + sphere. Distractor values with a repeating decimal are dropped (the field cannot hold them). `tests/arees-volums.test.js` re-reads each drawing and recomputes every step with exact fractions. |
| 14 | **E2 Operacions combinades** (1r–3r ESO) — **DONE 2026-11-16** | «parlem»: «fes només operacions combinades amb enters, no facis operacions combinades amb fraccions» | Integers only, with parentheses and powers with a negative base. Proposed as a new block in the «Pas a pas» mode of `prioritat` (the student picks the operation that comes first and solves it; the result stays centred below), but `prioritat` works with naturals (results ≤ 200, never negative). **Decided 16/11 (dialog): inside `prioritat`**, as a new index option «Nombres: naturals / enters» (`?nombres=enters`); content: adding and subtracting with parentheses (5 − (−3), −(4 − 7)), the sign rule for · and :, and powers with a negative base ((−2)³, (−2)² vs −2²); 3 levels (1 additions and subtractions with parentheses; 2 with products and quotients; 3 with negative-base powers and everything); «Resolució pas a pas» (the animated board) also with integers. The natural-number path must stay identical (fixed sessions fingerprint). Reuse `prioritat`'s `blockers()` errors. Note that `prioritat` also has scenario B («Resolució pas a pas», `js/prioritat/resolucio.js`).  Built: `math-engine.js` integer tokens (negative `num`, `neg` = «−(…)», negative-base `pow`, `pow.opp` = «−2²»), `evaluate(…, { enters })`, six sign misconceptions (`signesuma`, `restaneg`, `signeprod`, `powsigne`, `powopp`, `negpar`; the diagnosis marks the operation where the sign goes wrong and the message quotes it), `LEVELS_ENTERS` (6 internal levels) and `generateExerciseEnters`; removing «−(−3)» is its own step (motive `neg`); step distractors offer the sign-flipped result with a sign hint. `strings.js`/`renderer.js` write negatives with U+2212 and in parentheses after a sign. Board levels 6–8 (`js/resolucio/activitats.js` gains an optional `enllac(nivell)`). Natural path unchanged (fixed-session fingerprint `12e8978e` still passes). Tests: `tests/prioritat-enters.test.js`, extended `tests/prioritat.test.js`. |
| 15 | **E4 Potències** (2n–4t ESO), extends `potencies` — **DONE 2026-11-17** | «només aquests: A potencies: exponent zero i negatiu (2⁻³ = 1/8, a³ : a⁵ = a⁻²) i operar en notació científica» | Two new challenges in `potencies` only (**no radicals**): (a) zero and negative exponents, including the quotient of powers giving a negative exponent; (b) operating in scientific notation (×, ÷ and maybe ± with exponent adjustment). Errors: 2⁻³ = −8 or −6. **Decided 17/11 (dialog):** two new challenges in the `potencies` menu — Repte 4 «Exponent zero i negatiu» (value of a power: 5⁰ = 1, 2⁻³ = 1/2³ = 1/8 as a fraction; properties with negative exponents: a³ : a⁵ = a⁻², 2⁻³ · 2⁵ = 2², (3⁻²)³ = 3⁻⁶; fractional base: (2/3)⁻² = (3/2)² = 9/4), answered step by step (first choose how it is written with a positive exponent — traps −2³ and −6 — then write the fraction); Repte 5 «Operacions en notació científica», **only × and :** (mantissas, exponents, adjust the result).  Built: `js/potencies/reptes-nous.js` (pure: generators, step data, `comprova()` with errors and soft warnings, messages) and `passosNous()` in `potencies.js`, which turns the step data into the page's own step system (buttons, exponent, fraction, decimal and scientific-notation boxes; each correct step appends its result to the expression). Repte 4 cycles `neg, zero, prop, fracneg, …` over the session; repte 5 alternates × and :, with an «adjust the mantissa» step only when needed (the unadjusted value is a soft warning). Shared keyboard: inputs with `data-coma="true"` turn the − key into a comma (Potències needs both). Fixed on the way: after a wrong answer on touch devices the inputs were not emptied (the keyboard sets readonly), so new digits were appended — now locked inputs carry `data-locked`. Tests: `tests/potencies.test.js`. |
| 16 | **E11 Aïllar una lletra** (3r–4t ESO), new page | David asked to take the formulas from the Catalan curriculum (two subjects he named; he later asked that their names appear nowhere in the project) | Real formulas from that curriculum (search it; e.g. v = e/t, d = m/V, V = I·R, P = F/S, A = b·h/2, E = ½mv², F = 9/5·C + 32). Isolate the requested letter, deciding at each step which operation to undo. Levels: one step; two steps; letter in a denominator; squares and roots. Errors: subtracting instead of dividing; v = e/t → t = v/e or t = e·v; root of only one part. The step player fits (a `tria` for the operation + the rewritten formula).  **Decided 17/11 (review artifact https://claude.ai/artifact/8hfKrbco4PV2JcD3Fu9RKy + dialog):** page title **«Fórmules STEAM»**; never name the subjects the formulas come from, anywhere in the project (they are formulas that appear when «we study the world around us»); no subject option; **no verification code** (exception like `asimptotes`, check-repo X3). ESO menu after «Equacions de 1r grau». Formulas: d = m/V, v = Δx/Δt, F = m·a, F = k·Δx, V = I·R, T = t + 273; a = (v − v₀)/t, v = v₀ + a·t, P = m·g, p = F/S, Ep = m·g·h, Ec = ½·m·v², W = F·d, P = W/t, Q = m·c·ΔT; P = V·I, E = P·t, F·d = R·r, n₁·d₁ = n₂·d₂, n₁·z₁ = n₂·z₂, η = Pu/Pa; level 4 also x = x₀ + v₀·t + ½·a·t², 1/R = 1/R₁ + 1/R₂ (F = G·m₁·m₂/d² was proposed too, but David left **gravitation out** in the dialog of 17/11). Out: geometry, p = d·g·h, n = m/M, P = I²·R. Every formula has a name, a legend with units and **always a context**. **Always a numeric example first**: the student isolates with the data (120 = 60·t → t = 2 h), then does the same operations with letters (the other letters are parameters). Each step: choose the operation on both sides + choose the new formula; flipping the equality is a separate automatic step (F/a = m, then m = F/a); letter in a denominator always in two steps; roots keep the positive root. Final step: choose the unit of the result with the unit computation shown (km : km/h = h). 4 levels (one step, two steps, letter in a denominator, squares/roots). Errors as proposed (David will add real student cases later). **The «Resolució pas a pas» board for it is part of this delivery, built gradually after the activity.** Later dialog of 17/11: gravitation out; «Tecnologia» stays as it is in `llenguatge-algebraic` and `mitjana` (a label there, not about this activity). **UI review 17/11 (artifact https://claude.ai/artifact/KKT7ZhhHHgvpU7Lw3QenCv, all 20 points answered):** problem
card (context with the data in bold, question on its own line) and formula card (name as a small label, formula
1.3× the text, legend table letter · magnitude · unit with subtle column rules); no «La fórmula és…» sentence;
first step «A quina lletra va cada dada?» (drag each letter under its datum; data values are now always
different); texts «Substitueix les dades a la fórmula.», «Quina equació equivalent obtens?», «Quant val x?»,
«En quina unitat surt x? Opera amb les unitats com si fossin lletres.»; options and instructions in KaTeX with
big fractions (`\dfrac`); the letters formula leaves the work area after substituting and comes back when the
letters start; after the numbers, «Vols saber com es resol la fórmula en general, és a dir, amb lletres?» Sí /
No (yes folds the numbers into a strip that clearly unfolds); auto-scroll; what moves to the other member in a
non-red colour on the last two lines; «Mira com es resol» under the cards; on short screens the middle lines of a
long chain fold. Rejected: two columns numbers | letters (R3), equations aligned with the operation in the margin
(R4). Later: the board animation inside the activity (P2). **L2 (points, agreed 17/11):** numbers 8 − 2 per error (min 0); letters +2 with no error, +1 with one, 0 with more;
skipping the letters gives at most 8 (`js/punts.js puntsAmbPartOpcional`, `pregunta.opcional.punts`).
**Board stage 1 built 17/11** (`resolucio.html?activitat=formules-steam`, levels 1–4; how: `docs/pissarra/STATE.md` decision 21): same order as the activity (context in the first caption, numbers, unit line, result with unit, then letters), flipping as its own step, no detail on demand yet. Algebra change that also reaches the activity: data numbers keep the letters' factor order (80000 · 0,02 like p · S) and a data value 2 is never drawn as «½». |
| 17 | **E12 Inequacions** (4t ESO), new page | «no facis intersecció d'intervals» | Solve a first-degree inequality and give the solution three ways: inequality, ray on the number line (build the shared **number line with intervals**), and interval. No intersections or systems. Errors: not flipping the sign when dividing by a negative; open vs closed dot; bracket vs parenthesis. **Decided 17/11 (review artifact https://claude.ai/artifact/Fr7GhAL3AFzmT2GTmUhkdo):** 4 levels (positive coefficient; negative coefficient; parentheses and x on both sides; denominators), all four signs; integer solutions at levels 1–2, at levels 3–4 a fraction with probability 1/3; no special cases (no «no solution» / «all reals»); no context. Steps: the student **writes the numbers in boxes and places the sign card** at every step (no separate «what happens to the sign» step, no choosing the operation); a final 4 > x is flipped automatically and shown; no checking step. Solution: inequality, **number line built by tapping** (number, filled/empty, side) and **interval built with pieces**, notation (2, 5). Name «Inequacions», ESO menu after Fórmules STEAM, code IQ. The board («Resolució pas a pas») after David tries it. **Built 17/11.** |
| 18 | **B1 Integrals, wave 2** (2n Batx), extends `integrals` | «comença per la 2» | Quasi-immediate integrals (the chain rule backwards): f′·fⁿ, f′/f, f′·e^f, f′·cos f (and sin), generated by inverting the generators of `derivades`. Errors: forgetting to divide by the inner derivative; 1/x with the power rule; sign of the integral of sin. Batx → no code. Waves 1, 3 and 4 only if David asks. **Decided 21/11 (question dialog):** all four families (sin and cos as two); 4-option multiple choice as wave 1, each wrong option a typical error with its explanation; level 1 = f′ exact, level 2 = f′ up to a constant (∫x·e^{x²}dx = ½e^{x²}); index option immediates / quasi-immediates / all. **Built 21/11.** |
| 19 | **B3 Estudi d'una funció** (1r–2n Batx), new page | «també racionals» | Compute f′, its zeros, fill an **interactive sign table** (a test point per interval; build the shared widget), write the increasing/decreasing intervals and classify the extrema; the same with f″ for concavity; the graph appears at the end and must agree with the table. Include **rational functions** (points where f is undefined split the table too). Errors: forgetting points outside the domain; extremum just because f′ = 0; sign of f instead of f′. Batx → no code. **Decided 21/11 (David):** not a new animated procedure — `step-quiz/pau` already has the DEMO «Gràfica d'una funció» to watch; this is the practice activity that reuses its 6 PAU functions, its section logic and its sketch (`esbos`, ported). Review artifact «Estudi d'una funció (19)»: random functions too, incl. f′ with no real zeros (A1); index option Totes/Polinòmiques/Racionals/Exercicis de PAU, no levels (A2); f′, f″ and the zeros always as 4 options with typical-error distractors (B1, B2, B5); the student types an integer test point per interval (B3); arrows + classify, no typed intervals (B4); a last «which of these 3 graphs is f?» question (B6); the 8 errors of C1; no link to the pau DEMO (C2); 3 functions per session, f″ optional, points 8 + 2 (D1). **Built 21/11.** |
| 20 | **B16 Binomial** (1r–2n Batx), new page | «només vull la Binomial. No vull la Normal.» | Identify n and p in a context; P(X = k), P(X ≤ k) (and ≥, complement); mean np and standard deviation √(npq). No normal distribution, no approximation. Batx → no code. **Decided 21/11 (David, review artifact «Distribució binomial (20)»):** contexts (A1); 1 < n < 7, p as per-unit, percent or «1 de cada 5» (A2); the answer in the same form as the data, per-unit or percent (B1); C(n, k) in its own box (B2); direct vs complement as 4 options (B3; the long route also counts when it has ≤ 3 cases); **no mean or σ** (B4) and no «is it binomial?» (B5); errors (1)–(7) (C1); levels exacte/directe/contrari, progressive by default (D1); 4 decimals, ±0.0001 per case and ±0.0002 for the answer (D2); 4 problems, no code (D3). Built 21/11. |
| 21 | **B11 Complexos** (1r Batx), completes `complexos.html` | «sí que entren a 1r de Batxillerat. fes-ho» | Fill the «Potència» tab (today «Aquesta activitat està en construcció»): binomial ↔ polar (modulus and argument in the right quadrant), product and quotient in polar, De Moivre, n-th roots drawn on the plane (the shared grid can help). Errors: argument from arctan alone (wrong quadrant); raising the modulus but not multiplying the argument. Batx → no code. **Decided 21/11 (David, review artifact «Complexos, forma polar i potències (21)»):** all five parts plus «Tot barrejat» (A1); two tabs, «Forma polar» (bin→pol, pol→bin, product/quotient) and «Potències i arrels» (De Moivre, roots) (A2); degrees only, never radians (A3); both levels, exact (30°/45°, c√s) and calculator (2 decimals) (A4); step by step (B1); r_θ (B2); the complex plane everywhere (B3); roots tapped on the circle (B4); errors (1)–(7) (C1); free practice like the other tabs (D1). Built 21/11. |
| 22 | **B10 Logaritmes i equacions no lineals** (4t ESO–1r Batx), new page | «comença pel que tu vulguis» | Three blocks: logarithms (definition, log₂ 8 = 3 because 2³ = 8; properties); exponential, logarithmic and radical equations with **checking the solutions as a mandatory step**; quadratic and rational inequalities with the sign table (reuse B3's widget). The first block is free to choose. Errors: log(a + b) = log a + log b; keeping false solutions; x² > 4 → x > 2. **Decided 21/11 (David, review artifact «Logaritmes i equacions no lineals (22)» + question dialog):** `logaritmes.html` for blocks 1–2 and the inequalities as new types of `inequacions.html` (A1); `logaritmes.html` in the Batx menu, no code; the new inequality types keep the code IQ (A2); three deliveries 22a logarithms, 22b equations, 22c inequalities (A3); block 1: definition, exponential ↔ logarithmic form, properties (expand/condense, 4 options), computing with properties, and log/ln with the calculator (4 decimals); no change of base (B1, B2); block 2: levels 1 same base / simple log, 2 change of variable / log properties, 3 radical, plus exponential with logarithms and calculator (3^x = 7) (C1); mandatory checking only for logarithmic and radical (C2); the quadratic that appears: only its solutions (C3); block 3: steps as proposed, special cases at level 3 (D1, D2); errors as listed (E1); 5 questions, 10 − 2, levels 1–3 + progressive (E2). 22a built 21/11. **22b built 21/11:** six equation types (`js/logaritmes/equacions.js`): level 1 same base (4 options + x) and simple log (4 options + x + check); level 2 change of variable (equation in t, t₁/t₂ as a pair in any order, undo the change as 4 options: t ≤ 0 gives no x), log properties (one log, x₁/x₂, check both: one is always false) and aˣ = N with logarithms (4 options + x to 4 decimals); level 3 radical √(px + q) = x + c (square, x₁/x₂, check both; ~70 % one false). Checking step: 3 fixed options («Sí» or the reason it is not). Distractors that give the same solution are discarded. **22c built 22/11:** `js/inequacions/no-lineals.js`, seven types in three levels (1: x² + bx + c, x² ⊙ k², x² ⊙ ax; 2: (x − a)/(x − b) ⊙ 0, (x + p)/(x − q) ⊙ k; 3: x² + k and (x − a)² expanded). Steps (D1): all to one side if needed (4 options), the zeros (a pair in any order; numerator/denominator; 4 options at level 3), the shared sign table (integer test point + sign per interval, 0/∄ per point), the shared number line extended with segments (`svgRectaTrams` / `creaRectaTrams`, field type `trams`: tap segments and included points, or «Cap solució»), the solution set as 4 options (ℝ, ∅, {a}, unions). Zeros at distance ≥ 2 so every interval has an integer test point. The new error texts are `ERRORS_NL` (the first-degree `ERRORS_IQ` stay as they were). |

## Open points for David (ask with the question dialog when you reach them)

- Everything still open (work and decisions) is summarised in [`PENDING.md`](../../PENDING.md) at the root.

- Item order: free to change if David wants.

## Notes

- **UX priority devices (David, 2026-11-17): touch Chromebook, Lenovo laptop, Android tablet and iPad; the phone
  comes last.** Check layouts at 1366×768, 1024×768 and 820×1180 first.

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
