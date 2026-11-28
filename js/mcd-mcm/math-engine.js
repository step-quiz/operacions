/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/mcd-mcm/math-engine.js
 * ROL: Les matemàtiques de «MCD i mcm» (mcd-mcm.html), sense DOM: les fa servir el joc
 *      (js/mcd-mcm/mcd-mcm.js) i la seva «Resolució pas a pas» (js/mcd-mcm/resolucio.js),
 *      perquè tots dos tinguin els mateixos nombres.
 * ARQUITECTURA:
 * - computeMCD(fa, fb), computeMCM(fa, fb): a partir de les descomposicions { primer: exponent }.
 * - generatePair(opIndex): la parella de la pregunta opIndex (0, 1, 2…). Decisió del David
 *   (28/11/2026, docs/pissarra/STATE.md decisió 25): primers 2, 3 i 5; després també el 7;
 *   després també l'11 i el 13. Nombres de 6 a 150, diferents, mai primers; un 20 % de
 *   parelles de primers entre si (mcm fins a 500) i les altres amb algun factor comú (mcm
 *   fins a 300).
 * DEPENDÈNCIES: utils.js (randInt), factoritzar/math-engine.js (primeFactorization).
 * ============================================================================
 */
import { randInt } from '../utils.js';
import { primeFactorization } from '../factoritzar/math-engine.js';

export const POOLS = Object.freeze([
    Object.freeze([2, 3, 5]),
    Object.freeze([2, 3, 5, 7]),
    Object.freeze([2, 3, 5, 7, 11, 13]),
]);
export const PROB_COPRIMERS = 0.2;

export function computeMCD(fa, fb) {
    let result = 1;
    for (const p in fa) {
        if (fb[p]) result *= Math.pow(parseInt(p), Math.min(fa[p], fb[p]));
    }
    return result;
}

export function computeMCM(fa, fb) {
    const allPrimes = new Set([...Object.keys(fa), ...Object.keys(fb)]);
    let result = 1;
    for (const p of allPrimes) {
        result *= Math.pow(parseInt(p), Math.max(fa[p] || 0, fb[p] || 0));
    }
    return result;
}

/** Un nombre compost de 6 a 150 fet amb els primers del grup. */
function makeNumber(pool, minFactors, maxFactors) {
    for (;;) {
        const numFactors = randInt(minFactors, maxFactors);
        let n = 1;
        for (let i = 0; i < numFactors; i++) n *= pool[randInt(0, pool.length - 1)];
        if (n < 6) n *= pool[randInt(0, 1)];
        if (n <= 150) return n;
    }
}

/**
 * La parella [a, b] de la pregunta opIndex. coprimers: true / false per forçar-ho (la resolució pas a pas); si no,
 * un 20 % de les vegades.
 */
export function generatePair(opIndex, { coprimers } = {}) {
    const difficulty = Math.min(opIndex, POOLS.length - 1);
    const pool = POOLS[difficulty];
    const allowCoprime = coprimers ?? Math.random() < PROB_COPRIMERS;
    const maxMcm = allowCoprime ? 500 : 300;
    let a, b;
    for (let attempts = 0; attempts < 2000; attempts++) {
        a = makeNumber(pool, 2, 3 + Math.min(difficulty, 1));
        b = makeNumber(pool, 2, 3 + Math.min(difficulty, 1));
        const fa = primeFactorization(a);
        const fb = primeFactorization(b);
        const mcd = computeMCD(fa, fb);
        if (b !== a && computeMCM(fa, fb) <= maxMcm && (allowCoprime ? mcd === 1 : mcd !== 1)) return [a, b];
    }
    return allowCoprime ? [8, 15] : [12, 18]; // no passa mai a la pràctica (2000 intents)
}
