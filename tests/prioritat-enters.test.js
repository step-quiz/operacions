/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/prioritat-enters.test.js
 * ROL: Tests de «Prioritat d'operacions» amb enters (?nombres=enters, lliurament 14
 *      del full de ruta): js/prioritat/math-engine.js (LEVELS_ENTERS i els errors
 *      dels signes), strings.js i renderer.js.
 * ARQUITECTURA:
 * - Una aritmètica pròpia (valorDe) llegeix l'expressió escrita («5 − (−3)», «−2²»,
 *   «(−2)³», «−(4 − 7)») i en calcula el valor; amb una regla equivocada, el valor de
 *   cada error típic dels signes (el signe del resultat d'una suma, restar un negatiu,
 *   menys per menys, el signe d'una potència de base negativa, −2² com (−2)², el menys
 *   de davant del parèntesi oblidat), fet aquí, sense el motor.
 * - 1. Milers d'expressions dels 6 nivells interns: el valor, el contingut de cada
 *   nivell, les opcions (cada error dels signes, recalculat), el diagnòstic i el
 *   missatge; la resolució «de llibre» (cada fila val el mateix, l'ordre bo, la taula);
 *   «Pas a pas» per camins a l'atzar (les operacions que es poden fer, per què no les
 *   altres, els resultats equivocats amb el signe girat i la pista del signe); i
 *   l'esvaïment.
 * - 2. Casos fets a mà, un per error i per regla d'escriptura.
 * - 3. L'opció «Nombres» d'index.html és la que llegeix el controlador.
 * ÚS: node tests/prioritat-enters.test.js
 * ============================================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite, ok, eq, finish, loadModule } = require('./harness');

const w = loadModule(
    ['js/utils.js', 'js/prioritat/math-engine.js', 'js/prioritat/strings.js', 'js/prioritat/renderer.js'],
    { seed: 20261116 }
);
const E = w.MathEngine,
    S = w.Strings,
    Rd = w.Renderer;
const BAD_TEXT = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]|\bnull\b/;
const EXP = { '²': 2, '³': 3, '⁴': 4, '⁵': 5 };

/**
 * El valor d'una expressió escrita (amb «−», «·», «:», exponents ²³⁴⁵). regla: un error dels signes, per
 * calcular què hi dona (null: la regla bona). El menys de davant només hi és al principi o darrere d'un
 * parèntesi: −3, −(4 − 7), −2² (= −(2²), o 4 amb l'error powopp).
 */
function valorDe(text, regla = null) {
    const s = text.replace(/\s+/g, '').replace(/−/g, '-');
    let i = 0;
    const err = () => new Error(`no s'entén «${text}» (posició ${i})`);
    const factor = () => {
        if (s[i] === '-') {
            i++;
            const parentesi = s[i] === '(';
            const base = factor();
            if (parentesi) return regla === 'negpar' ? base : -base; // −(…)
            if (regla === 'powopp' && /[²³⁴⁵]/.test(s[i - 1])) return -base; // −2² com (−2)²: 4
            return -base;
        }
        let v;
        let negatiuEntreParentesis = false;
        if (s[i] === '(') {
            i++;
            negatiuEntreParentesis = s[i] === '-' && /^-\d+\)/.test(s.slice(i));
            v = suma();
            if (s[i++] !== ')') throw err();
        } else {
            const m = /^\d+/.exec(s.slice(i));
            if (!m) throw err();
            i += m[0].length;
            v = Number(m[0]);
        }
        while (EXP[s[i]]) {
            const e = EXP[s[i++]];
            v = regla === 'powsigne' && negatiuEntreParentesis ? Math.abs(v) ** e : v ** e;
        }
        return v;
    };
    const opera = (a, op, b) => {
        let r = op === '+' ? a + b : op === '-' ? a - b : op === '·' ? a * b : a / b;
        if (regla === 'restaneg' && op === '-' && b < 0) r = a + b;
        if (regla === 'signeprod' && (op === '·' || op === ':') && a < 0 && b < 0) r = -r;
        if (regla === 'signesuma' && (op === '+' || op === '-') && a !== 0 && r !== 0 && Math.sign(r) !== Math.sign(a))
            r = -r;
        return r;
    };
    const producte = () => {
        let v = factor();
        while (s[i] === '·' || s[i] === ':') {
            const op = s[i++];
            v = opera(v, op, factor());
        }
        return v;
    };
    const suma = () => {
        let v = producte();
        while (s[i] === '+' || s[i] === '-') {
            const op = s[i++];
            v = opera(v, op, producte());
        }
        return v;
    };
    const v = suma();
    if (i !== s.length) throw err();
    return v;
}
// L'error 'powopp' només canvia −b^e amb e parell; amb la regla de dalt, −2² dona −4 també: es corregeix aquí
function valorAmbError(text, regla) {
    if (regla !== 'powopp') return valorDe(text, regla);
    // −b^e al principi o darrere d'un parèntesi → (−b)^e
    return valorDe(text.replace(/(^|\()−(\d+)([²³⁴⁵])/g, '$1(−$2)$3'), null);
}

const PREC = { '+': 1, '-': 1, '·': 2, ':': 2 };
const esOperacio = t => t.k === 'op' || t.k === 'pow' || t.k === 'neg';
const operacionsDe = line => line.map((t, i) => i).filter(i => esOperacio(line[i]));
/** Si l'operació de la posició i es pot fer ja (feta aquí, sense el motor). */
function esPotFer(line, i) {
    const t = line[i];
    if (t.k === 'pow') return true;
    if (t.k === 'neg') return line[i + 1].k === 'lp' && line[i + 2].k === 'num' && line[i + 3].k === 'rp';
    const a = line[i - 1],
        b = line[i + 1],
        l = line[i - 2],
        r = line[i + 2];
    if (!a || !b || a.k !== 'num' || b.k !== 'num') return false;
    if (l && l.k === 'op' && PREC[l.v] >= PREC[t.v]) return false;
    if (r && r.k === 'op' && PREC[r.v] > PREC[t.v]) return false;
    return true;
}
/** L'ordre «de llibre»: el parèntesi de més endins i més a l'esquerra (si ja només té un nombre i un menys
 * davant, treure'l); a dins, la primera potència, després · i :, després + i −. */
function ordreDeLlibre(line) {
    let a = 0,
        b = line.length - 1;
    const tanca = line.findIndex(t => t.k === 'rp');
    if (tanca >= 0) {
        b = tanca - 1;
        for (a = tanca; line[a].k !== 'lp'; a--);
        if (b === a + 1 && line[a - 1] && line[a - 1].k === 'neg') return a - 1;
        a++;
    }
    const dins = line.map((t, i) => i).filter(i => i >= a && i <= b);
    return (
        dins.find(i => line[i].k === 'pow') ??
        dins.find(i => line[i].k === 'op' && PREC[line[i].v] === 2) ??
        dins.find(i => line[i].k === 'op')
    );
}
const lcg = seed => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const ERRORS_SIGNES = ['signesuma', 'restaneg', 'signeprod', 'powsigne', 'powopp', 'negpar'];

suite('1. Les expressions amb enters: valor, opcions, errors, resolució i «Pas a pas»');
{
    const rnd = lcg(14);
    const err = { crash: [], val: [], nivell: [], opts: [], signe: [], diag: [], sol: [], html: [], pas: [], esv: [] };
    const anota = (llista, t) => llista.length < 5 && llista.push(t);
    const vistos = { errors: new Set(), motius: new Set(), negatius: 0, pistes: 0 };
    let n = 0;
    for (let nivell = 0; nivell < E.LEVELS_ENTERS.length; nivell++)
        for (let k = 0; k < 500; k++) {
            n++;
            let txt = `nivell ${nivell}`;
            try {
                const ex = E.generateExerciseEnters(nivell);
                const toks = ex.toks;
                txt = S.toText(toks);
                // El valor, llegit de l'expressió escrita
                const v = valorDe(txt);
                if (v !== ex.val || !Number.isInteger(v) || Math.abs(v) > E.MAX_RESULT_ENTERS)
                    anota(err.val, `${txt} = ${v}, no ${ex.val}`);
                if (v < 0) vistos.negatius++;
                // Cada nivell, el seu contingut
                const te = {
                    pow: toks.some(t => t.k === 'pow'),
                    par: toks.some(t => t.k === 'lp'),
                    prod: toks.some(t => t.k === 'op' && PREC[t.v] === 2),
                    neg: toks.some(
                        t => (t.k === 'num' && t.v < 0) || t.k === 'neg' || (t.k === 'pow' && (t.b < 0 || t.opp))
                    ),
                };
                const bo = [
                    !te.pow && !te.par && !te.prod,
                    !te.pow && te.par && !te.prod,
                    !te.pow && !te.par && te.prod,
                    !te.pow && te.prod,
                    te.pow,
                    te.pow,
                ][nivell];
                // Negatius a l'enunciat o, si no, en alguna fila de la resolució (2 − 10 + 9 → −8 + 9)
                const negatiuPelCami = E.solve(E.startLine(toks)).some(r => r.line.some(t => t.k === 'num' && t.v < 0));
                if (!bo || !(te.neg || negatiuPelCami)) anota(err.nivell, `nivell ${nivell}: ${txt}`);
                // Les opcions: 3 distractors enters i diferents; els dels errors dels signes, recalculats aquí
                const ds = E.buildDistractors(toks, ex.val, true);
                const vals = [ex.val, ...ds.map(d => d.v)];
                if (ds.length !== 3 || new Set(vals).size !== 4 || !vals.every(Number.isInteger))
                    anota(err.opts, `${txt}: ${vals.join(', ')}`);
                for (const d of ds) {
                    vistos.errors.add(d.id);
                    if (ERRORS_SIGNES.includes(d.id) && valorAmbError(txt, d.id) !== d.v)
                        anota(err.signe, `${txt} (${d.id}): ${d.v}, i aquí dona ${valorAmbError(txt, d.id)}`);
                    const diag = d.id === 'calc' ? null : E.diagnose(toks, d.id);
                    const fb = S.feedbackFor(d.id, toks, diag);
                    if (!fb || BAD_TEXT.test(fb)) anota(err.diag, `${txt} (${d.id}): «${fb}»`);
                    if (diag && [...diag.red, ...diag.green].some(i => !toks[i] || !esOperacio(toks[i])))
                        anota(err.diag, `${txt} (${d.id}): marca ${[...diag.red]}`);
                    if (ERRORS_SIGNES.includes(d.id) && (!diag || diag.red.size !== 1 || !diag.signe))
                        anota(err.diag, `${txt} (${d.id}): sense la marca del signe`);
                }
                // La resolució «de llibre»
                const rows = E.solve(E.startLine(toks));
                const nOps = operacionsDe(toks).length;
                if (rows.length !== nOps + 1 || rows.at(-1).line[0].v !== ex.val)
                    anota(err.sol, `${txt}: ${rows.length} línies`);
                rows.forEach((row, j) => {
                    const t = S.toText(row.line);
                    if (valorDe(t) !== ex.val) anota(err.sol, `${txt}: la línia ${t} no val ${ex.val}`);
                    if (j < rows.length - 1) {
                        if (row.op !== ordreDeLlibre(row.line) || !esPotFer(row.line, row.op))
                            anota(err.sol, `${t}: fa ${S.opText(row.line, row.op)}`);
                        vistos.motius.add(E.motiuPas(row.line, row.op));
                    }
                });
                // La taula: N columnes per fila, sense textos estranys, i els botons de la línia de treball
                const html = Rd.tableHtml(rows);
                const trs = html.split('<tr').slice(1);
                trs.forEach((tr, j) => {
                    const cols = [...tr.matchAll(/<td([^>]*)>/g)]
                        .filter(m => !/igual/.test(m[1]))
                        .reduce((s, m) => s + Number((/colspan="(\d+)"/.exec(m[1]) || [0, 1])[1]), 0);
                    if (cols !== toks.length) anota(err.html, `${txt}, fila ${j}: ${cols} columnes`);
                });
                if (BAD_TEXT.test(html) || /-\d/.test(html.replace(/<[^>]+>/g, '')))
                    anota(err.html, `${txt}: text estrany o un guionet en lloc de «−»`);
                const act = Rd.tableHtml([{ line: E.startLine(toks), op: -1 }], { active: true });
                if ((act.match(/class="tok-btn/g) || []).length !== nOps) anota(err.html, `${txt}: botons`);
                // «Pas a pas»: un camí a l'atzar
                let line = E.startLine(toks),
                    passos = 0;
                while (!E.isDone(line) && passos < 20) {
                    const t = S.toText(line);
                    const ready = E.readyOps(line);
                    const esperat = operacionsDe(line).filter(i => esPotFer(line, i));
                    if (ready.join() !== esperat.join()) anota(err.pas, `${t}: ${ready} ≠ ${esperat}`);
                    for (const i of operacionsDe(line)) {
                        if (ready.includes(i)) continue;
                        const bl = E.blockers(line, i);
                        const msg = bl && S.blockerMsg(bl, line);
                        if (
                            !bl ||
                            !bl.green.length ||
                            bl.green.some(g => !ready.includes(g)) ||
                            !msg ||
                            BAD_TEXT.test(msg)
                        )
                            anota(err.pas, `${t}: ${i} → ${JSON.stringify(bl)} «${msg}»`);
                    }
                    const i = ready[Math.floor(rnd() * ready.length)];
                    const okv = E.opValue(line, i);
                    if (okv !== valorDe(S.opText(line, i))) anota(err.pas, `${S.opText(line, i)} = ${okv}?`);
                    const dd = E.stepDistractors(line, i);
                    if (dd.length !== 3 || new Set([okv, ...dd]).size !== 4 || !dd.every(Number.isInteger))
                        anota(err.pas, `${S.opText(line, i)} = ${okv}: ${dd.join(', ')}`);
                    // Amb un negatiu a l'operació, una de les opcions és el resultat amb el signe girat, i té la seva pista
                    const tk = line[i];
                    const ambNegatiu =
                        okv < 0 ||
                        tk.k === 'neg' ||
                        (tk.k === 'pow' && (tk.b < 0 || tk.opp)) ||
                        (tk.k === 'op' && (line[i - 1].v < 0 || line[i + 1].v < 0));
                    if (ambNegatiu && okv !== 0) {
                        const girat =
                            line[i].k === 'op' && line[i].v === '-' && line[i + 1].v < 0
                                ? line[i - 1].v + line[i + 1].v
                                : -okv;
                        if (!dd.includes(girat))
                            anota(err.pas, `${S.opText(line, i)} = ${okv}: falta ${girat} (${dd})`);
                        const msg = S.wrongResultMsg(line, i, girat);
                        if (S.pistaSigne(line, i, girat)) vistos.pistes++;
                        else anota(err.pas, `${S.opText(line, i)}: «${msg}» sense pista del signe`);
                    }
                    line = E.applyAt(line, i);
                    if (valorDe(S.toText(line)) !== ex.val) anota(err.pas, `${t} → ${S.toText(line)}`);
                    passos++;
                }
                if (!E.isDone(line) || line[0].v !== ex.val || passos !== nOps)
                    anota(err.pas, `${txt}: ${passos} passos, acaba en ${S.toText(line)}`);
                // L'esvaïment: els passos «de llibre», amb la seva frase
                const pe = E.passosEsvaiment(toks);
                if (pe.length !== nOps || pe.some(p => p.resposta !== E.opValue(p.line, p.op)))
                    anota(err.esv, `${txt}: ${pe.length} passos`);
                for (const p of pe) {
                    const f = S.exemplePas(p);
                    if (BAD_TEXT.test(f) || !/ = −?\d+\.$/.test(f)) anota(err.esv, `${txt}: «${f}»`);
                }
            } catch (e) {
                anota(err.crash, `${txt}: ${e.message}`);
            }
        }
    ok('cap excepció', !err.crash.length, err.crash.join('\n      → '));
    ok(
        `${n} expressions: el valor, llegit de l'expressió escrita, enter i |r| ≤ 100`,
        !err.val.length,
        err.val.join('\n      → ')
    );
    ok(
        'cada nivell, el seu contingut (0 sumes i restes, 1 amb parèntesis, 2–3 productes, 4–5 potències), amb negatius',
        !err.nivell.length,
        err.nivell.join('\n      → ')
    );
    ok('la correcta i 3 distractors enters i diferents', !err.opts.length, err.opts.join('\n      → '));
    ok(
        'cada error dels signes dona el valor que dona aquí, amb la regla equivocada',
        !err.signe.length,
        err.signe.join('\n      → ')
    );
    ok(
        'cada distractor té el seu missatge, i els dels signes, la seva marca',
        !err.diag.length,
        err.diag.join('\n      → ')
    );
    ok('resolució: cada fila val el mateix, en l’ordre de llibre', !err.sol.length, err.sol.join('\n      → '));
    ok('taula: N columnes, «−» de veritat i un botó per operació', !err.html.length, err.html.join('\n      → '));
    ok(
        '«Pas a pas»: les operacions que es poden fer, per què no les altres, els distractors i la pista del signe',
        !err.pas.length,
        err.pas.join('\n      → ')
    );
    ok('esvaïment: un pas per operació, amb la seva frase', !err.esv.length, err.esv.join('\n      → '));
    eq(
        'surten tots els errors dels signes',
        ERRORS_SIGNES.filter(x => vistos.errors.has(x)).join(),
        ERRORS_SIGNES.join()
    );
    ok(
        `surten tots els motius (${[...vistos.motius].sort()})`,
        ['lr', 'neg', 'par', 'pow', 'prio', 'sola'].every(m => vistos.motius.has(m))
    );
    ok(
        `hi ha resultats negatius (${vistos.negatius}) i pistes del signe (${vistos.pistes})`,
        vistos.negatius > 500 && vistos.pistes > 1000
    );
}

suite('2. Casos fets a mà');
{
    const { N, O, P, L, R, NEG } = E;
    // El valor que dona cada error, sol (dos errors poden donar el mateix valor: les opcions en diuen un)
    const valorDError = (toks, id) =>
        E.evaluate(
            toks,
            Object.assign(
                { enters: true },
                [...E.MISCONCEPTIONS_ENTERS, ...E.MISCONCEPTIONS].find(m => m.id === id).cfg
            )
        );
    eq('−4 + 7 = 3; amb el signe del primer: −3', valorDError([N(-4), O('+'), N(7)], 'signesuma'), -3);
    eq('3 − 8 = −5; amb el signe del primer: 5', valorDError([N(3), O('-'), N(8)], 'signesuma'), 5);
    eq('5 − (−3) = 8; restant el negatiu com si fos positiu: 2', valorDError([N(5), O('-'), N(-3)], 'restaneg'), 2);
    eq(
        '(−3) · (−2) = 6; menys per menys, menys: −6',
        valorDError([N(-3), O('·'), N(-2), O('+'), N(1)], 'signeprod'),
        -5
    );
    eq('(−2)³ + 1 = −7; sense el signe de la base: 9', valorDError([P(-2, 3), O('+'), N(1)], 'powsigne'), 9);
    eq('−2² + 1 = −3; com si fos (−2)²: 5', valorDError([P(2, 2, true), O('+'), N(1)], 'powopp'), 5);
    eq(
        '−(4 − 7) + 2 = 5; oblidant el menys: −1',
        valorDError([NEG(), L(), N(4), O('-'), N(7), R(), O('+'), N(2)], 'negpar'),
        -1
    );
    eq(
        '−(4 − 7) + 2 sense parèntesis: −4 − 7 + 2 = −9',
        valorDError([NEG(), L(), N(4), O('-'), N(7), R(), O('+'), N(2)], 'nopar'),
        -9
    );
    // Escriptura
    eq(
        'els negatius darrere d’un signe, entre parèntesis; al principi i darrere de «(», sense',
        S.toText([N(-4), O('+'), L(), N(-3), O('-'), N(2), R(), O('·'), N(-5)]),
        '−4 + (−3 − 2) · (−5)'
    );
    eq(
        'les potències: −2², (−2)³, (−1)⁵',
        S.toText([P(2, 2, true), O('+'), P(-2, 3), O('-'), P(-1, 5)]),
        '−2² + (−2)³ − (−1)⁵'
    );
    eq('el menys de davant del parèntesi, enganxat', S.toText([NEG(), L(), N(4), O('-'), N(7), R()]), '−(4 − 7)');
    eq('opText: el primer factor negatiu, entre parèntesis', S.opText([N(-3), O('·'), N(-2)], 1), '(−3) · (−2)');
    eq('opText: la suma, sense', S.opText([N(-4), O('+'), N(7)], 1), '−4 + 7');
    eq('opText: treure el parèntesi', S.opText([NEG(), L(), N(-3), R()], 0), '−(−3)');
    ok(
        'tokText: (−3) darrere d’un signe; −3 al principi',
        Rd.tokText(N(-3), O('+')) === '(−3)' && Rd.tokText(N(-3)) === '−3'
    );
    ok(
        'la pista del signe: 5 − (−3) no fa 2',
        /Restar un nombre negatiu és sumar/.test(S.wrongResultMsg([N(5), O('-'), N(-3)], 1, 2))
    );
    ok('el camí dels naturals no accepta negatius', E.evaluate([N(3), O('-'), N(8)], {}) === null);
}

suite("3. L'opció «Nombres» d'index.html");
{
    const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const m = idx.match(/'prioritat\.html': \[\s*\{ param: 'nombres'[^\n]*valors: (\[\[.*\]\]) \}/);
    ok('index.html té l’opció «nombres» de prioritat.html', Boolean(m));
    eq(
        'amb els valors «» i «enters»',
        m ? [...m[1].matchAll(/\['([^']*)', /g)].map(x => x[1]).join(',') : '',
        ',enters'
    );
    const ctl = fs.readFileSync(path.join(ROOT, 'js/prioritat/prioritat.js'), 'utf8');
    ok('i el controlador la llegeix', /urlParams\.get\('nombres'\) === 'enters'/.test(ctl));
}

finish('TESTS DE PRIORITAT AMB ENTERS');
