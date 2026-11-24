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
| Canvi d'unitats | CU | `canvi-unitats.html` | sí |
| Àrees i volums | AV | `arees-volums.html` | sí |
| Cilindres amb un full | CF | `cilindres.html` | sí |
| Llenguatge algebraic | LA | `llenguatge-algebraic.html` | sí |
| Expressions algebraiques | EA | `expressions-algebraiques.html` | sí |
| Identitats notables | IN | `identitats-notables.html` | sí |
| Equacions de 1r grau | EQ | `equacions.html` | sí |
| Fórmules STEAM | — | `formules-steam.html` | sí |
| Inequacions | IQ | `inequacions.html` | sí |
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
| Estudi d'una funció | EF | `estudi-funcio.html` | no |
| Distribució binomial | BI | `binomial.html` | no |
| Logaritmes i equacions | LG | `logaritmes.html` | no |

De Batxillerat, només asímptotes dona codi (el genera pel seu compte, sense el motor comú). Les que mostren la pantalla final comuna porten `senseCodi: true` a `window.APP_CONFIG`, i `js/game-core.js` no hi posa la icona «Codi» ni el botó «Copiar codi» ni en genera cap (derivades i integrals en van donar fins al 14/11/2026). Els codis de les activitats que ara no en donen es mantenen reservats perquè l'analitzador pugui llegir codis antics.

### Altres pàgines

| Fitxer | Què és |
|---|---|
| `analitzador-stepquiz.html` | Analitzador dels codis de verificació (CSV del formulari) per al professorat. La lectura dels codis (tots els formats, de totes les èpoques) és a `js/analitzador-stepquiz/llegeix-codi.js`, i la dels intents repetits i de les proves de CB, a `js/analitzador-stepquiz/intents.js` (vegeu «Intents repetits i proves de CB a l'analitzador»). Totes dues són lògica pura, amb proves |
| `area-perimetre-tutorial.html` | Tutorial d'Àrea i perímetre (enllaçat des de l'índex) |
| `recta-numerica-tutorial.html` | Tutorial de lectura de gràfiques (l'obre el botó «Veure tutorial» de `recta-numerica.html`) |
| `setup_vocabulari.html` | Editor de coordenades de les figures de `vocabulari.html` (eina interna) |
| `pissarra-demo.html` | Demostració del motor de la **resolució pas a pas** animada (vegeu més avall): cinc exemples (prioritat d'operacions, una equació, una suma de fraccions, el teorema de Pitàgores, on les lletres i els catets volen del triangle a la fórmula, i una equació amb parèntesis amb el detall a demanda, on el 2 de fora vola als dos termes); cada pas s'escriu a sota de l'anterior |
| `resolucio.html` | La **resolució pas a pas**. Sense paràmetres és el **portal** (una targeta per activitat; l'obre el botó «Resolució pas a pas» de l'índex); amb `?activitat=equacions&nivell=2`, la resolució d'una activitat: l'alumne mira com es resol un exercici, pas a pas, i pot demanar més detall d'un pas (vegeu més avall) |
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
├── passos/             ← Joc de passos comú (joc-passos.js), correcció dels passos (correccio.js, pur), textos, figures de fraccions, quadrícula cartesiana, gràfic estadístic, escala de les unitats i figures de mesura (figura-fraccio.js, quadricula.js, grafic-estadistic.js, grafica-context.js, escala-unitats.js, figures-mesura.js, purs)
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
├── escala-unitats.css  ← L'escala de les unitats comuna (Canvi d'unitats)
├── figures-mesura.css  ← Les figures de mesura comunes (Àrees i volums)
├── pissarra.css        ← Estil de la pissarra animada (el motor)
├── pissarra-figures.css ← Les figures i taules d'activitats concretes dins de la pissarra (recta, cilindres, taula de prioritat)
├── resolucio.css       ← La pàgina resolucio.html: el portal i cada resolució
└── peu.css             ← El peu flotant (autor, institut i llicències) d'index.html i resolucio.html
vendor/                 ← Llibreries externes (KaTeX, SheetJS, ExcelJS), vegeu vendor/README.md
docs/historic/          ← Documents històrics (p. ex. el registre d'un pegat d'abril de 2026); no descriuen l'estat actual
docs/activitats/        ← L'estat del full de ruta d'activitats noves (STATE.md: el que hi ha fet i el que falta, amb les decisions del David)
```

**Mòduls antics** (fraccions, etc.): tot el joc en un sol fitxer, `js/<exercici>/<exercici>.js`. Equacions ja té la generació i els passos a `js/equacions/math-engine.js` i l'HTML dels termes a `js/equacions/renderer.js` (mòduls purs, amb proves a `tests/equacions.test.js`). Ja no queda JS d'exercici dins dels HTML (només `window.APP_CONFIG`).

Fraccions ja té, a part, el seu diagnòstic d'errors: `js/fraccions/errors-fraccions.js` (mòdul pur, sense DOM) mira si una resposta incorrecta encaixa amb un error típic (sumar els denominadors, amplificar només el denominador, multiplicar en creu…) i en torna el tipus i un missatge que orienta sense donar la resposta. El joc el mostra sota el pas i l'apunta a l'historial («Incorrecte (sumar els denominadors)»). Si la resposta no encaixa amb cap error conegut, el joc fa com sempre. Les proves són a `tests/modules.test.js`.

## Teclat numèric en tauletes i mòbils

En un aparell tàctil sense ratolí (tauleta, mòbil), les caselles de resposta no obren el teclat del sistema sinó un **teclat numèric propi**, centrat sota l'exercici (`js/teclat.js`, `css/teclat.css`). Qualsevol casella que l'alumne toqui passa a rebre'l, també la segona d'una pregunta. El tenen totes les activitats amb caselles numèriques, també les de Batxillerat (Complexos, Ruffini, Esglaonar, Inversa, Rectes i plans) i Estudi estadístic (amb la coma decimal). Si l'activitat necessita el signe menys i també decimals (Potències), la tecla − fa de coma a les caselles de decimals (`data-coma="true"`). En un Chromebook amb teclat físic no surt.

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

**Fórmules STEAM** (`formules-steam.html`): aïllar una lletra en fórmules que surten quan estudiem el món que ens envolta (densitat, velocitat, forces, pressió, energies, potència, calor, llei d'Ohm, palanca, politges, engranatges, rendiment…). Cada exercici té dues targetes: el problema (el context amb les dades en negreta i la pregunta a part) i la fórmula (amb una llegenda: lletra, magnitud i unitat). Sempre primer amb nombres: dir a quina lletra va cada dada (arrossegant les lletres), substituir les dades, aïllar pas a pas (a cada pas, triar quina operació es fa als dos membres i com queda; girar la igualtat és un pas automàtic), calcular el valor i triar-ne la unitat operant amb les unitats (km : km/h = h); després, si l'alumne ho vol («Vols saber com es resol la fórmula en general, és a dir, amb lletres?»), les mateixes operacions amb lletres (els passos amb nombres es pleguen en una franja que es pot desplegar). Punts: els nombres valen 8 menys 2 per error i les lletres, 2 més sense cap error (1 amb un error). Les opcions i les consignes porten les fórmules ben escrites (KaTeX), i el que passa a l'altre membre es veu en color a les dues últimes línies. La lletra al denominador sempre en dos passos; a l'arrel, la positiva. Quatre nivells al llarg de la sessió (`?nivell=1-4` en fixa un): un pas, dos passos, lletra al denominador, quadrats i arrels (i les fórmules llargues). Cada opció dolenta surt d'un error típic (restar en lloc de dividir, el quocient girat, el denominador que puja al mateix membre, el signe en passar, l'arrel d'una part…), amb el seu missatge. Sense codi de verificació (decisió del David). Un petit motor d'àlgebra propi (`js/formules-steam/algebra.js`: llegeix, escriu, substitueix, aïlla i fabrica les respostes equivocades); amb nombres, els factors queden en el mateix ordre que amb lletres (80000 · 0,02 com p · S), i una dada que val 2 no es dibuixa com a «½». Té **resolució pas a pas** (`resolucio.html?activitat=formules-steam`, `js/formules-steam/resolucio.js`; vegeu més avall) i l'enllaç «Mira com es resol una fórmula com aquesta». Proves a `tests/formules-steam.test.js`.

**Inequacions** (`inequacions.html`, codi IQ): inequacions de primer grau, sense interseccions d'intervals ni casos especials (decisions del David del 17/11/2026). A cada pas l'alumne escriu els nombres a les caselles i hi posa el signe (<, >, ≤, ≥) arrossegant-lo; si no el gira en dividir per un negatiu, el missatge ho explica. Si la x queda a la dreta (4 > x), la inequació es gira sola i es veu escrit (x < 4). La solució es dona de tres maneres: la inequació, la **recta numèrica** (tocar el nombre, triar si hi entra —punt ple o buit— i el costat; peça comuna `js/passos/recta-intervals.js`) i l'**interval** amb peces, amb la notació (2, 5). Quatre nivells al llarg de la sessió (`?nivell=1-4` en fixa un): coeficient positiu, coeficient negatiu, parèntesis i x als dos membres, denominadors; als nivells 3 i 4, una de cada tres solucions és una fracció. Errors típics reconeguts: el signe sense girar (o girat sense motiu), < per ≤, el signe en passar un terme, multiplicar o restar en lloc de dividir, el quocient girat, la distributiva a mitges, el mcm sense dividir, el punt ple per buit, el costat, el claudàtor a l'infinit… Les de primer grau tenen **resolució pas a pas** (`resolucio.html?activitat=inequacions`, `js/inequacions/resolucio.js`; vegeu més avall) i l'enllaç «Mira com es resol una inequació com aquesta». Proves a `tests/inequacions.test.js`.

**Inequacions de 2n grau i racionals** (a `inequacions.html`, codi IQ; lliurament 22c, decisions del David del 21/11/2026, artefacte de revisió del 22). Opció de l'índex `?tipus=`: `no-lineals` (progressiu), `segon-grau`, `racionals` o `especials`; sense, les de primer grau de sempre. Passos: (1) si cal, passar-ho tot a l'esquerra (4 opcions: x² ≤ 9 → x² − 9 ≤ 0; x² > 3x → x² − 3x > 0; (x + 3)/(x − 1) < 2 → (−x + 5)/(x − 1) < 0); (2) els zeros (les dues solucions en qualsevol ordre; a les racionals, el del numerador i el del denominador; als casos especials, 4 opcions); (3) la **taula de signes** del 19 (`js/passos/taula-signes.js`): un punt de prova enter a cada interval i el signe tocant la cel·la, 0 o ∄ a cada punt; (4) la **recta** del 17 amb trams (`js/passos/recta-intervals.js`, camp `trams`): tocar els trams i els punts que hi entren (punt ple), o «Cap solució»; (5) l'interval (4 opcions; ℝ, ∅, {a} o unions). Nivells: 1, de 2n grau (x² + bx + c ⊙ 0, x² ⊙ k², x² ⊙ ax); 2, racionals ((x − a)/(x − b) ⊙ 0 i (x + p)/(x − q) ⊙ k); 3, casos especials (x² + k, que no s'anul·la mai, i (x − a)² desenvolupat: ℝ, ∅, {a} o ℝ − {a}). Errors reconeguts: x² > 4 → x > 2, dividir per x, multiplicar pel denominador, restar sense el denominador, incloure un zero del denominador (a la taula, a la recta i a l'interval), punt ple o buit equivocat, els signes contraris, el punt de prova fora de l'interval, l'arrel d'un negatiu, la solució doble. Proves a `tests/inequacions-no-lineals.test.js` i `tests/navegador/prova-inequacions-no-lineals.js`.

**Estudi d'una funció** (`estudi-funcio.html`, Batxillerat, sense codi; EF reservat): l'estudi analític d'una funció polinòmica o racional, pas a pas, amb el joc de passos. A les racionals, primer on no existeix f; després f′ (4 opcions, les falses amb els errors típics: sense multiplicar per l'exponent, el quocient amb +, el denominador sense el quadrat, u′/v′…), els seus zeros (4 opcions: el signe, els zeros de f, un punt fora del domini com a zero, «cap»…), la **taula de signes** interactiva (peça comuna `js/passos/taula-signes.js`: a cada interval l'alumne escriu un punt de prova enter i toca el signe; a cada punt, 0 o ∄), la fila de f (↗/↘ i màxim, mínim, cap o ∄), la y dels extrems i quina de 3 gràfiques és la de f (esbós comú `js/passos/esbos-funcio.js`, portat del DEMO «Gràfica d'una funció» de step-quiz/pau). La concavitat és opcional: f″, zeros, taula (∪/∩ i inflexions) i la gràfica amb extrems i inflexions; els punts es reparteixen 8 + 2. Opció de l'índex `?funcions=`: totes (meitat i meitat), `polinomiques`, `racionals` o `pau` (els 6 exercicis del DEMO de pau, en ordre). Funcions a l'atzar de 8 famílies, amb els punts de cada taula prou separats perquè sempre hi hagi un punt de prova enter. Errors reconeguts a les taules: punt de prova fora de l'interval, 0 en un punt fora del domini, els signes de f en lloc dels de f′, fletxa contrària al signe, extrem sense canvi de signe (x⁴ − 4x³ a x = 0), màxim i mínim intercanviats, concavitat al revés; i la y calculada amb f′. Decisions del David del 21/11/2026 (artefacte de revisió). Proves a `tests/estudi-funcio.test.js` i `tests/navegador/prova-estudi-funcio.js`.

**Logaritmes i equacions** (`logaritmes.html`, Batxillerat, sense codi; LG reservat). Lliuraments 22a (bloc 1, logaritmes) i 22b (bloc 2, equacions); el bloc 3, les inequacions de 2n grau i racionals, és a `inequacions.html` (22c). Bloc 1, joc de passos: logₐ x per la definició (primer l'argument com a potència de la base, després el logaritme; exponents naturals, negatius i fraccionaris, també ln), la forma exponencial ↔ logarítmica, desenvolupar i agrupar amb les propietats (4 opcions), calcular amb propietats (log₂ 24 − log₂ 3 = log₂ 8 = 3) i la calculadora (el signe abans de calcular, i el valor amb 4 decimals). Sense canvi de base. Nivells amb `?tipus=`: `definicio`, `calcul`, `propietats`; sense, progressiu. Errors reconeguts: log(a + b) = log a + log b, log(a·b) = log a · log b, log aⁿ = (log a)ⁿ, log(a/b) = log a / log b, el signe i l'invers de l'exponent, log₂ 8 = 8 : 2, ln en lloc de log. Bloc 2, **equacions** (`?tipus=equacions`, progressiu; `basiques`, `mitjanes`, `irracionals`; el subtítol canvia): nivell 1, exponencials amb la mateixa base (4^{x+1} = 8 → 2^{2x+2} = 2³, 4 opcions, i la x) i logarítmiques senzilles (log₂(2x − 1) = 3 → 2x − 1 = 8, la x i comprovar-la); nivell 2, canvi de variable (4ˣ − 6·2ˣ + 8 = 0: l'equació en t, 4 opcions; t₁ i t₂; desfer el canvi, 4 opcions, i t ≤ 0 no dona x), propietats dels logaritmes (log₂ x + log₂(x − 2) = 3 → x(x − 2) = 8, les dues solucions i comprovar-les: una és falsa) i aˣ = N prenent logaritmes, amb calculadora (3ˣ = 7, 4 decimals); nivell 3, irracionals (√(px + q) = x + c: elevar al quadrat, 4 opcions; les dues solucions; comprovar-les, sovint una és falsa). La comprovació és obligatòria només a les logarítmiques i a les irracionals (3 opcions: «Sí», o el motiu pel qual no ho és); de l'equació de segon grau només es demanen les solucions, en qualsevol ordre. Errors reconeguts: igualar exponents sense la mateixa base, la potència d'una potència, quedar-se una solució falsa, descartar-ne una de bona, t ≤ 0 al canvi de variable, log A + log B = log(A + B), (x + c)² = x² + c², logₐ A = m ⟹ A = m·a, x = log N − log a. Decisions del David del 21/11/2026 (artefacte de revisió). Proves a `tests/logaritmes.test.js`, `tests/logaritmes-equacions.test.js`, `tests/navegador/prova-logaritmes.js` i `tests/navegador/prova-logaritmes-equacions.js`.

**Nombres complexos: forma polar, potències i arrels** (`complexos.html`, pestanyes «Forma polar» i «Potències i arrels», abans «Potència — aviat»): pràctica lliure com les altres pestanyes (comptador d'errors, sense sessions ni codi), pas a pas. «Forma polar»: binòmica → polar (tocar el quadrant al pla, el mòdul i l'argument), polar → binòmica, producte i quocient en polar; «Potències i arrels»: De Moivre (el nombre en polar, (rⁿ)_{nθ} i, al nivell 1, el resultat en binòmica) i arrels n-èsimes (ⁿ√r, θ/n i les altres arrels tocant-les a la circumferència: es dibuixa el polígon regular). Cada pestanya té «Tot barrejat». Graus entre 0° i 360°, notació r_θ. Nivell 1 exacte (angles de 30° i 45°; mòduls i parts com a c√s, en dues caselles; √8 en lloc de 2√2 és un avís); nivell 2 amb calculadora (2 decimals, signe amb un botó). El pla complex a tots els apartats (`js/complexos/pla-complex.js`). Errors reconeguts: arctan sense el quadrant, argument sense reduir, mòdul sense l'arrel, sin/cos intercanviats, signe, arguments multiplicats o dividits, resta a l'inrevés, De Moivre (mòdul per n, argument sense multiplicar), arrels (mòdul sense l'arrel, sumar 360° abans de dividir, en falten o mal repartides). L'índex pot obrir una pestanya (`?pestanya=polar` o `potencies`). Decisions del David del 21/11/2026 (artefacte de revisió). Proves a `tests/complexos-polar.test.js` i `tests/navegador/prova-complexos-polar.js`.

**Distribució binomial** (`binomial.html`, Batxillerat, sense codi; BI reservat): problemes amb context (peces defectuoses, tirs lliures, llavors, una vacuna, un test contestat a l'atzar, un dau, una moneda), resolts pas a pas amb el joc de passos: n, p i q (la p donada en tant per u, en tant per cent o com a «1 de cada 5»); la pregunta com a P(X ≥ 2), P(X < 3)… (4 opcions); el camí, directe o pel contrari (4 opcions; si la ruta llarga també és curta, també val i els passos es refan); cada cas amb C(n, k) en una casella i P(X = k) amb 4 decimals; i la resposta, en tant per u o en tant per cent segons l'enunciat. n de 2 a 6. Sense mitjana ni desviació i sense la normal. Tolerància: ±0,0001 a cada cas i ±0,0002 a la resposta (±0,02 punts en %), per si l'alumne suma valors arrodonits; el joc de passos admet ara `pas.tolerancia` als camps decimals. Nivells amb l'opció `?tipus=`: `exacte` (P(X = k)), `directe` (pocs casos), `contrari` (cal el contrari); sense, progressiu. Errors reconeguts: n confós amb k, el % sense passar a tant per u, q = p, «almenys» com a «més de» (i els altres), el contrari mal fet, oblidar el cas 0, sense C(n, k), exponents intercanviats, sense qⁿ⁻ᵏ, oblidar el 1 −, no passar a %. Decisions del David del 21/11/2026 (artefacte de revisió). Proves a `tests/binomial.test.js` i `tests/navegador/prova-binomial.js`.

**Potències** (`potencies.html`): cinc reptes, que l'alumne tria al menú de la pàgina: propietats, base negativa, notació científica i, des del lliurament 15 del full de ruta, **exponent zero i negatiu** (7⁰ = 1; 2⁻³ = 1/2³ = 1/8, primer triant com s'escriu amb exponent positiu, on les trampes són −2³ i 2 · (−3), i després escrivint la fracció; les propietats amb exponents negatius, a³ : a⁵ = a⁻², 2⁻³ · 2⁵ = 2², (3⁻²)³ = 3⁻⁶; i la base fraccionària, (2/3)⁻² = (3/2)² = 9/4) i **operacions en notació científica** (només × i :: les mantisses, els exponents i, si cal, ajustar la mantissa perquè quedi entre 1 i 10). La matemàtica dels reptes 4 i 5 és a `js/potencies/reptes-nous.js` (pura, amb la correcció i els missatges dels errors típics). Proves a `tests/potencies.test.js`.

**Canvi d'unitats** (`canvi-unitats.html`): passar d'una unitat a una altra amb **l'escala de les unitats** (`js/passos/escala-unitats.js`): els graons d'una magnitud, de la unitat més gran a la més petita, amb la unitat de partida i la d'arribada marcades i la regla del graó a sota. Cada canvi té tres passos: quants graons hi ha i cap on (s'escull), multiplicar o dividir i per quant (s'escull: × 1000, : 100…) i el resultat (amb coma decimal). Nivells: 1 longitud, massa i capacitat (cada graó × 10); 2 superfície (× 100) i volum (× 1000); 3 volum ↔ capacitat (abans, a quina unitat de volum equival: 1 dm³ = 1 l) i de tot. `?magnitud=` en tria una. Només l'escala: ni temps ni unitats compostes (decisió del David). Cada opció dolenta i cada valor equivocat porten el seu error, i `errors.js` (6 errors) en diu el perquè: el sentit girat, un graó de més (comptar unitats en lloc de salts), × 10 per graó a les unitats de superfície o volum, la coma desplaçada, l'equivalència entre volum i capacitat.

**Àrees i volums** (`arees-volums.html`): l'àrea de figures planes i compostes, i l'àrea total i el volum de cossos, pas a pas, amb **les figures de mesura comunes** (`js/passos/figures-mesura.js`): cada segment amb mesura porta una lletra («a = 12 cm»), les altures són discontínues i amb l'angle recte, i els cossos es dibuixen en perspectiva. Figures planes: triar la fórmula, triar la lletra de la base i la de l'altura (el costat inclinat és la trampa; al rombe, les diagonals; al trapezi, les dues bases), el radi a partir del diàmetre, calcular l'àrea i triar la unitat (cm, cm² o cm³). Figures compostes (casa, rectangle amb un forat, porta, forma de L): sumar o restar, l'àrea de cada part, el total i la unitat. Cossos (ortoedre, cilindre, piràmide, con, esfera): l'altura (a la piràmide i al con), l'àrea de la base, la lateral, la total, el volum i la unitat del volum. π ≈ 3,14 i els resultats amb els decimals exactes; les mesures són enteres (els costats inclinats surten de ternes pitagòriques). Nivells: 1 triangle, paral·lelogram i rombe; 2 trapezi, cercle i figures compostes; 3 cossos. `?dim=2` deixa només les figures planes (3: compostes) i `?dim=3` només els cossos (1 ortoedre i cilindre, 2 piràmide i con, 3 tots amb l'esfera). Cada opció dolenta i cada valor equivocat porten el seu error, i `errors.js` (24 errors) en diu el perquè: el costat inclinat com a altura, oblidar el «: 2», radi i diàmetre, àrea i perímetre, la unitat, oblidar les bases o el «: 3», l'apotema com a altura… Proves a `tests/arees-volums.test.js`.

**Cilindres amb un full** (`cilindres.html`, codi CF, 2n d'ESO): un full rectangular s'enrotlla de dues maneres i fa dos cilindres sense tapes (decisions del David del 23/11/2026). El costat que fa la volta és la **longitud de la circumferència** de la base (2πr = costat), no el diàmetre. Per a cada cilindre: en què es converteix un costat (quatre opcions: circumferència, diàmetre, radi o altura), el radi, l'àrea de la base i el volum, escrits amb 2 decimals i la calculadora; després, quin té més volum i la capacitat de cadascun en mL (el volum es diu en cm³ i la capacitat en mL; 1 cm³ correspon a 1 mL). La primera pregunta és el full DIN A4 de debò (21 × 29,7) i les altres, altres rectangles (`?nivell=1` sempre l'A4, `?nivell=2` altres). **Correcció amb arrossegament**: cada pas es corregeix amb el resultat que l'alumne ha donat al pas anterior (l'àrea amb el seu radi, el volum amb la seva àrea), amb el marge d'arrodonir a 2 decimals i de fer servir π ≈ 3,14, perquè l'error d'arrodonir no s'acumuli (arrodonint, fins a un 0,32 % al volum; truncant, fins a un 1,04 %). Errors reconeguts: el diàmetre o el radi per la circumferència, r = costat / π, 2πr² o 2πr per a l'àrea del cercle, oblidar el quadrat o la π, l'altura equivocada, litres en lloc de mL… Té **resolució pas a pas** (`resolucio.html?activitat=cilindres`, `js/cilindres/resolucio.js`; vegeu més avall) i l'enllaç «Mira com es resol un full com aquest». Proves a `tests/cilindres.test.js`.

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
| `tipus` | `immediates`, `quasi` | totes (meitat i meitat) | Integrals: només immediates (∫xⁿ, ∫axⁿ, ∫e^{kx}) o només quasi-immediates (∫f′·fⁿ, ∫f′/f, ∫f′·e^f, ∫f′·cos f, ∫f′·sin f) |
| `constant` | `exacta`, `ajust` | progressiu (1a meitat `exacta`, 2a `ajust`) | Integrals quasi-immediates: nivell 1, l'integrand porta f′ sencera (∫2x(x²+1)³dx); nivell 2, f′ llevat d'una constant (∫x·e^{x²}dx = ½e^{x²}) |
| `funcions` | `polinomiques`, `racionals`, `pau` | totes (meitat i meitat) | Estudi d'una funció: només polinòmiques, només racionals o els 6 exercicis de PAU del DEMO de pau, en ordre |
| `tipus` | `exacte`, `directe`, `contrari` | progressiu (nivells 1, 2 i 3) | Distribució binomial: només P(X = k), desigualtats amb pocs casos o problemes que es fan pel contrari |
| `pestanya` | `polar`, `potencies` | la primera (Suma / resta) | Nombres complexos: obre directament «Forma polar» o «Potències i arrels» |
| `tipus` | `definicio`, `calcul`, `propietats` | progressiu (nivells 1, 2 i 3) | Logaritmes: només la definició, els exponents negatius i fraccionaris amb calcular i calculadora, o les propietats |
| `fraccions` | `1` | només enters | Coeficients fraccionaris (identitats notables) |
| `modalitat` | `a`, `b` | `a` | Fàcil (arrossegar targetes) o difícil (escriure i pintar) (fracció, decimal i percentatge) |
| `dim`, `modalitat` | 2/3 · a/b | — | Dimensió i nivell (vocabulari) |
| `modalitat` | `passos` | resultat final | Prioritat d'operacions: «Pas a pas» (l'alumne resol l'expressió operació a operació). Amb `esvaiment=1` sempre és «Pas a pas» |
| `nombres` | `enters` | naturals | Prioritat d'operacions amb enters: sumes i restes amb parèntesis (5 − (−3), −(4 − 7)), la regla dels signes i les potències de base negativa ((−2)³, −2² i (−2)²), en 3 nivells al llarg de la sessió. Totes les modalitats; els errors dels signes tenen el seu missatge, amb l'operació de l'exercici, i la seva marca |
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
- **El portal** (`resolucio.html`, sense paràmetres; el David, 24/11/2026): l'obre el botó lila **«Resolució pas a pas»** de l'índex, en una pestanya nova. Una targeta per activitat, agrupades per bloc (Nombres i operacions, Àlgebra, Geometria i mesura) amb el color de cada bloc: el nom, una fórmula d'exemple dibuixada amb KaTeX, una frase del que s'hi veu, els nivells (cada xip hi porta directament) i el botó **«Copia l'enllaç»**, perquè el professor el passi als alumnes. Es dibuixa a partir de `js/resolucio/activitats.js`, l'única llista de les activitats que tenen resolució.
- **La pàgina d'una resolució** (`resolucio.html?activitat=…`; el David, 24/11/2026, a partir de les DEMO de la PAU): tota la pàgina porta el color del bloc de l'activitat (un sol color d'accent). La capçalera: «← Resolucions» (torna al portal), el nom de l'activitat, «Ara fes-ho tu» destacat i «Projectar»; al mòbil, en una sola línia, sense «Projectar». És una pàgina d'una pantalla: la pissarra ocupa tota l'alçada que queda (i té la seva barra si el que hi ha escrit no hi cap), de manera que **els botons no es mouen mai d'un pas a l'altre**. A l'ordinador (1000 px d'amplada o més), dues columnes: a l'esquerra, el pas que es veu («Pas 2 de 5», què es fa i «Vull més detall»), els botons de reproduir (la velocitat, 0,6× · 1× · 1,6×, a la dreta) i, a sota, el nivell i «Un altre exercici»; a la dreta, la pissarra. Al mòbil i a la tauleta, tot en una columna: el nivell, el pas, la pissarra i els botons. El **nivell es tria amb un desplegable** (número i nom; també amb el teclat) i **«Un altre exercici»** és un botó d'acció, ple, al seu costat. A les finestres baixes (menys de 750 px), la lletra de la pissarra és una mica més petita. Cada calaix de detall obert porta el botó «▴ Plega», que el plega des de qualsevol pas (et quedes al mateix pas, i el detall queda plegat fins que el tornis a demanar). A baix, el mateix **peu flotant** que a l'índex (`css/peu.css`), sempre a la vista.
- **Projectar** (per al projector): el botó «Projectar» de `resolucio.html` (o `?professor=1` a l'adreça) posa la pissarra a pantalla completa, a tota l'amplada i l'alçada i amb la lletra grossa, i amaga el títol, el nivell, les frases i el peu (el professor ho explica de paraula). Els passos es passen amb les fletxes, l'espai o un comandament de presentacions (Re Pàg / Av Pàg). Esc surt de la pantalla completa; «Deixa de projectar», del mode.
- **Vull més detall.** Si un pas no l'entén, l'alumne prem «Vull més detall», al costat de la frase del pas: la línia del pas baixa i es queda en gris com a objectiu, s'obre un calaix gris a sobre i, a cada «Pas següent», s'hi escriu un subpas amb la seva frase. Per exemple, a la distributiva surt (−3)·x + (−3)·(−6) i després «Fes la multiplicació»; per passar un nombre a l'altre membre, «Resta 4 als dos membres», «4 − 4 = 0» i «Sumar 0 no canvia res»; per aïllar la x, «Divideix els dos membres per 3». «Menys detall» el torna a plegar.
- **Enllaços entre els dos escenaris.** A l'activitat, «Mira com es resol una equació com aquesta ↗» obre en una pestanya nova la resolució d'una equació semblant del mateix nivell (no la que s'està fent). A la resolució, «Ara fes-ho tu» porta a l'activitat amb el mateix nivell. També s'hi pot triar el nivell i demanar «Un altre exercici».
- **Al generador d'enllaços** (`index.html`) hi ha el botó lila **«Resolució pas a pas»**, que obre el portal (`resolucio.html`) en una pestanya nova. L'índex no en sap res més: no filtra cap menú ni canvia cap enllaç (fins al 24/11/2026 hi havia un interruptor «Activar la resolució pas a pas»).
- **Activitats que la tenen ara:** **Equacions de 1r grau** (`resolucio.html?activitat=equacions&nivell=1`, 2 o 3: la x en un costat, la x als dos costats, amb parèntesis) i **Fraccions** (`resolucio.html?activitat=fraccions&nivell=1` a 4: mateix denominador, un denominador múltiple de l'altre, denominadors diferents, producte i divisió). A fraccions, la resolució és una cadena d'igualtats (comú denominador, operar, simplificar), i es pot demanar més detall del comú denominador (el mcm pels múltiples del denominador més gran i cada fracció ampliada en una línia), de la simplificació (el mcd i les dues divisions) i de la divisió (girar la segona fracció). Des de l'activitat de fraccions, «Mira com es resol una operació com aquesta» obre el nivell que s'hi ha triat. I **Prioritat d'operacions** (`resolucio.html?activitat=prioritat&nivell=1` a 5: productes i sumes, d'esquerra a dreta, potències, parèntesis, tot combinat; i 6 a 8, amb enters: sumes i restes, regla dels signes, potències i tot, on treure el parèntesi de −(−3) és un pas més i «Ara fes-ho tu» porta a `prioritat.html?nombres=enters`): la taula centrada de l'activitat, una operació per pas amb una frase que diu per què toca, i «Vull més detall» destaca l'operació que toca i explica l'ordre de les operacions abans de calcular-la. I **Fórmules STEAM** (`resolucio.html?activitat=formules-steam&nivell=1` a 4: un pas, dos passos o més, la lletra al denominador, quadrats i fórmules llargues): la frase del primer pas és el problema (sempre amb context); primer amb nombres (cada lletra baixa i es torna la seva dada; una línia per operació, la mateixa als dos membres, amb el que passa a l'altre membre volant; girar la igualtat és un pas a part; els nombres es fusionen en el valor; la unitat, operant amb les unitats com si fossin lletres; el resultat amb la unitat, ressaltat) i després les mateixes operacions amb lletres, fins a la fórmula de la lletra aïllada. Des de l'activitat, «Mira com es resol una fórmula com aquesta» obre el nivell de la fórmula que toca. «Vull més detall» (des del 22/11/2026) a cada operació d'aïllar, també amb lletres: l'operació escrita als dos membres (80 · Δt = (240/Δt) · Δt), el que se simplifica ratllat i la línia del pas; a l'arrel, √(v²) = √(…); i, quan el valor té més d'una operació, una operació per subpas en l'ordre de la calculadora. Sense detall: la fórmula, les dades, girar la igualtat, la unitat, la meitat (½ ·) i les operacions que mouen més de 3 peces. I **Inequacions de primer grau** (`resolucio.html?activitat=inequacions&nivell=1` a 4: coeficient positiu, coeficient negatiu, parèntesis, denominadors; des del 23/11/2026): les mateixes frases, el mateix ordre i el mateix detall que les equacions (en fa servir el motor), amb el signe de desigualtat al lloc de l'«=»; en dividir per un negatiu, la frase diu «el signe de desigualtat canvia» i el signe baixa volant, canvia i queda ressaltat; si la x és a la dreta s'hi queda, com a l'activitat, i al final «4 > x» s'escriu «x < 4» en un pas propi; al nivell 4, el primer pas treu els denominadors (amb detall); al final, la solució dibuixada a la recta (el nombre hi baixa volant) i l'interval, ressaltat. Des de l'activitat, «Mira com es resol una inequació com aquesta» obre el mateix nivell. I **Cilindres amb un full** (`resolucio.html?activitat=cilindres&nivell=1`, el full A4, o 2, altres fulls; des del 24/11/2026): la figura del full i dels dos cilindres; al nivell 1, que és un full DIN A4; per a cada cilindre, el plegat (el costat que fa la volta vola del full a la fórmula: 2πr = 21), el radi (amb «Vull més detall»: dividir els dos membres entre 2π i simplificar), l'àrea de la base, l'altura (h = 30, també des del full, just abans del volum) i el volum, amb 2 decimals com a l'activitat; al cilindre 1, abans, les fórmules generals A = πr² i V = A · h (al 2 ja no); després, quin té més volum, la capacitat de cadascun en litres (1,04098 L i 1,47609 L al full A4) i quantes vegades hi cap (1,42: un 42 % més). Correccions del David del 24/11/2026; l'activitat continua demanant la capacitat en mL. Des de l'activitat, «Mira com es resol un full com aquest» obre el mateix nivell. El pla és a [`docs/pissarra/STATE.md`](docs/pissarra/STATE.md). La resolució pas a pas no canvia res de les activitats: ni les preguntes, ni la nota, ni el codi de verificació.
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
