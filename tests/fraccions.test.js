/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/fraccions.test.js
 * ROL: Tests de la «Resolució pas a pas» (?pissarra=1) d'«Operacions amb
 *      Fraccions» (js/fraccions/renderer.js).
 * ARQUITECTURA:
 * - Es resolen milers d'operacions com les de l'activitat (sumes i restes amb
 *   denominadors iguals o diferents i un denominador comú qualsevol, productes,
 *   divisions; simplificacions d'un cop, en dos cops o fins a un nombre enter, o
 *   el resultat irreductible de cop), línia a línia com fa el controlador:
 *   cada animació passa la revisió dels guions (js/pissarra/comprova.js), cada
 *   línia que es veu val el resultat (aritmètica exacta, calculada aquí), sense
 *   les claus l'HTML de cada línia és el de sempre, i cada pas mou poques peces.
 * ÚS: node tests/fraccions.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, finish, loadModule } = require('./harness');

const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
const mcm = (a, b) => (a * b) / mcd(a, b);

// L'HTML de sempre (el que escriu fraccions.js sense pissarra), per comparar-lo
const fraccioVella = (n, d) =>
    d === 1
        ? `<span class="math-cell integer-val">${n}</span>`
        : `<div class="fraction"><span class="math-cell">${n}</span><hr><span class="math-cell">${d}</span></div>`;
const htmlVell = linia => {
    const termes = linia.termes.map(t =>
        typeof t === 'string'
            ? `<span class="operator">${t}</span>`
            : t.fr
              ? `<div class="fraction"><span class="math-cell">${t.n}</span><hr><span class="math-cell">${t.d}</span></div>`
              : fraccioVella(t.n, t.d)
    );
    const igual = '<span class="operator">=</span>';
    return (linia.pas ? [igual, ...termes] : [...termes, igual]).join('');
};
const espais = html => html.replace(/>\s+</g, '><').trim();
const senseClaus = html => html.replace(/ data-k="[^"]*"/g, '');

// El valor d'una línia, llegit de l'HTML: [n, d] irreductible
function valor(html) {
    const text = html
        .replace(/<div class="fraction"><span[^>]*>(\d+)<\/span><hr><span[^>]*>(\d+)<\/span><\/div>/g, ' $1/$2 ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/=/g, ' ')
        .trim()
        .split(/\s+/);
    const fr = s => (s.includes('/') ? s.split('/').map(Number) : [Number(s), 1]);
    let [n, d] = fr(text[0]);
    if (text.length > 1) {
        const [c, e] = fr(text[2]);
        const o = text[1];
        if (o === '+') [n, d] = [n * e + c * d, d * e];
        else if (o === '-') [n, d] = [n * e - c * d, d * e];
        else if (o === '·') [n, d] = [n * c, d * e];
        else if (o === ':') [n, d] = [n * e, d * c];
        else throw new Error(`signe desconegut: ${o}`);
    }
    const g = mcd(n, d);
    return [n / g, d / g];
}

// Un generador amb llavor (les proves no fan servir Math.random)
let llavor = 20261027;
const atzar = (a, b) => {
    llavor = (Math.imul(llavor, 1103515245) + 12345) >>> 0;
    return a + (llavor % (b - a + 1));
};
const irreductible = () => {
    for (;;) {
        const n = atzar(1, 9),
            d = atzar(2, 9);
        if (mcd(n, d) === 1) return { n, d };
    }
};

/** Les línies d'una operació resolta, com les escriu fraccions.js, amb camins triats a l'atzar. */
function resolucio(mode) {
    let f1 = irreductible(),
        f2 = irreductible();
    const op = mode === 'addsub' ? ['+', '-'][atzar(0, 1)] : ['·', ':'][atzar(0, 1)];
    if (mode === 'addsub' && atzar(0, 3) === 0) f2.d = f1.d; // denominadors iguals (nivell 1)
    if (op === '-' && f1.n / f1.d < f2.n / f2.d) [f1, f2] = [f2, f1];
    const linies = [{ termes: [f1, op, f2], pas: null }];
    let n, d;
    if (mode === 'addsub') {
        let D = f1.d;
        if (f1.d !== f2.d) {
            D = mcm(f1.d, f2.d) * atzar(1, 3); // l'alumne pot triar qualsevol múltiple comú
            linies.push({
                termes: [{ n: (f1.n * D) / f1.d, d: D }, op, { n: (f2.n * D) / f2.d, d: D }],
                pas: 'amplia',
            });
        }
        const [a, , b] = linies[linies.length - 1].termes;
        [n, d] = [op === '+' ? a.n + b.n : a.n - b.n, D];
    } else {
        let f = f2;
        if (op === ':') {
            f = { n: f2.d, d: f2.n, fr: true };
            linies.push({ termes: [f1, '·', f], pas: 'inverteix' });
        }
        [n, d] = [f1.n * f.n, f1.d * f.d];
    }
    const g = mcd(n, d);
    if (g > 1 && atzar(0, 3) === 0) {
        linies.push({ termes: [{ n: n / g, d: d / g }], pas: 'opera' }); // el resultat irreductible de cop
        return linies;
    }
    linies.push({ termes: [{ n, d }], pas: 'opera' });
    // Simplificar en dos cops (si es pot) o en un
    const divisors = [];
    for (let k = 2; k < g; k++) if (g % k === 0) divisors.push(k);
    if (divisors.length && atzar(0, 1)) {
        const k = divisors[atzar(0, divisors.length - 1)];
        linies.push({ termes: [{ n: n / k, d: d / k }], pas: 'simplifica' });
    }
    if (g > 1) linies.push({ termes: [{ n: n / g, d: d / g }], pas: 'simplifica' });
    return linies;
}

suite('Resolució pas a pas (?pissarra=1): les línies de l’expressió');
{
    const w = loadModule(['js/fraccions/renderer.js', 'js/pissarra/formules.js', 'js/pissarra/comprova.js']);
    const { Renderer, comprovaGuio } = w;
    let operacions = 0,
        animacions = 0,
        maxPeces = 0;
    const dolents = [],
        falses = [],
        diferents = [],
        buides = [],
        vistos = new Set();
    const anota = (llista, text) => llista.length < 5 && llista.push(text);
    for (const mode of ['addsub', 'muldiv'])
        for (let k = 0; k < 3000; k++) {
            const linies = resolucio(mode);
            operacions++;
            const esperat = valor(htmlVell(linies[0]));
            const historia = [linies[0]];
            for (let j = 1; j < linies.length; j++) {
                const A = Renderer.historiaHtml(historia);
                historia.push(linies[j]);
                const B = Renderer.historiaHtml(historia);
                const anim = Renderer.animacioUltimaLinia(historia);
                const on = `${mode} ${k}, pas ${j} (${linies[j].pas}): ${JSON.stringify(linies.map(l => l.termes))}`;
                animacions++;
                vistos.add(
                    `${linies[j].pas}${linies[j].termes.length === 1 && linies[j].termes[0].d === 1 ? ' (enter)' : ''}`
                );
                const guio = [
                    { files: [A], classes: [''], text: 'A.' },
                    Object.assign({ files: [B], classes: [''], text: 'B.' }, anim),
                ];
                for (const e of comprovaGuio(guio, 1, on)) anota(dolents, e);
                const peces =
                    Object.keys(anim.reanomena || {}).length + Object.values(anim.fusiona || {}).flat().length;
                maxPeces = Math.max(maxPeces, peces);
                if (!peces) anota(buides, on);
            }
            historia.forEach((l, r) => {
                const v = valor(Renderer.liniaHtml(l, r));
                if (v[0] !== esperat[0] || v[1] !== esperat[1])
                    anota(falses, `${mode} ${k}, línia ${r + 1}: val ${v.join('/')} i no ${esperat.join('/')}`);
                const pla = Renderer.liniaHtml(l, r);
                const ambClaus = Renderer.liniaHtml(l, r, { claus: true });
                const vell = `<div class="expr-line">${htmlVell(l)}</div>`;
                if (espais(pla) !== espais(vell) || senseClaus(ambClaus) !== pla)
                    anota(diferents, `${mode} ${k}, línia ${r + 1}`);
            });
        }
    ok(
        `${animacions} animacions de ${operacions} operacions passen la revisió dels guions`,
        animacions > 6000 && !dolents.length,
        dolents.join('\n      → ')
    );
    const tots = ['amplia', 'inverteix', 'opera', 'opera (enter)', 'simplifica', 'simplifica (enter)'];
    ok(
        'hi surten tots els passos (amplia, inverteix, opera, simplifica; també amb resultat enter)',
        tots.every(t => vistos.has(t)),
        tots.filter(t => !vistos.has(t)).join(', ')
    );
    ok('cada pas mou alguna peça', !buides.length, buides.join('\n      → '));
    ok(`cada pas mou poques peces (com a màxim ${maxPeces}; cap pas en mou més de 5)`, maxPeces <= 5);
    ok('cada línia que es veu val el resultat de l’operació', !falses.length, falses.join('\n      → '));
    ok('sense claus, l’HTML de cada línia és el de sempre', !diferents.length, diferents.join(', '));
}

finish('TESTS DE FRACCIONS');
