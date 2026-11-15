# «Resolució pas a pas» (pissarra animada): living state

Agent-facing memory between sessions. English. Update it in the same commit as any change to the feature.
How the engine works: [`MOTOR.md`](MOTOR.md). Where they disagree, this file wins (it records later decisions).

## Status (2026-11-15, stage 3 in progress)

| Wave | Part | Status |
|---|---|---|
| 0 | Engine ported (`js/pissarra/`, `css/pissarra.css`), demo page `pissarra-demo.html`, tests (`tests/pissarra.test.js`, `tests/navegador/prova-pissarra.js`, `check-repo.js` §9), index button | DONE |
| 1 | Pilot `prioritat` (1r–2n ESO), with the fading mode that is already there | DONE (2026-10-27); David tests it with a 1r ESO group |
| 2 | `equacions` (1r grau) | DONE (2026-10-27). Its fading mode is still pending (see «Wave 2») |
| 3 | `fraccions`: addition/subtraction and product/division | DONE (2026-10-27). Its fading mode is still pending (see «Wave 3») |
| 4 | `potencies` and `enters` (reuse the pilot) | PENDING |
| 5 | `sistemes-equacions` and `radicals` (3r–4t ESO) | PENDING |
| 6 | Batxillerat: `esglaonar-matriu` → `ruffini` → `complexos` (port `pau`'s `matrius.js` as needed) | PENDING |
| 7 | Optional: `mcd-mcm`, `inversa-matriu`, `derivades`/`integrals` («Mira com es fa») | PENDING |

After wave 1, David tests it with a 1r ESO group before the next waves. Waves 2 and 3 done at his request
(27/10/2026).

**Since 14/11/2026 the plan goes by the stages of the engine review** (David answered 42 points in the review
artifact; decisions below). David asked to go **step by step and human-in-the-loop**: before each stage the agent
says what it will do, after it shows how it turned out, and David tries it before the next one.

| Stage | Points | Status |
|---|---|---|
| 1 | Robustness and visual fidelity: R1 queue with recovery, R2 faithful ghosts, R3 warning boxes per run, R4 nothing changes size, R5 reduced motion and announcement | DONE (2026-11-14) |
| — | C4 keyed SVG elements (David: «implementa-la ja»), with the Pythagoras demo | DONE (2026-11-14) |
| 2 | Common base: A2 pure transition plan (`planifica`), A1 `historial()` for HTML and TeX together with D1 the step tree (detail on demand), A3 common test battery, C1 `reparteix` | DONE (2026-11-14) |
| 3 | «Vull més detall» on the current activities: D6 pilot `equacions`, then `fraccions` and `prioritat`; D2 accordion, D3 option (a), D4 free | IN PROGRESS: part 1 (`equacions` + the drawer) DONE 2026-11-15; next the player's button, then `fraccions` and `prioritat` |
| 4 | 1r–2n ESO: P8 `mcd-mcm`, X1 factor tree, P2 `enters`, P1 `potencies` | PENDING |
| 5 | Class use: U1 tap to finish + ↺ replay, U3 teacher mode (projector) | PENDING |
| 6 | 3r–4t ESO and Batxillerat: N1, P3, P4, N3, P5, P6, P7, N2, N4, N5, N6, X2, X3, P9, C2, C3 | PENDING |

## Decisions approved by the user

2026-10-27:
1. The plan above (waves 0–7) and the activity ranking (high fit: mechanical, symbolic, few reasoning;
   not for activities about reading graphs/figures, translating word problems, or choosing options;
   `gots-fitxes` is already manipulative and is not duplicated).
2. **Index button «Activar la resolució pas a pas»**: off by default and then everything works exactly as
   before. When on, the ESO and Batxillerat menus offer only the activities with the animated resolution
   (`pissarra: true` in `index.html` = `SUPORTA_PISSARRA`), and the link carries `pissarra=1`.
   Implementation details (agent): the button stays hidden while no activity has `pissarra: true`; a menu
   with no such activity says «Encara no n'hi ha cap» and disables «Copia»/«Obre»; the state is not
   remembered between visits (off on every load).
3. When the animation appears in an activity: (a) worked examples of the fading mode, (b) a correct step of
   the student; (c) «Mira com es fa» after an error comes later. The student sets the pace; nothing changes
   in questions, scores or codes.
4. The agent creates the PRs and merges them (permission given on 2026-10-27). No proposal for the
   department: David works on this alone.

2026-10-27 (after seeing wave 1 published):
5. **Index with the button on: lilac, no options.** Every blue becomes the equivalent lilac (the palette of
   `prioritat`: `#7c3aed`, hover `#6d28d9`, light `#f5f3ff`; the bluish greys become lilac greys; the shoe
   icon is hue-rotated), and **all configuration options disappear** (sessions, questions, errors, criterion,
   fixed session, fading, difficulty, modality…). The link is only `activity.html?pissarra=1`; the activity
   uses its `APP_CONFIG` defaults. Implemented with `body.resolucio-pas-a-pas` in `index.html`.
6. **All intermediate steps stay written** («vull que tots els passos intermitjos quedin escrits»): every
   step writes a NEW line below and the previous lines stay, as on the classroom board. An existing line may
   only get a mark or the trailing «=» when the next line is written; never transform a line in place.
   This is a general rule for every procedure of this repository (the demo was rewritten; `prioritat`'s
   table already worked this way). Tool: `formules.js` `historial()` (formerly `linies()`, still an alias).

2026-11-14 (engine review artifact, 42 points; letters = groups R robustness, A architecture, U use in class,
C new capabilities, P planned activities, X existing activities, N new activities, D detail on demand):
7. **Approved**: R1–R5, A1–A4, U1, U3, C1–C3, P1–P9, X1–X3, N1–N6, D1–D4, D6. **Rejected**: U2 adaptive speed
   (fixed speed), U4 generic «Mira com es fa» after an error (this cancels plan item (c) of 27/10), C5 dragging
   symbols, D5 automatic opening of the detail (**detail only on demand**). P9 (derivatives and integrals,
   «Mira com es fa») stays approved and will use the teacher-mode player and scripts (U3), not U4.
8. **No resizing** (R4): «no m'agrada que la taula o cap subfinestra s'eixampli i canviï la mida, perquè per a un
   humà és un mareig». General rule for every activity.
9. **Colour with restraint** (C3): colours only where they mean something, few marks at a time, no «festa de
   colors» that makes students think they are watching cartoons.
10. **Detail on demand** («Vull més detall», David's proposal of 14/11): a step can open into sub-steps
    (1, 2, 3, 4 → 1, 2a, 2b, 2c, 3, 4) with the same start and end; the accordion sits on a grey background with
    a small 3D effect (D2; mock-up in the review artifact); in the activities the student watches the detailed
    step and then answers (D3 option (a)); asking is free and marked in the session history, the verification
    code does not change (D4); pilot `equacions`.
11. Activity notes: P4 reduction first, always the same algorithm (equation 1 times the coefficient of
    equation 2, equation 2 times the opposite of the coefficient of equation 1, add; always x is
    eliminated, confirmed by David on 14/11); P5 one column per step by default, two times (multiply, add) with more
    detail; P7 the new matrix to the right with «~», algorithm from `js/esglaonar-matriu/esglaonar-matriu.js`;
    X2 both methods (reduction to the unit and a/b = c/x → a·x = b·c); N3 for incomplete equations the student
    chooses the short path or the formula; N4 a separate activity; N6 when a limit ends as k/0, decide the sign
    of each one-sided limit; A4 David will give access to `step-quiz/pau`.

2026-11-15 (start of stage 3):
12. **D3, how far the detail goes in an activity: up to just before the answer.** The sub-steps are written
    but not the line with the answer: the student still does the last computation (e.g. 2·3 = 6), answers,
    and then the step's line is written from the last line of the detail.
13. The player's «Vull més detall» button comes **after** `equacions` (the demo keeps its provisional
    checkbox until then).

## Technical decisions (agent)

- **ES modules, not the `pau` IIFEs.** This repository forbids shared globals (`tests/check-repo.js` §7) and
  Prettier formats `js/`, so the files cannot be byte-identical to `pau` anyway. Origin commit noted in
  `MOTOR.md` §7 for future syncs.
- **Board as a component.** `Motor.inicia` (page builder, editor, address) is not ported; activities embed
  `creaPissarra` in their own panel. The player (`creaReproductor`) is optional (the demo uses it; an
  activity may drive `seguent()` itself).
- **Width-only font fit**; the activity decides the board's height (CSS `max-height` → own scroll bar).
- **KaTeX lazily** (`carregaKatex()`), so a page without `?pissarra=1` loads nothing new; `css/pissarra.css`
  is linked always (all classes are `pis-` scoped: no visual change).
- **URL parameter `pissarra=1`** (not `modalitat`, which already means «Pas a pas» in `prioritat`; not
  `esvaiment`). The code (`EE`, results) does not record the mode: it is only visual.
- **Tests without dependencies in CI.** The Node test loads the vendored KaTeX to check every formula
  renders; the Playwright test runs locally / in the cloud sandbox and exits 0 when Playwright is missing
  (GitHub Actions only has Node).

## Wave 1: how `prioritat` uses the board (2026-10-27)

- `?pissarra=1` forces «Pas a pas» (like `?esvaiment=1`); the index hides the «Modalitat» row when the
  button is on. The student's interaction is unchanged (tap the operation, choose the result).
- The board has `marc: false` and **one HTML row**: the same «centrat» table as always
  (`Renderer.tableHtml(rows, { claus: true })`), so the student sees exactly the notation they know. Keys:
  token of line r = `r<r>c<c0>x<c1>`; once merged into line r + 1, its copy in line r becomes `s<r>…`; «=» of
  line r = `e<r>`, note = `n<r>`. `Renderer.fusioUltimaLinia(rows)` gives the fusion of the new line
  (the operation's tokens, plus the parentheses that fall, fly into the result; a power is one token).
  Every visible symbol is keyed, so the rows above stay still (no flicker).
- The controller (`pintaPissarra`) animates when the table has exactly one line more than the last one sent to
  the board (a correct step, a worked-example step, the correct step after an error); otherwise it shows the
  table at once (op chosen, red/green marks, the automatic completion after the last attempt). Renders are
  queued so an animation always finishes before the next one; taps on the operations are ignored while the
  board is animating. Speed: 1.6 (≈1.5 s) for the student's own step, 1 for worked/help steps.
- With the keys off (no `?pissarra=1`) the table HTML is byte-identical to before (tested on 2,400 tables).

## Wave 2: how `equacions` uses the board (2026-10-27)

- Refactor first, with a characterisation test: the generators and `determineSteps` moved from the controller
  to the pure `js/equacions/math-engine.js` (`generateEquation(opIndex, {nivell, leftToRight,
  totalOperations})`), the term HTML to `js/equacions/renderer.js`. The fingerprint of 7,200 seeded equations
  (steps and HTML included) was identical to the old code (`e12f22f1`).
- **Bug fixed in the old generator** (no `?nivell=`, the last equation of a session and those from the 7th on):
  the second retry loop of `genLegacy` could end with rC = lA, i.e. «3x + 4 = 3x + 4» (no single solution; the
  activity then asked for «the solution» after «4 = 4» and «0 = 0»). It happened in 0.56 % of the questions;
  comparing 60,000 questions seeded one by one (as fixed sessions do), only those 335 changed. New fingerprint
  `98bae53`; `tests/equacions.test.js` also checks that no equation lacks a single integer solution.
- The history is one HTML row of a frameless board, written since stage 2 with `formules.js` `historial()`
  (`Renderer.historiaNova(eq)`, `Renderer.escriuPas(H, pas, final)`, painter `Renderer.liniaHtml`): every
  correct step appends a line and animates (speed 1.6); the work line (with the input) hides during the
  animation and the next step appears when it ends. Piece ids: `<side><i><piece>` (canonical side even when the
  first line of «b = ax» is shown swapped; pieces s c x n a t m b z), «=» `q`; keys `e<r>k<id>`, copies
  `ec<r>k<id>`. What moves (`Renderer.moviments`, in the `historial()` format):
  distributive → the outer coefficient and the x travel to the x term, the inner number merges into the new
  constant; simplify / group → the joined terms merge into the new one (the first x travels when the new term
  has a coefficient); solve → the x travels, the coefficient and the right number merge into the solution.
  At most 6 pieces per step (≤ 3 terms).
- The fading mode for `equacions` (planned in `docs/esvaiment/STATE.md`) is NOT done: with the index button
  on there are no options (decision 5), so it is a separate feature for the normal links. The pure
  `math-engine.js` it needed now exists.

## Wave 3: how `fraccions` uses the board (2026-10-27)

- No refactor of the generator: the lines depend on the student's answers (the common denominator they chose,
  a simplification in several goes), so the controller builds each line from the values it has just checked
  and the pure `js/fraccions/renderer.js` turns the lines into HTML with keys and says what moves. Without
  `?pissarra=1` the controller writes the lines exactly as before (old code path untouched); fixed sessions
  cannot change (no new `Math.random`, generator untouched).
- The expression is one HTML row of a frameless board, written since stage 2 with `formules.js` `historial()`
  (`Renderer.historiaNova(termes)`, `Renderer.escriuPas(H, termes, pas)`), speed 1.6; while a line
  animates the step panel hides (`quanAcabi`) and the next step (or the «Correcte!» overlay) appears when it
  ends; the first step of an operation also waits until its expression is drawn. Browser-test lesson: the
  activity focuses the first input 50 ms after a step appears, so a test that types at once can put a digit
  in the wrong box (`prova-pissarra.js` §8 waits 100 ms). A line is `{ termes, pas }`: fractions `{n, d}` (`fr: true` writes «n/1» as a fraction, as the old
  inverse did) and signs; the first line ends with «=», the others start with it. Piece ids `<i><piece>`
  (pieces n, d, o), «=» `q`; keys `e<r>k<id>`, copies `ec<r>k<id>`. What moves (`Renderer.moviments`, in the
  `historial()` format: one old piece → `mou`, several → `fusiona`): `amplia` → each fraction
  travels and changes into its equivalent; `inverteix` → the first fraction travels, «:» becomes «·», the
  numerator and denominator of the second cross; `opera` (sum, difference or product) → numerators and sign
  merge into the new numerator, denominators into the new denominator; `simplifica` → the fraction travels and
  changes. When the result is an integer, everything merges into it. At most 5 pieces per step.
- `tests/fraccions.test.js`: 6,000 operations solved along random paths (equal or different denominators, any
  common multiple, product, division, simplification in one or two goes, integer results, the irreducible
  result at once): about 14,800 animations pass the script check, every line shown has the value of the
  operation, without keys the HTML of each line is the old one (since stage 2 with the common battery
  `tests/pissarra-activitat.js`).
- The fading mode for `fraccions` (planned in `docs/esvaiment/STATE.md`) is NOT done, for the same reason as
  `equacions` (decision 5).

## Accumulating lines (2026-10-27, after decision 6)

- `linies(g, primeraFila)` (since stage 2 an alias of `historial(g, {fila})`) writes line r in row
  `primeraFila + r`. Pieces `P(id, tex, marca)`,
  `grup(peces, marca)`, `fraccio(num, den)`. A new line declares what comes from the previous one:
  `mou` (travels, may change, e.g. «+3» → «−3»), `fusiona` (several fly into one). Keys:
  `L<r>k<id>`; once a piece has gone down, its copy in line r is `Lc<r>k<id>`.
- Engine support: `pas.copia = {new: old}` (the copy is shown in place the whole time while the original
  flies; a copy pairs with its original without using it up); rows whose HTML is equal except for the keys
  stay still (no cross-fade, no flicker of fraction bars); other rows cross-fade without the mid-way dip
  (the new one appears before the old one leaves). `prioritat` uses `copia` too
  (`Renderer.copiesUltimaLinia`).
- Rows have a little more vertical padding (`.pis-fila` 0.3em) so stacked fractions do not touch.
- The board reserves the height of all the lines of a script from the first step (rows used later keep
  their height, as in `pau`): nothing jumps while lines are added.

## Stage 1 and C4: how they were done (2026-11-14)

- **R1** `encua(pas, {anima, velocitat})` + `enAcabar()` in `pissarra.js`; the controllers of `prioritat`,
  `equacions` and `fraccions` lost their own `cuaPissarra`. Before, one rejected promise blocked the chain for
  good (verified: one injected exception left `equacions` with the work line hidden forever).
- **R2** `fantasma()` copies `ESTILS_CAIXA` from the computed style; a box that is not `inline` and whose size
  comes from its place gets the original's width and height (inline boxes are left alone: making them
  inline-block would move them off the baseline).
- **R3** `trossosDeFusio()`: the sources of a fusion go into one box only if the union (with its 4 px margin)
  covers no other keyed symbol.
- **R4** `prioritat`: every operator and power sits in a box the size of a button (`span.tok-lloc` vs
  `button.tok-btn`, same min-width/padding/border; note `font: inherit` resets `line-height`, so it is set again
  after it) and the last line has an invisible «=» cell (`td.igual.reserva`), so the table width never changes
  (it went 155 → 114 → 167 px in one step). `equacions` and `fraccions` keep the work panel's height while the
  line animates (`min-height`, released when the next step shows).
- **R5** reduced motion → `fonAlLloc()` (no ghosts; changed rows fade in over the old ones); `pas.anunci` →
  `.pis-anunci` (aria-live, visually hidden); the three controllers send «Línia nova: …» (`Strings.toText`,
  `Renderer.textLinia`).
- **C4** an element of an SVG row with `data-k` gets a ghost that carries its own `<svg>` (viewBox = its bbox,
  same size as its screen rect, no `katex` class); sizes compare by `midaVisual()` (font size × screen CTM scale).
  `linies()` gained `extra` and `L.clau(r, id)` for symbols from outside the lines; demo `pitagores`.

## Stage 2: how it was done (2026-11-14)

- **A2** `js/pissarra/pla.js` `planifica(keysA, keysB, pas)` (pure): the pairing that used to live inside
  `transicio()`. `transicio()` only measures and draws the plan; no visible change. Unit tests in Node
  (`pissarra.test.js` §4b).
- **C1** `pas.reparteix = {old: [news]}`: each new key pairs with the old one, so `transicio()` makes one
  ghost per destination with no other change (the loop over `parelles` already cloned the old element per
  pair). The old symbol is used up (it cannot also merge or be renamed) but a copy of it (`copia`) can stay.
  Rules in `comprovaGuio`. A destination may also be a fusion target (in the demo the 2 flies to the 6 while
  the 3 merges into it).
- **A1** `formules.js` `historial(g, {fila, prefix, pinta, envolta, oberts})`: one engine for the lines that stay
  written. `pintaTex` is the default painter (what `linies()` did); an activity passes its own HTML painter
  `(line, clauDe, classe) → html` and `envolta` (all lines in one row). Line classes belong to the history
  (`classe`, `classeAnterior`, `final`). `escriu` returns the step, so the controllers of `equacions` and
  `fraccions` only queue it (`pintaPas`). Their renderers lost `baixades`, `historiaHtml` and
  `animacioUltimaLinia` (≈60 lines each); `moviments` now returns `{mou, fusiona}`. Without keys the HTML is
  byte-identical (tested on 2,000 equations and 6,000 operations). Keys changed from `e<r>L0x`/`f<r>…` to
  `e<r>kL0x`/`ec<r>k…` (nothing outside the renderers depends on them).
- **D1** detail on demand in `historial()` (MOTOR.md §3b): `detall: D => {…}` on a step, `D.acaba()` writes the
  closed line (so the invariant holds by construction), ids numbered as in the closed view, metadata `id`,
  `pare`, `pares`, `tanca`, `teDetall`, `estat`. `comprovaDetall` (comprova.js) opens each step (nested ones
  inside their parent) and all at once and compares the boards level by level. Demo `parentesis`
  (2(x + 3) = 14): 6 steps closed, 10 with details on steps 2 (distributive, the 2 spread to both terms),
  3 (subtract 6 from both sides, 6 − 6 = 0, adding 0 changes nothing) and 5 (divide both sides by 2, simplify);
  provisional checkbox «Mostra'l amb tot el detall» (`?detall=1`) on the demo page until stage 3.
- **A3** `tests/pissarra-activitat.js` `provaActivitat`: the common battery (script check, at least one and at
  most `maxPeces` moved pieces per step, truth of every line of every step, classic HTML without keys, every
  detail view). `equacions.test.js` §2 and `fraccions.test.js` use it; `pissarra.test.js` §4c runs it on the
  demo with detail.
- Lesson: the first nested-detail test failed because a sub-step both merged and moved the same piece —
  `comprovaGuio` caught the script error, as intended; and «a detail adds a step» has to count all
  descendants (`pares`), not only direct children, when nested details are open.

## Stage 3, part 1: «Vull més detall» in `equacions` (2026-11-15)

- Engine: `H.obre(line, op)` opens a step now and returns `{ escriu, canvia, obre, acaba }` (`acaba` when the
  student answers; the step numbering is settled there); the drawer of an opened step (D2: grey, sunken,
  activity colour on the left edge, 3D tilt on `::before` when it first appears and the layer becomes
  visible, class `pis-vista`); the caption of each sub-step under its line. TeX rows: class `detall`.
- `js/equacions/renderer.js` `detallPas(pas)` (pure): distributive → `c·x + c·n` with negative factors in
  parentheses, `(−2)·x + (−2)·3` (the outer number is spread to both products, its «−» goes with the first);
  joining x terms → `(3 + 2)x`; moving the x terms → «Resta 2x als dos membres» (the 2x spread to its place
  and both new terms), `2x − 2x = 0`, «Sumar 0 no canvia res» (only if something else is on that side);
  moving the numbers → the same with the left number; isolating x → `3x : 3 = 6 : 3` (the divisor spread from
  the coefficient; with −x, from the «−»), `3x : 3 = x`. Joining numbers has no detail. Each generator also
  gives the closing moves (from the last sub-line to the step's line). As in the closed steps, only the
  symbols that do the change fly; the rest of the new line appears. Titles «Detall: …» (the step
  instructions of `group_x`, `group_num`, `solve` are questions, so the drawer gets its own title).
- `escriuPas` carries the detail (`teDetall`; opened when the id is in `oberts`, which only the tests use),
  `obreDetall(H, pas, final)` is what the controller calls when the student asks: all sub-steps are written
  to the history at once and the controller shows them one per click (speed 1); if the student answers
  before seeing them all, the last sub-step is shown without animation and the closing line animates from it.
- Controller: the button «Vull més detall» (then «Continua el detall», hidden when none are left) under the
  step instruction, only with `?pissarra=1` and when the step has detail. With the board on, the button
  always keeps its place (`visibility: hidden` when not available), so the step panel never changes size
  (the first browser run caught it shrinking 37 px during the line animation); free (no attempt or point lost);
  the session history records «Pas k de l'equació (amb detall)»; the verification code is unchanged.
  `.eq-linies > .pis-calaix:last-child` lines read like the work line; once the step is answered, the drawer
  lines turn grey like the rest of the history.
- Tests: `equacions.test.js` §2 gives the common battery a `vista` (`historiaNova(eq, { oberts })`), so it
  checks every detail view with `comprovaDetall` and the all-opened view's lines (2,000 equations, ≈181,000
  true lines, at most 7 moved pieces per step); the evaluator reads `·` and `:`. `pissarra.test.js` §4c tests
  `obre()` and the drawer. Browser §7: «Vull més detall» on every step of two level-3 equations at mobile size
  (one sub-line per click inside the drawer, the button hides, the answer adds one top-level line, full points).

## Known limits

- An SVG element that travels must not be rotated or skewed (its ghost maps the bbox with a uniform scale).
- A keyed phrase in a text row that wraps over two lines cross-fades in place (no ghost).
- `fraccions`' steps have different heights: the work panel keeps its height during an animation, but it
  still changes from one kind of step to another.
