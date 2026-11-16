/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafics-estadistics/strings.js
 * ROL: Textos de «Gràfics estadístics» (grafics-estadistics.html): el nom de
 *      l'element, de cada família de gràfics i de cada tipus de pregunta (per a
 *      l'historial). Els enunciats, amb les dades, són a math-engine.js; els
 *      missatges dels errors, a errors.js; els textos comuns del joc, a js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_GE = {
    element: 'Gràfic',

    families: {
        barres: 'Diagrama de barres',
        sectors: 'Diagrama de sectors',
        pictogrames: 'Pictograma',
        histogrames: 'Histograma',
    },

    noms: {
        'lectura': 'llegir una barra',
        'diferencia': 'quants més',
        'total': 'total',
        'percentatge': 'percentatge',
        'afirmacions': 'afirmació certa',
        'moda': 'moda',
        'mediana': 'mediana',
        'freq': 'freqüència',
        'falta': 'el percentatge que falta',
        'persones': 'del percentatge als alumnes',
        'angle': 'dels graus al percentatge',
        'afirmacions-sectors': 'afirmació certa',
        'icones': 'llegir les icones',
        'icones-total': 'total',
        'icones-diferencia': 'quants més',
        'interval': 'llegir un interval',
        'menys': '«menys de»',
        'percentatge-hist': 'percentatge',
        'marca': 'marca de classe',
        'modal': 'interval modal',
        'eix-tallat': 'eix tallat',
        'escala-irregular': 'escala irregular',
        'area': 'pictograma que creix en àrea',
    },
};
