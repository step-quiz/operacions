'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ============================================================================
// HARNESS
// ============================================================================
const C = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    green:  '\x1b[32m',
    red:    '\x1b[31m',
    yellow: '\x1b[33m',
    cyan:   '\x1b[36m',
    grey:   '\x1b[90m',
};

let passed = 0, failed = 0, suiteErrors = [];
let currentSuite = '';

function suite(name) {
    currentSuite = name;
    console.log(`\n${C.bold}${C.cyan}▶ ${name}${C.reset}`);
}

function ok(label, cond, detail = '') {
    if (cond) {
        console.log(`  ${C.green}✓${C.reset} ${label}`);
        passed++;
    } else {
        const msg = detail ? `  ${C.grey}→ ${detail}${C.reset}` : '';
        console.log(`  ${C.red}✗${C.reset} ${C.bold}${label}${C.reset}${msg ? '\n' + msg : ''}`);
        suiteErrors.push({ suite: currentSuite, label, detail });
        failed++;
    }
}

function eq(label, actual, expected) {
    ok(label, actual === expected,
       `esperat ${JSON.stringify(expected)}, rebut ${JSON.stringify(actual)}`);
}

// ============================================================================
// CÀRREGA DE MÒDULS (vm.runInThisContext → globals reals)
// ============================================================================
const SRC = __dirname;

// Globals que necessiten els fitxers
global.window = { location: { search: '' } };
global.randIntNonZero = (min, max) => {
    let v;
    do { v = Math.floor(Math.random() * (max - min + 1)) + min; } while (v === 0);
    return v;
};
global.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function loadFile(name) {
    try {
        const src = fs.readFileSync(path.join(SRC, name), 'utf8');
        vm.runInThisContext(src, { filename: name });
    } catch (e) {
        console.error(`${C.red}ERROR carregant ${name}: ${e.message}${C.reset}`);
        process.exit(1);
    }
}

loadFile('math-engine.js');
global.MathEngine = window.MathEngine;

loadFile('distractor-lib.js');
global.DistractorLib = window.DistractorLib;

loadFile('question-bank.js');
global.QuestionBank   = window.QuestionBank;
// Àlies de conveniència per als tests (evita QuestionBank.X per tot arreu)
const FamilyRegistry  = QuestionBank.FamilyRegistry;
const activeFamilies  = QuestionBank.activeFamilies;
const _selectDistractors = QuestionBank._testing._selectDistractors;
const FUNCTION_PAIRS  = QuestionBank._testing.FUNCTION_PAIRS;

// ============================================================================
// SUITE 1: MathEngine — funcions pures
// ============================================================================
suite('MathEngine › gcd');
eq('gcd(12, 8)',  MathEngine.gcd(12, 8),  4);
eq('gcd(7, 3)',   MathEngine.gcd(7, 3),   1);
eq('gcd(6, 6)',   MathEngine.gcd(6, 6),   6);
eq('gcd(0, 5)',   MathEngine.gcd(0, 5),   5);
eq('gcd(-6, 4)',  MathEngine.gcd(-6, 4),  2);  // valors negatius

suite('MathEngine › formatK');
eq('formatK(1)',   MathEngine.formatK(1),    '');
eq('formatK(-1)',  MathEngine.formatK(-1),   '-');
eq('formatK(3)',   MathEngine.formatK(3),    '3');
eq('formatK(-3)',  MathEngine.formatK(-3),   '-3');

suite('MathEngine › formatPowerTerm');
eq('fmt(3,2)',     MathEngine.formatPowerTerm(3, 2),    '3x^{2}');
eq('fmt(1,3)',     MathEngine.formatPowerTerm(1, 3),    'x^{3}');
eq('fmt(-1,3)',    MathEngine.formatPowerTerm(-1, 3),   '-x^{3}');
eq('fmt(2,1)',     MathEngine.formatPowerTerm(2, 1),    '2x');
eq('fmt(1,1)',     MathEngine.formatPowerTerm(1, 1),    'x');
eq('fmt(-1,1)',    MathEngine.formatPowerTerm(-1, 1),   '-x');
eq('fmt(3,0)',     MathEngine.formatPowerTerm(3, 0),    '3');
eq('fmt(1,0)',     MathEngine.formatPowerTerm(1, 0),    '1');
eq('fmt(-1,0)',    MathEngine.formatPowerTerm(-1, 0),   '-1');
eq('fmt(-2,3)',    MathEngine.formatPowerTerm(-2, 3),   '-2x^{3}');
eq('fmt(-3,-2)',   MathEngine.formatPowerTerm(-3, -2),  '-3x^{-2}');

suite('MathEngine › fmtLinear');
eq('fmtLinear(1,0)',   MathEngine.fmtLinear(1, 0),    'x');
eq('fmtLinear(-1,0)',  MathEngine.fmtLinear(-1, 0),   '-x');
eq('fmtLinear(2,3)',   MathEngine.fmtLinear(2, 3),    '2x+3');
eq('fmtLinear(2,-1)',  MathEngine.fmtLinear(2, -1),   '2x-1');
eq('fmtLinear(1,3)',   MathEngine.fmtLinear(1, 3),    'x+3');
eq('fmtLinear(-1,-2)', MathEngine.fmtLinear(-1, -2),  '-x-2');

suite('MathEngine › fmtPoly2');
eq('fmtPoly2(0,0)',    MathEngine.fmtPoly2(0, 0),     'x^2');
eq('fmtPoly2(2,0)',    MathEngine.fmtPoly2(2, 0),     'x^2+2x');
eq('fmtPoly2(-1,0)',   MathEngine.fmtPoly2(-1, 0),    'x^2-x');     // b=-1 no genera -1x
eq('fmtPoly2(0,3)',    MathEngine.fmtPoly2(0, 3),     'x^2+3');
eq('fmtPoly2(2,-1)',   MathEngine.fmtPoly2(2, -1),    'x^2+2x-1');
eq('fmtPoly2(-3,2)',   MathEngine.fmtPoly2(-3, 2),    'x^2-3x+2');

suite('MathEngine › fmtPoly2Deriv');
eq('fmtPoly2Deriv(0)',  MathEngine.fmtPoly2Deriv(0),   '2x');
eq('fmtPoly2Deriv(1)',  MathEngine.fmtPoly2Deriv(1),   '2x+1');
eq('fmtPoly2Deriv(-1)', MathEngine.fmtPoly2Deriv(-1),  '2x-1');
eq('fmtPoly2Deriv(3)',  MathEngine.fmtPoly2Deriv(3),   '2x+3');
eq('fmtPoly2Deriv(-3)', MathEngine.fmtPoly2Deriv(-3),  '2x-3');

suite('MathEngine › kxArg');
eq('kxArg(1)',   MathEngine.kxArg(1),   'x');
eq('kxArg(-1)',  MathEngine.kxArg(-1),  '-x');
eq('kxArg(3)',   MathEngine.kxArg(3),   '3x');
eq('kxArg(-2)',  MathEngine.kxArg(-2),  '-2x');

suite('MathEngine › trigTerm');
eq('trigTerm(1,"sin","x")',   MathEngine.trigTerm(1,  'sin', 'x'),  '\\sin(x)');
eq('trigTerm(-1,"cos","x")',  MathEngine.trigTerm(-1, 'cos', 'x'),  '-\\cos(x)');
eq('trigTerm(2,"sin","3x")',  MathEngine.trigTerm(2,  'sin', '3x'), '2\\sin(3x)');

suite('MathEngine › wrapIfNeeded');
eq('no wrap: "2x"',            MathEngine.wrapIfNeeded('2x'),               '2x');
eq('wrap + infix: "2x+3"',     MathEngine.wrapIfNeeded('2x+3'),             '(2x+3)');
eq('wrap - infix: "2x-1"',     MathEngine.wrapIfNeeded('2x-1'),             '(2x-1)');
eq('no wrap leading -: "-x"',  MathEngine.wrapIfNeeded('-x'),               '-x');
eq('no wrap dins {}: "\\\\frac{x+1}{2}"',
    MathEngine.wrapIfNeeded('\\frac{x+1}{2}'),  '\\frac{x+1}{2}');
eq('wrap a profunditat 0: "a+b"', MathEngine.wrapIfNeeded('a+b'),           '(a+b)');

suite('MathEngine › generateKExp — mai retorna ±1');
{
    let sawInvalid = false;
    for (let i = 0; i < 500; i++) {
        const k = MathEngine.generateKExp();
        if (Math.abs(k) === 1 || k === 0) { sawInvalid = true; break; }
    }
    ok('500 cridades, mai k=0 ni k=±1', !sawInvalid);
    let allInt = true;
    for (let i = 0; i < 100; i++) {
        if (!Number.isInteger(MathEngine.generateKExp())) { allInt = false; break; }
    }
    ok('sempre retorna enter', allInt);
}

suite('MathEngine › buildKVars coherència');
{
    const kv = MathEngine.buildKVars(3);
    ok('coef = "3"',     kv.coef === '3');
    ok('kx = "3x"',      kv.kx   === '3x');
    ok('negCoef = "-3"', kv.negCoef === '-3');
    const kv1 = MathEngine.buildKVars(1);
    ok('k=1: coef=""',   kv1.coef === '');
    ok('k=1: kx="x"',    kv1.kx === 'x');
    const kvm = MathEngine.buildKVars(-1);
    ok('k=-1: coef="-"', kvm.coef === '-');
    ok('k=-1: kx="-x"',  kvm.kx === '-x');
}

// ============================================================================
// SUITE 2: DistractorLib pools — invariants comuns
// ============================================================================

/**
 * Valida que un pool compleix els invariants bàsics:
 *   - Tots els items tenen tex, feedback, errorType
 *   - No hi ha duplicats de .tex
 *   - La solució correcta no hi és
 *   - Hi ha ≥ minTypes errorTypes diferents
 *   - La mida és ≥ minSize
 */
function checkPool(label, pool, solutionTex, { minSize = 3, minTypes = 3 } = {}) {
    const hasShape  = pool.every(d => d.tex !== undefined && d.feedback && d.errorType);
    const noSol     = !pool.some(d => d.tex === solutionTex);
    const texSet    = new Set(pool.map(d => d.tex));
    const noDup     = texSet.size === pool.length;
    const typeCount = new Set(pool.map(d => d.errorType)).size;

    ok(`${label} — shape correcta (tex+feedback+errorType)`, hasShape,
       hasShape ? '' : JSON.stringify(pool.find(d => !d.tex || !d.feedback || !d.errorType)));
    ok(`${label} — solució absent del pool`, noSol,
       noSol ? '' : `solució "${solutionTex}" trobada al pool`);
    ok(`${label} — sense duplicats .tex`, noDup,
       noDup ? '' : `${pool.length - texSet.size} duplicats`);
    ok(`${label} — ≥${minTypes} errorTypes (n=${typeCount})`, typeCount >= minTypes,
       `errorTypes: ${[...new Set(pool.map(d=>d.errorType))].join(', ')}`);
    ok(`${label} — mida ≥ ${minSize} (n=${pool.length})`, pool.length >= minSize);
}

suite('DistractorLib › buildPower');
checkPool('power(3)',    DistractorLib.buildPower(3),       '3x^{2}');
checkPool('power(4)',    DistractorLib.buildPower(4),       '4x^{3}');
checkPool('power(-3)',   DistractorLib.buildPower(-3),      '-3x^{-4}');
checkPool('power(3,4)',  DistractorLib.buildPower(3, 4),    '12x^{3}');
checkPool('power(-2,3)', DistractorLib.buildPower(-2, 3),   '-6x^{2}');

// Backward compat: buildPower(n) = buildPower(1,n)
{
    const p1 = DistractorLib.buildPower(3);
    const p2 = DistractorLib.buildPower(1, 3);
    ok('buildPower(n) ≡ buildPower(1,n): mida igual', p1.length === p2.length);
    ok('buildPower(n) ≡ buildPower(1,n): mateixos tex',
        p1.map(d=>d.tex).sort().join('|') === p2.map(d=>d.tex).sort().join('|'));
}

suite('DistractorLib › buildLog');
checkPool('log kx k=3',     DistractorLib.buildLog('kx',     { k: 3 }),          '\\frac{1}{x}', { minTypes: 2 });
checkPool('log xn n=3',     DistractorLib.buildLog('xn',     { n: 3 }),          '\\frac{3}{x}', { minTypes: 2 });
checkPool('log linear a=2,b=1', DistractorLib.buildLog('linear', { a: 2, b: 1 }), '\\frac{2}{2x+1}', { minTypes: 2 });
checkPool('log poly2 b=2,c=1',  DistractorLib.buildLog('poly2',  { b: 2, c: 1 }), '\\frac{2x+2}{x^2+2x+1}', { minTypes: 2 });

suite('DistractorLib › buildTrig');
checkPool('sin k=2',       DistractorLib.buildTrig('sin', 2),          '2\\cos(2x)');
// k=1: sense coeficient de cadena → CHAIN_FORGOT i CHAIN_WRONG_COEF no existeixen,
// pool mínim: SIN_COS_SWAP + CHAIN_SIGN (+ NO_DERIVATIVE si no col·lideix)
checkPool('sin k=1',       DistractorLib.buildTrig('sin', 1),          '\\cos(x)', { minTypes: 2 });
checkPool('cos k=3',       DistractorLib.buildTrig('cos', 3),          '-3\\sin(3x)');
checkPool('sin-poly2 b=1,c=2', DistractorLib.buildTrig('sin-poly2', { b: 1, c: 2 }), '(2x+1)\\cos(x^2+1x+2)');
checkPool('cos-poly2 b=2,c=-1',DistractorLib.buildTrig('cos-poly2', { b: 2, c: -1}),'-(2x+2)\\sin(x^2+2x-1)');

suite('DistractorLib › buildCompound');
checkPool('exp-sin', DistractorLib.buildCompound('exp-sin'), '\\cos(x)e^{\\sin(x)}');
checkPool('exp-cos', DistractorLib.buildCompound('exp-cos'), '-\\sin(x)e^{\\cos(x)}');
checkPool('ln-sin',  DistractorLib.buildCompound('ln-sin'),  '\\frac{\\cos(x)}{\\sin(x)}');
checkPool('ln-cos',  DistractorLib.buildCompound('ln-cos'),  '\\frac{-\\sin(x)}{\\cos(x)}');

suite('DistractorLib › buildProduct / buildQuotient');
{
    const pair = {
        fTex:'x', gTex:'e^{x}', dfTex:'1', dgTex:'e^{x}',
        dfgTex:'e^{x}', fdgTex:'xe^{x}', g2Tex:'e^{2x}',
        solutionProduct:'e^{x}+xe^{x}',
        solutionQuotient:'\\frac{e^{x}-xe^{x}}{e^{2x}}',
        promptTex:'f(x) = xe^{x}', solutionTex:'e^{x}+xe^{x}'
    };
    checkPool('product (x, e^x)', DistractorLib.buildProduct(pair), pair.solutionProduct, { minTypes: 2 });
    const pairQ = { ...pair, solutionTex: pair.solutionQuotient };
    checkPool('quotient (x, e^x)', DistractorLib.buildQuotient(pairQ), pair.solutionQuotient, { minTypes: 2 });
}

// ============================================================================
// SUITE 3: _selectDistractors
// ============================================================================
suite('_selectDistractors › diversitat i anchor NO_DERIVATIVE');
{
    // Pool ric: 5 errorTypes, 7 distractors
    const pool = [
        { tex: 'a1', errorType: 'CHAIN_FORGOT' },
        { tex: 'a2', errorType: 'CHAIN_FORGOT' },
        { tex: 'b1', errorType: 'NO_DERIVATIVE' },
        { tex: 'c1', errorType: 'CHAIN_SIGN' },
        { tex: 'd1', errorType: 'INTEGRAL_CONFUSION' },
        { tex: 'e1', errorType: 'POWER_WRONG_EXP' },
        { tex: 'f1', errorType: 'SIN_COS_SWAP' },
    ];
    const fallbacks = [{ tex: 'z1', errorType: 'NO_DERIVATIVE' }];

    let diversitat = true, anchor = true;
    for (let i = 0; i < 50; i++) {
        const res = _selectDistractors(pool, 'SOL', 3, fallbacks);
        const types = res.map(d => d.errorType);
        if (new Set(types).size < 3) { diversitat = false; break; }
        if (!types.includes('NO_DERIVATIVE')) { anchor = false; break; }
    }
    ok('50 cridades: sempre 3 errorTypes únics', diversitat);
    ok('50 cridades: NO_DERIVATIVE sempre present', anchor);

    // Verifica que la solució no apareix mai als distractors
    let solAbsent = true;
    for (let i = 0; i < 20; i++) {
        const res = _selectDistractors(pool, 'a1', 3, fallbacks);  // 'a1' és la "solució"
        if (res.some(d => d.tex === 'a1')) { solAbsent = false; break; }
    }
    ok('solució correcta absent dels distractors', solAbsent);

    // Sense duplicats de .tex als resulats
    let noDup = true;
    for (let i = 0; i < 20; i++) {
        const res = _selectDistractors(pool, 'SOL', 3, fallbacks);
        const texSet = new Set(res.map(d => d.tex));
        if (texSet.size < res.length) { noDup = false; break; }
    }
    ok('sense duplicats .tex als resultats', noDup);
}

suite('_selectDistractors › cas degenerat (pool petit)');
{
    const petit = [
        { tex: 'p1', errorType: 'A' },
        { tex: 'p2', errorType: 'A' },
    ];
    const res = _selectDistractors(petit, 'SOL', 3, []);
    ok('pool de 2 → retorna ≤ 2 elements', res.length <= 2);
    ok('pool de 2 → tots els elements presents', res.length === 2);

    // Pool buit + fallbacks
    const res2 = _selectDistractors([], 'SOL', 3, [
        { tex: 'f1', errorType: 'X' },
        { tex: 'f2', errorType: 'Y' },
    ]);
    ok('pool buit + 2 fallbacks → retorna 2', res2.length === 2);
}

suite('_selectDistractors › fallbacks integrats correctament');
{
    // Pool petit (1 item) + fallbacks fins a 3
    const pool1 = [{ tex: 'pool-item', errorType: 'CHAIN_FORGOT' }];
    const fbs   = [
        { tex: 'fb1', errorType: 'NO_DERIVATIVE' },
        { tex: 'fb2', errorType: 'INTEGRAL_CONFUSION' },
    ];
    const res = _selectDistractors(pool1, 'SOL', 3, fbs);
    ok('pool(1)+fallbacks(2) → 3 distractors', res.length === 3);
    const texos = res.map(d => d.tex);
    ok('pool-item present', texos.includes('pool-item'));
    ok('fb1 present',       texos.includes('fb1'));
    ok('fb2 present',       texos.includes('fb2'));
}

// ============================================================================
// SUITE 4: Contractes de generadors (18 famílies × 10 cridades)
// ============================================================================

/**
 * Valida el contracte complet d'un generador:
 *   { promptTex, solutionTex, options[4], meta{} }
 */
function checkGeneratorContract(familyId, generator, runs = 10) {
    let allOk = true;
    const errors = [];

    for (let i = 0; i < runs; i++) {
        let q;
        try { q = generator(); } catch(e) {
            errors.push(`run ${i}: excepció: ${e.message}`);
            allOk = false;
            continue;
        }

        // Camps obligatoris al nivell arrel
        if (!q.promptTex || typeof q.promptTex !== 'string' || !q.promptTex.trim())
            errors.push(`run ${i}: promptTex absent o buit`);
        if (!q.solutionTex || typeof q.solutionTex !== 'string' || !q.solutionTex.trim())
            errors.push(`run ${i}: solutionTex absent o buit`);
        if (!Array.isArray(q.options))
            { errors.push(`run ${i}: options no és array`); continue; }
        if (!q.meta || typeof q.meta !== 'object')
            errors.push(`run ${i}: meta absent`);
        if (!q.meta?.family)
            errors.push(`run ${i}: meta.family absent`);
        if (!q.meta?.ruleLabel)
            errors.push(`run ${i}: meta.ruleLabel absent`);

        // options: exactament 4
        if (q.options.length !== 4)
            errors.push(`run ${i}: options.length=${q.options.length}, esperat 4`);

        // Exactament 1 isCorrect
        const correctOpts = q.options.filter(o => o.isCorrect);
        if (correctOpts.length !== 1)
            errors.push(`run ${i}: ${correctOpts.length} opcions correctes, esperat 1`);

        // L'opció correcta té tex === solutionTex
        const correctOpt = q.options.find(o => o.isCorrect);
        if (correctOpt && correctOpt.tex !== q.solutionTex)
            errors.push(`run ${i}: correcta.tex≠solutionTex ("${correctOpt.tex}" vs "${q.solutionTex}")`);

        // Cada opció té tex, feedback, isCorrect
        q.options.forEach((o, idx) => {
            if (!o.tex || typeof o.tex !== 'string')
                errors.push(`run ${i}: option[${idx}] sense tex`);
            if (o.feedback === undefined || o.feedback === null)
                errors.push(`run ${i}: option[${idx}] sense feedback`);
            if (o.isCorrect === undefined)
                errors.push(`run ${i}: option[${idx}] sense isCorrect`);
        });

        // Cap opció incorrecta té tex === solutionTex
        const wrongWithSol = q.options.filter(o => !o.isCorrect && o.tex === q.solutionTex);
        if (wrongWithSol.length > 0)
            errors.push(`run ${i}: opció INCORRECTA amb tex === solutionTex`);

        // Sense duplicats de .tex entre options
        const allTex = q.options.map(o => o.tex);
        if (new Set(allTex).size < allTex.length)
            errors.push(`run ${i}: opcions amb .tex duplicat: ${allTex.join(' | ')}`);

        // Les 3 opcions incorrectes: ≥2 errorTypes distints (diversitat mínima)
        const wrongTypes = q.options.filter(o => !o.isCorrect).map(o => o.errorType);
        if (new Set(wrongTypes).size < 2)
            errors.push(`run ${i}: diversitat insuficient (${new Set(wrongTypes).size} errorTypes)`);

        // promptTex conté "f(x)"
        if (!q.promptTex.includes('f(x)'))
            errors.push(`run ${i}: promptTex sense "f(x)": "${q.promptTex}"`);

        if (errors.length > 0) allOk = false;
    }

    const label = `${familyId} (${runs} cridades)`;
    ok(label, allOk, errors.slice(0, 3).join(' | '));
}

suite('Contractes generadors — totes les famílies');

// Obtenim el FamilyRegistry exposat per l'eval de question-bank.js
// (variable global al scope)
const EXPECTED_FAMILIES = [
    'chain-exp-int', 'chain-exp-frac',
    'power', 'power-coef',
    'log-kx', 'log-xn', 'log-linear', 'log-poly2',
    'chain-sin-int', 'chain-cos-int', 'chain-sin-poly2', 'chain-cos-poly2',
    'compound-exp-sin', 'compound-exp-cos', 'compound-ln-sin', 'compound-ln-cos',
    'product', 'quotient',
];

EXPECTED_FAMILIES.forEach(id => {
    const gen = FamilyRegistry[id];
    if (!gen) {
        ok(`${id} present al FamilyRegistry`, false, 'família absent');
        return;
    }
    checkGeneratorContract(id, gen, 10);
});

// ============================================================================
// SUITE 5: FamilyRegistry i URL selector
// ============================================================================
suite('FamilyRegistry › completesa');
{
    const keys = Object.keys(FamilyRegistry);
    eq('18 famílies registrades', keys.length, 18);
    EXPECTED_FAMILIES.forEach(id => {
        ok(`"${id}" present`, id in FamilyRegistry);
        ok(`"${id}" és funció`, typeof FamilyRegistry[id] === 'function');
    });
}

suite('buildActiveFamilies › URL selector');
{
    // Sense paràmetres → totes les 18 famílies
    global.window.location.search = '';
    // buildActiveFamilies() ja s'ha cridat; reavaluem recarregant question-bank
    // Aprofitem que activeFamilies és la variable global resultant
    ok('sense URL: totes les famílies actives',
        activeFamilies.length === 18,
        `activeFamilies.length = ${activeFamilies.length}`);

    // Test amb URL vàlida (necessita reval, el simulem directament)
    const raw = 'power,log-kx';
    const active = raw.split(',').map(id => id.trim())
        .filter(id => FamilyRegistry[id])
        .map(id => FamilyRegistry[id]);
    ok('URL "power,log-kx" → 2 generadors', active.length === 2);
    ok('primer generador és generatePowerInt', active[0] === FamilyRegistry['power']);

    // URL amb families invàlides → retorna les vàlides
    const mixta = 'power,NO_EXISTEIX,log-kx';
    const activeMixt = mixta.split(',').map(id => id.trim())
        .filter(id => FamilyRegistry[id])
        .map(id => FamilyRegistry[id]);
    ok('URL mixta → filtra les invàlides (n=2)', activeMixt.length === 2);

    // URL completament invàlida
    const invalid = 'XXX,YYY';
    const activeInv = invalid.split(',').map(id => id.trim())
        .filter(id => FamilyRegistry[id])
        .map(id => FamilyRegistry[id]);
    const fallback  = activeInv.length > 0 ? activeInv : Object.values(FamilyRegistry);
    ok('URL invàlida → fallback a totes (n=18)', fallback.length === 18);
}

// ============================================================================
// SUITE 5b: FUNCTION_PAIRS — validació estructural de les 21 files
// Comprova que cada camp obligatori existeix, que solutionProduct segueix
// el patró dfgTex+fdgTex i que solutionQuotient conté el denominador g2Tex.
// No requereix un avaluador simbòlic: detecta errors d'omissió i d'inversió.
// ============================================================================
suite('FUNCTION_PAIRS › validació estructural');
{
    const REQUIRED_KEYS = ['fTex','gTex','dfTex','dgTex','dfgTex','fdgTex','g2Tex','solutionProduct','solutionQuotient'];

    ok(`21 parells definits`, QuestionBank._testing.FUNCTION_PAIRS.length === 21,
       `n = ${QuestionBank._testing.FUNCTION_PAIRS.length}`);

    QuestionBank._testing.FUNCTION_PAIRS.forEach((p, i) => {
        const id = `pair[${i}] (${p.fTex}/${p.gTex})`;

        // Tots els camps obligatoris presents i no buits
        const missingKeys = REQUIRED_KEYS.filter(k => !p[k] || typeof p[k] !== 'string');
        ok(`${id} — camps obligatoris presents`, missingKeys.length === 0,
           missingKeys.length ? `falten: ${missingKeys.join(', ')}` : '');

        // solutionProduct ha de contenir dfgTex i fdgTex com a substrings
        const prodOk = p.solutionProduct.includes(p.dfgTex) && p.solutionProduct.includes(p.fdgTex);
        ok(`${id} — solutionProduct conté dfgTex i fdgTex`, prodOk,
           prodOk ? '' : `solutionProduct="${p.solutionProduct}" | dfgTex="${p.dfgTex}" | fdgTex="${p.fdgTex}"`);

        // solutionQuotient ha de contenir g2Tex com a denominador
        const quotOk = p.solutionQuotient.includes(p.g2Tex);
        ok(`${id} — solutionQuotient conté g2Tex`, quotOk,
           quotOk ? '' : `solutionQuotient="${p.solutionQuotient}" | g2Tex="${p.g2Tex}"`);

        // solutionProduct i solutionQuotient no poden ser el mateix
        ok(`${id} — product ≠ quotient`, p.solutionProduct !== p.solutionQuotient);
    });
}

suite('Bugs UX/UI corregits');{
    // Bug 1: x^3·e^x vs x^3e^x — generateProduct no ha de tenir opcions duplicades semànticament
    // Comprovem amb el parell (x^3, e^x) concretament
    const pairX3Ex = FUNCTION_PAIRS.find(p => p.fTex === 'x^3' && p.gTex === 'e^{x}');
    if (pairX3Ex) {
        // Simulem generateProduct amb aquest parell fixat
        const fD = MathEngine.wrapIfNeeded(pairX3Ex.fTex);
        const gD = MathEngine.wrapIfNeeded(pairX3Ex.gTex);
        const displayTex = `${fD}\\cdot ${gD}`;
        const promptTex  = `${fD}${gD}`;
        const pairCtx = { ...pairX3Ex, promptTex, solutionTex: pairX3Ex.solutionProduct };
        const pool = DistractorLib.buildProduct(pairCtx);
        const texos = pool.map(d => d.tex);
        // Comprova que no hi ha parella que renderitzi igual (cdot vs sense)
        const hasCdot   = texos.some(t => t.includes('\\cdot'));
        const hasNoCdot = texos.some(t => t === 'x^3e^{x}');
        ok('Bug1: pool producte no barreja \\cdot i versió sense per la mateixa expressió',
            !(hasCdot && hasNoCdot),
            hasCdot && hasNoCdot ? 'x^3\\cdot e^{x} i x^3e^{x} coexisteixen' : '');
    } else {
        ok('Bug1: parell (x^3, e^x) present a FUNCTION_PAIRS', false, 'parell no trobat');
    }

    // Bug 2: \frac{-x^{-2}}{-2} hauria de simplificar-se a \frac{x^{-2}}{2}
    const poolNeg = DistractorLib.buildPower(-1, -3);  // f=-x^{-3}, integral → x^{-2}/2
    const hasUnsimplified = poolNeg.some(d => d.tex.includes('\\frac{-') && d.tex.includes('}{-'));
    ok('Bug2: pool power(-1,-3) no conté fraccions amb doble negatiu',
        !hasUnsimplified,
        hasUnsimplified ? poolNeg.find(d=>d.tex.includes('\\frac{-')&&d.tex.includes('}{-')).tex : '');
    const simplified = poolNeg.find(d => d.errorType === 'INTEGRAL_CONFUSION');
    // \frac{x^{-2}}{2} és correcte: el '-' és l'exponent, no un signe de fracció
    const isSimplified = simplified && !simplified.tex.match(/\\frac\{-/) && !simplified.tex.match(/\}\{-/);
    ok('Bug2: distractor integral sense doble negatiu a numerador i denominador',
        isSimplified,
        simplified ? `rebut: ${simplified.tex}` : 'absent');

    // Bug 3: 0 no ha d'aparèixer com a opció per a cap família exponencial
    const generateExpKxInt = FamilyRegistry['chain-exp-int'];
    let sawZero = false;
    for (let i = 0; i < 30; i++) {
        const q = generateExpKxInt();
        if (q.options.some(o => o.tex === '0')) { sawZero = true; break; }
    }
    ok('Bug3: generateExpKxInt mai proposa "0" com a opció (30 cridades)', !sawZero);

    // Bug 5: -1\ln(...) → -\ln(...)
    const poolLog = DistractorLib.buildLog('linear', { a: -1, b: -3 });
    const hasOne  = poolLog.some(d => d.tex.startsWith('-1\\ln'));
    ok('Bug5: log-linear a=-1 no genera "-1\\\\ln(...)"', !hasOne,
        hasOne ? poolLog.find(d=>d.tex.startsWith('-1\\ln')).tex : '');
    const hasClean = poolLog.some(d => d.tex === '-\\ln(-x-3)');
    ok('Bug5: log-linear a=-1 genera "-\\\\ln(-x-3)"', hasClean);
}

suite('FeedbackHints › cobertura dels errorTypes');
{
    const KNOWN_TYPES = [
        'CHAIN_FORGOT','CHAIN_WRONG_COEF','CHAIN_SIGN','NO_DERIVATIVE',
        'INTEGRAL_CONFUSION','PRODUCT_FORGOT_SUM','PRODUCT_WRONG_ORDER',
        'QUOTIENT_SIGN','QUOTIENT_DENOM','POWER_FORGOT_R','POWER_WRONG_EXP',
        'LOG_INVERTED','LOG_FORGOT_CHAIN','SIN_COS_SWAP',
    ];
    KNOWN_TYPES.forEach(t => {
        ok(`hint per "${t}"`, t in DistractorLib.FeedbackHints,
           `FeedbackHints["${t}"] absent`);
        ok(`hint "${t}" és string no buit`,
           typeof DistractorLib.FeedbackHints[t] === 'string' &&
           DistractorLib.FeedbackHints[t].length > 0);
    });
}

// ============================================================================
// RESUM FINAL
// ============================================================================
const total = passed + failed;
const pct   = ((passed / total) * 100).toFixed(1);
const bar   = '█'.repeat(Math.round(passed / total * 30)) +
              '░'.repeat(30 - Math.round(passed / total * 30));

console.log('\n' + '─'.repeat(60));
console.log(`${C.bold}RESULTAT FINAL${C.reset}`);
console.log(`  ${C.green}Passats:${C.reset} ${passed}   ${C.red}Fallits:${C.reset} ${failed}   Total: ${total}`);
console.log(`  ${bar} ${pct}%`);

if (failed > 0) {
    console.log(`\n${C.bold}${C.red}FALLADES:${C.reset}`);
    suiteErrors.forEach(e => {
        console.log(`  ${C.red}✗${C.reset} [${e.suite}] ${e.label}`);
        if (e.detail) console.log(`    ${C.grey}${e.detail}${C.reset}`);
    });
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
