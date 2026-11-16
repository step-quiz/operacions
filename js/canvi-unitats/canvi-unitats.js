/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/canvi-unitats/canvi-unitats.js
 * ROL: Controlador de «Canvi d'unitats» (canvi-unitats.html): diu al joc de passos
 *      comú (js/passos/joc-passos.js) quin canvi toca i com es diagnostiquen els errors.
 * PARÀMETRES: ?magnitud= (buit: segons el nivell · longitud · massa · capacitat ·
 *      superficie · volum · volum-capacitat) i ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaCU } from './errors.js';
import { MAGNITUDS_CU, generaPreguntaCU, magnitudCU, textRespostaCU } from './math-engine.js';
import { TEXTOS_CU } from './strings.js';

const magnitudUrl = urlParams.get('magnitud') || '';
const OPCIO = Object.prototype.hasOwnProperty.call(MAGNITUDS_CU, magnitudUrl) ? magnitudUrl : '';

iniciaJocPassos({
    element: TEXTOS_CU.element,
    generaPregunta({ nivell }) {
        return generaPreguntaCU(magnitudCU(OPCIO, nivell), nivell);
    },
    diagnostica: diagnosticaCU,
    textResposta: textRespostaCU,
    // Decimals: el teclat numèric porta la coma (i no el signe menys)
    teclat: { decimalComma: true },
});
