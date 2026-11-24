/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/strings.js
 * ROL: Textos d'«Inequacions» (inequacions.html): consignes dels passos (amb les
 *      fórmules entre $…$, que el joc de passos dibuixa amb KaTeX) i notes. Els missatges
 *      dels errors són a errors.js. TEXTOS_IQ, primer grau (lliurament 17); TEXTOS_NL,
 *      inequacions de 2n grau i racionals (lliurament 22c).
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const nombre = n => (n < 0 ? `$-${-n}$` : `$${n}$`);

export const TEXTOS_IQ = {
    element: 'Inequació',
    /** L'enllaç a la «Resolució pas a pas» (només primer grau). */
    enllac: 'Mira com es resol una inequació com aquesta ↗',
    enunciat: {
        passaNombre: b => `Passa el ${nombre(b)} a l’altre membre. Escriu els nombres i posa-hi el signe.`,
        passaTot: 'Passa les $x$ a l’esquerra i els nombres a la dreta. Escriu els nombres i posa-hi el signe.',
        distributiva: 'Fes la distributiva al primer membre. Escriu els nombres i posa-hi el signe.',
        ajunta: 'Fes la distributiva i ajunta les $x$. Escriu els nombres i posa-hi el signe.',
        denominadors: (L, m, n) =>
            `Treu els denominadors: multiplica els dos membres per $${L}$, el mcm de $${m}$ i $${n}$. Escriu els nombres i posa-hi el signe.`,
        ailla: 'Aïlla la $x$. Escriu el nombre i posa-hi el signe.',
        recta: ineq => `Marca $${ineq}$ a la recta: toca el nombre, tria si hi entra i cap a quin costat va.`,
        interval: ineq => `Escriu $${ineq}$ com a interval: posa cada peça al seu lloc.`,
    },
    nomPas: {
        passa: 'passar',
        distributiva: 'distributiva',
        ajunta: 'ajuntar',
        denominadors: 'denominadors',
        ailla: 'aïllar',
        recta: 'recta',
        interval: 'interval',
    },
    nota: {
        coeficient: 'Escriu també l’1 i el −1 davant de la x. El signe: arrossega’l (o toca’l i després el requadre).',
        coeficientINombre:
            'El coeficient de la x i el nombre, cadascun amb el seu signe (−6, no 6). Escriu també l’1 i el −1.',
    },
};

// ═════════════════════════════════════════════════════════════════════════════
// INEQUACIONS DE 2n GRAU I RACIONALS (lliurament 22c)
// ═════════════════════════════════════════════════════════════════════════════
export const TEXTOS_NL = {
    subtitol: 'Inequacions de 2n grau i racionals: la taula de signes, la recta i l’interval',
    enunciat: {
        passa: 'Primer, passa-ho tot a l’esquerra: a la dreta hi ha de quedar 0.',
        zeros: eq => `On s’anul·la? Resol $${eq}$.`,
        zerosFraccio: (n, d) => `On s’anul·len el numerador i el denominador? Resol $${n} = 0$ i $${d} = 0$.`,
        zerosTria: eq => `On s’anul·la? Resol $${eq}$.`,
        taula: expr =>
            `Omple la taula de signes de $${expr}$: a cada interval, escriu un punt de prova (un enter de dins) i toca el signe que hi té. A cada punt, $0$ si s’hi anul·la o $\\nexists$ si no hi existeix.`,
        trams: ineq =>
            `Marca la solució de $${ineq}$ a la recta: toca els trams que hi entren i els punts que hi entren (punt ple). Si no en té cap, toca «Cap solució».`,
        interval: ineq => `Quina és la solució de $${ineq}$?`,
    },
    nomPas: {
        passa: 'tot a un costat',
        zeros: 'zeros',
        taula: 'taula de signes',
        trams: 'recta',
        interval: 'interval',
    },
    camps: { x1: 'x_1 =', x2: 'x_2 =', n: '\\text{numerador: } x =', d: '\\text{denominador: } x =' },
    nota: { dues: 'Les dues solucions, en qualsevol ordre.' },
    files: { prova: 'Punt de prova', signe: 'Signe' },
    celles: { mes: '+', menys: '−', zero: '0', no: '∄' },
    opcionsZeros: {
        cap: 'No s’anul·la mai: no té solucions reals',
        doble: a => `Només a $x = ${a}$ (solució doble)`,
        dues: (a, b) => `A $x = ${a}$ i a $x = ${b}$`,
        una: a => `Només a $x = ${a}$`,
    },
};
