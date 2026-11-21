/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/logaritmes/logaritmes.js
 * ROL: Controlador de «Logaritmes i equacions» (logaritmes.html, Batx, sense codi): diu
 *      al joc de passos comú (js/passos/joc-passos.js) quin exercici toca i com es
 *      diagnostiquen els errors. Bloc 1, logaritmes (lliurament 22a, math-engine.js);
 *      bloc 2, equacions exponencials, logarítmiques i irracionals (22b, equacions.js).
 *      Les inequacions (22c) són a inequacions.html.
 * PARÀMETRES: ?tipus=
 *      logaritmes  '' (progressiu: nivells 1, 2 i 3) · 'definicio' (1) · 'calcul' (2) ·
 *                  'propietats' (3)
 *      equacions   'equacions' (progressiu) · 'basiques' (1: mateixa base, logarítmica
 *                  senzilla) · 'mitjanes' (2: canvi de variable, propietats, calculadora) ·
 *                  'irracionals' (3)
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { generaPreguntaEQ } from './equacions.js';
import { diagnosticaEQ, diagnosticaLG, textRespostaLG } from './errors.js';
import { generaPreguntaLG } from './math-engine.js';
import { TEXTOS_EQ, TEXTOS_LG } from './strings.js';

const TIPUS = urlParams.get('tipus') || '';
const NIVELL_LG = { definicio: 1, calcul: 2, propietats: 3 }[TIPUS] || 0;
const NIVELL_EQ = { basiques: 1, mitjanes: 2, irracionals: 3 }[TIPUS] || 0;
const EQUACIONS = TIPUS === 'equacions' || NIVELL_EQ > 0;

if (EQUACIONS) {
    const sub = document.querySelector('.subtitle');
    if (sub) sub.textContent = TEXTOS_EQ.subtitol;
}

iniciaJocPassos({
    element: TEXTOS_LG.element,
    generaPregunta: EQUACIONS
        ? ({ nivell }) => generaPreguntaEQ({ nivell: NIVELL_EQ || nivell })
        : ({ nivell }) => generaPreguntaLG({ nivell: NIVELL_LG || nivell }),
    diagnostica: EQUACIONS ? diagnosticaEQ : diagnosticaLG,
    textResposta: textRespostaLG,
    // Enters amb signe (exponents, solucions) i, a les caselles de decimals, la coma (data-coma)
    teclat: { allowNegative: true },
    desplacament: true,
});
