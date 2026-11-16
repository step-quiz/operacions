/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/fraccio-decimal-percentatge.test.js
 * ROL: Tests de «Fracció, decimal i percentatge» (js/fraccio-decimal-percentatge/),
 *      dels decimals amb període de la correcció comuna (js/passos/correccio.js) i
 *      de les figures de fraccions (js/passos/figura-fraccio.js).
 * ARQUITECTURA:
 * - L'expansió decimal es comprova tornant-la a llegir com ho faria l'alumne.
 * - Es generen milers de preguntes de cada nivell i modalitat: la resposta bona
 *   (també escrita d'altres maneres equivalents) s'accepta; les targetes i els
 *   valors falsos, mai.
 * - Cada error de la taxonomia es provoca a mà, a les dues modalitats.
 * ÚS: node tests/fraccio-decimal-percentatge.test.js
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
        'js/passos/figura-fraccio.js',
        'js/passos/correccio.js',
        'js/fraccio-decimal-percentatge/strings.js',
        'js/fraccio-decimal-percentatge/math-engine.js',
        'js/fraccio-decimal-percentatge/errors.js',
    ],
    { seed: 2026 }
);
const { ERRORS_FD } = w;
const PER_COMBINACIO = 800;
const BAD_TEXT = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b/;
const iguals = (x, y) => w.racionalsIguals(x, y);

// Com escriuria l'alumne un decimal: { v: '0,1', p: '6' }
function escriuDecimal(q) {
    const { enter, ante, periode } = w.expansioFD(q);
    return { v: ante ? `${enter},${ante}` : String(enter), p: periode };
}
// La resposta bona d'un pas (modalitat b)
function respostaB(pas) {
    const r = {};
    for (const [col, tipus] of Object.entries(pas.camps)) {
        const s = pas.solucio[col];
        if (tipus === 'racional') r[col] = { n: String(s[0]), d: String(s[1]) };
        else if (tipus === 'decimal') r[col] = escriuDecimal(s);
        else r[col] = String(s);
    }
    return r;
}

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Decimals, períodes i figures');
{
    eq('0,25 → 1/4', String(w.llegeixDecimal('0,25')), '1,4');
    eq('0,1 i període 6 → 1/6', String(w.llegeixDecimal('0,1', '6')), '1,6');
    eq('0, i període 3 → 1/3', String(w.llegeixDecimal('0,', '3')), '1,3');
    eq('2 i període 3 → 7/3', String(w.llegeixDecimal('2', '3')), '7,3');
    eq('0.5 (amb punt) → 1/2', String(w.llegeixDecimal('0.5')), '1,2');
    ok(
        '«0,3,4», «abc» i un període amb lletres no són decimals',
        [w.llegeixDecimal('0,3,4'), w.llegeixDecimal('abc'), w.llegeixDecimal('0,1', '6a')].every(x => x === null)
    );
    eq('5/12 = 0,41(6)', w.texDecimalFD([5, 12]), '0{,}41\\overline{6}');
    eq('4/11 = 0,(36)', w.texDecimalFD([4, 11]), '0{,}\\overline{36}');
    eq('5/4 = 1,25', w.texDecimalFD([5, 4]), '1{,}25');
    let dolents = [];
    for (let d = 1; d <= 60; d++)
        for (let n = 1; n <= 3 * d; n++) {
            if (w.gcd(n, d) !== 1) continue;
            const e = escriuDecimal([n, d]);
            if (e.p.length > 6) continue; // (les caselles admeten 6 xifres; 1/17 té un període de 16)
            if (!iguals(w.llegeixDecimal(e.v, e.p), [n, d])) dolents.push(`${n}/${d}`);
        }
    ok(
        'l’expansió de totes les fraccions n/d (d ≤ 60, n ≤ 3d) es torna a llegir igual',
        !dolents.length,
        dolents.slice(0, 5).join(', ')
    );
    const svg = w.svgFiguraFraccio({ parts: 4, unitats: 2, pintades: 5 });
    eq('figura de 5/4: 8 parts', (svg.match(/data-part=/g) || []).length, 8);
    eq('figura de 5/4: 5 pintades', (svg.match(/jp-ple/g) || []).length, 5);
    ok('la figura d’una unitat sencera és un cercle', /<circle/.test(w.svgFiguraFraccio({ parts: 1, pintades: 1 })));
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. Preguntes generades');
{
    for (const modalitat of ['a', 'b']) {
        for (const nivell of [1, 2, 3]) {
            const errors = [];
            const vistes = new Set();
            const donades = new Set();
            for (let i = 0; i < PER_COMBINACIO && errors.length < 3; i++) {
                const q = w.generaPreguntaFD(nivell, modalitat);
                const err = msg => errors.push(`${q.text}: ${msg}`);
                const [pas] = q.passos;
                const [n, d] = q.valor;
                vistes.add(q.clau);
                donades.add(q.donada);
                if (w.gcd(n, d) !== 1 || !(n > 0) || n / d > 2.5) err('nombre');
                if (w.esPeriodicFD(q.valor) !== (nivell === 3)) err('periòdic a un nivell que no toca (o al revés)');
                if (BAD_TEXT.test(pas.linia) || BAD_TEXT.test(q.text)) err('escriptura');
                if (!!w.figuraFD(q.valor) !== d <= 12) err('dibuix');
                const columnes = pas.plantilla.map(g => g.titol);
                if (columnes.length !== (d <= 12 ? 4 : 3)) err('columnes');
                if (Object.keys(pas.camps).length !== columnes.length - 1) err('camps');
                // Valors falsos: mai el bo
                const bons = w.valorsFD(q.valor);
                for (const [col, llista] of Object.entries(pas.dades.distractors))
                    for (const [valor] of llista)
                        if (col === 'dibuix' ? valor === bons.dibuix : iguals(valor, bons[col]))
                            err(`distractor bo a ${col}`);
                if (modalitat === 'a') {
                    const ids = pas.fitxes.map(f => f.id);
                    if (new Set(ids).size !== ids.length) err('targetes repetides');
                    if (Object.values(pas.solucio).some(id => !ids.includes(id))) err('falta una targeta bona');
                    const perColumna = {};
                    for (const f of pas.fitxes) {
                        const info = pas.dades.fitxes[f.id];
                        const contingut = f.tex || f.svg;
                        (perColumna[info.columna] = perColumna[info.columna] || []).push(contingut);
                        if (BAD_TEXT.test(contingut) || BAD_TEXT.test(info.text)) err('targeta mal escrita');
                    }
                    for (const [col, llista] of Object.entries(perColumna))
                        if (new Set(llista).size !== llista.length) err(`dues targetes iguals a ${col}`);
                    if (w.corregeixPas(pas, { ...pas.solucio }).estat !== 'ok') err('la resposta bona no s’accepta');
                    const [c1, c2] = Object.keys(pas.camps);
                    if (
                        w.corregeixPas(pas, { ...pas.solucio, [c1]: pas.solucio[c2], [c2]: pas.solucio[c1] }).estat !==
                        'error'
                    )
                        err('targetes intercanviades acceptades');
                } else {
                    const r = respostaB(pas);
                    if (w.corregeixPas(pas, r).estat !== 'ok')
                        err(`la resposta bona dona ${w.corregeixPas(pas, r).estat}`);
                    // També s'accepta escrit d'una altra manera: un zero de més, o el període allargat
                    const altra = JSON.parse(JSON.stringify(r));
                    for (const col of ['decimal', 'percentatge']) {
                        if (!altra[col]) continue;
                        if (altra[col].p)
                            altra[col] = {
                                v: altra[col].v.includes(',')
                                    ? altra[col].v + altra[col].p
                                    : `${altra[col].v},${altra[col].p}`,
                                p: altra[col].p,
                            };
                        else altra[col].v += altra[col].v.includes(',') ? '0' : ',0';
                    }
                    if (w.corregeixPas(pas, altra).estat !== 'ok') err(`no accepta ${JSON.stringify(altra)}`);
                    if (pas.camps.dibuix && !(pas.figura && pas.figura.parts === d)) err('figura per pintar');
                    if (BAD_TEXT.test(w.textRespostaFD(pas, w.corregeixPas(pas, r).valors))) err('text de la resposta');
                }
            }
            ok(
                `modalitat ${modalitat}, nivell ${nivell}: ${PER_COMBINACIO} preguntes (${vistes.size} de diferents; es dona ${[...donades].sort().join(', ')})`,
                !errors.length && vistes.size >= 15,
                errors.join(' | ')
            );
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Diagnòstic: cada error típic, a mà');
{
    const provocats = new Set();
    function prova(titol, pas, resp, esperat) {
        const r = w.corregeixPas(pas, resp);
        const d = r.estat === 'error' ? w.diagnosticaFD(pas, r.valors) : null;
        if (d) provocats.add(d.errorType);
        eq(titol, d ? d.errorType : `(${r.estat}, sense diagnòstic)`, esperat);
    }
    const B = (v, donada) => w.preguntaFD(v, donada, 'b').passos[0];
    const quart = B([1, 4], 'fraccio'); // 1/4 → 0,25 · 25 % · dibuix 1 de 4
    const bona = respostaB(quart);
    const amb = (col, valor) => ({ ...bona, [col]: valor });
    prova('1/4 = 0,4', quart, amb('decimal', { v: '0,4' }), 'FRACCIO_COMA');
    prova('1/4 = 0,14', quart, amb('decimal', { v: '0,14' }), 'FRACCIO_COMA');
    prova('1/4 = 25 (decimal)', quart, amb('decimal', { v: '25' }), 'PER_100');
    prova('1/4 = 2,5', quart, amb('decimal', { v: '2,5' }), 'COMA');
    prova('1/4 = 4 %', quart, amb('percentatge', { v: '4' }), 'DEN_PERCENT');
    prova('1/4 = 0,25 %', quart, amb('percentatge', { v: '0,25' }), 'PER_100');
    prova('pintar les parts que no són', quart, amb('dibuix', '3'), 'COMPLEMENT');
    prova('pintar-les totes', quart, amb('dibuix', '4'), 'PARTS');
    const decimal = B([1, 4], 'decimal');
    prova('0,25 = 1/25', decimal, { ...respostaB(decimal), fraccio: { n: '1', d: '25' } }, 'DECIMAL_DEN');
    prova('0,25 = 4/1', decimal, { ...respostaB(decimal), fraccio: { n: '4', d: '1' } }, 'INVERSA');
    const mig = B([1, 2], 'percentatge');
    prova('50 % = 1/50', mig, { ...respostaB(mig), fraccio: { n: '1', d: '50' } }, 'PERCENT_DEN');
    const sise = w.preguntaFD([1, 6], 'fraccio', 'b', { periode: true }).passos[0];
    prova('1/6 = 0,16 (sense període)', sise, { ...respostaB(sise), decimal: { v: '0,16', p: '' } }, 'PERIODE');
    eq(
        '1/6 = 0,1 amb període 6 → correcte',
        w.corregeixPas(sise, { ...respostaB(sise), decimal: { v: '0,1', p: '6' } }).estat,
        'ok'
    );
    eq(
        '2/8 → avís de simplificar',
        w.corregeixPas(decimal, { ...respostaB(decimal), fraccio: { n: '2', d: '8' } }).codi,
        'NO_SIMPLIFICADA'
    );
    eq(
        '«0,2,5» → avís de decimal mal escrit',
        w.corregeixPas(quart, amb('decimal', { v: '0,2,5' })).codi,
        'NO_DECIMAL'
    );
    eq('el dibuix sense pintar → incomplet', w.corregeixPas(quart, amb('dibuix', '0')).estat, 'incomplet');
    // Modalitat a: cada targeta falsa porta el seu error, i una targeta d'una altra columna és COLUMNA
    const A = w.preguntaFD([1, 4], 'fraccio', 'a').passos[0];
    const errorsTargetes = new Set();
    for (const [id, f] of Object.entries(A.dades.fitxes)) {
        if (!f.errorType) continue;
        const d = w.diagnosticaFD(A, { ...A.solucio, [f.columna]: id });
        if (d && d.errorType === f.errorType) errorsTargetes.add(f.errorType);
    }
    ok(
        `modalitat a: cada targeta falsa dona el seu error (${[...errorsTargetes].join(', ')})`,
        errorsTargetes.size >= 4
    );
    const decimalBo = A.solucio.decimal;
    prova(
        'modalitat a: el decimal a la casella del percentatge',
        A,
        { ...A.solucio, percentatge: decimalBo, decimal: A.solucio.percentatge },
        'COLUMNA'
    );

    const sense = Object.keys(ERRORS_FD).filter(k => !provocats.has(k));
    ok(
        `els ${Object.keys(ERRORS_FD).length} errors de la taxonomia tenen una prova`,
        !sense.length,
        `sense prova: ${sense}`
    );

    // Respostes equivocades a l'atzar: cap s'accepta i el diagnòstic mai peta
    const fuzz = [];
    let diagnosticades = 0;
    for (let i = 0; i < 2000 && fuzz.length < 3; i++) {
        const q = w.generaPreguntaFD(1 + (i % 3), i % 2 ? 'a' : 'b');
        const [pas] = q.passos;
        const cols = Object.keys(pas.camps);
        const col = cols[(i >> 1) % cols.length];
        const resp = pas.dades.modalitat === 'a' ? { ...pas.solucio } : respostaB(pas);
        if (pas.camps[col] === 'fitxa') resp[col] = pas.fitxes.find(f => f.id !== pas.solucio[col]).id;
        else if (pas.camps[col] === 'racional')
            resp[col] = { n: String(pas.solucio[col][0] + 1), d: String(pas.solucio[col][1]) };
        else if (pas.camps[col] === 'decimal')
            resp[col] = escriuDecimal([pas.solucio[col][0] + pas.solucio[col][1], pas.solucio[col][1]]);
        else resp[col] = String(pas.solucio[col] + 1);
        const r = w.corregeixPas(pas, resp);
        if (r.estat !== 'error') fuzz.push(`${q.text} · ${col}: ${r.estat}`);
        let d;
        try {
            d = w.diagnosticaFD(pas, r.valors);
        } catch (e) {
            fuzz.push(`el diagnòstic peta: ${e.message}`);
        }
        if (d) diagnosticades++;
    }
    ok(
        `2000 respostes equivocades a l'atzar: cap s'accepta (${diagnosticades} amb diagnòstic)`,
        !fuzz.length,
        fuzz.join(' | ')
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite("4. Generador d'enllaços");
{
    const dades = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    const { OPCIONS_ACTIVITAT, ACTIVITIES_ESO } = vm.runInNewContext(
        `${dades}\n({ OPCIONS_ACTIVITAT, ACTIVITIES_ESO });`
    );
    const opcio = (OPCIONS_ACTIVITAT['fraccio-decimal-percentatge.html'] || []).find(o => o.param === 'modalitat');
    eq(
        'index.html: «modalitat» a (arrossegar) i b (escriure)',
        opcio ? opcio.valors.map(([v]) => v).join() : '',
        'a,b'
    );
    const entrada = ACTIVITIES_ESO.find(a => a.file === 'fraccio-decimal-percentatge.html');
    ok(
        "és al menú d'ESO, amb nivells i sessions fixes",
        !!entrada && entrada.difficulty === true && entrada.fixed === true
    );
    const controlador = fs.readFileSync(
        path.join(ROOT, 'js/fraccio-decimal-percentatge/fraccio-decimal-percentatge.js'),
        'utf8'
    );
    ok(
        'el controlador genera les preguntes a generaPregunta (dins de buildLevel)',
        /generaPregunta\([^)]*\) \{[\s\S]*?generaPreguntaFD\(/.test(controlador)
    );
}

finish('TESTS DE FRACCIÓ, DECIMAL I PERCENTATGE');
