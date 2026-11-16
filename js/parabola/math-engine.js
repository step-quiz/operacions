/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/parabola/math-engine.js
 * ROL: La matemàtica de «La paràbola» (parabola.html): genera paràboles
 *      y = ax² + bx + c de vèrtex i talls enters i les preguntes dels dos sentits.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar). Quadrícula comuna
 *      (js/passos/quadricula.js); els talls amb l'eix X són els passos de la fórmula
 *      d'«Equacions de 2n grau» (passosFormulaSG); joc i correcció comuns.
 *
 *   TIPUS       dibuixar   de l'expressió a la gràfica: obertura, vèrtex, tall amb l'eix Y,
 *                          talls amb l'eix X (discriminant, quantes, quines) i situar els punts
 *               llegir     de la gràfica a l'expressió: talls, a = c / (x₁·x₂) i desenvolupar
 *   NIVELLS     1: a = ±1, dos talls · 2: a = ±1, ±2, també un tall (doble) ·
 *               3: també cap tall (discriminant negatiu)
 *
 * DEPENDÈNCIES: utils.js, algebra/polinomis.js, passos/quadricula.js,
 *      equacions-segon-grau/math-engine.js i strings.js.
 * ============================================================================
 */

import { pick, randInt, triaProgressiva } from '../utils.js';
import { escriuPolinomi, monomi, plantillaPolinomi } from '../algebra/polinomis.js';
import { svgQuadricula } from '../passos/quadricula.js';
import { passosFormulaSG } from '../equacions-segon-grau/math-engine.js';
import { TEXTOS_PA } from './strings.js';

export const TIPUS_PA = { '': ['dibuixar', 'llegir'], 'dibuixar': ['dibuixar'], 'llegir': ['llegir'] };

export function tipusPA(opcio, index, total) {
    return triaProgressiva(TIPUS_PA[opcio] || TIPUS_PA[''], index, total);
}

export const LIMIT_PA = 8;
const dins = v => Math.abs(v) <= LIMIT_PA - 1;
export const valorPA = ({ a, b, c }, x) => a * x * x + b * x + c;
const polPA = ({ a, b, c }) => [monomi(a, { x: 2 }), monomi(b, { x: 1 }), monomi(c)];
export const expressioPA = (p, tex = true) => `y = ${escriuPolinomi(polPA(p), { tex })}`;
const par = x => (x < 0 ? `(${x})` : String(x));

/**
 * Una paràbola de vèrtex enter i punts notables dins de la quadrícula.
 * @param {string} talls  'dos', 'un' (arrel doble) o 'cap'
 * @returns {{a, b, c, xv, yv, arrels}}
 */
export function generaParabolaPA(nivell, talls = 'dos', { senseZero = false } = {}) {
    for (;;) {
        const a = pick(nivell === 1 ? [1, -1] : [1, -1, 2, -2, 1, -1]);
        let xv, yv, arrels;
        if (talls === 'cap') {
            xv = randInt(-4, 4);
            yv = Math.sign(a) * randInt(1, 5);
            arrels = [];
        } else if (talls === 'un') {
            xv = randInt(-4, 4);
            yv = 0;
            arrels = [xv];
        } else {
            // Dues arrels de la mateixa paritat: el vèrtex és enter
            const r1 = randInt(-6, 5);
            const r2 = r1 + 2 * randInt(1, 4);
            arrels = [r1, r2];
            xv = (r1 + r2) / 2;
            yv = a * (xv - r1) * (xv - r2);
            if (senseZero && (r1 === 0 || r2 === 0)) continue;
        }
        const b = -2 * a * xv;
        const c = a * xv * xv + yv;
        if (b === 0 && talls !== 'dos') continue; // (que no sigui massa fàcil)
        if (![xv, yv, c, ...arrels].every(dins)) continue;
        return { a, b, c, xv, yv, arrels };
    }
}

/** Els punts notables (sense repetir): vèrtex, tall amb l'eix Y i talls amb l'eix X. */
export function puntsNotablesPA(p) {
    const punts = [[p.xv, p.yv], [0, p.c], ...p.arrels.map(r => [r, 0])];
    return punts.filter(([x, y], i) => punts.findIndex(([u, v]) => u === x && v === y) === i);
}

const quadricula = opcions => svgQuadricula({ limit: LIMIT_PA, ...opcions });
const nets = (sol, llista) =>
    llista.filter(([v], i) => Number.isInteger(v) && v !== sol && llista.findIndex(([w]) => w === v) === i);

// ── De l'expressió a la gràfica ──────────────────────────────────────────────
function dibuixarPA(nivell) {
    const talls = nivell === 1 ? 'dos' : nivell === 2 ? pick(['dos', 'dos', 'un']) : pick(['dos', 'un', 'cap']);
    const p = generaParabolaPA(nivell, talls);
    const { a, b, c, xv, yv } = p;
    const obre = a > 0 ? 'amunt' : 'avall';
    const punts = puntsNotablesPA(p);
    // Els talls amb l'eix X: discriminant, quantes solucions i quines (els passos d'Equacions de 2n grau)
    const formula = passosFormulaSG(a, b, c, 'x').filter(pas => pas.mena !== 'formula');
    formula[0] = { ...formula[0], enunciat: `${TEXTOS_PA.enunciat.talls} ${formula[0].enunciat}` };
    const pas = (id, extra) => ({
        id,
        mena: id,
        nom: TEXTOS_PA.nomPas[id],
        enunciat: TEXTOS_PA.enunciat[id],
        ...extra,
    });
    return {
        enunciat: TEXTOS_PA.problema.dibuixar,
        tex: expressioPA(p),
        text: `${TEXTOS_PA.problema.dibuixar} ${expressioPA(p, false)}`,
        clau: `d${a},${b},${c}`,
        passos: [
            pas('obertura', {
                plantilla: [],
                camps: { tria: 'tria' },
                opcions: Object.entries(TEXTOS_PA.obertura),
                solucio: { tria: obre },
                dades: { distractors: { tria: [[obre === 'amunt' ? 'avall' : 'amunt', 'OBERTURA']] } },
                linia: `a = ${a} ${a > 0 ? '>' : '<'} 0 \\;\\Rightarrow\\; ${a > 0 ? '\\cup' : '\\cap'}`,
            }),
            pas('vertex', {
                plantilla: [
                    { tex: `x_v = \\dfrac{-b}{2a} = \\dfrac{${-b}}{${2 * a}} =` },
                    { camp: 'xv' },
                    { tex: ',\\qquad y_v =' },
                    { camp: 'yv' },
                ],
                camps: { xv: 'enter', yv: 'enter' },
                solucio: { xv, yv },
                dades: {
                    distractors: {
                        xv: nets(xv, [
                            [-xv, 'VERTEX_SIGNE'],
                            [-b / a, 'VERTEX_2A'],
                        ]),
                        yv: nets(yv, [
                            [c, 'VERTEX_TALL_Y'],
                            [valorPA(p, -xv), 'VERTEX_Y'],
                        ]),
                    },
                },
                linia: `V = (${xv},\\ ${yv})`,
            }),
            pas('tallY', {
                plantilla: [{ tex: 'x = 0 \\;\\Rightarrow\\; y =' }, { camp: 'c' }],
                camps: { c: 'enter' },
                solucio: { c },
                dades: { distractors: { c: nets(c, [[yv, 'TALL_Y_VERTEX']]) } },
                linia: `(0,\\ ${c})`,
            }),
            ...formula,
            pas('punts', {
                plantilla: [{ camp: 'p', quadricula: { limit: LIMIT_PA, previa: 'parabola' } }],
                camps: { p: 'punts' },
                solucio: { p: { punts } },
                dades: { punts },
                linia: expressioPA(p),
                svgResolt: quadricula({ paraboles: [p], punts: punts.map(([x, y]) => ({ x, y })) }),
            }),
        ],
    };
}

// ── De la gràfica a l'expressió ──────────────────────────────────────────────
function llegirPA(nivell) {
    const p = generaParabolaPA(nivell, 'dos', { senseZero: true });
    const { a, b, c, arrels } = p;
    const [r1, r2] = arrels;
    const factor = r => escriuPolinomi([monomi(1, { x: 1 }), monomi(-r)]);
    const pas = (id, extra) => ({
        id,
        mena: id,
        nom: TEXTOS_PA.nomPas[id],
        enunciat: TEXTOS_PA.enunciat[id],
        ...extra,
    });
    const expressio = plantillaPolinomi(['x2', 'x1', 'k'], [monomi(a, { x: 2 }), monomi(b, { x: 1 }), monomi(c)]);
    return {
        enunciat: TEXTOS_PA.problema.llegir,
        svg: quadricula({ paraboles: [p] }),
        text: TEXTOS_PA.problema.llegir,
        clau: `l${a},${b},${c}`,
        passos: [
            pas('tallsX', {
                plantilla: [{ tex: 'x_1 =' }, { camp: 'x1' }, { tex: ',\\qquad x_2 =' }, { camp: 'x2' }],
                camps: { x1: 'enter', x2: 'enter' },
                parell: ['x1', 'x2'],
                solucio: { x1: r1, x2: r2 },
                dades: {
                    distractors: {
                        x1: [
                            [-r1, 'TALLS_SIGNE'],
                            [-r2, 'TALLS_SIGNE'],
                        ],
                        x2: [
                            [-r1, 'TALLS_SIGNE'],
                            [-r2, 'TALLS_SIGNE'],
                        ],
                    },
                },
                linia: `x_1 = ${r1},\\quad x_2 = ${r2}`,
            }),
            pas('tallY', {
                plantilla: [{ tex: 'x = 0 \\;\\Rightarrow\\; y =' }, { camp: 'c' }],
                camps: { c: 'enter' },
                solucio: { c },
                dades: { distractors: { c: nets(c, [[p.yv, 'TALL_Y_VERTEX']]) } },
                linia: `(0,\\ ${c})`,
            }),
            pas('a', {
                plantilla: [
                    {
                        tex: `y = a\\,(${factor(r1)})(${factor(r2)}) \\;\\Rightarrow\\; ${c} = a \\cdot ${par(-r1)} \\cdot ${par(-r2)} \\;\\Rightarrow\\; a =`,
                    },
                    { camp: 'a' },
                ],
                camps: { a: 'enter' },
                solucio: { a },
                dades: {
                    distractors: {
                        a: nets(a, [
                            [-a, 'A_SIGNE'],
                            [c, 'A_SENSE_DIVIDIR'],
                        ]),
                    },
                },
                linia: `a = ${a}`,
            }),
            pas('expressio', {
                ...expressio,
                plantilla: [{ tex: 'y' }, ...expressio.plantilla],
                dades: {
                    distractors: {
                        x2: nets(a, [[-a, 'A_SIGNE']]),
                        x1: nets(b, [[-b, 'EXPR_SIGNES']]),
                        k: nets(c, [[-c, 'EXPR_SIGNES']]),
                    },
                },
                linia: expressioPA(p),
                svgResolt: quadricula({
                    paraboles: [p],
                    punts: [
                        [r1, 0],
                        [r2, 0],
                        [0, c],
                    ].map(([x, y]) => ({ x, y })),
                }),
            }),
        ],
    };
}

const GENERADORS_PA = { dibuixar: dibuixarPA, llegir: llegirPA };

/** Una pregunta nova: { tipus, tex, svg?, enunciat, text, clau, passos }. */
export function generaPreguntaPA(tipus, nivell) {
    const n = Math.min(3, Math.max(1, nivell));
    return { tipus, tex: '', ...GENERADORS_PA[tipus](n) };
}
