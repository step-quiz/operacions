/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/identitats-notables.test.js
 * ROL: Tests d'«Identitats notables» (js/identitats-notables/) i dels coeficients
 *      fraccionaris dels mòduls comuns (js/algebra/racionals.js i polinomis.js).
 * ARQUITECTURA:
 * - Es generen milers de preguntes de cada tipus, nivell i opció (dues lletres,
 *   fraccions). Les solucions es comproven aquí avaluant en uns quants punts, amb
 *   nombres, l'expressió de partida i el resultat.
 * - A factoritzar, «no és cap identitat notable» es comprova amb el criteri de
 *   sempre: un trinomi Ax² + Bx + C és un quadrat si B² = 4AC (A, C > 0).
 * - La resposta bona (i les equivalents) s'accepta; cada error de la taxonomia es
 *   provoca amb una resposta feta a mà.
 * ÚS: node tests/identitats-notables.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');

const w = loadModule(
    [
        'js/utils.js',
        'js/algebra/racionals.js',
        'js/algebra/polinomis.js',
        'js/passos/correccio.js',
        'js/passos/textos.js',
        'js/identitats-notables/strings.js',
        'js/identitats-notables/math-engine.js',
        'js/identitats-notables/errors.js',
    ],
    { seed: 2026 }
);
const { ERRORS_IN, TIPUS_IN } = w;
const PER_COMBINACIO = 500;
const OPCIONS = [
    { dues: false, fraccions: false },
    { dues: true, fraccions: false },
    { dues: false, fraccions: true },
    { dues: true, fraccions: true },
];
const BAD_TEXT = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b|[+\-−] [+\-−]|(?<![\d^{/])1[xy]|\(\)/;
const m = (c, x = 0, y = 0) => w.monomi(c, x || y ? { x, y } : {});

// ── Nombres, independents del motor ──────────────────────────────────────────
const num = c => (Array.isArray(c) ? c[0] / c[1] : c);
const valor = (p, x, y) => p.reduce((s, t) => s + num(t.c) * x ** (t.e.x || 0) * y ** (t.e.y || 0), 0);
const PUNTS = [
    [2, 3],
    [-3, 5],
    [7, -2],
];
const quasi = (u, v) => Math.abs(u - v) < 1e-6 * (1 + Math.abs(u));
// Valor d'una identitat en un punt: (A ± B)² o (A + B)(A − B), amb A = a(x) i B = b(y)
function identitatEn(identitat, a, b, x, y) {
    const [A, B] = [valor([a], x, y), valor([b], x, y)];
    return identitat === 'suma' ? (A + B) ** 2 : identitat === 'diferencia' ? (A - B) ** 2 : (A + B) * (A - B);
}
// Resposta bona, tal com l'escriuria l'alumne
function campText(tipus, v) {
    if (tipus === 'tria') return v;
    const [n, d] = Array.isArray(v) ? v : [v, 1];
    if (tipus === 'enter') return String(n);
    if (tipus === 'coeficient') return n === 0 ? '' : String(n);
    return { n: n === 0 && tipus === 'coeficientRacional' ? '' : String(n), d: d === 1 ? '' : String(d) };
}
const resposta = (pas, sol = pas.solucio) =>
    Object.fromEntries(Object.entries(pas.camps).map(([nom, tipus]) => [nom, campText(tipus, sol[nom])]));

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Coeficients fraccionaris (racionals.js i polinomis.js)');
{
    const text = p => w.escriuPolinomi(p, { tex: false });
    eq('(1/2)x + 3', text([m([1, 2], 1), m(3)]), '(1/2)x + 3');
    eq('x²/4 en TeX', w.escriuPolinomi([m([1, 4], 2)]), '\\frac{1}{4}x^{2}');
    eq('−3/4', text([m([-3, 4])]), '−3/4');
    const quadrat = w.redueixPolinomi(
        w.desenvolupa([
            [
                [m(1, 1), m([1, 2])],
                [m(1, 1), m([1, 2])],
            ],
        ])
    );
    eq('(x + 1/2)² = x² + x + 1/4', text(quadrat), 'x² + x + 1/4');
    ok('2/4 i 1/2 són el mateix coeficient', w.polinomisIguals([m([2, 4], 1)], [m([1, 2], 1)]));
    eq('(2/3)·(3/2) = 1 (enter)', w.producteCoef([2, 3], [3, 2]), 1);
    eq(
        'les expressions amb fraccions, entre \\left( \\right)',
        w.escriuExpressio([
            [
                [m([1, 2], 1), m(1)],
                [m(1, 1), m(-1)],
            ],
        ]),
        '\\left(\\frac{1}{2}x + 1\\right)\\left(x - 1\\right)'
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Preguntes generades: resultat, passos i resposta bona');
{
    for (const opcions of OPCIONS) {
        for (const tipus of ['desenvolupar', 'factoritzar']) {
            for (const nivell of [1, 2, 3]) {
                const errors = [];
                const vistes = new Set();
                const identitats = new Set();
                for (let i = 0; i < PER_COMBINACIO && errors.length < 3; i++) {
                    const q = w.generaPreguntaIN(tipus, nivell, opcions);
                    const err = msg => errors.push(`${q.text}: ${msg}`);
                    vistes.add(q.tex);
                    identitats.add(q.identitat);
                    const [classifica, segon] = q.passos;
                    const { a, b } = classifica.dades;
                    if ([q.tex, q.text, ...q.passos.map(p => p.linia)].some(t => BAD_TEXT.test(t)))
                        err(`escriptura ${q.tex}`);
                    if (opcions.dues !== /y/.test(q.text)) err('lletres');
                    if (!opcions.fraccions && /\//.test(q.text)) err('fraccions sense demanar-les');
                    if (nivell === 1 && !w.coefsIguals(a.c, 1)) err('al nivell 1, a = x');
                    if (classifica.solucio.tria !== q.identitat) err('classificar');
                    for (const p of q.passos) {
                        const r = w.corregeixPas(p, resposta(p));
                        if (r.estat !== 'ok') err(`${p.id}: la resposta bona dona «${r.estat}»`);
                        for (const alt of p.alternatives || [])
                            if (w.corregeixPas(p, resposta(p, alt)).estat !== 'ok') err(`${p.id}: alternativa`);
                        if (r.estat === 'ok' && BAD_TEXT.test(w.textRespostaIN(p, r.valors)))
                            err(`${p.id}: text ${w.textRespostaIN(p, r.valors)}`);
                    }
                    if (tipus === 'desenvolupar') {
                        const resultat = w.polinomiDeCoeficients(segon.solucio, w.clausIN(opcions.dues));
                        if (PUNTS.some(([x, y]) => !quasi(valor(resultat, x, y), identitatEn(q.identitat, a, b, x, y))))
                            err('desenvolupament');
                        if (q.passos.length !== 2) err('passos');
                    } else if (q.identitat === 'cap') {
                        // Ni quadrat (B² = 4AC amb A, C > 0) ni diferència de quadrats (dos termes, C < 0)
                        const coef = clau => num((q.polinomi.find(t => w.clauMonomi(t.e) === clau) || { c: 0 }).c);
                        const [A, B, C] = opcions.dues ? ['x2', 'x1y1', 'y2'].map(coef) : ['x2', 'x1', 'k'].map(coef);
                        if ((C > 0 && quasi(B * B, 4 * A * C)) || (B === 0 && C < 0))
                            err('«cap» que sí que és una identitat');
                        if (q.passos.length !== 1) err('passos');
                    } else {
                        const s = segon.solucio;
                        const [p, qq] = [num(s.p), num(s.q)];
                        const y = opcions.dues ? 1 : 0;
                        const fet = (x, Y) =>
                            q.identitat === 'sxd'
                                ? (p * x + qq * (y ? Y : 1)) * (num(s.r) * x - num(s.s) * (y ? Y : 1))
                                : (p * x + (q.identitat === 'suma' ? 1 : -1) * qq * (y ? Y : 1)) ** 2;
                        if (PUNTS.some(([x, Y]) => !quasi(valor(q.polinomi, x, Y), fet(x, Y)))) err('factorització');
                    }
                }
                const etiqueta = `${tipus}, nivell ${nivell}${opcions.dues ? ', x i y' : ''}${opcions.fraccions ? ', fraccions' : ''}`;
                ok(
                    `${etiqueta}: ${PER_COMBINACIO} preguntes (${vistes.size} de diferents; ${[...identitats].sort().join(', ')})`,
                    !errors.length && vistes.size >= 20,
                    errors.join(' | ')
                );
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Correcció i diagnòstic: cada error típic, amb una resposta feta a mà');
{
    const provocats = new Set();
    const pas = (q, mena) => q.passos.find(p => p.mena === mena);
    function prova(titol, q, mena, resp, esperat) {
        const p = pas(q, mena);
        const r = w.corregeixPas(p, resp);
        const d = r.estat === 'error' ? w.diagnosticaIN(p, r.valors) : null;
        if (d) {
            provocats.add(d.errorType);
            if (!d.missatge || !d.etiqueta || BAD_TEXT.test(d.missatge))
                eq(`${titol}: missatge`, d.missatge, '(ben format)');
        }
        eq(titol, d ? d.errorType : `(${r.estat}, sense diagnòstic)`, esperat);
    }
    const D = (id, a, b, o) => w.preguntaIN('desenvolupar', id, a, b, o);
    const F = (id, a, b, o) => w.preguntaIN('factoritzar', id, a, b, o);
    const A = D('suma', m(1, 1), m(3)); //                        (x + 3)² = x² + 6x + 9
    const B = D('diferencia', m(2, 1), m(5)); //                  (2x − 5)² = 4x² − 20x + 25
    const C = D('sxd', m(3, 1), m(4)); //                         (3x + 4)(3x − 4) = 9x² − 16
    const Y = D('diferencia', m(1, 1), m(2, 0, 1), { dues: true }); // (x − 2y)² = x² − 4xy + 4y²
    prova('identitat equivocada (desenvolupar)', A, 'classifica', { tria: 'sxd' }, 'FORMA');
    prova('(x + 3)² = x² + 9', A, 'desenvolupa', { x2: '1', k: '9' }, 'SENSE_DOBLE');
    prova('(x + 3)² = x² + 3x + 9', A, 'desenvolupa', { x2: '1', x1: '3', k: '9' }, 'DOBLE_SENSE_2');
    prova('(x + 3)² = x² − 6x + 9', A, 'desenvolupa', { x2: '1', x1: '-6', k: '9' }, 'SIGNE_DOBLE');
    prova('x² en blanc', A, 'desenvolupa', { x1: '6', k: '9' }, 'COEF_U');
    prova('3² = 6', A, 'desenvolupa', { x2: '1', x1: '6', k: '6' }, 'B2_PER_2');
    prova('(2x − 5)² = 4x² − 25', B, 'desenvolupa', { x2: '4', k: '-25' }, 'SENSE_DOBLE');
    prova('(2x)² = 2x²', B, 'desenvolupa', { x2: '2', x1: '-20', k: '25' }, 'QUADRAT_COEF');
    prova('(2x − 5)² amb −25', B, 'desenvolupa', { x2: '4', x1: '-20', k: '-25' }, 'SIGNE_B2');
    prova('(3x + 4)(3x − 4) = 9x² + 16', C, 'desenvolupa', { x2: '9', k: '16' }, 'SXD_SUMA');
    prova('(3x + 4)(3x − 4) amb terme del mig', C, 'desenvolupa', { x2: '9', x1: '24', k: '-16' }, 'SXD_DOBLE');
    prova('(3x)² = 3x² a la suma per diferència', C, 'desenvolupa', { x2: '3', k: '-16' }, 'QUADRAT_COEF');
    prova('(x − 2y)² = x² + 4y²', Y, 'desenvolupa', { x2: '1', y2: '4' }, 'SENSE_DOBLE');

    const P = F('diferencia', m(2, 1), m(3)); //                  4x² − 12x + 9 = (2x − 3)²
    const S = F('sxd', m(1, 1), m(5)); //                         x² − 25 = (x + 5)(x − 5)
    prova('diferència presa per suma', P, 'classifica', { tria: 'suma' }, 'SIGNE_MIG');
    prova('quadrat pres per suma per diferència', P, 'classifica', { tria: 'sxd' }, 'TRES_TERMES');
    prova('suma per diferència presa per quadrat', S, 'classifica', { tria: 'diferencia' }, 'DOS_TERMES');
    prova('«no és cap» quan sí que ho és', P, 'classifica', { tria: 'cap' }, 'SI_QUE_ES');
    prova('(2x − 9)²', P, 'factoritza', { p: '2', q: '9' }, 'ARREL_B');
    prova('(4x − 3)²', P, 'factoritza', { p: '4', q: '3' }, 'ARREL_A');
    prova('(2x − 6)²', P, 'factoritza', { p: '2', q: '6' }, 'MEITAT_MIG');
    prova('(2x + 3)² escrit a la plantilla de la diferència', P, 'factoritza', { p: '2', q: '-3' }, 'SIGNE_DINS');
    prova('(x + 25)(x − 25)', S, 'factoritza', { p: '1', q: '25', r: '1', s: '25' }, 'ARREL_B');
    eq('(−2x + 3)² també és correcte', w.corregeixPas(pas(P, 'factoritza'), { p: '-2', q: '-3' }).estat, 'ok');
    for (const motiu of ['mig', 'signe', 'suma']) {
        let q;
        for (let i = 0; i < 500 && !(q && q.identitat === 'cap' && q.passos[0].dades.motiu === motiu); i++)
            q = w.generaPreguntaIN('factoritzar', 2);
        prova(
            `«${q.text}» (${motiu}) pres per identitat`,
            q,
            'classifica',
            { tria: motiu === 'suma' ? 'sxd' : 'suma' },
            'NO_ES'
        );
    }
    // Fraccions
    const R = D('suma', m(1, 1), m([1, 2]), { fraccions: true }); // (x + 1/2)² = x² + x + 1/4
    const f = (n, d = '') => ({ n: String(n), d: String(d) });
    eq(
        'x² + x + 1/4 amb fraccions → correcte',
        w.corregeixPas(pas(R, 'desenvolupa'), { x2: f(1), x1: f(1), k: f(1, 4) }).estat,
        'ok'
    );
    eq(
        '2/8 → avís de simplificar',
        w.corregeixPas(pas(R, 'desenvolupa'), { x2: f(1), x1: f(1), k: f(2, 8) }).codi,
        'NO_SIMPLIFICADA'
    );
    prova(
        '(x + 3/2)² = x² + 9/4',
        D('suma', m(1, 1), m([3, 2]), { fraccions: true }),
        'desenvolupa',
        { x2: f(1), x1: f(''), k: f(9, 4) },
        'SENSE_DOBLE'
    );
    const Rf = F('suma', m(1, 1), m([1, 2]), { fraccions: true }); // x² + x + 1/4 = (x + 1/2)²
    prova('(x + 1/4)²', Rf, 'factoritza', { p: f(1), q: f(1, 4) }, 'ARREL_B');

    const sense = Object.keys(ERRORS_IN).filter(k => !provocats.has(k));
    ok(
        `els ${Object.keys(ERRORS_IN).length} errors de la taxonomia tenen una prova`,
        !sense.length,
        `sense prova: ${sense}`
    );

    // Respostes equivocades a l'atzar: mai s'accepten i el diagnòstic mai peta
    const fuzz = [];
    let diagnosticades = 0;
    for (let i = 0; i < 3000 && fuzz.length < 3; i++) {
        const o = OPCIONS[i % 4];
        const q = w.generaPreguntaIN(i % 2 ? 'factoritzar' : 'desenvolupar', 1 + (i % 3), o);
        for (const p of q.passos) {
            const resp = resposta(p);
            const noms = Object.keys(p.camps);
            const nom = noms[(i >> 2) % noms.length];
            if (p.camps[nom] === 'tria') resp[nom] = p.opcions.find(([v]) => v !== p.solucio.tria)[0];
            else {
                const [n, d] = Array.isArray(p.solucio[nom]) ? p.solucio[nom] : [p.solucio[nom], 1];
                resp[nom] = campText(p.camps[nom], [n + d * (1 + (i % 3)), d]);
            }
            const r = w.corregeixPas(p, resp);
            if (r.estat !== 'error') fuzz.push(`${q.text} · ${p.id}.${nom}: ${r.estat}`);
            let d;
            try {
                d = w.diagnosticaIN(p, r.valors);
            } catch (e) {
                fuzz.push(`el diagnòstic peta: ${e.message}`);
            }
            if (d) {
                diagnosticades++;
                if (!ERRORS_IN[d.errorType] || !d.missatge || BAD_TEXT.test(d.missatge))
                    fuzz.push(`diagnòstic mal format: ${d.missatge}`);
            }
        }
    }
    ok(
        `respostes equivocades a l'atzar: cap s'accepta (${diagnosticades} amb diagnòstic)`,
        !fuzz.length,
        fuzz.join(' | ')
    );
    ok('el diagnòstic no peta amb dades absurdes', w.diagnosticaIN({ mena: 'desenvolupa' }, null) === null);
}

// ─────────────────────────────────────────────────────────────────────────────
suite("4. Tipus i generador d'enllaços");
{
    eq(
        '«totes»: primer desenvolupar i després factoritzar',
        Array.from({ length: 6 }, (_, i) => w.tipusIN('', i, 6)).join(),
        'desenvolupar,desenvolupar,desenvolupar,factoritzar,factoritzar,factoritzar'
    );
    const dades = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    const { OPCIONS_ACTIVITAT, ACTIVITIES_ESO } = vm.runInNewContext(
        `${dades}\n({ OPCIONS_ACTIVITAT, ACTIVITIES_ESO });`
    );
    const opcions = OPCIONS_ACTIVITAT['identitats-notables.html'] || [];
    const valors = param =>
        (opcions.find(o => o.param === param) || { valors: [] }).valors
            .map(([v]) => v)
            .sort()
            .join();
    eq('index.html: «tipus» amb les opcions de TIPUS_IN', valors('tipus'), Object.keys(TIPUS_IN).sort().join());
    eq('index.html: «lletres»', valors('lletres'), ',2');
    eq('index.html: «fraccions»', valors('fraccions'), ',1');
    const entrada = ACTIVITIES_ESO.find(a => a.file === 'identitats-notables.html');
    ok(
        "és al menú d'ESO, amb nivells i sessions fixes",
        !!entrada && entrada.difficulty === true && entrada.fixed === true
    );
    const controlador = fs.readFileSync(path.join(ROOT, 'js/identitats-notables/identitats-notables.js'), 'utf8');
    ok(
        'el controlador genera les preguntes a generaPregunta (dins de buildLevel)',
        /generaPregunta\([^)]*\) \{[\s\S]*?generaPreguntaIN\(/.test(controlador)
    );
}

finish("TESTS D'IDENTITATS NOTABLES");
