/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estudi-funcio/polinomis-ef.js
 * ROL: Polinomis d'una variable amb coeficients enters (o racionals [n, d]) per a
 *      «Estudi d'una funció»: operar, derivar, avaluar (decimal, exacte i en un
 *      nombre s·√r), trobar-ne les arrels reals i escriure'ls en TeX.
 * ARQUITECTURA: mòdul pur (cap DOM, cap atzar).
 *   POLINOMI  array de coeficients enters, índex = grau: [9, −12, 3] és 3x² − 12x + 9
 *   ARREL     { v: nombre, tex, text, q: [n, d] | null, surd: { s: [n, d], r } | null }
 *             q: l'arrel racional exacta; surd: l'arrel s·√r (r lliure de quadrats)
 * DEPENDÈNCIES: utils.js (gcd), algebra/racionals.js.
 * ============================================================================
 */

import { gcd } from '../utils.js';
import { racional } from '../algebra/racionals.js';

// ── Operacions ──────────────────────────────────────────────────────────────
export function pNet(p) {
    const q = p.slice();
    while (q.length > 1 && q[q.length - 1] === 0) q.pop();
    return q.length ? q : [0];
}
export const pGrau = p => pNet(p).length - 1;
export const pEsZero = p => pNet(p).every(c => c === 0);
export function pSuma(p, q) {
    const n = Math.max(p.length, q.length);
    return pNet(Array.from({ length: n }, (_, i) => (p[i] || 0) + (q[i] || 0)));
}
export const pEscala = (p, k) => pNet(p.map(c => c * k));
export const pResta = (p, q) => pSuma(p, pEscala(q, -1));
export function pProducte(p, q) {
    const r = new Array(p.length + q.length - 1).fill(0);
    p.forEach((a, i) => q.forEach((b, j) => (r[i + j] += a * b)));
    return pNet(r);
}
export const pDeriva = p => pNet(p.length > 1 ? p.slice(1).map((c, i) => c * (i + 1)) : [0]);
export const pIguals = (p, q) => {
    const [a, b] = [pNet(p), pNet(q)];
    return a.length === b.length && a.every((c, i) => c === b[i]);
};
/** (x − a)·… : el polinomi a partir de les arrels i el coeficient principal. */
export const pDeArrels = (k, arrels) => arrels.reduce((p, a) => pProducte(p, [-a, 1]), [k]);
/** p(x − h): desplaça el polinomi h unitats a la dreta. */
export function pDesplaca(p, h) {
    let r = [0];
    let pot = [1];
    for (const c of p) {
        r = pSuma(r, pEscala(pot, c));
        pot = pProducte(pot, [-h, 1]);
    }
    return r;
}

// ── Avaluar ─────────────────────────────────────────────────────────────────
export const pValor = (p, x) => p.reduceRight((s, c) => s * x + c, 0);
/** p(n/d) exacte, com a racional [n, d]. */
export function pValorQ(p, [n, d]) {
    // Σ c·n^i·d^(g−i) / d^g
    const g = p.length - 1;
    let num = 0;
    p.forEach((c, i) => (num += c * n ** i * d ** (g - i)));
    return racional(num, d ** g);
}
const qSuma = (a, b) => racional(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const qProd = (a, b) => racional(a[0] * b[0], a[1] * b[1]);
const qQuoc = (a, b) => racional(a[0] * b[1], a[1] * b[0]);
/** p(s·√r) = A + B·√r, amb A i B racionals: [A, B]. */
export function pValorSurd(p, s, r) {
    let A = [0, 1];
    let B = [0, 1];
    p.forEach((c, i) => {
        // (s√r)^i = s^i · r^(i/2): parell → racional; senar → racional·√r
        const si = [s[0] ** i, s[1] ** i];
        const ri = r ** Math.floor(i / 2);
        const t = qProd([c * ri, 1], si);
        if (i % 2 === 0) A = qSuma(A, t);
        else B = qSuma(B, t);
    });
    return [A, B];
}
/** (A + B√r)/(C + D√r) = E + F√r: [E, F]. */
export function quocientSurd([A, B], [C, D], r) {
    const den = qSuma(qProd(C, C), qProd([-r, 1], qProd(D, D)));
    const E = qSuma(qProd(A, C), qProd([-r, 1], qProd(B, D)));
    const F = qSuma(qProd(B, C), qProd([-1, 1], qProd(A, D)));
    return [qQuoc(E, den), qQuoc(F, den)];
}

// ── Escriure ────────────────────────────────────────────────────────────────
const texCoef = (c, grau) => (grau > 0 && Math.abs(c) === 1 ? '' : String(Math.abs(c)));
const texPot = g => (g === 0 ? '' : g === 1 ? 'x' : `x^{${g}}`);
/** 3x^{2} - 12x + 9 (amb el signe del primer terme, si és negatiu). */
export function pTex(p) {
    const q = pNet(p);
    let s = '';
    for (let g = q.length - 1; g >= 0; g--) {
        const c = q[g];
        if (c === 0) continue;
        const terme = texCoef(c, g) + texPot(g);
        if (!s) s = (c < 0 ? '-' : '') + terme;
        else s += (c < 0 ? ' - ' : ' + ') + terme;
    }
    return s || '0';
}
/** El polinomi entre parèntesis si té més d'un terme. */
export function pTexBase(p) {
    const termes = pNet(p).filter(c => c !== 0).length;
    return termes > 1 ? `(${pTex(p)})` : pTex(p);
}
/** Q^e en TeX: (x - 1)^{2}; amb e = 1, x - 1. */
export function texPotencia(Q, e) {
    if (e === 1) return pTex(Q);
    return `${pTexBase(Q)}^{${e}}`;
}
/** N / Q^e en TeX (si Q és 1, només N). */
export function texQuocient(N, Q, e = 1) {
    if (pGrau(Q) === 0 && Q[0] === 1) return pTex(N);
    return `\\dfrac{${pTex(N)}}{${texPotencia(Q, e)}}`;
}

/** Un racional en TeX (\tfrac) i en text («3/2», «−1»). */
export function texQ([n, d]) {
    if (d === 1) return String(n);
    return `${n < 0 ? '-' : ''}\\tfrac{${Math.abs(n)}}{${d}}`;
}
export const textQ = ([n, d]) => (n < 0 ? '−' : '') + Math.abs(n) + (d === 1 ? '' : `/${d}`);

/** A + B√r en TeX i en text. */
export function texSurd([A, B], r) {
    const zeroA = A[0] === 0;
    if (B[0] === 0) return texQ(A);
    const absB = [Math.abs(B[0]), B[1]];
    const arrel = `\\sqrt{${r}}`;
    const part =
        absB[1] === 1
            ? `${absB[0] === 1 ? '' : absB[0]}${arrel}`
            : `\\tfrac{${absB[0] === 1 ? '' : absB[0]}${arrel}}{${absB[1]}}`;
    if (zeroA) return (B[0] < 0 ? '-' : '') + part;
    return `${texQ(A)} ${B[0] < 0 ? '-' : '+'} ${part}`;
}
export function textSurd([A, B], r) {
    if (B[0] === 0) return textQ(A);
    const absB = [Math.abs(B[0]), B[1]];
    const part = `${absB[0] === 1 ? '' : absB[0]}√${r}${absB[1] === 1 ? '' : `/${absB[1]}`}`;
    if (A[0] === 0) return (B[0] < 0 ? '−' : '') + part;
    return `${textQ(A)} ${B[0] < 0 ? '−' : '+'} ${part}`;
}

// ── Arrels reals ────────────────────────────────────────────────────────────
const divisors = n => {
    const a = Math.abs(n);
    const r = [];
    for (let i = 1; i <= a; i++) if (a % i === 0) r.push(i);
    return r;
};
/** Una arrel racional exacta, com a ARREL. */
export const arrelQ = q => ({ v: q[0] / q[1], tex: texQ(q), text: textQ(q), q, surd: null });
/** L'arrel s·√r, com a ARREL. */
export const arrelSurd = (s, r) => ({
    v: (s[0] / s[1]) * Math.sqrt(r),
    tex: texSurd([[0, 1], s], r),
    text: textSurd([[0, 1], s], r),
    q: null,
    surd: { s, r },
});
/** k² · r = n, r lliure de quadrats: [k, r]. */
function treuQuadrats(n) {
    let k = 1;
    let r = n;
    for (let f = 2; f * f <= r; f++)
        while (r % (f * f) === 0) {
            r /= f * f;
            k *= f;
        }
    return [k, r];
}

/**
 * Les arrels reals diferents d'un polinomi, ordenades. Les racionals, pel teorema de les arrels
 * racionals; el que queda, si és de grau 2 sense terme en x i té arrels irracionals, ±s√r. Un
 * residu que no es pot resoldre així llança un error (els generadors no en fan).
 */
export function arrels(p) {
    let q = pNet(p);
    if (pEsZero(q)) throw new Error('el polinomi zero no té arrels aïllades');
    const trobades = [];
    // Factor x^k
    if (q[0] === 0) {
        trobades.push(arrelQ([0, 1]));
        while (q.length > 1 && q[0] === 0) q = q.slice(1);
    }
    let canvi = true;
    while (canvi && pGrau(q) > 0) {
        canvi = false;
        const a0 = q[0];
        const an = q[q.length - 1];
        const candidats = [];
        for (const num of divisors(a0)) for (const den of divisors(an)) candidats.push(racional(num, den));
        for (const c of [...candidats, ...candidats.map(([n, d]) => [-n, d])]) {
            const v = pValorQ(q, c);
            if (v[0] !== 0) continue;
            if (!trobades.some(t => t.q && t.q[0] === c[0] && t.q[1] === c[1])) trobades.push(arrelQ(c));
            // Divideix per (d·x − n) (Ruffini)
            q = divideixLineal(q, c);
            canvi = true;
            break;
        }
    }
    if (pGrau(q) === 2) {
        const [c, b, a] = q;
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
            if (b !== 0) throw new Error(`arrels irracionals amb terme en x: ${pTex(q)}`);
            // a x² + c = 0 → x = ±√(−c/a) = ±√(−c·a)/|a|
            const [k, r] = treuQuadrats(-c * a);
            const s = racional(k, Math.abs(a));
            trobades.push(arrelSurd([-s[0], s[1]], r), arrelSurd(s, r));
        }
    } else if (pGrau(q) > 2) {
        // Sense arrels racionals: només admetem que no en tingui de reals (positiu sempre)
        for (let x = -20; x <= 20; x += 0.01)
            if (Math.sign(pValor(q, x)) !== Math.sign(pValor(q, -20)))
                throw new Error(`arrels no racionals: ${pTex(q)}`);
    }
    return trobades.sort((u, v) => u.v - v.v);
}

/** q(x) / (x − n/d), exacte (q té l'arrel n/d); coeficients enters perquè es multiplica per d. */
function divideixLineal(q, [n, d]) {
    // q(x) = (d x − n)·s(x): divisió sintètica amb coeficients racionals i després escala
    const g = q.length - 1;
    const s = new Array(g).fill(null);
    let resta = [0, 1];
    const coef = [];
    for (let i = g; i >= 1; i--) {
        resta = racional(resta[0] * n + q[i] * resta[1] * d, resta[1] * d);
        coef[i - 1] = resta;
    }
    // coef = coeficients de q(x)/(x − n/d); multiplicats per d → q/(dx − n)
    const den = coef.reduce((m, [, b]) => (m * b) / gcd(m, b), 1);
    for (let i = 0; i < g; i++) s[i] = (coef[i][0] * den) / coef[i][1];
    const g2 = s.reduce((m, c) => gcd(m, Math.abs(c)), 0) || 1;
    return pNet(s.map(c => c / g2));
}
