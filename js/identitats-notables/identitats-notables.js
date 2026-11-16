/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/identitats-notables/identitats-notables.js
 * ROL: Controlador d'«Identitats notables» (identitats-notables.html): diu al joc
 *      de passos comú (js/passos/joc-passos.js) quina pregunta toca i com es
 *      diagnostiquen els errors. Les preguntes són a math-engine.js; el
 *      diagnòstic, a errors.js; els textos, a strings.js.
 * PARÀMETRES: ?tipus= (buit: primer desenvolupar i després factoritzar ·
 *      desenvolupar · factoritzar), ?lletres=2 (b amb y), ?fraccions=1
 *      (coeficients fraccionaris) i ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaIN } from './errors.js';
import { TIPUS_IN, generaPreguntaIN, textRespostaIN, tipusIN } from './math-engine.js';
import { TEXTOS_IN } from './strings.js';

const tipusUrl = urlParams.get('tipus') || '';
const OPCIO = Object.prototype.hasOwnProperty.call(TIPUS_IN, tipusUrl) ? tipusUrl : '';
const OPCIONS = { dues: urlParams.get('lletres') === '2', fraccions: urlParams.get('fraccions') === '1' };

iniciaJocPassos({
    element: TEXTOS_IN.element,
    generaPregunta({ nivell, index, total }) {
        return generaPreguntaIN(tipusIN(OPCIO, index, total), nivell, OPCIONS);
    },
    diagnostica: diagnosticaIN,
    textResposta: textRespostaIN,
});
