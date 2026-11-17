/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/formules-steam/strings.js
 * ROL: Textos de «Fórmules STEAM» (formules-steam.html): consignes dels passos (amb les
 *      lletres entre $…$, que el joc de passos dibuixa amb KaTeX), la pregunta dels passos
 *      amb lletres i l'enllaç a la resolució pas a pas. Els missatges dels errors són a
 *      errors.js. Textos decidits amb el David el 17/11/2026 (artifact de revisió de la
 *      interfície: T1, T2, T3, L1).
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_FS = {
    element: 'Fórmula',
    enunciat: {
        dades: 'A quina lletra va cada dada? Arrossega cada lletra a sota de la seva dada (o toca la lletra i després el requadre).',
        substitucio: 'Substitueix les dades a la fórmula.',
        operacio: x => `Quina operació fas als dos membres per aïllar $${x}$?`,
        equacio: 'Quina equació equivalent obtens?',
        valor: x => `Quant val $${x}$?`,
        unitat: x => `En quina unitat surt $${x}$? Opera amb les unitats com si fossin lletres.`,
        lletres: op => `Amb lletres: ${op[0].toLowerCase()}${op.slice(1)}. Quina equació equivalent obtens?`,
    },
    /** La pregunta entre els nombres i les lletres (pregunta.opcional del joc de passos). */
    opcional: 'Vols saber com es resol la fórmula en general, és a dir, amb lletres?',
    resum: 'Amb nombres:',
    enllac: 'Mira com es resol una fórmula com aquesta ↗',
    nomPas: {
        dades: 'dades',
        substitucio: 'substituir',
        operacio: 'operació',
        equacio: 'equació',
        valor: 'valor',
        unitat: 'unitat',
        lletres: 'amb lletres',
    },
    nota: {
        valor: 'Escriu el nombre amb coma decimal, si cal.',
    },
};
