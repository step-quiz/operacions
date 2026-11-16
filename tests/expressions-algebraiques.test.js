/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/expressions-algebraiques.test.js
 * ROL: Tests d'«Expressions algebraiques» (js/expressions-algebraiques/) i del
 *      mòdul comú de polinomis (js/algebra/polinomis.js).
 * ARQUITECTURA:
 * - Es generen milers d'expressions de cada tipus, nivell i nombre de lletres. El
 *   resultat es comprova aquí avaluant l'expressió i el resultat en uns quants
 *   punts amb aritmètica de nombres (sense fer servir el desenvolupament del motor).
 * - La resposta bona s'accepta (amb els termes que no hi són en blanc); les
 *   equivocades, mai; i cada error de la taxonomia es provoca amb una resposta
 *   feta a mà.
 * ÚS: node tests/expressions-algebraiques.test.js
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
        'js/expressions-algebraiques/strings.js',
        'js/expressions-algebraiques/math-engine.js',
        'js/expressions-algebraiques/errors.js',
    ],
    { seed: 2026 }
);
const { ERRORS_EA, TIPUS_EA } = w;
const TIPUS = ['reduir', 'monomis', 'distributiva', 'binomis'];
const PER_COMBINACIO = 800;
const BAD_TEXT =
    /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b|[+\-−] [+\-−]|(?<![\d^{])1[xy]|\+ \(?-|\(\)|\{\}/;
const m = (c, x = 0, y = 0) => w.monomi(c, { x, y });

// ── Aritmètica de nombres, independent del motor ─────────────────────────────
const valorMonomi = (mo, x, y) => mo.c * x ** (mo.e.x || 0) * y ** (mo.e.y || 0);
const valorPolinomi = (p, x, y) => p.reduce((s, mo) => s + valorMonomi(mo, x, y), 0);
const valorExpressio = (expr, x, y) =>
    expr.reduce((s, factors) => s + factors.reduce((pr, f) => pr * valorPolinomi(f, x, y), 1), 0);
const PUNTS = [
    [2, 3],
    [-3, 5],
    [7, -2],
    [-1, -4],
];

// La resposta bona tal com l'escriuria l'alumne (els termes que no hi són i els exponents 1, en blanc)
function respostaBona(pas) {
    const resp = {};
    for (const [nom, tipus] of Object.entries(pas.camps)) {
        const s = pas.solucio[nom];
        resp[nom] = (tipus === 'coeficient' && s === 0) || (tipus === 'exponent' && s === 1) ? '' : String(s);
    }
    return resp;
}

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Polinomis (js/algebra/polinomis.js)');
{
    const text = p => w.escriuPolinomi(p, { tex: false });
    eq('x² − 3x + 2', text([m(1, 2), m(-3, 1), m(2)]), 'x² − 3x + 2');
    eq('−x + y (coeficients ±1)', text([m(-1, 1), m(1, 0, 1)]), '−x + y');
    eq('terme de coeficient 0 → no s’escriu', text([m(0, 2), m(5, 1)]), '5x');
    eq('polinomi buit → 0', text([]), '0');
    eq('2x²y³ en TeX', w.escriuPolinomi([m(2, 2, 3)]), '2x^{2}y^{3}');
    eq('x¹⁰', text([m(1, 10)]), 'x¹⁰');
    const expr = (...p) => w.escriuExpressio(p, { tex: false });
    eq('3x − 2(x − 4)', expr([[m(3, 1)]], [[m(-2)], [m(1, 1), m(-4)]]), '3x − 2(x − 4)');
    eq('−(x + 2)(x − 3)', expr([[m(-1)], [m(1, 1), m(2)], [m(1, 1), m(-3)]]), '−(x + 2)(x − 3)');
    eq('3x² · (−2x)', expr([[m(3, 2)], [m(-2, 1)]]), '3x² · (−2x)');
    eq('−x³ · 4x', expr([[m(-1, 3)], [m(4, 1)]]), '−x³ · 4x');
    eq('5 − x(x + y)', expr([[m(5)]], [[m(-1, 1)], [m(1, 1), m(1, 0, 1)]]), '5 − x(x + y)');
    const reduit = w.redueixPolinomi([m(3), m(1, 0, 1), m(2, 1), m(-1, 1, 1), m(4, 2), m(-3), m(1, 0, 2)]);
    eq('reduir i ordenar: x², xy, y², x, y, 1', text(reduit), '4x² − xy + y² + 2x + y');
    ok('polinomisIguals no mira l’ordre', w.polinomisIguals([m(1, 1), m(2)], [m(2), m(1, 1)]));
    ok('i sí els coeficients', !w.polinomisIguals([m(1, 1), m(2)], [m(1, 1), m(3)]));
    eq(
        '(x + 2)(x − 2) = x² − 4',
        text(
            w.redueixPolinomi(
                w.desenvolupa([
                    [
                        [m(1, 1), m(2)],
                        [m(1, 1), m(-2)],
                    ],
                ])
            )
        ),
        'x² − 4'
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Expressions generades: escriptura, resultat i resposta bona');
{
    for (const dues of [false, true]) {
        for (const tipus of TIPUS) {
            for (const nivell of [1, 2, 3]) {
                const errors = [];
                const vistes = new Set();
                for (let i = 0; i < PER_COMBINACIO && errors.length < 3; i++) {
                    const q = w.generaPreguntaEA(tipus, nivell, dues);
                    const err = msg => errors.push(`${q.text}: ${msg}`);
                    const [pas] = q.passos;
                    vistes.add(q.tex);
                    if (q.passos.length !== 1 || pas.mena !== tipus) err('passos');
                    if (BAD_TEXT.test(q.tex) || BAD_TEXT.test(q.text) || BAD_TEXT.test(pas.linia))
                        err(`escriptura «${q.tex}» ${pas.linia}`);
                    if (!dues && /y/.test(q.text)) err('surt la y amb una sola lletra');
                    if (dues && !/y/.test(q.text)) err('no surt la y');
                    // La solució val el mateix que l'expressió en uns quants punts
                    const sol = w.polinomiDeValorsEA(pas, pas.solucio);
                    if (!sol.length) err('resultat 0');
                    if (PUNTS.some(([x, y]) => valorPolinomi(sol, x, y) !== valorExpressio(q.expr, x, y)))
                        err(`resultat ${w.escriuPolinomi(sol)}`);
                    if (tipus !== 'monomis' && Object.keys(pas.camps).length !== (dues ? 6 : 3)) err('caselles');
                    if (tipus === 'monomis' && sol.length !== 1) err('el producte de monomis no és un monomi');
                    // La resposta bona s'accepta, i el text de l'historial és el de la línia resolta
                    const r = w.corregeixPas(pas, respostaBona(pas));
                    if (r.estat !== 'ok') err(`la resposta bona dona «${r.estat}»`);
                    else if (w.textRespostaEA(pas, r.valors) !== w.escriuPolinomi(sol, { tex: false }))
                        err('text de la resposta');
                    // Propietats de cada nivell
                    const termes = w.desenvolupa(q.expr);
                    if (
                        tipus === 'reduir' &&
                        nivell < 3 &&
                        sol.length < new Set(termes.map(t => w.clauMonomi(t.e))).size
                    )
                        err('s’anul·la un terme a un nivell baix');
                    if (tipus === 'monomis' && nivell >= 2 && q.expr[0].every(f => f[0].c > 0))
                        err('cap factor negatiu');
                    if (tipus === 'binomis' && nivell === 1 && q.expr[0].some(f => f[0].c !== 1))
                        err('al nivell 1, binomis x + p');
                }
                ok(
                    `${tipus}, nivell ${nivell}, ${dues ? 'x i y' : 'x'}: ${PER_COMBINACIO} expressions (${vistes.size} de diferents)`,
                    !errors.length && vistes.size >= 30,
                    errors.join(' | ')
                );
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Correcció: caselles en blanc i exponents');
{
    const pas = w.pasEA([[[m(3, 1)]], [[m(2)]], [[m(-5, 1)]], [[m(7)]]], 'reduir', false); // −2x + 9
    const estat = resp => w.corregeixPas(pas, resp).estat;
    eq('totes en blanc → incomplet', estat({ x2: '', x1: '', k: '' }), 'incomplet');
    eq('x² en blanc (no hi és) → correcte', estat({ x2: '', x1: '-2', k: '9' }), 'ok');
    eq('x² = 0 escrit → correcte', estat({ x2: '0', x1: '-2', k: '9' }), 'ok');
    eq('falta el terme independent → error', estat({ x2: '', x1: '-2', k: '' }), 'error');
    eq('text que no és un enter → avís', w.corregeixPas(pas, { x2: '', x1: '-2,5', k: '9' }).codi, 'NO_ENTER');
    const mon = w.pasEA([[[m(3, 2)], [m(-2, 1)]]], 'monomis', false); // −6x³
    eq('monomi: coeficient i exponent → correcte', w.corregeixPas(mon, { c: '-6', ex: '3' }).estat, 'ok');
    eq('monomi: sense coeficient → incomplet', w.corregeixPas(mon, { c: '', ex: '3' }).estat, 'incomplet');
    const lineal = w.pasEA([[[m(2, 1, 1)], [m(3, 0, 1)]]], 'monomis', true); // 6xy²
    eq('exponent 1 en blanc → correcte', w.corregeixPas(lineal, { c: '6', ex: '', ey: '2' }).estat, 'ok');
    eq('exponent 1 escrit → correcte', w.corregeixPas(lineal, { c: '6', ex: '1', ey: '2' }).estat, 'ok');

    // Respostes equivocades a l'atzar: mai s'accepten i el diagnòstic mai peta
    const fuzz = [];
    let diagnosticades = 0;
    for (let i = 0; i < 4000 && fuzz.length < 3; i++) {
        const q = w.generaPreguntaEA(TIPUS[i % 4], 1 + (i % 3), i % 2 === 1);
        const [p] = q.passos;
        const resp = respostaBona(p);
        const noms = Object.keys(p.camps);
        const nom = noms[(i >> 3) % noms.length];
        resp[nom] = String(p.solucio[nom] + 1 + (i % 4));
        const r = w.corregeixPas(p, resp);
        if (r.estat !== 'error' || String(r.malament) !== nom) fuzz.push(`${q.text} · ${nom}: ${r.estat}`);
        let d;
        try {
            d = w.diagnosticaEA(p, r.valors);
        } catch (e) {
            fuzz.push(`el diagnòstic peta: ${e.message}`);
        }
        if (d) {
            diagnosticades++;
            if (!ERRORS_EA[d.errorType] || !d.missatge || !d.etiqueta) fuzz.push('diagnòstic mal format');
        }
    }
    ok(
        `4000 respostes equivocades a l'atzar: cap s'accepta (${diagnosticades} amb diagnòstic)`,
        !fuzz.length,
        fuzz.join(' | ')
    );
    ok('el diagnòstic no peta amb dades absurdes', w.diagnosticaEA({ mena: 'reduir' }, null) === null);
}

// ─────────────────────────────────────────────────────────────────────────────
suite('4. Diagnòstic: cada error típic, amb una resposta feta a mà');
{
    const provocats = new Set();
    function prova(titol, expr, tipus, resp, esperat, dues = false) {
        const pas = w.pasEA(expr, tipus, dues);
        const r = w.corregeixPas(pas, resp);
        const d = r.estat === 'error' ? w.diagnosticaEA(pas, r.valors) : null;
        if (d) provocats.add(d.errorType);
        eq(titol, d ? d.errorType : `(${r.estat}, sense diagnòstic)`, esperat);
    }
    const suma = (...termes) => termes.map(t => [[t]]);
    const R = suma(m(3, 1), m(2), m(-5, 1), m(7)); // 3x + 2 − 5x + 7 = −2x + 9
    prova('3x + 2 − 5x + 7 = 7x', R, 'reduir', { x1: '7' }, 'SEMBLANTS_NO');
    prova('signe d’un terme', R, 'reduir', { x1: '8', k: '9' }, 'SIGNE_TERME');
    prova('x + x = x²', R, 'reduir', { x2: '-2', k: '9' }, 'SUMA_EXPONENTS');
    prova('coeficient 1 en blanc', suma(m(3, 1), m(-2, 1), m(4)), 'reduir', { k: '4' }, 'COEF_U');
    prova(
        'coeficient −1 en blanc (x i y)',
        suma(m(2, 0, 1), m(-3, 0, 1), m(5, 1)),
        'reduir',
        { x1: '5' },
        'COEF_U',
        true
    );
    const M = [[[m(3, 2)], [m(2, 3)]]]; // 3x² · 2x³ = 6x⁵
    prova('exponents multiplicats', M, 'monomis', { c: '6', ex: '6' }, 'EXP_MULTIPLICA');
    prova('coeficients sumats', M, 'monomis', { c: '5', ex: '5' }, 'COEF_SUMA');
    prova('x · x = x', [[[m(3, 1)], [m(2, 1)]]], 'monomis', { c: '6', ex: '' }, 'EXP_NO_SUMA');
    prova('menys per menys', [[[m(-3, 2)], [m(-2, 3)]]], 'monomis', { c: '-6', ex: '5' }, 'SIGNE_PRODUCTE');
    prova('2(x + 3) = 2x + 3', [[[m(2)], [m(1, 1), m(3)]]], 'distributiva', { x1: '2', k: '3' }, 'DIST_NOMES_PRIMER');
    prova('−(x − 3) = −x − 3', [[[m(-1)], [m(1, 1), m(-3)]]], 'distributiva', { x1: '-1', k: '-3' }, 'DIST_MENYS');
    prova('2x(x + 4) = 10x', [[[m(2, 1)], [m(1, 1), m(4)]]], 'distributiva', { x1: '10' }, 'EXP_NO_SUMA');
    prova('2(x − 3) = 2x + 6', [[[m(2)], [m(1, 1), m(-3)]]], 'distributiva', { x1: '2', k: '6' }, 'SIGNE_PRODUCTE');
    prova(
        '(x + 2)(x + 3) = x² + 6',
        [
            [
                [m(1, 1), m(2)],
                [m(1, 1), m(3)],
            ],
        ],
        'binomis',
        { x2: '1', k: '6' },
        'BINOMIS_CREUATS'
    );
    prova(
        '(x − 2)(x + 3): signe',
        [
            [
                [m(1, 1), m(-2)],
                [m(1, 1), m(3)],
            ],
        ],
        'binomis',
        { x2: '1', x1: '1', k: '6' },
        'SIGNE_PRODUCTE'
    );
    prova(
        '(x − 2y)(x + 4y), sense creuats',
        [
            [
                [m(1, 1), m(-2, 0, 1)],
                [m(1, 1), m(4, 0, 1)],
            ],
        ],
        'binomis',
        { x2: '1', y2: '-8' },
        'BINOMIS_CREUATS',
        true
    );
    prova('una resposta qualsevol → sense diagnòstic', R, 'reduir', { x1: '4', k: '1' }, '(error, sense diagnòstic)');

    const sense = Object.keys(ERRORS_EA).filter(k => !provocats.has(k));
    ok(
        `els ${Object.keys(ERRORS_EA).length} errors de la taxonomia tenen una prova`,
        !sense.length,
        `sense prova: ${sense}`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite("5. Tipus, nivells i generador d'enllaços");
{
    eq(
        '«totes»: una rere l’altra al llarg de 8 preguntes',
        Array.from({ length: 8 }, (_, i) => w.tipusEA('', i, 8)).join(),
        'reduir,reduir,monomis,monomis,distributiva,distributiva,binomis,binomis'
    );
    eq('un tipus fix', w.tipusEA('binomis', 0, 8), 'binomis');
    eq('una opció desconeguda → totes', w.tipusEA('xyz', 7, 8), 'binomis');
    const dades = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    const { OPCIONS_ACTIVITAT, ACTIVITIES_ESO } = vm.runInNewContext(
        `${dades}\n({ OPCIONS_ACTIVITAT, ACTIVITIES_ESO });`
    );
    const opcions = OPCIONS_ACTIVITAT['expressions-algebraiques.html'] || [];
    const valors = param =>
        (opcions.find(o => o.param === param) || { valors: [] }).valors
            .map(([v]) => v)
            .sort()
            .join();
    eq('index.html: «tipus» amb les opcions de TIPUS_EA', valors('tipus'), Object.keys(TIPUS_EA).sort().join());
    eq('index.html: «lletres» amb una (buit) i dues (2)', valors('lletres'), ',2');
    const entrada = ACTIVITIES_ESO.find(a => a.file === 'expressions-algebraiques.html');
    ok(
        "és al menú d'ESO, amb nivells i sessions fixes",
        !!entrada && entrada.difficulty === true && entrada.fixed === true
    );
    const controlador = fs.readFileSync(
        path.join(ROOT, 'js/expressions-algebraiques/expressions-algebraiques.js'),
        'utf8'
    );
    ok(
        'el controlador genera les expressions a generaPregunta (dins de buildLevel)',
        /generaPregunta\([^)]*\) \{[\s\S]*?generaPreguntaEA\(/.test(controlador)
    );
}

finish("TESTS D'EXPRESSIONS ALGEBRAIQUES");
