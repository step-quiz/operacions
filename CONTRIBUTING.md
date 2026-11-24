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
│   ├── utils.js                ← Funcions pures: randInt, pick, shuffle, gcd, parseStrictInt, nivellProgressiu, triaProgressiva
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
│   │   └── demo.js             ← Guions de mostra (pissarra-demo.html)
│   ├── derivades/              ← Mòdul de derivades (patró recomanat, mòduls ES)
│   │   ├── math-engine.js      ← Capa matemàtica pura (sense DOM)
│   │   ├── strings.js          ← Tots els textos i feedback
│   │   ├── distractor-lib.js   ← Generador de distractors pedagògics
│   │   ├── question-bank.js    ← Registre de famílies de preguntes
│   │   └── derivades.js        ← Controlador DOM (l'únic que carrega l'HTML; importa la resta)
│   ├── integrals/              ← Mateixa estructura que derivades/ (+ quasi-bank.js: les quasi-immediates)
│   ├── recta-numerica/         ← Mateixa estructura
│   ├── asimptotes/             ← Mateixa estructura (amb noms *-asimptotes.js)
│   ├── fraccions/fraccions.js  ← Jocs més antics: tot el joc en un sol fitxer (fraccions/resolucio.js: la resolució pas a pas, pura)
│   ├── equacions/              ← equacions.js (el joc), math-engine.js (equacions i passos, pur), renderer.js (HTML)
│   ├── passos/                 ← Joc de passos comú: joc-passos.js (DOM), correccio.js (correcció dels passos, pur), textos.js, figura-fraccio.js, quadricula.js, grafic-estadistic.js, grafica-context.js, escala-unitats.js i figures-mesura.js (purs), taula-signes.js (la taula de signes: model, correcció i taula resolta purs; el giny, DOM), recta-intervals.js (la recta del 17 i la recta amb trams del 22c: SVG, lectura i correcció purs; el giny dels trams, DOM) i esbos-funcio.js (esbós d'una funció, pur)
│   ├── algebra/                ← racionals.js i polinomis.js (purs): fraccions i decimals; monomis, polinomis i expressions
│   ├── equacions-segon-grau/   ← Joc de passos: math-engine.js (equacions i passos com a dades, pur), errors.js (diagnòstic, pur), strings.js i un controlador curt
│   ├── expressions-algebraiques/ ← Joc de passos: math-engine.js, errors.js, strings.js i el controlador
│   ├── identitats-notables/    ← Joc de passos: math-engine.js, errors.js, strings.js i el controlador
│   ├── fraccio-decimal-percentatge/ ← Joc de passos: math-engine.js, errors.js, strings.js i el controlador
│   ├── percentatges/           ← Joc de passos: math-engine.js, errors.js, strings.js i el controlador
│   ├── canvi-unitats/          ← Joc de passos: math-engine.js (canvis i passos, amb l'escala comuna), errors.js, strings.js i el controlador
│   ├── potencies/              ← potencies.js (el joc, amb el seu sistema de passos) i reptes-nous.js (reptes 4 i 5: exercicis, passos, correcció i errors, pur)
│   ├── formules-steam/         ← Joc de passos (amb les targetes del problema i la fórmula, els passos amb lletres opcionals i els colors del que es mou: opcions de joc-passos.js que només fa servir aquesta activitat): algebra.js (llegir, aïllar i errors, pur), cataleg.js (fórmules, contextos i unitats), math-engine.js, errors.js, strings.js i el controlador; resolucio.js, la resolució pas a pas (pur)
│   ├── logaritmes/             ← Joc de passos: math-engine.js (els 5 tipus d'exercici del bloc 1), equacions.js (els 6 tipus d'equació del bloc 2), errors.js, strings.js i el controlador
│   ├── complexos/              ← complexos.js (pestanyes clàssiques) + polar.js (DOM), polar-engine.js (exercicis, correcció, errors; pur), pla-complex.js (pla complex SVG; pur) i strings-polar.js: les pestanyes «Forma polar» i «Potències i arrels»
│   ├── binomial/               ← Joc de passos: math-engine.js (problemes, casos, opcions, passos; totsElsProblemes per als tests), errors.js, strings.js (contextos i errors) i el controlador
│   ├── estudi-funcio/          ← Joc de passos: polinomis-ef.js (polinomis, arrels exactes, s·√r), math-engine.js (famílies, estudi exacte, opcions falses, passos), errors.js, strings.js i el controlador
│   ├── inequacions/            ← Joc de passos: math-engine.js (primer grau: nivells, passos amb caselles i el signe, recta, interval), no-lineals.js (2n grau i racionals: zeros, taula de signes, recta amb trams, interval), errors.js, strings.js i el controlador
│   ├── arees-volums/           ← Joc de passos: math-engine.js (figures i passos, amb les figures de mesura comunes), errors.js, strings.js i el controlador
│   ├── cilindres/              ← Joc de passos: math-engine.js (passos, correcció amb arrossegament refaPassos, figura SVG), errors.js, strings.js i el controlador
│   ├── recta/                  ← Joc de passos: math-engine.js, errors.js, strings.js i el controlador
│   ├── grafiques-context/      ← math-engine.js (històries, gràfica i pregunta, amb els distractors), errors.js, strings.js i el controlador
│   ├── grafics-estadistics/    ← math-engine.js (dades, gràfic i pregunta, amb els distractors), errors.js, strings.js i el controlador
│   ├── sistemes-equacions/     ← sistemes-equacions.js (el joc) i grafica.js (botó «Mira-ho a la gràfica»: les dues rectes a la quadrícula comuna, pur llevat del botó)
│   ├── parabola/               ← Joc de passos: math-engine.js, errors.js, strings.js i el controlador (els talls, amb els passos d'equacions-segon-grau)
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

   Si l'activitat es resol **pas a pas escrivint en caselles**, feu servir el joc de passos comú (`js/passos/`): `math-engine.js` (passos com a dades), `errors.js`, `strings.js` i un controlador que crida `iniciaJocPassos({ … })`. El joc ja acaba cada pregunta amb `acabaPregunta()` i la pàgina no necessita CSS propi: copieu la capçalera d'`equacions-segon-grau.html` (tema del bloc a `<html>` i la cadena de CSS comuns, amb `css/passos.css`).

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

   **Batxillerat:** les activitats de Batxillerat no donen codi de verificació (l'excepció és asímptotes, que el genera pel seu compte). Si la pàgina mostra la pantalla final comuna (`injectSharedHTML()`), afegiu `senseCodi: true` a `window.APP_CONFIG`: no hi surt la icona «Codi» ni el botó «Copiar codi», i `codiFinal()` i `copiarResultats()` no fan res (`SENSE_CODI`, a `js/config.js`).

3. Registrar el codi d'exercici a `EXERCISE_CODES` dins `js/exercise-codes.js` (2 lletres que no estiguin fetes servir; `CB` està reservat). L'analitzador el reconeixerà automàticament:
   ```js
   'nou-exercici': 'NE',
   ```

4. Afegir l'activitat a `index.html`, **un sol cop**, a `ACTIVITIES_ESO` o a `ACTIVITIES_BATX` (mai a totes dues llistes).
   - **Opcions pròpies.** Si l'activitat té paràmetres d'URL que el professorat ha de poder triar (tipus de pregunta, dimensió, nombre de lletres…), declareu-los a la taula `OPCIONS_ACTIVITAT` del mateix fitxer, amb la forma `{ param, label, valors }`, on `valors` és una llista de parelles valor i text. El panell crea una fila per a cada opció i afegeix el paràmetre a l'enllaç quan el valor no és buit; no s'escriu cap fila a mà. La pàgina ha de llegir el paràmetre de la URL.
   - **Pàgines autònomes.** Una pàgina que no fa servir el motor comú (com `arbre.html`) porta `autonoma: true`: l'enllaç és només la pàgina, sense sessions, preguntes ni intents.

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
| D | 1 | Dificultat (0=sense nivells, 1-3). Algunes pàgines hi diuen una altra cosa (`ETIQUETES_DIFICULTAT` de `js/exercise-codes.js`, que l'analitzador fa servir per escriure-ho): a Inequacions (IQ), 0-4 primer grau (progressiu o nivell 1-4) i 5-8 de 2n grau i racionals (progressiu o nivell 1-3); l'activitat el fixa amb `state.dificultatCodi` (`game-core.js`) |
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
| `nombres` | `enters` | — | `prioritat`: operacions combinades amb enters |
| `tipus`, `constant` | `immediates`/`quasi` · `exacta`/`ajust` | totes · progressiu | `integrals`: grup de famílies i nivell de les quasi-immediates (f′ exacta o llevat d'una constant) |
| `funcions` | `polinomiques`/`racionals`/`pau` | totes | `estudi-funcio`: quines funcions (les 6 de PAU, en ordre, amb `pau`) |
| `tipus` | `exacte`/`directe`/`contrari` | progressiu | `binomial`: nivell 1, 2 o 3 |
| `pestanya` | `polar`/`potencies` | la primera | `complexos`: la pestanya que s'obre |
| `tipus` | `definicio`/`calcul`/`propietats` · `equacions`/`basiques`/`mitjanes`/`irracionals` | logaritmes, progressiu | `logaritmes`: bloc 1, nivell 1, 2 o 3 · bloc 2 (equacions), progressiu o nivell 1, 2 o 3 |
| `tipus` | `no-lineals`/`segon-grau`/`racionals`/`especials` | primer grau | `inequacions`: 2n grau i racionals, progressiu o nivell 1, 2 o 3 |
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
2. **El registre**: l'activitat a `js/resolucio/activitats.js`, l'única llista (tema, nom, frase i fórmula d'exemple per a la targeta del portal, pàgina, nivells amb nom, procediment). No cal tocar res més: el portal de `resolucio.html` i el botó de l'índex la mostren sols. `tests/check-repo.js` comprova que hi ha la pàgina i el procediment i que **cap activitat no importa `js/pissarra/`**; `tests/pissarra.test.js`, que la targeta té totes les dades i que KaTeX en dibuixa l'exemple.
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
| `tests/check-repo.js` | Sintaxi de tots els JS i dels `<script>` inline · enllaços locals trencats · coherència de `js/exercise-codes.js` amb les pàgines · que no tornin errors ja corregits (barrejat esbiaixat, PDF.js sense `isEvalSupported: false`, zoom bloquejat) · sessions fixes (`fixed-sessions.js` s'executa primer) · colors (tokens.css, un tema de temes.css a cada activitat, cap color d'estat escrit a mà, fons fix) · mòduls ES (cada `import` existeix, cada `on…="…"` troba la seva funció, `window.buildLevel`, cap `js/` com a script clàssic, cap JS dins l'HTML de les pàgines amb joc) · mode «Esvaïment» (no genera mai codi, `SUPORTA_ESVAIMENT` quadra amb `index.html`) · «Resolució pas a pas» (`SUPORTA_PISSARRA` quadra amb `index.html`, la pissarra no fa servir `Math.random`, l'analitzador no en sap res) · final de pregunta (cap activitat suma punts pel seu compte, ningú no fa servir la finestra antiga «Molt bé!», les pàgines amb la franja enllacen `css/seguent.css`) · icona «Codi» (les pàgines que donen codi la posen i enllacen `css/codi.css`, només `generaCodi()` munta codis, game-core.js el genera un sol cop i no en dona en sessions fixes, esvaïment ni a les activitats sense codi) · teclat (només `js/teclat.js` en defineix les funcions, cap teclat escrit a l'HTML, les pàgines que el fan servir enllacen `css/teclat.css`) · la caseta porta a `index.html` · totes les activitats carreguen `css/chromebook.css` · generador d'enllaços (cap activitat repetida a les llistes, cada opció d'`OPCIONS_ACTIVITAT` la llegeix la seva pàgina, les pàgines autònomes no fan servir `game-core.js`, les activitats de Batxillerat del motor comú porten `senseCodi: true` i no donen codi) |
| `tests/modules.test.js` | Genera milers de preguntes de cada mòdul: una sola opció correcta, cap opció repetida, cap `undefined`/`NaN`, la correcta repartida per igual entre posicions, i solucions recalculades de manera independent (mitjana, mediana, moda…). A `prioritat`, també la resolució pas a pas (ordre, disposició «centrat»), la modalitat «Pas a pas» i una empremta que avisa si canvien les preguntes de les sessions fixes |
| `tests/esm.test.js` | Importa de debò (amb `import`, com el navegador) la base i cada mòdul de lògica, i comprova que exporten el que han d'exportar |
| `tests/fixed-sessions.test.js` | Sessions fixes: la mateixa pregunta és igual per a tothom encara que l'alumne hagi fet coses diferents abans |
| `tests/punts.test.js` | La regla dels punts (`js/punts.js`): 10 per pregunta i 2 menys per error, mai per sota de 0; només s'accepten enters de 0 a 10; `sumaPunts()` de game-core.js no suma mai més de 10 per pregunta |
| `js/derivades/run-tests.js` | Tests detallats del mòdul de derivades |
| `tests/esvaiment.test.js` | Mode «Esvaïment»: el motor de nivells (pujar, baixar, terra a 0, URL estranyes) i, a `prioritat`, que els passos de 1.000 expressions arriben al resultat recalculat a part i que la taula sense marques és la de sempre |
| `tests/equacions.test.js` | Equacions de 1r grau: una empremta de 7.200 equacions amb els seus passos i l'HTML (si canvia, canvien les preguntes de les sessions fixes), cap equació sense una sola solució entera, i la resolució pas a pas (unes 6.300 animacions: guions correctes, cada línia amb la solució de l'equació, poques peces per pas i, sense les claus, l'HTML de sempre) |
| `tests/pissarra.test.js` | «Resolució pas a pas»: les claus i el guió, l'historial (claus per sempre, detall a demanda, calaix, objectiu en gris), el pla de cada transició, la revisió dels guions (amb guions dolents fets a mà), el text pla de cada fila, el registre de les activitats amb resolució i, per a tots els guions (avui els quatre de mostra, Pitàgores inclòs), que KaTeX dibuixa totes les fórmules, que els textos són en segona persona i que **cada línia que es veu és certa** (calculada amb aritmètica exacta, també amb lletres que tenen valor i arrels exactes). |
| `tests/prioritat.test.js` | Prioritat d'operacions, la resolució pas a pas (`resolucio.html?activitat=prioritat`): els nivells 1–5 cobreixen els 10 de l'activitat i els 6–8, els 6 d'enters, i cada exercici és del seu grup (amb negatius als d'enters); 2.000 expressions (unes 12.600 animacions, amb totes les vistes del detall): guions correctes, una operació per pas, cada pas que escriu una fila mou poques peces, cada fila de la taula val el resultat (aritmètica exacta), el detall només destaca l'operació (no escriu cap fila), frases en segona persona i l'última fila és el resultat |
| `tests/prioritat-enters.test.js` | Prioritat d'operacions amb enters (`?nombres=enters`): una aritmètica pròpia llegeix cada expressió escrita (5 − (−3), −2², (−2)³, −(4 − 7)) i, amb la regla equivocada, el valor de cada error dels signes; 3.000 expressions dels 6 nivells: valor enter i com a molt 100 en valor absolut, el contingut de cada nivell, 3 distractors enters i diferents (els dels signes, recalculats), el missatge i la marca de cada error, la resolució de llibre (treure −(…) inclòs), la taula, «Pas a pas» per camins a l'atzar (operacions que es poden fer, per què no les altres, distractors amb el signe girat i la pista del signe) i l'esvaïment; casos a mà; l'opció «Nombres» d'`index.html` |
| `tests/potencies.test.js` | Potències, reptes 4 i 5 (`js/potencies/reptes-nous.js`): 4.000 exercicis d'exponent zero i negatiu, amb l'expressió tornada a llegir del text (7⁰, 2⁻³, (2/3)⁻², a³ : a⁵, 2⁻³ · 2⁵, (3⁻²)³) i la solució de cada pas recalculada amb enters exactes; 4.000 operacions en notació científica, amb el valor exacte calculat a part (mantisses, exponents i resultat amb la mantissa entre 1 i 10); la resposta bona s'accepta (amb «−» o «-», amb coma), cada opció dolenta i cada valor equivocat dona el seu error i el seu missatge, i surten tots; els avisos (fracció sense simplificar, punt decimal, notació sense ajustar) no són errors; la pàgina (les targetes, el controlador, la coma del teclat a les caselles de decimals i les caselles que es buiden després d'un error) |
| `tests/formules-steam.test.js` | Fórmules STEAM: una lectura pròpia del text que veu l'alumne («v · Δt = 120», «√(2 · Ec / m) = v») el calcula; per a cada fórmula i cada lletra, centenars de preguntes: els valors compleixen la fórmula, cada equació bona es compleix i cap opció dolenta no es compleix, l'última té la lletra sola (girada si cal), el valor i la unitat, tantes operacions amb nombres com amb lletres, cada error es reconeix i surten tots, KaTeX sense errors ni trossos en vermell; els quatre nivells; sempre context i llegenda; cada fórmula és de física, química o tecnologia (l'electricitat i les màquines, de tecnologia) i `?materia=` només en dona d'aquella matèria (també als nivells que no té); sense codi. I la resolució pas a pas (`resolucio.html?activitat=formules-steam`): 30 exercicis de cada fórmula i cada lletra (unes 13.000 animacions) amb la bateria comuna (guions correctes, cada pas mou alguna peça i poques, cada línia que es veu és certa amb les dades del problema: un model propi calcula els dos costats; la línia de les unitats acaba amb la unitat de la lletra), KaTeX dibuixa files i frases, frases en segona persona, sempre el context a la primera frase, el resultat amb la unitat i la fórmula aïllada ressaltats, les mateixes operacions amb nombres i amb lletres, i un exemple fet a mà (v = Δx / Δt, aïllar Δt); `NIVELLS` són les fórmules per matèries i `exercici(clau)` dona aquella fórmula |
| `tests/logaritmes.test.js` | Logaritmes (bloc 1): 4.500 exercicis dels 3 nivells contra un model independent (`tests/logaritmes-model.js`, que avalua el TeX: log, ln, fraccions, potències, arrels, lletres): definició, forma, propietats (la correcta igual amb a, b, c a l'atzar, cap falsa), càlcul i calculadora; KaTeX; la resposta bona val; cada error típic fet a mà; mutació; nivells, pàgina, índex i codi LG reservat |
| `tests/navegador/prova-logaritmes.js` | Logaritmes al navegador (1366×768): una sessió de cada nivell de cap a cap llegint el TeX de la pantalla (10 punts per exercici, sense codi, cap error a la consola); a la tauleta, la coma del teclat propi a la casella decimal |
| `tests/logaritmes-equacions.test.js` | Logaritmes, bloc 2 (equacions): 2.100 equacions dels 3 nivells contra un model independent (`tests/equacions-model.js`, que compila el TeX i en busca les solucions per escombratge i bisecció): les solucions de l'equació inicial són les dels passos; l'opció correcta de cada transformació té les solucions que toca i cap falsa no té les mateixes; les comprovacions coincideixen amb el que passa en substituir; KaTeX; el diagnòstic dels errors (E1) i dues mutacions; nivells, controlador i índex |
| `tests/navegador/prova-logaritmes-equacions.js` | Equacions al navegador (1366×768): una sessió de cada nivell de cap a cap llegint el TeX de la pantalla i resolent amb el model (10 punts per equació), el subtítol, sense codi i cap error a la consola |
| `tests/complexos-polar.test.js` | Complexos, «Forma polar» i «Potències i arrels»: 6.000 exercicis dels 5 apartats i els 2 nivells contra un model independent (`tests/complexos-polar-model.js`, que llegeix l'enunciat en TeX i calcula amb aritmètica complexa): quadrant, mòdul, argument, binòmica, producte/quocient, De Moivre, arrels (wⁿ = z); KaTeX; la correcció com escriu l'alumne (c√s, decimals amb coma, avís de simplificar); cada error típic fet a mà; el pla; mutacions; la pàgina |
| `tests/navegador/prova-complexos-polar.js` | Les dues pestanyes al navegador (1366×768): cada apartat i nivell de cap a cap (la prova llegeix l'enunciat de KaTeX i toca quadrants i arrels al pla), un error a posta amb el perquè, `?pestanya=`, cap error a la consola; a la tauleta, decimals amb coma i el botó del signe |
| `tests/binomial.test.js` | Distribució binomial: tots els problemes possibles dels tres nivells (uns 3.300) contra un model que llegeix l'enunciat en català i suma la fórmula; cada pas (n, p, q, la pregunta, el camí, C(n, k), P(X = k), la resposta en tant per u o en %); la tolerància; cada error típic fet a mà; la ruta llarga; mutacions; la pàgina, l'índex i el codi BI reservat |
| `tests/navegador/prova-binomial.js` | Distribució binomial al navegador (1366×768): 6 problemes progressius de cap a cap (la prova llegeix l'enunciat i en treu les respostes), la ruta llarga, un error a posta amb el perquè, punts i nota final, sense codi |
| `tests/estudi-funcio.test.js` | Estudi d'una funció: 900 funcions de les 8 famílies i els 6 de PAU contra un model independent (un avaluador del TeX que es veu i derivades numèriques): f′ i f″ correctes i cap opció falsa que ho sigui, zeros i domini, cada cel·la de les dues taules, la y dels extrems i de les inflexions (amb √), 4 opcions (3 gràfiques) diferents i una de correcta; cada error es diagnostica amb el seu codi (també els fets a mà a les taules); la taula com a camp del joc de passos (avisos, punts de prova, el − tipogràfic); mutacions; la pàgina, l'índex i el codi EF reservat |
| `tests/navegador/prova-estudi-funcio.js` | Estudi d'una funció al navegador (1366×768): els 6 de PAU de cap a cap (taules, extrems, gràfica, part opcional), un error a posta amb el perquè i la cel·la marcada, punts 8 + 2 i nota final, sense codi; a la tauleta, el teclat propi escriu als punts de prova |
| `tests/inequacions.test.js` | Inequacions: 1.600 inequacions dels quatre nivells; un model propi (l'enunciat calculat amb nombres a banda i banda de la solució) confirma cada solució; cada pas accepta la bona i cada distractor es diagnostica amb el seu codi (surten tots); la recta (punt, ple o buit, costat) i l'interval diuen el mateix que la solució; KaTeX; els nivells (coeficient positiu/negatiu, parèntesis, denominadors; fraccions amb probabilitat 1/3 als nivells 3 i 4); la recta comuna i el camp «recta» del joc de passos. I la resolució pas a pas (`resolucio.html?activitat=inequacions`): 1.600 inequacions amb la bateria comuna, tancades i amb tot el detall (cada línia que es veu té la mateixa solució: aritmètica exacta a la solució i a banda i banda; l'interval, el bo), KaTeX, segona persona, mai «es gira», dividir per un negatiu canvia el signe (frase i signe ressaltat), «x < 4» com a pas propi quan la x és a la dreta, la recta (punt ple o buit, el nombre hi vola), el nivell 4 treu els denominadors i l'activitat hi enllaça |
| `tests/inequacions-no-lineals.test.js` | Inequacions de 2n grau i racionals: 2.400 inequacions dels 3 nivells contra un model independent (compila el TeX amb `tests/equacions-model.js` i mira, punt per punt d'una graella, si la x hi compleix): l'opció correcta de l'interval és el conjunt de la inequació i cap falsa no ho és; «tot a un costat» és equivalent (i cap falsa no ho és); els zeros; els signes de la taula i els trams i punts de la recta; KaTeX; la resposta bona val; el diagnòstic dels errors (E1) i mutacions; la recta amb trams (SVG i lectura), nivells, controlador, índex i codi IQ |
| `tests/navegador/prova-inequacions-no-lineals.js` | Inequacions de 2n grau i racionals al navegador: una sessió de cada nivell de cap a cap a 1366×768 (opcions, zeros, taula tocant les cel·les, recta tocant trams i punts o «Cap solució», interval; 10 punts per inequació), el subtítol i, a la tauleta tàctil, una sessió amb el teclat propi |
| `tests/fraccions.test.js` | Fraccions, la resolució pas a pas (`resolucio.html?activitat=fraccions`): els exercicis de cada nivell són com els de l'activitat (fraccions irreductibles, denominadors iguals, múltiples o qualssevol, producte i divisió, cap resultat 0) i 2.400 operacions de tots els nivells (unes 12.900 animacions, amb totes les vistes del detall): guions correctes, poques peces per pas, cada línia que es veu és certa (la cadena val el resultat, cada càlcul al marge és cert, mcm i mcd inclosos; aritmètica exacta), KaTeX dibuixa totes les fórmules, frases en segona persona i hi surten tots els tipus de pas |
| `tests/equacions-segon-grau.test.js` | Equacions de 2n grau: 22.500 equacions (cada tipus i nivell) amb les solucions comprovades substituint-les a l'equació original amb aritmètica exacta, 7.500 resolucions pas a pas (la resposta bona s'accepta, les dues solucions valen en qualsevol ordre), avisos que no resten intent (fracció sense simplificar, denominador 0), equacions equivalents en ordenar, respostes equivocades a l'atzar, una prova feta a mà per a cada error de la taxonomia, i que les opcions d'`index.html` són les que entén el joc |
| `tests/expressions-algebraiques.test.js` | Expressions algebraiques i `js/algebra/polinomis.js`: escriptura de polinomis i expressions; 19.200 expressions (cada tipus, nivell i nombre de lletres) amb el resultat comprovat avaluant l'expressió en quatre punts; la resposta bona s'accepta amb les caselles en blanc; 4.000 respostes equivocades a l'atzar; una prova feta a mà per a cada error de la taxonomia, i que les opcions d'`index.html` són les que entén el joc |
| `tests/identitats-notables.test.js` | Identitats notables i els coeficients fraccionaris de `js/algebra/`: 12.000 preguntes (tipus × nivell × lletres × fraccions) amb el desenvolupament i la factorització comprovats avaluant en tres punts; els «no és cap identitat» comprovats amb B² ≠ 4AC; la resposta bona i l'equivalent amb els signes canviats s'accepten; una prova feta a mà per a cada un dels 19 errors; respostes equivocades a l'atzar, i les opcions d'`index.html` |
| `tests/fraccio-decimal-percentatge.test.js` | Fracció, decimal i percentatge i els camps comuns nous: lectura de decimals amb període, expansions decimals tornades a llegir, figures de fraccions; 4.800 preguntes (nivell × modalitat) on la resposta bona (també escrita d'una altra manera) s'accepta i cap targeta o valor fals coincideix amb el bo; una prova a mà per a cada un dels 11 errors, a les dues modalitats; respostes equivocades a l'atzar, i l'opció `modalitat` d'`index.html` |
| `tests/percentatges.test.js` | Percentatges, `errorPerDistractors` i els decimals de `js/algebra/racionals.js`: 9.000 problemes (5 tipus × 3 nivells) amb la solució de cada pas recalculada a partir dels nombres de l'enunciat; la resposta bona s'accepta (també amb un zero de més) i cap valor equivocat coincideix amb el bo; un cas a mà per a cada un dels 17 errors; el tipus que toca a cada nivell, i l'opció `tipus` d'`index.html` |
| `tests/recta.test.js` | La recta, la quadrícula comuna i el camp 'punts': SVG de la quadrícula (línies, rectes retallades, punts, triangle); correcció de punts (qualsevol parell de la recta, repetits, incomplet, punts fixos en qualsevol ordre); 7.200 preguntes (4 tipus × 3 nivells) amb la resposta bona acceptada i la recta per dos punts comprovada; un cas a mà per a cada un dels 14 errors, i l'opció `tipus` d'`index.html` |
| `tests/parabola.test.js` | La paràbola i les paràboles de la quadrícula comuna (paràbola per tres punts, dibuix): 4.200 preguntes (2 sentits × 3 nivells) amb el vèrtex, els talls i els punts notables comprovats substituint-los a l'expressió i el nombre de talls amb el discriminant; la resposta bona s'accepta; un cas a mà per a cada un dels 12 errors (i un dels passos d'Equacions de 2n grau); l'opció `tipus` d'`index.html` |
| `tests/sistemes-grafica.test.js` | «Mira-ho a la gràfica» de Sistemes d'equacions: de l'equació a la recta (també sense x o sense y); 5.000 sistemes amb solució entera, amb les dues rectes tornades a llegir de l'SVG (cada extrem compleix la seva equació, el punt de tall és sobre totes dues, el cercle i l'etiqueta al seu lloc); l'activitat crida el botó en acabar cada sistema i les pàgines amb quadrícula enllacen `css/quadricula.css` |
| `tests/grafics-estadistics.test.js` | Gràfic estadístic comú (barres, eix tallat, escala irregular, histograma i polígon, sectors, pictogrames: cada gràfic es torna a llegir de l'SVG i dona les seves dades) i «Gràfics estadístics»: 4.320 preguntes de totes les famílies, nivells i opcions, amb la solució tornada a calcular a partir del gràfic, les afirmacions certes i falses avaluades, cada distractor amb el seu error; les barres acaben en una ratlla, la moda és única, els sectors sumen 100 |
| `tests/grafiques-context.test.js` | Gràfica amb context comuna (trams rectes, que acceleren, que frenen i suaus; tornada a llegir de l'SVG, també en petit) i «Gràfiques en context»: gairebé 3.000 preguntes de totes les menes, nivells i opcions, amb la solució tornada a calcular a partir de la gràfica, els trams de les opcions comprovats (creix, decreix, més de pressa), les afirmacions i les formes avaluades, i al relat la gràfica bona és la de l'enunciat i les altres no; cada distractor amb el seu error |
| `tests/canvi-unitats.test.js` | Canvi d'unitats i l'escala comuna: els graons en ordre i les unitats marcades; 10.500 canvis de totes les magnituds i nivells (i de cada opció `magnitud`), amb els graons, el factor i el resultat tornats a calcular a partir de l'enunciat amb una taula d'unitats pròpia (1 l = 1 dm³) i aritmètica exacta; la resposta bona s'accepta i hi cap; 4 opcions diferents a cada pas d'escollir, cada opció dolenta i cada valor equivocat amb el seu error (els 6 hi surten); KaTeX; com a molt 6 decimals; les opcions d'`index.html` |
| `tests/arees-volums.test.js` | Àrees i volums i les figures de mesura comunes: cada segment amb mesura té la seva etiqueta, les altures discontínues amb l'angle recte i cap etiqueta fora del dibuix; 8.400 preguntes de les 14 figures, amb les mesures tornades a llegir del dibuix i la solució de cada pas tornada a calcular amb fraccions exactes i π = 3,14 (lletres de la base, l'altura, les diagonals i les bases; radi; àrees, volums, unitat i fórmula), el dibuix possible (Pitàgores); la resposta bona s'accepta i hi cap; les opcions de 3 a 4, diferents, amb la bona, i les lletres i les unitats sense majúscula; cada opció dolenta i cada valor equivocat té el seu error, reconegut pel diagnòstic, i surten els 24; KaTeX; les figures de cada nivell i de cada opció `dim`, i les opcions d'`index.html` |
| `tests/cilindres.test.js` | Cilindres amb un full: 320 fulls jugats per tres alumnes simulats (arrodoneix, trunca, π ≈ 3,14) amb la correcció amb arrossegament: cap resposta ben feta no es rebutja i el volum queda a prop del model propi (V = c²·h / 4π); cada distractor es diagnostica; KaTeX; el full A4 (V₁ ≈ 1 052,8 cm³), el costat com a circumferència, quatre opcions al plegat, mL, el codi CF · i la resolució pas a pas (`resolucio.html?activitat=cilindres`): 305 fulls amb la bateria comuna, tancats i amb el detall del radi (cada «=», «≈» i «>» de cada línia es comprova amb un model propi), KaTeX, segona persona, els costats volen del full a la fórmula, volum en cm³ i capacitat en mL, i l'activitat hi enllaça |
| `tests/navegador/prova-pissarra.js` | La pissarra en un navegador de debò (Chromium amb Playwright): `pissarra-demo.html` (cada pas acaba amb els seus símbols, sense restes de l'animació, a mida de portàtil i de mòbil; «Vull més detall» i «Menys detall»; el reproductor; la càrrega de KaTeX), el botó «Resolució pas a pas» d'`index.html` (obre el portal en una pestanya nova) i el peu flotant, les activitats sense pissarra (també amb `?pissarra=1`) i l'enllaç «Mira com es resol» d'equacions, de fraccions, de prioritat, de fórmules STEAM, d'inequacions i de cilindres (amb el nivell), `resolucio.html?activitat=equacions`, `?activitat=fraccions`, `?activitat=prioritat`, `?activitat=formules-steam`, `?activitat=inequacions` i `?activitat=cilindres` (cada pas, el detall de cada pas que en té, el nivell amb el desplegable, també amb el teclat, «Un altre exercici», «Ara fes-ho tu» i el peu a la vista, a mida de portàtil i de mòbil); que a la tauleta el botó «Pas següent» no es mou d'un pas a l'altre; el portal (una targeta per activitat, amb l'exemple, els nivells i «Copia l'enllaç»); que si una animació falla la cua del motor continua; que a l'inici del moviment cada fantasma es dibuixa damunt del seu original (també en obrir un detall i els `<text>` d'un esquema SVG) i cap requadre d'avís no tapa un símbol que no es mou; que la taula de prioritat no canvia de mida; que amb «reduir el moviment» cap símbol no viatja; i, a classe, que tocar la pissarra (o l'espai) acaba el pas de cop, el ↺ el torna a animar, Av Pàg / Re Pàg passen els passos i el mode professor (botó o `?professor=1`) fa la pissarra gran, sense frases ni peu i a tota l'amplada i l'alçada (també a 1366 × 680 amb una suma de fraccions). Si no hi ha Playwright (p. ex. a GitHub), s'omet |
| `tests/navegador/prova-activitats.js` | Les activitats jugades en un navegador de debò (Chromium amb Playwright): nou activitats de resposta triada (trigonometria, Pitàgores, sinus i cosinus, derivades, integrals, probabilitat, llenguatge algebraic, recta numèrica, asímptotes) clicant opcions: a cada pregunta, la franja diu 10 punts menys 2 per error (o 0) i «Següent» passa a la següent; la nota final és la suma dels punts sobre 10 i l'analitzador llegeix el codi. I, en una tauleta, a les 17 activitats amb caselles, cada casella tocada rep el que s'escriu amb el teclat propi (també el signe a part de Complexos). Si no hi ha Playwright, s'omet |
| `tests/intents.test.js` | L'analitzador davant d'un alumne que repeteix la prova: intents numerats per l'hora del codi, el mateix codi enviat dos cops, quin intent compta (últim, primer, millor, tots) i proves de CB de mida diferent separades |
| `tests/codi-verificacio.test.js` | La lletra de control dels codis: vectors fixos (els mateixos que ha de complir `step-quiz/cb`; els del v3 són a `tests/vectors-cb-v3.js`), que canviar una sola xifra dels resultats es detecti sempre i que els codis antics continuïn sent vàlids |
| `tests/llegeix-codi.test.js` | El lector de codis de l'analitzador: un codi de cada format i de cada època (v1-cb, v2 amb la lletra antiga i la nova, v2 i v3 de CB) i el que se n'ha de treure, els codis dolents, l'anada i tornada del v2 per a tots els codis d'exercici i la del v3 amb els vectors de `cb` (i, si `cb` és clonat a la carpeta ../cb, 300 codis del seu codi.js) |
| `tests/docs_vs_codi.py` | Que la documentació diu el mateix que el codi: les rutes que citen els documents principals existeixen i el README parla de totes les pàgines de l'arrel (Python, sense dependències) |

**GitHub ho fa sol:** el fitxer `.github/workflows/tests.yml` executa `node tests/run-all.js` cada cop que es puja alguna cosa a `main` i a cada pull request. El resultat surt com una ✓ verda o una ✗ vermella al costat del commit (pestanya **Actions** per veure'n el detall).

Quan s'afegeix un mòdul nou de preguntes, cal afegir-lo a `tests/modules.test.js`.
