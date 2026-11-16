/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/grafics-estadistics.test.js
 * ROL: Tests del gràfic estadístic comú (js/passos/grafic-estadistic.js) i de
 *      «Gràfics estadístics» (js/grafics-estadistics/).
 * ARQUITECTURA:
 * - Cada gràfic es torna a llegir de l'SVG com ho faria l'alumne (l'altura de cada
 *   barra a l'eix, els graus de cada sector, les icones de cada fila…) i ha de donar
 *   les dades amb què s'ha dibuixat.
 * - Milers de preguntes de cada família, nivell i nombre d'opcions: la solució es
 *   torna a calcular a partir del gràfic i de l'enunciat; les afirmacions certes ho
 *   són i les falses no; cada distractor té el seu error i el diagnòstic el reconeix.
 * ÚS: node tests/grafics-estadistics.test.js
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
        'js/estadistica/math-engine.js',
        'js/estadistica/question-bank.js',
        'js/passos/grafic-estadistic.js',
        'js/grafics-estadistics/strings.js',
        'js/grafics-estadistics/errors.js',
        'js/grafics-estadistics/math-engine.js',
    ],
    { seed: 2026 }
);
const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b|Infinity/;
const num = t => Number(String(t).replace(',', '.'));
const quasi = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
const valorRac = v => (Array.isArray(v) ? v[0] / v[1] : v);

// ── Lectura de l'SVG ─────────────────────────────────────────────────────────
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const tags = (svg, re) => [...svg.matchAll(re)].map(m => attrs(m[0]));
/** Les ratlles de l'eix vertical: [{ v, y }] de baix a dalt. */
const ratlles = svg =>
    tags(svg, /<line class="ge-linia[^"]*"[^>]*data-v="[^"]*"[^>]*>/g)
        .map(a => ({ v: num(a['data-v']), y: num(a.y1) }))
        .sort((a, b) => b.y - a.y);
/** El valor que llegeix l'alumne a l'altura y (entre dues ratlles, proporcionalment). */
function llegeixY(r, y) {
    for (let i = 0; i < r.length - 1; i++) {
        const [a, b] = [r[i], r[i + 1]];
        if (y <= a.y + 0.06 && y >= b.y - 0.06) return a.v + ((a.y - y) / (a.y - b.y)) * (b.v - a.v);
    }
    return NaN;
}
const barres = svg => tags(svg, /<rect class="ge-barra[^"]*"[^>]*>/g);
const textos = (svg, classe) =>
    [...svg.matchAll(new RegExp(`<text class="${classe}"[^>]*>([^<]*)<`, 'g'))].map(m => m[1]);
const desescapa = t =>
    t
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

/** Llegeix qualsevol dels gràfics: { tipus, dades: [{ cat, v }], … } a partir del dibuix. */
function llegeixGrafic(svg) {
    if (/class="ge-sector/.test(svg)) {
        const ss = tags(svg, /<(?:path|circle) class="ge-sector[^"]*"[^>]*>/g);
        const angles = ss.map(a => {
            if (!a.d) return 360;
            const n = a.d.match(/-?[\d.]+/g).map(Number); // M cx cy L x1 y1 A r r 0 gran 1 x2 y2
            const [cx, cy, x1, y1, , , , gran, , x2, y2] = n;
            const a1 = Math.atan2(x1 - cx, cy - y1);
            const a2 = Math.atan2(x2 - cx, cy - y2);
            let d = (((a2 - a1) * 180) / Math.PI + 360) % 360;
            if (gran === 1 && d < 180) d = 360 - d;
            return d;
        });
        const total = angles.reduce((x, y) => x + y, 0);
        return {
            tipus: 'sectors',
            total,
            dades: ss.map((a, i) => ({ cat: desescapa(a['data-cat']), v: (angles[i] / 360) * 100, graus: angles[i] })),
        };
    }
    if (/class="ge-fila"/.test(svg)) {
        const clau = svg.match(/<text class="ge-cat" x="[\d.]+" y="[\d.]+">= ([\d,]+)/);
        const unitat = num(clau[1]);
        const files = [
            ...svg.matchAll(
                /<g class="ge-fila" data-cat="([^"]*)" data-v="[^"]*">([\s\S]*?)<\/g><\/g>(?=<text|<line)/g
            ),
        ];
        const dades = files.map(m => {
            const plenes = (m[2].match(/class="ge-icona"/g) || []).length;
            const mitges = (m[2].match(/class="ge-icona ge-mitja"/g) || []).length;
            return { cat: desescapa(m[1]), v: (plenes + mitges / 2) * unitat, plenes, mitges };
        });
        return { tipus: 'pictograma', unitat, dades };
    }
    const r = ratlles(svg);
    if (/class="ge-icona ge-gran"/.test(svg)) {
        const y0 = r[0].y;
        const dades = tags(svg, /<g class="ge-icona ge-gran"[^>]*>/g).map(a => {
            const [, ty] = a.transform
                .match(/translate\(([-\d.]+) ([-\d.]+)\)/)
                .slice(1)
                .map(Number);
            const k = num(a.transform.match(/scale\(([\d.]+)\)/)[1]);
            return { cat: desescapa(a['data-cat']), v: llegeixY(r, ty), alt: y0 - ty, ample: 12 * k, escala: k };
        });
        return { tipus: 'area', dades, r };
    }
    const bs = barres(svg);
    const dadesBarres = bs.map(a => ({
        cat: desescapa(a['data-cat']),
        v: llegeixY(r, num(a.y)),
        base: llegeixY(r, num(a.y) + num(a.height)),
        a,
    }));
    const punts = tags(svg, /<circle class="ge-punt"[^>]*>/g).map(a => ({
        x: num(a['data-x']),
        v: llegeixY(r, num(a.cy)),
    }));
    const hist = /ge-hist|ge-poligon/.test(svg);
    return { tipus: hist ? 'histograma' : 'barres', dades: dadesBarres, punts, r };
}

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Escala neta');
{
    eq('pasNet(7) = 1', w.pasNet(7), 1);
    eq('pasNet(16) = 2', w.pasNet(16), 2);
    eq('pasNet(40) = 5', w.pasNet(40), 5);
    eq('pasNet(80) = 10', w.pasNet(80), 10);
    eq('pasNet(170) = 25', w.pasNet(170), 25);
    eq('marquesLineals(35, 5)', w.marquesLineals(35, 5).join(','), '0,5,10,15,20,25,30,35');
    eq('marquesLineals(36, 5) arriba a 40', w.marquesLineals(36, 5).join(','), '0,5,10,15,20,25,30,35,40');
    eq('eix tallat: marquesLineals(66, 2, 60)', w.marquesLineals(66, 2, 60).join(','), '60,62,64,66');
    eq('textNombre(162.5) = 162,5', w.textNombre(162.5), '162,5');
}

// ─────────────────────────────────────────────────────────────────────────────
suite('2. El gràfic comú: es torna a llegir i dona les dades');
{
    // Barres
    const b = w.svgBarres({
        categories: ['A', 'B', 'C'],
        valors: [10, 35, 20],
        pas: 5,
        titolY: 'Alumnes',
        titolX: 'Prova',
    });
    const lb = llegeixGrafic(b);
    ok(
        'barres: cada barra arriba al seu valor i surt de 0',
        lb.dades.map(d => Math.round(d.v)).join(',') === '10,35,20' && lb.dades.every(d => quasi(d.base, 0)),
        JSON.stringify(lb.dades.map(d => [d.v, d.base]))
    );
    ok('barres: les ratlles van de 5 en 5, de 0 a 35', lb.r.map(x => x.v).join(',') === '0,5,10,15,20,25,30,35');
    ok(
        'barres: els títols i les categories hi són',
        /Alumnes/.test(b) && /Prova/.test(b) && textos(b, 'ge-cat').join() === 'A,B,C'
    );
    // Una ratlla per unitat, número cada 5
    const bc = w.svgBarres({ categories: ['1', '2', '3'], valors: [3, 12, 7], pas: 1, cada: 5 });
    eq(
        'barres amb «cada»: 13 ratlles, números només a 0, 5 i 10',
        [ratlles(bc).length, textos(bc, 'ge-marca').join()].join(' | '),
        '13 | 0,5,10'
    );
    // Eix tallat
    const t = w.svgBarres({ categories: ['A', 'B'], valors: [62, 66], pas: 2, min: 60 });
    const lt = llegeixGrafic(t);
    ok(
        'eix tallat: llegint l’eix, 62 i 66; les barres fan 1 i 3 ratlles',
        quasi(lt.dades[0].v, 62) &&
            quasi(lt.dades[1].v, 66) &&
            quasi(num(lt.dades[1].a.height) / num(lt.dades[0].a.height), 3)
    );
    // Escala irregular
    const ir = w.svgBarres({ categories: ['G', 'F', 'M'], valors: [10, 20, 100], marques: [0, 10, 20, 50, 100] });
    const li = llegeixGrafic(ir);
    const dy = ratlles(ir)
        .map((x, i, a) => (i ? a[i - 1].y - x.y : 0))
        .slice(1);
    ok(
        'escala irregular: ratlles a la mateixa distància i barres a 10, 20 i 100',
        dy.every(d => quasi(d, dy[0], 0.11)) && li.dades.map(d => Math.round(d.v)).join() === '10,20,100'
    );
    ok(
        'escala irregular: la barra de 100 només fa 4 vegades la de 10',
        quasi(num(li.dades[2].a.height) / num(li.dades[0].a.height), 4, 0.02)
    );
    // Histograma i polígon
    const h = w.svgHistograma({
        limits: [0, 10, 20, 30, 40],
        freq: [3, 8, 5, 2],
        poligon: true,
        titolX: 'Minuts (min)',
    });
    const lh = llegeixGrafic(h);
    const bh = barres(h);
    const contigues = bh.every((a, i) => i === 0 || quasi(num(bh[i - 1].x) + num(bh[i - 1].width), num(a.x), 0.15));
    ok(
        'histograma: barres de 3, 8, 5 i 2, enganxades',
        lh.dades.map(d => Math.round(d.v)).join() === '3,8,5,2' && contigues
    );
    ok(
        'polígon: un punt a cada marca de classe (5, 15, 25, 35) a l’altura de la seva barra',
        lh.punts.map(p => `${p.x}:${Math.round(p.v)}`).join() === '5:3,15:8,25:5,35:2'
    );
    const pl = tags(h, /<polyline class="ge-poligon"[^>]*>/g)[0]
        .points.split(' ')
        .map(p => p.split(',').map(Number));
    const y0 = ratlles(h)[0].y;
    ok(
        'polígon: tanca a l’eix horitzontal pels dos costats',
        quasi(pl[0][1], y0) && quasi(pl[pl.length - 1][1], y0) && pl.length === 6
    );
    const centres = bh.map(a => num(a.x) + num(a.width) / 2);
    ok(
        'polígon: els punts són al mig de cada barra',
        pl.slice(1, -1).every(([x], i) => quasi(x, centres[i], 0.15))
    );
    const nomesP = w.svgHistograma({ limits: [0, 10, 20], freq: [4, 6], barres: false, poligon: true });
    ok('polígon tot sol: sense barres', !/ge-barra/.test(nomesP) && /ge-poligon/.test(nomesP));
    // Sectors
    const s = w.svgSectors({
        categories: ['A', 'B', 'C', 'D'],
        valors: [50, 25, 15, 10],
        etiquetes: ['50 %', '25 %', '?', '10 %'],
    });
    const ls = llegeixGrafic(s);
    ok(
        'sectors: els angles fan 50, 25, 15 i 10 % i sumen 360°',
        ls.dades.map(d => Math.round(d.v)).join() === '50,25,15,10' && quasi(ls.total, 360, 0.5),
        JSON.stringify(ls.dades.map(d => d.v))
    );
    ok(
        'sectors: les etiquetes de dins i la llegenda',
        textos(s, 'ge-dins').join() === '50 %,25 %,?,10 %' && textos(s, 'ge-cat').join() === 'A,B,C,D'
    );
    const gran = llegeixGrafic(w.svgSectors({ categories: ['A', 'B'], valors: [70, 30] }));
    ok(
        'sectors: un sector de més de mig cercle (70 %)',
        Math.round(gran.dades[0].v) === 70 && Math.round(gran.dades[1].v) === 30
    );
    // Pictograma
    const p = w.svgPictograma({
        categories: ['Gos', 'Gat', 'Peix'],
        valors: [14, 8, 2],
        unitat: 4,
        nomUnitat: 'alumnes',
    });
    const lp = llegeixGrafic(p);
    ok(
        'pictograma: 3,5 icones = 14, 2 = 8 i mitja = 2 (1 icona = 4)',
        lp.unitat === 4 && lp.dades.map(d => d.v).join() === '14,8,2',
        JSON.stringify(lp.dades)
    );
    ok('pictograma: la llegenda diu «= 4 alumnes»', /= 4 alumnes/.test(p));
    // Pictograma que creix en àrea
    const a = w.svgPictogramaArea({ categories: ['2023', '2024'], valors: [30, 60], pas: 10 });
    const la = llegeixGrafic(a);
    ok(
        'pictograma en àrea: altures de 30 i 60 a l’eix, i l’ample també el doble',
        quasi(la.dades[0].v, 30, 0.2) &&
            quasi(la.dades[1].v, 60, 0.2) &&
            quasi(la.dades[1].ample / la.dades[0].ample, 2, 0.02)
    );
    ok(
        'pictograma en àrea: les dues icones no es trepitgen',
        (() => {
            const xs = tags(a, /<g class="ge-icona ge-gran"[^>]*>/g).map(t =>
                num(t.transform.match(/translate\(([-\d.]+)/)[1])
            );
            return xs[0] + la.dades[0].ample < xs[1];
        })()
    );
    ok('cap gràfic porta undefined/NaN', ![b, bc, t, ir, h, s, p, a].some(x => BAD.test(x)));
    ok(
        'els noms es protegeixen (<, &, ")',
        /A &amp; B/.test(w.svgBarres({ categories: ['A & B', 'C'], valors: [1, 2] }))
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recalcula la solució de cada pregunta a partir del gràfic i de l'enunciat
const cometes = t => [...t.matchAll(/«([^»]+)»/g)].map(m => m[1]);
function recalcula(q) {
    const pas = q.passos[0];
    const g = llegeixGrafic(q.svg);
    const val = cat => g.dades.find(d => d.cat === cat).v;
    const totalG = g.dades.reduce((x, d) => x + d.v, 0);
    const e = pas.enunciat;
    const N = Number(
        (q.enunciat.match(/Han respost (\d+) alumnes/) ||
            e.match(/Han respost (\d+) alumnes/) ||
            e.match(/dels (\d+) alumnes/) ||
            [])[1]
    );
    const ivals = () =>
        (g.dades.length ? g.dades : []).map(d => {
            const [a, b] = d.cat.slice(1, -1).split(', ').map(num);
            return { a, b, f: d.v };
        });
    // Del polígon tot sol: la marca i la freqüència
    const ivalsP = () => {
        if (g.dades.length) return ivals();
        const w0 = g.punts.length > 1 ? g.punts[1].x - g.punts[0].x : 0;
        return g.punts.map(p => ({ a: p.x - w0 / 2, b: p.x + w0 / 2, f: p.v }));
    };
    switch (pas.id) {
        case 'lectura':
        case 'icones':
            return val(cometes(e)[0]);
        case 'diferencia':
        case 'icones-diferencia': {
            const [x, y] = cometes(e);
            return val(x) - val(y);
        }
        case 'total':
        case 'icones-total':
            return totalG;
        case 'percentatge':
            return (100 * val(cometes(e)[0])) / N;
        case 'freq': {
            const x = e.match(/han dit (?:un )?(\d+)/)[1];
            return val(x);
        }
        case 'moda':
            return Number(g.dades.reduce((m, d) => (d.v > m.v ? d : m)).cat);
        case 'mediana': {
            const dades = g.dades.flatMap(d => Array(Math.round(d.v)).fill(Number(d.cat)));
            return dades[(dades.length - 1) / 2];
        }
        case 'falta':
        case 'angle':
            return Math.round(val(cometes(e)[0]));
        case 'persones':
            return (Math.round(val(cometes(e)[0])) * N) / 100;
        case 'interval': {
            const [a, b] = e
                .match(/\[([\d,]+), ([\d,]+)\)/)
                .slice(1)
                .map(num);
            const iv = ivalsP().find(x => quasi(x.a, a) && quasi(x.b, b));
            return iv.f;
        }
        case 'menys': {
            const lim = num(e.match(/menys de ([\d,]+)/)[1]);
            return ivalsP()
                .filter(x => x.b <= lim + 1e-9)
                .reduce((s, x) => s + x.f, 0);
        }
        case 'percentatge-hist': {
            const lim = num(e.match(/té ([\d,]+) \S+ o més/)[1]);
            return (
                (100 *
                    ivalsP()
                        .filter(x => x.a >= lim - 1e-9)
                        .reduce((s, x) => s + x.f, 0)) /
                N
            );
        }
        case 'marca': {
            const iv = ivalsP().reduce((m, x) => (x.f > m.f ? x : m));
            return (iv.a + iv.b) / 2;
        }
        case 'escala-irregular':
            return val('Març') / val('Gener');
        case 'area':
            return g.dades[1].v / g.dades[0].v;
        default:
            return undefined;
    }
}

// Avalua les afirmacions (certes i falses) amb les dades del gràfic
function avalua(text, q) {
    const g = llegeixGrafic(q.svg);
    const val = cat => {
        const d = g.dades.find(x => x.cat === cat);
        return g.tipus === 'sectors' ? Math.round(d.v) : Math.round(d.v);
    };
    const total = g.dades.reduce((x, d) => x + Math.round(d.v), 0);
    const N = Number((q.enunciat.match(/Han respost (\d+) alumnes/) || [])[1]);
    const alumnes = cat => (g.tipus === 'sectors' ? (val(cat) * N) / 100 : val(cat));
    let m;
    if ((m = text.match(/^L'opció més triada és «(.+)»\.$/))) return g.dades.every(d => val(m[1]) >= Math.round(d.v));
    if ((m = text.match(/^«(.+)» l'han triat (\d+) alumnes\.$/))) return alumnes(m[1]) === Number(m[2]);
    if ((m = text.match(/^«(.+)» té (\d+) vots més que «(.+)»\.$/))) return val(m[1]) - val(m[3]) === Number(m[2]);
    if ((m = text.match(/^Han respost l'enquesta (\d+) alumnes\.$/))) return total === Number(m[1]);
    if ((m = text.match(/^Més de la meitat dels alumnes ha triat «(.+)»\.$/)))
        return g.tipus === 'sectors' ? val(m[1]) > 50 : 2 * val(m[1]) > total;
    if ((m = text.match(/^«(.+)» i «(.+)» sumen el (\d+) %\.$/))) return val(m[1]) + val(m[2]) === Number(m[3]);
    if ((m = text.match(/^El sector de «(.+)» fa (\d+)°\.$/))) return Math.round(3.6 * val(m[1])) === Number(m[2]);
    const [a, b] = [g.dades[0] && g.dades[0].v, g.dades[1] && g.dades[1].v];
    if ((m = text.match(/^La Llista B té només (\d+) vots més que la Llista A \((\d+) i (\d+)\)\.$/)))
        return quasi(b - a, Number(m[1]), 0.2) && quasi(b, Number(m[2]), 0.2) && quasi(a, Number(m[3]), 0.2);
    if (/^La Llista B té el triple de vots que la Llista A\.$/.test(text)) return quasi(b, 3 * a, 0.2);
    if (/^La Llista B té més del doble de vots que la Llista A\.$/.test(text)) return b > 2 * a;
    if ((m = text.match(/^La Llista ([AB]) té (\d+) vots\.$/))) return quasi(m[1] === 'A' ? a : b, Number(m[2]), 0.2);
    if ((m = text.match(/^\[([\d,]+), ([\d,]+)\)$/))) {
        // Els intervals, de les barres o (polígon tot sol) dels punts: marca ± mig interval
        const w0 = g.punts.length > 1 ? g.punts[1].x - g.punts[0].x : 0;
        const iv = g.dades.length
            ? g.dades.map(d => ({
                  a: num(d.cat.slice(1).split(', ')[0]),
                  b: num(d.cat.slice(0, -1).split(', ')[1]),
                  f: d.v,
              }))
            : g.punts.map(p => ({ a: p.x - w0 / 2, b: p.x + w0 / 2, f: p.v }));
        const max = Math.max(...iv.map(x => x.f));
        const aquest = iv.find(x => quasi(x.a, num(m[1])) && quasi(x.b, num(m[2])));
        return aquest ? quasi(aquest.f, max, 0.2) : undefined;
    }
    return undefined;
}

suite('3. Milers de preguntes: la solució surt del gràfic i els distractors, dels errors');
{
    const families = ['barres', 'sectors', 'pictogrames', 'histogrames'];
    const tipusVistos = {};
    const malament = [];
    const claus = new Set();
    let n = 0;
    let comprovades = 0;
    for (const grafics of families)
        for (const nivell of [1, 2, 3])
            for (const opcions of [3, 4, 5])
                for (let k = 0; k < 120; k++) {
                    const q = w.generaPreguntaGE({ grafics, nivell, index: k, opcions });
                    n++;
                    const pas = q.passos[0];
                    const on = `${grafics}/${nivell}/${pas.id}`;
                    tipusVistos[pas.id] = (tipusVistos[pas.id] || 0) + 1;
                    claus.add(q.clau);
                    const tot = JSON.stringify(q);
                    if (
                        BAD.test(q.svg) ||
                        BAD.test(q.enunciat) ||
                        BAD.test(pas.enunciat) ||
                        BAD.test(pas.linia) ||
                        BAD.test(JSON.stringify(pas.opcions || []))
                    )
                        malament.push(`${on}: undefined/NaN a la pregunta ${tot.slice(0, 200)}`);
                    if (q.passos.length !== 1) malament.push(`${on}: ${q.passos.length} passos`);
                    if (
                        !w.TIPUS_GE[grafics][1]
                            .concat(
                                nivell >= 2 ? w.TIPUS_GE[grafics][2] : [],
                                nivell >= 3 ? w.TIPUS_GE[grafics][3] : []
                            )
                            .includes(pas.id)
                    )
                        malament.push(`${on}: tipus de pregunta que no toca a aquest nivell`);
                    if (pas.camps.tria) {
                        const textosO = pas.opcions.map(o => o[1]);
                        const cert = pas.opcions.find(o => o[0] === 'cert')[1];
                        if (new Set(textosO).size !== textosO.length)
                            malament.push(`${on}: opcions repetides ${textosO.join(' | ')}`);
                        if (pas.opcions.length > opcions || pas.opcions.length < Math.min(3, opcions))
                            malament.push(`${on}: ${pas.opcions.length} opcions amb opcions=${opcions}`);
                        const vc = avalua(cert, q);
                        if (vc !== true) malament.push(`${on}: l'afirmació certa «${cert}» → ${vc}`);
                        for (const [v, t] of pas.opcions.filter(o => o[0] !== 'cert')) {
                            const vf = avalua(t, q);
                            if (vf !== false) malament.push(`${on}: l'opció falsa «${t}» → ${vf}`);
                            const d = pas.dades.distractors.tria.find(x => x[0] === v);
                            if (d && !w.ERRORS_GE[d[1]]) malament.push(`${on}: error desconegut ${d[1]}`);
                            if (d && (w.diagnosticaGE(pas, { tria: v }) || {}).errorType !== d[1])
                                malament.push(`${on}: el diagnòstic no reconeix ${d[1]}`);
                        }
                        comprovades++;
                    } else {
                        const sol = valorRac(pas.solucio.r);
                        const re = recalcula(q);
                        if (re === undefined || !quasi(sol, re, 0.02))
                            malament.push(`${on}: solució ${sol}, del gràfic surt ${re} · ${pas.enunciat}`);
                        else comprovades++;
                        for (const [v, err] of pas.dades.distractors.r) {
                            if (!w.ERRORS_GE[err]) malament.push(`${on}: error desconegut ${err}`);
                            if (quasi(valorRac(v), sol, 1e-9))
                                malament.push(`${on}: un distractor (${err}) és la solució`);
                            const dg = w.diagnosticaGE(pas, { r: v });
                            if (!dg || dg.errorType !== err)
                                malament.push(`${on}: el diagnòstic de ${valorRac(v)} no és ${err}`);
                        }
                    }
                    if (w.diagnosticaGE(pas, pas.camps.tria ? { tria: 'cert' } : { r: pas.solucio.r }))
                        malament.push(`${on}: la solució es diagnostica com a error`);
                }
    ok(
        `${n} preguntes, ${comprovades} comprovades contra el gràfic (solució o afirmacions)`,
        !malament.length && comprovades === n,
        malament.slice(0, 10).join('\n      → ')
    );
    const tots = Object.values(w.TIPUS_GE).flatMap(t => [...t[1], ...t[2], ...t[3]]);
    const falten = tots.filter(t => !tipusVistos[t]);
    ok(`els ${tots.length} tipus de pregunta hi surten`, !falten.length, falten.join(', '));
    ok(`varietat: ${claus.size} preguntes diferents de ${n}`, claus.size > n * 0.85);
}

// ─────────────────────────────────────────────────────────────────────────────
suite('4. Els gràfics es poden llegir exactament i no són ambigus');
{
    const malament = [];
    for (let k = 0; k < 1500; k++) {
        const grafics = ['barres', 'sectors', 'pictogrames', 'histogrames'][k % 4];
        const q = w.generaPreguntaGE({ grafics, nivell: 1 + (k % 3), index: k });
        const g = llegeixGrafic(q.svg);
        const pas = q.passos[0];
        if (g.tipus === 'barres' || g.tipus === 'histograma') {
            // Cada barra (o punt) acaba exactament en una ratlla: es llegeix sense estimar
            const ys = new Set(g.r.map(x => x.y.toFixed(1)));
            const tops = g.dades
                .map(d => num(d.a.y).toFixed(1))
                .concat(tags(q.svg, /<circle class="ge-punt"[^>]*>/g).map(a => num(a.cy).toFixed(1)));
            if (tops.some(y => !ys.has(y))) malament.push(`${grafics}/${pas.id}: una barra no acaba en una ratlla`);
        }
        if (['moda', 'marca', 'modal'].includes(pas.id)) {
            const fs_ = (g.dades.length ? g.dades : g.punts).map(d => Math.round(d.v));
            if (fs_.filter(f => f === Math.max(...fs_)).length !== 1)
                malament.push(`${pas.id}: dues barres igual d'altes`);
        }
        if (g.tipus === 'sectors') {
            const ps = g.dades.map(d => Math.round(d.v));
            if (ps.reduce((x, y) => x + y, 0) !== 100 || ps.some(p => p % 5)) malament.push(`sectors: ${ps.join(',')}`);
        }
        if (g.tipus === 'pictograma' && g.dades.some(d => d.plenes + d.mitges > 9))
            malament.push('pictograma: fila massa llarga');
        if (pas.id === 'lectura' && !pas.dades.distractors.r.some(([, e]) => e === 'SENSE_ESCALA'))
            malament.push('lectura sense el distractor de l’escala');
    }
    ok(
        '1500 gràfics: les barres acaben en una ratlla, la moda és única, els sectors sumen 100 i les files caben',
        !malament.length,
        malament.slice(0, 8).join('\n      → ')
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('5. Opcions, nivells i famílies');
{
    eq(
        'la sessió alterna les famílies',
        [0, 1, 2, 3, 4].map(i => w.familiaGE('', i)).join(),
        'barres,sectors,pictogrames,histogrames,barres'
    );
    eq('1r-2n: barres, sectors i pictogrames', w.GRAFICS_GE['1r-2n'].join(), 'barres,sectors,pictogrames');
    eq('3r-4t: barres, sectors i histogrames', w.GRAFICS_GE['3r-4t'].join(), 'barres,sectors,histogrames');
    let enganys = 0;
    let n1 = 0;
    for (let k = 0; k < 400; k++) {
        const t3 = w.tipusGE('barres', 3);
        if (['eix-tallat', 'escala-irregular'].includes(t3)) enganys++;
        if (
            ['eix-tallat', 'escala-irregular', 'area', 'percentatge', 'mediana'].includes(
                w.tipusGE(k % 2 ? 'barres' : 'pictogrames', 1)
            )
        )
            n1++;
    }
    ok(`nivell 3: hi surten gràfics que enganyen (${enganys} de 400 a barres)`, enganys > 120 && enganys < 280);
    ok('nivell 1: ni enganys ni percentatges ni medianes', n1 === 0);
    // ?preguntes=: només els tipus del grup, i només les famílies que en tenen
    const fora = [];
    const families = {};
    for (const [grup, tipus] of Object.entries(w.PREGUNTES_GE))
        for (const grafics of Object.keys(w.GRAFICS_GE))
            for (let k = 0; k < 40; k++) {
                const q = w.generaPreguntaGE({ grafics, preguntes: grup, nivell: 1, index: k });
                const id = q.passos[0].id;
                const fam = w.familiaGE(grafics, k, grup);
                const pot = [1, 2, 3].flatMap(n => w.TIPUS_GE[fam][n]).some(t => tipus.includes(t));
                if (pot && !tipus.includes(id)) fora.push(`${grafics}/${grup}: ${id}`);
                if (grup === 'enganys' && grafics === '') families[fam] = true;
            }
    ok(
        '?preguntes=: cada grup només dona els seus tipus (de qualsevol nivell)',
        !fora.length,
        fora.slice(0, 5).join(', ')
    );
    eq('?preguntes=enganys: només barres i pictogrames', Object.keys(families).sort().join(), 'barres,pictogrames');
    eq(
        '?preguntes=enganys amb sectors (cap engany): preguntes de sectors igualment',
        w.familiaGE('sectors', 3, 'enganys'),
        'sectors'
    );
    const tots = Object.values(w.TIPUS_GE).flatMap(t => [...t[1], ...t[2], ...t[3]]);
    const enGrup = Object.values(w.PREGUNTES_GE).flat();
    ok(
        'cada tipus de pregunta és en un grup, i només en un',
        tots.every(t => enGrup.filter(x => x === t).length === 1) && enGrup.length === tots.length
    );
    const sp = w.generaPreguntaGE({ grafics: 'histogrames', nivell: 2, index: 0, opcions: 5 });
    ok('la pregunta porta el text de la família (historial)', /Histograma/.test(sp.text));
    const t = w.textRespostaGE({ camps: { r: 'decimal' } }, { r: [325, 2] });
    eq('l’historial escriu 162,5', t, '162,5');
}

// ─────────────────────────────────────────────────────────────────────────────
suite('6. La pàgina');
{
    const html = fs.readFileSync(path.join(ROOT, 'grafics-estadistics.html'), 'utf8');
    ok(
        'tema d’estadística i el CSS del gràfic comú',
        /<html lang="ca" class="tema-estadistica">/.test(html) && /href="css\/grafic-estadistic\.css"/.test(html)
    );
    const ctrl = fs.readFileSync(path.join(ROOT, 'js/grafics-estadistics/grafics-estadistics.js'), 'utf8');
    ok(
        'el controlador llegeix ?grafics, ?preguntes i ?opcions',
        ['grafics', 'preguntes', 'opcions'].every(p => ctrl.includes(`urlParams.get('${p}')`))
    );
    const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    ok(
        'index.html: a la llista d’ESO i amb les seves opcions',
        /file: 'grafics-estadistics\.html'/.test(idx) && /'grafics-estadistics\.html': \[/.test(idx)
    );
    ok(
        'codi d’exercici GE',
        /'grafics-estadistics': 'GE'/.test(fs.readFileSync(path.join(ROOT, 'js/exercise-codes.js'), 'utf8'))
    );
}

finish('GRÀFICS ESTADÍSTICS');
