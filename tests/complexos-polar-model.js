/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/complexos-polar-model.js
 * ROL: Model independent de les pestanyes «Forma polar» i «Potències i arrels» de
 *      complexos.html, per als tests (tests/complexos-polar.test.js i la prova al
 *      navegador): llegeix l'enunciat en TeX (el que veu l'alumne) i en calcula les
 *      respostes amb aritmètica complexa en coma flotant, sense fer servir el motor.
 * ============================================================================
 */
'use strict';

const RAD = Math.PI / 180;
const redueix = t => ((t % 360) + 360) % 360;

/** Un nombre en TeX: 3, -2, 2\sqrt{2}, \sqrt{3}, -\sqrt{3}, 2{,}5. */
function nombre(tex) {
    const t = tex.replace(/[()]/g, '').replace(/\{,\}/g, '.').trim();
    const m = /^(-?)(\d+(?:\.\d+)?)?(?:\\sqrt\{(\d+)\})?$/.exec(t);
    if (!m) throw new Error(`nombre? ${tex}`);
    const signe = m[1] ? -1 : 1;
    const c = m[2] !== undefined ? Number(m[2]) : 1;
    const s = m[3] ? Math.sqrt(Number(m[3])) : 1;
    return signe * c * s;
}
/** a + bi en TeX (com l'escriu texBinomica). */
function binomica(tex) {
    const t = tex.replace(/\\,/g, '').replace(/\s+/g, '');
    // separa la part imaginària (acaba amb i)
    if (!/i$/.test(t)) return { re: nombre(t), im: 0 };
    const sense = t.slice(0, -1);
    const k = Math.max(sense.lastIndexOf('+'), sense.lastIndexOf('-'));
    if (k <= 0) {
        const b = sense === '' ? 1 : sense === '-' ? -1 : nombre(sense);
        return { re: 0, im: b };
    }
    const a = nombre(sense.slice(0, k));
    const bt = sense.slice(k);
    const b = bt === '+' ? 1 : bt === '-' ? -1 : nombre(bt.replace(/^\+/, ''));
    return { re: a, im: b };
}
/** r_{θ°} en TeX. */
function polar(tex) {
    const m = /^(\(?[^_]+?\)?)_\{([\d.{},]+)\^\{\\circ\}\}$/.exec(tex.trim());
    if (!m) throw new Error(`polar? ${tex}`);
    return { r: nombre(m[1]), t: Number(m[2].replace(/\{,\}/g, '.')) };
}

/** Llegeix l'enunciat i torna { apartat, dades } amb el que cal calcular. */
function llegeixEnunciat(tex) {
    let m;
    if ((m = /Passa a forma polar: \} z = (.+)$/.exec(tex))) return { apartat: 'bin-pol', z: binomica(m[1]) };
    if ((m = /Passa a forma binòmica: \} z = (.+)$/.exec(tex))) return { apartat: 'pol-bin', p: polar(m[1]) };
    if ((m = /Calcula en forma polar: \} (.+) (\\cdot|:) (.+)$/.exec(tex)))
        return { apartat: 'prod-quoc', p1: polar(m[1]), p2: polar(m[3]), producte: m[2] === '\\cdot' };
    if ((m = /Calcula \} z\^\{(\d+)\} \\text\{ amb \} z = (.+)$/.exec(tex)))
        return { apartat: 'potencia', n: Number(m[1]), z: binomica(m[2]) };
    if ((m = /Calcula les arrels \} \\sqrt\[(\d+)\]\{z\} \\text\{ amb \} z = (.+)$/.exec(tex)))
        return { apartat: 'arrels', n: Number(m[1]), p: polar(m[2]) };
    throw new Error(`enunciat? ${tex}`);
}

const aPolar = ({ re, im }) => ({ r: Math.hypot(re, im), t: redueix(Math.atan2(im, re) / RAD) });
const deu = x => Math.round(x * 1e9) / 1e9;
function potencia({ re, im }, n) {
    let [a, b] = [1, 0];
    for (let i = 0; i < n; i++) [a, b] = [a * re - b * im, a * im + b * re];
    return { re: deu(a), im: deu(b) };
}
const quadrant = ({ re, im }) =>
    re > 0 && im > 0 ? 1 : re < 0 && im > 0 ? 2 : re < 0 && im < 0 ? 3 : re > 0 && im < 0 ? 4 : 0;

/** Les respostes esperades de l'enunciat: { quadrant?, r?, t?, a?, b?, rn?, tn?, arrels? }. */
function respostes(tex) {
    const e = llegeixEnunciat(tex);
    if (e.apartat === 'bin-pol') return { ...e, quadrant: quadrant(e.z), ...aPolar(e.z) };
    if (e.apartat === 'pol-bin') return { ...e, a: e.p.r * Math.cos(e.p.t * RAD), b: e.p.r * Math.sin(e.p.t * RAD) };
    if (e.apartat === 'prod-quoc') {
        const z1 = { re: e.p1.r * Math.cos(e.p1.t * RAD), im: e.p1.r * Math.sin(e.p1.t * RAD) };
        const z2 = { re: e.p2.r * Math.cos(e.p2.t * RAD), im: e.p2.r * Math.sin(e.p2.t * RAD) };
        const d = z2.re ** 2 + z2.im ** 2;
        const w = e.producte
            ? { re: z1.re * z2.re - z1.im * z2.im, im: z1.re * z2.im + z1.im * z2.re }
            : { re: (z1.re * z2.re + z1.im * z2.im) / d, im: (z1.im * z2.re - z1.re * z2.im) / d };
        return { ...e, ...aPolar(w) };
    }
    if (e.apartat === 'potencia') {
        const w = potencia(e.z, e.n);
        const pz = aPolar(e.z);
        const pw = aPolar(w);
        return { ...e, quadrant: quadrant(e.z), r: pz.r, t: pz.t, rn: pw.r, tn: pw.t, a: w.re, b: w.im };
    }
    // Arrels: les n solucions de wⁿ = z
    const rr = e.p.r ** (1 / e.n);
    const arrels = [];
    for (let k = 0; k < e.n; k++) arrels.push(redueix((e.p.t + 360 * k) / e.n));
    return { ...e, rArrel: rr, t0: e.p.t / e.n, arrels };
}

module.exports = { respostes, llegeixEnunciat, aPolar, potencia, redueix, RAD };
