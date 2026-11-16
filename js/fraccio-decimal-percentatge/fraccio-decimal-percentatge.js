/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccio-decimal-percentatge/fraccio-decimal-percentatge.js
 * ROL: Controlador de «Fracció, decimal i percentatge»
 *      (fraccio-decimal-percentatge.html): diu al joc de passos comú
 *      (js/passos/joc-passos.js) quin nombre toca i com es diagnostiquen els errors.
 * PARÀMETRES: ?modalitat=a (arrossegar targetes, per defecte) o b (escriure) i
 *      ?nivell=1-3 (0 o absent: progressiu).
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaFD } from './errors.js';
import { generaPreguntaFD, textRespostaFD } from './math-engine.js';
import { TEXTOS_FD } from './strings.js';

const MODALITAT = urlParams.get('modalitat') === 'b' ? 'b' : 'a';

iniciaJocPassos({
    element: TEXTOS_FD.element,
    generaPregunta({ nivell }) {
        return generaPreguntaFD(nivell, MODALITAT);
    },
    diagnostica: diagnosticaFD,
    textResposta: textRespostaFD,
    // Decimals: el teclat numèric porta la coma (i no el signe menys)
    teclat: { decimalComma: true },
});
