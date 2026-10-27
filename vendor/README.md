# vendor/ — llibreries externes

Còpies exactes de les llibreries de tercers que fan servir les pàgines. Es serveixen des del mateix web (step-quiz.net) en lloc de carregar-les d'un CDN extern. Hi ha tres motius:

- **Versions fixades**: cada carpeta porta la versió al nom i no canvia mai sola.
- **Funcionen encara que la xarxa del centre bloquegi els CDN** (jsDelivr, cdnjs…).
- **Privacitat**: el navegador de l'alumne no fa peticions a servidors de tercers.

| Carpeta | Llibreria | Origen (paquet npm) | Llicència | La fan servir |
|---|---|---|---|---|
| `katex-0.16.11/` | KaTeX (fórmules) | `katex@0.16.11` → `dist/` | MIT | derivades, integrals, probabilitat, asímptotes, sistemes, gràfiques, llenguatge algebraic, la resolució pas a pas (`js/pissarra/`, el carrega sol quan cal)… |
| `xlsx-0.18.5/` | SheetJS (llegir Excel) | `xlsx@0.18.5` → `dist/xlsx.full.min.js` | Apache-2.0 | analitzador-stepquiz.html |
| `exceljs-4.3.0/` | ExcelJS (crear Excel) | `exceljs@4.3.0` → `dist/exceljs.min.js` | MIT | analitzador-stepquiz.html |

Cada carpeta inclou el fitxer de llicència original de la llibreria.

JSZip i PDF.js es van treure el 18/10/2026: només les feien servir `cb.html` i `informe-cb.html`, retirades el mateix dia.

## Com actualitzar una llibreria

1. Descarrega el paquet nou: `npm pack katex@X.Y.Z` (crea un `.tgz`).
2. Descomprimeix-lo i copia els mateixos fitxers a una carpeta nova `vendor/katex-X.Y.Z/`.
3. Canvia les rutes a les pàgines HTML, a `js/pissarra/pissarra.js` i als tests (cerca `katex-0.16.11` a tot el repositori).
4. Esborra la carpeta antiga.
