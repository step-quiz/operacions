/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/mcd-mcm.test.js
 * ROL: Tests de «MCD i mcm» (js/mcd-mcm/math-engine.js) i de la seva «Resolució pas a pas»
 *      (js/mcd-mcm/resolucio.js), amb el mètode del David (docs/pissarra/STATE.md decisió 25).
 * ARQUITECTURA:
 * - 1. Les matemàtiques: computeMCD i computeMCM contra Euclides; generatePair: nombres compostos
 *   de 6 a 150, diferents, amb els primers de cada pregunta (la 3, també l'11 i el 13), un 20 % de
 *   primers entre si, el mcm fins a 300 (500 si són primers entre si).
 * - 2. La pissarra: la bateria comuna (tests/pissarra-activitat.js) amb centenars de parelles de
 *   cada nivell i casos límit (primers entre si, un nombre que divideix l'altre, 64 i 128), tancats
 *   i amb tot el detall obert. Un model propi comprova cada línia: les particions dels arbres, els
 *   primers encerclats, cada factor comú (primer i divisor de tots dos), el que queda de cada nombre
 *   i el MCD i el mcm (valor, potències en ordre).
 * - 3. Les decisions: al final, la intersecció té els factors comuns un per un (o l'1) i fora hi ha
 *   el que queda; un pas per factor comú (B1); fulles en gris quan ja són al diagrama (B2); rètols
 *   (B5); resultats en dues línies i amb potències (C1, C2); la mida fixa (R4); MCD i mcm a tot
 *   l'activitat (C3); l'enllaç de l'activitat (D1).
 * ÚS: node tests/mcd-mcm.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');

const w = loadModule(
    [
        'js/utils.js',
        'js/factoritzar/math-engine.js',
        'js/mcd-mcm/math-engine.js',
        'js/pissarra/formules.js',
        'js/pissarra/comprova.js',
        'js/factoritzar/resolucio.js',
        'js/mcd-mcm/resolucio.js',
    ],
    { seed: 20261128 }
);
const { computeMCD, computeMCM, generatePair, primeFactorization, ResolucioMM: R } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));

// ── El model propi ──
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const primer = n => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
};
const factors = n => {
    const f = [];
    for (let p = 2; n > 1; p++) while (n % p === 0) (f.push(p), (n /= p));
    return f;
};
const multi = xs =>
    xs
        .slice()
        .sort((a, b) => a - b)
        .join(',');
/** Comuns (un per un) i el que queda de cada nombre. */
function venn(n, m) {
    const a = factors(n),
        b = factors(m);
    const comuns = [];
    for (const p of a.slice()) {
        const j = b.indexOf(p);
        if (j >= 0) (comuns.push(p), b.splice(j, 1), a.splice(a.indexOf(p), 1));
    }
    return { comuns, a, b };
}

suite('1. Les matemàtiques (math-engine.js)');
{
    let mal = [];
    for (let a = 1; a <= 160; a++)
        for (let b = 1; b <= 160; b++) {
            const fa = primeFactorization(a),
                fb = primeFactorization(b);
            if (computeMCD(fa, fb) !== gcd(a, b) || computeMCM(fa, fb) !== lcm(a, b)) mal.push(`${a},${b}`);
        }
    ok('computeMCD i computeMCM coincideixen amb Euclides (fins a 160)', !mal.length, mal.slice(0, 5).join(' '));
    const pools = [
        [2, 3, 5],
        [2, 3, 5, 7],
        [2, 3, 5, 7, 11, 13],
    ];
    mal = [];
    let coprimers = 0,
        total = 0;
    const surten = new Set();
    for (let op = 0; op < 3; op++)
        for (let i = 0; i < 4000; i++) {
            const [a, b] = generatePair(op);
            total++;
            const g = gcd(a, b);
            if (g === 1) coprimers++;
            [a, b].forEach(x => factors(x).forEach(p => op === 2 && surten.add(p)));
            if (
                a === b ||
                [a, b].some(x => x < 6 || x > 150 || primer(x) || factors(x).some(p => !pools[op].includes(p))) ||
                lcm(a, b) > (g === 1 ? 500 : 300)
            )
                mal.push(`${op}: ${a}, ${b}`);
        }
    ok(
        'generatePair: compostos de 6 a 150, diferents, amb els primers de la pregunta, mcm fitat',
        !mal.length,
        mal.slice(0, 5).join('; ')
    );
    const pc = coprimers / total;
    ok(`un 20 % de parelles de primers entre si (${(pc * 100).toFixed(1)} %)`, pc > 0.18 && pc < 0.22);
    ok('a la pregunta 3 hi surten l’11 i el 13', surten.has(11) && surten.has(13));
}

suite('2. Resolució pas a pas (resolucio.html?activitat=mcd-mcm): la pissarra');
const dolents = { nivell: [], katex: [], plurals: [], final: [], mida: [], venn: [], b1: [], b2: [], c: [] };
const anota = (l, t) => l.length < 5 && l.push(t);
const exercicis = [];
let coprimersEx = 0;
for (let nivell = 1; nivell <= 3; nivell++)
    for (let i = 0; i < 300; i++) {
        const ex = R.exercici(nivell);
        const te = { 2: [7], 3: [11, 13] }[nivell];
        if (ex.nivell !== nivell || (te && ![ex.n, ex.m].some(x => te.some(p => x % p === 0))))
            anota(dolents.nivell, `nivell ${nivell}: ${ex.n}, ${ex.m}`);
        if (gcd(ex.n, ex.m) === 1) coprimersEx++;
        exercicis.push(ex);
    }
for (const [n, m] of [
    [60, 90],
    [8, 15],
    [30, 90],
    [90, 30],
    [64, 128],
    [77, 26],
    [12, 18],
    [128, 9],
    [8, 15],
    [12, 35],
    [143, 26],
    [121, 22],
])
    exercicis.push({ nivell: 3, n, m });

/** Les afirmacions d'una fila: «eq:…», «primer:v:sí/no», «comu:v:n:m», «resta:x:f*f:n:m». */
function afirmacions(fila) {
    const out = [];
    const [, n, m] = (
        fila.match(/aria-label="Diagrames de Venn dels factors (?:del |de l')(\d+) i (?:del |de l')(\d+)"/) || []
    ).map(Number);
    for (const x of fila.matchAll(/data-eq="([^"]*)"/g)) for (const e of x[1].split(';')) out.push('eq:' + e);
    for (const x of fila.matchAll(/<text class="jp-fa-n( jp-fa-primer)?"[^>]*>(\d+)<\/text>/g))
        out.push(`primer:${x[2]}:${x[1] ? 'sí' : 'no'}`);
    for (const x of fila.matchAll(/data-comu="(\d+)"/g)) out.push(`comu:${x[1]}:${n}:${m}`);
    for (const x of fila.matchAll(/data-resta="(\d+):([^"]*)"/g)) out.push(`resta:${x[1]}:${x[2]}:${n}:${m}`);
    return out;
}
function valor(t) {
    if (t.includes('*')) return t.split('*').reduce((s, x) => s * valor(x), 1);
    if (t.includes('^')) {
        const [b, e] = t.split('^').map(Number);
        return b ** e;
    }
    return /^\d+$/.test(t) ? Number(t) : NaN;
}
function veritat(a) {
    if (a.startsWith('eq:')) {
        const e = a.slice(3);
        const r = e.match(/^(MCD|mcm)\((\d+), (\d+)\)=(.*)$/);
        if (r) {
            const [, nom, n, m, resta] = r;
            const parts = resta.split('=');
            const val = Number(parts[parts.length - 1]);
            const esperat = nom === 'MCD' ? gcd(+n, +m) : lcm(+n, +m);
            if (val !== esperat) return `${a}: hauria de ser ${esperat}`;
            if (parts.length === 2) {
                const bases = parts[0].split('*').map(f => Number(f.split('^')[0]));
                if (valor(parts[0]) !== val) return `${a}: el producte no dona ${val}`;
                if (!bases.every(primer) || bases.some((b, i) => i && b <= bases[i - 1]))
                    return `${a}: no són primers en ordre, amb potències`;
            }
            return '';
        }
        const [x, y] = e.split('=');
        return valor(x) === valor(y) ? '' : `${a}: ${valor(x)} ≠ ${valor(y)}`;
    }
    if (a.startsWith('primer:')) {
        const [, v, si] = a.split(':');
        return primer(+v) === (si === 'sí')
            ? ''
            : `${a}: ${primer(+v) ? 'és primer i no és encerclat' : 'no és primer'}`;
    }
    if (a.startsWith('comu:')) {
        const [, v, n, m] = a.split(':').map(Number);
        if (v === 1) return gcd(n, m) === 1 ? '' : `${a}: l'1 només si són primers entre si`;
        return primer(v) && n % v === 0 && m % v === 0 ? '' : `${a}: no és un factor primer comú`;
    }
    if (a.startsWith('resta:')) {
        const [, x, fs, n, m] = a.split(':');
        const v = venn(+n, +m);
        const esperat = +x === +n ? v.a : v.b;
        return multi(fs.split('*').map(Number)) === multi(esperat) ? '' : `${a}: hauria de ser ${esperat.join('·')}`;
    }
    return `no s'entén ${a}`;
}

{
    const { provaActivitat } = require('./pissarra-activitat');
    function* generador() {
        for (const ex of exercicis) {
            const vista = ({ oberts }) => R.passos(ex, { oberts });
            const passos = R.passos(ex);
            yield { on: `${ex.n} i ${ex.m}`, passos, vista, ex };
            const tots = vista({ oberts: new Set(passos.filter(p => p.teDetall).map(p => p.id)) });
            for (const p of [...passos, ...tots]) {
                for (const f of (p.text.match(/\$[^$]*\$/g) || []).map(t => t.slice(1, -1)))
                    if (!katexOk(f)) anota(dolents.katex, `${ex.n}, ${ex.m}: ${f}`);
                if (/\b(calculem|fem|tenim|posem|escrivim|dividim)\b/i.test(p.text)) anota(dolents.plurals, p.text);
            }
            const ultim = passos[passos.length - 1].files.join('');
            if (!/jp-mm-res final/.test(ultim)) anota(dolents.final, `${ex.n}, ${ex.m}`);
            // R4: els dos dibuixos, de la mateixa mida a tots els passos
            const mides = new Set(passos.map(p => (p.files.join('').match(/viewBox="[^"]*"/g) || []).join(' ')));
            if (mides.size !== 1) anota(dolents.mida, `${ex.n}, ${ex.m}: ${[...mides].join(' / ')}`);
            // Al final: la intersecció i el que queda (el model)
            const v = venn(ex.n, ex.m);
            const mig = [...ultim.matchAll(/data-comu="(\d+)"/g)].map(x => +x[1]);
            const fora = [...ultim.matchAll(/data-resta="(\d+):([^"]*)"/g)].map(x => [
                +x[1],
                x[2].split('*').map(Number),
            ]);
            const foraDe = x => (fora.find(f => f[0] === x) || [0, []])[1];
            if (
                multi(mig) !== multi(v.comuns.length ? v.comuns : [1]) ||
                multi(foraDe(ex.n)) !== multi(v.a) ||
                multi(foraDe(ex.m)) !== multi(v.b)
            )
                anota(dolents.venn, `${ex.n}, ${ex.m}: ${mig} | ${foraDe(ex.n)} | ${foraDe(ex.m)}`);
            // B1: un pas per factor comú
            const passosComuns = passos.filter(p => /^Tots dos tenen un/.test(p.text)).length;
            if (passosComuns !== v.comuns.length) anota(dolents.b1, `${ex.n}, ${ex.m}: ${passosComuns} passos`);
            // B2: al final, totes les fulles en gris (cap fulla primera sense jp-mm-usat)
            const fullesNegres = [
                ...ultim.matchAll(/<g data-fulla="[^"]*">(<circle[^>]*>)?<text class="jp-fa-n jp-fa-primer"/g),
            ].length;
            if (fullesNegres) anota(dolents.b2, `${ex.n}, ${ex.m}: ${fullesNegres} fulles sense gris al final`);
            // C1, C2: dues línies si hi ha més d'un factor, potències sense bases repetides
            for (const r of ultim.matchAll(/class="jp-mm-res[^"]*" data-eq="([^"]*)"/g)) {
                const parts = r[1].split('=');
                if (parts.length === 3) {
                    const bases = parts[1].split('*').map(f => f.split('^')[0]);
                    if (new Set(bases).size !== bases.length) anota(dolents.c, `${r[1]}: sense potències`);
                }
            }
            if ((ultim.match(/jp-mm-r2/g) || []).length < 2)
                anota(dolents.c, `${ex.n}, ${ex.m}: el mcm no fa dues línies`);
        }
    }
    provaActivitat('mcd-mcm', {
        exercicis: generador(),
        eines: w,
        linies: afirmacions,
        veritat,
        files: 3,
        maxPeces: 12,
        minExercicis: 900,
    });
    const llista = l => l.join('\n      → ');
    ok(
        'cada exercici és del seu nivell (nivell 2 amb un 7, nivell 3 amb un 11 o un 13)',
        !dolents.nivell.length,
        llista(dolents.nivell)
    );
    ok(
        `a la pissarra també hi ha un 20 % de primers entre si (${coprimersEx} de 900)`,
        coprimersEx > 130 && coprimersEx < 230
    );
    ok('KaTeX dibuixa les fórmules de les frases', !dolents.katex.length, llista(dolents.katex));
    ok('les frases són en segona persona', !dolents.plurals.length, llista(dolents.plurals));
    ok('l’últim pas (el mcm) és ressaltat', !dolents.final.length, llista(dolents.final));
    ok(
        'R4: els arbres i els cercles fan la mateixa mida a tots els passos',
        !dolents.mida.length,
        llista(dolents.mida)
    );
    ok(
        'al final, la intersecció té els factors comuns un per un (o l’1) i fora hi ha el que queda',
        !dolents.venn.length,
        llista(dolents.venn)
    );
    ok('B1: un pas per factor comú', !dolents.b1.length, llista(dolents.b1));
    ok('B2: al final, totes les fulles són en gris', !dolents.b2.length, llista(dolents.b2));
    ok('C1, C2: el resultat en dues línies i amb potències', !dolents.c.length, llista(dolents.c));
}

suite('3. Les decisions del David (28/11/2026)');
{
    const ps = R.passos({ nivell: 1, n: 60, m: 90 });
    eq(
        'el guió de 60 i 90',
        ps.map(p => p.text.split(/[:.]/)[0]).join(' | '),
        "Calcula el MCD i el mcm del 60 i del 90 | Fes l'arbre del 60 | Fes l'arbre del 90 | Tots dos tenen un 2 | Tots dos tenen un 3 | Tots dos tenen un 5 | El 60 encara té un 2 | El 90 encara té un 3 | El MCD és el producte dels factors de la intersecció | El mcm és el producte de tots els factors dels dos conjunts"
    );
    // B2: després de posar el 2 comú, les dues fulles 2 que hi han anat són en gris, i les altres no
    const pas4 = ps[3].files.join('');
    eq('B2: després del primer factor comú, dues fulles en gris', (pas4.match(/class="jp-mm-usat"/g) || []).length, 2);
    ok(
        'B5: els rètols «Factors del 60» i «Factors del 90», i cap altre',
        /Factors del 60<\/text>/.test(pas4) &&
            /Factors del 90<\/text>/.test(pas4) &&
            (pas4.match(/jp-mm-retol/g) || []).length === 2
    );
    ok(
        'B5: els cercles no apareixen fins al primer pas del diagrama',
        !/jp-mm-cercle/.test(ps[2].files.join('')) && /jp-mm-cercle/.test(pas4)
    );
    const cp = R.passos({ nivell: 1, n: 8, m: 15 });
    ok(
        'B4: primers entre si, un 1 a la intersecció («l’únic divisor comú»)',
        cp.some(p => /Escriu un 1 a la intersecció: és l'únic divisor comú de l'8 i del 15/.test(p.text)) &&
            /data-eq="MCD\(8, 15\)=1"/.test(cp[cp.length - 1].files.join(''))
    );
    ok(
        'C2: mcm(60, 90) = 2² · 3² · 5 = 180',
        /data-eq="mcm\(60, 90\)=2\^2\*3\^2\*5=180"/.test(ps[ps.length - 1].files.join(''))
    );
    const div = R.passos({ nivell: 1, n: 30, m: 90 });
    ok(
        'B3: si un nombre no té res més, la frase de l’altre ho diu',
        div.some(p => /El 30 no té cap altre factor/.test(p.text))
    );
    // A2: el detall de l'arbre, partició per partició
    const obert = R.passos({ nivell: 1, n: 60, m: 90 }, { oberts: new Set(['2']) });
    ok(
        'A2: «Vull més detall» a l’arbre del 60 el fa partició per partició',
        obert.filter(p => /^Parteix /.test(p.text)).length === 3
    );
    // C3: MCD i mcm a tot l'activitat
    const js = fs.readFileSync(path.join(ROOT, 'js/mcd-mcm/mcd-mcm.js'), 'utf8');
    const html = fs.readFileSync(path.join(ROOT, 'mcd-mcm.html'), 'utf8');
    const visibles = (html + js).replace(/computeMCM|mcdMcm|McdMcm|MCD/g, '');
    ok('C3: «mcm» (mai «MCM») a l’activitat', !/MCM/.test(visibles), (visibles.match(/.{30}MCM.{30}/) || [''])[0]);
    ok(
        'D1: l’activitat hi enllaça amb el nivell de la pregunta i fa servir el generador compartit',
        /id="mira-com"/.test(html) &&
            /resolucio\.html\?activitat=mcd-mcm&nivell=\$\{nivell\}/.test(js) &&
            /from '\.\/math-engine\.js'/.test(js) &&
            !/function generatePair/.test(js)
    );
}

finish('TESTS DEL MCD I EL MCM');
