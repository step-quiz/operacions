/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/factoritzar/math-engine.js
 * ROL: Les matemàtiques de «Descompondre en factors primers» (factoritzar.html), sense DOM:
 *      les fa servir el joc (js/factoritzar/factoritzar.js) i la seva «Resolució pas a pas»
 *      (js/factoritzar/resolucio.js), perquè tots dos tinguin els mateixos nombres.
 * ARQUITECTURA:
 * - isPrime(n), primeFactorization(n) → { primer: exponent }.
 * - generateNumber(opIndex): el nombre de la pregunta opIndex (0, 1, 2…): la dificultat puja amb
 *   la pregunta (primers 2, 3 i 5; després també el 7; després també l'11), entre 6 i 150, mai primer.
 * DEPENDÈNCIES: utils.js (randInt).
 * ============================================================================
 */
import { randInt } from '../utils.js';

export function isPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

export function primeFactorization(n) {
    const factors = {};
    let d = 2;
    while (d * d <= n) {
        while (n % d === 0) {
            factors[d] = (factors[d] || 0) + 1;
            n /= d;
        }
        d++;
    }
    if (n > 1) factors[n] = (factors[n] || 0) + 1;
    return factors;
}

// ---- GENERACIÓ DE NOMBRES ----
export function generateNumber(opIndex) {
    const primePools = [
        [2, 3, 5],
        [2, 3, 5, 7],
        [2, 3, 5, 7, 11],
    ];
    const difficulty = Math.min(opIndex, primePools.length - 1);
    const pool = primePools[difficulty];

    function makeNumber(minFactors, maxFactors) {
        const numFactors = randInt(minFactors, maxFactors);
        let n = 1;
        for (let i = 0; i < numFactors; i++) {
            n *= pool[randInt(0, Math.min(pool.length - 1, difficulty + 2))];
        }
        if (n < 6) n *= pool[randInt(0, 1)];
        if (n > 150) return makeNumber(minFactors, maxFactors);
        return n;
    }
    return makeNumber(2, 3 + Math.min(difficulty, 1));
}
