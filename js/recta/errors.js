/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/recta/errors.js
 * ROL: Taxonomia d'errors de «La recta» i diagnòstic de cada resposta incorrecta
 *      (el mateix contracte que js/fraccions/errors-fraccions.js). Els passos amb
 *      nombres o opcions porten els valors dels errors típics (dades.distractors);
 *      els punts situats a la quadrícula es miren aquí.
 * Mòdul pur: es prova a tests/recta.test.js.
 * DEPENDÈNCIES: algebra/racionals.js i passos/correccio.js.
 * ============================================================================
 */

import { oposatCoef } from '../algebra/racionals.js';
import { errorPerDistractors, puntDeRecta } from '../passos/correccio.js';

export const ERRORS_RC = {
    N_TALL_X: {
        etiqueta: "tall amb l'eix X",
        missatge: "n és on la recta talla l'eix Y (quan x = 0), no on talla l'eix X.",
    },
    M_N: {
        etiqueta: 'm i n intercanviats',
        missatge: 'A y = mx + n, m és el que multiplica la x (el pendent) i n va sol (on talla l’eix Y).',
    },
    PENDENT_INVERS: {
        etiqueta: 'pendent girat',
        missatge: 'El pendent és el que puja per cada unitat que avança: Δy/Δx, no Δx/Δy.',
    },
    SIGNE_PENDENT: {
        etiqueta: 'signe del pendent',
        missatge: "Si la recta baixa d'esquerra a dreta, el pendent és negatiu; si puja, és positiu.",
    },
    TAULA_SENSE_N: {
        etiqueta: 'falta sumar n',
        missatge: 'Falta sumar n: y = m · x + n.',
    },
    TAULA_SIGNE: {
        etiqueta: 'signes de mx + n',
        missatge: 'Repassa els signes: y = m · x + n, amb el signe de m, el de x i el de n.',
    },
    PUNT_GIRAT: {
        etiqueta: 'coordenades girades',
        missatge: 'Has girat les coordenades: primer va la x (cap a la dreta) i després la y (cap amunt).',
    },
    PUNTS_ALTRA: {
        etiqueta: "punts d'una altra recta",
        missatge: "Aquests punts són d'una altra recta: comprova el signe del pendent i el de n.",
    },
    RESTA_SIGNE: {
        etiqueta: 'resta en un altre ordre',
        missatge: 'Resta en el mateix ordre a dalt i a baix: (y_B − y_A)/(x_B − x_A).',
    },
    N_SIGNE: {
        etiqueta: 'signe de n',
        missatge: 'n = y_A − m · x_A: vigila el signe de la resta.',
    },
    CLASS_PROPORCIONAL: {
        etiqueta: 'és proporcional',
        missatge: "Passa per l'origen (n = 0): és proporcional, y = mx.",
    },
    CLASS_AFI: {
        etiqueta: 'és afí',
        missatge: "No passa per l'origen i no és horitzontal: és afí, y = mx + n amb n ≠ 0.",
    },
    CLASS_CONSTANT: {
        etiqueta: 'és constant',
        missatge: 'El pendent és 0: la recta és horitzontal, y = n. És constant.',
    },
    CREIXEMENT: {
        etiqueta: 'creixement',
        missatge:
            'Mira el pendent: si és positiu, la funció creix; si és negatiu, decreix; si és 0, ni creix ni decreix.',
    },
};

function errorTypeRC(pas, valors) {
    if (pas.mena !== 'punts') return errorPerDistractors(pas, valors);
    const punts = valors.p || [];
    const { m, n } = pas.dades;
    if (!punts.length) return null;
    if (punts.every(([x, y]) => puntDeRecta([y, x], [m, n]))) return 'PUNT_GIRAT';
    if (
        [
            [oposatCoef(m), n],
            [m, oposatCoef(n)],
            [oposatCoef(m), oposatCoef(n)],
        ].some(r => punts.every(p => puntDeRecta(p, r)))
    )
        return 'PUNTS_ALTRA';
    return null;
}

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaRC(pas, valors) {
    try {
        const errorType = errorTypeRC(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_RC[errorType] } : null;
    } catch (e) {
        return null;
    }
}
