/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/inequacions/strings.js
 * ROL: Textos d'«Inequacions» (inequacions.html): consignes dels passos (amb les
 *      fórmules entre $…$, que el joc de passos dibuixa amb KaTeX) i notes. Els missatges
 *      dels errors són a errors.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const nombre = n => (n < 0 ? `$-${-n}$` : `$${n}$`);

export const TEXTOS_IQ = {
    element: 'Inequació',
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
