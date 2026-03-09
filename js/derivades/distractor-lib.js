/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/distractor-lib.js
 * ROL: Taxonomia d'errors pedagògics i generador de distractors per família.
 * ARQUITECTURA:
 * - Cada distractor porta: { tex, feedback, errorType, scope }
 * - Scopes disponibles:
 *     'universal'          → qualsevol família
 *     'linear-inner'       → quan h(x) = kx
 *     'family:exp'         → g(x) = e^x
 *     'family:log-kx'      → ln(kx) específic
 *     'family:log-xn'      → ln(x^n) específic
 *     'family:log-linear'  → ln(ax+b) específic
 *     'family:log-poly2'   → ln(x²+bx+c) específic
 *     'rule:power'         → regla de la potència
 *     'rule:product'       → regla del producte (futura)
 *     'rule:quotient'      → regla del quocient (futura)
 * - API pública:
 *     build(kVars, fns, scopeFilter) → cadena
 *     buildPower(n)                  → potència
 *     buildLog(type, params)         → logaritme
 *       type: 'kx' | 'xn' | 'linear' | 'poly2'
 *     FeedbackHints                  → taula de consells per errorType
 * DEPENDÈNCIES: Requereix math-engine.js.
 * ============================================================================
 */

window.DistractorLib = (() => {

    // =========================================================================
    // TAXONOMIA D'errorType
    // =========================================================================
    const CHAIN_FORGOT       = 'CHAIN_FORGOT';
    const CHAIN_WRONG_COEF   = 'CHAIN_WRONG_COEF';
    const CHAIN_SIGN         = 'CHAIN_SIGN';
    const NO_DERIVATIVE      = 'NO_DERIVATIVE';
    const INTEGRAL_CONFUSION = 'INTEGRAL_CONFUSION';
    const PRODUCT_FORGOT_SUM  = 'PRODUCT_FORGOT_SUM';
    const PRODUCT_WRONG_ORDER = 'PRODUCT_WRONG_ORDER';
    const QUOTIENT_SIGN  = 'QUOTIENT_SIGN';
    const QUOTIENT_DENOM = 'QUOTIENT_DENOM';
    const POWER_FORGOT_R  = 'POWER_FORGOT_R';
    const POWER_WRONG_EXP = 'POWER_WRONG_EXP';
    const LOG_INVERTED     = 'LOG_INVERTED';
    const LOG_FORGOT_CHAIN = 'LOG_FORGOT_CHAIN';

    // =========================================================================
    // HINTS AMPLIATS PER errorType
    // =========================================================================
    const FeedbackHints = {
        [CHAIN_FORGOT]:       "Recorda: si tens f(g(x)), la derivada és f'(g(x)) · g'(x). Has de multiplicar per la derivada de l'argument interior.",
        [CHAIN_WRONG_COEF]:   "Has aplicat la regla de la cadena, però el coeficient que surt de derivar l'argument interior no és correcte.",
        [CHAIN_SIGN]:         "Comprova el signe del coeficient de l'argument interior. Si k és negatiu, el signe canvia.",
        [NO_DERIVATIVE]:      "Aquesta és la funció original, no la seva derivada. Recorda que has de derivar.",
        [INTEGRAL_CONFUSION]: "Estàs calculant una primitiva (integral) en lloc d'una derivada. Atenció al signe de l'operació.",
        [PRODUCT_FORGOT_SUM]: "La regla del producte diu (fg)' = f'g + fg'. Necessites la suma de dos termes, no el producte de les derivades.",
        [PRODUCT_WRONG_ORDER]:"Comprova l'ordre dels termes. Pots estar confonen la regla del producte amb la del quocient.",
        [QUOTIENT_SIGN]:      "Al numerador de la regla del quocient, l'ordre és f'g − fg'. Revisa quin terme va primer.",
        [QUOTIENT_DENOM]:     "El denominador de la regla del quocient és g², no g. No oblides elevar al quadrat.",
        [POWER_FORGOT_R]:     "La regla de la potència diu (x^n)' = n·x^{n−1}. L'exponent n baixa i es posa com a coeficient davant.",
        [POWER_WRONG_EXP]:    "L'exponent ha de ser n−1, no n. Quan l'exponent baixa, es redueix en 1.",
        [LOG_INVERTED]:       "La derivada de ln(f(x)) és f'(x)/f(x). Comprova que la fracció no la tens girada.",
        [LOG_FORGOT_CHAIN]:   "Has derivat el logaritme però has oblidat multiplicar per la derivada de l'argument interior: (ln f)' = f'/f.",
    };

    // =========================================================================
    // AUXILIAR: formata un polinomi ax+b com a string LaTeX
    // =========================================================================

    /** Formata ax+b per a l'interior de ln(). Gestiona a=±1, b=0. */
    function _fmtLinear(a, b) {
        const aPart = a ===  1 ? 'x'
                    : a === -1 ? '-x'
                    : `${a}x`;
        if (b === 0) return aPart;
        const bPart = b > 0 ? `+${b}` : `${b}`;
        return `${aPart}${bPart}`;
    }

    /** Formata x²+bx+c per a l'interior de ln(). Gestiona b=0, c=0. */
    function _fmtPoly2(b, c) {
        let s = 'x^2';
        if (b !== 0) s += b > 0 ? `+${b}x` : `${b}x`;
        if (c !== 0) s += c > 0 ? `+${c}` : `${c}`;
        return s;
    }

    /** Formata la derivada d'un polinomi ax+b: retorna 'a' (string net per a TeX). */
    function _fmtConst(a) {
        if (a ===  1) return '1';
        if (a === -1) return '-1';
        return String(a);
    }

    /** Formata la derivada de x²+bx+c: retorna '2x+b' com a string LaTeX. */
    function _fmtPoly2Deriv(b) {
        if (b === 0)  return '2x';
        if (b === 1)  return '2x+1';
        if (b === -1) return '2x-1';
        return b > 0 ? `2x+${b}` : `2x${b}`;
    }

    // =========================================================================
    // POOL: regla de la cadena g(kx)
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
    // POOL: regla de la potència x^n
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
    // POOL: ln(kx)
    // =========================================================================
    function _buildLogKxPool(k) {
        const argTex = k === 1 ? 'x' : `${k}x`;
        const kStr   = String(k);
        const pool   = [];

        if (k !== 1) pool.push({ tex: `\\frac{1}{${argTex}}`,    feedback: "Has derivat el logaritme però has oblidat multiplicar per la derivada de l'argument. La derivada de ln(kx) és (1/kx)·k = 1/x.", errorType: LOG_FORGOT_CHAIN, scope: 'family:log-kx' });
        if (k !== 1) pool.push({ tex: `\\frac{${kStr}}{x}`,      feedback: "Gairebé bé: has calculat (1/kx)·k però no has simplificat. k/(kx) = 1/x.",                                                    errorType: CHAIN_WRONG_COEF, scope: 'family:log-kx' });
        pool.push({              tex: `\\ln(${argTex})`,          feedback: "Aquesta és la funció original, no la seva derivada.",                                                                           errorType: NO_DERIVATIVE,    scope: 'universal'     });
        pool.push({              tex: 'x',                        feedback: "La derivada de ln(x) és 1/x, no x. La fracció va al revés.",                                                                   errorType: LOG_INVERTED,     scope: 'family:log-kx' });
        if (k !== 1) pool.push({ tex: `${kStr}\\ln(${argTex})`,  feedback: "La derivada de ln(u) és 1/u·u', no u'·ln(u). Has de derivar el logaritme.",                                                    errorType: NO_DERIVATIVE,    scope: 'family:log-kx' });

        return pool;
    }

    // =========================================================================
    // POOL: ln(x^n)
    // =========================================================================
    function _buildLogXnPool(n) {
        const pool = [];
        pool.push({ tex: n === 2 ? `\\frac{1}{x^2}`     : `\\frac{1}{x^{${n}}}`,   feedback: "Has escrit 1/(argument) però has oblidat multiplicar per la derivada de l'argument interior.",       errorType: LOG_FORGOT_CHAIN, scope: 'family:log-xn' });
        pool.push({ tex: n === 2 ? `\\frac{${n}}{x^2}`  : `\\frac{${n}}{x^{${n}}}`,feedback: "Gairebé bé: has calculat (1/x^n)·n però no has simplificat x^{n-1}/x^n = 1/x.",                     errorType: CHAIN_WRONG_COEF, scope: 'family:log-xn' });
        pool.push({ tex: n === 2 ? `\\ln(x^2)`          : `\\ln(x^{${n}})`,         feedback: "Aquesta és la funció original, no la seva derivada.",                                                 errorType: NO_DERIVATIVE,    scope: 'universal'     });
        pool.push({ tex: n === 2 ? `\\frac{x^2}{${n}}`  : `\\frac{x^{${n}}}{${n}}`, feedback: "La derivada de ln(f) és f'/f, no f/f'. La fracció va al revés.",                                      errorType: LOG_INVERTED,     scope: 'family:log-xn' });
        pool.push({ tex: `${n}\\ln(x)`,                                              feedback: "Has usat la propietat ln(x^n) = n·ln(x), però ara hauries de derivar n·ln(x) per obtenir n/x.",     errorType: NO_DERIVATIVE,    scope: 'family:log-xn' });
        const derPow = n === 2 ? `${n}x` : `${n}x^{${n-1}}`;
        pool.push({ tex: derPow,                                                      feedback: "Has derivat x^n com si fos una potència sola, però aquí és l'argument d'un logaritme.",              errorType: POWER_WRONG_EXP,  scope: 'family:log-xn' });
        return pool;
    }

    // =========================================================================
    // POOL: ln(ax+b) — derivada a/(ax+b)
    // =========================================================================

    /**
     * Errors típics per a ln(ax+b):
     *   LOG_FORGOT_CHAIN: 1/(ax+b)       → ha oblidat la a del numerador
     *   CHAIN_WRONG_COEF: a/(ax+b)²      → ha elevat el denominador al quadrat (confusió amb quocient)
     *   LOG_INVERTED:     (ax+b)/a        → ha invertit la fracció
     *   NO_DERIVATIVE:    ln(ax+b)        → no ha derivat
     *   CHAIN_WRONG_COEF: 1/(a)           → ha derivat com si fos 1/argument sense la x
     *   CHAIN_SIGN:       -a/(ax+b)       → error de signe (quan a < 0 és error comú)
     */
    function _buildLogLinearPool(a, b) {
        const arg    = _fmtLinear(a, b);
        const aStr   = _fmtConst(a);
        const pool   = [];

        // LOG_FORGOT_CHAIN: 1/(ax+b) → oblidat la a al numerador
        pool.push({
            tex:      `\\frac{1}{${arg}}`,
            feedback: "Has oblidat multiplicar per la derivada de l'argument interior. La derivada de ln(ax+b) és a/(ax+b), no 1/(ax+b).",
            errorType: LOG_FORGOT_CHAIN,
            scope:    'family:log-linear'
        });

        // LOG_INVERTED: (ax+b)/a → fracció girada
        if (a !== 1) {
            pool.push({
                tex:      `\\frac{${arg}}{${aStr}}`,
                feedback: "La derivada de ln(f) és f'/f, no f/f'. La fracció va al revés: numerador f', denominador f.",
                errorType: LOG_INVERTED,
                scope:    'family:log-linear'
            });
        }

        // NO_DERIVATIVE: ln(ax+b) → no ha derivat
        pool.push({
            tex:      `\\ln(${arg})`,
            feedback: "Aquesta és la funció original f(x), no la seva derivada f'(x).",
            errorType: NO_DERIVATIVE,
            scope:    'universal'
        });

        // CHAIN_WRONG_COEF: a/(ax+b)² → confusió amb la regla del quocient
        pool.push({
            tex:      `\\frac{${aStr}}{(${arg})^2}`,
            feedback: "El denominador ha de ser (ax+b), no (ax+b)². Elevar al quadrat és la regla del quocient, no la del logaritme.",
            errorType: CHAIN_WRONG_COEF,
            scope:    'family:log-linear'
        });

        // NO_DERIVATIVE: a·ln(ax+b) → ha multiplicat per a però no ha derivat ln
        if (a !== 1) {
            pool.push({
                tex:      `${aStr}\\ln(${arg})`,
                feedback: "Has multiplicat per la derivada de l'argument però no has derivat el logaritme en si. La derivada de ln(u) és 1/u, no ln(u).",
                errorType: NO_DERIVATIVE,
                scope:    'family:log-linear'
            });
        }

        // CHAIN_SIGN: -a/(ax+b) → error de signe
        if (a > 0) {
            pool.push({
                tex:      `\\frac{-${aStr}}{${arg}}`,
                feedback: "El signe és incorrecte. La derivada de ln(ax+b) amb a > 0 és positiva.",
                errorType: CHAIN_SIGN,
                scope:    'family:log-linear'
            });
        }

        return pool;
    }

    // =========================================================================
    // POOL: ln(x²+bx+c) — derivada (2x+b)/(x²+bx+c)
    // =========================================================================

    /**
     * Errors típics per a ln(x²+bx+c):
     *   LOG_FORGOT_CHAIN: 1/(x²+bx+c)         → oblidat derivar l'argument
     *   CHAIN_WRONG_COEF: (2x+b)/(x²+bx+c)²   → denominador al quadrat
     *   LOG_INVERTED:     (x²+bx+c)/(2x+b)     → fracció girada
     *   NO_DERIVATIVE:    ln(x²+bx+c)           → no ha derivat
     *   CHAIN_WRONG_COEF: 2x/(x²+bx+c)         → ha oblidat el terme b de la derivada
     *   CHAIN_WRONG_COEF: 2/(x²+bx+c)          → ha derivat 2x com si fos 2 (constant)
     */
    function _buildLogPoly2Pool(b, c) {
        const arg      = _fmtPoly2(b, c);
        const argDeriv = _fmtPoly2Deriv(b);
        const pool     = [];

        // LOG_FORGOT_CHAIN: 1/(x²+bx+c)
        pool.push({
            tex:      `\\frac{1}{${arg}}`,
            feedback: "Has escrit 1/(argument) però has oblidat multiplicar per la derivada de l'argument interior, que és (2x+b).",
            errorType: LOG_FORGOT_CHAIN,
            scope:    'family:log-poly2'
        });

        // CHAIN_WRONG_COEF: (2x+b)/(x²+bx+c)² → denominador al quadrat
        pool.push({
            tex:      `\\frac{${argDeriv}}{(${arg})^2}`,
            feedback: "El denominador ha de ser (x²+bx+c), no el seu quadrat. Elevar al quadrat correspon a la regla del quocient, no a la del logaritme.",
            errorType: CHAIN_WRONG_COEF,
            scope:    'family:log-poly2'
        });

        // LOG_INVERTED: (x²+bx+c)/(2x+b)
        pool.push({
            tex:      `\\frac{${arg}}{${argDeriv}}`,
            feedback: "La derivada de ln(f) és f'/f, no f/f'. Al numerador hi va f'(x) i al denominador f(x).",
            errorType: LOG_INVERTED,
            scope:    'family:log-poly2'
        });

        // NO_DERIVATIVE: ln(x²+bx+c)
        pool.push({
            tex:      `\\ln(${arg})`,
            feedback: "Aquesta és la funció original f(x), no la seva derivada f'(x).",
            errorType: NO_DERIVATIVE,
            scope:    'universal'
        });

        // CHAIN_WRONG_COEF: 2x/(x²+bx+c) → ha oblidat el terme b de la derivada del polinomi
        if (b !== 0) {
            pool.push({
                tex:      `\\frac{2x}{${arg}}`,
                feedback: "Has derivat x² correctament (→ 2x), però has oblidat la derivada del terme bx, que és b.",
                errorType: CHAIN_WRONG_COEF,
                scope:    'family:log-poly2'
            });
        }

        // CHAIN_WRONG_COEF: 2/(x²+bx+c) → ha derivat 2x com a constant 2
        pool.push({
            tex:      `\\frac{2}{${arg}}`,
            feedback: "La derivada de x² és 2x, no 2. No oblides la x quan derives una potència.",
            errorType: CHAIN_WRONG_COEF,
            scope:    'family:log-poly2'
        });

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

    function buildPower(n) {
        return _buildPowerPool(n);
    }

    /**
     * Genera el pool de distractors per al logaritme.
     * @param {'kx'|'xn'|'linear'|'poly2'} type
     * @param {object} params
     *   'kx':     { k }
     *   'xn':     { n }
     *   'linear': { a, b }    → ln(ax+b)
     *   'poly2':  { b, c }    → ln(x²+bx+c)
     */
    function buildLog(type, params) {
        if (type === 'kx')     return _buildLogKxPool(params.k);
        if (type === 'xn')     return _buildLogXnPool(params.n);
        if (type === 'linear') return _buildLogLinearPool(params.a, params.b);
        if (type === 'poly2')  return _buildLogPoly2Pool(params.b, params.c);
        return [];
    }

    return { build, buildPower, buildLog, FeedbackHints };

})();
