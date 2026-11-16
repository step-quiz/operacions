/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafiques-context/grafiques-context.js
 * ROL: Controlador de «Gràfiques en context» (grafiques-context.html): diu al joc
 *      de passos comú (js/passos/joc-passos.js) quina història, gràfica i pregunta
 *      toquen i com es diagnostiquen els errors.
 * PARÀMETRES: ?grafiques= ('' totes · segments · corbes), ?preguntes= ('' segons el
 *      nivell · llegir · descriure · relat), ?opcions=3|4|5 (opcions de resposta de les
 *      preguntes de triar; 4 si no es diu) i ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaGX } from './errors.js';
import { GRAFIQUES_GX, PREGUNTES_GX, generaPreguntaGX, textRespostaGX } from './math-engine.js';
import { TEXTOS_GX } from './strings.js';

const triat = (param, taula) => {
    const v = urlParams.get(param) || '';
    return Object.prototype.hasOwnProperty.call(taula, v) ? v : '';
};
const GRAFIQUES = triat('grafiques', GRAFIQUES_GX);
const PREGUNTES = triat('preguntes', PREGUNTES_GX);
const opcionsUrl = Number(urlParams.get('opcions'));
const OPCIONS = [3, 4, 5].includes(opcionsUrl) ? opcionsUrl : 4;

iniciaJocPassos({
    element: TEXTOS_GX.element,
    generaPregunta({ nivell, index }) {
        return generaPreguntaGX({ grafiques: GRAFIQUES, preguntes: PREGUNTES, nivell, index, opcions: OPCIONS });
    },
    diagnostica: diagnosticaGX,
    textResposta: textRespostaGX,
    // Velocitats i valors amb decimals: el teclat numèric porta la coma
    teclat: { decimalComma: true },
});
