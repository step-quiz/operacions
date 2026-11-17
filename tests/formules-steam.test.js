/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/formules-steam.test.js
 * ROL: Tests de «Fórmules STEAM» (js/formules-steam/: algebra.js, cataleg.js,
 *      math-engine.js, errors.js).
 * ARQUITECTURA:
 * - Una lectura pròpia del text que veu l'alumne («v · Δt = 120», «½ · m · v²»,
 *   «√(2 · Ec / m) = v», «(v − v₀) / t = a») el converteix en una funció i el calcula.
 * - 1. Per a cada fórmula i cada lletra que s'aïlla, centenars de preguntes: els valors
 *   compleixen la fórmula; cada equació bona (les dades, cada pas amb nombres, cada pas
 *   amb lletres) es compleix amb aquests valors i cap opció dolenta no es compleix (no
 *   n'hi ha cap que també sigui bona); l'última equació té la lletra sola; el valor és el
 *   de la dada i hi cap; la unitat és la del context; les operacions coincideixen amb
 *   nombres i amb lletres; cada opció dolenta té el seu error, i el diagnòstic el
 *   reconeix; KaTeX dibuixa totes les fórmules.
 * - 2. Els nivells (1-4) i les decisions del David: sempre un context i la llegenda amb
 *   les unitats; enlloc no hi diu de quina matèria són les fórmules; sense codi.
 * ÚS: node tests/formules-steam.test.js
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
        'js/formules-steam/algebra.js',
        'js/formules-steam/cataleg.js',
        'js/formules-steam/strings.js',
        'js/formules-steam/math-engine.js',
        'js/formules-steam/errors.js',
    ],
    { seed: 20261117 }
);
const { CASOS_FS, ERRORS_FS, corregeixPas, diagnosticaFS, generaPreguntaFS } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const BAD = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b/;
// Ni errors ni trossos en vermell (una ordre que KaTeX no admet en aquell mode surt en #cc0000)
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));
const num = v => (Array.isArray(v) ? v[0] / v[1] : v);

/** Converteix el text d'una equació en dues funcions dels valors: [esquerra, dreta]. */
function llegeixText(text, noms) {
    const ordenats = [...noms].sort((a, b) => b.length - a.length);
    const id = n => `L${ordenats.indexOf(n)}`;
    const js = costat => {
        let s = costat.trim();
        // les lletres, per un identificador; després, els símbols
        let out = '';
        for (let i = 0; i < s.length;) {
            const nom = ordenats.find(n => s.startsWith(n, i));
            if (nom) {
                out += ` ${id(nom)} `;
                i += nom.length;
            } else out += s[i++];
        }
        out = out
            .replace(/½ ·/g, '0.5 *')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/√\s*(L\d+|\d+(?:,\d+)?)/g, 'Math.sqrt($1)')
            .replace(/(\d),(\d)/g, '$1.$2')
            .replace(/·/g, '*')
            .replace(/−/g, '-')
            .replace(/²/g, '**2');
        if (!/^[\sL\d.+\-*/()Mathsqr]*$/.test(out)) throw new Error(`no s'entén «${costat}» → ${out}`);
        return new Function(...ordenats.map(id), `return (${out});`);
    };
    const [a, b] = text.split(' = ');
    if (b === undefined) throw new Error(`sense «=»: ${text}`);
    return [js(a), js(b), ordenats];
}
function compleix(text, noms, valors) {
    const [a, b, ordenats] = llegeixText(text, noms);
    const args = ordenats.map(n => num(valors[n]));
    const [x, y] = [a(...args), b(...args)];
    return Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y));
}

suite('1. Totes les fórmules i totes les lletres');
{
    const dolents = {
        valors: [],
        bones: [],
        dolentes: [],
        final: [],
        valor: [],
        unitat: [],
        ops: [],
        errors: [],
        katex: [],
        text: [],
    };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const vistos = new Set();
    let preguntes = 0;
    for (const cas of CASOS_FS)
        for (let k = 0; k < 120; k++) {
            preguntes++;
            const q = generaPreguntaFS(cas.nivell, cas);
            const noms = Object.keys(cas.f.lletres);
            const { valors, incognita: x } = q.dades;
            const on = `${q.text} (${noms.map(n => `${n}=${num(valors[n])}`).join(', ')})`;
            if (
                !compleix(
                    cas.f.eq
                        .replace(/\*/g, ' · ')
                        .replace(/-/g, '−')
                        .replace(/\^2/g, '²')
                        .replace(/(\w+(?:[₀₁₂]|\b)?) · (\w+)²\/2/, '½ · $1 · $2²')
                        .replace(/\//g, ' / '),
                    noms,
                    valors
                )
            )
                anota(dolents.valors, `${on}: els valors no compleixen ${cas.f.eq}`);
            const ids = q.passos.map(p => p.mena);
            const nOps = ids.filter(m => m === 'operacio').length;
            if (ids.filter(m => m === 'lletres').length !== nOps || nOps < 1)
                anota(dolents.ops, `${on}: ${ids.join(',')}`);
            for (const pas of q.passos) {
                if (pas.camps.tria) {
                    const bona = pas.opcions.find(o => o[0] === pas.solucio.tria)[1];
                    if (['substitucio', 'equacio', 'lletres'].includes(pas.mena)) {
                        try {
                            if (!compleix(bona, noms, valors))
                                anota(dolents.bones, `${on}, ${pas.id}: «${bona}» no es compleix`);
                            for (const [v, t] of pas.opcions)
                                if (v !== pas.solucio.tria && compleix(t, noms, valors))
                                    anota(dolents.dolentes, `${on}, ${pas.id}: «${t}» també es compleix`);
                        } catch (e) {
                            anota(dolents.bones, `${on}, ${pas.id}: ${e.message}`);
                        }
                    }
                    if (pas.mena === 'unitat' && bona !== cas.f.aillar[x].unitats[x][0])
                        anota(dolents.unitat, `${on}: ${bona}`);
                    const textos = pas.opcions.map(o => o[1]);
                    if (pas.opcions.length < 2 || new Set(textos).size !== textos.length || pas.literal !== true)
                        anota(dolents.errors, `${on}, ${pas.id}: opcions ${textos.join(' | ')}`);
                }
                // La bona s'accepta; cada distractor té el seu error i el diagnòstic el reconeix
                const resp = pas.camps.r
                    ? { r: { v: w.textDecimal(pas.solucio.r), p: '' } }
                    : { tria: pas.solucio.tria };
                if (corregeixPas(pas, resp).estat !== 'ok')
                    anota(dolents.errors, `${on}, ${pas.id}: la bona no s'accepta`);
                for (const [v, codi] of pas.dades.distractors[pas.camps.r ? 'r' : 'tria']) {
                    vistos.add(codi);
                    const c = corregeixPas(pas, pas.camps.r ? { r: { v: w.textDecimal(v), p: '' } } : { tria: v });
                    const d = diagnosticaFS(pas, c.valors);
                    if (c.estat !== 'error' || !ERRORS_FS[codi] || !d || d.errorType !== codi)
                        anota(
                            dolents.errors,
                            `${on}, ${pas.id}: ${JSON.stringify(v)} → ${c.estat} ${d && d.errorType} (${codi})`
                        );
                }
                if (pas.mena === 'valor') {
                    const camp = pas.plantilla.find(t => t.camp === 'r');
                    if (num(pas.solucio.r) !== num(valors[x]) || w.textDecimal(pas.solucio.r).length > camp.llarg)
                        anota(dolents.valor, `${on}: ${JSON.stringify(pas.solucio.r)}`);
                }
                for (const t of [pas.linia, ...pas.plantilla.filter(p => p.tex).map(p => p.tex)])
                    if (preguntes % 3 === 0 && !katexOk(t)) anota(dolents.katex, `${on}, ${pas.id}: ${t}`);
                const tots = [pas.enunciat, pas.linia, ...(pas.opcions || []).map(o => o[1])].join(' ');
                if (BAD.test(tots)) anota(dolents.text, `${on}, ${pas.id}`);
            }
            // L'última equació amb lletres té la lletra sola (girada, si cal: la línia ho escriu)
            const ultim = q.passos[q.passos.length - 1];
            const textUltim = ultim.opcions.find(o => o[0] === ultim.solucio.tria)[1];
            const [ae, be] = textUltim.split(' = ');
            if (ae !== x && be !== x) anota(dolents.final, `${on}: «${textUltim}»`);
            if (be === x && !/aligned/.test(ultim.linia)) anota(dolents.final, `${on}: no es gira`);
            if (!katexOk(q.tex) || BAD.test(q.enunciat + q.text)) anota(dolents.katex, `${on}: pregunta`);
        }
    const msg = l => l.join('\n      → ');
    ok(`${preguntes} preguntes: els valors compleixen la fórmula`, !dolents.valors.length, msg(dolents.valors));
    ok('cada equació bona es compleix amb els valors', !dolents.bones.length, msg(dolents.bones));
    ok(
        'cap opció dolenta no es compleix (no n’hi ha cap que també sigui bona)',
        !dolents.dolentes.length,
        msg(dolents.dolentes)
    );
    ok('l’última equació té la lletra sola (i es gira si cal)', !dolents.final.length, msg(dolents.final));
    ok('el valor és el de la dada i hi cap', !dolents.valor.length, msg(dolents.valor));
    ok('la unitat és la del context', !dolents.unitat.length, msg(dolents.unitat));
    ok('tantes operacions amb nombres com amb lletres', !dolents.ops.length, msg(dolents.ops));
    ok(
        'opcions diferents i literals; la bona s’accepta; cada error es reconeix',
        !dolents.errors.length,
        msg(dolents.errors)
    );
    ok('KaTeX dibuixa les fórmules', !dolents.katex.length, msg(dolents.katex));
    ok('cap text estrany', !dolents.text.length, msg(dolents.text));
    eq('surten tots els errors', [...vistos].sort().join(' '), Object.keys(ERRORS_FS).sort().join(' '));
}

suite('2. Nivells i decisions del David');
{
    const perNivell = n => CASOS_FS.filter(c => c.nivell === n).map(c => `${c.f.id}:${c.x}`);
    ok(
        `hi ha casos dels quatre nivells (${[1, 2, 3, 4].map(n => perNivell(n).length).join(', ')})`,
        [1, 2, 3, 4].every(n => perNivell(n).length >= 3)
    );
    ok(
        'la lletra al denominador és del nivell 3',
        ['velocitat:Δt', 'densitat:V', 'pressio:S'].every(c => perNivell(3).includes(c))
    );
    ok(
        'les arrels i les fórmules llargues, del nivell 4',
        ['cinetica:v', 'posicio:a', 'paralel:R'].every(c => perNivell(4).includes(c))
    );
    const q = generaPreguntaFS(1);
    ok(
        'sempre un context i la llegenda amb les unitats',
        /\?/.test(q.enunciat) && /La fórmula és .*, on .* és /.test(q.enunciat)
    );
    const fitxers = [
        'formules-steam.html',
        ...fs.readdirSync(path.join(ROOT, 'js/formules-steam')).map(f => `js/formules-steam/${f}`),
    ];
    const materia = fitxers.filter(f =>
        /F[íi]sica i [Qq]u[íi]mica|Tecnologia/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))
    );
    ok('enlloc no diu de quina matèria són les fórmules', !materia.length, materia.join(', '));
    ok(
        'la pàgina no dona codi (senseCodi)',
        /senseCodi:\s*true/.test(fs.readFileSync(path.join(ROOT, 'formules-steam.html'), 'utf8'))
    );
}

finish('TESTS DE FÓRMULES STEAM');
