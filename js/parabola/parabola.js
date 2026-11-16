/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/parabola/parabola.js
 * ROL: Controlador de «La paràbola» (parabola.html): diu al joc de passos comú
 *      (js/passos/joc-passos.js) quina pregunta toca i com es diagnostiquen els errors.
 * PARÀMETRES: ?tipus= (buit: primer dibuixar i després llegir · dibuixar · llegir)
 *      i ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaPA } from './errors.js';
import { TIPUS_PA, generaPreguntaPA, tipusPA } from './math-engine.js';
import { TEXTOS_PA } from './strings.js';

const tipusUrl = urlParams.get('tipus') || '';
const OPCIO = Object.prototype.hasOwnProperty.call(TIPUS_PA, tipusUrl) ? tipusUrl : '';

iniciaJocPassos({
    element: TEXTOS_PA.element,
    generaPregunta({ nivell, index, total }) {
        return generaPreguntaPA(tipusPA(OPCIO, index, total), nivell);
    },
    diagnostica: diagnosticaPA,
});
