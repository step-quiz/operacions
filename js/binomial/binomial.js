/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/binomial/binomial.js
 * ROL: Controlador de «Distribució binomial» (binomial.html): diu al joc de passos
 *      comú (js/passos/joc-passos.js) quin problema toca, com es diagnostiquen els
 *      errors i com es refan els passos si l'alumne tria el camí llarg.
 * PARÀMETRES: ?tipus= '' (progressiu: nivells 1, 2 i 3 al llarg de la sessió) ·
 *      'exacte' (nivell 1, P(X = k)) · 'directe' (nivell 2) · 'contrari' (nivell 3).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaBI, textRespostaBI } from './errors.js';
import { generaPreguntaBI, passosSegonsCami } from './math-engine.js';
import { TEXTOS_BI } from './strings.js';

const NIVELL_TIPUS = { exacte: 1, directe: 2, contrari: 3 }[urlParams.get('tipus')] || 0;

iniciaJocPassos({
    element: TEXTOS_BI.element,
    // Sense ?tipus=, el nivell progressiu del joc de passos (1, 2 i 3 al llarg de la sessió)
    generaPregunta: ({ nivell }) => generaPreguntaBI({ nivell: NIVELL_TIPUS || nivell }),
    diagnostica: diagnosticaBI,
    textResposta: textRespostaBI,
    enEncertar: (pregunta, pas, valors) => passosSegonsCami(pregunta, pregunta.passos, pas, valors),
    teclat: { decimalComma: true },
    desplacament: true,
});
