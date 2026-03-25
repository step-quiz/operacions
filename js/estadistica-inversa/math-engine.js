/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estadistica-inversa/math-engine.js
 * ROL: Motor matemàtic pur per a l'exercici invers d'estadística.
 *      Càlcul de mitjana, mediana i moda, i enumerador de solucions per
 *      garantir que els problemes generats sempre tenen resposta.
 * DEPENDÈNCIES: Cap. S'ha de carregar PRIMER del mòdul.
 * ============================================================================
 */

window.MathEngine = (() => {

    // ── CÀLCULS BÀSICS ──────────────────────────────────────────────────

    function mean(arr) {
        return arr.reduce((s, v) => s + v, 0) / arr.length;
    }

    function median(arr) {
        const s = [...arr].sort((a, b) => a - b);
        const n = s.length;
        if (n % 2 === 1) return s[Math.floor(n / 2)];
        return (s[n / 2 - 1] + s[n / 2]) / 2;
    }

    /**
     * Moda: retorna el(s) valor(s) amb freqüència màxima.
     * Si tots tenen la mateixa freqüència, retorna null (amodal).
     */
    function mode(arr) {
        const freq = {};
        arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
        const maxF = Math.max(...Object.values(freq));
        if (maxF === 1) return null; // totes les dades apareixen 1 sol cop
        const modes = Object.keys(freq).filter(k => freq[k] === maxF).map(Number);
        // Si hi ha més d'un valor diferent i tots empaten en freqüència, és amodal.
        // Si tots els elements són iguals (un sol valor únic), la moda és aquell valor.
        const totalDistinct = Object.keys(freq).length;
        if (modes.length === totalDistinct && totalDistinct > 1) return null;
        return modes.sort((a, b) => a - b);
    }

    /**
     * Comprova si la moda d'un array coincideix exactament amb un target.
     * Exigeix que la moda sigui ÚNICA (no bimodal).
     */
    function modeMatches(arr, targetMode) {
        const m = mode(arr);
        if (m === null) return false;
        return m.length === 1 && m[0] === targetMode;
    }

    // ── VALIDACIÓ DE CONDICIONS ──────────────────────────────────────────

    /**
     * Comprova si un array compleix un conjunt de condicions.
     * @param {number[]} arr          Dades de l'alumne
     * @param {object}   conditions   { mean?, median?, mode? }
     * @param {number}   tol          Tolerància per a la mitjana (default 0.001)
     * @returns {{ meanOk, medianOk, modeOk, computedMean, computedMedian, computedMode }}
     */
    function validate(arr, conditions, tol) {
        if (tol === undefined) tol = 0.001;
        const result = {
            computedMean:   mean(arr),
            computedMedian: median(arr),
            computedMode:   mode(arr),
            meanOk:   true,
            medianOk: true,
            modeOk:   true,
        };
        if (conditions.mean !== undefined) {
            result.meanOk = Math.abs(result.computedMean - conditions.mean) <= tol;
        }
        if (conditions.median !== undefined) {
            result.medianOk = Math.abs(result.computedMedian - conditions.median) <= tol;
        }
        if (conditions.mode !== undefined) {
            result.modeOk = modeMatches(arr, conditions.mode);
        }
        return result;
    }

    // ── ENUMERADOR DE SOLUCIONS ──────────────────────────────────────────

    /**
     * Compta quantes solucions existeixen per a unes condicions donades.
     * Usa força bruta amb poda (sum constraint per a la mitjana).
     *
     * @param {number} k           Nombre d'elements
     * @param {number} lo          Valor mínim (inclòs)
     * @param {number} hi          Valor màxim (inclòs)
     * @param {object} conditions  { mean?, median?, mode? }
     * @param {number} maxCount    Para de comptar si arriba a maxCount
     * @returns {number[][]}       Array de solucions (fins a maxCount)
     */
    function findSolutions(k, lo, hi, conditions, maxCount) {
        if (maxCount === undefined) maxCount = 10;
        const targetSum = conditions.mean !== undefined ? Math.round(conditions.mean * k * 100) / 100 : null;
        const solutions = [];

        // Genera combinacions amb repetició, ordenades (no permutacions)
        function recurse(depth, minVal, partialSum, partial) {
            if (solutions.length >= maxCount) return;

            if (depth === k) {
                // Comprova sum
                if (targetSum !== null && Math.abs(partialSum - targetSum) > 0.01) return;
                const arr = [...partial];
                const v = validate(arr, conditions);
                if (v.meanOk && v.medianOk && v.modeOk) {
                    solutions.push(arr);
                }
                return;
            }

            const remaining = k - depth - 1;
            for (let val = minVal; val <= hi; val++) {
                // Poda per suma: si afegim val i la resta són tots `hi`, podem arribar a targetSum?
                if (targetSum !== null) {
                    const minPossible = partialSum + val + remaining * lo;
                    const maxPossible = partialSum + val + remaining * hi;
                    if (targetSum < minPossible - 0.01 || targetSum > maxPossible + 0.01) continue;
                }
                partial.push(val);
                recurse(depth + 1, val, partialSum + val, partial);
                partial.pop();
            }
        }

        recurse(0, lo, 0, []);
        return solutions;
    }

    // ── FORMATACIÓ ───────────────────────────────────────────────────────

    function fmt(val, decimals) {
        if (decimals === undefined) decimals = 2;
        // Si és enter, no posem decimals innecessaris
        if (Number.isInteger(val) && decimals <= 2) return String(val);
        return val.toFixed(decimals).replace('.', ',');
    }

    function fmtCondensed(val) {
        if (Number.isInteger(val)) return String(val);
        return val.toFixed(1).replace('.', ',');
    }

    function parseInput(s) {
        if (s == null) return NaN;
        s = String(s).trim().replace(/\s/g, '').replace(',', '.');
        if (s === '' || !/^-?\d+(\.\d+)?$/.test(s)) return NaN;
        return parseFloat(s);
    }

    return {
        mean, median, mode, modeMatches,
        validate, findSolutions,
        fmt, fmtCondensed, parseInput
    };

})();
