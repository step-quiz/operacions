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
  `historial()` (§3), which handles the keys for TeX and for an activity's own HTML: the pieces that change
  fly down from the previous line, where a still copy stays (`copia`).
- **Detail on demand (David's proposal, 14/11/2026).** A step may carry sub-steps
  (1, 2, 3, 4 → 1, 2a, 2b, 2c, 3, 4). An opened step only inserts lines between: its last sub-step writes
  exactly the line of the closed step, and the rest of the script does not change (§3b, checked by
  `comprovaDetall`).

This is the engine of the PAU site (`step-quiz/pau`, `procediments/`; read its `graspable-formulae.md` and
`INSIGHTS.md` for the full story and the lessons learned there), ported to this repository.

## 2. Files

| File | What it is |
|---|---|
| `js/pissarra/formules.js` | Pure. Keys (`clau`, `marca`, `op`, `rel`, `marcat`, `tatxa`, `MARQUES`), text rows (`filaText`, `frase`), long rows (`ampleTex`, `enLinies`), **lines that stay written**: `historial(g, {fila, prefix, pinta, envolta, calaix, oberts})` (TeX by default with `pintaTex`, or the activity's HTML; detail on demand, `H.obre()`, the drawer `calaixHtml`), pieces `P`, `grup`, `fraccio`; `linies(g, fila, prefix)` is the older name of the TeX case. The step builder `guio(n)`. |
| `js/pissarra/pla.js` | Pure. `planifica(keysA, keysB, pas)` → `{parelles, copies, repartides, desti, velles, noves}`: which new symbol is which old one (same key, `reanomena`, `copia`, `reparteix`), where each old symbol merges, what fades and what appears. Used by `pissarra.js`, unit-tested in Node. |
| `js/pissarra/comprova.js` | Pure, for tests. `comprovaGuio(passos, nFiles, nom, {text})` → list of structural errors; `comprovaDetall(fesGuio, nFiles, nom, {text})` → the detail-on-demand rule over every view; `textPla(tex)` → plain text that can be evaluated; `clausDe(tex)`. |
| `js/pissarra/pissarra.js` | DOM. `creaPissarra(container, {files, marc})` → controller. Script mode: `carrega(passos)`, `seguent()`, `salta(i)`, `repeteix()`. Free mode (the activity decides each state from what the student does): **`encua(pas, {anima, velocitat})`** (the queue: one paint at a time; it never blocks — if an animation throws, it logs, shows the step without animation and the activity goes on) and `enAcabar()` (a Promise for everything queued so far); `mostraPas(pas)` / `animaPas(pas)` are the unqueued primitives. Both modes: `velocitat(v)`, `escolta(f)`, `pas`, `total`, `ocupat`, `passos`, `element`; `pas.anunci` (text) is read by an aria-live region once the step shows. `marc: false` hides the frame and dotted background (only the animations show). With `prefers-reduced-motion` no symbol travels: changed rows fade in place. Also `carregaKatex()` (lazy-loads `vendor/katex-0.16.11` once), `textAmbFormules(text)` (captions), `element()`. |
| `js/pissarra/reproductor.js` | DOM. `creaReproductor(container, pissarra, {reprodueix, punts, velocitat, teclat})`: restart / previous / play / next buttons, one dot per step, speed, step caption. |
| `js/pissarra/mode.js` | `SUPORTA_PISSARRA` (pages that have it), `pissarraActiva(search, page, list)` (pure), `PISSARRA_ACTIVA` (current page). |
| `js/pissarra/demo.js`, `demo-pagina.js`, `pissarra-demo.html` | Five model scripts (order of operations, a linear equation, a sum of fractions, Pythagoras: the letters and the legs fly from an SVG triangle into the formula, and 2(x + 3) = 14 with `reparteix` and detail on demand on steps 2, 3 and 5) and the demo page (a provisional checkbox «Mostra'l amb tot el detall», `?detall=1`, opens every step until the stage-3 button exists). |
| `css/pissarra.css` | All the look. Every class starts with `pis-`; row classes from procedures (`final`, `separat`, `destacat`, `text`, `figura`, `detall`) only apply inside `.pis-fila`. Colour = the activity's `--primary` / `--primary-light`. The detail drawer: `.pis-calaix*` and `.pis-fila.detall`. |
| `tests/pissarra.test.js` | Node tests (see §6). |
| `tests/pissarra-activitat.js` | The common test battery of an activity's board (`provaActivitat`, see §6). |
| `tests/navegador/prova-pissarra.js` | Playwright test of the demo page and of the index button (skipped when Playwright is missing). |

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
`reparteix: {old: [news]}`; the other pieces of the new line appear, and every old piece that went down
leaves a still copy in the previous line. `anterior: line` changes the previous line at the same time (the
trailing «=»); `classe` is the class of the new line and `classeAnterior` the new class of the previous one
(`final: true` = `classe: 'final'`); `cursor` and `anunci` pass through; `extra: {reanomena, copia}` for
symbols from outside the lines (an SVG figure; `H.clau(r, id)` is the key piece `id` will have in line r).
`canvia(line, text, {classe})` rewrites the last line in place (marks only). Also `H.nombre`, `H.ultima`
(`{linia, classe}`), `H.passos`. Keys: piece `id` of line r → `<prefix><r>k<id>`; its copy once it went
down → `<prefix>c<r>k<id>`.

**An activity with its own HTML** gives the painter and puts all the lines in one row (reference:
`js/equacions/renderer.js` and `js/fraccions/renderer.js`):

```js
const g = guio(1);
g.classes[0] = 'centrada';
const H = historial(g, {
    prefix: 'e',
    pinta: (linia, clauDe, classe) => `<div class="${classe}">…data-k="${clauDe('L0x')}"…</div>`, // any line object
    envolta: linies => `<div class="eq-linies">${linies.join('')}</div>`,
});
pissarra.encua(H.escriu(liniaInicial, '', { classe: 'eq-original' }), { anima: false });
pissarra.encua(H.escriu(liniaNova, '', { ...moviments(pas), classe: 'eq-latest', anunci }), { anima: true });
```

The painter must give the classic HTML when `clauDe` is null (the activity's `?pissarra=1`-off look), and
the renderer exports `historiaNova(exercise)` and `escriuPas(H, …)` so the controller and the tests write the
board the same way.

Low level (what `historial()` writes for you): set `g.files[i]` to keyed TeX (`clau`, `op`, `rel`) and call
`g.afegeix(text, {fusiona, reanomena, reparteix, copia, cursor})`; `g.classes[i] = 'final'` highlights the
result row. Writing a row in place (instead of a new line) is only for marks.

Step object: `{files, classes, text, reanomena?, fusiona?, reparteix?, copia?, cursor?, anunci?}`
(`copia: {new: old}` = a still copy of a symbol that flies away; `reparteix: {old: [news]}` = one old symbol
flies to several places; `cursor: {clic: 'k'}` or `{arrossega: 'k', fins: 'k2'}`). Steps written by
`historial()` also carry metadata for the tests and the stage-3 interface: `id`, `estat`, and with detail
`teDetall`, `pare`, `pares`, `tanca` (§3b). Rules (all checked by `comprovaGuio`): a key matches
`/^[A-Za-z][A-Za-z0-9]*$/` and is **unique within a step across all rows**; a renamed key is new in B and its
old key is gone; a fusion source exists in A and not in B; a spread source exists in A and not in B, each
destination is new, comes from one spread only and is not also renamed or a copy, and the source is not also
fused or renamed; cursor keys exist; the first step animates nothing; no step identical to the previous one
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
- Where it is used: the demo (provisional checkbox, every step opened) and `equacions` (stage 3: the
  «Vull més detall» button, see `STATE.md`). The player's own button («Vull més detall» next to the
  caption, the step's line in grey as the target, «Menys detall») is the next part of stage 3.

Marks (coloured backgrounds; meanings never change): `mes` green = chosen/positive, `menys` red =
removed/negative, `tria` yellow = added/being checked, `actual` lilac = being computed now, `solucio` lilac =
solutions, `cami0/1/2` one colour per tree path. `marca(tex, m)` colours a group without a key.

## 4. Putting the board inside an activity

The activity keeps working exactly as before unless `PISSARRA_ACTIVA` is true (URL `?pissarra=1` on a page
listed in `SUPORTA_PISSARRA`). **Reference implementations: `equacions` and `fraccions`** (an HTML
`historial()`: `js/equacions/renderer.js` `historiaNova`, `escriuPas`, `liniaHtml`, `moviments`; the controller
only queues the step that `escriuPas` returns) and `prioritat` (its own table: `js/prioritat/prioritat.js`
`pintaPissarra`, `js/prioritat/renderer.js` `tableHtml(rows, {claus})` and `fusioUltimaLinia`; details in
`STATE.md` «Wave 1»). Two ways:

- **Animate the activity's own work area** (best for ESO: same notation as always): free mode, `marc: false`,
  one HTML row with the activity's markup where every visible symbol has a `data-k`; call
  `pissarra.encua(pas, { anima: true, velocitat })` when a new line is written and `encua(pas, { anima: false })`
  for any other change (the engine queue keeps animations from overlapping and never blocks), and
  `pissarra.enAcabar()` to wait for it. Give an animated step an `anunci` («Línia nova: …», the new line in
  plain text) for screen readers. **Nothing may change size while the student works** (David, 14/11/2026):
  no table that widens when buttons appear, no work panel that collapses while a line animates (keep its
  height).
- **A TeX board** (like `pau`, e.g. a worked example with captions): script mode with `carrega`/`seguent`:

```js
import { PISSARRA_ACTIVA } from '../pissarra/mode.js';
import { carregaKatex, creaPissarra } from '../pissarra/pissarra.js';

if (PISSARRA_ACTIVA) {
    await carregaKatex();                                // KaTeX only when the mode is on
    const pissarra = creaPissarra(document.getElementById('…'), { files: 2 });
    pissarra.carrega(MathEngine.passosPissarra(exercici)); // pure steps from the activity's math engine
    await pissarra.seguent();                            // e.g. after a correct answer
}
```

Contract (same spirit as the fading mode, `CONTRIBUTING.md`): the **steps are pure data** produced by the
activity's `math-engine.js` (no DOM, **no `Math.random`**, so fixed sessions do not change); the controller
only renders. The page links `css/pissarra.css` (after `css/tokens.css`). Register the page in
`SUPORTA_PISSARRA` **and** add `pissarra: true` to its line in `index.html` (`tests/check-repo.js` §9 checks
both, and that the controller imports `PISSARRA_ACTIVA`).

When the animation appears (David approved this plan on 27/10/2026, see `STATE.md`):
- (a) **worked examples** of the fading mode (`?esvaiment=1`): each «Següent pas» animates the transformation;
- (b) **a correct step** of the student: the previous line turns into the new one (≈1 s, nothing to read);
- (c) later, **«Mira com es fa»** after an error: only the failed step.
The animation never replaces the student's work, the student sets the pace (nothing advances alone unless
they press play), and the mode **does not change questions, scores or the verification code**.

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
1. Unit tests of keys, `guio`, `historial` (TeX and HTML, spreads, classes, ids), `enLinies`, `comprovaGuio`
   (good and bad scripts, spreads included), `planifica`, the detail on demand (ids of every view, nested
   details, inherited `anterior`, `comprovaDetall` with a good script and four bad ones), `textPla`,
   `mode.js`.
2. **Rules of every script** (array `GUIONS`): structural lint, KaTeX renders every formula without
   `katex-error` (vendored KaTeX loaded in Node), second person captions, last step has a `final` row.
3. **Truth of every line**: each TeX row → `textPla` → evaluated with an exact rational evaluator written in
   the test (independent of the engine) against the expected value (expressions) or solution (linear
   equations).

A script with detail is in `GUIONS` twice: closed and with every step opened.

**An activity's board: `tests/pissarra-activitat.js` `provaActivitat(nom, opcions)`** (A3, used by
`tests/equacions.test.js` §2 and `tests/fraccions.test.js`). Give it a generator of exercises — each one
solved exactly as the controller does (the renderer's `historiaNova`/`escriuPas`), with `clasic[i]` (the rows
of step i as the activity draws them without `?pissarra=1`) and, for detail on demand, `vista` (the
`({oberts}) → passos` function) — plus `linies(row)` (how to split a row into lines), `veritat(line, ex)` (an
independent model: '' if true) and `maxPeces`. It checks over thousands of seeded exercises: the whole script
passes `comprovaGuio`, every step moves at least one piece and at most `maxPeces`, every line shown at every
step is true, the board without keys is the classic HTML, and every detail view passes `comprovaDetall`.
About 20 lines of test per activity. Extend the evaluator / `textPla` only as needed (a TeX command unknown to
`textPla` makes the test fail on purpose). Mutation check used for the demos: changing a value, a sign, a
fusion source or a caption to first person each makes a test fail.

`tests/navegador/prova-pissarra.js` (Playwright; skipped without it): every demo step ends with exactly
the step's keys and no leftover ghosts, also the demo with every step opened (the checkbox only shows on a
demo with detail, and `?detall=1` stays in the address), at 1366×700 and 375×740, no horizontal overflow, player buttons and
keyboard, `carregaKatex()` on a page without KaTeX, the index button (with an activity simulated), the three
activities solved by clicking, and since 14/11/2026: an injected animation failure does not stop the activity
(§9); at the start of a movement every ghost covers its original within 0.75 px, SVG `<text>` included, and no
warning box covers a symbol that stays (§10, with animations slowed ×25 and frozen at t = 0); `prioritat`'s
table keeps its width and `equacions`' work panel its height (§11); reduced motion creates no ghost and the
new line is announced (§12).

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
  demand, `comprovaDetall`. These are candidates to port back to `pau`.
- Maths writers (`mates.js`, polynomials, equation solvers, matrices) are **not** ported yet: port each one
  with the first activity that needs it (fractions → `Fraccio`; Batxillerat matrices → `matrius.js`).

When the transitions of `pau`'s `motor.js` are improved, port the change to `js/pissarra/pissarra.js`
(section «PISSARRA I TRANSICIONS» corresponds to `creaPissarra` there) and note the new `pau` commit here.
