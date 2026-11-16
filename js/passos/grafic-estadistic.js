/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/grafic-estadistic.js
 * ROL: El gràfic estadístic comú: diagrama de barres, de sectors, histograma i
 *      polígon de freqüències, pictograma, i els gràfics que enganyen (eix tallat,
 *      escala irregular, pictograma que creix en àrea). El fan servir «Gràfics
 *      estadístics» (js/grafics-estadistics/) i qualsevol activitat que en necessiti.
 * ARQUITECTURA: mòdul pur: torna el codi SVG com a text (cap DOM). Els colors són
 *      classes (css/grafic-estadistic.css), amb els del tema de la pàgina.
 *   svgBarres({ categories, valors, pas?, cada?, min?, marques?, titolY?, titolX? })
 *     pas      distància entre ratlles de l'eix vertical (si no, una de neta)
 *     cada     el número de l'eix només a les ratlles múltiples de cada (p. ex. una ratlla
 *              per unitat i el número cada 5); per defecte, a totes
 *     min      on comença l'eix vertical (> 0: eix tallat, el gràfic enganya)
 *     marques  [0, 10, 20, 50, 100]: les ratlles de l'eix a distàncies iguals encara
 *              que els valors no ho siguin (escala irregular, el gràfic enganya)
 *   svgHistograma({ limits, freq, barres?, poligon?, titolY?, titolX? })
 *     una ratlla per unitat (les freqüències es llegeixen exactes), el número cada pasNet()
 *     limits   [a0, a1, …, an]: intervals [a0, a1), [a1, a2)…, tots de la mateixa amplada
 *     poligon  el polígon de freqüències (punts a les marques de classe, tancat a l'eix)
 *   svgSectors({ categories, valors, etiquetes? })   etiquetes: el text de dins de cada sector
 *   svgPictograma({ categories, valors, unitat, nomUnitat })   una icona = unitat (mitja icona: la meitat)
 *   svgPictogramaArea({ categories, valors, pas?, titolY? })   una icona per categoria, d'altura
 *              i amplada proporcionals al valor (l'àrea creix amb el quadrat: enganya)
 *   Les ratlles de l'eix porten data-v (el valor) i les barres, data-v i data-cat, perquè
 *   les proves puguin tornar a llegir el gràfic com ho faria l'alumne.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const r1 = x => Math.round(x * 10) / 10;
/** Un nombre amb coma decimal. */
export const textNombre = v => String(Math.round(v * 1000) / 1000).replace('.', ',');
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** El pas net de l'eix (1, 2, 5, 10, 20, 25, 50…) perquè `max` hi càpiga amb `maxRatlles` ratlles com a molt. */
export function pasNet(max, maxRatlles = 8) {
    const candidats = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
    return candidats.find(p => Math.ceil(max / p) <= maxRatlles) || 10000;
}

/** Les marques d'un eix lineal de `min` (múltiple de `pas`) fins al primer múltiple de `pas` ≥ max. */
export function marquesLineals(max, pas, min = 0) {
    const dalt = Math.max(min + pas, Math.ceil(max / pas) * pas);
    const m = [];
    for (let v = min; v <= dalt + 1e-9; v += pas) m.push(Math.round(v * 1000) / 1000);
    return m;
}

const W = 400;
let idClip = 0;

/** L'svg arrel. */
const arrel = (h, etiqueta, cos) =>
    `<svg class="ge" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${esc(etiqueta)}">${cos}</svg>`;

/**
 * L'eix vertical amb les ratlles horitzontals: marques a distàncies iguals (de baix a dalt).
 * Torna el tros d'SVG i yDe(v), l'altura de cada valor (lineal entre dues marques).
 */
function eixVertical(marques, { x0, y0, alt, ample, titol, cada = 0 }) {
    const n = marques.length - 1;
    const yDe = v => {
        if (v <= marques[0]) return y0;
        for (let i = 0; i < n; i++)
            if (v <= marques[i + 1]) return y0 - ((i + (v - marques[i]) / (marques[i + 1] - marques[i])) * alt) / n;
        return y0 - alt;
    };
    let s = '';
    marques.forEach((v, i) => {
        const y = r1(y0 - (i * alt) / n);
        const numero = !cada || Math.abs(v / cada - Math.round(v / cada)) < 1e-9;
        s += `<line class="ge-linia${cada && numero ? ' ge-forta' : ''}" x1="${x0}" y1="${y}" x2="${r1(x0 + ample)}" y2="${y}" data-v="${v}"/>`;
        if (numero)
            s += `<text class="ge-marca" x="${x0 - 6}" y="${r1(y + 4)}" text-anchor="end">${textNombre(v)}</text>`;
    });
    s += `<line class="ge-eix" x1="${x0}" y1="${y0}" x2="${x0}" y2="${r1(y0 - alt - 6)}"/>`;
    if (titol) s += `<text class="ge-titol" x="${x0 - 40}" y="${r1(y0 - alt - 14)}">${esc(titol)}</text>`;
    return { s, yDe };
}

// Marc dels gràfics amb eixos
const EIX = { x0: 52, dalt: 40, baix: 44 };
const marc = h => ({ x0: EIX.x0, y0: h - EIX.baix, alt: h - EIX.baix - EIX.dalt, ample: W - EIX.x0 - 14 });

/** Diagrama de barres (vertical). */
export function svgBarres({ categories, valors, pas, cada = 0, min = 0, marques, titolY = '', titolX = '' }) {
    const H = 280;
    const { x0, y0, alt, ample } = marc(H);
    const m = marques || marquesLineals(Math.max(...valors), pas || pasNet(Math.max(...valors) - min), min);
    const { s: eix, yDe } = eixVertical(m, { x0, y0, alt, ample, titol: titolY, cada });
    const k = categories.length;
    const lloc = ample / k;
    let s = eix;
    categories.forEach((c, i) => {
        const cx = x0 + lloc * (i + 0.5);
        const y = r1(yDe(valors[i]));
        const amp = Math.min(48, lloc * 0.62);
        s += `<rect class="ge-barra" x="${r1(cx - amp / 2)}" y="${y}" width="${r1(amp)}" height="${r1(y0 - y)}" data-cat="${esc(c)}" data-v="${valors[i]}"/>`;
        s += `<text class="ge-cat" x="${r1(cx)}" y="${y0 + 17}" text-anchor="middle">${esc(c)}</text>`;
    });
    s += `<line class="ge-eix" x1="${x0}" y1="${y0}" x2="${r1(x0 + ample + 6)}" y2="${y0}"/>`;
    if (titolX)
        s += `<text class="ge-titol" x="${r1(x0 + ample / 2)}" y="${H - 6}" text-anchor="middle">${esc(titolX)}</text>`;
    return arrel(H, `Diagrama de barres${titolX ? ': ' + titolX : ''}`, s);
}

/** Histograma (i, si cal, el polígon de freqüències a sobre o tot sol). */
export function svgHistograma({ limits, freq, barres = true, poligon = false, titolY = '', titolX = '' }) {
    const H = 280;
    const { x0, y0, alt, ample } = marc(H);
    const w = limits[1] - limits[0];
    // Amb el polígon, l'eix horitzontal s'allarga mig interval per banda: el polígon hi tanca, a les
    // marques de classe dels intervals buits del costat (sense número: només els límits en porten)
    const [a, b] = poligon
        ? [limits[0] - w / 2, limits[limits.length - 1] + w / 2]
        : [limits[0], limits[limits.length - 1]];
    const xDe = v => x0 + 8 + ((v - a) / (b - a)) * (ample - 16);
    const m = marquesLineals(Math.max(...freq), 1);
    const { s: eix, yDe } = eixVertical(m, { x0, y0, alt, ample, titol: titolY, cada: pasNet(Math.max(...freq)) });
    let s = eix;
    if (barres)
        freq.forEach((f, i) => {
            const [xa, xb] = [xDe(limits[i]), xDe(limits[i + 1])];
            const y = r1(yDe(f));
            s += `<rect class="ge-barra ge-hist" x="${r1(xa)}" y="${y}" width="${r1(xb - xa)}" height="${r1(y0 - y)}" data-cat="[${limits[i]}, ${limits[i + 1]})" data-v="${f}"/>`;
        });
    limits.forEach(v => {
        s += `<line class="ge-eix" x1="${r1(xDe(v))}" y1="${y0}" x2="${r1(xDe(v))}" y2="${y0 + 4}"/>`;
        s += `<text class="ge-marca" x="${r1(xDe(v))}" y="${y0 + 16}" text-anchor="middle">${textNombre(v)}</text>`;
    });
    if (poligon) {
        const punts = [[a, 0], ...freq.map((f, i) => [(limits[i] + limits[i + 1]) / 2, f]), [b, 0]];
        s += `<polyline class="ge-poligon" points="${punts.map(([x, y]) => `${r1(xDe(x))},${r1(yDe(y))}`).join(' ')}"/>`;
        punts
            .slice(1, -1)
            .forEach(
                ([x, y]) =>
                    (s += `<circle class="ge-punt" cx="${r1(xDe(x))}" cy="${r1(yDe(y))}" r="4" data-x="${x}" data-v="${y}"/>`)
            );
    }
    s += `<line class="ge-eix" x1="${x0}" y1="${y0}" x2="${r1(x0 + ample + 6)}" y2="${y0}"/>`;
    if (titolX)
        s += `<text class="ge-titol" x="${r1(x0 + ample / 2)}" y="${H - 6}" text-anchor="middle">${esc(titolX)}</text>`;
    const nom =
        barres && poligon ? 'Histograma i polígon de freqüències' : barres ? 'Histograma' : 'Polígon de freqüències';
    return arrel(H, `${nom}${titolX ? ': ' + titolX : ''}`, s);
}

/** Diagrama de sectors amb la llegenda a la dreta; `etiquetes` (opcional) va dins de cada sector. */
export function svgSectors({ categories, valors, etiquetes = [] }) {
    const H = 240;
    const [cx, cy, r] = [118, 120, 100];
    const total = valors.reduce((x, y) => x + y, 0);
    const punt = angle => [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
    let s = '';
    let angle = 0;
    valors.forEach((v, i) => {
        const obert = (v / total) * 2 * Math.PI;
        const [x1, y1] = punt(angle);
        const [x2, y2] = punt(angle + obert);
        const classe = `ge-sector ge-c${i % 6}`;
        s +=
            v >= total
                ? `<circle class="${classe}" cx="${cx}" cy="${cy}" r="${r}" data-cat="${esc(categories[i])}" data-v="${v}"/>`
                : `<path class="${classe}" d="M ${cx} ${cy} L ${r1(x1)} ${r1(y1)} A ${r} ${r} 0 ${obert > Math.PI ? 1 : 0} 1 ${r1(x2)} ${r1(y2)} Z" data-cat="${esc(categories[i])}" data-v="${v}"/>`;
        if (etiquetes[i]) {
            const mig = angle + obert / 2;
            const [tx, ty] = [cx + 0.62 * r * Math.sin(mig), cy - 0.62 * r * Math.cos(mig)];
            s += `<text class="ge-dins" x="${r1(tx)}" y="${r1(ty + 5)}" text-anchor="middle">${esc(etiquetes[i])}</text>`;
        }
        angle += obert;
    });
    const y0 = cy - (categories.length * 24) / 2 + 12;
    categories.forEach((c, i) => {
        const y = y0 + i * 24;
        s += `<rect class="ge-c${i % 6}" x="244" y="${y - 11}" width="16" height="16" rx="3"/>`;
        s += `<text class="ge-cat" x="268" y="${y + 2}">${esc(c)}</text>`;
    });
    return arrel(H, 'Diagrama de sectors', s);
}

// La icona dels pictogrames (24 × 24): una persona senzilla
const ICONA = '<circle cx="12" cy="5.5" r="5"/><path d="M3 24 V17 a6 6 0 0 1 6 -6 h6 a6 6 0 0 1 6 6 V24 Z"/>';
// La del pictograma que enganya (12 × 24, estreta perquè les grans no es trepitgin)
const ICONA_ALTA = '<circle cx="6" cy="4" r="3.6"/><path d="M1 24 V13 a5 5 0 0 1 10 0 V24 Z"/>';

/** Pictograma: una fila per categoria; cada icona val `unitat` (una mitja icona, la meitat). */
export function svgPictograma({ categories, valors, unitat, nomUnitat = '' }) {
    const [fila, x0, pas] = [34, 104, 28];
    const H = categories.length * fila + 52;
    let s = '';
    categories.forEach((c, i) => {
        const y = 10 + i * fila;
        const [plenes, mitja] = [Math.floor(valors[i] / unitat + 1e-9), valors[i] % unitat !== 0];
        s += `<text class="ge-cat" x="${x0 - 10}" y="${y + 17}" text-anchor="end">${esc(c)}</text>`;
        s += `<g class="ge-fila" data-cat="${esc(c)}" data-v="${valors[i]}">`;
        for (let j = 0; j < plenes; j++)
            s += `<g class="ge-icona" transform="translate(${x0 + j * pas} ${y})">${ICONA}</g>`;
        if (mitja) {
            const id = `ge-mitja-${++idClip}`;
            s += `<clipPath id="${id}"><rect x="0" y="0" width="12" height="24"/></clipPath>`;
            s += `<g class="ge-icona ge-mitja" transform="translate(${x0 + plenes * pas} ${y})" clip-path="url(#${id})">${ICONA}</g>`;
        }
        s += '</g>';
    });
    const yl = H - 34;
    s += `<line class="ge-linia" x1="10" y1="${yl - 8}" x2="${W - 10}" y2="${yl - 8}"/>`;
    s += `<g class="ge-icona ge-clau" transform="translate(${x0} ${yl})">${ICONA}</g>`;
    s += `<text class="ge-cat" x="${x0 + 32}" y="${yl + 17}">= ${textNombre(unitat)}${nomUnitat ? ' ' + esc(nomUnitat) : ''}</text>`;
    return arrel(H, 'Pictograma', s);
}

/** Pictograma que enganya: una sola icona per categoria, amb altura i amplada proporcionals al valor. */
export function svgPictogramaArea({ categories, valors, pas, titolY = '' }) {
    const H = 280;
    const { x0, y0, alt, ample } = marc(H);
    const m = marquesLineals(Math.max(...valors), pas || pasNet(Math.max(...valors)));
    const { s: eix, yDe } = eixVertical(m, { x0, y0, alt, ample, titol: titolY });
    const lloc = ample / categories.length;
    let s = eix;
    categories.forEach((c, i) => {
        const cx = x0 + lloc * (i + 0.5);
        const h = y0 - yDe(valors[i]);
        const k = h / 24; // escala de la icona (12 × 24): altura i amplada proporcionals al valor
        s += `<g class="ge-icona ge-gran" transform="translate(${r1(cx - 6 * k)} ${r1(y0 - h)}) scale(${Math.round(k * 1000) / 1000})" data-cat="${esc(c)}" data-v="${valors[i]}">${ICONA_ALTA}</g>`;
        s += `<text class="ge-cat" x="${r1(cx)}" y="${y0 + 17}" text-anchor="middle">${esc(c)}</text>`;
    });
    s += `<line class="ge-eix" x1="${x0}" y1="${y0}" x2="${r1(x0 + ample + 6)}" y2="${y0}"/>`;
    return arrel(H, 'Pictograma', s);
}
