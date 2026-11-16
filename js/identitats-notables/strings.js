/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/identitats-notables/strings.js
 * ROL: Textos d'«Identitats notables» (identitats-notables.html). Els missatges
 *      dels errors típics són a errors.js, i els textos comuns del joc, a
 *      js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_IN = {
    // Capçalera del joc: «Exercici 2 de 8»
    element: 'Exercici',

    // Cada identitat: el botó i la línia que queda escrita (TeX)
    identitat: {
        suma: {
            opcio: "Quadrat d'una suma: (a + b)²",
            linia: "\\text{quadrat d'una suma: } (a + b)^2 = a^2 + 2ab + b^2",
        },
        diferencia: {
            opcio: "Quadrat d'una diferència: (a − b)²",
            linia: "\\text{quadrat d'una diferència: } (a - b)^2 = a^2 - 2ab + b^2",
        },
        sxd: {
            opcio: 'Suma per diferència: (a + b)(a − b)',
            linia: '\\text{suma per diferència: } (a + b)(a - b) = a^2 - b^2',
        },
        cap: {
            opcio: 'No és cap identitat notable',
            linia: '\\text{no és cap identitat notable}',
        },
    },

    enunciat: {
        classificaDesenvolupar: 'Quina identitat notable és?',
        classificaFactoritzar: "És el desenvolupament d'una identitat notable? De quina?",
        desenvolupa: 'Desenvolupa-la.',
        factoritza: 'Escriu-lo com a identitat notable.',
    },

    nomPas: {
        classifica: 'identitat',
        desenvolupa: 'desenvolupar',
        factoritza: 'factoritzar',
    },

    nota: {
        factoritza: "Escriu els nombres que falten, també l'1. El signe ja hi és.",
    },
};
