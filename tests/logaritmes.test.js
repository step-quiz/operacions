/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/logaritmes.test.js
 * ROL: Tests de «Logaritmes i equacions», bloc 1, logaritmes (js/logaritmes/).
 * - 1. Milers d'exercicis dels tres nivells, contra un model independent
 *      (tests/logaritmes-model.js) que avalua el TeX que veu l'alumne: logₐ x i la
 *      potència, la forma exponencial ↔ logarítmica, les propietats (amb a, b, c a
 *      l'atzar: la correcta és igual i cap falsa no ho és), calcular amb propietats i la
 *      calculadora. 4 opcions diferents, una correcta; KaTeX; la resposta bona val.
 * - 2. El diagnòstic de cada error típic.
 * - 3. Els nivells, la pàgina, l'índex i el codi reservat.
 * ÚS: node tests/logaritmes.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, finish, loadModule } = require('./harness');
const { avalua, expressio, logIArgument } = require('./logaritmes-model');

const w = loadModule(
    [
        'js/utils.js',
        'js/algebra/racionals.js',
        'js/passos/taula-signes.js',
        'js/passos/correccio.js',
        'js/logaritmes/strings.js',
        'js/logaritmes/math-engine.js',
        'js/logaritmes/errors.js',
    ],
    { seed: 20261121 }
);
const { generaPreguntaLG, diagnosticaLG, corregeixPas, ERRORS_LG } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));
const prop = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const num = v => (Array.isArray(v) ? v[0] / v[1] : v);
/** La resposta bona tal com l'escriu l'alumne (fraccions n/d, decimals amb coma). */
function bona(pas) {
    const r = {};
    for (const [nom, tipus] of Object.entries(pas.camps)) {
        const s = pas.solucio[nom];
        if (tipus === 'racional') r[nom] = { n: String(s[0]), d: s[1] === 1 ? '' : String(s[1]) };
        else if (tipus === 'decimal') r[nom] = { v: String(s).replace('.', ',') };
        else r[nom] = s;
    }
    return r;
}

const errors = [];
const nota = (c, m) => {
    if (!c) errors.push(m);
};

function comprova(q) {
    const et = q.tex;
    nota(katexOk(q.tex), `KaTeX: ${q.tex}`);
    for (const p of q.passos) {
        nota(katexOk(p.linia), `KaTeX: ${p.linia}`);
        for (const t of String(p.enunciat)
            .split('$')
            .filter((_, i) => i % 2))
            nota(katexOk(t), `KaTeX: ${t}`);
        for (const g of p.plantilla)
            for (const tr of g.grup || []) if (tr.tex) nota(katexOk(tr.tex), `KaTeX: ${tr.tex}`);
        nota(corregeixPas(p, bona(p)).estat === 'ok', `la bona no val (${p.id}): ${et}`);
        if (p.mena === 'tria') {
            const n = p.id === 'signe' ? 2 : 4;
            nota(
                p.opcions.length === n && p.opcions.filter(o => o[0] === 'ok').length === 1,
                `${p.id}: opcions: ${et}`
            );
            nota(new Set(p.opcions.map(o => o[1])).size === p.opcions.length, `${p.id}: repetides: ${et}`);
            for (const o of p.opcions) {
                if (o[3]) nota(katexOk(o[3].slice(1, -1)), `KaTeX: ${o[3]}`);
                if (o[0] !== 'ok') nota(ERRORS_LG[o[0].split('#')[0]], `${p.id}: ${o[0]} sense explicació`);
            }
        }
    }
    const e = expressio(q.tex);
    if (q.tipus === 'definicio') {
        const { b, x } = logIArgument(e);
        const esperat = Math.log(x) / Math.log(b);
        nota(prop(num(q.passos[0].solucio.k), esperat, 1e-9), `x = bᵏ: ${et}`);
        nota(prop(num(q.passos[1].solucio.v), esperat, 1e-9), `el logaritme: ${et}`);
    }
    if (q.tipus === 'forma') {
        const s = q.passos[0].solucio;
        nota(prop(s.a ** num(s.y), num(s.x), 1e-12), `aʸ = x: ${et}`);
        const [esq, dre] = e.split('=').map(t => t.trim());
        if (/^\\log/.test(esq)) {
            const { b, x } = logIArgument(esq);
            nota(b === s.a && prop(x, num(s.x)) && prop(avalua(dre), num(s.y)), `forma exponencial: ${et}`);
        } else nota(prop(avalua(esq), num(s.x)) && prop(avalua(dre), num(s.x)), `forma logarítmica: ${et}`);
    }
    if (q.tipus === 'propietats') {
        const p = q.passos[0];
        const vars = [
            { a: 2.3, b: 5.7, c: 1.9 },
            { a: 7.1, b: 0.6, c: 3.3 },
        ];
        const ref = v => avalua(e, v);
        for (const o of p.opcions) {
            const iguals = vars.every(v => prop(avalua(o[1], v), ref(v), 1e-9));
            nota(iguals === (o[0] === 'ok'), `propietats ${o[0]}: ${o[1]} (${et})`);
        }
    }
    if (q.tipus === 'calcul') {
        const k = q.passos[1].solucio.v;
        nota(prop(avalua(e), k, 1e-9), `el valor de l'expressió no és ${k}: ${et}`);
        for (const o of q.passos[0].opcions) {
            const v = avalua(o[1]);
            nota(Math.abs(v - k) < 1e-9 === (o[0] === 'ok'), `calcul ${o[0]}: ${o[1]} = ${v} (${et})`);
        }
    }
    if (q.tipus === 'calculadora') {
        const v = avalua(e);
        const signe = q.passos[0].opcions.find(o => o[0] === 'ok')[1];
        nota((signe === 'Negatiu') === v < 0, `signe: ${et}`);
        nota(Math.abs(q.passos[1].solucio.v - Math.abs(v)) <= 5e-5 + 1e-12, `valor: ${et}`);
    }
}

suite('1. Milers d’exercicis contra el model que avalua el TeX');
{
    const tipus = {};
    let n = 0;
    for (const nivell of [1, 2, 3])
        for (let i = 0; i < 1500; i++) {
            const q = generaPreguntaLG({ nivell });
            tipus[q.tipus] = (tipus[q.tipus] || 0) + 1;
            comprova(q);
            n++;
        }
    ok(
        `${n} exercicis: definició, forma, propietats, càlcul i calculadora, tot correcte`,
        !errors.length,
        errors.slice(0, 6).join('\n      → ')
    );
    ok(`surten els 5 tipus (${JSON.stringify(tipus)})`, Object.keys(tipus).length === 5);
}

suite('2. El diagnòstic dels errors típics');
{
    const falten = [];
    const vistos = new Set();
    const prova = (pas, valors, codi, et) => {
        const d = diagnosticaLG(pas, valors);
        vistos.add(d && d.codi);
        if (!d || d.codi !== codi || !d.missatge) falten.push(`${et}: esperat ${codi}, surt ${d && d.codi}`);
    };
    for (const nivell of [1, 2, 3])
        for (let i = 0; i < 400; i++) {
            const q = generaPreguntaLG({ nivell });
            for (const p of q.passos) {
                if (p.mena === 'tria')
                    for (const o of p.opcions)
                        if (o[0] !== 'ok') prova(p, { tria: o[0] }, o[0].split('#')[0], `${q.tex} ${o[1]}`);
                if (p.mena === 'potencia') {
                    const [kn, kd] = p.solucio.k;
                    if (kn !== 0) prova(p, { k: [-kn, kd] }, 'LG_SIGNE', q.tex);
                    if (kn !== 0 && Math.abs(kn) !== kd) prova(p, { k: [kd, kn] }, 'LG_INVERS', q.tex);
                }
                if (p.mena === 'valor' && typeof p.dades.b === 'number') {
                    const { b, x, k } = p.dades;
                    const dv = x / b;
                    if (Number.isInteger(dv) && Math.abs(dv - k[0] / k[1]) > 1e-9 && Math.abs(dv + k[0] / k[1]) > 1e-9)
                        prova(p, { v: [dv, 1] }, 'LG_DIVIDEIX', q.tex);
                    if (
                        Number.isInteger(x) &&
                        x > 1 &&
                        Math.abs(x - k[0] / k[1]) > 1e-9 &&
                        Math.abs(x / b - x) > 1e-9 &&
                        !Number.isInteger(dv)
                    )
                        prova(p, { v: [x, 1] }, 'LG_ARGUMENT', q.tex);
                }
                if (p.mena === 'forma') {
                    const { b, k } = p.dades;
                    if (k !== b) prova(p, { a: k, y: [b, 1], x: p.solucio.x }, 'LG_FORMA', q.tex);
                }
                if (p.mena === 'calculadora') {
                    const { b, x } = p.dades;
                    const altre = Math.abs(b === 10 ? Math.log(x) : Math.log10(x));
                    prova(p, { v: [Math.round(altre * 1e4), 1e4] }, 'LG_LN_LOG', q.tex);
                }
            }
        }
    ok('cada error típic fet a mà dona el seu diagnòstic', !falten.length, falten.slice(0, 6).join('\n      → '));
    const clau = [
        'LG_SUMA',
        'LG_PRODUCTE_LOGS',
        'LG_POTENCIA',
        'LG_SIGNE',
        'LG_QUOCIENT_LOGS',
        'LG_RESTA',
        'LG_COEF',
        'LG_LN_LOG',
        'LG_SIGNE_CALC',
        'LG_DIVIDEIX',
        'LG_FORMA',
    ];
    ok(
        'surten els errors que va aprovar el David (E1)',
        clau.every(c => vistos.has(c)),
        clau.filter(c => !vistos.has(c)).join(', ')
    );
    ok(
        'cada error té etiqueta i missatge',
        Object.values(ERRORS_LG).every(e => e.etiqueta && e.missatge)
    );
    // Mutació: una solució equivocada es detecta
    errors.length = 0;
    let q;
    do q = generaPreguntaLG({ nivell: 2 });
    while (q.tipus !== 'definicio');
    q.passos[1].solucio.v = [q.passos[1].solucio.v[0] + 1, q.passos[1].solucio.v[1]];
    comprova(q);
    ok(
        'mutació: un logaritme equivocat es detecta',
        errors.some(e => /el logaritme/.test(e))
    );
}

suite('3. Nivells, pàgina, índex i codi');
{
    const per = { 1: new Set(), 2: new Set(), 3: new Set() };
    for (const n of [1, 2, 3]) for (let i = 0; i < 300; i++) per[n].add(generaPreguntaLG({ nivell: n }).tipus);
    ok(
        'nivell 1: definició i forma; 2: definició, càlcul i calculadora; 3: propietats, càlcul i definició',
        [...per[1]].sort().join() === 'definicio,forma' &&
            [...per[2]].sort().join() === 'calcul,calculadora,definicio' &&
            [...per[3]].sort().join() === 'calcul,definicio,propietats'
    );
    const html = fs.readFileSync(path.join(ROOT, 'logaritmes.html'), 'utf8');
    ok(
        'logaritmes.html: controlador i sense codi',
        /js\/logaritmes\/logaritmes\.js/.test(html) && /senseCodi:\s*true/.test(html)
    );
    const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    ok(
        'index.html: «Logaritmes i equacions» al menú de Batxillerat i l’opció de nivells',
        /file: 'logaritmes\.html', label: 'Logaritmes i equacions'/.test(index) &&
            /'logaritmes\.html': \[\s*\{ param: 'tipus'/.test(index)
    );
    ok(
        'codi LG reservat',
        /'?logaritmes'?: 'LG'/.test(fs.readFileSync(path.join(ROOT, 'js/exercise-codes.js'), 'utf8'))
    );
}

finish('LOGARITMES');
