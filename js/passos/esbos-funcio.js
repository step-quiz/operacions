/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/esbos-funcio.js
 * ROL: L'esbós de la gràfica d'una funció qualsevol, en SVG (text). Comú: el fa
 *      servir «Estudi d'una funció» (la gràfica del final i les 3 gràfiques per triar)
 *      i el poden fer servir les activitats que vulguin una corba amb asímptotes.
 * ARQUITECTURA: mòdul pur (cap DOM, cap atzar). Un dibuix: les proves en comproven
 *      els valors (on són els punts, quins trossos), no el traç.
 * ORIGEN: Grafiques.esbos dels procediments animats de step-quiz/pau
 *      (procediments/grafiques.js, novembre 2026), passat a mòdul ES. Canvis: el
 *      clipPath té un id únic per dibuix (a la pantalla n'hi pot haver 3 alhora) i els
 *      punts poden portar una classe (extrems i inflexions en colors diferents).
 *
 *   svgEsbos({ f, trams, x, y, asimptotes, punts, marquesX, etiqueta })
 *     f           funció: nombre → nombre (NaN o ±Infinity fora del domini)
 *     trams       [{ a, b, tancatA?, tancatB? }] els trossos del domini (±Infinity als extrems):
 *                 la corba es dibuixa tros a tros (no travessa una asímptota vertical)
 *     x, y        la finestra, [mínim, màxim]
 *     asimptotes  [{ v }] verticals, [{ h }] horitzontals, [{ m, n }] obliqües (discontínues)
 *     punts       [{ x, y, classe? }] rodonets (classe per defecte 'ef-punt')
 *     marquesX    opcional [{ x, text }]; si no, els enters cada 1, 2 o 5 unitats
 *     etiqueta    opcional: text accessible (aria-label)
 *   Classes per a l'estil (css/estudi-funcio.css): ef-eix, ef-marca, ef-corba, ef-asimptota, ef-punt.
 * ============================================================================
 */

let comptadorEsbos = 0;
const arrodoneix = x => Math.round(x * 10) / 10;
const textNombre = k => (k < 0 ? '−' : '') + Math.abs(k);

export function svgEsbos({
    f,
    trams,
    x: [xmin, xmax],
    y: [ymin, ymax],
    asimptotes = [],
    punts = [],
    marquesX = null,
    etiqueta = '',
}) {
    const W = 420;
    const H = 300;
    const M = 16;
    const id = `ef-finestra-${++comptadorEsbos}`;
    const X = x => arrodoneix(M + ((x - xmin) / (xmax - xmin)) * (W - 2 * M));
    const Y = y => arrodoneix(M + ((ymax - y) / (ymax - ymin)) * (H - 2 * M));
    const marge = (ymax - ymin) * 2; // fora de la finestra la corba es retalla, però no gaire lluny
    let svg = `<defs><clipPath id="${id}"><rect x="${M}" y="${M}" width="${W - 2 * M}" height="${H - 2 * M}"/></clipPath></defs>`;
    // Els eixos, amb les marques
    const y0 = Y(Math.min(Math.max(0, ymin), ymax));
    const x0 = X(Math.min(Math.max(0, xmin), xmax));
    svg += `<line class="ef-eix" x1="${M / 2}" y1="${y0}" x2="${W - M / 2}" y2="${y0}"/>`;
    svg += `<line class="ef-eix" x1="${x0}" y1="${M / 2}" x2="${x0}" y2="${H - M / 2}"/>`;
    const pas = rang => [1, 2, 5, 10, 20, 50, 100].find(p => rang / p <= 10) || 200;
    let mx = marquesX;
    if (!mx) {
        const p = pas(xmax - xmin);
        mx = [];
        for (let k = Math.ceil(xmin / p) * p; k <= xmax; k += p) if (k) mx.push({ x: k, text: textNombre(k) });
    }
    for (const m of mx) {
        svg += `<line class="ef-eix" x1="${X(m.x)}" y1="${y0 - 3}" x2="${X(m.x)}" y2="${y0 + 3}"/>`;
        svg += `<text class="ef-marca" x="${X(m.x)}" y="${Math.min(y0 + 15, H - 3)}" text-anchor="middle">${m.text}</text>`;
    }
    const py = pas(ymax - ymin);
    for (let k = Math.ceil(ymin / py) * py; k <= ymax; k += py) {
        if (!k) continue;
        svg += `<line class="ef-eix" x1="${x0 - 3}" y1="${Y(k)}" x2="${x0 + 3}" y2="${Y(k)}"/>`;
        svg += `<text class="ef-marca" x="${x0 - 6}" y="${Y(k) + 4}" text-anchor="end">${textNombre(k)}</text>`;
    }
    // Les asímptotes
    let rectes = '';
    for (const a of asimptotes) {
        if (a.v !== undefined)
            rectes += `<line class="ef-asimptota" x1="${X(a.v)}" y1="${M}" x2="${X(a.v)}" y2="${H - M}"/>`;
        else if (a.h !== undefined)
            rectes += `<line class="ef-asimptota" x1="${M}" y1="${Y(a.h)}" x2="${W - M}" y2="${Y(a.h)}"/>`;
        else
            rectes += `<line class="ef-asimptota" x1="${X(xmin)}" y1="${Y(a.m * xmin + a.n)}" x2="${X(xmax)}" y2="${Y(a.m * xmax + a.n)}"/>`;
    }
    // La corba, tros a tros; un salt (fora del domini o un valor enorme) talla el camí
    let cami = '';
    for (const t of trams) {
        const a = Math.max(t.a, xmin);
        const b = Math.min(t.b, xmax);
        if (!(a < b)) continue;
        const n = 600;
        const e = (b - a) * 1e-9;
        let obert = false;
        for (let i = 0; i <= n; i++) {
            let x = a + ((b - a) * i) / n;
            if (i === 0 && t.a === a && !t.tancatA) x += e;
            if (i === n && t.b === b && !t.tancatB) x -= e;
            const yv = f(x);
            if (!Number.isFinite(yv)) {
                obert = false;
                continue;
            }
            const yc = Math.max(ymin - marge, Math.min(ymax + marge, yv));
            cami += `${obert ? 'L' : 'M'}${X(x)} ${Y(yc)}`;
            obert = yc === yv;
        }
    }
    svg += `<g clip-path="url(#${id})">${rectes}${cami ? `<path class="ef-corba" d="${cami}"/>` : ''}</g>`;
    for (const p of punts)
        if (p.x >= xmin && p.x <= xmax && p.y >= ymin && p.y <= ymax)
            svg += `<circle class="${p.classe || 'ef-punt'}" cx="${X(p.x)}" cy="${Y(p.y)}" r="4.2"/>`;
    const aria = etiqueta ? ` aria-label="${etiqueta.replace(/"/g, '&quot;')}"` : '';
    return `<svg class="ef-esbos" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img"${aria}>${svg}</svg>`;
}

/**
 * Una finestra que conté els punts importants (les x dels extrems, de les inflexions, dels punts
 * fora del domini…), amb marge. L'alçada surt dels valors de f en aquests punts (i el 0), perquè
 * els extrems no quedin aixafats; si no n'hi ha prou, dels valors a prop del centre.
 * Retorna { x: [a, b], y: [c, d] }.
 */
export function finestraEsbos(xsImportants, f, { minAmple = 6 } = {}) {
    let [a, b] = [Math.min(...xsImportants, 0), Math.max(...xsImportants, 0)];
    const ample = Math.max(b - a, minAmple);
    const centre = (a + b) / 2;
    a = centre - ample * 0.75;
    b = centre + ample * 0.75;
    const ys = xsImportants.map(f).filter(Number.isFinite);
    // Uns quants valors de la zona central (sense les vores, on la corba ja s'escapa)
    for (let i = 0; i <= 20; i++) {
        const v = f(centre + ((i - 10) / 10) * ample * 0.3);
        if (Number.isFinite(v)) ys.push(v);
    }
    let c = Math.min(...ys, 0);
    let d = Math.max(...ys, 0);
    const m = Math.max((d - c) * 0.45, 2);
    c -= m;
    d += m;
    return { x: [a, b], y: [c, d] };
}
