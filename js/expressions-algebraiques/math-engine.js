/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/expressions-algebraiques/math-engine.js
 * ROL: La matemàtica d'«Expressions algebraiques» (expressions-algebraiques.html):
 *      genera les expressions i el pas que les resol.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar). Les expressions es
 *      guarden i s'escriuen amb js/algebra/polinomis.js; la correcció és la comuna
 *      (js/passos/correccio.js) i el joc, el de js/passos/joc-passos.js.
 *
 *   TIPUS       reduir        3x + 2 − 5x + 7                    (termes semblants)
 *               monomis       3x² · (−2x³)                        (producte de monomis)
 *               distributiva  −(x − 3) · 2x(x + 4) · 2(x − 1) − 3(x + 2)
 *               binomis       (2x − 1)(x + 3)
 *   NIVELLS 1-3 Més termes, coeficients negatius i ±1, més factors, sumes de productes.
 *   LLETRES     Una (x) o dues (x i y): ?lletres=2.
 *
 *   El resultat sempre té grau ≤ 2 (menys al producte de monomis), i es respon
 *   omplint el coeficient de cada terme possible (x², x i 1; amb dues lletres,
 *   x², xy, y², x, y i 1): una casella en blanc vol dir que el terme no hi és.
 *   Al producte de monomis es respon el coeficient i l'exponent de cada lletra.
 *
 * DEPENDÈNCIES: utils.js, algebra/polinomis.js, passos/textos.js i strings.js.
 * ============================================================================
 */

import { pick, randInt, shuffle, triaProgressiva } from '../utils.js';
import {
    clauMonomi,
    desenvolupa,
    escriuExpressio,
    escriuPolinomi,
    monomi,
    plantillaPolinomi,
    polinomiDeCoeficients,
    redueixPolinomi,
} from '../algebra/polinomis.js';
import { TEXTOS_PASSOS } from '../passos/textos.js';
import { TEXTOS_EA } from './strings.js';

// Opcions de ?tipus= (les mateixes que el generador d'enllaços d'index.html) → tipus que hi surten.
// «Totes» els fa sortir un rere l'altre, en aquest ordre, al llarg de la sessió.
export const TIPUS_EA = {
    '': ['reduir', 'monomis', 'distributiva', 'binomis'],
    'reduir': ['reduir'],
    'monomis': ['monomis'],
    'distributiva': ['distributiva'],
    'binomis': ['binomis'],
};

/** El tipus de la pregunta número `index` (de `total`). */
export function tipusEA(opcio, index, total) {
    return triaProgressiva(TIPUS_EA[opcio] || TIPUS_EA[''], index, total);
}

// Un monomi en x i y: mEA(3, 2, 1) és 3x²y
const mEA = (c, x = 0, y = 0) => monomi(c, { x, y });

function enterNoZeroEA(max) {
    const n = randInt(1, max);
    return randInt(0, 1) ? n : -n;
}

// Els termes que es poden omplir a la resposta: [exponent de x, exponent de y]
const UNIVERS_EA = {
    1: [
        [2, 0],
        [1, 0],
        [0, 0],
    ],
    2: [
        [2, 0],
        [1, 1],
        [0, 2],
        [1, 0],
        [0, 1],
        [0, 0],
    ],
};

/** Les claus de les caselles de la resposta (x², x, 1 o x², xy, y², x, y, 1). */
export function universEA(dues) {
    return UNIVERS_EA[dues ? 2 : 1].map(([x, y]) => clauMonomi({ x, y }));
}

// ── Generadors ───────────────────────────────────────────────────────────────
// Totes tornen una expressió (vegeu algebra/polinomis.js): suma de productes de factors.

function generaReduirEA(nivell, dues) {
    let parts;
    if (!dues) parts = nivell === 1 ? UNIVERS_EA[1].slice(1) : UNIVERS_EA[1];
    else
        parts =
            nivell === 1
                ? [
                      [1, 0],
                      [0, 1],
                  ]
                : nivell === 2
                  ? UNIVERS_EA[2].slice(3)
                  : shuffle([...UNIVERS_EA[2]]).slice(0, 4);
    const nTermes = [0, 4, 5, 6][nivell];
    const maxC = nivell === 3 ? 12 : 9;
    for (let i = 0; i < 300; i++) {
        // Totes les parts hi surten, i les que es repeteixen, repartides (x, 1, x, 1…)
        const inici = randInt(0, parts.length - 1);
        const termes = Array.from({ length: nTermes }, (_, k) => {
            const [x, y] = parts[(inici + k) % parts.length];
            return mEA(enterNoZeroEA(maxC), x, y);
        });
        // Als nivells 2 i 3, alguns coeficients ±1 (que no s'escriuen)
        if (nivell >= 2) {
            for (const t of termes) if (randInt(1, 100) <= 25) t.c = Math.sign(t.c);
        }
        const resultat = redueixPolinomi(termes);
        if (!resultat.length) continue;
        if (nivell < 3 && resultat.length < parts.length) continue; // als primers nivells, cap terme s'anul·la
        return shuffle(termes).map(t => [[t]]);
    }
    return [[[mEA(3, 1)]], [[mEA(2)]], [[mEA(-5, 1)]], [[mEA(7)]]];
}

function generaMonomisEA(nivell, dues) {
    const nFactors = nivell === 3 ? 3 : 2;
    for (let i = 0; i < 300; i++) {
        const factors = Array.from({ length: nFactors }, () => {
            const c = nivell === 1 ? randInt(1, 6) : enterNoZeroEA(nivell === 2 ? 7 : 5);
            let x = randInt(dues ? 0 : 1, nivell === 1 ? 3 : 4);
            const y = dues ? randInt(0, 3) : 0;
            if (x + y === 0) x = 1;
            return mEA(c, x, y);
        });
        if (nivell >= 2 && factors.every(f => f.c > 0)) continue;
        if (factors.every(f => Math.abs(f.c) === 1)) continue;
        const total = l => factors.reduce((s, f) => s + f.e[l], 0);
        if (dues && (total('x') === 0 || total('y') === 0)) continue;
        return [factors.map(f => [f])];
    }
    return [[[mEA(3, 2)], [mEA(2, 3)]]];
}

// Un binomi de grau 1: a·x + b (o a·x + b·y amb dues lletres)
function binomiEA(a, b, dues) {
    return [mEA(a, 1), dues ? mEA(b, 0, 1) : mEA(b)];
}

function generaDistributivaEA(nivell, dues) {
    for (let i = 0; i < 300; i++) {
        let expr;
        if (nivell === 1) {
            expr = [[[mEA(randInt(2, 9))], binomiEA(randInt(1, 5), enterNoZeroEA(9), dues)]];
        } else if (nivell === 2) {
            // Un menys davant del parèntesi, o un monomi amb lletra
            const fora = randInt(0, 1)
                ? mEA(pick([-1, -1, -randInt(2, 9)]))
                : dues && randInt(0, 1)
                  ? mEA(enterNoZeroEA(5), 0, 1)
                  : mEA(enterNoZeroEA(5), 1);
            expr = [[[fora], binomiEA(enterNoZeroEA(5), enterNoZeroEA(9), dues)]];
        } else if (randInt(1, 100) <= 60) {
            const p = [[mEA(randInt(2, 6))], binomiEA(enterNoZeroEA(5), enterNoZeroEA(9), dues)];
            const q = [[mEA(-randInt(1, 6))], binomiEA(enterNoZeroEA(5), enterNoZeroEA(9), dues)];
            expr = [p, q];
        } else {
            const sol = randInt(0, 1) ? mEA(enterNoZeroEA(9), 1) : mEA(enterNoZeroEA(9));
            expr = [[[sol]], [[mEA(-randInt(1, 6))], binomiEA(enterNoZeroEA(5), enterNoZeroEA(9), dues)]];
        }
        if (redueixPolinomi(desenvolupa(expr)).length < 2) continue;
        return expr;
    }
    return [[[mEA(2)], binomiEA(1, 3, false)]];
}

function generaBinomisEA(nivell, dues) {
    for (let i = 0; i < 300; i++) {
        let expr;
        if (nivell === 1) {
            expr = [[binomiEA(1, enterNoZeroEA(9), dues), binomiEA(1, enterNoZeroEA(9), dues)]];
        } else {
            const [a, b] = [enterNoZeroEA(4), enterNoZeroEA(4)];
            if (Math.abs(a) === 1 && Math.abs(b) === 1) continue;
            const producte = [binomiEA(a, enterNoZeroEA(7), dues), binomiEA(b, enterNoZeroEA(7), dues)];
            if (nivell === 2) expr = [producte];
            else if (randInt(0, 1)) {
                // k − (…)(…)
                expr = [[[mEA(enterNoZeroEA(9))]], [[mEA(-1)], ...producte]];
            } else {
                // (…)(…) + mx   o   (…)(…) − k(x + r)
                const segon = randInt(0, 1)
                    ? [[mEA(enterNoZeroEA(9), 1)]]
                    : [[mEA(-randInt(2, 5))], binomiEA(1, enterNoZeroEA(5), dues)];
                expr = [producte, segon];
            }
        }
        if (redueixPolinomi(desenvolupa(expr)).length < 2) continue;
        return expr;
    }
    return [[binomiEA(1, 2, false), binomiEA(1, 3, false)]];
}

const GENERADORS_EA = {
    reduir: generaReduirEA,
    monomis: generaMonomisEA,
    distributiva: generaDistributivaEA,
    binomis: generaBinomisEA,
};

// ── El pas ───────────────────────────────────────────────────────────────────
/** El pas d'una expressió: la plantilla de la resposta, la solució i la línia resolta. */
export function pasEA(expr, tipus, dues) {
    const resultat = redueixPolinomi(desenvolupa(expr));
    const comu = {
        id: tipus,
        mena: tipus,
        nom: TEXTOS_EA.nomPas[tipus],
        enunciat: TEXTOS_EA.enunciat[tipus],
        dades: { expr, dues },
        linia: `= ${escriuPolinomi(resultat)}`,
    };
    if (tipus === 'monomis') {
        const [m] = resultat;
        const plantilla = [{ tex: '=' }, { camp: 'c' }, { tex: 'x' }, { camp: 'ex', sup: true }];
        const camps = { c: 'enter', ex: 'exponent' };
        const solucio = { c: m.c, ex: m.e.x || 0 };
        if (dues) {
            plantilla.push({ tex: 'y' }, { camp: 'ey', sup: true });
            camps.ey = 'exponent';
            solucio.ey = m.e.y || 0;
        }
        return { ...comu, plantilla, camps, solucio, nota: TEXTOS_EA.nota.monomi };
    }
    const pas = plantillaPolinomi(universEA(dues), resultat);
    return { ...comu, ...pas, nota: TEXTOS_PASSOS.notes.polinomi };
}

/** Una pregunta nova: { tipus, expr, tex, text, passos }. */
export function generaPreguntaEA(tipus, nivell, dues = false) {
    const n = Math.min(3, Math.max(1, nivell));
    const expr = GENERADORS_EA[tipus](n, dues);
    return {
        tipus,
        expr,
        tex: escriuExpressio(expr),
        text: escriuExpressio(expr, { tex: false }),
        passos: [pasEA(expr, tipus, dues)],
    };
}

/** El que ha escrit l'alumne, com a polinomi reduït. */
export function polinomiDeValorsEA(pas, valors) {
    if (pas.mena === 'monomis') return redueixPolinomi([monomi(valors.c, { x: valors.ex, y: valors.ey || 0 })]);
    return polinomiDeCoeficients(valors, Object.keys(pas.camps));
}

/** La resposta, en text pla, per a l'historial: «3x² − x + 5». */
export function textRespostaEA(pas, valors) {
    return escriuPolinomi(polinomiDeValorsEA(pas, valors), { tex: false });
}
