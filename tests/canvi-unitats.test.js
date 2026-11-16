/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/canvi-unitats.test.js
 * ROL: Tests de «Canvi d'unitats» (js/canvi-unitats/) i de l'escala comuna
 *      (js/passos/escala-unitats.js).
 * ARQUITECTURA:
 * - 1. L'escala: els graons en ordre, la unitat de partida i la d'arribada
 *   marcades, i la regla del graó.
 * - 2. Milers de canvis de cada magnitud i nivell. La solució de cada pas es
 *   recalcula aquí, amb una taula d'unitats pròpia (cada unitat, com a potència
 *   de 10 de la unitat base; 1 l = 1 dm³) i aritmètica exacta (BigInt), a partir
 *   del text de l'enunciat: els graons i el sentit, el factor i el resultat. La
 *   resposta bona s'accepta (escrita amb coma); cada opció dolenta i cada valor
 *   equivocat té el seu error, que el diagnòstic reconeix; KaTeX dibuixa totes les
 *   fórmules; i cada nivell té les magnituds, els graons i els decimals que li
 *   toquen.
 * - 3. Les opcions d'index.html són les que entén el joc.
 * ÚS: node tests/canvi-unitats.test.js
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
        'js/passos/escala-unitats.js',
        'js/canvi-unitats/strings.js',
        'js/canvi-unitats/math-engine.js',
        'js/canvi-unitats/errors.js',
    ],
    { seed: 20261116 }
);
const { ERRORS_CU, MAGNITUDS_CU, corregeixPas, diagnosticaCU, generaPreguntaCU, magnitudCU, svgEscalaUnitats } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const BAD_TEXT = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b/;

// ── La taula d'unitats de la prova: cada unitat, com a potència de 10 de la base (m, g, l; m², m³) ──
const PREFIX = { 'k': 3, 'h': 2, 'da': 1, '': 0, 'd': -1, 'c': -2, 'm': -3 };
function potenciaUnitat(u) {
    const m = u.match(/^(k|h|da|d|c|m)?(m|g|l)([²³]?)$/);
    if (!m) throw new Error(`unitat desconeguda: ${u}`);
    const [, pre = '', base, sup] = m;
    if (base === 'l') return { magnitud: 'capacitat', p: PREFIX[pre] - 3, volum: true }; // 1 l = 1 dm³ = 10⁻³ m³
    const e = sup === '²' ? 2 : sup === '³' ? 3 : 1;
    const magnitud = base === 'g' ? 'massa' : e === 1 ? 'longitud' : e === 2 ? 'superficie' : 'volum';
    return { magnitud, p: PREFIX[pre] * e, e };
}
// Aritmètica exacta
const mcd = (a, b) => (b ? mcd(b, a % b) : a < 0n ? -a : a);
const fr = (n, d = 1n) => {
    const g = mcd(n, d) || 1n;
    return [n / g, d / g];
};
const decimal = text => {
    const net = text.replace(/[\s\u202f]/g, '');
    const [e, f = ''] = net.split(',');
    return fr(BigInt(e + f), 10n ** BigInt(f.length));
};
const perPotencia = ([n, d], p) => (p >= 0 ? fr(n * 10n ** BigInt(p), d) : fr(n, d * 10n ** BigInt(-p)));
const iguals = ([a, b], v) => {
    const [c, d] = Array.isArray(v) ? v : [v, 1];
    return a * BigInt(d) === BigInt(c) * b;
};
const textDe = ([n, d]) => {
    // el decimal amb coma, com l'escriuria l'alumne
    let t = 0;
    while (10n ** BigInt(t) % d !== 0n) t++;
    const escala = (n * 10n ** BigInt(t)) / d;
    const s = escala.toString().padStart(t + 1, '0');
    return t ? `${s.slice(0, -t)},${s.slice(-t)}` : s;
};

suite("1. L'escala de les unitats (js/passos/escala-unitats.js)");
{
    const unitats = ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'];
    const svg = svgEscalaUnitats({ unitats, factor: 10, origen: 0, desti: 3, nom: 'longitud' });
    const graons = [...svg.matchAll(/<g class="([^"]*)" data-unitat="([^"]+)">/g)];
    eq('els set graons, de la unitat més gran a la més petita', graons.map(g => g[2]).join(' '), unitats.join(' '));
    ok(
        'la unitat de partida i la d’arribada, marcades',
        /eu-origen/.test(graons[0][1]) && /eu-desti/.test(graons[3][1])
    );
    ok(
        'cada graó és més avall i més a la dreta que l’anterior',
        [...svg.matchAll(/class="eu-cara" x="(\d+)" y="(\d+)"/g)]
            .slice(0, 7)
            .every((m, i, t) => !i || (+m[1] > +t[i - 1][1] && +m[2] > +t[i - 1][2]))
    );
    ok('la regla del graó', /Baixar un graó: × 10 · Pujar un graó: : 10/.test(svg));
    const sense = svgEscalaUnitats({ unitats, factor: 100 });
    ok('sense unitats marcades, cap llegenda', !/eu-origen|eu-desti|eu-llegenda/.test(sense) && /× 100/.test(sense));
}

suite('2. Els canvis: passos, solucions, opcions i errors');
{
    const dolents = { solucio: [], opcions: [], errors: [], katex: [], text: [], nivell: [] };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const magnituds = { 1: new Set(), 2: new Set(), 3: new Set() };
    const vistos = { errors: new Set(), salts: new Set() };
    let canvis = 0;
    const katexOk = tex => !/katex-error/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));
    const combinacions = [];
    for (const nivell of [1, 2, 3]) {
        combinacions.push(['', nivell]);
        for (const m of Object.keys(MAGNITUDS_CU).filter(Boolean)) combinacions.push([m, nivell]);
    }
    for (const [opcio, nivell] of combinacions)
        for (let k = 0; k < 500; k++) {
            canvis++;
            const magnitud = magnitudCU(opcio, nivell);
            magnituds[nivell].add(magnitud);
            const q = generaPreguntaCU(magnitud, nivell);
            const on = `${opcio || '(nivell)'} ${nivell}: ${q.text}`;
            if (opcio && magnitud !== opcio) anota(dolents.nivell, `${on}: magnitud ${magnitud}`);
            // L'enunciat, llegit aquí: «3,5 km = ? m»
            const mt = q.text.match(/^([\d\s\u202f]+(?:,\d+)?) (\S+) = \? (\S+)$/);
            if (!mt) {
                anota(dolents.text, on);
                continue;
            }
            const [v, de, a] = [decimal(mt[1]), potenciaUnitat(mt[2]), potenciaUnitat(mt[3])];
            const esperat = perPotencia(v, de.p - a.p);
            // Els graons es compten a l'escala on es fa el canvi (a volum ↔ capacitat, la del volum)
            const volCap = magnitud === 'volum-capacitat';
            const e = volCap ? 3 : de.e || a.e || 1;
            const salts = Math.abs(de.p - a.p) / e;
            const avall = de.p > a.p;
            vistos.salts.add(`${magnitud}:${salts}`);
            // Cada nivell: les seves magnituds, graons i decimals
            const maxSalts = { 1: [3, 2, 1], 2: [4, 3, 2], 3: [6, 3, 2] }[nivell][e - 1];
            if (!Number.isInteger(salts) || salts < 1 || salts > maxSalts)
                anota(dolents.nivell, `${on}: ${salts} graons`);
            const ids = q.passos.map(p => p.id).join(',');
            if (ids !== (volCap ? 'equivalencia,salts,operacio,resultat' : 'salts,operacio,resultat'))
                anota(dolents.solucio, `${on}: passos ${ids}`);
            for (const pas of q.passos) {
                // La solució, recalculada aquí
                const sol = pas.solucio;
                if (pas.id === 'salts' && sol.tria !== `${salts}-${avall ? 'avall' : 'amunt'}`)
                    anota(dolents.solucio, `${on}: graons ${sol.tria}`);
                if (pas.id === 'operacio' && sol.tria !== `${avall ? 'x' : 'd'}${10 ** (e * salts)}`)
                    anota(dolents.solucio, `${on}: operació ${sol.tria}`);
                if (pas.id === 'resultat' && !iguals(esperat, sol.r))
                    anota(dolents.solucio, `${on}: resultat ${sol.r}`);
                // La resposta bona cap a la casella (el joc de passos no deixa escriure més caràcters)
                const camp = pas.plantilla.find(t => t.camp === 'r');
                if (camp && textDe(esperat).length > (camp.llarg || 6))
                    anota(dolents.solucio, `${on}: «${textDe(esperat)}» no cap a la casella`);
                if (pas.id === 'equivalencia') {
                    const c = mt[2].endsWith('l') ? mt[2] : mt[3];
                    if (potenciaUnitat(c).p !== potenciaUnitat(sol.tria).p)
                        anota(dolents.solucio, `${on}: 1 ${c} = 1 ${sol.tria}`);
                }
                if (pas.id === 'resultat') {
                    let t = 0;
                    while (10n ** BigInt(t) % esperat[1] !== 0n) t++;
                    if (t > 6) anota(dolents.nivell, `${on}: ${t} decimals`);
                }
                // La resposta bona s'accepta
                const bona = pas.camps.r ? { r: { v: textDe(esperat), p: '' } } : { tria: sol.tria };
                const r = corregeixPas(pas, bona);
                if (r.estat !== 'ok') anota(dolents.solucio, `${on}, ${pas.id}: la bona dona ${r.estat}`);
                // Opcions: 4 i diferents, la bona hi és, i cada dolenta té el seu error
                const distractors = pas.dades.distractors[pas.camps.r ? 'r' : 'tria'];
                if (pas.opcions) {
                    const valors = pas.opcions.map(o => o[0]);
                    const senseError = valors.filter(x => x !== sol.tria && !distractors.some(([d]) => d === x));
                    if (
                        valors.length !== 4 ||
                        new Set(valors).size !== 4 ||
                        !valors.includes(sol.tria) ||
                        senseError.length
                    )
                        anota(dolents.opcions, `${on}, ${pas.id}: ${valors.join(' ')}`);
                }
                // Cada distractor és equivocat i el diagnòstic en reconeix l'error
                for (const [valor, errorType] of distractors) {
                    vistos.errors.add(errorType);
                    const resp = pas.camps.r
                        ? {
                              r: {
                                  v: textDe(
                                      fr(
                                          BigInt(Array.isArray(valor) ? valor[0] : valor),
                                          BigInt(Array.isArray(valor) ? valor[1] : 1)
                                      )
                                  ),
                                  p: '',
                              },
                          }
                        : { tria: valor };
                    const c = corregeixPas(pas, resp);
                    const d = diagnosticaCU(pas, c.valors);
                    if (c.estat !== 'error' || !ERRORS_CU[errorType] || !d || d.errorType !== errorType)
                        anota(
                            dolents.errors,
                            `${on}, ${pas.id}: ${JSON.stringify(valor)} → ${c.estat} ${d && d.errorType} (${errorType})`
                        );
                }
                if (canvis % 7 === 0 && !katexOk(pas.linia)) anota(dolents.katex, `${on}: ${pas.linia}`);
                const textos = [pas.enunciat, pas.linia, ...(pas.opcions || []).map(o => o[1])].join(' ');
                if (BAD_TEXT.test(textos)) anota(dolents.text, `${on}, ${pas.id}: ${textos}`);
            }
            if (canvis % 7 === 0 && !katexOk(q.tex)) anota(dolents.katex, `${on}: ${q.tex}`);
            if (BAD_TEXT.test(q.text + q.tex + q.svg)) anota(dolents.text, on);
        }
    ok(
        `${canvis} canvis: la solució de cada pas, recalculada a part`,
        !dolents.solucio.length,
        dolents.solucio.join('\n      → ')
    );
    ok(
        'la resposta bona s’accepta i les opcions són 4, diferents, amb la bona',
        !dolents.opcions.length,
        dolents.opcions.join('\n      → ')
    );
    ok(
        'cada opció i cada valor equivocat té el seu error, i el diagnòstic el reconeix',
        !dolents.errors.length,
        dolents.errors.join('\n      → ')
    );
    ok('KaTeX dibuixa les fórmules (enunciats i línies)', !dolents.katex.length, dolents.katex.join('\n      → '));
    ok('cap text amb undefined, NaN…', !dolents.text.length, dolents.text.join('\n      → '));
    ok(
        'cada nivell, els seus graons i els seus decimals (com a molt 6); l’opció mana',
        !dolents.nivell.length,
        dolents.nivell.join('\n      → ')
    );
    eq(
        'surten tots els errors de la taxonomia',
        [...vistos.errors].sort().join(' '),
        Object.keys(ERRORS_CU).sort().join(' ')
    );
    ok(
        'hi ha varietat de graons (de 1 a 6 a la longitud)',
        [1, 2, 3, 4, 5, 6].every(s => vistos.salts.has(`longitud:${s}`))
    );
    // Segons el nivell: 1 longitud, massa i capacitat; 2 superfície i volum; 3 volum ↔ capacitat i de tot
    const nivellSol = n => [...new Set(Array.from({ length: 400 }, () => magnitudCU('', n)))].sort().join(' ');
    eq('segons el nivell, nivell 1', nivellSol(1), 'capacitat longitud massa');
    eq('segons el nivell, nivell 2', nivellSol(2), 'superficie volum');
    eq('segons el nivell, nivell 3', nivellSol(3), 'capacitat longitud massa superficie volum volum-capacitat');
}

suite("3. Les opcions d'index.html");
{
    const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const m = idx.match(/'canvi-unitats\.html': \[\s*\{ param: 'magnitud'[^\n]*valors: (\[\[.*\]\]) \}/);
    ok('index.html té l’opció «magnitud» de canvi-unitats.html', Boolean(m));
    const valors = m ? [...m[1].matchAll(/\['([^']*)', /g)].map(x => x[1]) : [];
    eq('i els seus valors són els que entén el joc', valors.join(','), Object.keys(MAGNITUDS_CU).join(','));
}

finish("TESTS DE CANVI D'UNITATS");
