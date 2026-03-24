/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/probabilitat/math-engine.js
 * ROL: Motor matemàtic pur per a probabilitat. Operacions amb fraccions,
 *      simplificació i formatació LaTeX.
 * ARQUITECTURA:
 * - Capa matemàtica completament independent: no depèn de cap fitxer de la
 *   plataforma compartida (utils, config, game-core) ni del controlador DOM.
 * - Exposa window.MathEngine com a namespace explícit.
 * DEPENDÈNCIES: Requereix utils.js (randInt, pick). S'ha de carregar
 * DESPRÉS de utils.js i ABANS de distractor-lib.js.
 * ============================================================================
 */

window.MathEngine = (() => {

    // -------------------------------------------------------------------------
    // ARITMÈTICA DE FRACCIONS
    // -------------------------------------------------------------------------

    /** Màxim comú divisor (Euclides) */
    function gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) { const t = b; b = a % b; a = t; }
        return a;
    }

    /** Simplifica una fracció {num, den}. Garanteix den > 0. */
    function simplify(num, den) {
        if (den === 0) return { num: 0, den: 1 };
        if (num === 0) return { num: 0, den: 1 };
        const sign = den < 0 ? -1 : 1;
        const g = gcd(Math.abs(num), Math.abs(den));
        return { num: (sign * num) / g, den: (sign * den) / g };
    }

    /** Crea una fracció simplificada a partir de numerador i denominador. */
    function frac(num, den) {
        return simplify(num, den);
    }

    /** Multiplica dues fraccions i simplifica. */
    function mulFrac(f1, f2) {
        return simplify(f1.num * f2.num, f1.den * f2.den);
    }

    /** Suma dues fraccions i simplifica. */
    function addFrac(f1, f2) {
        return simplify(f1.num * f2.den + f2.num * f1.den, f1.den * f2.den);
    }

    /** Resta f1 - f2, simplifica. */
    function subFrac(f1, f2) {
        return simplify(f1.num * f2.den - f2.num * f1.den, f1.den * f2.den);
    }

    /** Compara dues fraccions per igualtat (valor, no representació). */
    function fracEqual(f1, f2) {
        const a = simplify(f1.num, f1.den);
        const b = simplify(f2.num, f2.den);
        return a.num === b.num && a.den === b.den;
    }

    // -------------------------------------------------------------------------
    // FORMATACIÓ LATEX
    // -------------------------------------------------------------------------

    /**
     * Formata una fracció com a LaTeX.
     * Si den=1, retorna només el numerador. Si num=0, retorna '0'.
     */
    function fracToTex(f) {
        const s = simplify(f.num, f.den);
        if (s.num === 0) return '0';
        if (s.den === 1) return String(s.num);
        return `\\frac{${s.num}}{${s.den}}`;
    }

    // -------------------------------------------------------------------------
    // API PÚBLICA
    // -------------------------------------------------------------------------
    return {
        gcd, simplify, frac,
        mulFrac, addFrac, subFrac,
        fracEqual, fracToTex
    };

})();
