/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/distractor-lib.js
 * ROL: Taxonomia d'errors pedagògics i generador de distractors per família.
 * ARQUITECTURA:
 * - Cada distractor porta: { tex, feedback, errorType, scope }
 * - Scopes disponibles:
 *     'universal'           → qualsevol família
 *     'linear-inner'        → quan h(x) = kx
 *     'family:exp'          → g(x) = e^x
 *     'family:exp-sin'      → e^{sin(x)}
 *     'family:exp-cos'      → e^{cos(x)}
 *     'family:ln-sin'       → ln(sin(x))
 *     'family:ln-cos'       → ln(cos(x))
 *     'family:log-kx'       → ln(kx)
 *     'family:log-xn'       → ln(x^n)
 *     'family:log-linear'   → ln(ax+b)
 *     'family:log-poly2'    → ln(x²+bx+c)
 *     'family:sin'          → sin(kx)
 *     'family:cos'          → cos(kx)
 *     'family:sin-poly2'    → sin(x²+bx+c)
 *     'family:cos-poly2'    → cos(x²+bx+c)
 *     'rule:power'          → regla de la potència
 *     'rule:product'        → regla del producte
 *     'rule:quotient'       → regla del quocient
 * - API pública:
 *     build(kVars, fns, scopeFilter)
 *     buildPower(n)
 *     buildLog(type, params)         type: 'kx'|'xn'|'linear'|'poly2'
 *     buildTrig(type, params)        type: 'sin'|'cos'|'sin-poly2'|'cos-poly2'
 *     buildProduct(pair)
 *     buildQuotient(pair)
 *     FeedbackHints
 * - FASE 10: Afegits pools per sin(x²+bx+c) i cos(x²+bx+c).
 *   buildTrig ara accepta type='sin-poly2'|'cos-poly2' amb params={b,c}.
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
    const CHAIN_FORGOT        = 'CHAIN_FORGOT';
    const CHAIN_WRONG_COEF    = 'CHAIN_WRONG_COEF';
    const CHAIN_SIGN          = 'CHAIN_SIGN';
    const NO_DERIVATIVE       = 'NO_DERIVATIVE';
    const INTEGRAL_CONFUSION  = 'INTEGRAL_CONFUSION';
    const PRODUCT_FORGOT_SUM  = 'PRODUCT_FORGOT_SUM';
    const PRODUCT_WRONG_ORDER = 'PRODUCT_WRONG_ORDER';
    const QUOTIENT_SIGN       = 'QUOTIENT_SIGN';
    const QUOTIENT_DENOM      = 'QUOTIENT_DENOM';
    const POWER_FORGOT_R      = 'POWER_FORGOT_R';
    const POWER_WRONG_EXP     = 'POWER_WRONG_EXP';
    const LOG_INVERTED        = 'LOG_INVERTED';
    const LOG_FORGOT_CHAIN    = 'LOG_FORGOT_CHAIN';
    const LOG_FORGOT_DIVIDE   = 'LOG_FORGOT_DIVIDE';
    const SIN_COS_SWAP        = 'SIN_COS_SWAP';

    // =========================================================================
    // HINTS AMPLIATS PER errorType
    // Delegats completament a strings.js → Strings.Hints
    // =========================================================================
    const FeedbackHints = Strings.Hints;

    // =========================================================================
    // ÀLIES LOCALS → MathEngine (font única, evita duplicació)
    // =========================================================================
    const _fmtLinear    = MathEngine.fmtLinear;
    const _fmtPoly2     = MathEngine.fmtPoly2;
    const _fmtPoly2Deriv= MathEngine.fmtPoly2Deriv;
    const _fmtConst     = MathEngine.fmtConst;
    const _kxArg        = MathEngine.kxArg;
    const _trigTerm     = MathEngine.trigTerm;
    const _wrapIfNeeded = MathEngine.wrapIfNeeded;
    const _polyCoefTrig = MathEngine.polyCoefTrig;

    // =========================================================================
    // POOL: sin(kx)
    // =========================================================================
    function _buildSinPool(k) {
        const arg     = _kxArg(k);
        const pool    = [];
        if (k !== 1 && k !== -1) pool.push({ tex: `\\cos(${arg})`,           feedback: S.sin_kx.forgot_k,      errorType: CHAIN_FORGOT,       scope: 'family:sin' });
        pool.push(                          { tex: _trigTerm(k, 'sin', arg),  feedback: S.sin_kx.sin_cos_swap,  errorType: SIN_COS_SWAP,       scope: 'family:sin' });
        pool.push(                          { tex: _trigTerm(-k, 'cos', arg), feedback: S.sin_kx.wrong_sign,    errorType: CHAIN_SIGN,         scope: 'family:sin' });
        pool.push(                          { tex: _trigTerm(-k, 'sin', arg), feedback: S.sin_kx.double_error,  errorType: SIN_COS_SWAP,       scope: 'family:sin' });
        // NO_DERIVATIVE: `\sin(arg)` — comprova que no coincideixi amb un SIN_COS_SWAP ja present
        const sinOriginal = `\\sin(${arg})`;
        if (!pool.find(d => d.tex === sinOriginal))
            pool.push(                      { tex: sinOriginal,               feedback: S.no_derivative,        errorType: NO_DERIVATIVE,      scope: 'universal'  });
        if (Math.abs(k) > 1) {
            const den     = Math.abs(k);
            const intSign = k > 0 ? '-' : '';
            pool.push({ tex: `${intSign}\\frac{1}{${den}}\\cos(${arg})`, feedback: S.sin_kx.is_integral,  errorType: INTEGRAL_CONFUSION, scope: 'family:sin' });
            pool.push({ tex: _trigTerm(k * k, 'cos', arg),               feedback: S.sin_kx.k_squared,    errorType: CHAIN_WRONG_COEF,   scope: 'family:sin' });
        }
        return pool;
    }

    // =========================================================================
    // POOL: cos(kx)
    // =========================================================================
    function _buildCosPool(k) {
        const arg  = _kxArg(k);
        const pool = [];
        pool.push({ tex: _trigTerm(k, 'sin', arg),  feedback: S.cos_kx.forgot_sign,  errorType: CHAIN_SIGN,    scope: 'family:cos' });
        pool.push({ tex: _trigTerm(-k, 'cos', arg), feedback: S.cos_kx.sin_cos_swap, errorType: SIN_COS_SWAP,  scope: 'family:cos' });
        if (k !== 1 && k !== -1) pool.push({ tex: `-\\sin(${arg})`, feedback: S.cos_kx.forgot_k, errorType: CHAIN_FORGOT, scope: 'family:cos' });
        pool.push({ tex: _trigTerm(k, 'cos', arg),  feedback: S.cos_kx.double_error, errorType: SIN_COS_SWAP,  scope: 'family:cos' });
        pool.push({ tex: `\\cos(${arg})`,           feedback: S.no_derivative,       errorType: NO_DERIVATIVE, scope: 'universal'  });
        if (Math.abs(k) > 1) {
            const den     = Math.abs(k);
            const intSign = k > 0 ? '' : '-';
            pool.push({ tex: `${intSign}\\frac{1}{${den}}\\sin(${arg})`, feedback: S.cos_kx.is_integral, errorType: INTEGRAL_CONFUSION, scope: 'family:cos' });
        }
        return pool;
    }

    // =========================================================================
    // POOL: sin(x²+bx+c) — derivada (2x+b)·cos(x²+bx+c)
    // =========================================================================
    /**
     * Errors típics:
     *   CHAIN_FORGOT:     cos(p)             → ha oblidat p'(x)
     *   SIN_COS_SWAP:     (2x+b)·sin(p)      → ha derivat sin→sin en lloc de sin→cos
     *   CHAIN_SIGN:       −(2x+b)·cos(p)     → signe negatiu erroni (confusió amb cos')
     *   CHAIN_WRONG_COEF: 2x·cos(p)          → ha oblidat el terme b de p'(x)
     *   CHAIN_WRONG_COEF: 2·cos(p)           → ha derivat 2x com a 2 (constant)
     *   NO_DERIVATIVE:    sin(p)             → no ha derivat
     *   SIN_COS_SWAP+SIGN:−(2x+b)·sin(p)    → sin en lloc de cos + signe negatiu
     */
    function _buildSinPoly2Pool(b, c) {
        const arg      = _fmtPoly2(b, c);
        const pDeriv   = _fmtPoly2Deriv(b);  // '2x+b'
        const pool     = [];

        // CHAIN_FORGOT: cos(p) → oblidat p'
        pool.push({
            tex:       `\\cos(${arg})`,
            feedback:  S.sin_poly2.forgot_p_prime,
            errorType: CHAIN_FORGOT,
            scope:     'family:sin-poly2'
        });

        // SIN_COS_SWAP: (2x+b)·sin(p) → sin→sin
        pool.push({
            tex:       _polyCoefTrig(pDeriv, 'sin', arg),
            feedback:  S.sin_poly2.sin_cos_swap,
            errorType: SIN_COS_SWAP,
            scope:     'family:sin-poly2'
        });

        // CHAIN_SIGN: −(2x+b)·cos(p) → signe negatiu (confusió amb cos')
        pool.push({
            tex:       `-${_polyCoefTrig(pDeriv, 'cos', arg)}`,
            feedback:  S.sin_poly2.wrong_sign,
            errorType: CHAIN_SIGN,
            scope:     'family:sin-poly2'
        });

        // NO_DERIVATIVE: sin(p)
        pool.push({
            tex:       `\\sin(${arg})`,
            feedback:  S.no_derivative,
            errorType: NO_DERIVATIVE,
            scope:     'universal'
        });

        // CHAIN_WRONG_COEF: 2x·cos(p) → oblidat el terme b de p'(x)
        if (b !== 0) {
            pool.push({
                tex:       `2x\\cos(${arg})`,
                feedback:  S.sin_poly2.forgot_b,
                errorType: CHAIN_WRONG_COEF,
                scope:     'family:sin-poly2'
            });
        }

        // CHAIN_WRONG_COEF: 2·cos(p) → ha derivat 2x com a 2
        pool.push({
            tex:       `2\\cos(${arg})`,
            feedback:  S.sin_poly2.forgot_x_in_2x,
            errorType: CHAIN_WRONG_COEF,
            scope:     'family:sin-poly2'
        });

        // SIN_COS_SWAP + CHAIN_SIGN: −(2x+b)·sin(p)
        pool.push({
            tex:       `-${_polyCoefTrig(pDeriv, 'sin', arg)}`,
            feedback:  S.sin_poly2.double_error,
            errorType: SIN_COS_SWAP,
            scope:     'family:sin-poly2'
        });

        return pool;
    }

    // =========================================================================
    // POOL: cos(x²+bx+c) — derivada −(2x+b)·sin(x²+bx+c)
    // =========================================================================
    /**
     * Errors típics:
     *   CHAIN_SIGN:       (2x+b)·sin(p)      → ha oblidat el signe negatiu de cos'
     *   SIN_COS_SWAP:     −(2x+b)·cos(p)     → ha posat el signe però no ha canviat la fn
     *   CHAIN_FORGOT:     −sin(p)            → signe bé però oblidat p'
     *   CHAIN_WRONG_COEF: −2x·sin(p)         → oblidat el terme b
     *   CHAIN_WRONG_COEF: −2·sin(p)          → ha derivat 2x com a 2
     *   NO_DERIVATIVE:    cos(p)             → no ha derivat
     *   SIN_COS_SWAP+SIGN:(2x+b)·cos(p)      → ni signe ni fn correctes
     */
    function _buildCosPoly2Pool(b, c) {
        const arg    = _fmtPoly2(b, c);
        const pDeriv = _fmtPoly2Deriv(b);
        const pool   = [];

        // CHAIN_SIGN: (2x+b)·sin(p) → oblidat el −
        pool.push({
            tex:       _polyCoefTrig(pDeriv, 'sin', arg),
            feedback:  S.cos_poly2.forgot_sign,
            errorType: CHAIN_SIGN,
            scope:     'family:cos-poly2'
        });

        // SIN_COS_SWAP: −(2x+b)·cos(p) → signe correcte però fn incorrecta
        pool.push({
            tex:       `-${_polyCoefTrig(pDeriv, 'cos', arg)}`,
            feedback:  S.cos_poly2.sin_cos_swap,
            errorType: SIN_COS_SWAP,
            scope:     'family:cos-poly2'
        });

        // CHAIN_FORGOT: −sin(p) → signe i fn correctes però oblidat p'
        pool.push({
            tex:       `-\\sin(${arg})`,
            feedback:  S.cos_poly2.forgot_p_prime,
            errorType: CHAIN_FORGOT,
            scope:     'family:cos-poly2'
        });

        // NO_DERIVATIVE: cos(p)
        pool.push({
            tex:       `\\cos(${arg})`,
            feedback:  S.no_derivative,
            errorType: NO_DERIVATIVE,
            scope:     'universal'
        });

        // CHAIN_WRONG_COEF: −2x·sin(p) → oblidat terme b de p'
        if (b !== 0) {
            pool.push({
                tex:       `-2x\\sin(${arg})`,
                feedback:  S.cos_poly2.forgot_b,
                errorType: CHAIN_WRONG_COEF,
                scope:     'family:cos-poly2'
            });
        }

        // CHAIN_WRONG_COEF: −2·sin(p) → derivat 2x com a 2
        pool.push({
            tex:       `-2\\sin(${arg})`,
            feedback:  S.cos_poly2.forgot_x_in_2x,
            errorType: CHAIN_WRONG_COEF,
            scope:     'family:cos-poly2'
        });

        // SIN_COS_SWAP + CHAIN_SIGN: (2x+b)·cos(p) → ni signe ni fn
        pool.push({
            tex:       _polyCoefTrig(pDeriv, 'cos', arg),
            feedback:  S.cos_poly2.double_error,
            errorType: SIN_COS_SWAP,
            scope:     'family:cos-poly2'
        });

        return pool;
    }

    // =========================================================================
    // POOL: cadena g(kx) — exponencials
    // =========================================================================
    function _buildChainPool(kVars, fns) {
        const { coef, negCoef, kx, negKx, plusK, kInv } = kVars;
        const { g, dg, intG } = fns;
        return [
            { tex: `${dg(kx)}`,              feedback: S.chain_generic.forgot_chain,       errorType: CHAIN_FORGOT,       scope: 'universal'    },
            { tex: `${coef}${g(kx)}`,        feedback: S.chain_generic.not_derivative_coef, errorType: NO_DERIVATIVE,      scope: 'universal'    },
            { tex: `${g(kx)}`,               feedback: S.chain_generic.not_derived,         errorType: NO_DERIVATIVE,      scope: 'universal'    },
            { tex: `${kInv}${dg(kx)}`,       feedback: S.chain_generic.wrong_coef_generic,  errorType: CHAIN_WRONG_COEF,   scope: 'linear-inner' },
            { tex: `${coef}x${dg(kx)}`,      feedback: S.chain_generic.forgot_chain_coef,   errorType: CHAIN_WRONG_COEF,   scope: 'linear-inner' },
            { tex: `${dg(kx)} ${plusK}`,     feedback: S.chain_generic.forgot_chain_sum,    errorType: CHAIN_WRONG_COEF,   scope: 'linear-inner' },
            { tex: `${coef}${dg('x')}`,      feedback: S.chain_generic.forgot_chain_coef,   errorType: CHAIN_FORGOT,       scope: 'linear-inner' },
            { tex: `${dg('x')} ${plusK}`,    feedback: S.chain_generic.forgot_chain_sum,    errorType: CHAIN_FORGOT,       scope: 'linear-inner' },
            { tex: `${dg('x')}`,             feedback: S.chain_generic.not_derivative_coef, errorType: CHAIN_FORGOT,       scope: 'universal'    },
            { tex: `${dg(negKx)}`,           feedback: S.chain_generic.sign_error,          errorType: CHAIN_SIGN,         scope: 'linear-inner' },
            { tex: `${negCoef}${dg(negKx)}`, feedback: S.chain_generic.sign_error_neg,      errorType: CHAIN_SIGN,         scope: 'linear-inner' },
            { tex: `${kInv}${intG(kx)}`,     feedback: S.chain_generic.integral_plain,      errorType: INTEGRAL_CONFUSION, scope: 'family:exp'   },
            { tex: `${intG(kx)}`,            feedback: S.chain_generic.integral_plain,       errorType: INTEGRAL_CONFUSION, scope: 'family:exp'   },
            { tex: `${dg(`${coef}(x-1)`)}`,  feedback: S.chain_generic.power_wrong_exp,     errorType: POWER_WRONG_EXP,    scope: 'family:exp'   },
        ];
    }

    // =========================================================================
    // POOL: potència a·x^n   (a=1 → cas original x^n, backward compatible)
    // =========================================================================
    /**
     * Genera distractors per a f(x) = a·x^n, f'(x) = an·x^{n−1}.
     * Quan a=1 el comportament és idèntic a l'antiga _buildPowerPool(n).
     *
     * Errors modelats:
     *   POWER_FORGOT_R   → ha reduït l'exponent però no ha baixat n (→ a·x^{n-1})
     *   POWER_FORGOT_R   → ha baixat n però ha oblidat a (→ n·x^{n-1}) [a≠1]
     *   POWER_WRONG_EXP  → coef correcte però exponent no reduït (→ an·x^n)
     *   NO_DERIVATIVE    → funció original (→ a·x^n)
     *   INTEGRAL_CONFUSION → primitiva en lloc de derivada
     *   POWER_WRONG_EXP  → doble derivada per error
     *   POWER_WRONG_EXP  → exponent augmentat en lloc de reduït
     */
    function _buildPowerPool(a, n) {
        const fmt     = MathEngine.formatPowerTerm;
        const correct = fmt(a * n, n - 1);
        const pool    = [];

        // POWER_FORGOT_R: conserva a, no baixa n com a factor
        const forgotN = fmt(a, n - 1);
        if (forgotN !== correct && !pool.find(d => d.tex === forgotN))
            pool.push({ tex: forgotN, feedback: S.power.forgot_n, errorType: POWER_FORGOT_R, scope: 'rule:power' });

        // POWER_FORGOT_R: baixa n però oblida el coeficient a (només si a≠1)
        if (a !== 1) {
            const forgotA = fmt(n, n - 1);
            if (forgotA !== correct && !pool.find(d => d.tex === forgotA))
                pool.push({ tex: forgotA, feedback: S.power.forgot_a, errorType: POWER_FORGOT_R, scope: 'rule:power' });
        }

        // POWER_WRONG_EXP: coeficient correcte, exponent no s'ha reduït
        const wrongExp = fmt(a * n, n);
        if (wrongExp !== correct && !pool.find(d => d.tex === wrongExp))
            pool.push({ tex: wrongExp, feedback: S.power.coef_ok_exp_not, errorType: POWER_WRONG_EXP, scope: 'rule:power' });

        // NO_DERIVATIVE: funció original sense derivar
        const original = fmt(a, n);
        if (!pool.find(d => d.tex === original))
            pool.push({ tex: original, feedback: S.no_derivative_fx, errorType: NO_DERIVATIVE, scope: 'universal' });

        // INTEGRAL_CONFUSION: primitiva a·x^{n+1}/(n+1)
        // Simplifica els dos signes negatius si a<0 i n+1<0
        if (n + 1 !== 0) {
            const den     = n + 1;
            const simpA   = (a < 0 && den < 0) ? -a : a;
            const simpDen = (a < 0 && den < 0) ? -den : den;
            const numStr  = fmt(simpA, n + 1);
            const intTex  = Math.abs(simpDen) === 1
                ? (simpDen === -1 ? `-${numStr}` : numStr)
                : `\\frac{${numStr}}{${simpDen}}`;
            if (intTex !== correct && !pool.find(d => d.tex === intTex))
                pool.push({ tex: intTex, feedback: S.power.is_integral, errorType: INTEGRAL_CONFUSION, scope: 'rule:power' });
        }

        // POWER_WRONG_EXP: doble derivada per error (→ a(n-1)·x^{n-2})
        const overDeriv = fmt(a * (n - 1), n - 2);
        if (overDeriv !== correct && !pool.find(d => d.tex === overDeriv))
            pool.push({ tex: overDeriv, feedback: S.power.double_derived, errorType: POWER_WRONG_EXP, scope: 'rule:power' });

        // POWER_WRONG_EXP: exponent augmentat en lloc de reduït (→ a(n+1)·x^n)
        const plusExp = fmt(a * (n + 1), n);
        if (plusExp !== correct && !pool.find(d => d.tex === plusExp))
            pool.push({ tex: plusExp, feedback: S.power.exp_increased, errorType: POWER_WRONG_EXP, scope: 'rule:power' });

        return pool;
    }

    // =========================================================================
    // POOL: logaritmes
    // =========================================================================
    function _buildLogKxPool(k) {
        const argTex = k === 1 ? 'x' : `${k}x`;
        const kStr   = String(k);
        const pool   = [];
        if (k !== 1) pool.push({ tex: `\\frac{1}{${argTex}}`,   feedback: S.log_kx.forgot_chain,   errorType: LOG_FORGOT_CHAIN, scope: 'family:log-kx' });
        if (k !== 1) pool.push({ tex: `\\frac{${kStr}}{x}`,     feedback: S.log_kx.not_simplified,  errorType: CHAIN_WRONG_COEF, scope: 'family:log-kx' });
        pool.push(              { tex: `\\ln(${argTex})`,        feedback: S.no_derivative,          errorType: NO_DERIVATIVE,    scope: 'universal'     });
        pool.push(              { tex: 'x',                      feedback: S.log_kx.inverted,        errorType: LOG_INVERTED,     scope: 'family:log-kx' });
        if (k !== 1) pool.push({ tex: `${kStr}\\ln(${argTex})`, feedback: S.log_kx.no_deriv_kln,    errorType: NO_DERIVATIVE,    scope: 'family:log-kx' });
        return pool;
    }

    function _buildLogXnPool(n) {
        const pool = [];
        pool.push({ tex: n===2?`\\frac{1}{x^2}`:`\\frac{1}{x^{${n}}}`,       feedback: S.log_xn.forgot_chain,      errorType: LOG_FORGOT_CHAIN, scope: 'family:log-xn' });
        pool.push({ tex: n===2?`\\frac{${n}}{x^2}`:`\\frac{${n}}{x^{${n}}}`, feedback: S.log_xn.not_simplified,    errorType: CHAIN_WRONG_COEF, scope: 'family:log-xn' });
        pool.push({ tex: n===2?`\\ln(x^2)`:`\\ln(x^{${n}})`,                  feedback: S.no_derivative,            errorType: NO_DERIVATIVE,    scope: 'universal'     });
        pool.push({ tex: n===2?`\\frac{x^2}{${n}}`:`\\frac{x^{${n}}}{${n}}`,  feedback: S.log_xn.inverted,          errorType: LOG_INVERTED,     scope: 'family:log-xn' });
        pool.push({ tex: `${n}\\ln(x)`,                                        feedback: S.log_xn.property_no_deriv, errorType: NO_DERIVATIVE,    scope: 'family:log-xn' });
        const derPow = n===2?`${n}x`:`${n}x^{${n-1}}`;
        pool.push({ tex: derPow,                                                feedback: S.log_xn.derived_as_power,  errorType: POWER_WRONG_EXP,  scope: 'family:log-xn' });
        return pool;
    }

    function _buildLogLinearPool(a, b) {
        const arg  = _fmtLinear(a, b);
        const aStr = _fmtConst(a);
        // Per a coeficients multiplicatius davant de ln, suprimim el "1" explícit:
        // _fmtConst(-1)='-1' però davant de ln hauria de ser just '-'
        const aLn  = a === 1 ? '' : a === -1 ? '-' : String(a);
        const pool = [];
        pool.push(              { tex: `\\frac{1}{${arg}}`,           feedback: S.log_linear.forgot_chain,   errorType: LOG_FORGOT_CHAIN, scope: 'family:log-linear' });
        if (a !== 1) pool.push({ tex: `\\frac{${arg}}{${aStr}}`,      feedback: S.log_linear.inverted,       errorType: LOG_INVERTED,     scope: 'family:log-linear' });
        pool.push(              { tex: `\\ln(${arg})`,                 feedback: S.no_derivative_fx,          errorType: NO_DERIVATIVE,    scope: 'universal'         });
        pool.push(              { tex: `\\frac{${aStr}}{(${arg})^2}`,  feedback: S.log_linear.wrong_denom_sq, errorType: CHAIN_WRONG_COEF, scope: 'family:log-linear' });
        if (a !== 1) pool.push({ tex: `${aLn}\\ln(${arg})`,           feedback: S.log_linear.no_deriv_ln,    errorType: NO_DERIVATIVE,    scope: 'family:log-linear' });
        if (a > 0)  pool.push({ tex: `\\frac{-${aStr}}{${arg}}`,      feedback: S.log_linear.wrong_sign,     errorType: CHAIN_SIGN,       scope: 'family:log-linear' });
        return pool;
    }

    function _buildLogPoly2Pool(b, c) {
        const arg      = _fmtPoly2(b, c);
        const argDeriv = _fmtPoly2Deriv(b);
        const pool     = [];
        pool.push(              { tex: `\\frac{1}{${arg}}`,                feedback: S.log_poly2.forgot_chain,   errorType: LOG_FORGOT_CHAIN, scope: 'family:log-poly2' });
        pool.push(              { tex: `\\frac{${argDeriv}}{(${arg})^2}`,  feedback: S.log_poly2.wrong_denom_sq, errorType: CHAIN_WRONG_COEF, scope: 'family:log-poly2' });
        pool.push(              { tex: `\\frac{${arg}}{${argDeriv}}`,      feedback: S.log_poly2.inverted,       errorType: LOG_INVERTED,     scope: 'family:log-poly2' });
        pool.push(              { tex: `\\ln(${arg})`,                     feedback: S.no_derivative_fx,         errorType: NO_DERIVATIVE,    scope: 'universal'        });
        if (b !== 0) pool.push({ tex: `\\frac{2x}{${arg}}`,               feedback: S.log_poly2.forgot_b,       errorType: CHAIN_WRONG_COEF, scope: 'family:log-poly2' });
        pool.push(              { tex: `\\frac{2}{${arg}}`,                feedback: S.log_poly2.forgot_x,       errorType: CHAIN_WRONG_COEF, scope: 'family:log-poly2' });
        return pool;
    }

    // =========================================================================
    // POOL: producte i quocient
    // =========================================================================
    function _mul(a, b) {
        if (a === '0' || b === '0') return '0';
        if (a === '1')  return b;
        if (b === '1')  return a;
        if (a === '-1') return b.startsWith('-') ? b.slice(1) : `-${b}`;
        if (b.startsWith('-')) return `-${_mul(a, b.slice(1))}`;
        if (b.startsWith('\\frac')) return `${a}\\cdot ${b}`;

        // Si a és un enter i b comença per un coeficient enter, multipliquem
        // numèricament per evitar concatenacions com "22x" en lloc de "4x".
        // Exemples: _mul('2','2x')→'4x', _mul('3','4')→'12', _mul('-2','3x')→'-6x'
        const aInt = /^-?\d+$/.test(a) ? parseInt(a, 10) : null;
        if (aInt !== null) {
            const m = b.match(/^(\d+)(.*)$/);
            if (m) {
                const prod  = aInt * parseInt(m[1], 10);
                const bRest = m[2];
                if (prod ===  0) return '0';
                if (prod ===  1) return bRest || '1';
                if (prod === -1) return bRest ? `-${bRest}` : '-1';
                return bRest ? `${prod}${bRest}` : String(prod);
            }
        }

        return `${a}${b}`;
    }
    function _add(a, b) {
        if (b === '0') return a;
        if (a === '0') return b;
        return b.startsWith('-') ? `${a}${b}` : `${a}+${b}`;
    }
    function _sub(a, b) {
        if (b === '0') return a;
        if (b.startsWith('-')) return `${a}+${b.slice(1)}`;
        return `${a}-${b}`;
    }
    function _frac(num, den) { return `\\frac{${num}}{${den}}`; }

    function _buildProductPool(pair) {
        const { fTex, gTex, dfTex, dgTex, dfgTex, fdgTex, promptTex } = pair;
        const pool = [];
        const forgotSumTex  = _mul(dfTex, dgTex);
        const wrongOrderTex = _sub(dfgTex, fdgTex);
        if (forgotSumTex  !== pair.solutionTex) pool.push({ tex: forgotSumTex,  feedback: S.product.multiplied_derivs,  errorType: PRODUCT_FORGOT_SUM,  scope: 'rule:product' });
        if (wrongOrderTex !== pair.solutionTex) pool.push({ tex: wrongOrderTex, feedback: S.product.subtracted,         errorType: PRODUCT_WRONG_ORDER, scope: 'rule:product' });
        // Nota: el feedback de la funció original inclou la notació f(x)·g(x) específica d'aquest pool
        pool.push({ tex: promptTex, feedback: "Aquesta és la funció original f(x)·g(x), no la seva derivada.", errorType: NO_DERIVATIVE, scope: 'universal' });
        if (dfgTex !== pair.solutionTex && dfgTex !== promptTex && !pool.find(d => d.tex === dfgTex)) pool.push({ tex: dfgTex, feedback: S.product.forgot_second_term, errorType: PRODUCT_FORGOT_SUM, scope: 'rule:product' });
        if (fdgTex !== pair.solutionTex && fdgTex !== promptTex && !pool.find(d => d.tex === fdgTex)) pool.push({ tex: fdgTex, feedback: S.product.forgot_first_term,  errorType: PRODUCT_FORGOT_SUM, scope: 'rule:product' });
        return pool;
    }

    function _buildQuotientPool(pair) {
        const { fTex, gTex, dfTex, dgTex, dfgTex, fdgTex, g2Tex, promptTex } = pair;
        const numerator   = _sub(dfgTex, fdgTex);
        const pool        = [];
        const signErrTex  = _frac(_add(dfgTex, fdgTex), g2Tex);
        const denomErrTex = _frac(numerator, gTex);
        const invertedTex = _frac(_sub(fdgTex, dfgTex), g2Tex);
        const noDenomTex  = numerator;
        if (signErrTex  !== pair.solutionTex) pool.push({ tex: signErrTex,  feedback: S.quotient.added_instead,  errorType: QUOTIENT_SIGN,  scope: 'rule:quotient' });
        if (denomErrTex !== pair.solutionTex) pool.push({ tex: denomErrTex, feedback: S.quotient.forgot_sq,      errorType: QUOTIENT_DENOM, scope: 'rule:quotient' });
        // Nota: el feedback de la funció original inclou la notació f(x)/g(x) específica d'aquest pool
        pool.push({ tex: promptTex, feedback: "Aquesta és la funció original f(x)/g(x), no la seva derivada.", errorType: NO_DERIVATIVE, scope: 'universal' });
        if (invertedTex !== pair.solutionTex) pool.push({ tex: invertedTex, feedback: S.quotient.inverted_order, errorType: QUOTIENT_SIGN,  scope: 'rule:quotient' });
        if (noDenomTex  !== pair.solutionTex) pool.push({ tex: noDenomTex,  feedback: S.quotient.forgot_denom,   errorType: QUOTIENT_DENOM, scope: 'rule:quotient' });
        return pool;
    }

    // =========================================================================
    // POOLS: compostes d'ordre superior (exp∘trig i ln∘trig)
    // =========================================================================

    /**
     * Pool per a f(x) = e^{trig(x)}, on trig és 'sin' o 'cos'.
     *   'sin' → f'(x) = cos(x)·e^{sin(x)}
     *   'cos' → f'(x) = −sin(x)·e^{cos(x)}
     *
     * Errors modelats:
     *   CHAIN_FORGOT      → ha calculat g'(x) però ha oblidat f'(g(x))
     *   SIN_COS_SWAP      → ha usat la funció trig equivocada com a g'(x)
     *   CHAIN_SIGN        → ha oblidat el signe negatiu de cos'(x)
     *   CHAIN_WRONG_COEF  → ha avaluat l'exterior a g'(x) en lloc de g(x)
     *   NO_DERIVATIVE     → funció original sense derivar
     *
     * NOTA: el feedback de CHAIN_FORGOT és dinàmic (inclou gPrime i gTex concrets)
     * i no es pot centralitzar sense perdre precisió. Es manté inline.
     */
    function _buildExpTrigPool(trig) {
        const isSin     = trig === 'sin';
        const gTex      = `\\${trig}(x)`;
        const gPrime    = isSin ? `\\cos(x)` : `-\\sin(x)`;
        const pool      = [];
        const S_exp     = isSin ? S.exp_sin : S.exp_cos;

        // NO_DERIVATIVE: funció original
        pool.push({ tex: `e^{${gTex}}`, feedback: S.no_derivative, errorType: NO_DERIVATIVE, scope: `family:exp-${trig}` });

        // CHAIN_FORGOT: dinàmic — inclou el valor concret de gPrime i gTex
        pool.push({ tex: gPrime, feedback: `Has calculat la derivada de l'interior (${gPrime}), però has oblidat multiplicar per l'exterior e^{${gTex}}.`, errorType: CHAIN_FORGOT, scope: `family:exp-${trig}` });

        if (isSin) {
            // SIN_COS_SWAP: ha usat −sin en lloc de cos com a g'(x)
            pool.push({ tex: `-\\sin(x)e^{\\sin(x)}`, feedback: S.exp_sin.sin_cos_swap,   errorType: SIN_COS_SWAP,     scope: `family:exp-${trig}` });
            // CHAIN_WRONG_COEF: ha avaluat e a g'(x) en lloc de g(x)
            pool.push({ tex: `\\cos(x)e^{\\cos(x)}`,  feedback: S.exp_sin.wrong_arg_coef, errorType: CHAIN_WRONG_COEF, scope: `family:exp-${trig}` });
            // CHAIN_WRONG_COEF: e^{cos(x)} sense factor
            pool.push({ tex: `e^{\\cos(x)}`,           feedback: S.exp_sin.substituted_arg, errorType: CHAIN_WRONG_COEF, scope: `family:exp-${trig}` });
        } else {
            // CHAIN_SIGN: ha oblidat el signe negatiu de cos'
            pool.push({ tex: `\\sin(x)e^{\\cos(x)}`,  feedback: S.exp_cos.forgot_sign,     errorType: CHAIN_SIGN,       scope: `family:exp-${trig}` });
            // CHAIN_WRONG_COEF: e^{-sin(x)} (substituït arg per la seva derivada)
            pool.push({ tex: `e^{-\\sin(x)}`,          feedback: S.exp_cos.substituted_arg, errorType: CHAIN_WRONG_COEF, scope: `family:exp-${trig}` });
            // SIN_COS_SWAP: ha usat cos en lloc de −sin com a g'(x)
            pool.push({ tex: `\\cos(x)e^{\\cos(x)}`,  feedback: S.exp_cos.sin_cos_swap,    errorType: SIN_COS_SWAP,     scope: `family:exp-${trig}` });
        }
        return pool;
    }

    /**
     * Pool per a f(x) = ln(trig(x)), on trig és 'sin' o 'cos'.
     *   'sin' → f'(x) = cos(x)/sin(x)    = \\frac{\\cos(x)}{\\sin(x)}
     *   'cos' → f'(x) = −sin(x)/cos(x)   = \\frac{-\\sin(x)}{\\cos(x)}
     *
     * Errors modelats:
     *   LOG_FORGOT_CHAIN  → ha derivat ln però ha oblidat la derivada interior
     *   LOG_INVERTED      → té la fracció invertida
     *   CHAIN_SIGN        → ha oblidat el signe negatiu (família cos)
     *   CHAIN_WRONG_COEF  → ha calculat g'(x) però ha oblidat dividir per g(x)
     *   SIN_COS_SWAP      → ha usat la funció trig equivocada al numerador
     *   NO_DERIVATIVE     → funció original sense derivar
     *
     * NOTA: el feedback de LOG_FORGOT_CHAIN és dinàmic (inclou gTex concret)
     * i no es pot centralitzar sense perdre precisió. Es manté inline.
     */
    function _buildLogTrigPool(trig) {
        const isSin = trig === 'sin';
        const gTex  = `\\${trig}(x)`;
        const pool  = [];
        const S_ln  = isSin ? S.ln_sin : S.ln_cos;

        // NO_DERIVATIVE
        pool.push({ tex: `\\ln(${gTex})`, feedback: S.no_derivative, errorType: NO_DERIVATIVE, scope: `family:ln-${trig}` });

        // LOG_FORGOT_CHAIN: dinàmic — inclou el valor concret de gTex
        pool.push({ tex: `\\frac{1}{${gTex}}`, feedback: `Has derivat ln com a 1/${gTex}, però has oblidat multiplicar per la derivada interior (ln f)' = f'/f.`, errorType: LOG_FORGOT_CHAIN, scope: `family:ln-${trig}` });

        if (isSin) {
            pool.push({ tex: `\\frac{\\sin(x)}{\\cos(x)}`,  feedback: S_ln.inverted,      errorType: LOG_INVERTED,     scope: `family:ln-${trig}` });
            pool.push({ tex: `\\frac{-\\cos(x)}{\\sin(x)}`, feedback: S_ln.wrong_sign,    errorType: CHAIN_SIGN,       scope: `family:ln-${trig}` });
            pool.push({ tex: `\\cos(x)`,                     feedback: S_ln.forgot_divide, errorType: CHAIN_WRONG_COEF, scope: `family:ln-${trig}` });
            pool.push({ tex: `\\frac{-\\sin(x)}{\\cos(x)}`, feedback: S_ln.sin_cos_swap,  errorType: SIN_COS_SWAP,     scope: `family:ln-${trig}` });
        } else {
            pool.push({ tex: `\\frac{\\sin(x)}{\\cos(x)}`,  feedback: S_ln.forgot_sign,   errorType: CHAIN_SIGN,       scope: `family:ln-${trig}` });
            pool.push({ tex: `\\frac{-\\cos(x)}{\\sin(x)}`, feedback: S_ln.inverted,      errorType: LOG_INVERTED,     scope: `family:ln-${trig}` });
            pool.push({ tex: `-\\sin(x)`,                    feedback: S_ln.forgot_divide, errorType: LOG_FORGOT_DIVIDE, scope: `family:ln-${trig}` });
            pool.push({ tex: `\\frac{\\cos(x)}{\\sin(x)}`,  feedback: S_ln.sin_cos_swap,  errorType: SIN_COS_SWAP,     scope: `family:ln-${trig}` });
            pool.push({ tex: `\\frac{\\cos(x)}{-\\sin(x)}`, feedback: S_ln.inverted_sign, errorType: LOG_INVERTED,     scope: `family:ln-${trig}` });
        }
        return pool;
    }

    // =========================================================================
    function build(kVars, fns, scopeFilter) {
        const pool = _buildChainPool(kVars, fns);
        if (!scopeFilter || scopeFilter.length === 0) return pool;
        return pool.filter(d => scopeFilter.includes(d.scope));
    }
    function buildPower(aOrN, n) {
        // Accepta buildPower(n) [backward compat] o buildPower(a, n)
        return n === undefined ? _buildPowerPool(1, aOrN) : _buildPowerPool(aOrN, n);
    }
    function buildProduct(pair)  { return _buildProductPool(pair); }
    function buildQuotient(pair) { return _buildQuotientPool(pair); }

    function buildLog(type, params) {
        if (type === 'kx')     return _buildLogKxPool(params.k);
        if (type === 'xn')     return _buildLogXnPool(params.n);
        if (type === 'linear') return _buildLogLinearPool(params.a, params.b);
        if (type === 'poly2')  return _buildLogPoly2Pool(params.b, params.c);
        return [];
    }

    /**
     * Genera el pool de distractors per a funcions trigonomètriques.
     * @param {'sin'|'cos'|'sin-poly2'|'cos-poly2'} type
     * @param {number|object} params
     *   'sin'|'cos':          k (enter ≠ 0)
     *   'sin-poly2'|'cos-poly2': { b, c }
     */
    function buildTrig(type, params) {
        if (type === 'sin')       return _buildSinPool(params);
        if (type === 'cos')       return _buildCosPool(params);
        if (type === 'sin-poly2') return _buildSinPoly2Pool(params.b, params.c);
        if (type === 'cos-poly2') return _buildCosPoly2Pool(params.b, params.c);
        return [];
    }

    /**
     * Genera el pool de distractors per a compostes d'ordre superior.
     * @param {'exp-sin'|'exp-cos'|'ln-sin'|'ln-cos'} type
     */
    function buildCompound(type) {
        if (type === 'exp-sin') return _buildExpTrigPool('sin');
        if (type === 'exp-cos') return _buildExpTrigPool('cos');
        if (type === 'ln-sin')  return _buildLogTrigPool('sin');
        if (type === 'ln-cos')  return _buildLogTrigPool('cos');
        return [];
    }

    return { build, buildPower, buildLog, buildTrig, buildCompound, buildProduct, buildQuotient, FeedbackHints };

})();
