# Project 12 — Esvaïment: living state

Agent-facing memory between sessions. English. Update it in the same commit as any change to the feature.
Spec: [`SPEC.md`](SPEC.md). Where they disagree, this file wins (it records later decisions).

## Status (2026-10-18)

| Part | Status |
|---|---|
| Level engine `js/esvaiment.js` (`Esvaiment`, `ESVAIMENT`, `SUPORTA_ESVAIMENT`) | DONE |
| `game-core.js`: no verification code, final screen with stars | DONE |
| Link generator (`index.html`, row «Esvaïment», sets `esvaiment=1` and `inici=`) | DONE |
| Pilot 1 `prioritat` | DONE (delivered in ZIP 1) |
| Pilot 2 `equacions` (characterisation test → pure `math-engine.js` → adapter) | PENDING (ZIP 2) |
| Pilot 3 `fraccions` (addition/subtraction only) | PENDING (ZIP 3) |
| Line in `a/UPSTREAM.md` (other repository) | PENDING (ZIP 4) |
| Phase 2: «Per què?» self-explanation prompts | NOT STARTED (optional) |

## Decisions approved by the user (2026-10-18)

1. Promotion after **2** consecutive error-free items; **−1** level on any error; floor 0.
2. Teachers may force the starting level with `inici=k` (0–9). Default 0 = fully worked example.
3. Worked steps are revealed **one at a time** with a «Següent pas» button, so the student acts before reading
   (spec §2.9 "one action per screen state"). A fully worked item (`k = 0`) still counts as error-free, so
   two of them promote to `k = 1` (backward fading).
4. Reaching «Ja ho fas tot sol» shows the message; the session still runs for `totaloperations` items.
5. No grade and no points: the final screen shows one star per error-free item and how many steps the student
   did in the last item. No verification code (like fixed sessions).
6. On a wrong step: show the correct step, mark the row «amb ajuda», wait for «Continua» (no timer), next item
   one level easier. `maxintents` is ignored in this mode.
7. `prioritat`: `esvaiment=1` forces the «Pas a pas» UI (the link generator hides «Modalitat» then).
8. `fraccions`: in fading mode only addition/subtraction; the «Producte o divisió» button will be hidden.

## Technical decisions (agent)

- **Level clipping.** Before promoting/demoting, `k` is clipped to the `nPassos` of the item just finished
  (`despresItem`). Without it, `k` could grow far beyond the item length and later demotions would be invisible.
  So `k ≤ nPassos + 1` in practice; the spec's "no fixed maximum" still holds across item types.
- **Adapter contract, deviation from spec §10.3.** The spec proposed `getPassos()` returning steps with
  `renderFet/renderBuit/comprova` (DOM functions). That would put DOM code in the pure engine. Instead each
  `math-engine.js` returns steps as **pure data** (`prioritat`: `MathEngine.passosEsvaiment(toks)` →
  `[{ id, line, op, resposta, motiu }]`) and the controller renders them. Documented in `CONTRIBUTING.md`
  («Com fer que un exercici admeti l'esvaïment»).
- **Registry.** `SUPORTA_ESVAIMENT` lives in `js/esvaiment.js` (not in `exercise-codes.js`) because the mode has
  nothing to do with verification codes. `index.html` (classic inline script, cannot import) carries
  `esvaiment: true` per activity; `tests/check-repo.js` §8 asserts both lists are equal.
- **No code, asserted.** `tests/check-repo.js` §8: the first statement of `copiarResultats()` is
  `if (ESVAIMENT) return;`, the copy button is hidden, and neither the analyser nor `js/codi-verificacio.js`
  mention the mode.
- **Fixed sessions untouched.** `js/esvaiment.js` and `passosEsvaiment` never call `Math.random` (asserted).
  The `prioritat` fingerprint `12e8978e` in `tests/modules.test.js` is unchanged.
- **Byte-identical without the parameter.** `Renderer.tableHtml` output was compared with `main` on 2,400
  tables (plain, `auto`, active, with marks): identical. New row field `marca: 'exemple' | 'ajuda'` only adds
  classes and a trailing `td.nota-pas` when present; the working row never shows its mark.
- **Wrong operation in `prioritat`.** The modelled step is the first operation that had to be done before
  (`blockers().green[0]`), with the existing blocker message plus «Es fa així: …».
- **Harness.** `tests/harness.js` `loadModule()` gained a `pathname` option (default `/test.html`) so tests can
  simulate `prioritat.html`.

## Verification done for ZIP 1

- `node tests/run-all.js`: all suites green, including the new «Mode esvaïment» (46 checks).
- Prettier (system 3.8.1; repo pins 3.9.9) `--check .`: clean.
- ESLint: approximated locally (no `@eslint/js` in the sandbox; built-in recommended rules + browser globals):
  0 errors. CI runs the real config on push.
- Browser (Playwright Chromium, 1366×768 and 360×740 touch): perfect run (k 0→2 over 6 items), run with errors
  from `inici=2` (k 2→1→0→…), final screen, copy button hidden, no JS errors, no external requests; smoke test of
  `prioritat` (both modes), `enters`, `fraccions`, `equacions`, `derivades`, `index.html` link generator.

## Next session: `equacions` (ZIP 2)

1. Characterisation test first: fingerprint `generateEquation(opIndex)` + `determineSteps(eq)` for fixed seeds,
   all `nivell` 0–3, `lefttoright` on/off, computed on the **current** code.
2. Move generators, `determineSteps` and helpers to `js/equacions/math-engine.js` (pure; `nivell`, `leftToRight`,
   `totalOperations` passed as arguments instead of read from `state`/URL). Fingerprints must not change.
3. Adapter: each step already has `instruction`/`answer`/`dispLeftAfter/After`; add a one-line justification
   per step type in a new `strings` block, render worked steps as history lines marked «exemple».

## Known unrelated issues (reported to the user, not fixed)

- `fraccions.html` ignores `?nivell=` (the menu sets the level), but the link generator adds it.
- `index.html` loads the YouTube icon from `upload.wikimedia.org` (external request).
- The «Sessió fixa» badge overlaps the page title at 360 px.
