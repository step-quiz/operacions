/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/pissarra.test.js
 * ROL: Tests de la «Resolució pas a pas» (la pissarra animada, js/pissarra/).
 * ARQUITECTURA:
 * - Les parts pures es carreguen com a mòduls de debò (import() de Node):
 *   formules.js (claus, guió, historial, files llargues), pla.js (el pla de cada
 *   transició), comprova.js (revisió dels guions, regla del detall a demanda i
 *   text pla de cada fila) i mode.js (?pissarra=1).
 * - La revisió dels guions i la del detall es proven amb guions bons i amb
 *   guions dolents fets a mà: cada error ha de sortir.
 * - REGLES DE TOTS ELS GUIONS (secció 5): cada guió registrat a GUIONS (avui,
 *   els de mostra de demo.js; després, els de cada activitat) passa la revisió,
 *   KaTeX dibuixa totes les fórmules sense errors, el text és en segona persona
 *   i l'últim pas té el resultat ressaltat.
 * - VERITAT DE CADA LÍNIA: cada fila que veu l'alumne es llegeix (textPla) i es
 *   calcula amb aritmètica exacta, amb un avaluador fet aquí (independent del
 *   motor), contra el resultat que s'espera.
 * ÚS: node tests/pissarra.test.js
 * ============================================================================
 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT, suite, ok, eq, finish } = require('./harness');
const { provaActivitat } = require('./pissarra-activitat');

// Entorn mínim: mode.js llegeix window.location en carregar-se
globalThis.window = globalThis;
globalThis.location = { search: '', pathname: '/test.html' };

const importa = f => import(pathToFileURL(path.join(ROOT, f)).href);
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));

// ── Aritmètica exacta (fraccions amb BigInt) i un avaluador d'expressions ─────
const gcd = (a, b) => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) [a, b] = [b, a % b];
    return a;
};
function Q(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new Error('divisió per zero');
    if (d < 0n) [n, d] = [-n, -d];
    const g = gcd(n, d) || 1n;
    return { n: n / g, d: d / g };
}
const suma = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const resta = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const producte = (a, b) => Q(a.n * b.n, a.d * b.d);
const quocient = (a, b) => Q(a.n * b.d, a.d * b.n);
const igualQ = (a, b) => a.n === b.n && a.d === b.d;
const textQ = a => (a.d === 1n ? String(a.n) : `${a.n}/${a.d}`);

/** Arrel quadrada exacta d'un racional (null si no és un quadrat perfecte). */
function arrelQ(a) {
    const isqrt = n => {
        if (n < 0n) return null;
        let r = BigInt(Math.floor(Math.sqrt(Number(n))));
        while (r * r > n) r--;
        while ((r + 1n) * (r + 1n) <= n) r++;
        return r * r === n ? r : null;
    };
    const n = isqrt(a.n),
        d = isqrt(a.d);
    return n === null || d === null ? null : Q(n, d);
}

/**
 * Valor exacte d'una expressió en text pla (la sortida de textPla): enters,
 * x (la variable, amb el valor «x»), les lletres de «vars» (p. ex. { a: Q(10) }),
 * + - * : / ^ (exponent enter), sqrt(…) exacta, parèntesis i producte implícit
 * (2x, 3(x+1), (a)(b)).
 */
function avalua(text, x = null, vars = {}) {
    let i = 0;
    const mira = () => text[i];
    function primari() {
        const c = mira();
        if (c === '(') {
            i++;
            const v = expressio();
            if (text[i] !== ')') throw new Error(`falta «)» a ${text}`);
            i++;
            return v;
        }
        if (text.startsWith('sqrt(', i)) {
            i += 4;
            const v = primari();
            const r = arrelQ(v);
            if (!r) throw new Error(`arrel no exacta a ${text}`);
            return r;
        }
        if (c === 'x') {
            i++;
            if (x === null) throw new Error(`hi ha una x a ${text}`);
            return x;
        }
        if (c && Object.prototype.hasOwnProperty.call(vars, c)) {
            i++;
            return vars[c];
        }
        const m = /^\d+/.exec(text.slice(i));
        if (!m) throw new Error(`no s'entén «${text.slice(i)}» a ${text}`);
        i += m[0].length;
        return Q(m[0]);
    }
    function potencia() {
        let b = primari();
        if (mira() === '^') {
            i++;
            const e = primari();
            if (e.d !== 1n || e.n < 0n) throw new Error('exponent no previst');
            let r = Q(1);
            for (let k = 0n; k < e.n; k++) r = producte(r, b);
            b = r;
        }
        return b;
    }
    function unari() {
        if (mira() === '-') {
            i++;
            return producte(Q(-1), unari());
        }
        if (mira() === '+') {
            i++;
            return unari();
        }
        return potencia();
    }
    function terme() {
        let v = unari();
        for (;;) {
            const c = mira();
            if (c === '*' || c === ':' || c === '/') {
                i++;
                const w = unari();
                v = c === '*' ? producte(v, w) : quocient(v, w);
            } else if (c === '(' || c === 'x' || /\d/.test(c || '') || (c && c in vars)) {
                v = producte(v, potencia()); // producte implícit
            } else return v;
        }
    }
    function expressio() {
        let v = terme();
        while (mira() === '+' || mira() === '-') {
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

/**
 * Solució d'una equació lineal en x escrita en text pla («2x+3=11»): la diferència
 * dels dos membres és a·x + b; es calcula en dos punts i es comprova en un tercer
 * que de debò és lineal. Torna la solució (o null si no n'hi ha una de sola).
 */
function solucioLineal(text) {
    const [esq, dre, ...resta_] = text.split('=');
    if (resta_.length || dre === undefined) throw new Error(`no és una equació: ${text}`);
    const f = x => resta(avalua(esq, x), avalua(dre, x));
    const b = f(Q(0)),
        a = resta(f(Q(1)), b);
    const ara = f(Q(7)),
        esperat = suma(producte(a, Q(7)), b);
    if (!igualQ(ara, esperat)) throw new Error(`no és lineal: ${text}`);
    if (a.n === 0n) return null;
    return quocient(producte(b, Q(-1)), a);
}

(async () => {
    const F = await importa('js/pissarra/formules.js');
    const C = await importa('js/pissarra/comprova.js');
    const M = await importa('js/pissarra/mode.js');
    const PL = await importa('js/pissarra/pla.js');
    const { DEMOS } = await importa('js/pissarra/demo.js');

    // ─────────────────────────────────────────────────────────────────────────
    suite('1. Claus (formules.js)');
    {
        eq('clau() escriu \\htmlData', F.clau('a1', 'x'), '\\htmlData{k=a1}{x}');
        eq('clau() amb marca', F.clau('a1', 'x', 'mes'), '\\htmlData{k=a1,marca=mes}{x}');
        const peta = f => {
            try {
                f();
                return false;
            } catch (e) {
                return true;
            }
        };
        ok(
            'clau no vàlida (comença per xifra) → error',
            peta(() => F.clau('1a', 'x'))
        );
        ok(
            'clau no vàlida (guió) → error',
            peta(() => F.clau('a-b', 'x'))
        );
        ok(
            'marca desconeguda → error',
            peta(() => F.clau('a', 'x', 'blau'))
        );
        eq('op() conserva l’espaiat', F.op('s', '+'), '\\mathbin{\\htmlData{k=s}{+}}');
        eq('rel() conserva l’espaiat', F.rel('q', '='), '\\mathrel{\\htmlData{k=q}{=}}');
        eq(
            'marcat() amb prefix: claus i «=»',
            C.clausDe(F.marcat('q4: ⟦a:a⟧ + ⟦b:b⟧ = ⟦r:2⟧')).join(','),
            'q4a,q4b,q4q,q4r'
        );
        ok(
            'marcat() amb dos «=» sense clau → error',
            peta(() => F.marcat('p: ⟦a:1⟧ = ⟦b:1⟧ = ⟦c:1⟧'))
        );
        eq('frase() d’una fila de text', F.frase('E1', 'el doble', 'objectiu'), '{{E1|objectiu|el doble}}');
        eq('clausDe() troba les frases de les files de text', C.clausDe(F.filaText('a {{E1||b}} c')).join(), 'E1');
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite('2. Guió (formules.js guio)');
    {
        const g = F.guio(2);
        g.files[0] = F.clau('a', '1');
        g.afegeix('Primer.');
        g.afegeix('Repetit.'); // la pissarra no canvia: no s'afegeix
        g.classes[0] = 'final';
        g.afegeix('Només canvia la classe.');
        g.completa(' I una frase més.');
        eq('un pas idèntic a l’anterior no s’afegeix', g.passos.length, 2);
        eq('completa() allarga el text de l’últim pas', g.passos[1].text, 'Només canvia la classe. I una frase més.');
        ok('els passos són immutables', Object.isFrozen(g.passos[0]));
        eq('cada pas té les seves files (còpia)', g.passos[0].classes[0], '');

        // Línies que queden escrites (linies): la nova s'escriu a sota i l'anterior hi queda
        const h = F.guio(3);
        const L = F.linies(h);
        L.escriu([F.P('a', '3'), F.P('s', '+'), F.P('b', '4')], 'Suma.');
        L.escriu([F.P('r', '7')], 'Fet.', {
            fusiona: { r: ['a', 's', 'b'] },
            anterior: [F.P('a', '3'), F.P('s', '+'), F.P('b', '4'), F.P('q', '=')],
            final: true,
        });
        const [p0, p1] = h.passos;
        eq('linies(): dos passos', h.passos.length, 2);
        eq('linies(): la primera línia continua escrita', C.textPla(p1.files[0]), '3+4=');
        eq('linies(): la línia nova, a sota', C.textPla(p1.files[1]), '7');
        eq(
            'linies(): les peces que baixen deixen una còpia (clau nova)',
            C.clausDe(p1.files[0]).join(),
            'Lc0ka,Lc0ks,Lc0kb,L0kq'
        );
        eq(
            'linies(): la fusió surt de les claus d’abans',
            JSON.stringify(p1.fusiona),
            '{"L1kr":["L0ka","L0ks","L0kb"]}'
        );
        eq('linies(): la línia nova és el resultat', p1.classes[1], 'final');
        eq(
            'linies(): la còpia de cada peça que baixa es queda al seu lloc',
            JSON.stringify(p1.copia),
            '{"Lc0ka":"L0ka","Lc0ks":"L0ks","Lc0kb":"L0kb"}'
        );
        eq('linies(): un guió correcte', C.comprovaGuio(h.passos, 3).length, 0);

        // Un símbol que ve de fora de les línies (p. ex. d'un esquema SVG d'una altra fila)
        const e = F.guio(2);
        const M = F.linies(e, 1);
        e.files[0] = '<svg viewBox="0 0 10 10"><text data-k="f6">6</text></svg>';
        e.afegeix('Mira el triangle.');
        e.files[0] = '<svg viewBox="0 0 10 10"><text data-k="f6c">6</text></svg>';
        eq('linies(): L.clau dona la clau que tindrà una peça', M.clau(0, 'b'), 'L0kb');
        M.escriu([F.P('b', '6^2')], 'Substitueix.', {
            extra: { reanomena: { [M.clau(0, 'b')]: 'f6' }, copia: { f6c: 'f6' } },
        });
        eq(
            'linies(): «extra» afegeix els canvis de nom i les còpies de fora',
            JSON.stringify([e.passos[1].reanomena, e.passos[1].copia]),
            '[{"L0kb":"f6"},{"f6c":"f6"}]'
        );
        eq("linies(): el guió amb un símbol de l'esquema és correcte", C.comprovaGuio(e.passos, 2).length, 0);
        eq("clausDe() troba les claus d'un esquema SVG", C.clausDe(e.files[0]).join(), 'f6c');
        eq(
            'linies(): «=» és una relació i «+» un operador',
            /\\mathrel\{\\htmlData\{k=L0kq\}/.test(p1.files[0]) && /\\mathbin/.test(p0.files[0]),
            true
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite('2b. Historial (formules.js historial): TeX, HTML, repartiments i classes');
    {
        const { P } = F;
        const g = F.guio(3);
        const H = F.historial(g);
        const p1 = H.escriu([P('c', '2'), P('a', '('), P('x', 'x'), P('s', '+'), P('t', '3'), P('b', ')')], 'Primer.');
        eq('escriu() torna el pas que ha afegit', p1, g.passos[0]);
        eq('el primer pas és el número 1', p1.id, '1');
        const p2 = H.escriu([P('c', '2'), P('x', 'x'), P('s', '+'), P('n', '6')], 'Distributiva.', {
            mou: { x: 'x', s: 's' },
            reparteix: { c: ['c', 'n'] },
            fusiona: { n: ['t'] },
            classe: 'destacat',
        });
        eq(
            'reparteix: de la clau de la línia anterior a les de la nova',
            JSON.stringify(p2.reparteix),
            '{"L0kc":["L1kc","L1kn"]}'
        );
        eq(
            'la peça repartida també deixa la seva còpia a la línia anterior',
            JSON.stringify(p2.copia),
            '{"Lc0kx":"L0kx","Lc0ks":"L0ks","Lc0kt":"L0kt","Lc0kc":"L0kc"}'
        );
        eq('classe: la classe de la fila de la línia nova', p2.classes[1], 'destacat');
        eq('ultima: la línia i la classe de l’última', H.ultima.classe, 'destacat');
        const p3 = H.escriu([P('r', '6')], 'Fi.', {
            fusiona: { r: ['c', 'x', 's', 'n'] },
            classeAnterior: '',
            final: true,
        });
        eq('classeAnterior: la línia anterior canvia de classe', p3.classes[1], '');
        eq('final: la línia nova és el resultat', p3.classes[2], 'final');
        eq('un guió correcte', C.comprovaGuio(g.passos, 3).length, 0);
        eq('nombre: les línies escrites', H.nombre, 3);
        eq('passos: els del guió', H.passos, g.passos);
        ok(
            'estat: les línies escrites amb el seu nivell, sense les claus de la fila',
            p3.estat.length === 3 && p3.estat.every(l => l.nivell === 0) && p3.estat[2].signatura.includes('k=kr')
        );
        const p4 = H.canvia([P('r', '6', 'solucio')], 'Marca la solució.');
        eq('canvia(): la mateixa línia, amb la marca nova', /marca=solucio/.test(p4.files[2]) && p4.id, '4');

        // HTML en una sola fila (com equacions i fraccions)
        const pintaHtml = (linia, clauDe, classe) =>
            `<p class="${classe}">${linia.map(([id, t]) => `<span data-k="${clauDe(id)}">${t}</span>`).join('')}</p>`;
        const h = F.guio(1);
        h.classes[0] = 'centrada';
        const E = F.historial(h, { prefix: 'e', pinta: pintaHtml, envolta: ls => `<div>${ls.join('')}</div>` });
        E.escriu(
            [
                ['a', '3'],
                ['s', '+'],
                ['b', '4'],
            ],
            '',
            { classe: 'primera' }
        );
        const q2 = E.escriu([['r', '7']], '', { fusiona: { r: ['a', 's', 'b'] }, anunci: 'Línia nova: 7' });
        eq(
            'HTML: totes les línies a la mateixa fila, dins d’envolta',
            q2.files[0],
            '<div><p class="primera"><span data-k="ec0ka">3</span><span data-k="ec0ks">+</span>' +
                '<span data-k="ec0kb">4</span></p><p class=""><span data-k="e1kr">7</span></p></div>'
        );
        eq('HTML: la classe de la fila no canvia', q2.classes[0], 'centrada');
        eq('anunci: passa tal qual al pas', q2.anunci, 'Línia nova: 7');
        eq('HTML: un guió correcte (sense text)', C.comprovaGuio(h.passos, 1, 'html', { text: false }).length, 0);

        // linies() és l'historial TeX: historial(g, { fila, prefix })
        const k = F.guio(2);
        F.linies(k, 1, 'M').escriu([P('a', '1')], 'U.');
        eq('linies(g, fila, prefix) = historial(g, { fila, prefix })', C.clausDe(k.passos[0].files[1]).join(), 'M0ka');
        let peta = false;
        try {
            F.historial(F.guio(1), { prefix: '1x' });
        } catch (e) {
            peta = /Prefix no vàlid/.test(e.message);
        }
        ok('un prefix que no pot començar una clau → error', peta);
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite('3. Files llargues (ampleTex, enLinies)');
    {
        ok('ampleTex creix amb el text', F.ampleTex('1+2+3+4') > F.ampleTex('1+2'));
        ok(
            'una fracció fa l’amplada del més ample',
            F.ampleTex('\\dfrac{12345}{6}') < F.ampleTex('12345') + 30 &&
                F.ampleTex('\\dfrac{12345}{6}') >= F.ampleTex('12345')
        );
        const peces = Array.from({ length: 30 }, (_, k) => ` + ${k + 10}x`);
        const llarg = F.enLinies('S = ', peces, { final: ' = 0' });
        ok('enLinies parteix una suma llarga en un array', llarg.startsWith('\\begin{array}{l}'));
        ok('el final («= 0») és a l’última línia, amb una peça', /\d+x = 0 \\end\{array\}$/.test(llarg));
        eq('si hi cap, una sola línia', F.enLinies('S = ', [' 1', ' + 2']), 'S =  1 + 2');
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite('4. Revisió dels guions (comprova.js comprovaGuio)');
    {
        const K = F.clau;
        const pas = (files, text = 'Text.', extra = {}) =>
            Object.assign({ files, classes: files.map(() => ''), text }, extra);
        const bo = [
            pas([K('a', '3') + F.op('s', '+') + K('b', '4')]),
            pas([K('r', '7')], 'Suma: $3 + 4 = 7$.', { fusiona: { r: ['a', 's', 'b'] } }),
        ];
        eq('un guió bo no té errors', C.comprovaGuio(bo, 1).length, 0);
        const errorDe = (passos, patro, n = 1) => {
            const e = C.comprovaGuio(passos, n, 'g');
            return e.some(m => patro.test(m));
        };
        ok('claus repetides en un pas', errorDe([pas([K('a', '1') + K('a', '2')])], /claus repetides/));
        ok('nombre de files equivocat', errorDe([pas([K('a', '1')])], /nombre de files/, 2));
        ok('text amb «$» desaparellats', errorDe([pas([K('a', '1')], 'Mal $x.')], /desaparellats/));
        ok(
            'el primer pas no pot animar res',
            errorDe([pas([K('a', '1')], 'T.', { fusiona: { a: ['b'] } })], /primer pas/)
        );
        ok(
            'una fusió d’un símbol que no hi era',
            errorDe(
                [pas([K('a', '1')]), pas([K('r', '2')], 'T.', { fusiona: { r: ['z'] } })],
                /ha de ser al pas anterior/
            )
        );
        ok(
            'una fusió cap a un símbol que no és al pas nou',
            errorDe([pas([K('a', '1')]), pas([K('b', '2')], 'T.', { fusiona: { r: ['a'] } })], /no és al pas nou/)
        );
        ok(
            'un canvi de nom amb la clau vella encara present',
            errorDe(
                [pas([K('a', '1')]), pas([K('a', '1') + K('b', '1')], 'T.', { reanomena: { b: 'a' } })],
                /ha de ser vella/
            )
        );
        ok(
            'una còpia d’un símbol que no hi era',
            errorDe([pas([K('a', '1')]), pas([K('b', '1')], 'T.', { copia: { b: 'z' } })], /no era al pas anterior/)
        );
        ok(
            'el cursor clica un símbol que no hi és',
            errorDe([pas([K('a', '1')]), pas([K('b', '2')], 'T.', { cursor: { clic: 'z' } })], /cursor clica/)
        );
        ok('dos passos idèntics', errorDe([pas([K('a', '1')]), pas([K('a', '1')])], /idèntic/));
        // Repartiments (pas.reparteix = { vella: [noves] })
        const rep = (extra, files2 = [K('c1', '2') + K('c2', '2')]) => [pas([K('c', '2')]), pas(files2, 'T.', extra)];
        eq('un repartiment bo', C.comprovaGuio(rep({ reparteix: { c: ['c1', 'c2'] } }), 1).length, 0);
        ok(
            'repartiment: la vella ha de ser al pas anterior i no al nou',
            errorDe(
                rep({ reparteix: { c: ['c1'] } }, [K('c', '2') + K('c1', '2')]),
                /reparteix c: ha de ser al pas anterior/
            )
        );
        ok(
            'repartiment: cada destí ha de ser nou',
            errorDe(rep({ reparteix: { c: ['c1', 'z'] } }), /«z» ha de ser nova/)
        );
        ok('repartiment sense destins', errorDe(rep({ reparteix: { c: [] } }), /cap destí/));
        ok(
            'un símbol nou que surt de dos repartiments',
            errorDe(
                [pas([K('a', '1') + K('b', '2')]), pas([K('n', '3')], 'T.', { reparteix: { a: ['n'], b: ['n'] } })],
                /dos repartiments/
            )
        );
        ok(
            'repartir i reanomenar alhora',
            errorDe(rep({ reparteix: { c: ['c1', 'c2'] }, reanomena: { c1: 'c' } }), /alhora/)
        );
        ok(
            'el primer pas no pot repartir',
            errorDe([pas([K('c', '2')], 'T.', { reparteix: { c: ['c'] } })], /primer pas/)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite('4b. El pla de cada transició (pla.js planifica)');
    {
        const pla = (A, B, pas) => {
            const r = PL.planifica(A, B, pas);
            return {
                parelles: [...r.parelles].map(([b, a]) => `${b}←${a}`).join(' '),
                desti: [...r.desti].map(([a, b]) => `${a}→${b}`).join(' '),
                velles: r.velles.join(' '),
                noves: r.noves.join(' '),
                copies: [...r.copies].join(' '),
                repartides: [...r.repartides].join(' '),
            };
        };
        const r0 = pla(['a', 'b'], ['a', 'c']);
        eq('la mateixa clau fa parella', r0.parelles, 'a←a');
        eq('sense parella: les velles s’esvaeixen i les noves apareixen', `${r0.velles}|${r0.noves}`, 'b|c');
        eq('reanomena', pla(['a'], ['b'], { reanomena: { b: 'a' } }).parelles, 'b←a');
        eq(
            'una vella només fa parella amb una nova (la primera)',
            pla(['a'], ['a2', 'a3'], { reanomena: { a2: 'a', a3: 'a' } }).parelles,
            'a2←a'
        );
        const r1 = pla(['a'], ['ac', 'b'], { copia: { ac: 'a' }, reanomena: { b: 'a' } });
        eq('una còpia fa parella sense gastar l’original', `${r1.parelles}|${r1.copies}`, 'ac←a b←a|ac');
        const r2 = pla(['c', 't'], ['cc', 'c1', 'c2', 'n'], {
            copia: { cc: 'c' },
            reparteix: { c: ['c1', 'c2'] },
            fusiona: { n: ['t'] },
        });
        eq('reparteix: cada destí fa parella amb la vella', r2.parelles, 'cc←c c1←c c2←c');
        eq('reparteix: les noves que en surten', r2.repartides, 'c1 c2');
        eq('la vella repartida no s’esvaeix; la fusionada va al seu destí', `${r2.velles}|${r2.desti}`, 't|t→n');
        eq('el resultat de la fusió apareix', r2.noves, 'n');
        eq(
            'un repartiment d’una vella que no hi és no fa parella',
            pla(['a'], ['b'], { reparteix: { z: ['b'] } }).noves,
            'b'
        );
        eq('sense pas, només les claus', pla([], ['a']).noves, 'a');
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite('4c. Detall a demanda (historial amb detall, comprova.js comprovaDetall)');
    {
        const { P } = F;
        const linia0 = [P('a', '2'), P('m1', '\\cdot'), P('b', '3'), P('m2', '\\cdot'), P('c', '4')];
        const linia2a = [P('s', '6'), P('m2', '\\cdot'), P('c', '4')];
        const igual = P('q', '=');
        /*
         * 2 · 3 · 4 = 24. El pas 2 es pot obrir (2a: 6 · 4; 2b: 24) i el 2a també (2a1: el 3 es reparteix,
         * (3 + 3) · 4, per provar un detall dins d'un detall; 2a2: 6 · 4).
         * dolent: 'sense-acaba', 'nomes-acaba', 'anterior' (el primer subpas no fa el que fa el pas a la
         * línia anterior) o 'text' (el text d'un altre pas canvia quan s'obre el detall).
         */
        const guio =
            (dolent = '') =>
            ({ oberts }) => {
                const g = F.guio(6);
                const H = F.historial(g, { oberts });
                H.escriu(linia0, 'Calcula $2 \\cdot 3 \\cdot 4$.');
                H.escriu([P('r', '24')], 'Multiplica.', {
                    fusiona: { r: ['a', 'm1', 'b', 'm2', 'c'] },
                    anterior: [...linia0, igual],
                    detall: D => {
                        if (dolent !== 'nomes-acaba')
                            D.escriu(linia2a, '$2 \\cdot 3 = 6$.', {
                                fusiona: { s: ['a', 'm1', 'b'] },
                                mou: { m2: 'm2', c: 'c' },
                                ...(dolent === 'anterior' ? { anterior: linia0 } : {}),
                                detall: E => {
                                    E.escriu(
                                        [
                                            P('o', '('),
                                            P('t', '3'),
                                            P('u', '+'),
                                            P('v', '3'),
                                            P('t2', ')'),
                                            P('m2', '\\cdot'),
                                            P('c', '4'),
                                        ],
                                        '$2 \\cdot 3 = 3 + 3$.',
                                        {
                                            reparteix: { b: ['t', 'v'] },
                                            fusiona: { u: ['a', 'm1'] },
                                            mou: { m2: 'm2', c: 'c' },
                                        }
                                    );
                                    E.acaba('$3 + 3 = 6$.', {
                                        fusiona: { s: ['o', 't', 'u', 'v', 't2'] },
                                        mou: { m2: 'm2', c: 'c' },
                                    });
                                },
                            });
                        if (dolent !== 'sense-acaba')
                            D.acaba('$6 \\cdot 4 = 24$.', {
                                fusiona: { r: ['s', 'm2', 'c'] },
                                anterior: [...linia2a, igual],
                            });
                    },
                });
                H.canvia(
                    [P('r', '24', 'solucio')],
                    dolent === 'text' && oberts.size ? 'Ja està.' : 'El resultat és $24$.'
                );
                return g.passos;
            };
        const ids = (oberts, dolent) =>
            guio(dolent)({ oberts: new Set(oberts) })
                .map(p => p.id + (p.pare ? `<${p.pare}` : '') + (p.tanca ? '!' : '') + (p.teDetall ? '+' : ''))
                .join(' ');
        eq('tancat: tres passos, el 2 es pot obrir', ids([]), '1 2+ 3');
        eq('el 2 obert: 2a (que es pot obrir) i 2b (la línia del pas tancat)', ids(['2']), '1 2a<2+ 2b<2! 3');
        eq('el 2 i el 2a oberts: els subpassos del 2a, 2a1 i 2a2', ids(['2', '2a']), '1 2a1<2a 2a2<2a! 2b<2! 3');
        eq('obrir un subpas sense obrir el seu pare no fa res', ids(['2a']), '1 2+ 3');
        const obert = guio()({ oberts: new Set(['2']) });
        eq(
            'el primer subpas fa a la línia anterior el que hi fa el pas (hi afegeix el «=»)',
            C.textPla(obert[1].files[0]),
            '2*3*4='
        );
        eq('l’últim subpas escriu la línia del pas tancat, amb la seva classe', C.textPla(obert[2].files[2]), '24');
        eq('un detall ben fet: cap error a cap vista', C.comprovaDetall(guio(), 6, 'bo').join(' | '), '');
        const errors = dolent => C.comprovaDetall(guio(dolent), 6, dolent).join(' | ');
        ok('un detall que no acaba amb D.acaba() → error', /no acaba amb D\.acaba\(\)/.test(errors('sense-acaba')));
        ok('un detall que només té D.acaba() → error', /no hi afegeix cap pas/.test(errors('nomes-acaba')));
        ok(
            'un subpas que canvia la línia anterior d’una altra manera → error',
            /la pissarra no és la de la vista tancada/.test(errors('anterior'))
        );
        ok(
            'el text d’un altre pas canvia en obrir el detall → error',
            /el text del pas «3» canvia/.test(errors('text'))
        );

        // Obrir un pas ara i tancar-lo després (una activitat que espera la resposta): H.obre() i el calaix
        const pintaHtml = (linia, clauDe, classe) =>
            `<p class="${classe}">${linia.map(([i, t]) => `<span data-k="${clauDe(i)}">${t}</span>`).join('')}</p>`;
        const h = F.guio(1);
        const E = F.historial(h, { prefix: 'e', pinta: pintaHtml, envolta: ls => `<div>${ls.join('')}</div>` });
        E.escriu(
            [
                ['a', '2'],
                ['m', '·'],
                ['b', '3'],
            ],
            ''
        );
        const D = E.obre([['r', '6']], { titol: 'Multiplica <a> poc a poc' });
        const s1 = D.escriu(
            [
                ['s', '3'],
                ['p', '+'],
                ['t', '3'],
            ],
            'El 3, dues vegades.',
            { reparteix: { b: ['s', 't'] } }
        );
        ok(
            'obre(): el subpas va dins d’un calaix nou, amb el títol (escapat) i la seva frase',
            s1.files[0].includes(
                '<div class="pis-calaix pis-calaix-nou"><div class="pis-calaix-titol">Multiplica &lt;a&gt; poc a poc</div>'
            ) && s1.files[0].includes('<p class="pis-calaix-nota">El 3, dues vegades.</p>')
        );
        eq('obre(): el subpas és el 2a, fill del 2', `${s1.id}<${s1.pare}`, '2a<2');
        const s2 = D.canvia(null, 'Mira-ho bé.');
        ok('el calaix només s’obre amb el gir al pas on apareix', !s2.files[0].includes('pis-calaix-nou'));
        const tancat = D.acaba('Suma: 3 + 3 = 6.', { fusiona: { r: ['s', 'p', 't'] } });
        ok(
            'acaba(): la línia del pas tancat va a sota del calaix, fora',
            /<\/div><p class=""><span data-k="e2kr">6<\/span><\/p><\/div>$/.test(tancat.files[0])
        );
        eq('acaba(): tanca el pas 2 i és el subpas 2c', `${tancat.id}<${tancat.pare}!${tancat.tanca}`, '2c<2!2');
        eq('després del detall, els números continuen com a la vista compacta', E.escriu([['z', '6']], '').id, '3');
        let dosCops = false;
        try {
            D.acaba('Un altre cop.');
        } catch (e) {
            dosCops = /ja s'ha acabat/.test(e.message);
        }
        ok('acaba() dues vegades → error', dosCops);
        eq(
            'el guió amb un pas obert és correcte',
            C.comprovaGuio(h.passos, 1, 'obre', { text: false }).join(' | '),
            ''
        );
        // A les files TeX, les línies d'un detall porten la classe «detall» (el calaix); la del pas tancat, no
        const ple = DEMOS.find(x => x.id === 'parentesis');
        const tot = ple.passos({ oberts: new Set(['2', '3', '5']) });
        const ultim = tot[tot.length - 1];
        eq(
            'files TeX: les del detall són .detall i la resta no',
            ultim.classes.map(c => (c.split(' ').includes('detall') ? 'd' : '·')).join(''),
            '·d·dd··d··'
        );

        // La bateria comuna de les activitats, amb el detall: la demo de l'equació amb parèntesis
        const d = DEMOS.find(x => x.id === 'parentesis');
        provaActivitat('demo parentesis', {
            exercicis: [{ on: 'demo parentesis', passos: d.passos(), vista: d.passos }],
            eines: C,
            files: d.files,
            text: true,
            maxPeces: 10,
            veritat: linia => {
                try {
                    const sol = solucioLineal(C.textPla(linia));
                    return sol && igualQ(sol, Q(4)) ? '' : `${C.textPla(linia)} no té solució x = 4`;
                } catch (e) {
                    return e.message;
                }
            },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite('5. Text pla de cada fila (comprova.js textPla)');
    {
        const K = F.clau;
        eq(
            'claus i operadors',
            C.textPla(K('a', '3') + F.op('s', '+') + K('b', '4') + F.op('m', '\\cdot') + K('c', '2')),
            '3+4*2'
        );
        eq('fraccions', C.textPla('\\dfrac{1}{2}+\\frac{3}{4}'), '((1)/(2))+((3)/(4))');
        eq('marca sense clau', C.textPla(F.marca(K('a', '4'), 'actual')), '4');
        eq('tatxat i requadre', C.textPla(F.tatxa('2') + '+\\boxed{3}'), '2+3');
        eq('potències', C.textPla('2^{3}+x^2'), '2^(3)+x^(2)');
        let peta = false;
        try {
            C.textPla('\\ordreinventada{1}');
        } catch (e) {
            peta = /no prevista/.test(e.message);
        }
        ok('una ordre que no coneix fa fallar la prova', peta);
        eq('l’avaluador de la prova: 3 + 4 · 2 = 11', textQ(avalua('3+4*2')), '11');
        eq('l’avaluador de la prova: (1·3)/(2·3) + 1/3 = 5/6', textQ(avalua('((1*3)/(2*3))+((1)/(3))')), '5/6');
        eq('l’avaluador de la prova: 2x + 3 = 11 → x = 4', textQ(solucioLineal('2x+3=11')), '4');
        eq('l’avaluador de la prova: sqrt(100) = 10', textQ(avalua('sqrt(100)')), '10');
        eq('l’avaluador de la prova: a^(2) amb a = 10', textQ(avalua('a^(2)', null, { a: Q(10) })), '100');
        let noExacta = false;
        try {
            avalua('sqrt(2)');
        } catch (e) {
            noExacta = /no exacta/.test(e.message);
        }
        ok('l’avaluador de la prova: una arrel no exacta fa fallar la prova', noExacta);
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite('6. Mode «Resolució pas a pas» (mode.js)');
    {
        const A = M.pissarraActiva;
        ok('SUPORTA_PISSARRA és una llista', Array.isArray(M.SUPORTA_PISSARRA));
        eq('?pissarra=1 a una pàgina que l’admet → actiu', A('?pissarra=1', 'p', ['p']), true);
        eq('sense paràmetre → no actiu', A('', 'p', ['p']), false);
        eq('?pissarra=0 → no actiu', A('?pissarra=0', 'p', ['p']), false);
        eq('pàgina que no l’admet → no actiu', A('?pissarra=1', 'q', ['p']), false);
        eq('URL buida o null no peta', A(null, 'p', ['p']), false);
        eq('URL plena de soroll no peta', A('?%%%&&=&pissarra', 'p', ['p']), false);
        eq('a la pàgina de prova, el mode no és actiu', M.PISSARRA_ACTIVA, false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tots els guions que pot veure un alumne. Cada activitat que tingui
    // «Resolució pas a pas» hi afegirà els seus (amb molts exercicis i un model).
    // valor: què ha de valdre cada fila (expressió) o quina solució té (equació).
    // Una demo amb detall a demanda hi és dues vegades: tancada i amb tot el detall.
    const GUIONS = DEMOS.flatMap(d => {
        const veritat = {
            prioritat: { expressio: Q(11) },
            equacio: { equacio: Q(4) },
            fraccions: { expressio: Q(5, 6) },
            pitagores: { valors: { a: Q(10), b: Q(6), c: Q(8) } },
            parentesis: { equacio: Q(4) },
        }[d.id];
        const guions = [{ nom: `demo ${d.id}`, files: d.files, passos: d.passos(), veritat }];
        if (d.detall) {
            const oberts = new Set(
                d
                    .passos()
                    .filter(p => p.teDetall)
                    .map(p => p.id)
            );
            guions.push({ nom: `demo ${d.id} (tot el detall)`, files: d.files, passos: d.passos({ oberts }), veritat });
        }
        return guions;
    });

    suite(`7. Regles de tots els guions (${GUIONS.length} guions)`);
    {
        // Primera persona del plural: els textos van en segona persona del singular
        const PLURAL =
            /\b(calculem|fem|tenim|sabem|volem|esborrem|passem|sumem|restem|multipliquem|dividim|resolem|obtenim|busquem|escrivim|apliquem|substituïm)\b/i;
        let errorsKatex = [],
            plural = [],
            guions = [],
            finals = [];
        for (const g of GUIONS) {
            guions.push(...C.comprovaGuio(g.passos, g.files, g.nom));
            g.passos.forEach((pas, i) => {
                if (PLURAL.test(pas.text)) plural.push(`${g.nom}, pas ${i + 1}: «${pas.text}»`);
                const formules = [
                    ...pas.files.filter(t => t && !t.startsWith('§') && !t.startsWith('<svg')),
                    ...[...pas.text.matchAll(/\$([^$]+)\$/g)].map(m => m[1]),
                ];
                for (const tex of formules) {
                    const html = katex.renderToString(tex, {
                        throwOnError: false,
                        strict: 'ignore',
                        trust: c => c.command === '\\htmlData',
                    });
                    if (/katex-error/.test(html)) errorsKatex.push(`${g.nom}, pas ${i + 1}: ${tex}`);
                }
            });
            const ultim = g.passos[g.passos.length - 1];
            if (!ultim.classes.includes('final')) finals.push(g.nom);
        }
        ok('cada guió passa la revisió estructural', !guions.length, guions.join('\n      → '));
        ok('KaTeX dibuixa totes les fórmules sense errors', !errorsKatex.length, errorsKatex.join('\n      → '));
        ok(
            'els textos són en segona persona (cap «calculem», «fem», «tenim»…)',
            !plural.length,
            plural.join('\n      → ')
        );
        ok('l’últim pas de cada guió té el resultat ressaltat (classe «final»)', !finals.length, finals.join(', '));
    }

    suite('8. Veritat de cada línia dels guions');
    {
        const falses = [];
        let linies = 0;
        for (const g of GUIONS) {
            g.passos.forEach((pas, i) => {
                pas.files.forEach((tex, j) => {
                    if (!tex || tex.startsWith('§') || tex.startsWith('<svg')) return;
                    linies++;
                    const on = `${g.nom}, pas ${i + 1}, fila ${j + 1}`;
                    try {
                        const pla = C.textPla(tex).replace(/=$/, ''); // «3 + 8 =»: la línia continua a sota
                        if (g.veritat.valors) {
                            // Una cadena d'igualtats amb lletres que tenen valor: tots els membres valen igual
                            const membres = pla.split('=').map(m => avalua(m, null, g.veritat.valors));
                            if (membres.some(m => !igualQ(m, membres[0])))
                                falses.push(`${on}: ${pla} no és cert amb ${JSON.stringify(g.veritat.valors)}`);
                        } else if (g.veritat.expressio) {
                            const v = avalua(pla);
                            if (!igualQ(v, g.veritat.expressio))
                                falses.push(`${on}: ${pla} val ${textQ(v)}, no ${textQ(g.veritat.expressio)}`);
                        } else {
                            const s = solucioLineal(pla);
                            if (!s || !igualQ(s, g.veritat.equacio))
                                falses.push(
                                    `${on}: ${pla} té solució ${s ? textQ(s) : 'cap'}, no ${textQ(g.veritat.equacio)}`
                                );
                        }
                    } catch (e) {
                        falses.push(`${on}: ${e.message}`);
                    }
                });
            });
        }
        ok(`les ${linies} línies que es veuen són certes`, linies > 0 && !falses.length, falses.join('\n      → '));
    }

    // ─────────────────────────────────────────────────────────────────────────
    suite("9. Prioritat d'operacions amb la pissarra (?pissarra=1)");
    {
        // Preguntes repetibles: Math.random amb llavor (Mulberry32) abans de generar-les
        let llavor = 20261027;
        Math.random = () => {
            llavor |= 0;
            llavor = (llavor + 0x6d2b79f5) | 0;
            let t = Math.imul(llavor ^ (llavor >>> 15), 1 | llavor);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        const { MathEngine: ME } = await importa('js/prioritat/math-engine.js');
        const { Renderer: R } = await importa('js/prioritat/renderer.js');
        const { SUPORTA_PISSARRA } = M;
        ok('prioritat és a SUPORTA_PISSARRA', SUPORTA_PISSARRA.includes('prioritat'));

        // El text pla de cada línia de la taula (per calcular-la): − → -, · → *, x<sup>e</sup> → x^e
        const liniesDeTaula = html =>
            [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m =>
                m[1]
                    .replace(/<td class="(igual|nota-pas)[^"]*">[\s\S]*?<\/td>/g, '')
                    .replace(/<sup>/g, '^')
                    .replace(/<[^>]+>/g, '')
                    .replace(/−/g, '-')
                    .replace(/·/g, '*')
                    .replace(/\s+/g, '')
            );
        const senseClaus = html => html.replace(/<span data-k="[^"]*">((?:(?!<\/?span)[\s\S])*?)<\/span>/g, '$1');

        let exercicis = 0,
            animacions = 0;
        const dolents = [],
            falses = [],
            fonts = [],
            diferents = [];
        for (let k = 0; k < 800; k++) {
            const ex = ME.generateExercise(k % ME.LEVELS.length);
            exercicis++;
            const llibre = ME.solve(ME.startLine(ex.toks)); // [{ line, op }], la resolució «de llibre»
            // L'alumne fa el pas j: A = línies 0..j-1 (l'última amb l'operació triada, sense botons),
            // B = línies 0..j (la nova és la de treball, amb botons si encara no s'ha acabat)
            for (let j = 1; j < llibre.length; j++) {
                const filesA = llibre.slice(0, j).map((r, i) => ({ line: r.line, op: r.op }));
                const filesB = llibre.slice(0, j + 1).map((r, i) => ({ line: r.line, op: i < j ? r.op : -1 }));
                const fet = ME.isDone(filesB[j].line);
                const A = R.tableHtml(filesA, { active: false, claus: true });
                const B = R.tableHtml(filesB, { active: !fet, claus: true });
                const fusiona = R.fusioUltimaLinia(filesB);
                const copia = R.copiesUltimaLinia(filesB);
                const passos = [
                    { files: [A], classes: [''], text: 'A.' },
                    { files: [B], classes: [''], text: 'B.', fusiona, copia },
                ];
                animacions++;
                const errors = C.comprovaGuio(passos, 1, `exercici ${k}, pas ${j}`);
                if (errors.length && dolents.length < 5) dolents.push(...errors);
                const n = Object.values(fusiona).flat().length;
                if (![1, 3, 5].includes(n) && fonts.length < 5) fonts.push(`exercici ${k}, pas ${j}: ${n} símbols`);
                if (senseClaus(B) !== R.tableHtml(filesB, { active: !fet }) && diferents.length < 3)
                    diferents.push(`exercici ${k}, pas ${j}`);
                liniesDeTaula(B).forEach((text, i) => {
                    try {
                        const v = avalua(text);
                        if (!igualQ(v, Q(ex.val)) && falses.length < 5)
                            falses.push(`exercici ${k}, línia ${i + 1}: ${text} val ${textQ(v)}, no ${ex.val}`);
                    } catch (e) {
                        if (falses.length < 5) falses.push(`exercici ${k}, línia ${i + 1}: ${text}: ${e.message}`);
                    }
                });
            }
        }
        ok(
            `${animacions} animacions de ${exercicis} expressions passen la revisió dels guions`,
            animacions > 2000 && !dolents.length,
            dolents.join('\n      → ')
        );
        ok(
            'a cada pas només baixen els símbols de l’operació: 1 (potència), 3 (a, signe, b) o 5 (amb els parèntesis)',
            !fonts.length,
            fonts.join('\n      → ')
        );
        ok('cada línia de cada taula val el resultat de l’expressió', !falses.length, falses.join('\n      → '));
        ok(
            'amb les claus, la taula és la de sempre (només hi afegeix <span data-k>)',
            !diferents.length,
            diferents.join(', ')
        );
        // Les marques de l'esvaïment (exemple, ajuda) també porten clau
        const ex = ME.generateExercise(5);
        const llibre = ME.solve(ME.startLine(ex.toks));
        const ambNota = llibre
            .slice(0, 2)
            .map((r, i) => ({ line: r.line, op: i ? -1 : r.op, marca: i ? 'exemple' : '' }));
        const html = R.tableHtml(ambNota, { claus: true });
        ok('el «=» i la nota d’un exemple resolt porten clau', /data-k="e0"/.test(html) && /data-k="n1"/.test(html));
        eq('sense línia nova, cap fusió', JSON.stringify(R.fusioUltimaLinia(llibre.slice(0, 1))), '{}');
    }

    finish('RESOLUCIÓ PAS A PAS (PISSARRA)');
})();
