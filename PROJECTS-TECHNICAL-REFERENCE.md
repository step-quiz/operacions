# Projects — Technical Reference & Improvement Backlog

> **Document type:** living technical reference, optimized for machine reading and machine updating.
> **Owner:** Mathematics & CS department workflow (author: David Arso Civil). Public-facing umbrella: the `step-quiz.net` family of static educational web apps, plus the `*cat` programming courses.
> **Audience of this file:** an AI agent that will (a) read it to understand the whole ecosystem before touching any single project, and (b) edit it after shipping a change so it stays the single source of truth.

---

## 0. AI maintenance protocol (READ FIRST)

This file has three parts:

1. **Part 1 — Project catalog.** One entry per project, with a fixed schema. Describes purpose, stack, key files, architecture, and the *excellent features* (elegant, reusable solutions) worth knowing about.
2. **Part 2 — Shared structures.** The cross-cutting patterns that recur across projects, each with a stable `S#` id. Use these to reason about what is genuinely common vs. accidentally similar.
3. **Part 3 — Improvement backlog.** Numbered, prioritized proposals (`P##`) plus one meta-proposal (`M1`). Each proposal has a `Status` field.

### Rules for editing this document

- **Stable identifiers never change.** Project slugs, `S#` ids, and `P##` ids are permanent handles. If a proposal is dropped, set its status to `DROPPED` — do **not** delete it or reuse its number.
- **When you ship a change**, do all of the following in the same edit:
  1. Flip the relevant proposal's `Status` (e.g. `PROPOSED → DONE`) and append a one-line dated note under its `History`.
  2. Update the affected project entries in Part 1 (e.g. add the new shared module to `Key files`, move a feature from "missing" to "present").
  3. Add a row to the **Changelog** at the bottom.
  4. If you introduced a new shared module, add or update its `S#` entry in Part 2.
- **Cite files by name and symbol, never by line number.** Line numbers drift; `core.js → generarCodi()` does not.
- **Ground truth is the live repository, not this file.** This snapshot was produced from an export covering Jan–Jun 2026. If a path or claim here contradicts the code, trust the code and fix this file.
- **Status vocabulary:** `PROPOSED` · `IN_PROGRESS` · `DONE` · `BLOCKED` · `DROPPED`.
- **Priority vocabulary:** `P1` = highest leverage (impact × ease), `P2` = solid win, `P3` = nice-to-have / speculative. (Note: priority tier is a *field*; the permanent id is `P##`. Do not confuse them.)

### Shared technical conventions across the whole ecosystem

- **No build step, static-first.** Every project deploys as static files (GitHub → Cloudflare Pages, or Netlify/Vercel). Publishing = committing a file. A few projects ship optional Node dev tools (`pycat/tools`, `ggcat/test-validators.js`) but the runtime is always plain files.
- **Vanilla JS only.** No framework, no npm runtime dependency. Two module styles coexist: ES modules (`cangur`) and the `namespace + IIFE` pattern (`window.L`, `window.P`, `K`, `J`; see `S8`).
- **Catalan UI and code comments** are the default. Some projects are or aim to be trilingual (`ca`/`es`/`en`); see `S` notes and `P09`.
- **Licensing (since 2026-09-07):** almost every repository's `LICENSE`/`LLICENCIA.md` is now **content `CC BY-NC-SA 4.0` + code `MIT`**, so code can be combined across projects. Since 2026-10-17 the HTML footers say the same (the last ones that printed `CC BY-NC-ND 4.0` — `app`, `cb`, `ins` and `jscat`'s `footer.js` — were fixed, and `ggcat`'s `LICENSE` was aligned with its `LLICENCIA.md`). Exceptions: `pau` (its `LLICENCIA.md` says `CC BY-NC-ND 4.0`) and `sol` (no `LLICENCIA.md`; its README says `BY-NC-ND`).
- **Must be served over HTTP(S), not `file://`** wherever Web Workers, `fetch()` of JSON, or ES modules are used.

---

## Part 1 — Project catalog

Per-entry schema:
`Purpose` · `Audience` · `Stack` · `Entry points` · `Key files` · `Architecture` · `Excellent features` · `Status` · `Participates in` (Sx ids).

---

### `cangur` — Cangur Corrector (OMR + AI)

- **Purpose:** Grade scanned answer sheets for the *Cangur* math competition (30 questions, options A–E, models A/B), with official Cangur scoring.
- **Audience:** Teachers.
- **Stack:** Vanilla JS **ES modules**; `pdf.js`; direct browser calls to Anthropic and Google (Gemini) APIs.
- **Entry points:** `index.html` (shell) → `js/init.js` (bootstrap).
- **Key files:** `js/config.js` (constants: `Q=30`, column rules, default keys), `js/state.js` (single mutable-state source), `js/render.js` (DOM sync from state), `js/ai-recognizer.js` (OMR via Claude/Gemini), `js/scoring.js` (Cangur scoring), `js/key-loader.js` (`.xlsx` answer key reader), `js/export.js` (`.xlsx` export), `js/pdf-viewer.js`.
- **Architecture:** Strict `state → render` separation; 16 small modules with one responsibility each; the answer key is an `.xlsx` (one row per level × model).
- **Excellent features:**
  - **Multi-provider AI client with tiered retry** (`ai-recognizer.js`): routes to `_callAnthropic()` or `_callGemini()` from one `MODEL_CHOICES` table; distinguishes *transient* errors (5xx/429/network → up to 5 retries with `[5s,10s,15s,40s]` backoff) from *permanent* ones (4xx non-429/parse → 3 retries). API key lives **in memory only**, never persisted.
  - **Deliberate scope reduction for reliability/cost:** the AI is asked to read **only** the A–E bubbles, never the handwritten student code/name/model — those are entered manually because models confuse digits and waste "thinking" tokens. Documented design decision, not an oversight.
  - **Output constrained to JSON** (`Q01..Q30` + comment), normalized by `_normalitzarResposta()`.
- **Lineage:** Cangur-specific **fork of `comp4eso`** — shares its exact OMR grading module tree (`S10`); diverges in scoring (Cangur competition scoring vs CB àmbits) and key loading (`.xlsx` vs in-app editor). `ai-recognizer.js` here is the adaptation; `comp4eso`'s is the original.
- **Status:** Mature/working.
- **Participates in:** S1, S6, S8, S10.

---

### `comp4eso` — CompBàsiques 4t ESO (competency grader + OMR)

- **Purpose:** Teacher tool to grade Catalonia's 4th-ESO *basic-competencies* tests across three competencies — Catalan language (`cat`), Mathematics (`mat`), Science-technology (`ct`) — via OMR (AI) or manual entry, then produce scores and per-student reports. **Ancestor of the OMR lineage** and the refactored standalone of the original single-file `informe-cb.html` (3,675 lines), which still lives inside `operacions`.
- **Audience:** Teachers.
- **Stack:** Vanilla JS **ES modules**; `pdf.js`; `JSZip` (CDN) for DOCX; direct browser calls to Anthropic/Gemini.
- **Entry points:** `index.html` (shell) → `js/init.js`; `resum.html` (summary view).
- **Key files:** `js/state.js`, `js/render.js` (DOM sync via the competency registry), `js/grid.js`, `js/scoring.js` (+ shared `getGrade`), `js/reports.js` (per-student DOCX), `js/ai-recognizer.js` (**the original OMR engine**), `js/key-editor.js` (answer-key editor, load/save `.txt`), `js/centre.js` (centre/year modal + autocomplete), `js/startup.js` (startup wizard + `applyCompetency`), `js/export.js` (XLSX). Data: `data/competencies.js` (stable registry) + `data/{cat,mat,ct}-2025-26.js` (year-variable).
- **Architecture:** Same `state → render` module tree as `cangur` (its Cangur fork). The headline design is **strict year-variable data isolation**: everything that changes yearly lives in `data/*.js`; `competencies.js` is the only data module imported elsewhere and abstracts **items-based** competencies (`cat`, `ct`) from **ambits-based** ones (`mat`) behind a uniform getter API plus a grid `layout`. Migrating to a new school year = copy three data files + change the import paths in `competencies.js`, `reports.js` **and `ai-recognizer.js`** (added after the refactor; it also imports the year data directly) — **no logic/render/scoring/export change**. ES-module import cycles are broken via setter-injection in `init.js`.
- **Excellent features:**
  - **In-browser DOCX generation from raw OOXML + JSZip** (`reports.js`): builds WordprocessingML XML by hand and zips it into a valid `.docx` (one document with per-student, per-skill breakdown tables), then triggers download — no heavy document library. More capable than `cangur`'s XLSX-only export (see `P14`).
  - **Competency registry with an items-vs-ambits discriminator** (`competencies.js`): one uniform API serves structurally different competencies; `grid.js` reads `layout` instead of hardcoding columns. A clean strategy-pattern data layer.
  - **Official competency grade bands** (`getGrade`): `NA`/`AS`/`AN`/`AE` (Baix / Mitjà-baix / Mitjà-alt / Alt), shared between the results table and the DOCX reports.
  - **Disciplined single-file → module refactor** documented in `REFACTOR_GUIDE.md` with concrete, checkable invariants (CSS-rule-count parity, full import resolution, zero ES-module cycles, `node --check` on every file, every `getElementById`/event wired to a real `id`, all inline `on*=` handlers re-wired via `addEventListener`). Reusable as a refactor template for the other single-file legacy tools (the inline `operacions` exercises have since been moved to ES modules).
  - **In-memory-only API key** + the multi-provider OMR approach later forked into `cangur`.
- **Relationship:** parent of `cangur` (`S10`); teacher-grading counterpart of `cb` (student-practice) on the CB-competencies theme; refactored form of `operacions/informe-cb.html` (removed from `operacions` on 2026-10-18).
- **Status:** Mature/working (Phase 2 of its refactor complete).
- **Participates in:** S1, S6, S8, S10.

---

### `cangurcat` — Cangur Tutor (static, DRY-generated)

- **Purpose:** Static problem-tutor for Cangur: 480 problems, deterministic A–E checking, optional (currently off) AI chat/hints, a verification code, and a teacher analyzer.
- **Audience:** Students (tutor) + teachers (analyzer).
- **Stack:** Vanilla JS (namespace pattern); data generated from a Python catalog.
- **Entry points:** `index.html` (student tutor); `analitzador-cangur.html` (standalone teacher analyzer, single file).
- **Key files:** `js/tutor.js` (state machine), `js/app.js` (UI controller), `js/codi.js` (verification code — generate **and** decode), `js/llm.js` (AI gate mirror, disabled), `config.js` (`ENABLE_AI` flag), `data/problems.js` (the catalog, 480 problems 2023–2026: since 2026-10-18 it is the source of truth, maintained with `eines/problemes.py` — check, add an edition from a CSV, show answers; the old `build_static.py` generator was never in any repository).
- **Architecture:** Originally the Python catalog `problems_*.py` (repo `tutor-cangur`) was the source and `build_static.py` emitted `data/problems.js`; since 2026-10-18 `cangurcat` is self-sufficient (`data/problems.js` + `eines/problemes.py`, checked on every push by `tests.yml`). The web app **mirrors the Python logic 1:1** — `tutor.js` reuses the exact function/field names of `tutor.py` (`newSessionState`, `processMessage`, `processCommit`, `buildTrace`, …) so the two stay trivially syncable.
- **Excellent features:**
  - **Answer secrecy without a backend:** correct answers ship as `sha256(salt + id + letter)` hashes, never in cleartext; "spoiler" fields (`expected_reasoning`, `comentaris_distractors`, etc.) are stripped from the client bundle. Because checking is async-hash-based, `processCommit`/`checkChoice` are `async`. (Explicitly documented as a deterrent, not exam-grade integrity.)
  - **`codi.js` is the canonical verification-code module:** it both **generates** and **parses** the code in one file, guaranteeing encoder/decoder parity (the failure mode that plagues split implementations — see `P01`).
  - **Cross-verification of the results string** (in the analyzer): recomputes `answeredR === QQ && solvedR === AA` from `R`. Since 2026-10-18 the checksum letter itself also covers `TTTTT` and every digit of `R` (weighted sum, see `P01`); older codes still validate and are shown as ☑️ (detail not verified).
  - **Anti-fraud Δt signal:** the analyzer flags submissions where the gap between code generation time and form submission time exceeds 15 min.
- **Code format (`CG`, 10 segments):** `{L}{salt}-{DDMM}-{HHMM}-CG-{curs}-{QQ}-{AA}-{PP}-{TTTTT}-{R(30)}` where `L`=checksum letter, `salt`=cursChar+conv-year2, `QQ`=answered, `AA`=solved, `PP`=hints, `TTTTT`=session seconds, `R`=per-problem digits (`0`=unanswered, `1–8`=solved on Nth commit, `9`=answered-not-solved).
- **Status:** Mature; AI path intentionally disabled (needs a server-side proxy to re-enable).
- **Participates in:** S1, S4, S5, S6 (planned), S8.

---

### `cb` — Step Quiz: Competències Bàsiques

- **Purpose:** Practice Catalonia's ESO "basic competencies" math tests with real past-exam questions, in practice mode (pedagogical hints) or exam mode (simulation).
- **Audience:** Teachers (link generator) + students (test runner).
- **Stack:** Vanilla JS (ES6, inline + `core.js`); pure HTML5/CSS3.
- **Entry points:** `index.html` (teacher link generator); `test.html` (student test); both fully static.
- **Key files:** `core.js` (engine: JSON load, validation), `codi.js` (verification code v3, pure logic, tested by `tests/codi.test.js`), `shared.css`, `preguntes.json` (question bank), `data/` (PNG statements/questions).
- **Architecture:** URL-parameterized test (`p`, `nivell`, `any`, `dificultat`, `sentit`, `max`). Questions are `1 statement : N questions`. Verification code with DNI-style checksum, verifiable offline by the teacher.
- **Excellent features:**
  - **Backend-free privacy model:** no personal data stored anywhere; the student copies a compact verification code and submits it via an authenticated Google Form (educational domain). This is the canonical privacy pattern the rest of the ecosystem copies.
  - Clean image-swap UX in `carregarPregunta()` (avoids reflow flicker by only reloading the statement image when it actually changes).
- **Code format (v3, since 2026-10-21):** `Lsss-DDMM-HHMM-CB-D-S-QQ-AA-F-SS-EEEE-NNN-R(30|40)` — `sss` = `s`/`q` (2n/4t ESO) + year, `D` = level, `S` = mode (1 exam, 2 practice), `QQ` = questions, `AA` = chosen exam year (`00` = all), `F` = difficulty bitmask, `SS` = sense bitmask, `EEEE` = fingerprint of the question-id list, `NNN` = grade×10, `R` = one digit per question. Older codes are v2 (9 segments, without `AA`/`F`/`SS`/`EEEE`) and v1 (`…-NN,NN-R-cb`); the analyzer still reads all of them. Bank: 218 questions (4t ESO 2022–2026, 2n ESO 2024–2026).
- **Checksum:** since 2026-10-18, `letter = "TRWAGMYFPDXBNJZSQVHLCKE"[ (notaInt + dd + mm + hh + min + salt.charCodeAt(0) + Σ((i mod 22)+1)·ASCII(cos[i])) % 23 ]` with `cos = EE+D+S+QQ+R`, so it covers every field including `R` (`P01`, done). Same formula as `operacions/js/codi-verificacio.js`, copied into `codi.js` (v3 body: `CB+D+S+QQ+AA+F+SS+EEEE+R`); both repos test the same fixed vectors.
- **Known weakness:** decode logic lives in a separate repo (`operacions/js/analitzador-stepquiz/llegeix-codi.js`), kept in step with generation only by the shared fixed vectors (plus a 300-code round trip when both repos are cloned side by side).
- **Related:** student-practice counterpart of `comp4eso` (teacher grading) on the same CB-competencies theme.
- **Status:** Mature/working.
- **Participates in:** S1, S4, S5.

---

### `operacions` — Step Quiz: Interactive Mathematics

- **Purpose:** ~25 interactive math exercises (ESO + Batxillerat) with step-by-step feedback, session scoring, and a verification code. The largest project.
- **Audience:** Teachers (link generator) + students.
- **Stack:** Vanilla JS, native ES modules only (no build step, no shared globals); KaTeX (vendored) for LaTeX. Needs HTTP, not `file://` (`node tools/servidor.js`).
- **Entry points:** `index.html` (link generator); ~40 per-exercise `*.html` files (`enters.html`, `fraccions.html`, `derivades.html`, `integrals.html`, `inversa-matriu.html`, …). `analitzador-stepquiz.html` (teacher analyzer).
- **Key files (shared, ES modules):** `js/utils.js` (pure helpers), `js/config.js` (URL params), `js/game-core.js` (session/scoring/code engine + numeric keyboard; game state in an exported `state` object), `js/exercise-codes.js`, `js/fixed-sessions.js`, `js/esvaiment.js` (fading worked examples, `?esvaiment=1`), `js/pissarra/` (animated step-by-step board, `?pissarra=1`), `css/shared.css`, `css/pissarra.css`.
- **Key files (new modular exercises, e.g. `js/derivades/`):** `math-engine.js`, `strings.js`, `distractor-lib.js`, `question-bank.js`, `<exercise>.js` (DOM controller). Also present for `integrals`, `recta-numerica`, `asimptotes`.
- **Architecture:** Every exercise page loads one ES-module entry (`js/<exercise>/<exercise>.js`) that imports the shared base; no exercise JS left inline in the HTML (only `window.APP_CONFIG`). Non-exercise pages still carry inline JS (`index.html`, the tutorials, `setup_vocabulari.html`). The stale copies of other projects (`cb/`, `gem4eso/`, `app/`, `cb.html`, `informe-cb.html`) and the unlinked pages (`meteo*.html`, `decaleg-pau.html`, `descripcio-grafica-inversa.html`) were removed on 2026-10-18. *Older* exercises (equacions, fraccions, …) are a single module each; *newer* ones use a layered split: a pure math engine with **no DOM dependency**, a strings module, a distractor library, and a thin DOM controller.
- **Excellent features:**
  - **`DistractorLib` — misconception-tagged distractors.** Wrong answers are generated to correspond to *named* student errors (`CHAIN_FORGOT`, `SIN_COS_SWAP`, `QUOTIENT_SIGN`, `POWER_FORGOT_R`, `LOG_INVERTED`, …), each carrying its own targeted feedback string and a `scope` (`universal` / `family:exp` / `rule:product` …). Picking a wrong option tells the student *which* mistake they made. This is the highest-ceiling pedagogical idea in the ecosystem and it is currently siloed in 3–4 exercises (see `P06`).
  - **Pedagogically-tuned RNG** (`math-engine.js`): random coefficients are not uniform — small values are weighted higher, and *trivial* cases are excluded (e.g. `generateKExp()` drops `k=±1` for `e^{kx}` because the chain rule becomes invisible there). The randomness is designed for teaching, not for fairness.
  - **`fixed-sessions.js` — deterministic shared sessions with zero backend.** `?fixed=A` (or `B`/`C`) makes **every** student opening the same link get the **exact same** exercises/numbers/options. Mechanism: replace `Math.random()` with a seeded **Mulberry32** PRNG, then inject URL params via `history.replaceState` **before** `config.js`/`game-core.js` read them. Must run **first**: `config.js` imports it before anything else (checked by `tests/check-repo.js`). Elegant and reusable (see `P10`).
  - **Layered architecture** (`math-engine` has no platform/DOM deps) makes the math independently testable (`run-tests.js`).
  - **`js/pissarra/` — «Resolució pas a pas», the Graspable-Math-style animated board** ported from `pau`'s `procediments/` engine as ES modules (2026-10-27): a procedure is a pure function data → list of board states; symbols carry keys (`\htmlData{k=…}`) and the board animates the difference between consecutive states (travel, merge, fade), measured on the real KaTeX DOM. Embeddable component `creaPissarra(container, {files})` + optional player; KaTeX lazy-loaded. Activities opt in through `SUPORTA_PISSARRA` (`js/pissarra/mode.js`) = `pissarra: true` in `index.html`, whose button «Activar la resolució pas a pas» filters the menus and adds `pissarra=1` (off by default). Purely visual: no change to questions, scores or codes. Tests: structural lint of every script, KaTeX renders every formula, and every displayed line is evaluated exactly against an independent model (`tests/pissarra.test.js`); Playwright test of the demo page and the index button. Wave 0 (engine, demo `pissarra-demo.html`) and wave 1 (pilot `prioritat`: its own table animated through HTML rows with keyed cells) done; the other activities are added one by one. Docs: `docs/pissarra/MOTOR.md`, `docs/pissarra/STATE.md`.
  - **`esvaiment.js` — fading worked examples (backward fading, errorless).** `?esvaiment=1` (optional `&inici=k`): the first items are fully worked, revealed one step at a time; then the student does the last `k` steps. Two error-free items in a row → `k+1`; any error → the correct step is modelled (row marked «amb ajuda») and `k−1` (floor 0). No attempts, no points, **no verification code** (`copiarResultats()` returns early; asserted by `tests/check-repo.js`). Pure state machine (`Esvaiment`) + per-page session (`ESVAIMENT`, `null` when inactive); each supporting exercise exposes its steps as pure data from its `math-engine.js` (no `Math.random`, so fixed sessions are unaffected). Pilot: `prioritat` (since 2026-10-18); `equacions` and `fraccions` planned. Spec: `docs/esvaiment/SPEC.md`; state: `docs/esvaiment/STATE.md`.
- **Code format (v2, 59 chars):** `Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRR...R(30)`. Checksum identical to `cb`; since 2026-10-18 it covers every field including `R` (`js/codi-verificacio.js`, tested by `tests/codi-verificacio.test.js`), and the analyzer shows older codes as ☑️ (valid, results not verified) — see `P01`. The analyzer decodes both `EE`-coded Step-Quiz codes **and** every `CB` format (v1-cb, v2, v3) in one pure module, `js/analitzador-stepquiz/llegeix-codi.js`, tested by `tests/llegeix-codi.test.js` with one code of each format and era plus generate→parse round trips. Both generators (`game-core.js`, `vocabulari.js`) build the code with `construeixCodiV2()`.
- **Lineage note:** `informe-cb.html` (+ `informe-cb-refactor.md`), removed on 2026-10-18 and still in git history, was the original single-file CB grader later refactored into the standalone `comp4eso` project.
- **Status:** Mature. Old-inline → module migration done (all JS in `js/`); per-exercise helpers such as `penalize()` remain game-specific.
- **Participates in:** S1, S4.

---

### `karelcat` — KarelCat (intro programming via Karel)

- **Purpose:** First programming course for 16-year-olds with no prior experience; the student controls "Karel", a programmable jellyfish on a grid, using **Python-compatible syntax**. 10 chapters + 13 reptes.
- **Audience:** Beginner students.
- **Stack:** Vanilla JS (namespace `K`); custom language engine (tokenizer + parser + interpreter).
- **Entry points:** `index.html` (free simulator); `curs/index.html` (course). Auxiliary authoring tools: `edit-mapa.html`, `editor-reptes.jsx`.
- **Key files:** `js/tokenizer.js`, `js/parser.js`, `js/interpreter.js`, `js/execution.js`, `js/world.js`, `js/renderer.js`, `js/editor.js`, `js/kbd-accessory.js` (mobile keyboard; the older simple-keyboard version `js/vkbd.js`, which no page loaded, was deleted on 2026-10-17), `curs/capitols.js` (data + `renderSidebar()` + `renderSimuladors()`), `curs/progress.js`, `docs/CURRENT-STATE.md`, `docs/i18n-spanish-guide.md`.
- **Architecture:** Any valid Karel program is valid Python (given a shim). Course uses iframes for embedded simulators + deep links; progress is a dedicated module.
- **Excellent features:**
  - **`curs/progress.js` — clean extracted progress module.** localStorage schema `{capitols:{n:true}, reptes:{n:[bool...]}}`; "a success is never downgraded" invariant baked into `saveExercici`/`saveMon`. The only course that extracted this into its own module (others inline it — see `P08`).
  - **Two-axis i18n with a written migration guide** (`docs/i18n-spanish-guide.md`): `codeLang` (the typed programming vocabulary — **always English, immutable**: `move()`, `while`, `def`, `True`…) is kept strictly separate from `uiLang` (buttons/errors/hints). Currently `ca`/`en`; the guide gives a ready-to-paste `es` block (see `P09`).
  - **Most advanced mobile keyboard bridge** (`kbd-accessory.js`): when the editor is inside a course iframe, it posts to the **parent** document so the accessory bar renders at top-level (above the system keyboard), using the Visual Viewport API for positioning (see `P05`).
- **Status:** Pedagogically complete; pending items are visual polish + optional future i18n. Course test `tests/comprova-curs.js` runs on GitHub on every push and PR (`tests.yml`, since 2026-10-18). Spin-off `karelcat-p` (easy-read Catalan, Primary / newcomers) shares the same engine.
- **Participates in:** S1, S2, S3, S8.

---

### `pycat` — PyCat (real Python in the browser)

- **Purpose:** Sequel to KarelCat; teaches real Python via **CPython compiled to WebAssembly (Pyodide)**. 13 chapters (11 + two extras: 4-in-a-row and turtle graphics) + 15 reptes.
- **Audience:** Students who finished KarelCat or equivalent.
- **Stack:** Vanilla JS (namespace `P`); Pyodide (~12 MB, cached) in a Web Worker.
- **Entry points:** `index.html` (free simulator, also the course iframe); `curs/index.html`.
- **Key files:** `js/pyrunner.js` (Pyodide wrapper + CDN fallback), `js/pyworker.js` (runs Python, captures stdout/stderr), `js/editor.js`, `js/console.js`, `js/kbd-accessory.js`, `js/sw-register.js` + `sw.js` (Service Worker **kill-switch**), `curs/capitols.js`, `curs/glossari-data.js`, `tools/generate-pages.js` (+ `tools/pages/*.json`), `tests/` (`test-exercises.html`, `solutions.js`), `_headers` (COOP/COEP).
- **Architecture:** Worker receives `{type:'run', code}` and emits `stdout`/`stderr`/`done`/`error`.
- **Excellent features:**
  - **Blocking `input()` inside a Worker via `SharedArrayBuffer` + `Atomics.wait()`.** This makes interactive `input()` behave synchronously (the Worker blocks while the student types). Requires the COOP/COEP headers in `_headers`; degrades gracefully to a pre-execution stdin panel when headers are absent. The single most technically interesting solution in the courses.
  - **`tools/generate-pages.js` — JSON → HTML page generator.** Describe a chapter/repte as JSON (`type`, `num`, `titol`, `sections[]`, `simulador{goalId,code,stdin,expected,tests,testcode,readonly,height}`, `prev`/`next`, `hint`); the tool renders a structurally-consistent course page. CLI flags: `--only`, `--dry-run`, `--input`, `--out`. Lets the common page skeleton be edited in one place. **Highly portable to other courses** (see `P03`).
  - **Service Worker kill-switch** (`sw.js` + `sw-register.js`): safe path to deregister the SW and clear caches if a bad cache ships — important given Pyodide's heavy caching.
  - **Mobile keyboard with grouped keys** (`kbd-accessory.js`): Python symbol set with visual separators; hides in embed mode.
- **Status:** Mature/working.
- **i18n:** `js/i18n.js` ships **Catalan only** (flat `P.UI` dict); the README no longer claims otherwise. See `P09`. Tests: `python3 tests/comprova-curs.py` (44 exercises), run on GitHub on every push and PR (`tests.yml`, since 2026-10-18).
- **Participates in:** S1, S2, S3, S8.

---

### `jscat` — JSCat (JavaScript course)

- **Purpose:** Third course in the series; teaches JavaScript. Part A (ch. 1–8) = console JS (same ground as PyCat); Part B (ch. 9–12) = browser JS (DOM, events, canvas, animation, mini-game). 12 chapters + 13 reptes planned.
- **Audience:** Beginner secondary students.
- **Stack:** Vanilla JS (namespace `J`); two execution modes.
- **Entry points:** `index.html` (simulator, both modes); `curs/index.html`.
- **Key files:** `js/jsrunner.js` + `js/jsworker.js` (console mode), `js/domrunner.js` (DOM mode), `js/editor.js` (JS highlight + autocomplete), `js/console.js`, `curs/capitols.js`.
- **Architecture:** **Two execution sandboxes.** *Console mode* (ch. 1–8): a Web Worker overrides `console.*`, shims `prompt()` to read from a pre-loaded stdin, kills infinite loops with `worker.terminate()` after a 5 s timeout, and **re-spawns the Worker after every run** for a clean context (avoids `let`/`const` re-declaration errors). *DOM mode* (ch. 9–12): a sandboxed iframe; student code is injected via `postMessage` and run with `(0,eval)(code)` in the iframe's global scope; iframe reloads before each run. (Caveat: DOM mode cannot kill infinite loops — chapter 9 warns about this.)
- **Validation contract (shared with pycat/karelcat):** `data-expected` (exact stdout), `data-tests` (`[{stdin,expected}]` cases), `data-testcode` (JS appended after student code; in DOM mode can fire `element.click()` and assert resulting state).
- **Excellent features:**
  - **Worker re-spawn per execution** for guaranteed clean global scope — the cleanest answer to "redeclaration of `let`" in a REPL-like setting.
  - **Dual-sandbox design** sharing one validation contract.
- **Status:** **Incomplete.** Chapters 1–12 written, but 11–12 hidden (`VISIBLE_MAX_CHAPTER = 10`); only repte 1 of 13 written and the reptes section is hidden (`SHOW_REPTES = false`). Biggest beneficiary of `P03`.
- **Known doc/reality gap:** `js/i18n.js` is Catalan-only. See `P09`.
- **Participates in:** S1, S2, S3, S8.

---

### `logocat` — LOGOcat (Logo / turtle graphics)

> **Not in the `step-quiz` GitHub organisation** (checked 2026-10-17): this entry describes the Jan–Jun 2026 export and cannot be verified against a live repository.

- **Purpose:** Educational Logo interpreter; students type `avança(100)` / `gira.dreta(90)` and a turtle draws on a canvas. 12 challenges (7 basic + 5 advanced).
- **Audience:** Beginner students.
- **Stack:** Vanilla JS (namespace `L`); custom generator-based interpreter; optional single-file build (`build.sh`).
- **Entry points:** `index.html`.
- **Key files:** `js/constants.js` (`CMD_MAP`/`KW_MAP` per language, `levenshtein`), `js/i18n.js` (full `ca`/`es`/`en` + challenges + onboarding), `js/tokenizer.js` (`LogoSyntaxError` + `tokenize`), `js/parser.js`, `js/interpreter.js` (`function* interpret(ast)` — yields per step), `js/canvas.js` (`applyTurtleCommand()`), `js/editor.js` (highlight + autocomplete), `js/help.js` (error post-it), `js/challenges.js` (timed hints + goal preview + validation).
- **Architecture:** Generator interpreter (`yield` per step) powers both animated and step-by-step execution. `applyTurtleCommand()` is the **single source of truth** for movement, reused by the real interpreter *and* the challenge goal-preview renderer (true DRY).
- **Excellent features:**
  - **Best-in-class contextual error pedagogy.** `LogoSyntaxError` carries an error `code` + `vars` (with `line`/`col`); `.msg` and `.help` are looked up from i18n templates with `{var}` interpolation. The parser throws specific codes (`empty_parens`, `missing_open_brace`, `expect_num`, `missing_proc_name`, …). `findSuggestion()` uses **Levenshtein distance** to power "did you mean `avança`?". `help.js` renders the message into a **post-it panel** with a runnable code example (`<code>{word}(100)</code>`). This is the reference implementation for `P02`.
  - **Two independent language axes** (the gold standard for the courses): *code language* (`avança`/`avanza`/`forward`) and *UI language* are chosen separately, so e.g. a Spanish-speaking student can code in Catalan with a Spanish UI. Adding a command = edit `CMD_MAP` (3 langs) + `I18N.commands` (3 langs) + one `case` in `applyTurtleCommand()`.
  - **Trilingual for real** (`ca`/`es`/`en`), unlike pycat/jscat.
- **Status:** Working; well-factored.
- **Participates in:** S1, S3, S8.

---

### `ggcat` — GeoCat (interactive GeoGebra course)

- **Purpose:** Geometry course built on embedded GeoGebra applets, with auto-validated challenges. 10 chapters + 10 reptes done, 20 reptes specified-but-pending.
- **Audience:** ESO + Batxillerat students.
- **Stack:** Vanilla JS; GeoGebra loaded from CDN (`geogebra.org`) — requires internet.
- **Entry points:** `index.html` (landing); `curs/index.html`.
- **Key files:** `curs/capitols.js` (data, sidebar, widget injection, progress, glossary), `curs/geovalidator.js` (`GV` assertion library), `curs/validators.js` (`goalId → validator` map), `curs/glossari-data.js`, `REPTES_SPECIFICATION.md` (the 20 pending reptes), `test-validators.js` (Node test harness).
- **Architecture:** A `georunner` injects `window.ggbApplet`; validators read live applet state.
- **Excellent features:**
  - **`GV` — a geometric assertion library with a documented "robust validation" philosophy.** Rules (architecture §7.3): never check specific labels the student may not have used; iterate via `getAllObjectNames(type)`; use a tolerance `eps` for all float comparisons; validate **only the final state**, never construction steps; avoid trivial validators. Helpers like `coordsEqual`, `distanceEqual`, `allSidesEqual(...)`, `exactSidesEqual(points, count)` express geometric intent declaratively.
  - **`goalId → function(api, GV) → boolean` validator registry** keeps each repte's check small, label-agnostic, and reviewable.
  - **localStorage progress** (`geocat_progress`), no server.
- **Status:** Partially complete (20 reptes pending; spec already written → good `P03` candidate).
- **Participates in:** S1, S2, S8.

---

### `m` — Department Material Catalog + tools

- **Purpose:** Search/catalog of the math department's teaching material (mostly on Google Drive), plus a toolbox to catalog, edit, and work with CB tests.
- **Audience:** All teachers (+ a maintainer subset for the editor tools).
- **Stack:** Vanilla JS; no build. (`manifest.json` is the material catalog, not a PWA manifest.) The SHA-256 password gate (`auth.js`) has been **removed**: `repartiment.html` is public.
- **Entry points (pages):** `index.html` (search + filters + Drive preview), `repartiment.html` (curriculum distribution), `afegir-material.html` (manifest editor), `extreu-json.html` (**AI cataloguer**), `banc-cb.html` (CB item bank → PDF export), `eliminar-curs.html` (strip a course-year from a PDF/DOCX, client-side), `florence-cb.html` (Florence sessions ⇄ curriculum ⇄ CB), `examen-recuperacio.html` (resit-exam generator → DOCX), `alimentar-banc.html` (AI: photos → resit-bank questions). `seguiment.html` no longer exists (the «Seguiment» link moved to `pd`, and was removed from there on 2026-10-17).
- **Key files:** `manifest.json` (catalog — single source of truth for the search), `repartiment-data.js` (curriculum; read by `repartiment.html` and `florence-cb.html`), `pipeline-data.js` (curriculum ⇄ Florence ⇄ CB threads), `cb-items.json` (218 questions), `cb-img/` (169 PNGs), `recuperacio-items.json` + `recuperacio-img/`, `common.js`, `valida-dades.js` (data consistency check), `lib/` (vendored pdf-lib, pdf.js, jszip).
- **Excellent features:**
  - *(Former)* **`auth.js` — SHA-256 access gate** (hash-only password, 30-day session). Removed from the repo; only a commented-out `<script>` line remains in `repartiment.html` (see `P07`).
  - **Gemini cataloguer with dynamic model discovery** (`extreu-json.html`): "Carrega models" lists **only** the models the supplied key can actually use (avoids "model not found"); a **response JSON schema** constrains Gemini to valid vocabulary slugs; key is in-memory only. Complementary to `cangur`'s retry logic (see `P04`).
  - **Client-side PDF/DOCX manipulation** (`eliminar-curs.html`, `banc-cb.html`) via vendored `pdf-lib`.
- **External dependencies:** Google Drive/Docs, `generativelanguage.googleapis.com` (Gemini); no CDN (all libraries are local in `lib/`), and since 2026-10-18 the CB bank images are a local palettised copy in `cb/data/` (`genera_cb_items.py --imatges`), so `banc-cb.html` works offline.
- **Status:** Mature/working.
- **Participates in:** S1, S6, S7.

---

### `llibre` — Digital Math Textbook (PDF viewer)

- **Purpose:** View and download the department's ESO maths textbook at any granularity (whole course, one unit, or any set of single activities).
- **Audience:** Teachers and students.
- **Stack:** Vanilla JS; vendored `pdf-lib` for in-browser PDF merging; no build.
- **Entry points:** `index.html` (course picker); `1eso.html`, `2eso.html`, `3eso.html`, `4eso.html`, `4eso-apl.html` (each sets `window.COURSE`).
- **Key files:** `contingut/{curs}/course.json` (units and activity titles), `contingut/{curs}/pdfs/manifest.json` (which PDFs exist + first solutions page of each), `contingut/{curs}/numeracio.json`, `assets/js/{app,course-tree,pdf-merge}.js`, `eines/sync.py` (LaTeX source → PDFs + metadata).
- **Architecture:** One atomic PDF per activity (`{curs}-ud{U}-{A}.pdf`), compiled from a separate Overleaf LaTeX project; `sync.py` regenerates PDFs, `course.json`, `manifest.json` and `numeracio.json`. The tree view supports tri-state selection and merges the chosen PDFs client-side; a **SOL** toggle adds or strips the teacher solutions pages.
- **Excellent features:**
  - **Client-side merging of atomic PDFs** with automatic file naming (whole course / one unit / custom selection).
  - **Single source of truth in LaTeX**: titles in the web come from `\horatitol` in the `.tex`, never typed by hand.
- **Overlap to exploit:** could link activities to `m`'s catalog and to `operacions` exercises (see `P12`).
- **Status:** Working; 5 courses published (1r ESO 76 activities, 2n 53, 3r 54, 4t Acadèmiques 65, 4t Aplicades 72).
- **Participates in:** S1.

---

### `pau` — PAU Exam Repository

- **Purpose:** Curated repository of PAU (university-entrance) exam statements, hints, and solutions, with optional explanatory videos. 67 exercises (2023–2026).
- **Audience:** Batxillerat students preparing for PAU.
- **Stack:** Vanilla JS; PDF-backed; editorial config in JS.
- **Entry points:** `index.html`.
- **Key files:** `index.html` (`EXERS` list), `config.js` (`OPTATIUS` set + `VIDEOS` map), `data/` (PDFs named `{topic}-{year}{session}-q{n}-{e|p|s}.pdf` — `e`=statement, `p`=hint, `s`=solution), `pistes/src/<id>.tex` + `pistes/build.py` (hints are compiled from LaTeX; a GitHub Action rebuilds them on push), `UPDATING.md` (how to add a session).
- **Architecture:** Editorial-config pattern: edit `config.js` to mark optional exercises and attach YouTube videos; no need to touch `index.html`. The `e/p/s` triad is the same **statement/hint/solution** shape used by `cangurcat` and `cb`.
- **Excellent features:**
  - **Zero-touch editorial workflow** — content curation done entirely in a small `config.js`.
- **Status:** Working; minimal docs. Currently passive (no progress tracking) — see `P11`.
- **Participates in:** S1, S5.

---

### Repositories in the `step-quiz` organisation not catalogued above

Checked 2026-10-17. Each has its own README; they are listed here so the catalog is complete.

| Repo | What it is |
|---|---|
| `a` | Step Quiz activities adapted for the *aula d'acollida* (newly arrived students learning Catalan), `a.step-quiz.net`. |
| `app` | Public landing page of Step Quiz (cards linking to the sites). |
| `ins` | School portal page linking to every site. |
| `repas` | ESO self-assessment for students starting 1r Bat (12 sheets, ~950 questions). |
| `geom` | 130 open synthetic-geometry questions to explore (no scoring). |
| `pi` | Adapted maths material (worksheets, digital toolbox, Word exams) for students with cognitive difficulties, 1r and 4t ESO. |
| `inaba` | Naoki Inaba's maths puzzles, translated into Catalan and made interactive. |
| `combinades` | Combined-operations / «complete the equality» worksheet generator (LaTeX + PDF). |
| `recu` | Resit-exam builder for ESO (prova, correcció, pla de repàs). |
| `prova1eso` | Initial-level test builder for 1r ESO. |
| `exam2bat` | Question bank and exam builder for Matemàtiques II (2n Bat), PAU questions included. |
| `sol` | Weekly exercise tasks for 2n Bat with hints and corrected solution-manual errata. |
| `pd` | Batxillerat teaching programmes viewer (+ curriculum distribution). |
| `htmlcat` | HTML + CSS course (sibling of the `*cat` courses). |
| `karelcat-p` | Easy-read spin-off of `karelcat`. |
| `cagg` | Image catalogue/triage tool for #MathsToday posts. |
| `pos` | Classroom positives/negatives tracker. |
| `test-tutor` | Authoring tool for tutor test batteries (IC-002). |
| `tutor-cangur`, `tutor-eq`, `tutor-grups`, `tutor-probabilitat` | Private Streamlit AI-tutor prototypes (Python + Gemini). |

---

## Part 2 — Shared structures (cross-cutting patterns)

Stable ids. Use these to decide whether a feature should become a shared module.

- **`S1` — Static-first, no-build deployment.** *All projects.* Plain files on Cloudflare/GitHub Pages; publish = commit. Optional Node tools are dev-only.

- **`S2` — Course chassis.** *karelcat, pycat, jscat, ggcat.* A `curs/` folder with: a sidebar with progress checkmarks, chapter + repte pages, **embedded simulators via iframes**, a `capitols.js` holding data + `renderSidebar()`/`renderSimuladors()`, a `curs.css`, and localStorage progress. The four implementations are siblings ("same pedagogical and visual pattern") but each maintains its own copy.

- **`S3` — Code-execution sandbox.** *karelcat (custom interpreter), pycat (Pyodide/WASM Worker), jscat (Worker console + iframe DOM), logocat (custom generator interpreter).* Common shape: an editor (highlight + autocomplete) feeds code to a runner; output is captured and shown; infinite-loop protection where the runtime allows it.

- **`S4` — Verification code / anti-fraud.** *cb, operacions, cangurcat.* A compact code = `checksum-letter + salt + date/time + exercise-code + counters + per-question results`. Checksum is a **DNI-style** mod-23 letter over the alphabet `TRWAGMYFPDXBNJZSQVHLCKE`. A standalone single-file HTML **analyzer** decodes and validates submitted codes (read from the Google-Form CSV). **Known systemic gap:** the checksum does **not** cover the per-question results string; only `cangurcat`'s analyzer cross-verifies it (target of `P01`).

- **`S5` — Statement / hint / solution viewer.** *cangurcat (images), cb (images), pau (PDFs).* Same conceptual triad; different media + different amounts of session machinery (cangurcat is the richest).

- **`S6` — In-browser LLM calls.** *comp4eso (origin: Anthropic+Gemini OMR), cangur (fork of that OMR), m (Gemini), cangurcat (planned).* Direct browser → provider calls; **API key in memory only, never persisted**. Strengths are split: `comp4eso`/`cangur` have multi-provider routing + tiered retry/backoff; `m` has dynamic model discovery + JSON-schema-constrained output (target of `P04`). `comp4eso/js/ai-recognizer.js` is the original; `cangur`'s is the adaptation.

- **`S7` — Data-driven material catalog.** *m (`manifest.json`, teacher catalog/search), llibre (`course.json` + `manifest.json` per course, textbook PDFs).* Both render content from flat data files over overlapping material (target of `P12`).

- **`S8` — Namespace + centralized-state module pattern.** *logocat (`window.L`), pycat (`P`), jscat (`J`), karelcat (`K`), cangur + comp4eso (ES-module `state.js`).* All modules attach to one namespace; a single `state` object is the source of truth; `render` syncs DOM from state. (Contrast: `cangur`/`comp4eso` use true ES modules; the courses use IIFE-on-namespace.)

- **`S9` — Shared design language, divergent CSS.** *all.* Recurring visual identity (tokens, dark/light theme, the "post-it"/badge motifs) but each project re-implements it (`tokens.css`, `shared.css`, `curs.css`, inline). No shared design-token source (touched by `M1`).

- **`S10` — OMR answer-grid grading shell.** *comp4eso (origin), cangur (fork).* A teacher-facing shell sharing a near-identical ES-module tree: `state.js` + `render.js` (state→DOM), `grid.js` (answer cells/columns), `keyboard.js`/`main-keyboard.js` (fast answer entry), `navigation.js`, `student-modal.js`, `pdf-viewer.js` (pdf.js), `ai-recognizer.js` (OMR), `scoring.js`, `export.js`, plus shared `styles/` (`tokens`/`animations`/`layout`/`components`). The two diverge only in domain (CB competencies vs Cangur competition) and outputs (DOCX reports vs XLSX). Prime copy-paste-drift case (target of `P13`, feeds `M1`).

---

## Part 3 — Improvement backlog (numbered, prioritized)

> Edit `Status`/`History` here when you ship. Ordered by priority tier, but the permanent handle is the `P##` id.

### `M1` (META) — Establish a shared "commons" to stop copy-paste drift
- **Status:** IN PROGRESS (2026-10-18) — `step-quiz/step-quiz-commons` exists. Absorbed so far: `P05` (`kbd-accessory.js`), `P08` (`progress.js`), plus `footer.js`, `family.js`, the family icons and the licence text, for `karelcat`, `karelcat-p`, `pycat`, `jscat`, `htmlcat` and `ggcat`. Update path: `comuns.json` says what each site receives and with which config; each site's `.github/workflows/comuns.yml` runs `sincronitza.py` daily (and on demand) and commits the copy. Not yet absorbed: `codi.js`, `ai-client.js`, `auth.js`, `error-help.js`, the OMR shell, design tokens.
- **Priority:** P1 (umbrella)
- **Problem:** Genuinely shared logic is copy-pasted between repos and has already drifted. Direct evidence: `cangur` is a whole-app **fork of `comp4eso`** (the `S10` OMR shell — `state`/`render`/`grid`/`keyboard`/`scoring`/`ai-recognizer`/… — duplicated wholesale), and `cangur/js/ai-recognizer.js` even documents itself as "an adaptation of the homonymous module from comp4eso." `S4` (verification code) exists in 3 divergent copies; the `S2`/`S3` course chassis exists in 4.
- **Proposal:** Create one small shared library — call it `step-quiz-commons` — and consume it everywhere via a shared folder, a git submodule, or a trivial copy step (no framework; preserve `S1`). Candidate modules: `codi.js` (from `P01`), `ai-client.js` (`P04`), `auth.js` (`P07`), `progress.js` (`P08`), `kbd-accessory.js` (`P05`), `error-help.js` + `LogoSyntaxError`-style class (`P02`), the `S2` course chassis, the `S10` OMR grading shell (`P13`), and a single design-token CSS (`S9`).
- **Acceptance criteria:** at least two projects import the *same* file for a given concern (not two copies); a documented update path; this `M1` entry lists which `P##` modules have been absorbed.
- **History:** 2026-06-05 created.

---

### `P01` — Cross-verify the results string + unify the verification-code module
- **Status:** DONE (2026-10-18), by a different route than step 1 below · **Priority:** P1
- **What was done:** step 3 ("fold a digest of `R` into the checksum"), extended to every field the old letter ignored. New letter = old sum + Σ((i mod 22)+1)·ASCII(cos[i]), `cos = EE+D+S+QQ+R` (v2/CB) or `TTTTT+R` (CG); weights 1–22 with modulus 23 (prime) mean any single-digit change always breaks it. The code layout is unchanged (same length and characters, so form validations keep working). Analyzers accept both letters: new → ✅ results verified; old → ☑️ valid, results not verified (codes before 2026-10-18). `operacions`: one module `js/codi-verificacio.js` used by `game-core.js`, `vocabulari.js` and the analyzer; `cb/codi.js` has an identical copy checked against the same test vectors; `cangurcat`: `js/codi.js` + the analyzer copy. Steps 1–2 (shared generate+parse module across repos) remain open as a refactor.
- **Source → Target:** `cangurcat/js/codi.js` (canonical generate+parse) and `cangurcat/analitzador-cangur.html` (cross-verification) → **`cb`** and **`operacions`** analyzers.
- **Affected files:** `cb/core.js` + cb analyzer; `operacions/js/game-core.js` + `operacions/analitzador-stepquiz.html`; new shared `codi.js`.
- **Rationale:** In `cb` and `operacions` the DNI checksum covers `nota + date/time + salt` but **not** the per-question `R` string, so a student can edit `R` without breaking the checksum, and neither analyzer notices. `cangurcat` already solved this.
- **Implementation:**
  1. Port `cangurcat`'s cross-check into both analyzers: recompute `answeredR` / `solvedR` from `R` and assert they equal the `QQ` / `AA` counters; mark mismatches invalid (independently of the checksum). (`answeredR = R.filter(v => 1<=v<=9).length`; `solvedR = R.filter(v => 1<=v<=8).length` — adapt digit meanings per code spec.)
  2. Refactor generation + decoding into **one** shared `codi.js` per the `cangurcat` pattern (generate and parse in the same module → guaranteed parity). Have `cb` and `operacions` import it.
  3. Optional hardening: fold a digest of `R` into the checksum input so even the checksum covers `R`.
- **Acceptance criteria:** a hand-edited `R` is flagged invalid by both analyzers; `cb`/`operacions` generation and decoding come from one module; existing valid historical codes still validate.
- **Risk/notes:** `cb`, like `operacions`, is content `CC BY-NC-SA 4.0` + code `MIT`, so the shared module can be shared freely. The `operacions` analyzer already parses `CB` codes; keep that working.
- **History:** 2026-06-05 created.

---

### `P02` — Port logocat's contextual error pedagogy to the programming courses
- **Status:** PROPOSED · **Priority:** P1
- **Source → Target:** `logocat` (`tokenizer.js` `LogoSyntaxError`, `findSuggestion` Levenshtein, `help.js` post-it, i18n `errors` block) → **`karelcat`**, **`jscat`**, **`pycat`**.
- **Affected files:** new shared `error-help.js` + a `SyntaxError`-style class; per-project error sites (parsers/runners) and i18n; a `#error-help-panel` element + CSS in each editor page.
- **Rationale:** For absolute beginners, the error message *is* the lesson. logocat turns errors into a code-with-`{var}`-template + Levenshtein "did you mean?" + a post-it with a runnable example. None of the other courses do this.
- **Implementation:**
  - `karelcat`, `jscat`: own interpreters/runners → throw error objects with `{code, vars{line,col}, suggestion}`; render via the shared post-it; back suggestions with Levenshtein against the known command/keyword set.
  - `pycat`: cannot change CPython errors → add a **translation layer** in `pyworker.js`/`console.js` that maps the most common Python errors (`NameError`, `SyntaxError`, `IndentationError`, `TypeError` for `str`+`int`) into the same post-it, with "did you mean?" against the identifiers/symbols taught so far.
- **Acceptance criteria:** a typo (e.g. `mvoe()`/`pirnt()`) yields a "did you mean?" suggestion; a missing-argument/brace/colon error yields a targeted post-it with a correct example; messages are i18n-templated.
- **Risk/notes:** keep messages short and example-driven (logocat's style). Don't over-translate Python errors — cover the top few.
- **History:** 2026-06-05 created.

---

### `P03` — Adopt the JSON→HTML page generator for the unfinished courses
- **Status:** DONE (2026-10-18) for the tooling; the pending pages still have to be written · **Priority:** P1
- **What was done:** one `tools/generate-pages.js`, identical in `pycat`, `jscat` and `ggcat`, with a per-course `PROJECTE` block (header, scripts, hint style, simulator class and attributes — GeoGebra for `ggcat`). `--comprova` checks that `tools/pages/*.json` reproduce the published pages exactly (in CI); `tools/extreu-pagina.js` converts an existing repte back to JSON. All published reptes round-trip identically (pycat 15, jscat 1, ggcat 10).
- **Source → Target:** `pycat/tools/generate-pages.js` (+ `tools/pages/*.json`) → **`jscat`** (only 1/13 reptes + 2 chapters left) and **`ggcat`** (20/30 reptes pending, already specified in `REPTES_SPECIFICATION.md`).
- **Affected files:** new `jscat/tools/`, `ggcat/tools/`; their `curs/*.html`.
- **Rationale:** jscat and ggcat share the same validation contract (`data-expected`/`data-tests`/`data-testcode`) and the same `S2` chassis as pycat, so the generator is ~90% portable — only the header template and the trailing `<script>` block differ per project. This unblocks finishing both courses fast and keeps pages structurally identical.
- **Implementation:** copy `generate-pages.js`; parameterize `renderPage()`'s header/logo + `renderScripts()` per project (and `glossari-data.js` presence); author the remaining pages as JSON; run `--dry-run` then generate. For ggcat, the simulador block emits a GeoGebra widget instead of a code editor — adapt `renderSimulador()` accordingly (`goalId` + applet config).
- **Acceptance criteria:** the remaining jscat/ggcat pages are generated from JSON and pass their existing test harness (`tests/` for pycat-style; `ggcat/test-validators.js` for ggcat).
- **Risk/notes:** generator output is *semantically* equal but may differ in whitespace/`aria-*` from hand-written pages — fine for new pages; do not bulk-rewrite existing ones.
- **History:** 2026-06-05 created.

---

### `P04` — Extract a shared AI client (provider routing + retry + model discovery)
- **Status:** PROPOSED · **Priority:** P2
- **Source → Target:** `comp4eso/js/ai-recognizer.js` (**origin** of the OMR engine: multi-provider + tiered retry) **+** `m/extreu-json.html` (dynamic model discovery + JSON-schema output) → shared `ai-client.js`, consumed by **`comp4eso`**, **`cangur`** (currently a fork-copy of the same file), **`m`**, and **`cangurcat`** (when its AI is re-enabled).
- **Affected files:** new `ai-client.js`; refactor the two source sites to import it.
- **Rationale:** the strengths are split across two copies and drift is already happening (`S6`). One client should provide: provider routing (`anthropic`/`google`), tiered transient-vs-permanent retry with backoff, **dynamic model listing** ("only models this key can use"), JSON-schema-constrained output, and in-memory-only key handling.
- **Implementation:** define `aiCall({provider, model, apiKey, parts, schema, maxTokens})` + `listModels({provider, apiKey})`; move `_callAnthropic`/`_callGemini` and the backoff table in; move the "Carrega models" filter in; keep image/base64 input support for `cangur`.
- **Acceptance criteria:** `cangur` OMR and `m` cataloguer both run on the shared client with no behavior regression; switching provider/model is a one-line change; transient errors retry, permanent ones don't.
- **Risk/notes:** keep the no-persistence guarantee; Anthropic vs Gemini request/response shapes differ — the client must normalize both.
- **History:** 2026-06-05 created.

---

### `P05` — Mobile keyboard accessory for the symbol-heavy editors that lack one
- **Status:** DONE (2026-10-18) for `jscat` (`logocat` is not in the organisation) · **Priority:** P2
- **What was done:** one `kbd-accessory.js` in `step-quiz-commons` (layout `sota`/`fixa`, key list and editor API per site in `comuns.json`), used by `karelcat`, `karelcat-p`, `pycat` and, new, `jscat`. It also fixed pycat's bar being hidden behind the footer on mobile.
- **Source → Target:** `pycat/js/kbd-accessory.js` (grouped keys) + `karelcat/js/kbd-accessory.js` (iframe→parent bridge, Visual Viewport positioning) → **`jscat`** and **`logocat`** (neither has a mobile keyboard, both are symbol-heavy).
- **Affected files:** new shared `kbd-accessory.js`; include it in jscat + logocat editor pages.
- **Rationale:** `( ) { } ; => < > " '` (JS) and `( ) .` (Logo) are painful on mobile keyboards. Merge the two existing implementations into one parameterized module (pass the key set), keep karelcat's parent-document bridge for in-iframe editors and pycat's grouped layout.
- **Implementation:** unify into one module with a `keys` parameter and an `embedMode` (post to parent) branch; pick the **accessory-bar** approach over a full virtual keyboard. In `karelcat`, retire the redundant second implementation (`vkbd.js`) once the shared module covers its cases.
- **Acceptance criteria:** on a touch device, focusing the editor in jscat and logocat shows a working symbol bar (standalone and inside course iframes); native keyboard still usable.
- **Risk/notes:** karelcat used to ship **two** keyboards (`kbd-accessory.js` + `vkbd.js`); since 2026-10-17 only `kbd-accessory.js` is left (`vkbd.js` was dead code and was deleted).
- **History:** 2026-06-05 created.

---

### `P06` — Spread misconception-tagged distractors
- **Status:** IN PROGRESS (2026-10-18: `cb` and `operacions` fraccions done) · **Priority:** P2
- **What was done:** **`cb`**: every wrong option in `preguntes.json` has an `errors` entry (parallel to `pistes`) from a 13-type taxonomy in `cb/errors.json` (`LLEGIR`, `DADES`, `COMPTAR`, `OPERACIO`, `CALCUL`, `PASSOS`, `PROPORCIO`, `FORMULA`, `UNITATS`, `ESPAI`, `QUADRA`, `GAIREBE`, `PATRO`; `null` for the correct option and for generic hints); practice mode shows the type's name as a label above the hint; `cb/tests/docs_vs_codi.py` checks it. **`operacions` fraccions**: `js/fraccions/errors-fraccions.js` diagnoses written answers at every step (21 error types: `DEN_SUMA`, `AMPL_NOMES_DEN`, `RES_ORDRE`, `PROD_CREU`, …) and the game shows a targeted message and logs the type in the session history; tested in `tests/modules.test.js` (24 cases + 30,000 random wrong answers). Still open: the other legacy `operacions` exercises, and a teacher-side aggregate of error types (it would need the verification code to carry them).
- **Source → Target:** `operacions/js/derivades/distractor-lib.js` (+ `strings.js` taxonomy) → **`cb`** and the **older `operacions` exercises** (equacions, fraccions, … — now single-file ES modules).
- **Affected files:** the new exercises' pattern as template; `cb/preguntes.json` + `cb/core.js`; legacy `operacions/*.html`.
- **Rationale:** highest pedagogical ceiling in the ecosystem, currently siloed in ~4 exercises. Wrong answers tied to *named* misconceptions (`CHAIN_FORGOT`, `SIN_COS_SWAP`, …) with targeted feedback turn "wrong, try again" into "you forgot the chain rule."
- **Implementation:** for generative exercises, port the `{tex, feedback, errorType, scope}` distractor model + the strings taxonomy. For `cb` (static, image-based questions), a lighter adaptation: tag each existing per-option hint with an `errorType` so feedback is explained by misconception rather than position. Migrate legacy `operacions` exercises toward the new layered structure where feasible.
- **Acceptance criteria:** selecting a specific wrong option yields misconception-specific feedback in at least one migrated legacy exercise and in `cb` practice mode.
- **Risk/notes:** authoring cost is real (each exercise's error taxonomy must be designed). Do it incrementally, highest-traffic exercises first.
- **History:** 2026-06-05 created.

---

### `P07` — Put the SHA-256 gate on teacher-facing pages
- **Status:** PROPOSED · **Priority:** P2
- **Source → Target:** `m/auth.js` → **`cb/index.html`**, **`operacions/index.html`** (link generators) and the **analyzers** (`analitzador-*.html`).
- **Affected files:** new shared `auth.js`; include it at end-of-`<body>` on the gated pages.
- **Rationale:** link generators and analyzers are teacher-only but currently open. `m/auth.js` is a clean, documented drop-in (hash-only password, 30-day session, console rotation helper, session badge).
- **Implementation:** vendor the shared `auth.js`; set each project's `AUTH_HASH`; document the rotation step (`authHash('new').then(console.log)`).
- **Acceptance criteria:** the gated pages require the password and remember the session; student-facing pages (`test.html`, per-exercise pages) remain ungated.
- **Risk/notes:** state clearly it is a **deterrent, not security** (client-side hash) — same caveat `cangurcat` already documents.
- **History:** 2026-06-05 created. 2026-10-17: the source no longer exists — `auth.js` was removed from `m` (its gate is disabled); it would have to be recovered from `m`'s git history.

---

### `P08` — Shared `progress.js` for the course family
- **Status:** DONE (2026-10-18) for `pycat`, `jscat`, `ggcat` · **Priority:** P3
- **What was done:** one `progress.js` in `step-quiz-commons`, configured per site with its historical storage key (`pycat_progress`, `jscat_progress`, `geocat_progress`), so no saved progress is lost (tested). `karelcat`/`karelcat-p` keep their own `KProgress`, which also stores each world's code fingerprint.
- **Source → Target:** `karelcat/curs/progress.js` → **`pycat`**, **`jscat`**, **`ggcat`** (which inline progress in `capitols.js`).
- **Affected files:** new shared `progress.js`; each course's `capitols.js`.
- **Rationale:** identical concern (localStorage progress, "never downgrade a success"), four separate implementations. One module guarantees one schema and one invariant.
- **Implementation:** generalize karelcat's API (`saveExercici`, `exerciciSuperat`, `saveMon`, `monsRepte`, `clear`) with a per-project storage-key prefix (`karel_`, `pycat_`, `geocat_`…); migrate each course to call it.
- **Acceptance criteria:** all four courses use the shared module; existing saved progress is preserved (key-compatible migration).
- **History:** 2026-06-05 created.

---

### `P09` — Make the courses actually trilingual (two-axis i18n)
- **Status:** PROPOSED · **Priority:** P3
- **Source → Target:** `logocat` i18n architecture (separate `code language` vs `UI language`, full `ca/es/en`) + `karelcat/docs/i18n-spanish-guide.md` → **`pycat`**, **`jscat`**; complete **`karelcat`** `es`.
- **Affected files:** each course's `js/i18n.js` + a language selector in UI.
- **Rationale:** `pycat`/`jscat` ship **Catalan only** (their READMEs used to claim `ca/es/en`); `karelcat` is `ca/en` with a ready `es` block already written in its guide. logocat proves the clean pattern: code-vocabulary axis stays English/immutable; only the UI axis translates.
- **Implementation:** restructure `pycat`'s flat `P.UI` and `jscat`'s `i18n.js` into the two-axis shape; add `es`/`en` UI strings; paste karelcat's `es` block from its guide; add a UI-language selector. Keep `codeLang` immutable.
- **Acceptance criteria:** UI language switchable to `ca`/`es`/`en` in all three courses with no change to the code vocabulary; READMEs match reality.
- **Risk/notes:** translation volume is the cost; ship `es` first (highest local value), `en` second.
- **History:** 2026-06-05 created.

---

### `P10` — Generalize deterministic "fixed sessions" beyond operacions
- **Status:** PROPOSED · **Priority:** P3
- **Source → Target:** `operacions/js/fixed-sessions.js` (Mulberry32 seed + pre-load URL-param injection) → **`cb`**, **`cangurcat`**.
- **Affected files:** new shared `fixed-sessions.js`; load-order in target pages.
- **Rationale:** "every student gets the same questions" with **no backend** is broadly useful (controlled assessments). Currently only `operacions` has it.
- **Implementation:** extract the seeded-PRNG + `history.replaceState` param-injection pattern into a shared module; ensure it loads as the **first** script; for `cb`/`cangurcat`, seed the question/problem selection deterministically per `?fixed=` value.
- **Acceptance criteria:** `?fixed=A` produces an identical question set across browsers/students in at least `cb`; a visible "fixed session" badge shows.
- **Risk/notes:** load order is critical (must precede config/engine scripts) — document loudly.
- **History:** 2026-06-05 created.

---

### `P11` — Add session tracking + verification code to `pau`
- **Status:** PROPOSED · **Priority:** P3 (speculative)
- **Source → Target:** `cangurcat` session machinery + `codi.js` (post-`P01` shared module) → **`pau`**.
- **Affected files:** `pau/index.html`, new code-generation hook.
- **Rationale:** `pau` is structurally the same statement/hint/solution viewer as `cangurcat` (`S5`) but passive. Adding per-problem tracking + a submitted verification code turns the PDF repository into a tracked practice tool with the same privacy model (Google Form, no stored data).
- **Implementation:** track which PAU problems a student opened/worked; emit a `PA`-coded verification code via the shared `codi.js`; optionally a `pau` analyzer (or extend the unified one).
- **Acceptance criteria:** a student can complete a PAU practice run and produce a valid, analyzer-verifiable code.
- **Risk/notes:** speculative — confirm the workflow is wanted before building.
- **History:** 2026-06-05 created.

---

### `P12` — Derive `llibre`'s exercise links from `m`'s manifest
- **Status:** PROPOSED · **Priority:** P3 (speculative)
- **Source → Target:** `m/manifest.json` (canonical catalog) → **`llibre`**. *(2026-10-17: `llibre` is now a PDF viewer with no `data-classroom.csv`; this proposal needs rethinking.)*
- **Affected files:** `llibre` data pipeline; `m/manifest.json` schema (maybe add topic tags).
- **Rationale:** `S7` — both are views over overlapping material data, but `llibre` maintains Step-Quiz links by hand in a CSV while `m` already holds the canonical catalog. Deriving from `m` removes duplication and drift.
- **Implementation:** tag `manifest.json` entries by topic; generate (or fetch) `llibre`'s per-topic exercise links from it instead of the hand-maintained CSV column.
- **Acceptance criteria:** `llibre`'s Step-Quiz links come from `m`'s manifest; editing the manifest updates the textbook.
- **Risk/notes:** speculative; cross-origin/fetch + deploy coupling between two repos needs design.
- **History:** 2026-06-05 created.

---

### `P13` — Extract the shared OMR grading shell (comp4eso ⇄ cangur)
- **Status:** PROPOSED · **Priority:** P2
- **Source → Target:** the `S10` shell duplicated across **`comp4eso`** and **`cangur`** → one shared OMR chassis (feeds `M1`).
- **Affected files:** `comp4eso/js/*` and `cangur/js/*` (`state`, `render`, `grid`, `keyboard`, `main-keyboard`, `navigation`, `student-modal`, `pdf-viewer`, `ai-recognizer`, `scoring`, `export`); shared `styles/` (`tokens`, `animations`, `layout`, `components`).
- **Rationale:** `cangur` is a wholesale fork of `comp4eso`; the OMR shell, the AI recognizer, and the stylesheets are near-identical copies that will drift (the recognizer already carries an "adapted from comp4eso" note). One shared chassis with thin per-app config removes the duplication.
- **Implementation:** factor the shell into shared modules parameterized by a small per-app descriptor: `{ questionCount, optionLetters, scoring(answers,key), keyLoader, outputs }`. Keep `comp4eso`'s competency/àmbits scoring + DOCX output and `cangur`'s competition scoring + XLSX output as per-app plug-ins on top of the shared shell. Reconcile the two `ai-recognizer.js` copies into the shared `ai-client.js` from `P04` **first**.
- **Acceptance criteria:** both apps run on one shared shell + per-app config; a fix to grid/keyboard/recognizer lands once and benefits both; no behavior regression in either.
- **Risk/notes:** do `P04` first; verify Cangur's deliberate "don't OCR the student code/name" choice survives; license-check before merging styles (both are teacher tools — confirm compatibility).
- **History:** 2026-06-05 created.

---

### `P14` — Bring comp4eso's per-student DOCX reports to cangur
- **Status:** PROPOSED · **Priority:** P3
- **Source → Target:** `comp4eso/js/reports.js` (raw-OOXML + JSZip DOCX generator) → **`cangur`** (currently XLSX-only).
- **Affected files:** new shared report module (or `cangur/js/reports.js`); `cangur` export UI.
- **Rationale:** `comp4eso` produces a polished per-student DOCX (per-skill breakdown, grade bands) entirely client-side; `cangur` only exports XLSX. Teachers grading Cangur would benefit from the same printable per-student report.
- **Implementation:** generalize `reports.js` so the per-skill section is driven by a descriptor (Cangur has blocks/levels rather than competency àmbits); reuse the OOXML+JSZip machinery; share `getGrade`-style banding if Cangur defines bands.
- **Acceptance criteria:** `cangur` can download a per-student DOCX report; `comp4eso`'s existing reports are unchanged.
- **Risk/notes:** Cangur's scoring differs from CB àmbits — design the descriptor to cover both. Best done after `P13`.
- **History:** 2026-06-05 created.

---

## Changelog

| Date | Proposal(s) | Change | By |
|------|-------------|--------|----|
| 2026-06-05 | — | Initial document created from the Jan–Jun 2026 export of 12 projects. All proposals `PROPOSED`. | AI (initial authoring) |
| 2026-10-27 | — | `operacions`: «Resolució pas a pas» wave 3 — `fraccions` (addition/subtraction and product/division, lines animated as the student solves; pure `js/fraccions/renderer.js`, `tests/fraccions.test.js`). | AI (pissarra, wave 3) |
| 2026-10-27 | — | `operacions`: «Resolució pas a pas» wave 2 — `equacions` (history animated line by line); its generators and steps moved to a pure `math-engine.js` + `renderer.js` with a characterisation fingerprint; fixed the old no-level generator that sometimes produced «ax + b = ax + b». | AI (pissarra, wave 2) |
| 2026-10-27 | — | `operacions`: «Resolució pas a pas» — David's feedback: with the index button on, the page turns lilac and all options disappear (link = `activity?pissarra=1`); all intermediate steps stay written (new `linies()` helper, `pas.copia`, still rows for unchanged lines; demo rewritten). | AI (pissarra) |
| 2026-10-27 | — | `operacions`: «Resolució pas a pas» wave 1 — pilot `prioritat` (`?pissarra=1`): its usual table inside a frameless board (HTML row with keyed cells); each new line animates (the operation flies down and merges into the result). Engine: HTML rows, free mode `mostraPas`/`animaPas`, `marc: false`. | AI (pissarra, wave 1) |
| 2026-10-27 | — | `operacions`: animated step-by-step board «Resolució pas a pas» (`js/pissarra/`, `?pissarra=1`) ported from `pau`'s procedures engine; demo page; index button «Activar la resolució pas a pas» (off by default; filters the menus to activities with `pissarra: true`). No activity enabled yet (pilot `prioritat` next). | AI (pissarra, wave 0) |
| 2026-10-18 | — | `operacions`: new fading-worked-examples mode `?esvaiment=1` (`js/esvaiment.js`), pilot `prioritat`; link generator row «Esvaïment»; no verification code in that mode. | AI (Project 12) |
| 2026-10-18 | M1 · P03 · P05 · P08 | `step-quiz-commons` created (shared course files, synced daily); P03, P05 and P08 done. | AI (M1) |
| 2026-10-18 | P06 | In progress: `cb` options tagged with error types (shown in practice mode); `operacions` fraccions diagnoses wrong answers by error type. | AI (P06) |
| 2026-10-18 | P01 | Done: the checksum letter of `operacions`, `cb` and `cangurcat` codes now covers the results (and every other field); old codes still validate (☑️). | AI (P01) |
| 2026-10-17 | P07 · P09 · P12 · S7 | Reviewed against the live repositories: corrected `cangur`, `comp4eso`, `cangurcat`, `cb`, `operacions`, `karelcat`, `pycat`, `jscat`, `m`, `pau`; rewrote `llibre` (now a PDF viewer); flagged `logocat` as not in the organisation; listed the uncatalogued repositories; updated licensing. No proposal status changed. | AI (docs review) |
| 2026-06-05 | comp4eso · S10 · P04 · M1 · P13 · P14 | Added 13th project `comp4eso` (CompBàsiques 4t ESO) — ancestor of the `cangur` OMR lineage and the refactor of `operacions/informe-cb.html`. Added shared structure `S10` (OMR grading shell). Updated `P04` source to `comp4eso` (origin of the AI recognizer) and strengthened `M1` evidence + candidate modules. Created `P13` (extract the shared OMR shell) and `P14` (DOCX reports → cangur). Cross-linked the `cangur` / `cb` / `operacions` entries. | AI (comp4eso integration) |

<!--
APPEND-ONLY NOTES FOR FUTURE AI EDITORS
- Add a Changelog row for every shipped change.
- When a proposal reaches DONE, also update the affected Part 1 entries and (if a shared module was created) the relevant Part 2 `S#`.
- Never delete or renumber `P##`, `S#`, or project slugs.
-->
