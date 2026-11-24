# «Resolució pas a pas» — the animated board (pissarra) in `operacions`

**Audience: an AI that adds the animated step-by-step resolution to an activity of this repository.**
Talk to the user (David) in Catalan; everything the student sees is Catalan; this file is English.
Living state, decisions and the rollout plan: [`STATE.md`](STATE.md) (it wins over this file).

---

## 1. The one idea

> **A procedure is a pure function `data → list of board states`. The board animates the difference
> between two consecutive states, using *keys* as the identity of each symbol.**

- A **board state** (a *pas*) is N rows. A row is TeX (rendered by KaTeX), a text paragraph (starts with
  `§`), an SVG sketch (starts with `<svg`: it cross-fades, but its elements with `data-k`, e.g. a `<text>`,
  travel like symbols, so a number can fly from a figure into a formula) or **HTML** (starts with any other `<`: the
  activity's own markup, inserted as is; its elements with `data-k="KEY"` move like symbols — this is how
  an activity animates the work area it already had, e.g. `prioritat`'s table). Every symbol that must be *followed* from one step to the next
  is wrapped `\htmlData{k=KEY}{…}` (helpers `clau`, `op`, `rel` in `js/pissarra/formules.js`).
- From state A to state B the board finds every key in both, measures where KaTeX drew it, and moves it
  there. Same key → the symbol travels (and cross-fades if its content changed); keys declared in
  `fusiona: {new: ['old1', 'old2']}` fly into the new one; `reparteix: {old: ['new1', 'new2']}` sends one
  ghost of the old symbol to each new one (the 2 of 2(x + 3) going to both terms); unmatched → fade out /
  fade in. Which new symbol is which old one is decided by the pure `planifica()` (`js/pissarra/pla.js`)
  before anything is measured. Light-blue boxes
  first mark what will change: one box per run of adjacent sources, and a box never covers a symbol that
  stays. Nothing is positioned by hand. Each travelling symbol is a *ghost* (a clone) that copies the
  computed box styles of the original (padding, borders, line-height…), so a style that came from a
  contextual selector of the activity is not lost (it used to move the «=» of `equacions` 6 px).
- So **the author never programs animation**: they write, like a teacher at the blackboard, *what the board
  looks like after each step* plus one short caption, and choose keys well.
- **David's rule (27/10/2026): all intermediate steps stay written.** Each step writes a new line below;
  previous lines stay (they may only get a mark, or the trailing «=» when the next line is written). Use
  `historial()` (§3), which handles the keys for TeX and for an activity's own HTML: a copy of each piece
  that changes flies down from the previous line, which stays as it was.
- **Detail on demand (David's proposal, 14/11/2026).** A step may carry sub-steps
  (1, 2, 3, 4 → 1, 2a, 2b, 2c, 3, 4). An opened step only inserts lines between: its last sub-step writes
  exactly the line of the closed step, and the rest of the script does not change (§3b, checked by
  `comprovaDetall`). In the player, «Vull més detall» after seeing a step: its line goes down in grey as the
  target and the sub-steps are written above it, in a drawer, one per «Pas següent».
- **Written lines keep their keys forever** (since 15/11/2026): a key is `<prefix><id of the line>k<piece>`, so
  the same line has the same keys in every view (a step opened or closed) and what goes down to a new line is a
  copy that flies from the line that stays (`reanomena`, `reparteix` or `fusiona` from a key that is still in
  the new state). That is what lets a line slide down when a step opens, and back up when it folds.

This is the engine of the PAU site (`step-quiz/pau`, `procediments/`; read its `graspable-formulae.md` and
`INSIGHTS.md` for the full story and the lessons learned there), ported to this repository.

## 2. Files

| File | What it is |
|---|---|
| `js/pissarra/formules.js` | Pure. Keys (`clau`, `marca`, `op`, `rel`, `marcat`, `tatxa`, `MARQUES`), text rows (`filaText`, `frase`), long rows (`ampleTex`, `enLinies`), **lines that stay written**: `historial(g, {fila, prefix, pinta, envolta, calaix, oberts})` (TeX by default with `pintaTex`, or the activity's HTML; detail on demand, `H.obre()`, the drawer `calaixHtml`), pieces `P`, `grup`, `fraccio`; `linies(g, fila, prefix)` is the older name of the TeX case. The step builder `guio(n)`. |
| `js/pissarra/pla.js` | Pure. `planifica(keysA, keysB, pas)` → `{parelles, copies, repartides, desti, volades, velles, noves}`: which new symbol is which old one (same key, `reanomena`, `copia`, `reparteix`; a copy when the old one stays), where each disappearing symbol merges, which ghosts fly into a symbol and merge (`volades`: from a symbol that stays, or into one that was already there), what fades and what appears. Used by `pissarra.js`, unit-tested in Node. |
| `js/pissarra/comprova.js` | Pure, for tests. `comprovaGuio(passos, nFiles, nom, {text})` → list of structural errors; `comprovaDetall(fesGuio, nFiles, nom, {text})` → the detail-on-demand rule over every view; `textPla(tex)` → plain text that can be evaluated (also `\Delta`, `\Omega`, `\eta`, `\circ`, `\Bigl`, `\Bigr`); `clausDe(tex)`. |
| `js/pissarra/pissarra.js` | DOM. `creaPissarra(container, {files, marc})` → controller. Script mode: `carrega(passos)`, `seguent()`, `salta(i)`, `repeteix()`, `afanya()` (finish the running animation at once: waits resolve, animations `finish()`, the remaining phases last 1 ms; false if idle), `canviaGuio(nous, i, {senseVols})` (another script, e.g. with a step opened, animated to its step i). The CSS custom property `--pis-escala` on the board (e.g. a teacher mode) multiplies the base TeX size. Free mode (the activity decides each state from what the student does): **`encua(pas, {anima, velocitat})`** (the queue: one paint at a time; it never blocks — if an animation throws, it logs, shows the step without animation and the activity goes on) and `enAcabar()` (a Promise for everything queued so far); `mostraPas(pas)` / `animaPas(pas)` are the unqueued primitives. Both modes: `velocitat(v)`, `escolta(f)`, `pas`, `total`, `ocupat`, `passos`, `element`; `pas.anunci` (text) is read by an aria-live region once the step shows. `marc: false` hides the frame and dotted background (only the animations show). With `prefers-reduced-motion` no symbol travels: changed rows fade in place. Also `carregaKatex()` (lazy-loads `vendor/katex-0.16.11` once), `textAmbFormules(text)` (captions), `element()`. |
| `js/pissarra/reproductor.js` | DOM. `creaReproductor(container, pissarra, {reprodueix, punts, velocitat, teclat, dalt, detall})`: restart / previous / play / next buttons, one dot per step (smaller for sub-steps), speed, step caption («Pas 2b de 6») with a ↺ that replays the current step; a click on the board finishes the running step (`afanya`); keys (option `teclat`): Space (stop playback, else finish the step, else play), ←/→ and PageUp/PageDown (presenter remotes; «next» first finishes a running step); and with `detall: oberts => passos` the «Vull més detall» / «Menys detall» button and a «▴ Plega» button on every open drawer; `carrega(passos or oberts => passos)` loads a script or an exercise with detail. |
| `js/resolucio/activitats.js` | **The single list** of the activities that have scenario B (`ACTIVITATS`: `tema`, `nom`, `frase`, `exemple` (TeX for the portal card), `pagina`, `nivells`, `carrega`, optional `enllac`) and the portal's block order (`TEMES`). Nothing else lists them (`js/pissarra/mode.js` and `pissarra: true` in `index.html` were removed on 24/11/2026). Activities import nothing from `js/pissarra/`. |
| `resolucio.html`, `js/resolucio/resolucio.js`, `css/resolucio.css` | Scenario B: without parameters, the portal (one card per activity); with `?activitat=`, watch an exercise being solved (§4). |
| `js/equacions/resolucio.js` | The pure procedure of `equacions` for scenario B (TeX script, captions, detail of each step). |
| `js/prioritat/resolucio.js` | The pure procedure of `prioritat` for scenario B: the activity's centred table as one HTML row (`historial` with `pinta` = one `<tr>` per line, keys = the statement columns `c<c0>x<c1>`, `e` for «=»), one operation per step with the reason (`motiuPas`); detail «per què aquesta operació» = a mark-only sub-step (`D.canvia`, class `dest`) and `D.acaba`; 5 levels grouping the generator's 10. |
| `js/cilindres/resolucio.js` | The pure procedure of «Cilindres amb un full» for scenario B (exported as `ResolucioCF`: the test loader, `tests/harness.js`, runs every module in one scope, so two `Resolucio` would clash): the activity's figure as the first row (keyed side labels), then per cylinder folding (numbers fly from the sheet), radius (detail on demand), base area, volume; then which holds more and the capacities in mL. |
| `js/inequacions/resolucio.js` | The pure procedure of first-degree `inequacions` for scenario B (exported as `ResolucioIQ`): the inequality written as an `equacions` equation and solved with its engine, pieces, moves and detail; the inequality sign on piece `q` (flies and changes, marked `tria`, when dividing by a negative); mirrored lines when x is on the right, then «4 > x → x < 4»; level 4's denominators step; final rows: number line (SVG, keyed label) and interval. |
| `js/formules-steam/resolucio.js` | The pure procedure of `formules-steam` for scenario B: own `pinta` over a tiny piece language (`{id, tex, tipus}`, `{fr}`, `{arrel}`, `{quad}`, `{raw}`); piece ids from a `WeakMap` node → number, so a node keeps its id on every line (data numbers and units take their letter's number); numbers first, then letters; flipping and the unit line are steps of their own; no detail yet (levels 1–4 as the activity). |
| `js/fraccions/resolucio.js` | The pure procedure of `fraccions` for scenario B: a chain of equalities in TeX (common denominator, operate, simplify; levels 1–4), with detail for the common denominator (lcm by multiples of the larger denominator, then each fraction amplified on its own line), simplifying (gcd, then both divisions) and dividing (invert the second fraction). Side computations (lcm, gcd, amplifying) do not start with «=». |
| `js/pissarra/demo.js`, `demo-pagina.js`, `pissarra-demo.html` | Five model scripts (order of operations, a linear equation, a sum of fractions, Pythagoras: the letters and the legs fly from an SVG triangle into the formula, and 2(x + 3) = 14 with `reparteix` and detail on demand on steps 2, 3 and 5, opened with the player's button) and the demo page. |
| `css/pissarra.css` | The engine's look. Every class starts with `pis-`; row classes from procedures (`final`, `separat`, `destacat`, `text`, `figura`, `detall`) only apply inside `.pis-fila`. Colour = the activity's `--primary` / `--primary-light`. The detail drawer: `.pis-calaix*` and `.pis-fila.detall`. Hover state of every control on a light surface: `--pis-cat-fons` background + `--pis-cat` border. Speed: three joined buttons (`.pis-velocitat-tria`, a radiogroup). |
| `css/pissarra-figures.css` | Activity-specific figures and tables inside the board (the intervals' number line `.jp-r-*`, the sheet and cylinders `.jp-cf-*`, `prioritat`'s centred table): the engine CSS knows no activity. Loaded by `resolucio.html` and `pissarra-demo.html`. |
| `tests/pissarra.test.js` | Node tests (see §6). |
| `tests/pissarra-activitat.js` | The common test battery of an activity's board (`provaActivitat`, see §6). |
| `tests/navegador/prova-pissarra.js` | Playwright test of the demo page, the index button, the portal and every resolution page (skipped when Playwright is missing). |

## 3. A step and a script

The normal way (lines that stay written, the rule in §1) is `historial()`:

```js
import { guio, historial, P, grup } from '../pissarra/formules.js';
const g = guio(3);                                    // 3 lines → 3 rows
const H = historial(g);                               // TeX, line r in row r
const igual = P('q', '=');
const l0 = [P('a', '3'), P('s', '+'), P('b', '4'), P('m', '\\cdot'), P('c', '2')];
H.escriu(l0, 'Has de calcular $3 + 4 \\cdot 2$.');
H.canvia([P('a', '3'), P('s', '+'), grup([P('b', '4'), P('m', '\\cdot'), P('c', '2')], 'actual')], 'Primer, la multiplicació.');
const l1 = [P('a', '3'), P('s', '+'), P('p', '8')];
H.escriu(l1, '$4 \\cdot 2 = 8$.', { fusiona: { p: ['b', 'm', 'c'] }, anterior: [...l0, igual] });
H.escriu([P('r', '11')], 'Ara la suma.', { fusiona: { r: ['a', 's', 'p'] }, anterior: [...l1, igual], final: true });
```

`escriu(line, text, options)` writes a new line and **returns the step**. Options, all by piece id (unique
within a line): `mou: {new: old}` (travels, may change, e.g. «+3» → «−3»), `fusiona: {new: [olds]}`,
`reparteix: {old: [news]}`; the other pieces of the new line appear, and the previous line stays as it was
(what flies is a copy of each old piece). An old id `'id@k'` is piece `id` of the line written k lines above
(`id@1` = `id`): e.g. a detail line that computes something on the side (mcm(6, 9) = 18) and then takes
numbers from the statement again (`fraccions`: `{ pn: 'an@2' }`); a missing line throws. `anterior: line` changes the previous line at the same time (the
trailing «=»); `classe` is the class of the new line and `classeAnterior` the new class of the previous one
(`final: true` = `classe: 'final'`); `cursor` and `anunci` pass through; `extra: {reanomena, copia}` for
symbols from outside the lines (an SVG figure; `H.clau(r, id)` is the key piece `id` will have in line r).
`canvia(line, text, {classe})` rewrites the last line in place (marks only). Also `H.nombre`, `H.ultima`
(`{linia, classe}`), `H.passos`. Keys are permanent: piece `id` of a line → `<prefix><ID>k<id>`, where ID is
the id of the step that wrote the line, upper-cased (`L3kx`, `E2Akc1`; the closing line of an opened step has
the id of the closed step), so a line has the same keys in every view. `H.clau(r, id)` gives the key of piece
`id` in line r (r = `H.nombre`: the line the next step will write). Option `objectiu: true`: while an opened step
is being detailed, its line is drawn in grey below the drawer (row class `objectiu`, or `pis-objectiu` in an
HTML row) with its final keys, so `D.acaba()` turns it normal while the sub-line's pieces fly into it.

**An HTML row** (all the lines in one row of the board): give the painter `(linia, clauDe, classe, {nivell,
text}) → html` (any line object; `clauDe(id)` the key for `data-k`, null for the classic HTML) and
`envolta(textos) → html`; the lines of an opened step go into `calaix(linies, {id, titol, nou})`. Scenario B of
`prioritat` uses it: each line is a `<tr>` of the centred table and `envolta` wraps them in the `<table>`; its
detail writes no line (`D.canvia` highlights the operation, then `D.acaba`), so the drawer stays empty. Scenario B
of `equacions` and `fraccions` writes TeX (`pintaTex` in each `js/<activity>/resolucio.js`).

Low level (what `historial()` writes for you): set `g.files[i]` to keyed TeX (`clau`, `op`, `rel`) and call
`g.afegeix(text, {fusiona, reanomena, reparteix, copia, cursor})`; `g.classes[i] = 'final'` highlights the
result row. Writing a row in place (instead of a new line) is only for marks.

Step object: `{files, classes, text, reanomena?, fusiona?, reparteix?, copia?, cursor?, anunci?}`
(`copia: {new: old}` = a copy of a symbol that stays where it is; `reparteix: {old: [news]}` = one old symbol
flies to several places; `cursor: {clic: 'k'}` or `{arrossega: 'k', fins: 'k2'}`). Steps written by
`historial()` also carry metadata for the tests and the stage-3 interface: `id`, `estat`, and with detail
`teDetall`, `pare`, `pares`, `tanca` (§3b). Rules (all checked by `comprovaGuio`): a key matches
`/^[A-Za-z][A-Za-z0-9]*$/` and is **unique within a step across all rows**; every source of a move (`reanomena`,
`fusiona`, `reparteix`, `copia`) is in A and every target in B; a source that is still in B stays where it is
and what flies is a copy (it may move, merge and spread at once), while a source that disappears is used only
once; a target that was already in A receives a ghost that merges into it (`volades` in `pla.js`, e.g. the grey
target line of an opened step); a spread destination comes from one spread only and is not also renamed or a
copy; cursor keys exist; the first step animates nothing; no step identical to the previous one
(`guio` drops it, so optional steps need no `if`). Rows never used by any step are hidden.

### 3b. Detail on demand («Vull més detall»)

```js
function passos({ oberts = new Set() } = {}) {
    const g = guio(10);                              // rows for the view with every step opened
    const H = historial(g, { oberts });
    H.escriu(l0, "Resol l'equació $2(x + 3) = 14$.");
    H.escriu(l1, 'Aplica la propietat distributiva…', {
        mou: {…}, reparteix: { c: ['c', 'n'] }, fusiona: { n: ['t'] },
        detall: D => {
            D.escriu(l1a, 'Multiplica el $2$ per cada terme…', { reparteix: { c: ['c1', 'c2'] }, mou: {…} });
            D.acaba('Fes les multiplicacions…', { mou: {…}, fusiona: { n: ['c2', 'm2', 't'] } }); // writes l1
        },
    });
    …
    return g.passos;
}
```

- A step with `detall` whose `id` is in `oberts` is written as its sub-steps: `D.escriu`, `D.canvia` (they may
  carry their own `detall`) and, last, `D.acaba(text, options)`, which writes **the closed step's line with its
  class** (its options animate from the last sub-line). So an opened step only inserts lines between and the
  following steps are identical. A closed step carries `teDetall: true`.
- The first sub-step that writes does to the previous line what the step does (`anterior`, `classeAnterior`),
  unless it says otherwise. `cursor` and `extra` are not inherited.
- Ids: top-level steps are numbered as in the closed view (`'1'`, `'2'`…, whatever is opened; or the `id`
  option); sub-steps `'2a'`, `'2b'`…, theirs `'2a1'`, `'2a2'`…; `pare` is the opened step, `pares` all the
  opened steps around it, `tanca` marks the sub-step of `D.acaba`. `estat` = the lines written after the step
  without row keys (`{nivell, signatura}`; lines of a detail are one level deeper).
- `comprovaDetall(passos, nFiles, nom)` opens each step with detail (sub-steps inside their parent) and all at
  once, and checks every view with `comprovaGuio`, that each opened step ends with `D.acaba()`, adds at least
  one sub-step, and that every step of the closed view is there with the same caption and the same board
  (ignoring the detail's lines).
- **Opening now, closing later** (an activity waiting for the student's answer): `const D = H.obre(line,
  { titol, classe, classeAnterior })` opens a step with the next id and returns `{ escriu, canvia, obre,
  acaba }`; write the sub-steps when the student asks, and call `D.acaba(text, moves)` when they answer
  (numbering is fixed at `acaba`). `escriu(…, { detall })` with the id in `oberts` is the same thing in one go.
- **The drawer (D2).** The lines of an opened step are drawn in a grey, sunken drawer with the activity
  colour on its left edge, which opens with a small 3D tilt the first time it appears. One HTML row
  (`envolta`): the history groups them into `calaix(lines, { id, titol, nou })` (default `calaixHtml`:
  `.pis-calaix` › `.pis-calaix-titol` + one `.pis-calaix-pas` per line, holding the line and its caption
  `.pis-calaix-nota`); the title is the step's text or `op.titol`. One row per line (TeX): the rows get the
  class `detall` and the adjacent ones form the drawer (CSS sibling selectors, so a row's class does not
  change when a line is added below it). The background and the tilt live on `::before`, so measured
  symbol positions are never transformed; the tilt starts when the layer becomes visible (`pis-vista`,
  added by `pissarra.js` in `mostra`, `transicio` and `fonAlLloc`) and is off with reduced motion. The
  painter receives `{ nivell, text }` as a 4th argument.
- **The player** (`creaReproductor(…, { detall })` or `reproductor.carrega(oberts => passos)`): next to the
  caption, «Vull més detall» on a step that has detail (`teDetall`). It opens that step
  (`pissarra.canviaGuio(nous, first sub-step)`): the step's line, already on the board, slides down and turns
  grey (same keys, `objectiu`), the drawer opens above it with the first sub-line, and each «Pas següent» writes
  the next one; the sub-step of `D.acaba()` turns the grey line normal. While inside the detail the button says
  «Menys detall» and folds it back to the closed step (`canviaGuio(…, { senseVols: true })`: only what is in
  both moves). Since 24/11/2026 every open drawer also carries a **«▴ Plega»** button at its top-right corner,
  usable from any later step: the player removes that id (and the ids inside it) from `oberts` and calls
  `canviaGuio(nous, j, { senseVols: true })`, where `j` is the same step id in the new script (or the opened step,
  if the current step is inside that detail). A folded detail stays folded until «Vull més detall» is asked again.
  The buttons live in a `.pis-plecs` layer inside `.pis-escenari` (they scroll with the board), are redrawn on
  every `escolta` call and on resize, and are hidden while a step animates. How the player finds the drawers:
  `historial()` adds the class `plega:<id>` to the first TeX row of each drawer (one per drawer starting on that
  row), and `calaixHtml()` puts `data-plega="<id>"` on the `.pis-calaix` of HTML rows. Activities whose detail is
  not a drawer (e.g. `prioritat`, which highlights the operation) get no «Plega»; «Menys detall» still works
  inside the detail. Used by `resolucio.html` (scenario B, §4) and the demo.
- **Trailing empty rows** of a step get `pis-buida` (`display: none`, `dibuixaCapa`): the board grows as lines are
  written instead of reserving the height of the whole script from step 1, so the scrollbar only appears when
  what is written does not fit (24/11/2026). Empty rows in the middle keep their height.

Marks (coloured backgrounds; meanings never change): `mes` green = chosen/positive, `menys` red =
removed/negative, `tria` yellow = added/being checked, `actual` lilac = being computed now, `solucio` lilac =
solutions, `cami0/1/2` one colour per tree path. `marca(tex, m)` colours a group without a key.

## 4. Two scenarios: an activity gets a resolution page (scenario B)

**David's decision (15/11/2026): two independent scenarios.** **A**: the student does the exercise (the activity
as always, **no board inside it**). **B**: the student watches an exercise being solved, step by step, on the
board (like Graspable Math, but without manipulating): `resolucio.html?activitat=<page>&nivell=<n>`. Links: A →
B «Mira com es resol» (new tab, same level, a similar exercise, never the one being done), B → A «Ara fes-ho tu»
(same tab, same level). The index button «Resolució pas a pas» opens the portal (`resolucio.html` without
parameters) in a new tab: one card per activity, grouped by content block, with the example formula, a sentence,
level chips that link straight to a level, and «Copia l'enllaç» for teachers. Activities never import
`js/pissarra/` (`tests/check-repo.js` §9).

To give an activity its scenario B (reference: `equacions`):

1. **A pure procedure** `js/<activity>/resolucio.js` exporting `{ NIVELLS, exercici(nivell), passos(exercici,
   { oberts }), files(exercici) }`: `exercici` uses the activity's generator; `passos` builds the script with
   `guio(files)` + `historial(g, { pinta, oberts, objectiu: true })` (TeX lines, one per row, the step's caption in
   second person, `detall` on the steps that have it), so the player can open and fold steps. `equacions`: the
   steps are those of `math-engine.js` `determineSteps`; `pintaTex` turns the activity's term model into keyed
   TeX; `moviments` says which symbols fly; `detallPas` gives each step's sub-steps (§3b) and the caption of the
   closing computation (`textAcaba`).
2. **Register it** in `js/resolucio/activitats.js` (`tema`, `nom`, `frase`, `exemple`, `pagina`, named `nivells`,
   `carrega: () => import(…)`). That is all: the portal and the index button pick it up. check-repo §9 checks that
   the page and the procedure exist; `tests/pissarra.test.js` §6 that the card data is complete and KaTeX renders
   the example.
3. **The link from A**: an `<a target="_blank">` «Mira com es resol …» to `resolucio.html?activitat=…&nivell=…`
   (the activity computes the level).
4. **Tests** with the common battery (§6) over thousands of seeded exercises: every row true, every detail
   view, KaTeX, captions in second person, `final` on the last step.

`resolucio.html?activitat=…` (`js/resolucio/resolucio.js`, `css/resolucio.css`): the whole page takes the
activity's block colour (`tema-…` on `<html>`; one accent). A level dropdown (a listbox: arrows, Home/End, Enter,
Esc; it opens upwards when there is no room below) with «Un altre exercici» next to it as a filled action button,
«Ara fes-ho tu», the board (`creaPissarra(zona, { files: 40 })`) and the player with `teclat: true`. The page is a
one-screen app (`100dvh`): the board takes all the remaining height with its own scroll bar, so the player never
moves between steps — all CSS, no height computed in JS. The floating footer is `css/peu.css` (shared with
`index.html`).
`reproductor.carrega(oberts => procediment.passos(exercici, { oberts }))` gives the player the detail.

The free mode of the board (`encua`, `enAcabar`, `mostraPas`, `animaPas`) and the HTML rows stay in the engine
(no page uses them since 15/11/2026; the renderers' keyed functions of `prioritat` and `fraccions` are kept for
their future scenario B). **Nothing may change size while the student works** (David, 14/11/2026) still holds
for every activity.

## 5. Pedagogical conventions (David's, from `pau`, plus the ESO ones)

1. One idea per step; the caption says *what* and *why* (second person singular, «Calcula», «Passa…»;
   never «calculem», «fem», «tenim» — the test rejects it), the board shows *how*.
2. **Every line shown is true** (an identity, an equivalent equation, a true value); exact values, never
   rounded when an exact one exists.
3. Never write a symbol before saying what it means; write the bare equation first, then substitute.
4. Products with «·» before a parenthesis; words instead of abbreviations; answers as sentences.
5. No optional checks after the answer.
6. Methods are the ones taught in Catalan schools for that level.
7. **ESO 1r–2n (12–14 years): at most 2–3 symbols move in a step**, captions of one short sentence, the
   notation used in class. 3r–4t: steps with two movements are fine. Batxillerat: the full `pau` format.
8. **All intermediate steps stay written** (David, 27/10/2026): a new line per step, below the previous ones.

## 6. Tests — why there are no wrong lines

`tests/pissarra.test.js` (in `node tests/run-all.js`):
1. Unit tests of keys, `guio`, `historial` (TeX and HTML, permanent keys, spreads, classes, ids, `obre()`, the
   drawer, the grey target), `enLinies`, `comprovaGuio` (good and bad scripts, spreads and sources that stay
   included), `planifica` (copies of sources that stay, merge ghosts), the detail on demand (ids of every view,
   nested details, inherited `anterior`, `comprovaDetall` with a good script and four bad ones), `textPla`,
   and the registry of scenario B (card data, KaTeX of each example, each procedure's levels).
2. **Rules of every script** (array `GUIONS`): structural lint, KaTeX renders every formula without
   `katex-error` (vendored KaTeX loaded in Node), second person captions, last step has a `final` row.
3. **Truth of every line**: each TeX row → `textPla` → evaluated with an exact rational evaluator written in
   the test (independent of the engine) against the expected value (expressions) or solution (linear
   equations).

A script with detail is in `GUIONS` twice: closed and with every step opened.

**An activity's script: `tests/pissarra-activitat.js` `provaActivitat(nom, opcions)`** (A3, used by
`tests/equacions.test.js` §2 for scenario B and by `tests/fraccions.test.js`). Give it a generator of exercises —
each with its script `passos`, its `files` if they vary, `clasic[i]` (optional: the rows of step i without keys)
and, for detail on demand, `vista` (the `({oberts}) → passos` function) — plus `linies(row)` (how to split a row
into lines; one line per row by default), `veritat(line, ex)` (an independent model: '' if true), `maxPeces` and
`text`. It checks over thousands of seeded exercises: the whole script passes `comprovaGuio`, every step moves at
least one piece and at most `maxPeces`, every line shown at every step is true (also in the view with every step
opened), the classic HTML without keys if given, and every detail view passes `comprovaDetall`. About 20 lines
of test per activity; `equacions.test.js` adds KaTeX, second person and the `final` row. Extend the evaluator /
`textPla` only as needed (a TeX command unknown to `textPla` makes the test fail on purpose). Mutation check used
for the demos: changing a value, a sign, a fusion source or a caption to first person each makes a test fail.

`tests/navegador/prova-pissarra.js` (Playwright; skipped without it): every demo step ends with exactly the
step's keys and no leftover ghosts, at 1366×700 and 375×740, no horizontal overflow; the player's «Vull més
detall» / «Menys detall» on every step with detail (grey target, sub-steps in the drawer, keys after every step);
player buttons and keyboard; `carregaKatex()` on a page without KaTeX; the index button (opens the portal in a
new tab) and the floating footer; scenario A (the activities with `?pissarra=1` have no board; «Mira com es resol» opens B in a new
tab with the level); scenario B (`resolucio.html` at both sizes: every step, every detail, the level dropdown
also by keyboard, «Un altre exercici», «Ara fes-ho tu», the footer in view; on a tablet the «next» button stays in
place between steps; the portal's cards); projector mode fills the width and height (1366 × 680, a narrow sum of
fractions) and hides the footer; an injected animation failure does not block the
queue; at the start of a movement every ghost covers its original within 0.75 px (also when a detail opens, and
SVG `<text>`), and no warning box covers a symbol that stays (animations slowed ×25 and frozen at t = 0);
`prioritat`'s table keeps its width; reduced motion creates no ghost.

## 7. Differences from the `pau` engine (keep them in mind when syncing)

Source: `step-quiz/pau` `procediments/` at commit `945968a` (October 2026).
- ES modules with exports instead of IIFEs with frozen globals; Prettier style (4 spaces).
- No page builder, no data editor, no address handling (`Motor.inicia` is not ported): the board is a
  component placed inside an existing activity page; the player is a separate optional component.
- Font fitting by **width only** (the height fit of `pau` depends on its page layout). If the container has
  a `max-height`, the board scrolls itself and scrolls to the changed row before measuring (`fesVisible`).
- CSS classes prefixed `pis-`; colours from the activity's `--primary`.
- KaTeX is the vendored 0.16.11, loaded lazily by `carregaKatex()`.
- `comprovaGuio` returns a list of errors instead of using the checker's global `comprova`.
- Added here (not in `pau`): HTML rows; free mode (`mostraPas`/`animaPas`); `marc: false`; `pas.copia`;
  rows equal except for their keys stay still, and changed rows cross-fade without the mid-way dip (in `pau`
  the whole layer fades, so unkeyed parts such as fraction bars dim at mid-transition); the board grows
  before a taller step; `linies()` (lines that stay written). Since 14/11/2026 also: the free-mode queue
  `encua`/`enAcabar` with failure recovery, ghosts that copy the original's box styles, warning boxes per run
  of adjacent sources, reduced motion as a fade in place, `pas.anunci` (aria-live) and keyed SVG elements
  (the ghost carries its own `<svg>` with the element's bbox as viewBox; it must not keep the `katex` class,
  whose CSS makes any inner `svg` absolute and 100 % wide). Since stage 2 (14/11/2026): the pure plan
  `planifica()` (`pla.js`), `reparteix`, `historial()` with a pluggable painter (TeX or HTML) and detail on
  demand, `comprovaDetall`. Since 15/11/2026: permanent line keys (flights are copies from lines that stay,
  merge ghosts into keys that were already there), the grey target of an opened step, `canviaGuio` and the
  player's detail button. These are candidates to port back to `pau`.
- **Page layout of `resolucio.html` derived from `pau`** (24/11/2026, David's review; reworked the same day after
  the audit): two columns at ≥ 1000 px (left column `clamp(340px, 30vw, 460px)` with the step caption, the player
  and the level; board on the right), one column below; the step caption at least 3 lines tall (2 on phones) with a
  1.5 px dark border, player buttons 20 % smaller (34/38 px) on wide screens with the speed on the same line and the
  dots full width below, `scrollbar-gutter: stable` above 520 px, and the board font ×0.8 (`--pis-escala`) in windows
  lower than 750 px (`pau` `MIDA.finestraBaixa`). Unlike `pau`, the heights are pure CSS (`css/resolucio.css`: a
  `100dvh` flex/grid shell where only the board shrinks); there is no `ajustaAlcada`, no sticky player and no
  IntersectionObserver any more. The two stylesheets are **not** unified (two repositories): when one changes,
  check the other.
- Maths writers (`mates.js`, polynomials, equation solvers, matrices) are **not** ported yet: port each one
  with the first activity that needs it (fractions → `Fraccio`; Batxillerat matrices → `matrius.js`).

When the transitions of `pau`'s `motor.js` are improved, port the change to `js/pissarra/pissarra.js`
(section «PISSARRA I TRANSICIONS» corresponds to `creaPissarra` there) and note the new `pau` commit here.
