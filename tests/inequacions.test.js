/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/inequacions.test.js
 * ROL: Tests d'«Inequacions» (js/inequacions/: math-engine.js, errors.js) i de la recta
 *      comuna (js/passos/recta-intervals.js).
 * ARQUITECTURA:
 * - 1. Centenars d'inequacions de cada nivell: un model propi (la inequació de l'enunciat,
 *   calculada amb nombres a banda i banda de la solució) diu que la solució és la bona;
 *   cada pas accepta la seva resposta; cada distractor és un error i el diagnòstic en
 *   reconeix el codi; la recta i l'interval diuen el mateix que la solució; KaTeX dibuixa
 *   totes les fórmules; surten tots els errors.
 * - 2. Els nivells (decisions del David, 17/11/2026): 1 coeficient positiu, 2 negatiu,
 *   3 parèntesis, 4 denominadors; solucions enteres als nivells 1 i 2 i, als 3 i 4, una
 *   fracció amb probabilitat 1/3; sense «sense solució» ni «tots els nombres».
 * - 3. La recta comuna: un SVG amb les marques, el punt ple o buit i la semirecta; la
 *   correcció del camp 'recta' (incomplet, avís i bona).
 * - 4. La «Resolució pas a pas» (js/inequacions/resolucio.js, decisió 22 del David, C1–C7):
 *   la bateria comuna (tests/pissarra-activitat.js) amb milers d'inequacions dels quatre
 *   nivells, tancades i amb tot el detall: cada línia que es veu té la mateixa solució
 *   (aritmètica exacta, a banda i banda de la solució i a la solució mateixa), la recta i
 *   l'interval diuen el mateix; en dividir per un negatiu, «el signe de desigualtat canvia»
 *   (mai «es gira») i el signe es ressalta; 4 > x → x < 4 és un pas propi; KaTeX dibuixa
 *   tot; l'activitat hi enllaça.
 * ÚS: node tests/inequacions.test.js
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
        'js/passos/recta-intervals.js',
        'js/inequacions/strings.js',
        'js/inequacions/math-engine.js',
        'js/inequacions/errors.js',
    ],
    { seed: 20261117 }
);
const { generaPreguntaIQ, corregeixPas, diagnosticaIQ, ERRORS_IQ, svgRecta, textRespostaIQ } = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));
const num = v => (Array.isArray(v) ? v[0] / v[1] : v);
const COMPLEIX = { lt: (a, b) => a < b, gt: (a, b) => a > b, le: (a, b) => a <= b, ge: (a, b) => a >= b };

/** El model: els dos membres de la inequació de l'enunciat, com a funcions de x. */
function membres(q) {
    const d = q.dades;
    if (q.dades.nivell <= 2) {
        const mx = x => d.a * x + d.b;
        return d.dreta ? [() => d.c, mx] : [mx, () => d.c];
    }
    if (q.dades.nivell === 3) return [x => d.p * (x + d.q), x => d.r * x + d.t];
    return [x => (x + d.a) / d.m + (d.mes ? 1 : -1) * (x / d.n), () => d.c];
}

/** La resposta bona d'un pas, com l'escriuria l'alumne. */
function bona(pas) {
    const r = {};
    for (const [c, t] of Object.entries(pas.camps)) {
        const s = pas.solucio[c];
        if (t === 'racional')
            r[c] = { n: String(Array.isArray(s) ? s[0] : s), d: Array.isArray(s) ? String(s[1]) : '' };
        else if (t === 'enter') r[c] = String(s);
        else r[c] = s;
    }
    return r;
}
const escrit = (pas, c, v) =>
    pas.camps[c] === 'racional'
        ? { n: String(Array.isArray(v) ? v[0] : v), d: Array.isArray(v) ? String(v[1]) : '' }
        : pas.camps[c] === 'enter'
          ? String(v)
          : v;

suite('1. Centenars d’inequacions de cada nivell');
{
    const dolents = { model: [], bona: [], errors: [], recta: [], interval: [], katex: [], text: [] };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const vistos = new Set();
    let n = 0;
    for (const nivell of [1, 2, 3, 4])
        for (let k = 0; k < 400; k++) {
            n++;
            const q = generaPreguntaIQ(nivell);
            const on = `nivell ${nivell}: ${q.tex}`;
            const sol = num(q.dades.sol);
            const [e, d] = membres(q);
            // El model: a banda i banda de la solució, l'enunciat es compleix si i només si x ⊙ sol
            for (const dx of [-3, -1.5, -0.25, 0.25, 1.5, 3]) {
                const x = sol + dx;
                if (COMPLEIX[q.dades.s](e(x), d(x)) !== COMPLEIX[q.dades.signe](x, sol))
                    anota(dolents.model, `${on}: amb x = ${x} no quadra amb x ${q.dades.signe} ${sol}`);
            }
            if (Math.abs(e(sol) - d(sol)) > 1e-9) anota(dolents.model, `${on}: a x = ${sol} els membres no són iguals`);
            for (const pas of q.passos) {
                const r = corregeixPas(pas, bona(pas));
                if (r.estat !== 'ok') anota(dolents.bona, `${on}, ${pas.id}: ${JSON.stringify(r)}`);
                for (const [c, dist] of Object.entries(pas.dades.distractors || {}))
                    for (const [v, codi] of dist) {
                        vistos.add(codi);
                        const r2 = corregeixPas(pas, { ...bona(pas), [c]: escrit(pas, c, v) });
                        const dg = r2.estat === 'error' ? diagnosticaIQ(pas, r2.valors) : null;
                        if (!dg || dg.errorType !== codi || !ERRORS_IQ[codi])
                            anota(
                                dolents.errors,
                                `${on}, ${pas.id}.${c} = ${JSON.stringify(v)}: ${r2.estat} (${codi})`
                            );
                    }
                for (const t of [pas.linia, ...pas.plantilla.filter(p => p.tex).map(p => p.tex)].filter(Boolean))
                    if (k % 10 === 0 && !katexOk(t)) anota(dolents.katex, `${on}, ${pas.id}: ${t}`);
                for (const f of pas.fitxes || [])
                    if (k % 10 === 0 && !katexOk(f.tex)) anota(dolents.katex, `${on}: ${f.tex}`);
                if (/undefined|NaN|\[object/.test(pas.enunciat + pas.linia)) anota(dolents.text, `${on}, ${pas.id}`);
            }
            if (k % 10 === 0 && !katexOk(q.tex)) anota(dolents.katex, `${on}: enunciat`);
            // La recta: el punt al nombre de la solució, ple amb ≤ i ≥, cap al costat del signe
            const recta = q.passos.find(p => p.mena === 'recta');
            const rs = recta.solucio.rc;
            const marca = recta.plantilla[0].recta.marques[rs.i];
            const s = q.dades.signe;
            if (
                Math.abs(marca.v - sol) > 1e-9 ||
                rs.ple !== (s === 'le' || s === 'ge') ||
                rs.costat !== (s === 'lt' || s === 'le' ? 'esq' : 'dre') ||
                recta.plantilla[0].recta.marques.filter(m => Number.isInteger(m.v)).length < 10
            )
                anota(dolents.recta, `${on}: ${JSON.stringify(rs)} a ${marca.text}`);
            // Una resposta de recta equivocada té el seu diagnòstic (punt, costat, nombre)
            for (const [canvi, codi] of [
                [{ ple: !rs.ple }, rs.ple ? 'PUNT_BUIT' : 'PUNT_PLE'],
                [{ costat: rs.costat === 'esq' ? 'dre' : 'esq' }, 'COSTAT'],
                [{ i: rs.i === 0 ? 1 : rs.i - 1 }, 'VALOR_RECTA'],
            ]) {
                vistos.add(codi);
                const r3 = corregeixPas(recta, { rc: { ...rs, ...canvi } });
                const dg = r3.estat === 'error' ? diagnosticaIQ(recta, r3.valors) : null;
                if (!dg || dg.errorType !== codi)
                    anota(dolents.recta, `${on}: ${JSON.stringify(canvi)} → ${dg && dg.errorType}`);
            }
            // L'interval: el nombre de la solució a l'extrem, cap al costat del signe, claudàtor si hi entra
            const iv = q.passos.find(p => p.mena === 'interval');
            const peca = id => iv.fitxes.find(f => f.id === id).tex;
            const text = ['o', 'e1', 'e2', 't'].map(c => peca(iv.solucio[c])).join(' ');
            const esq = s === 'lt' || s === 'le';
            const tancat = s === 'le' || s === 'ge';
            const esperat = esq
                ? `( -\\infty ${peca('n')} ${tancat ? ']' : ')'}`
                : `${tancat ? '[' : '('} ${peca('n')} +\\infty )`;
            if (text !== esperat || !textRespostaIQ(iv, iv.solucio)) anota(dolents.interval, `${on}: ${text}`);
        }
    const msg = l => l.join('\n      → ');
    ok(
        `${n} inequacions: el model (l’enunciat amb nombres) confirma cada solució`,
        !dolents.model.length,
        msg(dolents.model)
    );
    ok('cada pas accepta la resposta bona', !dolents.bona.length, msg(dolents.bona));
    ok('cada distractor és un error i el diagnòstic en reconeix el codi', !dolents.errors.length, msg(dolents.errors));
    ok(
        'la recta: el punt, ple o buit, i el costat de la solució; cada error es reconeix',
        !dolents.recta.length,
        msg(dolents.recta)
    );
    ok('l’interval: extrem, costat i claudàtor o parèntesi', !dolents.interval.length, msg(dolents.interval));
    ok('KaTeX dibuixa totes les fórmules, les plantilles i les peces', !dolents.katex.length, msg(dolents.katex));
    ok('cap text estrany', !dolents.text.length, msg(dolents.text));
    eq('surten tots els errors', [...vistos].sort().join(' '), Object.keys(ERRORS_IQ).sort().join(' '));
}

suite('2. Els nivells i les decisions del David');
{
    const comptes = { 1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0] };
    const dolents = [];
    for (const nivell of [1, 2, 3, 4])
        for (let k = 0; k < 600; k++) {
            const q = generaPreguntaIQ(nivell);
            const fraccio = Array.isArray(q.dades.sol);
            comptes[nivell][fraccio ? 1 : 0]++;
            const ids = q.passos.map(p => p.mena).join(',');
            if (nivell === 1 && !(q.dades.a > 0)) dolents.push(`nivell 1 amb a = ${q.dades.a}`);
            if (nivell === 2 && !(q.dades.a < 0)) dolents.push(`nivell 2 amb a = ${q.dades.a}`);
            if (nivell === 3 && !/\\left\(/.test(q.tex)) dolents.push(`nivell 3 sense parèntesi: ${q.tex}`);
            if (nivell === 4 && !/\\dfrac/.test(q.tex)) dolents.push(`nivell 4 sense denominadors: ${q.tex}`);
            if (!/recta,interval$/.test(ids)) dolents.push(`${q.tex}: ${ids}`);
        }
    ok(
        'cada nivell té el seu tipus d’inequació i acaba amb la recta i l’interval',
        !dolents.length,
        dolents.slice(0, 5).join('\n      → ')
    );
    ok('als nivells 1 i 2, la solució sempre és entera', comptes[1][1] === 0 && comptes[2][1] === 0);
    const p3 = comptes[3][1] / 600;
    const p4 = comptes[4][1] / 600;
    ok(
        `als nivells 3 i 4, una fracció amb probabilitat 1/3 (${p3.toFixed(2)} i ${p4.toFixed(2)})`,
        p3 > 0.25 && p3 < 0.42 && p4 > 0.25 && p4 < 0.42
    );
    const html = fs.readFileSync(path.join(ROOT, 'inequacions.html'), 'utf8');
    ok(
        'la pàgina: tema d’àlgebra, el controlador i amb codi de verificació',
        /tema-algebra/.test(html) && /js\/inequacions\/inequacions\.js/.test(html) && !/senseCodi/.test(html)
    );
    ok(
        'codi d’exercici IQ',
        /'inequacions': 'IQ'/.test(fs.readFileSync(path.join(ROOT, 'js/exercise-codes.js'), 'utf8'))
    );
}

suite('3. La recta comuna (js/passos/recta-intervals.js) i el camp «recta»');
{
    const marques = [-2, -1, 0, 1, 2]
        .map(v => ({ v, text: String(v) }))
        .concat([{ v: 0.5, text: '1/2' }])
        .sort((a, b) => a.v - b.v);
    const svg = svgRecta({ marques, punt: { i: 3, ple: false }, costat: 'dre', interactiva: true });
    ok(
        'l’SVG porta les marques, el punt buit, la semirecta i les zones per tocar',
        /jp-r-buit/.test(svg) &&
            /jp-r-raig/.test(svg) &&
            (svg.match(/jp-r-toc/g) || []).length === 6 &&
            /1\/2/.test(svg)
    );
    const pas = { camps: { rc: 'recta' }, solucio: { rc: { i: 3, ple: true, costat: 'esq' } } };
    eq(
        'sense tocar cap marca: incomplet',
        corregeixPas(pas, { rc: { i: null, ple: null, costat: null } }).estat,
        'incomplet'
    );
    eq(
        'sense dir si hi entra o el costat: avís (no resta intents)',
        corregeixPas(pas, { rc: { i: 3, ple: null, costat: 'esq' } }).estat,
        'avis'
    );
    eq('la bona', corregeixPas(pas, { rc: { i: 3, ple: true, costat: 'esq' } }).estat, 'ok');
    eq('el costat equivocat és un error', corregeixPas(pas, { rc: { i: 3, ple: true, costat: 'dre' } }).estat, 'error');
}

suite('4. Resolució pas a pas (resolucio.html?activitat=inequacions): la pissarra');
{
    const { provaActivitat } = require('./pissarra-activitat');
    const p = loadModule(
        [
            'js/utils.js',
            'js/algebra/racionals.js',
            'js/passos/recta-intervals.js',
            'js/inequacions/strings.js',
            'js/inequacions/math-engine.js',
            'js/equacions/math-engine.js',
            'js/pissarra/formules.js',
            'js/pissarra/comprova.js',
            'js/equacions/resolucio.js',
            'js/inequacions/resolucio.js',
        ],
        { seed: 20261124 }
    );
    const R = p.ResolucioIQ;
    const { textPla } = p;

    // Aritmètica exacta (fraccions amb BigInt), independent del codi que es prova
    const gcd = (a, b) => {
        a = a < 0n ? -a : a;
        b = b < 0n ? -b : b;
        while (b) [a, b] = [b, a % b];
        return a;
    };
    const Q = (n, d = 1n) => {
        n = BigInt(n);
        d = BigInt(d);
        if (d === 0n) throw new Error('divisió per 0');
        if (d < 0n) [n, d] = [-n, -d];
        const g = gcd(n, d) || 1n;
        return { n: n / g, d: d / g };
    };
    const suma = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
    const resta = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
    const prod = (a, b) => Q(a.n * b.n, a.d * b.d);
    const quoc = (a, b) => Q(a.n * b.d, a.d * b.n);
    const cmp = (a, b) => {
        const v = a.n * b.d - b.n * a.d;
        return v < 0n ? -1 : v > 0n ? 1 : 0;
    };
    /** Un membre en text pla («12*((x+2)/(6))-3x», «-x:(-1)»), amb x = un valor exacte. */
    function avalua(text, x) {
        let i = 0;
        function primari() {
            if (text[i] === '(') {
                i++;
                const v = expressio();
                if (text[i] !== ')') throw new Error(`falta «)» a ${text}`);
                i++;
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
                if (text[i] === '*') v = (i++, prod(v, primari()));
                else if (text[i] === ':') v = (i++, quoc(v, primari()));
                else if (text[i] === '/') v = (i++, quoc(v, primari()));
                else if (text[i] === '(' || text[i] === 'x') v = prod(v, primari());
                else return v;
            }
        }
        function expressio() {
            let v = text[i] === '-' ? (i++, prod(Q(-1), terme())) : terme();
            while (text[i] === '+' || text[i] === '-') {
                const c = text[i++];
                const w2 = terme();
                v = c === '+' ? suma(v, w2) : resta(v, w2);
            }
            return v;
        }
        const v = expressio();
        if (i !== text.length) throw new Error(`sobra «${text.slice(i)}» a ${text}`);
        return v;
    }
    const COMPARA = { '<': c => c < 0, '>': c => c > 0, '≤': c => c <= 0, '≥': c => c >= 0 };
    const SIGNE_TEXT = { lt: '<', gt: '>', le: '≤', ge: '≥' };
    const solQ = d => (Array.isArray(d.sol) ? Q(d.sol[0], d.sol[1]) : Q(d.sol));
    /** Els punts de prova: la solució i un a cada banda. */
    const proves = d => [resta(solQ(d), Q(1)), solQ(d), suma(solQ(d), Q(1))];
    const certaFinal = (d, x) => COMPARA[SIGNE_TEXT[d.signe]](cmp(x, solQ(d)));
    /** Què ha de dir l'interval: x ∈ (−∞, s) o similars. */
    const intervalBo = d => {
        const esq = d.signe === 'lt' || d.signe === 'le';
        const tancat = d.signe === 'le' || d.signe === 'ge';
        return { esq, tancat };
    };

    /** Una línia és certa si, a la solució i a banda i banda, és certa on ho és la solució final. */
    function veritat(fila, ex) {
        const d = ex.dades;
        const pla = textPla(fila);
        try {
            const m = /^x∈([[(])(.+),(.+)([\])])$/.exec(pla);
            if (m) {
                const { esq, tancat } = intervalBo(d);
                const [, o, e1, e2, t] = m;
                const fi = esq ? e2 : e1;
                const inf = esq ? e1 : e2;
                const okFi = cmp(avalua(fi, Q(0)), solQ(d)) === 0;
                const okInf = inf === (esq ? '-∞' : '+∞');
                const okVores = esq ? o === '(' && t === (tancat ? ']' : ')') : t === ')' && o === (tancat ? '[' : '(');
                return okFi && okInf && okVores
                    ? ''
                    : `${pla}: l'interval no és el de x ${SIGNE_TEXT[d.signe]} ${d.sol}`;
            }
            const r = /^(.*?)([<>≤≥])(.*)$/.exec(pla);
            if (!r) return `${pla}: no és una inequació`;
            const [, esq, signe, dre] = r;
            for (const x of proves(d)) {
                const c = cmp(resta(avalua(esq, x), avalua(dre, x)), Q(0));
                if (COMPARA[signe](c) !== certaFinal(d, x))
                    return `${pla}: a x = ${x.n}/${x.d} no coincideix amb x ${SIGNE_TEXT[d.signe]} ${JSON.stringify(d.sol)}`;
            }
            return '';
        } catch (e) {
            return `${pla}: ${e.message}`;
        }
    }

    const dolents = { katex: [], plurals: [], gira: [], negatiu: [], mirall: [], recta: [], final: [], nivell4: [] };
    const anota = (l, t) => l.length < 5 && l.push(t);
    const PLURAL = /\b(calculem|fem|tenim|sabem|passem|sumem|restem|dividim|multipliquem|aïllem|resolem)\b/i;
    const revisaKatex = (passos, on) => {
        const formules = new Set();
        for (const ps of passos) {
            ps.files.filter(f => f && !f.startsWith('<svg')).forEach(f => formules.add(f));
            for (const m of ps.text.matchAll(/\$([^$]+)\$/g)) formules.add(m[1]);
            if (PLURAL.test(ps.text)) anota(dolents.plurals, `${on}: «${ps.text}»`);
            if (/gira/.test(ps.text)) anota(dolents.gira, `${on}: «${ps.text}»`);
        }
        for (const f of formules) {
            const html = katex.renderToString(f, {
                throwOnError: false,
                strict: 'ignore',
                trust: c => c.command === '\\htmlData',
            });
            if (/katex-error/.test(html)) anota(dolents.katex, `${on}: ${f}`);
        }
    };
    let ambMirall = 0,
        ambNegatiu = 0,
        ambFraccio = 0;
    function* exercicis() {
        for (const nivell of R.NIVELLS)
            for (let k = 0; k < 400; k++) {
                const ex = R.exercici(nivell);
                const d = ex.dades;
                const on = `nivell ${nivell}, ${ex.tex}`;
                const passos = R.passos(ex);
                const vista = ({ oberts }) => R.passos(ex, { oberts });
                const ultim = passos[passos.length - 1];
                if (k < 40) {
                    revisaKatex(passos, on);
                    revisaKatex(
                        vista({ oberts: new Set(passos.filter(x => x.teDetall).map(x => x.id)) }),
                        `${on} (detall)`
                    );
                }
                // Dividir per un negatiu: la frase i el signe ressaltat
                const aillar = passos.find(x => /^Aïlla la x/.test(x.text));
                const negatiu = / entre \$-/.test(aillar ? aillar.text : '');
                if (negatiu) ambNegatiu++;
                if (aillar) {
                    const canvia = /el signe de desigualtat canvia/.test(aillar.text);
                    const fila = aillar.files.filter(Boolean)[passos.indexOf(aillar)];
                    const ressaltat = /marca=tria/.test(aillar.files.join(''));
                    if (canvia !== negatiu || ressaltat !== negatiu)
                        anota(dolents.negatiu, `${on}: «${aillar.text}» ${fila || ''}`);
                }
                // 4 > x → x < 4: un pas propi, amb el signe ressaltat
                if (d.dreta) {
                    ambMirall++;
                    const gir = passos.find(x => /^Escriu-la amb la x a l'esquerra/.test(x.text));
                    if (!gir || !/canvia/.test(gir.text)) anota(dolents.mirall, on);
                }
                if (Array.isArray(d.sol)) ambFraccio++;
                // La recta: el punt ple si hi entra; el nombre de la solució hi vola (data-k)
                const svg = ultim.files.find(f => f.startsWith('<svg')) || '';
                const ple = d.signe === 'le' || d.signe === 'ge';
                if (!svg || /jp-r-ple/.test(svg) !== ple || !/data-k="/.test(svg)) anota(dolents.recta, on);
                if (!ultim.classes.some(c => /final/.test(c))) anota(dolents.final, on);
                if (nivell === 4 && !/^Treu els denominadors/.test(passos[1].text)) anota(dolents.nivell4, on);
                yield {
                    on,
                    passos,
                    vista,
                    files: R.files(ex),
                    dades: d,
                };
            }
    }
    provaActivitat('inequacions', {
        exercicis: exercicis(),
        eines: p,
        text: true,
        linies: fila => (fila && !fila.startsWith('<svg') ? [fila] : []),
        veritat,
        maxPeces: 12,
        minExercicis: 1600,
    });
    const llista = l => l.join('\n      → ');
    ok('KaTeX dibuixa totes les files i les fórmules de les frases', !dolents.katex.length, llista(dolents.katex));
    ok('les frases són en segona persona', !dolents.plurals.length, llista(dolents.plurals));
    ok('mai «es gira» (el David: «el signe de desigualtat canvia»)', !dolents.gira.length, llista(dolents.gira));
    ok(
        `dividir per un negatiu (${ambNegatiu}): «el signe de desigualtat canvia» i el signe ressaltat; si no, res`,
        ambNegatiu > 100 && !dolents.negatiu.length,
        llista(dolents.negatiu)
    );
    ok(
        `amb la x a la dreta (${ambMirall}): «x < 4» és un pas propi`,
        ambMirall > 50 && !dolents.mirall.length,
        llista(dolents.mirall)
    );
    ok(`hi ha solucions fraccionàries (${ambFraccio})`, ambFraccio > 50);
    ok('la recta: el punt ple quan hi entra, i el nombre hi vola', !dolents.recta.length, llista(dolents.recta));
    ok('l’última línia (l’interval) és ressaltada', !dolents.final.length, llista(dolents.final));
    ok('nivell 4: el primer pas treu els denominadors', !dolents.nivell4.length, llista(dolents.nivell4));
    ok(
        'l’activitat hi enllaça («Mira com es resol», amb el nivell)',
        /resolucio\.html\?activitat=inequacions&nivell=\$\{nivell\}/.test(
            fs.readFileSync(path.join(ROOT, 'js/inequacions/inequacions.js'), 'utf8')
        )
    );
}

finish('TESTS D’INEQUACIONS');
