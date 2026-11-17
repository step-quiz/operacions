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
 * ENLLAÇ: «Mira com es resol» (pregunta.enllac, sota les targetes del problema i la fórmula) porta a
 *      resolucio.html?activitat=formules-steam amb el nivell de la fórmula que toca (la pissarra és a
 *      js/formules-steam/resolucio.js).
 * JOC DE PASSOS: desplacament (es veuen les dues últimes línies i el pas) i plegaAntigues (en pantalles
 *      baixes, les línies del mig es pleguen), decisions R5 i A2 de la revisió de la interfície (17/11).
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
        const pregunta = generaPreguntaFS(nivell);
        // La resolució pas a pas d'una fórmula del mateix nivell que la que toca
        pregunta.enllac = {
            href: `resolucio.html?activitat=formules-steam&nivell=${pregunta.dades.nivell}`,
            text: TEXTOS_FS.enllac,
        };
        return pregunta;
    },
    diagnostica: diagnosticaFS,
    textResposta: textRespostaFS,
    // El valor, amb coma decimal (cap resultat és negatiu)
    teclat: { decimalComma: true },
    desplacament: true,
    plegaAntigues: true,
});
