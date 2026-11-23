/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/cilindres.test.js
 * ROL: Tests de «Cilindres amb un full» (js/cilindres/: math-engine.js, errors.js).
 * ARQUITECTURA:
 * - 1. Centenars de fulls: tres alumnes simulats (arrodoneix a 2 decimals, trunca a 2
 *   decimals, fa servir π ≈ 3,14) fan tots els passos amb correcció amb arrossegament
 *   (refaPassos, com el joc de passos amb enEncertar): cap resposta ben feta no es rebutja;
 *   el volum de l'alumne queda a prop del model propi (V = c²·h / 4π); la comparació és
 *   la del model; cada distractor es diagnostica amb el seu codi; KaTeX dibuixa tot.
 * - 2. Les decisions del David (23/11/2026): el costat és la circumferència; nivell 1 el
 *   full A4 (21 × 30, V₁ ≈ 1 052,8 cm³), nivell 2 altres rectangles; capacitat en mL;
 *   quatre opcions al plegat; la pàgina, el codi CF.
 * ÚS: node tests/cilindres.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');

const w = loadModule(
    [
        'js/utils.js',
        'js/algebra/racionals.js',
        'js/passos/correccio.js',
        'js/cilindres/strings.js',
        'js/cilindres/math-engine.js',
        'js/cilindres/errors.js',
    ],
    { seed: 20261123 }
);
const { generaPreguntaCF, refaPassos, corregeixPas, diagnosticaCF, ERRORS_CF } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));
const model = ({ c, h }) => (c * c * h) / (4 * Math.PI);
const text = v => v.toFixed(2).replace('.', ',');

/** Els tres alumnes: com calculen i com escriuen un nombre amb 2 decimals. */
const ALUMNES = {
    'arrodoneix': { pi: Math.PI, dos: v => Math.round(v * 100) / 100 },
    'trunca': { pi: Math.PI, dos: v => Math.floor(v * 100 + 1e-9) / 100 },
    'pi = 3,14': { pi: 3.14, dos: v => Math.round(v * 100) / 100 },
};

/** Juga una pregunta amb un alumne: torna els errors trobats i el seu volum final de cada cilindre. */
function juga(q, alumne, anota, on) {
    const { pi, dos } = ALUMNES[alumne];
    const meus = {};
    let passos = q.passos;
    for (let i = 0; i < passos.length; i++) {
        const pas = passos[i];
        const k = Number((pas.id.match(/\d$/) || ['0'])[0]);
        const cil = q.dades.cilindres[k - 1];
        let resp;
        if (pas.mena === 'plegat') resp = { tria: pas.solucio.tria };
        else if (pas.mena === 'compara') resp = { tria: meus.V1 > meus.V2 ? 'c1' : 'c2' };
        else {
            let v;
            if (pas.mena === 'radi') v = meus[`r${k}`] = dos(cil.c / (2 * pi));
            else if (pas.mena === 'area') v = meus[`A${k}`] = dos(pi * meus[`r${k}`] ** 2);
            else if (pas.mena === 'volum') v = meus[`V${k}`] = dos(meus[`A${k}`] * cil.h);
            else v = meus[`V${k}`]; // la capacitat en mL: el mateix nombre que el volum
            resp = { r: { v: text(v), p: '' } };
        }
        const r = corregeixPas(pas, resp);
        if (r.estat !== 'ok') {
            anota(`${on} (${alumne}), ${pas.id}: ${JSON.stringify(resp)} → ${r.estat}`);
            return meus;
        }
        const nous = refaPassos(q, pas, r.valors);
        if (nous) passos = nous;
    }
    return meus;
}

suite('1. Centenars de fulls, amb tres alumnes (correcció amb arrossegament)');
{
    const dolents = { rebutjades: [], model: [], errors: [], katex: [] };
    const anota = l => t => l.length < 5 && l.push(t);
    const vistos = new Set();
    let n = 0;
    for (const nivell of [1, 2])
        for (let k = 0; k < (nivell === 1 ? 20 : 300); k++) {
            n++;
            const q0 = generaPreguntaCF(nivell);
            const on = `${q0.dades.a} × ${q0.dades.b}`;
            for (const alumne of Object.keys(ALUMNES)) {
                const q = JSON.parse(JSON.stringify(q0));
                const meus = juga(q, alumne, anota(dolents.rebutjades), on);
                q.dades.cilindres.forEach((cil, i) => {
                    const V = meus[`V${i + 1}`];
                    if (V === undefined || Math.abs(V - model(cil)) / model(cil) > 0.012)
                        anota(dolents.model)(`${on} (${alumne}): V${i + 1} = ${V}, model ${model(cil).toFixed(2)}`);
                });
            }
            // Cada distractor (amb la cadena bona) es diagnostica amb el seu codi
            const q = JSON.parse(JSON.stringify(q0));
            for (const pas of q.passos) {
                for (const [v, codi] of pas.dades.distractors.tria || pas.dades.distractors.r || []) {
                    vistos.add(codi);
                    const resp = pas.camps.tria
                        ? { tria: v }
                        : { r: { v: text(Array.isArray(v) ? v[0] / v[1] : v), p: '' } };
                    const r = corregeixPas(pas, resp);
                    const d = r.estat === 'error' ? diagnosticaCF(pas, r.valors) : null;
                    if (!d || d.errorType !== codi || !ERRORS_CF[codi])
                        anota(dolents.errors)(
                            `${on}, ${pas.id}: ${JSON.stringify(resp)} → ${r.estat} ${d && d.errorType} (${codi})`
                        );
                }
                for (const t of [pas.linia, ...pas.plantilla.filter(p => p.tex).map(p => p.tex)].filter(Boolean))
                    if (k % 10 === 0 && !katexOk(t)) anota(dolents.katex)(`${on}, ${pas.id}: ${t}`);
            }
            if (k % 10 === 0 && !katexOk(q0.formula.tex)) anota(dolents.katex)('fórmules');
        }
    const msg = l => l.join('\n      → ');
    ok(
        `${n} fulls × 3 alumnes: cap resposta ben feta no es rebutja (arrodonir, truncar, π ≈ 3,14)`,
        !dolents.rebutjades.length,
        msg(dolents.rebutjades)
    );
    ok('el volum de l’alumne queda a prop del model (V = c²·h / 4π)', !dolents.model.length, msg(dolents.model));
    ok('cada distractor és un error i el diagnòstic en reconeix el codi', !dolents.errors.length, msg(dolents.errors));
    ok('KaTeX dibuixa totes les fórmules', !dolents.katex.length, msg(dolents.katex));
    const sobren = Object.keys(ERRORS_CF).filter(c => !vistos.has(c));
    ok('surten tots els errors', !sobren.length, sobren.join(', '));
}

suite('2. Les decisions del David');
{
    const q = generaPreguntaCF(1);
    eq('nivell 1: el full A4, 21 × 30', `${q.dades.a} × ${q.dades.b}`, '21 × 30');
    const [c1, c2] = q.dades.cilindres;
    ok(
        'al full A4, el cilindre 1 fa la volta amb 21 cm i té 30 cm d’altura (l’enunciat del David)',
        c1.c === 21 && c1.h === 30 && c2.c === 30 && c2.h === 21
    );
    ok(
        `V₁ ≈ 1052,8 cm³ i V₂ ≈ 1504,0 cm³ (model: ${model(c1).toFixed(1)} i ${model(c2).toFixed(1)})`,
        Math.abs(model(c1) - 1052.8) < 0.1 && Math.abs(model(c2) - 1504.0) < 0.1
    );
    const radi = q.passos.find(p => p.id === 'radi1');
    ok(
        'el radi surt de 2πr = costat (circumferència, no diàmetre)',
        Math.abs(radi.solucio.r[0] / radi.solucio.r[1] - 21 / (2 * Math.PI)) < 0.01
    );
    const plegat = q.passos.find(p => p.mena === 'plegat');
    eq('el plegat té quatre opcions', plegat.opcions.length, 4);
    ok(
        'la capacitat es diu en mL i el volum en cm³',
        q.passos.filter(p => p.mena === 'capacitat').every(p => /mL/.test(p.linia)) &&
            q.passos.filter(p => p.mena === 'volum').every(p => /cm\}\^3/.test(p.linia))
    );
    let amples = 0;
    for (let k = 0; k < 200; k++) {
        const q2 = generaPreguntaCF(2);
        if (q2.dades.a === 21 && q2.dades.b === 30) amples = -1000;
        if (q2.dades.cilindres[0].c > q2.dades.cilindres[1].c) amples++;
    }
    ok(
        `nivell 2: altres rectangles, i el cilindre ample no és sempre el 2 (${amples} de 200 el primer)`,
        amples > 40 && amples < 160
    );
    const html = fs.readFileSync(path.join(ROOT, 'cilindres.html'), 'utf8');
    ok(
        'la pàgina: tema de geometria, el controlador i amb codi',
        /tema-geometria/.test(html) && /js\/cilindres\/cilindres\.js/.test(html) && !/senseCodi/.test(html)
    );
    ok(
        'codi d’exercici CF',
        /'cilindres': 'CF'/.test(fs.readFileSync(path.join(ROOT, 'js/exercise-codes.js'), 'utf8'))
    );
    ok(
        'la figura: el full i els dos cilindres',
        /jp-cf-full/.test(q.svg) && (q.svg.match(/<ellipse/g) || []).length === 2
    );
}

finish('TESTS DE CILINDRES AMB UN FULL');
