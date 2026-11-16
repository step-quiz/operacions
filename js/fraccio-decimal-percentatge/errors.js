/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccio-decimal-percentatge/errors.js
 * ROL: Taxonomia d'errors de «Fracció, decimal i percentatge» i diagnòstic de cada
 *      resposta incorrecta (el mateix contracte que js/fraccions/errors-fraccions.js).
 *
 * Les dues modalitats comparteixen els errors: a la d'arrossegar, cada targeta falsa
 * ja porta l'error que representa (1/4 → 0,4 és «FRACCIO_COMA»); a la d'escriure, el
 * valor escrit es compara amb els mateixos valors falsos (math-engine.js, distractorsFD).
 *
 * Mòdul pur: no toca el DOM (es prova a tests/fraccio-decimal-percentatge.test.js).
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

// etiqueta: com es diu l'error a l'historial · missatge: el que llegeix l'alumne
export const ERRORS_FD = {
    INVERSA: {
        etiqueta: 'fracció girada',
        missatge: 'Has girat la fracció: a dalt hi va la part (el numerador) i a baix, el total (el denominador).',
    },
    DECIMAL_DEN: {
        etiqueta: 'xifres decimals com a denominador',
        missatge: 'Les xifres decimals no són el denominador: 0,4 són 4 dècimes, 4/10 = 2/5, i no 1/4.',
    },
    PERCENT_DEN: {
        etiqueta: 'percentatge com a denominador',
        missatge: 'Un percentatge són centèsimes: 25 % = 25/100 = 1/4, i no 1/25.',
    },
    FRACCIO_COMA: {
        etiqueta: 'xifres de la fracció darrere la coma',
        missatge:
            'Per passar una fracció a decimal, es divideix el numerador entre el denominador: 1/4 = 1 : 4 = 0,25 (no 0,4 ni 0,14).',
    },
    PER_100: {
        etiqueta: 'per 100',
        missatge:
            'Percentatge vol dir «de cada 100»: de decimal a percentatge es multiplica per 100 (0,25 = 25 %), i de percentatge a decimal es divideix per 100.',
    },
    DEN_PERCENT: {
        etiqueta: 'denominador com a percentatge',
        missatge: 'El denominador no és el percentatge: 1/4 vol dir 25 de cada 100, és a dir, 25 %.',
    },
    COMA: {
        etiqueta: 'coma desplaçada',
        missatge: 'Repassa on va la coma: el valor és 10 vegades massa gran o massa petit.',
    },
    PERIODE: {
        etiqueta: 'període tallat',
        missatge:
            'És un decimal periòdic: les xifres del període es repeteixen sense fi. Escriu-les a la casella petita del període.',
    },
    COMPLEMENT: {
        etiqueta: 'parts que no són',
        missatge: 'Has pintat les parts que no són de la fracció: el numerador diu quantes en pintes.',
    },
    PARTS: {
        etiqueta: 'nombre de parts',
        missatge:
            'El denominador diu en quantes parts iguals es divideix la unitat, i el numerador, quantes en pintes.',
    },
    COLUMNA: {
        etiqueta: 'columna equivocada',
        missatge:
            "Aquesta targeta és d'una altra columna: mira si és una fracció, un decimal, un percentatge o un dibuix.",
    },
};

/** La primera columna equivocada i, si es reconeix, l'error. */
function errorTypeFD(pas, valors) {
    // Escriure: el valor escrit es compara amb els valors falsos de cada columna
    if (pas.dades.modalitat !== 'a') return errorPerDistractors(pas, valors);
    // Arrossegar: cada targeta falsa porta el seu error
    for (const col of Object.keys(pas.camps)) {
        if (valors[col] === pas.solucio[col]) continue;
        const fitxa = pas.dades.fitxes[valors[col]];
        if (!fitxa) return null;
        return fitxa.columna !== col ? 'COLUMNA' : fitxa.errorType;
    }
    return null;
}

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaFD(pas, valors) {
    try {
        const errorType = errorTypeFD(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_FD[errorType] } : null;
    } catch (e) {
        return null;
    }
}
