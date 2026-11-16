/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/recta.test.js
 * ROL: Tests de «La recta» (js/recta/), de la quadrícula comuna
 *      (js/passos/quadricula.js) i del camp 'punts' de la correcció comuna.
 * ARQUITECTURA:
 * - Es generen milers de preguntes de cada tipus i nivell. Les solucions es
 *   comproven aquí: n i m amb dos punts enters de la recta, i la recta per dos
 *   punts substituint-los a y = mx + n.
 * - La resposta bona s'accepta (a la quadrícula, qualsevol parell de punts de la
 *   recta); cada error de la taxonomia es provoca a mà.
 * ÚS: node tests/recta.test.js
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
        'js/recta/strings.js',
        'js/recta/math-engine.js',
        'js/recta/errors.js',
    ],
    { seed: 2026 }
);
const { ERRORS_RC, TIPUS_RC } = w;
const TIPUS = ['llegir', 'dibuixar', 'dosPunts', 'classificar'];
const PER_COMBINACIO = 600;
const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/;
const num = c => (Array.isArray(c) ? c[0] / c[1] : c);

function respostaBona(pas) {
    const r = {};
    for (const [camp, tipus] of Object.entries(pas.camps)) {
        const s = pas.solucio[camp];
        if (tipus === 'tria') r[camp] = s;
        else if (tipus === 'punts') r[camp] = w.puntsEntersRC(...s.recta).slice(-2);
        else if (tipus === 'racional') {
            const [n, d] = Array.isArray(s) ? s : [s, 1];
            r[camp] = { n: String(n), d: d === 1 ? '' : String(d) };
        } else r[camp] = String(s);
    }
    return r;
}

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Quadrícula i camp de punts');
{
    const svg = w.svgQuadricula({
        limit: 6,
        rectes: [{ m: [1, 2], n: 1 }],
        punts: [{ x: 2, y: 2, etiqueta: 'A' }],
        triangles: [{ x: 0, y: 1, dx: 2, dy: 1 }],
        interactiva: true,
    });
    eq('13 línies verticals i 13 horitzontals', (svg.match(/class="jp-q-linia"/g) || []).length, 26);
    ok(
        'una recta, un punt amb etiqueta, un triangle i el fons per tocar',
        [/jp-q-recta/, /jp-q-punt/, />A</, /jp-q-triangle/, /jp-q-fons/].every(r => r.test(svg))
    );
    ok(
        'una recta que no passa per la quadrícula no es dibuixa',
        !/jp-q-recta/.test(w.svgQuadricula({ rectes: [{ m: 0, n: 20 }] }))
    );
    ok(
        'una recta vertical (per dos punts) sí',
        /jp-q-recta/.test(
            w.svgQuadricula({
                rectes: [
                    {
                        per: [
                            [2, 0],
                            [2, 3],
                        ],
                    },
                ],
            })
        )
    );
    const pas = { camps: { p: 'punts' }, solucio: { p: { recta: [[1, 2], 1], quants: 2 } } };
    eq(
        'dos punts de y = x/2 + 1 → correcte',
        w.corregeixPas(pas, {
            p: [
                [0, 1],
                [4, 3],
            ],
        }).estat,
        'ok'
    );
    eq(
        'un sol punt → avís que en falten (sense restar intent)',
        w.corregeixPas(pas, { p: [[0, 1]] }).codi,
        'FALTEN_PUNTS'
    );
    eq('cap punt → incomplet', w.corregeixPas(pas, { p: [] }).estat, 'incomplet');
    eq(
        'el mateix punt dues vegades → error',
        w.corregeixPas(pas, {
            p: [
                [0, 1],
                [0, 1],
            ],
        }).estat,
        'error'
    );
    eq(
        'un punt fora de la recta → error',
        w.corregeixPas(pas, {
            p: [
                [0, 1],
                [1, 1],
            ],
        }).estat,
        'error'
    );
    const fixos = {
        camps: { p: 'punts' },
        solucio: {
            p: {
                punts: [
                    [1, 2],
                    [3, -1],
                ],
            },
        },
    };
    eq(
        'punts fixos, en un altre ordre → correcte',
        w.corregeixPas(fixos, {
            p: [
                [3, -1],
                [1, 2],
            ],
        }).estat,
        'ok'
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Preguntes generades');
{
    for (const tipus of TIPUS) {
        for (const nivell of [1, 2, 3]) {
            const errors = [];
            const vistes = new Set();
            for (let i = 0; i < PER_COMBINACIO && errors.length < 3; i++) {
                const q = w.generaPreguntaRC(tipus, nivell);
                const err = msg => errors.push(`${q.text}: ${msg}`);
                vistes.add(q.clau);
                if (
                    BAD.test(q.text) ||
                    BAD.test(q.tex) ||
                    q.passos.some(p => BAD.test(p.linia) || !p.enunciat || !p.nom)
                )
                    err('escriptura');
                if (!q.tex && !q.svg) err('ni equació ni gràfica');
                for (const p of q.passos) {
                    const r = w.corregeixPas(p, respostaBona(p));
                    if (r.estat !== 'ok') err(`${p.id}: la resposta bona dona ${r.estat}`);
                    for (const [camp, llista] of Object.entries((p.dades && p.dades.distractors) || {}))
                        for (const [valor] of llista)
                            if (
                                typeof valor === 'string'
                                    ? valor === p.solucio[camp]
                                    : w.coefsIguals(valor, p.solucio[camp])
                            )
                                err(`${p.id}: un valor equivocat és el bo`);
                }
                const sol = id => q.passos.find(p => p.id === id).solucio;
                if (tipus === 'dosPunts') {
                    const [xa, ya, xb, yb] = q.clau.slice(1).split(',').map(Number);
                    const [m, n] = [num(Object.values(sol('pendentDosPunts'))[0]), num(sol('ordenadaDosPunts').n)];
                    if (Math.abs(m * xa + n - ya) > 1e-9 || Math.abs(m * xb + n - yb) > 1e-9)
                        err('la recta no passa per A i B');
                }
                if (tipus === 'llegir') {
                    const n = sol('ordenada').n;
                    const m = num(sol('pendent').m);
                    if (!/jp-q-recta/.test(q.svg)) err('falta la recta');
                    if (nivell === 1 && !Number.isInteger(m)) err('al nivell 1, pendent enter');
                    if (w.puntsEntersRC(sol('pendent').m, n).length < 3) err('pocs punts visibles');
                }
                if (tipus === 'classificar') {
                    const [t, c] = [sol('tipus').tria, sol('creixement').tria];
                    if ((t === 'constant') !== (c === 'constant')) err('constant i creixement no lliguen');
                }
            }
            ok(
                `${tipus}, nivell ${nivell}: ${PER_COMBINACIO} preguntes (${vistes.size} de diferents)`,
                !errors.length && vistes.size >= (tipus === 'classificar' && nivell === 1 ? 10 : 20),
                errors.join(' | ')
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Diagnòstic: cada error típic, a mà');
{
    const provocats = new Set();
    function prova(titol, tipus, nivell, id, condicio, valor, esperat) {
        let q;
        const triaPas = qq => qq.passos.find(p => p.id === id);
        for (let i = 0; i < 5000 && !(q && condicio(triaPas(q), q)); i++) q = w.generaPreguntaRC(tipus, nivell);
        const pas = triaPas(q);
        const resp = respostaBona(pas);
        Object.assign(resp, typeof valor === 'function' ? valor(pas) : valor);
        const r = w.corregeixPas(pas, resp);
        const d = r.estat === 'error' ? w.diagnosticaRC(pas, r.valors) : null;
        if (d) provocats.add(d.errorType);
        eq(`${titol} (${q.text})`, d ? d.errorType : `(${r.estat}, sense diagnòstic)`, esperat);
    }
    const amb = (camp, e) => p => (p.dades.distractors[camp] || []).some(([, x]) => x === e);
    const valorDe =
        (camp, e, racional = false) =>
        p => {
            const v = p.dades.distractors[camp].find(([, x]) => x === e)[0];
            if (!racional) return { [camp]: String(v) };
            const [n, d] = Array.isArray(v) ? v : [v, 1];
            return { [camp]: { n: String(n), d: d === 1 ? '' : String(d) } };
        };
    prova("n = tall amb l'eix X", 'llegir', 1, 'ordenada', amb('n', 'N_TALL_X'), valorDe('n', 'N_TALL_X'), 'N_TALL_X');
    prova('n = m', 'llegir', 1, 'ordenada', amb('n', 'M_N'), valorDe('n', 'M_N'), 'M_N');
    prova(
        'm = Δx/Δy',
        'llegir',
        2,
        'pendent',
        amb('m', 'PENDENT_INVERS'),
        valorDe('m', 'PENDENT_INVERS', true),
        'PENDENT_INVERS'
    );
    prova(
        'signe del pendent',
        'llegir',
        2,
        'pendent',
        amb('m', 'SIGNE_PENDENT'),
        valorDe('m', 'SIGNE_PENDENT', true),
        'SIGNE_PENDENT'
    );
    prova(
        'y = m·x (sense n)',
        'dibuixar',
        1,
        'taula',
        amb('y1', 'TAULA_SENSE_N'),
        valorDe('y1', 'TAULA_SENSE_N'),
        'TAULA_SENSE_N'
    );
    prova(
        'signes de mx + n',
        'dibuixar',
        1,
        'taula',
        amb('y1', 'TAULA_SIGNE'),
        valorDe('y1', 'TAULA_SIGNE'),
        'TAULA_SIGNE'
    );
    prova(
        'coordenades girades',
        'dibuixar',
        1,
        'punts',
        p => w.coefsIguals(p.dades.m, 2) && p.dades.n === 1,
        {
            p: [
                [1, 0],
                [3, 1],
            ],
        },
        'PUNT_GIRAT'
    );
    prova(
        'punts d’una altra recta',
        'dibuixar',
        1,
        'punts',
        p => w.coefsIguals(p.dades.m, 2) && p.dades.n === 1,
        {
            p: [
                [0, 1],
                [1, -1],
            ],
        },
        'PUNTS_ALTRA'
    );
    prova(
        'resta en un altre ordre',
        'dosPunts',
        2,
        'pendentDosPunts',
        amb('m', 'RESTA_SIGNE'),
        valorDe('m', 'RESTA_SIGNE', true),
        'RESTA_SIGNE'
    );
    prova(
        'Δx/Δy amb dos punts',
        'dosPunts',
        2,
        'pendentDosPunts',
        amb('m', 'PENDENT_INVERS'),
        valorDe('m', 'PENDENT_INVERS', true),
        'PENDENT_INVERS'
    );
    prova(
        'n amb el signe canviat',
        'dosPunts',
        2,
        'ordenadaDosPunts',
        amb('n', 'N_SIGNE'),
        valorDe('n', 'N_SIGNE', true),
        'N_SIGNE'
    );
    for (const [t, e, triat] of [
        ['proporcional', 'CLASS_PROPORCIONAL', 'afi'],
        ['afi', 'CLASS_AFI', 'proporcional'],
        ['constant', 'CLASS_CONSTANT', 'afi'],
    ])
        prova(`${t} pres per ${triat}`, 'classificar', 2, 'tipus', p => p.solucio.tria === t, { tria: triat }, e);
    prova(
        'creixent pres per decreixent',
        'classificar',
        2,
        'creixement',
        p => p.solucio.tria === 'creixent',
        { tria: 'decreixent' },
        'CREIXEMENT'
    );
    const sense = Object.keys(ERRORS_RC).filter(k => !provocats.has(k));
    ok(
        `els ${Object.keys(ERRORS_RC).length} errors de la taxonomia tenen una prova`,
        !sense.length,
        `sense prova: ${sense}`
    );
    ok('el diagnòstic no peta amb dades absurdes', w.diagnosticaRC({ mena: 'punts', dades: {} }, null) === null);
}

// ─────────────────────────────────────────────────────────────────────────────
suite("4. Tipus i generador d'enllaços");
{
    eq(
        '«tots», un rere l’altre en 8 preguntes',
        Array.from({ length: 8 }, (_, i) => w.tipusRC('', i, 8)).join(),
        'llegir,llegir,dibuixar,dibuixar,dosPunts,dosPunts,classificar,classificar'
    );
    const dades = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    const { OPCIONS_ACTIVITAT, ACTIVITIES_ESO } = vm.runInNewContext(
        `${dades}\n({ OPCIONS_ACTIVITAT, ACTIVITIES_ESO });`
    );
    const opcio = (OPCIONS_ACTIVITAT['recta.html'] || []).find(o => o.param === 'tipus');
    eq(
        'index.html: «tipus» amb les opcions de TIPUS_RC',
        opcio
            ? opcio.valors
                  .map(([v]) => v)
                  .sort()
                  .join()
            : '',
        Object.keys(TIPUS_RC).sort().join()
    );
    const entrada = ACTIVITIES_ESO.find(a => a.file === 'recta.html');
    ok(
        "és al menú d'ESO, amb nivells i sessions fixes",
        !!entrada && entrada.difficulty === true && entrada.fixed === true
    );
    const controlador = fs.readFileSync(path.join(ROOT, 'js/recta/recta.js'), 'utf8');
    ok(
        'el controlador genera les preguntes a generaPregunta (dins de buildLevel)',
        /generaPregunta\([^)]*\) \{[\s\S]*?generaPreguntaRC\(/.test(controlador)
    );
}

finish('TESTS DE LA RECTA');
