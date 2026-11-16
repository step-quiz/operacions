/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/parabola/errors.js
 * ROL: Taxonomia d'errors de «La paràbola» i diagnòstic de cada resposta
 *      incorrecta (el mateix contracte que js/fraccions/errors-fraccions.js). Els
 *      passos de la fórmula (discriminant, quantes solucions, solucions) són els
 *      d'«Equacions de 2n grau» i es diagnostiquen amb el seu errors.js.
 * Mòdul pur: es prova a tests/parabola.test.js.
 * DEPENDÈNCIES: passos/correccio.js i equacions-segon-grau/errors.js.
 * ============================================================================
 */

import { errorPerDistractors } from '../passos/correccio.js';
import { diagnosticaSG } from '../equacions-segon-grau/errors.js';

export const ERRORS_PA = {
    OBERTURA: {
        etiqueta: 'cap on obre',
        missatge: 'El signe de a diu cap on obre: si a > 0, cap amunt (∪); si a < 0, cap avall (∩).',
    },
    VERTEX_SIGNE: {
        etiqueta: 'signe del vèrtex',
        missatge: 'x_v = −b / (2a): no t’oblidis del menys de davant de b.',
    },
    VERTEX_2A: {
        etiqueta: 'divisió per a',
        missatge: 'El denominador és 2a, no a: x_v = −b / (2a).',
    },
    VERTEX_TALL_Y: {
        etiqueta: 'el tall amb Y com a vèrtex',
        missatge: "c és on la paràbola talla l'eix Y, no el vèrtex. Per trobar y_v, substitueix x_v a l'expressió.",
    },
    VERTEX_Y: {
        etiqueta: 'y del vèrtex',
        missatge: "y_v és el valor de la funció al vèrtex: substitueix x = x_v a l'expressió (amb el seu signe).",
    },
    TALL_Y_VERTEX: {
        etiqueta: 'el vèrtex com a tall amb Y',
        missatge: "El tall amb l'eix Y és on x = 0: és c, no la y del vèrtex.",
    },
    PUNTS_GIRATS: {
        etiqueta: 'coordenades girades',
        missatge: 'Has girat les coordenades: primer va la x (cap a la dreta) i després la y (cap amunt).',
    },
    PUNTS_X_SENSE_TALL: {
        etiqueta: "talls amb l'eix X que no hi són",
        missatge:
            "Si el discriminant és negatiu, l'equació no té solució: la paràbola no talla l'eix X i no hi has de posar cap punt.",
    },
    TALLS_SIGNE: {
        etiqueta: 'signe dels talls',
        missatge: "Llegeix bé on la paràbola talla l'eix X: a la dreta de l'origen, les x són positives.",
    },
    A_SIGNE: {
        etiqueta: 'signe de a',
        missatge: 'Mira cap on obre: si obre cap avall, a és negatiu.',
    },
    A_SENSE_DIVIDIR: {
        etiqueta: 'a sense dividir',
        missatge: 'c no és a: c = a · (−x₁) · (−x₂), per tant a = c / (x₁ · x₂).',
    },
    EXPR_SIGNES: {
        etiqueta: 'signes en desenvolupar',
        missatge: 'Desenvolupa a(x − x₁)(x − x₂) amb compte amb els signes: b = −a(x₁ + x₂) i c = a · x₁ · x₂.',
    },
};

// Els menes dels passos que vénen d'Equacions de 2n grau
const DE_SG = ['discriminant', 'nombre', 'solucions'];

function errorPuntsPA(pas, valors) {
    const punts = valors.p || [];
    if (!punts.length) return null;
    const bons = pas.dades.punts;
    const conte = (llista, [x, y]) => llista.some(([u, v]) => u === x && v === y);
    if (punts.every(([x, y]) => conte(bons, [y, x]))) return 'PUNTS_GIRATS';
    // Sense talls amb l'eix X, però l'alumne n'hi ha posat
    const senseTalls = !bons.some(([, y]) => y === 0);
    if (senseTalls && punts.some(([x, y]) => y === 0 && !conte(bons, [x, y]))) return 'PUNTS_X_SENSE_TALL';
    return null;
}

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaPA(pas, valors) {
    try {
        if (DE_SG.includes(pas.mena)) return diagnosticaSG(pas, valors);
        const errorType =
            pas.mena === 'punts' ? errorPuntsPA(pas, valors || {}) : errorPerDistractors(pas, valors || {});
        return errorType ? { errorType, ...ERRORS_PA[errorType] } : null;
    } catch (e) {
        return null;
    }
}
