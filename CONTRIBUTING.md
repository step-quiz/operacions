# Guia de contribució — Step Quiz Operacions

> **Com fer i publicar canvis** (Codespace, missatges de commit, `tools/desa.sh`, desfer un canvi): [`COM-TREBALLAR.md`](COM-TREBALLAR.md). Aquesta guia explica com està fet el codi.

## Arquitectura del projecte

```
operacions/
├── index.html                  ← Pàgina principal (generador d'enllaços)
├── css/
│   ├── shared.css              ← Estils globals (teclat, panells, animacions)
│   ├── derivades.css           ← Estils específics de derivades
│   └── ...
├── js/                         ← TOT el JavaScript, com a mòduls ES (cap JS dins dels HTML)
│   ├── fixed-sessions.js       ← Sessions fixes ?fixed=A/B/C (s'executa abans que res)
│   ├── utils.js                ← Funcions pures: randInt, pick, shuffle, gcd, parseStrictInt
│   ├── config.js               ← Lectura de paràmetres URL (sessions, intents, etc.)
│   ├── exercise-codes.js       ← Taula única de codis d'exercici (joc + analitzador)
│   ├── game-core.js            ← Motor de joc compartit (estat, puntuació, pantalles, codi v2)
│   ├── derivades/              ← Mòdul de derivades (patró recomanat, mòduls ES)
│   │   ├── math-engine.js      ← Capa matemàtica pura (sense DOM)
│   │   ├── strings.js          ← Tots els textos i feedback
│   │   ├── distractor-lib.js   ← Generador de distractors pedagògics
│   │   ├── question-bank.js    ← Registre de famílies de preguntes
│   │   └── derivades.js        ← Controlador DOM (l'únic que carrega l'HTML; importa la resta)
│   ├── integrals/              ← Mateixa estructura que derivades/
│   ├── recta-numerica/         ← Mateixa estructura
│   ├── asimptotes/             ← Mateixa estructura (amb noms *-asimptotes.js)
│   ├── equacions/equacions.js  ← Jocs més antics: tot el joc en un sol fitxer
│   ├── analitzador-stepquiz/   ← L'analitzador de codis del professorat
│   └── ...
├── equacions.html              ← Només HTML i CSS; carrega js/equacions/equacions.js
├── tools/                      ← Eines per a qui programa (servidor de prova, desa.sh, lint)
└── ...
```

## Ordre de càrrega dels scripts

Tot el JavaScript de `js/` són **mòduls ES**. Cada pàgina carrega un sol fitxer, el del seu joc, i aquest importa el que necessita:

```html
<script>
    window.APP_CONFIG = { defaultSessions: 1, defaultOperations: 5, defaultIntents: 4, defaultEnllocMitjana: 1 };
</script>
…
<script type="module" src="js/derivades/derivades.js"></script>
```

```
derivades.js ─┬─▶ config.js ──▶ fixed-sessions.js   (sempre el primer que s'executa)
              │              └─▶ utils.js
              ├─▶ game-core.js ──▶ config.js, exercise-codes.js, fixed-sessions.js
              └─▶ question-bank.js ──▶ distractor-lib.js ──▶ math-engine.js ──▶ utils.js
                                                          └─▶ strings.js
```

L'ordre ja no s'ha de vigilar a mà: el navegador executa cada fitxer **després** dels que importa. L'únic que ha d'anar primer de tot és `fixed-sessions.js` (canvia la URL i `Math.random`): `config.js` l'importa en primer lloc, i les pàgines sense `game-core.js` l'importen elles mateixes com a primer `import`. `tests/check-repo.js` ho comprova.

`window.APP_CONFIG` és l'únic `<script>` que queda dins l'HTML: són dades, i s'ha de llegir abans que els mòduls (que s'executen en acabar de llegir la pàgina).

Les llibreries de `vendor/` (KaTeX, xlsx…) es continuen carregant amb `<script src="vendor/…">` normal i són globals (`katex`).

## Convencions de codi

### Idioma

- **Variables, funcions i comentaris:** en català (amb excepcions per termes tècnics anglesos estandarditzats com `shuffle`, `callback`, `overlay`).
- **Capçaleres de fitxer:** sempre en català.
- **Interfície d'usuari (textos visibles per l'alumne):** sempre en català.

### Nomenclatura

- **Funcions:** camelCase → `generateEquation()`, `buildLevel()`, `formatPowerTerm()`
- **Constants globals:** UPPER_SNAKE_CASE → `TOTAL_SESSIONS`, `MAX_INTENTS`
- **Variables d'estat:** camelCase → `currentSession`, `attemptsLeft`
- **IDs HTML:** kebab-case → `game-screen`, `btn-next-session`
- **Classes CSS:** kebab-case → `btn-submit`, `panel-content`

### Format i revisió automàtica

- El format del codi de `js/`, `css/` i `tests/` el decideix **Prettier** (`.prettierrc.json`: 4 espais, cometes simples, línies de fins a 120 caràcters). No cal alinear res a mà.
- **ESLint** busca errors al JavaScript de `js/` i `tests/`. Com que no hi ha variables globals compartides, un nom que no està declarat ni importat és un error (normalment, falta un `import`).
- Com executar-los i com funcionen a GitHub: [`tools/lint/README.md`](tools/lint/README.md).

### Mòduls ES (`import` / `export`)

La base compartida exporta funcions i constants, i qui les necessita les importa:

```js
import { MAX_INTENTS, TOTAL_OPERATIONS } from '../config.js';
import { randInt, shuffle } from '../utils.js';
import { state, startGame, recordResult, showMiniOverlay } from '../game-core.js';
```

**L'estat de la partida és a `state`**: `state.attemptsLeft`, `state.sessionScore`, `state.currentOperation`, `state.isTransitioning`… (i no `attemptsLeft` a seques). Un mòdul pot llegir una variable que n'importa, però no la pot reassignar; en canvi, sí que pot canviar les propietats d'un objecte importat (`state.attemptsLeft--`).

Els fitxers de les activitats més noves exporten un sol objecte:

```js
// js/derivades/math-engine.js
export const MathEngine = (() => {
    // tot el codi privat
    function gcd(a, b) { ... }

    // API pública
    return { gcd, formatK, ... };
})();
```

i qui el necessita l'importa, amb camí relatiu i acabat en `.js` (el navegador no n'endevina l'extensió):

```js
// js/derivades/distractor-lib.js
import { MathEngine } from './math-engine.js';
import { Strings } from './strings.js';
```

Els noms d'un mòdul **no són globals**: `MathEngine` de derivades i `MathEngine` d'integrals ja no poden trepitjar-se. Tres regles a recordar al controlador:

1. **Funcions cridades des de fora del mòdul** (des de `game-core.js`, com `buildLevel` i `checkCurrentCell`, o des d'un atribut `onclick="…"`, `onchange="…"`, `onmouseenter="…"`… de l'HTML, també del que es genera amb JS): s'han d'exposar explícitament, just després dels `import`:
   ```js
   Object.assign(window, { buildLevel, selectStatInterval });
   ```
2. **Crides internes a `buildLevel`**: escriviu `window.buildLevel()`, no `buildLevel()`. Les sessions fixes (`?fixed=A`) substitueixen `window.buildLevel` per una versió que sembra l'atzar de cada pregunta; una crida directa se la saltaria i la pregunta ja no seria la mateixa per a tothom.
3. **Codi d'inici** (`startGame()`, `initGame()`…): va al final del mòdul, no en un `<script>` inline de l'HTML (el mòdul encara no s'hauria executat).

`tests/check-repo.js` comprova les tres coses i que cada `import` apunti a un fitxer que exporta aquell nom.

**Teclat numèric de `game-core.js`**: un input amb `data-locked="true"` (resposta ja encertada) no s'activa ni perd el `readonly`. Per saber quin input fa servir el teclat, `getKbActiveInput()`; per deixar d'usar-ne un sense amagar el teclat, `kbReleaseInput(inp)`. No redefiniu les funcions del teclat dins d'un joc: afegiu l'opció a `game-core.js`.

**Per provar-ho localment** cal un servidor: `node tools/servidor.js` i obrir http://localhost:8000 (al Codespace s'engega sol; vegeu [`COM-TREBALLAR.md`](COM-TREBALLAR.md)). Obrint l'HTML amb doble clic (`file://`) el navegador bloqueja els mòduls.

### Capçalera de fitxer estàndard

```js
/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/nom-modul/nom-fitxer.js
 * ROL: Descripció breu del rol del fitxer.
 * ARQUITECTURA: Explicació de com encaixa dins el projecte.
 * DEPENDÈNCIES: Llista de fitxers requerits i ordre de càrrega.
 * ============================================================================
 */
```

## Com afegir un nou exercici

1. Crear una carpeta `js/nou-exercici/` amb els fitxers:
   - `math-engine.js` — lògica matemàtica pura
   - `strings.js` — textos de feedback i pistes
   - `distractor-lib.js` — generador de distractors (si és test)
   - `question-bank.js` — famílies de preguntes
   - `nou-exercici.js` — controlador DOM

2. Crear `nou-exercici.html` a l'arrel amb:
   ```html
   <script>
       window.APP_CONFIG = {
           defaultSessions: 1,
           defaultOperations: 5,
           defaultIntents: 4,
           defaultEnllocMitjana: 1
       };
   </script>
   <!-- Només el controlador: ell importa la base (config, utils, game-core) i math-engine, strings… -->
   <script type="module" src="js/nou-exercici/nou-exercici.js"></script>
   ```
   Al controlador, recordeu `Object.assign(window, { buildLevel })` (vegeu [Mòduls ES](#mòduls-es-import--export)). Per a un joc senzill, n'hi ha prou amb un sol fitxer `js/nou-exercici/nou-exercici.js`.

3. Registrar el codi d'exercici a `EXERCISE_CODES` dins `js/exercise-codes.js` (2 lletres que no estiguin fetes servir; `CB` està reservat). L'analitzador el reconeixerà automàticament:
   ```js
   'nou-exercici': 'NE',
   ```

4. Afegir l'enllaç a `index.html`.

5. **Sessions fixes** (`fixed: true` a `index.html`):
   - Si el joc fa servir `game-core.js` i genera cada pregunta dins `buildLevel()` (cridada sempre com a `window.buildLevel()`), no cal fer res més: el motor torna a sembrar l'atzar a cada pregunta amb (sessió, número de pregunta).
   - Si la pàgina té un flux propi, el controlador ha d'importar `FixedSessions` com a **primer** `import` (`import { FixedSessions } from '../fixed-sessions.js';`) i cridar `FixedSessions?.seed('etiqueta')` just abans de generar cada exercici (amb una etiqueta que depengui del número d'exercici, p. ex. `` `q${num}` ``), o bé `FixedSessions?.next('tipus')` si no hi ha comptador. **No** ho poseu dins d'una funció que es crida a si mateixa per descartar un exercici (entraria en bucle).
   - `tests/check-repo.js` comprova aquestes coses.

## Format del codi de verificació v2

El codi que l'alumne copia per al professor té aquest format:

```
Lsss-DDMM-HHMM-EE-D-S-QQ-NNN-RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   (59-79 caràcters)
```

| Camp | Llarg | Descripció |
|------|-------|------------|
| L | 1 | Lletra de control (checksum mod 23) |
| sss | 3 | Salt aleatori (3 lletres minúscules) |
| DDMM | 4 | Data (dia i mes) |
| HHMM | 4 | Hora i minuts |
| EE | 2 | Codi d'exercici (taula EXERCISE_CODES de `js/exercise-codes.js`) |
| D | 1 | Dificultat (0=sense nivells, 1-3) |
| S | 1 | Sessions completades (1-5) |
| QQ | 2 | Preguntes per sessió (01-10) |
| NNN | 3 | Nota ×10 arrodonida (000-100) |
| RRR…R | 30-50 | Resultats per pregunta, sessió rere sessió (S × QQ posicions, mínim 30): 1=1r intent, 2=2n, 3=3r+, 4=fallada, 0=buit |

**Checksum:** `suma = NNN + DD + MM + HH + mm + ASCII(salt[0])`, lletra = `"TRWAGMYFPDXBNJZSQVHLCKE"[suma % 23]`

## Paràmetres URL disponibles

| Paràmetre | Valors | Per defecte | Descripció |
|-----------|--------|-------------|------------|
| `totalsessions` | 1-5 | Definit per APP_CONFIG | Nombre de sessions |
| `totaloperations` | 1-10 | Definit per APP_CONFIG | Operacions per sessió |
| `maxintents` | 1-10 | Definit per APP_CONFIG | Intents per operació |
| `maxenllocmitjana` | 0-1 | Definit per APP_CONFIG | 0=mitjana, 1=màxim |
| `nivell` | 1-3 | 0 (sense nivell) | Dificultat del joc |
| `fixed` | A, B, C | — | Sessió fixa: mateixos exercicis per a tothom (vegeu `js/fixed-sessions.js`) |
| `families` | ids separats per comes | totes | Famílies actives (derivades/integrals) |
| `debug` | 1 | desactivat | Mode de depuració (només `inversa-matriu` i `vocabulari`) |

Els màxims de sessions (5) i preguntes (10) són els que pot representar el codi v2 (camps S i QQ).

## Tecnologies

- HTML5 / CSS3 purs (sense frameworks)
- Vanilla JavaScript (ES2020): mòduls ES nadius, sense cap pas de compilació ni empaquetador ni cap variable global compartida
- KaTeX per a renderització LaTeX, servit des de `vendor/katex-0.16.11/` (vegeu `vendor/README.md`)
- Cap backend: tot és estàtic i s'executa al navegador

## Tests

Tots els tests s'executen amb una sola ordre (només cal tenir Node instal·lat; no s'instal·la res més):

```
node tests/run-all.js
```

| Fitxer | Què comprova |
|--------|--------------|
| `tests/check-repo.js` | Sintaxi de tots els JS i dels `<script>` inline · enllaços locals trencats · coherència de `js/exercise-codes.js` amb les pàgines · que no tornin errors ja corregits (barrejat esbiaixat, PDF.js sense `isEvalSupported: false`, zoom bloquejat) · sessions fixes (`fixed-sessions.js` s'executa primer) · colors comuns · mòduls ES (cada `import` existeix, cada `on…="…"` troba la seva funció, `window.buildLevel`, cap `js/` com a script clàssic, cap JS dins l'HTML de les pàgines amb joc) |
| `tests/modules.test.js` | Genera milers de preguntes de cada mòdul: una sola opció correcta, cap opció repetida, cap `undefined`/`NaN`, la correcta repartida per igual entre posicions, i solucions recalculades de manera independent (mitjana, mediana, moda…) |
| `tests/esm.test.js` | Importa de debò (amb `import`, com el navegador) la base i cada mòdul de lògica, i comprova que exporten el que han d'exportar |
| `tests/fixed-sessions.test.js` | Sessions fixes: la mateixa pregunta és igual per a tothom encara que l'alumne hagi fet coses diferents abans |
| `js/derivades/run-tests.js` | Tests detallats del mòdul de derivades |

**GitHub ho fa sol:** el fitxer `.github/workflows/tests.yml` executa `node tests/run-all.js` cada cop que es puja alguna cosa a `main` i a cada pull request. El resultat surt com una ✓ verda o una ✗ vermella al costat del commit (pestanya **Actions** per veure'n el detall).

Quan s'afegeix un mòdul nou de preguntes, cal afegir-lo a `tests/modules.test.js`.
