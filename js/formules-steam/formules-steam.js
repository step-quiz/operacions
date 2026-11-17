/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/formules-steam.js
 * ROL: Controlador de «Fórmules STEAM» (formules-steam.html): diu al joc de passos
 *      comú (js/passos/joc-passos.js) quina fórmula toca i com es diagnostiquen els
 *      errors. Sense codi de verificació (decisió del David, 17/11/2026:
 *      APP_CONFIG.senseCodi a la pàgina).
 * PARÀMETRES: ?nivell=1-4 (0 o absent: progressiu, de l'1 al 4 al llarg de la sessió).
 *      El joc comú en fa servir tres; aquí el nivell es calcula a part perquè n'hi ha quatre.
 * DEPENDÈNCIES: Mòdul ES (<script type="module">). KaTeX (global, vendor/).
 * ============================================================================
 */

import { urlParams } from '../config.js';
import { iniciaJocPassos } from '../passos/joc-passos.js';
import { diagnosticaFS } from './errors.js';
import { generaPreguntaFS, textRespostaFS } from './math-engine.js';
import { TEXTOS_FS } from './strings.js';

const NIVELL_URL = Math.min(Math.max(parseInt(urlParams.get('nivell') || '0', 10) || 0, 0), 4);

iniciaJocPassos({
    element: TEXTOS_FS.element,
    generaPregunta({ index, total }) {
        const nivell = NIVELL_URL || Math.min(4, 1 + Math.floor((total > 0 ? index / total : 0) * 4));
        return generaPreguntaFS(nivell);
    },
    diagnostica: diagnosticaFS,
    textResposta: textRespostaFS,
    // El valor, amb coma decimal (cap resultat és negatiu)
    teclat: { decimalComma: true },
});
