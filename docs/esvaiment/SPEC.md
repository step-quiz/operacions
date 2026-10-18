# Project 12 — Esvaïment (fading worked examples): specification

> Copied from `SPEC-step-quiz-9-projects.md` §10 (2026-10-18, approved scope). The shared rules of that
> document (§2: static only, no network, privacy, Catalan UI, docs follow code, tests before delivery,
> pedagogical style) apply and are already encoded in this repository's `CLAUDE.md`, `CONTRIBUTING.md` and
> `COM-TREBALLAR.md`. Where this file and the repository's own rules disagree, the repository wins.
> Decisions taken after the spec was written are in [`STATE.md`](STATE.md), which overrides this file.

## Project 12: Esvaïment (fading worked examples) inside `operacions`

**Repo:** `operacions` (existing, ES modules). **Read first:** `CLAUDE.md`, `COM-TREBALLAR.md`, `CONTRIBUTING.md`, `PROJECTS-TECHNICAL-REFERENCE.md`. Run `node tests/run-all.js`, ESLint and Prettier before and after.

### 10.1 Pedagogical intent

- **The sequence.**
  1. A fully worked example.
  2. The same exercise type with the last step left for the student.
  3. With the last two steps left.
  4. … until the student does everything, which is the normal exercise.
- **On an error**, the system models the correct step at once and the next item goes back one level. This is errorless learning, used with students with intellectual disability; it also suits ADHD (one step at a time).
- **Evidence:** fading worked examples (Renkl, Atkinson, Maier & Staley 2002; Atkinson, Renkl & Merrill 2003: *backward* fading plus self-explanation prompts).

### 10.2 Activation and constraints

- **URL parameter:** `esvaiment=1`, optionally `&inici=<k>`. **Do not reuse `modalitat`**: it already means `passos` in `prioritat` and `a`/`b` in `vocabulari`.
- **Link generator.** In `index.html`, add a checkbox «Esvaïment (exemples resolts que es van esvaint)». Show it only for exercises that declare support, through a registry next to `js/exercise-codes.js` (e.g. `export const SUPORTA_ESVAIMENT = new Set(['prioritat', 'equacions', 'fraccions'])`).
- **No verification code in this mode**, like fixed sessions. The final screen says the session was in fading mode and shows stars and progress. Do not call the v2 code generator. `analitzador-stepquiz.html` and `js/codi-verificacio.js` stay untouched. Add a `check-repo.js` assertion for this.
- **Fixed sessions must keep producing identical questions.** Existing fingerprints, such as `prioritat`'s in `tests/modules.test.js`, must not change.
- **Attempts.** `maxintents` is ignored in this mode: the first error triggers modelling.

### 10.3 Architecture

- **`js/esvaiment.js`** is a pure ES module, the state machine:

  ```js
  export const Esvaiment = (() => {
      // estat: { k, encertsSeguits }   k = nombre de passos (comptant des del final) que fa l'alumne
      function inicial(k0 = 0) { … }
      function passosAlumne(estat, nPassos) { return Math.min(estat.k, nPassos); } // nPassos varies per item
      function despresItem(estat, { senseErrors }) {
          // senseErrors: 2 consecutive error-free items at level k → k+1; any error → max(k−1, 0)
      }
      return { inicial, passosAlumne, despresItem };
  })();
  ```

  `k` has no fixed maximum. When `k ≥ nPassos` the item is the normal exercise, and the session can end with a banner «Ja ho fas tot sol».
- **Step-provider adapter per exercise:** `getPassos(pregunta) → [{ id, instruccio, resposta, renderFet(contenidor), renderBuit(contenidor), comprova(valor) → { ok, diag? } }]`. The first `nPassos − passosAlumne` steps render as **worked**: completed, greyed, labelled «Exemple», each with its one-line `instruccio` as justification. The rest render as inputs.
- **Pilots, in this order:**
  1. **`prioritat`.** `js/prioritat/math-engine.js` is already pure and has `nextStep`, `applyAt` and `solve(line)`, and `modalitat=passos` already does the step-by-step UI. Build the adapter on `solve`. Lowest risk.
  2. **`equacions`.** `determineSteps(eq)` lives inside the controller `js/equacions/equacions.js` (old single-file module). Steps are typed `distribute_left/right`, `simplify_*`, `group_x`, `group_num`, `solve`, each with `instruction`, `answer`, `dispLeftBefore/After` and `dispRightBefore/After`.
     1. **First write a characterisation test** that fingerprints generated equations and their steps for fixed seeds.
     2. Then move generation and `determineSteps` into `js/equacions/math-engine.js` (pure, exported).
     3. The fingerprints must stay identical.
     4. Then write the adapter.
  3. **`fraccions`.** Addition and subtraction steps (lcm, amplify, add numerators, simplify). On error, show the diagnosis from `js/fraccions/errors-fraccions.js`.
- **Error behaviour:** on a wrong value in a blank step,
  - show the correct value and, if available, the diagnosis (fraccions);
  - mark the step «fet amb ajuda»;
  - count the item as not error-free;
  - continue to the next step;
  - send the next item to `k−1`.

  The UI never shows «incorrecte» alone.
- **Optional, phase 2:** self-explanation prompts. On the most recently worked step, ask «Per què?» with 2–3 choices from the step types («he aplicat la propietat distributiva», «he agrupat les x», …).

### 10.4 Tests

- `Esvaiment` unit tests: promotion, demotion, floor at 0, variable `nPassos`.
- For each pilot, over 1000 seeded items, the adapter's steps applied in sequence reproduce the final answer; no `undefined` or `NaN` in rendered strings (render to a DOM-free string representation for tests).
- Characterisation fingerprints for `equacions` before and after the refactor.
- `check-repo.js` must still pass: `window.buildLevel` usage, fixed-session seeding order, no inline JS, imports resolve.

### 10.5 Docs

- README «Paràmetres URL» table: add `esvaiment`.
- CONTRIBUTING: a new section «Com fer que un exercici admeti l'esvaïment» (the adapter contract).
- `docs_vs_codi.py` must pass.
- Add a line to `a/UPSTREAM.md` noting that the feature exists upstream (porting it to `a` and to `pi` is a later decision).

### 10.6 Acceptance criteria

- [ ] Three pilots work with `esvaiment=1`.
- [ ] Existing behaviour without the parameter is byte-identical: fingerprints unchanged.
- [ ] No verification code is produced in the mode.
- [ ] All tests, ESLint and Prettier green.

**Open questions for the user:**
- Promotion rule (2 in a row) and demotion rule (−1): OK?
- Should a teacher be able to force a level from the link (`inici=`)?
