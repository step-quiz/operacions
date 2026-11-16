/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/canvi-unitats/errors.js
 * ROL: Taxonomia d'errors de «Canvi d'unitats» i diagnòstic de cada resposta
 *      incorrecta (el mateix contracte que js/percentatges/errors.js). Cada pas
 *      porta, a dades.distractors, els valors que donen els errors típics
 *      (math-engine.js); aquí es diu què vol dir cadascun.
 * Mòdul pur: es prova a tests/canvi-unitats.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

export const ERRORS_CU = {
    SENTIT: {
        etiqueta: 'sentit girat',
        missatge:
            "Mira cap on vas: d'una unitat gran a una de més petita es baixa i es multiplica (1 m = 100 cm); d'una de petita a una de més gran es puja i es divideix.",
    },
    COMPTA_UNITATS: {
        etiqueta: 'un graó de més',
        missatge:
            'Compta els salts, no les unitats: de km a m hi ha 3 graons (km → hm → dam → m), encara que hi surtin 4 unitats.',
    },
    SALTS: {
        etiqueta: 'graons mal comptats',
        missatge: "Torna a comptar els graons de l'escala, des de la unitat de partida fins a la d'arribada.",
    },
    DEU_PER_GRAO: {
        etiqueta: '× 10 per graó en superfície o volum',
        missatge:
            'A les unitats de superfície cada graó val × 100 (1 m² = 100 dm²), i a les de volum, × 1000 (1 m³ = 1000 dm³): no × 10.',
    },
    COMA: {
        etiqueta: 'coma desplaçada',
        missatge: 'Repassa on va la coma: el resultat és 10 vegades massa gran o massa petit.',
    },
    EQUIVALENCIA: {
        etiqueta: 'volum i capacitat',
        missatge: "Recorda l'equivalència: 1 dm³ = 1 l. També 1 m³ = 1 kl i 1 cm³ = 1 ml.",
    },
};

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaCU(pas, valors) {
    try {
        const errorType = errorPerDistractors(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_CU[errorType] } : null;
    } catch (e) {
        return null;
    }
}
