# «Resolució pas a pas» — the animated board (pissarra) in `operacions`

**Audience: an AI that adds the animated step-by-step resolution to an activity of this repository.**
Talk to the user (David) in Catalan; everything the student sees is Catalan; this file is English.
Living state, decisions and the rollout plan: [`STATE.md`](STATE.md) (it wins over this file).

---

## 1. The one idea

> **A procedure is a pure function `data → list of board states`. The board animates the difference
> between two consecutive states, using *keys* as the identity of each symbol.**

- A **board state** (a *pas*) is N rows. A row is TeX (rendered by KaTeX), a text paragraph (starts with
  `§`) or an SVG sketch (starts with `<svg`). Every symbol that must be *followed* from one step to the next
  is wrapped `\htmlData{k=KEY}{…}` (helpers `clau`, `op`, `rel` in `js/pissarra/formules.js`).
- From state A to state B the board finds every key in both, measures where KaTeX drew it, and moves it
  there. Same key → the symbol travels (and cross-fades if its content changed); keys declared in
  `fusiona: {new: ['old1', 'old2']}` fly into the new one; unmatched → fade out / fade in. Light-blue boxes
  first mark what will change. Nothing is positioned by hand.
- So **the author never programs animation**: they write, like a teacher at the blackboard, *what the board
  looks like after each step* plus one short caption, and choose keys well.

This is the engine of the PAU site (`step-quiz/pau`, `procediments/`; read its `graspable-formulae.md` and
`INSIGHTS.md` for the full story and the lessons learned there), ported to this repository.

## 2. Files

| File | What it is |
|---|---|
| `js/pissarra/formules.js` | Pure. Keys (`clau`, `marca`, `op`, `rel`, `marcat`, `tatxa`, `MARQUES`), text rows (`filaText`, `frase`), long rows (`ampleTex`, `enLinies`), the step builder `guio(n)`. |
| `js/pissarra/comprova.js` | Pure, for tests. `comprovaGuio(passos, nFiles, nom)` → list of structural errors; `textPla(tex)` → plain text that can be evaluated; `clausDe(tex)`. |
| `js/pissarra/pissarra.js` | DOM. `creaPissarra(container, {files})` → controller `{carrega, seguent, salta, repeteix, velocitat, escolta, pas, total, ocupat, passos, element}`; `carregaKatex()` (lazy-loads `vendor/katex-0.16.11` once); `textAmbFormules(text)` (captions); `element()`. |
| `js/pissarra/reproductor.js` | DOM. `creaReproductor(container, pissarra, {reprodueix, punts, velocitat, teclat})`: restart / previous / play / next buttons, one dot per step, speed, step caption. |
| `js/pissarra/mode.js` | `SUPORTA_PISSARRA` (pages that have it), `pissarraActiva(search, page, list)` (pure), `PISSARRA_ACTIVA` (current page). |
| `js/pissarra/demo.js`, `demo-pagina.js`, `pissarra-demo.html` | Three model scripts (order of operations, a linear equation, a sum of fractions) and the demo page. |
| `css/pissarra.css` | All the look. Every class starts with `pis-`; row classes from procedures (`final`, `separat`, `destacat`, `text`, `figura`) only apply inside `.pis-fila`. Colour = the activity's `--primary` / `--primary-light`. |
| `tests/pissarra.test.js` | Node tests (see §6). |
| `tests/navegador/prova-pissarra.js` | Playwright test of the demo page and of the index button (skipped when Playwright is missing). |

## 3. A step and a script

```js
import { clau as K, op, rel, guio } from '../pissarra/formules.js';
// (in files that tests load with tests/harness.js loadModule, avoid «as»: write `const K = clau;`)

function passos(dades) {
    const g = guio(1);                                   // 1 row
    g.files[0] = K('a', '3') + op('s', '+') + K('b', '4') + op('m', '\\cdot') + K('c', '2');
    g.afegeix('Has de calcular $3 + 4 \\cdot 2$.');      // first step: animates nothing
    g.files[0] = K('a', '3') + op('s', '+') + K('p', '8');
    g.afegeix('$4 \\cdot 2 = 8$.', { fusiona: { p: ['b', 'm', 'c'] } });
    g.files[0] = K('r', '11');
    g.classes[0] = 'final';                             // the result, highlighted
    g.afegeix('Ara la suma: $3 + 8 = 11$.', { fusiona: { r: ['a', 's', 'p'] } });
    return g.passos;
}
```

Step object: `{files, classes, text, reanomena?, fusiona?, cursor?}` (`cursor: {clic: 'k'}` or
`{arrossega: 'k', fins: 'k2'}`). Rules (all checked by `comprovaGuio`): a key matches
`/^[A-Za-z][A-Za-z0-9]*$/` and is **unique within a step across all rows**; a renamed key is new in B and its
old key is gone; a fusion source exists in A and not in B; cursor keys exist; the first step animates
nothing; no step identical to the previous one (`guio` drops it, so optional steps need no `if`). Rows never
used by any step are hidden.

Marks (coloured backgrounds; meanings never change): `mes` green = chosen/positive, `menys` red =
removed/negative, `tria` yellow = added/being checked, `actual` lilac = being computed now, `solucio` lilac =
solutions, `cami0/1/2` one colour per tree path. `marca(tex, m)` colours a group without a key.

## 4. Putting the board inside an activity

The activity keeps working exactly as before unless `PISSARRA_ACTIVA` is true (URL `?pissarra=1` on a page
listed in `SUPORTA_PISSARRA`). Then:

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
keyboard, `carregaKatex()` on a page without KaTeX, and the index button (with an activity simulated).

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
- Maths writers (`mates.js`, polynomials, equation solvers, matrices) are **not** ported yet: port each one
  with the first activity that needs it (fractions → `Fraccio`; Batxillerat matrices → `matrius.js`).

When the transitions of `pau`'s `motor.js` are improved, port the change to `js/pissarra/pissarra.js`
(section «PISSARRA I TRANSICIONS» corresponds to `creaPissarra` there) and note the new `pau` commit here.
