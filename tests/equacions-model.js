/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/equacions-model.js
 * ROL: Model independent de «Logaritmes i equacions», bloc 2 (equacions), per als tests i
 *      la prova al navegador. Compila el TeX d'una equació que es veu (potències,
 *      \sqrt, \log, \log_{b}, \ln, \dfrac, \cdot, lletres x i t) a una funció, i en
 *      busca les solucions reals per escombratge i bisecció (sense saber res del motor).
 * ============================================================================
 */
'use strict';

/** Compila una expressió TeX a una funció (vars) → nombre (NaN fora del domini). */
function compila(tex) {
    const src = tex
        .replace(/\\left|\\right|\\big|\\Big|\\,|\\;|\\quad/g, '')
        .replace(/\\dfrac|\\tfrac/g, '\\frac')
        .replace(/\{,\}/g, '.')
        .replace(/\s+/g, '');
    let i = 0;
    const eat = s => (src.startsWith(s, i) ? ((i += s.length), true) : false);
    const need = s => {
        if (!eat(s)) throw new Error(`s'esperava «${s}» a ${i}: ${src}`);
    };
    const grup = () => {
        need('{');
        const f = expr();
        need('}');
        return f;
    };
    const log = (x, b) => (x > 0 ? Math.log(x) / Math.log(b) : NaN);
    function atom() {
        if (eat('\\frac')) {
            const a = grup();
            const b = grup();
            return v => a(v) / b(v);
        }
        if (eat('\\sqrt')) {
            const a = grup();
            return v => (a(v) >= 0 ? Math.sqrt(a(v)) : NaN);
        }
        if (eat('\\log_')) {
            const b = src[i] === '{' ? grup() : atom();
            const x = factor();
            return v => log(x(v), b(v));
        }
        if (eat('\\log')) {
            const x = factor();
            return v => log(x(v), 10);
        }
        if (eat('\\ln')) {
            const x = factor();
            return v => log(x(v), Math.E);
        }
        if (eat('(')) {
            const f = expr();
            need(')');
            return f;
        }
        if (src[i] === '{') return grup();
        if (eat('e')) return () => Math.E;
        for (const l of ['x', 't']) if (eat(l)) return v => v[l];
        const m = /^\d+(\.\d+)?/.exec(src.slice(i));
        if (m) {
            i += m[0].length;
            const n = Number(m[0]);
            return () => n;
        }
        throw new Error(`inesperat «${src[i]}» a ${i}: ${src}`);
    }
    function factor() {
        const b = atom();
        if (eat('^')) {
            const neg = eat('-');
            const e = src[i] === '{' ? grup() : atom();
            return neg ? v => b(v) ** -e(v) : v => b(v) ** e(v);
        }
        return b;
    }
    function terme() {
        let f = factor();
        for (;;) {
            const g = f;
            if (eat('\\cdot')) {
                const h = factor();
                f = v => g(v) * h(v);
            } else if (i < src.length && !'+-)}='.includes(src[i])) {
                const h = factor();
                f = v => g(v) * h(v);
            } else return f;
        }
    }
    function expr() {
        let f;
        if (eat('-')) {
            const t = terme();
            f = v => -t(v);
        } else f = terme();
        for (;;) {
            const g = f;
            if (eat('+')) {
                const h = terme();
                f = v => g(v) + h(v);
            } else if (eat('-')) {
                const h = terme();
                f = v => g(v) - h(v);
            } else return f;
        }
    }
    const f = expr();
    if (i !== src.length) throw new Error(`sobra text a ${i}: ${src}`);
    return f;
}

/** «A = B» → { esq, dre, f } amb f(valor) = A − B a la lletra donada. */
function equacio(tex, lletra = 'x') {
    const parts = tex.split('=');
    if (parts.length !== 2) throw new Error(`no és una equació: ${tex}`);
    const [esq, dre] = parts.map(compila);
    return {
        esq: x => esq({ [lletra]: x }),
        dre: x => dre({ [lletra]: x }),
        f: x => esq({ [lletra]: x }) - dre({ [lletra]: x }),
    };
}

/** Les solucions reals de l'equació a [lo, hi] (escombratge de pas h i bisecció). */
function solucions(tex, { lletra = 'x', lo = -20, hi = 20, h = 0.01 } = {}) {
    const { f } = equacio(tex, lletra);
    const sols = [];
    const afegeix = x => {
        if (!sols.some(s => Math.abs(s - x) < 1e-6)) sols.push(x);
    };
    let xa = lo;
    let fa = f(xa);
    const n = Math.round((hi - lo) / h);
    for (let k = 1; k <= n; k++) {
        const xb = lo + k * h;
        const fb = f(xb);
        if (Number.isFinite(fa) && Math.abs(fa) < 1e-9) afegeix(xa);
        else if (Number.isFinite(fa) && Number.isFinite(fb) && fa * fb < 0) {
            let [p, q, fp] = [xa, xb, fa];
            for (let it = 0; it < 80; it++) {
                const m = (p + q) / 2;
                const fm = f(m);
                if (fp * fm <= 0) q = m;
                else [p, fp] = [m, fm];
            }
            const r = (p + q) / 2;
            // Un salt (no una solució) es descarta: cal que la funció hi sigui petita
            if (Math.abs(f(r)) < 1e-6 * Math.max(1, Math.abs(fa), Math.abs(fb))) afegeix(r);
        }
        xa = xb;
        fa = fb;
    }
    if (Number.isFinite(fa) && Math.abs(fa) < 1e-9) afegeix(xa);
    return sols.sort((u, v) => u - v);
}

/** La part de la línia de dalt sense el \text{…}. */
const expressioEQ = tex => tex.replace(/^\\text\{[^}]*\}\s*/, '');
/** «x = 1 i x = \dfrac{3}{2}» (text d'una opció) → [1, 1.5]; «No té cap solució» → []. */
function llistaX(text) {
    return [...text.matchAll(/x = (-?)(\d+)(?:\/(\d+))?/g)]
        .map(([, s, n, d]) => (s ? -1 : 1) * (Number(n) / (d ? Number(d) : 1)))
        .sort((u, v) => u - v);
}

module.exports = { compila, equacio, solucions, expressioEQ, llistaX };
