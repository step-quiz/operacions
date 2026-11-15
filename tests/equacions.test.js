/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/equacions.test.js
 * ROL: Tests d'«Equacions de 1r grau» (js/equacions/math-engine.js i renderer.js).
 * ARQUITECTURA:
 * - 1. Empremta: 7.200 equacions generades amb llavor (tots els nivells, amb i
 *   sense ?lefttoright=1, sessions de 5 i de 10), amb els seus passos i l'HTML
 *   de cada línia. Si canvia, canvien les preguntes de les sessions fixes o com
 *   es veuen les equacions: només s'ha d'actualitzar si el canvi és volgut (i
 *   s'explica al costat de la constant).
 * - 1b. Cap equació sense una sola solució entera.
 * - 2. «Resolució pas a pas» (resolucio.html, js/equacions/resolucio.js): sobre
 *   milers d'equacions dels nivells 1, 2 i 3, el guió de la pissarra passa la
 *   bateria comuna (tests/pissarra-activitat.js): el guió passa la revisió
 *   (js/pissarra/comprova.js), cada pas mou alguna peça i poques, cada línia que es
 *   veu és una equació amb la mateixa solució (recalculada aquí, amb aritmètica
 *   exacta) i el detall a demanda compleix la seva regla a totes les vistes (cada
 *   pas obert i tots oberts). I KaTeX dibuixa totes les fórmules, les frases són en
 *   segona persona i l'últim pas té el resultat ressaltat.
 * ÚS: node tests/equacions.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');
const { provaActivitat } = require('./pissarra-activitat');

// e12f22f1 era l'empremta del codi d'abans de moure'l (27/10/2026). El mateix dia es va corregir el mode sense
// nivell, que de tant en tant generava equacions sense una sola solució («3x + 4 = 3x + 4»): de 60.000
// preguntes sembrades una a una (com a les sessions fixes), només van canviar les 335 que eren així.
const EMPREMTA = '98bae53';

// ─────────────────────────────────────────────────────────────────────────────
suite('1. Empremta de les equacions (sessions fixes i aspecte, sense canvis)');
{
    let h = 2166136261 >>> 0;
    const mix = s => {
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
    };
    let n = 0;
    for (const nivell of [0, 1, 2, 3])
        for (const leftToRight of [false, true])
            for (const totalOperations of [5, 10]) {
                const seed = 1000 + nivell * 10 + (leftToRight ? 1 : 0) + totalOperations;
                const w = loadModule(['js/utils.js', 'js/equacions/math-engine.js', 'js/equacions/renderer.js'], {
                    seed,
                });
                const { MathEngine, Renderer } = w;
                for (let rep = 0; rep < 60; rep++)
                    for (let op = 0; op < totalOperations; op++) {
                        const e = MathEngine.generateEquation(op, { nivell, leftToRight, totalOperations });
                        const st = MathEngine.determineSteps(e);
                        mix(JSON.stringify(e));
                        mix(JSON.stringify(st));
                        mix(Renderer.renderTerms(e.dispLeft) + '|' + Renderer.renderTerms(e.dispRight));
                        for (const s of st)
                            mix(Renderer.renderTerms(s.dispLeftAfter) + '=' + Renderer.renderTerms(s.dispRightAfter));
                        n++;
                    }
            }
    eq(`${n} equacions: l'empremta de sempre (les sessions fixes no canvien)`, h.toString(16), EMPREMTA);
}

// ─────────────────────────────────────────────────────────────────────────────
suite('1b. Totes les equacions tenen una sola solució, entera');
{
    const w = loadModule(['js/utils.js', 'js/equacions/math-engine.js'], { seed: 777 });
    const dolentes = [];
    for (const nivell of [0, 1, 2, 3])
        for (let k = 0; k < 3000; k++) {
            const e = w.MathEngine.generateEquation(k % 10, { nivell, totalOperations: 10 });
            const ok1 = e.leftA !== e.rightC && Number.isInteger(e.xSol) && e.xSol !== 0;
            const ok2 = (e.leftA - e.rightC) * e.xSol + e.leftB === e.rightD;
            if ((!ok1 || !ok2) && dolentes.length < 5) dolentes.push(`nivell ${nivell}: ${JSON.stringify(e)}`);
        }
    ok(
        '12.000 equacions: el coeficient de la x no s’anul·la i la solució és la que diu',
        !dolentes.length,
        dolentes.join('\n      → ')
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aritmètica exacta (fraccions amb BigInt) per comprovar les línies sense fer servir el codi que es prova
const gcd = (a, b) => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) [a, b] = [b, a % b];
    return a;
};
function Q(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d < 0n) [n, d] = [-n, -d];
    const g = gcd(n, d) || 1n;
    return { n: n / g, d: d / g };
}
const suma = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const resta = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const producte = (a, b) => Q(a.n * b.n, a.d * b.d);
const quocient = (a, b) => Q(a.n * b.d, a.d * b.n);
/** Valor d'un costat en text pla («3(x-2)+4x-1», també «(-3)·x», «-20:4»), amb x = un valor exacte. */
function avalua(text, x) {
    let i = 0;
    function primari() {
        if (text[i] === '(') {
            i++;
            const v = expressio();
            i++; // «)»
            return v;
        }
        if (text[i] === 'x') {
            i++;
            return x;
        }
        const m = /^\d+/.exec(text.slice(i));
        if (!m) throw new Error(`no s'entén «${text.slice(i)}» a ${text}`);
        i += m[0].length;
        return Q(m[0]);
    }
    function terme() {
        let v = primari();
        for (;;) {
            if (text[i] === '·' || text[i] === '*') {
                i++;
                v = producte(v, primari());
            } else if (text[i] === ':') {
                i++;
                v = quocient(v, primari());
            } else if (text[i] === '(' || text[i] === 'x')
                v = producte(v, primari()); // implícit: 3x, 3(x-2)
            else return v;
        }
    }
    function expressio() {
        let v = text[i] === '-' ? (i++, producte(Q(-1), terme())) : terme();
        while (text[i] === '+' || text[i] === '-') {
            const c = text[i++];
            const w = terme();
            v = c === '+' ? suma(v, w) : resta(v, w);
        }
        return v;
    }
    const v = expressio();
    if (i !== text.length) throw new Error(`sobra «${text.slice(i)}» a ${text}`);
    return v;
}
/** La solució d'una línia «costat = costat» (lineal: es comprova en un tercer punt), o null. */
function solucio(linia) {
    const [esq, dre] = linia.split('=');
    const f = x => resta(avalua(esq, x), avalua(dre, x));
    const b = f(Q(0)),
        a = resta(f(Q(1)), b);
    const c = f(Q(7));
    const lineal = suma(producte(a, Q(7)), b);
    if (c.n !== lineal.n || c.d !== lineal.d) throw new Error(`no és lineal: ${linia}`);
    return a.n === 0n ? null : quocient(producte(b, Q(-1)), a);
}
suite('2. Resolució pas a pas (resolucio.html): el guió de cada equació');
{
    const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
    const w = loadModule(
        [
            'js/utils.js',
            'js/equacions/math-engine.js',
            'js/pissarra/formules.js',
            'js/pissarra/comprova.js',
            'js/equacions/resolucio.js',
        ],
        { seed: 20261115 }
    );
    const { Resolucio, textPla } = w;
    const PLURAL = /\b(calculem|fem|tenim|sabem|passem|sumem|restem|dividim|multipliquem|aïllem|resolem)\b/i;
    const errorsKatex = [],
        plurals = [],
        senseFinal = [];
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    let revisades = 0;
    // KaTeX ha de dibuixar cada fórmula (files i textos) dels primers exercicis, tancats i amb tot el detall
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
                const eqn = Resolucio.exercici(nivell);
                const on = `nivell ${nivell}, equació ${k}`;
                const passos = Resolucio.passos(eqn);
                const vista = ({ oberts }) => Resolucio.passos(eqn, { oberts });
                if (k < 60) {
                    revisades++;
                    revisa(passos, on);
                    const oberts = new Set(passos.filter(p => p.teDetall).map(p => p.id));
                    revisa(vista({ oberts }), `${on} (tot el detall)`);
                }
                yield { on, passos, vista, files: Resolucio.files(eqn), xSol: eqn.xSol };
            }
    }
    provaActivitat('equacions', {
        exercicis: exercicis(),
        eines: w,
        text: true,
        veritat: (fila, ex) => {
            const pla = textPla(fila);
            try {
                const s = solucio(pla);
                return !s || s.n !== BigInt(ex.xSol) || s.d !== 1n ? `${pla} no té solució x = ${ex.xSol}` : '';
            } catch (e) {
                return e.message;
            }
        },
        maxPeces: 10,
        minExercicis: 1800,
    });
    ok(
        `KaTeX dibuixa totes les fórmules (${revisades} equacions, tancades i amb tot el detall)`,
        !errorsKatex.length,
        errorsKatex.join('\n      → ')
    );
    ok('les frases són en segona persona', !plurals.length, plurals.join('\n      → '));
    ok('l’últim pas té el resultat ressaltat (classe «final»)', !senseFinal.length, senseFinal.join(', '));
}

finish('TESTS D’EQUACIONS');
