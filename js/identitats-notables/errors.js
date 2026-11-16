/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/identitats-notables/errors.js
 * ROL: Taxonomia d'errors d'«Identitats notables» i diagnòstic de cada resposta
 *      incorrecta (el mateix contracte que js/fraccions/errors-fraccions.js).
 *
 * En desenvolupar, es construeixen els resultats equivocats típics a partir de a i b
 * ((a + b)² = a² + b², ab en lloc de 2ab, (2x)² = 2x², el signe de b²…) i es mira si
 * la resposta n'és un. En factoritzar, es mira si a o b són el quadrat en lloc de
 * l'arrel, o la meitat del terme del mig. En triar la identitat, el diagnòstic depèn
 * del que s'ha triat i del que era.
 *
 * Mòdul pur: no toca el DOM (es prova a tests/identitats-notables.test.js).
 * DEPENDÈNCIES: algebra/racionals.js, algebra/polinomis.js, passos/correccio.js i math-engine.js.
 * ============================================================================
 */

import { coefsIguals, oposatCoef, producteCoef } from '../algebra/racionals.js';
import { monomi, multiplicaMonomis, polinomiDeCoeficients, polinomisIguals } from '../algebra/polinomis.js';
import { coeficientUnEnBlanc } from '../passos/correccio.js';
import { QUADRATS_IN, clausIN, desenvolupamentIN, escalaIN, oposatIN, quadratIN } from './math-engine.js';

// etiqueta: com es diu l'error a l'historial · missatge: el que llegeix l'alumne (text, o funció de les dades)
export const ERRORS_IN = {
    FORMA: {
        etiqueta: 'identitat',
        missatge:
            "Mira la forma: (a + b)² és el quadrat d'una suma; (a − b)², el d'una diferència; (a + b)(a − b), una suma per una diferència.",
    },
    SIGNE_MIG: {
        etiqueta: 'suma o diferència',
        missatge: "El signe del terme del mig diu si és el quadrat d'una suma (+) o el d'una diferència (−).",
    },
    TRES_TERMES: {
        etiqueta: 'quadrat o suma per diferència',
        missatge: 'Té tres termes: és un quadrat. La suma per diferència en dona només dos, a² − b².',
    },
    DOS_TERMES: {
        etiqueta: 'diferència de quadrats',
        missatge: 'Té dos termes que són quadrats i es resten: és una suma per diferència, a² − b² = (a + b)(a − b).',
    },
    SI_QUE_ES: {
        etiqueta: 'sí que és una identitat notable',
        missatge: d =>
            d.identitat === 'sxd'
                ? `${d.textA2} i ${d.textB2} són els quadrats de ${d.textA} i de ${d.textB}, i es resten.`
                : `${d.textA2} és el quadrat de ${d.textA}, ${d.textB2} és el quadrat de ${d.textB}, i el terme del mig és 2 · ${d.textA} · ${d.textB}.`,
    },
    NO_ES: {
        etiqueta: 'no és una identitat notable',
        missatge: d =>
            d.motiu === 'mig'
                ? `Comprova el doble producte: 2 · ${d.textA} · ${d.textB} = ${d.textDoble}, i aquí el terme del mig és ${d.textMig}.`
                : d.motiu === 'signe'
                  ? "En el quadrat d'una suma o d'una diferència, els dos quadrats són positius: aquí l'últim terme és negatiu."
                  : 'Una suma de quadrats no és cap identitat notable: la suma per diferència dona una resta, a² − b².',
    },
    COEF_U: {
        etiqueta: 'coeficient 1 en blanc',
        missatge:
            'Si un terme hi és amb coeficient 1 o −1, escriu-lo: una casella en blanc vol dir que aquell terme no hi és.',
    },
    SENSE_DOBLE: {
        etiqueta: '(a + b)² = a² + b²',
        missatge: '(a ± b)² no és a² ± b²: falta el doble producte, 2ab.',
    },
    DOBLE_SENSE_2: {
        etiqueta: 'ab en lloc de 2ab',
        missatge: 'El terme del mig és el doble producte: 2 · a · b, no a · b.',
    },
    QUADRAT_COEF: {
        etiqueta: '(2x)² = 2x²',
        missatge: "S'eleva al quadrat tot el terme, el coeficient i la lletra: (2x)² = 4x², no 2x².",
    },
    B2_PER_2: {
        etiqueta: 'b² = 2b',
        missatge: d => `${d.textB}² vol dir ${d.textB} · ${d.textB}, no 2 · ${d.textB}.`,
    },
    SIGNE_DOBLE: {
        etiqueta: 'signe del doble producte',
        missatge: "En el quadrat d'una diferència, el doble producte va amb menys; en el d'una suma, amb més.",
    },
    SIGNE_B2: {
        etiqueta: 'signe de b²',
        missatge: 'b² sempre és positiu: (a − b)² = a² − 2ab + b².',
    },
    SXD_SUMA: {
        etiqueta: '(a + b)(a − b) = a² + b²',
        missatge: '(a + b)(a − b) = a² − b²: el quadrat de b va amb menys.',
    },
    SXD_DOBLE: {
        etiqueta: 'doble producte a la suma per diferència',
        missatge:
            "En una suma per diferència els productes creuats s'anul·len: (a + b)(a − b) = a² − b², sense terme del mig.",
    },
    ARREL_B: {
        etiqueta: "falta l'arrel de b²",
        missatge: d => `Dins del parèntesi hi va ${d.textB}, l'arrel de ${d.textB2}.`,
    },
    ARREL_A: {
        etiqueta: "falta l'arrel de a²",
        missatge: d => `El primer terme és ${d.textA}, l'arrel de ${d.textA2}.`,
    },
    MEITAT_MIG: {
        etiqueta: 'meitat del terme del mig',
        missatge: d => `El segon terme és l'arrel de ${d.textB2}, no la meitat del terme del mig.`,
    },
    SIGNE_DINS: {
        etiqueta: 'signe dins del parèntesi',
        missatge: 'El signe ja és a la plantilla: escriu els nombres sense signe.',
    },
};

// ── Regles ───────────────────────────────────────────────────────────────────
function classifica(d, v, sol) {
    if (d.tipus === 'desenvolupar') return 'FORMA';
    const quadrat = id => QUADRATS_IN.includes(id);
    if (sol === 'cap') return 'NO_ES';
    if (v.tria === 'cap') return 'SI_QUE_ES';
    if (quadrat(sol)) return quadrat(v.tria) ? 'SIGNE_MIG' : 'TRES_TERMES';
    return 'DOS_TERMES';
}

function desenvolupaErr(pas, d, v) {
    if (coeficientUnEnBlanc(pas, v)) return 'COEF_U';
    const { a, b, identitat } = d;
    const alumne = polinomiDeCoeficients(v, clausIN(d.dues));
    const bo = desenvolupamentIN(identitat, a, b);
    const [a2, b2] = [quadratIN(a), quadratIN(b)];
    const ab = multiplicaMonomis(a, b);
    const doble = escalaIN(ab, identitat === 'diferencia' ? -2 : 2);
    // (2x)² = 2x²: el coeficient sense elevar (de a o de b)
    const senseElevar = m => monomi(m.c, Object.fromEntries(Object.keys(m.e).map(l => [l, 2 * m.e[l]])));
    const candidats =
        identitat === 'sxd'
            ? [
                  ['SXD_SUMA', [a2, b2]],
                  ['SXD_DOBLE', [a2, escalaIN(ab, 2), oposatIN(b2)]],
                  ['SXD_DOBLE', [a2, escalaIN(ab, -2), oposatIN(b2)]],
                  ['QUADRAT_COEF', [senseElevar(a), oposatIN(b2)]],
                  ['QUADRAT_COEF', [a2, oposatIN(senseElevar(b))]],
              ]
            : [
                  ['SENSE_DOBLE', [a2, b2]],
                  ['SENSE_DOBLE', [a2, oposatIN(b2)]],
                  ['DOBLE_SENSE_2', [a2, escalaIN(doble, [1, 2]), b2]],
                  ['QUADRAT_COEF', [senseElevar(a), doble, b2]],
                  ['QUADRAT_COEF', [a2, doble, senseElevar(b)]],
                  ['B2_PER_2', [a2, doble, escalaIN(b, 2)]],
                  ['SIGNE_DOBLE', [a2, oposatIN(doble), b2]],
                  ['SIGNE_B2', [a2, doble, oposatIN(b2)]],
              ];
    for (const [errorType, polinomi] of candidats) {
        if (!polinomisIguals(polinomi, bo) && polinomisIguals(alumne, polinomi)) return errorType;
    }
    return null;
}

function factoritzaErr(d, v) {
    const [ka, kb] = [d.a.c, d.b.c];
    const [ka2, kb2] = [producteCoef(ka, ka), producteCoef(kb, kb)];
    const iguals = (nom, c) => nom in v && coefsIguals(v[nom], c);
    const segons = ['q', 's'].filter(nom => nom in v);
    const primers = ['p', 'r'].filter(nom => nom in v);
    if (!coefsIguals(kb2, kb) && segons.some(nom => iguals(nom, kb2))) return 'ARREL_B';
    if (!coefsIguals(ka2, ka) && primers.some(nom => iguals(nom, ka2))) return 'ARREL_A';
    if (d.identitat !== 'sxd' && !coefsIguals(ka, 1) && iguals('q', producteCoef(ka, kb))) return 'MEITAT_MIG';
    // Els valors bons, però amb algun signe canviat
    const abs = c => (coefsIguals(c, oposatCoef(c)) ? c : [c, oposatCoef(c)]);
    const enValor = (nom, c) => [].concat(abs(c)).some(x => coefsIguals(v[nom], x));
    if (primers.every(nom => enValor(nom, ka)) && segons.every(nom => enValor(nom, kb))) return 'SIGNE_DINS';
    return null;
}

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @param {object} pas     el pas (de math-engine.js)
 * @param {object} valors  el que ha escrit l'alumne (els «valors» de corregeixPas)
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaIN(pas, valors) {
    try {
        const d = pas.dades;
        const v = valors || {};
        let errorType = null;
        if (pas.mena === 'classifica') errorType = classifica(d, v, pas.solucio.tria);
        else if (pas.mena === 'desenvolupa') errorType = desenvolupaErr(pas, d, v);
        else if (pas.mena === 'factoritza') errorType = factoritzaErr(d, v);
        if (!errorType) return null;
        const { etiqueta, missatge } = ERRORS_IN[errorType];
        return { errorType, etiqueta, missatge: typeof missatge === 'function' ? missatge(d) : missatge };
    } catch (e) {
        return null;
    }
}
