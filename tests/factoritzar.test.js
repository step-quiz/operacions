/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/factoritzar.test.js
 * ROL: Tests de «Descompondre en factors primers» (js/factoritzar/math-engine.js) i de la
 *      seva «Resolució pas a pas» (js/factoritzar/resolucio.js).
 * ARQUITECTURA:
 * - 1. Les matemàtiques: isPrime i primeFactorization contra un model propi (garbell i
 *   divisions); generateNumber dona nombres compostos de 6 a 150 amb els primers de cada
 *   pregunta.
 * - 2. La pissarra: la bateria comuna (tests/pissarra-activitat.js) amb centenars de nombres de
 *   cada nivell, tancats i amb tot el detall obert. Cada línia porta data-eq (la igualtat que
 *   afirma) i, a l'arbre, data-primers (quins fills són primers, encerclats); a la columna,
 *   data-menor (el divisor és el primer més petit): un model propi les comprova totes.
 * - 3. Les decisions del David (28/11/2026, docs/pissarra/STATE.md decisió 24): la partició
 *   natural (B1); el criteri de divisibilitat només al detall (B2); una branca sencera abans de
 *   la següent (B4); el nivell 4 en columna (B5); directament a les potències (C1); un altre
 *   arbre a demanda (C2); l'arbre no canvia de mida (R4); KaTeX, segona persona, el final
 *   ressaltat; l'activitat hi enllaça.
 * ÚS: node tests/factoritzar.test.js
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
        'js/pissarra/formules.js',
        'js/pissarra/comprova.js',
        'js/factoritzar/resolucio.js',
    ],
    { seed: 20261128 }
);
const { isPrime, primeFactorization, generateNumber, ResolucioFA: R } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));

// ── El model propi ──
const N = 2000;
const primer = (() => {
    const g = Array(N + 1).fill(true);
    g[0] = g[1] = false;
    for (let i = 2; i * i <= N; i++) if (g[i]) for (let j = i * i; j <= N; j += i) g[j] = false;
    return n => n >= 0 && n <= N && g[n];
})();
const factors = n => {
    const f = [];
    for (let p = 2; n > 1; p++) while (n % p === 0) (f.push(p), (n /= p));
    return f;
};

suite('1. Les matemàtiques (math-engine.js)');
{
    let mal = [];
    for (let n = 0; n <= N; n++) if (isPrime(n) !== primer(n)) mal.push(n);
    ok('isPrime coincideix amb el garbell fins a 2000', !mal.length, mal.slice(0, 5).join(', '));
    mal = [];
    for (let n = 2; n <= N; n++) {
        const f = primeFactorization(n);
        const llista = Object.entries(f).flatMap(([p, e]) => Array(e).fill(Number(p)));
        if (llista.join() !== factors(n).join()) mal.push(n);
    }
    ok('primeFactorization coincideix amb les divisions fins a 2000', !mal.length, mal.slice(0, 5).join(', '));
    const pools = [
        [2, 3, 5],
        [2, 3, 5, 7],
        [2, 3, 5, 7, 11],
    ];
    mal = [];
    for (let op = 0; op < 3; op++)
        for (let i = 0; i < 3000; i++) {
            const n = generateNumber(op);
            if (n < 6 || n > 150 || isPrime(n) || factors(n).some(p => !pools[op].includes(p))) mal.push(`${op}: ${n}`);
        }
    ok(
        'generateNumber: compostos de 6 a 150, amb els primers de cada pregunta',
        !mal.length,
        mal.slice(0, 5).join(', ')
    );
}

suite('2. Resolució pas a pas (resolucio.html?activitat=factoritzar): la pissarra');
const dolents = { katex: [], plurals: [], final: [], mida: [], b2: [], c1: [], nivell: [] };
const anota = (l, t) => l.length < 5 && l.push(t);
const exercicis = [];
for (let nivell = 1; nivell <= 4; nivell++)
    for (let i = 0; i < 300; i++) {
        const ex = R.exercici(nivell);
        const cal = { 2: 7, 3: 11 }[nivell];
        if (ex.nivell !== nivell || ex.columna !== (nivell === 4) || (cal && ex.n % cal))
            anota(dolents.nivell, `nivell ${nivell}: ${ex.n}`);
        exercicis.push(ex);
    }
// També tots els nombres de l'activitat (fins a 150), en arbre i en columna
for (let n = 4; n <= 150; n++)
    if (!isPrime(n) && factors(n).every(p => p <= 11)) {
        exercicis.push({ nivell: 1, n, columna: false });
        exercicis.push({ nivell: 4, n, columna: true });
    }

/** Les afirmacions d'una fila: «eq:…», «primers:…|…» i «menor:n:p». */
function afirmacions(fila) {
    const out = [];
    for (const m of fila.matchAll(/data-eq="([^"]*)"(?: data-primers="([^"]*)")?/g)) {
        for (const e of m[1].split(';')) out.push('eq:' + e);
        if (m[2] !== undefined) out.push(`primers:${m[1]}|${m[2]}`);
    }
    for (const m of fila.matchAll(/data-menor="([^"]*)"/g)) out.push('menor:' + m[1]);
    return out;
}
/** El valor d'un membre: sumes, productes i potències de naturals (a:b, només si és exacta). */
function valor(t) {
    if (t.includes('+')) return t.split('+').reduce((s, x) => s + valor(x), 0);
    if (t.includes('*')) return t.split('*').reduce((s, x) => s * valor(x), 1);
    if (t.includes(':')) {
        const [a, b] = t.split(':').map(valor);
        return a % b === 0 ? a / b : NaN;
    }
    if (t.includes('^')) {
        const [b, e] = t.split('^').map(Number);
        return b ** e;
    }
    return /^\d+$/.test(t) ? Number(t) : NaN;
}
function veritat(a) {
    if (a.startsWith('eq:')) {
        const [x, y] = a.slice(3).split('=');
        const vx = valor(x),
            vy = valor(y);
        if (!(vx === vy)) return `${a}: ${vx} ≠ ${vy}`;
        // El resultat: primers en ordre creixent
        if (/\^|^\d+=\d+(\*\d+)*$/.test(a.slice(3)) && y.includes('^')) {
            const bases = y.split('*').map(f => Number(f.split('^')[0]));
            if (!bases.every(primer) || bases.some((b, i) => i && b <= bases[i - 1]))
                return `${a}: no són primers en ordre`;
        }
        return '';
    }
    if (a.startsWith('primers:')) {
        const [e, llista] = a.slice(8).split('|');
        const fills = e.split('=')[1].split('*').map(Number);
        const esperats = [...new Set(fills.filter(primer))].sort((x, y) => x - y).join();
        const marcats = [...new Set(llista ? llista.split(',').map(Number) : [])].sort((x, y) => x - y).join();
        return esperats === marcats ? '' : `${a}: els primers encerclats haurien de ser ${esperats}`;
    }
    if (a.startsWith('menor:')) {
        const [n, p] = a.slice(6).split(':').map(Number);
        return primer(p) && n % p === 0 && factors(n)[0] === p ? '' : `${a}: no és el primer més petit`;
    }
    return `no s'entén ${a}`;
}

{
    const { provaActivitat } = require('./pissarra-activitat');
    function* generador() {
        for (const ex of exercicis) {
            const vista = ({ oberts }) => R.passos(ex, { oberts });
            const passos = R.passos(ex);
            yield { on: `${ex.columna ? 'columna' : 'arbre'} ${ex.n}`, passos, vista, ex };
            // Les decisions, sobre el mateix guió
            const tots = vista({ oberts: new Set(passos.filter(p => p.teDetall).map(p => p.id)) });
            for (const p of [...passos, ...tots]) {
                for (const f of (p.text.match(/\$[^$]*\$/g) || []).map(t => t.slice(1, -1)))
                    if (!katexOk(f)) anota(dolents.katex, `${ex.n}: ${f}`);
                if (/\b(calculem|fem|tenim|partim|escrivim|dividim)\b/i.test(p.text)) anota(dolents.plurals, p.text);
            }
            const ultim = passos[passos.length - 1];
            if (!/jp-fa-prod final/.test(ultim.files[0])) anota(dolents.final, `${ex.n}`);
            // R4: l'SVG de l'arbre té la mateixa mida a tots els passos
            const mides = new Set(passos.map(p => (p.files[0].match(/jp-fa-arbre" viewBox="([^"]*)"/) || [])[1]));
            if (mides.size !== 1) anota(dolents.mida, `${ex.n}: ${[...mides].join(' / ')}`);
            // B2: el criteri de divisibilitat només al detall
            if (passos.some(p => /acaba en|taula|xifres|Prova de dividir/.test(p.text)))
                anota(dolents.b2, `${ex.n}: ${passos.find(p => /acaba en|taula|xifres/.test(p.text)).text}`);
            // C1: el resultat, directament amb potències (cap línia «2 · 2 · 3 · 5»)
            const f = primeFactorization(ex.n);
            const esperat = `${ex.n}=${Object.keys(f)
                .map(Number)
                .sort((x, y) => x - y)
                .map(p => (f[p] > 1 ? `${p}^${f[p]}` : p))
                .join('*')}`;
            const prod = (ultim.files[0].match(/jp-fa-prod[^"]*" data-eq="\d+=([^"]*)"/) || [])[1] || '';
            const bases = prod.split('*').map(x => x.split('^')[0]);
            if (!ultim.files[0].includes(`data-eq="${esperat}"`) || new Set(bases).size !== bases.length)
                anota(dolents.c1, `${ex.n}: hauria de ser ${esperat}`);
        }
    }
    provaActivitat('factoritzar', {
        exercicis: generador(),
        eines: w,
        linies: afirmacions,
        veritat: a => veritat(a),
        maxPeces: 8,
        minExercicis: 1300,
    });
    const llista = l => l.join('\n      → ');
    ok(
        'cada exercici és del seu nivell (nivell 2 amb un 7, nivell 3 amb un 11; nivell 4 en columna)',
        !dolents.nivell.length,
        llista(dolents.nivell)
    );
    ok('KaTeX dibuixa les fórmules de les frases', !dolents.katex.length, llista(dolents.katex));
    ok('les frases són en segona persona', !dolents.plurals.length, llista(dolents.plurals));
    ok('l’última línia (el resultat) és ressaltada', !dolents.final.length, llista(dolents.final));
    ok('R4: l’arbre fa la mateixa mida a tots els passos', !dolents.mida.length, llista(dolents.mida));
    ok('B2: el criteri de divisibilitat només surt amb «Vull més detall»', !dolents.b2.length, llista(dolents.b2));
    ok('C1: el resultat va directament a les potències, en ordre', !dolents.c1.length, llista(dolents.c1));
}

suite('3. Les decisions del David (28/11/2026)');
{
    const part = n => {
        const p = R.parteix(n);
        return `${p.a}·${p.b}`;
    };
    const casos = {
        60: '6·10',
        56: '7·8',
        36: '6·6',
        120: '10·12',
        85: '5·17',
        98: '2·49',
        147: '3·49',
        132: '11·12',
        66: '6·11',
        77: '7·11',
    };
    const mal = Object.entries(casos).filter(([n, e]) => part(Number(n)) !== e);
    ok(
        'B1: la partició natural (la taula, la de l’11, acaba en 0, acaba en 5, el primer més petit)',
        !mal.length,
        mal.map(([n, e]) => `${n}: ${part(Number(n))} (esperat ${e})`).join(', ')
    );
    // B4: una branca sencera abans de la següent (60: 6 → 2 · 3 abans de 10 → 2 · 5)
    const passos60 = R.passos({ nivell: 1, n: 60, columna: false });
    eq(
        'B4: d’esquerra a dreta, una branca sencera abans de la següent (60)',
        passos60
            .map(p => (p.text.match(/\$(\d+) = /) || [])[1])
            .filter(Boolean)
            .join(' '),
        '60 6 10 60'
    );
    ok(
        'B3: els primers, encerclats en el pas que els escriu, i la frase ho diu',
        /data-primers="2,3"/.test(passos60[2].files[0]) && /El 2 i el 3 són primers/.test(passos60[2].text)
    );
    // B2: amb el detall obert, el criteri
    const obert = R.passos({ nivell: 1, n: 147, columna: false }, { oberts: new Set(['2']) });
    ok(
        'B2: el detall de 147 = 3 · 49 suma les xifres i divideix entre 3',
        obert.some(p => /Suma les xifres del 147/.test(p.text)) &&
            obert.some(p => /data-eq="147:3=49"/.test(p.files[0]))
    );
    // B5: el nivell 4, en columna, pel primer més petit
    const col = R.passos(R.exercici(4));
    ok(
        'B5: el nivell 4 és en columna',
        col.every(p => /jp-fa-columna/.test(p.files[0])) && !/jp-fa-arbre/.test(col[0].files[0])
    );
    // C2: un altre arbre, a demanda, només si n'hi ha
    const ultim = ps => ps[ps.length - 1];
    ok(
        'C2: «Vull més detall» a l’últim pas de 60 (un altre arbre: 60 = 2 · 30), i no a 77 (només té un arbre)',
        ultim(passos60).teDetall &&
            !ultim(R.passos({ nivell: 3, n: 77, columna: false })).teDetall &&
            R.passos({ nivell: 1, n: 60, columna: false }, { oberts: new Set(['5']) }).some(p =>
                /Un altre arbre del 60/.test(p.text)
            )
    );
    eq(
        'l’article: l’80, l’11, el 60',
        R.passos({ nivell: 1, n: 88, columna: false })[0].text,
        "Descompon l'88 en factors primers: fes-ne l'arbre."
    );
    // L'activitat hi enllaça amb el nivell de la pregunta
    const js = fs.readFileSync(path.join(ROOT, 'js/factoritzar/factoritzar.js'), 'utf8');
    const html = fs.readFileSync(path.join(ROOT, 'factoritzar.html'), 'utf8');
    ok(
        'l’activitat hi enllaça («Mira com es resol», amb el nivell de la pregunta)',
        /id="mira-com"/.test(html) && /resolucio\.html\?activitat=factoritzar&nivell=\$\{nivell\}/.test(js)
    );
    ok(
        'l’activitat i la pissarra fan servir el mateix generador (math-engine.js)',
        /from '\.\/math-engine\.js'/.test(js) && !/function generateNumber/.test(js)
    );
}

finish('TESTS DE DESCOMPONDRE EN FACTORS PRIMERS');
