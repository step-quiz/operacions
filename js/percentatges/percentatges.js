/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/percentatges/percentatges.js
 * ROL: Controlador de «Percentatges» (percentatges.html): diu al joc de passos comú
 *      (js/passos/joc-passos.js) quin problema toca i com es diagnostiquen els errors.
 * PARÀMETRES: ?tipus= (buit: segons el nivell · calcul · variacio · invers ·
 *      encadenats) i ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaPE } from './errors.js';
import { TIPUS_PE, generaPreguntaPE, textRespostaPE, tipusPE } from './math-engine.js';
import { TEXTOS_PE } from './strings.js';

const tipusUrl = urlParams.get('tipus') || '';
const OPCIO = Object.prototype.hasOwnProperty.call(TIPUS_PE, tipusUrl) ? tipusUrl : '';

iniciaJocPassos({
    element: TEXTOS_PE.element,
    generaPregunta({ nivell }) {
        return generaPreguntaPE(tipusPE(OPCIO, nivell), nivell);
    },
    diagnostica: diagnosticaPE,
    textResposta: textRespostaPE,
    // Decimals: el teclat numèric porta la coma (i no el signe menys)
    teclat: { decimalComma: true },
});
