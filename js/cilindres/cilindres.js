/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/cilindres/cilindres.js
 * ROL: Controlador de «Cilindres amb un full» (cilindres.html, 2n d'ESO): diu al joc de
 *      passos comú (js/passos/joc-passos.js) quin full toca, com es diagnostiquen els errors
 *      i que els passos es corregeixen amb arrossegament (enEncertar: refaPassos).
 * PARÀMETRES: ?nivell=1 (sempre el full A4, 21 × 30), 2 (altres rectangles); 0 o absent: la
 *      primera pregunta és el full A4 i les altres, altres rectangles (decisió del David).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaCF } from './errors.js';
import { generaPreguntaCF, refaPassos, textRespostaCF } from './math-engine.js';
import { TEXTOS_CF } from './strings.js';

const NIVELL_URL = Math.min(Math.max(parseInt(urlParams.get('nivell') || '0', 10) || 0, 0), 2);

iniciaJocPassos({
    element: TEXTOS_CF.element,
    generaPregunta({ index }) {
        return generaPreguntaCF(NIVELL_URL || (index === 0 ? 1 : 2));
    },
    diagnostica: diagnosticaCF,
    textResposta: textRespostaCF,
    enEncertar: refaPassos,
    // Decimals amb coma (cap resultat és negatiu)
    teclat: { decimalComma: true },
    desplacament: true,
});
