/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/errors.js
 * ROL: Taxonomia d'errors d'«Inequacions» i diagnòstic de cada resposta incorrecta
 *      (el mateix contracte que js/formules-steam/errors.js). Els passos de resoldre i
 *      l'interval porten, a dades.distractors, els valors que donen els errors típics
 *      (math-engine.js); la recta es diagnostica aquí (el nombre, el punt, el costat).
 * Mòdul pur: es prova a tests/inequacions.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

export const ERRORS_IQ = {
    SIGNE_NO_GIRAT: {
        etiqueta: 'signe sense girar',
        missatge:
            'Has dividit els dos membres per un nombre negatiu: el signe de la desigualtat s’ha de girar (< passa a >, ≤ passa a ≥).',
    },
    SIGNE_GIRAT_POSITIU: {
        etiqueta: 'signe girat sense motiu',
        missatge: 'Has dividit per un nombre positiu: el signe es queda com estava. Només es gira amb un negatiu.',
    },
    SIGNE_GIRAT_SENSE_MOTIU: {
        etiqueta: 'signe girat en passar un terme',
        missatge: 'Sumar o restar el mateix als dos membres no canvia el signe de la desigualtat.',
    },
    SIGNE_ESTRICTE: {
        etiqueta: '< per ≤',
        missatge: 'Compte: < i ≤ no són el mateix. Si hi havia «o igual» (≤, ≥), s’hi queda.',
    },
    TERME_SIGNE: {
        etiqueta: 'signe en passar',
        missatge: 'El que suma en un membre passa a l’altre restant, i el que resta, sumant.',
    },
    SIGNE_COEFICIENT: {
        etiqueta: 'signe del coeficient',
        missatge: 'Mira el signe que té davant la x: el coeficient el porta.',
    },
    MULTIPLICA: {
        etiqueta: 'multiplicar en lloc de dividir',
        missatge: 'El coeficient multiplica la x: per aïllar-la, divideix els dos membres pel coeficient.',
    },
    RESTA: {
        etiqueta: 'restar en lloc de dividir',
        missatge: 'El coeficient multiplica la x: es desfà dividint, no restant.',
    },
    SIGNE_QUOCIENT: {
        etiqueta: 'signe del quocient',
        missatge: 'Compte amb el signe del quocient: menys entre menys és més, i menys entre més és menys.',
    },
    QUOCIENT_GIRAT: {
        etiqueta: 'quocient girat',
        missatge: 'Es divideix el nombre entre el coeficient de la x, no al revés.',
    },
    DISTRIBUTIVA: {
        etiqueta: 'distributiva a mitges',
        missatge: 'El nombre de fora del parèntesi multiplica tots els termes de dins, també el nombre.',
    },
    NOMES_UN_MEMBRE: {
        etiqueta: 'només un membre',
        missatge: 'Multiplica els dos membres pel mcm, també el que no té denominador.',
    },
    MCM_SENSE_DIVIDIR: {
        etiqueta: 'mcm sense dividir',
        missatge: 'Cada fracció es multiplica pel mcm: el mcm entre el denominador és el que queda multiplicant.',
    },
    VALOR_RECTA: {
        etiqueta: 'nombre equivocat a la recta',
        missatge: 'El punt va al nombre de la solució.',
    },
    PUNT_PLE: {
        etiqueta: 'punt ple per buit',
        missatge: 'Amb < o > el nombre no hi entra: el punt ha de ser buit.',
    },
    PUNT_BUIT: {
        etiqueta: 'punt buit per ple',
        missatge: 'Amb ≤ o ≥ el nombre hi entra: el punt ha de ser ple.',
    },
    COSTAT: {
        etiqueta: 'costat equivocat',
        missatge: 'x < 2 són els nombres més petits que 2: cap a l’esquerra. x > 2, cap a la dreta.',
    },
    CLAUDATOR: {
        etiqueta: 'claudàtor per parèntesi',
        missatge: 'Si el nombre hi entra (≤, ≥), claudàtor [ ]; si no hi entra (<, >), parèntesi ( ).',
    },
    INFINIT_TANCAT: {
        etiqueta: 'claudàtor a l’infinit',
        missatge: 'Al costat de l’infinit sempre hi va parèntesi: l’infinit no és un nombre.',
    },
    EXTREM: {
        etiqueta: 'extrem equivocat',
        missatge: 'L’extrem de l’interval és el nombre de la solució, amb el seu signe.',
    },
    COSTAT_INTERVAL: {
        etiqueta: 'interval al revés',
        missatge: 'L’interval s’escriu de petit a gran: x < 2 és (−∞, 2); x > 2 és (2, +∞).',
    },
};

/** El diagnòstic de la recta: primer el nombre, després el punt i, finalment, el costat. */
function diagnosticaRecta(pas, valors) {
    const r = valors.rc;
    const sol = pas.solucio.rc;
    if (!r) return null;
    if (r.i !== sol.i) return 'VALOR_RECTA';
    if (r.ple !== sol.ple) return sol.ple ? 'PUNT_BUIT' : 'PUNT_PLE';
    if (r.costat !== sol.costat) return 'COSTAT';
    return null;
}

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaIQ(pas, valors) {
    try {
        const errorType =
            pas.mena === 'recta' ? diagnosticaRecta(pas, valors || {}) : errorPerDistractors(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_IQ[errorType] } : null;
    } catch (e) {
        return null;
    }
}
