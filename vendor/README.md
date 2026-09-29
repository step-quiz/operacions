# vendor/ — llibreries externes

Còpies exactes de les llibreries de tercers que fan servir les pàgines. Es serveixen des del mateix web (step-quiz.net) en lloc de carregar-les d'un CDN extern. Hi ha tres motius:

- **Versions fixades**: cada carpeta porta la versió al nom i no canvia mai sola.
- **Funcionen encara que la xarxa del centre bloquegi els CDN** (jsDelivr, cdnjs…).
- **Privacitat**: el navegador de l'alumne no fa peticions a servidors de tercers.

| Carpeta | Llibreria | Origen (paquet npm) | Llicència | La fan servir |
|---|---|---|---|---|
| `katex-0.16.11/` | KaTeX (fórmules) | `katex@0.16.11` → `dist/` | MIT | derivades, integrals, probabilitat, asímptotes, sistemes, gràfiques, llenguatge algebraic… |
| `xlsx-0.18.5/` | SheetJS (llegir Excel) | `xlsx@0.18.5` → `dist/xlsx.full.min.js` | Apache-2.0 | analitzador, cb.html, informe-cb.html |
| `exceljs-4.3.0/` | ExcelJS (crear Excel) | `exceljs@4.3.0` → `dist/exceljs.min.js` | MIT | analitzador, cb.html, informe-cb.html |
| `jszip-3.10.1/` | JSZip (crear .docx) | `jszip@3.10.1` → `dist/jszip.min.js` | MIT / GPLv3 | informe-cb.html |
| `pdfjs-3.11.174/` | PDF.js (llegir PDF) | `pdfjs-dist@3.11.174` → `build/` | Apache-2.0 | cb.html, informe-cb.html |

Cada carpeta inclou el fitxer de llicència original de la llibreria.

**Nota de seguretat (PDF.js 3.11.174):** aquesta versió té una vulnerabilitat coneguda (CVE-2024-4367) que es neutralitza passant `isEvalSupported: false` a `pdfjsLib.getDocument(...)`. Totes les crides del projecte ja ho fan. Si mai s'afegeix una crida nova, cal mantenir-ho.

## Com actualitzar una llibreria

1. Descarrega el paquet nou: `npm pack katex@X.Y.Z` (crea un `.tgz`).
2. Descomprimeix-lo i copia els mateixos fitxers a una carpeta nova `vendor/katex-X.Y.Z/`.
3. Canvia les rutes a les pàgines HTML (cerca `vendor/katex-0.16.11/`).
4. Esborra la carpeta antiga.
