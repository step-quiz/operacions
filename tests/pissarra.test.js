/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/pissarra.test.js
 * ROL: Tests de la «Resolució pas a pas» (la pissarra animada, js/pissarra/).
 * ARQUITECTURA:
 * - Les parts pures es carreguen com a mòduls de debò (import() de Node):
 *   formules.js (claus, guió, files llargues), comprova.js (revisió dels guions
 *   i text pla de cada fila) i mode.js (?pissarra=1).
 * - La revisió dels guions es prova amb guions bons i amb guions dolents fets a
 *   mà: cada error ha de sortir.
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

/**
 * Valor exacte d'una expressió en text pla (la sortida de textPla): enters,
 * x (la variable, amb el valor «x»), + - * : / ^ (exponent enter), parèntesis i
 * producte implícit (2x, 3(x+1), (a)(b)).
 */
function avalua(text, x = null) {
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
        if (c === 'x') {
            i++;
            if (x === null) throw new Error(`hi ha una x a ${text}`);
            return x;
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
            } else if (c === '(' || c === 'x' || /\d/.test(c || '')) {
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
        eq(
            'linies(): «=» és una relació i «+» un operador',
            /\\mathrel\{\\htmlData\{k=L0kq\}/.test(p1.files[0]) && /\\mathbin/.test(p0.files[0]),
            true
        );
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
    const GUIONS = DEMOS.map(d => ({
        nom: `demo ${d.id}`,
        files: d.files,
        passos: d.passos(),
        veritat: {
            prioritat: { expressio: Q(11) },
            equacio: { equacio: Q(4) },
            fraccions: { expressio: Q(5, 6) },
        }[d.id],
    }));

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
                        if (g.veritat.expressio) {
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
                    .replace(/<td class="(igual|nota-pas)">[\s\S]*?<\/td>/g, '')
                    .replace(/<sup>/g, '^')
                    .replace(/<[^>]+>/g, '')
                    .replace(/−/g, '-')
                    .replace(/·/g, '*')
                    .replace(/\s+/g, '')
            );
        const senseClaus = html => html.replace(/<span data-k="[^"]*">/g, '').replace(/<\/span>/g, '');

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
