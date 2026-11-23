/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/inequacions.js
 * ROL: Controlador d'«Inequacions» (inequacions.html): diu al joc de passos comú
 *      (js/passos/joc-passos.js) quina inequació toca i com es diagnostiquen els errors.
 * PARÀMETRES:
 *      ?nivell=1-4   primer grau (0 o absent: progressiu, de l'1 al 4 al llarg de la sessió).
 *                    El joc comú en fa servir tres; aquí el nivell es calcula a part perquè n'hi
 *                    ha quatre.
 *      ?tipus=       '' primer grau (lliurament 17) · 2n grau i racionals (lliurament 22c,
 *                    no-lineals.js): 'no-lineals' (progressiu, nivells 1 a 3), 'segon-grau' (1),
 *                    'racionals' (2), 'especials' (3: no s'anul·la mai o solució doble).
 * CODI: el camp D diu el tipus i el nivell (0-4 primer grau, 5-8 de 2n grau i racionals).
 * ENLLAÇ: a primer grau, «Mira com es resol» (pregunta.enllac) porta a
 *      resolucio.html?activitat=inequacions amb el nivell de la inequació (js/inequacions/resolucio.js).
 * JOC DE PASSOS: desplacament (es veuen les dues últimes línies i el pas), com a Fórmules STEAM.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { state } from '../game-core.js';
import { nivellProgressiu } from '../utils.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaIQ } from './errors.js';
import { generaPreguntaIQ, textRespostaIQ } from './math-engine.js';
import { generaPreguntaNL, textRespostaNL } from './no-lineals.js';
import { TEXTOS_IQ, TEXTOS_NL } from './strings.js';

const NIVELL_URL = Math.min(Math.max(parseInt(urlParams.get('nivell') || '0', 10) || 0, 0), 4);
const TIPUS = urlParams.get('tipus') || '';
const NIVELL_NL = { 'segon-grau': 1, 'racionals': 2, 'especials': 3 }[TIPUS] || 0;
const NO_LINEALS = TIPUS === 'no-lineals' || NIVELL_NL > 0;

// El camp D del codi diu quin tipus s'ha fet (js/exercise-codes.js, ETIQUETES_DIFICULTAT.IQ):
// 0-4 primer grau (progressiu o nivell), 5-8 de 2n grau i racionals (progressiu o nivell)
state.dificultatCodi = NO_LINEALS ? 5 + NIVELL_NL : NIVELL_URL;

if (NO_LINEALS) {
    const sub = document.querySelector('.subtitle');
    if (sub) sub.textContent = TEXTOS_NL.subtitol;
}

iniciaJocPassos({
    element: TEXTOS_IQ.element,
    generaPregunta({ index, total }) {
        if (NO_LINEALS) return generaPreguntaNL(NIVELL_NL || nivellProgressiu(0, index, total));
        const nivell = NIVELL_URL || Math.min(4, 1 + Math.floor((total > 0 ? index / total : 0) * 4));
        const pregunta = generaPreguntaIQ(nivell);
        // «Mira com es resol»: la pissarra d'una inequació del mateix nivell (pestanya nova)
        pregunta.enllac = { href: `resolucio.html?activitat=inequacions&nivell=${nivell}`, text: TEXTOS_IQ.enllac };
        return pregunta;
    },
    diagnostica: diagnosticaIQ,
    textResposta: NO_LINEALS ? textRespostaNL : textRespostaIQ,
    // Enters amb signe i fraccions: el teclat numèric porta el signe menys
    teclat: { allowNegative: true },
    desplacament: true,
});
