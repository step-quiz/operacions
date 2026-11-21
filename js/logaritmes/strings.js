/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/logaritmes/strings.js
 * ROL: Textos de «Logaritmes i equacions» (logaritmes.html), bloc 1, logaritmes:
 *      consignes dels passos (fórmules entre $…$) i el perquè de cada error (ERRORS_LG).
 * ============================================================================
 */

export const TEXTOS_LG = {
    element: 'Exercici',
    enunciat: {
        potencia: (b, x) => `Escriu $${x}$ com a potència de $${b}$.`,
        valor: 'Ara, el logaritme: l’exponent al qual cal elevar la base per obtenir l’argument.',
        aExponencial: 'Escriu la igualtat en forma exponencial: $\\log_a x = y \\iff a^{y} = x$.',
        aLogaritmica: 'Escriu la igualtat en forma logarítmica: $a^{y} = x \\iff \\log_a x = y$.',
        desenvolupa: 'Desenvolupa el logaritme amb les propietats.',
        agrupa: 'Escriu-ho com un sol logaritme.',
        agrupaCalcul: 'Primer, escriu-ho com un sol logaritme.',
        valorCalcul: 'Quant val?',
        signe: 'Sense calcular-lo: aquest logaritme és positiu o negatiu?',
        calculadora: 'Calcula’l amb la calculadora (4 decimals).',
    },
    nomPas: {
        potencia: 'potència',
        valor: 'logaritme',
        forma: 'forma',
        propietats: 'propietats',
        agrupa: 'un sol logaritme',
        valorCalcul: 'valor',
        signe: 'signe',
        calculadora: 'calculadora',
    },
    nota: {
        racional: 'Si és una fracció, escriu-la a dalt i a baix; si és un enter, deixa el denominador en blanc.',
        decimals: 'Amb 4 decimals i coma: 0,69897 → 0,6990.',
    },
    opcions: { positiu: 'Positiu', negatiu: 'Negatiu' },
};

export const ERRORS_LG = {
    LG_SIGNE: {
        etiqueta: 'signe de l’exponent',
        missatge:
            'Un nombre més petit que 1 (com 1/9 o 0,01) és una potència d’exponent negatiu: 1/9 = 3⁻², 0,01 = 10⁻².',
    },
    LG_INVERS: {
        etiqueta: 'exponent invertit',
        missatge:
            'Mira quina és la base: si 4 = 2², llavors 2 = 4^(1/2). Escriu l’argument com a potència de la base, no al revés.',
    },
    LG_DIVIDEIX: {
        etiqueta: 'argument dividit per la base',
        missatge: 'El logaritme no és una divisió: log₂ 8 = 3 perquè 2³ = 8 (no 8 : 2).',
    },
    LG_ARGUMENT: {
        etiqueta: 'l’argument com a resultat',
        missatge: 'El logaritme és l’exponent: logₐ x = y vol dir aʸ = x. La resposta és y, no x.',
    },
    LG_DEFINICIO: {
        etiqueta: 'definició',
        missatge: 'logₐ x = y ⟺ aʸ = x: busca a quin exponent cal elevar la base per obtenir l’argument.',
    },
    LG_FORMA: {
        etiqueta: 'base i exponent intercanviats',
        missatge: 'La base del logaritme és la base de la potència: logₐ x = y ⟺ aʸ = x.',
    },
    LG_FORMA_ALTRE: {
        etiqueta: 'forma',
        missatge:
            'logₐ x = y ⟺ aʸ = x: la base es queda, el resultat del logaritme és l’exponent i l’argument és el resultat de la potència.',
    },
    LG_SUMA: {
        etiqueta: 'log(a + b) = log a + log b',
        missatge:
            'No hi ha cap propietat per al logaritme d’una suma: log(a·b) = log a + log b, però log(a + b) no es pot separar.',
    },
    LG_RESTA: {
        etiqueta: 'log(a − b) = log a − log b',
        missatge: 'La resta de logaritmes és el logaritme d’un quocient: log a − log b = log(a/b), no log(a − b).',
    },
    LG_PRODUCTE_LOGS: {
        etiqueta: 'log(a·b) = log a · log b',
        missatge: 'El logaritme d’un producte és la suma dels logaritmes: log(a·b) = log a + log b (no el producte).',
    },
    LG_QUOCIENT_LOGS: {
        etiqueta: 'log(a/b) = log a / log b',
        missatge: 'El logaritme d’un quocient és la resta: log(a/b) = log a − log b (no la divisió de logaritmes).',
    },
    LG_POTENCIA: {
        etiqueta: 'log aⁿ = (log a)ⁿ',
        missatge: 'L’exponent baixa multiplicant: log aⁿ = n·log a. (log a)ⁿ és una altra cosa.',
    },
    LG_QUOCIENT_SIGNE: {
        etiqueta: 'el denominador amb +',
        missatge: 'El que divideix resta: log(a/b) = log a − log b.',
    },
    LG_COEF: {
        etiqueta: 'el coeficient multiplica l’argument',
        missatge: 'Un nombre davant del logaritme és un exponent de l’argument: n·log a = log aⁿ (no log(n·a)).',
    },
    LG_ORDRE: {
        etiqueta: 'quocient a l’inrevés',
        missatge: 'log a − log b = log(a/b): el que resta va a baix.',
    },
    LG_VALOR: {
        etiqueta: 'valor del logaritme',
        missatge: 'Ara només cal la definició: busca l’exponent al qual cal elevar la base per obtenir l’argument.',
    },
    LG_SIGNE_CALC: {
        etiqueta: 'signe del logaritme',
        missatge:
            'Si la base és més gran que 1, el logaritme d’un nombre més gran que 1 és positiu i el d’un nombre entre 0 i 1, negatiu.',
    },
    LG_LN_LOG: {
        etiqueta: 'ln en lloc de log (o al revés)',
        missatge: 'log és el logaritme en base 10 (tecla log) i ln, el neperià, en base e (tecla ln).',
    },
    LG_CALC: {
        etiqueta: 'calculadora',
        missatge: 'Torna-ho a calcular amb la tecla que toca (log o ln) i arrodoneix a 4 decimals.',
    },
};
