/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/expressions-algebraiques/errors.js
 * ROL: Taxonomia d'errors d'«Expressions algebraiques» i diagnòstic de cada
 *      resposta incorrecta (el mateix contracte que js/fraccions/errors-fraccions.js).
 *
 * Com es reconeix un error: es torna a desenvolupar l'expressió amb una regla
 * equivocada (sumar els coeficients en lloc de multiplicar-los, multiplicar només
 * el primer terme del parèntesi, oblidar els productes creuats…). Si el resultat
 * és el que ha escrit l'alumne, l'error és aquell. També es miren el signe d'un
 * sol terme, el coeficient 1 deixat en blanc i ajuntar termes que no són semblants.
 *
 * Mòdul pur: no toca el DOM (es prova a tests/expressions-algebraiques.test.js).
 * DEPENDÈNCIES: algebra/polinomis.js, passos/correccio.js i math-engine.js.
 * ============================================================================
 */

import {
    desenvolupa,
    grauMonomi,
    monomi,
    multiplicaMonomis,
    multiplicaPolinomis,
    polinomisIguals,
    redueixPolinomi,
} from '../algebra/polinomis.js';
import { coeficientUnEnBlanc } from '../passos/correccio.js';
import { polinomiDeValorsEA } from './math-engine.js';

// etiqueta: com es diu l'error a l'historial · missatge: el que llegeix l'alumne
export const ERRORS_EA = {
    COEF_U: {
        etiqueta: 'coeficient 1 en blanc',
        missatge:
            'Si un terme hi és amb coeficient 1 o −1, escriu-lo: una casella en blanc vol dir que aquell terme no hi és.',
    },
    SEMBLANTS_NO: {
        etiqueta: 'termes no semblants sumats',
        missatge: 'Només se sumen els termes semblants, els que tenen la mateixa part literal: 3x + 2 no fa 5x.',
    },
    SUMA_EXPONENTS: {
        etiqueta: 'x + x = x²',
        missatge: 'En sumar termes semblants, la part literal no canvia: x + x = 2x, no x².',
    },
    SIGNE_TERME: {
        etiqueta: "signe d'un terme",
        missatge: "Cada terme porta el signe que té just davant. Repassa'ls un per un.",
    },
    COEF_SUMA: {
        etiqueta: 'coeficients sumats',
        missatge: 'En un producte de monomis, els coeficients es multipliquen, no se sumen.',
    },
    EXP_MULTIPLICA: {
        etiqueta: 'exponents multiplicats',
        missatge: 'Els exponents de la mateixa lletra se sumen: x² · x³ = x⁵, no x⁶.',
    },
    EXP_NO_SUMA: {
        etiqueta: 'x · x = 2x',
        missatge: 'x · x = x², no 2x ni x: en multiplicar, els exponents de la mateixa lletra se sumen.',
    },
    SIGNE_PRODUCTE: {
        etiqueta: 'regla dels signes',
        missatge: 'Repassa el signe de cada producte: menys per menys fa més, i menys per més fa menys.',
    },
    DIST_NOMES_PRIMER: {
        etiqueta: 'distributiva incompleta',
        missatge: 'El que hi ha fora del parèntesi multiplica tots els termes de dins, no només el primer.',
    },
    DIST_MENYS: {
        etiqueta: 'menys davant del parèntesi',
        missatge: 'Un menys davant del parèntesi canvia el signe de tots els termes de dins: −(x − 3) = −x + 3.',
    },
    BINOMIS_CREUATS: {
        etiqueta: 'falten els productes creuats',
        missatge: 'Cada terme del primer parèntesi multiplica cada terme del segon: et falten els productes creuats.',
    },
};

// ── Multiplicacions equivocades ──────────────────────────────────────────────
const lletresEA = (a, b) => [...new Set([...Object.keys(a.e), ...Object.keys(b.e)])];

// x² · x³ = x⁶
function producteMultiplicantExponentsEA(a, b) {
    const e = {};
    for (const l of lletresEA(a, b)) {
        const [p, q] = [a.e[l] || 0, b.e[l] || 0];
        e[l] = p && q ? p * q : p + q;
    }
    return monomi(a.c * b.c, e);
}
// 3x · 2x = 5x²
function producteSumantCoeficientsEA(a, b) {
    return { ...multiplicaMonomis(a, b), c: a.c + b.c };
}
// x · x = x (l'exponent no se suma)
function producteSenseSumarExponentsEA(a, b) {
    const e = {};
    for (const l of lletresEA(a, b)) e[l] = Math.max(a.e[l] || 0, b.e[l] || 0);
    return monomi(a.c * b.c, e);
}
const ambProducteEA = producte => (p, q) => multiplicaPolinomis(p, q, producte);

const MULTIPLICACIONS_EA = {
    // 2(x + 3) = 2x + 3
    nomesPrimer: (p, q) =>
        p.length === 1 && q.length > 1 ? [multiplicaMonomis(p[0], q[0]), ...q.slice(1)] : multiplicaPolinomis(p, q),
    // −(x − 3) = −x − 3: el menys només canvia el signe del primer terme
    menysNomesPrimer: (p, q) =>
        p.length === 1 && p[0].c < 0 && q.length > 1
            ? [multiplicaMonomis(p[0], q[0]), ...q.slice(1).map(t => multiplicaMonomis({ ...p[0], c: -p[0].c }, t))]
            : multiplicaPolinomis(p, q),
    // (x + 2)(x + 3) = x² + 6
    senseCreuats: (p, q) =>
        p.length === 2 && q.length === 2
            ? [multiplicaMonomis(p[0], q[0]), multiplicaMonomis(p[1], q[1])]
            : multiplicaPolinomis(p, q),
};

// En ordre: la primera regla que explica la resposta és el diagnòstic
const REGLES_EA = [
    // (x · x = x: abans que «exponents multiplicats», que amb exponents 1 dona el mateix)
    {
        errorType: 'EXP_NO_SUMA',
        menes: ['monomis', 'distributiva', 'binomis'],
        multiplica: ambProducteEA(producteSenseSumarExponentsEA),
    },
    { errorType: 'EXP_MULTIPLICA', menes: ['monomis'], multiplica: ambProducteEA(producteMultiplicantExponentsEA) },
    { errorType: 'COEF_SUMA', menes: ['monomis'], multiplica: ambProducteEA(producteSumantCoeficientsEA) },
    { errorType: 'DIST_MENYS', menes: ['distributiva', 'binomis'], multiplica: MULTIPLICACIONS_EA.menysNomesPrimer },
    { errorType: 'DIST_NOMES_PRIMER', menes: ['distributiva', 'binomis'], multiplica: MULTIPLICACIONS_EA.nomesPrimer },
    { errorType: 'BINOMIS_CREUATS', menes: ['binomis'], multiplica: MULTIPLICACIONS_EA.senseCreuats },
];

function errorTypeEA(pas, valors) {
    const { expr } = pas.dades;
    const alumne = polinomiDeValorsEA(pas, valors);
    const termes = desenvolupa(expr);
    const bo = redueixPolinomi(termes);
    if (polinomisIguals(alumne, bo)) return null;

    // Un terme de coeficient ±1 deixat en blanc (i la resta, bé)
    if (pas.mena !== 'monomis' && coeficientUnEnBlanc(pas, valors)) return 'COEF_U';

    for (const regla of REGLES_EA) {
        if (!regla.menes.includes(pas.mena)) continue;
        const dolent = desenvolupa(expr, { multiplica: regla.multiplica });
        if (!polinomisIguals(dolent, bo) && polinomisIguals(alumne, dolent)) return regla.errorType;
    }

    // Un sol terme amb el signe canviat (un dels de l'enunciat, o un dels productes)
    for (let i = 0; i < termes.length; i++) {
        const girat = termes.map((t, j) => (j === i ? { ...t, c: -t.c } : t));
        if (!polinomisIguals(girat, bo) && polinomisIguals(alumne, girat))
            return pas.mena === 'reduir' ? 'SIGNE_TERME' : 'SIGNE_PRODUCTE';
    }

    if (pas.mena === 'reduir') {
        // x + x = x²: els termes de grau 1, elevats al quadrat
        const quadrat = bo.map(m =>
            grauMonomi(m.e) === 1 ? monomi(m.c, Object.fromEntries(Object.keys(m.e).map(l => [l, 2]))) : m
        );
        if (!polinomisIguals(quadrat, bo) && polinomisIguals(alumne, quadrat)) return 'SUMA_EXPONENTS';
        // Termes no semblants ajuntats: menys termes, i la mateixa suma de coeficients
        const suma = p => p.reduce((s, m) => s + m.c, 0);
        if (alumne.length && alumne.length < bo.length && suma(alumne) === suma(bo)) return 'SEMBLANTS_NO';
    }
    return null;
}

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @param {object} pas     el pas (de math-engine.js)
 * @param {object} valors  el que ha escrit l'alumne (els «valors» de corregeixPas)
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaEA(pas, valors) {
    try {
        const errorType = errorTypeEA(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_EA[errorType] } : null;
    } catch (e) {
        return null;
    }
}
