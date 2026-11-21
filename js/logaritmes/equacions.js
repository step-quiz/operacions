/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/logaritmes/equacions.js
 * ROL: «Logaritmes i equacions» (logaritmes.html, Batx, sense codi), bloc 2: equacions
 *      exponencials, logarítmiques i irracionals (lliurament 22b). Exercicis i passos del
 *      joc de passos (js/passos/joc-passos.js).
 *      Decisions del David (21/11/2026, artefacte de revisió del 22): C1 nivells; C2 la
 *      comprovació, obligatòria només a les logarítmiques i a les irracionals; C3 de
 *      l'equació de segon grau que surt, només les solucions; E1 errors; E2 5 preguntes.
 * ARQUITECTURA: mòdul pur. L'atzar, amb Math.random.
 *
 *   TIPUS
 *   mateixaBase  4^{x+1} = 8 → 2^{2x+2} = 2^{3} (4 opcions) → x (racional)
 *   logSimple    log₂(2x − 1) = 3 → 2x − 1 = 8 (4 opcions) → x → comprovació
 *   canvi        4^{x} − 6·2^{x} + 8 = 0 → t² − 6t + 8 = 0 (4 opcions) → t₁, t₂ → les x (4 opcions)
 *   prenLogs     3^{x} = 7 → x·log 3 = log 7 (4 opcions) → x (4 decimals)
 *   logSuma      log₂ x + log₂(x − 2) = 3 → x(x − 2) = 8 (4 opcions) → x₁, x₂ → comprovar-les
 *   irracional   √(px + q) = x + c → px + q = x² + 2cx + c² (4 opcions) → x₁, x₂ → comprovar-les
 *   NIVELLS      1 mateixaBase i logSimple · 2 canvi, logSuma i prenLogs · 3 irracional
 *   La comprovació: 3 opcions fixes («Sí», «No: …», «No: …»), en aquest ordre.
 * DEPENDÈNCIES: algebra/racionals.js, strings.js, math-engine.js (texLog).
 * ============================================================================
 */

import { racional, texDecimal, texRacional } from '../algebra/racionals.js';
import { texLog } from './math-engine.js';
import { TEXTOS_EQ } from './strings.js';

const TE = TEXTOS_EQ;
const triaEQ = arr => arr[Math.floor(Math.random() * arr.length)];
const enterEQ = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
function barrejaEQ(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ── Notació ─────────────────────────────────────────────────────────────────
/** Un polinomi [[coef, 'x^2'], [coef, 'x'], [coef, '']] en TeX: «x^2 - 3x + 2». */
export function texPolEQ(termes) {
    let s = '';
    for (const [c, v] of termes) {
        if (!c) continue;
        const abs = Math.abs(c);
        const cos = v && abs === 1 ? v : `${abs}${v}`;
        s += s ? ` ${c < 0 ? '-' : '+'} ${cos}` : `${c < 0 ? '-' : ''}${cos}`;
    }
    return s || '0';
}
const linEQ = (p, q) =>
    texPolEQ([
        [p, 'x'],
        [q, ''],
    ]);
/** Un factor (x + u) per a un producte: x si u = 0. */
const factorEQ = u => (u ? `(${linEQ(1, u)})` : 'x');
/** El valor aʲ en TeX: 8, \dfrac{1}{8}. */
const texPotEQ = (a, j) => (j >= 0 ? String(a ** j) : `\\dfrac{1}{${a ** -j}}`);
/** Una opció d'equació per a triar: [valor, text, null, $tex$]. */
const opcioEQ = (valor, tex) => [valor, tex, null, `$${tex}$`];
/** La correcta i fins a 3 falses diferents; null si no n'hi ha prou (cal tornar a generar). */
function opcionsEQ(bona, falses) {
    const vistes = new Set([bona]);
    const ops = [opcioEQ('ok', bona)];
    const usats = {};
    for (const [err, tex] of falses) {
        if (ops.length >= 4) break;
        if (vistes.has(tex)) continue;
        vistes.add(tex);
        usats[err] = (usats[err] || 0) + 1;
        ops.push(opcioEQ(usats[err] > 1 ? `${err}#${usats[err]}` : err, tex));
    }
    return ops.length === 4 ? barrejaEQ(ops) : null;
}
const pasTria = (id, enunciat, opcions, dades, linia) => ({
    id,
    mena: 'tria',
    nom: TE.nomPas[id],
    enunciat,
    formules: true,
    plantilla: [],
    camps: { tria: 'tria' },
    solucio: { tria: 'ok' },
    opcions,
    dades,
    linia,
});
const pasX = (id, enunciat, x, dades, linia) => ({
    id,
    mena: 'x',
    nom: TE.nomPas[id],
    enunciat,
    formules: true,
    plantilla: [{ grup: [{ tex: 'x =' }, { camp: 'x' }] }],
    camps: { x: 'racional' },
    solucio: { x },
    nota: TE.nota.racional,
    dades,
    linia,
});
/** Les dues solucions d'una equació de segon grau (enters, en qualsevol ordre). */
const pasArrels = (id, enunciat, [r1, r2], lletra, dades, linia) => ({
    id,
    mena: 'arrels',
    nom: TE.nomPas[id],
    enunciat,
    formules: true,
    plantilla: [
        { grup: [{ tex: `${lletra}_1 =` }, { camp: 'x1' }] },
        { grup: [{ tex: `${lletra}_2 =` }, { camp: 'x2' }] },
    ],
    camps: { x1: 'enter', x2: 'enter' },
    solucio: { x1: r1, x2: r2 },
    parell: ['x1', 'x2'],
    nota: TE.nota.dues,
    dades: { ...dades, arrels: [r1, r2] },
    linia,
});
/**
 * Comprovar una solució a l'equació inicial. motiu: null (és bona), 'log' (logaritme d'un
 * negatiu o de zero) o 'segon' (irracional: l'arrel és positiva i el segon membre, negatiu).
 */
function pasComprova(n, x, eq, motiu, tipusEq, linia) {
    const noA = tipusEq === 'log' ? TE.opcions.noLog : TE.opcions.noRadicand;
    const noB = tipusEq === 'log' ? TE.opcions.noIguals : TE.opcions.noSegon;
    const motiuA = tipusEq === 'log' ? 'log' : 'radicand';
    const motiuB = tipusEq === 'log' ? 'iguals' : 'segon';
    const valor = (m, idx) => (!motiu ? `EQ_BONA_DESCARTADA${idx ? '#2' : ''}` : motiu === m ? 'ok' : 'EQ_MOTIU');
    return {
        id: `comprova${n}`,
        mena: 'tria',
        nom: TE.nomPas.comprova,
        enunciat: TE.enunciat.comprova(x, eq),
        formules: true,
        plantilla: [],
        camps: { tria: 'tria' },
        solucio: { tria: 'ok' },
        opcions: [
            [motiu ? 'EQ_FALSA' : 'ok', TE.opcions.si],
            [valor(motiuA, 0), noA],
            [valor(motiuB, 1), noB],
        ],
        dades: { x, motiu },
        linia,
    };
}
const texSolucions = xs =>
    xs.length ? xs.map(x => `x = ${texRacional(x)}`).join(',\\; ') : `\\text{${TE.noTeSolucio}}`;
const fiEQ = xs => `\\quad\\Rightarrow\\quad \\text{${TE.solucio}: } ${texSolucions(xs)}`;
const enunciatX = tex => tex.replace(/\\dfrac/g, '\\tfrac');

// ═════════════════════════════════════════════════════════════════════════════
// NIVELL 1
// ═════════════════════════════════════════════════════════════════════════════
/** Bᵖˣ⁺ᵠ = N amb B = aⁱ i N = aʲ: les dues potències de base a i igualar els exponents. */
export function equacioMateixaBase() {
    for (;;) {
        const a = triaEQ([2, 3, 5]);
        const i = a === 2 ? triaEQ([2, 3]) : a === 3 ? triaEQ([2, 3]) : 2;
        const j = enterEQ(a === 2 ? -3 : -2, a === 2 ? 5 : a === 3 ? 4 : 3);
        const p = triaEQ([1, 1, 2]);
        const q = enterEQ(-3, 3);
        if (i * q === j && p === 1) continue; // x = 0 sense gràcia
        const B = a ** i;
        const eq = `${B}^{${linEQ(p, q)}} = ${texPotEQ(a, j)}`;
        const bona = `${a}^{${linEQ(i * p, i * q)}} = ${a}^{${j}}`;
        const x = racional(j - i * q, i * p);
        // Cada falsa amb la x que en surt: si dona la mateixa x que la bona, no serveix
        const falses = [
            ['EQ_EXPONENT_SENSE_BASE', `${linEQ(p, q)} = ${texPotEQ(a, j)}`, (a ** j - q) / p],
            ['EQ_SIGNE_EXPONENT', `${a}^{${linEQ(i * p, i * q)}} = ${a}^{${-j}}`, (-j - i * q) / (i * p)],
            ['EQ_POTENCIA_DE_POTENCIA', `${a}^{${linEQ(i * p, q)}} = ${a}^{${j}}`, (j - q) / (i * p)],
            ['EQ_POTENCIA_DE_POTENCIA', `${a}^{${linEQ(p, q)}} = ${a}^{${j}}`, (j - q) / p],
        ]
            .filter(([, , xf]) => Math.abs(xf - x[0] / x[1]) > 1e-9)
            .map(([err, tex]) => [err, tex]);
        const opcions = opcionsEQ(bona, falses);
        if (!opcions) continue;
        const dades = { a, i, j, p, q, B, x };
        return {
            tipus: 'mateixaBase',
            eq,
            passos: [
                pasTria('mateixaBase', TE.enunciat.mateixaBase(a), opcions, dades, `${eq} \\iff ${bona}`),
                pasX(
                    'exponents',
                    TE.enunciat.igualaExponents,
                    x,
                    dades,
                    `${linEQ(i * p, i * q)} = ${j} \\iff x = ${texRacional(x)}`
                ),
            ],
            solucions: [x],
        };
    }
}

/** log_b(px + q) = m: la forma exponencial, la x i comprovar-la (sempre és bona). */
export function equacioLogSimple() {
    for (;;) {
        const b = triaEQ([2, 3, 5, 10]);
        const max = { 2: 4, 3: 3, 5: 2, 10: 2 }[b];
        const m = Math.random() < 0.15 ? -1 : enterEQ(1, max);
        const p = triaEQ([1, 2, 3]);
        const q = enterEQ(-5, 5);
        if (!q) continue;
        const N = racional(m >= 0 ? b ** m : 1, m >= 0 ? 1 : b);
        const nTex = texRacional(N);
        const lin = linEQ(p, q);
        const eq = `${texLog(b)}(${lin}) = ${m}`;
        const falses = [
            ['EQ_LOG_PRODUCTE', `${lin} = ${m * b}`],
            ...(b <= 5 ? [['EQ_BASE_EXPONENT', `${lin} = ${m ** b}`]] : []),
            ['EQ_TREU_LOG', `${lin} = ${m}`],
        ];
        const bona = `${lin} = ${nTex}`;
        const opcions = opcionsEQ(bona, falses);
        if (!opcions) continue;
        const x = racional(N[0] - q * N[1], p * N[1]);
        const xTex = texRacional(x);
        const dades = { b, m, p, q, N, x };
        return {
            tipus: 'logSimple',
            eq,
            passos: [
                pasTria('treuLog', TE.enunciat.treuLog, opcions, dades, `${eq} \\iff ${bona}`),
                pasX('primerGrau', TE.enunciat.primerGrau, x, dades, `${bona} \\iff x = ${xTex}`),
                pasComprova(
                    0,
                    enunciatX(xTex),
                    eq,
                    null,
                    'log',
                    `x = ${xTex}:\\; ${lin} = ${nTex} > 0\\;\\checkmark${fiEQ([x])}`
                ),
            ],
            solucions: [x],
        };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// NIVELL 2
// ═════════════════════════════════════════════════════════════════════════════
/** a²ˣ − S·aˣ + P = 0 (o (a²)ˣ): canvi t = aˣ, t₁ i t₂, i desfer el canvi (t ≤ 0 no dona x). */
export function equacioCanvi() {
    for (;;) {
        const a = triaEQ([2, 3]);
        const kmax = a === 2 ? 3 : 2;
        const k1 = enterEQ(0, kmax);
        const dues = Math.random() < 0.6;
        let t2;
        let k2 = null;
        let jNeg = null;
        if (dues) {
            k2 = enterEQ(0, kmax);
            if (k2 === k1) continue;
            t2 = a ** k2;
        } else {
            jNeg = enterEQ(1, 2);
            if (jNeg === k1) continue; // S = 0
            t2 = -(a ** jNeg);
        }
        const t1 = a ** k1;
        const S = t1 + t2;
        const P = t1 * t2;
        const quadrada = Math.random() < 0.5;
        const primer = quadrada ? `${a * a}^{x}` : `${a}^{2x}`;
        const eq = `${texPolEQ([
            [1, primer],
            [-S, S === 1 || S === -1 ? `${a}^{x}` : `\\cdot ${a}^{x}`],
            [P, ''],
        ])} = 0`;
        const eqT = `${texPolEQ([
            [1, 't^2'],
            [-S, 't'],
            [P, ''],
        ])} = 0`;
        // Sense agrupar els termes semblants: és el que escriu qui s'equivoca
        const ambT = (a2, v2) =>
            `${texPolEQ([
                [a2, v2],
                [-S, v2],
                [P, ''],
            ])} = 0`;
        const falsesT = [
            ['EQ_CANVI_DOBLE', ambT(2, 't')],
            ['EQ_CANVI', ambT(1, 't^2')],
            ['EQ_CANVI', ambT(1, 't')],
        ];
        const opT = opcionsEQ(eqT, falsesT);
        if (!opT) continue;
        // Les solucions en x
        const bones = dues ? [k1, k2].sort((u, v) => u - v) : [k1];
        const setTex = xs => (xs.length ? xs.map(x => `x = ${texRacional(x)}`).join(' \\text{ i } ') : '');
        const conjunt = xs => {
            const u = [...new Map(xs.map(x => [texRacional(x), x])).values()];
            return u.sort((p, q) => (Array.isArray(p) ? p[0] / p[1] : p) - (Array.isArray(q) ? q[0] / q[1] : q));
        };
        const falsesX = [];
        if (dues) {
            falsesX.push(['EQ_T_ES_X', setTex(conjunt([t1, t2]))]);
            falsesX.push(['EQ_BONA_DESCARTADA', setTex([k1])]);
            falsesX.push(['EQ_BONA_DESCARTADA', setTex([k2])]);
            falsesX.push(['EQ_DIVIDEIX', setTex(conjunt([racional(t1, a), racional(t2, a)]))]);
        } else {
            falsesX.push(['EQ_T_NEGATIU', setTex(conjunt([k1, jNeg]))]);
            falsesX.push(['EQ_T_NEGATIU', setTex(conjunt([k1, -jNeg]))]);
            falsesX.push(['EQ_T_ES_X', setTex(conjunt([t1, t2]))]);
            falsesX.push(['EQ_BONA_DESCARTADA', `\\text{${TE.opcions.capSolucio}}`]);
        }
        const opX = opcionsEQ(
            setTex(bones),
            falsesX.filter(([, t]) => t)
        );
        if (!opX) continue;
        // Text pla a l'aria-label: sense TeX
        for (const o of opX)
            o[1] = o[1]
                .replace(/\s*\\text\{\s*([^}]*?)\s*\}\s*/g, ' $1 ')
                .trim()
                .replace(/\\dfrac\{(\d+)\}\{(\d+)\}/g, '$1/$2');
        const desfes = [t1, t2]
            .sort((u, v) => v - u)
            .map(t =>
                t > 0
                    ? `${a}^{x} = ${t} \\Rightarrow x = ${Math.round(Math.log(t) / Math.log(a))}`
                    : `${a}^{x} = ${t}\\ \\text{${TE.noTeSolucio}}`
            )
            .join(';\\quad ');
        const tAx = quadrada ? `${a * a}^{x} = (${a}^{x})^{2} = t^{2}` : `${a}^{2x} = (${a}^{x})^{2} = t^{2}`;
        const dades = { a, t1, t2, S, P, quadrada, bones };
        return {
            tipus: 'canvi',
            eq,
            passos: [
                pasTria('canvi', TE.enunciat.canvi(a, tAx), opT, dades, `t = ${a}^{x}:\\; ${eqT}`),
                pasArrels('arrelsT', TE.enunciat.arrelsT(eqT), [t1, t2], 't', dades, `t_1 = ${t1},\\; t_2 = ${t2}`),
                pasTria('desfesCanvi', TE.enunciat.desfesCanvi(a), opX, dades, `${desfes}${fiEQ(bones)}`),
            ],
            solucions: bones,
        };
    }
}

/** aˣ = N (N no és potència de a): prendre logaritmes i la calculadora. */
export function equacioPrenLogs() {
    for (;;) {
        const a = triaEQ([2, 3, 5, 7]);
        const N = triaEQ([3, 5, 6, 7, 10, 12, 15, 20, 30, 40, 50, 100, 200]);
        const e = Math.log(N) / Math.log(a);
        if (Math.abs(e - Math.round(e)) < 1e-9 || N === a) continue;
        const eq = `${a}^{x} = ${N}`;
        const bona = `x \\log ${a} = \\log ${N}`;
        const opcions = opcionsEQ(
            bona,
            barrejaEQ([
                ['EQ_LOG_QUOCIENT', `x = \\log ${N} - \\log ${a}`],
                ['EQ_LOG_QUOCIENT', `x = \\log \\dfrac{${N}}{${a}}`],
                ['EQ_DIVIDEIX', `x = \\dfrac{${N}}{${a}}`],
            ])
        );
        const x4 = Math.round(e * 1e4) / 1e4;
        const dades = { a, N, x: e };
        return {
            tipus: 'prenLogs',
            eq,
            passos: [
                pasTria('prenLogs', TE.enunciat.prenLogs, opcions, dades, `${eq} \\iff ${bona}`),
                {
                    id: 'calculadora',
                    mena: 'calculadoraEQ',
                    nom: TE.nomPas.calculadora,
                    enunciat: TE.enunciat.calculadora,
                    formules: true,
                    plantilla: [{ grup: [{ tex: `x = \\dfrac{\\log ${N}}{\\log ${a}} \\approx` }, { camp: 'v' }] }],
                    camps: { v: 'decimal' },
                    solucio: { v: x4 },
                    tolerancia: { v: 1e-4 },
                    nota: TE.nota.decimals,
                    dades,
                    linia: `x = \\dfrac{\\log ${N}}{\\log ${a}} \\approx ${texDecimal(racional(Math.round(x4 * 1e4), 1e4))}`,
                },
            ],
            solucions: [e],
        };
    }
}

/** Totes les equacions log_b(x + u) + log_b(x − d) = m amb solucions enteres (una de falsa). */
const LOG_SUMA = (() => {
    const llista = [];
    for (const b of [2, 3, 5, 10])
        for (const m of [2, 3, 4]) {
            const N = b ** m;
            if (N > 100 || (b === 2 && m === 2)) continue;
            for (let u = 0; u <= 4; u++)
                for (let d = 0; d <= 5; d++) {
                    if (u === 0 && d === 0) continue;
                    // (x + u)(x − d) = N ⟺ x² + (u − d)x − (ud + N) = 0
                    const B = u - d;
                    const C = -(u * d + N);
                    const disc = B * B - 4 * C;
                    const s = Math.round(Math.sqrt(disc));
                    if (s * s !== disc || (s - B) % 2) continue;
                    const r1 = (-B + s) / 2;
                    const r2 = (-B - s) / 2;
                    llista.push({ b, m, N, u, d, B, C, bona: r1, falsa: r2 });
                }
        }
    return llista;
})();

/** log_b(x + u) + log_b(x − d) = m: un sol logaritme, el segon grau i comprovar les dues. */
export function equacioLogSuma() {
    const { b, m, N, u, d, B, C, bona, falsa } = triaEQ(LOG_SUMA);
    const lg = texLog(b);
    const A1 = u ? `(${linEQ(1, u)})` : ' x';
    const A2 = d ? `(${linEQ(1, -d)})` : ' x';
    const eq = `${lg}${A1} + ${lg}${A2} = ${m}`;
    const prod = `${factorEQ(u)}${factorEQ(-d)}`;
    const bonaEq = `${prod} = ${N}`;
    const opcions = opcionsEQ(bonaEq, [
        ['EQ_LOG_SUMA', `${factorEQ(u)} + ${factorEQ(-d)} = ${N}`],
        ['EQ_LOG_PRODUCTE', `${prod} = ${m * b}`],
        ['EQ_TREU_LOG', `${prod} = ${m}`],
    ]);
    const quad = `${texPolEQ([
        [1, 'x^2'],
        [B, 'x'],
        [C, ''],
    ])} = 0`;
    const dades = { b, m, N, u, d, bona, falsa };
    const ordre = Math.random() < 0.5 ? [bona, falsa] : [falsa, bona];
    const arg = (x, w) => x + w;
    const liniaComprova = (x, i) => {
        const fi = i === 1 ? fiEQ([bona]) : '';
        if (x === bona)
            return `x = ${x}:\\; ${linEQ(1, u)} = ${arg(x, u)} > 0,\\; ${linEQ(1, -d)} = ${arg(x, -d)} > 0\\;\\checkmark${fi}`;
        const negatiu = arg(x, u) <= 0 ? [linEQ(1, u), arg(x, u)] : [linEQ(1, -d), arg(x, -d)];
        return `x = ${x}:\\; ${negatiu[0]} = ${negatiu[1]} \\le 0\\;\\Rightarrow\\; ${lg}(${negatiu[1]})\\ \\text{no existeix}${fi}`;
    };
    return {
        tipus: 'logSuma',
        eq,
        passos: [
            pasTria(
                'unLog',
                TE.enunciat.unLog,
                opcions,
                dades,
                `${eq} \\iff ${lg}\\big(${prod}\\big) = ${m} \\iff ${bonaEq}`
            ),
            pasArrels(
                'arrels',
                TE.enunciat.arrels(quad),
                [bona, falsa],
                'x',
                dades,
                `${quad} \\iff x_1 = ${bona},\\; x_2 = ${falsa}`
            ),
            ...ordre.map((x, i) =>
                pasComprova(i, String(x), eq, x === bona ? null : 'log', 'log', liniaComprova(x, i))
            ),
        ],
        solucions: [bona],
        candidats: [bona, falsa],
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// NIVELL 3
// ═════════════════════════════════════════════════════════════════════════════
/** √(px + q) = x + c: elevar al quadrat, el segon grau i comprovar les dues (sovint una és falsa). */
export function equacioIrracional() {
    for (;;) {
        const c = triaEQ([-3, -2, -1, 1, 2, 3]);
        const r1 = enterEQ(1 - c, 9 - c); // r1 + c ≥ 1: bona
        const falsa = Math.random() < 0.7;
        const r2 = falsa ? enterEQ(-8 - c, -1 - c) : enterEQ(-c, 9 - c);
        if (r1 === r2) continue;
        const p = 2 * c + r1 + r2;
        const q = c * c - r1 * r2;
        if (p < 1 || p > 12 || Math.abs(q) > 40 || !q) continue;
        const rad = linEQ(p, q);
        const dret = linEQ(1, c);
        const eq = `\\sqrt{${rad}} = ${dret}`;
        const quadrat = texPolEQ([
            [1, 'x^2'],
            [2 * c, 'x'],
            [c * c, ''],
        ]);
        const bonaEq = `${rad} = ${quadrat}`;
        const opcions = opcionsEQ(bonaEq, [
            [
                'EQ_QUADRAT_BINOMI',
                `${rad} = ${texPolEQ([
                    [1, 'x^2'],
                    [c * c, ''],
                ])}`,
            ],
            [
                'EQ_QUADRAT_SIGNE',
                `${rad} = ${texPolEQ([
                    [1, 'x^2'],
                    [-2 * c, 'x'],
                    [c * c, ''],
                ])}`,
            ],
            ['EQ_RADICAND', `(${rad})^{2} = ${quadrat}`],
        ]);
        if (!opcions) continue;
        const B = 2 * c - p;
        const C = c * c - q;
        const quad = `${texPolEQ([
            [1, 'x^2'],
            [B, 'x'],
            [C, ''],
        ])} = 0`;
        const [x1, x2] = [r1, r2].sort((u, v) => v - u);
        const bones = [r1, r2].filter(r => r + c >= 0).sort((u, v) => u - v);
        const dades = { p, q, c, r1, r2, bones };
        const ordre = Math.random() < 0.5 ? [r1, r2] : [r2, r1];
        const liniaComprova = (x, i) => {
            const fi = i === 1 ? fiEQ(bones) : '';
            const arrel = Math.abs(x + c);
            if (x + c >= 0)
                return `x = ${x}:\\; \\sqrt{${p * x + q}} = ${arrel} = ${x} ${c < 0 ? '-' : '+'} ${Math.abs(c)}\\;\\checkmark${fi}`;
            return `x = ${x}:\\; \\sqrt{${p * x + q}} = ${arrel} \\ne ${x} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${x + c}${fi}`;
        };
        return {
            tipus: 'irracional',
            eq,
            passos: [
                pasTria('eleva', TE.enunciat.eleva, opcions, dades, `${eq} \\;\\Rightarrow\\; ${bonaEq}`),
                pasArrels(
                    'arrels',
                    TE.enunciat.arrels(quad),
                    [x1, x2],
                    'x',
                    dades,
                    `${quad} \\iff x_1 = ${x1},\\; x_2 = ${x2}`
                ),
                ...ordre.map((x, i) =>
                    pasComprova(i, String(x), eq, x + c >= 0 ? null : 'segon', 'radical', liniaComprova(x, i))
                ),
            ],
            solucions: bones,
            candidats: [r1, r2],
        };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// LA PREGUNTA
// ═════════════════════════════════════════════════════════════════════════════
const PER_NIVELL_EQ = {
    1: [equacioMateixaBase, equacioLogSimple],
    2: [equacioCanvi, equacioLogSuma, equacioPrenLogs],
    3: [equacioIrracional],
};
/** Una pregunta d'equacions del nivell (1 a 3). */
export function generaPreguntaEQ({ nivell = 1 } = {}) {
    const ex = triaEQ(PER_NIVELL_EQ[Math.min(3, Math.max(1, nivell))])();
    return { ...ex, tex: `\\text{${TE.que} } ${ex.eq}`, text: TE.que, clau: `${ex.tipus}|${ex.eq}` };
}
