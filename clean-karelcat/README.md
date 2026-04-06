# clean-karelcat — Briefing tècnic per a IA

> Aquest document descriu l'estat actual del projecte **clean-karelcat** i les tasques pendents. Està pensat per ser consumit per una IA que continuï el desenvolupament sense haver participat en les converses anteriors.

---

## 1. Context: Stanford Karel i què volem imitar

### Què és Stanford Karel

Karel és un entorn de programació educatiu creat als anys 70 per Rich Pattis a Stanford. S'utilitza al curs CS106A per ensenyar programació a principiants absoluts. L'alumne controla un robot (Karel) dins d'una graella, donant-li instruccions en un llenguatge molt reduït.

Stanford ofereix un "Karel Reader" interactiu al web:
- URL: `https://compedu.stanford.edu/karel-reader/docs/python/en/intro.html`
- 11 capítols amb exemples executables incrustats (editor + món + botó Run dins de cada pàgina).
- Barra lateral amb la llista de capítols sempre visible.
- Interfície extremadament minimalista: codi a l'esquerra, món a la dreta, un o dos botons (Run Program, Show Text Descriptions), i res més.

### Què volem imitar de Stanford

- **Netedat visual radical**: zero soroll, zero modals, zero menús desplegables, zero barres carregades. Només el codi, el món, i el mínim imprescindible de controls.
- **Estructura de curs en capítols**: una llista numerada de capítols, cadascun amb explicació breu + exemples executables + exercicis integrats.
- **Exemples executables dins de cada capítol**: l'alumne llegeix l'explicació i immediatament pot executar codi dins de la mateixa pàgina, sense sortir a un IDE separat.
- **Navegació lineal clara**: l'alumne sap on és, quants capítols hi ha, i com avançar.

### Què NO volem imitar de Stanford

- **La sintaxi Python**: Stanford usa sintaxi Python real (`def main():`, indentació significativa, `from karel.stanfordkarel import *`). Clean-karelcat usa sintaxi amb claus `{}` i parèntesis, més fàcil de parsejar i independent de qualsevol llenguatge real.
- **L'idioma únic**: Stanford només admet anglès. Clean-karelcat separa l'idioma del codi (ara anglès, escalable a català/castellà) de l'idioma de la interfície (ara català, escalable a altres).
- **La temàtica asèptica**: Stanford té un robot rectangular sobre fons blanc. Clean-karelcat té una medusa rosa en un fons marí amb roques i perles.

---

## 2. Què hem aconseguit fins ara

### 2.1 Arquitectura i18n de dos eixos ortogonals

El sistema de traduccions s'ha refactoritzat completament. Ara hi ha dos objectes independents:

- **`K.CODE_LANGS`** — vocabulari del llenguatge de programació. Ara conté una sola entrada (`en`). Afegir un nou idioma de codi (p.ex. `ca` amb `mentre`, `si`, `roca`) és purament additiu: s'afegeix una entrada i no es toca res més.
- **`K.UI_LANGS`** — textos de la interfície. Ara conté una sola entrada (`ca`). Afegir un nou idioma d'interfície (p.ex. `es`, `en`) és igualment additiu.

Les dues variables `K.state.codeLang` i `K.state.uiLang` controlen quin idioma s'usa a cada eix.

Configuració actual: **codi en anglès, interfície en català**.

### 2.2 Vocabulari del llenguatge (19 paraules, anglès, snake_case)

```
Estructurals (8):   if, else, while, repeat, proc, not, and, or
Ordres (6):         move, turn_left, turn_right, turn_around, grab, drop
Condicions (5):     rock_ahead, path_clear, pearl_here, bag_empty, bag_full
```

Decisions de disseny rellevants:
- **snake_case** triat per coherència amb Python (el llenguatge que l'alumne tocarà després de Karel).
- **`proc`** (no `def`) com a paraula clau per definir procediments. Més transparent per a un principiant.
- **`pearl_here`** (no `pearl_ahead`) perquè `grab` i `drop` operen sobre la casella actual de Karel, no la del davant. Coherent amb el Karel original de Rich Pattis (1972).
- **Sense condicions negades duplicades** (no hi ha `path_blocked`, `no_pearl_here`, etc.). L'alumne ha d'usar `not(...)` per negar.

### 2.3 Semàntica canònica restaurada

- `grab` i `drop` operen tots dos sobre la **casella actual** de Karel (restauració del disseny original de 1972). Abans, `grab` operava sobre la casella del davant i `drop` sobre l'actual — una inconsistència.
- `pearl_here` reflecteix aquesta semàntica amb el sufix `_here`.
- Les condicions de moviment (`rock_ahead`, `path_clear`) miren la casella del davant.

### 2.4 Nomenclatura coherent

Les paraules `wall` i `water` s'han eliminat **completament** del projecte (codi font, claus internes, missatges, noms de funcions). Totes les referències ara usen `rock` i `pearl`. Llista de substitucions fetes:
- `isWall()` → `isRock()`
- `K.isWall` → `K.isRock`
- `'wall-ahead'` → `'rock-ahead'`
- `'water-ahead'` → `'pearl-here'`
- `'no_water'` → `'no_pearl'`
- `errStop('wall')` → `errStop('rock')`
- `KAREL_ASSETS.CORALL` → `KAREL_ASSETS.ROCK`
- `KAREL_ASSETS.BOMBOLLA` → `KAREL_ASSETS.PEARL`

### 2.5 Interfície Stanford-like

- **Fila 1 (topbar)**: logo medusa + "Karel", badge d'estat (dot + text), motxilla, botó tema fosc/clar. Cap altre botó ni menú.
- **Fila 2 (toolbar)**: botó mutant Executa↔Atura + botó Reinicia + slider de velocitat. **Dos botons** en total (com Stanford).
- **Zona principal**: editor de codi (esquerra, 50%) + món de Karel (dreta, 50%). Proporció 1:1 com Stanford.
- **Log de missatges**: sota l'editor, es buida automàticament a cada execució.
- **Botó mutant**: un sol `<button>` que diu "▶ Executa" (verd) en repòs i "■ Atura" (vermell) durant l'execució. Controlat per `setStateUI()`.
- **Eliminats**: tots els modals, menú hamburguesa, dropdown de configuració, selectors d'idioma, botó de reptes, botó de referència, botó de missatges, botó de pas, panell d'ajuda, panell de pistes, onboarding, editor de mapes.

### 2.6 Assets visuals nous (pixel art SVG 16×16)

- **Medusa** (Karel): rosa amb tentacles. En mode clar, té un contorn lila d'1 píxel (`#6B0D4F`) generat algorítmicament (54 píxels de silueta). El contorn s'activa via CSS (`body.light .karel-outline { display: inline }`).
- **Roca** (obstacle): marró amb textura (esquerdes, ombres) i molsa verda a la base. Estil "ambientació il·luminada".
- **Perla** (objecte recollible): esfera nacrada gris-blavosa amb speckle blanc i gradació d'ombra. Estil coherent amb la roca.

### 2.7 Mode fosc/clar

- Botó amb icones SVG sol/lluna (Feather Icons) a dalt a la dreta del header.
- Preferència desada a `localStorage` (`'karel-theme'`).
- El CSS ja contenia regles `body.light` per a tot el layout; el patch simplement les reactiva.

### 2.8 Mètriques del projecte

```
Fitxers:        15 (README, index.html, style.css, 12 JS)
Línies de codi: ~1550 (JS + HTML, sense CSS)
CSS:            640 línies (net, sense zombie)
Mida total:     ~115 KB sense comprimir (~32 KB comprimit)
```

Comparat amb el karelcat original: **reducció del 55% en línies de codi** (de 3400+ a 1550). El CSS s'ha reduït un 55% addicional (de 1405 a 640 línies) amb la neteja de la fase C.

### 2.9 Fitxers del projecte i responsabilitats

```
index.html        — HTML minimalista (topbar + toolbar + editor + món)
style.css         — Estils (net; 640 línies útils, sense zombie)
js/constants.js   — Assets SVG, direccions, accions, velocitats, mapa i codi per defecte
js/i18n.js        — CODE_LANGS + UI_LANGS + funcions t()/tf()
js/state.js       — Estat centralitzat + K.lang (tokens del parser) + applyCodeLang()
js/tokenizer.js   — Funció pura: codi → tokens
js/parser.js      — Tokens → AST (recursive descent parser)
js/interpreter.js — AST → generador JS que yield accions una per una
js/execution.js   — Consumeix el generador, executa accions, gestiona run/stop/reset
js/world.js       — Gestió del món: CSV↔grid, helpers, avaluació de condicions
js/renderer.js    — Renderitzat diferencial del món al DOM (grid CSS)
js/editor.js      — Ressaltat sintàctic, numeració de línies, autocompletat
js/ui.js          — Log, badge d'estat, botó mutant, slider, toggle fosc/clar
js/main.js        — Inicialització: connecta tots els mòduls en seqüència
```

### 2.10 Contractes verificats

- **Contracte K.***: cada símbol `K.X` cridat des de qualsevol fitxer JS és definit en algun altre fitxer JS. Zero símbols orfes. Zero codi mort.
- **Contracte HTML↔JS**: cada ID que els scripts cerquen amb `getElementById` existeix a `index.html`.
- **Zero referències a paraules antigues**: `wall`, `water`, `isWall`, `CORALL`, `BOMBOLLA`, `K.I18N`, `currentCodeLang`, `currentUserLang`, `checkChallengeSuccess`, `hideHelp`, `applyBrushAt` — cap d'aquestes existeix en cap fitxer del projecte.

### 2.11 Neteja tècnica completada (Categoria C)

La **Categoria C** s'ha executat íntegrament. Detall de cada subtasca:

**C.1 — Neteja del CSS** (`style.css`): eliminades totes les regles per a elements que ja no existeixen al DOM. Blocs suprimits: selectors d'idioma (`.lang-group`, `.lang-btn`…), `toolbar-sep`, config dropdown, modals (`.modal-bg`, `.modal`, `.modal-hd`, `.modal-ft`, `.blank-form`…), reptes (`.ch-details`, `.ch-card`, `.ch-tag`…), goal modal, editor de mapes (`.edit-layout`, `.edit-tools`, `.brush-btn`, `.dir-btn`, `.rbtn`…), hamburger menu (`.topbar-hamburger`), sistema d'ajuda (`.help-btn`, `.help-postit`…), modal d'èxit (`.modal-success-inner`…), onboarding (`.onboard-body`, `.btn-onboard-skip`…), panell de referència (`#ref-panel`, `.ref-token`…), panell de pistes (`#btn-hint`, `.hint-panel`…), i totes les regles `body.light` associades a elements eliminats. Resultat: **de 1405 a 640 línies (−55%)**.

**C.2 — Neteja de `state.js`**: eliminades les propietats d'estat obsoletes `editMode`, `editBrush`, `editDragging`, `karelEditDir`, `currentChallengeId`, `hintLoadTime`, `hintLevel`, `hintCountdownId`, `currentCSV` i la constant `K.HINT_DELAY_MS`.

**C.3 — Neteja de `constants.js`**: eliminades la constant `LS_ONBOARD` (declaració i exportació `K.LS_ONBOARD`).

**C.4 — Estils inline del botó tema**: l'atribut `style="margin-left:auto; padding:5px 8px; line-height:1; flex-shrink:0;"` del `<button id="btn-theme">` s'ha mogut a una regla CSS dedicada `#btn-theme { … }` dins `style.css`.

---

## 3. Tasques pendents (categoritzades i numerades)

### Categoria A — Curs (capítols)

Hem dissenyat un curs de **10 capítols**. Cap d'ells s'ha escrit encara. Cada capítol serà una pàgina HTML independent amb: explicació breu, exemples executables (editor + món incrustats), i exercicis al final. La barra lateral del curs estarà sempre visible per a navegació.

| # | Títol | Conceptes nous | Notes |
|---|-------|---------------|-------|
| A.1 | Coneix en Karel | `move`, `turn_left`. Món, graella, direccions. | Primera impressió. L'alumne veu Karel moure's per primer cop. |
| A.2 | Agafa i deixa | `grab`, `drop`, motxilla, `pearl_here`. Errors. | Interacció amb el món. Descobrir que els errors existeixen. |
| A.3 | Repeteix | `repeat(N) { ... }`, claus `{}`, blocs. | Primer concepte de control de flux. |
| A.4 | Procediments | `proc nom { ... }`. Crear ordres noves. | Primer acte creatiu: l'alumne amplia el vocabulari del robot. |
| A.5 | Descomposició | Cap sintaxi nova. Mètode top-down. | Capítol de pensament, no de codi. |
| A.6 | Si | `if(cond) { ... }` / `else { ... }`. Condicions. | Karel pren decisions. Moment-bisagra. |
| A.7 | Mentre | `while(cond) { ... }`. Programes independents de la mida. Fencepost error. | Karel pot funcionar en mons de mides desconegudes. |
| A.8 | Combinant condicions | `not(...)`, `and`, `or`. | Capítol tècnic, opcional si l'alumne va curt de temps. |
| A.9 | Pensar com un programador | Comentaris `//`, noms clars, codi net. | Capítol d'ofici i bones pràctiques. |
| A.10 | Reptes | Col·lecció d'exercicis de dificultat creixent. | Aquí viuran els reptes + deep links per Classroom (`?repte=N`). |

**Cada capítol ha d'afegir les seves peces a `K.UI_LANGS.ca`** si necessita textos nous (enunciats, pistes, missatges específics del capítol).

**Format Stanford**: cada capítol és una pàgina HTML amb el simulador incrustat (el mateix motor JS), una barra lateral amb la llista de capítols, i un botó "Següent capítol" al final.

### Categoria B — Infraestructura dels capítols

| # | Tasca | Detall |
|---|-------|--------|
| B.1 | Pàgina índex del curs | Pàgina d'entrada amb la llista numerada de capítols, estil Stanford. |
| B.2 | Barra lateral de navegació | Present a totes les pàgines de capítol. Sempre visible (desktop) o hamburguesa (mòbil). |
| B.3 | Plantilla HTML de capítol | Esquelet reutilitzable: sidebar + contingut + exemples executables + exercicis. |
| B.4 | Simulador incrustat dins de capítols | Cada capítol pot tenir N instàncies del simulador (editor + món) amb mapes i codi predefinits. Cal decidir si són iframes, web components, o instàncies múltiples del motor al mateix DOM. |
| B.5 | Deep links per Classroom | Suport per URLs del tipus `?repte=N` que obren directament un exercici amb mapa, enunciat i codi inicial predefinits. |

### Categoria C — Neteja tècnica ✅ COMPLETADA

| # | Tasca | Detall |
|---|-------|--------|
| ~~C.1~~ | ~~Neteja del CSS~~ | ✅ `style.css`: de 1405 → 640 línies. Eliminats modals, hamburguesa, onboarding, editor de mapes, panell de pistes, panell de referència, selectors d'idioma i totes les regles `body.light` associades. |
| ~~C.2~~ | ~~Neteja de `state.js`~~ | ✅ Eliminades: `editMode`, `editBrush`, `editDragging`, `karelEditDir`, `currentChallengeId`, `hintLoadTime`, `hintLevel`, `hintCountdownId`, `currentCSV`, `K.HINT_DELAY_MS`. |
| ~~C.3~~ | ~~Neteja de `constants.js`~~ | ✅ Eliminades `LS_ONBOARD` i `K.LS_ONBOARD`. |
| ~~C.4~~ | ~~Moure el style inline del botó tema~~ | ✅ Estils moguts a regla `#btn-theme { … }` al CSS. |

### Categoria D — Millores visuals

| # | Tasca | Detall |
|---|-------|--------|
| D.1 | Verificar roques i perles en mode clar | Les roques (marró) i perles (nacrades) s'han dissenyat pensant en fons fosc. Comprovar que es veuen bé sobre fons blanc. |
| D.2 | Emoji de la motxilla | Ara la motxilla no té emoji al costat del número. Decidir si n'hi volem un (⚪ per perla?) o si queda millor sense. |
| D.3 | Responsive mòbil | Les mediaqueries existents (820px, 600px) estan pensades per al layout antic. Verificar que funcionen bé amb el layout nou (50/50, topbar simplificada). |
| D.4 | Favicon | Posar la medusa rosa com a favicon de la pàgina. |

### Categoria E — Funcionalitat futura

| # | Tasca | Detall |
|---|-------|--------|
| E.1 | Idioma de codi català | Afegir `K.CODE_LANGS.ca` amb `mentre`, `si`, `sinó`, `repeteix`, `procediment`, `no`, `i`, `o`, `avança`, `gira_esquerra`, `gira_dreta`, `gira_enrere`, `agafa`, `deixa`, `roca_davant`, `camí_lliure`, `perla_aquí`, `motxilla_buida`, `motxilla_plena`. |
| E.2 | Idioma de codi castellà | Afegir `K.CODE_LANGS.es` amb l'equivalent castellà. |
| E.3 | Idioma d'interfície anglès | Afegir `K.UI_LANGS.en` amb tots els textos d'interfície en anglès. |
| E.4 | Idioma d'interfície castellà | Afegir `K.UI_LANGS.es` amb tots els textos en castellà. |
| E.5 | Selector d'idioma | UI per triar codeLang i uiLang (dins de configuració o similar). Ara no hi ha cap control visible — els valors estan fixats a `state.js`. |
| E.6 | Editor de mapes | Recuperar la funcionalitat d'editor visual de mapes (eliminada a la neteja). Fer-la accessible des d'un capítol del curs o com a eina auxiliar. |
| E.7 | Carregar CSV des del disc o URL | Recuperar la funcionalitat de carregar mapes externs (`?mapa=CSV` a la URL o input file). |

### Ordre recomanat d'execució

1. ~~**C.1–C.4** (neteja tècnica)~~ — ✅ **COMPLETAT**.
2. **B.1–B.3** (infraestructura del curs) — sense contingut encara, però estableix l'esquelet.
3. **A.1–A.3** (primers capítols) — els tres primers capítols amb exemples i exercicis.
4. **D.1–D.3** (verificació visual) — un cop hi ha contingut real, polir la presentació.
5. **A.4–A.10** (resta de capítols) — la feina més gran en volum.
6. **B.4–B.5** (deep links i simulador incrustat) — quan els capítols existeixin.
7. **E.1–E.7** (expansió futura) — quan el curs estigui complet en la seva versió catalana/anglesa.

---

## 4. Principis de disseny a respectar

Qualsevol canvi futur ha de respectar aquests principis, que són el resultat de decisions deliberades:

1. **Netedat Stanford**: si dubtes entre afegir un element a la interfície o no, no l'afegis. Que el professor l'expliqui de viva veu o que el capítol del curs ho faci.
2. **Ortogonalitat d'idiomes**: codeLang i uiLang són independents. Mai barrejar tokens del llenguatge amb textos de la interfície al mateix objecte.
3. **Coherència terminològica**: roques i perles, no parets i aigua. Les paraules `wall` i `water` no han d'aparèixer mai al projecte.
4. **Semàntica canònica**: `grab` i `drop` operen sobre la casella actual. `pearl_here` reflecteix això.
5. **Escalabilitat additiva**: afegir un idioma, un capítol, un repte o un mode hauria de ser **additiu** (afegir codi) i mai **invasiu** (modificar codi existent).
6. **L'alumne és un adolescent català de 16 anys** que mai ha programat, dins d'una classe de 40 minuts amb el professor present. La pàgina és l'eina, no el mestre.
7. **El codi en anglès primer**: l'alumne aprèn `while`, `if`, `move` — les paraules que farà servir a la vida professional. Les explicacions li arriben en català.

---

## 5. Categoria B completada — Infraestructura del curs ✅

> Completada en la sessió del 6 d'abril de 2026.

### Fitxers nous i modificats

```
curs/index.html      — B.1: Pàgina índex del curs (llista de 10 capítols, estil Stanford)
curs/capitol.html    — B.3: Plantilla HTML de capítol (esquelet reutilitzable, comentat)
curs/capitols.js     — Dades dels 10 capítols + renderSidebar() + renderSimuladors() + toggle mòbil
curs/curs.css        — Estils per a totes les pàgines del curs (sidebar, layout, simulador incrustat)
js/reptes.js         — B.5: Definicions de 5 reptes predefinits + gestió de ?repte=N
js/main.js           — Modificat: gestió de paràmetres d'URL (embed, map, code, readonly, repte)
index.html           — Modificat: script inline de detecció d'embed + càrrega de reptes.js
style.css            — Modificat: regles CSS per a body.embed (mode incrustat)
```

### Detall de cada subtasca

**B.1 — Pàgina índex del curs** (`curs/index.html`):
Pàgina d'entrada generada dinàmicament per `capitols.js` a partir de `CAPITOLS_DATA`. Mostra la llista de 10 capítols numerats (estil Stanford): número, títol i subtítol. Els capítols sense arxiu creat es mostren en gris amb `pointer-events: none` (sistema DISPONIBLES). Inclou botó per obrir el simulador lliure.

**B.2 — Barra lateral de navegació** (`curs/curs.css` + `capitols.js`):
Present a totes les pàgines de capítol. Desktop: fixa a l'esquerra (240px), `position: sticky`, sempre visible. Mòbil (≤820px): `position: fixed`, oculta per defecte, s'obre amb el botó hamburguesa (`#sidebar-toggle`). Inclou overlay fosc (`#sidebar-overlay`) que tanca la sidebar en clicar fora. La funció `renderSidebar(currentNum)` llegeix `CURRENT_CAPITOL` de cada pàgina i marca el capítol actiu amb `border-left: 3px solid var(--accent-hi)`.

**B.3 — Plantilla HTML de capítol** (`curs/capitol.html`):
Esquelet reutilitzable completament comentat. Estructura: capçalera del curs → sidebar (B.2) → contingut → capçalera del capítol → seccions d'explicació → exemples executables (B.4) → exercici → navegació prev/next. Cada secció té instruccions en comentaris HTML per a l'autor del capítol. Per crear un capítol nou: copiar l'arxiu, canviar `CURRENT_CAPITOL`, omplir els blocs `[CAP-N: ...]`.

**B.4 — Simulador incrustat** (`curs/capitols.js` → `renderSimuladors()`):
Decisió d'implementació: **iframes** apuntant a `../index.html?embed=1&map=BASE64&code=BASE64`. Justificació: el motor JS usa el namespace global `K.*` i no és instanciable múltiples vegades al mateix DOM sense una refactorització invasiva; els iframes permeten N instàncies completament independents i aïllades sense tocar el motor.

Autoria: l'autor d'un capítol posa un `<div class="simulador">` amb atributs de dades:
- `data-map` — CSV del mapa (usa `\n` literal al valor HTML per a salts de línia)
- `data-code` — codi Karel inicial
- `data-readonly="true"` — fa el textarea de lectura (per a exemples no editables)
- `data-height` — alçada en px (per defecte 340)
- `data-label` — "Exemple" o "Exercici" (llegenda de color)
- `data-title` — llegenda sota el simulador

`renderSimuladors()` converteix cada div en un iframe codificant el mapa i el codi en base64 (`btoa(unescape(encodeURIComponent(str)))`).

A `index.html`, un script inline afegeix `body.embed` immediatament (evita flash). `style.css` oculta `.topbar` quan `body.embed` és present. El toolbar i el main s'ajusten automàticament (flexbox).

**B.5 — Deep links per Classroom** (`js/reptes.js` + `js/main.js`):
`K.REPTES` és un objecte indexat per ID (1–5 predefinits). Cada entrada té: `titol`, `enunciat`, `map` (CSV) i `code` (codi inicial).

URL de deep link: `index.html?repte=N`

Quan `main.js` detecta `?repte=N`:
1. Carrega el mapa i el codi del repte (no usa localStorage).
2. Mostra l'enunciat al log (via `K.log()`).
3. El simulador s'obre en mode complet (no embed), amb la topbar visible.

Reptes predefinits (escalables additivament afegint entrades a `K.REPTES`):
| ID | Títol | Concepte |
|----|-------|----------|
| 1 | Primers passos | move + grab bàsic |
| 2 | La perla al racó | move + turn_right |
| 3 | El passadís | move + grab repetit |
| 4 | Anar i tornar | grab + drop |
| 5 | El laberint | navegació amb roques |

### Ordre d'actualització recomanat ara

1. **A.1–A.3** (primers capítols) — copiar `capitol.html`, canviar `CURRENT_CAPITOL`, omplir contingut.
2. Afegir cada capítol nou al conjunt `DISPONIBLES` a `curs/index.html`.
3. **D.1–D.3** (verificació visual) — un cop hi ha capítols reals.
4. **A.4–A.10** (resta de capítols).
5. **B.4 addendum** — si en el futur es vol una instanciació múltiple al mateix DOM (sense iframes), caldria refactoritzar el motor per usar factories en lloc de `window.K`.
