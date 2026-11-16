/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/recta/math-engine.js
 * ROL: La matemàtica de «La recta» (recta.html): genera les rectes y = mx + n i
 *      les preguntes de cada tipus, amb els valors que donen els errors típics.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar). Gràfiques amb la
 *      quadrícula comuna (js/passos/quadricula.js); joc i correcció comuns
 *      (js/passos/joc-passos.js, js/passos/correccio.js).
 *
 *   TIPUS       llegir       de la gràfica: n (on talla l'eix Y) i m (avanço 1, pujo m)
 *               dibuixar     de y = mx + n: dos punts (taula) i situar-los a la quadrícula
 *               dosPunts     recta per dos punts: m = Δy/Δx i n = y_A − m·x_A
 *               classificar  proporcional, afí o constant; creixent o decreixent
 *   NIVELLS     1: pendent enter · 2: també pendents de denominador 2 · 3: també 3
 *
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, algebra/polinomis.js,
 *      passos/quadricula.js i strings.js.
 * ============================================================================
 */

import { pick, randInt, shuffle, triaProgressiva } from '../utils.js';
import {
    coeficient,
    coefsIguals,
    comRacional,
    inversCoef,
    oposatCoef,
    producteCoef,
    quocientCoef,
    signeCoef,
    sumaCoef,
    texRacional,
} from '../algebra/racionals.js';
import { escriuPolinomi, monomi } from '../algebra/polinomis.js';
import { svgQuadricula } from '../passos/quadricula.js';
import { TEXTOS_RC } from './strings.js';

export const TIPUS_RC = {
    '': ['llegir', 'dibuixar', 'dosPunts', 'classificar'],
    'llegir': ['llegir'],
    'dibuixar': ['dibuixar'],
    'dos-punts': ['dosPunts'],
    'classificar': ['classificar'],
};

export function tipusRC(opcio, index, total) {
    return triaProgressiva(TIPUS_RC[opcio] || TIPUS_RC[''], index, total);
}

export const LIMIT_RC = 6;
const PENDENTS_RC = {
    1: [1, 2, 3, -1, -2, -3, 1, 2, -1],
    2: [1, 2, 3, 4, -1, -2, -3, [1, 2], [-1, 2], [3, 2], [-3, 2]],
    3: [[1, 2], [-1, 2], [3, 2], [-3, 2], [1, 3], [-1, 3], [2, 3], [-2, 3], [4, 3], [-4, 3], 2, -3],
};

const enter = v => comRacional(v)[1] === 1;
const valorY = (m, n, x) => sumaCoef(producteCoef(m, x), n);
/** L'equació «y = mx + n» en TeX (o text). */
export function equacioRC(m, n, tex = true) {
    return `y = ${escriuPolinomi([monomi(m, { x: 1 }), monomi(n)], { tex })}`;
}
const par = x => (x < 0 ? `(${x})` : String(x));

/** Els punts de coordenades enteres de la recta que es veuen bé a la quadrícula. */
export function puntsEntersRC(m, n, marge = 1) {
    const punts = [];
    for (let x = -LIMIT_RC + marge; x <= LIMIT_RC - marge; x++) {
        const y = valorY(m, n, x);
        if (enter(y) && Math.abs(y) <= LIMIT_RC - marge) punts.push([x, y]);
    }
    return punts;
}

/** Una recta (m, n) amb almenys tres punts enters visibles. */
export function generaRectaRC(nivell, { m0, n0 } = {}) {
    for (;;) {
        const m = m0 !== undefined ? m0 : coeficient(...comRacional(pick(PENDENTS_RC[nivell])));
        const n = n0 !== undefined ? n0 : randInt(-4, 4);
        if (puntsEntersRC(m, n).length >= 3) return { m, n };
    }
}

/** Els valors equivocats d'un camp, sense el bo, sense repetits; si el camp és d'enters, només enters. */
function netsRC(sol, llista, nomesEnters = false) {
    const nets = [];
    for (const [v, e] of llista) {
        if (v === null || (nomesEnters && !enter(v))) continue;
        if (coefsIguals(v, sol) || nets.some(([w]) => coefsIguals(w, v))) continue;
        nets.push([v, e]);
    }
    return nets;
}

function pasRC(id, extra) {
    return { id, mena: id, nom: TEXTOS_RC.nomPas[id] || TEXTOS_RC.nomPas[id.replace('DosPunts', '')], ...extra };
}

const quadricula = opcions => svgQuadricula({ limit: LIMIT_RC, ...opcions });

// ── Els quatre tipus ─────────────────────────────────────────────────────────
function llegirRC(nivell) {
    const { m, n } = generaRectaRC(nivell);
    const [p, q] = comRacional(m);
    const campM = nivell === 1 ? 'enter' : 'racional';
    const tallX = signeCoef(m) !== 0 ? quocientCoef(oposatCoef(n), m) : null;
    return {
        enunciat: TEXTOS_RC.problema.llegir,
        textCurt: '',
        svg: quadricula({ rectes: [{ m, n }] }),
        clau: `l${texRacional(m)}${n}`,
        passos: [
            pasRC('ordenada', {
                enunciat: TEXTOS_RC.enunciat.ordenada,
                plantilla: [{ tex: 'n =' }, { camp: 'n' }],
                camps: { n: 'enter' },
                solucio: { n },
                dades: {
                    distractors: {
                        n: netsRC(
                            n,
                            [
                                [tallX, 'N_TALL_X'],
                                [m, 'M_N'],
                            ],
                            true
                        ),
                    },
                },
                linia: `n = ${n}`,
            }),
            pasRC('pendent', {
                enunciat: TEXTOS_RC.enunciat.pendent,
                plantilla: [{ tex: 'm =' }, { camp: 'm' }],
                camps: { m: campM },
                solucio: { m: campM === 'enter' ? m : comRacional(m) },
                dades: {
                    distractors: {
                        m: netsRC(
                            m,
                            [
                                [inversCoef(m), 'PENDENT_INVERS'],
                                [oposatCoef(m), 'SIGNE_PENDENT'],
                                [oposatCoef(inversCoef(m)), 'PENDENT_INVERS'],
                                [n, 'M_N'],
                            ],
                            campM === 'enter'
                        ),
                    },
                },
                linia: `m = ${texRacional(m)} \\;\\Rightarrow\\; ${equacioRC(m, n)}`,
                svgResolt: quadricula({
                    rectes: [{ m, n }],
                    triangles: [{ x: 0, y: n, dx: q, dy: p }],
                    punts: [{ x: 0, y: n }],
                }),
            }),
        ],
    };
}

function dibuixarRC(nivell) {
    for (;;) {
        const { m, n } = generaRectaRC(nivell);
        const q = comRacional(m)[1];
        const a = pick([q, 2 * q, -q, 3 * q].filter(x => Math.abs(x) <= LIMIT_RC - 1));
        const y1 = valorY(m, n, a);
        if (!enter(y1) || Math.abs(y1) > LIMIT_RC - 1) continue;
        const ma = producteCoef(m, a);
        return {
            enunciat: TEXTOS_RC.problema.dibuixar,
            textCurt: equacioRC(m, n, false),
            tex: equacioRC(m, n),
            clau: `d${texRacional(m)}${n}`,
            passos: [
                pasRC('taula', {
                    enunciat: TEXTOS_RC.enunciat.taula,
                    plantilla: [
                        { tex: 'x = 0 \\;\\Rightarrow\\; y =' },
                        { camp: 'y0' },
                        { tex: `,\\qquad x = ${a} \\;\\Rightarrow\\; y =` },
                        { camp: 'y1' },
                    ],
                    camps: { y0: 'enter', y1: 'enter' },
                    solucio: { y0: n, y1 },
                    dades: {
                        distractors: {
                            y0: netsRC(n, [[m, 'M_N']], true),
                            y1: netsRC(
                                y1,
                                [
                                    [ma, 'TAULA_SENSE_N'],
                                    [sumaCoef(oposatCoef(ma), n), 'TAULA_SIGNE'],
                                    [sumaCoef(ma, oposatCoef(n)), 'TAULA_SIGNE'],
                                ],
                                true
                            ),
                        },
                    },
                    linia: `x = 0 \\;\\Rightarrow\\; y = ${n},\\qquad x = ${a} \\;\\Rightarrow\\; y = ${y1}`,
                }),
                pasRC('punts', {
                    enunciat: TEXTOS_RC.enunciat.punts,
                    plantilla: [{ camp: 'p', quadricula: { limit: LIMIT_RC } }],
                    camps: { p: 'punts' },
                    solucio: { p: { recta: [m, n], quants: 2 } },
                    dades: { m, n },
                    linia: equacioRC(m, n),
                    svgResolt: quadricula({
                        rectes: [{ m, n }],
                        punts: [
                            { x: 0, y: n },
                            { x: a, y: y1 },
                        ],
                    }),
                }),
            ],
        };
    }
}

function dosPuntsRC(nivell) {
    const { m, n } = generaRectaRC(nivell);
    const [[xa, ya], [xb, yb]] = shuffle(puntsEntersRC(m, n)).slice(0, 2);
    const campM = nivell === 1 ? 'enter' : 'racional';
    const dy = yb - ya;
    const dx = xb - xa;
    return {
        enunciat: TEXTOS_RC.problema.dosPunts,
        textCurt: `A(${xa}, ${ya}), B(${xb}, ${yb})`,
        tex: `A(${xa}, ${ya}),\\quad B(${xb}, ${yb})`,
        svg: quadricula({
            punts: [
                { x: xa, y: ya, etiqueta: 'A' },
                { x: xb, y: yb, etiqueta: 'B' },
            ],
        }),
        clau: `p${xa},${ya},${xb},${yb}`,
        passos: [
            pasRC('pendentDosPunts', {
                enunciat: TEXTOS_RC.enunciat.pendentDosPunts,
                plantilla: [
                    { tex: `m = \\dfrac{y_B - y_A}{x_B - x_A} = \\dfrac{${yb} - ${par(ya)}}{${xb} - ${par(xa)}} =` },
                    { camp: 'm' },
                ],
                camps: { m: campM },
                solucio: { m: campM === 'enter' ? m : comRacional(m) },
                dades: {
                    distractors: {
                        m: netsRC(
                            m,
                            [
                                [dy === 0 ? null : coeficient(dx, dy), 'PENDENT_INVERS'],
                                [oposatCoef(m), 'RESTA_SIGNE'],
                            ],
                            campM === 'enter'
                        ),
                    },
                },
                linia: dx === 1 ? `m = ${texRacional(m)}` : `m = \\dfrac{${dy}}{${dx}} = ${texRacional(m)}`,
            }),
            pasRC('ordenadaDosPunts', {
                enunciat: TEXTOS_RC.enunciat.ordenadaDosPunts,
                plantilla: [
                    { tex: `n = y_A - m\\,x_A = ${ya} - ${texRacional(m)} \\cdot ${par(xa)} =` },
                    { camp: 'n' },
                ],
                camps: { n: 'racional' },
                solucio: { n: comRacional(n) },
                dades: {
                    distractors: {
                        n: netsRC(n, [
                            [sumaCoef(ya, producteCoef(m, xa)), 'N_SIGNE'],
                            [m, 'M_N'],
                        ]),
                    },
                },
                linia: `n = ${n} \\;\\Rightarrow\\; ${equacioRC(m, n)}`,
                svgResolt: quadricula({
                    rectes: [{ m, n }],
                    punts: [
                        { x: xa, y: ya, etiqueta: 'A' },
                        { x: xb, y: yb, etiqueta: 'B' },
                    ],
                }),
            }),
        ],
    };
}

function classificarRC(nivell) {
    const tipus = pick(['proporcional', 'afi', 'afi', 'constant']);
    const { m, n } =
        tipus === 'constant'
            ? { m: 0, n: pick([-4, -3, -2, -1, 1, 2, 3, 4]) }
            : generaRectaRC(nivell, tipus === 'proporcional' ? { n0: 0 } : { n0: pick([-4, -3, -2, -1, 1, 2, 3, 4]) });
    const creix = signeCoef(m) > 0 ? 'creixent' : signeCoef(m) < 0 ? 'decreixent' : 'constant';
    const errorTipus = { proporcional: 'CLASS_PROPORCIONAL', afi: 'CLASS_AFI', constant: 'CLASS_CONSTANT' }[tipus];
    const ambGrafica = randInt(0, 1) === 1;
    const signe = creix === 'creixent' ? '>' : creix === 'decreixent' ? '<' : '=';
    return {
        enunciat: TEXTOS_RC.problema.classificar,
        textCurt: ambGrafica ? '' : equacioRC(m, n, false),
        ...(ambGrafica ? { svg: quadricula({ rectes: [{ m, n }] }) } : { tex: equacioRC(m, n) }),
        clau: `c${texRacional(m)}${n}${ambGrafica}`,
        passos: [
            pasRC('tipus', {
                enunciat: TEXTOS_RC.enunciat.tipus,
                plantilla: [],
                camps: { tria: 'tria' },
                opcions: Object.entries(TEXTOS_RC.tipus).map(([k, t]) => [k, t.opcio]),
                solucio: { tria: tipus },
                dades: {
                    distractors: {
                        tria: Object.keys(TEXTOS_RC.tipus)
                            .filter(k => k !== tipus)
                            .map(k => [k, errorTipus]),
                    },
                },
                linia: `${equacioRC(m, n)} \\;\\Rightarrow\\; \\text{${TEXTOS_RC.tipus[tipus].nom}}`,
            }),
            pasRC('creixement', {
                enunciat: TEXTOS_RC.enunciat.creixement,
                plantilla: [],
                camps: { tria: 'tria' },
                opcions: Object.entries(TEXTOS_RC.creixement),
                solucio: { tria: creix },
                dades: {
                    distractors: {
                        tria: Object.keys(TEXTOS_RC.creixement)
                            .filter(k => k !== creix)
                            .map(k => [k, 'CREIXEMENT']),
                    },
                },
                linia: `m ${signe} 0 \\;\\Rightarrow\\; \\text{${TEXTOS_RC.creixement[creix].toLowerCase()}}`,
            }),
        ],
    };
}

const GENERADORS_RC = { llegir: llegirRC, dibuixar: dibuixarRC, dosPunts: dosPuntsRC, classificar: classificarRC };

/** Una pregunta nova: { tipus, tex, svg?, enunciat, text, clau, passos }. */
export function generaPreguntaRC(tipus, nivell) {
    const n = Math.min(3, Math.max(1, nivell));
    const q = GENERADORS_RC[tipus](n);
    return { tipus, ...q, tex: q.tex || '', text: q.textCurt ? `${q.enunciat} ${q.textCurt}` : q.enunciat };
}
