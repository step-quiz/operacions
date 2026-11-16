/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/equacions-segon-grau/errors.js
 * ROL: Taxonomia d'errors d'«Equacions de 2n grau» i diagnòstic de cada
 *      resposta incorrecta (el mateix patró que js/fraccions/errors-fraccions.js).
 *
 * Quan l'alumne s'equivoca en un pas, diagnosticaSG(pas, valors) mira si la
 * resposta encaixa amb un error típic (el quadrat d'un negatiu, sumar 4ac,
 * oblidar la solució negativa…) i en torna el tipus i un missatge que orienta
 * sense donar la resposta. Si no encaixa amb cap, torna null i el joc només
 * resta un intent.
 *
 * Mòdul pur: no toca el DOM (es prova a tests/equacions-segon-grau.test.js).
 * DEPENDÈNCIES: algebra/racionals.js.
 * ============================================================================
 */

import { comRacional, racional, racionalsIguals } from '../algebra/racionals.js';

// ── Taxonomia ────────────────────────────────────────────────────────────────
// etiqueta: com es diu l'error a l'historial de la sessió.
// missatge: el que llegeix l'alumne (text, o funció de les dades del pas).
export const ERRORS_SG = {
    CLASSIFICA: {
        etiqueta: "tipus d'equació",
        missatge: 'Mira quins termes té: en x², en x i sense x. Quin hi falta, si en falta algun?',
    },
    COEF_SIGNE: {
        etiqueta: 'signe dels coeficients',
        missatge: 'El signe de davant forma part del coeficient.',
    },
    COEF_ORDRE: {
        etiqueta: 'coeficients intercanviats',
        missatge: d =>
            `a és el coeficient de ${d.v}², b el de ${d.v} i c el terme sense ${d.v}. Vigila l'ordre en què estan escrits.`,
    },
    COEF_U: {
        etiqueta: 'coeficient 1 que no es veu',
        missatge: 'Si davant de la lletra no hi ha cap nombre, el coeficient és 1 (o −1).',
    },
    ORDENA_SIGNE: {
        etiqueta: 'signe en canviar de membre',
        missatge: 'Quan un terme canvia de membre, canvia de signe.',
    },
    ORDENA_QUADRAT: {
        etiqueta: 'quadrat del binomi sense doble producte',
        missatge: "El quadrat d'una suma no és la suma dels quadrats: hi falta el doble producte.",
    },
    ORDENA_DISTRIBUTIVA: {
        etiqueta: 'producte incomplet',
        missatge: "Multiplica cada terme d'un factor per cada terme de l'altre: no te'n deixis cap.",
    },
    DISC_B2_NEGATIU: {
        etiqueta: 'quadrat de b negatiu',
        missatge: "b² és el quadrat de b amb el seu signe: el quadrat d'un nombre negatiu és positiu.",
    },
    DISC_SIGNE_4AC: {
        etiqueta: 'signe de 4ac',
        missatge: d =>
            d.a * d.c < 0
                ? 'Com que a·c és negatiu, −4ac és positiu: restar un nombre negatiu és sumar.'
                : 'El terme 4ac es resta: Δ = b² − 4ac.',
    },
    DISC_SENSE_4: { etiqueta: 'discriminant sense el 4', missatge: "T'has deixat el 4: Δ = b² − 4·a·c." },
    DISC_DOBLE_B: { etiqueta: 'b² com a 2b', missatge: 'b² vol dir b·b, no 2·b.' },
    DISC_ARREL: {
        etiqueta: 'arrel en lloc del discriminant',
        missatge: "Has escrit l'arrel quadrada. Aquí es demana Δ, encara sense fer-ne l'arrel.",
    },
    NOMBRE_DELTA: {
        etiqueta: 'nombre de solucions',
        missatge:
            "Mira el signe de Δ. L'arrel d'un nombre positiu dona dos resultats amb el ±; la de 0 és 0; la d'un nombre negatiu no existeix.",
    },
    FORM_SIGNE_B: { etiqueta: 'b en lloc de −b', missatge: "A la fórmula hi va −b: l'oposat de b." },
    FORM_ARREL: {
        etiqueta: 'Δ sense arrel',
        missatge: "Al numerador hi va l'arrel quadrada de Δ, no Δ.",
    },
    FORM_ARREL_MEITAT: {
        etiqueta: 'arrel com a meitat',
        missatge: "L'arrel quadrada no és la meitat: busca el nombre que, multiplicat per ell mateix, dona Δ.",
    },
    FORM_DEN: { etiqueta: 'denominador de la fórmula', missatge: 'El denominador és 2a: el doble de a.' },
    SOL_SIGNE: {
        etiqueta: 'signe de les solucions',
        missatge: 'Els valors són bons, però amb el signe canviat. Repassa els signes de la divisió.',
    },
    SOL_SENSE_DIVIDIR: {
        etiqueta: 'solucions sense dividir',
        missatge: 'Has fet la suma i la resta del numerador, però falta dividir pel denominador.',
    },
    SOL_DIVISOR: {
        etiqueta: 'divisor equivocat',
        missatge: 'Repassa el divisor: és tot el denominador, 2a.',
    },
    SOL_NOMES_ARREL: {
        etiqueta: "dividir només l'arrel",
        missatge: "El denominador divideix tot el numerador, no només l'arrel.",
    },
    AILLAR_SIGNE: {
        etiqueta: 'signe en aïllar',
        missatge: "Quan el terme sense x passa a l'altre membre, canvia de signe.",
    },
    DIVIDIR_RESTA: {
        etiqueta: 'restar en lloc de dividir',
        missatge: 'El coeficient multiplica x²: passa dividint, no restant.',
    },
    DIVIDIR_SIGNE: { etiqueta: 'signe de la divisió', missatge: 'Repassa el signe de la divisió.' },
    DIVIDIR_INVERS: {
        etiqueta: 'divisió girada',
        missatge: 'Has dividit al revés: el coeficient de x² és el divisor.',
    },
    NOMBRE_QUADRAT: {
        etiqueta: 'nombre de solucions',
        missatge:
            'Pensa quins nombres, elevats al quadrat, donen aquest resultat. Un quadrat mai és negatiu, i un nombre i el seu oposat tenen el mateix quadrat.',
    },
    ARRELS_NOMES_POSITIVA: {
        etiqueta: 'falta la solució negativa',
        missatge: "Falta la solució negativa: l'oposat d'un nombre té el mateix quadrat.",
    },
    ARRELS_SENSE_ARREL: { etiqueta: "sense fer l'arrel", missatge: "Falta fer l'arrel quadrada." },
    ARRELS_MEITAT: {
        etiqueta: 'arrel com a meitat',
        missatge:
            "L'arrel quadrada no és la meitat: busca el nombre que, multiplicat per ell mateix, dona el resultat.",
    },
    FACTOR_SIGNE: {
        etiqueta: 'signe en treure factor comú',
        missatge: "Repassa els signes: si multipliques x pel parèntesi ha de tornar a sortir l'equació.",
    },
    FACTOR_INTERCANVI: {
        etiqueta: 'termes del parèntesi intercanviats',
        missatge: 'Dins del parèntesi, primer va el terme amb x i després el nombre.',
    },
    ZERO_PERDUT: {
        etiqueta: 'falta la solució x = 0',
        missatge: 'Si x multiplica el parèntesi, el producte també val 0 quan x val 0.',
    },
    LINEAL_SIGNE: {
        etiqueta: 'signe de la segona solució',
        missatge: "Iguala el parèntesi a 0 i resol-lo: el nombre canvia de signe quan passa a l'altre membre.",
    },
    LINEAL_INVERSA: {
        etiqueta: 'divisió girada',
        missatge: 'Has dividit al revés: el coeficient de x és el divisor.',
    },
    LINEAL_SENSE_DIVIDIR: {
        etiqueta: 'falta dividir pel coeficient',
        missatge: 'Iguala el parèntesi a 0: després de passar el nombre, falta dividir pel coeficient de x.',
    },
};

// ── Eines ────────────────────────────────────────────────────────────────────
const proporcionalsSG = (v, w) => v[0] !== 0 && v[0] * w[1] === v[1] * w[0] && v[0] * w[2] === v[2] * w[0];

/** Els dos valors escrits en un pas de dues solucions, com a racionals. */
function parellEscritSG(valors) {
    return [comRacional(valors.x1), comRacional('x2' in valors ? valors.x2 : valors.x1)];
}

/** Si el parell escrit és {s1, s2} (racionals), en qualsevol ordre. */
function esParellSG(escrit, s1, s2) {
    const [x, y] = escrit;
    return (racionalsIguals(x, s1) && racionalsIguals(y, s2)) || (racionalsIguals(x, s2) && racionalsIguals(y, s1));
}

// ── Regles: per a cada mena de pas, quin error típic explica la resposta ─────
const REGLES_SG = {
    classifica: () => 'CLASSIFICA',

    coeficients(d, v) {
        const bo = [d.a, d.b, d.c];
        const seu = [v.a, v.b, v.c];
        if (seu.every((n, i) => Math.abs(n) === Math.abs(bo[i]))) return 'COEF_SIGNE';
        const ordenat = llista => [...llista].sort((x, y) => x - y).join();
        if (ordenat(seu) === ordenat(bo)) return 'COEF_ORDRE';
        if (seu.some((n, i) => n === 0 && Math.abs(bo[i]) === 1)) return 'COEF_U';
        return null;
    },

    ordena(d, v) {
        const seu = [v.a, v.b, v.c];
        const trampa = (d.trampes || []).find(t => proporcionalsSG(seu, t.coefs));
        if (trampa) return trampa.errorType;
        const abs = llista => llista.map(Math.abs);
        if (proporcionalsSG(abs(seu), abs([d.a, d.b, d.c]))) return 'ORDENA_SIGNE';
        return null;
    },

    discriminant(d, v) {
        const { a, b, c } = d;
        if (b < 0 && v.delta === -b * b - 4 * a * c) return 'DISC_B2_NEGATIU';
        if (v.delta === b * b + 4 * a * c) return 'DISC_SIGNE_4AC';
        if (v.delta === b * b - a * c) return 'DISC_SENSE_4';
        if (v.delta === 2 * b - 4 * a * c) return 'DISC_DOBLE_B';
        if (v.delta > 0 && v.delta * v.delta === b * b - 4 * a * c) return 'DISC_ARREL';
        return null;
    },

    nombre: () => 'NOMBRE_DELTA',

    formula(d, v) {
        if (v.mb !== 0 - d.b) return v.mb === d.b ? 'FORM_SIGNE_B' : null;
        if ('arrel' in v && v.arrel !== d.arrel) {
            if (v.arrel === d.delta) return 'FORM_ARREL';
            return v.arrel * 2 === d.delta ? 'FORM_ARREL_MEITAT' : null;
        }
        return v.da === d.a || v.da === 2 ? 'FORM_DEN' : null;
    },

    solucions(d, v) {
        const escrit = parellEscritSG(v);
        const [n1, n2] = [0 - d.b + d.arrel, 0 - d.b - d.arrel];
        const da = 2 * d.a;
        if (esParellSG(escrit, racional(-n1, da), racional(-n2, da))) return 'SOL_SIGNE';
        if (esParellSG(escrit, [n1, 1], [n2, 1])) return 'SOL_SENSE_DIVIDIR';
        if (
            esParellSG(escrit, racional(n1, 2), racional(n2, 2)) ||
            esParellSG(escrit, racional(n1, d.a), racional(n2, d.a))
        )
            return 'SOL_DIVISOR';
        if (esParellSG(escrit, racional(-d.b * da + d.arrel, da), racional(-d.b * da - d.arrel, da)))
            return 'SOL_NOMES_ARREL';
        return null;
    },

    aillar: (d, v) => (v.k === d.c ? 'AILLAR_SIGNE' : null),

    dividir(d, v) {
        const q = comRacional(v.q);
        if (racionalsIguals(q, [0 - d.c - d.a, 1])) return 'DIVIDIR_RESTA';
        if (racionalsIguals(q, [d.c, d.a])) return 'DIVIDIR_SIGNE';
        if (racionalsIguals(q, [d.a, 0 - d.c])) return 'DIVIDIR_INVERS';
        return null;
    },

    nombreArrel: () => 'NOMBRE_QUADRAT',

    arrels(d, v) {
        const escrit = parellEscritSG(v);
        const menys = q => [0 - q[0], q[1]];
        if (esParellSG(escrit, d.r, d.r)) return 'ARRELS_NOMES_POSITIVA';
        if (esParellSG(escrit, d.k, menys(d.k))) return 'ARRELS_SENSE_ARREL';
        const meitat = racional(d.k[0], 2 * d.k[1]);
        if (esParellSG(escrit, meitat, menys(meitat))) return 'ARRELS_MEITAT';
        return null;
    },

    factor(d, v) {
        if (Math.abs(v.p) === Math.abs(d.a) && Math.abs(v.q) === Math.abs(d.b)) return 'FACTOR_SIGNE';
        if (v.p === d.b && v.q === d.a) return 'FACTOR_INTERCANVI';
        return null;
    },

    solucionsFactor(d, v) {
        const escrit = parellEscritSG(v);
        const altres = escrit.filter(q => q[0] !== 0);
        if (altres.length === 2) return 'ZERO_PERDUT';
        const [altra] = altres;
        if (!altra) return null;
        if (racionalsIguals(altra, [d.b, d.a])) return 'LINEAL_SIGNE';
        if (racionalsIguals(altra, [0 - d.a, d.b])) return 'LINEAL_INVERSA';
        if (racionalsIguals(altra, [0 - d.b, 1])) return 'LINEAL_SENSE_DIVIDIR';
        return null;
    },
};
// El canvi t = x² d'una biquadrada demana els mateixos tres coeficients
REGLES_SG.canvi = REGLES_SG.coeficients;

/**
 * Diagnostica la resposta incorrecta d'un pas.
 * @param {object} pas      el pas (de passosEquacioSG)
 * @param {object} valors   el que ha escrit l'alumne (els «valors» de corregeixPas)
 * @returns {{errorType:string, missatge:string, etiqueta:string}|null}
 */
export function diagnosticaSG(pas, valors) {
    try {
        const regla = REGLES_SG[pas.mena];
        const errorType = regla ? regla(pas.dades || {}, valors || {}) : null;
        if (!errorType) return null;
        const { etiqueta, missatge } = ERRORS_SG[errorType];
        const dades = { ...pas.dades, v: pas.mena === 'canvi' ? 't' : 'x' };
        return { errorType, etiqueta, missatge: typeof missatge === 'function' ? missatge(dades) : missatge };
    } catch (e) {
        return null;
    }
}
