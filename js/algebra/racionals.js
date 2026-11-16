/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/algebra/racionals.js
 * ROL: Nombres racionals per a les activitats d'àlgebra i el joc de passos.
 * ARQUITECTURA: mòdul pur (cap DOM, cap atzar).
 *   RACIONAL      [n, d] amb d > 0 (racional() el simplifica)
 *   COEFICIENT    el d'un monomi: un enter (number) o, si no ho és, una fracció [n, d]
 *                 irreductible amb d > 1. Així els monomis amb coeficient enter (la
 *                 gran majoria) es continuen escrivint i operant com a nombres.
 * DEPENDÈNCIES: utils.js (gcd).
 * ============================================================================
 */

import { gcd } from '../utils.js';

export function racional(n, d = 1) {
    if (d < 0) {
        n = -n;
        d = -d;
    }
    const g = gcd(n, d) || 1;
    return [n / g || 0, d / g];
}

/** Un valor (enter o [n, d]) com a racional. */
export function comRacional(v) {
    return Array.isArray(v) ? v : [v, 1];
}

/** Igualtat de dos racionals (no cal que estiguin simplificats). */
export function racionalsIguals(x, y) {
    return x[0] * y[1] === y[0] * x[1];
}

export function texRacional(v) {
    const [n, d] = comRacional(v);
    return d === 1 ? String(n) : `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${d}}`;
}

export function textRacional(v) {
    const [n, d] = comRacional(v);
    return (n < 0 ? '−' : '') + Math.abs(n) + (d === 1 ? '' : `/${d}`);
}

// ── Coeficients: enter o fracció ─────────────────────────────────────────────
export function coeficient(n, d = 1) {
    const [a, b] = racional(n, d);
    return b === 1 ? a : [a, b];
}

export function sumaCoef(x, y) {
    const [[a, b], [c, d]] = [comRacional(x), comRacional(y)];
    return coeficient(a * d + c * b, b * d);
}

export function producteCoef(x, y) {
    const [[a, b], [c, d]] = [comRacional(x), comRacional(y)];
    return coeficient(a * c, b * d);
}

export function oposatCoef(x) {
    const [a, b] = comRacional(x);
    return coeficient(-a, b);
}

export function signeCoef(x) {
    return Math.sign(comRacional(x)[0]);
}

export function absCoef(x) {
    return signeCoef(x) < 0 ? oposatCoef(x) : coeficient(...comRacional(x));
}

export function coefsIguals(x, y) {
    return racionalsIguals(comRacional(x), comRacional(y));
}

export function inversCoef(x) {
    const [a, b] = comRacional(x);
    return coeficient(b, a);
}

export function quocientCoef(x, y) {
    return producteCoef(x, inversCoef(y));
}

// ── Decimals ─────────────────────────────────────────────────────────────────
/** Expansió decimal d'un racional ≥ 0: part entera, xifres de l'anteperíode i del període ('' si és exacte). */
export function expansioDecimal(v) {
    const [n, d] = comRacional(v);
    const enter = Math.floor(n / d);
    let r = n % d;
    const xifres = [];
    const vist = new Map();
    while (r !== 0 && !vist.has(r)) {
        vist.set(r, xifres.length);
        r *= 10;
        xifres.push(Math.floor(r / d));
        r %= d;
    }
    if (r === 0) return { enter, ante: xifres.join(''), periode: '' };
    const i = vist.get(r);
    return { enter, ante: xifres.slice(0, i).join(''), periode: xifres.slice(i).join('') };
}

/**
 * Un racional ≥ 0 escrit en decimal: «0{,}1\overline{6}» (TeX) o «0,16̅» (text, amb ratlla
 * combinada). minDecimals: xifres decimals mínimes (2 per als euros: 12,50).
 */
export function texDecimal(v, { minDecimals = 0 } = {}) {
    const { enter, ante, periode } = expansioDecimal(v);
    const xifres = periode ? ante : ante.padEnd(ante ? Math.max(minDecimals, ante.length) : 0, '0');
    if (!xifres && !periode) return String(enter);
    return `${enter}{,}${xifres}${periode ? `\\overline{${periode}}` : ''}`;
}

export function textDecimal(v, { minDecimals = 0 } = {}) {
    const { enter, ante, periode } = expansioDecimal(v);
    const xifres = periode ? ante : ante.padEnd(ante ? Math.max(minDecimals, ante.length) : 0, '0');
    if (!xifres && !periode) return String(enter);
    return `${enter},${xifres}${[...periode].map(x => `${x}̅`).join('')}`;
}
