/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/inequacions.js
 * ROL: Controlador d'«Inequacions» (inequacions.html): diu al joc de passos comú
 *      (js/passos/joc-passos.js) quina inequació toca i com es diagnostiquen els errors.
 * PARÀMETRES: ?nivell=1-4 (0 o absent: progressiu, de l'1 al 4 al llarg de la sessió).
 *      El joc comú en fa servir tres; aquí el nivell es calcula a part perquè n'hi ha quatre.
 * JOC DE PASSOS: desplacament (es veuen les dues últimes línies i el pas), com a Fórmules STEAM.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaIQ } from './errors.js';
import { generaPreguntaIQ, textRespostaIQ } from './math-engine.js';
import { TEXTOS_IQ } from './strings.js';

const NIVELL_URL = Math.min(Math.max(parseInt(urlParams.get('nivell') || '0', 10) || 0, 0), 4);

iniciaJocPassos({
    element: TEXTOS_IQ.element,
    generaPregunta({ index, total }) {
        const nivell = NIVELL_URL || Math.min(4, 1 + Math.floor((total > 0 ? index / total : 0) * 4));
        return generaPreguntaIQ(nivell);
    },
    diagnostica: diagnosticaIQ,
    textResposta: textRespostaIQ,
    // Enters amb signe i fraccions: el teclat numèric porta el signe menys
    teclat: { allowNegative: true },
    desplacament: true,
});
