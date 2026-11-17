/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/errors.js
 * ROL: Taxonomia d'errors de «Fórmules STEAM» i diagnòstic de cada resposta
 *      incorrecta (el mateix contracte que js/canvi-unitats/errors.js). Cada pas porta,
 *      a dades.distractors, les opcions o els valors que donen els errors típics
 *      (math-engine.js i algebra.js); aquí es diu què vol dir cadascun.
 * Mòdul pur: es prova a tests/formules-steam.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

export const ERRORS_FS = {
    SUBSTITUCIO: {
        etiqueta: 'dades a la lletra equivocada',
        missatge: 'Cada dada va a la seva lletra: fixa’t en la unitat de cada dada i en el que vol dir cada lletra.',
    },
    RESTA_EN_LLOC_DE_DIVIDIR: {
        etiqueta: 'restar en lloc de dividir',
        missatge: 'La lletra està multiplicada: una multiplicació es desfà dividint els dos membres, no restant.',
    },
    MULTIPLICA_EN_LLOC_DE_DIVIDIR: {
        etiqueta: 'multiplicar en lloc de dividir',
        missatge: 'El que multiplica en un membre passa a l’altre dividint: has de dividir els dos membres.',
    },
    QUOCIENT_GIRAT: {
        etiqueta: 'quocient girat',
        missatge:
            'Compte amb l’ordre: el que ja hi havia a l’altre membre es divideix entre el que treus (t = e / v, no v / e).',
    },
    DIVIDEIX_EN_LLOC_DE_MULTIPLICAR: {
        etiqueta: 'dividir en lloc de multiplicar',
        missatge: 'Hi ha un denominador: una divisió es desfà multiplicant els dos membres, no dividint.',
    },
    RESTA_EN_LLOC_DE_MULTIPLICAR: {
        etiqueta: 'restar en lloc de multiplicar',
        missatge: 'Hi ha un denominador: una divisió es desfà multiplicant els dos membres.',
    },
    NOMES_UN_MEMBRE: {
        etiqueta: 'només un membre',
        missatge:
            'El que fas en un membre ho has de fer a l’altre: si multipliques per t, multiplica tots dos membres (v · t = e, no v = e · t).',
    },
    OBLIDA_MEITAT: {
        etiqueta: 'el ½ oblidat',
        missatge: 'No t’oblidis del ½: per treure’l, multiplica els dos membres per 2.',
    },
    SIGNE_EN_PASSAR: {
        etiqueta: 'signe en passar',
        missatge: 'El que suma en un membre passa a l’altre restant, i el que resta, sumant.',
    },
    DIVIDEIX_EN_LLOC_DE_RESTAR: {
        etiqueta: 'dividir en lloc de restar',
        missatge: 'Una suma es desfà restant (i una resta, sumant), no dividint.',
    },
    ARREL_COM_MEITAT: {
        etiqueta: 'arrel com a meitat',
        missatge: 'Un quadrat es desfà amb l’arrel quadrada, que no és dividir entre 2 (ni multiplicar per 2).',
    },
    QUADRAT_EN_LLOC_D_ARREL: {
        etiqueta: 'quadrat en lloc d’arrel',
        missatge: 'Per desfer un quadrat es fa l’arrel quadrada dels dos membres, no s’eleva al quadrat.',
    },
    ARREL_UNA_PART: {
        etiqueta: 'arrel d’una sola part',
        missatge: 'L’arrel és de tot el membre: √(2 · Ec / m), no només d’una part.',
    },
    UNITAT: {
        etiqueta: 'unitat equivocada',
        missatge: 'Opera amb les unitats com si fossin lletres: km : (km/h) = h, N : kg = m/s².',
    },
};

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaFS(pas, valors) {
    try {
        const errorType = errorPerDistractors(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_FS[errorType] } : null;
    } catch (e) {
        return null;
    }
}
