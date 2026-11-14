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
  `fusiona: {new: ['old1', 'old2']}` fly into the new one; unmatched → fade out / fade in. Light-blue boxes
  first mark what will change: one box per run of adjacent sources, and a box never covers a symbol that
  stays. Nothing is positioned by hand. Each travelling symbol is a *ghost* (a clone) that copies the
  computed box styles of the original (padding, borders, line-height…), so a style that came from a
  contextual selector of the activity is not lost (it used to move the «=» of `equacions` 6 px).
- So **the author never programs animation**: they write, like a teacher at the blackboard, *what the board
  looks like after each step* plus one short caption, and choose keys well.
- **David's rule (27/10/2026): all intermediate steps stay written.** Each step writes a new line below;
  previous lines stay (they may only get a mark, or the trailing «=» when the next line is written). Use
  `linies()` (§3), which handles the keys: the pieces that change fly down from the previous line, where a
  still copy stays (`copia`).

This is the engine of the PAU site (`step-quiz/pau`, `procediments/`; read its `graspable-formulae.md` and
`INSIGHTS.md` for the full story and the lessons learned there), ported to this repository.

## 2. Files

| File | What it is |
|---|---|
| `js/pissarra/formules.js` | Pure. Keys (`clau`, `marca`, `op`, `rel`, `marcat`, `tatxa`, `MARQUES`), text rows (`filaText`, `frase`), long rows (`ampleTex`, `enLinies`), **lines that stay written** (`linies`, pieces `P`, `grup`, `fraccio`; `extra: {reanomena, copia}` and `L.clau(r, id)` for symbols that come from outside the lines, e.g. an SVG figure), the step builder `guio(n)`. |
| `js/pissarra/comprova.js` | Pure, for tests. `comprovaGuio(passos, nFiles, nom)` → list of structural errors; `textPla(tex)` → plain text that can be evaluated; `clausDe(tex)`. |
| `js/pissarra/pissarra.js` | DOM. `creaPissarra(container, {files, marc})` → controller. Script mode: `carrega(passos)`, `seguent()`, `salta(i)`, `repeteix()`. Free mode (the activity decides each state from what the student does): **`encua(pas, {anima, velocitat})`** (the queue: one paint at a time; it never blocks — if an animation throws, it logs, shows the step without animation and the activity goes on) and `enAcabar()` (a Promise for everything queued so far); `mostraPas(pas)` / `animaPas(pas)` are the unqueued primitives. Both modes: `velocitat(v)`, `escolta(f)`, `pas`, `total`, `ocupat`, `passos`, `element`; `pas.anunci` (text) is read by an aria-live region once the step shows. `marc: false` hides the frame and dotted background (only the animations show). With `prefers-reduced-motion` no symbol travels: changed rows fade in place. Also `carregaKatex()` (lazy-loads `vendor/katex-0.16.11` once), `textAmbFormules(text)` (captions), `element()`. |
| `js/pissarra/reproductor.js` | DOM. `creaReproductor(container, pissarra, {reprodueix, punts, velocitat, teclat})`: restart / previous / play / next buttons, one dot per step, speed, step caption. |
| `js/pissarra/mode.js` | `SUPORTA_PISSARRA` (pages that have it), `pissarraActiva(search, page, list)` (pure), `PISSARRA_ACTIVA` (current page). |
| `js/pissarra/demo.js`, `demo-pagina.js`, `pissarra-demo.html` | Four model scripts (order of operations, a linear equation, a sum of fractions, and Pythagoras: the letters and the legs fly from an SVG triangle into the formula) and the demo page. |
| `css/pissarra.css` | All the look. Every class starts with `pis-`; row classes from procedures (`final`, `separat`, `destacat`, `text`, `figura`) only apply inside `.pis-fila`. Colour = the activity's `--primary` / `--primary-light`. |
| `tests/pissarra.test.js` | Node tests (see §6). |
| `tests/navegador/prova-pissarra.js` | Playwright test of the demo page and of the index button (skipped when Playwright is missing). |

## 3. A step and a script

The normal way (lines that stay written, the rule in §1) is `linies()`:

```js
import { guio, linies, P, grup } from '../pissarra/formules.js';
const g = guio(3);                                    // 3 lines → 3 rows
const L = linies(g);
const igual = P('q', '=');
const l0 = [P('a', '3'), P('s', '+'), P('b', '4'), P('m', '\\cdot'), P('c', '2')];
L.escriu(l0, 'Has de calcular $3 + 4 \\cdot 2$.');
L.canvia([P('a', '3'), P('s', '+'), grup([P('b', '4'), P('m', '\\cdot'), P('c', '2')], 'actual')], 'Primer, la multiplicació.');
const l1 = [P('a', '3'), P('s', '+'), P('p', '8')];
L.escriu(l1, '$4 \\cdot 2 = 8$.', { fusiona: { p: ['b', 'm', 'c'] }, anterior: [...l0, igual] });
L.escriu([P('r', '11')], 'Ara la suma.', { fusiona: { r: ['a', 's', 'p'] }, anterior: [...l1, igual], final: true });
```

Low level (what `linies()` writes for you): set `g.files[i]` to keyed TeX (`clau`, `op`, `rel`) and call
`g.afegeix(text, {fusiona, reanomena, copia, cursor})`; `g.classes[i] = 'final'` highlights the result row.
Writing a row in place (instead of a new line) is only for marks.

Step object: `{files, classes, text, reanomena?, fusiona?, copia?, cursor?}` (`copia: {new: old}` = a still
copy of a symbol that flies away; `cursor: {clic: 'k'}` or `{arrossega: 'k', fins: 'k2'}`). Rules (all checked by `comprovaGuio`): a key matches
`/^[A-Za-z][A-Za-z0-9]*$/` and is **unique within a step across all rows**; a renamed key is new in B and its
old key is gone; a fusion source exists in A and not in B; cursor keys exist; the first step animates
nothing; no step identical to the previous one (`guio` drops it, so optional steps need no `if`). Rows never
used by any step are hidden.

Marks (coloured backgrounds; meanings never change): `mes` green = chosen/positive, `menys` red =
removed/negative, `tria` yellow = added/being checked, `actual` lilac = being computed now, `solucio` lilac =
solutions, `cami0/1/2` one colour per tree path. `marca(tex, m)` colours a group without a key.

## 4. Putting the board inside an activity

The activity keeps working exactly as before unless `PISSARRA_ACTIVA` is true (URL `?pissarra=1` on a page
listed in `SUPORTA_PISSARRA`). **Reference implementation: `prioritat`** (`js/prioritat/prioritat.js`
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
1. Unit tests of keys, `guio`, `enLinies`, `comprovaGuio` (good and bad scripts), `textPla`, `mode.js`.
2. **Rules of every script** (array `GUIONS`): structural lint, KaTeX renders every formula without
   `katex-error` (vendored KaTeX loaded in Node), second person captions, last step has a `final` row.
3. **Truth of every line**: each TeX row → `textPla` → evaluated with an exact rational evaluator written in
   the test (independent of the engine) against the expected value (expressions) or solution (linear
   equations).

When an activity gets the board, add its scripts to `GUIONS` over **many generated exercises** (seeded), with
an independent model of the expected result, and extend the evaluator / `textPla` only as needed (a TeX
command unknown to `textPla` makes the test fail on purpose). Mutation check used for the demos: changing
a value, a sign, a fusion source or a caption to first person each makes a test fail.

`tests/navegador/prova-pissarra.js` (Playwright; skipped without it): every demo step ends with exactly
the step's keys and no leftover ghosts, at 1366×700 and 375×740, no horizontal overflow, player buttons and
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
  whose CSS makes any inner `svg` absolute and 100 % wide). These are candidates to port back to `pau`.
- Maths writers (`mates.js`, polynomials, equation solvers, matrices) are **not** ported yet: port each one
  with the first activity that needs it (fractions → `Fraccio`; Batxillerat matrices → `matrius.js`).

When the transitions of `pau`'s `motor.js` are improved, port the change to `js/pissarra/pissarra.js`
(section «PISSARRA I TRANSICIONS» corresponds to `creaPissarra` there) and note the new `pau` commit here.
