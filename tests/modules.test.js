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
    // Nivell 3 (taula condicionada): quan un distractor coincideix per casualitat amb la
    // resposta correcta s'elimina i queden 3 (o 2) opcions. Pendent de decidir si s'hi
    // afegeix un distractor de reserva; mentrestant no s'exigeix que en tingui 4.
    checkMultipleChoice(`probabilitat nivell ${nivell}`, gen, {
        n: 1500,
        solutionKey: 'solutionTex',
        nOptions: nivell < 3 ? 4 : null,
    });
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

finish('TESTS DELS MÒDULS');
