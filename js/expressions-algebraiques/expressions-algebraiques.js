/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/expressions-algebraiques/expressions-algebraiques.js
 * ROL: Controlador d'«Expressions algebraiques» (expressions-algebraiques.html):
 *      diu al joc de passos comú (js/passos/joc-passos.js) quina expressió toca i
 *      com es diagnostiquen els errors. Les expressions són a math-engine.js; el
 *      diagnòstic, a errors.js; els textos, a strings.js.
 * PARÀMETRES: ?tipus= (buit: totes, una rere l'altra · reduir · monomis ·
 *      distributiva · binomis), ?lletres=2 (x i y; si no, només x) i ?nivell=1-3
 *      (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaEA } from './errors.js';
import { TIPUS_EA, generaPreguntaEA, textRespostaEA, tipusEA } from './math-engine.js';
import { TEXTOS_EA } from './strings.js';

// ?tipus= i ?lletres= (una opció desconeguda val com la de per defecte)
const tipusUrl = urlParams.get('tipus') || '';
const OPCIO = Object.prototype.hasOwnProperty.call(TIPUS_EA, tipusUrl) ? tipusUrl : '';
const DUES_LLETRES = urlParams.get('lletres') === '2';

iniciaJocPassos({
    element: TEXTOS_EA.element,
    generaPregunta({ nivell, index, total }) {
        return generaPreguntaEA(tipusEA(OPCIO, index, total), nivell, DUES_LLETRES);
    },
    diagnostica: diagnosticaEA,
    textResposta: textRespostaEA,
});
