/**
 * ============================================================================
 * PROJECTE: Motor Educatiu d'Integrals (Vanilla JS)
 * FITXER: js/integrals/strings.js
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

export const Strings = (() => {
    // ============================================================================
    // SECCIÓ 1 — HINTS
    // Apareixen al bloc groc expandible ("+ ajuda") i al resum final de sessió.
    // Hi ha un hint per tipus d'error (errorType). Expliquen el PERQUÈ de la
    // regla, no repeteixen l'error concret (d'això ja s'encarrega el feedback).
    // ============================================================================
    const Hints = {
        // -------------------------------------------------------
        // Regla de la potència — errors d'integració
        // -------------------------------------------------------

        INT_NO_DIVIDE:
            'La regla de la potència per a integrals té dos canvis obligatoris: ' +
            "l'exponent puja de n a n+1, i el resultat es divideix per n+1. " +
            "∫x^n dx = x^{n+1}/(n+1). Oblidar la divisió és l'error més freqüent: " +
            "el resultat queda 'massa gran' respecte a la funció original.",

        INT_WRONG_DIVISOR:
            "El divisor és n+1 (el nou exponent), no n (l'exponent original). " +
            'Per exemple, ∫x^3 dx = x^4/4: el divisor és 4 (el nou exponent), no 3. ' +
            'Una manera de verificar: deriva el resultat — si no recuperes la funció original, ' +
            'el divisor és incorrecte.',

        INT_WRONG_EXP:
            "Quan integres x^n, l'exponent no es manté: puja de n a n+1. " +
            "Pensa-ho com un 'ascens': l'exponent puja una posició. " +
            "Si l'exponent del resultat és el mateix que el de la funció original, " +
            "no s'ha aplicat l'ascens. La derivació és l'operació que redueix l'exponent.",

        INT_DERIVATIVE:
            'Has aplicat la regla de la derivada en lloc de la integral. ' +
            'Derivar x^n dona n·x^{n-1} (exponent baixa); integrar x^n dona x^{n+1}/(n+1) (exponent puja). ' +
            'Les dues operacions fan exactament el contrari: ' +
            "si el resultat té exponent menor que l'original, s'ha derivat.",

        INT_MULTIPLY:
            'La regla és dividir per (n+1), no multiplicar. ∫x^n dx = x^{n+1}/(n+1). ' +
            'Multiplicar per (n+1) fa el resultat excessivament gran. ' +
            'Pots verificar sempre derivant: la derivada del resultat ha de recuperar la funció original.',

        // -------------------------------------------------------
        // Exponencials — errors d'integració
        // -------------------------------------------------------

        EXP_FORGOT_COEF:
            'La integral de e^{kx} té un factor 1/k imprescindible: ∫e^{kx} dx = (1/k)·e^{kx}. ' +
            'Pots verificar derivant el resultat: la derivada de (1/k)·e^{kx} és (1/k)·k·e^{kx} = e^{kx}. ' +
            'Sense el factor 1/k, la derivació del resultat dona k·e^{kx} en lloc de e^{kx}.',

        EXP_WRONG_COEF:
            "El coeficient de la primitiva d'e^{kx} és 1/k (es divideix per k), no k² ni k^{-2}. " +
            "L'origen: ∫e^{kx} dx = (1/k)·e^{kx} ve de la regla de la cadena inversa. " +
            'Verifica: d/dx[(1/k)·e^{kx}] = (1/k)·k·e^{kx} = e^{kx}. ✓',

        EXP_DERIVATIVE:
            'Has multiplicat per k (regla de la derivada) quan calia dividir per k (regla de la integral). ' +
            'Derivar e^{kx} dona k·e^{kx}; integrar e^{kx} dona (1/k)·e^{kx}. ' +
            'Derivar i integrar fan operacions inverses amb el factor k: ' +
            "un multiplica i l'altre divideix.",

        // -------------------------------------------------------
        // Error genèric
        // -------------------------------------------------------

        NO_PRIMITIVE:
            "Quan el resultat és idèntic a la funció de la pregunta, no s'ha integrat. " +
            "L'excepció notable és e^x, que és la seva pròpia primitiva. " +
            'Per a qualsevol altra funció, la primitiva és sempre una expressió diferent.',

        INTEGRAL_CONFUSION:
            'Hi ha una confusió entre les regles de derivació i integració. ' +
            "Recorda: la primitiva d'una funció és aquella expressió tal que, en derivar-la, " +
            'recuperes la funció original. Verifica sempre el teu resultat derivant-lo.',

        // -------------------------------------------------------
        // Quasi-immediates (regla de la cadena al revés) — onada 2
        // -------------------------------------------------------
        QI_MULT_INNER:
            "En una quasi-immediata ∫f′·g(f) dx la derivada de l'interior f′ ja és dins de la integral: " +
            'és la que «es consumeix» en integrar. Si en falta una part constant, cal dividir-hi, no multiplicar. ' +
            'Verifica derivant: d/dx[G(f)] = G′(f)·f′.',
        QI_CONST_FACTOR:
            "Abans d'integrar, compara el factor de fora amb f′. Si hi és sencera (∫2x·(x²+1)³dx), la primitiva és G(f) " +
            "sense cap constant: (x²+1)⁴/4. Si hi és llevat d'una constant (∫x·(x²+1)³dx), escriu x = ½·2x " +
            'i treu el ½ fora: ½·(x²+1)⁴/4 = (x²+1)⁴/8.',
        QI_KEEP_FPRIME:
            'El factor f′ (la x, la x² …) no es queda a la primitiva. Quan derives G(f), la regla de la cadena ' +
            "ja el fa aparèixer: d/dx[sin(x²)] = cos(x²)·2x. Si el deixes, en derivar n'apareix un de més.",
        QI_POW_NO_DIVIDE:
            "∫f′·fⁿ dx = fⁿ⁺¹/(n+1): igual que ∫xⁿdx, l'exponent puja i es divideix pel nou exponent. " +
            "L'únic canvi és que la «x» ara és tota la funció f.",
        QI_POW_SAME_EXP:
            "En integrar una potència l'exponent puja de n a n+1. Si el resultat té el mateix exponent, " +
            "en derivar-lo t'apareix un exponent més baix i no recuperes l'integrand.",
        QI_POW_DERIV:
            "Has fet la derivada de la potència (l'exponent baixa) en lloc de la primitiva (l'exponent puja). " +
            'Derivar i integrar fan operacions inverses.',
        QI_LOG_DERIV:
            "∫f′/f dx = ln|f|: és la potència d'exponent −1, l'únic cas en què la regla de la potència no serveix " +
            '(dividiria per 0). −1/f² és la derivada de 1/f, no la seva primitiva.',
        QI_EXP_POWER:
            "La regla de la potència és per a fⁿ amb l'exponent fix. A e^f l'exponent és la funció: " +
            "∫f′·e^f dx = e^f, perquè la derivada d'e^f és e^f·f′.",
        QI_TRIG_SIGN:
            '(sin f)′ = cos f·f′ i (cos f)′ = −sin f·f′. Per tant ∫f′·cos f dx = sin f i ∫f′·sin f dx = −cos f. ' +
            'El signe menys va amb la primitiva del sinus, no amb la del cosinus.',
    };

    // ============================================================================
    // SECCIÓ 2 — FEEDBACK D'ENCERT
    // Frase curta que apareix quan l'alumne encerta.
    // Organitzat per família. Edita aquí per canviar el to.
    // ============================================================================
    const Correct = {
        'generic': 'Molt bé! Resposta correcta.',
        'int-power': 'Molt bé! Recorda: ∫x^n dx = x^{n+1}/(n+1).',
        'int-power-coef': 'Molt bé! Recorda: ∫ax^n dx = a·x^{n+1}/(n+1).',
        'int-exp-kx': 'Molt bé! Recorda: ∫e^{kx} dx = (1/k)·e^{kx}.',
        'int-quasi-pot': 'Molt bé! ∫f′·fⁿ dx = fⁿ⁺¹/(n+1).',
        'int-quasi-log': 'Molt bé! ∫f′/f dx = ln|f|.',
        'int-quasi-exp': 'Molt bé! ∫f′·e^f dx = e^f.',
        'int-quasi-cos': 'Molt bé! ∫f′·cos f dx = sin f.',
        'int-quasi-sin': 'Molt bé! ∫f′·sin f dx = −cos f.',
    };

    // ============================================================================
    // SECCIÓ 3 — FEEDBACK D'ERROR
    // Frases curtes que apareixen just després de clicar una opció incorrecta.
    // ============================================================================
    const Feedback = {
        // ------------------------------------------------------------------
        // REGLA DE LA POTÈNCIA  ∫x^n  i  ∫a·x^n
        // ------------------------------------------------------------------
        power: {
            no_divide: "Has incrementat l'exponent correctament, però has oblidat dividir pel nou exponent (n+1).",
            wrong_divisor: "Has dividit, però per n (l'exponent original) en lloc de per (n+1) (el nou exponent).",
            wrong_exp:
                "El divisor és correcte, però l'exponent no s'ha incrementat. " +
                "Recorda: en integrar, l'exponent puja de n a n+1.",
            derivative:
                'Has aplicat la derivada (exponent baixa: n → n−1) en lloc de la integral (exponent puja: n → n+1).',
            no_primitive: 'Aquesta és la funció original, no la seva primitiva.',
            multiply_not_divide: 'Has multiplicat per (n+1) en lloc de dividir. La regla és ∫x^n dx = x^{n+1}/(n+1).',
        },

        // ------------------------------------------------------------------
        // EXPONENCIAL  ∫e^{kx}
        // ------------------------------------------------------------------
        exp: {
            forgot_coef: 'Has obtingut e^{kx}, però falta el factor (1/k). Recorda: ∫e^{kx} dx = (1/k)·e^{kx}.',
            derivative:
                'Has multiplicat per k (derivada) en lloc de dividir per k (integral). ' +
                '∫e^{kx} dx = (1/k)·e^{kx}, no k·e^{kx}.',
            double_int: "Has dividit per k dues vegades (per k²). La integral d'e^{kx} divideix per k una sola vegada.",
            power_rule:
                "No apliquis la regla de la potència a l'exponencial. " +
                "L'exponent de e^{kx} no s'incrementa en integrar; el que canvia és el coeficient.",
            no_primitive: 'Aquesta és la funció original, no la seva primitiva.',
        },

        // ------------------------------------------------------------------
        // QUASI-IMMEDIATES  ∫c·x^{m−1}·g(f) dx  (onada 2)
        // ------------------------------------------------------------------
        quasi: {
            no_primitive: 'Aquesta és la funció de dins de la integral, no la seva primitiva.',
            mult_inner:
                "Has multiplicat per la derivada de l'interior en lloc de dividir-hi. " +
                "Deriva la teva resposta: t'apareix un factor de més.",
            const_factor:
                "La constant no quadra. Compara el factor de fora amb la derivada de l'interior, f′: " +
                'si hi és sencera, desapareix; si no, cal ajustar-la (multiplicar i dividir).',
            keep_fprime:
                'El factor f′ no es queda a la primitiva: en derivar G(f), la regla de la cadena ja el torna a posar.',
            pow_no_divide: "Has pujat l'exponent, però no has dividit pel nou exponent (n+1).",
            pow_same_exp: "Has dividit per (n+1), però l'exponent no ha pujat.",
            pow_deriv: "Has derivat la potència (l'exponent ha baixat) en lloc d'integrar-la.",
            log_deriv: 'Això és la derivada de 1/f, no la seva primitiva. ∫f′/f dx = ln|f|.',
            exp_power: "No apliquis la regla de la potència a l'exponencial: ∫f′·e^f dx = e^f.",
            trig_sign: 'Compte amb el signe: ∫f′·cos f dx = sin f, però ∫f′·sin f dx = −cos f.',
        },

        // ------------------------------------------------------------------
        // GENÈRIC (usat en múltiples famílies)
        // ------------------------------------------------------------------
        no_primitive: 'Aquesta és la funció original, no la seva primitiva.',
    };

    // ============================================================================
    // API PÚBLICA
    // ============================================================================
    return { Hints, Correct, Feedback };
})();
