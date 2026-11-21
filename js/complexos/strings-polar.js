/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/complexos/strings-polar.js
 * ROL: Textos de les pestanyes «Forma polar» i «Potències i arrels» de
 *      complexos.html: títols dels passos, línies de la resolució, avisos i el
 *      perquè de cada error (ERRORS_CX). TeX entre $…$ als títols.
 * ============================================================================
 */

export const TEXTOS_CX = {
    pestanyes: { polar: 'Forma polar', potencies: 'Potències i arrels' },
    apartats: {
        'bin-pol': 'Binòmica → polar',
        'pol-bin': 'Polar → binòmica',
        'prod-quoc': 'Producte i quocient',
        'barreja-polar': 'Tot barrejat',
        'potencia': 'Potència (De Moivre)',
        'arrels': 'Arrels n-èsimes',
        'barreja-potencies': 'Tot barrejat',
    },
    nivells: { 1: 'Nivell 1: exacte', 2: 'Nivell 2: calculadora' },
    titol: {
        quadrant: 'En quin quadrant és $z$? Toca’l al pla.',
        modul: 'El mòdul: $r = \\sqrt{a^2 + b^2}$',
        argument: 'L’argument, entre $0^{\\circ}$ i $360^{\\circ}$ (mira el quadrant!)',
        argumentEix: 'L’argument, entre $0^{\\circ}$ i $360^{\\circ}$ ($z$ és sobre un eix)',
        binomica: 'Les parts real i imaginària: $a = r\\cos\\theta$, $b = r\\sin\\theta$',
        producte: 'Producte en polar: es multipliquen els mòduls i se sumen els arguments',
        quocient: 'Quocient en polar: es divideixen els mòduls i es resten els arguments',
        moivre: n =>
            `De Moivre: $(r_{\\theta})^{${n}} = (r^{${n}})_{${n}\\theta}$, amb l’argument entre $0^{\\circ}$ i $360^{\\circ}$`,
        potBinomica: 'El resultat en forma binòmica',
        arrelModul: n =>
            `El mòdul de les arrels, $\\sqrt[${n}]{r}$, i l’argument de la primera, $\\theta_0 = \\dfrac{\\theta}{${n}}$`,
        arrelMarques: n =>
            `Les altres ${n - 1} arrels van repartides cada $\\dfrac{360^{\\circ}}{${n}}$: toca-les a la circumferència.`,
    },
    linia: {
        quadrant: q => `z \\text{ és al quadrant ${['', 'I', 'II', 'III', 'IV'][q]}}`,
        arrels: n => `\\text{Les ${n} arrels: }`,
    },
    nota: {
        arrel: 'Si no hi ha arrel, deixa en blanc la casella de dins de √.',
        decimals: 'Amb 2 decimals (coma).',
    },
    avisos: {
        NO_ENTER: 'Escriu un nombre enter.',
        NO_DECIMAL: 'Escriu un nombre amb coma decimal, per exemple 3,61.',
        RADICAND: 'Dins de l’arrel hi va un nombre positiu.',
        SIMPLIFICA: 'El valor és bo, però simplifica l’arrel: treu fora els quadrats (√8 = 2√2).',
    },
    ui: {
        errors: 'errors:',
        comprova: 'Comprova',
        nou: 'Exercici nou',
        correcte: '✅ Correcte!',
        error: '❌ No és correcte.',
    },
};

export const ERRORS_CX = {
    CX_QUADRANT: {
        etiqueta: 'quadrant',
        missatge: 'Mira els signes: a > 0 és a la dreta, a < 0 a l’esquerra; b > 0 a dalt, b < 0 a baix.',
    },
    CX_MODUL_SENSE_ARREL: {
        etiqueta: 'mòdul sense l’arrel',
        missatge: 'Has fet a² + b², però el mòdul és l’arrel quadrada: r = √(a² + b²).',
    },
    CX_MODUL_SUMA: {
        etiqueta: 'mòdul com a suma',
        missatge: 'El mòdul no és a + b: és la distància a l’origen, r = √(a² + b²) (Pitàgores).',
    },
    CX_MODUL: {
        etiqueta: 'mòdul',
        missatge: 'r = √(a² + b²): eleva al quadrat les dues parts (el quadrat sempre és positiu) i fes l’arrel.',
    },
    CX_ARCTAN: {
        etiqueta: 'arctan sense el quadrant',
        missatge:
            'La calculadora fa arctan(b/a) i sempre dona un angle entre −90° i 90°. Si z és al 2n o al 3r quadrant, suma-hi 180°; si és al 4t, suma-hi 360°.',
    },
    CX_REDUEIX: {
        etiqueta: 'argument sense reduir',
        missatge: 'L’angle és bo, però s’ha de donar entre 0° i 360°: suma o resta 360° les vegades que calgui.',
    },
    CX_ARG_INVERS: {
        etiqueta: 'arctan(a/b)',
        missatge: 'L’argument és arctan(b/a): la part imaginària dalt i la real baix.',
    },
    CX_ARGUMENT: {
        etiqueta: 'argument',
        missatge:
            'Dibuixa z al pla i mira l’angle des de l’eix real positiu, en sentit contrari a les agulles del rellotge.',
    },
    CX_SIN_COS: {
        etiqueta: 'sin i cos intercanviats',
        missatge: 'La part real és r·cos θ i la imaginària r·sin θ: has canviat el sinus pel cosinus.',
    },
    CX_SIGNE: {
        etiqueta: 'signe',
        missatge:
            'Els valors són bons però el signe no: mira en quin quadrant és θ (el cosinus és negatiu al 2n i 3r; el sinus, al 3r i 4t).',
    },
    CX_SENSE_MODUL: {
        etiqueta: 'sense multiplicar per r',
        missatge: 'Falta multiplicar pel mòdul: a = r·cos θ i b = r·sin θ.',
    },
    CX_BINOMICA: {
        etiqueta: 'forma binòmica',
        missatge:
            'Calcula a = r·cos θ i b = r·sin θ (amb els valors exactes dels angles notables, o la calculadora en graus).',
    },
    CX_ARG_MULTIPLICA: {
        etiqueta: 'arguments multiplicats',
        missatge: 'En un producte, els arguments se sumen (els mòduls sí que es multipliquen).',
    },
    CX_ARG_DIVIDEIX: {
        etiqueta: 'arguments dividits',
        missatge: 'En un quocient, els arguments es resten (els mòduls sí que es divideixen).',
    },
    CX_ARG_ORDRE: {
        etiqueta: 'resta a l’inrevés',
        missatge: 'L’argument de z₁ : z₂ és θ₁ − θ₂: el del dividend menys el del divisor.',
    },
    CX_MODUL_SUMA_PRODUCTE: {
        etiqueta: 'mòduls sumats',
        missatge: 'Els mòduls es multipliquen; el que se suma són els arguments.',
    },
    CX_MODUL_RESTA_QUOCIENT: {
        etiqueta: 'mòduls restats',
        missatge: 'Els mòduls es divideixen; el que es resta són els arguments.',
    },
    CX_MODUL_OPERACIO: { etiqueta: 'mòdul del resultat', missatge: 'Producte: r₁·r₂. Quocient: r₁ : r₂.' },
    CX_MOIVRE_MODUL_PER_N: {
        etiqueta: 'mòdul per n',
        missatge:
            'Amb De Moivre el mòdul s’eleva a n (rⁿ), no es multiplica per n. És l’argument el que es multiplica.',
    },
    CX_MOIVRE_MODUL: { etiqueta: 'mòdul sense elevar', missatge: 'El mòdul també s’eleva: (r_θ)ⁿ = (rⁿ)_{nθ}.' },
    CX_MOIVRE_POTENCIA: { etiqueta: 'potència del mòdul', missatge: 'Calcula rⁿ amb compte: (√2)⁴ = 4, (√2)³ = 2√2.' },
    CX_MOIVRE_ARGUMENT: {
        etiqueta: 'argument sense multiplicar',
        missatge: 'Has elevat el mòdul, però l’argument també canvia: es multiplica per n.',
    },
    CX_MOIVRE_ARG_POTENCIA: {
        etiqueta: 'argument elevat',
        missatge: 'L’argument no s’eleva: es multiplica per n (nθ).',
    },
    CX_ARREL_MODUL: {
        etiqueta: 'mòdul sense l’arrel',
        missatge: 'El mòdul de les arrels és ⁿ√r, l’arrel n-èsima del mòdul.',
    },
    CX_ARREL_MODUL_DIVIDEIX: {
        etiqueta: 'mòdul dividit per n',
        missatge: 'El mòdul no es divideix per n: se’n fa l’arrel n-èsima (ⁿ√r).',
    },
    CX_ARREL_MODUL_ALTRE: { etiqueta: 'arrel del mòdul', missatge: 'Busca el nombre que elevat a n dona r.' },
    CX_ARREL_SENSE_DIVIDIR: { etiqueta: 'argument sense dividir', missatge: 'L’argument de la primera arrel és θ/n.' },
    CX_ARREL_K0: {
        etiqueta: 'una altra arrel com a primera',
        missatge:
            'Aquest és l’argument d’una altra arrel (has sumat 360° abans de dividir). La primera, k = 0, és θ/n.',
    },
    CX_ARREL_ARGUMENT: { etiqueta: 'argument de l’arrel', missatge: 'θ₀ = θ/n. Les altres: θ₀ + k·360°/n.' },
    CX_ARRELS_POQUES: {
        etiqueta: 'falten arrels',
        missatge: 'Un nombre complex té n arrels n-èsimes: n’hi ha de faltar.',
    },
    CX_ARRELS_MASSA: { etiqueta: 'arrels de més', missatge: 'N’hi ha exactament n: en sobren.' },
    CX_ARRELS_ESPAI: {
        etiqueta: 'arrels mal repartides',
        missatge: 'Les arrels formen un polígon regular: van separades exactament 360°/n, a partir de la primera.',
    },
    CX_ALTRE: { etiqueta: 'error', missatge: 'Revisa el càlcul.' },
};
