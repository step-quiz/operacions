/**
 * ============================================================================
 * PROJECTE: Motor Educatiu d'Integrals (Vanilla JS)
 * FITXER: js/integrals/quasi-bank.js
 * ROL: Famílies d'integrals QUASI-IMMEDIATES (regla de la cadena al revés).
 *      ∫ c·x^{m−1}·g(f(x)) dx, amb f(x) = A·x^m + B (m ∈ {1,2,3}) i
 *      f′(x) = mA·x^{m−1}. La primitiva és  k·G(f(x)),  k = c/(mA).
 * NIVELLS:
 *   1 → l'integrand porta f′ exacta (c = mA, k = 1):  ∫2x(x²+1)³dx
 *   2 → f′ llevat d'una constant (c ≠ mA):            ∫x·e^{x²+1}dx = ½e^{x²+1}
 * FAMÍLIES (id → g, G):
 *   'int-quasi-pot' → fⁿ   → fⁿ⁺¹/(n+1)
 *   'int-quasi-log' → 1/f  → ln|f|
 *   'int-quasi-exp' → e^f  → e^f
 *   'int-quasi-cos' → cos f → sin f
 *   'int-quasi-sin' → sin f → −cos f
 * Cada generador retorna el mateix format que question-bank.js:
 *   { promptTex, solutionTex, wrong:[{tex, feedback, errorType, scope}], meta }
 *   (question-bank hi afegeix la selecció de distractors i les opcions).
 * Tots els coeficients es formen a partir de racionals reduïts amb el mateix
 * formatador (_fmtK): dos valors iguals donen sempre el mateix TeX, de manera
 * que la deduplicació per TeX de _selectDistractors també ho és per valor.
 * DEPENDÈNCIES: utils.js (gcd), math-engine.js (formatPowerTerm), strings.js.
 * ============================================================================
 */

import { gcd } from '../utils.js';
import { MathEngine } from './math-engine.js';
import { Strings } from './strings.js';

export const QuasiBank = (() => {
    const Q = Strings.Feedback.quasi;
    const _term = MathEngine.formatPowerTerm;
    const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

    // -------------------------------------------------------------------------
    // RACIONALS I FORMAT
    // -------------------------------------------------------------------------
    /** Racional reduït [num, den] amb den > 0. */
    function _rat(num, den) {
        const g = gcd(Math.abs(num), Math.abs(den)) || 1;
        const s = den < 0 ? -1 : 1;
        return [(s * num) / g, (s * den) / g];
    }
    const _mul = (r, num, den = 1) => _rat(r[0] * num, r[1] * den);

    /**
     * k·body en TeX. Si el cos és una fracció (fracBody) el coeficient va
     * davant amb \cdot; si no, una fracció de denominador q porta el cos a dalt.
     */
    function _fmtK([p, q], body, fracBody = false) {
        const sign = p < 0 ? '-' : '';
        const a = Math.abs(p);
        if (q === 1) {
            if (a === 1) return sign + body;
            return `${sign}${a}${fracBody ? '\\cdot ' : ''}${body}`;
        }
        if (fracBody) return `${sign}\\frac{${a}}{${q}}\\cdot ${body}`;
        return a === 1 ? `${sign}\\frac{${body}}{${q}}` : `${sign}\\frac{${a}${body}}{${q}}`;
    }

    /** f(x) = A·x^m + B en TeX (B ≠ 0 o no). */
    function _innerTex(A, m, B) {
        const t = _term(A, m);
        if (B === 0) return t;
        return B > 0 ? `${t}+${B}` : `${t}${B}`;
    }

    /** (F)^e, sense exponent si e = 1. */
    const _powBody = (F, e) => (e === 1 ? `(${F})` : `(${F})^{${e}}`);

    // -------------------------------------------------------------------------
    // TRIA DE L'INTERIOR I DE LA CONSTANT
    // -------------------------------------------------------------------------
    /**
     * @param {number} nivell 1 = f′ exacta · 2 = llevat d'una constant
     * @param {number[]} ms   graus possibles de l'interior
     * @returns {{A:number, m:number, B:number, c:number}}
     */
    function _tria(nivell, ms) {
        const m = _pick(ms);
        const A = m === 1 ? _pick([2, 3, 4, 5, -2, -3]) : m === 2 ? _pick([1, 1, 2, 3]) : _pick([1, 2]);
        const B = _pick([1, 2, 3, 4, 5, -1, -2, -3]);
        const fp = m * A; // constant de f′
        let c = fp;
        if (nivell >= 2) {
            do {
                c = _pick([1, 1, 2, 3, -1]);
            } while (c === fp);
        }
        return { A, m, B, c };
    }

    /** Factor de fora c·x^{m−1} en TeX ('' si és 1). */
    function _outerTex(c, m) {
        if (m === 1) return c === 1 ? '' : c === -1 ? '-' : String(c);
        return _term(c, m - 1);
    }

    // -------------------------------------------------------------------------
    // CONSTRUCTOR COMÚ
    // -------------------------------------------------------------------------
    /**
     * @param {string} family
     * @param {object} p        { A, m, B, c }
     * @param {object} spec     { integrand(outer, F, sepOuter) → TeX,
     *                            body(F) → TeX de G(f), k0 → racional extra de G,
     *                            own(ctx) → distractors propis }
     */
    function _build(family, p, spec, nivell, ruleLabel) {
        const { A, m, B, c } = p;
        const fp = m * A;
        const F = _innerTex(A, m, B);
        const outer = _outerTex(c, m);
        // Separador fi entre «2x» i «e^{…}» / «\cos(…)» perquè es llegeixi bé
        const sep = m >= 2 && outer !== '-' ? '\\,' : '';
        const integrand = spec.integrand(outer, F, sep);
        const k = _mul(spec.k0, c, fp); // coeficient de la primitiva
        const bodyTex = spec.body(F);
        const solutionTex = _fmtK(k, bodyTex);

        const wrong = [];
        const add = (tex, feedback, errorType, scope = 'family:quasi') =>
            wrong.push({ tex, feedback, errorType, scope });

        // NO_PRIMITIVE: la funció de dins de la integral, sense integrar
        add(integrand, Q.no_primitive, 'NO_PRIMITIVE', 'universal');
        // QI_MULT_INNER: ha multiplicat per f′ en lloc de dividir-hi → k·(mA)²
        add(_fmtK(_mul(k, fp * fp), bodyTex), Q.mult_inner, 'QI_MULT_INNER');
        // QI_CONST_FACTOR: ha deixat la constant de fora tal com era → k·mA
        add(_fmtK(_mul(k, fp), bodyTex), Q.const_factor, 'QI_CONST_FACTOR');
        // QI_KEEP_FPRIME: ha deixat el factor c·x^{m−1} a la primitiva (només si porta x)
        if (m >= 2) {
            const s = Math.sign(c) * Math.sign(k[0]) < 0 ? '-' : '';
            add(
                `${s}${_term(Math.abs(c), m - 1)}\\cdot ${_fmtK([Math.abs(k[0]), k[1]], bodyTex)}`,
                Q.keep_fprime,
                'QI_KEEP_FPRIME'
            );
        }
        spec.own({ k, F, A, m, B, add });

        return {
            promptTex: `\\displaystyle\\int ${integrand}\\,dx`,
            solutionTex,
            wrong,
            meta: { family, ruleLabel, nivell, params: { A, m, B, c } },
        };
    }

    // -------------------------------------------------------------------------
    // FAMÍLIES
    // -------------------------------------------------------------------------
    function generatePot(nivell = 1) {
        const p = _tria(nivell, [1, 2, 2, 3]);
        const n = p.m === 1 ? _pick([2, 3, 4, 5]) : _pick([2, 3, 4]);
        return _build(
            'int-quasi-pot',
            p,
            {
                integrand: (o, F) => `${o}${_powBody(F, n)}`,
                body: F => _powBody(F, n + 1),
                k0: [1, n + 1],
                own: ({ k, F, A, m, add }) => {
                    add(_fmtK(_mul(k, n + 1), _powBody(F, n + 1)), Q.pow_no_divide, 'QI_POW_NO_DIVIDE');
                    add(_fmtK(k, _powBody(F, n)), Q.pow_same_exp, 'QI_POW_SAME_EXP');
                    // Ha derivat c·fⁿ (sense el factor x): c·n·f^{n−1}
                    add(_fmtK(_mul(k, n * (n + 1) * m * A), _powBody(F, n - 1)), Q.pow_deriv, 'QI_POW_DERIV');
                },
            },
            nivell,
            'Quasi-immediata potencial'
        );
    }

    function generateLog(nivell = 1) {
        const p = _tria(nivell, [1, 2, 2, 3]);
        return _build(
            'int-quasi-log',
            p,
            {
                integrand: o => {
                    const neg = o.startsWith('-');
                    const num = p.m === 1 ? String(Math.abs(p.c)) : _term(Math.abs(p.c), p.m - 1);
                    return `${neg ? '-' : ''}\\frac{${num}}{${_innerTex(p.A, p.m, p.B)}}`;
                },
                body: F => `\\ln|${F}|`,
                k0: [1, 1],
                own: ({ k, F, add }) => {
                    add(_fmtK(_mul(k, -1), `\\frac{1}{(${F})^{2}}`, true), Q.log_deriv, 'QI_LOG_DERIV');
                },
            },
            nivell,
            'Quasi-immediata logarítmica'
        );
    }

    function generateExp(nivell = 1) {
        const p = _tria(nivell, [1, 2, 2, 3]);
        return _build(
            'int-quasi-exp',
            p,
            {
                integrand: (o, F, sep) => `${o}${sep}e^{${F}}`,
                body: F => `e^{${F}}`,
                k0: [1, 1],
                own: ({ k, A, m, B, add }) => {
                    const F1 = _innerTex(A, m, B + 1);
                    add(_fmtK(k, `\\frac{e^{${F1}}}{${F1}}`, true), Q.exp_power, 'QI_EXP_POWER');
                },
            },
            nivell,
            'Quasi-immediata exponencial'
        );
    }

    function _trig(family, fn, prim, k0, nivell, ruleLabel) {
        const p = _tria(nivell, [1, 2, 2, 3]);
        return _build(
            family,
            p,
            {
                integrand: (o, F, sep) => `${o}${sep}\\${fn}(${F})`,
                body: F => `\\${prim}(${F})`,
                k0,
                own: ({ k, F, add }) => {
                    add(_fmtK(_mul(k, -1), `\\${prim}(${F})`), Q.trig_sign, 'QI_TRIG_SIGN');
                },
            },
            nivell,
            ruleLabel
        );
    }
    const generateCos = (nivell = 1) =>
        _trig('int-quasi-cos', 'cos', 'sin', [1, 1], nivell, 'Quasi-immediata del cosinus');
    const generateSin = (nivell = 1) =>
        _trig('int-quasi-sin', 'sin', 'cos', [-1, 1], nivell, 'Quasi-immediata del sinus');

    const Families = {
        'int-quasi-pot': generatePot,
        'int-quasi-log': generateLog,
        'int-quasi-exp': generateExp,
        'int-quasi-cos': generateCos,
        'int-quasi-sin': generateSin,
    };

    return { Families, _testing: { _fmtK, _innerTex, _rat } };
})();
