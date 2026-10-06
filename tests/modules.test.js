/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tests/modules.test.js
 * ROL: Tests dels mòduls de preguntes (sense navegador). Per a cada mòdul es
 *      generen milers de preguntes i es comprova que són correctes:
 *   - Preguntes de triar: exactament UNA opció correcta, opcions sense repetir,
 *     cap text amb "undefined"/"NaN", i la resposta correcta coincideix amb
 *     la solució.
 *   - Posició de la resposta correcta: repartida per igual entre les opcions
 *     (evita que torni el barrejat esbiaixat, on la correcta sortia massa
 *     sovint la primera).
 *   - Mòduls numèrics: la solució que dona el mòdul es recalcula aquí de
 *     manera independent (mitjana, mediana, moda…).
 * ÚS: node tests/modules.test.js
 * ============================================================================
 */
'use strict';
const { suite, ok, finish, loadModule } = require('./harness');

const N = 3000; // preguntes per comprovació
const BAD_TEXT = /\bundefined\b|\bNaN\b|\bInfinity\b|\[object Object\]/;

const optText = o => String(o.tex ?? o.text ?? o.label ?? '');
// Per comparar opcions: sense espais (en LaTeX, "\\frac{1}{2} e^{x}" i "\\frac{1}{2}e^{x}" es veuen iguals)
const norm = s => String(s).replace(/\s+/g, '');

/**
 * Comprovacions comunes de les preguntes de triar.
 * @param {string}   name
 * @param {Function} gen          retorna una pregunta amb .options[]
 * @param {object}   o            { n, solutionKey, positions: true si l'ordre servit ha de ser aleatori,
 *                                  nOptions: nombre exacte d'opcions que ha de tenir cada pregunta }
 */
function checkMultipleChoice(name, gen, { n = N, solutionKey = null, positions = false, nOptions = null } = {}) {
    const err = { gen: [], count: [], oneCorrect: [], unique: [], text: [], solution: [] };
    const pos = {}; // pos[k] = comptador de posicions per a preguntes amb k opcions
    for (let i = 0; i < n; i++) {
        let q;
        try {
            q = gen(i);
        } catch (e) {
            err.gen.push(e.message);
            continue;
        }
        const opts = q && q.options;
        if (!Array.isArray(opts) || opts.length < 2) {
            err.gen.push(`opcions: ${JSON.stringify(opts)}`);
            continue;
        }
        if (nOptions && opts.length !== nOptions)
            err.count.push(
                `${opts.length} opcions: ${q.promptTex ?? q.promptText ?? q.prompt ?? ''} → ${opts.map(optText).join(' | ')}`
            );
        const correct = opts.filter(o => o.isCorrect);
        if (correct.length !== 1) err.oneCorrect.push(`${correct.length} correctes: ${opts.map(optText).join(' | ')}`);
        const texts = opts.map(o => norm(optText(o)));
        if (new Set(texts).size !== texts.length)
            err.unique.push(`${q.promptTex ?? q.promptText ?? q.prompt ?? q.label ?? ''} → ${texts.join(' | ')}`);
        const fields = [
            q.promptTex,
            q.promptText,
            q.prompt,
            q.label,
            q.solutionTex,
            ...opts.map(optText),
            ...opts.map(o => o.feedback),
        ].filter(v => v != null);
        const bad = fields.find(f => BAD_TEXT.test(String(f)));
        if (bad) err.text.push(String(bad).slice(0, 120));
        if (solutionKey && correct.length === 1 && norm(optText(correct[0])) !== norm(q[solutionKey])) {
            err.solution.push(`${optText(correct[0])} ≠ ${q[solutionKey]}`);
        }
        if (positions && correct.length === 1) {
            const k = opts.length;
            (pos[k] = pos[k] || Array(k).fill(0))[opts.indexOf(correct[0])]++;
        }
    }
    const first = a => (a.length ? `${a.length} casos. Primer: ${a[0]}` : '');
    ok(`${name}: es generen ${n} preguntes sense errors`, !err.gen.length, first(err.gen));
    if (nOptions) ok(`${name}: totes les preguntes tenen ${nOptions} opcions`, !err.count.length, first(err.count));
    ok(`${name}: exactament una opció correcta`, !err.oneCorrect.length, first(err.oneCorrect));
    ok(`${name}: cap opció repetida`, !err.unique.length, first(err.unique));
    ok(`${name}: cap text amb undefined/NaN`, !err.text.length, first(err.text));
    if (solutionKey)
        ok(`${name}: l'opció correcta coincideix amb ${solutionKey}`, !err.solution.length, first(err.solution));
    if (positions) checkPositions(name, pos);
}

/** Cada posició ha de tenir la correcta 1/k de les vegades (tolerància ±5 punts). */
function checkPositions(name, pos) {
    for (const [k, counts] of Object.entries(pos)) {
        const total = counts.reduce((a, b) => a + b, 0);
        if (total < 500) continue; // massa poques mostres per decidir
        const pct = counts.map(c => c / total);
        const worst = Math.max(...pct.map(p => Math.abs(p - 1 / k)));
        ok(
            `${name}: la correcta es reparteix per igual entre les ${k} posicions`,
            worst < 0.05,
            pct.map(p => (100 * p).toFixed(1) + '%').join(' | ')
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
suite('utils.js › shuffle (Fisher-Yates)');
{
    const w = loadModule(['js/utils.js']);
    const counts = [0, 0, 0, 0];
    let isPermutation = true;
    for (let i = 0; i < 40000; i++) {
        const a = w.shuffle([0, 1, 2, 3]);
        if ([...a].sort().join() !== '0,1,2,3') isPermutation = false;
        counts[a.indexOf(0)]++;
    }
    ok('manté els mateixos elements', isPermutation);
    const worst = Math.max(...counts.map(c => Math.abs(c / 40000 - 0.25)));
    ok('cada posició ≈ 25%', worst < 0.015, counts.map(c => (c / 400).toFixed(1) + '%').join(' | '));
}

// ─────────────────────────────────────────────────────────────────────────────
suite('utils.js › gcd (màxim comú divisor)');
{
    const w = loadModule(['js/utils.js']);
    const naive = (a, b) => {
        a = Math.abs(a);
        b = Math.abs(b);
        if (!a && !b) return 0;
        for (let d = Math.max(a, b); d > 0; d--) if (a % d === 0 && b % d === 0) return d;
    };
    const wrong = [];
    for (let a = -30; a <= 30; a++)
        for (let b = -30; b <= 30; b++) if (w.gcd(a, b) !== naive(a, b)) wrong.push(`${a},${b}`);
    ok('coincideix amb el càlcul directe per a -30…30 (sempre ≥ 0)', !wrong.length, wrong.slice(0, 5).join(' '));
}

// ─────────────────────────────────────────────────────────────────────────────
// Derivades, integrals i probabilitat: el banc retorna la correcta la primera
// i el controlador barreja amb shuffle() de utils.js.
function withReset(w, fn) {
    return i => {
        if (i % 40 === 0 && w.QuestionBank.resetSession) w.QuestionBank.resetSession();
        return fn();
    };
}
function servedByController(w) {
    // el que fan derivades.js / integrals.js / probabilitat.js
    return q => ({ ...q, options: w.shuffle([...q.options]) });
}

suite('Derivades');
{
    const w = loadModule([
        'js/utils.js',
        'js/derivades/math-engine.js',
        'js/derivades/strings.js',
        'js/derivades/distractor-lib.js',
        'js/derivades/question-bank.js',
    ]);
    const gen = withReset(w, () => w.QuestionBank.generateChallenge());
    checkMultipleChoice('derivades', gen, { solutionKey: 'solutionTex', nOptions: 4 });
    const serve = servedByController(w);
    checkMultipleChoice('derivades (ordre servit)', i => serve(gen(i)), { positions: true });
}

suite('Integrals');
{
    const w = loadModule([
        'js/utils.js',
        'js/integrals/math-engine.js',
        'js/integrals/strings.js',
        'js/integrals/distractor-lib.js',
        'js/integrals/question-bank.js',
    ]);
    const gen = withReset(w, () => w.QuestionBank.generateChallenge());
    checkMultipleChoice('integrals', gen, { solutionKey: 'solutionTex', nOptions: 4 });
    const serve = servedByController(w);
    checkMultipleChoice('integrals (ordre servit)', i => serve(gen(i)), { positions: true });
}

suite('Probabilitat');
for (const nivell of [1, 2, 3]) {
    const w = loadModule(
        [
            'js/utils.js',
            'js/probabilitat/math-engine.js',
            'js/probabilitat/strings.js',
            'js/probabilitat/distractor-lib.js',
            'js/probabilitat/question-bank.js',
        ],
        { search: `?nivell=${nivell}` }
    );
    const gen = withReset(w, () => w.QuestionBank.generateChallenge());
    checkMultipleChoice(`probabilitat nivell ${nivell}`, gen, {
        n: 1500,
        solutionKey: 'solutionTex',
        nOptions: 4,
    });
}

suite('Probabilitat › distractors de reserva');
{
    const w = loadModule([
        'js/utils.js',
        'js/probabilitat/math-engine.js',
        'js/probabilitat/strings.js',
        'js/probabilitat/distractor-lib.js',
    ]);
    const d = (tex, errorType, reserva = false) => ({ tex, errorType, feedback: '', reserva });
    const types = sel =>
        sel
            .map(x => x.errorType)
            .sort()
            .join(',');
    const full = w.DistractorLib.selectDistractors(
        [d('a', 'A'), d('b', 'B'), d('c', 'C'), d('r1', 'R1', true), d('r2', 'R2', true)],
        'ok',
        3
    );
    ok("amb prou distractors normals, no se'n fa servir cap de reserva", types(full) === 'A,B,C', types(full));
    const one = w.DistractorLib.selectDistractors(
        [d('a', 'A'), d('ok', 'B'), d('c', 'C'), d('r1', 'R1', true), d('r2', 'R2', true)],
        'ok',
        3
    );
    ok('si un coincideix amb la correcta, entra la primera reserva', types(one) === 'A,C,R1', types(one));
    const two = w.DistractorLib.selectDistractors(
        [d('a', 'A'), d('ok', 'B'), d('a', 'C'), d('r1', 'R1', true), d('r2', 'R2', true)],
        'ok',
        3
    );
    ok('si en falten dos, entren les dues reserves', types(two) === 'A,R1,R2', types(two));

    // Taules de probabilitat condicionada: mai simètriques (P(A|B) = P(B|A) amagaria l'error «invertit»)
    const q = loadModule(
        [
            'js/utils.js',
            'js/probabilitat/math-engine.js',
            'js/probabilitat/strings.js',
            'js/probabilitat/distractor-lib.js',
            'js/probabilitat/question-bank.js',
        ],
        { search: '?nivell=3' }
    );
    let tables = 0,
        sym = 0,
        noInverted = 0;
    for (let i = 0; i < 3000; i++) {
        if (i % 40 === 0) q.QuestionBank.resetSession();
        const ch = q.QuestionBank.generateChallenge();
        if (ch.meta.family !== 'conditional-table') continue;
        tables++;
        if (ch.meta.params.nA === ch.meta.params.nB) sym++;
        if (!ch.options.some(o => o.errorType === 'INVERTED')) noInverted++;
    }
    ok(`cap taula simètrica (${tables} taules)`, tables > 500 && sym === 0, `${sym} simètriques`);
    ok('totes les taules tenen el distractor «has invertit la condició»', noInverted === 0, `${noInverted} sense`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Asímptotes i descripció de gràfica: el banc ja retorna les opcions barrejades.
suite('Asímptotes');
for (const nivell of [1, 2, 3]) {
    const w = loadModule([
        'js/utils.js',
        'js/asimptotes/function-engine.js',
        'js/asimptotes/strings-asimptotes.js',
        'js/asimptotes/question-bank-asimptotes.js',
    ]);
    checkMultipleChoice(
        `asímptotes nivell ${nivell}`,
        () => w.QuestionBankA.generateChallenge(w.FunctionEngine.generateFunction(nivell), nivell),
        { n: 2000, positions: true, nOptions: 4 }
    );
}

suite("Descripció d'una gràfica");
for (const nivell of [1, 2, 3]) {
    const w = loadModule([
        'js/utils.js',
        'js/descripcio-grafica/function-engine.js',
        'js/descripcio-grafica/question-bank.js',
    ]);
    for (const [fase, fn] of [
        ['signe', 'generateSignQ'],
        ['monotonia', 'generateMonoQ'],
        ['concavitat', 'generateConcQ'],
    ]) {
        checkMultipleChoice(
            `descripció nivell ${nivell} (${fase})`,
            () => w.QuestionBank[fn](w.FunctionEngine.generateFunction(nivell)),
            { n: 1000, positions: true, nOptions: 4 }
        );
    }
}

// Recta numèrica: algunes preguntes tenen les opcions en ordre natural a propòsit
// (0, 1, 2, 3 dies…), així que no es comprova la posició.
suite('Recta numèrica');
for (const nivell of [1, 2, 3]) {
    const w = loadModule([
        'js/utils.js',
        'js/recta-numerica/cloud-engine.js',
        'js/recta-numerica/strings.js',
        'js/recta-numerica/distractor-lib.js',
        'js/recta-numerica/question-bank.js',
    ]);
    checkMultipleChoice(
        `recta numèrica nivell ${nivell}`,
        () => {
            const y = w.CloudEngine.chooseYRange(nivell);
            return w.QuestionBank.generateChallenge(w.CloudEngine.generateCloud(y), y, nivell);
        },
        { n: 2000, nOptions: 4 }
    );
}

// ─────────────────────────────────────────────────────────────────────────────
suite('Llenguatge algebraic');
{
    const w = loadModule(['js/utils.js', 'js/llenguatge-algebraic/question-bank.js']);
    const used = [],
        errs = [],
        seenIdx = new Set();
    for (let i = 0; i < N; i++) {
        const { question: q, index } = w.QuestionBank.pick(used);
        used.push(index);
        seenIdx.add(index);
        const all = [q.answer, ...q.distractors].map(norm);
        if (q.distractors.length !== 3) errs.push(`#${index}: ${q.distractors.length} distractors`);
        else if (new Set(all).size !== 4) errs.push(`#${index} opcions repetides: ${all.join(' | ')}`);
        else if (all.some(s => !s || BAD_TEXT.test(s)) || BAD_TEXT.test(q.text))
            errs.push(`#${index}: ${all.join(' | ')}`);
    }
    ok(
        `es fan servir tots els ${w.QuestionBank.size} generadors`,
        seenIdx.size === w.QuestionBank.size,
        `${seenIdx.size}/${w.QuestionBank.size}`
    );
    ok(
        'cada pregunta té 1 resposta + 3 distractors diferents i sense undefined/NaN',
        !errs.length,
        errs.length ? `${errs.length} casos. Primer: ${errs[0]}` : ''
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Càlculs independents (no fan servir el MathEngine del projecte)
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const median = a => {
    const s = [...a].sort((x, y) => x - y),
        n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
const uniqueMode = a => {
    const f = {};
    a.forEach(v => (f[v] = (f[v] || 0) + 1));
    const max = Math.max(...Object.values(f)),
        modes = Object.keys(f).filter(k => f[k] === max);
    return max > 1 && modes.length === 1 ? Number(modes[0]) : null;
};

suite('Paràmetres estadístics (estadística inversa)');
for (const nivell of [1, 2, 3]) {
    const w = loadModule(
        ['js/utils.js', 'js/estadistica-inversa/math-engine.js', 'js/estadistica-inversa/question-bank.js'],
        { search: `?nivell=${nivell}` }
    );
    const errs = [];
    for (let i = 0; i < 1500; i++) {
        if (i % 20 === 0) w.QuestionBank.resetSession();
        const ch = w.QuestionBank.generateChallenge();
        const sol = ch._exampleSol,
            c = ch.conditions;
        const range = (String(ch.prompt).match(/entre (\d+) i (\d+)/) || []).slice(1).map(Number);
        const why = [];
        if (!Array.isArray(sol) || sol.length !== ch.k) why.push(`mida ${sol && sol.length} ≠ ${ch.k}`);
        else {
            if (!sol.every(Number.isInteger)) why.push('no són enters');
            if (range.length === 2 && sol.some(v => v < range[0] || v > range[1])) why.push(`fora de [${range}]`);
            if (c.mean !== undefined && Math.abs(mean(sol) - c.mean) > 1e-9)
                why.push(`mitjana ${mean(sol)} ≠ ${c.mean}`);
            if (c.median !== undefined && Math.abs(median(sol) - c.median) > 1e-9)
                why.push(`mediana ${median(sol)} ≠ ${c.median}`);
            if (c.mode !== undefined && uniqueMode(sol) !== c.mode) why.push(`moda ${uniqueMode(sol)} ≠ ${c.mode}`);
        }
        if (why.length) errs.push(`${JSON.stringify(c)} amb ${JSON.stringify(sol)}: ${why.join(', ')}`);
    }
    ok(
        `nivell ${nivell}: la solució d'exemple compleix les condicions de l'enunciat`,
        !errs.length,
        errs.length ? `${errs.length} casos. Primer: ${errs[0]}` : ''
    );
}

suite('Mitjana aritmètica');
{
    const w = loadModule([
        'js/utils.js',
        'js/mitjana/math-engine.js',
        'js/mitjana/strings.js',
        'js/mitjana/question-bank.js',
    ]);
    const errs = [];
    for (let i = 0; i < N; i++) {
        const ch = w.QuestionBank.generateChallenge();
        const v = ch.values,
            p = ch.weights;
        const expected =
            ch.type === 'weighted' ? v.reduce((s, x, j) => s + x * p[j], 0) / p.reduce((s, x) => s + x, 0) : mean(v);
        if (
            !v.every(Number.isFinite) ||
            !Number.isFinite(ch.correctAnswer) ||
            Math.abs(expected - ch.correctAnswer) > 1e-9
        ) {
            errs.push(
                `${ch.type} ${JSON.stringify(v)}${p ? ' pesos ' + JSON.stringify(p) : ''}: ${ch.correctAnswer} ≠ ${expected}`
            );
        }
    }
    ok(
        'la resposta correcta és la mitjana (simple o ponderada) de les dades',
        !errs.length,
        errs.length ? `${errs.length} casos. Primer: ${errs[0]}` : ''
    );
}

suite('Estudi estadístic');
{
    const w = loadModule([
        'js/utils.js',
        'js/estadistica/math-engine.js',
        'js/estadistica/strings.js',
        'js/estadistica/question-bank.js',
    ]);
    for (const id of w.QuestionBank.allIds) {
        const errs = [];
        for (let i = 0; i < 300; i++) {
            const ds = w.QuestionBank.generators[id]();
            const d = ds.data;
            if (!Array.isArray(d) || d.length < 2 || !d.every(Number.isFinite)) {
                errs.push(`dades: ${JSON.stringify(d)}`);
                continue;
            }
            if (ds.type === 'discrete') {
                const t = w.MathEngine.discreteFreqTable(d);
                if (t.fi.reduce((a, b) => a + b, 0) !== d.length) errs.push('la taula de freqüències no suma n');
            } else {
                for (const opt of ds.intervalOptions || []) {
                    const L = opt.limits;
                    if (!L.every((x, j) => j === 0 || x > L[j - 1])) errs.push(`límits no creixents: ${L}`);
                    const t = w.MathEngine.groupedFreqTable(d, L);
                    const s = t.fi.reduce((a, b) => a + b, 0);
                    if (s !== d.length)
                        errs.push(
                            `${opt.label}: ${d.length - s} dades fora dels intervals [${L[0]}, ${L[L.length - 1]}]`
                        );
                }
            }
        }
        ok(
            `${id}: dades vàlides i totes dins la taula de freqüències`,
            !errs.length,
            errs.length ? `${errs.length} casos. Primer: ${errs[0]}` : ''
        );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Prioritat d'operacions. Els valors i l'ordre de les operacions es comproven
// aquí amb càlculs propis, independents del MathEngine de l'activitat:
//   - valorDe(): descens recursiu sobre el text de l'expressió («6² − 3 · (5 − 3) + 5»);
//   - esPotFer(): regla local per saber si una operació ja es pot fer (els dos
//     costats són nombres i cap operació veïna no li passa al davant).
const PREC_PO = { '+': 1, '-': 1, '·': 2, ':': 2 };
function valorDe(text) {
    const s = text.replace(/\s+/g, '').replace(/−/g, '-');
    const EXP = { '²': 2, '³': 3 };
    let i = 0;
    const factor = () => {
        let v;
        if (s[i] === '(') {
            i++;
            v = suma();
            if (s[i++] !== ')') throw new Error(`falta un ) a «${text}»`);
        } else {
            const m = /^\d+/.exec(s.slice(i));
            if (!m) throw new Error(`s'esperava un nombre a «${text}»`);
            i += m[0].length;
            v = Number(m[0]);
        }
        while (EXP[s[i]]) v = v ** EXP[s[i++]];
        return v;
    };
    const producte = () => {
        let v = factor();
        while (s[i] === '·' || s[i] === ':') v = s[i++] === '·' ? v * factor() : v / factor();
        return v;
    };
    const suma = () => {
        let v = producte();
        while (s[i] === '+' || s[i] === '-') v = s[i++] === '+' ? v + producte() : v - producte();
        return v;
    };
    const v = suma();
    if (i !== s.length) throw new Error(`text de més a «${text}»`);
    return v;
}
function esPotFer(line, i) {
    const t = line[i];
    if (t.k === 'pow') return true;
    if (t.k !== 'op') return false;
    const a = line[i - 1],
        b = line[i + 1],
        l = line[i - 2],
        r = line[i + 2];
    if (!a || !b || a.k !== 'num' || b.k !== 'num') return false;
    if (l && l.k === 'op' && PREC_PO[l.v] >= PREC_PO[t.v]) return false; // la de l'esquerra, si és del mateix nivell o més
    if (r && r.k === 'op' && PREC_PO[r.v] > PREC_PO[t.v]) return false; // la de la dreta, si és de més nivell
    return true;
}
// L'ordre «de llibre»: dins del parèntesis de més endins i més a l'esquerra (o a tota l'expressió),
// la primera potència; si no n'hi ha, la primera · o :; si no, la primera + o −
function ordreDeLlibre(line) {
    let a = 0,
        b = line.length - 1;
    const tanca = line.findIndex(t => t.k === 'rp');
    if (tanca >= 0) {
        b = tanca - 1;
        for (a = tanca; line[a].k !== 'lp'; a--);
        a++;
    }
    const dins = line.map((t, i) => i).filter(i => i >= a && i <= b);
    return (
        dins.find(i => line[i].k === 'pow') ??
        dins.find(i => line[i].k === 'op' && PREC_PO[line[i].v] === 2) ??
        dins.find(i => line[i].k === 'op')
    );
}
const operacionsDe = line => line.map((t, i) => i).filter(i => line[i].k === 'op' || line[i].k === 'pow');
// Generador pseudoaleatori propi (per triar camins a «Pas a pas» sense tocar el Math.random dels mòduls)
const lcg = seed => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;

suite("Prioritat d'operacions");
{
    const w = loadModule([
        'js/utils.js',
        'js/prioritat/math-engine.js',
        'js/prioritat/strings.js',
        'js/prioritat/renderer.js',
    ]);
    const E = w.MathEngine,
        S = w.Strings,
        Rd = w.Renderer;
    const rnd = lcg(7);
    const err = {
        val: [],
        opts: [],
        fb: [],
        diag: [],
        sol: [],
        order: [],
        cols: [],
        html: [],
        ready: [],
        block: [],
        walk: [],
        stepOpts: [],
        crash: [],
    };
    let n = 0,
        nBlock = 0;
    const motius = new Set();
    for (let nivell = 0; nivell < E.LEVELS.length; nivell++) {
        for (let k = 0; k < 200; k++) {
            n++;
            let txt = `nivell ${nivell}`;
            try {
                const ex = E.generateExercise(nivell);
                const toks = ex.toks;
                txt = S.toText(toks);

                // 1. El valor, recalculat; natural i com a molt MAX_RESULT
                const v = valorDe(txt);
                if (v !== ex.val || !Number.isInteger(v) || v < 0 || v > E.MAX_RESULT)
                    err.val.push(`${txt} = ${v}, no ${ex.val}`);

                // 2. Les opcions: la correcta i 3 distractors naturals, tots diferents
                const ds = E.buildDistractors(toks, ex.val);
                const vals = [ex.val, ...ds.map(d => d.v)];
                if (ds.length !== 3 || new Set(vals).size !== 4 || !vals.every(x => Number.isInteger(x) && x >= 0))
                    err.opts.push(`${txt}: ${vals.join(', ')}`);
                if (ex.nMis < 1) err.opts.push(`${txt}: cap error de prioritat no hi dona un resultat diferent`);

                // 3. El feedback de cada distractor, i les marques del diagnòstic (signes o potències de l'expressió)
                for (const d of ds) {
                    const diag = d.id === 'calc' ? null : E.diagnose(toks, d.id);
                    const fb = S.feedbackFor(d.id, toks, diag);
                    if (!fb || BAD_TEXT.test(fb)) err.fb.push(`${txt} (${d.id}, ${d.v}): «${fb}»`);
                    if (diag && [...diag.red, ...diag.green].some(i => !toks[i] || !['op', 'pow'].includes(toks[i].k)))
                        err.diag.push(`${txt} (${d.id}): ${[...diag.red]} / ${[...diag.green]}`);
                }

                // 4. La resolució «de llibre»: una operació per línia, el valor no canvia, l'ordre de llibre
                const rows = E.solve(E.startLine(toks));
                const nOps = operacionsDe(toks).length;
                const last = rows[rows.length - 1].line;
                if (rows.length !== nOps + 1 || !E.isDone(last) || last[0].v !== ex.val)
                    err.sol.push(`${txt}: ${rows.length} línies, acaba en ${S.toText(last)}`);
                rows.forEach((row, j) => {
                    const t = S.toText(row.line);
                    if (valorDe(t) !== ex.val) err.sol.push(`${txt}: la línia ${t} no val ${ex.val}`);
                    if (j < rows.length - 1 && (row.op !== ordreDeLlibre(row.line) || !esPotFer(row.line, row.op)))
                        err.order.push(`${t}: fa ${S.opText(row.line, row.op)}`);
                });

                // 5. «Centrat»: cada línia ocupa les columnes 0…N de l'enunciat, sense forats; el resultat ocupa
                //    les columnes del que substitueix (amb els parèntesis que cauen) i la resta no es mou
                for (let j = 0; j < rows.length; j++) {
                    const L = rows[j].line;
                    if (
                        L.some((t, i) => t.c0 !== (i ? L[i - 1].c1 : 0) || t.c1 <= t.c0) ||
                        L[L.length - 1].c1 !== toks.length
                    )
                        err.cols.push(`${txt}, línia ${j}: ${L.map(t => `${t.c0}-${t.c1}`).join(' ')}`);
                    if (j === rows.length - 1) break;
                    const [p, q] = E.opRange(L, rows[j].op);
                    const nou = rows[j + 1].line.find(t => t.c0 <= L[p].c0 && t.c1 >= L[q].c1);
                    const abans = L.filter(t => t.c1 <= L[p].c0 || t.c0 >= L[q].c1);
                    const despres = rows[j + 1].line.filter(t => t !== nou);
                    const igual = (x, y) => x.c0 === y.c0 && x.c1 === y.c1 && S.toText([x]) === S.toText([y]);
                    const tretes = abans.filter(t => !despres.some(u => igual(t, u)));
                    if (
                        !nou ||
                        nou.v !== E.opValue(L, rows[j].op) ||
                        despres.some(u => !abans.some(t => igual(t, u))) ||
                        !tretes.every(t => (t.k === 'lp' || t.k === 'rp') && t.c0 >= nou.c0 && t.c1 <= nou.c1)
                    )
                        err.cols.push(`${txt}: de ${S.toText(L)} a ${S.toText(rows[j + 1].line)}`);
                }

                // 6. La taula HTML: una fila per línia, totes de N columnes, «=» a totes menys l'última,
                //    i destacada (en blau) l'operació que es fa a la línia següent
                const html = Rd.tableHtml(rows);
                const trs = html.split('<tr').slice(1);
                const why = [];
                if (trs.length !== rows.length) why.push(`${trs.length} files`);
                trs.forEach((tr, j) => {
                    const cols = [...tr.matchAll(/<td([^>]*)>/g)]
                        .filter(m => !/igual/.test(m[1]))
                        .reduce((s, m) => s + Number((/colspan="(\d+)"/.exec(m[1]) || [0, 1])[1]), 0);
                    if (cols !== toks.length) why.push(`fila ${j}: ${cols} columnes`);
                    if (/class="igual"/.test(tr) !== j < rows.length - 1) why.push(`fila ${j}: «=»`);
                    const dest = (tr.match(/ dest"/g) || []).length;
                    const esperat = j === rows.length - 1 ? 0 : rows[j].line[rows[j].op].k === 'pow' ? 1 : 3;
                    if (dest !== esperat) why.push(`fila ${j}: ${dest} cel·les destacades`);
                });
                if (BAD_TEXT.test(html)) why.push('undefined/NaN');
                if (why.length) err.html.push(`${txt}: ${why.join(', ')}`);

                // 7. «Pas a pas»: un camí qualsevol (a cada línia, una operació que es pugui fer, a l'atzar)
                let line = E.startLine(toks),
                    passos = 0;
                while (!E.isDone(line) && passos < 20) {
                    const t = S.toText(line);
                    const ready = E.readyOps(line);
                    const esperat = operacionsDe(line).filter(i => esPotFer(line, i));
                    if (ready.join() !== esperat.join()) err.ready.push(`${t}: ${ready} ≠ ${esperat}`);
                    for (const i of operacionsDe(line)) {
                        const bl = E.blockers(line, i);
                        if (ready.includes(i)) {
                            if (bl) err.block.push(`${t}: ${i} es pot fer però blockers() no és null`);
                            continue;
                        }
                        nBlock++;
                        if (!bl || !bl.green.length || bl.green.some(g => !ready.includes(g))) {
                            err.block.push(`${t}: ${i} → ${JSON.stringify(bl)}`);
                            continue;
                        }
                        motius.add(bl.reason);
                        const g = bl.green.map(x => line[x]);
                        const dinsParentesi = x => {
                            // x és dins d'un parèntesi que no conté i
                            let obre = -1;
                            for (let y = 0; y < line.length; y++) {
                                if (line[y].k === 'lp') obre = y;
                                if (line[y].k === 'rp' && obre >= 0) {
                                    if (x > obre && x < y && !(i > obre && i < y)) return true;
                                    obre = -1;
                                }
                            }
                            return false;
                        };
                        const correcte = {
                            par: bl.green.some(dinsParentesi),
                            pow: g.some(x => x.k === 'pow'),
                            prio: PREC_PO[line[i].v] === 1 && g.some(x => x.k === 'op' && PREC_PO[x.v] === 2),
                            lr: bl.green.every(
                                x => x < i && line[x].k === 'op' && PREC_PO[line[x].v] === PREC_PO[line[i].v]
                            ),
                        }[bl.reason];
                        const msg = S.blockerMsg(bl, line);
                        if (!correcte || !msg || BAD_TEXT.test(msg))
                            err.block.push(`${t}: ${i} → ${bl.reason}: «${msg}»`);
                    }
                    const i = ready[Math.floor(rnd() * ready.length)];
                    const ok = E.opValue(line, i);
                    if (ok !== valorDe(S.opText(line, i))) err.walk.push(`${t}: ${S.opText(line, i)} = ${ok}?`);
                    const dd = E.stepDistractors(line, i);
                    if (
                        dd.length !== 3 ||
                        new Set([ok, ...dd]).size !== 4 ||
                        !dd.every(x => Number.isInteger(x) && x >= 0)
                    )
                        err.stepOpts.push(`${S.opText(line, i)} = ${ok}: ${dd.join(', ')}`);
                    line = E.applyAt(line, i);
                    if (valorDe(S.toText(line)) !== ex.val) err.walk.push(`${txt}: ${t} → ${S.toText(line)}`);
                    passos++;
                }
                if (!E.isDone(line) || line[0].v !== ex.val || passos !== nOps)
                    err.walk.push(`${txt}: ${passos} passos, acaba en ${S.toText(line)}`);

                // 8. La línia de treball: un botó per a cada signe i cada potència
                const act = Rd.tableHtml([{ line: E.startLine(toks), op: -1 }], { active: true });
                if ((act.match(/class="tok-btn/g) || []).length !== nOps)
                    err.html.push(`${txt}: botons de la línia de treball`);
            } catch (e) {
                err.crash.push(`${txt}: ${e.message}`); // una excepció també és un error
            }
        }
    }
    const first = a => (a.length ? `${a.length} casos. Primer: ${a[0]}` : '');
    ok('cap excepció en revisar les expressions', !err.crash.length, first(err.crash));
    ok(
        `${n} expressions (10 nivells): el valor és el correcte, natural i ≤ ${E.MAX_RESULT}`,
        !err.val.length,
        first(err.val)
    );
    ok(
        'la correcta i 3 distractors naturals i diferents, amb algun error de prioritat',
        !err.opts.length,
        first(err.opts)
    );
    ok('cada distractor té el seu missatge, sense undefined/NaN', !err.fb.length, first(err.fb));
    ok('el diagnòstic només marca signes i potències', !err.diag.length, first(err.diag));
    ok(
        'resolució: una operació per línia, sempre el mateix valor, acaba en el resultat',
        !err.sol.length,
        first(err.sol)
    );
    ok(
        "resolució: l'ordre de llibre (parèntesis, potències, · i :, + i −, d'esquerra a dreta)",
        !err.order.length,
        first(err.order)
    );
    ok('«centrat»: cada resultat ocupa les columnes del que substitueix', !err.cols.length, first(err.cols));
    ok('taula: N columnes per fila, «=», operació destacada i botons', !err.html.length, first(err.html));
    ok(
        '«Pas a pas»: es poden fer exactament les operacions amb dos nombres que cap veïna avança',
        !err.ready.length,
        first(err.ready)
    );
    ok(
        `«Pas a pas»: les ${nBlock} operacions que encara no es poden fer diuen quines van abans i per què`,
        !err.block.length && nBlock > 1000,
        first(err.block)
    );
    ok(
        `«Pas a pas»: surten tots els motius (${[...motius].sort().join(', ')})`,
        ['lr', 'par', 'pow', 'prio'].every(m => motius.has(m))
    );
    ok(
        '«Pas a pas»: qualsevol camí acaba en el resultat, amb tants passos com operacions',
        !err.walk.length,
        first(err.walk)
    );
    ok('«Pas a pas»: cada resultat té 3 distractors naturals i diferents', !err.stepOpts.length, first(err.stepOpts));

    // 9. Sessions fixes (?fixed=A/B/C): amb la mateixa llavor surten les mateixes preguntes i opcions que
    //    el dia que es va fer l'empremta. Si un canvi les modifica, les sessions fixes ja no seran les
    //    mateixes per a tothom: només s'ha d'actualitzar l'empremta si el canvi es vol de debò.
    const f = loadModule(['js/utils.js', 'js/prioritat/math-engine.js', 'js/prioritat/strings.js'], { seed: 2024 });
    let text = '';
    for (let nivell = 0; nivell < 10; nivell++) {
        for (let k = 0; k < 20; k++) {
            const ex = f.MathEngine.generateExercise(nivell);
            const opts = f.shuffle([ex.val, ...f.MathEngine.buildDistractors(ex.toks, ex.val).map(d => d.v)]);
            text += `${f.Strings.toText(ex.toks)} = ${ex.val} [${opts}]\n`;
        }
    }
    let h = 0x811c9dc5;
    for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 0x01000193) >>> 0;
    const empremta = h.toString(16).padStart(8, '0');
    ok(
        'les preguntes i les opcions no han canviat (sessions fixes)',
        empremta === '12e8978e',
        `empremta ${empremta}; les 3 primeres: ${text.split('\n').slice(0, 3).join(' · ')}`
    );
}

finish('TESTS DELS MÒDULS');
