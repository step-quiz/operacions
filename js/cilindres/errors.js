/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/cilindres/errors.js
 * ROL: Taxonomia d'errors de «Cilindres amb un full» i diagnòstic de cada resposta
 *      incorrecta. Els passos de triar porten els seus distractors (correccio.js
 *      errorPerDistractors); els decimals es comparen amb el marge del pas (les respostes
 *      són arrodonides), amb els valors que donen els errors típics (math-engine.js).
 * Mòdul pur: es prova a tests/cilindres.test.js.
 * DEPENDÈNCIES: passos/correccio.js (errorPerDistractors).
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';

export const ERRORS_CF = {
    DIAMETRE: {
        etiqueta: 'diàmetre per circumferència',
        missatge:
            'En enrotllar el full, el costat fa la volta sencera: és la longitud de la circumferència (2πr), no el diàmetre.',
    },
    RADI: {
        etiqueta: 'radi per circumferència',
        missatge: 'El costat que s’uneix fa la volta sencera de la base: és la longitud de la circumferència, 2πr.',
    },
    ES_CIRCUMFERENCIA: {
        etiqueta: 'circumferència per altura',
        missatge: 'Aquest costat és el que s’enrotlla: fa la volta de la base, és la longitud de la circumferència.',
    },
    ES_ALTURA: {
        etiqueta: 'altura per base',
        missatge: 'Aquest costat no s’enrotlla: queda dret i és l’altura del cilindre.',
    },
    R_PER_PI: {
        etiqueta: 'r = L / π',
        missatge: 'La longitud de la circumferència és 2πr: per trobar r, divideix entre 2π, no només entre π.',
    },
    DIVIDEIX_MALAMENT: {
        etiqueta: 'divisió equivocada',
        missatge: 'Divideix el costat entre 2π (2 · π), una sola vegada.',
    },
    DOS_PI_R2: {
        etiqueta: '2πr² per πr²',
        missatge:
            'L’àrea del cercle és π · r²; 2πr és la longitud de la circumferència. No les barregis: 2πr² no és cap de les dues.',
    },
    PERIMETRE: {
        etiqueta: 'longitud per àrea',
        missatge: '2πr és la longitud de la circumferència; l’àrea de la base és π · r².',
    },
    SENSE_QUADRAT: {
        etiqueta: 'sense el quadrat',
        missatge: 'L’àrea del cercle és π · r²: el radi va elevat al quadrat.',
    },
    SENSE_PI: {
        etiqueta: 'sense π',
        missatge: 'L’àrea del cercle és π · r²: no t’oblidis de multiplicar per π.',
    },
    ALTURA_CANVIADA: {
        etiqueta: 'altura equivocada',
        missatge: 'L’altura és el costat que no s’ha enrotllat (el que queda dret).',
    },
    SENSE_ALTURA: {
        etiqueta: 'sense l’altura',
        missatge: 'El volum és l’àrea de la base per l’altura: V = A · h.',
    },
    DOBLE: {
        etiqueta: 'volum doble',
        missatge: 'El volum és A · h, una sola vegada: el cilindre no té dues bases plenes que es sumin.',
    },
    MES_PETIT: {
        etiqueta: 'el més petit',
        missatge: 'Compara els dos volums que has calculat: té més volum el que té el nombre més gran.',
    },
    IGUALS: {
        etiqueta: 'iguals',
        missatge: 'Fan servir el mateix full, però no tenen el mateix volum: mira els dos resultats.',
    },
    LITRES: {
        etiqueta: 'litres per mL',
        missatge: 'Es demana en mL, no en litres: 1 cm³ correspon a 1 mL, i el nombre és el mateix que el volum.',
    },
    MIL: {
        etiqueta: 'per mil',
        missatge: '1 cm³ correspon a 1 mL: no cal multiplicar per 1000.',
    },
};

/** El valor d'un camp decimal, com a nombre. */
const valorEscrit = v => (Array.isArray(v) ? v[0] / v[1] : Number(v));

/** Els decimals: el distractor més proper, si és dins del marge del pas. */
function diagnosticaDecimal(pas, valors) {
    if (!valors || valors.r === undefined) return null;
    const v = valorEscrit(valors.r);
    let millor = null;
    for (const [d, codi] of pas.dades.distractors.r || []) {
        // el mateix marge que una resposta bona: arrodonir a 2 decimals i haver arrodonit abans (≈ 0,6 %)
        const dist = Math.abs(valorEscrit(d) - v);
        if (dist <= 0.011 + 0.006 * Math.abs(valorEscrit(d)) && (!millor || dist < millor[0])) millor = [dist, codi];
    }
    return millor ? millor[1] : null;
}

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaCF(pas, valors) {
    try {
        const errorType =
            pas.camps.r === 'decimal' ? diagnosticaDecimal(pas, valors) : errorPerDistractors(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_CF[errorType] } : null;
    } catch (e) {
        return null;
    }
}
