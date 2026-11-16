# Step Quiz: Matemàtiques Interactives

Conjunt d'activitats interactives en format web per practicar operacions matemàtiques d'ESO i Batxillerat. Cada exercici inclou feedback pedagògic pas a pas i un sistema de puntuació per sessions.

**Totes les activitats acaben cada pregunta igual:** a sota de l'exercici surt una franja «Molt bé! +8 punts» (o «Intents esgotats · 0 punts», amb la solució a la vista) i el botó **«Següent»** («Veure resultats» a l'última). Mai no es passa de pregunta sol: l'alumne decideix quan ha entès la resolució (també amb la tecla Enter). **Cada pregunta val 10 punts i cada error en treu 2**, fins a 0, i la nota final és sobre 10. Estudi estadístic en treu 1 per cada casella errònia de les taules, i Vocabulari, quan s'esgoten els intents, dona 1 punt per etiqueta encertada (vegeu [CONTRIBUTING.md](CONTRIBUTING.md#final-de-cada-pregunta-i-punts)).

**Codi de verificació.** Tots els d'ESO i, de Batxillerat, el d'asímptotes donen, en acabar, un **codi de verificació** que l'alumne lliura al professor pel formulari. Les altres activitats de Batxillerat no en donen (derivades i integrals en van donar fins al 14/11/2026): no hi surt la icona «Codi» ni el botó «Copiar codi». A dalt a la dreta hi ha sempre la icona **«Codi»**: abans d'acabar, la finestra diu quantes preguntes falten (no dona cap codi a mitges); en acabar, mostra el codi en gran amb el botó «Copiar». El codi es genera un sol cop, en acabar, i la icona i el botó «Copiar codi» de la pantalla final mostren sempre el mateix. Amb sessions fixes (`?fixed=`) i en mode esvaïment no hi ha icona ni codi.

Web: https://step-quiz.net

## Com funciona?

No requereix instal·lació. Són arxius totalment estàtics, publicats a https://step-quiz.net.

> **Per provar-ho al teu ordinador** cal obrir-ho a través d'un petit servidor local: les activitats fan servir mòduls de JavaScript (`<script type="module">`) i el navegador no els carrega si obres l'arxiu amb doble clic (`file://…`). Des de la carpeta del repositori:
>
> ```
> node tools/servidor.js
> ```
>
> i obre http://localhost:8000 al navegador (atura el servidor amb `Ctrl+C`; si no tens Node, `python3 -m http.server 8000` fa el mateix). Al **Codespace** el servidor s'engega sol: surt un avís a baix a la dreta i només cal clicar **Open in Browser**.
>
> **Per fer i publicar canvis** (Codespace, missatges que expliquin cada canvi, desfer-ne un): [`COM-TREBALLAR.md`](COM-TREBALLAR.md).

1. Obre `index.html` al navegador — és el **generador d'enllaços** per al professorat.
2. Tria l'exercici i configura sessions, preguntes i intents.
3. Copia l'enllaç i comparteix-lo amb els alumnes.
4. En acabar, l'alumne obté un **codi de verificació** (format v2, 59–79 caràcters) amb nota, data i checksum antifrau. Les Competències Bàsiques (`step-quiz/cb`) en donen un de més complet, el **v3**, que a més diu quina convocatòria, dificultats i sentits s'havien triat i porta una empremta de les preguntes (vegeu [CONTRIBUTING.md](CONTRIBUTING.md)).
5. El professor carrega les respostes del formulari a `analitzador-stepquiz.html` per validar els codis i veure les notes. Si un alumne envia més d'un codi de la mateixa prova, la columna **Int.** de l'analitzador ho marca (`↻2/3` = 2n intent de 3, amb el canvi de nota) i el resum de Competències Bàsiques separa les proves de mida diferent i deixa triar quin intent compta (vegeu més avall).

## Exercicis disponibles

La columna **Codi** és el camp `EE` del codi de verificació. La taula completa és a [`js/exercise-codes.js`](js/exercise-codes.js).

### ESO

| Exercici | Codi | Fitxer | Dona codi |
|----------|------|--------|-----------|
| Vocabulari de geometria | VO | `vocabulari.html` | sí |
| Àrea i perímetre | AP | `area-perimetre.html` | sí |
| Nombres enters | EN | `enters.html` | sí |
| Ordenar nombres enters | EO | `enters-ordenar.html` | sí |
| Recta numèrica | RN | `recta-numerica.html` | sí |
| Potències | PT | `potencies.html` | sí |
| Prioritat d'operacions | PO | `prioritat.html` | sí |
| Descompondre en factors primers | FA | `factoritzar.html` | sí |
| MCD i MCM | MC | `mcd-mcm.html` | sí |
| Proporció directa | PR | `proporciodirecta.html` | sí |
| Fraccions | FR | `fraccions.html` | sí |
| Nombres decimals | DI | `decimals.html` | sí |
| Fracció, decimal i percentatge | FD | `fraccio-decimal-percentatge.html` | sí |
| Percentatges | PE | `percentatges.html` | sí |
| Llenguatge algebraic | LA | `llenguatge-algebraic.html` | sí |
| Expressions algebraiques | EA | `expressions-algebraiques.html` | sí |
| Identitats notables | IN | `identitats-notables.html` | sí |
| Equacions de 1r grau | EQ | `equacions.html` | sí |
| Gots i fitxes (equacions) | GC | `gots-fitxes.html` | sí |
| Sistemes d'equacions | SE | `sistemes-equacions.html` | sí |
| Equacions de 2n grau | SG | `equacions-segon-grau.html` | sí |
| Simplificació de radicals | RA | `radicals.html` | sí |
| Pla cartesià | PC | `pla-cartesia.html` | sí |
| La recta | RC | `recta.html` | sí |
| La paràbola | PA | `parabola.html` | sí |
| Gràfiques en context | GX | `grafiques-context.html` | sí |
| Estudi estadístic | ED | `estadistica.html` | sí |
| Mitjana aritmètica | MJ | `mitjana.html` | sí |
| Paràmetres estadístics | EI | `estadistica-inversa.html` | sí |
| Gràfics estadístics | GE | `grafics-estadistics.html` | sí |
| Probabilitat | PB | `probabilitat.html` | sí |
| Teorema de Pitàgores | TR | `triangle-rectangle.html` | sí |
| Trigonometria: valors exactes | RT | `raons-trigonometria.html` | sí |
| Teorema del sinus i del cosinus | TC | `teorema-sin-cos.html` | sí |

### Batxillerat

| Exercici | Codi | Fitxer | Dona codi |
|----------|------|--------|-----------|
| Equacions de rectes i plans | RP | `rectes-plans.html` | no |
| Esglaonar una matriu | EM | `esglaonar-matriu.html` | no |
| Inversa d'una matriu | IM | `inversa-matriu.html` | no |
| Ruffini (arrels enteres) | RU | `ruffini.html` | no |
| Nombres complexos | CX | `complexos.html` | no |
| Càlcul de derivades | DV | `derivades.html` | no |
| Càlcul d'integrals | IT | `integrals.html` | no |
| Gràfica i funció | GF | `grafica-i-funcio.html` | no |
| Asímptota i límit lateral | AS | `asimptotes.html` | sí |
| Comparar gràfiques de funció i de derivada | GD | `grafica-funcio-i-derivada.html` | no |
| Descripció d'una gràfica | — | `descripcio-grafica.html` | no |

De Batxillerat, només asímptotes dona codi (el genera pel seu compte, sense el motor comú). Les que mostren la pantalla final comuna porten `senseCodi: true` a `window.APP_CONFIG`, i `js/game-core.js` no hi posa la icona «Codi» ni el botó «Copiar codi» ni en genera cap (derivades i integrals en van donar fins al 14/11/2026). Els codis de les activitats que ara no en donen es mantenen reservats perquè l'analitzador pugui llegir codis antics.

### Altres pàgines

| Fitxer | Què és |
|---|---|
| `analitzador-stepquiz.html` | Analitzador dels codis de verificació (CSV del formulari) per al professorat. La lectura dels codis (tots els formats, de totes les èpoques) és a `js/analitzador-stepquiz/llegeix-codi.js`, i la dels intents repetits i de les proves de CB, a `js/analitzador-stepquiz/intents.js` (vegeu «Intents repetits i proves de CB a l'analitzador»). Totes dues són lògica pura, amb proves |
| `area-perimetre-tutorial.html` | Tutorial d'Àrea i perímetre (enllaçat des de l'índex) |
| `recta-numerica-tutorial.html` | Tutorial de lectura de gràfiques (l'obre el botó «Veure tutorial» de `recta-numerica.html`) |
| `setup_vocabulari.html` | Editor de coordenades de les figures de `vocabulari.html` (eina interna) |
| `pissarra-demo.html` | Demostració del motor de la **resolució pas a pas** animada (vegeu més avall): cinc exemples (prioritat d'operacions, una equació, una suma de fraccions, el teorema de Pitàgores, on les lletres i els catets volen del triangle a la fórmula, i una equació amb parèntesis amb el detall a demanda, on el 2 de fora vola als dos termes); cada pas s'escriu a sota de l'anterior |
| `resolucio.html` | La **resolució pas a pas** d'una activitat (`?activitat=equacions&nivell=2`): l'alumne mira com es resol un exercici, pas a pas, i pot demanar més detall d'un pas (vegeu més avall) |
| `s.html` | Fitxa adaptada de la unitat 1 (Nombres reals) |
| `arbre.html` | Arbres de factorització: l'alumne fa créixer l'arbre de factors primers d'un nombre. Pàgina autònoma, amb l'estil i el JS a dins; no fa servir el motor comú ni dona codi. L'índex l'enllaça al menú d'ESO («Arbres de factorització») amb l'enllaç net, sense sessions ni intents (`autonoma: true`) |

El 18/10/2026 es van retirar les pàgines que no enllaçava res (decaleg-pau, meteo, meteo_mobile i descripcio-grafica-inversa) i les còpies antigues d'altres projectes (cb.html, informe-cb.html, informe-cb-refactor.md i les carpetes cb, gem4eso i app, que avui són els repositoris step-quiz/cb, step-quiz/comp4eso i step-quiz/app). Són a l'historial de git si mai calen.

### Adaptades

Les versions adaptades per a l'aula d'acollida (alumnat que fa poc que és a Catalunya) són ara un projecte a part: https://a.step-quiz.net (repositori `step-quiz/a`). Les adreces antigues, de dins de step-quiz.net/a/, hi redirigeixen soles (`_redirects`). L'analitzador d'aquest projecte continua llegint els seus codis (`AE`, `AD`, `AN`, `AQ`, `AO`, `AR`).

## Arquitectura

El projecte segueix dues arquitectures segons l'antiguitat de l'exercici:

**Mòduls nous** (derivades, integrals, probabilitat, estadística, recta numèrica, asímptotes, prioritat…): cada exercici té la seva carpeta a `js/`.
```
js/derivades/
├── math-engine.js      ← Capa matemàtica pura (sense DOM)
├── strings.js          ← Textos de feedback i pistes
├── distractor-lib.js   ← Generador de distractors pedagògics
├── question-bank.js    ← Famílies de preguntes
├── derivades.js        ← Controlador DOM
└── run-tests.js        ← Tests (node js/derivades/run-tests.js)
```

**Fitxers compartits:**
```
js/
├── fixed-sessions.js   ← Sessions fixes (?fixed=A/B/C): tothom rep els mateixos exercicis
├── utils.js            ← Funcions pures: randInt, pick, shuffle, parseStrictInt, nivellProgressiu, triaProgressiva
├── config.js           ← Lectura de paràmetres URL
├── exercise-codes.js   ← Taula única de codis d'exercici (joc i analitzador)
├── punts.js            ← La regla única dels punts: 10 per pregunta, 2 menys per error (pur, amb proves)
├── seguent.js          ← La franja del final de pregunta amb el botó «Següent»
├── codi-finestra.js    ← La icona «Codi» i la finestra del codi; generaCodi() munta el codi v2
├── teclat.js           ← El teclat numèric propi dels aparells tàctils (un per a totes les activitats)
├── game-core.js        ← Motor de joc (sessions, puntuació, codi v2, teclat; acabaPregunta)
├── passos/             ← Joc de passos comú (joc-passos.js), correcció dels passos (correccio.js, pur), textos, figures de fraccions, quadrícula cartesiana i gràfic estadístic (figura-fraccio.js, quadricula.js, grafic-estadistic.js, grafica-context.js, purs)
├── algebra/            ← racionals.js i polinomis.js (purs): fraccions i decimals (amb període); monomis, polinomis i expressions (escriure, multiplicar, reduir)
└── pissarra/           ← «Resolució pas a pas»: la pissarra animada (vegeu més avall)
css/
├── tokens.css          ← Colors comuns amb significat: text, vores i els d'estat (encert, error, avís)
├── temes.css           ← Un color de tema per bloc de continguts (cada pàgina en tria un amb una classe)
├── shared.css          ← Estils globals, teclat numèric, pantalles finals
├── seguent.css         ← La franja del final de pregunta (també a les pàgines sense shared.css)
├── codi.css            ← La icona «Codi» i la seva finestra
├── teclat.css          ← El teclat numèric propi
├── passos.css          ← Estil del joc de passos comú (els colors, del tema de la pàgina: cap activitat del joc de passos no té CSS propi)
├── quadricula.css      ← La quadrícula comuna (La recta, La paràbola i «Mira-ho a la gràfica» de Sistemes)
├── grafic-estadistic.css ← Els gràfics comuns: l'estadístic (barres, sectors, histogrames, pictogrames) i la gràfica amb context
└── pissarra.css        ← Estil de la pissarra animada
vendor/                 ← Llibreries externes (KaTeX, SheetJS, ExcelJS), vegeu vendor/README.md
docs/historic/          ← Documents històrics (p. ex. el registre d'un pegat d'abril de 2026); no descriuen l'estat actual
docs/activitats/        ← L'estat del full de ruta d'activitats noves (STATE.md: el que hi ha fet i el que falta, amb les decisions del David)
```

**Mòduls antics** (fraccions, etc.): tot el joc en un sol fitxer, `js/<exercici>/<exercici>.js`. Equacions ja té la generació i els passos a `js/equacions/math-engine.js` i l'HTML dels termes a `js/equacions/renderer.js` (mòduls purs, amb proves a `tests/equacions.test.js`). Ja no queda JS d'exercici dins dels HTML (només `window.APP_CONFIG`).

Fraccions ja té, a part, el seu diagnòstic d'errors: `js/fraccions/errors-fraccions.js` (mòdul pur, sense DOM) mira si una resposta incorrecta encaixa amb un error típic (sumar els denominadors, amplificar només el denominador, multiplicar en creu…) i en torna el tipus i un missatge que orienta sense donar la resposta. El joc el mostra sota el pas i l'apunta a l'historial («Incorrecte (sumar els denominadors)»). Si la resposta no encaixa amb cap error conegut, el joc fa com sempre. Les proves són a `tests/modules.test.js`.

## Teclat numèric en tauletes i mòbils

En un aparell tàctil sense ratolí (tauleta, mòbil), les caselles de resposta no obren el teclat del sistema sinó un **teclat numèric propi**, centrat sota l'exercici (`js/teclat.js`, `css/teclat.css`). Qualsevol casella que l'alumne toqui passa a rebre'l, també la segona d'una pregunta. El tenen totes les activitats amb caselles numèriques, també les de Batxillerat (Complexos, Ruffini, Esglaonar, Inversa, Rectes i plans) i Estudi estadístic (amb la coma decimal). En un Chromebook amb teclat físic no surt.

## Colors

La paleta és sòbria perquè l'alumne es concentri en les matemàtiques:

- **Un color de tema per bloc de continguts**, el mateix a ESO i a Batxillerat: Nombres i operacions (blau acer), Àlgebra (indi), Geometria i mesura (petroli), Estadística i probabilitat (pruna) i Funcions i gràfiques (pissarra). Són a `css/temes.css`, i cada pàgina tria el seu amb una classe a `<html>` (`class="tema-algebra"`). El fons de la pàgina és fix (no canvia a cada pregunta).
- **Els colors d'estat només volen dir això:** verd = encert, vermell = error, ambre = avís o pista. Surten de `css/tokens.css` i cap tema no fa servir aquests tons, perquè un botó normal no es confongui amb una resposta correcta.
- La resta, grisos. Les excepcions són el dibuix que porta el color a la mateixa pregunta (les corbes blava i vermella de *Funció i derivada*, l'operació destacada en blau fosc de *Prioritat*, les barres de l'histograma).

`tests/check-repo.js` comprova que cada activitat té tema, que només `css/temes.css` el defineix i que ningú no escriu a mà un color d'estat.
**Joc de passos comú** (`js/passos/`): les activitats que es resolen escrivint en caselles, pas a pas, comparteixen el joc. Cada activitat només té tres mòduls purs i un controlador curt: `math-engine.js` genera la pregunta i en fa la llista de passos **com a dades** (plantilla de TeX i caselles, solució, línia resolta), `errors.js` diagnostica els errors típics i `strings.js` té els textos; el controlador crida `iniciaJocPassos({ element, generaPregunta, diagnostica, … })`. `js/passos/joc-passos.js` pinta la resolució i el pas que toca (caselles d'enters, fraccions, exponents i botons d'opció; el teclat numèric comú, `js/teclat.js`, hi serveix sense canvis), resta intents, mostra el diagnòstic i, si s'esgoten, la resolució completa; cada pregunta acaba amb la franja comuna i el botó «Següent» (`acabaPregunta()`, 10 punts menys 2 per error). Cada pàgina tria el tema del seu bloc (àlgebra, nombres o funcions) i no té CSS propi. `js/passos/correccio.js` (pur) corregeix qualsevol pas: un enter, un coeficient (en blanc val 0), un exponent (en blanc val 1), una fracció (una fracció correcta sense simplificar avisa però no resta cap intent), un decimal amb període, les parts pintades d'una figura, una targeta arrossegada, uns punts situats a la quadrícula o una opció, també dues solucions en qualsevol ordre i ternes proporcionals. Les activitats d'àlgebra escriuen i operen amb `js/algebra/polinomis.js` (pur).

**Equacions de 2n grau** (`equacions-segon-grau.html`): les completes es resolen sempre amb la fórmula (coeficients → discriminant → nombre de solucions → fórmula → solucions); les incompletes, aïllant x² o traient x factor comú; les «per ordenar» comencen passant-ho tot al primer membre (val qualsevol equació equivalent, i la resta de passos es fan amb la de l'alumne); les biquadrades, amb el canvi t = x². Només surten discriminants que són quadrats perfectes o negatius. `errors.js` diagnostica 35 errors típics (el quadrat d'un negatiu, sumar 4ac, oblidar la solució negativa, perdre x = 0…). Proves a `tests/equacions-segon-grau.test.js`.

**Expressions algebraiques** (`expressions-algebraiques.html`): reduir termes semblants, producte de monomis, treure parèntesis (també amb un menys o un monomi al davant) i producte de binomis, amb una lletra o amb dues (`?lletres=2`). La resposta s'escriu omplint el coeficient de cada terme possible (x², x i 1; amb dues lletres, x², xy, y², x, y i 1); al producte de monomis, el coeficient i els exponents. `errors.js` reconeix 11 errors típics tornant a desenvolupar l'expressió amb una regla equivocada (sumar coeficients, multiplicar exponents, x · x = 2x, el menys que només canvia el primer terme, oblidar els productes creuats…). Proves a `tests/expressions-algebraiques.test.js`.

**Identitats notables** (`identitats-notables.html`): desenvolupar (a ± b)² i (a + b)(a − b), i el sentit invers, factoritzar, on de vegades el polinomi s'hi assembla però no és cap identitat (x² + 4x + 16, x² + 6x − 9, x² + 25) i cal dir-ho. El primer pas sempre és triar la identitat; després es desenvolupa omplint els coeficients o s'omple la plantilla (·x − ·)² o (·x + ·)(·x − ·), que també accepta la resposta equivalent amb els dos signes canviats. Amb `?lletres=2`, b porta la y; amb `?fraccions=1`, a o b poden ser fraccions (x/2 + 3)². `errors.js` reconeix 19 errors típics: (a + b)² = a² + b², ab en lloc de 2ab, (2x)² = 2x², el signe de b², posar b² dins del parèntesi en lloc de b, la identitat equivocada… Proves a `tests/identitats-notables.test.js`.

**Fracció, decimal i percentatge** (`fraccio-decimal-percentatge.html`): el mateix nombre de quatre maneres (fracció irreductible, decimal, percentatge i dibuix); se'n dona una i cal trobar les altres. Dos nivells, com a vocabulari (`?modalitat=a|b`): **a**, arrossegar targetes (o tocar-ne una i després la casella), on les falses són errors típics (1/4 = 0,4, 4 % o 0,25 %; 0,4 = 1/4; el període tallat…); **b**, escriure la fracció, el decimal i el percentatge (amb una casella per al període) i pintar les parts del dibuix. Les dues modalitats comparteixen els 11 errors de `errors.js`. Nivells: fraccions de referència; decimals exactes, més del 100 % i menys de l'1 %; decimals periòdics (sovint es dona el decimal i cal la fracció generatriu). Les targetes, els decimals amb període i les figures per pintar són tipus de camp del joc de passos comú, a punt per a altres activitats. Proves a `tests/fraccio-decimal-percentatge.test.js`.

**Percentatges** (`percentatges.html`): problemes pas a pas, amb l'enunciat a dalt (botiga, classe, enquesta…): el tant per cent d'una quantitat (abans, el percentatge en decimal o, a 1r, en fracció); augments i rebaixes amb l'índex de variació (× 1,21, × 0,7); els inversos (la quantitat d'abans, dividint per l'índex, i quin tant per cent representa una part); i dos canvis seguits (es multipliquen els índexs). `?tipus=` en tria un; sense tipus, van segons el nivell. Cada pas porta els valors que donen els errors típics, i `errors.js` (17 errors) en diu el perquè: 5 % = 0,5, l'índex sense l'1, desfer una rebaixa del 20 % amb un augment del 20 %, sumar percentatges encadenats… El diagnòstic per valors equivocats (`errorPerDistractors`) és del joc de passos comú, i també el fa servir «Fracció, decimal i percentatge». Proves a `tests/percentatges.test.js`.

**La recta** (`recta.html`): pendent, ordenada a l'origen i y = mx + n, amb la **quadrícula comuna** (`js/passos/quadricula.js`: eixos, rectes, punts i el triangle del pendent). Quatre tipus (`?tipus=`, o tots un rere l'altre): llegir n i m a la gràfica (avanço 1, pujo m); dibuixar la recta d'una equació (taula de dos punts i situar-los tocant la quadrícula: amb dos punts ja es veu la recta, i qualsevol parell de punts de la recta és correcte); recta per dos punts; i classificar (proporcional, afí o constant; creixent o decreixent). Nivells: pendent enter, de denominador 2, de denominador 3. 14 errors típics: el pendent girat (Δx/Δy), el signe del pendent, n com a tall amb l'eix X, les coordenades girades… Dona codi de verificació. Les seccions 3a i 3b de `pla-cartesia` es queden com eren. Proves a `tests/recta.test.js`.

**La paràbola** (`parabola.html`): dues direccions (`?tipus=dibuixar|llegir`, o primer l'una i després l'altra). De l'expressió a la gràfica: cap on obre, el vèrtex (x_v = −b/2a), el tall amb l'eix Y, els talls amb l'eix X amb els passos d'«Equacions de 2n grau» (discriminant, quantes solucions, quines; diagnosticats amb el seu `errors.js`) i situar els punts notables a la quadrícula, on amb tres punts ja es veu la paràbola. De la gràfica a l'expressió: llegir els talls, trobar a amb el tall amb l'eix Y i desenvolupar a(x − x₁)(x − x₂). Nivells: a = ±1 i dos talls; a = ±2 i talls dobles; també sense talls (discriminant negatiu, i cal no posar-hi punts a l'eix X). 12 errors propis: el signe del vèrtex, prendre c pel vèrtex (o al revés), dividir per a en lloc de 2a, el signe de a… Proves a `tests/parabola.test.js`.

**Sistemes d'equacions: «Mira-ho a la gràfica»** (`sistemes-equacions.html`): en acabar cada sistema (resolt o amb la solució donada), el botó **«Mira-ho a la gràfica»** obre la quadrícula comuna amb les dues rectes, (1a) i (2a), i el punt on es tallen, amb el text que lliga totes dues coses: la solució és el punt que és de les dues rectes, i són els dos nombres alhora. No canvia les preguntes, els punts ni el codi (`js/sistemes-equacions/grafica.js`, `css/quadricula.css`).

**Gràfics estadístics** (`grafics-estadistics.html`): llegir **diagrames de barres, de sectors, pictogrames, histogrames i polígons de freqüències** amb el **gràfic estadístic comú** (`js/passos/grafic-estadistic.js`, pur, i `css/grafic-estadistic.css`). Les dades numèriques surten de les mateixes distribucions realistes d'`estadistica` (`js/estadistica/question-bank.js`, ajuntant-ne mostres) i les categòriques (esport, transport, fruita…), de l'activitat; els valors es poden llegir exactament i l'escala no va d'1 en 1. Nivell 1: llegir un valor, quants més, el total, el percentatge que falta en un diagrama de sectors. Nivell 2: percentatges, moda i mediana a partir del gràfic, «quina afirmació és certa?», dels graus al percentatge, intervals («menys de», interval modal, marca de classe). Nivell 3: també **gràfics que enganyen** (eix vertical tallat, escala irregular, pictograma que creix en àrea). Les respostes s'escriuen (amb coma decimal) o es trien; cada error típic té el seu diagnòstic (comptar ratlles sense mirar l'escala, sumar en lloc de restar, donar la freqüència quan es demana el valor, el sector més gran no és majoria…). Opcions a l'índex: quins gràfics (tots, 1r–2n, 3r–4t o un sol tipus), quines preguntes (segons el nivell, llegir el gràfic, percentatges i paràmetres, «quina afirmació és certa?» o gràfics que enganyen) i quantes opcions de resposta (3, 4 o 5). Té codi de verificació (`GE`).

**Gràfiques en context** (`grafiques-context.html`): gràfiques que expliquen una història, amb la **gràfica amb context comuna** (`js/passos/grafica-context.js`, pura: trams rectes, corbes que acceleren o frenen i corbes suaus, amb els eixos graduats i les unitats). **De segments**: una excursió (distància a casa), un dipòsit (litres) i la bateria del mòbil (%); **corbes**: la temperatura d'un dia i corbes que van cada vegada més de pressa o més a poc a poc (una planta, un cotxe que arrenca, una pedra que cau, un globus que es desinfla). Preguntes: llegir un valor i quan val un valor (f(a) i f(x) = b), màxim i mínim (el valor i quan), quanta estona no canvia, on creix i on decreix, en quin tram va més de pressa, la velocitat d'un tram, com canvia una corba, domini i recorregut, «quina afirmació és certa?» i, al revés, **quina gràfica correspon a un relat** (les opcions són gràfiques). Cada error típic té el seu diagnòstic: llegir la gràfica com un dibuix del camí, donar el valor màxim quan es demana l'instant, prendre un tram horitzontal per «torna enrere», confondre més llarg o més amunt amb més ràpid… Opcions a l'índex: quines gràfiques (segments, corbes o totes), quines preguntes (segons el nivell, llegir, descriure o relat) i quantes opcions de resposta (3, 4 o 5). Té codi de verificació (`GX`).

## Intents repetits i proves de CB a l'analitzador

Un alumne pot fer la mateixa prova més d'un cop i enviar cada codi pel formulari. L'analitzador (`analitzador-stepquiz.html`, amb la lògica pura a `js/analitzador-stepquiz/intents.js`) ho tracta així:

- **Què és «la mateixa prova».** Mateix alumne (correu), exercici, camp `D`, camp `S` i nombre de preguntes `QQ`. Els intents es numeren per l'hora del **codi**, no per la de l'enviament. La columna **Int.** de la taula mostra `↻2/3` (2n intent de 3) i el canvi de nota respecte de l'intent anterior.
- **Mateix codi dos cops.** No és cap intent nou: surt com `= 1` i el resum CB l'ignora.
- **Resum CB per proves.** El codi només porta la **posició** de cada pregunta (1a, 2a, 3a…), no quina pregunta del banc és. Per no barrejar la «pregunta 1» d'una prova de 4 preguntes amb la d'una de 8, el resum separa les proves per curs, mode i nombre de preguntes i, als codis v3, també per convocatòria, dificultats, sentits i empremta de les preguntes. L'Excel porta un full per prova. El títol de cada prova diu què s'havia triat: «Prova de 4 preguntes · 4t ESO · Pràctica · Dificultat 1».
- **Quin intent compta.** Dalt del resum CB, un selector tria si a les estadístiques compta l'últim intent de cada alumne (per defecte), el primer, el millor o tots. Els intents que no compten surten esvaïts a la matriu.
- **Codis v3.** Porten la convocatòria, les dificultats, els sentits i una empremta de les preguntes, i tot això compta per saber si dues proves són la mateixa. Quatre preguntes de dificultat 1 i quatre de dificultat 2 són proves diferents, i també ho són dues proves amb els mateixos filtres però preguntes diferents (triades a mà o amb un banc que ha canviat). A la columna «Dif.» es veuen les dificultats triades.
- **Limitació dels codis v2 (anteriors).** No diuen la dificultat triada: dues proves amb el mateix nombre de preguntes (p. ex. 4 de dificultat 1 i 4 de dificultat 2) no es poden distingir i surten com a intents d'una mateixa prova.
- **Columna «Dif.» a CB.** Als codis de CB el camp `D` és el curs (1 = 2n ESO, 2 = 4t ESO), no la dificultat; als codis v2 la columna surt buida i als v3 mostra les dificultats triades.

## Paràmetres URL

| Paràmetre | Valors | Per defecte | Descripció |
|-----------|--------|-------------|------------|
| `totalsessions` | 1-5 | Definit per cada joc | Nombre de sessions |
| `totaloperations` | 1-10 | Definit per cada joc | Preguntes per sessió |
| `maxintents` | 1-10 | Definit per cada joc | Intents per pregunta |
| `maxenllocmitjana` | 0-1 | Definit per cada joc | 0=nota mitjana, 1=nota màxima |
| `nivell` | 1-3 | 0 | Dificultat (jocs amb nivells) |
| `fixed` | A, B, C | — | Sessió fixa: tots els alumnes reben els mateixos exercicis (sense codi) |
| `families` | ids separats per `,` | totes | Famílies actives (derivades, integrals) |
| `tipus` | `calcat`, `germans`, `nota`, `son`, `minuts`, `alcada`, `pes`, `pulsacions` | aleatori | Tipus de dades (estadística) |
| `tipus` | `incompletes`, `completes`, `ordenar`, `biquadrades` | totes menys les biquadrades | Tipus d'equacions (equacions de 2n grau) |
| `tipus` | `reduir`, `monomis`, `distributiva`, `binomis` | totes, una rere l'altra | Tipus d'expressions (expressions algebraiques) |
| `lletres` | `2` | una (x) | Dues lletres, x i y (expressions algebraiques, identitats notables) |
| `tipus` | `desenvolupar`, `factoritzar` | primer desenvolupar i després factoritzar | Tipus d'exercici (identitats notables) |
| `tipus` | `calcul`, `variacio`, `invers`, `encadenats` | segons el nivell | Tipus de problema (percentatges) |
| `tipus` | `llegir`, `dibuixar`, `dos-punts`, `classificar` | tots, un rere l'altre | Tipus de pregunta (la recta) |
| `tipus` | `dibuixar`, `llegir` | primer dibuixar i després llegir | Sentit (la paràbola) |
| `fraccions` | `1` | només enters | Coeficients fraccionaris (identitats notables) |
| `modalitat` | `a`, `b` | `a` | Fàcil (arrossegar targetes) o difícil (escriure i pintar) (fracció, decimal i percentatge) |
| `dim`, `modalitat` | 2/3 · a/b | — | Dimensió i nivell (vocabulari) |
| `modalitat` | `passos` | resultat final | Prioritat d'operacions: «Pas a pas» (l'alumne resol l'expressió operació a operació). Amb `esvaiment=1` sempre és «Pas a pas» |
| `esvaiment` | `1` | desactivat | Mode «Esvaïment»: exemples resolts que es van esvaint (vegeu més avall). Ara, només a `prioritat` |
| `inici` | 0-9 | 0 | Amb `esvaiment=1`: quants passos fa l'alumne al primer exercici (0 = l'exemple sencer) |
| `pissarra` | `1` | — | Ja no fa res: la «Resolució pas a pas» és a `resolucio.html?activitat=…` (vegeu més avall), i una activitat amb aquest paràmetre és la de sempre |
| `debug` | 1 | desactivat | Mode de depuració (només `inversa-matriu` i `vocabulari`) |

Els màxims de sessions i preguntes (5 × 10) són els que pot representar el codi de verificació.

Exemple: `derivades.html?totalsessions=2&totaloperations=8&families=chain-exp-int,power`

### Opcions pròpies de cada activitat al generador d'enllaços

Cada activitat es declara **un sol cop** a `index.html`, a `ACTIVITIES_ESO` o a `ACTIVITIES_BATX`. Els paràmetres que només té una activitat (com `dim` i `modalitat` de `vocabulari`) es declaren a la taula `OPCIONS_ACTIVITAT` del mateix fitxer: el panell crea una fila per a cada opció i, si el valor triat no és buit, afegeix el paràmetre a l'enllaç. No cal escriure cap fila a mà.

Una activitat amb `autonoma: true` (ara, `arbre.html`) no fa servir el motor comú: l'enllaç és només la pàgina, i les files de sessions, preguntes, errors i criteri s'amaguen.

`tests/check-repo.js` comprova que cap activitat surt repetida a les llistes, que cada opció de la taula la llegeix la seva pàgina i que les pàgines autònomes no depenen de `js/game-core.js`.

## Resolució pas a pas (pissarra animada)

A l'estil de Graspable Math: la resolució d'un exercici es veu en una **pissarra** on els símbols es mouen d'una línia a la següent, es fusionen en el resultat (`4 · 2` vola i es converteix en `8`) o desapareixen, i cada pas porta una frase que diu què es fa i per què. És el mateix motor dels procediments animats del web de la PAU (`step-quiz/pau`).

- **Dos escenaris independents.** A l'activitat de sempre, l'alumne **fa** l'exercici (no hi ha cap pissarra). A la **resolució pas a pas** (`resolucio.html`), l'alumne **mira** com es resol un exercici, sense fer-lo: ell només marca el ritme amb els botons (pas següent, pas anterior, torna a començar, reprodueix) o amb les fletxes del teclat. **Tots els passos intermedis queden escrits**, un a sota de l'altre, com a la pissarra de classe. Si toca la pissarra (o prem l'espai) mentre un pas s'anima, el pas queda escrit de cop, i el ↺ del costat de «Pas 3 de 5» el torna a animar.
- **Mode professor** (per al projector): el botó «Mode professor» de `resolucio.html` (o `?professor=1` a l'adreça) posa la pissarra a pantalla completa i amb la lletra grossa, i amaga les frases (el professor ho explica de paraula). Els passos es passen amb les fletxes, l'espai o un comandament de presentacions (Re Pàg / Av Pàg). Esc surt de la pantalla completa; «Surt del mode professor», del mode.
- **Vull més detall.** Si un pas no l'entén, l'alumne prem «Vull més detall», al costat de la frase del pas: la línia del pas baixa i es queda en gris com a objectiu, s'obre un calaix gris a sobre i, a cada «Pas següent», s'hi escriu un subpas amb la seva frase. Per exemple, a la distributiva surt (−3)·x + (−3)·(−6) i després «Fes la multiplicació»; per passar un nombre a l'altre membre, «Resta 4 als dos membres», «4 − 4 = 0» i «Sumar 0 no canvia res»; per aïllar la x, «Divideix els dos membres per 3». «Menys detall» el torna a plegar.
- **Enllaços entre els dos escenaris.** A l'activitat, «Mira com es resol una equació com aquesta ↗» obre en una pestanya nova la resolució d'una equació semblant del mateix nivell (no la que s'està fent). A la resolució, «Ara fes-ho tu» porta a l'activitat amb el mateix nivell. També s'hi pot triar el nivell i demanar «Un altre exercici».
- **Al generador d'enllaços** (`index.html`) hi ha el botó **«Activar la resolució pas a pas»**. Normalment està desactivat i tot funciona com sempre. Si es clica, la pàgina passa del blau al lila, els menús d'ESO i de Batxillerat només ofereixen les activitats que tenen la resolució pas a pas, desapareixen totes les opcions i l'enllaç és `resolucio.html?activitat=…`. Si un menú encara no en té cap, diu «Encara no n'hi ha cap».
- **Activitats que la tenen ara:** **Equacions de 1r grau** (`resolucio.html?activitat=equacions&nivell=1`, 2 o 3) i **Fraccions** (`resolucio.html?activitat=fraccions&nivell=1` a 4: mateix denominador, un denominador múltiple de l'altre, denominadors diferents, producte i divisió). A fraccions, la resolució és una cadena d'igualtats (comú denominador, operar, simplificar), i es pot demanar més detall del comú denominador (el mcm pels múltiples del denominador més gran i cada fracció ampliada en una línia), de la simplificació (el mcd i les dues divisions) i de la divisió (girar la segona fracció). Des de l'activitat de fraccions, «Mira com es resol una operació com aquesta» obre el nivell que s'hi ha triat. I **Prioritat d'operacions** (`resolucio.html?activitat=prioritat&nivell=1` a 5: productes i sumes, d'esquerra a dreta, potències, parèntesis, tot combinat): la taula centrada de l'activitat, una operació per pas amb una frase que diu per què toca, i «Vull més detall» destaca l'operació que toca i explica l'ordre de les operacions abans de calcular-la. El pla és a [`docs/pissarra/STATE.md`](docs/pissarra/STATE.md). La resolució pas a pas no canvia res de les activitats: ni les preguntes, ni la nota, ni el codi de verificació.
- Si l'ordinador té activat «reduir el moviment», els símbols no volen: la línia nova apareix fonent-se al seu lloc.
- **Per veure el motor amb altres exemples:** `pissarra-demo.html` (cinc exemples; a l'equació amb parèntesis, alguns passos tenen «Vull més detall»).

El motor és a `js/pissarra/` (estil a `css/pissarra.css`), explicat a [`docs/pissarra/MOTOR.md`](docs/pissarra/MOTOR.md). Les proves comproven, entre altres coses, que **cada línia que es veu a la pissarra és certa** (`tests/pissarra.test.js`, i per a cada activitat la bateria comuna `tests/pissarra-activitat.js`).

## Mode «Esvaïment» (exemples resolts que es van esvaint)

Amb `?esvaiment=1`, l'alumne comença mirant un exercici **resolt**: els passos apareixen d'un en un quan toca «Següent pas», cadascun amb una línia que diu per què es fa. Després ve un exercici del mateix tipus amb **l'últim pas** per fer, després amb els dos últims… fins que el fa **tot sol**.

- **Puja** un pas quan fa 2 exercicis seguits sense cap error. **Baixa** un pas a cada error (mai per sota de l'exemple sencer).
- Si s'equivoca en un pas, es mostra el pas bo (la línia queda marcada «amb ajuda») i continua quan toca «Continua». No hi ha intents ni punts.
- En acabar, una estrella per exercici fet sense errors i fins on ha arribat. **No dona codi de verificació** (com les sessions fixes).
- `inici=N` fa començar l'alumne fent els N últims passos. Es pot combinar amb `fixed=A/B/C`.
- Al generador d'enllaços és la fila «Esvaïment». Ara l'admet `prioritat` (sempre en «Pas a pas»); `equacions` i `fraccions` vindran després.

El motor és a [`js/esvaiment.js`](js/esvaiment.js) i les proves a `tests/esvaiment.test.js`. Està basat en la recerca sobre exemples resolts amb esvaïment cap enrere (Renkl, Atkinson i col·laboradors, 2002–2003).

## Tests

```
node tests/run-all.js
```

Les proves al navegador (`tests/navegador/prova-pissarra.js`, la pissarra, i `tests/navegador/prova-activitats.js`, que juga les activitats i prova el teclat en una tauleta) només s'executen si l'ordinador té Playwright; si no, s'ometen. GitHub els executa automàticament a cada pujada a `main` i a cada pull request. Vegeu [CONTRIBUTING.md](CONTRIBUTING.md#tests).

## Tecnologies

- HTML5 / CSS3 purs (sense frameworks)
- Vanilla JavaScript (ES6)
- KaTeX (copiat a `vendor/`) per a les fórmules
- Cap backend: tot s'executa al navegador

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) per a convencions de codi, arquitectura i instruccions per afegir nous exercicis.

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
