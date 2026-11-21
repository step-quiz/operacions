/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/binomial.test.js
 * ROL: Tests de «Distribució binomial» (js/binomial/).
 * - 1. TOTS els problemes possibles dels tres nivells (uns 3.300), contra un model
 *      independent que llegeix l'enunciat en català (n, p i la pregunta: «almenys dues»,
 *      «com a màxim una», «cap»…) i calcula la probabilitat sumant la fórmula. Cada pas:
 *      la solució de n, p i q; la traducció P(X r k); el camí (la correcta i la llarga
 *      inclouen els casos bons, cap opció falsa no); C(n, k) i P(X = k); la resposta, en
 *      tant per u o en tant per cent com l'enunciat. Opcions: 4, una o dues correctes,
 *      diferents, amb el seu error explicat; KaTeX.
 * - 2. La tolerància: la suma de valors ja arrodonits val; un error d'arrodoniment de més no.
 * - 3. El diagnòstic de cada error típic (n i k, el tant per cent, q = p, sense C(n, k),
 *      exponents intercanviats, sense qⁿ⁻ᵏ, oblidar el 1 −, no passar a %).
 * - 4. El camí llarg: si l'alumne el tria, els passos es refan i la resposta és la mateixa.
 * - 5. Els nivells, la pàgina, l'índex i el codi reservat.
 * ÚS: node tests/binomial.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, finish, loadModule } = require('./harness');

const w = loadModule(
    [
        'js/utils.js',
        'js/algebra/racionals.js',
        'js/passos/taula-signes.js',
        'js/passos/correccio.js',
        'js/binomial/strings.js',
        'js/binomial/math-engine.js',
        'js/binomial/errors.js',
    ],
    { seed: 20261121 }
);
const {
    totsElsProblemes,
    preguntaDeProblema,
    passosSegonsCami,
    generaPreguntaBI,
    diagnosticaBI,
    corregeixPas,
    ERRORS_BI,
} = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));

// ─────────────────────────────────────────────────────────────────────────────
// Model independent: llegir l'enunciat
// ─────────────────────────────────────────────────────────────────────────────
const PARAULES = { cap: 0, un: 1, una: 1, dos: 2, dues: 2, tres: 3, quatre: 4, cinc: 5, sis: 6 };
function llegeixEnunciat(text) {
    // n: «Es trien 4», «En fa 3», «Se'n planten 2», «Es vacunen 5», «test té 3 preguntes», «3 vegades»
    const mn = /(?:Es trien|En fa|planten|Es vacunen|test té|dau|moneda) ?(\d+)/.exec(text);
    const n = Number(mn ? mn[1] : /(\d+) vegades/.exec(text)[1]);
    let p;
    let forma;
    let m;
    if ((m = /(\d+) %/.exec(text))) [p, forma] = [Number(m[1]) / 100, 'pc'];
    else if ((m = /(\d+) de cada (\d+)/.exec(text))) [p, forma] = [Number(m[1]) / Number(m[2]), 'frac'];
    else if ((m = /té (\d+) respostes/.exec(text))) [p, forma] = [1 / Number(m[1]), 'frac'];
    else if (/dau/.test(text)) [p, forma] = [1 / 6, 'frac'];
    else if (/moneda/.test(text)) [p, forma] = [1 / 2, 'frac'];
    else if ((m = /probabilitat de (0,\d+)|és (0,\d+)/.exec(text)))
        [p, forma] = [Number((m[1] || m[2]).replace(',', '.')), 'u'];
    const preg = text.slice(text.lastIndexOf('Quina és la probabilitat'));
    const num = s => PARAULES[s];
    let r;
    let k;
    if (/no surti cap|cap \S+ no/.test(preg)) [r, k] = ['eq', 0];
    else if (/totes les|tots els/.test(preg)) [r, k] = ['eq', n];
    else if ((m = /exactament (\S+)/.exec(preg))) [r, k] = ['eq', num(m[1])];
    else if ((m = /almenys (\S+)/.exec(preg))) [r, k] = ['ge', num(m[1])];
    else if ((m = /com a màxim (\S+)/.exec(preg))) [r, k] = ['le', num(m[1])];
    else if ((m = /més d’(\S+)|més de (\S+)/.exec(preg))) [r, k] = ['gt', num(m[1] || m[2])];
    else if ((m = /menys d’(\S+)|menys de (\S+)/.exec(preg))) [r, k] = ['lt', num(m[1] || m[2])];
    return { n, p, forma, r, k };
}
const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
const comb = (n, k) => fact(n) / (fact(k) * fact(n - k));
const ENTRA = {
    eq: (j, k) => j === k,
    ge: (j, k) => j >= k,
    le: (j, k) => j <= k,
    gt: (j, k) => j > k,
    lt: (j, k) => j < k,
};
const probModel = ({ n, p, r, k }) => {
    let s = 0;
    for (let j = 0; j <= n; j++) if (ENTRA[r](j, k)) s += comb(n, j) * p ** j * (1 - p) ** (n - j);
    return s;
};
/** Els valors de X que inclou una opció del camí («P(X = 0) + P(X = 1)», «1 - [P(X = 5) + …]»). */
function inclosos(tex, n) {
    const js = [...tex.matchAll(/P\(X = (\d+)\)/g)].map(m => Number(m[1]));
    if (!/^1 -/.test(tex)) return js.sort((a, b) => a - b);
    const tots = [];
    for (let j = 0; j <= n; j++) if (!js.includes(j)) tots.push(j);
    return tots;
}
const num = v => (Array.isArray(v) ? v[0] / v[1] : v);
/** Un valor com el que rep el diagnòstic (racional [n, d], amb d decimals). */
const rac = (x, d = 4) => [Math.round(x * 10 ** d), 10 ** d];
const dec = (x, d = 4) => {
    const t = x.toFixed(d);
    const [e, f] = t.split('.');
    return { v: `${e},${f}` };
};

const errors = [];
const nota = (cond, msg) => {
    if (!cond) errors.push(msg);
};
const REL_TEX = { eq: '=', ge: '\\ge', le: '\\le', gt: '>', lt: '<' };

function comprova(q) {
    const e = q.text;
    const m = llegeixEnunciat(e);
    nota(/\?$/.test(e) && !/undefined|NaN|cap vegades|més de cap| {2}/.test(e), `enunciat estrany: ${e}`);
    nota(m.r && m.k !== undefined && m.p > 0, `no s'entén l'enunciat: ${e}`);
    const pr = q.problemaBI;
    nota(
        m.n === pr.n &&
            m.r === pr.r &&
            m.k === pr.k &&
            Math.abs(m.p - pr.p[0] / pr.p[1]) < 1e-12 &&
            m.forma === pr.forma,
        `l'enunciat no diu el problema: ${e} (${JSON.stringify(m)})`
    );
    const esperat = probModel(m);
    const pas = id => q.passos.find(p => p.id === id);
    // Dades
    const d = pas('dades');
    nota(
        d.solucio.n === m.n &&
            Math.abs(num(d.solucio.p) - m.p) < 1e-12 &&
            Math.abs(num(d.solucio.q) - (1 - m.p)) < 1e-12,
        `dades: ${e}`
    );
    // Opcions
    for (const p of q.passos.filter(p => p.mena === 'tria')) {
        nota(p.opcions.length === 4, `${p.id}: ${p.opcions.length} opcions: ${e}`);
        nota(new Set(p.opcions.map(o => o[1])).size === 4, `${p.id}: opcions repetides`);
        nota(p.opcions.filter(o => o[0] === 'ok').length === 1, `${p.id}: no hi ha una correcta`);
        for (const o of p.opcions) {
            nota(katexOk(o[1]), `KaTeX: ${o[1]}`);
            if (!o[0].startsWith('ok')) nota(ERRORS_BI[o[0].split('#')[0]], `${p.id}: ${o[0]} sense explicació`);
        }
    }
    const pp = pas('pregunta');
    nota(pp.opcions.find(o => o[0] === 'ok')[1] === `P(X ${REL_TEX[m.r]} ${m.k})`, `pregunta: ${e}`);
    // Camí: les correctes inclouen exactament els casos bons; cap falsa
    const bons = [];
    for (let j = 0; j <= m.n; j++) if (ENTRA[m.r](j, m.k)) bons.push(j);
    const pc = pas('cami');
    nota(!!pc === (m.r !== 'eq'), `camí: ${e}`);
    if (pc)
        for (const o of pc.opcions) {
            const igual = JSON.stringify(inclosos(o[1], m.n)) === JSON.stringify(bons);
            nota(igual === o[0].startsWith('ok'), `camí ${o[0]} ${o[1]}: ${e}`);
        }
    // Casos i resposta
    const casos = q.passos.filter(p => p.mena === 'cas');
    for (const c of casos) {
        const j = c.dades.j;
        nota(c.solucio.c === comb(m.n, j), `C(${m.n}, ${j})`);
        nota(
            Math.abs(c.solucio.pj - comb(m.n, j) * m.p ** j * (1 - m.p) ** (m.n - j)) <= 5e-5 + 1e-12,
            `P(X = ${j}): ${e}`
        );
        nota(katexOk(c.linia), `KaTeX: ${c.linia}`);
    }
    const ruta = casos.map(c => c.dades.j);
    const curta = Math.min(bons.length, m.n + 1 - bons.length);
    nota(ruta.length === curta, `la ruta no és la curta: ${e}`);
    const fin = pas('final');
    const pcForma = m.forma === 'pc';
    if (fin) {
        const resp = pcForma ? esperat * 100 : esperat;
        nota(
            Math.abs(num(fin.solucio.r) - resp) <= (pcForma ? 0.005 : 5e-5) + 1e-9,
            `resposta ${fin.solucio.r} ≠ ${resp}: ${e}`
        );
        nota(katexOk(fin.linia) && katexOk(fin.plantilla[0].grup[0].tex), `KaTeX: ${fin.linia}`);
    } else {
        nota(casos.length === 1 && !pcForma && bons.length === 1, `sense resposta final: ${e}`);
        nota(Math.abs(casos[0].solucio.pj - esperat) <= 5e-5 + 1e-12, `resposta d'un cas: ${e}`);
    }
    for (const p of q.passos) if (p.linia) nota(katexOk(p.linia), `KaTeX: ${p.linia}`);
}

suite('1. Tots els problemes dels tres nivells, contra el model que llegeix l’enunciat');
{
    let n = 0;
    const contextos = {};
    for (const nivell of [1, 2, 3]) {
        for (const pr of totsElsProblemes(nivell)) {
            const q = preguntaDeProblema(pr);
            contextos[pr.context.id] = (contextos[pr.context.id] || 0) + 1;
            comprova(q);
            n++;
        }
    }
    ok(
        `${n} problemes: enunciat, n, p, q, pregunta, camí, casos i resposta, tot correcte`,
        !errors.length,
        errors.slice(0, 6).join('\n      → ')
    );
    ok(`surten els 7 contextos (${JSON.stringify(contextos)})`, Object.keys(contextos).length === 7);
    const ns = new Set([1, 2, 3].flatMap(nv => totsElsProblemes(nv).map(p => p.n)));
    ok('n va de 2 a 6 (1 < n < 7, com va dir el David)', [...ns].sort().join() === '2,3,4,5,6');
}

suite('2. Decimals i tolerància');
{
    // P(X ≤ 1) amb n = 3, p = 1/4: casos 0,4219 i 0,4219; exacta 0,84375
    const pr = totsElsProblemes(2).find(
        p => p.context.id === 'test' && p.n === 3 && p.p[1] === 4 && p.r === 'le' && p.k === 1
    );
    const q = preguntaDeProblema(pr);
    const fin = q.passos.find(p => p.id === 'final');
    ok('la suma de valors arrodonits (0,8438) val', corregeixPas(fin, { r: dec(0.8438) }).estat === 'ok');
    ok('0,8437 (una diferència de 0,0001) també val', corregeixPas(fin, { r: dec(0.8437) }).estat === 'ok');
    ok('0,8441 no val', corregeixPas(fin, { r: dec(0.8441) }).estat === 'error');
    const cas = q.passos.find(p => p.mena === 'cas');
    ok(
        'un cas: C(n, k) i P amb ±0,0001',
        corregeixPas(cas, { c: cas.solucio.c, pj: dec(cas.solucio.pj + 1e-4) }).estat === 'ok' &&
            corregeixPas(cas, { c: cas.solucio.c, pj: dec(cas.solucio.pj + 3e-4) }).estat === 'error'
    );
    // En tant per cent: 2 decimals, ±0,02
    const prPc = totsElsProblemes(3).find(p => p.forma === 'pc' && p.r === 'ge' && p.k === 1);
    const qPc = preguntaDeProblema(prPc);
    const fPc = qPc.passos.find(p => p.id === 'final');
    ok(
        'en tant per cent: la resposta es demana en % amb 2 decimals',
        /\\%/.test(JSON.stringify(fPc.plantilla)) && fPc.tolerancia.r === 0.02
    );
    ok(
        'en tant per cent: la resposta val ± 0,02',
        corregeixPas(fPc, { r: dec(fPc.solucio.r + 0.02, 2) }).estat === 'ok'
    );
    const prU = totsElsProblemes(3).find(p => p.forma === 'u');
    const fU = preguntaDeProblema(prU).passos.find(p => p.id === 'final');
    ok('en tant per u: la resposta, en tant per u (sense %)', !/\\%/.test(JSON.stringify(fU.plantilla)));
}

suite('3. El diagnòstic dels errors típics');
{
    const falten = [];
    const vistos = new Set();
    const prova = (pas, valors, codi, on) => {
        const d = diagnosticaBI(pas, valors);
        vistos.add(d && d.codi);
        if (!d || d.codi !== codi || !d.missatge) falten.push(`${on}: esperat ${codi}, surt ${d && d.codi}`);
    };
    for (const nivell of [1, 2, 3]) {
        for (const pr of totsElsProblemes(nivell).filter((_, i) => i % 7 === 0)) {
            const q = preguntaDeProblema(pr);
            const dd = q.passos.find(p => p.id === 'dades');
            const { n, p, q: qq } = dd.solucio;
            const pv = num(p);
            // Les probabilitats com les escriuria l'alumne: fraccions exactes, o decimals
            const pq = pr.forma === 'frac';
            const camp = (x, exacta) => (pq ? exacta : rac(x, 6));
            const bones = { n, p: camp(pv, p), q: camp(num(qq), qq) };
            if (pr.k !== n) prova(dd, { ...bones, n: pr.k }, 'BI_N_K', q.text);
            if (pr.forma === 'pc') {
                prova(dd, { ...bones, p: rac(pv * 100, 2) }, 'BI_PERCENT', q.text);
                prova(dd, { ...bones, p: rac(pv * 10, 3) }, 'BI_PERCENT_DEC', q.text);
            }
            if (Math.abs(pv - 0.5) > 1e-9) {
                prova(dd, { ...bones, q: camp(pv, p) }, 'BI_Q_P', q.text);
                prova(dd, { ...bones, p: camp(1 - pv, qq) }, 'BI_P_FRACASSOS', q.text);
            }
            for (const o of q.passos.filter(x => x.mena === 'tria').flatMap(x => x.opcions.map(op => [x, op]))) {
                const [pas, op] = o;
                if (!op[0].startsWith('ok')) prova(pas, { tria: op[0] }, op[0].split('#')[0], `${pas.id} ${op[1]}`);
            }
            for (const c of q.passos.filter(x => x.mena === 'cas')) {
                const { j } = c.dades;
                const C = c.solucio.c;
                const sensC = pv ** j * (1 - pv) ** (n - j);
                const exps = C * pv ** (n - j) * (1 - pv) ** j;
                const lluny = x => Math.abs(x - c.solucio.pj) > 3e-4;
                if (C !== 1 && lluny(sensC)) prova(c, { c: C, pj: rac(sensC) }, 'BI_SENSE_C', q.text);
                if (j !== n - j && lluny(exps) && Math.abs(exps - sensC) > 3e-4)
                    prova(c, { c: C, pj: rac(exps) }, 'BI_EXPONENTS', q.text);
                if (C + 1 !== n * j) prova(c, { c: C + 1, pj: rac(c.solucio.pj) }, 'BI_COMBINATORI', q.text);
            }
            const fin = q.passos.find(x => x.id === 'final');
            if (fin && fin.dades.contrari) {
                const suma = fin.dades.suma * (fin.dades.pc ? 100 : 1);
                if (Math.abs(suma - num(fin.solucio.r)) > 0.05)
                    prova(fin, { r: rac(suma, fin.dades.pc ? 2 : 4) }, 'BI_OBLIDA_1MENYS', q.text);
            }
            if (fin && fin.dades.pc && fin.dades.resultat > 0.03)
                prova(fin, { r: rac(fin.dades.resultat) }, 'BI_PERCENT_FINAL', q.text);
        }
    }
    ok('cada error típic fet a mà dona el seu diagnòstic', !falten.length, falten.slice(0, 6).join('\n      → '));
    const clau = [
        'BI_N_K',
        'BI_PERCENT',
        'BI_Q_P',
        'BI_ALMENYS',
        'BI_MAXIM',
        'BI_CONTRARI_LIMIT',
        'BI_SENSE_C',
        'BI_EXPONENTS',
        'BI_OBLIDA_0',
        'BI_OBLIDA_1MENYS',
        'BI_PERCENT_FINAL',
    ];
    ok(
        'surten els errors (1)–(7) que va aprovar el David (C1)',
        clau.every(c => vistos.has(c)),
        clau.filter(c => !vistos.has(c)).join(', ')
    );
    const sense = Object.entries(ERRORS_BI).filter(([, v]) => !v.etiqueta || !v.missatge);
    ok('cada error té etiqueta i missatge', !sense.length);
}

suite('4. El camí llarg');
{
    let provats = 0;
    const mal = [];
    for (const pr of [...totsElsProblemes(2), ...totsElsProblemes(3)]) {
        const q = preguntaDeProblema(pr);
        const cami = q.passos.find(p => p.id === 'cami');
        if (!cami || !cami.opcions.some(o => o[0] === 'ok-llarg')) continue;
        provats++;
        if (corregeixPas(cami, { tria: 'ok-llarg' }).estat !== 'ok') mal.push(`no s'accepta: ${q.text}`);
        const nous = passosSegonsCami(q, q.passos, cami, { tria: 'ok-llarg' });
        const fi = nous[nous.length - 1];
        const resp = fi.mena === 'final' ? num(fi.solucio.r) : fi.solucio.pj;
        const esperat = probModel(llegeixEnunciat(q.text)) * (pr.forma === 'pc' ? 100 : 1);
        if (Math.abs(resp - esperat) > (pr.forma === 'pc' ? 0.02 : 2e-4))
            mal.push(`resposta ${resp} ≠ ${esperat}: ${q.text}`);
        const ll = cami.opcions.find(o => o[0] === 'ok-llarg')[1];
        if (!nous.find(p => p.id === 'cami').linia.endsWith(ll))
            mal.push(`la línia del camí no diu el llarg: ${q.text}`);
    }
    ok(
        `${provats} problemes amb dues rutes: la llarga també val, i la resposta és la mateixa`,
        provats > 50 && !mal.length,
        mal.slice(0, 4).join('\n      → ')
    );
    ok(
        'si es tria la ruta curta, no es refà res',
        passosSegonsCami(generaPreguntaBI({ nivell: 2 }), [], { id: 'cami' }, { tria: 'ok' }) === null
    );
}

suite('5. Nivells, la pàgina, l’índex i el codi');
{
    const nivells = [1, 2, 3].map(nv => {
        const ps = totsElsProblemes(nv);
        return {
            eq: ps.every(p => (nv === 1) === (p.r === 'eq')),
            contrari: ps.every(p => {
                let c = 0;
                for (let j = 0; j <= p.n; j++) if (ENTRA[p.r](j, p.k)) c++;
                return nv !== 3 || p.n + 1 - c < c;
            }),
        };
    });
    ok(
        'nivell 1 només P(X = k); nivell 3 sempre més curt pel contrari',
        nivells.every(x => x.eq && x.contrari)
    );
    const html = fs.readFileSync(path.join(ROOT, 'binomial.html'), 'utf8');
    ok(
        'binomial.html: tema d’estadística, controlador i sense codi',
        /tema-estadistica/.test(html) && /js\/binomial\/binomial\.js/.test(html) && /senseCodi:\s*true/.test(html)
    );
    const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    ok(
        'index.html: «Distribució binomial» al menú de Batxillerat i l’opció de nivells',
        /file: 'binomial\.html', label: 'Distribució binomial'/.test(index) &&
            /'binomial\.html': \[\s*\{ param: 'tipus'/.test(index)
    );
    ok('codi BI reservat', /'binomial': 'BI'/.test(fs.readFileSync(path.join(ROOT, 'js/exercise-codes.js'), 'utf8')));
    const ctrl = fs.readFileSync(path.join(ROOT, 'js/binomial/binomial.js'), 'utf8');
    ok('el controlador llegeix ?tipus=', /get\('tipus'\)/.test(ctrl));
}

suite('6. Mutacions: el model veuria una solució equivocada');
{
    const pr = totsElsProblemes(3).find(p => p.forma === 'pc');
    const muta = canvi => {
        const q = preguntaDeProblema(pr);
        canvi(q);
        errors.length = 0;
        comprova(q);
        return errors.length > 0;
    };
    ok(
        'un C(n, k) equivocat es detecta',
        muta(q => (q.passos.find(p => p.mena === 'cas').solucio.c += 1))
    );
    ok(
        'una P(X = k) equivocada es detecta',
        muta(q => (q.passos.find(p => p.mena === 'cas').solucio.pj += 0.01))
    );
    ok(
        'una resposta sense el 1 − es detecta',
        muta(q => {
            const f = q.passos.find(p => p.id === 'final');
            f.solucio.r = 100 - f.solucio.r;
        })
    );
    ok(
        'una opció falsa marcada com a correcta es detecta',
        muta(q => {
            const c = q.passos.find(p => p.id === 'cami');
            c.opcions.find(o => !o[0].startsWith('ok'))[0] = 'ok-llarg';
        })
    );
}

finish('DISTRIBUCIÓ BINOMIAL');
