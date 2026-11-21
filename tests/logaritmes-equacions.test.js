/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/logaritmes-equacions.test.js
 * ROL: Tests de «Logaritmes i equacions», bloc 2, equacions (js/logaritmes/equacions.js).
 * - 1. Milers d'equacions dels tres nivells contra un model independent
 *      (tests/equacions-model.js) que compila el TeX que veu l'alumne i en busca les
 *      solucions per escombratge: les solucions de l'equació inicial són les que diuen
 *      els passos; l'opció correcta de cada transformació té les solucions que toca i cap
 *      falsa no té les mateixes; les comprovacions (Sí / el motiu) coincideixen amb el
 *      que passa en substituir. 4 opcions (3 a les comprovacions), una correcta; KaTeX;
 *      la resposta bona val (les dues solucions, en qualsevol ordre).
 * - 2. El diagnòstic de cada error típic (E1 del David).
 * - 3. Els nivells, el controlador, la pàgina i l'índex.
 * ÚS: node tests/logaritmes-equacions.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, finish, loadModule } = require('./harness');
const { equacio, solucions, expressioEQ, llistaX } = require('./equacions-model');

const w = loadModule(
    [
        'js/utils.js',
        'js/algebra/racionals.js',
        'js/passos/taula-signes.js',
        'js/passos/correccio.js',
        'js/logaritmes/strings.js',
        'js/logaritmes/math-engine.js',
        'js/logaritmes/equacions.js',
        'js/logaritmes/errors.js',
    ],
    { seed: 20261122 }
);
const { generaPreguntaEQ, diagnosticaEQ, corregeixPas, ERRORS_EQ, TEXTOS_EQ } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));
const num = v => (Array.isArray(v) ? v[0] / v[1] : v);
const mateix = (a, b, tol = 1e-6) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= tol);
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
const O = TEXTOS_EQ.opcions;

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
        if (p.parell) {
            const girat = { x1: p.solucio.x2, x2: p.solucio.x1 };
            nota(corregeixPas(p, girat).estat === 'ok', `${p.id}: en l'altre ordre no val: ${et}`);
        }
        if (p.mena === 'tria') {
            const n = /^comprova/.test(p.id) ? 3 : 4;
            nota(
                p.opcions.length === n && p.opcions.filter(o => o[0] === 'ok').length === 1,
                `${p.id}: opcions: ${et}`
            );
            nota(new Set(p.opcions.map(o => o[1])).size === p.opcions.length, `${p.id}: repetides: ${et}`);
            for (const o of p.opcions) {
                if (o[3]) nota(katexOk(o[3].slice(1, -1)), `KaTeX: ${o[3]}`);
                if (o[0] !== 'ok') nota(ERRORS_EQ[o[0].split('#')[0]], `${p.id}: ${o[0]} sense explicació`);
            }
        }
    }
    // L'equació inicial, resolta pel model
    const eq = expressioEQ(q.tex);
    const rang = q.tipus === 'logSimple' ? { lo: -20, hi: 120 } : {};
    const reals = solucions(eq, rang);
    const { esq, dre } = equacio(eq);
    const passos = Object.fromEntries(q.passos.map(p => [p.id, p]));
    const okDe = p => p.opcions.find(o => o[0] === 'ok');
    const solsOpcio = (p, o, lletra = 'x', lo = rang.lo || -20, hi = rang.hi || 20) =>
        solucions(o[1], { lletra, lo, hi });
    /** La correcta té les solucions esperades i cap falsa no té les mateixes. */
    const transformacio = (p, esperades, lletra = 'x', lo, hi) => {
        const bonaSols = solsOpcio(p, okDe(p), lletra, lo, hi);
        nota(mateix(bonaSols, esperades), `${p.id}: la correcta ${okDe(p)[1]} té ${bonaSols} (${esperades}): ${et}`);
        for (const o of p.opcions)
            if (o[0] !== 'ok') {
                const s = solsOpcio(p, o, lletra, lo, hi);
                nota(!mateix(s, bonaSols), `${p.id}: la falsa ${o[1]} (${o[0]}) té les mateixes solucions: ${et}`);
            }
    };
    if (q.tipus === 'mateixaBase') {
        const x = num(passos.exponents.solucio.x);
        nota(mateix(reals, [x]), `mateixaBase: model ${reals}, passos ${x}: ${et}`);
        transformacio(passos.mateixaBase, [x]);
    }
    if (q.tipus === 'logSimple') {
        const x = num(passos.primerGrau.solucio.x);
        nota(mateix(reals, [x]), `logSimple: model ${reals}, passos ${x}: ${et}`);
        transformacio(passos.treuLog, [x]);
        nota(okDe(passos.comprova0)[1] === O.si, `logSimple: la comprovació no és «Sí»: ${et}`);
    }
    if (q.tipus === 'canvi') {
        const ts = [passos.arrelsT.solucio.x1, passos.arrelsT.solucio.x2].sort((u, v) => u - v);
        transformacio(passos.canvi, ts, 't', -40, 40);
        const xs = llistaX(okDe(passos.desfesCanvi)[1]);
        nota(mateix(reals, xs), `canvi: model ${reals}, opció ${xs}: ${et}`);
        for (const o of passos.desfesCanvi.opcions)
            if (o[0] !== 'ok') nota(!mateix(llistaX(o[1]), reals), `canvi: la falsa ${o[1]} és bona: ${et}`);
        for (const o of passos.desfesCanvi.opcions)
            nota(
                /^(x = -?[\d/]+( i x = -?[\d/]+)*|No té cap solució)$/.test(o[1]),
                `canvi: el text (aria-label) de l'opció no és net: «${o[1]}»: ${et}`
            );
    }
    if (q.tipus === 'prenLogs') {
        nota(reals.length === 1, `prenLogs: ${reals}: ${et}`);
        nota(Math.abs(passos.calculadora.solucio.v - reals[0]) <= 5e-5 + 1e-9, `prenLogs: el valor: ${et}`);
        transformacio(passos.prenLogs, reals);
    }
    if (q.tipus === 'logSuma' || q.tipus === 'irracional') {
        const cands = [passos.arrels.solucio.x1, passos.arrels.solucio.x2].sort((u, v) => u - v);
        transformacio(q.tipus === 'logSuma' ? passos.unLog : passos.eleva, cands);
        const comprovacions = q.passos.filter(p => /^comprova/.test(p.id));
        nota(comprovacions.length === 2, `${q.tipus}: dues comprovacions: ${et}`);
        const acceptades = [];
        for (const p of comprovacions) {
            const x = Number(p.dades.x);
            const e = esq(x);
            const d = dre(x);
            const resposta = okDe(p)[1];
            const es = Number.isFinite(e) && Number.isFinite(d) && Math.abs(e - d) < 1e-9;
            if (es) acceptades.push(x);
            let esperada = O.si;
            if (!es && q.tipus === 'logSuma') esperada = Number.isFinite(e) ? O.noIguals : O.noLog;
            if (!es && q.tipus === 'irracional') esperada = Number.isFinite(e) ? O.noSegon : O.noRadicand;
            nota(
                resposta === esperada,
                `${q.tipus}: comprovar x = ${x}: «${resposta}», hauria de ser «${esperada}»: ${et}`
            );
        }
        nota(
            mateix(
                acceptades.sort((u, v) => u - v),
                reals
            ),
            `${q.tipus}: model ${reals}, acceptades ${acceptades}: ${et}`
        );
        if (q.tipus === 'logSuma') nota(reals.length === 1, `logSuma: una solució bona i una de falsa: ${et}`);
    }
    // Les solucions finals que surten a la darrera línia
    const fi = q.passos[q.passos.length - 1].linia;
    if (q.tipus !== 'prenLogs' && q.tipus !== 'mateixaBase')
        nota(/Solució/.test(fi), `${q.tipus}: la darrera línia no dona la solució: ${et}`);
}

suite('1. Milers d’equacions contra el model que compila el TeX');
{
    const tipus = {};
    let n = 0;
    for (const nivell of [1, 2, 3])
        for (let i = 0; i < 700; i++) {
            const q = generaPreguntaEQ({ nivell });
            tipus[q.tipus] = (tipus[q.tipus] || 0) + 1;
            comprova(q);
            n++;
        }
    ok(
        `${n} equacions: solucions, transformacions, comprovacions i KaTeX, tot correcte`,
        !errors.length,
        errors.slice(0, 6).join('\n      → ')
    );
    ok(`surten els 6 tipus (${JSON.stringify(tipus)})`, Object.keys(tipus).length === 6);
    let falses = 0;
    let dues = 0;
    let negatius = 0;
    for (let i = 0; i < 400; i++) {
        const q = generaPreguntaEQ({ nivell: 3 });
        if (q.solucions.length === 1) falses++;
        else dues++;
        const c = generaPreguntaEQ({ nivell: 2 });
        if (c.tipus === 'canvi' && c.passos[1].solucio.x2 < 0) negatius++;
    }
    ok(
        `irracionals: sovint una solució falsa (${falses}) i de vegades dues de bones (${dues}); canvi amb t < 0 (${negatius})`,
        falses > 150 && dues > 40 && negatius > 10
    );
}

suite('2. El diagnòstic dels errors típics');
{
    const falten = [];
    const vistos = new Set();
    const prova = (pas, valors, codi, et) => {
        const d = diagnosticaEQ(pas, valors);
        vistos.add(d && d.codi);
        if (!d || d.codi !== codi || !d.missatge) falten.push(`${et}: esperat ${codi}, surt ${d && d.codi}`);
    };
    const R = (n, d = 1) => [n, d];
    for (const nivell of [1, 2, 3])
        for (let i = 0; i < 300; i++) {
            const q = generaPreguntaEQ({ nivell });
            for (const p of q.passos) {
                if (p.mena === 'tria')
                    for (const o of p.opcions)
                        if (o[0] !== 'ok') prova(p, { tria: o[0] }, o[0].split('#')[0], `${q.tex} ${o[1]}`);
                const x = p.solucio.x && num(p.solucio.x);
                if (p.id === 'exponents') {
                    const { a, j, p: pp, q: qq } = p.dades;
                    const v = (a ** j - qq) / pp;
                    if (Number.isInteger(v) && Math.abs(v - x) > 1e-9)
                        prova(p, { x: R(v) }, 'EQ_EXPONENT_SENSE_BASE', q.tex);
                }
                if (p.id === 'primerGrau') {
                    const { b, m, p: pp, q: qq } = p.dades;
                    const v = (m * b - qq) / pp;
                    if (Number.isInteger(v) && Math.abs(v - x) > 1e-9) prova(p, { x: R(v) }, 'EQ_LOG_PRODUCTE', q.tex);
                }
                if (p.mena === 'arrels') {
                    const [r1, r2] = p.dades.arrels;
                    if (r1 + r2 !== 0) prova(p, { x1: -r1, x2: -r2 }, 'EQ_SIGNE_ARRELS', q.tex);
                    prova(p, { x1: r1 + 1, x2: r2 }, 'EQ_SEGON_GRAU', q.tex);
                }
                if (p.mena === 'calculadoraEQ') {
                    const { a, N } = p.dades;
                    prova(p, { v: R(Math.round(Math.log10(N / a) * 1e4), 1e4) }, 'EQ_LOG_QUOCIENT', q.tex);
                    if (Number.isInteger(N / a) && Math.abs(N / a - p.dades.x) > 1e-3)
                        prova(p, { v: R(N / a) }, 'EQ_DIVIDEIX', q.tex);
                }
            }
        }
    ok('cada error típic fet a mà dona el seu diagnòstic', !falten.length, falten.slice(0, 6).join('\n      → '));
    const clau = [
        'EQ_EXPONENT_SENSE_BASE',
        'EQ_FALSA',
        'EQ_BONA_DESCARTADA',
        'EQ_T_NEGATIU',
        'EQ_LOG_SUMA',
        'EQ_POTENCIA_DE_POTENCIA',
        'EQ_SIGNE_EXPONENT',
        'EQ_LOG_PRODUCTE',
        'EQ_CANVI_DOBLE',
        'EQ_T_ES_X',
        'EQ_LOG_QUOCIENT',
        'EQ_DIVIDEIX',
        'EQ_QUADRAT_BINOMI',
        'EQ_RADICAND',
        'EQ_MOTIU',
        'EQ_SIGNE_ARRELS',
    ];
    ok(
        'surten els errors que va aprovar el David (E1) i els de cada pas',
        clau.every(c => vistos.has(c)),
        clau.filter(c => !vistos.has(c)).join(', ')
    );
    ok(
        'cada error té etiqueta i missatge',
        Object.values(ERRORS_EQ).every(e => e.etiqueta && e.missatge)
    );
    // Mutacions: una comprovació o una solució equivocades es detecten
    errors.length = 0;
    let q;
    do q = generaPreguntaEQ({ nivell: 3 });
    while (q.solucions.length !== 1);
    const c = q.passos.find(p => /^comprova/.test(p.id) && p.dades.motiu);
    c.opcions = c.opcions.map(o => [o[1] === TEXTOS_EQ.opcions.si ? 'ok' : 'EQ_MOTIU', o[1]]);
    comprova(q);
    ok(
        'mutació: acceptar la solució falsa es detecta',
        errors.some(e => /comprovar x/.test(e))
    );
    errors.length = 0;
    do q = generaPreguntaEQ({ nivell: 1 });
    while (q.tipus !== 'mateixaBase');
    q.passos[1].solucio.x = [q.passos[1].solucio.x[0] + 1, q.passos[1].solucio.x[1]];
    comprova(q);
    ok(
        'mutació: una x equivocada es detecta',
        errors.some(e => /mateixaBase: model/.test(e))
    );
}

suite('3. Nivells, controlador, pàgina i índex');
{
    const per = { 1: new Set(), 2: new Set(), 3: new Set() };
    for (const n of [1, 2, 3]) for (let i = 0; i < 300; i++) per[n].add(generaPreguntaEQ({ nivell: n }).tipus);
    ok(
        'nivell 1: mateixa base i logarítmica senzilla; 2: canvi, propietats i calculadora; 3: irracionals (C1)',
        [...per[1]].sort().join() === 'logSimple,mateixaBase' &&
            [...per[2]].sort().join() === 'canvi,logSuma,prenLogs' &&
            [...per[3]].sort().join() === 'irracional'
    );
    const ctl = fs.readFileSync(path.join(ROOT, 'js/logaritmes/logaritmes.js'), 'utf8');
    ok(
        'el controlador llegeix els tipus d’equacions i canvia el subtítol',
        /basiques: 1, mitjanes: 2, irracionals: 3/.test(ctl) &&
            /'equacions'/.test(ctl) &&
            /subtitol/.test(ctl) &&
            /diagnosticaEQ/.test(ctl)
    );
    const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const opcionsLG = (/'logaritmes\.html': \[\s*\n([^\n]*)/.exec(index) || [])[1] || '';
    ok(
        'index.html: les opcions d’equacions a «Logaritmes i equacions»',
        ['equacions', 'basiques', 'mitjanes', 'irracionals'].every(t => opcionsLG.includes(`['${t}', `))
    );
    const html = fs.readFileSync(path.join(ROOT, 'logaritmes.html'), 'utf8');
    ok('logaritmes.html: sense codi', /senseCodi:\s*true/.test(html));
}

finish('LOGARITMES (EQUACIONS)');
