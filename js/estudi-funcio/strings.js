/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/estudi-funcio/strings.js
 * ROL: Textos d'«Estudi d'una funció»: consignes dels passos, opcions i el perquè
 *      de cada error (ERRORS_EF: etiqueta curta per a l'historial i missatge).
 *      Les fórmules van entre $…$ (KaTeX).
 * ============================================================================
 */

export const TEXTOS_EF = {
    element: 'Funció',
    enunciat: {
        domini: 'On no existeix $f(x)$? Mira on s’anul·la el denominador.',
        d1: "Tria la derivada $f'(x)$.",
        zeros1: "Per a quins valors de $x$ s’anul·la $f'(x)$?",
        taula1: "Omple la taula de signes de $f'$: a cada interval, escriu un punt de prova (un enter de dins de l’interval) i toca el signe que hi té $f'$. A cada punt, $0$ si $f'$ s’hi anul·la o $\\nexists$ si $f$ no hi existeix.",
        taula1f:
            'Ara la fila de $f$: a cada interval, toca si $f$ creix ↗ o decreix ↘; a cada punt, si és un màxim, un mínim, cap de les dues coses o si $f$ no hi existeix.',
        extrems: 'Calcula la $y$ de cada extrem relatiu: substitueix-hi la $x$ a $f(x)$.',
        grafica: 'Quina d’aquestes gràfiques és la de $f$? Ha de quadrar amb la taula.',
        d2: "Tria la segona derivada $f''(x)$.",
        zeros2: "Per a quins valors de $x$ s’anul·la $f''(x)$?",
        taula2: "La taula de signes de $f''$: a cada interval, un punt de prova (un enter de dins) i el signe de $f''$; a cada punt, $0$ o $\\nexists$.",
        taula2f:
            "La fila de $f$: a cada interval, toca la concavitat ($\\cup$ si $f'' > 0$, $\\cap$ si $f'' < 0$); a cada punt, si és un punt d’inflexió.",
    },
    nomPas: {
        domini: 'domini',
        d1: "f'",
        zeros1: "zeros de f'",
        taula1: "signe de f'",
        taula1f: 'creixement',
        extrems: 'extrems',
        grafica: 'gràfica',
        d2: "f''",
        zeros2: "zeros de f''",
        taula2: "signe de f''",
        taula2f: 'concavitat',
    },
    nota: {
        extrems: 'Si el resultat és un nombre enter, deixa el denominador en blanc.',
    },
    files: {
        x: 'x',
        prova: 'Punt de prova',
        s1: 'Signe de f′',
        s2: 'Signe de f″',
        f: 'f',
    },
    // Etiquetes de les cel·les de la taula (el valor intern → el que es veu)
    celles: {
        'mes': '+',
        'menys': '−',
        'zero': '0',
        'no': '∄',
        'creix': '↗',
        'decreix': '↘',
        'max': 'Màx',
        'min': 'Mín',
        'cap': 'Cap',
        'conc+': '∪',
        'conc-': '∩',
        'inf': 'Inflexió',
    },
    opcions: {
        cap: 'Cap valor: no s’anul·la mai',
        capDomini: 'Cap: $f$ existeix per a tot $x$',
        i: 'i',
        grafica: lletra => `Gràfica ${lletra}`,
    },
    opcional: {
        pregunta: "Vols estudiar també la concavitat i els punts d’inflexió (amb $f''$)?",
        si: 'Sí, continuo amb f″',
        no: 'No, ja n’hi ha prou',
        resum: '\\text{Creixement i extrems de } f',
    },
    linia: {
        creix: '\\text{Creix a }',
        decreix: '\\text{decreix a }',
        sempreCreix: '\\text{Creix a tot el domini}',
        sempreDecreix: '\\text{Decreix a tot el domini}',
        i: '\\text{ i }',
        maxim: '\\text{Màxim relatiu: }',
        minim: '\\text{Mínim relatiu: }',
        capExtrem: '\\text{No té extrems relatius}',
        concUp: '\\cup \\text{ a }',
        concDown: '\\cap \\text{ a }',
        sempreUp: '\\cup \\text{ a tot el domini}',
        sempreDown: '\\cap \\text{ a tot el domini}',
        inflexio: '\\text{Punt d’inflexió: }',
        inflexions: '\\text{Punts d’inflexió: }',
        capInflexio: '\\text{No té punts d’inflexió}',
        noZeros: d => `${d}(x) \\neq 0 \\text{ per a tot } x`,
    },
};

/** Per a cada error: etiqueta (historial) i missatge (el perquè, a l'alumne). */
export const ERRORS_EF = {
    // Domini
    EF_DOM_NUM: {
        etiqueta: 'zeros del numerador',
        missatge:
            'Aquests valors anul·len el numerador: allà f val 0, però existeix. Una fracció no existeix on s’anul·la el denominador.',
    },
    EF_DOM_SIGNE: {
        etiqueta: 'signe de les arrels del denominador',
        missatge: 'Revisa el signe: si el denominador és x − c, s’anul·la a x = c, no a x = −c.',
    },
    EF_DOM_CAP: {
        etiqueta: 'domini sense excloure punts',
        missatge: 'Iguala el denominador a 0: hi ha valors de x que l’anul·len, i allà f no existeix.',
    },
    EF_DOM_ARREL: {
        etiqueta: 'x² = −k',
        missatge: 'x² + k = 0 no té solució real (un quadrat no pot ser negatiu): el denominador no s’anul·la mai.',
    },
    EF_DOM_ALTRE: { etiqueta: 'domini', missatge: 'Iguala el denominador a 0 i resol l’equació.' },
    // Derivades: polinomis
    EF_D_NO_MULT: {
        etiqueta: 'sense multiplicar per l’exponent',
        missatge: 'La derivada de axⁿ és n·a·xⁿ⁻¹: l’exponent baixa multiplicant i es resta 1.',
    },
    EF_D_NO_BAIXA: {
        etiqueta: 'exponent sense restar 1',
        missatge: 'Has multiplicat per l’exponent, però l’exponent nou és n − 1: (x³)′ = 3x², no 3x³.',
    },
    EF_D_CONST: {
        etiqueta: 'constant no derivada',
        missatge: 'La derivada d’un nombre sol (el terme independent) és 0.',
    },
    EF_D_SIGNE: { etiqueta: 'signe d’un terme', missatge: 'Revisa el signe de cada terme: es conserva en derivar.' },
    // Derivades: quocient
    EF_Q_SUMA: {
        etiqueta: 'quocient amb +',
        missatge: 'La regla del quocient porta un menys: (u/v)′ = (u′·v − u·v′)/v².',
    },
    EF_Q_ORDRE: {
        etiqueta: 'quocient a l’inrevés',
        missatge: 'L’ordre importa: primer u′·v i després u·v′. (u/v)′ = (u′·v − u·v′)/v².',
    },
    EF_Q_QUADRAT: {
        etiqueta: 'denominador sense el quadrat',
        missatge: 'El denominador de la derivada és v², el denominador elevat al quadrat.',
    },
    EF_Q_SEPARAT: {
        etiqueta: 'u′/v′',
        missatge: 'Un quocient no es deriva dalt i baix per separat: (u/v)′ = (u′·v − u·v′)/v².',
    },
    EF_Q2_FACTOR2: {
        etiqueta: 'falta el 2 de (v²)′',
        missatge: 'En derivar el denominador v², la regla de la cadena hi posa un 2: (v²)′ = 2·v·v′.',
    },
    EF_Q2_SIGNE: {
        etiqueta: 'signe en derivar f′',
        missatge: 'Torna a aplicar la regla del quocient a f′, amb el menys: (u′·v − u·v′)/v².',
    },
    EF_Q2_EXP: {
        etiqueta: 'exponent del denominador',
        missatge: 'Després de simplificar el factor comú del numerador, el denominador queda elevat a 3, no a 4.',
    },
    EF_Q2_DEN2: {
        etiqueta: 'denominador de f″',
        missatge: 'Si f′ té (Q)² al denominador, f″ en té (Q)³ un cop simplificada.',
    },
    // Zeros
    EF_Z_SIGNE: {
        etiqueta: 'signe dels zeros',
        missatge:
            'Revisa els signes: si f′ té el factor (x − 1), s’anul·la a x = 1. Substitueix-hi els valors per comprovar-ho.',
    },
    EF_Z_FORA: {
        etiqueta: 'punt fora del domini com a zero',
        missatge:
            'On s’anul·la el denominador, f′ no existeix (no val 0). Una fracció val 0 on s’anul·la el numerador.',
    },
    EF_Z_DE_F: {
        etiqueta: 'zeros de f en lloc de f′',
        missatge: 'Aquests són els valors on s’anul·la f. Has d’igualar a 0 la derivada f′, no la funció.',
    },
    EF_Z_FALTA: {
        etiqueta: 'falta un zero',
        missatge: 'Te n’has deixat algun. Resol l’equació sencera (treu factor comú si cal).',
    },
    EF_Z_CAP: {
        etiqueta: 'no ha trobat els zeros',
        missatge: 'Sí que s’anul·la. Iguala el numerador a 0 i resol l’equació.',
    },
    EF_Z_ARREL: {
        etiqueta: 'arrel quadrada oblidada',
        missatge: 'Si x² = k, llavors x = ±√k: no t’oblidis de l’arrel quadrada.',
    },
    EF_Z_IMAGINARI: {
        etiqueta: 'x² = −k',
        missatge: 'Un quadrat no pot ser negatiu: aquesta equació no té cap solució real.',
    },
    EF_Z_ZERO: {
        etiqueta: 'x = 0 sense motiu',
        missatge: 'Substitueix x = 0 a la derivada: no dona 0.',
    },
    EF_Z_ALTRE: { etiqueta: 'zeros', missatge: 'Iguala la derivada a 0 i resol l’equació. Comprova-ho substituint.' },
    // Taula de signes
    EF_T_PROVA: {
        etiqueta: 'punt de prova fora de l’interval',
        missatge: 'El punt de prova ha de ser dins de l’interval (sense els extrems). Mira les caselles marcades.',
    },
    EF_T_SIGNE_F: {
        etiqueta: 'signe de f en lloc de f′',
        missatge:
            'Aquests són els signes de f. A la taula hi va el signe de la derivada: substitueix el punt de prova a f′.',
    },
    EF_T_SIGNE_D1: {
        etiqueta: 'signe de f′ en lloc de f″',
        missatge:
            'Aquests són els signes de f′. En aquesta taula hi va el signe de f″: substitueix el punt de prova a f″.',
    },
    EF_T_FORA_ZERO: {
        etiqueta: '0 en un punt fora del domini',
        missatge: 'En aquest punt la funció no existeix (s’anul·la el denominador): hi va ∄, no 0.',
    },
    EF_T_ZERO_NO: {
        etiqueta: '∄ en un zero',
        missatge: 'En aquest punt f existeix i la derivada val 0: hi va 0.',
    },
    EF_T_SIGNE: {
        etiqueta: 'signe equivocat',
        missatge: 'Substitueix el punt de prova a la derivada i mira’n el signe: és el de tot l’interval.',
    },
    EF_T_FLETXA: {
        etiqueta: 'fletxa contrària al signe',
        missatge: 'Si f′ > 0, f creix (↗); si f′ < 0, decreix (↘). Mira la fila del signe.',
    },
    EF_T_SENSE_CANVI: {
        etiqueta: 'extrem sense canvi de signe',
        missatge:
            'Que f′ valgui 0 no n’hi ha prou: hi ha extrem només si f′ canvia de signe. Aquí, a banda i banda té el mateix signe.',
    },
    EF_T_MAX_MIN: {
        etiqueta: 'màxim i mínim intercanviats',
        missatge: 'Si f creix i després decreix (↗ ↘) és un màxim; si decreix i després creix (↘ ↗), un mínim.',
    },
    EF_T_FORA_EXTREM: {
        etiqueta: 'extrem en un punt fora del domini',
        missatge: 'On f no existeix no hi pot haver cap extrem ni cap inflexió: hi va ∄.',
    },
    EF_T_OBLIDAT: {
        etiqueta: 'extrem oblidat',
        missatge: 'Aquí f′ canvia de signe i f existeix: hi ha un extrem (o una inflexió).',
    },
    EF_T_CONCAVITAT: {
        etiqueta: 'concavitat al revés',
        missatge: 'Si f″ > 0, f és còncava cap amunt (∪); si f″ < 0, cap avall (∩).',
    },
    EF_T_INF_SENSE_CANVI: {
        etiqueta: 'inflexió sense canvi de concavitat',
        missatge: 'Hi ha punt d’inflexió només si f″ canvia de signe (i f hi existeix).',
    },
    EF_T_ALTRE: { etiqueta: 'taula', missatge: 'Revisa les caselles marcades.' },
    // Extrems
    EF_Y_DERIVADA: {
        etiqueta: 'y calculada amb f′',
        missatge: 'Has substituït a f′ (que val 0 a l’extrem). La y del punt és f(x): substitueix a la funció.',
    },
    EF_Y_ALTRE: {
        etiqueta: 'valor de f',
        missatge: 'Substitueix la x a f(x) i opera amb compte (potències i signes).',
    },
    // Gràfica
    EF_G_INVERS: {
        etiqueta: 'gràfica amb el creixement al revés',
        missatge: 'Aquesta gràfica creix on f decreix: els màxims hi són mínims. Mira la fila de f de la taula.',
    },
    EF_G_MIRALL: {
        etiqueta: 'gràfica amb els extrems a lloc',
        missatge: 'Mira on són els extrems i les asímptotes: aquesta gràfica els té en unes altres x.',
    },
    EF_G_DESPLACADA: {
        etiqueta: 'gràfica desplaçada',
        missatge: 'Els extrems d’aquesta gràfica no són a les x de la taula.',
    },
};
