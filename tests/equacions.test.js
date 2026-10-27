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
 * - 2. «Resolució pas a pas» (?pissarra=1): sobre milers d'equacions de tots els
 *   nivells, l'historial que es va escrivint línia a línia: cada animació passa la
 *   revisió dels guions (js/pissarra/comprova.js), cada línia que es veu és una
 *   equació amb la mateixa solució (recalculada aquí, amb aritmètica exacta), sense
 *   les claus l'HTML de cada línia és el de sempre, i cada pas mou poques peces.
 * ÚS: node tests/equacions.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, eq, finish, loadModule } = require('./harness');

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
/** Valor d'un costat en text pla («3(x-2)+4x-1»), amb x = un valor exacte. */
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
        while (text[i] === '(' || text[i] === 'x') v = producte(v, primari()); // producte implícit: 3x, 3(x-2)
        return v;
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
const textPla = html =>
    html
        .replace(/<[^>]+>/g, '')
        .replace(/−/g, '-')
        .replace(/\s+/g, '');
const senseClaus = html => html.replace(/<span data-k="[^"]*">([^<]*)<\/span>/g, '$1').replace(/ data-k="[^"]*"/g, '');

suite('2. Resolució pas a pas (?pissarra=1): l’historial línia a línia');
{
    const w = loadModule(
        [
            'js/utils.js',
            'js/equacions/math-engine.js',
            'js/equacions/renderer.js',
            'js/pissarra/formules.js',
            'js/pissarra/comprova.js',
        ],
        { seed: 20261027 }
    );
    const { MathEngine, Renderer, comprovaGuio } = w;
    let equacions = 0,
        animacions = 0,
        maxPeces = 0;
    const dolents = [],
        falses = [],
        diferents = [],
        buides = [];
    const anota = (llista, text) => llista.length < 5 && llista.push(text);
    for (const nivell of [0, 1, 2, 3])
        for (const leftToRight of [false, true])
            for (let k = 0; k < 250; k++) {
                const eqn = MathEngine.generateEquation(k % 10, { nivell, leftToRight, totalOperations: 10 });
                const passos = MathEngine.determineSteps(eqn);
                equacions++;
                // L'historial com el fa el controlador: la primera línia (potser girada) i una per pas
                const historia = [
                    {
                        left: eqn.dispLeft,
                        right: eqn.dispRight,
                        inv: eqn.swapInitial,
                        classe: 'eq-original',
                        pas: null,
                    },
                ];
                const comprovaLinies = (html, on) => {
                    for (const linia of html.match(/<div class="eq-history-line[^"]*">[\s\S]*?<\/div>/g)) {
                        try {
                            const s = solucio(textPla(linia));
                            if (!s || s.n !== BigInt(eqn.xSol) || s.d !== 1n)
                                anota(falses, `${on}: ${textPla(linia)} no té solució x = ${eqn.xSol}`);
                        } catch (e) {
                            anota(falses, `${on}: ${e.message}`);
                        }
                    }
                };
                passos.forEach((pas, j) => {
                    const A = Renderer.historiaHtml(historia);
                    if (historia.length > 1 && historia[historia.length - 1].classe === 'eq-latest')
                        historia[historia.length - 1].classe = '';
                    const fet = j === passos.length - 1;
                    historia.push({
                        left: pas.dispLeftAfter,
                        right: pas.dispRightAfter,
                        inv: false,
                        classe: fet ? 'eq-solved' : 'eq-latest',
                        pas,
                    });
                    const B = Renderer.historiaHtml(historia);
                    const anim = Renderer.animacioUltimaLinia(historia);
                    const on = `nivell ${nivell}, equació ${k}, pas ${j + 1} (${pas.type})`;
                    animacions++;
                    const guio = [
                        { files: [A], classes: [''], text: 'A.' },
                        Object.assign({ files: [B], classes: [''], text: 'B.' }, anim),
                    ];
                    for (const e of comprovaGuio(guio, 1, on)) anota(dolents, e);
                    const peces =
                        Object.keys(anim.reanomena || {}).length + Object.values(anim.fusiona || {}).flat().length;
                    maxPeces = Math.max(maxPeces, peces);
                    if (!peces) anota(buides, on);
                    comprovaLinies(B, on);
                });
                // Sense claus, cada línia és la de sempre (la que pintava el joc abans)
                historia.forEach((l, r) => {
                    const [esq, dre] = l.inv ? [l.right, l.left] : [l.left, l.right];
                    const abans =
                        `<div class="eq-history-line${l.classe ? ' ' + l.classe : ''}">` +
                        `${Renderer.renderTerms(esq)}<span class="eq-sign">=</span>${Renderer.renderTerms(dre)}</div>`;
                    const pla = Renderer.liniaHtml(l, r);
                    const ambClaus = Renderer.liniaHtml(l, r, { claus: true });
                    if (pla !== abans || senseClaus(ambClaus) !== abans)
                        anota(diferents, `${nivell}/${k}, línia ${r + 1}`);
                });
            }
    ok(
        `${animacions} animacions de ${equacions} equacions passen la revisió dels guions`,
        animacions > 3000 && !dolents.length,
        dolents.join('\n      → ')
    );
    ok('cada pas mou alguna peça', !buides.length, buides.join('\n      → '));
    ok(`cada pas mou poques peces (com a màxim ${maxPeces}; cap pas en mou més de 10)`, maxPeces <= 10);
    ok('cada línia que es veu té la solució de l’equació', !falses.length, falses.join('\n      → '));
    ok('sense claus, l’HTML de cada línia és el de sempre', !diferents.length, diferents.join(', '));
}

finish('TESTS D’EQUACIONS');
