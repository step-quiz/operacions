/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/percentatges.test.js
 * ROL: Tests de «Percentatges» (js/percentatges/), del diagnòstic per valors
 *      equivocats (errorPerDistractors, js/passos/correccio.js) i dels decimals de
 *      js/algebra/racionals.js.
 * ARQUITECTURA:
 * - Es generen milers de problemes de cada tipus i nivell. La solució de cada pas
 *   es recalcula aquí amb nombres a partir dels nombres de l'enunciat.
 * - La resposta bona s'accepta escrita amb coma (i amb un zero de més); els valors
 *   equivocats mai; i cada error de la taxonomia es provoca a mà.
 * ÚS: node tests/percentatges.test.js
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
        'js/passos/correccio.js',
        'js/percentatges/strings.js',
        'js/percentatges/math-engine.js',
        'js/percentatges/errors.js',
    ],
    { seed: 2026 }
);
const { ERRORS_PE, TIPUS_PE } = w;
const TIPUS = ['calcul', 'variacio', 'inversPreu', 'inversPart', 'encadenats'];
const PER_COMBINACIO = 600;
const BAD_TEXT = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b|\.\d/;
const num = c => (Array.isArray(c) ? c[0] / c[1] : c);
const quasi = (u, v) => Math.abs(u - v) < 1e-9 * (1 + Math.abs(u));
// Els nombres d'un enunciat («73,80 €», «20 %»), en l'ordre en què hi surten
const nombres = text => (text.match(/\d+(,\d+)?/g) || []).map(x => Number(x.replace(',', '.')));

// Un valor escrit com l'escriuria l'alumne: { v: '0,1', p: '6' }
function escriu(valor) {
    const { enter, ante, periode } = w.expansioDecimal(valor);
    return { v: ante ? `${enter},${ante}` : String(enter), p: periode };
}

// La resposta bona tal com l'escriuria l'alumne (decimal amb coma)
function resposta(pas, extra = false) {
    const r = {};
    for (const [camp, tipus] of Object.entries(pas.camps)) {
        const s = pas.solucio[camp];
        if (tipus === 'racional') r[camp] = { n: String(s[0]), d: String(s[1]) };
        else {
            const e = escriu(s);
            if (extra) e.v += e.v.includes(',') ? '0' : ',0';
            r[camp] = e;
        }
    }
    return r;
}

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Decimals (racionals.js)');
{
    eq('12,5 amb dos decimals', w.textDecimal([25, 2], { minDecimals: 2 }), '12,50');
    eq('7 sense decimals', w.textDecimal(7, { minDecimals: 2 }), '7');
    eq('1/3 en TeX', w.texDecimal([1, 3]), '0{,}\\overline{3}');
    eq('3/4 : 3/5 = 5/4', String(w.quocientCoef([3, 4], [3, 5])), '5,4');
    const pas = {
        camps: { r: 'decimal' },
        solucio: { r: 7 },
        dades: {
            distractors: {
                r: [
                    [15, 'A'],
                    [[7, 10], 'B'],
                ],
            },
        },
    };
    eq('errorPerDistractors: 15 → A', w.errorPerDistractors(pas, { r: 15 }), 'A');
    eq('errorPerDistractors: 0,7 → B', w.errorPerDistractors(pas, { r: [7, 10] }), 'B');
    eq('errorPerDistractors: un altre valor → null', w.errorPerDistractors(pas, { r: 3 }), null);
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Problemes generats: solucions, passos i resposta bona');
{
    for (const tipus of TIPUS) {
        for (const nivell of [1, 2, 3]) {
            const errors = [];
            const vistes = new Set();
            for (let i = 0; i < PER_COMBINACIO && errors.length < 3; i++) {
                const q = w.generaPreguntaPE(tipus, nivell);
                const err = msg => errors.push(`${q.enunciat}: ${msg}`);
                vistes.add(q.clau);
                if (BAD_TEXT.test(q.enunciat) || q.passos.some(p => /undefined|NaN|null/.test(p.linia) || !p.enunciat))
                    err('escriptura');
                const n = nombres(q.enunciat);
                const sol = id => num(Object.values(q.passos.find(p => p.id === id).solucio)[0]);
                // La solució de cada pas, recalculada amb els nombres de l'enunciat
                if (tipus === 'calcul') {
                    // «Calcula el p % de Q» o «… de Q € té un descompte del p %»
                    const [p, Q] = /descompte/.test(q.enunciat) ? [n[1], n[0]] : n;
                    if (!quasi(sol('resultat'), (p * Q) / 100)) err('resultat');
                    if (!quasi(num(Object.values(q.passos[0].solucio)[0]), p / 100)) err('percentatge');
                    if (nivell === 1 && !Number.isInteger((p * Q) / 100)) err('al nivell 1, resultat enter');
                } else if (tipus === 'variacio') {
                    const [Q, p] = n;
                    const signe = /rebaixa/.test(q.enunciat) ? -1 : 1;
                    if (
                        !quasi(sol('index'), 1 + (signe * p) / 100) ||
                        !quasi(sol('final'), Q * (1 + (signe * p) / 100))
                    )
                        err('variació');
                } else if (tipus === 'inversPreu') {
                    const [p, F] = n;
                    const signe = /rebaixa/.test(q.enunciat) ? -1 : 1;
                    if (!quasi(sol('inicial') * (1 + (signe * p) / 100), F)) err('quantitat d’abans');
                } else if (tipus === 'inversPart') {
                    const [x, y] = n;
                    const [a, t] = /classe|enquesta/.test(q.enunciat) ? [y, x] : [y, x];
                    if (!quasi(sol('percent'), (100 * a) / t)) err('percentatge de la part');
                } else {
                    const [p1, p2] = n;
                    const [s1, s2] = (q.enunciat.match(/puja|baixa/g) || []).map(x => (x === 'puja' ? 1 : -1));
                    const total = (1 + (s1 * p1) / 100) * (1 + (s2 * p2) / 100);
                    if (!quasi(sol('total'), total) || !quasi(sol('variacio'), Math.abs(total - 1) * 100))
                        err('encadenats');
                    if (q.passos[3].linia.includes(total > 1 ? 'baixa' : 'puja')) err('puja o baixa');
                }
                for (const p of q.passos) {
                    for (const extra of [false, true]) {
                        const r = w.corregeixPas(
                            p,
                            resposta(p, extra && p.camps[Object.keys(p.camps)[0]] === 'decimal')
                        );
                        if (r.estat !== 'ok') err(`${p.id}: la resposta bona dona ${r.estat}`);
                        else if (BAD_TEXT.test(w.textRespostaPE(p, r.valors))) err(`${p.id}: text de la resposta`);
                    }
                    const sols = Object.values(p.solucio);
                    for (const [valor] of Object.values(p.dades.distractors).flat())
                        if (w.coefsIguals(valor, sols[0])) err(`${p.id}: un valor equivocat és el bo`);
                    // Els valors (diners i percentatges) tenen com a molt 2 decimals (i el decimal de p, 4)
                    if (!w.textDecimal(sols[0]).match(/^\d+(,\d{1,4})?$/)) err(`${p.id}: ${w.textDecimal(sols[0])}`);
                }
            }
            ok(
                `${tipus}, nivell ${nivell}: ${PER_COMBINACIO} problemes (${vistes.size} de diferents)`,
                !errors.length && vistes.size >= 20,
                errors.join(' | ')
            );
        }
    }
    const perNivell = n => new Set(Array.from({ length: 300 }, () => w.tipusPE('', n)));
    eq('sense tipus, el nivell 1 és calcular', [...perNivell(1)].join(), 'calcul');
    eq(
        'sense tipus, el nivell 2 és calcular i augments i rebaixes',
        [...perNivell(2)].sort().join(),
        'calcul,variacio'
    );
    eq(
        'sense tipus, el nivell 3 és la resta',
        [...perNivell(3)].sort().join(),
        'encadenats,inversPart,inversPreu,variacio'
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Diagnòstic: cada error típic, a mà');
{
    const provocats = new Set();
    // Busca un problema amb aquest tipus i nombres i en prova una resposta a un pas
    function prova(titol, tipus, nivell, condicio, id, valor, esperat) {
        let q;
        for (let i = 0; i < 4000 && !(q && condicio(q)); i++) q = w.generaPreguntaPE(tipus, nivell);
        const pas = q.passos.find(p => p.id === id);
        const [camp] = Object.keys(pas.camps);
        // (sense valor: el valor equivocat que el motor associa a aquest error)
        const v = valor !== null ? valor : (pas.dades.distractors[camp].find(([, e]) => e === esperat) || [0])[0];
        const resp = { [camp]: pas.camps[camp] === 'racional' ? { n: String(v[0]), d: String(v[1]) } : escriu(v) };
        const r = w.corregeixPas(pas, resp);
        const d = r.estat === 'error' ? w.diagnosticaPE(pas, r.valors) : null;
        if (d) provocats.add(d.errorType);
        eq(`${titol} («${q.enunciat}»)`, d ? d.errorType : `(${r.estat}, sense diagnòstic)`, esperat);
    }
    const te =
        (...x) =>
        q =>
            x.every(t => (t instanceof RegExp ? t.test(q.enunciat) : nombres(q.enunciat)[t[0]] === t[1]));
    const ambDistractor = (id, e) => q =>
        q.passos.some(p => p.id === id && Object.values(p.dades.distractors)[0].some(([, x]) => x === e));
    const percentDe = (id, x) => q => q.passos[0].id === id && w.coefsIguals(Object.values(q.passos[0].solucio)[0], x);
    prova('30 % = 30', 'calcul', 2, percentDe('decimal', [3, 10]), 'decimal', 30, 'SENSE_100');
    prova('5 % = 0,5', 'calcul', 1, percentDe('decimal', [1, 20]), 'decimal', [1, 2], 'DECIMAL_5');
    prova('25 % = 1/25', 'calcul', 1, percentDe('fraccio', [1, 4]), 'fraccio', [1, 25], 'PERCENT_DEN');
    prova(
        'el p % de Q = Q − p',
        'calcul',
        2,
        ambDistractor('resultat', 'RESTA_PERCENT'),
        'resultat',
        null,
        'RESTA_PERCENT'
    );
    prova('el que queda', 'calcul', 2, ambDistractor('resultat', 'COMPLEMENT'), 'resultat', null, 'COMPLEMENT');
    prova('coma desplaçada', 'calcul', 2, () => true, 'resultat', null, 'COMA');
    prova('rebaixa del p %: × 0,p', 'variacio', 2, te(/rebaixa/), 'index', null, 'INDEX_SENSE_1');
    prova('rebaixa presa per augment', 'variacio', 2, te(/rebaixa/), 'index', null, 'INDEX_SIGNE');
    prova('el que es rebaixa', 'variacio', 2, te(/rebaixa/), 'final', null, 'NOMES_VARIACIO');
    prova('preu − p', 'variacio', 2, te(/rebaixa/), 'final', null, 'SUMA_PERCENT');
    prova('multiplicar per l’índex', 'inversPreu', 3, te(/rebaixa/), 'inicial', null, 'MULTIPLICA');
    prova('desfer la rebaixa amb un augment', 'inversPreu', 3, te(/rebaixa/), 'inicial', null, 'DESFER_PERCENT');
    prova('total entre part', 'inversPart', 3, () => true, 'quocient', null, 'DIVIDEIX_INVERS');
    prova('0,36 = 0,36 %', 'inversPart', 3, () => true, 'percent', null, 'PER_100');
    prova('índexs sumats', 'encadenats', 3, () => true, 'total', null, 'SUMA_INDEXS');
    prova('percentatges sumats', 'encadenats', 3, te(/puja.*baixa/), 'variacio', null, 'SUMA_PERCENTATGES');
    prova('l’índex com a percentatge', 'encadenats', 3, () => true, 'variacio', null, 'INDEX_COM_PERCENT');
    const sense = Object.keys(ERRORS_PE).filter(k => !provocats.has(k));
    ok(
        `els ${Object.keys(ERRORS_PE).length} errors de la taxonomia tenen una prova`,
        !sense.length,
        `sense prova: ${sense}`
    );
    ok('el diagnòstic no peta amb dades absurdes', w.diagnosticaPE({ camps: {} }, null) === null);
}

// ─────────────────────────────────────────────────────────────────────────────
suite("4. Generador d'enllaços");
{
    const dades = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    const { OPCIONS_ACTIVITAT, ACTIVITIES_ESO } = vm.runInNewContext(
        `${dades}\n({ OPCIONS_ACTIVITAT, ACTIVITIES_ESO });`
    );
    const opcio = (OPCIONS_ACTIVITAT['percentatges.html'] || []).find(o => o.param === 'tipus');
    eq(
        'index.html: «tipus» amb les opcions de TIPUS_PE',
        opcio
            ? opcio.valors
                  .map(([v]) => v)
                  .sort()
                  .join()
            : '',
        Object.keys(TIPUS_PE).sort().join()
    );
    const entrada = ACTIVITIES_ESO.find(a => a.file === 'percentatges.html');
    ok(
        "és al menú d'ESO, amb nivells i sessions fixes",
        !!entrada && entrada.difficulty === true && entrada.fixed === true
    );
    const controlador = fs.readFileSync(path.join(ROOT, 'js/percentatges/percentatges.js'), 'utf8');
    ok(
        'el controlador genera els problemes a generaPregunta (dins de buildLevel)',
        /generaPregunta\([^)]*\) \{[\s\S]*?generaPreguntaPE\(/.test(controlador)
    );
}

finish('TESTS DE PERCENTATGES');
