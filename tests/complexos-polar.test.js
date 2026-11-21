/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/complexos-polar.test.js
 * ROL: Tests de les pestanyes «Forma polar» i «Potències i arrels» de complexos.html
 *      (js/complexos/polar-engine.js, pla-complex.js).
 * - 1. Milers d'exercicis dels cinc apartats i els dos nivells, contra un model
 *      independent (tests/complexos-polar-model.js) que llegeix l'enunciat en TeX i ho
 *      calcula amb aritmètica complexa: quadrant, mòdul, argument (entre 0° i 360°),
 *      binòmica, producte i quocient, De Moivre (i el resultat en binòmica) i arrels
 *      (cada arrel marcada compleix wⁿ = z). El TeX es dibuixa amb KaTeX.
 * - 2. La correcció amb les respostes com les escriu l'alumne (arrels c√s, decimals
 *      amb coma, 2 decimals): les bones valen; arrels sense simplificar → avís.
 * - 3. El diagnòstic de cada error típic (arctan sense quadrant, sense reduir, sense
 *      arrel al mòdul, sin/cos, signe, arguments multiplicats o dividits, De Moivre,
 *      arrels).
 * - 4. El pla complex (SVG), mutacions, i la pàgina (dues pestanyes, ?pestanya=).
 * ÚS: node tests/complexos-polar.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, finish, loadModule } = require('./harness');
const { respostes, redueix } = require('./complexos-polar-model');

const w = loadModule(
    ['js/utils.js', 'js/complexos/strings-polar.js', 'js/complexos/polar-engine.js', 'js/complexos/pla-complex.js'],
    { seed: 20261121 }
);
const { generaExerciciCx, corregeixPasCx, svgPlaComplex, valorExacte, ERRORS_CX } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));

const APARTATS = ['bin-pol', 'pol-bin', 'prod-quoc', 'potencia', 'arrels'];
const prop = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const angle = (a, b, tol = 1e-6) =>
    Math.min(Math.abs(redueix(a) - redueix(b)), 360 - Math.abs(redueix(a) - redueix(b))) <= tol;
const val = v => (typeof v === 'object' && v !== null ? valorExacte(v) : v);
/** Com ho escriu l'alumne: «2,35» (2 decimals), un enter, o {c, s}. */
const comma = (x, d = 2) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
function respostaBona(pas) {
    const r = {};
    for (const c of pas.camps) {
        const s = pas.solucio[c.nom];
        if (c.tipus === 'arrel') r[c.nom] = { c: String(s.c), s: s.s === 1 ? '' : String(s.s) };
        else if (c.tipus === 'enter') r[c.nom] = String(s);
        else if (c.tipus === 'decimal') r[c.nom] = comma(s);
        else r[c.nom] = s;
    }
    return r;
}

const errors = [];
const nota = (cond, msg) => {
    if (!cond) errors.push(msg);
};

function comprova(ex) {
    const m = respostes(ex.enunciatTex);
    const et = `${ex.apartat} ${ex.nivell}: ${ex.enunciatTex}`;
    nota(m.apartat === ex.apartat, `apartat: ${et}`);
    nota(katexOk(ex.enunciatTex), `KaTeX: ${ex.enunciatTex}`);
    const pas = id => ex.passos.find(p => p.id === id || p.id === `z-${id}`);
    for (const p of ex.passos) {
        nota(katexOk(p.linia), `KaTeX: ${p.linia}`);
        for (const c of p.camps) if (c.etiqueta) nota(katexOk(c.etiqueta), `KaTeX: ${c.etiqueta}`);
        for (const tros of String(p.titol)
            .split('$')
            .filter((_, i) => i % 2))
            nota(katexOk(tros), `KaTeX: ${tros}`);
        nota(corregeixPasCx(p, respostaBona(p)).estat === 'ok', `la resposta bona no val (${p.id}): ${et}`);
    }
    if (m.quadrant) nota(pas('quadrant') && pas('quadrant').solucio.q === m.quadrant, `quadrant: ${et}`);
    else if (m.apartat === 'bin-pol' || m.apartat === 'potencia') nota(!pas('quadrant'), `quadrant en un eix: ${et}`);
    if (m.apartat === 'bin-pol' || m.apartat === 'potencia') {
        nota(prop(val(pas('modul').solucio.r), m.r), `mòdul: ${et}`);
        nota(
            angle(pas('argument').solucio.t, m.t) && pas('argument').solucio.t >= 0 && pas('argument').solucio.t < 360,
            `argument: ${et}`
        );
    }
    if (m.apartat === 'pol-bin') {
        const s = ex.passos[0].solucio;
        nota(prop(val(s.a), m.a, 1e-9) && prop(val(s.b), m.b, 1e-9), `binòmica: ${et}`);
    }
    if (m.apartat === 'prod-quoc') {
        const s = ex.passos[0].solucio;
        nota(prop(s.r, m.r, 1e-9) && angle(s.t, m.t, 1e-6) && s.t >= 0 && s.t < 360, `producte/quocient: ${et}`);
    }
    if (m.apartat === 'potencia') {
        const s = pas('moivre').solucio;
        nota(
            prop(val(s.r), m.rn, 1e-6) && angle(s.t, m.tn, 1e-5) && s.t >= 0 && s.t < 360,
            `De Moivre: ${et} (${val(s.r)} ${s.t} / ${m.rn} ${m.tn})`
        );
        const pb = pas('pot-binomica');
        if (ex.nivell === 1) nota(pb, `nivell 1 sense el resultat en binòmica: ${et}`);
        if (pb) nota(prop(val(pb.solucio.a), m.a, 1e-9) && prop(val(pb.solucio.b), m.b, 1e-9), `zⁿ en binòmica: ${et}`);
    }
    if (m.apartat === 'arrels') {
        const p1 = pas('arrel-modul');
        nota(prop(p1.solucio.r, m.rArrel, 1e-9) && prop(p1.solucio.t, m.t0, 1e-9), `arrels, mòdul i θ₀: ${et}`);
        const p2 = pas('arrel-marques');
        const marques = p2.pla.marques;
        const triades = [0, ...p2.solucio.m].map(i => marques[i]).sort((a, b) => a - b);
        nota(
            triades.length === m.n && triades.every((t, i) => angle(t, [...m.arrels].sort((a, b) => a - b)[i], 1e-6)),
            `arrels marcades: ${et}`
        );
        nota(new Set(marques.map(a => a.toFixed(6))).size === marques.length, `marques repetides: ${et}`);
    }
}

suite('1. Milers d’exercicis, contra el model que llegeix l’enunciat');
{
    let n = 0;
    for (const ap of APARTATS)
        for (const nivell of [1, 2])
            for (let i = 0; i < 600; i++) {
                comprova(generaExerciciCx(ap, nivell));
                n++;
            }
    ok(
        `${n} exercicis (5 apartats × 2 nivells): tots els passos correctes i el TeX es dibuixa`,
        !errors.length,
        errors.slice(0, 6).join('\n      → ')
    );
    const barreja = new Set();
    for (let i = 0; i < 200; i++)
        barreja.add(generaExerciciCx('barreja-polar', 1).apartat).add(generaExerciciCx('barreja-potencies', 2).apartat);
    ok('«Tot barrejat» barreja els apartats de la seva pestanya', barreja.size === 5);
    const angles = new Set();
    for (let i = 0; i < 400; i++) {
        const ex = generaExerciciCx('bin-pol', 1);
        angles.add(ex.passos.find(p => p.id === 'argument').solucio.t);
    }
    ok(
        `nivell 1: angles notables de 30° i 45° (${[...angles].sort((a, b) => a - b).join(', ')})`,
        [...angles].every(t => t % 30 === 0 || t % 45 === 0) && angles.size >= 12
    );
}

suite('2. La correcció com escriu l’alumne');
{
    // 2√2 escrit com √8: el valor és bo, però s'ha de simplificar (avís, sense error)
    let ex;
    do ex = generaExerciciCx('bin-pol', 1);
    while (
        ex.passos.find(p => p.id === 'modul').solucio.r.s !== 2 ||
        ex.passos.find(p => p.id === 'modul').solucio.r.c < 2
    );
    const pm = ex.passos.find(p => p.id === 'modul');
    const { c } = pm.solucio.r;
    const r1 = corregeixPasCx(pm, { r: { c: '', s: String(2 * c * c) } });
    ok('√8 en lloc de 2√2: avís «simplifica», no error', r1.estat === 'avis' && r1.codi === 'SIMPLIFICA');
    const r2 = corregeixPasCx(pm, { r: { c: String(c), s: '' } });
    ok('sense l’arrel (només el coeficient): error', r2.estat === 'error');
    const r3 = corregeixPasCx(pm, { r: { c: '', s: '' } });
    ok('les caselles buides: encara no ha respost', r3.estat === 'incomplet');
    let ex2;
    do ex2 = generaExerciciCx('bin-pol', 2);
    while (!ex2.passos.find(p => p.id === 'argument'));
    const pa = ex2.passos.find(p => p.id === 'argument');
    const t = pa.solucio.t;
    ok(
        'nivell 2: l’argument amb 2 decimals val, i amb 0,1° de diferència no',
        corregeixPasCx(pa, { t: comma(t) }).estat === 'ok' &&
            corregeixPasCx(pa, { t: comma(t + 0.1) }).estat === 'error'
    );
    ok(
        'nivell 2: una coma o un punt decimal, totes dues valen',
        corregeixPasCx(pa, { t: comma(t).replace(',', '.') }).estat === 'ok'
    );
    ok(
        'nivell 2: «3,6a» és un avís (no és un nombre), no un error',
        corregeixPasCx(pa, { t: '3,6a' }).estat === 'avis'
    );
}

suite('3. El diagnòstic de cada error típic');
{
    const falten = [];
    const vistos = new Set();
    const prova = (pas, valors, codi, et) => {
        const r = corregeixPasCx(pas, valors);
        vistos.add(r.codi);
        if (r.estat !== 'error' || r.codi !== codi || !r.missatge)
            falten.push(`${et}: esperat ${codi}, surt ${r.estat} ${r.codi}`);
    };
    for (let i = 0; i < 400; i++) {
        // binòmica → polar, nivell 2 (decimals): arctan, sense reduir, sense arrel
        const ex = generaExerciciCx('bin-pol', 2);
        const d = ex.passos.find(p => p.id === 'modul').dades;
        const pm = ex.passos.find(p => p.id === 'modul');
        prova(pm, { r: comma(d.a * d.a + d.b * d.b) }, 'CX_MODUL_SENSE_ARREL', ex.enunciatTex);
        const pa = ex.passos.find(p => p.id === 'argument');
        const atan = (Math.atan(d.b / d.a) * 180) / Math.PI;
        if (Math.abs(redueix(atan) - d.t) > 1) prova(pa, { t: comma(atan) }, 'CX_ARCTAN', ex.enunciatTex);
        else if (atan < 0) prova(pa, { t: comma(atan) }, 'CX_REDUEIX', ex.enunciatTex);
        prova(pa, { t: comma(d.t + 360) }, 'CX_REDUEIX', ex.enunciatTex);
        // polar → binòmica, nivell 1: sin/cos, signe
        const pb = generaExerciciCx('pol-bin', 1).passos[0];
        const { a, b } = pb.solucio;
        const tx = s => ({ c: String(s.c), s: s.s === 1 ? '' : String(s.s) });
        if (Math.abs(valorExacte(a)) !== Math.abs(valorExacte(b)))
            prova(pb, { a: tx(b), b: tx(a) }, 'CX_SIN_COS', 'pol-bin');
        if (valorExacte(a) !== 0) prova(pb, { a: tx({ c: -a.c, s: a.s }), b: tx(b) }, 'CX_SIGNE', 'pol-bin');
        // producte i quocient
        const pq = generaExerciciCx('prod-quoc', 1).passos[0];
        const { producte, r1, r2, t1, t2 } = pq.dades;
        if (producte) {
            if (t1 * t2 !== pq.solucio.t)
                prova(pq, { r: String(pq.solucio.r), t: String(t1 * t2) }, 'CX_ARG_MULTIPLICA', 'producte');
            if (r1 + r2 !== pq.solucio.r)
                prova(pq, { r: String(r1 + r2), t: String(pq.solucio.t) }, 'CX_MODUL_SUMA_PRODUCTE', 'producte');
            if (t1 + t2 >= 360) prova(pq, { r: String(pq.solucio.r), t: String(t1 + t2) }, 'CX_REDUEIX', 'producte');
        } else {
            if (t1 - t2 < 0) prova(pq, { r: String(pq.solucio.r), t: String(t1 - t2) }, 'CX_REDUEIX', 'quocient');
            if (redueix(t2 - t1) !== pq.solucio.t)
                prova(pq, { r: String(pq.solucio.r), t: String(redueix(t2 - t1)) }, 'CX_ARG_ORDRE', 'quocient');
        }
        // De Moivre (nivell 2): r·n, argument sense multiplicar
        const pm2 = generaExerciciCx('potencia', 2).passos.find(p => p.id === 'moivre');
        const dm = pm2.dades;
        if (Math.abs(dm.n * dm.r - dm.rn) > dm.rn * 0.05)
            prova(pm2, { r: comma(dm.n * dm.r), t: comma(dm.tn) }, 'CX_MOIVRE_MODUL_PER_N', 'moivre');
        if (Math.abs(redueix(dm.t) - dm.tn) > 1)
            prova(pm2, { r: comma(dm.rn), t: comma(dm.t) }, 'CX_MOIVRE_ARGUMENT', 'moivre');
        // Arrels
        const ar = generaExerciciCx('arrels', 1);
        const am = ar.passos[0];
        const da = am.dades;
        if (da.r !== da.rArrel) prova(am, { r: String(da.r), t: String(da.t0) }, 'CX_ARREL_MODUL', 'arrels');
        if (da.t !== 0)
            prova(
                am,
                { r: String(da.rArrel), t: comma(da.t, 2).replace(',00', '') },
                'CX_ARREL_SENSE_DIVIDIR',
                'arrels'
            );
        if (Number.isInteger((da.t + 360) / da.n) && (da.t + 360) / da.n !== da.t)
            prova(am, { r: String(da.rArrel), t: String((da.t + 360) / da.n) }, 'CX_ARREL_K0', 'arrels');
        const mk = ar.passos[1];
        if (mk.solucio.m.length > 1) prova(mk, { m: mk.solucio.m.slice(1) }, 'CX_ARRELS_POQUES', 'arrels');
        prova(mk, { m: mk.solucio.m.map(x => x + 1) }, 'CX_ARRELS_ESPAI', 'arrels');
    }
    ok('cada error típic fet a mà dona el seu diagnòstic', !falten.length, falten.slice(0, 6).join('\n      → '));
    const clau = [
        'CX_ARCTAN',
        'CX_REDUEIX',
        'CX_MODUL_SENSE_ARREL',
        'CX_MOIVRE_MODUL_PER_N',
        'CX_MOIVRE_ARGUMENT',
        'CX_ARG_MULTIPLICA',
        'CX_ARG_ORDRE',
        'CX_ARRELS_POQUES',
        'CX_ARREL_K0',
        'CX_SIN_COS',
    ];
    ok(
        'surten els errors que va aprovar el David (C1)',
        clau.every(c => vistos.has(c)),
        clau.filter(c => !vistos.has(c)).join(', ')
    );
    const sense = Object.entries(ERRORS_CX).filter(([, v]) => !v.etiqueta || !v.missatge);
    ok('cada error té etiqueta i missatge', !sense.length);
}

suite('4. El pla, mutacions i la pàgina');
{
    const svg = svgPlaComplex({ vectors: [{ re: 1, im: -1, etiqueta: 'z' }], quadrants: true });
    ok(
        'el pla amb quadrants: 4 zones per tocar i la fletxa de z',
        (svg.match(/data-q="/g) || []).length === 4 && /marker-end/.test(svg)
    );
    const ar = svgPlaComplex({ cercle: 2, marques: [0, 15, 30], primera: 0, seleccionades: [2], poligon: false });
    ok(
        'les arrels: marques per tocar (sense la primera, que és fixa)',
        (ar.match(/data-m="/g) || []).length === 2 && /cx-marca-fixa/.test(ar)
    );
    // Mutació: un argument equivocat a la solució es detecta
    errors.length = 0;
    const ex = generaExerciciCx('bin-pol', 1);
    ex.passos.find(p => p.id === 'argument').solucio.t = redueix(
        ex.passos.find(p => p.id === 'argument').solucio.t + 180
    );
    comprova(ex);
    ok(
        'mutació: un argument amb 180° de més es detecta',
        errors.some(e => /argument/.test(e))
    );
    errors.length = 0;
    const ex2 = generaExerciciCx('arrels', 2);
    ex2.passos[1].solucio.m = ex2.passos[1].solucio.m.map(x => x + 1);
    comprova(ex2);
    ok(
        'mutació: unes arrels mal marcades es detecten',
        errors.some(e => /arrels marcades/.test(e))
    );
    const html = fs.readFileSync(path.join(ROOT, 'complexos.html'), 'utf8');
    ok(
        'complexos.html: les pestanyes «Forma polar» i «Potències i arrels», sense «aviat»',
        /switchOp\('polar'/.test(html) &&
            /switchOp\('potencies'/.test(html) &&
            !/tab-badge">aviat/.test(html) &&
            /id="panel-polar"/.test(html) &&
            /id="panel-potencies"/.test(html)
    );
    ok(
        'complexos.html carrega KaTeX i css/complexos-polar.css',
        /katex\.min\.js/.test(html) && /complexos-polar\.css/.test(html)
    );
    const js = fs.readFileSync(path.join(ROOT, 'js/complexos/complexos.js'), 'utf8');
    ok(
        'complexos.js obre la pestanya de ?pestanya= i hi passa l’Enter',
        /get\('pestanya'\)/.test(js) && /enterCx\(\)/.test(js)
    );
}

finish('COMPLEXOS: FORMA POLAR I POTÈNCIES');
