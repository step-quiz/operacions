/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/grafiques-context.test.js
 * ROL: Tests de la gràfica amb context comuna (js/passos/grafica-context.js) i de
 *      «Gràfiques en context» (js/grafiques-context/).
 * ARQUITECTURA:
 * - Cada gràfica es torna a llegir de l'SVG (ratlles → escala; corba → el valor a
 *   cada x enter) i ha de donar els valors dels trams.
 * - Milers de preguntes: la solució es torna a calcular amb la gràfica llegida i
 *   l'enunciat; els trams de les opcions es comproven (creix, decreix, més de pressa);
 *   les afirmacions certes ho són i les falses no; al relat, la gràfica bona és la del
 *   relat i les altres no; cada distractor té el seu error i el diagnòstic el reconeix.
 * ÚS: node tests/grafiques-context.test.js
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
        'js/passos/grafica-context.js',
        'js/grafiques-context/strings.js',
        'js/grafiques-context/errors.js',
        'js/grafiques-context/math-engine.js',
    ],
    { seed: 2026 }
);
const BAD = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b|Infinity/;
const num = t => Number(String(t).replace(',', '.'));
const quasi = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
const valorRac = v => (Array.isArray(v) ? v[0] / v[1] : v);

// ── Lectura de l'SVG ─────────────────────────────────────────────────────────
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const tags = (svg, re) => [...svg.matchAll(re)].map(m => attrs(m[0]));
/** La gràfica llegida: { taula: {x: y} a cada x enter, T, pasY } */
function llegeix(svg) {
    const verticals = tags(svg, /<line class="ge-linia[^"]*"[^>]*data-x="[^"]*"[^>]*>/g).map(a => ({
        v: num(a['data-x']),
        p: num(a.x1),
    }));
    const horitzontals = tags(svg, /<line class="ge-linia[^"]*"[^>]*data-v="[^"]*"[^>]*>/g).map(a => ({
        v: num(a['data-v']),
        p: num(a.y1),
    }));
    const lineal = ll => {
        const [a, b] = [ll[0], ll[ll.length - 1]];
        return {
            aV: p => a.v + ((p - a.p) / (b.p - a.p)) * (b.v - a.v),
            aP: v => a.p + ((v - a.v) / (b.v - a.v)) * (b.p - a.p),
        };
    };
    const X = lineal(verticals);
    const Y = lineal(horitzontals);
    const corba = tags(svg, /<polyline class="gc-corba[^"]*"[^>]*>/g)[0]
        .points.split(' ')
        .map(q => q.split(',').map(Number));
    // El valor a x: interpolat entre els dos punts de la mostra que l'envolten
    const a = x => {
        const px = X.aP(x);
        for (let i = 0; i + 1 < corba.length; i++) {
            const [[x1, y1], [x2, y2]] = [corba[i], corba[i + 1]];
            if (px >= x1 - 0.06 && px <= x2 + 0.06) {
                const py = x2 === x1 ? y1 : y1 + ((px - x1) / (x2 - x1)) * (y2 - y1);
                return Y.aV(py);
            }
        }
        return NaN;
    };
    const T = Math.round(X.aV(corba[corba.length - 1][0]));
    const taula = {};
    // (a una dècima: mig píxel de l'SVG són menys de 0,05 unitats)
    for (let x = 0; x <= T; x++) taula[x] = Math.round(a(x) * 10) / 10;
    const pasY = horitzontals.length > 1 ? Math.abs(horitzontals[1].v - horitzontals[0].v) : 1;
    return { taula, T, pasY, a };
}
const valors = g => Object.values(g.taula);
const monoton = (g, a, b) => {
    const d = [];
    for (let x = a; x < b; x++) d.push(g.taula[x + 1] - g.taula[x]);
    // Puja: cap pas avall (fora de l'error de lectura) i algun de clar amunt; baixa, igual al revés
    if (d.every(v => v > -0.08) && d.some(v => v > 0.15)) return 1;
    if (d.every(v => v < 0.08) && d.some(v => v < -0.15)) return -1;
    if (d.every(v => Math.abs(v) < 0.15)) return 0;
    return 'mixt';
};
const nombres = t => (t.match(/\d+(?:,\d+)?/g) || []).map(num);

// ─────────────────────────────────────────────────────────────────────────────
suite('1. La gràfica comuna');
{
    const tr = { x0: 0, x1: 4, y0: 0, y1: 16 };
    eq(
        'accelera: 0, 1, 4, 9, 16',
        [0, 1, 2, 3, 4].map(x => w.valorTram({ ...tr, forma: 'accelera' }, x)).join(),
        '0,1,4,9,16'
    );
    eq(
        'frena: 0, 7, 12, 15, 16',
        [0, 1, 2, 3, 4].map(x => w.valorTram({ ...tr, forma: 'frena' }, x)).join(),
        '0,7,12,15,16'
    );
    eq('recta: 0, 4, 8, 12, 16', [0, 1, 2, 3, 4].map(x => w.valorTram(tr, x)).join(), '0,4,8,12,16');
    eq(
        'suau: comença, és a la meitat al mig i acaba',
        [0, 2, 4].map(x => Math.round(w.valorTram({ ...tr, forma: 'suau' }, x) * 1e9) / 1e9).join(),
        '0,8,16'
    );
    const trams = [
        { x0: 0, x1: 2, y0: 0, y1: 6 },
        { x0: 2, x1: 3, y0: 6, y1: 6 },
        { x0: 3, x1: 5, y0: 6, y1: 0 },
    ];
    eq(
        'valorGrafica: a cada tram i fora del domini',
        [0, 1, 2.5, 4, 6].map(x => w.valorGrafica(trams, x)).join(),
        '0,3,6,3,NaN'
    );
    const svg = w.svgGraficaContext({
        trams,
        xMax: 5,
        yMax: 8,
        pasY: 1,
        cadaY: 2,
        titolX: 'Temps (h)',
        titolY: 'Distància (km)',
    });
    const g = llegeix(svg);
    eq('llegida de l’SVG: 0, 3, 6, 6, 3, 0', valors(g).join(), '0,3,6,6,3,0');
    ok(
        'ratlles cada 1, números cada 2; títols; un punt a cada extrem de tram',
        (svg.match(/class="ge-marca"/g) || []).length === 6 + 5 &&
            /Temps \(h\)/.test(svg) &&
            (svg.match(/gc-punt/g) || []).length === 4
    );
    const corbes = [
        { x0: 0, x1: 5, y0: 0, y1: 50, forma: 'accelera' },
        { x0: 5, x1: 9, y0: 50, y1: 34, forma: 'frena' },
    ];
    const gc = llegeix(w.svgGraficaContext({ trams: corbes, xMax: 9, yMax: 50, pasY: 2, cadaY: 10 }));
    ok(
        'corbes llegides de l’SVG: el valor a cada x enter',
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].every(x => quasi(gc.taula[x], w.valorGrafica(corbes, x), 0.06)),
        JSON.stringify(gc.taula)
    );
    const mini = w.svgGraficaContext({ trams, xMax: 5, yMax: 8, pasY: 1, cadaY: 4, mini: true, titolX: 'T' });
    ok(
        'en petit: sense títols ni punts, i es llegeix igual',
        !/ge-titol/.test(mini) && !/gc-punt/.test(mini) && valors(llegeix(mini)).join() === '0,3,6,6,3,0'
    );
    ok('sense undefined/NaN', !BAD.test(svg) && !BAD.test(mini));
}

// ─────────────────────────────────────────────────────────────────────────────
// Torna a calcular la solució d'una pregunta de caselles amb la gràfica llegida
function recalcula(q, g) {
    const pas = q.passos[0];
    const e = pas.enunciat;
    const ns = nombres(e);
    const tv = g.taula;
    const vs = valors(g);
    switch (pas.id) {
        case 'valor':
            return [tv[ns[0]]];
        case 'maxim-valor':
            return [Math.max(...vs)];
        case 'minim-valor':
            return [Math.min(...vs)];
        case 'maxim-instant':
            return [Number(Object.keys(tv).find(x => tv[x] === Math.max(...vs)))];
        case 'minim-instant':
            return [Number(Object.keys(tv).find(x => tv[x] === Math.min(...vs)))];
        case 'aturat': {
            let n = 0;
            for (let x = 0; x < g.T; x++) if (quasi(tv[x], tv[x + 1], 0.15)) n++;
            return [n];
        }
        case 'antiimatge': {
            const y = ns[0];
            return Object.keys(tv)
                .map(Number)
                .filter(x => quasi(tv[x], y));
        }
        case 'velocitat': {
            const [a, b] = ns.slice(-2);
            return [Math.abs(tv[b] - tv[a]) / (b - a)];
        }
        case 'increment': {
            const k = ns[0];
            return [Math.abs(tv[k] - tv[k - 1])];
        }
        case 'domini-recorregut':
            return /domini/.test(e) ? [0, g.T] : [Math.min(...vs), Math.max(...vs)];
        default:
            return undefined;
    }
}
// Un interval escrit a una opció: «De 2 h a 4 h», «Del minut 2 al 5»
const interval = t => {
    const n = nombres(t);
    return n.length === 2 ? n : null;
};
// Què diu cada afirmació (dades.afirmacions), comprovat amb la gràfica llegida
function certa(dada, g) {
    const tv = g.taula;
    if (dada.tipus === 'valor') return dada.x in tv && quasi(tv[dada.x], dada.y);
    if (dada.tipus === 'sentit') return monoton(g, dada.x0, dada.x1) === dada.signe;
    if (dada.tipus === 'maxim') return quasi(Math.max(...valors(g)), dada.y);
    if (dada.tipus === 'total') {
        let s = 0;
        for (let x = 0; x < g.T; x++) s += Math.abs(tv[x + 1] - tv[x]);
        return quasi(s, dada.y);
    }
    if (dada.tipus === 'forma') {
        const d = [];
        for (let x = 1; x <= g.T; x++) d.push(tv[x] - tv[x - 1]);
        const sentit = Math.sign(d[0]);
        const abs = d.map(Math.abs);
        const forma = abs.every((v, i) => i === 0 || v > abs[i - 1] + 1e-6)
            ? 'accelera'
            : abs.every((v, i) => i === 0 || v < abs[i - 1] - 1e-6)
              ? 'frena'
              : abs.every(v => quasi(v, abs[0]))
                ? 'recta'
                : 'mixt';
        return sentit === dada.sentit && forma === dada.forma;
    }
    return false;
}
const FORMA_RELAT = [
    [/planta/, 1, 'frena'],
    [/cotxe/, 1, 'accelera'],
    [/pedra/, -1, 'accelera'],
    [/globus/, -1, 'frena'],
];

suite('2. Milers de preguntes: la solució surt de la gràfica i els distractors, dels errors');
{
    const vistos = {};
    const malament = [];
    const claus = new Set();
    let n = 0;
    let comprovades = 0;
    for (const grafiques of ['segments', 'corbes', ''])
        for (const nivell of [1, 2, 3])
            for (const opcions of [3, 4, 5])
                for (let k = 0; k < 110; k++) {
                    const q = w.generaPreguntaGX({ grafiques, nivell, index: k, opcions });
                    n++;
                    const pas = q.passos[0];
                    const on = `${grafiques || 'totes'}/${nivell}/${pas.id}`;
                    vistos[pas.id] = (vistos[pas.id] || 0) + 1;
                    claus.add(q.clau);
                    const textos = [
                        q.enunciat || '',
                        q.svg || '',
                        pas.enunciat,
                        pas.linia,
                        JSON.stringify(pas.opcions || []),
                        JSON.stringify(pas.plantilla),
                    ];
                    if (textos.some(t => BAD.test(t)))
                        malament.push(`${on}: undefined/NaN ${textos.join(' | ').slice(0, 200)}`);
                    if (q.passos.length !== 1) malament.push(`${on}: ${q.passos.length} passos`);
                    let ok_ = true;
                    if (pas.id === 'relat') {
                        const cards = pas.opcions.map(o => ({ valor: o[0], g: llegeix(o[2]) }));
                        if (pas.opcions.length > opcions || pas.opcions.length < Math.min(3, opcions))
                            malament.push(`${on}: ${pas.opcions.length} gràfiques`);
                        // Cada targeta és la dels seus trams
                        for (const t of pas.dades.targetes) {
                            const c = cards.find(x => x.valor === t.valor);
                            // (en petit, mig píxel arriba a 0,1 unitats)
                            const bo = Object.keys(c.g.taula).every(x =>
                                quasi(c.g.taula[x], w.valorGrafica(t.trams, Number(x)), 0.15)
                            );
                            if (!bo) malament.push(`${on}: la targeta ${t.valor} no és la dels seus trams`);
                        }
                        const forma = FORMA_RELAT.find(([re]) => re.test(pas.enunciat));
                        for (const c of cards) {
                            // Segments: el relat dels trams de la targeta (comprovats amb el dibuix, a dalt) és el de l'enunciat?
                            const t = pas.dades.targetes.find(x => x.valor === c.valor);
                            const encaixa = forma
                                ? certa({ tipus: 'forma', sentit: forma[1], forma: forma[2] }, c.g)
                                : `${w.relatGX(pas.dades.historia, t.trams, pas.dades.nom)} Quina gràfica correspon a aquest relat?` ===
                                  pas.enunciat;
                            if ((c.valor === 'cert') !== encaixa) {
                                malament.push(
                                    `${on}: la gràfica ${c.valor} ${encaixa ? 'també' : 'no'} correspon al relat «${pas.enunciat}»`
                                );
                                ok_ = false;
                            }
                        }
                    } else {
                        const g = llegeix(q.svg);
                        if (pas.camps.tria) {
                            if (pas.opcions.length > opcions || pas.opcions.length < Math.min(3, opcions))
                                malament.push(`${on}: ${pas.opcions.length} opcions`);
                            const textos_ = pas.opcions.map(o => o[1]);
                            if (new Set(textos_).size !== textos_.length) malament.push(`${on}: opcions repetides`);
                            if (['creix', 'decreix'].includes(pas.id)) {
                                const sg = pas.id === 'creix' ? 1 : -1;
                                for (const [v, t] of pas.opcions) {
                                    const [a, b] = interval(t);
                                    const bo = monoton(g, a, b) === sg;
                                    if (bo !== (v === 'cert')) {
                                        malament.push(`${on}: «${t}» → ${bo}`);
                                        ok_ = false;
                                    }
                                }
                            } else if (pas.id === 'rapid') {
                                const pend = pas.opcions.map(([v, t]) => {
                                    const [a, b] = interval(t);
                                    return {
                                        v,
                                        p: Math.abs(g.taula[b] - g.taula[a]) / (b - a),
                                        mono: monoton(g, a, b),
                                    };
                                });
                                const max = Math.max(...pend.map(x => x.p));
                                const cert = pend.find(x => x.v === 'cert');
                                if (!(
                                    quasi(cert.p, max, 1e-6) &&
                                    pend.filter(x => quasi(x.p, max, 1e-6)).length === 1 &&
                                    cert.mono !== 'mixt'
                                )) {
                                    malament.push(`${on}: el tram més ràpid no és el bo ${JSON.stringify(pend)}`);
                                    ok_ = false;
                                }
                            } else {
                                // afirmacions i forma: el que diu cada opció, contra la gràfica
                                for (const { valor, dada } of pas.dades.afirmacions) {
                                    const vc = certa(dada, g);
                                    if (vc !== (valor === 'cert')) {
                                        malament.push(
                                            `${on}: «${pas.opcions.find(o => o[0] === valor)[1]}» és ${vc ? 'certa' : 'falsa'}`
                                        );
                                        ok_ = false;
                                    }
                                }
                                if (pas.dades.afirmacions.length !== pas.opcions.length)
                                    malament.push(`${on}: alguna opció sense dades`);
                            }
                        } else {
                            const sol = Object.keys(pas.camps).map(c => valorRac(pas.solucio[c]));
                            const re = recalcula(q, g);
                            if (!re || re.length !== sol.length || !re.every((v, i) => quasi(v, sol[i], 0.15))) {
                                malament.push(`${on}: solució ${sol.join(',')}, de la gràfica ${re} · ${pas.enunciat}`);
                                ok_ = false;
                            }
                            // Les solucions de l'eix vertical cauen en una ratlla; les de l'horitzontal, en una hora entera
                            if (
                                ['valor', 'maxim-valor', 'minim-valor'].includes(pas.id) &&
                                !sol.every(v => quasi(v / g.pasY, Math.round(v / g.pasY), 1e-6))
                            )
                                malament.push(`${on}: ${sol} no cau en una ratlla (cada ${g.pasY})`);
                            for (const c of Object.keys(pas.camps))
                                for (const [v, err] of pas.dades.distractors[c]) {
                                    if (!w.ERRORS_GX[err]) malament.push(`${on}: error desconegut ${err}`);
                                    if (quasi(valorRac(v), valorRac(pas.solucio[c]), 1e-9))
                                        malament.push(`${on}: un distractor (${err}) és la solució`);
                                    const resp = { ...pas.solucio, [c]: v };
                                    const dg = w.diagnosticaGX(pas, resp);
                                    if (!dg || dg.errorType !== err)
                                        malament.push(`${on}: el diagnòstic de ${valorRac(v)} no és ${err}`);
                                }
                        }
                    }
                    if (pas.camps.tria)
                        for (const [v, err] of pas.dades.distractors.tria) {
                            if (!w.ERRORS_GX[err]) malament.push(`${on}: error desconegut ${err}`);
                            if ((w.diagnosticaGX(pas, { tria: v }) || {}).errorType !== err)
                                malament.push(`${on}: el diagnòstic de l’opció ${v} no és ${err}`);
                        }
                    if (w.diagnosticaGX(pas, pas.camps.tria ? { tria: 'cert' } : pas.solucio))
                        malament.push(`${on}: la solució es diagnostica com a error`);
                    if (ok_) comprovades++;
                }
    ok(
        `${n} preguntes, ${comprovades} comprovades contra la gràfica`,
        !malament.length && comprovades === n,
        malament.slice(0, 10).join('\n      → ')
    );
    const tots = [...new Set(Object.values(w.TIPUS_GX).flatMap(t => [...t[1], ...t[2], ...t[3]]))];
    const falten = tots.filter(t => !vistos[t]);
    ok(`els ${tots.length} tipus de pregunta hi surten`, !falten.length, falten.join(', '));
    ok(`varietat: ${claus.size} preguntes diferents de ${n}`, claus.size > n * 0.7);
}

// ─────────────────────────────────────────────────────────────────────────────
suite('3. Històries ben fetes');
{
    const malament = [];
    for (let k = 0; k < 600; k++) {
        const q = w.generaPreguntaGX({ grafiques: 'segments', nivell: 1, index: k });
        const g = llegeix(q.svg);
        const tv = g.taula;
        // Els trams que es mouen tenen pendents diferents (un sol «més de pressa»)
        const p = [];
        for (let x = 0; x < g.T; x++) {
            const d = Math.abs(tv[x + 1] - tv[x]);
            if (d > 0 && !p.some(v => quasi(v, d)) && (x === 0 || !quasi(Math.abs(tv[x] - tv[x - 1]), d))) p.push(d);
        }
        if (valors(g).some(v => v < 0)) malament.push('valor negatiu');
        if (/excursió/.test(q.enunciat) && (tv[0] !== 0 || tv[g.T] !== 0))
            malament.push('l’excursió no surt de casa o no hi torna');
        if (!Object.values(tv).some((v, i, a) => i > 0 && quasi(v, a[i - 1], 0.15))) malament.push('cap tram pla');
    }
    ok(
        '600 gràfiques de segments: valors no negatius, l’excursió surt de casa i hi torna, sempre hi ha un tram pla',
        !malament.length,
        malament.slice(0, 5).join(', ')
    );
    // L'eix vertical de les corbes: com a molt 9 números i la gràfica hi cap
    const eixos = [];
    for (let k = 0; k < 300; k++) {
        const q = w.generaPreguntaGX({ grafiques: 'corbes', nivell: 1, index: 1 + 2 * (k % 50) });
        const marques = (q.svg.match(/<text class="ge-marca"[^>]*text-anchor="end">/g) || []).length;
        const g = llegeix(q.svg);
        const sostre = Math.max(...[...q.svg.matchAll(/data-v="([\d.]+)"/g)].map(m => Number(m[1])));
        if (marques > 9 || Math.max(...valors(g)) > sostre + 0.1) eixos.push(`${marques} números, sostre ${sostre}`);
    }
    ok(
        'corbes: com a molt 9 números a l’eix vertical i la gràfica hi cap',
        !eixos.length,
        eixos.slice(0, 3).join(', ')
    );
    const ts = Array.from({ length: 200 }, () => w.tramsTemperatura());
    ok(
        'temperatura: mínim a la matinada, màxim a la tarda, entre 4 i 28 °C',
        ts.every(
            t =>
                t[0].x1 >= 5 &&
                t[0].x1 <= 7 &&
                t[1].x1 >= 14 &&
                t[1].x1 <= 16 &&
                t[0].y1 < t[0].y0 &&
                t[1].y1 > t[2].y1 &&
                t[1].y1 <= 28 &&
                t[0].y1 >= 4
        )
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('4. Opcions, nivells i menes');
{
    eq('les menes s’alternen', [0, 1, 2, 3].map(i => w.menaGX('', i)).join(), 'segments,temperatura,forma,segments');
    eq('corbes: temperatura i forma', w.GRAFIQUES_GX.corbes.join(), 'temperatura,forma');
    const fora = [];
    for (const [grup, tipus] of Object.entries(w.PREGUNTES_GX))
        for (const grafiques of Object.keys(w.GRAFIQUES_GX))
            for (let k = 0; k < 30; k++) {
                const id = w.generaPreguntaGX({ grafiques, preguntes: grup, nivell: 1, index: k }).passos[0].id;
                if (!tipus.includes(id)) fora.push(`${grafiques}/${grup}: ${id}`);
            }
    ok('?preguntes=: cada grup només dona els seus tipus', !fora.length, fora.slice(0, 5).join(', '));
    const tots = [...new Set(Object.values(w.TIPUS_GX).flatMap(t => [...t[1], ...t[2], ...t[3]]))];
    const enGrup = Object.values(w.PREGUNTES_GX).flat();
    ok(
        'cada tipus de pregunta és en un grup, i només en un',
        tots.every(t => enGrup.filter(x => x === t).length === 1) && enGrup.length === tots.length
    );
    let n1 = 0;
    for (let k = 0; k < 300; k++)
        if (
            ['antiimatge', 'rapid', 'relat', 'velocitat', 'afirmacions', 'increment', 'forma'].includes(
                w.tipusGX(['segments', 'temperatura', 'forma'][k % 3], 1)
            )
        )
            n1++;
    ok('nivell 1: només llegir i descriure el més senzill', n1 === 0);
    eq(
        'l’historial escriu 2,5 i 4',
        w.textRespostaGX({ camps: { a: 'decimal', b: 'decimal' } }, { a: [5, 2], b: [4, 1] }),
        '2,5 i 4'
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('5. La pàgina');
{
    const html = fs.readFileSync(path.join(ROOT, 'grafiques-context.html'), 'utf8');
    ok(
        'tema de funcions i el CSS dels gràfics comuns',
        /<html lang="ca" class="tema-funcions">/.test(html) && /href="css\/grafic-estadistic\.css"/.test(html)
    );
    const ctrl = fs.readFileSync(path.join(ROOT, 'js/grafiques-context/grafiques-context.js'), 'utf8');
    ok(
        'el controlador llegeix ?grafiques, ?preguntes i ?opcions',
        ['grafiques', 'preguntes', 'opcions'].every(p => ctrl.includes(`'${p}'`))
    );
    const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    ok(
        'index.html: a la llista d’ESO i amb les seves opcions',
        /file: 'grafiques-context\.html'/.test(idx) && /'grafiques-context\.html': \[/.test(idx)
    );
    ok(
        'codi d’exercici GX',
        /'grafiques-context': 'GX'/.test(fs.readFileSync(path.join(ROOT, 'js/exercise-codes.js'), 'utf8'))
    );
    const jp = fs.readFileSync(path.join(ROOT, 'js/passos/joc-passos.js'), 'utf8');
    ok(
        'el joc de passos pinta les opcions que són dibuixos',
        /pas\.opcions\.forEach\(\(\[valor, text, svg(, formules)?\]\)/.test(jp) && /jp-opcio-svg/.test(jp)
    );
}

finish('GRÀFIQUES EN CONTEXT');
