/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/exercise-codes.js
 * ROL: Taula ÚNICA de codis d'exercici (camp EE del codi de verificació v2).
 * ARQUITECTURA:
 * - La fan servir game-core.js (per GENERAR el codi) i analitzador-stepquiz.html
 *   (per DESCODIFICAR-lo). Com que tots dos llegeixen aquest fitxer, no es
 *   poden desincronitzar.
 * - Quan s'afegeix un exercici nou, només cal afegir-lo AQUÍ. La clau és el
 *   nom del fitxer HTML sense ".html"; el valor, 2 lletres majúscules que no
 *   estiguin ja fetes servir (ni tampoc "CB", reservat per al projecte cb).
 * - Els codis no s'han de canviar mai: l'analitzador els necessita per llegir
 *   els codis antics que els alumnes ja han enviat.
 * - Mòdul ES: game-core.js i l'analitzador l'importen
 *     import { EXERCISE_CODES } from './exercise-codes.js';
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const EXERCISE_CODES = {
    // ESO
    'enters': 'EN',
    'enters-ordenar': 'EO',
    'fraccions': 'FR',
    'equacions': 'EQ',
    'equacions-segon-grau': 'SG',
    'expressions-algebraiques': 'EA',
    'identitats-notables': 'IN',
    'fraccio-decimal-percentatge': 'FD',
    'percentatges': 'PE',
    'canvi-unitats': 'CU',
    'arees-volums': 'AV',
    'recta': 'RC',
    'parabola': 'PA',
    'grafiques-context': 'GX',
    'sistemes-equacions': 'SE',
    'mcd-mcm': 'MC',
    'potencies': 'PT',
    'factoritzar': 'FA',
    'radicals': 'RA',
    'recta-numerica': 'RN',
    'area-perimetre': 'AP',
    'pla-cartesia': 'PC', // pla-cartesia.js genera el codi pel seu compte (seccions triades per l'alumne)
    'proporciodirecta': 'PR',
    'decimals': 'DI',
    'vocabulari': 'VO', // vocabulari.js genera el codi pel seu compte ('VO')
    'probabilitat': 'PB',
    'estadistica': 'ED',
    'mitjana': 'MJ',
    'estadistica-inversa': 'EI',
    'grafics-estadistics': 'GE',
    'gots-fitxes': 'GC',
    'prioritat': 'PO',
    'llenguatge-algebraic': 'LA',
    'triangle-rectangle': 'TR',
    'raons-trigonometria': 'RT',
    'teorema-sin-cos': 'TC',
    'formules-steam': 'FS', // reservat: no genera codi (senseCodi, decisió del David, 17/11/2026)
    'inequacions': 'IQ',
    // Batxillerat
    'asimptotes': 'AS', // asimptotes.js genera el codi pel seu compte (no fa servir game-core.js)
    // Batxillerat (codis reservats: aquestes activitats ara no generen codi,
    // però es mantenen perquè l'analitzador pugui llegir codis antics;
    // derivades i integrals en van donar fins al 14/11/2026)
    'derivades': 'DV',
    'integrals': 'IT',
    'complexos': 'CX',
    'ruffini': 'RU',
    'grafica-i-funcio': 'GF',
    'grafica-funcio-i-derivada': 'GD',
    'estudi-funcio': 'EF', // reservat: no genera codi (Batxillerat, senseCodi)
    'logaritmes': 'LG', // reservat: no genera codi (Batxillerat, senseCodi)
    'binomial': 'BI', // reservat: no genera codi (Batxillerat, senseCodi)
    'rectes-plans': 'RP',
    'esglaonar-matriu': 'EM',
    'inversa-matriu': 'IM',
    // Adaptades (https://a.step-quiz.net, repositori step-quiz/a)
    'a-enters': 'AE',
    'a-decimals': 'AD',
    'a-diners': 'AN',
    'a-equacions': 'AQ',
    'a-proporciodirecta': 'AO',
    'a-rellotge': 'AR', // cal afegir-lo també a js/game-core.js de step-quiz/a
};

// Lookup invers: codi 2 lletres -> nom exercici
export const EXERCISE_NAMES = Object.fromEntries(Object.entries(EXERCISE_CODES).map(([nom, codi]) => [codi, nom]));

/**
 * El camp D del codi (una xifra) per a les pàgines on no és només «nivell 1-3». Ho fa servir
 * l'analitzador per escriure'l; les altres pàgines: 0 = sense nivell, n = «Nivell n».
 *   IQ (Inequacions): 0 primer grau (progressiu), 1-4 primer grau nivell 1-4; 5 de 2n grau i
 *      racionals (progressiu), 6-8 de 2n grau i racionals nivell 1-3 (lliurament 22c).
 */
export const ETIQUETES_DIFICULTAT = {
    IQ: {
        0: '1r grau',
        1: '1r grau, nivell 1',
        2: '1r grau, nivell 2',
        3: '1r grau, nivell 3',
        4: '1r grau, nivell 4',
        5: '2n grau i racionals',
        6: '2n grau i racionals, nivell 1',
        7: '2n grau i racionals, nivell 2',
        8: '2n grau i racionals, nivell 3',
    },
};

/** El text del camp D d'un codi: '' si no n'hi ha (0 a les pàgines sense etiquetes pròpies). */
export function etiquetaDificultat(exCode, d) {
    const propies = ETIQUETES_DIFICULTAT[exCode];
    if (propies) return propies[d] || `Nivell ${d}`;
    return d > 0 ? `Nivell ${d}` : '';
}
