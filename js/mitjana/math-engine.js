/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/mitjana/math-engine.js
 * ROL: Motor matemàtic pur per a mitjana aritmètica i ponderada.
 * DEPENDÈNCIES: Cap. S'ha de carregar PRIMER del mòdul.
 * ============================================================================
 */

window.MathEngine = (() => {

    /** Mitjana aritmètica simple: suma / n */
    function mean(values) {
        const sum = values.reduce((s, v) => s + v, 0);
        return sum / values.length;
    }

    /** Mitjana aritmètica ponderada: Σ(vi * wi) / Σ(wi) */
    function weightedMean(values, weights) {
        let sumVW = 0, sumW = 0;
        for (let i = 0; i < values.length; i++) {
            sumVW += values[i] * weights[i];
            sumW  += weights[i];
        }
        return sumVW / sumW;
    }

    /**
     * Parseja un input d'alumne que pot usar coma o punt.
     * Retorna NaN si no és un nombre vàlid.
     */
    function parseInput(s) {
        if (s == null) return NaN;
        s = String(s).trim().replace(/\s/g, '');
        s = s.replace(',', '.');
        if (s === '' || !/^-?\d+(\.\d+)?$/.test(s)) return NaN;
        return parseFloat(s);
    }

    /**
     * Compara resposta de l'alumne amb el valor correcte.
     * Tolerància per defecte: 0.03 (accepta arrodoniments raonables).
     */
    function approxEqual(student, correct, tolerance) {
        if (tolerance === undefined) tolerance = 0.03;
        return Math.abs(student - correct) <= tolerance;
    }

    /** Formata un nombre amb coma catalana, amb els decimals indicats. */
    function fmt(val, decimals) {
        if (decimals === undefined) decimals = 2;
        return val.toFixed(decimals).replace('.', ',');
    }

    return { mean, weightedMean, parseInput, approxEqual, fmt };

})();
