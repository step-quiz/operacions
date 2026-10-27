# «Resolució pas a pas» (pissarra animada): living state

Agent-facing memory between sessions. English. Update it in the same commit as any change to the feature.
How the engine works: [`MOTOR.md`](MOTOR.md). Where they disagree, this file wins (it records later decisions).

## Status (2026-10-27)

| Wave | Part | Status |
|---|---|---|
| 0 | Engine ported (`js/pissarra/`, `css/pissarra.css`), demo page `pissarra-demo.html`, tests (`tests/pissarra.test.js`, `tests/navegador/prova-pissarra.js`, `check-repo.js` §9), index button | DONE |
| 1 | Pilot `prioritat` (1r–2n ESO), with the fading mode that is already there | PENDING (next) |
| 2 | `equacions` (1r grau), together with its planned fading mode (`docs/esvaiment/STATE.md`) | PENDING |
| 3 | `fraccions`: addition/subtraction first (with its planned fading mode), then product/division | PENDING |
| 4 | `potencies` and `enters` (reuse the pilot) | PENDING |
| 5 | `sistemes-equacions` and `radicals` (3r–4t ESO) | PENDING |
| 6 | Batxillerat: `esglaonar-matriu` → `ruffini` → `complexos` (port `pau`'s `matrius.js` as needed) | PENDING |
| 7 | Optional: `mcd-mcm`, `inversa-matriu`, `derivades`/`integrals` («Mira com es fa») | PENDING |

After wave 1, David tests it with a 1r ESO group before the next waves.

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

## Known limits

- Figure rows (SVG) only cross-fade (as in `pau`).
- A keyed phrase in a text row that wraps over two lines cross-fades in place (no ghost).
