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
4. En acabar, l'alumne obté un **codi de verificació** (format v2, 59–79 caràcters) amb nota, data i checksum antifrau.
5. El professor carrega les respostes del formulari a `analitzador-stepquiz.html` per validar els codis i veure les notes.

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

### Adaptades

Les versions simplificades per a alumnes amb necessitats educatives especials són ara un projecte a part: https://a.step-quiz.net (repositori `step-quiz/a`). L'analitzador d'aquest projecte continua llegint els seus codis (`AE`, `AD`, `AN`, `AQ`, `AO`, `AR`).

## Arquitectura

El projecte segueix dues arquitectures segons l'antiguitat de l'exercici:

**Mòduls nous** (derivades, integrals, probabilitat, estadística, recta numèrica, asímptotes…): cada exercici té la seva carpeta a `js/`.
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
vendor/                 ← Llibreries externes (KaTeX, PDF.js, SheetJS…), vegeu vendor/README.md
```

**Mòduls antics** (equacions, fraccions, etc.): tot el JS va inline dins el HTML.

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
| `debug` | 1 | desactivat | Mode de depuració (només `inversa-matriu` i `vocabulari`) |

Els màxims de sessions i preguntes (5 × 10) són els que pot representar el codi de verificació.

Exemple: `derivades.html?totalsessions=2&totaloperations=8&families=chain-exp-int,power`

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
