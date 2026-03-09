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
 *            'rule:product'  → vàlid per a la regla del producte
 *            'rule:quotient' → vàlid per a la regla del quocient
 * - La funció DistractorLib.build(kVars, fns, scopeFilter) genera el pool
 *   complet i el filtra pel scope demanat per cada generador de família.
 *   Això garanteix que cap distractor que pressuposi dg=g (propietat
 *   exclusiva d'e^x) aparegui en exercicis de sinus o logaritme.
 * - Inclou FeedbackHints: taula de consells ampliats per errorType,
 *   preparada per a la Fase 4 (feedback diferencial per a l'alumne).
 * DEPENDÈNCIES: Requereix math-engine.js. S'ha de carregar DESPRÉS de
 * math-engine.js i ABANS de banc-preguntes.js.
 * ============================================================================
 */

window.DistractorLib = (() => {

    // =========================================================================
    // TAXONOMIA D'errorType (referència completa del projecte)
    // =========================================================================
    // Regla de la cadena
    const CHAIN_FORGOT      = 'CHAIN_FORGOT';       // ha oblidat multiplicar per h'(x)
    const CHAIN_WRONG_COEF  = 'CHAIN_WRONG_COEF';   // coeficient incorrecte de la cadena
    const CHAIN_SIGN        = 'CHAIN_SIGN';          // error de signe en el coeficient
    const NO_DERIVATIVE     = 'NO_DERIVATIVE';       // ha escrit la funció original sense derivar
    const INTEGRAL_CONFUSION= 'INTEGRAL_CONFUSION';  // ha fet una primitiva en lloc d'una derivada
    // Regla del producte
    const PRODUCT_FORGOT_SUM  = 'PRODUCT_FORGOT_SUM';  // ha fet f'·g' en lloc de f'g+fg'
    const PRODUCT_WRONG_ORDER = 'PRODUCT_WRONG_ORDER'; // ha fet f'g-fg' (confusió amb quocient)
    // Regla del quocient
    const QUOTIENT_SIGN  = 'QUOTIENT_SIGN';   // ha invertit el signe del numerador
    const QUOTIENT_DENOM = 'QUOTIENT_DENOM';  // ha oblidat elevar g al quadrat
    // Regla de la potència
    const POWER_FORGOT_R  = 'POWER_FORGOT_R';   // ha oblidat el coeficient r
    const POWER_WRONG_EXP = 'POWER_WRONG_EXP';  // ha escrit r en lloc de r-1 a l'exponent
    // Logaritme
    const LOG_INVERTED     = 'LOG_INVERTED';      // ha escrit f/f' en lloc de f'/f
    const LOG_FORGOT_CHAIN = 'LOG_FORGOT_CHAIN';  // ha escrit 1/x en lloc de f'/f

    // =========================================================================
    // HINTS AMPLIATS PER errorType (preparats per a la Fase 4)
    // Encara no s'usen: el controlador derivades.js els llegirà a la Fase 4.
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
        [POWER_FORGOT_R]:     "La regla de la potència diu (f^r)' = r·f^(r-1)·f'. Has de posar el coeficient r davant.",
        [POWER_WRONG_EXP]:    "L'exponent ha de ser r−1, no r. La potència baixa i l'exponent es redueix en 1.",
        [LOG_INVERTED]:       "La derivada de ln(f(x)) és f'(x)/f(x), no f(x)/f'(x). La fracció va al revés.",
        [LOG_FORGOT_CHAIN]:   "Has derivat ln(x) com si l'argument fos x, però l'argument és f(x). Has d'aplicar la regla de la cadena: f'(x)/f(x).",
    };

    // =========================================================================
    // GENERADOR DE DISTRACTORS PER A LA REGLA DE LA CADENA
    // =========================================================================

    /**
     * Construeix el pool complet de distractors per a g(h(x)) amb h(x)=kx.
     * Cada entrada porta: { tex, feedback, errorType, scope }
     * @param {object} kVars - Variables algebraiques: coef, negCoef, kx, negKx, plusK, kInv
     * @param {object} fns   - Funcions: g (original), dg (derivada), intG (integral)
     * @returns {Array}
     */
    function _buildChainPool(kVars, fns) {
        const { coef, negCoef, kx, negKx, plusK, kInv } = kVars;
        const { g, dg, intG } = fns;

        return [
            // --- ERRORS DE LA REGLA DE LA CADENA ---
            {
                tex:       `${dg(kx)}`,
                feedback:  "Has oblidat aplicar la regla de la cadena.",
                errorType: CHAIN_FORGOT,
                scope:     'universal'
            },
            {
                tex:       `${coef}${g(kx)}`,
                feedback:  "No és aquesta la derivada.",
                errorType: NO_DERIVATIVE,
                scope:     'universal'
            },
            {
                tex:       `${g(kx)}`,
                feedback:  "No has derivat.",
                errorType: NO_DERIVATIVE,
                scope:     'universal'
            },

            // --- ERRORS DE COEFICIENT DE LA CADENA ---
            {
                tex:       `${kInv}${dg(kx)}`,
                feedback:  "Quan has aplicat la regla de la cadena, t'has equivocat en un coeficient.",
                errorType: CHAIN_WRONG_COEF,
                scope:     'linear-inner'
            },
            {
                tex:       `${coef}x${dg(kx)}`,
                feedback:  "No has aplicat correctament la regla de la cadena.",
                errorType: CHAIN_WRONG_COEF,
                scope:     'linear-inner'
            },
            {
                tex:       `${dg(kx)} ${plusK}`,
                feedback:  "No apliques correctament la regla de la cadena, perquè no hi va una suma.",
                errorType: CHAIN_WRONG_COEF,
                scope:     'linear-inner'
            },
            {
                tex:       `${coef}${dg('x')}`,
                feedback:  "No has aplicat correctament la regla de la cadena.",
                errorType: CHAIN_FORGOT,
                scope:     'linear-inner'
            },
            {
                tex:       `${dg('x')} ${plusK}`,
                feedback:  "No apliques correctament la regla de la cadena, perquè no hi va una suma.",
                errorType: CHAIN_FORGOT,
                scope:     'linear-inner'
            },
            {
                tex:       `${dg('x')}`,
                feedback:  "No és aquesta la derivada.",
                errorType: CHAIN_FORGOT,
                scope:     'universal'
            },

            // --- ERRORS DE SIGNE ---
            {
                tex:       `${dg(negKx)}`,
                feedback:  "Revisa els signes que has escrit i, a més, recorda aplicar la regla de la cadena.",
                errorType: CHAIN_SIGN,
                scope:     'linear-inner'
            },
            {
                tex:       `${negCoef}${dg(negKx)}`,
                feedback:  "Hi ha algun error amb els signes.",
                errorType: CHAIN_SIGN,
                scope:     'linear-inner'
            },

            // --- ERRORS DE CONFUSIÓ AMB INTEGRALS (específics de e^x) ---
            // NOTA: intG pressuposa que la integral de g és una expressió amb g.
            // Això és cert per a e^x (∫e^x = e^x) però NO per a sin, cos, etc.
            // Per això scope='family:exp': el filtre els exclourà per a altres famílies.
            {
                tex:       `${kInv}${intG(kx)}`,
                feedback:  "Incorrecte: recorda que estem derivant.",
                errorType: INTEGRAL_CONFUSION,
                scope:     'family:exp'
            },
            {
                tex:       `${intG(kx)}`,
                feedback:  "Incorrecte: recorda que estem derivant.",
                errorType: INTEGRAL_CONFUSION,
                scope:     'family:exp'
            },

            // --- ERROR DE CONFUSIÓ AMB POTÈNCIA (específic de e^x) ---
            // Pressuposa que dg(coef(x-1)) té sentit visual per a la família.
            // Per a e^x: e^{k(x-1)} sembla "baixar l'exponent", que és un error creïble.
            // Per a sin o cos, el paral·lel no és intuïtiu, per tant scope='family:exp'.
            {
                tex:       `${dg(`${coef}(x-1)`)}`,
                feedback:  "Compte, aquesta funció no es deriva com si fos un polinomi.",
                errorType: POWER_WRONG_EXP,
                scope:     'family:exp'
            },
        ];
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================

    /**
     * Genera el pool de distractors filtrat per scope.
     * @param {object}   kVars       - Variables algebraiques (de math-engine.js)
     * @param {object}   fns         - Funcions g, dg, intG
     * @param {string[]} scopeFilter - Scopes acceptats, ex: ['universal','linear-inner','family:exp']
     * @returns {Array} distractors filtrats amb { tex, feedback, errorType, scope }
     */
    function build(kVars, fns, scopeFilter) {
        const pool = _buildChainPool(kVars, fns);
        if (!scopeFilter || scopeFilter.length === 0) return pool;
        return pool.filter(d => scopeFilter.includes(d.scope));
    }

    return { build, FeedbackHints };

})();
