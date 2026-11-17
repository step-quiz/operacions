/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/potencies.test.js
 * ROL: Tests dels reptes 4 i 5 de «Potències» (js/potencies/reptes-nous.js,
 *      lliurament 15 del full de ruta): exponent zero i negatiu, i operacions en
 *      notació científica (× i :).
 * ARQUITECTURA:
 * - 1. Repte 4: milers d'exercicis. L'expressió es torna a llegir del text (7⁰,
 *   2⁻³, (2/3)⁻², a³ : a⁵, 2⁻³ · 2⁵, (3⁻²)³) i aquí es calcula, amb enters exactes
 *   (BigInt), la solució de cada pas: l'opció bona (com s'escriu amb exponent
 *   positiu, quina operació es fa amb els exponents), la fracció i l'exponent.
 * - 2. Repte 5: milers d'operacions; el valor exacte de l'expressió es calcula aquí, i
 *   les mantisses, els exponents i el resultat (mantissa entre 1 i 10) han de
 *   quadrar-hi.
 * - Als dos: la resposta bona s'accepta escrita com ho faria l'alumne (amb «−» o «-»,
 *   amb coma); cada opció dolenta i cada valor equivocat dona el seu error, amb el
 *   seu missatge; els avisos (fracció sense simplificar, punt decimal, notació sense
 *   ajustar) no són errors; textos sense undefined/NaN.
 * - 3. La pàgina: les targetes dels reptes 4 i 5, el controlador, el teclat (la coma a
 *   les caselles de decimals) i les caselles que es buiden després d'un error.
 * ÚS: node tests/potencies.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');

const w = loadModule(['js/utils.js', 'js/algebra/racionals.js', 'js/potencies/reptes-nous.js'], { seed: 20261117 });
const { generaRepte4, generaRepte5, comprova } = w;
const BAD = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b/;

// ── Llegir exponents i nombres ───────────────────────────────────────────────
const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
const RE_SUP = '⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+';
const llegeixSup = s => {
    const neg = s.startsWith('⁻');
    const n = [...s.replace('⁻', '')].reduce((v, c) => v * 10 + SUP[c], 0);
    return neg ? -n : n;
};
const supDe = n => (n < 0 ? '⁻' : '') + [...String(Math.abs(n))].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('');
// Fraccions exactes [n, d] (BigInt) i decimals amb coma
const mcd = (a, b) => (b ? mcd(b, a % b) : a < 0n ? -a : a);
const fr = (n, d = 1n) => {
    if (d < 0n) [n, d] = [-n, -d];
    const g = mcd(n, d) || 1n;
    return [n / g, d / g];
};
const F = x => (Array.isArray(x) ? fr(BigInt(x[0]), BigInt(x[1])) : fr(BigInt(x)));
const mul = (x, y) => fr(F(x)[0] * F(y)[0], F(x)[1] * F(y)[1]);
const div = (x, y) => fr(F(x)[0] * F(y)[1], F(x)[1] * F(y)[0]);
const iguals = (x, y) => F(x)[0] * F(y)[1] === F(y)[0] * F(x)[1];
const p10 = e => (e >= 0 ? [10n ** BigInt(e), 1n] : [1n, 10n ** BigInt(-e)]);
const decimal = t => {
    const [e, f = ''] = t.replace('−', '-').split(',');
    return fr(BigInt(e + f), 10n ** BigInt(f.length));
};
const textDe = x => {
    // el decimal amb coma, com l'escriuria l'alumne
    const [n, d] = F(x);
    let t = 0;
    while (10n ** BigInt(t) % d !== 0n) t++;
    const s = ((n < 0n ? -n : n) * 10n ** BigInt(t)) / d;
    const c = s.toString().padStart(t + 1, '0');
    return (n < 0n ? '−' : '') + (t ? `${c.slice(0, -t)},${c.slice(-t)}` : c);
};
/** La resposta bona d'un pas, escrita com ho faria l'alumne (els negatius, amb «−» o amb «-»). */
function respostaDe(pas, valor, guionet = false) {
    const enter = n => (n < 0 ? (guionet ? '-' : '−') + -n : String(n));
    if (pas.mena === 'tria') return valor;
    if (pas.mena === 'exponent') return enter(valor);
    if (pas.mena === 'fraccio') return { num: enter(valor[0]), den: enter(valor[1]) };
    if (pas.mena === 'decimal') return textDe(valor);
    return { m: textDe(valor.m), e: enter(valor.e) };
}

/** Comprova les opcions, la resposta bona i els errors d'un pas: torna la llista de problemes. */
function revisaPas(pas, on) {
    const mals = [];
    for (const guionet of [false, true]) {
        const r = comprova(pas, respostaDe(pas, pas.solucio, guionet));
        if (r.estat !== 'ok') mals.push(`${on}, ${pas.mena}: la bona dona ${JSON.stringify(r)}`);
    }
    if (pas.mena === 'tria') {
        const valors = pas.opcions.map(o => o[0]);
        const textos = pas.opcions.map(o => o[1]);
        if (
            valors.length < 3 ||
            new Set(valors).size !== valors.length ||
            new Set(textos).size !== textos.length ||
            !valors.includes(pas.solucio) ||
            valors.some(v => v !== pas.solucio && !pas.errors.some(e => e[0] === v))
        )
            mals.push(`${on}: opcions ${textos.join(' | ')}`);
    }
    for (const [valor, codi, missatge] of pas.errors) {
        const r = comprova(pas, respostaDe(pas, valor));
        if (r.estat !== 'error' || r.codi !== codi || r.missatge !== missatge || !missatge || BAD.test(missatge))
            mals.push(`${on}, ${pas.mena}: ${JSON.stringify(valor)} → ${JSON.stringify(r)} (${codi})`);
    }
    const textos = [pas.titol, pas.resultat, pas.prefix || '', ...(pas.opcions || []).map(o => o[1])].join(' ');
    if (BAD.test(textos)) mals.push(`${on}: text estrany`);
    return mals;
}

suite('1. Repte 4: exponent zero i negatiu');
{
    const dolents = { sol: [], pas: [], text: [] };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const vistos = { tipus: new Set(), codis: new Set(), formes: new Set() };
    const N = 4000;
    for (let k = 0; k < N; k++) {
        const q = generaRepte4(k);
        const on = q.text;
        vistos.tipus.add(q.tipus);
        const bona = i => q.passos[i].opcions.find(o => o[0] === q.passos[i].solucio)[1];
        let m;
        if (/^(.+)⁰$/.test(q.text)) {
            if (q.passos.length !== 1 || bona(0) !== '1') anota(dolents.sol, `${on}: ${bona(0)}`);
        } else if ((m = new RegExp(`^(\\d+)(${RE_SUP})$`).exec(q.text))) {
            const [a, n] = [Number(m[1]), -llegeixSup(m[2])];
            if (n < 1 || bona(0) !== `1/${a}${supDe(n)}` || !iguals(q.passos[1].solucio, [1n, BigInt(a) ** BigInt(n)]))
                anota(dolents.sol, `${on}: ${bona(0)}, ${q.passos[1].solucio}`);
        } else if ((m = new RegExp(`^\\((\\d+)/(\\d+)\\)(${RE_SUP})$`).exec(q.text))) {
            const [p, r, n] = [BigInt(m[1]), BigInt(m[2]), -llegeixSup(m[3])];
            const solucio = [r ** BigInt(n), p ** BigInt(n)];
            if (bona(0) !== `(${r}/${p})${supDe(n)}` || !iguals(q.passos[1].solucio, solucio))
                anota(dolents.sol, `${on}: ${bona(0)}, ${q.passos[1].solucio}`);
        } else if (
            (m = new RegExp(`^(\\w+)(${RE_SUP}) ([:·]) (\\w+)(${RE_SUP})$`).exec(q.text)) ||
            (m = new RegExp(`^\\((\\w+)(${RE_SUP})\\)(${RE_SUP})$`).exec(q.text))
        ) {
            let base, r, op;
            if (m.length === 6) {
                if (m[1] !== m[4]) anota(dolents.sol, `${on}: bases diferents`);
                [base, op] = [m[1], m[3] === ':' ? 'Restar' : 'Sumar'];
                r = m[3] === ':' ? llegeixSup(m[2]) - llegeixSup(m[5]) : llegeixSup(m[2]) + llegeixSup(m[5]);
            } else {
                [base, op, r] = [m[1], 'Multiplicar', llegeixSup(m[2]) * llegeixSup(m[3])];
            }
            vistos.formes.add(op);
            if (bona(0) !== op || q.passos[1].solucio !== r || q.passos[1].base !== base)
                anota(dolents.sol, `${on}: ${bona(0)}, ${q.passos[1].solucio}`);
            if (r < 0 !== (q.passos.length === 3)) anota(dolents.sol, `${on}: ${q.passos.length} passos`);
            if (r < 0 && bona(2) !== `1/${base}${supDe(-r)}`) anota(dolents.sol, `${on}: ${bona(2)}`);
            if (r === 0 || Math.abs(r) === 1) anota(dolents.sol, `${on}: exponent ${r}`);
        } else anota(dolents.sol, `no s'entén «${on}»`);
        q.passos.forEach(pas => {
            revisaPas(pas, on).forEach(x => anota(dolents.pas, x));
            pas.errors.forEach(e => vistos.codis.add(e[1]));
        });
        if (BAD.test(q.html + q.solucioHtml + q.text) || /-\d/.test(q.text)) anota(dolents.text, on);
    }
    ok(
        `${N} exercicis: la solució de cada pas, recalculada a partir del text`,
        !dolents.sol.length,
        dolents.sol.join('\n      → ')
    );
    ok(
        'la bona s’accepta (amb «−» o «-»); les opcions, 3 o més, diferents, amb la bona; cada error, el seu missatge',
        !dolents.pas.length,
        dolents.pas.join('\n      → ')
    );
    ok('cap text estrany (i el menys és «−»)', !dolents.text.length, dolents.text.join('\n      → '));
    eq('surten els 4 tipus', [...vistos.tipus].sort().join(' '), 'fracneg neg prop zero');
    eq('i les 3 propietats', [...vistos.formes].sort().join(' '), 'Multiplicar Restar Sumar');
    eq(
        'surten tots els errors',
        [...vistos.codis].sort().join(' '),
        'EXP_SIGNES INVERS_OBLIDAT NEG_PRODUCTE NEG_SIGNE OP_EXPONENTS POTENCIA_PRODUCTE RESTA_GIRADA ZERO_BASE ZERO_ZERO'
    );
    eq(
        'el cicle d’una sessió de 8',
        [0, 1, 2, 3, 4, 5, 6, 7].map(k => generaRepte4(k).tipus).join(' '),
        'neg zero prop fracneg neg prop fracneg prop'
    );
}

suite('2. Repte 5: operacions en notació científica (× i :)');
{
    const dolents = { sol: [], pas: [], text: [] };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const vistos = { codis: new Set(), ajust: 0, sense: 0, ops: new Set() };
    const N = 4000;
    const NUM = '(\\d+(?:,\\d+)?)';
    const re = new RegExp(`^\\(${NUM} · 10(${RE_SUP})\\) ([·:]) \\(${NUM} · 10(${RE_SUP})\\)$`);
    for (let k = 0; k < N; k++) {
        const q = generaRepte5(k);
        const on = q.text;
        const m = re.exec(q.text);
        if (!m) {
            anota(dolents.sol, `no s'entén «${on}»`);
            continue;
        }
        const [m1, e1, op, m2, e2] = [decimal(m[1]), llegeixSup(m[2]), m[3], decimal(m[4]), llegeixSup(m[5])];
        vistos.ops.add(op);
        const mant = op === '·' ? mul(m1, m2) : div(m1, m2);
        const exp = op === '·' ? e1 + e2 : e1 - e2;
        const valor = mul(mant, p10(exp));
        const [p1, p2, p3] = q.passos;
        if (!iguals(p1.solucio, mant) || p2.solucio !== exp) anota(dolents.sol, `${on}: ${p1.solucio}, ${p2.solucio}`);
        // El resultat: mantissa entre 1 i 10 i el mateix valor
        const final = p3 ? p3.solucio : { m: p1.solucio, e: p2.solucio };
        const fm = F(final.m);
        if (!iguals(mul(final.m, p10(final.e)), valor) || fm[0] < fm[1] || fm[0] >= 10n * fm[1])
            anota(dolents.sol, `${on}: ${textDe(final.m)} · 10^${final.e}`);
        if (p3) vistos.ajust++;
        else vistos.sense++;
        // Avís (no és error): el resultat sense ajustar
        if (p3) {
            const r = comprova(p3, respostaDe(p3, { m: p1.solucio, e: p2.solucio }));
            if (r.estat !== 'avis') anota(dolents.pas, `${on}: sense ajustar → ${JSON.stringify(r)}`);
        }
        q.passos.forEach(pas => {
            revisaPas(pas, on).forEach(x => anota(dolents.pas, x));
            pas.errors.forEach(e => vistos.codis.add(e[1]));
        });
        if (BAD.test(q.html + q.solucioHtml + q.text) || /-\d/.test(q.text)) anota(dolents.text, on);
    }
    ok(
        `${N} operacions: mantisses, exponents i resultat, recalculats amb el valor exacte`,
        !dolents.sol.length,
        dolents.sol.join('\n      → ')
    );
    ok(
        'la bona s’accepta; cada error, el seu missatge; sense ajustar, un avís',
        !dolents.pas.length,
        dolents.pas.join('\n      → ')
    );
    ok('cap text estrany (i el menys és «−»)', !dolents.text.length, dolents.text.join('\n      → '));
    ok(`n'hi ha amb ajust (${vistos.ajust}) i sense (${vistos.sense})`, vistos.ajust > 500 && vistos.sense > 500);
    eq('productes i quocients', [...vistos.ops].sort().join(' '), ': ·');
    eq(
        'surten tots els errors',
        [...vistos.codis].sort().join(' '),
        'AJUST_SENTIT EXP_MULTIPLICA EXP_RESTA_GIRADA EXP_SUMA_DIVISIO MANTISSA_GIRADA MANTISSA_RESTA MANTISSA_SUMA'
    );
}

suite('3. Avisos i casos a mà');
{
    const fr4 = generaRepte4(0).passos[1]; // 2⁻³ i semblants: la fracció
    const [n, d] = fr4.solucio;
    eq('fracció sense simplificar: un avís', comprova(fr4, { num: String(2 * n), den: String(2 * d) }).estat, 'avis');
    eq('denominador zero: un avís', comprova(fr4, { num: '1', den: '0' }).estat, 'avis');
    eq('casella buida: un avís', comprova(fr4, { num: '', den: '8' }).estat, 'avis');
    const q5 = generaRepte5(0);
    eq(
        'punt decimal: un avís',
        comprova(
            q5.passos[0],
            textDe(q5.passos[0].solucio).replace(',', '.') + (/,/.test(textDe(q5.passos[0].solucio)) ? '' : '.0')
        ).estat,
        'avis'
    );
    eq('un valor qualsevol: error sense missatge', JSON.stringify(comprova(q5.passos[1], '999')), '{"estat":"error"}');
}

suite('4. La pàgina (potencies.html, potencies.js, el teclat)');
{
    const html = fs.readFileSync(path.join(ROOT, 'potencies.html'), 'utf8');
    const js = fs.readFileSync(path.join(ROOT, 'js/potencies/potencies.js'), 'utf8');
    const teclat = fs.readFileSync(path.join(ROOT, 'js/teclat.js'), 'utf8');
    ok(
        'les targetes dels reptes 4 i 5',
        /selectRepte\(4\)[\s\S]*Exponent zero i negatiu/.test(html) &&
            /selectRepte\(5\)[\s\S]*Operacions en notació científica/.test(html)
    );
    ok('el controlador fa servir reptes-nous.js', /from '\.\/reptes-nous\.js'/.test(js) && /passosNous\(p\)/.test(js));
    ok(
        'les caselles de decimals porten data-coma (i el teclat hi posa la coma)',
        /dataset\.coma = 'true'/.test(js) && /dataset\.coma === 'true'/.test(teclat)
    );
    ok(
        'després d’un error es buiden totes les caselles menys les bloquejades (no es mira readOnly)',
        /dataset\.locked !== 'true'\) \{\s*inp\.value = ''/.test(js)
    );
}

finish('TESTS DE POTÈNCIES (REPTES 4 I 5)');
