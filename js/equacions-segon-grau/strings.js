/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions-segon-grau/strings.js
 * ROL: Textos d'«Equacions de 2n grau» (equacions-segon-grau.html): l'enunciat
 *      de cada pas, les opcions dels passos d'escollir i els avisos del joc.
 *      Els missatges de cada error típic són a errors.js, al costat de la regla
 *      que el detecta, i els textos comuns del joc, a js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM). {v} és la incògnita del pas: «x», o «t»
 *      quan s'ha fet el canvi t = x² d'una biquadrada.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_SG = {
    // Capçalera del joc: «Equació 2 de 5»
    element: 'Equació',

    // Quantes solucions té l'equació, segons el signe del discriminant
    nombre: { 2: 'dues solucions', 1: 'una solució (doble)', 0: 'cap solució' },
    // Quants nombres tenen un quadrat donat
    nombreArrel: { 2: 'dues solucions', 1: 'una solució', 0: 'cap solució' },

    // Tipus d'equació → com es resol. «opcio» és el botó; «linia», el que queda escrit.
    classe: {
        completa: { opcio: 'Completa: aplico la fórmula', linia: 'completa: fórmula' },
        senseB: { opcio: 'Sense terme en x: aïllo x²', linia: 'sense terme en x: aïllo x²' },
        senseC: {
            opcio: 'Sense terme independent: trec x factor comú',
            linia: 'sense terme independent: factor comú',
        },
    },

    enunciat: {
        classifica: 'Com és aquesta equació i com la resoldràs?',
        coeficients: 'Escriu els coeficients, cadascun amb el seu signe.',
        ordena: "Passa tots els termes al primer membre i escriu l'equació ordenada.",
        canvi: "Fes el canvi t = x² i escriu l'equació de 2n grau que en surt.",
        discriminant: 'Calcula el discriminant.',
        nombre: "Quantes solucions té l'equació en {v}?",
        formula: 'Substitueix els valors a la fórmula.',
        solucions: 'Calcula les solucions. Si són fraccions, simplifica-les.',
        aillar: 'Deixa el terme en x² sol al primer membre.',
        dividir: 'Aïlla x². Si surt una fracció, simplifica-la.',
        nombreArrel: 'Quants nombres tenen aquest quadrat?',
        desfer: 'Desfés el canvi. Quants nombres tenen aquest quadrat?',
        arrels: 'Escriu les dues solucions.',
        factor: 'Treu x factor comú.',
        solucionsFactor: 'Un producte val 0 quan algun dels factors val 0. Escriu les dues solucions.',
    },

    // Nom curt de cada pas, per a l'historial de la sessió
    nomPas: {
        classifica: "tipus d'equació",
        coeficients: 'coeficients',
        ordena: 'ordenar',
        canvi: 'canvi t = x²',
        discriminant: 'discriminant',
        nombre: 'nombre de solucions',
        formula: 'fórmula',
        solucions: 'solucions',
        aillar: 'aïllar el terme en x²',
        dividir: 'aïllar x²',
        nombreArrel: 'nombre de solucions',
        arrels: 'solucions',
        factor: 'factor comú',
        solucionsFactor: 'solucions',
    },
};
