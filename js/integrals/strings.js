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

window.Strings = (() => {

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
        "La regla de la potència per a integrals té dos canvis obligatoris: " +
        "l'exponent puja de n a n+1, i el resultat es divideix per n+1. " +
        "∫x^n dx = x^{n+1}/(n+1). Oblidar la divisió és l'error més freqüent: " +
        "el resultat queda 'massa gran' respecte a la funció original.",

    INT_WRONG_DIVISOR:
        "El divisor és n+1 (el nou exponent), no n (l'exponent original). " +
        "Per exemple, ∫x^3 dx = x^4/4: el divisor és 4 (el nou exponent), no 3. " +
        "Una manera de verificar: deriva el resultat — si no recuperes la funció original, " +
        "el divisor és incorrecte.",

    INT_WRONG_EXP:
        "Quan integres x^n, l'exponent no es manté: puja de n a n+1. " +
        "Pensa-ho com un 'ascens': l'exponent puja una posició. " +
        "Si l'exponent del resultat és el mateix que el de la funció original, " +
        "no s'ha aplicat l'ascens. La derivació és l'operació que redueix l'exponent.",

    INT_DERIVATIVE:
        "Has aplicat la regla de la derivada en lloc de la integral. " +
        "Derivar x^n dóna n·x^{n-1} (exponent baixa); integrar x^n dóna x^{n+1}/(n+1) (exponent puja). " +
        "Les dues operacions fan exactament el contrari: " +
        "si el resultat té exponent menor que l'original, s'ha derivat.",

    INT_MULTIPLY:
        "La regla és dividir per (n+1), no multiplicar. ∫x^n dx = x^{n+1}/(n+1). " +
        "Multiplicar per (n+1) fa el resultat excessivament gran. " +
        "Pots verificar sempre derivant: la derivada del resultat ha de recuperar la funció original.",

    // -------------------------------------------------------
    // Exponencials — errors d'integració
    // -------------------------------------------------------

    EXP_FORGOT_COEF:
        "La integral de e^{kx} té un factor 1/k imprescindible: ∫e^{kx} dx = (1/k)·e^{kx}. " +
        "Pots verificar derivant el resultat: la derivada de (1/k)·e^{kx} és (1/k)·k·e^{kx} = e^{kx}. " +
        "Sense el factor 1/k, la derivació del resultat dóna k·e^{kx} en lloc de e^{kx}.",

    EXP_WRONG_COEF:
        "El coeficient de la primitiva d'e^{kx} és 1/k (es divideix per k), no k² ni k^{-2}. " +
        "L'origen: ∫e^{kx} dx = (1/k)·e^{kx} ve de la regla de la cadena inversa. " +
        "Verifica: d/dx[(1/k)·e^{kx}] = (1/k)·k·e^{kx} = e^{kx}. ✓",

    EXP_DERIVATIVE:
        "Has multiplicat per k (regla de la derivada) quan calia dividir per k (regla de la integral). " +
        "Derivar e^{kx} dóna k·e^{kx}; integrar e^{kx} dóna (1/k)·e^{kx}. " +
        "Derivar i integrar fan operacions inverses amb el factor k: " +
        "un multiplica i l'altre divideix.",

    // -------------------------------------------------------
    // Error genèric
    // -------------------------------------------------------

    NO_PRIMITIVE:
        "Quan el resultat és idèntic a la funció de la pregunta, no s'ha integrat. " +
        "L'excepció notable és e^x, que és la seva pròpia primitiva. " +
        "Per a qualsevol altra funció, la primitiva és sempre una expressió diferent.",

    INTEGRAL_CONFUSION:
        "Hi ha una confusió entre les regles de derivació i integració. " +
        "Recorda: la primitiva d'una funció és aquella expressió tal que, en derivar-la, " +
        "recuperes la funció original. Verifica sempre el teu resultat derivant-lo.",
};


// ============================================================================
// SECCIÓ 2 — FEEDBACK D'ENCERT
// Frase curta que apareix quan l'alumne encerta.
// Organitzat per família. Edita aquí per canviar el to.
// ============================================================================
const Correct = {
    generic:          "Molt bé! Resposta correcta.",
    'int-power':      "Molt bé! Recorda: ∫x^n dx = x^{n+1}/(n+1).",
    'int-power-coef': "Molt bé! Recorda: ∫ax^n dx = a·x^{n+1}/(n+1).",
    'int-exp-kx':     "Molt bé! Recorda: ∫e^{kx} dx = (1/k)·e^{kx}.",
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
        no_divide:
            "Has incrementat l'exponent correctament, però has oblidat dividir pel nou exponent (n+1).",
        wrong_divisor:
            "Has dividit, però per n (l'exponent original) en lloc de per (n+1) (el nou exponent).",
        wrong_exp:
            "El divisor és correcte, però l'exponent no s'ha incrementat. " +
            "Recorda: en integrar, l'exponent puja de n a n+1.",
        derivative:
            "Has aplicat la derivada (exponent baixa: n → n−1) en lloc de la integral (exponent puja: n → n+1).",
        no_primitive:
            "Aquesta és la funció original, no la seva primitiva.",
        multiply_not_divide:
            "Has multiplicat per (n+1) en lloc de dividir. La regla és ∫x^n dx = x^{n+1}/(n+1).",
    },

    // ------------------------------------------------------------------
    // EXPONENCIAL  ∫e^{kx}
    // ------------------------------------------------------------------
    exp: {
        forgot_coef:
            "Has obtingut e^{kx}, però falta el factor (1/k). Recorda: ∫e^{kx} dx = (1/k)·e^{kx}.",
        derivative:
            "Has multiplicat per k (derivada) en lloc de dividir per k (integral). " +
            "∫e^{kx} dx = (1/k)·e^{kx}, no k·e^{kx}.",
        double_int:
            "Has dividit per k dues vegades (per k²). La integral d'e^{kx} divideix per k una sola vegada.",
        power_rule:
            "No apliquis la regla de la potència a l'exponencial. " +
            "L'exponent de e^{kx} no s'incrementa en integrar; el que canvia és el coeficient.",
        no_primitive:
            "Aquesta és la funció original, no la seva primitiva.",
    },

    // ------------------------------------------------------------------
    // GENÈRIC (usat en múltiples famílies)
    // ------------------------------------------------------------------
    no_primitive:    "Aquesta és la funció original, no la seva primitiva.",
};

// ============================================================================
// API PÚBLICA
// ============================================================================
return { Hints, Correct, Feedback };

})();
