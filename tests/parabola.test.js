/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/parabola.test.js
 * ROL: Tests de «La paràbola» (js/parabola/) i de les paràboles de la quadrícula
 *      comuna (js/passos/quadricula.js).
 * ARQUITECTURA:
 * - Es generen milers de preguntes de cada tipus i nivell. Les solucions es
 *   comproven aquí: el vèrtex i els talls substituint-los a y = ax² + bx + c, i el
 *   nombre de talls amb el signe del discriminant.
 * - La resposta bona s'accepta; cada error de la taxonomia es provoca a mà (els de
 *   la fórmula són d'«Equacions de 2n grau» i ja tenen els seus tests).
 * ÚS: node tests/parabola.test.js
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
        'js/passos/quadricula.js',
        'js/passos/textos.js',
        'js/equacions-segon-grau/strings.js',
        'js/equacions-segon-grau/math-engine.js',
        'js/equacions-segon-grau/errors.js',
        'js/parabola/strings.js',
        'js/parabola/math-engine.js',
        'js/parabola/errors.js',
    ],
    { seed: 2026 }
);
const { ERRORS_PA, TIPUS_PA } = w;
const PER_COMBINACIO = 700;
const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/;

function respostaBona(pas) {
    const r = {};
    for (const [camp, tipus] of Object.entries(pas.camps)) {
        const s = pas.solucio[camp];
        if (tipus === 'tria') r[camp] = s;
        else if (tipus === 'punts') r[camp] = [...s.punts].reverse();
        else if (tipus === 'racional') {
            const [n, d] = Array.isArray(s) ? s : [s, 1];
            r[camp] = { n: String(n), d: d === 1 ? '' : String(d) };
        } else if (tipus === 'coeficient') r[camp] = s === 0 ? '' : String(s);
        else r[camp] = String(s);
    }
    return r;
}

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Paràboles de la quadrícula');
{
    const p = w.parabolaPerTresPunts([
        [0, 3],
        [1, 0],
        [3, 0],
    ]);
    ok(
        'la paràbola per (0, 3), (1, 0) i (3, 0) és x² − 4x + 3',
        Math.abs(p.a - 1) + Math.abs(p.b + 4) + Math.abs(p.c - 3) < 1e-9,
        JSON.stringify(p)
    );
    eq(
        'tres punts amb x repetides → null',
        w.parabolaPerTresPunts([
            [1, 1],
            [1, 2],
            [3, 0],
        ]),
        null
    );
    const svg = w.svgQuadricula({ limit: 8, paraboles: [{ a: 1, b: 0, c: -4 }] });
    ok('la paràbola es dibuixa com un camí', /class="jp-q-recta jp-q-corba" d="M[\d.]+ [\d.]+L/.test(svg));
    ok(
        'una paràbola fora de la quadrícula no es dibuixa',
        !/jp-q-corba/.test(w.svgQuadricula({ paraboles: [{ a: 1, b: 0, c: 50 }] }))
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Preguntes generades');
{
    for (const tipus of ['dibuixar', 'llegir']) {
        for (const nivell of [1, 2, 3]) {
            const errors = [];
            const vistes = new Set();
            const talls = new Set();
            for (let i = 0; i < PER_COMBINACIO && errors.length < 3; i++) {
                const q = w.generaPreguntaPA(tipus, nivell);
                const err = msg => errors.push(`${q.text} ${q.clau}: ${msg}`);
                vistes.add(q.clau);
                const [a, b, c] = q.clau.slice(1).split(',').map(Number);
                const f = x => a * x * x + b * x + c;
                const delta = b * b - 4 * a * c;
                if (BAD.test(q.text) || q.passos.some(p => BAD.test(p.linia) || !p.enunciat)) err('escriptura');
                if (nivell === 1 && Math.abs(a) !== 1) err('al nivell 1, a = ±1');
                for (const p of q.passos) {
                    const r = w.corregeixPas(p, respostaBona(p));
                    if (r.estat !== 'ok') err(`${p.id}: la resposta bona dona ${r.estat}`);
                }
                const sol = id => (q.passos.find(p => p.id === id) || {}).solucio;
                if (tipus === 'dibuixar') {
                    const { xv, yv } = sol('vertex');
                    if (xv !== -b / (2 * a) || yv !== f(xv)) err('vèrtex');
                    if (sol('tallY').c !== c) err("tall amb l'eix Y");
                    const punts = sol('punts').p.punts;
                    if (punts.some(([x, y]) => f(x) !== y || Math.abs(x) > 7 || Math.abs(y) > 7)) err('punts notables');
                    const quants = delta > 0 ? 2 : delta === 0 ? 1 : 0;
                    talls.add(quants);
                    if (
                        punts.filter(([, y]) => y === 0).length !==
                            quants + (c === 0 && xv !== 0 && quants === 0 ? 1 : 0) &&
                        !(c === 0)
                    )
                        err('talls amb X');
                    if (sol('nombre').tria !== quants) err('nombre de talls');
                    if (!w.svgQuadricula({ limit: 8, paraboles: [{ a, b, c }] }).includes('jp-q-corba'))
                        err('es dibuixa');
                } else {
                    const { x1, x2 } = sol('tallsX');
                    if (f(x1) !== 0 || f(x2) !== 0 || x1 === 0 || x2 === 0) err('talls');
                    if (sol('a').a !== a) err('a');
                    if (!/jp-q-corba/.test(q.svg)) err('falta la paràbola');
                }
            }
            const extra = tipus === 'dibuixar' ? `; talls: ${[...talls].sort().join(', ')}` : '';
            ok(
                `${tipus}, nivell ${nivell}: ${PER_COMBINACIO} preguntes (${vistes.size} de diferents${extra})`,
                !errors.length && vistes.size >= 12, // (amb a = ±1 i els punts dins de la quadrícula, n'hi ha poques)

                errors.join(' | ')
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Diagnòstic: cada error típic, a mà');
{
    const provocats = new Set();
    function prova(titol, tipus, nivell, id, condicio, canvi, esperat) {
        let q;
        const triaPas = qq => qq.passos.find(p => p.id === id);
        for (let i = 0; i < 5000 && !(q && triaPas(q) && condicio(triaPas(q), q)); i++)
            q = w.generaPreguntaPA(tipus, nivell);
        const pas = triaPas(q);
        const resp = { ...respostaBona(pas), ...(typeof canvi === 'function' ? canvi(pas) : canvi) };
        const r = w.corregeixPas(pas, resp);
        const d = r.estat === 'error' ? w.diagnosticaPA(pas, r.valors) : null;
        if (d && ERRORS_PA[d.errorType]) provocats.add(d.errorType);
        eq(`${titol} (${q.text} ${q.clau})`, d ? d.errorType : `(${r.estat}, sense diagnòstic)`, esperat);
    }
    const amb = (camp, e) => p => ((p.dades.distractors || {})[camp] || []).some(([, x]) => x === e);
    const valorDe = (camp, e) => p => ({ [camp]: String(p.dades.distractors[camp].find(([, x]) => x === e)[0]) });
    prova(
        'obre cap avall en lloc de cap amunt',
        'dibuixar',
        1,
        'obertura',
        p => p.solucio.tria === 'amunt',
        { tria: 'avall' },
        'OBERTURA'
    );
    prova(
        'x_v = b/(2a)',
        'dibuixar',
        2,
        'vertex',
        amb('xv', 'VERTEX_SIGNE'),
        valorDe('xv', 'VERTEX_SIGNE'),
        'VERTEX_SIGNE'
    );
    prova('x_v = −b/a', 'dibuixar', 2, 'vertex', amb('xv', 'VERTEX_2A'), valorDe('xv', 'VERTEX_2A'), 'VERTEX_2A');
    prova(
        'y_v = c',
        'dibuixar',
        2,
        'vertex',
        amb('yv', 'VERTEX_TALL_Y'),
        valorDe('yv', 'VERTEX_TALL_Y'),
        'VERTEX_TALL_Y'
    );
    prova('y_v = f(−x_v)', 'dibuixar', 2, 'vertex', amb('yv', 'VERTEX_Y'), valorDe('yv', 'VERTEX_Y'), 'VERTEX_Y');
    prova(
        'tall amb Y = y_v',
        'dibuixar',
        2,
        'tallY',
        amb('c', 'TALL_Y_VERTEX'),
        valorDe('c', 'TALL_Y_VERTEX'),
        'TALL_Y_VERTEX'
    );
    prova(
        'punts girats',
        'dibuixar',
        2,
        'punts',
        p => p.dades.punts.every(([x, y]) => x !== y) && p.dades.punts.every(([x, y]) => Math.abs(y) <= 8),
        p => ({ p: p.dades.punts.map(([x, y]) => [y, x]) }),
        'PUNTS_GIRATS'
    );
    prova(
        'talls amb X quan no n’hi ha',
        'dibuixar',
        3,
        'punts',
        p => !p.dades.punts.some(([, y]) => y === 0) && p.dades.punts.length >= 2,
        p => ({ p: [...p.dades.punts.slice(0, -1), [7, 0]] }),
        'PUNTS_X_SENSE_TALL'
    );
    prova(
        'talls amb el signe canviat',
        'llegir',
        1,
        'tallsX',
        p => p.solucio.x1 !== -p.solucio.x2,
        p => ({ x1: String(-p.solucio.x1), x2: String(-p.solucio.x2) }),
        'TALLS_SIGNE'
    );
    prova('a amb el signe canviat', 'llegir', 2, 'a', amb('a', 'A_SIGNE'), valorDe('a', 'A_SIGNE'), 'A_SIGNE');
    prova('a = c', 'llegir', 1, 'a', amb('a', 'A_SENSE_DIVIDIR'), valorDe('a', 'A_SENSE_DIVIDIR'), 'A_SENSE_DIVIDIR');
    prova(
        'b amb el signe canviat',
        'llegir',
        2,
        'expressio',
        amb('x1', 'EXPR_SIGNES'),
        valorDe('x1', 'EXPR_SIGNES'),
        'EXPR_SIGNES'
    );
    prova(
        'el discriminant (pas d’Equacions de 2n grau)',
        'dibuixar',
        1,
        'discriminant',
        p => p.dades.b < 0,
        p => ({ delta: String(-p.dades.b * p.dades.b - 4 * p.dades.a * p.dades.c) }),
        'DISC_B2_NEGATIU'
    );
    const sense = Object.keys(ERRORS_PA).filter(k => !provocats.has(k));
    ok(
        `els ${Object.keys(ERRORS_PA).length} errors de la taxonomia tenen una prova`,
        !sense.length,
        `sense prova: ${sense}`
    );
    ok('el diagnòstic no peta amb dades absurdes', w.diagnosticaPA({ mena: 'punts', dades: {} }, null) === null);
}

// ─────────────────────────────────────────────────────────────────────────────
suite("4. Tipus i generador d'enllaços");
{
    eq(
        '«tots»: primer dibuixar i després llegir',
        Array.from({ length: 4 }, (_, i) => w.tipusPA('', i, 4)).join(),
        'dibuixar,dibuixar,llegir,llegir'
    );
    const dades = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    const { OPCIONS_ACTIVITAT, ACTIVITIES_ESO } = vm.runInNewContext(
        `${dades}\n({ OPCIONS_ACTIVITAT, ACTIVITIES_ESO });`
    );
    const opcio = (OPCIONS_ACTIVITAT['parabola.html'] || []).find(o => o.param === 'tipus');
    eq(
        'index.html: «tipus» amb les opcions de TIPUS_PA',
        opcio
            ? opcio.valors
                  .map(([v]) => v)
                  .sort()
                  .join()
            : '',
        Object.keys(TIPUS_PA).sort().join()
    );
    const entrada = ACTIVITIES_ESO.find(a => a.file === 'parabola.html');
    ok(
        "és al menú d'ESO, amb nivells i sessions fixes",
        !!entrada && entrada.difficulty === true && entrada.fixed === true
    );
    const controlador = fs.readFileSync(path.join(ROOT, 'js/parabola/parabola.js'), 'utf8');
    ok(
        'el controlador genera les preguntes a generaPregunta (dins de buildLevel)',
        /generaPregunta\([^)]*\) \{[\s\S]*?generaPreguntaPA\(/.test(controlador)
    );
}

finish('TESTS DE LA PARÀBOLA');
