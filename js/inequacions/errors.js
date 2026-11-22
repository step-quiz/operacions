/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/errors.js
 * ROL: Taxonomia d'errors d'«Inequacions» i diagnòstic de cada resposta incorrecta
 *      (el mateix contracte que js/formules-steam/errors.js). Els passos de resoldre i
 *      l'interval porten, a dades.distractors, els valors que donen els errors típics
 *      (math-engine.js); la recta es diagnostica aquí (el nombre, el punt, el costat).
 *      2n grau i racionals (no-lineals.js, lliurament 22c): els passos de triar (el valor de
 *      l'opció és l'error), els zeros (signe, numerador i denominador intercanviats), la
 *      taula de signes (punt de prova fora, 0 on no existeix, ∄ on val 0, signe) i la recta
 *      amb trams (zero del denominador inclòs, punt ple o buit, signe contrari, un sol costat).
 * Mòdul pur: es prova a tests/inequacions.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors), passos/taula-signes.js (cellesMalament).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';
import { cellesMalament } from '../passos/taula-signes.js';

export const ERRORS_IQ = {
    SIGNE_NO_GIRAT: {
        etiqueta: 'el signe no ha canviat',
        missatge:
            'Has dividit els dos membres per un nombre negatiu: el signe de desigualtat canvia (< passa a >, ≤ passa a ≥).',
    },
    SIGNE_GIRAT_POSITIU: {
        etiqueta: 'signe canviat sense motiu',
        missatge:
            'Has dividit per un nombre positiu: el signe de desigualtat no canvia. Només canvia si multipliques o divideixes per un negatiu.',
    },
    SIGNE_GIRAT_SENSE_MOTIU: {
        etiqueta: 'signe canviat en passar un terme',
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

/** Els errors de les inequacions de 2n grau i racionals (lliurament 22c, no-lineals.js). */
export const ERRORS_NL = {
    ARREL_UN_COSTAT: {
        etiqueta: 'x² > 4 → x > 2',
        missatge:
            'x² > 4 no vol dir només x > 2: x = −3 també hi compleix ((−3)² = 9 > 4). Passa-ho tot a un costat (x² − 4 > 0) i fes la taula de signes.',
    },
    PASSA_SIGNE: {
        etiqueta: 'signe en passar',
        missatge: 'El que suma en un membre passa a l’altre restant: x² ≤ 9 → x² − 9 ≤ 0.',
    },
    SENTIT_PASSA: {
        etiqueta: 'el 0 a l’altre costat',
        missatge:
            'Si ho passes tot a la dreta, el 0 queda a l’esquerra: x² > 3x ⟺ 0 > −x² + 3x. Passa-ho tot a l’esquerra i el signe es queda igual.',
    },
    DIVIDEIX_X: {
        etiqueta: 'dividir per x',
        missatge:
            'No es pot dividir per x: no saps si és positiva o negativa (i, si és negativa, el signe de desigualtat canvia). Passa-ho tot a un costat: x² − 3x > 0.',
    },
    MULTIPLICA_DEN: {
        etiqueta: 'multiplicar pel denominador',
        missatge:
            'No pots multiplicar pel denominador ni treure’l: no saps si és positiu o negatiu (si és negatiu, el signe de desigualtat canvia). Passa el nombre a l’esquerra i fes una sola fracció.',
    },
    RESTA_SENSE_DEN: {
        etiqueta: 'restar sense el denominador',
        missatge:
            'Per restar k cal posar-lo amb el mateix denominador: (x + 3)/(x − 1) − 2 = (x + 3 − 2(x − 1))/(x − 1).',
    },
    DISTRIBUTIVA_FRACCIO: {
        etiqueta: 'distributiva al numerador',
        missatge: '−2(x − 1) = −2x + 2: el −2 multiplica també el −1, i menys per menys és més.',
    },
    SIGNE_ZEROS: {
        etiqueta: 'signe dels zeros',
        missatge: 'x − 3 = 0 → x = 3 (no −3). Comprova-ho substituint: el polinomi hi ha de valer 0.',
    },
    ZEROS: {
        etiqueta: 'zeros',
        missatge: 'Iguala a 0 i resol. Comprova cada solució substituint-la: hi ha de valer 0.',
    },
    ZEROS_GIRATS: {
        etiqueta: 'numerador i denominador intercanviats',
        missatge: 'El zero del numerador és on s’anul·la el de dalt; el del denominador, on s’anul·la el de baix.',
    },
    SENSE_ZEROS_REALS: {
        etiqueta: 'arrel d’un negatiu',
        missatge: 'x² + 4 = 0 vol dir x² = −4, i un quadrat mai és negatiu: no s’anul·la mai i sempre és positiu.',
    },
    ZERO_DOBLE: {
        etiqueta: 'solució doble',
        missatge: 'x² − 4x + 4 = (x − 2)²: només s’anul·la a x = 2 (solució doble). A x = −2 val 16.',
    },
    PROVA_FORA: {
        etiqueta: 'punt de prova fora de l’interval',
        missatge: 'El punt de prova ha de ser de dins de l’interval de la seva columna (sense els extrems).',
    },
    SIGNE_TAULA: {
        etiqueta: 'signe de la taula',
        missatge: 'Substitueix el punt de prova a l’expressió i mira si dona positiu o negatiu.',
    },
    DEN_ZERO_TAULA: {
        etiqueta: '0 on no existeix',
        missatge: 'On s’anul·la el denominador, la fracció no existeix (∄): no hi val 0.',
    },
    ZERO_NO_EXISTEIX: {
        etiqueta: '∄ on val 0',
        missatge: 'On s’anul·la el numerador (i el denominador no), la fracció existeix i val 0.',
    },
    TRAMS_SENTIT: {
        etiqueta: 'trams del signe contrari',
        missatge:
            'Mira el signe que demana la inequació: amb > 0 (o ≥ 0), on la taula diu +; amb < 0 (o ≤ 0), on diu −.',
    },
    TRAMS: {
        etiqueta: 'trams equivocats',
        missatge: 'Mira la taula: la solució són els trams on el signe és el que demana la inequació.',
    },
    DEN_INCLOS: {
        etiqueta: 'zero del denominador inclòs',
        missatge:
            'Un zero del denominador mai és solució: la fracció no hi existeix. Punt buit, i parèntesi a l’interval.',
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

// ── 2n grau i racionals ─────────────────────────────────────────────────────
function diagnosticaZerosNL(pas, valors) {
    const [r1, r2] = pas.dades.arrels;
    const e = [valors.x1, valors.x2].sort((p, q) => p - q);
    const op = [-r1, -r2].sort((p, q) => p - q);
    if (e[0] === op[0] && e[1] === op[1]) return 'SIGNE_ZEROS';
    return 'ZEROS';
}
function diagnosticaZerosFraccio(pas, valors) {
    const { zn, zd } = pas.dades;
    if (valors.n === zd && valors.d === zn) return 'ZEROS_GIRATS';
    if ((valors.n !== zn && valors.n === -zn) || (valors.d !== zd && valors.d === -zd)) return 'SIGNE_ZEROS';
    return 'ZEROS';
}
function diagnosticaTaulaNL(pas, valors) {
    const t = valors.taula;
    if (!t) return null;
    const taula = pas.plantilla[0].taula;
    const dolentes = cellesMalament(t, pas.solucio.taula, taula);
    if (dolentes.some(d => d.fila === 'prova')) return 'PROVA_FORA';
    const sol = pas.solucio.taula.files.s;
    const escrit = t.files.s;
    if (dolentes.some(d => sol[d.col] === 'no' && escrit[d.col] === 'zero')) return 'DEN_ZERO_TAULA';
    if (dolentes.some(d => sol[d.col] === 'zero' && escrit[d.col] === 'no')) return 'ZERO_NO_EXISTEIX';
    return 'SIGNE_TAULA';
}
function diagnosticaTrams(pas, valors) {
    const r = valors.rt;
    if (!r) return null;
    const { trams, inclosos, punts } = pas.dades;
    if (punts.some((p, k) => p.den && r.inclosos[k])) return 'DEN_INCLOS';
    const tramsBons = r.trams.every((t, k) => t === trams[k]);
    if (tramsBons) {
        const k = punts.findIndex((p, i) => r.inclosos[i] !== inclosos[i]);
        if (k < 0) return null;
        return inclosos[k] ? 'PUNT_BUIT' : 'PUNT_PLE';
    }
    if (trams.length > 1 && r.trams.every((t, k) => t === !trams[k])) return 'TRAMS_SENTIT';
    // Només un dels dos trams de les vores (x² > 4 → x > 2), o la meitat del del mig (x² < 4 → x < 2)
    if (trams.length === 3 && trams[0] && trams[2] && r.trams[0] !== r.trams[2] && !r.trams[1])
        return 'ARREL_UN_COSTAT';
    if (trams.length === 3 && trams[1] && !trams[0] && !trams[2] && r.trams[1] && r.trams[0] !== r.trams[2])
        return 'ARREL_UN_COSTAT';
    return 'TRAMS';
}

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaIQ(pas, valors) {
    try {
        const v = valors || {};
        const errorType =
            pas.mena === 'recta'
                ? diagnosticaRecta(pas, v)
                : pas.mena === 'tria'
                  ? String(v.tria || '').split('#')[0] || null
                  : pas.mena === 'zerosNL'
                    ? diagnosticaZerosNL(pas, v)
                    : pas.mena === 'zerosFraccio'
                      ? diagnosticaZerosFraccio(pas, v)
                      : pas.mena === 'taulaNL'
                        ? diagnosticaTaulaNL(pas, v)
                        : pas.mena === 'trams'
                          ? diagnosticaTrams(pas, v)
                          : errorPerDistractors(pas, v);
        const e = errorType && (ERRORS_IQ[errorType] || ERRORS_NL[errorType]);
        return e ? { errorType, ...e } : null;
    } catch (e) {
        return null;
    }
}
