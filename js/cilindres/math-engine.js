/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/cilindres/math-engine.js
 * ROL: Les preguntes de «Cilindres amb un full» (cilindres.html, 2n d'ESO), amb les
 *      decisions del David del 23/11/2026 (diàleg i artifact de revisió):
 *        - un full rectangular s'enrotlla de dues maneres i fa dos cilindres sense tapes:
 *          el costat que s'uneix és la LONGITUD DE LA CIRCUMFERÈNCIA de la base (2πr =
 *          costat), no el diàmetre; l'altre costat és l'altura;
 *        - per a cada cilindre: en què es converteix un costat (triar entre quatre),
 *          el radi, l'àrea de la base i el volum (escriure, amb 2 decimals); després,
 *          quin té més volum (triar) i la capacitat de cadascun en mL (1 cm³ = 1 mL);
 *        - el volum es diu en cm³ i la capacitat en mL (paraules del David);
 *        - nivell 1: el full A4 (21 × 30, l'enunciat del David); nivell 2: altres
 *          rectangles. Sense nivell 3.
 *      CORRECCIÓ AMB ARROSSEGAMENT: cada pas es corregeix amb el que l'alumne ha respost
 *      al pas anterior (l'àrea amb el seu radi, el volum amb la seva àrea, la capacitat amb
 *      el seu volum), amb el marge d'arrodonir a 2 decimals i de fer servir π ≈ 3,14. Així
 *      l'error d'arrodonir no s'acumula (estudi del 23/11: arrodonint, el volum es desvia
 *      fins a un 0,32 %; truncant, fins a un 1,04 %). refaPassos() ho fa (enEncertar).
 * ARQUITECTURA: mòdul pur (l'atzar, a través de utils.js, perquè les sessions fixes el
 *      puguin sembrar). Joc comú (js/passos/joc-passos.js).
 * DEPENDÈNCIES: utils.js, algebra/racionals.js, strings.js.
 * ============================================================================
 */

import { randInt, shuffle } from '../utils.js';
import { texDecimal } from '../algebra/racionals.js';
import { TEXTOS_CF } from './strings.js';

const T = TEXTOS_CF;
const LLARG = 9;

/** Un nombre amb 2 decimals (com l'escriuria l'alumne), per a les solucions i el TeX. */
const dos = v => Math.round(v * 100) / 100;
/** Un nombre amb coma decimal (TeX), amb 2 decimals com a màxim. */
const texNum = v => texDecimal([Math.round(v * 100), 100], { minDecimals: 2 });
/** Un decimal com a coeficient [n, d] (amb 2 decimals). */
const coef = v => [Math.round(v * 100), 100];

// ── Els marges (vegeu la capçalera) ──────────────────────────────────────────
/** El radi: arrodonit o truncat a 2 decimals, o amb π ≈ 3,14. */
const margeRadi = () => 0.011;
/** L'àrea, calculada amb el radi de l'alumne: arrodonir (0,01) i π ≈ 3,14 (r² · 0,0016). */
const margeArea = r => 0.011 + 0.0017 * r * r;
/** El volum, calculat amb l'àrea de l'alumne: arrodonir a 2 decimals. */
const margeVolum = () => 0.011;

// ── Els passos ───────────────────────────────────────────────────────────────
function pasDecimal({ id, mena, enunciat, plantilla, sol, marge, distractors, linia, nota }) {
    // Fora els distractors que cauen dins del marge de la bona o d'un altre distractor (p. ex. amb un costat
    // que fa el doble de l'altre, «l'altura canviada» i «el doble» donen el mateix nombre)
    const prop = (x, y) => Math.abs(x - y) <= 0.011 + 0.006 * Math.abs(y);
    const nets = [];
    for (const [v, codi] of distractors)
        if (!prop(v, sol) && !prop(sol, v) && nets.every(([w]) => !prop(v, w) && !prop(w, v))) nets.push([v, codi]);
    distractors = nets;
    return {
        id,
        mena,
        nom: T.nomPas[mena],
        enunciat,
        formules: enunciat.includes('$'),
        plantilla,
        camps: { r: 'decimal' },
        solucio: { r: coef(sol) },
        tolerancia: { r: marge },
        dades: { distractors: { r: distractors.map(([v, codi]) => [coef(v), codi]) }, marge, sol },
        nota: nota || T.nota.decimals,
        linia,
    };
}

/** El pas del plegat: en què es converteix un costat (quatre opcions). */
function pasPlegat(k, costat, esCircumferencia) {
    const opcions = shuffle([
        ['circ', T.plegat.circumferencia],
        ['diam', T.plegat.diametre],
        ['radi', T.plegat.radi],
        ['alt', T.plegat.altura],
    ]);
    const bona = esCircumferencia ? 'circ' : 'alt';
    // El costat que s'uneix: diàmetre o radi en lloc de circumferència, o altura; l'altre: no és part de la base
    const codiDe = v =>
        !esCircumferencia ? 'ES_ALTURA' : { diam: 'DIAMETRE', radi: 'RADI', alt: 'ES_CIRCUMFERENCIA' }[v];
    return {
        id: `plegat${k}`,
        mena: 'plegat',
        nom: T.nomPas.plegat,
        enunciat: T.enunciat.plegat(k, costat),
        plantilla: [],
        camps: { tria: 'tria' },
        opcions: opcions.map(([v, text]) => [v, text]),
        literal: true,
        solucio: { tria: bona },
        dades: { distractors: { tria: opcions.filter(o => o[0] !== bona).map(([v]) => [v, codiDe(v)]) } },
        linia: T.liniaPlegat(k, costat, esCircumferencia),
    };
}

/** El radi del cilindre k: 2πr = c. */
const pasRadi = (k, c) =>
    pasDecimal({
        id: `radi${k}`,
        mena: 'radi',
        enunciat: T.enunciat.radi(k),
        plantilla: [
            { tex: `2\\pi r_${k} = ${c} \\;\\Rightarrow\\; r_${k} = \\dfrac{${c}}{2\\pi} =` },
            { camp: 'r', llarg: LLARG },
            { tex: '\\text{cm}' },
        ],
        sol: c / (2 * Math.PI),
        marge: margeRadi(),
        distractors: [
            [c / 2, 'DIAMETRE'],
            [c / Math.PI, 'R_PER_PI'],
            [c / (2 * Math.PI) ** 2, 'DIVIDEIX_MALAMENT'],
        ],
        linia: `r_${k} = \\dfrac{${c}}{2\\pi} \\approx ${texNum(c / (2 * Math.PI))}\\ \\text{cm}`,
    });

/** L'àrea de la base del cilindre k, amb el radi r (el de l'alumne). */
const pasArea = (k, r) =>
    pasDecimal({
        id: `area${k}`,
        mena: 'area',
        enunciat: T.enunciat.area(k),
        plantilla: [
            { tex: `A_${k} = \\pi \\cdot ${texNum(r)}^2 =` },
            { camp: 'r', llarg: LLARG },
            { tex: '\\text{cm}^2' },
        ],
        sol: Math.PI * r * r,
        marge: margeArea(r),
        distractors: [
            [2 * Math.PI * r * r, 'DOS_PI_R2'],
            [2 * Math.PI * r, 'PERIMETRE'],
            [Math.PI * r, 'SENSE_QUADRAT'],
            [r * r, 'SENSE_PI'],
        ],
        linia: `A_${k} = \\pi \\cdot ${texNum(r)}^2 \\approx ${texNum(Math.PI * r * r)}\\ \\text{cm}^2`,
    });

/** El volum del cilindre k, amb l'àrea A (la de l'alumne) i l'altura h. */
const pasVolum = (k, A, h, c) =>
    pasDecimal({
        id: `volum${k}`,
        mena: 'volum',
        enunciat: T.enunciat.volum(k),
        plantilla: [
            { tex: `V_${k} = A_${k} \\cdot h = ${texNum(A)} \\cdot ${h} =` },
            { camp: 'r', llarg: LLARG },
            { tex: '\\text{cm}^3' },
        ],
        sol: A * h,
        marge: margeVolum(),
        distractors: [
            [A * c, 'ALTURA_CANVIADA'],
            [A, 'SENSE_ALTURA'],
            [A * h * 2, 'DOBLE'],
        ],
        linia: `V_${k} \\approx ${texNum(A * h)}\\ \\text{cm}^3`,
    });

/** Quin té més volum (amb els volums de l'alumne). */
function pasCompara(V1, V2) {
    const bona = V1 > V2 ? 'c1' : 'c2';
    const opcions = [
        ['c1', T.compara.c1],
        ['c2', T.compara.c2],
        ['igual', T.compara.igual],
    ];
    return {
        id: 'compara',
        mena: 'compara',
        nom: T.nomPas.compara,
        enunciat: T.enunciat.compara,
        plantilla: [
            { tex: `V_1 \\approx ${texNum(V1)}\\ \\text{cm}^3 \\qquad V_2 \\approx ${texNum(V2)}\\ \\text{cm}^3` },
        ],
        camps: { tria: 'tria' },
        opcions,
        literal: true,
        solucio: { tria: bona },
        dades: {
            distractors: {
                tria: opcions.filter(o => o[0] !== bona).map(([v]) => [v, v === 'igual' ? 'IGUALS' : 'MES_PETIT']),
            },
        },
        linia: T.liniaCompara(bona === 'c1' ? 1 : 2),
    };
}

/** La capacitat d'un cilindre en mL (= el seu volum en cm³). */
const pasCapacitat = (k, V) =>
    pasDecimal({
        id: `capacitat${k}`,
        mena: 'capacitat',
        enunciat: T.enunciat.capacitat(k),
        plantilla: [
            { tex: `V_${k} \\approx ${texNum(V)}\\ \\text{cm}^3 \\;\\Rightarrow\\; \\text{capacitat} \\approx` },
            { camp: 'r', llarg: LLARG },
            { tex: '\\text{mL}' },
        ],
        sol: V,
        marge: 0.011,
        distractors: [
            [V / 1000, 'LITRES'],
            [V * 1000, 'MIL'],
        ],
        linia: `\\text{capacitat del cilindre ${k}} \\approx ${texNum(V)}\\ \\text{mL}`,
        nota: T.nota.capacitat,
    });

// ── La pregunta ──────────────────────────────────────────────────────────────
/**
 * Els dos cilindres: cilindre k té la circumferència c[k] i l'altura h[k]. Al full A4, el del David:
 * el cilindre 1 té la circumferència de 21 cm i l'altura de 30; en els altres rectangles, a l'atzar.
 */
function cilindres(a, b, a4) {
    const amplePrimer = a4 ? false : randInt(0, 1) === 1;
    const [curt, llarg] = a < b ? [a, b] : [b, a];
    return amplePrimer
        ? [
              { c: llarg, h: curt },
              { c: curt, h: llarg },
          ]
        : [
              { c: curt, h: llarg },
              { c: llarg, h: curt },
          ];
}

/** Els passos (amb les solucions a partir dels valors exactes; refaPassos les posa al dia). */
function passosDe(cil) {
    const passos = [];
    cil.forEach(({ c, h }, i) => {
        const k = i + 1;
        // De vegades es pregunta pel costat que fa d'altura (perquè la resposta no sigui sempre la mateixa)
        const perAltura = randInt(1, 3) === 1;
        passos.push(perAltura ? pasPlegat(k, h, false) : pasPlegat(k, c, true));
        const r = c / (2 * Math.PI);
        const A = Math.PI * dos(r) ** 2;
        passos.push(pasRadi(k, c), pasArea(k, dos(r)), pasVolum(k, dos(A), h, c));
    });
    const V = cil.map(({ c, h }) => dos(dos(Math.PI * dos(c / (2 * Math.PI)) ** 2) * h));
    passos.push(pasCompara(V[0], V[1]), pasCapacitat(1, V[0]), pasCapacitat(2, V[1]));
    return passos;
}

/** Una pregunta nova: nivell 1, el full A4; nivell 2, un altre rectangle. */
export function generaPreguntaCF(nivell) {
    const a4 = nivell !== 2;
    let a = 21;
    let b = 30;
    if (!a4) {
        do {
            a = randInt(10, 40);
            b = randInt(10, 40);
        } while (Math.abs(a - b) < 4 || (Math.min(a, b) === 21 && Math.max(a, b) === 30));
    }
    const cil = cilindres(a, b, a4);
    return {
        tex: '',
        problema: T.problema(a, b, cil),
        formula: {
            etiqueta: T.formules,
            tex: 'L = 2\\pi r \\qquad A_{\\text{base}} = \\pi r^2 \\qquad V = A_{\\text{base}} \\cdot h',
        },
        svg: svgCilindres(a, b, cil),
        text: `Cilindres amb un full de ${a} × ${b}`,
        clau: `${a}x${b}|${cil[0].c}`,
        passos: passosDe(cil),
        dades: { nivell: a4 ? 1 : 2, a, b, cilindres: cil },
    };
}

/** El valor que ha escrit l'alumne en un camp decimal (com a nombre). */
const valorCF = v => (Array.isArray(v) ? v[0] / v[1] : Number(v));

/**
 * enEncertar del joc de passos: després del radi, de l'àrea o del volum, els passos següents es corregeixen
 * amb el valor de l'alumne (correcció amb arrossegament; vegeu la capçalera).
 */
export function refaPassos(pregunta, pas, valors) {
    const m = /^(radi|area|volum)(\d)$/.exec(pas.id);
    if (!m) return null;
    const k = Number(m[2]);
    const v = valorCF(valors.r);
    const { c, h } = pregunta.dades.cilindres[k - 1];
    const passos = pregunta.passos.map(p => p);
    const posa = (id, nou) => {
        const i = passos.findIndex(p => p.id === id);
        if (i >= 0) passos[i] = nou;
    };
    if (m[1] === 'radi') posa(`area${k}`, pasArea(k, v));
    if (m[1] === 'area') posa(`volum${k}`, pasVolum(k, v, h, c));
    if (m[1] === 'volum') {
        // els volums de l'alumne: el d'aquest cilindre i el de l'altre (si ja l'ha fet)
        const vols = pregunta.volums || {};
        vols[k] = v;
        pregunta.volums = vols;
        const pas1 = passos.find(p => p.id === 'volum1');
        const pas2 = passos.find(p => p.id === 'volum2');
        const V1 = vols[1] ?? valorCF(pas1.solucio.r);
        const V2 = vols[2] ?? valorCF(pas2.solucio.r);
        posa('compara', pasCompara(V1, V2));
        posa('capacitat1', pasCapacitat(1, V1));
        posa('capacitat2', pasCapacitat(2, V2));
    }
    pregunta.passos = passos;
    return passos;
}

// ── La figura ────────────────────────────────────────────────────────────────
/** El full (a × b) i els dos cilindres: el costat que fa de circumferència, del seu color a tots dos llocs. */
export function svgCilindres(a, b, cil) {
    const esc = 3; // px per cm (els fulls fan com a molt 40 cm)
    const [w, hgt] = [a * esc, b * esc];
    const colors = ['jp-cf-c1', 'jp-cf-c2'];
    // el costat de llargada c[k], al full: horitzontal (a) o vertical (b)
    const costatDe = k => (cil[k].c === a ? 'h' : 'v');
    const x0 = 16;
    const y0 = 26;
    const parts = [
        `<svg class="jp-cf-svg" viewBox="0 0 520 ${Math.max(hgt, 140) + 60}" role="img" aria-label="${T.figura(a, b)}">`,
    ];
    parts.push(`<rect class="jp-cf-full" x="${x0}" y="${y0}" width="${w}" height="${hgt}"/>`);
    for (let k = 0; k < 2; k++) {
        const cls = colors[k];
        if (costatDe(k) === 'h')
            parts.push(`<line class="${cls}" x1="${x0}" y1="${y0 + hgt}" x2="${x0 + w}" y2="${y0 + hgt}"/>`);
        else parts.push(`<line class="${cls}" x1="${x0 + w}" y1="${y0}" x2="${x0 + w}" y2="${y0 + hgt}"/>`);
    }
    parts.push(`<text class="jp-cf-text" x="${x0 + w / 2}" y="${y0 + hgt + 18}" text-anchor="middle">${a} cm</text>`);
    parts.push(`<text class="jp-cf-text" x="${x0 + w + 6}" y="${y0 + hgt / 2}">${b} cm</text>`);
    // Els dos cilindres, dibuixats a escala (radi i altura)
    let x = Math.max(x0 + w + 90, 200);
    cil.forEach(({ c, h }, k) => {
        const r = (c / (2 * Math.PI)) * esc * 1.6;
        const hh = h * esc * 0.9;
        const ry = Math.max(5, r * 0.25);
        const cx = x + r;
        const top = y0 + 6;
        parts.push(`<ellipse class="${colors[k]}" cx="${cx}" cy="${top}" rx="${r}" ry="${ry}"/>`);
        parts.push(`<line class="jp-cf-vora" x1="${cx - r}" y1="${top}" x2="${cx - r}" y2="${top + hh}"/>`);
        parts.push(`<line class="jp-cf-vora" x1="${cx + r}" y1="${top}" x2="${cx + r}" y2="${top + hh}"/>`);
        parts.push(`<path class="${colors[k]}" d="M${cx - r} ${top + hh} A${r} ${ry} 0 0 0 ${cx + r} ${top + hh}"/>`);
        parts.push(
            `<text class="jp-cf-text" x="${cx}" y="${top + hh + ry + 18}" text-anchor="middle">${T.nomCilindre(k + 1)}</text>`
        );
        parts.push(
            `<text class="jp-cf-petit" x="${cx}" y="${top + hh + ry + 34}" text-anchor="middle">2πr = ${c} · h = ${h}</text>`
        );
        x = cx + Math.max(r, 46) + 60;
    });
    parts.push('</svg>');
    return parts.join('');
}

/** La resposta escrita, per a l'historial. */
export function textRespostaCF(pas, valors) {
    if (pas.camps.tria) {
        const o = pas.opcions.find(([v]) => v === valors.tria);
        return o ? o[1] : String(valors.tria);
    }
    return String(valorCF(valors.r)).replace('.', ',');
}
