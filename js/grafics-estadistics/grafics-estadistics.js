/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafics-estadistics/grafics-estadistics.js
 * ROL: Controlador de «Gràfics estadístics» (grafics-estadistics.html): diu al joc
 *      de passos comú (js/passos/joc-passos.js) quin gràfic i quina pregunta toquen
 *      i com es diagnostiquen els errors.
 * PARÀMETRES: ?grafics= ('' tots · 1r-2n · 3r-4t · barres · sectors · pictogrames ·
 *      histogrames), ?preguntes= ('' segons el nivell · llegir · calcular · afirmacions ·
 *      enganys), ?opcions=3|4|5 (opcions de resposta de les preguntes de triar;
 *      4 si no es diu) i ?nivell=1-3 (0 o absent: progressiu; el 3 hi afegeix
 *      gràfics que enganyen).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaGE } from './errors.js';
import { GRAFICS_GE, PREGUNTES_GE, generaPreguntaGE, textRespostaGE } from './math-engine.js';
import { TEXTOS_GE } from './strings.js';

const graficsUrl = urlParams.get('grafics') || '';
const GRAFICS = Object.prototype.hasOwnProperty.call(GRAFICS_GE, graficsUrl) ? graficsUrl : '';
const preguntesUrl = urlParams.get('preguntes') || '';
const PREGUNTES = Object.prototype.hasOwnProperty.call(PREGUNTES_GE, preguntesUrl) ? preguntesUrl : '';
const opcionsUrl = Number(urlParams.get('opcions'));
const OPCIONS = [3, 4, 5].includes(opcionsUrl) ? opcionsUrl : 4;

iniciaJocPassos({
    element: TEXTOS_GE.element,
    generaPregunta({ nivell, index }) {
        return generaPreguntaGE({ grafics: GRAFICS, preguntes: PREGUNTES, nivell, index, opcions: OPCIONS });
    },
    diagnostica: diagnosticaGE,
    textResposta: textRespostaGE,
    // Percentatges i marques de classe amb decimals: el teclat numèric porta la coma
    teclat: { decimalComma: true },
});
