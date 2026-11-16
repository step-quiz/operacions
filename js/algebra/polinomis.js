/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/algebra/polinomis.js
 * ROL: Monomis, polinomis i expressions algebraiques: escriure'ls (TeX per a la
 *      pantalla i text pla per a l'historial), multiplicar-los i reduir-los.
 *      Comú a les activitats d'àlgebra (Equacions de 2n grau, Expressions
 *      algebraiques…).
 * ARQUITECTURA: mòdul pur (cap DOM, cap atzar).
 *
 *   MONOMI      { c, e }: coeficient (enter, o fracció [n, d]: vegeu racionals.js) i
 *               exponent de cada lletra
 *               ({ x: 2, y: 1 } és x²y; una lletra amb exponent 0 no hi és)
 *   POLINOMI    llista de monomis (sense reduir, si cal: és com està escrit)
 *   EXPRESSIÓ   suma de productes; cada producte és una llista de factors, i cada
 *               factor és un polinomi. Exemples:
 *                 3x − 2(x − 4)       [[[3x]], [[−2], [x, −4]]]
 *                 −(x + 2)(x − 3)     [[[−1], [x, 2], [x, −3]]]
 *                 3x² · (−2x)         [[[3x²], [−2x]]]
 *
 * DEPENDÈNCIES: algebra/racionals.js.
 * ============================================================================
 */

import { absCoef, coeficient, coefsIguals, producteCoef, signeCoef, sumaCoef } from './racionals.js';

const SUPER = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const MENYS = '−';

export function monomi(c, e = {}) {
    return { c, e };
}

/** Les lletres d'un monomi (exponent > 0), per ordre alfabètic. */
function lletresDe(e) {
    return Object.keys(e)
        .filter(l => e[l] > 0)
        .sort();
}

/** Clau de la part literal: «x2», «x1y1», «y1»… i «k» per al terme independent. */
export function clauMonomi(e) {
    const ls = lletresDe(e);
    return ls.length ? ls.map(l => l + e[l]).join('') : 'k';
}

/** «x2y1» → { x: 2, y: 1 }; «k» → {}. */
export function exponentsDeClau(clau) {
    const e = {};
    for (const [, l, n] of clau.matchAll(/([a-z])(\d+)/g)) e[l] = Number(n);
    return e;
}

export function grauMonomi(e) {
    return lletresDe(e).reduce((s, l) => s + e[l], 0);
}

/** Ordre habitual: primer el grau més alt; a igual grau, més exponent de la primera lletra (x², xy, y², x, y, 1). */
export function comparaMonomis(a, b) {
    const dg = grauMonomi(b.e) - grauMonomi(a.e);
    if (dg) return dg;
    for (const l of [...new Set([...lletresDe(a.e), ...lletresDe(b.e)])].sort()) {
        const d = (b.e[l] || 0) - (a.e[l] || 0);
        if (d) return d;
    }
    return 0;
}

/** Suma els termes semblants, treu els que valen 0 i els ordena. */
export function redueixPolinomi(monomis) {
    const termes = new Map();
    for (const m of monomis) {
        const clau = clauMonomi(m.e);
        if (!termes.has(clau)) {
            const e = {};
            lletresDe(m.e).forEach(l => (e[l] = m.e[l]));
            termes.set(clau, { c: 0, e });
        }
        const t = termes.get(clau);
        t.c = sumaCoef(t.c, m.c);
    }
    return [...termes.values()].filter(m => signeCoef(m.c) !== 0).sort(comparaMonomis);
}

/** Si dos polinomis són iguals, un cop reduïts. */
export function polinomisIguals(p, q) {
    const [a, b] = [redueixPolinomi(p), redueixPolinomi(q)];
    return (
        a.length === b.length && a.every((m, i) => coefsIguals(m.c, b[i].c) && clauMonomi(m.e) === clauMonomi(b[i].e))
    );
}

export function multiplicaMonomis(a, b) {
    const e = { ...a.e };
    for (const l of Object.keys(b.e)) e[l] = (e[l] || 0) + b.e[l];
    return { c: producteCoef(a.c, b.c), e };
}

/** Cada terme de p per cada terme de q (sense reduir). `producte` permet provar regles equivocades. */
export function multiplicaPolinomis(p, q, producte = multiplicaMonomis) {
    return p.flatMap(a => q.map(b => producte(a, b)));
}

/**
 * Desenvolupa una expressió: fa els productes i torna la llista de termes, sense reduir.
 * @param {object} regles  multiplica(p, q): com es multipliquen dos factors (per defecte, bé).
 *                         errors.js hi posa regles equivocades per reconèixer errors típics.
 */
export function desenvolupa(expr, { multiplica = multiplicaPolinomis } = {}) {
    return expr.flatMap(factors => factors.slice(1).reduce((acc, f) => multiplica(acc, f), factors[0]));
}

// ── Escriptura ───────────────────────────────────────────────────────────────
/** Un monomi sense el signe: «3x²», «xy», «7», «\frac{1}{2}x» (TeX) o «(1/2)x» (text). */
function cosMonomi(m, tex) {
    const abs = absCoef(m.c);
    const part = lletresDe(m.e)
        .map(l => {
            const n = m.e[l];
            if (n === 1) return l;
            return tex ? `${l}^{${n}}` : l + [...String(n)].map(d => SUPER[d]).join('');
        })
        .join('');
    if (Array.isArray(abs)) {
        const [n, d] = abs;
        if (tex) return `\\frac{${n}}{${d}}${part}`;
        return part === '' ? `${n}/${d}` : `(${n}/${d})${part}`;
    }
    if (part === '') return String(abs);
    return (abs === 1 ? '' : String(abs)) + part;
}

/** Un polinomi, en l'ordre donat: «3x^{2} - x + 5» (TeX) o «3x² − x + 5» (text). Els termes que valen 0 no s'escriuen. */
export function escriuPolinomi(monomis, { tex = true } = {}) {
    const menys = tex ? '-' : MENYS;
    let out = '';
    for (const m of monomis) {
        const signe = signeCoef(m.c);
        if (signe === 0) continue;
        if (out === '') out = (signe < 0 ? menys : '') + cosMonomi(m, tex);
        else out += ` ${signe < 0 ? menys : '+'} ${cosMonomi(m, tex)}`;
    }
    return out === '' ? '0' : out;
}

/** Entre parèntesis (en TeX, que s'adaptin a l'alçada de les fraccions). */
export function parentesi(dins, tex = true) {
    return tex ? `\\left(${dins}\\right)` : `(${dins})`;
}

/**
 * Una expressió tal com s'escriu: «3x - 2(x - 4)», «-(x + 2)(x - 3)», «3x^{2} \cdot (-2x)».
 * Un factor d'un sol terme s'escriu sense parèntesis (entre parèntesis si és negatiu i no va
 * primer); un factor de més d'un terme, entre parèntesis. Un ±1 davant d'un parèntesi no s'escriu.
 */
export function escriuExpressio(expr, { tex = true } = {}) {
    const menys = tex ? '-' : MENYS;
    const per = tex ? ' \\cdot ' : ' · ';
    let out = '';
    expr.forEach((factors, i) => {
        let negatiu = false;
        let cos = '';
        factors.forEach((f, j) => {
            if (f.length !== 1) {
                cos += parentesi(escriuPolinomi(f, { tex }), tex);
                return;
            }
            const [m] = f;
            if (j === 0) {
                negatiu = signeCoef(m.c) < 0;
                const unSol = coefsIguals(absCoef(m.c), 1) && !lletresDe(m.e).length && factors.length > 1;
                cos = unSol ? '' : cosMonomi(m, tex);
                return;
            }
            const escrit = signeCoef(m.c) < 0 ? parentesi(menys + cosMonomi(m, tex), tex) : cosMonomi(m, tex);
            cos += cos !== '' && factors[j - 1].length === 1 ? per + escrit : escrit;
        });
        out += i === 0 ? (negatiu ? menys : '') + cos : ` ${negatiu ? menys : '+'} ${cos}`;
    });
    return out;
}

// ── Per al joc de passos (js/passos/) ────────────────────────────────────────
/**
 * Plantilla «= [ ]x² + [ ]x + [ ]» per escriure un polinomi coeficient a coeficient.
 * @param {string[]} claus      els termes que es poden omplir (clauMonomi), en ordre
 * @param {object[]} resultat   el polinomi bo (reduït)
 * @param {string} tipusCamp    'coeficient' (enters) o 'coeficientRacional' (fraccions)
 * @returns {{plantilla, camps, solucio}} les parts d'un pas (vegeu js/passos/joc-passos.js)
 */
export function plantillaPolinomi(claus, resultat, tipusCamp = 'coeficient') {
    const plantilla = [{ tex: '=' }];
    const camps = {};
    const solucio = {};
    claus.forEach((clau, i) => {
        plantilla.push({ camp: clau });
        const lletres = clau === 'k' ? '' : escriuPolinomi([monomi(1, exponentsDeClau(clau))]);
        // (\; perquè KaTeX no enganxi el + final a la lletra)
        const tex = lletres + (i < claus.length - 1 ? '\\;+' : '');
        if (tex) plantilla.push({ tex });
        camps[clau] = tipusCamp;
        const terme = resultat.find(m => clauMonomi(m.e) === clau);
        solucio[clau] = terme ? terme.c : 0;
    });
    return { plantilla, camps, solucio };
}

/** El polinomi que ha escrit l'alumne en una plantillaPolinomi (els «valors» de corregeixPas). */
export function polinomiDeCoeficients(valors, claus) {
    return redueixPolinomi(
        claus.map(clau => {
            const v = valors[clau] || 0;
            return monomi(Array.isArray(v) ? coeficient(v[0], v[1]) : v, exponentsDeClau(clau));
        })
    );
}
