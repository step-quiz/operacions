/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/percentatges/errors.js
 * ROL: Taxonomia d'errors de «Percentatges» i diagnòstic de cada resposta
 *      incorrecta (el mateix contracte que js/fraccions/errors-fraccions.js).
 *      Cada pas porta, a dades.distractors, els valors que donen els errors típics
 *      (math-engine.js); aquí es diu què vol dir cadascun.
 * Mòdul pur: es prova a tests/percentatges.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

export const ERRORS_PE = {
    SENSE_100: {
        etiqueta: 'sense dividir per 100',
        missatge: 'Tant per cent vol dir «de cada 100»: cal dividir per 100 (30 % = 30/100 = 0,3).',
    },
    DECIMAL_5: {
        etiqueta: '5 % = 0,5',
        missatge: 'Un 5 % són 5 centèsimes: 0,05, no 0,5 (que seria un 50 %).',
    },
    PERCENT_DEN: {
        etiqueta: '25 % = 1/25',
        missatge: 'El 25 % no és 1/25: és 25/100, que simplificat és 1/4.',
    },
    COMA: {
        etiqueta: 'coma desplaçada',
        missatge: 'Repassa on va la coma: el resultat és 10 vegades massa gran o massa petit.',
    },
    RESTA_PERCENT: {
        etiqueta: 'resta el tant per cent',
        missatge: 'El tant per cent no es resta de la quantitat: el 30 % de 40 és 0,3 · 40.',
    },
    COMPLEMENT: {
        etiqueta: 'el que queda',
        missatge: 'Això és el que queda, no el tant per cent: el 30 % de 40 és 12 (i en queden 28).',
    },
    INDEX_SENSE_1: {
        etiqueta: "índex sense l'1",
        missatge:
            "L'índex inclou la quantitat de partida: rebaixar un 30 % és pagar el 70 % (× 0,7) i augmentar un 21 % és pagar el 121 % (× 1,21).",
    },
    INDEX_SIGNE: {
        etiqueta: 'augment o rebaixa',
        missatge: "Mira si és un augment (l'índex és més gran que 1) o una rebaixa (més petit que 1).",
    },
    NOMES_VARIACIO: {
        etiqueta: 'només el que varia',
        missatge: "Això és només el que puja o baixa. El resultat és la quantitat de partida per l'índex.",
    },
    SUMA_PERCENT: {
        etiqueta: 'tant per cent sumat o restat',
        missatge: "El tant per cent no se suma ni es resta directament: es multiplica la quantitat per l'índex.",
    },
    MULTIPLICA: {
        etiqueta: 'multiplica en lloc de dividir',
        missatge: "Ja tens la quantitat final: per tornar a la d'abans, cal dividir per l'índex, no multiplicar.",
    },
    DESFER_PERCENT: {
        etiqueta: 'desfer amb el percentatge contrari',
        missatge:
            "Desfer una rebaixa del 20 % no és augmentar un 20 %: aquell 20 % era de la quantitat d'abans. Divideix per l'índex.",
    },
    DIVIDEIX_INVERS: {
        etiqueta: 'divisió girada',
        missatge: 'Has dividit al revés: és la part entre el total.',
    },
    PER_100: {
        etiqueta: 'sense multiplicar per 100',
        missatge: 'Per passar a percentatge, es multiplica per 100: 0,36 = 36 %.',
    },
    SUMA_INDEXS: {
        etiqueta: 'índexs sumats',
        missatge: 'Els índexs de dos canvis seguits es multipliquen, no se sumen.',
    },
    SUMA_PERCENTATGES: {
        etiqueta: 'percentatges sumats',
        missatge:
            'Els percentatges encadenats no se sumen: +20 % i −10 % no fan +10 %, perquè el segon es calcula sobre la quantitat ja canviada. Es multipliquen els índexs.',
    },
    INDEX_COM_PERCENT: {
        etiqueta: "l'índex com a percentatge",
        missatge: "L'índex no és la variació: × 1,08 vol dir que puja un 8 %, i × 0,92, que baixa un 8 %.",
    },
};

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaPE(pas, valors) {
    try {
        const errorType = errorPerDistractors(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_PE[errorType] } : null;
    } catch (e) {
        return null;
    }
}
