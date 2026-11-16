/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/grafica-context.js
 * ROL: La gràfica amb context comuna: una magnitud al llarg del temps (distància,
 *      litres, temperatura…) feta de trams rectes i corbes, amb els eixos graduats i
 *      les unitats. La fan servir «Gràfiques en context» (js/grafiques-context/) i
 *      qualsevol activitat que en necessiti, també en petit (targetes per triar).
 * ARQUITECTURA: mòdul pur: torna dades i text SVG (cap DOM). Els estils són els del
 *      gràfic estadístic comú (.ge-*, css/grafic-estadistic.css) i .gc-*.
 *   TRAM { x0, x1, y0, y1, forma }  forma:
 *     'recta'    (per defecte)
 *     'accelera' comença lent i va cada cop més de pressa: y0 + Δ·u²
 *     'frena'    comença de pressa i va cada cop més a poc a poc: y0 + Δ·(2u − u²)
 *     'suau'     en S, sense punxes (temperatura d'un dia): y0 + Δ·(1 − cos πu)/2
 *     (u = (x − x0)/(x1 − x0)). Amb x1 − x0 = D enter i Δ = s·D², 'accelera' i 'frena'
 *     passen per punts de la quadrícula a cada x enter: es poden llegir exactament.
 *   valorGrafica(trams, x)   el valor a x (NaN fora del domini)
 *   svgGraficaContext({ trams, xMax, yMax, pasX?, pasY?, cadaX?, cadaY?, titolX?, titolY?,
 *                       mini?, punts? })
 *     pasX, pasY   distància entre ratlles; cadaX, cadaY: el número només a les ratlles
 *                  múltiples (per defecte, a totes)
 *     mini         en petit (targetes): sense títols ni punts
 *     punts        un punt a cada extrem de tram (per defecte, sí)
 *   Les ratlles porten data-x o data-v (el valor) i la corba, els punts de la mostra:
 *   les proves la poden tornar a llegir.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const r1 = x => Math.round(x * 10) / 10;
const textNombre = v => String(Math.round(v * 1000) / 1000).replace('.', ',');
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const multiple = (v, p) => Math.abs(v / p - Math.round(v / p)) < 1e-9;

/** El valor d'un tram a x (x dins del tram). */
export function valorTram(t, x) {
    const u = (x - t.x0) / (t.x1 - t.x0);
    const d = t.y1 - t.y0;
    if (t.forma === 'accelera') return t.y0 + d * u * u;
    if (t.forma === 'frena') return t.y0 + d * (2 * u - u * u);
    if (t.forma === 'suau') return t.y0 + (d * (1 - Math.cos(Math.PI * u))) / 2;
    return t.y0 + d * u;
}

/** El valor de la gràfica a x (NaN fora del domini). */
export function valorGrafica(trams, x) {
    const t = trams.find(tr => x >= tr.x0 - 1e-9 && x <= tr.x1 + 1e-9);
    return t ? valorTram(t, x) : NaN;
}

/** La gràfica amb els eixos graduats. */
export function svgGraficaContext({
    trams,
    xMax,
    yMax,
    pasX = 1,
    pasY = 1,
    cadaX = 0,
    cadaY = 0,
    titolX = '',
    titolY = '',
    mini = false,
    punts = true,
}) {
    const [W, H] = mini ? [230, 150] : [400, 280];
    const [x0, dalt, baix, dreta] = mini ? [30, 12, 20, 10] : [52, 40, 44, 14];
    const y0 = H - baix;
    const [alt, ample] = [y0 - dalt, W - x0 - dreta];
    const px = x => x0 + (x / xMax) * ample;
    const py = y => y0 - (y / yMax) * alt;
    let s = '';
    // Ratlles verticals (temps) i horitzontals (magnitud), amb els seus números
    for (let x = 0; x <= xMax + 1e-9; x += pasX) {
        const num = !cadaX || multiple(x, cadaX);
        s += `<line class="ge-linia${cadaX && num ? ' ge-forta' : ''}" x1="${r1(px(x))}" y1="${y0}" x2="${r1(px(x))}" y2="${dalt}" data-x="${r1(x)}"/>`;
        if (num)
            s += `<text class="ge-marca" x="${r1(px(x))}" y="${y0 + (mini ? 12 : 16)}" text-anchor="middle">${textNombre(x)}</text>`;
    }
    for (let y = 0; y <= yMax + 1e-9; y += pasY) {
        const num = !cadaY || multiple(y, cadaY);
        s += `<line class="ge-linia${cadaY && num ? ' ge-forta' : ''}" x1="${x0}" y1="${r1(py(y))}" x2="${r1(x0 + ample)}" y2="${r1(py(y))}" data-v="${r1(y)}"/>`;
        if (num)
            s += `<text class="ge-marca" x="${x0 - (mini ? 4 : 6)}" y="${r1(py(y) + 4)}" text-anchor="end">${textNombre(y)}</text>`;
    }
    s += `<line class="ge-eix" x1="${x0}" y1="${y0}" x2="${r1(x0 + ample + 4)}" y2="${y0}"/>`;
    s += `<line class="ge-eix" x1="${x0}" y1="${y0}" x2="${x0}" y2="${dalt - 4}"/>`;
    if (!mini && titolY) s += `<text class="ge-titol" x="${x0 - 40}" y="${dalt - 14}">${esc(titolY)}</text>`;
    if (!mini && titolX)
        s += `<text class="ge-titol" x="${r1(x0 + ample / 2)}" y="${H - 6}" text-anchor="middle">${esc(titolX)}</text>`;
    // La corba: els trams rectes, de punta a punta; els corbs, mostrejats 8 vegades per unitat
    // (cada x enter és un punt de la mostra)
    const mostra = [];
    trams.forEach((t, i) => {
        const n = !t.forma || t.forma === 'recta' ? 1 : Math.max(8, Math.round((t.x1 - t.x0) * 8));
        for (let k = i === 0 ? 0 : 1; k <= n; k++) {
            const x = t.x0 + ((t.x1 - t.x0) * k) / n;
            mostra.push(`${r1(px(x))},${r1(py(valorTram(t, x)))}`);
        }
    });
    s += `<polyline class="gc-corba${mini ? ' gc-mini' : ''}" points="${mostra.join(' ')}"/>`;
    if (punts && !mini) {
        const extrems = [[trams[0].x0, trams[0].y0], ...trams.map(t => [t.x1, t.y1])];
        extrems.forEach(
            ([x, y]) =>
                (s += `<circle class="gc-punt" cx="${r1(px(x))}" cy="${r1(py(y))}" r="3.5" data-x="${x}" data-v="${y}"/>`)
        );
    }
    const etiqueta = `Gràfica${titolY ? ': ' + titolY : ''}${titolX ? ' segons ' + titolX : ''}`;
    return `<svg class="ge gc${mini ? ' gc-petita' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(etiqueta)}">${s}</svg>`;
}
