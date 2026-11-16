/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/figures-mesura.js
 * ROL: Les figures de mesura, comunes (Àrees i volums; les pot fer servir qualsevol
 *      activitat de mesura): figures planes (triangle, paral·lelogram, rombe,
 *      trapezi rectangle, cercle), figures compostes (casa, rectangle amb un forat,
 *      porta, forma de L) i cossos en perspectiva cavallera (ortoedre, cilindre,
 *      piràmide quadrangular, con, esfera).
 * ARQUITECTURA: mòdul pur (cap DOM): cada funció torna el text SVG. Les mides són
 *      nombres (en la unitat de l'activitat) i el dibuix s'escala per cabre-hi.
 *      Cada segment amb mesura porta una etiqueta «lletra = valor unitat»,
 *      data-segment="lletra" i data-mesura="id" (les proves recalculen les àrees i els
 *      volums a partir del dibuix); les altures són
 *      discontínues i porten la marca d'angle recte. Colors del tema de la pàgina
 *      (css/figures-mesura.css).
 *   segments  { id: { lletra, valor } }: les etiquetes dels segments d'una figura
 *             (id: el segment, p. ex. 'base', 'altura', 'costat'); un segment sense
 *             entrada no porta etiqueta.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export const AMPLE_FM = 380;
export const ALT_FM = 220;
const [AMPLE, ALT] = [AMPLE_FM, ALT_FM];
// Marges per a les etiquetes: als costats, més amples («a = 16 dm» a l'esquerra d'un costat vertical)
const [MARGE_X, MARGE_Y] = [84, 36];

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n2 = v => Math.round(v * 10) / 10;

/** Escala uns punts [x, y] (y amunt) per cabre al dibuix: torna la funció que passa a píxels. */
function escala(punts) {
    const xs = punts.map(p => p[0]),
        ys = punts.map(p => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const k = Math.min((AMPLE - 2 * MARGE_X) / (x1 - x0 || 1), (ALT - 2 * MARGE_Y) / (y1 - y0 || 1));
    const dx = (AMPLE - k * (x1 - x0)) / 2,
        dy = (ALT - k * (y1 - y0)) / 2;
    const f = ([x, y]) => [n2(dx + k * (x - x0)), n2(ALT - dy - k * (y - y0))];
    f.k = k;
    return f;
}

const linia = ([x1, y1], [x2, y2], classe) => `<line class="${classe}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const poligon = (punts, classe = 'fm-figura') =>
    `<polygon class="${classe}" points="${punts.map(p => p.join(',')).join(' ')}"/>`;

/** L'etiqueta d'un segment: al costat del seu punt mig, apartada cap a fora (cap a «fora», un punt). */
function etiqueta(id, segments, [x1, y1], [x2, y2], fora, u) {
    const s = segments[id];
    if (!s) return '';
    const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
    let [nx, ny] = [-(y2 - y1), x2 - x1];
    const l = Math.hypot(nx, ny) || 1;
    [nx, ny] = [nx / l, ny / l];
    if (fora && (fora[0] - mx) * nx + (fora[1] - my) * ny > 0) [nx, ny] = [-nx, -ny];
    const [tx, ty] = [n2(mx + nx * 16), n2(my + ny * 16 + 5)];
    const ancora = Math.abs(nx) < 0.35 ? 'middle' : nx > 0 ? 'start' : 'end';
    return (
        `<text class="fm-etiqueta" data-segment="${esc(s.lletra)}" data-mesura="${esc(id)}" x="${tx}" y="${ty}" text-anchor="${ancora}">` +
        `${esc(s.lletra)} = ${esc(s.valor)} ${esc(u)}</text>`
    );
}

/** La marca d'angle recte al peu p d'una altura que puja cap a q, sobre la recta de direcció dir. */
function angleRecte(p, q, dir) {
    const m = 9;
    const [ux, uy] = [
        (q[0] - p[0]) / Math.hypot(q[0] - p[0], q[1] - p[1]),
        (q[1] - p[1]) / Math.hypot(q[0] - p[0], q[1] - p[1]),
    ];
    const l = Math.hypot(dir[0], dir[1]) || 1;
    const [vx, vy] = [dir[0] / l, dir[1] / l];
    const a = [n2(p[0] + vx * m), n2(p[1] + vy * m)];
    const b = [n2(p[0] + vx * m + ux * m), n2(p[1] + vy * m + uy * m)];
    const c = [n2(p[0] + ux * m), n2(p[1] + uy * m)];
    return `<polyline class="fm-recte" points="${a.join(',')} ${b.join(',')} ${c.join(',')}"/>`;
}

const svg = (cos, etiquetaAria) =>
    `<svg class="fm" viewBox="0 0 ${AMPLE} ${ALT}" width="${AMPLE}" height="${ALT}" role="img" aria-label="${esc(etiquetaAria)}">${cos}</svg>`;

// ── FIGURES PLANES ───────────────────────────────────────────────────────────

/** Triangle: base de 0 a a1 + a2, vèrtex a (a1, h); costats esq (de l'origen al vèrtex) i dre. */
export function svgTriangle({ a1, a2, h, segments, u }) {
    const P = [
        [0, 0],
        [a1 + a2, 0],
        [a1, h],
    ];
    const f = escala(P);
    const [A, B, C] = P.map(f);
    const peu = f([a1, 0]);
    const centre = f([(a1 + a1 + a2) / 3, h / 3]);
    return svg(
        poligon([A, B, C]) +
            linia(C, peu, 'fm-altura') +
            angleRecte(peu, C, [B[0] - A[0], B[1] - A[1]]) +
            etiqueta('base', segments, A, B, centre, u) +
            etiqueta('esq', segments, A, C, centre, u) +
            etiqueta('dre', segments, B, C, centre, u) +
            etiqueta('altura', segments, peu, f([a1, h / 2]), f([0, h / 2]), u), // a la dreta i avall: lluny dels costats
        'Triangle'
    );
}

/** Paral·lelogram: base b, desplaçament x del costat de dalt, altura h. */
export function svgParalelogram({ b, x, h, segments, u }) {
    const P = [
        [0, 0],
        [b, 0],
        [b + x, h],
        [x, h],
    ];
    const f = escala(P);
    const [A, B, C, D] = P.map(f);
    const peu = f([x, 0]);
    const centre = f([(b + x) / 2, h / 2]);
    return svg(
        poligon([A, B, C, D]) +
            linia(D, peu, 'fm-altura') +
            angleRecte(peu, D, [B[0] - A[0], 0]) +
            etiqueta('base', segments, A, B, centre, u) +
            etiqueta('costat', segments, A, D, centre, u) +
            etiqueta('altura', segments, peu, D, f([0, h / 2]), u), // a la dreta de l'altura
        'Paral·lelogram'
    );
}

/** Rombe: diagonals D (horitzontal) i d (vertical); costat c. */
export function svgRombe({ D, d, segments, u }) {
    const P = [
        [-D / 2, 0],
        [0, d / 2],
        [D / 2, 0],
        [0, -d / 2],
    ];
    const f = escala(P);
    const [E, N, W, S] = P.map(f);
    const O = f([0, 0]);
    return svg(
        poligon([E, N, W, S]) +
            linia(E, W, 'fm-diagonal') +
            linia(N, S, 'fm-diagonal') +
            angleRecte(O, N, [W[0] - O[0], 0]) +
            etiqueta('gran', segments, O, W, f([0, -d]), u) +
            etiqueta('petita', segments, O, S, f([-D, 0]), u) +
            etiqueta('costat', segments, E, N, O, u),
        'Rombe'
    );
}

/** Trapezi rectangle: base gran B (a baix), base petita b (a dalt), altura h (el costat vertical). */
export function svgTrapezi({ B, b, h, segments, u }) {
    const P = [
        [0, 0],
        [B, 0],
        [b, h],
        [0, h],
    ];
    const f = escala(P);
    const [A, Bp, C, D] = P.map(f);
    const centre = f([B / 2, h / 2]);
    return svg(
        poligon([A, Bp, C, D]) +
            angleRecte(A, D, [Bp[0] - A[0], 0]) +
            etiqueta('gran', segments, A, Bp, centre, u) +
            etiqueta('petita', segments, D, C, centre, u) +
            etiqueta('altura', segments, A, D, centre, u) +
            etiqueta('costat', segments, Bp, C, centre, u),
        'Trapezi'
    );
}

/** Cercle amb un diàmetre marcat. */
export function svgCercle({ d, segments, u }) {
    const f = escala([
        [-d / 2, -d / 2],
        [d / 2, d / 2],
    ]);
    const O = f([0, 0]);
    const R = n2((d / 2) * f.k);
    const [E, W] = [f([-d / 2, 0]), f([d / 2, 0])];
    return svg(
        `<circle class="fm-figura" cx="${O[0]}" cy="${O[1]}" r="${R}"/>` +
            linia(E, W, 'fm-diagonal') +
            `<circle class="fm-punt" cx="${O[0]}" cy="${O[1]}" r="3"/>` +
            etiqueta('diametre', segments, E, W, f([0, -d]), u),
        'Cercle'
    );
}

// ── FIGURES COMPOSTES ────────────────────────────────────────────────────────

/** Casa: un rectangle W × A amb un triangle de base W i altura T a sobre. */
export function svgCasa({ W, A, T, segments, u }) {
    const P = [
        [0, 0],
        [W, 0],
        [W, A],
        [W / 2, A + T],
        [0, A],
    ];
    const f = escala(P);
    const [p0, p1, p2, p3, p4] = P.map(f);
    const peu = f([W / 2, A]);
    const centre = f([W / 2, A / 2]);
    return svg(
        poligon([p0, p1, p2, p3, p4]) +
            linia(p4, p2, 'fm-divisio') +
            linia(p3, peu, 'fm-altura') +
            angleRecte(peu, p3, [p2[0] - p4[0], 0]) +
            etiqueta('ample', segments, p0, p1, centre, u) +
            etiqueta('alt', segments, p0, p4, centre, u) +
            etiqueta('teulada', segments, peu, p3, f([W, A + T]), u),
        'Figura composta: un rectangle i un triangle'
    );
}

/** Rectangle W × A amb un forat rodó de radi r al mig. */
export function svgForat({ W, A, r, segments, u }) {
    const P = [
        [0, 0],
        [W, A],
    ];
    const f = escala(P);
    const [p0, p2] = P.map(f);
    const O = f([W / 2, A / 2]);
    const R = n2(r * f.k);
    const vora = [n2(O[0] + R), O[1]];
    return svg(
        `<rect class="fm-figura" x="${p0[0]}" y="${p2[1]}" width="${n2(p2[0] - p0[0])}" height="${n2(p0[1] - p2[1])}"/>` +
            `<circle class="fm-forat" cx="${O[0]}" cy="${O[1]}" r="${R}"/>` +
            linia(O, vora, 'fm-diagonal') +
            `<circle class="fm-punt" cx="${O[0]}" cy="${O[1]}" r="3"/>` +
            etiqueta('ample', segments, p0, [p2[0], p0[1]], O, u) +
            etiqueta('alt', segments, p0, [p0[0], p2[1]], O, u) +
            etiqueta('radi', segments, O, vora, [O[0], O[1] + 40], u),
        'Figura composta: un rectangle amb un forat rodó'
    );
}

/** Porta: un rectangle W × A amb un semicercle de diàmetre W a sobre. */
export function svgPorta({ W, A, segments, u }) {
    const r = W / 2;
    const f = escala([
        [0, 0],
        [W, A + r],
    ]);
    const [p0, p1, p2, p4] = [f([0, 0]), f([W, 0]), f([W, A]), f([0, A])];
    const R = n2(r * f.k);
    return svg(
        `<path class="fm-figura" d="M ${p0.join(' ')} L ${p1.join(' ')} L ${p2.join(' ')} A ${R} ${R} 0 0 0 ${p4.join(' ')} Z"/>` +
            linia(p4, p2, 'fm-divisio') +
            etiqueta('ample', segments, p0, p1, f([W / 2, A / 2]), u) +
            etiqueta('alt', segments, p0, p4, f([W / 2, A / 2]), u),
        'Figura composta: un rectangle i un semicercle'
    );
}

/** Forma de L: un rectangle W × H al qual falta, dalt a la dreta, un rectangle w × h. */
export function svgL({ W, H, w, h, segments, u }) {
    const P = [
        [0, 0],
        [W, 0],
        [W, H - h],
        [W - w, H - h],
        [W - w, H],
        [0, H],
    ];
    const f = escala([...P, [W, H]]);
    const Q = P.map(f);
    const R = f([W, H]); // el cantó del tros que falta
    const centre = f([(W - w) / 2, (H - h) / 2]);
    return svg(
        poligon(Q) +
            poligon([Q[3], Q[2], R, Q[4]], 'fm-falta') +
            etiqueta('ample', segments, Q[0], Q[1], centre, u) +
            etiqueta('alt', segments, Q[0], Q[5], centre, u) +
            etiqueta('falta-ample', segments, Q[4], R, centre, u) +
            etiqueta('falta-alt', segments, Q[2], R, centre, u),
        'Figura composta: un rectangle al qual falta un tros'
    );
}

// ── COSSOS (perspectiva cavallera: la profunditat va en diagonal, a la meitat) ──

const PROF = [0.5, 0.35]; // el vector de profunditat, per unitat

/** Ortoedre a (ample) × b (fons) × c (alt). */
export function svgOrtoedre({ a, b, c, segments, u }) {
    const [px, py] = [PROF[0] * b, PROF[1] * b];
    const P = {
        A: [0, 0],
        B: [a, 0],
        C: [a, c],
        D: [0, c],
        E: [px, py],
        F: [a + px, py],
        G: [a + px, c + py],
        H: [px, c + py],
    };
    const f = escala(Object.values(P));
    const Q = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, f(p)]));
    const centre = f([a / 2, c / 2]);
    return svg(
        linia(Q.A, Q.E, 'fm-amagada') +
            linia(Q.E, Q.F, 'fm-amagada') +
            linia(Q.E, Q.H, 'fm-amagada') +
            poligon([Q.A, Q.B, Q.C, Q.D]) +
            poligon([Q.B, Q.F, Q.G, Q.C], 'fm-figura fm-costat') +
            poligon([Q.D, Q.C, Q.G, Q.H], 'fm-figura fm-dalt') +
            etiqueta('ample', segments, Q.A, Q.B, centre, u) +
            etiqueta('fons', segments, Q.B, Q.F, centre, u) +
            etiqueta('alt', segments, Q.A, Q.D, centre, u),
        'Ortoedre'
    );
}

/** El·lipse d'una base circular de radi r, centrada a c (en píxels), aplanada. */
const el = (c, rx, ry, classe = 'fm-figura') =>
    `<ellipse class="${classe}" cx="${c[0]}" cy="${c[1]}" rx="${rx}" ry="${ry}"/>`;

/** Cilindre de radi r i altura h. */
export function svgCilindre({ r, h, segments, u }) {
    const f = escala([
        [-r, -r * 0.35],
        [r, h + r * 0.35],
    ]);
    const [Ob, Ot] = [f([0, 0]), f([0, h])];
    const [rx, ry] = [n2(r * f.k), n2(r * f.k * 0.35)];
    const [Eb, Wb, Et, Wt] = [f([-r, 0]), f([r, 0]), f([-r, h]), f([r, h])];
    return svg(
        `<path class="fm-figura" d="M ${Eb.join(' ')} L ${Et.join(' ')} A ${rx} ${ry} 0 0 0 ${Wt.join(' ')} L ${Wb.join(' ')} A ${rx} ${ry} 0 0 1 ${Eb.join(' ')} Z"/>` +
            `<path class="fm-amagada" d="M ${Eb.join(' ')} A ${rx} ${ry} 0 0 1 ${Wb.join(' ')}"/>` +
            el(Ot, rx, ry, 'fm-figura fm-dalt') +
            linia(Ob, Wb, 'fm-diagonal') +
            `<circle class="fm-punt" cx="${Ob[0]}" cy="${Ob[1]}" r="3"/>` +
            etiqueta('radi', segments, Ob, Wb, [Ob[0], Ob[1] + 40], u) +
            etiqueta('alt', segments, Wb, Wt, Ob, u),
        'Cilindre'
    );
}

/** Piràmide de base quadrada (costat b), altura h i apotema ap (l'altura d'una cara). */
export function svgPiramide({ b, h, segments, u }) {
    const [px, py] = [PROF[0] * b, PROF[1] * b];
    const P = {
        A: [0, 0],
        B: [b, 0],
        C: [b + px, py],
        D: [px, py],
        V: [b / 2 + px / 2, h + py / 2],
    };
    const f = escala(Object.values(P));
    const Q = Object.fromEntries(Object.entries(P).map(([k, p]) => [k, f(p)]));
    const O = f([b / 2 + px / 2, py / 2]);
    const M = f([b / 2, 0]); // el punt mig de l'aresta de davant: l'apotema hi baixa
    return svg(
        linia(Q.A, Q.D, 'fm-amagada') +
            linia(Q.D, Q.C, 'fm-amagada') +
            linia(Q.D, Q.V, 'fm-amagada') +
            poligon([Q.A, Q.B, Q.V]) +
            poligon([Q.B, Q.C, Q.V], 'fm-figura fm-costat') +
            linia(Q.V, O, 'fm-altura') +
            angleRecte(O, Q.V, [Q.B[0] - Q.A[0], 0]) +
            linia(Q.V, M, 'fm-apotema') +
            etiqueta('base', segments, Q.A, Q.B, Q.V, u) +
            etiqueta('altura', segments, O, Q.V, Q.A, u) + // l'altura, a la dreta; l'apotema, a l'esquerra
            etiqueta('apotema', segments, M, Q.V, Q.C, u),
        'Piràmide quadrangular'
    );
}

/** Con de radi r, altura h i generatriu g. */
export function svgCon({ r, h, segments, u }) {
    const f = escala([
        [-r, -r * 0.35],
        [r, h],
    ]);
    const [O, V] = [f([0, 0]), f([0, h])];
    const [rx, ry] = [n2(r * f.k), n2(r * f.k * 0.35)];
    const [E, W] = [f([-r, 0]), f([r, 0])];
    return svg(
        `<path class="fm-figura" d="M ${E.join(' ')} L ${V.join(' ')} L ${W.join(' ')} A ${rx} ${ry} 0 0 1 ${E.join(' ')} Z"/>` +
            `<path class="fm-amagada" d="M ${E.join(' ')} A ${rx} ${ry} 0 0 1 ${W.join(' ')}"/>` +
            linia(V, O, 'fm-altura') +
            linia(O, W, 'fm-diagonal') +
            angleRecte(O, V, [W[0] - O[0], 0]) +
            etiqueta('radi', segments, O, W, [O[0], O[1] + 40], u) +
            etiqueta('altura', segments, O, V, W, u) + // l'altura, a l'esquerra; la generatriu, a fora
            etiqueta('generatriu', segments, W, V, O, u),
        'Con'
    );
}

/** Esfera de radi r. */
export function svgEsfera({ r, segments, u }) {
    const f = escala([
        [-r, -r],
        [r, r],
    ]);
    const O = f([0, 0]);
    const R = n2(r * f.k);
    const W = f([r, 0]);
    return svg(
        `<circle class="fm-figura" cx="${O[0]}" cy="${O[1]}" r="${R}"/>` +
            el(O, R, n2(R * 0.3), 'fm-amagada') +
            linia(O, W, 'fm-diagonal') +
            `<circle class="fm-punt" cx="${O[0]}" cy="${O[1]}" r="3"/>` +
            etiqueta('radi', segments, O, W, [O[0], O[1] + 40], u),
        'Esfera'
    );
}
