/**
 * ============================================================================
 * PROJECTE: Motor Educatiu de Derivades (Vanilla JS)
 * FITXER: js/derivades/strings.js
 * ROL: Font única de TOTS els textos visibles per l'alumne.
 *
 * COM EDITAR AQUEST FITXER
 * ─────────────────────────
 * Cada secció agrupa els textos per tipus i per família matemàtica.
 * No cal tocar cap altre fitxer JS per canviar el que llegeix l'alumne.
 *
 * Hi ha dos tipus de text:
 *   1. HINTS  → explicació conceptual ampliada (bloc groc, botó "+ ajuda")
 *   2. FEEDBACK → frase curta que apareix just després d'errar
 *
 * ORDRE DE CÀRREGA A L'HTML: abans de distractor-lib.js
 * DEPENDÈNCIES: cap
 * ============================================================================
 */

window.Strings = (() => {

// ============================================================================
// SECCIÓ 1 — HINTS
// Apareixen al bloc groc expandible ("+ ajuda") i al resum final de sessió.
// Hi ha un hint per tipus d'error (errorType). Expliquen el PERQUÈ de la
// regla, no repeteixen l'error concret (d'això ja s'encarrega el feedback).
// ============================================================================
const Hints = {

    // -------------------------------------------------------
    // Regla de la cadena
    // -------------------------------------------------------

    CHAIN_FORGOT:
        "Per aplicar la regla de la cadena, caldrà multiplicar A·B.\n" +
        "A: és la derivada de la funció exterior, però avaluada a l'interior.\n" +
        "B: és la derivada de la funció interior.\n" +
        "Exemple: per derivar sin(x²), escrivim: cos(x²) · (2x).",

    CHAIN_WRONG_COEF:
        "Per derivar un polinomi p(x), cal derivar terme a terme.\n" +
        "Exemple: per derivar 5x²+3x, escrivim: 10x+3.",

    CHAIN_SIGN:
        "Quan derivem, un signe negatiu és equivalent a tenir (-1) multiplicant.\n" +
        "Exemple: per derivar (−cos x), escriurem −(−sin(x)) i ho simplifiquem a sin(x).",

    // -------------------------------------------------------
    // Errors genèrics
    // -------------------------------------------------------

    NO_DERIVATIVE:
        "Aquesta opció és idèntica a la funció original: no s'ha derivat res.\n" +
        "Exemple: si has de derivar sin(x), no pots respondre sin(x). Has de respondre cos(x).",

    INTEGRAL_CONFUSION:
        "Atenció, potser has integrat per error. Aquí has de derivar.\n" +
        "Exemple: la derivada de x³ és 3x²; seria un error escriure x⁴/4.",

    // -------------------------------------------------------
    // Regla del producte
    // -------------------------------------------------------

    PRODUCT_FORGOT_SUM:
        "Per derivar un producte f·g, la fórmula és aquesta: (f·g)' = f'·g + f·g'.\n" +
        "Exemple: la derivada de (x²·sin x) és aquesta: 2x·sin(x) + x²·cos(x).",

    PRODUCT_WRONG_ORDER:
        "Per derivar un producte f·g, recorda que hi ha una suma a la fórmula: (f·g)' = f'·g + f·g'.\n" +
        "Exemple: la derivada de (x²·sin x) és aquesta: 2x·sin(x) + x²·cos(x).",

    // -------------------------------------------------------
    // Regla del quocient
    // -------------------------------------------------------

    QUOTIENT_SIGN:
        "Per derivar un quocient f/g, hem de construir el numerador així: f'·g − f·g'.\n" +
        "Exemple: per derivar (x²/sin x), el numerador de la resposta és: 2x·sin(x) − x²·cos(x).\n" +
        "A banda, recorda que el denominador seria, en aquest cas: sin²(x).",

    QUOTIENT_DENOM:
        "Per derivar un quocient f/g, recorda que el denominador de la teva resposta ha de ser g².\n" +
        "Exemple: per derivar (x/sin x), el denominador de la resposta és: sin²(x).",

    // -------------------------------------------------------
    // Regla de la potència
    // -------------------------------------------------------

    POWER_FORGOT_R:
        "Per derivar x^n, l'exponent disminueix en 1 unitat. I cal multiplicar pel coeficient adequat.\n" +
        "Exemple: per derivar 7x³, escriurem aquesta resposta: 21·x².",

    POWER_WRONG_EXP:
        "Quan derivem x^n, l'exponent disminueix en 1 unitat.\n" +
        "Exemple: per derivar x³, escriurem 3x². Seria un error escriure 3x³.",

    // -------------------------------------------------------
    // Logaritme
    // -------------------------------------------------------

    // [ROUND 1 — Bug fix: numerador i denominador estaven descrits al revés]
    LOG_INVERTED:
        "Per trobar la derivada de ln(f(x)) escriurem una fracció. El numerador és f'(x) i el denominador és f(x).\n" +
        "Exemple: per derivar ln(x²), escriurem aquesta resposta: 2x/x², que simplifica a 2/x.",

    LOG_FORGOT_CHAIN:
        "Per derivar ln(f(x)), cal fer 2 passos: primer escriure 1/f(x), i després multiplicar per la derivada de f(x).\n" +
        "Exemple: per derivar ln(x²+1), escriurem aquesta resposta: (1/(x²+1))·(2x), que simplifica a 2x/(x²+1).",

    LOG_FORGOT_DIVIDE:
        "Per derivar ln(f(x)), el resultat és una fracció: la derivada de f(x) al numerador, i f(x) al denominador.\n" +
        "Exemple: per derivar ln(sin x), escriurem aquesta resposta: cos(x)/sin(x). Seria un error escriure només cos(x).",

    // -------------------------------------------------------
    // Trigonometria
    // -------------------------------------------------------

    SIN_COS_SWAP:
        "Recorda: la derivada de sin(x) és cos(x); la derivada de cos(x) és −sin(x).",
};


// ============================================================================
// SECCIÓ 2 — FEEDBACK D'ENCERT
// Frase curta que apareix quan l'alumne encerta.
// Organitzat per família. Edita aquí si vols canviar el to (més càlid,
// més neutre, amb la fórmula explícita, etc.)
// ============================================================================
const Correct = {

    // Genèrics (usats per famílies sense missatge específic)
    generic:             "Molt bé! Resposta correcta.",

    // Exponencials
    'chain-exp-int':     "Molt bé! Resposta correcta.",
    'chain-exp-frac':    "Molt bé! Resposta correcta.",

    // Potència
    'power':             "Molt bé! Resposta correcta.",
    // El feedback de power-coef inclou la fórmula i es construeix dinàmicament
    // a question-bank.js: `Molt bé! Recorda: (${fmt(a,n)})' = ${solutionTex}.`

    // Logaritmes
    'log-kx':            "Molt bé! Recorda: la k es cancel·la sempre en ln(kx).",
    'log-xn':            "Molt bé! Resposta correcta.",
    'log-linear':        "Molt bé! Resposta correcta.",
    'log-poly2':         "Molt bé! Resposta correcta.",

    // Trigonomètrics simples
    'chain-sin-int':     "Molt bé! Recorda: (sin(kx))' = k·cos(kx).",
    'chain-cos-int':     "Molt bé! Recorda: (cos(kx))' = −k·sin(kx).",

    // Trigonomètrics amb polinomi interior
    'chain-sin-poly2':   "Molt bé! Has aplicat la regla de la cadena: (sin(p(x)))' = p'(x)·cos(p(x)).",
    'chain-cos-poly2':   "Molt bé! Has aplicat la regla de la cadena: (cos(p(x)))' = −p'(x)·sin(p(x)).",

    // Compostes d'ordre superior
    'compound-exp-sin':  "Molt bé! (e^{sin(x)})' = cos(x)·e^{sin(x)}: derivada exterior avaluada a sin(x), per la derivada interior cos(x).",
    'compound-exp-cos':  "Molt bé! (e^{cos(x)})' = −sin(x)·e^{cos(x)}: atenció al signe negatiu de cos'(x) = −sin(x).",
    'compound-ln-sin':   "Molt bé! (ln(sin(x)))' = cos(x)/sin(x): derivada del logaritme per la derivada interior cos(x), dividida per sin(x).",
    'compound-ln-cos':   "Molt bé! (ln(cos(x)))' = −sin(x)/cos(x): atenció al signe negatiu de cos'(x) = −sin(x).",

    // Producte i quocient
    'product':           "Molt bé! Has aplicat correctament la regla del producte: (fg)' = f'g + fg'.",
    'quotient':          "Molt bé! Has aplicat correctament la regla del quocient: (f'g − fg')/g².",
};


// ============================================================================
// SECCIÓ 3 — FEEDBACK D'ERROR
// Frases curtes que apareixen just després de clicar una opció incorrecta.
// Organitzat per família i després per tipus d'error.
//
// NOTA: Alguns feedbacks es construeixen dinàmicament al codi (quan necessiten
// incloure valors matemàtics com el k concret). Aquests estan marcats amb
// el comentari  ← DINÀMIC  i no es poden centralitzar sense refactorització.
// ============================================================================
const Feedback = {

    // -------------------------------------------------------
    // Genèrics — apareixen en múltiples famílies (_buildChainPool)
    // Nota: s'han fusionat parells amb string idèntica:
    //   not_derivative_x   → not_derivative_coef
    //   wrong_coef_x       → forgot_chain_coef
    //   wrong_coef_sum     → forgot_chain_sum
    //   integral_coef      → integral_plain
    // distractor-lib.js usa les claus canòniques en tots els casos.
    // -------------------------------------------------------
    chain_generic: {
        forgot_chain:         "Has oblidat aplicar la regla de la cadena.",
        not_derivative_coef:  "No és aquesta la derivada.",
        not_derived:          "No has derivat.",
        wrong_coef_generic:   "La regla de la cadena és correcta, però el coeficient no és el bo.",
        forgot_chain_coef:    "No has aplicat correctament la regla de la cadena.",
        forgot_chain_sum:     "La regla de la cadena és un producte (·), no una suma (+).",
        sign_error:           "Comprova els signes i aplica la regla de la cadena.",
        sign_error_neg:       "Comprova els signes.",
        integral_plain:       "Atenció: aquí estem derivant, no integrant.",
        power_wrong_exp:      "Compte, aquesta funció no es deriva com si fos un polinomi.",
    },

    // ------------------------------------------------------------------
    // GENÈRIC universal (NO_DERIVATIVE)
    // ------------------------------------------------------------------
    no_derivative:            "Aquesta és la funció original, no la seva derivada.",
    no_derivative_fx:         "Aquesta és la funció original, no la seva derivada.",

    // ------------------------------------------------------------------
    // POTÈNCIA  xⁿ  i  a·xⁿ
    // ------------------------------------------------------------------
    power: {
        forgot_n:             "Has reduït l'exponent, però falta multiplicar pel valor de l'exponent n.",
        forgot_a:             "Has baixat l'exponent com a coeficient, però falta multiplicar pel coeficient a de la funció original.",
        coef_ok_exp_not:      "El coeficient és correcte, però l'exponent ha de reduir-se en 1.",
        is_integral:          "Atenció: estàs calculant la primitiva, no la derivada.",
        double_derived:       "Has derivat dues vegades. La regla de la potència s'aplica una sola vegada.",
        exp_increased:        "L'exponent ha de disminuir en 1, no augmentar.",
        exp_not_reduced_fb:   "L'exponent ha de disminuir en 1, no augmentar.",
    },

    // ------------------------------------------------------------------
    // LOGARITME  ln(kx)
    // ------------------------------------------------------------------
    log_kx: {
        forgot_chain:         "Has oblidat multiplicar per la derivada de l'argument. La derivada de ln(kx) simplifica a 1/x.",
        not_simplified:       "Gairebé bé: has calculat k/(kx), però cal simplificar. k/(kx) = 1/x.",
        inverted:             "La fracció va al revés: la derivada de ln(x) és 1/x, no x.",
        no_deriv_kln:         "Atenció: has escrit u·ln(u), però la derivada de ln(u) és 1/u multiplicat per la derivada de u.",
    },

    // ------------------------------------------------------------------
    // LOGARITME  ln(xⁿ)
    // ------------------------------------------------------------------
    log_xn: {
        forgot_chain:         "Has escrit 1/(argument), però falta multiplicar per la derivada de l'argument interior.",
        not_simplified:       "Gairebé bé: has calculat n/xⁿ, però cal simplificar: n·x^{n−1}/xⁿ = n/x.",
        inverted:             "La fracció va al revés: la derivada va al numerador, i l'argument al denominador.",
        property_no_deriv:    "Has usat la propietat ln(xⁿ) = n·ln(x), però has oblidat derivar n·ln(x).",
        derived_as_power:     "Has derivat l'argument com si fos una potència sola, però aquí és l'interior d'un logaritme.",
    },

    // ------------------------------------------------------------------
    // LOGARITME  ln(ax+b)
    // ------------------------------------------------------------------
    log_linear: {
        forgot_chain:         "Has oblidat multiplicar per la derivada de l'argument interior.",
        inverted:             "La fracció va al revés: la derivada va al numerador, i l'argument al denominador.",
        wrong_denom_sq:       "El denominador ha de ser (ax+b), no (ax+b)².",
        no_deriv_ln:          "Atenció: la derivada de ln(u) és 1/u, no ln(u).",
        wrong_sign:           "El signe és incorrecte.",
    },

    // ------------------------------------------------------------------
    // LOGARITME  ln(x²+bx+c)
    // ------------------------------------------------------------------
    log_poly2: {
        forgot_chain:         "Has escrit 1/(argument), però falta multiplicar per la derivada de l'argument interior, que és (2x+b).",
        wrong_denom_sq:       "El denominador ha de ser (x²+bx+c), no el seu quadrat.",
        inverted:             "La fracció va al revés: la derivada va al numerador, i l'argument al denominador.",
        forgot_b:             "Has derivat x² correctament (→ 2x), però has oblidat la derivada de bx, que és b.",
        forgot_x:             "La derivada de x² és 2x, no 2. No oblides la x.",
    },

    // ------------------------------------------------------------------
    // TRIGONOMETRIA  sin(kx)
    // ------------------------------------------------------------------
    sin_kx: {
        forgot_k:             "Has derivat sin a cos, però has oblidat multiplicar per la derivada de l'argument interior (k).",
        sin_cos_swap:         "Quan derivem sin, obtenim cos. Sin i cos s'intercanvien en derivar.",
        wrong_sign:           "La derivada de sin porta signe positiu, no negatiu. El signe negatiu és de la derivada de cos.",
        double_error:         "Dos errors alhora: sin s'ha de convertir en cos, i el signe ha de ser positiu.",
        is_integral:          "Atenció: estàs calculant la primitiva, no la derivada.",
        k_squared:            "El coeficient de la regla de la cadena és k, no k².",
    },

    // ------------------------------------------------------------------
    // TRIGONOMETRIA  cos(kx)
    // ------------------------------------------------------------------
    cos_kx: {
        forgot_sign:          "Has derivat cos a sin, però falta el signe negatiu. La derivada de cos és −sin.",
        sin_cos_swap:         "Has posat el signe negatiu, però cos s'ha de convertir en sin, no en cos. Sin i cos s'intercanvien.",
        forgot_k:             "Has derivat cos a −sin, però has oblidat multiplicar per la derivada de l'argument interior (k).",
        double_error:         "Dos errors alhora: cos s'ha de convertir en sin, i falta el signe negatiu.",
        is_integral:          "Atenció: estàs calculant la primitiva, no la derivada.",
    },

    // ------------------------------------------------------------------
    // TRIGONOMETRIA  sin(x²+bx+c)
    // ------------------------------------------------------------------
    sin_poly2: {
        forgot_p_prime:       "Has derivat sin a cos, però has oblidat multiplicar per la derivada de l'argument interior (2x+b).",
        sin_cos_swap:         "Quan derivem sin, obtenim cos, no sin. Sin i cos s'intercanvien en derivar.",
        wrong_sign:           "La derivada de sin porta signe positiu, no negatiu. El signe negatiu és de la derivada de cos.",
        forgot_b:             "Has derivat x² correctament (→ 2x), però has oblidat la derivada de bx, que és b.",
        forgot_x_in_2x:       "La derivada de x² és 2x, no 2. No oblides la x.",
        double_error:         "Dos errors alhora: sin s'ha de convertir en cos, i el signe ha de ser positiu.",
    },

    // ------------------------------------------------------------------
    // TRIGONOMETRIA  cos(x²+bx+c)
    // ------------------------------------------------------------------
    cos_poly2: {
        forgot_sign:          "Has derivat cos a sin i has multiplicat per la derivada interior, però falta el signe negatiu. La derivada de cos és −sin.",
        sin_cos_swap:         "Has posat el signe negatiu, però cos s'ha de convertir en sin, no en cos. Sin i cos s'intercanvien.",
        forgot_p_prime:       "Has derivat cos a −sin, però has oblidat multiplicar per la derivada de l'argument interior (2x+b).",
        forgot_b:             "Has derivat x² correctament (→ 2x), però has oblidat la derivada de bx, que és b.",
        forgot_x_in_2x:       "La derivada de x² és 2x, no 2. No oblides la x.",
        double_error:         "Dos errors alhora: cos s'ha de convertir en sin, i falta el signe negatiu.",
    },

    // ------------------------------------------------------------------
    // COMPOSTES  e^{sin(x)}  i  e^{cos(x)}
    // ------------------------------------------------------------------
    exp_sin: {
        forgot_exp:           "Has calculat la derivada de l'interior (cos(x)), però has oblidat multiplicar per l'exterior e^{sin(x)}.",    // ← DINÀMIC (gPrime varia)
        sin_cos_swap:         "Quan derivem sin(x), obtenim cos(x), no −sin(x).",
        wrong_arg_coef:       "Has multiplicat per cos(x), però l'argument de l'exponencial no canvia: ha de ser e^{sin(x)}, no e^{cos(x)}.",
        substituted_arg:      "Has substituït l'argument per la seva derivada. L'argument de l'exponencial és sin(x), no cos(x).",
    },
    exp_cos: {
        forgot_exp:           "Has calculat la derivada de l'interior (−sin(x)), però has oblidat multiplicar per l'exterior e^{cos(x)}.",   // ← DINÀMIC
        forgot_sign:          "Has oblidat el signe negatiu. La derivada de cos(x) és −sin(x), no +sin(x).",
        substituted_arg:      "Has substituït l'argument per la seva derivada. L'argument de l'exponencial és cos(x), no −sin(x).",
        sin_cos_swap:         "Quan derivem cos(x), obtenim −sin(x), no cos(x).",
    },

    // ------------------------------------------------------------------
    // COMPOSTES  ln(sin(x))  i  ln(cos(x))
    // ------------------------------------------------------------------
    ln_sin: {
        forgot_chain:         "Has escrit 1/sin(x), però falta multiplicar per la derivada interior, cos(x).",
        inverted:             "La fracció va al revés: la derivada va al numerador, i l'argument al denominador.",
        wrong_sign:           "El signe és incorrecte. La derivada de sin(x) és +cos(x), no −cos(x).",
        forgot_divide:        "Has calculat la derivada de sin(x), però has oblidat dividir per sin(x).",
        sin_cos_swap:         "Has usat −sin(x) al numerador, però la derivada de sin(x) és cos(x), no −sin(x).",
    },
    ln_cos: {
        forgot_chain:         "Has escrit 1/cos(x), però falta multiplicar per la derivada interior, −sin(x).",
        forgot_sign:          "Has oblidat el signe negatiu. La derivada de cos(x) és −sin(x), no +sin(x).",
        inverted:             "La fracció va al revés: la derivada va al numerador, i l'argument al denominador.",
        forgot_divide:        "Has calculat la derivada de cos(x), però has oblidat dividir per cos(x).",
        sin_cos_swap:         "Has usat cos(x) al numerador, però la derivada de cos(x) és −sin(x), no cos(x).",
        inverted_sign:        "La fracció va al revés i el signe és incorrecte. Comprova numerador i denominador.",
    },

    // ------------------------------------------------------------------
    // PRODUCTE  (f·g) → f'·g + f·g'
    // ------------------------------------------------------------------
    product: {
        multiplied_derivs:    "Has multiplicat les dues derivades, però la regla del producte diu: f'·g + f·g', no f'·g'.",
        subtracted:           "Has restat en lloc de sumar. La resta és de la regla del quocient, no del producte.",
        forgot_second_term:   "Has calculat f'·g però has oblidat el segon terme: + f·g'.",
        forgot_first_term:    "Has calculat f·g' però has oblidat el primer terme: f'·g.",
    },

    // ------------------------------------------------------------------
    // QUOCIENT  (f/g) → (f'·g − f·g') / g²
    // ------------------------------------------------------------------
    quotient: {
        added_instead:        "Al numerador has sumat (+) en lloc de restar (−).",
        forgot_sq:            "Has oblidat elevar el denominador al quadrat.",
        inverted_order:       "Has invertit l'ordre del numerador. Ha de ser f'·g − f·g', no f·g' − f'·g.",
        forgot_denom:         "Has calculat el numerador correctament però has oblidat dividir per g².",
    },
};


// ============================================================================
// API PÚBLICA
// ============================================================================
return { Hints, Correct, Feedback };

})();
