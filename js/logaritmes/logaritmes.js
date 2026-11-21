/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/logaritmes/logaritmes.js
 * ROL: Controlador de «Logaritmes i equacions» (logaritmes.html, Batx, sense codi): diu
 *      al joc de passos comú (js/passos/joc-passos.js) quin exercici toca i com es
 *      diagnostiquen els errors. Bloc 1, logaritmes (lliurament 22a); els blocs 2 i 3
 *      (equacions; inequacions a inequacions.html) arriben als lliuraments 22b i 22c.
 * PARÀMETRES: ?tipus= '' (progressiu: nivells 1, 2 i 3) · 'definicio' (nivell 1) ·
 *      'calcul' (nivell 2) · 'propietats' (nivell 3).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaLG, textRespostaLG } from './errors.js';
import { generaPreguntaLG } from './math-engine.js';
import { TEXTOS_LG } from './strings.js';

const NIVELL_TIPUS = { definicio: 1, calcul: 2, propietats: 3 }[urlParams.get('tipus')] || 0;

iniciaJocPassos({
    element: TEXTOS_LG.element,
    generaPregunta: ({ nivell }) => generaPreguntaLG({ nivell: NIVELL_TIPUS || nivell }),
    diagnostica: diagnosticaLG,
    textResposta: textRespostaLG,
    // Enters amb signe (exponents) i, a les caselles de decimals, la coma (data-coma)
    teclat: { allowNegative: true },
    desplacament: true,
});
