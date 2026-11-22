/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/inequacions-no-lineals.test.js
 * ROL: Tests de les inequacions de 2n grau i racionals d'«Inequacions» (lliurament 22c,
 *      js/inequacions/no-lineals.js), contra un model independent: compila el TeX que veu
 *      l'alumne (tests/equacions-model.js) i decideix, punt per punt d'una graella, si la x
 *      compleix la inequació.
 * - 1. Milers d'inequacions dels tres nivells: el conjunt de l'opció correcta és el de la
 *      inequació inicial (i cap falsa no ho és); «tot a un costat» és equivalent (i cap falsa
 *      no ho és); els zeros anul·len el que toca; la taula, els signes que dona el model al
 *      punt de prova; la recta, els trams i els punts on es compleix. KaTeX; la resposta
 *      bona val (els zeros, en qualsevol ordre); «Cap solució» quan no n'hi ha.
 * - 2. El diagnòstic dels errors típics (E1) i mutacions.
 * - 3. La recta amb trams (SVG i lectura), els nivells, el controlador i l'índex.
 * ÚS: node tests/inequacions-no-lineals.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, finish, loadModule } = require('./harness');
const { compila, solucions } = require('./equacions-model');

const w = loadModule(
    [
        'js/utils.js',
        'js/algebra/racionals.js',
        'js/passos/taula-signes.js',
        'js/passos/recta-intervals.js',
        'js/passos/correccio.js',
        'js/inequacions/strings.js',
        'js/inequacions/math-engine.js',
        'js/inequacions/no-lineals.js',
        'js/inequacions/errors.js',
    ],
    { seed: 20261122 }
);
const { generaPreguntaNL, corregeixPas, diagnosticaIQ, svgRectaTrams, llegeixTrams, textRespostaNL } = w;
const ERRORS_IQ = { ...w.ERRORS_IQ, ...w.ERRORS_NL };
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));

// ── El model ─────────────────────────────────────────────────────────────────
/** «A ⊙ B» → (x) → true/false (fora del domini, false). */
function inequacio(tex) {
    const m = /^(.*?)\s*(\\le|\\ge|<|>)\s*(.*)$/.exec(tex);
    if (!m) throw new Error(`no és una inequació: ${tex}`);
    const [esq, dre] = [compila(m[1]), compila(m[3])];
    const rel = m[2];
    return x => {
        const a = esq({ x });
        const b = dre({ x });
        if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
        const d = a - b;
        const eps = 1e-9;
        return rel === '<' ? d < -eps : rel === '>' ? d > eps : rel === '\\le' ? d <= eps : d >= -eps;
    };
}
/** Un conjunt en TeX (ℝ, ∅, {a}, unió d'intervals) → (x) → true/false. */
function conjunt(tex) {
    if (tex === '\\varnothing') return () => false;
    if (tex === '\\mathbb{R}') return () => true;
    const peces = tex.split(' \\cup ').map(p => {
        let m;
        if ((m = /^\\\{(-?\d+)\\\}$/.exec(p))) return x => Math.abs(x - Number(m[1])) < 1e-9;
        m = /^([([])(-\\infty|-?\d+), (\+\\infty|-?\d+)([)\]])$/.exec(p);
        if (!m) throw new Error(`peça? ${p}`);
        const a = m[2] === '-\\infty' ? -Infinity : Number(m[2]);
        const b = m[3] === '+\\infty' ? Infinity : Number(m[3]);
        const [ta, tb] = [m[1] === '[', m[4] === ']'];
        return x => (ta ? x >= a - 1e-9 : x > a + 1e-9) && (tb ? x <= b + 1e-9 : x < b - 1e-9);
    });
    return x => peces.some(f => f(x));
}
const GRAELLA = [];
for (let k = -48; k <= 48; k++) GRAELLA.push(k / 4);
const iguals = (f, g) => GRAELLA.every(x => f(x) === g(x));

/** La resposta bona, tal com la dona l'alumne. */
function bona(pas) {
    if (pas.mena === 'tria') return { tria: 'ok' };
    if (pas.mena === 'taulaNL') {
        const t = pas.plantilla[0].taula;
        const r = { files: { s: pas.solucio.taula.files.s.slice() } };
        t.columnes.forEach((c, i) => {
            if (c.tipus !== 'interval') return;
            const p =
                c.a === -Infinity && c.b === Infinity
                    ? 0
                    : c.a === -Infinity
                      ? Math.ceil(c.b) - 2
                      : c.b === Infinity
                        ? Math.floor(c.a) + 2
                        : Math.floor(c.a) + 1;
            r[`p${i}`] = String(p);
        });
        return { taula: r };
    }
    if (pas.mena === 'trams') return { rt: { ...pas.solucio.rt, buida: false, tocat: true } };
    return { ...pas.solucio };
}

const errors = [];
const nota = (c, m) => {
    if (!c) errors.push(m);
};

function comprova(q) {
    const et = q.tex;
    nota(katexOk(q.tex), `KaTeX: ${q.tex}`);
    const original = inequacio(q.tex);
    const passos = Object.fromEntries(q.passos.map(p => [p.id, p]));
    for (const p of q.passos) {
        if (p.linia) nota(katexOk(p.linia), `KaTeX: ${p.linia}`);
        for (const t of String(p.enunciat)
            .split('$')
            .filter((_, i) => i % 2))
            nota(katexOk(t), `KaTeX: ${t}`);
        for (const g of p.plantilla)
            for (const tr of g.grup || []) if (tr.tex) nota(katexOk(tr.tex), `KaTeX: ${tr.tex}`);
        nota(corregeixPas(p, bona(p)).estat === 'ok', `la bona no val (${p.id}): ${et}`);
        if (p.parell)
            nota(
                corregeixPas(p, { x1: p.solucio.x2, x2: p.solucio.x1 }).estat === 'ok',
                `${p.id}: en l'altre ordre no val: ${et}`
            );
        if (p.mena === 'tria') {
            nota(
                p.opcions.length === 4 && p.opcions.filter(o => o[0] === 'ok').length === 1,
                `${p.id}: opcions: ${et}`
            );
            nota(new Set(p.opcions.map(o => o[0])).size === 4, `${p.id}: valors repetits: ${et}`);
            nota(new Set(p.opcions.map(o => o[1])).size === 4, `${p.id}: repetides: ${et}`);
            for (const o of p.opcions) {
                if (o[3]) for (const t of o[3].split('$').filter((_, i) => i % 2)) nota(katexOk(t), `KaTeX: ${o[3]}`);
                if (o[0] !== 'ok') nota(ERRORS_IQ[o[0].split('#')[0]], `${p.id}: ${o[0]} sense explicació`);
            }
        }
        nota(typeof textRespostaNL(p, bona(p)) === 'string', `${p.id}: text de la resposta`);
    }
    // Tot a un costat: la correcta és equivalent; cap falsa no ho és
    if (passos.passa) {
        for (const o of passos.passa.opcions) {
            const eq = iguals(inequacio(o[1]), original);
            nota(eq === (o[0] === 'ok'), `passa: ${o[0]} ${o[1]} ${eq ? 'és' : 'no és'} equivalent: ${et}`);
        }
    }
    // L'expressió de la taula (amb 0 a la dreta)
    const expr = /de \$(.*?)\$/.exec(passos.taula.enunciat)[1];
    const f = compila(expr);
    nota(iguals(inequacio(`${expr} ${/(\\le|\\ge|<|>)/.exec(passos.trams.enunciat)[1]} 0`), original), `expr: ${et}`);
    // Els zeros
    const z = passos.zeros;
    if (z.mena === 'zerosNL') {
        const eq = /\$(.*) = 0\$/.exec(z.enunciat)[1];
        const g = compila(eq);
        nota(
            z.solucio.x1 !== z.solucio.x2 && [z.solucio.x1, z.solucio.x2].every(r => Math.abs(g({ x: r })) < 1e-9),
            `zeros: ${et}`
        );
    } else if (z.mena === 'zerosFraccio') {
        const [, n, d] = /\$(.*) = 0\$ i \$(.*) = 0\$/.exec(z.enunciat);
        nota(Math.abs(compila(n)({ x: z.solucio.n })) < 1e-9, `zero del numerador: ${et}`);
        nota(Math.abs(compila(d)({ x: z.solucio.d })) < 1e-9, `zero del denominador: ${et}`);
    } else {
        const eq = /\$(.*) = 0\$/.exec(z.enunciat)[1];
        const reals = solucions(`${eq} = 0`, { lo: -15, hi: 15, h: 0.25 }).concat(
            GRAELLA.filter(x => Math.abs(compila(eq)({ x })) < 1e-9)
        );
        const unics = [...new Set(reals.map(x => Math.round(x * 1e6) / 1e6))].sort((a, b) => a - b);
        const okText = z.opcions.find(o => o[0] === 'ok')[1];
        const xs = [...okText.matchAll(/x = (-?\d+)/g)].map(m => Number(m[1])).sort((a, b) => a - b);
        nota(JSON.stringify(unics) === JSON.stringify(xs), `zeros (opcions): model ${unics}, opció ${okText}: ${et}`);
    }
    // La taula: el signe de l'expressió a cada interval i a cada punt
    const t = passos.taula.plantilla[0].taula;
    const signes = passos.taula.solucio.taula.files.s;
    t.columnes.forEach((c, i) => {
        if (c.tipus === 'interval') {
            const x =
                c.a === -Infinity && c.b === Infinity
                    ? 0.37
                    : c.a === -Infinity
                      ? c.b - 0.7
                      : c.b === Infinity
                        ? c.a + 0.7
                        : (c.a + c.b) / 2;
            const v = f({ x });
            nota(signes[i] === (v > 0 ? 'mes' : 'menys'), `taula, interval ${c.text}: ${et}`);
        } else {
            const x = Number(c.text.replace('−', '-'));
            const v = f({ x });
            nota(
                signes[i] === (Number.isFinite(v) ? (Math.abs(v) < 1e-9 ? 'zero' : '?') : 'no'),
                `taula, punt ${c.text}: ${et}`
            );
        }
    });
    // La recta: cada tram i cada punt, si hi compleix
    const { punts } = passos.trams.plantilla[0].trams;
    const sol = passos.trams.solucio.rt;
    const vs = punts.map(p => p.v);
    sol.trams.forEach((marcat, k) => {
        const a = k === 0 ? -Infinity : vs[k - 1];
        const b = k === vs.length ? Infinity : vs[k];
        const x =
            a === -Infinity && b === Infinity
                ? 0.37
                : a === -Infinity
                  ? b - 0.7
                  : b === Infinity
                    ? a + 0.7
                    : (a + b) / 2;
        nota(marcat === original(x), `recta, tram ${k}: ${et}`);
    });
    sol.inclosos.forEach((inc, k) => nota(inc === original(vs[k]), `recta, punt ${vs[k]}: ${et}`));
    // L'interval: la correcta és el conjunt de la inequació; cap falsa no ho és
    for (const o of passos.interval.opcions) {
        const eq = iguals(conjunt(o[1]), original);
        nota(eq === (o[0] === 'ok'), `interval: ${o[0]} ${o[1]} ${eq ? 'és' : 'no és'} la solució: ${et}`);
    }
}

suite('1. Milers d’inequacions contra el model');
{
    const tipus = {};
    let n = 0;
    for (const nivell of [1, 2, 3])
        for (let i = 0; i < 800; i++) {
            const q = generaPreguntaNL(nivell);
            tipus[q.tipus] = (tipus[q.tipus] || 0) + 1;
            comprova(q);
            n++;
        }
    ok(
        `${n} inequacions: tot a un costat, zeros, taula, recta i interval, tot correcte`,
        !errors.length,
        errors.slice(0, 6).join('\n      → ')
    );
    ok(`surten els 7 tipus (${JSON.stringify(tipus)})`, Object.keys(tipus).length === 7);
    const conjunts = new Set();
    for (let i = 0; i < 300; i++) {
        const q = generaPreguntaNL(3);
        conjunts.add(q.conjunt.replace(/-?\d+/g, 'a'));
    }
    ok(
        `nivell 3: ℝ, ∅, {a} i ℝ − {a} (${[...conjunts].join(' · ')})`,
        ['\\mathbb{R}', '\\varnothing', '\\{a\\}', '(-\\infty, a) \\cup (a, +\\infty)'].every(c => conjunts.has(c))
    );
}

suite('2. El diagnòstic dels errors típics');
{
    const falten = [];
    const vistos = new Set();
    const prova = (pas, valors, codi, et) => {
        const d = diagnosticaIQ(pas, valors);
        vistos.add(d && d.errorType);
        if (!d || d.errorType !== codi || !d.missatge) falten.push(`${et}: esperat ${codi}, surt ${d && d.errorType}`);
    };
    for (const nivell of [1, 2, 3])
        for (let i = 0; i < 300; i++) {
            const q = generaPreguntaNL(nivell);
            for (const p of q.passos) {
                const b = bona(p);
                if (p.mena === 'tria')
                    for (const o of p.opcions)
                        if (o[0] !== 'ok') prova(p, { tria: o[0] }, o[0].split('#')[0], `${q.tex} ${o[1]}`);
                if (p.mena === 'zerosNL') {
                    const [r1, r2] = p.dades.arrels;
                    if (r1 + r2 !== 0) prova(p, { x1: -r1, x2: -r2 }, 'SIGNE_ZEROS', q.tex);
                }
                if (p.mena === 'zerosFraccio') {
                    prova(p, { n: p.solucio.d, d: p.solucio.n }, 'ZEROS_GIRATS', q.tex);
                    if (p.solucio.n !== 0 && -p.solucio.n !== p.solucio.d)
                        prova(p, { n: -p.solucio.n, d: p.solucio.d }, 'SIGNE_ZEROS', q.tex);
                }
                if (p.mena === 'taulaNL') {
                    const s = b.taula.files.s;
                    const den = s.indexOf('no');
                    if (den >= 0) {
                        const m = JSON.parse(JSON.stringify(b.taula));
                        m.files.s[den] = 'zero';
                        prova(p, { taula: corregeixPas(p, { taula: m }).valors.taula }, 'DEN_ZERO_TAULA', q.tex);
                    }
                    const m = JSON.parse(JSON.stringify(b.taula));
                    m.files.s[0] = m.files.s[0] === 'mes' ? 'menys' : 'mes';
                    prova(p, { taula: corregeixPas(p, { taula: m }).valors.taula }, 'SIGNE_TAULA', q.tex);
                    const cols = p.plantilla[0].taula.columnes;
                    if (cols.length > 1) {
                        const m2 = JSON.parse(JSON.stringify(b.taula));
                        m2.p0 = String(cols[0].b + 1);
                        prova(p, { taula: corregeixPas(p, { taula: m2 }).valors.taula }, 'PROVA_FORA', q.tex);
                    }
                }
                if (p.mena === 'trams') {
                    const { trams, inclosos, punts } = p.dades;
                    const rt = (tr, inc) => ({ rt: { trams: tr, inclosos: inc } });
                    if (trams.length > 1)
                        prova(
                            p,
                            rt(
                                trams.map(t => !t),
                                inclosos
                            ),
                            'TRAMS_SENTIT',
                            q.tex
                        );
                    const den = punts.findIndex(x => x.den);
                    if (den >= 0)
                        prova(
                            p,
                            rt(
                                trams,
                                inclosos.map((v, k) => v || k === den)
                            ),
                            'DEN_INCLOS',
                            q.tex
                        );
                    const num = punts.findIndex(x => !x.den);
                    if (num >= 0)
                        prova(
                            p,
                            rt(
                                trams,
                                inclosos.map((v, k) => (k === num ? !v : v))
                            ),
                            inclosos[num] ? 'PUNT_BUIT' : 'PUNT_PLE',
                            q.tex
                        );
                    if (trams.length === 3 && trams[0] && trams[2] && !trams[1])
                        prova(p, rt([false, false, true], inclosos), 'ARREL_UN_COSTAT', q.tex);
                }
            }
        }
    ok('cada error típic fet a mà dona el seu diagnòstic', !falten.length, falten.slice(0, 6).join('\n      → '));
    const clau = [
        'ARREL_UN_COSTAT',
        'DEN_INCLOS',
        'MULTIPLICA_DEN',
        'PUNT_PLE',
        'PUNT_BUIT',
        'TRAMS_SENTIT',
        'DIVIDEIX_X',
        'RESTA_SENSE_DEN',
        'SENSE_ZEROS_REALS',
        'ZERO_DOBLE',
        'DEN_ZERO_TAULA',
        'PROVA_FORA',
        'ZEROS_GIRATS',
        'SIGNE_ZEROS',
        'CLAUDATOR',
    ];
    ok(
        'surten els errors que va aprovar el David (E1) i els de cada pas',
        clau.every(c => vistos.has(c)),
        clau.filter(c => !vistos.has(c)).join(', ')
    );
    ok(
        'cada error té etiqueta i missatge',
        Object.values(w.ERRORS_NL).every(e => e.etiqueta && e.missatge)
    );
    // Mutacions
    errors.length = 0;
    let q;
    do q = generaPreguntaNL(2);
    while (!q.passos.find(p => p.mena === 'trams').dades.punts.some(p => p.den));
    const tr = q.passos.find(p => p.mena === 'trams');
    tr.solucio.rt.inclosos = tr.solucio.rt.inclosos.map(() => true);
    comprova(q);
    ok(
        'mutació: un zero del denominador inclòs a la recta es detecta',
        errors.some(e => /recta, punt/.test(e))
    );
    errors.length = 0;
    q = generaPreguntaNL(1);
    const ta = q.passos.find(p => p.mena === 'taulaNL');
    ta.solucio.taula.files.s[0] = ta.solucio.taula.files.s[0] === 'mes' ? 'menys' : 'mes';
    comprova(q);
    ok(
        'mutació: un signe equivocat a la taula es detecta',
        errors.some(e => /taula, interval/.test(e))
    );
}

suite('3. La recta amb trams, nivells, controlador i índex');
{
    const svg = svgRectaTrams({
        punts: [
            { v: -2, text: '−2' },
            { v: 3, text: '3' },
        ],
        trams: [true, false, true],
        inclosos: [true, false],
        interactiva: true,
    });
    ok(
        'SVG: dos trams marcats, un punt ple i un de buit, 3 zones de tram i 2 de punt',
        (svg.match(/jp-r-raig/g) || []).length === 2 &&
            /jp-r-ple/.test(svg) &&
            /jp-r-buit/.test(svg) &&
            (svg.match(/data-t=/g) || []).length === 3 &&
            (svg.match(/data-p=/g) || []).length === 2
    );
    ok(
        'sense tocar res, incomplet',
        llegeixTrams({ trams: [false], inclosos: [], tocat: false }).estat === 'incomplet'
    );
    const buida = llegeixTrams({ trams: [true, false], inclosos: [true], buida: true, tocat: true });
    ok('«Cap solució» ho buida tot', buida.valor && buida.valor.trams.every(t => !t) && !buida.valor.inclosos[0]);
    const per = { 1: new Set(), 2: new Set(), 3: new Set() };
    for (const n of [1, 2, 3]) for (let i = 0; i < 300; i++) per[n].add(generaPreguntaNL(n).tipus);
    ok(
        'nivell 1: de 2n grau; 2: racionals; 3: casos especials',
        [...per[1]].sort().join() === 'perX,quadrat,quadratica' &&
            [...per[2]].sort().join() === 'fraccio,fraccioK' &&
            [...per[3]].sort().join() === 'doble,sensZeros'
    );
    const ctl = fs.readFileSync(path.join(ROOT, 'js/inequacions/inequacions.js'), 'utf8');
    ok(
        'el controlador llegeix ?tipus= i canvia el subtítol',
        /'segon-grau': 1, '?racionals'?: 2, '?especials'?: 3/.test(ctl) &&
            /'no-lineals'/.test(ctl) &&
            /subtitol/.test(ctl)
    );
    const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const linia = (/'inequacions\.html': \[\s*\n([^\n]*)/.exec(index) || [])[1] || '';
    ok(
        'index.html: les opcions de 2n grau i racionals a «Inequacions»',
        ['no-lineals', 'segon-grau', 'racionals', 'especials'].every(t => linia.includes(`['${t}', `))
    );
    ok(
        'codi IQ (A2): inequacions.html continua donant codi',
        !/senseCodi/.test(fs.readFileSync(path.join(ROOT, 'inequacions.html'), 'utf8'))
    );
}

finish('INEQUACIONS DE 2n GRAU I RACIONALS');
