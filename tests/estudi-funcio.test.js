/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/estudi-funcio.test.js
 * ROL: Tests d'«Estudi d'una funció» (js/estudi-funcio/) i dels ginys comuns que fa
 *      servir (js/passos/taula-signes.js, js/passos/esbos-funcio.js).
 * - 1. Centenars de funcions de cada família i els 6 exercicis de PAU, contra un model
 *      independent: un avaluador propi del TeX que es veu (f, f′, f″, opcions) i derivades
 *      numèriques. La f′ i la f″ correctes ho són; cap opció falsa no ho és; els zeros i els
 *      punts fora del domini són els que diu el TeX; cada cel·la de les taules és el que diu
 *      el model (signe al punt de prova, extrem si f′ canvia de signe…); la y dels extrems i
 *      de les inflexions és f(x); 4 opcions (3 gràfiques), una sola correcta, totes diferents.
 * - 2. El diagnòstic: cada opció falsa, i errors fets a mà a les taules i als extrems, donen
 *      el seu error típic (amb missatge).
 * - 3. La taula de signes com a camp del joc de passos: llegir, avisos i correcció.
 * - 4. Mutacions: si el model s'equivoqués, els tests ho veurien.
 * - 5. La pàgina, l'índex i el codi reservat.
 * ÚS: node tests/estudi-funcio.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, finish, loadModule } = require('./harness');

const w = loadModule(
    [
        'js/utils.js',
        'js/algebra/racionals.js',
        'js/passos/taula-signes.js',
        'js/passos/correccio.js',
        'js/passos/esbos-funcio.js',
        'js/estudi-funcio/polinomis-ef.js',
        'js/estudi-funcio/strings.js',
        'js/estudi-funcio/math-engine.js',
        'js/estudi-funcio/errors.js',
    ],
    { seed: 20261121 }
);
const {
    generaPreguntaEF,
    defFuncio,

    estudiaFuncio,
    PAU_EF,

    diagnosticaEF,
    ERRORS_EF,
    corregeixPas,
    llegeixTaula,
    puntDeProva,
    htmlTaula,
    svgEsbos,
} = w;
const katex = require(path.join(ROOT, 'vendor/katex-0.16.11/katex.min.js'));
const katexOk = tex => !/katex-error|cc0000/.test(katex.renderToString(tex, { throwOnError: false, strict: 'ignore' }));

// ─────────────────────────────────────────────────────────────────────────────
// Model independent: un avaluador del TeX que escriu l'activitat
// ─────────────────────────────────────────────────────────────────────────────
function texEval(tex) {
    const src = tex
        .replace(/\\dfrac|\\tfrac/g, '\\frac')
        .replace(/\\,|\\left|\\right/g, '')
        .replace(/\s+/g, '');
    let i = 0;
    const eat = s => (src.startsWith(s, i) ? ((i += s.length), true) : false);
    const need = s => {
        if (!eat(s)) throw new Error(`s'esperava «${s}» a ${i}: ${src}`);
    };
    const group = () => {
        need('{');
        const v = expr();
        need('}');
        return v;
    };
    function atom() {
        if (eat('\\frac')) {
            const a = group();
            const b = group();
            return x => a(x) / b(x);
        }
        if (eat('\\sqrt')) {
            const a = group();
            return x => Math.sqrt(a(x));
        }
        if (eat('(')) {
            const a = expr();
            need(')');
            return a;
        }
        if (eat('x')) return x => x;
        const m = /^\d+/.exec(src.slice(i));
        if (m) {
            i += m[0].length;
            const v = Number(m[0]);
            return () => v;
        }
        throw new Error(`inesperat «${src[i]}» a ${i}: ${src}`);
    }
    function power() {
        const b = atom();
        if (eat('^')) {
            const e = group();
            return x => Math.pow(b(x), e(x));
        }
        return b;
    }
    function term() {
        let v = power();
        while (i < src.length && !'+-)}'.includes(src[i])) {
            const a = v;
            const b = power();
            v = x => a(x) * b(x);
        }
        return v;
    }
    function expr() {
        const neg = eat('-');
        const first = term();
        let v = neg ? x => -first(x) : first;
        for (;;) {
            if (eat('+')) {
                const a = v;
                const b = term();
                v = x => a(x) + b(x);
            } else if (eat('-')) {
                const a = v;
                const b = term();
                v = x => a(x) - b(x);
            } else return v;
        }
    }
    const f = expr();
    if (i !== src.length) throw new Error(`sobra text a ${i}: ${src}`);
    return f;
}
const D = (f, x, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
const D2 = (f, x, h = 1e-3) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
const prop = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const XS = [-3.37, -2.21, -1.43, -0.57, 0.33, 1.27, 1.91, 2.63, 3.49, 4.71];
/** Una opció «$x = 1$ i $x = 3$» → [1, 3] (amb √). Cap → []. */
const valorsDeConjunt = text =>
    (String(text).match(/\$x = ([^$]+)\$/g) || [])
        .map(t => texEval(t.replace(/\$x = |\$/g, ''))(0))
        .sort((a, b) => a - b);

const errors = [];
const nota = (cond, msg) => {
    if (!cond) errors.push(msg);
};

function comprovaPregunta(q, etiqueta) {
    const tF = q.tex.replace(/^f\(x\) = /, '');
    const f = texEval(tF);
    const pas = id => q.passos.find(p => p.id === id);
    const fora = [];
    // Domini: on no existeix f (el denominador del TeX val 0)
    const dom = pas('domini');
    const zerosDomTex = dom ? valorsDeConjunt(dom.opcions.find(o => o[0] === 'ok')[3]) : [];
    for (const v of zerosDomTex) {
        nota(
            !Number.isFinite(f(v)) || Math.abs(f(v)) > 1e8,
            `${etiqueta}: f existeix a x = ${v}, que el domini exclou`
        );
        fora.push(v);
    }
    for (let x = -6; x <= 6; x += 0.25)
        if (!Number.isFinite(f(x)) && !fora.some(v => Math.abs(v - x) < 1e-9))
            nota(false, `${etiqueta}: f no existeix a ${x} i el domini no ho diu`);
    const valid = x => fora.every(v => Math.abs(x - v) > 0.2);
    const xs = XS.filter(valid);

    // Totes les opcions: 4 (3 gràfiques), una correcta, diferents, KaTeX
    for (const p of q.passos.filter(p => p.mena === 'tria')) {
        const n = p.id === 'grafica' ? 3 : 4;
        nota(p.opcions.length === n, `${etiqueta} ${p.id}: ${p.opcions.length} opcions`);
        nota(p.opcions.filter(o => o[0] === 'ok').length === 1, `${etiqueta} ${p.id}: no hi ha una sola correcta`);
        nota(new Set(p.opcions.map(o => o[1])).size === p.opcions.length, `${etiqueta} ${p.id}: opcions repetides`);
        for (const o of p.opcions) {
            if (o[3]) for (const t of o[3].split('$').filter((_, k) => k % 2)) nota(katexOk(t), `KaTeX: ${t}`);
            if (o[0] !== 'ok') nota(ERRORS_EF[o[0].split('#')[0]], `${etiqueta} ${p.id}: error sense text ${o[0]}`);
        }
        if (p.linia) nota(katexOk(p.linia), `KaTeX: ${p.linia}`);
    }
    // f′ i f″: la correcta és la derivada; les falses no
    for (const [id, deriv] of [
        ['d1', x => D(f, x)],
        ['d2', x => D2(f, x)],
    ]) {
        const p = pas(id);
        for (const o of p.opcions) {
            const g = texEval(o[1]);
            const iguals = xs.every(x => prop(g(x), deriv(x), id === 'd2' ? 2e-2 : 1e-3));
            if (o[0] === 'ok') nota(iguals, `${etiqueta}: ${id} correcta no és la derivada: ${o[1]}`);
            else nota(!iguals, `${etiqueta}: ${id} falsa (${o[0]}) també és la derivada: ${o[1]}`);
        }
    }
    // Zeros de f′ i f″: la correcta els té tots i només aquests
    for (const [id, did] of [
        ['zeros1', 'd1'],
        ['zeros2', 'd2'],
    ]) {
        const g = texEval(pas(did).opcions.find(o => o[0] === 'ok')[1]);
        const p = pas(id);
        const bona = p.opcions.find(o => o[0] === 'ok');
        const zs = valorsDeConjunt(bona[3]);
        for (const z of zs) nota(Math.abs(g(z)) < 1e-6, `${etiqueta}: ${id}: g(${z}) ≠ 0`);
        for (let x = -8; x < 8; x += 0.05) {
            const [a, b] = [g(x), g(x + 0.05)];
            if (!Number.isFinite(a) || !Number.isFinite(b) || fora.some(v => v > x - 1e-9 && v < x + 0.05 + 1e-9))
                continue;
            if (Math.sign(a) !== Math.sign(b) && a !== 0)
                nota(
                    zs.some(z => z >= x - 1e-9 && z <= x + 0.05 + 1e-9),
                    `${etiqueta}: ${id}: canvi de signe entre ${x.toFixed(2)} i ${(x + 0.05).toFixed(2)} sense zero`
                );
        }
        for (const o of p.opcions.filter(o => o[0] !== 'ok')) {
            const v = valorsDeConjunt(o[3]);
            nota(JSON.stringify(v) !== JSON.stringify(zs), `${etiqueta}: ${id}: falsa amb els mateixos zeros`);
        }
    }
    // Taules: cada cel·la, contra el model numèric
    for (const [ordre, deriv] of [
        [1, x => D(f, x)],
        [2, x => D2(f, x)],
    ]) {
        const ps = pas(`taula${ordre}`);
        const pf = pas(`taula${ordre}f`);
        const cols = ps.plantilla[0].taula.columnes;
        const s = ps.solucio.taula.files.s;
        const ff = pf.solucio.taula.files.f;
        cols.forEach((c, i) => {
            if (c.tipus === 'interval') {
                const x = puntDeProva(c);
                nota(Number.isInteger(x) && x > c.a && x < c.b, `${etiqueta}: taula ${ordre}: sense enter a ${c.text}`);
                const sg = deriv(x) > 0 ? 'mes' : 'menys';
                nota(s[i] === sg, `${etiqueta}: taula ${ordre}: signe a ${c.text}`);
                const esperat = ordre === 1 ? (sg === 'mes' ? 'creix' : 'decreix') : sg === 'mes' ? 'conc+' : 'conc-';
                nota(ff[i] === esperat, `${etiqueta}: taula ${ordre}: fila f a ${c.text}`);
            } else {
                const x0 = (cols[i - 1].b + cols[i + 1].a) / 2;
                const esFora = fora.some(v => Math.abs(v - x0) < 1e-9);
                nota(s[i] === (esFora ? 'no' : 'zero'), `${etiqueta}: taula ${ordre}: punt ${c.text}`);
                if (esFora) nota(ff[i] === 'no', `${etiqueta}: taula ${ordre}: ${c.text} fora`);
                else if (ordre === 1) {
                    const [e, l, r] = [f(x0), f(x0 - 0.01), f(x0 + 0.01)];
                    const tipus = e > l && e > r ? 'max' : e < l && e < r ? 'min' : 'cap';
                    nota(ff[i] === tipus, `${etiqueta}: x = ${c.text} és ${tipus}, no ${ff[i]}`);
                } else {
                    const canvia = Math.sign(D2(f, x0 - 0.05)) !== Math.sign(D2(f, x0 + 0.05));
                    nota(ff[i] === (canvia ? 'inf' : 'cap'), `${etiqueta}: x = ${c.text}: inflexió?`);
                }
            }
        });
        nota(ps.dades.taula.columnes.length === cols.length, `${etiqueta}: dades de la taula`);
    }
    // Extrems: la y és f(x)
    const pe = pas('extrems');
    if (pe) {
        pe.dades.xs.forEach((xq, k) => {
            const y = pe.solucio[`y${k}`];
            nota(prop(y[0] / y[1], f(xq[0] / xq[1]), 1e-9), `${etiqueta}: y de l'extrem ${k}`);
        });
    }
    const quantsExtrems = pas('taula1f').solucio.taula.files.f.filter(v => v === 'max' || v === 'min').length;
    nota(!!pe === quantsExtrems > 0, `${etiqueta}: el pas dels extrems hi és si i només si n'hi ha`);
    // Inflexions de la línia: y = f(x) (amb √ inclosa)
    const l2 = pas('taula2f').linia;
    for (const m of l2.matchAll(/\(([^()]*?),\\, ([^()]*?)\)/g)) {
        const [x, y] = [texEval(m[1])(0), texEval(m[2])(0)];
        nota(prop(y, f(x), 1e-9), `${etiqueta}: inflexió (${m[1]}, ${m[2]})`);
    }
    // Gràfiques: tres SVG diferents
    const gs = pas('grafica').opcions.map(o => o[2]);
    nota(gs.every(s => /^<svg class="ef-esbos"/.test(s)) && new Set(gs).size === 3, `${etiqueta}: gràfiques`);
    // Part opcional: comença a la f″
    nota(q.passos[q.opcional.desDe].id === 'd2', `${etiqueta}: la part opcional comença a f″`);
}

suite('1. Centenars de funcions de cada família i els 6 de PAU, contra el model');
{
    const fams = {};
    for (let i = 0; i < 6; i++) comprovaPregunta(generaPreguntaEF({ funcions: 'pau', index: i }), `PAU ${i + 1}`);
    const errorsPau = errors.length;
    ok('els 6 exercicis de PAU: estudi complet correcte', errorsPau === 0, errors.slice(0, 5).join('\n      → '));
    const texPau = PAU_EF.map((_, i) => generaPreguntaEF({ funcions: 'pau', index: i }).tex);
    ok(
        'els 6 de PAU són els del DEMO de pau',
        JSON.stringify(texPau) ===
            JSON.stringify([
                'f(x) = x^{3} - 6x^{2} + 9x',
                'f(x) = x^{3} - 3x',
                'f(x) = x^{4} - 4x^{3}',
                'f(x) = \\dfrac{x^{2} - 2x}{x - 1}',
                'f(x) = \\dfrac{5x}{x^{2} + 1}',
                'f(x) = \\dfrac{x^{2}}{x^{2} - 4}',
            ]),
        texPau.join(' · ')
    );
    errors.length = 0;
    let n = 0;
    for (const funcions of ['polinomiques', 'racionals', '']) {
        for (let i = 0; i < 300; i++) {
            const q = generaPreguntaEF({ funcions });
            fams[q.dades.familia] = (fams[q.dades.familia] || 0) + 1;
            if (funcions === 'polinomiques')
                nota(q.dades.tipus === 'polinomica', 'polinomiques: n’hi ha una que no ho és');
            if (funcions === 'racionals') nota(q.dades.tipus === 'racional', 'racionals: n’hi ha una que no ho és');
            comprovaPregunta(q, q.tex);
            n++;
        }
    }
    ok(
        `${n} funcions: f′, f″, zeros, domini, taules, extrems, inflexions i opcions, tot correcte`,
        errors.length === 0,
        errors.slice(0, 6).join('\n      → ')
    );
    ok(`surten les 8 famílies (${JSON.stringify(fams)})`, Object.keys(fams).length === 8);
}

suite('2. El diagnòstic de cada error');
{
    const falten = [];
    const vistos = new Set();
    const respostaTaula = (pas, canvi) => {
        const t = pas.plantilla[0].taula;
        const prova = {};
        t.columnes.forEach((c, i) => c.tipus === 'interval' && (prova[i] = puntDeProva(c)));
        const files = JSON.parse(JSON.stringify(pas.solucio.taula.files));
        const e = { prova, files };
        canvi(e, t);
        return { taula: e };
    };
    for (let i = 0; i < 6 + 400; i++) {
        const q = i < 6 ? generaPreguntaEF({ funcions: 'pau', index: i }) : generaPreguntaEF({});
        for (const p of q.passos) {
            if (p.mena === 'tria') {
                for (const o of p.opcions.filter(o => o[0] !== 'ok')) {
                    const d = diagnosticaEF(p, { tria: o[0] });
                    vistos.add(d && d.codi);
                    if (!d || !d.missatge) falten.push(`${p.id}: ${o[0]}`);
                }
            }
            if (p.mena === 'taula-signes') {
                // Punt de prova fora de l'interval
                const d1 = diagnosticaEF(
                    p,
                    respostaTaula(p, (e, t) => (e.prova[0] = t.columnes[0].b + 1))
                );
                vistos.add(d1.codi);
                if (d1.codi !== 'EF_T_PROVA') falten.push(`${q.tex} prova: ${d1.codi}`);
                // 0 en un punt fora del domini
                const k = p.solucio.taula.files.s.indexOf('no');
                if (k >= 0) {
                    const d2 = diagnosticaEF(
                        p,
                        respostaTaula(p, e => (e.files.s[k] = 'zero'))
                    );
                    vistos.add(d2.codi);
                    if (d2.codi !== 'EF_T_FORA_ZERO') falten.push(`${q.tex} fora: ${d2.codi}`);
                }
                // Tots els signes canviats: signe equivocat (o els de f, si coincideixen)
                const d3 = diagnosticaEF(
                    p,
                    respostaTaula(
                        p,
                        e => (e.files.s = e.files.s.map(v => (v === 'mes' ? 'menys' : v === 'menys' ? 'mes' : v)))
                    )
                );
                vistos.add(d3.codi);
                if (!['EF_T_SIGNE', 'EF_T_SIGNE_F', 'EF_T_SIGNE_D1'].includes(d3.codi))
                    falten.push(`signes: ${d3.codi}`);
                // Els signes de f (o de f′) als punts de prova
                const { P, Q } = p.dades;
                const val = x => w.pValor(P, x) / w.pValor(Q, x);
                const ff = p.dades.ordre === 1 ? val : x => D(val, x);
                const deF = respostaTaula(p, (e, t) =>
                    t.columnes.forEach((c, j) => {
                        if (c.tipus === 'interval') e.files.s[j] = ff(e.prova[j]) > 0 ? 'mes' : 'menys';
                    })
                );
                const iguals = JSON.stringify(deF.taula.files.s) === JSON.stringify(p.solucio.taula.files.s);
                const nuls = Object.values(deF.taula.prova).some(x => Math.abs(ff(x)) < 1e-6);
                if (!iguals && !nuls) {
                    const d4 = diagnosticaEF(p, deF);
                    vistos.add(d4.codi);
                    if (d4.codi !== (p.dades.ordre === 1 ? 'EF_T_SIGNE_F' : 'EF_T_SIGNE_D1'))
                        falten.push(`${q.tex} signe de f: ${d4.codi}`);
                }
            }
            if (p.mena === 'taula-f') {
                const sol = p.solucio.taula.files.f;
                const ordre = p.dades.ordre;
                const amb = canvi => {
                    const e = { prova: {}, files: { f: sol.slice() } };
                    canvi(e.files.f);
                    return diagnosticaEF(p, { taula: e });
                };
                const di = amb(
                    f => (f[0] = { 'creix': 'decreix', 'decreix': 'creix', 'conc+': 'conc-', 'conc-': 'conc+' }[f[0]])
                );
                vistos.add(di.codi);
                if (di.codi !== (ordre === 1 ? 'EF_T_FLETXA' : 'EF_T_CONCAVITAT')) falten.push(`fletxa: ${di.codi}`);
                sol.forEach((v, j) => {
                    if (j % 2 === 0) return;
                    const esperat = {
                        cap: [ordre === 1 ? 'max' : 'inf', ordre === 1 ? 'EF_T_SENSE_CANVI' : 'EF_T_INF_SENSE_CANVI'],
                        max: ['min', 'EF_T_MAX_MIN'],
                        min: ['cap', 'EF_T_OBLIDAT'],
                        inf: ['cap', 'EF_T_OBLIDAT'],
                        no: ['cap', 'EF_T_FORA_EXTREM'],
                    }[v];
                    const d = amb(f => (f[j] = esperat[0]));
                    vistos.add(d.codi);
                    if (d.codi !== esperat[1]) falten.push(`${q.tex} punt ${v}→${esperat[0]}: ${d.codi}`);
                });
            }
            if (p.mena === 'extrems') {
                // y = 0: si f no hi val 0, ha substituït a f′
                p.dades.xs.forEach((xq, k) => {
                    const y = p.solucio[`y${k}`];
                    if (y[0] === 0) return;
                    const valors = { ...p.solucio, [`y${k}`]: [0, 1] };
                    const d = diagnosticaEF(p, valors);
                    vistos.add(d.codi);
                    if (d.codi !== 'EF_Y_DERIVADA') falten.push(`y = 0: ${d.codi}`);
                });
            }
        }
    }
    ok('cada error fet dona el seu error típic, amb missatge', !falten.length, falten.slice(0, 6).join('\n      → '));
    const sensePerque = Object.entries(ERRORS_EF).filter(([, e]) => !e.etiqueta || !e.missatge);
    ok('cada error típic té etiqueta i missatge', !sensePerque.length, sensePerque.map(([k]) => k).join(', '));
    const clau = [
        'EF_T_PROVA',
        'EF_T_FORA_ZERO',
        'EF_T_SIGNE_F',
        'EF_T_SENSE_CANVI',
        'EF_T_MAX_MIN',
        'EF_T_CONCAVITAT',
        'EF_T_FLETXA',
        'EF_Y_DERIVADA',
        'EF_Q_SUMA',
        'EF_Z_FORA',
        'EF_DOM_NUM',
    ];
    ok(
        'els errors que va demanar el David (C1) surten de debò',
        clau.every(c => vistos.has(c)),
        clau.filter(c => !vistos.has(c)).join(', ')
    );
}

suite('3. La taula de signes com a camp del joc de passos');
{
    const q = generaPreguntaEF({ funcions: 'pau', index: 0 });
    const p = q.passos.find(x => x.id === 'taula1');
    const t = p.plantilla[0].taula;
    const bona = { files: { s: p.solucio.taula.files.s.slice() } };
    t.columnes.forEach((c, i) => c.tipus === 'interval' && (bona[`p${i}`] = String(puntDeProva(c))));
    ok('la resposta bona és correcta', corregeixPas(p, { taula: bona }).estat === 'ok');
    ok(
        'sense punts de prova: encara no ha respost',
        corregeixPas(p, { taula: { files: bona.files } }).estat === 'incomplet'
    );
    const senseBoto = { ...bona, files: { s: bona.files.s.map((v, i) => (i === 2 ? null : v)) } };
    const r1 = corregeixPas(p, { taula: senseBoto });
    ok('una cel·la sense tocar: avís FALTA_TAULA (no resta intent)', r1.estat === 'avis' && r1.codi === 'FALTA_TAULA');
    const r2 = corregeixPas(p, { taula: { ...bona, p0: '1,5' } });
    ok('un punt de prova que no és enter: avís NO_ENTER', r2.estat === 'avis' && r2.codi === 'NO_ENTER');
    const r3 = corregeixPas(p, { taula: { ...bona, p0: '5' } });
    ok('un punt de prova fora de l’interval: error al camp taula', r3.estat === 'error' && r3.malament[0] === 'taula');
    const r4 = corregeixPas(p, { taula: { ...bona, p0: '−1' } });
    ok('el signe menys tipogràfic al punt de prova es llegeix bé', r4.estat === 'ok');
    const l = llegeixTaula({ ...bona, p2: '-3' }, p.solucio.taula, t);
    ok('llegeixTaula torna els punts de prova com a nombres', l.valor && l.valor.prova[2] === -3);
    const html = htmlTaula({ columnes: t.columnes, files: [{ titol: 'f', valors: t.columnes.map(() => '<b>') }] });
    ok('la taula resolta escapa el text', /&lt;b&gt;/.test(html) && !/<b>/.test(html));
    const svg = svgEsbos({ f: x => x * x, trams: [{ a: -Infinity, b: Infinity }], x: [-3, 3], y: [-1, 9] });
    const svg2 = svgEsbos({ f: x => x, trams: [{ a: -Infinity, b: Infinity }], x: [-3, 3], y: [-3, 3] });
    const id = s => /clipPath id="([^"]+)"/.exec(s)[1];
    ok('cada esbós té el seu clipPath (n’hi pot haver 3 a la pantalla)', id(svg) !== id(svg2));
}

suite('4. Mutacions: els tests veurien un model equivocat');
{
    const q = generaPreguntaEF({ funcions: 'pau', index: 0 });
    // Un signe canviat a la taula
    const mutat = JSON.parse(JSON.stringify(q));
    mutat.passos.find(p => p.id === 'taula1').solucio.taula.files.s[0] = 'menys';
    errors.length = 0;
    comprovaPregunta(mutat, 'mutació signe');
    ok(
        'un signe equivocat a la taula es detecta',
        errors.some(e => /signe/.test(e))
    );
    // Una f′ correcta que no ho és
    const mutat2 = JSON.parse(JSON.stringify(q));
    const d1 = mutat2.passos.find(p => p.id === 'd1');
    d1.opcions.find(o => o[0] === 'ok')[1] = '3x^{2} - 12x + 8';
    errors.length = 0;
    comprovaPregunta(mutat2, 'mutació f′');
    ok(
        'una f′ equivocada es detecta',
        errors.some(e => /d1 correcta/.test(e))
    );
    // Un extrem mal classificat (x⁴ − 4x³: x = 0 no és extrem)
    const q3 = JSON.parse(JSON.stringify(generaPreguntaEF({ funcions: 'pau', index: 2 })));
    q3.passos.find(p => p.id === 'taula1f').solucio.taula.files.f[1] = 'max';
    errors.length = 0;
    comprovaPregunta(q3, 'mutació extrem');
    ok(
        'un extrem que no ho és es detecta',
        errors.some(e => /és cap/.test(e))
    );
    // La y d'un extrem
    const q4 = JSON.parse(JSON.stringify(q));
    q4.passos.find(p => p.id === 'extrems').solucio.y0 = [5, 1];
    errors.length = 0;
    comprovaPregunta(q4, 'mutació y');
    ok(
        'una y equivocada es detecta',
        errors.some(e => /y de l'extrem/.test(e))
    );
    // Model directe: l'estudi de 5x/(x² + 1) té les inflexions a ±√3
    const est = estudiaFuncio(defFuncio('campana', { alfa: 5, beta: 1 }));
    ok(
        'estudiaFuncio: 5x/(x² + 1) té inflexions a −√3, 0 i √3, amb y = ∓5√3/4',
        est.inflexions.map(e => `${e.x.text}|${e.y.text}`).join(' ') === '−√3|−5√3/4 0|0 √3|5√3/4'
    );
}

suite('5. La pàgina, l’índex i el codi');
{
    const html = fs.readFileSync(path.join(ROOT, 'estudi-funcio.html'), 'utf8');
    ok(
        'estudi-funcio.html: tema de funcions, controlador i sense codi (Batxillerat)',
        /tema-funcions/.test(html) &&
            /js\/estudi-funcio\/estudi-funcio\.js/.test(html) &&
            /senseCodi:\s*true/.test(html)
    );
    const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    ok(
        'index.html: l’activitat al menú de Batxillerat i l’opció «Funcions» (totes, polinòmiques, racionals, PAU)',
        /file: 'estudi-funcio\.html'/.test(index) &&
            /'estudi-funcio\.html': \[\s*\{ param: 'funcions'/.test(index) &&
            ["'polinomiques'", "'racionals'", "'pau'"].every(v => index.includes(v))
    );
    ok(
        'js/exercise-codes.js: codi EF reservat',
        /'estudi-funcio': 'EF'/.test(fs.readFileSync(path.join(ROOT, 'js/exercise-codes.js'), 'utf8'))
    );
    const ctrl = fs.readFileSync(path.join(ROOT, 'js/estudi-funcio/estudi-funcio.js'), 'utf8');
    ok('el controlador llegeix ?funcions=', /get\('funcions'\)/.test(ctrl));
}

finish('ESTUDI D’UNA FUNCIÓ');
