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
 * - Es defineix amb window.EXERCISE_CODES (i no amb const) a propòsit: si el
 *   navegador d'un alumne encara té a la memòria cau un game-core.js antic
 *   (que declarava `const EXERCISE_CODES`), les dues declaracions no xoquen.
 * DEPENDÈNCIES: Cap. S'ha de carregar ABANS de game-core.js.
 * ============================================================================
 */

window.EXERCISE_CODES = {
    // ESO
    'enters': 'EN',
    'enters-ordenar': 'EO',
    'fraccions': 'FR',
    'equacions': 'EQ',
    'sistemes-equacions': 'SE',
    'mcd-mcm': 'MC',
    'potencies': 'PT',
    'factoritzar': 'FA',
    'radicals': 'RA',
    'recta-numerica': 'RN',
    'area-perimetre': 'AP',
    'pla-cartesia': 'PC', // reservat: ara no genera codi (no mostra "Copiar codi")
    'proporciodirecta': 'PR',
    'decimals': 'DI',
    'vocabulari': 'VO', // vocabulari.js genera el codi pel seu compte ('VO')
    'probabilitat': 'PB',
    'estadistica': 'ED',
    'mitjana': 'MJ',
    'estadistica-inversa': 'EI',
    'gots-fitxes': 'GC',
    'prioritat': 'PO',
    'llenguatge-algebraic': 'LA',
    'triangle-rectangle': 'TR',
    'raons-trigonometria': 'RT',
    'teorema-sin-cos': 'TC',
    // Batxillerat
    'derivades': 'DV',
    'integrals': 'IT',
    // Batxillerat (codis reservats: aquestes activitats ara no generen codi,
    // però es mantenen perquè l'analitzador pugui llegir codis antics)
    'complexos': 'CX',
    'asimptotes': 'AS',
    'ruffini': 'RU',
    'grafica-i-funcio': 'GF',
    'grafica-funcio-i-derivada': 'GD',
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
window.EXERCISE_NAMES = Object.fromEntries(Object.entries(EXERCISE_CODES).map(([nom, codi]) => [codi, nom]));
