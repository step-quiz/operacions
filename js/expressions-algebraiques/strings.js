/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/expressions-algebraiques/strings.js
 * ROL: Textos d'«Expressions algebraiques» (expressions-algebraiques.html). Els
 *      missatges dels errors típics són a errors.js, i els textos comuns del joc,
 *      a js/passos/textos.js.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_EA = {
    // Capçalera del joc: «Expressió 2 de 8»
    element: 'Expressió',

    enunciat: {
        reduir: 'Redueix els termes semblants.',
        monomis: 'Multiplica els monomis.',
        distributiva: 'Treu els parèntesis i redueix.',
        binomis: 'Multiplica i redueix.',
    },

    // Nom de cada mena de pregunta, per a l'historial de la sessió
    nomPas: {
        reduir: 'reduir',
        monomis: 'producte de monomis',
        distributiva: 'treure parèntesis',
        binomis: 'producte de binomis',
    },

    nota: {
        monomi: 'Si un exponent és 1, el pots deixar en blanc.',
    },
};
