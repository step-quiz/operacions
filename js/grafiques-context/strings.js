/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafiques-context/strings.js
 * ROL: Textos de «Gràfiques en context» (grafiques-context.html): el nom de
 *      l'element, de cada mena de gràfica i de cada tipus de pregunta (per a
 *      l'historial). Les històries i els enunciats, amb les dades, són a
 *      math-engine.js; els missatges dels errors, a errors.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_GX = {
    element: 'Gràfica',

    menes: {
        segments: 'Gràfica de segments',
        temperatura: "Temperatura d'un dia",
        forma: 'Corba que accelera o frena',
    },

    noms: {
        'valor': 'llegir un valor',
        'antiimatge': 'quan val…',
        'maxim-valor': 'valor màxim',
        'maxim-instant': 'quan és màxim',
        'minim-valor': 'valor mínim',
        'minim-instant': 'quan és mínim',
        'aturat': 'quanta estona no canvia',
        'increment': 'quant canvia en un interval',
        'creix': 'on creix',
        'decreix': 'on decreix',
        'rapid': 'on canvia més de pressa',
        'forma': 'com canvia',
        'velocitat': 'velocitat (ritme)',
        'domini-recorregut': 'domini i recorregut',
        'afirmacions': 'afirmació certa',
        'relat': 'quina gràfica és',
    },
};
