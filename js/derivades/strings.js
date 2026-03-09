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
        "La regla de la cadena té dos factors obligatoris: f'(g(x)) · g'(x). " +
        "El primer és la derivada de l'exterior avaluada a l'interior; el segon, la derivada de l'interior. " +
        "Cap dels dos no pot mancar: si no apareix g'(x) com a factor, la cadena és incompleta.",

    CHAIN_WRONG_COEF:
        "Quan l'argument interior és un polinomi p(x), cal derivar-lo terme a terme: " +
        "cada potència, cada coeficient lineal i cada constant. " +
        "Un error habitual és oblidar un terme o calcular malament el coeficient d'un dels sumands de p'(x).",

    CHAIN_SIGN:
        "El signe és part de la derivada, no un detall. " +
        "(sin u)' = +cos(u)·u', però (cos u)' = −sin(u)·u' — el negatiu és intrínsec a cos'. " +
        "Si u' té termes negatius, el signe es propaga i pot canviar el resultat final.",

    // -------------------------------------------------------
    // Errors genèrics
    // -------------------------------------------------------

    NO_DERIVATIVE:
        "Quan una opció és idèntica a la funció de la pregunta, és una pista segura que no s'ha derivat. " +
        "La derivada quasi sempre és una funció diferent de l'original " +
        "(l'excepció notable és e^x, que és la seva pròpia derivada).",

    INTEGRAL_CONFUSION:
        "Derivar i integrar (calcular primitives) són operacions inverses. " +
        "La derivada redueix el grau del polinomi o elimina factors; la primitiva l'augmenta. " +
        "Si el resultat és 'més gran' que la funció original, probablement s'ha integrat en lloc de derivar.",

    // -------------------------------------------------------
    // Regla del producte
    // -------------------------------------------------------

    PRODUCT_FORGOT_SUM:
        "La regla del producte és una suma de dos termes: (fg)' = f'g + fg'. " +
        "La idea és que cada factor es deriva per torn mentre l'altre es manté. " +
        "Si el resultat és un sol terme o un producte de derivades, no s'ha aplicat la regla.",

    PRODUCT_WRONG_ORDER:
        "(fg)' = f'g + fg' i (f/g)' = (f'g − fg')/g² semblen paregudes però difereixen en signe i denominador. " +
        "La regla del producte sempre suma; la del quocient sempre resta (f' primer, f segon al numerador).",

    // -------------------------------------------------------
    // Regla del quocient
    // -------------------------------------------------------

    QUOTIENT_SIGN:
        "Al numerador de (f/g)', l'ordre importa: f'g − fg', mai fg' − f'g. " +
        "La manera de recordar-ho: el numerador de la derivada sempre comença pel terme amb la derivada de dalt (f'), " +
        "igual que en la regla del producte, però amb resta.",

    QUOTIENT_DENOM:
        "El denominador de (f/g)' és sempre g², no g. " +
        "Geomètricament, elevar al quadrat prové d'aplicar la regla de la cadena a 1/g. " +
        "Si el denominador no és el quadrat del denominador original, la fórmula és incompleta.",

    // -------------------------------------------------------
    // Regla de la potència
    // -------------------------------------------------------

    POWER_FORGOT_R:
        "La regla de la potència té dos canvis simultanis: l'exponent n baixa com a coeficient davant, " +
        "i l'exponent es redueix en 1. Els dos han de passar alhora: (x^n)' = n·x^{n−1}. " +
        "Oblidar qualsevol dels dos és un error parcial.",

    POWER_WRONG_EXP:
        "Quan derives x^n, l'exponent no es manté: passa de n a n−1. " +
        "Pensa-ho com un 'descens': l'exponent baixa una posició. " +
        "Si l'exponent del resultat és el mateix que el de la funció original, no s'ha aplicat el descens.",

    // -------------------------------------------------------
    // Logaritme
    // -------------------------------------------------------

    LOG_INVERTED:
        "L'origen de la fórmula: per la regla de la cadena, (ln f)' = (1/f) · f'. " +
        "Llegit com a fracció, f' és sempre el numerador (el que 'ha canviat') " +
        "i f és sempre el denominador (l'argument original del logaritme). " +
        "Si tens f a dalt i f' a baix, has intercanviat els papers de numerador i denominador.",

    LOG_FORGOT_CHAIN:
        "Derivar ln(f(x)) és un procés en dos passos: " +
        "(1) derivar el logaritme com si l'interior fos una variable simple → 1/f(x); " +
        "(2) multiplicar per la derivada interior → f'(x). " +
        "El resultat complet és f'(x)/f(x). Saltar el segon pas dóna 1/f en lloc de f'/f.",

    LOG_FORGOT_DIVIDE:
        "Quan derives ln(f(x)), el resultat és f'(x)/f(x): la derivada de l'interior al numerador " +
        "i l'argument original del logaritme al denominador. " +
        "Calcular f'(x) sense dividir per f(x) és fer la meitat de la feina.",

    // -------------------------------------------------------
    // Trigonometria
    // -------------------------------------------------------

    SIN_COS_SWAP:
        "Derivar intercanvia sin i cos, però amb una asimetria de signe: " +
        "(sin u)' = +cos(u)·u' — sense negatiu; " +
        "(cos u)' = −sin(u)·u' — amb negatiu. " +
        "El negatiu pertany sempre a cos (tant en la derivada de cos com en la seva primitiva).",
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

    // ------------------------------------------------------------------
    // GENÈRICS — apareixen en múltiples famílies (_buildChainPool)
    // ------------------------------------------------------------------
    chain_generic: {
        forgot_chain:         "Has oblidat aplicar la regla de la cadena.",
        not_derivative_coef:  "No és aquesta la derivada.",
        not_derived:          "No has derivat.",
        wrong_coef_generic:   "Quan has aplicat la regla de la cadena, t'has equivocat en un coeficient.",
        wrong_coef_x:         "No has aplicat correctament la regla de la cadena.",
        wrong_coef_sum:       "No apliques correctament la regla de la cadena, perquè no hi va una suma.",
        forgot_chain_coef:    "No has aplicat correctament la regla de la cadena.",
        forgot_chain_sum:     "No apliques correctament la regla de la cadena, perquè no hi va una suma.",
        not_derivative_x:     "No és aquesta la derivada.",
        sign_error:           "Revisa els signes i recorda aplicar la regla de la cadena.",
        sign_error_neg:       "Hi ha algun error amb els signes.",
        integral_coef:        "Incorrecte: recorda que estem derivant.",
        integral_plain:       "Incorrecte: recorda que estem derivant.",
        power_wrong_exp:      "Compte, aquesta funció no es deriva com si fos un polinomi.",
    },

    // ------------------------------------------------------------------
    // GENÈRIC universal (NO_DERIVATIVE)
    // ------------------------------------------------------------------
    no_derivative:            "Aquesta és la funció original, no la seva derivada.",
    no_derivative_fx:         "Aquesta és la funció original f(x), no la seva derivada f'(x).",

    // ------------------------------------------------------------------
    // POTÈNCIA  x^n  i  a·x^n
    // ------------------------------------------------------------------
    power: {
        forgot_n:             "Has reduït l'exponent, però has oblidat multiplicar pel valor de l'exponent n.",
        forgot_a:             "Has baixat l'exponent n com a coeficient, però has oblidat el coeficient a de la funció original.",
        coef_ok_exp_not:      "El coeficient és correcte, però l'exponent ha de reduir-se en 1: n passa a n−1.",
        is_integral:          "Estàs calculant la primitiva (integral), no la derivada.",
        double_derived:       "Has derivat dues vegades. La regla de la potència s'aplica una sola vegada.",
        exp_increased:        "L'exponent ha de disminuir en 1, no augmentar.",
        exp_not_reduced_fb:   "L'exponent ha de disminuir en 1 quan derivem, no augmentar.",   // fallback
    },

    // ------------------------------------------------------------------
    // LOGARITME  ln(kx)
    // ------------------------------------------------------------------
    log_kx: {
        forgot_chain:         "Has derivat el logaritme però has oblidat multiplicar per la derivada de l'argument. La derivada de ln(kx) és (1/kx)·k = 1/x.",
        not_simplified:       "Gairebé bé: has calculat (1/kx)·k però no has simplificat. k/(kx) = 1/x.",
        inverted:             "La derivada de ln(x) és 1/x, no x. La fracció va al revés.",
        no_deriv_kln:         "La derivada de ln(u) és 1/u·u', no u'·ln(u). Has de derivar el logaritme.",
        // Fallbacks (question-bank.js)
        fb_wrong_k:           "Gairebé bé, però k/(kx) simplifica a 1/x.",
        fb_forgot_k:          "Has oblidat la k del numerador.",
    },

    // ------------------------------------------------------------------
    // LOGARITME  ln(x^n)
    // ------------------------------------------------------------------
    log_xn: {
        forgot_chain:         "Has escrit 1/(argument) però has oblidat multiplicar per la derivada de l'argument interior.",
        not_simplified:       "Gairebé bé: has calculat (1/x^n)·n però no has simplificat x^{n-1}/x^n = 1/x.",
        inverted:             "La derivada de ln(f) és f'/f, no f/f'. La fracció va al revés.",
        property_no_deriv:    "Has usat la propietat ln(x^n) = n·ln(x), però ara hauries de derivar n·ln(x) per obtenir n/x.",
        derived_as_power:     "Has derivat x^n com si fos una potència sola, però aquí és l'argument d'un logaritme.",
        // Fallbacks (question-bank.js)
        fb_forgot_chain:      "Has oblidat multiplicar per nx^{n-1}.",
        fb_property_no_deriv: "Has usat la propietat però no has derivat.",
    },

    // ------------------------------------------------------------------
    // LOGARITME  ln(ax+b)
    // ------------------------------------------------------------------
    log_linear: {
        forgot_chain:         "Has oblidat multiplicar per la derivada de l'argument interior.",
        inverted:             "La derivada de ln(f) és f'/f, no f/f'.",
        wrong_denom_sq:       "El denominador ha de ser (ax+b), no (ax+b)².",
        no_deriv_ln:          "La derivada de ln(u) és 1/u, no ln(u).",
        wrong_sign:           "El signe és incorrecte.",
    },

    // ------------------------------------------------------------------
    // LOGARITME  ln(x²+bx+c)
    // ------------------------------------------------------------------
    log_poly2: {
        forgot_chain:         "Has escrit 1/(argument) però has oblidat multiplicar per la derivada de l'argument interior, que és (2x+b).",
        wrong_denom_sq:       "El denominador ha de ser (x²+bx+c), no el seu quadrat.",
        inverted:             "La derivada de ln(f) és f'/f, no f/f'.",
        forgot_b:             "Has derivat x² correctament (→ 2x), però has oblidat la derivada del terme bx, que és b.",
        forgot_x:             "La derivada de x² és 2x, no 2. No oblides la x quan derives una potència.",
    },

    // ------------------------------------------------------------------
    // TRIGONOMETRIA  sin(kx)
    // ------------------------------------------------------------------
    sin_kx: {
        forgot_k:             "Has derivat sin a cos, però has oblidat multiplicar per la derivada de l'argument interior (k).",
        sin_cos_swap:         "La derivada de sin(u) és cos(u)·u', no sin(u)·u'. Sin i cos s'intercanvien en derivar.",
        wrong_sign:           "La derivada de sin és +cos, no −cos. El signe negatiu apareix en la derivada de cos, no de sin.",
        double_error:         "Dos errors alhora: (sin u)' = cos(u)·u', no −sin(u)·u'.",
        is_integral:          "Estàs calculant la primitiva (∫sin = −cos/k), no la derivada (sin' = k·cos).",
        k_squared:            "El coeficient de la regla de la cadena és k, no k².",
    },

    // ------------------------------------------------------------------
    // TRIGONOMETRIA  cos(kx)
    // ------------------------------------------------------------------
    cos_kx: {
        forgot_sign:          "Has derivat cos a sin, però la derivada de cos porta signe negatiu: (cos u)' = −sin(u)·u'.",
        sin_cos_swap:         "Has posat el signe negatiu, però la derivada de cos és −sin, no −cos. Sin i cos s'intercanvien.",
        forgot_k:             "Has derivat cos a −sin, però has oblidat multiplicar per la derivada de l'argument interior (k).",
        double_error:         "Dos errors alhora: falta el signe negatiu i cos no s'ha convertit en sin. Recorda: (cos u)' = −sin(u)·u'.",
        is_integral:          "Estàs calculant la primitiva (∫cos = sin/k), no la derivada (cos' = −k·sin).",
    },

    // ------------------------------------------------------------------
    // TRIGONOMETRIA  sin(x²+bx+c)
    // ------------------------------------------------------------------
    sin_poly2: {
        forgot_p_prime:       "Has derivat sin a cos, però has oblidat multiplicar per la derivada de l'argument interior p'(x) = 2x+b.",
        sin_cos_swap:         "Has multiplicat per p'(x), però la derivada de sin(u) és cos(u)·u', no sin(u)·u'. Sin i cos s'intercanvien.",
        wrong_sign:           "La derivada de sin és +cos·p', no −cos·p'. El signe negatiu és de la derivada de cos, no de sin.",
        forgot_b:             "Has derivat x² correctament (→ 2x), però has oblidat la derivada del terme bx, que és b. La derivada completa de p(x) és 2x+b.",
        forgot_x_in_2x:       "La derivada de x² és 2x, no 2. No oblides la x quan derives una potència.",
        double_error:         "Dos errors alhora: (sin u)' = cos(u)·u', no −sin(u)·u'.",
    },

    // ------------------------------------------------------------------
    // TRIGONOMETRIA  cos(x²+bx+c)
    // ------------------------------------------------------------------
    cos_poly2: {
        forgot_sign:          "Has derivat cos a sin i has multiplicat per p'(x), però la derivada de cos porta signe negatiu: (cos u)' = −sin(u)·u'.",
        sin_cos_swap:         "Has posat el signe negatiu, però la derivada de cos és −sin, no −cos. Sin i cos s'intercanvien.",
        forgot_p_prime:       "Has derivat cos a −sin, però has oblidat multiplicar per la derivada de l'argument interior p'(x) = 2x+b.",
        forgot_b:             "Has derivat x² correctament (→ 2x), però has oblidat la derivada del terme bx, que és b. La derivada completa de p(x) és 2x+b.",
        forgot_x_in_2x:       "La derivada de x² és 2x, no 2. No oblides la x quan derives una potència.",
        double_error:         "Dos errors alhora: falta el signe negatiu i cos no s'ha convertit en sin. Recorda: (cos u)' = −sin(u)·u'.",
    },

    // ------------------------------------------------------------------
    // COMPOSTES  e^{sin(x)}  i  e^{cos(x)}
    // ------------------------------------------------------------------
    exp_sin: {
        no_derivative:        "Aquesta és la funció original, no la seva derivada.",
        forgot_exp:           "Has calculat la derivada de l'interior (\\cos(x)), però has oblidat multiplicar per l'exterior e^{\\sin(x)}.",    // ← DINÀMIC (gPrime varia)
        sin_cos_swap:         "La derivada de sin(x) és cos(x), no −sin(x). Has usat la derivada de cos en lloc de la de sin.",
        wrong_arg_coef:       "Has multiplicat per cos(x), però l'exponencial ha de ser e^{sin(x)}, no e^{cos(x)}. L'argument no canvia.",
        substituted_arg:      "Has substituït l'argument per la seva derivada. L'argument de l'exponencial és sin(x), no cos(x).",
        // Fallbacks (question-bank.js)
        fb_substituted:       "Has derivat l'argument però has substituït dins l'exponencial en lloc de multiplicar.",
        fb_no_derivative:     "Aquesta és la funció original, no la seva derivada.",
        fb_forgot_exp:        "Has calculat la derivada de l'interior, però has oblidat multiplicar per e^{sin(x)}.",
    },
    exp_cos: {
        no_derivative:        "Aquesta és la funció original, no la seva derivada.",
        forgot_exp:           "Has calculat la derivada de l'interior (-\\sin(x)), però has oblidat multiplicar per l'exterior e^{\\cos(x)}.",   // ← DINÀMIC
        forgot_sign:          "La derivada de cos(x) és −sin(x), no +sin(x). Has oblidat el signe negatiu.",
        substituted_arg:      "Has substituït l'argument per la seva derivada. L'argument de l'exponencial és cos(x), no −sin(x).",
        sin_cos_swap:         "La derivada de cos(x) és −sin(x), no cos(x). Has usat la derivada de sin en lloc de la de cos.",
        // Fallbacks (question-bank.js)
        fb_substituted:       "Has substituït l'argument per la seva derivada. L'exponencial és e^{cos(x)}, no e^{−sin(x)}.",
        fb_no_derivative:     "Aquesta és la funció original, no la seva derivada.",
        fb_forgot_exp:        "Has calculat la derivada de l'interior, però has oblidat multiplicar per e^{cos(x)}.",
    },

    // ------------------------------------------------------------------
    // COMPOSTES  ln(sin(x))  i  ln(cos(x))
    // ------------------------------------------------------------------
    ln_sin: {
        no_derivative:        "Aquesta és la funció original, no la seva derivada.",
        forgot_chain:         "Has derivat ln com a 1/sin(x), però has oblidat multiplicar per la derivada interior (ln f)' = f'/f.",
        inverted:             "Tens la fracció invertida. La derivada de ln(f) és f'/f, no f/f'.",
        wrong_sign:           "El signe és incorrecte. La derivada de sin(x) és +cos(x), no −cos(x).",
        forgot_divide:        "Has calculat la derivada de sin(x), però has oblidat dividir per sin(x). El resultat és cos(x)/sin(x).",
        sin_cos_swap:         "Has usat −sin(x) al numerador, però la derivada de sin(x) és cos(x), no −sin(x).",
        // Fallbacks (question-bank.js)
        fb_forgot_chain:      "Has derivat el logaritme però has oblidat multiplicar per la derivada interior cos(x).",
        fb_inverted:          "La derivada de ln(f) és f'/f, no f/f'. Tens la fracció invertida.",
    },
    ln_cos: {
        no_derivative:        "Aquesta és la funció original, no la seva derivada.",
        forgot_chain:         "Has derivat ln com a 1/cos(x), però has oblidat multiplicar per la derivada interior (ln f)' = f'/f.",
        forgot_sign:          "Has oblidat el signe negatiu. La derivada de cos(x) és −sin(x), no +sin(x).",
        inverted:             "Tens la fracció invertida. La derivada de ln(f) és f'/f, no f/f'.",
        forgot_divide:        "Has calculat la derivada de cos(x), però has oblidat dividir per cos(x). El resultat és −sin(x)/cos(x).",
        sin_cos_swap:         "Has usat cos(x) al numerador en lloc de −sin(x). La derivada de cos(x) és −sin(x), no cos(x).",
        inverted_sign:        "Tens la fracció invertida i el signe desplaçat. Comprova que numerador és f'(x) i denominador f(x).",
        // Fallbacks (question-bank.js)
        fb_forgot_chain:      "Has derivat el logaritme però has oblidat multiplicar per la derivada interior −sin(x).",
        fb_forgot_sign:       "Has oblidat el signe negatiu. La derivada de cos(x) és −sin(x), no +sin(x).",
    },

    // ------------------------------------------------------------------
    // PRODUCTE  (fg)'  =  f'g + fg'
    // ------------------------------------------------------------------
    product: {
        multiplied_derivs:    "Has multiplicat les derivades de f i g, però la regla del producte diu (fg)' = f'g + fg', no f'·g'.",
        subtracted:           "Has fet f'g − fg' en lloc de f'g + fg'. La resta és la regla del quocient, no la del producte.",
        forgot_second_term:   "Has calculat f'·g però has oblidat el segon terme: + f·g'.",
        forgot_first_term:    "Has calculat f·g' però has oblidat el primer terme: f'·g + ...",
        // Fallbacks (question-bank.js)
        fb_only_f:            "Aquesta és només la primera funció.",
        fb_only_g:            "Aquesta és només la segona funció.",
        fb_only_df:           "Has derivat només f(x).",
    },

    // ------------------------------------------------------------------
    // QUOCIENT  (f/g)'  =  (f'g − fg') / g²
    // ------------------------------------------------------------------
    quotient: {
        added_instead:        "Al numerador has sumat (+) en lloc de restar (−). Recorda: (f/g)' = (f'g − fg')/g².",
        forgot_sq:            "Has oblidat elevar el denominador al quadrat.",
        inverted_order:       "Has invertit l'ordre del numerador. Ha de ser f'g − fg', no fg' − f'g.",
        forgot_denom:         "Has calculat el numerador correctament però has oblidat dividir per g².",
        // Fallbacks (question-bank.js)
        fb_no_derivative:     "Aquesta és la funció original.",
        fb_separate_derivs:   "Has derivat numerador i denominador per separat.",
    },
};


// ============================================================================
// API PÚBLICA
// ============================================================================
return { Hints, Correct, Feedback };

})();
