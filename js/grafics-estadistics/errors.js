/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafics-estadistics/errors.js
 * ROL: Taxonomia d'errors de «Gràfics estadístics» i diagnòstic de cada resposta
 *      incorrecta. Cada pas porta, a dades.distractors, els valors (o les opcions
 *      falses) que donen els errors típics (math-engine.js); aquí es diu què vol
 *      dir cadascun.
 * Mòdul pur: es prova a tests/grafics-estadistics.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

export const ERRORS_GE = {
    SENSE_ESCALA: {
        etiqueta: 'sense mirar l’escala',
        missatge: "Has comptat ratlles: mira els números de l'eix vertical, que no van d'1 en 1.",
    },
    SUMA_PER_DIFERENCIA: {
        etiqueta: 'suma en lloc de resta',
        missatge: '«Quants més» és la diferència: es resten els dos valors, no se sumen.',
    },
    NOMES_UN_VALOR: {
        etiqueta: 'només una barra',
        missatge: 'Aquest és el valor d’una sola barra. «Quants més» és la diferència entre les dues.',
    },
    COMPTA_CATEGORIES: {
        etiqueta: 'compta les barres',
        missatge: 'Has comptat les opcions. El total és la suma de totes les respostes (de totes les barres).',
    },
    NOMES_EL_MAXIM: {
        etiqueta: 'només la més alta',
        missatge: 'Aquesta és només la barra més alta: el total és la suma de totes.',
    },
    FREQ_PER_PERCENT: {
        etiqueta: 'freqüència per percentatge',
        missatge: 'Això és quants alumnes. El percentatge és quants de cada 100: freqüència ÷ total · 100.',
    },
    PERCENT_DEL_MAXIM: {
        etiqueta: 'percentatge de la barra més alta',
        missatge: 'El percentatge es calcula sobre el total de respostes, no sobre la barra més alta.',
    },
    MAJORIA: {
        etiqueta: 'la més gran és majoria',
        missatge: 'La més triada no vol dir més de la meitat: per ser majoria ha de passar del 50 %.',
    },
    FREQ_PER_VALOR: {
        etiqueta: 'freqüència per valor',
        missatge:
            "Això és l'altura de la barra (quants alumnes). Es demana el valor: el que hi ha a l'eix horitzontal, sota la barra.",
    },
    VALOR_PER_FREQ: {
        etiqueta: 'valor per freqüència',
        missatge: "Això és el valor de l'eix horitzontal. Es demana quants alumnes: l'altura de la barra.",
    },
    MEDIANA_DE_L_EIX: {
        etiqueta: "el mig de l'eix",
        missatge:
            'La mediana no és el mig de l’eix: és la dada del mig quan les ordenes totes, comptant cada valor tantes vegades com alumnes l’han dit.',
    },
    MODA_PER_MEDIANA: {
        etiqueta: 'moda per mediana',
        missatge: 'Aquesta és la moda (la barra més alta). La mediana és la dada del mig de les dades ordenades.',
    },
    POSICIO_PER_VALOR: {
        etiqueta: 'posició per valor',
        missatge: 'Aquesta és la posició de la dada del mig (quina és), no el seu valor.',
    },
    SUMA_ALTRES: {
        etiqueta: 'la suma dels altres',
        missatge: 'Això és el que sumen els altres sectors. El que falta fins a 100 és 100 menys aquesta suma.',
    },
    PERCENT_PER_FREQ: {
        etiqueta: 'percentatge per freqüència',
        missatge: 'Això és el percentatge. Quants alumnes: percentatge × total ÷ 100.',
    },
    ANGLE_PER_PERCENT: {
        etiqueta: 'graus per percentatge',
        missatge: 'Això són graus. Tot el cercle (360°) és el 100 %: divideix els graus per 3,6.',
    },
    FRACCIO_PER_PERCENT: {
        etiqueta: 'sense multiplicar per 100',
        missatge: 'Això és la part del cercle (graus ÷ 360). Per passar-la a percentatge, multiplica per 100.',
    },
    COMPTA_ICONES: {
        etiqueta: 'compta les icones',
        missatge: 'Has comptat icones. Cada icona val el que diu la llegenda, a sota del pictograma.',
    },
    MITJA_ICONA: {
        etiqueta: 'sense la mitja icona',
        missatge: 'Compta també la mitja icona: val la meitat del que val una icona sencera.',
    },
    INTERVAL_VEI: {
        etiqueta: "l'interval del costat",
        missatge: "Mira bé els límits a l'eix horitzontal: aquesta és la barra de l'interval del costat.",
    },
    NOMES_UNA_BARRA: {
        etiqueta: 'només una barra',
        missatge: 'Has comptat només una barra: cal sumar totes les barres que compleixen la condició.',
    },
    INCLOU_INTERVAL: {
        etiqueta: 'un interval de més',
        missatge: "L'interval que comença en aquest valor ja no és «menys de»: no l'has de sumar.",
    },
    LIMIT_PER_MARCA: {
        etiqueta: 'límit per marca',
        missatge: "Això és un límit de l'interval. La marca de classe és el punt del mig: (a + b) ÷ 2.",
    },
    EIX_TALLAT: {
        etiqueta: 'eix tallat',
        missatge:
            "L'eix vertical no comença a 0, i per això les barres exageren la diferència. Llegeix els valors a l'eix.",
    },
    ESCALA_IRREGULAR: {
        etiqueta: 'escala irregular',
        missatge:
            "Les ratlles de l'eix són a la mateixa distància però no valen el mateix (0, 10, 20, 50…): les altures enganyen. Divideix els valors.",
    },
    AREA_PICTOGRAMA: {
        etiqueta: 'àrea per valor',
        missatge:
            'El dibuix gran és més alt i també més ample: la seva àrea creix molt més que el valor. Compara els valors de l’eix, no la mida dels dibuixos.',
    },
};

export function diagnosticaGE(pas, valors) {
    try {
        const errorType = errorPerDistractors(pas, valors || {});
        return errorType && ERRORS_GE[errorType] ? { errorType, ...ERRORS_GE[errorType] } : null;
    } catch (e) {
        return null;
    }
}
