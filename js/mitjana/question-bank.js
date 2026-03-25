/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/mitjana/question-bank.js
 * ROL: Generador de problemes de mitjana aritmètica i ponderada.
 * ARQUITECTURA:
 * - Qualificacions de 0 a 10: meitat enters, meitat amb .25, .5 o .75.
 * - Nombre de qualificacions: entre 2 i 6.
 * - Tipus: 'simple' (mitjana aritmètica) o 'weighted' (ponderada amb pesos
 *   raonables que sumen 100%).
 * - Cada generador retorna:
 *     { type, context, values, weights?, correctAnswer, helpLines[] }
 * DEPENDÈNCIES: utils.js, math-engine.js, strings.js.
 * ============================================================================
 */

window.QuestionBank = (() => {

    const ME = MathEngine;
    const S  = Strings;

    // =====================================================================
    // GENERADORS DE QUALIFICACIONS
    // =====================================================================

    /** Genera una qualificació de 0 a 10 (enter o decimal .25/.5/.75). */
    function _randomGrade(allowDecimals) {
        if (allowDecimals) {
            const base = randInt(0, 9);
            const frac = pick([0.25, 0.5, 0.75]);
            return base + frac;
        }
        return randInt(0, 10);
    }

    /** Genera un array de n qualificacions (meitat enters, meitat decimals). */
    function _generateGrades(n) {
        const grades = [];
        const nDecimals = Math.ceil(n / 2);
        for (let i = 0; i < n; i++) {
            grades.push(_randomGrade(i < nDecimals));
        }
        return shuffle(grades);
    }

    // =====================================================================
    // PESOS RAONABLES (sumen 100)
    // =====================================================================

    const _weightSets = {
        2: [
            [60, 40], [70, 30], [80, 20], [50, 50],
        ],
        3: [
            [30, 30, 40], [20, 30, 50], [25, 25, 50],
            [20, 40, 40], [33, 33, 34], [10, 40, 50],
        ],
        4: [
            [10, 20, 30, 40], [20, 20, 30, 30], [15, 25, 25, 35],
            [10, 30, 30, 30], [25, 25, 25, 25], [10, 20, 20, 50],
        ],
        5: [
            [10, 10, 20, 30, 30], [10, 15, 20, 25, 30],
            [5, 15, 20, 30, 30],  [10, 10, 20, 20, 40],
            [20, 20, 20, 20, 20],
        ],
        6: [
            [5, 10, 10, 20, 25, 30], [10, 10, 10, 20, 20, 30],
            [5, 5, 15, 25, 25, 25],  [10, 10, 15, 15, 25, 25],
        ],
    };

    // =====================================================================
    // CONTEXTOS PER A PONDERADA
    // =====================================================================

    function _weightedContext(n, weights) {
        const parts = [];

        if (n === 2 || n === 3) {
            const items = shuffle([...S.WeightedLabels[n]]);
            items[0].forEach((label, i) => parts.push({ label, w: weights[i] }));
        } else {
            const pool = shuffle([...S.WeightedLabels.pool]);
            for (let i = 0; i < n; i++) {
                parts.push({ label: pool[i], w: weights[i] });
            }
        }

        return parts;
    }

    // =====================================================================
    // GENERADORS
    // =====================================================================

    function generateSimpleMean() {
        const n       = randInt(2, 6);
        const grades  = _generateGrades(n);
        const correct = ME.mean(grades);

        const subjs       = shuffle([...S.Subjects]);
        const subjectList = subjs.slice(0, n);
        const evaluation  = pick(S.Evaluations);

        const rows = subjectList.map((s, i) => ({ label: s, value: grades[i] }));

        // Ajuda pas a pas
        const sumStr = grades.map(g => ME.fmt(g, 2)).join(' + ');
        const sumVal = grades.reduce((s, v) => s + v, 0);

        const helpLines = [
            S.Help.simpleIntro,
            S.Help.simpleFormula,
            S.Help.simpleSum(sumStr, ME.fmt(sumVal, 2)),
            S.Help.simpleN(n),
            S.Help.simpleResult(ME.fmt(sumVal, 2), n, ME.fmt(correct, 2)),
        ];

        return {
            type: 'simple',
            context: S.Context.simple(evaluation),
            rows,
            values: grades,
            weights: null,
            correctAnswer: correct,
            helpLines,
        };
    }

    function generateWeightedMean() {
        const n       = randInt(2, 5);
        const grades  = _generateGrades(n);
        const wSet    = pick(_weightSets[n]);
        const weights = shuffle([...wSet]);
        const correct = ME.weightedMean(grades, weights);

        const parts   = _weightedContext(n, weights);
        const subject = pick(S.Subjects);

        const rows = parts.map((p, i) => ({
            label:  p.label.charAt(0).toUpperCase() + p.label.slice(1),
            value:  grades[i],
            weight: p.w,
        }));

        // Ajuda pas a pas
        const products = grades.map((g, i) => `${ME.fmt(g, 2)} × ${weights[i]}`);
        const prodVals = grades.map((g, i) => g * weights[i]);
        const sumProd  = prodVals.reduce((s, v) => s + v, 0);
        const sumW     = weights.reduce((s, w) => s + w, 0);

        const helpLines = [
            S.Help.weightedIntro,
            S.Help.weightedFormula,
            S.Help.weightedProducts(products.join(', ')),
            S.Help.weightedSumProd(ME.fmt(sumProd, 2)),
            S.Help.weightedSumW(sumW),
            S.Help.weightedResult(ME.fmt(sumProd, 2), sumW, ME.fmt(correct, 2)),
        ];

        return {
            type: 'weighted',
            context: S.Context.weighted(subject),
            rows,
            values: grades,
            weights,
            correctAnswer: correct,
            helpLines,
        };
    }

    // =====================================================================
    // SELECTOR
    // =====================================================================

    function generateChallenge() {
        return Math.random() < 0.5 ? generateSimpleMean() : generateWeightedMean();
    }

    function resetSession() { /* no-op */ }

    return { generateChallenge, resetSession };

})();
