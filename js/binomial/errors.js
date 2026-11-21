/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/binomial/errors.js
 * ROL: Diagnòstic dels errors de «Distribució binomial» (ERRORS_BI, strings.js):
 *   - n, p i q: n confós amb k; p sense passar a tant per u (o dividida per 10); p del fracàs;
 *     q = p; q mal calculada.
 *   - Passos de triar: el valor de l'opció falsa ja és l'error.
 *   - Cada cas: el nombre combinatori; sense C(n, k); exponents intercanviats; sense qⁿ⁻ᵏ.
 *   - La resposta: oblidar el 1 − del contrari; no passar a tant per cent.
 * ARQUITECTURA: mòdul pur.
 * DEPENDÈNCIES: algebra/racionals.js, math-engine.js, strings.js.
 * ============================================================================
 */

import { comRacional } from '../algebra/racionals.js';
import { combinatori } from './math-engine.js';
import { ERRORS_BI } from './strings.js';

const num = v => {
    const [n, d] = comRacional(v);
    return n / d;
};
const aprop = (a, b, tol) => Math.abs(a - b) <= tol + 1e-12;

function diagnosticaDades(pas, v) {
    const { n, k, p, q, forma } = pas.dades;
    if (v.n !== n) return v.n === k ? 'BI_N_K' : 'BI_N';
    const pv = p[0] / p[1];
    const pe = num(v.p);
    if (!aprop(pe, pv, 1e-9)) {
        if (forma === 'pc' && aprop(pe, pv * 100, 1e-9)) return 'BI_PERCENT';
        if (forma === 'pc' && aprop(pe, pv * 10, 1e-9)) return 'BI_PERCENT_DEC';
        if (aprop(pe, 1 - pv, 1e-9)) return 'BI_P_FRACASSOS';
        return 'BI_P';
    }
    const qe = num(v.q);
    if (!aprop(qe, q[0] / q[1], 1e-9)) return aprop(qe, pv, 1e-9) ? 'BI_Q_P' : 'BI_Q';
    return null;
}

function diagnosticaCas(pas, v) {
    const { n, j, p } = pas.dades;
    if (v.c !== combinatori(n, j)) return 'BI_COMBINATORI';
    const x = num(v.pj);
    const q = 1 - p;
    const C = combinatori(n, j);
    const tol = 1.5e-4;
    if (C !== 1 && aprop(x, p ** j * q ** (n - j), tol)) return 'BI_SENSE_C';
    if (j !== n - j && aprop(x, C * p ** (n - j) * q ** j, tol)) return 'BI_EXPONENTS';
    if (n - j > 0 && aprop(x, C * p ** j, tol)) return 'BI_OBLIDA_Q';
    return 'BI_CALCUL';
}

function diagnosticaFinal(pas, v) {
    const { contrari, suma, pc, resultat } = pas.dades;
    const x = num(v.r);
    const escala = pc ? 100 : 1;
    const tol = pc ? 0.02 : 2e-4;
    if (contrari && aprop(x, suma * escala, tol)) return 'BI_OBLIDA_1MENYS';
    if (pc && aprop(x, resultat, 2e-4)) return 'BI_PERCENT_FINAL';
    return 'BI_SUMA';
}

/** { missatge, etiqueta, codi } o null. */
export function diagnosticaBI(pas, valors) {
    let codi = null;
    if (pas.mena === 'tria') codi = String(valors.tria || '').split('#')[0];
    else if (pas.mena === 'dades') codi = diagnosticaDades(pas, valors);
    else if (pas.mena === 'cas') codi = diagnosticaCas(pas, valors);
    else if (pas.mena === 'final') codi = diagnosticaFinal(pas, valors);
    const e = codi && ERRORS_BI[codi];
    return e ? { missatge: e.missatge, etiqueta: e.etiqueta, codi } : null;
}

/** La resposta en text, per a l'historial. */
export function textRespostaBI(pas, valors) {
    if (pas.mena === 'tria') {
        const o = pas.opcions.find(([v]) => v === valors.tria);
        return o ? o[1] : String(valors.tria);
    }
    return Object.keys(pas.camps)
        .map(nom => {
            const [n, d] = comRacional(valors[nom]);
            const v = n / d;
            return Number.isInteger(v) ? String(v) : d <= 12 ? `${n}/${d}` : String(+v.toFixed(6)).replace('.', ',');
        })
        .join(' ; ');
}
