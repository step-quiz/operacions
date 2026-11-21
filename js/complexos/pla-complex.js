/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/complexos/pla-complex.js
 * ROL: El pla complex (diagrama d'Argand) en SVG, per a les pestanyes «Forma
 *      polar» i «Potències i arrels» de complexos.html: eixos, els nombres com a
 *      fletxes des de l'origen, els quadrants per tocar, i la circumferència de les
 *      arrels amb les marques per tocar i el polígon regular.
 * ARQUITECTURA: mòdul pur (torna text SVG). Els elements que es toquen porten
 *      data-q (quadrant 1-4) o data-m (índex de la marca); el DOM hi posa els clics.
 *
 *   svgPlaComplex({ vectors, quadrants, cercle, marques, seleccionades, primera, poligon })
 *     vectors        [{ re, im, etiqueta, classe? }]  (etiqueta en TeX senzill: z_1, z^{4}, w_0)
 *     quadrants      true: els quatre quadrants es poden tocar (amb I, II, III, IV)
 *     cercle         el radi de la circumferència de les arrels (opcional)
 *     marques        [angle en graus]: punts de la circumferència per tocar
 *     seleccionades  [índexs] tocats; primera: l'índex de la primera arrel (fix)
 *     poligon        true: es dibuixa el polígon regular de les marques seleccionades i la primera
 * ============================================================================
 */

const MIDA = 320;
const C0 = MIDA / 2;
const RAD_PLA = Math.PI / 180;
const arrodPla = x => Math.round(x * 10) / 10;
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃' };
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** z_1 → z₁, z^{4} → z⁴, z_1 z_2 → z₁z₂, z_1/z_2 → z₁/z₂. */
export const textEtiqueta = tex =>
    tex
        .replace(/_\{?(\d)\}?/g, (_, d) => SUB[d] || d)
        .replace(/\^\{(\d+)\}/g, (_, n) => [...n].map(d => SUP[d]).join(''))
        .replace(/\s+/g, '');

export function svgPlaComplex({
    vectors = [],
    quadrants = false,
    cercle = null,
    marques = [],
    seleccionades = [],
    primera = null,
    poligon = false,
} = {}) {
    const radis = [...vectors.map(v => Math.hypot(v.re, v.im)), cercle || 0, 1];
    const R = Math.max(...radis);
    const u = (C0 - 34) / R; // píxels per unitat
    const X = re => arrodPla(C0 + re * u);
    const Y = im => arrodPla(C0 - im * u);
    let s = '';
    if (quadrants) {
        const q = [
            [C0, 0, 1],
            [0, 0, 2],
            [0, C0, 3],
            [C0, C0, 4],
        ];
        for (const [x, y, n] of q)
            s += `<rect class="cx-quadrant" data-q="${n}" x="${x}" y="${y}" width="${C0}" height="${C0}" role="button" aria-label="quadrant ${['', 'I', 'II', 'III', 'IV'][n]}"/>`;
        const pos = { 1: [0.75, 0.25], 2: [0.25, 0.25], 3: [0.25, 0.75], 4: [0.75, 0.75] };
        for (const n of [1, 2, 3, 4])
            s += `<text class="cx-quadrant-nom" x="${pos[n][0] * MIDA}" y="${pos[n][1] * MIDA + 6}" text-anchor="middle">${['', 'I', 'II', 'III', 'IV'][n]}</text>`;
    }
    // Eixos i unitats
    s += `<line class="cx-eix" x1="6" y1="${C0}" x2="${MIDA - 6}" y2="${C0}"/><line class="cx-eix" x1="${C0}" y1="6" x2="${C0}" y2="${MIDA - 6}"/>`;
    s += `<text class="cx-eix-nom" x="${MIDA - 8}" y="${C0 - 6}" text-anchor="end">Re</text><text class="cx-eix-nom" x="${C0 + 6}" y="16">Im</text>`;
    const pas = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find(p => R / p <= 5) || 2000;
    for (let k = pas; k <= R; k += pas) {
        s += `<line class="cx-eix" x1="${X(k)}" y1="${C0 - 3}" x2="${X(k)}" y2="${C0 + 3}"/><text class="cx-marca-eix" x="${X(k)}" y="${C0 + 15}" text-anchor="middle">${k}</text>`;
        s += `<line class="cx-eix" x1="${C0 - 3}" y1="${Y(k)}" x2="${C0 + 3}" y2="${Y(k)}"/>`;
    }
    // La circumferència de les arrels, el polígon i les marques
    if (cercle) {
        s += `<circle class="cx-cercle" cx="${C0}" cy="${C0}" r="${arrodPla(cercle * u)}"/>`;
        const triades = [primera, ...seleccionades].filter(i => i !== null && i !== undefined);
        if (poligon && triades.length > 2) {
            const pts = triades
                .map(i => marques[i])
                .sort((a, b) => a - b)
                .map(a => `${X(cercle * Math.cos(a * RAD_PLA))},${Y(cercle * Math.sin(a * RAD_PLA))}`)
                .join(' ');
            s += `<polygon class="cx-poligon" points="${pts}"/>`;
        }
        marques.forEach((a, i) => {
            const fix = i === primera;
            const sel = seleccionades.includes(i);
            const cls = `cx-marca${fix ? ' cx-marca-fixa' : sel ? ' cx-marca-sel' : ''}`;
            const attrs = fix
                ? ''
                : ` data-m="${i}" role="button" aria-pressed="${sel}" aria-label="punt a ${Math.round(a)}°"`;
            s += `<circle class="${cls}"${attrs} cx="${X(cercle * Math.cos(a * RAD_PLA))}" cy="${Y(cercle * Math.sin(a * RAD_PLA))}" r="${fix || sel ? 8 : 6}"/>`;
        });
    }
    // Els vectors
    for (const v of vectors) {
        const [x, y] = [X(v.re), Y(v.im)];
        const cls = v.classe || 'cx-vector';
        s += `<line class="${cls}" x1="${C0}" y1="${C0}" x2="${x}" y2="${y}" marker-end="url(#cx-fletxa)"/>`;
        const dx = v.re >= 0 ? 8 : -8;
        const dy = v.im >= 0 ? -8 : 16;
        s += `<text class="cx-vector-nom ${cls}-nom" x="${arrodPla(x + dx)}" y="${arrodPla(y + dy)}" text-anchor="${v.re >= 0 ? 'start' : 'end'}">${textEtiqueta(v.etiqueta || '')}</text>`;
    }
    const defs =
        '<defs><marker id="cx-fletxa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="cx-fletxa"/></marker></defs>';
    return `<svg class="cx-pla" viewBox="0 0 ${MIDA} ${MIDA}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="pla complex">${defs}${s}</svg>`;
}
