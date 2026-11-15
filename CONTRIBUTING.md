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
│   ├── esvaiment.js            ← Mode «Esvaïment» ?esvaiment=1 (motor de nivells, sense DOM)
│   ├── punts.js                ← La regla única dels punts (10 per pregunta, 2 menys per error; pur)
│   ├── seguent.js              ← La franja del final de pregunta amb el botó «Següent» (DOM)
│   ├── codi-finestra.js        ← La icona «Codi», la seva finestra i generaCodi() (DOM)
│   ├── teclat.js               ← El teclat numèric propi dels aparells tàctils (DOM)
│   ├── game-core.js            ← Motor de joc compartit (estat, puntuació, pantalles, codi v2)
│   ├── pissarra/               ← «Resolució pas a pas»: el motor de la pissarra animada
│   │   ├── formules.js         ← Claus dels símbols i guió dels passos (pur)
│   │   ├── comprova.js         ← Revisió dels guions i text pla de cada fila (pur, per als tests)
│   │   ├── pissarra.js         ← La pissarra: dibuixa els passos i anima el canvi (DOM)
│   │   ├── reproductor.js      ← Botons, punts i text de cada pas (DOM)
│   │   ├── mode.js             ← SUPORTA_PISSARRA (les activitats amb resolució pas a pas)
│   │   └── demo.js             ← Guions de mostra (pissarra-demo.html)
│   ├── derivades/              ← Mòdul de derivades (patró recomanat, mòduls ES)
│   │   ├── math-engine.js      ← Capa matemàtica pura (sense DOM)
│   │   ├── strings.js          ← Tots els textos i feedback
│   │   ├── distractor-lib.js   ← Generador de distractors pedagògics
│   │   ├── question-bank.js    ← Registre de famílies de preguntes
│   │   └── derivades.js        ← Controlador DOM (l'únic que carrega l'HTML; importa la resta)
│   ├── integrals/              ← Mateixa estructura que derivades/
│   ├── recta-numerica/         ← Mateixa estructura
│   ├── asimptotes/             ← Mateixa estructura (amb noms *-asimptotes.js)
│   ├── fraccions/fraccions.js  ← Jocs més antics: tot el joc en un sol fitxer (fraccions/resolucio.js: la resolució pas a pas, pura)
│   ├── equacions/              ← equacions.js (el joc), math-engine.js (equacions i passos, pur), renderer.js (HTML)
│   ├── analitzador-stepquiz/   ← L'analitzador de codis del professorat (llegeix-codi.js: llegeix els codis)
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
import { state, startGame, recordResult, acabaPregunta, puntsDeLaPregunta } from '../game-core.js';
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

**Teclat numèric (`js/teclat.js`)**: un sol teclat per a totes les activitats. game-core.js el posa (`injectSharedHTML`) i en reexporta les funcions; les pàgines sense el motor comú l'importen d'aquí i el posen amb `injectaTeclat(lloc)`. `initCustomKeyboard({ allowNegative, allowZero, decimalComma, respectMaxLength, onEnter })` el fa funcionar; la tecla «→» crida `onEnter` o, si no n'hi ha, `window.checkCurrentCell()` o un Enter de debò a la casella (perquè la pàgina faci el que fa amb el teclat físic). En un aparell tàctil, qualsevol casella de text o de número que l'alumne toqui passa a rebre el teclat (un sol listener per a tota la pàgina); una casella que no l'ha de fer servir es marca amb `data-kb="off"`, i una amb `data-sign-id="id"` té el signe en un element a part que la tecla «−» canvia (Complexos). Un input amb `data-locked="true"` (resposta ja encertada) no s'activa ni perd el `readonly`. Per saber quin input fa servir el teclat, `getKbActiveInput()`; per deixar d'usar-ne un sense amagar el teclat, `kbReleaseInput(inp)`; perquè la tecla següent en substitueixi el contingut, `kbMarkForOverwrite(inp)`. No feu còpies del teclat dins d'una activitat: afegiu l'opció a `js/teclat.js` (`tests/check-repo.js` ho comprova). L'HTML enllaça `css/teclat.css`.

**Per provar-ho localment** cal un servidor: `node tools/servidor.js` i obrir http://localhost:8000 (al Codespace s'engega sol; vegeu [`COM-TREBALLAR.md`](COM-TREBALLAR.md)). Obrint l'HTML amb doble clic (`file://`) el navegador bloqueja els mòduls.

### Final de cada pregunta i punts

Totes les activitats acaben cada pregunta de la mateixa manera, i cap no passa de pregunta sola:

```js
recordResult(encert ? Math.min(MAX_INTENTS - state.attemptsLeft + 1, 3) : 4); // el codi de la pregunta
acabaPregunta(encert ? puntsDeLaPregunta() : 0); // punts + franja + botó «Següent»
```

- **`puntsDeLaPregunta()`** (game-core.js) torna 10, 8, 6… fins a 0 segons els intents gastats: és `puntsAmbErrors(errors)` de `js/punts.js`. Una activitat només se'n pot apartar si ho declara al codi, passant un altre descompte: `puntsAmbErrors(totalErrors, 1)` (Estudi estadístic, que compta cada casella errònia i no cada intent).
- **`acabaPregunta(punts, opcions)`** suma els punts amb `sumaPunts()`, tanca el teclat i mostra la franja de `js/seguent.js` («Molt bé! +8 punts» o «Intents esgotats · 0 punts») amb el botó «Següent» («Veure resultats» a l'última pregunta de la sessió). Quan l'alumne el prem (o prem Enter), passa a la pregunta següent amb `window.buildLevel()` o acaba la sessió. Opcions: `encert` (si no, punts > 0), `alFinal` (en lloc d'`endSession`, p. ex. el resum pedagògic de derivades), `alSeguent` (en lloc de `buildLevel`, p. ex. Pla cartesià), `lloc` (on va la franja; per defecte, al final de `#game-screen`) i `titol` (p. ex. «Intents esgotats. Solució: 3/4»).
- **`sumaPunts(p)`** és l'única manera de sumar punts a `state.sessionScore`: rebutja el que no sigui un enter de 0 a 10 (el porta dins del marge i ho diu a la consola) i posa al dia el marcador. `tests/check-repo.js` falla si una activitat suma punts pel seu compte.
- La resolució o la solució s'han de quedar **a la vista** fins que l'alumne prem «Següent»: no les amagueu en acabar (`buildLevel()` ja les buida a la pregunta nova).
- Les activitats que no fan servir game-core.js (Vocabulari, Asímptotes, les de gràfiques de Batxillerat) criden directament `mostraSeguent({ punts, encert, ultima, lloc, onSeguent })` de `js/seguent.js`; `punts: null` per a les que no compten punts.
- L'HTML enllaça `css/seguent.css` (`tests/check-repo.js` ho comprova).

### Icona «Codi» i codi de verificació

- **`posaIconaCodi(estat)`** (`js/codi-finestra.js`) posa la icona «Codi», fixa a dalt a la dreta. `estat()` torna `{ codi }` quan l'activitat s'ha acabat, o bé `{ falten, unitat: ['figura', 'figures'] }` o `{ missatge }` abans: aleshores la finestra diu quantes en falten i no dona cap codi. game-core.js la posa sol a `injectSharedHTML()` (menys en sessions fixes i esvaïment); Vocabulari, Pla cartesià i Asímptotes la posen ells.
- **El codi es genera un sol cop**, en acabar, amb `generaCodi({ exCode, dif, sessions, questions, nota10, resultats })`, i es desa: game-core.js ho fa a `codiFinal()`, des d'`endSession()`. `copiarResultats()` (el botó «Copiar codi» de la pantalla final i de l'informe) i la icona obren la mateixa finestra, que mostra sempre aquest codi. `avisaCodiLlest()` pinta la icona del color de l'activitat perquè l'alumne la vegi.
- L'HTML enllaça `css/codi.css` (`tests/check-repo.js` ho comprova).

### Colors

- **Colors amb significat** (`css/tokens.css`): `--text-main`, `--text-soft`, `--text-muted`, les vores (`--border-light`, `--border-heavy`, `--border-strong`), els fons grisos (`--bg-soft`, `--bg-soft-alt`) i els d'estat, cadascun amb el to fosc per al text, el clar per al fons i el de la vora: `--success*` (encert), `--danger*` (error) i `--warning*` (avís o pista). Cap altre fitxer no escriu a mà un verd, un vermell o un ambre.
- **Colors de tema** (`css/temes.css`): `--primary`, `--primary-hover`, `--primary-dark`, `--primary-light`, `--bg-color` i un segon to, `--accent`, `--accent-dark`, `--accent-light`, per distingir dues coses (MCD i MCM, l'incògnita d'un triangle). Una activitat nova tria el tema del seu bloc a `<html class="tema-…">` (`nombres`, `algebra`, `geometria`, `estadistica`, `funcions`) i enllaça `css/temes.css` just després de `css/tokens.css`. No defineix cap variable de tema pel seu compte.
- **Tons intermedis:** `color-mix(in srgb, var(--primary) 20%, transparent)` per a ombres i fons translúcids, en lloc d'un `rgba()` escrit a mà.
- **Dibuix (canvas, atributs SVG):** no entenen `var(--x)`. Si el color ha de coincidir amb el text de la pàgina, es llegeix en dibuixar: `getComputedStyle(document.documentElement).getPropertyValue('--accent')` (vegeu `token()` a `triangle-rectangle.js`).

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

**Lletra de control:** `js/codi-verificacio.js` (la fan servir els generadors i l'analitzador; `step-quiz/cb` en té una còpia idèntica, al seu codi.js). Tots els generadors d'operacions (`game-core.js`, `vocabulari.js`, `pla-cartesia.js` i `asimptotes.js`) munten el codi amb `generaCodi()` de `js/codi-finestra.js`, que posa la sal i l'hora i crida `construeixCodiV2()` d'aquest fitxer. Des del 18/10/2026: `suma = NNN + DD + MM + HH + mm + ASCII(salt[0]) + Σ pes(i)·ASCII(cos[i])`, amb `cos = EE + D + S + QQ + RRR…` i `pes(i) = (i mod 22) + 1`; lletra = `"TRWAGMYFPDXBNJZSQVHLCKE"[suma % 23]`. Cobreix tots els camps: canviar una sola xifra dels resultats la fa deixar de quadrar. Els codis d'abans (sense la suma del cos) continuen sent vàlids, i l'analitzador els marca ☑️ (resultats sense verificar). Proves: `tests/codi-verificacio.test.js`.

### Format v3 (només Competències Bàsiques)

El que genera `step-quiz/cb` des de la nova generació de codis. Té els camps del v2 i quatre més, que diuen què s'havia triat a l'enllaç de la prova (13 segments en lloc de 9):

```
Lsss-DDMM-HHMM-CB-D-S-QQ-AA-F-SS-EEEE-NNN-RRR…R
```

| Camp | Llarg | Descripció |
|------|-------|------------|
| D | 1 | Curs: 0 = tots, 1 = 2n ESO, 2 = 4t ESO |
| S | 1 | Mode: 1 = examen, 2 = pràctica |
| QQ | 2 | Nombre de preguntes de la prova |
| AA | 2 | Convocatòria triada: els dos últims dígits de l'any (`25`), o `00` = tots els anys |
| F | 1 | Dificultats triades, com a suma de bits: baixa = 1, mitjana = 2, alta = 4 (`7` = totes) |
| SS | 2 | Sentits triats, com a suma de bits: numèric = 1, algebraic = 2, de mesura = 4, espacial = 8, estocàstic = 16 (`31` = tots) |
| EEEE | 4 | Empremta de la llista d'ids de les preguntes, en ordre (lletres de la A a la W) |

L'empremta és un FNV-1a de 32 bits del text `id,id,id…`, reduït a 4 lletres. Dues proves amb la mateixa empremta tenen exactament les mateixes preguntes en el mateix ordre; serveix per detectar preguntes triades a mà (paràmetre `q`) o un banc que ha canviat, encara que els filtres coincideixin. L'analitzador no la recalcula: només la compara.

**Lletra de control del v3:** la mateixa fórmula de `lletraNova`, amb `cos = CB + D + S + QQ + AA + F + SS + EEEE + RRR…`. Només s'accepta la lletra nova (no hi ha codis v3 anteriors al 18/10/2026). Les lletres de l'empremta són 23 de seguides perquè canviar-ne una de sola mai quedi amagat per la lletra. `llegeixCodiV3()` de `js/codi-verificacio.js` llegeix i valida un codi v3; els vectors (`tests/vectors-cb-v3.js`) són els mateixos que té el test del generador a `step-quiz/cb`.

### Format v1 (només els primers codis de CB)

```
Lsss-DDMM-HHMM-NN,NN-RRR…R(30)-cb
```

La nota amb dos decimals i coma, els intents de cada pregunta i `cb` al final; la lletra és la fórmula antiga amb la nota × 100. L'analitzador els continua llegint (format `v1-cb`), amb els resultats sense verificar.

### Com es canvia el format dels codis

Els alumnes ja han enviat codis de tots aquests formats, i el professor els pot tornar a carregar a l'analitzador en qualsevol moment. Per això:

1. **Un format publicat no es toca mai.** Ni l'ordre dels camps, ni què vol dir cada valor, ni la fórmula de la lletra.
2. **Un canvi és un format nou** (v4…), que ha de tenir una forma que no es pugui confondre amb cap dels anteriors (per exemple, un altre nombre de segments). L'analitzador el reconeix per la forma.
3. **L'analitzador els llegeix tots.** La lectura és a `js/analitzador-stepquiz/llegeix-codi.js` (lògica pura, sense DOM) i `tests/llegeix-codi.test.js` té un codi de cada format i de cada època amb el que se n'ha de treure. Quan s'afegeix un format, s'hi afegeixen codis seus; els que ja hi són no es canvien: si un deixa de passar, l'analitzador ja no llegiria codis que els alumnes han enviat.
4. **Els dos costats a la vegada.** Si el format el genera un altre repositori (`step-quiz/cb`), els vectors fixos han de ser els mateixos als dos tests (`tests/vectors-cb-v3.js` aquí, tests/codi.test.js allà). Amb `cb` clonat al costat (a la carpeta ../cb), `tests/llegeix-codi.test.js` també llegeix 300 codis que genera de debò el codi.js de `cb`.

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
| `modalitat` | `passos` · `a`, `b` | — | Modalitat de joc: «Pas a pas» a `prioritat`; nivell a `vocabulari` |
| `esvaiment` | 1 | — | Mode «Esvaïment» (exemples resolts que es van esvaint); només a les pàgines de `SUPORTA_ESVAIMENT` |
| `inici` | 0-9 | 0 | Amb `esvaiment=1`: passos que fa l'alumne al primer exercici |
| `pissarra` | 1 | — | Ja no fa res (la «Resolució pas a pas» és a `resolucio.html?activitat=…`) |
| `debug` | 1 | desactivat | Mode de depuració (només `inversa-matriu` i `vocabulari`) |

Els màxims de sessions (5) i preguntes (10) són els que pot representar el codi v2 (camps S i QQ).

## Com fer que un exercici admeti l'esvaïment

El mode «Esvaïment» (`?esvaiment=1`, vegeu el README) és a `js/esvaiment.js`:

- `Esvaiment` són funcions pures (les proven els tests): `inicial(k0)`, `passosAlumne(estat, nPassos)` i `despresItem(estat, { senseErrors, nPassos })`. `k` és quants passos, comptant des del final, fa l'alumne. Regla: 2 exercicis seguits sense errors → `k + 1`; un error → `k − 1` (mínim 0).
- `ESVAIMENT` és la sessió de la pàgina, o `null` si la URL no porta `?esvaiment=1` o si la pàgina no l'admet. Té `passosAlumne(nPassos)`, `acabaItem({ senseErrors, nPassos })` (retorna `{ pujat, baixat, totSol }`), `estrelles()` i `registre`.
- `game-core.js` ja s'encarrega de la resta: amaga «Copiar codi», `copiarResultats()` no fa res i la pantalla final mostra les estrelles en lloc de la nota.

Per afegir-hi un exercici:

1. **Els passos, com a dades pures** al seu `math-engine.js`: una funció que, donat l'exercici, torni la llista de passos en ordre, `[{ id, resposta, … }]`, amb el que calgui per pintar-los i per explicar-los (a `prioritat`, `MathEngine.passosEsvaiment(toks)` torna `{ id, line, op, resposta, motiu }`). Sense DOM i **sense `Math.random`** (no ha de canviar les preguntes de les sessions fixes).
2. **Els textos** al seu `strings.js`: la línia que explica cada pas resolt («Exemple. … »), el missatge quan es mostra el pas bo i els de final d'exercici.
3. **El controlador** importa `ESVAIMENT` (`import { ESVAIMENT } from '../esvaiment.js';`) i, si no és `null`:
   - pinta els `nPassos − ESVAIMENT.passosAlumne(nPassos)` primers passos com a resolts, **d'un en un** (botó «Següent pas»);
   - demana a l'alumne els que queden;
   - si s'equivoca, **no** descompta intents: mostra el pas bo, el marca «amb ajuda», i continua quan l'alumne toca «Continua»;
   - en acabar l'exercici crida `ESVAIMENT.acabaItem({ senseErrors, nPassos })` i mostra com a màxim dos missatges.
4. **Registre**: afegeix el nom de la pàgina a `SUPORTA_ESVAIMENT` (`js/esvaiment.js`) i `esvaiment: true` a la seva línia de la llista d'`index.html`. `tests/check-repo.js` comprova que coincideixen.
5. **Tests** a `tests/esvaiment.test.js`: sobre molts exercicis amb llavor, que els passos aplicats l'un rere l'altre arribin al resultat (recalculat de manera independent) i que cap text tingui `undefined` ni `NaN`.

## Com afegir la resolució pas a pas a una activitat

La «Resolució pas a pas» és un escenari a part (el David, 15/11/2026): a l'activitat, l'alumne **fa** l'exercici, sense pissarra; a `resolucio.html?activitat=…`, **mira** com es resol un exercici, pas a pas, i pot demanar més detall d'un pas. El motor és a `js/pissarra/`; l'explicació completa (claus, fusions, regles i proves) és a [`docs/pissarra/MOTOR.md`](docs/pissarra/MOTOR.md) i el pla, a [`docs/pissarra/STATE.md`](docs/pissarra/STATE.md). Per donar-la a una activitat (el model és equacions):

1. **El procediment, pur**, a `js/<activitat>/resolucio.js`: `exercici(nivell)` en genera un amb el generador de l'activitat i `passos(exercici, { oberts })` en torna el guió, fet amb `guio()` i `historial()` de `js/pissarra/formules.js` (una línia TeX per fila, una frase curta en segona persona per pas i, als passos que en tenen, el `detall`). **Tots els passos intermedis queden escrits**: cada pas escriu una línia nova a sota de les anteriors, i el que hi baixa (`mou`), s'hi fusiona (`fusiona`) o s'hi reparteix (`reparteix`) hi vola des de la línia d'abans (o d'una de més amunt, amb `'id@k'`: k línies amunt). Sense DOM. Fraccions és el segon model (una cadena d'igualtats, amb càlculs al marge al detall).
2. **El registre**: l'activitat a `js/resolucio/activitats.js` (nom, pàgina, nivells, procediment), a `SUPORTA_PISSARRA` (`js/pissarra/mode.js`) i amb `pissarra: true` a la seva línia d'`index.html`. `tests/check-repo.js` comprova que coincideixen, que hi ha el procediment i que **cap activitat no importa `js/pissarra/`**.
3. **L'enllaç des de l'activitat**: «Mira com es resol …» (`target="_blank"`) cap a `resolucio.html?activitat=…&nivell=…`. L'activitat no canvia en res més: ni preguntes, ni punts, ni codi.
4. **Tests** amb la bateria comuna `tests/pissarra-activitat.js` (`provaActivitat`, com a `tests/equacions.test.js` §2): milers d'exercicis generats amb llavor, amb el resultat calculat per un altre camí. Comprova que cada guió és correcte, que cada pas mou alguna peça i poques, que **cada línia que es veu és certa** i, amb el detall a demanda, totes les vistes; s'hi afegeix que KaTeX dibuixa totes les fórmules i que les frases són en segona persona.

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
| `tests/check-repo.js` | Sintaxi de tots els JS i dels `<script>` inline · enllaços locals trencats · coherència de `js/exercise-codes.js` amb les pàgines · que no tornin errors ja corregits (barrejat esbiaixat, PDF.js sense `isEvalSupported: false`, zoom bloquejat) · sessions fixes (`fixed-sessions.js` s'executa primer) · colors (tokens.css, un tema de temes.css a cada activitat, cap color d'estat escrit a mà, fons fix) · mòduls ES (cada `import` existeix, cada `on…="…"` troba la seva funció, `window.buildLevel`, cap `js/` com a script clàssic, cap JS dins l'HTML de les pàgines amb joc) · mode «Esvaïment» (no genera mai codi, `SUPORTA_ESVAIMENT` quadra amb `index.html`) · «Resolució pas a pas» (`SUPORTA_PISSARRA` quadra amb `index.html`, la pissarra no fa servir `Math.random`, l'analitzador no en sap res) · final de pregunta (cap activitat suma punts pel seu compte, ningú no fa servir la finestra antiga «Molt bé!», les pàgines amb la franja enllacen `css/seguent.css`) · icona «Codi» (les 28 pàgines que donen codi la posen i enllacen `css/codi.css`, només `generaCodi()` munta codis, game-core.js el genera un sol cop i no en dona en sessions fixes ni esvaïment) · teclat (només `js/teclat.js` en defineix les funcions, cap teclat escrit a l'HTML, les pàgines que el fan servir enllacen `css/teclat.css`) · la caseta porta a `index.html` · totes les activitats carreguen `css/chromebook.css` |
| `tests/modules.test.js` | Genera milers de preguntes de cada mòdul: una sola opció correcta, cap opció repetida, cap `undefined`/`NaN`, la correcta repartida per igual entre posicions, i solucions recalculades de manera independent (mitjana, mediana, moda…). A `prioritat`, també la resolució pas a pas (ordre, disposició «centrat»), la modalitat «Pas a pas» i una empremta que avisa si canvien les preguntes de les sessions fixes |
| `tests/esm.test.js` | Importa de debò (amb `import`, com el navegador) la base i cada mòdul de lògica, i comprova que exporten el que han d'exportar |
| `tests/fixed-sessions.test.js` | Sessions fixes: la mateixa pregunta és igual per a tothom encara que l'alumne hagi fet coses diferents abans |
| `tests/punts.test.js` | La regla dels punts (`js/punts.js`): 10 per pregunta i 2 menys per error, mai per sota de 0; només s'accepten enters de 0 a 10; `sumaPunts()` de game-core.js no suma mai més de 10 per pregunta |
| `js/derivades/run-tests.js` | Tests detallats del mòdul de derivades |
| `tests/esvaiment.test.js` | Mode «Esvaïment»: el motor de nivells (pujar, baixar, terra a 0, URL estranyes) i, a `prioritat`, que els passos de 1.000 expressions arriben al resultat recalculat a part i que la taula sense marques és la de sempre |
| `tests/equacions.test.js` | Equacions de 1r grau: una empremta de 7.200 equacions amb els seus passos i l'HTML (si canvia, canvien les preguntes de les sessions fixes), cap equació sense una sola solució entera, i la resolució pas a pas (unes 6.300 animacions: guions correctes, cada línia amb la solució de l'equació, poques peces per pas i, sense les claus, l'HTML de sempre) |
| `tests/pissarra.test.js` | «Resolució pas a pas»: les claus i el guió, l'historial (claus per sempre, detall a demanda, calaix, objectiu en gris), el pla de cada transició, la revisió dels guions (amb guions dolents fets a mà), el text pla de cada fila, el registre de les activitats amb resolució i, per a tots els guions (avui els quatre de mostra, Pitàgores inclòs), que KaTeX dibuixa totes les fórmules, que els textos són en segona persona i que **cada línia que es veu és certa** (calculada amb aritmètica exacta, també amb lletres que tenen valor i arrels exactes). A `prioritat`, sobre 800 expressions (unes 2.400 animacions): cada animació passa la revisió, només baixen els símbols de l'operació, cada línia de la taula val el resultat i, sense les claus, la taula és la de sempre |
| `tests/fraccions.test.js` | Fraccions, la resolució pas a pas (`resolucio.html?activitat=fraccions`): els exercicis de cada nivell són com els de l'activitat (fraccions irreductibles, denominadors iguals, múltiples o qualssevol, producte i divisió, cap resultat 0) i 2.400 operacions de tots els nivells (unes 12.900 animacions, amb totes les vistes del detall): guions correctes, poques peces per pas, cada línia que es veu és certa (la cadena val el resultat, cada càlcul al marge és cert, mcm i mcd inclosos; aritmètica exacta), KaTeX dibuixa totes les fórmules, frases en segona persona i hi surten tots els tipus de pas |
| `tests/navegador/prova-pissarra.js` | La pissarra en un navegador de debò (Chromium amb Playwright): `pissarra-demo.html` (cada pas acaba amb els seus símbols, sense restes de l'animació, a mida de portàtil i de mòbil; «Vull més detall» i «Menys detall»; el reproductor; la càrrega de KaTeX), el botó «Activar la resolució pas a pas» d'`index.html` (l'enllaç porta a `resolucio.html`), les activitats sense pissarra (també amb `?pissarra=1`) i l'enllaç «Mira com es resol» d'equacions i de fraccions (amb el nivell triat), `resolucio.html?activitat=equacions` i `?activitat=fraccions` (cada pas, el detall de cada pas, el nivell, «Un altre exercici», «Ara fes-ho tu», a mida de portàtil i de mòbil); que si una animació falla la cua del motor continua; que a l'inici del moviment cada fantasma es dibuixa damunt del seu original (també en obrir un detall i els `<text>` d'un esquema SVG) i cap requadre d'avís no tapa un símbol que no es mou; que la taula de prioritat no canvia de mida; i que amb «reduir el moviment» cap símbol no viatja. Si no hi ha Playwright (p. ex. a GitHub), s'omet |
| `tests/navegador/prova-activitats.js` | Les activitats jugades en un navegador de debò (Chromium amb Playwright): nou activitats de resposta triada (trigonometria, Pitàgores, sinus i cosinus, derivades, integrals, probabilitat, llenguatge algebraic, recta numèrica, asímptotes) clicant opcions: a cada pregunta, la franja diu 10 punts menys 2 per error (o 0) i «Següent» passa a la següent; la nota final és la suma dels punts sobre 10 i l'analitzador llegeix el codi. I, en una tauleta, a les 17 activitats amb caselles, cada casella tocada rep el que s'escriu amb el teclat propi (també el signe a part de Complexos). Si no hi ha Playwright, s'omet |
| `tests/intents.test.js` | L'analitzador davant d'un alumne que repeteix la prova: intents numerats per l'hora del codi, el mateix codi enviat dos cops, quin intent compta (últim, primer, millor, tots) i proves de CB de mida diferent separades |
| `tests/codi-verificacio.test.js` | La lletra de control dels codis: vectors fixos (els mateixos que ha de complir `step-quiz/cb`; els del v3 són a `tests/vectors-cb-v3.js`), que canviar una sola xifra dels resultats es detecti sempre i que els codis antics continuïn sent vàlids |
| `tests/llegeix-codi.test.js` | El lector de codis de l'analitzador: un codi de cada format i de cada època (v1-cb, v2 amb la lletra antiga i la nova, v2 i v3 de CB) i el que se n'ha de treure, els codis dolents, l'anada i tornada del v2 per a tots els codis d'exercici i la del v3 amb els vectors de `cb` (i, si `cb` és clonat a la carpeta ../cb, 300 codis del seu codi.js) |
| `tests/docs_vs_codi.py` | Que la documentació diu el mateix que el codi: les rutes que citen els documents principals existeixen i el README parla de totes les pàgines de l'arrel (Python, sense dependències) |

**GitHub ho fa sol:** el fitxer `.github/workflows/tests.yml` executa `node tests/run-all.js` cada cop que es puja alguna cosa a `main` i a cada pull request. El resultat surt com una ✓ verda o una ✗ vermella al costat del commit (pestanya **Actions** per veure'n el detall).

Quan s'afegeix un mòdul nou de preguntes, cal afegir-lo a `tests/modules.test.js`.
