# Guia de contribució — Step Quiz Operacions

## Arquitectura del projecte

```
operacions/
├── index.html                  ← Pàgina principal (generador d'enllaços)
├── css/
│   ├── shared.css              ← Estils globals (teclat, panells, animacions)
│   ├── derivades.css           ← Estils específics de derivades
│   └── ...
├── js/
│   ├── fixed-sessions.js       ← Sessions fixes ?fixed=A/B/C (sempre el PRIMER script)
│   ├── utils.js                ← Funcions pures: randInt, pick, shuffle, parseStrictInt
│   ├── config.js               ← Lectura de paràmetres URL (sessions, intents, etc.)
│   ├── exercise-codes.js       ← Taula única de codis d'exercici (joc + analitzador)
│   ├── game-core.js            ← Motor de joc compartit (puntuació, pantalles, codi v2)
│   ├── derivades/              ← Mòdul de derivades (patró recomanat, mòduls ES)
│   │   ├── math-engine.js      ← Capa matemàtica pura (sense DOM)
│   │   ├── strings.js          ← Tots els textos i feedback
│   │   ├── distractor-lib.js   ← Generador de distractors pedagògics
│   │   ├── question-bank.js    ← Registre de famílies de preguntes
│   │   └── derivades.js        ← Controlador DOM (l'únic que carrega l'HTML; importa la resta)
│   ├── integrals/              ← Mateixa estructura que derivades/
│   ├── recta-numerica/         ← Mateixa estructura
│   ├── asimptotes/             ← Mateixa estructura (amb noms *-asimptotes.js)
│   └── ...
├── equacions.html              ← Joc inline (tot el JS dins <script>)
├── fraccions.html              ← Joc inline
└── ...
```

## Ordre de càrrega dels scripts

Hi ha dues capes:

**1. La base compartida** (`js/*.js`): scripts clàssics que comparteixen variables globals. L'ordre és **crític**:

```
0. fixed-sessions.js (opcional, però si hi és ha d'anar PRIMER)
1. utils.js           (funcions pures, sense dependències)
2. config.js          (depèn de utils.js per getIntParam)
2b. exercise-codes.js (taula EXERCISE_CODES, sense dependències)
3. game-core.js       (depèn de config.js i exercise-codes.js)
```

**2. L'activitat** (`js/<activitat>/`): mòduls ES. La pàgina només carrega el controlador, i cada fitxer importa el que necessita:

```html
<script type="module" src="js/derivades/derivades.js"></script>
```

```
derivades.js ── import ──▶ question-bank.js ── import ──▶ distractor-lib.js ──▶ math-engine.js
                                                                            └─▶ strings.js
```

Aquí l'ordre ja no s'ha de vigilar: el navegador segueix els `import`. Un mòdul s'executa **després** que s'hagi llegit tot l'HTML i s'hagin executat els scripts clàssics, de manera que sempre troba `randInt`, `startGame`, etc.

Els jocs inline (`equacions.html`, `fraccions.html`…) i `js/decimals/` continuen sent scripts clàssics.

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
- **ESLint** busca errors al JavaScript de `js/` i `tests/`. Si un fitxer de la base compartida (`js/*.js`) defineix una variable global nova que fan servir els altres, s'ha d'afegir a la llista `PROJECT_GLOBALS` de `tools/lint/eslint.config.mjs`. Dins d'una activitat no s'hi afegeix res: s'importa.
- Com executar-los i com funcionen a GitHub: [`tools/lint/README.md`](tools/lint/README.md).

### Mòduls ES (`import` / `export`)

Cada fitxer d'una activitat exporta un sol objecte:

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

1. **Funcions cridades des de fora del mòdul** (des de `game-core.js`, com `buildLevel` i `checkCurrentCell`, o des d'un `onclick="…"` de l'HTML): s'han d'exposar explícitament, just després dels `import`:
   ```js
   Object.assign(window, { buildLevel, selectStatInterval });
   ```
2. **Crides internes a `buildLevel`**: escriviu `window.buildLevel()`, no `buildLevel()`. Les sessions fixes (`?fixed=A`) substitueixen `window.buildLevel` per una versió que sembra l'atzar de cada pregunta; una crida directa se la saltaria i la pregunta ja no seria la mateixa per a tothom.
3. **Codi d'inici** (`startGame()`, `initGame()`…): va al final del mòdul, no en un `<script>` inline de l'HTML (el mòdul encara no s'hauria executat).

`tests/check-repo.js` comprova les tres coses i que cada `import` apunti a un fitxer que exporta aquell nom.

**Per provar-ho localment** cal un servidor (`python3 -m http.server 8000` i obrir http://localhost:8000): obrint l'HTML amb doble clic (`file://`) el navegador bloqueja els mòduls.

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

### Opció A: Exercici modular (recomanat)

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
   <script src="js/fixed-sessions.js"></script>
   <script src="js/utils.js"></script>
   <script src="js/config.js"></script>
   <script src="js/exercise-codes.js"></script>
   <script src="js/game-core.js"></script>
   <!-- Només el controlador: ell importa math-engine, strings, question-bank… -->
   <script type="module" src="js/nou-exercici/nou-exercici.js"></script>
   ```
   Al controlador, recordeu `Object.assign(window, { buildLevel })` (vegeu [Mòduls ES](#mòduls-es-import--export)).

3. Registrar el codi d'exercici a `EXERCISE_CODES` dins `js/exercise-codes.js` (2 lletres que no estiguin fetes servir; `CB` està reservat). L'analitzador el reconeixerà automàticament:
   ```js
   'nou-exercici': 'NE',
   ```

4. Afegir l'enllaç a `index.html`.

5. **Sessions fixes** (`fixed: true` a `index.html`): `js/fixed-sessions.js` s'ha de carregar abans que cap altre script de `js/`.
   - Si el joc fa servir `game-core.js` i genera cada pregunta dins `buildLevel()`, no cal fer res més: el motor torna a sembrar l'atzar a cada pregunta amb (sessió, número de pregunta).
   - Si la pàgina té un flux propi, cal cridar `window.FixedSessions?.seed('etiqueta')` just abans de generar cada exercici (amb una etiqueta que depengui del número d'exercici, p. ex. `` `q${currentOperation}` ``), o bé `window.FixedSessions?.next('tipus')` si no hi ha comptador. **No** ho poseu dins d'una funció que es crida a si mateixa per descartar un exercici (entraria en bucle).
   - `tests/check-repo.js` comprova aquestes dues coses.

### Opció B: Exercici inline (per a jocs simples)

Tot el JS va dins `<script>` al final del HTML. Segueix igualment l'ordre utils → config → exercise-codes → game-core.

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
- Vanilla JavaScript (ES2020): mòduls ES nadius, sense cap pas de compilació ni empaquetador
- KaTeX per a renderització LaTeX, servit des de `vendor/katex-0.16.11/` (vegeu `vendor/README.md`)
- Cap backend: tot és estàtic i s'executa al navegador

## Tests

Tots els tests s'executen amb una sola ordre (només cal tenir Node instal·lat; no s'instal·la res més):

```
node tests/run-all.js
```

| Fitxer | Què comprova |
|--------|--------------|
| `tests/check-repo.js` | Sintaxi de tots els JS i dels `<script>` inline · enllaços locals trencats · coherència de `js/exercise-codes.js` amb les pàgines · que no tornin errors ja corregits (barrejat esbiaixat, PDF.js sense `isEvalSupported: false`, zoom bloquejat) · sessions fixes · colors comuns · mòduls ES (cada `import` existeix, cada `onclick` troba la seva funció, `window.buildLevel()`) |
| `tests/modules.test.js` | Genera milers de preguntes de cada mòdul: una sola opció correcta, cap opció repetida, cap `undefined`/`NaN`, la correcta repartida per igual entre posicions, i solucions recalculades de manera independent (mitjana, mediana, moda…) |
| `tests/esm.test.js` | Importa de debò (amb `import`, com el navegador) cada mòdul ES i comprova que exporta el que ha d'exportar |
| `tests/fixed-sessions.test.js` | Sessions fixes: la mateixa pregunta és igual per a tothom encara que l'alumne hagi fet coses diferents abans |
| `js/derivades/run-tests.js` | Tests detallats del mòdul de derivades |

**GitHub ho fa sol:** el fitxer `.github/workflows/tests.yml` executa `node tests/run-all.js` cada cop que es puja alguna cosa a `main` i a cada pull request. El resultat surt com una ✓ verda o una ✗ vermella al costat del commit (pestanya **Actions** per veure'n el detall).

Quan s'afegeix un mòdul nou de preguntes, cal afegir-lo a `tests/modules.test.js`.
