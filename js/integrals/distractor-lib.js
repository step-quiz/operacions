/**
 * ============================================================================
 * PROJECTE: Motor Educatiu d'Integrals (Vanilla JS)
 * FITXER: js/integrals/distractor-lib.js
 * ROL: Taxonomia d'errors pedagògics i generador de distractors per família.
 * ARQUITECTURA:
 * - Cada distractor porta: { tex, feedback, errorType, scope }
 * - Scopes disponibles:
 *     'universal'    → qualsevol família
 *     'rule:power'   → regla de la potència ∫x^n
 *     'family:exp'   → exponencial ∫e^{kx}
 * - API pública:
 *     buildPower(aOrN, n)   → pool per a ∫a·x^n dx (a=1 si només es passa n)
 *     buildExp(k)           → pool per a ∫e^{kx} dx
 *     FeedbackHints         → mapa errorType → text d'ajuda ampliat
 * ERRORS MODELATS:
 *   INT_NO_DIVIDE     → ha incrementat exp però no ha dividit per (n+1)
 *   INT_WRONG_DIVISOR → ha dividit per n en lloc de (n+1)
 *   INT_WRONG_EXP     → divisor correcte però exponent no incrementat
 *   INT_DERIVATIVE    → ha derivat en lloc d'integrar (n·x^{n-1})
 *   INT_MULTIPLY      → ha multiplicat per (n+1) en lloc de dividir
 *   EXP_FORGOT_COEF   → ha obtingut e^{kx} sense el factor 1/k
 *   EXP_DERIVATIVE    → ha aplicat la derivada (k·e^{kx})
 *   EXP_WRONG_COEF    → factor incorrecte (k² o altres)
 *   NO_PRIMITIVE      → funció original sense integrar
 *   INTEGRAL_CONFUSION→ confusió de regla
 * DEPENDÈNCIES: Requereix math-engine.js i strings.js.
 * ============================================================================
 */

window.DistractorLib = (() => {

    // =========================================================================
    // ÀLIES LOCAL → Strings.Feedback (font única de tots els textos)
    // =========================================================================
    const S = Strings.Feedback;

    // =========================================================================
    // TAXONOMIA D'errorType
    // =========================================================================
    const INT_NO_DIVIDE      = 'INT_NO_DIVIDE';
    const INT_WRONG_DIVISOR  = 'INT_WRONG_DIVISOR';
    const INT_WRONG_EXP      = 'INT_WRONG_EXP';
    const INT_DERIVATIVE     = 'INT_DERIVATIVE';
    const INT_MULTIPLY       = 'INT_MULTIPLY';
    const EXP_FORGOT_COEF    = 'EXP_FORGOT_COEF';
    const EXP_DERIVATIVE     = 'EXP_DERIVATIVE';
    const EXP_WRONG_COEF     = 'EXP_WRONG_COEF';
    const NO_PRIMITIVE       = 'NO_PRIMITIVE';
    const INTEGRAL_CONFUSION = 'INTEGRAL_CONFUSION';

    // =========================================================================
    // HINTS AMPLIATS PER errorType — delegats a strings.js
    // =========================================================================
    const FeedbackHints = Strings.Hints;

    // =========================================================================
    // ÀLIES LOCALS → MathEngine (font única, evita duplicació)
    // =========================================================================
    const _fmt    = MathEngine.formatPowerTerm;
    const _fmtInt = MathEngine.formatIntResult;
    const _fmtF   = MathEngine.fmtFraction;
    const _kxArg  = MathEngine.kxArg;

    // =========================================================================
    // POOL: ∫a·x^n dx = [a/(n+1)]·x^{n+1}
    // =========================================================================
    /**
     * Genera distractors pedagògics per a la família de la potència.
     * Quan a=1 el comportament és la família bàsica ∫x^n dx.
     *
     * @param {number} a  - coeficient de la funció original (default 1)
     * @param {number} n  - exponent de la funció original
     * @returns {object[]} pool de distractors
     */
    function _buildPowerPool(a, n) {
        const correct = _fmtInt(a, n);
        const pool    = [];

        // ── INT_DERIVATIVE: ha derivat → a·n·x^{n-1}
        // L'error més clar: l'exponent ha baixat en lloc de pujar.
        const derivTex = _fmt(a * n, n - 1);
        if (derivTex !== correct && !pool.find(d => d.tex === derivTex))
            pool.push({ tex: derivTex, feedback: S.power.derivative, errorType: INT_DERIVATIVE, scope: 'rule:power' });

        // ── INT_NO_DIVIDE: ha incrementat exp però no ha dividit → a·x^{n+1}
        const noDivTex = _fmt(a, n + 1);
        if (noDivTex !== correct && !pool.find(d => d.tex === noDivTex))
            pool.push({ tex: noDivTex, feedback: S.power.no_divide, errorType: INT_NO_DIVIDE, scope: 'rule:power' });

        // ── INT_WRONG_DIVISOR: ha dividit per n en lloc de n+1
        // Construïm [a/(n)]·x^{n+1}. Evitem n=0 (indefinit).
        if (n !== 0) {
            const wrongDivTex = _fmtF(a, n + 1, n);
            if (wrongDivTex !== correct && !pool.find(d => d.tex === wrongDivTex))
                pool.push({ tex: wrongDivTex, feedback: S.power.wrong_divisor, errorType: INT_WRONG_DIVISOR, scope: 'rule:power' });
        }

        // ── INT_WRONG_EXP: divisor correcte (n+1) però exponent no incrementat → [a/(n+1)]·x^n
        // Evitem n+1=0 (cas n=-1, que no entra als generadors però per seguretat).
        if (n + 1 !== 0) {
            const wrongExpTex = _fmtF(a, n, n + 1);
            if (wrongExpTex !== correct && !pool.find(d => d.tex === wrongExpTex))
                pool.push({ tex: wrongExpTex, feedback: S.power.wrong_exp, errorType: INT_WRONG_EXP, scope: 'rule:power' });
        }

        // ── NO_PRIMITIVE: funció original a·x^n sense integrar
        const originalTex = _fmt(a, n);
        if (!pool.find(d => d.tex === originalTex))
            pool.push({ tex: originalTex, feedback: S.power.no_primitive, errorType: NO_PRIMITIVE, scope: 'universal' });

        // ── INT_MULTIPLY: ha multiplicat per (n+1) en lloc de dividir → a·(n+1)·x^{n+1}
        const multTex = _fmt(a * (n + 1), n + 1);
        if (multTex !== correct && !pool.find(d => d.tex === multTex))
            pool.push({ tex: multTex, feedback: S.power.multiply_not_divide, errorType: INT_MULTIPLY, scope: 'rule:power' });

        return pool;
    }

    // =========================================================================
    // POOL: ∫e^{kx} dx = (1/k)·e^{kx}
    // =========================================================================
    /**
     * Genera distractors pedagògics per a la família exponencial.
     * Assumeix |k| ≥ 2 (generateKIntExp exclou k=±1).
     *
     * @param {number} k  - coeficient de l'exponent (enter ≠ 0, ≠ ±1)
     * @returns {object[]} pool de distractors
     */
    function _buildExpPool(k) {
        const argTex = _kxArg(k);
        const eTex   = `e^{${argTex}}`;
        const correct = MathEngine.formatExpPrimitive(k);
        const pool    = [];

        // ── EXP_FORGOT_COEF: e^{kx} sense factor 1/k
        // L'error més freqüent: l'alumne pensa que la primitiva d'e^{kx} és e^{kx}.
        if (eTex !== correct && !pool.find(d => d.tex === eTex))
            pool.push({ tex: eTex, feedback: S.exp.forgot_coef, errorType: EXP_FORGOT_COEF, scope: 'family:exp' });

        // ── EXP_DERIVATIVE: k·e^{kx} (ha aplicat la derivada en lloc de la integral)
        // Per k>0: 'k·e^{kx}'. Per k<0: '-|k|·e^{kx}'.
        let derivExpTex;
        if (k > 0) derivExpTex = `${k}${eTex}`;
        else       derivExpTex = `-${Math.abs(k)}${eTex}`;
        if (derivExpTex !== correct && !pool.find(d => d.tex === derivExpTex))
            pool.push({ tex: derivExpTex, feedback: S.exp.derivative, errorType: EXP_DERIVATIVE, scope: 'family:exp' });

        // ── EXP_WRONG_COEF: \frac{e^{kx}}{k²} (ha dividit dues vegades per k)
        const k2 = k * k;
        const wrongCoefTex = `\\frac{${eTex}}{${k2}}`;
        if (wrongCoefTex !== correct && !pool.find(d => d.tex === wrongCoefTex))
            pool.push({ tex: wrongCoefTex, feedback: S.exp.double_int, errorType: EXP_WRONG_COEF, scope: 'family:exp' });

        // NOTA: e^{kx} apareix ja com a EXP_FORGOT_COEF (l'alumne ha obtingut la
        // funció original sense el factor 1/k). No afegim entrada NO_PRIMITIVE
        // separada per evitar redundància de tex; l'INTEGRAL_CONFUSION (e^{(k+1)x})
        // cobreix l'error "no has integrat" amb una forma visual diferent.

        // ── INTEGRAL_CONFUSION: e^{(k+1)x} (ha confós amb la regla de la potència
        //   i ha incrementat el coeficient de l'exponent com si fos un índex x^n)
        const kPlus1Arg = _kxArg(k + 1);
        const powerConfTex = `e^{${kPlus1Arg}}`;
        if (powerConfTex !== correct && !pool.find(d => d.tex === powerConfTex))
            pool.push({ tex: powerConfTex, feedback: S.exp.power_rule, errorType: INTEGRAL_CONFUSION, scope: 'family:exp' });

        return pool;
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================

    /**
     * Genera el pool de distractors per a ∫a·x^n dx.
     * Accepta buildPower(n) [backward compat] o buildPower(a, n).
     */
    function buildPower(aOrN, n) {
        return n === undefined ? _buildPowerPool(1, aOrN) : _buildPowerPool(aOrN, n);
    }

    /**
     * Genera el pool de distractors per a ∫e^{kx} dx.
     */
    function buildExp(k) {
        return _buildExpPool(k);
    }

    return { buildPower, buildExp, FeedbackHints };

})();
