/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: js/passos/quadricula.js
 * ROL: La quadrícula comuna: uns eixos cartesians amb rectes, punts i triangles de
 *      pendent. La fa servir el joc de passos (js/passos/joc-passos.js) per mostrar
 *      gràfiques i per al camp 'punts', on l'alumne situa punts tocant la quadrícula.
 * ARQUITECTURA: mòdul pur: torna el codi SVG com a text (cap DOM). L'SVG porta
 *      data-limit, data-u i data-marge perquè el joc pugui passar d'un clic a les
 *      coordenades del punt més proper.
 *
 *   svgQuadricula({ limit, rectes, punts, triangles, interactiva })
 *     limit      els eixos van de −limit a limit
 *     rectes     [{ m, n } (y = mx + n; m i n enters o fraccions [a, b]) | { per: [[x1, y1], [x2, y2]] }]
 *     paraboles  [{ a, b, c }] (y = ax² + bx + c)
 *     punts      [{ x, y, etiqueta?, classe? }]
 *     triangles  [{ x, y, dx, dy }]: el triangle del pendent, des de (x, y): avança dx i puja dy
 *
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const num = v => (Array.isArray(v) ? v[0] / v[1] : v);
const r1 = x => Math.round(x * 10) / 10;

/** El tros d'una recta (punt i direcció) que queda dins del quadrat [−a, a]², o null. */
function retallaRecta([px, py], [dx, dy], a) {
    let [t0, t1] = [-Infinity, Infinity];
    for (const [p, d] of [
        [px, dx],
        [py, dy],
    ]) {
        if (d === 0) {
            if (p < -a || p > a) return null;
            continue;
        }
        const [ta, tb] = [(-a - p) / d, (a - p) / d].sort((u, v) => u - v);
        [t0, t1] = [Math.max(t0, ta), Math.min(t1, tb)];
    }
    if (t0 >= t1) return null;
    return [
        [px + t0 * dx, py + t0 * dy],
        [px + t1 * dx, py + t1 * dy],
    ];
}

/** La paràbola que passa per tres punts de x diferents (Lagrange): { a, b, c }, o null. */
export function parabolaPerTresPunts([[x1, y1], [x2, y2], [x3, y3]]) {
    if (x1 === x2 || x1 === x3 || x2 === x3) return null;
    const [d1, d2, d3] = [(x1 - x2) * (x1 - x3), (x2 - x1) * (x2 - x3), (x3 - x1) * (x3 - x2)];
    const a = y1 / d1 + y2 / d2 + y3 / d3;
    const b = -(y1 * (x2 + x3)) / d1 - (y2 * (x1 + x3)) / d2 - (y3 * (x1 + x2)) / d3;
    const c = (y1 * x2 * x3) / d1 + (y2 * x1 * x3) / d2 + (y3 * x1 * x2) / d3;
    return { a, b, c };
}

export function svgQuadricula({
    limit = 6,
    rectes = [],
    paraboles = [],
    punts = [],
    triangles = [],
    interactiva = false,
    u = 26,
} = {}) {
    const [L, M] = [limit, 0.7];
    const S = r1((2 * L + 2 * M) * u);
    const sx = x => r1((x + L + M) * u);
    const sy = y => r1((L + M - y) * u);
    const salt = L > 8 ? 2 : 1;
    let s = `<svg class="jp-q" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" data-limit="${L}" data-u="${u}" data-marge="${M}" role="img" aria-label="quadrícula">`;
    for (let i = -L; i <= L; i++) {
        s += `<line class="jp-q-linia" x1="${sx(i)}" y1="${sy(-L)}" x2="${sx(i)}" y2="${sy(L)}"/>`;
        s += `<line class="jp-q-linia" x1="${sx(-L)}" y1="${sy(i)}" x2="${sx(L)}" y2="${sy(i)}"/>`;
    }
    s += `<line class="jp-q-eix" x1="${sx(-L - M)}" y1="${sy(0)}" x2="${sx(L + M)}" y2="${sy(0)}"/>`;
    s += `<line class="jp-q-eix" x1="${sx(0)}" y1="${sy(-L - M)}" x2="${sx(0)}" y2="${sy(L + M)}"/>`;
    for (let i = -L; i <= L; i += salt) {
        if (i === 0) continue;
        s += `<text class="jp-q-num" x="${sx(i)}" y="${r1(sy(0) + 0.55 * u)}" text-anchor="middle">${i}</text>`;
        s += `<text class="jp-q-num" x="${r1(sx(0) - 0.25 * u)}" y="${r1(sy(i) + 0.17 * u)}" text-anchor="end">${i}</text>`;
    }
    s += `<text class="jp-q-nom" x="${r1(sx(L + M) - 0.15 * u)}" y="${r1(sy(0) - 0.25 * u)}" text-anchor="end">X</text>`;
    s += `<text class="jp-q-nom" x="${r1(sx(0) + 0.25 * u)}" y="${r1(sy(L + M) + 0.55 * u)}">Y</text>`;
    for (const recta of rectes) {
        const tros = recta.per
            ? retallaRecta(recta.per[0], [recta.per[1][0] - recta.per[0][0], recta.per[1][1] - recta.per[0][1]], L + M)
            : retallaRecta([0, num(recta.n)], [1, num(recta.m)], L + M);
        if (!tros) continue;
        const [[x1, y1], [x2, y2]] = tros;
        s += `<line class="jp-q-recta${recta.classe ? ` ${recta.classe}` : ''}" x1="${sx(x1)}" y1="${sy(y1)}" x2="${sx(x2)}" y2="${sy(y2)}"/>`;
    }
    for (const p of paraboles) {
        // Mostrejada de 0,05 en 0,05; només els trossos que queden dins de la quadrícula
        const [a, b, c] = [num(p.a), num(p.b), num(p.c)];
        let d = '';
        let dins = false;
        for (let x = -L - M; x <= L + M + 1e-9; x += 0.05) {
            const y = a * x * x + b * x + c;
            if (Math.abs(y) > L + M) {
                dins = false;
                continue;
            }
            d += `${dins ? 'L' : 'M'}${r1(sx(x))} ${r1(sy(y))}`;
            dins = true;
        }
        if (d) s += `<path class="jp-q-recta jp-q-corba${p.classe ? ` ${p.classe}` : ''}" d="${d}"/>`;
    }
    for (const { x, y, dx, dy } of triangles) {
        s += `<path class="jp-q-triangle" d="M${sx(x)} ${sy(y)}H${sx(x + dx)}V${sy(y + dy)}"/>`;
        s += `<text class="jp-q-mida" x="${sx(x + dx / 2)}" y="${r1(sy(y) + (dy >= 0 ? 0.6 : -0.3) * u)}" text-anchor="middle">${dx}</text>`;
        s += `<text class="jp-q-mida" x="${r1(sx(x + dx) + 0.2 * u)}" y="${sy(y + dy / 2)}">${dy > 0 ? '+' : ''}${dy}</text>`;
    }
    for (const p of punts) {
        s += `<circle class="jp-q-punt${p.classe ? ` ${p.classe}` : ''}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="${r1(0.2 * u)}"/>`;
        if (p.etiqueta) {
            // A dalt a la dreta del punt; a l'esquerra si a prop de la vora dreta no hi cabria, i a sota si és a dalt de tot
            const esquerra = p.x > L - 0.35 * String(p.etiqueta).length;
            const ex = r1(sx(p.x) + (esquerra ? -0.3 : 0.3) * u);
            const ey = r1(sy(p.y) + (p.y > L - 0.6 ? 0.75 : -0.3) * u);
            s += `<text class="jp-q-etiqueta" x="${ex}" y="${ey}"${esquerra ? ' text-anchor="end"' : ''}>${p.etiqueta}</text>`;
        }
    }
    if (interactiva) s += `<rect class="jp-q-fons" x="0" y="0" width="${S}" height="${S}"/>`;
    return `${s}</svg>`;
}
