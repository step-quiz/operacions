/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estudi-funcio/math-engine.js
 * ROL: «Estudi d'una funció» (1r–2n Batx): les funcions, el seu estudi exacte
 *      (domini, f′, f″, zeros, taules de signes, extrems i inflexions) i la
 *      pregunta del joc de passos (js/passos/joc-passos.js), amb les opcions falses
 *      de cada pas fetes amb els errors típics.
 * ARQUITECTURA: mòdul pur (cap DOM). L'atzar, amb Math.random (els tests el sembren).
 *
 *   FUNCIÓ (def)   { id, tipus: 'polinomica' | 'racional', P, Q, asimptotes: [{v}|{h}|{m, n}] }
 *                  f = P/Q, P i Q polinomis d'enters (polinomis-ef.js); Q = [1] per als polinomis.
 *                  Famílies (totes amb els punts de les taules separats com a mínim 2 unitats, o
 *                  amb un enter entre dos punts, perquè els punts de prova siguin enters):
 *                  cubica         f′ = 3a(x − p)(x − q), p i q de la mateixa paritat
 *                  cubica-doble   f′ = 3a(x − p)²: un punt crític que no és extrem
 *                  cubica-sense   f′ = 3a((x − h)² + 1): f′ no s'anul·la mai
 *                  quartica       a·g(x − h) + d, g(t) = t⁴ − 4kt³ (x⁴ − 4x³, de la PAU)
 *                  obliqua        x + s + k/(x − c)  ((x² − 2x)/(x − 1), PAU 2025)
 *                  campana        αx/(x² + β²)       (5x/(x² + 1), PAU 2026: inflexions a ±β√3)
 *                  dues-verticals kx²/(x² − c²)      (x²/(x² − 4))
 *                  homografica    (ax + b)/(x − c)   (f′ no s'anul·la mai)
 *   Els 6 exercicis de PAU són els del DEMO «Gràfica d'una funció» de step-quiz/pau.
 *   ESTUDI          estudiaFuncio(def) → { f, fora, d1, d2, taula1, taula2, extrems, inflexions, … }
 *   PREGUNTA        generaPreguntaEF({ funcions, index }) → la pregunta del joc de passos
 * DEPENDÈNCIES: polinomis-ef.js, passos/taula-signes.js, passos/esbos-funcio.js, strings.js.
 * ============================================================================
 */

import {
    arrelQ,
    arrels,
    pDeriva,
    pDesplaca,
    pDeArrels,
    pEscala,
    pEsZero,
    pGrau,
    pNet,
    pProducte,
    pResta,
    pSuma,
    pTex,
    pValor,
    pValorQ,
    pValorSurd,
    quocientSurd,
    texQ,
    texQuocient,
    texSurd,
    textQ,
    textSurd,
} from './polinomis-ef.js';
import { racional } from '../algebra/racionals.js';
import { columnesTaula, htmlTaula, puntDeProva } from '../passos/taula-signes.js';
import { finestraEsbos, svgEsbos } from '../passos/esbos-funcio.js';
import { TEXTOS_EF } from './strings.js';

const T = TEXTOS_EF;
const tria = arr => arr[Math.floor(Math.random() * arr.length)];
const barreja = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// ═════════════════════════════════════════════════════════════════════════════
// FAMÍLIES
// ═════════════════════════════════════════════════════════════════════════════
const POL = 'polinomica';
const RAC = 'racional';

export const FAMILIES_EF = {
    'cubica'({ a, p, q, d }) {
        // f′ = 3a(x − p)(x − q) → f = a x³ − 3a(p+q)/2 x² + 3apq x + d
        return { tipus: POL, P: [d, 3 * a * p * q, (-3 * a * (p + q)) / 2, a], Q: [1], asimptotes: [] };
    },
    'cubica-doble'({ a, p, d }) {
        return { tipus: POL, P: pSuma(pEscala(pDeArrels(1, [p, p, p]), a), [d]), Q: [1], asimptotes: [] };
    },
    'cubica-sense'({ a, h, d }) {
        // a((x − h)³ + 3(x − h)) + d
        return { tipus: POL, P: pSuma(pEscala(pDesplaca([0, 3, 0, 1], h), a), [d]), Q: [1], asimptotes: [] };
    },
    'quartica'({ a, k, h, d }) {
        return { tipus: POL, P: pSuma(pEscala(pDesplaca([0, 0, 0, -4 * k, 1], h), a), [d]), Q: [1], asimptotes: [] };
    },
    'obliqua'({ s, c, k }) {
        // x + s + k/(x − c) = ((x + s)(x − c) + k)/(x − c)
        return {
            tipus: RAC,
            P: pSuma(pProducte([s, 1], [-c, 1]), [k]),
            Q: [-c, 1],
            asimptotes: [{ v: c }, { m: 1, n: s }],
        };
    },
    'campana'({ alfa, beta }) {
        return { tipus: RAC, P: [0, alfa], Q: [beta * beta, 0, 1], asimptotes: [{ h: 0 }] };
    },
    'dues-verticals'({ k, c }) {
        return { tipus: RAC, P: [0, 0, k], Q: [-c * c, 0, 1], asimptotes: [{ v: -c }, { v: c }, { h: k }] };
    },
    'homografica'({ a, b, c }) {
        return { tipus: RAC, P: [b, a], Q: [-c, 1], asimptotes: [{ v: c }, { h: a }] };
    },
};

/** Paràmetres a l'atzar de cada família (els punts de les taules queden separats). */
const PARAMS = {
    'cubica'() {
        const p = tria([-3, -2, -1, 0, 1]);
        const q = p + tria([2, 4]);
        return { a: tria([1, -1]), p, q, d: tria([-2, -1, 0, 1, 2, 3]) };
    },
    'cubica-doble': () => ({ a: tria([1, -1]), p: tria([-2, -1, 1, 2]), d: tria([-2, -1, 0, 1, 2]) }),
    'cubica-sense': () => ({ a: tria([1, -1]), h: tria([-1, 0, 1]), d: tria([-1, 0, 1, 2]) }),
    'quartica': () => ({ a: tria([1, -1]), k: tria([1, -1]), h: tria([-1, 0, 1]), d: tria([-2, 0, 2]) }),
    'obliqua': () => ({ s: tria([-2, -1, 0, 1, 2]), c: tria([-2, -1, 1, 2]), k: tria([4, 9, -1, -4]) }),
    'campana': () => ({ alfa: tria([2, 3, 4, 5, 6, -2, -4]), beta: tria([1, 1, 2]) }),
    'dues-verticals': () => ({ k: tria([1, 2, -1]), c: tria([2, 3]) }),
    'homografica'() {
        const a = tria([1, 2, -1]);
        const c = tria([-2, -1, 1, 2, 3]);
        let b;
        do b = tria([-3, -2, -1, 1, 2, 3]);
        while (a * c + b === 0);
        return { a, b, c };
    },
};
const GRUPS = {
    polinomiques: ['cubica', 'cubica', 'cubica-doble', 'cubica-sense', 'quartica'],
    racionals: ['obliqua', 'campana', 'dues-verticals', 'homografica'],
};

/** Els 6 exercicis de PAU (els del DEMO de pau), en ordre. */
export const PAU_EF = [
    { familia: 'cubica', params: { a: 1, p: 1, q: 3, d: 0 } }, // x³ − 6x² + 9x
    { familia: 'cubica', params: { a: 1, p: -1, q: 1, d: 0 } }, // x³ − 3x
    { familia: 'quartica', params: { a: 1, k: 1, h: 0, d: 0 } }, // x⁴ − 4x³
    { familia: 'obliqua', params: { s: -1, c: 1, k: -1 } }, // (x² − 2x)/(x − 1)
    { familia: 'campana', params: { alfa: 5, beta: 1 } }, // 5x/(x² + 1)
    { familia: 'dues-verticals', params: { k: 1, c: 2 } }, // x²/(x² − 4)
];

export function defFuncio(familia, params) {
    return { id: familia, params, ...FAMILIES_EF[familia](params) };
}

// ═════════════════════════════════════════════════════════════════════════════
// ESTUDI EXACTE
// ═════════════════════════════════════════════════════════════════════════════
const esPolinomi = Q => pGrau(Q) === 0 && Q[0] === 1;
/** f′ = N1/Q² (o P′) i f″ = N2/Q³ (o P″), amb N1 = P′Q − PQ′ i N2 = N1′Q − 2N1Q′. */
export function derivades(P, Q) {
    if (esPolinomi(Q)) {
        const N1 = pDeriva(P);
        return { N1, N2: pDeriva(N1) };
    }
    const N1 = pResta(pProducte(pDeriva(P), Q), pProducte(P, pDeriva(Q)));
    const N2 = pResta(pProducte(pDeriva(N1), Q), pEscala(pProducte(N1, pDeriva(Q)), 2));
    return { N1, N2 };
}

/** y = f(x) exacta en una ARREL: { v, tex, text }. */
function valorExacte(P, Q, arrel) {
    if (arrel.q) {
        const y = racional(
            pValorQ(P, arrel.q)[0] * pValorQ(Q, arrel.q)[1],
            pValorQ(P, arrel.q)[1] * pValorQ(Q, arrel.q)[0]
        );
        return { v: y[0] / y[1], tex: texQ(y), text: textQ(y), q: y };
    }
    const { s, r } = arrel.surd;
    const y = quocientSurd(pValorSurd(P, s, r), pValorSurd(Q, s, r), r);
    return {
        v: y[0][0] / y[0][1] + (y[1][0] / y[1][1]) * Math.sqrt(r),
        tex: texSurd(y, r),
        text: textSurd(y, r),
        q: null,
    };
}

/**
 * Una taula de signes: punts (zeros de N i punts fora del domini), columnes, el signe de la
 * derivada a cada columna i la fila de f ('monotonia' o 'concavitat').
 */
function taulaDe(zeros, fora, df, mode) {
    const punts = [
        ...zeros.map(z => ({ ...z, tipusPunt: 'zero' })),
        ...fora.map(z => ({ ...z, tipusPunt: 'fora' })),
    ].sort((u, v) => u.v - v.v);
    const columnes = columnesTaula(punts.map(p => ({ v: p.v, text: p.text, dades: { tipusPunt: p.tipusPunt } })));
    const signe = columnes.map((c, i) => {
        if (c.tipus === 'punt') return c.tipusPunt === 'zero' ? 'zero' : 'no';
        return df(puntDeProva(c)) > 0 ? 'mes' : 'menys';
    });
    const f = columnes.map((c, i) => {
        if (c.tipus === 'interval') {
            if (mode === 'monotonia') return signe[i] === 'mes' ? 'creix' : 'decreix';
            return signe[i] === 'mes' ? 'conc+' : 'conc-';
        }
        if (c.tipusPunt === 'fora') return 'no';
        const [abans, despres] = [signe[i - 1], signe[i + 1]];
        if (abans === despres) return 'cap';
        if (mode === 'concavitat') return 'inf';
        return abans === 'mes' ? 'max' : 'min';
    });
    return { punts, columnes, signe, f };
}

export function estudiaFuncio(def) {
    const { P, Q } = def;
    const polinomi = esPolinomi(Q);
    const { N1, N2 } = derivades(P, Q);
    const f = x => pValor(P, x) / pValor(Q, x);
    const d1f = x => pValor(N1, x) / pValor(Q, x) ** 2;
    const d2f = x => pValor(N2, x) / pValor(Q, x) ** 3;
    const fora = polinomi ? [] : arrels(Q);
    const zeros1 = pEsZero(N1) ? [] : arrels(N1);
    const zeros2 = pEsZero(N2) ? [] : arrels(N2);
    const taula1 = taulaDe(zeros1, fora, d1f, 'monotonia');
    const taula2 = taulaDe(zeros2, fora, d2f, 'concavitat');
    const marcats = (taula, valors) =>
        taula.columnes
            .map((c, i) => ({ c, i, tipus: taula.f[i] }))
            .filter(({ tipus }) => valors.includes(tipus))
            .map(({ i, tipus }) => {
                const p = taula.punts[(i - 1) / 2];
                return { x: p, y: valorExacte(P, Q, p), tipus };
            });
    return {
        def,
        polinomi,
        P,
        Q,
        N1,
        N2,
        f,
        d1f,
        d2f,
        fora,
        zeros1,
        zeros2,
        taula1,
        taula2,
        extrems: marcats(taula1, ['max', 'min']),
        inflexions: marcats(taula2, ['inf']),
        texF: texQuocient(P, Q, 1),
        texD1: polinomi ? pTex(N1) : texQuocient(N1, Q, 2),
        texD2: polinomi ? pTex(N2) : texQuocient(N2, Q, 3),
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// OPCIONS FALSES
// ═════════════════════════════════════════════════════════════════════════════
const XS_CLAU = [-2.71, -0.63, 0.47, 1.29, 2.93, 4.17];
/** La «clau» d'una expressió N/Q^e: els seus valors en uns quants punts (per no repetir valors). */
const clauValors = fn => XS_CLAU.map(x => fn(x).toPrecision(9)).join('|');

/** Derivada (de P, polinomi) i les seves opcions falses. */
function opcionsDerivadaPolinomi(P, correcta) {
    const c = pNet(P);
    const cands = [];
    if (pGrau(c) >= 1) {
        cands.push(['EF_D_NO_MULT', pNet(c.slice(1))]);
        cands.push(['EF_D_NO_BAIXA', pNet([0, ...c.slice(1).map((k, i) => k * (i + 1))])]);
    }
    if (c[0] !== 0) cands.push(['EF_D_CONST', pSuma(correcta, [c[0]])]);
    // Un terme amb el signe canviat (el de grau més baix; després, el següent)
    const termes = correcta.map((k, g) => [k, g]).filter(([k]) => k !== 0);
    for (const [, g] of termes.slice(0, 2)) {
        const q = correcta.slice();
        q[g] = -q[g];
        cands.push(['EF_D_SIGNE', pNet(q)]);
    }
    return cands.map(([err, N]) => ({ err, tex: pTex(N), fn: x => pValor(N, x) }));
}

function opcionsQuocient(P, Q) {
    const [dP, dQ] = [pDeriva(P), pDeriva(Q)];
    const a = pProducte(dP, Q);
    const b = pProducte(P, dQ);
    const N1 = pResta(a, b);
    const cands = [
        ['EF_Q_SUMA', pSuma(a, b), 2],
        ['EF_Q_ORDRE', pResta(b, a), 2],
        ['EF_Q_QUADRAT', N1, 1],
    ];
    const r = cands.map(([err, N, e]) => ({
        err,
        tex: texQuocient(N, Q, e),
        fn: x => pValor(N, x) / pValor(Q, x) ** e,
    }));
    r.push({
        err: 'EF_Q_SEPARAT',
        tex: pGrau(dQ) === 0 && dQ[0] === 1 ? pTex(dP) : `\\dfrac{${pTex(dP)}}{${pTex(dQ)}}`,
        fn: x => pValor(dP, x) / pValor(dQ, x),
    });
    return r;
}

function opcionsSegonaQuocient(N1, Q) {
    const [dN, dQ] = [pDeriva(N1), pDeriva(Q)];
    const a = pProducte(dN, Q);
    const b = pProducte(N1, dQ);
    const N2 = pResta(a, pEscala(b, 2));
    const cands = [
        ['EF_Q2_FACTOR2', pResta(a, b), 3],
        ['EF_Q2_SIGNE', pSuma(a, pEscala(b, 2)), 3],
        ['EF_Q2_EXP', N2, 4],
        ['EF_Q2_DEN2', N2, 2],
    ];
    return cands.map(([err, N, e]) => ({
        err,
        tex: texQuocient(N, Q, e),
        fn: x => pValor(N, x) / pValor(Q, x) ** e,
    }));
}

/**
 * Tria fins a 3 opcions falses (per ordre de prioritat) que no valguin el mateix que la correcta
 * ni entre elles, i les barreja amb la correcta. Torna [[valor, text, null, formules]].
 */
function triaOpcions(correcta, cands, n = 3) {
    const vistes = new Set([correcta.clau]);
    const triades = [];
    const usats = {};
    for (const c of cands) {
        if (triades.length >= n) break;
        if (vistes.has(c.clau)) continue;
        vistes.add(c.clau);
        usats[c.err] = (usats[c.err] || 0) + 1;
        const valor = usats[c.err] > 1 ? `${c.err}#${usats[c.err]}` : c.err;
        triades.push([valor, c.text, null, c.formules]);
    }
    return barreja([['ok', correcta.text, null, correcta.formules], ...triades]);
}

const opcioExpr = o => ({ ...o, clau: clauValors(o.fn), text: o.tex, formules: `$${o.tex}$` });

// ── Conjunts de punts (zeros, domini) ───────────────────────────────────────
const clauConjunt = ps =>
    ps
        .map(p => p.v.toFixed(6))
        .sort()
        .join('|') || 'cap';
const unic = ps => ps.filter((p, i) => ps.findIndex(q => Math.abs(q.v - p.v) < 1e-9) === i).sort((u, v) => u.v - v.v);
const oposat = p =>
    p.q
        ? arrelQ([-p.q[0], p.q[1]])
        : {
              ...p,
              v: -p.v,
              tex: p.tex.startsWith('-') ? p.tex.slice(1) : `-${p.tex}`,
              text: p.text.startsWith('−') ? p.text.slice(1) : `−${p.text}`,
              surd: { ...p.surd, s: [-p.surd.s[0], p.surd.s[1]] },
          };
const enter = n => arrelQ([n, 1]);
/** «$x = 1$ i $x = 3$» (text amb fórmules) i el TeX de la línia («x = 1 \text{ o } x = 3»). */
function textConjunt(ps, buit) {
    if (!ps.length) return buit;
    const f = ps.map(p => `$x = ${p.tex}$`);
    return f.length === 1 ? f[0] : `${f.slice(0, -1).join(', ')} ${T.opcions.i} ${f[f.length - 1]}`;
}
const texConjuntO = ps => ps.map(p => `x = ${p.tex}`).join(' \\text{ o } ');

function opcionsConjunt(correcte, cands, buit) {
    const fes = (err, ps) => {
        const u = unic(ps);
        const text = textConjunt(u, buit);
        return { err, clau: clauConjunt(u), text: text.replace(/\$/g, ''), formules: text };
    };
    const c = fes('ok', correcte);
    return triaOpcions(
        c,
        cands.map(([err, ps]) => fes(err, ps))
    );
}

/** Arrels de P (per a l'error «zeros de f»), si se'n poden trobar. */
const arrelsSegures = P => {
    try {
        return pEsZero(P) ? [] : arrels(P);
    } catch {
        return null;
    }
};

function candidatsZeros(zeros, est) {
    const c = [];
    const desplaca = k => zeros.map(z => (z.q ? enter(z.v + k) : z)).filter(Boolean);
    if (zeros.length) c.push(['EF_Z_SIGNE', zeros.map(oposat)]);
    if (est.fora.length) c.push(['EF_Z_FORA', [...zeros, ...est.fora]]);
    const deF = arrelsSegures(est.P);
    if (deF && deF.length) c.push(['EF_Z_DE_F', deF]);
    if (zeros.some(z => z.surd))
        c.push(['EF_Z_ARREL', zeros.map(z => (z.surd ? arrelQ([z.surd.s[0] * z.surd.r, z.surd.s[1]]) : z))]);
    if (zeros.length >= 2) c.push(['EF_Z_FALTA', zeros.slice(0, -1)], ['EF_Z_FALTA', zeros.slice(1)]);
    if (zeros.length) c.push(['EF_Z_CAP', []]);
    if (!zeros.length) {
        // f′ sense zeros: x² = −1 «resolt» com x = ±1, x = 0
        c.push(['EF_Z_IMAGINARI', [enter(-1), enter(1)]]);
        c.push(['EF_Z_ZERO', [enter(0)]]);
    }
    if (zeros.length === 1 && zeros[0].q) c.push(['EF_Z_SIGNE', [zeros[0], oposat(zeros[0])]]);
    c.push(['EF_Z_ALTRE', desplaca(1)], ['EF_Z_ALTRE', desplaca(-1)], ['EF_Z_ALTRE', [enter(2), enter(-2)]]);
    return c;
}

function candidatsDomini(est) {
    const c = [];
    const { fora } = est;
    const num = arrelsSegures(est.P);
    if (num && num.length) c.push(['EF_DOM_NUM', num]);
    if (fora.length) {
        c.push(['EF_DOM_SIGNE', fora.map(oposat)]);
        c.push(['EF_DOM_CAP', []]);
    } else {
        // x² + β² = 0 → «x = ±β»
        const b = Math.round(Math.sqrt(est.Q[0]));
        c.push(['EF_DOM_ARREL', [enter(-b), enter(b)]]);
        c.push(['EF_DOM_ARREL', [enter(-b * b)]]);
        c.push(['EF_DOM_ALTRE', [enter(0)]]);
    }
    c.push(['EF_DOM_ALTRE', [...fora, enter(0)]], ['EF_DOM_ALTRE', fora.map(z => enter(z.v + 1))]);
    c.push(['EF_DOM_ALTRE', [enter(1)]], ['EF_DOM_ALTRE', [enter(-1)]], ['EF_DOM_ALTRE', [enter(2)]]);
    return c;
}

// ═════════════════════════════════════════════════════════════════════════════
// GRÀFIQUES
// ═════════════════════════════════════════════════════════════════════════════
/** Trossos del domini entre els punts fora. */
const tramsDe = fora => {
    const vs = [-Infinity, ...fora.map(p => p.v), Infinity];
    return vs.slice(0, -1).map((a, i) => ({ a, b: vs[i + 1] }));
};
const transforma = {
    // −f(x)
    EF_G_INVERS: {
        f: f => x => -f(x),
        x: v => v,
        y: y => -y,
        as: a => (a.v !== undefined ? a : a.h !== undefined ? { h: -a.h } : { m: -a.m, n: -a.n }),
    },
    // f(−x)
    EF_G_MIRALL: {
        f: f => x => f(-x),
        x: v => -v,
        y: y => y,
        as: a => (a.v !== undefined ? { v: -a.v } : a.h !== undefined ? a : { m: -a.m, n: a.n }),
    },
    // f(x − 2)
    EF_G_DESPLACADA: {
        f: f => x => f(x - 2),
        x: v => v + 2,
        y: y => y,
        as: a => (a.v !== undefined ? { v: a.v + 2 } : a.h !== undefined ? a : { m: a.m, n: a.n - 2 * a.m }),
    },
};
/** L'esbós de f (amb els punts marcats: extrems i, si es vol, inflexions). */
export function esbosDe(est, { inflexions = false, t = null } = {}) {
    const tr = t ? transforma[t] : { f: f => f, x: v => v, y: y => y, as: a => a };
    const g = tr.f(est.f);
    const fora = est.fora.map(p => ({ v: tr.x(p.v) })).sort((u, v) => u.v - v.v);
    const punts = [
        ...est.extrems.map(e => ({ x: tr.x(e.x.v), y: tr.y(e.y.v), classe: 'ef-punt ef-punt-extrem' })),
        ...(inflexions
            ? est.inflexions.map(e => ({ x: tr.x(e.x.v), y: tr.y(e.y.v), classe: 'ef-punt ef-punt-inflexio' }))
            : []),
    ];
    const importants = [...punts.map(p => p.x), ...fora.map(p => p.v), ...est.taula2.punts.map(p => tr.x(p.v))];
    const finestra = finestraEsbos(importants.length ? importants : [0], g);
    return svgEsbos({
        f: g,
        trams: tramsDe(fora),
        ...finestra,
        asimptotes: est.def.asimptotes.map(tr.as),
        punts,
    });
}
/** Mostres d'una funció (per comprovar que dues gràfiques són diferents). */
const clauFuncio = fn =>
    [-3.3, -1.7, -0.4, 0.6, 1.4, 2.6, 3.8].map(x => (Number.isFinite(fn(x)) ? fn(x).toFixed(4) : 'x')).join('|');

function opcionsGrafica(est) {
    const vistes = new Set([clauFuncio(est.f)]);
    const falses = [];
    for (const t of ['EF_G_INVERS', 'EF_G_MIRALL', 'EF_G_DESPLACADA']) {
        if (falses.length >= 2) break;
        const k = clauFuncio(transforma[t].f(est.f));
        if (vistes.has(k)) continue;
        vistes.add(k);
        falses.push(t);
    }
    const totes = barreja([
        { valor: 'ok', svg: esbosDe(est) },
        ...falses.map(t => ({ valor: t, svg: esbosDe(est, { t }) })),
    ]);
    return totes.map((o, i) => [o.valor, T.opcions.grafica('ABC'[i]), o.svg]);
}

// ═════════════════════════════════════════════════════════════════════════════
// TEXTOS DE LA RESOLUCIÓ
// ═════════════════════════════════════════════════════════════════════════════
const texVora = v => (v.v === -Infinity ? '-\\infty' : v.v === Infinity ? '+\\infty' : v.tex);
/** Els intervals (de les columnes amb valor) en TeX, units amb ∪. */
function texIntervals(taula, valor) {
    const vores = [{ v: -Infinity }, ...taula.punts, { v: Infinity }];
    const trossos = [];
    taula.columnes.forEach((c, i) => {
        if (c.tipus !== 'interval' || taula.f[i] !== valor) return;
        const k = i / 2;
        trossos.push(`(${texVora(vores[k])}, ${texVora(vores[k + 1])})`);
    });
    return trossos.join(' \\cup ');
}
function liniaMonotonia(est) {
    const t = est.taula1;
    const [creix, decreix] = [texIntervals(t, 'creix'), texIntervals(t, 'decreix')];
    let l;
    if (!decreix) l = T.linia.sempreCreix;
    else if (!creix) l = T.linia.sempreDecreix;
    else l = `${T.linia.creix}${creix}${T.linia.i}${T.linia.decreix}${decreix}`;
    if (!est.extrems.length) l += `\\qquad ${T.linia.capExtrem}`;
    return l;
}
function liniaConcavitat(est) {
    const t = est.taula2;
    const [up, down] = [texIntervals(t, 'conc+'), texIntervals(t, 'conc-')];
    let l;
    if (!down) l = T.linia.sempreUp;
    else if (!up) l = T.linia.sempreDown;
    else l = `${T.linia.concUp}${up}\\,;\\ ${T.linia.concDown}${down}`;
    const inf = est.inflexions;
    if (!inf.length) return `${l}\\qquad ${T.linia.capInflexio}`;
    const punts = inf.map(e => `(${e.x.tex},\\, ${e.y.tex})`).join(',\\ ');
    return `${l}\\qquad ${inf.length === 1 ? T.linia.inflexio : T.linia.inflexions}${punts}`;
}
const texPunt = e => `(${e.x.tex},\\, ${e.y.tex})`;
function liniaExtrems(est) {
    const max = est.extrems.filter(e => e.tipus === 'max');
    const min = est.extrems.filter(e => e.tipus === 'min');
    const parts = [];
    if (max.length) parts.push(`${T.linia.maxim}${max.map(texPunt).join(',\\ ')}`);
    if (min.length) parts.push(`${T.linia.minim}${min.map(texPunt).join(',\\ ')}`);
    return parts.join('\\qquad ');
}

// ═════════════════════════════════════════════════════════════════════════════
// LA PREGUNTA
// ═════════════════════════════════════════════════════════════════════════════
const C = T.celles;
const OPCIONS_SIGNE = {
    interval: [
        ['mes', C.mes],
        ['menys', C.menys],
    ],
    punt: [
        ['zero', C.zero],
        ['no', C.no],
    ],
};
const OPCIONS_MONOTONIA = {
    interval: [
        ['creix', C.creix],
        ['decreix', C.decreix],
    ],
    punt: [
        ['max', C.max],
        ['min', C.min],
        ['cap', C.cap],
        ['no', C.no],
    ],
};
const OPCIONS_CONCAVITAT = {
    interval: [
        ['conc+', C['conc+']],
        ['conc-', C['conc-']],
    ],
    punt: [
        ['inf', C.inf],
        ['cap', C.cap],
        ['no', C.no],
    ],
};
const etiquetes = valors => valors.map(v => C[v] || '');

/** Les dades d'una taula per al joc de passos (pas de signes i pas de la fila de f). */
function passosTaula(est, taula, ordre) {
    const titolS = ordre === 1 ? T.files.s1 : T.files.s2;
    const opcionsF = ordre === 1 ? OPCIONS_MONOTONIA : OPCIONS_CONCAVITAT;
    const columnes = taula.columnes.map(({ tipus, text, a, b }) => ({ tipus, text, a, b }));
    const dades = {
        P: est.P,
        Q: est.Q,
        N1: est.N1,
        N: ordre === 1 ? est.N1 : est.N2,
        e: ordre === 1 ? 2 : 3,
        ordre,
        taula,
    };
    const signes = {
        id: `taula${ordre}`,
        mena: 'taula-signes',
        nom: T.nomPas[`taula${ordre}`],
        enunciat: T.enunciat[`taula${ordre}`],
        formules: true,
        plantilla: [
            {
                camp: 'taula',
                taula: {
                    columnes,
                    files: [
                        { id: 'prova', titol: T.files.prova, editable: true },
                        { id: 's', titol: titolS, editable: true, opcions: OPCIONS_SIGNE },
                    ],
                },
            },
        ],
        camps: { taula: 'taula' },
        solucio: { taula: { prova: true, files: { s: taula.signe } } },
        dades,
        linia: '',
    };
    const fila = {
        id: `taula${ordre}f`,
        mena: 'taula-f',
        nom: T.nomPas[`taula${ordre}f`],
        enunciat: T.enunciat[`taula${ordre}f`],
        formules: true,
        plantilla: [
            {
                camp: 'taula',
                taula: {
                    columnes,
                    files: [
                        { id: 's', titol: titolS, editable: false, valors: etiquetes(taula.signe) },
                        { id: 'f', titol: T.files.f, editable: true, opcions: opcionsF },
                    ],
                },
            },
        ],
        camps: { taula: 'taula' },
        solucio: { taula: { prova: false, files: { f: taula.f } } },
        dades,
        svgResolt: htmlTaula({
            columnes,
            files: [
                { titol: titolS, valors: etiquetes(taula.signe) },
                { titol: T.files.f, valors: etiquetes(taula.f) },
            ],
        }),
        linia: ordre === 1 ? liniaMonotonia(est) : liniaConcavitat(est),
    };
    return [signes, fila];
}

function pasTria(id, enunciat, opcions, linia, dades = {}) {
    return {
        id,
        mena: 'tria',
        nom: T.nomPas[id],
        enunciat,
        formules: true,
        plantilla: [],
        camps: { tria: 'tria' },
        solucio: { tria: 'ok' },
        opcions,
        dades,
        linia,
    };
}

/** El pas de la y dels extrems (caselles racionals, una per extrem). */
function pasExtrems(est) {
    const camps = {};
    const solucio = {};
    const plantilla = [];
    est.extrems.forEach((e, i) => {
        camps[`y${i}`] = 'racional';
        solucio[`y${i}`] = e.y.q;
        plantilla.push({ grup: [{ tex: `f(${e.x.tex}) =` }, { camp: `y${i}` }] });
    });
    return {
        id: 'extrems',
        mena: 'extrems',
        nom: T.nomPas.extrems,
        enunciat: T.enunciat.extrems,
        formules: true,
        plantilla,
        camps,
        solucio,
        nota: T.nota.extrems,
        dades: { P: est.P, Q: est.Q, N1: est.N1, xs: est.extrems.map(e => e.x.q) },
        linia: liniaExtrems(est),
    };
}

/**
 * La pregunta del joc de passos per a una funció.
 * @param {object} def   defFuncio(...)
 */
export function preguntaDeFuncio(def) {
    const est = estudiaFuncio(def);
    const passos = [];
    if (!est.polinomi) {
        passos.push(
            pasTria(
                'domini',
                T.enunciat.domini,
                opcionsConjunt(est.fora, candidatsDomini(est), T.opcions.capDomini),
                est.fora.length
                    ? `\\mathrm{Dom}\\, f = \\mathbb{R} - \\{${est.fora.map(p => p.tex).join(',\\ ')}\\}`
                    : '\\mathrm{Dom}\\, f = \\mathbb{R}'
            )
        );
    }
    // f′
    const correcta1 = opcioExpr({ err: 'ok', tex: est.texD1, fn: est.d1f });
    const cands1 = est.polinomi ? opcionsDerivadaPolinomi(est.P, est.N1) : opcionsQuocient(est.P, est.Q);
    passos.push(pasTria('d1', T.enunciat.d1, triaOpcions(correcta1, cands1.map(opcioExpr)), `f'(x) = ${est.texD1}`));
    passos.push(
        pasTria(
            'zeros1',
            T.enunciat.zeros1,
            opcionsConjunt(est.zeros1, candidatsZeros(est.zeros1, est), T.opcions.cap),
            est.zeros1.length ? `f'(x) = 0 \\iff ${texConjuntO(est.zeros1)}` : T.linia.noZeros("f'"),
            { fora: est.fora.map(p => p.v) }
        )
    );
    passos.push(...passosTaula(est, est.taula1, 1));
    if (est.extrems.length && est.extrems.every(e => e.y.q)) passos.push(pasExtrems(est));
    const grafica = pasTria('grafica', T.enunciat.grafica, opcionsGrafica(est), '');
    grafica.svgResolt = esbosDe(est);
    passos.push(grafica);
    // Part opcional: f″ i la concavitat
    const desDe = passos.length;
    const correcta2 = opcioExpr({ err: 'ok', tex: est.texD2, fn: est.d2f });
    const cands2 = est.polinomi ? opcionsDerivadaPolinomi(est.N1, est.N2) : opcionsSegonaQuocient(est.N1, est.Q);
    passos.push(pasTria('d2', T.enunciat.d2, triaOpcions(correcta2, cands2.map(opcioExpr)), `f''(x) = ${est.texD2}`));
    passos.push(
        pasTria(
            'zeros2',
            T.enunciat.zeros2,
            opcionsConjunt(est.zeros2, candidatsZeros(est.zeros2, est), T.opcions.cap),
            est.zeros2.length ? `f''(x) = 0 \\iff ${texConjuntO(est.zeros2)}` : T.linia.noZeros("f''"),
            { fora: est.fora.map(p => p.v) }
        )
    );
    const [s2, f2] = passosTaula(est, est.taula2, 2);
    f2.svgResolt += esbosDe(est, { inflexions: true });
    passos.push(s2, f2);

    const texF = `f(x) = ${est.texF}`;
    return {
        tex: texF,
        text: `f(x) = ${textDeTex(est.texF)}`,
        clau: `${def.id}|${JSON.stringify(def.params)}`,
        passos,
        opcional: {
            desDe,
            pregunta: T.opcional.pregunta,
            si: T.opcional.si,
            no: T.opcional.no,
            resum: T.opcional.resum,
            inici: `${texF}\\qquad f'(x) = ${est.texD1}`,
            // David (21/11/2026): f″ opcional; els punts es reparteixen entre les dues parts
            punts: { maxAbans: 8, despres: [2, 1] },
        },
        dades: { familia: def.id, params: def.params, tipus: def.tipus },
    };
}

/** Un TeX senzill (polinomis i \dfrac) en text pla, per a l'historial. */
export function textDeTex(tex) {
    return tex
        .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, '($1)/($2)')
        .replace(/\^\{(\d+)\}/g, (_, n) => [...n].map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join(''))
        .replace(/\\tfrac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
        .replace(/\\sqrt\{(\d+)\}/g, '√$1')
        .replace(/ - /g, ' − ')
        .replace(/^-/, '−')
        .replace(/[{}\\]/g, '');
}

/**
 * La pregunta que toca.
 * @param {object} o  { funcions: '' | 'polinomiques' | 'racionals' | 'pau', index }
 */
export function generaPreguntaEF({ funcions = '', index = 0 } = {}) {
    if (funcions === 'pau') {
        const { familia, params } = PAU_EF[index % PAU_EF.length];
        return preguntaDeFuncio(defFuncio(familia, params));
    }
    const grup =
        funcions === 'polinomiques' || funcions === 'racionals' ? funcions : tria(['polinomiques', 'racionals']);
    const familia = tria(GRUPS[grup]);
    return preguntaDeFuncio(defFuncio(familia, PARAMS[familia]()));
}
