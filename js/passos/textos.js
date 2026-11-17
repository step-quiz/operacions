/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/textos.js
 * ROL: Textos comuns del joc de passos (js/passos/joc-passos.js): capçalera,
 *      botons i avisos que no depenen de l'activitat. Els de cada activitat
 *      (enunciats, noms dels passos, errors típics) són a la seva carpeta.
 * ARQUITECTURA: mòdul pur (cap DOM).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const TEXTOS_PASSOS = {
    ui: {
        pas: 'Pas',
        de: 'de',
        punts: 'Punts',
        intents: 'Intents',
        sessio: 'Sessió',
        ok: 'OK',
        // Targetes, passos opcionals i franges plegades (pregunta.problema, .formula, .opcional)
        problema: 'Problema',
        formula: 'Fórmula',
        si: 'Sí',
        no: 'No',
        amaga: 'Amaga-ho',
        mostraPassos: n => `Mostra les ${n} línies`,
        liniesMes: n => (n === 1 ? '1 línia més · Mostra-la' : `${n} línies més · Mostra-les`),
    },
    avisos: {
        NO_ENTER: 'Escriu nombres enters a les caselles.',
        FALTEN_PUNTS: 'Encara falten punts per situar a la quadrícula.',
        NO_DECIMAL: 'Escriu un nombre decimal: xifres i, si cal, una coma. El període, només amb xifres.',
        DEN_ZERO: 'El denominador no pot ser 0.',
        NO_SIMPLIFICADA: 'El valor és correcte, però encara es pot simplificar.',
        racional: 'Si el resultat és un nombre enter, deixa el denominador en blanc.',
        generic: 'No és correcte. Repassa-ho i torna-ho a provar.',
        esgotat: 'Mira la resolució completa, a dalt.',
        buit: '?',
    },
    // Notes sota les plantilles comunes
    notes: {
        // plantillaPolinomi (js/algebra/polinomis.js)
        polinomi: "Escriu el coeficient de cada terme, també l'1 i el −1. Deixa en blanc els termes que no hi són.",
    },
};
