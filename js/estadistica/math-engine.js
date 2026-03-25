/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estadistica/math-engine.js
 * ROL: Motor matemàtic pur per a estadística descriptiva. Càlcul de
 *      freqüències, mitjana, mediana, moda. Suport per a dades discretes
 *      i dades agrupades per intervals.
 * DEPENDÈNCIES: Cap. S'ha de carregar PRIMER del mòdul.
 * ============================================================================
 */

window.MathEngine = (() => {

    /**
     * Calcula la taula de freqüències per a dades discretes.
     * @param {number[]} data       Dades brutes
     * @returns {{ values: number[], fi: number[], n: number }}
     */
    function discreteFreqTable(data) {
        const counts = {};
        data.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const values = Object.keys(counts).map(Number).sort((a, b) => a - b);
        const fi = values.map(v => counts[v]);
        return { values, fi, n: data.length };
    }

    /**
     * Calcula la taula de freqüències per a dades agrupades per intervals.
     * @param {number[]} data       Dades brutes
     * @param {number[]} limits     Límits dels intervals [l0, l1, l2, ..., lk]
     *                              genera k intervals: [l0,l1), [l1,l2), ..., [l(k-1),lk]
     * @returns {{ intervals: {lo,hi,marca}[], fi: number[], n: number }}
     */
    function groupedFreqTable(data, limits) {
        const k = limits.length - 1;
        const intervals = [];
        const fi = new Array(k).fill(0);
        for (let i = 0; i < k; i++) {
            intervals.push({
                lo: limits[i],
                hi: limits[i + 1],
                marca: (limits[i] + limits[i + 1]) / 2
            });
        }
        data.forEach(v => {
            for (let i = 0; i < k; i++) {
                const isLast = (i === k - 1);
                if (isLast ? (v >= intervals[i].lo && v <= intervals[i].hi)
                           : (v >= intervals[i].lo && v < intervals[i].hi)) {
                    fi[i]++;
                    break;
                }
            }
        });
        return { intervals, fi, n: data.length };
    }

    /**
     * Calcula freqüència relativa hi = fi / n (arrodonida a 4 decimals).
     */
    function relativeFreq(fi, n) {
        return fi.map(f => Math.round((f / n) * 10000) / 10000);
    }

    /**
     * Calcula percentatge = hi * 100 (arrodonit a 2 decimals).
     */
    function percentage(hi) {
        return hi.map(h => Math.round(h * 10000) / 100);
    }

    /**
     * Mitjana per a dades discretes: Σ(xi * fi) / n.
     */
    function meanDiscrete(values, fi, n) {
        let sum = 0;
        for (let i = 0; i < values.length; i++) sum += values[i] * fi[i];
        return sum / n;
    }

    /**
     * Mitjana per a dades agrupades: Σ(marca * fi) / n.
     */
    function meanGrouped(intervals, fi, n) {
        let sum = 0;
        for (let i = 0; i < intervals.length; i++) sum += intervals[i].marca * fi[i];
        return sum / n;
    }

    /**
     * Mediana per a dades discretes.
     * Retorna el valor o la mitjana dels dos centrals.
     */
    function medianDiscrete(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        if (n % 2 === 1) return sorted[Math.floor(n / 2)];
        return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    }

    /**
     * Interval medià per a dades agrupades.
     * Retorna l'índex de l'interval que conté la mediana.
     */
    function medianGroupedIndex(fi, n) {
        const halfN = n / 2;
        let cumul = 0;
        for (let i = 0; i < fi.length; i++) {
            cumul += fi[i];
            if (cumul >= halfN) return i;
        }
        return fi.length - 1;
    }

    /**
     * Moda per a dades discretes.
     * Retorna un array (pot haver-hi bimodal/multimodal).
     */
    function modeDiscrete(values, fi) {
        const maxF = Math.max(...fi);
        const modes = [];
        for (let i = 0; i < values.length; i++) {
            if (fi[i] === maxF) modes.push(values[i]);
        }
        return modes;
    }

    /**
     * Interval modal per a dades agrupades.
     * Retorna l'índex (o índexos) de l'interval amb fi màxima.
     */
    function modeGroupedIndex(fi) {
        const maxF = Math.max(...fi);
        const modes = [];
        for (let i = 0; i < fi.length; i++) {
            if (fi[i] === maxF) modes.push(i);
        }
        return modes;
    }

    /**
     * Formata un nombre com a string amb decimals i coma catalana.
     * @param {number} val        Valor numèric
     * @param {number} decimals   Nombre de decimals (per defecte 2)
     */
    function fmt(val, decimals) {
        if (decimals === undefined) decimals = 2;
        return val.toFixed(decimals).replace('.', ',');
    }

    /**
     * Parseja un input d'alumne que pot usar coma o punt com a separador.
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
     * Compara resposta de l'alumne amb el valor correcte, amb tolerància.
     */
    function approxEqual(student, correct, tolerance) {
        if (tolerance === undefined) tolerance = 0.015;
        return Math.abs(student - correct) <= tolerance;
    }

    return {
        discreteFreqTable, groupedFreqTable,
        relativeFreq, percentage,
        meanDiscrete, meanGrouped,
        medianDiscrete, medianGroupedIndex,
        modeDiscrete, modeGroupedIndex,
        fmt, parseInput, approxEqual
    };

})();
