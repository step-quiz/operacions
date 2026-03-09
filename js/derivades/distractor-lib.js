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
 * DEPENDÈNCIES: Requereix math-engine.js.
 * ============================================================================
 */

window.DistractorLib = (() => {

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
    const SIN_COS_SWAP        = 'SIN_COS_SWAP';

    // =========================================================================
    // HINTS AMPLIATS PER errorType
    // =========================================================================
    const FeedbackHints = {
        [CHAIN_FORGOT]:       "Recorda: si tens f(g(x)), la derivada és f'(g(x)) · g'(x). Has de multiplicar per la derivada de l'argument interior.",
        [CHAIN_WRONG_COEF]:   "Has aplicat la regla de la cadena, però la derivada de l'argument interior no és correcta. Comprova tots els termes de p'(x).",
        [CHAIN_SIGN]:         "Comprova el signe. La derivada de cos porta signe negatiu: (cos u)' = −sin(u)·u'. Si u' té termes negatius, el signe es propaga.",
        [NO_DERIVATIVE]:      "Aquesta és la funció original, no la seva derivada. Recorda que has de derivar.",
        [INTEGRAL_CONFUSION]: "Estàs calculant una primitiva (integral) en lloc d'una derivada. Les operacions són inverses.",
        [PRODUCT_FORGOT_SUM]: "La regla del producte diu (fg)' = f'g + fg'. Necessites la suma de dos termes, no el producte de les derivades.",
        [PRODUCT_WRONG_ORDER]:"Comprova l'ordre i el signe dels termes. Pots estar confonen la regla del producte amb la del quocient.",
        [QUOTIENT_SIGN]:      "Al numerador de la regla del quocient, l'ordre és f'g − fg'. Revisa quin terme va primer i el signe.",
        [QUOTIENT_DENOM]:     "El denominador de la regla del quocient és g², no g. No oblides elevar al quadrat.",
        [POWER_FORGOT_R]:     "La regla de la potència diu (x^n)' = n·x^{n−1}. L'exponent n baixa i es posa com a coeficient davant.",
        [POWER_WRONG_EXP]:    "L'exponent ha de ser n−1, no n. Quan l'exponent baixa, es redueix en 1.",
        [LOG_INVERTED]:       "La derivada de ln(f(x)) és f'(x)/f(x). Comprova que la fracció no la tens girada.",
        [LOG_FORGOT_CHAIN]:   "Has derivat el logaritme però has oblidat multiplicar per la derivada de l'argument interior: (ln f)' = f'/f.",
        [SIN_COS_SWAP]:       "Atenció a quina funció trigonomètrica surt en derivar: (sin u)' = cos(u)·u' i (cos u)' = −sin(u)·u'. Sin i cos s'intercanvien, però amb signes diferents.",
    };

    // =========================================================================
    // HELPERS DE FORMAT TRIGONOMÈTRIC (privats, compartits)
    // =========================================================================
    function _trigTerm(k, fn, arg) {
        const fnArg = `\\${fn}(${arg})`;
        if (k ===  1) return fnArg;
        if (k === -1) return `-${fnArg}`;
        return `${k}${fnArg}`;
    }
    function _kxArg(k) {
        if (k ===  1) return 'x';
        if (k === -1) return '-x';
        return `${k}x`;
    }

    // =========================================================================
    // HELPERS DE FORMAT POLINÒMIC (privats, compartits amb pools de log/trig)
    // =========================================================================
    function _fmtLinear(a, b) {
        const aPart = a ===  1 ? 'x' : a === -1 ? '-x' : `${a}x`;
        if (b === 0) return aPart;
        return `${aPart}${b > 0 ? `+${b}` : b}`;
    }
    function _fmtPoly2(b, c) {
        let s = 'x^2';
        if (b !== 0) s += b > 0 ? `+${b}x` : `${b}x`;
        if (c !== 0) s += c > 0 ? `+${c}` : `${c}`;
        return s;
    }
    function _fmtPoly2Deriv(b) {
        if (b === 0)  return '2x';
        if (b === 1)  return '2x+1';
        if (b === -1) return '2x-1';
        return b > 0 ? `2x+${b}` : `2x${b}`;
    }
    function _fmtConst(a) {
        if (a ===  1) return '1';
        if (a === -1) return '-1';
        return String(a);
    }

    /**
     * Determina si cal envolicar tex entre parèntesis analitzant la
     * profunditat de claus LaTeX. Evita falsos positius quan els operadors
     * + o − apareixen dins \frac{}{} o altres entorns amb claus.
     * Exemples:
     *   '2x+3'            → '(2x+3)'     ← + a profunditat 0
     *   '2x'              → '2x'          ← cap operador a profunditat 0
     *   '-x'              → '-x'          ← - a posició 0, no és infix
     *   '2x-1'            → '(2x-1)'     ← - infix a profunditat 0
     *   '\\frac{x+1}{2}'  → '\\frac{x+1}{2}'  ← + dins claus, prof > 0
     */
    function _wrapIfNeeded(tex) {
        let depth = 0;
        for (let i = 0; i < tex.length; i++) {
            const c = tex[i];
            if (c === '{') { depth++; continue; }
            if (c === '}') { depth--; continue; }
            if (depth === 0) {
                if (c === '+') return `(${tex})`;
                if (c === '-' && i > 0) return `(${tex})`;
            }
        }
        return tex;
    }

    /**
     * Formata (pDeriv)·fn(arg) com a LaTeX net.
     * Gestiona el cas b=0 (coef = '2x') i fn='sin'|'cos'.
     * Retorna p.ex. "(2x+3)\\cos(x^2+3x+1)"
     * Usa _wrapIfNeeded per detectar correctament si cal parèntesi,
     * fins i tot quan pDeriv conté estructures LaTeX amb claus.
     */
    function _polyCoefTrig(pDeriv, fn, arg) {
        const fnArg    = `\\${fn}(${arg})`;
        const coefPart = _wrapIfNeeded(pDeriv);
        return `${coefPart}${fnArg}`;
    }

    // =========================================================================
    // POOL: sin(kx)
    // =========================================================================
    function _buildSinPool(k) {
        const arg     = _kxArg(k);
        const pool    = [];
        if (k !== 1 && k !== -1) pool.push({ tex: `\\cos(${arg})`,           feedback: "Has derivat sin a cos, però has oblidat multiplicar per la derivada de l'argument interior (k).",              errorType: CHAIN_FORGOT,    scope: 'family:sin' });
        pool.push(                          { tex: _trigTerm(k, 'sin', arg),  feedback: "La derivada de sin(u) és cos(u)·u', no sin(u)·u'. Sin i cos s'intercanvien en derivar.",                       errorType: SIN_COS_SWAP,   scope: 'family:sin' });
        pool.push(                          { tex: _trigTerm(-k, 'cos', arg), feedback: "La derivada de sin és +cos, no −cos. El signe negatiu apareix en la derivada de cos, no de sin.",               errorType: CHAIN_SIGN,     scope: 'family:sin' });
        pool.push(                          { tex: _trigTerm(-k, 'sin', arg), feedback: "Dos errors alhora: (sin u)' = cos(u)·u', no −sin(u)·u'.",                                                       errorType: SIN_COS_SWAP,   scope: 'family:sin' });
        pool.push(                          { tex: `\\sin(${arg})`,           feedback: "Aquesta és la funció original, no la seva derivada.",                                                             errorType: NO_DERIVATIVE,  scope: 'universal'  });
        if (Math.abs(k) > 1) {
            const den     = Math.abs(k);
            const intSign = k > 0 ? '-' : '';
            pool.push({ tex: `${intSign}\\frac{1}{${den}}\\cos(${arg})`, feedback: "Estàs calculant la primitiva (∫sin = −cos/k), no la derivada (sin' = k·cos).", errorType: INTEGRAL_CONFUSION, scope: 'family:sin' });
            pool.push({ tex: _trigTerm(k * k, 'cos', arg), feedback: "El coeficient de la regla de la cadena és k, no k².", errorType: CHAIN_WRONG_COEF, scope: 'family:sin' });
        }
        return pool;
    }

    // =========================================================================
    // POOL: cos(kx)
    // =========================================================================
    function _buildCosPool(k) {
        const arg  = _kxArg(k);
        const pool = [];
        pool.push({ tex: _trigTerm(k, 'sin', arg),  feedback: "Has derivat cos a sin, però la derivada de cos porta signe negatiu: (cos u)' = −sin(u)·u'.",         errorType: CHAIN_SIGN,    scope: 'family:cos' });
        pool.push({ tex: _trigTerm(-k, 'cos', arg), feedback: "Has posat el signe negatiu, però la derivada de cos és −sin, no −cos. Sin i cos s'intercanvien.",     errorType: SIN_COS_SWAP,  scope: 'family:cos' });
        if (k !== 1 && k !== -1) pool.push({ tex: `-\\sin(${arg})`, feedback: "Has derivat cos a −sin, però has oblidat multiplicar per la derivada de l'argument interior (k).", errorType: CHAIN_FORGOT, scope: 'family:cos' });
        pool.push({ tex: _trigTerm(k, 'cos', arg),  feedback: "Dos errors alhora: falta el signe negatiu i cos no s'ha convertit en sin. Recorda: (cos u)' = −sin(u)·u'.", errorType: SIN_COS_SWAP, scope: 'family:cos' });
        pool.push({ tex: `\\cos(${arg})`,           feedback: "Aquesta és la funció original, no la seva derivada.",                                                  errorType: NO_DERIVATIVE, scope: 'universal'  });
        if (Math.abs(k) > 1) {
            const den     = Math.abs(k);
            const intSign = k > 0 ? '' : '-';
            pool.push({ tex: `${intSign}\\frac{1}{${den}}\\sin(${arg})`, feedback: "Estàs calculant la primitiva (∫cos = sin/k), no la derivada (cos' = −k·sin).", errorType: INTEGRAL_CONFUSION, scope: 'family:cos' });
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
            tex:      `\\cos(${arg})`,
            feedback: "Has derivat sin a cos, però has oblidat multiplicar per la derivada de l'argument interior p'(x) = 2x+b.",
            errorType: CHAIN_FORGOT,
            scope:    'family:sin-poly2'
        });

        // SIN_COS_SWAP: (2x+b)·sin(p) → sin→sin
        pool.push({
            tex:      _polyCoefTrig(pDeriv, 'sin', arg),
            feedback: "Has multiplicat per p'(x), però la derivada de sin(u) és cos(u)·u', no sin(u)·u'. Sin i cos s'intercanvien.",
            errorType: SIN_COS_SWAP,
            scope:    'family:sin-poly2'
        });

        // CHAIN_SIGN: −(2x+b)·cos(p) → signe negatiu (confusió amb cos')
        pool.push({
            tex:      `-${_polyCoefTrig(pDeriv, 'cos', arg)}`,
            feedback: "La derivada de sin és +cos·p', no −cos·p'. El signe negatiu és de la derivada de cos, no de sin.",
            errorType: CHAIN_SIGN,
            scope:    'family:sin-poly2'
        });

        // NO_DERIVATIVE: sin(p)
        pool.push({
            tex:      `\\sin(${arg})`,
            feedback: "Aquesta és la funció original, no la seva derivada.",
            errorType: NO_DERIVATIVE,
            scope:    'universal'
        });

        // CHAIN_WRONG_COEF: 2x·cos(p) → oblidat el terme b de p'(x)
        if (b !== 0) {
            pool.push({
                tex:      `2x\\cos(${arg})`,
                feedback: "Has derivat x² correctament (→ 2x), però has oblidat la derivada del terme bx, que és b. La derivada completa de p(x) és 2x+b.",
                errorType: CHAIN_WRONG_COEF,
                scope:    'family:sin-poly2'
            });
        }

        // CHAIN_WRONG_COEF: 2·cos(p) → ha derivat 2x com a 2
        pool.push({
            tex:      `2\\cos(${arg})`,
            feedback: "La derivada de x² és 2x, no 2. No oblides la x quan derives una potència.",
            errorType: CHAIN_WRONG_COEF,
            scope:    'family:sin-poly2'
        });

        // SIN_COS_SWAP + CHAIN_SIGN: −(2x+b)·sin(p)
        pool.push({
            tex:      `-${_polyCoefTrig(pDeriv, 'sin', arg)}`,
            feedback: "Dos errors alhora: la derivada de sin és +cos (no −sin), i sin s'ha de convertir en cos.",
            errorType: SIN_COS_SWAP,
            scope:    'family:sin-poly2'
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
            tex:      _polyCoefTrig(pDeriv, 'sin', arg),
            feedback: "Has derivat cos a sin i has multiplicat per p'(x), però la derivada de cos porta signe negatiu: (cos u)' = −sin(u)·u'.",
            errorType: CHAIN_SIGN,
            scope:    'family:cos-poly2'
        });

        // SIN_COS_SWAP: −(2x+b)·cos(p) → signe correcte però fn incorrecta
        pool.push({
            tex:      `-${_polyCoefTrig(pDeriv, 'cos', arg)}`,
            feedback: "Has posat el signe negatiu, però la derivada de cos és −sin, no −cos. Sin i cos s'intercanvien.",
            errorType: SIN_COS_SWAP,
            scope:    'family:cos-poly2'
        });

        // CHAIN_FORGOT: −sin(p) → signe i fn correctes però oblidat p'
        pool.push({
            tex:      `-\\sin(${arg})`,
            feedback: "Has derivat cos a −sin, però has oblidat multiplicar per la derivada de l'argument interior p'(x) = 2x+b.",
            errorType: CHAIN_FORGOT,
            scope:    'family:cos-poly2'
        });

        // NO_DERIVATIVE: cos(p)
        pool.push({
            tex:      `\\cos(${arg})`,
            feedback: "Aquesta és la funció original, no la seva derivada.",
            errorType: NO_DERIVATIVE,
            scope:    'universal'
        });

        // CHAIN_WRONG_COEF: −2x·sin(p) → oblidat terme b de p'
        if (b !== 0) {
            pool.push({
                tex:      `-2x\\sin(${arg})`,
                feedback: "Has derivat x² correctament (→ 2x), però has oblidat la derivada del terme bx, que és b. La derivada completa de p(x) és 2x+b.",
                errorType: CHAIN_WRONG_COEF,
                scope:    'family:cos-poly2'
            });
        }

        // CHAIN_WRONG_COEF: −2·sin(p) → derivat 2x com a 2
        pool.push({
            tex:      `-2\\sin(${arg})`,
            feedback: "La derivada de x² és 2x, no 2. No oblides la x quan derives una potència.",
            errorType: CHAIN_WRONG_COEF,
            scope:    'family:cos-poly2'
        });

        // SIN_COS_SWAP + CHAIN_SIGN: (2x+b)·cos(p) → ni signe ni fn
        pool.push({
            tex:      _polyCoefTrig(pDeriv, 'cos', arg),
            feedback: "Dos errors alhora: falta el signe negatiu i cos no s'ha convertit en sin. Recorda: (cos u)' = −sin(u)·u'.",
            errorType: SIN_COS_SWAP,
            scope:    'family:cos-poly2'
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
            { tex: `${dg(kx)}`,              feedback: "Has oblidat aplicar la regla de la cadena.",                                errorType: CHAIN_FORGOT,       scope: 'universal'    },
            { tex: `${coef}${g(kx)}`,        feedback: "No és aquesta la derivada.",                                                errorType: NO_DERIVATIVE,      scope: 'universal'    },
            { tex: `${g(kx)}`,               feedback: "No has derivat.",                                                           errorType: NO_DERIVATIVE,      scope: 'universal'    },
            { tex: `${kInv}${dg(kx)}`,       feedback: "Quan has aplicat la regla de la cadena, t'has equivocat en un coeficient.", errorType: CHAIN_WRONG_COEF,   scope: 'linear-inner' },
            { tex: `${coef}x${dg(kx)}`,      feedback: "No has aplicat correctament la regla de la cadena.",                       errorType: CHAIN_WRONG_COEF,   scope: 'linear-inner' },
            { tex: `${dg(kx)} ${plusK}`,     feedback: "No apliques correctament la regla de la cadena, perquè no hi va una suma.", errorType: CHAIN_WRONG_COEF,   scope: 'linear-inner' },
            { tex: `${coef}${dg('x')}`,      feedback: "No has aplicat correctament la regla de la cadena.",                       errorType: CHAIN_FORGOT,       scope: 'linear-inner' },
            { tex: `${dg('x')} ${plusK}`,    feedback: "No apliques correctament la regla de la cadena, perquè no hi va una suma.", errorType: CHAIN_FORGOT,       scope: 'linear-inner' },
            { tex: `${dg('x')}`,             feedback: "No és aquesta la derivada.",                                                errorType: CHAIN_FORGOT,       scope: 'universal'    },
            { tex: `${dg(negKx)}`,           feedback: "Revisa els signes i recorda aplicar la regla de la cadena.",                errorType: CHAIN_SIGN,         scope: 'linear-inner' },
            { tex: `${negCoef}${dg(negKx)}`, feedback: "Hi ha algun error amb els signes.",                                        errorType: CHAIN_SIGN,         scope: 'linear-inner' },
            { tex: `${kInv}${intG(kx)}`,     feedback: "Incorrecte: recorda que estem derivant.",                                   errorType: INTEGRAL_CONFUSION, scope: 'family:exp'   },
            { tex: `${intG(kx)}`,            feedback: "Incorrecte: recorda que estem derivant.",                                   errorType: INTEGRAL_CONFUSION, scope: 'family:exp'   },
            { tex: `${dg(`${coef}(x-1)`)}`,  feedback: "Compte, aquesta funció no es deriva com si fos un polinomi.",              errorType: POWER_WRONG_EXP,    scope: 'family:exp'   },
        ];
    }

    // =========================================================================
    // POOL: potència x^n
    // =========================================================================
    function _buildPowerPool(n) {
        const fmt     = MathEngine.formatPowerTerm;
        const correct = fmt(n, n - 1);
        const pool    = [];
        const forgotR = fmt(1, n - 1);
        if (forgotR !== correct) pool.push({ tex: forgotR, feedback: "Has aplicat la regla de la potència però has oblidat baixar l'exponent com a coeficient.", errorType: POWER_FORGOT_R, scope: 'rule:power' });
        const wrongExp = fmt(n, n);
        if (wrongExp !== correct) pool.push({ tex: wrongExp, feedback: "El coeficient és correcte, però l'exponent ha de reduir-se en 1: n passa a n−1.", errorType: POWER_WRONG_EXP, scope: 'rule:power' });
        pool.push({ tex: fmt(1, n), feedback: "Aquesta és la funció original f(x), no la seva derivada f'(x).", errorType: NO_DERIVATIVE, scope: 'universal' });
        if (n + 1 !== 0) {
            const numExp = n + 1;
            const den    = n + 1;
            const xp     = numExp === 1 ? 'x' : `x^{${numExp}}`;
            const intTex = Math.abs(den) === 1 ? (den === 1 ? xp : `-${xp}`) : `\\frac{${xp}}{${den}}`;
            if (intTex !== correct) pool.push({ tex: intTex, feedback: "Estàs calculant la primitiva (integral), no la derivada.", errorType: INTEGRAL_CONFUSION, scope: 'rule:power' });
        }
        const overDeriv = fmt(n - 1, n - 2);
        if (overDeriv !== correct && !pool.find(d => d.tex === overDeriv)) pool.push({ tex: overDeriv, feedback: "Has derivat dues vegades. La regla de la potència s'aplica una sola vegada.", errorType: POWER_WRONG_EXP, scope: 'rule:power' });
        const plusExp = fmt(n + 1, n);
        if (plusExp !== correct && !pool.find(d => d.tex === plusExp)) pool.push({ tex: plusExp, feedback: "L'exponent ha de disminuir en 1, no augmentar.", errorType: POWER_WRONG_EXP, scope: 'rule:power' });
        return pool;
    }

    // =========================================================================
    // POOL: logaritmes
    // =========================================================================
    function _buildLogKxPool(k) {
        const argTex = k === 1 ? 'x' : `${k}x`;
        const kStr   = String(k);
        const pool   = [];
        if (k !== 1) pool.push({ tex: `\\frac{1}{${argTex}}`,   feedback: "Has derivat el logaritme però has oblidat multiplicar per la derivada de l'argument. La derivada de ln(kx) és (1/kx)·k = 1/x.", errorType: LOG_FORGOT_CHAIN, scope: 'family:log-kx' });
        if (k !== 1) pool.push({ tex: `\\frac{${kStr}}{x}`,     feedback: "Gairebé bé: has calculat (1/kx)·k però no has simplificat. k/(kx) = 1/x.", errorType: CHAIN_WRONG_COEF, scope: 'family:log-kx' });
        pool.push(              { tex: `\\ln(${argTex})`,        feedback: "Aquesta és la funció original, no la seva derivada.", errorType: NO_DERIVATIVE, scope: 'universal' });
        pool.push(              { tex: 'x',                      feedback: "La derivada de ln(x) és 1/x, no x. La fracció va al revés.", errorType: LOG_INVERTED, scope: 'family:log-kx' });
        if (k !== 1) pool.push({ tex: `${kStr}\\ln(${argTex})`, feedback: "La derivada de ln(u) és 1/u·u', no u'·ln(u). Has de derivar el logaritme.", errorType: NO_DERIVATIVE, scope: 'family:log-kx' });
        return pool;
    }
    function _buildLogXnPool(n) {
        const pool = [];
        pool.push({ tex: n===2?`\\frac{1}{x^2}`:`\\frac{1}{x^{${n}}}`,      feedback: "Has escrit 1/(argument) però has oblidat multiplicar per la derivada de l'argument interior.", errorType: LOG_FORGOT_CHAIN, scope: 'family:log-xn' });
        pool.push({ tex: n===2?`\\frac{${n}}{x^2}`:`\\frac{${n}}{x^{${n}}}`,feedback: "Gairebé bé: has calculat (1/x^n)·n però no has simplificat x^{n-1}/x^n = 1/x.", errorType: CHAIN_WRONG_COEF, scope: 'family:log-xn' });
        pool.push({ tex: n===2?`\\ln(x^2)`:`\\ln(x^{${n}})`,                 feedback: "Aquesta és la funció original, no la seva derivada.", errorType: NO_DERIVATIVE, scope: 'universal' });
        pool.push({ tex: n===2?`\\frac{x^2}{${n}}`:`\\frac{x^{${n}}}{${n}}`, feedback: "La derivada de ln(f) és f'/f, no f/f'. La fracció va al revés.", errorType: LOG_INVERTED, scope: 'family:log-xn' });
        pool.push({ tex: `${n}\\ln(x)`,  feedback: "Has usat la propietat ln(x^n) = n·ln(x), però ara hauries de derivar n·ln(x) per obtenir n/x.", errorType: NO_DERIVATIVE, scope: 'family:log-xn' });
        const derPow = n===2?`${n}x`:`${n}x^{${n-1}}`;
        pool.push({ tex: derPow, feedback: "Has derivat x^n com si fos una potència sola, però aquí és l'argument d'un logaritme.", errorType: POWER_WRONG_EXP, scope: 'family:log-xn' });
        return pool;
    }
    function _buildLogLinearPool(a, b) {
        const arg  = _fmtLinear(a, b);
        const aStr = _fmtConst(a);
        const pool = [];
        pool.push({ tex: `\\frac{1}{${arg}}`,          feedback: "Has oblidat multiplicar per la derivada de l'argument interior.", errorType: LOG_FORGOT_CHAIN, scope: 'family:log-linear' });
        if (a !== 1) pool.push({ tex: `\\frac{${arg}}{${aStr}}`, feedback: "La derivada de ln(f) és f'/f, no f/f'.", errorType: LOG_INVERTED, scope: 'family:log-linear' });
        pool.push({ tex: `\\ln(${arg})`,               feedback: "Aquesta és la funció original f(x), no la seva derivada f'(x).", errorType: NO_DERIVATIVE, scope: 'universal' });
        pool.push({ tex: `\\frac{${aStr}}{(${arg})^2}`,feedback: "El denominador ha de ser (ax+b), no (ax+b)².", errorType: CHAIN_WRONG_COEF, scope: 'family:log-linear' });
        if (a !== 1) pool.push({ tex: `${aStr}\\ln(${arg})`, feedback: "La derivada de ln(u) és 1/u, no ln(u).", errorType: NO_DERIVATIVE, scope: 'family:log-linear' });
        if (a > 0) pool.push({ tex: `\\frac{-${aStr}}{${arg}}`, feedback: "El signe és incorrecte.", errorType: CHAIN_SIGN, scope: 'family:log-linear' });
        return pool;
    }
    function _buildLogPoly2Pool(b, c) {
        const arg      = _fmtPoly2(b, c);
        const argDeriv = _fmtPoly2Deriv(b);
        const pool     = [];
        pool.push({ tex: `\\frac{1}{${arg}}`,                    feedback: "Has escrit 1/(argument) però has oblidat multiplicar per la derivada de l'argument interior, que és (2x+b).", errorType: LOG_FORGOT_CHAIN, scope: 'family:log-poly2' });
        pool.push({ tex: `\\frac{${argDeriv}}{(${arg})^2}`,      feedback: "El denominador ha de ser (x²+bx+c), no el seu quadrat.", errorType: CHAIN_WRONG_COEF, scope: 'family:log-poly2' });
        pool.push({ tex: `\\frac{${arg}}{${argDeriv}}`,          feedback: "La derivada de ln(f) és f'/f, no f/f'.", errorType: LOG_INVERTED, scope: 'family:log-poly2' });
        pool.push({ tex: `\\ln(${arg})`,                         feedback: "Aquesta és la funció original f(x), no la seva derivada f'(x).", errorType: NO_DERIVATIVE, scope: 'universal' });
        if (b !== 0) pool.push({ tex: `\\frac{2x}{${arg}}`, feedback: "Has derivat x² correctament (→ 2x), però has oblidat la derivada del terme bx, que és b.", errorType: CHAIN_WRONG_COEF, scope: 'family:log-poly2' });
        pool.push({ tex: `\\frac{2}{${arg}}`, feedback: "La derivada de x² és 2x, no 2. No oblides la x quan derives una potència.", errorType: CHAIN_WRONG_COEF, scope: 'family:log-poly2' });
        return pool;
    }

    // =========================================================================
    // POOL: producte i quocient
    // =========================================================================
    function _mul(a, b) {
        if (a === '0' || b === '0') return '0';
        if (a === '1')  return b;
        if (a === '-1') return b.startsWith('-') ? b.slice(1) : `-${b}`;
        if (b.startsWith('-')) return `-${_mul(a, b.slice(1))}`;
        if (b.startsWith('\\frac')) return `${a}\\cdot ${b}`;
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
        const forgotSumTex = _mul(dfTex, dgTex);
        if (forgotSumTex !== pair.solutionTex) pool.push({ tex: forgotSumTex, feedback: "Has multiplicat les derivades de f i g, però la regla del producte diu (fg)' = f'g + fg', no f'·g'.", errorType: PRODUCT_FORGOT_SUM, scope: 'rule:product' });
        const wrongOrderTex = _sub(dfgTex, fdgTex);
        if (wrongOrderTex !== pair.solutionTex) pool.push({ tex: wrongOrderTex, feedback: "Has fet f'g − fg' en lloc de f'g + fg'. La resta és la regla del quocient, no la del producte.", errorType: PRODUCT_WRONG_ORDER, scope: 'rule:product' });
        pool.push({ tex: promptTex, feedback: "Aquesta és la funció original f(x)·g(x), no la seva derivada.", errorType: NO_DERIVATIVE, scope: 'universal' });
        if (dfgTex !== pair.solutionTex && dfgTex !== promptTex) pool.push({ tex: dfgTex, feedback: "Has calculat f'·g però has oblidat el segon terme: + f·g'.", errorType: PRODUCT_FORGOT_SUM, scope: 'rule:product' });
        if (fdgTex !== pair.solutionTex && fdgTex !== promptTex && fdgTex !== dfgTex) pool.push({ tex: fdgTex, feedback: "Has calculat f·g' però has oblidat el primer terme: f'·g + ...", errorType: PRODUCT_FORGOT_SUM, scope: 'rule:product' });
        return pool;
    }
    function _buildQuotientPool(pair) {
        const { fTex, gTex, dfTex, dgTex, dfgTex, fdgTex, g2Tex, promptTex } = pair;
        const numerator = _sub(dfgTex, fdgTex);
        const pool = [];
        const signErrTex = _frac(_add(dfgTex, fdgTex), g2Tex);
        if (signErrTex !== pair.solutionTex) pool.push({ tex: signErrTex, feedback: "Al numerador has sumat (+) en lloc de restar (−). Recorda: (f/g)' = (f'g − fg')/g².", errorType: QUOTIENT_SIGN, scope: 'rule:quotient' });
        const denomErrTex = _frac(numerator, gTex);
        if (denomErrTex !== pair.solutionTex) pool.push({ tex: denomErrTex, feedback: "Has oblidat elevar el denominador al quadrat.", errorType: QUOTIENT_DENOM, scope: 'rule:quotient' });
        pool.push({ tex: promptTex, feedback: "Aquesta és la funció original f(x)/g(x), no la seva derivada.", errorType: NO_DERIVATIVE, scope: 'universal' });
        const invertedTex = _frac(_sub(fdgTex, dfgTex), g2Tex);
        if (invertedTex !== pair.solutionTex) pool.push({ tex: invertedTex, feedback: "Has invertit l'ordre del numerador. Ha de ser f'g − fg', no fg' − f'g.", errorType: QUOTIENT_SIGN, scope: 'rule:quotient' });
        const noDenomTex = numerator;
        if (noDenomTex !== pair.solutionTex) pool.push({ tex: noDenomTex, feedback: "Has calculat el numerador correctament però has oblidat dividir per g².", errorType: QUOTIENT_DENOM, scope: 'rule:quotient' });
        return pool;
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================
    function build(kVars, fns, scopeFilter) {
        const pool = _buildChainPool(kVars, fns);
        if (!scopeFilter || scopeFilter.length === 0) return pool;
        return pool.filter(d => scopeFilter.includes(d.scope));
    }
    function buildPower(n)       { return _buildPowerPool(n); }
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

    return { build, buildPower, buildLog, buildTrig, buildProduct, buildQuotient, FeedbackHints };

})();
