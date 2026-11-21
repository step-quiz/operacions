/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/logaritmes/errors.js
 * ROL: Diagnòstic dels errors de «Logaritmes i equacions», bloc 1 (ERRORS_LG, strings.js).
 *   - Passos de triar: el valor de l'opció falsa ja és l'error.
 *   - x com a potència: el signe de l'exponent, l'exponent invertit.
 *   - El valor del logaritme: x : a (log₂ 8 = 4), l'argument com a resultat.
 *   - Forma exponencial ↔ logarítmica: base i exponent intercanviats.
 *   - Calculadora: ln en lloc de log (o al revés).
 * ARQUITECTURA: mòdul pur.
 * DEPENDÈNCIES: algebra/racionals.js, strings.js.
 * ============================================================================
 */

import { comRacional } from '../algebra/racionals.js';
import { ERRORS_LG } from './strings.js';

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
