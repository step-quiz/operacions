/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/distractor-lib.js
 * ROL: Taxonomia d'errors pedagògics i generador de distractors per família.
 * ARQUITECTURA:
 * - Centralitza tots els distractors del projecte en un sol lloc.
 * - Cada distractor porta TRES camps obligatoris:
 *     tex:       string LaTeX (el que veu l'alumne)
 *     feedback:  string     (el que llegeix quan s'equivoca)
 *     errorType: string     (etiqueta interna per a analítica futura)
 * - Cada distractor porta UN camp de rang de validesa:
 *     scope: 'universal'     → vàlid per a qualsevol família
 *            'linear-inner'  → vàlid quan h(x) = kx
 *            'family:exp'    → vàlid només per a g(x) = e^x
 *            'family:log'    → vàlid només per a g(x) = ln(x)
 *            'rule:power'    → vàlid per a la regla de la potència
 *            'rule:product'  → vàlid per a la regla del producte
 *            'rule:quotient' → vàlid per a la regla del quocient
 * - API pública:
 *     build(kVars, fns, scopeFilter) → distractors per a la regla de la cadena
 *     buildPower(n)                  → distractors per a la regla de la potència
 *     FeedbackHints                  → taula de consells ampliats per errorType
 * DEPENDÈNCIES: Requereix math-engine.js. S'ha de carregar DESPRÉS de
 * math-engine.js i ABANS de question-bank.js.
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
    // HINTS AMPLIATS PER errorType (Fase 4)
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
        [LOG_INVERTED]:       "La derivada de ln(f(x)) és f'(x)/f(x), no f(x)/f'(x). La fracció va al revés.",
        [LOG_FORGOT_CHAIN]:   "Has derivat ln(x) com si l'argument fos x, però l'argument és f(x). Has d'aplicar la regla de la cadena: f'(x)/f(x).",
    };

    // =========================================================================
    // POOL PER A LA REGLA DE LA CADENA: g(kx)
    // =========================================================================

    function _buildChainPool(kVars, fns) {
        const { coef, negCoef, kx, negKx, plusK, kInv } = kVars;
        const { g, dg, intG } = fns;

        return [
            // --- ERRORS DE LA REGLA DE LA CADENA ---
            {
                tex: `${dg(kx)}`,
                feedback: "Has oblidat aplicar la regla de la cadena.",
                errorType: CHAIN_FORGOT,
                scope: 'universal'
            },
            {
                tex: `${coef}${g(kx)}`,
                feedback: "No és aquesta la derivada.",
                errorType: NO_DERIVATIVE,
                scope: 'universal'
            },
            {
                tex: `${g(kx)}`,
                feedback: "No has derivat.",
                errorType: NO_DERIVATIVE,
                scope: 'universal'
            },

            // --- ERRORS DE COEFICIENT ---
            {
                tex: `${kInv}${dg(kx)}`,
                feedback: "Quan has aplicat la regla de la cadena, t'has equivocat en un coeficient.",
                errorType: CHAIN_WRONG_COEF,
                scope: 'linear-inner'
            },
            {
                tex: `${coef}x${dg(kx)}`,
                feedback: "No has aplicat correctament la regla de la cadena.",
                errorType: CHAIN_WRONG_COEF,
                scope: 'linear-inner'
            },
            {
                tex: `${dg(kx)} ${plusK}`,
                feedback: "No apliques correctament la regla de la cadena, perquè no hi va una suma.",
                errorType: CHAIN_WRONG_COEF,
                scope: 'linear-inner'
            },
            {
                tex: `${coef}${dg('x')}`,
                feedback: "No has aplicat correctament la regla de la cadena.",
                errorType: CHAIN_FORGOT,
                scope: 'linear-inner'
            },
            {
                tex: `${dg('x')} ${plusK}`,
                feedback: "No apliques correctament la regla de la cadena, perquè no hi va una suma.",
                errorType: CHAIN_FORGOT,
                scope: 'linear-inner'
            },
            {
                tex: `${dg('x')}`,
                feedback: "No és aquesta la derivada.",
                errorType: CHAIN_FORGOT,
                scope: 'universal'
            },

            // --- ERRORS DE SIGNE ---
            {
                tex: `${dg(negKx)}`,
                feedback: "Revisa els signes que has escrit i, a més, recorda aplicar la regla de la cadena.",
                errorType: CHAIN_SIGN,
                scope: 'linear-inner'
            },
            {
                tex: `${negCoef}${dg(negKx)}`,
                feedback: "Hi ha algun error amb els signes.",
                errorType: CHAIN_SIGN,
                scope: 'linear-inner'
            },

            // --- ERRORS DE CONFUSIÓ AMB INTEGRALS (específics de e^x) ---
            {
                tex: `${kInv}${intG(kx)}`,
                feedback: "Incorrecte: recorda que estem derivant.",
                errorType: INTEGRAL_CONFUSION,
                scope: 'family:exp'
            },
            {
                tex: `${intG(kx)}`,
                feedback: "Incorrecte: recorda que estem derivant.",
                errorType: INTEGRAL_CONFUSION,
                scope: 'family:exp'
            },

            // --- ERROR DE CONFUSIÓ AMB POTÈNCIA (específic de e^x) ---
            {
                tex: `${dg(`${coef}(x-1)`)}`,
                feedback: "Compte, aquesta funció no es deriva com si fos un polinomi.",
                errorType: POWER_WRONG_EXP,
                scope: 'family:exp'
            },
        ];
    }

    // =========================================================================
    // POOL PER A LA REGLA DE LA POTÈNCIA: x^n
    // =========================================================================

    /**
     * Genera el pool de distractors per a f(x) = x^n.
     * Usa MathEngine.formatPowerTerm per a tots els strings LaTeX.
     * @param {number} n - L'exponent (enter, ≠ 0, ≠ 1)
     */
    function _buildPowerPool(n) {
        const fmt     = MathEngine.formatPowerTerm;
        const correct = fmt(n, n - 1);
        const pool    = [];

        // POWER_FORGOT_R: x^{n-1} (ha oblidat baixar el coeficient)
        const forgotR = fmt(1, n - 1);
        if (forgotR !== correct) {
            pool.push({
                tex:       forgotR,
                feedback:  "Has aplicat la regla de la potència però has oblidat baixar l'exponent com a coeficient.",
                errorType: POWER_FORGOT_R,
                scope:     'rule:power'
            });
        }

        // POWER_WRONG_EXP: n·x^n (ha oblidat reduir l'exponent)
        const wrongExp = fmt(n, n);
        if (wrongExp !== correct) {
            pool.push({
                tex:       wrongExp,
                feedback:  "El coeficient és correcte, però l'exponent ha de reduir-se en 1: n passa a n−1.",
                errorType: POWER_WRONG_EXP,
                scope:     'rule:power'
            });
        }

        // NO_DERIVATIVE: x^n (no ha derivat)
        pool.push({
            tex:       fmt(1, n),
            feedback:  "Aquesta és la funció original f(x), no la seva derivada f'(x).",
            errorType: NO_DERIVATIVE,
            scope:     'universal'
        });

        // INTEGRAL_CONFUSION: x^{n+1}/(n+1) (ha integrat en lloc de derivar)
        // Excloem n=-1 perquè la integral és ln|x|, no x^0/0
        if (n + 1 !== 0) {
            const numExp = n + 1;
            const den    = n + 1;
            const xp     = numExp === 1 ? 'x' : `x^{${numExp}}`;
            let intTex;
            if (Math.abs(den) === 1) {
                intTex = den === 1 ? xp : `-${xp}`;
            } else {
                intTex = `\\frac{${xp}}{${den}}`;
            }
            if (intTex !== correct) {
                pool.push({
                    tex:       intTex,
                    feedback:  "Estàs calculant la primitiva (integral), no la derivada. Per derivar x^n: l'exponent baixa i es posa davant.",
                    errorType: INTEGRAL_CONFUSION,
                    scope:     'rule:power'
                });
            }
        }

        // POWER_WRONG_EXP variant: (n-1)·x^{n-2} (ha aplicat la regla dues vegades)
        const overDeriv = fmt(n - 1, n - 2);
        if (overDeriv !== correct && !pool.find(d => d.tex === overDeriv)) {
            pool.push({
                tex:       overDeriv,
                feedback:  "Has derivat dues vegades. La regla de la potència s'aplica una sola vegada.",
                errorType: POWER_WRONG_EXP,
                scope:     'rule:power'
            });
        }

        // POWER_WRONG_EXP variant 2: (n+1)·x^n (ha sumat en lloc de restar a l'exponent)
        const plusExp = fmt(n + 1, n);
        if (plusExp !== correct && !pool.find(d => d.tex === plusExp)) {
            pool.push({
                tex:       plusExp,
                feedback:  "L'exponent ha de disminuir en 1, no augmentar. Per derivar: l'exponent baixa.",
                errorType: POWER_WRONG_EXP,
                scope:     'rule:power'
            });
        }

        return pool;
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================

    /**
     * Genera el pool de distractors per a la regla de la cadena, filtrat per scope.
     */
    function build(kVars, fns, scopeFilter) {
        const pool = _buildChainPool(kVars, fns);
        if (!scopeFilter || scopeFilter.length === 0) return pool;
        return pool.filter(d => scopeFilter.includes(d.scope));
    }

    /**
     * Genera el pool de distractors per a la regla de la potència f(x)=x^n.
     * No necessita filtre de scope: tots els distractors ja són específics de la potència.
     */
    function buildPower(n) {
        return _buildPowerPool(n);
    }

    return { build, buildPower, FeedbackHints };

})();
