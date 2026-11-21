/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/logaritmes-model.js
 * ROL: Model independent de «Logaritmes i equacions» (bloc 1) per als tests i la
 *      prova al navegador: un avaluador del TeX que es veu (\log, \log_{b}, \ln,
 *      \dfrac, \tfrac, potències, \sqrt, e, lletres a, b, c) i les respostes que en surten.
 * ============================================================================
 */
'use strict';

/** Avalua un TeX amb les lletres a, b, c (vars) i e. Torna un nombre. */
function avalua(tex, vars = {}) {
    const src = tex
        .replace(/\\left|\\right|\\,|\\;|\\quad/g, '')
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
        const v = expr();
        need('}');
        return v;
    };
    function atom() {
        if (eat('\\frac')) {
            const a = grup();
            const b = grup();
            return a / b;
        }
        if (eat('\\sqrt')) return Math.sqrt(grup());
        if (eat('\\log_')) {
            const b = src[i] === '{' ? grup() : atom();
            const x = factor();
            return Math.log(x) / Math.log(b);
        }
        if (eat('\\log')) return Math.log10(factor());
        if (eat('\\ln')) return Math.log(factor());
        if (eat('(')) {
            const v = expr();
            need(')');
            return v;
        }
        if (eat('{')) {
            const v = expr();
            need('}');
            return v;
        }
        if (eat('e')) return Math.E;
        for (const l of ['a', 'b', 'c']) if (eat(l)) return vars[l];
        const m = /^\d+(\.\d+)?/.exec(src.slice(i));
        if (m) {
            i += m[0].length;
            return Number(m[0]);
        }
        throw new Error(`inesperat «${src[i]}» a ${i}: ${src}`);
    }
    function factor() {
        const b = atom();
        if (eat('^')) {
            const neg = eat('-');
            const e = src[i] === '{' ? grup() : atom();
            return b ** (neg ? -e : e);
        }
        return b;
    }
    function terme() {
        let v = factor();
        for (;;) {
            if (eat('\\cdot')) v *= factor();
            else if (i < src.length && !'+-)}='.includes(src[i]) && !src.startsWith('\\iff', i)) v *= factor();
            else return v;
        }
    }
    function expr() {
        let v = eat('-') ? -terme() : terme();
        for (;;) {
            if (eat('+')) v += terme();
            else if (eat('-')) v -= terme();
            else return v;
        }
    }
    const v = expr();
    if (i !== src.length) throw new Error(`sobra text a ${i}: ${src}`);
    return v;
}

/** La part de la línia de dalt sense el \text{…}. */
const expressio = tex => tex.replace(/^\\text\{[^}]*\}\s*/, '');
/** «\log_{3} 1/9» → { b, x }. */
function logIArgument(tex) {
    const t = tex.replace(/\s+/g, ' ').trim();
    let m;
    if ((m = /^\\log_\{(\d+)\} (.+)$/.exec(t))) return { b: Number(m[1]), x: avalua(m[2]) };
    if ((m = /^\\log (.+)$/.exec(t))) return { b: 10, x: avalua(m[1]) };
    if ((m = /^\\ln (.+)$/.exec(t))) return { b: Math.E, x: avalua(m[1]) };
    throw new Error(`log? ${tex}`);
}

module.exports = { avalua, expressio, logIArgument };
