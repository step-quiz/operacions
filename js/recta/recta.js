/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/recta/recta.js
 * ROL: Controlador de «La recta» (recta.html): diu al joc de passos comú
 *      (js/passos/joc-passos.js) quina pregunta toca i com es diagnostiquen els errors.
 * PARÀMETRES: ?tipus= (buit: tots, un rere l'altre · llegir · dibuixar ·
 *      dos-punts · classificar) i ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaRC } from './errors.js';
import { TIPUS_RC, generaPreguntaRC, tipusRC } from './math-engine.js';
import { TEXTOS_RC } from './strings.js';

const tipusUrl = urlParams.get('tipus') || '';
const OPCIO = Object.prototype.hasOwnProperty.call(TIPUS_RC, tipusUrl) ? tipusUrl : '';

iniciaJocPassos({
    element: TEXTOS_RC.element,
    generaPregunta({ nivell, index, total }) {
        return generaPreguntaRC(tipusRC(OPCIO, index, total), nivell);
    },
    diagnostica: diagnosticaRC,
});
