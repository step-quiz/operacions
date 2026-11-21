/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/complexos/polar-engine.js
 * ROL: Les pestanyes «Forma polar» i «Potències i arrels» de complexos.html
 *      (1r Batx): exercicis, passos, correcció i diagnòstic dels errors.
 *      Decisions del David (21/11/2026, artefacte de revisió): dues pestanyes; graus
 *      (0° ≤ θ < 360°), mai radians; nivell 1 exacte (angles de 30° i 45°, mòduls amb
 *      √) i nivell 2 amb calculadora (2 decimals); pas a pas; notació r_θ; el pla complex
 *      a tots els apartats; les arrels es toquen al pla; pràctica lliure.
 * ARQUITECTURA: mòdul pur (cap DOM). L'atzar, amb Math.random.
 *
 *   APARTATS  'bin-pol' binòmica → polar · 'pol-bin' polar → binòmica ·
 *             'prod-quoc' producte i quocient en polar · 'potencia' De Moivre ·
 *             'arrels' arrels n-èsimes
 *   EXERCICI  { apartat, nivell, enunciatTex, pla: { vectors, cercle? }, passos }
 *   PAS       { id, titol, camps: [CAMP], solucio: { nom: valor }, linia, pla?, dades }
 *   CAMP      { nom, tipus, etiqueta (TeX, davant), sufix (TeX, darrere), signe? }
 *             tipus: 'arrel' (coeficient i radicand: c√s), 'enter', 'decimal' (2 decimals),
 *             'quadrant' (tocar el quadrant al pla), 'marques' (tocar punts de la circumferència)
 *   EXACTE    { c, s }: el nombre c·√s (c enter, s sense quadrats; s = 1 si no hi ha arrel)
 *   corregeixPasCx(pas, valors) → { estat: 'ok' | 'error' | 'avis' | 'incomplet', malament, codi,
 *             missatge }. Les caselles: arrel → { c, s } (text), enter i decimal → text,
 *             quadrant → 1-4, marques → [índexs tocats].
 * DEPENDÈNCIES: strings-polar.js.
 * ============================================================================
 */

import { ERRORS_CX, TEXTOS_CX } from './strings-polar.js';

const T = TEXTOS_CX;
const triaCx = arr => arr[Math.floor(Math.random() * arr.length)];
const entreCx = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const redueix = t => ((t % 360) + 360) % 360;
const RAD = Math.PI / 180;

// ═════════════════════════════════════════════════════════════════════════════
// NOMBRES EXACTES c·√s
// ═════════════════════════════════════════════════════════════════════════════
/** k² · r = n, r lliure de quadrats: [k, r]. */
function sensQuadrats(n) {
    let k = 1;
    let r = n;
    for (let f = 2; f * f <= r; f++)
        while (r % (f * f) === 0) {
            r /= f * f;
            k *= f;
        }
    return [k, r];
}
export const exacte = (c, s = 1) => {
    const [k, r] = sensQuadrats(s);
    return { c: c * k, s: c === 0 ? 1 : r };
};
export const valorExacte = ({ c, s }) => c * Math.sqrt(s);
/** a·b, tots dos c√s. */
export const producteExacte = (a, b) => exacte(a.c * b.c, a.s * b.s);
/** a^n. */
export function potenciaExacte(a, n) {
    let r = exacte(1, 1);
    for (let i = 0; i < n; i++) r = producteExacte(r, a);
    return r;
}
export function texExacte({ c, s }) {
    if (s === 1) return String(c);
    const abs = Math.abs(c) === 1 ? '' : String(Math.abs(c));
    return `${c < 0 ? '-' : ''}${abs}\\sqrt{${s}}`;
}

/** cos i sin exactes dels angles notables (múltiples de 30° i de 45°): [num, radicand, den]. */
const TRIG = {
    0: [1, 1, 1],
    30: [1, 3, 2],
    45: [1, 2, 2],
    60: [1, 1, 2],
    90: [0, 1, 1],
};
function cosExacte(t) {
    const a = redueix(t);
    const ref = a <= 90 ? a : a <= 180 ? 180 - a : a <= 270 ? a - 180 : 360 - a;
    const signe = a < 90 || a > 270 ? 1 : a === 90 || a === 270 ? 1 : -1;
    const v = TRIG[ref];
    if (!v) return null;
    return [signe * v[0], v[1], v[2]];
}
const sinExacte = t => cosExacte(90 - t);
/** r·trig(θ), exacte, o null si no surt un sol terme enter. */
function rPerTrig(r, [num, rad, den]) {
    if (num === 0) return exacte(0);
    const p = exacte(r.c * num, r.s * rad);
    if (p.c % den !== 0) return null;
    return exacte(p.c / den, p.s);
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMAT
// ═════════════════════════════════════════════════════════════════════════════
/** 2,35 (text català) i 2{,}35 (TeX). */
export const textDec = (x, d = 2) => {
    const t = (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace(/\.?0+$/, '');
    return (t === '-0' ? '0' : t).replace('.', ',');
};
const texDec = (x, d = 2) => textDec(x, d).replace(',', '{,}');
/** Un nombre (exacte o decimal) en TeX. */
const texNum = (v, nivell) => (nivell === 1 ? texExacte(v) : texDec(v));
const texAngle = t => `${Number.isInteger(t) ? t : texDec(t)}^{\\circ}`;
/** r_θ en TeX. */
export const texPolar = (rTex, tTex) => `${rTex.includes(' ') || rTex.includes('\\') ? `(${rTex})` : rTex}_{${tTex}}`;
/** a + bi en TeX (a i b ja en TeX, amb el signe). */
export function texBinomica(aTex, bTex) {
    const zeroA = aTex === '0';
    const zeroB = bTex === '0';
    if (zeroB) return aTex;
    const bAbs = bTex.replace(/^-/, '');
    const bi = bAbs === '1' ? 'i' : `${bAbs}\\,i`;
    if (zeroA) return bTex.startsWith('-') ? `-${bi}` : bi;
    return `${aTex} ${bTex.startsWith('-') ? '-' : '+'} ${bi}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// GENERADORS
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Un z notable (nivell 1): { a, b (EXACTE), r (EXACTE), t }.
 * Famílies: k(±1 ± i) (45°…), eixos (0°, 90°…), k(±√3 ± i) (30°…), k(±1 ± √3 i) (60°…).
 */
export function zNotable({ eixos = true, kMax = 3 } = {}) {
    const k = entreCx(1, kMax);
    const families = eixos ? ['45', '45', 'eix', '30', '60'] : ['45', '45', '30', '60'];
    const f = triaCx(families);
    const sa = triaCx([1, -1]);
    const sb = triaCx([1, -1]);
    if (f === 'eix') {
        const t = triaCx([0, 90, 180, 270]);
        const c = cosExacte(t);
        const s = sinExacte(t);
        return { a: exacte(k * c[0]), b: exacte(k * s[0]), r: exacte(k), t };
    }
    if (f === '45') {
        const t = { '1,1': 45, '-1,1': 135, '-1,-1': 225, '1,-1': 315 }[`${sa},${sb}`];
        return { a: exacte(sa * k), b: exacte(sb * k), r: exacte(k, 2), t };
    }
    const base = f === '30' ? 30 : 60;
    const t = { '1,1': base, '-1,1': 180 - base, '-1,-1': 180 + base, '1,-1': 360 - base }[`${sa},${sb}`];
    const a = f === '30' ? exacte(sa * k, 3) : exacte(sa * k);
    const b = f === '30' ? exacte(sb * k) : exacte(sb * k, 3);
    return { a, b, r: exacte(2 * k), t };
}

/** Un z a + bi qualsevol (nivell 2): enters, cap a zero, no notable. */
export function zCalculadora() {
    for (;;) {
        const a = triaCx([-1, 1]) * entreCx(1, 6);
        const b = triaCx([-1, 1]) * entreCx(1, 6);
        if (Math.abs(a) === Math.abs(b)) continue;
        return { a, b, r: Math.hypot(a, b), t: redueix(Math.atan2(b, a) / RAD) };
    }
}
const quadrantDe = t => (t > 0 && t < 90 ? 1 : t > 90 && t < 180 ? 2 : t > 180 && t < 270 ? 3 : t > 270 ? 4 : 0);

// ═════════════════════════════════════════════════════════════════════════════
// PASSOS COMUNS
// ═════════════════════════════════════════════════════════════════════════════
const campR = (nivell, etiqueta = 'r =') =>
    nivell === 1 ? { nom: 'r', tipus: 'arrel', etiqueta } : { nom: 'r', tipus: 'decimal', etiqueta };
const campT = (nivell, etiqueta = '\\theta =') => ({
    nom: 't',
    tipus: nivell === 1 ? 'enter' : 'decimal',
    etiqueta,
    sufix: '^{\\circ}',
});

/** Els passos de binòmica → polar: quadrant (si no és en un eix), mòdul i argument. */
function passosBinPol(z, nivell, { prefix = '' } = {}) {
    const passos = [];
    const q = quadrantDe(z.t);
    const [aV, bV] = nivell === 1 ? [valorExacte(z.a), valorExacte(z.b)] : [z.a, z.b];
    const dades = { a: aV, b: bV, t: z.t, r: nivell === 1 ? valorExacte(z.r) : z.r, nivell };
    if (q)
        passos.push({
            id: `${prefix}quadrant`,
            titol: T.titol.quadrant,
            camps: [{ nom: 'q', tipus: 'quadrant' }],
            solucio: { q },
            linia: T.linia.quadrant(q),
            dades,
        });
    passos.push({
        id: `${prefix}modul`,
        titol: T.titol.modul,
        camps: [campR(nivell, '|z| = r =')],
        solucio: { r: nivell === 1 ? z.r : z.r },
        linia: `r = \\sqrt{${nivell === 1 ? `(${texExacte(z.a)})^2 + (${texExacte(z.b)})^2` : `(${z.a})^2 + (${z.b})^2`}} ${nivell === 1 ? '=' : '\\approx'} ${texNum(z.r, nivell)}`,
        dades,
    });
    const tTex = nivell === 1 ? texAngle(z.t) : texAngle(Math.round(z.t * 100) / 100);
    passos.push({
        id: `${prefix}argument`,
        titol: q ? T.titol.argument : T.titol.argumentEix,
        camps: [campT(nivell)],
        solucio: { t: nivell === 1 ? z.t : z.t },
        linia: `\\theta ${nivell === 1 ? '=' : '\\approx'} ${tTex} \\quad\\Rightarrow\\quad z = ${texPolar(texNum(z.r, nivell), tTex)}`,
        dades,
    });
    return passos;
}

// ═════════════════════════════════════════════════════════════════════════════
// APARTATS
// ═════════════════════════════════════════════════════════════════════════════
function exBinPol(nivell) {
    const z = nivell === 1 ? zNotable() : zCalculadora();
    const zTex = nivell === 1 ? texBinomica(texExacte(z.a), texExacte(z.b)) : texBinomica(String(z.a), String(z.b));
    const [re, im] = nivell === 1 ? [valorExacte(z.a), valorExacte(z.b)] : [z.a, z.b];
    return {
        apartat: 'bin-pol',
        nivell,
        enunciatTex: `\\text{Passa a forma polar: } z = ${zTex}`,
        pla: { vectors: [{ re, im, etiqueta: 'z' }], quadrants: true },
        passos: passosBinPol(z, nivell),
    };
}

function exPolBin(nivell) {
    let r;
    let t;
    let a;
    let b;
    if (nivell === 1) {
        for (;;) {
            t = triaCx([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330, 90, 180, 270]);
            const ref = t % 90 === 45 ? 45 : t % 90 === 0 ? 0 : 30;
            const k = entreCx(1, 3);
            r = ref === 45 ? exacte(k, 2) : ref === 30 ? exacte(2 * k) : exacte(k + 1);
            a = rPerTrig(r, cosExacte(t));
            b = rPerTrig(r, sinExacte(t));
            if (a && b) break;
        }
    } else {
        r = entreCx(2, 9);
        do t = entreCx(1, 359);
        while (t % 15 === 0);
        a = r * Math.cos(t * RAD);
        b = r * Math.sin(t * RAD);
    }
    const rTex = texNum(r, nivell);
    const signes = nivell === 2;
    const camps = [
        nivell === 1
            ? { nom: 'a', tipus: 'arrel', etiqueta: 'a = r\\cos\\theta =' }
            : { nom: 'a', tipus: 'decimal', etiqueta: 'a = r\\cos\\theta =', signe: signes },
        nivell === 1
            ? { nom: 'b', tipus: 'arrel', etiqueta: 'b = r\\sin\\theta =' }
            : { nom: 'b', tipus: 'decimal', etiqueta: 'b = r\\sin\\theta =', signe: signes },
    ];
    const [aV, bV] = nivell === 1 ? [valorExacte(a), valorExacte(b)] : [a, b];
    const rV = nivell === 1 ? valorExacte(r) : r;
    const zTex = nivell === 1 ? texBinomica(texExacte(a), texExacte(b)) : texBinomica(texDec(a), texDec(b));
    return {
        apartat: 'pol-bin',
        nivell,
        enunciatTex: `\\text{Passa a forma binòmica: } z = ${texPolar(rTex, texAngle(t))}`,
        pla: { vectors: [{ re: aV, im: bV, etiqueta: 'z' }] },
        passos: [
            {
                id: 'binomica',
                titol: T.titol.binomica,
                camps,
                solucio: { a: nivell === 1 ? a : a, b: nivell === 1 ? b : b },
                linia: `z = ${rTex}(\\cos ${texAngle(t)} + i\\sin ${texAngle(t)}) ${nivell === 1 ? '=' : '\\approx'} ${zTex}`,
                dades: { r: rV, t, a: aV, b: bV, nivell },
            },
        ],
    };
}

function exProdQuoc(nivell) {
    const producte = Math.random() < 0.5;
    let r1;
    let r2;
    let t1;
    let t2;
    if (nivell === 1) {
        r2 = entreCx(2, 5);
        r1 = producte ? entreCx(2, 6) : r2 * entreCx(1, 4);
        t1 = 15 * entreCx(1, 23);
        t2 = 15 * entreCx(1, 23);
    } else {
        r1 = entreCx(2, 9);
        r2 = entreCx(2, 9);
        t1 = entreCx(1, 359);
        t2 = entreCx(1, 359);
    }
    if (producte && redueix(t1 + t2) === t1 + t2 && Math.random() < 0.6) t1 = Math.min(359, t1 + 180); // sovint cal reduir
    if (!producte && t1 > t2 && Math.random() < 0.6) [t1, t2] = [t2, t1]; // sovint surt negatiu
    if (t1 === t2) t2 = redueix(t2 + 45);
    const r = producte ? r1 * r2 : r1 / r2;
    const t = redueix(producte ? t1 + t2 : t1 - t2);
    const op = producte ? '\\cdot' : ':';
    const rTex = Number.isInteger(r) ? String(r) : texDec(r);
    return {
        apartat: 'prod-quoc',
        nivell,
        enunciatTex: `\\text{Calcula en forma polar: } ${texPolar(String(r1), texAngle(t1))} ${op} ${texPolar(String(r2), texAngle(t2))}`,
        pla: {
            vectors: [
                { re: r1 * Math.cos(t1 * RAD), im: r1 * Math.sin(t1 * RAD), etiqueta: 'z_1' },
                { re: r2 * Math.cos(t2 * RAD), im: r2 * Math.sin(t2 * RAD), etiqueta: 'z_2', classe: 'cx-vector-2' },
            ],
        },
        passos: [
            {
                id: 'resultat',
                titol: producte ? T.titol.producte : T.titol.quocient,
                camps: [
                    Number.isInteger(r)
                        ? { nom: 'r', tipus: 'enter', etiqueta: 'r =' }
                        : { nom: 'r', tipus: 'decimal', etiqueta: 'r =' },
                    { nom: 't', tipus: 'enter', etiqueta: '\\theta =', sufix: '^{\\circ}' },
                ],
                solucio: { r, t },
                linia: producte
                    ? `${r1}\\cdot ${r2} = ${rTex},\\quad ${t1}^{\\circ} + ${t2}^{\\circ} = ${t1 + t2}^{\\circ}${t1 + t2 !== t ? ` \\to ${t}^{\\circ}` : ''} \\quad\\Rightarrow\\quad ${texPolar(rTex, texAngle(t))}`
                    : `${r1} : ${r2} ${Number.isInteger(r) ? '=' : '\\approx'} ${rTex},\\quad ${t1}^{\\circ} - ${t2}^{\\circ} = ${t1 - t2}^{\\circ}${t1 - t2 !== t ? ` \\to ${t}^{\\circ}` : ''} \\quad\\Rightarrow\\quad ${texPolar(rTex, texAngle(t))}`,
                dades: { producte, r1, r2, t1, t2, nivell },
                plaResolt: {
                    re: r * Math.cos(t * RAD),
                    im: r * Math.sin(t * RAD),
                    etiqueta: producte ? 'z_1 z_2' : 'z_1/z_2',
                    classe: 'cx-vector-resultat',
                },
            },
        ],
    };
}

function exPotencia(nivell) {
    const n = nivell === 1 ? entreCx(2, 6) : entreCx(2, 4);
    const z = nivell === 1 ? zNotable({ eixos: false, kMax: 1 + (Math.random() < 0.3 ? 1 : 0) }) : zCalculadora();
    const zTex = nivell === 1 ? texBinomica(texExacte(z.a), texExacte(z.b)) : texBinomica(String(z.a), String(z.b));
    const [re, im] = nivell === 1 ? [valorExacte(z.a), valorExacte(z.b)] : [z.a, z.b];
    const passos = passosBinPol(z, nivell, { prefix: 'z-' });
    const rV = nivell === 1 ? valorExacte(z.r) : z.r;
    const rn = nivell === 1 ? potenciaExacte(z.r, n) : rV ** n;
    const tn = redueix(n * z.t);
    const rnTex = nivell === 1 ? texExacte(rn) : texDec(rn);
    const tnTex = nivell === 1 ? texAngle(tn) : texAngle(Math.round(tn * 100) / 100);
    const tnBrut = nivell === 1 ? n * z.t : Math.round(n * z.t * 100) / 100;
    passos.push({
        id: 'moivre',
        titol: T.titol.moivre(n),
        camps: [
            nivell === 1
                ? { nom: 'r', tipus: 'arrel', etiqueta: 'r^{n} =' }
                : { nom: 'r', tipus: 'decimal', etiqueta: 'r^{n} =' },
            campT(nivell, 'n\\theta ='),
        ],
        solucio: { r: rn, t: tn },
        linia: `z^{${n}} = ${texPolar(`${texNum(z.r, nivell)}^{${n}}`, `${n}\\cdot ${texAngle(nivell === 1 ? z.t : Math.round(z.t * 100) / 100)}`)} ${nivell === 1 ? '=' : '\\approx'} ${texPolar(rnTex, tnBrut !== tn ? `${texAngle(tnBrut)}` : tnTex)}${tnBrut !== tn ? ` = ${texPolar(rnTex, tnTex)}` : ''}`,
        dades: { n, r: rV, t: z.t, rn: nivell === 1 ? valorExacte(rn) : rn, tn, nivell },
        plaResolt: {
            re: (nivell === 1 ? valorExacte(rn) : rn) * Math.cos(tn * RAD),
            im: (nivell === 1 ? valorExacte(rn) : rn) * Math.sin(tn * RAD),
            etiqueta: `z^{${n}}`,
            classe: 'cx-vector-resultat',
        },
    });
    // Nivell 1: el resultat també en binòmica (surt exacte, d'un sol terme a cada part)
    if (nivell === 1) {
        const a = rPerTrig(rn, cosExacte(tn));
        const b = rPerTrig(rn, sinExacte(tn));
        if (a && b)
            passos.push({
                id: 'pot-binomica',
                titol: T.titol.potBinomica,
                camps: [
                    { nom: 'a', tipus: 'arrel', etiqueta: 'a =' },
                    { nom: 'b', tipus: 'arrel', etiqueta: 'b =' },
                ],
                solucio: { a, b },
                linia: `z^{${n}} = ${rnTex}(\\cos ${texAngle(tn)} + i\\sin ${texAngle(tn)}) = ${texBinomica(texExacte(a), texExacte(b))}`,
                dades: { r: valorExacte(rn), t: tn, a: valorExacte(a), b: valorExacte(b), nivell },
            });
    }
    return {
        apartat: 'potencia',
        nivell,
        n,
        enunciatTex: `\\text{Calcula } z^{${n}} \\text{ amb } z = ${zTex}`,
        pla: { vectors: [{ re, im, etiqueta: 'z' }], quadrants: true },
        passos,
    };
}

function exArrels(nivell) {
    const n = triaCx([2, 3, 4, 6]);
    let r;
    let t;
    let rArrel;
    if (nivell === 1) {
        const m = n === 6 ? 2 : entreCx(1, n === 2 ? 5 : 3);
        r = m ** n;
        rArrel = m;
        // θ/n enter i el nombre en un angle conegut
        do t = triaCx([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]);
        while (t % n !== 0);
    } else {
        r = entreCx(2, 50);
        rArrel = r ** (1 / n);
        t = entreCx(1, 359);
    }
    const t0 = t / n;
    const marques = [];
    for (let k = 0; k < 24; k++) marques.push(redueix(t0 + 15 * k));
    const bones = [];
    for (let k = 1; k < n; k++) bones.push((k * 360) / n / 15);
    const rArrelTex = Math.abs(rArrel - Math.round(rArrel)) < 1e-9 ? String(Math.round(rArrel)) : texDec(rArrel);
    const t0Tex = Number.isInteger(t0) ? texAngle(t0) : texAngle(Math.round(t0 * 100) / 100);
    const llistaArrels = [];
    for (let k = 0; k < n; k++) {
        const tk = t0 + (k * 360) / n;
        llistaArrels.push(
            texPolar(rArrelTex, Number.isInteger(tk) ? texAngle(tk) : texAngle(Math.round(tk * 100) / 100))
        );
    }
    const radi = nivell === 1 ? rArrel : rArrel;
    return {
        apartat: 'arrels',
        nivell,
        n,
        enunciatTex: `\\text{Calcula les arrels } \\sqrt[${n}]{z} \\text{ amb } z = ${texPolar(String(r), texAngle(t))}`,
        pla: { vectors: [] },
        passos: [
            {
                id: 'arrel-modul',
                titol: T.titol.arrelModul(n),
                camps: [
                    nivell === 1
                        ? { nom: 'r', tipus: 'enter', etiqueta: `\\sqrt[${n}]{${r}} =` }
                        : { nom: 'r', tipus: 'decimal', etiqueta: `\\sqrt[${n}]{${r}} =` },
                    nivell === 1 && Number.isInteger(t0)
                        ? {
                              nom: 't',
                              tipus: 'enter',
                              etiqueta: `\\theta_0 = \\dfrac{${t}^{\\circ}}{${n}} =`,
                              sufix: '^{\\circ}',
                          }
                        : {
                              nom: 't',
                              tipus: 'decimal',
                              etiqueta: `\\theta_0 = \\dfrac{${t}^{\\circ}}{${n}} =`,
                              sufix: '^{\\circ}',
                          },
                ],
                solucio: { r: rArrel, t: t0 },
                linia: `\\sqrt[${n}]{${r}} ${Math.abs(rArrel - Math.round(rArrel)) < 1e-9 ? '=' : '\\approx'} ${rArrelTex},\\quad \\theta_0 = \\dfrac{${t}^{\\circ}}{${n}} ${Number.isInteger(t0) ? '=' : '\\approx'} ${t0Tex}`,
                dades: { n, r, t, rArrel, t0, nivell },
                plaResolt: {
                    re: radi * Math.cos(t0 * RAD),
                    im: radi * Math.sin(t0 * RAD),
                    etiqueta: 'w_0',
                    classe: 'cx-vector-resultat',
                },
            },
            {
                id: 'arrel-marques',
                titol: T.titol.arrelMarques(n),
                camps: [{ nom: 'm', tipus: 'marques' }],
                solucio: { m: bones },
                linia: `${T.linia.arrels(n)} ${llistaArrels.join(',\\ ')}`,
                pla: { cercle: radi, marques, primera: 0 },
                dades: { n, t0, nivell },
            },
        ],
    };
}

export const APARTATS_CX = {
    'bin-pol': exBinPol,
    'pol-bin': exPolBin,
    'prod-quoc': exProdQuoc,
    'potencia': exPotencia,
    'arrels': exArrels,
};
export const PESTANYES_CX = {
    polar: ['bin-pol', 'pol-bin', 'prod-quoc'],
    potencies: ['potencia', 'arrels'],
};
/** Un exercici d'un apartat ('barreja-polar' / 'barreja-potencies': un apartat de la pestanya a l'atzar). */
export function generaExerciciCx(apartat, nivell) {
    if (apartat === 'barreja-polar') apartat = triaCx(PESTANYES_CX.polar);
    if (apartat === 'barreja-potencies') apartat = triaCx(PESTANYES_CX.potencies);
    return APARTATS_CX[apartat](nivell);
}

// ═════════════════════════════════════════════════════════════════════════════
// CORRECCIÓ
// ═════════════════════════════════════════════════════════════════════════════
const buitCx = v => v === undefined || v === null || String(v).trim() === '' || String(v).trim() === '-';
const llegeixEnter = t =>
    /^\s*-?\d+\s*$/.test(String(t).replace(/[−–]/g, '-')) ? parseInt(String(t).replace(/[−–]/g, '-'), 10) : NaN;
const llegeixDecimal = t => {
    const s = String(t).replace(/[−–]/g, '-').replace(',', '.').trim();
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
};
/** Tolerància d'un camp decimal: 0,01 (2 decimals), o una mica més si el valor és gran (rⁿ). */
const tolerancia = (pas, nom, sol) =>
    pas.id === 'moivre' && nom === 'r' ? Math.max(0.011, Math.abs(sol) * 0.01) : nom === 't' ? 0.051 : 0.011;

/** Llegeix i compara. Torna { estat, malament, codi, missatge, valors }. */
export function corregeixPasCx(pas, valorsBruts) {
    const valors = {};
    for (const camp of pas.camps) {
        const v = valorsBruts[camp.nom];
        if (camp.tipus === 'quadrant') {
            if (!v) return { estat: 'incomplet', camp: camp.nom };
            valors[camp.nom] = v;
        } else if (camp.tipus === 'marques') {
            if (!v || !v.length) return { estat: 'incomplet', camp: camp.nom };
            valors[camp.nom] = v.slice().sort((a, b) => a - b);
        } else if (camp.tipus === 'arrel') {
            const c = v && !buitCx(v.c) ? llegeixEnter(v.c) : v && String(v.c || '').trim() === '-' ? -1 : null;
            const s = v && !buitCx(v.s) ? llegeixEnter(v.s) : 1;
            if (c === null && (!v || buitCx(v.s))) return { estat: 'incomplet', camp: camp.nom };
            const cc = c === null ? 1 : c;
            if (Number.isNaN(cc) || Number.isNaN(s))
                return { estat: 'avis', codi: 'NO_ENTER', camp: camp.nom, missatge: T.avisos.NO_ENTER };
            if (s <= 0) return { estat: 'avis', codi: 'RADICAND', camp: camp.nom, missatge: T.avisos.RADICAND };
            valors[camp.nom] = { c: cc, s };
        } else if (camp.tipus === 'enter') {
            if (buitCx(v)) return { estat: 'incomplet', camp: camp.nom };
            const n = llegeixEnter(v);
            if (Number.isNaN(n))
                return { estat: 'avis', codi: 'NO_ENTER', camp: camp.nom, missatge: T.avisos.NO_ENTER };
            valors[camp.nom] = n;
        } else {
            if (buitCx(v)) return { estat: 'incomplet', camp: camp.nom };
            const x = llegeixDecimal(v);
            if (Number.isNaN(x))
                return { estat: 'avis', codi: 'NO_DECIMAL', camp: camp.nom, missatge: T.avisos.NO_DECIMAL };
            valors[camp.nom] = x;
        }
    }
    const malament = [];
    let senseSimplificar = null;
    for (const camp of pas.camps) {
        const v = valors[camp.nom];
        const sol = pas.solucio[camp.nom];
        let bo;
        if (camp.tipus === 'marques') bo = JSON.stringify(v) === JSON.stringify(sol);
        else if (camp.tipus === 'quadrant') bo = v === sol;
        else if (camp.tipus === 'arrel') {
            bo = Math.abs(valorExacte(v) - valorExacte(sol)) < 1e-9;
            if (bo && (v.s !== sol.s || v.c !== sol.c)) senseSimplificar = camp.nom;
        } else if (camp.tipus === 'enter') bo = v === sol;
        else bo = Math.abs(v - sol) <= tolerancia(pas, camp.nom, sol) + 1e-12;
        // L'argument: 360° i 0° són el mateix angle, però es demana entre 0° i 360°
        if (!bo) malament.push(camp.nom);
    }
    if (!malament.length && senseSimplificar)
        return { estat: 'avis', codi: 'SIMPLIFICA', camp: senseSimplificar, missatge: T.avisos.SIMPLIFICA };
    if (!malament.length) return { estat: 'ok', valors };
    const codi = diagnosticaCx(pas, valors, malament);
    const e = ERRORS_CX[codi] || ERRORS_CX.CX_ALTRE;
    return { estat: 'error', malament, codi, missatge: e.missatge, etiqueta: e.etiqueta, valors };
}

// ═════════════════════════════════════════════════════════════════════════════
// DIAGNÒSTIC
// ═════════════════════════════════════════════════════════════════════════════
const valorDe = v => (typeof v === 'object' && v !== null ? valorExacte(v) : v);
const iguals = (x, y, tol = 0.051) => Math.abs(x - y) <= tol;

export function diagnosticaCx(pas, valors, malament) {
    const d = pas.dades;
    const id = pas.id.replace(/^z-/, '');
    if (id === 'quadrant') return 'CX_QUADRANT';
    if (id === 'modul') {
        const r = valorDe(valors.r);
        if (iguals(r, d.a * d.a + d.b * d.b, 0.011)) return 'CX_MODUL_SENSE_ARREL';
        if (iguals(r, Math.abs(d.a) + Math.abs(d.b), 0.011)) return 'CX_MODUL_SUMA';
        return 'CX_MODUL';
    }
    if (id === 'argument') {
        const t = valors.t;
        const atan = Math.atan(d.b / d.a) / RAD; // el que dona la calculadora
        if (d.a !== 0 && iguals(t, atan) && !iguals(redueix(t), d.t)) return 'CX_ARCTAN';
        if (iguals(redueix(t), d.t)) return 'CX_REDUEIX';
        if (d.a !== 0 && iguals(t, Math.atan(Math.abs(d.b / d.a)) / RAD)) return 'CX_ARCTAN';
        if (d.b !== 0 && iguals(t, Math.atan(Math.abs(d.a / d.b)) / RAD)) return 'CX_ARG_INVERS';
        return 'CX_ARGUMENT';
    }
    if (id === 'binomica' || id === 'pot-binomica') {
        const [a, b] = [valorDe(valors.a), valorDe(valors.b)];
        const tol = d.nivell === 1 ? 1e-9 : 0.011;
        if (iguals(a, d.b, tol) && iguals(b, d.a, tol)) return 'CX_SIN_COS';
        if (iguals(Math.abs(a), Math.abs(d.a), tol) && iguals(Math.abs(b), Math.abs(d.b), tol)) return 'CX_SIGNE';
        if (iguals(a, Math.cos(d.t * RAD), 0.011) && iguals(b, Math.sin(d.t * RAD), 0.011)) return 'CX_SENSE_MODUL';
        return 'CX_BINOMICA';
    }
    if (id === 'resultat') {
        const { producte, r1, r2, t1, t2 } = d;
        if (malament.includes('t')) {
            const t = valors.t;
            if (producte && t === t1 * t2) return 'CX_ARG_MULTIPLICA';
            if (!producte && iguals(t, t1 / t2, 0.011)) return 'CX_ARG_DIVIDEIX';
            if (t === (producte ? t1 + t2 : t1 - t2)) return 'CX_REDUEIX';
            if (!producte && redueix(t) === redueix(t2 - t1)) return 'CX_ARG_ORDRE';
            return 'CX_ARGUMENT';
        }
        const r = valors.r;
        if (producte && r === r1 + r2) return 'CX_MODUL_SUMA_PRODUCTE';
        if (!producte && iguals(r, r1 - r2, 0.011)) return 'CX_MODUL_RESTA_QUOCIENT';
        return 'CX_MODUL_OPERACIO';
    }
    if (id === 'moivre') {
        const { n, r, t } = d;
        if (malament.includes('r')) {
            const rv = valorDe(valors.r);
            if (iguals(rv, n * r, Math.max(0.011, n * r * 0.01))) return 'CX_MOIVRE_MODUL_PER_N';
            if (iguals(rv, r, 0.011)) return 'CX_MOIVRE_MODUL';
            return 'CX_MOIVRE_POTENCIA';
        }
        const tv = valors.t;
        if (iguals(tv, t)) return 'CX_MOIVRE_ARGUMENT';
        if (iguals(tv, n * t)) return 'CX_REDUEIX';
        if (iguals(tv, t ** n, 1)) return 'CX_MOIVRE_ARG_POTENCIA';
        return 'CX_ARGUMENT';
    }
    if (id === 'arrel-modul') {
        const { n, r, t } = d;
        if (malament.includes('r')) {
            const rv = valors.r;
            if (iguals(rv, r, 0.011)) return 'CX_ARREL_MODUL';
            if (iguals(rv, r / n, 0.011)) return 'CX_ARREL_MODUL_DIVIDEIX';
            return 'CX_ARREL_MODUL_ALTRE';
        }
        const tv = valors.t;
        if (iguals(tv, t)) return 'CX_ARREL_SENSE_DIVIDIR';
        for (let k = 1; k < n; k++) if (iguals(tv, (t + 360 * k) / n, 0.011)) return 'CX_ARREL_K0';
        return 'CX_ARREL_ARGUMENT';
    }
    if (id === 'arrel-marques') {
        const m = valors.m;
        const n = d.n;
        if (m.length < n - 1) return 'CX_ARRELS_POQUES';
        if (m.length > n - 1) return 'CX_ARRELS_MASSA';
        return 'CX_ARRELS_ESPAI';
    }
    return 'CX_ALTRE';
}
