# Step Quiz: Matemàtiques Interactives

Conjunt d'activitats interactives en format web per practicar operacions matemàtiques d'ESO i Batxillerat. Cada exercici inclou feedback pedagògic pas a pas i un sistema de puntuació per sessions. Tots els d'ESO (menys el pla cartesià) i els de derivades i integrals donen, en acabar, un **codi de verificació** que l'alumne lliura al professor.

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
| Llenguatge algebraic | LA | `llenguatge-algebraic.html` | sí |
| Equacions de 1r grau | EQ | `equacions.html` | sí |
| Gots i fitxes (equacions) | GC | `gots-fitxes.html` | sí |
| Sistemes d'equacions | SE | `sistemes-equacions.html` | sí |
| Simplificació de radicals | RA | `radicals.html` | sí |
| Pla cartesià | PC | `pla-cartesia.html` | no |
| Estudi estadístic | ED | `estadistica.html` | sí |
| Mitjana aritmètica | MJ | `mitjana.html` | sí |
| Paràmetres estadístics | EI | `estadistica-inversa.html` | sí |
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
| Càlcul de derivades | DV | `derivades.html` | sí |
| Càlcul d'integrals | IT | `integrals.html` | sí |
| Gràfica i funció | GF | `grafica-i-funcio.html` | no |
| Asímptota i límit lateral | AS | `asimptotes.html` | no |
| Comparar gràfiques de funció i de derivada | GD | `grafica-funcio-i-derivada.html` | no |
| Descripció d'una gràfica | — | `descripcio-grafica.html` | no |

Els codis de les activitats que ara no en donen es mantenen reservats perquè l'analitzador pugui llegir codis antics.

### Altres pàgines

| Fitxer | Què és |
|---|---|
| `analitzador-stepquiz.html` | Analitzador dels codis de verificació (CSV del formulari) per al professorat. La lectura dels codis (tots els formats, de totes les èpoques) és a `js/analitzador-stepquiz/llegeix-codi.js`, i la dels intents repetits i de les proves de CB, a `js/analitzador-stepquiz/intents.js` (vegeu «Intents repetits i proves de CB a l'analitzador»). Totes dues són lògica pura, amb proves |
| `area-perimetre-tutorial.html` | Tutorial d'Àrea i perímetre (enllaçat des de l'índex) |
| `recta-numerica-tutorial.html` | Tutorial de lectura de gràfiques (l'obre el botó «Veure tutorial» de `recta-numerica.html`) |
| `setup_vocabulari.html` | Editor de coordenades de les figures de `vocabulari.html` (eina interna) |
| `s.html` | Fitxa adaptada de la unitat 1 (Nombres reals) |

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
├── utils.js            ← Funcions pures: randInt, pick, shuffle, parseStrictInt
├── config.js           ← Lectura de paràmetres URL
├── exercise-codes.js   ← Taula única de codis d'exercici (joc i analitzador)
└── game-core.js        ← Motor de joc (sessions, puntuació, codi v2, teclat)
css/
└── shared.css          ← Estils globals, teclat numèric, pantalles finals
vendor/                 ← Llibreries externes (KaTeX, SheetJS, ExcelJS), vegeu vendor/README.md
docs/historic/          ← Documents històrics (p. ex. el registre d'un pegat d'abril de 2026); no descriuen l'estat actual
```

**Mòduls antics** (equacions, fraccions, etc.): tot el joc en un sol fitxer, `js/<exercici>/<exercici>.js`. Ja no queda JS d'exercici dins dels HTML (només `window.APP_CONFIG`).

Fraccions ja té, a part, el seu diagnòstic d'errors: `js/fraccions/errors-fraccions.js` (mòdul pur, sense DOM) mira si una resposta incorrecta encaixa amb un error típic (sumar els denominadors, amplificar només el denominador, multiplicar en creu…) i en torna el tipus i un missatge que orienta sense donar la resposta. El joc el mostra sota el pas i l'apunta a l'historial («Incorrecte (sumar els denominadors)»). Si la resposta no encaixa amb cap error conegut, el joc fa com sempre. Les proves són a `tests/modules.test.js`.

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
| `dim`, `modalitat` | 2/3 · a/b | — | Dimensió i nivell (vocabulari) |
| `modalitat` | `passos` | resultat final | Prioritat d'operacions: «Pas a pas» (l'alumne resol l'expressió operació a operació) |
| `esvaiment` | `1` | desactivat | Mode «Esvaïment»: exemples resolts que es van esvaint (vegeu més avall). Ara, només a `prioritat` |
| `inici` | 0-9 | 0 | Amb `esvaiment=1`: quants passos fa l'alumne al primer exercici (0 = l'exemple sencer) |
| `debug` | 1 | desactivat | Mode de depuració (només `inversa-matriu` i `vocabulari`) |

Els màxims de sessions i preguntes (5 × 10) són els que pot representar el codi de verificació.

Exemple: `derivades.html?totalsessions=2&totaloperations=8&families=chain-exp-int,power`

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

GitHub els executa automàticament a cada pujada a `main` i a cada pull request. Vegeu [CONTRIBUTING.md](CONTRIBUTING.md#tests).

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
