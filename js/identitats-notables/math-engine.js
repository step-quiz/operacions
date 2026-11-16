/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/identitats-notables/math-engine.js
 * ROL: La matemàtica d'«Identitats notables» (identitats-notables.html): genera
 *      les preguntes i els seus passos.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar). Expressions i
 *      polinomis amb js/algebra/polinomis.js; correcció comuna (js/passos/correccio.js)
 *      i joc comú (js/passos/joc-passos.js).
 *
 *   IDENTITATS  suma (a + b)² · diferencia (a − b)² · sxd (a + b)(a − b) · cap (no ho és)
 *               a és un monomi en x (2x, x, x/2) i b, un nombre o un monomi en y.
 *   TIPUS       desenvolupar  (2x − 3)²  →  quina identitat és  →  4x² − 12x + 9
 *               factoritzar   4x² − 12x + 9  →  quina identitat és (o cap)  →  (2x − 3)²
 *   NIVELLS 1-3 1: a = x · 2: a = kx · 3: coeficients més grans, (3 − 2x)², (a − b)(a + b)
 *   OPCIONS     dues: b amb y (?lletres=2) · fraccions: a o b fraccionaris (?fraccions=1)
 *
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, algebra/polinomis.js,
 *      passos/textos.js i strings.js.
 * ============================================================================
 */

import { gcd, pick, randInt, triaProgressiva } from '../utils.js';
import { coeficient, oposatCoef, producteCoef } from '../algebra/racionals.js';
import {
    desenvolupa,
    escriuExpressio,
    escriuPolinomi,
    monomi,
    multiplicaMonomis,
    parentesi,
    plantillaPolinomi,
    polinomiDeCoeficients,
    redueixPolinomi,
} from '../algebra/polinomis.js';
import { TEXTOS_PASSOS } from '../passos/textos.js';
import { TEXTOS_IN } from './strings.js';

// Opcions de ?tipus= (les del generador d'enllaços d'index.html). «Totes»: primer desenvolupar, després factoritzar.
export const TIPUS_IN = {
    '': ['desenvolupar', 'factoritzar'],
    'desenvolupar': ['desenvolupar'],
    'factoritzar': ['factoritzar'],
};

export function tipusIN(opcio, index, total) {
    return triaProgressiva(TIPUS_IN[opcio] || TIPUS_IN[''], index, total);
}

export const QUADRATS_IN = ['suma', 'diferencia'];

// ── Monomis ──────────────────────────────────────────────────────────────────
export const oposatIN = m => monomi(oposatCoef(m.c), m.e);
export const escalaIN = (m, k) => monomi(producteCoef(m.c, k), m.e);
export const quadratIN = m => multiplicaMonomis(m, m);
const textIN = m => escriuPolinomi([m], { tex: false });

/** Una fracció p/q irreductible que no és un enter (1/2, 3/4, 2/5…). */
function fraccioIN() {
    for (;;) {
        const q = randInt(2, 5);
        const p = randInt(1, 3);
        if (gcd(p, q) === 1) return coeficient(p, q);
    }
}

/** Els termes a (amb x) i b (nombre, o amb y), amb coeficients positius. */
export function termesIN(nivell, dues = false, fraccions = false) {
    let ka = nivell === 1 ? 1 : nivell === 2 ? pick([2, 2, 3, 3, 4, 5]) : randInt(1, 6);
    let kb = randInt(1, nivell === 2 ? 7 : 9);
    if (fraccions && randInt(1, 100) <= 60) {
        // Al nivell 1, a és sempre x: la fracció és la de b
        if (nivell === 1 || randInt(0, 1)) kb = fraccioIN();
        else ka = fraccioIN();
    }
    return { a: monomi(ka, { x: 1 }), b: monomi(kb, dues ? { y: 1 } : {}) };
}

/** El binomi d'un quadrat: a + b o a − b. */
function binomiIN(identitat, a, b) {
    return identitat === 'diferencia' ? [a, oposatIN(b)] : [a, b];
}

/** El desenvolupament (reduït) de la identitat amb aquests a i b. */
export function desenvolupamentIN(identitat, a, b) {
    if (identitat === 'sxd')
        return redueixPolinomi(
            desenvolupa([
                [
                    [a, b],
                    [a, oposatIN(b)],
                ],
            ])
        );
    const p = binomiIN(identitat, a, b);
    return redueixPolinomi(desenvolupa([[p, p]]));
}

const quadratTexIN = (p, tex = true) =>
    tex ? `${parentesi(escriuPolinomi(p))}^{2}` : `(${escriuPolinomi(p, { tex: false })})²`;

/** Un trinomi o binomi que s'hi assembla però no és cap identitat notable. */
export function noIdentitatIN(a, b) {
    const [a2, b2] = [quadratIN(a), quadratIN(b)];
    const ab = multiplicaMonomis(a, b);
    const signe = pick([1, -1]);
    const motiu = pick(['mig', 'mig', 'signe', 'suma']);
    if (motiu === 'mig') {
        // ab, 3ab o 4ab en lloc de 2ab
        const mig = escalaIN(ab, signe * pick([1, 3, 4]));
        return { motiu, polinomi: [a2, mig, b2], mig };
    }
    if (motiu === 'signe') return { motiu, polinomi: [a2, escalaIN(ab, 2 * signe), oposatIN(b2)] };
    return { motiu, polinomi: [a2, b2] };
}

// ── Passos ───────────────────────────────────────────────────────────────────
function pasClassificaIN(tipus, identitat, dades) {
    const ids = tipus === 'desenvolupar' ? ['suma', 'diferencia', 'sxd'] : ['suma', 'diferencia', 'sxd', 'cap'];
    return {
        id: 'classifica',
        mena: 'classifica',
        nom: TEXTOS_IN.nomPas.classifica,
        enunciat:
            tipus === 'desenvolupar'
                ? TEXTOS_IN.enunciat.classificaDesenvolupar
                : TEXTOS_IN.enunciat.classificaFactoritzar,
        plantilla: [],
        camps: { tria: 'tria' },
        opcions: ids.map(k => [k, TEXTOS_IN.identitat[k].opcio]),
        solucio: { tria: identitat },
        dades,
        linia: TEXTOS_IN.identitat[identitat].linia,
    };
}

function pasFactoritzaIN(identitat, a, b, dades, campNombre) {
    const lletraB = b.e.y ? [{ tex: 'y' }] : [];
    const [ka, kb] = [a.c, b.c];
    const comu = {
        id: 'factoritza',
        mena: 'factoritza',
        nom: TEXTOS_IN.nomPas.factoritza,
        enunciat: TEXTOS_IN.enunciat.factoritza,
        nota: TEXTOS_IN.nota.factoritza,
        dades,
    };
    if (identitat === 'sxd') {
        return {
            ...comu,
            plantilla: [
                { tex: '=\\Big(' },
                { camp: 'p' },
                { tex: 'x\\;+' },
                { camp: 'q' },
                ...lletraB,
                { tex: '\\Big)\\Big(' },
                { camp: 'r' },
                { tex: 'x\\;-' },
                { camp: 's' },
                ...lletraB,
                { tex: '\\Big)' },
            ],
            camps: { p: campNombre, q: campNombre, r: campNombre, s: campNombre },
            solucio: { p: ka, q: kb, r: ka, s: kb },
            alternatives: [{ p: oposatCoef(ka), q: oposatCoef(kb), r: oposatCoef(ka), s: oposatCoef(kb) }],
            linia: `= ${escriuExpressio([
                [
                    [a, b],
                    [a, oposatIN(b)],
                ],
            ])}`,
        };
    }
    return {
        ...comu,
        plantilla: [
            { tex: '=\\Big(' },
            { camp: 'p' },
            { tex: identitat === 'suma' ? 'x\\;+' : 'x\\;-' },
            { camp: 'q' },
            ...lletraB,
            { tex: '\\Big)^{2}' },
        ],
        camps: { p: campNombre, q: campNombre },
        solucio: { p: ka, q: kb },
        alternatives: [{ p: oposatCoef(ka), q: oposatCoef(kb) }],
        linia: `= ${quadratTexIN(binomiIN(identitat, a, b))}`,
    };
}

/** Les claus de la plantilla de desenvolupar: x², x i 1 (o x², xy i y²). */
export function clausIN(dues) {
    return dues ? ['x2', 'x1y1', 'y2'] : ['x2', 'x1', 'k'];
}

/**
 * Una pregunta nova: { tipus, identitat, tex, text, passos } (a factoritzar, també el polinomi).
 * @param {object} opcions  dues: b amb y · fraccions: coeficients fraccionaris
 */
export function generaPreguntaIN(tipus, nivell, { dues = false, fraccions = false } = {}) {
    const n = Math.min(3, Math.max(1, nivell));
    const { a, b } = termesIN(n, dues, fraccions);
    if (tipus === 'desenvolupar') {
        // Al nivell 3, de vegades (b − a)² o (a − b)(a + b)
        const gira = n === 3 && randInt(0, 1) === 1;
        return preguntaIN(tipus, pick(['suma', 'diferencia', 'sxd']), a, b, { dues, fraccions, gira });
    }
    // Factoritzar: el polinomi d'una identitat o, de vegades, un que s'hi assembla i no ho és
    const identitat = pick(['suma', 'suma', 'diferencia', 'diferencia', 'sxd', 'sxd', 'cap']);
    const fals = identitat === 'cap' ? noIdentitatIN(a, b) : null;
    return preguntaIN(tipus, identitat, a, b, { dues, fraccions, fals });
}

/**
 * La pregunta d'una identitat amb uns a i b donats (els tests la fan servir directament).
 * @param {object} opcions  gira: (b − a)² o (a − b)(a + b) en desenvolupar · fals: el de noIdentitatIN, si és «cap»
 */
export function preguntaIN(
    tipus,
    identitat,
    a,
    b,
    { dues = false, fraccions = false, gira = false, fals = null } = {}
) {
    const [a2, b2] = [quadratIN(a), quadratIN(b)];
    const dades = {
        tipus,
        identitat,
        a,
        b,
        dues,
        // Per als missatges dels errors
        textA: textIN(a),
        textB: textIN(b),
        textA2: textIN(a2),
        textB2: textIN(b2),
        textDoble: textIN(escalaIN(multiplicaMonomis(a, b), 2)),
    };

    if (tipus === 'desenvolupar') {
        let tex, text;
        if (identitat === 'sxd') {
            const factors = [
                [a, b],
                [a, oposatIN(b)],
            ];
            if (gira) factors.reverse();
            tex = escriuExpressio([factors]);
            text = escriuExpressio([factors], { tex: false });
        } else {
            const p = identitat === 'diferencia' && gira ? [b, oposatIN(a)] : binomiIN(identitat, a, b);
            tex = quadratTexIN(p);
            text = quadratTexIN(p, false);
        }
        const resultat = desenvolupamentIN(identitat, a, b);
        const desenvolupaPas = {
            id: 'desenvolupa',
            mena: 'desenvolupa',
            nom: TEXTOS_IN.nomPas.desenvolupa,
            enunciat: TEXTOS_IN.enunciat.desenvolupa,
            ...plantillaPolinomi(clausIN(dues), resultat, fraccions ? 'coeficientRacional' : 'coeficient'),
            nota: TEXTOS_PASSOS.notes.polinomi,
            dades,
            linia: `= ${escriuPolinomi(resultat)}`,
        };
        return { tipus, identitat, tex, text, passos: [pasClassificaIN(tipus, identitat, dades), desenvolupaPas] };
    }

    let polinomi;
    if (identitat === 'cap') {
        polinomi = redueixPolinomi(fals.polinomi);
        dades.motiu = fals.motiu;
        if (fals.mig) dades.textMig = textIN(fals.mig);
    } else polinomi = desenvolupamentIN(identitat, a, b);
    const passos = [pasClassificaIN(tipus, identitat, dades)];
    if (identitat !== 'cap') passos.push(pasFactoritzaIN(identitat, a, b, dades, fraccions ? 'racional' : 'enter'));
    return {
        tipus,
        identitat,
        polinomi,
        tex: escriuPolinomi(polinomi),
        text: escriuPolinomi(polinomi, { tex: false }),
        passos,
    };
}

/** La resposta, en text pla, per a l'historial. */
export function textRespostaIN(pas, valors) {
    if (pas.mena === 'desenvolupa')
        return escriuPolinomi(polinomiDeCoeficients(valors, clausIN(pas.dades.dues)), { tex: false });
    if (pas.mena === 'factoritza') {
        const coef = v => (Array.isArray(v) ? coeficient(v[0], v[1]) : v);
        const ambY = pas.dades.dues ? { y: 1 } : {};
        const a = monomi(coef(valors.p), { x: 1 });
        const b = monomi(coef(valors.q), ambY);
        if (pas.dades.identitat !== 'sxd') return quadratTexIN(binomiIN(pas.dades.identitat, a, b), false);
        const c = monomi(coef(valors.r), { x: 1 });
        const d = monomi(coef(valors.s), ambY);
        return escriuExpressio(
            [
                [
                    [a, b],
                    [c, oposatIN(d)],
                ],
            ],
            { tex: false }
        );
    }
    const opcio = pas.opcions.find(([valor]) => valor === valors.tria);
    return opcio ? opcio[1] : '';
}
