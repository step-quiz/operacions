/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/canvi-unitats/strings.js
 * ROL: Textos de «Canvi d'unitats» (canvi-unitats.html): consignes dels passos,
 *      noms curts per a l'historial i el text de les opcions. Els missatges dels
 *      errors són a errors.js, i els textos comuns del joc, a js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM). Les consignes són funcions de les unitats.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_CU = {
    element: 'Canvi',

    // Noms de les magnituds (per a l'escala i els enunciats)
    magnitud: {
        longitud: 'longitud',
        massa: 'massa',
        capacitat: 'capacitat',
        superficie: 'superfície',
        volum: 'volum',
    },

    // Noms curts dels passos, per a l'historial
    nomPas: {
        equivalencia: 'equivalència',
        salts: 'graons',
        operacio: 'operació',
        resultat: 'resultat',
    },

    enunciat: {
        equivalencia: c => `A quina unitat de volum equival 1 ${c}?`,
        salts: (de, a) => `Per anar de ${de} a ${a} a l'escala, quants graons hi ha i cap on?`,
        operacio: (de, a) => `Per passar de ${de} a ${a}, què has de fer?`,
        resultat: 'Escriu el resultat.',
    },

    // El text d'una opció de graons: «3 graons cap avall»
    salts: (k, avall) => `${k} ${k === 1 ? 'graó' : 'graons'} cap ${avall ? 'avall' : 'amunt'}`,
    // El text d'una opció d'operació: «× 1000» o «: 1000»
    operacio: (multiplica, f) => `${multiplica ? '×' : ':'} ${f}`,

    nota: {
        resultat: 'Escriu el nombre amb coma decimal, si en té.',
    },
};
