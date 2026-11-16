/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/recta/strings.js
 * ROL: Textos de «La recta» (recta.html). Els missatges dels errors són a
 *      errors.js, i els textos comuns del joc, a js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_RC = {
    element: 'Recta',
    problema: {
        llegir: 'Llegeix la recta de la quadrícula.',
        dibuixar: 'Dibuixa aquesta recta.',
        dosPunts: 'Troba l’equació de la recta que passa per A i B.',
        classificar: 'Com és aquesta funció?',
    },
    enunciat: {
        ordenada: "On talla la recta l'eix Y? És l'ordenada a l'origen, n.",
        pendent:
            'Des d’un punt de la recta, avança cap a la dreta: quant puja (o baixa) per cada unitat que avances? És el pendent, m.',
        taula: 'Calcula dos punts de la recta.',
        punts: 'Situa els dos punts a la quadrícula (toca-la; si toques un punt, el treus). Amb dos punts ja es veu la recta.',
        pendentDosPunts: 'Calcula el pendent.',
        ordenadaDosPunts: "Calcula l'ordenada a l'origen.",
        tipus: 'Quin tipus de funció és?',
        creixement: 'Com és?',
    },
    nomPas: {
        ordenada: "ordenada a l'origen",
        pendent: 'pendent',
        taula: 'taula de valors',
        punts: 'situar els punts',
        tipus: 'tipus de funció',
        creixement: 'creixement',
    },
    tipus: {
        proporcional: { opcio: 'Proporcional: y = mx', nom: 'proporcional' },
        afi: { opcio: 'Afí: y = mx + n', nom: 'afí' },
        constant: { opcio: 'Constant: y = n', nom: 'constant' },
    },
    creixement: {
        creixent: 'Creixent',
        decreixent: 'Decreixent',
        constant: 'Ni creixent ni decreixent',
    },
};
