/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/arees-volums.test.js
 * ROL: Tests d'«Àrees i volums» (js/arees-volums/) i de les figures de mesura comunes
 *      (js/passos/figures-mesura.js).
 * ARQUITECTURA:
 * - 1. Les figures: cada segment amb mesura té la seva etiqueta (i cap més), les
 *   altures són discontínues amb l'angle recte i el dibuix cap al requadre.
 * - 2. Milers de preguntes de cada figura. Les mesures es tornen a llegir del dibuix
 *   (les etiquetes «a = 12 cm» i el seu data-mesura) i aquí es recalcula, amb
 *   fraccions exactes (BigInt) i π = 3,14, la solució de cada pas: les lletres de la
 *   base, l'altura, les diagonals o les bases; el radi; cada àrea i cada volum; la
 *   unitat; i el text de la fórmula bona. També es comprova que el dibuix és
 *   possible (Pitàgores als costats inclinats). La resposta bona s'accepta (escrita
 *   amb coma) i cap a la casella; cada opció dolenta i cada valor equivocat té el
 *   seu error, que el diagnòstic reconeix; KaTeX dibuixa totes les fórmules; i cada
 *   nivell i cada opció ?dim= té les figures que li toquen.
 * - 3. Les opcions d'index.html són les que entén el joc.
 * ÚS: node tests/arees-volums.test.js
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
        'js/passos/figures-mesura.js',
        'js/arees-volums/strings.js',
        'js/arees-volums/math-engine.js',
        'js/arees-volums/errors.js',
    ],
    { seed: 20261116 }
);
const { ALT_FM, AMPLE_FM, ERRORS_AV, FIGURES_AV, corregeixPas, diagnosticaAV, figuraAV, generaPreguntaAV } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const BAD_TEXT = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b/;

// ── Fraccions exactes ────────────────────────────────────────────────────────
const mcd = (a, b) => (b ? mcd(b, a % b) : a < 0n ? -a : a);
const fr = (n, d = 1n) => {
    const g = mcd(n, d) || 1n;
    return [n / g, d / g];
};
const F = x => (Array.isArray(x) ? fr(BigInt(x[0]), BigInt(x[1])) : fr(BigInt(x)));
const mul = (...xs) => xs.map(F).reduce(([a, b], [c, d]) => fr(a * c, b * d), [1n, 1n]);
const add = (...xs) => xs.map(F).reduce(([a, b], [c, d]) => fr(a * d + c * b, b * d), [0n, 1n]);
const sub = (x, y) => add(x, mul(y, -1));
const div = (x, n) => mul(x, [1, n]);
const PI = [314, 100];
const iguals = (x, y) => {
    const [[a, b], [c, d]] = [F(x), F(y)];
    return a * d === c * b;
};
const textDe = x => {
    // el decimal amb coma, com l'escriuria l'alumne
    const [n, d] = F(x);
    let t = 0;
    while (10n ** BigInt(t) % d !== 0n) if (++t > 30) return `periòdic ${n}/${d}`;
    const s = ((n * 10n ** BigInt(t)) / d).toString().padStart(t + 1, '0');
    return t ? `${s.slice(0, -t)},${s.slice(-t)}` : s;
};
const llegeix = text => {
    const [e, f = ''] = text.split(',');
    return fr(BigInt(e + f), 10n ** BigInt(f.length));
};
const quadrat = x => mul(x, x);

/** Les etiquetes d'un dibuix: { mesura: { lletra, valor, text } } i la unitat. */
function mesuresDe(svg) {
    const M = {};
    const unitats = new Set();
    for (const m of svg.matchAll(
        /<text class="fm-etiqueta" data-segment="([a-d])" data-mesura="([\w-]+)"[^>]*>([a-d]) = ([\d,]+) (\w+)<\/text>/g
    )) {
        M[m[2]] = { lletra: m[1], valor: llegeix(m[4]), text: `${m[3]} = ${m[4]} ${m[5]}`, iguals: m[1] === m[3] };
        unitats.add(m[5]);
    }
    return { M, u: unitats.size === 1 ? [...unitats][0] : null };
}

// ── La solució de cada figura, recalculada a partir del dibuix ───────────────
const parell = (M, x, y) => [M[x].lletra, M[y].lletra].sort().join('');
const FORMULA = {
    triangle: 'base · altura : 2',
    paralelogram: 'base · altura',
    rombe: 'diagonal gran · diagonal petita : 2',
    trapezi: '(base gran + base petita) · altura : 2',
    cercle: 'π · radi²',
};
/** { passos (ids en ordre), sol: { id: valor o lletra }, text: { id: text de l'opció bona }, possible } */
function esperat(figura, M, u) {
    const v = id => M[id].valor;
    const u2 = `${u}²`,
        u3 = `${u}³`;
    const pla = (passos, sol) => ({ passos, sol, text: { formula: FORMULA[figura], unitat: u2 } });
    const composta = (suma, p1, p2) => ({
        passos: ['estrategia', 'part1', 'part2', 'total', 'unitat'],
        sol: { part1: p1, part2: p2, total: suma ? add(p1, p2) : sub(p1, p2) },
        text: { estrategia: suma ? /^Sumar/ : /^Restar/, unitat: u2 },
    });
    const cos = (passos, sol) => ({ passos, sol, text: { unitat: u3 } });
    const catet = (h, c) => sub(quadrat(c), quadrat(h)); // c² − h²
    switch (figura) {
        case 'triangle': {
            // el peu de l'altura cau dins de la base: √(esq² − h²) + √(dre² − h²) = base
            const [p, q] = [catet(v('altura'), v('esq')), catet(v('altura'), v('dre'))].map(x =>
                Math.sqrt(Number(x[0]) / Number(x[1]))
            );
            const e = pla(['formula', 'base', 'altura', 'calcul', 'unitat'], {
                base: M.base.lletra,
                altura: M.altura.lletra,
                calcul: div(mul(v('base'), v('altura')), 2),
            });
            e.possible = Math.abs(p + q - Number(v('base')[0])) < 1e-9;
            return e;
        }
        case 'paralelogram': {
            const e = pla(['formula', 'base', 'altura', 'calcul', 'unitat'], {
                base: M.base.lletra,
                altura: M.altura.lletra,
                calcul: mul(v('base'), v('altura')),
            });
            e.possible = Number(v('costat')[0]) > Number(v('altura')[0]);
            return e;
        }
        case 'rombe': {
            const e = pla(['formula', 'diagonals', 'calcul', 'unitat'], {
                diagonals: parell(M, 'gran', 'petita'),
                calcul: div(mul(v('gran'), v('petita')), 2),
            });
            e.possible = iguals(quadrat(v('costat')), add(quadrat(div(v('gran'), 2)), quadrat(div(v('petita'), 2))));
            return e;
        }
        case 'trapezi': {
            const e = pla(['formula', 'bases', 'altura', 'calcul', 'unitat'], {
                bases: parell(M, 'gran', 'petita'),
                altura: M.altura.lletra,
                calcul: div(mul(add(v('gran'), v('petita')), v('altura')), 2),
            });
            e.possible = iguals(quadrat(v('costat')), add(quadrat(sub(v('gran'), v('petita'))), quadrat(v('altura'))));
            return e;
        }
        case 'cercle': {
            const r = div(v('diametre'), 2);
            return pla(['formula', 'radi', 'calcul', 'unitat'], { radi: r, calcul: mul(PI, r, r) });
        }
        case 'casa':
            return composta(true, mul(v('ample'), v('alt')), div(mul(v('ample'), v('teulada')), 2));
        case 'forat':
            return composta(false, mul(v('ample'), v('alt')), mul(PI, v('radi'), v('radi')));
        case 'porta':
            return composta(true, mul(v('ample'), v('alt')), div(mul(PI, quadrat(div(v('ample'), 2))), 2));
        case 'L':
            return composta(false, mul(v('ample'), v('alt')), mul(v('falta-ample'), v('falta-alt')));
        case 'ortoedre': {
            const AB = mul(v('ample'), v('fons'));
            const AL = mul(2, add(v('ample'), v('fons')), v('alt'));
            return cos(['base3', 'lateral', 'total3', 'volum', 'unitat'], {
                base3: AB,
                lateral: AL,
                total3: add(AL, mul(2, AB)),
                volum: mul(AB, v('alt')),
            });
        }
        case 'cilindre': {
            const AB = mul(PI, v('radi'), v('radi'));
            const AL = mul(2, PI, v('radi'), v('alt'));
            return cos(['base3', 'lateral', 'total3', 'volum', 'unitat'], {
                base3: AB,
                lateral: AL,
                total3: add(AL, mul(2, AB)),
                volum: mul(AB, v('alt')),
            });
        }
        case 'piramide': {
            const AB = quadrat(v('base'));
            const AL = mul(4, div(mul(v('base'), v('apotema')), 2));
            const e = cos(['altura', 'base3', 'lateral', 'total3', 'volum', 'unitat'], {
                altura: M.altura.lletra,
                base3: AB,
                lateral: AL,
                total3: add(AL, AB),
                volum: div(mul(AB, v('altura')), 3),
            });
            e.possible = iguals(quadrat(v('apotema')), add(quadrat(v('altura')), quadrat(div(v('base'), 2))));
            return e;
        }
        case 'con': {
            const AB = mul(PI, v('radi'), v('radi'));
            const AL = mul(PI, v('radi'), v('generatriu'));
            const e = cos(['altura', 'base3', 'lateral', 'total3', 'volum', 'unitat'], {
                altura: M.altura.lletra,
                base3: AB,
                lateral: AL,
                total3: add(AL, AB),
                volum: div(mul(AB, v('altura')), 3),
            });
            e.possible = iguals(quadrat(v('generatriu')), add(quadrat(v('altura')), quadrat(v('radi'))));
            return e;
        }
        case 'esfera': {
            const r = v('radi');
            const e = cos(['area', 'formulaVolum', 'volum', 'unitat'], {
                area: mul(4, PI, r, r),
                volum: div(mul(4, PI, r, r, r), 3),
            });
            e.text.formulaVolum = '4 · π · radi³ : 3';
            return e;
        }
    }
    return null;
}

const TOTES = Object.keys(w.TEXTOS_AV.figura);
const katexOk = tex => !/katex-error/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));

suite('1. Les figures de mesura (js/passos/figures-mesura.js)');
{
    const dolents = [];
    const vistes = new Set();
    for (const figura of TOTES)
        for (let k = 0; k < 40; k++) {
            const q = generaPreguntaAV(figura);
            vistes.add(figura);
            const { M, u } = mesuresDe(q.svg);
            const etiquetes = (q.svg.match(/class="fm-etiqueta"/g) || []).length;
            const valors = Object.keys(q.dades.valors);
            if (etiquetes !== valors.length || valors.some(id => !M[id] || !M[id].iguals))
                dolents.push(`${figura}: ${etiquetes} etiquetes per a ${valors.join(',')}`);
            if (u !== q.dades.u) dolents.push(`${figura}: unitat ${u}`);
            // Les altures, discontínues amb l'angle recte (al trapezi rectangle, l'altura és el costat
            // vertical); les lletres, diferents
            if (figura !== 'trapezi' && /altura|teulada/.test(valors.join(' ')) && !/fm-altura/.test(q.svg))
                dolents.push(`${figura}: sense altura discontínua`);
            if (
                ['triangle', 'paralelogram', 'trapezi', 'casa', 'piramide', 'con'].includes(figura) &&
                !/fm-recte/.test(q.svg)
            )
                dolents.push(`${figura}: sense angle recte`);
            if (new Set(Object.values(M).map(s => s.lletra)).size !== valors.length)
                dolents.push(`${figura}: lletres repetides`);
            // Dins del requadre: els punts i les etiquetes senceres (amplada estimada amb les mides de la
            // lletra de 13 px en negreta, mesurades al navegador, i un 5 % de marge)
            const nums = [...q.svg.matchAll(/\b(?:x|y|x1|y1|x2|y2|cx|cy)="(-?[\d.]+)"/g)].map(m => +m[1]);
            if (nums.some(n => n < 0 || n > AMPLE_FM)) dolents.push(`${figura}: un punt fora del requadre`);
            for (const m of q.svg.matchAll(
                /<text class="fm-etiqueta"[^>]* x="([\d.-]+)" y="([\d.-]+)" text-anchor="(\w+)">([^<]*)</g
            )) {
                const ample = 1.05 * [...m[4]].reduce((t, c) => t + (c === ' ' ? 3.5 : /[mw]/.test(c) ? 11.9 : 7.6), 0);
                const [x, y] = [+m[1], +m[2]];
                const [x0, x1] = { start: [x, x + ample], middle: [x - ample / 2, x + ample / 2], end: [x - ample, x] }[
                    m[3]
                ];
                if (x0 < 0 || x1 > AMPLE_FM || y < 12 || y > ALT_FM)
                    dolents.push(`${figura}: «${m[4]}» fora del requadre`);
            }
        }
    ok(
        'cada segment amb mesura, la seva etiqueta (lletra, valor i unitat)',
        !dolents.length,
        dolents.slice(0, 5).join('\n      → ')
    );
    eq('hi ha totes les figures', [...vistes].sort().join(' '), [...TOTES].sort().join(' '));
}

suite('2. Les preguntes: passos, solucions, opcions i errors');
{
    const dolents = { solucio: [], opcions: [], errors: [], katex: [], text: [], dibuix: [] };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const vistos = { errors: new Set(), unitats: new Set() };
    let preguntes = 0;
    for (const figura of TOTES)
        for (let k = 0; k < 600; k++) {
            preguntes++;
            const q = generaPreguntaAV(figura);
            const on = `${q.text}`;
            const { M, u } = mesuresDe(q.svg);
            vistos.unitats.add(u);
            const e = esperat(figura, M, u);
            if (e.possible === false) anota(dolents.dibuix, `${on}: el dibuix no és possible`);
            const ids = q.passos.map(p => p.id).join(',');
            if (ids !== e.passos.join(',')) anota(dolents.solucio, `${on}: passos ${ids}`);
            for (const pas of q.passos) {
                const sol = pas.solucio;
                const triada = pas.opcions && pas.opcions.find(o => o[0] === sol.tria);
                // La solució, recalculada aquí
                if (pas.camps.r) {
                    if (!(pas.id in e.sol) || !iguals(e.sol[pas.id], sol.r))
                        anota(
                            dolents.solucio,
                            `${on}, ${pas.id}: ${JSON.stringify(sol.r)} ≠ ${textDe(e.sol[pas.id] || 0)}`
                        );
                    const camp = pas.plantilla.find(t => t.camp === 'r');
                    if (textDe(sol.r).length > (camp.llarg || 6))
                        anota(dolents.solucio, `${on}, ${pas.id}: «${textDe(sol.r)}» no cap a la casella`);
                } else if (pas.id in e.sol) {
                    if (sol.tria !== e.sol[pas.id]) anota(dolents.solucio, `${on}, ${pas.id}: ${sol.tria}`);
                } else if (pas.id in e.text) {
                    const t = e.text[pas.id];
                    if (!triada || !(t instanceof RegExp ? t.test(triada[1]) : triada[1] === t))
                        anota(dolents.solucio, `${on}, ${pas.id}: «${triada && triada[1]}»`);
                } else anota(dolents.solucio, `${on}, ${pas.id}: cap solució esperada`);
                // Les lletres i les unitats, tal com són (sense majúscula: «b = 6 cm», «cm²»)
                if (['base', 'altura', 'diagonals', 'bases', 'unitat'].includes(pas.id) && pas.literal !== true)
                    anota(dolents.opcions, `${on}, ${pas.id}: les opcions no són literals`);
                // Les opcions de lletra diuen el mateix que el dibuix
                if (['base', 'altura'].includes(pas.id)) {
                    const textos = Object.values(M).map(s => s.text);
                    if (pas.opcions.some(o => !textos.includes(o[1])))
                        anota(dolents.opcions, `${on}, ${pas.id}: ${pas.opcions.map(o => o[1]).join(' | ')}`);
                }
                // La resposta bona s'accepta
                const bona = pas.camps.r ? { r: { v: textDe(sol.r), p: '' } } : { tria: sol.tria };
                const r = corregeixPas(pas, bona);
                if (r.estat !== 'ok') anota(dolents.solucio, `${on}, ${pas.id}: la bona dona ${r.estat}`);
                // Opcions: de 3 a 4, diferents, la bona hi és, i cada dolenta té el seu error
                const distractors = pas.dades.distractors[pas.camps.r ? 'r' : 'tria'];
                if (pas.opcions) {
                    const valors = pas.opcions.map(o => o[0]);
                    const senseError = valors.filter(x => x !== sol.tria && !distractors.some(([d]) => d === x));
                    if (
                        valors.length < 3 ||
                        valors.length > 4 ||
                        new Set(valors).size !== valors.length ||
                        new Set(pas.opcions.map(o => o[1])).size !== valors.length ||
                        !triada ||
                        senseError.length
                    )
                        anota(dolents.opcions, `${on}, ${pas.id}: ${valors.join(' ')}`);
                }
                // Cada distractor és equivocat i el diagnòstic en reconeix l'error
                for (const [valor, errorType] of distractors) {
                    vistos.errors.add(errorType);
                    const resp = pas.camps.r ? { r: { v: textDe(valor), p: '' } } : { tria: valor };
                    const c = corregeixPas(pas, resp);
                    const d = diagnosticaAV(pas, c.valors);
                    if (c.estat !== 'error' || !ERRORS_AV[errorType] || !d || d.errorType !== errorType)
                        anota(
                            dolents.errors,
                            `${on}, ${pas.id}: ${JSON.stringify(valor)} → ${c.estat} ${d && d.errorType} (${errorType})`
                        );
                }
                if (preguntes % 5 === 0) {
                    const texs = [pas.linia, ...pas.plantilla.filter(t => t.tex).map(t => t.tex)];
                    for (const tex of texs) if (!katexOk(tex)) anota(dolents.katex, `${on}, ${pas.id}: ${tex}`);
                }
                const textos = [pas.enunciat, pas.linia, pas.nom, ...(pas.opcions || []).map(o => o[1])].join(' ');
                if (BAD_TEXT.test(textos)) anota(dolents.text, `${on}, ${pas.id}: ${textos}`);
            }
            if (BAD_TEXT.test(q.text + q.enunciat + q.svg)) anota(dolents.text, on);
        }
    ok(
        `${preguntes} preguntes: la solució de cada pas, recalculada a partir del dibuix`,
        !dolents.solucio.length,
        dolents.solucio.join('\n      → ')
    );
    ok(
        'el dibuix és possible (Pitàgores als costats inclinats)',
        !dolents.dibuix.length,
        dolents.dibuix.join('\n      → ')
    );
    ok(
        'la resposta bona s’accepta; les opcions, de 3 a 4, diferents i amb la bona',
        !dolents.opcions.length,
        dolents.opcions.join('\n      → ')
    );
    ok(
        'cada opció i cada valor equivocat té el seu error, i el diagnòstic el reconeix',
        !dolents.errors.length,
        dolents.errors.join('\n      → ')
    );
    ok('KaTeX dibuixa les fórmules (plantilles i línies)', !dolents.katex.length, dolents.katex.join('\n      → '));
    ok('cap text amb undefined, NaN…', !dolents.text.length, dolents.text.join('\n      → '));
    eq(
        'surten tots els errors de la taxonomia',
        [...vistos.errors].sort().join(' '),
        Object.keys(ERRORS_AV).sort().join(' ')
    );
    eq('les unitats: cm, dm i m', [...vistos.unitats].sort().join(' '), 'cm dm m');
    // Un error que no és cap dels típics: sense diagnòstic
    const q = generaPreguntaAV('triangle');
    const calcul = q.passos.find(p => p.id === 'calcul');
    const c = corregeixPas(calcul, { r: { v: '1', p: '' } });
    ok(
        'un valor qualsevol és error però sense diagnòstic',
        c.estat === 'error' && diagnosticaAV(calcul, c.valors) === null
    );
}

suite('3. Els nivells i l’opció ?dim=');
{
    const figures = (dim, n) => [...new Set(Array.from({ length: 400 }, () => figuraAV(dim, n)))].sort().join(' ');
    eq('tot, nivell 1', figures('', 1), 'paralelogram rombe triangle');
    eq('tot, nivell 2', figures('', 2), 'L casa cercle forat porta trapezi');
    eq('tot, nivell 3', figures('', 3), 'cilindre con esfera ortoedre piramide');
    eq('2D, nivell 2', figures('2', 2), 'cercle trapezi');
    eq('2D, nivell 3', figures('2', 3), 'L casa forat porta');
    eq('3D, nivell 1', figures('3', 1), 'cilindre ortoedre');
    eq('3D, nivell 2', figures('3', 2), 'con piramide');
    eq('3D, nivell 3', figures('3', 3), 'cilindre con esfera ortoedre piramide');
    eq('una opció desconeguda, com «tot»', figures('x', 1), figures('', 1));
}

suite("4. Les opcions d'index.html");
{
    const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const m = idx.match(/'arees-volums\.html': \[\s*\{ param: 'dim'[^\n]*valors: (\[\[.*\]\]) \}/);
    ok('index.html té l’opció «dim» d’arees-volums.html', Boolean(m));
    const valors = m ? [...m[1].matchAll(/\['([^']*)', /g)].map(x => x[1]) : [];
    eq('i els seus valors són els que entén el joc', valors.sort().join(','), Object.keys(FIGURES_AV).sort().join(','));
}

finish('TESTS D’ÀREES I VOLUMS');
