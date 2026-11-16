/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/arees-volums/errors.js
 * ROL: Taxonomia d'errors d'«Àrees i volums» i diagnòstic de cada resposta incorrecta
 *      (el mateix contracte que js/canvi-unitats/errors.js). Cada pas porta, a
 *      dades.distractors, els valors (o les opcions) que donen els errors típics
 *      (math-engine.js); aquí es diu què vol dir cadascun.
 * Mòdul pur: es prova a tests/arees-volums.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

export const ERRORS_AV = {
    // Base i altura
    ALTURA_INCLINADA: {
        etiqueta: 'costat inclinat com a altura',
        missatge:
            "L'altura és perpendicular a la base (la línia discontínua, amb l'angle recte): el costat inclinat és més llarg i no és l'altura.",
    },
    BASE_ALTURA: {
        etiqueta: 'base i altura confoses',
        missatge:
            "La base és el costat on es recolza la figura, i l'altura, la línia perpendicular a la base (la discontínua, amb l'angle recte).",
    },
    BASE_COSTAT: {
        etiqueta: 'la base no és on cau l’altura',
        missatge: "La base és el costat on cau l'altura, el que té la marca de l'angle recte.",
    },
    BASES: {
        etiqueta: 'bases del trapezi',
        missatge: 'Les bases del trapezi són els dos costats paral·lels: el de baix i el de dalt.',
    },
    COSTAT_DIAGONAL: {
        etiqueta: 'costat en lloc de diagonal',
        missatge:
            "L'àrea del rombe es calcula amb les diagonals (les línies discontínues que van d'un vèrtex a l'oposat), no amb el costat.",
    },
    // Fórmules
    OBLIDA_MEITAT: {
        etiqueta: 'falta dividir entre 2',
        missatge:
            'Falta dividir entre 2: el triangle és la meitat del rectangle de la mateixa base i altura, el rombe i el trapezi també porten «: 2», i el semicercle és la meitat del cercle.',
    },
    MEITAT_DE_MES: {
        etiqueta: 'dividit entre 2 de més',
        missatge: "El paral·lelogram no es divideix entre 2: la seva àrea és base · altura, com la d'un rectangle.",
    },
    NOMES_UNA_BASE: {
        etiqueta: 'només una base',
        missatge: 'A la fórmula del trapezi hi van les dues bases: (base gran + base petita) · altura : 2.',
    },
    AREA_PERIMETRE: {
        etiqueta: 'perímetre en lloc d’àrea',
        missatge:
            "Això és la mida de la vora (el perímetre, o la longitud de la circumferència, 2 · π · r), no la de la superfície de dins: l'àrea.",
    },
    RADI_DIAMETRE: {
        etiqueta: 'radi i diàmetre',
        missatge: 'A la fórmula hi va el radi, que és la meitat del diàmetre (r = d : 2).',
    },
    QUADRAT: {
        etiqueta: 'falta elevar al quadrat',
        missatge: 'El radi (o el costat) va al quadrat: r² = r · r.',
    },
    SUMA_RESTA: {
        etiqueta: 'sumar o restar',
        missatge:
            "Mira la figura: si està feta de dues parts juntes, les àrees se sumen; si a una figura li falta un tros (un forat, una cantonada), l'àrea del tros es resta.",
    },
    UNITAT: {
        etiqueta: 'unitat equivocada',
        missatge:
            'Les longituds es mesuren en cm (o dm, m…), les àrees en unitats quadrades (cm²) i els volums en unitats cúbiques (cm³).',
    },
    // Cossos
    CARES_LATERALS: {
        etiqueta: 'falten cares laterals',
        missatge:
            "Compta totes les cares del voltant: l'ortoedre en té 4 i la piràmide quadrangular, 4 triangles. L'àrea lateral és la suma de totes.",
    },
    OBLIDA_BASES: {
        etiqueta: 'falten les bases',
        missatge:
            "L'àrea total és la lateral més la de les bases: el prisma i el cilindre en tenen dues (a dalt i a baix); la piràmide i el con, una.",
    },
    DUES_BASES: {
        etiqueta: 'una base de més',
        missatge: 'La piràmide i el con només tenen una base: l’àrea total és la lateral més una base.',
    },
    LATERAL_AMB_ALTURA: {
        etiqueta: 'altura en lloc d’apotema',
        missatge:
            "Per a l'àrea lateral cal l'altura de cada cara (l'apotema de la piràmide) o la generatriu del con, que són inclinades: no l'altura del cos.",
    },
    LONGITUD_CIRCUMFERENCIA: {
        etiqueta: 'longitud de la circumferència',
        missatge:
            'Desplegada, la cara lateral del cilindre és un rectangle: la base és la longitud de la circumferència, 2 · π · r (no π · r), i l’altura, la del cilindre.',
    },
    LATERAL_CON: {
        etiqueta: 'lateral del con',
        missatge:
            "L'àrea lateral del con és π · r · g: desplegada és un sector circular, no un rectangle com al cilindre (no hi ha el 2).",
    },
    APOTEMA_ALTURA: {
        etiqueta: 'apotema o generatriu com a altura',
        missatge:
            "L'altura del cos va del vèrtex al centre de la base, perpendicular (amb l'angle recte). L'apotema de la piràmide i la generatriu del con són inclinades.",
    },
    OBLIDA_TERC: {
        etiqueta: 'falta dividir entre 3',
        missatge:
            'El volum de la piràmide i del con és la tercera part del del prisma i del cilindre (: 3), i el de l’esfera és 4 · π · r³ : 3.',
    },
    TERC_DE_MES: {
        etiqueta: 'dividit entre 3 de més',
        missatge: 'El prisma i el cilindre no es divideixen entre 3: el volum és àrea de la base · altura.',
    },
    AREA_VOLUM: {
        etiqueta: 'àrea i volum barrejats',
        missatge:
            "L'àrea mesura la superfície (unitats quadrades) i el volum, l'espai de dins (unitats cúbiques): el volum és àrea de la base · altura.",
    },
    ESFERA: {
        etiqueta: 'fórmula de l’esfera',
        missatge: "L'àrea de l'esfera és 4 · π · r² i el volum, 4 · π · r³ : 3.",
    },
};

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaAV(pas, valors) {
    try {
        const errorType = errorPerDistractors(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_AV[errorType] } : null;
    } catch (e) {
        return null;
    }
}
