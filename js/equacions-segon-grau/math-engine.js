/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions-segon-grau/math-engine.js
 * ROL: La matemàtica d'«Equacions de 2n grau» (equacions-segon-grau.html):
 *      genera les equacions i en fa la llista de passos.
 * ARQUITECTURA: mòdul pur (cap DOM; l'atzar, només als generadors i a través de
 *      utils.js, perquè les sessions fixes el puguin sembrar).
 *
 *   EQUACIÓ   { tipus, a, b, c, tex, text }   (+ forma i trampes a «ordenar»)
 *     completa    ax² + bx + c = 0      sempre amb la fórmula
 *     senseB      ax² + c = 0           aïllar x² i fer l'arrel
 *     senseC      ax² + bx = 0          x factor comú
 *     ordenar     x(x + p) = q, …       primer s'ordena; després, la fórmula
 *     biquadrada  ax⁴ + bx² + c = 0     canvi t = x², fórmula i desfer el canvi
 *     Només surten discriminants que són quadrats perfectes (o negatius).
 *
 *   PAS (dades, sense funcions: el pot pintar qualsevol vista)
 *     id         únic dins de l'equació («arrels», «arrels2»…)
 *     mena       quin pas és («discriminant», «formula»…): errors.js en mira això
 *     enunciat   text de la consigna
 *     plantilla  trossos: { tex } · { camp: nom } · { frac: { num: […], den: […] } }
 *     camps      { nom: 'enter' | 'racional' | 'tria' }, en l'ordre d'escriure'ls
 *     opcions    [[valor, text], …] dels camps 'tria'
 *     solucio    { nom: valor }: enter → nombre; racional → [n, d] irreductible
 *     parell     [nom, nom] si aquests dos camps es poden respondre en qualsevol ordre
 *     proporcional  [a, b, c] si val qualsevol terna d'enters proporcional
 *     dades      el que necessita el diagnòstic d'errors
 *     linia      TeX del pas ja resolt (el que queda escrit a la resolució)
 *
 * La correcció dels passos és la comuna (js/passos/correccio.js) i el joc, el de
 *      js/passos/joc-passos.js.
 * DEPENDÈNCIES: utils.js, algebra/polinomis.js, algebra/racionals.js i strings.js.
 * ============================================================================
 */

import { gcd, pick, randInt } from '../utils.js';
import { escriuPolinomi, monomi } from '../algebra/polinomis.js';
import { racional, racionalsIguals, texRacional } from '../algebra/racionals.js';
import { TEXTOS_SG } from './strings.js';

// Opcions de ?tipus= (les mateixes que el generador d'enllaços d'index.html) → tipus que hi surten.
// A «totes» les completes pesen el doble; les biquadrades només surten si es demanen.
export const TIPUS_SG = {
    '': ['completa', 'completa', 'senseB', 'senseC', 'ordenar'],
    'incompletes': ['senseB', 'senseC'],
    'completes': ['completa'],
    'ordenar': ['ordenar'],
    'biquadrades': ['biquadrada'],
};

/** Si es barregen completes i incompletes, el primer pas és dir de quina mena és l'equació. */
export function calClassificarSG(opcio) {
    const classes = new Set((TIPUS_SG[opcio] || TIPUS_SG['']).filter(t => t !== 'ordenar' && t !== 'biquadrada'));
    return classes.size > 1;
}

function arrelEnteraSG(n) {
    if (n < 0) return null;
    const r = Math.round(Math.sqrt(n));
    return r * r === n ? r : null;
}

// ── Escriptura ───────────────────────────────────────────────────────────────
const SUPER_SG = { 2: '\u00b2' };

// Un nombre dins d'una operació: els negatius, entre parèntesis
const texParSG = n => (n < 0 ? `(${n})` : String(n));

/** Una suma de termes [[coeficient, grau], …] en la lletra v, en l'ordre donat. */
function termesSG(termes, v, tex) {
    return escriuPolinomi(
        termes.map(([coef, grau]) => monomi(coef, { [v]: grau })),
        { tex }
    );
}
const texSG = (termes, v = 'x') => termesSG(termes, v, true);
const textSG = (termes, v = 'x') => termesSG(termes, v, false);

/** Els termes de c2·x² + c1·x + c0. */
function polSG(c2, c1, c0) {
    return [
        [c2, 2],
        [c1, 1],
        [c0, 0],
    ];
}

// ── Generadors ───────────────────────────────────────────────────────────────
function enterNoZeroSG(max) {
    const n = randInt(1, max);
    return randInt(0, 1) ? n : -n;
}

/** Una fracció p/q irreductible que no és un enter (q ≥ 2). */
function fraccioSG(maxQ, maxP) {
    for (;;) {
        const q = randInt(2, maxQ);
        const p = enterNoZeroSG(maxP);
        if (gcd(p, q) === 1) return [p, q];
    }
}

/** Coeficients de k·(q1·x − p1)·(q2·x − p2): arrels p1/q1 i p2/q2. */
function deFactorsSG(q1, p1, q2, p2, k = 1) {
    return [k * q1 * q2, -k * (q1 * p2 + q2 * p1), k * p1 * p2];
}

/** Tres coeficients sense cap solució real (Δ < 0), amb a > 0 i c > 0. */
function sensArrelsSG(maxA, maxB, maxC) {
    for (;;) {
        const a = randInt(1, maxA);
        const b = enterNoZeroSG(maxB);
        const c = randInt(1, maxC);
        if (b * b - 4 * a * c < 0) return [a, b, c];
    }
}

// Ordre en què s'escriuen els termes (índexs de [a, b, c]). Als nivells 2 i 3, de tant en tant desordenats.
const DESORDRES_SG = [
    [1, 0, 2],
    [2, 1, 0],
    [0, 2, 1],
    [2, 0, 1],
    [1, 2, 0],
];
function ordreSG(nivell) {
    const prob = nivell === 1 ? 0 : nivell === 2 ? 25 : 40;
    return randInt(1, 100) <= prob ? pick(DESORDRES_SG) : [0, 1, 2];
}

function equacioSG(tipus, a, b, c, ordre = [0, 1, 2]) {
    const graus = tipus === 'biquadrada' ? [4, 2, 0] : [2, 1, 0];
    const coefs = [a, b, c];
    const termes = ordre.map(i => [coefs[i], graus[i]]);
    return { tipus, a, b, c, tex: `${texSG(termes)} = 0`, text: `${textSG(termes)} = 0` };
}

function coefsCompletaSG(nivell) {
    const sort = randInt(1, 100);
    if (nivell === 1) return deFactorsSG(1, enterNoZeroSG(9), 1, enterNoZeroSG(9));
    if (nivell === 2) {
        if (sort <= 50) {
            const [p, q] = fraccioSG(4, 9);
            return deFactorsSG(q, p, 1, enterNoZeroSG(6));
        }
        if (sort <= 65) return deFactorsSG(1, enterNoZeroSG(12), 1, enterNoZeroSG(12), pick([1, -1]));
        if (sort <= 82) {
            const r = enterNoZeroSG(7);
            return deFactorsSG(1, r, 1, r, pick([1, 1, 2, 3]));
        }
        return sensArrelsSG(3, 6, 12);
    }
    if (sort <= 45) {
        const [p1, q1] = fraccioSG(5, 7);
        const [p2, q2] = fraccioSG(4, 7);
        return deFactorsSG(q1, p1, q2, p2, pick([1, 1, -1]));
    }
    if (sort <= 60) {
        const [p, q] = fraccioSG(5, 6);
        return deFactorsSG(q, p, q, p, pick([1, -1]));
    }
    if (sort <= 75) {
        const k = pick([1, -1]);
        return sensArrelsSG(5, 9, 12).map(n => k * n);
    }
    return deFactorsSG(1, enterNoZeroSG(8), 1, enterNoZeroSG(8), pick([-1, -2, -3, 2, 3]));
}

function generaCompletaSG(nivell) {
    for (let i = 0; i < 500; i++) {
        const [a, b, c] = coefsCompletaSG(nivell);
        const delta = b * b - 4 * a * c;
        if (b === 0 || c === 0 || Math.abs(a) > 36 || Math.abs(b) > 40 || Math.abs(c) > 72) continue;
        if (delta > 0 && arrelEnteraSG(delta) === null) continue;
        if (nivell === 1 && delta === 0) continue;
        return equacioSG('completa', a, b, c, ordreSG(nivell));
    }
    return equacioSG('completa', 1, -5, 6);
}

function generaSenseBSG(nivell) {
    const sort = randInt(1, 100);
    let a, c;
    if (nivell === 1) {
        const r = randInt(1, 10);
        a = pick([1, 1, 1, 2, 3, 4, 5]);
        c = -a * r * r;
    } else if (nivell === 2) {
        if (sort <= 65) {
            const [p, q] = fraccioSG(5, 9);
            a = q * q;
            c = -p * p;
        } else {
            a = randInt(1, 5);
            c = a * randInt(1, 20);
        }
    } else {
        if (sort <= 30) {
            a = randInt(1, 6);
            c = a * randInt(1, 20);
        } else if (sort <= 70) {
            const [p, q] = fraccioSG(4, 7);
            const m = pick([2, 3]);
            a = m * q * q;
            c = -m * p * p;
        } else {
            const r = randInt(1, 9);
            a = randInt(2, 5);
            c = -a * r * r;
        }
        if (randInt(0, 1)) {
            a = -a;
            c = -c;
        }
    }
    const girada = nivell === 3 && randInt(1, 100) <= 40;
    return equacioSG('senseB', a, 0, c, girada ? [2, 1, 0] : [0, 1, 2]);
}

function generaSenseCSG(nivell) {
    let a = 1;
    let b = enterNoZeroSG(12);
    if (nivell === 2) {
        a = randInt(2, 6);
        b = enterNoZeroSG(24);
    } else if (nivell === 3) {
        a = enterNoZeroSG(9);
        if (a === 1) a = -1;
        b = enterNoZeroSG(30);
    }
    const girada = nivell === 3 && randInt(1, 100) <= 40;
    return equacioSG('senseC', a, b, 0, girada ? [1, 0, 2] : [0, 1, 2]);
}

// Formes de les equacions per ordenar, de la més senzilla (passar termes) a la més llarga (desenvolupar)
const FORMES_SG = {
    1: ['x2=px+q', 'x2+bx=q'],
    2: ['x(x+p)=q', 'dos-membres'],
    3: ['(x+p)2=qx+r', '(x+p)(x+q)=r'],
};

function generaOrdenarSG(nivell) {
    // Cada membre és un producte de trossos: { t: termes } o { par: termes, exp } (entre parèntesis)
    const binomi = n => ({ par: polSG(0, 1, n) });
    for (let i = 0; i < 500; i++) {
        const forma = pick(FORMES_SG[nivell]);
        const r1 = enterNoZeroSG(9);
        const r2 = enterNoZeroSG(9);
        const k = forma === 'dos-membres' ? pick([1, 1, 2]) : 1;
        const [a, b, c] = deFactorsSG(1, r1, 1, r2, k);
        if (b === 0 || (nivell === 1 && r1 === r2)) continue;
        let esq, dre;
        // Respostes equivocades típiques d'aquesta forma (errors.js les reconeix)
        const trampes = [];
        if (forma === 'x2=px+q') {
            esq = [{ t: polSG(1, 0, 0) }];
            dre = [{ t: polSG(0, -b, -c) }];
        } else if (forma === 'x2+bx=q') {
            esq = [{ t: polSG(1, b, 0) }];
            dre = [{ t: polSG(0, 0, -c) }];
        } else if (forma === 'x(x+p)=q') {
            esq = [{ t: polSG(0, 1, 0) }, binomi(b)];
            dre = [{ t: polSG(0, 0, -c) }];
            if (b + c !== 0) trampes.push({ coefs: [1, 0, b + c], errorType: 'ORDENA_DISTRIBUTIVA' });
        } else if (forma === 'dos-membres') {
            const a2 = randInt(1, 3);
            const b1 = pick([b, enterNoZeroSG(9)]);
            const c1 = pick([0, enterNoZeroSG(9)]);
            esq = [{ t: polSG(a + a2, b1, c1) }];
            dre = [{ t: polSG(a2, b1 - b, c1 - c) }];
        } else if (forma === '(x+p)2=qx+r') {
            const p = enterNoZeroSG(5);
            const q = 2 * p - b;
            if (q === 0) continue;
            esq = [{ ...binomi(p), exp: 2 }];
            dre = [{ t: polSG(0, q, p * p - c) }];
            trampes.push({ coefs: [1, -q, c], errorType: 'ORDENA_QUADRAT' });
        } else {
            const p = enterNoZeroSG(6);
            const q = b - p;
            const r = p * q - c;
            if (q === 0 || r === 0) continue;
            esq = [binomi(p), binomi(q)];
            dre = [{ t: polSG(0, 0, r) }];
            trampes.push({ coefs: [1, 0, c], errorType: 'ORDENA_DISTRIBUTIVA' });
        }
        const escriu = (membre, tex) =>
            membre
                .map(tros => {
                    if (tros.t) return termesSG(tros.t, 'x', tex);
                    const dins = `(${termesSG(tros.par, 'x', tex)})`;
                    return tros.exp ? dins + (tex ? `^${tros.exp}` : SUPER_SG[tros.exp]) : dins;
                })
                .join(tex ? '\\,' : '·');
        return {
            tipus: 'ordenar',
            a,
            b,
            c,
            forma,
            membres: [esq, dre],
            trampes,
            tex: `${escriu(esq, true)} = ${escriu(dre, true)}`,
            text: `${escriu(esq, false)} = ${escriu(dre, false)}`,
        };
    }
    return generaCompletaSG(1);
}

const QUADRATS_SG = [1, 4, 9, 16, 25];

function generaBiquadradaSG(nivell) {
    for (let i = 0; i < 500; i++) {
        const sort = randInt(1, 100);
        let coefs;
        if (nivell === 1 || (nivell === 2 && sort > 60)) {
            const t1 = pick(QUADRATS_SG);
            const t2 = pick(QUADRATS_SG);
            if (t1 === t2 || t1 * t2 > 300) continue;
            coefs = deFactorsSG(1, t1, 1, t2);
        } else if (nivell === 2) {
            coefs = deFactorsSG(1, pick(QUADRATS_SG), 1, -randInt(1, 9));
        } else {
            const [p, q] = fraccioSG(3, 3);
            const t2 = sort <= 50 ? pick([1, 4, 9]) : -randInt(1, 4);
            coefs = deFactorsSG(q * q, p * p, 1, t2);
        }
        if (coefs[1] === 0) continue;
        return equacioSG('biquadrada', ...coefs);
    }
    return equacioSG('biquadrada', 1, -5, 4);
}

/** Una equació nova del tipus i el nivell (1-3) demanats. */
export function generaEquacioSG(tipus, nivell) {
    const n = Math.min(3, Math.max(1, nivell));
    if (tipus === 'senseB') return generaSenseBSG(n);
    if (tipus === 'senseC') return generaSenseCSG(n);
    if (tipus === 'ordenar') return generaOrdenarSG(n);
    if (tipus === 'biquadrada') return generaBiquadradaSG(n);
    return generaCompletaSG(n);
}

// ── Passos ───────────────────────────────────────────────────────────────────
function pasSG(mena, v, extra) {
    const enunciat = TEXTOS_SG.enunciat[extra.enunciat || mena].replaceAll('{v}', v);
    return { id: mena, mena, nom: TEXTOS_SG.nomPas[mena], ...extra, enunciat };
}

const pasTriaSG = (mena, v, textos, extra) =>
    pasSG(mena, v, { camps: { tria: 'tria' }, opcions: [2, 1, 0].map(k => [k, textos[k]]), ...extra });

// Dues solucions que es poden escriure en qualsevol ordre; `base` és el subíndex de la primera
function pasParellSG(mena, v, base, s1, s2, extra) {
    const enters = s1[1] === 1 && s2[1] === 1;
    const val = q => (enters ? q[0] : q);
    const [i, j] = [base, base + 1];
    return pasSG(mena, v, {
        plantilla: [{ tex: `${v}_${i} =` }, { camp: 'x1' }, { tex: `,\\quad ${v}_${j} =` }, { camp: 'x2' }],
        camps: { x1: enters ? 'enter' : 'racional', x2: enters ? 'enter' : 'racional' },
        parell: ['x1', 'x2'],
        solucio: { x1: val(s1), x2: val(s2) },
        ...extra,
        linia: `${extra.linia || ''}${v}_${i} = ${texRacional(s1)},\\quad ${v}_${j} = ${texRacional(s2)}`,
    });
}

/** Discriminant, nombre de solucions, fórmula i solucions de av² + bv + c = 0 (també els fa servir La paràbola). */
export function passosFormulaSG(a, b, c, v) {
    const delta = b * b - 4 * a * c;
    const n = delta > 0 ? 2 : delta === 0 ? 1 : 0;
    const passos = [
        pasSG('discriminant', v, {
            plantilla: [{ tex: '\\Delta = b^2 - 4ac =' }, { camp: 'delta' }],
            camps: { delta: 'enter' },
            solucio: { delta },
            dades: { a, b, c },
            linia: `\\Delta = b^2 - 4ac = ${texParSG(b)}^2 - 4\\cdot ${texParSG(a)}\\cdot ${texParSG(c)} = ${delta}`,
        }),
        pasTriaSG('nombre', v, TEXTOS_SG.nombre, {
            plantilla: [{ tex: `\\Delta = ${delta}` }],
            solucio: { tria: n },
            dades: { delta },
            linia: `\\Delta ${'<=>'[n]} 0 \\;\\Rightarrow\\; \\text{${TEXTOS_SG.nombre[n]}}`,
        }),
    ];
    if (n === 0) return passos;

    const arrel = arrelEnteraSG(delta);
    const mb = 0 - b;
    const da = 2 * a;
    const s1 = racional(mb + arrel, da);
    const s2 = racional(mb - arrel, da);
    const dades = { a, b, delta, arrel };
    const general = `${v} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a} =`;
    if (n === 2) {
        passos.push(
            pasSG('formula', v, {
                plantilla: [
                    { tex: general },
                    { frac: { num: [{ camp: 'mb' }, { tex: '\\pm' }, { camp: 'arrel' }], den: [{ camp: 'da' }] } },
                ],
                camps: { mb: 'enter', arrel: 'enter', da: 'enter' },
                solucio: { mb, arrel, da },
                dades,
                linia: `${general} \\dfrac{${mb} \\pm ${arrel}}{${da}}`,
            }),
            pasParellSG('solucions', v, 1, s1, s2, { dades })
        );
    } else {
        const enter = s1[1] === 1;
        passos.push(
            pasSG('formula', v, {
                plantilla: [{ tex: general }, { frac: { num: [{ camp: 'mb' }], den: [{ camp: 'da' }] } }],
                camps: { mb: 'enter', da: 'enter' },
                solucio: { mb, da },
                dades,
                linia: `${general} \\dfrac{${mb} \\pm 0}{${da}}`,
            }),
            pasSG('solucions', v, {
                plantilla: [{ tex: `${v} =` }, { camp: 'x1' }],
                camps: { x1: enter ? 'enter' : 'racional' },
                solucio: { x1: enter ? s1[0] : s1 },
                dades,
                linia: `${v} = ${texRacional(s1)}`,
            })
        );
    }
    return passos;
}

/** x² = k: quants nombres tenen aquest quadrat i, si n'hi ha, quins són. */
function passosArrelSG(k, base = 1, desfer = false) {
    const n = k[0] > 0 ? 2 : k[0] === 0 ? 1 : 0;
    const igualtat = `x^2 = ${texRacional(k)}`;
    const passos = [
        pasTriaSG('nombreArrel', 'x', TEXTOS_SG.nombreArrel, {
            enunciat: desfer ? 'desfer' : 'nombreArrel',
            plantilla: [{ tex: igualtat }],
            solucio: { tria: n },
            dades: { k },
            linia: `${igualtat} \\;\\Rightarrow\\; \\text{${TEXTOS_SG.nombreArrel[n]}}`,
        }),
    ];
    if (n === 2) {
        const r = [arrelEnteraSG(k[0]), arrelEnteraSG(k[1])];
        passos.push(
            pasParellSG('arrels', 'x', base, r, [-r[0], r[1]], {
                dades: { k, r },
                linia: `x = \\pm\\sqrt{${texRacional(k)}} \\;\\Rightarrow\\; `,
            })
        );
    }
    return passos;
}

function pasTernaSG(mena, v, a, b, c, extra) {
    const [texA, texB, texC] =
        mena === 'coeficients' ? ['a =', ',\\quad b =', ',\\quad c ='] : ['', `${v}^2 +`, `${v} +`];
    const plantilla = [{ tex: texA }, { camp: 'a' }, { tex: texB }, { camp: 'b' }, { tex: texC }, { camp: 'c' }];
    if (mena !== 'coeficients') plantilla.push({ tex: '= 0' });
    return pasSG(mena, v, {
        plantilla: plantilla.filter(tros => tros.camp || tros.tex),
        camps: { a: 'enter', b: 'enter', c: 'enter' },
        solucio: { a, b, c },
        dades: { a, b, c },
        ...extra,
    });
}

// Les solucions (racionals, de més gran a més petita) de av² + bv + c = 0
function arrelsSG(a, b, c) {
    const delta = b * b - 4 * a * c;
    const arrel = arrelEnteraSG(delta);
    if (arrel === null) return [];
    const sols = [racional(-b + arrel, 2 * a), racional(-b - arrel, 2 * a)];
    if (racionalsIguals(sols[0], sols[1])) sols.pop();
    return sols.sort((x, y) => y[0] * x[1] - x[0] * y[1]);
}

const ternaSG = (a, b, c, v) => texSG(polSG(a, b, c), v);

/**
 * Els passos d'una equació.
 * @param {object} eq        la de generaEquacioSG()
 * @param {object} opcions   classifica: el primer pas és dir de quina mena és (completes i
 *                           incompletes barrejades); coefs: [a, b, c] que l'alumne ha escrit en
 *                           ordenar l'equació (qualsevol terna proporcional val, i la resta de
 *                           passos es fan amb la seva).
 */
export function passosEquacioSG(eq, opcions = {}) {
    const { a, b, c, tipus } = eq;
    const passos = [];
    if (opcions.classifica && TEXTOS_SG.classe[tipus]) {
        passos.push(
            pasSG('classifica', 'x', {
                plantilla: [],
                camps: { tria: 'tria' },
                opcions: Object.entries(TEXTOS_SG.classe).map(([k, t]) => [k, t.opcio]),
                solucio: { tria: tipus },
                dades: { a, b, c },
                linia: `\\text{${TEXTOS_SG.classe[tipus].linia}}`,
            })
        );
    }
    if (tipus === 'completa') {
        passos.push(
            pasTernaSG('coeficients', 'x', a, b, c, { linia: `a = ${a},\\quad b = ${b},\\quad c = ${c}` }),
            ...passosFormulaSG(a, b, c, 'x')
        );
    } else if (tipus === 'ordenar') {
        const [p, q, r] = opcions.coefs || [a, b, c];
        passos.push(
            pasTernaSG('ordena', 'x', a, b, c, {
                proporcional: ['a', 'b', 'c'],
                dades: { a, b, c, trampes: eq.trampes },
                linia: `${ternaSG(p, q, r, 'x')} = 0`,
            }),
            ...passosFormulaSG(p, q, r, 'x')
        );
    } else if (tipus === 'biquadrada') {
        passos.push(
            pasTernaSG('canvi', 't', a, b, c, { linia: `t = x^2 \\;\\Rightarrow\\; ${ternaSG(a, b, c, 't')} = 0` }),
            ...passosFormulaSG(a, b, c, 't')
        );
        // Es desfà el canvi per a cada valor de t; els subíndexs de x, seguits
        let base = 1;
        for (const t of arrelsSG(a, b, c)) {
            passos.push(...passosArrelSG(t, base, true));
            if (t[0] > 0) base += 2;
        }
    } else if (tipus === 'senseB') {
        const monomi = texSG(polSG(a, 0, 0));
        passos.push(
            pasSG('aillar', 'x', {
                plantilla: [{ tex: `${monomi} =` }, { camp: 'k' }],
                camps: { k: 'enter' },
                solucio: { k: 0 - c },
                dades: { a, c },
                linia: `${monomi} = ${0 - c}`,
            })
        );
        const k = racional(-c, a);
        if (a !== 1) {
            const enter = k[1] === 1;
            const cru = `\\dfrac{${0 - c}}{${a}}`;
            passos.push(
                pasSG('dividir', 'x', {
                    plantilla: [{ tex: 'x^2 =' }, { camp: 'q' }],
                    camps: { q: enter ? 'enter' : 'racional' },
                    solucio: { q: enter ? k[0] : k },
                    dades: { a, c },
                    linia: cru === texRacional(k) ? `x^2 = ${cru}` : `x^2 = ${cru} = ${texRacional(k)}`,
                })
            );
        }
        passos.push(...passosArrelSG(k));
    } else {
        const dins = texSG(polSG(0, a, b));
        passos.push(
            pasSG('factor', 'x', {
                plantilla: [
                    { tex: 'x\\cdot\\big(' },
                    { camp: 'p' },
                    { tex: 'x +' },
                    { camp: 'q' },
                    { tex: '\\big) = 0' },
                ],
                camps: { p: 'enter', q: 'enter' },
                solucio: { p: a, q: b },
                dades: { a, b },
                linia: `x\\,(${dins}) = 0`,
            }),
            pasParellSG('solucionsFactor', 'x', 1, [0, 1], racional(-b, a), {
                dades: { a, b },
                linia: `x = 0 \\;\\text{ o }\\; ${dins} = 0 \\;\\Rightarrow\\; `,
            })
        );
    }
    // Identificadors únics (a les biquadrades es desfà el canvi dues vegades)
    const vistos = {};
    for (const p of passos) {
        vistos[p.mena] = (vistos[p.mena] || 0) + 1;
        if (vistos[p.mena] > 1) p.id = p.mena + vistos[p.mena];
    }
    return passos;
}

/** Les solucions de l'equació (racionals [n, d], de més gran a més petita). */
export function resolEquacioSG(eq) {
    const { a, b, c } = eq;
    if (eq.tipus !== 'biquadrada') return arrelsSG(a, b, c);
    const sols = [];
    for (const t of arrelsSG(a, b, c)) {
        if (t[0] <= 0) continue;
        const r = [arrelEnteraSG(t[0]), arrelEnteraSG(t[1])];
        sols.push(r, [-r[0], r[1]]);
    }
    return sols.sort((x, y) => y[0] * x[1] - x[0] * y[1]);
}
