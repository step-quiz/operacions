/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estudi-funcio/estudi-funcio.js
 * ROL: Controlador d'«Estudi d'una funció» (estudi-funcio.html): diu al joc de passos
 *      comú (js/passos/joc-passos.js) quina funció toca i com es diagnostiquen els errors.
 * PARÀMETRES: ?funcions= '' (totes: polinòmiques i racionals, meitat i meitat) ·
 *      'polinomiques' · 'racionals' · 'pau' (els 6 exercicis del DEMO de pau, en ordre).
 * JOC DE PASSOS: desplacament (es veuen les dues últimes línies i el pas); la part de f″ és
 *      opcional (pregunta.opcional).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaEF, textRespostaEF } from './errors.js';
import { generaPreguntaEF } from './math-engine.js';
import { TEXTOS_EF } from './strings.js';

const VALIDES = ['', 'polinomiques', 'racionals', 'pau'];
const FUNCIONS = VALIDES.includes(urlParams.get('funcions') || '') ? urlParams.get('funcions') || '' : '';

iniciaJocPassos({
    element: TEXTOS_EF.element,
    generaPregunta: ({ index }) => generaPreguntaEF({ funcions: FUNCIONS, index }),
    diagnostica: diagnosticaEF,
    textResposta: textRespostaEF,
    // Punts de prova i y dels extrems: enters amb signe i fraccions
    teclat: { allowNegative: true },
    desplacament: true,
});
