/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/parabola/strings.js
 * ROL: Textos de «La paràbola» (parabola.html). Els passos dels talls amb l'eix X
 *      són els d'«Equacions de 2n grau» (amb els seus textos); els missatges dels
 *      errors són a errors.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_PA = {
    element: 'Paràbola',
    problema: {
        dibuixar: 'Dibuixa aquesta paràbola.',
        llegir: "Troba l'expressió de la paràbola de la quadrícula.",
    },
    enunciat: {
        obertura: 'Cap on obre la paràbola?',
        vertex: 'Calcula el vèrtex.',
        tallY: "On talla l'eix Y?",
        talls: "Ara, els talls amb l'eix X: resol l'equació y = 0.",
        punts: 'Situa a la quadrícula el vèrtex i els talls amb els eixos (toca-la). Amb tres punts ja es veu la paràbola.',
        tallsX: "On talla l'eix X?",
        a: 'Calcula a amb el tall amb l’eix Y.',
        expressio: "Desenvolupa-la i escriu l'expressió.",
    },
    nomPas: {
        obertura: 'obertura',
        vertex: 'vèrtex',
        tallY: "tall amb l'eix Y",
        punts: 'situar els punts',
        tallsX: "talls amb l'eix X",
        a: 'coeficient a',
        expressio: 'expressió',
    },
    obertura: { amunt: 'Cap amunt (∪)', avall: 'Cap avall (∩)' },
};
