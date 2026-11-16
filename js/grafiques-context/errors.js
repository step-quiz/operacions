/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/grafiques-context/errors.js
 * ROL: Taxonomia d'errors de «Gràfiques en context» i diagnòstic de cada resposta
 *      incorrecta. Cada pas porta, a dades.distractors, els valors (o les opcions
 *      falses) que donen els errors típics (math-engine.js); aquí es diu què vol
 *      dir cadascun.
 * Mòdul pur: es prova a tests/grafiques-context.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

export const ERRORS_GX = {
    SENSE_ESCALA: {
        etiqueta: 'sense mirar l’escala',
        missatge: "Has comptat ratlles: mira els números de l'eix vertical, que no van d'1 en 1.",
    },
    EIX_CANVIAT: {
        etiqueta: 'eixos canviats',
        missatge:
            "Has llegit a l'eix que no tocava: el temps és a l'eix horitzontal i el que canvia (distància, litres…), al vertical.",
    },
    INSTANT_PER_VALOR: {
        etiqueta: 'quan, en lloc de quant',
        missatge: "Això és quan passa (eix horitzontal). Es demana el valor: quant és, a l'eix vertical.",
    },
    VALOR_PER_INSTANT: {
        etiqueta: 'quant, en lloc de quan',
        missatge: "Això és el valor (eix vertical). Es demana quan passa: el temps, a l'eix horitzontal.",
    },
    INSTANT_PER_DURADA: {
        etiqueta: 'un instant per una durada',
        missatge: 'Això és un moment (quan comença o acaba). Es demana quanta estona: el final menys el començament.',
    },
    NOMES_UN_TRAM: {
        etiqueta: 'només un tram',
        missatge: 'Hi ha més d’un tram pla: cal sumar les estones de tots.',
    },
    HORITZONTAL: {
        etiqueta: 'tram horitzontal',
        missatge:
            'Un tram horitzontal vol dir que el valor no canvia: ni augmenta ni disminueix (en una excursió, està aturat; no torna enrere).',
    },
    CREIX_DECREIX: {
        etiqueta: 'puja per baixa',
        missatge: "Mira cap on va la gràfica d'esquerra a dreta: si puja, el valor augmenta; si baixa, disminueix.",
    },
    NOMES_EN_PART: {
        etiqueta: 'només en part',
        missatge: "En aquest interval no ho fa tota l'estona: una part puja i una altra baixa.",
    },
    MES_LLARG_PER_RAPID: {
        etiqueta: 'més llarg no és més ràpid',
        missatge:
            'En aquest tram canvia molt, però fa servir més temps. Més de pressa vol dir més inclinat: més canvi en el mateix temps.',
    },
    MES_ALT_PER_RAPID: {
        etiqueta: 'més amunt no és més ràpid',
        missatge: 'Que la gràfica sigui més amunt no vol dir que vagi més de pressa. Busca el tram més inclinat.',
    },
    MENYS_INCLINAT: {
        etiqueta: 'menys inclinat',
        missatge: 'Aquest tram és menys inclinat que un altre: hi va més a poc a poc.',
    },
    NOMES_EL_CANVI: {
        etiqueta: 'sense dividir pel temps',
        missatge: 'Això és quant canvia en tot el tram. La velocitat és el canvi dividit pel temps que hi fa servir.',
    },
    DIVISIO_GIRADA: {
        etiqueta: 'divisió girada',
        missatge: 'Has dividit al revés: la velocitat és el canvi (eix vertical) dividit pel temps (eix horitzontal).',
    },
    DOMINI_PER_RECORREGUT: {
        etiqueta: 'domini per recorregut',
        missatge: "Això són valors de l'eix horitzontal (el domini). El recorregut són els valors de l'eix vertical.",
    },
    RECORREGUT_PER_DOMINI: {
        etiqueta: 'recorregut per domini',
        missatge: "Això són valors de l'eix vertical (el recorregut). El domini són els valors de l'eix horitzontal.",
    },
    PRIMER_PER_MINIM: {
        etiqueta: 'el primer o el darrer valor',
        missatge: 'Aquest és el valor del començament o del final, no el més petit o el més gran de tots.',
    },
    DIBUIX_DEL_CAMI: {
        etiqueta: 'la gràfica com un dibuix del camí',
        missatge:
            'La gràfica no és un dibuix del camí: diu a quina distància de casa és. Quan puja, s’allunya de casa (no puja cap muntanya).',
    },
    MAXIM_PER_TOTAL: {
        etiqueta: 'la distància màxima pel camí fet',
        missatge: 'Aquesta és la distància màxima a casa. El camí fet suma tot el que camina: l’anada i la tornada.',
    },
    TEMPS_CANVIATS: {
        etiqueta: 'temps canviats',
        missatge: 'Mira quanta estona dura cada part: en aquesta gràfica, els temps no són els del relat.',
    },
    VALORS_CANVIATS: {
        etiqueta: 'valors canviats',
        missatge: 'Mira els valors on acaba cada part: en aquesta gràfica, no són els del relat.',
    },
    CONCAVITAT: {
        etiqueta: 'més de pressa o més a poc a poc',
        missatge:
            'Compara quant canvia cada interval igual de temps: si cada vegada canvia més, va més de pressa (la gràfica es redreça); si cada vegada canvia menys, va més a poc a poc (la gràfica s’aplana).',
    },
    RECTA_PER_CORBA: {
        etiqueta: 'una corba no és una recta',
        missatge:
            'Si anés sempre igual de pressa, la gràfica seria una recta. Aquí és corba: cada interval canvia diferent.',
    },
    VALOR_PER_INCREMENT: {
        etiqueta: 'el valor per l’augment',
        missatge:
            "Això és el valor en aquell moment. Es demana quant ha canviat durant l'interval: el final menys el començament.",
    },
    DES_DEL_PRINCIPI: {
        etiqueta: 'des del principi',
        missatge: 'Això és el que ha canviat des del principi. Es demana només el darrer interval.',
    },
};

export function diagnosticaGX(pas, valors) {
    try {
        const errorType = errorPerDistractors(pas, valors || {});
        return errorType && ERRORS_GX[errorType] ? { errorType, ...ERRORS_GX[errorType] } : null;
    } catch (e) {
        return null;
    }
}
