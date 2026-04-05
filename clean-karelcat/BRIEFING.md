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
Mida total:     ~115 KB sense comprimir (~32 KB comprimit)
```

Comparat amb el karelcat original: **reducció del 55% en línies de codi** (de 3400+ a 1550).

### 2.9 Fitxers del projecte i responsabilitats

```
index.html        — HTML minimalista (topbar + toolbar + editor + món)
style.css         — Estils (inclou ~50% de codi zombie de la versió anterior; pendent de neteja)
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

### Categoria C — Neteja tècnica

| # | Tasca | Detall |
|---|-------|--------|
| C.1 | Neteja del CSS | El `style.css` (50 KB) conté ~50% de regles per a elements eliminats (modals, hamburguesa, onboarding, editor de mapes, panell de pistes, panell de referència, selectors d'idioma, etc.). Cal eliminar les regles que no s'apliquen a cap element existent. |
| C.2 | Neteja de `state.js` | Conté propietats d'estat obsoletes: `editMode`, `editBrush`, `editDragging`, `karelEditDir`, `currentChallengeId`, `hintLoadTime`, `hintLevel`, `hintCountdownId`, `currentCSV`. Treure-les. |
| C.3 | Neteja de `constants.js` | `LS_ONBOARD` ja no s'usa (l'onboarding s'ha eliminat). `K.HINT_DELAY_MS` a `state.js` tampoc. Treure. |
| C.4 | Moure el style inline del botó tema | `<button id="btn-theme" style="margin-left:auto; ...">` té estils inline. Moure a una classe CSS dedicada. |

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

1. **C.1–C.4** (neteja tècnica) — ràpid i sense risc, deixa el projecte impecable.
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
