/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/probabilitat/distractor-lib.js
 * ROL: Generador de distractors pedagògics per a probabilitat.
 *      Cada distractor correspon a un error de concepte real.
 * ARQUITECTURA:
 * - Cada distractor porta: { tex, feedback, errorType }
 * - errorTypes: SINGLE_CASE, WRONG_COUNT, COMPLEMENT, ADD_NOT_MULT,
 *   FORGOT_ONE, WRONG_TOTAL, SINGLE_TRIAL, WITH_REPL, WITHOUT_REPL,
 *   IGNORE_CONDITION, WRONG_NUMERATOR, WRONG_DENOMINATOR, INVERTED,
 *   JOINT_NOT_COND, MARGINAL_NOT_COND
 * DEPENDÈNCIES: math-engine.js, strings.js.
 * ============================================================================
 */

window.DistractorLib = (() => {

    const S   = Strings.Feedback;
    const ME  = MathEngine;
    const tex = ME.fracToTex;

    /** FeedbackHints per al resum pedagògic (derivades-compatible) */
    const FeedbackHints = Strings.Hints;

    /**
     * Selecciona `count` distractors únics (no repetits, no iguals a correctTex).
     * Prioritza diversitat d'errorType via round-robin.
     */
    function selectDistractors(pool, correctTex, count) {
        const seen  = new Set([correctTex]);
        const valid = [];
        pool.forEach(d => {
            if (d && d.tex && d.tex.trim() !== '' && !seen.has(d.tex)) {
                seen.add(d.tex);
                valid.push(d);
            }
        });
        if (valid.length <= count) return shuffle([...valid]);

        // Round-robin per errorType
        const byType = {};
        valid.forEach(d => {
            const t = d.errorType || 'OTHER';
            if (!byType[t]) byType[t] = [];
            byType[t].push(d);
        });
        Object.values(byType).forEach(arr => shuffle(arr));
        const types = shuffle(Object.keys(byType));

        const result = [];
        let round = 0;
        while (result.length < count) {
            let added = false;
            for (const t of types) {
                if (result.length >= count) break;
                if (round < byType[t].length) {
                    result.push(byType[t][round]);
                    added = true;
                }
            }
            if (!added) break;
            round++;
        }
        return result;
    }

    // =========================================================================
    // GENERADORS DE DISTRACTORS PER FAMÍLIA
    // =========================================================================

    /**
     * Dau simple: P(condició) = favorable/6
     * @param {number} favorable  Nombre de casos favorables (1-5)
     */
    function buildDieSingle(favorable) {
        const pool = [];
        // SINGLE_CASE: alumne compta un sol cas favorable → 1/6
        if (favorable !== 1) {
            pool.push({ tex: tex(ME.frac(1, 6)), feedback: S.singleCase, errorType: 'SINGLE_CASE' });
        }
        // WRONG_COUNT: off-by-one en el recompte
        if (favorable + 1 <= 6) {
            pool.push({ tex: tex(ME.frac(favorable + 1, 6)), feedback: S.wrongCount, errorType: 'WRONG_COUNT' });
        }
        if (favorable - 1 >= 1) {
            pool.push({ tex: tex(ME.frac(favorable - 1, 6)), feedback: S.wrongCount, errorType: 'WRONG_COUNT' });
        }
        // COMPLEMENT: P(no A) en lloc de P(A)
        pool.push({ tex: tex(ME.frac(6 - favorable, 6)), feedback: S.complement, errorType: 'COMPLEMENT' });
        // WRONG_TOTAL: frac amb denominador erroni
        pool.push({ tex: tex(ME.frac(favorable, 5)), feedback: S.wrongTotal, errorType: 'WRONG_TOTAL' });
        return pool;
    }

    /**
     * Dos esdeveniments independents: P(A) * P(B)
     * @param {{num,den}} pA  Probabilitat del primer
     * @param {{num,den}} pB  Probabilitat del segon
     */
    function buildIndependent(pA, pB) {
        const pool = [];
        // ADD_NOT_MULT: P(A) + P(B) en lloc de P(A)*P(B)
        const summ = ME.addFrac(pA, pB);
        pool.push({ tex: tex(summ), feedback: S.addNotMult, errorType: 'ADD_NOT_MULT' });
        // FORGOT_ONE: només P(A) o P(B)
        pool.push({ tex: tex(pA), feedback: S.forgotOne, errorType: 'FORGOT_ONE' });
        pool.push({ tex: tex(pB), feedback: S.forgotOne, errorType: 'FORGOT_ONE' });
        // WRONG_TOTAL: producte amb denominador erroni
        const wrong = ME.frac(pA.num * pB.num, pA.den * pB.den + 1);
        pool.push({ tex: tex(wrong), feedback: S.wrongTotal, errorType: 'WRONG_TOTAL' });
        return pool;
    }

    /**
     * Boles AMB reposició: P = (b/t)^2
     * @param {number} b  Boles del color demanat
     * @param {number} t  Total de boles
     */
    function buildWithReplacement(b, t) {
        const pool = [];
        // WITHOUT_REPL: aplica sense reposició erròniament
        pool.push({ tex: tex(ME.frac(b * (b - 1), t * (t - 1))), feedback: S.withoutRepl, errorType: 'WITHOUT_REPL' });
        // SINGLE_TRIAL: només una extracció
        pool.push({ tex: tex(ME.frac(b, t)), feedback: S.singleTrial, errorType: 'SINGLE_TRIAL' });
        // ADD_NOT_MULT: suma en lloc de producte
        pool.push({ tex: tex(ME.frac(2 * b, t)), feedback: S.addNotMult, errorType: 'ADD_NOT_MULT' });
        // WRONG_COUNT: off-by-one al numerador
        if (b + 1 <= t) {
            pool.push({ tex: tex(ME.frac((b + 1) * (b + 1), t * t)), feedback: S.wrongCount, errorType: 'WRONG_COUNT' });
        }
        return pool;
    }

    /**
     * Boles SENSE reposició: P = b/t * (b-1)/(t-1)
     * @param {number} b  Boles del color demanat
     * @param {number} t  Total de boles
     */
    function buildWithoutReplacement(b, t) {
        const pool = [];
        // WITH_REPL: aplica amb reposició erròniament
        pool.push({ tex: tex(ME.frac(b * b, t * t)), feedback: S.withRepl, errorType: 'WITH_REPL' });
        // SINGLE_TRIAL: només una extracció
        pool.push({ tex: tex(ME.frac(b, t)), feedback: S.singleTrial, errorType: 'SINGLE_TRIAL' });
        // WRONG_DENOMINATOR: no redueix el denominador
        pool.push({ tex: tex(ME.frac(b * (b - 1), t * t)), feedback: S.wrongDenominator, errorType: 'WRONG_DENOMINATOR' });
        // WRONG_NUMERATOR: no redueix el numerador
        pool.push({ tex: tex(ME.frac(b * b, t * (t - 1))), feedback: S.wrongNumerator, errorType: 'WRONG_NUMERATOR' });
        return pool;
    }

    /**
     * Boles de colors diferents SENSE reposició: P = b/t * r/(t-1)
     */
    function buildDiffColorNoRepl(b, r, t) {
        const pool = [];
        // WITH_REPL: aplica amb reposició
        pool.push({ tex: tex(ME.frac(b * r, t * t)), feedback: S.withRepl, errorType: 'WITH_REPL' });
        // SINGLE_TRIAL
        pool.push({ tex: tex(ME.frac(b, t)), feedback: S.singleTrial, errorType: 'SINGLE_TRIAL' });
        // WRONG_NUMERATOR: resta 1 del segon color (com si fos sense reposició del mateix)
        pool.push({ tex: tex(ME.frac(b * (r - 1), t * (t - 1))), feedback: S.wrongNumerator, errorType: 'WRONG_NUMERATOR' });
        // ADD_NOT_MULT: suma de probabilitats individuals
        pool.push({ tex: tex(ME.addFrac(ME.frac(b, t), ME.frac(r, t))), feedback: S.addNotMult, errorType: 'ADD_NOT_MULT' });
        return pool;
    }

    /**
     * Probabilitat condicionada (boles): P(2a blava | 1a blava) = (b-1)/(t-1)
     */
    function buildConditionalBalls(b, t) {
        const pool = [];
        // IGNORE_CONDITION: no té en compte que ja s'ha extret una
        pool.push({ tex: tex(ME.frac(b, t)), feedback: S.ignoreCondition, errorType: 'IGNORE_CONDITION' });
        // WRONG_NUMERATOR: no resta 1 del numerador
        pool.push({ tex: tex(ME.frac(b, t - 1)), feedback: S.wrongNumerator, errorType: 'WRONG_NUMERATOR' });
        // WRONG_DENOMINATOR: no resta 1 del denominador
        pool.push({ tex: tex(ME.frac(b - 1, t)), feedback: S.wrongDenominator, errorType: 'WRONG_DENOMINATOR' });
        return pool;
    }

    /**
     * Probabilitat condicionada (taula/classe):
     * P(A|B) = nAB/nCond
     * @param {number} nAB     Intersecció
     * @param {number} nCond   Total del grup condicionant (denominador correcte)
     * @param {number} nOther  Total de l'altre grup (denominador invertit)
     * @param {number} N       Total general
     */
    function buildConditionalTable(nAB, nCond, nOther, N) {
        const pool = [];
        // INVERTED: P(B|A) en lloc de P(A|B) → usa l'altre denominador
        pool.push({ tex: tex(ME.frac(nAB, nOther)), feedback: S.inverted, errorType: 'INVERTED' });
        // JOINT_NOT_COND: P(A∩B) sense condicionar
        pool.push({ tex: tex(ME.frac(nAB, N)), feedback: S.jointNotCond, errorType: 'JOINT_NOT_COND' });
        // MARGINAL_NOT_COND: P(A) marginal
        pool.push({ tex: tex(ME.frac(nCond, N)), feedback: S.marginalNotCond, errorType: 'MARGINAL_NOT_COND' });
        return pool;
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================
    return {
        selectDistractors,
        buildDieSingle, buildIndependent,
        buildWithReplacement, buildWithoutReplacement, buildDiffColorNoRepl,
        buildConditionalBalls, buildConditionalTable,
        FeedbackHints
    };

})();
