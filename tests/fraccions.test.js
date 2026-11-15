/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/fraccions.test.js
 * ROL: Tests de la «Resolució pas a pas» d'«Operacions amb Fraccions» (l'escenari
 *      B, resolucio.html?activitat=fraccions: js/fraccions/resolucio.js).
 * ARQUITECTURA:
 * - 1. Els exercicis de cada nivell són com els de l'activitat: fraccions
 *   irreductibles; nivell 1 mateix denominador, 2 un múltiple de l'altre, 3 el
 *   mcm diferent de tots dos, 4 producte o divisió; el resultat no és mai 0.
 * - 2. Milers d'operacions de tots els nivells, amb la bateria comuna
 *   (tests/pissarra-activitat.js): el guió (i totes les vistes del detall) passa
 *   la revisió dels guions, cada pas mou alguna peça i poques, i cada línia que es
 *   veu és certa: una línia de la cadena («= …» o l'operació) val el resultat, un
 *   càlcul al marge (ampliar una fracció) és una igualtat certa, i mcm(a, b) = m i
 *   mcd(a, b) = g són certs (aritmètica exacta amb BigInt, feta aquí). I KaTeX
 *   dibuixa totes les fórmules, les frases són en segona persona, l'últim pas és
 *   el resultat i hi surten tots els tipus de pas.
 * ÚS: node tests/fraccions.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { suite, ok, eq, finish, loadModule } = require('./harness');
const { provaActivitat } = require('./pissarra-activitat');

const ROOT = path.join(__dirname, '..');
const mcd = (a, b) => (b ? mcd(b, a % b) : a < 0n ? -a : a);
const mcdN = (a, b) => (b ? mcdN(b, a % b) : Math.abs(a));

// ── Aritmètica exacta: fraccions de BigInt ──
const fr = (n, d = 1n) => {
    if (d === 0n) throw new Error('divisió per 0');
    if (d < 0n) [n, d] = [-n, -d];
    const g = mcd(n < 0n ? -n : n, d) || 1n;
    return { n: n / g, d: d / g };
};
const suma = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
const resta = (a, b) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
const per = (a, b) => fr(a.n * b.n, a.d * b.d);
const entre = (a, b) => fr(a.n * b.d, a.d * b.n);
const iguals = (a, b) => a.n === b.n && a.d === b.d;

/** Avalua una expressió amb nombres, + − * : / i parèntesis (el text pla d'una fila: ((5)/(6))+((7)/(9))). */
function avalua(text) {
    let i = 0;
    const s = text.replace(/\s+/g, '');
    const err = () => new Error(`no s'entén «${s}» (a la posició ${i})`);
    function primari() {
        if (s[i] === '(') {
            i++;
            const v = expr();
            if (s[i++] !== ')') throw err();
            return v;
        }
        const m = /^\d+/.exec(s.slice(i));
        if (!m) throw err();
        i += m[0].length;
        return fr(BigInt(m[0]));
    }
    function terme() {
        let v = primari();
        while (s[i] === '*' || s[i] === ':' || s[i] === '/') {
            const o = s[i++];
            const w = primari();
            v = o === '*' ? per(v, w) : entre(v, w);
        }
        return v;
    }
    function expr() {
        let v = terme();
        while (s[i] === '+' || s[i] === '-') {
            const o = s[i++];
            const w = terme();
            v = o === '+' ? suma(v, w) : resta(v, w);
        }
        return v;
    }
    const v = expr();
    if (i !== s.length) throw err();
    return v;
}

/** El valor exacte d'un exercici: a op b. */
function valorExercici({ a, op, b }) {
    const A = fr(BigInt(a.n), BigInt(a.d)),
        B = fr(BigInt(b.n), BigInt(b.d));
    return op === '+' ? suma(A, B) : op === '-' ? resta(A, B) : op === '·' ? per(A, B) : entre(A, B);
}

/** '' si la línia (el text pla d'una fila) és certa per a l'exercici, o què falla. */
function veritatLinia(pla, valor) {
    const t = pla.replace(/\s+/g, '').replace(/−/g, '-');
    const calcul = /^«(mcm|mcd)»\((\d+),(\d+)\)=(\d+)$/.exec(t);
    if (calcul) {
        const [, quin, x, y, r] = calcul.map((v, j) => (j > 1 ? Number(v) : v));
        const bo = quin === 'mcd' ? mcdN(x, y) : (x / mcdN(x, y)) * y;
        return bo === r ? '' : `${t}: el ${quin} és ${bo}`;
    }
    const parts = t.split('=');
    const cadena = parts[0] === '' || parts.length === 1; // «= …» o l'operació
    const valors = parts.filter(Boolean).map(avalua);
    if (valors.some(v => !iguals(v, valors[0]))) return `${t}: les parts no són iguals`;
    if (cadena && !iguals(valors[0], valor)) return `${t} val ${valors[0].n}/${valors[0].d} i no ${valor.n}/${valor.d}`;
    return '';
}

const w = loadModule(
    ['js/utils.js', 'js/pissarra/formules.js', 'js/pissarra/comprova.js', 'js/fraccions/resolucio.js'],
    { seed: 20261116 }
);
const { Resolucio, textPla } = w;

suite('1. Els exercicis de cada nivell (com els de l’activitat)');
{
    const dolents = [];
    const anota = t => dolents.length < 5 && dolents.push(t);
    const ops = new Set();
    for (const nivell of Resolucio.NIVELLS)
        for (let k = 0; k < 2000; k++) {
            const ex = Resolucio.exercici(nivell);
            const { a, op, b } = ex;
            const on = `nivell ${nivell}: ${a.n}/${a.d} ${op} ${b.n}/${b.d}`;
            ops.add(`${nivell}${op}`);
            if (mcdN(a.n, a.d) !== 1 || mcdN(b.n, b.d) !== 1) anota(`${on}: no són irreductibles`);
            const m = (a.d / mcdN(a.d, b.d)) * b.d;
            if (nivell === 1 && a.d !== b.d) anota(`${on}: denominadors diferents`);
            if (nivell === 2 && (a.d === b.d || (m !== a.d && m !== b.d)))
                anota(`${on}: cap no és múltiple de l’altre`);
            if (nivell === 3 && (m === a.d || m === b.d)) anota(`${on}: un és múltiple de l’altre`);
            if ((nivell === 4) !== (op === '·' || op === ':')) anota(`${on}: operació d’un altre nivell`);
            if (valorExercici(ex).n <= 0n) anota(`${on}: el resultat no és positiu`);
        }
    ok(
        'nivells 1–3 sumes i restes, nivell 4 productes i divisions, fraccions irreductibles',
        !dolents.length,
        dolents.join('\n      → ')
    );
    eq('surten totes les operacions de cada nivell', [...ops].sort().join(' '), '1+ 1- 2+ 2- 3+ 3- 4: 4·');
}

suite('2. Resolució pas a pas (resolucio.html): el guió de cada operació');
{
    const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
    const PLURAL = /\b(calculem|fem|tenim|sumem|restem|dividim|multipliquem|busquem|simplifiquem|escrivim|reduïm)\b/i;
    const errorsKatex = [],
        plurals = [],
        senseFinal = [];
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const tipus = new Set();
    let revisades = 0;
    const revisa = (passos, on) => {
        const formules = new Set();
        for (const p of passos) {
            p.files.filter(Boolean).forEach(f => formules.add(f));
            for (const m of p.text.matchAll(/\$([^$]+)\$/g)) formules.add(m[1]);
            if (PLURAL.test(p.text)) anota(plurals, `${on}: «${p.text}»`);
        }
        for (const f of formules) {
            const html = katex.renderToString(f, {
                throwOnError: false,
                strict: 'ignore',
                trust: c => c.command === '\\htmlData',
            });
            if (/katex-error/.test(html)) anota(errorsKatex, `${on}: ${f}`);
        }
        if (!passos[passos.length - 1].classes.includes('final')) anota(senseFinal, on);
    };
    function* exercicis() {
        for (const nivell of Resolucio.NIVELLS)
            for (let k = 0; k < 600; k++) {
                const ex = Resolucio.exercici(nivell);
                const on = `nivell ${nivell}, ${ex.a.n}/${ex.a.d} ${ex.op} ${ex.b.n}/${ex.b.d}`;
                for (const e of Resolucio.etapes(ex))
                    tipus.add(e.tipus === 'simplifica' && e.fusiona ? 'simplifica (enter)' : e.tipus);
                const passos = Resolucio.passos(ex);
                const vista = ({ oberts }) => Resolucio.passos(ex, { oberts });
                if (k < 60) {
                    revisades++;
                    revisa(passos, on);
                    const oberts = new Set(passos.filter(p => p.teDetall).map(p => p.id));
                    revisa(vista({ oberts }), `${on} (tot el detall)`);
                }
                yield { on, passos, vista, files: Resolucio.files(ex), valor: valorExercici(ex) };
            }
    }
    provaActivitat('fraccions', {
        exercicis: exercicis(),
        eines: w,
        text: true,
        veritat: (fila, ex) => {
            try {
                return veritatLinia(textPla(fila), ex.valor);
            } catch (e) {
                return e.message;
            }
        },
        maxPeces: 6,
        minExercicis: 2400,
    });
    ok(
        `KaTeX dibuixa totes les fórmules (${revisades} operacions, tancades i amb tot el detall)`,
        !errorsKatex.length,
        errorsKatex.join('\n      → ')
    );
    ok('les frases són en segona persona', !plurals.length, plurals.join('\n      → '));
    ok('l’últim pas té el resultat ressaltat (classe «final»)', !senseFinal.length, senseFinal.join(', '));
    eq(
        'hi surten tots els tipus de pas',
        [...tipus].sort().join(', '),
        'comu, divideix, opera, simplifica, simplifica (enter)'
    );
    // Un exemple fet a mà: 5/6 + 7/9, amb el detall del comú denominador
    const ex = { nivell: 3, a: { n: 5, d: 6 }, op: '+', b: { n: 7, d: 9 } };
    const oberts = new Set(['2']);
    const vista = Resolucio.passos(ex, { oberts });
    eq(
        '5/6 + 7/9 amb el detall: mcm, cada fracció ampliada i les dues amb el 18',
        vista
            .at(-1)
            .files.filter(Boolean)
            .map(f => textPla(f).replace(/\s+/g, ''))
            .join(' | '),
        [
            '((5)/(6))+((7)/(9))',
            '«mcm»(6,9)=18',
            '((5)/(6))=((5*3)/(6*3))=((15)/(18))',
            '((7)/(9))=((7*2)/(9*2))=((14)/(18))',
            '=((15)/(18))+((14)/(18))',
            '=((29)/(18))',
        ].join(' | ')
    );
    const s2c = vista.find(p => p.id === '2d');
    ok(
        'en tancar el detall, cada fracció ampliada baixa de la seva línia i el «+», de la de l’operació',
        s2c && s2c.reanomena.F2kan === 'F2Bkzn' && s2c.reanomena.F2kbn === 'F2Ckzn' && s2c.reanomena.F2ko === 'F1ko',
        JSON.stringify(s2c && s2c.reanomena)
    );
}

finish('TESTS DE FRACCIONS');
