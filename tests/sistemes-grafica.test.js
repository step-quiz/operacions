/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/sistemes-grafica.test.js
 * ROL: Tests del botó «Mira-ho a la gràfica» de Sistemes d'equacions
 *      (js/sistemes-equacions/grafica.js) sobre la quadrícula comuna.
 * ARQUITECTURA:
 * - Milers de sistemes amb solució entera (com els de l'activitat, i també amb
 *   una equació sense x o sense y): les dues rectes dibuixades es tornen a llegir
 *   de l'SVG (de píxels a coordenades) i cada extrem ha de complir la seva
 *   equació; el punt de tall ha de ser a sobre de tots dos trossos i el cercle,
 *   al seu lloc, amb l'etiqueta bona.
 * - Comprova també que l'activitat crida el botó en acabar cada sistema (abans de
 *   la franja «Següent») i que la pàgina enllaça css/quadricula.css.
 * ÚS: node tests/sistemes-grafica.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');

const w = loadModule(['js/passos/quadricula.js', 'js/sistemes-equacions/grafica.js'], { seed: 2026 });
const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/;

// De l'SVG a coordenades (el mateix canvi que fa svgQuadricula, a l'inrevés)
function llegeixSvg(svg) {
    const L = Number(svg.match(/data-limit="([\d.]+)"/)[1]);
    const u = Number(svg.match(/data-u="([\d.]+)"/)[1]);
    const M = Number(svg.match(/data-marge="([\d.]+)"/)[1]);
    const cx = px => px / u - L - M;
    const cy = py => L + M - py / u;
    const rectes = [
        ...svg.matchAll(/<line class="jp-q-recta([^"]*)" x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/g),
    ].map(m => ({ classe: m[1].trim(), p: [cx(+m[2]), cy(+m[3])], q: [cx(+m[4]), cy(+m[5])] }));
    const punts = [...svg.matchAll(/<circle class="jp-q-punt[^"]*" cx="([-\d.]+)" cy="([-\d.]+)"/g)].map(m => [
        cx(+m[1]),
        cy(+m[2]),
    ]);
    const etiquetes = [...svg.matchAll(/<text class="jp-q-etiqueta"[^>]*>([^<]*)</g)].map(m => m[1]);
    // Tros horitzontal que ocupa cada etiqueta (14 px en negreta: uns 8,5 px per caràcter), en píxels
    const S = Number(svg.match(/viewBox="0 0 ([\d.]+)/)[1]);
    const trossos = [
        ...svg.matchAll(/<text class="jp-q-etiqueta" x="([-\d.]+)" y="([-\d.]+)"( text-anchor="end")?>([^<]*)</g),
    ].map(m => {
        const [x, ample] = [Number(m[1]), 8.5 * m[4].length];
        return { de: m[3] ? x - ample : x, a: m[3] ? x : x + ample, y: Number(m[2]) };
    });
    return { rectes, punts, etiquetes, trossos, S, L };
}
const distSegment = ([x, y], [x1, y1], [x2, y2]) => {
    const [dx, dy] = [x2 - x1, y2 - y1];
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
};

// ─────────────────────────────────────────────────────────────────────────────
suite('1. De l’equació a la recta');
{
    eq(
        '2x + 4y = 6 → y = −x/2 + 3/2',
        JSON.stringify(w.rectaDeEquacio(2, 4, 6)),
        JSON.stringify({ m: [-2, 4], n: [6, 4] })
    );
    eq(
        '3x = 6 (sense y) → la vertical x = 2',
        JSON.stringify(w.rectaDeEquacio(3, 0, 6)),
        JSON.stringify({
            per: [
                [2, 0],
                [2, 1],
            ],
        })
    );
    eq('el punt es diu amb el signe menys tipogràfic', w.textPunt(-2, 3), '(−2, 3)');
    eq('i amb dos negatius', w.textPunt(-4, -1), '(−4, −1)');
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Milers de sistemes: rectes, punt de tall i etiqueta');
{
    const nz = (a, b) => {
        let v = 0;
        while (v === 0) v = a + Math.floor(Math.random() * (b - a + 1));
        return v;
    };
    const any = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    let n = 0;
    const malament = [];
    let verticals = 0,
        horitzontals = 0;
    for (let i = 0; i < 6000; i++) {
        const [x0, y0] = [nz(-5, 5), nz(-5, 5)];
        // Com a l'activitat (coeficients de −4 a 4, no nuls) i, una vegada de cada cinc, amb algun zero
        const coef = () => (i % 5 === 0 ? any(-4, 4) : nz(-4, 4));
        const [a1, b1, a2, b2] = [coef(), coef(), coef(), coef()];
        if ((a1 === 0 && b1 === 0) || (a2 === 0 && b2 === 0) || a1 * b2 - a2 * b1 === 0) continue;
        const p = { a1, b1, c1: a1 * x0 + b1 * y0, a2, b2, c2: a2 * x0 + b2 * y0, x0, y0 };
        if (b1 === 0 || b2 === 0) verticals++;
        if (a1 === 0 || a2 === 0) horitzontals++;
        n++;
        const svg = w.svgSistema(p);
        const { rectes, punts, etiquetes, trossos, S } = llegeixSvg(svg);
        const on = `{${a1}x + ${b1}y = ${p.c1}, ${a2}x + ${b2}y = ${p.c2}} → (${x0}, ${y0})`;
        if (BAD.test(svg)) malament.push(`${on}: hi ha undefined/NaN a l'SVG`);
        if (rectes.length !== 2) {
            malament.push(`${on}: ${rectes.length} rectes`);
            continue;
        }
        if (rectes[0].classe !== '' || rectes[1].classe !== 'jp-q-segona')
            malament.push(`${on}: classes ${rectes.map(r => r.classe || '—').join(', ')}`);
        const eqs = [
            [a1, b1, p.c1],
            [a2, b2, p.c2],
        ];
        rectes.forEach((r, k) => {
            const [a, b, c] = eqs[k];
            for (const [x, y] of [r.p, r.q]) {
                if (Math.abs(a * x + b * y - c) > 0.05)
                    malament.push(`${on}: un extrem de la recta ${k + 1} no la compleix`);
            }
            if (Math.hypot(r.q[0] - r.p[0], r.q[1] - r.p[1]) < 2)
                malament.push(`${on}: la recta ${k + 1} és massa curta`);
            if (distSegment([x0, y0], r.p, r.q) > 0.02)
                malament.push(`${on}: el punt de tall no és sobre la recta ${k + 1}`);
        });
        if (punts.length !== 1 || Math.hypot(punts[0][0] - x0, punts[0][1] - y0) > 0.01)
            malament.push(`${on}: el cercle no és al punt de tall`);
        if (etiquetes[0] !== w.textPunt(x0, y0)) malament.push(`${on}: etiqueta «${etiquetes[0]}»`);
        const t = trossos[0];
        if (!t || t.de < 0 || t.a > S || t.y < 12 || t.y > S) malament.push(`${on}: l'etiqueta surt de la quadrícula`);
    }
    ok(
        `${n} sistemes: dues rectes que compleixen la seva equació, es tallen al punt de la solució i l'etiqueta hi cap`,
        !malament.length && n > 4000,
        malament.slice(0, 8).join('\n      → ')
    );
    ok(
        `n'hi ha amb una equació sense y (${verticals}) i sense x (${horitzontals})`,
        verticals > 50 && horitzontals > 50
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. L’activitat crida el botó');
{
    const ctrl = fs.readFileSync(path.join(ROOT, 'js/sistemes-equacions/sistemes-equacions.js'), 'utf8');
    ok(
        'sistemes-equacions.js importa posaBotoGrafica de ./grafica.js',
        /import \{ posaBotoGrafica \} from '\.\/grafica\.js';/.test(ctrl)
    );
    ok(
        'en acabar un sistema (també amb els intents esgotats, després de la solució), el botó surt abans de la franja «Següent»',
        /if \(pts === 0\) showCorrectAnswer\(currentProblem\);\s*posaBotoGrafica\(currentProblem, els\.expressionBox\);[^\n]*\n\s*acabaPregunta\(/.test(
            ctrl
        )
    );
    const html = fs.readFileSync(path.join(ROOT, 'sistemes-equacions.html'), 'utf8');
    ok('sistemes-equacions.html enllaça css/quadricula.css', /href="css\/quadricula\.css"/.test(html));
    for (const p of ['recta.html', 'parabola.html'])
        ok(
            `${p} enllaça css/quadricula.css`,
            /href="css\/quadricula\.css"/.test(fs.readFileSync(path.join(ROOT, p), 'utf8'))
        );
}

finish('MIRA-HO A LA GRÀFICA (SISTEMES)');
