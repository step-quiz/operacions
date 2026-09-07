# Step Quiz: Matemàtiques Interactives

Conjunt d'activitats interactives en format web per practicar operacions matemàtiques d'ESO i Batxillerat. Cada exercici inclou feedback pedagògic pas a pas, un sistema de puntuació per sessions i un codi de verificació que l'alumne lliura al professor.

## Com funciona?

No requereix instal·lació ni servidor. Són arxius totalment estàtics.

1. Obre `index.html` al navegador — és el **generador d'enllaços** per al professorat.
2. Tria l'exercici i configura sessions, operacions i intents.
3. Copia l'enllaç i comparteix-lo amb els alumnes.
4. En acabar, l'alumne obté un **codi de verificació** (format v2, 59 caràcters) amb nota, data i checksum antifrau.

## Exercicis disponibles

### ESO

| Exercici | Codi | Fitxer |
|----------|------|--------|
| Enters (operacions) | EN | `enters.html` |
| Enters (ordenar) | EO | `enters-ordenar.html` |
| Fraccions | FR | `fraccions.html` |
| Equacions de 1r grau | EQ | `equacions.html` |
| Sistemes d'equacions | SE | `sistemes-equacions.html` |
| MCD i MCM | MC | `mcd-mcm.html` |
| Potències | PT | `potencies.html` |
| Factoritzar | FA | `factoritzar.html` |
| Radicals | RA | `radicals.html` |
| Recta numèrica | RN | `recta-numerica.html` |
| Àrea i perímetre | AP | `area-perimetre.html` |
| Pla cartesià | PC | `pla-cartesia.html` |
| Proporcionalitat directa | PR | `proporciodirecta.html` |
| Decimals | DI | `decimals.html` |
| Vocabulari geomètric | VO | `vocabulari.html` |

### Batxillerat

| Exercici | Codi | Fitxer |
|----------|------|--------|
| Nombres complexos | CX | `complexos.html` |
| Derivades | DV | `derivades.html` |
| Integrals | IT | `integrals.html` |
| Asímptotes | AS | `asimptotes.html` |
| Ruffini | RU | `ruffini.html` |
| Gràfica i funció | GF | `grafica-i-funcio.html` |
| Gràfica, funció i derivada | GD | `grafica-funcio-i-derivada.html` |
| Rectes i plans | RP | `rectes-plans.html` |
| Esglaonar matriu | EM | `esglaonar-matriu.html` |
| Inversa de matriu | IM | `inversa-matriu.html` |

### Adaptades (carpeta `a/`)

Versions simplificades per a alumnes amb necessitats educatives especials.

## Arquitectura

El projecte segueix dues arquitectures segons l'antiguitat de l'exercici:

**Mòduls nous (derivades, integrals, recta numèrica, asímptotes):**
```
js/derivades/
├── math-engine.js      ← Capa matemàtica pura (sense DOM)
├── strings.js          ← Textos de feedback i pistes
├── distractor-lib.js   ← Generador de distractors pedagògics
├── question-bank.js    ← Famílies de preguntes
└── derivades.js        ← Controlador DOM
```

**Fitxers compartits (carregats per tots els exercicis):**
```
js/
├── utils.js            ← Funcions pures: randInt, pick, shuffle, parseStrictInt
├── config.js           ← Lectura de paràmetres URL
└── game-core.js        ← Motor de joc (sessions, puntuació, codi v2, teclat)
css/
└── shared.css          ← Estils globals, teclat numèric, pantalles finals
```

**Mòduls antics (equacions, fraccions, etc.):** tot el JS va inline dins el HTML.

## Paràmetres URL

| Paràmetre | Valors | Per defecte | Descripció |
|-----------|--------|-------------|------------|
| `totalsessions` | 1-20 | Definit per cada joc | Nombre de sessions |
| `totaloperations` | 1-30 | Definit per cada joc | Operacions per sessió |
| `maxintents` | 1-10 | Definit per cada joc | Intents per operació |
| `maxenllocmitjana` | 0-1 | Definit per cada joc | 0=nota mitjana, 1=nota màxima |
| `nivell` | 1-3 | 0 | Dificultat (jocs amb nivells) |
| `families` | ids separats per `,` | totes | Famílies actives (derivades/integrals) |
| `debug` | 1 | desactivat | Mostra panel de depuració |

Exemple: `derivades.html?totalsessions=2&totaloperations=8&families=chain-exp-int,power`

## Tecnologies

- HTML5 / CSS3 purs (sense frameworks)
- Vanilla JavaScript (ES6)
- KaTeX (CDN) per a renderització LaTeX en derivades, integrals i sistemes
- Cap backend: tot s'executa al navegador

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) per a convencions de codi, arquitectura i instruccions per afegir nous exercicis.

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
