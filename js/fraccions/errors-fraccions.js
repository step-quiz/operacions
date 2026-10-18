/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/fraccions/errors-fraccions.js
 * ROL: Taxonomia d'errors de «Operacions amb fraccions» i diagnòstic de cada
 *      resposta incorrecta (P06: distractors etiquetats per error, com a
 *      js/derivades/distractor-lib.js però per a respostes escrites).
 *
 * Quan l'alumne s'equivoca en un pas, diagnostica(pas, dades) mira si la
 * resposta encaixa amb un error típic (sumar els denominadors, amplificar
 * només el denominador, multiplicar en creu…) i en torna el tipus i un
 * missatge que orienta sense donar la resposta. Si no encaixa amb cap, torna
 * null i el joc fa com sempre (només resta un intent).
 *
 * Mòdul pur: no toca el DOM (es prova a tests/modules.test.js).
 * ============================================================================
 */

// ── Taxonomia ────────────────────────────────────────────────────────────────
// etiqueta: com es diu l'error a l'historial de la sessió.
export const ERRORS = {
    DEN_SUMA: { etiqueta: 'sumar els denominadors' },
    DEN_NO_MULTIPLE: { etiqueta: 'denominador que no és comú' },
    AMPL_FACTORS_DIFERENTS: { etiqueta: 'factors diferents a dalt i a baix' },
    AMPL_FACTOR: { etiqueta: "factor d'ampliació equivocat" },
    AMPL_NOMES_DEN: { etiqueta: 'amplificar només el denominador' },
    AMPL_SUMA: { etiqueta: 'sumar el factor en lloc de multiplicar' },
    AMPL_CALCUL: { etiqueta: 'producte del numerador' },
    RES_DEN_OPERAT: { etiqueta: 'operar també els denominadors' },
    RES_SIGNE: { etiqueta: 'confondre suma i resta' },
    RES_ORDRE: { etiqueta: 'restar en ordre invers' },
    RES_CALCUL: { etiqueta: 'operació dels numeradors' },
    SIMP_UN_SOL: { etiqueta: 'simplificar només un terme' },
    SIMP_NO_EQUIVALENT: { etiqueta: 'fracció no equivalent' },
    SIMP_ENTER: { etiqueta: 'el resultat és un nombre enter' },
    INV_NO_GIRADA: { etiqueta: 'no invertir la segona fracció' },
    INV_PRIMERA: { etiqueta: 'invertir la fracció equivocada' },
    INV_MAL: { etiqueta: 'inversa mal feta' },
    PROD_CREU: { etiqueta: 'multiplicar en creu' },
    PROD_SUMA: { etiqueta: 'sumar en lloc de multiplicar' },
    PROD_NUM: { etiqueta: 'producte dels numeradors' },
    PROD_DEN: { etiqueta: 'producte dels denominadors' },
};

const diag = (errorType, missatge) => ({ errorType, missatge, etiqueta: ERRORS[errorType].etiqueta });

// ── Pas 1: denominador comú ─────────────────────────────────────────────────
function denominadorComu({ d1, d2, ans }) {
    if (!(ans > 0)) return null;
    const m1 = ans % d1 === 0,
        m2 = ans % d2 === 0;
    if (m1 && m2) return null; // és un denominador comú: no és cap error
    if (ans === d1 + d2 && !(m1 && m2))
        return diag(
            'DEN_SUMA',
            `Has sumat els denominadors (${d1} + ${d2}). El denominador comú ha de ser un múltiple de ${d1} i també de ${d2}.`
        );
    if (m1 && !m2) return diag('DEN_NO_MULTIPLE', `${ans} és múltiple de ${d1}, però no de ${d2}.`);
    if (m2 && !m1) return diag('DEN_NO_MULTIPLE', `${ans} és múltiple de ${d2}, però no de ${d1}.`);
    return diag('DEN_NO_MULTIPLE', `${ans} no és múltiple ni de ${d1} ni de ${d2}.`);
}

// ── Pas 2: fraccions equivalents (una fila: n/d amplificada fins a den) ──────
function filaAmplificada({ n, d, den, top, bot, num }) {
    const f = den / d;
    if (top !== bot)
        return diag(
            'AMPL_FACTORS_DIFERENTS',
            `Per obtenir una fracció equivalent, el numerador i el denominador de ${n}/${d} s'han de multiplicar pel mateix nombre.`
        );
    if (top !== f) return diag('AMPL_FACTOR', `Quin nombre multiplicat per ${d} dona ${den}? Aquest és el factor.`);
    if (num === n && f !== 1)
        return diag(
            'AMPL_NOMES_DEN',
            `Has multiplicat el denominador per ${f}: el numerador ${n} també s'ha de multiplicar per ${f}.`
        );
    if (num === n + f && n * f !== n + f)
        return diag('AMPL_SUMA', `Has sumat ${f} al numerador. Amplificar és multiplicar: ${n} × ${f}.`);
    if (num !== n * f) return diag('AMPL_CALCUL', `Revisa el numerador: és ${n} × ${f}.`);
    return null;
}

function equivalents({ fila1, fila2 }) {
    return (fila1 && filaAmplificada(fila1)) || (fila2 && filaAmplificada(fila2)) || null;
}

// ── Pas 3: sumar o restar amb el mateix denominador ─────────────────────────
function operacio({ op, u1, u2, den, resN, resD }) {
    const esperat = op === '+' ? u1 + u2 : u1 - u2;
    if ((op === '+' && resD === 2 * den) || (op === '-' && resD === 0))
        return diag(
            'RES_DEN_OPERAT',
            `Amb el mateix denominador, només ${op === '+' ? 'se sumen' : 'es resten'} els numeradors: el denominador (${den}) es manté.`
        );
    if (resD !== den) return null;
    if (op === '-' && resN === u1 + u2) return diag('RES_SIGNE', `Fixa't en l'operació: és una resta, ${u1} − ${u2}.`);
    if (op === '+' && resN === u1 - u2 && u2 !== 0)
        return diag('RES_SIGNE', `Fixa't en l'operació: és una suma, ${u1} + ${u2}.`);
    if (op === '-' && resN === u2 - u1 && u1 !== u2)
        return diag('RES_ORDRE', `Compte amb l'ordre: és ${u1} − ${u2}, no ${u2} − ${u1}.`);
    if (resN !== esperat)
        return diag('RES_CALCUL', `Revisa l'operació dels numeradors: ${u1} ${op === '+' ? '+' : '−'} ${u2}.`);
    return null;
}

// ── Simplificar fins a la irreductible ──────────────────────────────────────
// (Si la fracció és equivalent però encara no irreductible, el joc ja ho diu
// i no compta com a error: aquí només arriben les que no són equivalents.)
function simplificar({ unsN, unsD, finN, finD, simpN, simpD }) {
    if (finD === 1 && simpD === 1)
        return diag('SIMP_ENTER', `${unsN}/${unsD} és un nombre enter: divideix ${unsN} entre ${unsD}.`);
    if ((simpD === unsD && simpN !== unsN) || (simpN === unsN && simpD !== unsD))
        return diag(
            'SIMP_UN_SOL',
            `Per simplificar, divideix el numerador i el denominador pel mateix nombre (un divisor comú de ${unsN} i ${unsD}).`
        );
    return diag(
        'SIMP_NO_EQUIVALENT',
        `${simpN}/${simpD} no és equivalent a ${unsN}/${unsD}. Divideix tots dos termes pel mateix nombre.`
    );
}

// ── Divisió: passar a producte per la inversa ───────────────────────────────
function inversa({ n1, d1, n2, d2, inN, inD }) {
    if (inN === n2 && inD === d2)
        return diag('INV_NO_GIRADA', `Dividir és multiplicar per la inversa: gira la segona fracció, ${n2}/${d2}.`);
    if (inN === d1 && inD === n1 && !(n1 === n2 && d1 === d2))
        return diag('INV_PRIMERA', `La primera fracció es queda igual: la que es gira és la segona, ${n2}/${d2}.`);
    return diag(
        'INV_MAL',
        `La inversa d'una fracció s'obté intercanviant el numerador i el denominador de ${n2}/${d2}.`
    );
}

// ── Producte de fraccions (a/b · c/e) ───────────────────────────────────────
function producte({ a, b, c, e, resN, resD }) {
    if (resN === a * e && resD === b * c && a * e !== a * c)
        return diag(
            'PROD_CREU',
            'Has multiplicat en creu. Per multiplicar fraccions: numerador per numerador i denominador per denominador.'
        );
    if (resN === a + c && resD === b + e)
        return diag('PROD_SUMA', `És una multiplicació: ${a} · ${c} a dalt i ${b} · ${e} a baix.`);
    if (resD === b * e && resN !== a * c) return diag('PROD_NUM', `Revisa el numerador: és ${a} · ${c}.`);
    if (resN === a * c && resD !== b * e) return diag('PROD_DEN', `Revisa el denominador: és ${b} · ${e}.`);
    return null;
}

const PASSOS = {
    'step-1': denominadorComu,
    'step-2': equivalents,
    'step-3': operacio,
    'step-4': simplificar,
    'step-md-1': inversa,
    'step-md-2': producte,
    'step-md-3': simplificar,
};

/**
 * @param {string} pas   id del pas ('step-1'…'step-4', 'step-md-1'…'step-md-3')
 * @param {object} dades valors del problema i de la resposta (vegeu cada funció)
 * @returns {{errorType: string, missatge: string, etiqueta: string} | null}
 */
export function diagnostica(pas, dades) {
    const f = PASSOS[pas];
    if (!f) return null;
    try {
        return f(dades);
    } catch (e) {
        return null; // un diagnòstic mai no ha de trencar el joc
    }
}
