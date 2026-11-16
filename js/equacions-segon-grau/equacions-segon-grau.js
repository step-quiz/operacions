/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions-segon-grau/equacions-segon-grau.js
 * ROL: Controlador d'«Equacions de 2n Grau» (equacions-segon-grau.html): diu al
 *      joc de passos comú (js/passos/joc-passos.js) quina equació toca i com es
 *      diagnostiquen els errors. Les equacions i els passos són a math-engine.js;
 *      el diagnòstic, a errors.js; els textos, a strings.js.
 * PARÀMETRES: ?tipus= (buit: completes, incompletes i per ordenar · incompletes ·
 *      completes · ordenar · biquadrades) i ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { pick } from '../utils.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaSG } from './errors.js';
import { TIPUS_SG, calClassificarSG, generaEquacioSG, passosEquacioSG } from './math-engine.js';
import { TEXTOS_SG } from './strings.js';

// ?tipus= : quines equacions surten (una opció desconeguda val com «totes»)
const tipusUrl = urlParams.get('tipus') || '';
const OPCIO = Object.prototype.hasOwnProperty.call(TIPUS_SG, tipusUrl) ? tipusUrl : '';
const CLASSIFICA = calClassificarSG(OPCIO);

iniciaJocPassos({
    element: TEXTOS_SG.element,
    generaPregunta({ nivell }) {
        const equacio = generaEquacioSG(pick(TIPUS_SG[OPCIO]), nivell);
        return { ...equacio, passos: passosEquacioSG(equacio, { classifica: CLASSIFICA }) };
    },
    diagnostica: diagnosticaSG,
    // En ordenar val qualsevol equació equivalent: la resta de passos es fan amb la de l'alumne
    enEncertar(equacio, pas, valors) {
        if (pas.mena !== 'ordena') return null;
        return passosEquacioSG(equacio, { classifica: CLASSIFICA, coefs: [valors.a, valors.b, valors.c] });
    },
});
