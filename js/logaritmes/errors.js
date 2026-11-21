/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/logaritmes/errors.js
 * ROL: Diagnòstic dels errors de «Logaritmes i equacions»: bloc 1, logaritmes (ERRORS_LG,
 *      diagnosticaLG) i bloc 2, equacions (ERRORS_EQ, diagnosticaEQ; strings.js).
 *   - Passos de triar: el valor de l'opció falsa ja és l'error.
 *   - x com a potència: el signe de l'exponent, l'exponent invertit.
 *   - El valor del logaritme: x : a (log₂ 8 = 4), l'argument com a resultat.
 *   - Forma exponencial ↔ logarítmica: base i exponent intercanviats.
 *   - Calculadora: ln en lloc de log (o al revés).
 *   Equacions:
 *   - Passos de triar (també les comprovacions): el valor de l'opció falsa ja és l'error.
 *   - La x d'igualar exponents: igualar sense la mateixa base, la potència d'una potència,
 *     el signe de l'exponent. La x d'una logarítmica: A = m·b, A = mᵇ, A = m.
 *   - El segon grau: les solucions amb el signe canviat. aˣ = N: log N − log a, N/a, el
 *     quocient a l'inrevés.
 * ARQUITECTURA: mòdul pur.
 * DEPENDÈNCIES: algebra/racionals.js, strings.js.
 * ============================================================================
 */

import { comRacional } from '../algebra/racionals.js';
import { ERRORS_EQ, ERRORS_LG } from './strings.js';

const valorLG = v => {
    const [n, d] = comRacional(v);
    return n / d;
};
const prop = (a, b) => Math.abs(a - b) < 1e-9;

function diagnosticaPotencia(pas, valors) {
    const k = valorLG(pas.dades.k);
    const e = valorLG(valors.k);
    if (prop(e, -k)) return 'LG_SIGNE';
    if (k !== 0 && prop(e, 1 / k)) return 'LG_INVERS';
    return 'LG_DEFINICIO';
}
function diagnosticaValor(pas, valors) {
    const { b, k, x } = pas.dades;
    const e = valorLG(valors.v);
    const kv = valorLG(k);
    if (prop(e, -kv)) return 'LG_SIGNE';
    if (typeof b === 'number' && prop(e, x / b)) return 'LG_DIVIDEIX';
    if (prop(e, x)) return 'LG_ARGUMENT';
    return 'LG_DEFINICIO';
}
function diagnosticaForma(pas, valors) {
    const { b, k, x } = pas.dades;
    const y = valorLG(valors.y);
    const xv = valorLG(valors.x);
    const xs = valorLG(x);
    if (valors.a === k && prop(y, b)) return 'LG_FORMA';
    if (prop(y, xs) && prop(xv, k)) return 'LG_FORMA';
    return 'LG_FORMA_ALTRE';
}
function diagnosticaCalculadora(pas, valors) {
    const { b, x } = pas.dades;
    const e = valorLG(valors.v);
    const altre = Math.abs(b === 10 ? Math.log(x) : Math.log10(x));
    if (Math.abs(e - altre) <= 1.5e-4) return 'LG_LN_LOG';
    return 'LG_CALC';
}

/** { missatge, etiqueta, codi } o null. */
export function diagnosticaLG(pas, valors) {
    let codi = null;
    if (pas.mena === 'tria') codi = String(valors.tria || '').split('#')[0];
    else if (pas.mena === 'potencia') codi = diagnosticaPotencia(pas, valors);
    else if (pas.mena === 'valor') codi = diagnosticaValor(pas, valors);
    else if (pas.mena === 'valorCalcul') codi = 'LG_VALOR';
    else if (pas.mena === 'forma') codi = diagnosticaForma(pas, valors);
    else if (pas.mena === 'calculadora') codi = diagnosticaCalculadora(pas, valors);
    const e = codi && ERRORS_LG[codi];
    return e ? { missatge: e.missatge, etiqueta: e.etiqueta, codi } : null;
}

/** La resposta en text, per a l'historial. */
export function textRespostaLG(pas, valors) {
    if (pas.mena === 'tria') {
        const o = pas.opcions.find(([v]) => v === valors.tria);
        return o ? o[1] : String(valors.tria);
    }
    return Object.keys(pas.camps)
        .map(nom => {
            const v = valors[nom];
            if (typeof v === 'number') return String(v);
            const [n, d] = comRacional(v);
            return d === 1
                ? String(n)
                : d <= 1000 && Number.isInteger(n) && pas.camps[nom] === 'racional'
                  ? `${n}/${d}`
                  : String(+(n / d).toFixed(6)).replace('.', ',');
        })
        .join(' ; ');
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOC 2: EQUACIONS
// ═════════════════════════════════════════════════════════════════════════════
const igualsEQ = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
function diagnosticaXEQ(pas, valors) {
    const x = valorLG(valors.x);
    const d = pas.dades;
    if (pas.id === 'exponents') {
        const { a, i, j, p, q } = d;
        if (igualsEQ(x, (a ** j - q) / p)) return 'EQ_EXPONENT_SENSE_BASE';
        if (igualsEQ(x, (j - q) / (i * p)) || igualsEQ(x, (j - q) / p)) return 'EQ_POTENCIA_DE_POTENCIA';
        if (j && igualsEQ(x, (-j - i * q) / (i * p))) return 'EQ_SIGNE_EXPONENT';
        return 'EQ_PRIMER_GRAU';
    }
    const { b, m, p, q } = d;
    if (igualsEQ(x, (m * b - q) / p)) return 'EQ_LOG_PRODUCTE';
    if (igualsEQ(x, (m ** b - q) / p)) return 'EQ_BASE_EXPONENT';
    if (igualsEQ(x, (m - q) / p)) return 'EQ_TREU_LOG';
    return 'EQ_PRIMER_GRAU';
}
function diagnosticaArrelsEQ(pas, valors) {
    const [r1, r2] = pas.dades.arrels;
    const e = [valorLG(valors.x1), valorLG(valors.x2)].sort((u, v) => u - v);
    const oposades = [-r1, -r2].sort((u, v) => u - v);
    if (r1 + r2 !== 0 && igualsEQ(e[0], oposades[0]) && igualsEQ(e[1], oposades[1])) return 'EQ_SIGNE_ARRELS';
    return 'EQ_SEGON_GRAU';
}
function diagnosticaCalculadoraEQ(pas, valors) {
    const { a, N } = pas.dades;
    const v = valorLG(valors.v);
    const tol = 1.5e-4;
    if (igualsEQ(v, Math.log10(N / a), tol) || igualsEQ(v, Math.log(N / a), tol)) return 'EQ_LOG_QUOCIENT';
    if (igualsEQ(v, N / a, tol)) return 'EQ_DIVIDEIX';
    if (igualsEQ(v, Math.log(a) / Math.log(N), tol)) return 'EQ_INVERS';
    return 'EQ_CALC';
}

/** { missatge, etiqueta, codi } o null. */
export function diagnosticaEQ(pas, valors) {
    let codi = null;
    if (pas.mena === 'tria') codi = String(valors.tria || '').split('#')[0];
    else if (pas.mena === 'x') codi = diagnosticaXEQ(pas, valors);
    else if (pas.mena === 'arrels') codi = diagnosticaArrelsEQ(pas, valors);
    else if (pas.mena === 'calculadoraEQ') codi = diagnosticaCalculadoraEQ(pas, valors);
    const e = codi && ERRORS_EQ[codi];
    return e ? { missatge: e.missatge, etiqueta: e.etiqueta, codi } : null;
}
