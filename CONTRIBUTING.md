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
│   ├── derivades/              ← Mòdul de derivades (patró recomanat)
│   │   ├── math-engine.js      ← Capa matemàtica pura (sense DOM)
│   │   ├── strings.js          ← Tots els textos i feedback
│   │   ├── distractor-lib.js   ← Generador de distractors pedagògics
│   │   ├── question-bank.js    ← Registre de famílies de preguntes
│   │   └── derivades.js        ← Controlador DOM (únic fitxer que toca el DOM)
│   ├── integrals/              ← Mateixa estructura que derivades/
│   ├── recta-numerica/         ← Mateixa estructura
│   ├── asimptotes/             ← Mateixa estructura (amb noms *-asimptotes.js)
│   └── ...
├── equacions.html              ← Joc inline (tot el JS dins <script>)
├── fraccions.html              ← Joc inline
└── ...
```

## Ordre de càrrega dels scripts

L'ordre és **crític** i no es pot alterar:

```
0. fixed-sessions.js (opcional, però si hi és ha d'anar PRIMER)
1. utils.js           (funcions pures, sense dependències)
2. config.js          (depèn de utils.js per getIntParam)
2b. exercise-codes.js (taula EXERCISE_CODES, sense dependències)
3. game-core.js       (depèn de config.js i exercise-codes.js)
4. math-engine.js     (depèn de utils.js per randIntNonZero, pick, shuffle)
5. strings.js         (sense dependències JS, només textos)
6. distractor-lib.js  (depèn de math-engine.js i strings.js)
7. question-bank.js   (depèn de math-engine.js i distractor-lib.js)
8. controlador.js     (depèn de tot l'anterior + game-core.js)
```

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

### Mòduls (patró IIFE)

Cada mòdul exposa un sol objecte al `window`:

```js
window.MathEngine = (() => {
    // tot el codi privat
    function gcd(a, b) { ... }
    
    // API pública
    return { gcd, formatK, ... };
})();
```

**Important:** Els namespaces `MathEngine`, `QuestionBank`, `DistractorLib` i `Strings` es reutilitzen entre mòduls (derivades, integrals, recta numèrica). Cada pàgina HTML carrega **només un conjunt**. No barregeu mai scripts de mòduls diferents en una mateixa pàgina.

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
   <script src="js/nou-exercici/math-engine.js"></script>
   <!-- ... resta de scripts del mòdul ... -->
   ```

3. Registrar el codi d'exercici a `EXERCISE_CODES` dins `js/exercise-codes.js` (2 lletres que no estiguin fetes servir; `CB` està reservat). L'analitzador el reconeixerà automàticament:
   ```js
   'nou-exercici': 'NE',
   ```

4. Afegir l'enllaç a `index.html`.

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
- Vanilla JavaScript (ES6)
- KaTeX per a renderització LaTeX, servit des de `vendor/katex-0.16.11/` (vegeu `vendor/README.md`)
- Cap backend: tot és estàtic i s'executa al navegador

## Tests

```
node js/derivades/run-tests.js
```
