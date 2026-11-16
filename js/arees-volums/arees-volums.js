/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/arees-volums/arees-volums.js
 * ROL: Controlador d'«Àrees i volums» (arees-volums.html): diu al joc de passos comú
 *      (js/passos/joc-passos.js) quina figura toca i com es diagnostiquen els errors.
 * PARÀMETRES: ?dim= (buit: tot, segons el nivell · 2: només figures planes · 3: només
 *      cossos) i ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaAV } from './errors.js';
import { figuraAV, generaPreguntaAV, textRespostaAV } from './math-engine.js';
import { TEXTOS_AV } from './strings.js';

const DIM = urlParams.get('dim') || '';

iniciaJocPassos({
    element: TEXTOS_AV.element,
    generaPregunta({ nivell }) {
        return generaPreguntaAV(figuraAV(DIM, nivell));
    },
    diagnostica: diagnosticaAV,
    textResposta: textRespostaAV,
    // Decimals: el teclat numèric porta la coma (i no el signe menys)
    teclat: { decimalComma: true },
});
